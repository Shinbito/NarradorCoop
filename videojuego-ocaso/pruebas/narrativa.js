/* Prueba del sistema de NARRATIVA: juega una campaña eligiendo opciones al azar y comprueba
   prólogo, ritmo (≤2 modales narrativos por año), decisiones, arcos, legado, uso por la IA,
   reacciones a eventos del juego, contenido de finales del siglo V y del VI (salto de años),
   epílogo antes del final y carga de una partida guardada sin G.nar.
   Uso:  node pruebas/narrativa.js [años=30] [civ=0]
   Capturas en pruebas/capturas/narrativa-*.png */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ANIOS = +(process.argv[2] || 30);
const CIVN = +(process.argv[3] || 0);
const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errores = [],
    fallos = [];
  const ok = (c, m) => {
    if (!c) fallos.push(m);
    console.log((c ? "  ✓ " : "  ✗ ") + m);
  };
  page.on("pageerror", (e) => errores.push("pageerror: " + (e.stack || e.message)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.g|ERR_|net::/.test(m.text())) errores.push("console: " + m.text());
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(300);

  // registra cada modal: año, título y si es un evento narrativo
  const espiar = () =>
    page.evaluate(() => {
      if (window.__esp) return;
      window.__esp = true;
      window.__mods = [];
      const m0 = modal;
      modal = function (t, h, b) {
        window.__mods.push({ y: G ? G.year : 0, t: String(t), nar: /class="nar-ev"/.test(h), html: h });
        return m0(t, h, b);
      };
    });
  await espiar();

  let fotoEvento = false;
  const abierto = () => page.evaluate(() => document.getElementById("modal").classList.contains("show"));
  const cerrarModales = async (max = 60) => {
    for (let k = 0; k < max; k++) {
      if (await page.evaluate(() => document.getElementById("battle").classList.contains("show"))) {
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('#bside button[data-act^="b-"]')].find((x) =>
            /auto|retir|huir/i.test(x.textContent),
          );
          b && b.click();
        });
        await page.waitForTimeout(150);
        continue;
      }
      if (!(await abierto())) return;
      const esEv = await page.evaluate(() => !!document.querySelector("#modalc .nar-ev"));
      if (esEv && !fotoEvento && !(await page.evaluate(() => /Prólogo/.test(document.getElementById("modalc").textContent)))) {
        fotoEvento = true;
        await page.screenshot({ path: path.join(capt, "narrativa-evento.png") });
      }
      await page.evaluate(() => {
        const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
        const auto = bs.find((b) => /autom/i.test(b.textContent));
        (auto || bs[Math.floor(Math.random() * bs.length)])?.click();
      });
      await page.waitForTimeout(80);
    }
  };
  // ejecuta startTurn en la página mientras se van cerrando los modales
  const turno = async () => {
    await page.evaluate(() => {
      window.__done = false;
      startTurn().finally(() => (window.__done = true));
    });
    for (let k = 0; k < 100 && !(await page.evaluate(() => window.__done)); k++) {
      await cerrarModales(5);
      await page.waitForTimeout(40);
    }
    await cerrarModales();
  };

  console.log("Partida nueva con la civilización " + CIVN);
  await page.click('[data-act="s-new"]');
  await page.click(`[data-act="s-civ-${CIVN}"]`);
  await page.click('[data-act="s-go"]');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => /Prólogo/.test(document.getElementById("modalc").textContent)), "prólogo al empezar");
  await page.screenshot({ path: path.join(capt, "narrativa-prologo.png") });
  await cerrarModales();
  ok(await page.evaluate(() => !!(G.nar && G.nar.f[ME] && G.nar.f[ME].ini)), "estado G.nar creado");

  for (let y = 0; y < ANIOS; y++) {
    await cerrarModales();
    if (await page.evaluate(() => !G || G.over || !alive(ME))) break;
    const fin = await page.$("#endb:not([disabled])");
    if (fin) await fin.click();
    for (let k = 0; k < 300; k++) {
      await cerrarModales(5);
      if (!(await page.evaluate(() => busy || document.getElementById("modal").classList.contains("show")))) break;
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(60);
    await cerrarModales();
    process.stdout.write(`año ${await page.evaluate(() => G.year)} `);
  }
  console.log("");
  const r1 = await page.evaluate(() => {
    const N = G.nar.f[ME],
      porAnio = {};
    for (const m of window.__mods) if (m.nar) porAnio[m.y] = (porAnio[m.y] || 0) + 1;
    const ia = [...Array(NF).keys()].filter((g) => g !== ME).reduce((s, g) => s + (G.nar.f[g]?.dec.length || 0), 0);
    return {
      anio: G.year,
      max: Math.max(0, ...Object.values(porAnio)),
      nEv: window.__mods.filter((m) => m.nar).length,
      dec: N.dec.length,
      cron: N.cron.length,
      arcos: Object.keys(N.arc).length,
      cap: Object.values(N.arc).reduce((s, A) => s + A.h.length, 0),
      leg: N.leg.pi + N.leg.gl + N.leg.cr + N.leg.sa,
      ia,
      rumores: G.log.filter((l) => /nar-/.test(l.c)).length,
      vivo: alive(ME),
    };
  });
  console.log("  resumen:", JSON.stringify(r1));
  ok(r1.max <= 2, `como mucho 2 modales narrativos por año (máx ${r1.max})`);
  ok(r1.nEv >= Math.min(8, ANIOS / 3), `hay eventos narrativos (${r1.nEv})`);
  ok(r1.dec > 3 && r1.cron > 3, `decisiones (${r1.dec}) y crónica (${r1.cron}) registradas`);
  ok(r1.arcos >= 1 && r1.cap >= 1, `arcos iniciados (${r1.arcos}) con capítulos (${r1.cap})`);
  ok(r1.leg > 0, "el legado cambia");
  ok(r1.ia > 0, `la IA usa los eventos (${r1.ia} decisiones)`);
  ok(r1.rumores > 0, "la crónica recibe prosa narrativa");

  // pestaña Anales y crónica
  await page.click('[data-act="tab-nar"]');
  await page.waitForTimeout(100);
  await page.evaluate(() => document.querySelectorAll("#panel details").forEach((d) => (d.open = true)));
  ok(await page.evaluate(() => /Legado/.test(document.getElementById("panel").textContent)), "pestaña Anales con legado");
  await page.screenshot({ path: path.join(capt, "narrativa-anales.png") });
  await page.click('[data-act="tab-log"]');
  await page.screenshot({ path: path.join(capt, "narrativa-cronica.png") });
  await page.click('[data-act="tab-prov"]');

  // reacciones: perder la capital, sucesión
  if (await page.evaluate(() => alive(ME) && !G.over)) {
    const q = await page.evaluate(() => {
      const p = G.P[G.F[ME].capId],
        a = ME === 3 ? 4 : 3;
      OC.emitirSync("conquista", { p, de: ME, a });
      return G.nar.f[ME].cola.map((x) => x.e);
    });
    ok(q.includes("exilio"), "perder la capital encola «La corte en el exilio»");
    const rey0 = await page.evaluate(() => {
      const r = ruler(ME),
        n = G.nar.f[ME].reyes.length;
      kill(r, "muere de pruebas");
      OC.emitirSync("finAnio", G.year);
      return n;
    });
    await cerrarModales();
    const suc = await page.evaluate(() => ({ n: G.nar.f[ME].reyes.length, cola: G.nar.f[ME].cola.map((x) => x.e) }));
    ok(suc.n === rey0 + 1 && suc.cola.includes("coronacion"), "la sucesión se registra y encola la coronación");
    await page.evaluate(() => {
      G.evY[ME] = 0;
      window.__mods.length = 0;
    });
    await turno();
    const vistos = await page.evaluate(() => window.__mods.map((m) => m.t));
    ok(vistos.includes("Una nueva corona") || vistos.includes("La corte en el exilio"), "las reacciones se muestran al empezar el año: " + vistos.join(" | "));
  }

  // salto de años: contenido de finales del siglo V y del VI
  const tard = await page.evaluate(() => {
    for (const p of G.P) if (p.owner === ME) p.u.i = Math.max(p.u.i, 6);
    return true;
  });
  const vistosTarde = new Set();
  for (const y of [455, 470, 476, 490, 500, 505, 510, 527, 533, 536, 541, 552, 560, 568, 590]) {
    if (await page.evaluate(() => !alive(ME) || G.over)) break;
    await page.evaluate((y) => {
      G.year = y;
      G.evY[ME] = 0;
      G.F[ME].gold = Math.max(G.F[ME].gold, 300);
      G.F[ME].food = Math.max(G.F[ME].food, 100);
      window.__mods.length = 0;
    }, y);
    await turno();
    (await page.evaluate(() => window.__mods.filter((m) => m.nar).map((m) => m.y + " " + m.t))).forEach((t) => vistosTarde.add(t));
  }
  console.log("  tardíos:", [...vistosTarde].join(" | "));
  ok(tard && [...vistosTarde].some((t) => +t.slice(0, 3) >= 500), "hay contenido narrativo a partir del año 500");
  const arcs = await page.evaluate(() => Object.keys(G.nar.f[ME].arc));
  ok(arcs.length >= 4, "arcos tocados tras el salto: " + arcs.join(", "));

  // epílogo antes de la victoria
  await page.evaluate(() => {
    window.__mods.length = 0;
    G.over = null;
    const need = Math.ceil(G.P.length * 0.6);
    for (const p of G.P.slice(0, need + 1)) p.owner = ME;
    OC.emitirSync("finAnio", G.year);
    checkEnd();
  });
  await page.waitForTimeout(150);
  const orden = await page.evaluate(() => window.__mods.map((m) => m.t));
  ok(/^Epílogo/.test(orden[0] || "") && orden.some((t) => /Victoria/.test(t)), "epílogo antes del final: " + orden.join(" | "));
  await page.screenshot({ path: path.join(capt, "narrativa-epilogo.png") });
  await cerrarModales();

  // partida guardada antigua (sin G.nar) sigue cargando
  await page.evaluate(() => {
    G.over = null;
    const g = JSON.parse(JSON.stringify(G));
    delete g.nar;
    g.evY = {};
    localStorage.setItem("ocaso-save", JSON.stringify({ G: g, ME }));
  });
  await page.reload();
  await page.waitForTimeout(300);
  await espiar();
  await page.click('[data-act="s-cnt"]');
  await page.waitForTimeout(400);
  await cerrarModales();
  const carga = await page.evaluate(() => ({ nar: !!G.nar, ini: G.nar && G.nar.f[ME].ini, prologo: window.__mods.some((m) => /Prólogo/.test(m.html)) }));
  ok(carga.nar && carga.ini && !carga.prologo, "una partida antigua carga, crea G.nar y no repite el prólogo");
  await page.click('[data-act="tab-nar"]');
  ok(await page.evaluate(() => /Anales/.test(document.getElementById("panel").textContent)), "Anales tras cargar");

  console.log(errores.length ? "ERRORES:\n" + errores.join("\n") : "Sin errores de JS");
  console.log(fallos.length ? "FALLOS:\n" + fallos.join("\n") : "OK narrativa");
  await browser.close();
  process.exit(errores.length || fallos.length ? 1 : 0);
})();
