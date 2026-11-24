/* ---------- MENÚ DE PAUSA: Reanudar · Guardar · Cargar · Opciones · Salir ----------
   Botón «Menú» de la cabecera (o la tecla Esc). Pausa la batalla en tiempo real mientras está abierto.
   - Guardar: tres ranuras (localStorage «ocaso-ranura-1..3») además del guardado automático («ocaso-save»),
     y exportar a un archivo .json. Online solo guarda el ANFITRIÓN (una copia de la partida en este
     dispositivo; la partida online sigue guardada en el servidor). Cargar una copia online la continúa en
     solitario contra la IA.
   - Cargar: ranuras, guardado automático o un archivo.
   - Opciones (también el botón ⚙︎): General (idioma, tamaño del texto, sangre, y las de juego de siempre),
     Audio (volúmenes) y Vídeo (calidad y sus ajustes sueltos). Se guardan en OPC (js/opciones.js).
   Globales con prefijo menu / MENU. */
const MENU = { vista: "raiz", pest: "general", pausaPrev: null };
const MENU_RANURAS = [1, 2, 3];
const MENU_PRESETS = {
  alta: { sombras: true, sombrasSuaves: true, resolucion: 1, vegetacion: "alta", figuras: "alta", efectos: true, niebla3d: true },
  media: { sombras: true, sombrasSuaves: false, resolucion: 0.85, vegetacion: "media", figuras: "media", efectos: true, niebla3d: true },
  baja: { sombras: false, sombrasSuaves: false, resolucion: 0.7, vegetacion: "baja", figuras: "baja", efectos: false, niebla3d: false },
};

/* ---------- guardado ---------- */
const menuEsHost = () => typeof net !== "undefined" && net.on && typeof ONL !== "undefined" && ONL.meta && ONL.meta.host === net.uid;
function menuPuedeGuardar() {
  if (!G || G.over) return { ok: false, motivo: "No hay una partida en curso" };
  if (BT) return { ok: false, motivo: "Termina antes la batalla" };
  if (typeof net !== "undefined" && net.on && !menuEsHost()) return { ok: false, motivo: "En las partidas online solo guarda el anfitrión" };
  return { ok: true };
}
function menuFoto() {
  return {
    v: 1,
    G,
    ME,
    t: Date.now(),
    civ: CIV[ME] ? CIV[ME].n : "",
    anio: G.year,
    est: G.estacion,
    online: typeof net !== "undefined" && net.on ? { id: net.id || null, nombre: (ONL.meta && ONL.meta.name) || "" } : null,
  };
}
function menuGuardar(n) {
  const p = menuPuedeGuardar();
  if (!p.ok) return p;
  try {
    localStorage.setItem("ocaso-ranura-" + n, JSON.stringify(menuFoto()));
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: "No cabe en el almacenamiento del navegador: exporta a un archivo" };
  }
}
function menuLeer(clave) {
  try {
    const s = JSON.parse(localStorage.getItem(clave) || "null");
    return s && s.G ? s : null;
  } catch (_) {
    return null;
  }
}
const MENU_EST = ["Primavera", "Verano", "Otoño", "Invierno"];
function menuDesc(s) {
  if (!s) return "Vacía";
  const est = typeof CAM_EST !== "undefined" ? CAM_EST[s.G.estacion] : MENU_EST[s.G.estacion] || "";
  const civ = s.civ || (CIV[s.ME] && CIV[s.ME].n) || "";
  const f = s.t ? new Date(s.t).toLocaleString() : "";
  return `${esc(civ)} · ${esc(est || "")} ${s.G.year} d.C.${s.online ? " · online" : ""}${f ? `<br><small class="dim">${esc(f)}</small>` : ""}`;
}
/* carga una foto {G, ME}: como «Continuar» de la pantalla de inicio */
function menuCargarFoto(s) {
  if (!s || !s.G) return false;
  try {
    if (typeof leaveNet === "function") leaveNet();
    if (BT && typeof finishBattle === "function") BT = null;
    G = s.G;
    ME = s.ME;
    if (G.online) delete G.online;
    MAP = gen(G.seed, G.mapa);
    drawBase();
    OC.emitirSync("partidaLista");
    sel = G.F[ME].capId;
    $("start").classList.remove("show");
    menuCerrar();
    centerOn(sel);
    ui();
    startTurn();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
function menuExportar() {
  const p = menuPuedeGuardar();
  if (!p.ok) return p;
  const s = menuFoto(),
    b = new Blob([JSON.stringify(s)], { type: "application/json" }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = `ocaso-${(s.civ || "partida").replace(/\s+/g, "-").toLowerCase()}-${s.G.year}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
  return { ok: true };
}

/* ---------- pantalla ---------- */
function menuDom() {
  let o = document.getElementById("mpausa");
  if (o) return o;
  o = document.createElement("div");
  o.className = "over";
  o.id = "mpausa";
  o.setAttribute("role", "dialog");
  o.setAttribute("aria-modal", "true");
  o.innerHTML = '<div class="card mp-card" id="mpc"></div>';
  document.body.appendChild(o);
  o.addEventListener("click", menuClic);
  o.addEventListener("input", menuInput);
  o.addEventListener("change", menuCambio);
  return o;
}
function menuAbierto() {
  const o = document.getElementById("mpausa");
  return !!o && o.classList.contains("show");
}
function menuAbrir(vista = "raiz") {
  const o = menuDom();
  MENU.vista = vista;
  if (!menuAbierto()) {
    MENU.pausaPrev = BT ? !!BT.paused : null;
    if (BT) BT.paused = true;
  }
  o.classList.add("show");
  menuPintar();
  setTimeout(() => o.querySelector("button")?.focus({ preventScroll: true }), 0);
}
function menuCerrar() {
  const o = document.getElementById("mpausa");
  if (!o || !o.classList.contains("show")) return;
  o.classList.remove("show");
  if (BT && MENU.pausaPrev !== null) BT.paused = MENU.pausaPrev;
  MENU.pausaPrev = null;
}
const mpB = (k, t, o = {}) => `<button data-mp="${k}" class="${o.cls || ""}" ${o.dis ? "disabled" : ""} ${o.tit ? `title="${esc(o.tit)}"` : ""}>${t}</button>`;
function menuPintar(aviso) {
  const c = document.getElementById("mpc");
  if (!c) return;
  const v = MENU.vista,
    av = aviso ? `<p class="mp-aviso">${aviso}</p>` : "";
  let h = "";
  if (v === "raiz") {
    const pg = menuPuedeGuardar();
    h = `<h2>Menú</h2>${av}<div class="mp-lista">
${mpB("reanudar", "Reanudar", { cls: "gold" })}
${mpB("v-guardar", "Guardar", { dis: !pg.ok, tit: pg.ok ? "" : pg.motivo })}
${mpB("v-cargar", "Cargar")}
${mpB("v-opciones", "Opciones")}
${mpB("salir", "Salir")}</div>${!pg.ok && G ? `<p class="dim">${esc(pg.motivo)}</p>` : ""}`;
  } else if (v === "guardar") {
    const host = menuEsHost();
    h = `<h2>Guardar</h2>${av}${host ? '<p class="dim">Eres el anfitrión: guardas una copia de la partida online en este dispositivo (la partida sigue también en el servidor). Cargarla la continúa en solitario.</p>' : ""}<div class="mp-lista">${MENU_RANURAS.map(
      (n) => `<button data-mp="g-${n}" class="mp-ranura"><b>Ranura ${n}</b><span>${menuDesc(menuLeer("ocaso-ranura-" + n))}</span></button>`,
    ).join("")}${mpB("exportar", "Exportar a un archivo")}${mpB("v-raiz", "Volver")}</div>`;
  } else if (v === "cargar") {
    const auto = menuLeer("ocaso-save");
    h = `<h2>Cargar</h2>${av}<div class="mp-lista">
<button data-mp="c-auto" class="mp-ranura" ${auto ? "" : "disabled"}><b>Guardado automático</b><span>${menuDesc(auto)}</span></button>
${MENU_RANURAS.map((n) => {
  const s = menuLeer("ocaso-ranura-" + n);
  return `<button data-mp="c-${n}" class="mp-ranura" ${s ? "" : "disabled"}><b>Ranura ${n}</b><span>${menuDesc(s)}</span></button>`;
}).join("")}
<label class="mp-archivo"><input type="file" accept=".json,application/json" id="mp-archivo" hidden><span class="btn-como">Desde un archivo…</span></label>
${mpB("v-raiz", "Volver")}</div>`;
  } else if (v === "opciones") h = menuOpcionesHtml(av);
  c.innerHTML = h;
}
const mpSel = (clave, ops, lbl) =>
  `<div class="mp-fila"><span>${lbl}</span><div class="mp-ops" role="group" aria-label="${esc(lbl)}">${ops
    .map(([v, t]) => `<button data-mp="o-${clave}" data-val="${esc(JSON.stringify(v))}" class="${OPC.v[clave] === v ? "on" : ""}" aria-pressed="${OPC.v[clave] === v}">${t}</button>`)
    .join("")}</div></div>`;
const mpSi = (clave, lbl) =>
  mpSel(
    clave,
    [
      [true, "Sí"],
      [false, "No"],
    ],
    lbl,
  );
const mpVol = (clave, lbl) =>
  `<div class="mp-fila"><label for="mp-${clave}">${lbl}</label><span class="mp-vol"><input type="range" id="mp-${clave}" data-opc="${clave}" min="0" max="100" step="5" value="${Math.round((OPC.v[clave] ?? 1) * 100)}"><output>${Math.round((OPC.v[clave] ?? 1) * 100)}</output></span></div>`;
function menuOpcionesHtml(av) {
  const p = MENU.pest,
    tabs = [
      ["general", "General"],
      ["audio", "Audio"],
      ["video", "Vídeo"],
    ];
  let h = `<h2>Opciones</h2>${av}<div class="mp-tabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" data-mp="p-${k}" class="${p === k ? "on" : ""}" aria-selected="${p === k}">${t}</button>`).join("")}</div><div class="mp-pest">`;
  if (p === "general") {
    h += mpSel(
      "idioma",
      [
        ["es", "Español"],
        ["pt", "Português"],
        ["en", "English"],
      ],
      "Idioma",
    );
    h += mpSel(
      "texto",
      [
        [0.85, "Pequeño"],
        [1, "Normal"],
        [1.15, "Grande"],
        [1.3, "Muy grande"],
      ],
      "Tamaño del texto",
    );
    h += mpSel(
      "sangre",
      [
        ["no", "No"],
        ["si", "Sí"],
        ["brutal", "Brutalidad"],
      ],
      "Sangre",
    );
    h += `<p class="dim mp-nota">Brutalidad: los campos quedan empapados de sangre, con miembros y vísceras de los caídos.</p>`;
    if (typeof IFZ !== "undefined") {
      const v = IFZ.pref.vel || "lenta",
        bt = (act, on, t) => `<button data-act="${act}" class="${on ? "on" : ""}" aria-pressed="${on}">${t}</button>`;
      h += `<h3>Juego</h3>
<div class="mp-fila"><span>Velocidad de los ejércitos</span><div class="mp-ops" role="group" aria-label="Velocidad de animación">${bt("ifzvel-lenta", v === "lenta", "Lenta")}${bt("ifzvel-normal", v === "normal", "Normal")}${bt("ifzvel-rapida", v === "rapida", "Rápida")}</div></div>
<div class="mp-fila"><span>Repetición de la estación</span><div class="mp-ops" role="group" aria-label="Repetición de la estación">${bt("ifzrepo-1", IFZ.pref.rep !== false, "Sí")}${bt("ifzrepo-0", IFZ.pref.rep === false, "No")}</div></div>
<div class="mp-fila"><span>Recursos en el mapa</span><div class="mp-ops" role="group" aria-label="Recursos en el mapa">${bt("ifzico-1", IFZ.pref.iconos !== false, "Mostrar")}${bt("ifzico-0", IFZ.pref.iconos === false, "Ocultar")}</div></div>
<div class="btns"><button data-act="ifztut-otra">Repetir el tutorial</button></div>`;
    }
  } else if (p === "audio") {
    h += mpSi("silencio", "Silenciar todo");
    h += mpVol("volGeneral", "Volumen general") + mpVol("volMusica", "Música") + mpVol("volEfectos", "Efectos (espadas, flechas, caballos…)") + mpVol("volVoces", "Gritos y voces") + mpVol("volAmbiente", "Ambiente (viento, batalla lejana)");
  } else {
    h += mpSel(
      "calidad",
      [
        ["alta", "Alta"],
        ["media", "Media"],
        ["baja", "Baja"],
      ],
      "Calidad gráfica",
    );
    h += `<p class="dim mp-nota">Elegir una calidad ajusta todo lo de abajo; luego puedes cambiar cada cosa por separado.</p>`;
    {
      const vb = typeof B3D !== "undefined" ? B3D.pref.vista || "3d" : "3d",
        b = (v, t) => `<button data-mp="vista" data-val="${v}" class="${vb === v ? "on" : ""}" aria-pressed="${vb === v}">${t}</button>`;
      h += `<div class="mp-fila"><span>Vista de batalla</span><div class="mp-ops" role="group" aria-label="Vista de batalla">${b("3d", "3D")}${b("2d", "Clásica")}</div></div>`;
    }
    h += mpSel(
      "camaraFija",
      [
        [false, "Giro libre"],
        [true, "Isométrica fija"],
      ],
      "Cámara de batalla",
    );
    h += mpSi("sombras", "Sombras") + mpSi("sombrasSuaves", "Sombras suaves");
    h += mpSel(
      "resolucion",
      [
        [1, "100 %"],
        [0.85, "85 %"],
        [0.7, "70 %"],
        [0.5, "50 %"],
      ],
      "Resolución de la batalla",
    );
    h += mpSel(
      "vegetacion",
      [
        ["alta", "Alta"],
        ["media", "Media"],
        ["baja", "Baja"],
      ],
      "Vegetación",
    );
    h += mpSel(
      "figuras",
      [
        ["alta", "Todas"],
        ["media", "Menos"],
        ["baja", "Pocas"],
      ],
      "Soldados dibujados",
    );
    h += mpSi("efectos", "Efectos (lluvia, polvo, humo)") + mpSi("niebla3d", "Bruma de distancia") + mpSi("relieveMapa", "Relieve en el mapa de campaña");
    h += mpSel(
      "fps",
      [
        [60, "60"],
        [30, "30 (ahorra batería)"],
      ],
      "Cuadros por segundo",
    );
    h += `<p class="dim mp-nota">Los cambios de la batalla 3D se aplican al empezar la próxima batalla.</p>`;
  }
  return h + `</div><div class="btns">${mpB("v-raiz", "Volver")}${mpB("reanudar", "Reanudar", { cls: "gold" })}</div>`;
}

/* ---------- acciones ---------- */
function menuClic(e) {
  if (e.target === e.currentTarget) return menuCerrar();
  const b = e.target.closest("[data-mp]");
  if (!b || b.disabled) return;
  const k = b.dataset.mp;
  if (k === "reanudar") return menuCerrar();
  if (k.startsWith("v-")) {
    MENU.vista = k.slice(2);
    return menuPintar();
  }
  if (k.startsWith("p-")) {
    MENU.pest = k.slice(2);
    return menuPintar();
  }
  if (k.startsWith("g-")) {
    const n = +k.slice(2),
      ya = menuLeer("ocaso-ranura-" + n);
    if (ya && b.dataset.conf !== "1") {
      b.dataset.conf = "1";
      b.querySelector("span").innerHTML = "<b>¿Sobrescribir? Pulsa otra vez</b>";
      return;
    }
    const r = menuGuardar(n);
    return menuPintar(r.ok ? `Guardado en la ranura ${n}.` : esc(r.motivo));
  }
  if (k === "exportar") {
    const r = menuExportar();
    return menuPintar(r.ok ? "Archivo exportado." : esc(r.motivo));
  }
  if (k.startsWith("c-")) {
    const s = menuLeer(k === "c-auto" ? "ocaso-save" : "ocaso-ranura-" + k.slice(2));
    if (!menuCargarFoto(s)) menuPintar("No se pudo cargar.");
    return;
  }
  if (k === "salir") {
    if (b.dataset.conf !== "1" && G && !G.over) {
      b.dataset.conf = "1";
      b.textContent = "¿Salir? Lo no guardado se pierde";
      return;
    }
    if (typeof save === "function") save();
    menuCerrar();
    openStart("home");
    return;
  }
  if (k === "vista") {
    if (typeof B3D === "undefined") return;
    B3D.pref.vista = b.dataset.val === "2d" ? "2d" : "3d";
    if (typeof b3dGuardar === "function") b3dGuardar();
    if (B3D.pref.vista === "2d" && typeof b3dDesmontar === "function" && BT) b3dDesmontar();
    return menuPintar();
  }
  if (k.startsWith("o-")) {
    const clave = k.slice(2);
    let val;
    try {
      val = JSON.parse(b.dataset.val);
    } catch (_) {
      return;
    }
    OPC.set(clave, val);
    if (clave === "calidad") for (const [kk, vv] of Object.entries(MENU_PRESETS[val] || {})) OPC.set(kk, vv);
    menuPintar();
  }
}
function menuInput(e) {
  const i = e.target;
  if (!i || !i.dataset || !i.dataset.opc) return;
  const v = +i.value / 100;
  OPC.set(i.dataset.opc, v);
  const o = i.parentElement.querySelector("output");
  if (o) o.textContent = i.value;
}
function menuCambio(e) {
  const i = e.target;
  if (!i || i.id !== "mp-archivo" || !i.files || !i.files[0]) return;
  const fr = new FileReader();
  fr.onload = () => {
    let s = null;
    try {
      s = JSON.parse(fr.result);
    } catch (_) {}
    if (!menuCargarFoto(s)) menuPintar("Ese archivo no es una partida guardada de Ocaso.");
  };
  fr.readAsText(i.files[0]);
}
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Escape") return;
    if (menuAbierto()) {
      e.preventDefault();
      menuCerrar();
      return;
    }
    const m = document.getElementById("modal"),
      st = document.getElementById("start");
    /* Esc primero cancela lo que haya (selección, ataque apuntado, repetición, batalla): el menú solo si no
       queda nada que cancelar */
    const algo =
      (typeof camSel !== "undefined" && camSel != null) ||
      (typeof camEspSel !== "undefined" && camEspSel != null) ||
      (typeof aim !== "undefined" && aim) ||
      (typeof IFZ !== "undefined" && IFZ.res) ||
      (typeof IFZ_REP !== "undefined" && IFZ_REP.on) ||
      !!BT ||
      !!document.querySelector("#ifzresd, .ifz-tut") ||
      (typeof busy !== "undefined" && busy);
    if (G && !algo && !(m && m.classList.contains("show")) && !(st && st.classList.contains("show"))) {
      e.preventDefault();
      menuAbrir();
    }
  },
  true,
);

/* ---------- aplicar las opciones ---------- */
function menuAplicarTexto() {
  document.documentElement.style.setProperty("--tx", String(OPC.v.texto || 1));
}
function menuAplicarRelieve() {
  if (typeof relPoner === "function" && typeof REL !== "undefined" && REL.on !== !!OPC.v.relieveMapa) relPoner(!!OPC.v.relieveMapa);
}
/* calidad de la batalla 3D: el preajuste de batalla3d.js con los ajustes sueltos encima */
function b3dCal() {
  /* el botón «Calidad» de la barra de batalla cambia B3D.pref.cal: la opción lo sigue */
  if (typeof B3D !== "undefined" && B3D_CAL[B3D.pref.cal] && OPC.v.calidad !== B3D.pref.cal) {
    OPC.v.calidad = B3D.pref.cal;
    OPC.guardar();
  }
  const base = typeof B3D_CAL !== "undefined" ? B3D_CAL[B3D.pref.cal] || B3D_CAL.media : {},
    c = { ...base },
    v = OPC.v;
  if (!v.sombras) c.sombras = 0;
  else if (!v.sombrasSuaves && c.sombras) c.sombras = Math.min(c.sombras, 1024);
  c.suaves = !!v.sombrasSuaves;
  c.px = (c.px || 2) / clamp(+v.resolucion || 1, 0.5, 1);
  c.fig = Math.round((c.fig || 4000) * ({ alta: 1, media: 0.6, baja: 0.35 }[v.figuras] || 1));
  c.arboles = { alta: 2, media: 1, baja: 1 }[v.vegetacion] || c.arboles;
  c.vegPoca = v.vegetacion === "baja";
  if (!v.efectos) c.lluvia = 0;
  c.niebla = v.niebla3d !== false;
  return c;
}
OPC.on(({ clave }) => {
  if (clave === "texto") menuAplicarTexto();
  if (clave === "relieveMapa") menuAplicarRelieve();
  if (clave === "calidad" && typeof B3D !== "undefined" && B3D_CAL[OPC.v.calidad]) {
    B3D.pref.cal = OPC.v.calidad;
    if (typeof b3dGuardar === "function") b3dGuardar();
  }
});
menuAplicarTexto();
/* el relieve de campaña sigue a la opción (si el jugador lo apagó con el botón, la opción se actualiza) */
if (typeof REL !== "undefined") {
  if (localStorage.getItem("ocaso-opc") && REL.on !== !!OPC.v.relieveMapa) setTimeout(menuAplicarRelieve, 0);
  if (typeof relPoner === "function") {
    const menuRel0 = relPoner;
    relPoner = function (on) {
      const r = menuRel0.apply(this, arguments);
      if (OPC.v.relieveMapa !== !!on) {
        OPC.v.relieveMapa = !!on;
        OPC.guardar();
      }
      return r;
    };
  }
}
/* tope de 30 cuadros por segundo: se dibuja uno de cada dos */
{
  let menuUlt = 0;
  const salta = (now) => {
    if (OPC.v.fps !== 30) return false;
    if (now - menuUlt < 30) return true;
    menuUlt = now;
    return false;
  };
  if (typeof drawMap === "function") {
    const menuDM0 = drawMap;
    drawMap = function (now) {
      if (salta(now) && !BT) return;
      return menuDM0.apply(this, arguments);
    };
  }
  if (typeof drawBattle === "function") {
    const menuDB0 = drawBattle;
    drawBattle = function (now) {
      if (OPC.v.fps === 30 && now - (MENU.ultB || 0) < 30) return;
      MENU.ultB = now;
      return menuDB0.apply(this, arguments);
    };
  }
}

/* cámara de batalla isométrica fija: no gira (ni con botones, teclas Q/E o dos dedos) y vuelve al ángulo de siempre */
{
  const fija = () => typeof OPC !== "undefined" && OPC.v.camaraFija;
  for (const n of ["b3dGira", "b3dGiraLibre"])
    if (typeof window[n] === "function") {
      const f0 = window[n];
      window[n] = function () {
        if (fija()) return;
        return f0.apply(this, arguments);
      };
    }
  OPC.on(({ clave }) => {
    if (clave !== "camaraFija" || typeof B3D === "undefined" || !B3D.cam) return;
    if (fija() && typeof b3dReinicia === "function") b3dReinicia();
    if (typeof b3dBarra === "function" && B3D.bar) b3dBarra();
  });
}
