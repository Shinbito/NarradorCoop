/* ---------- DIFICULTAD DE LA IA ----------
   Se elige al empezar (pantalla del soberano; se recuerda en localStorage «ocaso-dif») y queda en la partida
   (G.dif: 'facil' | 'normal' | 'dificil'; las partidas antiguas, normal). Solo afecta a los pueblos que lleva
   la IA:
   - economía: oro y comida de sus provincias × DIF[d].eco (gancho «rendimiento»);
   - batalla: su fuerza × DIF[d].bat (gancho «bonoBatalla»);
   - en Difícil, sus ejércitos combaten con la IA difícil (ctx.dificultad, gancho «antesBatalla»: mejor
     táctica en las batallas en vivo y +4 % de daño y +5 % de moral en las automáticas).
   Globales con prefijo dif / DIF. */
const DIF = {
  facil: { n: "Fácil", d: "La IA produce menos y lucha peor: para aprender.", eco: 0.8, bat: 0.9 },
  normal: { n: "Normal", d: "El equilibrio de siempre.", eco: 1, bat: 1 },
  dificil: { n: "Difícil", d: "La IA produce más, lucha mejor y manda sus batallas con más astucia.", eco: 1.25, bat: 1.12 },
};
const difClave = () => (G && DIF[G.dif] ? G.dif : "normal");
const difAct = () => DIF[difClave()];
const difIA = (f) => f != null && f < NF && typeof human === "function" && !human(f);

OC.mod("rendimiento", (y, c = {}) => {
  if (!G || !y || !difIA(c.f)) return;
  const d = difAct();
  if (d.eco === 1) return;
  return { ...y, g: (y.g || 0) * d.eco, fo: (y.fo || 0) * d.eco };
});
OC.mod("bonoBatalla", (v, c = {}) => {
  if (!G || !difIA(c.f)) return;
  const d = difAct();
  return d.bat === 1 ? undefined : v * d.bat;
});
OC.on("antesBatalla", (ev) => {
  if (difClave() !== "dificil" || !ev || !ev.bctx) return;
  const l = ev.tipo === "multi" ? ev.lista || [] : [ev.ejA, ev.ejD];
  ev.bctx.dificultad = l.map((e, i) => (e && difIA(e.f) ? "dificil" : (ev.bctx.dificultad && ev.bctx.dificultad[i]) || "normal"));
});

/* ---------- pantalla de inicio ---------- */
function difSelector() {
  const d = ST.dif || "normal";
  return `<h3 style="margin:12px 0 6px">Dificultad de la IA</h3><div class="mun-modos dif-modos">${Object.entries(DIF)
    .map(([k, x]) => `<button data-act="s-dif-${k}" class="${d === k ? "on" : ""}" aria-pressed="${d === k}"><b>${x.n}</b>${x.d}</button>`)
    .join("")}</div>`;
}
try {
  ST.dif = localStorage.getItem("ocaso-dif") || "normal";
} catch (_) {
  ST.dif = "normal";
}
if (typeof startAct === "function") {
  const difStart0 = startAct;
  startAct = function (k) {
    if (typeof k === "string" && k.startsWith("dif-")) {
      const d = k.slice(4);
      if (DIF[d]) {
        ST.dif = d;
        try {
          localStorage.setItem("ocaso-dif", d);
        } catch (_) {}
      }
      return renderStart();
    }
    return difStart0.apply(this, arguments);
  };
}
/* la partida nueva lleva la dificultad elegida */
if (typeof newGame === "function") {
  const difNew0 = newGame;
  newGame = function () {
    const r = difNew0.apply(this, arguments);
    if (G) G.dif = DIF[ST.dif] ? ST.dif : "normal";
    return r;
  };
}
