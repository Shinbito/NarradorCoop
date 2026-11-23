/* Prueba de humo: abre el juego, empieza una campaña, recorre todas las pestañas,
   juega varios años (eligiendo siempre la primera opción de cada evento y
   resolviendo las batallas automáticamente) y falla si hay errores de JS.
   Uso:  node pruebas/humo.js [años=12] [civ=0]
   Requiere Playwright (preinstalado en el entorno). Guarda capturas en pruebas/capturas/. */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ANIOS = +(process.argv[2] || 12);
const CIVN = +(process.argv[3] || 0);
const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errores = [];
  page.on("pageerror", (e) => errores.push("pageerror: " + (e.stack || e.message)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.g|ERR_|net::/.test(m.text())) errores.push("console: " + m.text());
  });
  // sin red: las fuentes de Google no cargan, no importa
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(300);

  const clic = async (sel) => {
    await page.click(sel, { timeout: 4000 });
    await page.waitForTimeout(60);
  };
  // modal abierto: pulsa la primera opción (en batallas, la resolución automática)
  const cerrarModales = async () => {
    for (let k = 0; k < 40; k++) {
      const abierto = await page.evaluate(() => document.getElementById("modal").classList.contains("show"));
      const batalla = await page.evaluate(() => document.getElementById("battle").classList.contains("show"));
      if (batalla) {
        // batalla táctica abierta por error: huir/auto
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('#bside button[data-act^="b-"]')].find((x) =>
            /auto|retir|huir/i.test(x.textContent),
          );
          b && b.click();
        });
        await page.waitForTimeout(200);
        continue;
      }
      if (!abierto) return;
      await page.evaluate(() => {
        const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
        const auto = bs.find((b) => /autom/i.test(b.textContent));
        (auto || bs[0])?.click();
      });
      await page.waitForTimeout(120);
    }
  };

  await clic('[data-act="s-new"]');
  await clic(`[data-act="s-civ-${CIVN}"]`);
  await clic('[data-act="s-go"]');
  await page.waitForTimeout(300);
  await cerrarModales();

  // recorrer todas las pestañas
  const tabs = await page.$$eval("#tabs button", (bs) => bs.map((b) => b.dataset.act));
  for (const t of tabs) {
    await clic(`[data-act="${t}"]`);
    await page.screenshot({ path: path.join(capt, `pestana-${t}.png`) });
  }
  await clic('[data-act="tab-prov"]');

  for (let y = 0; y < ANIOS; y++) {
    await cerrarModales();
    // el jugador hace algo: reclutar y atacar si puede (IA simple vía API del juego)
    await page.evaluate(() => {
      try {
        if (typeof G === "undefined" || !G || G.over) return;
        const mine = owned(ME);
        for (const p of mine) {
          const b = document.querySelector('[data-act^="rec-"]:not([disabled])');
          sel = p.id;
          ui();
          b && b.click();
        }
      } catch (e) {
        console.error("humo-accion", e);
      }
    });
    const fin = await page.$('#endb:not([disabled])');
    if (fin) await fin.click();
    // esperar a que termine el año
    for (let k = 0; k < 200; k++) {
      await cerrarModales();
      const ocupado = await page.evaluate(() => typeof busy !== "undefined" && busy);
      if (!ocupado) break;
      await page.waitForTimeout(100);
    }
    const anio = await page.evaluate(() => G && G.year);
    process.stdout.write(`año ${anio} `);
    if (await page.evaluate(() => !G || G.over)) break;
  }
  await cerrarModales();
  await page.screenshot({ path: path.join(capt, "final.png") });
  // guardar/cargar
  await page.evaluate(() => save());
  const ok = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("ocaso-save"));
    return !!(s && s.G && s.G.year);
  });
  if (!ok) errores.push("la partida no se guardó");
  console.log("\n" + (errores.length ? "ERRORES:\n" + errores.join("\n") : "OK sin errores"));
  await browser.close();
  process.exit(errores.length ? 1 : 0);
})();
