/* ---------- habilidades de unidades especiales ---------- Sistema COMBATE
   Las usan las dos resoluciones de batalla (batalla.js): la táctica (botón por unidad con enfriamiento;
   la IA las usa con criterio) y la automática (por rondas: 1 ronda = 10 s de batalla).
   Cada unidad lleva x.hab = [{id, cd, t, b, n}] (enfriamiento, activa, bajón, usos).
   Adaptador B que pasa cada motor: {auto, aliados(x, r), enemigos(x, r), dist(x, y), log(txt, prio, x)}.
   Efectos (cmbHabMod): me de ve pr fat (multiplicadores), ar es (sumas), morImm, morMin, carga,
   antiCarga, fuego, veneno, parto, aura. */
const CMB_HAB = {
  grito: {
    n: "Grito de guerra",
    d: "Sobrecoge al enemigo cercano y enardece a los suyos",
    dur: 8,
    cd: 45,
    act: { me: 1.12 },
    al(x, B) {
      for (const e of B.enemigos(x, 3)) e.mor -= 8 * (1 - (e.st || e.cs).di * 0.05) * (B.auto ? 0.6 : 1);
      for (const a of B.aliados(x, 3)) a.mor = Math.min(a.mx ?? a.morMax, a.mor + 5);
    },
    cuando: (x, B) => B.enemigos(x, 2.5).length > 0,
    txt: "Los {n} lanzan su grito de guerra; el enemigo se estremece.",
  },
  berserker: {
    n: "Furia berserker",
    d: "Ataque enorme y sin miedo un rato; después flaquean por debajo de lo normal",
    dur: 14,
    bajon: 18,
    cd: 999,
    usos: 1,
    act: { me: 1.6, de: 0.85, fat: 0.5, morImm: true },
    baj: { me: 0.7, de: 0.8, ve: 0.8 },
    alBajon(x) {
      x.fat = Math.min(100, x.fat + 25);
      x.mor -= 10;
    },
    cuando: (x, B) => B.enemigos(x, 3).length > 0,
    txt: "Los {n} muerden el hongo y enloquecen: nada los detiene.",
    fin: "La furia de los {n} se apaga: ahora flaquean, exhaustos.",
  },
  muroEscudos: {
    n: "Muro de escudos",
    d: "Cierran filas: mucha más defensa y escudo, casi inmóviles",
    dur: 15,
    cd: 25,
    act: { de: 1.5, es: 0.3, ve: 0.35, me: 0.8, antiCarga: true },
    cuando: (x, B) =>
      B.enemigos(x, 5).some((e) => UN[e.t].cl === "cab") ||
      (B.enemigos(x, 1.5).length > 1 && x.mor < (x.mx ?? x.morMax) * 0.7),
    txt: "Los {n} cierran el muro de escudos.",
  },
  testudo: {
    n: "Testudo",
    d: "Tortuga de escudos: las flechas apenas hieren; lentos y torpes al golpear",
    dur: 15,
    cd: 25,
    act: { es: 0.5, ar: 3, ve: 0.5, me: 0.6 },
    cuando: (x, B) => !!x.tiroso && !B.enemigos(x, 1.5).length,
    txt: "Los {n} forman la tortuga: las flechas rebotan en los escudos.",
  },
  carga: {
    n: "Carga",
    d: "Embestida a fondo aunque no haya carrerilla",
    dur: 6,
    cd: 40,
    act: { carga: 1.5, ve: 1.3 },
    al(x) {
      x.fat = Math.min(100, x.fat + 8);
      if (!x.auto) x.charge = Math.max(x.charge || 0, 1.5);
    },
    cuando: (x, B) => B.enemigos(x, 4).length > 0 && x.fat < 60,
    txt: "Los {n} cargan con todo.",
  },
  lluviaFlechas: {
    n: "Lluvia de flechas",
    d: "Descargas cerradas que oscurecen el cielo",
    dur: 10,
    cd: 40,
    act: { pr: 1.7 },
    al(x) {
      x.ammo = Math.max(0, (x.ammo || 0) - 1);
    },
    cuando: (x, B) => (x.ammo || 0) >= 3 && B.enemigos(x, (x.st || x.cs).al || 0).length > 0,
    txt: "Los {n} oscurecen el cielo con sus descargas.",
  },
  emboscada: {
    n: "Emboscada",
    d: "Golpe por sorpresa (mejor desde el bosque)",
    dur: 8,
    cd: 999,
    usos: 1,
    act: { me: 1.8 },
    al(x, B) {
      for (const e of B.enemigos(x, 3)) e.mor -= 12 * (B.auto ? 0.5 : 1);
    },
    cuando: (x, B) =>
      B.enemigos(x, 3).length > 0 && (B.auto ? B.bosque() > 0.2 || R() < 0.4 : B.enBosque(x) || R() < 0.02),
    txt: "¡Emboscada! Los {n} caen por sorpresa sobre el enemigo.",
  },
  fuegoGriego: {
    n: "Fuego griego",
    d: "Fuego que ni la armadura ni el escudo detienen",
    dur: 6,
    cd: 25,
    usos: 3,
    act: { fuego: true, pr: 1.6 },
    al(x, B) {
      for (const e of B.enemigos(x, (x.st || x.cs).al || 3)) e.mor -= 10 * (B.auto ? 0.5 : 1);
    },
    cuando: (x, B) => B.enemigos(x, (x.st || x.cs).al || 3).length > 0,
    txt: "Los {n} lanzan fuego griego: el enemigo arde.",
  },
  estampida: {
    n: "Estampida",
    d: "Embestida de las bestias: pisotean y aterrorizan",
    dur: 6,
    cd: 50,
    act: { carga: 1.6, me: 1.2 },
    al(x, B) {
      for (const e of B.enemigos(x, 2.5)) e.mor -= (UN[e.t].caballo ? 15 : 10) * (B.auto ? 0.5 : 1);
      if (!x.auto) x.charge = Math.max(x.charge || 0, 1.5);
    },
    cuando: (x, B) => B.enemigos(x, 3).length > 0 && x.mor > (x.mx ?? x.morMax) * 0.4,
    txt: "Los {n} embisten en estampida.",
  },
  espanto: {
    n: "Espanto",
    d: "Los caballos enemigos cercanos se encabritan: −25% ataque y pierden moral",
    pasiva: true,
  },
  disparoParto: {
    n: "Disparo parto",
    d: "Fingen la huida y disparan volviéndose en la silla",
    dur: 12,
    cd: 35,
    act: { pr: 1.3, ve: 1.2, parto: true },
    cuando: (x, B) => (x.ammo || 0) > 0 && B.enemigos(x, 4).some((e) => !((e.st || e.cs).al > 0)),
    txt: "Los {n} fingen la huida y disparan volviéndose en la silla.",
  },
  juramento: {
    n: "Juramento",
    d: "No cederán: la moral no baja del 30% un tiempo",
    dur: 20,
    cd: 60,
    act: { morMin: 0.3 },
    cuando: (x, B) => x.mor < (x.mx ?? x.morMax) * 0.4 && B.enemigos(x, 2).length > 0,
    txt: "Los {n} renuevan su juramento: no cederán.",
  },
  veneno: {
    n: "Veneno",
    d: "Armas envenenadas: más muertos y menos heridos",
    dur: 15,
    cd: 40,
    act: { me: 1.1, pr: 1.15, veneno: true },
    cuando: (x, B) => B.enemigos(x, Math.max(2, (x.st || x.cs).al || 0)).length > 0,
    txt: "Los {n} untan sus armas con veneno.",
  },
  sacrificio: {
    n: "Sacrificio",
    d: "Ofrenda a los dioses: todo el ejército se enardece",
    dur: 15,
    cd: 999,
    usos: 1,
    act: { me: 1.15 },
    al(x, B) {
      for (const a of B.aliados(x, 99)) a.mor = Math.min(a.mx ?? a.morMax, a.mor + 10);
      x.fat = Math.min(100, x.fat + 15);
    },
    cuando: (x, B) => B.enemigos(x, 2).length > 0 && B.moralAliada(x) < 0.65,
    txt: "Los {n} ofrecen sangre a los dioses: los suyos se enardecen.",
  },
  tambores: {
    n: "Tambores",
    d: "Los suyos cercanos recobran moral y aliento",
    dur: 20,
    cd: 50,
    act: { aura: true },
    al(x, B) {
      for (const a of B.aliados(x, 5)) {
        a.mor = Math.min(a.mx ?? a.morMax, a.mor + 10);
        a.fat = Math.max(0, a.fat - 10);
      }
    },
    cuando: (x, B) => B.moralAliada(x) < 0.6,
    txt: "Retumban los tambores de los {n}: los suyos recobran el aliento.",
  },
};
const cmbHabTxt = (s, x) => s.replace("{n}", x.nm || CIV[x.f].un[x.t].toLowerCase());
/* prepara las habilidades de una unidad o bloque */
function cmbHabIni(x, f, t, extra = []) {
  x.hab = [...cmbHabsDe(f, t), ...extra]
    .filter((id) => CMB_HAB[id])
    .map((id) => ({ id, cd: 0, t: 0, b: 0, n: 0 }));
  return x;
}
function cmbHabPuede(x, id) {
  const h = (x.hab || []).find((h) => h.id === id),
    D = CMB_HAB[id];
  return !!(
    h &&
    D &&
    !D.pasiva &&
    !x.rout &&
    x.n > 0 &&
    h.cd <= 0 &&
    h.t <= 0 &&
    h.b <= 0 &&
    h.n < (D.usos || 99)
  );
}
function cmbHabUsar(x, id, B) {
  if (!cmbHabPuede(x, id)) return false;
  const h = x.hab.find((h) => h.id === id),
    D = CMB_HAB[id];
  h.t = D.dur;
  h.cd = D.cd + D.dur;
  h.n++;
  if (D.al) D.al(x, B);
  B.log(cmbHabTxt(D.txt, x), 3, x, id);
  return true;
}
/* avanza el tiempo (s): fin de efecto y bajón */
function cmbHabTick(x, dt, B) {
  for (const h of x.hab || []) {
    const D = CMB_HAB[h.id];
    if (h.cd > 0) h.cd -= dt;
    if (h.t > 0) {
      h.t -= dt;
      if (h.t <= 0) {
        h.t = 0;
        if (D.bajon) {
          h.b = D.bajon;
          if (D.alBajon) D.alBajon(x);
        }
        if (D.fin) B.log(cmbHabTxt(D.fin, x), 3, x, h.id);
      }
    } else if (h.b > 0) h.b = Math.max(0, h.b - dt);
  }
}
const CMB_HMOD0 = { me: 1, de: 1, ve: 1, pr: 1, fat: 1, ar: 0, es: 0, carga: 1, morMin: 0 };
/* efecto combinado de las habilidades activas (y del bajón) de x */
function cmbHabMod(x) {
  const m = { ...CMB_HMOD0 };
  for (const h of x.hab || []) {
    const D = CMB_HAB[h.id],
      e = h.t > 0 ? D.act : h.b > 0 ? D.baj : null;
    if (!e) continue;
    for (const k in e) {
      const v = e[k];
      if (typeof v === "boolean") m[k] = m[k] || v;
      else if (k === "ar" || k === "es") m[k] += v;
      else if (k === "morMin") m[k] = Math.max(m[k], v);
      else m[k] *= v;
    }
  }
  return m;
}
const cmbHabTiene = (x, id) => (x.hab || []).some((h) => h.id === id);
const cmbHabActiva = (x, id) => (x.hab || []).some((h) => h.id === id && h.t > 0);
/* la IA (y los capitanes delegados) usa sus habilidades con criterio */
function cmbHabIA(x, B) {
  for (const h of x.hab || []) {
    const D = CMB_HAB[h.id];
    if (!D.pasiva && cmbHabPuede(x, h.id) && D.cuando && D.cuando(x, B)) {
      cmbHabUsar(x, h.id, B);
      return;
    }
  }
}
/* moral: respeta la inmunidad y el suelo de las habilidades */
function cmbHabMoral(x, m) {
  const mx = x.mx ?? x.morMax;
  if (m.morImm && x.mor < x._morPrev) x.mor = x._morPrev;
  if (m.morMin && x.mor < mx * m.morMin) x.mor = mx * m.morMin;
}
