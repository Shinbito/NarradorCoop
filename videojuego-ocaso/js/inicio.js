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
    h = `<div class="hero"><div><h2>Ocaso del Imperio</h2><p>Año 410 d.C. Roma se desmorona. Gobierna tu dinastía, sella alianzas con bodas, sobrevive a las traiciones y lleva tus legiones a la batalla.</p>
  <div class="g2" style="margin-top:14px"><button class="gold" data-act="s-new">Nueva campaña</button><button data-act="s-cnt" ${sv ? "" : "disabled"}>Continuar</button><button data-act="s-onl" ${net.db && net.uid ? "" : "disabled"}>Partida online</button>${G ? '<button data-act="s-bk">Volver al juego</button>' : ""}</div>
  <p class="dim" style="margin-top:10px">${net.db && net.uid ? "Online por turnos: comparte este enlace con tus amigos (permiso de colaborador) y juegan en la misma partida; las civilizaciones libres las controla la IA." : "El modo online se activa cuando abres el juego publicado con tu cuenta."}</p></div><div><button class="music" data-act="music">${AU.want ? "♪ Música: sí" : "♪ Música: no"}</button></div></div>`;
  }
  if (v === "civ")
    h = `<h2>Elige tu pueblo</h2><p class="dim">${ST.mode === "online" ? "Partida online nueva. " : ""}Cada civilización tiene tropas, economía y rivales propios.</p><div class="civs">${CIV.slice(
      0,
      NF,
    )
      .map(
        (x, f) =>
          `<button class="civ" data-act="s-civ-${f}"><i style="background:${x.c}"></i><b>${x.n}</b>${x.desc}<span class="dim">Tropas: ${x.un.i}, ${x.un.a}, ${x.un.c}</span></button>`,
      )
      .join("")}</div><div class="btns"><button data-act="s-bk">Atrás</button></div>`;
  if (v === "rul") {
    const x = CIV[ST.civ];
    h = `<h2 style="color:${x.c}">Elige a tu soberano</h2><p class="dim">${x.n}. Tu soberano y su descendencia son tu personaje: si muere sin heredero, tu dinastía cae.</p><div class="civs">${ST.cands.map((o, i) => `<button class="civ ${ST.ci === i ? "on" : ""}" data-act="s-rc-${i}"><b>${o.sex === "m" ? x.tm : x.tf} ${o.n}</b>${o.age} años · ${o.tr} (${TRAITS[o.tr]})<span>Mando ${o.ma} · Intriga ${o.in}<br>Diplomacia ${o.di} · Gestión ${o.ge}</span></button>`).join("")}</div>
  ${ST.mode === "online" ? `<p style="margin-top:12px"><label for="gname">Nombre de la partida</label><input id="gname" maxlength="40" value="${esc(ST.gname || "Partida de " + x.s)}"></p>` : ""}
  <div class="btns" style="margin-top:12px"><button data-act="s-bk">Atrás</button><button data-act="s-rr">Otros candidatos</button><button class="gold" data-act="s-go">Comenzar en el año 410</button></div>`;
  }
  if (v === "lobby") {
    h = `<h2>Partidas online</h2><p class="dim">Partidas por turnos: cada jugador juega su año y el último activa a la IA. Puedes tomar cualquier civilización libre de una partida en curso.</p><div id="games">${lobbyList()}</div><div class="btns" style="margin-top:12px"><button data-act="s-bk">Atrás</button><button class="gold" data-act="s-cre">Crear partida</button></div>`;
  }
  c.innerHTML = h;
}
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
function lobbyList() {
  if (!net.games.length) return '<p class="dim">Aún no hay partidas. Crea la primera.</p>';
  return net.games
    .map((g) => {
      const d = g.d,
        seats = d.seats || {},
        mine = Object.keys(seats).find((f) => seats[f] === net.uid),
        free = [...Array(NF).keys()].filter((f) => !(f in seats));
      return `<div class="row"><div class="hd"><b>${esc(d.name || "Partida")}</b><span class="stats">año ${+d.year || 410} · ${Object.keys(seats).length} jugador(es)</span></div><span class="stats">${Object.keys(
        seats,
      )
        .map(
          (f) =>
            `<span style="color:${CIV[f]?.c}">${CIV[f]?.s}</span>${net.names[seats[f]] ? " (" + esc(net.names[seats[f]]) + ")" : ""}`,
        )
        .join(", ")}</span>
  <div class="btns">${mine !== undefined ? `<button class="gold" data-act="s-rs-${esc(g.id)}">Entrar como ${CIV[mine].s}</button>` : free.length ? `<select id="js-${esc(g.id)}" aria-label="Civilización">${free.map((f) => `<option value="${f}">${CIV[f].s}</option>`).join("")}</select><button data-act="s-jn-${esc(g.id)}">Unirse</button>` : '<span class="dim">Completa</span>'}</div></div>`;
    })
    .join("");
}
function startAct(v) {
  const [k, x] = [
    v.slice(0, v.indexOf("-") < 0 ? v.length : v.indexOf("-")),
    v.includes("-") ? v.slice(v.indexOf("-") + 1) : "",
  ];
  if (k === "new") {
    ST.mode = "single";
    openStart("civ");
  }
  if (k === "onl") {
    ST.mode = "online";
    openLobby();
  }
  if (k === "cre") {
    openStart("civ");
  }
  if (k === "cnt") {
    try {
      const s = JSON.parse(localStorage.getItem("ocaso-save"));
      if (s && s.G) {
        leaveNet();
        G = s.G;
        ME = s.ME;
        MAP = gen(G.seed);
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
    if (ST.view === "rul") openStart("civ");
    else if (ST.view === "civ") openStart(ST.mode === "online" ? "lobby" : "home");
    else if (ST.view === "lobby") openStart("home");
    else if (G) $("start").classList.remove("show");
  }
  if (k === "civ") {
    ST.civ = +x;
    ST.cands = cands(ST.civ);
    ST.ci = 0;
    openStart("rul");
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
      newGame(ST.civ, ST.cands[ST.ci]);
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

/* ---------- online ---------- */
function leaveNet() {
  if (net.unsub) {
    net.unsub();
    net.unsub = null;
  }
  net.on = false;
  net.id = null;
  net.ver = 0;
  net.seats = {};
  net.cur = null;
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
  if (net.lun || !net.db) return;
  const tm = setTimeout(() => {
    if (ST.view === "lobby" && !net.games.length)
      $("games").innerHTML = '<p class="dim">No se pudo cargar la lista todavía. Revisa tu conexión.</p>';
  }, 10000);
  net.lun = net.db
    .collection("partidas")
    .orderBy("created", "desc")
    .limit(25)
    .onSnapshot(
      (s) => {
        clearTimeout(tm);
        net.games = s.docs.map((d) => ({ id: d.id, d: d.data() }));
        names([...new Set(net.games.flatMap((g) => Object.values(g.d.seats || {})))]).then(() => {
          if (ST.view === "lobby") $("games").innerHTML = lobbyList();
        });
        if (ST.view === "lobby") $("games").innerHTML = lobbyList();
      },
      (e) => {
        clearTimeout(tm);
        if (ST.view === "lobby")
          $("games").innerHTML = '<p class="dim">El modo online no está disponible en esta vista.</p>';
      },
    );
}
async function createOnline() {
  leaveNet();
  newGame(ST.civ, ST.cands[ST.ci]);
  drawBase();
  OC.emitirSync("partidaLista");
  const ref = net.db.collection("partidas").doc();
  try {
    await ref.set({
      name: ST.gname,
      created: Date.now(),
      year: G.year,
      seats: { [ME]: net.uid },
      current: ME,
      ver: 1,
      state: JSON.stringify(G),
    });
    enterGame(ref.id, ME);
  } catch (e) {
    modal(
      "No se pudo crear la partida",
      `<p>${e?.code === "invalid_argument" ? "Necesitas permiso de colaborador en este juego para jugar online." : "Inténtalo de nuevo en un momento."}</p>`,
      [{ t: "Vale" }],
    );
  }
}
async function joinGame(id, f) {
  try {
    const ref = net.db.doc("partidas/" + id),
      s = await ref.get(),
      d = s.data();
    if (!d || (d.seats && f in d.seats)) {
      modal("Plaza ocupada", "<p>Otro jugador tomó esa civilización. Elige otra.</p>", [{ t: "Vale" }]);
      return;
    }
    await ref.update({ seats: { [f]: net.uid } });
    enterGame(id, f);
  } catch (e) {
    modal("No se pudo unir", "<p>Necesitas permiso de colaborador en este juego para jugar online.</p>", [
      { t: "Vale" },
    ]);
  }
}
function enterGame(id, f) {
  leaveNet();
  net.on = true;
  net.id = id;
  ME = f;
  $("start").classList.remove("show");
  net.unsub = net.db.doc("partidas/" + id).onSnapshot(
    (s) => {
      const d = s.data();
      if (!d) return;
      net.seats = d.seats || {};
      net.cur = d.current;
      names(Object.values(net.seats));
      if ((d.ver || 0) > net.ver) {
        net.ver = d.ver;
        try {
          const g = JSON.parse(d.state);
          if (!MAP || MAP.seed !== g.seed) {
            MAP = gen(g.seed);
            drawBase();
          }
          G = g;
          OC.emitirSync("partidaLista");
          if (sel === null || !G.P[sel]) {
            sel = G.F[ME].capId;
            centerOn(sel);
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (!G) return;
      G.human = Object.keys(net.seats).map(Number);
      ui();
      if (myTurn() && !busy) startTurn();
    },
    (e) => {
      modal(
        "Conexión perdida",
        "<p>La partida online dejó de responder. Vuelve al menú y entra de nuevo.</p>",
        [{ t: "Menú", fn: () => openStart("home") }],
      );
    },
  );
}
async function endOnline() {
  const hs = Object.keys(net.seats)
    .map(Number)
    .filter(alive)
    .sort((a, b) => a - b);
  G.human = Object.keys(net.seats).map(Number);
  let cur = hs.find((f) => f > ME);
  if (cur === undefined) {
    await yearEnd();
    cur =
      Object.keys(net.seats)
        .map(Number)
        .filter(alive)
        .sort((a, b) => a - b)[0] ?? ME;
  }
  net.ver++;
  net.cur = cur;
  try {
    await net.db
      .doc("partidas/" + net.id)
      .update({ state: JSON.stringify(G), ver: net.ver, current: cur, year: G.year });
  } catch (e) {
    modal("No se guardó el turno", "<p>Revisa tu conexión y vuelve a pulsar «Terminar mi turno».</p>", [
      { t: "Vale" },
    ]);
    net.ver--;
    net.cur = ME;
  }
}

/* ---------- escena del menú ---------- */
const scx = $("scene").getContext("2d");
function drawScene(now) {
  const c = scx,
    t = now / 1000;
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
