/* ---------- clases de guerreros: reclutamiento ----------
   Sistema de COMBATE. Aquí se definen las clases de tropas y cómo se reclutan. */
OC.seccion("prov", {
  id: "reclutar",
  orden: 20,
  visible: (c) => c.mine,
  render: ({ F }, dis) =>
    `<h3>Reclutar</h3><div class="g3">${TYP.map((t) => `<button data-act="rec-${t}" ${dis || F.gold < cost(ME, t) ? "disabled" : ""}>${UN[t].s}<small>${cost(ME, t)} oro</small></button>`).join("")}</div>`,
});
OC.accion("rec", (v) => {
  const p = G.P[sel],
    F = G.F[ME];
  if (p && p.owner === ME && F.gold >= cost(ME, v)) {
    p.u[v]++;
    F.gold -= cost(ME, v);
  }
});
