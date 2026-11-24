/* ---------- inicio ---------- */
function openStart(v) {
  ST.view = v;
  $("start").classList.add("show");
  renderStart();
}
function renderStart() {
  const c = $("startc"),
    v = ST.view;
  let h = "";
  if (v === "home") {
    let sv = null;
    try {
      sv = localStorage.getItem("ocaso-save");
    } catch (e) {}
    /* resumen de la partida guardada (para el botón Continuar) */
    let ifzSv = "";
    try {
      const o = sv && JSON.parse(sv);
      if (o && o.G && CIV[o.ME]) ifzSv = `${CIV[o.ME].s} · ${typeof CAM_EST !== "undefined" && o.G.estacion != null ? CAM_EST[o.G.estacion].toLowerCase() + " de " : ""}${o.G.year}`;
    } catch (e) {}
    h = `<div class="hero ifz-hero"><div><h2>Ocaso del Imperio</h2><p class="ifz-lema">Año 410 d.C. Roma se desmorona. Gobierna tu dinastía, sella alianzas con bodas, sobrevive a las traiciones y lleva tus legiones a la batalla.</p>
  <div class="ifz-menu"><button class="gold" data-act="s-new">Nueva campaña</button><button data-act="s-cnt" ${sv ? "" : "disabled"}>Continuar${ifzSv ? `<small>${esc(ifzSv)}</small>` : ""}</button><button data-act="s-onl" ${net.db && net.uid ? "" : "disabled"}>Partida online</button>${G ? '<button data-act="s-bk">Volver al juego</button>' : ""}</div>
  <p class="dim ifz-nota">${net.db && net.uid ? "Online por estaciones: partidas largas con amigos o desconocidos, por correspondencia o en tiempo real; comparte este enlace (permiso de colaborador). Los pueblos libres los lleva la IA." : "El modo online se activa cuando abres el juego publicado con tu cuenta."}</p></div><div class="ifz-hero-b"><button data-act="ifzayuda">¿Cómo se juega?</button><button class="music" data-act="music">${AU.want ? "♪ Música: sí" : "♪ Música: no"}</button></div></div>`;
  }
  if (v === "civ") {
    /* MUNDO: dos modos. Histórico = las 7 de siempre; Leyendas = todos los pueblos, rivales a elegir */
    const ley = ST.modo === "leyendas",
      lista = ley ? [...Array(NF).keys()] : MUNDO_HIST;
    h = `<h2>Elige tu pueblo</h2><p class="dim">${ST.mode === "online" ? "Partida online nueva. " : ""}Cada civilización tiene tropas, economía y rivales propios.</p>
  <div class="mun-modos"><button data-act="s-modo-historico" class="${ley ? "" : "on"}" aria-pressed="${!ley}"><b>Histórico (410 d.C.)</b>Roma se desmorona: los siete pueblos de la época, con sus alianzas, guerras y crónicas reales.</button><button data-act="s-modo-leyendas" class="${ley ? "on" : ""}" aria-pressed="${ley}"><b>Mundo de leyendas</b>Todos los pueblos de la historia en un mismo mundo: tú eliges el tuyo y a tus rivales. El mapa crece con ellos.</button></div>
  <div class="civs${ley ? " mun-g" : ""}">${lista.map((f) => mundoTarjeta(f, ley)).join("")}</div><div class="btns"><button data-act="s-bk">Atrás</button></div>`;
  }
  if (v === "riv") h = mundoVistaRivales();
  if (v === "rul") {
    const x = CIV[ST.civ],
      ley = ST.modo === "leyendas";
    h = `<h2 style="color:${x.c}">Elige a tu soberano</h2><p class="dim">${x.n}. Tu soberano y su descendencia son tu personaje: si muere sin heredero, tu dinastía cae.</p><div class="civs">${ST.cands.map((o, i) => `<button class="civ ${ST.ci === i ? "on" : ""}" data-act="s-rc-${i}"><b>${o.sex === "m" ? x.tm : x.tf} ${o.n}</b>${o.age} años · ${o.tr} (${TRAITS[o.tr]})<span>Mando ${o.ma} · Astucia ${o.in}<br>Diplomacia ${o.di} · Gestión ${o.ge}</span></button>`).join("")}</div>
  ${ley ? `<p class="dim" style="margin-top:10px">Mundo de leyendas · ${ST.riv.length} rivales: ${ST.riv.map((f) => `<span style="color:${CIV[f].c}">${CIV[f].s}</span>`).join(", ")}</p>` : ""}
  ${typeof difSelector === "function" ? difSelector() : ""}
  ${ST.mode === "online" ? `<p style="margin-top:12px"><label for="gname">Nombre de la partida</label><input id="gname" maxlength="40" value="${esc(ST.gname || "Partida de " + x.s)}"></p>` : ""}
  <div class="btns" style="margin-top:12px"><button data-act="s-bk">Atrás</button><button data-act="s-rr">Otros candidatos</button><button class="gold" data-act="s-go">${ley ? "Comenzar la leyenda" : "Comenzar en el año 410"}</button></div>`;
  }
  /* ONLINE: el vestíbulo lo pinta online.js */
  if (v === "lobby") h = onlVistaLobby();
  c.innerHTML = h;
}
/* MUNDO: tarjeta de un pueblo en la pantalla de elección */
function mundoTarjeta(f, ley) {
  const x = CIV[f];
  if (!ley)
    return `<button class="civ" data-act="s-civ-${f}" style="--civ:${x.c}"><i style="background:${x.c}"></i><b>${x.n}</b>${x.desc}<span class="dim ifz-civt">${["i", "a", "c"].map((t) => `<span><img src="${icon(f, t)}" alt="">${x.un[t]}</span>`).join("")}</span></button>`;
  const sinCab = ["x", "c", "k", "m"].every((t) => x.sinTipos.includes(t)),
    tropas = ["i", "a", sinCab ? "h" : "c"].filter((t) => civPuede(f, t)),
    unicas = x.unicas.filter((k) => UN[k] && !["i", "a", "c"].includes(k)).map((k) => x.un[k] || UN[k].s);
  return `<button class="civ mun-civ" data-act="s-civ-${f}" style="--civ:${x.c}"><i style="background:${x.c}"></i><b style="color:${x.c}">${x.n}</b>${x.desc}<span class="dim ifz-civt">${tropas.map((t) => `<span><img src="${icon(f, t)}" alt="">${x.un[t]}</span>`).join("")}${unicas.length ? `<span class="ifz-uni">Únicas: ${unicas.join(", ")}</span>` : ""}</span>${sinCab ? '<span class="mun-sin">Sin caballos</span>' : ""}</button>`;
}
/* MUNDO: elección de rivales (modo leyendas) */
function mundoVistaRivales() {
  const x = CIV[ST.civ],
    mano = ST.rmodo === "mano",
    n = ST.riv.length,
    dim = mundoDims("leyendas", n + 1),
    nom = (f) => `<span style="color:${CIV[f].c}">${CIV[f].s}</span>`;
  let h = `<h2>Elige a tus rivales</h2><p class="dim"><span style="color:${x.c}">${x.n}</span> contra ${n} ${n === 1 ? "pueblo" : "pueblos"}. Mapa de ${dim.w}×${dim.h} con unas ${Math.round(dim.gx * dim.gy * 0.82)} provincias.</p>
  <div class="g2"><button data-act="s-rmodo-azar" class="${mano ? "" : "on"}" aria-pressed="${!mano}">Al azar</button><button data-act="s-rmodo-mano" class="${mano ? "on" : ""}" aria-pressed="${mano}">A mano</button></div>`;
  if (!mano)
    h += `<div class="mun-num"><span>Rivales</span><button data-act="s-nriv-dec" aria-label="Menos rivales" ${n <= 1 ? "disabled" : ""}>−</button><b>${n}</b><button data-act="s-nriv-inc" aria-label="Más rivales" ${n >= NF - 1 ? "disabled" : ""}>+</button><button data-act="s-rsort">Sortear de nuevo</button></div><div class="mun-sel">${ST.riv.map((f) => `<span>${nom(f)}</span>`).join("")}</div>`;
  else
    h += `<div class="mun-riv">${[...Array(NF).keys()]
      .filter((f) => f !== ST.civ)
      .map((f) => {
        const on = ST.riv.includes(f);
        return `<button data-act="s-rtog-${f}" class="${on ? "on" : "off"}" aria-pressed="${on}"><i style="background:${CIV[f].c}"></i>${CIV[f].s}</button>`;
      })
      .join("")}</div><div class="btns"><button data-act="s-rtodos">Todos</button><button data-act="s-rning">Ninguno</button></div>`;
  return (
    h +
    `<div class="btns" style="margin-top:12px"><button data-act="s-bk">Atrás</button><button class="gold" data-act="s-rok" ${n < 1 ? "disabled" : ""}>Continuar</button></div>`
  );
}
/* opciones de newGame según la pantalla de inicio */
const mundoOpciones = () =>
  ST.modo === "leyendas" ? { modo: "leyendas", activas: [ST.civ, ...ST.riv] } : { modo: "historico" };
function drawHero() {
  const c = $("heroc");
  if (!c) return;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  x.fillStyle = "#22517a";
  x.fillRect(0, 0, 96, 60);
  x.fillStyle = "#5a983f";
  x.fillRect(6, 26, 84, 30);
  x.fillStyle = "#d9c27c";
  x.fillRect(6, 26, 84, 1);
  spr(x, SP.castle, 40, 13, PAL[0]);
  for (let k = 0; k < 6; k++) {
    spr(x, SP.i, 10 + k * 8, 40, PAL[k % 2 ? 2 : 0]);
  }
  spr(x, SP.c, 62, 36, PAL[3]);
  spr(x, SP.c, 74, 40, PAL[3]);
  spr(x, SP.a, 80, 30, PAL[3]);
  spr(x, SP.tree, 14, 28, BP);
  spr(x, SP.tree, 26, 30, BP);
  spr(x, SP.hill, 58, 28, BP);
}
function startAct(v) {
  const [k, x] = [
    v.slice(0, v.indexOf("-") < 0 ? v.length : v.indexOf("-")),
    v.includes("-") ? v.slice(v.indexOf("-") + 1) : "",
  ];
  if (k === "new") {
    ST.mode = "single";
    ST.modo = ST.modo || "historico";
    openStart("civ");
  }
  if (k === "onl") {
    ST.mode = "online";
    ONL.tab = "mis";
    openLobby();
  }
  /* ONLINE: acciones del vestíbulo y de los avisos (online.js) */
  if (k !== "onl" && k.startsWith("onl")) {
    onlAccionInicio(k, x);
    return;
  }
  if (k === "cre") {
    ST.mode = "online";
    ONL.tab = "nueva";
    openLobby();
  }
  /* MUNDO: modo de juego y rivales */
  if (k === "modo") {
    ST.modo = x === "leyendas" ? "leyendas" : "historico";
    renderStart();
  }
  if (k === "rmodo") {
    ST.rmodo = x === "mano" ? "mano" : "azar";
    renderStart();
  }
  if (k === "nriv") {
    if (x === "dec" && ST.riv.length > 1) ST.riv.pop();
    if (x === "inc") {
      const l = [...Array(NF).keys()].filter((f) => f !== ST.civ && !ST.riv.includes(f));
      if (l.length) ST.riv.push(pick(l));
    }
    ST.nriv = ST.riv.length;
    renderStart();
  }
  if (k === "rsort") {
    ST.riv = mundoRivalesAzar(ST.civ, ST.riv.length);
    renderStart();
  }
  if (k === "rtog") {
    const f = +x;
    if (f !== ST.civ && f >= 0 && f < NF) ST.riv = ST.riv.includes(f) ? ST.riv.filter((g) => g !== f) : [...ST.riv, f];
    ST.nriv = ST.riv.length || ST.nriv;
    renderStart();
  }
  if (k === "rtodos" || k === "rning") {
    ST.riv = k === "rtodos" ? [...Array(NF).keys()].filter((f) => f !== ST.civ) : [];
    renderStart();
  }
  if (k === "rok" && ST.riv.length) {
    ST.cands = cands(ST.civ);
    ST.ci = 0;
    openStart("rul");
  }
  if (k === "cnt") {
    try {
      const s = JSON.parse(localStorage.getItem("ocaso-save"));
      if (s && s.G) {
        leaveNet();
        G = s.G;
        ME = s.ME;
        MAP = gen(G.seed, G.mapa);
        drawBase();
        OC.emitirSync("partidaLista");
        sel = G.F[ME].capId;
        $("start").classList.remove("show");
        centerOn(sel);
        ui();
        startTurn();
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (k === "bk") {
    if (ST.view === "rul") openStart(ST.modo === "leyendas" ? "riv" : "civ");
    else if (ST.view === "riv") openStart("civ");
    else if (ST.view === "civ") openStart(ST.mode === "online" ? "lobby" : "home");
    else if (ST.view === "lobby") openStart("home");
    else if (G) $("start").classList.remove("show");
  }
  if (k === "civ") {
    ST.civ = +x;
    if (ST.modo === "leyendas") {
      /* rivales: se conservan los elegidos (sin el pueblo propio) o se sortean */
      ST.riv = (ST.riv || []).filter((f) => f !== ST.civ);
      if (!ST.riv.length) ST.riv = mundoRivalesAzar(ST.civ, ST.nriv || 7);
      openStart("riv");
    } else {
      ST.cands = cands(ST.civ);
      ST.ci = 0;
      openStart("rul");
    }
  }
  if (k === "rc") {
    ST.ci = +x;
    renderStart();
  }
  if (k === "rr") {
    ST.cands = cands(ST.civ);
    ST.ci = 0;
    renderStart();
  }
  if (k === "go") {
    if (ST.mode === "online") {
      ST.gname = ($("gname")?.value || "").trim().slice(0, 40) || "Partida";
      createOnline();
    } else {
      leaveNet();
      newGame(ST.civ, ST.cands[ST.ci], mundoOpciones());
      drawBase();
      OC.emitirSync("partidaLista");
      $("start").classList.remove("show");
      ui();
      save();
      startTurn();
    }
  }
  if (k === "rs") {
    const g = net.games.find((g) => g.id === x);
    if (g) {
      const f = +Object.keys(g.d.seats).find((f) => g.d.seats[f] === net.uid);
      enterGame(x, f);
    }
  }
  if (k === "jn") {
    const f = +$("js-" + x).value;
    joinGame(x, f);
  }
}

/* ---------- online ----------
   La lógica vive en js/online.js (partidas por estaciones, órdenes simultáneas, amigos, avisos, batallas
   en vivo). Aquí quedan los nombres de siempre, que usan el resto del juego y turnos.js. */
function leaveNet() {
  onlSalir();
}
async function names(ids) {
  if (!net.user) return;
  try {
    const ps = await net.user.profiles(ids.filter(Boolean));
    for (const id in ps) net.names[id] = ps[id]?.name || "";
  } catch (e) {}
}
function openLobby() {
  openStart("lobby");
  onlSuscribirUsuario();
}
function createOnline() {
  return onlCrear();
}
function joinGame(id, f) {
  return onlUnirse(id, f);
}
function enterGame(id, f) {
  return onlEntrar(id, f);
}
/* «Terminar mi turno» en online: «Listo» (envía las órdenes de la estación) */
function endOnline() {
  return onlListo();
}

/* ---------- escena del menú ---------- */
const scx = $("scene").getContext("2d");
/* fondo del menú (cielo, sol, nubes, colinas y fortaleza); sustituible por el PNG «ESCENA.fondo» (200×112).
   quieto: sin animación (para exportarlo) */
function ifzEscenaFondo(c, t, quieto) {
  const im = typeof IFZ_SPR !== "undefined" && IFZ_SPR.img["ESCENA.fondo"];
  if (im) {
    c.imageSmoothingEnabled = false;
    c.drawImage(im, 0, 0, 200, 112);
    return;
  }
  const sky = ["#1b1430", "#2a1c44", "#46234f", "#6f2c4f", "#a23e48", "#d0623e", "#ef9a4a"];
  sky.forEach((col, i) => {
    c.fillStyle = col;
    c.fillRect(0, i * 9, 200, 9);
  });
  for (let i = 1; i < sky.length; i++) {
    c.fillStyle = sky[i];
    for (let x = i % 2; x < 200; x += 2) c.fillRect(x, i * 9 - 1, 1, 1);
  }
  c.fillStyle = "#ffd27a";
  c.beginPath();
  c.arc(150, 58, 11, 0, 7);
  c.fill();
  c.fillStyle = "#fff0b8";
  c.fillRect(146, 52, 4, 2);
  for (const [cx, cy, w, sp] of [
    [30, 14, 26, 3],
    [110, 22, 34, 2],
    [170, 10, 20, 4],
  ]) {
    const x = ((cx + t * sp) % 240) - 30;
    c.fillStyle = "#f6b6a0";
    c.fillRect(x, cy, w, 3);
    c.fillRect(x + 4, cy - 2, w - 10, 2);
    c.fillStyle = "#c77c7c";
    c.fillRect(x + 2, cy + 3, w - 4, 1);
  }
  c.fillStyle = "#3b2a4f";
  for (let x = 0; x < 200; x++) {
    const h = 58 + Math.round(Math.sin(x / 13) * 6 + Math.sin(x / 5.3) * 2);
    c.fillRect(x, h, 1, 112 - h);
  }
  c.fillStyle = "#2a3b2a";
  for (let x = 0; x < 200; x++) {
    const h = 74 + Math.round(Math.sin(x / 21 + 1) * 5 + Math.sin(x / 7) * 1.5);
    c.fillRect(x, h, 1, 112 - h);
  }
  c.fillStyle = "#355c2c";
  c.fillRect(0, 92, 200, 20);
  c.fillStyle = "#3f6e33";
  for (let x = 0; x < 200; x += 3) c.fillRect(x, 92 + ((x * 7) % 5), 1, 1);
  const CX = 46,
    CY = 46;
  c.fillStyle = "#1d1626";
  c.fillRect(CX, CY + 8, 46, 30);
  c.fillRect(CX - 4, CY, 10, 38);
  c.fillRect(CX + 40, CY, 10, 38);
  c.fillRect(CX + 17, CY - 8, 12, 46);
  c.fillStyle = "#2b2236";
  for (let i = 0; i < 5; i++) {
    c.fillRect(CX - 4 + i * 2, CY - 2, 1, 2);
    c.fillRect(CX + 40 + i * 2, CY - 2, 1, 2);
    c.fillRect(CX + 17 + i * 3, CY - 10, 2, 2);
  }
  for (let i = 0; i < 12; i++) c.fillRect(CX + i * 4, CY + 6, 2, 2);
  c.fillStyle = "#f2c14e";
  [
    [CX, CY + 10],
    [CX + 44, CY + 10],
    [CX + 22, CY],
    [CX + 10, CY + 18],
    [CX + 33, CY + 18],
  ].forEach(([x, y], i) => {
    if (Math.floor(t * 2 + i) % 7 !== 0) c.fillRect(x, y, 2, 3);
  });
  c.fillStyle = "#0d0a12";
  c.fillRect(CX + 19, CY + 28, 8, 10);
  [
    [CX + 1, CY - 12, 0],
    [CX + 45, CY - 12, 2],
    [CX + 23, CY - 20, 1],
  ].forEach(([x, y, f], i) => {
    c.fillStyle = "#0d0a12";
    c.fillRect(x, y, 1, 12);
    const w = Math.floor(t * 4 + i) % 2;
    c.fillStyle = CIV[f].c;
    c.fillRect(x + 1, y + w, 5, 3);
    c.fillRect(x + 6, y + 1 - w + 1, 2, 2);
  });
}
function drawScene(now) {
  const c = scx,
    t = reduce ? 0 : now / 1000;
  ifzEscenaFondo(c, t);
  const off = (t * 8) % 240;
  for (let k = 0; k < 14; k++) {
    const x = Math.round(((k * 13 + off) % 240) - 30),
      f = k < 9 ? 0 : 3,
      y = 96 + (k % 2) * 3,
      fr = Math.floor(t * 6 + k) % 2;
    sprF(c, MS[k % 5 === 4 ? "c" : k % 3 === 2 ? "a" : "i"][fr], x, y, PAL[f], false);
  }
  for (let k = 0; k < 3; k++) {
    const x = Math.round(((k * 60 + off * 1.2 + 100) % 240) - 30);
    c.fillStyle = "#0d0a12";
    c.fillRect(x + 2, 94, 1, 8);
    c.fillStyle = CIV[[0, 2, 3][k]].c;
    c.fillRect(x + 3, 94 + (Math.floor(t * 4 + k) % 2), 4, 3);
  }
}
