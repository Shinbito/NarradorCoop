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
  /* COMBATE: clases de guerreros. Las claves i/a/c son las de siempre (todo el juego crea {i,a,c});
     las demás pueden faltar en p.u (partidas antiguas, rebeldes): usa siempre (u[t] || 0). */
  TYP = ["l", "i", "p", "h", "a", "x", "c", "k", "m"];
/* cl: inf/dis/cab · me ataque cuerpo a cuerpo · ca carga · de defensa · ar armadura · es escudo frente a
   proyectiles (0-1) · vi vida · mo moral · di disciplina · fa fatiga (×) · ve velocidad · al alcance ·
   mu munición (descargas) · pr daño a distancia · pw fuerza estimada en campaña. atk/hp: valores antiguos.
   cat/edif/nivel: categoría básica y edificio de tecnología que la desbloquea (ver docs/tecnologia.md). */
// prettier-ignore
const UN = {
  l: { s: "Lanceros", cost: 9, food: 1, mv: 2.4, atk: 2.4, hp: 10, cat: "i", edif: "cuartel", nivel: 1, cl: "inf", me: 4, ca: 1, de: 8, ar: 4, es: 0.5, vi: 10, mo: 66, di: 6, fa: 1, ve: 1.45, al: 0, mu: 0, pr: 0, pw: 5.2 },
  i: { s: "Infantería", cost: 10, food: 1, mv: 2.6, atk: 3, hp: 10, cat: "i", cl: "inf", me: 6, ca: 2, de: 6, ar: 4, es: 0.4, vi: 10, mo: 64, di: 5, fa: 1, ve: 1.6, al: 0, mu: 0, pr: 0, pw: 5.5 },
  p: { s: "Infantería pesada", cost: 18, food: 1, mv: 2.2, atk: 4.2, hp: 13, cat: "i", edif: "cuartel", nivel: 2, cl: "inf", me: 8, ca: 2, de: 9, ar: 7, es: 0.45, vi: 13, mo: 78, di: 8, fa: 1.3, ve: 1.4, al: 0, mu: 0, pr: 0, pw: 8.4 },
  h: { s: "Escaramuzadores", cost: 8, food: 1, mv: 3, atk: 2.6, hp: 7, cat: "a", edif: "cuartel", nivel: 1, cl: "dis", me: 3, ca: 0, de: 3, ar: 1, es: 0.15, vi: 8, mo: 46, di: 3, fa: 0.8, ve: 2.1, al: 5, mu: 5, pr: 3.2, pw: 4.2 },
  a: { s: "Arqueros", cost: 14, food: 1, mv: 2.6, atk: 3.4, hp: 7, cat: "a", cl: "dis", me: 3, ca: 0, de: 3, ar: 2, es: 0.1, vi: 8, mo: 52, di: 4, fa: 0.9, ve: 1.7, al: 8, mu: 8, pr: 3.6, pw: 5.3 },
  x: { s: "Caballería ligera", cost: 16, food: 2, mv: 5.4, atk: 4.6, hp: 12, cat: "c", edif: "establo", nivel: 1, cl: "cab", me: 6, ca: 4, de: 4, ar: 2, es: 0.2, vi: 13, mo: 56, di: 4, fa: 0.8, ve: 3.7, al: 0, mu: 0, pr: 0, pw: 7 },
  c: { s: "Caballería", cost: 22, food: 2, mv: 5, atk: 6, hp: 14, cat: "c", cl: "cab", me: 9, ca: 6, de: 5, ar: 4, es: 0.3, vi: 16, mo: 66, di: 5, fa: 1, ve: 3.2, al: 0, mu: 0, pr: 0, pw: 9.2 },
  k: { s: "Caballería pesada", cost: 32, food: 2, mv: 4.2, atk: 8, hp: 18, cat: "c", edif: "establo", nivel: 2, cl: "cab", me: 10, ca: 9, de: 7, ar: 8, es: 0.25, vi: 20, mo: 76, di: 7, fa: 1.4, ve: 2.6, al: 0, mu: 0, pr: 0, pw: 13 },
  m: { s: "Arqueros a caballo", cost: 26, food: 2, mv: 5.4, atk: 4.4, hp: 12, cat: "c", edif: "establo", nivel: 1, cl: "cab", me: 4, ca: 2, de: 4, ar: 2, es: 0.1, vi: 12, mo: 58, di: 5, fa: 0.9, ve: 3.5, al: 6, mu: 7, pr: 3.3, pw: 9.6 },
};
/* FASE 2 (combate): máquinas de asedio, bestias y tropas únicas de cada pueblo. rol = clase base para
   la doctrina (MULT) y el comportamiento; asedio = no se recluta en ciudad (se construye durante un asedio);
   sitio = efecto contra murallas (brecha: derriba; torre: anula parte de su bono); hab = habilidades
   (habilidades.js); civs = ids de pueblo (CIV[f].id) que la tienen; caballo = montura que se espanta. */
for (const t in UN) UN[t].rol = t;
for (const t of ["x", "c", "k", "m"]) UN[t].caballo = true;
const cmbU = (base, o) => ({ ...UN[base], rol: base, edif: UN[base].edif, nivel: UN[base].nivel, ...o });
// prettier-ignore
Object.assign(UN, {
  ari: { s: "Arietes", cost: 30, food: 1, mv: 1, atk: 1, hp: 16, cat: "i", rol: "asd", asedio: true, sitio: { brecha: 0.4 }, cl: "asd", me: 1.5, ca: 0, de: 1, ar: 7, es: 0.85, vi: 16, mo: 50, di: 5, fa: 0.8, ve: 0.7, al: 0, mu: 0, pr: 0, pw: 3 },
  tor: { s: "Torres de asedio", cost: 40, food: 1, mv: 1, atk: 1, hp: 18, cat: "i", rol: "asd", asedio: true, sitio: { torre: 0.25 }, cl: "asd", me: 1, ca: 0, de: 1, ar: 5, es: 0.9, vi: 18, mo: 55, di: 5, fa: 0.8, ve: 0.5, al: 5, mu: 12, pr: 2.4, pw: 3 },
  cat: { s: "Catapultas", cost: 35, food: 1, mv: 1, atk: 1, hp: 9, cat: "a", rol: "asd", asedio: true, sitio: { brecha: 0.18 }, cl: "asd", me: 1, ca: 0, de: 1, ar: 1, es: 0, vi: 9, mo: 45, di: 4, fa: 0.8, ve: 0.5, al: 11, mu: 6, pr: 9, pw: 4 },
  ele: { s: "Elefantes de guerra", cost: 45, food: 3, mv: 3.5, atk: 9, hp: 30, cat: "c", edif: "establo", nivel: 2, rol: "ele", civs: ["ind", "per"], hab: ["estampida", "espanto"], cl: "cab", me: 11, ca: 10, de: 6, ar: 6, es: 0.35, vi: 30, mo: 62, di: 3, fa: 1.3, ve: 2.4, al: 0, mu: 0, pr: 0, pw: 18 },
  cam: { s: "Jinetes de camello", cost: 20, food: 2, mv: 4.6, atk: 5, hp: 15, cat: "c", edif: "establo", nivel: 1, rol: "cam", civs: ["ara", "egi"], hab: ["espanto"], calor: true, cl: "cab", me: 6, ca: 4, de: 5, ar: 2, es: 0.25, vi: 15, mo: 60, di: 5, fa: 0.7, ve: 3.3, al: 0, mu: 0, pr: 0, pw: 8.5 },
  car: { s: "Carros de guerra", cost: 28, food: 2, mv: 5, atk: 7, hp: 18, cat: "c", edif: "establo", nivel: 1, rol: "c", caballo: true, civs: ["egi"], hab: ["carga"], cl: "cab", me: 7, ca: 9, de: 4, ar: 4, es: 0.2, vi: 18, mo: 60, di: 4, fa: 1.1, ve: 3.4, al: 3, mu: 4, pr: 2.6, pw: 11 },
  com: cmbU("p", { s: "Comitatenses", cost: 17, civs: ["occ"], hab: ["testudo"], me: 7.5, de: 9, ar: 6, es: 0.55, vi: 12, mo: 76, pw: 8.2 }),
  sif: cmbU("h", { s: "Sifonarios", cost: 18, edif: "cuartel", nivel: 2, civs: ["ori"], hab: ["fuegoGriego"], me: 3, de: 4, ar: 3, es: 0.2, vi: 9, mo: 58, di: 6, al: 3, mu: 3, pr: 6, pw: 6 }),
  esg: cmbU("l", { s: "Escuderos godos", cost: 12, civs: ["vis"], hab: ["muroEscudos"], me: 5, de: 9, ar: 5, es: 0.6, mo: 70, di: 7, pw: 6.4 }),
  hpa: cmbU("m", { s: "Jinetes de Atila", cost: 28, civs: ["hun"], hab: ["disparoParto"], me: 5, pr: 3.6, mo: 64, ve: 3.7, pw: 10.5 }),
  cor: cmbU("i", { s: "Corsarios", cost: 12, edif: "cuartel", nivel: 1, civs: ["van"], hab: ["emboscada"], me: 6.5, de: 5, ar: 3, mo: 62, ve: 1.9, pw: 6 }),
  fca: cmbU("i", { s: "Lanzadores de francisca", cost: 13, edif: "cuartel", nivel: 1, civs: ["fra"], hab: ["grito"], me: 7, de: 6, ar: 3, al: 2, mu: 1, pr: 5, pw: 6.6 }),
  inm: cmbU("p", { s: "Inmortales", cost: 22, civs: ["per"], hab: ["juramento"], me: 7, de: 8, ar: 6, al: 6, mu: 4, pr: 3, mo: 80, di: 8, pw: 9.5 }),
  ber: cmbU("i", { s: "Berserkers", cost: 16, edif: "cuartel", nivel: 1, civs: ["nor"], hab: ["berserker"], me: 8, ca: 3, de: 4, ar: 1, es: 0.2, vi: 12, mo: 75, di: 3, fa: 1.2, ve: 1.8, pw: 7.5 }),
  jag: cmbU("i", { s: "Guerreros jaguar", cost: 15, edif: "cuartel", nivel: 1, civs: ["azt"], hab: ["grito", "sacrificio"], me: 7.5, ca: 3, de: 6, ar: 3, es: 0.35, vi: 11, mo: 72, di: 6, ve: 1.8, pw: 7.2 }),
  agu: cmbU("h", { s: "Guerreros águila", cost: 14, civs: ["azt"], hab: ["emboscada"], me: 6, de: 5, ar: 2, al: 4, mu: 4, pr: 3.2, ve: 2.2, mo: 70, di: 6, pw: 6.4 }),
  bal: cmbU("a", { s: "Ballesteros", cost: 16, edif: "arqueria", nivel: 1, civs: ["chi"], hab: ["lluviaFlechas"], pr: 5, al: 9, mu: 7, ar: 3, mo: 56, di: 6, pw: 6.8 }),
  hop: cmbU("l", { s: "Hoplitas", cost: 15, civs: ["gri"], hab: ["muroEscudos"], me: 6, de: 10, ar: 6, es: 0.65, mo: 74, di: 8, pw: 7.4 }),
  mac: cmbU("i", { s: "Guerreros de maza", cost: 11, edif: "cuartel", nivel: 1, civs: ["inc"], hab: ["tambores"], me: 7, ar: 3, mo: 66, pw: 6 }),
  atl: cmbU("h", { s: "Lanzadores de átlatl", cost: 10, civs: ["may"], hab: ["veneno"], pr: 4, al: 5, mu: 6, pw: 5 }),
  fia: cmbU("i", { s: "Fianna", cost: 13, edif: "cuartel", nivel: 1, civs: ["cel"], hab: ["grito", "emboscada"], me: 6.5, ve: 2, mo: 68, pw: 6.3 }),
  bos: cmbU("l", { s: "Lanceros del bosque", cost: 10, civs: ["esl"], hab: ["emboscada"], me: 4.5, ve: 1.7, mo: 66, pw: 5.6 }),
  kes: cmbU("m", { s: "Keshig", cost: 30, civs: ["mon"], hab: ["disparoParto", "tambores"], me: 6, de: 5, ar: 4, pr: 3.6, mo: 72, di: 7, pw: 11 }),
});
for (const t in UN) if (!TYP.includes(t)) TYP.push(t);
/* MULT[atacante][objetivo]: ventaja de doctrina en el cuerpo a cuerpo (la armadura y el escudo van aparte),
   calculada por rol: las tropas únicas heredan la doctrina de su clase base. */
const MULT = (() => {
  const R = ["l", "i", "p", "h", "a", "x", "c", "k", "m", "ele", "cam", "asd"],
    b = {},
    cab = ["x", "c", "k", "m"],
    dis = ["h", "a"],
    inf = ["l", "i", "p"],
    set = (a, bs, v) => bs.forEach((c) => (b[a][c] = v));
  for (const a of R) {
    b[a] = {};
    for (const c of R) b[a][c] = 1;
  }
  set("l", cab, 1.5);
  set("l", ["m"], 1.3);
  set("i", dis, 1.3);
  set("p", inf, 1.15);
  set("p", dis, 1.3);
  set("x", dis, 1.6);
  set("x", inf, 0.7);
  set("x", ["l", "k"], 0.5);
  set("x", ["m"], 1.2);
  set("c", dis, 1.6);
  set("c", ["l"], 0.6);
  set("c", ["x", "m"], 1.3);
  set("k", ["i", "p"], 1.3);
  set("k", ["l"], 0.75);
  set("k", dis, 1.7);
  set("k", ["x", "c", "m"], 1.3);
  set("m", R, 0.8);
  set("a", cab, 1.2);
  set("h", dis, 1.2);
  set("m", ["i", "l"], 0.9);
  set("ele", inf, 1.4);
  set("ele", ["l"], 0.9);
  set("ele", dis, 1.6);
  set("ele", cab, 1.5);
  set("ele", ["cam"], 1.2);
  set("cam", dis, 1.5);
  set("cam", cab, 1.25);
  set("cam", inf, 0.9);
  set("cam", ["l"], 0.6);
  set("l", ["ele"], 1.3);
  set("l", ["cam"], 1.4);
  set("a", ["ele", "cam"], 1.2);
  set("h", ["ele"], 1.2);
  set("x", ["ele"], 0.5);
  set("c", ["ele"], 0.6);
  set("k", ["ele"], 0.8);
  for (const a of R) b[a].asd = 1.6;
  set("asd", R, 0.5);
  const m = {};
  for (const a in UN) {
    m[a] = {};
    for (const c in UN) m[a][c] = b[UN[a].rol][UN[c].rol];
  }
  return m;
})();
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
  escuela: ["Escuela", "+1,5 investigación", 35, 3],
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
  l: ["......t", "..hh..p", ".hhhh.p", "..bb..p", "rrfffbp", "rrfff.p", "rrfff..", ".f..f..", ".k..k.."],
  p: ["..rr...", "..hh..t", ".hhhh.h", "..bb..h", "rhhhhbh", "rhffh..", "rhhhh..", ".h..h..", ".k..k.."],
  h: ["......t", "..pp..p", ".pbbp.p", "..bb.p.", ".ffffb.", "bffff..", ".ffff..", ".f..f..", ".k..k.."],
  x: [
    ".......t.",
    "..pp..p..",
    "..bb.p...",
    ".ffffb...",
    ".ffff.ww.",
    "wwwwwwww.",
    "wwwwwww..",
    ".w.w.w.w.",
    ".k.k.k.k.",
  ],
  k: [
    "..hh....t",
    ".hhhh..p.",
    "..hh..p..",
    ".hhhhp...",
    ".hhhhhhhh",
    "rrrrrrrh.",
    "hhhhhhh..",
    ".h.h.h.h.",
    ".k.k.k.k.",
  ],
  m: [
    "..hh..n..",
    ".hhhh..n.",
    "..bb...n.",
    ".ffffbn..",
    ".ffff.nnn",
    "nnnnnnnn.",
    "nnnnnnn..",
    ".n.n.n.n.",
    ".k.k.k.k.",
  ],
  ari: [".ppppppp.", "ppppppppp", ".p.....p.", "knnnnnnnn", ".p.....p.", "kk.kk.kk."],
  tor: ["..fff..", ".ppppp.", ".pkpkp.", ".ppppp.", ".pkpkp.", ".ppppp.", ".ppppp.", "ppppppp", "k.k.k.k"],
  cat: [
    "......kk.",
    ".....p...",
    "....p....",
    "...p.....",
    "..p......",
    "pppppppp.",
    ".p....p..",
    "kk....kk.",
  ],
  ele: [
    "...ff....",
    "..rrrr...",
    "hhhhhhh..",
    "hhhhhhhhh",
    "hhhhhhh.h",
    "hhhhhhhth",
    ".hh..hh..",
    ".hh..hh..",
  ],
  cam: [
    "..hh.....",
    "..ff...b.",
    ".bbbb.bb.",
    "bbbbbbbb.",
    ".bbbbbb..",
    ".b.b.b.b.",
    ".b.b.b.b.",
    ".k.k.k.k.",
  ],
  car: ["...ff....", "..ffff.n.", "..pppnnnn", "..ppnnnn.", "kk.n.n.n.", "kk.k.k.k."],
  tree: ["..g..", ".gGg.", "gGggg", ".ggg.", "..t.."],
  hill: ["...m...", "..mMm..", ".mmmmm.", "mmmmmmm"],
};
/* las tropas únicas sin dibujo propio usan el de su clase base */
for (const t of TYP) if (!SP[t]) SP[t] = SP[UN[t].rol] || SP.i;
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
const tot = (u) => TYP.reduce((s, t) => s + (u[t] || 0), 0),
  add = (a, b) => {
    for (const t in b) a[t] += b[t];
  },
  pw = (u) => Math.round(TYP.reduce((s, t) => s + (u[t] || 0) * UN[t].pw, 0));
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
