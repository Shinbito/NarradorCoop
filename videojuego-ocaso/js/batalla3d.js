/* ---------- batalla en 3D (Three.js): vista isométrica ortográfica girable ---------- Sistema 3D
   Sustituye visualmente al lienzo 2D de la batalla táctica (#bmap) por un lienzo WebGL propio (#b3dgl)
   cuando la opción «Vista: 3D» está activa (por defecto si hay WebGL). La simulación no cambia: cada
   fotograma solo se LEE el estado global BT (unidades, efectos, terreno, murallas) de js/batalla.js.
   - Cámara ORTOGRÁFICA con inclinación isométrica fija (30°); solo gira alrededor del eje vertical en
     giro libre (⟲ ⟳ y Q/E a pasos de 22,5°; arrastre con botón derecho o giro con dos dedos, continuo), zoom
     (rueda, pellizco, botones de zoom) y desplazamiento (arrastre del suelo, flechas, dos dedos).
   - «Pixel 3D»: se dibuja a baja resolución y se escala sin suavizado (image-rendering: pixelated).
   - Tropas voxel por clase con InstancedMesh (un solo material para todas las figuras); la animación
     (marcha, carga, melé, tiro, huida, estandartes al viento) va en el sombreador de vértices.
   - La entrada reutiliza la lógica de batalla.js: tapAt, hitAt (vía selección en pantalla), orderGroup,
     toggleSel, canOrder, groupSlots... convirtiendo los toques en casillas por rayos sobre el relieve.
   Sin ganchos en batalla.js: se envuelven drawBattle (bucle de dibujo) y battleAct (botones de zoom).
   Todo lo global lleva el prefijo b3d / B3D_. Documentación: docs/batalla3d.md */

const B3D_EL = (30 * Math.PI) / 180; /* inclinación fija de la cámara (isométrica) */
const B3D_AZ0 = -Math.PI / 4; /* giro inicial: tu línea abajo a la izquierda */
const B3D_S = 0.034; /* casillas por vóxel de las figuras (pequeñas frente a árboles y casas: el campo parece grande) */
const B3D_CAL = {
  baja: { n: "baja", simple: true, px: 3, min: 300, max: 640, sombras: 0, fig: 1800, arboles: 1, lluvia: 0 },
  media: { n: "media", simple: true, px: 2.5, min: 360, max: 820, sombras: 1024, fig: 4000, arboles: 2, lluvia: 260 },
  alta: { n: "alta", px: 2, min: 420, max: 1100, sombras: 2048, fig: 8000, arboles: 2, lluvia: 520 },
};
/* paleta de las figuras y del terreno (claves de una letra en los modelos). F = color del pueblo
   (CIV[f].c), D = color oscuro del pueblo (CIV[f].d): esas dos se tiñen por instancia. */
const B3D_PAL = {
  k: "#211c26", // negro (botas, cascos de caballo)
  h: "#9ea3ad", // metal
  H: "#e2e5ec", // metal brillante
  b: "#e3b48a", // piel
  p: "#6b4a2a", // madera
  n: "#7a4f2c", // cuero
  c: "#8a5a32", // caballo castaño
  C: "#4a3020", // caballo oscuro
  w: "#d8d0c0", // caballo blanco
  e: "#8a8f98", // elefante
  E: "#efe6cf", // marfil
  a: "#c9a46a", // camello, mimbre
  z: "#c08a3e", // bronce
  o: "#f2c14e", // oro
  t: "#ece8dc", // blanco, plumas
  j: "#d9a53a", // piel de jaguar
  g: "#3f8a35", // verde
  G: "#2f6b2a", // verde oscuro
  y: "#58a648", // verde claro
  R: "#8d8a82", // roca
  s: "#7a1c14", // sangre
  F: "#c8402e", // (se tiñe) pueblo
  D: "#6a170e", // (se tiñe) pueblo oscuro
};
const B3D_TERR_PAL = {
  pasto: ["#5a983f", "#62a044", "#4f8a37", "#57923c"],
  bosque: ["#3f7a30", "#3a722c", "#447f34"],
  colina: ["#7c8850", "#8a9658", "#9aa060", "#6f7a47"],
  lecho: ["#3a5a6a", "#2f4f60"],
  vado: ["#8fa37a", "#9aae84", "#a3a585"],
  trigo: ["#c9b458", "#b39a42"],
  arado: ["#8c6e3c", "#7a5e32"],
  tierra: ["#5b4330", "#463326", "#6a4e36"],
  agua: "#2f6fa8",
  aguaVado: "#6fa7c8",
  piedra: "#b7ad9a",
};
/* cielo y luz por hora y clima */
const B3D_CIELO = {
  "al alba": { a: "#33406e", b: "#f0a878", sol: "#ffc890", i: 2.2, el: 18, az: 120 },
  "a media mañana": { a: "#3f74b8", b: "#bcd8ec", sol: "#fff2dc", i: 2.6, el: 52, az: 150 },
  "por la tarde": { a: "#3b3058", b: "#f08a4a", sol: "#ffa860", i: 2.2, el: 22, az: 230 },
};
const B3D_CLIMA = {
  despejado: { k: 1, niebla: 1 },
  lluvia: { k: 0.55, niebla: 0.75, a: "#3e4650", b: "#7d8790" },
  niebla: { k: 0.7, niebla: 0.35, a: "#9aa3a8", b: "#c8cdcf" },
  calor: { k: 1.1, niebla: 0.9, b: "#f0dca0" },
};
/* tipo de tropa → modelo. Las únicas tienen modelo propio (rasgo distintivo); lo desconocido cae a su rol */
const B3D_TIPO = {
  l: "l", i: "i", p: "p", h: "h", a: "a", x: "x", c: "c", k: "k", m: "m",
  ele: "ele", cam: "cam", car: "car", ari: "ari", tor: "tor", cat: "cat",
  com: "com", sif: "sif", esg: "esg", hpa: "hpa", cor: "cor", fca: "fca", inm: "inm", ber: "ber",
  jag: "jag", agu: "agu", bal: "bal", hop: "hop", mac: "mac", atl: "atl", fia: "fia", bos: "bos", kes: "kes",
};
/* escala de cada modelo (las máquinas, una por cada 10 sirvientes, se ven más grandes) */
const B3D_ESC = { ele: 1.15, ari: 1.6, tor: 1.6, cat: 1.5, car: 1.05 };

const B3D = {
  ok: null, // ¿hay WebGL? (null: sin comprobar)
  pref: { vista: null, cal: null, barras: true }, // vista: "3d" | "2d" | null (automática)
  ren: null,
  scene: null,
  bt: null,
  cam: { az: B3D_AZ0, azT: B3D_AZ0, zoom: 1, zoomT: 1, tx: 0, tz: 0, seguir: false },
  uT: { value: 0 },
  us: new Map(),
  t0: 0,
  stats: { fps: 0, fig: 0, dc: 0, tri: 0, frames: 0 },
  drag: null,
  pts: new Map(),
  reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
};
const b3dH = (n) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const b3dColC = new Map();
function b3dCol(hex) {
  let c = b3dColC.get(hex);
  if (!c) {
    c = new THREE.Color(hex);
    b3dColC.set(hex, c);
  }
  return c;
}
const b3dMovil = () => matchMedia("(pointer: coarse)").matches || innerWidth < 700;

/* ======================= preferencias ======================= */
(() => {
  try {
    const s = JSON.parse(localStorage.getItem("ocaso-b3d") || "null");
    if (s && typeof s === "object") Object.assign(B3D.pref, s);
  } catch (_) {}
  if (!B3D_CAL[B3D.pref.cal]) B3D.pref.cal = b3dMovil() ? "media" : "alta";
  if (B3D.pref.vista !== "2d" && B3D.pref.vista !== "3d") B3D.pref.vista = null;
})();
function b3dGuardar() {
  try {
    localStorage.setItem("ocaso-b3d", JSON.stringify(B3D.pref));
  } catch (_) {}
}

/* ======================= modelos voxel ======================= */
/* Cada caja: [x, y, z, ancho, alto, fondo, color, parte, pivoteY, pivoteX] en vóxeles. La figura mira
   hacia +X, +Y arriba, +Z a su derecha. Partes animadas: 1/2 piernas, 3 brazo de tajo, 4/5 patas de
   montura, 6 tela de estandarte, 7 lanza (se baja en la carga y la melé), 8 brazo de tiro,
   9 brazo de catapulta, 10 tronco del ariete. */
function b3dHum(L, o = {}) {
  const X = o.ox || 0,
    Z = o.oz || 0,
    yb = o.yb ?? 4,
    B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x + X, y, z + Z, w, h, d, c, p, py, px + X]),
    cu = o.cuerpo || "F",
    pi = o.piel || "b",
    pn = o.piernas || "D",
    br = o.desnudo ? pi : cu,
    ar = o.arma;
  if (!o.mont) {
    B(-0.5, 0.6, -1.3, 1, yb - 0.6, 0.9, pn, 1, yb, 0);
    B(-0.5, 0, -1.3, 1.4, 0.6, 0.9, "k", 1, yb, 0);
    B(-0.5, 0.6, 0.4, 1, yb - 0.6, 0.9, pn, 2, yb, 0);
    B(-0.5, 0, 0.4, 1.4, 0.6, 0.9, "k", 2, yb, 0);
  } else if (!o.sinPiernas) {
    B(-0.4, yb - 2.7, -2.1, 1, 2.9, 0.7, pn);
    B(-0.4, yb - 2.7, 1.4, 1, 2.9, 0.7, pn);
    B(-0.6, yb - 0.4, -2.1, 1.6, 0.6, 4.2, pn);
  }
  B(-1, yb, -1.5, 2, 4, 3, o.desnudo ? pi : cu);
  B(-1.05, yb, -1.55, 2.1, 0.7, 3.1, o.desnudo ? "D" : "n");
  if (o.peto) B(-1.1, yb + 1.3, -1.6, 2.2, 2.5, 3.2, o.peto);
  if (o.capa) B(-1.6, yb + 0.3, -1.4, 0.5, 3.8, 2.8, o.capa === true ? "D" : o.capa);
  B(-0.9, yb + 4, -0.9, 1.8, 1.8, 1.8, pi);
  const tc = o.tocado;
  if (tc === "pelo" || (!tc && !o.casco)) {
    B(-1, yb + 5.5, -0.95, 1.9, 0.5, 1.9, "n");
    B(-1, yb + 4.5, -0.95, 0.4, 1.2, 1.9, "n");
  } else if (tc === "gorro") {
    B(-1.05, yb + 5.4, -1.05, 2.1, 1.1, 2.1, "c");
    B(-0.6, yb + 6.4, -0.6, 1.2, 0.6, 1.2, "C");
  } else if (tc === "tiara") {
    B(-0.8, yb + 5.4, -0.8, 1.6, 2.2, 1.6, "o");
    B(-0.85, yb + 5.4, -0.85, 1.7, 0.4, 1.7, "D");
  } else if (tc === "oso") {
    B(-1.2, yb + 5.3, -1.1, 2.4, 1, 2.2, "c");
    B(-0.5, yb + 6.3, -1, 0.6, 0.5, 0.5, "c");
    B(-0.5, yb + 6.3, 0.5, 0.6, 0.5, 0.5, "c");
    B(-1.6, yb + 1, -1.4, 0.5, 4.6, 2.8, "c");
    B(0.85, yb + 4, -0.8, 0.3, 0.9, 1.6, "n");
  } else if (tc === "jaguar") {
    B(-1.1, yb + 5, -1.1, 2.4, 1.8, 2.2, "j");
    B(1.1, yb + 4.5, -0.8, 0.6, 0.6, 1.6, "j");
    B(0.2, yb + 6.1, -1.15, 0.5, 0.5, 0.4, "k");
    B(-0.6, yb + 5.4, 0.9, 0.5, 0.5, 0.3, "k");
    B(-0.3, yb + 6.8, -0.9, 0.5, 0.5, 0.5, "j");
    B(-0.3, yb + 6.8, 0.4, 0.5, 0.5, 0.5, "j");
    B(-1.6, yb + 1.2, -1.4, 0.5, 4, 2.8, "j");
  } else if (tc === "aguila") {
    B(-1.1, yb + 5.2, -1.1, 2.2, 1.1, 2.2, "t");
    B(1.1, yb + 5, -0.35, 0.9, 0.6, 0.7, "o");
    B(-1.5, yb + 6.2, -0.3, 1.3, 1.6, 0.6, "t");
  } else if (tc === "plumas") {
    B(-1, yb + 5.5, -1, 2, 0.5, 2, "D");
    B(-0.6, yb + 6, -0.3, 0.5, 2.4, 0.6, "g");
    B(-0.1, yb + 6, -0.3, 0.5, 1.8, 0.6, "o");
  } else if (tc === "panuelo") {
    B(-1.05, yb + 5.4, -1.05, 2.1, 0.8, 2.1, "D");
    B(-1.5, yb + 4.5, -0.3, 0.5, 1.1, 0.6, "D");
  }
  if (o.casco) {
    B(-1, yb + 5.4, -1, 2, 0.9, 2, o.casco);
    B(-1.1, yb + 5.3, -1.1, 2.2, 0.3, 2.2, o.casco);
  }
  if (o.cresta) B(-1.1, yb + 6.2, -0.25, 2.1, 1, 0.5, o.cresta);
  /* brazos */
  const pIzq = ar === "arco" ? 8 : 0,
    pDer = ar === "espada" || ar === "hacha" || ar === "maza" ? 3 : ar === "jabalina" || ar === "ballesta" || ar === "sifon" ? 8 : 0;
  B(-0.4, yb + 1, -2.3, 0.8, 3, 0.8, br, pIzq, yb + 3.6, 0);
  B(-0.4, yb + 1, 1.5, 0.8, 3, 0.8, br, pDer, yb + 3.6, 0);
  /* armas */
  if (ar === "espada") {
    B(0.3, yb + 1.2, 1.55, 3.2, 0.45, 0.45, "H", 3, yb + 3.6, 0);
    B(0.1, yb + 0.9, 1.4, 0.35, 1, 0.75, "o", 3, yb + 3.6, 0);
  } else if (ar === "hacha") {
    B(0.3, yb + 1.2, 1.6, 3, 0.4, 0.4, "p", 3, yb + 3.6, 0);
    B(2.6, yb + 0.6, 1.55, 0.9, 1.6, 0.5, "H", 3, yb + 3.6, 0);
  } else if (ar === "maza") {
    B(0.3, yb + 1.2, 1.6, 2.6, 0.4, 0.4, "p", 3, yb + 3.6, 0);
    B(2.5, yb + 0.8, 1.35, 1.2, 1.2, 1, o.mazaC || "k", 3, yb + 3.6, 0);
  } else if (ar === "lanza") {
    B(0.4, yb - 3.4, 1.65, 0.35, 12.5, 0.35, "p", 7, yb + 1.4, 0.55);
    B(0.33, yb + 9.1, 1.6, 0.5, 1.4, 0.45, "H", 7, yb + 1.4, 0.55);
  } else if (ar === "jabalina") {
    B(0.4, yb - 1, 1.65, 0.3, 8, 0.3, "p", 8, yb + 3.6, 0);
    B(0.35, yb + 7, 1.6, 0.4, 1, 0.4, "H", 8, yb + 3.6, 0);
    B(-1.5, yb + 1, 0.5, 0.3, 6, 0.3, "p");
    B(-1.3, yb + 1, -0.2, 0.3, 6.4, 0.3, "p");
  } else if (ar === "arco") {
    B(1, yb - 0.8, -2.3, 0.4, 6.4, 0.4, "p", 8, yb + 3.6, 0);
    B(0.7, yb - 0.5, -2.25, 0.15, 5.8, 0.15, "t", 8, yb + 3.6, 0);
    B(-1.7, yb + 1.6, 0.2, 0.6, 3.2, 0.9, "n");
    B(-1.6, yb + 4.8, 0.3, 0.4, 0.6, 0.7, "t");
  } else if (ar === "ballesta") {
    B(0.8, yb + 1.8, -0.2, 3, 0.5, 0.5, "p", 8, yb + 3.6, 0);
    B(3.2, yb + 1.7, -1.6, 0.4, 0.5, 3.2, "h", 8, yb + 3.6, 0);
  } else if (ar === "sifon") {
    B(-2.1, yb + 0.4, -1, 1.1, 3.4, 2, "z");
    B(0.5, yb + 1.6, 1.3, 2.6, 0.6, 0.6, "z", 8, yb + 3.6, 0);
    B(3, yb + 1.5, 1.2, 0.5, 0.8, 0.8, "o", 8, yb + 3.6, 0);
  }
  /* escudos (lado izquierdo, delante) */
  const es = o.escudo;
  if (es === "medio") {
    B(0.9, yb - 0.6, -3.1, 0.5, 3.8, 2.6, "D");
    B(1.35, yb + 0.9, -2.2, 0.3, 0.8, 0.8, "h");
  } else if (es === "grande") {
    B(0.9, yb - 1.6, -3.2, 0.5, 5.4, 3, "D");
    B(1.35, yb + 0.8, -2.1, 0.3, 0.9, 0.9, o.bossC || "h");
  } else if (es === "peq") {
    B(0.9, yb + 0.4, -2.9, 0.4, 2.2, 2.2, "D");
  } else if (es === "redondo") {
    B(0.9, yb - 0.3, -3.4, 0.5, 3.4, 3.4, o.escC || "D");
    B(1.35, yb + 1, -2.1, 0.3, 0.8, 0.8, "h");
  } else if (es === "hoplon") {
    B(0.9, yb - 0.8, -3.6, 0.6, 4.2, 4.2, "z");
    B(1.45, yb + 0.9, -1.9, 0.3, 0.8, 0.8, "D");
  }
}
function b3dCaballo(L, o = {}) {
  const X = o.ox || 0,
    Z = o.oz || 0,
    pe = o.pelo || "c",
    cr = o.crin || "C",
    B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x + X, y, z + Z, w, h, d, c, p, py, px + X]);
  B(-3, 4, -1.2, 6.5, 3, 2.4, pe);
  B(2.6, 5.6, -0.8, 1.6, 3.2, 1.6, pe);
  B(3.4, 7.6, -0.7, 2.6, 1.4, 1.4, pe);
  B(5.6, 7.3, -0.6, 0.6, 0.8, 1.2, "k");
  B(3.6, 9, -0.6, 0.4, 0.6, 0.4, pe);
  B(3.6, 9, 0.2, 0.4, 0.6, 0.4, pe);
  B(2.3, 7.2, -0.3, 1, 2.6, 0.6, cr);
  B(-3.8, 4.4, -0.3, 0.9, 3, 0.6, cr);
  for (const [lx, lz, p, pvx] of [
    [2.2, -1.1, 4, 2.6],
    [2.2, 0.3, 5, 2.6],
    [-2.6, -1.1, 5, -2.2],
    [-2.6, 0.3, 4, -2.2],
  ]) {
    B(lx, 0.5, lz, 0.8, 3.8, 0.8, pe, p, 4.3, pvx);
    B(lx, 0, lz, 0.8, 0.5, 0.8, "k", p, 4.3, pvx);
  }
  if (!o.sinSilla) B(-1, 7, -1.3, 2.4, 0.4, 2.6, "D");
  if (o.barda) {
    B(-3.1, 3.4, -1.35, 6.8, 2.6, 2.7, "D");
    B(3.5, 7.9, -0.75, 2.2, 0.8, 1.5, "h");
    B(2.5, 6, -0.85, 1.8, 2.4, 1.7, "h");
  }
}
const B3D_JIN = (o, rider) => (L) => {
  b3dCaballo(L, o);
  b3dHum(L, { mont: true, yb: 7.4, ox: -0.3, ...rider });
};
const B3D_MOD = {
  i: (L) => b3dHum(L, { escudo: "medio", arma: "espada", casco: "h" }),
  l: (L) => b3dHum(L, { escudo: "grande", arma: "lanza", casco: "h" }),
  p: (L) => b3dHum(L, { peto: "h", escudo: "grande", arma: "espada", casco: "H", cresta: "D" }),
  h: (L) => b3dHum(L, { escudo: "peq", arma: "jabalina" }),
  a: (L) => b3dHum(L, { arma: "arco", tocado: "gorro" }),
  x: B3D_JIN({ pelo: "w", crin: "k" }, { arma: "jabalina", escudo: "peq" }),
  c: B3D_JIN({ pelo: "c" }, { arma: "lanza", escudo: "medio", casco: "h" }),
  k: B3D_JIN({ pelo: "C", barda: true }, { peto: "h", arma: "lanza", casco: "H", cresta: "D" }),
  m: B3D_JIN({ pelo: "c" }, { arma: "arco", tocado: "gorro" }),
  /* únicas: la clase base con un rasgo propio */
  com: (L) => b3dHum(L, { peto: "h", escudo: "grande", bossC: "o", arma: "espada", casco: "H", cresta: "o" }),
  sif: (L) => b3dHum(L, { peto: "z", arma: "sifon", casco: "z" }),
  esg: (L) => b3dHum(L, { escudo: "redondo", escC: "n", arma: "lanza", casco: "h", capa: true }),
  hpa: B3D_JIN({ pelo: "C", crin: "k" }, { arma: "arco", tocado: "gorro", capa: "c" }),
  cor: (L) => b3dHum(L, { arma: "espada", tocado: "panuelo", desnudo: true }),
  fca: (L) => b3dHum(L, { arma: "hacha", escudo: "redondo", casco: "h" }),
  inm: (L) => b3dHum(L, { peto: "o", escudo: "grande", arma: "lanza", tocado: "tiara" }),
  ber: (L) => b3dHum(L, { desnudo: true, arma: "hacha", tocado: "oso" }),
  jag: (L) => b3dHum(L, { arma: "maza", mazaC: "p", escudo: "redondo", tocado: "jaguar" }),
  agu: (L) => b3dHum(L, { arma: "jabalina", tocado: "aguila", capa: "t" }),
  bal: (L) => b3dHum(L, { arma: "ballesta", casco: "h", peto: "n" }),
  hop: (L) => b3dHum(L, { escudo: "hoplon", arma: "lanza", casco: "z", cresta: "D" }),
  mac: (L) => b3dHum(L, { arma: "maza", escudo: "peq", casco: "z" }),
  atl: (L) => b3dHum(L, { arma: "jabalina", tocado: "plumas", desnudo: true }),
  fia: (L) => b3dHum(L, { arma: "espada", escudo: "redondo", capa: "g" }),
  bos: (L) => b3dHum(L, { arma: "lanza", escudo: "peq", tocado: "gorro" }),
  kes: B3D_JIN({ pelo: "w", crin: "C", barda: true }, { arma: "arco", peto: "h", casco: "H", cresta: "o" }),
  /* bestias */
  ele: (L) => {
    const B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x, y, z, w, h, d, c, p, py, px]);
    B(-5, 6, -3, 10, 7, 6, "e");
    B(4.5, 8, -2, 3, 4.5, 4, "e");
    B(4, 8.5, -3.8, 1.2, 4, 1.4, "e");
    B(4, 8.5, 2.4, 1.2, 4, 1.4, "e");
    B(7.2, 3, -0.6, 1.2, 6, 1.2, "e");
    B(7, 6, -1.6, 2.5, 0.6, 0.6, "E");
    B(7, 6, 1, 2.5, 0.6, 0.6, "E");
    B(-4, 8.5, -3.1, 7, 3.5, 6.2, "D");
    B(-5.6, 9, -0.3, 0.6, 3, 0.6, "e");
    for (const [lx, lz, p, pvx] of [
      [3, -2.6, 4, 3.8],
      [3, 0.8, 5, 3.8],
      [-4.4, -2.6, 5, -3.6],
      [-4.4, 0.8, 4, -3.6],
    ])
      B(lx, 0, lz, 1.8, 6.5, 1.8, "e", p, 6.5, pvx);
    B(-3, 13, -2.6, 5, 3, 5.2, "F");
    B(-3.2, 17.6, -2.8, 5.4, 0.6, 5.6, "D");
    B(-3, 16, -2.6, 0.5, 1.6, 0.5, "p");
    B(1.5, 16, 2.1, 0.5, 1.6, 0.5, "p");
    b3dHum(L, { mont: true, sinPiernas: true, yb: 14, ox: -0.6, arma: "lanza", casco: "z" });
    b3dHum(L, { mont: true, sinPiernas: true, yb: 7.8, ox: 3.6, piernas: "D", tocado: "panuelo" });
  },
  cam: (L) => {
    const B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x, y, z, w, h, d, c, p, py, px]);
    B(-2.6, 6, -1.1, 5.4, 2.6, 2.2, "a");
    B(-1.6, 8.6, -0.9, 2.2, 1.5, 1.8, "a");
    B(2.4, 6.6, -0.6, 1.4, 1.4, 1.2, "a");
    B(3.2, 7, -0.6, 1.2, 3.6, 1.2, "a");
    B(3.4, 10.4, -0.6, 2.4, 1.2, 1.2, "a");
    B(-3.2, 6.4, -0.3, 0.7, 2, 0.6, "C");
    B(0.4, 8.4, -1.3, 2, 0.5, 2.6, "D");
    for (const [lx, lz, p, pvx] of [
      [1.8, -1, 4, 2.1],
      [1.8, 0.3, 5, 2.1],
      [-2.2, -1, 5, -1.9],
      [-2.2, 0.3, 4, -1.9],
    ])
      B(lx, 0, lz, 0.7, 6.2, 0.7, "a", p, 6.4, pvx);
    b3dHum(L, { mont: true, yb: 8.9, ox: 1, arma: "lanza", tocado: "panuelo", capa: true });
  },
  car: (L) => {
    const B = (x, y, z, w, h, d, c) => L.push([x, y, z, w, h, d, c, 0, 0, 0]);
    b3dCaballo(L, { ox: 4.5, oz: -1.5, pelo: "c", sinSilla: true });
    b3dCaballo(L, { ox: 4.5, oz: 1.5, pelo: "C", sinSilla: true });
    B(0, 3.2, -0.2, 5, 0.4, 0.4, "p");
    B(-3.5, 1.8, -2.2, 3.5, 2.6, 4.4, "F");
    B(-3.5, 4.2, -2.2, 3.5, 0.4, 4.4, "D");
    B(-2.8, 0, -2.8, 2.6, 2.6, 0.5, "p");
    B(-2.8, 0, 2.3, 2.6, 2.6, 0.5, "p");
    B(-1.9, 0.9, -2.9, 0.8, 0.8, 0.7, "k");
    B(-1.9, 0.9, 2.2, 0.8, 0.8, 0.7, "k");
    b3dHum(L, { mont: true, sinPiernas: true, yb: 3.8, ox: -1.8, oz: -0.8, arma: "arco", casco: "z" });
    b3dHum(L, { mont: true, sinPiernas: true, yb: 3.8, ox: -1.6, oz: 1.2, tocado: "panuelo" });
  },
  /* máquinas de asedio */
  ari: (L) => {
    const B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x, y, z, w, h, d, c, p, py, px]);
    B(-5, 1.2, -2.2, 10, 0.8, 4.4, "p");
    for (const x of [-5, 4.2]) for (const z of [-2.2, 1.4]) B(x, 2, z, 0.8, 3.4, 0.8, "p");
    B(-5.4, 5.2, -2.6, 10.8, 0.8, 2.8, "D");
    B(-5.4, 5.2, -0.2, 10.8, 0.8, 2.8, "D");
    B(-5.4, 5.8, -0.6, 10.8, 0.6, 1.2, "n");
    for (const x of [-4, 2.2]) for (const z of [-2.7, 2.2]) B(x, 0, z, 2, 2, 0.5, "k");
    B(-4, 3, -0.5, 10, 1, 1, "n", 10);
    B(6, 2.8, -0.7, 1, 1.4, 1.4, "h", 10);
  },
  tor: (L) => {
    const B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x, y, z, w, h, d, c, p, py, px]);
    B(-3, 1.2, -3, 6, 20, 6, "p");
    B(3, 3, -3.1, 0.4, 12, 6.2, "D");
    B(-3.1, 3, 3, 6.2, 12, 0.3, "D");
    B(-3.1, 3, -3.3, 6.2, 12, 0.3, "D");
    for (let k = 0; k < 3; k++) B(-3.2, 7 + k * 5, -3.2, 6.4, 0.5, 6.4, "n");
    for (const x of [-3, 2]) for (const z of [-3, 2]) B(x, 21.2, z, 1, 1.4, 1, "p");
    B(3.1, 15.5, -1.5, 0.5, 4, 3, "n");
    for (const x of [-2.4, 1.2]) for (const z of [-3.5, 3]) B(x, 0, z, 1.8, 1.8, 0.5, "k");
    B(-0.2, 22.6, -0.2, 0.4, 5, 0.4, "p");
    B(-3.6, 25.4, -0.15, 3.4, 2.2, 0.3, "F", 6, 0, 0);
  },
  cat: (L) => {
    const B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x, y, z, w, h, d, c, p, py, px]);
    B(-3.5, 1, -2, 7, 1, 4, "p");
    B(-0.2, 2, -2, 1, 4.2, 0.8, "p");
    B(-0.2, 2, 1.2, 1, 4.2, 0.8, "p");
    B(-0.4, 6, -2, 1.4, 0.6, 4, "D");
    B(-4.4, 5.1, -0.4, 6, 0.8, 0.8, "n", 9, 5.5, 0.4);
    B(-5.4, 5.6, -0.9, 1.6, 1, 1.8, "k", 9, 5.5, 0.4);
    B(-5.2, 6.4, -0.7, 1.2, 0.8, 1.4, "R", 9, 5.5, 0.4);
    for (const x of [-3, 1.8]) for (const z of [-2.5, 2]) B(x, 0, z, 1.6, 1.6, 0.5, "k");
    b3dHum(L, { ox: -1, oz: -4.2, arma: null, tocado: "pelo" });
    b3dHum(L, { ox: 1.5, oz: 4.2, arma: null, tocado: "gorro" });
  },
  /* caído (se tumba al dibujarlo) */
  cai: (L) => b3dHum(L, { escudo: "medio", casco: "h" }),
  /* estandarte: asta, remate (D: oscuro, oro si es del general) y tela al viento */
  ban: (L) => {
    const B = (x, y, z, w, h, d, c, p = 0, py = 0, px = 0) => L.push([x, y, z, w, h, d, c, p, py, px]);
    B(-0.2, 0, -0.2, 0.4, 21, 0.4, "p");
    B(-0.45, 21, -0.45, 0.9, 0.9, 0.9, "D");
    B(-6.2, 16, -0.15, 6, 4.6, 0.3, "F", 6, 0, 0);
    B(-6.2, 16, -0.2, 6, 0.8, 0.4, "D", 6, 0, 0);
  },
  /* proyectil (flecha) y vegetación (sin animación) */
  fle: (L) => {
    L.push([-4, -0.15, -0.15, 8, 0.3, 0.3, "p", 0, 0, 0]);
    L.push([4, -0.3, -0.3, 1.2, 0.6, 0.6, "h", 0, 0, 0]);
    L.push([-4.4, -0.4, -0.08, 1.6, 0.8, 0.16, "t", 0, 0, 0]);
  },
  pino: (L) => {
    L.push([-0.5, 0, -0.5, 1, 3, 1, "p", 0, 0, 0]);
    L.push([-2.6, 2.5, -2.6, 5.2, 2.6, 5.2, "G", 0, 0, 0]);
    L.push([-1.9, 5, -1.9, 3.8, 2.6, 3.8, "g", 0, 0, 0]);
    L.push([-1.1, 7.4, -1.1, 2.2, 2.2, 2.2, "y", 0, 0, 0]);
  },
  roble: (L) => {
    L.push([-0.6, 0, -0.6, 1.2, 4, 1.2, "p", 0, 0, 0]);
    L.push([-2.6, 3.4, -2.6, 5.2, 3.6, 5.2, "g", 0, 0, 0]);
    L.push([-1.8, 6.8, -1.8, 3.6, 1.4, 3.6, "y", 0, 0, 0]);
    L.push([-3, 4.2, -1.2, 0.6, 2, 2.4, "G", 0, 0, 0]);
  },
};
/* lista de cajas → BufferGeometry con color, máscara de tinte y parte animada */
function b3dGeo(L0, simple) {
  /* detalle reducido (calidad baja y media): fuera las piezas diminutas que no son armas ni estandartes */
  const L = simple ? L0.filter((b) => !(b[3] * b[4] * b[5] < 0.8 && [0, 1, 2, 4, 5].includes(b[7] || 0))) : L0;
  const nv = L.length * 24,
    P = new Float32Array(nv * 3),
    N = new Float32Array(nv * 3),
    C = new Float32Array(nv * 3),
    K = new Float32Array(nv * 4),
    I = nv > 65000 ? new Uint32Array(L.length * 36) : new Uint16Array(L.length * 36);
  let v = 0,
    ii = 0;
  for (const [x, y, z, w, h, d, ck, part, py, px] of L) {
    const bx = new THREE.BoxGeometry(w, h, d),
      bp = bx.attributes.position.array,
      bn = bx.attributes.normal.array,
      bi = bx.index.array,
      col = b3dCol(B3D_PAL[ck] || "#ff00ff"),
      mk = ck === "F" ? 1 : ck === "D" ? 2 : 0;
    for (let k = 0; k < 24; k++) {
      P[(v + k) * 3] = bp[k * 3] + x + w / 2;
      P[(v + k) * 3 + 1] = bp[k * 3 + 1] + y + h / 2;
      P[(v + k) * 3 + 2] = bp[k * 3 + 2] + z + d / 2;
      N[(v + k) * 3] = bn[k * 3];
      N[(v + k) * 3 + 1] = bn[k * 3 + 1];
      N[(v + k) * 3 + 2] = bn[k * 3 + 2];
      C[(v + k) * 3] = col.r;
      C[(v + k) * 3 + 1] = col.g;
      C[(v + k) * 3 + 2] = col.b;
      K[(v + k) * 4] = mk;
      K[(v + k) * 4 + 1] = part || 0;
      K[(v + k) * 4 + 2] = py || 0;
      K[(v + k) * 4 + 3] = px || 0;
    }
    for (let k = 0; k < 36; k++) I[ii++] = bi[k] + v;
    v += 24;
    bx.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
  g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  g.setAttribute("aK", new THREE.BufferAttribute(K, 4));
  g.setIndex(new THREE.BufferAttribute(I, 1));
  return g;
}
function b3dModeloGeo(id, simple) {
  const L = [];
  (B3D_MOD[id] || B3D_MOD.i)(L);
  return b3dGeo(L, simple);
}
const b3dModelo = (t) => B3D_TIPO[t] || (UN[t] && B3D_TIPO[UN[t].rol]) || "i";

/* material único de las figuras: tinte por pueblo y animación en el sombreador de vértices.
   iA = (fase, estado, ritmo, 0) con estado 0 quieto, 1 marcha, 2 melé, 3 tiro, 4 huida, 5 carga */
function b3dMatFiguras() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uT = B3D.uT;
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec4 aK;
attribute vec4 iA;
attribute vec3 iC1;
attribute vec3 iC2;
uniform float uT;
void b3dRot(inout vec3 p, vec2 pv, float a) {
  vec2 q = p.xy - pv; float c = cos(a), s = sin(a);
  p.xy = vec2(q.x * c - q.y * s, q.x * s + q.y * c) + pv;
}`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  float st = iA.y, pr = aK.y;
  float t = uT * iA.z + iA.x;
  vec2 pv = vec2(aK.w, aK.z);
  bool anda = (st > 0.5 && st < 1.5) || st > 3.5;
  bool mele = st > 1.5 && st < 2.5, tiro = st > 2.5 && st < 3.5, huye = st > 3.5 && st < 4.5, carga = st > 4.5;
  float fr = st > 3.5 ? 13.0 : 8.0;
  float amp = carga ? 0.7 : huye ? 0.8 : anda ? 0.5 : mele ? 0.12 : 0.0;
  if (pr > 0.5 && pr < 2.5) b3dRot(transformed, pv, sin(t * fr + (pr > 1.5 ? 3.1416 : 0.0)) * amp);
  else if (pr > 3.5 && pr < 5.5) b3dRot(transformed, pv, sin(t * fr + (pr > 4.5 ? 3.1416 : 0.0)) * amp * 0.9);
  else if (pr > 2.5 && pr < 3.5) b3dRot(transformed, pv, mele ? 1.1 * max(0.0, sin(t * 9.0)) : huye ? 0.6 : 0.0);
  else if (pr > 6.5 && pr < 7.5) b3dRot(transformed, pv, mele ? -1.25 + 0.2 * sin(t * 11.0) : carga ? -1.3 : huye ? 0.6 : 0.0);
  else if (pr > 7.5 && pr < 8.5) b3dRot(transformed, pv, tiro ? 0.6 + 0.5 * sin(t * 4.0) : 0.0);
  else if (pr > 8.5 && pr < 9.5) b3dRot(transformed, pv, tiro ? -1.8 * max(0.0, sin(t * 2.4)) : 0.0);
  else if (pr > 9.5 && pr < 10.5) transformed.x += mele ? max(0.0, sin(t * 3.0)) * 2.0 : 0.0;
  else if (pr > 5.5 && pr < 6.5) transformed.z += sin(uT * 5.0 + iA.x + transformed.x * 0.9) * 0.14 * max(0.0, pv.x - transformed.x);
  if (anda && pr < 5.5) transformed.y += abs(sin(t * fr)) * 0.35;
  if (mele && pr < 5.5) transformed.x += sin(t * 7.0) * 0.3;
}`,
      )
      .replace(
        "#include <color_vertex>",
        `#include <color_vertex>
if (aK.x > 0.5) vColor.rgb = aK.x < 1.5 ? iC1 : iC2;`,
      );
  };
  m.customProgramCacheKey = () => "b3d-fig-1";
  return m;
}

/* conjunto de figuras de un modelo (InstancedMesh con atributos por instancia) */
function b3dPool(geo, mat, cap, sombra) {
  cap = Math.max(4, cap | 0);
  const g = geo,
    iA = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4),
    i1 = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3),
    i2 = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
  iA.setUsage(THREE.DynamicDrawUsage);
  i1.setUsage(THREE.DynamicDrawUsage);
  i2.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute("iA", iA);
  g.setAttribute("iC1", i1);
  g.setAttribute("iC2", i2);
  const mesh = new THREE.InstancedMesh(g, mat, cap);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = !!sombra;
  mesh.receiveShadow = false;
  mesh.count = 0;
  mesh.renderOrder = 10;
  return { mesh, cap, n: 0, m: mesh.instanceMatrix.array, a: iA.array, c1: i1.array, c2: i2.array };
}
/* añade una figura de pie mirando hacia (dx, dz) (vector unitario en el plano) */
function b3dPon(P, x, y, z, dx, dz, s, ph, st, sp, c1, c2) {
  if (P.n >= P.cap) return;
  const i = P.n++,
    m = P.m,
    o = i * 16;
  m[o] = dx * s;
  m[o + 1] = 0;
  m[o + 2] = dz * s;
  m[o + 3] = 0;
  m[o + 4] = 0;
  m[o + 5] = s;
  m[o + 6] = 0;
  m[o + 7] = 0;
  m[o + 8] = -dz * s;
  m[o + 9] = 0;
  m[o + 10] = dx * s;
  m[o + 11] = 0;
  m[o + 12] = x;
  m[o + 13] = y;
  m[o + 14] = z;
  m[o + 15] = 1;
  b3dAttr(P, i, ph, st, sp, c1, c2);
}
function b3dAttr(P, i, ph, st, sp, c1, c2) {
  P.a[i * 4] = ph;
  P.a[i * 4 + 1] = st;
  P.a[i * 4 + 2] = sp;
  P.c1[i * 3] = c1.r;
  P.c1[i * 3 + 1] = c1.g;
  P.c1[i * 3 + 2] = c1.b;
  P.c2[i * 3] = c2.r;
  P.c2[i * 3 + 1] = c2.g;
  P.c2[i * 3 + 2] = c2.b;
}
function b3dCierra(P) {
  P.mesh.count = P.n;
  P.mesh.instanceMatrix.needsUpdate = true;
  const g = P.mesh.geometry.attributes;
  g.iA.needsUpdate = true;
  g.iC1.needsUpdate = true;
  g.iC2.needsUpdate = true;
}

/* ======================= DOM: lienzos, barra de vista ======================= */
const B3D_AYUDA =
  "Rueda o pellizco: zoom · arrastra el terreno: desplazar · ⟲ ⟳, Q/E, botón derecho o dos dedos girando: girar libremente";
function b3dDom() {
  if (B3D.wrap) return;
  const bm = document.querySelector("#battle .bmain"),
    sc = $("bscroll");
  if (!bm || !sc) return;
  const w = document.createElement("div");
  w.id = "b3dwrap";
  w.setAttribute("role", "application");
  w.setAttribute("aria-label", "Campo de batalla en 3D");
  w.tabIndex = 0;
  w.innerHTML = '<canvas id="b3dgl"></canvas><canvas id="b3dhud" aria-hidden="true"></canvas>';
  bm.insertBefore(w, sc);
  const bar = document.createElement("div");
  bar.className = "btns b3d-bar";
  bar.id = "b3dbar";
  bar.innerHTML =
    '<button class="zb" data-b3d="vista" aria-pressed="true" title="Cambiar entre la vista 3D y la clásica">Vista: 3D</button>' +
    '<button class="zb b3d-s" data-b3d="izq" title="Girar la vista (Q; mantén el botón derecho o gira dos dedos para girar libremente)" aria-label="Girar la vista a la izquierda">⟲</button>' +
    '<button class="zb b3d-s" data-b3d="der" title="Girar la vista (E; mantén el botón derecho o gira dos dedos para girar libremente)" aria-label="Girar la vista a la derecha">⟳</button>' +
    '<button class="zb b3d-s" data-b3d="reset" title="Vista inicial (R)">Reiniciar vista</button>' +
    '<button class="zb b3d-s" data-b3d="seguir" aria-pressed="false" title="La cámara sigue a la unidad elegida (F)">Seguir unidad</button>' +
    '<button class="zb b3d-s" data-b3d="barras" aria-pressed="true" title="Cifras y barras de moral sobre las unidades">Barras</button>' +
    '<button class="zb b3d-s" data-b3d="cal" title="Calidad gráfica: sombras, resolución y número de figuras">Calidad</button>';
  bm.insertBefore(bar, sc.nextSibling);
  B3D.wrap = w;
  B3D.gl = $("b3dgl");
  B3D.hud = $("b3dhud");
  B3D.hx = B3D.hud.getContext("2d");
  B3D.bar = bar;
  B3D.ayuda = [...bm.querySelectorAll(".btns span.stats")].pop() || null;
  if (B3D.ayuda) B3D.ayuda0 = B3D.ayuda.textContent;
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-b3d]");
    if (b && !b.disabled) b3dBoton(b.dataset.b3d);
  });
  b3dEntrada(w);
  new ResizeObserver(() => (B3D.tam = null)).observe(w);
  new MutationObserver(() => {
    if (!$("battle").classList.contains("show")) b3dDesmontar();
    b3dBarra();
  }).observe($("battle"), { attributes: true, attributeFilter: ["class"] });
  b3dBarra();
}
function b3dBarra() {
  if (!B3D.bar) return;
  const on = b3dActivo(),
      q = (k) => B3D.bar.querySelector(`[data-b3d="${k}"]`);
  $("battle").classList.toggle("b3d-on", on);
  const v = q("vista");
  v.textContent = on ? "Vista: 3D" : "Vista: clásica";
  v.setAttribute("aria-pressed", on ? "true" : "false");
  v.disabled = B3D.ok === false;
  if (B3D.ok === false) v.title = "Tu navegador no ofrece WebGL: se usa la vista clásica";
  else if (B3D.soft && !B3D.pref.vista) v.title = "Sin aceleración gráfica: si va lenta, baja la calidad o pasa a la vista clásica";
  q("seguir").setAttribute("aria-pressed", B3D.cam.seguir ? "true" : "false");
  q("barras").setAttribute("aria-pressed", B3D.pref.barras ? "true" : "false");
  q("cal").textContent = "Calidad: " + B3D_CAL[B3D.pref.cal].n;
  if (B3D.ayuda)
    B3D.ayuda.textContent = !on
      ? B3D.ayuda0
      : matchMedia("(pointer: coarse)").matches
        ? "Pellizca: zoom · arrastra el terreno: desplazar · ⟲ ⟳ o gira dos dedos: girar libremente"
        : B3D_AYUDA;
  const z = $("bzl");
  if (z && on) z.textContent = Math.round(B3D.cam.zoomT * 100) + "%";
  else if (z && typeof bzoom === "number") z.textContent = Math.round(bzoom * 100) + "%";
}
function b3dBoton(k) {
  const C = B3D.cam;
  if (k === "vista") {
    B3D.pref.vista = b3dVista() === "3d" ? "2d" : "3d";
    b3dGuardar();
    if (B3D.pref.vista === "2d") b3dDesmontar();
    else b3dWebGL();
  } else if (k === "izq") b3dGira(-1);
  else if (k === "der") b3dGira(1);
  else if (k === "reset") b3dReinicia();
  else if (k === "seguir") {
    C.seguir = !C.seguir;
    if (C.seguir && C.zoomT < 1.8) C.zoomT = 2.2;
    /* en un campo grande, ir directamente a la unidad (luego la cámara la sigue suave) */
    const u = C.seguir && BT ? bU(BT.sel) : null;
    if (u && act(u) && u.x >= 0) {
      C.tx = u.x - BW / 2;
      C.tz = u.y - BH / 2;
      b3dCamara();
    }
  } else if (k === "barras") {
    B3D.pref.barras = !B3D.pref.barras;
    b3dGuardar();
  } else if (k === "cal") {
    const l = ["baja", "media", "alta"];
    B3D.pref.cal = l[(l.indexOf(B3D.pref.cal) + 1) % 3];
    b3dGuardar();
    if (B3D.scene) b3dDesmontar();
  }
  b3dBarra();
}
/* ======================= cámara ======================= */
/* lado del campo del jugador (O, E, N, S) y su dirección: la vista inicial pone tu línea abajo a la izquierda */
const B3D_DIRL = { O: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
function b3dMiLado() {
  const s = (BT && BT.mios && BT.mios[0]) ?? 0;
  return typeof cmbLadoDe === "function" && BT ? cmbLadoDe(s) : "O";
}
function b3dAz0() {
  const [x, z] = B3D_DIRL[b3dMiLado()] || B3D_DIRL.O,
    c = Math.SQRT1_2,
    s = -Math.SQRT1_2;
  return Math.atan2(x * c - z * s, x * s + z * c);
}
/* giro libre: los botones y Q/E giran 22,5° con transición; los gestos, lo que se mueva el dedo */
const B3D_PASO_GIRO = Math.PI / 8;
function b3dGira(d) {
  const C = B3D.cam;
  C.azT += d * B3D_PASO_GIRO;
  if (B3D.reduce) C.az = C.azT;
}
/* giro continuo (radianes), sin transición: sigue al ratón o a los dedos */
function b3dGiraLibre(a) {
  const C = B3D.cam;
  C.azT += a;
  C.az = C.azT;
  b3dCamara();
}
function b3dReinicia() {
  const C = B3D.cam,
    m = b3dMovil();
  const a0 = B3D.az0 ?? B3D_AZ0,
    dl = B3D_DIRL[BT ? b3dMiLado() : "O"] || B3D_DIRL.O;
  C.azT = a0 + Math.round((C.az - a0) / (2 * Math.PI)) * 2 * Math.PI;
  C.zoomT = m ? 1.5 : 1;
  C.tx = m ? dl[0] * 6 : 0;
  C.tz = m ? dl[1] * 4 : 0;
  C.seguir = false;
  if (B3D.reduce) {
    C.az = C.azT;
    C.zoom = C.zoomT;
  }
}
function b3dZoom(f, cx, cy) {
  const C = B3D.cam,
    a = cx != null ? b3dCampo(cx, cy, true) : null;
  C.zoomT = clamp(C.zoomT * f, 0.8, 8);
  if (a) {
    /* conserva el punto bajo el cursor */
    const z0 = C.zoom;
    C.zoom = C.zoomT;
    b3dCamara();
    const b = b3dCampo(cx, cy, true);
    C.zoom = z0;
    if (b) {
      C.tx += a.x - b.x;
      C.tz += a.y - b.y;
    }
    b3dCamara();
  }
  b3dBarra();
}
function b3dCamara() {
  const C = B3D.cam,
    cam = B3D.camera;
  if (!cam) return;
  C.tx = clamp(C.tx, -BW / 2, BW / 2);
  C.tz = clamp(C.tz, -BH / 2, BH / 2);
  const d = 90,
    ty = 0.3;
  cam.position.set(
    C.tx + d * Math.cos(B3D_EL) * Math.sin(C.az),
    ty + d * Math.sin(B3D_EL),
    C.tz + d * Math.cos(B3D_EL) * Math.cos(C.az),
  );
  cam.up.set(0, 1, 0);
  cam.lookAt(C.tx, ty, C.tz);
  const asp = B3D.tamW / Math.max(1, B3D.tamH),
    R = Math.hypot(BW / 2, BH / 2),
    hy = Math.max(R * Math.sin(B3D_EL) + 1.4, R / asp) * 1.02;
  cam.top = hy;
  cam.bottom = -hy;
  cam.right = hy * asp;
  cam.left = -hy * asp;
  cam.zoom = C.zoom;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}
function b3dCamPaso(dt) {
  const C = B3D.cam,
    k = B3D.reduce ? 1 : Math.min(1, dt * 9);
  C.az += (C.azT - C.az) * k;
  if (Math.abs(C.azT - C.az) < 1e-4) C.az = C.azT;
  C.zoom += (C.zoomT - C.zoom) * k;
  if (C.seguir && BT) {
    const u = bU(BT.sel);
    if (u && act(u) && u.x >= 0) {
      C.tx += (u.x - BW / 2 - C.tx) * k * 0.5;
      C.tz += (u.y - BH / 2 - C.tz) * k * 0.5;
    }
  }
  b3dCamara();
}
/* desplazamiento por píxeles de pantalla (arrastre): el suelo sigue al dedo */
function b3dPan(dx, dy) {
  const cam = B3D.camera,
    C = B3D.cam;
  if (!cam) return;
  const wpp = (cam.right - cam.left) / cam.zoom / Math.max(1, B3D.tamW),
    e = cam.matrixWorld.elements,
    rx = e[0],
    rz = e[2],
    ux = e[4],
    uz = e[6],
    ul = Math.hypot(ux, uz) || 1;
  C.tx -= rx * dx * wpp - (ux / ul) * (dy * wpp) / Math.sin(B3D_EL);
  C.tz -= rz * dx * wpp - (uz / ul) * (dy * wpp) / Math.sin(B3D_EL);
  b3dCamara();
}

/* ======================= relieve ======================= */
const B3D_K = 2; /* subdivisiones de la malla por casilla */
function b3dRelieve(terr, rnd) {
  const nx = BW * B3D_K + 1,
    ny = BH * B3D_K + 1,
    h = new Float32Array(nx * ny),
    T = (x, y) => terr[clamp(y, 0, BH - 1)][clamp(x, 0, BW - 1)],
    nz = typeof noise === "function" ? noise(rnd, 12, 8) : () => 0.5;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const fx = i / B3D_K,
        fy = j / B3D_K;
      let hc = 0,
        hw = 0,
        rc = 0,
        vc = 0;
      for (let ty = Math.floor(fy) - 2; ty <= Math.floor(fy) + 1; ty++)
        for (let tx = Math.floor(fx) - 2; tx <= Math.floor(fx) + 1; tx++) {
          const d = Math.hypot(tx + 0.5 - fx, ty + 0.5 - fy),
            t = T(tx, ty);
          const w = Math.max(0, 1.7 - d);
          hw += w;
          if (t === 2) hc += w;
          if (d < 0.95) {
            if (t === 3) rc = Math.max(rc, 1 - d / 0.95);
            if (t === 4) vc = Math.max(vc, 1 - d / 0.95);
          }
        }
      const hl = hw ? hc / hw : 0,
        ru = (nz((fx / BW) * 12, (fy / BH) * 8) - 0.5) * 0.08;
      h[j * nx + i] = Math.pow(hl, 0.8) * 1.05 + ru * (1 + hl) - rc * 0.42 - vc * 0.14;
    }
  return { h, nx, ny };
}
/* altura del suelo en casillas del campo (bilineal) */
function b3dAlt(x, y) {
  const Rl = B3D.rel;
  if (!Rl) return 0;
  const fx = clamp(x, 0, BW) * B3D_K,
    fy = clamp(y, 0, BH) * B3D_K,
    i = Math.min(Rl.nx - 2, Math.floor(fx)),
    j = Math.min(Rl.ny - 2, Math.floor(fy)),
    a = fx - i,
    b = fy - j,
    H = Rl.h,
    n = Rl.nx;
  return (
    H[j * n + i] * (1 - a) * (1 - b) + H[j * n + i + 1] * a * (1 - b) + H[(j + 1) * n + i] * (1 - a) * b + H[(j + 1) * n + i + 1] * a * b
  );
}
/* ---------- paisaje fuera del campo ---------- */
const b3dMargen = () => (B3D_CAL[B3D.pref.cal] && B3D_CAL[B3D.pref.cal].simple ? 16 : 26);
/* distancia (casillas) al rectángulo del campo */
const b3dFueraD = (x, y) => Math.hypot(x - clamp(x, 0, BW), y - clamp(y, 0, BH));
/* altura fuera del campo: en el borde, la del campo (sin costura); lejos, lomas suaves */
function b3dFueraH(x, y) {
  const d = b3dFueraD(x, y);
  if (d <= 1e-6) return b3dAlt(x, y);
  const he = b3dAlt(clamp(x, 0, BW), clamp(y, 0, BH)),
    f = Math.max(0, 1 - d / 9),
    n = 0.5 + 0.5 * Math.sin(x * 0.23 + 1.3) * Math.cos(y * 0.19 + 0.7) + 0.3 * Math.sin((x - y) * 0.09 + 2) + 0.12 * Math.sin(x * 0.7 + y * 0.5);
  /* hacia el final del margen, las lomas bajan a 0: ahí empieza el llano infinito (b3dLlano) */
  return (he * f + Math.min(1, d / 7) * Math.max(0, n) * 1.25) * clamp((b3dMargen() - d) / 5, 0, 1);
}
/* llano enorme bajo todo, del color del pasto: tapa las esquinas y se pierde en la bruma */
function b3dLlano() {
  const g = new THREE.PlaneGeometry(1200, 1200),
    c = b3dCol(B3D_TERR_PAL.pasto[0]).clone().multiplyScalar(0.8),
    m = new THREE.MeshLambertMaterial({ color: c });
  g.rotateX(-Math.PI / 2);
  const me = new THREE.Mesh(g, m);
  me.position.y = -0.02;
  me.receiveShadow = false;
  return { me, g, m };
}
const b3dFueraBosque = (x, y) => Math.sin(x * 0.13 + 0.4) * Math.cos(y * 0.16 + 1.1) + 0.5 * Math.sin((x + y) * 0.071) + 0.25 * Math.sin(x * 0.41 - y * 0.37) > 0.5;
/* línea roja: el margen del campo donde se pelea (una cinta sobre el suelo) */
function b3dBordeRojo() {
  const pos = [],
    e = 0.09,
    h = (x, y) => b3dAlt(x, y) + 0.035,
    seg = (x0, y0, x1, y1, nx, ny) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * B3D_K));
      for (let k = 0; k < n; k++) {
        const ax = x0 + ((x1 - x0) * k) / n,
          ay = y0 + ((y1 - y0) * k) / n,
          bx = x0 + ((x1 - x0) * (k + 1)) / n,
          by = y0 + ((y1 - y0) * (k + 1)) / n,
          A = [ax - nx * e, h(ax, ay), ay - ny * e],
          B = [bx - nx * e, h(bx, by), by - ny * e],
          C = [bx + nx * e, h(bx, by), by + ny * e],
          D = [ax + nx * e, h(ax, ay), ay + ny * e];
        for (const v of [A, D, B, B, D, C]) pos.push(v[0] - BW / 2, v[1], v[2] - BH / 2);
      }
    };
  seg(0, 0, BW, 0, 0, 1);
  seg(BW, 0, BW, BH, 1, 0);
  seg(BW, BH, 0, BH, 0, 1);
  seg(0, BH, 0, 0, 1, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.MeshBasicMaterial({ color: "#d8392b", side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false });
  const me = new THREE.Mesh(g, m);
  me.renderOrder = 3;
  return { me, g, m };
}
/* malla del suelo: triángulos de color plano (aire low-poly) con faldón de tierra en los bordes */
function b3dSuelo(terr, rnd, campos) {
  const Rl = B3D.rel,
    pos = [],
    col = [],
    tri = (p, c) => {
      for (const v of p) pos.push(v[0] - BW / 2, v[1], v[2] - BH / 2);
      for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
    },
    hv = (i, j) => Rl.h[j * Rl.nx + i],
    pick = (l, n) => b3dCol(l[Math.floor(b3dH(n) * l.length) % l.length]);
  for (let j = 0; j < Rl.ny - 1; j++)
    for (let i = 0; i < Rl.nx - 1; i++) {
      const tx = Math.floor(i / B3D_K),
        ty = Math.floor(j / B3D_K),
        t = terr[ty][tx],
        x0 = i / B3D_K,
        x1 = (i + 1) / B3D_K,
        y0 = j / B3D_K,
        y1 = (j + 1) / B3D_K,
        a = [x0, hv(i, j), y0],
        b = [x1, hv(i + 1, j), y0],
        c = [x1, hv(i + 1, j + 1), y1],
        d = [x0, hv(i, j + 1), y1],
        hm = (a[1] + b[1] + c[1] + d[1]) / 4,
        n = i * 7919 + j * 104729;
      let c1, c2;
      const cp = campos[ty * BW + tx];
      if (t === 3) c1 = c2 = pick(B3D_TERR_PAL.lecho, n);
      else if (t === 4) c1 = c2 = pick(B3D_TERR_PAL.vado, n);
      else if (t === 1) {
        c1 = pick(B3D_TERR_PAL.bosque, n);
        c2 = pick(B3D_TERR_PAL.bosque, n + 1);
      } else if (cp) {
        c1 = c2 = b3dCol(B3D_TERR_PAL[cp][j % 2]);
      } else if (hm > 0.18) {
        const l = B3D_TERR_PAL.colina;
        c1 = b3dCol(l[clamp(Math.floor(hm * 3 + b3dH(n) * 1.2), 0, l.length - 1)]);
        c2 = b3dCol(l[clamp(Math.floor(hm * 3 + b3dH(n + 3) * 1.2), 0, l.length - 1)]);
      } else {
        c1 = pick(B3D_TERR_PAL.pasto, n);
        c2 = pick(B3D_TERR_PAL.pasto, n + 5);
      }
      if ((i + j) % 2) {
        tri([a, d, b], c1);
        tri([b, d, c], c2);
      } else {
        tri([a, d, c], c1);
        tri([a, c, b], c2);
      }
    }
  /* PAISAJE ALREDEDOR (antes, un faldón de tierra: el campo parecía una maqueta flotando): el terreno sigue
     B3D_MARGEN() casillas más allá del campo, con lomas suaves y manchas de bosque que se funden con la bruma
     del horizonte. El borde del campo jugable lo marca la línea roja (b3dBordeRojo). */
  const M = b3dMargen(),
    st = 1 / B3D_K;
  for (let y = -M; y < BH + M; y += st)
    for (let x = -M; x < BW + M; x += st) {
      if (x >= 0 && x < BW - 1e-6 && y >= 0 && y < BH - 1e-6) continue;
      const P = (X, Y) => [X, b3dFueraH(X, Y), Y],
        a = P(x, y),
        b = P(x + st, y),
        c = P(x + st, y + st),
        d = P(x, y + st),
        n = Math.round((x + M) * 7919 + (y + M) * 104729),
        dd = b3dFueraD(x + st / 2, y + st / 2),
        k = 1 - Math.min(0.22, dd * 0.009),
        bos = dd > 0.6 && b3dFueraBosque(x, y),
        l = bos ? B3D_TERR_PAL.bosque : B3D_TERR_PAL.pasto,
        c1 = pick(l, n).clone().multiplyScalar(k),
        c2 = pick(l, n + 5).clone().multiplyScalar(k);
      if ((Math.round(x * B3D_K) + Math.round(y * B3D_K)) % 2) {
        tri([a, d, b], c1);
        tri([b, d, c], c2);
      } else {
        tri([a, d, c], c1);
        tri([a, c, b], c2);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/* ======================= escena ======================= */
function b3dWebGL() {
  if (B3D.ren) return true;
  if (B3D.ok === false || typeof THREE === "undefined" || !THREE.WebGLRenderer) {
    B3D.ok = false;
    return false;
  }
  b3dDom();
  if (!B3D.gl) return false;
  /* sondeo propio: si no hay contexto, a la vista clásica sin errores en la consola */
  const at = { alpha: true, depth: true, stencil: false, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" };
  let ctx = null;
  try {
    ctx = B3D.gl.getContext("webgl2", at) || B3D.gl.getContext("webgl", at);
  } catch (_) {}
  if (!ctx) {
    B3D.ok = false;
    b3dBarra();
    return false;
  }
  try {
    const r = new THREE.WebGLRenderer({ canvas: B3D.gl, context: ctx, antialias: false, alpha: true, powerPreference: "high-performance" });
    r.setPixelRatio(1);
    r.setClearColor(0x000000, 0);
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    B3D.ren = r;
    B3D.ok = true;
    /* WebGL por software (SwiftShader, llvmpipe…): la vista automática es la clásica */
    try {
      const gl = r.getContext(),
        ex = gl.getExtension("WEBGL_debug_renderer_info");
      B3D.gpu = String(gl.getParameter(ex ? ex.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
    } catch (_) {
      B3D.gpu = "";
    }
    B3D.soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(B3D.gpu);
    /* sin aceleración gráfica, la isométrica empieza en calidad baja (si el jugador no eligió otra) */
    if (B3D.soft && !B3D.pref.vista && !/"calidad"/.test(localStorage.getItem("ocaso-opc") || "")) B3D.pref.cal = "baja";
    B3D.gl.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      B3D.perdido = true;
      b3dDesmontar();
      b3dBarra();
    });
    B3D.gl.addEventListener("webglcontextrestored", () => {
      B3D.perdido = false;
      b3dBarra();
    });
  } catch (e) {
    console.warn("Batalla 3D: sin WebGL, se usa la vista clásica.", e && e.message);
    B3D.ok = false;
    b3dBarra();
    return false;
  }
  return true;
}
/* vista efectiva: la elegida por el jugador o, si no eligió, 3D salvo que no haya GPU (WebGL por software) */
/* la batalla es isométrica (3D) por defecto, también sin aceleración gráfica (entonces con calidad baja);
   la vista clásica desde arriba solo si el jugador la elige */
const b3dVista = () => B3D.pref.vista || "3d";
const b3dActivo = () => !!BT && b3dVista() === "3d" && B3D.ok !== false && !B3D.perdido && typeof THREE !== "undefined";

function b3dConstruir() {
  b3dDesmontar();
  const cal = typeof b3dCal === "function" ? b3dCal() : B3D_CAL[B3D.pref.cal],
    S = new THREE.Scene(),
    terr = BT.terr,
    E = BT.env || { clima: "despejado", hora: "a media mañana" };
  let sem = 7;
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) sem = (sem * 31 + terr[y][x] + 1) >>> 0;
  const rnd = mul(sem),
    dis = [];
  B3D.scene = S;
  B3D.bt = BT;
  B3D.us = new Map();
  B3D.dis = dis;
  B3D.cal = cal;
  B3D.rel = b3dRelieve(terr, rnd);
  B3D.camera = new THREE.OrthographicCamera(-20, 20, 12, -12, 1, 300);
  B3D.camera.userData.b3d = 1;
  B3D.az0 = b3dAz0();
  B3D.cam.az = B3D.cam.azT = B3D.az0;
  b3dReinicia();
  B3D.cam.az = B3D.cam.azT;
  B3D.cam.zoom = B3D.cam.zoomT;
  /* cielo (degradado CSS del contenedor), niebla y luces */
  const cie = B3D_CIELO[E.hora] || B3D_CIELO["a media mañana"],
    cli = B3D_CLIMA[E.clima] || B3D_CLIMA.despejado,
    ca = cli.a || cie.a,
    cb = cli.b || cie.b;
  B3D.wrap.style.background = `linear-gradient(180deg, ${ca} 0%, ${cb} 70%, ${cb} 100%)`;
  S.fog = typeof OPC !== "undefined" && OPC.v.niebla3d === false ? new THREE.Fog(cb, 140, 260) : new THREE.Fog(cb, 70 + 30 * cli.niebla, 90 + 70 * cli.niebla);
  const hemi = new THREE.HemisphereLight(cb, "#3a3020", 1.1 * cli.k);
  S.add(hemi);
  const sol = new THREE.DirectionalLight(cie.sol, cie.i * cli.k),
    el = (cie.el * Math.PI) / 180,
    az = (cie.az * Math.PI) / 180;
  sol.position.set(Math.cos(el) * Math.sin(az) * 60, Math.sin(el) * 60, Math.cos(el) * Math.cos(az) * 60);
  if (cal.sombras && E.clima !== "niebla") {
    B3D.ren.shadowMap.enabled = true;
    sol.castShadow = true;
    sol.shadow.mapSize.set(cal.sombras, cal.sombras);
    const sc = sol.shadow.camera;
    /* la sombra cubre todo el campo (80×50) */
    const rs = Math.hypot(BW, BH) / 2 + 4;
    sc.left = -rs;
    sc.right = rs;
    sc.top = rs;
    sc.bottom = -rs;
    sc.near = 1;
    sc.far = 260;
    sol.shadow.bias = -0.0008;
    sol.shadow.normalBias = 0.02;
    sol.shadow.radius = cal.suaves === false ? 0 : 2;
  } else B3D.ren.shadowMap.enabled = false;
  S.add(sol);
  B3D.sombras = sol.castShadow;
  /* campos de labor: dos o tres parcelas en terreno llano */
  const campos = new Array(BW * BH).fill(null);
  for (let k = 0, n = 0; k < 40 && n < 3; k++) {
    const w = 2 + Math.floor(rnd() * 3),
      h = 2 + Math.floor(rnd() * 2),
      x0 = 11 + Math.floor(rnd() * (BW - 24)),
      y0 = Math.floor(rnd() * (BH - h));
    let ok = true;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (terr[y][x] !== 0) ok = false;
    if (!ok) continue;
    const tp = rnd() < 0.6 ? "trigo" : "arado";
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) campos[y * BW + x] = tp;
    n++;
  }
  /* suelo */
  const gs = b3dSuelo(terr, rnd, campos),
    ms = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
    suelo = new THREE.Mesh(gs, ms);
  suelo.receiveShadow = true;
  S.add(suelo);
  dis.push(gs, ms);
  {
    const br = b3dBordeRojo(),
      ll = b3dLlano();
    S.add(br.me, ll.me);
    dis.push(br.g, br.m, ll.g, ll.m);
  }
  /* agua del río y los vados */
  const wp = [],
    wc = [];
  for (let y = 0; y < BH; y++)
    for (let x = 0; x < BW; x++) {
      const t = terr[y][x];
      if (t !== 3 && t !== 4) continue;
      const c = b3dCol(t === 3 ? B3D_TERR_PAL.agua : B3D_TERR_PAL.aguaVado),
        yy = -0.08,
        X = x - BW / 2,
        Z = y - BH / 2,
        e = 0.15;
      const q = [
        [X - e, yy, Z - e],
        [X - e, yy, Z + 1 + e],
        [X + 1 + e, yy, Z - e],
        [X + 1 + e, yy, Z - e],
        [X - e, yy, Z + 1 + e],
        [X + 1 + e, yy, Z + 1 + e],
      ];
      for (const v of q) {
        wp.push(...v);
        wc.push(c.r, c.g, c.b);
      }
    }
  if (wp.length) {
    const gw = new THREE.BufferGeometry();
    gw.setAttribute("position", new THREE.Float32BufferAttribute(wp, 3));
    gw.setAttribute("color", new THREE.Float32BufferAttribute(wc, 3));
    gw.computeVertexNormals();
    const mw = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.78, depthWrite: false });
    const agua = new THREE.Mesh(gw, mw);
    agua.renderOrder = 2;
    S.add(agua);
    B3D.agua = mw;
    dis.push(gw, mw);
  }
  /* árboles, rocas y piedras de los vados */
  const tA = [],
    tB = [],
    rocas = [];
  for (let y = 0; y < BH; y++)
    for (let x = 0; x < BW; x++) {
      const t = terr[y][x];
      if (t === 1)
        for (let k = 0; k < cal.arboles; k++) {
          const px = x + 0.15 + rnd() * 0.7,
            py = y + 0.15 + rnd() * 0.7;
          (rnd() < 0.55 ? tA : tB).push([px, py, 0.13 * (0.8 + rnd() * 0.4), rnd() * 6.28, 0.82 + rnd() * 0.3]); /* ~3 veces un soldado */
        }
      if (t === 2 && rnd() < 0.3) rocas.push([x + rnd(), y + rnd(), 0.12 + rnd() * 0.16, rnd() * 6.28]);
      if (t === 4) for (let k = 0; k < 2; k++) rocas.push([x + rnd(), y + rnd(), 0.08 + rnd() * 0.08, rnd() * 6.28]);
      if (t === 0 && rnd() < 0.015) rocas.push([x + rnd(), y + rnd(), 0.08 + rnd() * 0.1, rnd() * 6.28]);
    }
  /* bosques del paisaje de alrededor */
  {
    const M = b3dMargen();
    for (let y = -M; y < BH + M; y++)
      for (let x = -M; x < BW + M; x++) {
        const d = b3dFueraD(x + 0.5, y + 0.5);
        if (d < 1.2 || !b3dFueraBosque(x, y)) continue;
        for (let k = 0; k < cal.arboles; k++) {
          if (rnd() < 0.25) continue;
          const px = x + 0.15 + rnd() * 0.7,
            py = y + 0.15 + rnd() * 0.7;
          (rnd() < 0.6 ? tA : tB).push([px, py, 0.13 * (0.8 + rnd() * 0.4), rnd() * 6.28, 0.78 + rnd() * 0.25, 1]);
        }
      }
  }
  const mVeg = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  dis.push(mVeg);
  const M4 = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    V = new THREE.Vector3(),
    Vs = new THREE.Vector3(),
    Y = new THREE.Vector3(0, 1, 0),
    tint = new THREE.Color();
  for (const [id, l] of [
    ["pino", tA],
    ["roble", tB],
  ]) {
    if (!l.length) continue;
    const g = b3dModeloGeo(id),
      im = new THREE.InstancedMesh(g, mVeg, l.length);
    l.forEach(([x, y, s, a, k, fuera], i) => {
      Q.setFromAxisAngle(Y, a);
      M4.compose(V.set(x - BW / 2, (fuera ? b3dFueraH(x, y) : b3dAlt(x, y)) - 0.05, y - BH / 2), Q, Vs.set(s, s * (0.9 + b3dH(i) * 0.3), s));
      im.setMatrixAt(i, M4);
      im.setColorAt(i, tint.setRGB(k, k * (0.95 + b3dH(i + 9) * 0.1), k));
    });
    im.castShadow = B3D.sombras;
    S.add(im);
    dis.push(g);
  }
  if (rocas.length) {
    const g = new THREE.BoxGeometry(1, 1, 1),
      m = new THREE.MeshLambertMaterial({ color: B3D_PAL.R, flatShading: true }),
      im = new THREE.InstancedMesh(g, m, rocas.length);
    rocas.forEach(([x, y, s, a], i) => {
      Q.setFromAxisAngle(Y, a);
      M4.compose(V.set(x - BW / 2, b3dAlt(x, y) + s * 0.2, y - BH / 2), Q, Vs.set(s * 1.4, s, s));
      im.setMatrixAt(i, M4);
      const k = 0.8 + b3dH(i * 3) * 0.35;
      im.setColorAt(i, tint.setRGB(k, k, k * 0.95));
    });
    im.castShadow = B3D.sombras;
    S.add(im);
    dis.push(g, m);
  }
  /* murallas */
  B3D.muro = BT.muro ? b3dMuralla(S, dis, rnd) : null;
  /* zonas de despliegue por lado (O, E, N, S), pegadas al relieve: la tuya clara, aliadas verdosas, enemigas rojizas */
  {
    B3D.zonas = [];
    /* las zonas salen de cmbZonaRects (batalla.js): franjas junto al borde o, en un asedio, la plaza para la
       guarnición y el anillo de alrededor para los atacantes */
    const N = BT.N || 2,
      vistas = new Set();
    for (let q = 0; q < N; q++) {
      const rs = cmbZonaRects(q),
        mia = (BT.mios || [0]).includes(q),
        key = JSON.stringify(rs) + mia;
      if (vistas.has(key)) continue;
      vistas.add(key);
      const ali = cmbBnd(q) === (BT.bandoYo ?? 0),
        [hex, op] = mia ? ["#ffffff", 0.18] : ali ? ["#78dcc8", 0.14] : ["#ff503c", 0.14];
      for (const [x0, z0, w, h] of rs) {
        if (w <= 0 || h <= 0) continue;
        const g = new THREE.PlaneGeometry(w, h, Math.ceil(w * 2), Math.ceil(h * 2));
        g.rotateX(-Math.PI / 2);
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i) + x0 + w / 2,
            z = p.getZ(i) + z0 + h / 2;
          p.setXYZ(i, x - BW / 2, b3dAlt(x, z) + 0.03, z - BH / 2);
        }
        const m = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, fog: false }),
          z = new THREE.Mesh(g, m);
        z.renderOrder = 4;
        S.add(z);
        B3D.zonas.push(z);
        dis.push(g, m);
      }
    }
  }
  /* figuras: un InstancedMesh por modelo presente; un solo material */
  const mf = b3dMatFiguras();
  dis.push(mf);
  B3D.mf = mf;
  const cnt = {};
  let tot = 0;
  for (const u of BT.units) {
    const mo = b3dModelo(u.t),
      n = typeof cmbSlots === "function" ? cmbSlots(u).nf0 : cmbFig(u, u.n0);
    cnt[mo] = (cnt[mo] || 0) + n;
    tot += n;
  }
  B3D.ratio = Math.min(1, cal.fig / Math.max(1, tot));
  B3D.pools = {};
  for (const mo in cnt) {
    const g = b3dModeloGeo(mo, cal.simple);
    B3D.pools[mo] = b3dPool(g, mf, Math.ceil(cnt[mo] * B3D.ratio) + 16, B3D.sombras);
    S.add(B3D.pools[mo].mesh);
    dis.push(g);
  }
  for (const [mo, cap, so] of [
    ["ban", BT.units.length + 24, B3D.sombras],
    ["cai", 620, false],
    ["banC", 80, false],
  ]) {
    const g = b3dModeloGeo(mo === "banC" ? "ban" : mo, cal.simple);
    B3D.pools[mo] = b3dPool(g, mf, cap, so);
    S.add(B3D.pools[mo].mesh);
    dis.push(g);
  }
  B3D.cai = { n: -1, d0: null };
  /* flechas */
  {
    const g = b3dModeloGeo("fle"),
      m = new THREE.MeshBasicMaterial({ vertexColors: true }),
      im = new THREE.InstancedMesh(g, m, 500);
    im.count = 0;
    im.frustumCulled = false;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.renderOrder = 11;
    S.add(im);
    B3D.fle = im;
    dis.push(g, m);
  }
  /* anillos de selección / destino (encima del suelo, por debajo de las figuras) y sombras simples */
  {
    const g = new THREE.RingGeometry(0.84, 1, 40);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({ color: "#ffffff", depthTest: false, depthWrite: false, fog: false });
    const im = new THREE.InstancedMesh(g, m, 400);
    im.count = 0;
    im.frustumCulled = false;
    im.renderOrder = 5;
    im.setColorAt(0, new THREE.Color());
    S.add(im);
    B3D.ani = im;
    dis.push(g, m);
    const gb = new THREE.CircleGeometry(1, 20);
    gb.rotateX(-Math.PI / 2);
    const mb = new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.28, depthWrite: false });
    const ib = new THREE.InstancedMesh(gb, mb, BT.units.length + 8);
    ib.count = 0;
    ib.frustumCulled = false;
    ib.renderOrder = 3;
    ib.visible = !B3D.sombras;
    S.add(ib);
    B3D.blob = ib;
    dis.push(gb, mb);
  }
  /* líneas: órdenes, alcances, flecha de arrastre */
  {
    const n = 6000,
      g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    const m = new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, depthWrite: false, fog: false }),
      ls = new THREE.LineSegments(g, m);
    ls.frustumCulled = false;
    ls.renderOrder = 6;
    S.add(ls);
    B3D.lin = { g, n, k: 0, p: g.attributes.position.array, c: g.attributes.color.array };
    dis.push(g, m);
  }
  /* lluvia */
  B3D.lluvia = null;
  if (E.clima === "lluvia" && cal.lluvia && !B3D.reduce) {
    const n = cal.lluvia,
      g = new THREE.BufferGeometry(),
      p = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * (BW + 8),
        z = (rnd() - 0.5) * (BH + 8),
        y = rnd() * 14;
      p.set([x, y, z, x + 0.05, y + 0.5, z + 0.05], i * 6);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.LineBasicMaterial({ color: "#c8d4e0", transparent: true, opacity: 0.5, depthWrite: false });
    const ls = new THREE.LineSegments(g, m);
    ls.frustumCulled = false;
    S.add(ls);
    B3D.lluvia = { g, p, n };
    dis.push(g, m);
  }
  B3D.tam = null;
  B3D.t0 = performance.now();
}
/* murallas: la plaza en el CENTRO del campo (cmbRecinto en batalla.js: x0..x1, y0..y1, puertas, torres y el
   tramo de la brecha en el lienzo del frente), cuatro lienzos con almenas, torres, puertas abiertas, la ciudad
   dentro, daños, brecha y escombros. Muros sin x0 (espejos de versiones antiguas): no se dibujan. */
function b3dMuralla(S, dis, rnd) {
  const M = BT.muro;
  if (!M || M.x0 == null) return null;
  const bl = [],
    torres = [],
    puertas = [],
    add = (x, y, z, sx, sy, sz, tipo, br, col) => bl.push({ x, y, z, sx, sy, sz, tipo, th: rnd(), br, col: col || 1 }),
    almenas = (x, z, enX, br) => {
      for (const s of [-1, 1])
        for (const o of [-0.25, 0.25])
          if (enX) add(x + s * 0.25, 1.16, z + o, 0.1, 0.24, 0.24, "alm", br);
          else add(x + o, 1.16, z + s * 0.25, 0.24, 0.24, 0.1, "alm", br);
    },
    enPuerta = (l, v) => M.puertas.some((q) => q.l === l && Math.abs((l === "N" || l === "S" ? q.x : q.y) - v) <= 0.55);
  /* los cuatro lienzos, una pieza por casilla */
  for (const l of ["N", "S", "O", "E"]) {
    const horiz = l === "N" || l === "S",
      a0 = horiz ? M.x0 : M.y0,
      n = Math.round(horiz ? M.x1 - M.x0 : M.y1 - M.y0),
      fija = l === "N" ? M.y0 : l === "S" ? M.y1 : l === "O" ? M.x0 : M.x1,
      out = CMB_NOR[l];
    for (let k = 0; k < n; k++) {
      const v = a0 + k + 0.5,
        wx = (horiz ? v : fija) - BW / 2,
        wz = (horiz ? fija : v) - BH / 2,
        br = typeof cmbEnBrecha === "function" ? cmbEnBrecha(M, l, v) : false;
      if (enPuerta(l, v)) {
        if (horiz) {
          add(wx, 1.0, wz, 1, 0.3, 0.62, "dintel", br);
          puertas.push([wx, wz - out[1] * 0.5, 1, v < (M.cx ?? v) ? 1 : -1]);
        } else {
          add(wx, 1.0, wz, 0.62, 0.3, 1, "dintel", br);
          puertas.push([wx - out[0] * 0.5, wz, 0, v < (M.cy ?? v) ? 1 : -1]);
        }
        continue;
      }
      if (horiz) {
        add(wx, 0.3, wz, 1, 0.6, 0.6, "base", br);
        add(wx, 0.82, wz, 1, 0.44, 0.6, "alto", br);
        almenas(wx, wz, false, br);
      } else {
        add(wx, 0.3, wz, 0.6, 0.6, 1, "base", br);
        add(wx, 0.82, wz, 0.6, 0.44, 1, "alto", br);
        almenas(wx, wz, true, br);
      }
    }
  }
  for (const t of M.torres) torres.push([t.x - BW / 2, t.y - BH / 2, typeof cmbEnBrecha === "function" ? cmbEnBrecha(M, t.l, t.l === "N" || t.l === "S" ? t.x : t.y) : false]);
  for (const [tx, tz, br] of torres) {
    add(tx, 0.8, tz, 1.0, 1.6, 1.0, "torre", br, 0.92);
    for (const s of [-1, 1])
      for (const o of [-0.33, 0.33]) {
        add(tx + s * 0.42, 1.72, tz + o, 0.16, 0.26, 0.26, "almT", br);
        add(tx + o, 1.72, tz + s * 0.42, 0.26, 0.26, 0.16, "almT", br);
      }
  }
  /* escombros: al pie del lienzo del frente (con el daño) y el montón de la brecha */
  const esc = [],
    fr = M.frente || "O",
    on = CMB_NOR[fr] || [-1, 0],
    hz = fr === "N" || fr === "S",
    fija = fr === "N" ? M.y0 : fr === "S" ? M.y1 : fr === "O" ? M.x0 : M.x1,
    A0 = hz ? M.x0 : M.y0,
    A1 = hz ? M.x1 : M.y1,
    pz = (v, o) => (hz ? [v - BW / 2, fija + on[1] * o - BH / 2] : [fija + on[0] * o - BW / 2, v - BH / 2]);
  for (let k = 0; k < 140; k++) {
    const [x, z] = pz(A0 + rnd() * (A1 - A0), 0.4 + rnd() * 1.1);
    esc.push({ x, z, s: 0.08 + rnd() * 0.16, th: rnd(), br: false, a: rnd() * 6.28 });
  }
  if (M.brecha)
    for (let k = 0; k < 90; k++) {
      const [x, z] = pz(M.brecha.a + rnd() * (M.brecha.b - M.brecha.a), (rnd() - 0.5) * 1.6);
      esc.push({ x, z, s: 0.1 + rnd() * 0.2, th: 0, br: true, a: rnd() * 6.28 });
    }
  const g = new THREE.BoxGeometry(1, 1, 1),
    m = new THREE.MeshLambertMaterial({ color: B3D_TERR_PAL.piedra, flatShading: true }),
    im = new THREE.InstancedMesh(g, m, bl.length + esc.length),
    c = new THREE.Color();
  im.castShadow = B3D.sombras;
  im.receiveShadow = true;
  bl.forEach((b, i) => {
    const k = (0.86 + b3dH(i * 7) * 0.2) * b.col;
    im.setColorAt(i, c.setRGB(k, k * 0.98, k * 0.94));
  });
  esc.forEach((o, i) => {
    const k = 0.7 + b3dH(i * 5) * 0.3;
    im.setColorAt(bl.length + i, c.setRGB(k, k * 0.95, k * 0.88));
  });
  S.add(im);
  /* hojas de las puertas, abiertas hacia dentro */
  const gp = new THREE.BoxGeometry(1, 1, 1),
    mp = new THREE.MeshLambertMaterial({ color: B3D_PAL.p }),
    hojas = [];
  for (const [x, z, enX, s] of puertas) {
    const d = new THREE.Mesh(gp, mp);
    d.scale.set(0.08, 0.8, 0.5);
    d.position.set(x, 0.4, z);
    d.rotation.y = enX ? 0 : 1.2 * s;
    if (enX) d.scale.set(0.5, 0.8, 0.08);
    d.castShadow = B3D.sombras;
    S.add(d);
    hojas.push(d);
  }
  dis.push(g, m, gp, mp);
  /* la ciudad dentro del recinto: casas con tejado a cuatro aguas y alguna torre (a escala: mucho más
     grandes que los soldados; las casas, a la altura del adarve) */
  {
    const casas = [];
    for (let zz = M.y0 + 1.6; zz < M.y1 - 1.2; zz += 1.9)
      for (let xx = M.x0 + 1.5; xx < M.x1 - 1.2; xx += 1.7) {
        if (rnd() < 0.42) continue;
        const torre = rnd() < 0.08,
          w = torre ? 0.7 : 0.77 + rnd() * 0.56,
          d = torre ? 0.7 : 0.77 + rnd() * 0.56,
          h = torre ? 2 + rnd() * 0.6 : 0.55 + rnd() * 0.4,
          x = xx + (rnd() - 0.5) * 0.3,
          z = zz + (rnd() - 0.5) * 0.3;
        casas.push({ x: x - BW / 2, z: z - BH / 2, y: b3dAlt(x, z), w, d, h, torre, k: rnd() });
      }
    if (casas.length) {
      const gc = new THREE.BoxGeometry(1, 1, 1),
        mc = new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }),
        ic = new THREE.InstancedMesh(gc, mc, casas.length),
        gt = new THREE.ConeGeometry(0.72, 1, 4, 1);
      gt.rotateY(Math.PI / 4);
      const mt = new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }),
        it = new THREE.InstancedMesh(gt, mt, casas.length),
        M4 = new THREE.Matrix4(),
        paredes = ["#d8c8a8", "#c8b090", "#e0d4bc", "#b89f80"],
        tejas = ["#a84a2a", "#8a3a22", "#b85a34", "#6f6a74"];
      casas.forEach((o, i) => {
        M4.makeScale(o.w, o.h, o.d);
        M4.setPosition(o.x, o.y + o.h / 2, o.z);
        ic.setMatrixAt(i, M4);
        ic.setColorAt(i, c.set(o.torre ? B3D_TERR_PAL.piedra : paredes[Math.floor(o.k * 4)]));
        const rh = o.torre ? 0.7 : 0.45;
        M4.makeScale(o.w * 1.05, rh, o.d * 1.05);
        M4.setPosition(o.x, o.y + o.h + rh / 2, o.z);
        it.setMatrixAt(i, M4);
        it.setColorAt(i, c.set(tejas[Math.floor(b3dH(i * 3) * 4)]));
      });
      ic.castShadow = it.castShadow = B3D.sombras;
      ic.receiveShadow = true;
      S.add(ic, it);
      dis.push(gc, mc, gt, mt);
    }
  }
  return { im, bl, esc, k: -1, rota: null, hojas, fuera: on[0] || 1, torres: torres.map(([x, z]) => [x, z]) };
}
function b3dMurallaPaso(M) {
  const W = B3D.muro;
  if (!W || !M) return;
  const k = Math.round(clamp(M.hp / M.hp0, 0, 1) * 50) / 50,
    rota = !!M.rota;
  if (k === W.k && rota === W.rota) return;
  W.k = k;
  W.rota = rota;
  const M4 = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    V = new THREE.Vector3(),
    Sv = new THREE.Vector3(),
    Y = new THREE.Vector3(0, 1, 0);
  W.bl.forEach((b, i) => {
    const brecha = rota && b.br;
    let vis = true,
      sy = b.sy,
      y = b.y;
    if (b.tipo === "alto") vis = !brecha && k > b.th * 0.6;
    else if (b.tipo === "alm") vis = !brecha && k > 0.15 + b.th * 0.8;
    else if (b.tipo === "almT") vis = !brecha && k > b.th * 0.5;
    else if (b.tipo === "torre") {
      if (brecha || k < b.th * 0.35) {
        sy = b.sy * (brecha ? 0.3 : 0.6);
        y = sy / 2;
      }
    } else if (b.tipo === "base" && brecha) {
      sy = 0.15;
      y = 0.07;
    } else if (b.tipo === "dintel") vis = !brecha && k > 0.1;
    if (vis) M4.compose(V.set(b.x, y, b.z), Q.identity(), Sv.set(b.sx, sy, b.sz));
    else M4.makeScale(0, 0, 0);
    W.im.setMatrixAt(i, M4);
  });
  W.esc.forEach((e, j) => {
    const vis = e.br ? rota : 1 - k > e.th;
    if (vis) {
      Q.setFromAxisAngle(Y, e.a);
      M4.compose(V.set(e.x, b3dAlt(e.x + BW / 2, e.z + BH / 2) + e.s * 0.4, e.z), Q, Sv.set(e.s * 1.3, e.s, e.s));
    } else M4.makeScale(0, 0, 0);
    W.im.setMatrixAt(W.bl.length + j, M4);
  });
  W.im.instanceMatrix.needsUpdate = true;
  for (const d of W.hojas) d.visible = k > 0.3;
}
function b3dDesmontar() {
  B3D.drag = null;
  B3D.pts.clear();
  if (!B3D.scene) return;
  for (const o of B3D.dis || []) o.dispose && o.dispose();
  B3D.scene.traverse((o) => {
    if (o.isInstancedMesh && o.dispose) o.dispose();
  });
  B3D.scene.clear();
  B3D.scene = null;
  B3D.bt = null;
  B3D.pools = null;
  B3D.muro = null;
  B3D.lluvia = null;
  B3D.rel = null;
  B3D.dis = [];
  B3D.us = new Map();
  if (B3D.ren) {
    B3D.ren.renderLists.dispose();
    B3D.ren.clear();
  }
}

/* ======================= cada fotograma ======================= */
function b3dTam() {
  const w = B3D.wrap,
    cw = Math.max(1, w.clientWidth),
    ch = Math.max(1, w.clientHeight),
    cal = B3D.cal || B3D_CAL.media,
    rw = Math.round(clamp(cw / cal.px, Math.min(cal.min, cw), cal.max)),
    rh = Math.max(1, Math.round((rw * ch) / cw)),
    dpr = Math.min(2, devicePixelRatio || 1);
  B3D.ren.setSize(rw, rh, false);
  B3D.hud.width = Math.round(cw * dpr);
  B3D.hud.height = Math.round(ch * dpr);
  B3D.tamW = cw;
  B3D.tamH = ch;
  B3D.dpr = dpr;
  B3D.tam = [rw, rh];
}
function b3dFrame(now) {
  if (document.hidden) return;
  if (!B3D.scene || B3D.bt !== BT) b3dConstruir();
  if (!B3D.tam) b3dTam();
  const dt = Math.min(0.1, Math.max(0, (now - (B3D.tPrev || now)) / 1000));
  B3D.tPrev = now;
  B3D.uT.value += dt * (BT.paused ? 0.35 : Math.min(2, BT.speed || 1));
  b3dCamPaso(dt);
  B3D.zonas.forEach((z) => (z.visible = BT.phase === "deploy"));
  const R = cmbRender();
  b3dMurallaPaso(R.campo.muro);
  const fig = b3dTropas(now, dt, R);
  b3dCaidos(R.muertos);
  b3dFlechas(now);
  b3dGuias(now);
  if (B3D.lluvia) {
    const L = B3D.lluvia,
      p = L.p;
    for (let i = 0; i < L.n; i++) {
      const o = i * 6;
      let y = p[o + 1] - dt * 16;
      if (y < -0.5) y += 14;
      p[o + 1] = y;
      p[o + 4] = y + 0.5;
    }
    L.g.attributes.position.needsUpdate = true;
  }
  if (B3D.agua) B3D.agua.opacity = 0.74 + Math.sin(B3D.uT.value * 1.3) * 0.04;
  B3D.ren.render(B3D.scene, B3D.camera);
  b3dHud(now);
  /* como drawBattle: los efectos caducan a los 900 ms */
  BT.fx = BT.fx.filter((f) => now - f.t0 < 900);
  const S = B3D.stats,
    inf = B3D.ren.info.render;
  S.frames++;
  S.fig = fig;
  S.dc = inf.calls;
  S.tri = inf.triangles;
  if (dt > 0) S.fps = S.fps ? S.fps * 0.95 + (1 / dt) * 0.05 : 1 / dt;
}
const b3dAng = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/* rumbo según el eje y el sentido de cara de la simulación (eje 'y' en los asaltos por el norte o el sur) */
const b3dCara = (eje, cara) => (eje === "y" ? (cara < 0 ? -Math.PI / 2 : Math.PI / 2) : cara < 0 ? Math.PI : 0);
const B3D_EST = { quieto: 0, marcha: 1, combate: 2, disparo: 3, huida: 4 };
/* estado visual de una unidad (r = su entrada de cmbRender()): posición dibujada con inercia, rumbo suavizado */
function b3dEstU(r, u, now, dt) {
  let e = B3D.us.get(r.id);
  if (!e) {
    e = { vx: r.x, vy: r.y, a: b3dCara(r.eje, r.cara), routT: 0 };
    B3D.us.set(r.id, e);
  }
  const px = e.vx,
    py = e.vy;
  if (Math.hypot(e.vx - r.x, e.vy - r.y) > 1.6 || BT.phase === "deploy" || B3D.reduce) {
    e.vx = r.x;
    e.vy = r.y;
  } else {
    const k = 1 - Math.exp(-dt * 7);
    e.vx += (r.x - e.vx) * k;
    e.vy += (r.y - e.vy) * k;
  }
  let ta = null;
  const mx = e.vx - px,
    my = e.vy - py;
  if ((r.estado === "marcha" || r.estado === "huida") && Math.hypot(mx, my) > 0.0004) ta = Math.atan2(my, mx);
  else if (r.estado !== "huida") {
    const o = r.obj != null ? bU(r.obj) : null,
      en = o && act(o) ? o : u && BT.phase !== "deploy" ? nearest(u) : null;
    ta = en && Math.hypot(en.x - r.x, en.y - r.y) < 12 ? Math.atan2(en.y - r.y, en.x - r.x) : b3dCara(r.eje, r.cara);
  }
  if (ta != null) {
    const d = b3dAng(ta - e.a);
    e.a += B3D.reduce ? d : d * Math.min(1, dt * 5);
  }
  e.routT = r.estado === "huida" ? e.routT + dt : Math.max(0, e.routT - dt * 2);
  e.st = r.estado === "marcha" && r.carga ? 5 : B3D_EST[r.estado] || 0;
  return e;
}
/* tropas: una figura por hueco vivo de la formación (cmbRender().unidades[].huecos sin las caídas) */
function b3dTropas(now, dt, R) {
  const P = B3D.pools,
    ratio = B3D.ratio;
  for (const k in P) if (k !== "cai" && k !== "banC") P[k].n = 0;
  const ban = P.ban,
    blob = B3D.blob,
    M4 = B3D._m4 || (B3D._m4 = new THREE.Matrix4()),
    cai = B3D._cai || (B3D._cai = new Set()),
    gens = {};
  for (const ej of R.ejercitos) gens[ej.lado] = !!(ej.general && ej.general.ok);
  let nb = 0,
    tot = 0;
  B3D.vis = B3D.vis || new Map();
  B3D.vis.clear();
  for (const r of R.unidades) {
    const u = bU(r.id),
      e = b3dEstU(r, u, now, dt),
      mo = b3dModelo(r.t),
      pool = P[mo];
    B3D.vis.set(r.id, e);
    if (!pool) continue;
    /* en el adarve: mirando hacia fuera del lienzo, en fila a lo largo de él, sobre el paseo de ronda */
    const M = BT.muro,
      arriba = !!(r.adarve && M && M.x0 != null),
      nor = arriba ? CMB_NOR[cmbPuntoMuro(M, { x: e.vx, y: e.vy }).l] : null;
    const civ = CIV[r.f] || CIV[0],
      c1 = b3dCol(civ.c),
      c2 = b3dCol(civ.d),
      dx = nor ? nor[0] : Math.cos(e.a),
      dy = nor ? nor[1] : Math.sin(e.a),
      px = -dy,
      py = dx,
      H = r.huecos,
      prof = cmbCab(r.t) ? 1.5 : 1.25,
      /* con dos figuras por hombre (BT.dens) las figuras se achican un poco para caber en la formación */
      s = B3D_S * (B3D_ESC[mo] || 1) * (u && typeof cmbDens === "function" && cmbDens(u) > 1 ? 0.82 : 1),
      sc = Math.min(1.6, e.routT * 0.45),
      ritmo = BT.paused ? 0.3 : 1;
    cai.clear();
    for (const k of r.caidas) cai.add(k);
    let dmax = 0;
    for (let k = 0; k < H.length; k++) {
      if (cai.has(k)) continue;
      if (ratio < 1 && b3dH(r.id * 31 + k) > ratio) continue;
      const h1 = b3dH(r.id * 977 + k),
        h2 = b3dH(r.id * 613 + k * 7 + 1);
      let lat = H[k][0] * (arriba ? 1.35 : 1) + (h1 - 0.5) * 0.04,
        dep = arriba ? (h2 - 0.5) * 0.18 : -H[k][1] * prof + (h2 - 0.5) * 0.04,
        fx = dx,
        fy = dy;
      if (-dep > dmax) dmax = -dep;
      if (sc > 0) {
        lat += (h1 - 0.5) * 2 * sc * 1.4;
        dep += (h2 - 0.5) * 2 * sc;
        const a = e.a + (h2 - 0.5) * 1.2;
        fx = Math.cos(a);
        fy = Math.sin(a);
      }
      const wx = clamp(e.vx + dx * dep + px * lat, -1, BW + 1),
        wy = clamp(e.vy + dy * dep + py * lat, -1, BH + 1),
        /* en la melé pelean las primeras filas; las de atrás esperan */
        st = e.st === 2 && H[k][1] > 0.15 ? 0 : e.st;
      b3dPon(pool, wx - BW / 2, arriba ? Math.max(1.04, b3dAlt(wx, wy)) : b3dAlt(wx, wy), wy - BH / 2, fx, fy, s, h1 * 6.283, st, (0.85 + h2 * 0.3) * ritmo, c1, c2);
      tot++;
    }
    /* estandarte detrás del centro: oro si va el general; blanco si huyen */
    const gen = r.gen && gens[r.lado],
      bdep = -dmax - 0.12,
      bx = e.vx + dx * bdep,
      by = e.vy + dy * bdep,
      bs = B3D_S * (cmbCab(r.t) || mo === "ele" ? 1.3 : 1) * (gen ? 1.3 : 1);
    b3dPon(
      ban,
      bx - BW / 2,
      b3dAlt(bx, by),
      by - BH / 2,
      dx,
      dy,
      bs,
      r.id * 1.7,
      0,
      1,
      r.estado === "huida" ? b3dCol("#f4f4f4") : c1,
      gen ? b3dCol("#f2c14e") : c2,
    );
    if (blob.visible && nb < blob.instanceMatrix.count) {
      const rr = (u ? rad(u) : 0.8) * 0.95;
      M4.makeScale(rr, 1, rr * 0.8);
      M4.setPosition(e.vx - BW / 2, b3dAlt(e.vx, e.vy) + 0.02, e.vy - BH / 2);
      blob.setMatrixAt(nb++, M4);
    }
  }
  /* banderas del defensor en las torres de la muralla */
  if (B3D.muro) {
    const W = B3D.muro,
      ej = R.ejercitos.find((o) => o.lado === BT.def),
      fd = CIV[ej ? ej.f : BT.fd] || CIV[0];
    W.torres.forEach(([x, z], i) => {
      if (i < 16) b3dPon(ban, x, 1.6, z, -W.fuera, 0, B3D_S * 0.9, i * 3.1, 0, 1, b3dCol(fd.c), b3dCol(fd.d));
    });
  }
  for (const k in P) if (k !== "cai" && k !== "banC") b3dCierra(P[k]);
  if (blob.visible) {
    blob.count = nb;
    blob.instanceMatrix.needsUpdate = true;
  }
  return tot;
}
/* posición dibujada de una unidad (con inercia) o la simulada */
const b3dPos = (u) => {
  const e = B3D.vis && B3D.vis.get(u.id);
  return e ? { x: e.vx, y: e.vy } : { x: u.x, y: u.y };
};
/* caídos: los de BT.dead (coordenadas en píxeles del campo 2D) tumbados en el suelo; std = estandarte caído */
function b3dCaidos(D) {
  D = D || [];
  const C = B3D.cai,
    P = B3D.pools.cai,
    PB = B3D.pools.banC;
  if (D.length === C.n && D[0] === C.d0) return;
  const desde = D[0] === C.d0 && D.length > C.n && C.n >= 0 ? C.n : 0;
  if (!desde) P.n = PB.n = 0;
  const M4 = B3D._m4c || (B3D._m4c = new THREE.Matrix4()),
    Q = new THREE.Quaternion(),
    Eu = new THREE.Euler(),
    V = new THREE.Vector3(),
    Sv = new THREE.Vector3(B3D_S, B3D_S, B3D_S),
    osc = b3dCol("#3a3436");
  for (let i = desde; i < D.length; i++) {
    const d = D[i],
      x = d.x / TS + 0.05,
      y = d.y / TS,
      h = b3dH(i * 13 + Math.round(d.x * 7 + d.y)),
      civ = CIV[d.f] || CIV[0],
      Pd = d.std ? PB : P;
    if (Pd.n >= Pd.cap) continue;
    Eu.set((Math.PI / 2) * (h < 0.5 || d.std ? 1 : -1), h * 6.283, 0, "YXZ");
    Q.setFromEuler(Eu);
    M4.compose(V.set(x - BW / 2, b3dAlt(x, y) + (d.std ? 0.03 : (h < 0.5 ? 2.4 : 3.9) * B3D_S), y - BH / 2), Q, Sv);
    const j = Pd.n++;
    M4.toArray(Pd.m, j * 16);
    if (d.std) b3dAttr(Pd, j, 0, 0, 0, b3dCol(civ.c), b3dCol(civ.d));
    else b3dAttr(Pd, j, 0, 0, 0, b3dCol(civ.d), osc);
  }
  C.n = D.length;
  C.d0 = D[0];
  b3dCierra(P);
  b3dCierra(PB);
}
/* flechas en vuelo (BT.fx con arrow: 1): parábola entre tirador y blanco */
function b3dFlechas(now) {
  const im = B3D.fle,
    M4 = B3D._m4f || (B3D._m4f = new THREE.Matrix4()),
    Q = B3D._qf || (B3D._qf = new THREE.Quaternion()),
    V = new THREE.Vector3(),
    D = new THREE.Vector3(),
    X = new THREE.Vector3(1, 0, 0),
    Sv = new THREE.Vector3(B3D_S, B3D_S, B3D_S);
  let n = 0;
  for (const f of BT.fx) {
    if (!f.arrow || n >= 500) continue;
    const k = (now - f.t0) / 900;
    if (k < 0 || k > 0.4) continue;
    const q = k / 0.4,
      L = Math.hypot(f.x - f.x0, f.y - f.y0),
      hA = 0.15 + L * 0.16,
      h0 = b3dAlt(f.x0, f.y0) + 0.3,
      h1 = b3dAlt(f.x, f.y) + 0.2,
      x = f.x0 + (f.x - f.x0) * q,
      y = f.y0 + (f.y - f.y0) * q,
      hy = h0 + (h1 - h0) * q + Math.sin(q * Math.PI) * hA;
    D.set((f.x - f.x0) / (L || 1), h1 - h0 + Math.cos(q * Math.PI) * Math.PI * hA, (f.y - f.y0) / (L || 1));
    D.x *= L || 1;
    D.z *= L || 1;
    D.normalize();
    Q.setFromUnitVectors(X, D);
    M4.compose(V.set(x - BW / 2, hy, y - BH / 2), Q, Sv);
    im.setMatrixAt(n++, M4);
  }
  im.count = n;
  im.instanceMatrix.needsUpdate = true;
}
/* anillos, alcances, órdenes y arrastres (equivalente a lo que dibuja drawBattle en 2D) */
function b3dGuias(now) {
  const A = B3D.ani,
    Lb = B3D.lin,
    M4 = B3D._m4g || (B3D._m4g = new THREE.Matrix4()),
    col = B3D._cg || (B3D._cg = new THREE.Color());
  let na = 0;
  Lb.k = 0;
  const anillo = (x, y, r, hex) => {
      if (na >= 398) return;
      const h = b3dAlt(x, y) + 0.03;
      for (const [rr, c] of [
        [r + 0.07, "#0a0d10"],
        [r, hex],
      ]) {
        M4.makeScale(rr, 1, rr);
        M4.setPosition(x - BW / 2, h, y - BH / 2);
        A.setMatrixAt(na, M4);
        A.setColorAt(na++, col.set(c));
      }
    },
    seg = (x0, y0, x1, y1, hex, h0, h1) => {
      if (Lb.k >= Lb.n - 2) return;
      const c = col.set(hex),
        p = Lb.p,
        cc = Lb.c,
        o = Lb.k * 3;
      p[o] = x0 - BW / 2;
      p[o + 1] = h0 ?? b3dAlt(x0, y0) + 0.06;
      p[o + 2] = y0 - BH / 2;
      p[o + 3] = x1 - BW / 2;
      p[o + 4] = h1 ?? b3dAlt(x1, y1) + 0.06;
      p[o + 5] = y1 - BH / 2;
      cc.set([c.r, c.g, c.b, c.r, c.g, c.b], o);
      Lb.k += 2;
    },
    linea = (x0, y0, x1, y1, hex) => {
      const L = Math.hypot(x1 - x0, y1 - y0),
        n = Math.max(1, Math.ceil(L / 0.5));
      for (let i = 0; i < n; i++) {
        const a = i / n,
          b = (i + 1) / n;
        seg(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, x0 + (x1 - x0) * b, y0 + (y1 - y0) * b, hex);
      }
    },
    flecha = (x0, y0, x1, y1, hex) => {
      linea(x0, y0, x1, y1, hex);
      const a = Math.atan2(y1 - y0, x1 - x0);
      for (const s of [2.5, -2.5]) seg(x1, y1, x1 + Math.cos(a + s) * 0.45, y1 + Math.sin(a + s) * 0.45, hex);
    },
    circulo = (x, y, r, hex, rayas) => {
      const n = Math.max(24, Math.round(r * 10)),
        h = b3dAlt(x, y) + 0.06;
      for (let i = 0; i < n; i += rayas ? 2 : 1) {
        const a = (i / n) * 6.2832,
          b = ((i + 1) / n) * 6.2832;
        seg(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(b) * r, y + Math.sin(b) * r, hex, h, h);
      }
    };
  const SG = selU(),
    s = bU(BT.sel),
    turnos = BT.phase === "plan" && BT.mode !== "rt" && !BT.run;
  /* selección */
  for (const u of BT.units)
    if (act(u) && u.x >= 0 && (BT.sels || []).includes(u.id)) anillo(b3dPos(u).x, b3dPos(u).y, rad(u) + 0.15, u.id === BT.sel ? "#f2c14e" : "#ffe9a8");
  /* alcance de movimiento (turnos) y de tiro */
  if (turnos)
    for (const q of SG.length > 3 ? [s].filter(Boolean) : SG) {
      const st = slotStart(q, BT.mode === "t3" ? BT.slot : 0);
      circulo(st.x, st.y, reach(q), "#e8e8e8", true);
    }
  if (s && act(s) && mio(s) && turnos && tirador(s)) circulo(s.x, s.y, alc(s), "#ffd25a", true);
  /* órdenes planeadas */
  if (BT.phase === "plan")
    for (const u of BT.units) {
      if (!mio(u) || !act(u) || u.rout || !u.plan) continue;
      /* con el mando delegado, solo las órdenes de la selección (si no, el campo se llena de líneas) */
      if (BT.auto0 && !(BT.sels || []).includes(u.id)) continue;
      let x = u.x,
        y = u.y;
      const n = BT.mode === "t3" ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const o = u.plan[i] && u.plan[i].o;
        if (!o) continue;
        let nx, ny;
        if (o.tg != null) {
          const t = bU(o.tg);
          if (!t) continue;
          nx = t.x;
          ny = t.y;
          anillo(t.x, t.y, rad(t) + 0.2, "#ff5a4a");
        } else {
          nx = o.x;
          ny = o.y;
          anillo(nx, ny, rad(u), u.id === BT.sel ? "#f2c14e" : "#b89540");
        }
        linea(x, y, nx, ny, u.id === BT.sel ? "#f2c14e" : "#a88a3a");
        x = nx;
        y = ny;
      }
    }
  /* arrastre en curso */
  const d = B3D.drag;
  if (d && d.mode === "unit" && d.x != null) {
    if (BT.phase === "plan" && SG.length) {
      const cx = SG.reduce((a, u) => a + u.x, 0) / SG.length,
        cy = SG.reduce((a, u) => a + u.y, 0) / SG.length,
        h = d.pick && !aliado(d.pick) ? d.pick : null;
      if (h) {
        flecha(cx, cy, h.x, h.y, "#ff5a4a");
        anillo(h.x, h.y, rad(h) + 0.2, "#ff5a4a");
      } else {
        flecha(cx, cy, d.x, d.y, "#8fd18a");
        for (const g of groupSlots(SG, d.x, d.y)) anillo(g.x, g.y, rad(g.u), "#8fd18a");
      }
    } else if (BT.phase === "deploy") {
      const u = bU(d.h);
      if (u && cmbEnZona(u.side, d.x, d.y)) {
        const q = cmbAZona(u.side, d.x, d.y);
        anillo(q.x, q.y, rad(u), "#8fd18a");
      }
    }
  }
  if (BT.arrow && now - BT.arrow.t0 < 1800) flecha(BT.arrow.x0, BT.arrow.y0, BT.arrow.x1, BT.arrow.y1, "#f2c14e");
  A.count = na;
  A.instanceMatrix.needsUpdate = true;
  if (A.instanceColor) A.instanceColor.needsUpdate = true;
  Lb.g.setDrawRange(0, Lb.k);
  Lb.g.attributes.position.needsUpdate = true;
  Lb.g.attributes.color.needsUpdate = true;
}
/* proyección de un punto del campo (x, y en casillas; h altura) a píxeles CSS del contenedor */
const b3dV = { v: null };
function b3dPantalla(x, y, h = 0) {
  const v = b3dV.v || (b3dV.v = new THREE.Vector3());
  v.set(x - BW / 2, b3dAlt(x, y) + h, y - BH / 2).project(B3D.camera);
  return { x: ((v.x + 1) / 2) * B3D.tamW, y: ((1 - v.y) / 2) * B3D.tamH };
}
const b3dPxCasilla = () => (B3D.tamW * B3D.camera.zoom) / (B3D.camera.right - B3D.camera.left);
/* rótulos: cifras y barras de tamaño, moral y cansancio; avisos; textos flotantes; integridad del muro */
function b3dHud(now) {
  const c = B3D.hx,
    dp = B3D.dpr,
    W = B3D.tamW,
    H = B3D.tamH;
  c.setTransform(dp, 0, 0, dp, 0, 0);
  c.clearRect(0, 0, W, H);
  c.font = '8px "Press Start 2P", monospace';
  c.textBaseline = "top";
  c.imageSmoothingEnabled = false;
  const ppc = b3dPxCasilla();
  if (BT.atk) {
    c.fillStyle = "rgba(255,60,40,.08)";
    c.fillRect(0, 0, W, H);
  }
  for (const u of BT.units) {
      if (!act(u) || u.x < 0) continue;
      const mo = b3dModelo(u.t),
        alto = mo === "tor" ? 1.4 : mo === "ele" ? 1.0 : cmbCab(u.t) ? 0.8 : 0.66,
        q = b3dPos(u),
        p = b3dPantalla(q.x, q.y, alto + 0.1);
      if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) continue;
      const X = Math.round(p.x),
        Y = Math.round(p.y);
      if (B3D.pref.barras) {
        const t = String(u.n),
          bw = 20;
        c.fillStyle = "#000";
        c.fillRect(X - bw / 2 - 1, Y - 1, bw + 2, 8);
        c.fillStyle = aliado(u) ? (mio(u) ? "#8fd18a" : "#7fd4c8") : typeof CMB_COL_B !== "undefined" ? CMB_COL_B[(cmbBnd(u.side) + 7) % CMB_COL_B.length] : "#ff8a7a";
        c.fillRect(X - bw / 2, Y, Math.round((bw * u.n) / u.n0), 2);
        c.fillStyle = u.mor < u.morMax * 0.35 ? "#e0503f" : "#5b97f0";
        c.fillRect(X - bw / 2, Y + 2, Math.round(bw * clamp(u.mor / u.morMax, 0, 1)), 2);
        c.fillStyle = "#e8b632";
        c.fillRect(X - bw / 2, Y + 4, Math.round(bw * clamp(u.fat / 100, 0, 1)), 2);
        c.fillStyle = "#000";
        c.fillText(t, X - (t.length * 8) / 2 + 1, Y - 10);
        c.fillStyle = (BT.sels || []).includes(u.id) ? "#f2c14e" : "#fff";
        c.fillText(t, X - (t.length * 8) / 2, Y - 11);
      }
      let ix = X + 13;
      const icono = (fn) => {
        fn(ix, Y - 2);
        ix += 7;
      };
      if (u.gen && BT.gens && BT.gens[u.side] && BT.gens[u.side].ok)
        icono((x, y) => {
          c.fillStyle = "#000";
          c.fillRect(x - 1, y - 1, 6, 8);
          c.fillStyle = "#f2c14e";
          c.fillRect(x, y, 1, 6);
          c.fillRect(x + 1, y, 3, 3);
        });
      const hA = (u.hab || []).some((h) => h.t > 0),
        hB = (u.hab || []).some((h) => h.b > 0);
      if (hA || hB)
        icono((x, y) => {
          c.fillStyle = "#000";
          c.fillRect(x - 1, y - 1, 5, 5);
          c.fillStyle = hA ? "#f2c14e" : "#8a8f98";
          c.fillRect(x, y, 3, 3);
        });
      if (u.desb > 0)
        icono((x, y) => {
          c.fillStyle = "#ff5a4a";
          c.fillRect(x, y, 4, 4);
        });
      if (!u.rout && u.mor < u.morMax * 0.35 && (B3D.reduce || Math.floor(now / 300) % 2))
        icono((x, y) => {
          c.fillStyle = "#000";
          c.fillRect(x - 1, y - 2, 4, 9);
          c.fillStyle = "#ff5a4a";
          c.fillRect(x, y - 1, 2, 4);
          c.fillRect(x, y + 4, 2, 2);
        });
    }
  /* textos flotantes (bajas, habilidades) */
  for (const f of BT.fx) {
    if (f.arrow || !f.txt) continue;
    const k = (now - f.t0) / 900;
    if (k < 0) continue;
    const p = b3dPantalla(f.x, f.y + 0.6, 0.9);
    c.fillStyle = "#000";
    c.fillText(f.txt, p.x - 5, p.y - 12 - k * 12);
    c.fillStyle = f.c || "#fff";
    c.fillText(f.txt, p.x - 6, p.y - 13 - k * 12);
  }
  /* muralla: integridad */
  if (BT.muro) {
    const M = BT.muro,
      k = clamp(M.hp / M.hp0, 0, 1),
      p = M.x0 != null ? b3dPantalla(M.cx, M.y0, 2.1) : b3dPantalla(BW / 2, 0.4, 2.1);
    c.fillStyle = "#000";
    c.fillRect(p.x - 17, p.y - 1, 34, 6);
    c.fillStyle = k > 0.5 ? "#cfc6b6" : k > 0 ? "#e8b632" : "#e0503f";
    c.fillRect(p.x - 16, p.y, Math.round(32 * k), 4);
  }
  /* rectángulo de selección (en pantalla) */
  const d = B3D.drag;
  if (d && d.mode === "box") {
    const x0 = Math.min(d.sx0, d.sx),
      y0 = Math.min(d.sy0, d.sy),
      w = Math.abs(d.sx - d.sx0),
      h = Math.abs(d.sy - d.sy0);
    c.fillStyle = "rgba(255,255,255,.1)";
    c.fillRect(x0, y0, w, h);
    c.strokeStyle = "#000";
    c.lineWidth = 3;
    c.strokeRect(x0 + 0.5, y0 + 0.5, w, h);
    c.strokeStyle = "#fff";
    c.lineWidth = 1;
    c.setLineDash([4, 3]);
    c.strokeRect(x0 + 0.5, y0 + 0.5, w, h);
    c.setLineDash([]);
  }
  /* brújula: hacia tu línea (tu lado del campo) */
  const dl = B3D_DIRL[b3dMiLado()] || B3D_DIRL.O,
    a = b3dPantalla(BW / 2, BH / 2, 0),
    b = b3dPantalla(BW / 2 + dl[0] * 5, BH / 2 + dl[1] * 5, 0),
    an = Math.atan2(b.y - a.y, b.x - a.x),
    cx = W - 22,
    cy = 22;
  c.fillStyle = "rgba(10,13,16,.75)";
  c.fillRect(cx - 16, cy - 16, 32, 32);
  c.strokeStyle = "#3a4752";
  c.lineWidth = 2;
  c.strokeRect(cx - 16, cy - 16, 32, 32);
  c.fillStyle = "#8fd18a";
  c.beginPath();
  c.moveTo(cx + Math.cos(an) * 11, cy + Math.sin(an) * 11);
  c.lineTo(cx + Math.cos(an + 2.5) * 8, cy + Math.sin(an + 2.5) * 8);
  c.lineTo(cx + Math.cos(an - 2.5) * 8, cy + Math.sin(an - 2.5) * 8);
  c.fill();
  c.fillStyle = "#ff8a7a";
  c.fillRect(Math.round(cx - Math.cos(an) * 9) - 2, Math.round(cy - Math.sin(an) * 9) - 2, 4, 4);
}

/* ======================= entrada ======================= */
const b3dRay = { r: null, n: null };
/* punto del campo bajo un punto de pantalla: rayo contra el relieve (o contra el plano y = 0) */
function b3dCampo(cx, cy, plano) {
  if (!B3D.camera || !B3D.wrap) return null;
  const rc = B3D.wrap.getBoundingClientRect(),
    R = b3dRay.r || (b3dRay.r = new THREE.Raycaster()),
    N = b3dRay.n || (b3dRay.n = new THREE.Vector2());
  N.set(((cx - rc.left) / rc.width) * 2 - 1, -(((cy - rc.top) / rc.height) * 2 - 1));
  R.setFromCamera(N, B3D.camera);
  const o = R.ray.origin,
    d = R.ray.direction;
  if (d.y >= -1e-4) return null;
  const at = (t) => [o.x + d.x * t, o.y + d.y * t, o.z + d.z * t];
  if (plano || !B3D.rel) {
    const t = -o.y / d.y,
      p = at(t);
    return { x: p[0] + BW / 2, y: p[2] + BH / 2 };
  }
  let t = (o.y - 1.8) / -d.y,
    paso = 0.06 / -d.y,
    prev = t;
  for (let k = 0; k < 120; k++) {
    const p = at(t);
    if (p[1] <= b3dAlt(p[0] + BW / 2, p[2] + BH / 2) || p[1] < -1) break;
    prev = t;
    t += paso;
  }
  let a = prev,
    b = t;
  for (let k = 0; k < 8; k++) {
    const m = (a + b) / 2,
      p = at(m);
    if (p[1] <= b3dAlt(p[0] + BW / 2, p[2] + BH / 2)) b = m;
    else a = m;
  }
  const p = at(b);
  return { x: p[0] + BW / 2, y: p[2] + BH / 2 };
}
/* unidad bajo el puntero: elipse proyectada de su círculo (más su altura), la más cercana */
function b3dElige(cx, cy) {
  if (!BT || !B3D.camera) return null;
  const rc = B3D.wrap.getBoundingClientRect(),
    mx = cx - rc.left,
    my = cy - rc.top,
    ppc = b3dPxCasilla(),
    sin = Math.sin(B3D_EL);
  let mejor = null,
    md = 1e9;
  for (const u of BT.units) {
    if (!act(u) || u.x < 0) continue;
    const p = b3dPantalla(u.x, u.y, 0),
      r = (rad(u) + 0.2) * ppc + 4,
      alto = (cmbCab(u.t) ? 0.55 : 0.42) * ppc * Math.cos(B3D_EL),
      ex = (mx - p.x) / r,
      ey = my < p.y ? (my - p.y) / (r * sin + alto) : (my - p.y) / (r * sin + 4),
      dd2 = ex * ex + ey * ey;
    if (dd2 < 1 && dd2 < md) {
      md = dd2;
      mejor = u;
    }
  }
  return mejor;
}
function b3dEntrada(w) {
  const pts = B3D.pts;
  w.addEventListener("contextmenu", (e) => e.preventDefault());
  w.addEventListener(
    "wheel",
    (e) => {
      if (!b3dActivo() || !B3D.camera) return;
      e.preventDefault();
      b3dZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
    },
    { passive: false },
  );
  w.addEventListener("pointerdown", (e) => {
    if (!BT || !B3D.camera) return;
    try {
      w.setPointerCapture(e.pointerId);
    } catch (_) {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      /* dos dedos: pellizco = zoom, giro = girar (libre), mover = desplazar */
      clearTimeout(B3D.lp);
      B3D.drag = null;
      const [a, b] = [...pts.values()];
      B3D.dos = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: B3D.cam.zoomT, an0: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      return;
    }
    if (pts.size > 2) return;
    if (e.button === 2 || e.button === 1) {
      B3D.drag = { mode: e.button === 2 ? "giro" : "pan", cx: e.clientX, cy: e.clientY, lx: e.clientX, ly: e.clientY, acc: 0 };
      return;
    }
    const rc = w.getBoundingClientRect(),
      p = b3dCampo(e.clientX, e.clientY),
      h = b3dElige(e.clientX, e.clientY);
    B3D.drag = {
      cx: e.clientX,
      cy: e.clientY,
      lx: e.clientX,
      ly: e.clientY,
      sx0: e.clientX - rc.left,
      sy0: e.clientY - rc.top,
      sx: e.clientX - rc.left,
      sy: e.clientY - rc.top,
      x0: p ? p.x : null,
      y0: p ? p.y : null,
      x: p ? p.x : null,
      y: p ? p.y : null,
      h: h ? h.id : null,
      mine: !!(h && mio(h)),
      mode: !h && e.shiftKey && BT.phase === "plan" ? "box" : null,
    };
    clearTimeout(B3D.lp);
    B3D.lp = setTimeout(() => {
      const d = B3D.drag;
      if (!d || d.mode || !BT) return;
      if (d.mine && BT.phase === "plan") {
        toggleSel(d.h);
        d.mode = "done";
        buzz();
        bui();
      } else if (!d.h && BT.phase === "plan") {
        d.mode = "box";
        buzz();
      }
    }, 420);
  });
  w.addEventListener("pointermove", (e) => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!BT || !B3D.camera) return;
    if (B3D.dos && pts.size >= 2) {
      const [a, b] = [...pts.values()],
        D = B3D.dos,
        dist = Math.hypot(a.x - b.x, a.y - b.y) || 1,
        an = Math.atan2(b.y - a.y, b.x - a.x),
        mx = (a.x + b.x) / 2,
        my = (a.y + b.y) / 2;
      B3D.cam.zoomT = clamp((D.z0 * dist) / D.d0, 0.8, 8);
      if (B3D.reduce) B3D.cam.zoom = B3D.cam.zoomT;
      /* giro libre con dos dedos: la vista gira lo mismo que los dedos */
      const da = b3dAng(an - D.an0);
      if (Math.abs(da) > 0.004) {
        b3dGiraLibre(-da);
        D.an0 = an;
      }
      b3dPan(mx - D.mx, my - D.my);
      D.mx = mx;
      D.my = my;
      b3dBarra();
      return;
    }
    const d = B3D.drag;
    if (!d) return;
    const rc = w.getBoundingClientRect();
    if (d.mode === "giro") {
      /* giro libre con el botón derecho: 1 px = ~0,4° */
      b3dGiraLibre(-(e.clientX - d.lx) * 0.007);
      d.lx = e.clientX;
      return;
    }
    if (d.mode === "pan") {
      b3dPan(e.clientX - d.lx, e.clientY - d.ly);
      d.lx = e.clientX;
      d.ly = e.clientY;
      return;
    }
    d.sx = e.clientX - rc.left;
    d.sy = e.clientY - rc.top;
    const p = b3dCampo(e.clientX, e.clientY);
    if (p) {
      d.x = p.x;
      d.y = p.y;
    }
    const mv = Math.hypot(e.clientX - d.cx, e.clientY - d.cy) > 8;
    if (!d.mode && mv) {
      clearTimeout(B3D.lp);
      if (d.mine && (BT.phase === "deploy" || canOrder())) {
        d.mode = "unit";
        if (!BT.sels.includes(d.h)) {
          BT.sels = [d.h];
          BT.sel = d.h;
          fixSlot();
        }
      } else d.mode = "pan";
    }
    if (d.mode === "pan") {
      b3dPan(e.clientX - d.lx, e.clientY - d.ly);
      d.lx = e.clientX;
      d.ly = e.clientY;
    }
    if (d.mode === "unit") d.pick = b3dElige(e.clientX, e.clientY);
  });
  const fin = (e, cancel) => {
    pts.delete(e.pointerId);
    if (B3D.dos) {
      if (pts.size < 2) B3D.dos = null;
      B3D.drag = null;
      return;
    }
    clearTimeout(B3D.lp);
    const d = B3D.drag;
    B3D.drag = null;
    if (!BT || !d || cancel) return;
    if (d.mode === "pan" || d.mode === "done" || d.mode === "giro") return;
    if (d.mode === "box") {
      const rc = w.getBoundingClientRect(),
        x0 = Math.min(d.sx0, d.sx),
        x1 = Math.max(d.sx0, d.sx),
        y0 = Math.min(d.sy0, d.sy),
        y1 = Math.max(d.sy0, d.sy),
        ppc = b3dPxCasilla();
      void rc;
      const ids = BT.units
        .filter((u) => {
          if (!mio(u) || !act(u) || u.rout || u.x < 0) return false;
          const p = b3dPantalla(u.x, u.y, 0.2),
            r = rad(u) * ppc * 0.6;
          return p.x + r >= x0 && p.x - r <= x1 && p.y + r * 0.6 >= y0 && p.y - r * 0.6 <= y1;
        })
        .map((u) => u.id);
      if (ids.length) {
        BT.sels = ids;
        BT.sel = ids[0];
        fixSlot();
        buzz();
      }
      bui();
      return;
    }
    const p = b3dCampo(e.clientX, e.clientY);
    if (d.mode === "unit") {
      if (!p) return;
      if (BT.phase === "deploy") {
        const u = bU(d.h);
        if (u) cmbColocar(u, p.x, p.y); /* también sobre la muralla (arqueros de la plaza) */
        bui();
        return;
      }
      const h = b3dElige(e.clientX, e.clientY);
      if (h && !aliado(h)) orderGroup({ tg: h.id });
      else orderGroup({ x: p.x, y: p.y });
      return;
    }
    /* toque: si hay una unidad bajo el dedo se le pasa su centro a tapAt (así hitAt la encuentra) */
    const h = b3dElige(e.clientX, e.clientY);
    if (h) tapAt(h.x, h.y, e.shiftKey);
    else if (p) tapAt(p.x, p.y, e.shiftKey);
  };
  w.addEventListener("pointerup", (e) => fin(e, false));
  w.addEventListener("pointercancel", (e) => fin(e, true));
  document.addEventListener("keydown", (e) => {
    if (!b3dActivo() || !B3D.camera || !$("battle").classList.contains("show")) return;
    if ($("modal").classList.contains("show") || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches && e.target.matches("input,select,textarea")) return;
    const k = e.key,
      st = 40;
    let hecho = true;
    if (k === "q" || k === "Q") b3dGira(-1);
    else if (k === "e" || k === "E") b3dGira(1);
    else if (k === "r" || k === "R") b3dReinicia();
    else if (k === "f" || k === "F") b3dBoton("seguir");
    else if (k === "+" || k === "=") b3dZoom(1.25);
    else if (k === "-" || k === "_") b3dZoom(1 / 1.25);
    else if (k === "ArrowLeft") b3dPan(st, 0);
    else if (k === "ArrowRight") b3dPan(-st, 0);
    else if (k === "ArrowUp") b3dPan(0, st);
    else if (k === "ArrowDown") b3dPan(0, -st);
    else hecho = false;
    if (hecho) {
      e.preventDefault();
      b3dBarra();
    }
  });
}

/* ======================= enganche con batalla.js (sin tocarlo) ======================= */
const b3dDibuja2D = drawBattle;
drawBattle = function (now) {
  if (B3D.pref.vista !== "2d" && BT && B3D.ok !== false && !B3D.perdido) {
    if (!B3D.wrap) b3dDom();
    if (b3dWebGL() && b3dVista() === "3d") {
      if (!$("battle").classList.contains("b3d-on")) b3dBarra();
      b3dFrame(now);
      return;
    }
  }
  if ($("battle").classList.contains("b3d-on") || (B3D.bar && !B3D.barOk)) {
    B3D.barOk = 1;
    b3dBarra();
  }
  b3dDibuja2D(now);
};
const b3dBattleAct0 = battleAct;
battleAct = function (v) {
  if (b3dActivo() && B3D.camera && typeof v === "string" && v.startsWith("zoom:")) {
    b3dZoom(v === "zoom:in" ? 1.4 : 1 / 1.4);
    return;
  }
  return b3dBattleAct0(v);
};
b3dDom();

/* ======================= herramientas: paleta y vistas previas de los modelos ======================= */
/* b3dExportar() → {paleta: dataURL, terreno: dataURL, modelos: [{id, png}], json} (lo usa
   `node pruebas/batalla3d.js exportar` para escribir assets/batalla3d/) */
function b3dExportar(f = 0, lado = 96, aumento = 3) {
  if (typeof THREE === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = lado;
  cv.height = lado;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, preserveDrawingBuffer: true }),
    S = new THREE.Scene(),
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    mat = b3dMatFiguras(),
    civ = CIV[f] || CIV[0],
    out = [],
    big = document.createElement("canvas"),
    bx = big.getContext("2d");
  r.setPixelRatio(1);
  S.add(new THREE.HemisphereLight("#bcd8ec", "#3a3020", 1.2));
  const sol = new THREE.DirectionalLight("#fff2dc", 2.4);
  sol.position.set(30, 50, 40);
  S.add(sol);
  big.width = big.height = lado * aumento;
  bx.imageSmoothingEnabled = false;
  const ids = Object.keys(B3D_MOD).filter((k) => !["fle", "pino", "roble"].includes(k));
  for (const id of ids.concat(["pino", "roble"])) {
    const g = b3dModeloGeo(id),
      P = b3dPool(g, ["pino", "roble"].includes(id) ? new THREE.MeshLambertMaterial({ vertexColors: true }) : mat, 1, false);
    b3dPon(P, 0, 0, 0, 1, 0, 1, 0, 0, 0, b3dCol(civ.c), b3dCol(civ.d));
    b3dCierra(P);
    g.computeBoundingBox();
    const bb = g.boundingBox,
      cx = (bb.min.x + bb.max.x) / 2,
      cy = (bb.min.y + bb.max.y) / 2,
      cz = (bb.min.z + bb.max.z) / 2,
      R = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z) * 0.62;
    cam.left = -R;
    cam.right = R;
    cam.top = R;
    cam.bottom = -R;
    cam.position.set(cx + 40 * Math.cos(B3D_EL) * Math.sin(2.2), cy + 40 * Math.sin(B3D_EL), cz + 40 * Math.cos(B3D_EL) * Math.cos(2.2));
    cam.lookAt(cx, cy, cz);
    cam.updateProjectionMatrix();
    S.add(P.mesh);
    r.setClearColor(0x000000, 0);
    r.render(S, cam);
    S.remove(P.mesh);
    bx.clearRect(0, 0, big.width, big.height);
    bx.drawImage(cv, 0, 0, big.width, big.height);
    out.push({ id, png: big.toDataURL("image/png") });
    g.dispose();
  }
  r.dispose();
  /* paleta */
  const pal = { ...B3D_PAL },
    keys = Object.keys(pal),
    pc = document.createElement("canvas"),
    px = pc.getContext("2d");
  pc.width = 8 * 40;
  pc.height = Math.ceil(keys.length / 8) * 48;
  px.font = "12px monospace";
  keys.forEach((k, i) => {
    const x = (i % 8) * 40,
      y = Math.floor(i / 8) * 48;
    px.fillStyle = pal[k];
    px.fillRect(x + 4, y + 4, 32, 28);
    px.fillStyle = "#fff";
    px.fillText(k, x + 16, y + 44);
  });
  const tk = Object.entries(B3D_TERR_PAL),
    tc = document.createElement("canvas"),
    tx = tc.getContext("2d");
  tc.width = 4 * 32;
  tc.height = tk.length * 32;
  tk.forEach(([k, v], j) => [].concat(v).forEach((h, i) => {
    tx.fillStyle = h;
    tx.fillRect(i * 32, j * 32, 32, 32);
  }));
  return {
    modelos: out,
    paleta: pc.toDataURL("image/png"),
    terreno: tc.toDataURL("image/png"),
    json: { version: 1, vox: B3D_S, figuras: B3D_PAL, terreno: B3D_TERR_PAL, cielo: B3D_CIELO, tipos: B3D_TIPO, escala: B3D_ESC },
  };
}
