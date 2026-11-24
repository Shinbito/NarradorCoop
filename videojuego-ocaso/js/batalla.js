/* ---------- batalla táctica ----------
   Sistema de COMBATE. Mismo modelo de factores que la resolución automática (campana.js), pero
   continuo y con geometría: frente/flanco/retaguardia, cargas que se atascan, munición, terreno
   (bosque, colina, río), murallas, cansancio, moral que se erosiona y desbandadas.
   Entrada: cmbTactica(ejA, ejD, ctx, modo). El bando 0 del campo es siempre el del jugador
   (ctx.jugador = 1 si el jugador manda ejD; ctx.auto = true: los dos bandos los lleva la IA). */
/* ==================== MOTOR DE BATALLA (resolución automática) ====================
   Sistema de COMBATE. Vive aquí desde la fase 2 (campana.js pasa a Campaña). Las funciones públicas
   (cmbResolverAuto, cmbEstimar, cmbFactores, cmbEntorno, cmbTerreno, autoBattle...) son declaraciones de
   función: si campana.js aún conserva su copia antigua, esta (cargada después) la sustituye.
   Constantes con prefijo CMBA_ / cmba* para no chocar con las antiguas. */
let cmbaTerrC = null;
function cmbTerreno(p) {
  if (!p || !MAP) return { tag: "llanura", bosque: 0, colina: 0, rio: false };
  if (!cmbaTerrC || cmbaTerrC.seed !== MAP.seed) {
    const c = MAP.pts.map(() => [0, 0, 0, 0]);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = MAP.grid[y][x];
        if (i >= 0) c[i][MAP.terr[y][x]]++;
      }
    cmbaTerrC = {
      seed: MAP.seed,
      l: c.map((k, i) => {
        const n = k[1] + k[2] + k[3] || 1,
          bosque = k[2] / n,
          colina = k[3] / n,
          rio = ((i * 2654435761 + MAP.seed) >>> 0) % 5 === 0;
        return {
          tag: colina > 0.3 ? "colinas" : bosque > 0.3 ? "bosque" : rio ? "vado" : "llanura",
          bosque,
          colina,
          rio,
        };
      }),
    };
  }
  return cmbaTerrC.l[p.id] || cmbaTerrC.l[0];
}
function cmbTerrCtx(t, p) {
  if (t && typeof t === "object") return t;
  if (typeof t === "string")
    return { tag: t, bosque: t === "bosque" ? 0.5 : 0, colina: t === "colinas" ? 0.5 : 0, rio: t === "vado" };
  return cmbTerreno(p);
}
const CMBA_CLIMA = [
  ["despejado", 55],
  ["lluvia", 18],
  ["niebla", 10],
  ["calor", 17],
];
const CMBA_HORA = [
  ["al alba", 40, 14],
  ["a media mañana", 35, 11],
  ["por la tarde", 25, 8],
];
function cmbSortea(l) {
  let x = R() * l.reduce((s, e) => s + e[1], 0);
  for (const e of l) if ((x -= e[1]) < 0) return e;
  return l[0];
}
function cmbEntorno(ctx) {
  const terr = cmbTerrCtx(ctx.terreno, ctx.p),
    cl = ctx.clima || cmbSortea(CMBA_CLIMA)[0],
    ho = CMBA_HORA.find((h) => h[0] === ctx.hora) || cmbSortea(CMBA_HORA);
  return { terr, clima: cl, hora: ho[0], rmax: ho[2] + (ctx.fort ? 2 : 0) };
}
const CMBA_TERR = { llanura: "llanura abierta", bosque: "bosque", colinas: "colinas", vado: "vado del río" };
const CMBA_K = { mel: 0.17, dis: 0.15, pers: 2.1, mor: 165 };
/* capacidad de persecución por rol */
const CMBA_PERS = {
  l: 0.05,
  i: 0.08,
  p: 0.04,
  h: 0.12,
  a: 0.06,
  x: 0.55,
  c: 0.38,
  k: 0.22,
  m: 0.45,
  ele: 0.15,
  cam: 0.4,
  asd: 0,
};
const cmbPers = (t) => UN[t].pers ?? CMBA_PERS[UN[t].rol] ?? 0.08;
const CMBA_FX = {
  carga: "El ímpetu de la carga",
  flanqueo: "El flanqueo de la caballería",
  numero: "La superioridad numérica",
  proyectiles: "Las descargas de proyectiles",
  armadura: "Armaduras y escudos",
  murallas: "Las murallas",
  torres: "Las torres de la muralla",
  terreno: "El terreno",
  mando: "El mando del general",
  veterania: "La veteranía de las tropas",
  lanceros: "El muro de lanzas ante la caballería",
  persecucion: "La persecución de los fugitivos",
  general: "La caída del general enemigo",
  fatiga: "El agotamiento del enemigo",
  bono: "Pertrechos y fortuna",
  hambre: "El hambre en las filas enemigas",
  asedio: "Las máquinas de asedio",
  espanto: "El espanto de los caballos ante las bestias",
  desbocados: "Las bestias desbocadas del enemigo",
  lados: "El ataque desde varias direcciones",
};
const cmbaFxTxt = (k) =>
  k.startsWith("hab:")
    ? (CMB_HAB[k.slice(4)] || {}).n
    : k.startsWith("flancos:")
      ? `El asalto por ${k.slice(8)} flancos`
      : CMBA_FX[k];
const cmbaRnd = () => 0.85 + R() * 0.3;
const cmbaNom = (b) => b.nm || CIV[b.f].un[b.t].toLowerCase();
const cmbaVivos = (L) => L.bl.filter((b) => b.n > 0.5 && !b.rout);
/* cuerpo a cuerpo: ni tiradores a pie ni máquinas; los montados que aún tiran (o en retirada fingida) tampoco */
const cmbaCuerpo = (b) =>
  b.cl !== "dis" && b.cl !== "asd" && !(b.cl === "cab" && b.st.al > 0 && b.ammo > 0 && UN[b.t].rol === "m");
const cmbaTirador = (b) => b.st.al > 0 && b.ammo > 0;
const cmbaFatM = (b) => Math.max(0.5, 1 - b.fat / 220);
const cmbaSuma = (l) => l.reduce((a, b) => a + b.n, 0);
function cmbAlza(fx, s, k, v) {
  if (v > 0) fx[s][k] = (fx[s][k] || 0) + v;
}
/* un ejército en la batalla automática. s = índice del ejército; def = pertenece al bando que defiende */
function cmbLado(s, ej, ctx, env, def = s === 1) {
  const f = ej.f,
    lado = def ? "defensor" : "atacante",
    gc = ej.gen != null && G.C[ej.gen] && G.C[ej.gen].alive !== false ? G.C[ej.gen] : null,
    lv = gc ? cmbNivelXp(gc.xp) : 0,
    /* OC 'bonoBatalla': multiplicador del daño. ctx {f, lado, p} */
    bono = OC.calc("bonoBatalla", 1, { f, lado, p: ctx.p || null }) || 1,
    hambre = ej.hambre != null ? ej.hambre : !!(G.F[f] && G.F[f].food <= 0),
    as = def && ctx.asedio ? Math.min(20, ctx.asedio * 4) : 0,
    fl = def && ctx.fort ? cmbFlancos(ctx) - 1 : 0,
    bl = [],
    maq = {},
    merT = cmbMerTipo(ej);
  for (const t of TYP) {
    const n = (ej.u[t] || 0) * SPU - (merT[t] || 0);
    if (n <= 0 || !UN[t]) continue;
    /* en campo abierto las máquinas de asedio no entran en combate: se quedan atrás con el bagaje
       (se conservan si su bando gana; si pierde, se las queman o capturan) */
    if (UN[t].asedio && !ctx.fort) {
      maq[t] = (maq[t] || 0) + (ej.u[t] || 0);
      continue;
    }
    const st = cmbStats(f, t, cmbOrigenP(f, t, ej.ori, ctx.p), lado, (ej.vet && ej.vet[t]) || 0),
      mx =
        st.mo +
        (gc ? gc.ma * 1.5 + (lv - 1) * 1.5 : 0) +
        (def && ctx.fort ? 3 + ctx.fort * 3 : 0) -
        (hambre ? 10 : 0) -
        as -
        fl * 4;
    const an = mx * (0.88 + R() * 0.24),
      b = {
        s,
        f,
        t,
        cl: st.cl,
        n,
        n0: n,
        her: 0,
        dead: 0,
        mor: an,
        mx: an,
        fat: ej.fat || 0,
        rout: false,
        ammo: st.mu,
        st,
        perd: 0,
        auto: true,
      };
    cmbHabIni(b, f, t);
    bl.push(b);
  }
  return {
    s,
    f,
    def,
    bando: ej.bando ?? s,
    gen: gc ? gc.id : null,
    g: gc ? 1 + gc.ma * 0.04 + (lv - 1) * 0.015 : 1,
    ma: gc ? gc.ma : 0,
    lv,
    gOk: !!gc,
    bono,
    suerte: 0.62 + (R() + R()) * 0.38,
    hambre,
    bl,
    maq,
    n0: bl.reduce((a, b) => a + b.n, 0),
    /* sin las máquinas: su dotación no sostiene la moral de la línea */
    nl0: bl.filter((b) => b.cl !== "asd").reduce((a, b) => a + b.n, 0),
    dir: cmbDirL(ej.dir),
    flank: 0,
    fdicho: false,
    cont: 0,
    roto: false,
    fuera: false,
    espera: false,
    amenaza: {},
  };
}
/* dirección de procedencia de un ejército: 'N'|'E'|'S'|'O' (también 'W') o ángulo en grados (0 = norte,
   90 = este); null si no se sabe */
function cmbDirL(d) {
  if (d == null || d === "") return null;
  if (typeof d === "number") {
    const a = ((d % 360) + 360) % 360;
    return a < 45 || a >= 315 ? "N" : a < 135 ? "E" : a < 225 ? "S" : "O";
  }
  return { N: "N", S: "S", E: "E", O: "O", W: "O" }[String(d).toUpperCase()] || null;
}
const CMB_DIRN = { N: "el norte", S: "el sur", E: "el este", O: "el oeste" };
/* ejército que defiende la plaza: ctx.def, o el que viene con dir 'C' (centro, como lo marca Campaña), o con
   murallas el primero de otro bando que el primero */
function cmbDefIdx(ejs, ctx) {
  if (ctx.def != null) return ctx.def;
  const c = ejs.findIndex((e) => String(e.dir || "").toUpperCase() === "C");
  if (c >= 0) return c;
  if (!ctx.fort) return null;
  const b0 = ejs[0].bando ?? 0,
    d = ejs.findIndex((e, i) => (e.bando ?? i) !== b0);
  return d >= 0 ? d : null;
}
/* flancos por los que se asalta una plaza (lo pasa Campaña: 1-4) */
/* si Campaña ya lo tradujo (ctx.flancosAplicados), no se aplica dos veces */
const cmbFlancos = (ctx) =>
  ctx && ctx.flancosAplicados ? 1 : clamp(Math.round((ctx && ctx.flancos) || 1), 1, 4);
/* ONL: dificultad de la IA (ctx.dificultad = ['normal'|'dificil', ...] por ejército). En la automática el
   bando «difícil» emplea mejor sus fuerzas: +4 % de daño, +5 % de moral y algo más de fortuna. */
function cmbDificultadAuto(L, ctx) {
  const D = ctx && ctx.dificultad;
  if (!D) return L;
  for (let s = 0; s < L.length; s++)
    if (D[s] === "dificil") {
      const X = L[s];
      X.bono *= 1.04;
      X.suerte = Math.min(1.38, X.suerte + 0.03);
      for (const b of X.bl) {
        b.mor *= 1.05;
        b.mx *= 1.05;
      }
    }
  return L;
}
/* reparte un objetivo según preferencias de doctrina; fac(e) = preferencia por el ejército de e
   (el que me amenaza, no el que aguarda); con un solo enemigo no cambia nada */
function cmbObjetivo(b, ene, frente, fort, fac) {
  let tot0 = 0;
  const w = ene.map((e) => {
    let k = 1;
    if (e.cl === "asd")
      k = !fort ? 0.03 : b.cl === "dis" || b.cl === "asd" ? (e.t === "ari" ? 2.5 : 1.5) : 0.6;
    else if (e.cl === "dis" || (e.t === "m" && e.ammo > 0)) {
      if (b.cl === "cab") k = 2.2;
      else k = frente > 0 ? (b.cl === "dis" ? 0.8 : 0.35) : 1.5;
    } else if (b.cl === "dis") k = e.cl === "inf" ? 1.2 : 1;
    const v = e.n * k * (fac ? fac(e) : 1);
    tot0 += v;
    return v;
  });
  return ene.map((e, i) => [e, tot0 ? w[i] / tot0 : 0]);
}
/* Dos ejércitos (atacante y defensor): envoltorio de cmbResolverMulti con el resultado de siempre */
/* PELOTONES MERMADOS: un ejército de campaña guarda en ej.mer los hombres que le faltan (en total) para
   tener sus pelotones completos. Al desplegar se reparten entre sus tipos (cada tipo conserva al menos un
   hombre por pelotón). Tras una batalla con ctx.merma, los pelotones tocados NO se redondean: quedan
   mermados (ceil) y lo que falta va a res.mer; se completan en una ciudad propia pagando oro (js/ritmo.js). */
function cmbMerTipo(ej) {
  const m = Math.max(0, Math.round((ej && ej.mer) || 0)),
    o = {};
  if (!m) return o;
  const ts = TYP.filter((t) => (ej.u[t] || 0) > 0 && UN[t] && !UN[t].asedio),
    tt = ts.reduce((a, t) => a + ej.u[t], 0);
  let resto = m;
  ts.forEach((t, i) => {
    const v = Math.max(0, Math.min(resto, i === ts.length - 1 ? resto : Math.round((m * ej.u[t]) / tt), ej.u[t] * SPU - ej.u[t]));
    o[t] = v;
    resto -= v;
  });
  return o;
}
function cmbResolverAuto(ejA, ejD, ctx = {}) {
  /* ONL */ if (ctx.onlRes && !ctx.est) {
    const r = ctx.onlRes;
    ctx.onlRes = null;
    return r;
  }
  const r = cmbResolverMulti(
    [
      { ...ejA, bando: 0 },
      { ...ejD, bando: 1 },
    ],
    { ...ctx, def: 1, sinEvento: true },
  );
  return {
    gana: r.gana,
    A: r.ejs[0].A,
    D: r.ejs[1].A,
    heridos: { A: r.ejs[0].heridos, D: r.ejs[1].heridos },
    mer: { A: r.ejs[0].mer, D: r.ejs[1].mer },
    informe: r.informe,
    gen: r.gen,
    brecha: r.brecha,
  };
}
/* N ejércitos agrupados en bandos (aliados no se atacan; todos contra todos = un bando por ejército).
   ejs = [{f, u, gen, vet, ori, fat, bando}]; ctx como en cmbResolverAuto más:
     def: índice del ejército que defiende la plaza (su bando entero se beneficia de murallas y terreno);
     oportunista: bando que espera a que los demás se desgasten (false = nadie; por defecto la IA decide);
     emitir: emitir 'batallaResuelta' con ejs y bandos (por defecto no: lo hace quien la llama, como Campaña).
   Devuelve {gana: bando, ejs: [{id, u (supervivientes; = A), her (heridos; = heridos), f, bando, gana,
   bajas, gen}], informe, gen, brecha}: el contrato de Campaña (id = el del ejército recibido). */
function cmbResolverMulti(ejs0, ctx = {}) {
  /* ONL: batalla conjunta ya librada en vivo (o por la IA difícil) entre jugadores online */
  if (ctx.onlResMulti && !ctx.est) {
    const r = ctx.onlResMulti;
    ctx.onlResMulti = null;
    return r;
  }
  /* refuerzos: ejércitos que llegan con la batalla empezada (ctx.refuerzos = [{ej, dir, llegada (s)}]);
     van detrás de los demás en ejs y en el resultado. 1 ronda = 10 s. */
  const REF = ctx.refuerzos || [],
    ejs = ejs0.concat(REF.map((q) => ({ ...q.ej, dir: q.dir ?? q.ej.dir }))),
    llega = ejs0.map(() => 0).concat(REF.map((q) => 1 + Math.ceil((+q.llegada || 30) / 10))),
    env = cmbEntorno(ctx),
    est = !!ctx.est,
    fort = ctx.fort || 0,
    terr = env.terr,
    N = ejs.length,
    dIdx = cmbDefIdx(ejs, ctx),
    bandoDef = dIdx != null && ejs[dIdx] ? (ejs[dIdx].bando ?? dIdx) : null,
    L = cmbDificultadAuto(
      ejs.map((ej, i) => cmbLado(i, ej, ctx, env, bandoDef != null && (ej.bando ?? i) === bandoDef)),
      ctx,
    ) /* ONL */,
    fx = L.map(() => ({})),
    ron = [],
    gen = L.map(() => null),
    curva = {},
    calorClima = env.clima === "calor" ? 1.3 : 1,
    flancos = fort ? cmbFlancos(ctx) : 1,
    hostil = (a, b) => L[a].bando !== L[b].bando,
    enJuego = (X) => !X.fuera && !(llega[X.s] > r),
    bandosEnJuego = () => [...new Set(L.filter(enJuego).map((X) => X.bando))],
    /* bloques enemigos de un ejército (los que aguardan casi no son blanco) */
    eneDe = (s) => L.filter((X, i) => enJuego(X) && hostil(s, i)).flatMap(cmbaVivos),
    facDe = (s) => (e) => (L[e.s].espera ? 0.35 : 1) * (L[s].amenaza[e.s] ? 1.3 : 1),
    split = (s, k, v) => {
      const hs = L.filter((X, i) => hostil(s, i));
      for (const X of hs) cmbAlza(fx, X.s, k, v / hs.length);
    };
  let fortE = fort,
    brecha = false,
    ev = [],
    r = 0;
  const di = (p, t) => ev.push([p, t]);
  for (const b of L.flatMap((X) => X.bl)) {
    const nm = CIV[b.f].un[b.t].toLowerCase();
    b.nm = L.some(
      (X) => X.s !== b.s && CIV[X.f].un[b.t] === CIV[b.f].un[b.t] && X.bl.some((o) => o.t === b.t),
    )
      ? `${nm} (${CIV[b.f].s})`
      : nm;
  }
  /* adaptador de habilidades: en la automática "cerca" significa trabados en la melé */
  const B = {
    auto: true,
    enemigos: (x, rad) => (rad >= 4 || r >= 2 ? eneDe(x.s) : []),
    aliados: (x) => L.filter((X) => enJuego(X) && X.bando === L[x.s].bando).flatMap(cmbaVivos),
    bosque: () => terr.bosque || 0,
    enBosque: () => terr.bosque > 0.3,
    moralAliada: (x) => {
      const v = cmbaVivos(L[x.s]),
        n = cmbaSuma(v);
      return n ? v.reduce((a, b) => a + b.n * (b.mor / b.mx), 0) / n : 1;
    },
    log: (t, p) => di(p, t),
  };
  for (const X of L) if (X.hambre) split(X.s, "hambre", X.n0 * 0.04);
  /* asalto por varios flancos: la guarnición se reparte por las murallas */
  if (flancos > 1 && bandoDef != null) {
    const at = L.find((X) => !X.def);
    if (at)
      cmbAlza(
        fx,
        at.s,
        "flancos:" + flancos,
        L.filter((X) => X.def).reduce((a, X) => a + X.n0, 0) * 0.05 * (flancos - 1),
      );
  }
  /* tercero oportunista: con tres bandos o más, uno puede aguardar a que los otros se desgasten */
  if (new Set(L.map((X) => X.bando)).size >= 3 && ctx.oportunista !== false) {
    let opo = ctx.oportunista;
    if (opo == null || opo === true) {
      const fz = {};
      for (const X of L) if (!X.def) fz[X.bando] = (fz[X.bando] || 0) + X.n0;
      const cand = Object.keys(fz).sort((a, b) => fz[a] - fz[b])[0];
      opo = cand != null && (ctx.oportunista === true || R() < 0.6) ? +cand : null;
    }
    if (opo != null)
      for (const X of L)
        if (X.bando === opo && !X.def) {
          X.espera = true;
          di(2, `Las tropas de ${CIV[X.f].s} aguardan a que los demás se desgasten.`);
        }
  }
  let fin =
      L.filter((X) => X.n0 > 0).length < 2 || new Set(L.filter((X) => X.n0 > 0).map((X) => X.bando)).size < 2
        ? "vacio"
        : "",
    gana = fin ? (L.find((X) => X.n0 > 0) || L[L.length - 1]).bando : null;
  for (r = 1; !fin && r <= env.rmax; r++) {
    ev = [];
    for (const X of L)
      if (llega[X.s] === r)
        di(4, `Llegan refuerzos: las tropas de ${CIV[X.f].s} entran por ${CMB_DIRN[X.dir] || "un costado"}.`);
    const dano = new Map(),
      golpe = (tg, v, s) => {
        dano.set(tg, (dano.get(tg) || 0) + v);
        if (s != null && v > 0) L[tg.s].amenazaN[s] = (L[tg.s].amenazaN[s] || 0) + v;
      },
      susto = new Map(),
      veneno = new Set();
    for (const X of L) {
      X.amenazaN = {};
      for (const b of X.bl) {
        b.perd = 0;
        b._morPrev = b.mor;
        b.tiroso = eneDe(X.s).some(cmbaTirador);
      }
    }
    /* habilidades: cada bando las usa con criterio (no quien aguarda) */
    for (const X of L) if (enJuego(X) && !X.espera) for (const b of cmbaVivos(X)) cmbHabIA(b, B);
    for (const X of L) for (const b of X.bl) b._morPrev = b.mor;
    const HM = new Map();
    for (const X of L) for (const b of X.bl) HM.set(b, cmbHabMod(b));
    /* asedio: catapultas y arietes abren brecha; las torres anulan parte del bono de las murallas */
    let torre = 0;
    if (fort && !brecha && bandoDef != null) {
      const maq = L.filter((X) => enJuego(X) && !X.def)
        .flatMap(cmbaVivos)
        .filter((b) => UN[b.t].sitio);
      let baja = 0;
      for (const b of maq) {
        const S = UN[b.t].sitio;
        if (S.brecha && (b.t !== "ari" || r >= 2) && (!b.st.mu || b.ammo > 0)) {
          const x = S.brecha * (b.n / SPU) * cmbaRnd();
          baja += x;
          cmbAlza(fx, b.s, "asedio", x * L[dIdx].n0 * 0.05);
        }
        if (S.torre && r >= 2) torre += S.torre * (b.n / SPU);
      }
      torre = Math.min(0.75, torre);
      if (baja > 0) {
        fortE = Math.max(0, fortE - baja);
        if (!L[0].dMaq) {
          L[0].dMaq = 1;
          di(
            3,
            maq.some((b) => b.t === "cat")
              ? "Las catapultas golpean la muralla."
              : "Los arietes baten la puerta.",
          );
        }
      }
      if (torre > 0 && !L[0].dTor) {
        L[0].dTor = 1;
        const tb = maq.find((b) => b.t === "tor");
        cmbAlza(fx, tb ? tb.s : 0, "asedio", torre * L[dIdx].n0 * 0.1);
        di(3, "Las torres de asedio alcanzan el adarve.");
      }
      if (fortE <= fort * 0.15) {
        brecha = true;
        fortE = 0;
        for (const X of L) if (X.def) for (const b of X.bl) b.mor -= 10;
        di(5, "¡Brecha en la muralla! Los defensores retroceden.");
      }
    }
    if (r === 1 && flancos > 1 && fort)
      di(3, `Asalto por ${flancos} flancos: la guarnición se reparte por las murallas.`);
    const fM = fortE * (1 - torre) * (1 - 0.18 * (flancos - 1)),
      murMel = (tg) => (L[tg.s].def && fM > 0 ? 1 / (1 + 0.18 * fM) : 1),
      murDis = (tg) => (L[tg.s].def && fM > 0 ? 1 / (1 + 0.25 * fM) : 1);
    /* espanto: camellos y elefantes encabritan a los caballos enemigos */
    const espanto = L.map((X) => {
      const v = enJuego(X) && !X.espera ? cmbaVivos(X) : [],
        n = cmbaSuma(v);
      return n && cmbaSuma(v.filter((b) => cmbHabTiene(b, "espanto"))) >= n * 0.08;
    });
    /* flanqueo: caballería libre o superioridad numérica que desborda la línea */
    if (r >= 3)
      for (const O of L) {
        if (!enJuego(O)) continue;
        const Es = L.filter((X, i) => enJuego(X) && !X.espera && hostil(O.s, i)),
          vE = Es.flatMap(cmbaVivos),
          cabS = (v) =>
            v
              .filter((b) => b.cl === "cab" && UN[b.t].rol !== "m")
              .reduce((a, b) => a + b.n * (b.t === "k" ? 1.3 : b.t === "x" ? 0.9 : 1), 0),
          cE = cabS(vE),
          cO = cabS(cmbaVivos(O)),
          fE = cmbaSuma(vE.filter(cmbaCuerpo)),
          fO = Math.max(1, cmbaSuma(cmbaVivos(O).filter(cmbaCuerpo)));
        let fc = 0,
          fn = 0;
        if (!Es.length || O.espera) {
          O.flank = O.fc = O.fn = 0;
          continue;
        }
        /* la caballería solo rodea si su propia infantería fija al enemigo de frente */
        const fija = clamp(cmbaSuma(vE.filter((b) => b.cl === "inf")) / fO, 0, 1);
        if (cE > cO * 1.5 && cE > 0.12 * cmbaSuma(vE)) fc = clamp((cE - cO * 1.5) / (fO + cO), 0, 0.6) * fija;
        if (fE > fO * 1.4) fn = clamp((fE / fO - 1.4) * 0.25, 0, 0.4);
        /* atacado a la vez desde varias direcciones (ejércitos que llegan por distintos lados) */
        const dirs = new Set(Es.map((X) => X.dir).filter(Boolean));
        if (dirs.size >= 2) {
          fn += 0.12 * (dirs.size - 1);
          for (const X of Es)
            if (X.dir) cmbAlza(fx, X.s, "lados", (O.n0 * 0.03 * (dirs.size - 1)) / Es.length);
          if (!O.dLados) {
            O.dLados = 1;
            di(
              3,
              `Las tropas de ${CIV[O.f].s} se ven atacadas desde ${[...dirs].map((d) => CMB_DIRN[d]).join(" y ")}.`,
            );
          }
        }
        const m = (O.def && fM > 0 ? 0.3 : 1) * (terr.bosque > 0.3 ? 0.6 : 1);
        O.flank = Math.min(0.8, (fc + fn) * m);
        O.fc = fc * m;
        O.fn = fn * m;
        if (O.flank > 0.15 && !O.fdicho) {
          O.fdicho = true;
          const v = cmbaVivos(O)
              .filter(cmbaCuerpo)
              .sort((a, b) => b.n - a.n)[0],
            c = vE.filter((b) => b.cl === "cab").sort((a, b) => b.n - a.n)[0];
          if (v)
            di(
              3,
              fc >= fn && c
                ? `Los ${cmbaNom(c)} flanquean a los ${cmbaNom(v)}; su moral se tambalea.`
                : `Las tropas de ${CIV[Es.sort((a, b) => b.n0 - a.n0)[0].f].s} desbordan por su número la línea de los ${cmbaNom(v)}.`,
            );
        }
      }
    /* proyectiles: en la primera ronda dos descargas; luego por encima de la melé */
    const proy = L.map(() => 0);
    for (const O of L) {
      const s = O.s,
        ene = eneDe(s);
      if (!enJuego(O) || O.espera || !ene.length) continue;
      const frente = cmbaSuma(ene.filter((e) => cmbaCuerpo(e) && !L[e.s].espera));
      for (const b of cmbaVivos(O).filter(cmbaTirador)) {
        const hm = HM.get(b),
          k = r === 1 ? 2 : 1,
          contraMuro = b.t === "cat" && fort && !brecha;
        b.ammo = Math.max(0, b.ammo - k);
        if (contraMuro || (b.t === "tor" && !fort)) continue;
        let v =
          b.n *
          b.st.pr *
          hm.pr *
          CMBA_K.dis *
          k *
          O.suerte *
          O.g *
          O.bono *
          cmbaFatM(b) *
          cmbaRnd() *
          (r >= 2 && !hm.parto ? 0.6 : 1) *
          (env.clima === "lluvia" && b.t !== "h" ? 0.65 : 1) *
          (env.clima === "niebla" ? 0.7 : 1) *
          (O.def ? 1 + terr.colina * 0.4 : 1) *
          (terr.bosque > 0.3 ? 0.75 : 1) *
          (b.cl === "asd" && !fort ? 0.4 : 1);
        cmbAlza(fx, s, "mando", (v * (O.g - 1)) / O.g);
        cmbAlza(fx, s, "bono", (v * (O.bono - 1)) / O.bono);
        if (O.def && terr.colina)
          cmbAlza(fx, s, "terreno", (v * terr.colina * 0.4) / (1 + terr.colina * 0.4));
        for (const [tg, w] of cmbObjetivo(b, ene, frente, fort, facDe(s))) {
          if (!w) continue;
          const tm = HM.get(tg),
            esc =
              hm.fuego || b.t === "cat"
                ? 0
                : Math.min(0.95, (tg.st.es + tm.es) * (1 - L[tg.s].flank * 0.5) * (b.t === "h" ? 0.5 : 1)),
            arm = hm.fuego ? 1 : 10 / (10 + (tg.st.ar + tm.ar) * (b.t === "bal" ? 0.8 : 1.5)),
            mur = murDis(tg),
            x = v * w;
          golpe(tg, x * (1 - esc) * arm * mur, s);
          if (hm.veneno) veneno.add(tg);
          const dn = (x * (1 - esc) * arm * mur) / tg.st.vi;
          cmbAlza(fx, tg.s, "armadura", (x * (1 - (1 - esc) * arm)) / tg.st.vi);
          if (mur < 1) cmbAlza(fx, tg.s, "murallas", (x * (1 - esc) * arm * (1 - mur)) / tg.st.vi);
          for (const h of b.hab)
            if (h.t > 0 && CMB_HAB[h.id].act.pr) cmbAlza(fx, s, "hab:" + h.id, dn * (1 - 1 / hm.pr));
          if (hm.fuego) cmbAlza(fx, s, "hab:fuegoGriego", dn * 0.5);
          proy[s] += dn;
        }
      }
      cmbAlza(fx, s, "proyectiles", proy[s]);
    }
    /* cuerpo a cuerpo desde la segunda ronda: choque con cargas, luego melé */
    if (r >= 2)
      for (const O of L) {
        const s = O.s,
          ene = eneDe(s);
        if (!enJuego(O) || O.espera || !ene.length) continue;
        const enFr = ene.filter((e) => !L[e.s].espera),
          frente = cmbaSuma(enFr.filter(cmbaCuerpo)),
          at = cmbaVivos(O).filter(
            (b) => cmbaCuerpo(b) || (b.cl !== "asd" && b.ammo <= 0 && (frente < 1 || r > 4)),
          ),
          ancho =
            clamp(
              (Math.max(frente, cmbaSuma(enFr.filter((e) => e.cl !== "asd"))) * 1.1) /
                Math.max(1, cmbaSuma(at)),
              0.35,
              1,
            ) * (O.def && fort ? 1 - 0.08 * (flancos - 1) : 1),
          entra = O.entra === r;
        for (const b of at) {
          const hm = HM.get(b),
            recarga = b.cl === "cab" && r > 2 && r % 3 === 2,
            choque = r === 2 || recarga || hm.carga > 1 || entra,
            vado = terr.rio && bandoDef != null && !O.def && r === 2 ? 0.75 : 1,
            bosC = b.cl === "cab" ? 1 - 0.35 * terr.bosque : 1,
            atasco = b.cl === "cab" && !choque ? 0.85 : 1,
            eEsp = L.find((X, i) => hostil(s, i) && espanto[i]),
            asusta = UN[b.t].caballo && eEsp ? 0.8 : 1;
          if (asusta < 1) {
            cmbAlza(fx, eEsp.s, "espanto", b.n * 0.03);
            susto.set(b, (susto.get(b) || 0) + 3);
          }
          let base =
            b.n *
            ancho *
            b.st.me *
            hm.me *
            O.g *
            O.bono *
            cmbaFatM(b) *
            (b.mor < b.mx * 0.3 ? 0.8 : 1) *
            CMBA_K.mel *
            O.suerte *
            cmbaRnd() *
            vado *
            bosC *
            atasco *
            asusta *
            (bandoDef == null ? 1 : !O.def ? 1 - 0.25 * terr.colina : 1 + 0.1 * terr.colina);
          if (bandoDef != null && !O.def && (vado < 1 || terr.colina))
            cmbAlza(fx, dIdx, "terreno", (base * (1 - vado * (1 - 0.25 * terr.colina))) / 10);
          cmbAlza(fx, s, "mando", (base * (O.g - 1)) / O.g / 10);
          cmbAlza(fx, s, "bono", (base * (O.bono - 1)) / O.bono / 10);
          cmbAlza(fx, s, "veterania", (base * (b.st.xp / 500)) / (1 + b.st.xp / 500) / 10);
          for (const h of b.hab)
            if (h.t > 0 && CMB_HAB[h.id].act.me > 1)
              cmbAlza(fx, s, "hab:" + h.id, (base * (1 - 1 / hm.me)) / 10);
          for (const [tg, w] of cmbObjetivo(b, ene, frente, fort, facDe(s))) {
            if (!w) continue;
            const tm = HM.get(tg),
              E = L[tg.s];
            let cg =
              choque && b.st.ca
                ? (1 + b.st.ca * 0.11 * (recarga && b.t !== "x" ? 0.5 : 1) * (terr.bosque > 0.3 ? 0.4 : 1)) *
                  hm.carga
                : 1;
            if (cg > 1 && (UN[tg.t].rol === "l" || tm.antiCarga) && E.flank < 0.3) {
              const c2 = 1 + (cg - 1) * 0.2;
              cmbAlza(
                fx,
                tg.s,
                tm.antiCarga ? "hab:muroEscudos" : "lanceros",
                (base * w * (cg - c2)) / tg.st.vi,
              );
              if (b.cl === "cab" && r === 2 && !b.dLan) {
                b.dLan = 1;
                di(3, `Los ${cmbaNom(tg)} clavan las lanzas: la carga de los ${cmbaNom(b)} se estrella.`);
              }
              cg = c2;
            } else if (cg > 1.5 && !b.dCar) {
              b.dCar = 1;
              di(2, `Los ${cmbaNom(b)} cargan contra los ${cmbaNom(tg)}.`);
            }
            const fat = Math.max(0.6, 1 - tg.fat / 300),
              def = 12 / (12 + tg.st.de * tm.de * fat),
              arm = 10 / (10 + (tg.st.ar + tm.ar) * 1.2),
              fl = 1 + 0.5 * E.flank,
              mur = murMel(tg),
              x = base * w * MULT[b.t][tg.t] * cg * def * arm * fl * mur;
            golpe(tg, x, s);
            if (hm.veneno) veneno.add(tg);
            /* el choque de una carga sacude la moral aunque cause pocas bajas */
            if (cg > 1.2)
              susto.set(tg, (susto.get(tg) || 0) + (cg - 1) * 22 * w * Math.min(1, b.n / Math.max(1, tg.n)));
            const down = x / tg.st.vi;
            cmbAlza(fx, s, "carga", down * (1 - 1 / cg));
            cmbAlza(fx, s, "flanqueo", (down * (E.fc || 0) * 0.5) / fl);
            cmbAlza(fx, s, "numero", (down * (E.fn || 0) * 0.5) / fl);
            cmbAlza(fx, tg.s, "armadura", (down * (1 - arm)) / arm);
            cmbAlza(fx, s, "fatiga", down * (1 / fat - 1));
            if (tm.de > 1)
              for (const h of tg.hab) if (h.t > 0) cmbAlza(fx, tg.s, "hab:" + h.id, down * (tm.de - 1));
            if (mur < 1) cmbAlza(fx, tg.s, "murallas", (down * (1 - mur)) / mur);
          }
        }
      }
    /* los fugitivos que aún no han salido del campo son acosados */
    for (const O of L) {
      if (!enJuego(O)) continue;
      const cabE = eneDe(O.s).some((b) => b.cl === "cab" && !L[b.s].espera);
      for (const b of O.bl) if (b.rout && b.n > 0.5) golpe(b, b.n * b.st.vi * 0.05 * (cabE ? 1.5 : 0.5));
    }
    /* bestias desbocadas: con la moral rota, los elefantes pisotean a los suyos */
    for (const O of L)
      for (const b of enJuego(O) ? cmbaVivos(O) : [])
        if (UN[b.t].rol === "ele" && b.mor < b.mx * 0.3 && R() < 0.35) {
          b.rout = true;
          const v = cmbaVivos(O).filter((o) => o !== b),
            o = v[Math.floor(R() * v.length)];
          if (o) {
            const x = b.n * b.st.me * 0.6 * cmbaRnd();
            golpe(o, x);
            o.mor -= 12;
            split(O.s, "desbocados", x / o.st.vi + 5);
          }
          di(4, `¡Los ${cmbaNom(b)} se desbocan y pisotean a los suyos!`);
        }
    /* aplicar caídos: muertos y heridos */
    const caidos = L.map(() => 0);
    for (const [tg, v] of dano) {
      const d = Math.min(tg.n, v / tg.st.vi),
        mf = tg.rout ? 0.75 : veneno.has(tg) ? 0.6 : 0.3;
      tg.n -= d;
      tg.dead += d * mf;
      tg.her += d * (1 - mf);
      tg.perd += d;
      caidos[tg.s] += d;
    }
    for (const X of L) X.amenaza = X.amenazaN;
    /* general en peligro */
    for (const O of L) {
      const s = O.s,
        n = cmbaSuma(O.bl);
      if (!enJuego(O) || !O.gOk || r < 2 || !n || O.espera) continue;
      if (R() < 0.012 + (caidos[s] / n) * 0.45) {
        const muere = R() < 0.35,
          gc = G.C[O.gen];
        O.gOk = false;
        O.g = 1;
        gen[s] = muere ? "muerto" : "herido";
        for (const b of O.bl) b.mor -= muere ? 18 : 12;
        split(s, "general", O.n0 * 0.08);
        di(
          5,
          muere
            ? `${gc.n} muere en la refriega; sus hombres titubean.`
            : `${gc.n} cae herido y es retirado del frente.`,
        );
      }
    }
    /* moral, cansancio, desbandada y reagrupamiento */
    const roto0 = [];
    for (const O of L) {
      if (!enJuego(O)) continue;
      const s = O.s,
        nAll = cmbaSuma(O.bl.filter((b) => b.cl !== "asd")),
        cabE = eneDe(s).some((b) => b.cl === "cab");
      for (const b of O.bl) {
        if (b.n <= 0.5) continue;
        const dis = 1 - b.st.di * 0.05,
          hm = HM.get(b);
        if (b.rout) {
          b.fat = Math.min(100, b.fat + 4);
          if (
            b.n > b.n0 * 0.25 &&
            !O.roto &&
            UN[b.t].rol !== "ele" &&
            R() < (b.st.di / 30) * (cabE ? 0.5 : 1) * (O.gOk ? 1.3 : 1)
          ) {
            b.rout = false;
            b.mor = b.mx * 0.3;
            di(3, `Los ${cmbaNom(b)} se reagrupan y vuelven a la lucha.`);
          }
          continue;
        }
        let dm = (b.perd / b.n0) * CMBA_K.mor * dis + (susto.get(b) || 0) * dis;
        if (r >= 2 && cmbaCuerpo(b) && !O.espera) dm += 2.5;
        if (b.fat > 60) dm += (b.fat - 60) * 0.08;
        dm += 10 * O.flank * (b.cl === "dis" ? 1.3 : 1);
        if (nAll < O.nl0 * 0.7) dm += 3;
        dm += O.cont * dis;
        if (O.gOk) dm -= O.ma * 0.35 + O.lv * 0.2;
        b.mor = Math.min(b.mx, b.mor - dm * (0.8 + R() * 0.4));
        cmbHabMoral(b, hm);
        const pel = r >= 2 && !O.espera && (cmbaCuerpo(b) || b.ammo <= 0),
          calor = UN[b.t].calor ? 1 : calorClima;
        b.fat = Math.min(
          100,
          Math.max(
            0,
            b.fat +
              (pel ? 9 : cmbaTirador(b) && !O.espera ? 3 : -3) * b.st.fa * hm.fat * calor +
              (r === 2 && b.cl === "cab" && !O.espera ? 4 : 0),
          ),
        );
        if (b.mor <= 0) {
          b.rout = true;
          b.mor = 0;
          roto0.push(b);
          di(4, `¡Los ${cmbaNom(b)} rompen filas y huyen!`);
        } else if (b.mor < b.mx * 0.35 && !b.vac && b.cl !== "asd") {
          b.vac = 1;
          di(2, `Los ${cmbaNom(b)} vacilan.`);
        }
        if (b.fat > 75 && !b.dFat) {
          b.dFat = 1;
          di(1, `Los ${cmbaNom(b)} están exhaustos.`);
        }
      }
    }
    /* contagio: las fugas propias pesan del todo; las de un aliado, a medias */
    for (const O of L) {
      const nAll = Math.max(1, cmbaSuma(O.bl.filter((b) => b.cl !== "asd"))),
        propios = roto0.filter((b) => b.s === O.s).reduce((a, b) => a + b.n, 0),
        aliados = roto0.filter((b) => b.s !== O.s && L[b.s].bando === O.bando).reduce((a, b) => a + b.n, 0);
      O.cont = ((propios + aliados * 0.5) / nAll) * 30;
    }
    /* el oportunista entra cuando los demás flaquean, si le atacan o con el paso de las horas */
    for (const O of L)
      if (O.espera && enJuego(O)) {
        const otros = L.filter((X) => enJuego(X) && X.bando !== O.bando && !X.espera),
          mor = otros.length
            ? otros.reduce((a, X) => a + cmbaVivos(X).reduce((c, b) => c + b.n * (b.mor / b.mx), 0), 0) /
              Math.max(
                1,
                otros.reduce((a, X) => a + cmbaSuma(cmbaVivos(X)), 0),
              )
            : 0;
        if (r >= 3 || mor < 0.8 || caidos[O.s] > O.n0 * 0.02 || otros.length < 1) {
          O.espera = false;
          O.entra = r + 1;
          di(4, `Las tropas de ${CIV[O.f].s} caen sobre los combatientes ya desgastados.`);
        }
      }
    /* habilidades: pasa el tiempo (10 s por ronda); curva de cada bloque para el informe y las pruebas */
    for (const X of L)
      for (const b of X.bl) {
        cmbHabTick(b, 10, B);
        if (b.hab.length && !est)
          (curva[b.t + X.s] = curva[b.t + X.s] || []).push(Math.round(b.st.me * cmbHabMod(b).me * 10) / 10);
      }
    /* ¿se desmorona algún ejército? (las máquinas no sostienen la línea) */
    for (const O of L) {
      if (!enJuego(O)) continue;
      const v = cmbaVivos(O).filter((b) => b.cl !== "asd"),
        nv = cmbaSuma(v),
        nt = cmbaSuma(O.bl.filter((b) => b.cl !== "asd"));
      if (nt < 1 || nv < nt * 0.3 || nv < O.nl0 * 0.12 || (!v.some(cmbaCuerpo) && nv < nt * 0.6))
        O.roto = true;
    }
    let fase = r === 1 ? (fort ? "Asalto" : "Escaramuza") : r === 2 ? "Choque" : "Melé";
    let nuevos = L.filter((X) => enJuego(X) && X.roto);
    if (nuevos.length) {
      /* si caen todos a la vez, aguanta el que conserve más hombres en pie */
      if (!L.some((X) => enJuego(X) && !X.roto)) {
        const W = nuevos.sort(
          (a, b) =>
            cmbaSuma(cmbaVivos(b)) / b.n0 - cmbaSuma(cmbaVivos(a)) / a.n0 ||
            (b.def ? 1 : 0) - (a.def ? 1 : 0),
        )[0];
        for (const X of L) if (X.bando === W.bando) X.roto = false;
        nuevos = L.filter((X) => enJuego(X) && X.roto);
      }
      /* persecución: la hacen los enemigos que siguen en pie */
      for (const Lo of nuevos) {
        const Ws = L.filter((X, i) => enJuego(X) && !X.roto && hostil(Lo.s, i)),
          P = Ws.flatMap(cmbaVivos).reduce((a, b) => a + b.n * cmbPers(b.t) * (1 - b.fat / 200), 0),
          N = cmbaSuma(Lo.bl);
        let k =
          Math.max(N * 0.08, Math.min(N * 0.7, P * CMBA_K.pers * cmbaRnd())) *
          (terr.bosque > 0.3 ? 0.6 : 1) *
          (r >= env.rmax ? 0.6 : 1);
        k = Math.min(k, N);
        const pesos = Lo.bl.map((b) => b.n * (b.cl === "cab" ? 0.45 : b.cl === "asd" ? 1.5 : 1)),
          sp = pesos.reduce((a, b) => a + b, 0) || 1;
        Lo.bl.forEach((b, i) => {
          const d = Math.min(b.n, (k * pesos[i]) / sp);
          b.n -= d;
          b.dead += d * 0.75;
          b.her += d * 0.25;
          b.rout = true;
          caidos[b.s] += d;
        });
        const Pt = Ws.map((X) => cmbaVivos(X).reduce((a, b) => a + b.n * cmbPers(b.t), 0)),
          Pp = Pt.reduce((a, b) => a + b, 0) || 1;
        Ws.forEach((X, i) => cmbAlza(fx, X.s, "persecucion", (k * Pt[i]) / Pp));
        const pc = Ws.flatMap(cmbaVivos)
          .filter((b) => b.cl === "cab")
          .sort((a, b) => b.n * cmbPers(b.t) - a.n * cmbPers(a.t))[0];
        di(
          6,
          `Desbandada en las filas de ${CIV[Lo.f].s}: ${pc ? "los " + cmbaNom(pc) : "el enemigo"} persigue${pc ? "n" : ""} a los fugitivos; caen ${cmbH(k)}.`,
        );
        Lo.fuera = true;
        Lo.rompe = true;
      }
      fase = "Desbandada";
      const bs = bandosEnJuego();
      if (bs.length <= 1) {
        gana = bs.length ? bs[0] : nuevos[0].bando;
        fin = "rotura";
      }
    } else if (r >= env.rmax) {
      const bs = bandosEnJuego(),
        ratio = (bd) => {
          const X = L.filter((x) => enJuego(x) && x.bando === bd),
            n0 = X.reduce((a, x) => a + x.n0, 0);
          return n0 ? X.reduce((a, x) => a + cmbaSuma(cmbaVivos(x)), 0) / n0 : 0;
        };
      gana = bandoDef != null && bs.includes(bandoDef) ? bandoDef : bs.sort((a, b) => ratio(b) - ratio(a))[0];
      fin = "noche";
      fase = "Anochecer";
      const at = L.filter((X) => enJuego(X) && X.bando !== gana);
      di(
        6,
        `Cae la noche: las tropas de ${at.map((X) => CIV[X.f].s).join(" y ")} no logran romper al enemigo y se retiran.`,
      );
    }
    if (!est) {
      ev.sort((a, b) => b[0] - a[0]);
      const avg = (O) => {
          const v = cmbaVivos(O).filter((b) => b.cl !== "asd"),
            n = cmbaSuma(v);
          return n ? (v.reduce((a, b) => a + b.n * (b.mor / b.mx), 0) / n) * 100 : 0;
        },
        pr = proy.reduce((a, b) => a + b, 0),
        gen0 =
          r === 1
            ? pr > 1
              ? `${fort ? "Asalto a la muralla" : "Escaramuzas"}: ${cmbH(pr)} caen bajo flechas y piedras.`
              : "Las vanguardias se tantean."
            : r === 2
              ? "Las líneas chocan."
              : L.some((O) => cmbaVivos(O).some((b) => b.fat > 55))
                ? "La melé se prolonga; el cansancio pesa."
                : "Se combate cuerpo a cuerpo.";
      ron.push({
        r,
        f: fase,
        t: ev.length
          ? ev[0][1] + (ev[1] && ev[1][0] >= 3 && ev[1][1].length < 80 ? " " + ev[1][1] : "")
          : gen0,
        b: caidos.map(Math.round),
        m: L.map(avg),
      });
    }
  }
  /* heridos: una parte vuelve a filas tras la batalla */
  const rec = L.map((X) => (X.bando === gana ? 0.6 : X.rompe ? 0.25 : fin === "noche" ? 0.45 : 0.25)),
    out = L.map(() => cmbVacio()),
    her = L.map(() => 0),
    mer = L.map(() => 0),
    bajas = L.map(() => ({ m: 0, h: 0, r: 0 }));
  for (const X of L) {
    const s = X.s,
      sv = {};
    for (const b of X.bl) {
      const vu = b.her * rec[s];
      sv[b.t] = (sv[b.t] || 0) + b.n + vu;
      bajas[s].m += b.dead + b.her - vu;
      bajas[s].h += b.her;
      bajas[s].r += vu;
    }
    const mm = ctx.merma && ejs[s] && ejs[s].mer !== undefined;
    for (const t in sv) {
      const x = sv[t] / SPU;
      if (mm) {
        const c = Math.ceil(x - 1e-6);
        out[s][t] = c;
        mer[s] += Math.max(0, c * SPU - sv[t]);
      } else out[s][t] = Math.floor(x) + (R() < x % 1 ? 1 : 0);
    }
    mer[s] = mm ? Math.round(mer[s]) : undefined;
    her[s] = Math.round(bajas[s].r);
    for (const t in X.maq || {}) out[s][t] = (out[s][t] || 0) + (X.bando === gana ? X.maq[t] : 0);
  }
  let informe = null;
  if (!est)
    informe = {
      f: L.map((X) => X.f),
      bandos: L.map((X) => X.bando),
      gana,
      fin,
      rondas: ron,
      factores: cmbFactores(fx, gana, L),
      bajas,
      gen,
      gens: L.map((X) => X.gen),
      n0: L.map((X) => X.n0),
      clima: env.clima,
      hora: env.hora,
      terreno: CMBA_TERR[env.terr.tag] || env.terr.tag,
      fort,
      def: dIdx,
      brecha,
      flancos,
      asedio: ctx.asedio || 0,
      lugar: ctx.nombreLugar || (ctx.p && ctx.p.name) || "",
      anio: G.year,
      modo: "auto",
      curva,
    };
  const res = {
    gana,
    ejs: L.map((X, i) => ({
      id: ejs[i].id,
      f: X.f,
      bando: X.bando,
      gana: X.bando === gana,
      A: out[i],
      u: out[i],
      heridos: her[i],
      her: her[i],
      mer: mer[i],
      bajas: bajas[i],
      gen: gen[i],
      llego: !(llega[i] > r),
    })),
    informe,
    gen,
    brecha,
  };
  if (!est && ctx.emitir && !ctx.sinEvento) cmbEmitirMulti(ejs, res, ctx, "auto");
  res.todos = ejs;
  return res;
}
/* 'batallaResuelta' de una batalla de varios ejércitos: atacante/defensor = los principales (el primer
   ejército y el primero de otro bando, o el que defiende); ejs y bandos con todos */
function cmbEmitirMulti(ejs, res, ctx, modo) {
  const N = ejs.length,
    bnd = (i) => ejs[i].bando ?? i,
    a = 0,
    d = cmbDefIdx(ejs, ctx) ?? [...Array(N).keys()].find((i) => bnd(i) !== bnd(a)) ?? 1,
    inf = res.informe;
  if (inf) cmbGuardarInf(inf);
  OC.emitirSync("batallaResuelta", {
    p: ctx.p || null,
    atacante: ejs[a].f,
    defensor: ejs[d].f,
    gana: res.gana === bnd(a),
    A: res.ejs[a].A,
    D: res.ejs[d].A,
    s0: ejs[a].u,
    d0: ejs[d].u,
    gA: ejs[a].gen ?? null,
    gD: ejs[d].gen ?? null,
    bajas: inf ? [inf.bajas[a], inf.bajas[d]] : null,
    heridos: { A: res.ejs[a].heridos, D: res.ejs[d].heridos },
    factores: inf ? inf.factores.map((x) => x.k) : [],
    rondas: inf ? inf.rondas.length : 0,
    general: [res.gen[a], res.gen[d]],
    modo,
    informe: inf,
    multi: true,
    bandos: ejs.map((e, i) => bnd(i)),
    ganaBando: res.gana,
    ejs: ejs.map((e, i) => ({
      f: e.f,
      bando: bnd(i),
      gen: e.gen ?? null,
      u0: e.u,
      A: res.ejs[i].A,
      gana: res.ejs[i].gana,
      heridos: res.ejs[i].heridos,
      bajas: res.ejs[i].bajas,
      general: res.gen[i],
    })),
  });
}
/* factores decisivos: los tres que más bajas causaron (o evitaron) al ganador y uno del perdedor.
   fx[s][clave] = soldados equivalentes; L[s] = {f, gen, n0} */
function cmbFactores(fx, gana, L) {
  const tx = [],
    lim = Math.max(2, L.reduce((a, X) => a + X.n0, 0) * 0.012),
    nom = (k, s) =>
      k === "mando" && L[s].gen != null && G.C[L[s].gen]
        ? "el mando de " + G.C[L[s].gen].n
        : cmbaFxTxt(k).toLowerCase();
  for (const ganador of [true, false]) {
    const l = L.filter((X) => (X.bando === gana) === ganador)
      .flatMap((X) => Object.entries(fx[X.s]).map(([k, v]) => [k, v, X.s]))
      .filter(([k, v]) => v > lim && cmbaFxTxt(k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, ganador ? 3 : 1);
    for (const [k, , s] of l)
      tx.push({
        k,
        s,
        txt: `${ganador ? "" : "Pese a la derrota: "}${nom(k, s)} (${CIV[L[s].f].s})`.replace(/^./, (c) =>
          c.toUpperCase(),
        ),
      });
  }
  return tx;
}
/* compatibilidad: firma antigua de la resolución automática */
function autoBattle(fa, fd, A, D, fort, gA, gD, o = {}) {
  const r = cmbResolverAuto(
    { f: fa, u: A, gen: gA, vet: o.xpA, fat: o.fatA },
    { f: fd, u: D, gen: gD, vet: o.xpD },
    { fort, p: o.p, est: o.est, terreno: o.terreno, nombreLugar: o.p && o.p.name },
  );
  return { win: r.gana === 0, A: r.A, D: r.D, inf: r.informe, gen: r.gen };
}
/* pronóstico: simula n veces (lo usan la IA y el aviso antes de la batalla) */
function cmbEstimar(ejA, ejD, ctx, n = 8) {
  let w = 0;
  for (let k = 0; k < n; k++) if (cmbResolverAuto(ejA, ejD, { ...ctx, est: true }).gana === 0) w++;
  return w / n;
}
/* ==================== fin del motor automático ==================== */

/* ==================== BATALLA TÁCTICA ==================== */
/* campo de batalla: 80×50 casillas (antes 40×24): marchas largas hasta el choque y sitio para rodear una
   plaza amurallada en el centro */
const BW = 80,
  BH = 50,
  TS = 20,
  bc = $("bmap"),
  bcx = bc.getContext("2d");
bc.width = BW * TS;
bc.height = BH * TS;
const SPU = 10,
  PH = 3,
  CD = 1.05,
  CMB_KT = 0.055;
const cmbCab = (t) => UN[t].cl === "cab";
/* figuras que se dibujan: una por soldado; una máquina por cada 10 sirvientes; un elefante por cada 3 */
const cmbFig = (u, n = u.n) =>
    u.cs.cl === "asd" ? Math.ceil(n / SPU) : UN[u.t].rol === "ele" ? Math.ceil(n / 3) : n,
  cmbPaso = (u) =>
    u.cs.cl === "asd" ? [12, 9] : UN[u.t].rol === "ele" ? [10, 7] : cmbCab(u.t) ? [6, 4] : [4, 3];
const fcols = (u) =>
    u.cs.cl === "asd"
      ? Math.max(1, cmbFig(u, u.n0))
      : Math.min(
          10,
          Math.max(
            UN[u.t].rol === "ele" ? 2 : 4,
            Math.ceil(Math.sqrt(cmbFig(u, u.n0) * (cmbCab(u.t) ? 1.2 : 2.2))),
          ),
        ),
  rad = (u) => Math.max(0.55, (fcols(u) * cmbPaso(u)[0]) / 2 / TS),
  crd = (a, b) => rad(a) + rad(b) - 0.1;
const MODES = { t3: "Por turnos · 3 acciones", t1: "Por turnos · 1 acción", rt: "Tiempo real" };
const STN = { agr: "Agresiva", def: "Defensiva" };
const cmbPies = (a, b) => [
  [...a, ".f.f..", ".k.k.."],
  [...a, "f...f.", "k...k."],
];
const cmbPatas = (a, c) => [
  [...a, `.${c}.${c}.${c}.${c}.`, ".k.k.k.k."],
  [...a, `${c}..${c}..${c}.${c}`, "k..k..k.k"],
];
const MS = {
  l: cmbPies(["..h..t", ".hhh.p", "..b..p", "rrffbp", "rrff.p", "rrff.."]),
  i: cmbPies(["..h..t", ".hhh.p", "..b..p", ".fffbp", "bfff.p", ".fff.."]),
  p: [
    ["..r...", ".hhh.t", "..b..h", "rhhhbh", "rhfh.h", "rhhh..", ".h.h..", ".k.k.."],
    ["..r...", ".hhh.t", "..b..h", "rhhhbh", "rhfh.h", "rhhh..", "h...h.", "k...k."],
  ],
  h: cmbPies(["..p..t", ".pbp.p", "..b.p.", ".fffb.", "bfff..", ".fff.."]),
  a: cmbPies(["..h...", ".hhh.n", "..b..n", ".fffbn", "bfff.n", ".fff.n"]),
  x: cmbPatas(["......t..", "..pp.p...", "...b.p...", "..fffb.w.", "..fffwwww", "wwwwwwww."], "w"),
  c: cmbPatas(["...h.....", "..hhh....", "...b.....", "..fff..n.", "..fffnnnn", "nnnnnnnn."], "n"),
  k: cmbPatas(["...h....t", "..hhh..p.", "...h..p..", "..hhhp.h.", "..hhhhhhh", "rrrrrrrh."], "h"),
  m: cmbPatas(["...h..n..", "..hhh..n.", "...b...n.", "..fffbn..", "..fff.nnn", "nnnnnnnn."], "n"),
};
/* decorado del campo de batalla (catálogo de sprites: MS.bat_<nombre>.0; F = color del pueblo) */
Object.assign(MS, {
  bat_arbol: [
    [
      "...gGg...",
      "..gGGGg..",
      ".gGGgGGg.",
      "gGGgggGGg",
      "gGgggggGg",
      ".ggggggg.",
      "..ggggg..",
      "....p....",
      "....p....",
      "...ppp...",
    ],
  ],
  bat_pino: [
    ["...G...", "..gGg..", "..gGg..", ".gGGGg.", ".ggGgg.", "gggGggg", "ggggggg", "...p...", "..ppp.."],
  ],
  bat_arbusto: [[".gGg.", "gGggg", ".ggg."]],
  bat_roca: [[".hhh.", "hwhhh", "hhhss"]],
  bat_estandarte: [["k.FFF", "kkFFF", "k.FF.", "k....", "k....", "kkk.."]],
  bat_torre: [
    [
      "skskskskskss",
      "wwwwwwwwwwws",
      "wsswwwwwssws",
      "wwwwwwwwwwws",
      "wwwwwkkwwwws",
      "wwwwkkkkwwws",
      "wwwwkkkkwwws",
      "sssssssssss.",
    ],
  ],
});
/* sprites de batalla de las clases nuevas: las únicas usan el de su clase base; bestias y máquinas, el suyo */
for (const t of TYP)
  if (!MS[t]) MS[t] = UN[t].rol !== t && MS[UN[t].rol] && t !== "car" ? MS[UN[t].rol] : [SP[t], SP[t]];
function sprF(c, rows, x, y, pal, fl) {
  const w = rows[0].length;
  rows.forEach((row, j) => {
    for (let i = 0; i < w; i++) {
      const k = row[i];
      if (k === "." || !k) continue;
      c.fillStyle = pal[k];
      c.fillRect(x + (fl ? w - 1 - i : i), y + j, 1, 1);
    }
  });
}
/* terreno: 0 llano, 1 bosque, 2 colina, 3 río, 4 vado */
/* pinta el campo (una vez por batalla): hierba con matices, bosques con árboles y sombra, colinas
   sombreadas, río con orillas y vados, y murallas con almenas, puertas y torres */
function paintField(c, terr, fort, rec) {
  const r = mul(ri(1, 1e6)),
    nz = noise(r, 14, 9),
    t0 = (x, y) => (x < 0 || y < 0 || x >= BW || y >= BH ? -1 : terr[y][x]),
    agua = (x, y) => t0(x, y) === 3 || t0(x, y) === 4,
    Q = 4,
    verdes = ["#4b8434", "#548f3a", "#5a983f", "#63a345", "#6aae49"],
    olivas = ["#6c7746", "#76814b", "#7c8850", "#879356", "#949f60"],
    bosq = ["#3a6b2c", "#3f7330", "#457c34", "#4b8434"];
  for (let y = 0; y < BH; y++)
    for (let x = 0; x < BW; x++) {
      const t = t0(x, y),
        X = x * TS,
        Y = y * TS;
      for (let j = 0; j < TS; j += Q)
        for (let i = 0; i < TS; i += Q) {
          const px = (X + i) / (BW * TS),
            py = (Y + j) / (BH * TS),
            v = nz(px * 14, py * 9),
            e = (r() - 0.5) * 0.18;
          let col;
          if (t === 3) col = v + e > 0.55 ? "#336a98" : v + e > 0.4 ? "#2c5f8a" : "#25537a";
          else if (t === 4) col = v + e > 0.5 ? "#8fae86" : "#7f9f7a";
          else if (t === 2) {
            /* colina: luz del noroeste, sombra al sureste */
            const lz = nz(px * 14 - 0.15, py * 9 - 0.15) - nz(px * 14 + 0.15, py * 9 + 0.15);
            col = olivas[clamp(Math.round(2 + lz * 9 + e * 4), 0, 4)];
          } else if (t === 1) col = bosq[clamp(Math.floor((v + e) * 4), 0, 3)];
          else col = verdes[clamp(Math.floor((v + e) * 5), 0, 4)];
          c.fillStyle = col;
          c.fillRect(X + i, Y + j, Q, Q);
        }
      if (t === 0 || t === 2)
        for (let k = 0; k < 6; k++) {
          c.fillStyle = r() < 0.5 ? (t === 2 ? "#a3ab70" : "#7cbd55") : t === 2 ? "#5f6a3e" : "#3f7a2c";
          c.fillRect(X + Math.floor(r() * TS), Y + Math.floor(r() * TS), 1, 2);
        }
      if (t === 0 && r() < 0.18) {
        c.fillStyle = r() < 0.5 ? "#f2e27a" : "#efe9dc";
        c.fillRect(X + Math.floor(r() * 18), Y + Math.floor(r() * 18), 1, 1);
      }
      if (t === 0 && r() < 0.05)
        sprF(c, MS.bat_arbusto[0], X + Math.floor(r() * 14), Y + Math.floor(r() * 16), BP);
      if ((t === 0 || t === 2) && r() < 0.04)
        sprF(c, MS.bat_roca[0], X + Math.floor(r() * 14), Y + Math.floor(r() * 16), BP);
      /* orillas del río */
      if (t === 3)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          if (!agua(x + dx, y + dy) && t0(x + dx, y + dy) >= 0) {
            c.fillStyle = "#8a7a52";
            c.fillRect(X + (dx > 0 ? TS - 3 : 0), Y + (dy > 0 ? TS - 3 : 0), dx ? 3 : TS, dy ? 3 : TS);
            c.fillStyle = "#b9a874";
            c.fillRect(
              X + (dx > 0 ? TS - 4 : dx < 0 ? 3 : 0),
              Y + (dy > 0 ? TS - 4 : dy < 0 ? 3 : 0),
              dx ? 1 : TS,
              dy ? 1 : TS,
            );
          }
      if (t === 3)
        for (let k = 0; k < 3; k++) {
          c.fillStyle = "#5f9cd0";
          c.fillRect(X + 3 + Math.floor(r() * 12), Y + 3 + Math.floor(r() * 14), 3, 1);
        }
      if (t === 4)
        for (let k = 0; k < 4; k++) {
          c.fillStyle = r() < 0.5 ? "#b8b2a2" : "#8d877a";
          c.fillRect(X + 2 + Math.floor(r() * 15), Y + 2 + Math.floor(r() * 15), 2, 2);
        }
    }
  /* árboles encima (con sombra), de arriba abajo para que se solapen bien */
  for (let y = 0; y < BH; y++)
    for (let x = 0; x < BW; x++) {
      const t = t0(x, y),
        X = x * TS,
        Y = y * TS;
      if (t === 1)
        for (let k = 0; k < 3; k++) {
          const ax = X + Math.floor(r() * 12),
            ay = Y + Math.floor(r() * 10),
            sp = r() < 0.35 ? MS.bat_pino[0] : MS.bat_arbol[0];
          c.fillStyle = "rgba(0,0,0,.22)";
          c.fillRect(ax + 2, ay + sp.length - 1, sp[0].length - 1, 2);
          sprF(c, sp, ax, ay, BP);
        }
      if (t === 2 && r() < 0.35)
        spr(c, SP.hill, X + 4 + Math.floor(r() * 8), Y + 6 + Math.floor(r() * 8), BP);
    }
  /* la plaza en el centro: cuatro lienzos con almenas hacia fuera, una puerta en cada uno, torres y la
     ciudad dentro (rec = cmbRecinto; sin rec, p. ej. espejos de versiones antiguas, no hay muralla) */
  if (fort && rec && rec.x0 != null) {
    const M = rec,
      tramo = (l, X, Y, enX) => {
        /* un tramo de una casilla del lienzo l; enX: lienzo vertical (este u oeste) */
        const out = CMB_NOR[l],
          puerta = M.puertas.some((q) => q.l === l && (enX ? Math.abs(q.y * TS - (Y + TS / 2)) <= TS / 2 + 0.5 : Math.abs(q.x * TS - (X + TS / 2)) <= TS / 2 + 0.5));
        if (enX) {
          c.fillStyle = puerta ? "#6b5a3e" : "#1c1a17";
          c.fillRect(X - 6, Y, 12, TS);
          if (puerta) return;
          c.fillStyle = "#b7ad9a";
          c.fillRect(X - 5, Y, 10, TS);
          c.fillStyle = "#857c6b";
          for (let k = 0; k < TS; k += 5) c.fillRect(X - 5, Y + k, 10, 1);
          c.fillStyle = "#d8cfbd";
          for (let k = 0; k < TS; k += 4) c.fillRect(X + (out[0] < 0 ? -7 : 4), Y + k, 3, 2);
        } else {
          c.fillStyle = puerta ? "#6b5a3e" : "#1c1a17";
          c.fillRect(X, Y - 6, TS, 12);
          if (puerta) return;
          c.fillStyle = "#b7ad9a";
          c.fillRect(X, Y - 5, TS, 10);
          c.fillStyle = "#857c6b";
          for (let k = 0; k < TS; k += 5) c.fillRect(X + k, Y - 5, 1, 10);
          c.fillStyle = "#d8cfbd";
          for (let k = 0; k < TS; k += 4) c.fillRect(X + k, Y + (out[1] < 0 ? -7 : 5), 2, 3);
        }
      };
    /* la ciudad dentro: tejados */
    for (let Y = (M.y0 + 1.2) * TS; Y < (M.y1 - 1.6) * TS; Y += 26)
      for (let X = (M.x0 + 1.2) * TS; X < (M.x1 - 1.4) * TS; X += 22) {
        if (r() < 0.45) continue;
        spr(c, r() < 0.12 ? SP.castle : SP.town, Math.round(X + r() * 6), Math.round(Y + r() * 6), PAL[REB] || BP);
      }
    for (let X = M.x0 * TS; X < M.x1 * TS - 1; X += TS) {
      tramo("N", X, M.y0 * TS, false);
      tramo("S", X, M.y1 * TS, false);
    }
    for (let Y = M.y0 * TS; Y < M.y1 * TS - 1; Y += TS) {
      tramo("O", M.x0 * TS, Y, true);
      tramo("E", M.x1 * TS, Y, true);
    }
    for (const t of M.torres) sprF(c, MS.bat_torre[0], Math.round(t.x * TS - 6), Math.round(t.y * TS - 8), BP);
  }
}
function cmbCampo(env, fort, rec) {
  const r = mul(ri(1, 1e9)),
    nz = noise(r, 9, 6),
    terr = [],
    tr = env.terr,
    fb = 0.7 - 0.3 * (tr.bosque || 0),
    fh = 0.18 + 0.3 * (tr.colina || 0);
  for (let y = 0; y < BH; y++) {
    terr.push([]);
    for (let x = 0; x < BW; x++) {
      const v = nz((x / BW) * 14, (y / BH) * 9);
      terr[y].push(x < 6 || x > BW - 7 ? 0 : v > fb ? 1 : v < fh ? 2 : 0);
    }
  }
  if (tr.rio) {
    /* río de norte a sur entre los ejércitos; con plaza, por fuera del recinto */
    const x0 = rec
        ? r() < 0.5
          ? Math.floor(rec.x0 - 6 - r() * 4)
          : Math.ceil(rec.x1 + 5 + r() * 4)
        : Math.round(BW * 0.42) + Math.floor(r() * BW * 0.15),
      vados = [0.12, 0.38, 0.62, 0.86].map((f) => Math.round(BH * f + (r() - 0.5) * 4));
    for (let y = 0; y < BH; y++) {
      const x = clamp(Math.round(x0 + Math.sin(y / 3.5 + x0) * 1.5), 1, BW - 2);
      const t = vados.some((v) => Math.abs(v - y) <= 1) ? 4 : 3;
      terr[y][x] = t;
      if (r() < 0.4) terr[y][x + 1] = t;
    }
  }
  /* la plaza: llano dentro del recinto y una casilla alrededor de la muralla */
  if (rec)
    for (let y = Math.max(0, Math.floor(rec.y0) - 1); y <= Math.min(BH - 1, Math.ceil(rec.y1) + 1); y++)
      for (let x = Math.max(0, Math.floor(rec.x0) - 1); x <= Math.min(BW - 1, Math.ceil(rec.x1) + 1); x++) terr[y][x] = 0;
  return terr;
}
/* compatibilidad con la firma antigua */
function tactical(fa, fd, A, D, fort, gA, gD, place, mode) {
  return cmbTactica(
    { f: fa, u: A, gen: gA },
    { f: fd, u: D, gen: gD },
    { fort, nombreLugar: place },
    mode,
  ).then((r) => ({ win: r.gana === 0, A: r.A, D: r.D, inf: r.informe }));
}
/* Dos ejércitos: el lado 0 del campo es el del jugador (ctx.jugador = 1 si manda ejD). Mismo resultado
   que siempre; no emite 'batallaResuelta' (lo hace quien la llama). */
function cmbTactica(ejA, ejD, ctx = {}, mode = "rt") {
  const map = ctx.jugador === 1 ? [1, 0] : [0, 1],
    def = map.indexOf(1),
    lados = ["O", "E"];
  /* asedio: la plaza está en el centro del campo y el atacante llega por su lado */
  if (ctx.fort) lados[def] = "C";
  return cmbTacticaCore([ejA, ejD], ctx, mode, {
    map,
    bandos: map.slice(),
    def,
    lados,
    mios: [0],
    emitir: false,
  });
}
/* N ejércitos en bandos (ver cmbResolverMulti). ctx.humanos = facciones que se controlan desde este
   cliente (por defecto [ME]); el resto lo lleva la IA (con ctx.dificultad por ejército); ctx.auto = la IA
   manda también los ejércitos humanos. ctx.def = índice del ejército que defiende la plaza.
   Despliegue: el bando del jugador al oeste, los demás al este, norte y sur (el que defiende, al este);
   los aliados de un bando comparten su lado (cada uno en su mitad). Emite 'batallaResuelta' (con ejs y
   bandos) solo con ctx.emitir. Online: ctx.onl.ctrl = ['local'|'remoto'|'ia', ...] por ejército. */
function cmbTacticaMulti(ejs0, ctx = {}, mode = "rt") {
  /* refuerzos: ctx.refuerzos = [{ej, dir, llegada (s de batalla)}]; van detrás de los demás */
  const ejs = ejs0.concat(
      (ctx.refuerzos || []).map((q) => ({ ...q.ej, dir: q.dir ?? q.ej.dir, _llegada: +q.llegada || 30 })),
    ),
    N = ejs.length,
    bnd = ejs.map((e, i) => e.bando ?? i),
    hum = ctx.humanos || (typeof ME !== "undefined" ? [ME] : []),
    mios = [...Array(N).keys()].filter((i) => hum.includes(ejs[i].f)),
    def = cmbDefIdx(ejs, ctx),
    bYo = mios.length ? bnd[mios[0]] : bnd[0],
    dirs = ejs.map((e) => cmbDirL(e.dir)),
    orden = [...new Set([bYo, ...(def != null ? [bnd[def]] : []), ...bnd])],
    LAD = ["O", "E", "N", "S"],
    ladoB = {};
  orden.forEach((b, k) => (ladoB[b] = LAD[k] || "N"));
  /* cada ejército entra por su dirección de procedencia (ej.dir) si la trae; si no, por la de su bando.
     Con murallas, la guarnición está en la plaza, en el centro del campo («C»), y los atacantes la rodean */
  const lados = bnd.map((b, i) => dirs[i] || ladoB[b]);
  if (def != null && fort0(ctx)) lados[def] = "C";
  return cmbTacticaCore(ejs, ctx, mode, {
    map: ejs.map((e, i) => i),
    bandos: bnd,
    def,
    lados,
    mios: mios.length ? mios : [0],
    emitir: !!ctx.emitir && !ctx.sinEvento,
    lleg: ejs.map((e) => +e._llegada || 0),
  });
}
const fort0 = (ctx) => !!(ctx && ctx.fort);
function cmbTacticaCore(ejs0, ctx, mode, op) {
  return new Promise((done) => {
    const env = cmbEntorno(ctx),
      p = ctx.p || null,
      fort = ctx.fort || 0,
      map = op.map,
      ejs = ejs0,
      N = map.length,
      def = op.def,
      lados = op.lados,
      kFl = fort ? cmbFlancos(ctx) : 1,
      /* el recinto mira al primer atacante que llega por un lado */
      frente = lados.find((l, i) => (def == null || op.bandos[i] !== op.bandos[def]) && CMB_NOR[l]) || "O",
      rec = fort && def != null ? cmbRecinto(fort, frente) : null,
      terr = cmbCampo(env, fort, rec),
      units = [],
      gens = [],
      bono = [],
      gbs = [],
      part = lados.map((l, i) => {
        const mis = lados.map((x, j) => j).filter((j) => lados[j] === l);
        return [mis.indexOf(i), mis.length];
      }),
      esDef = (side) => def != null && op.bandos[side] === op.bandos[def];
    let id = 0;
    for (let side = 0; side < N; side++) {
      const ej = ejs[map[side]],
        f = ej.f,
        u = ej.u,
        lado = esDef(side) ? "defensor" : "atacante",
        gc = ej.gen != null && G.C[ej.gen] && G.C[ej.gen].alive !== false ? G.C[ej.gen] : null,
        hambre = ej.hambre != null ? ej.hambre : !!(G.F[f] && G.F[f].food <= 0),
        as = esDef(side) && ctx.asedio ? Math.min(20, ctx.asedio * 4) : 0,
        ts = TYP.reduce((s, t) => s + (u[t] || 0) * SPU, 0),
        size = Math.max(20, Math.min(40, Math.ceil(ts / 14)));
      const lv = gc ? cmbNivelXp(gc.xp) : 0;
      gens.push({ id: gc ? gc.id : null, ok: !!gc, ma: gc ? gc.ma : 0, lv, res: null });
      gbs.push(gc ? 1 + gc.ma * 0.04 + (lv - 1) * 0.015 : 1);
      bono.push(OC.calc("bonoBatalla", 1, { f, lado, p }) || 1);
      const merT = cmbMerTipo(ej);
      for (const t of TYP) {
        let n = (u[t] || 0) * SPU - (merT[t] || 0);
        const cs = cmbStats(f, t, cmbOrigenP(f, t, ej.ori, p), lado, (ej.vet && ej.vet[t]) || 0),
          m =
            cs.mo +
            (gc ? gc.ma * 1.5 + (lv - 1) * 1.5 : 0) +
            (esDef(side) && fort ? 6 + fort * 4 - 4 * (kFl - 1) : 0) -
            (hambre ? 10 : 0) -
            as;
        while (n > 0) {
          const k = Math.min(size, n);
          n -= k;
          units.push({
            id: id++,
            side,
            t,
            f,
            cs,
            n: k,
            n0: k,
            her: 0,
            muertos: 0,
            dmg: 0,
            hpS: cs.vi,
            mor: m,
            morMax: m,
            fat: ej.fat || 0,
            ammo: cs.mu,
            x: -1,
            y: -1,
            rel: Math.random() * 2,
            rout: false,
            gone: false,
            moved: 0,
            charge: 0,
            eng: 0,
            engT: 0,
            flk: 0,
            lleg: (op.lleg && op.lleg[side]) || 0,
            face: lados[side] === "E" || lados[side] === "S" ? -1 : 1,
            ax: lados[side] === "N" || lados[side] === "S" ? "y" : "x",
            plan: [0, 1, 2].map(() => ({
              o: null,
              st:
                cs.cl === "asd"
                  ? fort && !esDef(side)
                    ? "agr"
                    : "def"
                  : cs.al
                    ? "def"
                    : UN[t].rol === "l"
                      ? "def"
                      : "agr",
            })),
          });
          cmbHabIni(units[units.length - 1], f, t);
        }
      }
      /* el general en el campo: una guardia propia (montada si se puede) que se separa del grueso */
      if (gc) {
        const cand = units.filter(
            (o) => o.side === side && o.cs.cl !== "dis" && o.cs.cl !== "asd" && UN[o.t].rol !== "ele",
          ),
          gu =
            cand.filter((o) => UN[o.t].caballo).sort((a, b) => b.cs.me - a.cs.me)[0] ||
            cand.sort((a, b) => b.cs.de + b.cs.me - (a.cs.de + a.cs.me))[0];
        if (gu && gu.n > SPU) {
          gu.n -= SPU;
          gu.n0 -= SPU;
          const g = {
            ...gu,
            id: id++,
            n: SPU,
            n0: SPU,
            cs: { ...gu.cs, me: gu.cs.me * 1.15, di: gu.cs.di + 3, mo: gu.cs.mo + 15 },
            mor: gu.mor + 15,
            morMax: gu.morMax + 15,
            gen: true,
            plan: gu.plan.map((p) => ({ ...p, st: "def" })),
          };
          cmbHabIni(g, f, gu.t, ["grito"]);
          units.push(g);
        } else if (gu) {
          gu.gen = true;
          cmbHabIni(gu, f, gu.t, ["grito"]);
        }
      }
    }
    for (const u of units) {
      const nm = CIV[u.f].un[u.t].toLowerCase(),
        g = G.C[gens[u.side].id];
      u.nm =
        u.gen && g && u.n === SPU
          ? `${UN[u.t].caballo ? "jinetes" : "hombres"} de la guardia de ${g.n}`
          : units.some((o) => o.side !== u.side && o.t === u.t && CIV[o.f].un[o.t] === CIV[u.f].un[u.t])
            ? `${nm} (${CIV[u.f].s})`
            : nm;
    }
    const bg = document.createElement("canvas");
    bg.width = BW * TS;
    bg.height = BH * TS;
    paintField(bg.getContext("2d"), terr, fort, rec);
    /* el campo es el doble de ancho: unos turnos más para llegar al choque */
    const rl = env.rmax + 4,
      lim = { t3: rl, t1: Math.round(rl * 2.5), rt: rl * 25 }[mode];
    BT = {
      bg,
      dead: [],
      fa: ejs[map[0]].f,
      fd: ejs[map[1]].f,
      fort,
      def,
      map,
      ejs,
      N,
      bandos: op.bandos,
      lados,
      part,
      mios: op.mios,
      bandoYo: op.bandos[op.mios[0] ?? 0],
      emitir: !!op.emitir,
      flancos: kFl,
      espera: {},
      env,
      lim,
      place: ctx.nombreLugar || (p && p.name) || "campo abierto",
      ctx,
      terr,
      units,
      mode,
      phase: "deploy",
      turn: 1,
      sel: null,
      slot: 0,
      log: [],
      fx: [],
      tal: units.length ? [...Array(N)].map(() => ({})) : [{}, {}],
      hitos: [],
      ult: [0, 0],
      dichos: {},
      t: 0,
      tH: 0,
      run: false,
      paused: false,
      speed: ctx.velocidad || 1,
      gb: gbs,
      gens,
      muro: rec ? { hp: fort * 100, hp0: fort * 100, ...rec } : null,
      fwdC: rec ? CMB_NOR[rec.frente] : null,
      habT: 0,
      bono,
      auto0: !!ctx.auto,
      init: [...Array(N)].map((_, s) => units.filter((u) => u.side === s).reduce((a, u) => a + u.n, 0)),
      done,
      aiT: 0,
    };
    /* figuras: dos por hombre en infantería y tiradores si el campo no se llena demasiado (rendimiento) */
    const figs = units.reduce((a, u) => a + cmbFig(u, u.n0) * (u.cs.cl === "asd" || cmbCab(u.t) ? 1 : 2), 0);
    BT.dens = figs <= 2400 ? 2 : 1;
    /* ONL: la IA difícil entra con un poco más de moral */
    if (ctx.dificultad)
      for (const u of units)
        if (ctx.dificultad[map[u.side]] === "dificil") {
          u.mor *= 1.06;
          u.morMax *= 1.06;
        }
    BT.lleg = op.lleg || [];
    for (let s = 0; s < N; s++) if (!op.mios.includes(s) && !(BT.lleg[s] > 0)) deploy(s);
    units.filter(mio).forEach((u) => (u.x = -1));
    /* tercero oportunista (IA): con tres bandos o más, el más débil aguarda */
    if (new Set(op.bandos).size >= 3 && ctx.oportunista !== false) {
      const fz = {};
      for (let s = 0; s < N; s++) if (!esDef(s)) fz[op.bandos[s]] = (fz[op.bandos[s]] || 0) + BT.init[s];
      const b =
        ctx.oportunista != null && ctx.oportunista !== true
          ? ctx.oportunista
          : +Object.keys(fz).sort((a, c) => fz[a] - fz[c])[0];
      for (let s = 0; s < N; s++) if (op.bandos[s] === b && !op.mios.includes(s)) BT.espera[s] = true;
    }
    BT.sel = units.find(mio)?.id ?? null;
    BT.sels = BT.sel == null ? [] : [BT.sel];
    BT.atk = false;
    bLog(
      `${env.hora[0].toUpperCase() + env.hora.slice(1)}, ${env.clima} · ${CMBA_TERR[env.terr.tag] || env.terr.tag}${fort ? " · murallas " + fort : ""}${kFl > 1 ? " · asalto por " + kFl + " flancos" : ""}.`,
    );
    if (N > 2)
      bLog(
        `Batalla de ${N} ejércitos: ${[...new Set(op.bandos)]
          .map((b) =>
            ejs
              .filter((e, i) => op.bandos[map.indexOf(i)] === b)
              .map((e) => CIV[e.f].s)
              .join(" y "),
          )
          .join(" contra ")}.`,
      );
    $("battle").classList.add("show");
    music("battle");
    if (ctx.auto) battleAct("go");
    bui();
    /* ONL */ if (ctx.onl) ctx.onl.inicio(BT);
  });
}
const cmbGrp = (t) =>
  UN[t].cl === "asd"
    ? "maq"
    : cmbCab(t)
      ? "cab"
      : UN[t].rol === "h"
        ? "esc"
        : UN[t].cl === "dis"
          ? "arq"
          : "lin";
/* de coordenadas locales (fondo d desde el borde propio, a lo largo a) a las del campo, según el lado */
function cmbLocal(side, d, a) {
  const l = cmbLadoDe(side),
    P = BT.part ? BT.part[side] : [0, 1],
    an = l === "N" || l === "S" ? 6 + (a / BH) * (BW - 12) : a,
    lo = l === "N" || l === "S" ? 6 : 0,
    hi = l === "N" || l === "S" ? BW - 6 : BH,
    a2 = P[1] > 1 ? lo + ((hi - lo) / P[1]) * (P[0] + (an - lo) / (hi - lo)) : an;
  if (l === "E") return { x: BW - d, y: a2 };
  if (l === "N") return { x: a2, y: d * 0.55 };
  if (l === "S") return { x: a2, y: BH - d * 0.55 };
  return { x: d, y: a2 };
}
/* ---------- el adarve: arqueros y honderos sobre la muralla ----------
   Los tiradores a pie del bando que defiende la plaza (no la caballería) pueden estar EN EL ADARVE
   (u.adarve): su posición va sobre la línea de los lienzos y solo se mueven por ella. Suben y bajan SOLO
   POR LAS TORRES: una orden de mover a un punto de la muralla lleva primero al pie de la torre más
   cercana (dentro del recinto) y de ahí al adarve; una orden a un punto fuera de la muralla los lleva por el
   adarve hasta la torre más cercana a ese punto, bajan y siguen. Arriba: +25 % de alcance y de daño de sus
   proyectiles, −30 % de los que reciben y la protección de la muralla; desde el suelo solo los alcanzan en
   cuerpo a cuerpo quienes suben por escalas (u.escala) o junto a una torre de asedio propia.
   Las torres de la muralla disparan por su cuenta (CMB_TORRE_N hombres, alcance CMB_TORRE_AL). */
const CMB_SOBRE = 0.55, // a menos de esto de la línea del lienzo: sobre la muralla
  CMB_TORRE_N = 4,
  CMB_TORRE_AL = 7;
const cmbPuedeSubir = (u) => {
  const M = BT.muro;
  /* un campamento es una empalizada: sin adarve */
  return !!(M && M.x0 != null && !M.camp && BT.def != null && cmbBnd(u.side) === cmbBnd(BT.def) && u.cs.cl === "dis" && u.cs.al > 0 && !cmbCab(u.t));
};
const cmbSobreMuro = (M, p) => cmbDistMuro(M, p) < CMB_SOBRE;
const cmbTorreCerca = (M, p) => M.torres.reduce((a, t) => (Math.hypot(t.x - p.x, t.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? t : a));
/* pie de una torre, dentro del recinto */
function cmbTorrePie(M, t) {
  const ix = t.x <= M.x0 + 0.01 ? 1 : t.x >= M.x1 - 0.01 ? -1 : 0,
    iy = t.y <= M.y0 + 0.01 ? 1 : t.y >= M.y1 - 0.01 ? -1 : 0;
  return { x: t.x + ix * 0.9, y: t.y + iy * 0.9 };
}
function cmbSubir(u, t) {
  u.adarve = true;
  u.x = t.x;
  u.y = t.y;
  bHito("sub" + u.id, 2, `${uname(u)} suben al adarve por la torre.`, aliado(u) ? "good" : "");
}
function cmbBajar(u, t) {
  const q = cmbTorrePie(BT.muro, t);
  u.adarve = false;
  u.x = q.x;
  u.y = q.y;
}
/* recorrido por el adarve: coordenada a lo largo del perímetro (desde la esquina noroeste, en el sentido de
   las agujas del reloj) y su inversa; un paso hacia un punto del perímetro va por el lado más corto y
   dobla las esquinas */
function cmbPerS(M, p) {
  const w = M.x1 - M.x0,
    h = M.y1 - M.y0,
    q = cmbPuntoMuro(M, p);
  if (q.l === "N") return q.x - M.x0;
  if (q.l === "E") return w + (q.y - M.y0);
  if (q.l === "S") return w + h + (M.x1 - q.x);
  return 2 * w + h + (M.y1 - q.y);
}
function cmbPerP(M, s) {
  const w = M.x1 - M.x0,
    h = M.y1 - M.y0,
    T = 2 * (w + h);
  s = ((s % T) + T) % T;
  if (s < w) return { x: M.x0 + s, y: M.y0 };
  if (s < w + h) return { x: M.x1, y: M.y0 + (s - w) };
  if (s < 2 * w + h) return { x: M.x1 - (s - w - h), y: M.y1 };
  return { x: M.x0, y: M.y1 - (s - 2 * w - h) };
}
function cmbPasoMuro(M, u, G) {
  const T = 2 * (M.x1 - M.x0 + M.y1 - M.y0),
    a = cmbPerS(M, u),
    b = cmbPerS(M, G);
  let d = b - a;
  if (d > T / 2) d -= T;
  if (d < -T / 2) d += T;
  if (Math.abs(d) < 0.05) return { x: G.x, y: G.y };
  return cmbPerP(M, a + Math.sign(d) * Math.min(Math.abs(d), 0.9));
}
/* destino del paso para quien puede usar el adarve (g: el que calculó la orden normal) */
function cmbRutaAdarve(u, P, g) {
  const M = BT.muro;
  if (!M || M.x0 == null) return g;
  const mov = P.o && P.o.tg == null && P.o.x != null ? P.o : null;
  if (u.adarve) {
    /* en desbandada (o si ya no puede estar arriba) baja por la torre más cercana */
    if (u.rout || !cmbPuedeSubir(u)) {
      cmbBajar(u, cmbTorreCerca(M, u));
      return g;
    }
    /* sin munición no pintan nada arriba: bajan por la torre más cercana a pelear */
    if (!tirador(u)) {
      const t = cmbTorreCerca(M, u);
      if (Math.hypot(u.x - t.x, u.y - t.y) < 0.35) {
        cmbBajar(u, t);
        bHito("baj" + u.id, 2, `${uname(u)}, sin proyectiles, bajan del adarve.`, aliado(u) ? "" : "good");
        return g;
      }
      return cmbPasoMuro(M, u, t);
    }
    if (false) {
      cmbBajar(u, cmbTorreCerca(M, u));
      return g;
    }
    if (mov && !cmbSobreMuro(M, mov)) {
      const t = cmbTorreCerca(M, mov);
      if (Math.hypot(u.x - t.x, u.y - t.y) < 0.35) {
        cmbBajar(u, t);
        return { x: mov.x, y: mov.y };
      }
      return cmbPasoMuro(M, u, t);
    }
    if (mov) return cmbPasoMuro(M, u, cmbPuntoMuro(M, mov));
    /* con blanco: a tiro, quietos; fuera de tiro, por el adarve hacia él */
    if (P.o && P.o.tg != null) {
      const t = bU(P.o.tg);
      if (t && fighting(t) && dd(u, t) > alc(u)) return cmbPasoMuro(M, u, cmbPuntoMuro(M, t));
    }
    return null; /* arriba no persiguen por el campo */
  }
  if (!u.rout && mov && cmbPuedeSubir(u) && tirador(u) && cmbSobreMuro(M, mov)) {
    const t = cmbTorreCerca(M, mov),
      pie = cmbTorrePie(M, t);
    if (Math.hypot(u.x - pie.x, u.y - pie.y) < 0.5) {
      cmbSubir(u, t);
      const q = cmbPuntoMuro(M, mov);
      return { x: q.x, y: q.y };
    }
    return { x: pie.x, y: pie.y };
  }
  return g;
}
/* ¿pueden a y b llegar al cuerpo a cuerpo? (uno en el adarve y otro abajo: solo con escalas o torre) */
function cmbToca(a, b) {
  if (!a.adarve === !b.adarve) {
    const M = BT.muro;
    if (a.adarve || !M || M.x0 == null) return true;
    const da = cmbDentro(M, a);
    if (da === cmbDentro(M, b)) return true;
    const fuera = da ? b : a,
      dentro = da ? a : b,
      pt = cmbPuntoMuro(M, fuera);
    return cmbPuedePasar(fuera, pt) || cmbPuedePasar(dentro, pt);
  }
  const s = a.adarve ? b : a,
    M = BT.muro;
  return (
    s.escala > 0 ||
    /* quien ya está dentro de la plaza sube por las escaleras de dentro */
    (!!M && M.x0 != null && cmbDentro(M, s)) ||
    (!!M && BT.units.some((t) => t.t === "tor" && !hostil(t, s) && fighting(t) && cmbDistMuro(M, t) < 1.6 && dd(t, s) < 2.6))
  );
}
/* ---------- la muralla es un obstáculo ----------
   Nadie la atraviesa andando. Se pasa por: las puertas (la guarnición siempre; el atacante cuando la
   muralla ha caído, hp ≤ 0: arietes y catapultas destrozan las puertas), la brecha (con la muralla rota),
   escalas (u.escala > 0: la infantería atacante que pasa CMB_ESCALAR s pegada al lienzo las levanta; trepa
   lenta y débil y bajo las flechas) o junto a una torre de asedio propia apoyada en el lienzo. Tampoco hay
   cuerpo a cuerpo de un lado al otro del lienzo salvo por esos pasos. La IA busca la abertura más cercana. */
const CMB_ESCALAR = 6;
function cmbAberturas(M, u) {
  const L = [];
  if (cmbBnd(u.side) === cmbBnd(BT.def) || M.hp <= 0) for (const q of M.puertas) L.push({ x: q.x, y: q.y, l: q.l, r: 1 });
  if (M.rota && M.brecha) {
    const B = M.brecha,
      c = (B.a + B.b) / 2,
      fija = B.l === "O" ? M.x0 : B.l === "E" ? M.x1 : B.l === "N" ? M.y0 : M.y1;
    L.push(B.l === "N" || B.l === "S" ? { x: c, y: fija, l: B.l, r: (B.b - B.a) / 2 } : { x: fija, y: c, l: B.l, r: (B.b - B.a) / 2 });
  }
  return L;
}
const cmbTorreAsedioJunto = (u) => {
  const M = BT.muro;
  return !!M && BT.units.some((t) => t.t === "tor" && !hostil(t, u) && fighting(t) && cmbDistMuro(M, t) < 1.6 && dd(t, u) < 2.6);
};
/* ¿puede u cruzar el lienzo por el punto p? */
function cmbPuedePasar(u, p) {
  const M = BT.muro;
  /* la empalizada de un campamento protege, pero no es un obstáculo (como antes del recinto central) */
  if (!M || M.x0 == null || M.camp || u.escala > 0 || u.adarve || cmbTorreAsedioJunto(u)) return true;
  return cmbAberturas(M, u).some((o) => Math.hypot(o.x - p.x, o.y - p.y) <= o.r + 0.35);
}
/* destino del paso cuando el objetivo está al otro lado del lienzo: la abertura practicable más cercana */
function cmbRutaPlaza(u, g) {
  const M = BT.muro,
    du = cmbDentro(M, u);
  if (du === cmbDentro(M, g)) return g;
  if (cmbPuedePasar(u, cmbPuntoMuro(M, u))) return g;
  const ab = cmbAberturas(M, u);
  if (!ab.length) return g; /* sin paso: al pie del muro (la infantería atacante escalará) */
  const o = ab.reduce((a, q) => (Math.hypot(q.x - u.x, q.y - u.y) + Math.hypot(q.x - g.x, q.y - g.y) < Math.hypot(a.x - u.x, a.y - u.y) + Math.hypot(a.x - g.x, a.y - g.y) ? q : a)),
    n = CMB_NOR[o.l],
    s = du ? -1 : 1; /* hacia el lado de u */
  if (Math.hypot(o.x - u.x, o.y - u.y) < 0.9) return g;
  return { x: o.x + n[0] * 0.6 * s, y: o.y + n[1] * 0.6 * s };
}
/* colocar una unidad en el despliegue (a mano): en la muralla si es un tirador de la plaza y se suelta sobre
   un lienzo; si no, dentro de su zona. Devuelve si se colocó. */
function cmbColocar(u, x, y) {
  const M = BT.muro;
  if (M && M.x0 != null && cmbPuedeSubir(u) && cmbDistMuro(M, { x, y }) < 0.9) {
    const q = cmbPuntoMuro(M, { x, y });
    u.x = q.x;
    u.y = q.y;
    u.adarve = true;
    return true;
  }
  if (!cmbEnZona(u.side, x, y)) return false;
  const q = cmbAZona(u.side, x, y);
  u.x = q.x;
  u.y = q.y;
  u.adarve = false;
  return true;
}
/* zona de despliegue (ver cmbZona) */
function cmbEnZona(side, x, y) {
  const z = cmbZona(side);
  if (z.dentro) {
    const [a, b, c, d] = z.dentro;
    return x >= a && x <= c && y >= b && y <= d;
  }
  const [a, b, c, d] = z.fuera;
  return x > 0 && y > 0 && x < BW && y < BH && !(x > a && x < c && y > b && y < d);
}
function cmbAZona(side, x, y) {
  const z = cmbZona(side);
  if (z.dentro) {
    const [a, b, c, d] = z.dentro;
    return { x: clamp(x, a, c), y: clamp(y, b, d) };
  }
  const [a, b, c, d] = z.fuera;
  x = clamp(x, 0.5, BW - 0.5);
  y = clamp(y, 0.5, BH - 0.5);
  if (x > a && x < c && y > b && y < d) {
    /* dentro del anillo prohibido: al borde más cercano */
    const m = Math.min(x - a, c - x, y - b, d - y);
    if (m === x - a) x = a;
    else if (m === c - x) x = c;
    else if (m === y - b) y = b;
    else y = d;
  }
  return { x, y };
}
function deploy(side, only) {
  const us = BT.units.filter((u) => u.side === side && (!only || u.x < 0)),
    rows = [0, -1.7, 1.7, -3.4, 3.4, -5.1, 5.1, -6.8, 6.8, -8.5, 8.5, -10.2, 10.2].map((o) => BH / 2 + o),
    col = { lin: 7.5, esc: 9.1, arq: 3.5, cab: 5.5, maq: 1.8, gen: 4.8 };
  const cnt = { lin: 0, esc: 0, arq: 0, cab: 0, maq: 0, gen: 0 };
  us.sort((a, b) => TYP.indexOf(a.t) - TYP.indexOf(b.t));
  for (const u of us) {
    const g = u.gen && u.n <= SPU ? "gen" : cmbGrp(u.t),
      k = cnt[g]++;
    let a = rows[k % rows.length],
      d = col[g] + (k >= rows.length ? -1.6 : 0);
    if (g === "cab") a = k % 2 ? BH / 2 + 10 - Math.floor(k / 2) * 1.8 : BH / 2 - 10 + Math.floor(k / 2) * 1.8;
    let q = cmbLocal(side, d, a);
    for (
      let n = 0;
      n < 30 &&
      BT.units.some((o) => o !== u && o.x >= 0 && Math.hypot(o.x - q.x, o.y - q.y) < crd(o, u) + 0.1);
      n++
    ) {
      a = ((a + 1.7) % (BH - 1)) + 0.5;
      q = cmbLocal(side, d, a);
    }
    if (BT.muro && BT.muro.x0 != null && BT.def != null && cmbBnd(side) === cmbBnd(BT.def)) {
      /* la guarnición, dentro del recinto: tiradores junto al lienzo del frente, la línea detrás, la
         caballería y las máquinas al fondo */
      const M = BT.muro,
        fr = M.frente,
        dIn = { arq: 1.5, lin: 3.2, esc: 2.4, cab: 7, maq: 9, gen: 5.2 }[g] + (k >= rows.length ? 1.6 : 0),
        largo = fr === "N" || fr === "S",
        L = largo ? M.x1 - M.x0 : M.y1 - M.y0,
        off = clamp(a - BH / 2, -L / 2 + 0.9, L / 2 - 0.9);
      q = fr === "O" ? { x: M.x0 + dIn, y: M.cy + off } : fr === "E" ? { x: M.x1 - dIn, y: M.cy + off } : fr === "N" ? { x: M.cx + off, y: M.y0 + dIn } : { x: M.cx + off, y: M.y1 - dIn };
      for (let n = 0; n < 40 && BT.units.some((o) => o !== u && o.x >= 0 && Math.hypot(o.x - q.x, o.y - q.y) < crd(o, u) + 0.1); n++) {
        const o2 = clamp(off + (n % 2 ? 1 : -1) * Math.ceil((n + 1) / 2) * 1.6, -L / 2 + 0.9, L / 2 - 0.9),
          d2 = dIn + Math.floor(n / 12) * 1.4;
        q = fr === "O" ? { x: M.x0 + d2, y: M.cy + o2 } : fr === "E" ? { x: M.x1 - d2, y: M.cy + o2 } : fr === "N" ? { x: M.cx + o2, y: M.y0 + d2 } : { x: M.cx + o2, y: M.y1 - d2 };
      }
      q = { x: clamp(q.x, M.x0 + 0.6, M.x1 - 0.6), y: clamp(q.y, M.y0 + 0.6, M.y1 - 0.6) };
      /* arqueros y honderos, arriba: en el adarve del lienzo del frente */
      if (cmbPuedeSubir(u)) {
        q = cmbPuntoMuro(M, { x: fr === "O" ? M.x0 : fr === "E" ? M.x1 : q.x, y: fr === "N" ? M.y0 : fr === "S" ? M.y1 : q.y });
        for (let n = 0; n < 40 && BT.units.some((o) => o !== u && o.adarve && o.x >= 0 && Math.hypot(o.x - q.x, o.y - q.y) < crd(o, u) + 0.1); n++) {
          const o2 = clamp(off + (n % 2 ? 1 : -1) * Math.ceil((n + 1) / 2) * 1.4, -L / 2 + 0.3, L / 2 - 0.3);
          q = fr === "O" ? { x: M.x0, y: M.cy + o2 } : fr === "E" ? { x: M.x1, y: M.cy + o2 } : fr === "N" ? { x: M.cx + o2, y: M.y0 } : { x: M.cx + o2, y: M.y1 };
        }
        u.adarve = true;
      } else u.adarve = false;
    }
    u.x = q.x;
    u.y = q.y;
  }
}
const bU = (id) => BT.units.find((u) => u.id === id),
  dd = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/* bandos: unidades de ejércitos del mismo bando no se atacan. Sin BT.bandos (p. ej. el espejo online),
   cada lado es su bando y el lado 0 es el del jugador */
const cmbBnd = (s) => (BT.bandos ? BT.bandos[s] : s),
  cmbLadoDe = (s) => (BT.lados ? BT.lados[s] : s ? "E" : "O"),
  mio = (u) => (BT.mios ? BT.mios.includes(u.side) : u.side === 0),
  aliado = (u) => cmbBnd(u.side) === (BT.bandoYo ?? 0),
  hostil = (a, b) => cmbBnd(a.side) !== cmbBnd(b.side),
  cmbFwd = (s) => {
    const l = cmbLadoDe(s);
    if (l === "C") return BT.fwdC || (BT.muro && CMB_NOR[BT.muro.frente]) || [1, 0];
    return { O: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] }[l] || [1, 0];
  };
/* orienta la unidad al moverse: los de oeste-este miran a lo ancho; los de norte-sur, a lo alto */
function cmbCara(u, dx, dy) {
  if (u.ax === "y") {
    if (Math.abs(dy) > 0.05) u.face = Math.sign(dy);
    if (Math.abs(dx) > 0.05) u.flx = dx < 0;
  } else if (Math.abs(dx) > 0.05) u.face = Math.sign(dx);
}
const act = (u) => u.n > 0 && !u.gone && !(u.lleg > 0),
  fighting = (u) => act(u) && !u.rout,
  enem = (u) => BT.units.filter((o) => hostil(o, u) && fighting(o));
const nearest = (u) => enem(u).sort((a, b) => dd(u, a) - dd(u, b))[0];
const tile = (u) => BT.terr[clamp(Math.floor(u.y), 0, BH - 1)]?.[clamp(Math.floor(u.x), 0, BW - 1)],
  inForest = (u) => tile(u) === 1,
  onHill = (u) => tile(u) === 2,
  inRiver = (u) => tile(u) === 3;
const tirador = (u) => u.cs.al > 0 && u.ammo > 0,
  alc = (u) => u.cs.al * (BT.env.clima === "niebla" ? 0.7 : 1) * (onHill(u) ? 1.15 : 1) * (u.adarve ? 1.25 : 1),
  murOk = (u) => cmbMurF(u) > 0;
/* nivel efectivo de muralla que protege a u: baja con los daños (arietes, catapultas) y casi se anula
   junto a una torre de asedio enemiga */
/* ---------- el recinto de la plaza ----------
   Un rectángulo en el CENTRO del campo con muralla en los cuatro lados (x0..x1, y0..y1, en líneas de media
   casilla), una puerta en el centro de cada lienzo, torres en las esquinas y cada seis casillas, y el tramo de
   la brecha (8 casillas) en el lienzo que mira al atacante principal (frente). Es la única descripción de la
   muralla: la usan la simulación (protección, máquinas, brecha, asalto por flancos), el despliegue, el dibujo
   2D, la batalla 3D (cmbRender().campo.muro) y el espejo online (va entera en el mensaje «ini»).
   Un campamento (fort < 1) es un recinto más pequeño. */
const CMB_NOR = { N: [0, -1], S: [0, 1], O: [-1, 0], E: [1, 0] }; // hacia fuera de cada lienzo
function cmbRecinto(fort, frente) {
  const camp = fort < 1,
    w = camp ? 16 : 26,
    h = camp ? 12 : 18,
    x0 = Math.floor(BW / 2 - w / 2) + 0.5,
    y0 = Math.floor(BH / 2 - h / 2) + 0.5,
    x1 = x0 + w,
    y1 = y0 + h,
    cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2,
    puertas = [
      { l: "N", x: cx, y: y0 },
      { l: "S", x: cx, y: y1 },
      { l: "O", x: x0, y: cy },
      { l: "E", x: x1, y: cy },
    ],
    torres = [
      { x: x0, y: y0, l: "N" },
      { x: x1, y: y0, l: "N" },
      { x: x0, y: y1, l: "S" },
      { x: x1, y: y1, l: "S" },
    ];
  for (let x = x0 + 6; x < x1 - 2; x += 6)
    if (Math.abs(x - cx) > 1.5) torres.push({ x, y: y0, l: "N" }, { x, y: y1, l: "S" });
  for (let y = y0 + 6; y < y1 - 2; y += 6)
    if (Math.abs(y - cy) > 1.5) torres.push({ x: x0, y, l: "O" }, { x: x1, y, l: "E" });
  const fr = CMB_NOR[frente] ? frente : "O",
    largo = fr === "N" || fr === "S";
  return {
    x0,
    y0,
    x1,
    y1,
    cx,
    cy,
    puertas,
    torres,
    frente: fr,
    brecha: { l: fr, a: (largo ? cx : cy) - 4, b: (largo ? cx : cy) + 4 },
    camp,
  };
}
/* ¿está p dentro del recinto? (sin x0: muros de versiones antiguas, frente en M.x) */
function cmbDentro(M, p) {
  if (M.x0 != null) return p.x > M.x0 && p.x < M.x1 && p.y > M.y0 && p.y < M.y1;
  const fondo = (M.e ?? (cmbLadoDe(BT.def) === "E" ? 1 : 0)) ? p.x > M.x : p.x < M.x;
  return fondo && (M.y0 == null || (p.y > M.y0 && p.y < M.y1));
}
/* punto del lienzo más cercano a p y lado de ese lienzo (N/S/O/E) */
function cmbPuntoMuro(M, p) {
  if (cmbDentro(M, p)) {
    const d = [
      ["O", p.x - M.x0],
      ["E", M.x1 - p.x],
      ["N", p.y - M.y0],
      ["S", M.y1 - p.y],
    ].sort((a, b) => a[1] - b[1])[0][0];
    return { l: d, x: d === "O" ? M.x0 : d === "E" ? M.x1 : p.x, y: d === "N" ? M.y0 : d === "S" ? M.y1 : p.y };
  }
  const x = clamp(p.x, M.x0, M.x1),
    y = clamp(p.y, M.y0, M.y1),
    ex = Math.max(M.x0 - p.x, p.x - M.x1, 0),
    ey = Math.max(M.y0 - p.y, p.y - M.y1, 0),
    l = ex >= ey ? (p.x < M.x0 ? "O" : "E") : p.y < M.y0 ? "N" : "S";
  return { l, x, y };
}
/* distancia de p al lienzo más cercano */
function cmbDistMuro(M, p) {
  if (M.x0 != null) {
    const q = cmbPuntoMuro(M, p);
    return Math.hypot(p.x - q.x, p.y - q.y);
  }
  const e = M.e ?? (cmbLadoDe(BT.def) === "E" ? 1 : 0),
    enX = e ? p.x > M.x : p.x < M.x,
    dF = M.y0 == null || (p.y > M.y0 && p.y < M.y1) ? Math.abs(p.x - M.x) : 99,
    dN = M.y0 != null && enX ? Math.abs(p.y - M.y0) : 99,
    dS = M.y0 != null && enX ? Math.abs(p.y - M.y1) : 99;
  return Math.min(dF, dN, dS);
}
const cmbPuertaCerca = (M, p) => M.puertas.reduce((a, q) => (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? q : a));
/* ¿está (x, y) en el tramo de la brecha? (para el dibujo) */
const cmbEnBrecha = (M, l, v) => !!(M.brecha && M.brecha.l === l && v >= M.brecha.a && v < M.brecha.b);
/* zonas de despliegue. Campo abierto: una franja junto al borde de cada lado (12 casillas al este u oeste,
   8 al norte o sur). Asedio: el bando que defiende, dentro del recinto; los atacantes, en cualquier punto
   alrededor de la plaza a más de CMB_ANILLO casillas de la muralla («despliegue por todo alrededor»). */
const CMB_ZEO = 12,
  CMB_ZNS = 8,
  CMB_ANILLO = 7;
function cmbZona(side) {
  const M = BT.muro;
  if (M && M.x0 != null && BT.def != null) {
    if (cmbBnd(side) === cmbBnd(BT.def)) return { dentro: [M.x0 + 0.6, M.y0 + 0.6, M.x1 - 0.6, M.y1 - 0.6] };
    return { fuera: [M.x0 - CMB_ANILLO, M.y0 - CMB_ANILLO, M.x1 + CMB_ANILLO, M.y1 + CMB_ANILLO] };
  }
  const l = cmbLadoDe(side);
  if (l === "E") return { dentro: [BW - CMB_ZEO, 0.5, BW - 0.5, BH - 0.5] };
  if (l === "N") return { dentro: [0.5, 0.5, BW - 0.5, CMB_ZNS] };
  if (l === "S") return { dentro: [0.5, BH - CMB_ZNS, BW - 0.5, BH - 0.5] };
  return { dentro: [0.5, 0.5, CMB_ZEO, BH - 0.5] };
}
/* la zona como rectángulos [x, y, ancho, alto] para pintarla */
function cmbZonaRects(side) {
  const z = cmbZona(side);
  if (z.dentro) {
    const [a, b, c, d] = z.dentro;
    return [[a - 0.5, b - 0.5, c - a + 1, d - b + 1]];
  }
  const [a, b, c, d] = z.fuera;
  return [
    [0, 0, BW, Math.max(0, b)],
    [0, d, BW, Math.max(0, BH - d)],
    [0, b, Math.max(0, a), d - b],
    [c, b, Math.max(0, BW - c), d - b],
  ];
}
function cmbMurF(u) {
  const M = BT.muro;
  if (!M || M.hp <= 0 || cmbBnd(u.side) !== cmbBnd(BT.def) || !(u.adarve || cmbDentro(M, u))) return 0;
  const torre = BT.units.some(
    (o) => hostil(o, u) && o.t === "tor" && fighting(o) && cmbDistMuro(M, o) < 1.6 && dd(o, u) < 4,
  );
  return BT.fort * (M.hp / M.hp0) * (torre ? 0.3 : 1) * (1 - 0.18 * ((BT.flancos || 1) - 1));
}
/* adaptador de habilidades para la táctica */
const BTB = {
  auto: false,
  enemigos: (x, r) => enem(x).filter((o) => dd(x, o) <= r + rad(o)),
  aliados: (x, r) => BT.units.filter((o) => !hostil(o, x) && fighting(o) && dd(x, o) <= r),
  bosque: () => 0,
  enBosque: (x) => inForest(x),
  moralAliada: (x) => {
    const v = BT.units.filter((o) => o.side === x.side && fighting(o)),
      n = v.reduce((a, o) => a + o.n, 0);
    return n ? v.reduce((a, o) => a + o.n * clamp(o.mor / o.morMax, 0, 1), 0) / n : 1;
  },
  log: (t, p, x, id) => {
    bHito(
      "",
      p,
      x && mio(x) ? t.replace(/(^|¡Emboscada! )Los /, "$1Tus ") : t,
      x ? (aliado(x) ? "good" : "bad") : "",
    );
    if (x && !BT.quiet)
      BT.fx.push({
        x: x.x,
        y: x.y - 0.6,
        txt: (CMB_HAB[id] || {}).n || "",
        t0: performance.now(),
        c: "#f2c14e",
      });
  },
};
const reach = (u) =>
  u.cs.ve * PH * (1 - u.fat / 300) * (inForest(u) ? (cmbCab(u.t) ? 0.6 : 0.8) : 1) * (inRiver(u) ? 0.5 : 1);
function bLog(m, c = "") {
  BT.log.unshift({ m, c });
  if (BT.log.length > 40) BT.log.length = 40;
  BT.ult = [BT.ult[0], m];
}
/* registra un hito (una vez por clave) con importancia */
function bHito(k, pr, m, c) {
  if (k && BT.dichos[k]) return;
  if (k) BT.dichos[k] = 1;
  bLog(m, c);
  if (!BT.hitoP || pr >= BT.hitoP[0]) BT.hitoP = [pr, m];
}
const uname = (u) => (mio(u) ? "Tus " : "Los ") + u.nm;
const cBien = (u) => (aliado(u) ? "bad" : "good");
const cmbTal = (s, k, v) => {
  if (v > 0 && BT.tal[s]) BT.tal[s][k] = (BT.tal[s][k] || 0) + v;
};
/* reparte un mérito entre los ejércitos enemigos del lado s */
function cmbTalEnem(s, k, v) {
  const hs = [...Array(BT.N || 2).keys()].filter((o) => cmbBnd(o) !== cmbBnd(s));
  for (const o of hs) cmbTal(o, k, v / hs.length);
}
function cmbGeneralCae(s, u) {
  const g = BT.gens[s];
  if (!g.ok) return;
  g.ok = false;
  BT.gb[s] = 1;
  const muere = R() < 0.35,
    gc = G.C[g.id];
  g.res = muere ? "muerto" : "herido";
  for (const o of BT.units) if (o.side === s && act(o)) o.mor -= muere ? 18 : 12;
  cmbTalEnem(s, "general", BT.init[s] * 0.08);
  bHito(
    "gen" + s,
    5,
    muere
      ? `${gc ? gc.n : "El general"} cae muerto junto a los ${u.nm}; ${mio(u) ? "tus hombres titubean" : "sus hombres titubean"}.`
      : `${gc ? gc.n : "El general"} cae herido y es retirado del frente.`,
    aliado(u) ? "bad" : "good",
  );
}
function hurt(b, v, mf) {
  if (b.n <= 0) return 0;
  b.dmg += v;
  let lost = 0;
  while (b.dmg >= b.hpS && b.n > 0) {
    b.dmg -= b.hpS;
    b.n--;
    lost++;
    if (R() < (b.rout ? 0.75 : mf || 0.4)) {
      b.muertos++;
      BT.dead.push({ x: b.x * TS + ri(-11, 9), y: b.y * TS + ri(-7, 7), f: b.f });
    } else b.her++;
  }
  if (lost) {
    b.mor -= (lost / b.n0) * 100 * (1 - b.cs.di * 0.05);
    if (b.gen && R() < (lost / b.n0) * 1.1) cmbGeneralCae(b.side, b);
    if (BT.dead.length > 500) BT.dead.splice(0, BT.dead.length - 500);
  }
  return lost;
}
/* posición del atacante respecto al frente del defensor */
function cmbAngulo(a, b) {
  const d = dd(a, b) || 1,
    c = ((b.ax === "y" ? a.y - b.y : a.x - b.x) * b.face) / d;
  return c > 0.35 ? 0 : c < -0.5 ? 2 : 1;
}
function fight(a, b, dt) {
  if (a.rout || a.n <= 0) return;
  /* solo hay flanco si el defensor ya está trabado con otro enemigo (si no, se vuelve hacia el atacante) */
  const pos = b.rout || b.eng < 2 ? 0 : cmbAngulo(a, b),
    flm = [1, 1.4, 1.8][pos],
    sa = a.st === "agr" ? 1.2 : 0.9,
    sb = b.rout ? 0.3 : b.st === "agr" ? 0.85 : 1.3,
    fa = Math.max(0.5, 1 - a.fat / 220),
    fb = Math.max(0.6, 1 - b.fat / 300),
    mur = 1 / (1 + 0.3 * cmbMurF(b)),
    ha = cmbHabMod(a),
    hb = cmbHabMod(b),
    asusta = a.asust ? 0.75 : 1,
    hill = onHill(b) && !onHill(a) ? 0.8 : 1,
    rioA = inRiver(a) ? 0.8 : 1,
    rioB = inRiver(b) ? 0.7 : 1,
    bos = inForest(a) && cmbCab(a.t) ? 0.7 : 1,
    stuck = cmbCab(a.t) && a.charge <= 0 && a.engT > 4 ? 0.8 : 1;
  let cg = a.charge > 0 && a.cs.ca ? (1 + a.cs.ca * 0.11 * (inForest(a) ? 0.4 : 1)) * ha.carga : 1;
  if (cg > 1 && (UN[b.t].rol === "l" || hb.antiCarga) && pos === 0 && !b.rout) {
    const c2 = 1 + (cg - 1) * 0.2;
    if (cmbCab(a.t))
      bHito("lan" + a.id, 3, `Los ${b.nm} clavan las lanzas: la carga de los ${a.nm} se estrella.`, cBien(a));
    cmbTal(b.side, "lanceros", ((cg - c2) / cg) * dt * 3);
    cg = c2;
  }
  if (pos && !b.rout) {
    b.flk = Math.max(b.flk, pos);
    bHito(
      "flk" + b.id,
      3,
      `Los ${a.nm} ${pos === 2 ? "caen sobre la retaguardia de" : "flanquean a"} los ${b.nm}; su moral se tambalea.`,
      cBien(b),
    );
  }
  let v =
    Math.min(a.n, 8) *
    a.cs.me *
    ha.me *
    asusta *
    MULT[a.t][b.t] *
    sa *
    fa *
    BT.gb[a.side] *
    BT.bono[a.side] *
    cg *
    stuck *
    (a.escala > 0 ? 0.8 : 1) *
    rioA *
    bos *
    hill *
    mur *
    flm *
    (12 / (12 + b.cs.de * hb.de * sb * fb * rioB)) *
    (10 / (10 + (b.cs.ar + hb.ar) * 1.2 * (pos === 2 ? 0.6 : 1))) *
    dt *
    CMB_KT;
  if (b.rout) v *= 1.6;
  a.objId = b.id;
  a.golpeT = BT.t;
  const l = hurt(b, v, ha.veneno ? 0.6 : 0) || v / b.hpS;
  for (const h of a.hab || [])
    if (h.t > 0 && CMB_HAB[h.id].act.me > 1) cmbTal(a.side, "hab:" + h.id, l * (1 - 1 / ha.me));
  if (hb.de > 1) for (const h of b.hab || []) if (h.t > 0) cmbTal(b.side, "hab:" + h.id, l * (hb.de - 1));
  if (asusta < 1) cmbTal(b.side, "espanto", l * 0.33);
  cmbTal(a.side, "carga", l * (1 - 1 / cg));
  cmbTal(a.side, "flanqueo", l * (1 - 1 / flm));
  cmbTal(a.side, "mando", l * (1 - 1 / BT.gb[a.side]));
  cmbTal(a.side, "veterania", (l * (a.cs.xp / 500)) / (1 + a.cs.xp / 500));
  cmbTal(a.side, "fatiga", l * (1 / fb - 1));
  cmbTal(b.side, "armadura", l * (b.cs.ar * 0.12));
  if (mur < 1) cmbTal(b.side, "murallas", (l * (1 - mur)) / mur);
  if (hill < 1 || rioB < 1) cmbTal(b.side, "terreno", l * 0.25);
  if (b.rout) cmbTal(a.side, "persecucion", l);
}
/* distancia de o por delante de t (según el frente de su lado) */
const cmbDelante = (t, o) => (o.x - t.x) * cmbFwd(t.side)[0] + (o.y - t.y) * cmbFwd(t.side)[1];
function volley(u, t) {
  const d = dd(u, t) || 1,
    fr = ((u.x - t.x) * t.face) / d > 0.35,
    hu = cmbHabMod(u),
    ht = cmbHabMod(t),
    esc =
      hu.fuego || u.t === "cat"
        ? 0
        : Math.min(
            0.95,
            (t.cs.es + ht.es) * (fr ? 1 : 0.3) * (UN[u.t].rol === "h" ? 0.5 : 1) * (t.st === "def" ? 1.3 : 1),
          ),
    arm = hu.fuego ? 1 : 10 / (10 + (t.cs.ar + ht.ar) * (u.t === "bal" ? 0.8 : 1.5)),
    mur = 1 / (1 + 0.35 * cmbMurF(t)),
    cl = BT.env.clima;
  t.tiroT = BT.t;
  let v =
    u.n *
    0.22 *
    Math.max(0.5, 1 - u.fat / 300) *
    u.cs.pr *
    hu.pr *
    (1 - esc) *
    arm *
    (onHill(u) || u.adarve ? 1.25 : 1) *
    (inForest(t) ? 0.6 : 1) *
    (t.adarve ? 0.7 : 1) *
    (cl === "lluvia" && u.t !== "h" ? 0.65 : 1) *
    (cl === "niebla" ? 0.8 : 1) *
    BT.gb[u.side] *
    BT.bono[u.side] *
    mur *
    0.8;
  const cover =
    t.cs.cl === "dis" &&
    BT.units.some(
      (o) =>
        o.side === t.side &&
        o.cs.cl !== "dis" &&
        fighting(o) &&
        cmbDelante(t, o) > 0.3 &&
        cmbDelante(t, o) < 2.6 &&
        Math.abs((o.x - t.x) * cmbFwd(t.side)[1] - (o.y - t.y) * cmbFwd(t.side)[0]) < 1.3,
    );
  if (cover) v *= 0.5;
  u.ammo--;
  u.dispT = BT.t;
  u.objId = t.id;
  if (u.ammo <= 0) bHito("mu" + u.id, 1, `${uname(u)} agotan sus proyectiles.`);
  const now = performance.now();
  if (!BT.quiet)
    for (let k = 0; k < Math.min(u.n, 10); k++)
      BT.fx.push({
        arrow: 1,
        x0: u.x + (R() - 0.5) * 0.9,
        y0: u.y + (R() - 0.5) * 0.7,
        x: t.x + (R() - 0.5) * 1,
        y: t.y + (R() - 0.5) * 0.8,
        t0: now + k * 35,
      });
  const l = hurt(t, v, hu.veneno ? 0.6 : 0);
  cmbTal(u.side, "proyectiles", l || v / t.hpS);
  for (const h of u.hab || [])
    if (h.t > 0 && CMB_HAB[h.id].act.pr) cmbTal(u.side, "hab:" + h.id, (l || v / t.hpS) * (1 - 1 / hu.pr));
  cmbTal(t.side, "armadura", (v / t.hpS) * ((1 - (1 - esc) * arm) / ((1 - esc) * arm)) * 0.5);
  if (mur < 1) cmbTal(t.side, "murallas", ((v / t.hpS) * (1 - mur)) / mur);
  if (l && !BT.quiet)
    BT.fx.push({ x: t.x, y: t.y, txt: "-" + l, t0: now + 300, c: aliado(t) ? "#ff8a7a" : "#ffd36b" });
}
function simStep(dt, slot) {
  const live = BT.units.filter(act),
    now = performance.now(),
    calorC = BT.env.clima === "calor" ? 1.3 : 1,
    M = BT.muro;
  BT.t += dt;
  /* refuerzos: entran por su borde cuando les llega la hora */
  for (let s = 0; s < (BT.N || 2); s++)
    if (BT.lleg && BT.lleg[s] > 0 && BT.t >= BT.lleg[s]) {
      BT.lleg[s] = 0;
      for (const u of BT.units) if (u.side === s) u.lleg = 0;
      deploy(s);
      const fS = BT.ejs[BT.map[s]].f;
      bHito(
        "",
        4,
        `Llegan refuerzos: las tropas de ${CIV[fS].s} entran por ${CMB_DIRN[cmbLadoDe(s)]}.`,
        cmbBnd(s) === (BT.bandoYo ?? 0) ? "good" : "bad",
      );
    }
  for (const u of live) {
    u._morPrev = u.mor;
    u.hm = cmbHabMod(u);
    u.tiroso = BT.t - (u.tiroT ?? -99) < 4;
    u.asust = !!UN[u.t].caballo && enem(u).some((o) => cmbHabTiene(o, "espanto") && dd(u, o) < 3);
  }
  /* la IA (y los capitanes, si se les delega) usa las habilidades con criterio */
  if ((BT.habT -= dt) <= 0) {
    BT.habT = 0.5;
    for (const u of live) if (cmbHabIALado(u.side) && fighting(u)) cmbHabIA(u, BTB);
  }
  for (const u of live) {
    const P = u.plan[slot] || u.plan[0];
    u.st = P.st;
    let g = null;
    if (u.rout) {
      const fw = cmbFwd(u.side);
      g = fw[0] ? { x: fw[0] > 0 ? -2 : BW + 2, y: u.y } : { x: u.x, y: fw[1] > 0 ? -2 : BH + 2 };
    } else if (P.o && P.o.tg != null) {
      const t = bU(P.o.tg);
      if (t && fighting(t))
        g =
          tirador(u) && !P.o.cc
            ? { x: t.x, y: t.y, stop: alc(u) - 0.6 }
            : { x: t.x, y: t.y, stop: crd(u, t) - 0.05, p: 1 };
      else P.o = null;
    } else if (P.o) {
      if (Math.hypot(P.o.x - u.x, P.o.y - u.y) < 0.12) P.o = null;
      else g = { x: P.o.x, y: P.o.y };
    }
    if (!g && !u.rout) {
      const e = nearest(u);
      if (e) {
        if (tirador(u)) {
          if (u.st === "agr" && dd(u, e) > alc(u) - 0.3) g = { x: e.x, y: e.y, stop: alc(u) - 0.6 };
        } else if (u.st === "agr" && dd(u, e) < 4) g = { x: e.x, y: e.y, stop: crd(u, e) - 0.05, p: 1 };
      }
    }
    /* máquinas de asedio: arietes y torres van a la muralla; las catapultas, a tiro de ella */
    if (
      !g &&
      !u.rout &&
      u.cs.cl === "asd" &&
      M &&
      M.hp > 0 &&
      cmbBnd(u.side) !== cmbBnd(BT.def) &&
      u.st === "agr"
    ) {
      /* catapultas: a tiro del lienzo más cercano; arietes: a la puerta más cercana; torres: al lienzo */
      const pm = cmbPuntoMuro(M, u);
      if (u.t === "cat") g = { x: pm.x, y: pm.y, stop: alc(u) - 1 };
      else {
        const q = u.t === "ari" ? cmbPuertaCerca(M, u) : pm,
          n = CMB_NOR[q.l];
        g = { x: q.x + n[0] * 0.9, y: q.y + n[1] * 0.9 };
      }
    }
    /* elefantes desbocados: arremeten contra los suyos */
    if (u.desb > 0) {
      const o = BT.units
        .filter((o) => o.side === u.side && o !== u && fighting(o))
        .sort((a, b) => dd(u, a) - dd(u, b))[0];
      if (o) g = { x: o.x, y: o.y, stop: crd(u, o) - 0.1 };
    }
    /* los hostigadores rehúyen el cuerpo a cuerpo mientras tengan munición */
    if (
      !u.rout &&
      !u.eng &&
      tirador(u) &&
      u.cs.cl !== "asd" &&
      (UN[u.t].rol === "h" || UN[u.t].rol === "m" || u.st === "def")
    ) {
      const m = enem(u)
        .filter((o) => !tirador(o) && dd(u, o) < 2.6 + rad(o))
        .sort((a, b) => dd(u, a) - dd(u, b))[0];
      if (m) {
        const L = dd(u, m) || 1;
        g = { x: u.x + ((u.x - m.x) / L) * 3, y: u.y + ((u.y - m.y) / L) * 3 };
      }
    }
    if (M && (u.adarve || cmbPuedeSubir(u))) g = cmbRutaAdarve(u, P, g);
    if (M && M.x0 != null && g && !u.adarve) g = cmbRutaPlaza(u, g);
    u.goal = g;
  }
  for (const u of live) {
    u._px = u.x;
    u._py = u.y;
  }
  for (const u of live) {
    const was = u.eng,
      cont = enem(u).filter((o) => dd(u, o) < crd(u, o) + 0.08 && cmbToca(u, o));
    u.eng = cont.length;
    if (u.eng && !was && u.cs.ca >= 2 && u.moved >= (cmbCab(u.t) ? 1.5 : 1)) {
      u.charge = cmbCab(u.t) ? 1.5 : 0.8;
      u.fat = Math.min(100, u.fat + 4);
      cont.forEach(
        (o) =>
          (o.mor -= 6 * (u.cs.ca / 6) * (UN[o.t].rol === "l" || cmbHabActiva(o, "muroEscudos") ? 0.3 : 1)),
      );
      if (u.cs.ca >= 6) bHito("car" + u.id, 2, `${uname(u)} cargan contra los ${cont[0].nm}.`);
    }
    u.charge = Math.max(0, u.charge - dt);
    u.engT = u.eng ? u.engT + dt : 0;
    const calor = UN[u.t].calor ? 1 : calorC;
    let sp =
      u.cs.ve *
      u.hm.ve *
      (u.escala > 0 ? 0.5 : 1) *
      (1 - u.fat / 250) *
      (inForest(u) ? (cmbCab(u.t) ? 0.5 : 0.7) : 1) *
      (inRiver(u) ? 0.45 : 1) *
      (u.rout ? 1.3 : 1);
    if (u.eng) sp *= u.rout ? 0.5 : 0;
    if (u.goal && sp > 0) {
      const dx = u.goal.x - u.x,
        dy = u.goal.y - u.y,
        L = Math.hypot(dx, dy),
        m = Math.min(sp * dt, Math.max(0, L - (u.goal.stop || 0)));
      if (m > 0.001) {
        u.x += (dx / L) * m;
        u.y += (dy / L) * m;
        u.moved += m;
        u.mvT = now;
        if (!(tirador(u) && UN[u.t].rol !== "m")) cmbCara(u, dx, dy);
        u.fat = Math.min(100, u.fat + dt * 0.5 * u.cs.fa * u.hm.fat * calor * (u.st === "agr" ? 1.3 : 1));
      } else u.moved = 0;
    } else if (!u.eng) {
      u.moved = 0;
      u.fat = Math.max(0, u.fat - dt * 1.5);
    }
    if (u.eng) {
      u.fat = Math.min(100, u.fat + dt * 1.1 * u.cs.fa * u.hm.fat * calor * (u.st === "agr" ? 1.3 : 1));
      u.fT = now;
      const e = cont.sort((a, b) => b.n - a.n)[0];
      if (e && !u.rout) cmbCara(u, e.x - u.x, e.y - u.y);
    } else if (!u.rout && !u.goal) {
      const e = nearest(u);
      if (e && dd(u, e) < 9) cmbCara(u, e.x - u.x, e.y - u.y);
    }
  }
  for (const u of live)
    for (const o of live) {
      /* el adarve no empuja a los de abajo, y los amigos que van por él se cruzan sin estorbarse */
      if (u.id >= o.id || u.n <= 0 || o.n <= 0 || !u.adarve !== !o.adarve || (u.adarve && !hostil(u, o))) continue;
      const d = dd(u, o),
        mn = !hostil(u, o) ? crd(u, o) + 0.05 : crd(u, o);
      if (d < mn && d > 0) {
        const p = (mn - d) / 2,
          nx = (u.x - o.x) / d,
          ny = (u.y - o.y) / d;
        u.x += nx * p;
        u.y += ny * p;
        o.x -= nx * p;
        o.y -= ny * p;
      }
    }
  for (const u of live) {
    if (u.rout) {
      if (u.ax === "y") u.x = clamp(u.x, 0.5, BW - 0.5);
      else u.y = clamp(u.y, 0.5, BH - 0.5);
      if (u.x < -0.6 || u.x > BW + 0.6 || u.y < -0.6 || u.y > BH + 0.6) {
        u.gone = true;
        bLog(`${uname(u)} abandonan el campo (${u.n}).`, cBien(u));
      }
    } else {
      u.x = clamp(u.x, 0.5, BW - 0.5);
      u.y = clamp(u.y, 0.5, BH - 0.5);
      /* en el adarve: siempre sobre la línea de los lienzos */
      if (u.adarve && M && M.x0 != null) {
        const q = cmbPuntoMuro(M, u);
        u.x = q.x;
        u.y = q.y;
      } else if (M && M.x0 != null && u._px != null && cmbDentro(M, u) !== cmbDentro(M, { x: u._px, y: u._py })) {
        /* la muralla es un obstáculo: sin paso, se queda a su lado (y la infantería atacante levanta escalas) */
        const pt = cmbPuntoMuro(M, u);
        if (!cmbPuedePasar(u, pt)) {
          u.x = u._px;
          u.y = u._py;
          if (cmbBnd(u.side) !== cmbBnd(BT.def) && !cmbCab(u.t) && u.cs.cl !== "asd" && !u.rout) {
            u.escT = (u.escT || 0) + dt;
            if (u.escT >= (M.camp ? 2 : CMB_ESCALAR)) {
              u.escT = 0;
              u.escala = 8;
              bHito("esc" + u.id, 2, M.camp ? `${uname(u)} saltan la empalizada.` : `${uname(u)} levantan escalas contra la muralla.`, aliado(u) ? "good" : "bad");
            }
          }
        }
      }
    }
  }
  for (const u of live) u.flk = 0;
  for (const u of live)
    for (const o of live)
      if (u.id < o.id && hostil(u, o) && u.n > 0 && o.n > 0 && dd(u, o) < crd(u, o) + 0.08 && cmbToca(u, o)) {
        if (u.side < o.side) {
          fight(u, o, dt);
          fight(o, u, dt);
        } else {
          fight(o, u, dt);
          fight(u, o, dt);
        }
      }
  /* bestias desbocadas: pisotean a los suyos */
  for (const u of live)
    if (u.desb > 0 && u.n > 0) {
      for (const o of live)
        if (o.side === u.side && o !== u && o.n > 0 && dd(u, o) < crd(u, o) + 0.15) {
          hurt(o, Math.min(u.n, 8) * u.cs.me * dt * CMB_KT * 0.8);
          o.mor -= dt * 3;
          cmbTalEnem(u.side, "desbocados", dt * 0.6);
        }
      if ((u.desb -= dt) <= 0) u.rout = true;
    }
  /* asedio: los arietes baten la puerta; las torres alcanzan el adarve */
  if (M && M.hp > 0)
    for (const u of live)
      if (cmbBnd(u.side) !== cmbBnd(BT.def) && fighting(u) && cmbDistMuro(M, u) < 1.4) {
        if (u.t === "ari") {
          M.hp -= dt * (u.n / SPU) * 2.2 * u.hm.me;
          bHito("ari", 3, `${uname(u)} baten la puerta de la muralla.`, aliado(u) ? "good" : "bad");
          cmbTal(u.side, "asedio", dt * 0.4);
        }
        if (u.t === "tor") {
          bHito(
            "tor" + u.id,
            3,
            `${mio(u) ? "Tu torre de asedio" : aliado(u) ? "La torre aliada" : "La torre enemiga"} alcanza el adarve.`,
            aliado(u) ? "good" : "bad",
          );
          cmbTal(u.side, "asedio", dt * 0.3);
        }
      }
  if (M && M.hp <= 0 && !M.rota) {
    M.rota = true;
    for (const o of BT.units) if (cmbBnd(o.side) === cmbBnd(BT.def) && act(o)) o.mor -= 10;
    cmbTalEnem(BT.def, "asedio", BT.init[BT.def] * 0.1);
    bHito(
      "",
      5,
      "¡Brecha en la muralla! Los defensores retroceden.",
      cmbBnd(BT.def) === (BT.bandoYo ?? 0) ? "bad" : "good",
    );
  }
  for (const u of live) {
    if (!tirador(u) || u.rout || u.eng || u.n <= 0) continue;
    u.rel -= dt;
    if (u.rel > 0) continue;
    /* las catapultas atacantes tiran primero contra la muralla */
    if (u.t === "cat" && M && M.hp > 0 && cmbBnd(u.side) !== cmbBnd(BT.def) && cmbDistMuro(M, u) <= alc(u)) {
      M.hp -= (u.n / SPU) * 7;
      u.ammo--;
      u.rel = 4;
      bHito("cat" + u.side, 3, `${uname(u)} golpean la muralla.`, aliado(u) ? "good" : "bad");
      cmbTal(u.side, "asedio", 1.5);
      if (!BT.quiet)
        {
          const pm = cmbPuntoMuro(M, u);
          BT.fx.push({ arrow: 1, x0: u.x, y0: u.y, x: pm.x + (R() - 0.5) * 2, y: pm.y + (R() - 0.5) * 2, t0: performance.now() });
        }
      continue;
    }
    const P = u.plan[slot] || u.plan[0],
      pt = P.o && P.o.tg != null ? bU(P.o.tg) : null;
    const t =
      pt && fighting(pt) && dd(u, pt) <= alc(u)
        ? pt
        : enem(u)
            .filter((o) => dd(u, o) <= alc(u))
            .sort((a, b) => dd(u, a) - dd(u, b))[0];
    if (t) {
      volley(u, t);
      const rol = UN[u.t].rol;
      u.rel =
        (u.t === "cat" ? 4 : rol === "h" ? 1.8 : rol === "m" ? 2.4 : 2.2) *
        (u.mvT && now - u.mvT < 200 ? (u.hm.parto ? 1 : rol === "m" ? 1.2 : 1.6) : 1);
    } else u.rel = 0.3;
  }
  /* las torres de la muralla disparan por su cuenta (pocas flechas: CMB_TORRE_N hombres cada una) */
  if (M && M.x0 != null && !M.camp && M.hp > 0 && BT.def != null && (BT.torT = (BT.torT ?? 1.5) - dt) <= 0) {
    BT.torT = 2.4;
    const k = clamp(M.hp / M.hp0, 0, 1),
      cl = BT.env.clima;
    for (const tw of M.torres) {
      if (M.rota && cmbEnBrecha(M, tw.l, tw.l === "N" || tw.l === "S" ? tw.x : tw.y)) continue;
      const o = live
        .filter((x) => fighting(x) && cmbBnd(x.side) !== cmbBnd(BT.def) && dd(x, tw) <= CMB_TORRE_AL * (cl === "niebla" ? 0.7 : 1))
        .sort((a, b) => dd(a, tw) - dd(b, tw))[0];
      if (!o) continue;
      const esc = Math.min(0.9, o.cs.es * 0.6 * (o.st === "def" ? 1.3 : 1)),
        arm = 10 / (10 + o.cs.ar * 1.5),
        v = CMB_TORRE_N * 0.22 * 1.25 * (0.4 + 0.6 * k) * (1 - esc) * arm * (inForest(o) ? 0.6 : 1) * (cl === "lluvia" ? 0.65 : 1) * 0.8,
        l = hurt(o, v);
      o.tiroT = BT.t;
      cmbTal(BT.def, "torres", l || v / o.hpS);
      if (!BT.quiet) {
        const t0 = performance.now();
        for (let j = 0; j < 3; j++) BT.fx.push({ arrow: 1, x0: tw.x, y0: tw.y, x: o.x + (R() - 0.5), y: o.y + (R() - 0.5) * 0.8, t0: t0 + j * 60 });
      }
    }
  }
  for (const u of live) {
    if (u.n <= 0) {
      if (!u.dead) {
        u.dead = 1;
        bLog(`${uname(u)} han sido aniquilados.`, cBien(u));
      }
      continue;
    }
    const dis = 1 - u.cs.di * 0.05,
      g = BT.gens[u.side];
    if (u.eng > 1) u.mor -= dt * (0.3 + 0.35 * (u.eng - 1)) * dis;
    else if (u.eng) u.mor -= dt * 0.25 * dis;
    if (u.flk) u.mor -= dt * (u.flk === 2 ? 2 : 1.1) * dis;
    if (!u.eng && !u.flk) {
      const cerca = enem(u).some((o) => dd(u, o) < 4);
      if (!u.rout || !cerca)
        u.mor = Math.min(
          u.morMax * (0.5 + (0.5 * u.n) / u.n0),
          u.mor + dt * (u.rout ? u.cs.di * 0.15 : 0.8 + u.cs.di * 0.15 + (g.ok ? g.ma * 0.05 : 0)),
        );
    }
    if (u.fat > 70) u.mor -= dt * 0.8;
    if (u.asust) u.mor -= dt * 0.8 * dis;
    cmbHabMoral(u, u.hm);
    if (u.fat > 80 && !u.rout) bHito("fat" + u.id, 1, `${uname(u)} están exhaustos.`);
    if (UN[u.t].rol === "ele" && !u.rout && !(u.desb > 0) && u.mor < u.morMax * 0.3 && R() < dt * 0.15) {
      u.desb = 8;
      bHito("", 4, `¡${uname(u)} se desbocan y pisotean a los suyos!`, cBien(u));
    }
    if (!u.rout && u.mor < u.morMax * 0.35 && !u.vac) {
      u.vac = 1;
      bLog(`${uname(u)} vacilan.`, cBien(u));
    } else if (u.mor > u.morMax * 0.6) u.vac = 0;
    if (!u.rout && u.mor <= 0) {
      u.rout = true;
      u.mor = 0;
      bHito("", 4, `¡${uname(u)} rompen filas y huyen!`, cBien(u));
      BT.dead.push({ std: 1, x: Math.round(u.x * TS) - 2, y: Math.round(u.y * TS), f: u.f });
      if (u.gen && R() < 0.4) cmbGeneralCae(u.side, u);
      BT.units
        .filter((o) => o.side === u.side && o !== u && fighting(o) && dd(o, u) < 3)
        .forEach((o) => (o.mor -= 10 * (1 - o.cs.di * 0.05)));
    } else if (
      u.rout &&
      u.mor >= u.morMax * 0.3 &&
      !u.eng &&
      u.n >= u.n0 * 0.25 &&
      !enem(u).some((o) => dd(u, o) < 3)
    ) {
      u.rout = false;
      bHito("", 3, `${uname(u)} se reagrupan.`, aliado(u) ? "good" : "bad");
    }
  }
  for (const u of live) {
    cmbHabTick(u, dt, BTB);
    if (u.escala > 0) u.escala -= dt;
  }
  if (BT.t - BT.tH >= (BT.mode === "rt" ? 20 : 1e9)) cmbHitoCorte();
}
/* corte del desarrollo de la batalla para el informe (cada turno o cada 20 s) */
function cmbHitoCorte() {
  const lados = [...Array(BT.N || 2).keys()],
    lost = lados.map((s) => BT.units.filter((u) => u.side === s).reduce((a, u) => a + u.n0 - u.n, 0)),
    mor = lados.map((s) => {
      const v = BT.units.filter((u) => u.side === s && fighting(u)),
        n = v.reduce((a, u) => a + u.n, 0);
      return n ? (v.reduce((a, u) => a + u.n * clamp(u.mor / u.morMax, 0, 1), 0) / n) * 100 : 0;
    }),
    k = BT.hitos.length + 1,
    eng = BT.units.some((u) => act(u) && u.eng);
  BT.hitos.push({
    r: k,
    f: BT.mode === "rt" ? `${Math.round(BT.t)} s` : `Turno ${BT.turn}`,
    t: BT.hitoP
      ? BT.hitoP[1]
      : eng
        ? "Se combate cuerpo a cuerpo."
        : BT.units.some((u) => act(u) && tirador(u))
          ? "Escaramuzas y descargas."
          : "Los ejércitos maniobran.",
    b: lost.map((v, s) => v - (BT.lc ? BT.lc[s] : 0)),
    m: mor,
  });
  BT.lc = lost;
  BT.hitoP = null;
  BT.tH = BT.t;
  if (BT.hitos.length > 16) BT.hitos.splice(1, 1);
}
function aiOrders(side = 1) {
  aiOrdersBase(side);
  /* ONL */ if (BT.ctx.dificultad && BT.ctx.dificultad[BT.map[side]] === "dificil") cmbIADificil(side);
}
function aiOrdersBase(side = 1) {
  const fw = cmbFwd(side),
    bx = -fw[0],
    by = -fw[1];
  /* el oportunista aguarda (postura defensiva, sin órdenes) hasta que los demás se desgastan */
  if (BT.espera && BT.espera[side]) {
    const mios = BT.units.filter((u) => u.side === side && fighting(u)),
      otros = BT.units.filter((u) => cmbBnd(u.side) !== cmbBnd(side) && fighting(u)),
      mor =
        otros.reduce((a, u) => a + u.n * (u.mor / u.morMax), 0) /
        Math.max(
          1,
          otros.reduce((a, u) => a + u.n, 0),
        ),
      cerca = mios.some((u) => otros.some((o) => dd(u, o) < 5));
    if (BT.t > 70 || BT.turn > 5 || mor < 0.55 || cerca) {
      BT.espera[side] = false;
      bHito(
        "",
        4,
        `Las tropas de ${CIV[BT.ejs[BT.map[side]].f].s} caen sobre los combatientes ya desgastados.`,
        cmbBnd(side) === (BT.bandoYo ?? 0) ? "good" : "bad",
      );
    } else {
      for (const u of mios) u.plan.forEach((p) => ((p.o = null), (p.st = "def")));
      return;
    }
  }
  for (const u of BT.units) {
    if (u.side !== side || !fighting(u)) continue;
    const e = nearest(u);
    if (!e) continue;
    const weak = u.n < u.n0 * 0.35 || u.mor < u.morMax * 0.25,
      defMur =
        BT.fort &&
        BT.def != null &&
        cmbBnd(side) === cmbBnd(BT.def) &&
        (BT.mode === "rt" ? BT.t < 40 : BT.turn < 3);
    let o = null,
      st = "agr";
    if (u.cs.cl === "asd") st = BT.muro && BT.muro.hp > 0 && cmbBnd(side) !== cmbBnd(BT.def) ? "agr" : "def";
    else if (u.gen && u.n <= SPU) {
      /* la guardia del general se queda tras la línea, cerca de los suyos */
      const v = BT.units.filter((x) => x.side === side && x !== u && fighting(x) && x.cs.cl !== "asd"),
        cx = v.length ? v.reduce((a, x) => a + x.x, 0) / v.length : u.x,
        cy = v.length ? v.reduce((a, x) => a + x.y, 0) / v.length : u.y;
      o = { x: clamp(cx + 2.5 * bx, 0.5, BW - 0.5), y: clamp(cy + 2.5 * by, 0.5, BH - 0.5) };
      st = "def";
    } else if (tirador(u)) {
      const mel = enem(u).filter((x) => !tirador(x) && dd(u, x) < 3.5);
      if (mel.length) {
        o = {
          x: clamp(u.x + 3 * bx + (by ? (R() - 0.5) * 2 : 0), 0.5, BW - 0.5),
          y: clamp(u.y + 3 * by + (bx ? (R() - 0.5) * 2 : 0), 0.5, BH - 0.5),
        };
        st = "def";
      } else st = defMur && UN[u.t].rol !== "m" ? "def" : "agr";
    } else if (weak) {
      o = { x: clamp(u.x + 3 * bx, 0.5, BW - 0.5), y: clamp(u.y + 3 * by, 0.5, BH - 0.5) };
      st = "def";
    } else if (u.cs.cl !== "cab") {
      const cab = enem(u).filter((x) => cmbCab(x.t) && dd(u, x) < 6)[0];
      if (defMur || (dd(u, e) > 9 && R() < 0.3)) st = "def";
      else if (UN[u.t].rol === "l") {
        o = { tg: (cab || e).id };
        st = cab ? "def" : R() < 0.5 ? "agr" : "def";
      } else {
        const arch = enem(u).filter((x) => x.cs.cl === "dis" && dd(u, x) < 5)[0];
        o = { tg: (arch || e).id };
        st = R() < 0.75 ? "agr" : "def";
      }
    } else if (u.fat > 70) {
      o = { x: clamp(u.x + 4 * bx, 0.5, BW - 0.5), y: clamp(u.y + 4 * by, 0.5, BH - 0.5) };
      st = "def";
    } else {
      const ene = enem(u).filter((x) => UN[x.t].rol !== "l" || x.eng),
        maq = ene.filter((x) => x.cs.cl === "asd" && dd(u, x) < 8)[0],
        dis = ene
          .filter((x) => x.cs.cl === "dis" || UN[x.t].rol === "m")
          .sort((a, b) => dd(u, a) - dd(u, b))[0],
        trab = ene
          .filter((x) => x.eng && x.cs.cl !== "cab")
          .sort((a, b) => b.eng - a.eng || dd(u, a) - dd(u, b))[0],
        huy = BT.units
          .filter((x) => cmbBnd(x.side) !== cmbBnd(side) && act(x) && x.rout)
          .sort((a, b) => dd(u, a) - dd(u, b))[0],
        t =
          (UN[u.t].rol === "x" && huy && dd(u, huy) < 10 ? huy : null) ||
          maq ||
          (dis && (UN[u.t].rol !== "k" || !trab) ? dis : null) ||
          trab ||
          ene.sort((a, b) => a.n - b.n)[0] ||
          e;
      if (defMur) st = "def";
      else {
        o = { tg: t.id };
        st = "agr";
      }
    }
    u.plan.forEach((p, i) => {
      p.o = i === 0 || BT.mode === "t3" ? (o ? { ...o } : null) : null;
      p.st =
        BT.mode === "t3" && !tirador(u) && UN[u.t].rol !== "l" && u.cs.cl !== "asd" && !u.gen && R() < 0.25
          ? st === "agr"
            ? "def"
            : "agr"
          : st;
    });
  }
}
/* ONL: IA DIFÍCIL de la táctica (batallas contra un jugador ausente). Sobre las órdenes normales:
   - retira tras la línea las unidades rotas o casi (≤ 35 % de hombres o ≤ 30 % de moral) para que se rehagan;
   - la caballería sana no carga de frente: rodea al enemigo trabado y le golpea por el flanco o la espalda
     (en t3: acción 1 hasta el flanco, acciones 2-3 al ataque);
   - los tiradores concentran el tiro en la unidad enemiga más dañada o en la caballería que se acerca;
   - la infantería no persigue escaramuzadores sueltos: sostiene la línea y ataca lo que esté trabado.
   Las habilidades las sigue usando cmbHabIA con criterio; entra con +6 % de moral (cmbTactica). */
function cmbIADificil(side) {
  if (BT.espera && BT.espera[side]) return;
  const fw = cmbFwd(side),
    back = -fw[0] || 0,
    backY = -fw[1] || 0,
    mios = BT.units.filter((u) => u.side === side && fighting(u)),
    ene = BT.units.filter((u) => cmbBnd(u.side) !== cmbBnd(side) && fighting(u));
  if (!ene.length) return;
  const n = BT.mode === "t3" ? 3 : 1,
    cx = mios.length ? mios.reduce((a, u) => a + u.x, 0) / mios.length : BW / 2,
    pon = (u, os, st) =>
      u.plan.forEach((p, i) => {
        p.o = i < os.length ? os[i] : i < n ? os[os.length - 1] || null : null;
        if (p.o && p.o.tg == null) p.o = { x: clamp(p.o.x, 0.5, BW - 0.5), y: clamp(p.o.y, 0.5, BH - 0.5) };
        p.st = st;
      });
  for (const u of mios) {
    if (u.cs.cl === "asd" || (u.gen && u.n <= SPU)) continue;
    const roto = u.n < u.n0 * 0.35 || u.mor < u.morMax * 0.3;
    if (roto) {
      pon(u, [{ x: cx + 5 * back, y: u.y + 5 * backY }], "def");
      continue;
    }
    if (tirador(u)) {
      const alcU = alc(u) + 2,
        obj = ene
          .filter((e) => dd(u, e) < alcU)
          .sort(
            (a, b) =>
              (cmbCab(b.t) && dd(u, b) < 6 ? 2 : 0) - (cmbCab(a.t) && dd(u, a) < 6 ? 2 : 0) ||
              a.mor / a.morMax - b.mor / b.morMax,
          )[0];
      if (obj && !enem(u).some((x) => !tirador(x) && dd(u, x) < 3)) pon(u, [{ tg: obj.id }], "agr");
      continue;
    }
    if (cmbCab(u.t) && u.fat < 70) {
      const trab = ene
        .filter((e) => e.eng && !cmbCab(e.t) && UN[e.t].rol !== "l")
        .sort((a, b) => dd(u, a) - dd(u, b))[0];
      if (trab) {
        /* punto detrás del enemigo (respecto a nuestra línea) */
        const fx = trab.x - 2.2 * back + (backY ? (u.x < trab.x ? -1.6 : 1.6) : 0),
          fy = trab.y - 2.2 * backY + (backY ? 0 : u.y < trab.y ? -1.6 : 1.6);
        if (Math.hypot(fx - u.x, fy - u.y) > 2 && n > 1)
          pon(u, [{ x: fx, y: fy }, { tg: trab.id }, { tg: trab.id }], "agr");
        else if (Math.hypot(fx - u.x, fy - u.y) > 2) pon(u, [{ x: fx, y: fy }], "agr");
        else pon(u, [{ tg: trab.id }], "agr");
      }
      continue;
    }
    if (UN[u.t].rol !== "l") {
      const cerca = ene
        .filter((e) => dd(u, e) < 6 && (e.eng || !tirador(e) || UN[e.t].rol !== "h"))
        .sort((a, b) => dd(u, a) - dd(u, b))[0];
      if (cerca) pon(u, [{ tg: cerca.id }], "agr");
    }
  }
}
function sideAlive(s) {
  return BT.units.filter((u) => u.side === s && fighting(u)).reduce((a, u) => a + u.n, 0) > BT.init[s] * 0.15;
}
/* ¿sigue en pie un bando? (en conjunto, más del 15 % de sus hombres combatiendo) */
function bandoVivo(b) {
  const todos = [...Array(BT.N || 2).keys()].filter((s) => cmbBnd(s) === b),
    lim = BT.mode === "rt" ? BT.lim : BT.lim * (BT.mode === "t3" ? 9 : 3);
  if (todos.some((s) => BT.lleg && BT.lleg[s] > 0 && BT.lleg[s] < lim)) return true;
  const ss = todos.filter((s) => !(BT.lleg && BT.lleg[s] > 0)),
    n0 = ss.reduce((a, s) => a + BT.init[s], 0);
  return BT.units.filter((u) => cmbBnd(u.side) === b && fighting(u)).reduce((a, u) => a + u.n, 0) > n0 * 0.15;
}
const cmbBandosDe = () => [...new Set([...Array(BT.N || 2).keys()].map(cmbBnd))];
/* proporción de hombres en pie de un bando */
function cmbRatioB(b) {
  const ss = [...Array(BT.N || 2).keys()].filter((s) => cmbBnd(s) === b),
    n0 = ss.reduce((a, s) => a + BT.init[s], 0);
  return n0
    ? BT.units.filter((u) => cmbBnd(u.side) === b && fighting(u)).reduce((a, u) => a + u.n, 0) / n0
    : 0;
}
/* PARTIDA RÁPIDA (js/ritmo.js): ninguna batalla en vivo dura más de ritTopeBatalla() segundos REALES (desde
   que se abre, despliegue incluido). Al vencer, acaba como al anochecer: el defensor aguanta y gana; el
   atacante pierde, pero no muere: se retira con sus supervivientes. */
function cmbTopeSeg() {
  return BT && !BT.ctx.est && typeof ritTopeBatalla === "function" ? ritTopeBatalla() || 0 : 0;
}
function cmbTopeResta() {
  const s = cmbTopeSeg();
  if (!s) return Infinity;
  if (!BT.real0) BT.real0 = performance.now();
  return s - (performance.now() - BT.real0) / 1000;
}
/* devuelve el BANDO que gana, o -1 si sigue (con dos ejércitos, bando = ejército) */
function battleOver() {
  const vivos = cmbBandosDe().filter(bandoVivo);
  if (vivos.length <= 1) {
    if (vivos.length) return vivos[0];
    return BT.def != null ? cmbBnd(BT.def) : cmbBandosDe().sort((a, b) => cmbRatioB(b) - cmbRatioB(a))[0];
  }
  if ((BT.mode === "rt" ? BT.t : BT.turn - 1) >= BT.lim || cmbTopeResta() <= 0) {
    BT.noche = true;
    return BT.def != null && vivos.includes(cmbBnd(BT.def))
      ? cmbBnd(BT.def)
      : vivos.sort((a, b) => cmbRatioB(b) - cmbRatioB(a))[0];
  }
  return -1;
}
/* ritmo de reproducción de la táctica: segundos simulados por segundo real. ifzVel() es un multiplicador
   de TIEMPO de la interfaz (lenta 2,5 · normal 1 · rápida 0,45), así que el ritmo va al revés: lenta 0,35
   (una batalla típica, 65-100 s simulados, dura unos 3-5 minutos: masas de hombres que tardan en chocar),
   normal 0,6, rápida 1,2. Sin animaciones (0: pruebas, movimiento reducido) 0,6. Las pruebas que fijan
   ctx.velocidad y la resolución automática no se ralentizan. El resultado no cambia: solo el tiempo real. */
const CMB_RITMOS = { lenta: 0.35, normal: 0.6, rapida: 1.2 };
function cmbRitmo() {
  if (BT && BT.ctx && BT.ctx.velocidad) return 1;
  const v = typeof ifzVel === "function" ? +ifzVel() || 0 : 0;
  if (!v) return 0.6;
  return v >= 2 ? CMB_RITMOS.lenta : v >= 0.8 ? CMB_RITMOS.normal : CMB_RITMOS.rapida;
}
async function runPhase(slot) {
  const dt = 1 / 30;
  for (let k = 0; k < PH / dt; k++) {
    simStep(dt, slot);
    if (battleOver() >= 0) break;
    if (k % 3 === 2) {
      /* 3 pasos = 0,1 s simulados: al mismo ritmo que el tiempo real (antes iba ~6 veces más deprisa) */
      await sleep(100 / (cmbRitmo() * (BT.speed || 1)));
      if (!BT) return;
      /* ONL */ if (BT.ctx.onl) BT.ctx.onl.estado();
    }
  }
  bui();
}
async function executeTurn() {
  if (!BT || BT.run || BT.mode === "rt") return;
  BT.run = true;
  /* ONL: batalla en vivo: espera los planes de los jugadores remotos; la IA solo lleva sus lados */
  const O = BT.ctx.onl;
  if (O && !O.listoTurno()) {
    BT.run = false;
    return;
  }
  cmbIATodos(O);
  bLog(`— Turno ${BT.turn} —`);
  bui();
  const n = BT.mode === "t3" ? 3 : 1;
  for (let s = 0; s < n; s++) {
    await runPhase(s);
    if (!BT || battleOver() >= 0) break;
  }
  if (!BT) return;
  cmbHitoCorte();
  BT.turn++;
  BT.run = false;
  for (const u of BT.units)
    u.plan.forEach((p) => {
      if (p.o && p.o.tg == null) p.o = null;
      else if (p.o && !fighting(bU(p.o.tg) || {})) p.o = null;
    });
  BT.slot = 0;
  const r = battleOver();
  if (r >= 0) {
    finishBattle(r);
    return;
  }
  /* ONL */ if (O) O.estado(true);
  bui();
  if (BT.auto0 || (O && !(BT.mios || [0]).some((s) => O.ctrl[s] === "local"))) setTimeout(executeTurn, 200);
}
/* la IA da órdenes a los ejércitos que no manda nadie en este cliente (ni un jugador remoto) */
function cmbIATodos(O) {
  for (let s = 0; s < (BT.N || 2); s++) {
    const mioS = (BT.mios || [0]).includes(s);
    if (O ? O.ctrl[s] === "ia" || (mioS && BT.auto0) : !mioS || BT.auto0) aiOrders(s);
  }
}
async function realtime() {
  if (!BT || BT.run) return;
  BT.run = true;
  let last = performance.now(),
    acc = 0,
    ui = 0;
  while (BT && BT.mode === "rt") {
    await new Promise((r) => requestAnimationFrame(r));
    if (!BT) return;
    const now = performance.now(),
      el = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (BT.paused) continue;
    acc += el * BT.speed * cmbRitmo();
    while (acc >= 1 / 30) {
      acc -= 1 / 30;
      simStep(1 / 30, 0);
      BT.aiT -= 1 / 30;
      if (BT.aiT <= 0) {
        cmbIATodos(BT.ctx.onl); /* ONL: solo los lados de la IA */
        BT.aiT = 1.2;
      }
    }
    if ((ui += el) > 0.4) {
      ui = 0;
      /* ONL */ if (BT.ctx.onl) BT.ctx.onl.estado(true);
      bui();
      const r = battleOver();
      if (r >= 0) {
        BT.run = false;
        finishBattle(r);
        return;
      }
    }
  }
}
/* fin: persecución, heridos que vuelven, informe y regreso a la campaña.
   win: bando ganador (número) o, por compatibilidad, booleano «gana el lado 0»; retreat: el jugador se retira */
function finishBattle(win, retreat) {
  if (!BT) return;
  const N = BT.N || 2,
    lados = [...Array(N).keys()],
    b0 = cmbBnd(0),
    w =
      typeof win === "number"
        ? win
        : win
          ? b0
          : cmbBandosDe()
              .filter((b) => b !== b0)
              .sort((a, b) => cmbRatioB(b) - cmbRatioB(a))[0],
    noche = BT.noche && !retreat,
    ganaU = BT.units.filter((u) => cmbBnd(u.side) === w && fighting(u)),
    huye = (s) => retreat && cmbBnd(s) !== w;
  cmbHitoCorte();
  const mPrev = BT.hitos[BT.hitos.length - 1]?.m || lados.map(() => 50);
  if (!noche) {
    const P = ganaU.reduce((a, u) => a + u.n * cmbPers(u.t) * (1 - u.fat / 200), 0),
      perd = lados.filter((s) => cmbBnd(s) !== w),
      caidos = lados.map(() => 0);
    for (const s of perd) {
      const pierdeU = BT.units.filter((u) => u.side === s && u.n > 0),
        N2 = pierdeU.reduce((a, u) => a + u.n * (u.gone ? 0.5 : 1), 0),
        Pp = P / perd.length,
        k = Math.min(
          N2,
          Math.max(N2 * 0.08, Math.min(N2 * 0.5, Pp * CMBA_K.pers * (0.85 + R() * 0.3))) *
            (huye(s) ? 0.4 : 1),
        ),
        pesos = pierdeU.map((u) => u.n * (cmbCab(u.t) ? 0.45 : 1) * (u.gone ? 0.5 : 1)),
        sp = pesos.reduce((a, b) => a + b, 0) || 1;
      pierdeU.forEach((u, i) => {
        const d = Math.min(u.n, Math.round((k * pesos[i]) / sp));
        u.n -= d;
        u.muertos += Math.round(d * 0.75);
        u.her += d - Math.round(d * 0.75);
        caidos[s] += d;
      });
    }
    const caen = caidos.reduce((a, b) => a + b, 0),
      ganS = lados.filter((s) => cmbBnd(s) === w);
    for (const s of ganS) cmbTal(s, "persecucion", caen / ganS.length);
    if (caen)
      BT.hitos.push({
        r: BT.hitos.length + 1,
        f: retreat ? "Retirada" : "Persecución",
        t: retreat
          ? `Ordenas la retirada; el enemigo hostiga a la columna y caen ${caen}.`
          : `Desbandada en las filas de ${perd.map((s) => CIV[BT.ejs[BT.map[s]].f].s).join(" y ")}: caen ${caen} en la persecución.`,
        b: caidos,
        m: lados.map((s) => (cmbBnd(s) === w ? mPrev[s] || 50 : 0)),
      });
  } else
    BT.hitos.push({
      r: BT.hitos.length + 1,
      f: "Anochecer",
      t: `Cae la noche: las tropas de ${lados
        .filter((s) => cmbBnd(s) !== w)
        .map((s) => CIV[BT.ejs[BT.map[s]].f].s)
        .join(" y ")} no logran romper al enemigo y se retiran.`,
      b: lados.map(() => 0),
      m: mPrev,
    });
  const rec = lados.map((s) => (cmbBnd(s) === w ? 0.6 : noche ? 0.45 : huye(s) ? 0.35 : 0.25)),
    out = lados.map(() => cmbVacio()),
    merS = lados.map(() => undefined),
    bajas = lados.map(() => ({ m: 0, h: 0, r: 0 }));
  for (const s of lados) {
    const sv = {};
    for (const u of BT.units.filter((u) => u.side === s)) {
      const vu = u.her * rec[s];
      sv[u.t] = (sv[u.t] || 0) + u.n + vu;
      bajas[s].m += u.muertos + u.her - vu;
      bajas[s].h += u.her;
      bajas[s].r += vu;
    }
    const ejS = BT.ejs[BT.map[s]],
      mm = BT.ctx.merma && ejS && ejS.mer !== undefined;
    if (mm) merS[s] = 0;
    for (const t in sv) {
      const x = sv[t] / SPU;
      if (mm) {
        const c = Math.ceil(x - 1e-6);
        out[s][t] = c;
        merS[s] += Math.max(0, c * SPU - sv[t]);
      } else out[s][t] = Math.floor(x) + (R() < x % 1 ? 1 : 0);
    }
    if (mm) merS[s] = Math.round(merS[s]);
  }
  /* de lados del campo al orden de los ejércitos recibidos */
  const m = BT.map,
    ej = (arr) => m.map((_, i) => arr[m.indexOf(i)]),
    gana = w,
    bandosEj = ej(lados.map(cmbBnd)),
    L = ej(lados).map((s, i) => ({
      s: i,
      bando: bandosEj[i],
      f: BT.ejs[i].f,
      gen: BT.gens[s].id,
      n0: BT.init[s],
    })),
    informe = {
      f: BT.ejs.map((e) => e.f),
      gana,
      fin: noche ? "noche" : retreat ? "retirada" : "rotura",
      rondas: BT.hitos.map((h) => ({ ...h, b: ej(h.b), m: ej(h.m) })),
      factores: cmbFactores(ej(BT.tal), gana, L),
      bajas: ej(bajas),
      gen: ej(BT.gens.map((g) => g.res)),
      gens: ej(BT.gens.map((g) => g.id)),
      n0: ej(BT.init),
      clima: BT.env.clima,
      hora: BT.env.hora,
      terreno: CMBA_TERR[BT.env.terr.tag] || BT.env.terr.tag,
      fort: BT.fort,
      def: BT.def != null ? m[BT.def] : null,
      flancos: BT.flancos || 1,
      asedio: BT.ctx.asedio || 0,
      lugar: BT.place,
      anio: G ? G.year : 0,
      modo: BT.mode,
      dur: Math.round(BT.t),
    };
  if (N > 2 || bandosEj.some((b, i) => b !== i)) informe.bandos = bandosEj;
  const outE = ej(out),
    bajE = ej(bajas),
    merE = ej(merS),
    res = {
      gana,
      A: outE[0],
      D: outE[1],
      heridos: { A: Math.round(bajE[0].r), D: Math.round(bajE[1].r) },
      mer: { A: merE[0], D: merE[1] },
      informe,
      gen: informe.gen,
      ejs: BT.ejs.map((e, i) => ({
        id: e.id,
        f: e.f,
        bando: bandosEj[i],
        gana: bandosEj[i] === gana,
        A: outE[i],
        u: outE[i],
        heridos: Math.round(bajE[i].r),
        her: Math.round(bajE[i].r),
        mer: merE[i],
        bajas: bajE[i],
        gen: informe.gen[i],
      })),
    },
    done = BT.done,
    pl = BT.place,
    yo = m[(BT.mios || [0])[0] ?? 0],
    gano = (BT.bandoYo ?? 0) === gana,
    auto = BT.ctx.auto && BT.ctx.sinModal,
    emitir = BT.emitir,
    ejs = BT.ejs,
    ctx = BT.ctx;
  /* ONL */ if (BT.ctx.onl) BT.ctx.onl.fin(res);
  BT = null;
  $("battle").classList.remove("show");
  music("camp");
  if (emitir) cmbEmitirMulti(ejs, res, ctx, informe.modo);
  if (auto) {
    done(res);
    return;
  }
  modal(gano ? `Victoria en ${pl}` : `Derrota en ${pl}`, cmbInfHtml(informe, yo), [
    { t: "Continuar", cls: "gold" },
  ]).then(() => done(res));
}
/* asalto por varios flancos (ctx.flancos): parte de los atacantes escala la muralla por los costados,
   ya del lado de la plaza, y avanza despacio al principio */
function cmbAsaltoFlancos() {
  const k = BT.flancos || 1,
    M = BT.muro;
  if (k < 2 || !M || BT.def == null || M.x0 == null) return;
  /* los lienzos por los que ya llegan ejércitos atacantes son flancos; se escala por otros k-1 lienzos */
  const ladosAt = new Set(
      [...Array(BT.N || 2).keys()].filter((s) => cmbBnd(s) !== cmbBnd(BT.def)).map(cmbLadoDe).filter((l) => CMB_NOR[l]),
    ),
    caras = ["N", "S", "E", "O"].filter((c) => !ladosAt.has(c)).slice(0, k - 1),
    /* punto medio de un lienzo, desplazado a lo largo (a) y hacia fuera (o) */
    pto = (l, a, o) => {
      const n = CMB_NOR[l];
      return l === "N" || l === "S" ? { x: M.cx + a, y: (l === "N" ? M.y0 : M.y1) + n[1] * o } : { x: (l === "O" ? M.x0 : M.x1) + n[0] * o, y: M.cy + a };
    },
    at = BT.units
      .filter((u) => cmbBnd(u.side) !== cmbBnd(BT.def) && fighting(u) && u.cs.cl !== "asd" && !(u.gen && u.n <= SPU) && !tirador(u))
      .sort((a, b) => b.n - a.n);
  let n = 0;
  for (const c of caras)
    for (let r = 0; r < 2 && n < at.length; r++, n++) {
      const u = at[n],
        q = pto(c, r ? 3 : -3, 1.8);
      u.x = clamp(q.x, 0.5, BW - 0.5);
      u.y = clamp(q.y, 0.5, BH - 0.5);
      u.escala = 8;
      u.plan.forEach((p) => (p.o = null));
    }
  /* la guarnición se reparte: una o dos unidades a cada lienzo amenazado */
  const amen = ["N", "S", "E", "O"].filter((c) => caras.includes(c) || ladosAt.has(c)),
    dfs = BT.units
      .filter((u) => cmbBnd(u.side) === cmbBnd(BT.def) && fighting(u) && !tirador(u) && !(u.gen && u.n <= SPU))
      .sort((a, b) => a.n - b.n);
  let j = 0;
  for (const c of amen)
    for (let r = 0; r < 1 + (dfs.length > 4 ? 1 : 0) && j < dfs.length - 1; r++, j++) {
      const u = dfs[j],
        q = pto(c, r ? 3 : -3, -1.2);
      u.x = q.x;
      u.y = q.y;
    }
  if (n || j)
    bHito(
      "",
      3,
      `Asalto por ${k} flancos: ${n ? n + " unidades escalan otros lienzos" : "los atacantes cercan la plaza"}; la guarnición se reparte.`,
      cmbBnd(BT.def) === (BT.bandoYo ?? 0) ? "bad" : "good",
    );
}
function slotStart(u, sl) {
  let x = u.x,
    y = u.y;
  for (let i = 0; i < sl; i++) {
    const o = u.plan[i].o;
    if (o && o.tg == null) {
      x = o.x;
      y = o.y;
    } else if (o) {
      const t = bU(o.tg);
      if (t) {
        const L = Math.hypot(t.x - x, t.y - y) || 1,
          m = Math.min(reach(u), L - 1);
        x += ((t.x - x) / L) * m;
        y += ((t.y - y) / L) * m;
      }
    }
  }
  return { x, y };
}
function battleAct(v) {
  if (!BT) return;
  const ix = v.indexOf(":"),
    a = ix < 0 ? v : v.slice(0, ix),
    x = ix < 0 ? "" : v.slice(ix + 1),
    u = bU(BT.sel);
  /* ONL */ if (BT.espejo && typeof onlEspejoAccion === "function" && onlEspejoAccion(a, x)) return;
  const pend = (s) => BT.lleg && BT.lleg[s] > 0;
  if (a === "auto")
    for (const s of BT.mios || [0])
      if (!pend(s))
        deploy(
          s,
          BT.units.some((o) => o.side === s && o.x < 0),
        );
  if (a === "go" && BT.phase === "deploy") {
    for (const s of BT.mios || [0])
      if (!pend(s) && BT.units.some((o) => o.side === s && o.x < 0)) deploy(s, true);
    cmbAsaltoFlancos();
    BT.phase = "plan";
    bLog(
      BT.mode === "rt"
        ? "¡Comienza la batalla! Toca una unidad y luego el destino o un enemigo."
        : "Tus tropas forman. Mueve cada unidad con el dedo y elige su postura.",
    );
    if (BT.mode === "rt") {
      cmbIATodos(BT.ctx.onl);
      realtime();
    } else if (BT.auto0) setTimeout(executeTurn, 100);
  }
  if (a === "hab" && BT.phase === "plan") {
    const us = selU().filter((o) => cmbHabPuede(o, x));
    us.forEach((o) => cmbHabUsar(o, x, BTB));
    if (!us.length) bLog("La habilidad aún no está lista.");
  }
  if (a === "cap") {
    BT.auto0 = !BT.auto0;
    bLog(BT.auto0 ? "Delegas el mando en tus capitanes." : "Retomas el mando de tus tropas.");
    if (BT.auto0 && BT.phase === "plan") {
      aiOrders(0);
      if (BT.mode !== "rt" && !BT.run) setTimeout(executeTurn, 100);
    }
  }
  if (a === "sel") {
    BT.sel = +x;
    BT.sels = [+x];
    fixSlot();
  }
  /* ⚔︎ = atacar cuerpo a cuerpo; arco = atacar a distancia (solo tropas con alcance) */
  if (a === "atk") {
    BT.atk = BT.atk === true ? false : true;
    if (BT.atk && !selU().length) BT.atk = false;
  }
  if (a === "dis") {
    BT.atk = BT.atk === "dis" ? false : "dis";
    if (BT.atk && !selU().some(cmbPuedeTirar)) BT.atk = false;
    if (BT.atk) bLog("Elige el blanco: toca una unidad enemiga para atacarla a distancia.");
  }
  if (a === "selall") {
    BT.sels = BT.units.filter((o) => mio(o) && fighting(o)).map((o) => o.id);
    BT.sel = BT.sels[0] ?? null;
    fixSlot();
  }
  if (a === "slot") BT.slot = +x;
  if (a === "st") {
    const [i, s] = x.split(".");
    selU().forEach((o) => {
      o.plan[+i].st = s;
      if (BT.mode !== "t3") o.plan.forEach((p) => (p.st = s));
    });
  }
  if (a === "clr") {
    selU().forEach((o) => (o.plan[+x].o = null));
    BT.slot = +x;
  }
  if (a === "same" && u)
    BT.units
      .filter((o) => mio(o) && o.t === u.t)
      .forEach((o) => o.plan.forEach((p, i) => (p.st = u.plan[i].st)));
  if (a === "zoom") {
    batZoom(bzoom * (x === "in" ? 1.4 : 1 / 1.4));
    return;
  }
  if (a === "exec") executeTurn();
  if (a === "pause") BT.paused = !BT.paused;
  if (a === "spd") BT.speed = BT.speed === 1 ? 2 : BT.speed === 2 ? 4 : BT.speed === 4 ? 0.5 : 1;
  if (a === "flee") {
    finishBattle(false, true);
    return;
  }
  bui();
}
const bar = (v, c) => `<div class="bar"><i style="width:${clamp(v, 0, 100)}%;background:${c}"></i></div>`;
/* Icono de arco en pixel art para el botón «A distancia» */
const CMB_ICO_ARCO =
  '<svg class="ico-arco" viewBox="0 0 10 10" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">' +
  '<g fill="#c8894a"><rect x="2" y="0" width="2" height="1"/><rect x="1" y="1" width="2" height="1"/><rect x="1" y="2" width="1" height="6"/><rect x="1" y="8" width="2" height="1"/><rect x="2" y="9" width="2" height="1"/></g>' +
  '<g fill="#e8e2d0"><rect x="3" y="1" width="1" height="8"/></g>' +
  '<g fill="#f2c14e"><rect x="4" y="4" width="5" height="1"/><rect x="8" y="3" width="1" height="3"/><rect x="7" y="2" width="1" height="1"/><rect x="7" y="6" width="1" height="1"/></g></svg>';
/* ¿la unidad puede disparar (tiene alcance)? aunque se haya quedado sin munición */
const cmbPuedeTirar = (u) => !!(u && u.cs && u.cs.al > 0);
function ordTxt(o) {
  if (!o) return "Quieto";
  if (o.tg != null) {
    const t = bU(o.tg);
    const nm = t ? " " + CIV[t.f].un[t.t].toLowerCase() : "";
    return (o.dis ? "Disparar a" : o.cc ? "Cargar contra" : "Atacar") + nm;
  }
  return "Marchar";
}
/* botones de habilidad de la unidad elegida (activas) y texto de las pasivas */
function cmbHabBotones(u) {
  if (!u.hab || !u.hab.length) return "";
  return `<div class="btns cmb-hab">${u.hab
    .map((h) => {
      const D = CMB_HAB[h.id];
      if (D.pasiva) return `<span class="stats" title="${esc(D.d)}">${D.n} (pasiva)</span>`;
      const est =
        h.t > 0
          ? ` · ${Math.ceil(h.t)} s`
          : h.b > 0
            ? " · bajón"
            : h.n >= (D.usos || 99)
              ? " · gastada"
              : h.cd > 0
                ? ` · ${Math.ceil(h.cd)} s`
                : "";
      return `<button data-act="b-hab:${h.id}" class="${h.t > 0 ? "on" : ""}" title="${esc(D.d)}" ${cmbHabPuede(u, h.id) && BT.phase === "plan" ? "" : "disabled"}>${D.n}${est}</button>`;
    })
    .join("")}</div>`;
}
/* estado legible de una unidad */
function cmbEstado(o) {
  if (o.desb > 0) return "¡desbocados!";
  if (o.rout) return "huyendo";
  const ha = (o.hab || []).find((h) => h.t > 0);
  if (ha) return CMB_HAB[ha.id].n.toLowerCase();
  if ((o.hab || []).some((h) => h.b > 0)) return "flaquean";
  if (o.mor < o.morMax * 0.35) return "vacila";
  if (o.fat > 75) return "exhausta";
  if (o.eng) return o.flk ? "flanqueada" : "en melé";
  return STN[o.plan[0].st].toLowerCase();
}
const cmbMini = (o) =>
  `<b class="cmb-mb"><i style="width:${clamp((o.mor / o.morMax) * 100, 0, 100)}%;background:${o.mor < o.morMax * 0.35 ? "#e0503f" : "#5b97f0"}"></i></b><b class="cmb-mb"><i style="width:${clamp(o.fat, 0, 100)}%;background:#e8b632"></i></b>`;
function bui() {
  if (!BT) return;
  const ab = $("atkb");
  if (ab) ab.classList.toggle("on", BT.atk === true);
  const db = $("disb");
  if (db) {
    const tir = BT.phase !== "deploy" && selU().some(cmbPuedeTirar);
    db.hidden = !tir;
    db.classList.toggle("on", BT.atk === "dis");
    db.disabled = !tir || !selU().some((x) => cmbPuedeTirar(x) && x.ammo > 0);
    db.title = db.disabled && tir ? "Sin munición" : "Atacar a distancia: elige la tropa enemiga";
  }
  const me = BT.units.filter((u) => mio(u) && act(u)),
    u = bU(BT.sel),
    c = $("bside"),
    E = BT.env,
    nS = (s) => BT.units.filter((u) => u.side === s).reduce((a, u) => a + u.n, 0),
    fS = (s) => (BT.ejs && BT.map ? BT.ejs[BT.map[s]].f : s ? BT.fd : BT.fa),
    ejTxt = cmbBandosDe()
      .map((b) =>
        [...Array(BT.N || 2).keys()]
          .filter((s) => cmbBnd(s) === b)
          .map(
            (s) =>
              `<span style="color:${CIV[fS(s)].c}">${CIV[fS(s)].s} ${nS(s)}${BT.espera && BT.espera[s] ? " (aguarda)" : ""}</span>`,
          )
          .join(" y "),
      )
      .join(" contra ");
  let h = `<h2>Batalla de ${BT.place}</h2><p class="dim">${ejTxt}${BT.fort ? " · murallas " + BT.fort : ""}${BT.flancos > 1 ? " · " + BT.flancos + " flancos" : ""}<br>`;
  const tope = cmbTopeResta();
  h += `${MODES[BT.mode]}${BT.mode === "rt" ? ` · ${Math.floor(BT.t)} / ${BT.lim} s` : ` · turno ${BT.turn} / ${BT.lim}`} · ${E.clima}${tope < Infinity ? ` · <b class="${tope < 60 ? "bad" : ""}">quedan ${Math.floor(Math.max(0, tope) / 60)}:${String(Math.floor(Math.max(0, tope) % 60)).padStart(2, "0")}</b>` : ""}</p>`;
  if (BT.phase === "deploy") {
    h += `<p>${BT.muro && BT.muro.x0 != null ? (cmbBnd((BT.mios || [0])[0]) === cmbBnd(BT.def) ? "Defiendes la plaza: coloca tus unidades dentro de la muralla (la zona clara). Arqueros junto al lienzo, la línea detrás y la caballería al fondo, lista para salir por una puerta." : "Asedio: despliega en cualquier punto alrededor de la plaza (la zona clara). Arietes a las puertas, torres y escalas contra los lienzos, catapultas a tiro de la muralla; rodearla reparte a la guarnición.") : "Arrastra tus unidades dentro de la franja clara. Lanceros al frente frenan la caballería; arqueros detrás; caballería en las alas. Bosque: cubre y frena jinetes. Colina: mejor tiro y defensa. Río: frena y debilita; usa los vados."}</p><div class="g2"><button data-act="b-auto">Despliegue automático</button><button data-act="b-go" class="gold">¡A la batalla!</button></div>`;
  } else {
    const SG = selU();
    if (SG.length > 1)
      h += `<h3>${SG.length} unidades seleccionadas · ${SG.reduce((a, o) => a + o.n, 0)} soldados</h3><p class="stats">La postura se aplica a todas. Toca el terreno para moverlas en formación o ⚔︎ y un enemigo para atacar juntas.</p>`;
    if (u && mio(u) && act(u)) {
      const fm = Math.max(0.5, 1 - u.fat / 220);
      h += `<h3>${SG.length > 1 ? "Principal: " : ""}${CIV[u.f].un[u.t]} · ${u.n}/${u.n0}${u.gen ? " · ⚑ general" : ""}${u.rout ? " · ¡HUYENDO!" : ""}</h3>
  <div class="stats">${cmbInfo(u.t).tag} · ${cmbNivelVet(u.cs.xp).toLowerCase()} · ${cmbEstado(u)}<br>Ataque ${Math.round(u.cs.me * fm * 10) / 10}${u.cs.ca ? " · carga " + u.cs.ca : ""} · Defensa ${Math.round(u.cs.de * 10) / 10} · Armadura ${u.cs.ar}${u.cs.al ? ` · munición ${u.ammo}/${u.cs.mu}` : ""} · heridos ${u.her}</div>
  <div class="stats">Moral</div>${bar((u.mor / u.morMax) * 100, u.mor < u.morMax * 0.35 ? "#e0503f" : "#5b97f0")}<div class="stats">Cansancio</div>${bar(u.fat, "#e8b632")}`;
      if (cmbPuedeTirar(u) && !u.rout)
        h += `<div class="btns"><button data-act="b-dis" class="${BT.atk === "dis" ? "on" : ""}" ${u.ammo > 0 ? "" : "disabled"} title="Elige una tropa enemiga para atacarla a distancia">${CMB_ICO_ARCO} A distancia</button><button data-act="b-atk" class="${BT.atk === true ? "on" : ""}" title="Cargar cuerpo a cuerpo">⚔︎ Cuerpo a cuerpo</button></div>`;
      const n = BT.mode === "t3" ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const p = u.plan[i];
        h += `<div class="slot" ${BT.mode === "t3" && BT.slot === i ? 'style="outline:2px solid var(--gold);outline-offset:3px"' : ""}><span>${BT.mode === "t3" ? `<button data-act="b-slot:${i}" class="${BT.slot === i ? "on" : ""}" style="min-height:34px;font-size:8px;padding:4px">Acción ${i + 1}</button>` : "Postura"}</span><div><div class="btns">${Object.keys(
          STN,
        )
          .map(
            (k) => `<button data-act="b-st:${i}.${k}" class="${p.st === k ? "on" : ""}">${STN[k]}</button>`,
          )
          .join(
            "",
          )}${p.o ? `<button data-act="b-clr:${i}">Quieto</button>` : ""}</div><span class="stats">${ordTxt(p.o)}</span></div></div>`;
      }
      h += cmbHabBotones(u);
      h += `<div class="btns"><button data-act="b-same">Misma postura para todos los ${CIV[u.f].un[u.t].toLowerCase()}</button></div>`;
    }
    h += `<p class="note">Toca una unidad para elegirla; mantén pulsada otra para sumarla, o mantén pulsado el terreno y arrastra para rodear varias. Luego toca el destino (o arrastra) y ⚔︎ + enemigo para atacar.${BT.mode === "rt" ? "" : " Las tropas no pasan de su círculo de alcance."}${BT.mode === "t3" ? " Cada arrastre llena la siguiente acción." : ""}</p>`;
    h +=
      BT.mode === "rt"
        ? `<div class="g3"><button data-act="b-pause" class="gold">${BT.paused ? "Reanudar" : "Pausa"}</button><button data-act="b-spd">Velocidad ×${BT.speed}</button><button data-act="b-flee" class="red">Retirada</button></div>`
        : `<div class="g2"><button data-act="b-exec" class="gold" ${BT.run ? "disabled" : ""}>${BT.run ? "Combatiendo…" : "Ejecutar turno"}</button><button data-act="b-flee" class="red" ${BT.run ? "disabled" : ""}>Retirada</button></div>`;
    h += `<div class="btns"><button data-act="b-cap" class="${BT.auto0 ? "on" : ""}">${BT.auto0 ? "Retomar el mando" : "Delegar en los capitanes"}</button></div>`;
    h += `<h3>Tus unidades</h3><div class="ulist">${me.map((o) => `<button data-act="b-sel:${o.id}" class="${(BT.sels || []).includes(o.id) ? "on" : ""}${o.rout ? " cmb-rt" : ""}">${CIV[o.f].un[o.t]} ${o.n}/${o.n0}${o.gen ? " ⚑" : ""}<br><span class="stats">${cmbEstado(o)}</span>${cmbMini(o)}</button>`).join("")}</div>`;
  }
  /* ONL */ if (BT.onlMsg) h += `<p class="onl-esp">${BT.onlMsg}</p>`;
  h += `<ul id="blog">${BT.log.map((l) => `<li style="border-color:${l.c === "good" ? "#4caf50" : l.c === "bad" ? "#e0503f" : ""}">${l.m}</li>`).join("")}</ul>`;
  c.innerHTML = h;
}
let drag = null,
  lp = null,
  bzoom = innerWidth < 700 ? 2 : 1.2;
bc.style.width = bzoom * 100 + "%";
setTimeout(() => {
  const z = $("bzl");
  if (z) z.textContent = Math.round(bzoom * 100) + "%";
}, 0);
const bxy = (e) => {
  const b = bc.getBoundingClientRect();
  return { x: ((e.clientX - b.left) / b.width) * BW, y: ((e.clientY - b.top) / b.height) * BH };
};
const hitAt = (x, y) =>
  BT.units
    .filter((u) => act(u) && u.x >= 0 && Math.hypot(u.x - x, u.y - y) < rad(u) + 0.25)
    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
const canOrder = () =>
  BT.phase === "plan" &&
  (BT.mode === "rt" || !BT.run) &&
  !(BT.ctx.onl && !(BT.mios || [0]).some((s) => BT.ctx.onl.ctrl[s] === "local")); /* ONL */
/* ONL: ¿usa la IA las habilidades de ese lado? (en vivo, el lado de un jugador remoto las elige él) */
function cmbHabIALado(s) {
  const O = BT.ctx && BT.ctx.onl;
  const mioS = (BT.mios || [0]).includes(s);
  if (!O) return !mioS || BT.auto0;
  return O.ctrl[s] === "ia" || (mioS && BT.auto0);
}
const selU = () => (BT.sels || []).map(bU).filter((u) => u && act(u) && mio(u));
const buzz = () => {
  try {
    navigator.vibrate && navigator.vibrate(15);
  } catch (_) {}
};
function fixSlot() {
  if (BT.mode !== "t3") {
    BT.slot = 0;
    return;
  }
  const ix = selU()
    .map((u) => u.plan.findIndex((p) => !p.o))
    .map((i) => (i < 0 ? 2 : i));
  BT.slot = ix.length ? Math.min(...ix) : 0;
}
function toggleSel(id) {
  BT.sels = BT.sels.includes(id) ? BT.sels.filter((i) => i !== id) : [...BT.sels, id];
  BT.sel = BT.sels[BT.sels.length - 1] ?? null;
  fixSlot();
}
function groupSlots(us, tx, ty) {
  if (us.length === 1) return [{ u: us[0], x: tx, y: ty }];
  const cx = us.reduce((s, u) => s + u.x, 0) / us.length,
    cy = us.reduce((s, u) => s + u.y, 0) / us.length;
  let dx = tx - cx,
    dy = ty - cy,
    L = Math.hypot(dx, dy);
  if (L < 0.01) {
    dx = 1;
    dy = 0;
    L = 1;
  }
  dx /= L;
  dy /= L;
  const px = -dy,
    py = dx,
    out = [];
  const rows = [us.filter((u) => u.cs.cl !== "dis"), us.filter((u) => u.cs.cl === "dis")].filter(
    (r) => r.length,
  );
  const ch = [];
  for (const r of rows) for (let i = 0; i < r.length; i += 6) ch.push(r.slice(i, i + 6));
  ch.forEach((row, ri) => {
    row.sort((a, b) => a.x * px + a.y * py - (b.x * px + b.y * py));
    const w = row.reduce((s, u) => s + rad(u) * 2 + 0.25, 0);
    let off = -w / 2;
    for (const u of row) {
      const r = rad(u);
      off += r + 0.125;
      const back = -ri * 2;
      out.push({
        u,
        x: clamp(tx + px * off + dx * back, 0.5, BW - 0.5),
        y: clamp(ty + py * off + dy * back, 0.5, BH - 0.5),
      });
      off += r + 0.125;
    }
  });
  return out;
}
function setOrder(u, o, sl) {
  if (o.tg == null && BT.mode !== "rt") {
    const st = slotStart(u, sl),
      dx = o.x - st.x,
      dy = o.y - st.y,
      L = Math.hypot(dx, dy),
      mx = reach(u);
    if (L > mx) {
      o.x = st.x + (dx / L) * mx;
      o.y = st.y + (dy / L) * mx;
    }
  }
  if (o.tg == null) {
    o.x = clamp(o.x, 0.5, BW - 0.5);
    o.y = clamp(o.y, 0.5, BH - 0.5);
  }
  u.plan[sl].o = o;
}
function orderGroup(o) {
  const us = selU().filter((u) => !u.rout);
  if (!us.length || !canOrder()) return;
  const sl = BT.mode === "t3" ? BT.slot : 0;
  if (o.tg != null) {
    /* a distancia: solo obedecen las tropas que pueden tirar; el resto sigue con su orden */
    const quien = o.dis ? us.filter(cmbPuedeTirar) : us;
    quien.forEach((u) => {
      const ord = { tg: o.tg };
      if (o.dis) ord.dis = 1;
      else if (o.cc && cmbPuedeTirar(u)) ord.cc = 1;
      setOrder(u, ord, sl);
    });
    const t = bU(o.tg),
      nm = CIV[t.f].un[t.t].toLowerCase();
    bLog(
      o.dis
        ? `${quien.length > 1 ? quien.length + " unidades disparan" : "Orden de disparar"} contra ${nm}.`
        : `${quien.length > 1 ? quien.length + " unidades atacan" : "Orden de ataque contra"} ${nm}.`,
    );
  } else {
    const cx = us.reduce((s, u) => s + u.x, 0) / us.length,
      cy = us.reduce((s, u) => s + u.y, 0) / us.length;
    groupSlots(us, o.x, o.y).forEach((g) => setOrder(g.u, { x: g.x, y: g.y }, sl));
    BT.arrow = { x0: cx, y0: cy, x1: o.x, y1: o.y, t0: performance.now() };
  }
  if (BT.mode === "t3" && BT.slot < 2) BT.slot++;
  BT.atk = false;
  bui();
}
function tapAt(x, y, shift) {
  const hit = hitAt(x, y),
    s = bU(BT.sel);
  if (BT.phase === "deploy") {
    if (hit && mio(hit)) {
      BT.sel = hit.id;
      BT.sels = [hit.id];
    } else if (s && mio(s) && !hit && cmbColocar(s, x, y)) {
      const nx = BT.units.find((o) => mio(o) && o.x < 0);
      if (nx) {
        BT.sel = nx.id;
        BT.sels = [nx.id];
      }
    }
    bui();
    return;
  }
  if (hit && mio(hit)) {
    if (shift) toggleSel(hit.id);
    else {
      BT.sels = [hit.id];
      BT.sel = hit.id;
      fixSlot();
    }
    BT.atk = false;
    bui();
    return;
  }
  if (!selU().length || !canOrder()) return;
  if (hit && !aliado(hit)) {
    orderGroup({ tg: hit.id, cc: BT.atk === true ? 1 : 0, dis: BT.atk === "dis" ? 1 : 0 });
    return;
  }
  /* tocar un aliado que no es tuyo: como tocar el terreno junto a él */
  if (BT.atk) {
    BT.atk = false;
    bLog("Ataque cancelado: toca una unidad enemiga.");
    bui();
    return;
  }
  orderGroup({ x, y });
}
const bp = { pts: new Map(), pinch: null };
function batZoom(z, cx, cy) {
  bzoom = clamp(z, 1, 5);
  const w = $("bscroll");
  if (cx == null) {
    const r = w.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }
  zoomAt(w, bc, bzoom, cx, cy);
  $("bzl").textContent = Math.round(bzoom * 100) + "%";
}
bc.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    batZoom(bzoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  },
  { passive: false },
);
bc.addEventListener("pointerdown", (e) => {
  bp.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (bp.pts.size === 2) {
    clearTimeout(lp);
    drag = null;
    bp.pinch = { d0: pinchDist(bp.pts), z0: bzoom };
    return;
  }
  if (bp.pts.size > 2) return;
  if (!BT) return;
  const p = bxy(e),
    h = hitAt(p.x, p.y),
    sc = $("bscroll");
  drag = {
    cx: e.clientX,
    cy: e.clientY,
    x0: p.x,
    y0: p.y,
    x: p.x,
    y: p.y,
    h: h ? h.id : null,
    mine: !!(h && mio(h)),
    sl: sc.scrollLeft,
    st: sc.scrollTop,
    mode: null,
  };
  clearTimeout(lp);
  lp = setTimeout(() => {
    if (!drag || drag.mode || !BT) return;
    if (drag.mine && BT.phase === "plan") {
      toggleSel(drag.h);
      drag.mode = "done";
      buzz();
      bui();
    } else if (!drag.h && BT.phase === "plan") {
      drag.mode = "box";
      buzz();
    }
  }, 420);
  try {
    bc.setPointerCapture(e.pointerId);
  } catch (_) {}
});
bc.addEventListener("pointermove", (e) => {
  if (bp.pts.has(e.pointerId)) bp.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (bp.pinch && bp.pts.size >= 2) {
    const m = pinchMid(bp.pts);
    batZoom((bp.pinch.z0 * pinchDist(bp.pts)) / bp.pinch.d0, m.x, m.y);
    return;
  }
  if (!drag || !BT) return;
  const p = bxy(e);
  drag.x = p.x;
  drag.y = p.y;
  const mv = Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy) > 8;
  if (!drag.mode && mv) {
    clearTimeout(lp);
    if (drag.mine && (BT.phase === "deploy" || canOrder())) {
      drag.mode = "unit";
      if (!BT.sels.includes(drag.h)) {
        BT.sels = [drag.h];
        BT.sel = drag.h;
        fixSlot();
      }
    } else drag.mode = "pan";
  }
  if (drag.mode === "pan") {
    const sc = $("bscroll");
    sc.scrollLeft = drag.sl - (e.clientX - drag.cx);
    sc.scrollTop = drag.st - (e.clientY - drag.cy);
  }
});
bc.addEventListener("pointerup", (e) => {
  bp.pts.delete(e.pointerId);
  if (bp.pinch) {
    if (bp.pts.size < 2) bp.pinch = null;
    drag = null;
    return;
  }
  clearTimeout(lp);
  if (!BT || !drag) return;
  const d = drag;
  drag = null;
  const p = bxy(e);
  if (d.mode === "pan" || d.mode === "done") return;
  if (d.mode === "box") {
    const x0 = Math.min(d.x0, p.x),
      x1 = Math.max(d.x0, p.x),
      y0 = Math.min(d.y0, p.y),
      y1 = Math.max(d.y0, p.y);
    const ids = BT.units
      .filter(
        (u) =>
          mio(u) &&
          act(u) &&
          !u.rout &&
          u.x + rad(u) >= x0 &&
          u.x - rad(u) <= x1 &&
          u.y + 0.6 >= y0 &&
          u.y - 0.6 <= y1,
      )
      .map((u) => u.id);
    if (ids.length) {
      BT.sels = ids;
      BT.sel = ids[0];
      fixSlot();
      buzz();
    }
    bui();
    return;
  }
  if (d.mode === "unit") {
    if (BT.phase === "deploy") {
      const u = bU(d.h);
      if (u) cmbColocar(u, p.x, p.y);
      bui();
      return;
    }
    const h = hitAt(p.x, p.y);
    if (h && !aliado(h)) orderGroup({ tg: h.id });
    else orderGroup({ x: p.x, y: p.y });
    return;
  }
  tapAt(p.x, p.y, e.shiftKey);
});
bc.addEventListener("pointercancel", (e) => {
  bp.pts.delete(e.pointerId);
  if (bp.pts.size < 2) bp.pinch = null;
  clearTimeout(lp);
  drag = null;
});
function ghost(c, u, x, y, col) {
  const r = rad(u) * TS;
  c.strokeStyle = col;
  c.setLineDash([2, 2]);
  c.beginPath();
  c.ellipse(x * TS, y * TS + 3, r + 2, r * 0.55 + 3, 0, 0, 7);
  c.stroke();
  c.setLineDash([]);
  const f = formation(u);
  c.fillStyle = col;
  for (const so of f)
    if (so.k % 2 === 0) c.fillRect(Math.round(x * TS + so.x), Math.round(y * TS + so.y), 1, 1);
}
function arrow(c, x0, y0, x1, y1, col) {
  const X0 = x0 * TS,
    Y0 = y0 * TS,
    X1 = x1 * TS,
    Y1 = y1 * TS,
    a = Math.atan2(Y1 - Y0, X1 - X0);
  c.strokeStyle = col;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(X0, Y0);
  c.lineTo(X1, Y1);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(X1 + Math.cos(a) * 6, Y1 + Math.sin(a) * 6);
  c.lineTo(X1 + Math.cos(a + 2.5) * 8, Y1 + Math.sin(a + 2.5) * 8);
  c.lineTo(X1 + Math.cos(a - 2.5) * 8, Y1 + Math.sin(a - 2.5) * 8);
  c.fill();
  c.lineWidth = 1;
}

/* caché de sprites ya pintados (se vacía si la interfaz cambia sprF por PNG) */
const CMB_SC = { fn: null, m: new Map() };
function cmbSprC(rows, f, fl) {
  if (CMB_SC.fn !== sprF) {
    CMB_SC.fn = sprF;
    CMB_SC.m.clear();
  }
  let q = CMB_SC.m.get(rows);
  if (!q) CMB_SC.m.set(rows, (q = {}));
  const k = f * 2 + (fl ? 1 : 0);
  if (!q[k]) {
    const cv = document.createElement("canvas");
    cv.width = rows[0].length;
    cv.height = rows.length;
    sprF(cv.getContext("2d"), rows, 0, 0, PAL[f], fl);
    q[k] = cv;
  }
  return q[k];
}
/* figuras por soldado (solo visual): la infantería y los tiradores en dos filas por hombre, para dar la
   masa de un ejército grande; con muchas tropas en el campo vuelve a una por hombre */
const cmbDens = (u) => (u.cs.cl === "asd" || UN[u.t].rol === "ele" || cmbCab(u.t) ? 1 : BT.dens || 1);
/* huecos fijos en filas y columnas; las bajas dejan claros en la formación (orden de caída por unidad) */
function cmbSlots(u) {
  const d = cmbDens(u);
  if (u._sl && u._sl.d === d) return u._sl;
  const nf0 = cmbFig(u, u.n0) * d,
    sq = Math.sqrt(d),
    cols = Math.max(1, Math.round(fcols(u) * sq)),
    [dx0, dy0] = cmbPaso(u),
    dx = Math.max(2, dx0 / sq),
    dy = Math.max(2, dy0 / sq),
    rows = Math.ceil(nf0 / cols),
    sl = [],
    rn = mul(u.id * 977 + 13);
  for (let k = 0; k < nf0; k++) {
    const rr = Math.floor(k / cols),
      cn = Math.min(cols, nf0 - rr * cols);
    sl.push({
      x: ((k % cols) - (cn - 1) / 2) * dx + (rr % 2 ? dx * 0.4 : 0),
      y: (rr - (rows - 1) / 2) * dy,
      k,
      rr,
    });
  }
  /* caen antes las primeras filas (con azar) */
  const orden = sl
    .map((o) => [o.k, Math.abs(o.rr - (rows - 1) / 2) * -0.2 + rn()])
    .sort((a, b) => a[1] - b[1])
    .map((o) => o[0]);
  return (u._sl = { d, sl, orden, nf0, rows, cols, dy });
}
/* DATOS PARA EL RENDER (p. ej. Batalla 3D): foto plana del campo en coordenadas de mundo (casillas).
   Ver docs/combate.md, «Datos para el render». */
function cmbRender() {
  if (!BT) return null;
  const M = BT.muro;
  return {
    t: BT.t,
    fase: BT.phase,
    modo: BT.mode,
    campo: {
      w: BW,
      h: BH,
      terr: BT.terr,
      muro: M ? { ...M, rota: !!M.rota } : null,
      lados: BT.lados || ["O", "E"],
    },
    ejercitos: [...Array(BT.N || 2).keys()].map((s) => ({
      lado: s,
      f: BT.ejs && BT.map ? BT.ejs[BT.map[s]].f : s ? BT.fd : BT.fa,
      bando: cmbBnd(s),
      dir: cmbLadoDe(s),
      mio: (BT.mios || [0]).includes(s),
      aguarda: !!(BT.espera && BT.espera[s]),
      llega: (BT.lleg && BT.lleg[s]) || 0,
      general: BT.gens && BT.gens[s] ? { id: BT.gens[s].id, ok: BT.gens[s].ok } : null,
    })),
    unidades: BT.units
      .filter((u) => u.n > 0 && !u.gone && !(u.lleg > 0) && u.x >= 0)
      .map((u) => {
        const SL = cmbSlots(u),
          vivas = Math.ceil(cmbFig(u) * SL.d),
          estado = u.rout
            ? "huida"
            : u.eng
              ? "combate"
              : u.dispT != null && BT.t - u.dispT < 1.5
                ? "disparo"
                : performance.now() - (u.mvT || 0) < 200
                  ? "marcha"
                  : "quieto";
        return {
          id: u.id,
          lado: u.side,
          bando: cmbBnd(u.side),
          f: u.f,
          t: u.t,
          clase: UN[u.t].cl,
          x: u.x,
          y: u.y,
          vx: u.vx ?? u.x,
          vy: u.vy ?? u.y,
          eje: u.ax || "x",
          cara: u.face,
          volteo: !!(u.flv ?? (u.ax === "y" ? u.flx : u.face < 0)),
          adarve: !!u.adarve,
          filas: SL.rows,
          columnas: SL.cols,
          figuras: vivas,
          figuras0: SL.nf0,
          caidas: SL.orden.slice(0, Math.max(0, SL.nf0 - vivas)),
          huecos: SL.sl.map((o) => [o.x / TS, o.y / TS]),
          estado,
          obj: u.objId ?? null,
          carga: u.charge > 0,
          gen: !!u.gen,
          n: u.n,
          n0: u.n0,
          moral: clamp(u.mor / u.morMax, 0, 1),
          cansancio: u.fat / 100,
          postura: u.st,
          habilidad: ((u.hab || []).find((h) => h.t > 0) || {}).id || null,
          desbocados: u.desb > 0,
          mio: mio(u),
        };
      }),
    fx: BT.fx,
    muertos: BT.dead,
  };
}
function formation(u) {
  const cols = fcols(u),
    [dx, dy] = cmbPaso(u),
    nf = cmbFig(u),
    rows = Math.ceil(nf / cols),
    out = [];
  for (let k = 0; k < nf; k++) {
    const r = Math.floor(k / cols),
      cn = Math.min(cols, nf - r * cols);
    out.push({ x: ((k % cols) - (cn - 1) / 2) * dx + (r % 2 ? 1.5 : 0), y: (r - (rows - 1) / 2) * dy, k });
  }
  return out;
}
/* barra de tamaño de las unidades que no son aliadas: un color por bando */
const CMB_COL_B = ["#ff8a7a", "#ffb35c", "#e48cff", "#ff8a7a", "#ffb35c", "#e48cff", "#ff6f6f", "#ff8a7a"];
function drawBattle(now) {
  const c = bcx;
  c.drawImage(BT.bg, 0, 0);
  /* muralla: integridad arriba y brecha cuando cae */
  const MU = BT.muro;
  if (MU && MU.x0 != null) {
    const wx = MU.cx * TS,
      wy = MU.y0 * TS - 16,
      k = clamp(MU.hp / MU.hp0, 0, 1);
    c.fillStyle = "#000";
    c.fillRect(wx - 16, wy, 32, 5);
    c.fillStyle = k > 0.5 ? "#cfc6b6" : k > 0 ? "#e8b632" : "#e0503f";
    c.fillRect(wx - 15, wy + 1, Math.round(30 * k), 3);
    /* brecha: escombros en el tramo del lienzo del frente */
    if (MU.rota && MU.brecha) {
      const B = MU.brecha,
        vert = B.l === "O" || B.l === "E",
        L = (B.l === "O" ? MU.x0 : B.l === "E" ? MU.x1 : B.l === "N" ? MU.y0 : MU.y1) * TS;
      for (let v = B.a * TS; v < B.b * TS; v += 4) {
        c.fillStyle = (v / 4) % 2 ? "#6d6250" : "#857c6b";
        if (vert) c.fillRect(L - 7 + ((v * 7) % 5), v, 14, 3);
        else c.fillRect(v, L - 7 + ((v * 7) % 5), 3, 14);
      }
    }
  }
  c.lineWidth = 1;
  if (BT.phase === "deploy") {
    /* zonas de despliegue: la tuya clara; las de los demás, teñidas (ver cmbZona: en un asedio la
       guarnición dentro del recinto y los atacantes, en el anillo de alrededor) */
    const vistas = new Set();
    for (let sd = 0; sd < (BT.N || 2); sd++) {
      const rs = cmbZonaRects(sd),
        key = JSON.stringify(rs) + (BT.mios || [0]).includes(sd);
      if (vistas.has(key)) continue;
      vistas.add(key);
      c.fillStyle = (BT.mios || [0]).includes(sd)
        ? "rgba(255,255,255,.13)"
        : cmbBnd(sd) === (BT.bandoYo ?? 0)
          ? "rgba(120,220,200,.1)"
          : "rgba(255,80,60,.1)";
      for (const z of rs) c.fillRect(z[0] * TS, z[1] * TS, z[2] * TS, z[3] * TS);
    }
  }
  for (const d of BT.dead) {
    if (d.std) {
      c.drawImage(cmbSprC(MS.bat_estandarte[0], d.f, false), d.x, d.y);
      continue;
    }
    c.fillStyle = CIV[d.f].d;
    c.fillRect(d.x, d.y, 5, 2);
    c.fillStyle = BP.h;
    c.fillRect(d.x + 5, d.y, 2, 2);
    c.fillStyle = "#7a1c14";
    c.fillRect(d.x + 1, d.y + 2, 2, 1);
  }
  const s = bU(BT.sel),
    SG = selU();
  c.font = '8px "Press Start 2P",monospace';
  c.textBaseline = "top";
  if (BT.phase === "plan" && BT.mode !== "rt" && !BT.run)
    for (const q of SG.length > 3 ? [s].filter(Boolean) : SG) {
      const sl = BT.mode === "t3" ? BT.slot : 0,
        st = slotStart(q, sl);
      c.setLineDash([3, 3]);
      c.strokeStyle = "rgba(255,255,255,.7)";
      c.beginPath();
      c.arc(st.x * TS, st.y * TS, reach(q) * TS, 0, 7);
      c.stroke();
      c.setLineDash([]);
    }
  if (s && act(s) && mio(s) && BT.phase === "plan" && BT.mode !== "rt" && !BT.run) {
    c.setLineDash([3, 3]);
    if (tirador(s)) {
      c.strokeStyle = "rgba(255,210,90,.6)";
      c.beginPath();
      c.arc(s.x * TS, s.y * TS, alc(s) * TS, 0, 7);
      c.stroke();
    }
    c.setLineDash([]);
  }
  if (BT.phase === "plan")
    for (const u of BT.units) {
      if (!mio(u) || !act(u) || u.rout) continue;
      let px = u.x,
        py = u.y;
      const n = BT.mode === "t3" ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const o = u.plan[i].o;
        if (!o) continue;
        let nx, ny;
        if (o.tg != null) {
          const t = bU(o.tg);
          if (!t) continue;
          nx = t.x;
          ny = t.y;
          c.strokeStyle = "#ff5a4a";
          c.beginPath();
          c.ellipse(t.x * TS, t.y * TS + 3, 15, 10, 0, 0, 7);
          c.stroke();
        } else {
          nx = o.x;
          ny = o.y;
        }
        c.strokeStyle = u.id === BT.sel ? "#f2c14e" : "rgba(242,193,78,.5)";
        c.beginPath();
        c.moveTo(px * TS, py * TS);
        c.lineTo(nx * TS, ny * TS);
        c.stroke();
        if (o.tg == null) ghost(c, u, nx, ny, u.id === BT.sel ? "#f2c14e" : "rgba(242,193,78,.6)");
        if (n > 1) {
          c.fillStyle = "#f2c14e";
          c.fillText(String(i + 1), nx * TS + 4, ny * TS - 10);
        }
        px = nx;
        py = ny;
      }
    }
  if (drag && drag.mode === "unit" && BT.phase === "plan" && SG.length) {
    const cx = SG.reduce((a, u) => a + u.x, 0) / SG.length,
      cy = SG.reduce((a, u) => a + u.y, 0) / SG.length,
      h = hitAt(drag.x, drag.y);
    if (h && !aliado(h)) {
      arrow(c, cx, cy, h.x, h.y, "#ff5a4a");
    } else {
      arrow(c, cx, cy, drag.x, drag.y, "#8fd18a");
      for (const g of groupSlots(SG, drag.x, drag.y)) ghost(c, g.u, g.x, g.y, "#8fd18a");
    }
  }
  if (drag && drag.mode === "unit" && BT.phase === "deploy") {
    const u = bU(drag.h);
    if (u) {
      const q = cmbAZona(u.side, drag.x, drag.y);
      ghost(c, u, q.x, q.y, "#8fd18a");
    }
  }
  if (drag && drag.mode === "box") {
    c.strokeStyle = "#fff";
    c.setLineDash([3, 2]);
    c.strokeRect(
      Math.min(drag.x0, drag.x) * TS,
      Math.min(drag.y0, drag.y) * TS,
      Math.abs(drag.x - drag.x0) * TS,
      Math.abs(drag.y - drag.y0) * TS,
    );
    c.setLineDash([]);
    c.fillStyle = "rgba(255,255,255,.08)";
    c.fillRect(
      Math.min(drag.x0, drag.x) * TS,
      Math.min(drag.y0, drag.y) * TS,
      Math.abs(drag.x - drag.x0) * TS,
      Math.abs(drag.y - drag.y0) * TS,
    );
  }
  if (BT.arrow && now - BT.arrow.t0 < 1800) {
    c.globalAlpha = 1 - (now - BT.arrow.t0) / 1800;
    arrow(c, BT.arrow.x0, BT.arrow.y0, BT.arrow.x1, BT.arrow.y1, "#f2c14e");
    c.globalAlpha = 1;
  }
  if (BT.atk) {
    c.fillStyle = "rgba(255,60,40,.08)";
    c.fillRect(0, 0, BW * TS, BH * TS);
  }
  /* polvo de la caballería */
  BT.polvo = (BT.polvo || []).filter((q) => now - q.t0 < 900);
  for (const q of BT.polvo) {
    const k = (now - q.t0) / 900;
    c.fillStyle = `rgba(190,170,120,${0.35 * (1 - k)})`;
    c.fillRect(
      Math.round(q.x - 2 - k * 3),
      Math.round(q.y - 1 - k * 4),
      Math.round(4 + k * 6),
      Math.round(2 + k * 3),
    );
  }
  const dtv = Math.min(0.1, (now - (BT.tv || now)) / 1000);
  BT.tv = now;
  for (const u of BT.units.filter((u) => act(u) && u.x >= 0).sort((a, b) => a.y - b.y)) {
    /* posición dibujada: sigue a la simulada con inercia (las formaciones arrancan y frenan despacio) */
    if (u.vx == null || Math.hypot(u.vx - u.x, u.vy - u.y) > 1.6 || BT.phase === "deploy") {
      u.vx = u.x;
      u.vy = u.y;
    } else {
      const kk = 1 - Math.exp(-dtv * 7);
      u.vx += (u.x - u.vx) * kk;
      u.vy += (u.y - u.vy) * kk;
    }
    /* giros lentos: el sprite solo se voltea si la orientación se sostiene un momento */
    const fl0 = u.ax === "y" ? !!u.flx : u.face < 0;
    if (u.flv == null) u.flv = fl0;
    if (fl0 !== u.flv) {
      u.flT = (u.flT || 0) + dtv;
      if (u.flT > 0.35) {
        u.flv = fl0;
        u.flT = 0;
      }
    } else u.flT = 0;
    const X = Math.round(u.vx * TS),
      Y = Math.round(u.vy * TS),
      fl = u.flv,
      mov = now - (u.mvT || 0) < 150,
      fi = now - (u.fT || 0) < 300;
    c.fillStyle = "rgba(0,0,0,.22)";
    c.beginPath();
    const rr = rad(u) * TS;
    c.ellipse(X, Y + 5, rr + 2, rr * 0.55 + 3, 0, 0, 7);
    c.fill();
    if (BT.sels && BT.sels.includes(u.id)) {
      c.strokeStyle = u.id === BT.sel ? "#f2c14e" : "#ffe9a8";
      c.beginPath();
      c.ellipse(X, Y + 5, rr + 3, rr * 0.55 + 5, 0, 0, 7);
      c.stroke();
    }
    const SL = cmbSlots(u),
      vivas = Math.ceil(cmbFig(u) * SL.d),
      caidas = new Set(SL.orden.slice(0, Math.max(0, SL.nf0 - vivas))),
      fd = (u.rout ? 160 : 220) / cmbRitmo();
    for (const so of SL.sl) {
      if (caidas.has(so.k)) continue;
      const fr = mov || u.rout ? Math.floor(now / fd + so.k) % 2 : 0,
        jit = fi ? Math.round(Math.sin(now / 70 + so.k * 1.7) * 1.2) * (fl ? -1 : 1) : 0,
        rows = MS[u.t][fr],
        w = rows[0].length,
        sx = fl ? -so.x : so.x;
      c.drawImage(
        cmbSprC(rows, u.f, fl),
        Math.round(X + sx - w / 2 + jit),
        Math.round(Y + so.y - 5 + (mov && fr ? -1 : 0)),
      );
    }
    if (mov && cmbCab(u.t) && !BT.quiet && R() < 0.5)
      BT.polvo.push({ x: X + (fl ? 1 : -1) * (rad(u) * TS), y: Y + SL.rows * SL.dy * 0.5, t0: now });
    if (BT.polvo.length > 260) BT.polvo.splice(0, BT.polvo.length - 260);
    if (u.st === "def" && !u.rout) {
      c.fillStyle = "#e9e4da";
      const sx = X + (fl ? -rr - 3 : rr + 1);
      for (let k = -6; k <= 6; k += 3) c.fillRect(sx, Y + k, 2, 2);
    }
    const hh = (SL.rows * SL.dy) / 2,
      top = Math.round(Y - hh - 8);
    c.fillStyle = BP.k;
    c.fillRect(X - 1, top - 6, 1, 8);
    c.fillStyle = u.rout ? "#f4f4f4" : CIV[u.f].c;
    c.fillRect(fl ? X - 5 : X, top - 6, 4, 3);
    if (u.gen && BT.gens[u.side].ok) {
      c.fillStyle = "#f2c14e";
      c.fillRect(fl ? X - 5 : X, top - 3, 4, 1);
    }
    /* habilidad activa (oro) o en bajón (gris) */
    const hA = (u.hab || []).some((h) => h.t > 0),
      hB = (u.hab || []).some((h) => h.b > 0);
    if (hA || hB) {
      c.fillStyle = "#000";
      c.fillRect(X + (fl ? -11 : 6), top - 7, 5, 5);
      c.fillStyle = hA ? "#f2c14e" : "#8a8f98";
      c.fillRect(X + (fl ? -10 : 7), top - 6, 3, 3);
    }
    if (u.desb > 0) {
      c.fillStyle = "#ff5a4a";
      c.fillRect(X - 2, top - 12, 4, 4);
    }
    /* vacila: aviso parpadeante; huye: bandera blanca (arriba) */
    if (!u.rout && u.mor < u.morMax * 0.35 && Math.floor(now / 300) % 2) {
      c.fillStyle = "#000";
      c.fillRect(X + (fl ? 3 : -5), top - 8, 3, 8);
      c.fillStyle = "#ff5a4a";
      c.fillRect(X + (fl ? 4 : -4), top - 7, 1, 4);
      c.fillRect(X + (fl ? 4 : -4), top - 2, 1, 1);
    }
    const by = Math.round(Y + hh + 6);
    c.fillStyle = "#000";
    c.fillRect(X - 9, by, 18, 6);
    c.fillStyle = aliado(u)
      ? mio(u)
        ? "#8fd18a"
        : "#7fd4c8"
      : CMB_COL_B[(cmbBnd(u.side) + 7) % CMB_COL_B.length];
    c.fillRect(X - 9, by, Math.round((18 * u.n) / u.n0), 2);
    c.fillStyle = u.mor < u.morMax * 0.35 ? "#e0503f" : "#5b97f0";
    c.fillRect(X - 9, by + 2, Math.round(18 * clamp(u.mor / u.morMax, 0, 1)), 2);
    c.fillStyle = "#e8b632";
    c.fillRect(X - 9, by + 4, Math.round(18 * clamp(u.fat / 100, 0, 1)), 2);
  }
  for (const u of BT.units) {
    if (!act(u) || u.x < 0) continue;
    const X = Math.round(u.x * TS),
      Y = Math.round(u.y * TS),
      t = String(u.n),
      tx = u.face < 0 ? X - 6 - t.length * 8 : X + 5,
      ty = Math.round(Y - (Math.ceil(cmbFig(u) / fcols(u)) * cmbPaso(u)[1]) / 2 - 16);
    c.fillStyle = "#000";
    c.fillText(t, tx + 1, ty + 1);
    c.fillStyle = "#fff";
    c.fillText(t, tx, ty);
  }
  BT.fx = BT.fx.filter((f) => now - f.t0 < 900);
  for (const f of BT.fx) {
    const k = (now - f.t0) / 900;
    if (k < 0) continue;
    if (f.arrow) {
      if (k > 0.4) continue;
      const q = k / 0.4,
        x = (f.x0 + (f.x - f.x0) * q) * TS,
        y = (f.y0 + (f.y - f.y0) * q) * TS - Math.sin(q * Math.PI) * 14;
      c.fillStyle = "#f6f0dc";
      c.fillRect(x - 1, y, 3, 1);
      c.fillStyle = "#6b4a2a";
      c.fillRect(x - 2, y, 1, 1);
    } else {
      c.fillStyle = "#000";
      c.fillText(f.txt, f.x * TS - 5, f.y * TS - 30 - k * 10);
      c.fillStyle = f.c;
      c.fillText(f.txt, f.x * TS - 6, f.y * TS - 31 - k * 10);
    }
  }
}
