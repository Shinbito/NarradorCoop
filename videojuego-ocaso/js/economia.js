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
};
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
});

/* ---------- estado ---------- */
function ecoE() {
  if (!G) return null;
  const E = OC.estado("eco", () => ({ v: 1 }));
  if (!E.esp || E.esp.length !== G.P.length || !E.pob) ecoIniProv(E);
  if (!E.f) E.f = [];
  if (!E.rutas) E.rutas = [];
  if (!E.peste) E.peste = {};
  if (!E.inm) E.inm = {};
  if (!E.mer) E.mer = {};
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
    const t = MAP.pts.map(() => ({ n: 0, c: [0, 0, 0, 0], k: 0 }));
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const j = MAP.grid[y][x];
        if (j < 0) continue;
        t[j].n++;
        t[j].c[MAP.terr[y][x]]++;
        if ((MAP.terr[y - 1]?.[x] ?? 0) === 0 || (MAP.terr[y + 1]?.[x] ?? 0) === 0) t[j].k++;
        else if ((MAP.terr[y][x - 1] ?? 0) === 0 || (MAP.terr[y][x + 1] ?? 0) === 0) t[j].k++;
      }
    ecoCacheT = {
      seed: MAP.seed,
      t: t.map((q) => ({ n: q.n, s: q.c.map((v) => v / Math.max(1, q.n)), costa: q.k >= 3 })),
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
    (e === "trigo" || e === "pesca" ? 2 : 0)
  );
}
/* especialidades, población y existencias iniciales: deterministas a partir de G.seed */
function ecoIniProv(E) {
  E.esp = E.esp && E.esp.length === G.P.length ? E.esp : [];
  E.pob = E.pob && E.pob.length === G.P.length ? E.pob : [];
  for (const p of G.P) {
    const r = mul(((G.seed | 0) + p.id * 9973 + 17) | 0),
      tr = ecoTerreno(p.id);
    if (!E.esp[p.id]) {
      const ops = Object.entries(ECO_ESP).map(([k, e]) => [
        k,
        e.w[1] * tr.s[1] + e.w[2] * tr.s[2] + e.w[3] * tr.s[3] + (e.costa ? (tr.costa ? e.costa : 0) : 0),
      ]);
      let x = r() * ops.reduce((s, o) => s + o[1], 0);
      E.esp[p.id] = (ops.find((o) => (x -= o[1]) < 0) || ops[0])[0];
    }
    if (!(E.pob[p.id] > 0)) E.pob[p.id] = Math.round(ecoCapacidad(p, E) * (0.62 + r() * 0.16) * 10) / 10;
  }
  for (let f = 0; f < NF; f++) {
    const F = G.F[f];
    if (!F) continue;
    F.res = F.res || {};
    const ini = {
      madera: 10,
      piedra: 10,
      hierro: 6,
      caballos: f === 3 ? 12 : 4,
      sal: 0,
      vino: 0,
      seda: f === 1 || f === 6 ? 4 : 0,
    };
    for (const k in ini) if (F.res[k] === undefined) F.res[k] = ini[k];
  }
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
const ecoMontada = (t) => {
  const u = UN[t];
  return t === "c" || !!(u && (u.montada || u.mont || u.mv >= 4));
};

/* ---------- rendimiento de una provincia ---------- */
function ecoDesglose(p) {
  const E = ecoE(),
    f = p.owner,
    S = ecoF(f),
    r = G.F[f] ? ruler(f) : null,
    gm = r ? 1 + (r.ge - 5) * 0.03 : 1,
    peste = !!E.peste[p.id],
    k = (CIV[f] ? CIV[f].gold : 1) * gm * (p.order < 35 ? 0.5 : 1) * (peste ? 0.8 : 1),
    pob = ecoPob(p),
    tr = ecoTerreno(p.id),
    ey = (ECO_ESP[E.esp[p.id]] || {}).y || {};
  let imp = pob * ECO_IMP * (TAXM[p.tax] ?? 1) * k,
    fo = 2.5 + pob * ECO_COS + (+p.farm || 0) * 5 + (p.cap ? 4 : 0) + (ey.fo || 0);
  if (S.diezmo) imp *= 0.9;
  if (S.annona) {
    fo += imp * 0.3;
    imp *= 0.75;
  }
  if (peste) fo *= 0.85;
  const s = tr.s,
    res = {
      madera: (s[2] >= 0.35 ? 2 : s[2] >= 0.18 ? 1 : 0) + (ey.madera || 0),
      piedra: (s[3] >= 0.6 ? 2 : s[3] >= 0.3 ? 1 : 0) + (ey.piedra || 0),
      hierro: (s[3] >= 0.75 ? 1 : 0) + (ey.hierro || 0),
      caballos: (s[1] >= 0.85 && tr.n >= 40 ? 1 : 0) + (ey.caballos || 0),
      sal: ey.sal || 0,
      vino: ey.vino || 0,
      seda: ey.seda || 0,
    };
  return { imp, mer: (+p.market || 0) * 5 * k, cap: p.cap ? 6 * k : 0, esp: (ey.g || 0) * k, fo, res };
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
    base = { comida: u.food ?? 1, oro: (u.cost ?? 10) * ECO_SOLDADA * ecoF(f).infl };
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
      gas: { tro: 0, edi: 0, int: 0 },
      fo: 0,
      up: 0,
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
  if (typeof comBalanceRutas === "function") comBalanceRutas(f, b);
  /* "otros" = lo que añaden los modificadores de 'rendimiento'; el redondeo se lo quedan los impuestos */
  b.ing.otr = Math.round(crudo - b.ing.imp - b.ing.mer - b.ing.cap - b.ing.esp);
  for (const k of ["mer", "cap", "esp", "rut"]) b.ing[k] = Math.round(b.ing[k]);
  b.ing.imp = Math.round(yg) - b.ing.mer - b.ing.cap - b.ing.esp - b.ing.otr;
  b.gas.tro = Math.round(b.gas.tro);
  b.gas.edi = Math.round(b.gas.edi);
  b.gas.int = Math.ceil(S.deuda * ECO_INT);
  b.gi = Object.values(b.ing).reduce((s, v) => s + v, 0);
  b.gg = b.gas.tro + b.gas.edi + b.gas.int;
  b.g = b.gi - b.gg;
  b.fo = Math.round(b.fo);
  b.up = Math.round(b.up);
  b.net = b.fo - b.up;
  /* consumos: el ejército gasta hierro y caballos; la corte, bienes de lujo */
  b.cons.hierro += Math.floor(b.tropas / 15);
  b.cons.caballos += Math.floor(b.montadas / 5);
  const nl = ecoNecLujo(f);
  for (const r of ECO_RES)
    if (r.lujo && OC.saldo(f, r.id) + b.prod[r.id] >= nl) {
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
const ecoLevas = (f) => Math.round(owned(f).reduce((s, p) => s + ecoPob(p), 0) * 0.9);
function ecoPresionLevas(f) {
  const lv = ecoLevas(f);
  if (!lv) return 0;
  const tr = owned(f).reduce((s, p) => s + Object.values(p.u).reduce((a, v) => a + (+v || 0), 0), 0),
    x = tr / lv;
  return x > 0.8 ? Math.min(0.8, (x - 0.8) * 1.2) : 0;
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
  if (p.order < 30) r -= 0.02;
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
  E.pob[p.id] = Math.max(1, Math.round(ecoPob(p) * (1 - fr) * 10) / 10);
}

/* ---------- orden público ---------- */
function ordTarget(p) {
  const f = p.owner;
  if (f === REB) return 50;
  const r = ruler(f),
    S = ecoF(f),
    E = ecoE();
  const eco =
    (S.diezmo ? 5 : 0) +
    Math.min(6, (S.lujo || 0) * 2) -
    Math.round((S.infl - 1) * 40) -
    ecoPenaDeuda(f) -
    (S.hambre > 0 ? 10 : 0) -
    (E.peste[p.id] ? 8 : 0);
  /* OC 'ordenObjetivo': orden hacia el que tiende la provincia. ctx {p, f} */
  return clamp(
    OC.calc(
      "ordenObjetivo",
      55 +
        p.temple * 12 +
        (TAXO[p.tax] ?? 0) +
        CIV[f].ord +
        (tot(p.u) >= 6 ? 6 : 0) +
        (r.tr === "Piadoso" ? 5 : 0) -
        (p.recent ? 25 : 0) -
        (r.age < 16 ? 10 : 0) +
        eco,
      { p, f },
    ),
    0,
    100,
  );
}
function ecoPenaDeuda(f) {
  const S = ecoF(f);
  if (!(S.deuda > 0)) return 0;
  return Math.min(12, 2 + Math.round((S.deuda / Math.max(20, S.gi || 20)) * 3));
}

/* ---------- pérdidas de tropas (hambre, impagos, bancarrota, licenciamiento) ---------- */
function ecoDesercion(f, fr) {
  let lost = 0;
  for (const p of owned(f))
    for (const t in p.u) {
      const n = +p.u[t] || 0,
        x = n * fr,
        l = Math.min(n, Math.floor(x) + (R() < x % 1 ? 1 : 0));
      p.u[t] = n - l;
      lost += l;
    }
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
  /* oro */
  F.gold += b.g;
  /* recursos, con tope de almacén */
  const tope = ecoTope(f);
  F.res = F.res || {};
  for (const r of ECO_RES) F.res[r.id] = clamp(Math.floor(OC.saldo(f, r.id) + b.res[r.id]), 0, tope);
  /* comida: hambre o grano que se pudre por falta de graneros */
  F.food += b.net;
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
  /* población */
  for (const p of own) ecoCrecer(p);
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
      if (typeof comRevisarRutas === "function") comRevisarRutas();
    }
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
  /* déficit crónico: licenciar tropas de retaguardia */
  b = ecoBalance(f);
  if (b.g < 0 && F.gold + b.g * 2 < 0) ecoLicenciar(f, -b.g + Math.ceil(b.gi * 0.05));
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
  if (G && r && r.p) ecoDiezmar(r.p, 0.03);
});
OC.on("conquista", (r) => {
  if (!G || !r || !r.p) return;
  ecoDiezmar(r.p, 0.05);
  if (typeof comRevisarRutas === "function") comRevisarRutas();
});
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
      m *= c >= 6 ? 0.88 : c <= 0 ? 1.2 : 1;
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
      y = yields(p),
      prod = ECO_RES.filter((r) => y[r.id] > 0)
        .map((r) => `<span title="${r.nombre}">${r.icono}${y[r.id]}</span>`)
        .join(" "),
      E = ecoE();
    let h = `<h3>Hacienda</h3><p class="eco-pv"><span title="Población en miles de almas">${ecoN(ecoPob(p))} mil almas <i class="${tasa > 0.004 ? "eco-up" : tasa < -0.004 ? "eco-dn" : ""}">${tasa > 0.004 ? "▲" : tasa < -0.004 ? "▼" : "="}</i></span> · <span title="${esc(es.d)}">${es.n}</span>${E.peste[p.id] ? ' · <b class="eco-dn">peste</b>' : ""}${prod ? `<br><span class="stats">Produce ${prod}</span>` : ""}</p>`;
    if (mine)
      h += `<div class="g3">${TAX.map((t, i) => `<button data-act="tax-${i}" class="${p.tax === i ? "on" : ""}" ${dis ? "disabled" : ""} title="Impuestos ${t.toLowerCase()}">${t}<small>${Math.round(TAXM[i] * 100)}% · ${ecoSig(TAXO[i])} ord.</small></button>`).join("")}</div>`;
    else if (typeof comBotonHasta === "function") h += comBotonHasta(p, dis);
    return h;
  },
});
OC.accion("tax", (v) => {
  const p = G.P[sel];
  if (p && p.owner === ME && TAX[+v] !== undefined) p.tax = +v;
});

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
  h += `<ul><li class="eco-cab"><span>Gastos</span><b>${b.gg}</b></li>${fila("Soldada", b.gas.tro, "Mantenimiento en oro de las tropas")}${fila("Edificios", b.gas.edi)}${fila("Intereses", b.gas.int, "8% anual de la deuda")}</ul></div>`;
  h += `<p class="eco-neto">Saldo anual <b class="${b.g < 0 ? "eco-dn" : "eco-up"}">${ecoSig(b.g)} oro</b> · víveres <b class="${b.net < 0 ? "eco-dn" : "eco-up"}">${ecoSig(b.net)}</b> <span class="stats">(${b.fo} cosecha − ${b.up} raciones)</span></p>`;
  h += `<h3>Almacenes</h3><div class="eco-res">${ECO_RES.map((r) => {
    const a = b.res[r.id] || 0;
    return `<div title="${r.nombre}: producción ${b.prod[r.id]}, consumo ${b.cons[r.id]}"><i>${r.icono}</i><b>${Math.floor(OC.saldo(ME, r.id))}</b><small class="${a < 0 ? "eco-dn" : ""}">${a ? ecoSig(a) : "·"}</small></div>`;
  }).join("")}</div>`;
  const lv = ecoLevas(ME);
  h += `<p class="stats">${ecoN(b.pob)} mil almas · levas ${b.tropas}/${lv}${b.tropas > lv * 0.8 ? ' <b class="eco-dn">agotadas</b>' : ""} · lujos ${b.lujo}/3${S.hambre ? ' · <b class="eco-dn">hambre</b>' : ""}</p>`;
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
