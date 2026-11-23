/* ---------- turnos ----------
   CAMPAÑA (bucle de estaciones): el turno es una ESTACIÓN (G.estacion 0 primavera … 3 invierno).
   finEstacion() mueve los ejércitos de la IA, avanza asedios, víveres y mercenarios y emite
   'finEstacion' {anio, estacion}; tras el invierno se cierra el año con finDeAnio() (economía, IA anual,
   envejecer, eventos anuales: antesFinAnio, economiaFaccion, turnoIA, finAnio, como siempre).
   yearEnd() conserva su sentido de siempre: hace pasar un año entero (las estaciones que falten). */
async function finEstacion() {
  if (!G || G.over) return;
  if (G.estacion == null) G.estacion = 0;
  if (typeof camEstacion === "function") await camEstacion();
  await OC.emitir("finEstacion", { anio: G.year, estacion: G.estacion });
  if (G.over) return;
  if (G.estacion >= 3) {
    G.estacion = 0;
    await finDeAnio();
  } else G.estacion++;
  if (typeof camNuevaEstacion === "function") await camNuevaEstacion();
}
async function yearEnd() {
  const y = G.year;
  for (let k = 0; k < 4 && G.year === y && !G.over; k++) await finEstacion();
}
async function finDeAnio() {
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
  OC.modales = 0;
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
    else {
      /* una estación; si el jugador no tiene campañas en marcha, pasan solas hasta la primavera */
      const y = G.year;
      do await finEstacion();
      while (!G.over && G.year === y && typeof camSaltar === "function" && camSaltar(ME));
    }
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
  if (G.over || !alive(ME)) {
    OC.emitirSync("finPartida", { win: G.over ? G.over.win : -1, vivo: alive(ME) });
    showEnd();
  }
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
