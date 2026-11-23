/* Prueba del sistema de ECONOMÍA: arranca una campaña, comprueba el estado G.eco, las acciones de
   hacienda, el mercado y las rutas, guarda capturas de la pestaña Tesoro y simula muchos años para
   vigilar el equilibrio (ninguna IA en bancarrota, cifras razonables, precios estables) y que el
   jugador pasivo no se arruine solo. También carga una partida «antigua» sin G.eco.
   Uso:  node pruebas/economia.js [años=40] [civ=0]
   Capturas en pruebas/capturas/economia-*.png */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ANIOS = +(process.argv[2] || 40);
const CIVN = +(process.argv[3] || 0);
const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });

const fallos = [];
const comprueba = (ok, msg) => {
  if (!ok) fallos.push(msg);
  console.log((ok ? "  ok   " : "  FALLO ") + msg);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: "reduce" });
  const errores = [];
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
        await page.waitForTimeout(100);
        continue;
      }
      if (!st.m) return;
      await page.evaluate(() => {
        const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
        const auto = bs.find((b) => /autom/i.test(b.textContent));
        (auto || bs[bs.length - 1] || bs[0])?.click();
      });
      await page.waitForTimeout(50);
    }
  };
  /* fin de año sin interfaz: yearEnd() en segundo plano, cerrando modales si aparecen */
  const finAnio = async () => {
    await page.evaluate(() => {
      window.__fin = false;
      busy = true;
      yearEnd()
        .catch((e) => console.error("yearEnd", e))
        .finally(() => {
          busy = false;
          window.__fin = true;
        });
    });
    for (let k = 0; k < 600; k++) {
      if (await page.evaluate(() => window.__fin)) break;
      await cerrarModales();
      await page.waitForTimeout(20);
    }
    await cerrarModales();
  };

  await clic('[data-act="s-new"]');
  await clic(`[data-act="s-civ-${CIVN}"]`);
  await clic('[data-act="s-go"]');
  await page.waitForTimeout(300);
  await cerrarModales();

  console.log("Estado y recursos");
  const ini = await page.evaluate(() => {
    const E = ecoE();
    return {
      esp: E.esp.length,
      pob: E.pob.length,
      np: G.P.length,
      espOk: E.esp.every((k) => ECO_ESP[k]),
      pobOk: E.pob.every((v) => v > 0 && v < 60),
      recursos: OC.recursos.map((r) => r.id),
      resumen: ecoResumen(ME),
      inc: inc(ME),
      tipos: new Set(E.esp).size,
      json: JSON.stringify(G.eco).length,
    };
  });
  comprueba(
    ini.esp === ini.np && ini.pob === ini.np,
    `G.eco tiene especialidad y población para las ${ini.np} provincias`,
  );
  comprueba(ini.espOk && ini.pobOk, "especialidades válidas y población razonable");
  comprueba(ini.tipos >= 6, `variedad de especialidades en el mapa (${ini.tipos} tipos)`);
  comprueba(
    ["madera", "piedra", "hierro", "caballos", "sal", "vino", "seda"].every((r) => ini.recursos.includes(r)),
    "recursos declarados: " + ini.recursos.join(", "),
  );
  comprueba(
    ini.resumen.length === ini.recursos.length &&
      ini.resumen.every((r) => Number.isFinite(r.saldo + r.anual)),
    "ecoResumen(ME) devuelve saldo y balance de cada recurso",
  );
  comprueba(
    ["g", "fo", "up", "net"].every((k) => Number.isInteger(ini.inc[k])) &&
      ini.inc.net === ini.inc.fo - ini.inc.up,
    `inc(ME) coherente: oro ${ini.inc.g}, comida ${ini.inc.fo}−${ini.inc.up}=${ini.inc.net}`,
  );

  /* capturas de la pestaña Tesoro y de la hacienda de provincia */
  await clic('[data-act="tab-eco"]');
  await page.screenshot({ path: path.join(capt, "economia-balance.png") });
  await clic('[data-act="ecov-mer"]');
  await page.screenshot({ path: path.join(capt, "economia-mercado.png") });
  await clic('[data-act="ecov-rut"]');
  await page.screenshot({ path: path.join(capt, "economia-rutas.png") });
  await clic('[data-act="ecov-bal"]');

  console.log("Acciones de hacienda y mercado");
  const acc = await page.evaluate(() => {
    const F = G.F[ME],
      S = ecoF(ME),
      o = {};
    F.gold = 300;
    const p0 = comPrecio("madera");
    F.res.madera = 40;
    const g0 = F.gold;
    o.vende = comVender(ME, "madera") && F.gold > g0 && F.res.madera === 35;
    o.bajaPrecio = comPrecio("madera") < p0;
    const g1 = F.gold;
    o.compra = comComprar(ME, "hierro") && F.gold < g1;
    o.spread = comPCompra(ME, "vino") > comPVenta("vino");
    const d0 = S.deuda;
    ecoDecidir(ME, "prestamo");
    o.prestamo = S.deuda === d0 + 55;
    ecoDecidir(ME, "saldar");
    o.saldar = S.deuda === d0 + 5;
    ecoDecidir(ME, "saldar");
    o.saldada = S.deuda === 0;
    const p = G.P[F.capId],
      t0 = ordTarget(p);
    ecoDecidir(ME, "diezmo");
    o.diezmo = ordTarget(p) > t0 || t0 === 100;
    ecoDecidir(ME, "diezmo");
    const c0 = cost(ME, "i");
    ecoDecidir(ME, "recorte");
    o.recorte = S.infl > 1 && cost(ME, "i") >= c0 && ecoMant(ME, "i").oro > 0.25;
    o.unaVez = !ecoDecidir(ME, "recorte");
    S.mon = -1;
    ecoDecidir(ME, "reacunar");
    o.reacunar = S.infl === 1;
    /* rutas: una propia y, si se puede, una con un reino en paz */
    const cand = comCandidatas(ME, null, 20);
    o.candidatas = cand.length;
    const b0 = ecoBalance(ME).ing.rut;
    o.abre = cand.length > 0 && comAbrir(ME, cand[0].A, cand[0].B);
    o.rinde = ecoBalance(ME).ing.rut > b0;
    const ext = G.P.find(
      (q) =>
        q.owner < NF && q.owner !== ME && G.st[ME][q.owner] !== "guerra" && !comMotivo(ME, owned(ME)[0], q),
    );
    if (ext) {
      G.rel[ME][ext.owner] = G.rel[ext.owner][ME] = 30;
      const c = comCandidatas(ME, ext, 1)[0];
      o.ext = !!c && comAbrir(ME, c.A, c.B);
      const g = ext.owner,
        bs0 = ecoBalance(g).ing.rut;
      o.socioGana = bs0 > 0;
      G.st[ME][g] = G.st[g][ME] = "guerra";
      comRevisarRutas();
      o.guerraCorta = !G.eco.rutas.some((r) => r.f === ME && G.P[r.b].owner === g);
      G.st[ME][g] = G.st[g][ME] = "paz";
      F.gold = 300;
      const c2 = comCandidatas(ME, null, 40).find((x) => x.B.owner !== ME);
      if (c2) comAbrir(ME, c2.A, c2.B);
    } else o.ext = o.socioGana = o.guerraCorta = "sin vecino en paz";
    F.gold = 80;
    return o;
  });
  for (const [k, v] of Object.entries(acc))
    comprueba(v === true || typeof v === "number" || typeof v === "string", `${k}: ${v}`);
  await page.evaluate(() => ui());
  await clic('[data-act="ecov-rut"]');
  await page.screenshot({ path: path.join(capt, "economia-rutas-abiertas.png") });
  await page.evaluate(() => {
    const q = G.P.find((x) => x.owner !== ME && x.owner < NF);
    sel = q.id;
    tab = "prov";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "economia-provincia-ajena.png") });
  await page.evaluate(() => {
    sel = G.F[ME].capId;
    ui();
  });
  /* hacienda de provincia: se recorta el panel para verla */
  const panel = await page.$("#panel");
  await panel.screenshot({ path: path.join(capt, "economia-provincia.png") });

  /* ---------- simulación larga del mundo: todas las potencias gestionadas por la IA ----------
     (el reino del jugador también, para que dure; si cae, la prueba sigue con otra potencia) */
  console.log(`Simulación de ${ANIOS} años del mundo (IA con su hacienda)`);
  await page.evaluate(() => {
    window.__crisis = [];
    window.__serie = [];
    window.__saltos = 0;
    OC.on("crisisEconomica", (e) => window.__crisis.push({ f: e.f, tipo: e.tipo, y: G.year }));
  });
  for (let y = 0; y < ANIOS; y++) {
    await page.evaluate(() => {
      window.__fin = false;
      busy = true;
      (async () => {
        ecoIA(ME);
        await ai(ME);
        ecoIATasas(ME);
        await yearEnd();
      })()
        .catch((e) => console.error("sim", e))
        .finally(() => {
          busy = false;
          window.__fin = true;
        });
    });
    for (let k = 0; k < 600; k++) {
      if (await page.evaluate(() => window.__fin)) break;
      await cerrarModales();
      await page.waitForTimeout(20);
    }
    await cerrarModales();
    const fin = await page.evaluate(() => {
      const fila = { y: G.year, f: [], precios: {} };
      for (let f = 0; f < NF; f++) {
        if (!alive(f)) continue;
        const F = G.F[f],
          S = ecoF(f),
          b = ecoBalance(f);
        fila.f.push({
          f,
          prov: owned(f).length,
          oro: F.gold,
          comida: F.food,
          gran: b.granero,
          deuda: S.deuda,
          infl: S.infl,
          g: b.g,
          gi: b.gi,
          tropas: b.tropas,
          pob: Math.round(b.pob),
          res: { ...F.res },
          tope: ecoTope(f),
          rutas: comDe(f).length,
        });
      }
      for (const id of comBienes()) fila.precios[id] = comPrecio(id) / COM_MER[id].base;
      const E = G.eco;
      fila.pobMal = G.P.filter(
        (p) => !(E.pob[p.id] >= 1) || E.pob[p.id] > ecoCapacidad(p) * 1.15 + 0.2,
      ).length;
      fila.nan = /null|NaN/.test(
        JSON.stringify(G.eco.f) + JSON.stringify(G.F.map((F) => [F.gold, F.food, F.res])),
      );
      window.__serie.push(fila);
      /* si el reino del jugador cae o alguien gana, la simulación sigue con otra potencia */
      if (!alive(ME) || G.over) {
        const otro = [...Array(NF).keys()].filter(alive).sort((a, b) => owned(a).length - owned(b).length)[0];
        if (otro === undefined) return { y: G.year, acabado: true };
        ME = otro;
        G.human = [otro];
        G.over = null;
        window.__saltos++;
      }
      return { y: G.year };
    });
    process.stdout.write(`${fin.y} `);
    if (fin.acabado) break;
  }
  console.log("");
  const sim = await page.evaluate(() => ({
    serie: window.__serie,
    crisis: window.__crisis,
    saltos: window.__saltos,
  }));
  if (sim.saltos) console.log(`  (el reino vigilado cayó ${sim.saltos} veces; se siguió con otra potencia)`);
  const S = sim.serie;
  const tabla = (fila) =>
    fila.f
      .map(
        (x) =>
          `${CIVabbr(x.f)} p${x.prov} oro${x.oro}${x.g >= 0 ? "+" : ""}${x.g} com${x.comida}/${x.gran} d${x.deuda} t${x.tropas} pob${x.pob} r${x.rutas}${x.infl > 1 ? " i" + x.infl : ""}`,
      )
      .join(" | ");
  function CIVabbr(f) {
    return ["OCC", "ORI", "VIS", "HUN", "VAN", "FRA", "PER"][f];
  }
  for (const fila of S.filter((_, i) => i % 5 === 4 || i === S.length - 1))
    console.log(`  ${fila.y}: ${tabla(fila)}`);
  const ult = S[S.length - 1];
  console.log(
    "  precios finales: " +
      Object.entries(ult.precios)
        .map(([k, v]) => `${k} ×${v.toFixed(2)}`)
        .join(", "),
  );
  const cuenta = {};
  for (const c of sim.crisis) cuenta[c.tipo] = (cuenta[c.tipo] || 0) + 1;
  console.log("  crisis: " + (JSON.stringify(cuenta) || "{}"));

  console.log("Equilibrio");
  const banIA = sim.crisis.filter((c) => c.tipo === "bancarrota");
  comprueba(banIA.length === 0, `ninguna IA en bancarrota (${banIA.length})`);
  const impIA = sim.crisis.filter((c) => c.tipo === "impagos").length;
  comprueba(impIA <= Math.max(3, S.length / 4), `impagos de la IA poco frecuentes (${impIA})`);
  const todas = S.flatMap((s) => s.f);
  const malOro = todas.filter((x) => !(x.oro >= 0 && x.oro < 3000));
  comprueba(
    !malOro.length,
    "oro de todas las facciones entre 0 y 3000 " + JSON.stringify(malOro.slice(0, 3)),
  );
  const malCom = todas.filter((x) => !(x.comida >= 0 && x.comida <= x.gran * 1.5));
  comprueba(!malCom.length, "comida dentro del granero " + JSON.stringify(malCom.slice(0, 3)));
  comprueba(
    todas.every((x) => Object.values(x.res).every((v) => v >= 0 && v <= x.tope)),
    "recursos dentro del almacén",
  );
  comprueba(
    todas.every((x) => x.infl <= 1.6),
    "inflación contenida (≤1,6)",
  );
  comprueba(
    todas.every((x) => x.deuda <= Math.max(60, x.gi * 3) * 1.6),
    "deudas por debajo del umbral de bancarrota",
  );
  comprueba(
    S.every((s) => !s.pobMal && !s.nan),
    "población dentro de su capacidad y sin NaN",
  );
  /* precios: que no pasen la mayor parte del tiempo pegados al suelo o al techo */
  for (const id of Object.keys(ult.precios)) {
    const v = S.map((s) => s.precios[id]),
      ext = v.filter((x) => x <= 0.5 || x >= 2.4).length;
    comprueba(
      ext <= v.length * 0.35,
      `precio de ${id} estable (×${Math.min(...v).toFixed(2)}–×${Math.max(...v).toFixed(2)})`,
    );
  }
  const pobIni = S[0].f.reduce((s, x) => s + x.pob, 0),
    pobFin = ult.f.reduce((s, x) => s + x.pob, 0);
  console.log(`  población de los reinos: ${pobIni} → ${pobFin} mil`);

  await page.evaluate(() => {
    tab = "eco";
    ecoVista = "bal";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "economia-final.png") });

  /* ---------- jugador pasivo: partida nueva en la que el jugador no toca nada y no hay guerra ----------
     (solo su economía, año tras año: no debe arruinarse por sí sola) */
  console.log(`Jugador pasivo durante ${ANIOS} años (sin guerras)`);
  const pas = await page.evaluate(async (anios) => {
    newGame(ME, cands(ME)[0]);
    drawBase();
    OC.emitirSync("partidaLista");
    const crisis = [];
    OC.on("crisisEconomica", (e) => e.f === ME && e.tipo !== "peste" && crisis.push(e.tipo));
    const g0 = G.F[ME].gold,
      serie = [];
    for (let y = 0; y < anios; y++) {
      await OC.emitir("antesFinAnio", G.year);
      economy(ME);
      OC.emitirSync("economiaFaccion", ME);
      G.year++;
      const b = ecoBalance(ME);
      serie.push({
        y: G.year,
        oro: G.F[ME].gold,
        g: b.g,
        comida: G.F[ME].food,
        net: b.net,
        deuda: ecoF(ME).deuda,
        pob: Math.round(b.pob),
      });
    }
    return { crisis, g0, serie };
  }, ANIOS);
  for (const x of pas.serie.filter((_, i) => i % 10 === 9))
    console.log(
      `  ${x.y}: oro ${x.oro} (${x.g >= 0 ? "+" : ""}${x.g}) comida ${x.comida} (${x.net >= 0 ? "+" : ""}${x.net}) deuda ${x.deuda} pob ${x.pob}`,
    );
  const pf = pas.serie[pas.serie.length - 1];
  comprueba(
    !pas.crisis.length,
    "el jugador pasivo no sufre hambre, impagos ni bancarrota: " + JSON.stringify(pas.crisis),
  );
  comprueba(
    pf.deuda === 0 && pf.oro >= pas.g0,
    `el jugador pasivo acaba sin deuda y con más oro (${pas.g0} → ${pf.oro})`,
  );
  comprueba(pf.oro < 5000, "el tesoro pasivo no crece de forma absurda");

  /* ---------- partida antigua (sin G.eco ni F.res) ---------- */
  console.log("Partida guardada antigua");
  const vieja = await page.evaluate(() => {
    const s = JSON.parse(JSON.stringify({ G, ME }));
    delete s.G.eco;
    s.G.F.forEach((F) => delete F.res);
    localStorage.setItem("ocaso-save", JSON.stringify(s));
    G = null;
    startAct("cnt");
    return new Promise((r) =>
      setTimeout(() => {
        try {
          r({
            ok: !!G && !!G.eco && G.eco.pob.length === G.P.length && Number.isFinite(inc(ME).g),
            res: G.F[ME].res,
          });
        } catch (e) {
          r({ ok: false, e: String(e) });
        }
      }, 300),
    );
  });
  comprueba(vieja.ok, "una partida sin G.eco carga y se completa: " + JSON.stringify(vieja.res || vieja.e));
  await cerrarModales();
  if (vieja.ok) await finAnio();

  console.log("\n" + (errores.length ? "ERRORES:\n" + errores.join("\n") : "Sin errores de JS"));
  const mal = errores.length || fallos.length;
  console.log(mal ? `FALLA: ${fallos.length} comprobaciones, ${errores.length} errores` : "OK economía");
  await browser.close();
  process.exit(mal ? 1 : 0);
})();
