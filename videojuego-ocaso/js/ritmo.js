/* ---------- RITMO DE LA PARTIDA: rápida o larga; y pelotones mermados ----------
   Se elige al empezar (pantalla del soberano; se recuerda en localStorage «ocaso-ritmo») y queda en G.ritmo;
   online, en la configuración de la partida (cfg.ritmo, online.js).
   - Larga (por defecto): como siempre; online, plazos de horas por estación (la partida dura días o semanas).
   - Rápida: cada jugador tiene 5 minutos por turno (en solitario, un reloj que solo corre mientras puedes
     jugar; al acabarse, termina tu turno con lo que hayas ordenado; online, la estación tiene 5 min y se
     envían las órdenes dadas) y ninguna batalla en vivo dura más de 10 minutos reales: al acabarse, el
     atacante pierde la pelea pero no muere: se retira un poco con sus supervivientes (batalla.js,
     cmbTopeResta / battleOver).
   PELOTONES MERMADOS (batalla.js cmbMerTipo, ejercitos.js camMerNorm): tras una batalla, un pelotón que pierde
   hombres queda disminuido (ej.mer = hombres que le faltan). Se completan en una ciudad propia pagando oro
   (botón en el panel del ejército; la IA lo hace sola si le sobra el oro).
   Globales con prefijo rit / RIT. */
const RIT = {
  larga: { n: "Partida larga", d: "Sin prisa: días o semanas. Online, cada estación tiene un plazo de horas.", turno: 0, batalla: 0 },
  rapida: { n: "Partida rápida", d: "5 minutos por turno y batallas de 10 minutos como máximo: si se acaba el tiempo, el atacante pierde y se retira con sus supervivientes.", turno: 300, batalla: 600 },
};
const RIT_T = { k: "", usado: 0, last: 0, fin: "" };
function ritClave() {
  if (typeof net !== "undefined" && net.on && typeof ONL !== "undefined" && ONL.meta && ONL.meta.cfg) return ONL.meta.cfg.ritmo === "rapida" ? "rapida" : "larga";
  return typeof G !== "undefined" && G && G.ritmo === "rapida" ? "rapida" : "larga";
}
function ritTopeBatalla() {
  return RIT[ritClave()].batalla;
}

/* ---------- pantalla de inicio ---------- */
function ritSelector() {
  const d = ST.ritmo || "larga";
  return `<h3 style="margin:12px 0 6px">Duración</h3><div class="mun-modos dif-modos">${Object.entries(RIT)
    .map(([k, x]) => `<button data-act="s-rit-${k}" class="${d === k ? "on" : ""}" aria-pressed="${d === k}"><b>${x.n}</b>${x.d}</button>`)
    .join("")}</div>`;
}
try {
  ST.ritmo = localStorage.getItem("ocaso-ritmo") === "rapida" ? "rapida" : "larga";
} catch (_) {
  ST.ritmo = "larga";
}
if (typeof startAct === "function") {
  const ritStart0 = startAct;
  startAct = function (k) {
    if (typeof k === "string" && k.startsWith("rit-")) {
      const d = k.slice(4);
      if (RIT[d]) {
        ST.ritmo = d;
        try {
          localStorage.setItem("ocaso-ritmo", d);
        } catch (_) {}
      }
      return renderStart();
    }
    return ritStart0.apply(this, arguments);
  };
}
if (typeof newGame === "function") {
  const ritNew0 = newGame;
  newGame = function () {
    const r = ritNew0.apply(this, arguments);
    if (G) G.ritmo = RIT[ST.ritmo] ? ST.ritmo : "larga";
    return r;
  };
}
/* online: «Duración» muestra u oculta los plazos de la partida larga */
document.addEventListener("change", (e) => {
  if (!e.target || e.target.id !== "onl-ritmo") return;
  document.querySelectorAll(".onl-larga").forEach((el) => (el.hidden = e.target.value === "rapida"));
});

/* ---------- reloj del turno (partida rápida en solitario) ---------- */
function ritPuedeJugar() {
  const m = document.getElementById("modal"),
    st = document.getElementById("start");
  return !!G && !G.over && !BT && !busy && myTurn() && !(m && m.classList.contains("show")) && !(st && st.classList.contains("show"));
}
function ritReloj() {
  let el = document.getElementById("ritreloj");
  const on = typeof G !== "undefined" && G && !G.over && !(typeof net !== "undefined" && net.on) && ritClave() === "rapida";
  if (!on) {
    if (el) el.hidden = true;
    RIT_T.last = 0;
    return;
  }
  const k = `${G.year}|${G.estacion}`,
    now = performance.now();
  if (RIT_T.k !== k) {
    RIT_T.k = k;
    RIT_T.usado = 0;
  }
  /* solo corre mientras puedes jugar (no en batallas, avisos ni mientras pasa la estación) */
  if (RIT_T.last && ritPuedeJugar()) RIT_T.usado += Math.min(2, (now - RIT_T.last) / 1000);
  RIT_T.last = now;
  const resta = Math.max(0, RIT.rapida.turno - RIT_T.usado);
  if (!el) {
    const z = document.querySelector("#hover .ifz-zoom");
    if (!z) return;
    el = document.createElement("span");
    el.id = "ritreloj";
    el.className = "zl rit-reloj";
    el.title = "Tiempo que te queda en este turno (partida rápida)";
    z.prepend(el);
  }
  el.hidden = false;
  el.textContent = `Turno ${Math.floor(resta / 60)}:${String(Math.floor(resta % 60)).padStart(2, "0")}`;
  el.classList.toggle("bad", resta < 30);
  if (resta <= 0 && RIT_T.fin !== k && ritPuedeJugar()) {
    RIT_T.fin = k;
    if (typeof toast === "function") toast("Se acabó tu tiempo: termina el turno.");
    endTurn();
  }
}
/* la batalla por turnos no comprueba el final mientras se espera al jugador: aquí sí */
function ritTopeBatallaTick() {
  if (!BT || typeof cmbTopeResta !== "function" || BT.ritFin) return;
  if (cmbTopeResta() > 0) return;
  if (BT.mode === "rt") {
    BT.paused = false;
    return;
  }
  if (BT.run) return;
  const r = battleOver();
  if (r >= 0) {
    BT.ritFin = true;
    bLog("Se acaba el tiempo de la batalla: el atacante se retira con sus supervivientes.");
    finishBattle(r);
  }
}
setInterval(() => {
  try {
    ritReloj();
    ritTopeBatallaTick();
  } catch (e) {
    console.error(e);
  }
}, 500);

/* ---------- completar pelotones mermados ---------- */
function ritCosteCompletar(ej) {
  const m = typeof cmbMerTipo === "function" ? cmbMerTipo(ej) : {};
  let c = 0;
  for (const t in m) c += (m[t] * ((UN[t] && UN[t].cost) || 10)) / SPU;
  return Math.ceil(c);
}
const ritCiudadPropia = (ej) => {
  const p = typeof camCiudadEn === "function" ? camCiudadEn(ej.x, ej.y) : null;
  return p && p.owner === ej.f ? p : null;
};
function ritCompletar(ej) {
  if (!ej || !(ej.mer > 0)) return { ok: false, motivo: "No le falta nadie" };
  const p = ritCiudadPropia(ej);
  if (!p) return { ok: false, motivo: "Tiene que estar en una ciudad propia" };
  const c = ritCosteCompletar(ej),
    F = G.F[ej.f];
  if (F.gold < c) return { ok: false, motivo: `Hace falta ${c} de oro` };
  F.gold -= c;
  const n = Math.round(ej.mer);
  delete ej.mer;
  return { ok: true, coste: c, n, p };
}
function ritMermaHtml(ej, puede) {
  if (!(ej.mer > 0)) return "";
  const p = ritCiudadPropia(ej),
    c = ritCosteCompletar(ej),
    ok = puede && p && G.F[ej.f].gold >= c;
  return `<p class="stats">Pelotones mermados: faltan <b>${Math.round(ej.mer)}</b> hombres. ${
    p ? `En ${esc(p.name)} se pueden completar.` : "Se completan en una ciudad propia, pagando oro."
  }</p>${puede ? `<div class="btns"><button data-act="rit-completar:${ej.id}" ${ok ? "" : "disabled"} title="${p ? "" : "Lleva el ejército a una ciudad propia"}">Completar pelotones (${c} oro)</button></div>` : ""}`;
}
OC.accion("rit", (v) => {
  const [k, a] = v.split(":");
  if (k !== "completar") return;
  const ej = typeof camEj === "function" ? camEj(+a) : null;
  if (!ej || !isMe(ej.f)) return;
  const r = ritCompletar(ej);
  if (r.ok) addLog(`${camNombre(ej)} completa sus pelotones en ${r.p.name}: ${r.n} hombres por ${r.coste} de oro.`, "eco");
  else if (typeof toast === "function") toast(r.motivo);
});
/* la IA completa sus pelotones si está en una ciudad suya y le sobra el oro */
if (typeof camEspIA === "function") {
  const ritIA0 = camEspIA;
  camEspIA = function (f) {
    const r = ritIA0.apply(this, arguments);
    try {
      for (const e of camS().ej)
        if (e.f === f && e.mer > 0 && ritCiudadPropia(e) && G.F[f].gold > ritCosteCompletar(e) + 80) ritCompletar(e);
    } catch (_) {}
    return r;
  };
}
