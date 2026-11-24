/* ---------- tecnología, ciudades y progreso de las civilizaciones ----------
   Sistema de TECNOLOGÍA. Dos niveles:
   - DESCUBRIMIENTOS del reino: el árbol se investiga con el saber que generan las ciudades.
   - ADOPCIÓN LOCAL: un descubrimiento «de ciudad» solo rinde donde se implanta (obra pagada con el oro
     nacional). Los «del reino» (leyes, gobierno, doctrinas) rigen en todas partes.
   Cada ciudad tiene edificios con niveles y huecos limitados por su población; lo que construye y adopta
   define su perfil (Plaza fuerte, Ciudad mercantil, Granero, Ciudad de saber...) y qué tropas recluta.
   Estado en G.tec (ver docs/tecnologia.md). Lo propio de cada pueblo, en civilizaciones.js. */

const TEC_CAT = ["i", "a", "c"],
  TEC_ROM = ["0", "I", "II", "III", "IV", "V"],
  TEC_COLA = 3, // obras y adopciones por ciudad: una en marcha y dos en espera
  TEC_SUPLE = 3, // oro por cada unidad de material que falte
  TEC_ORO = 0.62; // parte en oro de edificios e implantaciones (los materiales no cambian)

const TEC_RAMAS = { mil: "Milicia", eco: "Economía", civ: "Gobierno", rel: "Culto", pro: "Propias" };

/* Árbol. c = puntos; req = técnicas previas; anio = año mínimo; ef = texto corto.
   amb: "ciudad" (hay que adoptarla en cada ciudad; en = edificio que pide allí, enN = su nivel)
        o "reino" (por defecto: rige en todo el reino).
   saber: nivel de Escuela que debe tener alguna ciudad del reino para poder investigarla.
   Efectos: st (stats por clase o 'all'), cu (coste de tropa), mant, bono, dip, dipRel, gpct/fpct (%),
   ren(y, p) / ord(p) (por ciudad), ptsC(p) (saber de la ciudad, solo «ciudad»), pts(f, own) (solo «reino»). */
const TEC = {
  disciplina: {
    n: "Disciplina de campaña",
    r: "mil",
    c: 12,
    anio: 410,
    req: [],
    amb: "ciudad",
    en: "cuartel",
    ef: "+6% vida de la infantería",
    st: { i: { hp: 0.06 } },
  },
  remonta: {
    n: "Remonta de caballos",
    caballo: true,
    r: "mil",
    c: 12,
    anio: 410,
    req: [],
    amb: "ciudad",
    en: "establo",
    ef: "+6% ataque y −8% coste de jinetes",
    st: { c: { atk: 0.06 } },
    cu: { c: -0.08 },
  },
  arcos: {
    n: "Arco compuesto",
    r: "mil",
    c: 12,
    anio: 410,
    req: [],
    amb: "ciudad",
    en: ["arqueria", "cuartel"],
    ef: "+8% ataque de arqueros",
    st: { a: { atk: 0.08 } },
  },
  lorigas: {
    n: "Lorigas y escamas",
    r: "mil",
    c: 24,
    anio: 425,
    req: ["disciplina"],
    amb: "ciudad",
    en: "herreria",
    ef: "mejores armaduras: +6% vida",
    st: { all: { hp: 0.06 } },
  },
  poliorcetica: {
    n: "Poliorcética",
    r: "mil",
    c: 24,
    anio: 430,
    req: ["disciplina"],
    ef: "Murallas III · +8% al atacar",
    bono: { atacante: 0.08 },
  },
  spatha: {
    n: "Hierro templado",
    r: "mil",
    c: 26,
    anio: 440,
    req: ["lorigas"],
    amb: "ciudad",
    en: "herreria",
    ef: "armas con más filo: +6% ataque",
    st: { all: { atk: 0.06 } },
  },
  limitanei: {
    n: "Limitanei",
    r: "mil",
    c: 40,
    anio: 460,
    req: ["poliorcetica"],
    saber: 2,
    ef: "+10% al defender · −15% comida de tropa",
    bono: { defensor: 0.1 },
    mant: { comida: -0.15 },
  },
  comitatenses: {
    n: "Comitatenses",
    r: "mil",
    c: 60,
    anio: 490,
    req: ["spatha"],
    saber: 2,
    amb: "ciudad",
    en: "cuartel",
    enN: 2,
    ef: "+5% ataque y vida · −10% coste de tropa",
    st: { all: { atk: 0.05, hp: 0.05 } },
    cu: { all: -0.1 },
  },
  strategikon: {
    n: "Strategikon",
    r: "mil",
    c: 80,
    anio: 540,
    req: ["comitatenses", "limitanei"],
    saber: 3,
    ef: "+8% al atacar y al defender",
    bono: { atacante: 0.08, defensor: 0.08 },
  },

  arado: {
    n: "Arado pesado",
    r: "eco",
    c: 12,
    anio: 410,
    req: [],
    amb: "ciudad",
    en: "farm",
    ef: "Granja III · +1 comida por nivel de granja",
    ren: (y, p) => ({ ...y, fo: y.fo + (p.farm || 0) }),
  },
  rotacion: {
    n: "Rotación de cultivos",
    r: "eco",
    c: 18,
    anio: 420,
    req: ["arado"],
    amb: "ciudad",
    en: "farm",
    ef: "+10% comida",
    fpct: 0.1,
  },
  moneda: {
    n: "Reforma del sólido",
    r: "eco",
    c: 12,
    anio: 410,
    req: [],
    ef: "Mercado III · +1 oro por nivel de mercado",
    ren: (y, p) => ({ ...y, g: y.g + (p.market || 0) }),
  },
  molinos: {
    n: "Molinos de agua",
    r: "eco",
    c: 24,
    anio: 425,
    req: ["arado"],
    amb: "ciudad",
    en: "farm",
    enN: 2,
    ef: "+3 comida",
    ren: (y) => ({ ...y, fo: y.fo + 3 }),
  },
  vias: {
    n: "Calzadas reparadas",
    r: "eco",
    c: 26,
    anio: 430,
    req: ["moneda"],
    ef: "+1 oro por ciudad · −10% oro de tropa",
    ren: (y) => ({ ...y, g: y.g + 1 }),
    mant: { oro: -0.1 },
  },
  annona: {
    n: "Annona",
    r: "eco",
    c: 45,
    anio: 465,
    req: ["molinos", "vias"],
    saber: 2,
    ef: "+5% comida · −10% comida de tropa",
    fpct: 0.05,
    mant: { comida: -0.1 },
  },
  gremios: {
    n: "Collegia de artesanos",
    r: "eco",
    c: 45,
    anio: 470,
    req: ["vias"],
    saber: 2,
    amb: "ciudad",
    en: "market",
    enN: 2,
    ef: "+12% oro",
    gpct: 0.12,
  },
  sericultura: {
    n: "Sericultura",
    r: "eco",
    c: 75,
    anio: 550,
    req: ["gremios"],
    saber: 3,
    amb: "ciudad",
    en: "market",
    enN: 2,
    ef: "+15% oro",
    gpct: 0.15,
  },

  censo: { n: "Censo y catastro", r: "civ", c: 12, anio: 410, req: [], ef: "+5% oro", gpct: 0.05 },
  letras: {
    n: "Escuelas de retórica",
    r: "civ",
    c: 14,
    anio: 410,
    req: [],
    amb: "ciudad",
    en: "escuela",
    ef: "Escuela III · +1 investigación",
    ptsC: () => 1,
  },
  ingenieria: {
    n: "Ingeniería",
    r: "civ",
    c: 24,
    anio: 435,
    req: ["censo"],
    ef: "Acueductos · obras un año más breves",
  },
  sanidad: {
    n: "Termas y sanidad",
    r: "civ",
    c: 26,
    anio: 445,
    req: ["ingenieria"],
    amb: "ciudad",
    en: "acueducto",
    ef: "+4 orden, +2 comida",
    ord: () => 4,
    ren: (y) => ({ ...y, fo: y.fo + 2 }),
  },
  derecho: {
    n: "Codificación del derecho",
    r: "civ",
    c: 26,
    anio: 430,
    req: ["censo"],
    ef: "+4 orden",
    ord: () => 4,
  },
  cancilleria: {
    n: "Cancillería",
    r: "civ",
    c: 45,
    anio: 475,
    req: ["derecho", "letras"],
    saber: 2,
    ef: "+8% aceptación diplomática · +2 orden",
    ord: () => 2,
    dip: 0.08,
  },
  corpus: {
    n: "Corpus Iuris Civilis",
    r: "civ",
    c: 75,
    anio: 530,
    req: ["cancilleria"],
    saber: 3,
    ef: "+5 orden · +5% aceptación diplomática",
    ord: () => 5,
    dip: 0.05,
  },

  liturgia: {
    n: "Liturgia y ritos",
    r: "rel",
    c: 12,
    anio: 410,
    req: [],
    amb: "ciudad",
    en: "temple",
    ef: "+5 orden",
    ord: () => 5,
  },
  clero: {
    n: "Jerarquía sacerdotal",
    r: "rel",
    c: 24,
    anio: 425,
    req: ["liturgia"],
    ef: "Templo III · mejor trato con correligionarios",
    dipRel: 0.06,
  },
  monacato: {
    n: "Monasterios",
    r: "rel",
    c: 30,
    anio: 445,
    req: ["clero"],
    amb: "ciudad",
    en: "temple",
    enN: 2,
    ef: "+1,5 investigación",
    ptsC: () => 1.5,
  },
  concilios: {
    n: "Concilios",
    r: "rel",
    c: 48,
    anio: 480,
    req: ["clero"],
    saber: 2,
    ef: "+3 orden en el reino · +5% aceptación",
    ord: () => 3,
    dip: 0.05,
  },
  santuarios: {
    n: "Grandes santuarios",
    r: "rel",
    c: 70,
    anio: 520,
    req: ["concilios", "monacato"],
    saber: 3,
    amb: "ciudad",
    en: "temple",
    enN: 2,
    ef: "+4 orden · +2 investigación",
    ord: () => 4,
    ptsC: () => 2,
  },
};

/* ---------- yacimientos ----------
   Qué recurso explota cada edificio. Economía expone ecoYac(p) → {hierro, piedra, sal, oro, madera|bosque, ...}
   con riqueza 0-3; si aún no existe, se estima con la especialidad y el terreno de la provincia. */
const TEC_YAC = {
  mina: ["hierro", "oro", "plata", "estano", "cobre"],
  cantera: ["piedra"],
  aserradero: ["madera"],
  salinas: ["sal"],
};
const TEC_YAC_N = {
  hierro: "hierro",
  oro: "oro",
  plata: "plata",
  estano: "estaño",
  cobre: "cobre",
  piedra: "piedra",
  madera: "bosque",
  sal: "sal",
};
function tecYac(p) {
  if (typeof ecoYac === "function")
    try {
      const y = ecoYac(p);
      if (y && typeof y === "object") return { ...y, madera: y.madera ?? y.bosque ?? 0 };
    } catch (e) {}
  let esp = null,
    s = [0, 0.7, 0.15, 0.15];
  try {
    if (typeof ecoEspecialidad === "function" && G.eco) esp = ecoEspecialidad(p).id;
    if (typeof ecoTerreno === "function") s = ecoTerreno(p.id).s || s;
  } catch (e) {}
  return {
    hierro: esp === "hierro" ? 3 : s[3] >= 0.75 ? 2 : s[3] >= 0.5 ? 1 : 0,
    oro: esp === "oro" ? 2 : 0,
    piedra: esp === "cantera" ? 3 : s[3] >= 0.6 ? 2 : s[3] >= 0.3 ? 1 : 0,
    madera: esp === "madera" ? 3 : s[2] >= 0.35 ? 2 : s[2] >= 0.18 ? 1 : 0,
    sal: esp === "sal" ? 3 : tecCosta(p) ? 1 : 0,
  };
}
/* Riqueza (0-3) del yacimiento que explotaría el edificio k en la ciudad p. */
function tecRiqueza(p, k) {
  const ids = (TEC_EDI[k] && TEC_EDI[k].yac) || [],
    y = tecYac(p);
  return Math.max(0, ...ids.map((id) => Math.min(3, +y[id] || 0)));
}
/* Producción: cada nivel suma la riqueza del yacimiento y multiplica lo que ya daba la tierra (+25%).
   El oro y la plata de las minas van al tesoro (2 y 1,5 por nivel y riqueza). */
function tecRenYac(y, p, k, L) {
  const Y = tecYac(p),
    r = { ...y };
  for (const id of TEC_EDI[k].yac) {
    const q = Math.min(3, +Y[id] || 0);
    if (!q) continue;
    if (id === "oro") r.g = (r.g || 0) + 2 * L * q;
    else if (id === "plata") r.g = (r.g || 0) + 1.5 * L * q;
    /* el estaño no es un recurso del almacén: se vende a los broncistas (oro) */
    else if (id === "estano" && !OC.recursos.some((x) => x.id === "estano")) r.g = (r.g || 0) + 1 * L * q;
    else if (id in r || OC.recursos.some((x) => x.id === id)) r[id] = (+r[id] || 0) * (1 + 0.25 * L) + L * q;
  }
  return r;
}
function tecIAYac(p, k, x) {
  const q = tecRiqueza(p, k),
    falta = TEC_EDI[k].yac.some((id) => id !== "oro" && id !== "plata" && OC.saldo(x.f, id) < 10);
  return q ? (0.6 + 0.6 * q) * (falta ? 1.5 : 1) : 0;
}
/* Lo que da y daría el edificio k en p: {ahora, sig} como texto («+4 hierro»). */
function tecProdTxt(p, k) {
  let base = { g: 0, fo: 0 };
  try {
    if (typeof ecoDesglose === "function" && G.eco) base = { g: 0, fo: 0, ...ecoDesglose(p).res };
  } catch (e) {}
  const dif = (L) => {
    const r = tecRenYac(base, p, k, L);
    return Object.keys(r)
      .filter((id) => id !== "fo" && Math.round((r[id] || 0) - (base[id] || 0)) > 0)
      .map((id) => `+${Math.round(r[id] - (base[id] || 0))} ${id === "g" ? "oro" : id}`)
      .join(", ");
  };
  const L = p[k] || 0;
  return { ahora: L ? dif(L) : "", sig: dif(L + 1) };
}

/* Detalle de los edificios de BLD (nucleo.js) y de los propios de cada pueblo (civilizaciones.js).
   t = años por nivel; anio = {nivel: año mínimo}; req = {nivel: técnica}; mat = material extra;
   costa = solo en ciudades costeras; cat = "mil" | "eco" | "saber" (perfil de la ciudad; null = neutro);
   ren/ord/pts = efecto en la ciudad; local(b, L) = bonos a las tropas de la ciudad;
   reino(b, L) = efecto en todo el reino (mejor nivel); ia = peso para la IA. */
const TEC_EDI = {
  farm: {
    t: [1, 1, 2],
    anio: { 2: 420, 3: 450 },
    req: { 3: "arado" },
    mat: "madera",
    cat: "eco",
    ia: (p, x) => (x.e.net < 3 ? 5 : 1.4),
  },
  market: { t: [1, 1, 2], anio: { 2: 420, 3: 450 }, req: { 3: "moneda" }, cat: "eco", ia: () => 2.2 },
  walls: {
    t: [1, 2, 3, 3],
    anio: { 2: 425, 3: 460, 4: 480 },
    req: { 3: "poliorcetica", 4: "teodosianas" },
    mat: "piedra",
    cat: "mil",
    ia: (p, x) => (x.amen ? 2.5 + (p.id === G.F[x.f].capId ? 1.5 : 0) : 0.3),
  },
  temple: {
    t: [1, 1, 2],
    anio: { 2: 420, 3: 455 },
    req: { 3: "clero" },
    mat: "piedra",
    cat: "saber",
    ia: (p) => (p.order < 45 ? 5 : p.order < 60 ? 1.5 : 0.6),
  },
  cuartel: {
    t: [1, 2, 2],
    anio: { 2: 430, 3: 465 },
    mat: "madera",
    cat: "mil",
    local: (b, L) => {
      for (const c of TEC_CAT) b.cu[c] -= 0.04 * L;
      b.st.i.hp += 0.03 * L;
    },
    ia: (p, x) => (x.front || p.id === G.F[x.f].capId ? 2 : 0.6),
  },
  establo: {
    t: [1, 2],
    anio: { 2: 445 },
    mat: "madera",
    cat: "mil",
    caballo: true, // no se ofrece a los pueblos sin caballos

    local: (b, L) => {
      b.st.c.atk += 0.04 * L;
      b.cu.c -= 0.06 * L;
    },
    ia: (p, x) => (x.front ? 1.5 : 0.5),
  },
  guerreros: {
    t: [1, 2],
    anio: { 2: 440 },
    mat: "madera",
    cat: "mil",
    sinCaballos: true, // solo para los pueblos sin caballos (sustituye al establo)
    local: (b, L) => {
      for (const c of ["i", "a"]) {
        b.st[c].atk += 0.04 * L;
        b.cu[c] -= 0.05 * L;
      }
    },
    ia: (p, x) => (x.front ? 1.6 : 0.6),
  },
  arqueria: {
    t: [1, 2],
    anio: { 2: 445 },
    mat: "madera",
    cat: "mil",
    local: (b, L) => {
      b.st.a.atk += 0.04 * L;
      b.cu.a -= 0.06 * L;
    },
    ia: (p, x) => (x.front ? 1.2 : 0.4),
  },
  herreria: {
    t: [2, 2],
    anio: { 1: 420, 2: 460 },
    mat: "hierro",
    cat: "mil",
    local: (b, L) => {
      for (const c of TEC_CAT) {
        b.st[c].atk += 0.04 * L;
        b.st[c].hp += 0.04 * L;
      }
    },
    ia: (p, x) => (x.front || p.id === G.F[x.f].capId ? 1.6 : 0.6),
  },
  escuela: {
    t: [1, 2, 2],
    anio: { 2: 430, 3: 470 },
    req: { 3: "letras" },
    cat: "saber",
    pts: (p, L) => 1.5 * L,
    ia: (p, x) => (p.id === G.F[x.f].capId ? 2.6 : 1),
  },
  acueducto: {
    t: [2, 3],
    anio: { 1: 440, 2: 480 },
    req: { 1: "ingenieria" },
    mat: "piedra",
    ren: (y, p, L) => ({ ...y, fo: y.fo + L }),
    ord: (p, L) => 4 * L,
    ia: (p) => (p.order < 60 ? 1.8 : 0.8),
  },
  puerto: {
    t: [2, 2],
    anio: { 1: 415, 2: 450 },
    costa: true,
    mat: "madera",
    cat: "eco",
    ren: (y, p, L) => ({ ...y, g: y.g + 3 * L }),
    ia: () => 2,
  },
  /* torre de vigilancia: barata y sin hueco; Campaña la usa para ver en la niebla (tecVision) */
  torre: {
    t: [1, 1, 2],
    anio: { 2: 430, 3: 455 },
    req: { 3: "poliorcetica" },
    mat: "madera",
    sinHueco: true,
    ia: (p, x) => (x.amen ? 2.4 : x.front ? 1.4 : 0.05),
  },
  /* sobre yacimientos (tecYac): solo donde los hay y hasta el nivel de su riqueza (1-3) */
  mina: { t: [1, 2, 2], anio: { 2: 425, 3: 450 }, mat: "madera", cat: "eco", yac: TEC_YAC.mina },
  cantera: { t: [1, 2, 2], anio: { 2: 425, 3: 450 }, mat: "madera", cat: "eco", yac: TEC_YAC.cantera },
  aserradero: { t: [1, 1, 2], anio: { 2: 425, 3: 450 }, mat: "hierro", cat: "eco", yac: TEC_YAC.aserradero },
  salinas: { t: [1, 2], anio: { 2: 440 }, mat: "madera", cat: "eco", yac: TEC_YAC.salinas },
};
for (const k in TEC_EDI)
  if (TEC_EDI[k].yac) {
    TEC_EDI[k].ren = (y, p, L) => tecRenYac(y, p, k, L);
    TEC_EDI[k].ia = (p, x) => tecIAYac(p, k, x);
  }

/* Perfiles de ciudad: emergen de lo construido y adoptado; los especializados tienen sinergias. */
const TEC_PERFIL = {
  fuerte: { nombre: "Plaza fuerte", icono: "⚔", sin: "tropas de aquí −10% coste, +5% vida; +5% al defender" },
  mercantil: { nombre: "Ciudad mercantil", icono: "◉", sin: "+10% oro" },
  granero: { nombre: "Granero", icono: "❦", sin: "+10% comida" },
  saber: { nombre: "Ciudad de saber", icono: "✎", sin: "+25% investigación" },
  mixta: { nombre: "Ciudad mixta", icono: "◇", sin: "" },
  aldea: { nombre: "Aldea", icono: "·", sin: "" },
};

/* Requisitos de cada era (la 0 es la de partida): técnicas, provincias, niveles de edificio y año. */
const TEC_ERA = [
  null,
  { t: 4, p: 5, e: 10, anio: 425 },
  { t: 9, p: 8, e: 22, anio: 455 },
  { t: 15, p: 11, e: 38, anio: 490 },
];
const TEC_ERA_TXT = [
  "",
  "Leyes, graneros y talleres dan forma a un poder que los vecinos empiezan a respetar.",
  "Las provincias obedecen a una sola corte; los embajadores hacen antesala en ella.",
  "Pocos recuerdan un poder semejante desde los días del gran Teodosio.",
];

let tecRama = "mil",
  tecCache = { k: "", v: [], c: {} },
  tecCostas = { seed: null, s: [] };

/* ---------- estado ---------- */
const tecNueva = () => ({ inv: null, pts: 0, h: [], era: 0, ult: 0 });
function tecS() {
  return OC.estado("tec", () => ({ v: 2, rev: 0, ini: false, f: [], obras: {}, ad: {} }));
}
/* Puertas por año de partida (G.year empieza en 410): verdadero si ya se ha llegado a ese año. */
const tecDesde = (anio) => !anio || (!!G && G.year >= anio);
/* Año mínimo para empezar el nivel n de un edificio (0 = sin puerta). */
const tecAnioEdi = (k, n) => {
  const a = tecB(k).anio;
  return (a && a[n]) || 0;
};
const tecListo = (f) => !!(G && G.tec && G.tec.f && f != null && f >= 0 && f < NF && G.tec.f[f]);
const tecF = (f) => G.tec.f[f];
const tecTiene = (f, id) => tecListo(f) && tecF(f).h.includes(id);
const tecCola = (pid) => (G.tec && G.tec.obras[pid]) || [];
const tecLocal = (T) => !!T && T.amb === "ciudad";
const tecAdopciones = (p) => (G.tec && G.tec.ad && G.tec.ad[p.id]) || [];
const tecAdoptada = (p, id) => tecAdopciones(p).includes(id);
/* ¿rige la técnica en esta ciudad para su dueño f? (las «del reino», si f la conoce; las «de ciudad», si se adoptó allí) */
const tecRige = (f, p, id) => (tecLocal(TEC[id]) ? tecAdoptada(p, id) : tecTiene(f, id));
const tecEdificios = () => Object.keys(BLD).concat(Object.keys(TEC_EDI).filter((k) => !BLD[k]));
const tecEsCapital = (p) => !!p && (p.cap || (G.F[p.owner] && G.F[p.owner].capId === p.id));
function tecB(k, f) {
  const b = BLD[k],
    e = TEC_EDI[k] || {},
    r = b ? { n: b[0], ef: b[1], c: b[2], max: b[3] || 2, ...e } : { max: 1, ...e };
  if (k === "guerreros" && f != null && CIV[f] && CIV[f].tecGuerreros) r.n = CIV[f].tecGuerreros;
  return r;
}
/* Pueblos sin caballos (CIV[f].sinTipos con "caballos"): ni establo ni técnicas ecuestres. */
const tecSinCaballos = (f) => !!(CIV[f] && (CIV[f].sinTipos || []).includes("caballos"));
const tecCivPuede = (f, t) => (typeof civPuede === "function" ? civPuede(f, t) : true);
/* ¿Es la técnica para este pueblo? (la suya propia, y nada ecuestre si no tiene caballos) */
const tecParaCiv = (f, T) => !!T && (T.civ == null || T.civ === f) && !(T.caballo && tecSinCaballos(f));
function tecEras(f) {
  return (CIV[f] && CIV[f].eras) || ["Tribal", "Federado", "Reino", "Reino consolidado"];
}
/* Población de la ciudad en miles (economía); si no existe, una estimación. */
function tecPob(p) {
  try {
    if (typeof ecoPob === "function" && G.eco) return ecoPob(p);
  } catch (e) {}
  return 8 + (p.cap ? 10 : 0);
}

/* Partida nueva, cargada o recibida: idempotente. Migra partidas antiguas. */
function tecPreparar() {
  if (!G) return;
  const s = tecS();
  s.f = s.f || [];
  for (let f = 0; f < NF; f++) s.f[f] = Object.assign(tecNueva(), s.f[f] || {});
  s.obras = s.obras || {};
  s.rev = (s.rev || 0) + 1;
  for (const p of G.P) for (const k of tecEdificios()) if (typeof p[k] !== "number") p[k] = 0;
  if (!s.ad) {
    /* partida de la versión 1 (técnicas nacionales): lo investigado queda adoptado en las ciudades que ya
       tenía cada reino, y cada capital recibe cuartel y establo para poder seguir reclutando */
    s.ad = {};
    for (const p of G.P) {
      const f = p.owner;
      if (!tecListo(f)) continue;
      const l = tecF(f).h.filter((id) => tecLocal(TEC[id]));
      if (l.length) s.ad[p.id] = l.slice();
      if (G.F[f].capId === p.id) {
        p.cuartel = Math.max(1, p.cuartel || 0);
        p.establo = Math.max(1, p.establo || 0);
      }
    }
  }
  s.v = 2;
  if (!s.ini) {
    s.ini = true;
    for (let f = 0; f < NF; f++) {
      const ini = CIV[f].tecIni || {},
        cap = G.F[f] && G.P[G.F[f].capId];
      for (const id of ini.tec || []) if (TEC[id] && !s.f[f].h.includes(id)) s.f[f].h.push(id);
      if (cap && cap.owner === f) {
        const edi = { cuartel: 1, [tecSinCaballos(f) ? "guerreros" : "establo"]: 1, ...(ini.edi || {}) };
        for (const [k, v] of Object.entries(edi))
          if (!tecB(k).costa || tecCosta(cap)) cap[k] = Math.max(cap[k] || 0, v);
        for (const id of ini.tec || [])
          if (tecLocal(TEC[id]) && !tecAdoptada(cap, id)) (s.ad[cap.id] = s.ad[cap.id] || []).push(id);
      }
      if (!human(f)) tecIAInvestigar(f);
    }
  }
  tecCache = { k: "", v: [], c: {} };
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

/* ---------- perfil y huecos de la ciudad ---------- */
/* {id, nombre, icono, sin, militar, economico, saber}: puntos de cada vocación = niveles de sus edificios
   + técnicas adoptadas de su rama. Especializada si la mayor llega a 4 y es al menos el 55% del total. */
function tecPerfil(p) {
  const v = { mil: 0, eco: 0, saber: 0 };
  for (const k of tecEdificios()) {
    const c = tecB(k).cat;
    if (c && p[k] > 0) v[c] += p[k];
  }
  for (const id of tecAdopciones(p)) {
    const T = TEC[id];
    if (T) v[T.r === "mil" ? "mil" : T.r === "eco" ? "eco" : "saber"]++;
  }
  const tot = v.mil + v.eco + v.saber,
    top = Object.keys(v).sort((a, b) => v[b] - v[a])[0];
  let id = "mixta";
  if (tot < 3) id = "aldea";
  else if (v[top] >= 4 && v[top] >= tot * 0.55)
    id =
      top === "mil"
        ? "fuerte"
        : top === "saber"
          ? "saber"
          : (p.farm || 0) >= (p.market || 0) + (p.puerto || 0)
            ? "granero"
            : "mercantil";
  return { id, ...TEC_PERFIL[id], militar: v.mil, economico: v.eco, saber: v.saber };
}
/* Huecos de edificio: 2 + 1 por cada 5.000 almas (+2 la capital), entre 3 y 9. Mejorar no gasta hueco. */
function tecHuecos(p) {
  const total = clamp(2 + Math.floor(tecPob(p) / 5) + (tecEsCapital(p) ? 2 : 0), 3, 9),
    q = tecCola(p.id),
    usados = tecEdificios().filter((k) => !tecB(k).sinHueco && (p[k] > 0 || q.some((o) => o.k === k))).length;
  return { usados, total, libres: total - usados };
}

/* Visión extra de la ciudad para la niebla de guerra de Campaña: el nivel de su torre de vigilancia (0-3),
   que Campaña traduce en radio. */
const tecVision = (p) => Math.max(0, Math.min(3, (p && +p.torre) || 0));

/* ---------- bonificaciones (caché por año y revisión) ---------- */
function tecCacheOk() {
  const k = G.seed + "|" + G.year + "|" + G.tec.rev;
  if (tecCache.k !== k) tecCache = { k, v: [], c: {} };
}
const tecVacio = () => {
  const z = () => ({ atk: 0, hp: 0 });
  return { st: { i: z(), a: z(), c: z() }, cu: { i: 0, a: 0, c: 0 } };
};
const tecCats = (c) => (c === "all" ? TEC_CAT : [c]);
function tecSumarTropa(b, T) {
  for (const c in T.st || {}) for (const x of tecCats(c)) for (const s in T.st[c]) b.st[x][s] += T.st[c][s];
  for (const c in T.cu || {}) for (const x of tecCats(c)) b.cu[x] += T.cu[c];
}
/* Bonos del reino: técnicas «del reino» y edificios propios con efecto de reino. */
function tecBon(f) {
  if (!tecListo(f)) return null;
  tecCacheOk();
  return tecCache.v[f] || (tecCache.v[f] = tecCalcBon(f));
}
function tecCalcBon(f) {
  const b = {
    ...tecVacio(),
    mant: { comida: 0, oro: 0 },
    bono: { atacante: 0, defensor: 0 },
    best: {},
    dip: 0,
    dipRel: 0,
  };
  for (const id of tecF(f).h) {
    const T = TEC[id];
    if (!T || tecLocal(T)) continue;
    tecSumarTropa(b, T);
    for (const s in T.mant || {}) b.mant[s] += T.mant[s];
    for (const s in T.bono || {}) b.bono[s] += T.bono[s];
    b.dip += T.dip || 0;
    b.dipRel += T.dipRel || 0;
  }
  for (const p of owned(f)) for (const k of tecEdificios()) b.best[k] = Math.max(b.best[k] || 0, p[k] || 0);
  for (const k in TEC_EDI) if (TEC_EDI[k].reino && b.best[k]) TEC_EDI[k].reino(b, b.best[k]);
  return b;
}
/* Bonos de las tropas de una ciudad: reino + edificios de la ciudad + técnicas adoptadas allí + perfil. */
function tecCiudad(f, p) {
  const n = tecBon(f);
  if (!n) return null;
  const key = f + ":" + p.id;
  if (tecCache.c[key]) return tecCache.c[key];
  const b = tecVacio();
  for (const c of TEC_CAT) {
    b.st[c] = { ...n.st[c] };
    b.cu[c] = n.cu[c];
  }
  for (const k in TEC_EDI) if (TEC_EDI[k].local && p[k] > 0) TEC_EDI[k].local(b, p[k]);
  for (const id of tecAdopciones(p)) if (TEC[id]) tecSumarTropa(b, TEC[id]);
  if (tecPerfil(p).id === "fuerte")
    for (const c of TEC_CAT) {
      b.cu[c] -= 0.1;
      b.st[c].hp += 0.05;
    }
  return (tecCache.c[key] = b);
}
/* Sin ciudad de origen: la media de las ciudades del reino (criterio prudente). */
function tecMedia(f) {
  const n = tecBon(f);
  if (!n) return null;
  if (n.media) return n.media;
  const own = owned(f),
    b = tecVacio();
  if (!own.length) return (n.media = { st: n.st, cu: n.cu });
  for (const p of own) {
    const x = tecCiudad(f, p);
    for (const c of TEC_CAT) {
      b.st[c].atk += x.st[c].atk / own.length;
      b.st[c].hp += x.st[c].hp / own.length;
      b.cu[c] += x.cu[c] / own.length;
    }
  }
  return (n.media = b);
}
const tecTropas = (f, p) => (p && p.owner === f ? tecCiudad(f, p) : tecMedia(f));

/* ---------- tropas: qué se recluta en cada ciudad ---------- */
/* Categoría básica (i/a/c) de un tipo de tropa, aunque combate cree tipos nuevos en UN. */
function tecCat(t) {
  if (TEC_CAT.includes(t)) return t;
  const u = (typeof UN !== "undefined" && UN[t]) || {};
  for (const x of [u.cat, u.base, u.clase]) if (TEC_CAT.includes(x)) return x;
  if (u.rg) return "a";
  if ((u.mv || 0) >= 4) return "c";
  return "i";
}
/* Edificio, nivel y técnica que pide una clase. Orden: UN[t].tec (combate) > TEC_UNIDADES[t]
   (civilizaciones.js, únicas y bestias) > regla general (élite = coste > 1,4× su clase base: un nivel más y
   la doctrina TEC_ELITE adoptada en la ciudad). Edificio: TEC_UNIDADES[t].edif > UN[t].edif > el de su clase. */
function tecReqUnidad(t, f) {
  const u = UN[t] || {},
    x = (typeof TEC_UNIDADES !== "undefined" && TEC_UNIDADES[t]) || null,
    cat = tecCat(t),
    elite = !!(UN[cat] && u.cost > UN[cat].cost * 1.4),
    edif =
      x && x.edif && BLD[x.edif]
        ? x.edif
        : u.edif && BLD[u.edif]
          ? u.edif
          : { i: "cuartel", a: "arqueria", c: "establo" }[cat],
    nivel = (x && x.nivel) || u.nivel || (edif === "cuartel" ? (elite ? 3 : 2) : elite ? 2 : 1);
  let tec = null;
  if (u.tec && TEC[u.tec]) tec = u.tec;
  else if (x) tec = x.tec && typeof x.tec === "object" ? x.tec[CIV[f] && CIV[f].id] || null : x.tec || null;
  else if (elite) tec = TEC_ELITE[cat];
  return { edif, nivel, elite, tec: tec && TEC[tec] ? tec : null };
}
/* Año desde el que se puede reclutar una clase: UN[t].anio, o el del nivel de edificio que pide. */
function tecAnioUnidad(t, f) {
  if (TEC_CAT.includes(t)) return 0;
  const u = UN[t] || {};
  if (u.anio) return u.anio;
  const r = tecReqUnidad(t, f);
  return tecAnioEdi(r.edif, r.nivel);
}
function tecUnidadPropia(t, f) {
  const u = UN[t] || {},
    c = u.civ ?? u.civs;
  return c == null || c === f || (Array.isArray(c) && c.includes(f));
}
/* Doctrina que una clase de élite necesita adoptada en la ciudad (salvo UN[t].tec). */
const TEC_ELITE = { i: "disciplina", a: "arcos", c: "remonta" };
/* ¿Se puede reclutar t en la ciudad p? {ok, motivo}. Las clases básicas: infantería siempre; arqueros con
   cuartel o campo de tiro; jinetes con establo (salvo los pueblos de CIV[f].tecLibres). */
function tecPuedeReclutar(f, p, t) {
  const u = (typeof UN !== "undefined" && UN[t]) || null,
    libres = (CIV[f] && CIV[f].tecLibres) || [];
  if (!u) return { ok: false, motivo: "desconocida" };
  if (u.asedio) return { ok: false, motivo: "se construye durante un asedio" };
  if (!tecCivPuede(f, t))
    return {
      ok: false,
      motivo: typeof mundoMotivoVeto === "function" ? mundoMotivoVeto(f) : "no hay caballos en estas tierras",
    };
  if (t === "i" || libres.includes(t)) return { ok: true, motivo: "" };
  if (t === "a")
    return p.cuartel > 0 || p.arqueria > 0 || p.guerreros > 0
      ? { ok: true, motivo: "" }
      : {
          ok: false,
          motivo: `requiere Cuartel, Campo de tiro${tecSinCaballos(f) ? " o " + tecB("guerreros", f).n : ""}`,
        };
  if (t === "c") return p.establo > 0 ? { ok: true, motivo: "" } : { ok: false, motivo: "requiere Establo" };
  if (!tecUnidadPropia(t, f)) return { ok: false, motivo: "no es de tu pueblo" };
  const r = tecReqUnidad(t, f);
  if ((p[r.edif] || 0) < r.nivel)
    return { ok: false, motivo: `requiere ${tecB(r.edif, f).n} ${TEC_ROM[r.nivel]}` };
  const an = tecAnioUnidad(t, f);
  if (!tecDesde(an)) return { ok: false, motivo: "desde el año " + an };
  const doc = r.tec;
  if (doc && !tecRige(f, p, doc))
    return {
      ok: false,
      motivo: `requiere «${TEC[doc].n}» ${tecLocal(TEC[doc]) ? "adoptada aquí" : ""}`.trim(),
    };
  return { ok: true, motivo: "" };
}
/* Lista para la interfaz: todas las clases conocidas con su estado en la ciudad. */
function tecReclutables(f, p) {
  const ks =
    typeof cmbRoster === "function"
      ? cmbRoster(f)
      : [...new Set([...(typeof TYP !== "undefined" ? TYP : TEC_CAT), ...Object.keys(UN)])];
  return ks
    .filter((t) => UN[t] && !UN[t].asedio && !UN[t].merc && tecUnidadPropia(t, f) && tecCivPuede(f, t))
    .map((t) => ({ t, ...tecPuedeReclutar(f, p, t) }));
}
/* Lo que de verdad se recluta en la ciudad: lo que decide combate (fama, repertorio) o, si no está,
   OC.calc('unidadesDisponibles') con su ciudad (tecnología + vetos de Mundo). */
function tecReclutaAqui(f, p) {
  if (typeof cmbDisp === "function") {
    try {
      return cmbDisp(f, p).ok;
    } catch (e) {}
  }
  const base = tecReclutables(f, p).map((x) => x.t),
    r = OC.calc("unidadesDisponibles", base.slice(), { f, p, motivos: {} });
  return (Array.isArray(r) ? r : base).filter((t) => tecCivPuede(f, t));
}

/* ---------- puntos de investigación: los generan las ciudades ---------- */
function tecPuntosCiudad(p, f = p.owner) {
  if (!tecListo(f)) return 0;
  let v = 0.6 + tecPob(p) * 0.075;
  for (const k in TEC_EDI) {
    const L = p[k] || 0,
      e = TEC_EDI[k];
    if (L && e.pts) v += e.pts(p, L, f);
  }
  for (const id of tecAdopciones(p)) if (TEC[id] && TEC[id].ptsC) v += TEC[id].ptsC(p);
  if (G.F[f] && G.F[f].capId === p.id) {
    const r = ruler(f);
    v += 1.5 + tecF(f).era;
    for (const id of tecF(f).h)
      if (TEC[id] && !tecLocal(TEC[id]) && TEC[id].pts) v += TEC[id].pts(f, owned(f));
    if (r) v += (r.ge - 5) * 0.3 - (r.age < 16 ? 1 : 0);
  }
  if (tecPerfil(p).id === "saber") v *= 1.25;
  return Math.max(0, Math.round(v * 10) / 10);
}
function tecPuntos(f) {
  if (!tecListo(f) || !alive(f)) return 0;
  const v = owned(f).reduce((s, p) => s + tecPuntosCiudad(p, f), 0);
  /* OC 'puntosInvestigacion': puntos por año. ctx {f} */
  return Math.max(1, Math.round(OC.calc("puntosInvestigacion", v, { f }) * 10) / 10);
}
const tecMejorEscuela = (f) => Math.max(0, ...owned(f).map((p) => p.escuela || 0));
function tecDisponible(f, id) {
  const T = TEC[id];
  return (
    !!T &&
    !tecTiene(f, id) &&
    tecParaCiv(f, T) &&
    T.req.every((x) => tecTiene(f, x)) &&
    (T.era == null || tecF(f).era >= T.era) &&
    (!T.saber || tecMejorEscuela(f) >= T.saber) &&
    tecDesde(T.anio)
  );
}
function tecAprender(f, id) {
  const F = tecF(f);
  if (F.h.includes(id)) return;
  F.h.push(id);
  G.tec.rev++;
  const T = TEC[id];
  if (isMe(f))
    addLog(
      `Los sabios de la corte culminan «${T.n}»: ${T.ef}${tecLocal(T) ? " (hay que implantarla en cada ciudad)" : ""}.`,
      "good",
    );
  else if (T.civ != null) addLog(`${CIV[f].s} perfecciona «${T.n}».`);
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
    if (v.t < r.t || v.p < r.p || v.e < r.e || !tecDesde(r.anio)) break;
    F.era++;
    G.tec.rev++;
    const nm = tecEras(f)[F.era];
    addLog(`${CIV[f].n} entra en una nueva era: «${nm}».`, isMe(f) ? "good" : "");
    OC.emitirSync("eraNueva", { f, era: F.era });
    if (isMe(f))
      modal(
        `Una nueva era: ${nm}`,
        `<p>${TEC_ERA_TXT[F.era]}</p><p class="dim">Cada era suma +1 investigación en la capital, +1 orden en las ciudades y +4% de oro.</p>`,
        [{ t: "Que lo registren los cronistas", cls: "gold" }],
      );
  }
}

/* ---------- obras: edificios ---------- */
function tecMax(k, f, p) {
  let m = tecB(k).max;
  if (tecB(k).yac) m = Math.min(m, Math.max(p[k] || 0, tecRiqueza(p, k)));
  if (tecListo(f) && G.F[f] && G.F[f].capId === p.id)
    for (const id of tecF(f).h)
      if (TEC[id] && TEC[id].maxCap && TEC[id].maxCap[k]) m = Math.max(m, TEC[id].maxCap[k]);
  return m;
}
function tecVisible(k, f, p) {
  const B = tecB(k);
  if (B.civ != null && B.civ !== f && !p[k]) return false;
  if (B.caballo && tecSinCaballos(f) && !p[k]) return false;
  if (B.sinCaballos && !tecSinCaballos(f) && !p[k]) return false;
  if (B.yac && !p[k] && !tecRiqueza(p, k)) return false;
  return !B.costa || tecCosta(p) || p[k] > 0;
}
function tecAnios(f, k, n) {
  const t = tecB(k).t || [1];
  return Math.max(1, t[Math.min(n, t.length) - 1] - (tecTiene(f, "ingenieria") ? 1 : 0));
}
function tecCoste(f, p, k, n) {
  const B = tecB(k),
    c = { oro: Math.round(B.c * (1 + 0.6 * (n - 1)) * TEC_ORO) };
  if (B.mat && OC.recursos.some((r) => r.id === B.mat)) c[B.mat] = 4 * n;
  /* OC 'costeConstruccion': objeto coste. ctx {f, p, id, nivel} */
  return OC.calc("costeConstruccion", c, { f, p, id: k, nivel: n });
}
/* Lo que se paga de verdad (oro nacional): el material que falte se suple con oro. null si no alcanza. */
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
/* Siguiente nivel de un edificio en una ciudad: {ok, n, motivo, coste, pago, anios} */
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
  if (req && !tecRige(f, p, req))
    return {
      ...r,
      motivo:
        "requiere " +
        (TEC[req] ? TEC[req].n : req) +
        (tecLocal(TEC[req]) && tecTiene(f, req) ? " adoptada aquí" : ""),
    };
  const an = tecAnioEdi(k, n);
  if (!tecDesde(an)) return { ...r, motivo: "desde el año " + an };
  if (n === 1 && !B.sinHueco && tecHuecos(p).libres <= 0) return { ...r, motivo: "sin hueco" };
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
  s.rev++;
  return m;
}

/* ---------- obras: adopción local de descubrimientos ---------- */
const tecEnTxt = (T, f) => {
  const en = []
    .concat(T.en || [])
    .filter(
      (k) =>
        f == null || !((tecB(k).caballo && tecSinCaballos(f)) || (tecB(k).sinCaballos && !tecSinCaballos(f))),
    );
  return en.map((k) => tecB(k, f).n + (T.enN > 1 ? " " + TEC_ROM[T.enN] : "")).join(" o ");
};
function tecAdopcion(f, p, id) {
  const T = TEC[id],
    q = tecCola(p.id),
    r = { ok: false, motivo: "", coste: null, pago: null, anios: 0 };
  if (!tecLocal(T)) return { ...r, motivo: "rige en todo el reino" };
  if (!tecTiene(f, id)) return { ...r, motivo: "sin descubrir" };
  if (tecAdoptada(p, id)) return { ...r, motivo: "adoptada" };
  if (q.some((o) => o.ad === id)) return { ...r, motivo: "en curso" };
  const en = [].concat(T.en || []);
  if (en.length && !en.some((k) => (p[k] || 0) >= (T.enN || 1)))
    return { ...r, motivo: "requiere " + tecEnTxt(T, f) };
  const c = { oro: Math.round((15 + T.c) * TEC_ORO) },
    mat = { mil: "hierro", eco: "madera" }[T.r] || "piedra";
  if (OC.recursos.some((x) => x.id === mat)) c[mat] = T.r === "mil" ? 4 : 3;
  r.coste = OC.calc("costeConstruccion", c, { f, p, id: "tec:" + id, nivel: 1 });
  r.anios = Math.max(1, (T.c > 20 ? 2 : 1) - (tecTiene(f, "ingenieria") && T.c > 20 ? 1 : 0));
  r.pago = tecPago(f, r.coste);
  if (q.length >= TEC_COLA) r.motivo = "obras ocupadas";
  else if (!r.pago) r.motivo = "sin fondos";
  r.ok = !r.motivo;
  return r;
}
function tecAdoptar(f, p, id) {
  const m = tecAdopcion(f, p, id);
  if (!m.ok || !OC.pagar(f, m.pago)) return null;
  (G.tec.obras[p.id] = G.tec.obras[p.id] || []).push({ ad: id, a: m.anios, t: m.anios, f, c: m.pago });
  G.tec.rev++;
  return m;
}
/* Descubrimientos «de ciudad» que f conoce y aún no rigen en p. */
const tecPorAdoptar = (f, p) =>
  tecListo(f) ? tecF(f).h.filter((id) => tecLocal(TEC[id]) && !tecAdoptada(p, id)) : [];

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
    s.rev++;
    if (o.ad) {
      if (tecAdoptada(p, o.ad)) continue;
      (s.ad[p.id] = s.ad[p.id] || []).push(o.ad);
      if (isMe(f)) addLog(`En ${p.name} se implanta «${TEC[o.ad].n}»: ${TEC[o.ad].ef}.`, "good");
      OC.emitirSync("tecnologiaAdoptada", { f, p, id: o.ad });
      continue;
    }
    if ((p[o.k] || 0) >= tecMax(o.k, f, p)) continue;
    p[o.k] = (p[o.k] || 0) + 1;
    if (isMe(f)) addLog(`Concluye la obra en ${p.name}: ${tecB(o.k, f).n} ${TEC_ROM[p[o.k]]}.`, "good");
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
/* Vocación que la IA da a una ciudad: la que ya tiene si está especializada; si no, según su situación. */
function tecIAVocacion(f, p, x) {
  const per = tecPerfil(p).id;
  if (per === "fuerte") return "mil";
  if (per === "saber") return "saber";
  if (per === "granero" || per === "mercantil") return "eco";
  if (x.amen) return "mil";
  if (G.F[f].capId === p.id) return "saber";
  return x.front && (p.cuartel || 0) > 0 ? "mil" : "eco";
}
function tecIAConstruir(f) {
  const F = G.F[f],
    own = owned(f);
  if (!own.length) return;
  const e = inc(f),
    fav = CIV[f].tecEdi || [],
    reserva = 6 + own.length; // el resto lo gasta ia.js en tropas
  for (let n = F.gold > 220 ? 2 : 1; n > 0; n--) {
    let best = null;
    for (const p of own) {
      if (tecCola(p.id).length) continue;
      const x = { e, f, amen: hostile(p, f).length, front: foes(p, f).length },
        voc = tecIAVocacion(f, p, x);
      for (const k of tecEdificios()) {
        const m = tecMejora(f, p, k);
        if (!m.ok || F.gold - (m.pago.oro || 0) < reserva) continue;
        const B = tecB(k);
        let w = B.ia ? B.ia(p, x) : 2.4;
        if (fav.includes(k)) w *= 1.4;
        if (B.cat) w *= B.cat === voc ? 2 : 0.5;
        if (m.n === 1) w *= 0.8; // gastar un hueco pesa
        w *= (0.85 + R() * 0.3) / (((m.pago.oro || 20) / 40) * (1 + 0.25 * (m.n - 1)));
        if (!best || w > best.w) best = { p, k, w };
      }
    }
    if (!best) break;
    tecEncolar(f, best.p, best.k);
  }
}
/* Adopta descubrimientos donde más rinden: milicia en plazas fuertes y fronteras, economía en graneros y
   mercados, saber y culto en ciudades de saber o con desorden. */
function tecIAAdoptar(f) {
  const F = G.F[f],
    own = owned(f),
    reserva = 6 + own.length;
  for (let n = F.gold > 200 ? 2 : 1; n > 0; n--) {
    let best = null;
    for (const p of own) {
      if (tecCola(p.id).length >= 2) continue;
      const per = tecPerfil(p).id,
        front = foes(p, f).length;
      for (const id of tecPorAdoptar(f, p)) {
        const m = tecAdopcion(f, p, id);
        if (!m.ok || F.gold - (m.pago.oro || 0) < reserva) continue;
        const r = TEC[id].r;
        let w = 1.5;
        if (r === "mil") w *= (per === "fuerte" ? 2.5 : 1) * (front ? 1.5 : 0.6);
        else if (r === "eco") w *= per === "granero" || per === "mercantil" ? 2.5 : 1;
        else w *= (per === "saber" ? 2.2 : 1) * (p.order < 50 ? 1.6 : 1);
        if (G.F[f].capId === p.id) w *= 1.3;
        w *= (0.85 + R() * 0.3) / ((m.pago.oro || 20) / 30);
        if (!best || w > best.w) best = { p, id, w };
      }
    }
    if (!best) break;
    tecAdoptar(f, best.p, best.id);
  }
}

/* ---------- el año de cada facción ---------- */
OC.on("partidaLista", tecPreparar);
OC.on("economiaFaccion", (f) => {
  if (!tecListo(f) || !alive(f)) return;
  if (!human(f)) {
    tecIAInvestigar(f);
    tecIAConstruir(f);
    tecIAAdoptar(f);
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
/* Rendimiento de una ciudad: técnicas del reino + adoptadas allí + edificios + era + perfil. */
OC.mod("rendimiento", (y, { p, f } = {}) => {
  if (!tecListo(f) || !p || !y) return;
  const F = tecF(f);
  let r = { ...y },
    gm = 1 + 0.04 * F.era,
    fm = 1;
  const aplica = (T) => {
    if (T.ren) r = T.ren(r, p, f) || r;
    gm += T.gpct || 0;
    fm += T.fpct || 0;
  };
  for (const id of F.h) if (TEC[id] && !tecLocal(TEC[id])) aplica(TEC[id]);
  for (const id of tecAdopciones(p)) if (TEC[id]) aplica(TEC[id]);
  for (const k in TEC_EDI) if (p[k] && TEC_EDI[k].ren) r = TEC_EDI[k].ren(r, p, p[k], f) || r;
  const per = tecPerfil(p).id;
  if (per === "mercantil") gm += 0.1;
  if (per === "granero") fm += 0.1;
  return { ...r, g: r.g * gm, fo: r.fo * fm };
});
OC.mod("ordenObjetivo", (o, { p, f } = {}) => {
  if (!tecListo(f) || !p) return;
  const F = tecF(f);
  let v = o + F.era;
  for (const id of F.h) if (TEC[id] && !tecLocal(TEC[id]) && TEC[id].ord) v += TEC[id].ord(p, f) || 0;
  for (const id of tecAdopciones(p)) if (TEC[id] && TEC[id].ord) v += TEC[id].ord(p, f) || 0;
  for (const k in TEC_EDI) if (p[k] && TEC_EDI[k].ord) v += TEC_EDI[k].ord(p, p[k], f) || 0;
  return v;
});
/* ctx.p = ciudad de origen de las tropas (o la que defienden). Sin ella, la media del reino. */
OC.mod("statsUnidad", (st, x = {}) => {
  const b = tecListo(x.f) && tecTropas(x.f, x.p);
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
  if (!b || typeof v !== "number") return;
  const casa = x.lado === "defensor" && x.p && x.p.owner === x.f;
  let def = casa && tecPerfil(x.p).id === "fuerte" ? 0.05 : 0;
  if (casa) for (const k in TEC_EDI) if (TEC_EDI[k].def && x.p[k] > 0) def += TEC_EDI[k].def;
  return v * (1 + (b.bono[x.lado] || 0) + def);
});
OC.mod("costeUnidad", (v, x = {}) => {
  const b = tecListo(x.f) && tecTropas(x.f, x.p);
  if (b && typeof v === "number") return v * Math.max(0.6, 1 + b.cu[tecCat(x.t)]);
});
OC.mod("mantenimientoTropa", (v, x = {}) => {
  const b = tecBon(x.f);
  if (!b || !v || typeof v !== "object") return;
  const o = { ...v };
  for (const k of ["comida", "oro"]) if (typeof o[k] === "number") o[k] *= Math.max(0.5, 1 + b.mant[k]);
  return o;
});
/* Con ctx.p (ciudad propia): lo que esa ciudad puede reclutar. Sin p: lo que alguna ciudad del reino puede. */
OC.mod("unidadesDisponibles", (arr, x = {}) => {
  if (!tecListo(x.f) || !Array.isArray(arr) || typeof UN === "undefined") return;
  const ps = x.p && x.p.owner === x.f ? [x.p] : owned(x.f);
  if (!ps.length) return;
  const ok = (t) => !UN[t] || ps.some((p) => tecPuedeReclutar(x.f, p, t).ok),
    out = arr.filter(ok);
  /* clases nuevas que combate marque con UN[t].edif: se añaden en cuanto la ciudad puede */
  for (const t of Object.keys(UN))
    if (!out.includes(t) && !arr.includes(t) && UN[t].edif && ok(t)) out.push(t);
  return out;
});
OC.mod("aceptacionDiplomatica", (v, x = {}) => {
  const b = tecBon(x.f);
  if (!b || typeof v !== "number") return;
  const misma = x.g != null && CIV[x.g] && CIV[x.g].rel === CIV[x.f].rel,
    dEra = tecListo(x.g) ? tecF(x.f).era - tecF(x.g).era : 0;
  return v + b.dip + (misma ? b.dipRel : 0) + Math.max(0, dEra) * 0.03;
});

/* ---------- interfaz: la ciudad ---------- */
function tecPips(p, k, f) {
  const max = tecMax(k, f, p),
    L = p[k] || 0,
    q = tecCola(p.id).filter((o) => o.k === k).length;
  let h = "";
  for (let i = 1; i <= max; i++) h += `<i class="${i <= L ? "on" : i <= L + q ? "obra" : ""}"></i>`;
  return `<span class="tec-niv" aria-label="nivel ${L} de ${max}">${h}</span>`;
}
/* Resumen de lo que rinden los edificios de una ciudad (también útil para la interfaz). */
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
  const otros = Object.keys(y)
    .filter((id) => id !== "g" && id !== "fo" && Math.round(y[id]) > 0)
    .map((id) => `+${Math.round(y[id])} ${id}`);
  return [
    y.fo && `+${Math.round(y.fo)} comida`,
    y.g && `+${Math.round(y.g)} oro`,
    ...otros,
    o && `+${o} orden`,
    p.walls && `+${25 * p.walls}% defensa`,
    pts && `+${pts} investigación`,
  ]
    .filter(Boolean)
    .join(" · ");
}
/* Yacimientos de la ciudad y lo que rinden o rendirían sus explotaciones. */
function tecYacHtml(p, f) {
  const Y = tecYac(p),
    pips = (q) => "●".repeat(q) + "○".repeat(3 - q),
    hay = Object.keys(TEC_YAC_N).filter((id) => (+Y[id] || 0) > 0);
  let fer = "";
  if (typeof ecoFertil === "function")
    try {
      const x = ecoFertil(p);
      if (x != null)
        fer = ` · tierra ${typeof x === "object" ? x.n || x.etiqueta || Math.round((x.v ?? 0) * 100) + "%" : Math.round(x * 100) + "%"}`;
    } catch (e) {}
  if (!hay.length && !fer) return "";
  const ex = Object.keys(TEC_YAC)
    .filter((k) => tecVisible(k, f, p))
    .map((k) => {
      const t = tecProdTxt(p, k),
        L = p[k] || 0,
        max = tecMax(k, f, p);
      return `${tecB(k, f).n}${L ? " " + TEC_ROM[L] + (t.ahora ? ` (${t.ahora})` : "") : ""}${L < max && t.sig ? ` → ${TEC_ROM[L + 1]}: ${t.sig}` : ""}`;
    });
  return `<p class="stats tec-yac">⛏ ${hay.map((id) => `${TEC_YAC_N[id]} <span class="tec-pip">${pips(Math.min(3, +Y[id]))}</span>`).join(" · ") || "sin yacimientos"}${fer}${ex.length ? "<br>" + ex.join(" · ") : ""}</p>`;
}
/* Línea corta con los edificios construidos y el perfil: «⚔ Plaza fuerte · Murallas II · Cuartel I» */
function tecLineaEdificios(p) {
  const l = tecEdificios()
    .filter((k) => p[k] > 0)
    .map((k) => `${tecB(k, p.owner).n} ${TEC_ROM[p[k]]}`);
  const per = G && G.tec ? tecPerfil(p) : null;
  return (
    (per && per.id !== "aldea" ? `${per.icono} ${per.nombre} · ` : "") +
    (l.length ? l.join(" · ") : "Sin edificios")
  );
}
const tecAnioTxt = (a) => `${a} año${a > 1 ? "s" : ""}`;
const tecPct = (v) => `${v >= 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)}%`;
function tecTropasTxt(f, p) {
  const b = tecCiudad(f, p),
    m = (k) => TEC_CAT.reduce((s, c) => s + b.st[c][k], 0) / 3,
    cu = TEC_CAT.reduce((s, c) => s + b.cu[c], 0) / 3;
  return `ataque ${tecPct(m("atk"))} · vida ${tecPct(m("hp"))} · coste ${tecPct(Math.max(-0.4, cu))}`;
}
OC.seccion("prov", {
  id: "edificios",
  orden: 30,
  visible: (c) => c.mine,
  render: ({ p, f }, dis) => {
    if (!tecListo(f)) return "";
    const q = tecCola(p.id),
      per = tecPerfil(p),
      hu = tecHuecos(p);
    let h = `<h3>La ciudad</h3><div class="tec-perfil"><span class="tec-pico">${per.icono}</span><div><b>${per.nombre}</b> <span class="stats">· huecos ${hu.usados}/${hu.total} · saber +${tecPuntosCiudad(p, f)}</span><br><span class="stats">⚔ ${per.militar} · ◉ ${per.economico} · ✎ ${per.saber}${per.sin ? " — " + per.sin : ""}</span></div></div>`;
    if (q.length)
      h += `<div class="tec-cola">${q
        .map(
          (o, i) =>
            `<div class="tec-obra"><span>${o.ad ? "✎ <b>" + TEC[o.ad].n : "⚒ <b>" + tecB(o.k, f).n + " " + TEC_ROM[o.n]}</b><br><small>${i ? "en espera" : "faltan " + tecAnioTxt(o.a)}</small></span><button data-act="tecanu-${i}" ${dis ? "disabled" : ""} title="Se recupera la mitad de lo pagado">Cancelar</button></div>`,
        )
        .join("")}</div>`;
    h += `<h3>Edificios</h3><div class="g2 tec-edis">${tecEdificios()
      .filter((k) => tecVisible(k, f, p))
      .map((k) => {
        const B = tecB(k, f),
          m = tecMejora(f, p, k),
          sub = m.coste ? `${OC.textoCoste(m.pago || m.coste)} · ${tecAnioTxt(m.anios)}` : m.motivo;
        return `<button data-act="bld-${k}" class="tec-ed" ${dis || !m.ok ? "disabled" : ""} title="${esc(`${B.n}: ${B.ef}${B.max > 1 ? " por nivel" : ""}${m.motivo ? " (" + m.motivo + ")" : ""}`)}"><span>${B.n}</span>${tecPips(p, k, f)}<small>${sub}</small></button>`;
      })
      .join("")}</div>`;
    const r = tecResumen(p);
    if (r) h += `<p class="stats tec-res">${r}</p>`;
    h += tecYacHtml(p, f);
    /* técnicas: adoptadas aquí y descubrimientos por implantar */
    const ad = tecAdopciones(p),
      pend = tecPorAdoptar(f, p);
    h += `<h3>Técnicas de la ciudad</h3>`;
    h += ad.length
      ? `<p class="tec-chips">${ad.map((id) => `<span class="tag" title="${esc(TEC[id].ef)}">${TEC[id].n}</span>`).join(" ")}</p>`
      : `<p class="stats">Aún no se ha implantado ningún descubrimiento.</p>`;
    if (pend.length)
      h += `<div class="tec-lista">${pend
        .map((id) => {
          const m = tecAdopcion(f, p, id),
            sub = m.coste
              ? `${OC.textoCoste(m.pago || m.coste)} · ${tecAnioTxt(m.anios)} · ${TEC[id].ef}`
              : m.motivo;
          return `<button data-act="tecado-${id}" class="tec-t" ${dis || !m.ok ? "disabled" : ""}><span>Implantar ${TEC[id].n}</span><small>${sub}</small></button>`;
        })
        .join("")}</div>`;
    /* tropas */
    const aqui = tecReclutaAqui(f, p),
      nom = (t) => (CIV[f].un && CIV[f].un[t]) || UN[t].s,
      /* los bloqueos con detalle ya los muestra «Reclutar» (combate); aquí, solo si no existe */
      no = typeof cmbDisp === "function" ? [] : tecReclutables(f, p).filter((x) => !aqui.includes(x.t));
    h += `<h3>Tropas de esta ciudad</h3><p class="stats">Recluta: <b class="tec-ok">${
      aqui.map(nom).join(", ") || "nada"
    }</b>${no.map((x) => `<br>✗ ${nom(x.t)}: ${x.motivo || "no disponible"}`).join("")}<br>Sus tropas: ${tecTropasTxt(f, p)}</p>`;
    return h;
  },
});
OC.accion("bld", (v) => {
  const p = G.P[sel];
  if (!p || p.owner !== ME || !tecB(v).t) return;
  const m = tecEncolar(ME, p, v);
  if (m)
    addLog(`Comienzan las obras de ${tecB(v, ME).n} ${TEC_ROM[m.n]} en ${p.name} (${tecAnioTxt(m.anios)}).`);
});
OC.accion("tecado", (v) => {
  const p = G.P[sel];
  if (!p || p.owner !== ME || !TEC[v]) return;
  const m = tecAdoptar(ME, p, v);
  if (m) addLog(`${p.name} empieza a implantar «${TEC[v].n}» (${tecAnioTxt(m.anios)}).`);
});
OC.accion("tecanu", (v) => {
  const p = G.P[sel],
    q = p && G.tec.obras[p.id],
    o = q && q[+v];
  if (!o || o.f !== ME || p.owner !== ME) return;
  q.splice(+v, 1);
  if (o.k) for (const x of q) if (x.k === o.k && x.n > o.n) x.n--;
  if (!q.length) delete G.tec.obras[p.id];
  G.tec.rev++;
  const dev = {};
  for (const [id, c] of Object.entries(o.c || {})) dev[id] = Math.floor(c / 2);
  OC.ganar(ME, dev);
  addLog(
    `Se abandona en ${p.name} ${o.ad ? "la implantación de «" + TEC[o.ad].n + "»" : "la obra de " + tecB(o.k, ME).n}; se recupera ${OC.textoCoste(dev) || "nada"}.`,
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
    own = owned(ME),
    req = (a, b, t) => `<span class="${a >= b ? "tec-ok" : ""}">${t} ${a}/${b}</span>`;
  let h = `<h2>Progreso</h2><div class="tec-era"><span class="tec-era-n" style="border-color:${CIV[ME].c}">${TEC_ROM[F.era + 1]}</span><div><b>${eras[F.era]}</b><br><span class="stats">${
    sig
      ? `Hacia «${eras[F.era + 1]}»: ${req(v.t, sig.t, "técnicas")} · ${req(v.p, sig.p, "provincias")} · ${req(v.e, sig.e, "edificios")} · <span class="${tecDesde(sig.anio) ? "tec-ok" : ""}">desde ${sig.anio}</span>`
      : "La cumbre de tu linaje."
  }</span></div></div>`;
  const T = F.inv && TEC[F.inv];
  h += `<h3>Descubrimientos</h3>`;
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
  for (const id of Object.keys(TEC)
    .filter((id) => TEC[id].r === tecRama && tecParaCiv(ME, TEC[id]))
    .sort((a, b) => (TEC[a].anio || 0) - (TEC[b].anio || 0))) {
    const X = TEC[id],
      amb = tecLocal(X) ? `ciudad · ${tecEnTxt(X, ME)}` : "reino";
    if (tecTiene(ME, id)) {
      const n = tecLocal(X) ? own.filter((p) => tecAdoptada(p, id)).length : 0;
      h += `<div class="tec-t hecha"><span>✓ ${X.n}<b>${tecLocal(X) ? `${n}/${own.length} ciudades` : "todo el reino"}</b></span><small>${X.ef}</small></div>`;
      continue;
    }
    const falta = X.req.filter((r) => !tecTiene(ME, r)).map((r) => TEC[r].n),
      tarde = !tecDesde(X.anio),
      sub = falta.length
        ? "requiere " + falta.join(", ") + (tarde ? " · desde " + X.anio : "")
        : tarde
          ? "disponible en el año " + X.anio
          : X.era != null && F.era < X.era
            ? "requiere la era «" + eras[X.era] + "»"
            : X.saber && tecMejorEscuela(ME) < X.saber
              ? `requiere una ciudad con Escuela ${TEC_ROM[X.saber]}`
              : `${X.ef} (${amb})`;
    h += `<button data-act="tecinv-${id}" class="tec-t ${F.inv === id ? "on" : ""}" ${dis || !tecDisponible(ME, id) ? "disabled" : ""}><span>${X.n}<b>${X.c}</b></span><small>${sub}</small></button>`;
  }
  /* ciudades: quién aporta saber y qué ha adoptado */
  h += `</div><h3>Tus ciudades</h3><div class="tec-ciu">`;
  for (const p of own.slice().sort((a, b) => tecPuntosCiudad(b) - tecPuntosCiudad(a))) {
    const per = tecPerfil(p),
      ad = tecAdopciones(p);
    h += `<button data-act="tecver-${p.id}" title="${esc(ad.map((id) => TEC[id].n).join(", ") || "sin técnicas implantadas")}"><span>${per.icono} ${p.name}</span><span>${per.nombre}</span><span>${ad.length} téc.</span><span>+${tecPuntosCiudad(p)}</span></button>`;
  }
  h += `</div><h3>Las potencias</h3><div class="tec-cmp">`;
  for (let f = 0; f < NF; f++) {
    if (!alive(f) || !tecListo(f)) continue;
    const X = tecF(f);
    h += `<span style="color:${CIV[f].c}">${CIV[f].s}</span><span title="${esc(tecEras(f)[X.era])}">Era ${TEC_ROM[X.era + 1]}</span><span>${X.h.length} téc.</span><span>+${f === ME ? pts : X.ult || tecPuntos(f)}</span>`;
  }
  return (
    h +
    `</div><p class="note">El saber nace en las ciudades (escuelas, templos, población, la corte). Un descubrimiento «de ciudad» solo rinde donde se implanta: hazlo desde cada provincia.</p>`
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
OC.accion(
  "tecver",
  (v) => {
    const p = G.P[+v];
    if (!p) return;
    sel = p.id;
    tab = "prov";
    if (typeof centerOn === "function") centerOn(p.id);
  },
  { libre: true },
);
