/* Prueba del sistema MUNDO: estructura de CIV (19 pueblos + rebeldes al final), modo histórico intacto,
   pantalla de inicio de ambos modos (escritorio y móvil), partidas en «Mundo de leyendas» con varias
   combinaciones (incas/mayas/aztecas sin caballos, 11 rivales, todos los pueblos), guardar/cargar,
   y carga de una partida guardada ANTIGUA (rebeldes en el índice 7, pruebas/datos/partida-antigua-410.json).
   Uso:  node pruebas/mundo.js [años=20] [--todas]
   Con --todas ejecuta además humo, economía, tecnología, diplomacia, narrativa y combate (modo histórico).
   Capturas en pruebas/capturas/mundo-*.png */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const ANIOS = +(process.argv.find((a) => /^\d+$/.test(a)) || 20);
const TODAS = process.argv.includes("--todas");
const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const errores = [],
    fallos = [];
  const ok = (c, m) => {
    if (!c) fallos.push(m);
    console.log((c ? "  ✓ " : "  ✗ ") + m);
  };
  const nueva = async (vp = { width: 1400, height: 900 }) => {
    const page = await browser.newPage({ viewport: vp, reducedMotion: "reduce" });
    page.on("pageerror", (e) => errores.push("pageerror: " + (e.stack || e.message)));
    page.on("console", (m) => {
      if (m.type() === "error" && !/fonts\.g|ERR_|net::/.test(m.text())) errores.push("console: " + m.text());
    });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto("file://" + path.join(raiz, "index.html"));
    await page.waitForTimeout(200);
    return page;
  };
  let page = await nueva();
  await page.evaluate(() => localStorage.clear());

  const clic = async (sel) => {
    for (let k = 0; k < 3; k++) {
      try {
        await page.click(sel, { timeout: 3000 });
        await page.waitForTimeout(60);
        return;
      } catch (e) {
        if (k === 2) throw e;
        await cerrarModales();
      }
    }
  };
  const cerrarModales = async () => {
    for (let k = 0; k < 60; k++) {
      const st = await page.evaluate(() => ({
        m: document.getElementById("modal").classList.contains("show"),
        b: document.getElementById("battle").classList.contains("show"),
      }));
      if (st.b) {
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('#bside button[data-act^="b-"]')].find((x) =>
            /auto|retir|huir/i.test(x.textContent),
          );
          b && b.click();
        });
        await page.waitForTimeout(120);
        continue;
      }
      if (!st.m) return;
      await page.evaluate(() => {
        const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
        const auto = bs.find((b) => /autom/i.test(b.textContent));
        (auto || bs[Math.floor(Math.random() * bs.length)])?.click();
      });
      await page.waitForTimeout(60);
    }
  };
  /* juega n años: recluta algo y pulsa «Fin del año» */
  const jugar = async (n, cada) => {
    for (let y = 0; y < n; y++) {
      await cerrarModales();
      await page.evaluate(() => {
        try {
          if (!G || G.over) return;
          for (const p of owned(ME)) {
            sel = p.id;
            ui();
            const b = document.querySelector('[data-act^="rec-"]:not([disabled])');
            b && b.click();
          }
        } catch (e) {
          console.error("mundo-accion", e);
        }
      });
      const fin = await page.$("#endb:not([disabled])");
      if (fin) await fin.click();
      for (let k = 0; k < 600; k++) {
        await cerrarModales();
        if (!(await page.evaluate(() => typeof busy !== "undefined" && busy))) break;
        await page.waitForTimeout(80);
      }
      if (cada) await cada(y);
      if (await page.evaluate(() => !G || G.over || !alive(ME))) break;
    }
    await cerrarModales();
    return page.evaluate(() => G.year);
  };

  /* ---------- 1. estructura de CIV ---------- */
  console.log("\n1. Pueblos");
  const est = await page.evaluate(() => {
    const ids = CIV.map((c) => c.id),
      hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
      dmin = (() => {
        let m = 1e9,
          par = "";
        for (let a = 0; a < NF; a++)
          for (let b = a + 1; b < NF; b++) {
            const x = hex(CIV[a].c),
              y = hex(CIV[b].c),
              d = Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
            if (d < m) {
              m = d;
              par = ids[a] + "/" + ids[b];
            }
          }
        return { m: Math.round(m), par };
      })(),
      lum = CIV.slice(0, NF).map((c) => {
        const [r, g, b] = hex(c.c);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }),
      campos = CIV.slice(0, NF).filter(
        (c) =>
          !(
            c.id &&
            c.n &&
            c.s &&
            /^#[0-9a-f]{6}$/i.test(c.c) &&
            /^#[0-9a-f]{6}$/i.test(c.d) &&
            c.desc &&
            c.un &&
            c.un.i &&
            c.un.a &&
            c.bon &&
            c.tm &&
            c.tf &&
            c.m.length >= 7 &&
            c.f.length >= 5 &&
            typeof c.rel === "string" &&
            c.rel &&
            typeof c.gold === "number" &&
            Array.isArray(c.sinTipos) &&
            Array.isArray(c.unicas) &&
            civIdx(c.base) >= 0 &&
            c.pueblo
          ),
      ),
      nuevos = CIV.slice(7, NF).filter(
        (c, i) => c.m.length < 12 || c.f.length < 10 || ["l", "i", "p", "h", "a", "x", "c", "k", "m"].some((t) => civPuede(i + 7, t) && !c.un[t]),
      ),
      unicas = CIV.slice(0, NF).flatMap((c) =>
        c.unicas.filter((k) => !UN[k] || !((UN[k].civIds || UN[k].civs || []).includes(c.id))).map((k) => c.id + ":" + k),
      ),
      iconos = [];
    for (let f = 0; f <= REB; f++)
      for (const t of TYP) {
        const s = icon(f, t);
        if (!/^data:image\/png/.test(s)) iconos.push(f + t);
      }
    return {
      n: CIV.length,
      reb: REB,
      nf: NF,
      ultimo: CIV[REB].id,
      orig: ids.slice(0, 7).join(","),
      nuevas: ids.slice(7, NF).join(","),
      unicos: new Set(ids).size === ids.length,
      idx: civIdx("nor") === ids.indexOf("nor") && civIdx("zzz") === -1,
      campos: campos.map((c) => c.id),
      nuevos: nuevos.map((c) => c.id),
      unicas,
      pal: PAL.length === CIV.length,
      iconos,
      dmin,
      oscuros: CIV.slice(0, NF)
        .filter((c, i) => lum[i] < 70)
        .map((c) => c.id),
      pn: CIV.slice(0, NF).filter((c) => !MUNDO_PN[c.id] || MUNDO_PN[c.id].length < 12).map((c) => c.id),
      pnDup: (() => {
        const l = Object.values(MUNDO_PN).flat();
        return l.length - new Set(l).size;
      })(),
      geo: CIV.slice(0, NF).filter((c) => !MUNDO_GEO[c.id]).map((c) => c.id),
      sinCab: ["inc", "may", "azt"].every((id) => ["x", "c", "k", "m"].every((t) => !civPuede(civIdx(id), t))),
    };
  });
  ok(est.n === 20 && est.reb === 19 && est.nf === 19 && est.ultimo === "reb", `20 pueblos, REB=${est.reb}, NF=${est.nf}`);
  ok(est.orig === "occ,ori,vis,hun,van,fra,per", "las 7 originales en 0..6: " + est.orig);
  ok(est.nuevas === "ara,nor,chi,inc,may,azt,gri,egi,ind,cel,esl,mon", "las 12 nuevas detrás: " + est.nuevas);
  ok(est.unicos && est.idx, "ids únicos y civIdx()");
  ok(!est.campos.length, "todos los pueblos tienen los campos completos " + est.campos.join(","));
  ok(!est.nuevos.length, "los pueblos nuevos traen nombres para las 9 clases y muchos soberanos " + est.nuevos.join(","));
  ok(!est.unicas.length, "las únicas de cada pueblo existen en UN y son suyas " + est.unicas.join(","));
  ok(est.pal && !est.iconos.length, "PAL e iconos de tropa para todos los pueblos y clases " + est.iconos.slice(0, 5));
  ok(est.dmin.m >= 40, `colores distinguibles (distancia mínima ${est.dmin.m}, ${est.dmin.par})`);
  ok(!est.oscuros.length, "colores legibles sobre el panel oscuro " + est.oscuros.join(","));
  ok(!est.pn.length && !est.pnDup && !est.geo.length, "nombres de provincia (≥12, sin repetir) y geografía para cada pueblo");
  ok(est.sinCab, "incas, mayas y aztecas sin caballería");

  /* ---------- 2. modo histórico por la pantalla de inicio ---------- */
  console.log("\n2. Modo histórico");
  await clic('[data-act="s-new"]');
  const nh = await page.$$eval('#startc [data-act^="s-civ-"]', (b) => b.length);
  ok(nh === 7, `el modo histórico ofrece las 7 de siempre (${nh})`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(capt, "mundo-inicio-historico.png") });
  await clic('[data-act="s-civ-0"]');
  await clic('[data-act="s-go"]');
  await page.waitForTimeout(200);
  await cerrarModales();
  const hi = await page.evaluate(() => ({
    modo: G.modo,
    act: G.activas.join(","),
    W,
    H,
    cv: cv.width + "x" + cv.height,
    np: G.P.length,
    F: G.F.length,
    aus: G.F.filter((F, f) => F.ausente).length,
    vivos: [...Array(NF).keys()].filter(alive).join(","),
    rel: G.rel.length === NF && G.rel.every((r) => r.length === NF) && G.st.every((r) => r.length === NF),
    reb: G.P.filter((p) => p.owner === REB).length,
    alianza: G.st[0][1],
    trat: G.dip.tr.length,
    mapa: JSON.stringify(G.mapa),
    nombres: G.P.every((p) => PNAMES.includes(p.name)),
  }));
  ok(hi.modo === "historico" && hi.act === "0,1,2,3,4,5,6", "G.modo histórico con las 7 activas");
  ok(hi.W === 64 && hi.H === 40 && hi.cv === "512x320" && hi.np >= 30 && hi.np <= 42, `mapa de siempre 64×40 (${hi.np} provincias)`);
  ok(hi.F === 19 && hi.aus === 12 && hi.vivos === "0,1,2,3,4,5,6", "G.F con 19 facciones; las 12 ausentes sin tierras");
  ok(hi.rel && hi.reb > 0, "G.rel/G.st de NF×NF y rebeldes en el índice REB");
  ok(hi.alianza === "alianza" && hi.trat >= 2 && hi.nombres, "alianza romana, foedus franco y nombres latinos como siempre");
  const yh = await jugar(3);
  ok(yh >= 413, "tres años del modo histórico sin errores");

  /* ---------- 3. pantalla de inicio del modo leyendas ---------- */
  console.log("\n3. Pantalla de inicio de leyendas");
  const inicioLey = async (vp, nombre) => {
    await page.evaluate(() => openStart("home"));
    await clic('[data-act="s-new"]');
    await clic('[data-act="s-modo-leyendas"]');
    const n = await page.$$eval('#startc [data-act^="s-civ-"]', (b) => b.length);
    await page.locator("#startc").screenshot({ path: path.join(capt, `mundo-inicio-leyendas${nombre}.png`) });
    return n;
  };
  const nl = await inicioLey(null, "");
  ok(nl === 19, `el modo leyendas ofrece los 19 pueblos (${nl})`);
  await clic(`[data-act="s-civ-${await page.evaluate(() => civIdx("nor"))}"]`);
  const r0 = await page.evaluate(() => ({ v: ST.view, n: ST.riv.length, yo: ST.riv.includes(ST.civ) }));
  ok(r0.v === "riv" && r0.n === 7 && !r0.yo, "elegir pueblo lleva a la elección de rivales (7 al azar por defecto)");
  await clic('[data-act="s-nriv-inc"]');
  await clic('[data-act="s-nriv-inc"]');
  await clic('[data-act="s-nriv-dec"]');
  const r1 = await page.evaluate(() => ST.riv.length);
  ok(r1 === 8, "los botones − / + cambian el número de rivales");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(capt, "mundo-rivales-azar.png") });
  await clic('[data-act="s-rmodo-mano"]');
  await clic('[data-act="s-rning"]');
  for (const id of ["inc", "azt", "chi"]) await clic(`[data-act="s-rtog-${await page.evaluate((id) => civIdx(id), id)}"]`);
  const r2 = await page.evaluate(() => ST.riv.map((f) => CIV[f].id).join(","));
  ok(r2 === "inc,azt,chi", "a mano se eligen los rivales uno a uno: " + r2);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(capt, "mundo-rivales-mano.png") });
  await clic('[data-act="s-rok"]');
  await clic('[data-act="s-go"]');
  await page.waitForTimeout(200);
  await cerrarModales();
  const l0 = await page.evaluate(() => ({
    modo: G.modo,
    act: G.activas.map((f) => CIV[f].id).join(","),
    me: CIV[ME].id,
    vivos: [...Array(NF).keys()].filter(alive).length,
  }));
  ok(l0.modo === "leyendas" && l0.me === "nor" && l0.act === "nor,chi,inc,azt" && l0.vivos === 4, "la partida empieza con los pueblos elegidos: " + l0.act);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(capt, "mundo-leyendas-4.png") });

  /* pantalla de inicio en móvil */
  const pm = page;
  page = await nueva({ width: 390, height: 844 });
  await clic('[data-act="s-new"]');
  await clic('[data-act="s-modo-leyendas"]');
  const movil = await page.evaluate(() => ({
    ancho: document.documentElement.scrollWidth,
    tarjetas: document.querySelectorAll("#startc .mun-civ").length,
  }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(capt, "mundo-inicio-movil.png") });
  await clic(`[data-act="s-civ-${await page.evaluate(() => civIdx("ara"))}"]`);
  await clic('[data-act="s-rmodo-mano"]');
  await page.locator("#startc").screenshot({ path: path.join(capt, "mundo-rivales-movil.png") });
  const movil2 = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(movil.ancho <= 390 && movil2 <= 390 && movil.tarjetas === 19, `en móvil no hay desbordamiento horizontal (${movil.ancho}px, ${movil2}px)`);
  await page.close();
  page = pm;

  /* ---------- 4. partidas de leyendas ---------- */
  const partida = async (titulo, yo, rivales, anios) => {
    console.log(`\n4. Leyendas: ${titulo}`);
    const r = await page.evaluate(
      ({ yo, rivales }) => {
        const me = civIdx(yo),
          riv = rivales === "todos" ? [...Array(NF).keys()].filter((f) => f !== me) : typeof rivales === "number" ? mundoRivalesAzar(me, rivales) : rivales.map(civIdx);
        leaveNet();
        newGame(me, cands(me)[0], { modo: "leyendas", activas: [me, ...riv] });
        drawBase();
        OC.emitirSync("partidaLista");
        $("start").classList.remove("show");
        ui();
        save();
        startTurn();
        const caps = G.activas.map((f) => G.P[G.F[f].capId]);
        let dmin = 1e9;
        for (let a = 0; a < caps.length; a++)
          for (let b = a + 1; b < caps.length; b++) dmin = Math.min(dmin, Math.hypot(caps[a].x - caps[b].x, caps[a].y - caps[b].y));
        const nombres = G.P.map((p) => p.name);
        return {
          n: G.activas.length,
          act: G.activas.map((f) => CIV[f].id).join(","),
          np: G.P.length,
          W,
          H,
          dim: G.mapa,
          dmin: Math.round(dmin * 10) / 10,
          capsOk: G.activas.every((f) => G.P[G.F[f].capId].owner === f && G.P[G.F[f].capId].cap),
          vivos: [...Array(NF).keys()].filter(alive).length,
          nombresUnicos: new Set(nombres).size === nombres.length,
          capRegional: G.activas.every((f) => G.P[G.F[f].capId].name === MUNDO_PN[CIV[f].id][0]),
          regionales: G.P.filter((p) => p.owner !== REB && MUNDO_PN[CIV[p.owner].id].includes(p.name)).length / G.P.filter((p) => p.owner !== REB).length,
          ausentes: [...Array(NF).keys()].filter((f) => !G.activas.includes(f)).every((f) => G.F[f].ausente && !alive(f)),
          tratados: G.dip.tr.length,
        };
      },
      { yo, rivales },
    );
    console.log(`  ${r.n} pueblos (${r.act}) · ${r.np} provincias · mapa ${r.W}×${r.H} · capitales a ≥${r.dmin} casillas`);
    ok(r.capsOk && r.vivos === r.n && r.ausentes, "cada pueblo activo tiene su capital; los demás, ausentes");
    ok(r.W === r.dim.w && r.H === r.dim.h && (r.n <= 7 ? r.W === 64 : r.W > 64), "el mapa crece con el número de pueblos");
    ok(r.np >= r.n * 4, `provincias suficientes (${r.np} para ${r.n} pueblos)`);
    ok(r.dmin >= 5, `capitales separadas (mínimo ${r.dmin} casillas)`);
    ok(r.nombresUnicos && r.capRegional && r.regionales > 0.95, `nombres únicos y con sabor de cada pueblo (${Math.round(r.regionales * 100)}%)`);
    ok(r.tratados === 0, "sin los tratados históricos de 410");
    await cerrarModales();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(capt, `mundo-${titulo.replace(/\W+/g, "-")}-inicio.png`) });
    const sinCab = [];
    const vigila = () =>
      page.evaluate(() =>
        G.P.filter((p) => p.owner < NF && Object.keys(p.u).some((t) => p.u[t] > 0 && !civPuede(p.owner, t))).map(
          (p) => `${G.year} ${CIV[p.owner].s} en ${p.name}: ${Object.keys(p.u).filter((t) => p.u[t] > 0 && !civPuede(p.owner, t)).map((t) => t + p.u[t]).join(" ")}`,
        ),
      );
    const t0 = Date.now();
    const y = await jugar(anios, async () => sinCab.push(...(await vigila())));
    const fin = await page.evaluate(() => ({
      vivos: [...Array(NF).keys()]
        .filter(alive)
        .map((f) => `${CIV[f].s} ${owned(f).length}`)
        .join(", "),
      ausentesQuietos: [...Array(NF).keys()].filter((f) => !G.activas.includes(f)).every((f) => !alive(f) && !family(f).length),
      rec: G.activas.some((f) => f !== ME && owned(f).some((p) => tot(p.u) > 0)),
      tabs: (() => {
        const e = [];
        for (const b of document.querySelectorAll("#tabs button")) {
          tab = b.dataset.act.slice(4);
          try {
            ui();
          } catch (x) {
            e.push(tab);
          }
        }
        tab = "prov";
        ui();
        return e;
      })(),
    }));
    console.log(`  año ${y} (${Math.round((Date.now() - t0) / 1000)} s) · vivos: ${fin.vivos}`);
    ok(y >= 410 + Math.min(anios, 20) || (await page.evaluate(() => !!G.over || !alive(ME))), `se juegan ${anios} años (año ${y})`);
    ok(fin.ausentesQuietos, "los pueblos ausentes siguen sin tierras ni corte");
    ok(!fin.tabs.length, "todas las pestañas se pintan " + fin.tabs.join(","));
    ok(!sinCab.length, "ningún pueblo sin caballos tiene jinetes " + sinCab.slice(0, 3).join(" | "));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(capt, `mundo-${titulo.replace(/\W+/g, "-")}-final.png`) });
    return r;
  };
  await partida("incas-sin-caballos", "inc", ["azt", "may", "chi", "nor", "per"], ANIOS);
  await partida("aztecas-todos", "azt", "todos", Math.min(ANIOS, 8));
  await partida("mongoles-2", "mon", ["chi", "ind"], Math.min(ANIOS, 6));
  await partida("arabes-11-rivales", "ara", 11, ANIOS);

  /* ---------- 5. guardar y cargar una partida de leyendas ---------- */
  console.log("\n5. Guardar y cargar (leyendas)");
  const antes = await page.evaluate(() => {
    save();
    return { y: G.year, W, H, np: G.P.length, seed: G.seed, act: G.activas.join(",") };
  });
  await page.reload();
  await page.waitForTimeout(200);
  await clic('[data-act="s-cnt"]');
  await page.waitForTimeout(200);
  await cerrarModales();
  const desp = await page.evaluate(() => ({
    y: G.year,
    W,
    H,
    np: G.P.length,
    pts: MAP.pts.length,
    seed: G.seed,
    act: G.activas.join(","),
    modo: G.modo,
  }));
  ok(
    desp.W === antes.W && desp.H === antes.H && desp.pts === desp.np && desp.act === antes.act && desp.modo === "leyendas",
    `la partida de leyendas se recarga con su mapa (${desp.W}×${desp.H}, ${desp.pts} provincias)`,
  );
  await jugar(1);

  /* ---------- 6. partida guardada antigua (7 pueblos, rebeldes = 7) ---------- */
  console.log("\n6. Partida guardada antigua");
  const vieja = fs.readFileSync(path.join(__dirname, "datos", "partida-antigua-410.json"), "utf8");
  const v0 = JSON.parse(vieja);
  const reb7 = v0.G.P.filter((p) => p.owner === 7).length,
    home7 = v0.G.P.filter((p) => p.home === 7).length;
  await page.evaluate((s) => {
    localStorage.setItem("ocaso-save", s);
    openStart("home");
  }, vieja);
  await clic('[data-act="s-cnt"]');
  await page.waitForTimeout(300);
  await cerrarModales();
  const mig = await page.evaluate(() => ({
    modo: G.modo,
    act: G.activas.join(","),
    rebs: G.P.filter((p) => p.owner === REB).length,
    homes: G.P.filter((p) => p.home === REB).length,
    siete: G.P.filter((p) => p.owner === 7 || p.home === 7).length,
    F: G.F.length,
    rel: G.rel.length === NF && G.rel.every((r) => r.length === NF) && G.st.every((r) => r.length === NF && r.every(Boolean)),
    W,
    np: G.P.length,
    vivos: [...Array(NF).keys()].filter(alive).length,
    vet: Object.values(G.cmb.vet || {}).filter((v) => v.f === 7).length,
  }));
  ok(mig.modo === "historico" && mig.act === "0,1,2,3,4,5,6", "se marca como histórica con las 7 activas");
  ok(mig.rebs === reb7 && mig.homes === home7 && !mig.siete && !mig.vet, `los rebeldes pasan del 7 a REB (${reb7} provincias, ${home7} de origen)`);
  ok(mig.F === 19 && mig.rel && mig.W === 64, "G.F, G.rel y G.st ampliados; mapa de 64×40");
  await page.evaluate(() => OC.emitirSync("partidaLista"));
  const mig2 = await page.evaluate(() => ({ rebs: G.P.filter((p) => p.owner === REB).length, F: G.F.length }));
  ok(mig2.rebs === mig.rebs && mig2.F === 19, "la migración es idempotente");
  const yv = await jugar(3);
  ok(yv >= 416, `la partida antigua se sigue jugando (año ${yv})`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(capt, "mundo-antigua.png") });

  await browser.close();

  /* ---------- 7. las demás pruebas (modo histórico) ---------- */
  if (TODAS) {
    console.log("\n7. Pruebas de los demás sistemas (modo histórico)");
    for (const [f, ...a] of [["humo.js", "20"], ["economia.js"], ["tecnologia.js"], ["diplomacia.js"], ["narrativa.js"], ["combate.js"]]) {
      try {
        const out = execFileSync("node", [path.join(__dirname, f), ...a], { encoding: "utf8", timeout: 900000 });
        ok(/OK/.test(out.split("\n").slice(-4).join("\n")), `${f} ${a.join(" ")}`);
      } catch (e) {
        ok(false, `${f}: ${String(e.stdout || e.message).split("\n").slice(-8).join(" / ")}`);
      }
    }
  }

  const todo = [...errores, ...fallos.map((f) => "fallo: " + f)];
  console.log("\n" + (todo.length ? "ERRORES:\n" + todo.slice(0, 40).join("\n") : "OK sin errores"));
  process.exit(todo.length ? 1 : 0);
})();
