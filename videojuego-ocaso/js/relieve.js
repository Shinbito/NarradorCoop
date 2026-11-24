/* ---------- RELIEVE: el mapa de campaña visto de frente, con lo que tiene altura «de pie» ----------
   El mapa no gira ni se inclina (clics, zoom y desplazamiento son los de siempre). Lo que cambia:
   - el terreno se pinta sin sus decorados de pie: al construirlo (ifzTerrenoHD) se GRABAN las llamadas a
     ifzDibT (picos, colinas, árboles, aldeas) en vez de dibujarse; la sombra del suelo sí queda;
   - esos dibujos y las ciudades (ifzCiudad) se pintan después, más grandes, apoyados en su base, con
     sombra y ordenados por profundidad (lo de más abajo tapa a lo de más arriba): montañas y bosques
     se ven con volumen;
   - drawMap pinta antes la niebla, para que lo de pie quede encima (en sombra si no se ve: solo se sabe de
     quién es cada ciudad), y luego insignias y ejércitos.
   La capa de pie se guarda en un lienzo y solo se rehace si cambian el mapa, los dueños o lo que se ve.
   Botón «Relieve» en la barra del mapa (se recuerda en localStorage «ocaso-relieve»; por defecto, sí).
   Globales con prefijo rel / REL. */
const REL = {
  on: (() => {
    try {
      return localStorage.getItem("ocaso-relieve") !== "0";
    } catch (_) {
      return true;
    }
  })(),
  grab: false,
  tmp: [],
  obj: [],
  ver: 0,
  cv: null,
  k: "",
};
/* cuánto crece cada dibujo al ponerse de pie */
const REL_ESC = { "mapa.monte": 1.9, "mapa.monte2": 1.7, "mapa.colina": 1.35, "mapa.aldea": 1.3, "arbol.pino": 1.6, "arbol.roble": 1.55, "arbol.abedul": 1.5, "arbol.olivo": 1.4 };
const REL_CIU = 1.2;

/* grabar los decorados de pie mientras se construye el terreno */
if (typeof ifzDibT === "function") {
  const relDibT0 = ifzDibT;
  ifzDibT = function (c, n, x, y, f, fl) {
    if (REL.grab && REL_ESC[n]) {
      REL.tmp.push({ n, x, y, f, fl });
      return;
    }
    return relDibT0.apply(this, arguments);
  };
}
if (typeof ifzTerrenoHD === "function") {
  const relTer0 = ifzTerrenoHD;
  ifzTerrenoHD = function () {
    const k0 = IFZ_HD.terK;
    REL.tmp = [];
    REL.grab = REL.on;
    let r;
    try {
      r = relTer0.apply(this, arguments);
    } finally {
      REL.grab = false;
    }
    if (IFZ_HD.terK !== k0 || k0 === "") {
      REL.obj = REL.on ? REL.tmp : [];
      REL.ver++;
    }
    REL.tmp = [];
    return r;
  };
}

/* versión en sombra de un dibujo (para lo que está bajo la niebla); sin ctx.filter, que es muy lento */
const REL_OSC = new WeakMap();
function relOscuro(im) {
  let o = REL_OSC.get(im);
  if (o) return o;
  o = document.createElement("canvas");
  o.width = im.width;
  o.height = im.height;
  const x = o.getContext("2d");
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = "source-atop";
  x.fillStyle = "rgba(14,18,26,.45)";
  x.fillRect(0, 0, o.width, o.height);
  REL_OSC.set(im, o);
  return o;
}
/* una ciudad de pie: se dibuja en un lienzo aparte, se mide dónde está su base real (la fila opaca más baja:
   las imágenes dejan aire debajo) y ahí se apoya, con la sombra pegada; crece desde esa base */
const REL_CIUC = new Map(); /* p.id → {k, cv, fb, x0, x1}: el dibujo preparado de cada ciudad */
function relCiudad(x, p, o, sombra, RR) {
  const S = IFZ_S,
    t = (p.cap ? 3 : 2) * S,
    L = Math.ceil(t * 1.5),
    X = (p.x + 0.5) * S,
    Y = (p.y + 0.5) * S,
    kc = `${o}|${sombra ? "o" : Math.round(ifzPob(p) / 2.2) + "." + Math.min(3, p.walls || 0)}|${p.cap ? 1 : 0}|${RR}|${IFZ_HD.terK}|${typeof ifzAtlImg === "function" && ifzAtlImg("capital") ? 1 : 0}`;
  let e = REL_CIUC.get(p.id);
  if (!e || e.k !== kc) {
    const c = (e && e.cv) || document.createElement("canvas");
    c.width = L * RR;
    c.height = L * RR;
    const y = c.getContext("2d", { willReadFrequently: true });
    y.imageSmoothingEnabled = false;
    y.setTransform(RR, 0, 0, RR, (L / 2 - X) * RR, (L / 2 - Y) * RR);
    ifzCiudad(y, p, o, sombra);
    y.setTransform(1, 0, 0, 1, 0, 0);
    /* base: la fila más baja con bastantes píxeles opacos (las imágenes dejan aire debajo) y su anchura */
    const d = y.getImageData(0, 0, c.width, c.height).data;
    let fb = -1,
      x0 = c.width,
      x1 = 0;
    for (let r = c.height - 1; r >= 0 && fb < 0; r--) {
      let n = 0;
      for (let q = 0; q < c.width; q++) if (d[(r * c.width + q) * 4 + 3] > 60) n++;
      if (n >= 3 * RR) fb = r;
    }
    if (fb < 0) fb = c.height - 1;
    for (let r = Math.max(0, fb - 6 * RR); r <= fb; r++)
      for (let q = 0; q < c.width; q++)
        if (d[(r * c.width + q) * 4 + 3] > 60) {
          x0 = Math.min(x0, q);
          x1 = Math.max(x1, q);
        }
    if (x1 < x0) {
      x0 = 0;
      x1 = c.width;
    }
    if (sombra) {
      y.globalCompositeOperation = "source-atop";
      y.fillStyle = "rgba(14,18,26,.45)";
      y.fillRect(0, 0, c.width, c.height);
    }
    e = { k: kc, cv: c, fb, x0, x1 };
    REL_CIUC.set(p.id, e);
  }
  const k = REL_CIU,
    bL = (e.fb + 1) / RR /* base en unidades del lienzo de la ciudad */,
    by = Y - L / 2 + bL /* base en el mapa */,
    cxL = (e.x0 + e.x1 + 1) / 2 / RR,
    bx = X - L / 2 + cxL,
    an = ((e.x1 - e.x0 + 1) / RR) * k;
  /* sombra pegada a la base (un poco hacia la derecha: luz del noroeste) */
  x.fillStyle = "rgba(0,0,0,.3)";
  x.beginPath();
  x.ellipse(bx + an * 0.06, by - 1, an * 0.55, Math.max(2.5, an * 0.13), 0, 0, Math.PI * 2);
  x.fill();
  /* la ciudad crece desde su base */
  x.drawImage(e.cv, bx - cxL * k, by - bL * k, L * k, L * k);
}
/* la capa de pie (montañas, colinas, árboles, aldeas y ciudades), en caché */
function relCapa(own, niebla) {
  const S = IFZ_S,
    RR = IFZ_HD.r || 1,
    V = niebla && typeof ifzNieblaOn === "function" && ifzNieblaOn() && typeof camVisMapa === "function" ? camVisMapa(ME) : null,
    k = `${REL.ver}|${IFZ_HD.terK}|${RR}|${IFZ_POL.k || ""}|${own.join(",")}|${V ? V.k : "-"}`;
  if (REL.cv && REL.k === k) return REL.cv;
  const t0 = performance.now();
  const cc = REL.cv || (REL.cv = document.createElement("canvas"));
  if (cc.width !== W * S * RR || cc.height !== H * S * RR) {
    cc.width = W * S * RR;
    cc.height = H * S * RR;
  }
  const x = cc.getContext("2d");
  x.setTransform(RR, 0, 0, RR, 0, 0);
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, W * S, H * S);
  /* huecos de las ciudades: ahí no se pone de pie nada del terreno */
  const hueco = (bx, by) => G.P.some((p) => Math.abs(bx - (p.x + 0.5) * S) < (p.cap ? 1.6 : 1.15) * S && by > (p.y - 0.4) * S && by < (p.y + (p.cap ? 1.9 : 1.5)) * S);
  const l = [];
  for (const o of REL.obj) {
    const rows = IFZ_SP[o.n];
    if (!rows) continue;
    const w = rows[0].length,
      h = rows.length,
      bx = o.x + w / 2,
      by = o.y + h;
    if (hueco(bx, by)) continue;
    l.push({ by, bx, o, w, h, e: REL_ESC[o.n] });
  }
  for (const p of G.P) l.push({ by: (p.y + 0.5) * S + ((p.cap ? 3 : 2) * S * REL_CIU) / 2, bx: (p.x + 0.5) * S, p });
  l.sort((a, b) => a.by - b.by || a.bx - b.bx);
  const oculto = (bx, by) => {
    if (!V) return false;
    const tx = Math.min(W - 1, Math.max(0, Math.floor(bx / S))),
      ty = Math.min(H - 1, Math.max(0, Math.floor((by - 1) / S)));
    return !V.vis[ty * W + tx];
  };
  for (const d of l) {
    const sombra = oculto(d.bx, d.by);
    if (d.p) {
      relCiudad(x, d.p, own[d.p.id], sombra, RR);
      continue;
    }
    const { o, w, h, e, bx, by } = d,
      W2 = w * e,
      H2 = h * e;
    x.fillStyle = o.n.startsWith("arbol") ? "rgba(0,0,0,.22)" : "rgba(0,0,0,.26)";
    x.beginPath();
    x.ellipse(bx + W2 * 0.12, by - 1, W2 * 0.48, Math.max(1.5, W2 * 0.16), 0, 0, Math.PI * 2);
    x.fill();
    const im = ifzDibCanvas(o.n, o.f, o.fl);
    if (!im) continue;
    x.drawImage(sombra ? relOscuro(im) : im, Math.round(bx - W2 / 2), Math.round(by - H2), Math.round(W2), Math.round(H2));
  }
  REL.k = k;
  REL.ms = performance.now() - t0;
  return cc;
}
function relDibujar(h, own, niebla) {
  if (!REL.on || !MAP) return;
  h.drawImage(relCapa(own, niebla), 0, 0, W * IFZ_S, H * IFZ_S);
}

/* encender / apagar */
function relPoner(on) {
  REL.on = !!on;
  try {
    localStorage.setItem("ocaso-relieve", REL.on ? "1" : "0");
  } catch (_) {}
  IFZ.sinCiudades = REL.on;
  REL.k = "";
  if (typeof drawBase === "function" && MAP) drawBase();
  const b = document.getElementById("relbtn");
  if (b) b.setAttribute("aria-pressed", REL.on);
}
IFZ.sinCiudades = REL.on;
(() => {
  const z = document.querySelector("#hover .ifz-zoom");
  if (!z || document.getElementById("relbtn")) return;
  const b = document.createElement("button");
  b.id = "relbtn";
  b.className = "zb";
  b.textContent = "Relieve";
  b.title = "Montañas, bosques y ciudades de pie (o el mapa plano)";
  b.setAttribute("aria-pressed", REL.on);
  b.addEventListener("click", () => relPoner(!REL.on));
  z.appendChild(b);
})();
