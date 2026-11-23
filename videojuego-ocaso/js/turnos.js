/* ---------- turnos ---------- */
async function yearEnd() {
  await OC.emitir("antesFinAnio", G.year);
  for (let f = 0; f < NF; f++) {
    economy(f);
    OC.emitirSync("economiaFaccion", f);
  }
  drift();
  for (let f = 0; f < NF; f++) {
    if (G.over) break;
    if (!human(f) && alive(f)) {
      await ai(f);
      await OC.emitir("turnoIA", f);
      ui();
    }
  }
  life();
  G.year++;
  G.P.forEach((p) => (p.tired = false));
  G.F.forEach((F) => {
    F.asn = 0;
    F.dip = {};
  });
  addLog(`Año ${G.year} d.C.`, "turn");
  await OC.emitir("finAnio", G.year);
  checkEnd();
}
async function endTurn() {
  if (busy || !G || G.over || !myTurn() || BT) return;
  busy = true;
  aim = 0;
  ui();
  try {
    if (net.on) await endOnline();
    else await yearEnd();
  } finally {
    busy = false;
  }
  ui();
  if (!net.on) {
    save();
    await startTurn();
  }
}
function checkEnd() {
  if (G.over) return;
  const need = Math.ceil(G.P.length * 0.6);
  for (const f of G.human) if (alive(f) && owned(f).length >= need) G.over = { win: f };
  if (!G.over && G.human.every((f) => !alive(f))) G.over = { win: -1 };
  if (G.over || !alive(ME)) showEnd();
}
function showEnd() {
  const w = G.over?.win,
    mine = w === ME;
  modal(
    mine ? "¡Victoria!" : alive(ME) ? "La partida termina" : "Derrota",
    mine
      ? `<p>En el año ${G.year} d.C., ${ruler(ME).n} domina ${owned(ME).length} de ${G.P.length} provincias. Tu dinastía escribe la historia.</p>`
      : w >= 0 && w !== ME
        ? `<p>${CIV[w].n} se impone sobre el mundo conocido.</p>`
        : `<p>${CIV[ME].n} ha caído en el año ${G.year} d.C.</p>`,
    [{ t: "Volver al menú", fn: () => openStart("home") }],
  );
}
function save() {
  if (net.on || !G) return;
  try {
    localStorage.setItem("ocaso-save", JSON.stringify({ G, ME }));
  } catch (e) {}
}
