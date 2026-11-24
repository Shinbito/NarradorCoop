/* ---------- narrativa ----------
   Sistema de NARRATIVA: vida de la corte, eventos con memoria, crónica, legado y epílogo.
   Estado en G.nar = {v, m: marcas del mundo, f: {[facción]: registro}} (ver docs/narrativa.md).
   Los arcos históricos, el prólogo, los hechos menores y el epílogo están en js/historia.js. */

/* ---------- vida de la corte ---------- */
function life() {
  for (const c of G.C) {
    if (!c.alive) continue;
    c.age++;
    let pd = c.age < 5 ? 0.02 : c.age < 40 ? 0.008 : c.age < 55 ? 0.025 : c.age < 65 ? 0.06 : 0.14;
    if (c.tr === "Enfermizo") pd *= 2;
    if (R() < pd) {
      kill(c, c.age < 6 ? "muere en la infancia" : narMuerteNatural(c));
      continue;
    }
    if (c.age === 16 && isMe(c.f)) addLog(narMayoria(c));
  }
  for (const c of G.C.slice()) {
    if (!c.alive || c.sex !== "f" || c.sp == null) continue;
    const h = G.C[c.sp];
    if (!h.alive || h.f !== c.f || c.age < 16 || c.age > 42) continue;
    if (kidsOf(c).length < 6 && R() < 0.26) {
      const k = mkChar(c.f, R() < 0.5 ? "m" : "f", 0, h.id, c.id);
      if (isMe(c.f)) addLog(narNacimiento(k, h, c), "good");
      autoHeir(c.f);
    }
  }
  for (let f = 0; f < NF; f++) {
    if (!alive(f)) continue;
    autoHeir(f);
    if (human(f)) continue;
    for (const c of family(f))
      if (c.sp == null && c.age >= 18 && c.age <= 40 && R() < 0.2)
        marry(c, mkChar(f, c.sex === "m" ? "f" : "m", clamp(c.age + ri(-4, 2), 16, 45)));
  }
}
function narMuerteNatural(c) {
  if (c.age >= 60)
    return pick(["muere de causas naturales", "muere en paz, rodeado de los suyos", "se apaga en su lecho"]);
  return pick(["muere de causas naturales", "muere de unas fiebres", "muere tras una breve enfermedad"]);
}
function narMayoria(c) {
  return c.sex === "m"
    ? pick([
        `${c.n} cumple dieciséis años y ciñe por primera vez la espada.`,
        `${c.n} alcanza la mayoría de edad; ya cabalga con la guardia.`,
        `${c.n} cumple dieciséis años. Los nobles empiezan a medir su ambición.`,
      ])
    : pick([
        `${c.n} cumple dieciséis años; en la corte ya se habla de su boda.`,
        `${c.n} alcanza la mayoría de edad. Más de un embajador pregunta por ella.`,
      ]);
}
function narNacimiento(k, h, c) {
  const hj = k.sex === "m" ? "hijo" : "hija";
  return pick([
    `Nace ${k.n}, ${hj} de ${h.n} y ${c.n}.`,
    `Nace ${k.n}, ${hj} de ${h.n} y ${c.n}. La comadrona dice que tiene buenos pulmones.`,
    `${c.n} da a luz a ${k.n}, ${hj} de ${h.n}. Se celebra con pan y vino para la guardia.`,
  ]);
}

/* ---------- utilidades de eventos ---------- */
const capOf = (f) => (G.P[G.F[f].capId].owner === f ? G.P[G.F[f].capId] : owned(f)[0]);
const narFe = (f) =>
  (typeof socConvertir !== "function" && f < NF && G && G.nar && G.nar.f && G.nar.f[f] && G.nar.f[f].fe) ||
  CIV[f].rel;
/* impulsos a los estamentos de sociedad (si existe): narSoc(f, {cle: 5, pue: -3}) */
const narSoc = (f, o) => typeof socImp === "function" && socImp(f, o);
const narCristiano = (f) => narFe(f) === "niceno" || narFe(f) === "arriano";
function relig(f, a, b, v = 15) {
  for (let g = 0; g < NF; g++) {
    if (g === f) continue;
    if (narFe(g) === a) relAdd(f, g, v);
    if (narFe(g) === b) relAdd(f, g, -v);
  }
  owned(f).forEach(
    (p) => (p.order = clamp(p.order + (narFe(f) === a ? 6 : narFe(f) === b ? -6 : 0), 0, 100)),
  );
}
const relFe = (f, fe, v) => {
  for (let g = 0; g < NF; g++) if (g !== f && alive(g) && narFe(g) === fe) relAdd(f, g, v);
};
const NAR_ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const NAR_ST = { ma: "mando", in: "intriga", di: "diplomacia", ge: "gestión" };
const NAR_LEG = [
  { k: "pi", n: "Piedad", c: "#d9c27c", ap: ["el Piadoso", "la Piadosa"] },
  { k: "gl", n: "Gloria", c: "#e0503f", ap: ["el Grande", "la Grande"] },
  { k: "cr", n: "Temor", c: "#9b6ad6", ap: ["el Terrible", "la Terrible"] },
  { k: "sa", n: "Sabiduría", c: "#4fa3d9", ap: ["el Sabio", "la Sabia"] },
];
const narVal = (v, c, ...a) => (typeof v === "function" ? v(c, ...a) : v);
const narPlano = (s) => String(s == null ? "" : s).replace(/<[^>]+>/g, "");
const narEl = (c) => (c && c.sex === "f" ? "la" : "el");
const narO = (c, o = "o", a = "a") => (c && c.sex === "f" ? a : o);
const narTit = (c) => (c ? `${narEl(c)} ${ttl(c).toLowerCase()} ${c.n}` : "el soberano");
/* «el pueblo visigodo», «el Imperio de Oriente»: siempre en singular. Por id (CIV[f].id); los pueblos
   nuevos traen su frase en CIV[f].pueblo */
const NAR_PUEBLO = {
  occ: "el Imperio de Occidente",
  ori: "el Imperio de Oriente",
  vis: "el pueblo visigodo",
  hun: "el pueblo huno",
  van: "el pueblo vándalo",
  fra: "el pueblo franco",
  per: "la Persia sasánida",
  reb: "los rebeldes",
};
const narId0 = (f) => (CIV[f] && CIV[f].id) || "";
const narPueblo = (f) =>
  (CIV[f] && (CIV[f].pueblo || NAR_PUEBLO[CIV[f].id] || CIV[f].n)) || "un pueblo extraño";
const narEs = (f, ...ids) => ids.includes(narId0(f));
/* modos de juego (mundo): los arcos del 410 solo en el histórico; los de leyenda solo en leyendas */
const narLey = () => !!(G && G.modo === "leyendas");
const narAmerica = (f) => narEs(f, "inc", "may", "azt");
const narPuedeT = (f, t) =>
  (typeof civPuede === "function" ? civPuede(f, t) : true) && !(UN[t] && UN[t].merc);
/* pulido de la prosa: mayúscula al empezar frase y contracciones «de el» → «del», «a el» → «al» */
function narFrase(s) {
  return String(s == null ? "" : s)
    .replace(/\b([Dd])e el\b/g, "$1el")
    .replace(/\b([Aa]) el\b/g, "$1l")
    .replace(
      /(^|(?<!\.)(?:\.»?|[?!])\s+)((?:<[^>]+>)?)([a-záéíóúñ])/g,
      (m, a, t, l) => a + t + l.toUpperCase(),
    );
}
const narB = (c) => (c ? `<b>${c.n}</b>` : "");
const narStat = (ch, k, n) =>
  !ch ? "nadie puede hacerlo" : ch[k] >= n || `requiere ${NAR_ST[k]} ${n} (${ch.n} tiene ${ch[k]})`;
const narReq = (cond, msg) => !!cond || msg;
/* adultos de la casa (sin capitanes ni generales de carrera, que no tienen linaje) */
const narAdultos = (f, fn = () => true) =>
  family(f).filter((x) => x.age >= 16 && x.id !== G.F[f].ruler && x.linaje !== false && fn(x));
const narHijos = (f) => kidsOf(ruler(f)).filter((x) => x.alive && x.f === f);
const narEnemigos = (f) =>
  [...Array(NF).keys()].filter((g) => g !== f && alive(g) && G.st[f][g] === "guerra");
const narVecinos = (f) => [...Array(NF).keys()].filter((g) => g !== f && alive(g) && G.st[f][g] !== "guerra");
function narPeso(lista, w) {
  let s = 0;
  const ws = lista.map((x) => {
    const v = Math.max(0, +w(x) || 0);
    s += v;
    return v;
  });
  if (!s) return null;
  let k = R() * s;
  for (let i = 0; i < lista.length; i++) {
    k -= ws[i];
    if (k <= 0 && ws[i] > 0) return lista[i];
  }
  return lista[ws.findIndex((v) => v > 0)];
}
/* origen de un personaje casado con otra corte: por la lista de nombres de cada pueblo */
function narOrigen(ch) {
  const base = String(ch.n).split(" ")[0],
    tiene = (g) => CIV[g].m.includes(base) || CIV[g].f.includes(base);
  if (tiene(ch.f)) return -1;
  for (let g = 0; g < NF; g++) if (g !== ch.f && tiene(g)) return g;
  return -1;
}
function narRol(ch, f = ch.f) {
  const F = G.F[f];
  if (!F) return "";
  if (ch.id === F.ruler) return ttl(ch);
  if (ch.linaje === false)
    return ch.rol === "general" ? "general de carrera" : ch.rol === "gobernador" ? "gobernador" : "capitán";
  if (ch.id === F.heir) return narO(ch, "heredero", "heredera");
  if (genOf(ch)) return "general en " + genOf(ch).name;
  if (ruler(f) && ch.id === ruler(f).sp) return "consorte";
  if (ruler(f) && (ch.fa === F.ruler || ch.mo === F.ruler)) return narO(ch, "hijo", "hija") + " del soberano";
  return ch.age < 16 ? "menor de la casa" : narO(ch, "noble", "dama") + " de la corte";
}
function narFicha(ch, f) {
  return `<div class="nar-pj"><div class="hd"><b>${ch.n}</b><span class="tag">${narRol(ch, f)}</span></div><span class="stats">${ch.age} años · Mando ${ch.ma} · Intriga ${ch.in} · Diplomacia ${ch.di} · Gestión ${ch.ge} · ${ch.tr}</span></div>`;
}

/* ---------- estado (G.nar) ---------- */
function narNuevo() {
  return {
    arc: {},
    mk: {},
    dec: [],
    cron: [],
    leg: { pi: 0, gl: 0, cr: 0, sa: 0 },
    lr: { pi: 0, gl: 0, cr: 0, sa: 0 },
    cola: [],
    vis: {},
    ef: [],
    hx: {},
    reyes: [],
    rey: null,
    vivos: [],
    sp: null,
    her: null,
    st: null,
    my: 0,
    mn: 0,
    ini: 0,
    epi: null,
    vic: 0,
    per: 0,
    bat: 0,
    maxP: 0,
    fe: null,
  };
}
const narS = () => (G ? OC.estado("nar", () => ({ v: 1, m: {}, f: {} })) : null);
function narF(f) {
  const S = narS();
  if (!S.f) S.f = {};
  return S.f[f] || (S.f[f] = narNuevo());
}
function narInit() {
  const S = narS();
  if (!S) return;
  S.m = S.m || {};
  S.f = S.f || {};
  for (let f = 0; f < NF; f++) {
    if (!G.F[f] || G.F[f].ausente) continue;
    const N = narF(f),
      d = narNuevo();
    for (const k in d) if (N[k] === undefined) N[k] = d[k];
    for (const L of NAR_LEG) {
      if (typeof N.leg[L.k] !== "number") N.leg[L.k] = 0;
      if (typeof N.lr[L.k] !== "number") N.lr[L.k] = 0;
    }
    if (N.rey == null) {
      N.rey = G.F[f].ruler;
      const r = G.C[N.rey];
      if (r) N.reyes.push({ id: r.id, n: r.n, t: ttl(r), d: G.year, h: null, ap: "" });
    }
    if (!N.st) narFoto(f);
  }
  /* partidas guardadas antiguas: ya empezadas, sin prólogo */
  if (G.year > 410) for (let f = 0; f < NF; f++) if (G.F[f]) narF(f).ini = 1;
}
function narFoto(f) {
  const N = narF(f),
    F = G.F[f],
    r = G.C[F.ruler];
  N.vivos = family(f).map((c) => c.id);
  N.sp = r && r.sp != null ? r.sp : null;
  N.her = F.heir;
  N.st = G.st[f].slice();
}
function narHecho(N, k, anos = 2) {
  if (N.hx[k] != null && G.year - N.hx[k] <= anos) return true;
  N.hx[k] = G.year;
  return false;
}

/* ---------- marcas, legado e influjos ---------- */
function narMk(f, k, v = G.year) {
  narF(f).mk[k] = v;
}
const narTiene = (f, k) => narF(f).mk[k] != null;
const narDesde = (f, k) => (narTiene(f, k) ? G.year - narF(f).mk[k] : 999);
/* la marca existe y tiene al menos n años */
const narHace = (f, k, n) => narTiene(f, k) && narDesde(f, k) >= n;
function narQuita(f, k) {
  delete narF(f).mk[k];
}
const narMundo = () => narS().m;
function narLeg(f, d) {
  if (f == null || f >= NF) return;
  const N = narF(f);
  for (const k in d) {
    if (!(k in N.leg)) continue;
    N.leg[k] = clamp(Math.round(N.leg[k] + d[k]), 0, 100);
    N.lr[k] = (N.lr[k] || 0) + d[k];
  }
}
/* influjos temporales: k = orden | oro | comida | batalla | invest | diplo */
function narEf(f, k, v, anos, t, p = null, lado = null) {
  const N = narF(f);
  N.ef = N.ef.filter((e) => e.t !== t);
  N.ef.push({ k, v, h: G.year + anos, t, p, lado });
}
function narEfQuita(f, t) {
  const N = narF(f);
  N.ef = N.ef.filter((e) => e.t !== t);
}
function narEfSum(f, k, p) {
  let s = 0;
  for (const e of narF(f).ef) if (e.k === k && e.h >= G.year && (e.p == null || e.p === p)) s += e.v;
  return s;
}
function narOrden(f, v, p) {
  (p ? [p] : owned(f)).forEach((q) => {
    if (q && q.owner === f) q.order = clamp(Math.round(q.order + v), 0, 100);
  });
}
/* dar o quitar tropas: nunca mercenarias y solo clases que el pueblo puede tener (si no, infantería) */
function narTropa(p, t, v) {
  if (!p) return;
  if (v > 0 && p.owner < NF && !narPuedeT(p.owner, t))
    t = narPuedeT(p.owner, "i") ? "i" : TYP.find((k) => narPuedeT(p.owner, k));
  if (!t) return;
  p.u[t] = Math.max(0, (p.u[t] || 0) + v);
}
function narSanear() {
  for (const p of G.P) {
    p.order = clamp(Math.round(p.order), 0, 100);
    for (const t of TYP) p.u[t] = Math.max(0, p.u[t] | 0);
  }
}
function narApodo(f, ch, reg) {
  if (!ch) return "";
  const N = narF(f);
  const lr = reg && reg.id === N.rey ? N.lr : reg && reg.lr ? reg.lr : N.lr;
  let best = null;
  for (const L of NAR_LEG) if ((lr[L.k] || 0) >= 10 && (!best || lr[L.k] > lr[best.k])) best = L;
  if (best) return best.ap[ch.sex === "f" ? 1 : 0];
  const anos = reg ? (reg.h ?? G.year) - reg.d : 9;
  return reg && reg.h != null && anos < 3 ? narO(ch, "el Breve", "la Breve") : "";
}
/* legado y apodo legibles por otros sistemas */
function narLegado(f) {
  return G && G.nar && G.nar.f && G.nar.f[f] ? { ...G.nar.f[f].leg } : { pi: 0, gl: 0, cr: 0, sa: 0 };
}
function narApodoActual(f) {
  const N = narF(f);
  return narApodo(f, ruler(f), N.reyes[N.reyes.length - 1]);
}

/* el legado influye moderadamente en los cálculos de los demás sistemas */
OC.mod(
  "ordenObjetivo",
  (v, { p, f }) => {
    if (!G || !G.nar || f == null || f >= NF) return;
    const L = narF(f).leg;
    return (
      v + Math.round(L.pi * 0.04 + L.cr * (p && p.recent ? 0.06 : 0.015) + narEfSum(f, "orden", p && p.id))
    );
  },
  20,
);
OC.mod(
  "rendimiento",
  (y, { p, f }) => {
    if (!G || !G.nar || f == null || f >= NF || !p || p !== capOf(f)) return;
    const g = narEfSum(f, "oro"),
      fo = narEfSum(f, "comida");
    if (!g && !fo) return;
    return { ...y, g: Math.max(0, y.g + g), fo: Math.max(0, y.fo + fo) };
  },
  20,
);
OC.mod(
  "bonoBatalla",
  (m, { f, lado }) => {
    if (!G || !G.nar || f == null || f >= NF) return;
    const N = narF(f);
    let b = N.leg.gl * 0.0006;
    for (const e of N.ef) if (e.k === "batalla" && e.h >= G.year && (!e.lado || e.lado === lado)) b += e.v;
    return m * (1 + b);
  },
  20,
);
OC.mod(
  "puntosInvestigacion",
  (n, { f }) => {
    if (!G || !G.nar || f == null || f >= NF) return;
    return n * (1 + narF(f).leg.sa * 0.0015 + narEfSum(f, "invest"));
  },
  20,
);
OC.mod(
  "aceptacionDiplomatica",
  (pr, { f, g, tipo }) => {
    if (!G || !G.nar || f == null || f >= NF) return;
    const N = narF(f);
    let d = -N.leg.cr * 0.001 + narEfSum(f, "diplo");
    if (tipo === "peace") d += N.leg.gl * 0.0008;
    if (g != null && g < NF && narFe(g) === narFe(f)) d += N.leg.pi * 0.0006;
    if (narDesde(f, "perjuro") < 10) d -= 0.06;
    return clamp(pr + d, 0, 1);
  },
  20,
);

/* ---------- crónica ---------- */
function narCron(f, m, cls = "nar-dec", sinLog = false) {
  const N = narF(f);
  m = narFrase(m);
  N.cron.push({ y: G.year, m: narPlano(m), c: cls });
  if (N.cron.length > 80) N.cron.shift();
  if (isMe(f) && !sinLog) addLog(m, cls);
}
function narMenor(f) {
  if (!isMe(f) || R() > 0.55 || typeof NAR_MENORES === "undefined") return;
  const c = narCtx(f);
  for (let k = 0; k < 6; k++) {
    const t = pick(NAR_MENORES)(c);
    if (t) return addLog(narFrase(t), "nar-rumor");
  }
}

/* ---------- motor de eventos ---------- */
function narCtx(f, d = {}) {
  const F = G.F[f],
    r = ruler(f),
    own = owned(f);
  const sp = r && r.sp != null && G.C[r.sp] && G.C[r.sp].alive ? G.C[r.sp] : null;
  const h = F.heir != null && G.C[F.heir] && G.C[F.heir].alive ? G.C[F.heir] : null;
  return { f, F, r, sp, h, own, p: pick(own), cap: capOf(f), d, y: G.year, N: narF(f), pj: null };
}
function narOpciones(ev, c) {
  const xs = (ev.o || [])
    .map((o) => (Array.isArray(o) ? { t: o[0], ef: o[1] } : o))
    .filter((o) => !o.vis || o.vis(c))
    .map((o) => {
      const coste = narVal(o.coste, c) || null;
      let why = o.req ? o.req(c) : true;
      if (why === true && coste && !OC.puedePagar(c.f, coste)) why = "no tienes " + OC.textoCoste(coste);
      const p = o.prob == null ? null : clamp(narVal(o.prob, c), 0.05, 0.95);
      return { o, coste, p, why: why === true ? null : why || "no es posible" };
    });
  if (!xs.some((x) => !x.why))
    xs.push({ o: { t: "Dejar que el tiempo decida", ef: () => "" }, coste: null, p: null, why: null });
  return xs;
}
const narLegTxt = (d) =>
  Object.keys(d)
    .filter((k) => d[k])
    .map((k) => `${d[k] > 0 ? "+" : "−"}${NAR_LEG.find((l) => l.k === k).n.toLowerCase()}`)
    .join(" ");
function narEtiqueta(x, c) {
  const o = x.o,
    sm = [];
  if (x.coste) sm.push(OC.textoCoste(x.coste));
  const tip = narVal(o.tip, c);
  if (tip) sm.push(tip);
  if (x.p != null) sm.push(`≈${Math.round(x.p * 100)}%${o.px ? " " + narVal(o.px, c) : ""}`);
  if (o.leg) sm.push(narLegTxt(o.leg));
  if (x.why) sm.push("✕ " + x.why);
  return `${narVal(o.t, c)}${sm.length ? `<small>${sm.join(" · ")}</small>` : ""}`;
}
function narAplicar(c, x) {
  const o = x.o,
    t = [],
    ad = (s) => s && t.push(s);
  if (x.coste) OC.pagar(c.f, x.coste);
  ad(o.ef && o.ef(c));
  let ok = null;
  if (x.p != null) {
    ok = R() < x.p;
    ad(ok ? o.si && o.si(c) : o.no && o.no(c));
  }
  if (o.leg) narLeg(c.f, o.leg);
  if (o.mk) [].concat(narVal(o.mk, c, ok)).forEach((k) => k && narMk(c.f, k));
  narSanear();
  return { txt: t.join(" "), ok };
}
function narDecision(c, ev, tit, x, out, meta) {
  const N = narF(c.f),
    op = narPlano(narVal(x.o.t, c));
  if (ev.id) N.vis[ev.id] = G.year;
  N.dec.push({ y: G.year, t: narPlano(tit), o: op, r: out.ok, a: meta.arc || null });
  if (N.dec.length > 40) N.dec.shift();
  const cr = narVal(x.o.cr, c, out.ok) || `${narPlano(tit)}: ${op.charAt(0).toLowerCase() + op.slice(1)}.`;
  const suerte = out.ok === true ? " La fortuna acompañó." : out.ok === false ? " La fortuna se torció." : "";
  narCron(c.f, cr + suerte, meta.arc ? "nar-cap" : "nar-dec");
}
/* evento para el jugador local: modal con opciones condicionadas y, si hay azar, desenlace */
async function runEvent(ev, d = {}, meta = {}) {
  if (!G || !alive(ME)) return false;
  const c = narCtx(ME, d);
  Object.assign(c, meta.ctx || {});
  if (ev.prep && ev.prep(c) === false) return false;
  if (ev.al) ev.al(c);
  const xs = narOpciones(ev, c),
    tit = narVal(ev.t, c),
    kick = meta.kick || `Año ${G.year}${ev.k ? " · " + ev.k : ""}`;
  const html = `<div class="nar-ev"><p class="nar-kick">${kick}</p>${c.pj ? narFicha(c.pj, c.f) : ""}<p>${narFrase(narVal(ev.d, c))}</p></div>`;
  let el = null,
    out = null;
  await modal(
    tit,
    html,
    xs.map((x) => ({
      t: narEtiqueta(x, c),
      cls: "nar-op",
      dis: !!x.why,
      fn: () => {
        el = x;
        out = narAplicar(c, x);
      },
    })),
  );
  if (!el) return true;
  narDecision(c, ev, tit, el, out, meta);
  const extra = meta.tras ? meta.tras(c, el, out) : null;
  const txt = [out.txt, extra].filter(Boolean).join("</p><p>");
  if (txt && (el.p != null || el.o.ver || extra)) {
    const kk = extra
      ? "Fin de la historia"
      : el.p == null
        ? "Lo que siguió"
        : out.ok
          ? "La fortuna sonríe"
          : "La fortuna se tuerce";
    await modal(tit, `<div class="nar-res"><p class="nar-kick">${kk}</p><p>${narFrase(txt)}</p></div>`, [
      { t: "Así quedará escrito", cls: "gold" },
    ]);
  }
  return true;
}
/* la IA resuelve el mismo evento sin modal, según los rasgos de su soberano */
function narAuto(f, ev, d = {}) {
  const c = narCtx(f, d);
  if (ev.prep && ev.prep(c) === false) return null;
  if (ev.al) ev.al(c);
  const r = c.r,
    xs = narOpciones(ev, c).filter((x) => !x.why);
  const x = narPeso(xs, (x) => {
    let w = narVal(x.o.ia, c) ?? 1;
    const L = x.o.leg || {};
    if (L.pi > 0 && r.tr === "Piadoso") w *= 3;
    if (L.cr > 0 && r.tr === "Cruel") w *= 3;
    if (L.gl > 0 && (r.tr === "Valiente" || r.tr === "Ambicioso")) w *= 2;
    if (L.sa > 0 && (r.tr === "Prudente" || r.tr === "Elocuente")) w *= 2;
    if (x.p != null) w *= 0.5 + x.p;
    return w;
  });
  if (!x) return null;
  const out = narAplicar(c, x),
    N = narF(f);
  if (ev.id) N.vis[ev.id] = G.year;
  N.dec.push({ y: G.year, t: narPlano(narVal(ev.t, c)), o: narPlano(narVal(x.o.t, c)), r: out.ok });
  if (N.dec.length > 20) N.dec.shift();
  if (alive(ME) && !isMe(f) && R() < 0.6) {
    const nt = narVal(x.o.nt, c) || narVal(ev.nt, c, x.o);
    if (nt) addLog(nt, "nar-rumor");
  }
  return x;
}
const narEv = (id) => EVENTS.find((e) => e.id === id);
/* y: año mínimo, hasta: año máximo (partidas largas: el contenido se despliega por épocas) */
const narLibre = (N, e) =>
  (!e.hist || !narLey()) &&
  (!e.ley || narLey()) &&
  (!e.y || G.year >= e.y) &&
  (!e.hasta || G.year <= e.hasta) &&
  (!N.vis[e.id] || (!e.una && G.year - N.vis[e.id] >= (e.cd ?? 8)));
function narEncolar(f, e, d = {}, tras = 0) {
  if (f == null || f >= NF || !G.F[f] || !human(f)) return;
  const N = narF(f),
    k = e + ":" + JSON.stringify(d);
  if (N.cola.some((q) => q.k === k)) return;
  N.cola.push({ e, d, y: G.year + tras, k });
  if (N.cola.length > 8) N.cola.shift();
}
async function narProcesarCola(f, prioMin = 0) {
  const N = narF(f);
  N.cola = N.cola.filter((q) => G.year - q.y <= 3);
  const listos = N.cola
    .filter((q) => q.y <= G.year && (narEv(q.e)?.prio || 5) >= prioMin)
    .sort((a, b) => (narEv(b.e)?.prio || 5) - (narEv(a.e)?.prio || 5));
  for (const q of listos) {
    N.cola.splice(N.cola.indexOf(q), 1);
    const ev = narEv(q.e);
    if (ev && (await runEvent(ev, q.d))) return true;
  }
  return false;
}
/* consecuencias encadenadas: eventos que solo aparecen si una marca anterior lo permite */
async function narCadena(f) {
  const c = narCtx(f),
    N = narF(f);
  const ls = EVENTS.filter((e) => e.ch && narLibre(N, e) && (!e.ok || e.ok(c)));
  for (const ev of ls) if (await runEvent(ev)) return true;
  return false;
}
async function narAzar(f) {
  const c = narCtx(f),
    N = narF(f);
  let ls = EVENTS.filter((e) => !e.re && !e.ch && narLibre(N, e) && (!e.ok || e.ok(c)));
  for (let k = 0; k < 4 && ls.length; k++) {
    const ev = narPeso(ls, (e) => narVal(e.peso, c) ?? 1);
    if (!ev) break;
    if (await runEvent(ev)) return true;
    ls = ls.filter((e) => e !== ev);
  }
  return false;
}

/* ---------- arcos (capítulos en js/historia.js) ---------- */
const narArcos = () => (typeof NAR_ARCOS === "undefined" ? [] : NAR_ARCOS);
/* hist: solo modo histórico (los del 410); ley: solo mundo de leyendas */
const narArcoValido = (a) => !((a.hist && narLey()) || (a.ley && !narLey()));
function narCapPendiente(f) {
  const N = narF(f),
    c = narCtx(f);
  let best = null;
  for (const arc of narArcos()) {
    let A = N.arc[arc.id];
    if (A && A.fin) continue;
    if (!narArcoValido(arc)) continue;
    if (!A && !arc.para(f)) continue;
    c.arc = arc;
    c.A = A;
    const cap = arc.caps[A ? A.i : 0];
    if (!cap) {
      if (A) narFinArco(f, arc, A, narVal(arc.finDef, c) || "fin");
      continue;
    }
    if (cap.y && G.year < cap.y) continue;
    if (A && G.year - A.y < (cap.tras ?? 2)) continue;
    const cad = cap.cad && cap.cad(c);
    if (cad || (cap.max && G.year > cap.max)) {
      A = A || (N.arc[arc.id] = { i: 0, y: G.year, fin: null, h: [] });
      if (cad || cap.tarde) narFinArco(f, arc, A, cad || cap.tarde);
      else A.i++;
      continue;
    }
    if (cap.ok && !cap.ok(c)) continue;
    const yy = A ? A.y + (cap.tras ?? 2) : cap.y || 0;
    if (!best || yy < best.yy) best = { arc, cap, yy };
  }
  return best;
}
function narCapitulo(f, arc, cap) {
  const N = narF(f);
  const A0 = N.arc[arc.id],
    i = A0 ? A0.i : 0;
  return runEvent(
    cap,
    {},
    {
      kick: `${arc.t} · Capítulo ${NAR_ROM[i] || i + 1}`,
      arc: arc.id,
      ctx: { arc, A: A0 },
      tras: (c, x, out) => {
        const A = (N.arc[arc.id] = N.arc[arc.id] || { i: 0, y: G.year, fin: null, h: [] });
        A.h.push({ y: G.year, t: narPlano(narVal(cap.t, c)), o: narPlano(narVal(x.o.t, c)) });
        A.y = G.year;
        const fin = narVal(x.o.fin, c, out.ok);
        const sig = x.o.sig ? arc.caps.findIndex((k) => k.id === x.o.sig) : -1;
        A.i = sig >= 0 ? sig : A.i + 1;
        c.A = A;
        if (fin || A.i >= arc.caps.length)
          return narFinArco(f, arc, A, fin || narVal(arc.finDef, c) || "fin");
        return null;
      },
    },
  );
}
function narFinArco(f, arc, A, key) {
  A.fin = key;
  A.y = G.year;
  const fn = (arc.fines && arc.fines[key]) || { t: "Fin", d: "" };
  narCron(f, `${arc.t} — ${fn.t}. ${fn.d}`, "nar-fin");
  return `<b>${arc.t}: ${fn.t}.</b> ${fn.d}`;
}

/* ---------- reacciones a lo que pasa en el mundo ---------- */
function narSucesion(f, antId, nuevoId) {
  if (f == null || f >= NF || nuevoId == null) return;
  const N = narF(f);
  if (N.rey === nuevoId) return;
  const ant = G.C[antId],
    nu = G.C[nuevoId],
    reg = N.reyes[N.reyes.length - 1];
  if (reg && reg.h == null) {
    reg.h = G.year;
    reg.ap = narApodo(f, ant, { ...reg, lr: N.lr });
  }
  if (ant && isMe(f))
    narCron(
      f,
      `${ant.alive ? "Termina el reinado de" : "Descansa ya"} ${ant.n}${reg && reg.ap ? `, a quien la crónica llamará «${reg.ap}»` : ""}, tras ${Math.max(1, G.year - (reg ? reg.d : G.year))} años de reinado.`,
      "nar-fin",
    );
  else if (ant && reg && reg.ap && alive(ME))
    addLog(`Los cronistas de ${CIV[f].s} llamarán a ${ant.n} «${reg.ap}».`, "nar-rumor");
  if (narTiene(f, "particion")) {
    /* la promesa de repartir el reino se cumple a medias: los hermanos se disputan la herencia */
    narQuita(f, "particion");
    narEf(f, "orden", -6, 6, "Herencia repartida");
    if (human(f))
      narCron(
        f,
        "Los hijos del difunto se reparten el reino como se prometió, y empiezan a odiarse.",
        "nar-dec",
      );
  }
  for (const L of NAR_LEG) N.leg[L.k] = Math.round(N.leg[L.k] * 0.5);
  N.lr = { pi: 0, gl: 0, cr: 0, sa: 0 };
  N.rey = nuevoId;
  if (nu) N.reyes.push({ id: nu.id, n: nu.n, t: ttl(nu), d: G.year, h: null, ap: "" });
  if (N.reyes.length > 30) N.reyes.shift();
  narEncolar(f, "coronacion", { c: nuevoId, a: antId ?? null });
}
function narMuerte(ch, motivo) {
  if (!ch || ch.f == null || ch.f >= NF || !G.F[ch.f]) return;
  const f = ch.f,
    N = narF(f);
  if (narHecho(N, "m" + ch.id, 99) || !human(f) || ch.id === N.rey) return;
  if (ch.id === N.her && ch.id !== G.F[f].ruler) narEncolar(f, "luto", { c: ch.id, m: motivo || "" });
  else if (ch.id === N.sp)
    narCron(f, `Muere ${ch.n}, consorte de ${narTit(ruler(f))}. ${pick(NAR_DUELO)}`, "nar-dec");
  else if (ch.age >= 16 && isMe(f) && R() < 0.5)
    addLog(`${ch.n} recibe sepultura junto a los suyos. ${pick(NAR_DUELO)}`, "nar-rumor");
}
const NAR_DUELO = [
  "Las plañideras lloran tres días.",
  "La corte viste de luto.",
  "Se reparte pan a los pobres por su alma.",
  "Su nombre se inscribe en la lápida del panteón familiar.",
];
function narBoda(a, b) {
  for (const [x, y] of [
    [a, b],
    [b, a],
  ]) {
    if (!x || !y || x.f == null || x.f >= NF || !G.F[x.f] || !human(x.f)) continue;
    const f = x.f,
      F = G.F[f],
      N = narF(f);
    if (x.id !== F.ruler && x.id !== F.heir) continue;
    if (x.id === F.ruler) N.sp = y.id;
    if (narHecho(N, "b" + y.id, 99)) continue;
    const g = narOrigen(y);
    if (g >= 0 && g !== f) narEncolar(f, "consorte", { c: y.id, g, x: x.id });
    else narCron(f, `${x.n} se casa con ${y.n}, de una casa noble del reino.`, "nar-dec");
  }
}
function narGuerra(a, b) {
  if (a == null || b == null || a >= NF || b >= NF) return;
  if (human(b) && !narHecho(narF(b), "g" + a, 2)) narEncolar(b, "armas", { g: a });
  const Na = narF(a);
  if (Na.st && Na.st[b] === "alianza" && !narHecho(Na, "tr" + b, 3)) {
    narLeg(a, { pi: -4, cr: 3 });
    narMk(a, "perjuro");
    if (human(a))
      narCron(
        a,
        `${narTit(ruler(a))} rompe su juramento de alianza con ${CIV[b].s}. Los obispos lo anotan.`,
        "nar-dec",
      );
  }
}
/* tipos de economía: hambre, impagos, bancarrota (→ evento); peste e inflación solo a la crónica */
function narCrisis(f, tipo, extra = {}) {
  if (f == null || f >= NF) return;
  const N = narF(f);
  if (tipo === "peste" || tipo === "inflacion") {
    if (isMe(f) && !narHecho(N, "cr" + tipo, 3))
      addLog(
        tipo === "peste"
          ? `Las campanas doblan sin descanso${extra.p && extra.p.name ? " en " + extra.p.name : ""}. Los sepultureros no dan abasto.`
          : "En los mercados, el pan cuesta el doble que hace un año. Los viejos maldicen la moneda nueva.",
        "nar-rumor",
      );
    return;
  }
  const t = tipo === "hambre" ? "hambre" : "arcas";
  if (!narHecho(N, "crisis" + t, 4)) narEncolar(f, t, {});
}
function narConquista({ p, de, a }) {
  if (!p) return;
  if (a != null && a < NF) {
    const N = narF(a);
    N.vic++;
    if (p.cap && de != null && de < NF && p.home === de) {
      narLeg(a, { gl: 2 });
      narEncolar(a, "triunfo", { p: p.id, g: de });
    }
    if (p.id === G.F[a].capId && narTiene(a, "exilio")) narEncolar(a, "regreso", { p: p.id });
    if (narTiene(a, "clemencia_" + p.id)) {
      narQuita(a, "clemencia_" + p.id);
      narOrden(a, 15, p);
      narLeg(a, { pi: 4 });
      if (human(a))
        narCron(a, `Se cumple la palabra dada: ${p.name} se rinde y nadie es pasado a cuchillo.`, "nar-dec");
    }
    if (narTiene(a, "terror_" + p.id)) {
      narQuita(a, "terror_" + p.id);
      narOrden(a, -10, p);
      narLeg(a, { cr: 3 });
      if (human(a))
        narCron(
          a,
          `${p.name} cae y la amenaza se cumple. Las piedras de la ciudad recordarán ese día.`,
          "nar-dec",
        );
    }
  }
  if (de != null && de < NF) {
    const N = narF(de);
    N.per++;
    if (a != null && a < NF) narMk(de, "agravio_" + a);
    if (p.id === G.F[de].capId && human(de)) {
      narMk(de, "exilio");
      narEncolar(de, "exilio", { p: p.id, g: a });
    }
  }
}
function narBatalla(b) {
  if (!b) return;
  const { p, atacante, defensor, gana, s0, gA, gD } = b;
  for (const f of [atacante, defensor]) {
    if (f == null || f >= NF || !G.F[f]) continue;
    const N = narF(f),
      at = f === atacante,
      vence = at ? !!gana : !gana,
      gid = at ? gA : gD,
      g = gid != null ? G.C[gid] : null;
    if (vence) {
      N.bat++;
      if ((s0 ? tot(s0) : 0) >= 5) narLeg(f, { gl: 1 });
      if (narTiene(f, "voto") && !narTiene(f, "voto_cumplido")) narMk(f, "voto_cumplido");
    }
    if (!human(f) || !p) continue;
    if (isMe(f)) narInforme(b, at ? 0 : 1, vence);
    const vivo = g && g.alive && g.f === f && g.id !== G.F[f].ruler;
    if (vence && vivo && narTiene(f, "redencion_" + g.id)) {
      narQuita(f, "redencion_" + g.id);
      g.ma = Math.min(10, g.ma + 1);
      narCron(f, `${g.n} lava su deshonra en ${p.name}. Los soldados vuelven a gritar su nombre.`, "nar-dec");
    }
    if (at && vence && vivo && (s0 ? tot(s0) : 0) >= 6 && (g.tr === "Ambicioso" || g.ma >= 6) && R() < 0.5)
      if (!narHecho(N, "rec" + g.id, 5)) narEncolar(f, "recompensa", { c: g.id, p: p.id });
    if (at && !vence && vivo && R() < 0.5 && !narHecho(N, "der" + g.id, 4))
      narEncolar(f, "derrota", { c: g.id, p: p.id });
  }
}
/* ---------- campaña: asedios, capitanes, generales y mercenarios (se revisa una vez al año) ---------- */
const narAsedios = () => (G && G.cam && G.cam.as ? Object.values(G.cam.as).filter(Boolean) : []);
function narCampana(f) {
  const N = narF(f);
  /* asedios largos: la ciudad propia cercada o el cerco propio que no acaba */
  for (const as of narAsedios()) {
    const p = G.P[as.p != null ? as.p : -1];
    if (!p || (as.n || 0) < 2) continue;
    if (p.owner === f && !narHecho(N, "asd" + p.id, 3)) narEncolar(f, "asedio_def", { p: p.id });
    else if (as.f === f && (as.n || 0) >= 3 && !narHecho(N, "asa" + p.id, 3))
      narEncolar(f, "asedio_atk", { p: p.id });
  }
  /* capitanes (sin linaje) que surgen y ascienden; generales que alcanzan gran renombre */
  const mandos = G.C.filter((c) => c.alive && c.f === f && (c.linaje === false || (c.nivel || 0) >= 6));
  const caps0 = N.caps || [];
  for (const c of mandos) {
    if (c.linaje === false && c.rol === "capitan" && !caps0.includes(c.id) && isMe(f))
      narCron(
        f,
        pick([
          `Los soldados cantan ya en los fuegos del campamento el nombre de ${c.n}.`,
          `${c.n} no tiene linaje ni tierras, pero sus hombres le seguirían al infierno.`,
          `Dicen que ${c.n} fue mozo de mulas antes de mandar una línea de escudos.`,
        ]),
        "nar-rumor",
        true,
      );
    if (c.linaje === false && c.rol === "general" && caps0.includes(c.id))
      narEncolar(f, "capitan_general", { c: c.id });
    if ((c.nivel || 0) >= 6 && !narTiene(f, "gg_" + c.id) && c.id !== G.F[f].ruler) {
      narMk(f, "gg_" + c.id);
      narEncolar(f, "gran_general", { c: c.id });
    }
  }
  N.caps = mandos.filter((c) => c.linaje === false && c.rol === "capitan").map((c) => c.id);
  /* mercenarios que desertaron por falta de paga (mercenarios.js lo anota en la crónica) */
  const con =
    G.cam && G.cam.merc && Array.isArray(G.cam.merc.con) ? G.cam.merc.con.filter((x) => x.f === f) : [];
  for (const m of N.merc || [])
    if (!con.some((x) => x.id === m.id) && G.log.some((l) => l.m.includes(`Los ${m.nom} no cobran`)))
      if (!narHecho(N, "mer" + m.id, 99)) narEncolar(f, "merc_saqueo", { nom: m.nom });
  N.merc = con.map((x) => ({ id: x.id, nom: x.nom }));
}
/* informe de batalla (combate): los factores decisivos pasan a la crónica con voz de cronista */
const NAR_FX = {
  "hab:berserker": [
    (v) =>
      v
        ? "Los berserkers mordieron sus escudos y cayeron sobre el enemigo como lobos."
        : "La furia de los berserkers no bastó: cuando se apagó, quedaron indefensos.",
  ],
  "hab:estampida": [
    (v) =>
      v
        ? "Los elefantes rompieron la línea enemiga y aplastaron cuanto hallaron."
        : "Los elefantes se desbocaron y pisotearon a los suyos.",
  ],
  "hab:espanto": [
    (v) =>
      v
        ? "Los caballos enemigos huyeron espantados por el olor de las bestias."
        : "Ni el espanto de las bestias salvó la jornada.",
  ],
  "hab:fuegoGriego": [
    (v) =>
      v
        ? "El fuego que no se apaga con agua devoró las filas contrarias."
        : "El fuego líquido ardió en vano.",
  ],
  "hab:muroEscudos": [
    (v) =>
      v
        ? "El muro de escudos no cedió un palmo en toda la jornada."
        : "El muro de escudos aguantó hasta que ya no hubo hombres que lo sostuvieran.",
  ],
  "hab:testudo": [(v) => (v ? "La tortuga avanzó bajo la lluvia de flechas sin perder un hombre." : "")],
  "hab:sacrificio": [
    (v) => (v ? "La sangre ofrecida antes de la batalla dio a los guerreros un valor sin miedo." : ""),
  ],
  "hab:tambores": [
    (v) => (v ? "Los tambores marcaron el paso hasta que el enemigo no soportó más su sonido." : ""),
  ],
  "hab:emboscada": [(v) => (v ? "La emboscada en la espesura decidió la jornada antes de empezar." : "")],
  "hab:disparoParto": [
    (v) => (v ? "Los jinetes fingieron huir y dispararon de espaldas, como enseñaron los partos." : ""),
  ],
  carga: [(v) => (v ? "La carga de la caballería barrió el campo." : "")],
  flanqueo: [(v) => (v ? "Un rodeo por el flanco hundió al enemigo." : "")],
  murallas: [(v) => (v ? "Las murallas hicieron lo que no habría hecho ningún ejército." : "")],
  persecucion: [(v) => (v ? "La persecución fue más sangrienta que la batalla." : "")],
};
function narInforme(b, lado, vence) {
  const inf = b.informe,
    fx =
      inf && Array.isArray(inf.factores)
        ? inf.factores
        : (b.factores || []).map((k) => ({ k, s: b.gana ? 0 : 1 }));
  if (!fx.length || R() > 0.6) return;
  for (const x of fx) {
    const t = NAR_FX[x.k] && NAR_FX[x.k][0](x.s === lado);
    if (t) return addLog(`${b.p.name}: ${t}`, "nar-rumor");
  }
}
/* respaldo: detecta al empezar el año lo que otros sistemas aún no emitan como evento */
function narRevisar(f) {
  const N = narF(f),
    F = G.F[f];
  N.ef = N.ef.filter((e) => e.h >= G.year);
  for (const k in N.hx) if (G.year - N.hx[k] > 12) delete N.hx[k];
  N.maxP = Math.max(N.maxP, owned(f).length);
  narCampana(f);
  if (N.rey !== F.ruler) narSucesion(f, N.rey, F.ruler);
  for (const id of N.vivos) if (G.C[id] && !G.C[id].alive) narMuerte(G.C[id], null);
  const r = ruler(f);
  if (r && r.sp != null && r.sp !== N.sp && G.C[r.sp] && G.C[r.sp].alive) narBoda(r, G.C[r.sp]);
  if (N.st)
    for (let g = 0; g < NF; g++) {
      if (g === f || G.st[f][g] !== "guerra" || N.st[g] === "guerra") continue;
      const propia = G.log.some((l) => l.m.includes(`${CIV[f].s} declara la guerra a ${CIV[g].s}`));
      if (!propia) narGuerra(g, f);
    }
  if (F.food <= 0 && inc(f).net < 0) narCrisis(f, "hambre");
  if (F.gold < 0) narCrisis(f, "bancarrota");
}
function narIA(f) {
  if (!G || !alive(f) || human(f)) return;
  const N = narF(f);
  if (N.rey !== G.F[f].ruler) narSucesion(f, N.rey, G.F[f].ruler);
  if (R() > 0.22) return;
  const c = narCtx(f);
  const ls = EVENTS.filter((e) => !e.re && e.ia !== false && narLibre(N, e) && (!e.ok || e.ok(c)));
  const ev = narPeso(ls, (e) => narVal(e.peso, c) ?? 1);
  if (ev) narAuto(f, ev);
}

OC.on("partidaLista", narInit);
OC.on("conquista", narConquista);
OC.on("batallaResuelta", narBatalla);
OC.on("revuelta", ({ p, de } = {}) => {
  if (de == null || de >= NF || !p) return;
  const N = narF(de);
  N.per++;
  if (!narHecho(N, "rev", 3)) narEncolar(de, "alzamiento", { p: p.id });
});
const narId = (x) => (x && typeof x === "object" ? x.id : x);
OC.on("sucesion", ({ f, anterior, nuevo } = {}) => narSucesion(f, narId(anterior), narId(nuevo)));
OC.on("muertePersonaje", ({ c, motivo } = {}) => narMuerte(typeof c === "object" ? c : G.C[c], motivo));
OC.on("bodaCelebrada", ({ a, b } = {}) =>
  narBoda(typeof a === "object" ? a : G.C[a], typeof b === "object" ? b : G.C[b]),
);
OC.on("guerraDeclarada", ({ a, b } = {}) => narGuerra(a, b));
OC.on("alianzaSellada", ({ a, b } = {}) => {
  for (const [x, y] of [
    [a, b],
    [b, a],
  ])
    if (x < NF && y < NF && human(x))
      narCron(x, `Alianza con ${CIV[y].s}: se intercambian rehenes y juramentos.`, "nar-dec", true);
});
OC.on("pazFirmada", ({ a, b } = {}) => {
  for (const [x, y] of [
    [a, b],
    [b, a],
  ])
    if (x < NF && y < NF && human(x))
      narCron(x, `Paz con ${CIV[y].s}. Los heraldos cuelgan las lanzas.`, "nar-dec", true);
});
OC.on("tecnologiaInvestigada", ({ f, id } = {}) => {
  if (f == null || f >= NF) return;
  narLeg(f, { sa: 1 });
  if (R() < 0.35 && !narHecho(narF(f), "sab", 5)) narEncolar(f, "sabios", { t: String(id ?? "") });
});
OC.on("eraNueva", ({ f, era } = {}) => {
  if (f == null || f >= NF) return;
  narLeg(f, { sa: 2 });
  /* tecnología ya abre su modal: aquí solo queda en los anales */
  if (human(f))
    narCron(
      f,
      `${narPueblo(f)} entra en una nueva era${narEraNombre(f, era == null ? "" : String(era))}.`,
      "nar-fin",
      true,
    );
});
OC.on("edificioConstruido", ({ f, id } = {}) => {
  if (f != null && f < NF && id === "temple") narLeg(f, { pi: 1 });
});
OC.on("crisisEconomica", ({ f, tipo, ...extra } = {}) => narCrisis(f, tipo, extra));
OC.on("turnoIA", narIA);
OC.on("antesFinAnio", () => {
  for (const f of G.human) if (G.F[f]) narFoto(f);
});
OC.on("finAnio", () => {
  for (let f = 0; f < NF; f++)
    if (G.F[f] && narF(f).rey !== G.F[f].ruler) narSucesion(f, narF(f).rey, G.F[f].ruler);
});
/* fin de la partida (turnos lo emite justo antes del modal de victoria/derrota): el epílogo va delante */
OC.on("finPartida", () => {
  if (G && G.F[ME] && narF(ME).epi == null) narEpilogo(ME);
});

/* ---------- eventos ----------
   Cada evento: {id, t, k (tipo), d(c), o: [opciones], ok(c), prep(c), peso, cd (años de espera), una, y, hasta,
   re (solo como reacción), ch (consecuencia encadenada), prio, ia (false: la IA no lo usa), nt (noticia)}.
   Cada opción: {t, tip, coste, req(c) → true | "motivo", prob, px, ef(c), si(c), no(c), leg, mk, cr, ia, vis}.
   c = {f, F, r (soberano), sp (consorte), h (heredero), p (provincia al azar), cap, own, d, pj, N}. */
const EVENTS = [
  {
    id: "concilio",
    t: "Concilio de obispos",
    k: "Fe",
    ok: (c) => narCristiano(c.f),
    d: (c) =>
      `Arrianos y nicenos se acusan de herejía en la basílica de ${c.cap.name}. Los obispos esperan la palabra de ${narTit(c.r)}; los reinos vecinos escuchan.${typeof socTension === "function" && socTension(c.f) > 0.3 ? " Muchas de tus provincias no comparten tu credo." : ""}`,
    o: [
      {
        t: "Defender el credo niceno",
        tip: (c) =>
          `+relación con los nicenos, −con los arrianos${narFe(c.f) === "niceno" && typeof socPolitica === "function" ? "; política de celo" : ""}`,
        ef: (c) => {
          relig(c.f, "niceno", "arriano");
          narSoc(c.f, { cle: narFe(c.f) === "niceno" ? 6 : -6 });
          if (narFe(c.f) === "niceno" && typeof socPolitica === "function") socPolitica(c.f, "celo");
        },
        leg: { pi: 3 },
        cr: (c) => `Concilio en ${c.cap.name}: ${narTit(c.r)} defiende el credo de Nicea.`,
      },
      {
        t: "Proteger a los arrianos",
        tip: (c) =>
          `+relación con los arrianos, −con los nicenos${narFe(c.f) === "arriano" && typeof socPolitica === "function" ? "; política de celo" : ""}`,
        ef: (c) => {
          relig(c.f, "arriano", "niceno");
          narSoc(c.f, { cle: narFe(c.f) === "arriano" ? 6 : -6 });
          if (narFe(c.f) === "arriano" && typeof socPolitica === "function") socPolitica(c.f, "celo");
        },
        leg: { pi: 3 },
        cr: (c) => `Concilio en ${c.cap.name}: ${narTit(c.r)} toma partido por los arrianos.`,
      },
      {
        t: "Imponer silencio a ambos bandos",
        req: (c) => narStat(c.r, "di", 4),
        tip: (c) =>
          `+5 orden en todo el reino${typeof socPolitica === "function" ? "; política de tolerancia" : ""}`,
        ef: (c) => {
          narOrden(c.f, 5);
          narSoc(c.f, { cle: -4, pro: 4 });
          if (typeof socPolitica === "function") socPolitica(c.f, "tol");
        },
        leg: { sa: 4 },
        cr: (c) =>
          `${narTit(c.r)} manda callar a los obispos de ambos credos. La paz de la Iglesia se compra con silencio.`,
      },
    ],
    nt: (c, o) => `Se dice que en ${CIV[c.f].s} los obispos se han excomulgado unos a otros.`,
  },
  {
    id: "misioneros",
    t: "Monjes en los caminos",
    k: "Fe",
    ok: (c) => narFe(c.f) === "pagano",
    d: (c) =>
      `Dos monjes descalzos predican en el mercado de ${c.p.name} a un dios crucificado. La gente se ríe, pero vuelve a escucharles al día siguiente. Los sacerdotes de los viejos dioses piden que los echen.`,
    o: [
      {
        t: "Dejarles predicar",
        tip: "+relación con los reinos cristianos",
        ef: (c) => {
          relFe(c.f, "niceno", 6);
          narMk(c.f, "misioneros");
        },
        leg: { sa: 3 },
        cr: (c) => `${narTit(c.r)} permite predicar a los monjes cristianos en ${c.p.name}.`,
      },
      {
        t: "Expulsarlos del reino",
        tip: (c) => `+5 orden en ${c.p.name}`,
        ef: (c) => narOrden(c.f, 5, c.p),
        leg: { pi: 3 },
      },
      {
        t: "Entregarlos a los sacerdotes",
        tip: "−relación con los cristianos",
        ef: (c) => relFe(c.f, "niceno", -12),
        leg: { cr: 5, pi: 2 },
        cr: (c) =>
          `Los monjes de ${c.p.name} mueren en el altar de los viejos dioses. Roma tendrá dos mártires más.`,
      },
    ],
  },
  {
    id: "cosecha",
    t: "Mala cosecha",
    k: "Reino",
    d: (c) =>
      `El granizo ha segado los trigales de <b>${c.p.name}</b> antes de la siega. Los campesinos bajan a la ciudad con las manos vacías, y todos saben que los graneros reales están llenos.`,
    o: [
      {
        t: "Abrir los graneros reales",
        coste: { comida: 15 },
        tip: (c) => `+15 orden en ${c.p.name}`,
        ef: (c) => narOrden(c.f, 15, c.p),
        leg: { pi: 3 },
        ia: 2,
        cr: (c) => `${narTit(c.r)} abre los graneros de ${c.p.name} al pueblo hambriento.`,
        nt: (c) => `En ${CIV[c.f].s}, ${narTit(c.r)} reparte grano entre los hambrientos.`,
      },
      {
        t: "Vender el grano a precio de hambre",
        tip: (c) => `+35 oro, −15 orden en ${c.p.name}`,
        ef: (c) => {
          OC.ganar(c.f, { oro: 35 });
          narOrden(c.f, -15, c.p);
        },
        leg: { cr: 3 },
        cr: (c) => `Hambre en ${c.p.name}: el fisco vende el grano real a precio de oro.`,
      },
      {
        t: "Ordenar rogativas por la lluvia",
        prob: (c) => 0.3 + c.N.leg.pi * 0.004,
        px: "según tu piedad",
        si: (c) => {
          narOrden(c.f, 10, c.p);
          return `Llueve al tercer día de procesiones. ${c.p.name} ve en ello la mano del cielo: +10 orden.`;
        },
        no: (c) => {
          narOrden(c.f, -10, c.p);
          return `El cielo calla. En ${c.p.name} se murmura que el soberano reza mucho y reparte poco: −10 orden.`;
        },
        leg: { pi: 1 },
      },
    ],
  },
  {
    id: "bagaudas",
    t: "Bagaudas en los caminos",
    k: "Reino",
    d: (c) =>
      `Campesinos huidos, esclavos y desertores —los llaman bagaudas— asaltan las villas de <b>${c.p.name}</b>. Dicen que no pagan tributo a ningún rey.`,
    o: [
      {
        t: "Enviar a la guarnición",
        req: (c) => narReq(c.p.u.i >= 2, `hacen falta 2 infantes en ${c.p.name}`),
        tip: "−2 infantería, +10 orden",
        ef: (c) => {
          narTropa(c.p, "i", -2);
          narOrden(c.f, 10, c.p);
        },
        leg: { gl: 1 },
        ia: 2,
      },
      {
        t: "Ahorcar a los cabecillas en los cruces",
        tip: (c) => `+4 orden en el reino, −6 en ${c.p.name}`,
        ef: (c) => {
          narOrden(c.f, 4);
          narOrden(c.f, -10, c.p);
        },
        leg: { cr: 4 },
        cr: (c) => `Los cruces de ${c.p.name} amanecen con bagaudas colgados. Nadie protesta en voz alta.`,
      },
      {
        t: "Ofrecerles perdón y tierra",
        prob: (c) => 0.3 + c.r.di * 0.05,
        px: (c) => `según la diplomacia de ${c.r.n}`,
        si: (c) => {
          narTropa(c.p, "i", 2);
          narOrden(c.f, 8, c.p);
          return "Los bagaudas bajan del monte, entregan las armas y reciben tierras baldías. Algunos se alistan: +2 infantería, +8 orden.";
        },
        no: (c) => {
          narOrden(c.f, -10, c.p);
          return "Toman el perdón por debilidad y saquean dos villas más: −10 orden.";
        },
        leg: { pi: 2 },
      },
      {
        t: "Comprar su silencio",
        coste: { oro: 40 },
        tip: "+5 orden",
        ef: (c) => narOrden(c.f, 5, c.p),
      },
    ],
  },
  {
    id: "seda",
    t: "Mercaderes de seda",
    k: "Reino",
    d: (c) =>
      `Una caravana llegada de Oriente acampa ante ${c.cap.name}: seda, pimienta y vidrio de Siria. Sus jefes ofrecen oro a cambio de exenciones y privilegios en tus mercados.`,
    o: [
      {
        t: "Conceder los privilegios",
        tip: "+70 oro, −8 orden en la capital",
        ef: (c) => {
          OC.ganar(c.f, { oro: 70 });
          narOrden(c.f, -8, c.cap);
        },
        ia: 2,
      },
      {
        t: "Gravar sus mercancías",
        prob: (c) => 0.4 + c.r.ge * 0.05,
        px: (c) => `según la gestión de ${c.r.n}`,
        si: (c) => {
          OC.ganar(c.f, { oro: 45 });
          return "Los mercaderes protestan, pagan y se quedan: +45 oro.";
        },
        no: () => "Recogen sus fardos de noche y se marchan a otra corte.",
        leg: { cr: 1 },
      },
      {
        t: "Rechazar el lujo extranjero",
        tip: "+5 orden en la capital",
        ef: (c) => narOrden(c.f, 5, c.cap),
        leg: { pi: 1 },
      },
    ],
  },
  {
    id: "conjura",
    t: "Conjura en la corte",
    k: "Corte",
    prep: (c) => {
      c.pj =
        pick(narAdultos(c.f, (x) => x.tr === "Ambicioso" && x.id !== c.F.heir && x.id !== c.r.sp)) ||
        pick(narAdultos(c.f, (x) => x.id !== c.F.heir && x.id !== c.r.sp)) ||
        null;
    },
    d: (c) =>
      c.pj
        ? `Un liberto susurra que ${narB(c.pj)} reúne de noche a los descontentos. En esas cenas se habla de ${narTit(c.r)} con desprecio y del trono con codicia.`
        : `Nobles descontentos conspiran contra ${narTit(c.r)}. Nadie sabe quién encabeza la conjura, pero todos saben que existe.`,
    o: [
      {
        t: "Purgar a los conjurados",
        tip: (c) => (c.pj ? `−6 orden; ${c.pj.n} morirá` : "−6 orden"),
        ef: (c) => {
          narOrden(c.f, -6);
          c.r.in = Math.min(10, c.r.in + 1);
          if (c.pj) kill(c.pj, "es ejecutado por traición");
        },
        leg: { cr: 6 },
        cr: (c) =>
          `Purga en la corte${c.pj ? `: ${c.pj.n} muere acusado de traición` : ""}. ${c.r.n} duerme mejor; la nobleza, peor.`,
      },
      {
        t: "Desenmascararlos con astucia",
        prob: (c) => 0.25 + c.r.in * 0.07,
        px: (c) => `según la intriga de ${c.r.n} (${c.r.in})`,
        si: (c) => {
          narOrden(c.f, 6);
          return "Una carta falsa basta: los conjurados se delatan unos a otros y piden perdón de rodillas. +6 orden.";
        },
        no: (c) => {
          narMk(c.f, "conjura_viva");
          return "La trampa se descubre. Los conjurados se esconden mejor... y no olvidan.";
        },
        leg: { sa: 2 },
      },
      {
        t: "Comprar lealtades",
        coste: { oro: 50 },
        tip: "la conjura se disuelve",
      },
      {
        t: "Ignorar los rumores",
        prob: 0.6,
        px: "a merced de los conjurados",
        si: () => "Los rumores se apagan solos, como tantas veces.",
        no: (c) => {
          const v = pick(family(c.f).filter((x) => x.id !== c.F.ruler && x !== c.pj));
          if (v) kill(v, "es asesinado por los conjurados");
          narMk(c.f, "conjura_viva");
          return v ? `${v.n} aparece degollado en los baños del palacio.` : "Los conjurados ganan tiempo.";
        },
      },
    ],
  },
  {
    id: "punal",
    t: "El puñal en la sombra",
    k: "Corte",
    ch: true,
    ok: (c) => narHace(c.f, "conjura_viva", 2),
    d: (c) =>
      `Los conjurados han vuelto. Un copero ha sido sorprendido con una ampolla en la manga y jura que no sabe quién se la dio. ${narTit(c.r)} ya no prueba el vino sin que otro beba antes.`,
    o: [
      {
        t: "Doblar la guardia y torturar al copero",
        coste: { oro: 30 },
        tip: "la conjura termina",
        ef: (c) => narQuita(c.f, "conjura_viva"),
        leg: { cr: 3 },
        cr: (c) =>
          `El copero de ${narTit(c.r)} muere en el potro sin decir un nombre. La conjura se deshace.`,
      },
      {
        t: "Confiar en Dios y en la suerte",
        prob: (c) => 0.55 + c.N.leg.pi * 0.003,
        px: "según tu piedad",
        si: (c) => {
          narQuita(c.f, "conjura_viva");
          return "Pasan los meses y nadie vuelve a intentarlo. Quizá el cielo guarda a los reyes.";
        },
        no: (c) => {
          narQuita(c.f, "conjura_viva");
          c.r.ma = Math.max(1, c.r.ma - 1);
          narOrden(c.f, -8);
          return `Un puñal alcanza a ${c.r.n} en la escalinata. Sobrevive, pero cojea desde entonces: −1 mando, −8 orden.`;
        },
        leg: { pi: 2 },
      },
      {
        t: "Perdonar públicamente a todos",
        tip: "+4 orden",
        ef: (c) => {
          narQuita(c.f, "conjura_viva");
          narOrden(c.f, 4);
        },
        leg: { pi: 4 },
      },
    ],
  },
  {
    id: "huna",
    hist: true,
    t: "Embajada huna",
    hasta: 470,
    k: "Frontera",
    ok: (c) => c.f !== 3 && alive(3) && G.st[3][c.f] !== "guerra" && G.st[3][c.f] !== "alianza",
    d: () =>
      `Jinetes de cabellos trenzados y mejillas marcadas a cuchillo esperan a las puertas sin desmontar. Traen palabras de ${narTit(ruler(3))}: «Oro por la paz de vuestras fronteras».`,
    o: [
      {
        t: "Pagar el tributo",
        coste: { oro: 60 },
        tip: "+25 relación con los hunos",
        ef: (c) => relAdd(c.f, 3, 25),
        ia: 2,
      },
      {
        t: "Negarse",
        tip: "−25 relación; puede haber guerra",
        ef: (c) => {
          relAdd(c.f, 3, -25);
          if (G.st[3][c.f] !== "guerra" && R() < 0.4) {
            declareWar(3, c.f);
            return "Los hunos vuelven grupas. Antes de un mes, sus jinetes cruzan la frontera.";
          }
          return "Los embajadores escupen en el suelo y se marchan. Por ahora no vuelven.";
        },
        ver: true,
        leg: { gl: 3 },
      },
      {
        t: "Agasajarlos sin pagar",
        req: (c) => narStat(c.r, "di", 5),
        prob: (c) => 0.25 + c.r.di * 0.06,
        px: (c) => `según la diplomacia de ${c.r.n}`,
        si: (c) => {
          relAdd(c.f, 3, 10);
          return "Tres días de banquete y halagos. Se van borrachos, con regalos menores y sin el oro.";
        },
        no: (c) => {
          relAdd(c.f, 3, -15);
          return "Toman los halagos por burla. Su señor sabrá que le has tomado por un niño.";
        },
        leg: { sa: 2 },
      },
    ],
  },
  {
    id: "peste",
    t: "Peste",
    k: "Reino",
    d: (c) =>
      `Bubones negros en las axilas y fiebre que mata en tres días: la peste ha llegado a <b>${c.p.name}</b> en un barco de grano. Los médicos piden cerrar las puertas; los sacerdotes, abrir las iglesias.`,
    o: [
      {
        t: "Cuarentena",
        coste: { oro: 30 },
        tip: "la guarnición se salva",
        leg: { sa: 2 },
        ia: 2,
      },
      {
        t: "Encomendarse al cielo",
        prob: (c) => 0.45 + c.N.leg.pi * 0.003,
        px: "según tu piedad",
        si: (c) => {
          narOrden(c.f, 5, c.p);
          return `La peste pasa de largo. En ${c.p.name} se habla de milagro: +5 orden.`;
        },
        no: (c) => {
          for (const t of TYP) c.p.u[t] = Math.floor(c.p.u[t] / 2);
          return `La peste diezma la guarnición de ${c.p.name}: la mitad de las tropas mueren.`;
        },
        leg: { pi: 2 },
      },
      {
        t: "Quemar el barrio del puerto",
        tip: (c) => `−12 orden en ${c.p.name}`,
        ef: (c) => narOrden(c.f, -12, c.p),
        leg: { cr: 4 },
        cr: (c) =>
          `Arde el barrio del puerto de ${c.p.name} con sus enfermos dentro. La peste no se extiende.`,
      },
    ],
  },
  {
    id: "alanos",
    t: "Mercenarios alanos",
    ok: (c) => narPuedeT(c.f, "c"),
    hasta: 480,
    k: "Frontera",
    d: () =>
      "Una banda de jinetes alanos, sin rey y sin tierra, ofrece sus lanzas al mejor postor. Montan caballos pequeños y feos que no se cansan nunca.",
    o: [
      {
        t: "Contratarlos",
        coste: { oro: 60 },
        tip: "+4 caballería en la capital",
        ef: (c) => {
          narTropa(c.cap, "c", 4);
          narMk(c.f, "alanos");
        },
        leg: { gl: 1 },
        ia: 2,
      },
      {
        t: "Asentarlos en la frontera",
        coste: { oro: 20 },
        tip: (c) => `+2 caballería, −6 orden en ${c.p.name}`,
        ef: (c) => {
          narTropa(c.p, "c", 2);
          narOrden(c.f, -6, c.p);
        },
        leg: { sa: 1 },
      },
      { t: "Rechazarlos", ia: 1 },
    ],
  },
  {
    id: "alanos_paga",
    t: "Los alanos reclaman su paga",
    k: "Corte",
    ch: true,
    ok: (c) => narHace(c.f, "alanos", 2),
    d: (c) =>
      `Los jinetes alanos que contrataste rodean el palacio de ${c.cap.name}. Su capitán, con un collar de dientes, golpea la puerta con la lanza: la paga lleva meses de retraso.`,
    o: [
      {
        t: "Pagarles lo debido",
        coste: { oro: 40 },
        ef: (c) => narQuita(c.f, "alanos"),
        ia: 2,
      },
      {
        t: "Prometerles el botín de la próxima guerra",
        req: (c) => narReq(narEnemigos(c.f).length, "no estás en guerra con nadie"),
        prob: (c) => 0.4 + c.r.di * 0.05,
        px: (c) => `según la diplomacia de ${c.r.n}`,
        si: (c) => {
          narQuita(c.f, "alanos");
          return "El capitán ríe y acepta: le gustan los reyes que prometen sangre.";
        },
        no: (c) => {
          narQuita(c.f, "alanos");
          narTropa(c.cap, "c", -4);
          narOrden(c.f, -10, c.cap);
          return "No se fían. Saquean el arrabal y se marchan al galope: −4 caballería, −10 orden en la capital.";
        },
        leg: { gl: 1 },
      },
      {
        t: "Echarlos con la guardia",
        tip: "−4 caballería, −10 orden en la capital",
        ef: (c) => {
          narQuita(c.f, "alanos");
          narTropa(c.cap, "c", -4);
          narOrden(c.f, -10, c.cap);
        },
        leg: { cr: 2 },
      },
    ],
  },
  {
    id: "juegos",
    t: (c) => (narAmerica(c.f) ? "El juego de pelota" : "Juegos en el hipódromo"),
    k: "Reino",
    d: (c) =>
      narAmerica(c.f)
        ? `La gente de ${c.cap.name} pide un gran juego de pelota en la cancha del templo. Los jugadores ya se untan las caderas y los nobles apuestan plumas de quetzal.`
        : `La plebe de ${c.cap.name} pide carreras y espectáculos. Los aurigas de las facciones ya entrenan a sus caballos y los panaderos hacen cuentas.`,
    o: [
      {
        t: "Celebrar grandes juegos",
        coste: { oro: 40 },
        tip: "+10 orden en todo el reino",
        ef: (c) => narOrden(c.f, 10),
        leg: { gl: 1 },
        ia: 2,
      },
      {
        t: (c) => (narCristiano(c.f) ? "Juegos en honor de los santos" : "Fiestas para los dioses"),
        coste: { oro: 20 },
        tip: "+5 orden",
        ef: (c) => narOrden(c.f, 5),
        leg: { pi: 2 },
      },
      { t: "Ahorrar el oro", tip: "−3 orden en la capital", ef: (c) => narOrden(c.f, -3, c.cap) },
    ],
  },
  {
    id: "heredero",
    t: "El heredero díscolo",
    k: "Corte",
    ia: false,
    ok: (c) => c.h && c.h.age >= 14 && c.h.age <= 30 && c.h.tr !== "Prudente",
    prep: (c) => {
      c.pj = c.h;
    },
    d: (c) =>
      `${narB(c.h)} ha matado en una riña de taberna al hijo de un noble de ${c.p.name}. El padre, vestido de luto, exige ante toda la corte sangre o el precio de la sangre.`,
    o: [
      {
        t: "Pagar el precio de la sangre",
        coste: { oro: 50 },
        tip: "+3 orden",
        ef: (c) => narOrden(c.f, 3),
      },
      {
        t: (c) => `Castigar a ${c.h.n} en público`,
        tip: (c) => `+5 orden; ${c.h.n} gana +1 gestión`,
        ef: (c) => {
          narOrden(c.f, 5);
          c.h.ge = Math.min(10, c.h.ge + 1);
        },
        leg: { pi: 2, sa: 2 },
        cr: (c) =>
          `${narTit(c.r)} azota en público a su heredero ${c.h.n}. La nobleza aplaude la justicia del soberano.`,
      },
      {
        t: "Encubrir el crimen",
        prob: (c) => 0.3 + c.r.in * 0.06,
        px: (c) => `según la intriga de ${c.r.n}`,
        si: (c) => {
          c.h.in = Math.min(10, c.h.in + 1);
          return `El noble acepta una explicación y un silencio. ${c.h.n} aprende que todo se arregla: +1 intriga.`;
        },
        no: (c) => {
          narOrden(c.f, -12);
          return "El encubrimiento se sabe. En las plazas se dice que para los príncipes no hay ley: −12 orden.";
        },
        leg: { cr: 2 },
      },
      {
        t: "Desheredarlo",
        req: (c) =>
          narReq(
            heirCands(c.f).some((x) => x.id !== c.h.id),
            "no hay otro heredero posible",
          ),
        tip: "otro heredero ocupa su lugar",
        ef: (c) => {
          const n = heirCands(c.f).find((x) => x.id !== c.h.id);
          if (n) c.F.heir = n.id;
          return n ? `${n.n} es el nuevo heredero.` : "";
        },
        ver: true,
        leg: { cr: 2, sa: 1 },
        cr: (c) => `${narTit(c.r)} deshereda a ${c.h.n} por la sangre derramada.`,
      },
    ],
  },
  {
    id: "consorte_enferma",
    t: "Fiebres en el palacio",
    k: "Corte",
    ia: false,
    ok: (c) => c.sp && c.sp.age >= 25,
    prep: (c) => {
      c.pj = c.sp;
    },
    d: (c) =>
      `${narB(c.sp)}, consorte de ${narTit(c.r)}, arde de fiebre desde hace nueve días. Los médicos de la corte se contradicen; los criados ya hablan en voz baja.`,
    o: [
      {
        t: "Llamar a un médico griego",
        coste: { oro: 40 },
        prob: 0.75,
        px: "el griego es caro, pero sabe",
        si: (c) => `${c.sp.n} sana. El médico se queda en la corte con un sueldo y un huerto.`,
        no: (c) => {
          kill(c.sp, "muere tras una larga fiebre");
          return `Ni el griego puede salvarla. ${c.sp.n} muere al amanecer.`;
        },
        leg: { sa: 1 },
      },
      {
        t: (c) => (narCristiano(c.f) ? "Velar junto a las reliquias" : "Ofrecer sacrificios"),
        prob: (c) => 0.45 + c.N.leg.pi * 0.004,
        px: "según tu piedad",
        si: (c) => `Al tercer día de vigilia, la fiebre cede. ${c.sp.n} vive, y lo atribuye al cielo.`,
        no: (c) => {
          kill(c.sp, "muere tras una larga fiebre");
          return `El cielo no escucha. ${c.sp.n} muere entre cirios.`;
        },
        leg: { pi: 2 },
      },
      {
        t: "Aceptar lo que venga",
        prob: 0.35,
        si: (c) => `${c.sp.n} sana sola, como sanan los fuertes.`,
        no: (c) => {
          kill(c.sp, "muere tras una larga fiebre");
          return `${c.sp.n} muere sin que nadie hiciera nada por ella.`;
        },
      },
    ],
  },
  {
    id: "estilita",
    t: "El santo de la columna",
    k: "Fe",
    ok: (c) => narCristiano(c.f),
    d: (c) =>
      `Cerca de <b>${c.p.name}</b> vive desde hace once años un ermitaño sobre una columna, comiendo lo que le suben en una cesta. Acuden peregrinos de tres reinos. Dicen que lee el corazón de los reyes.`,
    o: [
      {
        t: "Visitarle descalzo",
        tip: (c) => `+10 orden en ${c.p.name}`,
        ef: (c) => narOrden(c.f, 10, c.p),
        leg: { pi: 5 },
        ia: 2,
        cr: (c) => `${narTit(c.r)} sube descalzo hasta la columna del santo de ${c.p.name}.`,
      },
      {
        t: "Pedir su consejo",
        tip: "+5% aceptación diplomática durante 5 años",
        ef: (c) => {
          narEf(c.f, "diplo", 0.05, 5, "Consejo del estilita");
          return "El santo calla un día entero y luego dice: «Escucha más de lo que hablas». Los embajadores notan el cambio.";
        },
        ver: true,
        leg: { sa: 3 },
      },
      {
        t: "Ordenar que baje",
        tip: (c) => `−8 orden en ${c.p.name}`,
        ef: (c) => narOrden(c.f, -8, c.p),
        leg: { cr: 3 },
      },
    ],
  },
  {
    id: "presagio",
    t: "El vuelo de los cuervos",
    k: "Fe",
    ok: (c) => !narCristiano(c.f),
    d: (c) =>
      `Una bandada de cuervos ha dado tres vueltas sobre ${c.cap.name} antes de volar hacia el oeste. ${narFe(c.f) === "zoroastra" ? "Los magos" : "Los adivinos"} piden permiso para leer el presagio.`,
    o: [
      {
        t: "Que lean las entrañas de un toro",
        prob: 0.55,
        px: "los dioses son caprichosos",
        si: (c) => {
          narEf(c.f, "batalla", 0.06, 3, "Presagio favorable");
          return "Las entrañas son limpias: victoria. Los guerreros afilan las armas con alegría (+6% en batalla, 3 años).";
        },
        no: (c) => {
          narOrden(c.f, -5);
          return "El hígado está podrido. Nadie quiere hablar de lo que significa: −5 orden.";
        },
        leg: { pi: 2 },
      },
      {
        t: "Ofrecer un gran sacrificio",
        coste: { oro: 20 },
        tip: "+5 orden",
        ef: (c) => narOrden(c.f, 5),
        leg: { pi: 4 },
        ia: 2,
      },
      { t: "Los cuervos son cuervos", leg: { sa: 2 } },
    ],
  },
  {
    id: "tesoro",
    t: "El tesoro enterrado",
    k: "Reino",
    d: (c) =>
      `Unos campesinos de <b>${c.p.name}</b>, arando junto a una villa abandonada, han desenterrado una olla de barro llena de sólidos de oro con la cara de un emperador olvidado.`,
    o: [
      { t: "Para el tesoro real", tip: "+60 oro", ef: (c) => OC.ganar(c.f, { oro: 60 }), ia: 2 },
      {
        t: (c) => (narCristiano(c.f) ? "Donarlo a la Iglesia" : "Ofrecerlo a los templos"),
        tip: "+5 orden en el reino",
        ef: (c) => narOrden(c.f, 5),
        leg: { pi: 5 },
      },
      {
        t: "Que se lo queden quienes lo hallaron",
        tip: (c) => `+12 orden en ${c.p.name}`,
        ef: (c) => narOrden(c.f, 12, c.p),
        leg: { pi: 2, sa: 1 },
        cr: (c) =>
          `${narTit(c.r)} deja el tesoro de ${c.p.name} a los campesinos que lo hallaron. La historia corre de boca en boca.`,
      },
    ],
  },
  {
    id: "codices",
    t: "Los códices del griego",
    k: "Corte",
    d: (c) =>
      `Un griego tuerto ha llegado a ${c.cap.name} con dos mulas cargadas de códices: Aristóteles, Galeno, los tratados de agrimensura de los romanos. Los vende o se los lleva a otra corte.`,
    o: [
      {
        t: "Comprar la biblioteca entera",
        coste: { oro: 45 },
        tip: "+10% investigación durante 6 años",
        ef: (c) => narEf(c.f, "invest", 0.1, 6, "Biblioteca del griego"),
        leg: { sa: 6 },
        ia: 2,
        cr: (c) => `La corte de ${c.cap.name} compra una biblioteca de códices griegos.`,
      },
      {
        t: "Comprar solo los de agrimensura",
        coste: { oro: 15 },
        tip: "+4 comida al año durante 5 años",
        ef: (c) => narEf(c.f, "comida", 4, 5, "Agrimensores griegos"),
        leg: { sa: 2 },
      },
      {
        t: "Quemarlos: son libros de paganos",
        vis: (c) => narCristiano(c.f),
        tip: "+3 orden",
        ef: (c) => narOrden(c.f, 3),
        leg: { pi: 2, cr: 2, sa: -4 },
      },
      { t: "Que se los lleve" },
    ],
  },
  {
    id: "duelo",
    t: "El duelo",
    k: "Corte",
    ia: false,
    prep: (c) => {
      c.pj = pick(narAdultos(c.f, (x) => x.sex === "m" && x.id !== c.F.heir && x.age < 55));
      return !!c.pj;
    },
    d: (c) =>
      `Un noble de ${c.p.name} acusa a ${narB(c.pj)} de haberle robado tierras y honra, y le reta a combate ante testigos. ${c.pj.n} ya ha pedido su espada.`,
    o: [
      {
        t: "Permitir el duelo",
        prob: (c) => 0.3 + c.pj.ma * 0.07,
        px: (c) => `según el mando de ${c.pj.n} (${c.pj.ma})`,
        si: (c) => {
          c.pj.ma = Math.min(10, c.pj.ma + 1);
          return `${c.pj.n} vence y perdona la vida a su rival. Los soldados le admiran: +1 mando.`;
        },
        no: (c) => {
          kill(c.pj, "muere en un duelo");
          return `${c.pj.n} cae con la garganta abierta. Su rival huye antes del anochecer.`;
        },
        leg: { gl: 2 },
      },
      {
        t: "Prohibirlo",
        tip: "−3 orden: el ofendido no olvida",
        ef: (c) => narOrden(c.f, -3, c.p),
        leg: { sa: 2 },
      },
      {
        t: "Juzgar tú mismo el pleito",
        req: (c) => narStat(c.r, "ge", 5),
        tip: "+4 orden",
        ef: (c) => narOrden(c.f, 4),
        leg: { sa: 4 },
        cr: (c) => `${narTit(c.r)} juzga en persona el pleito de ${c.pj.n}. La sentencia se copia y se cita.`,
      },
    ],
  },
  {
    id: "desertores",
    t: "Desertores",
    k: "Frontera",
    ok: (c) => narEnemigos(c.f).length > 0,
    d: (c) =>
      `Una patrulla ha atrapado a una veintena de desertores en los bosques de ${c.p.name}. Dicen que llevaban meses sin paga ni pan, y que en la guerra contra ${narPueblo(narEnemigos(c.f)[0])} solo se muere.`,
    o: [
      {
        t: "Diezmarlos ante la tropa",
        tip: "+3 orden en el reino",
        ef: (c) => narOrden(c.f, 3),
        leg: { cr: 5 },
        cr: () => "Se diezma a los desertores ante el ejército formado, a la antigua usanza romana.",
      },
      {
        t: "Perdonarlos y pagarles",
        coste: { oro: 15 },
        tip: "+2 infantería en la capital",
        ef: (c) => narTropa(c.cap, "i", 2),
        leg: { pi: 3 },
        ia: 2,
      },
      {
        t: "Mandarlos a la primera línea",
        tip: (c) => `+2 infantería, −4 orden en ${c.p.name}`,
        ef: (c) => {
          narTropa(c.p, "i", 2);
          narOrden(c.f, -4, c.p);
        },
        leg: { gl: 1 },
      },
    ],
  },
  {
    id: "embajada",
    t: "Embajada extranjera",
    k: "Diplomacia",
    prep: (c) => {
      c.g = pick(narVecinos(c.f));
      return c.g != null;
    },
    d: (c) =>
      `Llegan a ${c.cap.name} los embajadores de ${narTit(ruler(c.g))}, de ${narPueblo(c.g)}, con halcones, perros de caza y un cofre de plata. Esperan regalos a la altura.`,
    o: [
      {
        t: "Devolver regalos más ricos",
        coste: { oro: 40 },
        tip: "+20 relación",
        ef: (c) => relAdd(c.f, c.g, 20),
        leg: { gl: 1 },
        ia: 2,
      },
      {
        t: "Agasajarlos con discursos",
        req: (c) => narStat(c.r, "di", 5),
        tip: "+12 relación",
        ef: (c) => relAdd(c.f, c.g, 12),
        leg: { sa: 2 },
      },
      {
        t: "Quedarse la plata y despedirlos",
        tip: "+30 oro, −10 relación",
        ef: (c) => {
          OC.ganar(c.f, { oro: 30 });
          relAdd(c.f, c.g, -10);
        },
        leg: { cr: 1 },
      },
    ],
    nt: (c) => `Se dice que ${CIV[c.f].s} y ${CIV[c.g].s} han intercambiado embajadas.`,
  },
  {
    id: "prodigio",
    t: "Un niño de la casa",
    k: "Corte",
    ia: false,
    prep: (c) => {
      c.pj = pick(narHijos(c.f).filter((x) => x.age >= 6 && x.age <= 14));
      return !!c.pj;
    },
    d: (c) =>
      `${narB(c.pj)}, de ${c.pj.age} años, ya lee de corrido, discute con los clérigos y monta mejor que algunos jinetes. Los preceptores piden que ${narTit(c.r)} decida qué será de ${narO(c.pj, "él", "ella")}.`,
    o: [
      {
        t: "Rétores y maestros griegos",
        coste: { oro: 30 },
        tip: "+2 diplomacia, +1 gestión",
        ef: (c) => {
          c.pj.di = Math.min(10, c.pj.di + 2);
          c.pj.ge = Math.min(10, c.pj.ge + 1);
        },
        leg: { sa: 2 },
      },
      {
        t: (c) => (narCristiano(c.f) ? "Entregarle a un monasterio" : "Entregarle a los sacerdotes"),
        tip: "se vuelve Piadoso",
        ef: (c) => {
          c.pj.tr = "Piadoso";
        },
        leg: { pi: 3 },
      },
      {
        t: "Endurecerle entre soldados",
        tip: "+2 mando, se vuelve Valiente",
        ef: (c) => {
          c.pj.ma = Math.min(10, c.pj.ma + 2);
          c.pj.tr = "Valiente";
        },
        leg: { gl: 1 },
      },
    ],
  },
  {
    id: "amor",
    t: "Una boda desigual",
    k: "Corte",
    ia: false,
    prep: (c) => {
      c.pj = pick(narAdultos(c.f, (x) => x.sp == null && x.age <= 35 && x.id !== c.r.id));
      return !!c.pj;
    },
    d: (c) =>
      `${narB(c.pj)} quiere casarse con ${c.pj.sex === "m" ? "la hija de un liberto, que hila en el taller del palacio" : "un oficial de la guardia sin tierras ni linaje"}. Lo ha dicho delante de todos, y no piensa desdecirse.`,
    o: [
      {
        t: "Bendecir la boda",
        tip: "+3 orden en la capital",
        ef: (c) => {
          marry(c.pj, mkChar(c.f, c.pj.sex === "m" ? "f" : "m", clamp(c.pj.age + ri(-3, 2), 16, 45)));
          narOrden(c.f, 3, c.cap);
        },
        leg: { pi: 3 },
        cr: (c) => `${c.pj.n} se casa por amor y sin dote. La plebe de la capital lo celebra como propio.`,
      },
      {
        t: "Prohibirla",
        tip: (c) => `${c.pj.n} se vuelve Ambicios${narO(c.pj)}`,
        ef: (c) => {
          c.pj.tr = "Ambicioso";
        },
        leg: { cr: 1 },
      },
      {
        t: "Buscarle una boda que convenga",
        vis: (c) => isMe(c.f),
        tip: "abre la propuesta de boda",
        ef: (c) => {
          marryModal(c.pj);
        },
        leg: { sa: 1 },
      },
    ],
  },
  {
    id: "veterano",
    t: "Una espada en venta",
    k: "Corte",
    ia: false,
    prep: (c) => {
      c.g = pick([...Array(NF).keys()].filter((g) => g !== c.f && alive(g)));
      if (c.g == null) return false;
      c.nom = pick(CIV[c.g].m);
    },
    d: (c) =>
      `Un veterano de cicatrices viejas, ${c.nom}, antiguo capitán de ${CIV[c.g].s}, se presenta en la corte. Dice que su señor le pagó con ingratitud y que su espada busca otro dueño.`,
    o: [
      {
        t: "Tomarlo a tu servicio",
        coste: { oro: 50 },
        tip: "se une a la corte (mando alto)",
        ef: (c) => {
          const v = mkChar(c.f, "m", ri(30, 44));
          v.n = c.nom + " el Extranjero";
          v.ma = ri(6, 9);
          v.tr = pick(["Valiente", "Ambicioso", "Prudente"]);
          return `${v.n} jura lealtad. Puedes nombrarlo general en cualquier provincia.`;
        },
        ver: true,
        leg: { gl: 1 },
        cr: (c) => `${c.nom}, capitán desertor de ${CIV[c.g].s}, entra al servicio de ${narTit(c.r)}.`,
      },
      {
        t: "Devolverlo a su señor",
        tip: (c) => `+10 relación con ${CIV[c.g].s}`,
        ef: (c) => relAdd(c.f, c.g, 10),
        leg: { sa: 1 },
      },
      { t: "Despedirlo" },
    ],
  },
  {
    id: "reliquia",
    t: "Un vendedor de reliquias",
    k: "Fe",
    ok: (c) => narCristiano(c.f),
    d: () =>
      "Un monje de Jerusalén ofrece, envuelto en seda, un clavo de la Cruz. Lo acompañan documentos con sellos y testigos que lloran al verlo. El precio es alto.",
    o: [
      {
        t: "Comprarlo para la catedral",
        coste: { oro: 40 },
        prob: (c) => 0.4 + c.r.in * 0.03,
        px: "¿será auténtico?",
        si: (c) => {
          narEf(c.f, "orden", 6, 8, "Reliquia de la Cruz", c.cap.id);
          narLeg(c.f, { pi: 4 });
          return `La reliquia obra curaciones. Acuden peregrinos a ${c.cap.name}: +6 orden durante 8 años.`;
        },
        no: (c) => {
          narOrden(c.f, -5, c.cap);
          return "Un herrero reconoce el clavo: lo forjó él mismo el invierno pasado. La corte es el hazmerreír de la ciudad: −5 orden.";
        },
      },
      { t: "Echar al monje", leg: { sa: 2 } },
    ],
  },
  {
    id: "acueducto",
    t: "El acueducto",
    k: "Reino",
    d: (c) =>
      `El viejo acueducto que da agua a ${c.cap.name} pierde por cien grietas. Las fuentes se secan y en verano habrá fiebres. Los ingenieros piden oro; los nobles, que pague otro.`,
    o: [
      {
        t: "Repararlo con el tesoro",
        coste: { oro: 50 },
        tip: "+6 orden y +3 comida al año en la capital (8 años)",
        ef: (c) => {
          narEf(c.f, "orden", 6, 8, "Acueducto reparado", c.cap.id);
          narEf(c.f, "comida", 3, 8, "Huertas regadas");
        },
        leg: { sa: 4 },
        ia: 2,
        cr: (c) => `Se repara el acueducto de ${c.cap.name}. El agua vuelve a cantar en las fuentes.`,
      },
      {
        t: "Que lo paguen los nobles",
        prob: (c) => 0.35 + c.r.ge * 0.05,
        px: (c) => `según la gestión de ${c.r.n}`,
        si: (c) => {
          narEf(c.f, "orden", 6, 8, "Acueducto reparado", c.cap.id);
          return "Los nobles pagan, a regañadientes y con su nombre grabado en cada arco.";
        },
        no: (c) => {
          narOrden(c.f, -6);
          return "Los nobles se niegan y el acueducto sigue goteando. La corte pierde el pulso: −6 orden.";
        },
        leg: { cr: 1 },
      },
      {
        t: "Que se caiga",
        tip: "−5 orden en la capital",
        ef: (c) => narOrden(c.f, -5, c.cap),
      },
    ],
  },
  {
    id: "sueno",
    t: "El sueño del soberano",
    k: "Corte",
    prep: (c) => {
      c.vision = pick([
        "un águila que cae al mar con las alas ardiendo",
        "una espada rota que vuelve a soldarse sola",
        "un río de sangre que cruza el salón del trono",
        "siete bueyes flacos que devoran a siete gordos",
      ]);
    },
    d: (c) =>
      `${narTit(c.r)} ha despertado gritando. Ha soñado con ${c.vision}. Toda la corte quiere interpretarlo.`,
    o: [
      {
        t: (c) => (narCristiano(c.f) ? "Que lo interprete el obispo" : "Que lo interpreten los sacerdotes"),
        tip: "+4 orden",
        ef: (c) => narOrden(c.f, 4),
        leg: { pi: 3 },
      },
      {
        t: "Que lo interpreten los generales",
        tip: "+6% en batalla durante 3 años",
        ef: (c) => narEf(c.f, "batalla", 0.06, 3, "Sueño de guerra"),
        leg: { gl: 2 },
      },
      {
        t: "Que lo interprete el astrólogo",
        tip: "+5% investigación durante 4 años",
        ef: (c) => narEf(c.f, "invest", 0.05, 4, "Lectura de los astros"),
        leg: { sa: 2 },
      },
    ],
  },
  {
    id: "poeta",
    t: "El panegirista",
    k: "Corte",
    d: (c) =>
      `Un poeta de la Galia ofrece componer un panegírico en hexámetros a la gloria de ${narTit(c.r)}. Otro, más barato, ha escrito ya unos versos satíricos que circulan por las tabernas.`,
    o: [
      {
        t: "Encargar el panegírico",
        coste: { oro: 30 },
        tip: "+5% aceptación diplomática durante 5 años",
        ef: (c) => narEf(c.f, "diplo", 0.05, 5, "Panegírico"),
        leg: { gl: 4 },
        cr: (c) =>
          `Se recita en ${c.cap.name} un panegírico en honor de ${narTit(c.r)}. Las copias viajan a otras cortes.`,
      },
      {
        t: "Encargar una historia del reino",
        coste: { oro: 40 },
        tip: "+5% investigación durante 6 años",
        ef: (c) => narEf(c.f, "invest", 0.05, 6, "Historia del reino"),
        leg: { sa: 4 },
      },
      {
        t: "Cortarle la lengua al satírico",
        tip: "+3 orden",
        ef: (c) => narOrden(c.f, 3),
        leg: { cr: 3 },
      },
    ],
  },
  {
    id: "invierno",
    t: "Un invierno cruel",
    k: "Reino",
    d: (c) =>
      `La nieve ha cerrado los pasos y el río se ha helado hasta el fondo. En ${c.p.name} los viejos mueren en sus casas y los lobos entran en las aldeas.`,
    o: [
      {
        t: "Enviar leña y grano",
        coste: { comida: 10 },
        tip: "+6 orden en el reino",
        ef: (c) => narOrden(c.f, 6),
        leg: { pi: 2 },
        ia: 2,
      },
      {
        t: "Requisar la leña de los templos",
        tip: "+3 orden",
        ef: (c) => narOrden(c.f, 3),
        leg: { cr: 2, pi: -2 },
      },
      {
        t: "Que resistan",
        tip: (c) => `−8 orden en ${c.p.name}`,
        ef: (c) => narOrden(c.f, -8, c.p),
      },
    ],
  },
  {
    id: "rebelde",
    t: "El general resentido",
    k: "Corte",
    ch: true,
    prep: (c) => {
      const k = Object.keys(c.N.mk).find((k) => k.startsWith("resentido_") && narDesde(c.f, k) >= 3);
      const g = k && G.C[+k.split("_")[1]];
      if (!g || !g.alive || g.f !== c.f) {
        if (k) narQuita(c.f, k);
        return false;
      }
      c.pj = g;
      c.mkr = k;
    },
    ok: (c) => Object.keys(c.N.mk).some((k) => k.startsWith("resentido_") && narDesde(c.f, k) >= 3),
    d: (c) =>
      `${narB(c.pj)} no ha olvidado la afrenta. Sus soldados le aclaman en los campamentos y se niegan a recibir órdenes de otro. Algunos ya le llaman ${narO(c.pj, "rey", "reina")}.`,
    o: [
      {
        t: "Enfrentarte a él",
        prob: (c) => 0.45 + (c.r.ma - c.pj.ma) * 0.08,
        px: (c) => `tu mando (${c.r.ma}) frente al suyo (${c.pj.ma})`,
        si: (c) => {
          narQuita(c.f, c.mkr);
          kill(c.pj, "es ejecutado por rebelión");
          return `Los soldados dudan, y en esa duda ${narTit(c.r)} gana. ${c.pj.n} muere en el patio del cuartel.`;
        },
        no: (c) => {
          narQuita(c.f, c.mkr);
          const gp = genOf(c.pj);
          if (gp) {
            for (const t of TYP) gp.u[t] = Math.floor(gp.u[t] / 2);
            narOrden(c.f, -35, gp);
          }
          kill(c.pj, "deserta con la mitad de sus hombres");
          return `${c.pj.n} se lleva a la mitad de sus soldados y deja la provincia al borde de la revuelta.`;
        },
        leg: { gl: 3 },
      },
      {
        t: "Comprar su perdón",
        coste: { oro: 70 },
        ef: (c) => narQuita(c.f, c.mkr),
        leg: { sa: 1 },
      },
      {
        t: "Desterrarle de noche",
        req: (c) => narStat(c.r, "in", 5),
        ef: (c) => {
          narQuita(c.f, c.mkr);
          kill(c.pj, "parte al destierro");
        },
        leg: { cr: 2 },
      },
    ],
  },
  {
    id: "intriga",
    t: "Las cartas de la consorte",
    k: "Corte",
    ch: true,
    ia: false,
    prep: (c) => {
      const k = Object.keys(c.N.mk).find((k) => k.startsWith("sequito_") && narDesde(c.f, k) >= 2);
      const sp = k && G.C[+k.split("_")[1]];
      if (!sp || !sp.alive || sp.f !== c.f || sp.sp == null) {
        if (k) narQuita(c.f, k);
        return false;
      }
      c.pj = sp;
      c.mkr = k;
      c.g = narOrigen(sp);
      if (c.g < 0) c.g = pick(narVecinos(c.f)) ?? 0;
      c.kid = kidsOf(sp).find((x) => x.alive && x.f === c.f && x.id !== c.F.heir);
    },
    ok: (c) => Object.keys(c.N.mk).some((k) => k.startsWith("sequito_") && narDesde(c.f, k) >= 2),
    d: (c) =>
      `Un copista trae a ${narTit(c.r)} una carta interceptada: ${narB(c.pj)} informa a la corte de ${CIV[c.g].s} sobre tus tropas y tus deudas.${c.kid ? ` También pide apoyo para que su hijo ${c.kid.n} sea heredero.` : ""}`,
    o: [
      {
        t: "Enfrentarla en privado",
        prob: (c) => 0.4 + c.r.di * 0.05,
        px: (c) => `según la diplomacia de ${c.r.n}`,
        si: (c) => {
          narQuita(c.f, c.mkr);
          return `${c.pj.n} llora, jura lealtad y quema las cartas delante de ti.`;
        },
        no: (c) => {
          narQuita(c.f, c.mkr);
          relAdd(c.f, c.g, -15);
          return `${c.pj.n} lo niega todo y escribe a su familia que la maltratas. −15 relación con ${CIV[c.g].s}.`;
        },
        leg: { sa: 2 },
      },
      {
        t: "Dejar que siga escribiendo... lo que tú dictes",
        req: (c) => narStat(c.r, "in", 5),
        tip: "+6% en batalla durante 5 años",
        ef: (c) => {
          narQuita(c.f, c.mkr);
          narEf(c.f, "batalla", 0.06, 5, "Cartas falsas");
        },
        leg: { sa: 4 },
        cr: (c) => `${narTit(c.r)} descubre el espionaje de ${c.pj.n} y lo usa para engañar a ${CIV[c.g].s}.`,
      },
      {
        t: "Repudiarla y devolverla a su tierra",
        tip: (c) => `−30 relación con ${CIV[c.g].s}`,
        ef: (c) => {
          narQuita(c.f, c.mkr);
          if (G.C[c.pj.sp]) G.C[c.pj.sp].sp = null;
          c.pj.sp = null;
          c.pj.f = c.g;
          G.P.forEach((p) => {
            if (p.gen === c.pj.id) p.gen = null;
          });
          relAdd(c.f, c.g, -30);
        },
        leg: { cr: 4 },
        cr: (c) => `${narTit(c.r)} repudia a ${c.pj.n} y la devuelve a ${CIV[c.g].s} bajo escolta.`,
      },
    ],
  },
  {
    id: "acreedores",
    t: "Los acreedores",
    k: "Reino",
    ch: true,
    ok: (c) => narHace(c.f, "deuda", 3),
    d: () =>
      "Los mercaderes sirios vuelven con sus tablillas de cera y su notario. El préstamo, con sus intereses, suma ya ciento veinte de oro. Sonríen mucho.",
    o: [
      {
        t: "Pagar la deuda entera",
        coste: { oro: 120 },
        ef: (c) => narQuita(c.f, "deuda"),
        leg: { sa: 3 },
      },
      {
        t: "Pagar la mitad y prometer el resto",
        coste: { oro: 60 },
        tip: "volverán en tres años",
        ef: (c) => narMk(c.f, "deuda"),
      },
      {
        t: "Expulsarlos del reino",
        tip: "−4 oro al año durante 8 años",
        ef: (c) => {
          narQuita(c.f, "deuda");
          narEf(c.f, "oro", -4, 8, "Mercaderes expulsados");
        },
        leg: { cr: 5 },
        cr: (c) =>
          `${narTit(c.r)} expulsa a los mercaderes sirios para no pagarles. Ningún banquero volverá a fiarse.`,
      },
    ],
  },

  /* ---------- eventos de mediados y finales del siglo V y del siglo VI (campo y: año mínimo) ---------- */
  {
    id: "particion",
    t: "La partición del reino",
    k: "Corte",
    y: 470,
    cd: 20,
    ia: false,
    prep: (c) => {
      c.hs = narHijos(c.f).filter((x) => x.sex === "m" && x.age >= 16);
      if (c.hs.length < 2 || c.r.age < 45) return false;
      c.pj = c.hs.find((x) => x.id !== c.F.heir) || c.hs[1];
    },
    d: (c) =>
      `${narTit(c.r)} envejece y sus hijos ya se miden con la mirada. ${narB(c.pj)} reclama, según la vieja costumbre, su parte del reino: «Lo que fue de mi padre será de todos sus hijos».`,
    o: [
      {
        t: "Prometer el reparto a tu muerte",
        tip: "+6 orden durante 8 años; al morir el soberano, −6 orden 6 años",
        ef: (c) => {
          narEf(c.f, "orden", 6, 8, "Promesa de partición");
          narMk(c.f, "particion");
        },
        leg: { pi: 2 },
        cr: (c) => `${narTit(c.r)} promete repartir el reino entre sus hijos. Los cronistas temen lo peor.`,
      },
      {
        t: "Un solo heredero, como los romanos",
        req: (c) => narStat(c.r, "ge", 4),
        tip: (c) => `${c.pj.n} se vuelve Ambicioso`,
        ef: (c) => {
          c.pj.tr = "Ambicioso";
        },
        leg: { sa: 4 },
      },
      {
        t: (c) => `Enviar a ${c.pj.n} a gobernar la frontera`,
        tip: (c) => `${c.pj.n} será general (+1 mando)`,
        ef: (c) => {
          const p = c.own.find((q) => foes(q, c.f).length && q.gen == null);
          if (p) p.gen = c.pj.id;
          c.pj.ma = Math.min(10, c.pj.ma + 1);
        },
        leg: { gl: 2 },
      },
    ],
  },
  {
    id: "benito",
    hist: true,
    t: "La regla del monje",
    k: "Fe",
    y: 529,
    una: true,
    ok: (c) => narCristiano(c.f),
    d: (c) =>
      `Un monje de Nursia ha escrito una regla para vivir en comunidad: rezar y trabajar, «ora et labora». Sus discípulos piden un monte en ${c.p.name} para fundar un monasterio donde copiar libros y desecar pantanos.`,
    o: [
      {
        t: "Donarles el monte y las tierras",
        tip: "+8% investigación y +3 comida al año (12 años)",
        ef: (c) => {
          narEf(c.f, "invest", 0.08, 12, "Monasterio de la regla");
          narEf(c.f, "comida", 3, 12, "Tierras de los monjes");
        },
        leg: { pi: 4, sa: 4 },
        ia: 2,
        cr: (c) => `Se funda en ${c.p.name} un monasterio bajo la regla del monje de Nursia.`,
      },
      {
        t: "Darles solo una ermita",
        coste: { oro: 10 },
        tip: "+4 orden",
        ef: (c) => narOrden(c.f, 4, c.p),
        leg: { pi: 2 },
      },
      { t: "Bastantes monjes hay ya" },
    ],
  },
  {
    id: "atenas",
    hist: true,
    t: "Los filósofos de Atenas",
    k: "Saber",
    y: 529,
    una: true,
    ok: (c) => c.f !== 1,
    d: () =>
      "El emperador de Oriente ha cerrado la Academia de Atenas, que llevaba nueve siglos enseñando. Siete filósofos con sus libros buscan una corte que no les obligue a bautizarse ni a callar.",
    o: [
      {
        t: "Acogerlos con honores",
        coste: { oro: 30 },
        tip: "+12% investigación durante 10 años",
        ef: (c) => narEf(c.f, "invest", 0.12, 10, "Filósofos de Atenas"),
        leg: { sa: 6 },
        ia: 2,
        cr: (c) => `${narTit(c.r)} acoge a los últimos filósofos de la Academia de Atenas.`,
      },
      {
        t: "Acogerlos, pero que se bauticen",
        vis: (c) => narCristiano(c.f),
        tip: "+5% investigación durante 6 años",
        ef: (c) => narEf(c.f, "invest", 0.05, 6, "Filósofos conversos"),
        leg: { pi: 2, sa: 2 },
      },
      { t: "No queremos sofistas", leg: { pi: 1 } },
    ],
  },
  {
    id: "sol_oscuro",
    t: "El año sin sol",
    k: "Mundo",
    y: 536,
    una: true,
    peso: 6,
    d: () =>
      "Desde la primavera, el sol brilla como la luna, sin calor ni sombra. Nieva en verano, las uvas no maduran y el trigo se pudre en el campo. Nadie, ni los más viejos, recuerda nada igual.",
    o: [
      {
        t: "Racionar el grano de todo el reino",
        req: (c) => narStat(c.r, "ge", 4),
        tip: "−3 comida al año durante 3 años",
        ef: (c) => narEf(c.f, "comida", -3, 3, "Racionamiento"),
        leg: { sa: 4 },
        ia: 2,
      },
      {
        t: "Procesiones y ayunos",
        tip: "−6 comida al año durante 3 años; +4 orden",
        ef: (c) => {
          narEf(c.f, "comida", -6, 3, "El año sin sol");
          narOrden(c.f, 4);
        },
        leg: { pi: 4 },
      },
      {
        t: "Comprar grano a Egipto",
        coste: { oro: 60 },
        tip: "+20 comida",
        ef: (c) => OC.ganar(c.f, { comida: 20 }),
        leg: { sa: 1 },
      },
    ],
    nt: (c) => `En ${CIV[c.f].s} también se pudre el trigo bajo un sol sin calor.`,
  },
  {
    id: "gusanos",
    hist: true,
    t: "Los huevos del gusano",
    k: "Saber",
    y: 552,
    una: true,
    d: () =>
      "Dos monjes llegados de la India piden audiencia. Dentro de sus bastones huecos traen, dicen, huevos del gusano que hila la seda, el secreto mejor guardado de los reinos del lejano Oriente.",
    o: [
      {
        t: "Comprarles el secreto",
        coste: { oro: 50 },
        tip: "+6 oro al año durante 15 años",
        ef: (c) => narEf(c.f, "oro", 6, 15, "Seda propia"),
        leg: { sa: 4 },
        ia: 2,
        cr: (c) => `${narPueblo(c.f)} aprende a criar el gusano de la seda.`,
      },
      {
        t: "Venderlos a Constantinopla",
        vis: (c) => c.f !== 1 && alive(1),
        tip: "+40 oro, +15 relación con Oriente",
        ef: (c) => {
          OC.ganar(c.f, { oro: 40 });
          relAdd(c.f, 1, 15);
        },
        leg: { sa: 1 },
      },
      { t: "Cuentos de monjes" },
    ],
  },
  {
    id: "avaros",
    hist: true,
    t: "Los ávaros",
    k: "Frontera",
    y: 558,
    cd: 15,
    d: () =>
      "Un pueblo nuevo ha salido de la estepa: los ávaros, que llevan el pelo en trenzas y montan con estribos de hierro. Sus embajadores piden tierra o tributo, y dicen que han vencido a todos los pueblos que encontraron.",
    o: [
      {
        t: "Pagar tributo",
        coste: { oro: 50 },
        tip: "+4 orden",
        ef: (c) => narOrden(c.f, 4),
        leg: { sa: 1 },
        ia: 2,
      },
      {
        t: "Copiar sus estribos y combatirlos",
        prob: (c) => 0.4 + c.r.ma * 0.05,
        px: (c) => `según el mando de ${c.r.n}`,
        si: (c) => {
          narEf(c.f, "batalla", 0.08, 10, "Estribos de hierro");
          return "Tus herreros copian los estribos ávaros y tus jinetes los vencen con sus propias armas (+8% en batalla, 10 años).";
        },
        no: (c) => {
          narTropa(c.cap, "c", -3);
          return "Los ávaros destrozan tu caballería en la llanura: −3 caballería.";
        },
        leg: { gl: 4 },
      },
      {
        t: "Dirigirlos contra tus enemigos",
        req: (c) => (narEnemigos(c.f).length ? narStat(c.r, "in", 5) : "no estás en guerra con nadie"),
        tip: "tu enemigo sufre sus saqueos",
        ef: (c) => {
          const g = narEnemigos(c.f)[0];
          relAdd(c.f, g, -10);
          const q = pick(owned(g));
          if (q) for (const t of TYP) q.u[t] = Math.floor(q.u[t] * 0.6);
          return q ? `Los ávaros caen sobre ${q.name}, de ${CIV[g].s}, y la arrasan.` : "";
        },
        ver: true,
        leg: { sa: 2, cr: 2 },
      },
    ],
  },
  {
    id: "lombardos",
    hist: true,
    t: "Los lombardos bajan de los Alpes",
    k: "Frontera",
    y: 568,
    una: true,
    d: (c) =>
      `Un pueblo entero —los lombardos, con sus mujeres, sus carros y sus aliados sajones— baja por los pasos de los Alpes buscando tierra. Su rey ofrece a ${narTit(c.r)} paz a cambio de las provincias que nadie defiende.`,
    o: [
      {
        t: "Tomarlos a sueldo",
        coste: { oro: 50 },
        tip: "+3 infantería y +2 caballería en la capital",
        ef: (c) => {
          narTropa(c.cap, "i", 3);
          narTropa(c.cap, "c", 2);
        },
        leg: { gl: 2 },
        ia: 2,
      },
      {
        t: "Cerrarles los pasos",
        prob: 0.55,
        px: "los pasos son estrechos",
        si: () => "Los lombardos dan media vuelta. Otro reino tendrá que alimentarlos.",
        no: (c) => {
          const q = narFrontera(c);
          narOrden(c.f, -12, q);
          return `Los lombardos bajan por otro valle y saquean ${q.name}: −12 orden.`;
        },
        leg: { gl: 3 },
      },
      {
        t: "Ofrecerles una tierra baldía",
        tip: "+2 infantería; −4 orden en la frontera (8 años)",
        ef: (c) => {
          const q = narFrontera(c);
          narTropa(q, "i", 2);
          narEf(c.f, "orden", -4, 8, "Lombardos asentados", q.id);
        },
        leg: { sa: 3 },
      },
    ],
  },
  {
    id: "gregorio",
    hist: true,
    t: "Las cartas del papa",
    k: "Fe",
    y: 590,
    cd: 20,
    ok: (c) => narFe(c.f) === "niceno",
    d: () =>
      "El obispo de Roma, un antiguo prefecto llamado Gregorio, escribe a todos los reyes: pide grano para Roma, monjes para convertir a los anglos de Britania y paz entre los cristianos. Sus cartas se leen en voz alta en las iglesias.",
    o: [
      {
        t: "Enviar grano a Roma",
        coste: { comida: 15 },
        tip: "+10 relación con los nicenos",
        ef: (c) => relFe(c.f, "niceno", 10),
        leg: { pi: 5 },
        ia: 2,
      },
      {
        t: "Costear la misión a Britania",
        coste: { oro: 30 },
        tip: "+5% diplomacia durante 10 años",
        ef: (c) => narEf(c.f, "diplo", 0.05, 10, "Misión a los anglos"),
        leg: { pi: 3, sa: 2 },
      },
      { t: "Que el papa rece y los reyes gobiernen", leg: { gl: 1 } },
    ],
  },
  /* ---------- reacciones de campaña: asedios, capitanes, generales, mercenarios ---------- */
  {
    id: "asedio_def",
    t: (c) => `El cerco de ${c.pv.name}`,
    k: "Guerra",
    re: true,
    prio: 8,
    prep: (c) => {
      c.pv = G.P[c.d.p];
      c.as = G.cam && G.cam.as && G.cam.as[c.d.p];
      if (!c.pv || !c.as || c.pv.owner !== c.f) return false;
      c.g = c.as.f;
    },
    d: (c) =>
      `${c.as.n} estaciones lleva ${c.pv.name} cercada por ${c.g != null && c.g < NF ? narPueblo(c.g) : "los rebeldes"}. ${(c.as.vi ?? 1) <= 0 ? "Ya no queda grano: se comen los caballos, luego los perros, y alguien ha visto ratas a precio de oro." : "Los víveres menguan y en el mercado se habla en voz baja de rendirse."} El ánimo de los vecinos decidirá si las puertas aguantan.`,
    o: [
      {
        t: "Repartir las despensas del palacio",
        coste: { comida: 10 },
        tip: (c) => `+15 orden en ${c.pv.name}: la ciudad resiste mejor`,
        ef: (c) => narOrden(c.f, 15, c.pv),
        leg: { pi: 3 },
        cr: (c) =>
          `Cercada ${c.pv.name}, ${narTit(c.r)} reparte las despensas del palacio entre los sitiados.`,
      },
      {
        t: "Ahorcar a quien hable de rendirse",
        tip: (c) => `+10 orden en ${c.pv.name} por miedo`,
        ef: (c) => narOrden(c.f, 10, c.pv),
        leg: { cr: 5 },
      },
      {
        t: (c) =>
          narCristiano(c.f) ? "Procesión con las reliquias por las murallas" : "Sacrificios en las murallas",
        prob: (c) => 0.45 + c.N.leg.pi * 0.004,
        px: "según tu piedad",
        si: (c) => {
          narOrden(c.f, 18, c.pv);
          return `Los sitiados ven una señal en el cielo y juran morir antes que abrir: +18 orden en ${c.pv.name}.`;
        },
        no: (c) => {
          narOrden(c.f, -10, c.pv);
          return "Una piedra del enemigo derriba el estandarte en plena procesión. Nadie lo toma por buen presagio: −10 orden.";
        },
        leg: { pi: 2 },
      },
    ],
  },
  {
    id: "asedio_atk",
    t: (c) => `Ante las murallas de ${c.pv.name}`,
    k: "Guerra",
    re: true,
    prio: 6,
    prep: (c) => {
      c.pv = G.P[c.d.p];
      c.as = G.cam && G.cam.as && G.cam.as[c.d.p];
      if (!c.pv || !c.as || c.as.f !== c.f || c.pv.owner === c.f) return false;
    },
    d: (c) =>
      `El cerco de ${c.pv.name} dura ya ${c.as.n} estaciones. Tus soldados cavan, maldicen y enferman; los de dentro aún gritan desde los adarves. Un desertor de la ciudad asegura que hay quien abriría una poterna por un precio.`,
    o: [
      {
        t: "Prometer clemencia si abren las puertas",
        tip: (c) => `−8 orden dentro de ${c.pv.name}; al tomarla, +15 orden allí`,
        ef: (c) => {
          c.pv.order = clamp(c.pv.order - 8, 0, 100);
          narMk(c.f, "clemencia_" + c.pv.id);
        },
        leg: { pi: 3 },
      },
      {
        t: "Amenazar con no dejar a nadie vivo",
        tip: (c) => `−15 orden dentro de ${c.pv.name}; al tomarla, −10 orden allí`,
        ef: (c) => {
          c.pv.order = clamp(c.pv.order - 15, 0, 100);
          narMk(c.f, "terror_" + c.pv.id);
        },
        leg: { cr: 5 },
      },
      {
        t: "Pagar al traidor de la poterna",
        coste: { oro: 40 },
        prob: (c) => 0.3 + c.r.in * 0.05,
        px: (c) => `según la intriga de ${c.r.n}`,
        si: (c) => {
          c.pv.order = clamp(c.pv.order - 35, 0, 100);
          return `El traidor cumple: en ${c.pv.name} ya se habla de abrir las puertas (−35 orden en la ciudad).`;
        },
        no: () =>
          "El traidor cobra, se emborracha y lo descubren. Su cabeza aparece clavada en una pica sobre la puerta.",
        leg: { sa: 2 },
      },
    ],
  },
  {
    id: "capitan_general",
    t: "Un general sin linaje",
    k: "Guerra",
    re: true,
    prio: 5,
    prep: (c) => {
      const g = G.C[c.d.c];
      if (!g || !g.alive || g.f !== c.f) return false;
      c.pj = g;
    },
    d: (c) =>
      `${narB(c.pj)} empezó como un soldado más; hoy manda ejércitos. Los nobles de sangre lo miran por encima del hombro, los soldados lo adoran. Espera, como todos, una señal de ${narTit(c.r)}.`,
    o: [
      {
        t: "Darle tierras y un escudo de armas",
        coste: { oro: 30 },
        tip: "+5% en batalla durante 6 años",
        ef: (c) => narEf(c.f, "batalla", 0.05, 6, "Un general del pueblo"),
        leg: { gl: 3 },
        cr: (c) => `${narTit(c.r)} da tierras y escudo a ${c.pj.n}, un general salido de las filas.`,
      },
      {
        t: "Banquete en su honor ante los nobles",
        tip: "+4 orden",
        ef: (c) => narOrden(c.f, 4),
        leg: { sa: 2 },
      },
      {
        t: "Recordarle de dónde viene",
        tip: (c) => `${c.pj.n} no lo olvidará`,
        ef: (c) => narMk(c.f, "resentido_" + c.pj.id),
        leg: { cr: 2 },
      },
    ],
  },
  {
    id: "gran_general",
    t: (c) => `La fama de ${c.pj.n}`,
    k: "Guerra",
    re: true,
    prio: 6,
    prep: (c) => {
      const g = G.C[c.d.c];
      if (!g || !g.alive || g.f !== c.f || g.id === c.F.ruler) return false;
      c.pj = g;
      c.niv = typeof cmbNivel === "function" ? cmbNivel(g) : { nivel: g.nivel || 6, titulo: "" };
    },
    d: (c) =>
      `${narB(c.pj)}${c.niv.titulo ? ", " + c.niv.titulo.toLowerCase() + "," : ""} es ya el soldado más famoso del reino: los juglares cantan sus batallas y los embajadores extranjeros preguntan por él antes que por ${narTit(c.r)}. En palacio, alguien susurra que la fama es la antesala de la púrpura.`,
    o: [
      {
        t: "Concederle un triunfo",
        coste: { oro: 40 },
        tip: "+6 orden en la capital",
        ef: (c) => narOrden(c.f, 6, c.cap),
        leg: { gl: 5 },
        cr: (c) => `${c.pj.n} desfila en triunfo por ${c.cap.name}. Hasta los niños saben su nombre.`,
      },
      {
        t: "Casarle con una mujer de tu casa",
        vis: (c) => c.pj.sp == null && c.pj.sex === "m",
        req: (c) =>
          narReq(
            narAdultos(c.f, (x) => x.sex === "f" && x.sp == null).length,
            "no hay ninguna dama libre en la casa",
          ),
        tip: "lo atas a la dinastía",
        ef: (c) => {
          const d = narAdultos(c.f, (x) => x.sex === "f" && x.sp == null)[0];
          if (d) marry(c.pj, d);
          return d ? `${c.pj.n} se casa con ${d.n}.` : "";
        },
        ver: true,
        leg: { sa: 3 },
      },
      {
        t: "Mandarle lejos, a la frontera más dura",
        tip: (c) => `${c.pj.n} no lo olvidará`,
        ef: (c) => narMk(c.f, "resentido_" + c.pj.id),
        leg: { cr: 3 },
      },
    ],
  },
  {
    id: "merc_saqueo",
    t: "Los mercenarios sin paga",
    k: "Guerra",
    re: true,
    prio: 7,
    d: (c) =>
      `${c.d.nom || "Los mercenarios"} no cobraron y se cobraron solos: saquearon los campos, robaron el tesoro de la provincia y ahora vagan como bandidos. En las aldeas se dice que el rey paga peor que los bárbaros.`,
    o: [
      {
        t: "Indemnizar a los campesinos",
        coste: { oro: 30 },
        tip: "+6 orden en el reino",
        ef: (c) => narOrden(c.f, 6),
        leg: { pi: 3 },
      },
      {
        t: "Ahorcar al tesorero",
        tip: "+3 orden",
        ef: (c) => narOrden(c.f, 3),
        leg: { cr: 4 },
        cr: (c) => `${narTit(c.r)} cuelga al tesorero por la deserción de los mercenarios.`,
      },
      {
        t: "Jurar que pagarán con su sangre",
        tip: "+6% en batalla durante 3 años",
        ef: (c) => narEf(c.f, "batalla", 0.06, 3, "Venganza contra los desertores"),
        leg: { gl: 2 },
      },
    ],
  },

  /* ---------- reacciones (se encolan al ocurrir algo y se muestran al empezar el año) ---------- */
  {
    id: "recompensa",
    t: "El precio de la victoria",
    k: "Corte",
    re: true,
    prio: 7,
    prep: (c) => {
      const g = G.C[c.d.c];
      if (!g || !g.alive || g.f !== c.f || g.id === c.F.ruler) return false;
      c.pj = g;
      c.pv = G.P[c.d.p];
    },
    d: (c) =>
      `${narB(c.pj)} vuelve de ${c.pv.name} con los estandartes enemigos y el aplauso de los soldados. Ante toda la corte pide su recompensa: ${c.pj.tr === "Ambicioso" ? "un lugar en la línea de sucesión" : "oro para sus hombres y un triunfo en la capital"}.`,
    o: [
      {
        t: "Concederle un triunfo",
        coste: { oro: 30 },
        tip: (c) => `+1 mando a ${c.pj.n}, +5 orden en la capital`,
        ef: (c) => {
          c.pj.ma = Math.min(10, c.pj.ma + 1);
          narOrden(c.f, 5, c.cap);
        },
        leg: { gl: 4 },
        cr: (c) =>
          `${c.pj.n} entra en ${c.cap.name} en triunfo, coronado de laurel, tras su victoria en ${c.pv.name}.`,
      },
      {
        t: "Repartir oro entre sus hombres",
        coste: { oro: 50 },
        tip: "+5% en batalla durante 4 años",
        ef: (c) => narEf(c.f, "batalla", 0.05, 4, "Tropas bien pagadas"),
        leg: { sa: 1 },
      },
      {
        t: (c) => `Nombrar heredero a ${c.pj.n}`,
        vis: (c) => c.pj.tr === "Ambicioso" && c.pj.id !== c.F.heir,
        tip: "cambia la sucesión",
        ef: (c) => {
          c.F.heir = c.pj.id;
        },
        leg: { gl: 2 },
        cr: (c) => `${narTit(c.r)} nombra heredero al general ${c.pj.n}. La sangre de la casa murmura.`,
      },
      {
        t: "Recordarle a quién sirve",
        tip: (c) => `${c.pj.n} no lo olvidará`,
        ef: (c) => narMk(c.f, "resentido_" + c.pj.id),
        leg: { cr: 3 },
        cr: (c) =>
          `${narTit(c.r)} niega toda recompensa a ${c.pj.n}. El general sale del salón sin despedirse.`,
      },
    ],
  },
  {
    id: "derrota",
    t: "El general vencido",
    k: "Corte",
    re: true,
    prio: 5,
    prep: (c) => {
      const g = G.C[c.d.c];
      if (!g || !g.alive || g.f !== c.f || g.id === c.F.ruler) return false;
      c.pj = g;
      c.pv = G.P[c.d.p];
    },
    d: (c) =>
      `${narB(c.pj)} regresa de ${c.pv.name} con la mitad de sus hombres y la cabeza baja. La corte pide un culpable, y él no busca excusas.`,
    o: [
      {
        t: "Destituirle de todo mando",
        tip: "pierde su provincia",
        ef: (c) =>
          G.P.forEach((p) => {
            if (p.gen === c.pj.id) p.gen = null;
          }),
        leg: { cr: 2 },
      },
      {
        t: "Perdonarle: se redimirá",
        tip: "si vence pronto, +1 mando",
        ef: (c) => narMk(c.f, "redencion_" + c.pj.id),
        leg: { pi: 3 },
        cr: (c) => `${narTit(c.r)} perdona a ${c.pj.n} su derrota en ${c.pv.name}.`,
      },
      {
        t: "Culpar a los dioses y a la niebla",
        tip: "−3 orden",
        ef: (c) => narOrden(c.f, -3),
        leg: { sa: 1 },
      },
    ],
  },
  {
    id: "triunfo",
    t: "La capital vencida",
    k: "Guerra",
    re: true,
    prio: 8,
    prep: (c) => {
      c.pv = G.P[c.d.p];
      c.g = c.d.g;
      if (!c.pv || c.pv.owner !== c.f) return false;
    },
    d: (c) =>
      `Las puertas de <b>${c.pv.name}</b>, capital de ${narPueblo(c.g)}, se han abierto. Tus soldados, cubiertos de hollín, esperan la orden: saquear, como es costumbre, o contenerse.`,
    o: [
      {
        t: "Tres días de saqueo",
        tip: (c) => `+60 oro, −20 orden en ${c.pv.name}`,
        ef: (c) => {
          OC.ganar(c.f, { oro: 60 });
          narOrden(c.f, -20, c.pv);
        },
        leg: { cr: 6, gl: 2 },
        cr: (c) =>
          `${c.pv.name}, capital de ${CIV[c.g].s}, es saqueada tres días por las tropas de ${narTit(c.r)}.`,
      },
      {
        t: "Clemencia para los vencidos",
        tip: (c) => `+15 orden en ${c.pv.name}, +5 relación con todos`,
        ef: (c) => {
          narOrden(c.f, 15, c.pv);
          for (let g = 0; g < NF; g++) if (g !== c.f) relAdd(c.f, g, 5);
        },
        leg: { pi: 5 },
        cr: (c) =>
          `${narTit(c.r)} entra en ${c.pv.name} y prohíbe el saqueo. La clemencia del vencedor se comenta en todas las cortes.`,
      },
      {
        t: "Coronarte en su basílica",
        vis: (c) => c.g === 0 || c.g === 1,
        tip: (c) => `+4 orden en ${c.pv.name} durante 10 años`,
        ef: (c) => {
          narMk(c.f, "heredero_roma");
          narEf(c.f, "orden", 4, 10, "Corona de los césares", c.pv.id);
        },
        leg: { gl: 8 },
        cr: (c) => `${narTit(c.r)} se ciñe la diadema de los césares en ${c.pv.name}.`,
      },
    ],
  },
  {
    id: "exilio",
    t: "La corte en el exilio",
    k: "Guerra",
    re: true,
    prio: 9,
    prep: (c) => {
      c.pv = G.P[c.d.p];
      c.g = c.d.g;
    },
    d: (c) =>
      `${c.pv.name} ha caído en manos de ${c.g != null && c.g < NF ? CIV[c.g].s : "los rebeldes"}. ${narTit(c.r)} huye con la corte, el sello real y el tesoro que cabe en unas carretas. En ${c.cap.name}, los nobles se preguntan si aún queda un reino que gobernar.`,
    o: [
      {
        t: "Jurar venganza sobre la espada",
        tip: "+10% en batalla durante 5 años",
        ef: (c) => {
          if (c.g != null && c.g < NF) narMk(c.f, "venganza_" + c.g);
          narEf(c.f, "batalla", 0.1, 5, "Juramento de venganza");
        },
        leg: { gl: 3 },
        cr: (c) => `En el exilio, ${narTit(c.r)} jura recuperar ${c.pv.name} o morir en el intento.`,
      },
      {
        t: "Pedir la paz a cualquier precio",
        vis: (c) => c.g != null && c.g < NF && G.st[c.f][c.g] === "guerra",
        prob: (c) => 0.3 + c.r.di * 0.05,
        px: (c) => `según la diplomacia de ${c.r.n}`,
        si: (c) => {
          makePeace(c.f, c.g);
          return `${CIV[c.g].s} acepta la paz. El precio es la vergüenza, pero el reino sobrevive.`;
        },
        no: () => "Los heraldos vuelven con las orejas cortadas.",
        leg: { sa: 2 },
      },
      {
        t: "Rehacer la corte con lo que queda",
        tip: "+6 orden en el reino durante 5 años",
        ef: (c) => narEf(c.f, "orden", 6, 5, "Corte en el exilio"),
        leg: { pi: 2 },
      },
    ],
  },
  {
    id: "regreso",
    t: "El regreso",
    k: "Guerra",
    re: true,
    prio: 8,
    prep: (c) => {
      c.pv = G.P[c.d.p];
      if (!c.pv || c.pv.owner !== c.f) return false;
      c.anos = Math.max(1, narDesde(c.f, "exilio"));
      narQuita(c.f, "exilio");
    },
    d: (c) =>
      `Tras ${c.anos} año${c.anos > 1 ? "s" : ""} de exilio, ${narTit(c.r)} entra de nuevo en <b>${c.pv.name}</b>. El pueblo, que aclamó al invasor, aclama ahora al vencedor con la misma voz.`,
    o: [
      {
        t: "Castigar a los colaboradores",
        tip: "+30 oro confiscado",
        ef: (c) => OC.ganar(c.f, { oro: 30 }),
        leg: { cr: 5 },
      },
      {
        t: "Perdonar a todos",
        tip: (c) => `+20 orden en ${c.pv.name}`,
        ef: (c) => narOrden(c.f, 20, c.pv),
        leg: { pi: 5 },
      },
      {
        t: "Fundar un templo de la victoria",
        coste: { oro: 40 },
        tip: "+5 orden durante 10 años",
        ef: (c) => narEf(c.f, "orden", 5, 10, "Templo de la victoria", c.pv.id),
        leg: { gl: 5, pi: 2 },
        cr: (c) => `${narTit(c.r)} recupera ${c.pv.name} y funda allí un templo de la victoria.`,
      },
    ],
  },
  {
    id: "alzamiento",
    t: "La provincia perdida",
    k: "Reino",
    re: true,
    prio: 6,
    prep: (c) => {
      c.pv = G.P[c.d.p];
    },
    d: (c) =>
      `<b>${c.pv.name}</b> se ha alzado. Los bagaudas han quemado los registros del fisco y colgado al recaudador de la puerta de la ciudad. Las demás provincias miran hacia la corte.`,
    o: [
      {
        t: "Escarmiento en todo el reino",
        tip: "+4 orden durante 4 años",
        ef: (c) => narEf(c.f, "orden", 4, 4, "Escarmiento"),
        leg: { cr: 5 },
      },
      {
        t: "Aliviar los tributos",
        tip: "+8 orden, −5 oro al año (3 años)",
        ef: (c) => {
          narEf(c.f, "orden", 8, 3, "Alivio de tributos");
          narEf(c.f, "oro", -5, 3, "Tributos rebajados");
        },
        leg: { pi: 2, sa: 2 },
        cr: (c) => `Tras la revuelta de ${c.pv.name}, ${narTit(c.r)} rebaja los tributos en todo el reino.`,
      },
      {
        t: "Culpar al gobernador",
        tip: "+3 orden",
        ef: (c) => narOrden(c.f, 3),
        leg: { sa: 1 },
      },
    ],
  },
  {
    id: "coronacion",
    t: "Una nueva corona",
    k: "Corte",
    re: true,
    prio: 10,
    prep: (c) => {
      if (c.r.id !== c.d.c) return false;
      c.ant = G.C[c.d.a];
      c.pj = c.r;
      c.madre =
        c.r.mo != null && G.C[c.r.mo] && G.C[c.r.mo].alive && G.C[c.r.mo].f === c.f ? G.C[c.r.mo] : null;
      c.rival = pick(narAdultos(c.f, (x) => x.tr === "Ambicioso"));
    },
    d: (c) =>
      `${c.ant ? `Enterrado ${c.ant.n}, ` : ""}${narTit(c.r)} recibe la corona ${c.r.age < 16 ? "siendo aún un niño; otros gobernarán en su nombre" : "ante la corte reunida"}. El primer edicto de un reinado dice mucho de lo que vendrá.`,
    o: [
      {
        t: (c) => (c.madre ? `Regencia de ${c.madre.n}` : "Regencia de un consejo de nobles"),
        vis: (c) => c.r.age < 16,
        tip: "+6 orden durante 5 años",
        ef: (c) => narEf(c.f, "orden", 6, 5, "Regencia"),
        leg: { sa: 3 },
      },
      {
        t: "Amnistía general",
        tip: "+6 orden en el reino",
        ef: (c) => narOrden(c.f, 6),
        leg: { pi: 5 },
        cr: (c) => `${narTit(c.r)} abre su reinado con una amnistía general.`,
      },
      {
        t: "Juramento del ejército",
        vis: (c) => c.r.age >= 16,
        tip: "+6% en batalla durante 5 años",
        ef: (c) => narEf(c.f, "batalla", 0.06, 5, "Juramento del ejército"),
        leg: { gl: 5 },
        cr: (c) => `${narTit(c.r)} es alzad${narO(c.r)} sobre los escudos por el ejército.`,
      },
      {
        t: "Reforma de las leyes",
        tip: "+5 oro al año durante 5 años",
        ef: (c) => narEf(c.f, "oro", 5, 5, "Reforma de las leyes"),
        leg: { sa: 5 },
      },
      {
        t: (c) => (c.rival ? `Eliminar a ${c.rival.n}` : "Purga de los descontentos"),
        vis: (c) => c.r.age >= 16,
        tip: "+2 orden durante 5 años",
        ef: (c) => {
          if (c.rival) kill(c.rival, "muere estrangulado la noche de la coronación");
          narEf(c.f, "orden", 2, 5, "Purga");
        },
        leg: { cr: 6 },
        cr: (c) =>
          `${narTit(c.r)} empieza su reinado con sangre${c.rival ? `: ${c.rival.n} no ve el amanecer` : ""}.`,
      },
    ],
  },
  {
    id: "luto",
    t: "La muerte del heredero",
    k: "Corte",
    re: true,
    prio: 7,
    prep: (c) => {
      c.mu = G.C[c.d.c];
      if (!c.mu) return false;
      c.sos = pick(narAdultos(c.f, (x) => x.tr === "Ambicioso" || x.tr === "Cruel"));
    },
    d: (c) =>
      `${narB(c.mu)}, ${narO(c.mu, "heredero", "heredera")} del trono, ${c.d.m || "ha muerto"}. ${c.sos ? `En la corte se murmura que ${narB(c.sos)} no derramó una lágrima.` : "La corte viste de luto."}`,
    o: [
      {
        t: "Investigar la muerte",
        vis: (c) => !!c.sos,
        prob: (c) => 0.3 + c.r.in * 0.06,
        px: (c) => `según la intriga de ${c.r.n}`,
        si: (c) => {
          kill(c.sos, "es ejecutado por la muerte del heredero");
          return `Se halla veneno en una copa y una deuda pagada a un criado. ${c.sos.n} confiesa en el potro y muere.`;
        },
        no: (c) => {
          narOrden(c.f, -4);
          return "Nada se prueba. El silencio pesa más que una sentencia: −4 orden.";
        },
        leg: { cr: 2 },
      },
      {
        t: "Funerales solemnes",
        coste: { oro: 20 },
        tip: "+4 orden",
        ef: (c) => narOrden(c.f, 4),
        leg: { pi: 4 },
        cr: (c) => `Funerales solemnes por ${c.mu.n}. Todo el reino guarda luto.`,
      },
      { t: "Seguir adelante", leg: { sa: 1 } },
    ],
  },
  {
    id: "consorte",
    t: "Una consorte extranjera",
    k: "Corte",
    re: true,
    prio: 6,
    prep: (c) => {
      const sp = G.C[c.d.c];
      if (!sp || !sp.alive || sp.f !== c.f) return false;
      c.pj = sp;
      c.g = c.d.g;
    },
    d: (c) =>
      `${narB(c.pj)} llega de ${narPueblo(c.g)} con un séquito de damas, consejeros y sacerdotes que hablan entre ellos en su lengua. ${narFe(c.g) !== narFe(c.f) ? "Trae consigo su propia fe y su propio capellán." : "Comparte vuestra fe, pero no vuestras costumbres."}`,
    o: [
      {
        t: "Acoger a todo su séquito",
        tip: (c) => `+15 relación con ${CIV[c.g].s}`,
        ef: (c) => {
          relAdd(c.f, c.g, 15);
          narMk(c.f, "sequito_" + c.pj.id);
        },
        leg: { sa: 1 },
      },
      {
        t: "Despedir al séquito con regalos",
        coste: { oro: 20 },
        tip: (c) => `−5 relación con ${CIV[c.g].s}`,
        ef: (c) => relAdd(c.f, c.g, -5),
        leg: { sa: 1 },
      },
      {
        t: "Que abrace nuestra fe",
        vis: (c) => narFe(c.g) !== narFe(c.f),
        prob: (c) => 0.45 + c.r.di * 0.04,
        px: (c) => `según la diplomacia de ${c.r.n}`,
        si: (c) => `${c.pj.n} se bautiza en vuestra fe ante el pueblo. Los clérigos lo celebran.`,
        no: (c) => {
          relAdd(c.f, c.g, -10);
          c.pj.tr = "Ambicioso";
          return `${c.pj.n} se niega y escribe a su familia. −10 relación con ${CIV[c.g].s}.`;
        },
        leg: { pi: 3 },
      },
    ],
  },
  {
    id: "armas",
    t: "Llamada a las armas",
    k: "Guerra",
    re: true,
    prio: 8,
    prep: (c) => {
      c.g = c.d.g;
      if (c.g == null || !alive(c.g) || G.st[c.f][c.g] !== "guerra") return false;
    },
    d: (c) =>
      `Los heraldos de ${narTit(ruler(c.g))} han arrojado una lanza ensangrentada sobre tu frontera: ${narPueblo(c.g)} está en guerra contigo. ${narTit(c.r)} reúne al consejo antes del alba.`,
    o: [
      {
        t: "Leva de campesinos",
        tip: "+3 infantería en la capital, −5 orden",
        ef: (c) => {
          narTropa(c.cap, "i", 3);
          narOrden(c.f, -5);
        },
        leg: { gl: 1 },
        ia: 2,
      },
      {
        t: "Contratar mercenarios",
        coste: { oro: 50 },
        tip: "+2 caballería en la capital",
        ef: (c) => narTropa(c.cap, "c", 2),
      },
      {
        t: "Rogativas y ayunos",
        tip: "+5 orden durante 3 años",
        ef: (c) => narEf(c.f, "orden", 5, 3, "Rogativas de guerra"),
        leg: { pi: 3 },
      },
      {
        t: "Enviar un embajador a pedir la paz",
        req: (c) => narStat(c.r, "di", 5),
        prob: (c) => 0.2 + c.r.di * 0.05,
        px: (c) => `según la diplomacia de ${c.r.n}`,
        si: (c) => {
          makePeace(c.f, c.g);
          return "El embajador vuelve con un tratado. La guerra termina antes de empezar.";
        },
        no: () => "El embajador vuelve con las manos vacías y la barba quemada.",
        leg: { sa: 2 },
      },
    ],
  },
  {
    id: "sabios",
    t: "Los sabios de la corte",
    k: "Saber",
    re: true,
    prio: 3,
    d: (c) =>
      `Los maestros que han traído a tu reino ${c.d.t ? "el saber de «" + esc(typeof TEC !== "undefined" && TEC[c.d.t] ? TEC[c.d.t].n : String(c.d.t).replace(/[_-]/g, " ")) + "»" : "un saber nuevo"} piden casa, sueldo y discípulos. Otros reyes ya les han escrito.`,
    o: [
      {
        t: "Fundar una escuela",
        coste: { oro: 40 },
        tip: "+10% investigación durante 8 años",
        ef: (c) => narEf(c.f, "invest", 0.1, 8, "Escuela de la corte"),
        leg: { sa: 4 },
        cr: (c) => `Se funda en ${c.cap.name} una escuela para los sabios de la corte.`,
      },
      {
        t: "Darles un sueldo modesto",
        coste: { oro: 15 },
        tip: "+4% investigación durante 4 años",
        ef: (c) => narEf(c.f, "invest", 0.04, 4, "Sabios a sueldo"),
        leg: { sa: 1 },
      },
      { t: "Bastante han cobrado ya" },
    ],
  },
  {
    id: "hambre",
    t: "El hambre",
    k: "Reino",
    re: true,
    prio: 8,
    d: (c) =>
      `Los graneros están vacíos y los soldados desertan en busca de pan. En ${c.p.name} se han visto madres ofreciendo a sus hijos a los mercaderes de esclavos a cambio de un saco de harina.`,
    o: [
      {
        t: "Comprar trigo a cualquier precio",
        coste: { oro: 50 },
        tip: "+25 comida",
        ef: (c) => OC.ganar(c.f, { comida: 25 }),
        leg: { sa: 2 },
        ia: 2,
      },
      {
        t: "Requisar el grano de nobles y templos",
        tip: "+20 comida, −5 orden",
        ef: (c) => {
          OC.ganar(c.f, { comida: 20 });
          narOrden(c.f, -5);
        },
        leg: { cr: 3, pi: -2 },
      },
      {
        t: "Ayuno y oración",
        tip: "+3 orden durante 2 años",
        ef: (c) => narEf(c.f, "orden", 3, 2, "Ayuno"),
        leg: { pi: 3 },
      },
    ],
  },
  {
    id: "arcas",
    t: "Las arcas vacías",
    k: "Reino",
    re: true,
    prio: 8,
    d: () =>
      "El tesorero ha vuelto a contar las monedas y le salen menos que ayer. Los soldados esperan la paga y los proveedores ya no fían.",
    o: [
      {
        t: "Rebajar la ley de la moneda",
        tip: "+60 oro, −4 orden durante 4 años",
        ef: (c) => {
          OC.ganar(c.f, { oro: 60 });
          narEf(c.f, "orden", -4, 4, "Moneda falsa");
        },
        leg: { sa: -3 },
      },
      {
        t: "Pedir un préstamo a los mercaderes sirios",
        tip: "+80 oro; volverán a cobrar",
        ef: (c) => {
          OC.ganar(c.f, { oro: 80 });
          narMk(c.f, "deuda");
        },
        ia: 2,
      },
      {
        t: (c) => (narCristiano(c.f) ? "Fundir la plata de las iglesias" : "Fundir el oro de los templos"),
        tip: "+50 oro",
        ef: (c) => OC.ganar(c.f, { oro: 50 }),
        leg: { pi: -6, cr: 2 },
        cr: (c) => `${narTit(c.r)} funde la plata sagrada para pagar a sus soldados. Los clérigos lo anotan.`,
      },
    ],
  },
];

function narEraNombre(f, e) {
  const n = typeof tecEras === "function" && e !== "" && !isNaN(+e) ? tecEras(f)[+e] : isNaN(+e) ? e : "";
  return n ? ": «" + esc(n) + "»" : "";
}

/* ---------- prólogo y epílogo (textos en js/historia.js) ---------- */
async function narPrologo(f) {
  if (typeof NAR_PROLOGO === "undefined") return false;
  const id = narId0(f),
    ley = narLey() && typeof NAR_PROLOGO_LEY !== "undefined",
    P =
      (ley && (NAR_PROLOGO_LEY[id] || NAR_PROLOGO_LEY[narId0(civBase(f))])) ||
      NAR_PROLOGO[id] ||
      NAR_PROLOGO[narId0(typeof civBase === "function" ? civBase(f) : f)];
  if (!P) return false;
  return runEvent(
    { id: "prologo", t: P.t, d: P.d, o: narJuramentos(P.j) },
    {},
    { kick: ley ? `Prólogo · El mundo de leyendas · Año ${G.year}` : `Prólogo · Año ${G.year} d.C.` },
  );
}
function narJuramentos(j) {
  return [
    {
      t: j[0],
      tip: "+4 orden durante 6 años",
      ef: (c) => narEf(c.f, "orden", 4, 6, "Juramento sagrado"),
      leg: { pi: 6 },
      cr: (c) => `${narTit(c.r)} comienza su reinado con un juramento sagrado.`,
    },
    {
      t: j[1],
      tip: "+6% en batalla durante 6 años",
      ef: (c) => narEf(c.f, "batalla", 0.06, 6, "Juramento de guerra"),
      leg: { gl: 6 },
      cr: (c) => `${narTit(c.r)} comienza su reinado jurando ante sus guerreros.`,
    },
    {
      t: j[2],
      tip: "+5 oro al año durante 6 años",
      ef: (c) => narEf(c.f, "oro", 5, 6, "Juramento de buen gobierno"),
      leg: { sa: 6 },
      cr: (c) => `${narTit(c.r)} comienza su reinado prometiendo buen gobierno.`,
    },
    {
      t: j[3],
      tip: "+3 orden durante 6 años; los reyes desconfían",
      ef: (c) => narEf(c.f, "orden", 3, 6, "Escarmiento inaugural"),
      leg: { cr: 6 },
      cr: (c) => `${narTit(c.r)} comienza su reinado con un escarmiento.`,
    },
  ];
}
function narEpilogo(f) {
  const N = narF(f);
  if (N.epi != null) return Promise.resolve();
  const html = typeof narTextoEpilogo === "function" ? narTextoEpilogo(f) : "<p>Aquí termina la crónica.</p>";
  N.epi = html;
  narCron(f, "Aquí termina la crónica de la casa.", "nar-fin");
  return modal(`Epílogo · ${CIV[f].n}`, `<div class="nar-epi">${html}</div>`, [
    { t: "Cerrar los anales", cls: "gold" },
  ]);
}

/* ---------- pestaña «Anales» ---------- */
function narEfTxt(e) {
  const s = (v) => (v > 0 ? "+" : "−") + Math.abs(v);
  const pc = (v) => (v > 0 ? "+" : "−") + Math.round(Math.abs(v) * 100) + "%";
  const pn = e.p != null && G.P[e.p] ? " en " + G.P[e.p].name : "";
  return {
    orden: `${s(e.v)} orden${pn}`,
    oro: `${s(e.v)} oro/año`,
    comida: `${s(e.v)} comida/año`,
    batalla: `${pc(e.v)} en batalla${e.lado === "defensor" ? " al defender" : ""}`,
    invest: `${pc(e.v)} investigación`,
    diplo: `${pc(e.v)} diplomacia`,
  }[e.k];
}
function narLegEfectos(f) {
  const L = narF(f).leg,
    s = [];
  if (L.pi >= 13) s.push(`+${Math.round(L.pi * 0.04)} orden`);
  if (L.gl >= 9) s.push(`+${(L.gl * 0.06).toFixed(0)}% batalla`);
  if (L.sa >= 7) s.push(`+${Math.round(L.sa * 0.15)}% investigación`);
  if (L.cr >= 10) s.push(`−${Math.round(L.cr * 0.1)}% diplomacia, conquistas dóciles`);
  return s.length ? "Efecto: " + s.join(" · ") : "Tus actos aún no han dejado huella.";
}
function narPanel() {
  const f = ME,
    N = narF(f),
    r = ruler(f),
    reg = N.reyes[N.reyes.length - 1],
    ap = narApodo(f, r, reg);
  let h = `<h2>Anales</h2><p class="dim">${ttl(r)} ${r.n}${ap ? ` <i>«${ap}»</i>` : ""} · reina desde ${reg ? reg.d : G.year}</p>`;
  if (N.epi)
    h += `<details class="nar-det" open><summary>Epílogo</summary><div class="nar-epi">${N.epi}</div></details>`;
  h += `<h3>Legado</h3><div class="nar-leg">${NAR_LEG.map((L) => `<span>${L.n}</span><div class="bar"><i style="width:${N.leg[L.k]}%;background:${L.c}"></i></div><b>${N.leg[L.k]}</b>`).join("")}</div><p class="stats">${narLegEfectos(f)}</p>`;
  const ef = N.ef.filter((e) => e.h >= G.year);
  if (ef.length)
    h += `<h3>Influjos</h3>${ef.map((e) => `<div class="nar-li"><b>${e.t}</b> <span class="stats">${narEfTxt(e)} · hasta ${e.h}</span></div>`).join("")}`;
  const arcs = narArcos().filter((a) => N.arc[a.id]),
    fut = narArcos().filter((a) => !N.arc[a.id] && narArcoValido(a) && a.para(f)).length;
  h += `<h3>Historias</h3>`;
  h += arcs.length
    ? arcs
        .map((a) => {
          const A = N.arc[a.id],
            fin = A.fin && a.fines && a.fines[A.fin],
            u = A.h[A.h.length - 1];
          return `<div class="nar-arc${A.fin ? " fin" : ""}"><div class="hd"><b>${a.t}</b><span class="tag">${A.fin ? "concluida" : `cap. ${A.h.length}/${a.caps.length}`}</span></div><span class="stats">${fin ? fin.t : u ? `${u.t}: ${u.o.toLowerCase()}` : "en suspenso"}</span></div>`;
        })
        .join("")
    : '<p class="dim">La historia aún no ha empezado a escribirse.</p>';
  if (fut)
    h += `<p class="stats">${fut} historia${fut > 1 ? "s" : ""} aguarda${fut > 1 ? "n" : ""} su hora.</p>`;
  if (N.dec.length)
    h += `<details class="nar-det"><summary>Decisiones (${N.dec.length})</summary>${N.dec
      .slice(-12)
      .reverse()
      .map(
        (d) =>
          `<div class="nar-li"><span class="nar-y">${d.y}</span> ${d.t}: <i>${d.o}</i>${d.r === true ? " ✓" : d.r === false ? " ✗" : ""}</div>`,
      )
      .join("")}</details>`;
  if (N.cron.length) {
    let y0 = null;
    h += `<details class="nar-det"><summary>Crónica de la casa</summary>${N.cron
      .slice(-24)
      .reverse()
      .map((e) => {
        const cab = e.y !== y0 ? `<div class="nar-y">Año ${e.y}</div>` : "";
        y0 = e.y;
        return `${cab}<div class="nar-li ${e.c}">${e.m}</div>`;
      })
      .join("")}</details>`;
  }
  h += `<details class="nar-det"><summary>Linaje</summary>${N.reyes
    .map((x) => {
      const ap2 = x.h == null ? narApodo(f, G.C[x.id], x) : x.ap;
      return `<div class="nar-li"><b>${x.n}</b>${ap2 ? ` <i>«${ap2}»</i>` : ""} <span class="stats">${x.d}–${x.h ?? ""}</span></div>`;
    })
    .join("")}</details>`;
  return (
    h + '<p class="note">Tus decisiones forjan tu legado: influye en el orden, la guerra y la diplomacia.</p>'
  );
}
OC.panel({ id: "nar", titulo: "Anales", orden: 85, render: narPanel });

/* ---------- buzón y comienzo del año ---------- */
async function inboxItem(it) {
  const g = it.from;
  if (!alive(g) || !alive(ME)) return;
  const rn = `${ttl(ruler(g))} ${ruler(g).n} de ${CIV[g].s}`;
  if (it.k === "peace" && G.st[g][ME] === "guerra")
    await modal(
      "Oferta de paz",
      `<p>Un heraldo con rama de olivo cruza las líneas: ${rn} ofrece la paz. Tus generales callan; el tesorero respira.</p>`,
      [
        { t: "Aceptar la paz", fn: () => makePeace(ME, g), cls: "gold" },
        { t: "Rechazar", fn: () => relAdd(ME, g, -5) },
      ],
    );
  if (it.k === "ally" && G.st[g][ME] === "paz")
    await modal(
      "Propuesta de alianza",
      `<p>${rn} propone una alianza: amigos de sus amigos, enemigos de sus enemigos, y rehenes de buena familia en ambas cortes.</p>`,
      [
        { t: "Sellar la alianza", fn: () => ally(ME, g), cls: "gold" },
        { t: "Rechazar", fn: () => relAdd(ME, g, -5) },
      ],
    );
  if (it.k === "marry") {
    const a = G.C[it.a],
      b = G.C[it.b];
    if (!a?.alive || !b?.alive || a.sp != null || b.sp != null || a.f !== g || b.f !== ME) return;
    await modal(
      "Propuesta de matrimonio",
      `<p>${rn} propone casar a ${a.n} (${a.age} años, ${a.tr.toLowerCase()}) con tu ${b.sex === "m" ? "pariente" : "parienta"} ${b.n} (${b.age}). ${a.n} vendría a vivir a tu corte.</p>`,
      [
        { t: "Aceptar la boda", fn: () => marryAcross(b, a), cls: "gold" },
        { t: "Rechazar", fn: () => relAdd(ME, g, -10) },
      ],
    );
  }
}
async function narAnio(f, previos = 0) {
  const N = narF(f);
  if (N.my !== G.year) {
    N.my = G.year;
    N.mn = 0;
  }
  /* ritmo: como mucho 2 modales al año contando los de otros sistemas; si ya hubo 2, solo lo urgente */
  const tope = Math.max(0, 2 - previos),
    hecho = async (pr) => {
      if (await pr) N.mn++;
    };
  if (!N.ini) {
    N.ini = 1;
    if (G.year <= 410) {
      await hecho(narPrologo(f));
      return;
    }
  }
  if (G.year > 410) {
    if (!tope && !N.mn) await hecho(narProcesarCola(f, 9));
    if (N.mn < tope) await hecho(narProcesarCola(f));
    if (N.mn < tope) await hecho(narCadena(f));
    if (N.mn < tope) {
      const cp = narCapPendiente(f);
      if (cp) await hecho(narCapitulo(f, cp.arc, cp.cap));
    }
    if (N.mn < tope && R() < (N.mn ? 0.15 : 0.4)) await hecho(narAzar(f));
  }
  narMenor(f);
}
async function startTurn() {
  if (!G) return;
  if (G.over || !alive(ME)) {
    if (G.nar && G.F[ME] && narF(ME).epi == null) await narEpilogo(ME);
    return;
  }
  if (G.evY[ME] === G.year) return;
  G.evY[ME] = G.year;
  if (!G.nar) narInit();
  const m0 = OC.modales || 0;
  const box = G.inbox[ME] || [];
  G.inbox[ME] = [];
  for (const it of box) await inboxItem(it);
  narRevisar(ME);
  await OC.emitir("inicioTurno", ME);
  /* ritmo: modales ya abiertos este año (buzón, diplomacia, sociedad...) según OC.modales */
  if (!G.over && alive(ME)) await narAnio(ME, Math.max(0, (OC.modales || 0) - m0));
  narFoto(ME);
  ui();
  save();
}
