/* ---------- movimiento y combate de campaña ---------- */
async function march(from, to, frac, fast) {
  const p = G.P[from],
    q = G.P[to],
    s = {};
  for (const t in p.u) s[t] = frac >= 1 ? p.u[t] : Math.floor(p.u[t] * frac);
  if (!tot(s)) return;
  for (const t in s) p.u[t] -= s[t];
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
  await settle(p, q, s, g);
}
function autoBattle(fa, fd, A, D, fort, gA, gD) {
  A = { ...A };
  D = { ...D };
  const hp = (f, t) => UN[t].hp * CIV[f].bon[t].hp;
  const dmg = (X, Y, fx, k) => {
    const ty = tot(Y);
    if (!ty) return 0;
    let s = 0;
    for (const t in X)
      for (const u in Y) s += (X[t] * UN[t].atk * CIV[fx].bon[t].atk * MULT[t][u] * Y[u]) / ty;
    return s * 0.5 * k * (0.85 + R() * 0.3);
  };
  const kl = (X, fx, d) => {
    const ht = TYP.reduce((s, t) => s + X[t] * hp(fx, t), 0);
    if (!ht) return;
    for (const t of TYP) {
      const k = (d * ((X[t] * hp(fx, t)) / ht)) / hp(fx, t),
        l = Math.floor(k) + (R() < k % 1 ? 1 : 0);
      X[t] = Math.max(0, X[t] - l);
    }
  };
  for (let r = 0; r < 8 && tot(A) > 0 && tot(D) > 0; r++) {
    const a = dmg(A, D, fa, gb(gA)),
      d = dmg(D, A, fd, gb(gD) * (1.1 + 0.25 * fort));
    kl(D, fd, a);
    kl(A, fa, d);
  }
  return { win: tot(D) === 0 && tot(A) > 0, A, D };
}
const armyTxt = (f, u, g) =>
  `${CIV[f].s}: ${tot(u)} soldados${g != null && G.C[g] ? " al mando de " + G.C[g].n : ""}`;
async function settle(p, q, s, g) {
  const f = p.owner;
  if (q.owner === f) {
    add(q.u, s);
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
    d0 = tot(q.u);
  let res;
  if (isMe(f) && d0 > 0) {
    const ch = await modal(
      `Batalla por ${q.name}`,
      `<p>${armyTxt(f, s, g)}<br>contra ${armyTxt(old, q.u, gD)}${q.walls ? ", tras murallas de nivel " + q.walls : ""}.</p><p class="dim">Fuerza estimada: ${Math.round(pw(s) * gb(g))} contra ${Math.round(pw(q.u) * gb(gD) * (1.1 + 0.25 * q.walls))}. En el campo, cada punto de tropa son ${SPU} soldados: ${tot(s) * SPU} contra ${tot(q.u) * SPU}.</p><p>¿Cómo quieres librarla?</p>`,
      [
        { t: "Por turnos · 3 acciones", v: "t3", cls: "gold" },
        { t: "Por turnos · 1 acción", v: "t1", cls: "gold" },
        { t: "Tiempo real", v: "rt", cls: "gold" },
        { t: "Resolución automática", v: "auto" },
      ],
    );
    res =
      ch !== "auto"
        ? await tactical(f, old, s, { ...q.u }, q.walls, g, gD, q.name, ch)
        : autoBattle(f, old, s, q.u, q.walls, g, gD);
  } else res = autoBattle(f, old, s, q.u, q.walls, g, gD);
  const { win, A, D } = res;
  OC.emitirSync("batallaResuelta", { p: q, atacante: f, defensor: old, gana: win, A, D, s0: s, gA: g, gD });
  flash = { x: q.x * T + 4, y: q.y * T + 4, t0: performance.now() };
  const cls = isMe(f) ? "good" : isMe(old) ? "bad" : "";
  if (win) {
    if (gD != null && R() < 0.5) kill(G.C[gD], "cae defendiendo " + q.name);
    Object.assign(q, {
      owner: f,
      u: A,
      tired: true,
      recent: 3,
      order: Math.min(q.order, 45),
      tax: 1,
      gen: g,
    });
    if (q.walls) q.walls--;
    OC.emitirSync("conquista", { p: q, de: old, a: f });
    if (CIV[f].loot) G.F[f].gold += CIV[f].loot;
    addLog(
      `${CIV[f].s} conquista ${q.name}${old !== REB ? " a " + CIV[old].s : ""}. Bajas: ${n0 - tot(A)} propias, ${d0} enemigas.`,
      cls,
    );
    if (q.cap && old < REB && q.home === old) addLog(`¡Cae la capital de ${CIV[old].s}!`, cls);
    if (old < REB && !alive(old))
      addLog(`${CIV[old].n} desaparece de la historia.`, isMe(old) ? "bad" : "good");
  } else {
    q.u = D;
    add(p.u, A);
    p.tired = true;
    if (g != null) {
      if (!tot(A) && R() < 0.5) kill(G.C[g], "muere en " + q.name);
      else if (p.gen == null) p.gen = g;
    }
    addLog(
      `${CIV[f].s} fracasa en ${q.name}. Bajas: ${n0 - tot(A)} propias, ${d0 - tot(D)} enemigas.`,
      isMe(f) ? "bad" : isMe(old) ? "good" : "",
    );
  }
  checkEnd();
}
