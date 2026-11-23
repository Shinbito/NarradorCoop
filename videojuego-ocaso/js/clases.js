/* ---------- clases de guerreros: catálogo, pueblos, veteranía y reclutamiento ----------
   Sistema de COMBATE. Las estadísticas base de cada clase están en UN (nucleo.js); aquí
   se definen las variantes de cada pueblo, la fama militar que desbloquea las tropas de
   élite, la veteranía persistente (G.cmb.vet) y las pantallas de reclutamiento y ejército. */

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
};
/* Variantes de cada pueblo: t -> [nombre, fama militar necesaria, bono {atk, hp}]. i/a/c existen siempre
   (nombres y bonos en CIV); las demás solo si figuran aquí. La tecnología puede añadir o quitar
   clases con OC.calc('unidadesDisponibles'). */
const CMB_CIV = [
  {
    l: ["Auxiliares", 0],
    p: ["Palatinos", 3, { atk: 1, hp: 1.1 }],
    h: ["Funditores", 0],
    x: ["Exploratores", 0],
    k: ["Catafractarios", 4],
  },
  {
    l: ["Lanceros tracios", 0],
    p: ["Escolas palatinas", 4],
    h: ["Isaurios", 0],
    x: ["Federados hunos", 0, { atk: 1.1, hp: 1 }],
    k: ["Clibanarios", 3, { atk: 1, hp: 1.1 }],
    m: ["Hipotoxotas", 2],
  },
  {
    l: ["Lanceros godos", 0, { atk: 1.1, hp: 1 }],
    p: ["Gardingos", 3, { atk: 1.15, hp: 1 }],
    h: ["Jabalineros", 0],
    k: ["Nobles a caballo", 4, { atk: 1.1, hp: 1 }],
  },
  {
    l: ["Lanceros ostrogodos", 2],
    a: ["Arqueros gépidos", 0],
    x: ["Exploradores esteparios", 0, { atk: 1.15, hp: 1 }],
    k: ["Nobles hunos", 3],
    m: ["Arqueros montados", 0, { atk: 1.2, hp: 1.05 }],
  },
  {
    l: ["Lanceros", 0],
    p: ["Séquito real", 3],
    h: ["Jabalineros moros", 0],
    x: ["Jinetes moros", 0, { atk: 1.1, hp: 1 }],
  },
  {
    l: ["Lanceros francos", 0],
    p: ["Antrustiones", 3, { atk: 1.1, hp: 1.05 }],
    h: ["Lanzadores de angón", 0, { atk: 1.15, hp: 1 }],
  },
  {
    l: ["Lanceros de leva", 0],
    p: ["Dailamitas", 2, { atk: 1.1, hp: 1 }],
    h: ["Honderos", 0],
    x: ["Jinetes árabes", 0],
    k: ["Clibanarios persas", 3, { atk: 1.05, hp: 1.1 }],
    m: ["Arqueros a caballo", 2],
  },
  { l: ["Campesinos armados", 0] },
];
/* nombres y bonos para todas las clases (la interfaz usa CIV[f].un[t] directamente) */
CIV.forEach((c, f) => {
  const r = CMB_CIV[f] || {};
  for (const t of TYP) {
    if (r[t]) c.un[t] = r[t][0];
    else if (!c.un[t]) c.un[t] = UN[t].s;
    if (!c.bon[t]) c.bon[t] = (r[t] && r[t][2]) || { atk: 1, hp: 1 };
  }
});
const CMB_BASE = ["i", "a", "c"];
/* tecnología solo añade clases a los pueblos que las tienen en su repertorio */
for (const t of TYP)
  if (!CMB_BASE.includes(t)) UN[t].civs = CMB_CIV.map((r, f) => (r[t] ? f : -1)).filter((f) => f >= 0);
const cmbRoster = (f) => TYP.filter((t) => CMB_BASE.includes(t) || (CMB_CIV[f] || {})[t]);
const cmbReq = (f, t) => ((CMB_CIV[f] || {})[t] || [])[1] || 0;

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
const cmbNivel = (xp) => CMB_NIV.filter((n) => xp >= n[0]).pop()[1];
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
  ok = TYP.filter((t) => ok.includes(t) && (!ros.includes(t) || fama >= cmbReq(f, t)));
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
const cmbTip = (f, t) =>
  `${CIV[f].un[t]} (${UN[t].s}). Fuerte: ${CMB_INFO[t].fu}. Débil: ${CMB_INFO[t].db}. ${cmbRes(cmbStats(f, t, null, "atacante"))}`;

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
        .map((t) => `${CIV[ME].un[t]}: ${cmbNivel(xp[t] || 0).toLowerCase()}`)
        .join(" · ");
    return `<h3>Reclutar <span class="stats">· leva de ${SPU} hombres</span></h3><div class="cmb-rec">${ok
      .map(
        (t) =>
          `<button data-act="rec-${t}" title="${esc(cmbTip(ME, t))}" ${dis || F.gold < cmbCoste(ME, t, p) ? "disabled" : ""}><img src="${icon(ME, t)}" alt="">${CIV[ME].un[t]}<small>${cmbCoste(ME, t, p)} oro</small><i>${CMB_INFO[t].tag}</i></button>`,
      )
      .join("")}${bloq
      .map(
        (b) =>
          `<button class="cmb-lock" disabled title="${esc(CIV[ME].un[b.t] + ": " + b.motivo)}"><img src="${icon(ME, b.t)}" alt="">${CIV[ME].un[b.t]}<small>🔒 ${b.motivo}</small></button>`,
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
function cmbInfHtml(inf, yo) {
  if (!inf) return "";
  const nm = (s) => (yo === s ? "Tus tropas" : CIV[inf.f[s]].s),
    b = inf.bajas,
    m = (v, c) => `<b class="cmb-mb"><i style="width:${clamp(v, 0, 100)}%;background:${c}"></i></b>`;
  let h = `<p class="dim">${inf.lugar ? inf.lugar + " · " : ""}${inf.hora}, ${inf.clima} · ${inf.terreno}${inf.fort ? " · murallas " + inf.fort : ""}${inf.asedio ? " · tras " + inf.asedio + " meses de asedio" : ""}</p>`;
  h += `<p class="stats"><span style="color:${CIV[inf.f[0]].c}">${nm(0)}: ${cmbH(inf.n0[0])}</span> contra <span style="color:${CIV[inf.f[1]].c}">${nm(1)}: ${cmbH(inf.n0[1])}</span></p>`;
  if (inf.rondas.length)
    h += `<ol class="cmb-ron">${inf.rondas
      .map(
        (r) =>
          `<li><span class="cmb-f">${r.f}</span><span>${r.t}</span><span class="cmb-b">−${cmbH(r.b[0])} / −${cmbH(r.b[1])}</span>${m(r.m[0], CIV[inf.f[0]].c)}${m(r.m[1], CIV[inf.f[1]].c)}</li>`,
      )
      .join("")}</ol><p class="stats">Por ronda: bajas de cada bando y moral (barras).</p>`;
  if (inf.factores.length)
    h += `<h3>Factores decisivos</h3><ul class="cmb-fx">${inf.factores.map((x) => `<li class="${x.s === inf.gana ? "good" : "bad"}">${x.txt}</li>`).join("")}</ul>`;
  const bl = (s) =>
    `${nm(s)}: ${cmbH(b[s].m)} muertos, ${cmbH(b[s].h)} heridos (${cmbH(b[s].r)} vuelven a filas)`;
  h += `<p class="stats">${bl(0)}<br>${bl(1)}</p>`;
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
      `${inf.gana === s ? "Victoria" : s < 0 ? "Batalla" : "Derrota"} en ${inf.lugar || "campo abierto"} (${inf.anio})`,
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
          )}</span><span class="stats">${cmbNivel(cmbVetMedia(p.u, xp))} · fuerza ${pw(p.u)}</span></button>`;
      })
      .join("")}</div>`;
    const inf = S.inf.filter((x) => x.f.includes(ME));
    if (inf.length)
      h += `<h3>Últimas batallas</h3><div class="cmb-hu">${S.inf
        .map((x, i) => {
          if (!x.f.includes(ME)) return "";
          const s = x.f.indexOf(ME),
            w = x.gana === s;
          return `<button data-act="cmbinf-${i}" class="${w ? "cmb-w" : "cmb-l"}">${w ? "Victoria" : "Derrota"} · ${x.lugar || "campo abierto"} (${x.anio})<span class="stats">contra ${CIV[x.f[1 - s]].s} · ${x.rondas.length} rondas</span></button>`;
        })
        .join("")}</div>`;
    const cap = G.P[G.F[ME].capId] || null,
      { bloq } = cmbDisp(ME, cap);
    h += `<details class="cmb-cx"><summary>Códex de clases</summary>${cmbRoster(ME)
      .map((t) => {
        const s = cmbStats(ME, t, null, "atacante"),
          lk = bloq.find((b) => b.t === t);
        return `<div class="cmb-cl${lk ? " cmb-off" : ""}"><img src="${icon(ME, t)}" alt=""><div><b>${CIV[ME].un[t]}</b> <span class="stats">${UN[t].s.toLowerCase()} · ${cmbCoste(ME, t, cap)} oro${lk ? " · 🔒 " + lk.motivo : ""}</span><br><span class="good">+ ${CMB_INFO[t].fu}</span><br><span class="bad">− ${CMB_INFO[t].db}</span><br><span class="stats">At ${Math.round(s.me)} · Car ${s.ca} · Def ${Math.round(s.de)} · Arm ${s.ar} · Vel ${s.ve}${s.al ? " · Alc " + s.al : ""}</span></div></div>`;
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
