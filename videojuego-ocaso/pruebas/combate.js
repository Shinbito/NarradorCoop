/* Prueba del sistema de COMBATE: clases, resolución automática por rondas, batalla táctica (t3, t1, rt),
   reclutamiento, pestaña Ejército, informe de batalla y carga de partidas antiguas.
   Uso:  node pruebas/combate.js [batallas=400] [civ=0]
   Imprime estadísticas de muchas batallas simuladas y falla si algo no cumple el diseño. */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const NB = +(process.argv[2] || 400);
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
  const clic = async (sel) => {
    await page.click(sel, { timeout: 4000 });
    await page.waitForTimeout(80);
  };
  const cerrarModales = async (pref = /autom/i) => {
    for (let k = 0; k < 30; k++) {
      const abierto = await page.evaluate(() => document.getElementById("modal").classList.contains("show"));
      if (!abierto) return;
      await page.evaluate((src) => {
        const re = new RegExp(src, "i"),
          bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
        (bs.find((b) => re.test(b.textContent)) || bs[0])?.click();
      }, pref.source);
      await page.waitForTimeout(100);
    }
  };
  await clic('[data-act="s-new"]');
  await clic(`[data-act="s-civ-${CIVN}"]`);
  await clic('[data-act="s-go"]');
  await page.waitForTimeout(300);
  await cerrarModales();

  /* ---------- 1. estadísticas de la resolución automática ---------- */
  console.log(`\n1. ${NB} batallas automáticas simuladas`);
  const st = await page.evaluate((NB) => {
    const ej = (f, n) => {
      const u = cmbVacio(),
        ros = cmbRoster(f);
      for (let k = 0; k < n; k++) u[pick(ros)]++;
      return u;
    };
    const out = {
      n: 0,
      ron: 0,
      perd: 0,
      gan: 0,
      fuerte: 0,
      dif: 0,
      fin: {},
      nan: 0,
      dm: 0,
      fm: 0,
      rmin: 99,
      rmax: 0,
      persec: 0,
      r1: 0,
    };
    for (let k = 0; k < NB; k++) {
      const fa = ri(0, 6),
        fd = R() < 0.15 ? REB : ri(0, 6),
        A = ej(fa, ri(4, 16)),
        D = ej(fd, ri(3, 14)),
        fort = R() < 0.3 ? ri(1, 2) : 0,
        r = cmbResolverAuto(
          { f: fa, u: A, vet: {} },
          { f: fd, u: D, vet: {} },
          { fort, terreno: pick(["llanura", "bosque", "colinas", "vado"]) },
        );
      const i = r.informe,
        w = r.gana,
        l = 1 - w,
        pA = pw(A),
        pD = pw(D) * (1 + 0.25 * fort);
      if ([...TYP.map((t) => r.A[t]), ...TYP.map((t) => r.D[t])].some((x) => !Number.isFinite(x))) out.nan++;
      out.n++;
      out.ron += i.rondas.length;
      out.rmin = Math.min(out.rmin, i.rondas.length);
      out.rmax = Math.max(out.rmax, i.rondas.length);
      if (i.rondas.length <= 1) out.r1++;
      out.perd += i.bajas[l].m / i.n0[l];
      out.gan += i.bajas[w].m / i.n0[w];
      out.fin[i.fin] = (out.fin[i.fin] || 0) + 1;
      const pers = i.rondas.length ? i.rondas[i.rondas.length - 1] : null;
      if (i.fin === "rotura" && pers) out.persec += pers.b[l] / Math.max(1, i.bajas[l].m + i.bajas[l].r);
      const df = Math.abs(pA - pD) / Math.min(pA, pD);
      if (df > 0.5) {
        out.dif++;
        if (pA > pD === (w === 0)) out.fuerte++;
      } else if (df > 0.2) {
        out.dm++;
        if (pA > pD === (w === 0)) out.fm++;
      }
    }
    return out;
  }, NB);
  const rm = st.ron / st.n,
    pl = (st.perd / st.n) * 100,
    pg = (st.gan / st.n) * 100,
    fu = (st.fuerte / st.dif) * 100,
    fm = (st.fm / st.dm) * 100;
  console.log(
    `  rondas medias ${rm.toFixed(1)} (mín ${st.rmin}, máx ${st.rmax}) · finales ${JSON.stringify(st.fin)}`,
  );
  console.log(`  bajas definitivas: perdedor ${pl.toFixed(0)}% · ganador ${pg.toFixed(0)}%`);
  console.log(
    `  la persecución causa el ${((st.persec / (st.fin.rotura || 1)) * 100).toFixed(0)}% de los caídos del perdedor`,
  );
  console.log(`  el bando claramente más fuerte (>50%) gana el ${fu.toFixed(0)}% de ${st.dif} batallas`);
  console.log(`  con ventaja moderada (20-50%) gana el ${fm.toFixed(0)}% de ${st.dm} batallas`);
  ok(st.nan === 0, "sin valores no numéricos en los ejércitos resultantes");
  ok(rm >= 4 && rm <= 12, "las batallas duran varias rondas (media entre 4 y 12)");
  ok(st.r1 / st.n < 0.05, "casi ninguna batalla se decide en una ronda");
  ok(pl > pg * 1.6, "el perdedor sufre bastantes más bajas que el ganador");
  ok(pl < 75, "las tropas huyen antes de ser aniquiladas (bajas del perdedor < 75%)");
  ok(fu >= 85, "el bando muy superior casi siempre gana");
  ok(fm >= 60 && fm <= 92, "con ventaja moderada el más fuerte suele ganar, pero no siempre");

  /* ---------- 2. identidad de las clases ---------- */
  console.log("\n2. Enfrentamientos de clases (200 batallas cada uno)");
  const duelos = await page.evaluate(() => {
    const v = (a, d, o = {}) => {
      let w = 0;
      for (let k = 0; k < 200; k++)
        if (
          cmbResolverAuto(
            { f: 0, u: { ...cmbVacio(), ...a } },
            { f: 2, u: { ...cmbVacio(), ...d } },
            { terreno: "llanura", ...o },
          ).gana === 0
        )
          w++;
      return w / 200;
    };
    return {
      igual: v({ i: 8 }, { i: 8 }),
      lanzasCab: v({ c: 6 }, { l: 9 }),
      infCab: v({ c: 6 }, { i: 9 }),
      cabArq: v({ c: 5 }, { a: 8 }),
      murallas: v({ i: 10 }, { i: 7 }, { fort: 2 }),
      llano: v({ i: 10 }, { i: 7 }),
      bosqueCab: v({ c: 6 }, { i: 9 }, { terreno: "bosque" }),
      pesada: v({ p: 6 }, { i: 9 }),
    };
  });
  for (const [k, x] of Object.entries(duelos))
    console.log(`  ${k}: gana el atacante ${(x * 100).toFixed(0)}%`);
  ok(duelos.igual > 0.25 && duelos.igual < 0.75, "infantería igual contra igual: resultado abierto");
  ok(
    duelos.lanzasCab < duelos.infCab,
    "los lanceros resisten mejor la caballería que la infantería de línea",
  );
  ok(duelos.cabArq > 0.6, "la caballería arrolla a los arqueros");
  ok(duelos.murallas < duelos.llano, "las murallas ayudan al defensor");
  ok(duelos.bosqueCab < duelos.infCab, "el bosque perjudica a la caballería");

  if (process.argv[4] === "stats") {
    console.log(
      "\n" + (errores.length || fallos.length ? "ERRORES:\n" + [...errores, ...fallos].join("\n") : "OK"),
    );
    await browser.close();
    process.exit(0);
  }
  /* ---------- 3. reclutar y pestaña Ejército ---------- */
  console.log("\n3. Reclutamiento y pestaña Ejército");
  await page.evaluate(() => {
    G.F[ME].gold = 500;
    sel = G.F[ME].capId;
    tab = "prov";
    ui();
  });
  const rec = await page.$$eval("#panel .cmb-rec button", (bs) =>
    bs.map((b) => ({ t: b.textContent, d: b.disabled, a: b.dataset.act })),
  );
  console.log("  " + rec.map((b) => b.t.replace(/\s+/g, " ") + (b.d ? " [bloq]" : "")).join(" | "));
  ok(rec.length >= 4, "la sección Reclutar muestra varias clases");
  ok(
    rec.some((b) => !b.a),
    "se muestran clases bloqueadas con su motivo",
  );
  const antes = await page.evaluate(() => tot(G.P[sel].u));
  await clic('#panel .cmb-rec button[data-act^="rec-"]:not([disabled])');
  ok((await page.evaluate(() => tot(G.P[sel].u))) === antes + 1, "reclutar suma una leva a la provincia");
  await page.locator("#panel").screenshot({ path: path.join(capt, "combate-reclutar.png") });
  await clic('[data-act="tab-cmb"]');
  await page.evaluate(() => document.querySelector(".cmb-cx")?.setAttribute("open", ""));
  await page.locator("#panel").screenshot({ path: path.join(capt, "combate-ejercito.png") });
  ok(await page.$("#panel .cmb-hu button"), "la pestaña Ejército lista las huestes");

  /* ---------- 4. batalla de campaña con resolución automática e informe ---------- */
  console.log("\n4. Batalla de campaña (resolución automática)");
  const prep = await page.evaluate(() => {
    let p = null,
      q = null;
    for (const x of owned(ME)) {
      const ys = MAP.adj[x.id].map((i) => G.P[i]).filter((y) => y.owner !== ME);
      const y = ys.find((y) => y.owner === REB) || ys[0];
      if (y) {
        p = x;
        q = y;
        break;
      }
    }
    if (!q) return null;
    p.u = { ...cmbVacio(), i: 12, a: 4, c: 3 };
    q.u = { ...cmbVacio(), i: 5, a: 2 };
    p.tired = false;
    window.__bat = null;
    OC.on("batallaResuelta", (d) => (window.__bat = d));
    sel = p.id;
    tab = "prov";
    ui();
    window.__fin = false;
    march(p.id, q.id, 1).then(() => (window.__fin = true));
    return q.id;
  });
  ok(prep != null, "hay una provincia vecina que atacar");
  await page.waitForTimeout(700);
  await page.evaluate(() =>
    [...document.querySelectorAll("#modalc button")].find((b) => /autom/i.test(b.textContent))?.click(),
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(capt, "combate-informe.png") });
  await cerrarModales();
  await page.waitForTimeout(300);
  const bat = await page.evaluate(
    () => window.__bat && { ...window.__bat, p: null, informe: !!window.__bat.informe },
  );
  ok(bat && bat.rondas >= 2, "batallaResuelta llega con rondas, bajas y factores");
  ok(
    bat && bat.bajas && bat.heridos && Array.isArray(bat.factores),
    "el evento incluye bajas, heridos y factores decisivos",
  );
  ok(await page.evaluate(() => cmbS().inf.length > 0), "el informe queda guardado para la pestaña Ejército");

  /* ---------- 5. batalla táctica en los tres modos ---------- */
  console.log("\n5. Batalla táctica: t3, t1, rt (la IA manda los dos bandos)");
  for (const modo of ["t3", "t1", "rt"]) {
    await page.evaluate((modo) => {
      window.__tac = null;
      cmbTactica(
        { f: ME, u: { ...cmbVacio(), l: 3, i: 4, a: 3, c: 2, x: 1 }, gen: G.F[ME].ruler, vet: { i: 30 } },
        { f: 2, u: { ...cmbVacio(), i: 6, l: 2, h: 2, c: 2 }, gen: null },
        {
          auto: true,
          sinModal: true,
          velocidad: 16,
          terreno: "vado",
          fort: modo === "t1" ? 1 : 0,
          nombreLugar: "Prueba",
        },
        modo,
      ).then((r) => (window.__tac = r));
    }, modo);
    let shot = false;
    for (let k = 0; k < 600; k++) {
      await page.waitForTimeout(200);
      if (!shot && k === 8) {
        await page.screenshot({ path: path.join(capt, `combate-tactica-${modo}.png`) });
        shot = true;
      }
      if (await page.evaluate(() => !!window.__tac)) break;
    }
    const r = await page.evaluate(() => {
      const r = window.__tac;
      return (
        r && {
          gana: r.gana,
          A: tot(r.A),
          D: tot(r.D),
          hitos: r.informe.rondas.length,
          f: r.informe.factores.length,
          fin: r.informe.fin,
          seg: r.informe.dur,
          bajas: r.informe.bajas,
        }
      );
    });
    console.log("  " + modo + ": " + JSON.stringify(r));
    ok(r && r.hitos >= 2, `la batalla táctica ${modo} termina con informe por fases`);
  }

  /* ---------- 6. partida guardada antigua ({i,a,c} sin G.cmb) ---------- */
  console.log("\n6. Partida guardada antigua");
  await page.evaluate(() => {
    const g = JSON.parse(JSON.stringify(G));
    delete g.cmb;
    for (const p of g.P) p.u = { i: p.u.i || 0, a: p.u.a || 0, c: p.u.c || 0 };
    localStorage.setItem("ocaso-save", JSON.stringify({ G: g, ME }));
    openStart("home");
  });
  await page.waitForTimeout(200);
  await clic('[data-act="s-cnt"]');
  await page.waitForTimeout(400);
  await cerrarModales();
  const vieja = await page.evaluate(
    () => G.P.every((p) => TYP.every((t) => Number.isFinite(p.u[t]))) && !!G.cmb,
  );
  ok(vieja, "la partida antigua carga y sus ejércitos se completan con las clases nuevas");
  await page.evaluate(() => {
    endTurn();
  });
  for (let k = 0; k < 100; k++) {
    await cerrarModales();
    if (!(await page.evaluate(() => busy))) break;
    await page.waitForTimeout(100);
  }
  ok(
    await page.evaluate(() => G.P.every((p) => TYP.every((t) => Number.isFinite(p.u[t])))),
    "tras un año de IA, sin ejércitos corruptos",
  );

  console.log(
    "\n" +
      (errores.length || fallos.length
        ? "ERRORES:\n" + [...errores, ...fallos.map((f) => "fallo: " + f)].join("\n")
        : "OK sin errores"),
  );
  await browser.close();
  process.exit(errores.length || fallos.length ? 1 : 0);
})();
