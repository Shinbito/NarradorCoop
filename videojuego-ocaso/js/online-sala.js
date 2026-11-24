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
   ENLACE DE INVITACIÓN: al abrir «Crear partida» se reserva el id de la partida (ONL.nuevaId, que usa
   onlCrear) y se muestra ya su enlace (?amigo=<anfitrión>&partida=<id>, de js/red.js). Quien lo abre (o lo
   pega en la app) espera a que la partida exista y entra solo en la sala con un pueblo libre
   (onlSalaPorEnlace); el enlace también está en la sala.
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
    const estado = u === d.host ? "♛ anfitrión" : listos[u] ? "listo" : "esperando…";
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
      ? `<button class="gold" data-sala="empezar">Empezar partida ▶︎</button>`
      : yo
        ? `<button class="${listos[net.uid] ? "" : "gold"}" data-sala="listo">${listos[net.uid] ? "Ya no estoy listo" : "Estoy listo"}</button>`
        : "";
  const html = `<p class="dim">${esc(d.name || "Partida")} · ${d.publica ? "pública" : "privada"} · ${cfg.modoTurno === "tr" ? "tiempo real (" + cfg.trSeg + " s)" : "por correspondencia (" + cfg.plazoH + " h por estación)"}${d.modo === "leyendas" ? " · leyendas" : ""}</p>
    <table class="onl-sala-t"><tbody>${act.map(fila).join("")}</tbody></table>
    <p class="onl-sala-est">${host ? (falta.length ? `Faltan por estar listos: ${falta.map((u) => esc(onlNombre(u))).join(", ")}. Puedes empezar igualmente.` : jug.length > 1 ? "¡Todos listos! Puedes empezar." : "Estás solo en la sala: invita a tus amigos o empieza y se unirán después.") : listos[net.uid] ? "Esperando a que el anfitrión empiece la partida…" : "Cuando estés preparado, pulsa «Estoy listo»."}</p>
    ${onlSalaCajaEnlace(net.id)}
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
    const k = b.dataset.sala;
    if (k === "copiar" || k === "compartir") return onlSalaCopiar(b, k === "compartir");
    if (k === "cancelar") {
      ONL_SALA.espera = null;
      if (ONL_SALA.unEsp) ONL_SALA.unEsp();
      ONL_SALA.unEsp = null;
      return onlCapa(null, "", "onl-sala-esp");
    }
    onlSalaAccion(k);
  },
  true,
);

/* ---------- enlace de invitación a la partida ---------- */
function onlSalaEnlace(id) {
  return typeof window.ocasoEnlacePartida === "function" ? window.ocasoEnlacePartida(id) : location.origin + location.pathname + "?partida=" + encodeURIComponent(id);
}
function onlSalaCajaEnlace(id, nota) {
  if (!id) return "";
  const url = onlSalaEnlace(id),
    txt = `¡Únete a mi partida de Ocaso del Imperio! ${url}`;
  return `<div class="onl-sala-enl"><h3>Enlace de invitación</h3>${nota ? `<p class="dim">${nota}</p>` : ""}
    <input readonly value="${esc(url)}" onclick="this.select()">
    <div class="btns"><button class="gold" data-sala="copiar">Copiar enlace</button>${navigator.share ? '<button data-sala="compartir">Compartir…</button>' : ""}<a href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener"><button type="button">WhatsApp</button></a></div><p class="dim onl-sala-ok"></p></div>`;
}
async function onlSalaCopiar(b, compartir) {
  const caja = b.closest(".onl-sala-enl"),
    url = caja ? caja.querySelector("input").value : "";
  if (!url) return;
  if (compartir) return navigator.share({ title: "Ocaso del Imperio", text: "¡Únete a mi partida de Ocaso del Imperio!", url }).catch(() => {});
  try {
    await navigator.clipboard.writeText(url);
  } catch (_) {
    caja.querySelector("input").select();
    document.execCommand("copy");
  }
  const ok = caja.querySelector(".onl-sala-ok");
  if (ok) ok.textContent = "Enlace copiado: mándalo por donde quieras.";
}
/* «Crear partida»: el enlace ya está mientras se configura (el id se reserva aquí y lo usa onlCrear) */
if (typeof onlLobbyCuerpo === "function") {
  const onlSalaCuerpo0 = onlLobbyCuerpo;
  onlLobbyCuerpo = function () {
    const h = onlSalaCuerpo0.apply(this, arguments);
    if (ONL.tab !== "nueva" || !net.db || !net.uid) return h;
    if (!ONL.nuevaId) ONL.nuevaId = net.db.collection("partidas").doc().id;
    return onlSalaCajaEnlace(ONL.nuevaId, "Mándalo ya: quien lo abra esperará en la sala y entrará en cuanto crees la partida (con un pueblo libre, que podrá cambiar).") + h;
  };
}
/* abrir (o pegar) el enlace de una partida: esperar a que exista y entrar en su sala */
async function onlSalaPorEnlace(id) {
  if (!net.db || !net.uid || !/^[A-Za-z0-9_\-]+$/.test(id)) return;
  if (/[?&]partida=/.test(location.search)) {
    const q = new URLSearchParams(location.search);
    q.delete("partida");
    history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
  }
  if (net.on && net.id === id) return;
  if (ONL_SALA.unEsp) ONL_SALA.unEsp();
  ONL_SALA.espera = id;
  const capa = (t) => onlCapa("Invitación a una partida", `<p>${t}</p><div class="btns"><button data-sala="cancelar">Cancelar</button></div>`, "onl-sala-esp", true);
  capa("Conectando con la partida…");
  let hecho = false;
  const fin = () => {
    hecho = true;
    ONL_SALA.espera = null;
    if (ONL_SALA.unEsp) ONL_SALA.unEsp();
    ONL_SALA.unEsp = null;
    onlCapa(null, "", "onl-sala-esp");
  };
  ONL_SALA.unEsp = net.db.doc("partidas/" + id).onSnapshot(async (s) => {
    if (hecho || ONL_SALA.espera !== id) return;
    const d = s.data();
    if (!d) return capa("El anfitrión aún está configurando la partida. Entrarás en su sala en cuanto la cree…");
    if (d.terminada || d.fase === "fin") {
      fin();
      return modal("Partida terminada", "<p>Esa partida ya terminó.</p>", [{ t: "Vale" }]);
    }
    const mio = onlMiSeat(d);
    if (mio != null) {
      fin();
      return onlEntrar(id, mio);
    }
    const libres = onlLibres(d);
    if (!libres.length) {
      fin();
      return modal("Partida completa", "<p>Todos los pueblos de esa partida ya tienen jugador.</p>", [{ t: "Vale" }]);
    }
    fin();
    try {
      if (!d.publica && d.host !== net.uid && !(d.invitados || []).includes(net.uid))
        await net.db.doc("partidas/" + id).update({ invitados: [...new Set([...(d.invitados || []), net.uid])] });
    } catch (_) {}
    await onlUnirse(id, libres[0].f);
  });
}
/* al abrir la página con ?partida= (cuando ya hay identidad y conexión) */
(() => {
  const id = new URLSearchParams(location.search).get("partida");
  if (!id) return;
  const t0 = Date.now(),
    iv = setInterval(() => {
      if (net.db && net.uid && ONL.room) {
        clearInterval(iv);
        onlSalaPorEnlace(id);
      } else if (Date.now() - t0 > 600000) clearInterval(iv);
    }, 400);
})();
