/* ---------- ONLINE: sala de espera (lobby) antes de empezar la partida ----------
   Una partida online nueva nace en fase 'sala' (onlCrear). Mientras tanto no corre ningún plazo
   (onlPuedeCerrar → false) y todos los que entran ven esta sala en vez del mapa (onlFase llama a
   onlSalaMostrar). En la sala:
     - los pueblos de la partida, quién lleva cada uno (o «libre: lo llevará la IA»), si está conectado y
       si está listo (d.salaListos[uid]);
     - invitar a amigos (se añaden a d.invitados y reciben un aviso);
     - cada jugador elige su pueblo (civilización) entre los libres: «Elegir este pueblo»;
     - «Estoy listo» / «Ya no estoy listo» para los invitados; el anfitrión pulsa «Empezar partida»
       (fase 'ordenes' y el plazo de la primera estación empieza a contar en ese momento);
     - «Volver al menú» sin salir de la partida (se vuelve a entrar desde «Mis partidas»).
   Globales con prefijo onlSala. */
const ONL_SALA = { html: "", d: null, t: null };
function onlSalaMostrar(d) {
  ONL_SALA.d = d;
  if (!d) {
    if (ONL_SALA.html) onlCapa(null, "", "onl-sala");
    ONL_SALA.html = "";
    clearInterval(ONL_SALA.t);
    ONL_SALA.t = null;
    return;
  }
  /* repintar también cuando alguien se conecta o desconecta */
  if (!ONL_SALA.t) ONL_SALA.t = setInterval(() => ONL_SALA.d && net.on && onlSalaPintar(), 1500);
  onlSalaPintar();
}
function onlSalaPintar() {
  const d = ONL_SALA.d;
  if (!d || !net.on) return onlSalaMostrar(null);
  const host = d.host === net.uid,
    listos = d.salaListos || {},
    act = Array.isArray(d.activas) ? d.activas.filter((f) => f >= 0 && f < NF) : Object.keys(d.seats || {}).map(Number),
    cfg = { ...ONL_CFG_DEF, ...(d.cfg || {}) },
    jug = onlSeats(d).map((f) => d.seats[f]),
    falta = jug.filter((u) => u !== d.host && !listos[u]);
  const fila = (f) => {
    const u = (d.seats || {})[f];
    if (!u)
      return `<tr><td>${onlCivTxt(f)}</td><td class="dim">libre · lo llevará la IA</td><td>${jug.includes(net.uid) ? `<button class="onl-mini" data-sala="civ-${f}">Elegir este pueblo</button>` : ""}</td></tr>`;
    const estado = u === d.host ? "♛ anfitrión" : listos[u] ? "✔ listo" : "esperando…";
    return `<tr><td>${onlCivTxt(f)}</td><td><b>${esc(onlNombre(u))}</b>${u === net.uid ? " (tú)" : ""} ${onlConectado(u) ? '<i class="onl-on" title="conectado">●</i>' : '<i class="dim" title="desconectado">○</i>'}</td><td class="${listos[u] || u === d.host ? "" : "dim"}">${estado}</td></tr>`;
  };
  const amigos = Object.keys(ONL.amigos || {}).filter((u) => ONL.amigos[u].estado === "aceptada" && !jug.includes(u)),
    inv = d.invitados || [];
  const htmlAmigos = amigos.length
    ? `<div class="onl-sala-inv">${amigos
        .map((u) => `<label class="onl-chk"><input type="checkbox" data-sala-inv="${esc(u)}"> ${esc(onlNombre(u))}${inv.includes(u) ? ' <i class="dim">(invitado)</i>' : ""}${onlConectado(u) ? ' <i class="onl-on">●</i>' : ""}</label>`)
        .join("")}</div><div class="btns"><button data-sala="invitar">Invitar a los marcados</button></div>`
    : '<p class="dim">Añade amigos en el menú online («Invitar amigos» o la pestaña «Amigos») para traerlos aquí.</p>';
  const yo = jug.includes(net.uid) && !host,
    botones = host
      ? `<button class="gold" data-sala="empezar">Empezar partida ▶</button>`
      : yo
        ? `<button class="${listos[net.uid] ? "" : "gold"}" data-sala="listo">${listos[net.uid] ? "Ya no estoy listo" : "Estoy listo ✔"}</button>`
        : "";
  const html = `<p class="dim">${esc(d.name || "Partida")} · ${d.publica ? "pública" : "privada"} · ${cfg.modoTurno === "tr" ? "tiempo real (" + cfg.trSeg + " s)" : "por correspondencia (" + cfg.plazoH + " h por estación)"}${d.modo === "leyendas" ? " · leyendas" : ""}</p>
    <table class="onl-sala-t"><tbody>${act.map(fila).join("")}</tbody></table>
    <p class="onl-sala-est">${host ? (falta.length ? `Faltan por estar listos: ${falta.map((u) => esc(onlNombre(u))).join(", ")}. Puedes empezar igualmente.` : jug.length > 1 ? "¡Todos listos! Puedes empezar." : "Estás solo en la sala: invita a tus amigos o empieza y se unirán después.") : listos[net.uid] ? "Esperando a que el anfitrión empiece la partida…" : "Cuando estés preparado, pulsa «Estoy listo»."}</p>
    <h3>Invitar amigos</h3>${htmlAmigos}
    <div class="btns" style="margin-top:12px">${botones}<button data-sala="menu">Volver al menú</button></div>`;
  if (html === ONL_SALA.html) return;
  /* no repintar mientras se marcan casillas (se perdería la selección) */
  const marcadas = [...document.querySelectorAll("#onl-sala [data-sala-inv]:checked")].map((x) => x.dataset.salaInv);
  ONL_SALA.html = html;
  onlCapa("Sala de espera", html, "onl-sala", true);
  for (const u of marcadas) {
    const x = document.querySelector(`#onl-sala [data-sala-inv="${CSS.escape(u)}"]`);
    if (x) x.checked = true;
  }
}
async function onlSalaAccion(k) {
  const d = ONL_SALA.d;
  if (!d || !net.on) return;
  const ref = net.db.doc("partidas/" + net.id);
  try {
    if (k.startsWith("civ-")) return onlSalaCambiarCiv(+k.slice(4));
    if (k === "listo") await ref.update({ salaListos: { [net.uid]: !(d.salaListos || {})[net.uid] }, updated: onlAhora() });
    if (k === "invitar") {
      const us = [...document.querySelectorAll("#onl-sala [data-sala-inv]:checked")].map((x) => x.dataset.salaInv);
      if (!us.length) return;
      await ref.update({ invitados: [...new Set([...(d.invitados || []), ...us])], updated: onlAhora() });
      for (const u of us) await onlAviso(u, "inv-" + net.id, { tipo: "invitacion", partida: net.id, nombre: d.name, texto: "Te invita a su partida: está en la sala de espera." });
      ONL_SALA.html = "";
    }
    if (k === "empezar" && d.host === net.uid) {
      const jug = onlSeats(d).map((f) => d.seats[f]),
        falta = jug.filter((u) => u !== d.host && !(d.salaListos || {})[u]);
      if (falta.length) {
        const v = await modal("¿Empezar ya?", `<p>${falta.map((u) => esc(onlNombre(u))).join(", ")} aún no ${falta.length > 1 ? "están" : "está"} listo${falta.length > 1 ? "s" : ""}. Si empiezas, ${falta.length > 1 ? "juegan" : "juega"} igual en cuanto ${falta.length > 1 ? "entren" : "entre"}.</p>`, [
          { t: "Empezar", v: 1, cls: "gold" },
          { t: "Esperar", v: 0 },
        ]);
        if (v !== 1) return;
      }
      const conectados = onlActivos(d).every((f) => onlConectado(d.seats[f], net.id));
      await ref.update({ fase: "ordenes", limite: onlLimite(d.cfg, conectados), listos: {}, empezada: onlAhora(), updated: onlAhora() });
      for (const u of jug) if (u !== net.uid) onlAviso(u, "uni-" + net.id, { tipo: "union", partida: net.id, nombre: d.name, texto: "¡La partida ha empezado! Ya puedes dar tus órdenes." });
    }
    if (k === "menu") {
      onlSalaMostrar(null);
      onlSalir();
      if (typeof openLobby === "function") openLobby();
    }
  } catch (e) {
    console.error("[onl] sala", e);
  }
}
/* cambiar de pueblo en la sala: se libera el anterior (reescribiendo el documento: update no borra claves) */
async function onlSalaCambiarCiv(f) {
  const ref = net.db.doc("partidas/" + net.id),
    ant = ME;
  if (!CIV[f] || f === ant) return;
  const lk = await net.db.doc(`partidas/${net.id}/ctl/seat-${f}`).acquire({ holder: ONL.yo, ttlMs: 8000 });
  if (!lk.acquired) return modal("Pueblo ocupado", "<p>Alguien lo está eligiendo ahora mismo.</p>", [{ t: "Vale" }]);
  const d = (await ref.get()).data();
  if (!d || d.fase !== "sala") return;
  if ((d.seats || {})[f]) return modal("Pueblo ocupado", "<p>Otro jugador acaba de elegir ese pueblo.</p>", [{ t: "Vale" }]);
  const seats = { ...d.seats },
    est = { ...(d.est || {}) },
    faltas = { ...(d.faltas || {}) };
  for (const k of Object.keys(seats))
    if (seats[k] === net.uid) {
      delete seats[k];
      delete est[k];
      delete faltas[k];
    }
  seats[f] = net.uid;
  est[f] = "activo";
  faltas[f] = 0;
  ME = f; /* antes de escribir, para que onlMeta no crea que te han sustituido */
  ONL_SALA.html = "";
  await ref.set({ ...d, seats, est, faltas, salaListos: { ...(d.salaListos || {}), [net.uid]: false }, updated: onlAhora() });
  onlTraza("sala civ", ant, "→", f);
}
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest && e.target.closest("[data-sala]");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    onlSalaAccion(b.dataset.sala);
  },
  true,
);
