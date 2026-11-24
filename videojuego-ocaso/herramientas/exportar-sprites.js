/* Exporta TODOS los sprites del juego a PNG para poder rediseñarlos (p. ej. con Gemini) y volver a
   cargarlos con el manifest (ver docs/interfaz.md, «Sprites reemplazables»).

   Uso (Node + Playwright, desde la carpeta videojuego-ocaso):
     node herramientas/exportar-sprites.js [carpeta=assets/sprites/originales]
         → <carpeta>/<categoría>/<nombre>.png      tamaño original (1 px = 1 px del juego)
           <carpeta>/<categoría>/<nombre>@8x.png   ×8 sin suavizado (para editar cómodo)
           <carpeta>/muestras/<nombre>@8x.png      los teñibles, pintados con el color de Occidente
           <carpeta>/hojas/<categoría>.png          hoja de sprites por categoría (×8, con nombres)
           <carpeta>/manifest.plantilla.json        todas las entradas, listas para copiar a manifest.json
     node herramientas/exportar-sprites.js --manifest
         → regenera assets/sprites/manifest.js a partir de assets/sprites/manifest.json, con los PNG
           incrustados en base64 (para jugar abriendo index.html desde file://).

   Los sprites teñibles se exportan en «plantilla»: #ff00ff = color del pueblo, #800080 = su tono
   oscuro. El juego los repinta con el color de cada pueblo (también los tonos intermedios). */
const path = require("path");
const fs = require("fs");
const raiz = path.resolve(__dirname, "..");

async function manifestJs() {
  const mj = path.join(raiz, "assets/sprites/manifest.json"),
    m = JSON.parse(fs.readFileSync(mj, "utf8")),
    out = { version: m.version || 1, sprites: {} };
  let n = 0,
    faltan = [];
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
    "/* Generado por herramientas/exportar-sprites.js --manifest a partir de manifest.json (no editar a mano).\n" +
    "   Sirve para jugar desde file://, donde fetch no puede leer manifest.json. Ver docs/interfaz.md. */\n" +
    "var OCASO_SPRITES = " +
    JSON.stringify(out) +
    ";\n";
  fs.writeFileSync(path.join(raiz, "assets/sprites/manifest.js"), txt);
  console.log(`manifest.js: ${n} sprites incrustados${faltan.length ? "; faltan: " + faltan.join(", ") : ""}`);
}

async function exportar(dest) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.evaluate(() => localStorage.clear());
  /* partida de leyendas con todos los pueblos: así existen también los tipos de mercenario */
  await page.evaluate(() => {
    ST.modo = "leyendas";
    newGame(0, cands(0)[0], { modo: "leyendas", activas: [...Array(NF).keys()] });
    drawBase();
    OC.emitirSync("partidaLista");
    $("start").classList.remove("show");
  });
  const cat = await page.evaluate(() => ifzSprCatalogo());
  const datos = await page.evaluate(
    (cat) =>
      cat.map((s) => ({
        ...s,
        x1: ifzSprRender(s.nombre, 1, "plantilla").toDataURL(),
        x8: ifzSprRender(s.nombre, 8, "plantilla").toDataURL(),
        m8: s.tinte ? ifzSprRender(s.nombre, 8, "muestra", 0).toDataURL() : null,
      })),
    cat,
  );
  const esc = (u) => Buffer.from(u.split(",")[1], "base64");
  const plantilla = { version: 1, sprites: {} };
  for (const s of datos) {
    const dir = path.join(dest, s.cat);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, s.nombre + ".png"), esc(s.x1));
    fs.writeFileSync(path.join(dir, s.nombre + "@8x.png"), esc(s.x8));
    if (s.m8) {
      fs.mkdirSync(path.join(dest, "muestras"), { recursive: true });
      fs.writeFileSync(path.join(dest, "muestras", s.nombre + "@8x.png"), esc(s.m8));
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
  /* hojas por categoría: rejilla ×8 con el nombre debajo de cada sprite */
  const cats = [...new Set(datos.map((s) => s.cat))];
  for (const c of cats) {
    const url = await page.evaluate(
      ({ c, ns }) => {
        const k = c === "escena" ? 2 : c === "terreno" ? 8 : 6,
          ims = ns.map((n) => ({ n, cv: ifzSprRender(n, k, "plantilla") })),
          col = Math.max(1, Math.min(8, Math.floor(1600 / (Math.max(...ims.map((i) => i.cv.width)) + 24)))),
          cw = Math.max(120, ...ims.map((i) => i.cv.width)) + 16,
          ch = Math.max(...ims.map((i) => i.cv.height)) + 30,
          h = document.createElement("canvas");
        h.width = col * cw;
        h.height = Math.ceil(ims.length / col) * ch;
        const x = h.getContext("2d");
        x.imageSmoothingEnabled = false;
        x.fillStyle = "#12171c";
        x.fillRect(0, 0, h.width, h.height);
        x.font = "11px monospace";
        x.textBaseline = "top";
        ims.forEach((im, i) => {
          const X = (i % col) * cw + 8,
            Y = Math.floor(i / col) * ch + 6;
          x.fillStyle = "#1e262d";
          x.fillRect(X - 2, Y - 2, im.cv.width + 4, im.cv.height + 4);
          x.drawImage(im.cv, X, Y);
          x.fillStyle = "#f2c14e";
          x.fillText(im.n, X, Y + im.cv.height + 6);
        });
        return h.toDataURL();
      },
      { c, ns: datos.filter((s) => s.cat === c).map((s) => s.nombre) },
    );
    fs.mkdirSync(path.join(dest, "hojas"), { recursive: true });
    fs.writeFileSync(path.join(dest, "hojas", c + ".png"), esc(url));
  }
  fs.writeFileSync(path.join(dest, "manifest.plantilla.json"), JSON.stringify(plantilla, null, 2) + "\n");
  await browser.close();
  console.log(`${datos.length} sprites exportados en ${path.relative(process.cwd(), dest) || dest} (${cats.join(", ")})`);
  if (errores.length) {
    console.log("Errores de la página:\n" + errores.join("\n"));
    process.exit(1);
  }
}

(async () => {
  const a = process.argv.slice(2);
  if (a.includes("--manifest")) return manifestJs();
  await exportar(path.resolve(a[0] || path.join(raiz, "assets/sprites/originales")));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
