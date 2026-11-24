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
};
const cmbaFxTxt = (k) => (k.startsWith("hab:") ? (CMB_HAB[k.slice(4)] || {}).n : CMBA_FX[k]);
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
function cmbLado(s, ej, ctx, env) {
  const f = ej.f,
    lado = s ? "defensor" : "atacante",
    gc = ej.gen != null && G.C[ej.gen] && G.C[ej.gen].alive !== false ? G.C[ej.gen] : null,
    lv = gc ? cmbNivelXp(gc.xp) : 0,
    /* OC 'bonoBatalla': multiplicador del daño. ctx {f, lado, p} */
    bono = OC.calc("bonoBatalla", 1, { f, lado, p: ctx.p || null }) || 1,
    hambre = ej.hambre != null ? ej.hambre : !!(G.F[f] && G.F[f].food <= 0),
    as = s === 1 && ctx.asedio ? Math.min(20, ctx.asedio * 4) : 0,
    bl = [];
  for (const t of TYP) {
    const n = (ej.u[t] || 0) * SPU;
    if (n <= 0 || !UN[t]) continue;
    const st = cmbStats(f, t, cmbOrigenP(f, t, ej.ori, ctx.p), lado, (ej.vet && ej.vet[t]) || 0),
      mx =
        st.mo +
        (gc ? gc.ma * 1.5 + (lv - 1) * 1.5 : 0) +
        (s === 1 && ctx.fort ? 3 + ctx.fort * 3 : 0) -
        (hambre ? 10 : 0) -
        as;
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
    gen: gc ? gc.id : null,
    g: gc ? 1 + gc.ma * 0.04 + (lv - 1) * 0.015 : 1,
    ma: gc ? gc.ma : 0,
    lv,
    gOk: !!gc,
    bono,
    suerte: 0.62 + (R() + R()) * 0.38,
    hambre,
    bl,
    n0: bl.reduce((a, b) => a + b.n, 0),
    /* sin las máquinas: su dotación no sostiene la moral de la línea */
    nl0: bl.filter((b) => b.cl !== "asd").reduce((a, b) => a + b.n, 0),
    flank: 0,
    fdicho: false,
    cont: 0,
    roto: false,
  };
}
/* ONL: dificultad de la IA (ctx.dificultad = ['normal'|'dificil', ...] por ejA/ejD). En la automática el
   bando «difícil» emplea mejor sus fuerzas: +6 % de daño y de moral y algo más de fortuna. */
function cmbDificultadAuto(L, ctx) {
  const D = ctx && ctx.dificultad;
  if (!D) return L;
  for (const s of [0, 1])
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
/* reparte un objetivo según preferencias de doctrina */
function cmbObjetivo(b, ene, frente, fort) {
  let tot0 = 0;
  const w = ene.map((e) => {
    let k = 1;
    if (e.cl === "asd")
      k = !fort ? 0.03 : b.cl === "dis" || b.cl === "asd" ? (e.t === "ari" ? 2.5 : 1.5) : 0.6;
    else if (e.cl === "dis" || (e.t === "m" && e.ammo > 0)) {
      if (b.cl === "cab") k = 2.2;
      else k = frente > 0 ? (b.cl === "dis" ? 0.8 : 0.35) : 1.5;
    } else if (b.cl === "dis") k = e.cl === "inf" ? 1.2 : 1;
    const v = e.n * k;
    tot0 += v;
    return v;
  });
  return ene.map((e, i) => [e, tot0 ? w[i] / tot0 : 0]);
}
function cmbResolverAuto(ejA, ejD, ctx = {}) {
  /* ONL */ if (ctx.onlRes && !ctx.est) {
    const r = ctx.onlRes;
    ctx.onlRes = null;
    return r;
  }
  const env = cmbEntorno(ctx),
    est = !!ctx.est,
    fort = ctx.fort || 0,
    terr = env.terr,
    L = cmbDificultadAuto([cmbLado(0, ejA, ctx, env), cmbLado(1, ejD, ctx, env)], ctx) /* ONL */,
    fx = [{}, {}],
    ron = [],
    gen = [null, null],
    curva = {},
    calorClima = env.clima === "calor" ? 1.3 : 1;
  let fortE = fort,
    brecha = false,
    ev = [],
    r = 0;
  const di = (p, t) => ev.push([p, t]);
  for (const b of [...L[0].bl, ...L[1].bl]) {
    const nm = CIV[b.f].un[b.t].toLowerCase();
    b.nm =
      CIV[ejA.f].un[b.t] === CIV[ejD.f].un[b.t] && L[1 - b.s].bl.some((o) => o.t === b.t)
        ? `${nm} (${CIV[b.f].s})`
        : nm;
  }
  /* adaptador de habilidades: en la automática "cerca" significa trabados en la melé */
  const B = {
    auto: true,
    enemigos: (x, rad) => (rad >= 4 || r >= 2 ? cmbaVivos(L[1 - x.s]) : []),
    aliados: (x) => cmbaVivos(L[x.s]),
    bosque: () => terr.bosque || 0,
    enBosque: () => terr.bosque > 0.3,
    moralAliada: (x) => {
      const v = cmbaVivos(L[x.s]),
        n = cmbaSuma(v);
      return n ? v.reduce((a, b) => a + b.n * (b.mor / b.mx), 0) / n : 1;
    },
    log: (t, p) => di(p, t),
  };
  if (L[0].hambre) cmbAlza(fx, 1, "hambre", L[0].n0 * 0.04);
  if (L[1].hambre) cmbAlza(fx, 0, "hambre", L[1].n0 * 0.04);
  let fin = L[1].n0 <= 0 ? "vacio" : L[0].n0 <= 0 ? "vacio" : "",
    gana = L[1].n0 <= 0 && L[0].n0 > 0 ? 0 : 1;
  for (r = 1; !fin && r <= env.rmax; r++) {
    ev = [];
    const dano = new Map(),
      golpe = (tg, v) => dano.set(tg, (dano.get(tg) || 0) + v),
      susto = new Map(),
      veneno = new Set();
    for (const X of L)
      for (const b of X.bl) {
        b.perd = 0;
        b._morPrev = b.mor;
        b.tiroso = cmbaVivos(L[1 - X.s]).some(cmbaTirador);
      }
    /* habilidades: cada bando las usa con criterio */
    for (const X of L) for (const b of cmbaVivos(X)) cmbHabIA(b, B);
    for (const X of L) for (const b of X.bl) b._morPrev = b.mor;
    const HM = new Map();
    for (const X of L) for (const b of X.bl) HM.set(b, cmbHabMod(b));
    /* asedio: catapultas y arietes abren brecha; las torres anulan parte del bono de las murallas */
    let torre = 0;
    if (fort && !brecha) {
      const maq = cmbaVivos(L[0]).filter((b) => UN[b.t].sitio);
      let baja = 0;
      for (const b of maq) {
        const S = UN[b.t].sitio;
        if (S.brecha && (b.t !== "ari" || r >= 2) && (!b.st.mu || b.ammo > 0))
          baja += S.brecha * (b.n / SPU) * cmbaRnd();
        if (S.torre && r >= 2) torre += S.torre * (b.n / SPU);
      }
      torre = Math.min(0.75, torre);
      if (baja > 0) {
        fortE = Math.max(0, fortE - baja);
        cmbAlza(fx, 0, "asedio", baja * L[1].n0 * 0.05);
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
        cmbAlza(fx, 0, "asedio", torre * L[1].n0 * 0.1);
        di(3, "Las torres de asedio alcanzan el adarve.");
      }
      if (fortE <= fort * 0.15) {
        brecha = true;
        fortE = 0;
        for (const b of L[1].bl) b.mor -= 10;
        di(5, "¡Brecha en la muralla! Los defensores retroceden.");
      }
    }
    const fM = fortE * (1 - torre),
      murMel = (tg) => (tg.s === 1 && fM > 0 ? 1 / (1 + 0.18 * fM) : 1),
      murDis = (tg) => (tg.s === 1 && fM > 0 ? 1 / (1 + 0.25 * fM) : 1);
    /* espanto: camellos y elefantes encabritan a los caballos enemigos */
    const espanto = [0, 1].map((s) => {
      const v = cmbaVivos(L[s]),
        n = cmbaSuma(v);
      return n && cmbaSuma(v.filter((b) => cmbHabTiene(b, "espanto"))) >= n * 0.08;
    });
    /* flanqueo: caballería libre o superioridad numérica que desborda la línea */
    if (r >= 3)
      for (const s of [0, 1]) {
        const O = L[s],
          E = L[1 - s],
          cab = (X) =>
            cmbaVivos(X)
              .filter((b) => b.cl === "cab" && UN[b.t].rol !== "m")
              .reduce((a, b) => a + b.n * (b.t === "k" ? 1.3 : b.t === "x" ? 0.9 : 1), 0),
          fr = (X) => cmbaSuma(cmbaVivos(X).filter(cmbaCuerpo)),
          cE = cab(E),
          cO = cab(O),
          fE = fr(E),
          fO = Math.max(1, fr(O));
        let fc = 0,
          fn = 0;
        /* la caballería solo rodea si su propia infantería fija al enemigo de frente */
        const fija = clamp(cmbaSuma(cmbaVivos(E).filter((b) => b.cl === "inf")) / fO, 0, 1);
        if (cE > cO * 1.5 && cE > 0.12 * cmbaSuma(cmbaVivos(E)))
          fc = clamp((cE - cO * 1.5) / (fO + cO), 0, 0.6) * fija;
        if (fE > fO * 1.4) fn = clamp((fE / fO - 1.4) * 0.25, 0, 0.4);
        const m = (s === 1 && fM > 0 ? 0.3 : 1) * (terr.bosque > 0.3 ? 0.6 : 1);
        O.flank = Math.min(0.8, (fc + fn) * m);
        O.fc = fc * m;
        O.fn = fn * m;
        if (O.flank > 0.15 && !O.fdicho) {
          O.fdicho = true;
          const v = cmbaVivos(O)
              .filter(cmbaCuerpo)
              .sort((a, b) => b.n - a.n)[0],
            c = cmbaVivos(E)
              .filter((b) => b.cl === "cab")
              .sort((a, b) => b.n - a.n)[0];
          if (v)
            di(
              3,
              fc >= fn && c
                ? `Los ${cmbaNom(c)} flanquean a los ${cmbaNom(v)}; su moral se tambalea.`
                : `Las tropas de ${CIV[E.f].s} desbordan por su número la línea de los ${cmbaNom(v)}.`,
            );
        }
      }
    /* proyectiles: en la primera ronda dos descargas; luego por encima de la melé */
    const proy = [0, 0];
    for (const s of [0, 1]) {
      const O = L[s],
        E = L[1 - s],
        ene = cmbaVivos(E);
      if (!ene.length) continue;
      const frente = cmbaSuma(ene.filter(cmbaCuerpo));
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
          (s === 1 ? 1 + terr.colina * 0.4 : 1) *
          (terr.bosque > 0.3 ? 0.75 : 1) *
          (b.cl === "asd" && !fort ? 0.4 : 1);
        cmbAlza(fx, s, "mando", (v * (O.g - 1)) / O.g);
        cmbAlza(fx, s, "bono", (v * (O.bono - 1)) / O.bono);
        if (s === 1 && terr.colina)
          cmbAlza(fx, 1, "terreno", (v * terr.colina * 0.4) / (1 + terr.colina * 0.4));
        for (const [tg, w] of cmbObjetivo(b, ene, frente, fort)) {
          if (!w) continue;
          const tm = HM.get(tg),
            esc =
              hm.fuego || b.t === "cat"
                ? 0
                : Math.min(0.95, (tg.st.es + tm.es) * (1 - E.flank * 0.5) * (b.t === "h" ? 0.5 : 1)),
            arm = hm.fuego ? 1 : 10 / (10 + (tg.st.ar + tm.ar) * (b.t === "bal" ? 0.8 : 1.5)),
            mur = murDis(tg),
            x = v * w;
          golpe(tg, x * (1 - esc) * arm * mur);
          if (hm.veneno) veneno.add(tg);
          const dn = (x * (1 - esc) * arm * mur) / tg.st.vi;
          cmbAlza(fx, 1 - s, "armadura", (x * (1 - (1 - esc) * arm)) / tg.st.vi);
          if (mur < 1) cmbAlza(fx, 1, "murallas", (x * (1 - esc) * arm * (1 - mur)) / tg.st.vi);
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
      for (const s of [0, 1]) {
        const O = L[s],
          E = L[1 - s],
          ene = cmbaVivos(E);
        if (!ene.length) continue;
        const frente = cmbaSuma(ene.filter(cmbaCuerpo)),
          at = cmbaVivos(O).filter(
            (b) => cmbaCuerpo(b) || (b.cl !== "asd" && b.ammo <= 0 && (frente < 1 || r > 4)),
          ),
          ancho = clamp(
            (Math.max(frente, cmbaSuma(ene.filter((e) => e.cl !== "asd"))) * 1.1) / Math.max(1, cmbaSuma(at)),
            0.35,
            1,
          );
        for (const b of at) {
          const hm = HM.get(b),
            recarga = b.cl === "cab" && r > 2 && r % 3 === 2,
            choque = r === 2 || recarga || hm.carga > 1,
            vado = terr.rio && s === 0 && r === 2 ? 0.75 : 1,
            bosC = b.cl === "cab" ? 1 - 0.35 * terr.bosque : 1,
            atasco = b.cl === "cab" && !choque ? 0.85 : 1,
            asusta = UN[b.t].caballo && espanto[1 - s] ? 0.8 : 1;
          if (asusta < 1) {
            cmbAlza(fx, 1 - s, "espanto", b.n * 0.03);
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
            (s === 0 ? 1 - 0.25 * terr.colina : 1 + 0.1 * terr.colina);
          if (s === 0 && (vado < 1 || terr.colina))
            cmbAlza(fx, 1, "terreno", (base * (1 - vado * (1 - 0.25 * terr.colina))) / 10);
          cmbAlza(fx, s, "mando", (base * (O.g - 1)) / O.g / 10);
          cmbAlza(fx, s, "bono", (base * (O.bono - 1)) / O.bono / 10);
          cmbAlza(fx, s, "veterania", (base * (b.st.xp / 500)) / (1 + b.st.xp / 500) / 10);
          for (const h of b.hab)
            if (h.t > 0 && CMB_HAB[h.id].act.me > 1)
              cmbAlza(fx, s, "hab:" + h.id, (base * (1 - 1 / hm.me)) / 10);
          for (const [tg, w] of cmbObjetivo(b, ene, frente, fort)) {
            if (!w) continue;
            const tm = HM.get(tg);
            let cg =
              choque && b.st.ca
                ? (1 + b.st.ca * 0.11 * (recarga && b.t !== "x" ? 0.5 : 1) * (terr.bosque > 0.3 ? 0.4 : 1)) *
                  hm.carga
                : 1;
            if (cg > 1 && (UN[tg.t].rol === "l" || tm.antiCarga) && E.flank < 0.3) {
              const c2 = 1 + (cg - 1) * 0.2;
              cmbAlza(
                fx,
                1 - s,
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
            golpe(tg, x);
            if (hm.veneno) veneno.add(tg);
            /* el choque de una carga sacude la moral aunque cause pocas bajas */
            if (cg > 1.2)
              susto.set(tg, (susto.get(tg) || 0) + (cg - 1) * 22 * w * Math.min(1, b.n / Math.max(1, tg.n)));
            const down = x / tg.st.vi;
            cmbAlza(fx, s, "carga", down * (1 - 1 / cg));
            cmbAlza(fx, s, "flanqueo", (down * (E.fc || 0) * 0.5) / fl);
            cmbAlza(fx, s, "numero", (down * (E.fn || 0) * 0.5) / fl);
            cmbAlza(fx, 1 - s, "armadura", (down * (1 - arm)) / arm);
            cmbAlza(fx, s, "fatiga", down * (1 / fat - 1));
            if (tm.de > 1)
              for (const h of tg.hab) if (h.t > 0) cmbAlza(fx, 1 - s, "hab:" + h.id, down * (tm.de - 1));
            if (mur < 1) cmbAlza(fx, 1, "murallas", (down * (1 - mur)) / mur);
          }
        }
      }
    /* los fugitivos que aún no han salido del campo son acosados */
    for (const s of [0, 1]) {
      const cabE = cmbaVivos(L[1 - s]).some((b) => b.cl === "cab");
      for (const b of L[s].bl) if (b.rout && b.n > 0.5) golpe(b, b.n * b.st.vi * 0.05 * (cabE ? 1.5 : 0.5));
    }
    /* bestias desbocadas: con la moral rota, los elefantes pisotean a los suyos */
    for (const s of [0, 1])
      for (const b of cmbaVivos(L[s]))
        if (UN[b.t].rol === "ele" && b.mor < b.mx * 0.3 && R() < 0.35) {
          b.rout = true;
          const v = cmbaVivos(L[s]).filter((o) => o !== b),
            o = v[Math.floor(R() * v.length)];
          if (o) {
            const x = b.n * b.st.me * 0.6 * cmbaRnd();
            golpe(o, x);
            o.mor -= 12;
            cmbAlza(fx, 1 - s, "desbocados", x / o.st.vi + 5);
          }
          di(4, `¡Los ${cmbaNom(b)} se desbocan y pisotean a los suyos!`);
        }
    /* aplicar caídos: muertos y heridos */
    const caidos = [0, 0];
    for (const [tg, v] of dano) {
      const d = Math.min(tg.n, v / tg.st.vi),
        mf = tg.rout ? 0.75 : veneno.has(tg) ? 0.6 : 0.3;
      tg.n -= d;
      tg.dead += d * mf;
      tg.her += d * (1 - mf);
      tg.perd += d;
      caidos[tg.s] += d;
    }
    /* general en peligro */
    for (const s of [0, 1]) {
      const O = L[s],
        n = cmbaSuma(O.bl);
      if (!O.gOk || r < 2 || !n) continue;
      if (R() < 0.012 + (caidos[s] / n) * 0.45) {
        const muere = R() < 0.35,
          gc = G.C[O.gen];
        O.gOk = false;
        O.g = 1;
        gen[s] = muere ? "muerto" : "herido";
        for (const b of O.bl) b.mor -= muere ? 18 : 12;
        cmbAlza(fx, 1 - s, "general", O.n0 * 0.08);
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
    for (const s of [0, 1]) {
      const O = L[s],
        E = L[1 - s],
        nAll = cmbaSuma(O.bl.filter((b) => b.cl !== "asd")),
        cabE = cmbaVivos(E).some((b) => b.cl === "cab");
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
        if (r >= 2 && cmbaCuerpo(b)) dm += 2.5;
        if (b.fat > 60) dm += (b.fat - 60) * 0.08;
        dm += 10 * O.flank * (b.cl === "dis" ? 1.3 : 1);
        if (nAll < O.nl0 * 0.7) dm += 3;
        dm += O.cont * dis;
        if (O.gOk) dm -= O.ma * 0.35 + O.lv * 0.2;
        b.mor = Math.min(b.mx, b.mor - dm * (0.8 + R() * 0.4));
        cmbHabMoral(b, hm);
        const pel = r >= 2 && (cmbaCuerpo(b) || b.ammo <= 0),
          calor = UN[b.t].calor ? 1 : calorClima;
        b.fat = Math.min(
          100,
          Math.max(
            0,
            b.fat +
              (pel ? 9 : cmbaTirador(b) ? 3 : -3) * b.st.fa * hm.fat * calor +
              (r === 2 && b.cl === "cab" ? 4 : 0),
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
      O.cont = (roto0.filter((b) => b.s === s).reduce((a, b) => a + b.n, 0) / Math.max(1, nAll)) * 30;
    }
    /* habilidades: pasa el tiempo (10 s por ronda); curva de cada bloque para el informe y las pruebas */
    for (const X of L)
      for (const b of X.bl) {
        cmbHabTick(b, 10, B);
        if (b.hab.length && !est)
          (curva[b.t + X.s] = curva[b.t + X.s] || []).push(Math.round(b.st.me * cmbHabMod(b).me * 10) / 10);
      }
    /* ¿se desmorona algún bando? (las máquinas no sostienen la línea) */
    for (const s of [0, 1]) {
      const O = L[s],
        v = cmbaVivos(O).filter((b) => b.cl !== "asd"),
        nv = cmbaSuma(v),
        nt = cmbaSuma(O.bl.filter((b) => b.cl !== "asd"));
      if (nt < 1 || nv < nt * 0.3 || nv < O.nl0 * 0.12 || (!v.some(cmbaCuerpo) && nv < nt * 0.6))
        O.roto = true;
    }
    let fase = r === 1 ? (fort ? "Asalto" : "Escaramuza") : r === 2 ? "Choque" : "Melé";
    if (L[0].roto || L[1].roto) {
      gana =
        L[1].roto && !L[0].roto
          ? 0
          : L[0].roto && !L[1].roto
            ? 1
            : cmbaSuma(cmbaVivos(L[0])) / L[0].n0 > cmbaSuma(cmbaVivos(L[1])) / L[1].n0
              ? 0
              : 1;
      const W = L[gana],
        Lo = L[1 - gana];
      Lo.roto = true;
      W.roto = false;
      /* persecución */
      const P = cmbaVivos(W).reduce((a, b) => a + b.n * cmbPers(b.t) * (1 - b.fat / 200), 0),
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
      cmbAlza(fx, gana, "persecucion", k);
      const pc = cmbaVivos(W)
        .filter((b) => b.cl === "cab")
        .sort((a, b) => b.n * cmbPers(b.t) - a.n * cmbPers(a.t))[0];
      di(
        6,
        `Desbandada en las filas de ${CIV[Lo.f].s}: ${pc ? "los " + cmbaNom(pc) : "el enemigo"} persigue${pc ? "n" : ""} a los fugitivos; caen ${cmbH(k)}.`,
      );
      fase = "Desbandada";
      fin = "rotura";
    } else if (r >= env.rmax) {
      gana = 1;
      fin = "noche";
      fase = "Anochecer";
      di(6, `Cae la noche: las tropas de ${CIV[L[0].f].s} no logran romper al enemigo y se retiran.`);
    }
    if (!est) {
      ev.sort((a, b) => b[0] - a[0]);
      const avg = (O) => {
          const v = cmbaVivos(O).filter((b) => b.cl !== "asd"),
            n = cmbaSuma(v);
          return n ? (v.reduce((a, b) => a + b.n * (b.mor / b.mx), 0) / n) * 100 : 0;
        },
        gen0 =
          r === 1
            ? proy[0] + proy[1] > 1
              ? `${fort ? "Asalto a la muralla" : "Escaramuzas"}: ${cmbH(proy[0] + proy[1])} caen bajo flechas y piedras.`
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
        m: [avg(L[0]), avg(L[1])],
      });
    }
  }
  /* heridos: una parte vuelve a filas tras la batalla */
  const rec = [gana === 0 ? 0.6 : fin === "noche" ? 0.45 : 0.25, gana === 1 ? 0.6 : 0.25],
    out = [cmbVacio(), cmbVacio()],
    her = [0, 0],
    bajas = [
      { m: 0, h: 0, r: 0 },
      { m: 0, h: 0, r: 0 },
    ];
  for (const s of [0, 1]) {
    const sv = {};
    for (const b of L[s].bl) {
      const vu = b.her * rec[s];
      sv[b.t] = (sv[b.t] || 0) + b.n + vu;
      bajas[s].m += b.dead + b.her - vu;
      bajas[s].h += b.her;
      bajas[s].r += vu;
    }
    for (const t in sv) {
      const x = sv[t] / SPU;
      out[s][t] = Math.floor(x) + (R() < x % 1 ? 1 : 0);
    }
    her[s] = Math.round(bajas[s].r);
  }
  let informe = null;
  if (!est)
    informe = {
      f: [ejA.f, ejD.f],
      gana,
      fin,
      rondas: ron,
      factores: cmbFactores(fx, gana, L),
      bajas,
      gen,
      gens: [L[0].gen, L[1].gen],
      n0: [L[0].n0, L[1].n0],
      clima: env.clima,
      hora: env.hora,
      terreno: CMBA_TERR[env.terr.tag] || env.terr.tag,
      fort,
      brecha,
      asedio: ctx.asedio || 0,
      lugar: ctx.nombreLugar || (ctx.p && ctx.p.name) || "",
      anio: G.year,
      modo: "auto",
      curva,
    };
  return { gana, A: out[0], D: out[1], heridos: { A: her[0], D: her[1] }, informe, gen, brecha };
}
/* factores decisivos: los tres que más bajas causaron (o evitaron) al ganador y uno del perdedor.
   fx[s][clave] = soldados equivalentes; L[s] = {f, gen, n0} */
function cmbFactores(fx, gana, L) {
  const tx = [],
    lim = Math.max(2, (L[0].n0 + L[1].n0) * 0.012);
  for (const s of [gana, 1 - gana]) {
    const l = Object.entries(fx[s])
      .filter(([k, v]) => v > lim && cmbaFxTxt(k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, s === gana ? 3 : 1);
    for (const [k] of l)
      tx.push({
        k,
        s,
        txt: `${s === gana ? "" : "Pese a la derrota: "}${k === "mando" && L[s].gen != null && G.C[L[s].gen] ? "el mando de " + G.C[L[s].gen].n : cmbaFxTxt(k).toLowerCase()} (${CIV[L[s].f].s})`.replace(
          /^./,
          (c) => c.toUpperCase(),
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
const BW = 40,
  BH = 24,
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
function paintField(c, terr, fort, def) {
  const r = mul(ri(1, 1e6));
  for (let y = 0; y < BH; y++)
    for (let x = 0; x < BW; x++) {
      const t = terr[y][x],
        X = x * TS,
        Y = y * TS;
      c.fillStyle = t === 2 ? "#7c8850" : t === 3 ? "#2c5f8a" : t === 4 ? "#8fa37a" : "#5a983f";
      c.fillRect(X, Y, TS, TS);
      for (let k = 0; k < 9; k++) {
        c.fillStyle = t === 3 ? (r() < 0.5 ? "#4a86b8" : "#1f4a6e") : r() < 0.5 ? "#6aae49" : "#4b8434";
        c.fillRect(X + Math.floor(r() * TS), Y + Math.floor(r() * TS), t === 3 ? 3 : 1, 1);
      }
      if (t === 1)
        for (let k = 0; k < 3; k++) spr(c, SP.tree, X + Math.floor(r() * 14), Y + Math.floor(r() * 14), BP);
      if (t === 2) {
        spr(c, SP.hill, X + 2, Y + 4, BP);
        spr(c, SP.hill, X + 10, Y + 12, BP);
      }
    }
  if (fort) {
    const wx = (def ? 29.5 : 10.5) * TS;
    for (let y = 0; y < BH; y++) {
      if (y % 6 === 2 || y % 6 === 3) continue;
      const Y = y * TS;
      c.fillStyle = "#000";
      c.fillRect(wx - 5, Y, 10, TS);
      c.fillStyle = "#b7ad9a";
      c.fillRect(wx - 4, Y, 8, TS);
      c.fillStyle = "#857c6b";
      for (let k = 0; k < TS; k += 5) c.fillRect(wx - 4, Y + k, 8, 1);
      c.fillStyle = "#d8cfbd";
      c.fillRect(wx - 4 + (y % 2) * 4, Y, 4, 3);
    }
  }
}
function cmbCampo(env, fort, def) {
  const r = mul(ri(1, 1e9)),
    nz = noise(r, 9, 6),
    terr = [],
    tr = env.terr,
    fb = 0.7 - 0.3 * (tr.bosque || 0),
    fh = 0.18 + 0.3 * (tr.colina || 0);
  for (let y = 0; y < BH; y++) {
    terr.push([]);
    for (let x = 0; x < BW; x++) {
      const v = nz((x / BW) * 9, (y / BH) * 6);
      terr[y].push(x < 6 || x > BW - 7 ? 0 : v > fb ? 1 : v < fh ? 2 : 0);
    }
  }
  if (tr.rio) {
    const x0 = 17 + Math.floor(r() * 6),
      vados = [ri(2, 6), ri(9, 14), ri(17, 21)];
    for (let y = 0; y < BH; y++) {
      const x = Math.round(x0 + Math.sin(y / 3.5 + x0) * 1.5);
      const t = vados.some((v) => Math.abs(v - y) <= 1) ? 4 : 3;
      terr[y][x] = t;
      if (r() < 0.4) terr[y][x + 1] = t;
    }
  }
  if (fort) for (let y = 0; y < BH; y++) for (const x of def ? [28, 29, 30] : [9, 10, 11]) terr[y][x] = 0;
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
function cmbTactica(ejA, ejD, ctx = {}, mode = "rt") {
  return new Promise((done) => {
    const env = cmbEntorno(ctx),
      p = ctx.p || null,
      fort = ctx.fort || 0,
      map = ctx.jugador === 1 ? [1, 0] : [0, 1],
      ejs = [ejA, ejD],
      def = map.indexOf(1),
      terr = cmbCampo(env, fort, def),
      units = [],
      gens = [],
      bono = [],
      gbs = [];
    let id = 0;
    for (const side of [0, 1]) {
      const ej = ejs[map[side]],
        f = ej.f,
        u = ej.u,
        lado = side === def ? "defensor" : "atacante",
        gc = ej.gen != null && G.C[ej.gen] && G.C[ej.gen].alive !== false ? G.C[ej.gen] : null,
        hambre = ej.hambre != null ? ej.hambre : !!(G.F[f] && G.F[f].food <= 0),
        as = side === def && ctx.asedio ? Math.min(20, ctx.asedio * 4) : 0,
        ts = TYP.reduce((s, t) => s + (u[t] || 0) * SPU, 0),
        size = Math.max(20, Math.min(40, Math.ceil(ts / 14)));
      const lv = gc ? cmbNivelXp(gc.xp) : 0;
      gens.push({ id: gc ? gc.id : null, ok: !!gc, ma: gc ? gc.ma : 0, lv, res: null });
      gbs.push(gc ? 1 + gc.ma * 0.04 + (lv - 1) * 0.015 : 1);
      bono.push(OC.calc("bonoBatalla", 1, { f, lado, p }) || 1);
      for (const t of TYP) {
        let n = (u[t] || 0) * SPU;
        const cs = cmbStats(f, t, cmbOrigenP(f, t, ej.ori, p), lado, (ej.vet && ej.vet[t]) || 0),
          m =
            cs.mo +
            (gc ? gc.ma * 1.5 + (lv - 1) * 1.5 : 0) +
            (side === def && fort ? 6 + fort * 4 : 0) -
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
            face: side ? -1 : 1,
            plan: [0, 1, 2].map(() => ({
              o: null,
              st:
                cs.cl === "asd"
                  ? fort && side !== def
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
          : CIV[ejA.f].un[u.t] === CIV[ejD.f].un[u.t] && units.some((o) => o.side !== u.side && o.t === u.t)
            ? `${nm} (${CIV[u.f].s})`
            : nm;
    }
    const bg = document.createElement("canvas");
    bg.width = BW * TS;
    bg.height = BH * TS;
    paintField(bg.getContext("2d"), terr, fort, def);
    const lim = { t3: env.rmax, t1: Math.round(env.rmax * 2.5), rt: env.rmax * 25 }[mode];
    BT = {
      bg,
      dead: [],
      fa: ejs[map[0]].f,
      fd: ejs[map[1]].f,
      fort,
      def,
      map,
      ejs,
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
      tal: [{}, {}],
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
      muro: fort ? { hp: fort * 100, hp0: fort * 100, x: def ? 29.5 : 10.5 } : null,
      habT: 0,
      bono,
      auto0: !!ctx.auto,
      init: [
        units.filter((u) => !u.side).reduce((s, u) => s + u.n, 0),
        units.filter((u) => u.side).reduce((s, u) => s + u.n, 0),
      ],
      done,
      aiT: 0,
    };
    /* ONL: la IA difícil entra con un poco más de moral */
    if (ctx.dificultad)
      for (const u of units)
        if (ctx.dificultad[map[u.side]] === "dificil") {
          u.mor *= 1.06;
          u.morMax *= 1.06;
        }
    deploy(1);
    units.filter((u) => !u.side).forEach((u) => (u.x = -1));
    BT.sel = units.find((u) => !u.side)?.id ?? null;
    BT.sels = BT.sel == null ? [] : [BT.sel];
    BT.atk = false;
    bLog(
      `${env.hora[0].toUpperCase() + env.hora.slice(1)}, ${env.clima} · ${CMBA_TERR[env.terr.tag] || env.terr.tag}${fort ? " · murallas " + fort : ""}.`,
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
function deploy(side, only) {
  const us = BT.units.filter((u) => u.side === side && (!only || u.x < 0)),
    rows = [12, 10.3, 13.7, 8.6, 15.4, 6.9, 17.1, 5.2, 18.8, 3.5, 20.5, 1.8, 22.2],
    col = {
      lin: side ? 32.5 : 7.5,
      esc: side ? 30.9 : 9.1,
      arq: side ? 36.5 : 3.5,
      cab: side ? 34.5 : 5.5,
      maq: side ? 38.2 : 1.8,
      gen: side ? 35.2 : 4.8,
    };
  const cnt = { lin: 0, esc: 0, arq: 0, cab: 0, maq: 0, gen: 0 };
  us.sort((a, b) => TYP.indexOf(a.t) - TYP.indexOf(b.t));
  for (const u of us) {
    const g = u.gen && u.n <= SPU ? "gen" : cmbGrp(u.t),
      k = cnt[g]++;
    let y = rows[k % rows.length],
      x = col[g] + (k >= rows.length ? (side ? 1.6 : -1.6) : 0);
    if (g === "cab") y = k % 2 ? BH - 2 - Math.floor(k / 2) * 1.8 : 2 + Math.floor(k / 2) * 1.8;
    for (
      let n = 0;
      n < 30 && BT.units.some((o) => o !== u && o.x >= 0 && Math.hypot(o.x - x, o.y - y) < crd(o, u) + 0.1);
      n++
    )
      y = ((y + 1.7) % (BH - 1)) + 0.5;
    u.x = x;
    u.y = y;
  }
}
const bU = (id) => BT.units.find((u) => u.id === id),
  dd = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const act = (u) => u.n > 0 && !u.gone,
  fighting = (u) => act(u) && !u.rout,
  enem = (u) => BT.units.filter((o) => o.side !== u.side && fighting(o));
const nearest = (u) => enem(u).sort((a, b) => dd(u, a) - dd(u, b))[0];
const tile = (u) => BT.terr[clamp(Math.floor(u.y), 0, BH - 1)]?.[clamp(Math.floor(u.x), 0, BW - 1)],
  inForest = (u) => tile(u) === 1,
  onHill = (u) => tile(u) === 2,
  inRiver = (u) => tile(u) === 3;
const tirador = (u) => u.cs.al > 0 && u.ammo > 0,
  alc = (u) => u.cs.al * (BT.env.clima === "niebla" ? 0.7 : 1) * (onHill(u) ? 1.15 : 1),
  murOk = (u) => cmbMurF(u) > 0;
/* nivel efectivo de muralla que protege a u: baja con los daños (arietes, catapultas) y casi se anula
   junto a una torre de asedio enemiga */
function cmbMurF(u) {
  const M = BT.muro;
  if (!M || M.hp <= 0 || u.side !== BT.def || !(BT.def ? u.x > M.x : u.x < M.x)) return 0;
  const torre = BT.units.some(
    (o) =>
      o.side !== u.side &&
      o.t === "tor" &&
      fighting(o) &&
      Math.abs(o.x - M.x) < 1.6 &&
      Math.abs(o.y - u.y) < 3,
  );
  return BT.fort * (M.hp / M.hp0) * (torre ? 0.3 : 1);
}
/* adaptador de habilidades para la táctica */
const BTB = {
  auto: false,
  enemigos: (x, r) => enem(x).filter((o) => dd(x, o) <= r + rad(o)),
  aliados: (x, r) => BT.units.filter((o) => o.side === x.side && fighting(o) && dd(x, o) <= r),
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
      x && !x.side ? t.replace(/(^|¡Emboscada! )Los /, "$1Tus ") : t,
      x ? (x.side ? "bad" : "good") : "",
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
const uname = (u) => (u.side === 0 ? "Tus " : "Los ") + u.nm;
const cBien = (u) => (u.side ? "good" : "bad");
const cmbTal = (s, k, v) => {
  if (v > 0) BT.tal[s][k] = (BT.tal[s][k] || 0) + v;
};
function cmbGeneralCae(s, u) {
  const g = BT.gens[s];
  if (!g.ok) return;
  g.ok = false;
  BT.gb[s] = 1;
  const muere = R() < 0.35,
    gc = G.C[g.id];
  g.res = muere ? "muerto" : "herido";
  for (const o of BT.units) if (o.side === s && act(o)) o.mor -= muere ? 18 : 12;
  cmbTal(1 - s, "general", BT.init[s] * 0.08);
  bHito(
    "gen" + s,
    5,
    muere
      ? `${gc ? gc.n : "El general"} cae muerto junto a los ${u.nm}; ${s ? "el enemigo titubea" : "tus hombres titubean"}.`
      : `${gc ? gc.n : "El general"} cae herido y es retirado del frente.`,
    s ? "good" : "bad",
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
    c = ((a.x - b.x) * b.face) / d;
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
    (onHill(u) ? 1.25 : 1) *
    (inForest(t) ? 0.6 : 1) *
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
        (o.x - t.x) * (t.side ? -1 : 1) > 0.3 &&
        (o.x - t.x) * (t.side ? -1 : 1) < 2.6 &&
        Math.abs(o.y - t.y) < 1.3,
    );
  if (cover) v *= 0.5;
  u.ammo--;
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
    BT.fx.push({ x: t.x, y: t.y, txt: "-" + l, t0: now + 300, c: t.side ? "#ffd36b" : "#ff8a7a" });
}
function simStep(dt, slot) {
  const live = BT.units.filter(act),
    now = performance.now(),
    calorC = BT.env.clima === "calor" ? 1.3 : 1,
    M = BT.muro;
  BT.t += dt;
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
    if (u.rout) g = { x: u.side ? BW + 2 : -2, y: u.y };
    else if (P.o && P.o.tg != null) {
      const t = bU(P.o.tg);
      if (t && fighting(t))
        g = tirador(u)
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
    if (!g && !u.rout && u.cs.cl === "asd" && M && M.hp > 0 && u.side !== BT.def && u.st === "agr") {
      const gy = clamp(Math.round((u.y - 3) / 6) * 6 + 3, 3, BH - 3),
        lado = BT.def ? -1 : 1;
      g =
        u.t === "cat"
          ? { x: M.x, y: u.y, stop: alc(u) - 1 }
          : { x: M.x + lado * 0.9, y: u.t === "ari" ? gy : u.y };
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
    u.goal = g;
  }
  for (const u of live) {
    const was = u.eng,
      cont = enem(u).filter((o) => dd(u, o) < crd(u, o) + 0.08);
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
        if (Math.abs(dx) > 0.05 && !(tirador(u) && UN[u.t].rol !== "m")) u.face = Math.sign(dx);
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
      if (e && !u.rout) u.face = Math.sign(e.x - u.x) || u.face;
    } else if (!u.rout && !u.goal) {
      const e = nearest(u);
      if (e && dd(u, e) < 9) u.face = Math.sign(e.x - u.x) || u.face;
    }
  }
  for (const u of live)
    for (const o of live) {
      if (u.id >= o.id || u.n <= 0 || o.n <= 0) continue;
      const d = dd(u, o),
        mn = u.side === o.side ? crd(u, o) + 0.05 : crd(u, o);
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
    u.y = clamp(u.y, 0.5, BH - 0.5);
    if (u.rout) {
      if (u.x < -0.6 || u.x > BW + 0.6) {
        u.gone = true;
        bLog(`${uname(u)} abandonan el campo (${u.n}).`, cBien(u));
      }
    } else u.x = clamp(u.x, 0.5, BW - 0.5);
  }
  for (const u of live) u.flk = 0;
  for (const u of live)
    if (u.side === 0)
      for (const o of live)
        if (o.side === 1 && u.n > 0 && o.n > 0 && dd(u, o) < crd(u, o) + 0.08) {
          fight(u, o, dt);
          fight(o, u, dt);
        }
  /* bestias desbocadas: pisotean a los suyos */
  for (const u of live)
    if (u.desb > 0 && u.n > 0) {
      for (const o of live)
        if (o.side === u.side && o !== u && o.n > 0 && dd(u, o) < crd(u, o) + 0.15) {
          hurt(o, Math.min(u.n, 8) * u.cs.me * dt * CMB_KT * 0.8);
          o.mor -= dt * 3;
          cmbTal(1 - u.side, "desbocados", dt * 0.6);
        }
      if ((u.desb -= dt) <= 0) u.rout = true;
    }
  /* asedio: los arietes baten la puerta; las torres alcanzan el adarve */
  if (M && M.hp > 0)
    for (const u of live)
      if (u.side !== BT.def && fighting(u) && Math.abs(u.x - M.x) < 1.4) {
        if (u.t === "ari") {
          M.hp -= dt * (u.n / SPU) * 2.2 * u.hm.me;
          bHito("ari", 3, `${uname(u)} baten la puerta de la muralla.`, u.side ? "bad" : "good");
          cmbTal(u.side, "asedio", dt * 0.4);
        }
        if (u.t === "tor") {
          bHito(
            "tor" + u.id,
            3,
            `${u.side ? "La torre enemiga" : "Tu torre de asedio"} alcanza el adarve.`,
            u.side ? "bad" : "good",
          );
          cmbTal(u.side, "asedio", dt * 0.3);
        }
      }
  if (M && M.hp <= 0 && !M.rota) {
    M.rota = true;
    for (const o of BT.units) if (o.side === BT.def && act(o)) o.mor -= 10;
    cmbTal(1 - BT.def, "asedio", BT.init[BT.def] * 0.1);
    bHito("", 5, "¡Brecha en la muralla! Los defensores retroceden.", BT.def ? "good" : "bad");
  }
  for (const u of live) {
    if (!tirador(u) || u.rout || u.eng || u.n <= 0) continue;
    u.rel -= dt;
    if (u.rel > 0) continue;
    /* las catapultas atacantes tiran primero contra la muralla */
    if (u.t === "cat" && M && M.hp > 0 && u.side !== BT.def && Math.abs(u.x - M.x) <= alc(u)) {
      M.hp -= (u.n / SPU) * 7;
      u.ammo--;
      u.rel = 4;
      bHito("cat" + u.side, 3, `${uname(u)} golpean la muralla.`, u.side ? "bad" : "good");
      cmbTal(u.side, "asedio", 1.5);
      if (!BT.quiet)
        BT.fx.push({ arrow: 1, x0: u.x, y0: u.y, x: M.x, y: u.y + (R() - 0.5) * 2, t0: performance.now() });
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
      bHito("", 3, `${uname(u)} se reagrupan.`, u.side ? "bad" : "good");
    }
  }
  for (const u of live) cmbHabTick(u, dt, BTB);
  if (BT.t - BT.tH >= (BT.mode === "rt" ? 20 : 1e9)) cmbHitoCorte();
}
/* corte del desarrollo de la batalla para el informe (cada turno o cada 20 s) */
function cmbHitoCorte() {
  const lost = [0, 1].map((s) => BT.units.filter((u) => u.side === s).reduce((a, u) => a + u.n0 - u.n, 0)),
    mor = [0, 1].map((s) => {
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
    b: [lost[0] - (BT.lc ? BT.lc[0] : 0), lost[1] - (BT.lc ? BT.lc[1] : 0)],
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
  const back = side ? 1 : -1;
  for (const u of BT.units) {
    if (u.side !== side || !fighting(u)) continue;
    const e = nearest(u);
    if (!e) continue;
    const weak = u.n < u.n0 * 0.35 || u.mor < u.morMax * 0.25,
      defMur = BT.fort && side === BT.def && (BT.mode === "rt" ? BT.t < 40 : BT.turn < 3);
    let o = null,
      st = "agr";
    if (u.cs.cl === "asd") st = BT.muro && BT.muro.hp > 0 && side !== BT.def ? "agr" : "def";
    else if (u.gen && u.n <= SPU) {
      /* la guardia del general se queda tras la línea, cerca de los suyos */
      const v = BT.units.filter((x) => x.side === side && x !== u && fighting(x) && x.cs.cl !== "asd"),
        cx = v.length ? v.reduce((a, x) => a + x.x, 0) / v.length : u.x,
        cy = v.length ? v.reduce((a, x) => a + x.y, 0) / v.length : u.y;
      o = { x: clamp(cx + 2.5 * back, 0.5, BW - 0.5), y: clamp(cy, 0.5, BH - 0.5) };
      st = "def";
    } else if (tirador(u)) {
      const mel = enem(u).filter((x) => !tirador(x) && dd(u, x) < 3.5);
      if (mel.length) {
        o = { x: clamp(u.x + 3 * back, 0.5, BW - 0.5), y: clamp(u.y + (R() - 0.5) * 2, 0.5, BH - 0.5) };
        st = "def";
      } else st = defMur && UN[u.t].rol !== "m" ? "def" : "agr";
    } else if (weak) {
      o = { x: clamp(u.x + 3 * back, 0.5, BW - 0.5), y: u.y };
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
      o = { x: clamp(u.x + 4 * back, 0.5, BW - 0.5), y: u.y };
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
          .filter((x) => x.side !== side && act(x) && x.rout)
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
  const back = side ? 1 : -1,
    mios = BT.units.filter((u) => u.side === side && fighting(u)),
    ene = BT.units.filter((u) => u.side !== side && fighting(u));
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
      pon(u, [{ x: cx + 5 * back, y: u.y }], "def");
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
      const trab = ene.filter((e) => e.eng && !cmbCab(e.t) && UN[e.t].rol !== "l").sort((a, b) => dd(u, a) - dd(u, b))[0];
      if (trab) {
        /* punto detrás del enemigo (respecto a nuestra línea) */
        const fx = trab.x - 2.2 * back,
          fy = trab.y + (u.y < trab.y ? -1.6 : 1.6);
        if (Math.hypot(fx - u.x, fy - u.y) > 2 && n > 1) pon(u, [{ x: fx, y: fy }, { tg: trab.id }, { tg: trab.id }], "agr");
        else if (Math.hypot(fx - u.x, fy - u.y) > 2) pon(u, [{ x: fx, y: fy }], "agr");
        else pon(u, [{ tg: trab.id }], "agr");
      }
      continue;
    }
    if (UN[u.t].rol !== "l") {
      const cerca = ene.filter((e) => dd(u, e) < 6 && (e.eng || !tirador(e) || UN[e.t].rol !== "h")).sort((a, b) => dd(u, a) - dd(u, b))[0];
      if (cerca) pon(u, [{ tg: cerca.id }], "agr");
    }
  }
}
function sideAlive(s) {
  return BT.units.filter((u) => u.side === s && fighting(u)).reduce((a, u) => a + u.n, 0) > BT.init[s] * 0.15;
}
/* devuelve el bando (del campo) que gana, o -1 si sigue */
function battleOver() {
  if (!sideAlive(1)) return 0;
  if (!sideAlive(0)) return 1;
  if ((BT.mode === "rt" ? BT.t : BT.turn - 1) >= BT.lim) {
    BT.noche = true;
    return BT.def;
  }
  return -1;
}
async function runPhase(slot) {
  const dt = 1 / 30;
  for (let k = 0; k < PH / dt; k++) {
    simStep(dt, slot);
    if (battleOver() >= 0) break;
    if (k % 3 === 2) {
      await sleep(16);
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
  if (!O || O.ctrl[1] === "ia") aiOrders(1);
  if (BT.auto0 || (O && O.ctrl[0] === "ia")) aiOrders(0);
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
    finishBattle(r === 0);
    return;
  }
  /* ONL */ if (O) O.estado(true);
  bui();
  if (BT.auto0 || (O && O.ctrl[0] !== "local")) setTimeout(executeTurn, 200);
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
    acc += el * BT.speed;
    while (acc >= 1 / 30) {
      acc -= 1 / 30;
      simStep(1 / 30, 0);
      BT.aiT -= 1 / 30;
      if (BT.aiT <= 0) {
        const O = BT.ctx.onl; /* ONL: solo los lados de la IA */
        if (!O || O.ctrl[1] === "ia") aiOrders(1);
        if (BT.auto0 || (O && O.ctrl[0] === "ia")) aiOrders(0);
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
        finishBattle(r === 0);
        return;
      }
    }
  }
}
/* fin: persecución, heridos que vuelven, informe y regreso a la campaña */
function finishBattle(win, retreat) {
  if (!BT) return;
  const w = win ? 0 : 1,
    lo = 1 - w,
    noche = BT.noche && !retreat,
    ganaU = BT.units.filter((u) => u.side === w && fighting(u)),
    pierdeU = BT.units.filter((u) => u.side === lo && u.n > 0);
  cmbHitoCorte();
  if (!noche) {
    const P = ganaU.reduce((a, u) => a + u.n * cmbPers(u.t) * (1 - u.fat / 200), 0),
      N = pierdeU.reduce((a, u) => a + u.n * (u.gone ? 0.5 : 1), 0),
      k = Math.min(
        N,
        Math.max(N * 0.08, Math.min(N * 0.5, P * CMBA_K.pers * (0.85 + R() * 0.3))) * (retreat ? 0.4 : 1),
      ),
      pesos = pierdeU.map((u) => u.n * (cmbCab(u.t) ? 0.45 : 1) * (u.gone ? 0.5 : 1)),
      sp = pesos.reduce((a, b) => a + b, 0) || 1;
    let caen = 0;
    pierdeU.forEach((u, i) => {
      const d = Math.min(u.n, Math.round((k * pesos[i]) / sp));
      u.n -= d;
      u.muertos += Math.round(d * 0.75);
      u.her += d - Math.round(d * 0.75);
      caen += d;
    });
    cmbTal(w, "persecucion", caen);
    if (caen)
      BT.hitos.push({
        r: BT.hitos.length + 1,
        f: retreat ? "Retirada" : "Persecución",
        t: retreat
          ? `Ordenas la retirada; el enemigo hostiga a la columna y caen ${caen}.`
          : `Desbandada en las filas de ${CIV[[BT.fa, BT.fd][lo]].s}: caen ${caen} en la persecución.`,
        b: w ? [caen, 0] : [0, caen],
        m: [0, 1].map((s) => (s === w ? BT.hitos[BT.hitos.length - 1]?.m[s] || 50 : 0)),
      });
  } else
    BT.hitos.push({
      r: BT.hitos.length + 1,
      f: "Anochecer",
      t: `Cae la noche: las tropas de ${CIV[[BT.fa, BT.fd][1 - BT.def]].s} no logran romper al enemigo y se retiran.`,
      b: [0, 0],
      m: BT.hitos[BT.hitos.length - 1]?.m || [50, 50],
    });
  const rec = [0, 1].map((s) => (s === w ? 0.6 : noche ? 0.45 : retreat ? 0.35 : 0.25)),
    out = [cmbVacio(), cmbVacio()],
    bajas = [
      { m: 0, h: 0, r: 0 },
      { m: 0, h: 0, r: 0 },
    ];
  for (const s of [0, 1]) {
    const sv = {};
    for (const u of BT.units.filter((u) => u.side === s)) {
      const vu = u.her * rec[s];
      sv[u.t] = (sv[u.t] || 0) + u.n + vu;
      bajas[s].m += u.muertos + u.her - vu;
      bajas[s].h += u.her;
      bajas[s].r += vu;
    }
    for (const t in sv) {
      const x = sv[t] / SPU;
      out[s][t] = Math.floor(x) + (R() < x % 1 ? 1 : 0);
    }
  }
  /* de bandos del campo a ejA/ejD */
  const m = BT.map,
    ej = (arr) => [arr[m.indexOf(0)], arr[m.indexOf(1)]],
    gana = m[w],
    L = ej([0, 1]).map((s) => ({ f: [BT.fa, BT.fd][s], gen: BT.gens[s].id, n0: BT.init[s] })),
    informe = {
      f: [BT.ejs[0].f, BT.ejs[1].f],
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
      asedio: BT.ctx.asedio || 0,
      lugar: BT.place,
      anio: G ? G.year : 0,
      modo: BT.mode,
      dur: Math.round(BT.t),
    },
    res = {
      gana,
      A: ej(out)[0],
      D: ej(out)[1],
      heridos: { A: Math.round(ej(bajas)[0].r), D: Math.round(ej(bajas)[1].r) },
      informe,
      gen: informe.gen,
    },
    done = BT.done,
    pl = BT.place,
    yo = m[0],
    auto = BT.ctx.auto && BT.ctx.sinModal;
  /* ONL */ if (BT.ctx.onl) BT.ctx.onl.fin(res);
  BT = null;
  $("battle").classList.remove("show");
  music("camp");
  if (auto) {
    done(res);
    return;
  }
  modal(gana === yo ? `Victoria en ${pl}` : `Derrota en ${pl}`, cmbInfHtml(informe, yo), [
    { t: "Continuar", cls: "gold" },
  ]).then(() => done(res));
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
  if (a === "auto")
    deploy(
      0,
      BT.units.some((o) => !o.side && o.x < 0),
    );
  if (a === "go" && BT.phase === "deploy") {
    if (BT.units.some((o) => !o.side && o.x < 0)) deploy(0, true);
    BT.phase = "plan";
    bLog(
      BT.mode === "rt"
        ? "¡Comienza la batalla! Toca una unidad y luego el destino o un enemigo."
        : "Tus tropas forman. Mueve cada unidad con el dedo y elige su postura.",
    );
    if (BT.mode === "rt") {
      aiOrders(1);
      if (BT.auto0) aiOrders(0);
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
  if (a === "atk") {
    BT.atk = !BT.atk;
    if (BT.atk && !selU().length) BT.atk = false;
  }
  if (a === "selall") {
    BT.sels = BT.units.filter((o) => !o.side && fighting(o)).map((o) => o.id);
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
      .filter((o) => !o.side && o.t === u.t)
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
function ordTxt(o) {
  if (!o) return "Quieto";
  if (o.tg != null) {
    const t = bU(o.tg);
    return t ? "Atacar " + CIV[t.f].un[t.t].toLowerCase() : "Atacar";
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
  if (ab) ab.classList.toggle("on", !!BT.atk);
  const me = BT.units.filter((u) => !u.side && act(u)),
    u = bU(BT.sel),
    c = $("bside"),
    s0 = BT.units.filter((u) => !u.side).reduce((s, u) => s + u.n, 0),
    s1 = BT.units.filter((u) => u.side).reduce((s, u) => s + u.n, 0),
    E = BT.env;
  let h = `<h2>Batalla de ${BT.place}</h2><p class="dim"><span style="color:${CIV[BT.fa].c}">${CIV[BT.fa].s} ${s0}</span> contra <span style="color:${CIV[BT.fd].c}">${CIV[BT.fd].s} ${s1}</span>${BT.fort ? " · murallas " + BT.fort : ""}<br>${MODES[BT.mode]}${BT.mode === "rt" ? ` · ${Math.floor(BT.t)} / ${BT.lim} s` : ` · turno ${BT.turn} / ${BT.lim}`} · ${E.clima}</p>`;
  if (BT.phase === "deploy") {
    h += `<p>Arrastra tus unidades dentro de la franja clara. Lanceros al frente frenan la caballería; arqueros detrás; caballería en las alas. Bosque: cubre y frena jinetes. Colina: mejor tiro y defensa. Río: frena y debilita; usa los vados.</p><div class="g2"><button data-act="b-auto">Despliegue automático</button><button data-act="b-go" class="gold">¡A la batalla!</button></div>`;
  } else {
    const SG = selU();
    if (SG.length > 1)
      h += `<h3>${SG.length} unidades seleccionadas · ${SG.reduce((a, o) => a + o.n, 0)} soldados</h3><p class="stats">La postura se aplica a todas. Toca el terreno para moverlas en formación o ⚔ y un enemigo para atacar juntas.</p>`;
    if (u && !u.side && act(u)) {
      const fm = Math.max(0.5, 1 - u.fat / 220);
      h += `<h3>${SG.length > 1 ? "Principal: " : ""}${CIV[u.f].un[u.t]} · ${u.n}/${u.n0}${u.gen ? " · ⚑ general" : ""}${u.rout ? " · ¡HUYENDO!" : ""}</h3>
  <div class="stats">${cmbInfo(u.t).tag} · ${cmbNivelVet(u.cs.xp).toLowerCase()} · ${cmbEstado(u)}<br>Ataque ${Math.round(u.cs.me * fm * 10) / 10}${u.cs.ca ? " · carga " + u.cs.ca : ""} · Defensa ${Math.round(u.cs.de * 10) / 10} · Armadura ${u.cs.ar}${u.cs.al ? ` · munición ${u.ammo}/${u.cs.mu}` : ""} · heridos ${u.her}</div>
  <div class="stats">Moral</div>${bar((u.mor / u.morMax) * 100, u.mor < u.morMax * 0.35 ? "#e0503f" : "#5b97f0")}<div class="stats">Cansancio</div>${bar(u.fat, "#e8b632")}`;
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
    h += `<p class="note">Toca una unidad para elegirla; mantén pulsada otra para sumarla, o mantén pulsado el terreno y arrastra para rodear varias. Luego toca el destino (o arrastra) y ⚔ + enemigo para atacar.${BT.mode === "rt" ? "" : " Las tropas no pasan de su círculo de alcance."}${BT.mode === "t3" ? " Cada arrastre llena la siguiente acción." : ""}</p>`;
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
  BT.phase === "plan" && (BT.mode === "rt" || !BT.run) && !(BT.ctx.onl && BT.ctx.onl.ctrl[0] !== "local") /* ONL */;
/* ONL: ¿usa la IA las habilidades de ese lado? (en vivo, el lado de un jugador remoto las elige él) */
function cmbHabIALado(s) {
  const O = BT.ctx && BT.ctx.onl;
  if (!O) return s === 1 || BT.auto0;
  return O.ctrl[s] === "ia" || (s === 0 && BT.auto0);
}
const selU = () => (BT.sels || []).map(bU).filter((u) => u && act(u) && !u.side);
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
    us.forEach((u) => setOrder(u, { tg: o.tg }, sl));
    const t = bU(o.tg);
    bLog(
      `${us.length > 1 ? us.length + " unidades atacan" : "Orden de ataque contra"} ${CIV[t.f].un[t.t].toLowerCase()}.`,
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
    if (hit && !hit.side) {
      BT.sel = hit.id;
      BT.sels = [hit.id];
    } else if (s && x < 10 && !hit) {
      s.x = clamp(x, 0.5, 10);
      s.y = clamp(y, 0.5, BH - 0.5);
      const nx = BT.units.find((o) => !o.side && o.x < 0);
      if (nx) {
        BT.sel = nx.id;
        BT.sels = [nx.id];
      }
    }
    bui();
    return;
  }
  if (hit && !hit.side) {
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
  if (hit && hit.side) {
    orderGroup({ tg: hit.id });
    return;
  }
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
    mine: !!(h && !h.side),
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
          !u.side &&
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
      if (u && p.x < 10) {
        u.x = clamp(p.x, 0.5, 10);
        u.y = clamp(p.y, 0.5, BH - 0.5);
      }
      bui();
      return;
    }
    const h = hitAt(p.x, p.y);
    if (h && h.side) orderGroup({ tg: h.id });
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
function drawBattle(now) {
  const c = bcx;
  c.drawImage(BT.bg, 0, 0);
  /* muralla: integridad arriba y brecha cuando cae */
  const MU = BT.muro;
  if (MU) {
    const wx = MU.x * TS,
      k = clamp(MU.hp / MU.hp0, 0, 1);
    c.fillStyle = "#000";
    c.fillRect(wx - 16, 2, 32, 5);
    c.fillStyle = k > 0.5 ? "#cfc6b6" : k > 0 ? "#e8b632" : "#e0503f";
    c.fillRect(wx - 15, 3, Math.round(30 * k), 3);
    if (MU.rota)
      for (let y = 8 * TS; y < 16 * TS; y += 4) {
        c.fillStyle = (y / 4) % 2 ? "#6d6250" : "#857c6b";
        c.fillRect(wx - 7 + ((y * 7) % 5), y, 14, 3);
      }
  }
  c.lineWidth = 1;
  if (BT.phase === "deploy") {
    c.fillStyle = "rgba(255,255,255,.13)";
    c.fillRect(0, 0, 10 * TS, BH * TS);
    c.fillStyle = "rgba(255,80,60,.1)";
    c.fillRect(30 * TS, 0, 10 * TS, BH * TS);
  }
  for (const d of BT.dead) {
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
  if (s && act(s) && !s.side && BT.phase === "plan" && BT.mode !== "rt" && !BT.run) {
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
      if (u.side || !act(u) || u.rout) continue;
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
    if (h && h.side) {
      arrow(c, cx, cy, h.x, h.y, "#ff5a4a");
    } else {
      arrow(c, cx, cy, drag.x, drag.y, "#8fd18a");
      for (const g of groupSlots(SG, drag.x, drag.y)) ghost(c, g.u, g.x, g.y, "#8fd18a");
    }
  }
  if (drag && drag.mode === "unit" && BT.phase === "deploy") {
    const u = bU(drag.h);
    if (u) ghost(c, u, clamp(drag.x, 0.5, 10), drag.y, "#8fd18a");
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
  for (const u of BT.units.filter((u) => act(u) && u.x >= 0).sort((a, b) => a.y - b.y)) {
    const X = Math.round(u.x * TS),
      Y = Math.round(u.y * TS),
      fl = u.face < 0,
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
    for (const so of formation(u)) {
      const fr = mov || u.rout ? Math.floor(now / 110 + so.k) % 2 : 0,
        jit = fi ? Math.round(Math.sin(now / 55 + so.k * 1.7) * 1.4) * (fl ? -1 : 1) : 0,
        rows = MS[u.t][fr],
        w = rows[0].length;
      sprF(
        c,
        rows,
        Math.round(X + so.x - w / 2 + jit),
        Math.round(Y + so.y - 5 + (mov && fr ? -1 : 0)),
        PAL[u.f],
        fl,
      );
    }
    if (u.st === "def" && !u.rout) {
      c.fillStyle = "#e9e4da";
      const sx = X + (fl ? -rr - 3 : rr + 1);
      for (let k = -6; k <= 6; k += 3) c.fillRect(sx, Y + k, 2, 2);
    }
    const hh = (Math.ceil(cmbFig(u) / fcols(u)) * cmbPaso(u)[1]) / 2,
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
    c.fillStyle = u.side ? "#ff8a7a" : "#8fd18a";
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
