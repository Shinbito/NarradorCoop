/* ---------- SONIDO: efectos de batalla posicionales, sintetizados con WebAudio (sin archivos) ----------
   - Reutiliza el AudioContext de musica.js (AU.ctx). Se arranca con el primer gesto (pointerdown/keydown).
   - Al abrir la primera batalla se «hornea» un banco de sonidos (OfflineAudioContext → AudioBuffer, unos
     segundos de audio por variante); luego cada efecto es un BufferSource + ganancia + paso bajo + panorama.
   - Los sucesos se OBSERVAN: cada fotograma se compara el estado global BT con una copia propia (Map por u.id)
     — bajas, munición, huidas, cargas, movimiento, muralla (hp, rota), flechas de las torres (BT.fx) —; no se
     toca batalla.js.
   - Oyente = la cámara: 3D (b3dPantalla, b3dPxCasilla) o vista clásica (#bmap dentro de #bscroll). Volumen y
     paso bajo según la distancia (alejar el zoom = más lejos), panorama según la posición en pantalla.
   - Categorías (opcVol): Efectos (espadas, cascos, pasos, flechas, máquinas, muros, fuego), Voces (gritos de
     guerra, de huida, de muerte), Ambiente (viento, fragor lejano, pájaros del mapa de campaña).
   - Límites: ≤ SND.MAX efectos sueltos + SND.MAXC «camas» de pasos/cascos + bucles (viento, fragor, ≤ 3 fuegos);
     cubetas por tipo (eventos/s); los sucesos parecidos del mismo fotograma y zona se funden en uno más rico.
   - sndEv(tipo, {x, y, vol, n, dur}) dispara un sonido a mano (x, y en casillas del campo; sin x: centrado).
   - SND.stats: contadores por tipo (n), descartes, voces máximas, ms por fotograma… para las pruebas.
   Globales con prefijo SND / snd. */
const SND = {
  ctx: null,
  out: null,
  bus: {},
  bank: null,
  cargando: false,
  voces: [],
  camas: [],
  MAX: 24,
  MAXC: 14,
  activo: false,
  bt: null,
  est: new Map(),
  pend: [],
  stats: {
    n: {},
    ev: {},
    descartado: 0,
    inaudible: 0,
    mudo: 0,
    noListo: 0,
    vocesMax: 0,
    vivasMax: 0,
    bancoSyncMs: 0,
    camasMax: 0,
    tics: 0,
    ms: 0,
    msMax: 0,
    msTot: 0,
    viento: 0,
    fragor: 0,
    bancoMs: 0,
    bancoMB: 0,
    err: 0,
    vista: "",
  },
};
function sndEv(tipo, d) {
  return SND._ev ? SND._ev(tipo, d || {}) : false;
}
(() => {
  const rr = (a, b) => a + Math.random() * (b - a),
    cl = (v, a, b) => (v < a ? a : v > b ? b : v),
    pick = (l) => l[Math.floor(Math.random() * l.length)],
    S = SND.stats;
  const cuenta = (k) => (S.n[k] = (S.n[k] || 0) + 1);
  const evc = (k) => (S.ev[k] = (S.ev[k] || 0) + 1);

  /* ======================= categorías y niveles ======================= */
  const CAT = {
    espada: "Efectos",
    escudo: "Efectos",
    golpe: "Efectos",
    choque: "Efectos",
    galope: "Efectos",
    relincho: "Efectos",
    pasos: "Efectos",
    carrera: "Efectos",
    ruedas: "Efectos",
    arco: "Efectos",
    ballesta: "Efectos",
    jabalina: "Efectos",
    silbido: "Efectos",
    silbidoPiedra: "Efectos",
    flechazo: "Efectos",
    catapulta: "Efectos",
    impacto: "Efectos",
    ariete: "Efectos",
    derrumbe: "Efectos",
    desprendimiento: "Efectos",
    madera: "Efectos",
    fuego: "Efectos",
    grito: "Voces",
    gritoEjercito: "Voces",
    huida: "Voces",
    muerte: "Voces",
    fragor: "Ambiente",
    viento: "Ambiente",
    pajaros: "Ambiente",
  };
  const NIV = {
    espada: 0.4,
    escudo: 0.45,
    golpe: 0.42,
    choque: 0.75,
    galope: 0.6,
    relincho: 0.42,
    pasos: 0.5,
    carrera: 0.5,
    ruedas: 0.45,
    arco: 0.5,
    ballesta: 0.5,
    jabalina: 0.42,
    silbido: 0.32,
    silbidoPiedra: 0.5,
    flechazo: 0.45,
    catapulta: 0.8,
    impacto: 0.85,
    ariete: 0.8,
    derrumbe: 1,
    desprendimiento: 0.7,
    madera: 0.7,
    fuego: 0.55,
    grito: 0.6,
    gritoEjercito: 0.8,
    huida: 0.55,
    muerte: 0.42,
  };
  const NIVCAT = { Efectos: 0.9, Voces: 0.8, Ambiente: 0.75 };
  /* cubetas: [eventos por segundo, máximo acumulado] */
  const CUB = {
    espada: [14, 6],
    escudo: [8, 4],
    golpe: [8, 4],
    choque: [2, 3],
    relincho: [0.5, 2],
    grito: [1.2, 3],
    huida: [0.8, 2],
    muerte: [3.5, 3],
    arco: [6, 4],
    ballesta: [4, 3],
    jabalina: [4, 3],
    silbido: [6, 4],
    silbidoPiedra: [3, 3],
    flechazo: [6, 4],
    catapulta: [3, 3],
    impacto: [3, 3],
    ariete: [2, 2],
    madera: [2, 2],
    desprendimiento: [1, 2],
  };
  const FUNDE = new Set(["muerte", "huida", "grito", "arco", "ballesta", "jabalina", "flechazo", "impacto", "catapulta", "silbido", "silbidoPiedra", "golpe"]);

  /* ======================= banco: síntesis fuera de línea ======================= */
  const NZ = {};
  function ruidos(sr) {
    if (NZ[sr]) return NZ[sr];
    const c = SND.ctx,
      w = c.createBuffer(1, sr * 2, sr),
      b = c.createBuffer(1, sr * 3, sr),
      dw = w.getChannelData(0),
      db = b.getChannelData(0);
    for (let i = 0; i < dw.length; i++) dw[i] = Math.random() * 2 - 1;
    let l = 0;
    for (let i = 0; i < db.length; i++) {
      l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      db[i] = l * 3.5;
    }
    return (NZ[sr] = { w, b });
  }
  /* envolvente de percusión en un AudioParam */
  function perc(p, t, pk, at, de) {
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(pk, t + at);
    p.exponentialRampToValueAtTime(Math.max(1e-5, pk * 0.0008), t + at + de);
    p.setValueAtTime(0, t + at + de + 0.002);
  }
  function envp(p, t, pts, k = 1) {
    p.setValueAtTime(0, t);
    for (const [a, v] of pts) p.linearRampToValueAtTime(v * k, t + a);
  }
  /* --- granos percusivos escritos a mano en o.acc (mucho más baratos que crear nodos) --- */
  function coef(tipo, f, Q, sr) {
    const w = (2 * Math.PI * Math.min(f, sr * 0.45)) / sr,
      cs = Math.cos(w),
      sn = Math.sin(w);
    let b0, b1, b2, a0, a1, a2;
    if (tipo === "bandpass") {
      const al = sn / (2 * Q);
      b0 = al;
      b1 = 0;
      b2 = -al;
      a0 = 1 + al;
      a1 = -2 * cs;
      a2 = 1 - al;
    } else {
      const al = sn / (2 * 0.7071);
      a0 = 1 + al;
      a1 = -2 * cs;
      a2 = 1 - al;
      if (tipo === "lowpass") {
        b0 = (1 - cs) / 2;
        b1 = 1 - cs;
      } else {
        b0 = (1 + cs) / 2;
        b1 = -(1 + cs);
      }
      b2 = b0;
    }
    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  }
  /* ráfaga de ruido filtrado (ataque lineal, caída exponencial) */
  function nb(o, tipo, f, Q, t, at, de, a, buf) {
    if (t < 0 || a <= 0) return;
    const sr = o.sr,
      A = o.acc,
      i0 = Math.floor(t * sr),
      n = Math.min(A.length - i0, Math.ceil((at + de) * sr));
    if (n <= 0) return;
    const [b0, b1, b2, a1, a2] = coef(tipo, f, Q, sr),
      nA = Math.max(1, Math.round(at * sr)),
      r = Math.exp(Math.log(0.0008) / Math.max(1, de * sr)),
      src = buf ? buf.getChannelData(0) : null,
      L = src ? src.length : 0;
    let p = src ? Math.floor(Math.random() * L) : 0,
      x1 = 0,
      x2 = 0,
      y1 = 0,
      y2 = 0,
      e = 1;
    for (let k = 0; k < n; k++) {
      const x = src ? src[p++ % L] : Math.random() * 2 - 1,
        y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      let g;
      if (k < nA) g = k / nA;
      else g = e *= r;
      A[i0 + k] += y * g * a;
    }
  }
  /* ruido sostenido con envolvente por puntos (segundos absolutos) */
  function cama(o, tipo, f, Q, t0, pts, a, buf) {
    const c = o.c,
      s = c.createBufferSource(),
      fl = c.createBiquadFilter(),
      g = c.createGain(),
      fin = pts[pts.length - 1][0];
    s.buffer = buf || o.W;
    s.loop = true;
    fl.type = tipo;
    fl.frequency.value = Math.min(f, o.sr * 0.45);
    fl.Q.value = Q;
    envp(g.gain, t0, pts, a);
    s.connect(fl);
    fl.connect(g);
    g.connect(o.o);
    s.start(t0, Math.random() * (s.buffer.duration - 0.3));
    s.stop(t0 + fin + 0.02);
    return { fl, g };
  }
  const SEN = new Float32Array(4097);
  for (let k = 0; k <= 4096; k++) SEN[k] = Math.sin((2 * Math.PI * k) / 4096);
  /* tono (seno, triángulo o sierra) con caída de altura opcional, en o.acc */
  function tb(o, tipo, f, t, at, de, a, f1) {
    if (t < 0 || a <= 0 || f > o.sr * 0.45) return;
    const sr = o.sr,
      A = o.acc,
      i0 = Math.floor(t * sr),
      n = Math.min(A.length - i0, Math.ceil((at + de) * sr));
    if (n <= 0) return;
    const nA = Math.max(1, Math.round(at * sr)),
      r = Math.exp(Math.log(0.0008) / Math.max(1, de * sr)),
      rf = f1 ? Math.pow(f1 / f, 1 / n) : 1;
    let fr = f / sr,
      ph = Math.random(),
      e = 1;
    for (let k = 0; k < n; k++) {
      ph += fr;
      if (ph >= 1) ph -= 1;
      fr *= rf;
      const w = tipo === "sine" ? SEN[(ph * 4096) | 0] : tipo === "triangle" ? 1 - 4 * Math.abs(ph - 0.5) : 2 * ph - 1;
      let g;
      if (k < nA) g = k / nA;
      else g = e *= r;
      A[i0 + k] += w * g * a;
    }
  }
  function fade(o, D, fi, fo) {
    o.fd = [D, fi, fo];
    const p = o.o.gain;
    p.setValueAtTime(0, 0);
    p.linearRampToValueAtTime(1, fi);
    p.setValueAtTime(1, D - fo);
    p.linearRampToValueAtTime(0, D);
  }
  /* --- primitivas --- */
  function metal(o, t, f0, a, de) {
    const RT = [1, 2.76, 5.4, 8.93],
      AM = [1, 0.55, 0.35, 0.18],
      DE = [1, 0.7, 0.45, 0.28];
    for (let k = 0; k < 4; k++) tb(o, "sine", f0 * RT[k] * rr(0.985, 1.015), t, 0.0008, de * DE[k] * rr(0.8, 1.2), a * AM[k] * 0.5);
    tb(o, "sine", f0 * rr(1.008, 1.02), t, 0.0008, de * 0.9, a * 0.25);
    nb(o, "highpass", 3000, 0.7, t, 0.0005, 0.018, a * 0.7);
  }
  function madera(o, t, f, a, de) {
    nb(o, "bandpass", f, 3.5, t, 0.001, de, a);
    tb(o, "sine", f * 0.5, t, 0.001, de * 0.8, a * 0.45, f * 0.33);
  }
  function sordo(o, t, a) {
    nb(o, "lowpass", 260, 0.7, t, 0.002, 0.07, a);
    tb(o, "sine", rr(75, 95), t, 0.002, 0.08, a * 0.8, 42);
  }
  function piedra(o, t, f, a) {
    nb(o, "bandpass", f, rr(4, 8), t, 0.0005, rr(0.015, 0.05), a);
    nb(o, "bandpass", f * rr(1.5, 2.2), 6, t + 0.001, 0.0005, rr(0.01, 0.03), a * 0.5);
  }
  function silb(o, t, dur, f0, f1, f2, a, Q, am) {
    const c = o.c,
      s = c.createBufferSource(),
      fl = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = o.W;
    s.loop = true;
    fl.type = "bandpass";
    fl.Q.value = Q;
    fl.frequency.setValueAtTime(f0, t);
    fl.frequency.linearRampToValueAtTime(f1, t + dur * 0.45);
    fl.frequency.linearRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + dur * 0.45);
    g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(fl);
    fl.connect(g);
    if (am) {
      /* piedra que gira: modulación de amplitud */
      const m = c.createGain(),
        l = c.createOscillator(),
        lg = c.createGain();
      m.gain.value = 1 - am;
      l.frequency.value = rr(6, 9);
      lg.gain.value = am;
      l.connect(lg);
      lg.connect(m.gain);
      g.connect(m);
      m.connect(o.o);
      l.start(t);
      l.stop(t + dur + 0.02);
    } else g.connect(o.o);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.02);
  }
  /* voz: diente de sierra con contorno de altura, vibrato, aspereza y formantes (vocal) */
  const VOC = {
    A: [
      [800, 6, 1],
      [1200, 8, 0.6],
      [2600, 10, 0.25],
    ],
    E: [
      [500, 6, 1],
      [1800, 9, 0.55],
      [2600, 10, 0.3],
    ],
    O: [
      [550, 6, 1],
      [900, 8, 0.6],
      [2500, 10, 0.15],
    ],
    U: [
      [350, 6, 1],
      [700, 7, 0.5],
      [2400, 10, 0.1],
    ],
    I: [
      [700, 5, 1],
      [1900, 8, 0.8],
      [3000, 9, 0.45],
    ],
  };
  function voz(o, t, p) {
    const c = o.c,
      D = p.dur,
      os = c.createOscillator(),
      fr = os.frequency,
      src = c.createGain(),
      env = c.createGain(),
      fs = p.fs || 1;
    os.type = "sawtooth";
    fr.setValueAtTime(p.f0 * p.cont[0][1], t);
    for (let i = 1; i < p.cont.length; i++) fr.linearRampToValueAtTime(p.f0 * p.cont[i][1], t + p.cont[i][0] * D);
    if (p.vib) {
      const l = c.createOscillator(),
        lg = c.createGain();
      l.frequency.value = p.vr || 5;
      lg.gain.value = p.f0 * p.vib;
      l.connect(lg);
      lg.connect(fr);
      l.start(t);
      l.stop(t + D + 0.05);
    }
    os.connect(src);
    if (p.aspera) {
      src.gain.value = 1 - p.aspera;
      const l = c.createOscillator(),
        lg = c.createGain();
      l.frequency.value = rr(30, 60);
      lg.gain.value = p.aspera;
      l.connect(lg);
      lg.connect(src.gain);
      l.start(t);
      l.stop(t + D + 0.05);
    }
    const amp = p.amp || 1;
    if (p.envp) envp(env.gain, t, p.envp.map(([k, v]) => [k * D, v]), amp);
    else {
      const at = p.at || 0.05,
        re = p.rel || 0.2;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(amp, t + at);
      env.gain.setValueAtTime(amp, t + Math.max(at, D - re));
      env.gain.linearRampToValueAtTime(0, t + D);
    }
    let ns = null;
    if (p.aliento) {
      ns = c.createBufferSource();
      ns.buffer = o.W;
      ns.loop = true;
      const ng = c.createGain();
      ng.gain.value = p.aliento;
      ns.connect(ng);
      ns._g = ng;
      ns.start(t, Math.random());
      ns.stop(t + D + 0.05);
    }
    const V = VOC[p.vocal || "A"],
      V0 = p.de ? VOC[p.de] : null;
    V.forEach(([F, Q, g], j) => {
      const f = c.createBiquadFilter(),
        gg = c.createGain();
      f.type = "bandpass";
      f.Q.value = Q;
      if (V0) {
        f.frequency.setValueAtTime(V0[j][0] * fs, t);
        f.frequency.linearRampToValueAtTime(F * fs, t + D * (p.morph || 0.2));
      } else f.frequency.value = F * fs;
      gg.gain.value = g * 3;
      src.connect(f);
      if (ns) ns._g.connect(f);
      f.connect(gg);
      gg.connect(env);
    });
    env.connect(o.o);
    os.start(t);
    os.stop(t + D + 0.05);
  }
  function pisada(o, t, a, f, jingle) {
    nb(o, "bandpass", f, 1.1, t, 0.003, rr(0.05, 0.09), a);
    tb(o, "sine", rr(55, 75), t, 0.003, 0.05, a * 0.35, 40);
    nb(o, "highpass", 5500, 0.7, t + rr(0, 0.02), 0.001, 0.035, a * (jingle || 0.09));
    if (Math.random() < 0.25) tb(o, "sine", rr(2800, 4800), t + rr(0, 0.04), 0.001, 0.05, a * 0.06);
  }
  function casco(o, t, a, f) {
    nb(o, "bandpass", f, 1.6, t, 0.002, rr(0.035, 0.06), a);
    tb(o, "sine", rr(70, 110), t, 0.002, 0.06, a * 0.6, 45);
    nb(o, "highpass", 2500, 0.7, t, 0.001, 0.02, a * 0.15);
  }
  function twang(o, t, a) {
    const c = o.c,
      s = c.createOscillator(),
      fl = c.createBiquadFilter(),
      g = c.createGain(),
      f = rr(95, 150),
      de = rr(0.08, 0.15);
    s.type = "sawtooth";
    s.frequency.setValueAtTime(f * 1.04, t);
    s.frequency.exponentialRampToValueAtTime(f * 0.93, t + de);
    fl.type = "lowpass";
    fl.frequency.setValueAtTime(3200, t);
    fl.frequency.exponentialRampToValueAtTime(320, t + de);
    perc(g.gain, t, a, 0.0015, de);
    s.connect(fl);
    fl.connect(g);
    g.connect(o.o);
    s.start(t);
    s.stop(t + de + 0.02);
    nb(o, "bandpass", 1800, 2, t, 0.0008, 0.012, a * 0.6);
  }
  function relincho(o, t, D) {
    const c = o.c,
      f0 = rr(450, 600),
      os = c.createOscillator(),
      fr = os.frequency,
      l = c.createOscillator(),
      lf = c.createGain(),
      la = c.createGain(),
      am = c.createGain(),
      env = c.createGain(),
      r = rr(11, 15),
      E = D - 0.35;
    os.type = "sawtooth";
    fr.setValueAtTime(f0 * 0.9, t);
    fr.linearRampToValueAtTime(f0 * 1.65, t + 0.1);
    fr.linearRampToValueAtTime(f0 * 1.45, t + E * 0.3);
    fr.linearRampToValueAtTime(f0 * 0.85, t + E * 0.8);
    fr.linearRampToValueAtTime(f0 * 0.6, t + E);
    l.frequency.value = r;
    lf.gain.value = f0 * 0.13;
    la.gain.value = 0.45;
    am.gain.value = 0.55;
    l.connect(lf);
    lf.connect(fr);
    l.connect(la);
    la.connect(am.gain);
    os.connect(am);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.06);
    env.gain.setValueAtTime(1, t + E * 0.7);
    env.gain.linearRampToValueAtTime(0, t + E);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 300;
    am.connect(hp);
    for (const [F, Q, g] of [
      [1100, 3, 1],
      [2400, 4, 0.5],
      [3400, 6, 0.2],
    ]) {
      const f = c.createBiquadFilter(),
        gg = c.createGain();
      f.type = "bandpass";
      f.frequency.value = F * rr(0.92, 1.08);
      f.Q.value = Q;
      gg.gain.value = g;
      hp.connect(f);
      f.connect(gg);
      gg.connect(env);
    }
    env.connect(o.o);
    os.start(t);
    l.start(t);
    os.stop(t + E + 0.05);
    l.stop(t + E + 0.05);
    cama(o, "bandpass", 1500, 1, t, [
      [0.05, 0.12],
      [E * 0.7, 0.1],
      [E, 0],
    ], 1);
    /* resoplido final */
    nb(o, "lowpass", 900, 0.7, t + E + 0.03, 0.015, 0.22, 0.45);
  }
  const lado = (o, f) => ({ ...o, o: f });

  /* --- recetas: [clave, variantes, duración, frecuencia de muestreo, función, cola de bucle] --- */
  const REC = [
    [
      "espada",
      6,
      0.8,
      32000,
      (o) => {
        metal(o, 0.005, rr(900, 1600), 1, rr(0.25, 0.5));
        if (Math.random() < 0.5) metal(o, rr(0.06, 0.16), rr(900, 1700), rr(0.35, 0.6), rr(0.2, 0.4));
        if (Math.random() < 0.4) madera(o, rr(0, 0.2), rr(350, 650), 0.5, 0.1);
        if (Math.random() < 0.35) silb(o, rr(0.02, 0.1), 0.14, 2800, 6000, 4500, 0.25, 3);
      },
    ],
    [
      "escudo",
      4,
      0.4,
      24000,
      (o) => {
        madera(o, 0.005, rr(300, 600), 1, rr(0.09, 0.14));
        sordo(o, 0.005, 0.6);
        if (Math.random() < 0.35) metal(o, 0.006, rr(500, 700), 0.2, 0.15);
      },
    ],
    [
      "golpe",
      4,
      0.35,
      24000,
      (o) => {
        sordo(o, 0.005, 1);
        nb(o, "bandpass", rr(700, 1100), 2, 0.01, 0.003, 0.06, 0.3);
        if (Math.random() < 0.5) metal(o, rr(0, 0.02), rr(700, 1100), 0.25, 0.12);
      },
    ],
    [
      "choque",
      3,
      1.4,
      32000,
      (o) => {
        tb(o, "sine", 60, 0.01, 0.004, 0.4, 0.8, 32);
        nb(o, "lowpass", 400, 0.7, 0.01, 0.003, 0.3, 0.7);
        for (let k = 0; k < 9; k++) metal(o, 0.01 + Math.random() ** 2 * 0.6, rr(850, 1700), rr(0.35, 0.9), rr(0.2, 0.45));
        for (let k = 0; k < 7; k++) madera(o, 0.01 + Math.random() ** 2 * 0.5, rr(280, 600), rr(0.4, 0.9), rr(0.08, 0.14));
        for (let k = 0; k < 3; k++) sordo(o, rr(0, 0.4), rr(0.4, 0.8));
      },
    ],
    [
      "galope",
      3,
      2.2,
      16000,
      (o, i, D) => {
        for (let h = 0; h < 6; h++) {
          const P = rr(0.38, 0.46),
            a = rr(0.5, 1),
            f = rr(260, 520);
          for (let t = rr(0, P); t < D; t += P * rr(0.97, 1.03)) {
            const of = [0, rr(0.06, 0.085), rr(0.13, 0.17), rr(0.19, 0.23)],
              am = [0.6, 0.75, 0.9, 1];
            for (let j = 0; j < 4; j++) casco(o, t + of[j], a * am[j], f * rr(0.9, 1.1));
          }
        }
        cama(o, "lowpass", 110, 0.7, 0, [
          [0.3, 0.25],
          [D, 0.25],
        ], 1, o.B);
        fade(o, D, 0.25, 0.35);
      },
    ],
    [
      "pasos",
      3,
      2.4,
      16000,
      (o, i, D) => {
        const P = rr(0.5, 0.56);
        for (let h = 0; h < 14; h++) {
          const off = rr(-0.035, 0.035),
            a = rr(0.4, 1);
          for (let t = 0.05 + off + Math.random() * 0.02; t < D; t += P + rr(-0.012, 0.012)) pisada(o, t, a * rr(0.8, 1), rr(450, 1000));
        }
        fade(o, D, 0.3, 0.4);
      },
    ],
    [
      "carrera",
      3,
      2.4,
      16000,
      (o, i, D) => {
        for (let h = 0; h < 12; h++) {
          const P = rr(0.27, 0.33),
            a = rr(0.4, 1);
          for (let t = rr(0, P); t < D; t += P * rr(0.94, 1.06)) pisada(o, t, a * rr(0.7, 1), rr(700, 1400), 0.16);
        }
        cama(o, "bandpass", 600, 0.6, 0, [
          [0.3, 0.06],
          [D, 0.06],
        ], 1);
        fade(o, D, 0.3, 0.4);
      },
    ],
    [
      "ruedas",
      2,
      2.4,
      16000,
      (o, i, D) => {
        cama(o, "lowpass", 140, 0.7, 0, [
          [0.3, 0.6],
          [D, 0.6],
        ], 1, o.B);
        for (let k = 0; k < 5; k++) {
          const c = o.c,
            t = rr(0.1, D - 0.6),
            d = rr(0.25, 0.5),
            s = c.createOscillator(),
            f = c.createBiquadFilter(),
            g = c.createGain(),
            fq = rr(80, 150);
          s.type = "sawtooth";
          s.frequency.setValueAtTime(fq, t);
          s.frequency.linearRampToValueAtTime(fq * rr(0.8, 1.3), t + d);
          f.type = "bandpass";
          f.frequency.value = rr(600, 900);
          f.Q.value = 7;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.5, t + d * 0.3);
          g.gain.linearRampToValueAtTime(0, t + d);
          s.connect(f);
          f.connect(g);
          g.connect(o.o);
          s.start(t);
          s.stop(t + d + 0.02);
        }
        for (let k = 0; k < 6; k++) madera(o, rr(0, D), rr(200, 400), 0.3, 0.1);
        fade(o, D, 0.3, 0.4);
      },
    ],
    ["relincho", 3, 1.6, 24000, (o, i, D) => relincho(o, 0.01, D - 0.05)],
    [
      "grito",
      3,
      2.0,
      24000,
      (o) => {
        for (let k = 0; k < 12; k++) {
          const d = rr(1.0, 1.5);
          voz(o, rr(0, 0.3), {
            f0: rr(105, 175),
            dur: d,
            cont: [
              [0, 0.82],
              [0.1, 1.18],
              [0.45, 1.12],
              [0.8, 1.0],
              [1, 0.8],
            ],
            vib: 0.025,
            vr: rr(4.5, 7),
            vocal: "A",
            de: "O",
            morph: 0.15,
            fs: rr(0.9, 1.12),
            aspera: rr(0.1, 0.3),
            aliento: 0.25,
            amp: rr(0.6, 1),
            at: rr(0.04, 0.1),
            rel: rr(0.2, 0.35),
          });
        }
      },
    ],
    [
      "gritoEjercito",
      2,
      3.6,
      24000,
      (o) => {
        for (let k = 0; k < 26; k++)
          voz(o, rr(0, 0.4), {
            f0: rr(85, 150),
            dur: rr(2.7, 3.15),
            cont: [
              [0, 0.85],
              [0.35, 0.95],
              [0.6, 1.2],
              [0.85, 1.1],
              [1, 0.85],
            ],
            vib: 0.02,
            vr: rr(4, 6.5),
            vocal: "A",
            de: "U",
            morph: 0.55,
            fs: rr(0.88, 1.12),
            aspera: rr(0.1, 0.3),
            aliento: 0.2,
            amp: rr(0.5, 1),
            envp: [
              [0.05, 0.25],
              [0.4, 0.4],
              [0.62, 1],
              [0.88, 0.9],
              [1, 0],
            ],
          });
        for (let k = 0; k < 10; k++) madera(o, rr(1.6, 2.8), rr(250, 500), rr(0.3, 0.6), 0.12);
      },
    ],
    [
      "huida",
      2,
      2.2,
      24000,
      (o) => {
        for (let k = 0; k < 6; k++)
          voz(o, rr(0, 1.0), {
            f0: rr(260, 460),
            dur: rr(0.5, 1.0),
            cont: [
              [0, 0.9],
              [0.12, 1.3],
              [0.5, 1.25],
              [0.75, 1.05],
              [1, 0.7],
            ],
            vib: 0.05,
            vr: rr(7, 10),
            vocal: "I",
            fs: rr(0.9, 1.1),
            aspera: 0.3,
            aliento: 0.3,
            amp: rr(0.5, 1),
            at: 0.03,
            rel: 0.2,
          });
        for (let k = 0; k < 3; k++)
          voz(o, rr(0, 1.1), {
            f0: rr(150, 220),
            dur: rr(0.6, 1.0),
            cont: [
              [0, 1.3],
              [0.2, 1.2],
              [1, 0.7],
            ],
            vib: 0.03,
            vr: 6,
            vocal: "A",
            aspera: 0.4,
            aliento: 0.3,
            amp: rr(0.5, 0.8),
            at: 0.02,
            rel: 0.25,
          });
      },
    ],
    [
      "muerte",
      6,
      0.95,
      24000,
      (o) => {
        const d = rr(0.45, 0.85);
        voz(o, 0.01, {
          f0: rr(110, 220),
          dur: d,
          cont: [
            [0, 1.2],
            [0.08, 1.4],
            [0.35, 1.05],
            [1, 0.62],
          ],
          vib: 0.03,
          vr: rr(5, 9),
          vocal: pick(["A", "O", "U", "A"]),
          aspera: rr(0.35, 0.6),
          aliento: 0.35,
          amp: 1,
          at: 0.012,
          rel: 0.25,
        });
        if (Math.random() < 0.4) sordo(o, d * rr(0.7, 0.95), 0.35);
      },
    ],
    [
      "arco",
      4,
      0.55,
      32000,
      (o, i) => {
        const n = [2, 5, 9, 14][i];
        for (let k = 0; k < n; k++) twang(o, 0.005 + Math.random() * (0.04 + n * 0.018), rr(0.5, 1));
      },
    ],
    [
      "ballesta",
      3,
      0.6,
      32000,
      (o, i) => {
        const n = [2, 5, 9][i];
        for (let k = 0; k < n; k++) {
          const t = 0.005 + Math.random() * (0.04 + n * 0.02),
            a = rr(0.5, 1);
          nb(o, "highpass", 2800, 0.7, t, 0.0005, 0.01, a);
          nb(o, "bandpass", 900, 3, t, 0.001, 0.04, a * 0.6);
          tb(o, "sine", 210, t, 0.002, 0.07, a * 0.45, 130);
        }
      },
    ],
    [
      "jabalina",
      3,
      0.8,
      24000,
      (o, i) => {
        const n = [2, 5, 9][i];
        for (let k = 0; k < n; k++) silb(o, rr(0, 0.15), rr(0.35, 0.55), 400, rr(1000, 1300), 600, rr(0.5, 1), rr(1.5, 2.5));
      },
    ],
    [
      "silbido",
      3,
      0.75,
      24000,
      (o, i) => {
        const n = [3, 7, 12][i];
        for (let k = 0; k < n; k++) silb(o, rr(0, 0.12), rr(0.4, 0.6), rr(1000, 1400), rr(2600, 3400), rr(1400, 1900), rr(0.5, 1) / Math.sqrt(n / 3), rr(2, 5));
      },
    ],
    [
      "silbidoPiedra",
      2,
      0.95,
      16000,
      (o) => {
        silb(o, 0, 0.9, 280, 650, 350, 1, 1.3, 0.4);
        cama(o, "lowpass", 160, 0.7, 0, [
          [0.4, 0.4],
          [0.9, 0],
        ], 1, o.B);
      },
    ],
    [
      "flechazo",
      4,
      0.6,
      32000,
      (o, i) => {
        const n = [3, 6, 10, 15][i];
        for (let k = 0; k < n; k++) {
          const t = 0.005 + Math.random() * (0.2 + n * 0.01),
            a = rr(0.4, 1),
            r = Math.random();
          if (r < 0.45) {
            const f = rr(900, 1700);
            nb(o, "bandpass", f, 6, t, 0.0005, 0.03, a);
            tb(o, "sine", f * 0.5, t, 0.001, 0.04, a * 0.4);
          } else if (r < 0.65) {
            tb(o, "sine", rr(2600, 4200), t, 0.0005, 0.03, a * 0.35);
            nb(o, "highpass", 4000, 0.7, t, 0.0003, 0.008, a * 0.4);
          } else {
            nb(o, "lowpass", 380, 0.7, t, 0.002, 0.05, a * 0.7);
            nb(o, "bandpass", 1200, 1, t, 0.001, 0.015, a * 0.2);
          }
        }
      },
    ],
    [
      "catapulta",
      3,
      1.6,
      16000,
      (o) => {
        tb(o, "sine", 62, 0.02, 0.003, 0.35, 1, 30);
        nb(o, "lowpass", 320, 0.7, 0.02, 0.002, 0.25, 0.8);
        madera(o, 0.02, 340, 0.8, 0.14);
        tb(o, "triangle", 78, 0.02, 0.003, 0.45, 0.35, 60);
        madera(o, 0.12, 260, 0.6, 0.1);
        let t = 0.25;
        for (let k = 0; k < 10; k++) {
          nb(o, "bandpass", rr(500, 900), 5, t, 0.001, 0.02, rr(0.15, 0.3));
          t += 0.03 + Math.abs(k - 4) * 0.012 + rr(0, 0.02);
        }
        const c = o.c,
          s = c.createOscillator(),
          f = c.createBiquadFilter(),
          g = c.createGain();
        s.type = "sawtooth";
        s.frequency.value = rr(60, 80);
        f.type = "bandpass";
        f.frequency.value = 450;
        f.Q.value = 6;
        g.gain.setValueAtTime(0, 0.25);
        g.gain.linearRampToValueAtTime(0.15, 0.4);
        g.gain.linearRampToValueAtTime(0, 0.75);
        s.connect(f);
        f.connect(g);
        g.connect(o.o);
        s.start(0.25);
        s.stop(0.8);
      },
    ],
    [
      "impacto",
      3,
      1.6,
      16000,
      (o) => {
        tb(o, "sine", 70, 0.01, 0.003, 0.6, 1, 28);
        nb(o, "lowpass", 500, 0.7, 0.01, 0.003, 0.5, 0.8);
        for (let k = 0; k < 18; k++) {
          const t = 0.02 + Math.random() ** 1.7 * 1.1;
          piedra(o, t, rr(700, 2800), 0.7 * (1 - t / 1.4) * rr(0.3, 1));
        }
        nb(o, "highpass", 1500, 0.7, 0.02, 0.005, 0.4, 0.25);
      },
    ],
    [
      "ariete",
      3,
      1.3,
      16000,
      (o) => {
        tb(o, "sine", 55, 0.01, 0.002, 0.45, 1, 38);
        nb(o, "bandpass", 180, 2, 0.01, 0.002, 0.3, 0.9);
        nb(o, "bandpass", rr(800, 1200), 3, 0.01, 0.001, 0.06, 0.5);
        for (let k = 0; k < 6; k++) {
          const t = rr(0.08, 0.5);
          if (Math.random() < 0.6) madera(o, t, rr(300, 700), 0.2, 0.06);
          else metal(o, t, rr(500, 900), 0.12, 0.12);
        }
        const c = o.c,
          s = c.createOscillator(),
          f = c.createBiquadFilter(),
          g = c.createGain();
        s.type = "sawtooth";
        s.frequency.setValueAtTime(120, 0.4);
        s.frequency.linearRampToValueAtTime(90, 1.0);
        f.type = "bandpass";
        f.frequency.value = 600;
        f.Q.value = 6;
        g.gain.setValueAtTime(0, 0.4);
        g.gain.linearRampToValueAtTime(0.1, 0.55);
        g.gain.linearRampToValueAtTime(0, 1.0);
        s.connect(f);
        f.connect(g);
        g.connect(o.o);
        s.start(0.4);
        s.stop(1.05);
      },
    ],
    [
      "derrumbe",
      2,
      5.5,
      16000,
      (o, i, D) => {
        nb(o, "lowpass", 6000, 0.5, 0.005, 0.002, 0.18, 1);
        nb(o, "bandpass", 1800, 0.8, 0.1 + rr(0, 0.08), 0.001, 0.12, 0.7);
        const R = [
          [0.4, 1],
          [2.2, 0.85],
          [4.0, 0.4],
          [D - 0.05, 0],
        ];
        cama(o, "lowpass", 190, 0.7, 0, R, 1.3, o.B);
        const c = o.c,
          s = c.createOscillator(),
          g = c.createGain();
        s.frequency.value = 34;
        envp(g.gain, 0, R, 0.5);
        s.connect(g);
        g.connect(o.o);
        s.start(0);
        s.stop(D);
        for (let k = 0; k < 14; k++) {
          const t = 0.15 + Math.random() ** 1.3 * 2.6,
            a = rr(0.4, 0.9);
          tb(o, "sine", rr(45, 85), t, 0.003, 0.35, a, 30);
          nb(o, "lowpass", 420, 0.7, t, 0.003, 0.3, a * 0.8);
        }
        for (let k = 0; k < 110; k++) {
          const t = 0.08 + 3.6 * Math.random() ** 1.6;
          piedra(o, t, rr(450, 3200), 0.55 * (1 - t / 4.5) * rr(0.3, 1));
        }
        cama(o, "highpass", 2200, 0.7, 0, [
          [0.8, 1],
          [3.2, 0.5],
          [D - 0.05, 0],
        ], 0.1);
      },
    ],
    [
      "desprendimiento",
      3,
      2.0,
      16000,
      (o) => {
        nb(o, "bandpass", 1600, 0.8, 0.005, 0.001, 0.1, 0.6);
        cama(o, "lowpass", 220, 0.7, 0, [
          [0.15, 0.7],
          [0.9, 0.4],
          [1.9, 0],
        ], 1, o.B);
        for (let k = 0; k < 4; k++) {
          const t = rr(0.05, 0.8);
          tb(o, "sine", rr(50, 90), t, 0.003, 0.3, 0.6, 32);
          nb(o, "lowpass", 420, 0.7, t, 0.003, 0.25, 0.5);
        }
        for (let k = 0; k < 35; k++) {
          const t = 0.05 + 1.4 * Math.random() ** 1.4;
          piedra(o, t, rr(500, 3000), 0.55 * (1 - t / 1.8) * rr(0.3, 1));
        }
      },
    ],
    [
      "madera",
      2,
      1.8,
      24000,
      (o) => {
        for (const t of [0.005, 0.05, 0.12]) nb(o, "bandpass", rr(1500, 3500), 2, t, 0.0005, 0.03, 1);
        for (let k = 0; k < 20; k++) nb(o, "bandpass", rr(1200, 4000), 4, rr(0, 0.5), 0.0005, rr(0.01, 0.03), rr(0.2, 0.6));
        for (let k = 0; k < 8; k++) madera(o, rr(0.1, 1.0), rr(180, 500), rr(0.4, 0.9), rr(0.08, 0.2));
        sordo(o, 0.3, 1);
      },
    ],
    [
      "fuego",
      1,
      4,
      24000,
      (o, i, D) => {
        const c = o.c,
          T = D + 0.6,
          g = c.createGain(),
          lf = c.createBiquadFilter(),
          s = c.createBufferSource();
        g.gain.value = 0.55;
        lf.type = "lowpass";
        lf.frequency.value = 380;
        s.buffer = o.B;
        s.loop = true;
        s.connect(lf);
        lf.connect(g);
        g.connect(o.o);
        for (const [f, a] of [
          [0.7, 0.25],
          [1.9, 0.12],
        ]) {
          const l = c.createOscillator(),
            lg = c.createGain();
          l.frequency.value = f;
          lg.gain.value = a;
          l.connect(lg);
          lg.connect(g.gain);
          l.start(0);
          l.stop(T);
        }
        s.start(0);
        s.stop(T);
        cama(o, "bandpass", 2600, 0.7, 0, [
          [0.01, 0.05],
          [T, 0.05],
        ], 1);
        for (let k = 0; k < 170; k++) nb(o, "highpass", rr(1200, 4500), 0.8, rr(0, T), 0.0004, rr(0.003, 0.014), (0.15 + 0.85 * Math.random() ** 3) * 0.8);
        for (let k = 0; k < 25; k++) nb(o, "bandpass", rr(500, 1400), 1.5, rr(0, T), 0.001, rr(0.02, 0.05), rr(0.3, 0.7));
      },
      0.6,
    ],
    [
      "fragor",
      1,
      6,
      16000,
      (o, i, D) => {
        const c = o.c,
          T = D + 0.6,
          lp = c.createBiquadFilter(),
          m = c.createGain();
        lp.type = "lowpass";
        lp.frequency.value = 2600;
        m.connect(lp);
        lp.connect(o.o);
        const q = lado(o, m);
        o.post = (A) => {
          const [b0, b1, b2, a1, a2] = coef("lowpass", 2600, 0.7, o.sr);
          let x1 = 0,
            x2 = 0,
            y1 = 0,
            y2 = 0;
          for (let k = 0; k < A.length; k++) {
            const x = A[k],
              y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            x2 = x1;
            x1 = x;
            y2 = y1;
            y1 = y;
            A[k] = y;
          }
        };
        for (let k = 0; k < 90; k++) metal(q, rr(0, T), rr(900, 1700), rr(0.08, 0.4), rr(0.15, 0.35));
        for (let k = 0; k < 45; k++) madera(q, rr(0, T), rr(250, 600), rr(0.1, 0.4), rr(0.05, 0.12));
        for (let k = 0; k < 22; k++)
          voz(q, rr(0, T - 0.5), {
            f0: rr(100, 240),
            dur: rr(0.35, 0.9),
            cont: [
              [0, rr(0.9, 1.3)],
              [0.3, rr(1, 1.3)],
              [1, rr(0.6, 0.9)],
            ],
            vib: 0.03,
            vr: 6,
            vocal: pick(["A", "O", "E"]),
            aspera: 0.3,
            aliento: 0.2,
            amp: rr(0.15, 0.4),
            at: 0.04,
            rel: 0.2,
          });
        cama(q, "lowpass", 160, 0.7, 0, [
          [0.01, 0.5],
          [T, 0.5],
        ], 1, o.B);
        cama(q, "bandpass", 500, 0.8, 0, [
          [0.01, 0.12],
          [T, 0.12],
        ], 1);
      },
      0.6,
    ],
  ];
  /* cierre de bucle: los últimos X s se funden con el principio */
  function cierra(b, D, X, sr) {
    const L = Math.round(D * sr),
      XN = Math.round(X * sr),
      d = b.getChannelData(0),
      nb2 = SND.ctx.createBuffer(1, L, sr),
      o = nb2.getChannelData(0);
    for (let i = 0; i < L; i++) o[i] = d[i];
    for (let i = 0; i < XN && L + i < d.length; i++) {
      const k = i / XN;
      o[i] = d[i] * Math.sqrt(k) + d[L + i] * Math.sqrt(1 - k);
    }
    return nb2;
  }
  function normaliza(b, pk) {
    const d = b.getChannelData(0);
    let m = 0;
    for (let i = 0; i < d.length; i++) {
      const v = d[i] < 0 ? -d[i] : d[i];
      if (v > m) m = v;
    }
    if (m > 1e-6) {
      const k = pk / m;
      for (let i = 0; i < d.length; i++) d[i] *= k;
    }
    b._pico = m;
    return b;
  }
  const OAC = typeof OfflineAudioContext !== "undefined" ? OfflineAudioContext : typeof webkitOfflineAudioContext !== "undefined" ? webkitOfflineAudioContext : null;
  function hornea(rec, i) {
    const [, , D, sr, fn, X] = rec,
      c = new OAC(1, Math.ceil((D + (X || 0)) * sr), sr),
      z = ruidos(sr),
      o = { c, o: c.createGain(), W: z.w, B: z.b, sr, acc: new Float32Array(c.length) };
    o.o.connect(c.destination);
    const t0 = performance.now();
    fn(o, i, D);
    /* los granos (o.acc) llevan el mismo fundido que la salida de nodos y, si la receta lo pide, su filtro */
    const A = o.acc;
    if (o.post) o.post(A);
    if (o.fd) {
      const [FD, fi, fo] = o.fd;
      for (let k = 0; k < A.length; k++) {
        const tt = k / sr;
        A[k] *= tt < fi ? tt / fi : tt > FD - fo ? Math.max(0, (FD - tt) / fo) : 1;
      }
    }
    const dt = performance.now() - t0;
    S.bancoSyncMs += dt;
    (S.syncK = S.syncK || {})[rec[0]] = +((S.syncK[rec[0]] || 0) + dt).toFixed(1);
    return new Promise((res, rej) => {
      c.oncomplete = (e) => res(e.renderedBuffer);
      const p = c.startRendering();
      if (p && p.then) p.then(res, rej);
    }).then((b) => {
      const d = b.getChannelData(0);
      for (let k = 0; k < d.length; k++) d[k] += A[k];
      return normaliza(X ? cierra(b, D, X, sr) : b, 0.9);
    });
  }
  /* SND.hornea: también para las pruebas (devuelve el buffer sin normalizar el pico registrado en _pico) */
  SND.hornea = (k, i = 0) => {
    const r = REC.find((x) => x[0] === k);
    return r ? hornea(r, i) : Promise.resolve(null);
  };
  async function banco() {
    if (SND.bank || SND.cargando || !OAC || !SND.ctx) return;
    SND.cargando = true;
    const t0 = performance.now(),
      B = {},
      tareas = [];
    /* primero la primera variante de lo que suena antes (grito de los ejércitos, pasos, cascos, lucha) */
    const ORD = ["gritoEjercito", "pasos", "galope", "carrera", "espada", "escudo", "grito", "arco", "silbido", "flechazo", "golpe", "muerte", "choque", "fragor"],
      pr = (r) => (ORD.indexOf(r[0]) + 1 || 99);
    const R2 = [...REC].sort((a, b) => pr(a) - pr(b));
    for (const r of R2) tareas.push([r, 0]);
    for (const r of R2) for (let i = 1; i < r[1]; i++) tareas.push([r, i]);
    let bytes = 0;
    /* el banco se llena poco a poco: cada sonido suena en cuanto tiene su primera variante */
    SND.bank = B;
    try {
      const pausa = () => new Promise((r) => setTimeout(r, 0));
      for (let j = 0; j < tareas.length; j += 4) {
        const ps = [];
        /* cada receta en su propia tarea para no trabar los fotogramas */
        for (const [r, i] of tareas.slice(j, j + 4)) {
          await pausa();
          ps.push(hornea(r, i));
        }
        const l = await Promise.all(ps);
        l.forEach((b, q) => {
          const k = tareas[j + q][0][0];
          (B[k] = B[k] || []).push(b);
          bytes += b.length * 4;
        });
        const now = performance.now();
        SND.pend = SND.pend.filter((p) => {
          if (!B[p.k]) return now - p.t < 2500;
          if (now - p.t < 2500) toca(p.k, p.x, p.y, p.o);
          return false;
        });
      }
      S.bancoMs = Math.round(performance.now() - t0);
      S.bancoMB = +(bytes / 1048576).toFixed(1);
    } catch (e) {
      console.error("sonido: banco", e);
      S.err++;
    }
    SND.pend = [];
    SND.cargando = false;
  }

  /* ======================= motor: buses, voces, posición ======================= */
  function init() {
    if (SND.ctx || typeof AU === "undefined" || !AU.ctx) return !!SND.ctx;
    const c = AU.ctx;
    SND.ctx = c;
    const lim = c.createDynamicsCompressor();
    lim.threshold.value = -8;
    lim.knee.value = 6;
    lim.ratio.value = 8;
    lim.attack.value = 0.003;
    lim.release.value = 0.2;
    SND.out = c.createGain();
    SND.out.gain.value = document.hidden ? 0 : 1;
    SND.out.connect(lim);
    /* recorte fijo tras el limitador (su ganancia de compensación lo deja por encima de la entrada) */
    const trim = c.createGain();
    trim.gain.value = 0.75;
    lim.connect(trim);
    trim.connect(c.destination);
    SND.lim = lim;
    SND.trim = trim;
    for (const k in NIVCAT) {
      const g = c.createGain();
      g.gain.value = vcat(k);
      g.connect(SND.out);
      SND.bus[k] = g;
    }
    return true;
  }
  const vcat = (k) => (typeof opcVol === "function" ? opcVol(k) : 0.6) * NIVCAT[k];
  if (typeof OPC !== "undefined" && OPC.on)
    OPC.on(() => {
      if (!SND.ctx) return;
      const t = SND.ctx.currentTime;
      for (const k in SND.bus) SND.bus[k].gain.setTargetAtTime(vcat(k), t, 0.05);
    });
  /* primer gesto: crea/reanuda el contexto (y arranca la música como haría musica.js) */
  function gesto() {
    try {
      if (typeof AU === "undefined") return;
      if (!AU.ctx) {
        audioInit();
        if (AU.ctx && AU.want && !AU.timer && typeof music === "function") music(AU.cur || (typeof BT !== "undefined" && BT ? "battle" : "camp"));
      }
      if (AU.ctx && AU.ctx.state === "suspended") AU.ctx.resume();
      init();
      if (typeof BT !== "undefined" && BT) arranca();
    } catch (e) {
      S.err++;
    }
  }
  document.addEventListener("pointerdown", gesto, { passive: true });
  document.addEventListener("keydown", gesto, { passive: true });
  document.addEventListener("touchend", gesto, { passive: true });

  /* --- oyente (una vez por fotograma) --- */
  let LS = null;
  const REF = 4,
    K_ALT = 200;
  function oyente() {
    const L = { ok: false };
    try {
      const iso = typeof isoOyente === "function" ? isoOyente() : null;
      if (iso) {
        L.ok = true;
        L.W = iso.W;
        L.H = iso.H;
        L.ppc = iso.ppc;
        L.p = iso.p;
      } else if (typeof b3dActivo === "function" && b3dActivo() && B3D.camera && B3D.scene && B3D.tamW) {
        L.ok = true;
        L.d3 = true;
        L.W = B3D.tamW;
        L.H = B3D.tamH;
        L.ppc = b3dPxCasilla();
        L.p = (x, y) => b3dPantalla(x, y, 0.4);
      } else {
        const c = document.getElementById("bmap"),
          s = document.getElementById("bscroll");
        const r = c && c.getBoundingClientRect(),
          q = s && s.getBoundingClientRect();
        if (r && q && r.width > 0 && q.width > 0) {
          const kx = r.width / BW,
            ky = r.height / BH,
            ox = r.left - q.left,
            oy = r.top - q.top;
          L.ok = true;
          L.W = q.width;
          L.H = q.height;
          L.ppc = kx;
          L.p = (x, y) => ({ x: ox + x * kx, y: oy + y * ky });
        }
      }
    } catch (_) {
      L.ok = false;
    }
    if (L.ok) {
      if (!(L.ppc > 0)) L.ppc = 10;
      L.alt = cl(K_ALT / L.ppc, 2.5, 45);
      S.vista = (L.d3 ? "3d" : "2d") + " ppc=" + L.ppc.toFixed(1) + " alt=" + L.alt.toFixed(1);
    }
    return L;
  }
  function posic(x, y) {
    const L = LS;
    if (x == null || !L || !L.ok) return { g: 1, f: 20000, p: 0, d: REF };
    const s = L.p(x, y),
      dx = (s.x - L.W / 2) / L.ppc,
      dy = ((s.y - L.H / 2) / L.ppc) * (L.d3 ? 1.3 : 1),
      d = Math.hypot(dx, dy, L.alt);
    return {
      g: Math.min(1, REF / Math.max(REF, d)),
      f: cl(22000 * Math.pow(REF / d, 1.25), 450, 20000),
      p: cl((s.x - L.W / 2) / (L.W * 0.5), -1, 1) * 0.85,
      d,
    };
  }
  /* --- voces sueltas --- */
  const ult = {};
  function elige(k, n) {
    if (n < 2) return 0;
    let i = Math.floor(Math.random() * n);
    if (i === ult[k]) i = (i + 1) % n;
    return (ult[k] = i);
  }
  function quita(v) {
    const P = v.pool,
      i = P.indexOf(v);
    if (i >= 0) P.splice(i, 1);
    try {
      v.src.disconnect();
      v.g.disconnect();
      v.lp.disconnect();
      v.pn && v.pn.disconnect();
    } catch (_) {}
  }
  function callar(v, tc = 0.08) {
    if (v.fin) return;
    v.fin = true;
    const t = SND.ctx.currentTime,
      p = v.g.gain;
    try {
      p.cancelScheduledValues(t);
      p.setValueAtTime(p.value, t);
      p.linearRampToValueAtTime(0, t + tc);
      v.src.stop(t + tc + 0.02);
    } catch (_) {
      quita(v);
    }
  }
  function posVoz(v, ahora) {
    if (v.u) {
      if (v.u.x >= 0 && !v.u.gone) {
        v.x = v.u.x;
        v.y = v.u.y;
      }
    } else if (v.ruta) {
      const R = v.ruta,
        k = cl((ahora - v.t0) / R.t, 0, 1);
      v.x = R.x0 + (R.x1 - R.x0) * k;
      v.y = R.y0 + (R.y1 - R.y0) * k;
    }
    return posic(v.x, v.y);
  }
  function toca(k, x, y, o = {}) {
    const c = SND.ctx;
    if (!c || c.state !== "running" || SND.oculto) {
      S.noListo++;
      return null;
    }
    const V = SND.bank && SND.bank[k];
    if (!V || !V.length) {
      S.noListo++;
      if (SND.cargando && !o.cama && SND.pend.length < 8) SND.pend.push({ k, x, y, o, t: performance.now() });
      return null;
    }
    const cat = o.cat || CAT[k] || "Efectos";
    if (vcat(cat) <= 0) {
      S.mudo++;
      return null;
    }
    if (o.ruta) {
      x = o.ruta.x0;
      y = o.ruta.y0;
    }
    if (o.u) {
      x = o.u.x;
      y = o.u.y;
    }
    const P = posic(x, y),
      base = (o.vol ?? 1) * (NIV[k] ?? 0.5),
      lvl = base * P.g;
    if (lvl < 0.012) {
      S.inaudible++;
      return null;
    }
    const pool = o.cama ? SND.camas : SND.voces,
      MAX = o.cama ? SND.MAXC : SND.MAX;
    let vivas = 0,
      m = null;
    for (const v of pool)
      if (!v.fin) {
        vivas++;
        if (!m || v.lvl < m.lvl) m = v;
      }
    if (vivas >= MAX) {
      if (!m || m.lvl >= lvl) {
        S.descartado++;
        return null;
      }
      callar(m, 0.04);
      vivas--;
    }
    const t = c.currentTime + 0.012 + (o.delay || 0),
      src = c.createBufferSource(),
      g = c.createGain(),
      lp = c.createBiquadFilter(),
      pn = c.createStereoPanner ? c.createStereoPanner() : null;
    src.buffer = V[o.v != null ? cl(o.v, 0, V.length - 1) : elige(k, V.length)];
    src.playbackRate.value = (o.rate || 1) * (o.fijo ? 1 : rr(0.93, 1.07));
    g.gain.value = lvl;
    lp.type = "lowpass";
    lp.frequency.value = P.f;
    lp.Q.value = 0.5;
    src.connect(lp);
    lp.connect(g);
    if (pn) {
      pn.pan.value = P.p;
      g.connect(pn);
      pn.connect(SND.bus[cat]);
    } else g.connect(SND.bus[cat]);
    src.start(t);
    const v = { k, src, g, lp, pn, x, y, u: o.u || null, ruta: o.ruta || null, t0: t, base, lvl, pool, fin: false, dur: src.buffer.duration / src.playbackRate.value };
    if (v.ruta) v.ruta.t = v.ruta.t || 0.36;
    src.onended = () => quita(v);
    pool.push(v);
    cuenta(k);
    S.vocesMax = Math.max(S.vocesMax, SND.voces.length);
    S.vivasMax = Math.max(S.vivasMax, vivas + 1);
    S.camasMax = Math.max(S.camasMax, SND.camas.length);
    return v;
  }
  /* --- bucles posicionales (fragor, fuego) --- */
  function lazo(k, cat) {
    const c = SND.ctx,
      V = SND.bank && SND.bank[k];
    if (!c || !V) return null;
    const src = c.createBufferSource(),
      g = c.createGain(),
      lp = c.createBiquadFilter(),
      pn = c.createStereoPanner ? c.createStereoPanner() : null;
    src.buffer = V[0];
    src.loop = true;
    g.gain.value = 0;
    lp.type = "lowpass";
    lp.frequency.value = 4000;
    src.connect(lp);
    lp.connect(g);
    if (pn) {
      g.connect(pn);
      pn.connect(SND.bus[cat]);
    } else g.connect(SND.bus[cat]);
    src.start(c.currentTime + 0.01, Math.random() * V[0].duration);
    cuenta(k);
    return {
      src,
      g,
      lp,
      pn,
      lvl: 0,
      set(l, f, p, tc = 0.3) {
        const t = c.currentTime;
        this.lvl = l;
        g.gain.setTargetAtTime(l, t, tc);
        lp.frequency.setTargetAtTime(f, t, tc);
        if (pn) pn.pan.setTargetAtTime(p, t, tc);
      },
      stop(tc = 0.4) {
        const t = c.currentTime;
        try {
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(g.gain.value, t);
          g.gain.linearRampToValueAtTime(0, t + tc);
          src.stop(t + tc + 0.05);
        } catch (_) {}
        src.onended = () => {
          try {
            src.disconnect();
            g.disconnect();
            lp.disconnect();
            pn && pn.disconnect();
          } catch (_) {}
        };
      },
    };
  }
  /* fuegos: ≤ 3 bucles con caducidad */
  SND.fuegos = [];
  function fuego(x, y, seg) {
    const now = performance.now();
    evc("fuego");
    for (const F of SND.fuegos)
      if (Math.hypot(F.x - x, F.y - y) < 3) {
        F.hasta = Math.max(F.hasta, now + seg * 1000);
        return F;
      }
    if (!SND.bank || !SND.ctx || SND.oculto) return null;
    if (SND.fuegos.length >= 3) {
      const v = SND.fuegos.sort((a, b) => a.hasta - b.hasta).shift();
      v.lz.stop(0.5);
    }
    const lz = lazo("fuego", "Efectos");
    if (!lz) return null;
    const F = { x, y, hasta: now + seg * 1000, lz };
    SND.fuegos.push(F);
    return F;
  }
  /* --- viento (en vivo: ruido filtrado con ráfagas) --- */
  let VI = null;
  function viento() {
    if (VI) return VI;
    const c = SND.ctx,
      sr = c.sampleRate,
      b = c.createBuffer(1, sr * 4, sr),
      d = b.getChannelData(0);
    let l = 0;
    for (let i = 0; i < d.length; i++) {
      l = (l + 0.04 * (Math.random() * 2 - 1)) / 1.04;
      d[i] = l * 3 + (Math.random() * 2 - 1) * 0.08;
    }
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(SND.bus.Ambiente);
    const capas = [-0.6, 0.6].map((p) => {
      const s = c.createBufferSource(),
        bp = c.createBiquadFilter(),
        g = c.createGain(),
        pn = c.createStereoPanner ? c.createStereoPanner() : null;
      s.buffer = b;
      s.loop = true;
      bp.type = "bandpass";
      bp.frequency.value = rr(300, 700);
      bp.Q.value = 0.8;
      g.gain.value = 0.5;
      s.connect(bp);
      bp.connect(g);
      if (pn) {
        pn.pan.value = p;
        g.connect(pn);
        pn.connect(out);
      } else g.connect(out);
      s.start(c.currentTime, Math.random() * 3.5);
      return { s, bp, g, pn };
    });
    /* silbido fino de las ráfagas */
    const s = c.createBufferSource(),
      bp = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = b;
    s.loop = true;
    bp.type = "bandpass";
    bp.frequency.value = 1500;
    bp.Q.value = 9;
    g.gain.value = 0.05;
    s.connect(bp);
    bp.connect(g);
    g.connect(out);
    s.start(c.currentTime, Math.random() * 3.5);
    capas.push({ s, bp, g, silb: true });
    VI = { out, capas, obj: 0, cero: 0, sig: 0, rafaga: 0.5 };
    cuenta("viento");
    return VI;
  }
  function vientoPaso(obj, now, tc) {
    if (!SND.ctx || SND.oculto) return;
    if (obj > 0.001 && !VI) viento();
    if (!VI) return;
    const c = SND.ctx,
      t = c.currentTime;
    if (Math.abs(obj - VI.obj) > 0.004) {
      VI.out.gain.setTargetAtTime(obj, t, tc);
      VI.obj = obj;
    }
    S.viento = +obj.toFixed(3);
    if (obj <= 0.001) {
      VI.cero = VI.cero || now;
      if (now - VI.cero > 9000) vientoFin();
      return;
    }
    VI.cero = 0;
    if (now < VI.sig) return;
    VI.sig = now + rr(600, 1500);
    VI.rafaga = cl(VI.rafaga + rr(-0.35, 0.35), 0.15, 1);
    for (const L of VI.capas) {
      if (L.silb) {
        L.bp.frequency.setTargetAtTime(rr(1100, 1900), t, rr(0.5, 1.2));
        L.g.gain.setTargetAtTime(0.06 * VI.rafaga ** 2, t, rr(0.5, 1.2));
      } else {
        L.bp.frequency.setTargetAtTime(rr(250, 450) + 500 * VI.rafaga, t, rr(0.6, 1.5));
        L.g.gain.setTargetAtTime(cl(VI.rafaga * rr(0.6, 1.2), 0.1, 1), t, rr(0.5, 1.2));
      }
    }
  }
  function vientoFin() {
    if (!VI) return;
    const V = VI;
    VI = null;
    S.viento = 0;
    try {
      const t = SND.ctx.currentTime;
      V.out.gain.cancelScheduledValues(t);
      V.out.gain.setValueAtTime(V.out.gain.value, t);
      V.out.gain.linearRampToValueAtTime(0, t + 0.2);
      for (const L of V.capas) L.s.stop(t + 0.25);
      setTimeout(() => {
        try {
          V.out.disconnect();
        } catch (_) {}
      }, 400);
    } catch (_) {}
  }
  /* --- pájaros (mapa de campaña) --- */
  function pajaro() {
    const c = SND.ctx;
    if (!c || c.state !== "running" || vcat("Ambiente") <= 0) return;
    const pn = c.createStereoPanner ? c.createStereoPanner() : null,
      out = c.createGain();
    out.gain.value = rr(0.03, 0.07);
    if (pn) {
      pn.pan.value = rr(-0.8, 0.8);
      out.connect(pn);
      pn.connect(SND.bus.Ambiente);
    } else out.connect(SND.bus.Ambiente);
    let t = c.currentTime + 0.02;
    const f = rr(2400, 4600),
      n = 2 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) {
      const o = c.createOscillator(),
        g = c.createGain(),
        d = rr(0.05, 0.11),
        f0 = f * rr(0.9, 1.1);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * rr(1.15, 1.6), t + d * 0.4);
      o.frequency.exponentialRampToValueAtTime(f0 * rr(0.7, 0.95), t + d);
      perc(g.gain, t, 1, 0.006, d);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + d + 0.03);
      t += d + rr(0.03, 0.12);
    }
    setTimeout(() => {
      try {
        out.disconnect();
        pn && pn.disconnect();
      } catch (_) {}
    }, (t - c.currentTime) * 1000 + 300);
    cuenta("pajaros");
  }

  /* ======================= observación de la batalla ======================= */
  const cub = {};
  function cubeta(k, now) {
    const C = CUB[k];
    if (!C) return true;
    const b = cub[k] || (cub[k] = { n: C[1], t: now });
    b.n = Math.min(C[1], b.n + ((now - b.t) / 1000) * C[0]);
    b.t = now;
    if (b.n >= 1) {
      b.n -= 1;
      return true;
    }
    return false;
  }
  const esCaballo = (u) => !!(UN[u.t] && (UN[u.t].caballo || UN[u.t].rol === "cam"));
  function tipoTiro(u) {
    const r = UN[u.t] ? UN[u.t].rol : "";
    if (u.t === "cat") return "catapulta";
    if (u.t === "bal") return "ballesta";
    if (u.t === "fca" || (r === "h" && !esCaballo(u))) return "jabalina";
    return "arco";
  }
  function varN(n, l) {
    let i = 0;
    while (i < l.length && n >= l[i]) i++;
    return i;
  }
  function puntoBrecha(M) {
    if (M.x0 == null || !M.brecha) return { x: BW / 2, y: BH / 2 };
    const m = (M.brecha.a + M.brecha.b) / 2,
      l = M.brecha.l;
    return l === "N" ? { x: m, y: M.y0 } : l === "S" ? { x: m, y: M.y1 } : l === "O" ? { x: M.x0, y: m } : { x: M.x1, y: m };
  }
  function nuevo(bt) {
    todoFin(true);
    SND.bt = bt;
    SND.est.clear();
    SND.fase = bt.phase;
    SND.btT = bt.t;
    SND.simVivo = 0;
    SND.muro = bt.muro ? { hp: bt.muro.hp, k: Math.ceil((bt.muro.hp / bt.muro.hp0) * 10), rota: !!bt.muro.rota } : null;
    SND.vistos = new WeakSet();
    for (const f of bt.fx || []) SND.vistos.add(f);
    SND.exceso = 0;
    SND.relT = 0;
    banco();
  }
  function snap(u) {
    return { n: u.n, muertos: u.muertos, ammo: u.ammo, dispT: u.dispT, rout: u.rout, charge: u.charge, gritoT: -1e9, acc: Math.random(), cama: null, camaSig: 0, ramT: 0 };
  }
  function observa(now) {
    const bt = BT,
      bat = document.getElementById("battle");
    if (!bt || document.hidden || !bat || !bat.classList.contains("show") || bt.quiet) {
      todoFin();
      return;
    }
    if (bt !== SND.bt) nuevo(bt);
    const c = SND.ctx,
      ok = !!(c && c.state === "running" && SND.bank && !SND.oculto),
      dtR = Math.min(0.1, Math.max(0, (now - (SND.tPrev || now)) / 1000));
    SND.tPrev = now;
    if (bt.t !== SND.btT) {
      SND.btT = bt.t;
      SND.simVivo = now;
    }
    const vivo = now - SND.simVivo < 300 && !bt.paused,
      vel = Math.min(2, bt.speed || 1);
    LS = oyente();
    const cand = [],
      M = bt.muro,
      push = (k, x, y, o = {}) => {
        evc(k);
        const P = posic(x, y);
        cand.push({ k, x, y, o, w: o.w || 1, pr: P.g * (o.vol ?? 1) * (NIV[k] ?? 0.5) });
      };
    /* «¡A la batalla!»: grito de cada ejército */
    if (SND.fase === "deploy" && bt.phase !== "deploy") {
      const lados = new Map();
      for (const u of bt.units)
        if (u.x >= 0 && u.n > 0 && !(u.lleg > 0)) {
          const a = lados.get(u.side) || { x: 0, y: 0, n: 0 };
          a.x += u.x * u.n;
          a.y += u.y * u.n;
          a.n += u.n;
          lados.set(u.side, a);
        }
      let j = 0;
      for (const a of lados.values())
        if (a.n > 0) {
          evc("gritoEjercito");
          toca("gritoEjercito", a.x / a.n, a.y / a.n, { delay: j++ * rr(0.4, 0.8), vol: 1.1 });
        }
    }
    SND.fase = bt.phase;
    let E = 0,
      wn = 0,
      wp = 0,
      wg = 0;
    const mov = [];
    for (const u of bt.units) {
      if (u.x < 0 || u.lleg > 0) continue;
      let s = SND.est.get(u.id);
      if (!s) {
        SND.est.set(u.id, snap(u));
        continue;
      }
      if (ok && !u.gone) {
        const cab = esCaballo(u);
        /* bajas */
        const dM = u.muertos - s.muertos,
          dn = s.n - u.n;
        if (dM > 0) push("muerte", u.x, u.y, { w: dM, vol: Math.min(1.3, 0.75 + 0.12 * dM) });
        if (dn > 0 && u.eng > 0) push("golpe", u.x, u.y, { w: dn });
        /* tiros (la munición baja: también las catapultas contra la muralla) */
        if (u.ammo < s.ammo) {
          const k = tipoTiro(u),
            tg = u.dispT !== s.dispT && u.objId != null ? bU(u.objId) : null,
            pm = !tg && u.t === "cat" && M && typeof cmbPuntoMuro === "function" ? cmbPuntoMuro(M, u) : null,
            dst = tg ? { x: tg.x, y: tg.y } : pm,
            n = u.n;
          if (k === "catapulta") {
            push("catapulta", u.x, u.y);
            if (dst) {
              push("silbidoPiedra", u.x, u.y, { ruta: { x0: u.x, y0: u.y, x1: dst.x, y1: dst.y, t: 0.36 } });
              push("impacto", dst.x, dst.y, { delay: 0.36 });
              if (pm && M.hp > 0 && Math.random() < 0.35) push("desprendimiento", dst.x, dst.y, { delay: 0.45, vol: 0.6 });
            }
          } else {
            push(k, u.x, u.y, { v: k === "arco" ? varN(n, [6, 14, 26]) : varN(n, [8, 20]), vol: 0.7 + Math.min(0.5, n / 60), w: n });
            if (dst) {
              if (k !== "jabalina") push("silbido", u.x, u.y, { v: varN(n, [8, 20]), ruta: { x0: u.x, y0: u.y, x1: dst.x, y1: dst.y, t: 0.36 }, w: n });
              push("flechazo", dst.x, dst.y, { delay: 0.34, v: varN(n, [6, 14, 26]), vol: 0.7 + Math.min(0.5, n / 60), w: n });
            }
          }
          if (dst && u.hm && u.hm.fuego) fuego(dst.x, dst.y, 6);
        }
        /* huida */
        if (u.rout && !s.rout) {
          push("huida", u.x, u.y, { w: u.n, vol: 0.8 + Math.min(0.5, u.n / 40) });
          if (cab && UN[u.t].caballo) push("relincho", u.x, u.y, { vol: 0.8 });
        }
        /* carga: choque, grito (si no gritaron al lanzarse) y relincho */
        if (u.charge > 0 && !(s.charge > 0)) {
          push("choque", u.x, u.y, { vol: cab ? 1.1 : 0.85, w: u.n });
          if (now - s.gritoT > 6000) {
            push("grito", u.x, u.y, { w: u.n, vol: 0.8 + Math.min(0.4, u.n / 50) });
            s.gritoT = now;
          }
          if (cab && UN[u.t].caballo) push("relincho", u.x, u.y);
        }
        /* se lanzan contra un enemigo cercano: grito de guerra */
        const movil = vivo && u.mvT && now - u.mvT < 350 && u.n > 0,
          g = u.goal;
        if (movil && !u.eng && !u.rout && g && g.p && u.cs.cl !== "dis" && u.cs.cl !== "asd" && now - s.gritoT > 14000) {
          const d = Math.hypot(g.x - u.x, g.y - u.y);
          if (d < 5.5 && d > 1.2) {
            push("grito", u.x, u.y, { w: u.n, vol: 0.8 + Math.min(0.4, u.n / 50) });
            s.gritoT = now;
          }
        }
        /* relincho de vez en cuando */
        if (cab && UN[u.t].caballo && movil && Math.random() < dtR * 0.03) push("relincho", u.x, u.y, { vol: 0.6 });
        /* cuerpo a cuerpo */
        if (vivo && u.eng > 0 && !u.rout && u.n > 0) {
          s.acc += dtR * (0.9 + 0.3 * Math.min(u.n, 10)) * vel * (u.charge > 0 ? 2 : 1);
          while (s.acc >= 1) {
            s.acc -= rr(0.7, 1.2);
            push(Math.random() < 0.62 ? "espada" : "escudo", u.x + rr(-0.4, 0.4), u.y + rr(-0.4, 0.4), { vol: rr(0.7, 1.1) });
          }
          const nn = Math.min(u.n, 30),
            P = posic(u.x, u.y);
          E += nn;
          wn += nn;
          wp += P.p * nn;
          wg += P.g * nn;
        }
        /* máquina de asedio destruida: madera rota y fuego */
        if (u.cs.cl === "asd" && s.n > 0 && u.n <= 0) {
          push("madera", u.x, u.y, { vol: 1.1 });
          fuego(u.x, u.y, 9);
        }
        /* ariete contra la puerta */
        if (u.t === "ari" && M && M.hp > 0 && SND.muro && M.hp < SND.muro.hp && vivo && typeof cmbDistMuro === "function" && cmbDistMuro(M, u) < 1.4 && now > s.ramT) {
          push("ariete", u.x, u.y, { vol: 1 });
          s.ramT = now + (1700 / vel) * rr(0.9, 1.1);
        }
        /* pasos, carrera, cascos, ruedas */
        if (movil) {
          const r = UN[u.t] ? UN[u.t].rol : "";
          let k = "pasos",
            rate = 1;
          if (r === "ele") {
            k = "galope";
            rate = 0.55;
          } else if (cab) {
            k = "galope";
            rate = r === "cam" ? 0.85 : 1;
          } else if (u.cs.cl === "asd") k = "ruedas";
          else if (u.rout || u.charge > 0 || (g && g.p && Math.hypot(g.x - u.x, g.y - u.y) < 5) || r === "h") k = "carrera";
          const P = posic(u.x, u.y);
          mov.push({ u, s, k, rate, a: P.g * Math.sqrt(Math.min(u.n, 40) / 20) });
        } else if (s.cama && (now - (u.mvT || 0) > 600 || u.n <= 0)) camaFin(s, 0.35);
      } else if (u.gone && s.cama) camaFin(s, 0.6);
      s.n = u.n;
      s.muertos = u.muertos;
      s.ammo = u.ammo;
      s.dispT = u.dispT;
      s.rout = u.rout;
      s.charge = u.charge;
    }
    if (ok) {
      /* flechas de las torres de la muralla (solo se ven en BT.fx) */
      if (M && M.torres && bt.fx) {
        const ya = new Set();
        for (const f of bt.fx) {
          if (!f.arrow || SND.vistos.has(f)) continue;
          SND.vistos.add(f);
          const ti = M.torres.findIndex((tw) => Math.abs(tw.x - f.x0) < 0.01 && Math.abs(tw.y - f.y0) < 0.01);
          if (ti < 0 || ya.has(ti)) continue;
          ya.add(ti);
          push("arco", f.x0, f.y0, { v: 0, vol: 0.75 });
          push("silbido", f.x0, f.y0, { v: 0, ruta: { x0: f.x0, y0: f.y0, x1: f.x, y1: f.y, t: 0.36 } });
          push("flechazo", f.x, f.y, { delay: 0.34, v: 0, vol: 0.7 });
        }
      }
      /* muralla: piedras que caen y, al romperse, derrumbe + fuego + clamor */
      if (M && SND.muro) {
        const k = Math.ceil((Math.max(0, M.hp) / M.hp0) * 10);
        if (k < SND.muro.k && M.hp > 0) {
          const pb = puntoBrecha(M),
            l = M.brecha ? M.brecha.l : "O",
            r = rr(-6, 6);
          push("desprendimiento", l === "N" || l === "S" ? pb.x + r : pb.x, l === "N" || l === "S" ? pb.y : pb.y + r, { vol: 1 });
        }
        if (M.rota && !SND.muro.rota) {
          const pb = puntoBrecha(M);
          evc("derrumbe");
          toca("derrumbe", pb.x, pb.y, { vol: 1.2, fijo: true });
          fuego(pb.x, pb.y, 14);
          push("grito", pb.x, pb.y, { delay: 1.2, vol: 1.2 });
        }
        SND.muro.k = k;
        SND.muro.hp = M.hp;
        SND.muro.rota = !!M.rota;
      }
      emite(cand, now);
      camas(mov, now);
    }
    /* fragor lejano: tanto mayor cuantos más hombres luchan, y más presente cuanto más lejos está la cámara */
    if (ok) {
      if (!SND.fragor) SND.fragor = lazo("fragor", "Ambiente");
      SND.exceso *= Math.exp(-dtR * 1.5);
      const gm = wn ? wg / wn : 0;
      let l = E > 0 ? (0.1 + 0.5 * Math.min(1, Math.sqrt(E / 300))) * (0.45 + 0.55 * (1 - gm)) : 0;
      l += Math.min(0.2, 0.03 * Math.sqrt(SND.exceso));
      if (!vivo) l *= bt.paused ? 0.25 : 0.6;
      S.fragor = +l.toFixed(3);
      if (SND.fragor) SND.fragor.set(l, cl(1200 + 3000 * gm, 900, 4500), wn ? (wp / wn) * 0.7 : 0, 0.5);
      /* fuegos */
      for (let i = SND.fuegos.length - 1; i >= 0; i--) {
        const F = SND.fuegos[i];
        if (now > F.hasta) {
          F.lz.stop(1.5);
          SND.fuegos.splice(i, 1);
          continue;
        }
        const P = posic(F.x, F.y);
        F.lz.set(NIV.fuego * P.g * Math.min(1, (F.hasta - now) / 1500), P.f, P.p, 0.15);
      }
    }
    /* viento: en el despliegue; se apaga cuando empieza la lucha */
    if (c && !SND.oculto) {
      const obj = bt.phase === "deploy" ? 0.5 : 0.28 * Math.max(0, 1 - E / 40);
      vientoPaso(obj, now, bt.phase === "deploy" ? 1.2 : 2.5);
    }
    /* posición de las voces que siguen a una unidad o vuelan */
    if (ok && now - (SND.posT || 0) > 70) {
      SND.posT = now;
      const t = c.currentTime;
      for (const P of [SND.voces, SND.camas])
        for (const v of P) {
          if (v.fin || v.x == null) continue;
          const q = posVoz(v, t);
          v.lvl = v.base * q.g;
          v.g.gain.setTargetAtTime(v.lvl, t, 0.05);
          v.lp.frequency.setTargetAtTime(q.f, t, 0.05);
          if (v.pn) v.pn.pan.setTargetAtTime(q.p, t, 0.05);
        }
    }
  }
  function emite(cand, now) {
    if (!cand.length) return;
    cand.sort((a, b) => b.pr - a.pr);
    /* fundir los parecidos del mismo fotograma y zona */
    const z = new Map(),
      L = [];
    for (const e of cand) {
      if (FUNDE.has(e.k) && e.x != null && !e.o.ruta) {
        const key = e.k + "|" + Math.floor(e.x / 6) + "," + Math.floor(e.y / 6) + "|" + (e.o.delay ? 1 : 0);
        const a = z.get(key);
        if (a) {
          a.w += e.w;
          a.extra = (a.extra || 0) + 1;
          continue;
        }
        z.set(key, e);
      }
      L.push(e);
    }
    for (const e of L) {
      if (!cubeta(e.k, now)) {
        SND.exceso += e.w;
        continue;
      }
      const o = { ...e.o };
      if (e.extra) {
        o.vol = Math.min(1.5, (o.vol ?? 1) * (1 + 0.15 * Math.min(4, e.extra)));
        if (o.v != null) o.v = o.v + 1;
      }
      toca(e.k, e.x, e.y, o);
      /* muchas muertes juntas: un segundo grito un poco después */
      if (e.k === "muerte" && e.w >= 3 && cubeta("muerte", now)) toca("muerte", e.x + rr(-0.5, 0.5), e.y + rr(-0.5, 0.5), { delay: rr(0.08, 0.3), vol: 0.8 });
    }
  }
  function camaFin(s, tc) {
    for (const v of [s.cama, s.camaAnt]) if (v && !v.fin) callar(v, tc);
    s.cama = s.camaAnt = null;
  }
  function camas(mov, now) {
    const c = SND.ctx,
      t = c.currentTime;
    mov.sort((a, b) => b.a - a.a);
    const top = new Set();
    for (let i = 0; i < mov.length && top.size < 6; i++) {
      const m = mov[i];
      if (m.a < 0.04) break;
      top.add(m.u.id);
      const s = m.s,
        V = s.cama,
        vol = Math.min(1.4, Math.sqrt(Math.min(m.u.n, 40) / 20));
      if (V && !V.fin && V.k === m.k) {
        V.base = vol * (NIV[m.k] ?? 0.5);
        if (t < s.camaSig - 0.15) continue;
      } else if (V && !V.fin) callar(V, 0.25);
      evc(m.k);
      const seguir = V && !V.fin && V.k === m.k,
        nv = toca(m.k, null, null, { u: m.u, cama: true, vol, rate: m.rate, delay: seguir ? Math.max(0, s.camaSig - t) : 0 });
      if (nv) {
        s.camaAnt = seguir ? V : null;
        s.cama = nv;
        s.camaSig = nv.t0 + nv.dur - 0.45;
      }
    }
    for (const m of mov)
      if (!top.has(m.u.id) && m.s.cama) camaFin(m.s, 0.4);
  }
  function todoFin(sinViento) {
    for (const v of [...SND.voces, ...SND.camas]) callar(v, 0.25);
    if (SND.fragor) {
      SND.fragor.stop(0.6);
      SND.fragor = null;
    }
    for (const F of SND.fuegos) F.lz.stop(0.6);
    SND.fuegos = [];
    if (!sinViento) {
      vientoPaso(0, performance.now(), 0.4);
      SND.activo = false;
    }
    SND.bt = null;
    SND.est.clear();
    S.fragor = 0;
  }
  function tic(now) {
    if (!SND.activo) return;
    const t0 = performance.now();
    try {
      observa(now);
    } catch (e) {
      if (!S.err++) console.error("sonido:", e);
    }
    const ms = performance.now() - t0;
    S.tics++;
    S.msTot += ms;
    if (!SND.cargando) {
      S.ticsJ = (S.ticsJ || 0) + 1;
      S.msTotJ = (S.msTotJ || 0) + ms;
      S.msJuego = +(S.msTotJ / S.ticsJ).toFixed(3);
      if (ms > (S.msMaxJ || 0)) S.msMaxJ = +ms.toFixed(3);
    }
    S.ms = +(S.msTot / S.tics).toFixed(3);
    if (ms > S.msMax) S.msMax = +ms.toFixed(3);
    if (SND.activo) requestAnimationFrame(tic);
  }
  function arranca() {
    if (SND.activo || document.hidden || typeof BT === "undefined" || !BT) return;
    if (!init()) return;
    SND.activo = true;
    SND.tPrev = performance.now();
    requestAnimationFrame(tic);
  }
  SND.arranca = arranca;
  SND.fin = () => todoFin();
  /* vigía lento: arranca el bucle al abrir una batalla y lleva el ambiente del mapa de campaña */
  let pajT = 0;
  setInterval(() => {
    if (document.hidden) return;
    if (typeof BT !== "undefined" && BT) {
      if (!SND.activo) arranca();
      return;
    }
    if (!SND.ctx || SND.activo) return;
    const st = document.getElementById("start"),
      bat = document.getElementById("battle"),
      camp = typeof G !== "undefined" && G && !(st && st.classList.contains("show")) && !(bat && bat.classList.contains("show")),
      now = performance.now();
    vientoPaso(camp ? 0.14 : 0, now, 2.5);
    if (camp && now > pajT) {
      if (pajT) pajaro();
      pajT = now + rr(5000, 14000);
    }
  }, 1000);
  const bat0 = document.getElementById("battle");
  if (bat0 && typeof MutationObserver !== "undefined")
    new MutationObserver(() => {
      if (bat0.classList.contains("show")) arranca();
    }).observe(bat0, { attributes: true, attributeFilter: ["class"] });
  /* pestaña oculta: silencio y todo parado; al volver, sigue */
  document.addEventListener("visibilitychange", () => {
    if (!SND.ctx) return;
    const t = SND.ctx.currentTime;
    if (document.hidden) {
      SND.oculto = true;
      SND.out.gain.setTargetAtTime(0, t, 0.03);
      todoFin();
      vientoFin();
    } else {
      SND.oculto = false;
      SND.out.gain.setTargetAtTime(1, t, 0.1);
      arranca();
    }
  });

  /* ======================= disparo manual ======================= */
  SND._ev = (tipo, d) => {
    if (!init()) return false;
    if (!SND.bank) banco();
    if (!LS && typeof BT !== "undefined" && BT) LS = oyente();
    evc(tipo);
    if (tipo === "fuego") return !!fuego(d.x ?? BW / 2, d.y ?? BH / 2, d.dur || 6);
    if (tipo === "pajaros") return pajaro(), true;
    if (tipo === "viento") {
      vientoPaso(d.vol ?? 0.4, performance.now(), 1);
      return true;
    }
    const alias = { muro: "derrumbe", flecha: "flechazo", flechas: "arco", grito_ejercito: "gritoEjercito", artilleria: "catapulta", caballo: "galope" },
      k = alias[tipo] || tipo;
    if (!REC.some((r) => r[0] === k)) return false;
    const o = { vol: d.vol ?? 1 };
    if (d.n != null) o.v = varN(d.n, [6, 14, 26]);
    if (d.v != null) o.v = d.v;
    return !!toca(k, d.x, d.y, o);
  };
  SND.CAT = CAT;
  SND.REC = REC.map((r) => r[0]);
  SND.oyente = () => (LS = oyente());
  SND.posic = posic;
})();
