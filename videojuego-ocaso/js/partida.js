/* ---------- partida ---------- */
function cands(f) {
  const c = CIV[f];
  return [0, 1, 2].map((i) => {
    const sex = i === 2 && R() < 0.6 ? "f" : "m";
    return trait({
      n: pick(sex === "m" ? c.m : c.f),
      sex,
      age: ri(24, 48),
      ma: ri(2, 8),
      in: ri(2, 8),
      di: ri(2, 8),
      ge: ri(2, 8),
      tr: pick(Object.keys(TRAITS)),
    });
  });
}
/* opts (MUNDO): {modo: 'historico'|'leyendas', activas: [índices]} — sin opts, el modo histórico de siempre */
function newGame(me, cand, opts = {}) {
  const modo = opts.modo === "leyendas" ? "leyendas" : "historico",
    act = modo === "leyendas" ? mundoNormActivas(me, opts.activas) : MUNDO_HIST.slice(),
    dim = mundoDims(modo, act.length);
  MAP = gen(Math.floor(R() * 1e9), dim);
  ME = me;
  const nm = PNAMES.slice().sort(() => R() - 0.5);
  G = {
    seed: MAP.seed,
    modo,
    activas: act,
    mapa: dim,
    year: 410,
    P: [],
    C: [],
    F: [],
    rel: [],
    st: [],
    log: [],
    nc: {},
    inbox: {},
    evY: {},
    over: null,
    human: [me],
  };
  G.dip = dipInit();
  G.P = MAP.pts.map((p, i) => ({
    id: i,
    name: nm[i] || "Provincia " + (i + 1),
    x: p.cx,
    y: p.cy,
    owner: REB,
    cap: false,
    home: REB,
    u: { i: ri(2, 4), a: ri(0, 2), c: 0 },
    farm: 0,
    market: 0,
    walls: 0,
    temple: 0,
    tax: 1,
    order: 55,
    tired: false,
    gen: null,
    recent: 0,
  }));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    caps = [G.P.reduce((b, p) => (p.x < b.x ? p : b))];
  while (caps.length < act.length) {
    const md = (p) => Math.min(...caps.map((c) => dist(c, p)));
    caps.push(G.P.filter((p) => !caps.includes(p)).reduce((b, p) => (md(p) > md(b) ? p : b)));
  }
  caps.sort((a, b) => a.x - b.x);
  for (let f = 0; f < NF; f++) {
    G.rel.push(Array(NF).fill(0));
    G.st.push(Array(NF).fill("paz"));
  }
  if (modo === "historico") [5, 2, 0, 4, 3, 1, 6].forEach((f, i) => setup(f, caps[i], f === me ? cand : null));
  else mundoRepartir(caps, act).forEach(({ f, p }) => setup(f, p, f === me ? cand : null));
  /* los pueblos que no juegan: sin tierras ni corte (alive(f) falso) */
  for (let f = 0; f < NF; f++) if (!G.F[f]) G.F[f] = mundoAusente(f);
  for (const f of act) {
    const ex = MAP.adj[G.F[f].capId]
      .map((i) => G.P[i])
      .filter((q) => q.owner === REB)
      .slice(0, modo === "historico" && f < 2 ? 3 : 2);
    ex.forEach((q) => {
      q.owner = f;
      q.home = f;
      q.order = 65;
      q.u = { i: 3, a: 1, c: 0 };
    });
  }
  /* opinión inicial: trato general al azar + recuerdos permanentes de fe */
  for (const a of act)
    for (const b of act) {
      if (b <= a) continue;
      G.rel[a][b] = G.rel[b][a] = ri(-10, 10);
      const ra = CIV[a].rel,
        rb = CIV[b].rel;
      if (ra === rb) dipMem(a, b, "fe", "Misma fe", 12, 0);
      else if ((ra === "niceno" && rb === "arriano") || (ra === "arriano" && rb === "niceno"))
        dipMem(a, b, "credo", "Disputa de credo", -8, 0);
    }
  if (modo === "historico") {
    const set = (a, b, s, v) => {
      G.st[a][b] = G.st[b][a] = s;
      G.rel[a][b] = G.rel[b][a] = v;
    };
    set(0, 1, "alianza", 50);
    set(3, 1, "guerra", -40);
    set(3, 0, "paz", -25);
    set(2, 0, "paz", -20);
    set(6, 1, "guerra", -35);
    set(4, 0, "paz", -15);
    dipMem(1, 6, "rival", "Rivales de siempre", -10, 0);
    dipAdd("alianza", 0, 1, { sub: "defensiva" }, true);
    /* los francos, federados de Roma en la Galia */
    dipAdd("vasallaje", 0, 5, { trib: 6, imp: 0 }, true);
  } else mundoNombrar();
  sel = G.F[me].capId;
  aim = 0;
  tab = "prov";
  centerOn(sel);
  addLog(
    modo === "historico"
      ? `Año 410 d.C. ${ttl(ruler(me))} ${ruler(me).n} gobierna ${CIV[me].n}. El imperio se resquebraja: es tu hora.`
      : `Año 410 de las crónicas. ${ttl(ruler(me))} ${ruler(me).n} gobierna ${CIV[me].n} en un mundo de leyendas donde ${act.length} pueblos se disputan la tierra.`,
    "turn",
  );
}
function setup(f, p, cand) {
  Object.assign(p, {
    owner: f,
    cap: true,
    home: f,
    /* MUNDO: guarnición propia (CIV[f].u0: hunos y mongoles a caballo; América sin caballos) */
    u: CIV[f].u0 ? { ...CIV[f].u0 } : { i: 6, a: 4, c: 2 },
    walls: 1,
    farm: 1,
    market: 1,
    order: 70,
  });
  const r = mkChar(f, cand ? cand.sex : R() < 0.9 ? "m" : "f", cand ? cand.age : ri(28, 46));
  if (cand)
    Object.assign(r, {
      n: cand.n,
      ma: cand.ma,
      in: cand.in,
      di: cand.di,
      ge: cand.ge,
      tr: cand.tr,
      amb: cand.amb,
      lea: cand.lea,
    });
  const sp = mkChar(f, r.sex === "m" ? "f" : "m", clamp(r.age + ri(-6, 3), 18, 60));
  marry(r, sp, true);
  const [fa, mo] = r.sex === "m" ? [r.id, sp.id] : [sp.id, r.id];
  for (let k = ri(1, 3); k > 0; k--) mkChar(f, R() < 0.55 ? "m" : "f", ri(0, 15), fa, mo);
  const br = mkChar(f, "m", ri(20, 34));
  p.gen = br.id;
  G.F[f] = {
    gold: 80,
    food: 25,
    ruler: r.id,
    heir: null,
    amb: R(),
    tre: R() * 0.8 + 0.1,
    asn: 0,
    dip: {},
    capId: p.id,
  };
  autoHeir(f);
}
/* ---------- población de la corte ----------
   Las familias no pueden crecer sin freno (el estado se guarda entero en G): tope de parientes vivos
   por pueblo según sus provincias; la casa principal (soberano, heredero e hijos del soberano) sigue
   teniendo hijos, las casas menores menos y nada al llegar al tope; la IA casa con mesura.
   narrativa.js (life) consulta dipProbNacer y dipProbBodaIA. */
const dipTopeFamilia = (f) => Math.min(40, 8 + 2 * owned(f).length);
let dipFamCache = null;
function dipFamiliaN(f) {
  if (!dipFamCache || dipFamCache.y !== G.year || dipFamCache.n !== G.C.length) {
    const cnt = {};
    for (const c of G.C) if (c.alive && c.linaje !== false) cnt[c.f] = (cnt[c.f] || 0) + 1;
    dipFamCache = { y: G.year, n: G.C.length, cnt };
  }
  return dipFamCache.cnt[f] || 0;
}
function dipCasaMayor(c) {
  const F = G.F[c.f];
  return !!F && (c.id === F.ruler || c.id === F.heir || c.fa === F.ruler || c.mo === F.ruler);
}
/* probabilidad anual de que la pareja (madre m, padre h) tenga un hijo */
function dipProbNacer(m, h) {
  const f = m.f,
    lleno = dipFamiliaN(f) / dipTopeFamilia(f),
    hijos = kidsOf(m).length;
  if (dipCasaMayor(m) || dipCasaMayor(h)) return hijos >= 6 ? 0 : lleno >= 1 ? 0.12 : 0.24;
  return hijos >= 3 || lleno >= 1 ? 0 : 0.14 * (1 - lleno);
}
/* probabilidad anual de que la IA case a un soltero adulto de su corte */
function dipProbBodaIA(f, c) {
  const lleno = dipFamiliaN(f) / dipTopeFamilia(f);
  if (dipCasaMayor(c)) return lleno >= 1.2 ? 0.05 : 0.2;
  return lleno >= 0.8 ? 0 : 0.08 * (1 - lleno);
}
/* los muertos de hace años quedan en un esbozo (los ids son índices: no se pueden borrar) */
const DIP_STUB = [
  "id",
  "n",
  "f",
  "sex",
  "age",
  "fa",
  "mo",
  "sp",
  "tr",
  "alive",
  "dm",
  "linaje",
  "mundoAusente",
  "rol",
];
function dipCompactar() {
  if (!G || !G.C) return 0;
  let k = 0;
  for (const c of G.C) {
    if (!c || c.alive || c.st) continue;
    if (c.dm == null) c.dm = G.year;
    if (G.year - c.dm < 5) continue;
    for (const key of Object.keys(c)) if (!DIP_STUB.includes(key)) delete c[key];
    c.st = 1;
    k++;
  }
  return k;
}
OC.on("finAnio", dipCompactar);
function heirCands(f) {
  const r = ruler(f),
    ks = kidsOf(r)
      .filter((c) => c.alive && c.f === f && c.linaje !== false)
      .sort((a, b) => (a.sex === b.sex ? b.age - a.age : a.sex === "m" ? -1 : 1));
  return ks.concat(
    family(f)
      .filter(
        (c) =>
          c.id !== r.id &&
          !ks.includes(c) &&
          c.age >= 16 &&
          c.id !== r.sp &&
          !c.dipCort &&
          c.linaje !== false,
      )
      .sort((a, b) => b.age - a.age),
  );
}
function autoHeir(f) {
  const F = G.F[f];
  const h = G.C[F.heir];
  if (h && h.alive && h.f === f && h.id !== F.ruler) return;
  F.heir = heirCands(f)[0]?.id ?? null;
}
function kill(c, why) {
  if (!c || !c.alive) return;
  c.alive = false;
  c.dm = G.year;
  G.P.forEach((p) => {
    if (p.gen === c.id) p.gen = null;
  });
  if (c.sp != null && G.C[c.sp]) G.C[c.sp].sp = null;
  OC.emitirSync("muertePersonaje", { c, motivo: why });
  const F = G.F[c.f];
  if (!F) return;
  const imp = isMe(c.f) || F.ruler === c.id;
  if (imp) addLog(`${c.n} (${CIV[c.f].s}) ${why}.`, isMe(c.f) ? "bad" : "");
  if (F.ruler === c.id) succession(c.f, c);
  else if (F.heir === c.id) {
    F.heir = null;
    autoHeir(c.f);
  }
}
function succession(f, dead) {
  const F = G.F[f];
  let h = G.C[F.heir];
  if (!h || !h.alive || h.f !== f) h = heirCands(f)[0];
  if (!h) {
    /* sin sangre real: un general de renombre (nivel 4+) aclamado por las tropas, el consejero
       más capaz o un noble cualquiera */
    const val = (c) => c.ma + c.in + c.di + c.ge + (c.nivel || 0) * 2,
      gen = family(f)
        .filter((c) => c.linaje === false && c.age >= 16 && (c.nivel || 0) >= 4)
        .sort((a, b) => val(b) - val(a))[0];
    h =
      gen ||
      family(f)
        .filter((c) => c.dipCort && c.age >= 16)
        .sort((a, b) => val(b) - val(a))[0];
    if (h) {
      delete h.dipCort;
      h.linaje = true;
    } else h = mkChar(f, "m", ri(25, 40));
    addLog(
      gen
        ? `Sin herederos en ${CIV[f].s}: las tropas aclaman a su general ${h.n}, que funda una nueva dinastía.`
        : `Sin herederos en ${CIV[f].s}: el noble ${h.n} toma el poder y funda una nueva dinastía.`,
      isMe(f) ? "bad" : "",
    );
    owned(f).forEach((p) => (p.order -= 15));
  }
  F.ruler = h.id;
  F.heir = null;
  autoHeir(f);
  const m = `Muere ${dead.n}. ${ttl(h)} ${h.n} (${h.age} años) asciende al trono de ${CIV[f].s}${h.age < 16 ? " bajo una regencia" : ""}.`;
  addLog(m, isMe(f) ? "bad" : "");
  OC.emitirSync("sucesion", { f, anterior: dead, nuevo: h });
  if (isMe(f))
    modal(
      "El trono pasa a otras manos",
      `<p>${m}</p><p class="dim">Rasgo: ${h.tr}. Mando ${h.ma} · Astucia ${h.in} · Diplomacia ${h.di} · Gestión ${h.ge}</p>`,
      [{ t: "Larga vida al soberano" }],
    );
}

/* ---------- panel de dinastía ---------- */
function dipRol(c, F, r) {
  const car = typeof socCargoNombre === "function" ? socCargoNombre(c) : "";
  if (c.id === F.heir) return "Heredero";
  if (c.dipReh != null) return "Rehén en " + CIV[c.dipReh].s;
  if (genOf(c)) return "General en " + genOf(c).name;
  const gp = G.P.find((p) => p.gob === c.id && p.owner === c.f);
  if (gp) return "Gobierna " + gp.name;
  if (car) return car;
  if (c.id === r.sp) return "Consorte";
  if (c.age < 16) return "Menor";
  return c.dipCort ? "Cortesano" : "Noble";
}
function dynPanel(dis) {
  const F = G.F[ME],
    r = ruler(ME),
    hr = G.C[F.heir],
    sp = G.C[r.sp],
    lg = typeof socLegit === "function" ? socLegit(ME, hr) : null;
  let h = `<h2 style="color:var(--gold)">${ttl(r)} ${r.n} <button class="dip-x" data-act="renombrar-${r.id}" title="Renombrar" aria-label="Renombrar">✎</button></h2><p class="dim">${r.age} años${r.age < 16 ? " · regencia" : ""} · ${r.tr}: ${TRAITS[r.tr] || ""}<br>${cline(r)}</p>`;
  h += `<p>Consorte: ${sp && sp.alive ? `${sp.n} (${sp.age})` : '<span class="dim">ninguno</span>'}<br>Heredero: ${hr ? `<b>${hr.n}</b> (${hr.age})` : '<span class="dim">sin designar</span>'}${lg && lg.t.length ? `<br><span class="dip-cb">Sucesión discutida: ${lg.t.join("; ")}</span>` : ""}</p>`;
  h += `<h3>Familia y corte</h3>`;
  /* los mandos de carrera (linaje:false) no son de la dinastía: se listan en la Corte */
  for (const c of family(ME)
    .filter((c) => c.id !== r.id && c.linaje !== false)
    .sort((a, b) => b.age - a.age)) {
    const role = dipRol(c, F, r),
      par = c.fa != null && G.C[c.fa] ? `${c.sex === "m" ? "hijo" : "hija"} de ${G.C[c.fa].n}` : "",
      spc = G.C[c.sp],
      lea = Math.round(c.lea ?? 50);
    h += `<div class="row"><div class="hd"><b>${c.n} <button class="dip-x" data-act="renombrar-${c.id}" title="Renombrar" aria-label="Renombrar">✎</button></b><span class="tag">${role}</span></div><span class="stats">${c.sex === "m" ? "♂︎" : "♀︎"} ${c.age} años ${par ? "· " + par : ""}${spc && spc.alive ? " · casado/a con " + spc.n : ""}</span><br>${cline(c)}`;
    if (c.age >= 12)
      h += `<br><span class="stats">Lealtad <b class="${lea < 30 ? "neg" : lea > 70 ? "pos" : ""}">${lea}</b> · ambición ${c.amb ?? 5}</span>`;
    h += `<div class="btns">${c.id !== F.heir && c.id !== r.sp && !c.dipCort ? `<button data-act="heir-${c.id}" ${dis ? "disabled" : ""}>Designar heredero</button>` : ""}${c.sp == null && c.age >= 16 && c.dipReh == null ? `<button data-act="marry-${c.id}" ${dis ? "disabled" : ""}>Concertar boda</button>` : ""}</div></div>`;
  }
  const reh = G.C.filter((c) => c.alive && c.dipReh === ME);
  if (reh.length)
    h += `<p class="stats">Rehenes en tu corte: ${reh.map((c) => `${c.n} (${CIV[c.f].s})`).join(", ")}</p>`;
  const nm = family(ME).filter((c) => c.linaje === false).length;
  if (nm) h += `<p class="stats">${nm} mandos de carrera sirven al reino: ver la pestaña Corte.</p>`;
  h += OC.renderSecciones("dyn", { F, r }, dis);
  return (
    h +
    '<p class="note">Cada año la corte envejece, nacen hijos y alguno muere. Los parientes desleales y ambiciosos conspiran.</p>'
  );
}
OC.accion("heir", (v) => {
  const c = G.C[+v],
    F = G.F[ME];
  if (!c || !c.alive || c.f !== ME || c.id === F.ruler || c.linaje === false) return;
  const lg = typeof socLegit === "function" ? socLegit(ME, c) : { t: [] },
    hazlo = () => {
      const prev = G.C[F.heir];
      F.heir = c.id;
      if (typeof socNuevoHeredero === "function") socNuevoHeredero(ME, c, prev);
      addLog(`${c.n} es designado heredero.`);
    };
  if (!lg.t.length) return hazlo();
  modal(
    "¿Designar heredero?",
    `<p>${c.n} no es el heredero que la corte espera.</p><p class="dim">${lg.t.join("<br>")}</p>`,
    [{ t: "Designarlo igualmente", cls: "red", fn: hazlo }, { t: "Cancelar" }],
  );
});
OC.accion("marry", (v) => {
  const c = G.C[+v];
  if (!c || !c.alive || c.f !== ME || c.linaje === false) return;
  marryModal(c);
});
