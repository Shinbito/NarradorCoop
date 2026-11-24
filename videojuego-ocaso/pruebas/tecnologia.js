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

  /* si un modal (sucesión, evento...) tapa el botón, se cierra y se reintenta */
  const clic = async (sel) => {
    for (let k = 0; k < 3; k++) {
      try {
        await page.click(sel, { timeout: 2500 });
        await page.waitForTimeout(60);
        return;
      } catch (e) {
        if (k === 2) throw e;
        await cerrarModales();
      }
    }
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
    window.__tec = {
      ed: Array(NF).fill(0),
      inv: Array(NF).fill(0),
      ad: Array(NF).fill(0),
      era: [],
      pronto: [],
    };
    OC.on("tecnologiaAdoptada", (x) => window.__tec.ad[x.f]++);
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
    UN.__elite = { s: "Élite", cost: 25, atk: 8, hp: 18, food: 2, mv: 5, edif: "establo", nivel: 2 };
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
    // la ciudad decide: tropas, bonos, perfil y huecos
    const otra = owned(ME).find((p) => p.id !== cap.id && !p.cuartel && !p.establo && !p.arqueria),
      dOtra = otra ? OC.calc("unidadesDisponibles", ["i", "a", "c"], { f: ME, p: otra }) : null,
      dCap = OC.calc("unidadesDisponibles", ["i", "a", "c"], { f: ME, p: cap }),
      lleno = otra
        ? tecMejora(
            ME,
            {
              ...otra,
              farm: 1,
              market: 1,
              temple: 1,
              walls: 1,
              cuartel: 1,
              establo: 1,
              arqueria: 1,
              herreria: 1,
              escuela: 0,
            },
            "escuela",
          ).motivo
        : "sin hueco";
    return {
      otra: !!otra,
      libres: (CIV[ME].tecLibres || []).includes("c"),
      dOtra,
      dCap,
      hpCap: tecCiudad(ME, cap).st.i.hp,
      hpOtra: otra ? tecCiudad(ME, otra).st.i.hp : 0,
      per: tecPerfil(cap),
      hu: tecHuecos(cap),
      lleno,
      motivoC: otra ? tecPuedeReclutar(ME, otra, "c").motivo : "requiere Establo",
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
  comprobar(
    ini.libres || !ini.otra || ini.dOtra.join() === "i",
    "ciudad sin cuartel ni establo: solo infantería (" + (ini.dOtra || []).join() + ")",
  );
  comprobar(ini.libres || /Establo/.test(ini.motivoC), "y explica por qué no jinetes: «" + ini.motivoC + "»");
  comprobar(
    ini.dCap.includes("a") && ini.dCap.includes("c"),
    "la capital (cuartel y establo) recluta " + ini.dCap.join(),
  );
  comprobar(
    !ini.otra || ini.hpCap > ini.hpOtra,
    `las tropas de la capital salen mejor (vida +${Math.round(ini.hpCap * 100)}% frente a +${Math.round(ini.hpOtra * 100)}%)`,
  );
  comprobar(
    ini.per && ini.per.nombre && "militar" in ini.per,
    `tecPerfil(capital): ${ini.per.icono} ${ini.per.nombre} (⚔${ini.per.militar} ◉${ini.per.economico} ✎${ini.per.saber})`,
  );
  comprobar(ini.hu.total >= 3 && ini.hu.total <= 9, `huecos de la capital ${ini.hu.usados}/${ini.hu.total}`);
  comprobar(/hueco/.test(ini.lleno), "una ciudad llena no admite edificios nuevos: «" + ini.lleno + "»");

  // pestaña Progreso: elegir investigación con un clic
  await clic('[data-act="tab-tec"]');
  await page.screenshot({ path: path.join(capt, "tec-panel-inicio.png"), fullPage: true });
  comprobar(
    /(disponible en el año|desde) \d+/.test(await page.$eval("#panel", (e) => e.textContent)),
    "el panel muestra «disponible en el año ...»",
  );
  const pri = await page.$eval('#panel button[data-act^="tecinv-"]:not([disabled])', (b) => b.dataset.act);
  await clic(`[data-act="${pri}"]`);
  const inv = await page.evaluate(() => G.tec.f[ME].inv);
  comprobar(inv && pri.endsWith(inv), "el jugador elige investigar «" + inv + "»");
  for (const r of ["eco", "civ", "rel", "pro"]) await clic(`[data-act="tecrama-${r}"]`);
  await page.screenshot({ path: path.join(capt, "tec-panel-propias.png"), fullPage: true });
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
  await page.screenshot({ path: path.join(capt, "tec-provincia.png"), fullPage: true });
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
          ui();
          document.querySelector('#panel button[data-act^="tecado-"]:not([disabled])')?.click();
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
        mejor = owned(ME).sort((a, b) => (b.cuartel || 0) - (a.cuartel || 0))[0] || cap,
        st = OC.calc("statsUnidad", { ...UN.i }, { f: ME, t: "i", p: mejor, lado: "defensor" }),
        /* solo los modificadores de tecnología: economía (inflación, hierro) puede encarecer */
        cu = (OC._mod.costeUnidad || [])
          .filter((m) => /tecTropas/.test(String(m.fn)))
          .reduce((v, m) => m.fn(v, { f: ME, t: "c" }) ?? v, UN.c.cost),
        y0 = { g: 10, fo: 10 },
        y1 = G.P.filter((p) => p.owner < NF)
          .map((p) => OC.calc("rendimiento", { ...y0 }, { p, f: p.owner }))
          .find((y) => y.g !== 10 || y.fo !== 10);
      /* una técnica adoptada solo rinde en su ciudad: quitarla de una ciudad cambia su rendimiento u orden */
      const pAd = G.P.find(
          (p) =>
            p.owner < NF &&
            tecAdopciones(p).some((id) => TEC[id].ren || TEC[id].gpct || TEC[id].fpct || TEC[id].ord),
        ),
        mide = (p) =>
          JSON.stringify([
            OC.calc("rendimiento", { ...y0 }, { p, f: p.owner }),
            OC.calc("ordenObjetivo", 50, { p, f: p.owner }),
          ]);
      let local = null;
      if (pAd) {
        const con = mide(pAd),
          ad = G.tec.ad[pAd.id];
        G.tec.ad[pAd.id] = [];
        G.tec.rev++;
        const sin = mide(pAd);
        G.tec.ad[pAd.id] = ad;
        G.tec.rev++;
        local = { con, sin, ciudad: pAd.name, tecs: ad.join(",") };
      }
      const perfiles = {};
      for (const p of G.P)
        if (p.owner < NF && p.owner !== ME) perfiles[tecPerfil(p).id] = (perfiles[tecPerfil(p).id] || 0) + 1;
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
        local,
        perfiles,
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
  comprobar(!fin.vivo || fin.ev.inv[CIVN] >= 3, `el jugador ha investigado ${fin.ev.inv[CIVN]} técnicas`);
  comprobar(!fin.vivo || fin.k1niv > lv1, `la obra del primer año subió ${k1}: ${lv1} → ${fin.k1niv}`);
  comprobar(!fin.vivo || fin.ev.ed[CIVN] >= 3, `obras del jugador terminadas: ${fin.ev.ed[CIVN]}`);
  const iaInv = fin.vivos.filter((f) => fin.ev.inv[f] >= 2).length,
    iaEd = fin.vivos.filter((f) => fin.ev.ed[f] >= 2).length;
  comprobar(iaInv === fin.vivos.length, `todas las IA vivas investigan (${iaInv}/${fin.vivos.length})`);
  comprobar(
    iaEd >= Math.ceil(fin.vivos.length * 0.7),
    `las IA construyen con colas de obra (${iaEd}/${fin.vivos.length})`,
  );
  comprobar(fin.ev.era.length >= 1, "al menos un pueblo alcanza una era nueva");
  comprobar(
    !fin.vivo || fin.st.hp > fin.st.hp0,
    `statsUnidad: vida de la infantería ${fin.st.hp0} → ${fin.st.hp.toFixed(2)}`,
  );
  comprobar(
    !fin.vivo || fin.cu.cu < fin.cu.base,
    `costeUnidad: jinetes ${fin.cu.base} → ${fin.cu.cu.toFixed(1)}`,
  );
  comprobar(!!fin.ren, `rendimiento modificado por técnicas y edificios: 10/10 → ${JSON.stringify(fin.ren)}`);
  console.log(
    "  adopciones (eventos):",
    fin.ev.ad.join(","),
    "· perfiles de ciudades de la IA:",
    JSON.stringify(fin.perfiles),
  );
  comprobar(
    !fin.vivo || fin.ev.ad[CIVN] >= 1,
    `el jugador ha implantado ${fin.ev.ad[CIVN]} técnicas en sus ciudades`,
  );
  const iaAd = fin.vivos.filter((f) => fin.ev.ad[f] >= 1).length;
  comprobar(
    iaAd >= Math.ceil(fin.vivos.length * 0.7),
    `las IA implantan técnicas en sus ciudades (${iaAd}/${fin.vivos.length})`,
  );
  const esp = ["fuerte", "mercantil", "granero", "saber"].reduce((s, k) => s + (fin.perfiles[k] || 0), 0);
  comprobar(esp >= 3, `la IA especializa ciudades (${esp} especializadas)`);
  comprobar(
    !!fin.local && fin.local.con !== fin.local.sin,
    "una técnica adoptada solo rinde en su ciudad: " +
      (fin.local ? `${fin.local.ciudad} (${fin.local.tecs})` : "ninguna"),
  );
  comprobar(!fin.ev.pronto.length, "nadie (jugador ni IA) se adelanta a su año: " + fin.ev.pronto.join(", "));
  comprobar(
    fin.disp.includes("i") && fin.disp.includes("c"),
    "unidadesDisponibles conserva las clases básicas",
  );

  await page.evaluate(() => {
    tab = "tec";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "tec-panel-final.png"), fullPage: true });
  await page.evaluate(() => {
    sel = G.F[ME].capId;
    tab = "prov";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "tec-provincia-final.png"), fullPage: true });

  // partida de la versión 1: técnicas nacionales, sin adopciones por ciudad
  console.log("Partida de la versión 1");
  await page.evaluate(() => {
    save();
    const s = JSON.parse(localStorage.getItem("ocaso-save"));
    delete s.G.tec.ad;
    s.G.tec.v = 1;
    s.G.tec.f[s.ME].h = [...new Set([...s.G.tec.f[s.ME].h, "disciplina", "arado"])];
    const cap = s.G.P[s.G.F[s.ME].capId];
    cap.cuartel = 0;
    cap.establo = 0;
    localStorage.setItem("ocaso-save", JSON.stringify(s));
  });
  await page.evaluate(() => openStart("home"));
  await page.waitForTimeout(100);
  await clic('[data-act="s-cnt"]');
  await page.waitForTimeout(300);
  await cerrarModales();
  const v1 = await page.evaluate(() => {
    const cap = G.P[G.F[ME].capId];
    return {
      ad: owned(ME).every((p) => tecAdoptada(p, "disciplina") && tecAdoptada(p, "arado")),
      cap: cap.cuartel >= 1 && cap.establo >= 1,
      v: G.tec.v,
    };
  });
  comprobar(
    v1.ad && v1.cap && v1.v === 2,
    "partida v1 migrada: lo investigado queda adoptado en sus ciudades; la capital recluta",
  );

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

  /* ---------- Mundo de leyendas: los 12 pueblos nuevos ---------- */
  console.log("Mundo de leyendas (aztecas contra los pueblos nuevos)");
  const ley = await page.evaluate(() => {
    const me = civIdx("azt"),
      riv = ["ara", "nor", "chi", "inc", "may", "gri", "egi", "ind", "cel", "esl", "mon", "per"].map(civIdx);
    leaveNet();
    newGame(me, cands(me)[0], { modo: "leyendas", activas: [me, ...riv] });
    drawBase();
    OC.emitirSync("partidaLista");
    $("start").classList.remove("show");
    ui();
    save();
    startTurn();
    const cap = G.P[G.F[ME].capId],
      genericas = G.activas.filter((f) => !CIV[f].eras || CIV[f].eras[0] === "Tribal").map((f) => CIV[f].id),
      propias = G.activas
        .filter((f) => Object.values(TEC).filter((T) => T.civ === f).length !== 2)
        .map((f) => CIV[f].id),
      edis = G.activas
        .filter((f) => Object.values(TEC_EDI).filter((e) => e.civ === f).length !== 1)
        .map((f) => CIV[f].id);
    /* qué pide cada única de los 19 pueblos */
    const unicas = [];
    for (let f = 0; f < NF; f++)
      for (const t of CIV[f].unicas || []) {
        const r = tecReqUnidad(t, f);
        unicas.push({
          id: CIV[f].id,
          t,
          edif: r.edif,
          nivel: r.nivel,
          tec: r.tec,
          ok: !!BLD[r.edif] && (!r.tec || !!TEC[r.tec]),
        });
      }
    sel = cap.id;
    tab = "prov";
    ui();
    const txt = document.getElementById("panel").textContent,
      recluta = (txt.match(/Recluta: ([^\n]*?)Sus tropas/) || [])[1] || "",
      montadas = TYP.filter((t) => !civPuede(ME, t)).map((t) => CIV[ME].un[t] || UN[t].s);
    const jag0 = tecPuedeReclutar(ME, cap, "jag");
    tecF(ME).h.push("floridas");
    (G.tec.ad[cap.id] = G.tec.ad[cap.id] || []).push("floridas");
    G.tec.rev++;
    const jag1 = tecPuedeReclutar(ME, cap, "jag");
    return {
      genericas,
      propias,
      edis,
      unicas,
      guerreros: cap.guerreros,
      establo: cap.establo,
      establoVisible: tecVisible("establo", ME, cap),
      guerrerosNombre: tecB("guerreros", ME).n,
      remonta:
        tecDisponible(ME, "remonta") ||
        Object.keys(TEC).some((id) => TEC[id].caballo && tecParaCiv(ME, TEC[id])),
      aqui: tecReclutaAqui(ME, cap),
      recluta,
      montadasEnLinea: montadas.filter((n) => recluta.includes(n)),
      jag0: jag0.motivo,
      jag1: jag1.ok,
      ele: { per: tecReqUnidad("ele", civIdx("per")).tec, ind: tecReqUnidad("ele", civIdx("ind")).tec },
      tec0: G.activas.map((f) => tecF(f).h.length),
    };
  });
  comprobar(!ley.genericas.length, "todos los pueblos tienen eras propias " + ley.genericas.join(","));
  comprobar(
    !ley.propias.length && !ley.edis.length,
    `cada pueblo: 2 técnicas y 1 edificio propios ${ley.propias.join(",")} ${ley.edis.join(",")}`,
  );
  for (const u of ley.unicas)
    console.log(`    ${u.id} ${u.t}: ${u.edif} ${u.nivel}${u.tec ? " + " + u.tec : ""}`);
  comprobar(
    ley.unicas.length >= 20 && ley.unicas.every((u) => u.ok),
    `las ${ley.unicas.length} únicas piden edificio y técnica existentes`,
  );
  comprobar(
    ley.guerreros >= 1 && !ley.establo && !ley.establoVisible,
    `aztecas: ${ley.guerrerosNombre} en vez de establo`,
  );
  comprobar(!ley.remonta, "sin caballos no se ofrecen técnicas ecuestres");
  comprobar(
    !ley.aqui.some((t) => !["i", "a", "l", "p", "h", "jag", "agu"].includes(t)),
    "aztecas reclutan solo a pie: " + ley.aqui.join(","),
  );
  comprobar(
    ley.recluta && !ley.montadasEnLinea.length,
    `la línea «Recluta:» no ofrece monturas («${ley.recluta.trim()}»)`,
  );
  comprobar(/Guerras floridas/.test(ley.jag0) && ley.jag1, `guerreros jaguar: «${ley.jag0}» y luego sí`);
  comprobar(
    ley.ele.per === "clibanarios" && ley.ele.ind === "gajashastra",
    "elefantes: clibanarios (persas) o gajashastra (indios)",
  );
  await page.screenshot({ path: path.join(capt, "tec-leyendas-provincia.png"), fullPage: true });
  for (let y = 0; y < 25; y++) await finAnio();
  const ley2 = await page.evaluate(() => {
    const uni = new Set(Object.keys(TEC_EDI).filter((k) => TEC_EDI[k].civ != null)),
      propias = G.activas.filter((f) => f !== ME && alive(f) && tecF(f).h.some((id) => TEC[id].r === "pro")),
      unicos = G.P.filter((p) => [...uni].some((k) => p[k] > 0)).length,
      perfiles = {};
    for (const p of G.P) if (p.owner < NF) perfiles[tecPerfil(p).id] = (perfiles[tecPerfil(p).id] || 0) + 1;
    return {
      tecs: G.activas.map((f) => `${CIV[f].id}:${tecF(f).h.length}`),
      vivos: G.activas.filter((f) => f !== ME && alive(f)).length,
      propias: propias.length,
      unicos,
      perfiles,
      montados: G.P.filter(
        (p) => p.owner < NF && Object.keys(p.u).some((t) => p.u[t] > 0 && !civPuede(p.owner, t)),
      ).length,
      ano: G.year,
    };
  });
  console.log("  técnicas:", ley2.tecs.join(" "), "· perfiles:", JSON.stringify(ley2.perfiles));
  comprobar(
    ley2.propias >= Math.ceil(ley2.vivos * 0.6),
    `las IA investigan su rama propia (${ley2.propias}/${ley2.vivos})`,
  );
  comprobar(ley2.unicos >= 3, `se levantan edificios propios (${ley2.unicos})`);
  comprobar(!ley2.montados, "nadie sin caballos tiene tropas montadas");
  await page.evaluate(() => {
    tab = "tec";
    tecRama = "pro";
    ui();
  });
  await page.screenshot({ path: path.join(capt, "tec-leyendas-progreso.png"), fullPage: true });

  const malos = errores.concat(fallos);
  console.log("\n" + (malos.length ? "ERRORES:\n" + malos.join("\n") : "OK sin errores"));
  await browser.close();
  process.exit(malos.length ? 1 : 0);
})();
