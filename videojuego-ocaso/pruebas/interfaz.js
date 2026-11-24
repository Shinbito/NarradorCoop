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
    /* «Potencias» empieza recogida (menú más corto): se abre como haría el jugador */
    document.getElementById("potd").open = true;
  });
  await page.click('[data-act^="ifzfac-"]:not(.yo)');
  ok((await page.evaluate(() => tab)) === "dip", "clic en una potencia lleva a Diplomacia");

  /* ---------- hover del mapa ---------- */
  if (!movil) {
    const pto = await page.evaluate(() => {
      const r = cv.getBoundingClientRect();
      /* una provincia que se vea (con la niebla, de las ocultas solo se sabe el dueño) */
      for (const p of G.P.filter((q) => q.owner < NF && !(typeof camProvOculta === "function" && camProvOculta(q)))) {
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
    /* la capital del manifest del juego (MAPA.capital) manda sobre SP.castle: fuera para esta prueba */
    for (const k of Object.keys(IFZ_SPR.img)) if (k.startsWith("MAPA.capital") || k.startsWith("MAPA.muralla_capital")) delete IFZ_SPR.img[k];
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
    sel = null;
    hover = null;
    await new Promise((r) => setTimeout(r, 600));
    /* el castillo de la capital se pinta a doble tamaño en el lienzo HD: esquina en (x·S−2, y·S−8) */
    const p = G.P[G.F[ME].capId],
      x0 = p.x * IFZ_S - 2,
      y0 = p.y * IFZ_S - 8,
      R = IFZ_HD.r || 1 /* el lienzo HD tiene IFZ_R píxeles por píxel HD */,
      d = hctx.getImageData((x0 + 2) * R, (y0 + 2) * R, 1, 1).data,
      d2 = hctx.getImageData((x0 + 10) * R, (y0 + 10) * R, 1, 1).data,
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

  /* ---------- mapa HD, ritmo de animación, interpolación y repetición de la estación ---------- */
  console.log("\n== Mapa HD, ritmo y repetición");
  const e3 = [];
  const pm = await nueva(browser, { width: 1400, height: 900 }, false, e3);
  await pm.click('[data-act="s-new"]');
  await pm.click('[data-act="s-civ-0"]');
  await pm.click('[data-act="s-go"]');
  await pm.waitForTimeout(300);
  await cerrarModales(pm);
  const hdm = await pm.evaluate(async () => {
    IFZ.pref.tut = 99;
    ui();
    for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
    const t0 = performance.now();
    let n = 0;
    while (performance.now() - t0 < 600) {
      drawMap(performance.now());
      n++;
    }
    const rh = hd.getBoundingClientRect(),
      rc = cv.getBoundingClientRect();
    return {
      hd: hd.width + "x" + hd.height,
      cv: cv.width + "x" + cv.height,
      esp: W * IFZ_S * (IFZ_HD.r || 1) + "x" + H * IFZ_S * (IFZ_HD.r || 1),
      log: W * T + "x" + H * T,
      encima: Math.abs(rh.left - rc.left) < 1 && Math.abs(rh.width - rc.width) < 1 && Math.abs(rh.height - rc.height) < 1,
      terreno: Math.round(IFZ_HD.ms.terreno),
      pol: Math.round(IFZ_POL.ms),
      cuadro: (performance.now() - t0) / n,
      vel: ifzVel(),
    };
  });
  ok(hdm.hd === hdm.esp && hdm.cv === hdm.log && hdm.encima, `mapa HD ${hdm.hd} bajo el lienzo lógico ${hdm.cv} (clics y pruebas intactos)`);
  ok(hdm.terreno < 2500 && hdm.pol < 400, `terreno en ${hdm.terreno} ms (una vez), capa política en ${hdm.pol} ms`);
  ok(hdm.cuadro < 16, `cada cuadro del mapa ${hdm.cuadro.toFixed(1)} ms`);
  console.log(`  · terreno ${hdm.terreno} ms · política ${hdm.pol} ms · cuadro ${hdm.cuadro.toFixed(2)} ms`);
  ok(hdm.vel === 0, "en un navegador automatizado ifzVel() = 0 (las pruebas no esperan animaciones)");
  /* relieve de Mundo (MAP.v 2): montañas, ríos, puentes, caminos; nombre del terreno en el hover */
  const rel = await pm.evaluate(() => {
    const inf = ifzMapaInfo(),
      busca = (k) => {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAP[k] && MAP[k][y][x]) return [x, y];
        return null;
      },
      m = busca("mont"),
      r = (() => {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAP.rio[y][x] && !MAP.puente[y][x] && !MAP.vado[y][x]) return [x, y];
        return null;
      })(),
      pu = busca("puente");
    return {
      v: MAP.v,
      mont: inf.mont.reduce((a, b) => a + b, 0),
      rios: inf.rios.length,
      tramos: inf.tramos.length / 2,
      tm: m ? ifzTerrenoTxt(m[0], m[1]) : "sin montañas",
      tr: r ? ifzTerrenoTxt(r[0], r[1]) : "sin ríos",
      tp: pu ? ifzTerrenoTxt(pu[0], pu[1]) : "sin puentes",
    };
  });
  ok(rel.v >= 2 && rel.mont > 0 && rel.rios > 0 && rel.tramos > 0, `el mapa pinta el relieve: ${rel.mont} casillas de montaña, ${rel.rios} ríos, ${rel.tramos} tramos de camino`);
  const eco = await pm.evaluate(() => {
    const p = G.P[G.F[ME].capId];
    sel = p.id;
    tab = "prov";
    ui();
    IFZ_REC.k = "";
    drawMap(performance.now());
    const r = ecoIconoProv(p),
      sum = document.querySelector('#panel details[data-ifzsec="tierras"] .ifz-sr');
    return {
      n: IFZ_REC.l.length,
      ocultas: IFZ_REC.l.every(({ p: q }) => ifzVeProv(q)),
      hover: r ? ifzHoverTxt(p.id, "", [p.x, p.y]).includes(r.icono + " " + r.nombre) : true,
      tierras: sum ? sum.textContent : "",
      fert: ecoFertil(p).txt,
    };
  });
  ok(eco.n > 0 && eco.ocultas, `recurso principal sobre ${eco.n} provincias visibles (ecoIconoProv, respeta la niebla)`);
  ok(eco.hover && eco.tierras.includes(eco.fert), `hover con el recurso principal y «Tierras» plegada: «${eco.tierras}»`);
  ok(rel.tm === "Montaña infranqueable" && rel.tr === "Río" && rel.tp === "Puente", `el hover nombra el terreno: ${rel.tm} · ${rel.tr} · ${rel.tp}`);
  /* online: con «Listo» pulsado, el botón de fin ofrece «Quitar listo» */
  const ql = await pm.evaluate(() => {
    const m0 = ONL.meta,
      on0 = net.on,
      cur0 = net.cur,
      q0 = window.onlQuitarListo;
    let llamado = false;
    window.onlQuitarListo = async () => (llamado = true);
    ONL.meta = { fase: "ordenes", turno: 3, listos: { [ME]: 3 }, seats: { [ME]: "u" }, est: { [ME]: "activo" }, cfg: {}, limite: Date.now() + 9e5 };
    net.on = true;
    net.cur = null;
    ui();
    const b = document.getElementById("endb"),
      r = { t: b.textContent, act: b.dataset.act, dis: b.disabled };
    b.click();
    r.llamado = llamado;
    ONL.meta = m0;
    net.on = on0;
    net.cur = cur0;
    window.onlQuitarListo = q0;
    ui();
    r.vuelve = document.getElementById("endb").dataset.act;
    return r;
  });
  ok(/Quitar listo/.test(ql.t) && ql.act === "ifzquitar" && !ql.dis && ql.llamado && ql.vuelve === "end", `online: «${ql.t}» llama a onlQuitarListo y luego vuelve a «Fin»`);
  /* opciones: velocidad */
  await pm.click('[data-act="ifzopc"]');
  await pm.waitForTimeout(80);
  await pm.click('#modalc [data-act="ifzvel-normal"]');
  const vo = await pm.evaluate(() => ({ p: JSON.parse(localStorage.getItem("ocaso-ifz")).vel, on: document.querySelector('#modalc [data-act="ifzvel-normal"]').getAttribute("aria-pressed") }));
  ok(vo.p === "normal" && vo.on === "true", "Opciones: la velocidad de animación se guarda en las preferencias");
  await pm.screenshot({ path: path.join(capt, "interfaz-terreno-opciones.png") });
  await pm.keyboard.press("Escape");
  /* interpolación: el ejército se desliza entre casillas */
  const it = await pm.evaluate(async () => {
    IFZ.velForzada = 1;
    const p = G.P[G.F[ME].capId];
    p.u.i = (p.u.i || 0) + 6;
    const r = await camAplicarOrden(G, { tipo: "formar", f: ME, p: p.id, u: { i: 6 }, gen: false });
    const e = camEj(r.ej);
    drawMap(performance.now());
    const a = { ...IFZ_POS.get(e.id) };
    e.x += 3;
    const t = performance.now();
    drawMap(t);
    drawMap(t + 100);
    const b = { ...IFZ_POS.get(e.id) };
    for (let k = 2; k < 200; k++) drawMap(t + 100 + k * 16);
    const c2 = { ...IFZ_POS.get(e.id) };
    e.x -= 3;
    IFZ.velForzada = null;
    return { mitad: b.x > a.x && b.x < a.x + 2 * IFZ_S, llega: !c2.mov && c2.x >= a.x + 3 * IFZ_S - 1, mov: b.mov, a: a.x, b: b.x, c: c2.x };
  });
  ok(it.mitad && it.mov && it.llega, `la posición mostrada se desliza suavemente hasta la casilla nueva (${it.a} → ${it.b} → ${it.c})`);
  /* repetición sintética */
  const rp = await pm.evaluate(async () => {
    IFZ.repForzar = true;
    const yo = G.P[G.F[ME].capId],
      otra = G.P.find((q) => q.owner !== ME && q.owner < NF),
      own0 = G.P.map((p) => p.owner),
      ej0 = [{ id: 901, f: otra.owner, x: otra.x, y: otra.y, n: 12 }],
      pasos = [];
    for (let k = 1; k <= 3; k++) pasos.push({ k: "mov", ej: 901, f: otra.owner, de: [otra.x + k - 1, otra.y], a: [otra.x + k, otra.y] });
    pasos.push({ k: "ej+", ej: 902, f: ME, x: yo.x, y: yo.y, n: 20 });
    pasos.push({ k: "mov", ej: 902, f: ME, de: [yo.x, yo.y], a: [yo.x + 1, yo.y] });
    pasos.push({ k: "mov", ej: 901, f: otra.owner, de: [otra.x + 3, otra.y], a: [otra.x + 4, otra.y] });
    pasos.push({ k: "bat", x: otra.x + 4, y: otra.y, fs: [otra.owner, ME], gana: ME, lugar: "Campos de prueba" });
    pasos.push({ k: "ase", p: otra.id, f: ME, fase: "ini" });
    pasos.push({ k: "con", p: otra.id, de: otra.owner, a: ME });
    pasos.push({ k: "ej-", ej: 901, motivo: "deshecho" });
    const rep = { v: 1, anio: G.year, est: G.estacion, own0, ej0, pasos };
    const grupos = ifzRepGrupos(pasos).length;
    const t0 = performance.now(),
      pr = ifzRepetir(rep);
    await new Promise((r) => setTimeout(r, 120));
    const durante = { on: IFZ_REP.on, barra: !document.getElementById("ifzrep").hidden, dueño: IFZ_REP.own[otra.id] };
    window.__rep = { pr, t0, otra: otra.id, real: otra.owner };
    return { grupos, durante };
  });
  ok(rp.grupos === 9, `los pasos se agrupan (marchas de ejércitos distintos a la vez): ${rp.grupos} grupos`);
  const nb = await pm.evaluate(() => {
    const pasos = [
      { k: "mov", ej: 1, f: 1, de: [0, 0], a: [1, 0], vh: [ME] },
      { k: "mov", ej: 2, f: 1, de: [0, 0], a: [1, 0], vh: [] },
      { k: "esp", esp: 3, f: ME, de: [2, 2], a: [3, 2] },
      { k: "esp-", esp: 3, f: ME },
    ];
    const v = ifzRepVisibles(pasos);
    drawMap(performance.now());
    return { v: v.length, g: ifzRepGrupos(v).length, niebla: ifzNieblaOn(), cv: IFZ_NIEBLA.cv ? IFZ_NIEBLA.cv.width === W * IFZ_S * (IFZ_HD.r || 1) : false };
  });
  ok(nb.v === 3 && nb.g === 2, `la repetición solo muestra los pasos que el jugador ve (vh) y los de espías (${nb.v} pasos, ${nb.g} grupos)`);
  ok(!nb.niebla || nb.cv, "la niebla de guerra se dibuja en alta resolución (ifzVeloNiebla)");
  ok(rp.durante.on && rp.durante.barra, "la repetición se ve con su barra (Saltar, ×2) y bloquea el mapa");
  await pm.waitForTimeout(1800);
  await pm.locator(".board").screenshot({ path: path.join(capt, "interfaz-terreno-repeticion.png") });
  const bloq = await pm.evaluate(() => {
    const r = document.getElementById("ifzrep").getBoundingClientRect();
    return r.width >= innerWidth - 1 && r.height >= innerHeight - 1;
  });
  ok(bloq, "una capa cubre la pantalla mientras dura");
  await pm.click('[data-act="ifzrep-x2"]');
  await pm.click('[data-act="ifzrep-saltar"]');
  const fin = await pm.evaluate(async () => {
    await __rep.pr;
    return { on: IFZ_REP.on, barra: !document.getElementById("ifzrep").hidden, dueño: G.P[__rep.otra].owner === __rep.real, t: performance.now() - __rep.t0 };
  });
  ok(!fin.on && !fin.barra && fin.dueño, `«Saltar» acaba la repetición y vuelve al estado real (${Math.round(fin.t)} ms)`);
  const dura = await pm.evaluate(async () => {
    const yo = G.P[G.F[ME].capId],
      pasos = [];
    for (let k = 0; k < 40; k++) pasos.push({ k: "mov", ej: 950 + (k % 4), f: ME, de: [yo.x, yo.y], a: [yo.x + 1, yo.y] });
    const t0 = performance.now();
    await ifzRepetir({ v: 1, anio: G.year, est: 0, own0: G.P.map((p) => p.owner), ej0: [], pasos });
    IFZ.repForzar = false;
    return performance.now() - t0;
  });
  ok(dura > 1500 && dura < 45000, `una repetición completa dura lo previsto (${Math.round(dura)} ms para 10 grupos)`);
  const sinRep = await pm.evaluate(async () => {
    const t0 = performance.now();
    const r = await ifzRepetir({ v: 1, pasos: [{ k: "mov", ej: 1, f: 0, de: [0, 0], a: [1, 0] }], own0: [], ej0: [] });
    return { r, t: performance.now() - t0 };
  });
  ok(sinRep.r === false && sinRep.t < 50, "en pruebas (ifzVel 0) la repetición se salta sola");
  ok(!e3.length, "sin errores de JS " + e3.join(" | "));
  await pm.close();

  /* ---------- kit de mapa: atlas, exportar → hoja maltratada → importar → el juego la usa ---------- */
  console.log("\n== Kit de mapa (exportar e importar hojas)");
  {
    const os = require("os"),
      { execFileSync } = require("child_process"),
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ocaso-kit-")),
      exp = path.join(tmp, "exp"),
      copia = path.join(tmp, "juego");
    const e5 = [];
    const pa = await nueva(browser, { width: 1200, height: 800 }, false, e5);
    await pa.click('[data-act="s-new"]');
    await pa.click('[data-act="s-civ-0"]');
    await pa.click('[data-act="s-go"]');
    await pa.waitForTimeout(300);
    await cerrarModales(pa);
    const at = await pa.evaluate(() => {
      const A = ifzAtlas(),
        n = (re) => A.filter((a) => re.test(a.nombre)).length;
      return {
        total: A.length,
        suelos: ["llanura", "bosque", "bosque_denso", "colina", "montana", "nieve"].every((k) => n(new RegExp(`^MAPA\\.${k}\\.\\d$`)) >= 3),
        costa: n(/^MAPA\.costa\.\d+$/) === 16 && n(/^MAPA\.espuma\.\d+$/) === 16,
        rio: n(/^MAPA\.rio\.\d+$/) === 16 && n(/^MAPA\.(puente|vado)\.[hv]$/) === 4,
        caminos: n(/^MAPA\.camino\.\d+$/) === 16 && n(/^MAPA\.calzada\.\d+$/) === 16,
        ciudades: n(/^MAPA\.ciudad\.\d$/) === 4 && n(/^MAPA\.muralla\.\d$/) === 3 && n(/^MAPA\.capital$/) === 1,
        edificios: ["torre", "mina", "cantera", "aserradero", "salinas", "puerto"].every((k) => n(new RegExp(`^MAPA\\.${k}$`)) === 1),
        arboles: n(/^IFZ\.arbol\./) === 4,
      };
    });
    ok(at.suelos && at.costa && at.rio && at.caminos && at.ciudades && at.edificios && at.arboles, `atlas del mapa completo (${at.total} celdas): suelos con variantes, costa y espuma 16+16, ríos 16 + puentes y vados, caminos y calzadas 16+16, ciudades, murallas, capital, edificios y árboles`);
    await pa.close();
    /* exportar (con la herramienta) */
    execFileSync("node", [path.join(raiz, "herramientas/exportar-sprites.js"), exp], { stdio: "pipe" });
    const hojas = fs.readdirSync(path.join(exp, "hojas")),
      renders = fs.readdirSync(path.join(exp, "renders"));
    ok(hojas.includes("atlas@4x.png") && hojas.includes("atlas@8x.json") && hojas.includes("tropas@8x.png") && renders.length >= 3, `exportación: ${hojas.length / 2} hojas con plantilla y ${renders.length} mapas de referencia`);
    /* copia del juego para no tocar el de verdad */
    fs.cpSync(raiz, copia, { recursive: true, filter: (f) => !/(\/pruebas\/capturas|\/assets\/sprites\/originales|\/app-movil|\/\.git)(\/|$)/.test(f) });
    /* maltratar la hoja del atlas (×1,03, desplazada, JPEG) y la de tropas (×0,97) en el navegador */
    const pm2 = await browser.newPage();
    const maltratar = async (ent, sal, esc, dx, dy, q) => {
      const url = "data:image/png;base64," + fs.readFileSync(ent).toString("base64");
      const out = await pm2.evaluate(
        async ({ url, esc, dx, dy, q }) => {
          const im = new Image();
          await new Promise((r) => ((im.onload = r), (im.src = url)));
          const c = document.createElement("canvas");
          c.width = Math.round(im.width * esc) + 2 * dx;
          c.height = Math.round(im.height * esc) + 2 * dy;
          const g = c.getContext("2d");
          g.fillStyle = "#101418";
          g.fillRect(0, 0, c.width, c.height);
          g.drawImage(im, dx, dy, im.width * esc, im.height * esc);
          return c.toDataURL("image/jpeg", q);
        },
        { url, esc, dx, dy, q },
      );
      fs.writeFileSync(sal, Buffer.from(out.split(",")[1], "base64"));
    };
    await maltratar(path.join(exp, "hojas/atlas@8x.png"), path.join(tmp, "atlas-gemini.jpg"), 1.03, 13, 9, 0.75);
    await maltratar(path.join(exp, "hojas/tropas@8x.png"), path.join(tmp, "tropas-gemini.jpg"), 0.97, 5, 21, 0.8);
    await pm2.close();
    const imp = (hoja, cat) =>
      execFileSync("node", [path.join(raiz, "herramientas/importar-hoja.js"), hoja, cat, "--plantilla", path.join(exp, `hojas/${cat}@8x.json`), "--destino", copia], { encoding: "utf8" });
    const s1 = imp(path.join(tmp, "atlas-gemini.jpg"), "atlas"),
      s2 = imp(path.join(tmp, "tropas-gemini.jpg"), "tropas");
    const m = JSON.parse(fs.readFileSync(path.join(copia, "assets/sprites/manifest.json"), "utf8")),
      nMapa = Object.keys(m.sprites).filter((k) => k.startsWith("MAPA.")).length,
      nTrop = Object.keys(m.sprites).filter((k) => k.startsWith("SP.")).length;
    ok(/escala 1\.03/.test(s1) && /escala 0\.9[67]/.test(s2) && nMapa > 120 && nTrop > 20, `importación de hojas maltratadas: ${nMapa} celdas del atlas y ${nTrop} tropas (${s1.split("\n")[0].replace(/^Hoja /, "")} | ${s2.split("\n")[0].replace(/^Hoja /, "")})`);
    /* fidelidad: lo importado se parece a lo exportado (alfa igual y color cercano) */
    const pc = await browser.newPage();
    const fid = await pc.evaluate(
      async (pares) => {
        const leer = async (u) => {
          const im = new Image();
          await new Promise((r) => ((im.onload = r), (im.src = u)));
          const c = document.createElement("canvas");
          c.width = im.width;
          c.height = im.height;
          const g = c.getContext("2d");
          g.drawImage(im, 0, 0);
          return g.getImageData(0, 0, c.width, c.height);
        };
        let s = 0,
          peor = 1;
        for (const [A, B] of pares) {
          const x = await leer(A),
            y = await leer(B);
          let ok = 0;
          const N = x.width * x.height;
          if (x.width === y.width && x.height === y.height)
            for (let i = 0; i < N * 4; i += 4) {
              const a = x.data[i + 3] >= 110,
                b = y.data[i + 3] >= 110;
              if (a === b && (!a || Math.hypot(x.data[i] - y.data[i], x.data[i + 1] - y.data[i + 1], x.data[i + 2] - y.data[i + 2]) < 40)) ok++;
            }
          s += ok / N;
          peor = Math.min(peor, ok / N);
        }
        return { media: s / pares.length, peor };
      },
      ["MAPA.llanura.0", "MAPA.costa.5", "MAPA.rio.10", "MAPA.calzada.15", "MAPA.ciudad.3", "MAPA.mina", "IFZ.arbol.pino"].map((n) => [
        "data:image/png;base64," + fs.readFileSync(path.join(exp, "atlas", n + ".png")).toString("base64"),
        "data:image/png;base64," + fs.readFileSync(path.join(copia, "assets/sprites/atlas", n + ".png")).toString("base64"),
      ]),
    );
    await pc.close();
    ok(fid.media > 0.95 && fid.peor > 0.85, `lo importado coincide con lo exportado (${Math.round(fid.media * 100)} % de media, peor ${Math.round(fid.peor * 100)} %)`);
    /* el juego (la copia) carga lo importado desde manifest.js y lo usa en el mapa */
    const e6 = [];
    const pj = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    pj.on("pageerror", (e) => e6.push(e.message));
    await pj.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await pj.goto("file://" + path.join(copia, "index.html"));
    await pj.evaluate(() => localStorage.clear());
    await pj.click('[data-act="s-new"]');
    await pj.click('[data-act="s-civ-0"]');
    await pj.click('[data-act="s-go"]');
    await pj.waitForTimeout(600);
    await cerrarModales(pj);
    const usa = await pj.evaluate(async () => {
      await new Promise((r) => setTimeout(r, 400));
      G.cam.niebla = false;
      sel = null;
      drawMap(performance.now());
      /* una casilla de llanura sin nada encima: su píxel central debe salir de un PNG MAPA.llanura.* */
      const inf = ifzMapaInfo();
      let i = -1;
      for (let k = 0; k < W * H && i < 0; k++) if (ifzClaveSuelo(k % W, (k / W) | 0, inf) === "llanura" && !inf.aldea[k] && !inf.camino[k] && !inf.rio[k] && inf.dMar[k] >= 2 && inf.alt[k] === inf.alt[k - 1] && inf.alt[k] === inf.alt[k - W] && inf.alt[k] < 5) i = k;
      const im = IFZ_SPR.img["MAPA.llanura." + (ifzHash(i) % 4)] || IFZ_SPR.img["MAPA.llanura.0"],
        c = document.createElement("canvas");
      c.width = c.height = 16;
      c.getContext("2d").drawImage(im, 0, 0);
      const a = c.getContext("2d").getImageData(2, 2, 1, 1).data,
        R = IFZ_HD.r || 1,
        b = IFZ_HD.ter.getContext("2d").getImageData(((i % W) * 16 + 2) * R, (((i / W) | 0) * 16 + 2) * R, 1, 1).data;
      return { n: Object.keys(IFZ_SPR.img).filter((k) => k.startsWith("MAPA.")).length, png: !!ifzSueloPNG("llanura", i), d: Math.round(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])) };
    });
    await pj.locator(".board").screenshot({ path: path.join(capt, "interfaz-kit-importado.png") });
    await pj.close();
    ok(usa.n > 120 && usa.png && usa.d < 70, `el juego carga las ${usa.n} celdas importadas y pinta el mapa con ellas (diferencia de color ${usa.d}, con el relieve encima)`);
    ok(!e5.length && !e6.length, "sin errores de JS " + [...e5, ...e6].join(" | "));
    fs.rmSync(tmp, { recursive: true, force: true });
  }

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
