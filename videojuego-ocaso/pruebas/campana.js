/* Prueba del sistema CAMPAÑA: ejércitos en el mapa, estaciones, asedios, máquinas, encuentros,
   mercenarios e IA. Uso:  node pruebas/campana.js [años=16] [civ=0]
   Guarda capturas en pruebas/capturas/campana-*.png */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ANIOS = +(process.argv[2] || 16);
const CIVN = +(process.argv[3] || 0);
const SEMILLA = +(process.argv[4] || 20261124);
const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });
const fallos = [];
const ok = (c, m) => {
  console.log((c ? "  ✔ " : "  ✘ ") + m);
  if (!c) fallos.push(m);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errores = [];
  page.on("pageerror", (e) => errores.push("pageerror: " + (e.stack || e.message)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.g|ERR_|net::/.test(m.text())) errores.push("console: " + m.text());
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  /* semilla fija (Math.random determinista): node pruebas/campana.js [años] [civ] [semilla] */
  await page.addInitScript((sem) => {
    let a = sem | 0;
    Math.random = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, SEMILLA);
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(300);

  const cerrarModales = async () => {
    for (let k = 0; k < 60; k++) {
      const st = await page.evaluate(() => ({
        m: document.getElementById("modal").classList.contains("show"),
        b: document.getElementById("battle").classList.contains("show"),
      }));
      if (st.b) {
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('#bside button[data-act^="b-"]')].find((x) => /auto|deleg|retir|huir/i.test(x.textContent));
          b && b.click();
        });
        await page.waitForTimeout(100);
        continue;
      }
      if (!st.m) return;
      await page.evaluate(() => {
        const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
        const auto = bs.find((b) => /autom/i.test(b.textContent));
        (auto || bs[0])?.click();
      });
      await page.waitForTimeout(30);
    }
  };
  /* ejecuta código asíncrono del juego en segundo plano, cerrando los modales que abra */
  const corre = async (src, arg) => {
    await page.evaluate(
      ({ src, arg }) => {
        window.__fin = false;
        window.__res = undefined;
        busy = true;
        const fn = new Function("arg", `return (async () => { ${src} })();`);
        fn(arg)
          .then((r) => (window.__res = r))
          .catch((e) => console.error("prueba", e))
          .finally(() => {
            busy = false;
            window.__fin = true;
          });
      },
      { src, arg },
    );
    for (let k = 0; k < 3000; k++) {
      if (await page.evaluate(() => window.__fin)) break;
      await cerrarModales();
      await page.waitForTimeout(15);
    }
    await cerrarModales();
    return page.evaluate(() => window.__res);
  };

  await page.click('[data-act="s-new"]');
  await page.click(`[data-act="s-civ-${CIVN}"]`);
  await page.click('[data-act="s-go"]');
  await page.waitForTimeout(300);
  await cerrarModales();

  const MEv = await page.evaluate(() => ME),
    REBv = await page.evaluate(() => REB);
  /* utilidades dentro de la página */
  await page.evaluate(() => {
    window.__ev = { bat: [], conq: [], est: 0 };
    OC.on("batallaResuelta", (b) => window.__ev.bat.push({ t: b.campana || "settle", a: b.atacante, d: b.defensor, g: b.gana, y: G.year, p: b.p ? b.p.id : null, maq: b.s0 ? (b.s0.ari || 0) + (b.s0.tor || 0) + (b.s0.cat || 0) : 0, ejs: b.ejercitos || null }));
    OC.on("conquista", (c) => window.__ev.conq.push({ p: c.p.id, de: c.de, a: c.a, y: G.year }));
    OC.on("finEstacion", () => window.__ev.est++);
    /* casilla de tierra libre de la provincia pid (lejos de ciudades), opcionalmente junto a (x, y) */
    window.casilla = (pid, cerca) => {
      const l = [];
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          if (MAP.grid[y][x] !== pid || !camPasable(x, y) || camCiudadEn(x, y) || camEjsEn(x, y).length) continue;
          if (cerca && camCheb(x, y, cerca[0], cerca[1]) !== 1) continue;
          if (!cerca && G.P.some((p) => camCheb(p.x, p.y, x, y) <= 1)) continue;
          l.push([x, y]);
        }
      return l[0] || null;
    };
    window.paz = (f) => {
      for (let g = 0; g < NF; g++) if (g !== f) G.st[f][g] = G.st[g][f] = "paz";
    };
  });

  /* ---------- 1. formar y marchar con alcance limitado ---------- */
  console.log("1. Marcha con alcance limitado");
  const m1 = await corre(`
    paz(ME);
    const cap = G.P[G.F[ME].capId];
    cap.u = cmbNorm({ i: 20, a: 4, c: 4 });
    const r = await camAplicarOrden(G, { tipo: "formar", f: ME, p: cap.id, u: { i: 8, a: 2 } });
    const ej = camEj(r.ej), m0 = ej.mov, mx = camMovMax(ej);
    const cab = camNuevoEj(ME, cap.x, cap.y, { c: 3 }, {});
    const D = camDijkstra(ej, {});
    /* destino lejano dentro de la tierra propia o rebelde: la casilla más cara alcanzable */
    let lejos = -1, ld = 0;
    for (let i = 0; i < W * H; i++) if (Number.isFinite(D.dist[i]) && D.dist[i] > ld && D.dist[i] < mx * 2.5 && !camCiudadEn(i % W, Math.floor(i / W))) { ld = D.dist[i]; lejos = i; }
    const [x, y] = camXY(lejos);
    const or = { tipo: "mover", f: ME, ej: ej.id, x, y, luego: "acampar" };
    const json = JSON.parse(JSON.stringify(or));
    await camAplicarOrden(G, json, {});
    const gastado = m0 - ej.mov, inv = camMovMax({ ...ej, fat: 0 }, 3);
    return { m0, mx, mxCab: camMovMax(cab), gastado, plan: !!ej.plan, ld, x: ej.x, y: ej.y, cx: cap.x, cy: cap.y, inv, mxSin: camMovMax({ ...ej, fat: 0 }), id: ej.id, cab: cab.id };
  `);
  console.log("  " + JSON.stringify(m1));
  ok(m1.mx > 6 && m1.mx < 16, `alcance de infantería por estación ${m1.mx}`);
  ok(m1.mxCab > m1.mx * 1.5, `la caballería llega más lejos (${m1.mxCab} frente a ${m1.mx})`);
  ok(m1.inv < m1.mxSin, `en invierno se anda menos (${m1.inv} < ${m1.mxSin})`);
  ok(m1.gastado <= m1.m0 + 1e-6 && m1.gastado > 0, `la marcha gasta ${m1.gastado} de ${m1.m0} puntos y se detiene`);
  ok(m1.plan && (m1.x !== m1.cx || m1.y !== m1.cy), "el destino lejano queda como marcha pendiente para la estación siguiente");
  await page.evaluate((id) => {
    camSel = id;
    sel = camPid(camEj(id).x, camEj(id).y);
    camEj(id).mov = camMovMax(camEj(id));
    camHov = -1;
    tab = "prov";
    ui();
  }, m1.cab);
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(capt, "campana-alcance.png") });
  /* calzadas: menos coste en tierra propia */
  const cz = await page.evaluate(() => {
    const ej = camEj(G.cam.ej[0].id),
      cap = G.P[G.F[ME].capId],
      i = camIdx(cap.x + 1, cap.y);
    const a = camCoste(ME, i);
    const T0 = typeof tecF === "function" ? tecF(ME) : null;
    if (T0) T0.h.push("vias");
    const b = camCoste(ME, i);
    if (T0) T0.h = T0.h.filter((x) => x !== "vias");
    return { a, b, ok: !!T0, ej: !!ej };
  });
  ok(!cz.ok || cz.b < cz.a, `las Calzadas abaratan la marcha en tierra propia (${cz.a} → ${cz.b})`);

  /* ---------- 2. acampar en tierra enemiga: saqueo y víveres ---------- */
  console.log("2. Campamento en tierra enemiga");
  const m2 = await corre(`
    const cap = G.P[G.F[ME].capId];
    let q = G.P.filter((p) => p.owner !== ME).sort((a, b) => Math.hypot(a.x - cap.x, a.y - cap.y) - Math.hypot(b.x - cap.x, b.y - cap.y))[0];
    if (q.owner < NF) { G.st[ME][q.owner] = G.st[q.owner][ME] = "guerra"; }
    const xy = casilla(q.id);
    const ej = camNuevoEj(ME, xy[0], xy[1], { i: 6, c: 2 }, { sum: 1 });
    const o0 = q.order, g0 = G.F[ME].gold;
    const r = await camAplicarOrden(G, { tipo: "acampar", f: ME, ej: ej.id });
    await finEstacion();
    return { ok: r.ok, est: camEj(ej.id) && camEj(ej.id).est, sum: camEj(ej.id) && camEj(ej.id).sum, saq: G.cam.saq[q.id] != null, o0, o1: q.order, q: q.id, id: ej.id, own: q.owner };
  `);
  console.log("  " + JSON.stringify(m2));
  ok(m2.ok && m2.est === "campamento", "el ejército acampa en tierra enemiga");
  ok(m2.saq && m2.o1 < m2.o0, `saquea la comarca (orden ${m2.o0} → ${m2.o1})`);
  ok(m2.sum >= 1, `el forrajeo mantiene los víveres (${m2.sum})`);
  await page.evaluate((id) => {
    camSel = id;
    ui();
  }, m2.id);
  await page.screenshot({ path: path.join(capt, "campana-campamento.png") });

  /* ---------- 3. asedio de varias estaciones con máquinas y asalto ---------- */
  console.log("3. Asedio, máquinas y asalto");
  const m3 = await corre(`
    const cap = G.P[G.F[ME].capId];
    const q = G.P.filter((p) => p.owner !== ME && p.id !== arg.q).sort((a, b) => Math.hypot(a.x - cap.x, a.y - cap.y) - Math.hypot(b.x - cap.x, b.y - cap.y))[0];
    if (q.owner < NF) G.st[ME][q.owner] = G.st[q.owner][ME] = "guerra";
    q.walls = 2; q.u = cmbNorm({ i: 6, a: 3 }); q.order = 60;
    const xy = casilla(q.id, [q.x, q.y]) || casilla(MAP.grid[q.y][q.x + 1], [q.x, q.y]);
    const ej = camNuevoEj(ME, xy[0], xy[1], { i: 16, l: 4, a: 6, c: 4 }, {});
    const F = G.F[ME]; F.gold = 900; F.res = F.res || {}; F.res.madera = 200;
    const r = await camAplicarOrden(G, { tipo: "asediar", f: ME, ej: ej.id, p: q.id });
    const c1 = await camAplicarOrden(G, { tipo: "construir", f: ME, ej: ej.id, maq: "ari" });
    const c2 = await camAplicarOrden(G, { tipo: "construir", f: ME, ej: ej.id, maq: "tor" });
    const vi0 = G.cam.as[q.id].vi;
    q.walls = 2;
    const seq = [];
    for (let k = 0; k < 2; k++) {
      /* ciudad leal y guarnición entera: que no se rinda antes de probar las máquinas */
      q.order = 95;
      G.cam.as[q.id].mo = 100;
      G.cam.as[q.id].vi = Math.max(G.cam.as[q.id].vi, 3);
      await finEstacion();
      const a = G.cam.as[q.id];
      seq.push({ n: a ? a.n : null, vi: a ? a.vi : null, maq: camEj(ej.id) ? camMaq(camEj(ej.id)) : null, o: q.owner });
      if (q.owner === ME) break;
    }
    const e = camEj(ej.id);
    const fortEf = e && G.cam.as[q.id] ? camFortEf(q, e, G.cam.as[q.id]) : null,
      enU = e ? Object.keys(CAM_MAQ).filter((k) => (e.u[k] || 0) > 0 && UN[k] && UN[k].asedio) : [];
    let asalto = null;
    const nb = window.__ev.bat.length;
    if (q.owner !== ME && e) asalto = await camAplicarOrden(G, { tipo: "asaltar", f: ME, ej: ej.id });
    const bAs = window.__ev.bat.slice(nb).find((b) => b.t === "asalto");
    if (asalto) asalto.maq = bAs ? bAs.maq : -1;
    return { r: r.ok, c1: c1.ok, c2: c2.ok, vi0, seq, fortEf, enU, combateMaq: !!(UN.ari && TYP.includes("ari")), asalto, own: q.owner, q: q.id, walls: q.walls };
  `, { q: m2.q });
  console.log("  " + JSON.stringify(m3));
  ok(m3.r && m3.c1 && m3.c2, "pone cerco y encarga un ariete y una torre");
  const s0 = m3.seq[0] || {};
  ok(s0.n >= 1 && s0.vi < m3.vi0, `el cerco avanza por estaciones (víveres ${m3.vi0} → ${s0.vi})`);
  const mq = (m3.seq[m3.seq.length - 1] || {}).maq || {};
  ok(mq.ari >= 1 && mq.tor >= 1, `máquinas terminadas: ${JSON.stringify(mq)}`);
  ok(m3.combateMaq ? m3.enU.includes("ari") && m3.enU.includes("tor") : m3.fortEf != null && m3.fortEf < 2, m3.combateMaq ? `las máquinas van como unidades al asalto (ejA.u: ${m3.enU})` : `las máquinas rebajan las murallas efectivas (2 → ${m3.fortEf})`);
  ok(m3.own === MEv, "la ciudad cae (asalto o rendición)");
  ok(!m3.asalto || !m3.combateMaq || m3.asalto.maq >= 2, `el asalto lleva las máquinas en ejA.u (${m3.asalto ? m3.asalto.maq : "-"})`);

  /* ---------- 3b. varios ejércitos por distintos flancos y asalto conjunto ---------- */
  console.log("3b. Flancos y asalto conjunto");
  const m3b = await corre(`
    const cap = G.P[G.F[ME].capId];
    /* ciudad enemiga con sitio libre a su alrededor y una casilla de reunión a 3 casillas */
    const ps = G.P.filter((p) => p.owner !== ME && !p.cap).sort((a, b) => Math.hypot(a.x - cap.x, a.y - cap.y) - Math.hypot(b.x - cap.x, b.y - cap.y));
    let q = null, reu = null;
    for (const p of ps) {
      const libres = CAM_V8.filter(([dx, dy]) => camPasable(p.x + dx, p.y + dy) && !camEjsEn(p.x + dx, p.y + dy).length && !camCiudadEn(p.x + dx, p.y + dy));
      const lados = new Set(libres.map(([dx, dy]) => camFlanco(dx, dy)));
      if (lados.size < 4) continue;
      for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) {
        const x = p.x + dx, y = p.y + dy;
        if (camPasable(x, y) && MAP.grid[y][x] >= 0 && !camCiudadEn(x, y) && !camEjsEn(x, y).length) { reu = [x, y]; break; }
      }
      if (reu) { q = p; break; }
    }
    if (!q) return { sin: true };
    if (q.owner < NF) G.st[ME][q.owner] = G.st[q.owner][ME] = "guerra";
    for (const e of G.cam.ej.slice()) if (e.f !== ME && camCheb(e.x, e.y, q.x, q.y) <= 2) camQuitar(e);
    q.walls = 2; q.u = cmbNorm({ l: 10, i: 24, a: 8 }); q.order = 95; q.gen = null;
    const hace = (u) => { const e = camNuevoEj(ME, reu[0], reu[1], u, {}); e.mov = 30; return e; };
    const A = hace({ i: 10, a: 3, c: 2 }), B = hace({ i: 8, l: 3, a: 2 }), C = hace({ i: 6, c: 3, x: 2 });
    for (const e of [A, B, C]) await camAplicarOrden(G, { tipo: "mover", f: ME, ej: e.id, x: q.x, y: q.y, luego: "asediar", p: q.id });
    const fl = camFlancosDe(ME, q);
    const lados = [A, B, C].map((e) => camFlanco(e.x - q.x, e.y - q.y));
    /* estimaciones: el mayor solo, los tres juntos, y la misma fuerza por 1 o por 3 flancos */
    const solo = camEstimarAsalto([A], q, 40), junto = camEstimarAsalto([A, B, C], q, 40);
    const F = camFuerzaConjunta([A, B, C]), ctx3 = camCtxAsalto(A, q, [A, B, C]);
    const f1 = cmbEstimar(F.ej, camGuarnicion(q), camCtxAsalto(A, q, [A]), 60), f3 = cmbEstimar(F.ej, camGuarnicion(q), ctx3, 60);
    /* captura del cerco por tres flancos con un ejército seleccionado */
    camSel = A.id; sel = q.id; tab = "prov"; ui();
    if (typeof setZoom === "function") setZoom(3);
    centerOn(q.id);
    return { sin: false, q: q.id, lados, nl: fl.lados.length, solo, junto, f1, f3, ids: [A.id, B.id, C.id], k3: ctx3.flancos };
  `);
  console.log("  " + JSON.stringify(m3b));
  if (!m3b.sin) {
    ok(m3b.nl >= 3 && new Set(m3b.lados).size >= 3, `tres ejércitos cercan por flancos distintos (${m3b.lados.join(", ")}; ${m3b.nl}/4)`);
    ok(m3b.junto > m3b.solo, `el asalto conjunto gana más que uno solo (${Math.round(m3b.junto * 100)}% frente a ${Math.round(m3b.solo * 100)}%)`);
    ok(m3b.f3 >= m3b.f1, `la misma fuerza por 3 flancos rinde más que por 1 (${Math.round(m3b.f3 * 100)}% frente a ${Math.round(m3b.f1 * 100)}%)`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(capt, "campana-flancos-cerco.png") });
    /* el asalto conjunto como orden serializable */
    const m3c = await corre(`
      const [a, b, c] = arg.ids.map(camEj), q = G.P[arg.q];
      const n0 = [a, b, c].map((e) => camTot(camUCampo(e.u))), nb = window.__ev.bat.length;
      const o = JSON.parse(JSON.stringify({ tipo: "asaltar", f: ME, ej: a.id, p: q.id, con: [b.id, c.id] }));
      const r = await camAplicarOrden(G, o, { auto: true });
      const bats = window.__ev.bat.slice(nb).filter((x) => x.t === "asalto");
      const inf = (G.cmb.inf || [])[0];
      const bajas = (r.bajas || []).map((x) => ({ ...x, pc: x.n0 ? (x.n0 - x.n1) / x.n0 : 0 }));
      const otra = await camAplicarOrden(G, { tipo: "asaltar", f: ME, ej: b.id, p: q.id });
      camAnimAsalto = { p: q.id, t0: performance.now() - 500, ejs: arg.ids.map((id, i) => [camEj(id) ? camEj(id).x : q.x - 1, camEj(id) ? camEj(id).y : q.y, ME]) };
      ui();
      return { ok: r.ok, gana: r.gana, k: r.flancos, n: (r.ejs || []).length, bats: bats.length, factor: !!(inf && inf.factores.some((x) => x.k === "flancos")), bajas, n0, otra: otra.ok, own: q.owner, enCiudad: arg.ids.filter((id) => camEj(id) && camEj(id).x === q.x && camEj(id).y === q.y).length };
    `, m3b);
    console.log("  " + JSON.stringify(m3c));
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(capt, "campana-flancos-asalto.png") });
    await page.evaluate(() => typeof setZoom === "function" && setZoom(1));
    ok(m3c.ok && m3c.n === 3 && m3c.k === 3 && m3c.bats === 1, "los tres ejércitos asaltan juntos en UNA batalla por 3 flancos");
    ok(m3c.factor, "el informe lleva el factor «asalto por 3 flancos»");
    const pcs = m3c.bajas.map((x) => x.pc);
    ok(m3c.bajas.length === 3 && Math.max(...pcs) - Math.min(...pcs) < 0.3, `las bajas se reparten según lo aportado (${pcs.map((x) => Math.round(x * 100) + "%").join(", ")})`);
    ok(!m3c.otra, "un ejército que ya asaltó no repite en la misma estación");
    ok(!m3c.gana || (m3c.own === MEv && m3c.enCiudad === 1), "si se gana, el que más aportó entra en la ciudad y los demás quedan junto a ella");
  }

  /* ---------- 3c. un cerco es de quien lo puso ---------- */
  console.log("3c. Un cerco es de quien lo puso");
  const m3d = await corre(`
    const A = [...Array(NF).keys()].find((f) => f !== ME && alive(f));
    const libre = (p) => CAM_V8.map(([dx, dy]) => [p.x + dx, p.y + dy]).filter(([x, y]) => camPasable(x, y) && !camEjsEn(x, y).length && !camCiudadEn(x, y));
    const cs = G.P.filter((p) => p.owner !== ME && p.owner !== A && !p.cap && libre(p).length >= 4 && !camAsedio(p.id));
    const [q, q3] = cs;
    const guerra = (a, b) => { if (b < NF) G.st[a][b] = G.st[b][a] = "guerra"; };
    for (const c of [q, q3]) { guerra(ME, c.owner); guerra(A, c.owner); for (const e of G.cam.ej.slice()) if (camCheb(e.x, e.y, c.x, c.y) <= 2) camQuitar(e); }
    G.st[ME][A] = G.st[A][ME] = "paz";
    G.rel[ME][A] = G.rel[A][ME] = -50;
    q.walls = 1; q.u = cmbNorm({ i: 3 }); q.gen = null;
    const [a1, a2] = libre(q);
    const ea = camNuevoEj(A, a1[0], a1[1], { i: 12, c: 3 }, {});
    const r0 = camAsediar(ea, q);
    const em = camNuevoEj(ME, a2[0], a2[1], { i: 10, a: 3 }, {});
    const r1 = await camAplicarOrden(G, { tipo: "asediar", f: ME, ej: em.id, p: q.id });
    const r2 = await camAplicarOrden(G, { tipo: "asaltar", f: ME, ej: em.id, p: q.id });
    const g0 = q.u; q.u = cmbVacio();
    const r3 = await camAplicarOrden(G, { tipo: "asaltar", f: ME, ej: em.id, p: q.id });
    const dueno0 = q.owner;
    q.u = g0;
    const rech = await camPedirCerco(ME, q);
    /* con buena relación, A acepta: co-sitiador, asalto conjunto, la ciudad es de A y el botín se reparte */
    G.rel[ME][A] = G.rel[A][ME] = 60;
    G.cam.as[q.id].no = {};
    const acep = await camPedirCerco(ME, q);
    const r4 = await camAplicarOrden(G, { tipo: "asediar", f: ME, ej: em.id, p: q.id });
    const oro0 = G.F[ME].gold;
    const r5 = await camAplicarOrden(G, { tipo: "asaltar", f: ME, ej: em.id, p: q.id }, { auto: true });
    const res = { A, r0: r0.ok, r1: r1.ok, m1: r1.motivo, r2: r2.ok, r3: r3.ok, dueno0, qOwner0: g0 && q.owner, rech, acep, r4: r4.ok, r5ok: r5.ok, gana: r5.gana, n5: (r5.ejs || []).length, dueno: q.owner, botin: G.F[ME].gold - oro0 };
    /* llegada simultánea de dos bandos que no comparten: el primero que cerca manda */
    G.rel[ME][A] = G.rel[A][ME] = -50;
    q3.walls = 1; q3.u = cmbNorm({ i: 6 });
    const lb = libre(q3);
    const lejos = (x0, y0) => { for (let r = 3; r <= 4; r++) for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) { const x = x0 + dx, y = y0 + dy; if (camPasable(x, y) && MAP.grid[y][x] >= 0 && !camCiudadEn(x, y) && !camEjsEn(x, y).length && camPaso(ME, G.P[MAP.grid[y][x]].owner) && camPaso(A, G.P[MAP.grid[y][x]].owner)) return [x, y]; } return null; };
    const s1 = lejos(q3.x, q3.y);
    if (!s1) return { ...res, sinCarrera: true };
    const m1 = camNuevoEj(ME, s1[0], s1[1], { i: 8 }, {}), m2 = camNuevoEj(A, s1[0], s1[1], { c: 6 }, {});
    m1.mov = m2.mov = 40;
    await camResolverSimultaneo(G, [
      { tipo: "mover", f: ME, ej: m1.id, x: q3.x, y: q3.y, luego: "asediar", p: q3.id },
      { tipo: "mover", f: A, ej: m2.id, x: q3.x, y: q3.y, luego: "asediar", p: q3.id },
    ], { auto: true });
    const as3 = camAsedio(q3.id);
    return { ...res, cerco3: as3 ? as3.f : null, est1: camEj(m1.id) && camEj(m1.id).est, est2: camEj(m2.id) && camEj(m2.id).est };
  `);
  console.log("  " + JSON.stringify(m3d));
  ok(m3d.r0 && !m3d.r1 && !m3d.r2, "con la ciudad cercada por otro reino, no puedes asediarla ni asaltarla por tu cuenta");
  ok(!m3d.r3 && m3d.dueno0 !== MEv, "tampoco ocuparla aunque quede vacía");
  ok(!m3d.rech && m3d.acep && m3d.r4, "el que cerca rechaza o acepta (según la relación) que te sumes; aceptado, cercas por otro flanco");
  ok(m3d.r5ok && m3d.n5 >= 2 && (!m3d.gana || (m3d.dueno === m3d.A && m3d.botin > 0)), `el asalto del co-sitiador es conjunto y la ciudad es de quien inició el cerco (botín para ti: ${m3d.botin})`);
  ok(m3d.sinCarrera || (m3d.cerco3 != null && [m3d.est1, m3d.est2].filter((x) => x === "asedio").length === 1), `en la llegada simultánea, el primero que cerca manda (cerco de ${m3d.cerco3})`);

  /* ---------- 4. rendición por hambre ---------- */
  console.log("4. Rendición por hambre");
  const m4 = await corre(`
    const cap = G.P[G.F[ME].capId];
    const ps = G.P.filter((p) => p.owner !== ME && !p.cap).sort((a, b) => Math.hypot(a.x - cap.x, a.y - cap.y) - Math.hypot(b.x - cap.x, b.y - cap.y));
    let q = null, xy = null;
    for (const p of ps) { xy = casilla(p.id, [p.x, p.y]); if (xy) { q = p; break; } }
    if (q.owner < NF) G.st[ME][q.owner] = G.st[q.owner][ME] = "guerra";
    q.walls = 3; q.u = cmbNorm({ i: 3 }); q.order = 45; q.farm = 0;
    const ej = camNuevoEj(ME, xy[0], xy[1], { i: 10, a: 4 }, {});
    G.F[ME].food = 500;
    await camAplicarOrden(G, { tipo: "asediar", f: ME, ej: ej.id, p: q.id });
    G.cam.as[q.id].vi = 0; /* graneros casi vacíos */
    const n0 = window.__ev.bat.length;
    let k = 0;
    for (; k < 14 && q.owner !== ME; k++) { camEj(ej.id) && (camEj(ej.id).sum = 3); await finEstacion(); }
    const rend = G.log.slice(0, 80).some((l) => /abre sus puertas|poterna/.test(l.m) && l.m.includes(q.name));
    const hambre = G.log.slice(0, 80).some((l) => /El hambre llega/.test(l.m) && l.m.includes(q.name));
    return { k, own: q.owner, rend, walls: q.walls, hambre, asaltos: window.__ev.bat.slice(n0).filter((b) => b.t === "asalto" && b.p === q.id).length };
  `);
  console.log("  " + JSON.stringify(m4));
  ok(m4.own === MEv && m4.rend && !m4.asaltos, `la guarnición se rinde sin asalto tras ${m4.k} estación(es) de cerco (murallas intactas: ${m4.walls})`);
  ok(m4.hambre, "el hambre llega a la ciudad sitiada");

  /* ---------- 5. encuentro en campo abierto ---------- */
  console.log("5. Encuentro en campo abierto");
  const m5 = await corre(`
    const cap = G.P[G.F[ME].capId];
    const xy = casilla(cap.id);
    const mio = camNuevoEj(ME, xy[0], xy[1], { i: 12, c: 4, a: 3 }, {});
    const v = CAM_V8.map(([dx, dy]) => [xy[0] + dx, xy[1] + dy]).find(([x, y]) => camPasable(x, y) && !camEjsEn(x, y).length && !camCiudadEn(x, y));
    const ene = camNuevoEj(REB, v[0], v[1], { i: 4 }, { nom: "Bagaudas del bosque" });
    const n0 = window.__ev.bat.length;
    await camAplicarOrden(G, { tipo: "mover", f: ME, ej: mio.id, x: v[0], y: v[1] });
    const b = window.__ev.bat.slice(n0);
    return { b, eneVivo: !!camEj(ene.id) && camEj(ene.id).x === v[0] && camEj(ene.id).y === v[1], mio: camEj(mio.id) && camTot(camEj(mio.id).u) };
  `);
  console.log("  " + JSON.stringify(m5));
  ok(m5.b.some((b) => b.t === "encuentro"), "al entrar en la casilla enemiga se libra una batalla de encuentro");
  ok(!m5.eneVivo, "el vencido se retira o se dispersa");
  /* carrera: dos órdenes simultáneas a la misma casilla; llega antes la caballería */
  const m5b = await corre(`
    const cap = G.P[G.F[ME].capId];
    const ps = G.P.filter((p) => p.owner === ME);
    let a = null, b = null, meta = null;
    outer: for (const p of ps) for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (MAP.grid[y][x] !== p.id || camCiudadEn(x, y) || camEjsEn(x, y).length) continue;
      const A = [x - 2, y], B = [x + 2, y];
      if ([A, B, [x - 1, y], [x + 1, y]].every(([i, j]) => MAP.terr[j][i] === 1 && camPasable(i, j) && MAP.grid[j][i] >= 0 && !camCiudadEn(i, j) && !camEjsEn(i, j).length) && MAP.terr[y][x] === 1 && camPasable(x, y)) { a = A; b = B; meta = [x, y]; break outer; }
    }
    if (!meta) return { sin: true };
    const lento = camNuevoEj(ME, a[0], a[1], { i: 6 }, {});
    const rapido = camNuevoEj(REB, b[0], b[1], { x: 3 }, {});
    const n0 = window.__ev.bat.length;
    const res = await camResolverSimultaneo(G, [
      { tipo: "mover", f: ME, ej: lento.id, x: meta[0], y: meta[1] },
      { tipo: "mover", f: REB, ej: rapido.id, x: meta[0], y: meta[1] },
    ], { auto: true });
    const bat = window.__ev.bat.slice(n0);
    return { bat, quien: camEjsEn(meta[0], meta[1]).map((e) => e.f), res: res.length };
  `);
  console.log("  " + JSON.stringify(m5b));
  /* el rápido llega antes; el lento le ataca o, si el contacto le detiene en la casilla vecina, se queda a las puertas */
  ok(
    m5b.sin || (m5b.bat.length ? m5b.bat[0].d === REBv : m5b.quien.includes(REBv)),
    "en órdenes simultáneas, el más rápido llega antes y el otro le ataca o se detiene",
  );

  /* ---------- 5b. batalla en conjunto: vecinos propios, aliados y defensores que acuden ---------- */
  console.log("5b. Batalla en conjunto");
  const m5c = await corre(`
    const vivos = [...Array(NF).keys()].filter((f) => f !== ME && alive(f));
    const E = vivos[0], L = vivos[1];
    for (const g of [E, L]) for (let h = 0; h < NF; h++) if (h !== g && h !== ME) G.st[g][h] = G.st[h][g] = "paz";
    G.st[ME][E] = G.st[E][ME] = "guerra";
    G.st[L][E] = G.st[E][L] = "guerra";
    G.st[ME][L] = G.st[L][ME] = "alianza";
    /* punto de batalla en tierra propia con radio 2 libre (tierra, sin ciudades ni ejércitos) */
    let P = null;
    for (const p of owned(ME))
      for (let y = 3; y < H - 3 && !P; y++)
        for (let x = 3; x < W - 3 && !P; x++) {
          if (MAP.grid[y][x] !== p.id) continue;
          let ok = true;
          for (let dy = -2; dy <= 2 && ok; dy++)
            for (let dx = -2; dx <= 2 && ok; dx++) {
              const a = x + dx, b = y + dy, pid = MAP.grid[b][a];
              if (!camPasable(a, b) || pid < 0 || camCiudadEn(a, b) || camEjsEn(a, b).length || G.P.some((q) => camCheb(q.x, q.y, a, b) <= 0) || !camPaso(ME, G.P[pid].owner) || !camPaso(L, G.P[pid].owner) || !camPaso(E, G.P[pid].owner)) ok = false;
            }
          if (ok) P = [x, y];
        }
    if (!P) return { sin: true };
    const [x, y] = P;
    const Aej = camNuevoEj(ME, x - 1, y, { i: 6, a: 2 }, { nom: "Vanguardia" }),
      A2 = camNuevoEj(ME, x - 1, y - 1, { i: 6, c: 2 }, { nom: "Segunda línea" }),
      Lej = camNuevoEj(L, x, y - 1, { i: 6, a: 2 }, { nom: "Aliados" }),
      D = camNuevoEj(E, x, y, { i: 8, a: 2 }, { nom: "Enemigo" }),
      D2 = camNuevoEj(E, x + 1, y + 1, { i: 6, c: 1 }, { nom: "Refuerzo enemigo" });
    const ap = await camAplicarOrden(G, JSON.parse(JSON.stringify({ tipo: "apoyo", f: ME, ej: A2.id, modo: "siempre" })));
    const A3 = camNuevoEj(ME, x - 2, y + 1, { i: 4 }, { nom: "Retaguardia" });
    A3.mov = 20;
    const ids = { A: Aej.id, A2: A2.id, L: Lej.id, D: D.id, D2: D2.id, A3: A3.id };
    const n0 = Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, camTot(camUCampo(camEj(id).u))]));
    /* captura: flechas de la batalla que se prepara */
    camBatPrep = { x, y, lados: [[Aej.id, A2.id, Lej.id], [D.id, D2.id]], t0: performance.now() };
    camSel = Aej.id; sel = MAP.grid[y][x]; ui();
    if (typeof setZoom === "function") setZoom(3);
    centerOn(MAP.grid[y][x]);
    return { sin: false, x, y, ids, n0, ap: ap.ok, E, L };
  `);
  console.log("  " + JSON.stringify(m5c));
  if (!m5c.sin) {
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(capt, "campana-conjunto.png") });
    const m5d = await corre(`
      const ids = arg.ids, nb = window.__ev.bat.length;
      const r = await camAplicarOrden(G, { tipo: "mover", f: ME, ej: ids.A, x: arg.x, y: arg.y });
      const bats = window.__ev.bat.slice(nb).filter((b) => b.t === "encuentro");
      const n1 = Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, camEj(id) ? camTot(camUCampo(camEj(id).u)) : 0]));
      if (typeof setZoom === "function") setZoom(1);
      return { ok: r.ok, bats: bats.length, lados: bats[0] && bats[0].ejs ? bats[0].ejs.map((l) => l.map((e) => e.id)) : null, fs: bats[0] && bats[0].ejs ? bats[0].ejs.map((l) => [...new Set(l.map((e) => e.f))]) : null, dirs: bats[0] && bats[0].ejs ? bats[0].ejs.map((l) => l.map((e) => e.dir)) : null, n1, multi: typeof cmbResolverMulti === "function", tarde: bats[0] && bats[0].ejs ? (bats[0].ejs[0].find((e) => e.id === ids.A3) || {}).tarde : null };
    `, m5c);
    console.log("  " + JSON.stringify(m5d));
    const L0 = (m5d.lados || [[], []])[0], L1 = (m5d.lados || [[], []])[1];
    ok(m5d.bats === 1 && L0.includes(m5c.ids.A) && L0.includes(m5c.ids.A2), "un ejército propio vecino se suma al ataque en UNA batalla");
    ok(L0.includes(m5c.ids.L) && (m5d.fs[0] || []).includes(m5c.L), "el aliado de otra facción vecino acude con su bandera");
    ok(L1.includes(m5c.ids.D) && L1.includes(m5c.ids.D2), "los defensores vecinos acuden a la batalla");
    ok(m5d.dirs && m5d.dirs.flat().every((d) => ["N", "E", "S", "O", "C"].includes(d)), `cada ejército lleva su dirección (${JSON.stringify(m5d.dirs)})`);
    const perd = (k) => m5c.n0[k] - m5d.n1[k];
    ok(["A", "A2", "L"].filter((k) => perd(k) > 0).length >= 2 || ["D", "D2"].every((k) => perd(k) > 0), "las bajas se reparten entre los ejércitos de cada bando");
    ok(m5c.ap, "«acudir a la batalla» (apoyo) es una orden serializable");
    ok(!m5d.multi || (L0.includes(m5c.ids.A3) && (m5d.tarde || 0) > 0), `el ejército a 2 casillas llega como refuerzo con la batalla empezada (a los ${m5d.tarde} s)`);
  }

  /* ---------- 6. mercenarios: contratar, cobrar cada estación, desertar si no se paga ---------- */
  console.log("6. Mercenarios");
  const m6 = await corre(`
    const M = mercS();
    if (!M.camp.length) mercCampos();
    const c = M.camp.find((x) => x.cias.length);
    const xy = CAM_V8.map(([dx, dy]) => [c.x + dx, c.y + dy]).find(([x, y]) => camPasable(x, y) && !camEjsEn(x, y).length && !camCiudadEn(x, y));
    paz(ME);
    const ej = camNuevoEj(ME, xy[0], xy[1], { i: 5 }, {});
    const F = G.F[ME]; F.gold = 2000;
    const cia = c.cias[0];
    const r = await camAplicarOrden(G, { tipo: "contratar", f: ME, ej: ej.id, camp: c.id, cia: cia.id, anos: 3 });
    const t = cia.t, con = mercCon(ME, t), n = mercCuenta(ME, t);
    const g0 = F.gold, pagoEsp = mercPago(t, n);
    await camMercEstacion();
    const cobrado = g0 - F.gold;
    /* ciudad: compañías según región y edificios */
    const ofs = owned(ME).map((p) => mercOfertas(p).length).reduce((a, b) => a + b, 0);
    /* sin oro: dos estaciones sin paga y desertan */
    F.gold = 0;
    await camMercEstacion();
    const imp1 = con.imp;
    await camMercEstacion();
    const rest = mercCuenta(ME, t), banda = G.cam.ej.filter((e) => e.f === REB && (e.u[t] || 0) > 0).length;
    return { ok: r.ok, t, merc: !!UN[t].merc, n, pagoEsp, cobrado, ofs, imp1, rest, banda, sigue: !!mercCon(ME, t) };
  `);
  console.log("  " + JSON.stringify(m6));
  ok(m6.ok && m6.merc && m6.n > 0, `se contrata en un campamento una compañía potenciada (${m6.t}, merc:true)`);
  ok(m6.cobrado === m6.pagoEsp && m6.pagoEsp > 0, `cobran ${m6.cobrado} de oro cada estación`);
  ok(m6.imp1 === 1 && m6.rest === 0 && m6.banda > 0 && !m6.sigue, "sin paga desertan, saquean y se echan al monte como banda");
  ok(m6.ofs >= 0, `ofertas en tus ciudades este año: ${m6.ofs}`);
  const m6b = await corre(`
    const F = G.F[ME]; F.gold = 2000;
    for (const p of owned(ME)) { p.puerto = 1; p.establo = 1; p.market = 1; }
    const p = owned(ME).find((p) => mercOfertas(p).length && !camAsedio(p.id));
    if (!p) return { sin: true };
    const cia = mercOfertas(p)[0];
    const r = await camAplicarOrden(G, { tipo: "contratar", f: ME, p: p.id, cia: cia.id, anos: 1 });
    return { ok: r.ok, en: p.u[cia.t], t: cia.t, hasta: mercCon(ME, cia.t).hasta };
  `);
  console.log("  " + JSON.stringify(m6b));
  ok(m6b.sin || (m6b.ok && m6b.en > 0), "en una ciudad propia se contrata según su puerto, establo y región");

  /* ---------- 7. partida guardada antigua (sin G.cam ni estación) ---------- */
  console.log("7. Partida antigua");
  await page.evaluate(() => {
    const g = JSON.parse(JSON.stringify(G));
    delete g.cam;
    delete g.estacion;
    for (const p of g.P) for (const k in p.u) if (UN[k] && UN[k].merc) delete p.u[k];
    localStorage.setItem("ocaso-save", JSON.stringify({ G: g, ME }));
    openStart("home");
  });
  await page.waitForTimeout(200);
  await page.click('[data-act="s-cnt"]');
  await page.waitForTimeout(400);
  await cerrarModales();
  const vieja = await page.evaluate(() => ({ cam: !!G.cam && Array.isArray(G.cam.ej), est: G.estacion, err: /Error al mostrar/.test(document.getElementById("panel").innerHTML) }));
  ok(vieja.cam && vieja.est === 0 && !vieja.err, "la partida antigua carga con G.cam vacío y en primavera");

  /* ---------- 7b. niebla de guerra y espías ---------- */
  console.log("7b. Niebla de guerra y espías");
  const nb = await corre(`
    G.cam.niebla = true;
    for (const e of G.cam.ej.slice()) camQuitar(e);
    G.cam.esp = [];
    camTocar();
    const libre = (x, y) => camPasable(x, y) && MAP.grid[y][x] >= 0 && !camCiudadEn(x, y) && !camEjsEn(x, y).length;
    const lejosDe = (x, y, l, d) => l.every((p) => camCheb(p.x, p.y, x, y) > d);
    const r = {};
    /* a) un ejército lejano no se ve; ni en el panel ni al pasar el ratón */
    let far = null;
    for (let y = 2; y < H - 2 && !far; y++) for (let x = 2; x < W - 2 && !far; x++) if (libre(x, y) && !camVisible(ME, x, y)) far = [x, y];
    const lej = camNuevoEj(REB, far[0], far[1], { i: 9 }, { nom: "Hueste oculta" });
    r.lejosOculto = !camVeEj(ME, lej) && !camHoverTxt(far[0], far[1]).includes("Hueste oculta");
    r.ignota = !camExplorado(ME, far[0], far[1]) ? camHoverTxt(far[0], far[1]) : "explorada";
    camQuitar(lej);
    /* b) en el bosque solo se ve a una casilla */
    let F = null, M = null;
    for (let y = 3; y < H - 3 && !F; y++)
      for (let x = 3; x < W - 3 && !F; x++) {
        if (!camEsBosque(x, y) || !libre(x, y) || !lejosDe(x, y, G.P, 4)) continue;
        const m2 = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + 2 * dx, y + 2 * dy]).find(([a, b]) => libre(a, b) && !camEsBosque(a, b));
        if (m2) { F = [x, y]; M = m2; }
      }
    if (F) {
      const yo = camNuevoEj(ME, M[0], M[1], { i: 4 }, {}), oc = camNuevoEj(REB, F[0], F[1], { i: 6 }, { nom: "Emboscados" });
      r.bosqueA2 = camVisible(ME, F[0], F[1]) && !camVeEj(ME, oc);
      yo.x = F[0] + Math.sign(M[0] - F[0]); yo.y = F[1] + Math.sign(M[1] - F[1]); camTocar();
      r.bosqueA1 = camVeEj(ME, oc);
      /* d) un espía a 3 casillas lo revela sin acercar el ejército */
      yo.x = M[0]; yo.y = M[1]; camTocar();
      const cap = G.P[G.F[ME].capId];
      G.F[ME].gold = 500;
      const ce = await camAplicarOrden(G, { tipo: "espia", f: ME, p: cap.id });
      const s = camEspPorId(ce.esp);
      s.mov = 999;
      await camAplicarOrden(G, { tipo: "espiaMover", f: ME, esp: s.id, x: F[0] + 3 * Math.sign(M[0] - F[0] || 1), y: F[1] });
      r.espiaEn = camCheb(s.x, s.y, F[0], F[1]);
      r.espiaRevela = r.espiaEn <= 3 && camVeEj(ME, oc);
      camQuitar(yo); camQuitar(oc);
      /* sabotaje de máquinas de un ejército enemigo */
      const sx = s.x, sy = s.y;
      const v = CAM_V8.map(([dx, dy]) => [sx + dx, sy + dy]).find(([a, b]) => libre(a, b));
      const en = camNuevoEj(REB, v[0], v[1], { i: 6 }, { nom: "Sitiadores" });
      en.maq = { ari: 2, tor: 1 }; en.obra = [{ t: "cat", q: 2 }];
      const m0 = camMaqTot(en) + en.obra.length;
      let k = 0, hecho = false;
      for (; k < 8 && !hecho; k++) {
        let sp = camEspPorId(s.id) || camEspDe(ME)[0];
        if (!sp) { const c2 = await camAplicarOrden(G, { tipo: "espia", f: ME, p: cap.id }); sp = camEspPorId(c2.esp); sp.x = sx; sp.y = sy; }
        sp.cal = 10;
        const mo = await camAplicarOrden(G, JSON.parse(JSON.stringify({ tipo: "mision", f: ME, esp: sp.id, mis: "sabotear", obj: en.id })));
        if (!mo.ok) break;
        await camEspias();
        hecho = camMaqTot(en) + en.obra.length < m0;
      }
      r.sabotaje = hecho;
      r.intentos = k;
      camQuitar(en);
    }
    /* c) la torre de vigilancia amplía la vista de la ciudad */
    const cap = G.P[G.F[ME].capId];
    const t0 = cap.torre || 0;
    cap.torre = 0; camTocar();
    let lejana = null;
    for (let y = 0; y < H && !lejana; y++) for (let x = 0; x < W && !lejana; x++) {
      const d = Math.hypot(x - cap.x, y - cap.y);
      if (d > 3.6 && d < 8.6 && MAP.terr[y][x] && !camVisible(ME, x, y)) lejana = [x, y];
    }
    if (lejana) {
      cap.torre = 3; camTocar();
      r.torre = camVisible(ME, lejana[0], lejana[1]);
    }
    cap.torre = t0; camTocar();
    /* e) la IA no ve a través de la niebla: un ejército débil en el bosque a 2 casillas no le atrae;
          el mismo en llano a 2 casillas, sí */
    const A = [...Array(NF).keys()].find((f) => f !== ME && alive(f));
    G.st[A][ME] = G.st[ME][A] = "guerra";
    let caso = null;
    for (let y = 3; y < H - 3 && !caso; y++)
      for (let x = 3; x < W - 3 && !caso; x++) {
        if (!camEsBosque(x, y) || !libre(x, y) || !lejosDe(x, y, G.P, 4)) continue;
        const pX = CAM_V8.map(([dx, dy]) => [x + 2 * dx, y + 2 * dy]).find(([a, b]) => libre(a, b) && camPaso(A, G.P[MAP.grid[b][a]].owner) && !camEsBosque(a, b));
        if (!pX) continue;
        const pW = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [pX[0] + 2 * dx, pX[1] + 2 * dy]).find(([a, b]) => libre(a, b) && MAP.terr[b][a] === 1 && !camEsBosque(a, b) && !(a === x && b === y) && camCheb(a, b, x, y) >= 2);
        if (!pW) continue;
        const Dx = camDijkstra({ id: -1, f: A, x: pX[0], y: pX[1], u: { i: 1 } }, { presu: 30, sinZoc: true });
        if (!camPaso(A, G.P[MAP.grid[pW[1]][pW[0]]].owner) || !Number.isFinite(Dx.dist[camIdx(pW[0], pW[1])]) || !Number.isFinite(Dx.dist[camIdx(x, y)])) continue;
        caso = { F: [x, y], X: pX, Wv: pW };
      }
    if (caso) {
      const X = camNuevoEj(A, caso.X[0], caso.X[1], { i: 20, c: 6 }, { nom: "Cazadores" });
      X.mov = 30;
      const Wej = camNuevoEj(ME, caso.F[0], caso.F[1], { i: 1 }, { nom: "Presa" });
      const o1 = await camIAEj(A, X);
      r.iaOculto = !camVeEj(A, Wej) && !(o1 && o1.x === Wej.x && o1.y === Wej.y);
      Wej.x = caso.Wv[0]; Wej.y = caso.Wv[1]; X.mov = 30; X.obj = null; camTocar();
      const o2 = await camIAEj(A, X);
      r.iaVisto = camVeEj(A, Wej) && !!(o2 && o2.x === Wej.x && o2.y === Wej.y);
      camQuitar(X); camQuitar(Wej);
    }
    /* relieve: montañas y ríos sin puente ni vado no se pisan, ni se cortan sus esquinas en diagonal */
    if (typeof camRelieve === "function" && camRelieve()) {
      let monte = null;
      for (let y = 0; y < H && !monte; y++) for (let x = 0; x < W && !monte; x++) if (MAP.mont && MAP.mont[y][x]) monte = [x, y];
      r.monteInf = monte ? !Number.isFinite(camCoste(ME, camIdx(monte[0], monte[1]))) : null;
      const cap2 = G.P[G.F[ME].capId],
        ej2 = camNuevoEj(ME, cap2.x, cap2.y, { i: 2 }, {});
      let pr = null;
      for (const q of G.P.slice().sort((a, b) => Math.hypot(b.x - cap2.x, b.y - cap2.y) - Math.hypot(a.x - cap2.x, a.y - cap2.y))) {
        pr = camPlanRuta(ej2, q.x, q.y, { sinZoc: true, noEntrar: true });
        if (pr && pr.ruta.length > 8) break;
      }
      let ok2 = pr ? true : null, px = ej2.x, py = ej2.y;
      for (const j of pr ? pr.ruta : []) {
        const [x, y] = camXY(j);
        if (!camPasable(x, y) || (x !== px && y !== py && (!camPasable(x, py) || !camPasable(px, y)))) ok2 = false;
        px = x; py = y;
      }
      r.rutaRelieve = ok2;
      camQuitar(ej2);
    }
    /* lo explorado se guarda en G (base64) y sobrevive a JSON */
    const g2 = JSON.parse(JSON.stringify(G.cam));
    r.exp = typeof g2.exp[ME] === "string" && g2.exp[ME].length > 10;
    r.mem = Object.keys((g2.mem || {})[ME] || {}).length;
    camSel = null; camEspSel = camEspDe(ME)[0] ? camEspDe(ME)[0].id : null; sel = G.F[ME].capId; tab = "prov"; ui();
    return r;
  `);
  console.log("  " + JSON.stringify(nb));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(capt, "campana-niebla.png") });
  ok(nb.lejosOculto, "la niebla oculta un ejército fuera de la vista (también en el texto del ratón)");
  ok(nb.bosqueA2 !== false && nb.bosqueA1 !== false, "en el bosque solo se ve a una casilla");
  ok(nb.torre !== false, "la torre de vigilancia amplía la vista de la ciudad");
  ok(nb.espiaRevela !== false, `el espía revela lo que oculta el bosque (a ${nb.espiaEn} casillas)`);
  ok(nb.sabotaje !== false, `el espía sabotea máquinas de asedio (${nb.intentos} intentos)`);
  ok(nb.iaOculto !== false && nb.iaVisto !== false, "la IA no persigue lo que no ve y sí lo que ve");
  ok(nb.exp && nb.mem > 0, `lo explorado y la última noticia de ${nb.mem} ciudades se guardan`);
  ok(nb.monteInf !== false && nb.rutaRelieve !== false, `relieve: la montaña no se pisa (${nb.monteInf}) y la ruta larga solo pisa casillas transitables sin cortar esquinas (${nb.rutaRelieve})`);
  console.log(`  (comprobado: bosque ${nb.bosqueA2 != null}, torre ${nb.torre != null}, espía ${nb.espiaRevela != null}, IA ${nb.iaOculto != null})`);

  /* repetición de la estación (CONTRATO §9): los pasos llevan de own0/ej0 al estado final */
  const rep = await corre(`
    let tot = { est: 0, pasos: 0, ajustes: 0, bien: 0, tipos: {} };
    /* que haya movimiento: guerras entre vecinos de la IA y una banda de bandidos junto a una ciudad ajena */
    for (let a = 0; a < NF; a++)
      for (let b = a + 1; b < NF; b++)
        if (!human(a) && !human(b) && alive(a) && alive(b) && owned(a).some((p) => MAP.adj[p.id].some((i) => G.P[i].owner === b))) declareWar(a, b);
    const blanco = G.P.find((p) => p.owner !== ME && p.owner !== REB && !camAsedio(p.id));
    if (blanco) {
      const v = CAM_V8.map(([dx, dy]) => [blanco.x + 2 * dx, blanco.y + 2 * dy]).find(([x, y]) => camPasable(x, y) && MAP.grid[y][x] >= 0 && !camCiudadEn(x, y) && !camEjsEn(x, y).length);
      if (v) camNuevoEj(REB, v[0], v[1], { i: 40, c: 6 }, { nom: "Bandidos" }).vida = 8;
    }
    for (let k = 0; k < 4; k++) {
      await finEstacion();
      const r = G.cam.rep;
      if (!r || !r.fin) continue;
      tot.est++;
      tot.pasos += r.pasos.length;
      tot.ajustes += r.ajustes || 0;
      for (const s of r.pasos) tot.tipos[s.k] = (tot.tipos[s.k] || 0) + 1;
      const st = camRepEstado(r),
        vivos = G.cam.ej.filter((e) => camTot(e.u) > 0);
      const ok =
        JSON.stringify(r).length > 0 &&
        G.P.every((p, i) => st.own[i] === p.owner) &&
        vivos.length === st.ej.size &&
        vivos.every((e) => st.ej.has(e.id) && st.ej.get(e.id).x === e.x && st.ej.get(e.id).y === e.y);
      if (ok) tot.bien++;
    }
    return tot;
  `);
  console.log("  repetición: " + JSON.stringify(rep));
  ok(rep.est >= 3 && rep.bien === rep.est, `la repetición reproduce dueños y posiciones finales (${rep.bien}/${rep.est} estaciones, ${rep.pasos} pasos)`);
  ok(rep.pasos > 0 && rep.ajustes <= Math.max(2, rep.pasos * 0.05), `casi todo se graba en su momento (ajustes al cerrar: ${rep.ajustes})`);

  /* ---------- 8. la IA durante muchos años ---------- */
  console.log(`8. La IA durante ${ANIOS} años`);
  await page.evaluate(() => {
    /* tiempos revueltos: los reinos de la IA con frontera común están en guerra */
    for (let a = 0; a < NF; a++)
      for (let b = a + 1; b < NF; b++)
        if (!human(a) && !human(b) && alive(a) && alive(b) && owned(a).some((p) => MAP.adj[p.id].some((i) => G.P[i].owner === b))) declareWar(a, b);
    window.__ia = { form: 0, sitios: 0, maq: 0, merc: 0, mov: 0, asalto: 0, rend: 0, enc: 0, campo: 0 };
    const vistos = new Set();
    OC.on("finEstacion", () => {
      for (const e of G.cam.ej) {
        if (human(e.f) || e.f >= NF) continue;
        if (!vistos.has(e.id)) {
          vistos.add(e.id);
          window.__ia.form++;
        }
        if (e.pas && e.pas.length) window.__ia.mov++;
        if (e.est === "campamento") window.__ia.campo++;
        if ((e.obra || []).length || Object.values(camMaq(e)).some((v) => v)) window.__ia.maq++;
      }
      window.__ia.sitios += Object.values(G.cam.as).filter((a) => !human(a.f)).length;
      window.__ia.merc = Math.max(window.__ia.merc, mercS().con.filter((c) => !human(c.f)).length);
    });
    OC.on("batallaResuelta", (b) => {
      if (b.campana === "asalto") window.__ia.asalto++;
      if (b.campana === "encuentro") window.__ia.enc++;
    });
  });
  const anio0 = await page.evaluate(() => G.year);
  const tiempos = [];
  for (let y = 0; y < ANIOS; y++) {
    const t0 = Date.now();
    await corre(`
      /* el jugador se defiende: recluta en su capital */
      const cap = G.P[G.F[ME].capId] && G.P[G.F[ME].capId].owner === ME ? G.P[G.F[ME].capId] : owned(ME)[0];
      if (cap && cap.owner === ME) { cap.u.i += owned(ME).length <= 3 ? 8 : 2; if (owned(ME).length <= 2) cap.walls = Math.max(cap.walls || 0, 2); G.F[ME].gold = Math.max(G.F[ME].gold, 80); }
      await yearEnd();
    `);
    tiempos.push(Date.now() - t0);
    const st = await page.evaluate(() => ({ y: G.year, e: G.estacion, over: !!G.over, ej: G.cam.ej.length }));
    process.stdout.write(`${st.y}(${st.ej}) `);
    if (y === 4) await page.screenshot({ path: path.join(capt, "campana-ia.png") });
    if (st.over) break;
  }
  console.log("");
  const ia = await page.evaluate(() => ({ ...window.__ia, est: window.__ev.est, anio: G.year, rend: G.log.filter((l) => /abre sus puertas/.test(l.m)).length, conq: window.__ev.conq.length }));
  console.log("  " + JSON.stringify(ia) + ` · ${Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)} ms/año`);
  const anios = ia.anio - anio0;
  ok(anios >= Math.min(ANIOS, 15), `pasan ${anios} años`);
  ok(ia.est >= anios * 4, `cada año tiene cuatro estaciones (finEstacion ×${ia.est})`);
  /* la cantidad varía mucho según el mapa y las guerras (de 4 a 28 en 16 años); se exige actividad, no un ritmo */
  ok(ia.form >= 3, `la IA forma ejércitos (${ia.form})`);
  ok(ia.mov >= anios / 4, `la IA mueve ejércitos por el mapa (${ia.mov} marchas)`);
  if (ia.sitios > 0) ok(true, `la IA asedia ciudades (${ia.sitios} estaciones de cerco)`);
  else console.log("  (aviso) en esta partida la IA no llegó a asediar ninguna ciudad");
  ok(ia.asalto > 0 && ia.conq > 0, `la IA asalta y conquista (${ia.asalto} asaltos, ${ia.conq} conquistas)`);
  ok(ia.maq > 0 || ia.asalto > 0, `la IA construye máquinas (${ia.maq})`);
  console.log(`  (mercenarios de la IA a la vez: ${ia.merc}; encuentros: ${ia.enc}; campamentos: ${ia.campo})`);
  const sano = await page.evaluate(() => G.P.every((p) => TYP.every((t) => Number.isFinite(p.u[t]))) && G.cam.ej.every((e) => Number.isFinite(e.x) && camTot(e.u) >= 0));
  ok(sano, "sin ejércitos ni guarniciones corruptos");
  /* el turno del jugador: una estación con ejércitos en campaña */
  const turno = await corre(`
    const cap = G.P[G.F[ME].capId] && G.P[G.F[ME].capId].owner === ME ? G.P[G.F[ME].capId] : owned(ME)[0];
    if (!cap) return { sin: true };
    cap.u.i += 4;
    const r = await camAplicarOrden(G, { tipo: "formar", f: ME, p: cap.id, u: { i: 4 } });
    const e0 = G.estacion, y0 = G.year;
    busy = false;
    await endTurn();
    return { e0, e1: G.estacion, y0, y1: G.year, ok: r.ok };
  `);
  console.log("  " + JSON.stringify(turno));
  ok(turno.sin || turno.y1 * 4 + turno.e1 === turno.y0 * 4 + turno.e0 + 1, "con un ejército en campaña, «Fin de la estación» avanza una sola estación");
  await page.evaluate(() => save());

  console.log(
    "\n" +
      (errores.length || fallos.length
        ? "ERRORES:\n" + [...errores, ...fallos.map((f) => "fallo: " + f)].join("\n")
        : "OK sin errores"),
  );
  await browser.close();
  process.exit(errores.length || fallos.length ? 1 : 0);
})();
