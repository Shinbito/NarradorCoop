/* ---------- clases de guerreros: catálogo, pueblos, veteranía y reclutamiento ----------
   Sistema de COMBATE. Las estadísticas base de cada clase están en UN (nucleo.js); aquí
   se definen las variantes de cada pueblo (por CIV[f].id), la fama militar que desbloquea las tropas
   de élite, la veteranía persistente (G.cmb.vet), los mandos (generales y capitanes) y las pantallas
   de reclutamiento y ejército. */

/* Fuerzas y debilidades, para tooltips y códex (frases cortas: el panel mide ~360px) */
const CMB_INFO = {
  l: { tag: "Muro de escudos", fu: "Frenan cargas de caballería", db: "Lentos y flojos al atacar" },
  i: { tag: "Línea", fu: "Versátiles y baratos", db: "Sufren ante cargas pesadas" },
  p: { tag: "Acorazados", fu: "Armadura y disciplina férreas", db: "Caros; se cansan pronto" },
  h: { tag: "Hostigadores", fu: "Rápidos; piedras y dardos", db: "Huyen en el cuerpo a cuerpo" },
  a: { tag: "Tiro a distancia", fu: "Largo alcance; diezman la línea", db: "Frágiles ante la caballería" },
  x: { tag: "Hostigamiento", fu: "Flanquean y persiguen", db: "Débiles contra lanzas e infantería" },
  c: { tag: "Choque", fu: "Carga poderosa; arrollan arqueros", db: "Se atascan contra lanceros" },
  k: {
    tag: "Carga acorazada",
    fu: "Carga devastadora; casi inmunes a flechas",
    db: "Carísimos, lentos, se agotan",
  },
  m: { tag: "Tiro a caballo", fu: "Disparan y se retiran", db: "Débiles cuerpo a cuerpo" },
  ari: { tag: "Asedio", fu: "Bate puertas y murallas", db: "Lento e indefenso en campo abierto" },
  tor: { tag: "Asedio", fu: "Lleva tropas al adarve: anula murallas", db: "Enorme blanco; inútil en campo" },
  cat: { tag: "Asedio", fu: "Derriba muros; tiro muy largo", db: "Pocos disparos; indefensa de cerca" },
  ele: {
    tag: "Bestias de guerra",
    fu: "Carga brutal; espantan caballos",
    db: "Si flaquean, pisotean a los suyos",
  },
  cam: {
    tag: "Montura del desierto",
    fu: "Espantan caballos; no sufren el calor",
    db: "Flojos contra lanzas",
  },
  car: { tag: "Carros", fu: "Carga y tiro desde el carro", db: "Torpes en bosque y contra lanzas" },
  com: { tag: "Testudo", fu: "Tortuga de escudos ante las flechas", db: "Lentos al cerrar filas" },
  sif: { tag: "Fuego griego", fu: "Fuego que ni armadura ni escudo paran", db: "Muy pocas descargas" },
  esg: { tag: "Muro de escudos", fu: "Cierran filas: casi infranqueables", db: "Inmóviles mientras forman" },
  hpa: { tag: "Disparo parto", fu: "Tiran mientras se retiran", db: "Débiles cuerpo a cuerpo" },
  cor: { tag: "Emboscada", fu: "Golpe por sorpresa desde el bosque", db: "Poca armadura" },
  fca: { tag: "Francisca", fu: "Hacha arrojadiza antes del choque", db: "Un solo lanzamiento" },
  inm: { tag: "Juramento", fu: "No se rompen fácilmente", db: "Carísimos" },
  ber: {
    tag: "Furia",
    fu: "Enloquecen: ataque enorme un rato",
    db: "Luego flaquean por debajo de lo normal",
  },
  jag: { tag: "Guerra florida", fu: "Grito y sacrificio que enardecen", db: "Armadura de algodón" },
  agu: { tag: "Emboscada", fu: "Dardos y asalto por sorpresa", db: "Frágiles" },
  bal: { tag: "Ballesta", fu: "Virotes que perforan armaduras", db: "Recarga lenta" },
  hop: { tag: "Falange", fu: "Muro de escudos y lanzas", db: "Lentos; flancos débiles" },
  mac: { tag: "Tambores", fu: "Sus tambores sostienen a los suyos", db: "Poca protección" },
  atl: { tag: "Veneno", fu: "Dardos envenenados", db: "Frágiles" },
  fia: { tag: "Grito y emboscada", fu: "Rápidos y feroces", db: "Poca armadura" },
  bos: { tag: "Emboscada", fu: "Lanzas desde la espesura", db: "Débiles en llano" },
  kes: { tag: "Guardia del kan", fu: "Disparo parto y tambores", db: "Carísimos" },
};
const cmbInfo = (t) => CMB_INFO[t] || CMB_INFO[UN[t].rol] || { tag: "", fu: "", db: "" };
/* Variantes de cada pueblo (por CIV[f].id): t -> [nombre, fama necesaria, bono {atk, hp}, habilidades extra].
   i/a/c existen siempre (nombres y bonos en CIV); las demás clases solo si figuran aquí, y las únicas y
   bestias si su UN[t].civs incluye el pueblo. La tecnología puede añadir o quitar clases por ciudad. */
const CMB_CIV = {
  occ: {
    l: ["Auxiliares", 0],
    p: ["Palatinos", 3, { atk: 1, hp: 1.1 }],
    h: ["Funditores", 0],
    x: ["Exploratores", 0],
    k: ["Catafractarios", 4],
  },
  ori: {
    l: ["Lanceros tracios", 0],
    p: ["Escolas palatinas", 4],
    h: ["Isaurios", 0],
    x: ["Federados hunos", 0, { atk: 1.1, hp: 1 }],
    k: ["Clibanarios", 3, { atk: 1, hp: 1.1 }],
    m: ["Hipotoxotas", 2],
  },
  vis: {
    l: ["Lanceros godos", 0, { atk: 1.1, hp: 1 }],
    p: ["Gardingos", 3, { atk: 1.15, hp: 1 }],
    h: ["Jabalineros", 0],
    k: ["Nobles a caballo", 4, { atk: 1.1, hp: 1 }],
  },
  hun: {
    l: ["Lanceros ostrogodos", 2],
    a: ["Arqueros gépidos", 0],
    x: ["Exploradores esteparios", 0, { atk: 1.15, hp: 1 }],
    k: ["Nobles hunos", 3],
    m: ["Arqueros montados", 0, { atk: 1.2, hp: 1.05 }, ["disparoParto"]],
  },
  van: {
    l: ["Lanceros", 0],
    p: ["Séquito real", 3],
    h: ["Jabalineros moros", 0],
    x: ["Jinetes moros", 0, { atk: 1.1, hp: 1 }],
  },
  fra: {
    l: ["Lanceros francos", 0],
    p: ["Antrustiones", 3, { atk: 1.1, hp: 1.05 }],
    h: ["Lanzadores de angón", 0, { atk: 1.15, hp: 1 }],
  },
  per: {
    l: ["Lanceros de leva", 0],
    p: ["Dailamitas", 2, { atk: 1.1, hp: 1 }],
    h: ["Honderos", 0],
    x: ["Jinetes árabes", 0],
    k: ["Clibanarios persas", 3, { atk: 1.05, hp: 1.1 }],
    m: ["Arqueros a caballo", 2],
  },
  ara: {
    l: ["Lanceros del desierto", 0],
    h: ["Honderos", 0],
    x: ["Jinetes beduinos", 0, { atk: 1.1, hp: 1 }],
    m: ["Arqueros montados", 2],
  },
  nor: {
    l: ["Muro de escudos", 0, null, ["muroEscudos"]],
    p: ["Huscarles", 3, { atk: 1.15, hp: 1.05 }],
    h: ["Lanzadores de jabalina", 0],
  },
  chi: {
    l: ["Alabarderos", 0],
    p: ["Guardia imperial", 3],
    h: ["Honderos", 0],
    x: ["Jinetes ligeros", 0],
    k: ["Caballería acorazada", 4],
    m: ["Arqueros a caballo", 2],
  },
  inc: { l: ["Lanceros", 0], h: ["Honderos", 0, { atk: 1.15, hp: 1 }], p: ["Guardia del Inca", 3] },
  may: { l: ["Lanceros", 0], h: ["Honderos", 0], p: ["Guerreros nobles", 3] },
  azt: { l: ["Lanceros", 0], h: ["Honderos", 0] },
  gri: { h: ["Peltastas", 0], p: ["Epílectos", 3], x: ["Pródromos", 0], k: ["Catafractos", 4] },
  egi: { l: ["Lanceros", 0], h: ["Honderos", 0], p: ["Guardia del faraón", 3] },
  ind: { l: ["Lanceros", 0], h: ["Jabalineros", 0], x: ["Jinetes", 0], p: ["Kshatriyas", 3] },
  cel: { l: ["Lanceros", 0], h: ["Honderos", 0], x: ["Jinetes celtas", 0], p: ["Campeones", 3] },
  esl: { l: ["Lanceros", 0], h: ["Jabalineros", 0], x: ["Jinetes", 0], p: ["Druzhina", 3] },
  mon: {
    l: ["Lanceros", 2],
    x: ["Exploradores", 0],
    k: ["Lanceros pesados", 3],
    m: ["Arqueros montados", 0, { atk: 1.15, hp: 1 }, ["disparoParto"]],
  },
  reb: { l: ["Campesinos armados", 0] },
};
const CMB_ORIG = ["occ", "ori", "vis", "hun", "van", "fra", "per"];
/* id de un pueblo: CIV[f].id (fase 2) o el de las 7 originales por su índice */
const cmbCivId = (f) => (CIV[f] && CIV[f].id) || (f === REB ? "reb" : CMB_ORIG[f]) || "f" + f;
const cmbCivDe = (f) => CMB_CIV[cmbCivId(f)] || {};
const CMB_BASE = ["i", "a", "c"];
/* ids de los pueblos que tienen cada clase (únicas: UN[t].civs; normales: CMB_CIV) */
for (const t of TYP)
  UN[t].civIds =
    UN[t].civIds ||
    (Array.isArray(UN[t].civs) ? UN[t].civs.filter((x) => typeof x === "string") : null) ||
    (CMB_BASE.includes(t) || UN[t].asedio ? null : Object.keys(CMB_CIV).filter((id) => CMB_CIV[id][t]));
/* nombres, bonos y lista de pueblos (ids + índices, para tecnología) de todas las clases; idempotente:
   se repite en partidaLista por si Mundo añade civilizaciones */
function cmbCivSync() {
  CIV.forEach((c, f) => {
    const r = cmbCivDe(f);
    c.un = c.un || {};
    c.bon = c.bon || {};
    for (const t of TYP) {
      if (r[t]) c.un[t] = r[t][0];
      else if (!c.un[t]) c.un[t] = UN[t].s;
      if (!c.bon[t]) c.bon[t] = (r[t] && r[t][2]) || { atk: 1, hp: 1 };
    }
  });
  for (const t of TYP)
    if (UN[t].civIds)
      UN[t].civs = [
        ...UN[t].civIds,
        ...CIV.map((c, f) => f).filter((f) => UN[t].civIds.includes(cmbCivId(f))),
      ];
}
cmbCivSync();
const cmbSinTipos = (f) => (CIV[f] && CIV[f].sinTipos) || [];
/* repertorio de un pueblo: i/a/c + sus variantes + únicas y bestias; nunca máquinas de asedio ni vetados */
const cmbRoster = (f) => {
  const id = cmbCivId(f),
    r = cmbCivDe(f),
    sin = cmbSinTipos(f);
  return TYP.filter(
    (t) =>
      !UN[t].asedio &&
      !sin.includes(t) &&
      !(UN[t].caballo && sin.includes("caballos")) &&
      (CMB_BASE.includes(t) || r[t] || (t.length > 1 && UN[t].civIds && UN[t].civIds.includes(id))),
  );
};
const cmbReq = (f, t) => (cmbCivDe(f)[t] || [])[1] || 0;
/* habilidades de una clase para un pueblo */
const cmbHabsDe = (f, t) => [...new Set([...(UN[t].hab || []), ...((cmbCivDe(f)[t] || [])[3] || [])])];

/* ---------- estado: G.cmb ---------- */
function cmbS() {
  const S = OC.estado("cmb", () => ({ v: 1, vet: {}, ori: {}, fama: [], inf: [] }));
  if (!S) return { vet: {}, ori: {}, fama: [], inf: [] };
  S.vet = S.vet || {};
  S.ori = S.ori || {};
  S.fama = S.fama || [];
  S.inf = S.inf || [];
  return S;
}
const cmbFama = (f) => cmbS().fama[f] || 0;
function cmbFamaSumar(f, v) {
  const S = cmbS();
  S.fama[f] = Math.round(((S.fama[f] || 0) + v) * 100) / 100;
}
/* p.u siempre con todas las claves de TYP, enteras y no negativas (otros sistemas crean {i,a,c}) */
function cmbNorm(u) {
  if (!u) return u;
  for (const t of TYP) u[t] = Number.isFinite(u[t]) && u[t] > 0 ? Math.round(u[t]) : 0;
  return u;
}
const cmbNormTodo = () => G && G.P && G.P.forEach((p) => (p.u = cmbNorm(p.u || {})));
function cmbSuma(a, b) {
  for (const t of TYP) a[t] = (a[t] || 0) + (b[t] || 0);
  return a;
}
const cmbVacio = () => Object.fromEntries(TYP.map((t) => [t, 0]));

/* ---------- veteranía: xp 0-100 por provincia, pueblo y clase ---------- */
const CMB_NIV = [
  [0, "Bisoños"],
  [15, "Curtidos"],
  [40, "Veteranos"],
  [75, "Élite"],
];
const cmbNivelVet = (xp) => CMB_NIV.filter((n) => xp >= n[0]).pop()[1];
function cmbVetDe(p) {
  const e = cmbS().vet[p.id];
  return e && e.f === p.owner ? e.v : {};
}
function cmbVetFijar(p, v) {
  const S = cmbS(),
    lim = {};
  for (const t of TYP) if ((p.u[t] || 0) > 0 && v[t] > 0.5) lim[t] = Math.round(Math.min(100, v[t]));
  if (Object.keys(lim).length) S.vet[p.id] = { f: p.owner, v: lim };
  else delete S.vet[p.id];
}
/* mezcla la veteranía de una tropa que llega (u, xp) con la que ya hay en p (antes de sumar u a p.u) */
function cmbVetMezclar(p, u, xp) {
  const v = { ...cmbVetDe(p) };
  for (const t of TYP) {
    const a = p.u[t] || 0,
      b = u[t] || 0;
    if (a + b > 0) v[t] = ((v[t] || 0) * a + ((xp && xp[t]) || 0) * b) / (a + b);
  }
  return v;
}
/* ---------- origen del equipo: ciudad donde se reclutó cada clase ----------
   Cada ciudad tiene su propia tecnología (tecnología la aplica en 'statsUnidad' con ctx.p): una tropa
   recuerda su ciudad de origen y en batalla se calcula con ella mientras siga siendo del mismo dueño. */
function cmbOriDe(p) {
  const e = cmbS().ori[p.id];
  return e && e.f === p.owner ? e.o : {};
}
function cmbOriFijar(p, o) {
  const S = cmbS(),
    lim = {};
  for (const t of TYP) if ((p.u[t] || 0) > 0 && o && o[t] != null) lim[t] = o[t];
  if (Object.keys(lim).length) S.ori[p.id] = { f: p.owner, o: lim };
  else delete S.ori[p.id];
}
/* la clase toma el origen de quien aporte más hombres (aproximación sin desglose por origen) */
function cmbOriMezclar(p, u, o) {
  const r = { ...cmbOriDe(p) };
  for (const t of TYP)
    if ((u[t] || 0) > 0 && o && o[t] != null && (u[t] >= (p.u[t] || 0) || r[t] == null)) r[t] = o[t];
  return r;
}
/* provincia con la que se calculan las estadísticas: la de origen si sigue siendo propia */
function cmbOrigenP(f, t, ori, p) {
  const q = ori && ori[t] != null ? G.P[ori[t]] : null;
  return q && q.owner === f ? q : p || null;
}
/* llegada de tropas a una provincia propia: suma hombres, veteranía y origen */
function cmbLlega(p, u, xp, ori) {
  cmbNorm(p.u);
  const v = cmbVetMezclar(p, u, xp),
    o = cmbOriMezclar(p, u, ori);
  cmbSuma(p.u, u);
  cmbVetFijar(p, v);
  cmbOriFijar(p, o);
}
/* media ponderada de un ejército (para mostrar) */
function cmbVetMedia(u, xp) {
  let n = 0,
    s = 0;
  for (const t of TYP) {
    n += u[t] || 0;
    s += (u[t] || 0) * ((xp && xp[t]) || 0);
  }
  return n ? s / n : 0;
}

/* ---------- estadísticas de una clase en batalla ---------- */
const CMB_CAMPOS = ["me", "ca", "de", "ar", "es", "vi", "mo", "di", "fa", "ve", "al", "mu", "pr"];
function cmbStats(f, t, p, lado, xp = 0) {
  const b = (CIV[f] && CIV[f].bon[t]) || { atk: 1, hp: 1 },
    s = { cl: UN[t].cl };
  for (const k of CMB_CAMPOS) s[k] = UN[t][k];
  s.me *= b.atk || 1;
  s.pr *= b.atk || 1;
  s.vi *= b.hp || 1;
  for (const k of CMB_CAMPOS) if (k !== "vi" && typeof b[k] === "number" && b[k] !== 1) s[k] += b[k];
  /* OC 'statsUnidad': estadísticas de la clase. ctx {f, t, p, lado:'atacante'/'defensor'}.
     atk y hp son multiplicadores (1 = base): escalan ataque/proyectiles y vida. El resto, valores absolutos. */
  s.atk = 1;
  s.hp = 1;
  const r = { ...s, ...(OC.calc("statsUnidad", s, { f, t, p, lado }) || {}) };
  r.me *= r.atk;
  r.pr *= r.atk;
  r.vi *= r.hp;
  const v = clamp(xp || 0, 0, 100);
  return {
    ...r,
    me: r.me * (1 + v / 500),
    de: r.de * (1 + v / 500),
    mo: r.mo + v / 5,
    di: r.di + v / 25,
    fa: r.fa * (1 - v / 400),
    xp: v,
  };
}

/* coste en oro de una leva en la ciudad p (cada ciudad arma distinto). OC 'costeUnidad' ctx {f, t, p} */
const cmbCoste = (f, t, p) =>
  Math.round(
    OC.calc("costeUnidad", UN[t].cost * (t === "i" && CIV[f].icost ? CIV[f].icost : 1), {
      f,
      t,
      p: p || null,
    }),
  );
/* ---------- disponibilidad: fama militar + tecnología (por ciudad) ---------- */
function cmbDisp(f, p) {
  const ros = cmbRoster(f),
    fama = cmbFama(f),
    base = ros.filter((t) => fama >= cmbReq(f, t)),
    ctx = { f, p, motivos: {} };
  /* OC 'unidadesDisponibles': tipos reclutables. ctx {f, p, motivos} (motivos[t] = texto si se bloquea) */
  let ok = OC.calc("unidadesDisponibles", base.slice(), ctx);
  if (!Array.isArray(ok)) ok = base;
  /* la fama militar manda también sobre lo que añada la tecnología */
  const sin = cmbSinTipos(f);
  ok = TYP.filter(
    (t) =>
      ok.includes(t) &&
      !UN[t].asedio &&
      !sin.includes(t) &&
      !(UN[t].caballo && sin.includes("caballos")) &&
      (!ros.includes(t) || fama >= cmbReq(f, t)),
  );
  const bloq = ros
    .filter((t) => !ok.includes(t))
    .map((t) => {
      const m = [];
      if (cmbReq(f, t) > fama) m.push(`Fama ${cmbReq(f, t)}`);
      const tp = p && typeof tecPuedeReclutar === "function" ? tecPuedeReclutar(f, p, t) : null;
      if (ctx.motivos[t]) m.push(ctx.motivos[t]);
      else if (tp && !tp.ok && tp.motivo) m.push(tp.motivo[0].toUpperCase() + tp.motivo.slice(1));
      else if (UN[t].edif && BLD[UN[t].edif] && (!p || (p[UN[t].edif] || 0) < (UN[t].nivel || 1)))
        m.push(`${BLD[UN[t].edif][0]} ${ROM[UN[t].nivel || 1] || "I"}`);
      return { t, motivo: m.join(" · ") || "No disponible" };
    });
  return { ok, bloq };
}
const cmbRes = (s) =>
  `Ataque ${Math.round(s.me * 10) / 10} · Defensa ${Math.round(s.de * 10) / 10} · Armadura ${s.ar}${s.al ? ` · Alcance ${s.al} (${s.mu} descargas)` : ""} · Moral ${Math.round(s.mo)}`;
const cmbHabTexto = (f, t) =>
  cmbHabsDe(f, t)
    .filter((id) => CMB_HAB[id])
    .map((id) => CMB_HAB[id].n)
    .join(", ");
const cmbTip = (f, t) =>
  `${CIV[f].un[t]} (${UN[t].s}). Fuerte: ${cmbInfo(t).fu}. Débil: ${cmbInfo(t).db}. ${cmbRes(cmbStats(f, t, null, "atacante"))}${cmbHabTexto(f, t) ? ". Habilidades: " + cmbHabTexto(f, t) : ""}`;

/* ---------- sección de provincia: reclutar ---------- */
OC.seccion("prov", {
  id: "reclutar",
  orden: 20,
  visible: (c) => c.mine,
  render: ({ p, F }, dis) => {
    cmbNorm(p.u);
    const { ok, bloq } = cmbDisp(ME, p),
      xp = cmbVetDe(p),
      vt = TYP.filter((t) => p.u[t] > 0)
        .map((t) => `${CIV[ME].un[t]}: ${cmbNivelVet(xp[t] || 0).toLowerCase()}`)
        .join(" · ");
    return `<h3>Reclutar <span class="stats">· leva de ${SPU} hombres</span></h3><div class="cmb-rec">${ok
      .map(
        (t) =>
          `<button data-act="rec-${t}" title="${esc(cmbTip(ME, t))}" ${dis || F.gold < cmbCoste(ME, t, p) ? "disabled" : ""}><img src="${icon(ME, t)}" alt="">${CIV[ME].un[t]}<small>${cmbCoste(ME, t, p)} oro</small><i>${cmbInfo(t).tag}</i></button>`,
      )
      .join("")}${bloq
      .map(
        (b) =>
          `<button class="cmb-lock" disabled title="${esc(CIV[ME].un[b.t] + ": " + b.motivo)}"><img src="${icon(ME, b.t)}" alt="">${CIV[ME].un[b.t]}<small>Bloqueado: ${b.motivo}</small></button>`,
      )
      .join("")}</div>${vt ? `<p class="stats cmb-vt">${vt}</p>` : ""}${cmbInstrHtml(p, F, dis)}`;
  },
});
function cmbReclutar(f, p, t) {
  if (!p || p.owner !== f || !UN[t]) return false;
  const F = G.F[f],
    c = cmbCoste(f, t, p);
  if (F.gold < c || !cmbDisp(f, p).ok.includes(t)) return false;
  cmbNorm(p.u);
  cmbLlega(p, { [t]: 1 }, {}, { [t]: p.id });
  F.gold -= c;
  return true;
}
OC.accion("rec", (v) => {
  cmbReclutar(ME, G.P[sel], v);
});

/* ---------- instrucción: el oro también compra oficio (una vez al año, hasta Veteranos) ---------- */
const CMB_INS = { xp: 8, tope: 40, oro: 2 };
const cmbInstrCoste = (p) => Math.max(5, Math.ceil(tot(p.u) * CMB_INS.oro));
function cmbPuedeInstruir(f, p) {
  if (!p || p.owner !== f || !tot(p.u)) return false;
  if ((cmbS().ins || {})[p.id] === G.year) return false;
  const v = cmbVetDe(p);
  return TYP.some((t) => p.u[t] > 0 && (v[t] || 0) < CMB_INS.tope);
}
function cmbInstruir(f, p) {
  const F = G.F[f],
    c = cmbInstrCoste(p);
  if (!cmbPuedeInstruir(f, p) || F.gold < c) return false;
  const S = cmbS(),
    v = { ...cmbVetDe(p) };
  for (const t of TYP)
    if (p.u[t] > 0) v[t] = Math.max(v[t] || 0, Math.min(CMB_INS.tope, (v[t] || 0) + CMB_INS.xp));
  cmbVetFijar(p, v);
  S.ins = S.ins || {};
  S.ins[p.id] = G.year;
  F.gold -= c;
  return true;
}
function cmbInstrHtml(p, F, dis) {
  if (!tot(p.u)) return "";
  const ok = cmbPuedeInstruir(ME, p),
    c = cmbInstrCoste(p);
  return `<div class="btns"><button data-act="cmbins" title="+${CMB_INS.xp} de veteranía a cada clase (máximo: veteranos; la élite solo se gana en batalla)" ${dis || !ok || F.gold < c ? "disabled" : ""}>Instruir tropas · ${c} oro</button><span class="stats">${ok ? "maniobras y ejercicios" : (cmbS().ins || {})[p.id] === G.year ? "ya instruidas este año" : "no aprenden más sin batallas"}</span></div>`;
}
OC.accion("cmbins", () => {
  cmbInstruir(ME, G.P[sel]);
});

/* ---------- informe de batalla (modal y pestaña Ejército) ---------- */
const cmbH = (n) => Math.round(n).toLocaleString("es");
/* bando de cada ejército del informe (los antiguos de dos ejércitos: 0 y 1) */
const cmbInfBando = (inf, s) => (inf.bandos ? inf.bandos[s] : s);
const cmbInfGano = (inf, s) => s >= 0 && cmbInfBando(inf, s) === inf.gana;
function cmbInfHtml(inf, yo) {
  if (!inf) return "";
  const N = inf.f.length,
    ix = [...Array(N).keys()],
    nm = (s) => (yo === s ? "Tus tropas" : CIV[inf.f[s]].s),
    b = inf.bajas,
    m = (v, c) => `<b class="cmb-mb"><i style="width:${clamp(v, 0, 100)}%;background:${c}"></i></b>`,
    alia = (s) => {
      const al = ix.filter((o) => o !== s && cmbInfBando(inf, o) === cmbInfBando(inf, s));
      return al.length ? " (aliados)" : "";
    };
  let h = `<p class="dim">${inf.lugar ? inf.lugar + " · " : ""}${inf.hora}, ${inf.clima} · ${inf.terreno}${inf.fort ? " · murallas " + inf.fort : ""}${inf.flancos > 1 ? " · asalto por " + inf.flancos + " flancos" : ""}${inf.asedio ? " · tras " + inf.asedio + " meses de asedio" : ""}</p>`;
  h += `<p class="stats">${ix
    .map(
      (s) =>
        `<span style="color:${CIV[inf.f[s]].c}">${nm(s)}${N > 2 ? alia(s) : ""}: ${cmbH(inf.n0[s])}</span>`,
    )
    .join(N > 2 ? " · " : " contra ")}</p>`;
  if (inf.rondas.length)
    h += `<ol class="cmb-ron${N > 2 ? " cmb-ronN" : ""}">${inf.rondas
      .map(
        (r) =>
          `<li><span class="cmb-f">${r.f}</span><span>${r.t}</span><span class="cmb-b">${ix.map((s) => "−" + cmbH(r.b[s] || 0)).join(" / ")}</span>${ix.map((s) => m(r.m[s] || 0, CIV[inf.f[s]].c)).join("")}</li>`,
      )
      .join("")}</ol><p class="stats">Por ronda: bajas de cada ejército y moral (barras).</p>`;
  if (inf.factores.length)
    h += `<h3>Factores decisivos</h3><ul class="cmb-fx">${inf.factores.map((x) => `<li class="${cmbInfGano(inf, x.s) ? "good" : "bad"}">${x.txt}</li>`).join("")}</ul>`;
  const bl = (s) =>
    `${nm(s)}: ${cmbH(b[s].m)} muertos, ${cmbH(b[s].h)} heridos (${cmbH(b[s].r)} vuelven a filas)`;
  h += `<p class="stats">${ix.map(bl).join("<br>")}</p>`;
  return h;
}
function cmbGuardarInf(inf) {
  if (!inf || !G.human.some((f) => inf.f.includes(f))) return;
  const S = cmbS();
  S.inf.unshift(inf);
  if (S.inf.length > 8) S.inf.length = 8;
}
OC.accion(
  "cmbinf",
  (v) => {
    const inf = cmbS().inf[+v];
    if (!inf) return false;
    const s = inf.f.indexOf(ME);
    modal(
      `${cmbInfGano(inf, s) ? "Victoria" : s < 0 ? "Batalla" : "Derrota"} en ${inf.lugar || "campo abierto"} (${inf.anio})`,
      cmbInfHtml(inf, s),
      [{ t: "Cerrar", cls: "gold" }],
    );
    return false;
  },
  { libre: true },
);
OC.accion(
  "cmbver",
  (v) => {
    sel = +v;
    tab = "prov";
    aim = 0;
    centerOn(sel);
  },
  { libre: true },
);

/* ---------- mandos: generales y capitanes ----------
   Experiencia en G.C[id]: xp, nivel (1-10), fama. Los capitanes son personajes sin linaje
   (linaje:false, rol:'capitan') que surgen de las filas tras varias victorias sin general. */
const CMB_XPN = [0, 20, 50, 90, 140, 200, 270, 350, 440, 540];
const cmbNivelXp = (xp) => CMB_XPN.filter((v) => (xp || 0) >= v).length;
const CMB_TIT = [
  "",
  "Oficial",
  "Oficial curtido",
  "Tribuno",
  "Tribuno veterano",
  "Prefecto",
  "Comes",
  "Comes ilustre",
  "Dux",
  "Magister",
  "Magister militum",
];
/* API para otros sistemas (social: gobernadores). c = personaje o id */
function cmbNivel(c) {
  if (typeof c === "number") c = G.C[c];
  if (!c) return null;
  const xp = c.xp || 0,
    nivel = cmbNivelXp(xp);
  return {
    nivel,
    xp,
    fama: c.fama || 0,
    sig: CMB_XPN[nivel] ?? null,
    titulo: CMB_TIT[nivel],
    rol: c.rol || (genOf(c) ? "general" : ""),
  };
}
/* suma experiencia y fama; sube de nivel (cada dos niveles, +1 de mando) */
function cmbGanarXp(c, xp, fama) {
  if (!c || c.alive === false) return;
  const n0 = cmbNivelXp(c.xp);
  c.xp = Math.round((c.xp || 0) + xp);
  c.fama = Math.max(0, Math.round(((c.fama || 0) + fama) * 10) / 10);
  c.nivel = cmbNivelXp(c.xp);
  for (let n = n0 + 1; n <= c.nivel; n++) if (n % 2 === 1) c.ma = Math.min(10, (c.ma || 1) + 1);
  if (c.nivel > n0) OC.emitirSync("nivelSube", { c, antes: n0, nivel: c.nivel }); /* OC */
  if (c.nivel > n0 && human(c.f))
    addLog(
      `${c.n} gana renombre en el campo: ${CMB_TIT[c.nivel].toLowerCase()} (nivel ${c.nivel}).`,
      isMe(c.f) ? "good" : "",
    );
}
const CMB_EPI = [
  "el Tuerto",
  "el Bravo",
  "Mano de Hierro",
  "el Joven",
  "el Viejo",
  "el Cuervo",
  "el Rojo",
  "el Callado",
  "Rompescudos",
  "el Lobo",
  "el Cojo",
  "Barba Gris",
  "el Firme",
  "el Hosco",
];
/* de entre las filas surge un capitán (personaje sin linaje) */
function cmbCapitanSurge(f, lugar) {
  if (f == null || f >= REB || typeof mkChar !== "function") return null;
  const c = mkChar(f, "m", ri(24, 38));
  c.n = `${c.n.replace(/ [IVXL]+$/, "")} ${pick(CMB_EPI)}`;
  Object.assign(c, {
    linaje: false,
    rol: "capitan",
    xp: CMB_XPN[1] + ri(0, 15),
    fama: 2,
    ma: Math.max(c.ma, ri(3, 6)),
  });
  c.nivel = cmbNivelXp(c.xp);
  OC.emitirSync("capitanSurge", { c, f, lugar }); /* OC */
  if (human(f))
    addLog(
      `De entre las filas${lugar ? " de " + lugar : ""} surge un capitán: ${c.n}. Sus hombres reconocen su liderazgo.`,
      isMe(f) ? "good" : "",
    );
  return c;
}
/* tras cada batalla: experiencia del general, fama, y quizá un capitán donde no había mando */
OC.on("batallaResuelta", (d) => {
  if (!d || !G) return;
  const S = cmbS(),
    inf = d.informe,
    n = inf ? inf.n0.reduce((a, b) => a + b, 0) : (tot(d.s0 || {}) + tot(d.d0 || {})) * SPU,
    k = clamp(n / 200, 0.5, 2),
    /* batallas de varios ejércitos (d.ejs) o de dos (atacante/defensor) */
    bI = inf && d.multi && inf.f && inf.gens ? inf.bandos || inf.f.map((_, i) => i) : null,
    lados = d.ejs
      ? d.ejs.map((e, i) => ({ gid: e.gen, f: e.f, gana: !!e.gana, def: d.defensor === e.f && i > 0 }))
      : bI /* la emite quien la llama (Campaña) con nuestro informe: un general por ejército */
        ? inf.f.map((f, i) => ({
            gid: inf.gens[i],
            f,
            gana: bI[i] === inf.gana,
            def: inf.def != null ? bI[i] === bI[inf.def] : bI[i] !== bI[0],
          }))
        : [0, 1].map((l) => ({
            gid: l ? d.gD : d.gA,
            f: l ? d.defensor : d.atacante,
            gana: l ? !d.gana : !!d.gana,
            def: l === 1,
          }));
  if (!n) return;
  for (const L of lados) {
    const gid = L.gid,
      f = L.f,
      gana = L.gana,
      lado = L.def ? 1 : 0,
      c = gid != null ? G.C[gid] : null;
    if (c && c.alive !== false) {
      cmbGanarXp(c, (gana ? 22 : 8) * k, gana ? 3 * k : inf && inf.fin === "retirada" ? -3 : -2);
      continue;
    }
    if (!gana || f == null || f >= REB || !d.p) continue;
    const key = f + ":" + d.p.id;
    S.cap = S.cap || {};
    S.cap[key] = (S.cap[key] || 0) + 0.22 + (n > 150 ? 0.08 : 0);
    if (R() < S.cap[key]) {
      S.cap[key] = 0;
      const c2 = cmbCapitanSurge(f, d.p.name);
      if (!c2) continue;
      /* queda al mando de las tropas victoriosas: ya (defensa) o al tomar la plaza (conquista) */
      if (lado === 1 && d.p.owner === f && d.p.gen == null) d.p.gen = c2.id;
      else S.capPend = { p: d.p.id, f, id: c2.id };
    }
  }
});
OC.on("conquista", ({ p, a }) => {
  const S = cmbS(),
    P = S.capPend;
  if (P && P.p === p.id && P.f === a && p.gen == null && G.C[P.id] && G.C[P.id].alive !== false) p.gen = P.id;
  S.capPend = null;
});
/* ascender un capitán a general de carrera */
OC.accion("cmbasc", (v) => {
  const c = G.C[+v];
  if (!c || c.f !== ME || c.alive === false || c.rol !== "capitan") return;
  c.rol = "general";
  c.fama = (c.fama || 0) + 2;
  OC.emitirSync("generalAsciende", { c, f: c.f }); /* OC */
  addLog(`${c.n} es ascendido a general.`, "good");
});
/* renombrar a un mando (si sociedad no ofrece ya la acción) */
if (!OC.acciones.renombrar)
  OC.accion(
    "renombrar",
    async (v) => {
      const c = G.C[+v];
      if (!c || c.f !== ME || c.alive === false) return false;
      let nuevo = null;
      await modal(
        "Renombrar",
        `<p>Nuevo nombre para ${esc(c.n)} (2-30 letras):</p><input id="cmbnom" maxlength="30" value="${esc(c.n)}" aria-label="Nombre">`,
        [{ t: "Aceptar", cls: "gold", fn: () => (nuevo = ($("cmbnom") || {}).value) }, { t: "Cancelar" }],
      );
      const limpio = String(nuevo || "")
        .replace(/<[^>]*>/g, "")
        .replace(/[<>&"'`\\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (limpio.length >= 2 && limpio.length <= 30 && limpio !== c.n) {
        addLog(`${c.n} será conocido en adelante como ${limpio}.`);
        c.n = limpio;
      }
      ui();
      return false;
    },
    { libre: true },
  );
/* lista de mandos del jugador para la pestaña Ejército */
function cmbMandosHtml() {
  const ls = G.C.filter(
    (c) => c.alive !== false && c.f === ME && (c.rol === "capitan" || c.rol === "general" || genOf(c)),
  );
  if (!ls.length) return "";
  return `<h3>Mandos</h3><div class="cmb-mandos">${ls
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .map((c) => {
      const N = cmbNivel(c),
        p = genOf(c),
        ant = CMB_XPN[N.nivel - 1] || 0,
        pr = N.sig == null ? 100 : ((N.xp - ant) / Math.max(1, N.sig - ant)) * 100;
      return `<div class="cmb-man"><div><b>${esc(c.n)}</b> <span class="stats">${c.rol === "capitan" ? "capitán" : "general"} · ${N.titulo} (nivel ${N.nivel}) · mando ${c.ma} · fama ${Math.floor(N.fama)}${p ? " · en " + p.name : ""}</span><b class="cmb-mb"><i style="width:${clamp(pr, 0, 100)}%;background:#f2c14e"></i></b></div><div class="btns"><button data-act="renombrar-${c.id}">Renombrar</button>${c.rol === "capitan" ? `<button data-act="cmbasc-${c.id}">Ascender a general</button>` : ""}</div></div>`;
    })
    .join("")}</div>`;
}

/* ---------- pestaña Ejército ---------- */
OC.panel({
  id: "cmb",
  titulo: "Ejército",
  orden: 15,
  render: () => {
    const S = cmbS(),
      mine = owned(ME).filter((p) => tot(p.u) > 0),
      n = mine.reduce((s, p) => s + tot(p.u), 0),
      fama = cmbFama(ME),
      sig = cmbRoster(ME)
        .filter((t) => cmbReq(ME, t) > fama)
        .sort((a, b) => cmbReq(ME, a) - cmbReq(ME, b))[0];
    let h = `<h2>Ejército</h2><p class="dim">${cmbH(n * SPU)} hombres en ${mine.length} provincias · fama militar ${Math.floor(fama)}${sig ? `<br>Con fama ${cmbReq(ME, sig)}: ${CIV[ME].un[sig]}` : ""}</p>`;
    h += `<h3>Huestes</h3><div class="cmb-hu">${mine
      .sort((a, b) => pw(b.u) - pw(a.u))
      .map((p) => {
        const xp = cmbVetDe(p),
          g = G.C[p.gen];
        return `<button data-act="cmbver-${p.id}"><b>${p.name}</b>${g ? " · " + g.n : ""}<span class="cmb-tr">${TYP.filter(
          (t) => p.u[t] > 0,
        )
          .map(
            (t) =>
              `<span><img src="${icon(ME, t)}" alt="${CIV[ME].un[t]}" title="${CIV[ME].un[t]}">${p.u[t]}</span>`,
          )
          .join(
            "",
          )}</span><span class="stats">${cmbNivelVet(cmbVetMedia(p.u, xp))} · fuerza ${pw(p.u)}</span></button>`;
      })
      .join("")}</div>`;
    h += cmbMandosHtml();
    const inf = S.inf.filter((x) => x.f.includes(ME));
    if (inf.length)
      h += `<h3>Últimas batallas</h3><div class="cmb-hu">${S.inf
        .map((x, i) => {
          if (!x.f.includes(ME)) return "";
          const s = x.f.indexOf(ME),
            w = cmbInfGano(x, s),
            otros = x.f
              .filter((f, i) => i !== s && cmbInfBando(x, i) !== cmbInfBando(x, s))
              .map((f) => CIV[f].s);
          return `<button data-act="cmbinf-${i}" class="${w ? "cmb-w" : "cmb-l"}">${w ? "Victoria" : "Derrota"} · ${x.lugar || "campo abierto"} (${x.anio})<span class="stats">contra ${otros.join(" y ")} · ${x.rondas.length} rondas</span></button>`;
        })
        .join("")}</div>`;
    const cap = G.P[G.F[ME].capId] || null,
      { bloq } = cmbDisp(ME, cap);
    h += `<details class="cmb-cx"><summary>Códex de clases</summary>${cmbRoster(ME)
      .map((t) => {
        const s = cmbStats(ME, t, null, "atacante"),
          lk = bloq.find((b) => b.t === t);
        return `<div class="cmb-cl${lk ? " cmb-off" : ""}"><img src="${icon(ME, t)}" alt=""><div><b>${CIV[ME].un[t]}</b> <span class="stats">${UN[t].s.toLowerCase()} · ${cmbCoste(ME, t, cap)} oro${lk ? " · 🔒︎ " + lk.motivo : ""}</span><br><span class="good">+ ${cmbInfo(t).fu}</span><br><span class="bad">− ${cmbInfo(t).db}</span><br><span class="stats">At ${Math.round(s.me)} · Car ${s.ca} · Def ${Math.round(s.de)} · Arm ${s.ar} · Vel ${s.ve}${s.al ? " · Alc " + s.al : ""}${cmbHabTexto(ME, t) ? "<br>Habilidades: " + cmbHabTexto(ME, t) : ""}</span></div></div>`;
      })
      .join(
        "",
      )}<p class="stats">Las bajas no son instantáneas: el cansancio, las cargas, los flancos y la caída de los vecinos erosionan la moral hasta que una unidad rompe filas. La persecución causa la mayoría de muertos; parte de los heridos vuelve a filas.</p></details>`;
    return h;
  },
});

/* ---------- mantener los datos sanos en todos los caminos ---------- */
OC.on("partidaLista", () => {
  cmbS();
  cmbCivSync();
  cmbNormTodo();
});
OC.on("economiaFaccion", cmbNormTodo);
OC.on("inicioTurno", cmbNormTodo);
OC.on("revuelta", ({ p }) => {
  delete cmbS().vet[p.id];
  delete cmbS().ori[p.id];
});
/* instrucción de guarnición: las tropas que pasan el año acuarteladas ganan algo de oficio (hasta Curtidos) */
OC.on("finAnio", () => {
  cmbNormTodo();
  for (const p of G.P) {
    if (!tot(p.u)) continue;
    const v = { ...cmbVetDe(p) };
    for (const t of TYP) if (p.u[t] > 0 && (v[t] || 0) < 20) v[t] = (v[t] || 0) + 2;
    cmbVetFijar(p, v);
  }
});
