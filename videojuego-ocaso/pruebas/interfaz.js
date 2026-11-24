/* Prueba del sistema INTERFAZ: barra superior, pestañas (ratón y teclado), panel de provincia con sus
   secciones plegables, crónica con filtros, potencias, hover del mapa, modales (cola, foco, Tab,
   Escape), ayuda y tutorial, rendimiento de ui(), sprites PNG por manifest y partida antigua.
   Se repite en escritorio (1400×900) y en móvil (390×844, isMobile) midiendo desbordamientos.
   Uso:  node pruebas/interfaz.js
   Capturas: pruebas/capturas/interfaz-*.png */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });
let fallos = 0;
const ok = (c, m) => {
  console.log((c ? "  ✓ " : "  ✗ ") + m);
  if (!c) fallos++;
};

async function nueva(browser, vp, movil, errores) {
  const page = await browser.newPage({ viewport: vp, isMobile: movil, hasTouch: movil, deviceScaleFactor: movil ? 2 : 1 });
  page.on("pageerror", (e) => errores.push("pageerror: " + (e.stack || e.message)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.g|ERR_|net::/.test(m.text())) errores.push("console: " + m.text());
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(200);
  return page;
}
/* cierra modales eligiendo la primera opción (o la resolución automática en batallas) */
async function cerrarModales(page) {
  for (let k = 0; k < 40; k++) {
    const est = await page.evaluate(() => ({
      m: document.getElementById("modal").classList.contains("show"),
      b: document.getElementById("battle").classList.contains("show"),
    }));
    if (est.b) {
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('#bside button[data-act^="b-"]')].find((x) => /auto|retir|huir/i.test(x.textContent));
        b && b.click();
      });
      await page.waitForTimeout(150);
      continue;
    }
    if (!est.m) return;
    await page.evaluate(() => {
      const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
      (bs.find((b) => /autom/i.test(b.textContent)) || bs[0])?.click();
    });
    await page.waitForTimeout(100);
  }
}
/* desbordamiento horizontal: del documento y del panel (y del elemento más ancho dentro) */
const medirAncho = (page) =>
  page.evaluate(() => {
    const pn = document.getElementById("panel"),
      peor = [...pn.querySelectorAll("*")]
        .filter((e) => e.offsetParent !== null)
        .map((e) => ({ e, d: e.getBoundingClientRect().right - pn.getBoundingClientRect().right }))
        .sort((a, b) => b.d - a.d)[0];
    return {
      doc: document.documentElement.scrollWidth - innerWidth,
      panel: pn.scrollWidth - pn.clientWidth,
      peor: peor && peor.d > 1 ? `${peor.e.tagName.toLowerCase()}.${peor.e.className} +${Math.round(peor.d)}px` : "",
    };
  });

async function recorrido(browser, nom, vp, movil) {
  console.log(`\n== ${nom} (${vp.width}×${vp.height}${movil ? ", móvil" : ""})`);
  const errores = [];
  const page = await nueva(browser, vp, movil, errores);
  const pre = `interfaz-${nom}-`;

  /* ---------- pantalla de inicio ---------- */
  await page.screenshot({ path: path.join(capt, pre + "inicio.png") });
  ok(await page.$('#startc [data-act="ifzayuda"]'), "la pantalla de inicio ofrece «¿Cómo se juega?»");
  await page.click('[data-act="s-new"]');
  await page.screenshot({ path: path.join(capt, pre + "pueblos.png") });
  await page.click('[data-act="s-modo-leyendas"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(capt, pre + "pueblos-leyendas.png") });
  const anchoInicio = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(anchoInicio <= 0, `inicio sin desbordamiento horizontal (${anchoInicio}px)`);
  await page.click('[data-act="s-modo-historico"]');
  await page.click('[data-act="s-civ-0"]');
  await page.click('[data-act="s-go"]');
  await page.waitForTimeout(300);
  if (await page.evaluate(() => document.getElementById("modal").classList.contains("show")))
    await page.screenshot({ path: path.join(capt, pre + "modal.png") });
  await cerrarModales(page);

  /* ---------- barra superior ---------- */
  const barra = await page.evaluate(() => {
    const r = ecoResumen(ME),
      oro = r.find((x) => x.id === "oro"),
      t = document.getElementById("res").textContent;
    return {
      t,
      est: t.includes(CAM_EST[G.estacion]),
      oro: t.includes(String(G.F[ME].gold)) && t.includes((inc(ME).g > 0 ? "+" : inc(ME).g < 0 ? "−" : "±") + Math.abs(inc(ME).g)),
      sig: oro.anual === inc(ME).g,
      fin: document.getElementById("endb").textContent,
      finOk: document.getElementById("endb").textContent === camTextoFin(),
    };
  });
  ok(barra.est, "la barra muestra la estación: " + barra.t.slice(0, 40));
  ok(barra.oro && barra.sig, "oro con su saldo neto anual con signo (inc(ME).g)");
  ok(barra.finOk, `el botón de fin lo decide ui() con camTextoFin(): «${barra.fin}»`);
  await page.click('[data-act="ifzres"]');
  const resd = await page.evaluate(() => document.querySelectorAll("#ifzresd tbody tr").length);
  ok(resd === OC_N(), `el desplegable de recursos lista todos (${resd})`);
  await page.screenshot({ path: path.join(capt, pre + "recursos.png") });
  await page.keyboard.press("Escape");
  ok(!(await page.$("#ifzresd")), "Escape cierra el desplegable de recursos");

  /* ---------- tutorial ---------- */
  ok(await page.evaluate(() => !document.getElementById("ifztut").hidden), "el tutorial aparece en la primera partida");

  /* ---------- panel de provincia ---------- */
  const prov = await page.evaluate(() => {
    G.F[ME].gold = 500;
    sel = G.F[ME].capId;
    tab = "prov";
    ui();
    const p = G.P[sel],
      n = TYP.filter((t) => p.u[t] > 0).length;
    return {
      chips: document.querySelectorAll("#panel .ifz-tropas > div").length,
      n,
      secs: [...document.querySelectorAll("#panel details.ifz-sec")].map((d) => d.dataset.ifzsec),
      abiertas: [...document.querySelectorAll("#panel details.ifz-sec[open]")].map((d) => d.dataset.ifzsec),
      cab: !!document.querySelector("#panel .ifz-pcab .ifz-chip"),
    };
  });
  ok(prov.chips === prov.n, `la rejilla de tropas solo muestra las clases que hay (${prov.chips}/${prov.n})`);
  ok(prov.cab, "cabecera compacta con ánimo y perfil de la ciudad");
  ok(["reclutar", "edificios", "animo", "impuestos", "ejercito"].every((k) => prov.secs.includes(k)), "secciones plegables: " + prov.secs.join(", "));
  ok(prov.abiertas.includes("reclutar") && prov.abiertas.includes("edificios"), "Reclutar y Edificios abiertas por defecto");
  await page.screenshot({ path: path.join(capt, pre + "provincia.png"), fullPage: true });
  /* abrir y cerrar con memoria */
  await page.evaluate(() => {
    const s = document.querySelector('#panel details[data-ifzsec="animo"] > summary');
    s.scrollIntoView();
  });
  await page.click('#panel details[data-ifzsec="animo"] > summary');
  await page.evaluate(() => ui());
  ok(await page.evaluate(() => document.querySelector('#panel details[data-ifzsec="animo"]').open && JSON.parse(localStorage.getItem("ocaso-ifz")).sec.animo === true), "una sección abierta se recuerda tras redibujar (y en localStorage)");
  /* todas abiertas: sin desbordamiento */
  await page.evaluate(() => {
    document.querySelectorAll("#panel details").forEach((d) => (d.open = true));
  });
  let an = await medirAncho(page);
  ok(an.doc <= 0 && an.panel <= 0 && !an.peor, `provincia con todo abierto sin desbordamiento (doc ${an.doc}, panel ${an.panel}${an.peor ? ", " + an.peor : ""})`);
  await page.screenshot({ path: path.join(capt, pre + "provincia-abierta.png"), fullPage: true });
  /* provincia ajena */
  await page.evaluate(() => {
    sel = G.P.find((q) => q.owner !== ME && q.owner < NF).id;
    ui();
  });
  an = await medirAncho(page);
  ok(!(await page.evaluate(() => /Error al mostrar/.test(document.getElementById("panel").innerHTML))) && an.panel <= 0, "provincia ajena sin errores ni desbordamiento");

  /* ---------- todas las pestañas ---------- */
  const tabs = await page.$$eval("#tabs button", (bs) => bs.map((b) => b.dataset.act));
  ok(tabs.length >= 8, `pestañas: ${tabs.map((t) => t.slice(4)).join(", ")}`);
  const tabsH = await page.evaluate(() => {
    const t = document.getElementById("tabs").getBoundingClientRect(),
      b = [...document.querySelectorAll("#tabs button")].map((x) => x.getBoundingClientRect());
    return { filas: new Set(b.map((r) => Math.round(r.top))).size, ancho: document.getElementById("tabs").scrollWidth - t.width, alto: Math.min(...b.map((r) => r.height)), anchoMin: Math.min(...b.map((r) => r.width)) };
  });
  ok(tabsH.filas <= 2 && tabsH.ancho <= 1, `las pestañas caben en ${tabsH.filas} filas sin desbordar`);
  ok(tabsH.alto >= 40 && tabsH.anchoMin >= 40, `pestañas táctiles de al menos 40px (${Math.round(tabsH.anchoMin)}×${Math.round(tabsH.alto)})`);
  for (const t of tabs) {
    await page.click(`#tabs [data-act="${t}"]`);
    await page.evaluate(() => document.querySelectorAll("#panel details").forEach((d) => (d.open = true)));
    const r = await medirAncho(page);
    const err = await page.evaluate(() => /Error al mostrar/.test(document.getElementById("panel").innerHTML));
    ok(!err && r.doc <= 0 && r.panel <= 0 && !r.peor, `${t.slice(4)}: sin error ni desbordamiento (panel ${r.panel}${r.peor ? ", " + r.peor : ""})`);
    await page.locator("aside").screenshot({ path: path.join(capt, pre + "tab-" + t.slice(4) + ".png") });
  }
  /* teclado: flechas entre pestañas */
  await page.click('#tabs [data-act="tab-prov"]');
  await page.focus("#tabb-prov");
  await page.keyboard.press("ArrowRight");
  const tk = await page.evaluate(() => ({ tab, foco: document.activeElement.id, sel: document.activeElement.getAttribute("aria-selected") }));
  ok(tk.tab !== "prov" && tk.foco === "tabb-" + tk.tab && tk.sel === "true", `flecha → cambia de pestaña y conserva el foco (${tk.tab})`);
  await page.keyboard.press("Home");
  ok((await page.evaluate(() => tab)) === "prov", "Inicio vuelve a la primera pestaña");

  /* ---------- crónica ---------- */
  await page.evaluate(() => {
    for (let k = 0; k < 6; k++) addLog("Batalla de prueba en la frontera.", k % 2 ? "bad" : "good");
    addLog(`Año ${G.year + 1} d.C.`, "turn");
    addLog("Rumores en el mercado.", "nar-rumor");
    addLog(`Boda en la corte de ${CIV[ME].s}.`);
    tab = "log";
    ui();
  });
  const cr = await page.evaluate(() => ({ g: document.querySelectorAll("#log details.ifz-anio").length, f: document.querySelectorAll(".ifz-filt button").length }));
  ok(cr.g >= 2 && cr.f >= 5, `crónica agrupada por años (${cr.g}) con ${cr.f} filtros`);
  for (const k of ["guerra", "corte", "rumor", "mio", "eco", "todo"]) {
    await page.click(`[data-act="ifzlog-${k}"]`);
    const n = await page.evaluate(() => document.querySelectorAll("#log li").length);
    if (k !== "eco") ok(n > 0, `filtro «${k}»: ${n} entradas`);
  }
  await page.locator("aside").screenshot({ path: path.join(capt, pre + "cronica.png") });

  /* ---------- potencias ---------- */
  const pot = await page.evaluate(async () => {
    /* un ejército en campaña cuenta en la fuerza mostrada */
    const p = G.P[G.F[ME].capId];
    p.u.i = (p.u.i || 0) + 4;
    const antes = ifzFuerza(ME);
    const r = await camAplicarOrden(G, { tipo: "formar", f: ME, p: p.id, u: { i: 4 }, gen: false });
    const despues = ifzFuerza(ME);
    ui();
    const fs = [...document.querySelectorAll("#facs .ifz-fac")].map((b) => +b.dataset.act.split("-")[1]);
    const fu = fs.map(ifzFuerza);
    return { ok: r.ok, igual: antes === despues, orden: fu.every((v, i) => i === 0 || fu[i - 1] >= v), n: fs.length, vivos: [...Array(NF).keys()].filter(alive).length, ej: r.ej };
  });
  ok(pot.ok && pot.igual, "la fuerza mostrada incluye los ejércitos de campo (no cambia al sacarlos de la ciudad)");
  ok(pot.orden && pot.n === pot.vivos, `potencias activas ordenadas por fuerza (${pot.n})`);
  await page.evaluate((id) => {
    camSel = id;
    tab = "prov";
    ui();
  }, pot.ej);
  await page.screenshot({ path: path.join(capt, pre + "ejercito.png") });
  await page.evaluate(() => {
    camSel = null;
    ui();
  });
  await page.click('[data-act^="ifzfac-"]:not(.yo)');
  ok((await page.evaluate(() => tab)) === "dip", "clic en una potencia lleva a Diplomacia");

  /* ---------- hover del mapa ---------- */
  if (!movil) {
    const pto = await page.evaluate(() => {
      const r = cv.getBoundingClientRect();
      for (const p of G.P.filter((q) => q.owner < NF)) {
        const x = r.left + ((p.x * T + 4) * r.width) / cv.width,
          y = r.top + ((p.y * T + 4) * r.height) / cv.height;
        if (document.elementFromPoint(x, y) === cv) return { x, y, n: ecoNivel(p).nombre };
      }
      return null;
    });
    if (pto) {
      await page.mouse.move(pto.x, pto.y);
      await page.waitForTimeout(60);
      const hv = await page.evaluate(() => document.getElementById("hv").textContent);
      ok(hv.includes(" · " + pto.n) && hv.split(pto.n).length === 2, `hover con el ánimo, sin repetirlo: «${hv}»`);
    }
  }

  /* ---------- modales: cola, foco, Tab y Escape ---------- */
  await page.evaluate(() => {
    window.__r = [];
    modal("Primero", "<p>Uno</p>", [{ t: "Aceptar", cls: "gold" }, { t: "Cancelar" }]).then((v) => __r.push(v));
    modal("Segundo", "<p>Dos</p>", [{ t: "Vale" }]).then((v) => __r.push(v));
  });
  await page.waitForTimeout(120);
  const m1 = await page.evaluate(() => ({ t: document.getElementById("modalt").textContent, foco: document.activeElement.textContent, dlg: document.getElementById("modalc").getAttribute("role") }));
  ok(m1.t === "Primero" && m1.foco === "Aceptar" && m1.dlg === "dialog", "el modal toma el foco (botón principal) y es un diálogo");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  ok(await page.evaluate(() => document.getElementById("modalc").contains(document.activeElement)), "Tab no sale del modal");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  const m2 = await page.evaluate(() => ({ r: __r.slice(), t: document.getElementById("modalt").textContent }));
  ok(m2.r[0] === 1 && m2.t === "Segundo", "Escape pulsa «Cancelar» y la cola muestra el siguiente modal");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(80);
  ok(await page.evaluate(() => __r.length === 2 && !document.getElementById("modal").classList.contains("show")), "Enter acepta el aviso y la cola se vacía");
  await page.evaluate(() => {
    modal("Decisión", "<p>Sin escape</p>", [{ t: "Sí" }, { t: "No del todo" }]).then((v) => (__r = [v]));
  });
  await page.waitForTimeout(80);
  await page.keyboard.press("Escape");
  ok(await page.evaluate(() => document.getElementById("modal").classList.contains("show")), "Escape no decide por el jugador si no hay «Cancelar»");
  await page.evaluate(() => document.querySelector("#modalc [data-mi]").click());
  /* ayuda */
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press("?");
  await page.waitForTimeout(80);
  ok(await page.evaluate(() => /Cómo se juega/.test(document.getElementById("modalt")?.textContent || "")), "la tecla ? abre «¿Cómo se juega?»");
  const am = await page.evaluate(() => {
    const c = document.getElementById("modalc").getBoundingClientRect();
    return { d: c.right - innerWidth, b: Math.min(...[...document.querySelectorAll("#modalc .mbtn button")].map((b) => b.getBoundingClientRect().height)) };
  });
  ok(am.d <= 0 && am.b >= 44, `modal legible: cabe en la pantalla y botones de ${Math.round(am.b)}px`);
  await page.screenshot({ path: path.join(capt, pre + "ayuda.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);
  ok(!(await page.evaluate(() => document.getElementById("modal").classList.contains("show"))), "Escape cierra la ayuda");

  /* ---------- tutorial: omitir ---------- */
  await page.evaluate(() => {
    tab = "prov";
    ui();
  });
  await page.click('[data-act="ifztut-fin"]');
  ok(await page.evaluate(() => document.getElementById("ifztut").hidden), "«Omitir el tutorial» lo oculta");

  /* ---------- rendimiento: ui() sin cambios no toca el DOM ---------- */
  const perf = await page.evaluate(() => {
    ui();
    const e0 = IFZ.med.escrituras,
      t0 = performance.now();
    for (let k = 0; k < 100; k++) ui();
    return { ms: (performance.now() - t0) / 100, escr: IFZ.med.escrituras - e0 };
  });
  ok(perf.escr === 0, `ui() repetido sin cambios no reescribe el DOM (${perf.escr} escrituras)`);
  ok(perf.ms < 40, `ui() tarda ${perf.ms.toFixed(2)} ms de media`);
  console.log(`  · ui(): ${perf.ms.toFixed(2)} ms de media`);

  /* ---------- un año de juego ---------- */
  await page.evaluate(() => {
    for (const e of camS().ej.filter((x) => x.f === ME)) camAplicarOrden(G, { tipo: "disolver", f: ME, ej: e.id });
    ui();
  });
  for (let k = 0; k < 4; k++) {
    await cerrarModales(page);
    const b = await page.$("#endb:not([disabled])");
    if (b) await b.click();
    for (let j = 0; j < 200; j++) {
      await cerrarModales(page);
      if (!(await page.evaluate(() => busy))) break;
      await page.waitForTimeout(80);
    }
  }
  await cerrarModales(page);
  await page.evaluate(() => {
    sel = G.F[ME].capId;
    tab = "prov";
    ui();
  });
  await page.screenshot({ path: path.join(capt, pre + "juego.png"), fullPage: !movil });
  ok(await page.evaluate(() => G.year > 410), "se juega al menos un año: " + (await page.evaluate(() => G.year)));

  if (errores.length) console.log("  ERRORES:\n  " + errores.join("\n  "));
  ok(!errores.length, "sin errores de JS");
  await page.close();
}
/* número de recursos declarados (OC.recursos), evaluado en la página */
function OC_N() {
  return OC_N.v;
}

(async () => {
  const browser = await chromium.launch();
  {
    const e = [];
    const p = await nueva(browser, { width: 800, height: 600 }, false, e);
    OC_N.v = await p.evaluate(() => OC.recursos.length);
    await p.close();
  }
  await recorrido(browser, "escritorio", { width: 1400, height: 900 }, false);
  await recorrido(browser, "movil", { width: 390, height: 844 }, true);

  /* ---------- sprites PNG por manifest ---------- */
  console.log("\n== Sprites reemplazables");
  const errores = [];
  const page = await nueva(browser, { width: 1400, height: 900 }, false, errores);
  await page.click('[data-act="s-new"]');
  await page.click('[data-act="s-civ-0"]');
  await page.click('[data-act="s-go"]');
  await page.waitForTimeout(300);
  await cerrarModales(page);
  const spr = await page.evaluate(async () => {
    const cat = ifzSprCatalogo();
    /* PNG de prueba: castillo de 11×11 verde puro con el centro en magenta (teñible) */
    const c = document.createElement("canvas");
    c.width = c.height = 22;
    const x = c.getContext("2d");
    x.fillStyle = "#00ff00";
    x.fillRect(0, 0, 22, 22);
    x.fillStyle = "#ff00ff";
    x.fillRect(6, 6, 10, 10);
    const tropa = document.createElement("canvas");
    tropa.width = tropa.height = 16;
    tropa.getContext("2d").fillStyle = "#ff00ff";
    tropa.getContext("2d").fillRect(0, 0, 16, 16);
    const icono0 = icon(0, "i");
    ifzSprAplicar({
      sprites: {
        "SP.castle": { datos: c.toDataURL(), w: 11, h: 11, tinte: true, escala: 2 },
        "SP.castle2": { datos: c.toDataURL(), w: 11, h: 11, tinte: true, escala: 2 },
        "SP.i": { datos: tropa.toDataURL(), w: 7, h: 9, tinte: true, escala: 2 },
        "SP.ber": { datos: tropa.toDataURL(), w: 7, h: 9, tinte: false, escala: 2 },
        "SP.noexiste": { png: "no/esta.png", w: 4, h: 4 },
        "MS.i.0": { png: "falta.png", w: 6, h: 8 },
      },
    });
    await new Promise((r) => setTimeout(r, 400));
    const p = G.P[G.F[ME].capId],
      d = ctx.getImageData(p.x * T + 4 - 5 + 1, p.y * T + 4 - 7 + 1, 1, 1).data,
      d2 = ctx.getImageData(p.x * T + 4 - 5 + 5, p.y * T + 4 - 7 + 5, 1, 1).data,
      col = ifzRGB(CIV[p.owner].c);
    return {
      n: cat.length,
      cats: [...new Set(cat.map((s) => s.cat))].join(","),
      verde: d[0] < 40 && d[1] > 200 && d[2] < 40,
      tenido: Math.abs(d2[0] - col[0]) < 30 && Math.abs(d2[1] - col[1]) < 30 && Math.abs(d2[2] - col[2]) < 30,
      icono: icon(0, "i") !== icono0 && icon(0, "i").length > 50,
      alias: SP.ber !== SP.i && IFZ_SPR.nom.get(SP.ber) === "SP.ber",
    };
  });
  ok(spr.n > 100, `catálogo de sprites para exportar: ${spr.n} (${spr.cats})`);
  ok(spr.verde, "el castillo del mapa se pinta con el PNG del manifest");
  ok(spr.tenido, "las zonas magenta del PNG se tiñen con el color del pueblo");
  ok(spr.icono, "los iconos de tropa usan el PNG a mayor resolución (escala)");
  ok(spr.alias, "un sprite compartido (berserker = infantería) se desdobla para tener su propio PNG");
  await page.evaluate(() => {
    mapZoom(3);
    centerOn(G.F[ME].capId);
  });
  await page.waitForTimeout(200);
  await page.locator("#mapwrap").screenshot({ path: path.join(capt, "interfaz-sprites-png.png") });
  ok(!errores.length, "un PNG que falta no rompe nada " + errores.join(" | "));
  await page.close();

  /* ---------- partida guardada antigua ---------- */
  console.log("\n== Partida antigua");
  const e2 = [];
  const pv = await nueva(browser, { width: 1400, height: 900 }, false, e2);
  const vieja = fs.readFileSync(path.join(__dirname, "datos", "partida-antigua-410.json"), "utf8");
  await pv.evaluate((s) => {
    localStorage.setItem("ocaso-save", s);
    openStart("home");
  }, vieja);
  await pv.click('[data-act="s-cnt"]');
  await pv.waitForTimeout(300);
  await cerrarModales(pv);
  const tv = await pv.evaluate(() => {
    const e = [];
    for (const b of document.querySelectorAll("#tabs button")) {
      tab = b.dataset.act.slice(4);
      ui();
      if (/Error al mostrar/.test(document.getElementById("panel").innerHTML)) e.push(tab);
    }
    tab = "log";
    ui();
    return { e, g: document.querySelectorAll("#log details").length };
  });
  ok(!tv.e.length && tv.g >= 1, "la partida antigua se ve en todas las pestañas " + tv.e.join(","));
  ok(!e2.length, "sin errores de JS " + e2.join(" | "));
  await pv.close();

  await browser.close();
  console.log("\n" + (fallos ? `FALLOS: ${fallos}` : "OK interfaz"));
  process.exit(fallos ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
