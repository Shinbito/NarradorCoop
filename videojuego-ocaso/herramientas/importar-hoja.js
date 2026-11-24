/* Importa una hoja de gráficos rediseñada (p. ej. devuelta por Gemini) y la convierte en los PNG que usa
   el juego. Sirve para TODAS las hojas que hace herramientas/exportar-sprites.js (tropas, batalla, mapa,
   ejercito, naturaleza, ciudad, interfaz, terreno, escena y atlas). Ver herramientas/LEEME.md.

   Uso (Node + Playwright, desde la carpeta videojuego-ocaso):
     node herramientas/importar-hoja.js <hoja.png|jpg> <categoría> [--plantilla hoja.json]
                                       [--destino <carpeta del juego>] [--solo nombre1,nombre2] [--prueba]

   Qué hace:
   1. Busca la plantilla de rejilla de esa categoría (assets/sprites/originales/hojas/<cat>@<k>x.json,
      la que mejor encaje con la proporción de la hoja; o la que se le dé con --plantilla).
   2. Encuentra el MARCO DORADO de la hoja (tolera que venga reescalada, desplazada o con ruido de JPEG)
      y con él sitúa cada celda.
   3. Reduce cada celda a su tamaño real con «vecino más cercano por mayoría» (vota el color de cada
      píxel entre varias muestras de su bloque, así el ruido no cuenta), cuantiza los colores, fuerza
      #ff00ff / #800080 en los teñibles y vuelve transparente el fondo plano turquesa de las celdas.
   4. Escribe <destino>/assets/sprites/<categoría>/<nombre>.png, añade las entradas a manifest.json y
      regenera manifest.js (con los PNG incrustados, para jugar desde file://).
   Con --prueba no escribe nada: solo dice cuántas celdas ha leído y cuántas parecen vacías. */
const path = require("path");
const fs = require("fs");
const { manifestJs, RAIZ } = require("./exportar-sprites.js");

function args() {
  const a = process.argv.slice(2),
    o = { hoja: null, cat: null, plantilla: null, destino: RAIZ, solo: null, prueba: false };
  const libres = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--plantilla") o.plantilla = path.resolve(a[++i]);
    else if (a[i] === "--destino") o.destino = path.resolve(a[++i]);
    else if (a[i] === "--solo") o.solo = a[++i].split(",");
    else if (a[i] === "--prueba") o.prueba = true;
    else libres.push(a[i]);
  }
  o.hoja = libres[0] && path.resolve(libres[0]);
  o.cat = libres[1];
  if (!o.hoja || !o.cat) {
    console.log("Uso: node herramientas/importar-hoja.js <hoja.png|jpg> <categoría> [--plantilla hoja.json] [--destino carpeta] [--solo a,b] [--prueba]");
    process.exit(2);
  }
  return o;
}

/* plantillas candidatas: la indicada, o las de la categoría junto a la hoja y en originales/hojas */
function plantillas(o) {
  if (o.plantilla) return [JSON.parse(fs.readFileSync(o.plantilla, "utf8"))];
  const dirs = [path.dirname(o.hoja), path.join(RAIZ, "assets/sprites/originales/hojas"), path.join(o.destino, "assets/sprites/originales/hojas")],
    out = [];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) if (f.startsWith(o.cat + "@") && f.endsWith(".json")) out.push(JSON.parse(fs.readFileSync(path.join(d, f), "utf8")));
  }
  if (!out.length) {
    console.error(`No encuentro la plantilla de «${o.cat}». Exporta primero (node herramientas/exportar-sprites.js) o usa --plantilla.`);
    process.exit(2);
  }
  return out;
}

async function importar(o) {
  const pls = plantillas(o),
    ext = path.extname(o.hoja).toLowerCase(),
    mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png",
    url = `data:${mime};base64,` + fs.readFileSync(o.hoja).toString("base64");
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<!DOCTYPE html><title>importar</title>");
  const r = await page.evaluate(
    async ({ url, pls, solo }) => {
      const im = new Image();
      await new Promise((ok, mal) => {
        im.onload = ok;
        im.onerror = () => mal(new Error("no se puede leer la imagen"));
        im.src = url;
      });
      const W = im.naturalWidth,
        H = im.naturalHeight,
        cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const g = cv.getContext("2d");
      g.drawImage(im, 0, 0);
      const D = g.getImageData(0, 0, W, H).data,
        px = (x, y) => {
          x = Math.max(0, Math.min(W - 1, Math.round(x)));
          y = Math.max(0, Math.min(H - 1, Math.round(y)));
          const i = (y * W + x) * 4;
          return [D[i], D[i + 1], D[i + 2], D[i + 3]];
        },
        hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
        dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      /* 1. el marco dorado: filas y columnas con muchos píxeles dorados */
      const oro = hex(pls[0].colores.marco),
        esOro = (x, y) => {
          const p = px(x, y);
          return p[3] > 100 && dist(p, oro) < 70;
        },
        col = new Array(W).fill(0),
        fil = new Array(H).fill(0);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          if (esOro(x, y)) {
            col[x]++;
            fil[y]++;
          }
      const umbralC = Math.max(...col) * 0.6,
        umbralF = Math.max(...fil) * 0.6,
        cs = col.map((v, i) => (v >= umbralC ? i : -1)).filter((i) => i >= 0),
        fs_ = fil.map((v, i) => (v >= umbralF ? i : -1)).filter((i) => i >= 0);
      if (cs.length < 2 || fs_.length < 2) return { error: "no encuentro el marco dorado de la hoja" };
      const det = [cs[0], fs_[0], cs[cs.length - 1], fs_[fs_.length - 1]],
        asp = (det[2] - det[0]) / (det[3] - det[1]);
      /* 2. la plantilla cuya proporción encaja mejor */
      let pl = pls[0];
      for (const q of pls) {
        const a = (q.marco[2] - q.marco[0]) / (q.marco[3] - q.marco[1]),
          a0 = (pl.marco[2] - pl.marco[0]) / (pl.marco[3] - pl.marco[1]);
        if (Math.abs(a - asp) < Math.abs(a0 - asp)) pl = q;
      }
      const sx = (det[2] - det[0]) / (pl.marco[2] - pl.marco[0]),
        sy = (det[3] - det[1]) / (pl.marco[3] - pl.marco[1]),
        mx = (x) => det[0] + (x - pl.marco[0]) * sx,
        my = (y) => det[1] + (y - pl.marco[1]) * sy,
        fondo = hex(pl.colores.celda),
        out = [];
      /* 3. cada celda: voto por mayoría en cada píxel, fondo → transparente, cuantización */
      for (const it of pl.items) {
        if (solo && !solo.includes(it.nombre)) continue;
        const kx = it.w / it.wPx,
          ky = it.h / it.hPx,
          c = document.createElement("canvas");
        c.width = it.wPx;
        c.height = it.hPx;
        const cg = c.getContext("2d"),
          O = cg.createImageData(it.wPx, it.hPx),
          cols = new Map();
        let vacios = 0;
        for (let j = 0; j < it.hPx; j++)
          for (let i = 0; i < it.wPx; i++) {
            const votos = new Map();
            for (const fy of [0.3, 0.5, 0.7])
              for (const fx of [0.3, 0.5, 0.7]) {
                const p = px(mx(it.x + (i + fx) * kx), my(it.y + (j + fy) * ky)),
                  k = (p[0] >> 4) * 256 + (p[1] >> 4) * 16 + (p[2] >> 4),
                  v = votos.get(k) || { n: 0, s: [0, 0, 0] };
                v.n++;
                v.s[0] += p[0];
                v.s[1] += p[1];
                v.s[2] += p[2];
                votos.set(k, v);
              }
            const best = [...votos.values()].sort((a, b) => b.n - a.n)[0],
              rgb = best.s.map((v) => v / best.n),
              o = (j * it.wPx + i) * 4;
            if (!it.opaco && dist(rgb, fondo) < 60) {
              O.data[o + 3] = 0;
              vacios++;
              continue;
            }
            O.data[o] = rgb[0];
            O.data[o + 1] = rgb[1];
            O.data[o + 2] = rgb[2];
            O.data[o + 3] = 255;
            const kq = (Math.round(rgb[0] / 8) << 10) | (Math.round(rgb[1] / 8) << 5) | Math.round(rgb[2] / 8);
            cols.set(kq, (cols.get(kq) || 0) + 1);
          }
        /* cuantización: cada color se pega al más frecuente que tenga cerca (quita el ruido de JPEG) */
        const pal = [...cols.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => [(k >> 10) * 8, ((k >> 5) & 31) * 8, (k & 31) * 8]),
          rep = [];
        for (const p of pal) if (!rep.some((q) => dist(p, q) < 22)) rep.push(p);
        for (let o = 0; o < O.data.length; o += 4) {
          if (!O.data[o + 3]) continue;
          const p = [O.data[o], O.data[o + 1], O.data[o + 2]];
          let q = rep[0],
            d0 = 1e9;
          for (const r0 of rep) {
            const d = dist(p, r0);
            if (d < d0) {
              d0 = d;
              q = r0;
            }
          }
          let [r, gg, b] = d0 < 22 ? q : p.map((v) => Math.round(v / 8) * 8);
          /* teñibles: magenta = color del pueblo, morado = su tono oscuro, exactos */
          if (it.tinte) {
            if (r > 170 && b > 170 && gg < 110 && Math.abs(r - b) < 70) [r, gg, b] = [255, 0, 255];
            else if (r > 80 && r < 180 && b > 80 && b < 180 && gg < 70 && Math.abs(r - b) < 50) [r, gg, b] = [128, 0, 128];
          }
          O.data[o] = Math.min(255, r);
          O.data[o + 1] = Math.min(255, gg);
          O.data[o + 2] = Math.min(255, b);
        }
        cg.putImageData(O, 0, 0);
        out.push({ nombre: it.nombre, w: it.wPx, h: it.hPx, tinte: it.tinte, vacia: vacios === it.wPx * it.hPx, png: c.toDataURL() });
      }
      return { out, det, escala: [sx, sy], plantilla: `${pl.categoria}@${pl.escala}x` };
    },
    { url, pls, solo: o.solo },
  );
  await browser.close();
  if (r.error) {
    console.error("Error: " + r.error);
    process.exit(1);
  }
  const vacias = r.out.filter((x) => x.vacia).length;
  console.log(`Hoja «${path.basename(o.hoja)}»: plantilla ${r.plantilla}, marco en ${r.det.join(",")} (escala ${r.escala.map((v) => v.toFixed(3)).join("×")}); ${r.out.length} celdas, ${vacias} vacías`);
  if (o.prueba) return r;
  const dir = path.join(o.destino, "assets/sprites", o.cat),
    mj = path.join(o.destino, "assets/sprites/manifest.json");
  fs.mkdirSync(dir, { recursive: true });
  const man = fs.existsSync(mj) ? JSON.parse(fs.readFileSync(mj, "utf8")) : { version: 1, sprites: {} };
  man.sprites = man.sprites || {};
  for (const c of r.out) {
    if (c.vacia) continue;
    fs.writeFileSync(path.join(dir, c.nombre + ".png"), Buffer.from(c.png.split(",")[1], "base64"));
    man.sprites[c.nombre] = { png: `${o.cat}/${c.nombre}.png`, w: c.w, h: c.h, tinte: c.tinte, escala: 1 };
  }
  fs.writeFileSync(mj, JSON.stringify(man, null, 2) + "\n");
  console.log(`${r.out.length - vacias} PNG en ${path.relative(process.cwd(), dir) || dir}; manifest.json actualizado`);
  manifestJs(o.destino);
  return r;
}

module.exports = { importar };
if (require.main === module)
  importar(args()).catch((e) => {
    console.error(e);
    process.exit(1);
  });
