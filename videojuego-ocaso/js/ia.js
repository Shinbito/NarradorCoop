/* ---------- IA ---------- */
async function ai(f) {
  if (!alive(f) || G.over) return;
  const F = G.F[f];
  aiDiplo(f);
  const own = owned(f),
    th = (p) =>
      hostile(p, f).reduce((s, q) => s + pw(q.u) * (q.owner === REB ? 0.4 : 1), 0) + foes(p, f).length;
  own.forEach((p) => {
    p.tax = p.order < 38 ? 0 : p.order > 72 ? 2 : 1;
  });
  const e = inc(f),
    by = (a, b) => th(a) - th(b),
    bld = (p, k) => {
      if (p && F.gold >= BLD[k][2] && p[k] < 2) {
        p[k]++;
        F.gold -= BLD[k][2];
      }
    };
  if (e.net < 2) bld(own.filter((p) => p.farm < 2).sort(by)[0], "farm");
  else if (own.some((p) => p.order < 42)) bld(own.filter((p) => p.order < 42 && p.temple < 2)[0], "temple");
  else if (F.gold >= 110) bld(own.filter((p) => p.market < 2).sort(by)[0], "market");
  if (F.gold >= 140) bld(own.filter((p) => p.walls < 2).sort((a, b) => by(b, a))[0], "walls");
  const bord = own.filter((p) => foes(p, f).length).sort((a, b) => th(b) - th(a));
  for (const c of family(f).filter((c) => c.age >= 18 && c.sex === "m" && !genOf(c) && c.id !== F.ruler)) {
    const p = bord.find((p) => p.gen == null);
    if (!p) break;
    p.gen = c.id;
  }
  for (let g = 0; F.gold >= 10 && bord.length && g < 40; g++) {
    const ee = inc(f);
    if (ee.net < 0 && F.food + ee.net * 3 < 0) break;
    const p = bord[g % Math.min(2, bord.length)],
      mix = { i: 0, a: 0, c: 0 };
    hostile(p, f).forEach((q) => add(mix, q.u));
    let t = tot(mix) ? { i: "a", a: "c", c: "i" }[TYP.slice().sort((a, b) => mix[b] - mix[a])[0]] : "i";
    if (R() < 0.3) t = pick(TYP);
    if (cost(f, t) > F.gold || (t === "c" && ee.net < 2)) t = "i";
    if (cost(f, t) > F.gold) break;
    p.u[t]++;
    F.gold -= cost(f, t);
  }
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
    const my = pw(p.u) * gb(p.gen);
    const tg = hs
      .map((q) => ({
        q,
        s:
          (my / (pw(q.u) * (1 + 0.25 * q.walls) * gb(q.gen) + 3)) *
          (q.owner === REB ? 1.15 : 1) *
          (q.cap ? 1.2 : 1),
      }))
      .sort((a, b) => b.s - a.s)[0];
    if (tg.s > 1.45) await march(p.id, tg.q.id, foes(p, f).length > 1 ? 0.8 : 1, true);
  }
}
