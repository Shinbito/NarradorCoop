/* ---------- IA ----------
   Sistema de COMBATE (parte militar). Recluta una mezcla de clases según la doctrina de su pueblo
   y las tropas enemigas vecinas, y ataca solo cuando sus capitanes ven la batalla ganable
   (simula el mismo modelo de factores: murallas, terreno, veteranía, general, clases). */
const CMB_DOC = [
  { l: 2, i: 4, p: 2, h: 1, a: 2, x: 1, c: 1.5, k: 1 },
  { l: 1.5, i: 2.5, p: 1, h: 1, a: 2.5, x: 1, c: 2, k: 1.5, m: 1.5 },
  { l: 3, i: 4, p: 1.5, h: 1.5, a: 1, c: 2, k: 1.5 },
  { l: 1, i: 1.5, a: 1, x: 2, c: 3, k: 1, m: 4 },
  { l: 2, i: 3, p: 1, h: 1.5, a: 1, x: 2, c: 2.5 },
  { l: 3, i: 5, p: 2, h: 2, a: 1, c: 1 },
  { l: 2, i: 1.5, p: 1, h: 1, a: 3.5, x: 1.5, c: 2.5, k: 2, m: 1.5 },
  { l: 2, i: 4, a: 1, c: 1 },
];
/* elige qué clase reclutar en p: la que más se aleja de la proporción deseada */
function cmbIAElegir(f, p, disp, F, net) {
  const doc = CMB_DOC[f] || CMB_DOC[7],
    ene = cmbVacio();
  hostile(p, f).forEach((q) => cmbSuma(ene, q.u));
  const ne = tot(ene) || 1,
    sh = (l) => l.reduce((s, t) => s + (ene[t] || 0), 0) / ne,
    eCab = sh(["x", "c", "k", "m"]),
    eDis = sh(["h", "a", "m"]),
    eInf = sh(["l", "i", "p"]),
    w = {};
  for (const t of disp) {
    let v = doc[t] || 0.3;
    if (t === "l") v *= 1 + 2.5 * eCab;
    if (t === "x" || t === "c") v *= 1 + 1.5 * eDis;
    if (t === "a" || t === "k" || t === "p") v *= 1 + eInf;
    if (UN[t].food > 1 && net < 2) v *= 0.15;
    const c = cmbCoste(f, t, p);
    if (c > F.gold) v = 0;
    if (c > 24 && F.gold < c * 1.6) v *= 0.4;
    w[t] = v;
  }
  const sw = Object.values(w).reduce((a, b) => a + b, 0);
  if (!sw) return null;
  if (R() < 0.2) {
    let x = R() * sw;
    for (const t in w) if ((x -= w[t]) < 0) return t;
  }
  const n = tot(p.u) + 1;
  return Object.keys(w)
    .filter((t) => w[t] > 0)
    .sort((a, b) => w[b] / sw - (p.u[b] || 0) / n - (w[a] / sw - (p.u[a] || 0) / n))[0];
}
async function ai(f) {
  if (!alive(f) || G.over) return;
  const F = G.F[f];
  aiDiplo(f);
  const own = owned(f);
  own.forEach((p) => cmbNorm(p.u));
  const th = (p) =>
    hostile(p, f).reduce((s, q) => s + pw(q.u) * (q.owner === REB ? 0.4 : 1), 0) + foes(p, f).length;
  /* impuestos: economía (turnoIA); edificios: tecnología (economiaFaccion) */
  const bord = own.filter((p) => foes(p, f).length).sort((a, b) => th(b) - th(a));
  for (const c of family(f).filter(
    (c) => c.age >= 18 && c.sex === "m" && !genOf(c) && c.id !== F.ruler && !c.dipReh,
  )) {
    const p = bord.find((p) => p.gen == null);
    if (!p) break;
    p.gen = c.id;
  }
  /* dónde reclutar: las dos fronteras más amenazadas y, si arma mejor (cada ciudad tiene sus cuarteles),
     la provincia propia con más clases disponibles; desde allí marchará luego al frente */
  const sitios = bord.slice(0, 2),
    mejor = own
      .filter((p) => !sitios.includes(p))
      .map((p) => ({ p, n: cmbDisp(f, p).ok.length }))
      .sort((a, b) => b.n - a.n)[0];
  if (mejor && sitios.length && mejor.n > Math.max(...sitios.map((p) => cmbDisp(f, p).ok.length)))
    sitios.push(mejor.p);
  for (let g = 0; F.gold >= 8 && sitios.length && g < 40; g++) {
    const ee = inc(f);
    if (ee.net < 0 && F.food + ee.net * 3 < 0) break;
    /* soldada: inc(f).g es el saldo neto del año; no endeudarse por reclutar */
    if (ee.g < -Math.max(3, owned(f).length)) break;
    const p = sitios[g % sitios.length],
      t = cmbIAElegir(f, p, cmbDisp(f, p).ok, F, ee.net);
    if (!t) break;
    const sold = typeof ecoMant === "function" ? ecoMant(f, t).oro : 0;
    if (F.gold - cmbCoste(f, t, p) < Math.max(0, -ee.g) * 2 + sold * 3 || !cmbReclutar(f, p, t)) break;
  }
  /* oro ocioso (p. ej. sin comida para más levas): instrucción de las guarniciones de frontera */
  const gNeto = inc(f).g;
  for (const p of [...bord, ...own.filter((x) => !bord.includes(x))])
    if (gNeto > 0 && F.gold > 120 + 12 * own.length + cmbInstrCoste(p)) cmbInstruir(f, p);
  for (const p of own) {
    if (G.over) return;
    if (p.owner !== f || p.tired || pw(p.u) < 10) continue;
    const hs = hostile(p, f);
    if (!foes(p, f).length) {
      const n = MAP.adj[p.id]
        .map((i) => G.P[i])
        .filter((q) => q.owner === f)
        .sort((a, b) => foes(b, f).length - foes(a, f).length)[0];
      if (n && foes(n, f).length) await march(p.id, n.id, 1, true);
      continue;
    }
    if (!hs.length) continue;
    const fr = foes(p, f).length > 1 ? 0.8 : 1,
      u = cmbVacio();
    for (const t of TYP) u[t] = fr >= 1 ? p.u[t] : Math.floor(p.u[t] * fr);
    const my = pw(u) * gb(p.gen),
      cand = hs
        .map((q) => ({
          q,
          s:
            (my / (pw(q.u) * (1 + 0.25 * q.walls) * gb(q.gen) + 3)) *
            (q.owner === REB ? 1.15 : 1) *
            (q.cap ? 1.2 : 1),
        }))
        .filter((c) => c.s > 0.9)
        .sort((a, b) => b.s - a.s)
        .slice(0, 2);
    let mejor = null;
    for (const c of cand) {
      const q = c.q,
        pr = tot(q.u)
          ? cmbEstimar(
              { f, u, gen: fr >= 1 ? p.gen : null, vet: cmbVetDe(p), ori: cmbOriDe(p), fat: 10 },
              { f: q.owner, u: q.u, gen: q.gen, vet: cmbVetDe(q), ori: cmbOriDe(q) },
              { fort: q.walls || 0, p: q, terreno: cmbTerreno(q) },
              5,
            )
          : 1,
        lim = 0.66 / ((q.owner === REB ? 1.1 : 1) * (q.cap ? 1.1 : 1));
      if (pr >= lim && (!mejor || pr * c.s > mejor.v)) mejor = { q, v: pr * c.s };
    }
    if (mejor) await march(p.id, mejor.q.id, fr, true);
  }
}
