/* ---------- interfaz de campaña ----------
   Sistema INTERFAZ (ver docs/interfaz.md). Partes:
   1. estado y preferencias (IFZ, localStorage «ocaso-ifz»)
   2. ui(): barra superior, pestañas, panel, potencias y tutorial (solo se toca el DOM que cambia)
   3. panel de provincia (cabecera, tropas, secciones plegables) y crónica
   4. iconos pixel de la interfaz (IFZ_SP) y cifras pixel del mapa
   5. dibujo del mapa (capa cacheada, guarniciones, campaña, minimapa)
   6. zoom y desplazamiento
   7. modales (cola, foco, Escape)
   8. acciones, teclado y hover
   9. ayuda y tutorial
   10. sprites reemplazables por PNG (assets/sprites/manifest.json o manifest.js)
   Lo marcado CAM es la interfaz de campaña (ejércitos en el mapa): sus funciones viven en campana.js
   y ejercitos.js; aquí solo se llaman y se dibujan. */

/* ======================= 1. estado y preferencias ======================= */
const IFZ = {
  pref: { sec: { reclutar: true, edificios: true }, pot: true, potTodas: false, log: "todo", tut: 0 },
  html: {}, // último HTML escrito en cada contenedor (para no reconstruir lo que no cambia)
  res: false, // desplegable de recursos abierto
  anios: {}, // años plegados/abiertos en la crónica
  baseVer: 0, // cambia cuando se redibuja el terreno (drawBase)
  med: { n: 0, ms: 0, max: 0, ult: 0, escrituras: 0 }, // medidas de ui()
  ayuda: false,
};
(() => {
  try {
    const s = JSON.parse(localStorage.getItem("ocaso-ifz") || "null");
    if (s && typeof s === "object") IFZ.pref = { ...IFZ.pref, ...s, sec: { ...IFZ.pref.sec, ...(s.sec || {}) } };
  } catch (_) {}
})();
function ifzGuardar() {
  try {
    localStorage.setItem("ocaso-ifz", JSON.stringify(IFZ.pref));
  } catch (_) {}
}
/* escribe html en #id solo si ha cambiado; devuelve true si lo escribió */
function ifzPon(id, html) {
  const el = $(id);
  if (!el) return false;
  if (IFZ.html[id] === html && el.isConnected && (html === "" || el.firstChild)) return false;
  IFZ.html[id] = html;
  el.innerHTML = html;
  IFZ.med.escrituras++;
  return true;
}
const ifzSig = (v) => (v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "±0");
const ifzSPU = () => (typeof SPU === "number" ? SPU : 10);

/* ======================= 2. ui() ======================= */
function ui() {
  if (!G) return;
  const t0 = performance.now();
  const dis = busy || !!G.over || !myTurn();
  ifzBarra();
  const on = net.on ? ifzTurnoOnline() : null,
    tt = on ? on.info : "Un jugador · tecla E: terminar";
  if ($("tinfo").textContent !== tt) $("tinfo").textContent = tt;
  const eb = $("endb"),
    et = busy ? "Las potencias mueven…" : on ? on.boton : G.over ? "Partida terminada" : ifzTextoFin();
  eb.disabled = dis;
  if (eb.textContent !== et) eb.textContent = et;
  eb.setAttribute("aria-busy", busy ? "true" : "false");
  ifzPestanas(dis);
  ifzPotencias();
  ifzTutorial();
  const ms = performance.now() - t0;
  IFZ.med.n++;
  IFZ.med.ms += ms;
  IFZ.med.ult = ms;
  if (ms > IFZ.med.max) IFZ.med.max = ms;
}
/* Texto de turno en partida online. Punto limpio para el sistema Online: si existe la función global
   onlTextoTurno() → {info, boton} (o una cadena = info), ui() la usa para #tinfo y el botón de fin.
   Si no, con estaciones simultáneas (ONL.meta.listos) se muestra «Online · listos 2/3» y «Listo ▶». */
function ifzTurnoOnline() {
  let r = null;
  try {
    if (typeof onlTextoTurno === "function") r = onlTextoTurno();
  } catch (e) {
    console.error("[ifz] onlTextoTurno", e);
  }
  if (typeof r === "string") r = { info: r };
  r = r || {};
  if (!r.info || !r.boton) {
    let info, boton;
    const d = typeof ONL !== "undefined" && ONL && ONL.meta;
    if (d && d.listos && typeof onlActivos === "function") {
      const act = onlActivos(d),
        n = act.filter((g) => d.listos[g] === d.turno).length;
      info = `Online · listos ${n}/${act.length}`;
      boton = myTurn() ? "Listo ▶" : "Esperando a los demás…";
    } else {
      info =
        net.cur === ME
          ? "Online · es tu turno"
          : `Online · turno de ${CIV[net.cur]?.s || "—"}${net.names[net.seats[net.cur]] ? " (" + esc(net.names[net.seats[net.cur]]) + ")" : ""}`;
      boton = myTurn() ? "Terminar mi turno ▶" : "Esperando al rival…";
    }
    r = { info: r.info || info, boton: r.boton || boton };
  }
  return r;
}
/* «Fin de la primavera ▶» / «Fin del año ▶»: el turno es una estación (campaña) */
function ifzTextoFin() {
  try {
    if (typeof camTextoFin === "function") return camTextoFin();
  } catch (e) {
    console.error("[ifz] camTextoFin", e);
  }
  const n = ["la primavera", "l verano", "l otoño", "l invierno"][G.estacion];
  return n ? `Fin de${n} ▶` : "Fin del año ▶";
}
/* ---------- barra superior: fecha, oro, comida y recursos ---------- */
function ifzRecursos() {
  let rs = null;
  try {
    if (typeof ecoResumen === "function") rs = ecoResumen(ME);
  } catch (e) {
    console.error("[ifz] ecoResumen", e);
  }
  if (!rs || !rs.length) {
    const F = G.F[ME],
      e = inc(ME);
    rs = [
      { id: "oro", nombre: "Oro", icono: "◉", saldo: F.gold, anual: e.g },
      { id: "comida", nombre: "Comida", icono: "❦", saldo: F.food, anual: e.net },
    ];
  }
  return rs;
}
function ifzBarra() {
  const rs = ifzRecursos(),
    oro = rs.find((r) => r.id === "oro"),
    com = rs.find((r) => r.id === "comida"),
    otros = rs.filter((r) => r !== oro && r !== com),
    vis = otros.filter((r) => r.saldo > 0 || r.anual).sort((a, b) => b.saldo - a.saldo),
    est = typeof CAM_EST !== "undefined" && G.estacion != null ? CAM_EST[G.estacion] : "",
    cifra = (r, cls) =>
      r
        ? `<span class="ifz-r ${cls}" title="${r.nombre}: ${r.saldo} · ${ifzSig(r.anual)} al año"><i aria-hidden="true">${r.icono}</i><span class="ifz-vh">${r.nombre}</span><b>${r.saldo}</b><small class="${r.anual < 0 ? "neg" : r.anual > 0 ? "pos" : ""}">${ifzSig(r.anual)}</small></span>`
        : "";
  let h = `<span class="ifz-fecha" title="Cada turno es una estación; la economía se cierra con el invierno"><b>${est}</b> ${G.year} d.C.</span>${cifra(oro, "ifz-oro")}${cifra(com, "ifz-com")}`;
  if (otros.length)
    h += `<button class="ifz-mas" data-act="ifzres" aria-expanded="${IFZ.res}" aria-controls="ifzresd" title="Todos los recursos">${
      vis
        .slice(0, 3)
        .map((r) => `<span><i aria-hidden="true">${r.icono}</i>${r.saldo}</span>`)
        .join("") || "Recursos"
    }<span aria-hidden="true">${IFZ.res ? "▴" : "▾"}</span><span class="ifz-vh">Ver todos los recursos</span></button>`;
  h += `<span class="ifz-civ" style="color:${CIV[ME].c}" title="${CIV[ME].n}: ${owned(ME).length} de ${G.P.length} provincias">${CIV[ME].s} · ${owned(ME).length}/${G.P.length}</span>`;
  if (IFZ.res && otros.length)
    h += `<div class="ifz-resd" id="ifzresd" role="region" aria-label="Recursos del reino"><table><thead><tr><th></th><th>Recurso</th><th>Reserva</th><th>Al año</th></tr></thead><tbody>${rs
      .map(
        (r) =>
          `<tr class="${r.saldo || r.anual ? "" : "ifz-cero"}"><td aria-hidden="true">${r.icono}</td><td>${r.nombre}</td><td>${r.saldo}</td><td class="${r.anual < 0 ? "neg" : r.anual > 0 ? "pos" : ""}">${ifzSig(r.anual)}</td></tr>`,
      )
      .join("")}</tbody></table><p class="stats">Saldo neto anual (ingresos menos gastos). Más detalle en la pestaña Tesoro.</p></div>`;
  ifzPon("res", h);
}
/* ---------- pestañas ---------- */
/* Pestañas: las básicas + las que registren los sistemas con OC.panel(...) */
function pestanas() {
  return [
    { id: "prov", titulo: "Provincia", orden: 10, render: provPanel },
    { id: "dyn", titulo: "Dinastía", orden: 20, render: dynPanel },
    { id: "dip", titulo: "Diplomacia", orden: 30, render: dipPanel },
    ...OC.paneles,
    { id: "log", titulo: "Crónica", orden: 90, render: logPanel },
  ].sort((a, b) => a.orden - b.orden);
}
/* nombre corto de cada pestaña (el título completo va en title) */
const IFZ_CORTO = { prov: "Provincia", cmb: "Ejército", cam: "Campaña", dyn: "Dinastía", corte: "Corte", dip: "Diplomacia", eco: "Tesoro", tec: "Progreso", nar: "Anales", log: "Crónica", onl: "Online" };
function ifzPestanas(dis) {
  const pest = pestanas();
  if (!pest.some((x) => x.id === tab)) tab = "prov";
  /* siempre dos filas: tantas columnas como media lista de pestañas (mínimo 4) */
  const cols = String(Math.max(4, Math.ceil(pest.length / 2)));
  if ($("tabs").style.getPropertyValue("--ifz-cols") !== cols) $("tabs").style.setProperty("--ifz-cols", cols);
  ifzPon(
    "tabs",
    pest
      .map((x) => {
        const on = x.id === tab,
          tx = IFZ_CORTO[x.id] || String(x.titulo || x.id);
        return `<button role="tab" id="tabb-${x.id}" data-act="tab-${x.id}" class="${on ? "on" : ""}" aria-selected="${on}" aria-controls="panel" tabindex="${on ? 0 : -1}" title="${esc(String(x.titulo || x.id))}"><img src="${ifzIcono("tab." + x.id)}" alt="" width="18" height="18"><span>${esc(tx)}</span></button>`;
      })
      .join(""),
  );
  const pa = pest.find((x) => x.id === tab);
  let h;
  try {
    h = pa.render(dis);
  } catch (e) {
    console.error("[panel]", tab, e);
    h = `<h2>${pa.titulo}</h2><p class="dim">Error al mostrar este panel.</p>`;
  }
  const pn = $("panel");
  if (pn.getAttribute("aria-labelledby") !== "tabb-" + tab) pn.setAttribute("aria-labelledby", "tabb-" + tab);
  ifzPon("panel", h);
}
/* ---------- potencias ---------- */
/* fuerza mostrada: guarniciones (totPow) + ejércitos en campaña (G.cam.ej, sin máquinas) */
function ifzFuerza(f) {
  let s = totPow(f);
  const ej = G.cam && Array.isArray(G.cam.ej) ? G.cam.ej : [];
  for (const e of ej)
    if (e.f === f) {
      try {
        s += pw(typeof camUCampo === "function" ? camUCampo(e.u) : e.u);
      } catch (_) {
        s += pw(e.u || {});
      }
    }
  return s;
}
function ifzRelTag(f) {
  if (f === ME) return '<span class="tag tu">Tú</span>';
  try {
    if (typeof dipTag === "function") return dipTag(ME, f);
  } catch (_) {}
  return `<span class="tag ${G.st[ME][f]}">${G.st[ME][f]}</span>`;
}
function ifzPotencias() {
  const fs = [...Array(NF).keys()]
      .filter(alive)
      .map((f) => ({ f, fu: ifzFuerza(f), n: owned(f).length }))
      .sort((a, b) => b.fu - a.fu || b.n - a.n),
    mx = Math.max(1, ...fs.map((x) => x.fu)),
    LIM = 8,
    todas = IFZ.pref.potTodas || fs.length <= LIM + 1;
  let vis = todas ? fs : fs.slice(0, LIM);
  if (!vis.some((x) => x.f === ME)) vis = vis.concat(fs.filter((x) => x.f === ME));
  let h = vis
    .map(
      ({ f, fu, n }, i) =>
        `<button class="fac ifz-fac${f === ME ? " yo" : ""}" data-act="ifzfac-${f}" title="${esc(CIV[f].n)}: fuerza ${fu} (guarniciones y ejércitos), ${n} provincias. Ver en Diplomacia"><span class="ifz-fn" style="color:${CIV[f].c}"><small>${fs.indexOf(fs.find((x) => x.f === f)) + 1}</small>${CIV[f].s}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round((fu / mx) * 100)}%;background:${CIV[f].c}"></i></span><span class="ifz-fp">${n}<small>prov.</small></span>${ifzRelTag(f)}</button>`,
    )
    .join("");
  if (fs.length > LIM + 1)
    h += `<button class="ifz-vermas" data-act="ifzpot-todas" aria-expanded="${!!IFZ.pref.potTodas}">${IFZ.pref.potTodas ? "Ver solo las primeras" : `Ver las ${fs.length} potencias`}</button>`;
  ifzPon("facs", h);
  const n = $("potn"),
    tx = `${fs.length} en pie`;
  if (n && n.textContent !== tx) n.textContent = tx;
}

/* ======================= 3. panel de provincia y crónica ======================= */
const stTag = (g) =>
  g === ME ? '<span class="tag tu">Tú</span>' : `<span class="tag ${G.st[ME][g]}">${G.st[ME][g]}</span>`;
function provPanel(dis) {
  /* CAM: con un ejército seleccionado, su panel (campana.js) */
  if (typeof camSel !== "undefined" && camSel != null && camEj(camSel)) return camPanelEj(dis);
  /* CAM: espía seleccionado y provincias que la niebla oculta (campana.js) */
  if (typeof camEspSel !== "undefined" && camEspSel != null && typeof camPanelEsp === "function" && camEspPorId(camEspSel)) return camPanelEsp(dis);
  if (sel !== null && G.P[sel] && typeof camProvOculta === "function" && camProvOculta(G.P[sel])) return camPanelNiebla(G.P[sel], dis);
  if (sel === null || !G.P[sel])
    return '<h2>Mapa de campaña</h2><p class="dim">Haz clic (o toca) una provincia del mapa. Las tuyas llevan tu color; los castillos son capitales y la cifra junto a cada ciudad son sus levas.</p>';
  const p = G.P[sel],
    f = p.owner,
    mine = f === ME,
    F = G.F[ME],
    gc = G.C[p.gen];
  let h = ifzCabecera(p, f) + ifzTropasProv(p, f);
  h += `<p class="ifz-gen">General: ${gc ? `<b>${gc.n}</b> <span class="stats">mando ${gc.ma} · ${gc.age} años</span>` : '<span class="dim">ninguno</span>'}</p>`;
  if (!mine) {
    const near = MAP.adj[p.id].map((i) => G.P[i]).filter((q) => q.owner === ME && !q.tired);
    return (
      h +
      ifzSecciones({ p, f, mine, F }, dis, []) +
      `<p class="note">Defensa estimada ${Math.round(pw(p.u) * gb(p.gen) * (1.1 + 0.25 * p.walls))}${near.length ? " · tu mayor fuerza vecina " + Math.max(...near.map((q) => Math.round(pw(q.u) * gb(q.gen)))) : ""}${f < REB && !atWar(ME, f) ? "<br>Estáis en " + G.st[ME][f] + ": atacar significa declarar la guerra." : ""}</p>`
    );
  }
  const free = family(ME).filter((c) => c.age >= 16 && !genOf(c) && !c.dipReh);
  h += gc
    ? `<div class="btns"><button data-act="ungen" ${dis ? "disabled" : ""}>Retirar general</button></div>`
    : free.length
      ? `<div class="g2"><select id="gsel" aria-label="Elegir general">${free.map((c) => `<option value="${c.id}">${c.n} · mando ${c.ma}</option>`).join("")}</select><button data-act="gen" ${dis ? "disabled" : ""}>Nombrar general</button></div>`
      : "";
  /* CAM: Ejército — formar ejércitos que salen al mapa (campana.js), justo tras Reclutar */
  const extra = typeof camSeccionProv === "function" ? [{ id: "ejercito", orden: 22, render: () => camSeccionProv(p, dis) }] : [];
  return h + ifzSecciones({ p, f, mine, F }, dis, extra);
}
/* cabecera compacta: nombre, dueño, rendimiento, orden, ánimo, perfil, gobernador, asedio */
function ifzCabecera(p, f) {
  const y = yields(p),
    ch = [];
  try {
    if (f !== REB && typeof ecoNivel === "function") {
      const a = ecoNivel(p);
      ch.push(`<span class="ifz-chip" style="color:${a.color}" title="Ánimo del pueblo (orden ${Math.round(p.order)})">${a.icono} ${a.nombre}</span>`);
    }
    if (typeof tecPerfil === "function") {
      const pf = tecPerfil(p);
      ch.push(`<span class="ifz-chip" title="${esc(pf.sin ? pf.nombre + ": " + pf.sin : pf.nombre)}">${pf.icono} ${pf.nombre}</span>`);
    }
    if (typeof socGob === "function") {
      const g = socGob(p);
      if (g) ch.push(`<span class="ifz-chip" title="Gobernador">♜ ${esc(g.n)}</span>`);
    }
    if (typeof camAsedio === "function" && camAsedio(p.id)) ch.push('<span class="ifz-chip ifz-mal" title="La ciudad está sitiada">⚔ Sitiada</span>');
  } catch (e) {
    console.error("[ifz] cabecera", e);
  }
  const o = Math.round(p.order);
  return `<div class="ifz-pcab"><h2 style="color:${CIV[f].c}">${p.name}${p.cap ? ' <span title="Capital">♛</span>' : ""}</h2><p class="ifz-pdue">${CIV[f].n}${f < REB ? " " + stTag(f) : ""}${p.cap ? " · capital" : ""}</p><p class="ifz-rinde"><span title="Oro al año">◉ ${y.g} oro</span><span title="Comida al año">❦ ${y.fo} comida</span><span title="Orden público">orden ${o}</span></p><div class="bar" role="meter" aria-label="Orden público" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o}"><i style="width:${p.order}%;background:${p.order < 30 ? "#e0503f" : p.order < 55 ? "#e8b632" : "#4caf50"}"></i></div>${ch.length ? `<div class="ifz-chips">${ch.join("")}</div>` : ""}</div>`;
}
/* solo las clases que hay (antes se recorrían las ~30 clases del juego) */
function ifzTropasProv(p, f) {
  const ts = TYP.filter((t) => p.u[t] > 0);
  if (!ts.length) return '<p class="ifz-sin">Sin guarnición.</p>';
  const n = tot(p.u);
  return `<div class="troops ifz-tropas">${ts
    .map((t) => {
      const nm = (CIV[f].un && CIV[f].un[t]) || UN[t].s;
      return `<div title="${esc(nm)}: ${p.u[t]} ${p.u[t] === 1 ? "leva" : "levas"} (${p.u[t] * ifzSPU()} hombres)"><img src="${icon(f, t)}" alt=""><b>${p.u[t]}</b><span>${nm}</span></div>`;
    })
    .join("")}</div><p class="stats ifz-tsum">${n} ${n === 1 ? "leva" : "levas"} · ${n * ifzSPU()} hombres · fuerza ${Math.round(pw(p.u) * gb(p.gen))}${p.tired ? " · ya marcharon esta estación" : ""}</p>`;
}
/* secciones de otros sistemas (OC.seccion('prov')) envueltas en plegables con memoria.
   No se cambia su HTML: se mete dentro de <details>; su primer <h3> pasa a ser el título (y se oculta dentro). */
const IFZ_SECT = { edificios: "Ciudad y edificios" };
function ifzSecciones(ctx, dis, extra) {
  const l = [...(OC.secciones.prov || []), ...extra].sort((a, b) => a.orden - b.orden);
  let h = "";
  for (const s of l) {
    let html = "";
    try {
      if (s.visible && !s.visible(ctx)) continue;
      html = s.render(ctx, dis) || "";
    } catch (e) {
      console.error("[OC] seccion", "prov", s.id, e);
      continue;
    }
    h += ifzEnvolver(s.id, html, ctx);
  }
  return h;
}
function ifzEnvolver(id, html, ctx) {
  const t = html.trimStart(),
    m = t.match(/^<h3[^>]*>([\s\S]*?)<\/h3>/);
  if (!m) return html;
  const tit = IFZ_SECT[id] || m[1],
    ab = IFZ.pref.sec[id] === true,
    rs = ifzResumenSec(id, ctx);
  return `<details class="ifz-sec" data-ifzsec="${esc(id)}"${ab ? " open" : ""}><summary><span class="ifz-st">${tit}</span>${rs ? `<span class="ifz-sr">${rs}</span>` : ""}</summary><div class="ifz-sb">${html}</div></details>`;
}
/* lo que se ve de una sección plegada */
function ifzResumenSec(id, { p }) {
  try {
    if (id === "animo" && typeof ecoNivel === "function") {
      const a = ecoNivel(p);
      return `<b style="color:${a.color}">${a.icono} ${a.nombre}</b>`;
    }
    if (id === "impuestos" && TAX[p.tax]) return `impuestos ${TAX[p.tax].toLowerCase()}`;
    if (id === "gobierno" && typeof socGob === "function") return socGob(p) ? esc(socGob(p).n) : "sin gobernador";
    if (id === "edificios" && typeof tecHuecos === "function") {
      const hu = tecHuecos(p);
      return `${hu.usados}/${hu.total} huecos`;
    }
    if (id === "ejercito") {
      if (typeof camAsedio === "function" && camAsedio(p.id)) return '<b class="neg">¡sitiada!</b>';
      const n = typeof camS === "function" ? camS().ej.filter((e) => e.f === ME && camProv(e) === p).length : 0;
      return n ? `${n} ${n === 1 ? "ejército aquí" : "ejércitos aquí"}` : "formar y salir al mapa";
    }
    if (id === "mercenarios" && typeof mercOfertas === "function" && p.owner === ME) {
      const n = mercOfertas(p).length;
      return n ? `${n} ${n === 1 ? "compañía" : "compañías"}` : "ninguna";
    }
    if (id === "reclutar") return `${G.F[ME].gold} oro`;
  } catch (_) {}
  return "";
}
function cline(c) {
  return `<span class="stats">Mando ${c.ma} · Intriga ${c.in} · Diplomacia ${c.di} · Gestión ${c.ge} · ${c.tr}</span>`;
}
/* ---------- crónica: agrupada por año y con filtros ----------
   Los filtros usan las clases de cada entrada (good, bad, nar-rumor…; y guerra, corte, eco si algún
   sistema las añade) y, si no, palabras del texto. */
const IFZ_LOGF = [
  ["todo", "Todo"],
  ["mio", "Mi reino"],
  ["guerra", "Guerra"],
  ["corte", "Corte"],
  ["eco", "Economía"],
  ["rumor", "Rumores"],
];
const IFZ_RE = {
  guerra: /batalla|guerra|asedi|sitia|cerco|conquist|derrot|victori|ejércit|tropas|levas|saque|asalt|rebel|revuelta|mercenari|bagaud|invad|cae |caída|tregua|paz /i,
  corte: /boda|se casa|casad|nace|nacimiento|muere|muerte|fallec|hered|suce|trono|corte|gobernador|rehén|conjura|asesin|regencia|dinast|linaje|consejo|estamento|capitán|general/i,
  eco: /oro|comida|mercado|ruta|impuesto|hambre|peste|cosecha|granero|deuda|tesoro|comerci|moneda|tributo|edifici|construi|investig|técnica|descubr/i,
};
function ifzLogCats(l, mio) {
  const c = " " + (l.c || "") + " ",
    s = new Set();
  for (const k of ["guerra", "corte", "eco"]) if (c.includes(" " + k + " ") || IFZ_RE[k].test(l.m)) s.add(k);
  if (/rumor/.test(c)) s.add("rumor");
  if (mio && mio.test(l.m)) s.add("mio");
  return s;
}
function ifzMioRe() {
  const ns = [CIV[ME].s, CIV[ME].n, ...owned(ME).map((p) => p.name)];
  const r = ruler(ME);
  if (r) ns.push(r.n);
  const q = ns.filter(Boolean).map((x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(^|[^\\p{L}])(${q.join("|")}|[Tt]us? |[Tt]e |[Tt]ú )`, "u");
}
function logPanel() {
  const fil = IFZ_LOGF.some(([k]) => k === IFZ.pref.log) ? IFZ.pref.log : "todo",
    mio = ifzMioRe(),
    grupos = [];
  let cur = { y: G.year, l: [] };
  for (const l of G.log) {
    const m = /turn/.test(l.c || "") && /Año (\d+)/.exec(l.m);
    if (m) {
      grupos.push(cur);
      cur = { y: +m[1] - 1, l: [] };
      continue;
    }
    if (fil === "todo" || ifzLogCats(l, mio).has(fil)) cur.l.push(l);
  }
  grupos.push(cur);
  const vis = grupos.filter((g) => g.l.length);
  let h = `<h2>Crónica</h2><div class="ifz-filt" role="group" aria-label="Filtrar la crónica">${IFZ_LOGF.map(
    ([k, t]) => `<button data-act="ifzlog-${k}" aria-pressed="${fil === k}" class="${fil === k ? "on" : ""}">${t}</button>`,
  ).join("")}</div><div id="log">`;
  if (!vis.length) h += '<p class="dim">Nada que contar con este filtro.</p>';
  vis.forEach((g, i) => {
    const ab = IFZ.anios[g.y] !== undefined ? IFZ.anios[g.y] : i < 2;
    h += `<details class="ifz-anio" data-ifzanio="${g.y}"${ab ? " open" : ""}><summary>${g.y} d.C. <span class="stats">${g.l.length} ${g.l.length === 1 ? "hecho" : "hechos"}</span></summary><ul>${g.l.map((l) => `<li class="${l.c || ""}">${l.m}</li>`).join("")}</ul></details>`;
  });
  return h + "</div>";
}

/* ======================= 4. iconos pixel de la interfaz ======================= */
/* paleta propia; F/f/r = color del pueblo (PAL) cuando se pinta para una facción */
const IFZ_PAL = {
  k: "#211c26",
  w: "#e4dccb",
  W: "#b7ae9c",
  g: "#f2c14e",
  G: "#a8771c",
  r: "#c8432f",
  R: "#7a2318",
  b: "#5b97f0",
  n: "#7a4f2c",
  s: "#aab4bd",
  o: "#ff7a2a",
  y: "#ffd04a",
  e: "#4caf50",
};
const IFZ_SP = {
  "tab.prov": ["....g....", "....gg...", "k.k.k.k.k", "kwkwkwkwk", "kwwwwwwwk", "kwkwwwkwk", "kwwwwwwwk", "kwwwkwwwk", "kkkkkkkkk"],
  "tab.cmb": ["........w", ".......ws", "......ws.", ".....ws..", "g...ws...", ".g.ws....", "..gs.....", ".n.g.....", "n...g...."],
  "tab.cam": ["kg.......", "krrrrrr..", "krrgrrrr.", "krrrrrr..", "kRRRRRRR.", "k........", "k........", "k........", "kk......."],
  "tab.dyn": [".........", "g...g...g", "gg.ggg.gg", "ggggggggg", "gGrGgGbGg", "ggggggggg", "GGGGGGGGG", ".........", "........."],
  "tab.corte": ["....g....", "..ggggg..", "ggggggggg", ".w.w.w.w.", ".w.w.w.w.", ".w.w.w.w.", ".w.w.w.w.", "ggggggggg", "GGGGGGGGG"],
  "tab.dip": ["nwwwwwwn.", ".wkkkkw..", ".wwwwww..", ".wkkkkw..", ".wwwwww..", ".wkkrrw..", ".wwwrrr..", "nwwwwrrn.", "........."],
  "tab.eco": ["..ggggg..", ".gGGGGGg.", ".ggggggg.", "..ggggg..", ".gGGGGGg.", ".ggggggg.", "..ggggg..", "...GGG...", "........."],
  "tab.tec": ["...www...", "..w...w..", ".w..g..w.", "w..ggg..w", "w.ggggg.w", "w..ggg..w", ".w..g..w.", "..w...w..", "...www..."],
  "tab.nar": [".........", ".ww...ww.", "wkkw.wkkw", "wwwwnwwww", "wkkwnwkkw", "wwwwnwwww", "wkkwnwkkw", "nnnnnnnnn", "........."],
  "tab.log": ["........w", "......www", ".....www.", "....www..", "...www...", "..ww.....", ".k.......", "k........", "kkkk....."],
  "tab.onl": ["...www...", ".wbwbwbw.", "wbbwbbbbw", "wwwwwwwww", "wbbbwbbbw", "wwwwwwwww", "wbbwbbbbw", ".wbwbwbw.", "...www..."],
  "tab.otro": ["....g....", "...ggg...", "..ggGgg..", ".ggGGGgg.", "ggGGwGGgg", ".ggGGGgg.", "..ggGgg..", "...ggg...", "....g...."],
  /* mapa de campaña */
  "mapa.estandarte": ["kFFFF", "kFFFF", "kFFFr", "krrrr", "k....", "k....", "k....", "k....", "k...."],
  "mapa.tienda": ["...k...", "..www..", ".wwkww.", "wwkkkww", "wwkkkww"],
  "mapa.mercenarios": ["...kgg.", "...k...", "..ggg..", ".ggkgg.", "ggkkkgg", "ggkkkgg"],
  "mapa.escala": ["n...n", "nnnnn", "n...n", "nnnnn", "n...n", "nnnnn", "n...n"],
  "mapa.fuego": [".o..", ".oy.", "oyyo", ".oo."],
  "mapa.marcha": ["g..", "gg.", "ggg", "gg.", "g.."],
  "mapa.general": ["g.g", "ggg"],
};
const IFZ_ICO = {};
/* data-URL de un icono de la interfaz (se puede sustituir por PNG: nombre «IFZ.tab.prov»…) */
function ifzIcono(n) {
  if (IFZ_ICO[n]) return IFZ_ICO[n];
  const rows = IFZ_SP[n] || IFZ_SP["tab.otro"],
    c = document.createElement("canvas"),
    k = 2;
  c.width = rows[0].length * k;
  c.height = rows.length * k;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  const im = ifzSprImg(rows, null);
  if (im) x.drawImage(im, 0, 0, c.width, c.height);
  else
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++)
        if (row[i] !== ".") {
          x.fillStyle = IFZ_PAL[row[i]] || "#fff";
          x.fillRect(i * k, j * k, k, k);
        }
    });
  try {
    IFZ_ICO[n] = c.toDataURL();
  } catch (_) {
    IFZ_ICO[n] = "";
  }
  return IFZ_ICO[n];
}
const IFZ_PALF = {};
const ifzPal = (f) => IFZ_PALF[f] || (IFZ_PALF[f] = Object.assign({}, IFZ_PAL, PAL[f] || PAL[0]));
/* cifras pixel 3×5 para el mapa (no dependen de que cargue la fuente) */
const IFZ_DIG = {
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", ".##", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"],
  7: ["###", "..#", "..#", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"],
};
const IFZ_INS = new Map();
/* insignia con un número: fondo oscuro, filete del color del pueblo y cifras claras. Cacheada. */
function ifzInsignia(n, borde, tinta) {
  const s = String(Math.max(0, Math.round(n))),
    k = s + "|" + borde + "|" + tinta;
  let c = IFZ_INS.get(k);
  if (c) return c;
  if (IFZ_INS.size > 600) IFZ_INS.clear();
  c = document.createElement("canvas");
  c.width = s.length * 4 + 3;
  c.height = 9;
  const x = c.getContext("2d");
  x.fillStyle = "#0b0f12";
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = borde;
  x.fillRect(0, 0, c.width, 1);
  x.fillRect(0, c.height - 1, c.width, 1);
  x.fillRect(0, 0, 1, c.height);
  x.fillRect(c.width - 1, 0, 1, c.height);
  x.fillStyle = tinta;
  [...s].forEach((d, i) =>
    IFZ_DIG[d].forEach((row, j) => {
      for (let a = 0; a < 3; a++) if (row[a] === "#") x.fillRect(2 + i * 4 + a, 2 + j, 1, 1);
    }),
  );
  IFZ_INS.set(k, c);
  return c;
}

/* ======================= 5. dibujo del mapa ======================= */
/* capa estática (terreno + color de los dueños + fronteras): solo se rehace si cambia algo */
const IFZ_CAPA = { cv: null, k: "" };
function ifzCapa() {
  const { grid } = MAP,
    k = `${W}x${H}|${MAP.seed}|${IFZ.baseVer}|${sel}|${hover}|${G.P.map((p) => p.owner).join(",")}`;
  if (IFZ_CAPA.cv && IFZ_CAPA.k === k) return IFZ_CAPA.cv;
  let c = IFZ_CAPA.cv;
  if (!c) c = IFZ_CAPA.cv = document.createElement("canvas");
  if (c.width !== W * T || c.height !== H * T) {
    c.width = W * T;
    c.height = H * T;
  }
  const x = c.getContext("2d");
  x.globalAlpha = 1;
  x.drawImage(base, 0, 0);
  for (let y = 0; y < H; y++)
    for (let xx = 0; xx < W; xx++) {
      const i = grid[y][xx];
      if (i < 0) continue;
      x.globalAlpha = i === sel ? 0.42 : i === hover ? 0.36 : 0.26;
      x.fillStyle = CIV[G.P[i].owner].c;
      x.fillRect(xx * T, y * T, T, T);
    }
  x.globalAlpha = 1;
  for (let y = 0; y < H; y++)
    for (let xx = 0; xx < W; xx++) {
      const i = grid[y][xx];
      if (i < 0) continue;
      const o = G.P[i].owner,
        X = xx * T,
        Y = y * T;
      for (const [ox, oy, ex, ey, ew, eh] of [
        [1, 0, T - 1, 0, 1, T],
        [-1, 0, 0, 0, 1, T],
        [0, 1, 0, T - 1, T, 1],
        [0, -1, 0, 0, T, 1],
      ]) {
        const j = grid[y + oy]?.[xx + ox];
        if (j === undefined || j < 0 || j === i) continue;
        if (i === sel) x.fillStyle = "#fff";
        else if (j === sel) continue;
        else if (G.P[j].owner !== o) x.fillStyle = CIV[o].d;
        else {
          if (ox < 0 || oy < 0) continue;
          x.fillStyle = "rgba(0,0,0,.3)";
        }
        x.fillRect(X + ex, Y + ey, ew, eh);
      }
    }
  IFZ_CAPA.k = k;
  return c;
}
function drawMap(now) {
  const { grid, adj } = MAP;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ifzCapa(), 0, 0);
  if (aim && sel !== null) {
    ctx.globalAlpha = reduce ? 0.3 : 0.22 + 0.16 * Math.sin(now / 140);
    ctx.fillStyle = "#fff";
    const a = adj[sel];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (a.includes(grid[y][x])) ctx.fillRect(x * T, y * T, T, T);
    ctx.globalAlpha = 1;
  }
  const wave = reduce ? 0 : Math.floor(now / 450) % 2;
  ctx.font = '8px "Press Start 2P",monospace';
  ctx.textBaseline = "top";
  /* ciudades, generales y guarniciones */
  for (const p of G.P) {
    const cx = p.x * T + 4,
      cy = p.y * T + 4;
    if (p.cap) spr(ctx, wave ? SP.castle2 : SP.castle, cx - 5, cy - 7, PAL[p.owner]);
    else spr(ctx, SP.town, cx - 4, cy - 4, PAL[p.owner]);
    if (p.gen != null) spr(ctx, IFZ_SP["mapa.general"], cx - 6, cy - 9, IFZ_PAL);
    const n = tot(p.u);
    if (n) ctx.drawImage(ifzInsignia(n, CIV[p.owner].c, p.tired ? "#9aa0a6" : "#ffffff"), cx + 6, cy - 4);
  }
  /* CAM: ejércitos, alcance, rutas, campamentos, asedios y estación */
  ifzCamDibujar(now);
  if (anim) {
    const k = Math.min(1, (now - anim.t0) / anim.dur),
      x = anim.x0 + (anim.x1 - anim.x0) * k,
      y = anim.y0 + (anim.y1 - anim.y0) * k - Math.abs(Math.sin(k * Math.PI * 4)) * 2;
    spr(ctx, SP.i, Math.round(x - 3), Math.round(y - 5), PAL[anim.f]);
    spr(ctx, SP.c, Math.round(x + 1), Math.round(y - 3), PAL[anim.f]);
    if (k >= 1) {
      const r = anim.res;
      anim = null;
      r();
    }
  }
  if (flash) {
    const k = (now - flash.t0) / 600;
    if (k > 1) flash = null;
    else {
      const r = Math.round(3 + k * 10);
      ctx.fillStyle = Math.floor(k * 8) % 2 ? "#fff3b0" : "#ff7a2a";
      for (let a = 0; a < 8; a++) {
        const an = (a * Math.PI) / 4;
        ctx.fillRect(Math.round(flash.x + Math.cos(an) * r) - 1, Math.round(flash.y + Math.sin(an) * r) - 1, 2, 2);
      }
    }
  }
}
/* CAM: capa de campaña. Usa la lógica de ejercitos.js/campana.js (alcance, rutas, asedios) y solo
   cambia el dibujo: estandartes, insignias con el número de levas, iconos de estado, contorno del
   alcance y ruta con destino marcado. Si falta alguna función de campaña, usa camDibujar(). */
const IFZ_ALC = { cv: null, k: "" };
function ifzCamDibujar(now) {
  if (typeof camS !== "function" || typeof camAlcance !== "function" || typeof camRutaHover !== "function") {
    if (typeof camDibujar === "function") camDibujar(now);
    return;
  }
  /* CAM: niebla de guerra (campana.js): oscuro lo no explorado, velo y última noticia en lo no visible */
  if (typeof camDibujarNiebla === "function") camDibujarNiebla(ctx, now);
  const S = camS(),
    c = ctx,
    se = camSel != null ? camEj(camSel) : null,
    mio = se && isMe(se.f) && myTurn() && !G.over,
    corner = (X, Y, col) => {
      c.fillStyle = col;
      for (const [a, b, w, h] of [
        [-1, -1, 3, 1],
        [-1, -1, 1, 3],
        [T - 2, -1, 3, 1],
        [T, -1, 1, 3],
        [-1, T, 3, 1],
        [-1, T - 2, 1, 3],
        [T - 2, T, 3, 1],
        [T, T - 2, 1, 3],
      ])
        c.fillRect(X + a, Y + b, w, h);
    };
  /* alcance (capa cacheada: relleno suave y borde) */
  if (mio) {
    const D = camAlcance(se),
      k = `${se.id}|${camVer}|${se.mov}|${se.x},${se.y}|${G.estacion}|${W}x${H}`;
    if (IFZ_ALC.k !== k || !IFZ_ALC.cv) {
      const cc = IFZ_ALC.cv || (IFZ_ALC.cv = document.createElement("canvas"));
      cc.width = W * T;
      cc.height = H * T;
      const x = cc.getContext("2d"),
        ok = (i) => i >= 0 && i < W * H && D.dist[i] <= se.mov + 1e-9;
      x.fillStyle = "rgba(255,236,150,.24)";
      for (let i = 0; i < W * H; i++) if (ok(i) && i !== D.s) x.fillRect((i % W) * T, Math.floor(i / W) * T, T, T);
      x.fillStyle = "#ffd75a";
      for (let i = 0; i < W * H; i++) {
        if (!ok(i)) continue;
        const X = (i % W) * T,
          Y = Math.floor(i / W) * T,
          cx = i % W;
        if (cx === 0 || !ok(i - 1)) x.fillRect(X, Y, 1, T);
        if (cx === W - 1 || !ok(i + 1)) x.fillRect(X + T - 1, Y, 1, T);
        if (!ok(i - W)) x.fillRect(X, Y, T, 1);
        if (!ok(i + W)) x.fillRect(X, Y + T - 1, T, 1);
      }
      IFZ_ALC.k = k;
    }
    c.globalAlpha = reduce ? 0.85 : 0.7 + 0.25 * Math.sin(now / 260);
    c.drawImage(IFZ_ALC.cv, 0, 0);
    c.globalAlpha = 1;
    /* objetivos: ciudades que puede asediar y enemigos que puede atacar */
    const tgt = (X, Y) => {
      c.globalAlpha = 0.35;
      c.fillStyle = "#ff5a3a";
      c.fillRect(X, Y, T, T);
      c.globalAlpha = 1;
      corner(X, Y, "#ff5a3a");
    };
    for (const p of G.P)
      if (camCiudadCerrada(se.f, p) && CAM_V8.some(([dx, dy]) => D.dist[camIdx(p.x + dx, p.y + dy)] <= se.mov + 1e-9 || (se.x === p.x + dx && se.y === p.y + dy)))
        tgt(p.x * T, p.y * T);
    for (const e of S.ej) if (camGuerra(se.f, e.f) && D.dist[camIdx(e.x, e.y)] <= se.mov + 1e-9 && (typeof camVeEj !== "function" || camVeEj(ME, e))) tgt(e.x * T, e.y * T); /* CAM: niebla */
    /* ruta hasta la casilla bajo el ratón */
    const r = camRutaHover(se);
    if (r) {
      c.fillStyle = "#000";
      for (const j of r.dentro.concat(r.fuera)) c.fillRect((j % W) * T + 2, Math.floor(j / W) * T + 2, 4, 4);
      c.fillStyle = "#fff3b0";
      for (const j of r.dentro) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 3, 2, 2);
      c.fillStyle = "rgba(255,243,176,.5)";
      for (const j of r.fuera) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 3, 2, 2);
      const fin = r.fuera.length ? r.fuera[r.fuera.length - 1] : r.dentro[r.dentro.length - 1];
      if (fin != null) corner((fin % W) * T, Math.floor(fin / W) * T, r.fuera.length ? "#e8b632" : "#fff3b0");
    }
  }
  /* huella de la última marcha */
  for (const e of S.ej) {
    if (!e.pas || !e.pas.length || (typeof camVeEj === "function" && !camVeEj(ME, e))) continue; /* CAM: niebla */
    c.fillStyle = CIV[e.f].d;
    c.globalAlpha = 0.6;
    for (const j of e.pas) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 4, 2, 1);
    c.globalAlpha = 1;
  }
  /* campamentos mercenarios: tienda dorada con banderola */
  if (typeof mercS === "function")
    for (const m of mercS().camp) if (m.cias.length && (typeof camExplorado !== "function" || camExplorado(ME, m.x, m.y))) spr(c, IFZ_SP["mapa.mercenarios"], m.x * T, m.y * T + 1, IFZ_PAL); /* CAM: niebla */
  /* asedios: escala, fuego y esquinas rojas; punto rojo si la ciudad pasa hambre */
  for (const a of Object.values(S.as)) {
    const p = G.P[a.p];
    if (!p || (typeof camVeProv === "function" && !camVeProv(ME, p.id))) continue; /* CAM: niebla */
    const X = p.x * T,
      Y = p.y * T,
      fl = reduce ? 0 : Math.floor(now / 200) % 2;
    corner(X, Y, "#e0503f");
    spr(c, IFZ_SP["mapa.escala"], X - 2, Y - 3, IFZ_PAL);
    spr(c, IFZ_SP["mapa.fuego"], X + 5, Y - 6 + fl, fl ? { ...IFZ_PAL, o: "#ffd04a", y: "#ff7a2a" } : IFZ_PAL);
    if (a.vi < 0) {
      c.fillStyle = "#000";
      c.fillRect(X + 2, Y - 8, 4, 4);
      c.fillStyle = "#e0503f";
      c.fillRect(X + 3, Y - 7, 2, 2);
    }
  }
  /* CAM: flancos del cerco, flechas, compañeros de asalto conjunto y su animación (campana.js) */
  if (typeof camDibujarCerco === "function") camDibujarCerco(c, now);
  /* ejércitos */
  const ciu = camCiudades();
  for (const e of S.ej) {
    const n = camTot(e.u);
    if (n <= 0 || (typeof camVeEj === "function" && !camVeEj(ME, e))) continue; /* CAM: niebla */
    let X = e.x * T + 1,
      Y = e.y * T + 2;
    const enC = ciu.has(camIdx(e.x, e.y));
    if (enC) X -= 8;
    const cab = Object.keys(e.u).reduce((s, t) => s + (UN[t] && UN[t].cl === "cab" ? e.u[t] || 0 : 0), 0),
      bob = e.est === "marcha" && !reduce ? Math.floor(now / 300 + e.id) % 2 : 0,
      pal = ifzPal(e.f),
      quieto = isMe(e.f) && e.mov <= 0.5;
    spr(c, IFZ_SP["mapa.estandarte"], X - 3, Y - 7, pal);
    if (e.gen != null) {
      c.fillStyle = "#f2c14e";
      c.fillRect(X - 3, Y - 8, 1, 1);
    }
    spr(c, cab * 2 > n ? SP.c : SP.i, X, Y - 3 - bob, PAL[e.f] || PAL[0]);
    /* insignia a la derecha; si el ejército está en una ciudad, a la izquierda (no tapa el castillo) */
    const ins = ifzInsignia(n, CIV[e.f].c, quieto ? "#9aa0a6" : "#ffffff"),
      bx0 = enC ? X - 4 - ins.width : X + 8;
    c.drawImage(ins, bx0, Y - 2);
    if (e.est === "campamento") spr(c, IFZ_SP["mapa.tienda"], bx0, Y + 6, IFZ_PAL);
    else if (e.est === "asedio") spr(c, IFZ_SP["mapa.escala"], bx0 + 1, Y + 6, IFZ_PAL);
    else if (e.plan) spr(c, IFZ_SP["mapa.marcha"], enC ? bx0 - 4 : bx0 + ins.width + 1, Y, IFZ_PAL);
    if (e.id === camSel && (reduce || Math.floor(now / 350) % 2)) {
      c.strokeStyle = "#fff";
      c.lineWidth = 1;
      c.strokeRect(e.x * T + 0.5, e.y * T + 0.5, T - 1, T - 1);
    }
  }
  /* ONL: órdenes encoladas de la estación (online.js; antes envolvía camDibujar) */
  if (net.on && typeof onlDibujarCola === "function" && typeof ONL !== "undefined" && ONL.cola && ONL.cola.length) onlDibujarCola(now);
  /* estación en curso (también en la barra superior) */
  if (typeof CAM_EST !== "undefined") {
    const tx = `${CAM_EST[G.estacion]} ${G.year}`;
    c.fillStyle = "rgba(0,0,0,.6)";
    c.fillRect(2, 2, tx.length * 8 + 6, 12);
    c.fillStyle = G.estacion === 3 ? "#cfe3ff" : "#f2d27a";
    c.fillText(tx, 5, 4);
  }
}
/* minimapa: aparece cuando el mapa no cabe (zoom o móvil); tocarlo lleva la vista allí */
let ifzMiniT = 0;
function ifzMini() {
  const m = $("ifzmini"),
    w = $("mapwrap");
  if (!m || !w || !G || !MAP) return;
  const ver = w.scrollWidth > w.clientWidth + 8 || w.scrollHeight > w.clientHeight + 8;
  if (m.hidden === ver) m.hidden = !ver;
  if (!ver) return;
  if (m.width !== W * 2 || m.height !== H * 2) {
    m.width = W * 2;
    m.height = H * 2;
  }
  const x = m.getContext("2d");
  x.imageSmoothingEnabled = true;
  x.drawImage(cv, 0, 0, m.width, m.height);
  const fx = m.width / w.scrollWidth,
    fy = m.height / w.scrollHeight;
  x.strokeStyle = "#f2c14e";
  x.lineWidth = 2;
  x.strokeRect(w.scrollLeft * fx + 1, w.scrollTop * fy + 1, Math.max(4, w.clientWidth * fx - 2), Math.max(4, w.clientHeight * fy - 2));
}
function ifzMiniIr(e) {
  const m = $("ifzmini"),
    w = $("mapwrap"),
    r = m.getBoundingClientRect();
  w.scrollLeft = ((e.clientX - r.left) / r.width) * w.scrollWidth - w.clientWidth / 2;
  w.scrollTop = ((e.clientY - r.top) / r.height) * w.scrollHeight - w.clientHeight / 2;
}
(() => {
  const m = $("ifzmini");
  if (!m) return;
  let ar = false;
  m.addEventListener("pointerdown", (e) => {
    ar = true;
    try {
      m.setPointerCapture(e.pointerId);
    } catch (_) {}
    ifzMiniIr(e);
  });
  m.addEventListener("pointermove", (e) => ar && ifzMiniIr(e));
  m.addEventListener("pointerup", () => (ar = false));
  m.addEventListener("pointercancel", () => (ar = false));
})();
function frame(now) {
  try {
    if ($("start").classList.contains("show")) drawScene(now);
    if (G && MAP) {
      drawMap(now);
      if (++ifzMiniT % 8 === 0) ifzMini();
    }
    if (BT) drawBattle(now);
  } catch (e) {
    console.error(e);
  }
  requestAnimationFrame(frame);
}

/* ======================= 6. zoom y desplazamiento ======================= */
let zoom = innerWidth < 700 ? 2 : 1;
function zoomAt(wrap, cnv, z, cx, cy) {
  const r = cnv.getBoundingClientRect(),
    fx = (cx - r.left) / r.width,
    fy = (cy - r.top) / r.height;
  cnv.style.width = z * 100 + "%";
  const r2 = cnv.getBoundingClientRect();
  wrap.scrollLeft += r2.left + fx * r2.width - cx;
  wrap.scrollTop += r2.top + fy * r2.height - cy;
}
function pinchDist(m) {
  const a = [...m.values()];
  return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
}
function pinchMid(m) {
  const a = [...m.values()];
  return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
}
const mp = { pts: new Map(), pan: null, pinch: null, moved: false };
function mapZoom(z, cx, cy) {
  zoom = clamp(z, 1, 4);
  const w = $("mapwrap");
  if (cx == null) {
    const r = w.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }
  zoomAt(w, cv, zoom, cx, cy);
  $("mzl").textContent = Math.round(zoom * 100) + "%";
}
cv.addEventListener("pointerdown", (e) => {
  mp.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try {
    cv.setPointerCapture(e.pointerId);
  } catch (_) {}
  const w = $("mapwrap");
  if (mp.pts.size === 1) {
    mp.moved = false;
    mp.pan = { cx: e.clientX, cy: e.clientY, sl: w.scrollLeft, st: w.scrollTop };
  } else if (mp.pts.size === 2) {
    mp.pinch = { d0: pinchDist(mp.pts), z0: zoom };
    mp.pan = null;
    mp.moved = true;
  }
});
cv.addEventListener("pointermove", (e) => {
  if (!mp.pts.has(e.pointerId)) return;
  mp.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const w = $("mapwrap");
  if (mp.pinch && mp.pts.size >= 2) {
    const m = pinchMid(mp.pts);
    mapZoom((mp.pinch.z0 * pinchDist(mp.pts)) / mp.pinch.d0, m.x, m.y);
    return;
  }
  if (mp.pan) {
    const dx = e.clientX - mp.pan.cx,
      dy = e.clientY - mp.pan.cy;
    if (Math.hypot(dx, dy) > 7) mp.moved = true;
    if (mp.moved) {
      w.scrollLeft = mp.pan.sl - dx;
      w.scrollTop = mp.pan.st - dy;
    }
  }
});
const mpEnd = (e) => {
  mp.pts.delete(e.pointerId);
  if (mp.pts.size < 2) mp.pinch = null;
  if (mp.pts.size === 1) {
    const a = [...mp.pts.values()][0],
      w = $("mapwrap");
    mp.pan = { cx: a.x, cy: a.y, sl: w.scrollLeft, st: w.scrollTop };
  }
  if (!mp.pts.size) mp.pan = null;
};
cv.addEventListener("pointerup", mpEnd);
cv.addEventListener("pointercancel", mpEnd);
cv.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    mapZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  },
  { passive: false },
);
function setZoom(z) {
  const w = $("mapwrap"),
    cx = (w.scrollLeft + w.clientWidth / 2) / w.scrollWidth,
    cy = (w.scrollTop + w.clientHeight / 2) / w.scrollHeight;
  zoom = clamp(z, 1, 4);
  cv.style.width = zoom * 100 + "%";
  const zl = $("mzl");
  if (zl) zl.textContent = Math.round(zoom * 100) + "%";
  w.scrollLeft = cx * w.scrollWidth - w.clientWidth / 2;
  w.scrollTop = cy * w.scrollHeight - w.clientHeight / 2;
}
function centerOn(i) {
  const p = G.P[i],
    w = $("mapwrap");
  if (!p) return;
  requestAnimationFrame(() => {
    w.scrollLeft = (p.x / W) * w.scrollWidth - w.clientWidth / 2;
    w.scrollTop = (p.y / H) * w.scrollHeight - w.clientHeight / 2;
  });
}
setZoom(zoom);

/* ======================= 7. modales ======================= */
/* Cola: un modal espera a que se cierre el anterior (mq). Foco al primer botón (o al dorado), Tab
   no sale del modal, Escape pulsa «Cancelar/Cerrar» o el único botón de un aviso, y al cerrar el foco
   vuelve a donde estaba. */
const IFZ_MOD = { btns: null, prev: null };
const IFZ_CANCEL = /^(cancelar|cerrar|volver|atrás|seguir jugando|ahora no)\b/i;
function modal(title, html, btns) {
  OC.modales = (OC.modales || 0) + 1;
  const pr = mq.then(
    () =>
      new Promise((res) => {
        const mc = $("modalc");
        IFZ_MOD.prev = document.activeElement && document.activeElement !== document.body ? document.activeElement : IFZ_MOD.prev;
        mc.innerHTML = `<h2 id="modalt">${title}</h2><div class="ifz-mcu">${html}</div><div class="mbtn">${btns.map((b, i) => (b.inl ? "" : `<button data-mi="${i}" class="${b.cls || ""}" ${b.dis ? "disabled" : ""}>${b.t}</button>`)).join("")}</div>`;
        IFZ_MOD.btns = btns;
        $("modal").classList.add("show");
        mc.scrollTop = 0;
        setTimeout(() => {
          const pri = mc.querySelector(".mbtn button.gold:not(:disabled)") || mc.querySelector("button:not(:disabled)");
          pri?.focus({ preventScroll: true });
        }, 30);
        mc.onclick = (e) => {
          const x = e.target.closest("[data-mi]");
          if (!x || x.disabled) return;
          $("modal").classList.remove("show");
          mc.onclick = null;
          IFZ_MOD.btns = null;
          const b = btns[+x.dataset.mi];
          try {
            b.fn && b.fn();
          } finally {
            res(b.v !== undefined ? b.v : +x.dataset.mi);
            if (G) ui();
            setTimeout(() => {
              if ($("modal").classList.contains("show")) return;
              const p = IFZ_MOD.prev;
              IFZ_MOD.prev = null;
              if (p && p.isConnected && typeof p.focus === "function") p.focus({ preventScroll: true });
            }, 40);
          }
        };
      }),
  );
  mq = pr.catch(() => {});
  return pr;
}
/* botón que pulsa Escape (o null si el modal exige una decisión) */
function ifzBotonEscape() {
  const mc = $("modalc"),
    bs = [...mc.querySelectorAll("[data-mi]")].filter((b) => !b.disabled);
  const can = bs.find((b) => IFZ_CANCEL.test(b.textContent.trim()));
  if (can) return can;
  return bs.length === 1 && !mc.querySelector(".ifz-mcu [data-mi], .ifz-mcu input, .ifz-mcu select") ? bs[0] : null;
}

/* ======================= 8. acciones, teclado y hover ======================= */
document.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b || b.disabled) return;
  const ds = b.dataset.act,
    ix = ds.indexOf("-"),
    a = ix < 0 ? ds : ds.slice(0, ix),
    v = ix < 0 ? "" : ds.slice(ix + 1),
    tecl = e.detail === 0;
  if (a === "music") {
    AU.want = !AU.want;
    try {
      localStorage.setItem("ocaso-mus", AU.want ? "1" : "0");
    } catch (_) {}
    if (AU.want) {
      audioInit();
      music(BT ? "battle" : "camp");
    } else music(null);
    musLabel();
    if (ST.view === "home" && $("start").classList.contains("show")) renderStart();
    return;
  }
  if (a === "ifzayuda") {
    ifzAyuda();
    return;
  }
  if (a === "zoom") {
    if (v === "cap") {
      if (G && G.F[ME] && G.P[G.F[ME].capId]) {
        sel = G.F[ME].capId;
        centerOn(sel);
        tab = "prov";
        ui();
      }
      return;
    }
    mapZoom(zoom * (v === "in" ? 1.4 : 1 / 1.4));
    return;
  }
  if (a === "menu") {
    openStart("home");
    return;
  }
  if (a === "s") {
    startAct(v);
    return;
  }
  if (a === "b") {
    battleAct(v);
    return;
  }
  if (!G) return;
  if (a === "tab") {
    const deTabs = !!b.closest("#tabs");
    tab = v;
    ui();
    if (deTabs) $("tabb-" + v)?.focus({ preventScroll: true });
    return;
  }
  if (a === "end") {
    endTurn();
    return;
  }
  const ocA = OC.acciones[a];
  const refoco = () => {
    if (!tecl || b.isConnected) return;
    const n = document.querySelector(`[data-act="${CSS.escape(ds)}"]`);
    if (n && !n.disabled) n.focus({ preventScroll: true });
  };
  if (ocA && ocA.libre) {
    if (ocA.fn(v, b) !== false) ui();
    refoco();
    return;
  }
  if (busy || G.over || !myTurn()) return;
  if (ocA) {
    if (ocA.fn(v, b) !== false) ui();
    refoco();
    return;
  }
  const p = G.P[sel];
  if (p && p.owner === ME) {
    if (a === "aim") {
      const f = +v;
      aim = aim === f ? 0 : f;
    }
    if (a === "gen") {
      const id = +$("gsel").value;
      G.P.forEach((q) => {
        if (q.gen === id) q.gen = null;
      });
      p.gen = id;
    }
    if (a === "ungen") p.gen = null;
  }
  ui();
  refoco();
});
/* acciones propias de la interfaz (libres: no gastan el turno) */
OC.accion(
  "ifzres",
  () => {
    IFZ.res = !IFZ.res;
  },
  { libre: true },
);
OC.accion(
  "ifzpot",
  () => {
    IFZ.pref.potTodas = !IFZ.pref.potTodas;
    ifzGuardar();
  },
  { libre: true },
);
OC.accion(
  "ifzfac",
  (v) => {
    const f = +v;
    if (f === ME || !(f >= 0 && f < NF)) {
      tab = "dyn";
      return;
    }
    if (typeof dipAbiertos === "object" && dipAbiertos) dipAbiertos[f] = true;
    tab = "dip";
    requestAnimationFrame(() => document.querySelector(`#panel [data-dipg="${f}"]`)?.scrollIntoView({ block: "nearest" }));
  },
  { libre: true },
);
OC.accion(
  "ifzlog",
  (v) => {
    IFZ.pref.log = v;
    IFZ.anios = {};
    ifzGuardar();
  },
  { libre: true },
);
OC.accion(
  "ifztut",
  (v) => {
    if (v === "sig") IFZ.pref.tut = (IFZ.pref.tut || 0) + 1;
    if (v === "fin") IFZ.pref.tut = IFZ_TUT.length;
    if (v === "otra") IFZ.pref.tut = 0;
    ifzGuardar();
  },
  { libre: true },
);
/* memoria de los plegables (secciones de provincia, años de la crónica, potencias).
   El evento 'toggle' llega tarde (asíncrono): si ui() redibuja antes, se perdería el cambio.
   Por eso se anota ya en el clic del <summary> el estado que va a tener. */
document.addEventListener(
  "click",
  (e) => {
    const sm = e.target.closest && e.target.closest("summary");
    const d = sm && sm.parentElement;
    if (!d || d.tagName !== "DETAILS" || !d.dataset) return;
    const nuevo = !d.open;
    if (d.dataset.ifzsec != null) {
      IFZ.pref.sec[d.dataset.ifzsec] = nuevo;
      ifzGuardar();
    } else if (d.dataset.ifzanio != null) IFZ.anios[d.dataset.ifzanio] = nuevo;
    else if (d.id === "potd") {
      IFZ.pref.pot = nuevo;
      ifzGuardar();
    }
  },
  true,
);
document.addEventListener(
  "toggle",
  (e) => {
    const d = e.target;
    if (!d || !d.dataset) return;
    if (d.dataset.ifzsec != null) {
      IFZ.pref.sec[d.dataset.ifzsec] = d.open;
      ifzGuardar();
    } else if (d.dataset.ifzanio != null) IFZ.anios[d.dataset.ifzanio] = d.open;
    else if (d.id === "potd") {
      IFZ.pref.pot = d.open;
      ifzGuardar();
    }
  },
  true,
);
(() => {
  const d = $("potd");
  if (d) d.open = IFZ.pref.pot !== false;
})();
const tileAt = (e) => {
  const b = cv.getBoundingClientRect(),
    x = Math.floor(((e.clientX - b.left) / b.width) * W),
    y = Math.floor(((e.clientY - b.top) / b.height) * H);
  const i = MAP.grid[y]?.[x];
  return i === undefined ? -1 : i;
};
cv.addEventListener("click", (e) => {
  if (mp.moved) {
    mp.moved = false;
    return;
  }
  if (!G || busy || BT) return;
  /* CAM: ejércitos del mapa (seleccionar, marchar, asediar, atacar) */
  const cxy = camCasillaEv(e);
  if (cxy && camClic(cxy[0], cxy[1])) return;
  const i = tileAt(e);
  if (i < 0) {
    sel = null;
    aim = 0;
    ui();
    return;
  }
  if (aim && sel !== null && myTurn() && !G.over && MAP.adj[sel].includes(i)) {
    const s = sel,
      f = aim,
      q = G.P[i];
    aim = 0;
    const go = () => {
      busy = true;
      ui();
      march(s, i, f)
        .catch(console.error)
        .finally(() => {
          busy = false;
          if (q.owner === ME) sel = i;
          ui();
          save();
        });
    };
    if (q.owner !== ME && q.owner < REB && !atWar(ME, q.owner)) {
      const tr = G.st[ME][q.owner] === "alianza";
      modal(
        tr ? "¿Traicionar a tu aliado?" : "¿Declarar la guerra?",
        `<p>${q.name} pertenece a ${CIV[q.owner].n}. ${tr ? "Atacar a un aliado es una traición que todos recordarán." : "Atacar significa declarar la guerra."}</p>`,
        [
          {
            t: "Atacar",
            cls: "red",
            fn: () => {
              declareWar(ME, q.owner);
              go();
            },
          },
          { t: "Cancelar" },
        ],
      );
    } else go();
    return;
  }
  aim = 0;
  sel = i;
  if (tab !== "prov") tab = "prov";
  ui();
  /* en móvil, tras tocar una provincia, el panel queda bajo el mapa: se acerca su cabecera */
  if (innerWidth <= 1000) $("tabs")?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
});
/* línea de información bajo el mapa: provincia, dueño, hombres, ánimo (ecoNivel) y asedio; y los
   ejércitos o campamentos de la casilla. (El parche de economía en document/mousemove que añadía
   el ánimo ya no hace falta: ve el nombre del ánimo y no repite nada. Puede retirarse.) */
function ifzHoverTxt(i, ct) {
  const p = G.P[i];
  if (i < 0 || !p) return ct || "Mar";
  let s = `${p.name} · ${CIV[p.owner].s} · ${tot(p.u) * ifzSPU()} hombres`;
  try {
    if (p.owner !== REB && typeof ecoNivel === "function") {
      const a = ecoNivel(p);
      s += ` · ${a.nombre} ${a.icono}`;
    }
    if (typeof camAsedio === "function" && camAsedio(i)) s += " · sitiada";
  } catch (_) {}
  return ct ? `${ct} — ${s}` : s;
}
cv.addEventListener("mousemove", (e) => {
  if (!G) return;
  const i = tileAt(e);
  hover = i < 0 ? null : i;
  /* CAM: casilla bajo el ratón (ruta) y ejércitos o campamentos que haya en ella */
  const cxy = camCasillaEv(e),
    ct = cxy ? camHoverTxt(cxy[0], cxy[1]) : "";
  camHov = cxy ? camIdx(cxy[0], cxy[1]) : -1;
  const tx = ifzHoverTxt(i, ct);
  if ($("hv").textContent !== tx) $("hv").textContent = tx;
});
cv.addEventListener("mouseleave", () => {
  hover = null;
  camHov = -1;
});
document.addEventListener("keydown", (e) => {
  const modalAbierto = $("modal").classList.contains("show");
  if (modalAbierto) {
    if (e.key === "Escape") {
      const b = ifzBotonEscape();
      if (b) {
        e.preventDefault();
        b.click();
      }
    } else if (e.key === "Tab") {
      const fs = [...$("modalc").querySelectorAll("button:not(:disabled),input,select,textarea,summary,[tabindex]:not([tabindex='-1'])")].filter((x) => x.offsetParent !== null);
      if (fs.length) {
        const i = fs.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          fs[fs.length - 1].focus();
        } else if (!e.shiftKey && (i === fs.length - 1 || i < 0)) {
          e.preventDefault();
          fs[0].focus();
        }
      }
    }
    return;
  }
  if (e.target.matches("input,select,textarea")) return;
  /* flechas entre pestañas (patrón tablist) */
  if (e.target.closest && e.target.closest("#tabs") && ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) && G) {
    const ids = pestanas().map((x) => x.id),
      i = ids.indexOf(tab),
      n =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? ids.length - 1
            : (i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + ids.length) % ids.length;
    e.preventDefault();
    tab = ids[n];
    ui();
    $("tabb-" + tab)?.focus();
    return;
  }
  if (e.key === "Escape") {
    aim = 0;
    if (IFZ.res) IFZ.res = false;
    if (G) ui();
  }
  if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
    ifzAyuda();
    return;
  }
  const tapado = $("start").classList.contains("show") || $("battle").classList.contains("show");
  if ((e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey && !e.altKey && !tapado) endTurn();
});

/* ======================= 9. ayuda y tutorial ======================= */
function ifzAyuda() {
  if ($("modal").classList.contains("show") || IFZ.ayuda) return;
  IFZ.ayuda = true;
  modal(
    "¿Cómo se juega?",
    `<div class="ifz-ayuda">
<p><b>Objetivo.</b> Domina 6 de cada 10 provincias del mapa o sé la última dinastía en pie. Si tu soberano muere sin heredero, tu linaje cae.</p>
<p><b>El turno es una estación.</b> Ordena lo que quieras y pulsa <b>Fin de la estación</b> (tecla <kbd>E</kbd>). Al acabar el invierno se cobran impuestos, se paga a las tropas, se investiga y envejece la corte.</p>
<h3>El mapa</h3>
<ul><li>Haz clic en una provincia para verla. La cifra junto a cada ciudad son sus <b>levas</b> (cada leva, ${ifzSPU()} hombres).</li><li>Los <b>estandartes</b> son ejércitos en campaña. Clic en uno tuyo: se ilumina hasta dónde llega esta estación; clic en una casilla para marchar, en una ciudad enemiga (roja) para asediarla.</li><li>Rueda o pellizco para acercar; arrastra para moverte. El minimapa lleva la vista a otro lugar.</li></ul>
<h3>El panel de mando</h3>
<ul><li><b>Provincia</b>: reclutar, formar ejércitos, edificios, gobierno, ánimo e impuestos (las secciones se pliegan y recuerdan cómo las dejaste).</li><li><b>Ejército</b> y <b>Campaña</b>: tus huestes, mandos, asedios y mercenarios.</li><li><b>Dinastía</b>, <b>Corte</b> y <b>Diplomacia</b>: herederos, bodas, consejo, tratados y guerras.</li><li><b>Tesoro</b> y <b>Progreso</b>: economía, comercio, investigación y eras.</li><li><b>Anales</b> y <b>Crónica</b>: la historia de tu linaje y lo que ocurre en el mundo.</li></ul>
<h3>Teclado</h3>
<p><kbd>E</kbd> terminar · <kbd>Esc</kbd> cancelar o cerrar · <kbd>?</kbd> esta ayuda · flechas para cambiar de pestaña.</p></div>`,
    [
      ...(G ? [{ t: "Repetir el tutorial", fn: () => ((IFZ.pref.tut = 0), ifzGuardar()) }] : []),
      { t: "Cerrar", cls: "gold" },
    ],
  ).finally(() => (IFZ.ayuda = false));
}
/* tutorial ligero: una tarjeta no modal sobre el panel, con pasos que avanzan solos */
const IFZ_TUT = [
  {
    t: "Tu reino",
    m: () => `Gobiernas ${CIV[ME].n}. Tus provincias llevan tu color. Toca cualquier provincia del mapa para ver sus tropas, ánimo y edificios en el panel.`,
    ok: (s) => sel != null && sel !== s.sel0,
  },
  {
    t: "Recluta",
    m: () => "En la pestaña Provincia, sección «Reclutar», compra levas con oro en una de tus ciudades. Pasa el ratón sobre cada clase para ver sus fuerzas y debilidades.",
    ok: (s) => owned(ME).reduce((a, p) => a + tot(p.u), 0) > s.tropas0,
  },
  {
    t: "Sal a campaña",
    m: () => "En la sección «Ejército» forma un ejército: aparecerá un estandarte en el mapa. Tócalo y luego una casilla iluminada para marchar.",
    ok: () => !!(G.cam && G.cam.ej && G.cam.ej.some((e) => e.f === ME)),
  },
  {
    t: "Gobierna",
    m: () => "Las pestañas de arriba llevan a la Corte, la Diplomacia, el Tesoro y el Progreso. No hace falta tocarlo todo: empieza por lo que te llame.",
    ok: () => tab !== "prov",
  },
  {
    t: "Pasa la estación",
    m: () => `Cuando termines, pulsa «${ifzTextoFin().replace(" ▶", "")}» (tecla E). Las demás potencias moverán y llegará la estación siguiente.`,
    ok: (s) => G.year !== s.anio0 || G.estacion !== s.est0,
  },
];
const IFZ_TS = {};
function ifzTutorial() {
  const el = $("ifztut");
  if (!el) return;
  const i = IFZ.pref.tut || 0;
  if (net.on || G.over || i >= IFZ_TUT.length) {
    ifzPon("ifztut", "");
    if (!el.hidden) el.hidden = true;
    return;
  }
  /* estado al empezar cada paso, para saber cuándo se ha cumplido */
  if (IFZ_TS.i !== i || IFZ_TS.g !== G) {
    Object.assign(IFZ_TS, { i, g: G, sel0: sel, tropas0: owned(ME).reduce((a, p) => a + tot(p.u), 0), anio0: G.year, est0: G.estacion });
  }
  let ok = false;
  try {
    ok = IFZ_TUT[i].ok(IFZ_TS);
  } catch (_) {}
  if (ok) {
    IFZ.pref.tut = i + 1;
    ifzGuardar();
    return ifzTutorial();
  }
  const P = IFZ_TUT[i];
  if (el.hidden) el.hidden = false;
  ifzPon(
    "ifztut",
    `<div class="ifz-tut-h"><b>Consejo ${i + 1}/${IFZ_TUT.length} · ${P.t}</b></div><p>${P.m()}</p><div class="btns"><button data-act="ifztut-sig">${i + 1 < IFZ_TUT.length ? "Siguiente" : "Entendido"}</button><button data-act="ifztut-fin">Omitir el tutorial</button><button data-act="ifzayuda">¿Cómo se juega?</button></div>`,
  );
}

/* ======================= 10. sprites reemplazables por PNG =======================
   assets/sprites/manifest.json (por http) o assets/sprites/manifest.js (variable global
   OCASO_SPRITES, sirve también en file://) dicen qué sprite de código sustituye cada PNG:
     {"version":1, "sprites": {"SP.castle": {"png":"mapa/SP.castle.png", "w":11, "h":11, "tinte":true, "escala":1}}}
   Nombres: SP.<clave> (nucleo.js), MS.<clave>.<fotograma> (batalla.js), IFZ.<clave> (interfaz),
   TILE.<terreno> (terreno del mapa), ESCENA.fondo (fondo del menú). Ver docs/interfaz.md.
   Si un PNG falta o no carga, se sigue usando el sprite de código. */
const IFZ_SPR = { m: null, img: {}, nom: new Map(), alias: {}, tin: new Map(), ico: {}, inst: false, nSP: 0 };
/* índice: array de filas del sprite → nombre canónico (el primero que lo usa); los demás son alias */
function ifzSprIndexar() {
  const m = new Map(),
    alias = {},
    reg = (n, rows) => {
      if (!Array.isArray(rows) || typeof rows[0] !== "string") return;
      if (m.has(rows)) alias[n] = m.get(rows);
      else m.set(rows, n);
    };
  for (const k in SP) reg("SP." + k, SP[k]);
  if (typeof MS !== "undefined") for (const k in MS) (MS[k] || []).forEach((fr, i) => reg(`MS.${k}.${i}`, fr));
  for (const k in IFZ_SP) reg("IFZ." + k, IFZ_SP[k]);
  IFZ_SPR.nom = m;
  IFZ_SPR.alias = alias;
  IFZ_SPR.nSP = Object.keys(SP).length + (typeof MS !== "undefined" ? Object.keys(MS).length : 0);
}
/* catálogo de todos los sprites (lo usa herramientas/exportar-sprites.js) */
function ifzSprCatalogo() {
  ifzSprIndexar();
  const out = [],
    cat = (n) => {
      if (n.startsWith("MS.")) return "batalla";
      if (n.startsWith("IFZ.tab")) return "interfaz";
      if (n.startsWith("IFZ.")) return "mapa";
      const k = n.slice(3);
      return TYP.includes(k) ? "tropas" : "mapa";
    },
    add = (n, rows) => {
      const tinte = rows.some((r) => /[Ffr]/.test(r));
      out.push({ nombre: n, cat: cat(n), w: Math.max(...rows.map((r) => r.length)), h: rows.length, tinte, alias: IFZ_SPR.alias[n] || null });
    };
  for (const k in SP) add("SP." + k, SP[k]);
  if (typeof MS !== "undefined") for (const k in MS) (MS[k] || []).forEach((fr, i) => add(`MS.${k}.${i}`, fr));
  for (const k in IFZ_SP) add("IFZ." + k, IFZ_SP[k]);
  for (const t of ["mar", "llanura", "bosque", "colina"]) out.push({ nombre: "TILE." + t, cat: "terreno", w: T, h: T, tinte: false, alias: null });
  out.push({ nombre: "ESCENA.fondo", cat: "escena", w: 200, h: 112, tinte: false, alias: null });
  return out;
}
/* filas de un sprite por su nombre */
function ifzSprFilas(n) {
  const [t, k, i] = n.split(".");
  if (t === "SP") return SP[n.slice(3)];
  if (t === "MS") return typeof MS !== "undefined" && MS[k] ? MS[k][+i] : null;
  if (t === "IFZ") return IFZ_SP[n.slice(4)];
  return null;
}
/* pinta un sprite en un lienzo nuevo (escala k); modo 'plantilla' usa los colores clave del tinte
   (#ff00ff = color del pueblo, #800080 = su tono oscuro); si no, la paleta del pueblo f */
function ifzSprRender(n, k = 1, modo = "plantilla", f = 0) {
  const c = document.createElement("canvas"),
    x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  if (n.startsWith("TILE.")) {
    c.width = c.height = T * k;
    const tc = document.createElement("canvas");
    tc.width = tc.height = T;
    ifzTileProc(tc.getContext("2d"), { mar: 0, llanura: 1, bosque: 2, colina: 3 }[n.slice(5)], 0, 0, mul(7), true);
    x.drawImage(tc, 0, 0, c.width, c.height);
    return c;
  }
  if (n === "ESCENA.fondo") {
    c.width = 200 * k;
    c.height = 112 * k;
    const tc = document.createElement("canvas");
    tc.width = 200;
    tc.height = 112;
    ifzEscenaFondo(tc.getContext("2d"), 0, true);
    x.drawImage(tc, 0, 0, c.width, c.height);
    return c;
  }
  const rows = ifzSprFilas(n);
  if (!rows) return c;
  const w = Math.max(...rows.map((r) => r.length));
  c.width = w * k;
  c.height = rows.length * k;
  const pal = Object.assign({}, IFZ_PAL, BP, modo === "plantilla" ? { F: "#ff00ff", f: "#ff00ff", r: "#800080" } : PAL[f]);
  if (n.startsWith("IFZ.tab")) Object.assign(pal, IFZ_PAL);
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === "." || !ch) continue;
      x.fillStyle = pal[ch] || "#f0f";
      x.fillRect(i * k, j * k, k, k);
    }
  });
  return c;
}
/* imagen (PNG ya cargado, teñido si toca) que sustituye a estas filas, o null */
function ifzSprImg(rows, pal) {
  if (!IFZ_SPR.m) return null;
  const n = IFZ_SPR.nom.get(rows);
  if (!n) return null;
  const im = IFZ_SPR.img[n];
  if (!im) return null;
  const e = IFZ_SPR.m.sprites[n];
  if (!e.tinte || !pal || !pal.f) return im;
  const k = n + "|" + pal.f + "|" + pal.r;
  let t = IFZ_SPR.tin.get(k);
  if (t === undefined) {
    t = ifzTenir(im, pal.f, pal.r);
    IFZ_SPR.tin.set(k, t);
  }
  return t || im;
}
const ifzRGB = (() => {
  const c = document.createElement("canvas").getContext("2d");
  return (col) => {
    c.fillStyle = "#000";
    c.fillStyle = col;
    const s = c.fillStyle;
    if (s[0] === "#") return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    const m = s.match(/[\d.]+/g) || [0, 0, 0];
    return m.slice(0, 3).map(Number);
  };
})();
/* tiñe los píxeles magenta del PNG: #ff00ff → color del pueblo, #800080 → su tono oscuro (con
   sombreado intermedio). Devuelve un lienzo o null si el navegador no deja leer el PNG. */
function ifzTenir(im, col, osc) {
  try {
    const c = document.createElement("canvas");
    c.width = im.naturalWidth || im.width;
    c.height = im.naturalHeight || im.height;
    const x = c.getContext("2d");
    x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height),
      a = d.data,
      C = ifzRGB(col),
      D = ifzRGB(osc || col);
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue;
      const r = a[i],
        g = a[i + 1],
        b = a[i + 2];
      if (r < 50 || b < 50 || Math.abs(r - b) > 60 || g > Math.min(r, b) * 0.45) continue;
      const l = (r + b) / 510;
      let o;
      if (l >= 0.5) {
        const s = Math.min(1, (l - 0.5) / 0.5);
        o = [0, 1, 2].map((j) => D[j] + (C[j] - D[j]) * s);
      } else o = D.map((v) => v * (l / 0.5));
      a[i] = o[0];
      a[i + 1] = o[1];
      a[i + 2] = o[2];
    }
    x.putImageData(d, 0, 0);
    return c;
  } catch (e) {
    console.warn("[ifz] no se puede teñir el sprite (¿PNG de otro origen? usa manifest.js con datos)", e.message);
    return null;
  }
}
function ifzSprPintar(c, im, rows, x, y, n, fl) {
  const e = IFZ_SPR.m.sprites[n] || {},
    w = e.w || Math.max(...rows.map((r) => r.length)),
    h = e.h || rows.length,
    sm = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  if (fl) {
    c.save();
    c.translate(x + w, y);
    c.scale(-1, 1);
    c.drawImage(im, 0, 0, w, h);
    c.restore();
  } else c.drawImage(im, x, y, w, h);
  c.imageSmoothingEnabled = sm;
}
/* sustituye spr/sprF/icon por versiones que miran primero el PNG (solo si hay alguno cargado) */
function ifzSprInstalar() {
  if (IFZ_SPR.inst) return;
  IFZ_SPR.inst = true;
  const o1 = spr;
  spr = function (c, rows, x, y, pal) {
    const im = ifzSprImg(rows, pal);
    if (im) return ifzSprPintar(c, im, rows, x, y, IFZ_SPR.nom.get(rows), false);
    return o1(c, rows, x, y, pal);
  };
  if (typeof sprF === "function") {
    const o2 = sprF;
    sprF = function (c, rows, x, y, pal, fl) {
      const im = ifzSprImg(rows, pal);
      if (im) return ifzSprPintar(c, im, rows, x, y, IFZ_SPR.nom.get(rows), fl);
      return o2(c, rows, x, y, pal, fl);
    };
  }
  const o3 = icon;
  icon = function (f, t) {
    const n = IFZ_SPR.nom.get(SP[t]),
      e = n && IFZ_SPR.m.sprites[n];
    if (!e || !IFZ_SPR.img[n] || !(e.escala > 1)) return o3(f, t);
    const k = f + "|" + t;
    if (IFZ_SPR.ico[k]) return IFZ_SPR.ico[k];
    try {
      const s = e.escala,
        c = document.createElement("canvas"),
        x = c.getContext("2d");
      c.width = c.height = 10 * s;
      x.imageSmoothingEnabled = false;
      x.drawImage(ifzSprImg(SP[t], PAL[f]), s, 0, (e.w || SP[t][0].length) * s, (e.h || SP[t].length) * s);
      return (IFZ_SPR.ico[k] = c.toDataURL());
    } catch (_) {
      return o3(f, t);
    }
  };
}
let ifzSprTm = 0;
/* tras cargar PNG: vaciar cachés y redibujar */
function ifzSprRefrescar() {
  clearTimeout(ifzSprTm);
  ifzSprTm = setTimeout(() => {
    for (const k in ICON) delete ICON[k];
    for (const k in IFZ_ICO) delete IFZ_ICO[k];
    IFZ_SPR.ico = {};
    IFZ_SPR.tin.clear();
    IFZ.html = {};
    if (MAP) drawBase();
    if (G) ui();
    if ($("start").classList.contains("show")) renderStart();
  }, 60);
}
/* los nombres que son alias (comparten filas con otro sprite) se desdoblan para poder tener su PNG */
function ifzSprDesdoblar(n) {
  if (!IFZ_SPR.alias[n]) return;
  const [t, k, i] = n.split(".");
  if (t === "SP" && SP[n.slice(3)]) SP[n.slice(3)] = SP[n.slice(3)].slice();
  if (t === "MS" && typeof MS !== "undefined" && MS[k]) {
    MS[k] = MS[k].slice();
    MS[k][+i] = MS[k][+i].slice();
  }
  if (t === "IFZ" && IFZ_SP[n.slice(4)]) IFZ_SP[n.slice(4)] = IFZ_SP[n.slice(4)].slice();
}
function ifzSprAplicar(man) {
  const sp = man && man.sprites;
  if (!sp || !Object.keys(sp).length) return;
  IFZ_SPR.m = { version: man.version || 1, sprites: {} };
  ifzSprIndexar();
  for (const n in sp) ifzSprDesdoblar(n);
  ifzSprIndexar();
  for (const [n, e0] of Object.entries(sp)) {
    const e = { ...e0 },
      src = e.datos || (e.png ? "assets/sprites/" + e.png : null);
    if (!src) continue;
    IFZ_SPR.m.sprites[n] = e;
    const im = new Image();
    im.onload = () => {
      IFZ_SPR.img[n] = im;
      ifzSprInstalar();
      ifzSprRefrescar();
    };
    im.onerror = () => console.warn("[ifz] sprite no encontrado:", n, e.png || "(datos)");
    im.src = src;
  }
}
/* los tipos que se definen al empezar partida (mercenarios) entran en el índice */
OC.on("partidaLista", () => {
  if (!IFZ_SPR.m) return;
  const n = Object.keys(SP).length + (typeof MS !== "undefined" ? Object.keys(MS).length : 0);
  if (n !== IFZ_SPR.nSP) {
    for (const k in IFZ_SPR.m.sprites) ifzSprDesdoblar(k);
    ifzSprIndexar();
  }
});
function ifzSprCargar() {
  const glob = typeof OCASO_SPRITES !== "undefined" ? OCASO_SPRITES : null,
    usar = (m) => ifzSprAplicar(m && m.sprites && Object.keys(m.sprites).length ? m : glob);
  /* en file:// fetch no puede leer el JSON: se usa manifest.js */
  if (location.protocol === "file:" || typeof fetch !== "function") return usar(null);
  fetch("assets/sprites/manifest.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then(usar, () => usar(null));
}
document.addEventListener("DOMContentLoaded", ifzSprCargar);
