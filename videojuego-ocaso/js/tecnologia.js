/* ---------- tecnología, edificios y progreso de las civilizaciones ----------
   Sistema de TECNOLOGÍA. Edificios por provincia con niveles y obras que tardan años,
   árbol de investigación por ramas, eras de cada civilización y la IA que lo usa.
   Estado en G.tec (ver docs/tecnologia.md). Lo propio de cada pueblo, en civilizaciones.js. */

const TEC_CAT = ["i", "a", "c"],
  TEC_ROM = ["0", "I", "II", "III", "IV", "V"],
  TEC_COLA = 2, // obras por provincia: una en marcha y una en espera
  TEC_SUPLE = 3; // oro por cada unidad de material que falte

const TEC_RAMAS = { mil: "Milicia", eco: "Economía", civ: "Gobierno", rel: "Culto", pro: "Propias" };

/* Árbol común. c = coste en puntos; req = técnicas previas; ef = texto corto.
   Efectos: st (stats por clase o 'all'), cu (coste de tropa), mant (mantenimiento), bono (batalla),
   dip / dipRel (aceptación diplomática), gpct / fpct (oro y comida %), ren/ord/pts (funciones). */
const TEC = {
  disciplina: {
    n: "Disciplina de campaña",
    r: "mil",
    c: 12,
    req: [],
    ef: "+6% vida de la infantería",
    st: { i: { hp: 0.06 } },
  },
  remonta: {
    n: "Remonta de caballos",
    r: "mil",
    c: 12,
    req: [],
    ef: "+6% ataque y −8% coste de jinetes",
    st: { c: { atk: 0.06 } },
    cu: { c: -0.08 },
  },
  arcos: {
    n: "Arco compuesto",
    r: "mil",
    c: 12,
    req: [],
    ef: "+8% ataque de arqueros",
    st: { a: { atk: 0.08 } },
  },
  lorigas: {
    n: "Lorigas y escamas",
    r: "mil",
    c: 24,
    req: ["disciplina"],
    ef: "+6% vida de todas las tropas",
    st: { all: { hp: 0.06 } },
  },
  poliorcetica: {
    n: "Poliorcética",
    r: "mil",
    c: 24,
    req: ["disciplina"],
    ef: "Murallas III · +8% al atacar",
    bono: { atacante: 0.08 },
  },
  spatha: {
    n: "Spatha larga",
    r: "mil",
    c: 26,
    req: ["lorigas"],
    ef: "+6% ataque de todas las tropas",
    st: { all: { atk: 0.06 } },
  },
  limitanei: {
    n: "Limitanei",
    r: "mil",
    c: 40,
    req: ["poliorcetica"],
    ef: "+10% al defender · −15% comida de tropa",
    bono: { defensor: 0.1 },
    mant: { comida: -0.15 },
  },
  comitatenses: {
    n: "Comitatenses",
    r: "mil",
    c: 60,
    req: ["spatha"],
    ef: "+5% ataque y vida · −10% coste de tropa",
    st: { all: { atk: 0.05, hp: 0.05 } },
    cu: { all: -0.1 },
  },

  arado: {
    n: "Arado pesado",
    r: "eco",
    c: 12,
    req: [],
    ef: "Granja III · +1 comida por nivel de granja",
    ren: (y, p) => ({ ...y, fo: y.fo + (p.farm || 0) }),
  },
  moneda: {
    n: "Reforma del sólido",
    r: "eco",
    c: 12,
    req: [],
    ef: "Mercado III · +1 oro por nivel de mercado",
    ren: (y, p) => ({ ...y, g: y.g + (p.market || 0) }),
  },
  molinos: {
    n: "Molinos de agua",
    r: "eco",
    c: 24,
    req: ["arado"],
    ef: "+2 comida en provincias con granja",
    ren: (y, p) => (p.farm ? { ...y, fo: y.fo + 2 } : y),
  },
  vias: {
    n: "Calzadas reparadas",
    r: "eco",
    c: 26,
    req: ["moneda"],
    ef: "+1 oro por provincia · −10% oro de tropa",
    ren: (y) => ({ ...y, g: y.g + 1 }),
    mant: { oro: -0.1 },
  },
  annona: {
    n: "Annona",
    r: "eco",
    c: 45,
    req: ["molinos", "vias"],
    ef: "+8% comida · −10% comida de tropa",
    fpct: 0.08,
    mant: { comida: -0.1 },
  },
  gremios: { n: "Collegia de artesanos", r: "eco", c: 45, req: ["vias"], ef: "+8% oro", gpct: 0.08 },

  censo: { n: "Censo y catastro", r: "civ", c: 12, req: [], ef: "+5% oro", gpct: 0.05 },
  letras: {
    n: "Escuelas de retórica",
    r: "civ",
    c: 14,
    req: [],
    ef: "Escuela III · +2 investigación",
    pts: () => 2,
  },
  ingenieria: {
    n: "Ingeniería",
    r: "civ",
    c: 24,
    req: ["censo"],
    ef: "Acueductos · obras un año más breves",
  },
  derecho: { n: "Codificación del derecho", r: "civ", c: 26, req: ["censo"], ef: "+4 orden", ord: () => 4 },
  cancilleria: {
    n: "Cancillería",
    r: "civ",
    c: 45,
    req: ["derecho", "letras"],
    ef: "+8% aceptación diplomática · +2 orden",
    ord: () => 2,
    dip: 0.08,
  },

  liturgia: {
    n: "Liturgia y ritos",
    r: "rel",
    c: 12,
    req: [],
    ef: "+4 orden donde hay templo",
    ord: (p) => (p.temple ? 4 : 0),
  },
  clero: {
    n: "Jerarquía sacerdotal",
    r: "rel",
    c: 24,
    req: ["liturgia"],
    ef: "Templo III · mejor trato con correligionarios",
    dipRel: 0.06,
  },
  monacato: {
    n: "Monasterios",
    r: "rel",
    c: 30,
    req: ["clero"],
    ef: "+1 investigación por templo II o más (hasta 6)",
    pts: (f, own) => Math.min(6, own.filter((p) => (p.temple || 0) >= 2).length),
  },
  concilios: {
    n: "Concilios",
    r: "rel",
    c: 48,
    req: ["clero"],
    ef: "+3 orden en el reino · +5% aceptación",
    ord: () => 3,
    dip: 0.05,
  },
};

/* Detalle de los edificios de BLD (nucleo.js) y de los propios de cada pueblo (civilizaciones.js).
   t = años por nivel; req = {nivel: técnica}; mat = material extra si la economía lo define;
   costa = solo en provincias costeras; ren/ord/pts = efecto de la provincia; reino = efecto en todo el reino
   (se toma el mejor nivel que haya); ia = peso para la IA. */
const TEC_EDI = {
  farm: { t: [1, 1, 2], req: { 3: "arado" }, mat: "madera", ia: (p, x) => (x.e.net < 3 ? 5 : 1.4) },
  market: { t: [1, 1, 2], req: { 3: "moneda" }, ia: () => 2.2 },
  walls: {
    t: [1, 2, 3, 3],
    req: { 3: "poliorcetica", 4: "teodosianas" },
    mat: "piedra",
    ia: (p, x) => (x.amen ? 2.5 + (p.id === G.F[x.f].capId ? 1.5 : 0) : 0.3),
  },
  temple: {
    t: [1, 1, 2],
    req: { 3: "clero" },
    mat: "piedra",
    ia: (p) => (p.order < 45 ? 5 : p.order < 60 ? 1.5 : 0.4),
  },
  cuartel: {
    t: [1, 2, 2],
    mat: "madera",
    reino: (b, L) => {
      for (const c of TEC_CAT) b.cu[c] -= 0.04 * L;
      b.st.i.hp += 0.03 * L;
    },
    ia: (p, x) => (x.L > (p.cuartel || 0) ? 0.4 : x.front || p.id === G.F[x.f].capId ? 2 : 0.4),
  },
  establo: {
    t: [1, 2],
    mat: "madera",
    reino: (b, L) => {
      b.st.c.atk += 0.04 * L;
      b.cu.c -= 0.06 * L;
    },
    ia: (p, x) => (x.L > (p.establo || 0) ? 0.3 : x.front ? 1.4 : 0.6),
  },
  arqueria: {
    t: [1, 2],
    mat: "madera",
    reino: (b, L) => {
      b.st.a.atk += 0.04 * L;
      b.cu.a -= 0.06 * L;
    },
    ia: (p, x) => (x.L > (p.arqueria || 0) ? 0.3 : x.front ? 1.2 : 0.5),
  },
  herreria: {
    t: [2, 2],
    mat: "hierro",
    reino: (b, L) => {
      for (const c of TEC_CAT) {
        b.st[c].atk += 0.04 * L;
        b.st[c].hp += 0.04 * L;
      }
    },
    ia: (p, x) => (x.L > (p.herreria || 0) ? 0.2 : p.id === G.F[x.f].capId ? 2 : 1),
  },
  escuela: {
    t: [1, 2, 2],
    req: { 3: "letras" },
    pts: (p, L, f) => (G.F[f] && G.F[f].capId === p.id ? 2 : 1) * L,
    ia: (p, x) => (p.id === G.F[x.f].capId ? 2.6 : 0.8),
  },
  acueducto: {
    t: [2, 3],
    req: { 1: "ingenieria" },
    mat: "piedra",
    ren: (y, p, L) => ({ ...y, fo: y.fo + L }),
    ord: (p, L) => 4 * L,
    ia: (p) => (p.order < 60 ? 1.8 : 0.8),
  },
  puerto: {
    t: [2, 2],
    costa: true,
    mat: "madera",
    ren: (y, p, L) => ({ ...y, g: y.g + 3 * L }),
    ia: () => 2,
  },
};

/* Requisitos de cada era (la 0 es la de partida): técnicas, provincias y niveles de edificio. */
const TEC_ERA = [null, { t: 4, p: 5, e: 10 }, { t: 9, p: 8, e: 22 }, { t: 15, p: 11, e: 38 }];
const TEC_ERA_TXT = [
  "",
  "Leyes, graneros y talleres dan forma a un poder que los vecinos empiezan a respetar.",
  "Las provincias obedecen a una sola corte; los embajadores hacen antesala en ella.",
  "Pocos recuerdan un poder semejante desde los días del gran Teodosio.",
];

let tecRama = "mil",
  tecCache = { k: "", v: [] },
  tecCostas = { seed: null, s: [] };

/* ---------- estado ---------- */
const tecNueva = () => ({ inv: null, pts: 0, h: [], era: 0, ult: 0 });
function tecS() {
  return OC.estado("tec", () => ({ v: 1, rev: 0, ini: false, f: [], obras: {} }));
}
const tecListo = (f) => !!(G && G.tec && G.tec.f && f != null && f >= 0 && f < NF && G.tec.f[f]);
const tecF = (f) => G.tec.f[f];
const tecTiene = (f, id) => tecListo(f) && tecF(f).h.includes(id);
const tecCola = (pid) => (G.tec && G.tec.obras[pid]) || [];
const tecEdificios = () => Object.keys(BLD).concat(Object.keys(TEC_EDI).filter((k) => !BLD[k]));
function tecB(k) {
  const b = BLD[k],
    e = TEC_EDI[k] || {};
  return b ? { n: b[0], ef: b[1], c: b[2], max: b[3] || 2, ...e } : { max: 1, ...e };
}
function tecEras(f) {
  return (CIV[f] && CIV[f].eras) || ["Tribal", "Federado", "Reino", "Reino consolidado"];
}

/* Partida nueva, cargada o recibida: idempotente. Normaliza partidas antiguas. */
function tecPreparar() {
  if (!G) return;
  const s = tecS();
  s.f = s.f || [];
  for (let f = 0; f < NF; f++) s.f[f] = Object.assign(tecNueva(), s.f[f] || {});
  s.obras = s.obras || {};
  s.rev = (s.rev || 0) + 1;
  for (const p of G.P) for (const k of tecEdificios()) if (typeof p[k] !== "number") p[k] = 0;
  if (!s.ini) {
    s.ini = true;
    for (let f = 0; f < NF; f++) {
      const ini = CIV[f].tecIni || {},
        cap = G.F[f] && G.P[G.F[f].capId];
      for (const id of ini.tec || []) if (TEC[id] && !s.f[f].h.includes(id)) s.f[f].h.push(id);
      if (cap && cap.owner === f)
        for (const [k, v] of Object.entries(ini.edi || {}))
          if (!tecB(k).costa || tecCosta(cap)) cap[k] = Math.max(cap[k] || 0, v);
      if (!human(f)) tecIAInvestigar(f);
    }
  }
  tecCache = { k: "", v: [] };
}

/* Provincias con costa: alguna casilla suya toca el mar. */
function tecCosta(p) {
  if (!MAP) return false;
  if (tecCostas.seed !== MAP.seed) {
    const s = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = MAP.grid[y][x];
        if (i < 0 || s[i]) continue;
        for (const [a, b] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          if (!MAP.terr[y + b] || !MAP.terr[y + b][x + a]) s[i] = true;
      }
    tecCostas = { seed: MAP.seed, s };
  }
  return !!tecCostas.s[p.id];
}

/* ---------- bonificaciones de una facción (caché por año y revisión) ---------- */
function tecBon(f) {
  if (!tecListo(f)) return null;
  const k = G.seed + "|" + G.year + "|" + G.tec.rev;
  if (tecCache.k !== k) tecCache = { k, v: [] };
  return tecCache.v[f] || (tecCache.v[f] = tecCalcBon(f));
}
function tecCalcBon(f) {
  const z = () => ({ atk: 0, hp: 0 }),
    b = {
      st: { i: z(), a: z(), c: z() },
      cu: { i: 0, a: 0, c: 0 },
      mant: { comida: 0, oro: 0 },
      bono: { atacante: 0, defensor: 0 },
      best: {},
      dip: 0,
      dipRel: 0,
    },
    cats = (c) => (c === "all" ? TEC_CAT : [c]);
  for (const id of tecF(f).h) {
    const T = TEC[id];
    if (!T) continue;
    for (const c in T.st || {}) for (const x of cats(c)) for (const s in T.st[c]) b.st[x][s] += T.st[c][s];
    for (const c in T.cu || {}) for (const x of cats(c)) b.cu[x] += T.cu[c];
    for (const s in T.mant || {}) b.mant[s] += T.mant[s];
    for (const s in T.bono || {}) b.bono[s] += T.bono[s];
    b.dip += T.dip || 0;
    b.dipRel += T.dipRel || 0;
  }
  for (const p of owned(f)) for (const k of tecEdificios()) b.best[k] = Math.max(b.best[k] || 0, p[k] || 0);
  for (const k in TEC_EDI) if (TEC_EDI[k].reino && b.best[k]) TEC_EDI[k].reino(b, b.best[k]);
  return b;
}

/* Categoría básica (i/a/c) de un tipo de tropa, aunque combate cree tipos nuevos en UN. */
function tecCat(t) {
  if (TEC_CAT.includes(t)) return t;
  const u = (typeof UN !== "undefined" && UN[t]) || {};
  for (const x of [u.cat, u.base, u.clase]) if (TEC_CAT.includes(x)) return x;
  if (u.rg) return "a";
  if ((u.mv || 0) >= 4) return "c";
  return "i";
}
/* Edificio y nivel que pide una clase nueva. Combate puede fijarlo con UN[t].edif y UN[t].nivel. */
function tecReqUnidad(t) {
  const u = UN[t] || {},
    cat = tecCat(t),
    edif = u.edif && BLD[u.edif] ? u.edif : { i: "cuartel", a: "arqueria", c: "establo" }[cat],
    elite = UN[cat] && u.cost > UN[cat].cost * 1.4;
  return { edif, nivel: u.nivel || (edif === "cuartel" ? (elite ? 3 : 2) : elite ? 2 : 1) };
}
function tecUnidadPropia(t, f) {
  const u = UN[t] || {},
    c = u.civ ?? u.civs;
  return c == null || c === f || (Array.isArray(c) && c.includes(f));
}

/* ---------- puntos de investigación ---------- */
function tecPuntos(f) {
  if (!tecListo(f) || !alive(f)) return 0;
  const F = tecF(f),
    own = owned(f),
    r = ruler(f);
  let v = 4 + own.length * 0.25 + F.era;
  for (const p of own)
    for (const k in TEC_EDI) {
      const L = p[k] || 0,
        e = TEC_EDI[k];
      if (L && e.pts) v += e.pts(p, L, f);
    }
  for (const id of F.h) if (TEC[id] && TEC[id].pts) v += TEC[id].pts(f, own);
  if (r) v += (r.ge - 5) * 0.3 - (r.age < 16 ? 1 : 0);
  /* OC 'puntosInvestigacion': puntos por año. ctx {f} */
  return Math.max(1, Math.round(OC.calc("puntosInvestigacion", v, { f }) * 10) / 10);
}
function tecDisponible(f, id) {
  const T = TEC[id];
  return (
    !!T &&
    !tecTiene(f, id) &&
    (T.civ == null || T.civ === f) &&
    T.req.every((x) => tecTiene(f, x)) &&
    (T.era == null || tecF(f).era >= T.era)
  );
}
function tecAprender(f, id) {
  const F = tecF(f);
  if (F.h.includes(id)) return;
  F.h.push(id);
  G.tec.rev++;
  if (isMe(f)) addLog(`Los sabios de la corte culminan «${TEC[id].n}»: ${TEC[id].ef}.`, "good");
  else if (TEC[id].civ != null) addLog(`${CIV[f].s} perfecciona «${TEC[id].n}».`);
  OC.emitirSync("tecnologiaInvestigada", { f, id });
}
function tecInvestigacion(f) {
  const F = tecF(f),
    pts = tecPuntos(f);
  F.ult = pts;
  F.pts = Math.round((F.pts + pts) * 10) / 10;
  for (let k = 0; k < 3 && F.inv && TEC[F.inv] && F.pts >= TEC[F.inv].c; k++) {
    const id = F.inv;
    F.pts = Math.round((F.pts - TEC[id].c) * 10) / 10;
    F.inv = null;
    tecAprender(f, id);
    if (!human(f)) tecIAInvestigar(f);
    else if (isMe(f)) addLog("Elige en «Progreso» el próximo estudio de tus eruditos.");
  }
  if (F.inv && !tecDisponible(f, F.inv)) F.inv = null;
}

/* ---------- eras ---------- */
function tecProgreso(f) {
  const own = owned(f);
  let e = 0;
  for (const p of own) for (const k of tecEdificios()) e += p[k] || 0;
  return { t: tecF(f).h.length, p: own.length, e };
}
function tecComprobarEra(f) {
  const F = tecF(f);
  while (F.era < TEC_ERA.length - 1) {
    const r = TEC_ERA[F.era + 1],
      v = tecProgreso(f);
    if (v.t < r.t || v.p < r.p || v.e < r.e) break;
    F.era++;
    G.tec.rev++;
    const nm = tecEras(f)[F.era];
    addLog(`${CIV[f].n} entra en una nueva era: «${nm}».`, isMe(f) ? "good" : "");
    OC.emitirSync("eraNueva", { f, era: F.era });
    if (isMe(f))
      modal(
        `Una nueva era: ${nm}`,
        `<p>${TEC_ERA_TXT[F.era]}</p><p class="dim">Cada era suma +1 investigación al año, +1 orden en las provincias y +4% de oro.</p>`,
        [{ t: "Que lo registren los cronistas", cls: "gold" }],
      );
  }
}

/* ---------- obras ---------- */
function tecMax(k, f, p) {
  let m = tecB(k).max;
  if (tecListo(f) && G.F[f] && G.F[f].capId === p.id)
    for (const id of tecF(f).h)
      if (TEC[id] && TEC[id].maxCap && TEC[id].maxCap[k]) m = Math.max(m, TEC[id].maxCap[k]);
  return m;
}
function tecVisible(k, f, p) {
  const B = tecB(k);
  if (B.civ != null && B.civ !== f && !p[k]) return false;
  return !B.costa || tecCosta(p) || p[k] > 0;
}
function tecAnios(f, k, n) {
  const t = tecB(k).t || [1];
  return Math.max(1, t[Math.min(n, t.length) - 1] - (tecTiene(f, "ingenieria") ? 1 : 0));
}
function tecCoste(f, p, k, n) {
  const B = tecB(k),
    c = { oro: Math.round(B.c * (1 + 0.6 * (n - 1))) };
  if (B.mat && OC.recursos.some((r) => r.id === B.mat)) c[B.mat] = 4 * n;
  /* OC 'costeConstruccion': objeto coste. ctx {f, p, id, nivel} */
  return OC.calc("costeConstruccion", c, { f, p, id: k, nivel: n });
}
/* Lo que se paga de verdad: el material que falte se suple con oro. null si no alcanza. */
function tecPago(f, coste) {
  const pago = {};
  let extra = 0;
  for (const [id, v] of Object.entries(coste || {})) {
    if (!(v > 0)) continue;
    if (id === "oro") {
      pago.oro = (pago.oro || 0) + v;
      continue;
    }
    const usa = Math.min(Math.max(0, Math.floor(OC.saldo(f, id))), v);
    if (usa) pago[id] = usa;
    extra += (v - usa) * TEC_SUPLE;
  }
  if (extra) pago.oro = (pago.oro || 0) + Math.ceil(extra);
  return OC.puedePagar(f, pago) ? pago : null;
}
/* Siguiente nivel de un edificio en una provincia: {ok, n, motivo, coste, pago, anios} */
function tecMejora(f, p, k) {
  const B = tecB(k),
    q = tecCola(p.id),
    n = (p[k] || 0) + q.filter((o) => o.k === k).length + 1,
    r = { ok: false, n, motivo: "", coste: null, pago: null, anios: 0 };
  if (!tecVisible(k, f, p)) return { ...r, motivo: "no disponible" };
  if (n > tecMax(k, f, p)) return { ...r, motivo: n - 1 > (p[k] || 0) ? "en obra" : "máximo" };
  if (B.unico && owned(f).some((q) => q.id !== p.id && (q[k] > 0 || tecCola(q.id).some((o) => o.k === k))))
    return { ...r, motivo: "ya hay uno en el reino" };
  const req = B.req && B.req[n];
  if (req && !tecTiene(f, req)) return { ...r, motivo: "requiere " + (TEC[req] ? TEC[req].n : req) };
  r.coste = tecCoste(f, p, k, n);
  r.anios = tecAnios(f, k, n);
  r.pago = tecPago(f, r.coste);
  if (q.length >= TEC_COLA) r.motivo = "obras ocupadas";
  else if (!r.pago) r.motivo = "sin fondos";
  r.ok = !r.motivo;
  return r;
}
function tecEncolar(f, p, k) {
  const m = tecMejora(f, p, k);
  if (!m.ok || !OC.pagar(f, m.pago)) return null;
  const s = G.tec;
  (s.obras[p.id] = s.obras[p.id] || []).push({ k, n: m.n, a: m.anios, t: m.anios, f, c: m.pago });
  return m;
}
function tecObras(f) {
  const s = G.tec;
  for (const id of Object.keys(s.obras)) {
    const q = s.obras[id],
      p = G.P[+id];
    if (!p || !q || !q.length) {
      delete s.obras[id];
      continue;
    }
    if (q[0].f !== f) continue;
    if (p.owner !== f) {
      delete s.obras[id];
      continue;
    }
    const o = q[0];
    if (--o.a > 0) continue;
    q.shift();
    if (!q.length) delete s.obras[id];
    if ((p[o.k] || 0) >= tecMax(o.k, f, p)) continue;
    p[o.k] = (p[o.k] || 0) + 1;
    s.rev++;
    if (isMe(f)) addLog(`Concluye la obra en ${p.name}: ${tecB(o.k).n} ${TEC_ROM[p[o.k]]}.`, "good");
    OC.emitirSync("edificioConstruido", { f, p, id: o.k, nivel: p[o.k] });
  }
}

/* ---------- IA ---------- */
function tecIAInvestigar(f) {
  if (!tecListo(f)) return;
  const F = tecF(f);
  if (F.inv && tecDisponible(f, F.inv)) return;
  const pri = CIV[f].tecPri || {},
    own = owned(f),
    e = own.length ? inc(f) : { net: 5 },
    guerra = [...Array(NF).keys()].some((g) => g !== f && alive(g) && G.st[f][g] === "guerra"),
    ord = own.reduce((s, p) => s + p.order, 0) / Math.max(1, own.length),
    w = {
      mil: (pri.mil || 2) * (guerra ? 1.5 : 1),
      eco: (pri.eco || 2) * (e.net < 3 ? 1.6 : 1),
      civ: (pri.civ || 2) * (ord < 50 ? 1.3 : 1),
      rel: (pri.rel || 2) * (ord < 50 ? 1.5 : 1),
      pro: 4,
    };
  const op = Object.keys(TEC)
    .filter((id) => tecDisponible(f, id))
    .map((id) => ({ id, s: (w[TEC[id].r] / TEC[id].c) * (0.75 + R() * 0.5) }))
    .sort((a, b) => b.s - a.s);
  F.inv = op.length ? op[0].id : null;
}
function tecIAConstruir(f) {
  const F = G.F[f],
    own = owned(f);
  if (!own.length) return;
  const e = inc(f),
    fav = CIV[f].tecEdi || [],
    reserva = 6 + own.length, // el resto lo gasta ia.js en tropas
    bestL = {};
  for (const p of own) for (const k of tecEdificios()) bestL[k] = Math.max(bestL[k] || 0, p[k] || 0);
  for (let n = F.gold > 220 ? 2 : 1; n > 0; n--) {
    let best = null;
    for (const p of own) {
      if (tecCola(p.id).length) continue;
      const x = { e, f, amen: hostile(p, f).length, front: foes(p, f).length };
      for (const k of tecEdificios()) {
        const m = tecMejora(f, p, k);
        if (!m.ok || F.gold - (m.pago.oro || 0) < reserva) continue;
        const B = tecB(k);
        let w = B.ia ? B.ia(p, { ...x, L: bestL[k] || 0 }) : 2.4;
        if (fav.includes(k)) w *= 1.5;
        w *= (0.85 + R() * 0.3) / (((m.pago.oro || 20) / 40) * (1 + 0.25 * (m.n - 1)));
        if (!best || w > best.w) best = { p, k, w };
      }
    }
    if (!best) break;
    tecEncolar(f, best.p, best.k);
  }
}

/* ---------- el año de cada facción ---------- */
OC.on("partidaLista", tecPreparar);
OC.on("economiaFaccion", (f) => {
  if (!tecListo(f) || !alive(f)) return;
  if (!human(f)) {
    tecIAInvestigar(f);
    tecIAConstruir(f);
  }
  tecObras(f);
  tecInvestigacion(f);
  tecComprobarEra(f);
});
const tecSinObras = ({ p }) => {
  if (!G.tec || !p) return;
  delete G.tec.obras[p.id];
  G.tec.rev++;
};
OC.on("conquista", (x) => {
  tecSinObras(x);
  if (!tecListo(x.a)) return;
  const bot = tecF(x.a).h.reduce((s, id) => s + ((TEC[id] && TEC[id].botin) || 0), 0);
  if (!bot) return;
  G.F[x.a].gold += bot;
  if (isMe(x.a)) addLog(`El saqueo de ${x.p.name} llena el tesoro con ${bot} de oro.`, "good");
});
OC.on("revuelta", tecSinObras);

/* ---------- efectos sobre los cálculos de los demás sistemas ---------- */
OC.mod("rendimiento", (y, { p, f } = {}) => {
  if (!tecListo(f) || !p || !y) return;
  const F = tecF(f);
  let r = { ...y },
    gm = 1 + 0.04 * F.era,
    fm = 1;
  for (const id of F.h) {
    const T = TEC[id];
    if (!T) continue;
    if (T.ren) r = T.ren(r, p, f) || r;
    gm += T.gpct || 0;
    fm += T.fpct || 0;
  }
  for (const k in TEC_EDI) if (p[k] && TEC_EDI[k].ren) r = TEC_EDI[k].ren(r, p, p[k], f) || r;
  return { ...r, g: r.g * gm, fo: r.fo * fm };
});
OC.mod("ordenObjetivo", (o, { p, f } = {}) => {
  if (!tecListo(f) || !p) return;
  const F = tecF(f);
  let v = o + F.era;
  for (const id of F.h) if (TEC[id] && TEC[id].ord) v += TEC[id].ord(p, f) || 0;
  for (const k in TEC_EDI) if (p[k] && TEC_EDI[k].ord) v += TEC_EDI[k].ord(p, p[k], f) || 0;
  return v;
});
OC.mod("statsUnidad", (st, x = {}) => {
  const b = tecBon(x.f);
  if (!b || !st || typeof st !== "object") return;
  const m = b.st[tecCat(x.t)],
    hp = m.hp + (x.p && x.p.owner === x.f && x.lado === "defensor" ? 0.04 * (x.p.cuartel || 0) : 0),
    o = { ...st };
  if (typeof o.atk === "number") o.atk *= 1 + m.atk;
  if (typeof o.hp === "number") o.hp *= 1 + hp;
  return o;
});
OC.mod("bonoBatalla", (v, x = {}) => {
  const b = tecBon(x.f);
  if (b && typeof v === "number") return v * (1 + (b.bono[x.lado] || 0));
});
OC.mod("costeUnidad", (v, x = {}) => {
  const b = tecBon(x.f);
  if (b && typeof v === "number") return v * Math.max(0.6, 1 + b.cu[tecCat(x.t)]);
});
OC.mod("mantenimientoTropa", (v, x = {}) => {
  const b = tecBon(x.f);
  if (!b || !v || typeof v !== "object") return;
  const o = { ...v };
  for (const k of ["comida", "oro"]) if (typeof o[k] === "number") o[k] *= Math.max(0.5, 1 + b.mant[k]);
  return o;
});
OC.mod("unidadesDisponibles", (arr, x = {}) => {
  const b = tecBon(x.f);
  if (!b || !Array.isArray(arr) || typeof UN === "undefined") return;
  const nivel = (k) => (x.p && x.p.owner === x.f ? x.p[k] || 0 : b.best[k] || 0),
    ok = (t) => {
      if (TEC_CAT.includes(t) || !UN[t]) return true;
      const r = tecReqUnidad(t);
      return nivel(r.edif) >= r.nivel;
    },
    out = arr.filter(ok);
  /* clases nuevas que combate marque con UN[t].edif: se añaden en cuanto hay edificio */
  for (const t of Object.keys(UN))
    if (!out.includes(t) && !arr.includes(t) && UN[t].edif && tecUnidadPropia(t, x.f) && ok(t)) out.push(t);
  return out;
});
OC.mod("aceptacionDiplomatica", (v, x = {}) => {
  const b = tecBon(x.f);
  if (!b || typeof v !== "number") return;
  const misma = x.g != null && CIV[x.g] && CIV[x.g].rel === CIV[x.f].rel,
    dEra = tecListo(x.g) ? tecF(x.f).era - tecF(x.g).era : 0;
  return v + b.dip + (misma ? b.dipRel : 0) + Math.max(0, dEra) * 0.03;
});

/* ---------- interfaz: edificios de la provincia ---------- */
function tecPips(p, k, f) {
  const max = tecMax(k, f, p),
    L = p[k] || 0,
    q = tecCola(p.id).filter((o) => o.k === k).length;
  let h = "";
  for (let i = 1; i <= max; i++) h += `<i class="${i <= L ? "on" : i <= L + q ? "obra" : ""}"></i>`;
  return `<span class="tec-niv" aria-label="nivel ${L} de ${max}">${h}</span>`;
}
/* Resumen de lo que rinden los edificios de una provincia (también útil para la interfaz). */
function tecResumen(p) {
  let y = { g: 5 * (p.market || 0), fo: 5 * (p.farm || 0) },
    o = 12 * (p.temple || 0),
    pts = 0;
  for (const k in TEC_EDI) {
    const L = p[k] || 0,
      e = TEC_EDI[k];
    if (!L) continue;
    if (e.ren) y = e.ren(y, p, L, p.owner) || y;
    if (e.ord) o += e.ord(p, L, p.owner) || 0;
    if (e.pts) pts += e.pts(p, L, p.owner) || 0;
  }
  return [
    y.fo && `+${y.fo} comida`,
    y.g && `+${y.g} oro`,
    o && `+${o} orden`,
    p.walls && `+${25 * p.walls}% defensa`,
    pts && `+${pts} investigación`,
  ]
    .filter(Boolean)
    .join(" · ");
}
/* Línea corta con los edificios construidos: «Granja II · Murallas I · ...» */
function tecLineaEdificios(p) {
  const l = tecEdificios()
    .filter((k) => p[k] > 0)
    .map((k) => `${tecB(k).n} ${TEC_ROM[p[k]]}`);
  return l.length ? l.join(" · ") : "Sin edificios";
}
const tecAnioTxt = (a) => `${a} año${a > 1 ? "s" : ""}`;
OC.seccion("prov", {
  id: "edificios",
  orden: 30,
  visible: (c) => c.mine,
  render: ({ p, f }, dis) => {
    if (!tecListo(f)) return "";
    const q = tecCola(p.id);
    let h = `<h3>Edificios</h3>`;
    if (q.length)
      h += `<div class="tec-cola">${q
        .map(
          (o, i) =>
            `<div class="tec-obra"><span>⚒ <b>${tecB(o.k).n} ${TEC_ROM[o.n]}</b><br><small>${i ? "en espera" : "faltan " + tecAnioTxt(o.a)}</small></span><button data-act="tecanu-${i}" ${dis ? "disabled" : ""} title="Se recupera la mitad de lo pagado">Cancelar</button></div>`,
        )
        .join("")}</div>`;
    h += `<div class="g2 tec-edis">${tecEdificios()
      .filter((k) => tecVisible(k, f, p))
      .map((k) => {
        const B = tecB(k),
          m = tecMejora(f, p, k),
          sub = m.coste ? `${OC.textoCoste(m.pago || m.coste)} · ${tecAnioTxt(m.anios)}` : m.motivo;
        return `<button data-act="bld-${k}" class="tec-ed" ${dis || !m.ok ? "disabled" : ""} title="${esc(`${B.n}: ${B.ef}${B.max > 1 ? " por nivel" : ""}${m.motivo ? " (" + m.motivo + ")" : ""}`)}"><span>${B.n}</span>${tecPips(p, k, f)}<small>${sub}</small></button>`;
      })
      .join("")}</div>`;
    const r = tecResumen(p);
    return h + (r ? `<p class="stats tec-res">${r}</p>` : "");
  },
});
OC.accion("bld", (v) => {
  const p = G.P[sel];
  if (!p || p.owner !== ME || !tecB(v).t) return;
  const m = tecEncolar(ME, p, v);
  if (m) addLog(`Comienzan las obras de ${tecB(v).n} ${TEC_ROM[m.n]} en ${p.name} (${tecAnioTxt(m.anios)}).`);
});
OC.accion("tecanu", (v) => {
  const p = G.P[sel],
    q = p && G.tec.obras[p.id],
    o = q && q[+v];
  if (!o || o.f !== ME || p.owner !== ME) return;
  q.splice(+v, 1);
  for (const x of q) if (x.k === o.k && x.n > o.n) x.n--;
  if (!q.length) delete G.tec.obras[p.id];
  const dev = {};
  for (const [id, c] of Object.entries(o.c || {})) dev[id] = Math.floor(c / 2);
  OC.ganar(ME, dev);
  addLog(
    `Se abandonan las obras de ${tecB(o.k).n} en ${p.name}; se recupera ${OC.textoCoste(dev) || "nada"}.`,
  );
});

/* ---------- interfaz: pestaña «Progreso» ---------- */
function tecPanel(dis) {
  if (!tecListo(ME)) return "<h2>Progreso</h2>";
  const F = tecF(ME),
    eras = tecEras(ME),
    pts = tecPuntos(ME),
    sig = TEC_ERA[F.era + 1],
    v = tecProgreso(ME),
    req = (a, b, t) => `<span class="${a >= b ? "tec-ok" : ""}">${t} ${a}/${b}</span>`;
  let h = `<h2>Progreso</h2><div class="tec-era"><span class="tec-era-n" style="border-color:${CIV[ME].c}">${TEC_ROM[F.era + 1]}</span><div><b>${eras[F.era]}</b><br><span class="stats">${
    sig
      ? `Hacia «${eras[F.era + 1]}»: ${req(v.t, sig.t, "técnicas")} · ${req(v.p, sig.p, "provincias")} · ${req(v.e, sig.e, "edificios")}`
      : "La cumbre de tu linaje."
  }</span></div></div>`;
  const T = F.inv && TEC[F.inv];
  h += `<h3>Investigación</h3>`;
  if (T) {
    const pc = Math.min(100, (F.pts / T.c) * 100),
      anios = Math.max(0, Math.ceil((T.c - F.pts) / Math.max(1, pts)));
    h += `<p><b>${T.n}</b> <span class="stats">${Math.floor(F.pts)}/${T.c}</span></p><div class="bar"><i style="width:${pc}%;background:var(--gold)"></i></div><p class="stats">+${pts} por año · ${anios ? "unos " + tecAnioTxt(anios) : "este año"}</p>`;
  } else
    h += `<p class="note tec-aviso">Tus eruditos esperan un encargo: +${pts} por año, ${Math.floor(F.pts)} acumulados.</p>`;
  h += `<div class="tec-ramas">${Object.keys(TEC_RAMAS)
    .map(
      (r) => `<button data-act="tecrama-${r}" class="${tecRama === r ? "on" : ""}">${TEC_RAMAS[r]}</button>`,
    )
    .join("")}</div><div class="tec-lista">`;
  for (const id of Object.keys(TEC).filter(
    (id) => TEC[id].r === tecRama && (TEC[id].civ == null || TEC[id].civ === ME),
  )) {
    const X = TEC[id];
    if (tecTiene(ME, id)) {
      h += `<div class="tec-t hecha"><span>✓ ${X.n}</span><small>${X.ef}</small></div>`;
      continue;
    }
    const falta = X.req.filter((r) => !tecTiene(ME, r)).map((r) => TEC[r].n),
      sub = falta.length
        ? "requiere " + falta.join(", ")
        : X.era != null && F.era < X.era
          ? "requiere la era «" + eras[X.era] + "»"
          : X.ef;
    h += `<button data-act="tecinv-${id}" class="tec-t ${F.inv === id ? "on" : ""}" ${dis || !tecDisponible(ME, id) ? "disabled" : ""}><span>${X.n}<b>${X.c}</b></span><small>${sub}</small></button>`;
  }
  h += `</div><h3>Las potencias</h3><div class="tec-cmp">`;
  for (let f = 0; f < NF; f++) {
    if (!alive(f) || !tecListo(f)) continue;
    const X = tecF(f);
    h += `<span style="color:${CIV[f].c}">${CIV[f].s}</span><span title="${esc(tecEras(f)[X.era])}">Era ${TEC_ROM[X.era + 1]}</span><span>${X.h.length} téc.</span><span>+${f === ME ? pts : X.ult || tecPuntos(f)}</span>`;
  }
  return (
    h +
    `</div><p class="note">Escuelas, templos, provincias y la gestión del soberano dan puntos cada año. Las obras se mandan desde cada provincia.</p>`
  );
}
OC.panel({ id: "tec", titulo: "Progreso", orden: 40, render: tecPanel });
OC.accion(
  "tecrama",
  (v) => {
    if (TEC_RAMAS[v]) tecRama = v;
  },
  { libre: true },
);
OC.accion("tecinv", (v) => {
  if (tecDisponible(ME, v)) tecF(ME).inv = v;
});
