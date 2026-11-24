/* Prueba del sistema de diplomacia y sociedad.
   - Comprueba tratados a mano (firmar, romper, reputación, agravios, casus belli, rehenes,
     términos de paz, llamada a las armas) y la API de aceptación con motivos.
   - Juega varios años y verifica que la IA usa la diplomacia, que se emiten los eventos
     del contrato y que los estamentos y la corte cambian.
   - Carga una partida guardada sin G.dip (formato antiguo).
   Uso:  node pruebas/diplomacia.js [años=30] [civ=2]
   Capturas en pruebas/capturas/dip-*.png */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ANIOS = +(process.argv[2] || 30);
const CIVN = +(process.argv[3] || 2);
const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errores = [],
    fallos = [];
  const ok = (cond, msg) => {
    if (!cond) fallos.push(msg);
    console.log((cond ? "  ✓ " : "  ✗ ") + msg);
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
    await page.waitForTimeout(60);
  };
  const cerrarModales = async () => {
    for (let k = 0; k < 40; k++) {
      const abierto = await page.evaluate(() => document.getElementById("modal").classList.contains("show"));
      const batalla = await page.evaluate(() => document.getElementById("battle").classList.contains("show"));
      if (batalla) {
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

  /* contadores de eventos del contrato */
  await page.evaluate(() => {
    window.__ev = {};
    for (const e of [
      "guerraDeclarada",
      "pazFirmada",
      "alianzaSellada",
      "bodaCelebrada",
      "muertePersonaje",
      "sucesion",
    ])
      OC.on(e, () => (window.__ev[e] = (window.__ev[e] || 0) + 1));
  });

  console.log("Estado inicial");
  const ini = await page.evaluate(() => ({
    dip: !!G.dip,
    tr: G.dip.tr.map((x) => x.t),
    soc: [...Array(NF).keys()].map((f) => socF(f) && Object.keys(socF(f).e).length),
    paneles: OC.paneles.map((p) => p.id),
    mem: dipMotivosRel(0, 1).length,
  }));
  ok(ini.dip, "G.dip existe en partida nueva");
  ok(
    ini.tr.includes("alianza") && ini.tr.includes("vasallaje"),
    "tratados iniciales (alianza romana, foedus franco)",
  );
  ok(
    ini.soc.every((n) => n === 4),
    "cada reino tiene 4 estamentos",
  );
  ok(ini.paneles.includes("corte"), "pestaña Corte registrada");
  ok(ini.mem > 0, "la opinión inicial tiene causas visibles");

  console.log("Tratados a mano");
  const man = await page.evaluate(() => {
    const r = {},
      f = ME,
      g = [...Array(NF).keys()].find((g) => g !== f && G.st[f][g] === "paz" && alive(g));
    r.g = g;
    const a = dipAceptacion(f, g, "nag");
    r.acep = a.p >= 0 && a.p <= 1 && a.mot.length > 0;
    dipEjecutar(f, g, "nag");
    r.nag = !!dipTr(f, g, "nag");
    dipEjecutar(f, g, "comercio");
    r.com = !!dipTr(f, g, "comercio");
    const rep0 = G.dip.rep[f],
      rel0 = G.rel[f][g];
    declareWar(f, g);
    r.guerra = G.st[f][g] === "guerra";
    r.roto = !dipTr(f, g, "nag") && !dipTr(f, g, "comercio");
    r.rep = G.dip.rep[f] < rep0;
    r.rel = G.rel[f][g] < rel0;
    r.cb = dipCB(g, f).length > 0;
    r.mot = dipMotivosRel(f, g).some(([t]) => /Perjurio/.test(t));
    /* paz con términos: exigimos oro */
    G.F[g].gold = 200;
    const oro0 = G.F[f].gold;
    makePeace(f, g, { exOro: 50 });
    r.paz = G.st[f][g] === "paz" && !!dipTr(f, g, "tregua");
    r.oro = G.F[f].gold === oro0 + 50;
    /* tributo: g pasa a ser tributario de f */
    dipEjecutar(f, g, "tributo");
    r.vas = dipSenor(g) === f;
    /* llamada a las armas: un tercero ataca a nuestro aliado de IA */
    const al = [...Array(NF).keys()].find((z) => z !== f && z !== g && alive(z) && G.st[f][z] !== "guerra");
    G.st[f][al] = G.st[al][f] = "paz";
    ally(f, al, "defensiva");
    const en = [...Array(NF).keys()].find(
      (z) => z !== f && z !== g && z !== al && alive(z) && G.st[z][al] !== "guerra" && G.st[z][f] === "paz",
    );
    const ll0 = G.dip.hist.llOk + G.dip.hist.llNo + (G.dip.buzon[f] || []).length;
    if (en != null) declareWar(en, al);
    r.llamada = en == null || G.dip.hist.llOk + G.dip.hist.llNo + (G.dip.buzon[f] || []).length > ll0;
    r.buzon = (G.dip.buzon[f] || []).some((x) => x.k === "llamada");
    /* rehenes: si ambos tienen jóvenes, se intercambian y se marcan */
    const h = [...Array(NF).keys()].find(
      (z) => z !== f && alive(z) && !dipPuede(f, z, "rehenes") && dipRehenElegible(z),
    );
    r.reh = h == null || (dipEjecutar(f, h, "rehenes"), G.C.some((c) => c.dipReh === h && c.f === f));
    return r;
  });
  ok(man.acep, "aceptacionDiplomatica devuelve probabilidad y motivos");
  ok(man.nag && man.com, "se firman pacto de no agresión y acuerdo comercial");
  ok(man.guerra && man.roto, "declarar la guerra rompe los tratados");
  ok(man.rep && man.rel && man.mot, "romper un pacto cuesta reputación y deja un agravio visible");
  ok(man.cb, "la víctima obtiene casus belli");
  ok(man.paz && man.oro, "paz con términos (oro) y tregua");
  ok(man.vas, "tributo/vasallaje");
  ok(man.llamada && man.buzon, "llamada a las armas al jugador en su buzón");
  ok(man.reh, "intercambio de rehenes");

  console.log("Mandos y gobernadores");
  const gob = await page.evaluate(() => {
    const r = {},
      f = ME,
      p = owned(f).find((q) => !q.cap) || owned(f)[0],
      c =
        typeof cmbCapitanSurge === "function"
          ? cmbCapitanSurge(f, "la prueba")
          : Object.assign(mkChar(f, "m", 30), { linaje: false, rol: "capitan", xp: 25 });
    window.__cap = c.id;
    Object.assign(c, { ge: 8, di: 8, ma: 7, xp: 25, lea: 70, amb: 2 });
    r.nivelBajo = !!socPuedeGobernar(f, c, p);
    c.xp = 60;
    r.nivelOk = !socPuedeGobernar(f, c, p);
    const y0 = OC.calc("rendimiento", { g: 10, fo: 10 }, { p, f }),
      o0 = OC.calc("ordenObjetivo", 50, { p, f }),
      k0 = OC.calc("costeUnidad", 100, { f, t: "i", p });
    socNombrarGob(p, c);
    const y1 = OC.calc("rendimiento", { g: 10, fo: 10 }, { p, f }),
      o1 = OC.calc("ordenObjetivo", 50, { p, f }),
      k1 = OC.calc("costeUnidad", 100, { f, t: "i", p });
    r.asignado = socGob(p) === c;
    r.efectos = y1.g > y0.g && o1 > o0 && k1 < k0;
    r.noHeredero = !heirCands(f).includes(c) && !bachelors(f).includes(c);
    tab = "dyn";
    ui();
    r.noDinastia = !document.getElementById("panel").innerHTML.includes(`heir-${c.id}"`);
    tab = "corte";
    ui();
    r.enCorte = document.getElementById("panel").innerHTML.includes(`socgobc-${c.id}"`);
    tab = "prov";
    sel = p.id;
    ui();
    r.seccion = document.getElementById("panel").innerHTML.includes(`socgob-${p.id}"`);
    /* un general de ejército en campaña no puede gobernar */
    const S = camS(),
      fake = { id: -99, f, gen: c.id, u: {}, x: 0, y: 0 };
    S.ej.push(fake);
    r.campana = !socGob(p) && /campaña/.test(socPuedeGobernar(f, c, p));
    S.ej.splice(S.ej.indexOf(fake), 1);
    socNombrarGob(p, c);
    return r;
  });
  ok(gob.nivelBajo && gob.nivelOk, "un mando gobierna solo desde el nivel 3");
  ok(gob.asignado && gob.efectos, "el gobernador mejora oro, orden y coste de levas de su ciudad");
  ok(
    gob.noHeredero && gob.noDinastia && gob.enCorte,
    "los mandos sin linaje no heredan ni se casan; salen en la Corte",
  );
  ok(gob.seccion, "sección de gobernador en el panel de provincia");
  ok(gob.campana, "quien manda un ejército en campaña no puede gobernar");
  /* renombrar desde la interfaz (con limpieza de HTML) a un mando y a un pariente */
  const ren = async (id, txt) => {
    await page.evaluate(() => {
      tab = "corte";
      ui();
    });
    await page.evaluate((id) => {
      const b = document.createElement("button");
      b.dataset.act = "renombrar-" + id;
      document.getElementById("panel").appendChild(b);
      b.click();
    }, id);
    await page.waitForSelector("#cmbnom", { timeout: 3000 });
    await page.fill("#cmbnom", txt);
    await page.evaluate(() =>
      [...document.querySelectorAll("#modalc button")].find((b) => /Aceptar/.test(b.textContent)).click(),
    );
    await page.waitForTimeout(100);
    return page.evaluate((id) => G.C[id].n, id);
  };
  const capId = await page.evaluate(() => window.__cap);
  const n1 = await ren(capId, 'Ataúlfo <b>"el Rojo"</b>');
  ok(n1 === "Ataúlfo el Rojo", "renombrar un mando limpia el HTML: " + n1);
  const parId = await page.evaluate(
    () => family(ME).find((c) => c.linaje !== false && c.id !== G.F[ME].ruler)?.id,
  );
  if (parId != null) ok((await ren(parId, "Gesalico")) === "Gesalico", "renombrar a un pariente");
  const n3 = await ren(capId, "<x>");
  ok(n3 === "Ataúlfo el Rojo", "un nombre vacío o demasiado corto se ignora");
  await page.evaluate(() => {
    tab = "corte";
    ui();
    document.querySelector(".soc-mb")?.scrollIntoView();
  });
  await page.screenshot({ path: path.join(capt, "dip-mandos.png") });
  await page.evaluate(() => {
    sel = owned(ME).find((p) => p.gob != null)?.id ?? sel;
    tab = "prov";
    ui();
    document.querySelector('[data-act^="socgob-"]')?.scrollIntoView({ block: "center" });
  });
  await page.screenshot({ path: path.join(capt, "dip-gobernador.png") });

  /* capturas de paneles */
  await page.evaluate(() => {
    dipAbiertos = {};
    for (let g = 0; g < NF; g++)
      if (g !== ME && alive(g)) {
        dipAbiertos[g] = true;
        break;
      }
    tab = "dip";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "dip-diplomacia.png") });
  const pans = await page.evaluate(() => {
    const r = {};
    for (const t of ["dip", "corte", "dyn"]) {
      tab = t;
      ui();
      r[t] = document.getElementById("panel").innerHTML;
    }
    return r;
  });
  ok(!/Error al mostrar/.test(pans.dip + pans.corte + pans.dyn), "los paneles se dibujan sin error");
  ok(/data-act="dipp-/.test(pans.dip) && /\d+%/.test(pans.dip), "botones de propuesta con % de aceptación");
  ok(/Consejo/.test(pans.corte) && /socdon-/.test(pans.corte), "panel Corte con estamentos y consejo");
  await clic('[data-act="tab-corte"]');
  await page.screenshot({ path: path.join(capt, "dip-corte.png") });
  await clic('[data-act="tab-dyn"]');
  await page.screenshot({ path: path.join(capt, "dip-dinastia.png") });
  /* modal de propuesta */
  await clic('[data-act="tab-dip"]');
  const bp = await page.$('[data-act^="dipp-"]:not([disabled])');
  if (bp) {
    await bp.click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(capt, "dip-propuesta.png") });
    await page.evaluate(() => [...document.querySelectorAll("#modalc button")].pop().click());
  }
  await page.evaluate(() => {
    tab = "corte";
    ui();
  });
  const bc = await page.$('[data-act^="soccar-"]:not([disabled])');
  if (bc) {
    await bc.click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(capt, "dip-consejo.png") });
    await page.evaluate(() => document.querySelector("#modalc [data-mi]")?.click());
  }
  await cerrarModales();
  await clic('[data-act="tab-prov"]');

  const snap = () =>
    page.evaluate(() => ({
      year: G.year,
      soc: [...Array(NF).keys()].map((f) => (socF(f) ? Object.values(socF(f).e).map((e) => e.l) : [])),
      car: [...Array(NF).keys()]
        .filter((f) => f !== ME && alive(f))
        .map((f) => Object.keys(socF(f).car).length),
      hist: JSON.parse(JSON.stringify(G.dip.hist)),
      tr: G.dip.tr.length,
      gobIA: G.P.filter((p) => p.owner !== ME && p.owner < NF && socGob(p)).length,
    }));
  const s0 = await snap();
  console.log(`Jugando ${ANIOS} años`);
  for (let y = 0; y < ANIOS; y++) {
    await cerrarModales();
    const fin = await page.$("#endb:not([disabled])");
    if (fin) await fin.click();
    for (let k = 0; k < 300; k++) {
      await cerrarModales();
      const ocupado = await page.evaluate(() => typeof busy !== "undefined" && busy);
      if (!ocupado) break;
      await page.waitForTimeout(100);
    }
    if (y === 10) {
      await page.evaluate(() => {
        tab = "dip";
        for (let g = 0; g < NF; g++) dipAbiertos[g] = g !== ME && G.st[ME][g] === "guerra";
        ui();
      });
      await page.screenshot({ path: path.join(capt, "dip-diplomacia-anio10.png") });
      await page.evaluate(() => {
        tab = "prov";
        ui();
      });
    }
    const st = await page.evaluate(() => G && { y: G.year, over: !!G.over, tr: G.dip.tr.length });
    process.stdout.write(`${st.y}(${st.tr}) `);
    if (st.over) break;
  }
  await cerrarModales();
  const s1 = await snap();
  const ev = await page.evaluate(() => window.__ev);
  console.log("\nHistoria:", JSON.stringify(s1.hist), "\nEventos:", JSON.stringify(ev));
  const H = s1.hist;
  ok(Object.values(H.firm).reduce((a, b) => a + b, 0) >= 8, "se firman tratados durante la partida");
  ok(
    Object.keys(H.firm).length >= 4,
    "al menos 4 tipos de tratado distintos: " + Object.keys(H.firm).join(","),
  );
  ok(H.ia >= 10, "la IA hace propuestas diplomáticas (" + H.ia + ")");
  ok(
    H.guerras > s0.hist.guerras && (H.paces > s0.hist.paces || ANIOS < 20),
    "la IA declara guerras y firma paces",
  );
  ok(H.rotos >= 1, "algún tratado se rompe");
  ok(H.llOk + H.llNo >= 1, "hay llamadas a las armas (" + H.llOk + " acuden, " + H.llNo + " se niegan)");
  ok(
    ev.guerraDeclarada && ev.pazFirmada && ev.bodaCelebrada && ev.muertePersonaje,
    "se emiten los eventos del contrato",
  );
  ok(ev.sucesion >= 1 || ANIOS < 20, "se emite 'sucesion'");
  let cambios = 0;
  s1.soc.forEach((l, f) => l.forEach((v, i) => (cambios += Math.abs(v - (s0.soc[f][i] ?? v)) >= 5 ? 1 : 0)));
  ok(cambios >= 8, "las lealtades de los estamentos cambian (" + cambios + " estamentos)");
  ok(s1.car.reduce((a, n) => a + n, 0) >= 2.5 * s1.car.length, "la IA llena su consejo: " + s1.car.join(","));
  ok(s1.gobIA >= 2, "la IA nombra gobernadores (" + s1.gobIA + " ciudades)");
  ok((H.demandas || 0) >= 3, "los estamentos hacen demandas (" + (H.demandas || 0) + ")");
  console.log(
    "  complots:",
    H.complots || 0,
    "· guerras civiles:",
    H.civiles || 0,
    "· traiciones:",
    H.traiciones || 0,
  );

  /* partida guardada con el formato antiguo (sin G.dip ni campos sociales) */
  console.log("Partida antigua");
  await page.evaluate(() => {
    const g = JSON.parse(JSON.stringify(G));
    delete g.dip;
    g.C.forEach((c) => {
      delete c.amb;
      delete c.lea;
      delete c.dipReh;
      delete c.dipCort;
    });
    g.P.forEach((p) => delete p.dipFe);
    localStorage.setItem("ocaso-save", JSON.stringify({ G: g, ME }));
    openStart("home");
  });
  await page.waitForTimeout(100);
  await clic('[data-act="s-cnt"]');
  await page.waitForTimeout(300);
  await cerrarModales();
  const vieja = await page.evaluate(() => {
    const al = [];
    for (let a = 0; a < NF; a++)
      for (let b = a + 1; b < NF; b++) if (G.st[a][b] === "alianza") al.push(!!dipTr(a, b, "alianza"));
    for (const t of ["dip", "corte", "dyn"]) {
      tab = t;
      ui();
    }
    return {
      dip: !!G.dip,
      al: al.every(Boolean),
      lea: G.C.every((c) => c.lea != null),
      err: /Error al mostrar/.test(document.getElementById("panel").innerHTML),
    };
  });
  ok(vieja.dip && vieja.al && vieja.lea && !vieja.err, "la partida antigua carga y se completa");
  const fin = await page.$("#endb:not([disabled])");
  if (fin) await fin.click();
  for (let k = 0; k < 300; k++) {
    await cerrarModales();
    if (!(await page.evaluate(() => busy))) break;
    await page.waitForTimeout(100);
  }
  await cerrarModales();
  await page.evaluate(() => {
    tab = "corte";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "dip-corte-final.png") });

  /* Mundo de leyendas: pueblos nuevos con su personalidad, estamentos, fe y sin caballos en América */
  console.log("Mundo de leyendas");
  await cerrarModales();
  const ley = await page.evaluate(async () => {
    const ids = ["nor", "azt", "inc", "chi", "mon", "ind", "gri", "egi", "ara", "may", "cel", "esl"],
      act = ids.map(civIdx),
      me = act[0],
      r = {};
    newGame(me, cands(me)[0], { modo: "leyendas", activas: act });
    drawBase();
    OC.emitirSync("partidaLista");
    r.estamentos = act.every((f) => socEstDe(f) === SOC_PUEBLO[CIV[f].id]);
    r.clero = act.every((f) => SOC_CLE[CIV[f].rel] && SOC_FEN[CIV[f].rel]);
    r.pers = act.every((f) => DIP_PERS[CIV[f].id]);
    r.nombres = act
      .map((f) =>
        Object.keys(socF(f).e)
          .map((k) => socNombre(f, k))
          .join("/"),
      )
      .slice(0, 4);
    const inc = civIdx("inc");
    r.sinCaballos = civPuede(inc, socTropa(inc, ["c", "x", "m", "p", "i"]));
    r.levas = Object.keys(socLevantados(inc, { i: 1, a: 1 })).every((t) => civPuede(inc, t) && !UN[t].merc);
    /* favores y guerra civil en un pueblo sin caballos */
    const p0 = owned(inc).length;
    socFavor(inc, "ej");
    for (const k in socF(inc).e) socFavor(inc, k);
    r.favorOk = TYP.every((t) => civPuede(inc, t) || !(socCap(inc).u[t] > 0));
    r.p0 = p0;
    window.modal = () => Promise.resolve(0);
    for (let y = 0; y < 8; y++) await yearEnd();
    for (const t of ["dip", "corte", "dyn"]) {
      tab = t;
      ui();
      r[t] = !/Error al mostrar/.test(document.getElementById("panel").innerHTML);
    }
    r.hist = JSON.stringify(G.dip.hist);
    r.gobs = G.P.filter((p) => p.owner < NF && socGob(p)).length;
    r.sinJinetes = act
      .filter((f) => CIV[f].sinTipos)
      .every((f) => owned(f).every((p) => TYP.every((t) => civPuede(f, t) || !(p.u[t] > 0))));
    return r;
  });
  console.log("  ", ley.nombres.join(" | "), "\n  ", ley.hist);
  ok(
    ley.estamentos && ley.clero && ley.pers,
    "los 12 pueblos nuevos tienen estamentos, clero y personalidad propios",
  );
  ok(
    ley.sinCaballos && ley.levas && ley.favorOk,
    "favores y alzamientos respetan civPuede y no dan mercenarios",
  );
  ok(ley.dip && ley.corte && ley.dyn, "los paneles funcionan en el modo leyendas");
  ok(ley.gobs >= 2, "la IA nombra gobernadores en leyendas (" + ley.gobs + ")");
  await page.evaluate(() => {
    tab = "corte";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "dip-leyendas-corte.png") });
  await page.evaluate(() => {
    tab = "dip";
    for (let g = 0; g < NF; g++) dipAbiertos[g] = false;
    const g = G.activas.find((g) => g !== ME && alive(g));
    if (g != null) dipAbiertos[g] = true;
    ui();
  });
  await page.screenshot({ path: path.join(capt, "dip-leyendas-diplomacia.png") });

  const todo = [...errores, ...fallos.map((f) => "fallo: " + f)];
  console.log("\n" + (todo.length ? "ERRORES:\n" + todo.join("\n") : "OK sin errores"));
  await browser.close();
  process.exit(todo.length ? 1 : 0);
})();
