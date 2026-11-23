/* ---------- tecnología, edificios y progreso de las civilizaciones ----------
   Sistema de TECNOLOGÍA. Edificios por provincia (niveles), investigación, eras. */
OC.seccion("prov", {
  id: "edificios",
  orden: 30,
  visible: (c) => c.mine,
  render: ({ p, F }, dis) =>
    `<h3>Construir</h3><div class="g2">${Object.keys(BLD)
      .map(
        (k) =>
          `<button data-act="bld-${k}" ${dis || p[k] >= 2 || F.gold < BLD[k][2] ? "disabled" : ""} title="${BLD[k][1]}">${BLD[k][0]}<small>${p[k] >= 2 ? "máximo" : BLD[k][2] + " oro · " + BLD[k][1]}</small></button>`,
      )
      .join("")}</div>`,
});
OC.accion("bld", (v) => {
  const p = G.P[sel],
    F = G.F[ME];
  if (p && p.owner === ME && p[v] < 2 && F.gold >= BLD[v][2]) {
    p[v]++;
    F.gold -= BLD[v][2];
    addLog(`Construyes ${BLD[v][0].toLowerCase()} en ${p.name}.`);
  }
});
