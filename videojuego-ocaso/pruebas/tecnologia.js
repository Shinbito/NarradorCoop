/* Prueba del sistema de TECNOLOGÍA: investigación que avanza, obras que suben de nivel,
   la IA investigando y construyendo, eras, efectos sobre los cálculos y carga de partidas antiguas.
   Uso:  node pruebas/tecnologia.js [años=30] [civ=5]
   Capturas en pruebas/capturas/tec-*.png */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ANIOS = +(process.argv[2] || 30);
const CIVN = +(process.argv[3] || 5);
const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errores = [],
    fallos = [];
  const comprobar = (ok, msg) => {
    console.log((ok ? "  ✓ " : "  ✗ ") + msg);
    if (!ok) fallos.push(msg);
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
  const finAnio = async () => {
    await cerrarModales();
    const fin = await page.$("#endb:not([disabled])");
    if (fin) await fin.click();
    for (let k = 0; k < 300; k++) {
      await cerrarModales();
      if (!(await page.evaluate(() => typeof busy !== "undefined" && busy))) break;
      await page.waitForTimeout(100);
    }
  };

  await clic('[data-act="s-new"]');
  await clic(`[data-act="s-civ-${CIVN}"]`);
  await clic('[data-act="s-go"]');
  await page.waitForTimeout(300);
  await cerrarModales();

  console.log("Arranque");
  const ini = await page.evaluate(() => {
    const s = G.tec,
      cap = G.P[G.F[ME].capId];
    window.__tec = { ed: Array(NF).fill(0), inv: Array(NF).fill(0), era: [], pronto: [] };
    OC.on("edificioConstruido", (x) => {
      window.__tec.ed[x.f]++;
      if (tecAnioEdi(x.id, x.nivel) > G.year) window.__tec.pronto.push(`${x.id} ${x.nivel} en ${G.year}`);
    });
    OC.on("tecnologiaInvestigada", (x) => {
      window.__tec.inv[x.f]++;
      if ((TEC[x.id].anio || 0) > G.year) window.__tec.pronto.push(`${x.id} en ${G.year}`);
    });
    OC.on("eraNueva", (x) => {
      window.__tec.era.push(x);
      if (TEC_ERA[x.era].anio > G.year) window.__tec.pronto.push(`era ${x.era} en ${G.year}`);
    });
    // clase de élite ficticia para probar la puerta por año en unidadesDisponibles
    const yr = G.year,
      est = cap.establo;
    UN.__elite = { s: "Élite", cost: 40, atk: 8, hp: 18, food: 2, mv: 5, edif: "establo", nivel: 2 };
    cap.establo = 2;
    G.tec.rev++;
    const uAntes = OC.calc("unidadesDisponibles", ["i", "a", "c"], { f: ME, p: cap }).includes("__elite");
    G.year = 450;
    G.tec.rev++;
    const uDespues = OC.calc("unidadesDisponibles", ["i", "a", "c"], { f: ME, p: cap }).includes("__elite");
    G.year = yr;
    cap.establo = est;
    delete UN.__elite;
    G.tec.rev++;
    return {
      ok: !!(s && s.f.length === NF && s.obras),
      campos: G.P.every((p) => tecEdificios().every((k) => typeof p[k] === "number")),
      cap: { cuartel: cap.cuartel, escuela: cap.escuela, walls: cap.walls },
      tecs: s.f.map((x) => x.h.length),
      iaInv: s.f.filter((x, f) => f !== ME && x.inv).length,
      pts: tecPuntos(ME),
      desde: tecDesde(410) && !tecDesde(2000),
      tardias: Object.keys(TEC).filter((id) => (TEC[id].anio || 0) > 410 && tecDisponible(ME, id)).length,
      granjaII: tecMejora(ME, { ...cap, farm: 1 }, "farm").motivo,
      uAntes,
      uDespues,
    };
  });
  comprobar(ini.ok, "G.tec creado con una ficha por facción");
  comprobar(ini.campos, "todas las provincias tienen niveles numéricos de cada edificio");
  comprobar(
    ini.tecs.every((n) => n >= 1),
    "cada pueblo empieza con su técnica de partida: " + ini.tecs.join(","),
  );
  comprobar(ini.iaInv >= 5, "la IA ya ha elegido qué investigar (" + ini.iaInv + ")");
  comprobar(ini.pts > 0, "puntos de investigación del jugador: " + ini.pts);
  comprobar(ini.desde, "tecDesde(anio) responde según G.year");
  comprobar(ini.tardias === 0, "en 410 no se puede investigar nada con año posterior");
  comprobar(/año 420/.test(ini.granjaII), "Granja II espera al año 420: «" + ini.granjaII + "»");
  comprobar(!ini.uAntes && ini.uDespues, "una clase de élite (establo II) se desbloquea en 445, no antes");
  console.log("  capital:", JSON.stringify(ini.cap));

  // pestaña Progreso: elegir investigación con un clic
  await clic('[data-act="tab-tec"]');
  await page.screenshot({ path: path.join(capt, "tec-panel-inicio.png") });
  comprobar(
    /(disponible en el año|desde) \d+/.test(await page.$eval("#panel", (e) => e.textContent)),
    "el panel muestra «disponible en el año ...»",
  );
  const pri = await page.$eval('#panel button[data-act^="tecinv-"]:not([disabled])', (b) => b.dataset.act);
  await clic(`[data-act="${pri}"]`);
  const inv = await page.evaluate(() => G.tec.f[ME].inv);
  comprobar(inv && pri.endsWith(inv), "el jugador elige investigar «" + inv + "»");
  for (const r of ["eco", "civ", "rel", "pro"]) await clic(`[data-act="tecrama-${r}"]`);
  await page.screenshot({ path: path.join(capt, "tec-panel-propias.png") });
  await clic('[data-act="tecrama-mil"]');

  // provincia: encargar una obra con un clic
  await page.evaluate(() => {
    sel = G.F[ME].capId;
    tab = "prov";
    ui();
  });
  const oro0 = await page.evaluate(() => G.F[ME].gold);
  const b1 = await page.$eval('#panel button[data-act^="bld-"]:not([disabled])', (b) => b.dataset.act);
  await clic(`[data-act="${b1}"]`);
  const obra = await page.evaluate(() => ({ q: tecCola(sel), oro: G.F[ME].gold }));
  comprobar(
    obra.q.length === 1 && obra.oro < oro0,
    `obra encargada (${b1}) y pagada: ${oro0} → ${obra.oro} oro`,
  );
  await page.screenshot({ path: path.join(capt, "tec-provincia.png") });
  const k1 = b1.slice(4),
    lv1 = await page.evaluate((k) => G.P[sel][k], k1);

  console.log(`Juego de ${ANIOS} años`);
  for (let y = 0; y < ANIOS; y++) {
    await cerrarModales();
    // el jugador: si no investiga nada elige lo primero; si su capital no tiene obra, encarga una
    await page.evaluate(() => {
      try {
        if (!G || G.over || !alive(ME)) return;
        if (!G.tec.f[ME].inv) {
          tab = "tec";
          ui();
          document.querySelector('#panel button[data-act^="tecinv-"]:not([disabled])')?.click();
        }
        for (const p of owned(ME).slice(0, 3)) {
          sel = p.id;
          tab = "prov";
          ui();
          if (!tecCola(p.id).length)
            document.querySelector('#panel button[data-act^="bld-"]:not([disabled])')?.click();
        }
      } catch (e) {
        console.error("prueba-accion", e);
      }
    });
    await finAnio();
    process.stdout.write(`${await page.evaluate(() => G.year)} `);
    if (await page.evaluate(() => !G || G.over || !alive(ME))) break;
  }
  console.log("");

  const fin = await page.evaluate(
    ({ k1 }) => {
      const s = G.tec,
        cap = G.P[G.F[ME].capId],
        niveles = (f) =>
          owned(f).reduce((a, p) => a + tecEdificios().reduce((b, k) => b + (p[k] || 0), 0), 0);
      const b = tecBon(ME),
        base = { ...UN.i },
        st = OC.calc("statsUnidad", { ...UN.i }, { f: ME, t: "i", p: cap, lado: "defensor" }),
        cu = OC.calc("costeUnidad", UN.c.cost, { f: ME, t: "c" }),
        y0 = { g: 10, fo: 10 },
        y1 = G.P.filter((p) => p.owner < NF)
          .map((p) => OC.calc("rendimiento", { ...y0 }, { p, f: p.owner }))
          .find((y) => y.g !== 10 || y.fo !== 10);
      return {
        vivo: alive(ME),
        k1niv: cap[k1],
        tecs: s.f.map((x) => x.h.length),
        eras: s.f.map((x) => x.era),
        niveles: [...Array(NF).keys()].map((f) => (alive(f) ? niveles(f) : -1)),
        ev: window.__tec,
        vivos: [...Array(NF).keys()].filter((f) => alive(f) && f !== ME),
        obras: Object.keys(s.obras).length,
        st: { hp0: base.hp, hp: st.hp, atk0: base.atk, atk: st.atk },
        cu: { base: UN.c.cost, cu },
        ren: y1,
        bon: b && b.st,
        pts: tecPuntos(ME),
        disp: OC.calc("unidadesDisponibles", ["i", "a", "c"], { f: ME, p: cap }),
      };
    },
    { k1 },
  );
  console.log("Resultado");
  console.log("  técnicas por pueblo:", fin.tecs.join(","), "· eras:", fin.eras.join(","));
  console.log("  niveles de edificio por pueblo:", fin.niveles.join(","));
  console.log(
    "  obras terminadas (eventos):",
    fin.ev.ed.join(","),
    "· técnicas (eventos):",
    fin.ev.inv.join(","),
  );
  console.log("  eras nuevas:", JSON.stringify(fin.ev.era));
  comprobar(fin.ev.inv[CIVN] >= 3, `el jugador ha investigado ${fin.ev.inv[CIVN]} técnicas`);
  comprobar(!fin.vivo || fin.k1niv > lv1, `la obra del primer año subió ${k1}: ${lv1} → ${fin.k1niv}`);
  comprobar(fin.ev.ed[CIVN] >= 3, `obras del jugador terminadas: ${fin.ev.ed[CIVN]}`);
  const iaInv = fin.vivos.filter((f) => fin.ev.inv[f] >= 2).length,
    iaEd = fin.vivos.filter((f) => fin.ev.ed[f] >= 2).length;
  comprobar(iaInv === fin.vivos.length, `todas las IA vivas investigan (${iaInv}/${fin.vivos.length})`);
  comprobar(
    iaEd >= Math.ceil(fin.vivos.length * 0.7),
    `las IA construyen con colas de obra (${iaEd}/${fin.vivos.length})`,
  );
  comprobar(fin.ev.era.length >= 1, "al menos un pueblo alcanza una era nueva");
  comprobar(
    fin.st.hp > fin.st.hp0,
    `statsUnidad: vida de la infantería ${fin.st.hp0} → ${fin.st.hp.toFixed(2)}`,
  );
  comprobar(fin.cu.cu < fin.cu.base, `costeUnidad: jinetes ${fin.cu.base} → ${fin.cu.cu.toFixed(1)}`);
  comprobar(!!fin.ren, `rendimiento modificado por técnicas y edificios: 10/10 → ${JSON.stringify(fin.ren)}`);
  comprobar(!fin.ev.pronto.length, "nadie (jugador ni IA) se adelanta a su año: " + fin.ev.pronto.join(", "));
  comprobar(
    fin.disp.includes("i") && fin.disp.includes("c"),
    "unidadesDisponibles conserva las clases básicas",
  );

  await page.evaluate(() => {
    tab = "tec";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "tec-panel-final.png") });
  await page.evaluate(() => {
    sel = G.F[ME].capId;
    tab = "prov";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "tec-provincia-final.png") });

  // partida guardada ANTES del sistema: sin G.tec ni campos nuevos, niveles viejos
  console.log("Partida antigua");
  await page.evaluate(() => {
    save();
    const s = JSON.parse(localStorage.getItem("ocaso-save"));
    delete s.G.tec;
    for (const p of s.G.P) {
      for (const k of ["cuartel", "establo", "arqueria", "herreria", "escuela", "acueducto", "puerto"])
        delete p[k];
      for (const k of ["farm", "market", "walls", "temple"]) p[k] = Math.min(2, p[k]);
    }
    localStorage.setItem("ocaso-save", JSON.stringify(s));
  });
  await page.evaluate(() => openStart("home"));
  await page.waitForTimeout(100);
  await clic('[data-act="s-cnt"]');
  await page.waitForTimeout(300);
  await cerrarModales();
  const vieja = await page.evaluate(() => ({
    ok: !!(G.tec && G.tec.f.length === NF),
    campos: G.P.every((p) => typeof p.cuartel === "number" && typeof p.puerto === "number"),
  }));
  comprobar(vieja.ok && vieja.campos, "la partida antigua carga y se completa con G.tec");
  for (let y = 0; y < 2; y++) await finAnio();
  await page.evaluate(() => {
    tab = "tec";
    ui();
  });
  comprobar(
    (await page.$$('#panel [data-act^="tecinv-"]')).length > 0,
    "la pestaña Progreso funciona tras cargar",
  );

  const malos = errores.concat(fallos);
  console.log("\n" + (malos.length ? "ERRORES:\n" + malos.join("\n") : "OK sin errores"));
  await browser.close();
  process.exit(malos.length ? 1 : 0);
})();
