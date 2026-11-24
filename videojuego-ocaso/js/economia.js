/* ---------- economía ----------
   Sistema de ECONOMÍA: población por provincia, especialidades del terreno, recursos,
   impuestos, mantenimiento de tropas y edificios, deuda, moneda, graneros, hambre,
   peste y revueltas. Estado en G.eco. El comercio (mercado y rutas) está en comercio.js.
   Ver docs/economia.md para los números y los ganchos. */

/* recursos nuevos (oro y comida ya existen). base = precio de referencia en oro */
const ECO_RES = [
  { id: "madera", nombre: "Madera", icono: "♣", base: 3 },
  { id: "piedra", nombre: "Piedra", icono: "▲", base: 3 },
  { id: "hierro", nombre: "Hierro", icono: "⚒", base: 5 },
  { id: "caballos", nombre: "Caballos", icono: "♞", base: 8 },
  { id: "sal", nombre: "Sal", icono: "◇", base: 5, lujo: true },
  { id: "vino", nombre: "Vino", icono: "⚱", base: 6, lujo: true },
  { id: "seda", nombre: "Seda", icono: "✦", base: 12, lujo: true },
  { id: "incienso", nombre: "Incienso", icono: "∴", base: 9, lujo: true },
  { id: "especias", nombre: "Especias", icono: "✺", base: 10, lujo: true },
  { id: "ambar", nombre: "Ámbar", icono: "◆", base: 8, lujo: true },
  { id: "cacao", nombre: "Cacao", icono: "●", base: 7, lujo: true },
];
ECO_RES.forEach((r) => OC.recurso({ id: r.id, nombre: r.nombre, icono: r.icono }));

/* especialidad de cada provincia. w = peso según la proporción de [_, llanura, bosque, colina];
   costa = solo (o más) en provincias con litoral. y = rendimiento extra por año */
const ECO_ESP = {
  trigo: { n: "Trigales", d: "+4 comida", y: { fo: 4 }, w: [0, 2.2, 0.3, 0.2] },
  pesca: { n: "Pesquerías", d: "+3 comida", y: { fo: 3 }, w: [0, 0, 0, 0], costa: 1.4 },
  madera: { n: "Bosques madereros", d: "+2 madera", y: { madera: 2 }, w: [0, 0.2, 3, 0.4] },
  cantera: { n: "Canteras", d: "+2 piedra", y: { piedra: 2 }, w: [0, 0.2, 0.2, 2] },
  hierro: { n: "Minas de hierro", d: "+2 hierro", y: { hierro: 2 }, w: [0, 0.15, 0.4, 2] },
  oro: { n: "Minas de oro", d: "+4 oro", y: { g: 4 }, w: [0, 0, 0.1, 0.5] },
  caballos: { n: "Yeguadas", d: "+2 caballos", y: { caballos: 2 }, w: [0, 1.6, 0.2, 0.3] },
  sal: { n: "Salinas", d: "+2 sal", y: { sal: 2 }, w: [0, 0, 0, 0], costa: 1.1 },
  vino: { n: "Viñedos", d: "+2 vino", y: { vino: 2 }, w: [0, 0.8, 0.2, 0.9] },
  seda: { n: "Talleres de seda", d: "+1 seda, +1 oro", y: { seda: 1, g: 1 }, w: [0, 0.3, 0.1, 0.1] },
  puerto: { n: "Puerto franco", d: "+2 oro, +1 ruta comercial", y: { g: 2 }, w: [0, 0, 0, 0], costa: 1 },
  /* propias de un pueblo: solo aparecen en su comarca (provincias más cercanas a su capital) */
  laca: { n: "Talleres de laca", d: "+3 oro", y: { g: 3 }, w: [0, 0.5, 0.7, 0.3], civ: ["chi"] },
  cacao: {
    n: "Huertos de cacao",
    d: "+2 cacao",
    y: { cacao: 2 },
    w: [0, 0.7, 1.2, 0.2],
    civ: ["may", "azt"],
  },
  chinampas: { n: "Chinampas", d: "+5 comida", y: { fo: 5 }, w: [0, 1, 0.2, 0], costa: 0.4, civ: ["azt"] },
  terrazas: { n: "Terrazas de cultivo", d: "+4 comida", y: { fo: 4 }, w: [0, 0.2, 0.3, 2], civ: ["inc"] },
  llamas: {
    n: "Rebaños de llamas",
    d: "+2 comida, +2 oro",
    y: { fo: 2, g: 2 },
    w: [0, 0.6, 0, 1.4],
    civ: ["inc"],
  },
  incienso: {
    n: "Caminos del incienso",
    d: "+2 incienso",
    y: { incienso: 2 },
    w: [0, 1, 0.2, 0.8],
    civ: ["ara", "egi"],
  },
  arabes: { n: "Caballos árabes", d: "+3 caballos", y: { caballos: 3 }, w: [0, 1.5, 0, 0.5], civ: ["ara"] },
  papiro: { n: "Papiros del delta", d: "+3 oro", y: { g: 3 }, w: [0, 1, 0.3, 0], costa: 0.5, civ: ["egi"] },
  nilo: { n: "Graneros del Nilo", d: "+6 comida", y: { fo: 6 }, w: [0, 2, 0, 0], civ: ["egi"] },
  especias: {
    n: "Especierías",
    d: "+2 especias",
    y: { especias: 2 },
    w: [0, 0.8, 1, 0.3],
    costa: 0.6,
    civ: ["ind"],
  },
  algodon: {
    n: "Algodonales",
    d: "+2 oro, +1 comida",
    y: { g: 2, fo: 1 },
    w: [0, 1.5, 0.1, 0.1],
    civ: ["ind"],
  },
  ambar: {
    n: "Costas del ámbar",
    d: "+2 ámbar",
    y: { ambar: 2 },
    w: [0, 0.2, 0.4, 0],
    costa: 1.5,
    civ: ["nor", "esl"],
  },
  pieles: {
    n: "Tramperos",
    d: "+2 oro, +1 madera",
    y: { g: 2, madera: 1 },
    w: [0, 0.1, 2, 0.4],
    civ: ["nor", "esl"],
  },
  estepa: {
    n: "Pastos de la estepa",
    d: "+3 caballos",
    y: { caballos: 3 },
    w: [0, 2.5, 0, 0.4],
    civ: ["mon", "hun"],
  },
  olivar: {
    n: "Olivares",
    d: "+2 oro, +2 comida",
    y: { g: 2, fo: 2 },
    w: [0, 0.8, 0.2, 1.2],
    civ: ["gri", "occ", "ori"],
  },
  estano: {
    n: "Minas de estaño",
    d: "+1 hierro, +2 oro",
    y: { hierro: 1, g: 2 },
    w: [0, 0.1, 0.4, 1.8],
    civ: ["cel"],
  },
};
/* sabor económico de cada pueblo (por CIV[f].id): esp = multiplicador de peso de cada especialidad en
   su comarca; ini = existencias iniciales; com = afán comercial de su IA (rutas y compras de lujo) */
const ECO_CIV = {
  occ: { esp: { vino: 1.5, olivar: 1, cantera: 1.2 }, ini: {}, com: 1 },
  ori: { esp: { seda: 2, puerto: 1.5, olivar: 1 }, ini: { seda: 4 }, com: 1.3 },
  vis: { esp: { trigo: 1.3, caballos: 1.2 }, ini: {}, com: 0.9 },
  hun: { esp: { caballos: 2, estepa: 1 }, ini: { caballos: 12 }, com: 0.6, clima: "estepa" },
  van: { esp: { puerto: 1.6, pesca: 1.3 }, ini: {}, com: 1.2 },
  fra: { esp: { madera: 1.4, hierro: 1.3, trigo: 1.2 }, ini: {}, com: 0.9 },
  per: { esp: { seda: 1.5, caballos: 1.5, oro: 1.3 }, ini: { seda: 4 }, com: 1.1 },
  ara: {
    esp: { incienso: 1, arabes: 1, puerto: 1.3 },
    ini: { incienso: 6, caballos: 8 },
    com: 1.4,
    clima: "arido",
  },
  nor: { esp: { ambar: 1, pieles: 1, pesca: 1.6, madera: 1.3 }, ini: { ambar: 4 }, com: 0.8 },
  chi: { esp: { seda: 4, laca: 1, trigo: 1.3 }, ini: { seda: 8 }, com: 1.2, clima: "fertil" },
  inc: { esp: { terrazas: 1, llamas: 1, oro: 1.6 }, ini: {}, com: 0.7, clima: "montes" },
  may: { esp: { cacao: 1.2, madera: 1.2 }, ini: { cacao: 6 }, com: 1 },
  azt: { esp: { cacao: 1, chinampas: 1 }, ini: { cacao: 4 }, com: 1 },
  gri: { esp: { olivar: 1.2, vino: 2, puerto: 1.6 }, ini: { vino: 6 }, com: 1.4 },
  egi: { esp: { nilo: 1, papiro: 1, incienso: 0.6 }, ini: { incienso: 2 }, com: 1.2, clima: "arido" },
  ind: { esp: { especias: 1.2, algodon: 1 }, ini: { especias: 6 }, com: 1.2, clima: "fertil" },
  cel: { esp: { estano: 1, pesca: 1.2, caballos: 1.1 }, ini: {}, com: 0.8, clima: "estano" },
  esl: { esp: { pieles: 1, ambar: 0.7, madera: 1.5 }, ini: {}, com: 0.8 },
  mon: { esp: { estepa: 1.2, caballos: 2 }, ini: { caballos: 14 }, com: 0.6, clima: "estepa" },
};
const ecoCiv = (f) => (CIV[f] && ECO_CIV[CIV[f].id]) || { esp: {}, ini: {}, com: 1 };
/* pueblos sin caballos (América): ni los crían ni los necesitan */
const ecoSinCaballos = (f) => !!(CIV[f] && (CIV[f].sinTipos || []).includes("caballos"));
const ECO_CABALLAR = ["caballos", "arabes", "estepa"];
/* constantes de equilibrio */
const ECO_IMP = 0.38, // oro de impuesto por millar de almas (impuestos normales)
  ECO_COS = 0.24, // comida por millar de almas
  ECO_EDI = 0.4, // oro anual por nivel de edificio
  ECO_INT = 0.08, // interés anual de la deuda
  ECO_SOLDADA = 0.025; // oro anual de mantenimiento por cada oro que costó la unidad

/* estado fiscal por facción (G.eco.f[f]); los rebeldes usan este molde sin guardarlo */
const ECO_F0 = Object.freeze({
  deuda: 0, // oro debido a los argentarii
  infl: 1, // índice de precios por recortar la ley de la moneda (1 = buena ley)
  diezmo: false,
  annona: false,
  cred: 0, // años sin crédito tras una bancarrota
  hambre: 0, // años con los efectos de la última hambruna
  sobre: 0, // años seguidos por encima del límite de crédito
  lujo: 0, // bienes de lujo que la corte disfrutó este año (0-3)
  lev: 0, // presión sobre las levas (0-0,8) calculada al cerrar el año: encarece reclutar
  gi: 0, // ingresos brutos del último año
  mon: -1, // año del último cambio de moneda
  abund: false, // graneros por encima del 60 % al cerrar el año (+3 de ánimo)
  desc: -99, // año del último aviso de descontento general
});

/* ---------- estado ---------- */
function ecoE() {
  if (!G) return null;
  const E = OC.estado("eco", () => ({ v: 1 }));
  if (!E.esp || E.esp.length !== G.P.length || !E.pob) ecoIniProv(E);
  else if (!E.yac || E.yac.length !== G.P.length) ecoIniYac(E);
  if (!E.f) E.f = [];
  if (!E.rutas) E.rutas = [];
  if (!E.peste) E.peste = {};
  if (!E.inm) E.inm = {};
  if (!E.mer) E.mer = {};
  if (!E.efe) E.efe = {}; // efectos temporales de las decisiones por provincia: [{k, t, o, h, imp, hi}]
  if (!E.dec) E.dec = {}; // enfriamiento de decisiones: {k: año en que vuelve a estar disponible}
  if (!E.saq) E.saq = {}; // año de la última batalla librada en la provincia
  if (typeof comMercadoIni === "function") comMercadoIni(E);
  return E;
}
function ecoF(f) {
  if (!G || f == null || f < 0 || f >= NF) return ECO_F0;
  const E = ecoE(),
    S = (E.f[f] = E.f[f] || {});
  for (const k in ECO_F0) if (S[k] === undefined) S[k] = ECO_F0[k];
  return S;
}
/* terreno de cada provincia a partir del mapa (no se guarda: se recalcula con la semilla) */
let ecoCacheT = null;
function ecoTerreno(i) {
  if (!MAP) return { n: 40, s: [0, 0.7, 0.15, 0.15], costa: false };
  if (!ecoCacheT || ecoCacheT.seed !== MAP.seed || ecoCacheT.t.length !== MAP.pts.length) {
    /* relieve v2 (mundo): casillas de montaña y de río de cada provincia */
    const t = MAP.pts.map(() => ({ n: 0, c: [0, 0, 0, 0], k: 0, m: 0, r: 0 }));
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const j = MAP.grid[y][x];
        if (j < 0) continue;
        t[j].n++;
        t[j].c[MAP.terr[y][x]]++;
        if (MAP.mont && MAP.mont[y] && MAP.mont[y][x]) t[j].m++;
        if (MAP.rio && MAP.rio[y] && MAP.rio[y][x]) t[j].r++;
        if ((MAP.terr[y - 1]?.[x] ?? 0) === 0 || (MAP.terr[y + 1]?.[x] ?? 0) === 0) t[j].k++;
        else if ((MAP.terr[y][x - 1] ?? 0) === 0 || (MAP.terr[y][x + 1] ?? 0) === 0) t[j].k++;
      }
    ecoCacheT = {
      seed: MAP.seed,
      relieve: !!(MAP.rios && MAP.rios.length),
      t: t.map((q) => ({
        n: q.n,
        s: q.c.map((v) => v / Math.max(1, q.n)),
        costa: q.k >= 3,
        mont: q.m / Math.max(1, q.n),
        rio: q.r,
      })),
    };
  }
  return ecoCacheT.t[i] || { n: 40, s: [0, 0.7, 0.15, 0.15], costa: false };
}
/* capacidad de población (miles de almas) que sostiene una provincia */
function ecoCapacidad(p, E = ecoE()) {
  const tr = ecoTerreno(p.id),
    e = E.esp[p.id];
  return (
    4 +
    tr.n * 0.22 +
    (+p.farm || 0) * 3 +
    (+p.market || 0) * 1.5 +
    (p.cap ? 7 : 0) +
    (e === "trigo" || e === "pesca" ? 2 : 0) +
    ((E.fer && E.fer[p.id] != null ? E.fer[p.id] : 0.5) - 0.5) * 6
  );
}
/* especialidades, población y existencias iniciales: deterministas a partir de G.seed */
function ecoIniProv(E) {
  E.esp = E.esp && E.esp.length === G.P.length ? E.esp : [];
  E.cul = E.cul && E.cul.length === G.P.length ? E.cul : [];
  E.pob = E.pob && E.pob.length === G.P.length ? E.pob : [];
  /* comarca cultural: el pueblo cuya capital queda más cerca de la provincia */
  const caps = ecoCapitales(),
    rng = [],
    nuevas = [],
    pesos = [];
  for (const p of G.P) {
    const r = (rng[p.id] = mul(((G.seed | 0) + p.id * 9973 + 17) | 0)),
      tr = ecoTerreno(p.id);
    if (E.esp[p.id]) continue;
    let cf = -1,
      bd = 1e9;
    for (const [f, q] of caps) {
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < bd) {
        bd = d;
        cf = f;
      }
    }
    const cid = cf >= 0 ? CIV[cf].id : null,
      sab = cf >= 0 ? ecoCiv(cf).esp : {},
      sinCab = cf >= 0 && ecoSinCaballos(cf);
    const ops = Object.entries(ECO_ESP).map(([k, e]) => {
      if (e.civ && !e.civ.includes(cid)) return [k, 0];
      if (sinCab && ECO_CABALLAR.includes(k)) return [k, 0];
      const w =
        e.w[1] * tr.s[1] + e.w[2] * tr.s[2] + e.w[3] * tr.s[3] + (e.costa ? (tr.costa ? e.costa : 0) : 0);
      return [k, w * (sab[k] ?? 1) * (e.civ ? 1.6 : 1)];
    });
    let x = r() * ops.reduce((s, o) => s + o[1], 0);
    E.esp[p.id] = (ops.find((o) => (x -= o[1]) < 0) || ops[0])[0];
    nuevas.push([p, cf]);
    E.cul[p.id] = cid;
    pesos[p.id] = Object.fromEntries(ops);
  }
  /* cada pueblo tiene al menos una especialidad «de firma» en su comarca (fuera de la capital) */
  for (const [f, cap] of caps) {
    const firma = Object.keys(ecoCiv(f).esp).filter(
      (k) => ECO_ESP[k] && ((ECO_ESP[k].civ || []).includes(CIV[f].id) || ecoCiv(f).esp[k] >= 2),
    );
    const reg = nuevas.filter(([p, cf]) => cf === f && p !== cap).map(([p]) => p);
    if (!firma.length || !reg.length || reg.some((p) => firma.includes(E.esp[p.id]))) continue;
    let mejor = null;
    for (const p of reg)
      for (const k of firma)
        if (!mejor || (pesos[p.id][k] || 0) > mejor[2]) mejor = [p, k, pesos[p.id][k] || 0];
    if (mejor && mejor[2] > 0) E.esp[mejor[0].id] = mejor[1];
  }
  ecoIniYac(E);
  for (const p of G.P)
    if (!(E.pob[p.id] > 0))
      E.pob[p.id] = Math.round(ecoCapacidad(p, E) * (0.62 + rng[p.id]() * 0.16) * 10) / 10;
  for (let f = 0; f < NF; f++) {
    const F = G.F[f];
    if (!F) continue;
    F.res = F.res || {};
    const ini = { madera: 10, piedra: 10, hierro: 6, caballos: ecoSinCaballos(f) ? 0 : 4 };
    Object.assign(ini, ecoCiv(f).ini);
    for (const r of ECO_RES) if (F.res[r.id] === undefined) F.res[r.id] = ini[r.id] || 0;
  }
}
/* [[f, provincia capital]] de los pueblos que juegan (vacío si aún no hay capitales) */
function ecoCapitales() {
  const l = [];
  for (let f = 0; f < NF; f++) {
    const F = G.F[f];
    if (!F || F.ausente || F.capId == null || !G.P[F.capId]) continue;
    if (typeof civActiva === "function" && !civActiva(f)) continue;
    l.push([f, G.P[F.capId]]);
  }
  return l;
}
const ecoPob = (p) => {
  const E = ecoE();
  return E.pob[p.id] || 1;
};
const ecoEspecialidad = (p) => {
  const id = ecoE().esp[p.id];
  return { id, ...(ECO_ESP[id] || { n: "—", d: "", y: {} }) };
};
const ecoResInfo = (id) => ECO_RES.find((r) => r.id === id) || OC.recursos.find((r) => r.id === id);
/* recurso que da la especialidad (para importaciones de rutas) */
function ecoRecursoEsp(p) {
  const y = ecoEspecialidad(p).y || {};
  return ECO_RES.map((r) => r.id).find((k) => y[k]) || null;
}
/* monturas que gastan caballos (combate marca UN[t].caballo; los camellos y elefantes no) */
const ecoMontada = (t) => {
  const u = UN[t];
  if (!u) return false;
  if (u.caballo !== undefined || u.rol) return !!u.caballo;
  return t === "c" || !!(u.montada || u.mont || u.mv >= 4);
};
/* ejércitos de campaña de f (G.cam.ej); vacío si campaña no está */
const ecoEjercitos = (f) => (G && G.cam && typeof camEjDe === "function" ? camEjDe(f) : []);

/* ---------- tierras: yacimientos, fertilidad y explotaciones ----------
   G.eco.yac[i] = {recurso: riqueza 1..3} (madera, piedra, hierro, oro, estano, sal); G.eco.fer[i] = 0..1;
   G.eco.exp[i] = {mina, cantera, aserradero, salinas}: explotaciones establecidas al empezar (nivel 1).
   Los edificios que construya tecnología viven en p.mina, p.cantera, p.aserradero, p.salinas; el nivel
   efectivo es el mayor de los dos (ecoNivelExp). Todo determinista con G.seed y el terreno de MAP. */
const ECO_YAC = {
  madera: { n: "Bosques", icono: "♣", exp: "aserradero" },
  piedra: { n: "Piedra de cantera", icono: "▲", exp: "cantera" },
  hierro: { n: "Vetas de hierro", icono: "⚒", exp: "mina" },
  oro: { n: "Vetas de oro", icono: "◉", exp: "mina" },
  estano: { n: "Estaño", icono: "⊙", exp: "mina" },
  sal: { n: "Salinas naturales", icono: "◇", exp: "salinas" },
};
/* explotación → recurso principal que saca (el oro y el estaño también salen de la mina) */
const ECO_EXP = {
  mina: { k: "mina", r: "hierro", n: "Mina" },
  cantera: { k: "cantera", r: "piedra", n: "Cantera" },
  aserradero: { k: "aserradero", r: "madera", n: "Aserradero" },
  salinas: { k: "salinas", r: "sal", n: "Salinas" },
};
const ECO_ROM = ["", "I", "II", "III", "IV"];
function ecoIniYac(E) {
  if (!E.cul || E.cul.length !== G.P.length) {
    E.cul = [];
    const caps = ecoCapitales();
    for (const p of G.P) {
      let cf = -1,
        bd = 1e9;
      for (const [f, q] of caps) {
        const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
        if (d < bd) {
          bd = d;
          cf = f;
        }
      }
      E.cul[p.id] = cf >= 0 ? CIV[cf].id : null;
    }
  }
  E.yac = [];
  E.fer = [];
  E.exp = E.exp || {};
  for (const p of G.P) {
    const r = mul(((G.seed | 0) + p.id * 7919 + 101) | 0),
      tr = ecoTerreno(p.id),
      s = tr.s,
      clima = (ECO_CIV[E.cul[p.id]] || {}).clima,
      /* río: el cauce real del relieve (mapas v2) o el «río por provincia» de combate (mapas viejos) */
      rio =
        ecoCacheT && ecoCacheT.relieve
          ? tr.rio > 0
          : typeof cmbTerreno === "function"
            ? !!cmbTerreno(p).rio
            : r() < 0.2,
      mt = tr.mont || 0,
      esp = E.esp[p.id],
      Y = {},
      nivel = (x, a, b, c) => (x >= c ? 3 : x >= b ? 2 : x >= a ? 1 : 0);
    Y.madera = nivel(s[2] + (r() - 0.5) * 0.1, 0.15, 0.3, 0.45);
    /* las sierras (montañas del relieve) esconden las mejores vetas */
    Y.piedra = nivel(s[3] + mt * 0.8 + (r() - 0.5) * 0.15, 0.15, 0.35, 0.6);
    Y.hierro = nivel(s[3] * 1.1 + mt * 1.5 + r() * 0.45 - 0.25, 0.2, 0.45, 0.75);
    Y.oro =
      s[3] >= 0.3 && r() < (clima === "montes" ? 0.4 : 0.14) * (mt > 0 ? 2 : 1)
        ? r() < 0.3 + mt
          ? 2
          : 1
        : 0;
    Y.estano =
      s[3] >= 0.25 && r() < (clima === "estano" ? 0.5 : 0.1) * (mt > 0 ? 1.5 : 1) ? (r() < 0.3 ? 2 : 1) : 0;
    Y.sal = (tr.costa && r() < 0.35) || (clima === "arido" && r() < 0.3) ? (r() < 0.3 ? 2 : 1) : 0;
    /* una sierra siempre deja al descubierto alguna veta y piedra */
    if (mt > 0) {
      Y.hierro = Math.max(Y.hierro, 1);
      Y.piedra = Math.max(Y.piedra, 1);
    }
    /* la especialidad confirma su yacimiento y lo deja explotado */
    const ex = {},
      espYac = {
        madera: "madera",
        cantera: "piedra",
        hierro: "hierro",
        oro: "oro",
        sal: "sal",
        estano: "estano",
      };
    if (espYac[esp]) {
      Y[espYac[esp]] = Math.max(2, Y[espYac[esp]]);
      ex[ECO_YAC[espYac[esp]].exp] = 1;
    }
    /* otras explotaciones antiguas, sobre los mejores yacimientos */
    for (const k of Object.keys(ECO_YAC))
      if (Y[k] >= 2 && !ex[ECO_YAC[k].exp] && r() < (p.cap ? 0.5 : 0.12)) ex[ECO_YAC[k].exp] = 1;
    for (const k in Y) if (!Y[k]) delete Y[k];
    E.yac[p.id] = Y;
    if (E.exp[p.id] === undefined) {
      E.exp[p.id] = ex;
      /* se levantan como edificios (claves de BLD de tecnología: p.mina, p.cantera...) */
      for (const k in ex) p[k] = Math.max(+p[k] || 0, ex[k]);
    }
    /* fertilidad: llanuras y ríos riegan; colinas y climas secos o de estepa empobrecen */
    let v =
      0.3 +
      s[1] * 0.4 +
      s[2] * 0.1 -
      s[3] * 0.2 +
      (rio ? (tr.rio >= 3 || !(ecoCacheT && ecoCacheT.relieve) ? 0.2 : 0.12) : 0) +
      (tr.costa ? 0.05 : 0) +
      r() * 0.15;
    if (clima === "arido") v += rio ? 0.15 : -0.35;
    if (clima === "estepa") v -= 0.15;
    if (clima === "fertil") v += 0.1;
    if (clima === "montes") v -= 0.05;
    if (esp === "trigo" || esp === "nilo" || esp === "chinampas") v = Math.max(v, 0.75);
    E.fer[p.id] = Math.round(clamp(v, 0.05, 1) * 100) / 100;
  }
}
/* Yacimientos de una provincia: {recurso: riqueza 1..3} */
function ecoYac(p) {
  const E = ecoE();
  return (E && E.yac && E.yac[p.id]) || {};
}
/* Fertilidad: {v: 0..1, txt} */
function ecoFertil(p) {
  const E = ecoE(),
    v = E && E.fer && E.fer[p.id] != null ? E.fer[p.id] : 0.5,
    clima = E && E.cul ? (ECO_CIV[E.cul[p.id]] || {}).clima : null;
  const txt =
    clima === "arido" && v < 0.3
      ? "Desierto"
      : clima === "estepa" && v < 0.5
        ? "Estepa de pastos"
        : v >= 0.8
          ? "Tierras muy fértiles"
          : v >= 0.6
            ? "Tierras fértiles"
            : v >= 0.4
              ? "Tierras corrientes"
              : v >= 0.2
                ? "Tierras pobres"
                : "Tierras yermas";
  return { v, txt };
}
/* nivel efectivo de una explotación: el edificio de tecnología (p[k]) o la establecida al empezar */
function ecoNivelExp(p, k) {
  const E = ecoE(),
    ini = (E && E.exp && E.exp[p.id] && E.exp[p.id][k]) || 0;
  return Math.max(+p[k] || 0, ini);
}
/* Explotaciones en marcha: {mina: n, cantera: n, aserradero: n, salinas: n} (solo las que hay) */
function ecoExplotaciones(p) {
  const o = {};
  for (const k in ECO_EXP) {
    const n = ecoNivelExp(p, k);
    if (n) o[k] = n;
  }
  return o;
}
/* ¿Ve el reino f las tierras de p? (hoy siempre; con niebla de guerra y espías dependerá de ellos) */
function ecoInfoVisible(p, f) {
  if (!p || p.owner === f) return true;
  /* niebla de guerra de campaña: solo lo que se ve ahora (propias, aliadas, torres, ejércitos, espías) */
  if (typeof camInfoVisible === "function")
    try {
      return !!camInfoVisible(p, f);
    } catch (_) {}
  return true;
}
/* ¿Se conocen al menos sus tierras (exploradas alguna vez)? La tierra no cambia: yacimientos y
   fertilidad se recuerdan; producción y explotaciones, solo a la vista. */
function ecoInfoConocida(p, f) {
  if (ecoInfoVisible(p, f)) return true;
  if (typeof camMemProv === "function")
    try {
      return !!camMemProv(f, p.id);
    } catch (_) {}
  return false;
}
/* Recurso principal de una provincia (para el mapa): {id, icono, nombre} o null */
function ecoIconoProv(p) {
  if (!G || !p) return null;
  const y = yields(p),
    best = ECO_RES.map((r) => ({ r, v: (y[r.id] || 0) * r.base })).sort((a, b) => b.v - a.v)[0];
  if (best && best.v > 0) return { id: best.r.id, icono: best.r.icono, nombre: best.r.nombre };
  if (ecoFertil(p).v >= 0.7) return { id: "comida", icono: "❦", nombre: "Grano" };
  return null;
}

/* ---------- rendimiento de una provincia ---------- */
function ecoDesglose(p) {
  const E = ecoE(),
    f = p.owner,
    S = ecoF(f),
    r = G.F[f] ? ruler(f) : null,
    gm = r ? 1 + (r.ge - 5) * 0.03 : 1,
    peste = !!E.peste[p.id],
    an = ecoNivel(p),
    k = (CIV[f] ? CIV[f].gold : 1) * gm * an.oro * (peste ? 0.8 : 1),
    pob = ecoPob(p),
    tr = ecoTerreno(p.id),
    ey = (ECO_ESP[E.esp[p.id]] || {}).y || {};
  const v = ecoFertil(p).v,
    Y = ecoYac(p),
    /* lo que sacan las explotaciones lo suma tecnología (modificador de 'rendimiento', tecRenYac);
       solo si tecnología no está, lo calcula la economía */
    sinTec = typeof tecRenYac !== "function",
    L = (q) => (sinTec ? Math.min(ecoNivelExp(p, q.k), Y[q.r] || 0) : 0);
  let imp = pob * ECO_IMP * (TAXM[p.tax] ?? 1) * k * ecoMultImp(p),
    fo =
      (2.5 +
        pob * ECO_COS * (0.6 + 0.8 * v) +
        (+p.farm || 0) * 5 * (0.7 + 0.6 * v) +
        (p.cap ? 4 : 0) +
        (ey.fo || 0)) *
      an.fo;
  if (S.diezmo) imp *= 0.9;
  if (S.annona) {
    fo += imp * 0.3;
    imp *= 0.75;
  }
  if (peste) fo *= 0.85;
  /* recursos: lo que da la tierra sin más (yacimientos ricos, bosque) y la especialidad */
  const s = tr.s,
    res = {};
  for (const r of ECO_RES) res[r.id] = ey[r.id] || 0;
  res.madera += Math.max(0, (Y.madera || 0) - 1) + L(ECO_EXP.aserradero);
  res.piedra += Math.max(0, (Y.piedra || 0) - 1) + L(ECO_EXP.cantera);
  res.hierro += ((Y.hierro || 0) >= 3 ? 1 : 0) + L(ECO_EXP.mina);
  res.sal += ((Y.sal || 0) >= 2 ? 1 : 0) + L(ECO_EXP.salinas);
  res.caballos += s[1] >= 0.85 && tr.n >= 40 ? 1 : 0;
  /* el oro y el estaño de las minas se venden: oro para el tesoro */
  const mina = sinTec ? ecoNivelExp(p, "mina") : 0,
    minas = Math.min(mina, Y.oro || 0) * 2 + Math.min(mina, Y.estano || 0);
  return {
    imp,
    mer: (+p.market || 0) * 5 * k,
    cap: p.cap ? 6 * k : 0,
    esp: ((ey.g || 0) + minas) * k,
    fo,
    res,
  };
}
function ecoRend(p, d, crudo) {
  const y = { g: d.imp + d.mer + d.cap + d.esp, fo: d.fo, ...d.res };
  /* OC 'rendimiento': {g, fo, madera, piedra, hierro, caballos, sal, vino, seda}. ctx {p, f} */
  const r2 = OC.calc("rendimiento", y, { p, f: p.owner }),
    o = {};
  if (crudo) crudo.g = +r2.g || 0;
  for (const k in r2) o[k] = typeof r2[k] === "number" ? Math.max(0, Math.round(r2[k])) : r2[k];
  return o;
}
function yields(p) {
  return ecoRend(p, ecoDesglose(p));
}

/* ---------- mantenimiento ---------- */
function ecoMant(f, t) {
  const u = UN[t] || {},
    /* los mercenarios no cobran soldada: les paga su contrato (mercenarios.js, cada estación) */
    base = { comida: u.food ?? 1, oro: u.merc ? 0 : (u.cost ?? 10) * ECO_SOLDADA * ecoF(f).infl };
  /* OC 'mantenimientoTropa': {comida, oro} por unidad y año. ctx {f, t} */
  const m = OC.calc("mantenimientoTropa", base, { f, t }) || base;
  return { comida: +m.comida || 0, oro: +m.oro || 0 };
}
const ecoGranero = (f) =>
  Math.round(
    (40 + 12 * owned(f).length + 10 * owned(f).reduce((s, p) => s + (+p.farm || 0), 0)) *
      (OC.saldo(f, "sal") > 0 ? 1.25 : 1),
  );
const ecoTope = (f) => 60 + 15 * owned(f).length;
const ecoLimite = (f, gi) => Math.max(60, Math.round((gi ?? ecoF(f).gi) * 3));
const ecoNecLujo = (f) => Math.max(1, Math.ceil(owned(f).length / 5));

/* ---------- balance anual de una facción (lo que pasará al final del año) ---------- */
function ecoBalance(f) {
  const E = ecoE(),
    S = ecoF(f),
    own = owned(f),
    ids = ECO_RES.map((r) => r.id),
    b = {
      ing: { imp: 0, mer: 0, cap: 0, esp: 0, rut: 0, otr: 0 },
      gas: { tro: 0, edi: 0, int: 0, camp: 0, merc: 0 },
      fo: 0,
      up: 0,
      upCamp: 0,
      prod: {},
      cons: {},
      res: {},
      tropas: 0,
      montadas: 0,
      pob: 0,
      lujo: 0,
    },
    mant = {};
  ids.forEach((k) => (b.prod[k] = b.cons[k] = 0));
  let yg = 0,
    crudo = 0;
  for (const p of own) {
    const d = ecoDesglose(p),
      c = {},
      y = ecoRend(p, d, c);
    crudo += c.g;
    b.ing.imp += d.imp;
    b.ing.mer += d.mer;
    b.ing.cap += d.cap;
    b.ing.esp += d.esp;
    yg += y.g;
    b.fo += y.fo;
    for (const k of ids) b.prod[k] += y[k] || 0;
    b.pob += ecoPob(p);
    for (const t in p.u) {
      const n = +p.u[t] || 0;
      if (!n) continue;
      const m = mant[t] || (mant[t] = ecoMant(f, t));
      b.up += n * m.comida;
      b.gas.tro += n * m.oro;
      b.tropas += n;
      if (ecoMontada(t)) b.montadas += n;
    }
    for (const k in BLD) b.gas.edi += (+p[k] || 0) * ECO_EDI * S.infl;
  }
  /* ejércitos en campaña y contratos mercenarios: los cobra campaña cada estación (aquí, su año entero) */
  for (const e of ecoEjercitos(f)) {
    let propia = true;
    try {
      const q = camProv(e);
      propia = !q || camPropia(f, q.owner);
    } catch (_) {}
    for (const t in e.u) {
      const n = +e.u[t] || 0;
      if (!n || !UN[t]) continue;
      const m = mant[t] || (mant[t] = ecoMant(f, t));
      b.gas.camp += n * m.oro;
      if (propia) b.upCamp += n * m.comida;
      if (UN[t].asedio) continue;
      b.tropas += n;
      if (ecoMontada(t)) b.montadas += n;
    }
  }
  if (G.cam && typeof mercS === "function" && typeof mercPago === "function")
    for (const c of mercS().con || [])
      if (c.f === f)
        b.gas.merc += 4 * mercPago(c.t, typeof mercCuenta === "function" ? mercCuenta(f, c.t) : c.n || 0);
  if (typeof comBalanceRutas === "function") comBalanceRutas(f, b);
  /* "otros" = lo que añaden los modificadores de 'rendimiento'; el redondeo se lo quedan los impuestos */
  b.ing.otr = Math.round(crudo - b.ing.imp - b.ing.mer - b.ing.cap - b.ing.esp);
  for (const k of ["mer", "cap", "esp", "rut"]) b.ing[k] = Math.round(b.ing[k]);
  b.ing.imp = Math.round(yg) - b.ing.mer - b.ing.cap - b.ing.esp - b.ing.otr;
  b.gas.tro = Math.round(b.gas.tro);
  b.gas.edi = Math.round(b.gas.edi);
  b.gas.int = Math.ceil(S.deuda * ECO_INT);
  b.gas.camp = Math.round(b.gas.camp);
  b.gas.merc = Math.round(b.gas.merc);
  b.gi = Object.values(b.ing).reduce((s, v) => s + v, 0);
  b.gg = b.gas.tro + b.gas.edi + b.gas.int + b.gas.camp + b.gas.merc;
  b.g = b.gi - b.gg;
  b.fo = Math.round(b.fo);
  b.upCamp = Math.round(b.upCamp);
  b.up = Math.round(b.up) + b.upCamp;
  b.net = b.fo - b.up;
  /* lo que cobra la economía al cerrar el año (sin lo que campaña cobra por estación) */
  b.gAnual = b.g + b.gas.camp + b.gas.merc;
  b.netAnual = b.net + b.upCamp;
  /* consumos: el ejército gasta hierro y caballos; la corte, bienes de lujo */
  b.cons.hierro += Math.floor(b.tropas / 15);
  b.cons.caballos += Math.floor(b.montadas / 5);
  /* la corte disfruta como mucho tres lujos: los más abundantes */
  const nl = ecoNecLujo(f),
    hay = (r) => OC.saldo(f, r.id) + b.prod[r.id];
  for (const r of ECO_RES.filter((x) => x.lujo && hay(x) >= nl)
    .sort((x, y) => hay(y) - hay(x))
    .slice(0, 3)) {
    b.cons[r.id] += nl;
    b.lujo++;
  }
  for (const k of ids) b.res[k] = b.prod[k] - Math.min(b.cons[k], OC.saldo(f, k) + b.prod[k]);
  b.granero = ecoGranero(f);
  return b;
}
function inc(f) {
  const b = ecoBalance(f);
  /* g = saldo neto de oro del año (ingresos − gastos); net = saldo de comida */
  return { g: b.g, fo: b.fo, up: b.up, net: b.net, gi: b.gi, gg: b.gg, res: b.res };
}
/* Para la barra de recursos de la interfaz: [{id, nombre, icono, saldo, anual}] por cada recurso de OC.recursos */
function ecoResumen(f = ME) {
  if (!G || !G.F[f]) return [];
  const b = ecoBalance(f);
  return OC.recursos.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    icono: r.icono,
    saldo: Math.floor(OC.saldo(f, r.id)),
    anual: r.id === "oro" ? b.g : r.id === "comida" ? b.net : b.res[r.id] || 0,
  }));
}
/* Estado fiscal resumido: {deuda, limite, inflacion, granero, poblacion, levas, tropas} */
function ecoFiscal(f = ME) {
  const S = ecoF(f),
    b = ecoBalance(f);
  return {
    deuda: S.deuda,
    limite: ecoLimite(f, b.gi),
    inflacion: S.infl,
    granero: b.granero,
    poblacion: Math.round(b.pob),
    levas: ecoLevas(f),
    tropas: b.tropas,
  };
}

/* ---------- población y levas ---------- */
const ecoLevas = (f) => Math.round(owned(f).reduce((s, p) => s + ecoPob(p) * ecoNivel(p).lev, 0));
function ecoPresionLevas(f) {
  const lv = ecoLevas(f);
  if (!lv) return 0;
  const x = ecoTropasDe(f) / lv;
  return x > 0.8 ? Math.min(0.8, (x - 0.8) * 1.2) : 0;
}
/* hombres en armas de f: guarniciones y ejércitos en campaña (sin máquinas de asedio) */
function ecoTropasDe(f) {
  const n = (u) =>
    Object.entries(u || {}).reduce((s, [t, v]) => s + (UN[t] && UN[t].asedio ? 0 : +v || 0), 0);
  return owned(f).reduce((s, p) => s + n(p.u), 0) + ecoEjercitos(f).reduce((s, e) => s + n(e.u), 0);
}
/* tasa anual de crecimiento (fracción) de una provincia */
function ecoTasa(p) {
  const E = ecoE(),
    f = p.owner,
    S = ecoF(f),
    pob = ecoPob(p),
    K = ecoCapacidad(p);
  let r = 0.05;
  if (p.tax === 2) r -= 0.012;
  if (p.tax === 0) r += 0.008;
  r += ecoNivel(p).pob;
  if (p.recent) r -= 0.02;
  if (f < NF && hostile(p, f).some((q) => tot(q.u) >= 4)) r -= 0.01;
  let g = r > 0 ? r * (1 - pob / K) : r;
  if (pob > K) g = Math.min(g, -0.03);
  if (S.hambre > 0) g -= 0.05;
  if (E.peste[p.id]) g -= 0.1;
  return g;
}
function ecoCrecer(p) {
  const E = ecoE(),
    pob = ecoPob(p);
  E.pob[p.id] = Math.round(clamp(pob * (1 + ecoTasa(p)), 1, ecoCapacidad(p) * 1.15) * 10) / 10;
}
/* pérdida de población por guerra o desastre (fracción) */
function ecoDiezmar(p, fr) {
  const E = ecoE();
  E.pob[p.id] = clamp(Math.round(ecoPob(p) * (1 - fr) * 10) / 10, 1, Math.max(1, ecoCapacidad(p) * 1.15));
}

/* ---------- orden público y ánimo del pueblo ----------
   El orden (p.order, 0-100) tiende cada año hacia el orden objetivo (ordTarget), que es la suma de
   causas visibles más los modificadores de otros sistemas. El ánimo es el nombre de ese orden. */
const ECO_ANIMO = [
  {
    id: "furioso",
    nombre: "Furioso",
    icono: "✖",
    color: "#e0503f",
    min: 0,
    oro: 0.4,
    fo: 0.7,
    pob: -0.03,
    lev: 0.3,
    des: 0.1,
  },
  {
    id: "disgustado",
    nombre: "Disgustado",
    icono: "☹",
    color: "#ef7a55",
    min: 15,
    oro: 0.6,
    fo: 0.85,
    pob: -0.015,
    lev: 0.6,
    des: 0.04,
  },
  {
    id: "inquieto",
    nombre: "Inquieto",
    icono: "!",
    color: "#e8b632",
    min: 30,
    oro: 0.85,
    fo: 1,
    pob: -0.005,
    lev: 0.8,
    des: 0,
  },
  {
    id: "neutral",
    nombre: "Neutral",
    icono: "○",
    color: "#a2abb0",
    min: 45,
    oro: 1,
    fo: 1,
    pob: 0,
    lev: 0.9,
    des: 0,
  },
  {
    id: "contento",
    nombre: "Contento",
    icono: "☺",
    color: "#9ccc65",
    min: 60,
    oro: 1.05,
    fo: 1,
    pob: 0.004,
    lev: 0.95,
    des: 0,
  },
  {
    id: "feliz",
    nombre: "Feliz",
    icono: "✿",
    color: "#6fcf6a",
    min: 75,
    oro: 1.1,
    fo: 1.05,
    pob: 0.008,
    lev: 1,
    des: 0,
  },
  {
    id: "leal",
    nombre: "Leal",
    icono: "★",
    color: "#f2c14e",
    min: 90,
    oro: 1.15,
    fo: 1.05,
    pob: 0.01,
    lev: 1.1,
    des: 0,
  },
];
function ecoNivel(p) {
  let n = ECO_ANIMO[0];
  for (const x of ECO_ANIMO) if ((p.order ?? 50) >= x.min) n = x;
  return n;
}
/* efectos temporales de decisiones activos este año */
const ecoEfectos = (p) => ((G.eco && G.eco.efe && G.eco.efe[p.id]) || []).filter((x) => x.h >= G.year);
const ecoMultImp = (p) =>
  ((G.eco && G.eco.efe && G.eco.efe[p.id]) || []).reduce(
    (m, x) => (x.imp !== undefined && x.hi >= G.year ? m * x.imp : m),
    1,
  );
/* causas propias del orden objetivo: [{texto, valor}] (sin la base de 55) */
function ecoCausasBase(p) {
  const f = p.owner,
    r = ruler(f),
    S = ecoF(f),
    E = ecoE(),
    c = [],
    add = (texto, valor) => valor && c.push({ texto, valor });
  add(`Impuestos ${(TAX[p.tax] || "").toLowerCase()}`, TAXO[p.tax] ?? 0);
  add("Templo", (+p.temple || 0) * 12);
  add(`Costumbres de ${CIV[f].s}`, CIV[f].ord || 0);
  add("Guarnición que impone respeto", tot(p.u) >= 6 ? 6 : 0);
  if (r) {
    add("Soberano piadoso", r.tr === "Piadoso" ? 5 : 0);
    add("Soberano justo", r.tr === "Justo" ? 3 : 0);
    add("Soberano cruel", r.tr === "Cruel" ? -3 : 0);
    add("Regencia de un menor", r.age < 16 ? -10 : 0);
  }
  add("Conquista reciente", p.recent ? -25 : 0);
  add("Diezmo a la Iglesia", S.diezmo ? 5 : 0);
  add("Lujos en la corte", Math.min(6, (S.lujo || 0) * 2));
  add("Graneros llenos", S.abund ? 3 : 0);
  add("Hambre en el reino", S.hambre > 0 ? -10 : 0);
  add("Moneda devaluada", -Math.round((S.infl - 1) * 40));
  add("Deudas del tesoro", -ecoPenaDeuda(f));
  add("Peste", E.peste[p.id] ? -8 : 0);
  add(
    "Enemigos en la frontera",
    f < NF && hostile(p, f).some((q) => q.owner !== REB && tot(q.u) >= 4) ? -4 : 0,
  );
  add("Saqueos y batallas", ecoSaqueada(p) ? -6 : 0);
  add("Ciudad sitiada", G.cam && G.cam.as && G.cam.as[p.id] ? -5 : 0);
  add("Hacinamiento", ecoPob(p) > ecoCapacidad(p) ? -4 : 0);
  for (const x of ecoEfectos(p)) add(x.t, x.o);
  return c;
}
function ordTarget(p) {
  const f = p.owner;
  if (f === REB) return 50;
  const base = 55 + ecoCausasBase(p).reduce((s, x) => s + x.valor, 0);
  /* OC 'ordenObjetivo': orden hacia el que tiende la provincia. ctx {p, f} */
  return clamp(OC.calc("ordenObjetivo", base, { p, f }), 0, 100);
}
/* batalla o saqueo en la provincia este año o el anterior (propio o de los campamentos de campaña) */
function ecoSaqueada(p) {
  const E = ecoE(),
    cs = G.cam && G.cam.saq && G.cam.saq[p.id];
  return E.saq[p.id] >= G.year - 1 || (cs != null && parseInt(cs, 10) >= G.year - 1);
}
/* Saqueo de una comarca (para campaña): población, orden y memoria del ánimo. Devuelve el botín
   sugerido en oro (2 + 0,45 por millar de almas). */
function ecoSaqueo(p, fr = 0.02, orden = 6) {
  if (!G || !p) return 0;
  const botin = Math.round(2 + ecoPob(p) * 0.45);
  ecoDiezmar(p, fr);
  p.order = clamp(p.order - orden, 0, 100);
  ecoE().saq[p.id] = G.year;
  return botin;
}
/* reparte lo que añaden los modificadores de 'ordenObjetivo' según el sistema que los registró */
const ECO_ORIGEN = [
  [/\bsoc[A-Z]/, "Corte y estamentos"],
  [/\btec[A-Z]/, "Técnicas y edificios"],
  [/\bnar[A-Z]/, "Sucesos"],
  [/\bdip[A-Z]/, "Diplomacia"],
  [/\bcmb[A-Z]/, "Ejército"],
];
function ecoModsOrden(v, ctx) {
  const out = {};
  for (const { fn } of OC._mod.ordenObjetivo || []) {
    let n;
    try {
      n = fn(v, ctx);
    } catch (e) {
      continue;
    }
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    const src = String(fn),
      k = (ECO_ORIGEN.find(([re]) => re.test(src)) || [0, "Otros"])[1];
    out[k] = (out[k] || 0) + (n - v);
    v = n;
  }
  return { v, out };
}
/* Ánimo del pueblo de una provincia: {id, nombre, icono, color, orden, objetivo, tendencia, causas:[{texto, valor}]} */
function ecoAnimo(p) {
  const n = ecoNivel(p),
    o = { id: n.id, nombre: n.nombre, icono: n.icono, color: n.color, orden: p.order };
  if (!G || p.owner === REB || !G.F[p.owner])
    return { ...o, objetivo: 50, tendencia: 50 - p.order, causas: [] };
  const f = p.owner,
    causas = ecoCausasBase(p),
    m = ecoModsOrden(55 + causas.reduce((s, x) => s + x.valor, 0), { p, f });
  /* la fe de la provincia la calcula sociedad dentro de su modificador: se muestra aparte */
  if (
    typeof socFe === "function" &&
    typeof socF === "function" &&
    m.out["Corte y estamentos"] !== undefined
  ) {
    const fe = socFe(p),
      so = socF(f);
    if (fe && fe !== CIV[f].rel && so) {
      const v = { tol: -1, neu: -4, celo: -8 }[so.pol] || 0,
        nf = typeof SOC_FEN !== "undefined" && SOC_FEN[fe] ? SOC_FEN[fe] : fe;
      if (v) causas.push({ texto: `Fe ${nf}, distinta del soberano`, valor: v });
      m.out["Corte y estamentos"] -= v;
    }
  }
  for (const k in m.out) if (Math.round(m.out[k])) causas.push({ texto: k, valor: Math.round(m.out[k]) });
  const objetivo = Math.round(clamp(m.v, 0, 100));
  causas.sort((a, b) => b.valor - a.valor);
  return { ...o, objetivo, tendencia: objetivo - p.order, causas };
}
/* Para asedios: −1 (la ciudad abriría las puertas al sitiador) .. +1 (resistiría hasta el final) */
function ecoApoyoAsedio(p, sitiador = null) {
  if (!G || !p) return 0;
  const n = ecoNivel(p);
  let v = (p.order - 50) / 50 + (n.id === "leal" ? 0.2 : n.id === "feliz" ? 0.1 : 0);
  if (p.owner < NF && ecoF(p.owner).hambre > 0) v -= 0.2;
  if (ecoE().peste[p.id]) v -= 0.1;
  if (sitiador != null && sitiador !== p.owner && sitiador < NF) {
    if (p.home === sitiador) v -= 0.3;
    const fe = typeof socFe === "function" ? socFe(p) : null;
    if (fe && CIV[sitiador] && fe === CIV[sitiador].rel && fe !== (CIV[p.owner] || {}).rel) v -= 0.2;
  }
  return clamp(Math.round(v * 100) / 100, -1, 1);
}

/* ---------- decisiones de gobierno de una ciudad ----------
   coste(p) → bolsa; ok(p) → disponible según el ánimo; cd = años de espera; fx(p) aplica el efecto */
const ECO_DEC = {
  juegos: {
    n: "Juegos y fiestas",
    d: "+10 ánimo, 3 años",
    cd: 4,
    coste: (p) => ({ oro: Math.round(8 + ecoPob(p)) }),
    ok: () => true,
    fx: (p) => {
      ecoEfecto(p, "juegos", "Juegos y fiestas", 10, 3);
      p.order = clamp(p.order + 5, 0, 100);
    },
  },
  grano: {
    n: "Reparto de grano",
    d: "+8 ánimo, 2 años",
    cd: 3,
    coste: (p) => ({ comida: Math.round(10 + ecoPob(p) * 0.8) }),
    ok: () => true,
    fx: (p) => {
      ecoEfecto(p, "grano", "Reparto de grano", 8, 2);
      p.order = clamp(p.order + 4, 0, 100);
      ecoDiezmar(p, -0.02);
    },
  },
  notables: {
    n: "Escuchar a los notables",
    d: "+6 ánimo, 3 años",
    cd: 3,
    coste: () => ({ oro: 15 }),
    ok: (p) => p.order < 60,
    fx: (p) => {
      ecoEfecto(p, "notables", "Notables escuchados", 6, 3);
      p.order = clamp(p.order + 3, 0, 100);
    },
  },
  condona: {
    n: "Condonar tributos",
    d: "sin impuestos 1 año; +12 ánimo, 2 años",
    cd: 5,
    coste: () => ({}),
    ok: (p) => p.order < 75,
    fx: (p) => ecoEfecto(p, "condona", "Tributos condonados", 12, 2, 0, 1),
  },
  negociar: {
    n: "Negociar con los descontentos",
    d: "impuestos bajos; +15 ánimo, 3 años",
    cd: 5,
    coste: () => ({ oro: 10 }),
    ok: (p) => p.order < 30,
    fx: (p) => {
      p.tax = 0;
      ecoEfecto(p, "negociar", "Pacto con los descontentos", 15, 3);
    },
  },
  castigo: {
    n: "Castigar a los cabecillas",
    d: "+12 orden ya; −5 ánimo, 3 años",
    cd: 4,
    coste: () => ({}),
    ok: (p) => p.order < 30 && tot(p.u) >= 2,
    fx: (p) => {
      p.order = clamp(p.order + 12, 0, 100);
      ecoEfecto(p, "castigo", "Cabecillas ajusticiados", -5, 3);
      ecoDiezmar(p, 0.02);
    },
  },
  marcial: {
    n: "Ley marcial",
    d: "+20 orden ya; −8 ánimo 4 años, −5% almas",
    cd: 5,
    coste: () => ({}),
    ok: (p) => p.order < 45 && tot(p.u) >= 3,
    fx: (p) => {
      p.order = clamp(p.order + 20, 0, 100);
      ecoEfecto(p, "marcial", "Recuerdo de la ley marcial", -8, 4);
      ecoDiezmar(p, 0.05);
    },
  },
  colonos: {
    n: "Exención para colonos",
    d: "+8% almas, +4 ánimo; ½ impuestos 3 años",
    cd: 8,
    coste: () => ({ oro: 20 }),
    ok: (p) => p.order >= 30 && ecoPob(p) < ecoCapacidad(p) * 0.85,
    fx: (p) => {
      ecoDiezmar(p, -0.08);
      ecoEfecto(p, "colonos", "Colonos exentos", 4, 3, 0.5, 3);
    },
  },
};
/* añade (o renueva) un efecto temporal: o = ánimo durante `anios`; imp = multiplicador de impuestos durante `ai` años */
function ecoEfecto(p, k, t, o, anios, imp, ai) {
  const E = ecoE(),
    l = (E.efe[p.id] || []).filter((x) => x.k !== k),
    x = { k, t, o, h: G.year + anios - 1 };
  if (imp !== undefined) Object.assign(x, { imp, hi: G.year + ai - 1 });
  l.push(x);
  E.efe[p.id] = l;
}
const ecoEspera = (p, k) => Math.max(0, ((ecoE().dec[p.id] || {})[k] || 0) - G.year);
function ecoPuedeDecidir(f, p, k) {
  const D = ECO_DEC[k];
  return !!D && p.owner === f && f < NF && D.ok(p) && !ecoEspera(p, k) && OC.puedePagar(f, D.coste(p));
}
function ecoDecision(f, p, k) {
  const D = ECO_DEC[k];
  if (!ecoPuedeDecidir(f, p, k) || !OC.pagar(f, D.coste(p))) return false;
  D.fx(p);
  const E = ecoE();
  E.dec[p.id] = { ...(E.dec[p.id] || {}), [k]: G.year + D.cd };
  if (isMe(f)) addLog(`${D.n} en ${p.name}.`);
  return true;
}
OC.accion("eca", (v) => {
  const [k, i] = v.split(":"),
    p = G.P[+i];
  if (p) ecoDecision(ME, p, k);
});

function ecoPenaDeuda(f) {
  const S = ecoF(f);
  if (!(S.deuda > 0)) return 0;
  return Math.min(12, 2 + Math.round((S.deuda / Math.max(20, S.gi || 20)) * 3));
}

/* ---------- pérdidas de tropas (hambre, impagos, bancarrota, licenciamiento) ---------- */
function ecoDesercion(f, fr) {
  let lost = 0;
  const quitar = (u) => {
    for (const t in u) {
      if (UN[t] && UN[t].asedio) continue;
      const n = +u[t] || 0,
        x = n * fr,
        l = Math.min(n, Math.floor(x) + (R() < x % 1 ? 1 : 0));
      u[t] = n - l;
      lost += l;
    }
  };
  for (const p of owned(f)) quitar(p.u);
  /* también desertan de los ejércitos en campaña */
  for (const e of ecoEjercitos(f)) if (e.u) quitar(e.u);
  return lost;
}
function ecoCrisis(f, tipo, extra = {}) {
  OC.emitirSync("crisisEconomica", { f, tipo, ...extra });
}

/* ---------- final del año de una facción ---------- */
function economy(f) {
  if (!alive(f)) return;
  const F = G.F[f],
    S = ecoF(f),
    b = ecoBalance(f),
    me = isMe(f),
    own = owned(f);
  S.gi = b.gi;
  S.lujo = b.lujo;
  S.lev = ecoPresionLevas(f);
  /* oro (la soldada de los ejércitos en campaña y los contratos mercenarios ya los cobra campaña) */
  F.gold += b.gAnual;
  /* recursos, con tope de almacén */
  const tope = ecoTope(f);
  F.res = F.res || {};
  for (const r of ECO_RES) F.res[r.id] = clamp(Math.floor(OC.saldo(f, r.id) + b.res[r.id]), 0, tope);
  /* comida: hambre o grano que se pudre por falta de graneros */
  F.food += b.netAnual;
  if (S.hambre > 0) S.hambre--;
  if (F.food < 0) {
    const lost = ecoDesercion(f, 0.15);
    F.food = 0;
    S.hambre = 2;
    own.forEach((p) => ecoDiezmar(p, 0.04));
    if (me) addLog(`Hambre en el reino: desertan ${lost} soldados y mueren muchos campesinos.`, "bad");
    ecoCrisis(f, "hambre", { perdidas: lost });
  } else if (F.food > ecoGranero(f)) {
    const gr = ecoGranero(f),
      x = F.food - gr;
    F.food = gr;
    if (me && x >= 5) addLog(`Los graneros rebosan: se pudren ${x} de comida.`);
  }
  /* deuda */
  ecoDeuda(f, b);
  /* la moneda recupera poco a poco su crédito */
  if (S.infl > 1) S.infl = Math.max(1, Math.round((S.infl - 0.01) * 100) / 100);
  if (S.cred > 0) S.cred--;
  S.abund = F.food >= ecoGranero(f) * 0.6;
  /* población */
  for (const p of own) ecoCrecer(p);
  /* ánimo: deserciones en ciudades hostiles, efectos que caducan, aviso de descontento general */
  const E = ecoE();
  let mal = 0,
    huidos = 0;
  for (const p of own) {
    const an = ecoNivel(p);
    if (an.des)
      for (const t in p.u) {
        const n = +p.u[t] || 0,
          x = n * an.des,
          l = Math.min(n, Math.floor(x) + (R() < x % 1 ? 1 : 0));
        p.u[t] = n - l;
        huidos += l;
      }
    if (an.min < 30) mal++;
  }
  if (me && huidos)
    addLog(`En las ciudades descontentas desertan ${huidos} soldados de la guarnición.`, "bad");
  if (mal >= 2 && mal >= own.length * 0.35 && S.desc < G.year - 2) {
    S.desc = G.year;
    if (me) addLog(`El descontento cunde: ${mal} ciudades están disgustadas o furiosas.`, "bad");
    ecoCrisis(f, "descontento", { ciudades: mal });
  }
  /* orden y revueltas */
  for (const p of owned(f)) {
    p.order = clamp(p.order + clamp(ordTarget(p) - p.order, -8, 8), 0, 100);
    if (p.recent) p.recent--;
    if (p.order < 20 && R() < 0.35) {
      addLog(`¡Revuelta en ${p.name}! Los bagaudas expulsan a ${CIV[f].s}.`, me ? "bad" : "");
      OC.emitirSync("revuelta", { p, de: f });
      p.owner = REB;
      p.u = { i: 3 + Math.min(4, Math.round(ecoPob(p) / 6)) + ri(0, 1), a: 2, c: 0 };
      p.gen = null;
      p.order = 50;
      p.tax = 1;
      delete E.efe[p.id];
      if (typeof comRevisarRutas === "function") comRevisarRutas();
      ecoPerderAlmacenes(f);
    }
  }
  /* caducan los efectos de las decisiones que acababan este año */
  for (const p of own)
    if (E.efe[p.id]) {
      E.efe[p.id] = E.efe[p.id].filter((x) => x.h > G.year || x.hi > G.year);
      if (!E.efe[p.id].length) delete E.efe[p.id];
    }
}
function ecoDeuda(f, b) {
  const F = G.F[f],
    S = ecoF(f),
    me = isMe(f);
  if (F.gold < 0) {
    const x = -F.gold;
    S.deuda += x;
    F.gold = 0;
    if (me) addLog(`Los argentarii adelantan ${x} de oro al tesoro. La deuda asciende a ${S.deuda}.`, "bad");
  }
  const lim = ecoLimite(f, b.gi);
  if (S.deuda <= lim) {
    S.sobre = 0;
    return;
  }
  S.sobre++;
  if (S.deuda > lim * 1.6 || S.sobre >= 3) {
    S.deuda = Math.round(S.deuda * 0.3);
    S.infl = Math.round((S.infl + 0.1) * 100) / 100;
    S.cred = 6;
    S.sobre = 0;
    const lost = ecoDesercion(f, 0.2);
    owned(f).forEach((p) => (p.order = clamp(p.order - 15, 0, 100)));
    addLog(
      me
        ? `Bancarrota: el tesoro repudia sus deudas. Desertan ${lost} soldados y nadie volverá a prestarte en años.`
        : `${CIV[f].s} cae en bancarrota y repudia sus deudas.`,
      me ? "bad" : "",
    );
    ecoCrisis(f, "bancarrota", { perdidas: lost });
  } else {
    const lost = ecoDesercion(f, 0.08);
    owned(f).forEach((p) => (p.order = clamp(p.order - 5, 0, 100)));
    if (me) addLog(`Impagos: las tropas no cobran su soldada y desertan ${lost} hombres.`, "bad");
    ecoCrisis(f, "impagos", { perdidas: lost });
  }
}

/* ---------- decisiones de hacienda (jugador e IA) ---------- */
const ecoCosteReacunar = (f) => Math.max(40, Math.round((ecoF(f).gi || 30) * 0.8));
const ecoGananciaRecorte = (f) => Math.max(20, Math.round((ecoF(f).gi || 30) * 0.6));
function ecoDecidir(f, v) {
  const F = G.F[f],
    S = ecoF(f),
    me = isMe(f);
  if (v === "diezmo") {
    S.diezmo = !S.diezmo;
    if (me)
      addLog(
        S.diezmo
          ? "Cedes el diezmo a la Iglesia: los obispos predican obediencia."
          : "Retiras el diezmo a la Iglesia.",
      );
    return true;
  }
  if (v === "annona") {
    S.annona = !S.annona;
    if (me)
      addLog(
        S.annona
          ? "Parte del tributo se cobrará en grano (annona)."
          : "El tributo vuelve a cobrarse en moneda.",
      );
    return true;
  }
  if (v === "recorte") {
    if (S.mon === G.year) return false;
    const x = ecoGananciaRecorte(f);
    F.gold += x;
    S.infl = Math.round((S.infl + 0.1) * 100) / 100;
    S.mon = G.year;
    owned(f).forEach((p) => (p.order = clamp(p.order - 4, 0, 100)));
    if (me) addLog(`Recortas la ley del sólido: ganas ${x} de oro, pero los precios suben.`, "bad");
    else addLog(`${CIV[f].s} recorta la ley de su moneda.`);
    ecoCrisis(f, "inflacion", { inflacion: S.infl });
    return true;
  }
  if (v === "reacunar") {
    const c = ecoCosteReacunar(f);
    if (S.mon === G.year || S.infl <= 1 || F.gold < c) return false;
    F.gold -= c;
    S.infl = Math.max(1, Math.round((S.infl - 0.1) * 100) / 100);
    S.mon = G.year;
    if (me) addLog(`Reacuñas la moneda con buena ley por ${c} de oro.`, "good");
    return true;
  }
  if (v === "prestamo") {
    if (S.cred > 0 || S.deuda + 55 > ecoLimite(f)) return false;
    F.gold += 50;
    S.deuda += 55;
    if (me) addLog("Tomas prestados 50 de oro de los argentarii; devolverás 55 con intereses.");
    return true;
  }
  if (v === "saldar") {
    const x = Math.min(50, F.gold, S.deuda);
    if (x <= 0) return false;
    F.gold -= x;
    S.deuda -= x;
    if (me)
      addLog(
        S.deuda ? `Devuelves ${x} de oro a los acreedores.` : "Saldas por completo la deuda del tesoro.",
        "good",
      );
    return true;
  }
  return false;
}
OC.accion("eco", (v) => {
  ecoDecidir(ME, v);
});

/* ---------- inteligencia artificial: hacienda ---------- */
/* tras la economía de cada facción (antes de que la IA mueva): deudas, políticas, licencias */
OC.on("economiaFaccion", (f) => {
  if (!G || human(f) || !alive(f)) return;
  ecoIA(f);
});
/* tras mover la IA: impuestos por provincia (la IA de combate los fija a su manera; aquí se afinan) */
OC.on("turnoIA", (f) => {
  if (!G || human(f) || !alive(f)) return;
  ecoIATasas(f);
});
function ecoIA(f) {
  const F = G.F[f],
    S = ecoF(f);
  let b = ecoBalance(f);
  /* deudas: pagar si sobra */
  if (S.deuda > 0 && F.gold > 25) {
    const x = Math.min(S.deuda, F.gold - 15);
    F.gold -= x;
    S.deuda -= x;
  }
  const own = owned(f),
    ord = own.reduce((s, p) => s + p.order, 0) / Math.max(1, own.length);
  /* políticas */
  if (!S.diezmo && (ord < 45 || own.filter((p) => p.order < 35).length >= 2)) ecoDecidir(f, "diezmo");
  else if (S.diezmo && ord > 68) ecoDecidir(f, "diezmo");
  if (!S.annona && b.net < 0 && F.food < 25) ecoDecidir(f, "annona");
  else if (S.annona && b.net > 6) ecoDecidir(f, "annona");
  if (S.deuda > ecoLimite(f, b.gi) * 0.75 && S.infl < 1.3 && ord > 55) ecoDecidir(f, "recorte");
  else if (S.infl >= 1.15 && !S.deuda && F.gold > ecoCosteReacunar(f) * 2) ecoDecidir(f, "reacunar");
  /* comercio y mercado */
  if (typeof comIA === "function") comIA(f);
  /* ciudades descontentas: hasta dos decisiones al año, sin vaciar el tesoro ni el granero */
  ecoIACiudades(f, b);
  /* déficit crónico: licenciar tropas de retaguardia */
  b = ecoBalance(f);
  if (b.g < 0 && F.gold + b.g * 2 < 0) ecoLicenciar(f, -b.g + Math.ceil(b.gi * 0.05));
}
function ecoIACiudades(f, b) {
  const F = G.F[f];
  let n = 0;
  for (const p of owned(f).sort((a, c) => a.order - c.order)) {
    if (n >= 2 || p.order >= 42) break;
    const t = ordTarget(p);
    if (t >= p.order + 10 && p.order >= 25) continue; /* ya va a mejor por sí sola */
    const pref =
      p.order < 22
        ? ["negociar", "marcial", "castigo", "juegos", "condona", "grano"]
        : ["juegos", "grano", "notables", "condona", "negociar"];
    for (const k of pref) {
      const c = ECO_DEC[k].coste(p);
      if ((c.oro || 0) && F.gold - c.oro < 15) continue;
      if ((c.comida || 0) && F.food - c.comida < Math.max(10, -b.net * 2)) continue;
      if (ecoDecision(f, p, k)) {
        n++;
        break;
      }
    }
  }
}
function ecoLicenciar(f, need) {
  const own = owned(f).sort((a, b) => foes(a, f).length - foes(b, f).length || tot(b.u) - tot(a.u)),
    tr0 = own.reduce((s, p) => s + tot(p.u), 0);
  let ahorro = 0,
    n = 0;
  for (const p of own)
    for (const t of Object.keys(p.u).sort((a, b) => ecoMant(f, b).oro - ecoMant(f, a).oro)) {
      while (p.u[t] > 0 && tot(p.u) > 2 && ahorro < need && n < tr0 * 0.25) {
        p.u[t]--;
        ahorro += ecoMant(f, t).oro;
        n++;
      }
    }
  return n;
}
function ecoIATasas(f) {
  const S = ecoF(f),
    /* un tesoro rebosante permite aliviar a los campesinos: más orden y más población */
    rico = G.F[f].gold > 150 + (S.gi || 30) * 4;
  for (const p of owned(f)) {
    let best = 0;
    for (const t of rico ? (p.order < 60 ? [] : [1]) : [2, 1]) {
      p.tax = t;
      const ok = ordTarget(p) >= (S.deuda > 0 ? 38 : 45) && p.order >= (t === 2 ? 50 : 35) && !p.recent;
      if (ok) {
        best = t;
        break;
      }
    }
    p.tax = best;
  }
}

/* ---------- reacciones a la guerra ---------- */
OC.on("batallaResuelta", (r) => {
  if (!G || !r || !r.p) return;
  ecoDiezmar(r.p, 0.03);
  ecoE().saq[r.p.id] = G.year;
});
OC.on("conquista", (r) => {
  if (!G || !r || !r.p) return;
  ecoDiezmar(r.p, 0.05);
  delete ecoE().efe[r.p.id];
  if (typeof comRevisarRutas === "function") comRevisarRutas();
  ecoPerderAlmacenes(r.de);
});
OC.on("revuelta", (r) => r && ecoPerderAlmacenes(r.de));
/* al perder una provincia se pierden sus graneros y almacenes: lo que ya no cabe, se pierde */
/* al cerrar el año (tras todas las conquistas, cesiones y regalos) nada queda por encima de los almacenes */
OC.on("finAnio", () => {
  if (!G) return;
  for (let f = 0; f < NF; f++) ecoPerderAlmacenes(f, true);
});
function ecoPerderAlmacenes(f, callado) {
  if (!G || f == null || f >= REB || !G.F[f] || !alive(f)) return;
  const F = G.F[f],
    gr = ecoGranero(f),
    tope = ecoTope(f);
  const antes = F.food;
  if (F.food > gr) F.food = gr;
  F.res = F.res || {};
  for (const r of ECO_RES) if (F.res[r.id] > tope) F.res[r.id] = tope;
  if (!callado && isMe(f) && antes - F.food >= 5)
    addLog(`Con la provincia perdida se pierden sus graneros: ${antes - F.food} de comida.`, "bad");
}
OC.on("partidaLista", () => {
  if (G) ecoE();
});
/* una vez al año, antes de la economía de las facciones: peste y población rebelde */
OC.on("antesFinAnio", () => {
  if (!G) return;
  ecoPesteAnual();
  for (const p of G.P) if (p.owner === REB) ecoCrecer(p);
});
function ecoPesteAnual() {
  const E = ecoE(),
    nuevos = [];
  for (const k of Object.keys(E.peste)) {
    const id = +k;
    if (MAP)
      for (const j of MAP.adj[id] || [])
        if (!E.peste[j] && !(E.inm[j] > G.year) && R() < 0.15 && !nuevos.includes(j)) nuevos.push(j);
    if (--E.peste[k] <= 0) {
      delete E.peste[k];
      E.inm[id] = G.year + 12;
    }
  }
  if (R() < 0.05) {
    const c = G.P.filter((p) => !E.peste[p.id] && !(E.inm[p.id] > G.year) && ecoPob(p) >= 8);
    if (c.length) nuevos.push(pick(c).id);
  }
  for (const id of nuevos) {
    const p = G.P[id];
    E.peste[id] = 2;
    if (isMe(p.owner))
      addLog(`La peste se declara en ${p.name}: se vacían los campos y los mercados.`, "bad");
    else if (MAP && MAP.adj[id].some((j) => G.P[j].owner === ME))
      addLog(`Llegan noticias de peste en ${p.name}.`);
    if (p.owner < NF) ecoCrisis(p.owner, "peste", { p });
  }
}

/* inflación: la construcción también se paga en moneda devaluada */
OC.mod(
  "costeConstruccion",
  (c, { f }) => {
    if (!G || !c || typeof c !== "object" || !(c.oro > 0)) return;
    const k = ecoF(f).infl;
    return k > 1 ? { ...c, oro: Math.round(c.oro * k) } : c;
  },
  10,
);
/* coste de reclutar: moneda, existencias de hierro y caballos, levas agotadas, soldada atrasada */
OC.mod(
  "costeUnidad",
  (v, { f, t }) => {
    if (!G || f == null || f < 0 || f >= NF || !G.F[f]) return;
    const S = ecoF(f);
    let m = S.infl || 1;
    if (ecoMontada(t)) {
      const c = OC.saldo(f, "caballos");
      if (!ecoSinCaballos(f)) m *= c >= 6 ? 0.88 : c <= 0 ? 1.2 : 1;
    } else {
      const h = OC.saldo(f, "hierro");
      m *= h >= 10 ? 0.92 : h <= 0 ? 1.12 : 1;
    }
    m *= 1 + (S.lev || 0);
    if (S.sobre > 0) m *= 1.2;
    return v * m;
  },
  10,
);

/* ---------- sección de provincia: hacienda e impuestos ---------- */
const ecoN = (v) => (Math.round(v * 10) / 10).toLocaleString("es-ES");
const ecoSig = (v) => (v > 0 ? "+" + v : v < 0 ? "−" + -v : "0");
OC.seccion("prov", {
  id: "impuestos",
  orden: 40,
  render: ({ p, mine }, dis) => {
    const es = ecoEspecialidad(p),
      tasa = ecoTasa(p),
      E = ecoE();
    let h = `<h3>Hacienda</h3><p class="eco-pv"><span title="Población en miles de almas">${ecoN(ecoPob(p))} mil almas <i class="${tasa > 0.004 ? "eco-up" : tasa < -0.004 ? "eco-dn" : ""}">${tasa > 0.004 ? "▲" : tasa < -0.004 ? "▼" : "="}</i></span> · <span title="${esc(es.d)}">${es.n}</span>${E.peste[p.id] ? ' · <b class="eco-dn">peste</b>' : ""}</p>`;
    if (mine)
      h += `<div class="g3">${TAX.map((t, i) => `<button data-act="tax-${i}" class="${p.tax === i ? "on" : ""}" ${dis ? "disabled" : ""} title="Impuestos ${t.toLowerCase()}">${t}<small>${Math.round(TAXM[i] * 100)}% · ${ecoSig(TAXO[i])} ord.</small></button>`).join("")}</div>`;
    else if (typeof comBotonHasta === "function") h += comBotonHasta(p, dis);
    return h;
  },
});
/* ---------- sección de provincia: tierras (propias y ajenas) ---------- */
const ecoPuntos = (n) => "●".repeat(n) + "○".repeat(Math.max(0, 3 - n));
function ecoTierrasHtml(p, vista = true) {
  const y = vista ? yields(p) : {},
    fe = ecoFertil(p),
    Y = ecoYac(p),
    ex = vista ? ecoExplotaciones(p) : {},
    prod = [
      ["oro", "◉", "Oro", y.g],
      ["comida", "❦", "Comida", y.fo],
      ...ECO_RES.map((r) => [r.id, r.icono, r.nombre, y[r.id]]),
    ]
      .filter((x) => x[3] > 0)
      .map(([, i, n, v]) => `<span title="${n}">${i}${v}</span>`)
      .join(" ");
  let h = `<p class="eco-pv"><span class="eco-fer${fe.v < 0.35 ? " eco-dn" : fe.v < 0.55 ? " eco-med" : ""}" title="Fertilidad ${Math.round(fe.v * 100)}%">❦ ${fe.txt}</span>${prod ? `<br><span class="stats">Al año: ${prod}</span>` : ""}${vista ? "" : '<br><span class="stats">Lo que recuerdan tus exploradores; hoy no la ves.</span>'}</p>`;
  const yac = Object.keys(ECO_YAC).filter((k) => Y[k]);
  if (yac.length)
    h += `<ul class="eco-yac">${yac
      .map((k) => {
        const d = ECO_YAC[k],
          n = ex[d.exp] || 0;
        return `<li><span>${d.icono} ${d.n}</span><span class="eco-riq" title="Riqueza ${Y[k]} de 3">${ecoPuntos(Y[k])}</span><span class="${n ? "eco-up" : "dim"}">${n ? `${ECO_EXP[d.exp].n} ${ECO_ROM[n] || n}` : vista ? "sin explotar" : "¿?"}</span></li>`;
      })
      .join("")}</ul>`;
  else h += '<p class="stats">Sin yacimientos conocidos.</p>';
  return h;
}
OC.seccion("prov", {
  id: "tierras",
  orden: 39,
  render: ({ p }) =>
    `<h3>Tierras</h3>${ecoInfoVisible(p, ME) ? ecoTierrasHtml(p) : ecoInfoConocida(p, ME) ? ecoTierrasHtml(p, false) : '<p class="dim">Tierras sin explorar: nadie sabe qué esconden.</p>'}`,
});
OC.accion("tax", (v) => {
  const p = G.P[sel];
  if (p && p.owner === ME && TAX[+v] !== undefined) p.tax = +v;
});

/* ---------- sección de provincia: ánimo del pueblo ---------- */
let ecoVerCausas = false;
document.addEventListener(
  "toggle",
  (e) => {
    if (e.target && e.target.id === "eco-causas") ecoVerCausas = e.target.open;
  },
  true,
);
const ecoAnimoTxt = (a) => `<b style="color:${a.color}">${a.icono} ${a.nombre}</b>`;
function ecoTendTxt(a) {
  const t = a.tendencia;
  return t >= 3
    ? `<i class="eco-up" title="Mejora hacia ${a.objetivo}">▲</i>`
    : t <= -3
      ? `<i class="eco-dn" title="Empeora hacia ${a.objetivo}">▼</i>`
      : `<i title="Estable">=</i>`;
}
OC.seccion("prov", {
  id: "animo",
  orden: 38,
  visible: (c) => c.p.owner !== REB,
  render: ({ p, mine }, dis) => {
    const a = ecoAnimo(p);
    if (!mine) {
      const ap = ecoApoyoAsedio(p, ME);
      return `<h3>Ánimo del pueblo</h3><p class="eco-pv">${ecoAnimoTxt(a)} ${ecoTendTxt(a)}${ap <= -0.3 ? ' · <span class="eco-up">os abrirían las puertas</span>' : ap >= 0.5 ? ' · <span class="eco-dn">resistiría un asedio</span>' : ""}</p>`;
    }
    let h = `<h3>Ánimo del pueblo</h3><p class="eco-pv">${ecoAnimoTxt(a)} ${ecoTendTxt(a)} <span class="stats">orden ${p.order} → ${a.objetivo}</span></p>`;
    h += `<details id="eco-causas" class="eco-causas" ${ecoVerCausas ? "open" : ""}><summary>Causas del ánimo (base 55)</summary><ul>${a.causas
      .map(
        (c) =>
          `<li><span>${esc(c.texto)}</span><b class="${c.valor < 0 ? "eco-dn" : "eco-up"}">${ecoSig(c.valor)}</b></li>`,
      )
      .join("")}</ul></details>`;
    const ds = Object.keys(ECO_DEC).filter((k) => ECO_DEC[k].ok(p));
    if (ds.length)
      h += `<div class="g2 eco-dec">${ds
        .map((k) => {
          const D = ECO_DEC[k],
            c = D.coste(p),
            w = ecoEspera(p, k),
            ok = ecoPuedeDecidir(ME, p, k);
          return `<button data-act="eca-${k}:${p.id}" ${dis || !ok ? "disabled" : ""} title="${D.d}">${D.n}<small>${w ? "en " + w + (w > 1 ? " años" : " año") : (OC.textoCoste(c) || "gratis") + " · " + D.d}</small></button>`;
        })
        .join("")}</div>`;
    return h;
  },
});
/* el ánimo también en la línea de información del mapa (se añade tras el texto de la interfaz) */
/* el recurso principal también en la línea de información del mapa (el ánimo ya lo pone la interfaz) */
document.addEventListener("mousemove", (e) => {
  if (!G || e.target !== cv || hover == null || !G.P[hover]) return;
  const hv = $("hv"),
    p = G.P[hover],
    r = ecoInfoVisible(p, ME) ? ecoIconoProv(p) : null;
  if (hv && r && hv.textContent && !hv.textContent.includes(r.icono + " " + r.nombre))
    hv.textContent += ` · ${r.icono} ${r.nombre}`;
});
OC.accion(
  "ecoir",
  (v) => {
    if (!G.P[+v]) return;
    sel = +v;
    tab = "prov";
    if (typeof centerOn === "function") centerOn(sel);
  },
  { libre: true },
);
/* resumen del ánimo de todas tus ciudades (pestaña Tesoro) */
function ecoVistaAnimo() {
  const own = owned(ME);
  if (!own.length) return "";
  const cuenta = ECO_ANIMO.map((n) => ({ n, c: own.filter((p) => ecoNivel(p) === n).length })).filter(
      (x) => x.c,
    ),
    peores = own
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .filter((p) => p.order < 60);
  let h = `<h3>Ánimo de las ciudades</h3><p class="eco-pv">${cuenta
    .reverse()
    .map((x) => `<span title="${x.n.nombre}" style="color:${x.n.color}">${x.n.icono}${x.c}</span>`)
    .join(" ")}</p>`;
  if (peores.length)
    h += `<div class="btns eco-peores">${peores
      .map((p) => {
        const n = ecoNivel(p);
        return `<button class="eco-mini" data-act="ecoir-${p.id}"><span style="color:${n.color}">${n.icono}</span> ${p.name}<small>${n.nombre} · ${p.order}</small></button>`;
      })
      .join("")}</div>`;
  return h;
}

/* ---------- pestaña Tesoro ---------- */
let ecoVista = "bal";
OC.accion(
  "ecov",
  (v) => {
    ecoVista = v;
  },
  { libre: true },
);
OC.panel({
  id: "eco",
  titulo: "Tesoro",
  orden: 35,
  render: (dis) => {
    const F = G.F[ME],
      S = ecoF(ME),
      b = ecoBalance(ME);
    let h = `<h2>Tesoro</h2><div class="eco-kpi"><div><b>${F.gold}</b><small>oro ${ecoSig(b.g)}</small></div><div><b>${F.food}/${b.granero}</b><small>granero ${ecoSig(b.net)}</small></div><div class="${S.deuda ? "eco-mal" : ""}"><b>${S.deuda}</b><small>deuda</small></div></div>`;
    h += `<div class="g3 eco-sub">${[
      ["bal", "Balance"],
      ["mer", "Mercado"],
      ["rut", "Rutas"],
    ]
      .map(([k, t]) => `<button data-act="ecov-${k}" class="${ecoVista === k ? "on" : ""}">${t}</button>`)
      .join("")}</div>`;
    if (ecoVista === "mer" && typeof comVistaMercado === "function") return h + comVistaMercado(dis);
    if (ecoVista === "rut" && typeof comVistaRutas === "function") return h + comVistaRutas(dis);
    return h + ecoVistaBalance(b, dis);
  },
});
function ecoVistaBalance(b, dis) {
  const F = G.F[ME],
    S = ecoF(ME),
    fila = (t, v, tt = "") => (v ? `<li title="${tt}"><span>${t}</span><b>${v}</b></li>` : "");
  let h = `<div class="eco-bal"><ul><li class="eco-cab"><span>Ingresos</span><b>${b.gi}</b></li>${fila("Impuestos", b.ing.imp, "Según la población y el nivel de impuestos")}${fila("Mercados", b.ing.mer)}${fila("Capital", b.ing.cap)}${fila("Especialidades", b.ing.esp)}${fila("Rutas", b.ing.rut)}${fila("Otros", b.ing.otr, "Técnicas, sucesos y otros")}</ul>`;
  h += `<ul><li class="eco-cab"><span>Gastos</span><b>${b.gg}</b></li>${fila("Soldada", b.gas.tro, "Mantenimiento en oro de las tropas")}${fila("Edificios", b.gas.edi)}${fila("Intereses", b.gas.int, "8% anual de la deuda")}${fila("En campaña", b.gas.camp, "Soldada de los ejércitos en campaña: se paga cada estación")}${fila("Mercenarios", b.gas.merc, "Contratos mercenarios: se pagan cada estación")}</ul></div>`;
  h += `<p class="eco-neto">Saldo anual <b class="${b.g < 0 ? "eco-dn" : "eco-up"}">${ecoSig(b.g)} oro</b> · víveres <b class="${b.net < 0 ? "eco-dn" : "eco-up"}">${ecoSig(b.net)}</b> <span class="stats">(${b.fo} cosecha − ${b.up} raciones)</span></p>`;
  h += `<h3>Almacenes</h3><div class="eco-res">${ECO_RES.filter(
    (r) =>
      OC.saldo(ME, r.id) > 0 ||
      b.res[r.id] ||
      b.prod[r.id] ||
      !(r.lujo || (r.id === "caballos" && ecoSinCaballos(ME))),
  )
    .map((r) => {
      const a = b.res[r.id] || 0;
      return `<div title="${r.nombre}: producción ${b.prod[r.id]}, consumo ${b.cons[r.id]}"><i>${r.icono}</i><b>${Math.floor(OC.saldo(ME, r.id))}</b><small class="${a < 0 ? "eco-dn" : ""}">${a ? ecoSig(a) : "·"}</small></div>`;
    })
    .join("")}</div>`;
  const lv = ecoLevas(ME);
  h += `<p class="stats">${ecoN(b.pob)} mil almas · levas ${b.tropas}/${lv}${b.tropas > lv * 0.8 ? ' <b class="eco-dn">agotadas</b>' : ""} · lujos ${b.lujo}/3${S.hambre ? ' · <b class="eco-dn">hambre</b>' : ""}</p>`;
  h += ecoVistaAnimo();
  const rec = ecoGananciaRecorte(ME),
    rea = ecoCosteReacunar(ME),
    monUsada = S.mon === G.year;
  h += `<h3>Hacienda</h3><div class="g2 eco-pol">
<button data-act="eco-diezmo" class="${S.diezmo ? "on" : ""}" ${dis ? "disabled" : ""} title="La Iglesia recibe una décima parte de los impuestos">Diezmo<small>−10% impuestos · +5 orden</small></button>
<button data-act="eco-annona" class="${S.annona ? "on" : ""}" ${dis ? "disabled" : ""} title="Un cuarto del tributo se cobra en grano">Annona<small>tributo en grano</small></button>
<button data-act="eco-recorte" ${dis || monUsada ? "disabled" : ""} title="Acuñar con menos plata: oro ahora, precios más altos y menos orden">Recortar ley<small>+${rec} oro · inflación</small></button>
<button data-act="eco-reacunar" ${dis || monUsada || S.infl <= 1 || F.gold < rea ? "disabled" : ""} title="Devolver la buena ley a la moneda">Reacuñar<small>−${rea} oro</small></button>
<button data-act="eco-prestamo" ${dis || S.cred > 0 || S.deuda + 55 > ecoLimite(ME, b.gi) ? "disabled" : ""} title="Préstamo de los argentarii al 10%; luego 8% anual">Préstamo<small>${S.cred > 0 ? "sin crédito " + S.cred + " años" : "+50 oro"}</small></button>
<button data-act="eco-saldar" ${dis || !S.deuda || F.gold < 1 ? "disabled" : ""}>Saldar deuda<small>−${Math.min(50, S.deuda, F.gold)} oro</small></button></div>`;
  h += `<p class="note">Moneda al ${Math.round(100 / S.infl)}% de ley: soldadas, obras y compras ×${ecoN(S.infl)}. Límite de crédito ${ecoLimite(ME, b.gi)}; por encima, impagos y bancarrota.</p>`;
  return h;
}
