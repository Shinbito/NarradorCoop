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
const S_REV_MAX = (n) => Math.max(6, Math.round(n * 0.75));
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

  /* ---------- ánimo del pueblo ---------- */
  console.log("Ánimo del pueblo");
  const an = await page.evaluate(() => {
    const o = {},
      F = G.F[ME],
      p = G.P[F.capId],
      ord0 = p.order;
    const a = ecoAnimo(p);
    o.campos = ["id", "nombre", "icono", "color", "objetivo", "causas"].every((k) => a[k] !== undefined);
    o.objetivo = a.objetivo === Math.round(ordTarget(p));
    const suma = 55 + a.causas.reduce((s, c) => s + c.valor, 0);
    o.sumaCausas = Math.abs(clamp(suma, 0, 100) - a.objetivo) <= 1 + a.causas.length * 0.5;
    o.textos = a.causas.map((c) => `${c.texto} ${c.valor}`).join(", ");
    p.order = 8;
    o.furioso = ecoAnimo(p).id === "furioso";
    const gF = yields(p).g,
      apF = ecoApoyoAsedio(p, (ME + 1) % NF);
    p.order = 95;
    o.leal = ecoAnimo(p).id === "leal";
    o.rindeMas = yields(p).g > gF;
    o.asedio = ecoApoyoAsedio(p) > apF && apF >= -1 && ecoApoyoAsedio(p) <= 1;
    /* decisiones según el estado */
    p.order = 25;
    p.u.i = Math.max(p.u.i, 4);
    const disp = Object.keys(ECO_DEC).filter((k) => ECO_DEC[k].ok(p));
    o.disgustado = disp.includes("negociar") && disp.includes("castigo") && disp.includes("marcial");
    p.order = 80;
    o.felizSinCastigo = !ECO_DEC.castigo.ok(p) && !ECO_DEC.negociar.ok(p);
    p.order = 40;
    F.gold = 200;
    F.food = 100;
    const t0 = ordTarget(p);
    o.juegos = ecoDecision(ME, p, "juegos") && ordTarget(p) >= t0 + 9 && F.gold < 200;
    o.causaJuegos = ecoAnimo(p).causas.some((c) => /Juegos/.test(c.texto));
    o.enfriamiento = !ecoDecision(ME, p, "juegos") && ecoEspera(p, "juegos") === 4;
    const g0 = yields(p).g;
    o.condona = ecoDecision(ME, p, "condona") && yields(p).g < g0;
    o.grano = ecoDecision(ME, p, "grano") && F.food < 100;
    p.order = ord0;
    F.gold = 80;
    ui();
    return o;
  });
  for (const [k, v] of Object.entries(an))
    comprueba(v === true || typeof v === "string", `${k}: ${typeof v === "string" ? v : v}`);
  /* el ánimo aparece en la línea de información al pasar el ratón por el mapa */
  const pto = await page.evaluate(() => {
    const r = cv.getBoundingClientRect();
    for (const p of G.P.filter((q) => q.owner < NF)) {
      const x = r.left + ((p.x * T + 4) * r.width) / cv.width,
        y = r.top + ((p.y * T + 4) * r.height) / cv.height;
      if (document.elementFromPoint(x, y) === cv) return { x, y, n: ecoNivel(p).nombre };
    }
    return { x: 0, y: 0, n: "?" };
  });
  await page.mouse.move(pto.x, pto.y);
  await page.waitForTimeout(50);
  const hv = await page.evaluate(() => $("hv").textContent);
  comprueba(hv.includes(pto.n), `ánimo en el mapa: «${hv}»`);
  await page.evaluate(() => {
    ecoVerCausas = true;
    sel = G.F[ME].capId;
    tab = "prov";
    ui();
  });
  await (await page.$("#panel")).screenshot({ path: path.join(capt, "economia-animo.png") });
  await page.evaluate(() => {
    tab = "eco";
    ecoVista = "bal";
    ui();
  });
  await (await page.$("#panel")).screenshot({ path: path.join(capt, "economia-tesoro-animo.png") });
  await page.evaluate(() => {
    tab = "prov";
    ui();
  });

  /* ---------- simulación larga del mundo: todas las potencias gestionadas por la IA ----------
     (el reino del jugador también, para que dure; si cae, la prueba sigue con otra potencia) */
  await page.evaluate(() => {
    OC.on(
      "crisisEconomica",
      (e) => window.__crisis && window.__crisis.push({ f: e.f, tipo: e.tipo, y: G.year }),
    );
    OC.on("revuelta", () => window.__revueltas++);
    /* cuenta las decisiones de ciudad que toma la IA */
    const dec0 = ecoDecision;
    ecoDecision = (f, p, k) => {
      const r = dec0(f, p, k);
      if (r) window.__decIA++;
      return r;
    };
  });
  const simularMundo = async (etiqueta) => {
    console.log(`Simulación de ${ANIOS} años del mundo, ${etiqueta} (IA con su hacienda)`);
    await page.evaluate(() => {
      window.__crisis = [];
      window.__serie = [];
      window.__saltos = 0;
      window.__revueltas = 0;
      window.__decIA = 0;
      window.__camp = 0;
      window.__malPob = null;
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
            camp: b.gas.camp + b.gas.merc,
          });
          if (b.gas.camp > 0) window.__camp++;
        }
        for (const id of comBienes()) fila.precios[id] = comPrecio(id) / COM_MER[id].base;
        const E = G.eco;
        fila.pobMal = G.P.filter(
          (p) => !(E.pob[p.id] >= 1) || E.pob[p.id] > ecoCapacidad(p) * 1.35 + 0.2,
        ).length;
        /* cifras no numéricas en reinos vivos (los ausentes y los huecos de G.eco.f no cuentan) */
        const num = (v) => typeof v === "number" && Number.isFinite(v);
        fila.nan = [...Array(NF).keys()]
          .filter(alive)
          .some(
            (f) =>
              !num(G.F[f].gold) ||
              !num(G.F[f].food) ||
              !Object.values(G.F[f].res || {}).every(num) ||
              !["deuda", "infl", "gi"].every((k) => num(ecoF(f)[k])),
          );
        if (fila.pobMal || fila.nan)
          window.__malPob = window.__malPob || { y: G.year, pob: fila.pobMal, nan: fila.nan };
        window.__serie.push(fila);
        /* si el reino del jugador cae o alguien gana, la simulación sigue con otra potencia */
        if (!alive(ME) || G.over) {
          const otro = [...Array(NF).keys()]
            .filter(alive)
            .sort((a, b) => owned(a).length - owned(b).length)[0];
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
      revueltas: window.__revueltas,
      decIA: window.__decIA,
      camp: window.__camp,
      malPob: window.__malPob,
      animos: ECO_ANIMO.map(
        (n) => `${n.nombre} ${G.P.filter((p) => p.owner < NF && ecoNivel(p) === n).length}`,
      ).join(", "),
      animoOk: G.P.every((p) => {
        if (p.owner >= NF) return true;
        const a = ecoAnimo(p);
        return a.objetivo === Math.round(ordTarget(p)) && a.causas.every((c) => Number.isFinite(c.valor));
      }),
    }));
    console.log(`  ánimo final: ${sim.animos}`);
    console.log(`  revueltas: ${sim.revueltas} · decisiones de ciudad de la IA: ${sim.decIA}`);
    comprueba(sim.animoOk, "ecoAnimo coherente con ordTarget en todas las provincias");
    comprueba(sim.decIA > 0, "la IA gobierna sus ciudades descontentas");
    comprueba(sim.revueltas <= S_REV_MAX(ANIOS), `revueltas razonables (${sim.revueltas})`);
    if (sim.saltos)
      console.log(`  (el reino vigilado cayó ${sim.saltos} veces; se siguió con otra potencia)`);
    const S = sim.serie;
    const tabla = (fila) =>
      fila.f
        .map(
          (x) =>
            `${CIVabbr(x.f)} p${x.prov} oro${x.oro}${x.g >= 0 ? "+" : ""}${x.g} com${x.comida}/${x.gran} d${x.deuda} t${x.tropas} pob${x.pob} r${x.rutas}${x.infl > 1 ? " i" + x.infl : ""}${x.camp ? " c" + x.camp : ""}`,
        )
        .join(" | ");
    const ids = await page.evaluate(() => CIV.map((c) => c.id.toUpperCase()));
    function CIVabbr(f) {
      return ids[f];
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
    const malOro = todas.filter((x) => !(x.oro >= -Math.max(20, x.gi * 0.5) && x.oro < 3000));
    comprueba(
      !malOro.length,
      "oro < 3000 y sin números rojos graves (campaña cobra por estación) " +
        JSON.stringify(malOro.slice(0, 3)),
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
      "población dentro de su capacidad y sin NaN " + JSON.stringify(sim.malPob || ""),
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
    comprueba(sim.camp > 0, `los ejércitos en campaña aparecen en el balance (${sim.camp} veces)`);
  };
  await simularMundo("modo histórico");

  await page.evaluate(() => {
    tab = "eco";
    ecoVista = "bal";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "economia-final.png") });

  /* ---------- modo leyendas: 12 pueblos, sabor económico de los nuevos ---------- */
  console.log("Modo leyendas (12 pueblos)");
  const ley = await page.evaluate(async () => {
    const me = civIdx("inc"),
      riv = mundoRivalesAzar(me, 11);
    newGame(me, cands(me)[0], { modo: "leyendas", activas: [me, ...riv] });
    $("start").classList.remove("show");
    ME = me;
    G.human = [me];
    drawBase();
    OC.emitirSync("partidaLista");
    ui();
    const E = ecoE(),
      caps = ecoCapitales(),
      cerca = (p) => {
        let m = -1,
          bd = 1e9;
        for (const [f, q] of caps) {
          const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
          if (d < bd) {
            bd = d;
            m = f;
          }
        }
        return m;
      },
      o = { pueblos: G.activas.length };
    const sin = [];
    for (const [f, cap] of caps) {
      const firma = Object.keys(ecoCiv(f).esp).filter(
        (k) => ECO_ESP[k] && ((ECO_ESP[k].civ || []).includes(CIV[f].id) || ecoCiv(f).esp[k] >= 2),
      );
      const reg = G.P.filter((p) => p !== cap && cerca(p) === f);
      if (firma.length && reg.length && !reg.some((p) => firma.includes(E.esp[p.id]))) sin.push(CIV[f].id);
    }
    o.firmaPorPueblo = !sin.length || "sin firma: " + sin.join(",");
    o.comarcas = caps
      .map(
        ([f]) =>
          `${CIV[f].id}:${[...new Set(G.P.filter((p) => cerca(p) === f).map((p) => E.esp[p.id]))].join("/")}`,
      )
      .join(" ");
    o.incasSinCaballos =
      OC.saldo(me, "caballos") === 0 &&
      !G.P.some((p) => cerca(p) === me && ECO_CABALLAR.includes(E.esp[p.id])) &&
      cost(me, "i") > 0;
    o.lujosNuevos = ["incienso", "especias", "ambar", "cacao"].every(
      (id) => OC.recursos.some((r) => r.id === id) && COM_MER[id] && E.mer[id],
    );
    /* un ejército en campaña: el balance lo muestra y la economía anual no lo cobra dos veces */
    const F = G.F[me],
      cap = G.P[F.capId];
    cap.u.i = (cap.u.i || 0) + 6;
    F.gold = 500;
    const r = await camAplicarOrden(G, { tipo: "formar", f: me, p: cap.id, u: { i: 5 }, gen: false });
    const b = ecoBalance(me);
    o.campEnBalance = !!(r && r.ok) && b.gas.camp > 0 && b.tropas >= 5;
    const g0 = F.gold;
    economy(me);
    o.unaSolaVez = F.gold - g0 === b.gAnual && b.gAnual === b.g + b.gas.camp + b.gas.merc;
    window.__ejPrueba = r && r.ej;
    return o;
  });
  for (const [k, v] of Object.entries(ley)) comprueba(v === true || typeof v !== "boolean", `${k}: ${v}`);
  await page.evaluate(() => {
    tab = "eco";
    ecoVista = "bal";
    ui();
  });
  await (await page.$("#panel")).screenshot({ path: path.join(capt, "economia-leyendas.png") });
  await page.evaluate(
    async () =>
      window.__ejPrueba != null && camAplicarOrden(G, { tipo: "disolver", f: ME, ej: window.__ejPrueba }),
  );
  await simularMundo("leyendas con 12 pueblos");

  /* ---------- jugador pasivo: partida nueva en la que el jugador no toca nada y no hay guerra ----------
     (solo su economía, año tras año: no debe arruinarse por sí sola) */
  const pasivo = async (etiqueta, modo, idCiv) => {
    console.log(`Jugador pasivo durante ${ANIOS} años (${etiqueta}, sin guerras)`);
    const pas = await page.evaluate(
      async ([anios, modo, idCiv]) => {
        const me = civIdx(idCiv);
        if (modo === "leyendas")
          newGame(me, cands(me)[0], { modo, activas: [me, ...mundoRivalesAzar(me, 11)] });
        else newGame(me, cands(me)[0]);
        ME = me;
        G.human = [me];
        drawBase();
        OC.emitirSync("partidaLista");
        const crisis = [];
        OC.on(
          "crisisEconomica",
          (e) => e.f === ME && /hambre|impagos|bancarrota/.test(e.tipo) && crisis.push(e.tipo),
        );
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
      },
      [ANIOS, modo, idCiv],
    );
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
  };
  const civIni = await page.evaluate((n) => CIV[n].id, CIVN);
  await pasivo("histórico", "historico", civIni);
  await pasivo("leyendas, incas", "leyendas", "inc");

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

  /* descontento general: con muchas ciudades disgustadas se emite crisisEconomica 'descontento' */
  const desc = await page.evaluate(() => {
    if (!G || !alive(ME)) return "sin partida";
    const vistos = [];
    OC.on("crisisEconomica", (e) => e.f === ME && vistos.push(e.tipo));
    ecoF(ME).desc = -99;
    owned(ME).forEach((p) => (p.order = 18));
    economy(ME);
    return vistos.includes("descontento");
  });
  comprueba(desc === true, "crisisEconomica 'descontento' con muchas ciudades disgustadas: " + desc);

  console.log("\n" + (errores.length ? "ERRORES:\n" + errores.join("\n") : "Sin errores de JS"));
  const mal = errores.length || fallos.length;
  console.log(mal ? `FALLA: ${fallos.length} comprobaciones, ${errores.length} errores` : "OK economía");
  await browser.close();
  process.exit(mal ? 1 : 0);
})();
