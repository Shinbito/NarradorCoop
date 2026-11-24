/* ---------- ICONOS dibujados (pixel art) para recursos y ánimo, en vez de símbolos o emojis ----------
   Los sistemas siguen usando un carácter como «icono» de cada recurso (◉ oro, ❦ comida, ♣ madera…; el ánimo,
   caracteres de uso privado U+E001…). Aquí cada uno tiene su dibujo de 10×10 y:
   - un observador cambia esos caracteres por <img class="ico"> en todo el texto del juego (paneles, barra de
     recursos, texto bajo el ratón…), con su nombre como texto alternativo;
   - la insignia de recurso del mapa (ifzInsRecurso) dibuja el icono en vez del carácter.
   Globales con prefijo ico / ICO. */
const ICO_PAL = {
  k: "#211c26", // contorno
  y: "#ffd04a", // oro claro
  g: "#f2c14e",
  G: "#a8771c",
  w: "#ece5d2",
  W: "#b7ae9c",
  n: "#7a4f2c", // madera
  N: "#4f321c",
  e: "#6abf4b", // verde
  E: "#3d7a2a",
  s: "#aab4bd", // metal
  S: "#6f7a84",
  r: "#c8432f",
  R: "#7a2318",
  p: "#a24a8f", // vino / seda
  P: "#e58bc9",
  o: "#ff8a3a",
  a: "#e8962a", // ámbar
  b: "#5b97f0",
  c: "#cfd6dc",
};
const ICO_SP = {
  oro: ["..kkkkkk..", ".kyyyyyyk.", "kyygggyyyk", "kygyyyygyk", "kygyGGygyk", "kygyGGygyk", "kygyyyygyk", "kyygggyyyk", ".kGGGGGGk.", "..kkkkkk.."],
  comida: ["....g.....", "..g.g.g...", "...ggg....", "..g.g.g...", "...ggg....", "....G.....", "...kGk....", "..k.G.k...", "....G.....", "...kkk...."],
  madera: ["...kkkk...", "..kEEEEk..", ".kEeeeeEk.", ".kEeeeeEk.", "..kEEEEk..", "...kNNk...", "kkkknnkkkk", "knwnnnnwnk", "knnnnnnnnk", "kkkkkkkkkk"],
  hierro: ["..........", "..........", "...kkkkkk.", "..ksssssk.", ".ksSssssk.", "kssssssSk.", "kSSSSSSk..", "kkkkkkk...", "..........", ".........."],
  caballos: ["....kk....", "...knnk...", "..knnnnk..", ".knNnnnnk.", ".knnnnnnk.", "kknnnkknk.", "knnnk..kk.", "kkkk...kNk", ".......kNk", "........k."],
  sal: ["..........", "....kk....", "...kwwk...", "..kwwwWk..", ".kwwkwwWk.", ".kwwwwWWk.", "kwwWwwwWWk", "kkkkkkkkkk", "..........", ".........."],
  vino: ["...kkkk...", "....kk....", "...kppk...", "..kppPpk..", ".kpppppPk.", ".kpppppPk.", ".kppppppk.", "..kppppk..", "...kppk...", "....kk...."],
  seda: ["..........", ".kkkkkkkk.", "kPPPPPPPPk", "kPpPPpPPPk", "kPPPPPPPPk", "kPPpPPPpPk", ".kkkkkkkk.", "...kPPk...", "....kk....", ".........."],
  incienso: ["....s.....", "...s......", "....s.....", ".....s....", "....s.....", "..kkkkkk..", ".kggggggk.", ".kGgggggk.", "..kGGGGk..", "...kkkk..."],
  especias: ["..........", "...ro.r...", "..rorror..", ".rorroorr.", "kkkkkkkkkk", "knnnnnnnnk", ".knnnnnnk.", "..kkkkkk..", "..........", ".........."],
  ambar: ["....kk....", "...kaak...", "..kayaak..", ".kayaaaak.", "kaaaaaaGak", ".kaaaaGak.", "..kaaGak..", "...kaak...", "....kk....", ".........."],
  piedra: ["..........", "..........", "...kkkk...", "..kWwwWk..", ".kWwwwwWk.", "kWWwwwWWWk", "kWWWWWWWWk", "kkkkkkkkkk", "..........", ".........."],
  cacao: ["..........", "...kkkk...", "..knnnnk..", ".knNnnNnk.", ".knnNNnnk.", ".knNnnNnk.", ".knnNNnnk.", "..knnnnk..", "...kkkk...", ".........."],
  estano: ["..........", "...kkkk...", "..kccccSk.", ".kcccccSk.", "kccccccSk.", "kSSSSSSk..", "kkkkkkk...", "..........", "..........", ".........."],
  /* ánimo: caras de color, de furioso a leal */
  furioso: ["..kkkkkk..", ".krrrrrrk.", "krkrrrrkrk", "krrkrrkrrk", "krrkrrkrrk", "krrrrrrrrk", "krrkkkkrrk", "krkrrrrkrk", ".krrrrrrk.", "..kkkkkk.."],
  disgustado: ["..kkkkkk..", ".kooooook.", "kooooooook", "kookookook", "kooooooook", "kooooooook", "kookkkkook", "kokooookok", ".kooooook.", "..kkkkkk.."],
  inquieto: ["..kkkkkk..", ".kyyyyyyk.", "kyyyyyyyyk", "kyykyykyyk", "kyyyyyyyyk", "kyyyyyyyyk", "kyykyykyyk", "kyyykkyyyk", ".kyyyyyyk.", "..kkkkkk.."],
  neutral: ["..kkkkkk..", ".kWWWWWWk.", "kWWWWWWWWk", "kWWkWWkWWk", "kWWWWWWWWk", "kWWWWWWWWk", "kWWkkkkWWk", "kWWWWWWWWk", ".kWWWWWWk.", "..kkkkkk.."],
  contento: ["..kkkkkk..", ".keeeeeek.", "keeeeeeeek", "keekeekeek", "keeeeeeeek", "keeeeeeeek", "kekeeeekek", "keekkkkeek", ".keeeeeek.", "..kkkkkk.."],
  feliz: ["..kkkkkk..", ".kEEEEEEk.", "kEEEEEEEEk", "kEkEEEEkEk", "kEEEEEEEEk", "kEkkkkkkEk", "kEkwwwwkEk", "kEEkkkkEEk", ".kEEEEEEk.", "..kkkkkk.."],
  leal: ["..........", ".kk....kk.", "kggk..kggk", "kgggkkgggk", "kgggggggGk", ".kgggggGk.", "..kgggGk..", "...kgGk...", "....kk....", ".........."],
};
/* carácter → icono (el ánimo usa caracteres de uso privado: economia.js) */
const ICO_GLIFO = {
  "◉": ["oro", "Oro"],
  "❦": ["comida", "Comida"],
  "♣": ["madera", "Madera"],
  "⚒": ["hierro", "Hierro"],
  "♞": ["caballos", "Caballos"],
  "◇": ["sal", "Sal"],
  "⚱": ["vino", "Vino"],
  "✦": ["seda", "Seda"],
  "∴": ["incienso", "Incienso"],
  "✺": ["especias", "Especias"],
  "◆": ["ambar", "Ámbar"],
  "⊙": ["estano", "Estaño"],
  "\uE010": ["piedra", "Piedra"],
  "\uE011": ["cacao", "Cacao"],
  "": ["furioso", "Furioso"],
  "": ["disgustado", "Disgustado"],
  "": ["inquieto", "Inquieto"],
  "": ["neutral", "Neutral"],
  "": ["contento", "Contento"],
  "": ["feliz", "Feliz"],
  "": ["leal", "Leal"],
};
const ICO_RE = new RegExp("[" + Object.keys(ICO_GLIFO).join("").replace(/[\]\\^-]/g, "\\$&") + "]︎?", "g");
/* para COMPROBAR sin «g» (una expresión con «g» recuerda lastIndex y se salta textos) */
const ICO_HAY = new RegExp(ICO_RE.source);
const ICO_C = {};
function icoCanvas(id, k = 2) {
  const key = id + "|" + k;
  if (ICO_C[key]) return ICO_C[key];
  const rows = ICO_SP[id];
  if (!rows) return null;
  const c = document.createElement("canvas");
  c.width = rows[0].length * k;
  c.height = rows.length * k;
  const x = c.getContext("2d");
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++)
      if (row[i] !== "." && ICO_PAL[row[i]]) {
        x.fillStyle = ICO_PAL[row[i]];
        x.fillRect(i * k, j * k, k, k);
      }
  });
  return (ICO_C[key] = c);
}
const ICO_URL = {};
const icoUrl = (id) => ICO_URL[id] || (ICO_URL[id] = icoCanvas(id, 2).toDataURL());
function icoImg(ch) {
  const g = ICO_GLIFO[ch];
  if (!g) return null;
  const im = document.createElement("img");
  im.className = "ico";
  im.src = icoUrl(g[0]);
  im.alt = g[1];
  im.title = g[1];
  im.width = 14;
  im.height = 14;
  return im;
}
/* cambia los caracteres de icono por imágenes en un trozo del documento */
const ICO_NO = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "OPTION", "TITLE", "CANVAS"]);
function icoSustituir(raiz) {
  if (!raiz) return;
  if (raiz.nodeType === 3) return icoTexto(raiz);
  if (raiz.nodeType !== 1 || ICO_NO.has(raiz.tagName)) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && !ICO_NO.has(n.parentElement.tagName) && ICO_HAY.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    }),
    l = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) l.push(n);
  l.forEach(icoTexto);
}
function icoTexto(n) {
  if (!n.parentNode || !ICO_HAY.test(n.data)) return;
  ICO_RE.lastIndex = 0;
  const f = document.createDocumentFragment(),
    t = n.data;
  let i = 0,
    m;
  while ((m = ICO_RE.exec(t))) {
    if (m.index > i) f.appendChild(document.createTextNode(t.slice(i, m.index)));
    f.appendChild(icoImg(m[0][0]));
    i = m.index + m[0].length;
  }
  if (i < t.length) f.appendChild(document.createTextNode(t.slice(i)));
  n.parentNode.replaceChild(f, n);
}
const icoObs = new MutationObserver((ms) => {
  for (const m of ms) {
    if (m.type === "characterData") icoTexto(m.target);
    else for (const n of m.addedNodes) icoSustituir(n);
  }
});
function icoIniciar() {
  icoSustituir(document.body);
  icoObs.observe(document.body, { childList: true, subtree: true, characterData: true });
}
if (document.body) icoIniciar();
else document.addEventListener("DOMContentLoaded", icoIniciar);

/* la insignia de recurso del mapa: el icono dibujado */
if (typeof ifzInsRecurso === "function") {
  const icoIns0 = ifzInsRecurso;
  ifzInsRecurso = function (ic) {
    const g = ICO_GLIFO[String(ic || "")[0]];
    if (!g) return icoIns0.apply(this, arguments);
    const k = "ico:" + g[0];
    let c = IFZ_RECI.get(k);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = 12;
    c.height = 12;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(11,15,18,.82)";
    x.fillRect(1, 0, 10, 12);
    x.fillRect(0, 1, 12, 10);
    x.drawImage(icoCanvas(g[0], 1), 1, 1);
    IFZ_RECI.set(k, c);
    return c;
  };
}
