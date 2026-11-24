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
  pref: { sec: { reclutar: true, edificios: true }, pot: true, potTodas: false, log: "todo", tut: 0, vel: "lenta", rep: true, iconos: true },
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
  /* online: si ya estás «Listo», el botón ofrece deshacerlo (onlQuitarListo) */
  const quitar = !busy && on && ifzPuedeQuitarListo(),
    eb = $("endb"),
    et = busy ? "Las potencias mueven…" : quitar ? on.quitar || "Quitar listo ✕" : on ? on.boton : G.over ? "Partida terminada" : ifzTextoFin(),
    act = quitar ? "ifzquitar" : "end";
  eb.disabled = quitar ? false : dis;
  if (eb.dataset.act !== act) eb.dataset.act = act;
  eb.classList.toggle("ifz-quitar", !!quitar);
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
   Si no, con estaciones simultáneas (ONL.meta.listos) se muestra «Online · listos 2/3» y «Listo ▶︎». */
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
      boton = myTurn() ? "Listo ▶︎" : "Esperando a los demás…";
    } else {
      info =
        net.cur === ME
          ? "Online · es tu turno"
          : `Online · turno de ${CIV[net.cur]?.s || "—"}${net.names[net.seats[net.cur]] ? " (" + esc(net.names[net.seats[net.cur]]) + ")" : ""}`;
      boton = myTurn() ? "Terminar mi turno ▶︎" : "Esperando al rival…";
    }
    r = { info: r.info || info, boton: r.boton || boton };
  }
  return r;
}
/* ¿está el jugador «Listo» en una estación online que aún no se resuelve? (entonces puede quitarlo) */
function ifzPuedeQuitarListo() {
  try {
    const d = typeof ONL !== "undefined" && ONL && ONL.meta;
    return !!(net.on && typeof onlQuitarListo === "function" && d && d.fase === "ordenes" && !ONL.resolviendo && !d.terminada && (d.listos || {})[ME] === d.turno && !myTurn());
  } catch (_) {
    return false;
  }
}
OC.accion(
  "ifzquitar",
  () => {
    if (!ifzPuedeQuitarListo()) return;
    Promise.resolve(onlQuitarListo())
      .catch(console.error)
      .finally(() => G && ui());
  },
  { libre: true },
);
/* «Fin de la primavera ▶︎» / «Fin del año ▶︎»: el turno es una estación (campaña) */
function ifzTextoFin() {
  try {
    if (typeof camTextoFin === "function") return camTextoFin();
  } catch (e) {
    console.error("[ifz] camTextoFin", e);
  }
  const n = ["la primavera", "l verano", "l otoño", "l invierno"][G.estacion];
  return n ? `Fin de${n} ▶︎` : "Fin del año ▶︎";
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
    if (typeof camAsedio === "function" && camAsedio(p.id)) ch.push('<span class="ifz-chip ifz-mal" title="La ciudad está sitiada">Sitiada</span>');
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
    if (id === "tierras" && typeof ecoFertil === "function" && !busy) {
      const vis = ifzVeProv(p),
        conoc = vis || (typeof ecoInfoConocida === "function" && ecoInfoConocida(p, ME));
      if (!conoc) return "ignotas";
      const r = vis && typeof ecoIconoProv === "function" ? ecoIconoProv(p) : null;
      return `${r ? r.icono + " " : ""}${ecoFertil(p).txt}`;
    }
  } catch (_) {}
  return "";
}
function cline(c) {
  return `<span class="stats">Mando ${c.ma} · Astucia ${c.in} · Diplomacia ${c.di} · Gestión ${c.ge} · ${c.tr}</span>`;
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
  /* figuras, naturaleza y ciudades del mapa */
  h: "#b9bcc6",
  p: "#e3b48a",
  t: "#ececec",
  l: "#6b4a2a",
  C: "#4f321c",
  P: "#c8a070",
  m: "#7a7066",
  M: "#a39a8e",
  z: "#4f4842",
  N: "#f2f4f6",
  Z: "#c9d4dc",
  q: "#7c8850",
  Q: "#a0a86a",
  j: "#5a6638",
  d: "#24502a",
  v: "#367a33",
  V: "#5aa548",
  a: "#7a9a55",
  A: "#a2bb72",
  u: "#4a3220",
  i: "#a8472f",
  I: "#6e2c1e",
  T: "#b89a5a",
  E: "#ece0bc",
  x: "#c9c3b4",
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
  /* estandarte del pueblo (dos fotogramas: ondea) y pendón dorado del general */
  "mapa.estandarte.0": ["kFFFFF.", "kFFFFFF", "kFFrFFF", "kFFFFFF", "kFFFFr.", "krrrr..", "k......", "k......", "k......", "k......", "k......", "k......", "k......"],
  "mapa.estandarte.1": ["k.FFFFF", "kFFFFFF", "kFFrFFF", "kFFFFFF", "k.rFFFF", "k..rrrr", "k......", "k......", "k......", "k......", "k......", "k......", "k......"],
  "mapa.pendon.0": ["kgggg.", "kgFFgg", "kgFFgg", "kggggG", "kGGGG.", "k.....", "k.....", "k.....", "k.....", "k....."],
  "mapa.pendon.1": ["k.gggg", "kgFFgg", "kgFFgg", "kggggG", "k.GGGG", "k.....", "k.....", "k.....", "k.....", "k....."],
  /* figuras de los ejércitos (1 figura ≈ 1 leva de 10 hombres); .0 y .1 = paso */
  "fig.inf.0": ["...t", ".h.l", ".p.l", "FFFl", "FrFl", ".F..", "k.k."],
  "fig.inf.1": ["...t", ".h.l", ".p.l", "FFFl", "FrFl", ".F..", ".k.k"],
  "fig.arq.0": [".h..", ".pl.", "FFFl", "FrFl", ".Fl.", ".F..", "k.k."],
  "fig.arq.1": [".h..", ".pl.", "FFFl", "FrFl", ".Fl.", ".F..", ".k.k"],
  "fig.cab.0": ["...h....", "...p..t.", "..FFFl..", ".nnFnnnn", "nnnnnnC.", ".n...n..", ".k...k.."],
  "fig.cab.1": ["...h....", "...p..t.", "..FFFl..", ".nnFnnnn", "nnnnnnC.", "..n.n...", "..k.k..."],
  "fig.cam.0": ["...h....", "...p.PP.", "..FFFPP.", ".PPFPP..", "PPPPPP..", ".P...P..", ".k...k.."],
  "fig.cam.1": ["...h....", "...p.PP.", "..FFFPP.", ".PPFPP..", "PPPPPP..", "..P.P...", "..k.k..."],
  "fig.ele.0": ["...FF....", "..FFFF...", ".mmmmmmm.", "mmmmmmmmm", "mmmmmmmtm", "mmmmmmm.m", ".mm..mm..", ".zz..zz.."],
  "fig.ele.1": ["...FF....", "..FFFF...", ".mmmmmmm.", "mmmmmmmmm", "mmmmmmmtm", "mmmmmmm.m", "..mm..mm.", "..zz..zz."],
  "fig.maq.0": ["......l", ".....l.", "....l..", "lllllll", ".l...l.", "kk...kk"],
  "fig.maq.1": ["......l", ".....l.", "....l..", "lllllll", ".l...l.", "kk...kk"],
  "fig.espia.0": [".CC.", "CpCC", "CCCC", "CFCC", "CCCC", ".CC.", ".k.k"],
  "fig.espia.1": [".CC.", "CpCC", "CCCC", "CFCC", "CCCC", ".CC.", "k.k."],
  "fig.carro.0": [".EEEE...", "EEEEEE..", "nnnnnnnl", ".k...k.."],
  "fig.carro.1": [".EEEE...", "EEEEEE..", "nnnnnnnl", ".k...k.."],
  /* campamento */
  "mapa.tiendaF": ["...k...", "..FFF..", ".FFkFF.", "FFkkkFF", "rrkkkrr"],
  "mapa.hoguera.0": [".....", "..y..", ".yoy.", ".ooo.", "l.l.l"],
  "mapa.hoguera.1": ["..y..", ".yo..", ".oyo.", ".ooo.", "l.l.l"],
  /* naturaleza */
  "arbol.pino": ["..d..", ".dVd.", ".dvd.", "dVvdd", ".dvd.", "dVvvd", "dvvdd", "..u..", "..u.."],
  "arbol.roble": ["..vvv..", ".vVVvv.", "vVVvvvd", "vVvvvdd", ".vvvdd.", "..dud..", "...u..."],
  "arbol.olivo": [".aAa.", "aAaaa", ".aaa.", "..u..", "..u.."],
  "arbol.abedul": [".VV.", "VVvV", "VvVv", ".vv.", ".x..", ".x.."],
  "mapa.colina": ["....QQqq....", "..QQQqqqjj..", ".QQqqqqqqjj.", "QQqqqqqqqqjj"],
  "mapa.monte": ["......NN......", ".....NNZz.....", "....NNNZzz....", "...MNNZmzzz...", "...MMmmmzzz...", "..MMmmmmmzzz..", "..MMmmmmmzzz..", ".MMmmmmmmmzzz.", ".MMmmmmmmmzzz.", "MMmmmmmmmmmzzz", "MMmmmmmmmmmzzz"],
  /* ciudades y aldeas */
  "mapa.monte2": ["...NN....", "..NNZz...", ".MNmmzz..", ".MMmmmzz.", "MMmmmmzzz", "MMmmmmmzz", "Mmmmmmmzz"],
  "mapa.casa": ["..i..", ".iiI.", "iiiII", ".wWw.", ".wkw."],
  "mapa.casa2": ["..iii.", ".iiiII", "iiiiII", ".wwkW.", ".wwwW."],
  "mapa.torre": ["W.W", "WWW", "WkW", "WWW"],
  "mapa.aldea": [".TT...TT..", "TTTT.TTTT.", ".wk...wkw.", "..........", "...TT.....", "..TTTT....", "...wk....."],
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
/* paleta de interfaz con los colores del pueblo f (F/f = su color, r = su tono oscuro) */
const ifzPal = (f) => IFZ_PALF[f] || (IFZ_PALF[f] = Object.assign({}, IFZ_PAL, { F: CIV[f].c, f: CIV[f].c, r: CIV[f].d }));
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

/* ======================= 5. dibujo del mapa =======================
   El mapa se pinta en #maphd a IFZ_S px por casilla (mapa.js: terreno). Encima, transparente, sigue #map
   (cv, W·T × H·T) para clics, hover y lo que otros sistemas dibujen con ctx (cola de órdenes online).
   Capas: terreno (mapa.js) → política (dueños, campos, caminos, fronteras, ciudades; se rehace solo si
   cambia algo) → cada cuadro: resaltes, banderas, guarniciones, campaña (ejércitos como columnas de
   figuras con movimiento interpolado), efectos y repetición. */
const hd = $("maphd"),
  hctx = hd.getContext("2d");
/* ---------- ritmo de las animaciones ---------- */
const IFZ_VELS = { lenta: 2.5, normal: 1, rapida: 0.45 };
/* multiplicador de tiempo de las animaciones: 2.5 lenta (por defecto), 1 normal, 0.45 rápida.
   0 = sin animación (prefers-reduced-motion o navegador automatizado: las pruebas no esperan). */
function ifzVel() {
  if (reduce) return 0;
  if (IFZ.velForzada != null) return IFZ.velForzada;
  if (typeof navigator !== "undefined" && navigator.webdriver) return 0;
  return IFZ_VELS[IFZ.pref.vel] ?? IFZ_VELS.lenta;
}
const IFZ_VBASE = 4; /* casillas por segundo a velocidad normal */
/* milisegundos que tarda la interfaz en mostrar un paso de una casilla (250 ms × ifzVel(): 625 en lenta).
   Campaña puede esperar esto en cada paso de marcha para que la lógica y el dibujo vayan a la par. */
const ifzPasoMs = () => Math.round((1000 / IFZ_VBASE) * ifzVel());
/* ---------- sprites de interfaz cacheados (y su PNG si lo hay) ---------- */
const IFZ_DC = new Map();
function ifzDibCanvas(n, f, fl) {
  const k = n + "|" + (f == null ? "" : f) + (fl ? "|v" : "");
  let cc = IFZ_DC.get(k);
  if (cc !== undefined) return cc;
  const rows = IFZ_SP[n];
  if (!rows) {
    IFZ_DC.set(k, null);
    return null;
  }
  const pal = f == null ? IFZ_PAL : ifzPal(f),
    im = ifzSprImg(rows, f == null ? null : pal),
    e = im ? IFZ_SPR.m.sprites[IFZ_SPR.nom.get(rows)] || {} : {},
    w = e.w || Math.max(...rows.map((r) => r.length)),
    h = e.h || rows.length;
  cc = document.createElement("canvas");
  cc.width = w;
  cc.height = h;
  const x = cc.getContext("2d");
  x.imageSmoothingEnabled = false;
  if (fl) {
    x.translate(w, 0);
    x.scale(-1, 1);
  }
  if (im) x.drawImage(im, 0, 0, w, h);
  else
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++)
        if (row[i] !== ".") {
          x.fillStyle = pal[row[i]] || "#f0f";
          x.fillRect(i, j, 1, 1);
        }
    });
  IFZ_DC.set(k, cc);
  return cc;
}
/* dibuja el sprite de interfaz n (f = pueblo para teñir, fl = mirando a la izquierda) */
function ifzDib(c, n, x, y, f, fl) {
  const cc = ifzDibCanvas(n, f, fl);
  if (cc) c.drawImage(cc, Math.round(x), Math.round(y));
  return cc;
}
/* ---------- capa política: dueños, campos, caminos, fronteras y ciudades ---------- */
const IFZ_POL = { cv: null, k: "", ms: 0 };
const ifzPob = (p) => {
  try {
    return typeof ecoPob === "function" && G.eco ? ecoPob(p) : 8;
  } catch (_) {
    return 8;
  }
};
const ifzVias = (f) => {
  try {
    return f < NF && typeof camCalzadas === "function" ? camCalzadas(f) : false;
  } catch (_) {
    return false;
  }
};
function ifzPolitico(own) {
  const inf = ifzMapaInfo(),
    ter = ifzTerrenoHD(),
    dues = [...new Set(own)],
    k =
      IFZ_HD.terK +
      "|" +
      own.join(",") +
      "|" +
      G.P.map((p) => `${p.walls || 0}.${p.farm || 0}.${Math.round(ifzPob(p) / 3)}.${p.cap ? 1 : 0}.${ifzTorre(p)}.${p.puerto || 0}.${Object.keys(ifzExpl(p)).join("")}`).join(",") +
      "|" +
      dues.map((f) => (ifzVias(f) ? 1 : 0)).join("") +
      (IFZ.sinCiudades ? "|s" : "");
  if (IFZ_POL.cv && IFZ_POL.k === k) return IFZ_POL.cv;
  const t0 = performance.now(),
    S = IFZ_S,
    cc = IFZ_POL.cv || (IFZ_POL.cv = document.createElement("canvas"));
  if (cc.width !== ter.width || cc.height !== ter.height) {
    cc.width = ter.width;
    cc.height = ter.height;
  }
  const c = cc.getContext("2d");
  c.setTransform(IFZ_HD.r || 1, 0, 0, IFZ_HD.r || 1, 0, 0);
  c.imageSmoothingEnabled = false;
  c.globalAlpha = 1;
  c.drawImage(ter, 0, 0, W * S, H * S);
  /* color del dueño, suave para que se vea el terreno */
  c.globalAlpha = 0.17;
  inf.provT.forEach((ts, pid) => {
    const o = own[pid];
    if (o == null || !CIV[o]) return;
    c.fillStyle = CIV[o].c;
    for (const i of ts) c.fillRect((i % W) * S, ((i / W) | 0) * S, S, S);
  });
  c.globalAlpha = 1;
  /* campos de cultivo alrededor de las ciudades (más con granja y población); con atlas, MAPA.cultivo.* */
  const cultAtlas = ifzAtlHay("cultivo.");
  for (const p of G.P) {
    const rr = mul(MAP.seed * 7 + p.id * 131),
      cand = (inf.provT[p.id] || []).filter((i) => {
        const x = i % W,
          y = (i / W) | 0;
        return MAP.terr[y][x] === 1 && !inf.rio[i] && Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) <= 2 && !(x === p.x && y === p.y);
      });
    if (!cand.length) continue;
    const n = clamp(2 + 2 * (p.farm || 0) + Math.floor(ifzPob(p) / 4), 2, 12);
    if (cultAtlas) {
      const usadas = new Set();
      for (let k2 = 0; k2 < Math.ceil(n / 2); k2++) {
        const i = cand[Math.floor(rr() * cand.length)];
        if (usadas.has(i)) continue;
        usadas.add(i);
        const im = ifzAtlVar("cultivo", ifzHash(i) % 4);
        if (im) c.drawImage(im, (i % W) * S, ((i / W) | 0) * S, S, S);
      }
      continue;
    }
    for (let k2 = 0; k2 < n; k2++) {
      const i = cand[Math.floor(rr() * cand.length)],
        X = (i % W) * S + Math.floor(rr() * 8),
        Y = ((i / W) | 0) * S + Math.floor(rr() * 10),
        w = 6 + Math.floor(rr() * 4),
        h = 4 + Math.floor(rr() * 2),
        tipo = rr(),
        cols = tipo < 0.45 ? ["#c9b458", "#ad9a40"] : tipo < 0.8 ? ["#86b452", "#6b9a3e"] : ["#8b6a44", "#73573a"];
      for (let j = 0; j < h; j++) {
        c.fillStyle = cols[j % 2];
        c.fillRect(X, Y + j, w, 1);
      }
      c.fillStyle = "rgba(60,40,20,.35)";
      c.fillRect(X, Y + h, w, 1);
    }
  }
  /* caminos entre ciudades vecinas (calzadas empedradas si el dueño tiene Calzadas) */
  const vias = {};
  for (const f of dues) vias[f] = ifzVias(f);
  const tramos = [];
  /* relieve v2: los caminos de verdad (MAP.camino), casilla a casilla, con un leve serpenteo */
  if (inf.v2)
    for (let q = 0; q < inf.tramos.length; q += 2) {
      const i = inf.tramos[q],
        j = inf.tramos[q + 1],
        rr = mul(i * 131 + j * 7 + MAP.seed),
        ax = (i % W) * S + S / 2,
        ay = ((i / W) | 0) * S + S / 2,
        bx = (j % W) * S + S / 2,
        by = ((j / W) | 0) * S + S / 2,
        cx = (ax + bx) / 2 + (rr() - 0.5) * 4,
        cy = (ay + by) / 2 + (rr() - 0.5) * 4,
        L = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay))),
        pts = [];
      for (let k2 = 0; k2 <= L; k2++) {
        const t = k2 / L,
          u = 1 - t;
        pts.push([Math.round(u * u * ax + 2 * u * t * cx + t * t * bx), Math.round(u * u * ay + 2 * u * t * cy + t * t * by)]);
      }
      const pa = MAP.grid[(i / W) | 0][i % W],
        pb = MAP.grid[(j / W) | 0][j % W];
      tramos.push({ pts, emp: (pa >= 0 && vias[own[pa]]) || (pb >= 0 && vias[own[pb]]) });
    }
  else
  MAP.adj.forEach((ls, a) =>
    ls.forEach((b) => {
      if (b <= a) return;
      const pa = G.P[a],
        pb = G.P[b];
      if (!pa || !pb) return;
      const ax = pa.x * S + S / 2,
        ay = pa.y * S + S / 2,
        bx = pb.x * S + S / 2,
        by = pb.y * S + S / 2,
        L = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay))),
        rr = mul(a * 977 + b * 31 + MAP.seed),
        cx = (ax + bx) / 2 + (rr() - 0.5) * 14,
        cy = (ay + by) / 2 + (rr() - 0.5) * 14,
        pts = [];
      for (let q = 0; q <= L; q++) {
        const t = q / L,
          u = 1 - t,
          x = u * u * ax + 2 * u * t * cx + t * t * bx,
          y = u * u * ay + 2 * u * t * cy + t * t * by;
        if (!MAP.terr[Math.floor(y / S)]?.[Math.floor(x / S)]) return;
        pts.push([Math.round(x), Math.round(y)]);
      }
      tramos.push({ pts, emp: vias[own[a]] || vias[own[b]] });
    }),
  );
  /* con atlas: autotile por casilla de camino (MAPA.camino.<máscara> / MAPA.calzada.<máscara>) */
  const camAtlas = inf.v2 && (ifzAtlHay("camino.") || ifzAtlHay("calzada."));
  if (camAtlas) {
    tramos.length = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!inf.camino[i]) continue;
        let m = 0;
        for (const [a, b, bit] of IFZ_DIR4) if (x + a >= 0 && y + b >= 0 && x + a < W && y + b < H && inf.camino[(y + b) * W + x + a]) m |= bit;
        const pid = MAP.grid[y][x],
          emp = pid >= 0 && vias[own[pid]],
          im = ifzAtlImg((emp ? "calzada." : "camino.") + m) || ifzAtlImg("camino." + m);
        if (im) c.drawImage(im, x * S, y * S, S, S);
        else ifzCeldaCamino(c, x * S, y * S, m, emp);
      }
  }
  for (const [pas, sel2] of [
    [0, (t) => t.emp],
    [1, (t) => t.emp],
    [2, (t) => !t.emp],
  ])
    for (const t of tramos)
      if (sel2(t))
        for (let q = 0; q < t.pts.length; q++) {
          const [x, y] = t.pts[q];
          if (pas === 0) {
            c.fillStyle = "#6a6152";
            c.fillRect(x - 1, y - 1, 3, 3);
          } else if (pas === 1) {
            c.fillStyle = q % 3 ? "#b9af98" : "#9c927c";
            c.fillRect(x, y, 1, 1);
            c.fillRect(x - (q % 2), y, 1, 1);
          } else if (q % 7 < 6) {
            c.fillStyle = "rgba(160,124,80,.85)";
            c.fillRect(x, y, 2, 2);
            c.fillStyle = "rgba(196,165,118,.8)";
            c.fillRect(x, y, 1, 1);
          }
        }
  /* fronteras: entre reinos, filete oscuro + color del dueño; entre provincias propias, línea fina */
  inf.bordes.forEach((sg, pid) => {
    const o = own[pid];
    if (o == null || !CIV[o]) return;
    for (let q = 0; q < sg.length; q += 5) {
      const x = sg[q],
        y = sg[q + 1],
        w = sg[q + 2],
        h = sg[q + 3],
        j = sg[q + 4];
      if (j < 0) continue;
      const fuera = w === 2 ? (x % S === 0 ? x : x + 1) : x,
        fueraY = h === 2 ? (y % S === 0 ? y : y + 1) : y,
        dentro = w === 2 ? (x % S === 0 ? x + 1 : x) : x,
        dentroY = h === 2 ? (y % S === 0 ? y + 1 : y) : y,
        ww = w === 2 ? 1 : w,
        hh = h === 2 ? 1 : h;
      if (own[j] !== o) {
        c.fillStyle = CIV[o].d;
        c.fillRect(fuera, fueraY, ww, hh);
        c.fillStyle = CIV[o].c;
        c.fillRect(dentro, dentroY, ww, hh);
      } else if (j > pid) {
        c.fillStyle = "rgba(20,15,10,.3)";
        for (let z = 0; z < Math.max(ww, hh); z += 2) c.fillRect(fuera + (ww > 1 ? z : 0), fueraY + (hh > 1 ? z : 0), 1, 1);
      }
    }
  });
  /* edificios del mapa: torre de vigilancia, minas, canteras, aserraderos, salinas y puerto */
  for (const p of G.P)
    for (const [k2, i] of ifzEdificiosProv(p, inf)) {
      const im = ifzAtlImg(k2),
        X = (i % W) * S,
        Y = ((i / W) | 0) * S;
      if (im) c.drawImage(im, X, Y, S, S);
      else ifzCeldaEdif(c, X, Y, k2);
    }
  /* ciudades: casas según la población, murallas según su nivel, castillo o torre en el centro;
     con atlas, MAPA.ciudad.<1-4> / MAPA.capital y MAPA.muralla.<nivel> / MAPA.muralla_capital.<nivel>.
     IFZ.sinCiudades (mapa 3D, js/mapa3d.js): no se pintan, porque allí son edificios en volumen */
  for (const p of G.P) {
    if (IFZ.sinCiudades) break;
    const o = own[p.id],
      X = p.x * S + S / 2,
      Y = p.y * S + S / 2,
      n = clamp(Math.round(ifzPob(p) / 2.2) + (p.cap ? 2 : 0), 2, IFZ_CASAS.length),
      mu = Math.min(3, p.walls || 0),
      pal = PAL[o] || PAL[0],
      nomC = p.cap ? "capital" : "ciudad." + ifzClaseCiudad(n),
      imC = ifzAtlImg(nomC),
      imM = mu ? ifzAtlImg((p.cap ? "muralla_capital." : "muralla.") + mu) : null,
      t = p.cap ? 3 : 2;
    if (imC) {
      c.drawImage(ifzSprTenidoImg(imC, "MAPA." + nomC, pal), X - (t * S) / 2, Y - (t * S) / 2, t * S, t * S);
      if (mu) {
        if (imM) c.drawImage(imM, X - (t * S) / 2, Y - (t * S) / 2, t * S, t * S);
        else ifzMurallaProc(c, X, Y + 1, p.cap ? 19.6 : 12, mu);
      }
      continue;
    }
    if (imM) c.drawImage(imM, X - (t * S) / 2, Y - (t * S) / 2, t * S, t * S);
    ifzCiudadProc(c, X, Y, n, !!p.cap, imM ? 0 : mu, pal, p.id * 7919 + MAP.seed);
  }
  IFZ_POL.k = k;
  IFZ_POL.ms = performance.now() - t0;
  return cc;
}
/* torre de vigilancia y explotaciones de una provincia */
const ifzTorre = (p) => {
  try {
    return typeof tecVision === "function" ? tecVision(p) : +p.torre || 0;
  } catch (_) {
    return +p.torre || 0;
  }
};
const ifzExpl = (p) => {
  try {
    return typeof ecoExplotaciones === "function" && G.eco ? ecoExplotaciones(p) : {};
  } catch (_) {
    return {};
  }
};
/* dónde se dibuja cada edificio de la provincia: [[clave, casilla]] (determinista; una casilla cada uno) */
function ifzEdificiosProv(p, inf) {
  const out = [],
    usadas = new Set([p.y * W + p.x]),
    ts = (inf.provT[p.id] || [])
      .filter((i) => !inf.rio[i] && !inf.mont[i] && !(inf.camino && inf.camino[i]))
      .sort((a, b) => Math.hypot((a % W) - p.x, ((a / W) | 0) - p.y) - Math.hypot((b % W) - p.x, ((b / W) | 0) - p.y) || a - b),
    tr = (i) => MAP.terr[(i / W) | 0][i % W],
    costa = (i) =>
      IFZ_DIR4.some(([a, b]) => {
        const x = (i % W) + a,
          y = ((i / W) | 0) + b;
        return x >= 0 && y >= 0 && x < W && y < H && !MAP.terr[y][x];
      }),
    pon = (k, ok) => {
      const i = ts.find((j) => !usadas.has(j) && ok(j)) ?? ts.find((j) => !usadas.has(j));
      if (i == null) return;
      usadas.add(i);
      out.push([k, i]);
    };
  if (ifzTorre(p) > 0) pon("torre", () => true);
  const ex = ifzExpl(p);
  if (ex.mina) pon("mina", (i) => tr(i) === 3);
  if (ex.cantera) pon("cantera", (i) => tr(i) === 3);
  if (ex.aserradero) pon("aserradero", (i) => tr(i) === 2);
  if (ex.salinas) pon("salinas", costa);
  if ((p.puerto || 0) > 0) {
    /* el puerto, en el mar junto a la ciudad (o en la orilla más cercana de la provincia) */
    const mar = IFZ_DIR4.map(([a, b]) => [p.x + a, p.y + b]).find(([x, y]) => x >= 0 && y >= 0 && x < W && y < H && !MAP.terr[y][x]);
    if (mar) out.push(["puerto", mar[1] * W + mar[0]]);
    else pon("puerto", costa);
  }
  return out;
}
/* PNG teñible del atlas (ciudades, capital) con el color del pueblo */
function ifzSprTenidoImg(im, nombre, pal) {
  const e = (IFZ_SPR.m && IFZ_SPR.m.sprites[nombre]) || {};
  if (!e.tinte || !pal || !pal.f) return im;
  const k = nombre + "|" + pal.f + "|" + pal.r;
  let t = IFZ_SPR.tin.get(k);
  if (t === undefined) {
    t = ifzTenir(im, pal.f, pal.r);
    IFZ_SPR.tin.set(k, t);
  }
  return t || im;
}
/* ---------- ejércitos: columnas de figuras ---------- */
const IFZ_FIG_MAX = 40;
function ifzClase(t) {
  const U = UN[t];
  if (!U) return "inf";
  if (U.asedio) return "maq";
  if (t === "ele" || U.rol === "ele") return "ele";
  if (t === "cam" || U.rol === "cam") return "cam";
  if (U.cl === "cab") return "cab";
  if (U.cl === "dis") return "arq";
  return "inf";
}
/* lista de figuras (1 por leva, entre 3 y IFZ_FIG_MAX), en orden de marcha: jinetes, bestias,
   infantería, arqueros, máquinas y carros de bagaje */
function ifzFiguras(u, n) {
  const c = { cab: 0, ele: 0, cam: 0, inf: 0, arq: 0, maq: 0 };
  let N = 0;
  if (u)
    for (const t in u)
      if (UN[t] && u[t] > 0) {
        c[ifzClase(t)] += u[t];
        N += u[t];
      }
  if (!N && n) {
    N = n;
    c.inf = Math.ceil(n * 0.65);
    c.arq = Math.round(n * 0.2);
    c.cab = Math.max(0, n - c.inf - c.arq);
  }
  if (!N) return [];
  const F = clamp(N, 3, IFZ_FIG_MAX),
    esc = F / N,
    out = [];
  for (const k of ["cab", "ele", "cam", "inf", "arq", "maq"]) {
    const m = c[k] ? Math.max(1, Math.round(c[k] * esc)) : 0;
    for (let q = 0; q < m; q++) out.push(k);
  }
  for (let q = 0; q < Math.floor(out.length / 14); q++) out.push("carro");
  return out.slice(0, IFZ_FIG_MAX + 3);
}
/* formación: filas de 3-6 figuras; la columna se alarga hacia atrás según el sentido de marcha */
function ifzFormacion(kinds, dir) {
  const fil = clamp(Math.ceil(Math.sqrt(kinds.length) * 0.9), 3, 6),
    pos = [];
  let x = 0,
    j = 0,
    paso = 5;
  kinds.forEach((k, q) => {
    const ancha = k === "cab" || k === "cam" || k === "ele" || k === "maq" || k === "carro";
    if (j >= fil || (q && ancha !== pos[q - 1].ancha && j)) {
      x -= paso;
      j = 0;
    }
    paso = ancha ? 8 : 5;
    pos.push({ k, x: x + (j % 2), y: (j - (fil - 1) / 2) * 3, ancha });
    j++;
  });
  const x0 = Math.max(...pos.map((p) => p.x)),
    x1 = Math.min(...pos.map((p) => p.x)),
    mid = (x0 + x1) / 2;
  for (const p of pos) p.x = (p.x - mid) * dir;
  pos.sort((a, b) => a.y - b.y);
  return { pos, largo: x0 - x1 + 8, alto: fil * 3 + 7 };
}
/* posición mostrada de cada ejército: se desliza hacia la real a ritmo de ifzVel() */
const IFZ_POS = new Map();
function ifzPosEj(id, tx, ty, now) {
  let p = IFZ_POS.get(id);
  const v = ifzVel();
  if (!p || v <= 0) {
    p = { x: tx, y: ty, dir: p ? p.dir : 1, t: now, mov: false };
    IFZ_POS.set(id, p);
    p.vis = now;
    return p;
  }
  const dt = Math.min(0.1, Math.max(0, (now - p.t) / 1000)),
    dx = tx - p.x,
    dy = ty - p.y,
    d = Math.hypot(dx, dy),
    sp = (IFZ_VBASE * IFZ_S) / v;
  p.t = now;
  p.vis = now;
  if (d > IFZ_S * 14 || d < 0.4 || d <= sp * dt) {
    p.x = tx;
    p.y = ty;
    p.mov = false;
  } else {
    p.x += (dx / d) * sp * dt;
    p.y += (dy / d) * sp * dt;
    p.mov = true;
    if (Math.abs(dx) > 0.5) p.dir = dx > 0 ? 1 : -1;
  }
  return p;
}
/* un ejército: o = {id, f, u|n, est, gen, sel, quieto}; (X, Y) = ancla en px HD */
function ifzEjercito(c, o, X, Y, now, mov, dir, alfa = 1) {
  const kinds = ifzFiguras(o.u, o.n);
  if (!kinds.length) return;
  const anim = !reduce,
    fr = mov && anim ? Math.floor(now / 160 + o.id) % 2 : 0;
  c.globalAlpha = alfa;
  if (o.est === "campamento") {
    /* campamento: empalizada, tiendas, hoguera y la tropa descansando */
    const nT = clamp(Math.ceil(kinds.length / 7), 2, 6);
    c.fillStyle = "#5b3f22";
    for (let q = -14; q <= 14; q += 2) {
      c.fillRect(X + q, Y - 12, 1, 2);
      c.fillRect(X + q, Y + 7, 1, 2);
    }
    for (let q = -11; q <= 7; q += 2) {
      c.fillRect(X - 15, Y + q, 1, 2);
      c.fillRect(X + 15, Y + q, 1, 2);
    }
    for (let q = 0; q < nT; q++) ifzDib(c, q % 2 ? "mapa.tiendaF" : "mapa.tienda", X - 12 + (q % 3) * 9, Y - 10 + Math.floor(q / 3) * 9, q % 2 ? o.f : null);
    ifzDib(c, "mapa.hoguera." + (anim ? Math.floor(now / 220) % 2 : 0), X + 4, Y - 1, null);
    if (anim)
      for (let q = 0; q < 3; q++) {
        const t = (now / 1400 + q / 3) % 1;
        c.fillStyle = `rgba(200,200,200,${0.45 * (1 - t)})`;
        c.fillRect(X + 6 + Math.round(Math.sin(t * 6 + q) * 2), Y - 2 - Math.round(t * 12), 2, 2);
      }
    const dsc = kinds.slice(0, Math.ceil(kinds.length / 2)).filter((k) => k !== "carro");
    dsc.forEach((k, q) => ifzDib(c, `fig.${k}.0`, X - 12 + (q % 7) * 4, Y + 1 + Math.floor(q / 7) * 3 - 7, o.f, q % 2 === 0));
  } else {
    const F = ifzFormacion(kinds, dir);
    /* polvo detrás de la columna al marchar */
    if (mov && anim)
      for (let q = 0; q < 5; q++) {
        const t = (now / 700 + q / 5) % 1,
          x = X - dir * (F.largo / 2 + 2 + t * 10),
          y = Y + 2 + (q % 3) - t * 3;
        c.fillStyle = `rgba(206,184,132,${0.5 * (1 - t)})`;
        const s = 2 + Math.round(t * 3);
        c.fillRect(Math.round(x), Math.round(y), s, s);
      }
    for (const p of F.pos) {
      const cc = ifzDibCanvas(`fig.${p.k}.${p.k === "maq" || p.k === "carro" ? 0 : (fr + (p.x & 1)) % 2}`, o.f, dir < 0);
      if (cc) c.drawImage(cc, Math.round(X + p.x - cc.width / 2), Math.round(Y + p.y - cc.height + 3));
    }
    /* estandarte del pueblo al frente; pendón del general detrás */
    const ond = anim ? Math.floor(now / 380 + o.id) % 2 : 0,
      bx = X + dir * (F.largo / 2 - 2),
      by = Y - F.alto / 2 - 10;
    ifzDib(c, "mapa.estandarte." + ond, bx - 1, by, o.f);
    if (o.gen) ifzDib(c, "mapa.pendon." + (1 - ond), bx - dir * 8 - 1, by + 2, o.f);
    c.globalAlpha = alfa;
    if (o.est === "asedio") ifzDib(c, "mapa.escala", X - dir * (F.largo / 2 + 4), Y - 6, null);
  }
  c.globalAlpha = 1;
  /* insignia con las levas (gris si ya no puede marchar) */
  const ins = ifzInsignia(o.lev, CIV[o.f].c, o.quieto ? "#9aa0a6" : "#ffffff");
  const z = ifzEscIns();
  c.drawImage(ins, Math.round(X + (o.est === "campamento" ? 12 : 6)), Math.round(Y - 14 - ins.height * z), ins.width * z, ins.height * z);
  if (o.sel && (reduce || Math.floor(now / 350) % 2)) {
    c.strokeStyle = "#f2c14e";
    c.lineWidth = 1;
    c.setLineDash([3, 2]);
    c.beginPath();
    c.ellipse(X, Y - 2, 22, 14, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }
}
/* anillo de cerco alrededor de una ciudad sitiada (con el color del sitiador) */
function ifzCerco(c, p, f, now, alfa = 1) {
  const X = p.x * IFZ_S + IFZ_S / 2,
    Y = p.y * IFZ_S + IFZ_S / 2 + 1,
    R = 24,
    ry = 17,
    n = 44;
  c.globalAlpha = alfa;
  for (let q = 0; q < n; q++) {
    if (q % 11 === 10) continue;
    const a = (q / n) * Math.PI * 2,
      x = Math.round(X + Math.cos(a) * R),
      y = Math.round(Y + Math.sin(a) * ry);
    c.fillStyle = "#4a3220";
    c.fillRect(x, y - 2, 1, 3);
    c.fillStyle = CIV[f] ? CIV[f].d : "#7a2318";
    c.fillRect(x, y - 3, 1, 1);
  }
  for (let q = 0; q < 4; q++) {
    const a = (q / 4) * Math.PI * 2 + 0.4;
    ifzDib(c, "mapa.torre", X + Math.cos(a) * R - 1, Y + Math.sin(a) * ry - 4, null);
  }
  /* fuego y humo sobre la ciudad */
  const fl = reduce ? 0 : Math.floor(now / 200) % 2;
  ifzDib(c, "mapa.hoguera." + fl, X + 3, Y - 12, null);
  if (!reduce)
    for (let q = 0; q < 4; q++) {
      const t = (now / 1600 + q / 4) % 1;
      c.fillStyle = `rgba(70,70,70,${0.55 * (1 - t)})`;
      c.fillRect(X + 5 + Math.round(Math.sin(t * 5 + q) * 3), Y - 13 - Math.round(t * 18), 3, 3);
    }
  c.globalAlpha = 1;
}
/* ---------- recurso principal de cada provincia (economía: ecoIconoProv) ---------- */
const IFZ_REC = { k: "", t: 0, l: [] },
  IFZ_RECI = new Map();
/* ¿puede el jugador ver la economía de la provincia? (niebla: ecoInfoVisible / camVeProv) */
function ifzVeProv(p) {
  try {
    if (typeof ecoInfoVisible === "function") return !!ecoInfoVisible(p, ME);
    if (typeof camVeProv === "function") return !!camVeProv(ME, p.id);
  } catch (_) {}
  return true;
}
/* lista [{p, r}] cacheada (yields es caro): se rehace al cambiar de estación o dueños, o cada 4 s */
function ifzRecProv(now) {
  if (typeof ecoIconoProv !== "function") return [];
  const k = `${G.year}|${G.estacion}|${G.P.reduce((s, p, i) => s + (p.owner + 1) * (i + 3), 0)}|${typeof camVer !== "undefined" ? camVer : 0}`;
  /* nunca mientras se resuelve la estación (busy): yields pasa por OC.calc('rendimiento') de todos los
     sistemas y no debe colarse a mitad de la resolución */
  if ((IFZ_REC.k === k && now - IFZ_REC.t < 4000) || busy || BT) return IFZ_REC.l;
  IFZ_REC.k = k;
  IFZ_REC.t = now;
  IFZ_REC.l = [];
  for (const p of G.P)
    try {
      const r = ifzVeProv(p) ? ecoIconoProv(p) : null;
      if (r) IFZ_REC.l.push({ p, r });
    } catch (_) {}
  return IFZ_REC.l;
}
/* insignia pequeña con el icono del recurso (glifo sobre fondo oscuro), cacheada por icono */
function ifzInsRecurso(ic) {
  let c = IFZ_RECI.get(ic);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = 12;
  c.height = 12;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(11,15,18,.82)";
  x.fillRect(1, 0, 10, 12);
  x.fillRect(0, 1, 12, 10);
  x.fillStyle = "#f2c14e";
  x.font = '10px "Pixelify Sans", system-ui, sans-serif';
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(ic, 6, 6.5);
  IFZ_RECI.set(ic, c);
  return c;
}
/* escala de las insignias numéricas: ×2 con el mapa entero a la vista, ×1 al acercarse */
const ifzEscIns = () => (zoom >= 1.8 ? 1 : 2);
/* ---------- dibujo de cada cuadro ---------- */
function ifzAjustarHD() {
  const R = IFZ_HD.r || ifzR();
  if (hd.width !== W * IFZ_S * R || hd.height !== H * IFZ_S * R) {
    hd.width = W * IFZ_S * R;
    hd.height = H * IFZ_S * R;
  }
  /* se dibuja en coordenadas HD (IFZ_S px por casilla); el lienzo tiene IFZ_R veces más resolución */
  hctx.setTransform(R, 0, 0, R, 0, 0);
}
function drawMap(now) {
  ifzAjustarHD();
  const R = IFZ_REP.on ? IFZ_REP : null,
    own = R ? R.own : G.P.map((p) => p.owner),
    h = hctx,
    S = IFZ_S,
    inf = ifzMapaInfo();
  h.imageSmoothingEnabled = false;
  h.globalAlpha = 1;
  h.drawImage(ifzPolitico(own), 0, 0, W * S, H * S);
  if (!R) {
    /* provincia bajo el ratón y seleccionada */
    for (const [pid, al] of [
      [hover, 0.12],
      [sel, 0.16],
    ]) {
      if (pid == null || !inf.provT[pid]) continue;
      h.globalAlpha = al;
      h.fillStyle = "#fff";
      for (const i of inf.provT[pid]) h.fillRect((i % W) * S, ((i / W) | 0) * S, S, S);
    }
    h.globalAlpha = 1;
    if (sel != null && inf.bordes[sel]) {
      const sg = inf.bordes[sel];
      h.fillStyle = "#fff";
      for (let q = 0; q < sg.length; q += 5) h.fillRect(sg[q], sg[q + 1], sg[q + 2], sg[q + 3]);
    }
    if (aim && sel !== null) {
      h.globalAlpha = reduce ? 0.3 : 0.22 + 0.16 * Math.sin(now / 140);
      h.fillStyle = "#fff";
      for (const j of MAP.adj[sel]) for (const i of inf.provT[j] || []) h.fillRect((i % W) * S, ((i / W) | 0) * S, S, S);
      h.globalAlpha = 1;
    }
  }
  /* banderas de las capitales (ondean), generales y guarniciones */
  const wave = reduce ? 0 : Math.floor(now / 450) % 2;
  for (const p of G.P) {
    const X = p.x * S + S / 2,
      Y = p.y * S + S / 2,
      o = own[p.id];
    if (p.cap && wave && !ifzAtlImg("capital") && !IFZ.sinCiudades) {
      h.save();
      h.scale(2, 2);
      spr(h, SP.castle2, Math.round(X / 2) - 5, Math.round(Y / 2) - 8, PAL[o] || PAL[0]);
      h.restore();
    }
    if (R) continue;
    if (p.gen != null) {
      const g = ifzDibCanvas("mapa.general", null);
      h.drawImage(g, X - 14, Y - 16, g.width * 2, g.height * 2);
    }
    const n = tot(p.u);
    if (n) {
      const ins = ifzInsignia(n, CIV[o].c, p.tired ? "#9aa0a6" : "#ffffff"),
        z = ifzEscIns();
      h.drawImage(ins, X + (p.cap ? 11 : 7), Y - 6 - ins.height * z, ins.width * z, ins.height * z);
    }
  }
  /* recurso principal de cada provincia visible (opción en ⚙︎) */
  if (!R && IFZ.pref.iconos !== false)
    for (const { p, r } of ifzRecProv(now)) {
      const ic = ifzInsRecurso(r.icono);
      h.drawImage(ic, p.x * S + S / 2 - 14 - (p.cap ? 6 : 0), p.y * S + S / 2 + 3);
    }
  /* CAM: campaña (o la repetición de la estación) */
  if (R) ifzRepDibujar(h, now);
  else ifzCamDibujar(now);
  if (anim) {
    const k = Math.min(1, (now - anim.t0) / anim.dur),
      x = anim.x0 + (anim.x1 - anim.x0) * k,
      y = anim.y0 + (anim.y1 - anim.y0) * k - Math.abs(Math.sin(k * Math.PI * 4)) * 2;
    h.save();
    h.scale(IFZ_K, IFZ_K);
    spr(h, SP.i, Math.round(x - 3), Math.round(y - 5), PAL[anim.f]);
    spr(h, SP.c, Math.round(x + 1), Math.round(y - 3), PAL[anim.f]);
    h.restore();
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
      const r = Math.round((3 + k * 10) * IFZ_K);
      h.fillStyle = Math.floor(k * 8) % 2 ? "#fff3b0" : "#ff7a2a";
      for (let a = 0; a < 8; a++) {
        const an = (a * Math.PI) / 4;
        h.fillRect(Math.round(flash.x * IFZ_K + Math.cos(an) * r) - 2, Math.round(flash.y * IFZ_K + Math.sin(an) * r) - 2, 4, 4);
      }
    }
  }
  /* estación en curso */
  if (typeof CAM_EST !== "undefined") {
    const tx = R ? `Repetición · ${CAM_EST[R.rep.est ?? G.estacion] || ""} ${R.rep.anio ?? G.year}` : `${CAM_EST[G.estacion]} ${G.year}`;
    h.font = '12px "Press Start 2P",monospace';
    h.textBaseline = "top";
    const w = Math.ceil(h.measureText(tx).width);
    h.fillStyle = "rgba(0,0,0,.6)";
    h.fillRect(4, 4, w + 12, 20);
    h.fillStyle = R ? "#ffe08a" : G.estacion === 3 ? "#cfe3ff" : "#f2d27a";
    h.fillText(tx, 10, 8);
  }
  /* lienzo lógico (transparente, encima): lo que otros dibujen con ctx (cola de órdenes online) */
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!R && net.on && typeof onlDibujarCola === "function" && typeof ONL !== "undefined" && ONL.cola && ONL.cola.length) onlDibujarCola(now);
}
/* ---------- niebla de guerra en alta resolución ----------
   Con la lógica de campaña (camVisMapa, camExpArr): lo que no se ve queda EN SOMBRA, no en negro: el terreno,
   el color de quien manda cada provincia y un velo (algo más oscuro si nunca se exploró), y sus ciudades con
   el color de su dueño, sin levas ni ejércitos ajenos. Se cachea con la misma clave que campaña. Si falta
   alguna función de campaña, se dibuja camDibujarNiebla escalada (su versión de baja resolución). */
const IFZ_NIEBLA = { cv: null, k: "" };
const ifzNieblaOn = () => typeof camNieblaOn === "function" && camNieblaOn() && ME != null && ME < NF;
/* ¿ve el jugador la casilla? (f = dueño de lo que hay en ella: sus aliados siempre lo ven) */
function ifzVeCasilla(f, x, y) {
  if (!ifzNieblaOn()) return true;
  try {
    if (f != null && f >= 0 && typeof camSocio === "function" && camSocio(ME, f)) return true;
    return typeof camVisible === "function" ? camVisible(ME, x, y) : true;
  } catch (_) {
    return true;
  }
}
function ifzVeloNiebla(c, f, now) {
  if (!ifzNieblaOn() || f !== ME) return;
  if (typeof camVisMapa !== "function" || typeof camExpArr !== "function") {
    if (typeof camDibujarNiebla === "function") {
      c.save();
      c.scale(IFZ_K, IFZ_K);
      camDibujarNiebla(c, now);
      c.restore();
    }
    return;
  }
  const S = IFZ_S,
    V = camVisMapa(f),
    exp = camExpArr(f),
    ter = ifzTerrenoHD(),
    z = ifzEscIns(),
    k = `${V.k}|${f}|${((camS().exp || {})[f] || "").length}|${G.P.map((p) => p.owner).join(",")}|${IFZ_HD.terK}|${z}|${IFZ.sinCiudades ? 1 : 0}`;
  if (IFZ_NIEBLA.k !== k || !IFZ_NIEBLA.cv) {
    const cc = IFZ_NIEBLA.cv || (IFZ_NIEBLA.cv = document.createElement("canvas"));
    const RR = IFZ_HD.r || 1;
    cc.width = W * S * RR;
    cc.height = H * S * RR;
    const x = cc.getContext("2d");
    x.setTransform(RR, 0, 0, RR, 0, 0);
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, W * S, H * S);
    /* CAM: niebla en sombra (no en negro): todo el terreno se ve, con el color de quien manda cada
       provincia y un velo; sin ejércitos ajenos ni levas, solo el dueño de cada ciudad */
    for (let i = 0; i < W * H; i++) {
      if (V.vis[i]) continue;
      const X = (i % W) * S,
        Y = Math.floor(i / W) * S;
      x.drawImage(ter, X * RR, Y * RR, S * RR, S * RR, X, Y, S, S);
      const pid = MAP.grid[Math.floor(i / W)][i % W],
        mo = pid >= 0 && G.P[pid] ? G.P[pid].owner : null;
      if (mo != null && CIV[mo]) {
        x.globalAlpha = 0.2;
        x.fillStyle = CIV[mo].c;
        x.fillRect(X, Y, S, S);
      }
      x.globalAlpha = exp[i] ? 0.38 : 0.5;
      x.fillStyle = "#0c1014";
      x.fillRect(X, Y, S, S);
      x.globalAlpha = 1;
    }
    /* ciudades que no se ven: solo de quién son (en 3D son edificios en volumen) */
    for (const p of IFZ.sinCiudades ? [] : G.P) {
      const i = camIdx(p.x, p.y);
      if (V.vis[i]) continue;
      const o = p.owner,
        X = p.x * S + S / 2,
        Y = p.y * S + S / 2;
      x.globalAlpha = 0.85;
      if (p.cap) {
        x.save();
        x.scale(2, 2);
        spr(x, SP.castle, Math.round(X / 2) - 5, Math.round(Y / 2) - 8, PAL[o] || PAL[0]);
        x.restore();
      } else spr(x, SP.town, X - 4, Y - 6, PAL[o] || PAL[0]);
      x.globalAlpha = 1;
    }
    IFZ_NIEBLA.k = k;
  }
  c.drawImage(IFZ_NIEBLA.cv, 0, 0, W * S, H * S);
}
/* CAM: capa de campaña con la lógica de ejercitos.js/campana.js (alcance, rutas, asedios). */
const IFZ_ALC = { cv: null, k: "" };
function ifzCamDibujar(now) {
  if (typeof camS !== "function" || typeof camAlcance !== "function" || typeof camRutaHover !== "function") return;
  const S0 = camS(),
    c = hctx,
    S = IFZ_S,
    se = camSel != null ? camEj(camSel) : null,
    mio = se && isMe(se.f) && myTurn() && !G.over,
    corner = (X, Y, col) => {
      c.fillStyle = col;
      for (const [a, b, w, h] of [
        [-1, -1, 5, 2],
        [-1, -1, 2, 5],
        [S - 4, -1, 5, 2],
        [S - 1, -1, 2, 5],
        [-1, S - 1, 5, 2],
        [-1, S - 4, 2, 5],
        [S - 4, S - 1, 5, 2],
        [S - 1, S - 4, 2, 5],
      ])
        c.fillRect(X + a, Y + b, w, h);
    };
  /* CAM: niebla de guerra (campana.js), dibujada en HD por la interfaz */
  ifzVeloNiebla(c, ME, now);
  /* alcance (cacheado): relleno suave y contorno dorado */
  if (mio) {
    const D = camAlcance(se),
      k = `${se.id}|${camVer}|${se.mov}|${se.x},${se.y}|${G.estacion}|${W}x${H}`;
    if (IFZ_ALC.k !== k || !IFZ_ALC.cv) {
      const cc = IFZ_ALC.cv || (IFZ_ALC.cv = document.createElement("canvas"));
      const RR = IFZ_HD.r || 1;
      cc.width = W * S * RR;
      cc.height = H * S * RR;
      const x = cc.getContext("2d"),
        ok = (i) => i >= 0 && i < W * H && D.dist[i] <= se.mov + 1e-9;
      x.setTransform(RR, 0, 0, RR, 0, 0);
      x.fillStyle = "rgba(255,236,150,.22)";
      for (let i = 0; i < W * H; i++) if (ok(i) && i !== D.s) x.fillRect((i % W) * S, Math.floor(i / W) * S, S, S);
      x.fillStyle = "#ffd75a";
      for (let i = 0; i < W * H; i++) {
        if (!ok(i)) continue;
        const X = (i % W) * S,
          Y = Math.floor(i / W) * S,
          cx = i % W;
        if (cx === 0 || !ok(i - 1)) x.fillRect(X, Y, 2, S);
        if (cx === W - 1 || !ok(i + 1)) x.fillRect(X + S - 2, Y, 2, S);
        if (!ok(i - W)) x.fillRect(X, Y, S, 2);
        if (!ok(i + W)) x.fillRect(X, Y + S - 2, S, 2);
      }
      IFZ_ALC.k = k;
    }
    c.globalAlpha = reduce ? 0.85 : 0.7 + 0.25 * Math.sin(now / 260);
    c.drawImage(IFZ_ALC.cv, 0, 0, W * S, H * S);
    c.globalAlpha = 1;
    const tgt = (X, Y) => {
      c.globalAlpha = 0.3;
      c.fillStyle = "#ff5a3a";
      c.fillRect(X, Y, S, S);
      c.globalAlpha = 1;
      corner(X, Y, "#ff5a3a");
    };
    for (const p of G.P)
      if (camCiudadCerrada(se.f, p) && CAM_V8.some(([dx, dy]) => D.dist[camIdx(p.x + dx, p.y + dy)] <= se.mov + 1e-9 || (se.x === p.x + dx && se.y === p.y + dy)))
        tgt(p.x * S, p.y * S);
    for (const e of S0.ej) if (camGuerra(se.f, e.f) && D.dist[camIdx(e.x, e.y)] <= se.mov + 1e-9 && (typeof camVeEj !== "function" || camVeEj(ME, e))) tgt(e.x * S, e.y * S); /* CAM: niebla */
    /* ruta hasta la casilla bajo el ratón: huellas con borde; destino marcado */
    const r = camRutaHover(se);
    if (r) {
      const todo = r.dentro.concat(r.fuera);
      todo.forEach((j, q) => {
        const X = (j % W) * S + S / 2,
          Y = Math.floor(j / W) * S + S / 2,
          fuera = q >= r.dentro.length;
        c.fillStyle = "rgba(0,0,0,.55)";
        c.fillRect(X - 3, Y - 3, 6, 6);
        c.fillStyle = fuera ? "rgba(255,243,176,.5)" : "#fff3b0";
        c.fillRect(X - 2, Y - 2, 4, 4);
      });
      const fin = todo[todo.length - 1];
      if (fin != null) corner((fin % W) * S, Math.floor(fin / W) * S, r.fuera.length ? "#e8b632" : "#fff3b0");
    }
  }
  /* huella de la última marcha */
  for (const e of S0.ej) {
    if (!e.pas || !e.pas.length || (typeof camVeEj === "function" && !camVeEj(ME, e))) continue; /* CAM: niebla */
    c.fillStyle = CIV[e.f].d;
    c.globalAlpha = 0.55;
    for (const j of e.pas) {
      c.fillRect((j % W) * S + 6, Math.floor(j / W) * S + 9, 2, 1);
      c.fillRect((j % W) * S + 9, Math.floor(j / W) * S + 7, 2, 1);
    }
    c.globalAlpha = 1;
  }
  /* campamentos mercenarios: tiendas doradas y banderola */
  if (typeof mercS === "function")
    for (const m of mercS().camp)
      if (m.cias.length && (typeof camExplorado !== "function" || camExplorado(ME, m.x, m.y))) { /* CAM: niebla */
        ifzDib(c, "mapa.mercenarios", m.x * S + 1, m.y * S + 4, null);
        ifzDib(c, "mapa.mercenarios", m.x * S + 8, m.y * S + 8, null);
      }
  /* asedios: anillo de cerco, torres, fuego y humo; punto rojo si la ciudad pasa hambre */
  for (const a of Object.values(S0.as)) {
    const p = G.P[a.p];
    if (!p || (typeof camVeProv === "function" && !camVeProv(ME, p.id))) continue; /* CAM: niebla */
    ifzCerco(c, p, a.f, now);
    if (a.vi < 0) {
      c.fillStyle = "#000";
      c.fillRect(p.x * S + 5, p.y * S - 10, 6, 6);
      c.fillStyle = "#e0503f";
      c.fillRect(p.x * S + 6, p.y * S - 9, 4, 4);
    }
  }
  /* CAM: flancos del cerco, flechas, compañeros de asalto conjunto y su animación (campana.js).
     Dibuja en coordenadas lógicas (T px por casilla): se escala al lienzo HD. */
  if (typeof camDibujarCerco === "function") {
    c.save();
    c.scale(IFZ_K, IFZ_K);
    camDibujarCerco(c, now);
    c.restore();
  }
  /* ejércitos (posición interpolada) */
  const ciu = camCiudades(),
    vis = [];
  for (const e of S0.ej) {
    const n = camTot(e.u);
    if (n <= 0 || (typeof camVeEj === "function" && !camVeEj(ME, e))) continue; /* CAM: niebla */
    const enC = ciu.has(camIdx(e.x, e.y)),
      tx = e.x * S + S / 2 - (enC ? 14 : 0),
      ty = e.y * S + S / 2 + 4,
      P = ifzPosEj(e.id, tx, ty, now);
    vis.push({ e, P, n });
  }
  vis.sort((a, b) => a.P.y - b.P.y);
  for (const { e, P, n } of vis)
    ifzEjercito(c, { id: e.id, f: e.f, u: e.u, est: e.est, gen: e.gen != null, sel: e.id === camSel, lev: n, quieto: isMe(e.f) && e.mov <= 0.5 }, P.x, P.y, now, P.mov, P.dir);
  /* limpieza de posiciones de ejércitos que ya no existen */
  if (IFZ_POS.size > S0.ej.length + 8) for (const [id, p] of IFZ_POS) if (now - (p.vis || 0) > 3000) IFZ_POS.delete(id);
}
/* ======================= repetición de la estación ======================= */
const IFZ_REP = { on: false };
/* ifzRepetir(rep) → Promise: reproduce a velocidad acelerada lo ocurrido en la estación (G.cam.rep,
   ver CONTRATO §9). Pinta los dueños de rep.own0 y los ejércitos de rep.ej0 y aplica rep.pasos en
   orden; agrupa las marchas de ejércitos distintos para que se muevan a la vez. Barra con progreso,
   «×2» y «Saltar» (o Escape). Bloquea la interacción mientras dura y luego vuelve al estado real. */
const IFZ_REPD = { mov: 260, "ej+": 200, "ej-": 200, bat: 950, ase: 450, con: 850 };
/* niebla: los pasos que ve el jugador (vh lo incluye, o el paso no trae vh) */
const ifzRepVisibles = (pasos) => pasos.filter((p) => p && (!Array.isArray(p.vh) || p.vh.includes(ME)));
function ifzRepGrupos(pasos) {
  const gs = [];
  let g = null;
  for (const p of pasos) {
    if (!p || !p.k) continue;
    if (p.k === "mov" || p.k === "esp") {
      const id = (p.k === "esp" ? "e" : "") + (p.k === "esp" ? p.esp : p.ej);
      if (!g || g.k !== "mov" || g.ids.has(id)) {
        g = { k: "mov", pasos: [], ids: new Set() };
        gs.push(g);
      }
      g.pasos.push(p);
      g.ids.add(id);
    } else {
      g = null;
      gs.push({ k: p.k, pasos: [p] });
    }
  }
  return gs;
}
function ifzRepetir(rep) {
  if (IFZ_REP.on || !rep || !Array.isArray(rep.pasos) || !rep.pasos.length || !G || !MAP) return Promise.resolve(false);
  if (ifzVel() <= 0 && !IFZ.repForzar) return Promise.resolve(false);
  /* niebla: cada jugador solo ve los pasos cuyo vh lo incluye (sin vh, los ve todos) */
  const gs = ifzRepGrupos(ifzRepVisibles(rep.pasos));
  if (!gs.length) return Promise.resolve(false);
  const raw = gs.reduce((s, g) => s + (IFZ_REPD[g.k] || 200), 0),
    fac = raw > 40000 ? 40000 / raw : raw < 15000 ? Math.min(1.6, 15000 / raw) : 1;
  Object.assign(IFZ_REP, {
    on: true,
    rep,
    own: Array.isArray(rep.own0) && rep.own0.length === G.P.length ? rep.own0.slice() : G.P.map((p) => p.owner),
    ej: new Map(),
    esp: new Map(),
    as: new Map(),
    fx: [],
    gs,
    i: 0,
    fac,
    vel: 1,
    saltar: false,
    total: gs.reduce((s, g) => s + (IFZ_REPD[g.k] || 200) * fac, 0),
    hecho: 0,
  });
  for (const e of rep.ej0 || [])
    if (ifzVeCasilla(e.f, e.x, e.y)) IFZ_REP.ej.set(e.id, { id: e.id, f: e.f, n: e.n, x: e.x, y: e.y, u: e.u || null, est: e.est || "marcha", tw: null });
  ifzRepBarra(true);
  return (async () => {
    try {
      for (const g of gs) {
        if (IFZ_REP.saltar) break;
        const dur = (IFZ_REPD[g.k] || 200) * IFZ_REP.fac;
        ifzRepAplicar(g, performance.now(), dur / IFZ_REP.vel);
        await ifzRepEsperar(dur / IFZ_REP.vel);
        IFZ_REP.hecho += dur;
        IFZ_REP.i++;
        ifzRepBarra();
      }
    } catch (e) {
      console.error("[ifz] repetición", e);
    } finally {
      IFZ_REP.on = false;
      IFZ_REP.ej = new Map();
      IFZ_POS.clear();
      ifzRepBarra(false);
      if (G) ui();
    }
    return true;
  })();
}
function ifzRepEsperar(ms) {
  return new Promise((res) => {
    const t0 = performance.now(),
      tic = () => (IFZ_REP.saltar || performance.now() - t0 >= ms ? res() : setTimeout(tic, 30));
    tic();
  });
}
function ifzRepAplicar(g, now, dur) {
  const R = IFZ_REP;
  /* los ejércitos que desaparecían en el paso anterior se quitan */
  for (const [id, e] of R.ej) if (e.muere) R.ej.delete(id);
  for (const [id, e] of R.esp) if (e.muere) R.esp.delete(id);
  R.fx = R.fx.filter((x) => now - x.t0 < x.dur);
  for (const p of g.pasos) {
    if (p.k === "mov") {
      let e = R.ej.get(p.ej);
      if (!e) {
        e = { id: p.ej, f: p.f, n: 4, x: p.de[0], y: p.de[1], est: "marcha" };
        R.ej.set(p.ej, e);
      }
      e.tw = { fx: e.x, fy: e.y, t0: now, dur: dur * 0.95 };
      e.x = p.a[0];
      e.y = p.a[1];
      e.est = "marcha";
    } else if (p.k === "esp") {
      let e = R.esp.get(p.esp);
      if (!e) {
        e = { id: p.esp, f: p.f, x: p.de[0], y: p.de[1] };
        R.esp.set(p.esp, e);
      }
      e.tw = { fx: e.x, fy: e.y, t0: now, dur: dur * 0.95 };
      e.x = p.a[0];
      e.y = p.a[1];
    } else if (p.k === "esp-") {
      const e = R.esp.get(p.esp);
      if (e) Object.assign(e, { muere: now, mdur: dur });
    } else if (p.k === "ej+") R.ej.set(p.ej, { id: p.ej, f: p.f, n: p.n || 4, u: p.u || null, x: p.x, y: p.y, est: "marcha", nace: now, ndur: dur });
    else if (p.k === "ej-") {
      const e = R.ej.get(p.ej);
      if (e) Object.assign(e, { muere: now, mdur: dur });
    } else if (p.k === "bat") {
      const gana = p.gana != null && CIV[p.gana] ? `vence ${CIV[p.gana].s}` : "";
      R.fx.push({ k: "bat", x: p.x, y: p.y, t0: now, dur: dur * 1.2, txt: [p.lugar || "Batalla", gana].filter(Boolean).join(" · ") });
    } else if (p.k === "ase") {
      if (p.fase === "fin") R.as.delete(p.p);
      else R.as.set(p.p, { f: p.f, t0: now });
    } else if (p.k === "con") {
      if (G.P[p.p] && p.a != null) R.own[p.p] = p.a;
      R.as.delete(p.p);
      R.fx.push({ k: "con", p: p.p, a: p.a, t0: now, dur: dur * 1.1 });
    }
  }
}
/* dibujo de la repetición: cercos, ejércitos deslizándose, batallas y conquistas */
function ifzRepDibujar(c, now) {
  const R = IFZ_REP,
    S = IFZ_S;
  ifzVeloNiebla(c, ME);
  for (const [pid, a] of R.as) if (G.P[pid] && ifzVeCasilla(a.f, G.P[pid].x, G.P[pid].y)) ifzCerco(c, G.P[pid], a.f, now, Math.min(1, (now - a.t0) / 300));
  /* espías: figura embozada que se desliza */
  for (const e of R.esp.values()) {
    let x = e.x,
      y = e.y;
    if (e.tw) {
      const k = Math.min(1, (now - e.tw.t0) / e.tw.dur);
      x = e.tw.fx + (e.x - e.tw.fx) * k;
      y = e.tw.fy + (e.y - e.tw.fy) * k;
    }
    c.globalAlpha = e.muere ? Math.max(0, 1 - (now - e.muere) / (e.mdur || 200)) : 1;
    ifzDib(c, "fig.espia." + (reduce ? 0 : Math.floor(now / 200) % 2), x * S + 6, y * S + 4, e.f);
    c.globalAlpha = 1;
  }
  const vis = [];
  for (const e of R.ej.values()) {
    let x = e.x,
      y = e.y,
      mov = false,
      dir = e.dir || 1;
    if (e.tw) {
      const k = Math.min(1, (now - e.tw.t0) / e.tw.dur);
      if (k < 1) {
        x = e.tw.fx + (e.x - e.tw.fx) * k;
        y = e.tw.fy + (e.y - e.tw.fy) * k;
        mov = true;
        if (e.x !== e.tw.fx) dir = e.dir = e.x > e.tw.fx ? 1 : -1;
      }
    }
    let al = 1;
    if (e.nace) al = Math.min(1, (now - e.nace) / (e.ndur || 200));
    if (e.muere) al = Math.max(0, 1 - (now - e.muere) / (e.mdur || 200));
    vis.push({ e, X: x * S + S / 2, Y: y * S + S / 2 + 4, mov, dir, al });
  }
  vis.sort((a, b) => a.Y - b.Y);
  for (const v of vis) ifzEjercito(c, { id: v.e.id, f: v.e.f, u: v.e.u, n: v.e.n, est: v.e.est, lev: v.e.n || camTot(v.e.u || {}) }, v.X, v.Y, now, v.mov, v.dir, v.al);
  /* efectos */
  for (const x of R.fx) {
    const k = (now - x.t0) / x.dur;
    if (k < 0 || k > 1) continue;
    if (x.k === "bat") {
      const X = x.x * S + S / 2,
        Y = x.y * S + S / 2;
      /* chispazos */
      c.fillStyle = Math.floor(now / 70) % 2 ? "#fff3b0" : "#ff7a2a";
      for (let a = 0; a < 10; a++) {
        const an = a * 0.63 + k * 3,
          r = 4 + ((a * 7) % 9) * k * 1.4;
        c.fillRect(Math.round(X + Math.cos(an) * r), Math.round(Y + Math.sin(an) * r), 2, 2);
      }
      /* humo */
      for (let q = 0; q < 5; q++) {
        c.fillStyle = `rgba(90,90,90,${0.5 * (1 - k)})`;
        c.fillRect(Math.round(X - 6 + q * 3), Math.round(Y - 6 - k * 14 - (q % 2) * 3), 4, 4);
      }
      /* rótulo */
      c.font = '10px "Press Start 2P",monospace';
      c.textBaseline = "top";
      const w = Math.ceil(c.measureText(x.txt).width) + 10,
        bx = Math.round(clamp(X - w / 2, 2, W * IFZ_S - w - 2)),
        by = Math.round(Math.max(2, Y - 34));
      c.globalAlpha = Math.min(1, (1 - k) * 4);
      c.fillStyle = "rgba(10,12,16,.85)";
      c.fillRect(bx, by, w, 16);
      c.fillStyle = "#f2c14e";
      c.fillRect(bx, by + 15, w, 1);
      c.fillStyle = "#fff";
      c.fillText(x.txt, bx + 5, by + 4);
      c.globalAlpha = 1;
    } else if (x.k === "con" && G.P[x.p] && ifzVeCasilla(-1, G.P[x.p].x, G.P[x.p].y)) {
      const p = G.P[x.p],
        X = p.x * S + S / 2,
        Y = p.y * S + S / 2,
        r = 6 + k * 26;
      c.strokeStyle = CIV[x.a] ? CIV[x.a].c : "#fff";
      c.globalAlpha = 1 - k;
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(X, Y, r, r * 0.75, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#fff";
      c.globalAlpha = Math.max(0, 0.5 - k);
      for (const i of ifzMapaInfo().provT[x.p] || []) c.fillRect((i % W) * S, ((i / W) | 0) * S, S, S);
      c.globalAlpha = 1;
      c.lineWidth = 1;
    }
  }
}
/* barra de la repetición (y bloqueo de la interacción) */
function ifzRepBarra(abrir) {
  const b = $("ifzrep");
  if (!b) return;
  if (abrir === false) {
    b.hidden = true;
    b.innerHTML = "";
    return;
  }
  const R = IFZ_REP,
    pc = R.total ? Math.round((R.hecho / R.total) * 100) : 0;
  if (abrir) {
    b.hidden = false;
    const est = typeof CAM_EST !== "undefined" ? CAM_EST[R.rep.est ?? G.estacion] : "";
    b.innerHTML = `<div class="ifz-repbar" role="status" aria-live="polite"><b>Repetición · ${est ? est.toLowerCase() + " de " : ""}${R.rep.anio ?? G.year}</b><span class="ifz-repprog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></span><button data-act="ifzrep-x2" id="ifzrepx2" aria-pressed="false">×2</button><button data-act="ifzrep-saltar" class="gold">Saltar ▶︎▶︎</button></div>`;
    setTimeout(() => b.querySelector('[data-act="ifzrep-saltar"]')?.focus({ preventScroll: true }), 30);
  }
  const i = b.querySelector(".ifz-repprog i"),
    pr = b.querySelector(".ifz-repprog");
  if (i) i.style.width = pc + "%";
  if (pr) pr.setAttribute("aria-valuenow", pc);
}
OC.accion(
  "ifzrep",
  (v) => {
    if (!IFZ_REP.on) return false;
    if (v === "saltar") IFZ_REP.saltar = true;
    if (v === "x2") {
      IFZ_REP.vel = IFZ_REP.vel >= 4 ? 1 : IFZ_REP.vel * 2;
      const b = $("ifzrepx2");
      if (b) {
        b.textContent = IFZ_REP.vel >= 4 ? "×1" : "×" + IFZ_REP.vel * 2;
        b.setAttribute("aria-pressed", IFZ_REP.vel > 1 ? "true" : "false");
      }
    }
    return false;
  },
  { libre: true },
);

/* en un jugador: cuando Campaña cierra la repetición de la estación (evento repeticionLista, con lo
   anual y las marchas pendientes incluidas) */
OC.on("repeticionLista", async (rep) => {
  if (!G || net.on || IFZ.pref.rep === false) return;
  rep = rep || (G.cam && G.cam.rep);
  if (rep && Array.isArray(rep.pasos) && rep.pasos.length) await ifzRepetir(rep);
});
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
  x.drawImage(hd, 0, 0, m.width, m.height);
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
      const t0 = performance.now();
      drawMap(now);
      const ms = performance.now() - t0;
      IFZ.medMapa = IFZ.medMapa ? IFZ.medMapa * 0.95 + ms * 0.05 : ms;
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
  zoomAt(w, $("mapcapas"), zoom, cx, cy);
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
  $("mapcapas").style.width = zoom * 100 + "%";
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
  if (a === "ifzopc") {
    ifzOpciones();
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
    const deTabs = !!b.closest("#tabs"),
      panel = document.querySelector(".wrap > aside");
    tab = v;
    ui();
    /* otra pestaña: el panel vuelve arriba (el mapa no se mueve) */
    if (panel) panel.scrollTop = 0;
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
  if (!G || busy || BT || IFZ_REP.on) return;
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
/* nombre del terreno de una casilla (relieve de Mundo: mapaInfo) */
function ifzTerrenoTxt(x, y) {
  if (typeof mapaInfo !== "function" || x == null) return "";
  try {
    const m = mapaInfo(x, y);
    if (m.montana) return "Montaña infranqueable";
    if (m.puente) return "Puente";
    if (m.vado) return "Vado";
    if (m.rio) return "Río";
    if (m.paso) return "Paso de montaña";
    if (m.bosque) return "Bosque denso";
    const n = { llanura: "Llanura", bosque: "Bosque", colina: "Colinas" }[m.tipo] || "";
    return n && m.camino ? n + " con camino" : n;
  } catch (_) {
    return "";
  }
}
function ifzHoverTxt(i, ct, xy) {
  const p = G.P[i];
  if (i < 0 || !p) return ct || "Mar";
  const tr = xy ? ifzTerrenoTxt(xy[0], xy[1]) : "";
  /* CAM: niebla: de una provincia que no se ve solo se sabe quién manda (camHoverTxt ya lo dice) */
  if (typeof camProvOculta === "function" && camProvOculta(p)) return ct || `${p.name}${tr ? " · " + tr : ""} · ${CIV[p.owner] ? CIV[p.owner].s : "sin dueño"}`;
  let s = `${p.name}${tr ? " · " + tr : ""} · ${CIV[p.owner].s} · ${tot(p.u) * ifzSPU()} hombres`;
  try {
    if (p.owner !== REB && typeof ecoNivel === "function") {
      const a = ecoNivel(p);
      s += ` · ${a.nombre} ${a.icono}`;
    }
    if (typeof camAsedio === "function" && camAsedio(i)) s += " · sitiada";
    if (!busy && typeof ecoIconoProv === "function" && ifzVeProv(p)) {
      const r = ecoIconoProv(p);
      if (r) s += ` · ${r.icono} ${r.nombre}`;
    }
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
  const tx = ifzHoverTxt(i, ct, cxy);
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
  if (e.key === "Escape" && IFZ_REP.on) {
    IFZ_REP.saltar = true;
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
<ul><li>Haz clic en una provincia para verla. La cifra junto a cada ciudad son sus <b>levas</b> (cada leva, ${ifzSPU()} hombres).</li><li>Las <b>columnas de soldados con estandarte</b> son ejércitos en campaña (cada figurita, unos 10 hombres; el pendón dorado, su general). Clic en uno tuyo: se ilumina hasta dónde llega esta estación; clic en una casilla para marchar, en una ciudad enemiga (roja) para asediarla.</li><li>Rueda o pellizco para acercar; arrastra para moverte. El minimapa lleva la vista a otro lugar.</li></ul>
<h3>El panel de mando</h3>
<ul><li><b>Provincia</b>: reclutar, formar ejércitos, edificios, gobierno, ánimo e impuestos (las secciones se pliegan y recuerdan cómo las dejaste).</li><li><b>Ejército</b> y <b>Campaña</b>: tus huestes, mandos, asedios y mercenarios.</li><li><b>Dinastía</b>, <b>Corte</b> y <b>Diplomacia</b>: herederos, bodas, consejo, tratados y guerras.</li><li><b>Tesoro</b> y <b>Progreso</b>: economía, comercio, investigación y eras.</li><li><b>Anales</b> y <b>Crónica</b>: la historia de tu linaje y lo que ocurre en el mundo.</li></ul>
<h3>Teclado</h3>
<p>En <b>⚙︎ Opciones</b>: la velocidad de las animaciones y la repetición de cada estación (a velocidad acelerada, con «Saltar» y «×2»).</p><p><kbd>E</kbd> terminar · <kbd>Esc</kbd> cancelar, cerrar o saltar la repetición · <kbd>?</kbd> esta ayuda · flechas para cambiar de pestaña.</p></div>`,
    [
      ...(G ? [{ t: "Repetir el tutorial", fn: () => ((IFZ.pref.tut = 0), ifzGuardar()) }] : []),
      { t: "Cerrar", cls: "gold" },
    ],
  ).finally(() => (IFZ.ayuda = false));
}
/* opciones: velocidad de las animaciones, repetición de la estación, música y tutorial */
function ifzOpciones() {
  if ($("modal").classList.contains("show")) return;
  const v = IFZ.pref.vel || "lenta",
    bt = (act, on, t, d) => `<button data-act="${act}" class="${on ? "on" : ""}" aria-pressed="${on}">${t}${d ? `<small>${d}</small>` : ""}</button>`;
  modal(
    "Opciones",
    `<div class="ifz-opc">
<h3>Velocidad de animación</h3><p class="dim">Lo que tardan en desplazarse los ejércitos por el mapa. Lenta da la sensación de mover huestes enormes por distancias largas.</p>
<div class="g3" role="group" aria-label="Velocidad de animación">${bt("ifzvel-lenta", v === "lenta", "Lenta", "épica")}${bt("ifzvel-normal", v === "normal", "Normal")}${bt("ifzvel-rapida", v === "rapida", "Rápida")}</div>
<h3>Repetición de la estación</h3><p class="dim">Al terminar cada estación, ver a velocidad acelerada las marchas, batallas, asedios y conquistas de todas las potencias.</p>
<div class="g2" role="group" aria-label="Repetición de la estación">${bt("ifzrepo-1", IFZ.pref.rep !== false, "Sí")}${bt("ifzrepo-0", IFZ.pref.rep === false, "No")}</div>
<h3>Recursos en el mapa</h3><p class="dim">Un icono pequeño con el recurso principal de cada provincia que ves.</p>
<div class="g2" role="group" aria-label="Recursos en el mapa">${bt("ifzico-1", IFZ.pref.iconos !== false, "Mostrar")}${bt("ifzico-0", IFZ.pref.iconos === false, "Ocultar")}</div>
<h3>Música y ayuda</h3><div class="btns"><button class="music" data-act="music">♪ Música</button><button data-act="ifztut-otra">Repetir el tutorial</button></div></div>`,
    [{ t: "Cerrar", cls: "gold" }],
  );
}
/* marca el botón pulsado dentro de un grupo del modal de opciones */
function ifzMarcar(b) {
  const g = b && b.closest("[role=group]");
  if (!g) return;
  for (const x of g.querySelectorAll("button")) {
    x.classList.toggle("on", x === b);
    x.setAttribute("aria-pressed", x === b ? "true" : "false");
  }
}
OC.accion(
  "ifzvel",
  (v, b) => {
    if (!IFZ_VELS[v]) return false;
    IFZ.pref.vel = v;
    ifzGuardar();
    ifzMarcar(b);
    return false;
  },
  { libre: true },
);
OC.accion(
  "ifzico",
  (v, b) => {
    IFZ.pref.iconos = v === "1";
    ifzGuardar();
    ifzMarcar(b);
    return false;
  },
  { libre: true },
);
OC.accion(
  "ifzrepo",
  (v, b) => {
    IFZ.pref.rep = v === "1";
    ifzGuardar();
    ifzMarcar(b);
    return false;
  },
  { libre: true },
);
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
    m: () => `Cuando termines, pulsa «${ifzTextoFin().replace(" ▶︎", "")}» (tecla E). Las demás potencias moverán y llegará la estación siguiente.`,
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
      if (/^IFZ\.(fig\.|mapa\.(estandarte\.|pendon|tiendaF|hoguera))/.test(n)) return "ejercito";
      if (/^IFZ\.(arbol\.|mapa\.(colina|monte))/.test(n)) return "naturaleza";
      if (/^IFZ\.mapa\.(casa|torre|aldea)/.test(n)) return "ciudad";
      if (n.startsWith("IFZ.")) return "mapa";
      const k = n.slice(3);
      return TYP.includes(k) ? "tropas" : "mapa";
    },
    add = (n, rows) => {
      const tinte = n.startsWith("IFZ.") ? rows.some((r) => /[Ff]/.test(r)) : rows.some((r) => /[Ffr]/.test(r));
      out.push({ nombre: n, cat: cat(n), w: Math.max(...rows.map((r) => r.length)), h: rows.length, tinte, alias: IFZ_SPR.alias[n] || null });
    };
  for (const k in SP) add("SP." + k, SP[k]);
  if (typeof MS !== "undefined") for (const k in MS) (MS[k] || []).forEach((fr, i) => add(`MS.${k}.${i}`, fr));
  for (const k in IFZ_SP) add("IFZ." + k, IFZ_SP[k]);
  for (const t of IFZ_TILE) out.push({ nombre: "TILE." + t, cat: "terreno", w: IFZ_S, h: IFZ_S, tinte: false, alias: null });
  out.push({ nombre: "ESCENA.fondo", cat: "escena", w: 200, h: 112, tinte: false, alias: null });
  /* kit de mapa: el atlas completo (MAPA.* y los sprites de interfaz del mapa) */
  for (const a of ifzAtlas())
    out.push({ nombre: a.nombre, cat: "atlas", grupo: a.grupo, w: a.px ? a.px[0] : a.w * IFZ_S, h: a.px ? a.px[1] : a.h * IFZ_S, tinte: a.nombre.startsWith("IFZ.") ? IFZ_SP[a.nombre.slice(4)].some((r) => /[Ff]/.test(r)) : a.tinte, opaco: a.opaco, alias: null });
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
    c.width = c.height = IFZ_S * k;
    const tc = document.createElement("canvas");
    tc.width = tc.height = IFZ_S;
    ifzTeselaSuelta(tc.getContext("2d"), n.slice(5));
    x.drawImage(tc, 0, 0, c.width, c.height);
    return c;
  }
  if (n.startsWith("MAPA.")) {
    const a = ifzAtlas().find((x) => x.nombre === n);
    if (!a) return c;
    const tc = document.createElement("canvas");
    tc.width = a.w * IFZ_S;
    tc.height = a.h * IFZ_S;
    const tx = tc.getContext("2d");
    tx.imageSmoothingEnabled = false;
    a.dib(tx, 0, 0);
    c.width = tc.width * k;
    c.height = tc.height * k;
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
  const civ = modo === "plantilla" ? { F: "#ff00ff", f: "#ff00ff", r: "#800080" } : { F: CIV[f].c, f: CIV[f].c, r: CIV[f].d },
    esIfz = n.startsWith("IFZ."),
    tinte = esIfz && rows.some((r) => /[Ff]/.test(r)),
    pal = esIfz ? Object.assign({}, IFZ_PAL, tinte ? civ : {}) : Object.assign({}, BP, modo === "plantilla" ? civ : PAL[f]);
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
    IFZ_DC.clear();
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
    const hoja = n === "MAPA.atlas" && e.celdas;
    /* una hoja entera del atlas: sus celdas se registran como si fueran PNG sueltos */
    if (hoja)
      for (const [nc, cel] of Object.entries(e.celdas)) {
        const esc = e.escala || 1;
        if (!IFZ_SPR.m.sprites[nc]) IFZ_SPR.m.sprites[nc] = { w: Math.round(cel[2] / esc), h: Math.round(cel[3] / esc), tinte: !!cel[4] };
      }
    else IFZ_SPR.m.sprites[n] = e;
    const im = new Image();
    im.onload = () => {
      if (hoja)
        for (const [nc, cel] of Object.entries(e.celdas)) {
          if (IFZ_SPR.img[nc]) continue; /* un PNG suelto manda sobre la hoja */
          const cc = document.createElement("canvas");
          cc.width = cel[2];
          cc.height = cel[3];
          cc.getContext("2d").drawImage(im, cel[0], cel[1], cel[2], cel[3], 0, 0, cel[2], cel[3]);
          IFZ_SPR.img[nc] = cc;
        }
      else IFZ_SPR.img[n] = im;
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
