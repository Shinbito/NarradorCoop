/* Exporta TODOS los gráficos del juego a PNG para rediseñarlos (p. ej. con Gemini) y volver a cargarlos
   con herramientas/importar-hoja.js (ver herramientas/LEEME.md y docs/interfaz.md §5).

   Uso (Node + Playwright, desde la carpeta videojuego-ocaso):
     node herramientas/exportar-sprites.js [carpeta=assets/sprites/originales]
       → <carpeta>/<categoría>/<nombre>.png       cada gráfico a su tamaño real (1 px = 1 px del juego)
         <carpeta>/<categoría>/<nombre>@8x.png    ×8 sin suavizado
         <carpeta>/muestras/<nombre>@8x.png       los teñibles, pintados con el color de Occidente
         <carpeta>/hojas/<categoría>@8x.png|.json hoja de cada categoría con rejilla, marco dorado y
                                                  etiquetas, y su plantilla (dónde está cada celda)
         <carpeta>/hojas/atlas@4x.png|.json       el kit de mapa también a ×4
         <carpeta>/renders/mapa-*.png             mapas completos de referencia (histórico y leyendas)
         <carpeta>/manifest.plantilla.json        todas las entradas, listas para manifest.json
     node herramientas/exportar-sprites.js --manifest [carpeta del juego]
       → regenera assets/sprites/manifest.js a partir de assets/sprites/manifest.json, con los PNG
         incrustados en base64 (para jugar abriendo index.html desde file://).

   Categorías: tropas, batalla, mapa, ejercito, naturaleza, ciudad, interfaz, terreno, escena y atlas
   (el KIT DE MAPA: suelos, agua, costa, ríos, caminos, puentes, ciudades, murallas, edificios…).
   Los teñibles se exportan en «plantilla»: #ff00ff = color del pueblo, #800080 = su tono oscuro. */
const path = require("path");
const fs = require("fs");
const RAIZ = path.resolve(__dirname, "..");
/* aspecto de las hojas (lo lee también importar-hoja.js) */
const HOJA = { fondo: "#12171c", celda: "#00b4b4", marco: "#f2c14e", rejilla: "#3a4752", etiqueta: "#ffffff" };

/* manifest.js con los PNG incrustados, a partir de manifest.json */
function manifestJs(raiz = RAIZ) {
  const mj = path.join(raiz, "assets/sprites/manifest.json"),
    m = JSON.parse(fs.readFileSync(mj, "utf8")),
    out = { version: m.version || 1, sprites: {} };
  let n = 0;
  const faltan = [];
  for (const [nombre, e] of Object.entries(m.sprites || {})) {
    const f = e.png && path.join(raiz, "assets/sprites", e.png);
    if (!f || !fs.existsSync(f)) {
      faltan.push(nombre + " (" + (e.png || "sin png") + ")");
      continue;
    }
    out.sprites[nombre] = { ...e, datos: "data:image/png;base64," + fs.readFileSync(f).toString("base64") };
    n++;
  }
  const txt =
    "/* Generado por herramientas/exportar-sprites.js --manifest (o importar-hoja.js) a partir de manifest.json:\n" +
    "   no editar a mano. Sirve para jugar desde file://, donde fetch no puede leer manifest.json. Ver docs/interfaz.md. */\n" +
    "var OCASO_SPRITES = " +
    JSON.stringify(out) +
    ";\n";
  fs.writeFileSync(path.join(raiz, "assets/sprites/manifest.js"), txt);
  console.log(`manifest.js: ${n} sprites incrustados${faltan.length ? "; faltan: " + faltan.join(", ") : ""}`);
  return n;
}

/* abre el juego en un navegador sin cabeza con una partida empezada (modo y pueblos a elegir) */
async function abrirJuego(browser, raiz = RAIZ, opc = { modo: "leyendas", todas: true }) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  page.__errores = [];
  page.on("pageerror", (e) => page.__errores.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.evaluate(() => localStorage.clear());
  await page.evaluate((opc) => {
    if (opc.modo === "leyendas") newGame(0, cands(0)[0], { modo: "leyendas", activas: opc.todas ? [...Array(NF).keys()] : [0, 1, 2, 3, 7, 8, 9] });
    else newGame(0, cands(0)[0], { modo: "historico" });
    drawBase();
    OC.emitirSync("partidaLista");
    $("start").classList.remove("show");
    if (typeof IFZ !== "undefined") {
      IFZ.pref.tut = 99;
      if (G.cam) G.cam.niebla = false;
    }
    ui();
  }, opc);
  return page;
}

/* compone una hoja: celdas sobre fondo plano, rejilla, etiquetas y un marco dorado para que la
   importación encuentre la hoja aunque vuelva movida o reescalada. Devuelve {png, plantilla}. */
async function componerHoja(page, cat, nombres, esc) {
  return page.evaluate(
    ({ cat, nombres, esc, HOJA }) => {
      const catal = new Map(ifzSprCatalogo().map((s) => [s.nombre, s])),
        its = nombres.map((n) => {
          const s = catal.get(n),
            cv = ifzSprRender(n, esc, "plantilla");
          /* sin semitransparencias en la hoja: cada píxel o se ve entero o es fondo (así se recorta bien) */
          if (cv.width && cv.height) {
            const g = cv.getContext("2d"),
              d = g.getImageData(0, 0, cv.width, cv.height);
            for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] >= 110 ? 255 : 0;
            g.putImageData(d, 0, 0);
          }
          return { nombre: n, cv, wPx: s.w, hPx: s.h, tinte: !!s.tinte, opaco: !!s.opaco, grupo: s.grupo || cat };
        }),
        tmp = document.createElement("canvas").getContext("2d");
      tmp.font = "12px monospace";
      const M = 28,
        G = 14,
        LB = 18,
        maxW = Math.max(900, Math.min(2400, Math.max(...its.map((i) => i.cv.width)) * 6));
      let x = M,
        y = M,
        fila = 0,
        grupo = its[0] && its[0].grupo,
        anchoMax = 0;
      const pos = [];
      for (const it of its) {
        const sw = Math.max(it.cv.width, Math.ceil(tmp.measureText(it.nombre).width) + 2);
        /* nueva fila: no cabe o cambia el grupo (en el atlas, cada grupo empieza fila) */
        if ((x + sw > M + maxW && x > M) || (it.grupo !== grupo && x > M)) {
          x = M;
          y += fila + LB + G;
          fila = 0;
        }
        grupo = it.grupo;
        pos.push({ it, x, y, sw });
        x += sw + G;
        anchoMax = Math.max(anchoMax, x);
        fila = Math.max(fila, it.cv.height);
      }
      const Wt = anchoMax - G + M,
        Ht = y + fila + LB + M,
        c = document.createElement("canvas");
      c.width = Wt;
      c.height = Ht;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.fillStyle = HOJA.fondo;
      g.fillRect(0, 0, Wt, Ht);
      g.font = "12px monospace";
      g.textBaseline = "top";
      const items = [];
      for (const { it, x, y } of pos) {
        g.fillStyle = HOJA.rejilla;
        g.fillRect(x - 2, y - 2, it.cv.width + 4, it.cv.height + 4);
        g.fillStyle = HOJA.celda;
        g.fillRect(x, y, it.cv.width, it.cv.height);
        g.drawImage(it.cv, x, y);
        g.fillStyle = HOJA.etiqueta;
        g.fillText(it.nombre, x, y + it.cv.height + 4);
        items.push({ nombre: it.nombre, x, y, w: it.cv.width, h: it.cv.height, wPx: it.wPx, hPx: it.hPx, tinte: it.tinte, opaco: it.opaco });
      }
      /* marco dorado de 4 px a 8 px del borde: la importación lo busca para encajar la hoja */
      const m0 = 8,
        mw = 4;
      g.fillStyle = HOJA.marco;
      g.fillRect(m0, m0, Wt - 2 * m0, mw);
      g.fillRect(m0, Ht - m0 - mw, Wt - 2 * m0, mw);
      g.fillRect(m0, m0, mw, Ht - 2 * m0);
      g.fillRect(Wt - m0 - mw, m0, mw, Ht - 2 * m0);
      return {
        png: c.toDataURL(),
        plantilla: { version: 1, categoria: cat, escala: esc, ancho: Wt, alto: Ht, marco: [m0, m0, Wt - m0 - 1, Ht - m0 - 1], colores: HOJA, items },
      };
    },
    { cat, nombres, esc, HOJA },
  );
}

const b64 = (u) => Buffer.from(u.split(",")[1], "base64");

async function exportar(dest) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await abrirJuego(browser);
  const cat = await page.evaluate(() => ifzSprCatalogo());
  const datos = await page.evaluate(
    (cat) =>
      cat.map((s) => ({
        ...s,
        x1: ifzSprRender(s.nombre, 1, "plantilla").toDataURL(),
        x8: ifzSprRender(s.nombre, 8, "plantilla").toDataURL(),
        m8: s.tinte && !s.nombre.startsWith("MAPA.") ? ifzSprRender(s.nombre, 8, "muestra", 0).toDataURL() : null,
      })),
    cat,
  );
  const plantilla = { version: 1, sprites: {} };
  for (const s of datos) {
    const dir = path.join(dest, s.cat);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, s.nombre + ".png"), b64(s.x1));
    fs.writeFileSync(path.join(dir, s.nombre + "@8x.png"), b64(s.x8));
    if (s.m8) {
      fs.mkdirSync(path.join(dest, "muestras"), { recursive: true });
      fs.writeFileSync(path.join(dest, "muestras", s.nombre + "@8x.png"), b64(s.m8));
    }
    plantilla.sprites[s.nombre] = {
      png: `${s.cat}/${s.nombre}.png`,
      w: s.w,
      h: s.h,
      tinte: s.tinte,
      escala: 1,
      ...(s.alias ? { nota: `hoy usa el mismo dibujo que ${s.alias}` } : {}),
    };
  }
  /* hojas por categoría (×8; el atlas también ×4), con su plantilla de rejilla */
  const cats = [...new Set(datos.map((s) => s.cat))];
  fs.mkdirSync(path.join(dest, "hojas"), { recursive: true });
  for (const c of cats) {
    const nombres = datos.filter((s) => s.cat === c).map((s) => s.nombre);
    for (const esc of c === "atlas" ? [4, 8] : c === "escena" ? [4] : [8]) {
      const h = await componerHoja(page, c, nombres, esc);
      fs.writeFileSync(path.join(dest, "hojas", `${c}@${esc}x.png`), b64(h.png));
      fs.writeFileSync(path.join(dest, "hojas", `${c}@${esc}x.json`), JSON.stringify(h.plantilla, null, 1) + "\n");
    }
  }
  fs.writeFileSync(path.join(dest, "manifest.plantilla.json"), JSON.stringify(plantilla, null, 2) + "\n");
  /* mapas completos de referencia */
  fs.mkdirSync(path.join(dest, "renders"), { recursive: true });
  const render = async (pg, nombre, k, recorte) => {
    const url = await pg.evaluate(
      ({ k, recorte }) => {
        ifzAjustarHD();
        drawMap(performance.now());
        const [x0, y0, w0, h0] = recorte ? [hd.width * 0.3, hd.height * 0.3, hd.width * 0.3, hd.height * 0.3].map(Math.round) : [0, 0, hd.width, hd.height],
          c = document.createElement("canvas");
        c.width = w0 * k;
        c.height = h0 * k;
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(hd, x0, y0, w0, h0, 0, 0, c.width, c.height);
        return c.toDataURL();
      },
      { k, recorte },
    );
    fs.writeFileSync(path.join(dest, "renders", nombre), b64(url));
  };
  await render(page, "mapa-leyendas.png", 1);
  const ph = await abrirJuego(browser, RAIZ, { modo: "historico" });
  await render(ph, "mapa-historico.png", 2);
  await render(ph, "mapa-historico-detalle.png", 4, true);
  const errores = [...page.__errores, ...ph.__errores];
  await browser.close();
  console.log(`${datos.length} gráficos exportados en ${path.relative(process.cwd(), dest) || dest} (${cats.join(", ")}); hojas en hojas/, mapas de referencia en renders/`);
  if (errores.length) {
    console.log("Errores de la página:\n" + errores.join("\n"));
    process.exitCode = 1;
  }
}

module.exports = { manifestJs, abrirJuego, componerHoja, HOJA, RAIZ };

if (require.main === module)
  (async () => {
    const a = process.argv.slice(2);
    if (a.includes("--manifest")) return manifestJs(a[a.indexOf("--manifest") + 1] ? path.resolve(a[a.indexOf("--manifest") + 1]) : RAIZ);
    await exportar(path.resolve(a[0] || path.join(RAIZ, "assets/sprites/originales")));
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
