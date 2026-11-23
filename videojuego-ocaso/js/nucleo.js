const W = 64,
  H = 40,
  T = 8,
  $ = (id) => document.getElementById(id);
const cv = $("map"),
  ctx = cv.getContext("2d");
cv.width = W * T;
cv.height = H * T;
const base = document.createElement("canvas");
base.width = cv.width;
base.height = cv.height;
const bx = base.getContext("2d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const R = Math.random,
  ri = (a, b) => a + Math.floor(R() * (b - a + 1)),
  pick = (a) => a[Math.floor(R() * a.length)],
  clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
  sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
const mul = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
function noise(r, gw, gh) {
  const g = [];
  for (let i = 0; i < (gw + 2) * (gh + 2); i++) g.push(r());
  return (x, y) => {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      s = (t) => t * t * (3 - 2 * t),
      u = s(x - ix),
      v = s(y - iy),
      at = (a, b) => g[b * (gw + 2) + a];
    const a = at(ix, iy),
      b = at(ix + 1, iy),
      c = at(ix, iy + 1),
      d = at(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

const B1 = { atk: 1, hp: 1 };
const CIV = [
  {
    n: "Imperio de Occidente",
    s: "Occidente",
    c: "#c8402e",
    d: "#6a170e",
    rel: "niceno",
    tm: "Emperador",
    tf: "Emperatriz",
    un: { i: "Legionarios", a: "Sagitarios", c: "Equites" },
    bon: { i: { atk: 1, hp: 1.2 }, a: B1, c: B1 },
    gold: 1,
    ord: 6,
    desc: "Legiones veteranas y un senado intrigante. Infantería más resistente y mejor orden público.",
    m: [
      "Flavio",
      "Aecio",
      "Valentiniano",
      "Mayoriano",
      "Antemio",
      "Petronio",
      "Olibrio",
      "Avito",
      "Constancio",
      "Marcelino",
    ],
    f: ["Gala", "Placidia", "Justa", "Honoria", "Eudoxia", "Aurelia", "Serena", "Licinia"],
  },
  {
    n: "Imperio de Oriente",
    s: "Oriente",
    c: "#8d55d6",
    d: "#43206f",
    rel: "niceno",
    tm: "Basileus",
    tf: "Augusta",
    un: { i: "Escutarios", a: "Toxotai", c: "Catafractos" },
    bon: { i: B1, a: B1, c: { atk: 1.05, hp: 1.2 } },
    gold: 1.25,
    ord: 0,
    desc: "La ciudad de las murallas y el oro. Más ingresos y catafractos acorazados.",
    m: ["Teodosio", "Marciano", "León", "Zenón", "Anastasio", "Basilisco", "Arcadio", "Justino"],
    f: ["Pulqueria", "Eudocia", "Verina", "Ariadna", "Elia", "Teodora", "Zoe"],
  },
  {
    n: "Visigodos",
    s: "Visigodos",
    c: "#3f80e4",
    d: "#1b438f",
    rel: "arriano",
    tm: "Rey",
    tf: "Reina",
    un: { i: "Guerreros godos", a: "Arqueros", c: "Jinetes godos" },
    bon: { i: { atk: 1.2, hp: 1 }, a: B1, c: { atk: 1.05, hp: 1 } },
    gold: 1,
    ord: 0,
    desc: "Un pueblo en marcha que busca tierra. Infantería feroz al ataque.",
    m: ["Alarico", "Ataúlfo", "Walia", "Teodorico", "Eurico", "Turismundo", "Sigerico", "Leovigildo"],
    f: ["Amalasunta", "Gosvinta", "Brunilda", "Ragnahilda", "Galsvinta", "Teodora"],
  },
  {
    n: "Hunos",
    s: "Hunos",
    c: "#e3a81f",
    d: "#8a600a",
    rel: "pagano",
    tm: "Gran Rey",
    tf: "Gran Reina",
    un: { i: "Guerreros", a: "Arqueros montados", c: "Jinetes esteparios" },
    bon: { i: { atk: 0.9, hp: 0.9 }, a: { atk: 1.2, hp: 1 }, c: { atk: 1.25, hp: 1 } },
    gold: 0.85,
    ord: -5,
    amv: 1.6,
    desc: "Jinetes de la estepa temidos por todos. Caballería y arqueros montados letales, economía pobre.",
    m: ["Atila", "Bleda", "Rua", "Uldin", "Ellac", "Dengizich", "Ernak", "Octar", "Mundzuk"],
    f: ["Kreka", "Ildico", "Arikan", "Erekan", "Tursa", "Bora"],
  },
  {
    n: "Vándalos",
    s: "Vándalos",
    c: "#1fa391",
    d: "#0b5249",
    rel: "arriano",
    tm: "Rey",
    tf: "Reina",
    un: { i: "Guerreros", a: "Arqueros", c: "Jinetes vándalos" },
    bon: { i: { atk: 1.1, hp: 1 }, a: B1, c: { atk: 1.1, hp: 1 } },
    gold: 1,
    ord: -3,
    loot: 30,
    desc: "Saqueadores audaces. Cada conquista llena el tesoro con 30 de oro de botín.",
    m: ["Genserico", "Hunerico", "Gunderico", "Trasamundo", "Gelimer", "Hilderico", "Gunthamundo"],
    f: ["Amalafrida", "Godelinda", "Thrasa", "Hilda", "Eudocia"],
  },
  {
    n: "Francos",
    s: "Francos",
    c: "#ea7a26",
    d: "#7d3a08",
    rel: "pagano",
    tm: "Rey",
    tf: "Reina",
    un: { i: "Hacheros francos", a: "Arqueros", c: "Jinetes" },
    bon: { i: { atk: 1.15, hp: 1.05 }, a: { atk: 0.95, hp: 1 }, c: B1 },
    gold: 1,
    ord: 3,
    icost: 0.8,
    desc: "Guerreros de la francisca. Infantería barata y robusta.",
    m: ["Clodión", "Meroveo", "Childerico", "Clodoveo", "Sigeberto", "Clotario", "Teodeberto"],
    f: ["Basina", "Clotilde", "Audofleda", "Lantilda", "Radegunda", "Ingunda"],
  },
  {
    n: "Persia Sasánida",
    s: "Sasánidas",
    c: "#d34793",
    d: "#6d1647",
    rel: "zoroastra",
    tm: "Shahanshah",
    tf: "Banbishn",
    un: { i: "Paighan", a: "Arqueros persas", c: "Savaran" },
    bon: { i: { atk: 0.95, hp: 1 }, a: { atk: 1.2, hp: 1 }, c: { atk: 1.1, hp: 1.15 } },
    gold: 1.1,
    ord: 2,
    desc: "El gran rival de Roma. Arqueros y caballería pesada de élite.",
    m: ["Yazdegerd", "Bahram", "Peroz", "Kavad", "Hormizd", "Jamasp", "Narsés", "Sapor"],
    f: ["Shirin", "Azarmidukht", "Purandokht", "Denag", "Sudaba"],
  },
  {
    n: "Rebeldes",
    s: "Rebeldes",
    c: "#9b958b",
    d: "#4f4a43",
    rel: "",
    un: { i: "Bagaudas", a: "Honderos", c: "Jinetes" },
    bon: { i: B1, a: B1, c: B1 },
    gold: 1,
    ord: 0,
    m: ["Bagauda"],
    f: ["Bagauda"],
  },
];
const REB = 7,
  NF = 7,
  TYP = ["i", "a", "c"];
const UN = {
  i: { s: "Infantería", cost: 10, atk: 3, hp: 10, food: 1, mv: 2.6 },
  a: { s: "Arqueros", cost: 14, atk: 3.4, hp: 7, food: 1, mv: 2.6, rg: 6 },
  c: { s: "Caballería", cost: 22, atk: 6, hp: 14, food: 2, mv: 5 },
};
const MULT = { i: { i: 1, a: 0.75, c: 1.6 }, a: { i: 1.5, a: 1, c: 0.7 }, c: { i: 0.7, a: 1.6, c: 1 } };
/* Edificios de provincia: [nombre, efecto por nivel, coste base en oro, nivel máximo].
   El nivel vive en G.P[i][clave] (número). Detalles (años, requisitos) en TEC_EDI (tecnologia.js). */
const BLD = {
  farm: ["Granja", "+5 comida", 30, 3],
  market: ["Mercado", "+5 oro", 40, 3],
  walls: ["Murallas", "+25% defensa", 50, 3],
  temple: ["Templo", "+12 orden", 35, 3],
  cuartel: ["Cuartel", "−4% coste de tropa, veteranía", 40, 3],
  establo: ["Establo", "jinetes: −6% coste, +4% ataque", 40, 2],
  arqueria: ["Campo de tiro", "arqueros: −6% coste, +4% ataque", 35, 2],
  herreria: ["Herrería", "+4% ataque y vida de las tropas", 50, 2],
  escuela: ["Escuela", "+1 investigación (+2 en la capital)", 35, 3],
  acueducto: ["Acueducto", "+4 orden, +1 comida", 60, 2],
  puerto: ["Puerto", "+3 oro (solo en la costa)", 45, 2],
};
const TAX = ["Bajos", "Normales", "Altos"],
  TAXM = [0.6, 1, 1.5],
  TAXO = [12, 0, -20];
const TRAITS = {
  Valiente: "+2 mando",
  Astuto: "+2 intriga",
  Elocuente: "+2 diplomacia",
  Prudente: "+2 gestión",
  Cruel: "+1 mando, −1 diplomacia",
  Ambicioso: "propenso a la traición",
  Piadoso: "+5 orden",
  Enfermizo: "salud frágil",
  Leal: "fiel a su señor, poca ambición",
  Codicioso: "+1 gestión, propenso al desfalco",
  Erudito: "+1 gestión, +1 diplomacia",
  Justo: "+1 gestión, grato al pueblo",
  Belicoso: "+1 mando, ansía la guerra",
  Paranoico: "+1 intriga, −1 diplomacia",
};
const PNAMES = [
  "Dacia Nova",
  "Mons Aureus",
  "Portus Albus",
  "Ripa Gothica",
  "Vicus Ferox",
  "Urbs Lunae",
  "Silva Caesia",
  "Pons Ruber",
  "Campus Martius Minor",
  "Aquae Calidae",
  "Colonia Ultima",
  "Saltus Niger",
  "Oppidum Fulvum",
  "Litus Ambrae",
  "Vallis Rosae",
  "Statio Borealis",
  "Castellum Ursi",
  "Forum Novum",
  "Promunturium",
  "Lacus Clarus",
  "Aurelia Prima",
  "Vallis Umbra",
  "Castra Nova",
  "Portus Ferri",
  "Silvania",
  "Campi Aurei",
  "Mons Ignis",
  "Lacus Ater",
  "Ripa Alta",
  "Thermae Saxa",
  "Collis Lupi",
  "Litus Corvi",
  "Sarmatica",
  "Ostium Rubrum",
  "Nemus Pallidum",
  "Arx Draconis",
  "Salinae",
  "Fons Gelidus",
  "Pagus Ventorum",
  "Caliga Vetus",
  "Turris Cinerea",
  "Insula Aspera",
  "Vada Lenta",
  "Ager Mortuus",
];
const ROM = ["", "", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const SP = {
  castle: [
    "....k......",
    "....kFFF...",
    "....kFF....",
    "....k......",
    ".k.k.k.k.k.",
    ".wwwwwwwww.",
    ".wsswwwssw.",
    ".wwwwwwwww.",
    ".wwwwkwwww.",
    ".wwwkkkwww.",
    "ddddddddddd",
  ],
  castle2: [
    "....kFF....",
    "....kFFF...",
    "....k.F....",
    "....k......",
    ".k.k.k.k.k.",
    ".wwwwwwwww.",
    ".wsswwwssw.",
    ".wwwwwwwww.",
    ".wwwwkwwww.",
    ".wwwkkkwww.",
    "ddddddddddd",
  ],
  town: [
    "....kF...",
    "....kFF..",
    "..rrkrr..",
    ".rrrrrrr.",
    "rrrrrrrrr",
    ".wwwwwww.",
    ".wwskwsw.",
    ".wwwkwww.",
    "ddddddddd",
  ],
  i: ["......t", "..hh..p", ".hhhh.p", "..bb..p", ".ffffbp", "bffff.p", ".ffff..", ".f..f..", ".k..k.."],
  a: ["..hh...", ".hhhh..", "..bb.n.", ".ffffbn", "bffff.n", ".ffff.n", ".f..fn.", ".k..k..", "......."],
  c: [
    "..hh.....",
    ".hhhh....",
    "..bb.....",
    ".ffff..n.",
    ".ffffnnnn",
    "nnnnnnnn.",
    "nnnnnnn..",
    ".n.n.n.n.",
    ".k.k.k.k.",
  ],
  tree: ["..g..", ".gGg.", "gGggg", ".ggg.", "..t.."],
  hill: ["...m...", "..mMm..", ".mmmmm.", "mmmmmmm"],
};
const BP = {
  k: "#211c26",
  w: "#cfc6b6",
  s: "#3b3442",
  d: "rgba(0,0,0,.35)",
  h: "#b9bcc6",
  b: "#e3b48a",
  t: "#e8e8e8",
  p: "#6b4a2a",
  n: "#7a4f2c",
  g: "#2f6b2a",
  G: "#3f8a35",
  m: "#6d6250",
  M: "#e9e4da",
};
const PAL = CIV.map((c) => Object.assign({}, BP, { F: c.c, f: c.c, r: c.d }));
function spr(c, rows, x, y, pal) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const k = row[i];
      if (k === ".") continue;
      c.fillStyle = pal[k];
      c.fillRect(x + i, y + j, 1, 1);
    }
  });
}
const ICON = {};
function icon(f, t) {
  const k = f + t;
  if (!ICON[k]) {
    const c = document.createElement("canvas");
    c.width = 10;
    c.height = 10;
    spr(c.getContext("2d"), SP[t], 1, 0, PAL[f]);
    ICON[k] = c.toDataURL();
  }
  return ICON[k];
}

let G = null,
  MAP = null,
  ME = 0,
  sel = null,
  aim = 0,
  busy = false,
  anim = null,
  flash = null,
  hover = null,
  tab = "prov",
  BT = null,
  mq = Promise.resolve();
const net = {
  db: null,
  user: null,
  uid: null,
  on: false,
  id: null,
  unsub: null,
  lun: null,
  ver: 0,
  seats: {},
  cur: null,
  names: {},
  games: [],
};
const ST = { view: "home", mode: "single", civ: null, cands: [], ci: 0, gname: "" };
const tot = (u) => u.i + u.a + u.c,
  add = (a, b) => {
    for (const t in b) a[t] += b[t];
  },
  pw = (u) => Math.round(u.i * 5.5 + u.a * 5.3 + u.c * 9.2);
const owned = (f) => G.P.filter((p) => p.owner === f),
  alive = (f) => G.P.some((p) => p.owner === f),
  isMe = (f) => f === ME,
  human = (f) => G.human.includes(f);
const family = (f) => G.C.filter((c) => c.alive && c.f === f),
  genOf = (c) => G.P.find((p) => p.gen === c.id),
  kidsOf = (c) => G.C.filter((x) => x.fa === c.id || x.mo === c.id);
const ttl = (c) => (c.sex === "m" ? CIV[c.f].tm : CIV[c.f].tf),
  /* OC 'costeUnidad': oro por unidad. ctx {f, t} */
  cost = (f, t) => Math.round(OC.calc("costeUnidad", UN[t].cost * (t === "i" && CIV[f].icost ? CIV[f].icost : 1), { f, t }));
const atWar = (a, b) => a === REB || b === REB || G.st[a][b] === "guerra",
  myTurn = () => !net.on || net.cur === ME;
const gb = (id) => (id == null || !G.C[id] ? 1 : 1 + G.C[id].ma * 0.04),
  ruler = (f) => G.C[G.F[f].ruler];
const totPow = (f) => owned(f).reduce((s, p) => s + pw(p.u), 0);
const foes = (p, f) => MAP.adj[p.id].map((i) => G.P[i]).filter((q) => q.owner !== f),
  hostile = (p, f) => foes(p, f).filter((q) => atWar(f, q.owner));
function relAdd(a, b, v) {
  if (a >= NF || b >= NF) return;
  G.rel[a][b] = G.rel[b][a] = clamp(G.rel[a][b] + v, -100, 100);
}
function addLog(m, c = "") {
  G.log.unshift({ m, c });
  if (G.log.length > 250) G.log.length = 250;
}
function trait(o) {
  const t = o.tr;
  if (t === "Valiente") o.ma += 2;
  if (t === "Astuto") o.in += 2;
  if (t === "Elocuente") o.di += 2;
  if (t === "Prudente") o.ge += 2;
  if (t === "Cruel") {
    o.ma++;
    o.di--;
  }
  if (t === "Codicioso" || t === "Justo") o.ge++;
  if (t === "Erudito") {
    o.ge++;
    o.di++;
  }
  if (t === "Belicoso") o.ma++;
  if (t === "Paranoico") {
    o.in++;
    o.di--;
  }
  for (const k of ["ma", "in", "di", "ge"]) o[k] = clamp(o[k], 1, 10);
  return dipAmbLea(o);
}
function mkChar(f, sex, age, fa = null, mo = null) {
  const c = CIV[f],
    nm = pick(sex === "m" ? c.m : c.f),
    k = f + nm;
  G.nc[k] = (G.nc[k] || 0) + 1;
  const ch = trait({
    id: G.C.length,
    n: G.nc[k] > 1 ? nm + " " + (ROM[G.nc[k]] || G.nc[k]) : nm,
    f,
    sex,
    age,
    sp: null,
    fa,
    mo,
    ma: ri(1, 7),
    in: ri(1, 7),
    di: ri(1, 7),
    ge: ri(1, 7),
    tr: pick(Object.keys(TRAITS)),
    alive: true,
  });
  G.C.push(ch);
  return ch;
}
/* quiet: bodas del arranque de partida, sin evento */
function marry(a, b, quiet) {
  a.sp = b.id;
  b.sp = a.id;
  if (!quiet) OC.emitirSync("bodaCelebrada", { a, b });
}
