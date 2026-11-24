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

  /* ---------- 7. FASE 2: asedio, bestias, habilidades, generales y capitanes ---------- */
  console.log("\n7. Fase 2: asedio, elefantes, berserkers, generales y capitanes");
  const v2 = await page.evaluate(() => {
    const v = (a, d, o = {}, n = 150) => {
      let w = 0,
        inf = null,
        brecha = 0;
      for (let k = 0; k < n; k++) {
        const r = cmbResolverAuto(
          { f: 0, u: { ...cmbVacio(), ...a } },
          { f: 2, u: { ...cmbVacio(), ...d } },
          { terreno: "llanura", ...o },
        );
        if (r.gana === 0) w++;
        if (r.brecha) brecha++;
        inf = r.informe;
      }
      return { w: w / n, inf, brecha: brecha / n };
    };
    const sin = v({ i: 10 }, { i: 6 }, { fort: 2 }),
      con = v({ i: 10, ari: 2, cat: 2, tor: 1 }, { i: 6 }, { fort: 2 }),
      campo = v({ i: 8, ari: 2, tor: 1 }, { i: 8 }, {}, 400),
      campo0 = v({ i: 8 }, { i: 8 }, {}, 400),
      ele = v({ ele: 4 }, { c: 6 }),
      cab = v({ c: 4 }, { c: 6 }),
      ber = v({ ber: 6 }, { i: 8 }, {}, 30);
    return {
      sin: sin.w,
      con: con.w,
      brecha: con.brecha,
      rondasAsalto: con.inf.rondas.map((r) => r.f + ": " + r.t),
      campo: campo.w,
      campo0: campo0.w,
      ele: ele.w,
      cab: cab.w,
      curva: ber.inf.curva.ber0,
      berTxt: ber.inf.rondas.map((r) => r.t).join(" | "),
      maqRecluta: cmbRoster(ME).some((t) => UN[t].asedio),
      unicas: cmbRoster(ME).filter((t) => t.length > 1),
    };
  });
  console.log(
    `  asalto a murallas II: sin máquinas gana ${(v2.sin * 100).toFixed(0)}%, con arietes, torre y catapultas ${(v2.con * 100).toFixed(0)}% (brecha en el ${(v2.brecha * 100).toFixed(0)}%)`,
  );
  console.log("  " + v2.rondasAsalto.join("\n  "));
  console.log(
    `  en campo abierto las máquinas no ayudan: ${(v2.campo * 100).toFixed(0)}% frente a ${(v2.campo0 * 100).toFixed(0)}% sin ellas`,
  );
  console.log(
    `  4 elefantes contra 6 de caballería: ${(v2.ele * 100).toFixed(0)}% (4 caballería: ${(v2.cab * 100).toFixed(0)}%)`,
  );
  console.log(`  ataque de los berserkers por ronda: ${v2.curva.join(" → ")}`);
  ok(v2.con > v2.sin + 0.2 && v2.brecha > 0.5, "las máquinas de asedio abren brecha y ganan asaltos");
  ok(v2.campo <= v2.campo0 + 0.15, "en campo abierto las máquinas son casi inútiles");
  ok(v2.ele > v2.cab + 0.2, "los elefantes arrollan a la caballería");
  const base = v2.curva[0];
  ok(
    Math.max(...v2.curva) > base * 1.4 && Math.min(...v2.curva) < base * 0.8,
    "berserker: subida de furia y luego bajón por debajo de lo normal",
  );
  ok(/enloquecen/.test(v2.berTxt) && /flaquean/.test(v2.berTxt), "el informe narra la furia y el bajón");
  ok(!v2.maqRecluta, "las máquinas de asedio no se reclutan en ciudad");
  ok(v2.unicas.length > 0, "el pueblo del jugador tiene tropas únicas: " + v2.unicas.join(", "));

  /* táctica: asalto con máquinas y elefantes */
  for (const [nom, A, D, ctx] of [
    ["asedio", { i: 6, l: 2, ari: 2, tor: 1, cat: 2, a: 2 }, { i: 5, a: 2 }, { fort: 2 }],
    ["elefantes", { ele: 3, i: 4, a: 2 }, { c: 4, x: 2, i: 4 }, {}],
    ["berserker", { ber: 4, i: 4, a: 2 }, { i: 6, l: 2, a: 2 }, {}],
  ]) {
    await page.evaluate(
      ([A, D, ctx]) => {
        window.__tac = null;
        window.__log = [];
        cmbTactica(
          { f: ME, u: { ...cmbVacio(), ...A }, gen: G.F[ME].ruler },
          { f: 2, u: { ...cmbVacio(), ...D }, gen: null },
          { auto: true, sinModal: true, velocidad: 12, terreno: "llanura", nombreLugar: "Prueba", ...ctx },
          "rt",
        ).then((r) => (window.__tac = r));
      },
      [A, D, ctx],
    );
    let shot = false;
    for (let k = 0; k < 600; k++) {
      await page.waitForTimeout(200);
      if (!shot && k === 5) {
        /* elige una unidad propia con habilidades para ver sus botones */
        await page.evaluate(() => {
          const u = BT && BT.units.find((o) => !o.side && act(o) && o.hab && o.hab.length && o.t !== "i");
          if (u) {
            BT.sel = u.id;
            BT.sels = [u.id];
            bui();
          }
        });
        await page.screenshot({ path: path.join(capt, `combate-v2-${nom}.png`) });
        shot = true;
      }
      if (
        await page.evaluate(() => {
          if (BT) window.__log = [...new Set([...(window.__log || []), ...BT.log.map((l) => l.m)])];
          return !!window.__tac;
        })
      )
        break;
    }
    const r = await page.evaluate(() => {
      const r = window.__tac;
      return (
        r && {
          gana: r.gana,
          hitos: r.informe.rondas.map((h) => h.t),
          log: window.__log || [],
          seg: r.informe.dur,
          fx: r.informe.factores.map((f) => f.txt),
        }
      );
    });
    console.log(
      `  táctica ${nom}: gana ${r && r.gana === 0 ? "el jugador" : "el enemigo"} en ${r && r.seg} s · ${r && r.fx.join("; ")}`,
    );
    const txt = r ? r.hitos.join(" ") + " " + r.log.join(" ") : "";
    if (nom === "asedio") ok(/muralla|adarve|Brecha/i.test(txt), "táctica: las máquinas atacan la muralla");
    if (nom === "berserker") ok(/enloquecen/.test(txt), "táctica: los berserkers usan su furia");
    if (nom === "elefantes") ok(r && r.hitos.length >= 2, "táctica: batalla con elefantes completa");
  }

  /* generales: experiencia y nivel; capitanes que surgen tras victorias sin general */
  const gm = await page.evaluate(() => {
    const p = owned(ME).find((q) => q.gen == null) || owned(ME)[0],
      g = G.F[ME].ruler,
      c = G.C[g],
      n0 = cmbNivel(c).nivel;
    for (let k = 0; k < 6; k++)
      OC.emitirSync("batallaResuelta", {
        p,
        atacante: ME,
        defensor: REB,
        gana: true,
        gA: g,
        gD: null,
        s0: { i: 12 },
        d0: { i: 8 },
      });
    const n1 = cmbNivel(c).nivel;
    p.gen = null;
    const antes = G.C.length;
    let k = 0;
    for (; k < 10 && !G.C.slice(antes).some((x) => x.rol === "capitan"); k++)
      OC.emitirSync("batallaResuelta", {
        p,
        atacante: REB,
        defensor: ME,
        gana: false,
        gA: null,
        gD: null,
        s0: { i: 8 },
        d0: { i: 10 },
      });
    const cap = G.C.slice(antes).find((x) => x.rol === "capitan");
    return {
      n0,
      n1,
      fama: c.fama,
      k,
      cap: cap && {
        id: cap.id,
        n: cap.n,
        linaje: cap.linaje,
        gen: p.gen === cap.id,
        nivel: cmbNivel(cap).nivel,
      },
      log: G.log.slice(0, 6).map((l) => l.m),
    };
  });
  console.log(
    `  general: nivel ${gm.n0} → ${gm.n1}, fama ${gm.fama}; capitán tras ${gm.k} victorias: ${gm.cap && gm.cap.n}`,
  );
  ok(gm.n1 > gm.n0, "el general sube de nivel con las victorias");
  ok(gm.cap && gm.cap.linaje === false && gm.cap.gen, "surge un capitán sin linaje que queda al mando");
  ok(
    gm.log.some((m) => /surge un capitán/.test(m)),
    "la crónica anuncia al capitán",
  );
  /* renombrar y ascender desde la pestaña Ejército */
  await page.evaluate(() => {
    tab = "cmb";
    ui();
  });
  await page.waitForTimeout(150);
  await page.locator("#panel").screenshot({ path: path.join(capt, "combate-v2-mandos.png") });
  await clic(`[data-act="renombrar-${gm.cap.id}"]`);
  await page.waitForTimeout(150);
  await page.fill("#cmbnom", "Aecio <b>Rompeyelmos</b>");
  await page.evaluate(() =>
    [...document.querySelectorAll("#modalc button")].find((b) => /Aceptar/.test(b.textContent)).click(),
  );
  await page.waitForTimeout(200);
  await clic(`[data-act="cmbasc-${gm.cap.id}"]`);
  const ren = await page.evaluate((id) => ({ n: G.C[id].n, rol: G.C[id].rol }), gm.cap.id);
  console.log(`  renombrado: «${ren.n}» · ${ren.rol}`);
  ok(ren.n === "Aecio Rompeyelmos", "renombrar valida y limpia el nombre");
  ok(ren.rol === "general", "un capitán se puede ascender a general");
  await page.evaluate(() => {
    tab = "prov";
    ui();
  });

  /* ---------- 8. V3: varios ejércitos y bandos, flancos, batalla táctica multi y aspecto ---------- */
  console.log("\n8. Varios bandos: 3 ejércitos, 2 contra 1, flancos y táctica multi");
  const v3 = await page.evaluate(() => {
    const E = (f, u, b) => ({ f, u: { ...cmbVacio(), ...u }, bando: b }),
      n = 400,
      tasa = (fn) => {
        let w = 0;
        for (let k = 0; k < n; k++) if (fn()) w++;
        return w / n;
      },
      tres = (o) =>
        cmbResolverMulti([E(2, { i: 8, a: 2 }, 0), E(2, { i: 8, a: 2 }, 1), E(2, { i: 8, a: 2 }, 2)], {
          terreno: "llanura",
          sinEvento: true,
          oportunista: o,
        }),
      opo = tasa(() => tres(2).gana === 2),
      sinOpo = tasa(() => tres(false).gana === 2),
      aliados = tasa(
        () =>
          cmbResolverMulti([E(0, { i: 6 }, 0), E(5, { i: 6 }, 0), E(2, { i: 10 }, 1)], {
            terreno: "llanura",
            sinEvento: true,
          }).gana === 0,
      ),
      solo0 = tasa(
        () =>
          cmbResolverAuto(
            { f: 0, u: { ...cmbVacio(), i: 6 } },
            { f: 2, u: { ...cmbVacio(), i: 10 } },
            { terreno: "llanura" },
          ).gana === 0,
      ),
      solo5 = tasa(
        () =>
          cmbResolverAuto(
            { f: 5, u: { ...cmbVacio(), i: 6 } },
            { f: 2, u: { ...cmbVacio(), i: 10 } },
            { terreno: "llanura" },
          ).gana === 0,
      ),
      /* compatibilidad: mismas cifras que la versión de dos ejércitos (medidas en la v2 con 1500 batallas) */
      llano = tasa(
        () =>
          cmbResolverAuto(
            { f: 0, u: { ...cmbVacio(), i: 10 } },
            { f: 2, u: { ...cmbVacio(), i: 7 } },
            { terreno: "llanura" },
          ).gana === 0,
      ),
      igual = tasa(
        () =>
          cmbResolverAuto(
            { f: 0, u: { ...cmbVacio(), i: 8 } },
            { f: 2, u: { ...cmbVacio(), i: 8 } },
            { terreno: "llanura" },
          ).gana === 0,
      ),
      asalto = (k) =>
        tasa(
          () =>
            cmbResolverAuto(
              { f: 0, u: { ...cmbVacio(), i: 12 } },
              { f: 2, u: { ...cmbVacio(), i: 7 } },
              { terreno: "llanura", fort: 2, flancos: k },
            ).gana === 0,
        ),
      f1 = asalto(1),
      f3 = asalto(3),
      fAp = tasa(
        () =>
          cmbResolverAuto(
            { f: 0, u: { ...cmbVacio(), i: 12 } },
            { f: 2, u: { ...cmbVacio(), i: 7 } },
            { terreno: "llanura", fort: 2, flancos: 3, flancosAplicados: true },
          ).gana === 0,
      ),
      inf3 = cmbResolverAuto(
        { f: 0, u: { ...cmbVacio(), i: 12 } },
        { f: 2, u: { ...cmbVacio(), i: 7 } },
        { terreno: "llanura", fort: 2, flancos: 3 },
      ).informe;
    /* evento con todos los ejércitos */
    let ev = null;
    const oy = (d) => (ev = d);
    OC.on("batallaResuelta", oy);
    const rm = cmbResolverMulti([E(ME, { i: 6, a: 2 }, 0), E(5, { i: 6 }, 0), E(2, { i: 10, a: 2 }, 1)], {
      terreno: "llanura",
      nombreLugar: "Prueba",
      emitir: true,
    });
    const evOk1 = !!(
      ev &&
      ev.multi &&
      ev.ejs &&
      ev.ejs.length === 3 &&
      ev.bandos &&
      ev.bandos.join() === "0,0,1" &&
      ev.atacante === ME
    );
    /* contrato de Campaña: ids, dir 'C' = la guarnición (con murallas), {id, u, her} y sin evento propio */
    ev = null;
    const lc = [
        { ...E(0, { i: 7 }, 0), id: 11, dir: "O" },
        { ...E(5, { i: 6 }, 0), id: 12, dir: "N" },
        { ...E(2, { i: 8 }, 1), id: "guarnicion", dir: "C" },
      ],
      rc = cmbResolverMulti(lc, { terreno: "llanura", fort: 2, flancos: 2, flancosAplicados: true }),
      contrato =
        !ev &&
        (rc.gana === 0 || rc.gana === 1) &&
        rc.ejs.map((x) => x.id).join() === "11,12,guarnicion" &&
        rc.ejs.every((x) => x.u && typeof x.her === "number") &&
        rc.informe.def === 2,
      evOk = evOk1 && contrato;
    const html = cmbInfHtml(rm.informe, 0);
    return {
      opo,
      sinOpo,
      aliados,
      solo0,
      solo5,
      llano,
      igual,
      f1,
      f3,
      fAp,
      fx3: inf3.factores
        .map((x) => x.txt)
        .concat(inf3.rondas.map((r) => r.t))
        .join(" | "),
      evOk,
      html: html.length,
      ejsRes: rm.ejs.map((e) => [e.f, e.bando, e.gana, tot(e.A)]),
    };
  });
  console.log(
    `  3 bandos iguales: el tercero que aguarda gana el ${(v3.opo * 100).toFixed(0)}% (sin aguardar ${(v3.sinOpo * 100).toFixed(0)}%; un tercio = 33%)`,
  );
  console.log(
    `  2 contra 1 (6+6 contra 10): los aliados ganan el ${(v3.aliados * 100).toFixed(0)}%; solos, ${(v3.solo0 * 100).toFixed(0)}% y ${(v3.solo5 * 100).toFixed(0)}%`,
  );
  console.log(
    `  compatibilidad (2 ejércitos): 10 contra 7 gana el ${(v3.llano * 100).toFixed(0)}% (v2: 80%), igualados ${(v3.igual * 100).toFixed(0)}% (v2: 38%)`,
  );
  console.log(
    `  asalto a murallas II con 12 contra 7: 1 flanco ${(v3.f1 * 100).toFixed(0)}%, 3 flancos ${(v3.f3 * 100).toFixed(0)}% (ya aplicados por campaña: ${(v3.fAp * 100).toFixed(0)}%)`,
  );
  ok(v3.opo > v3.sinOpo + 0.05 && v3.opo > 0.4, "el tercero oportunista sale beneficiado");
  ok(v3.aliados > Math.max(v3.solo0, v3.solo5) + 0.3, "dos aliados ganan más a menudo que cada uno solo");
  ok(
    Math.abs(v3.llano - 0.8) < 0.1 &&
      Math.abs(v3.igual - 0.38) < 0.12 /* ruido y tecnologías del mundo de prueba */,
    "con dos ejércitos, mismas cifras que antes (± ruido)",
  );
  ok(
    v3.f3 > v3.f1 + 0.08 && /flancos/.test(v3.fx3),
    "el asalto por varios flancos debilita la defensa y sale en el informe",
  );
  ok(Math.abs(v3.fAp - v3.f1) < 0.1, "no se aplican dos veces los flancos que campaña ya tradujo");
  ok(
    v3.evOk,
    "contrato de Campaña ({id, u, her}, dir 'C') y batallaResuelta con ejs y bandos (con ctx.emitir)",
  );
  ok(v3.html > 200 && v3.ejsRes.length === 3, "el informe pinta los tres ejércitos");

  /* táctica multi: 3 bandos en los tres modos, y 2 contra 1 */
  for (const [nom, modo, bandos] of [
    ["tres-t3", "t3", [0, 1, 2]],
    ["tres-t1", "t1", [0, 1, 2]],
    ["tres-rt", "rt", [0, 1, 2]],
    ["dos-contra-uno", "rt", [0, 0, 1]],
  ]) {
    await page.evaluate(
      ([modo, bandos]) => {
        window.__tac = null;
        window.__ev = null;
        OC.on("batallaResuelta", (d) => (window.__ev = d));
        const E = (f, u, b) => ({
          f,
          u: { ...cmbVacio(), ...u },
          bando: b,
          gen: f === ME ? G.F[ME].ruler : null,
        });
        cmbTacticaMulti(
          [
            E(ME, { i: 5, l: 2, a: 2, c: 2 }, bandos[0]),
            E(2, { i: 5, l: 2, a: 2, c: 1 }, bandos[1]),
            E(3, { c: 3, m: 3, i: 3 }, bandos[2]),
          ],
          {
            auto: true,
            sinModal: true,
            velocidad: 16,
            terreno: "llanura",
            nombreLugar: "Prueba",
            emitir: true,
          },
          modo,
        ).then((r) => (window.__tac = r));
      },
      [modo, bandos],
    );
    let shot = false;
    for (let k = 0; k < 600; k++) {
      await page.waitForTimeout(200);
      if (!shot && k === 6) {
        await page.screenshot({ path: path.join(capt, `combate-v3-${nom}.png`) });
        shot = true;
      }
      if (await page.evaluate(() => !!window.__tac)) break;
    }
    const r = await page.evaluate(() => {
      const r = window.__tac;
      return (
        r && {
          gana: r.gana,
          ejs: r.ejs.map((e) => [CIV[e.f].s, e.bando, e.gana, tot(e.A)]),
          dur: r.informe.dur,
          n: r.informe.f.length,
          ev: !!(window.__ev && window.__ev.ejs && window.__ev.ejs.length === 3),
        }
      );
    });
    console.log(`  táctica ${nom}: ${r ? JSON.stringify(r.ejs) + " · " + r.dur + " s" : "sin terminar"}`);
    ok(
      r && r.n === 3 && r.ejs.some((e) => e[2]) && r.ev,
      `táctica ${nom}: termina, con informe y evento de los tres ejércitos`,
    );
  }
  /* aspecto: rendimiento del dibujo con tres ejércitos grandes */
  const perf = await page.evaluate(async () => {
    const E = (f, u, b) => ({ f, u: { ...cmbVacio(), ...u }, bando: b });
    let fin = false;
    cmbTacticaMulti(
      [
        E(ME, { i: 12, l: 6, a: 6, c: 4 }, 0),
        E(2, { i: 12, l: 6, a: 6, c: 4 }, 1),
        E(3, { c: 8, m: 8, i: 8 }, 2),
      ],
      { auto: true, sinModal: true, velocidad: 4, terreno: "bosque", nombreLugar: "Prueba" },
      "rt",
    ).then(() => (fin = true));
    await new Promise((r) => setTimeout(r, 2500));
    if (!BT) return null;
    /* la mejor de cuatro tandas de 10 fotogramas (la máquina de pruebas puede ir cargada) */
    let ms = Infinity;
    for (let q = 0; q < 4; q++) {
      const t0 = performance.now();
      for (let k = 0; k < 10; k++) drawBattle(performance.now());
      ms = Math.min(ms, (performance.now() - t0) / 10);
      await new Promise((r) => setTimeout(r, 50));
    }
    const figs = BT.units.reduce((a, u) => a + cmbSlots(u).nf0, 0);
    BT.ctx.velocidad = 64;
    for (let k = 0; k < 400 && !fin; k++) await new Promise((r) => setTimeout(r, 100));
    return { ms, figs, dens: 0 };
  });
  console.log(
    `  dibujo con 3 ejércitos grandes: ${perf && perf.ms.toFixed(2)} ms por fotograma, ${perf && perf.figs} figuras`,
  );
  ok(perf && perf.ms < 16, "el campo con muchas figuras se dibuja con fluidez");

  /* ---------- 9. batalla en conjunto: direcciones, refuerzos, asalto por flancos y datos para el render ---------- */
  console.log("\n9. Batalla en conjunto: direcciones, refuerzos y asalto por flancos");
  const cj = await page.evaluate(() => {
    const E = (f, u, b, dir) => ({ f, u: { ...cmbVacio(), ...u }, bando: b, dir }),
      n = 300,
      tasa = (fn) => {
        let w = 0;
        for (let k = 0; k < n; k++) if (fn()) w++;
        return w / n;
      },
      solo = tasa(
        () =>
          cmbResolverMulti([E(0, { i: 7 }, 0), E(2, { i: 10 }, 1)], { terreno: "llanura", sinEvento: true })
            .gana === 0,
      ),
      conRef = tasa(
        () =>
          cmbResolverMulti([E(0, { i: 7 }, 0), E(2, { i: 10 }, 1)], {
            terreno: "llanura",
            sinEvento: true,
            refuerzos: [{ ej: E(5, { i: 6 }, 0), dir: "N", llegada: 20 }],
          }).gana === 0,
      ),
      mismaDir = tasa(
        () =>
          cmbResolverMulti([E(0, { i: 6 }, 0, "O"), E(5, { i: 6 }, 0, "O"), E(2, { i: 12 }, 1, "E")], {
            terreno: "llanura",
            sinEvento: true,
          }).gana === 0,
      ),
      dosDir = tasa(
        () =>
          cmbResolverMulti([E(0, { i: 6 }, 0, "O"), E(5, { i: 6 }, 0, "N"), E(2, { i: 12 }, 1, "E")], {
            terreno: "llanura",
            sinEvento: true,
          }).gana === 0,
      ),
      r1 = cmbResolverMulti([E(0, { i: 7 }, 0), E(2, { i: 10 }, 1)], {
        terreno: "llanura",
        sinEvento: true,
        refuerzos: [{ ej: E(5, { i: 6 }, 0), dir: "N", llegada: 20 }],
      }),
      /* varias muestras: el hito compite con otros por salir en la crónica de la ronda */
      r2s = [...Array(8)].map(() =>
        cmbResolverMulti([E(0, { i: 6 }, 0, "O"), E(5, { i: 6 }, 0, 0), E(2, { i: 12 }, 1, "E")], {
          terreno: "llanura",
          sinEvento: true,
        }),
      ),
      txt = (r) =>
        r.informe.rondas
          .map((x) => x.t)
          .concat(r.informe.factores.map((x) => x.txt))
          .join(" | ");
    return { solo, conRef, mismaDir, dosDir, t1: txt(r1), n1: r1.ejs.length, t2: r2s.map(txt).join(" || ") };
  });
  console.log(
    `  7 contra 10: solos ${(cj.solo * 100).toFixed(0)}%; con 6 aliados de refuerzo a los 20 s ${(cj.conRef * 100).toFixed(0)}%`,
  );
  console.log(
    `  6+6 contra 12: aliados por el mismo lado ${(cj.mismaDir * 100).toFixed(0)}%, por dos direcciones ${(cj.dosDir * 100).toFixed(0)}%`,
  );
  ok(
    cj.conRef > cj.solo + 0.2 && /Llegan refuerzos/.test(cj.t1) && cj.n1 === 3,
    "los refuerzos llegan durante la batalla y cuentan (automática)",
  );
  ok(
    cj.dosDir > cj.mismaDir && /atacadas desde/.test(cj.t2),
    "atacar desde dos direcciones envuelve al enemigo",
  );

  /* táctica en conjunto: tú por el oeste, un aliado por el norte, el enemigo al este y refuerzos por el sur */
  await page.evaluate(() => {
    window.__tac = null;
    window.__dat = null;
    const E = (f, u, b, dir) => ({
      f,
      u: { ...cmbVacio(), ...u },
      bando: b,
      dir,
      gen: f === ME ? G.F[ME].ruler : null,
    });
    cmbTacticaMulti(
      [
        E(ME, { i: 5, a: 2, c: 1 }, 0, "O"),
        E(5, { i: 5, l: 2 }, 0, "N"),
        E(2, { i: 8, l: 2, a: 2, c: 2 }, 1, "E"),
      ],
      {
        auto: true,
        sinModal: true,
        velocidad: 12,
        terreno: "llanura",
        nombreLugar: "Prueba",
        refuerzos: [{ ej: E(3, { c: 3, m: 2 }, 0), dir: "S", llegada: 15 }],
      },
      "rt",
    ).then((r) => (window.__tac = r));
    setTimeout(() => (window.__dat = cmbRender()), 300);
  });
  let shotC = false;
  for (let k = 0; k < 600; k++) {
    await page.waitForTimeout(200);
    if (!shotC && k === 8) {
      await page.screenshot({ path: path.join(capt, "combate-v3-conjunto.png") });
      shotC = true;
    }
    if (
      await page.evaluate(() => {
        if (BT) window.__log = [...new Set([...(window.__log || []), ...BT.log.map((l) => l.m)])];
        return !!window.__tac;
      })
    )
      break;
  }
  const tc = await page.evaluate(() => {
    const r = window.__tac,
      d = window.__dat,
      norte = d && d.unidades.filter((u) => u.lado === 1),
      log = (window.__log || []).join(" | ");
    return {
      fin: !!r,
      n: r && r.ejs.length,
      llego: /Llegan refuerzos/.test(log),
      aliadoN: norte && norte.length && norte.every((u) => u.y < 7),
      datos:
        d &&
        d.unidades[0] &&
        ["x", "y", "cara", "filas", "columnas", "figuras", "estado", "bando"].every(
          (k) => k in d.unidades[0],
        ) &&
        d.ejercitos.length === 4,
      ejs: r && r.ejs.map((e) => [CIV[e.f].s, e.bando, e.gana, tot(e.A)]),
    };
  });
  console.log(`  táctica en conjunto: ${JSON.stringify(tc.ejs)}`);
  ok(tc.fin && tc.n === 4, "táctica en conjunto con cuatro ejércitos (uno de refuerzo) termina");
  ok(tc.aliadoN, "el aliado que llega del norte despliega por el norte");
  ok(tc.llego, "los refuerzos entran por su borde a media batalla");
  ok(tc.datos, "cmbRender da los datos de cada unidad para el render");

  /* asalto por tres flancos: la ciudad al fondo con tres lienzos */
  await page.evaluate(() => {
    window.__tac = null;
    window.__log = [];
    const E = (f, u, b) => ({ f, u: { ...cmbVacio(), ...u }, bando: b });
    cmbTacticaMulti(
      [E(ME, { i: 8, l: 3, a: 2, ari: 1 }, 0), E(2, { i: 6, a: 2 }, 1)],
      {
        auto: true,
        sinModal: true,
        velocidad: 12,
        fort: 2,
        flancos: 3,
        def: 1,
        terreno: "llanura",
        nombreLugar: "Prueba",
      },
      "rt",
    ).then((r) => (window.__tac = r));
  });
  let shotA = false,
    flancoN = false;
  for (let k = 0; k < 600; k++) {
    await page.waitForTimeout(200);
    if (!shotA && k === 3) {
      flancoN = await page.evaluate(
        () => BT && BT.units.some((u) => u.side === 0 && u.y < BT.muro.y0 && u.x > BT.muro.x),
      );
      await page.screenshot({ path: path.join(capt, "combate-v3-asalto-flancos.png") });
      shotA = true;
    }
    if (
      await page.evaluate(() => {
        if (BT) window.__log = [...new Set([...(window.__log || []), ...BT.log.map((l) => l.m)])];
        return !!window.__tac;
      })
    )
      break;
  }
  const fl3 = await page.evaluate(() => ({ fin: !!window.__tac, log: (window.__log || []).join(" | ") }));
  ok(
    fl3.fin && flancoN && /flancos/.test(fl3.log),
    "asalto táctico por tres flancos: atacantes ante el lienzo norte y la guarnición repartida",
  );

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
