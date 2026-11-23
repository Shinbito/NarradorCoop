/* ---------- movimiento y combate de campaña ----------
   Sistema de COMBATE. La resolución de batallas está desacoplada de las provincias:
     cmbResolverAuto(ejA, ejD, ctx)        -> {gana, A, D, heridos, informe}   (síncrona)
     cmbTactica(ejA, ejD, ctx, modo)       -> Promise del mismo resultado (batalla en canvas)
   ej  = {f, u:{tipo:n}, gen (id|null), vet:{tipo:xp}, fat (0-100, cansancio al llegar)}
   ctx = {terreno ({tag,bosque,colina,rio} o 'llanura'|'bosque'|'colinas'|'vado'), fort (murallas,
          0 en campo abierto), asedio (meses), nombreLugar, p (provincia, opcional), est (solo estimar),
          clima, hora}
   settle() es solo un caso de uso: un ejército que entra en una provincia enemiga. */
async function march(from, to, frac, fast) {
  const p = G.P[from],
    q = G.P[to],
    s = cmbVacio();
  cmbNorm(p.u);
  for (const t of TYP) s[t] = frac >= 1 ? p.u[t] : Math.floor(p.u[t] * frac);
  if (!tot(s)) return;
  const xp = { ...cmbVetDe(p) },
    ori = { ...cmbOriDe(p) };
  for (const t of TYP) p.u[t] -= s[t];
  cmbVetFijar(p, xp);
  cmbOriFijar(p, ori);
  let g = null;
  if (frac >= 1 && p.gen != null) {
    g = p.gen;
    p.gen = null;
  }
  await new Promise((res) => {
    anim = {
      f: p.owner,
      x0: p.x * T + 4,
      y0: p.y * T + 4,
      x1: q.x * T + 4,
      y1: q.y * T + 4,
      t0: performance.now(),
      dur: reduce ? 1 : fast ? 110 : 480,
      res,
    };
  });
  await settle(p, q, s, g, xp, ori);
}

/* ---------- entorno: terreno de la provincia, clima y hora ---------- */
let cmbTerrC = null;
function cmbTerreno(p) {
  if (!p || !MAP) return { tag: "llanura", bosque: 0, colina: 0, rio: false };
  if (!cmbTerrC || cmbTerrC.seed !== MAP.seed) {
    const c = MAP.pts.map(() => [0, 0, 0, 0]);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = MAP.grid[y][x];
        if (i >= 0) c[i][MAP.terr[y][x]]++;
      }
    cmbTerrC = {
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
  return cmbTerrC.l[p.id] || cmbTerrC.l[0];
}
function cmbTerrCtx(t, p) {
  if (t && typeof t === "object") return t;
  if (typeof t === "string")
    return {
      tag: t,
      bosque: t === "bosque" ? 0.5 : 0,
      colina: t === "colinas" ? 0.5 : 0,
      rio: t === "vado",
    };
  return cmbTerreno(p);
}
const CMB_CLIMA = [
  ["despejado", 55],
  ["lluvia", 18],
  ["niebla", 10],
  ["calor", 17],
];
const CMB_HORA = [
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
    cl = ctx.clima || cmbSortea(CMB_CLIMA)[0],
    ho = CMB_HORA.find((h) => h[0] === ctx.hora) || cmbSortea(CMB_HORA);
  return { terr, clima: cl, hora: ho[0], rmax: ho[2] };
}
const CMB_TERR = { llanura: "llanura abierta", bosque: "bosque", colinas: "colinas", vado: "vado del río" };

/* ---------- el modelo de batalla por rondas ----------
   Nadie muere de golpe: los proyectiles, el choque y la melé causan caídos (muertos y heridos),
   las bajas, el flanqueo, el cansancio y la caída de los vecinos erosionan la moral; cuando una
   unidad llega a 0 rompe filas, y cuando un bando se desmorona la persecución causa la matanza. */
const CMB_K = { mel: 0.17, dis: 0.15, pers: 2.1, mor: 165 };
const CMB_PERS = { l: 0.05, i: 0.08, p: 0.04, h: 0.12, a: 0.06, x: 0.55, c: 0.38, k: 0.22, m: 0.45 };
const CMB_FX = {
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
};
const cmbRnd = () => 0.85 + R() * 0.3;
const cmbNom = (b) => b.nm || CIV[b.f].un[b.t].toLowerCase();
function cmbLado(s, ej, ctx, env) {
  const f = ej.f,
    lado = s ? "defensor" : "atacante",
    gc = ej.gen != null && G.C[ej.gen] && G.C[ej.gen].alive !== false ? G.C[ej.gen] : null,
    /* OC 'bonoBatalla': multiplicador del daño. ctx {f, lado, p} */
    bono = OC.calc("bonoBatalla", 1, { f, lado, p: ctx.p || null }) || 1,
    hambre = ej.hambre != null ? ej.hambre : !!(G.F[f] && G.F[f].food <= 0),
    as = s === 1 && ctx.asedio ? Math.min(20, ctx.asedio * 4) : 0,
    bl = [];
  for (const t of TYP) {
    const n = (ej.u[t] || 0) * SPU;
    if (n <= 0) continue;
    const st = cmbStats(f, t, cmbOrigenP(f, t, ej.ori, ctx.p), lado, (ej.vet && ej.vet[t]) || 0),
      mx =
        st.mo +
        (gc ? gc.ma * 1.5 : 0) +
        (s === 1 && ctx.fort ? 3 + ctx.fort * 3 : 0) -
        (hambre ? 10 : 0) -
        as;
    const an = mx * (0.88 + R() * 0.24);
    bl.push({
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
    });
  }
  return {
    s,
    f,
    gen: gc ? gc.id : null,
    g: gc ? 1 + gc.ma * 0.04 : 1,
    ma: gc ? gc.ma : 0,
    gOk: !!gc,
    bono,
    suerte: 0.62 + (R() + R()) * 0.38,
    hambre,
    bl,
    n0: bl.reduce((a, b) => a + b.n, 0),
    flank: 0,
    fdicho: false,
    cont: 0,
    roto: false,
  };
}
const cmbVivos = (L) => L.bl.filter((b) => b.n > 0.5 && !b.rout);
const cmbCuerpo = (b) => b.cl !== "dis" && !(b.t === "m" && b.ammo > 0);
const cmbTirador = (b) => b.st.al > 0 && b.ammo > 0;
const cmbFatM = (b) => Math.max(0.5, 1 - b.fat / 220);
const cmbSuma0 = (l) => l.reduce((a, b) => a + b.n, 0);
function cmbAlza(fx, s, k, v) {
  if (v > 0) fx[s][k] = (fx[s][k] || 0) + v;
}
/* reparte un objetivo según preferencias de doctrina */
function cmbObjetivo(b, ene, frente) {
  let tot0 = 0;
  const w = ene.map((e) => {
    let k = 1;
    if (e.cl === "dis" || (e.t === "m" && e.ammo > 0)) {
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
  const env = cmbEntorno(ctx),
    est = !!ctx.est,
    fort = ctx.fort || 0,
    terr = env.terr,
    L = [cmbLado(0, ejA, ctx, env), cmbLado(1, ejD, ctx, env)],
    fx = [{}, {}],
    ron = [],
    gen = [null, null],
    calor = env.clima === "calor" ? 1.3 : 1;
  for (const b of [...L[0].bl, ...L[1].bl]) {
    const nm = CIV[b.f].un[b.t].toLowerCase();
    b.nm = CIV[ejA.f].un[b.t] === CIV[ejD.f].un[b.t] ? `${nm} (${CIV[b.f].s})` : nm;
  }
  if (L[0].hambre) cmbAlza(fx, 1, "hambre", L[0].n0 * 0.04);
  if (L[1].hambre) cmbAlza(fx, 0, "hambre", L[1].n0 * 0.04);
  let fin = L[1].n0 <= 0 ? "vacio" : L[0].n0 <= 0 ? "vacio" : "",
    gana = L[1].n0 <= 0 && L[0].n0 > 0 ? 0 : 1;
  for (let r = 1; !fin && r <= env.rmax; r++) {
    const ev = [],
      di = (p, t) => ev.push([p, t]),
      dano = new Map(),
      golpe = (tg, v) => dano.set(tg, (dano.get(tg) || 0) + v),
      susto = new Map();
    for (const X of L) for (const b of X.bl) b.perd = 0;
    /* flanqueo: caballería libre o superioridad numérica que desborda la línea */
    if (r >= 3)
      for (const s of [0, 1]) {
        const O = L[s],
          E = L[1 - s],
          cab = (X) =>
            cmbVivos(X)
              .filter((b) => b.cl === "cab" && b.t !== "m")
              .reduce((a, b) => a + b.n * (b.t === "k" ? 1.3 : b.t === "x" ? 0.9 : 1), 0),
          fr = (X) => cmbSuma0(cmbVivos(X).filter(cmbCuerpo)),
          cE = cab(E),
          cO = cab(O),
          fE = fr(E),
          fO = Math.max(1, fr(O));
        let fc = 0,
          fn = 0;
        /* la caballería solo rodea si su propia infantería fija al enemigo de frente */
        const fija = clamp(cmbSuma0(cmbVivos(E).filter((b) => b.cl === "inf")) / fO, 0, 1);
        if (cE > cO * 1.5 && cE > 0.12 * cmbSuma0(cmbVivos(E)))
          fc = clamp((cE - cO * 1.5) / (fO + cO), 0, 0.6) * fija;
        if (fE > fO * 1.4) fn = clamp((fE / fO - 1.4) * 0.25, 0, 0.4);
        let m = (s === 1 && fort ? 0.3 : 1) * (terr.bosque > 0.3 ? 0.6 : 1);
        O.flank = Math.min(0.8, (fc + fn) * m);
        O.fc = fc * m;
        O.fn = fn * m;
        if (O.flank > 0.15 && !O.fdicho) {
          O.fdicho = true;
          const v = cmbVivos(O)
              .filter(cmbCuerpo)
              .sort((a, b) => b.n - a.n)[0],
            c = cmbVivos(E)
              .filter((b) => b.cl === "cab")
              .sort((a, b) => b.n - a.n)[0];
          if (v)
            di(
              3,
              fc >= fn && c
                ? `Los ${cmbNom(c)} flanquean a los ${cmbNom(v)}; su moral se tambalea.`
                : `Las tropas de ${CIV[E.f].s} desbordan por su número la línea de los ${cmbNom(v)}.`,
            );
        }
      }
    /* proyectiles: en la primera ronda dos descargas; luego por encima de la melé */
    let proy = [0, 0];
    for (const s of [0, 1]) {
      const O = L[s],
        E = L[1 - s],
        ene = cmbVivos(E);
      if (!ene.length) continue;
      const frente = cmbSuma0(ene.filter(cmbCuerpo));
      for (const b of cmbVivos(O).filter(cmbTirador)) {
        const k = r === 1 ? 2 : 1;
        b.ammo = Math.max(0, b.ammo - k);
        let v =
          b.n *
          b.st.pr *
          CMB_K.dis *
          k *
          O.suerte *
          O.g *
          O.bono *
          cmbFatM(b) *
          cmbRnd() *
          (r >= 2 ? 0.6 : 1) *
          (env.clima === "lluvia" && b.t !== "h" ? 0.65 : 1) *
          (env.clima === "niebla" ? 0.7 : 1) *
          (s === 1 ? 1 + terr.colina * 0.4 : 1) *
          (terr.bosque > 0.3 ? 0.75 : 1);
        cmbAlza(fx, s, "mando", (v * (O.g - 1)) / O.g);
        cmbAlza(fx, s, "bono", (v * (O.bono - 1)) / O.bono);
        if (s === 1 && terr.colina)
          cmbAlza(fx, 1, "terreno", (v * terr.colina * 0.4) / (1 + terr.colina * 0.4));
        for (const [tg, w] of cmbObjetivo(b, ene, frente)) {
          if (!w) continue;
          const esc = tg.st.es * (1 - E.flank * 0.5) * (b.t === "h" ? 0.5 : 1),
            arm = 10 / (10 + tg.st.ar * 1.5),
            mur = tg.s === 1 && fort ? 1 / (1 + 0.25 * fort) : 1,
            x = v * w;
          golpe(tg, x * (1 - esc) * arm * mur);
          cmbAlza(fx, 1 - s, "armadura", (x * (1 - (1 - esc) * arm)) / tg.st.vi);
          if (mur < 1) cmbAlza(fx, 1, "murallas", (x * (1 - esc) * arm * (1 - mur)) / tg.st.vi);
          proy[s] += (x * (1 - esc) * arm * mur) / tg.st.vi;
        }
      }
      cmbAlza(fx, s, "proyectiles", proy[s]);
    }
    /* cuerpo a cuerpo desde la segunda ronda: choque con cargas, luego melé */
    if (r >= 2)
      for (const s of [0, 1]) {
        const O = L[s],
          E = L[1 - s],
          ene = cmbVivos(E);
        if (!ene.length) continue;
        const frente = cmbSuma0(ene.filter(cmbCuerpo)),
          at = cmbVivos(O).filter(
            (b) => cmbCuerpo(b) || (b.ammo <= 0 && frente < 1) || (b.ammo <= 0 && r > 4),
          ),
          /* frente de batalla: los que no caben en la línea esperan en reserva */
          ancho = clamp((Math.max(frente, cmbSuma0(ene)) * 1.1) / Math.max(1, cmbSuma0(at)), 0.35, 1);
        for (const b of at) {
          const recarga = b.cl === "cab" && r > 2 && r % 3 === 2,
            choque = r === 2 || recarga,
            vado = terr.rio && s === 0 && r === 2 ? 0.75 : 1,
            bosC = b.cl === "cab" ? 1 - 0.35 * terr.bosque : 1,
            atasco = b.cl === "cab" && !choque ? 0.85 : 1;
          let base =
            b.n *
            ancho *
            b.st.me *
            O.g *
            O.bono *
            cmbFatM(b) *
            (b.mor < b.mx * 0.3 ? 0.8 : 1) *
            CMB_K.mel *
            O.suerte *
            cmbRnd() *
            vado *
            bosC *
            atasco *
            (s === 0 ? 1 - 0.25 * terr.colina : 1 + 0.1 * terr.colina);
          if (s === 0 && (vado < 1 || terr.colina))
            cmbAlza(fx, 1, "terreno", (base * (1 - vado * (1 - 0.25 * terr.colina))) / 10);
          cmbAlza(fx, s, "mando", (base * (O.g - 1)) / O.g / 10);
          cmbAlza(fx, s, "bono", (base * (O.bono - 1)) / O.bono / 10);
          cmbAlza(fx, s, "veterania", (base * (b.st.xp / 500)) / (1 + b.st.xp / 500) / 10);
          for (const [tg, w] of cmbObjetivo(b, ene, frente)) {
            if (!w) continue;
            let cg =
              choque && b.st.ca
                ? 1 + b.st.ca * 0.11 * (recarga && b.t !== "x" ? 0.5 : 1) * (terr.bosque > 0.3 ? 0.4 : 1)
                : 1;
            if (cg > 1 && tg.t === "l" && E.flank < 0.3) {
              const c2 = 1 + (cg - 1) * 0.2;
              cmbAlza(fx, 1 - s, "lanceros", (base * w * (cg - c2)) / tg.st.vi);
              if (b.cl === "cab" && r === 2 && !b.dLan) {
                b.dLan = 1;
                di(3, `Los ${cmbNom(tg)} clavan las lanzas: la carga de los ${cmbNom(b)} se estrella.`);
              }
              cg = c2;
            } else if (cg > 1.5 && r === 2 && !b.dCar) {
              b.dCar = 1;
              di(2, `Los ${cmbNom(b)} cargan contra los ${cmbNom(tg)}.`);
            }
            const fat = Math.max(0.6, 1 - tg.fat / 300),
              def = 12 / (12 + tg.st.de * fat),
              arm = 10 / (10 + tg.st.ar * 1.2),
              fl = 1 + 0.5 * E.flank,
              mur = tg.s === 1 && fort ? 1 / (1 + 0.18 * fort) : 1,
              x = base * w * MULT[b.t][tg.t] * cg * def * arm * fl * mur;
            golpe(tg, x);
            /* el choque de una carga sacude la moral aunque cause pocas bajas */
            if (cg > 1.2)
              susto.set(tg, (susto.get(tg) || 0) + (cg - 1) * 22 * w * Math.min(1, b.n / Math.max(1, tg.n)));
            const down = x / tg.st.vi;
            cmbAlza(fx, s, "carga", down * (1 - 1 / cg));
            cmbAlza(fx, s, "flanqueo", (down * (E.fc || 0) * 0.5) / fl);
            cmbAlza(fx, s, "numero", (down * (E.fn || 0) * 0.5) / fl);
            cmbAlza(fx, 1 - s, "armadura", (down * (1 - arm)) / arm);
            cmbAlza(fx, s, "fatiga", down * (1 / fat - 1));
            if (mur < 1) cmbAlza(fx, 1, "murallas", (down * (1 - mur)) / mur);
          }
        }
      }
    /* los fugitivos que aún no han salido del campo son acosados */
    for (const s of [0, 1]) {
      const cabE = cmbVivos(L[1 - s]).some((b) => b.cl === "cab");
      for (const b of L[s].bl) if (b.rout && b.n > 0.5) golpe(b, b.n * b.st.vi * 0.05 * (cabE ? 1.5 : 0.5));
    }
    /* aplicar caídos: muertos y heridos */
    const caidos = [0, 0];
    for (const [tg, v] of dano) {
      const d = Math.min(tg.n, v / tg.st.vi),
        mf = tg.rout ? 0.75 : 0.3;
      tg.n -= d;
      tg.dead += d * mf;
      tg.her += d * (1 - mf);
      tg.perd += d;
      caidos[tg.s] += d;
    }
    /* general en peligro */
    for (const s of [0, 1]) {
      const O = L[s],
        n = cmbSuma0(O.bl);
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
        nAll = cmbSuma0(O.bl),
        cabE = cmbVivos(E).some((b) => b.cl === "cab");
      for (const b of O.bl) {
        if (b.n <= 0.5) continue;
        const dis = 1 - b.st.di * 0.05;
        if (b.rout) {
          b.fat = Math.min(100, b.fat + 4);
          if (b.n > b.n0 * 0.25 && !O.roto && R() < (b.st.di / 30) * (cabE ? 0.5 : 1) * (O.gOk ? 1.3 : 1)) {
            b.rout = false;
            b.mor = b.mx * 0.3;
            di(3, `Los ${cmbNom(b)} se reagrupan y vuelven a la lucha.`);
          }
          continue;
        }
        let dm = (b.perd / b.n0) * CMB_K.mor * dis + (susto.get(b) || 0) * dis;
        if (r >= 2 && cmbCuerpo(b)) dm += 2.5;
        if (b.fat > 60) dm += (b.fat - 60) * 0.08;
        dm += 10 * O.flank * (b.cl === "dis" ? 1.3 : 1);
        if (nAll < O.n0 * 0.7) dm += 3;
        dm += O.cont * dis;
        if (O.gOk) dm -= O.ma * 0.35;
        b.mor = Math.min(b.mx, b.mor - dm * (0.8 + R() * 0.4));
        const pel = r >= 2 && (cmbCuerpo(b) || b.ammo <= 0);
        b.fat = Math.min(
          100,
          Math.max(
            0,
            b.fat +
              (pel ? 9 : cmbTirador(b) ? 3 : -3) * b.st.fa * calor +
              (r === 2 && b.cl === "cab" ? 4 : 0),
          ),
        );
        if (b.mor <= 0) {
          b.rout = true;
          b.mor = 0;
          roto0.push(b);
          di(4, `¡Los ${cmbNom(b)} rompen filas y huyen!`);
        } else if (b.mor < b.mx * 0.35 && !b.vac) {
          b.vac = 1;
          di(2, `Los ${cmbNom(b)} vacilan.`);
        }
        if (b.fat > 75 && !b.dFat) {
          b.dFat = 1;
          di(1, `Los ${cmbNom(b)} están exhaustos.`);
        }
      }
      O.cont = (roto0.filter((b) => b.s === s).reduce((a, b) => a + b.n, 0) / Math.max(1, nAll)) * 30;
    }
    /* ¿se desmorona algún bando? */
    for (const s of [0, 1]) {
      const O = L[s],
        nv = cmbSuma0(cmbVivos(O)),
        nt = cmbSuma0(O.bl);
      if (nt < 1 || nv < nt * 0.3 || nv < O.n0 * 0.12 || (!cmbVivos(O).some(cmbCuerpo) && nv < nt * 0.6))
        O.roto = true;
    }
    let fase = r === 1 ? "Escaramuza" : r === 2 ? "Choque" : "Melé";
    if (L[0].roto || L[1].roto) {
      gana =
        L[1].roto && !L[0].roto
          ? 0
          : L[0].roto && !L[1].roto
            ? 1
            : cmbSuma0(cmbVivos(L[0])) / L[0].n0 > cmbSuma0(cmbVivos(L[1])) / L[1].n0
              ? 0
              : 1;
      const W = L[gana],
        Lo = L[1 - gana];
      Lo.roto = true;
      W.roto = false;
      /* persecución */
      const P = cmbVivos(W).reduce((a, b) => a + b.n * CMB_PERS[b.t] * (1 - b.fat / 200), 0),
        N = cmbSuma0(Lo.bl);
      let k =
        Math.max(N * 0.08, Math.min(N * 0.7, P * CMB_K.pers * cmbRnd())) *
        (terr.bosque > 0.3 ? 0.6 : 1) *
        (r >= env.rmax ? 0.6 : 1);
      k = Math.min(k, N);
      const pesos = Lo.bl.map((b) => b.n * (b.cl === "cab" ? 0.45 : 1)),
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
      const pc = cmbVivos(W)
        .filter((b) => b.cl === "cab")
        .sort((a, b) => b.n * CMB_PERS[b.t] - a.n * CMB_PERS[a.t])[0];
      di(
        6,
        `Desbandada en las filas de ${CIV[Lo.f].s}: ${pc ? "los " + cmbNom(pc) : "el enemigo"} persigue${pc ? "n" : ""} a los fugitivos; caen ${cmbH(k)}.`,
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
          const v = cmbVivos(O),
            n = cmbSuma0(v);
          return n ? (v.reduce((a, b) => a + b.n * (b.mor / b.mx), 0) / n) * 100 : 0;
        },
        gen0 =
          r === 1
            ? proy[0] + proy[1] > 1
              ? `Escaramuzas: ${cmbH(proy[0] + proy[1])} caen bajo flechas y piedras.`
              : "Las vanguardias se tantean."
            : r === 2
              ? "Las líneas chocan."
              : L.some((O) => cmbVivos(O).some((b) => b.fat > 55))
                ? "La melé se prolonga; el cansancio pesa."
                : "Se combate cuerpo a cuerpo.";
      ron.push({
        r,
        f: fase,
        t: ev.length
          ? ev[0][1] + (ev[1] && ev[1][0] >= 3 && ev[1][1].length < 70 ? " " + ev[1][1] : "")
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
  if (!est) {
    const tx = cmbFactores(fx, gana, L);
    informe = {
      f: [ejA.f, ejD.f],
      gana,
      fin,
      rondas: ron,
      factores: tx,
      bajas,
      gen,
      n0: [L[0].n0, L[1].n0],
      clima: env.clima,
      hora: env.hora,
      terreno: CMB_TERR[env.terr.tag] || env.terr.tag,
      fort,
      asedio: ctx.asedio || 0,
      lugar: ctx.nombreLugar || (ctx.p && ctx.p.name) || "",
      anio: G.year,
      modo: "auto",
    };
  }
  return { gana, A: out[0], D: out[1], heridos: { A: her[0], D: her[1] }, informe, gen };
}
/* factores decisivos: los tres que más bajas causaron (o evitaron) al ganador y uno del perdedor.
   fx[s][clave] = soldiers equivalentes; L[s] = {f, gen, n0} */
function cmbFactores(fx, gana, L) {
  const tx = [],
    lim = Math.max(2, (L[0].n0 + L[1].n0) * 0.012);
  for (const s of [gana, 1 - gana]) {
    const l = Object.entries(fx[s])
      .filter(([k, v]) => v > lim && CMB_FX[k])
      .sort((a, b) => b[1] - a[1])
      .slice(0, s === gana ? 3 : 1);
    for (const [k] of l)
      tx.push({
        k,
        s,
        txt: `${s === gana ? "" : "Pese a la derrota: "}${k === "mando" && L[s].gen != null && G.C[L[s].gen] ? "el mando de " + G.C[L[s].gen].n : CMB_FX[k].toLowerCase()} (${CIV[L[s].f].s})`.replace(
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

/* ---------- un ejército entra en una provincia ---------- */
const armyTxt = (f, u, g) =>
  `${CIV[f].s}: ${tot(u) * SPU} hombres${g != null && G.C[g] ? " al mando de " + G.C[g].n : ""}`;
const cmbComp = (f, u) =>
  TYP.filter((t) => u[t] > 0)
    .map((t) => `${u[t] * SPU} ${CIV[f].un[t].toLowerCase()}`)
    .join(", ");
function cmbVetGanar(xp, u, gana, rondas) {
  const v = { ...(xp || {}) },
    k = clamp(rondas / 6, 0.5, 1.5) * (gana ? 18 : 10);
  for (const t of TYP) if (u[t] > 0) v[t] = Math.min(100, (v[t] || 0) + k * (1 - (v[t] || 0) / 130));
  return v;
}
async function settle(p, q, s, g, xpA, oriA) {
  const f = p.owner;
  cmbNorm(s);
  cmbNorm(q.u);
  cmbNorm(p.u);
  xpA = xpA || cmbVetDe(p);
  oriA = oriA || cmbOriDe(p);
  if (q.owner === f) {
    cmbLlega(q, s, xpA, oriA);
    q.tired = true;
    if (g != null) {
      if (q.gen == null) q.gen = g;
      else if (p.gen == null) p.gen = g;
    }
    return;
  }
  const old = q.owner,
    gD = q.gen,
    n0 = tot(s),
    d0 = tot(q.u),
    xpD = { ...cmbVetDe(q) },
    oriD = { ...cmbOriDe(q) },
    ejA = { f, u: s, gen: g, vet: xpA, ori: oriA, fat: 10 },
    ejD = { f: old, u: { ...q.u }, gen: gD, vet: xpD, ori: oriD, fat: q.tired ? 5 : 0 },
    ctx = { fort: q.walls || 0, p: q, nombreLugar: q.name, terreno: cmbTerreno(q) };
  let res,
    ch = "auto";
  if (d0 <= 0) {
    res = { gana: 0, A: { ...s }, D: cmbVacio(), heridos: { A: 0, D: 0 }, informe: null, gen: [null, null] };
  } else {
    if (isMe(f)) {
      const pr = Math.round(cmbEstimar(ejA, ejD, ctx, 16) * 100),
        tr = ctx.terreno;
      ch = await modal(
        `Batalla por ${q.name}`,
        `<p>${armyTxt(f, s, g)}<br><span class="stats">${cmbComp(f, s)}</span><br>contra ${armyTxt(old, q.u, gD)}<br><span class="stats">${cmbComp(old, q.u)}</span>${q.walls ? "<br>tras murallas de nivel " + q.walls : ""}.</p><p class="dim">Terreno: ${CMB_TERR[tr.tag]}. Tus capitanes ven la batalla ${pr >= 70 ? "favorable" : pr >= 45 ? "incierta" : "desfavorable"} (≈${pr}% de victoria).</p><p>¿Cómo quieres librarla?</p>`,
        [
          { t: "Por turnos · 3 acciones", v: "t3", cls: "gold" },
          { t: "Por turnos · 1 acción", v: "t1", cls: "gold" },
          { t: "Tiempo real", v: "rt", cls: "gold" },
          { t: "Resolución automática", v: "auto" },
        ],
      );
    }
    res = ch !== "auto" ? await cmbTactica(ejA, ejD, ctx, ch) : cmbResolverAuto(ejA, ejD, ctx);
  }
  const win = res.gana === 0,
    A = cmbNorm(res.A),
    D = cmbNorm(res.D),
    inf = res.informe,
    ron = inf ? inf.rondas.length : 0;
  if (inf) cmbGuardarInf(inf);
  if (d0 > 0) {
    cmbFamaSumar(win ? f : old, d0 >= 2 && n0 >= 2 ? 1 : 0.25);
    cmbFamaSumar(win ? old : f, 0.25);
  }
  const gm = res.gen || [null, null];
  OC.emitirSync("batallaResuelta", {
    p: q,
    atacante: f,
    defensor: old,
    gana: win,
    A,
    D,
    s0: s,
    d0: ejD.u,
    gA: g,
    gD,
    bajas: inf ? inf.bajas : null,
    heridos: res.heridos,
    factores: inf ? inf.factores.map((x) => x.k) : [],
    rondas: ron,
    general: gm,
    modo: ch,
    informe: inf,
  });
  if (gm[0] === "muerto" && g != null) kill(G.C[g], "cae en la batalla de " + q.name);
  if (gm[1] === "muerto" && gD != null) kill(G.C[gD], "cae en la batalla de " + q.name);
  flash = { x: q.x * T + 4, y: q.y * T + 4, t0: performance.now() };
  const cls = isMe(f) ? "good" : isMe(old) ? "bad" : "",
    bA = inf ? Math.round(inf.bajas[0].m) : (n0 - tot(A)) * SPU,
    bD = inf ? Math.round(inf.bajas[1].m) : d0 * SPU;
  if (win) {
    if (gD != null && G.C[gD] && G.C[gD].alive && R() < 0.3) kill(G.C[gD], "cae defendiendo " + q.name);
    /* los supervivientes del defensor se repliegan a una provincia propia vecina */
    const ref = tot(D)
      ? MAP.adj[q.id]
          .map((i) => G.P[i])
          .filter((x) => x.owner === old)
          .sort((a, b) => tot(b.u) - tot(a.u))[0]
      : null;
    if (ref) {
      cmbLlega(ref, D, cmbVetGanar(xpD, D, false, ron), oriD);
      if (gD != null && G.C[gD] && G.C[gD].alive && ref.gen == null) ref.gen = gD;
    }
    Object.assign(q, {
      owner: f,
      u: A,
      tired: true,
      recent: 3,
      order: Math.min(q.order, 45),
      tax: 1,
      gen: g != null && G.C[g] && G.C[g].alive ? g : null,
    });
    cmbVetFijar(q, cmbVetGanar(xpA, A, true, ron));
    cmbOriFijar(q, oriA);
    if (q.walls) q.walls--;
    OC.emitirSync("conquista", { p: q, de: old, a: f });
    if (CIV[f].loot) G.F[f].gold += CIV[f].loot;
    addLog(
      `${CIV[f].s} conquista ${q.name}${old !== REB ? " a " + CIV[old].s : ""}. Caídos: ${bA} propios, ${bD} enemigos${ref ? `; ${tot(D) * SPU} supervivientes se repliegan a ${ref.name}` : ""}.`,
      cls,
    );
    if (q.cap && old < REB && q.home === old) addLog(`¡Cae la capital de ${CIV[old].s}!`, cls);
    if (old < REB && !alive(old))
      addLog(`${CIV[old].n} desaparece de la historia.`, isMe(old) ? "bad" : "good");
  } else {
    q.u = D;
    cmbVetFijar(q, cmbVetGanar(xpD, D, true, ron));
    cmbOriFijar(q, oriD);
    cmbLlega(p, A, cmbVetGanar(xpA, A, false, ron), oriA);
    p.tired = true;
    if (g != null && G.C[g] && G.C[g].alive) {
      if (!tot(A) && R() < 0.5) kill(G.C[g], "muere en " + q.name);
      else if (p.gen == null) p.gen = g;
    }
    addLog(
      `${CIV[f].s} fracasa en ${q.name}. Caídos: ${bA} propios, ${bD} enemigos.`,
      isMe(f) ? "bad" : isMe(old) ? "good" : "",
    );
  }
  /* informe para el jugador */
  if (inf && (isMe(f) || isMe(old)) && ch === "auto") {
    const yo = isMe(f) ? 0 : 1,
      gano = inf.gana === yo;
    if (yo === 0 || !gano || d0 + n0 >= 8)
      await modal(`${gano ? "Victoria" : "Derrota"} en ${q.name}`, cmbInfHtml(inf, yo), [
        { t: "Continuar", cls: "gold" },
      ]);
  }
  checkEnd();
}

/* ======================================================================
   INTERFAZ DE CAMPAÑA (sistema Campaña): dibujo de ejércitos, alcance y rutas en el mapa, panel del
   ejército seleccionado, sección «Ejército» de la provincia y pestaña «Campaña».
   La lógica (órdenes, asedios, estaciones) está en ejercitos.js; los mercenarios en mercenarios.js.
   ====================================================================== */
const CAM_ESTADO = { marcha: "en marcha", campamento: "acampado", asedio: "asediando", guarnicion: "de guarnición" };
let camRutaC = null;
/* ruta que se dibuja hasta la casilla bajo el ratón: [dentro del alcance, más allá] */
function camRutaHover(ej) {
  if (camHov < 0) return null;
  const k = `${ej.id}|${camHov}|${camVer}|${ej.mov}`;
  if (camRutaC && camRutaC.k === k) return camRutaC.r;
  const [x, y] = camXY(camHov);
  let r = null;
  if (MAP.terr[y] && MAP.terr[y][x] && !(x === ej.x && y === ej.y)) {
    const pr = camPlanRuta(ej, x, y, {});
    if (pr) {
      const D = camAlcance(ej),
        a = pr.ruta.filter((j) => Number.isFinite(D.dist[j]) && D.dist[j] <= ej.mov + 1e-9);
      let n = 0;
      while (n < pr.ruta.length && a.includes(pr.ruta[n])) n++;
      r = { dentro: pr.ruta.slice(0, n), fuera: pr.ruta.slice(n), luego: pr.plan.luego };
    }
  }
  camRutaC = { k, r };
  return r;
}
function camSprite(c, ej, X, Y, now) {
  const cab = Object.keys(ej.u).reduce((s, t) => s + (UN[t] && UN[t].cl === "cab" ? ej.u[t] || 0 : 0), 0),
    pal = PAL[ej.f] || PAL[0],
    bob = ej.est === "marcha" && !reduce ? Math.floor(now / 300 + ej.id) % 2 : 0;
  /* estandarte del pueblo */
  c.fillStyle = "#211c26";
  c.fillRect(X - 2, Y - 5, 1, 9);
  c.fillStyle = CIV[ej.f].c;
  c.fillRect(X - 1, Y - 5, 4, 3);
  c.fillStyle = CIV[ej.f].d;
  c.fillRect(X - 1, Y - 3, 4, 1);
  spr(c, cab * 2 > camTot(ej.u) ? SP.c : SP.i, X, Y - 3 - bob, pal);
  if (ej.est === "campamento") {
    /* tienda */
    c.fillStyle = "#e9dcb4";
    for (let k = 0; k < 4; k++) c.fillRect(X + 6 - k, Y + 3 + k, 1 + 2 * k, 1);
    c.fillStyle = "#6b4a2a";
    c.fillRect(X + 6, Y + 5, 1, 2);
  }
  const s = String(camTot(ej.u));
  c.fillStyle = "#000";
  for (const [a, b] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    c.fillText(s, X + 8 + a, Y + b);
  c.fillStyle = ej.mov > 0.5 || !isMe(ej.f) ? "#fff" : "#a9a9a9";
  c.fillText(s, X + 8, Y);
}
function camDibujar(now) {
  if (!G || !MAP) return;
  const S = camS(),
    c = ctx,
    sel = camSel != null ? camEj(camSel) : null,
    mio = sel && isMe(sel.f) && myTurn() && !G.over;
  /* alcance de la estación y ruta */
  if (mio) {
    const D = camAlcance(sel);
    c.globalAlpha = 0.16 + 0.08 * Math.sin(now / 160);
    c.fillStyle = "#fff";
    for (let i = 0; i < W * H; i++) if (D.dist[i] <= sel.mov + 1e-9 && i !== D.s) c.fillRect((i % W) * T, Math.floor(i / W) * T, T, T);
    c.globalAlpha = 0.45;
    c.fillStyle = "#ff5a3a";
    for (const p of G.P)
      if (camCiudadCerrada(sel.f, p) && CAM_V8.some(([dx, dy]) => D.dist[camIdx(p.x + dx, p.y + dy)] <= sel.mov + 1e-9 || (sel.x === p.x + dx && sel.y === p.y + dy)))
        c.fillRect(p.x * T, p.y * T, T, T);
    for (const e of S.ej) if (camGuerra(sel.f, e.f) && D.dist[camIdx(e.x, e.y)] <= sel.mov + 1e-9) c.fillRect(e.x * T, e.y * T, T, T);
    c.globalAlpha = 1;
    const r = camRutaHover(sel);
    if (r) {
      c.fillStyle = "#fff3b0";
      for (const j of r.dentro) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 3, 2, 2);
      c.fillStyle = "rgba(255,243,176,.45)";
      for (const j of r.fuera) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 3, 2, 2);
    }
  }
  /* huella de la última marcha */
  for (const e of S.ej) {
    if (!e.pas || !e.pas.length) continue;
    c.fillStyle = CIV[e.f].d;
    c.globalAlpha = 0.6;
    for (const j of e.pas) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 4, 2, 1);
    c.globalAlpha = 1;
  }
  /* campamentos mercenarios */
  if (typeof mercS === "function")
    for (const m of mercS().camp) {
      if (!m.cias.length) continue;
      const X = m.x * T,
        Y = m.y * T;
      c.fillStyle = "#c9a227";
      for (let k = 0; k < 4; k++) c.fillRect(X + 4 - k, Y + 3 + k, 1 + 2 * k, 1);
      c.fillStyle = "#211c26";
      c.fillRect(X + 4, Y - 2, 1, 5);
      c.fillStyle = "#e8b632";
      c.fillRect(X + 5, Y - 2, 3, 2);
    }
  /* asedios: escalas y fuego sobre la ciudad */
  for (const a of Object.values(S.as)) {
    const p = G.P[a.p];
    if (!p) continue;
    const X = p.x * T,
      Y = p.y * T,
      fl = Math.floor(now / 200) % 2;
    c.fillStyle = "#6b4a2a";
    c.fillRect(X - 1, Y - 4, 1, 8);
    c.fillRect(X + 1, Y - 4, 1, 8);
    for (let k = 0; k < 4; k++) c.fillRect(X - 1, Y - 3 + k * 2, 3, 1);
    c.fillStyle = fl ? "#ff7a2a" : "#ffd04a";
    c.fillRect(X + 6, Y - 6 + fl, 2, 2);
    if (a.vi < 0) {
      c.fillStyle = "#e0503f";
      c.fillRect(X + 3, Y - 7, 2, 2);
    }
  }
  /* ejércitos */
  const ciu = camCiudades();
  for (const e of S.ej) {
    if (camTot(e.u) <= 0) continue;
    let X = e.x * T + 1,
      Y = e.y * T + 2;
    if (ciu.has(camIdx(e.x, e.y))) X -= 8;
    camSprite(c, e, X, Y, now);
    if (e.id === camSel && Math.floor(now / 350) % 2) {
      c.strokeStyle = "#fff";
      c.lineWidth = 1;
      c.strokeRect(e.x * T + 0.5, e.y * T + 0.5, T - 1, T - 1);
    }
  }
  /* estación en curso */
  const tx = `${CAM_EST[G.estacion]} ${G.year}`;
  c.fillStyle = "rgba(0,0,0,.55)";
  c.fillRect(2, 2, tx.length * 8 + 6, 12);
  c.fillStyle = G.estacion === 3 ? "#cfe3ff" : "#f2d27a";
  c.fillText(tx, 5, 4);
  /* el botón de fin de turno dice qué termina (la interfaz escribe «Fin del año») */
  const eb = $("endb");
  if (eb && !busy && myTurn() && !G.over && !net.on) {
    const t = camTextoFin();
    if (eb.textContent !== t) eb.textContent = t;
  }
}
/* casilla del mapa bajo el puntero */
function camCasillaEv(e) {
  const b = cv.getBoundingClientRect(),
    x = Math.floor(((e.clientX - b.left) / b.width) * W),
    y = Math.floor(((e.clientY - b.top) / b.height) * H);
  return x >= 0 && y >= 0 && x < W && y < H ? [x, y] : null;
}
function camHoverTxt(x, y) {
  const es = camEjsEn(x, y);
  if (es.length)
    return es
      .map((e) => `${camNombre(e)} (${CIV[e.f].s}) · ${camTot(e.u) * SPU} hombres · ${CAM_ESTADO[e.est] || e.est}`)
      .join(" | ");
  const m = typeof mercS === "function" ? mercS().camp.find((c) => c.x === x && c.y === y && c.cias.length) : null;
  if (m) return `${m.nom}: ${m.cias.map((c) => c.nom).join(", ")}`;
  return "";
}
/* ejecuta una orden del jugador con la interfaz bloqueada y animación */
async function camOrdenUI(o) {
  if (busy) return;
  busy = true;
  ui();
  let r;
  try {
    r = await camAplicarOrden(G, o, { anim: true });
  } catch (e) {
    console.error(e);
  } finally {
    busy = false;
  }
  if (r && !r.ok && r.motivo) addLog(r.motivo, "bad");
  if (camSel != null && !camEj(camSel)) camSel = null;
  ui();
  save();
  return r;
}
/* clic en el mapa: devuelve true si la campaña lo atiende */
function camClic(x, y) {
  const aqui0 = camS(),
    aqui = aqui0 && camEjsEn(x, y),
    mio = aqui.find((e) => isMe(e.f)),
    cur = camSel != null ? camEj(camSel) : null;
  if (cur && isMe(cur.f) && myTurn() && !G.over) {
    if (cur.x === x && cur.y === y) {
      camSel = null;
      return false;
    }
    if (mio && mio.id !== cur.id && !(camCheb(cur.x, cur.y, x, y) <= 1 && cur.mov > 0)) {
      camSel = mio.id;
      ui();
      return true;
    }
    if (!MAP.terr[y][x]) {
      camSel = null;
      ui();
      return true;
    }
    const pid = MAP.grid[y][x],
      o = G.P[pid].owner;
    if (!camPaso(cur.f, o)) {
      modal(
        `Tierras de ${CIV[o].s}`,
        `<p>Estás en ${G.st[ME][o]} con ${CIV[o].n} y no tienes derecho de paso. Para entrar en ${G.P[pid].name} hay que declarar la guerra (o pactar el paso en Diplomacia).</p>`,
        [
          {
            t: "Declarar la guerra…",
            cls: "red",
            fn: () =>
              setTimeout(async () => {
                if (typeof dipModalGuerra === "function") {
                  dipModalGuerra(o);
                  await mq;
                } else declareWar(ME, o);
                if (camGuerra(ME, o)) camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y });
              }, 0),
          },
          { t: "Cancelar" },
        ],
      );
      return true;
    }
    const otro = mio && mio.id !== cur.id ? mio : null;
    camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, luego: otro ? "unir" : undefined, con: otro ? otro.id : undefined });
    return true;
  }
  if (aqui.length) {
    camSel = (mio || aqui[0]).id;
    const p = camProv(camEj(camSel));
    if (p) sel = p.id;
    if (tab !== "prov") tab = "prov";
    ui();
    return true;
  }
  if (camSel != null) camSel = null;
  return false;
}
/* ---------- panel del ejército seleccionado ---------- */
const camBarra = (v, mx, col) => `<div class="bar"><i style="width:${clamp((v / mx) * 100, 0, 100)}%;background:${col}"></i></div>`;
function camPanelEj(dis) {
  const ej = camSel != null ? camEj(camSel) : null;
  if (!ej) return "";
  const p = camProv(ej),
    mio = isMe(ej.f),
    g = camGen(ej),
    mx = camMovMax(ej),
    as = ej.asd != null ? camAsedio(ej.asd) : null,
    q = ej.asd != null ? G.P[ej.asd] : null,
    m = camMaq(ej),
    d = dis || !mio,
    b = (act, txt, ok, tit = "") => `<button data-act="cam-${act}" ${d || !ok ? "disabled" : ""} title="${esc(tit)}">${txt}</button>`;
  let h = `<h2 style="color:${CIV[ej.f].c}">${esc(camNombre(ej))}</h2><p class="dim">${CIV[ej.f].n} · ${CAM_ESTADO[ej.est] || ej.est}${p ? ` en ${p.name} (${p.owner === ej.f ? "tierra propia" : CIV[p.owner].s})` : ""} · ${camEstTxt()}</p>`;
  h += `<div class="cam-st"><span>Marcha ${Math.round(ej.mov * 10) / 10}/${mx}</span>${camBarra(ej.mov, mx, "#e8b632")}<span>Víveres ${ej.sum}/${CAM_K.sumMax} estaciones</span>${camBarra(ej.sum, CAM_K.sumMax, ej.sum <= 0 ? "#e0503f" : "#4caf50")}<span>Cansancio ${Math.round(ej.fat)}</span>${camBarra(ej.fat, 100, "#b0763a")}<span>Moral ${Math.round(ej.mor)}</span>${camBarra(ej.mor, 100, "#5a8fd6")}</div>`;
  const ts = Object.keys(ej.u).filter((t) => UN[t] && ej.u[t] > 0);
  h += `<div class="troops">${ts.map((t) => `<div><img src="${icon(ej.f, t)}" alt=""><b>${ej.u[t]}</b>${(CIV[ej.f].un && CIV[ej.f].un[t]) || UN[t].s}</div>`).join("")}</div>`;
  const her = Object.values(ej.her || {}).reduce((a, b) => a + b, 0),
    mq0 = Object.entries(m).filter(([, v]) => v > 0);
  h += `<p class="stats">${camTot(ej.u) * SPU} hombres · fuerza ${pw(camUCampo(ej.u))}${her ? ` · ${her * SPU} heridos en los carros` : ""}${mq0.length ? " · " + mq0.map(([k, v]) => `${v} ${v > 1 ? CAM_MAQ[k].pl : CAM_MAQ[k].n.toLowerCase()}`).join(", ") : ""}${(ej.obra || []).length ? " · construyendo: " + ej.obra.map((o) => `${CAM_MAQ[o.t].n.toLowerCase()} (${o.q} est.)`).join(", ") : ""}</p>`;
  if (mio) {
    const free = family(ME).filter((c) => c.age >= 16 && !genOf(c) && !c.dipReh && !camS().ej.some((e) => e.gen === c.id));
    h += g
      ? `<p>General: <b>${g.n}</b> (mando ${g.ma}) <button data-act="cam-gen:${ej.id}:-1" ${d ? "disabled" : ""}>Retirar</button></p>`
      : free.length
        ? `<div class="g2"><select id="camgsel" aria-label="General del ejército">${free.map((c) => `<option value="${c.id}">${c.n} · mando ${c.ma}</option>`).join("")}</select><button data-act="cam-gen:${ej.id}:s" ${d ? "disabled" : ""}>Dar el mando</button></div>`
        : `<p class="dim">Sin general.</p>`;
  } else if (g) h += `<p>General: <b>${g.n}</b> (mando ${g.ma})</p>`;
  /* asedio */
  if (q && as) {
    const ap = typeof ecoApoyoAsedio === "function" ? ecoApoyoAsedio(q, ej.f) : 0,
      pr = mio ? Math.round(cmbEstimar(camParaBatalla(ej), camGuarnicion(q), camCtxAsalto(ej, q), 6) * 100) : null;
    h += `<h3>Asedio de ${q.name}</h3><p class="stats">${as.n} ${as.n === 1 ? "estación" : "estaciones"} de cerco · víveres de la guarnición: ${as.vi >= 0 ? as.vi + " estaciones" : "¡hambre!"} · moral ${Math.round(as.mo)} · el pueblo ${ap > 0.3 ? "resiste" : ap < -0.3 ? "quiere abrir las puertas" : "duda"}<br>Murallas ${q.walls || 0} → ${camFortEf(q, ej, as)} con tus máquinas${as.brecha ? ` (brecha ${Math.round(as.brecha * 100) / 100})` : ""} · guarnición ${tot(q.u) * SPU} hombres${pr != null ? ` · asalto ≈${pr}%` : ""}</p>`;
  }
  if (mio) {
    const ady = G.P.filter((c) => camCiudadCerrada(ej.f, c) && camCheb(c.x, c.y, ej.x, ej.y) <= 1),
      otro = camEjsEn(ej.x, ej.y, ej.id).find((e) => e.f === ej.f);
    h += `<div class="btns">`;
    h += b(`acampar:${ej.id}`, "Acampar", ej.est !== "asedio" && ej.est !== "campamento", "Campamento fortificado: descansa, cura heridos y, en tierra ajena, saquea la comarca");
    if (ej.est === "asedio") {
      h += b(`asaltar:${ej.id}`, "Asaltar", true, "Asalto a las murallas con las máquinas que tengas");
      for (const k in CAM_MAQ) {
        const mo = camPuedeMaq(ej, k);
        h += b(`maq:${ej.id}:${k}`, `${CAM_MAQ[k].n}<small>${OC.textoCoste(camCosteMaq(ME, k))} · ${CAM_MAQ[k].est} est.</small>`, !mo, mo || `Se termina en ${CAM_MAQ[k].est} ${CAM_MAQ[k].est > 1 ? "estaciones" : "estación"}`);
      }
      h += b(`levantar:${ej.id}`, "Levantar el cerco", true);
    } else for (const c of ady) h += b(`asediar:${ej.id}:${c.id}`, `Asediar ${c.name}`, true, "Rodear la ciudad: sus víveres y su moral irán cayendo");
    h += b(`disolver:${ej.id}`, "Disolver", p && p.owner === ej.f, "Las tropas pasan a la guarnición de la provincia (solo en tierra propia)");
    h += b(`dividir:${ej.id}`, "Dividir", camTot(ej.u) > 1, "Separa la mitad en un destacamento");
    if (otro) h += b(`unir:${ej.id}:${otro.id}`, "Unir", true, "Reúne los dos ejércitos de esta casilla");
    h += `<button data-act="cam-desel">Deseleccionar</button></div>`;
    /* mercenarios del campamento vecino */
    if (typeof mercCampoCerca === "function")
      for (const c of mercCampoCerca(ej))
        h += `<h3>${esc(c.nom)}</h3>${mercHtmlCias(c.cias, d, (cia, a) => `camm-k:${ej.id}:${c.id}:${cia.id}.${a}`)}`;
    h += `<p class="note">${ej.mov > 0.5 ? "Clic en una casilla iluminada para marchar; en una ciudad enemiga (roja), para asediarla; en una de tus ciudades, para acuartelarte. Más allá del alcance, la marcha sigue la estación siguiente." : "Este ejército ya no puede marchar esta estación."}${ej.plan ? " Marcha pendiente." : ""}</p>`;
  } else h += `<div class="btns"><button data-act="cam-desel">Cerrar</button></div>`;
  return h;
}
/* sección «Ejército» de la provincia (en provPanel) */
function camSeccionProv(p, dis) {
  if (!p || p.owner !== ME) return "";
  const can = tot(p.u) > 0 && !dis && !camEjsEn(p.x, p.y).some((e) => e.f !== ME),
    gc = G.C[p.gen],
    aqui = camS().ej.filter((e) => e.f === ME && camProv(e) === p),
    as = camAsedio(p.id);
  let h = `<h3>Ejército</h3><div class="g3"><button data-act="cam-formar:${p.id}:1" ${can ? "" : "disabled"}>Formar con todo</button><button data-act="cam-formar:${p.id}:0.5" ${can && tot(p.u) > 1 ? "" : "disabled"}>Con la mitad</button><button data-act="cam-elegir:${p.id}" ${can ? "" : "disabled"}>Elegir tropas…</button></div>`;
  if (as) {
    const sit = camSitiadores(p.id);
    h += `<p class="note">¡${p.name} está sitiada por ${CIV[as.f].s}! ${as.n} estaciones de cerco · víveres ${as.vi >= 0 ? as.vi + " estaciones" : "agotados"}.</p><div class="btns"><button data-act="cam-salida:${p.id}" ${dis || !tot(p.u) || !sit.length ? "disabled" : ""}>Hacer una salida</button></div>`;
  }
  if (aqui.length)
    h += `<div class="btns">${aqui.map((e) => `<button data-act="cam-sel:${e.id}">${esc(camNombre(e))} · ${camTot(e.u)}</button>`).join("")}</div>`;
  h += `<p class="note">${p.tired ? "Estas tropas ya marcharon esta estación: el ejército no podrá moverse hasta la siguiente." : "Fuerza " + Math.round(pw(p.u) * gb(p.gen)) + (gc ? ` · ${gc.n} irá al mando del ejército` : "") + `. Un ejército sale al mapa y marcha por casillas (${CAM_EST[G.estacion].toLowerCase()}).`}</p>`;
  return h;
}
function camModalElegir(p) {
  const ts = TYP.filter((t) => (p.u[t] || 0) > 0);
  modal(
    `Formar un ejército en ${p.name}`,
    `<div class="cam-el">${ts.map((t) => `<label><img src="${icon(ME, t)}" alt="">${CIV[ME].un[t]} <input type="number" min="0" max="${p.u[t]}" value="${p.u[t]}" data-cam-t="${t}"> / ${p.u[t]}</label>`).join("")}</div>${p.gen != null && G.C[p.gen] ? `<label class="cam-el"><input type="checkbox" id="camgen" checked> ${G.C[p.gen].n} va al mando</label>` : ""}`,
    [
      {
        t: "Formar",
        cls: "gold",
        fn: () => {
          const u = {};
          document.querySelectorAll("#modalc [data-cam-t]").forEach((i) => (u[i.dataset.camT] = +i.value || 0));
          const gen = !!document.querySelector("#modalc #camgen")?.checked;
          setTimeout(() => camOrdenUI({ tipo: "formar", f: ME, p: p.id, u, gen }).then((r) => r && r.ok && (camSel = r.ej) && ui()), 0);
        },
      },
      { t: "Cancelar" },
    ],
  );
}
OC.accion("cam", (v) => {
  const [k, a, b2] = v.split(":"),
    id = +a;
  const o = { f: ME };
  if (k === "desel") {
    camSel = null;
    return;
  }
  if (k === "sel") {
    camSel = id;
    const e = camEj(id);
    if (e) centerOn(camPid(e.x, e.y));
    tab = "prov";
    return;
  }
  if (k === "rapido") {
    camS().rapido = !camS().rapido;
    return;
  }
  if (k === "elegir") {
    camModalElegir(G.P[id]);
    return false;
  }
  if (k === "formar") {
    const p = G.P[id],
      u = {};
    for (const t of TYP) u[t] = Math.floor((p.u[t] || 0) * +b2);
    camOrdenUI({ tipo: "formar", f: ME, p: id, u, gen: +b2 >= 1 }).then((r) => {
      if (r && r.ok) camSel = r.ej;
      ui();
    });
    return false;
  }
  if (k === "gen") {
    const c = b2 === "s" ? +($("camgsel") || {}).value : null;
    camOrdenUI({ tipo: "general", f: ME, ej: id, c: b2 === "s" ? c : null });
    return false;
  }
  const map = { acampar: "acampar", asaltar: "asaltar", levantar: "levantar", disolver: "disolver", dividir: "dividir" };
  if (map[k]) camOrdenUI({ ...o, tipo: map[k], ej: id });
  else if (k === "asediar") camOrdenUI({ ...o, tipo: "asediar", ej: id, p: +b2 });
  else if (k === "maq") camOrdenUI({ ...o, tipo: "construir", ej: id, maq: b2 });
  else if (k === "unir") camOrdenUI({ ...o, tipo: "unir", ej: id, con: +b2 });
  else if (k === "salida") camOrdenUI({ ...o, tipo: "salida", p: id });
  return false;
});
/* ---------- pestaña «Campaña» ---------- */
OC.panel({
  id: "cam",
  titulo: "Campaña",
  orden: 16,
  render: (dis) => {
    const S = camS(),
      mios = S.ej.filter((e) => isMe(e.f)),
      cercos = Object.values(S.as).filter((a) => a.f === ME || (G.P[a.p] && G.P[a.p].owner === ME)),
      ene = S.ej.filter((e) => camGuerra(ME, e.f) && camProv(e) && camProv(e).owner === ME);
    let h = `<h2>Campaña · ${camEstTxt()}</h2><p class="dim">Cada turno es una estación. Los ejércitos marchan por casillas hasta agotar su alcance (la clase más lenta, el general, las calzadas y el invierno lo deciden). La economía y la investigación se cierran al acabar el invierno.</p>`;
    h += `<div class="btns"><button data-act="cam-rapido" title="Sin ejércitos fuera ni cercos, el año pasa de una vez">${S.rapido ? "☑" : "☐"} Estaciones rápidas sin campañas</button></div>`;
    h += `<h3>Tus ejércitos</h3>${mios.length ? `<div class="btns">${mios.map((e) => `<button data-act="cam-sel:${e.id}">${esc(camNombre(e))}<small>${camTot(e.u) * SPU} h. · ${CAM_ESTADO[e.est]} · ${camProv(e)?.name || ""}</small></button>`).join("")}</div>` : `<p class="dim">Ninguno en campaña. Fórmalos desde la provincia (sección Ejército).</p>`}`;
    if (ene.length) h += `<h3>Enemigos en tu tierra</h3><div class="btns">${ene.map((e) => `<button data-act="cam-sel:${e.id}">${esc(camNombre(e))}<small>${CIV[e.f].s} · ${camTot(e.u) * SPU} h. · ${camProv(e).name}</small></button>`).join("")}</div>`;
    if (cercos.length)
      h += `<h3>Asedios</h3>${cercos.map((a) => `<p class="stats">${G.P[a.p].name}: ${a.f === ME ? "lo sitias tú" : "te sitia " + CIV[a.f].s} · ${a.n} estaciones · víveres ${a.vi >= 0 ? a.vi : "agotados"} · moral ${Math.round(a.mo)}</p>`).join("")}`;
    if (typeof mercS === "function") {
      const M = mercS(),
        con = M.con.filter((c) => c.f === ME);
      h += `<h3>Mercenarios</h3>`;
      h += con.length
        ? con
            .map((c) => {
              const n = mercCuenta(ME, c.t);
              return `<div class="cam-merc"><img src="${icon(ME, c.t)}" alt=""><div><b>${esc(c.nom)}</b> <span class="stats">${n * SPU} hombres · ${mercPago(c.t, n)} oro/estación · hasta ${c.hasta}${c.imp ? " · ¡sin cobrar!" : ""}</span><div class="btns"><button data-act="camm-r:${c.t}" ${dis ? "disabled" : ""}>Renovar</button><button data-act="camm-l:${c.t}" ${dis ? "disabled" : ""}>Licenciar</button></div></div></div>`;
            })
            .join("")
        : `<p class="dim">Sin compañías a sueldo. Se contratan llegando con un ejército a un campamento mercenario (tienda dorada del mapa) o en tus ciudades.</p>`;
      h += `<p class="stats">Campamentos: ${M.camp.filter((c) => c.cias.length).map((c) => `${esc(c.nom)} (${G.P[camPid(c.x, c.y)]?.name || "?"})`).join(" · ") || "ninguno"}.</p>`;
    }
    return h;
  },
});
