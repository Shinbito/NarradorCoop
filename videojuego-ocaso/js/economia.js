/* ---------- economía ---------- */
function yields(p) {
  const r = G.F[p.owner] ? ruler(p.owner) : null,
    gm = r ? 1 + (r.ge - 5) * 0.03 : 1;
  const y = {
    g: Math.round(
      (4 * TAXM[p.tax] + p.market * 5 + (p.cap ? 6 : 0)) * CIV[p.owner].gold * gm * (p.order < 35 ? 0.5 : 1),
    ),
    fo: 4 + p.farm * 5 + (p.cap ? 4 : 0),
  };
  /* OC 'rendimiento': {g, fo} de una provincia. ctx {p, f} */
  const r2 = OC.calc("rendimiento", y, { p, f: p.owner });
  return { ...r2, g: Math.round(r2.g), fo: Math.round(r2.fo) };
}
function inc(f) {
  let g = 0,
    fo = 0,
    up = 0;
  for (const p of owned(f)) {
    const y = yields(p);
    g += y.g;
    fo += y.fo;
    for (const t in p.u) up += p.u[t] * UN[t].food;
  }
  return { g, fo, up, net: fo - up };
}
function ordTarget(p) {
  const f = p.owner;
  if (f === REB) return 50;
  const r = ruler(f);
  /* OC 'ordenObjetivo': orden hacia el que tiende la provincia. ctx {p, f} */
  return clamp(OC.calc("ordenObjetivo", 55 +
      p.temple * 12 +
      TAXO[p.tax] +
      CIV[f].ord +
      (tot(p.u) >= 6 ? 6 : 0) +
      (r.tr === "Piadoso" ? 5 : 0) -
      (p.recent ? 25 : 0) -
      (r.age < 16 ? 10 : 0), { p, f }),
    0,
    100,
  );
}
function economy(f) {
  if (!alive(f)) return;
  const F = G.F[f],
    e = inc(f);
  F.gold += e.g;
  F.food += e.net;
  if (F.food < 0) {
    let lost = 0;
    owned(f).forEach((x) => {
      for (const t in x.u) {
        const l = Math.ceil(x.u[t] * 0.15);
        x.u[t] -= l;
        lost += l;
      }
    });
    F.food = 0;
    if (lost && isMe(f)) addLog(`Hambre en el reino: desertan ${lost} soldados.`, "bad");
  }
  for (const p of owned(f)) {
    p.order = clamp(p.order + clamp(ordTarget(p) - p.order, -8, 8), 0, 100);
    if (p.recent) p.recent--;
    if (p.order < 20 && R() < 0.35) {
      addLog(`¡Revuelta en ${p.name}! Los bagaudas expulsan a ${CIV[f].s}.`, isMe(f) ? "bad" : "");
      OC.emitirSync("revuelta", { p, de: f });
      p.owner = REB;
      p.u = { i: 4 + ri(0, 2), a: 2, c: 0 };
      p.gen = null;
      p.order = 50;
      p.tax = 1;
    }
  }
}

/* ---------- impuestos (sección de provincia) ---------- */
OC.seccion("prov", {
  id: "impuestos",
  orden: 40,
  visible: (c) => c.mine,
  render: ({ p }, dis) =>
    `<h3>Impuestos</h3><div class="g3">${TAX.map((t, i) => `<button data-act="tax-${i}" class="${p.tax === i ? "on" : ""}" ${dis ? "disabled" : ""}>${t}</button>`).join("")}</div>`,
});
OC.accion("tax", (v) => {
  const p = G.P[sel];
  if (p && p.owner === ME) p.tax = +v;
});
