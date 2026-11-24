/* Prueba del sistema Online con un DOBLE de la API de artefactos de Claude.
   El doble (claude.use('db'|'user'|'room')) vive en Node y lo comparten varias páginas de Playwright, cada
   una con su usuario (contextos separados = personas distintas). Reproduce lo que usa el juego: documentos
   y colecciones (get/set/update/delete/acquire/onSnapshot, where/orderBy/limit, límite de 256 KiB por
   documento), room (presence, onPeers, emit/on con límite de 4 KiB, join de salas con nombre) y user (id,
   profiles, search).
   Uso: node pruebas/online.js [rápida]
   Comprueba: amigos mutuos, crear partida y unirse, turno simultáneo con órdenes de los dos y fusión,
   plazo vencido → IA por el ausente, cambio a tiempo real con envío automático, batalla en vivo entre dos
   páginas (autoridad + espejo), IA difícil contra un desconocido desconectado, batalla pendiente con un
   amigo desconectado que vuelve y la dirige, resumen «mientras no estabas», tamaño del estado (50 años,
   12 pueblos, leyendas) y que la IA difícil gana más que la normal. */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });
const RAPIDA = process.argv[2] === "rapida" || process.argv[2] === "rápida";
const errores = [];
const ok = (c, m) => {
  if (!c) {
    errores.push(m);
    console.log("  ✗ " + m);
  } else console.log("  ✓ " + m);
};

/* ===================== el doble de la API (lado Node) ===================== */
const USUARIOS = { u_ana: "Ana", u_ben: "Ben", u_cai: "Caio" };
const hub = {
  docs: new Map(),
  leases: new Map(),
  subs: new Map(), // sid -> {cli, tipo, path, q, ult}
  rooms: new Map(), // nombre -> Map(peer -> {cli, presence, t})
  clis: new Map(),
  n: 0,
};
const clon = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const padre = (p) => p.split("/").slice(0, -1).join("/");
function fusion(a, b) {
  for (const k of Object.keys(b)) {
    const v = b[k];
    if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) fusion(a[k], v);
    else a[k] = clon(v);
  }
  return a;
}
function evalQ(q) {
  let l = [...hub.docs.entries()].filter(([p]) => padre(p) === q.path).map(([p, d]) => ({ id: p.split("/").pop(), path: p, d }));
  for (const [f, op, v] of q.w || []) {
    l = l.filter(({ d }) => {
      const x = d[f];
      if (op === "==") return JSON.stringify(x) === JSON.stringify(v);
      if (op === "!=") return JSON.stringify(x) !== JSON.stringify(v);
      if (op === "<") return x < v;
      if (op === "<=") return x <= v;
      if (op === ">") return x > v;
      if (op === ">=") return x >= v;
      if (op === "in") return v.includes(x);
      if (op === "not-in") return !v.includes(x);
      if (op === "array-contains") return Array.isArray(x) && x.includes(v);
      return false;
    });
  }
  if (q.o) {
    const [f, dir] = q.o;
    l.sort((a, b) => {
      const x = a.d[f],
        y = b.d[f];
      if (x === undefined) return 1;
      if (y === undefined) return -1;
      return (x < y ? -1 : x > y ? 1 : 0) * (dir === "desc" ? -1 : 1);
    });
  } else l.sort((a, b) => (a.id < b.id ? -1 : 1));
  if (q.l) l = l.slice(0, q.l);
  return l.map((x) => ({ id: x.id, exists: true, data: x.d }));
}
function enviar(cli, ev, args) {
  cli.cola = cli.cola
    .then(() => (cli.vivo ? cli.page.evaluate(([e, a]) => window.__mockEv && window.__mockEv(e, a), [ev, args]) : null))
    .catch(() => {});
}
function snapDoc(path) {
  const d = hub.docs.get(path);
  return { id: path.split("/").pop(), exists: d !== undefined, data: clon(d) };
}
function avisar(path) {
  for (const [sid, s] of hub.subs) {
    if (s.tipo === "doc" && s.path === path) enviar(s.cli, "doc", [sid, snapDoc(path)]);
    if (s.tipo === "q" && s.q.path === padre(path)) {
      const r = evalQ(s.q),
        ant = s.ult || [],
        cambios = [];
      for (const d of r) {
        const a = ant.find((x) => x.id === d.id);
        if (!a) cambios.push({ type: "added", doc: d });
        else if (JSON.stringify(a.data) !== JSON.stringify(d.data)) cambios.push({ type: "modified", doc: d });
      }
      for (const a of ant) if (!r.some((d) => d.id === a.id)) cambios.push({ type: "removed", doc: a });
      if (!cambios.length) continue;
      s.ult = clon(r);
      enviar(s.cli, "q", [sid, clon(r), cambios]);
    }
  }
}
function peersDe(nombre) {
  const R = hub.rooms.get(nombre) || new Map();
  return [...R.entries()].map(([peer, x]) => ({ peer, by: x.cli.uid, presence: clon(x.presence), t: x.t }));
}
function avisarSala(nombre) {
  const R = hub.rooms.get(nombre);
  if (!R) return;
  const ps = peersDe(nombre);
  for (const [, x] of R) enviar(x.cli, "peers", [nombre, ps]);
}
function sala(nombre, cli, entra) {
  if (!hub.rooms.has(nombre)) hub.rooms.set(nombre, new Map());
  const R = hub.rooms.get(nombre);
  if (entra && !R.has(cli.peer)) R.set(cli.peer, { cli, presence: {}, t: Date.now() });
  if (!entra) R.delete(cli.peer);
  avisarSala(nombre);
}
function operar(cli, op, a) {
  const tam = (x) => Buffer.byteLength(JSON.stringify(x));
  switch (op) {
    case "get":
      return snapDoc(a.path);
    case "set":
      if (tam(a.d) > 256 * 1024) return { err: "invalid_argument", msg: "documento > 256 KiB" };
      hub.docs.set(a.path, clon(a.d));
      avisar(a.path);
      return true;
    case "update": {
      const d = hub.docs.get(a.path);
      if (!d) return { err: "invalid_argument", msg: "no existe" };
      const nd = fusion(clon(d), a.d);
      if (tam(nd) > 256 * 1024) return { err: "invalid_argument", msg: "documento > 256 KiB" };
      hub.docs.set(a.path, nd);
      avisar(a.path);
      return true;
    }
    case "delete":
      hub.docs.delete(a.path);
      avisar(a.path);
      return true;
    case "acquire": {
      const L = hub.leases.get(a.path),
        now = Date.now(),
        ttl = Math.min(600000, Math.max(1000, a.o.ttlMs || 30000));
      if (L && L.exp > now && L.holder !== a.o.holder) return { acquired: false, expiresAt: new Date(L.exp).toISOString() };
      hub.leases.set(a.path, { holder: a.o.holder, exp: now + ttl });
      if (a.o.data) {
        hub.docs.set(a.path, fusion(clon(hub.docs.get(a.path) || {}), a.o.data));
        avisar(a.path);
      }
      return { acquired: true, version: 1, expiresAt: new Date(now + ttl).toISOString(), holder: a.o.holder };
    }
    case "subDoc":
      hub.subs.set(a.sid, { cli, tipo: "doc", path: a.path });
      enviar(cli, "doc", [a.sid, snapDoc(a.path)]);
      return true;
    case "subQ": {
      const r = evalQ(a.q);
      hub.subs.set(a.sid, { cli, tipo: "q", q: a.q, ult: clon(r) });
      enviar(cli, "q", [a.sid, clon(r), r.map((d) => ({ type: "added", doc: d }))]);
      return true;
    }
    case "getQ":
      return evalQ(a.q);
    case "unsub":
      hub.subs.delete(a.sid);
      return true;
    case "join":
      sala(a.nombre, cli, true);
      return true;
    case "leave":
      sala(a.nombre, cli, false);
      return true;
    case "presence": {
      sala(a.nombre, cli, true);
      const x = hub.rooms.get(a.nombre).get(cli.peer);
      for (const k in a.p) if (a.p[k] === null) delete x.presence[k];
      else x.presence[k] = clon(a.p[k]);
      x.t = Date.now();
      avisarSala(a.nombre);
      return true;
    }
    case "emit": {
      if (tam(a.data) > 4096) return { err: "invalid_argument", msg: "mensaje > 4 KiB" };
      const R = hub.rooms.get(a.nombre);
      if (!R) return true;
      for (const [, x] of R) {
        const k = (a.nombre.startsWith("b-") ? "sala" : a.nombre || "vestibulo") + ":" + a.topic;
        x.cli.rec[k] = (x.cli.rec[k] || 0) + 1;
        enviar(x.cli, "msg", [a.nombre, { topic: a.topic, data: clon(a.data), peer: cli.peer, by: cli.uid }]);
      }
      hub.emits = (hub.emits || 0) + 1;
      return true;
    }
    case "profiles": {
      const o = {};
      for (const id of a.ids) o[id] = { id, name: USUARIOS[id] || "", avatarUrl: "", color: "#888", email: null, isMe: id === cli.uid, guest: false };
      return o;
    }
    case "search":
      return Object.keys(USUARIOS)
        .filter((id) => USUARIOS[id].toLowerCase().includes(String(a.q).toLowerCase()))
        .map((id) => ({ id, name: USUARIOS[id], avatarUrl: "", color: "#888", email: null, isMe: id === cli.uid, guest: false }));
  }
  return { err: "invalid_argument", msg: "op " + op };
}
/* ===================== el doble (lado de la página) ===================== */
const MOCK_PAGINA = function (uid) {
  const cbs = {},
    salas = {},
    llama = async (op, a) => {
      const r = await window.__mock(op, a);
      if (r && r.err) throw { code: r.err, message: r.msg || r.err };
      return r;
    };
  let n = 0;
  const nid = () => "s" + ++n + Math.random().toString(36).slice(2, 6);
  const seg = (p) => String(p).split("/");
  const chk = (p, par) => {
    const s = seg(p);
    if (s.some((x) => !/^[A-Za-z0-9_\-.~:@+]+$/.test(x) || x === "." || x === ".."))
      throw new TypeError("segmento inválido en " + p);
    if ((s.length % 2 === 0) !== par) throw new TypeError("paridad de ruta (" + s.length + "): " + p);
  };
  const snap = (d) => {
    const dd = d.data;
    return { id: d.id, exists: !!d.exists, data: () => (d.exists ? JSON.parse(JSON.stringify(dd)) : undefined), metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const qsnap = (l, ch) => {
    const docs = l.map(snap);
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => (ch || []).map((c) => ({ type: c.type, doc: snap(c.doc), oldIndex: -1, newIndex: -1 })), metadata: { fromCache: false, hasPendingWrites: false } };
  };
  function Doc(p) {
    chk(p, true);
    this.path = p;
    this.id = seg(p).pop();
  }
  Doc.prototype.get = function () {
    return llama("get", { path: this.path }).then(snap);
  };
  Doc.prototype.set = function (d) {
    return llama("set", { path: this.path, d });
  };
  Doc.prototype.update = function (d) {
    return llama("update", { path: this.path, d });
  };
  Doc.prototype.delete = function () {
    return llama("delete", { path: this.path });
  };
  Doc.prototype.acquire = function (o) {
    return llama("acquire", { path: this.path, o });
  };
  Doc.prototype.onSnapshot = function (next, err) {
    const sid = nid();
    cbs[sid] = (d) => next(snap(d));
    llama("subDoc", { sid, path: this.path }).catch((e) => err && err(e));
    return () => {
      delete cbs[sid];
      llama("unsub", { sid });
    };
  };
  Doc.prototype.collection = function (p) {
    return new Col(this.path + "/" + p);
  };
  function Q(path, w, o, l) {
    this.path = path;
    this._q = { path, w: w || [], o: o || null, l: l || null };
  }
  Q.prototype.where = function (f, op, v) {
    return new Q(this.path, [...this._q.w, [f, op, v]], this._q.o, this._q.l);
  };
  Q.prototype.orderBy = function (f, d) {
    return new Q(this.path, this._q.w, [f, d || "asc"], this._q.l);
  };
  Q.prototype.limit = function (k) {
    return new Q(this.path, this._q.w, this._q.o, k);
  };
  Q.prototype.get = function () {
    return llama("getQ", { q: this._q }).then((l) => qsnap(l, l.map((d) => ({ type: "added", doc: d }))));
  };
  Q.prototype.onSnapshot = function (next, err) {
    const sid = nid();
    cbs[sid] = (l, ch) => next(qsnap(l, ch));
    llama("subQ", { sid, q: this._q }).catch((e) => err && err(e));
    return () => {
      delete cbs[sid];
      llama("unsub", { sid });
    };
  };
  function Col(p) {
    chk(p, false);
    Q.call(this, p);
  }
  Col.prototype = Object.create(Q.prototype);
  Col.prototype.doc = function (id) {
    return new Doc(this.path + "/" + (id || "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)));
  };
  Col.prototype.add = async function (d) {
    const r = this.doc();
    await r.set(d);
    return r;
  };
  const db = { doc: (p) => new Doc(p), collection: (p) => new Col(p) };
  /* room */
  function Sala(nombre) {
    const S = { nombre, on: {}, peers: [], fp: [] };
    salas[nombre] = S;
    return {
      name: nombre,
      emit: (topic, data) => llama("emit", { nombre, topic, data }),
      on: (topic, fn) => {
        (S.on[topic] = S.on[topic] || []).push(fn);
        return () => (S.on[topic] = S.on[topic].filter((x) => x !== fn));
      },
      presence: (p) => llama("presence", { nombre, p }),
      peers: () => S.peers,
      onPeers: (fn) => {
        S.fp.push(fn);
        setTimeout(() => fn({ peers: S.peers, joined: S.peers, left: [], updated: [] }), 0);
        return () => (S.fp = S.fp.filter((x) => x !== fn));
      },
      connected: () => true,
      onConnection: (fn) => (setTimeout(() => fn(true), 0), () => {}),
      leave: () => {
        S.dentro = false;
        return llama("leave", { nombre });
      },
    };
  }
  const lobby = Sala("");
  llama("join", { nombre: "" });
  const room = { ...lobby };
  room.join = async (nm) => {
    if (salas[nm] && salas[nm].api && salas[nm].dentro) return salas[nm].api;
    const api = Sala(nm);
    salas[nm].dentro = true;
    salas[nm].api = api;
    await llama("join", { nombre: nm });
    return api;
  };
  window.__mockEv = (ev, a) => {
    if (ev === "doc" || ev === "q") {
      const f = cbs[a[0]];
      if (f) f(a[1], a[2]);
    }
    if (ev === "peers") {
      const S = salas[a[0]];
      if (!S) return;
      const ant = S.peers,
        ps = Object.freeze(
          a[1].map((p) => Object.freeze({ peer: p.peer, by: p.by, isMe: p.by === uid, sameTab: p.peer === window.__mockPeer, kind: "viewer", guest: false, presence: Object.freeze(p.presence), updatedAt: p.t })),
        );
      S.peers = ps;
      const ch = { peers: ps, joined: ps.filter((p) => !ant.some((q) => q.peer === p.peer)), left: ant.filter((p) => !ps.some((q) => q.peer === p.peer)), updated: ps };
      S.fp.forEach((f) => f(ch));
    }
    if (ev === "msg") {
      const S = salas[a[0]];
      if (!S) return;
      const m = a[1],
        msg = { topic: m.topic, data: m.data, peer: m.peer, by: m.by, isMe: m.by === uid, sameTab: m.peer === window.__mockPeer, kind: "viewer", guest: false };
      (S.on[m.topic] || []).slice().forEach((f) => f(msg));
    }
  };
  const user = {
    id: async () => uid,
    me: async () => ({ id: uid, name: "", avatarUrl: "", color: "#888", email: null, isOwner: false, canEdit: false }),
    isOwner: async () => false,
    canEdit: async () => false,
    can: async () => null,
    profiles: (ids) => llama("profiles", { ids: [].concat(ids) }),
    search: (q) => llama("search", { q }),
    name: async () => "",
  };
  window.claude = {
    use: async (nm) => {
      await new Promise((r) => setTimeout(r, 30));
      return nm === "db" ? db : nm === "user" ? user : nm === "room" ? room : null;
    },
  };
};

/* ===================== utilidades de la prueba ===================== */
let browser;
async function pagina(uid) {
  const context = await browser.newContext({ viewport: { width: 1300, height: 860 } });
  const page = await context.newPage();
  const cli = { uid, page, cola: Promise.resolve(), vivo: true, peer: "p" + ++hub.n + uid, rec: {} };
  hub.clis.set(cli.peer, cli);
  page.on("pageerror", (e) => errores.push(`[${uid}] pageerror: ${e.stack || e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.g|ERR_|net::|Failed to load resource/.test(m.text())) errores.push(`[${uid}] console: ${m.text()}`);
  });
  page.on("close", () => salir(cli));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.exposeFunction("__mock", (op, a) => operar(cli, op, a));
  await page.addInitScript(`window.__mockPeer = ${JSON.stringify(cli.peer)}; (${MOCK_PAGINA.toString()})(${JSON.stringify(uid)});`);
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.waitForFunction(() => typeof net !== "undefined" && net.uid && ONL.room, null, { timeout: 15000 });
  /* cierra solo los modales de eventos; anota sus títulos */
  await page.evaluate(() => {
    window.__modales = [];
    window.__prefer = /autom/i;
    setInterval(() => {
      if (window.__pausaModal) return;
      const m = document.getElementById("modal");
      if (!m.classList.contains("show")) return;
      const t = (document.querySelector("#modalc h2") || {}).textContent || "";
      if (window.__modales[window.__modales.length - 1] !== t + "|" + m.dataset.n) {
        m.dataset.n = String(Math.random());
        window.__modales.push(t + "|" + m.dataset.n);
        (window.__textos = window.__textos || []).push(t + " :: " + document.getElementById("modalc").textContent);
      }
      const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
      (bs.find((b) => window.__prefer && window.__prefer.test(b.textContent)) || bs[0])?.click();
    }, 120);
  });
  cli.ctx = context;
  return cli;
}
function salir(cli) {
  if (!cli.vivo) return;
  cli.vivo = false;
  for (const [sid, s] of hub.subs) if (s.cli === cli) hub.subs.delete(sid);
  for (const [nm, R] of hub.rooms)
    if (R.has(cli.peer)) {
      R.delete(cli.peer);
      avisarSala(nm);
    }
}
const ev = (c, f, a) => c.page.evaluate(f, a);
async function esperar(c, f, a, ms = 30000, msg = "") {
  try {
    await c.page.waitForFunction(f, a, { timeout: ms, polling: 150 });
    return true;
  } catch (e) {
    errores.push(`[${c.uid}] tiempo agotado: ${msg || f.toString().slice(0, 120)}`);
    console.log(`  ✗ tiempo agotado (${c.uid}): ${msg}`);
    try {
      for (const o of hub.clis.values())
        if (o.vivo) console.log(`    trazas ${o.uid}:`, JSON.stringify(await o.page.evaluate(() => ONL.log.slice(-8))));
      console.log("    estado:", JSON.stringify(await c.page.evaluate(() => ({ res: !!ONL.resolviendo, busy, BT: !!BT, fase: ONL.meta && ONL.meta.fase, modal: document.getElementById("modal").classList.contains("show") ? document.querySelector("#modalc h2").textContent : null, capas: [...document.querySelectorAll(".onl-capa.show h2")].map((x) => x.textContent), ultimos: window.__modales.slice(-5) }))));
    } catch (_) {}
    return false;
  }
}
/* clic real; si no se puede (p. ej. algo tapa el botón), se anota y se pulsa por código */
async function pulsar(c, sel) {
  try {
    await c.page.click(sel, { timeout: 8000 });
  } catch (e) {
    errores.push(`[${c.uid}] no se pudo pulsar ${sel}: ${String(e.message).split("\n")[0]}`);
    console.log(`  ✗ no se pudo pulsar ${sel} (${c.uid}):`, JSON.stringify(await c.page.evaluate(() => ONL.log.slice(-6))));
    await c.page.evaluate((s) => document.querySelector(s)?.click(), sel);
  }
}
const titulos = (c) => ev(c, () => window.__modales.map((x) => x.split("|")[0]));
const meta = (id) => hub.docs.get("partidas/" + id);
/* deja preparada una escaramuza: guerra entre a y b y dos ejércitos en casillas vecinas; publica una versión nueva */
async function escaramuza(c, fa, fb) {
  return ev(
    c,
    async ([fa, fb]) => {
      G.st[fa][fb] = G.st[fb][fa] = "guerra";
      const S = camS();
      S.ej = S.ej.filter((e) => e.f !== fa && e.f !== fb);
      const cap = G.P[G.F[fa].capId];
      let par = null;
      for (let r = 2; r < 12 && !par; r++)
        for (let dy = -r; dy <= r && !par; dy++)
          for (let dx = -r; dx <= r && !par; dx++) {
            const x = cap.x + dx,
              y = cap.y + dy;
            const libre = (x, y) =>
              x > 0 && y > 0 && x < W - 1 && y < H - 1 && MAP.terr[y][x] && MAP.grid[y][x] >= 0 && !camCiudadEn(x, y) && !camEjsEn(x, y).length;
            if (libre(x, y) && libre(x + 1, y) && G.P[MAP.grid[y][x]].owner === fa) par = [x, y];
          }
      const [x, y] = par;
      const A = camNuevoEj(fa, x, y, { i: 8, a: 4, c: 2 }),
        B = camNuevoEj(fb, x + 1, y, { i: 8, a: 4 });
      A.mov = camMovMax(A);
      B.mov = camMovMax(B);
      const m = ONL.meta,
        ver = m.ver + 1;
      for (const l of G.log) if (l.t == null) l.t = m.turno - 1;
      const pk = onlEmpaquetar(G);
      await onlGuardarEstado(net.id, ver, pk);
      await net.db.doc("partidas/" + net.id).update({ ver, partes: pk.partes.length });
      return { A: A.id, B: B.id, x: x + 1, y };
    },
    [fa, fb],
  );
}

/* ===================== la prueba ===================== */
(async () => {
  browser = await chromium.launch();
  const t0 = Date.now();
  console.log("Online: amigos, partida, turnos, batallas");
  const A = await pagina("u_ana");
  let B = await pagina("u_ben");
  ok(await ev(A, () => !document.querySelector('[data-act="s-onl"]').disabled), "el botón «Partida online» se activa con el doble de la API");

  /* --- amigos mutuos --- */
  await ev(A, () => onlAmigoPedir("u_ben"));
  await esperar(B, () => ONL.amigos.u_ana && ONL.amigos.u_ana.estado === "pendiente", null, 8000, "B recibe la solicitud");
  ok(await ev(B, () => ONL.avisos.some((a) => a.tipo === "amistad")), "la solicitud llega a la bandeja de avisos del otro");
  await ev(B, () => onlAmigoAceptar("u_ana"));
  await esperar(A, () => onlEsAmigo("u_ben"), null, 8000, "amistad aceptada");
  ok(await ev(A, () => onlEsAmigo("u_ben")) && (await ev(B, () => onlEsAmigo("u_ana"))), "amistad mutua (pedir y aceptar)");

  /* --- crear partida (interfaz) --- */
  await A.page.click('[data-act="s-onl"]');
  await A.page.click('[data-act="s-onltab-nueva"]');
  await A.page.selectOption("#onl-pub", "1");
  await A.page.selectOption("#onl-plazo", "1");
  await A.page.selectOption("#onl-invseg", "60");
  await A.page.selectOption("#onl-amigo", "30");
  await A.page.selectOption("#onl-mbat", "t1");
  await A.page.check("#onl-inv-u_ben");
  await A.page.click('[data-act="s-onlcfg"]');
  await A.page.click('[data-act="s-civ-0"]');
  await A.page.fill("#gname", "Prueba online");
  await A.page.click('[data-act="s-go"]');
  await esperar(A, () => net.on && G && ONL.meta && ONL.ver === 1, null, 15000, "partida creada");
  const id = await ev(A, () => net.id);
  ok(!!meta(id) && meta(id).v === 2 && meta(id).invitados.includes("u_ben"), "partida creada con metadatos v2 e invitación");
  ok(hub.docs.has(`partidas/${id}/estado/v1-0`) && !("state" in meta(id)), "el estado va comprimido en trozos aparte, no en el documento de la lista");

  /* --- unirse (B ve la invitación en Mis partidas) --- */
  await B.page.click('[data-act="s-onl"]');
  await esperar(B, (id) => !!document.getElementById("onl-js-" + id), id, 8000, "B ve la partida invitada");
  await B.page.selectOption("#onl-js-" + id, "2");
  await B.page.click(`[data-act="s-onluni-${id}"]`);
  await esperar(B, () => net.on && G && ONL.ver >= 1 && ME === 2, null, 15000, "B dentro de la partida");
  ok(meta(id).seats[2] === "u_ben" && meta(id).jug.includes("u_ben"), "B ocupa a los visigodos");
  await esperar(A, () => ONL.meta && ONL.meta.seats[2] === "u_ben", null, 8000, "A ve a B");

  /* --- turno 0: los dos dan órdenes a la vez --- */
  const r0 = await ev(A, async () => {
    const cap = G.F[ME].capId;
    G.P[cap].u.i += 3; // acción de gobierno (cambio en el estado)
    const r = await camOrdenUI({ tipo: "formar", f: ME, p: cap, u: { i: 2 }, gen: false });
    const ej = camEj(r.ej);
    let dst = null;
    for (let d = 2; d < 6 && !dst; d++)
      for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) {
        const x = ej.x + dx,
          y = ej.y + dy;
        if (x >= 0 && y >= 0 && x < W && y < H && MAP.terr[y][x] && G.P[MAP.grid[y][x]] && G.P[MAP.grid[y][x]].owner === ME && !camCiudadEn(x, y)) {
          dst = [x, y];
          break;
        }
      }
    const q = await camOrdenUI({ tipo: "mover", f: ME, ej: ej.id, x: dst[0], y: dst[1] });
    return { ej: ej.id, x0: ej.x, y0: ej.y, dst, encolada: q.encolada, cola: ONL.cola.length, sigue: camEj(ej.id).x === ej.x, iCap: G.P[cap].u.i, cap };
  });
  ok(r0.encolada && r0.cola === 1, "la marcha se encola (no se ejecuta al momento)");
  const rb0 = await ev(B, () => {
    const cap = G.F[ME].capId;
    G.P[cap].u.a += 2;
    G.F[ME].gold -= 7;
    return { cap, a: G.P[cap].u.a, oro: G.F[ME].gold };
  });
  await ev(A, () => endTurn());
  await esperar(A, () => ONL.meta && ONL.meta.listos[0] === 0, null, 8000, "A listo");
  ok(!(await ev(A, () => myTurn())), "tras «Listo» ya no es tu turno (esperando al otro)");
  await ev(B, () => endTurn());
  await esperar(A, () => ONL.meta && ONL.meta.turno === 1 && ONL.ver === 2, null, 30000, "estación 1 resuelta");
  await esperar(B, () => ONL.meta && ONL.meta.turno === 1 && ONL.ver === 2, null, 15000, "B recibe la estación 1");
  const r1 = await ev(
    B,
    ([r0, rb0]) => {
      const ej = camEj(r0.ej);
      return { ej: !!ej, movio: ej && (ej.x !== r0.x0 || ej.y !== r0.y0), iCapA: G.P[r0.cap].u.i, aB: G.P[rb0.cap].u.a, oroB: G.F[2].gold, est: G.estacion, cron: onlS().cron.length };
    },
    [r0, rb0],
  );
  ok(r1.ej && r1.movio, "el ejército de A marchó en la resolución simultánea (lo ve B)");
  ok(r1.aB === rb0.a, "los arqueros que reclutó B están en el estado fusionado");
  ok(r1.iCapA >= r0.iCap - 1, "las levas de A (cambio de gobierno) sobreviven a la fusión");
  ok((await ev(A, () => G.estacion)) === 1 || (await ev(A, () => G.estacion)) === 0, "la ronda avanza por estaciones (finEstacion)");

  /* --- turno 1: B no da órdenes; vence el plazo → IA por el ausente --- */
  await ev(A, () => endTurn());
  await esperar(A, () => ONL.meta.listos[0] === 1, null, 8000, "A listo t1");
  /* «Quitar listo»: se vuelve a dar órdenes y se reenvía (vale siempre el último envío) */
  ok(/listos 1\/2/.test(await ev(A, () => onlTextoTurno().info)), "«listos 1/2» tras pulsar Listo");
  const v1 = meta(id).envV[0];
  ok(await ev(A, () => onlQuitarListo()), "se puede quitar el «Listo» mientras no se resuelve");
  ok((await ev(A, () => myTurn())) && /listos 0\/2/.test(await ev(A, () => onlTextoTurno().info)), "vuelve a ser tu turno y el contador baja al instante");
  ok(meta(id).listos[0] === -1, "la meta refleja que ya no estás listo");
  await ev(A, () => {
    G.P[G.F[ME].capId].u.i += 1;
    return endTurn();
  });
  await esperar(A, () => ONL.meta.listos[0] === 1, null, 8000, "A listo otra vez");
  ok(meta(id).envV[0] !== v1, "el reenvío lleva versión nueva");
  await ev(A, () => net.db.doc("partidas/" + net.id).update({ resolviendo: { turno: ONL.meta.turno, ts: onlAhora(), por: "u_x" } }));
  await A.page.waitForTimeout(300);
  ok(!(await ev(A, () => onlQuitarListo())), "si alguien ya está resolviendo, no se puede quitar el «Listo»");
  await A.page.waitForTimeout(400);
  ok((await titulos(A)).some((t) => /ya se está resolviendo/.test(t)), "aviso «la estación ya se está resolviendo»");
  await ev(A, () => net.db.doc("partidas/" + net.id).update({ resolviendo: null }));
  for (const c of [A, B]) await ev(c, () => (ONL.desfase += 2 * 3600 * 1000));
  await esperar(A, () => ONL.meta && ONL.meta.turno === 2, null, 30000, "plazo vencido → estación 2");
  ok(meta(id).faltas[2] === 1, "el ausente suma una falta");
  ok(await ev(A, () => onlS().cron.some((c) => /la IA gobernó/.test(c.m))), "crónica: la IA gobernó al ausente");
  await esperar(B, () => ONL.meta && ONL.meta.turno === 2 && ONL.ver === 3, null, 15000, "B recibe la estación 2");
  await B.page.waitForTimeout(600);
  ok((await titulos(B)).some((t) => /se cerró sin tus órdenes/.test(t)), "B ve que la estación se cerró sin sus órdenes");

  /* --- cambio a tiempo real con los dos conectados: envío automático al acabar el reloj --- */
  await ev(A, () => net.db.doc("partidas/" + net.id).update({ cfg: { trSeg: 6 } }));
  await A.page.waitForTimeout(400);
  await ev(A, () => {
    tab = "onl";
    ui();
  });
  ok(await ev(A, () => !!document.querySelector('[data-act="onl-tr"]:not([disabled])')), "«Pasar a tiempo real» se activa con todos conectados");
  await A.page.click('[data-act="onl-tr"]');
  await esperar(B, () => ONL.meta && ONL.meta.cfg.modoTurno === "tr", null, 8000, "modo tiempo real");
  await esperar(A, () => ONL.meta && ONL.meta.turno === 3, null, 30000, "estación en tiempo real resuelta");
  ok(meta(id).listos[2] === 2 && meta(id).listos[0] === 2, "los dos enviaron solos al acabar el reloj (tiempo real)");
  ok((meta(id).limite - Date.now() - (await ev(A, () => ONL.desfase))) < 8000, "la nueva estación en tiempo real tiene el plazo corto");
  await ev(A, () => net.db.doc("partidas/" + net.id).update({ cfg: { modoTurno: "corr" }, limite: onlAhora() + 3600000 }));
  await A.page.waitForTimeout(500);

  /* --- batalla en vivo entre dos páginas --- */
  const sc = await escaramuza(A, 0, 2);
  await esperar(B, (v) => ONL.ver === v, meta(id).ver, 10000, "B recibe la escaramuza");
  await esperar(A, (v) => ONL.ver === v, meta(id).ver, 10000, "A recarga la escaramuza");
  await ev(A, (sc) => camOrdenUI({ tipo: "mover", f: ME, ej: sc.A, x: sc.x, y: sc.y }), sc);
  await ev(B, () => (ONL.noCerrar = true)); // resuelve A (el atacante)
  await ev(B, () => endTurn());
  await esperar(B, () => ONL.meta.listos[2] === ONL.meta.turno, null, 8000, "B listo");
  await ev(A, () => endTurn());
  await esperar(B, () => !!document.querySelector('[data-act="s-onlinv-si"]'), null, 30000, "B recibe la invitación a la batalla");
  await B.page.screenshot({ path: path.join(capt, "online-invitacion.png") });
  await pulsar(B, '[data-act="s-onlinv-si"]');
  await esperar(A, () => BT && BT.ctx && BT.ctx.onl, null, 30000, "A abre la batalla como autoridad");
  await esperar(B, () => BT && BT.espejo && BT.espejo.ok, null, 20000, "B abre el espejo");
  ok(await ev(B, () => BT.units.filter((u) => !u.side).every((u) => u.f === 2)), "en el espejo de B sus tropas son las suyas (campo girado)");
  await ev(A, () => battleAct("go"));
  for (let k = 0; k < 2; k++) {
    await ev(A, () => battleAct("exec"));
    await B.page.waitForTimeout(200);
    await ev(B, () => battleAct("exec"));
    await esperar(A, (k) => BT && BT.turn >= k + 2 && !BT.run, k, 20000, "turno de batalla " + (k + 1));
    await esperar(B, (k) => BT && BT.turn >= k + 2 && !BT.run, k, 10000, "foto del turno en B");
  }
  const mov = await ev(B, () => BT.units.some((u) => u.mvT));
  ok(mov, "el espejo recibe las fotos del campo (las unidades se mueven)");
  await B.page.screenshot({ path: path.join(capt, "online-espejo.png") });
  await ev(B, () => battleAct("flee"));
  await esperar(A, () => !BT, null, 20000, "fin de la batalla en A");
  await esperar(B, () => !BT && ONL.ultEspejo, null, 20000, "fin de la batalla en B");
  await esperar(A, () => ONL.meta && !ONL.resolviendo && ONL.meta.fase === "ordenes", null, 30000, "estación publicada tras la batalla");
  ok(await ev(A, () => ONL.log.some((l) => /^batalla .* local\/remoto/.test(l))), "la batalla se libró en vivo (local contra remoto)");
  await ev(B, () => (ONL.noCerrar = false));
  ok((await ev(B, () => ONL.ultEspejo.gana)) === 0, "B se retiró: gana el atacante (lo ven los dos)");

  /* --- IA difícil: desconocido desconectado --- */
  await ev(A, () => onlAmigoQuitar("u_ben"));
  await esperar(B, () => !ONL.amigos.u_ana, null, 8000, "amistad retirada");
  const sc2 = await escaramuza(A, 0, 2);
  await esperar(A, (v) => ONL.ver === v, meta(id).ver, 10000, "A recarga (2)");
  await B.page.close();
  await A.page.waitForTimeout(300);
  ok(!(await ev(A, () => onlConectado("u_ben"))), "B desconectado (no está en la sala)");
  await ev(A, (sc) => camOrdenUI({ tipo: "mover", f: ME, ej: sc.A, x: sc.x, y: sc.y }), sc2);
  await ev(A, () => endTurn());
  const tA = Date.now();
  await ev(A, () => (ONL.desfase += 2 * 3600 * 1000));
  await esperar(A, (t) => ONL.meta && ONL.meta.turno > t, meta(id).turno, 40000, "estación con batalla contra la IA");
  ok(
    await ev(A, () => ONL.log.some((l) => /^batalla .* (local\/ia normal\/dificil|ia\/local dificil\/normal)/.test(l))),
    "contra un desconocido ausente: IA difícil al momento",
  );
  ok(Date.now() - tA < 30000, "sin esperas (no se suspende la estación)");

  /* --- amigo desconectado: la estación espera; vuelve y dirige la batalla --- */
  B = await pagina("u_ben");
  await ev(A, () => onlAmigoPedir("u_ben"));
  await esperar(B, () => ONL.amigos.u_ana, null, 8000, "B recibe de nuevo la amistad");
  await ev(B, () => onlAmigoAceptar("u_ana"));
  await esperar(A, () => onlEsAmigo("u_ben"), null, 8000, "amigos otra vez");
  await B.page.close();
  await A.page.waitForTimeout(300);
  const sc3 = await escaramuza(A, 0, 2);
  await esperar(A, (v) => ONL.ver === v, meta(id).ver, 10000, "A recarga (3)");
  await ev(A, (sc) => camOrdenUI({ tipo: "mover", f: ME, ej: sc.A, x: sc.x, y: sc.y }), sc3);
  await ev(A, () => endTurn());
  await ev(A, () => (ONL.desfase += 2 * 3600 * 1000));
  await esperar(A, () => ONL.meta && ONL.meta.fase === "batalla", null, 40000, "estación detenida por la batalla con un amigo");
  ok(meta(id).fase === "batalla" && meta(id).batalla.d === "u_ben", "batalla pendiente: se espera al amigo desconectado");
  ok(hub.docs.has(`avisos/u_ben/items/bat-${id}`), "el aviso de la batalla queda en la db para el amigo");
  await ev(A, () => (ONL.noCerrar = true)); // la reanuda el amigo que vuelve
  B = await pagina("u_ben");
  await ev(B, () => (ONL.desfase = 6 * 3600 * 1000));
  await B.page.click('[data-act="s-onl"]');
  await esperar(B, (id) => !!document.querySelector(`[data-act="s-onlent-${id}"]`), id, 8000, "B ve su partida");
  ok(await ev(B, () => /Te atacan/.test(document.getElementById("onl-lob").textContent)), "en «Mis partidas» aparece la batalla pendiente");
  await B.page.click(`[data-act="s-onlent-${id}"]`);
  await esperar(B, () => window.__modales.some((t) => /Mientras no estabas/.test(t)), null, 15000, "resumen al volver");
  await esperar(A, () => !!document.querySelector('[data-act="s-onlinv-si"]'), null, 60000, "A recibe la invitación del defensor");
  await pulsar(A, '[data-act="s-onlinv-si"]');
  await esperar(B, () => BT && BT.ctx && BT.ctx.onl, null, 30000, "B dirige la batalla como autoridad");
  await esperar(A, () => BT && BT.espejo && BT.espejo.ok, null, 20000, "A ve el espejo");
  await ev(B, () => battleAct("go"));
  await ev(B, () => battleAct("exec"));
  await ev(A, () => battleAct("exec"));
  await esperar(B, () => BT && BT.turn >= 2 && !BT.run, null, 20000, "turno de la batalla del amigo");
  await ev(A, () => battleAct("flee"));
  /* si la marcha pendiente vuelve a chocar, A deja esa a sus capitanes */
  await ev(A, () => (window.__rechazo = setInterval(() => document.querySelector('[data-act="s-onlinv-no"]')?.click(), 300)));
  await esperar(B, () => !BT && ONL.meta && ONL.meta.fase === "ordenes" && !ONL.resolviendo, null, 90000, "la estación sigue tras la batalla del amigo");
  ok(meta(id).fase === "ordenes" && !meta(id).batalla, "la estación se reanudó y se publicó");
  await ev(A, () => ((ONL.noCerrar = false), clearInterval(window.__rechazo)));
  ok(await ev(B, () => ONL.log.some((l) => /^batalla .* remoto\/local/.test(l))), "el amigo que vuelve dirige su defensa en vivo");

  /* --- tamaño del estado y dificultad --- */
  /* --- tres jugadores: la guerra de A contra B no le llega a C --- */
  console.log("Tres jugadores: la guerra es cosa de los implicados");
  const C = await pagina("u_cai");
  await ev(C, (x) => (ONL.desfase = x), await ev(A, () => ONL.desfase));
  await ev(B, (x) => (ONL.desfase = x), await ev(A, () => ONL.desfase));
  await ev(A, () => {
    ONL.cfg = { ...ONL_CFG_DEF, plazoH: 1, invitSeg: 60, amigoMin: 0, modoBatalla: "t1" };
    ONL.nuevaPub = true;
    ONL.nuevaInv = [];
    ST.civ = 0;
    ST.modo = "historico";
    ST.cands = cands(0);
    ST.ci = 0;
    ST.gname = "Tres reinos";
    return onlCrear();
  });
  await esperar(A, () => net.on && ONL.meta && ONL.meta.name === "Tres reinos" && ONL.ver === 1, null, 15000, "partida de tres creada");
  const id3 = await ev(A, () => net.id);
  await ev(B, (id) => onlUnirse(id, 2), id3);
  await ev(C, (id) => onlUnirse(id, 3), id3);
  await esperar(B, (id) => net.on && net.id === id && G && ONL.ver >= 1, id3, 15000, "B en la partida de tres");
  await esperar(C, (id) => net.on && net.id === id && G && ONL.ver >= 1, id3, 15000, "C en la partida de tres");
  await esperar(A, () => Object.keys(ONL.meta.seats).length === 3, null, 8000, "tres asientos");
  /* A declara la guerra a B (diplomacia de verdad) y prepara la escaramuza */
  await ev(A, () => declareWar(0, 2));
  const s3 = await escaramuza(A, 0, 2);
  for (const c of [A, B, C]) await esperar(c, (v) => ONL.ver === v, meta(id3).ver, 10000, "escaramuza de tres");
  const recC0 = { ...C.rec };
  await ev(C, () => {
    window.__vioBT = false;
    window.__vigia = setInterval(() => {
      if (BT || document.querySelector("#onl-inv.show")) window.__vioBT = true;
    }, 100);
    window.__textos = [];
  });
  await ev(A, (sc) => camOrdenUI({ tipo: "mover", f: ME, ej: sc.A, x: sc.x, y: sc.y }), s3);
  for (const c of [B, C]) await ev(c, () => (ONL.noCerrar = true)); // resuelve A
  await ev(C, () => endTurn());
  await ev(B, () => endTurn());
  await esperar(A, () => ONL.meta.listos[2] === ONL.meta.turno && ONL.meta.listos[3] === ONL.meta.turno, null, 8000, "B y C listos");
  await ev(A, () => endTurn());
  await esperar(B, () => !!document.querySelector('[data-act="s-onlinv-si"]'), null, 30000, "B invitado (tres)");
  await pulsar(B, '[data-act="s-onlinv-si"]');
  await esperar(B, () => BT && BT.espejo && BT.espejo.ok, null, 20000, "espejo de B (tres)");
  await ev(A, () => battleAct("go"));
  await ev(B, () => battleAct("flee"));
  await esperar(A, (t) => ONL.meta && ONL.meta.turno > t && !ONL.resolviendo, meta(id3).turno, 40000, "estación de tres publicada");
  await esperar(C, (v) => ONL.ver === v, meta(id3).ver, 15000, "C recibe la estación");
  await C.page.waitForTimeout(800);
  const vistoC = await ev(C, () => ({ bt: window.__vioBT, inv: !!ONL.inv, textos: window.__textos.join(" || "), notif: ONL.ultNotif || "", avisos: ONL.avisos.map((a) => a.id), armas: (narF(3).cola || []).some((q) => q.e === "armas"), cron: onlS().cron.filter((c) => c.f.includes(3)).map((c) => c.m) }));
  ok(!vistoC.bt && !vistoC.inv, "C (conectado, ajeno) no ve la batalla ni la invitación");
  ok(!C.rec["sala:onl.b"], "C no recibe ni una foto de la sala de la batalla");
  ok(!/Victoria|Derrota|¡Te atacan|Batalla en|guerra/i.test(vistoC.textos), "C no recibe modales de la guerra ajena");
  ok(!/atac|batalla/i.test(vistoC.notif) && !vistoC.avisos.some((a) => /^bat-/.test(a)), "ni avisos ni notificaciones de batalla para C");
  ok(!vistoC.armas, "la declaración de guerra solo avisa al defendido (no a C)");
  ok(!vistoC.cron.some((m) => /Visigodos|Occidente/.test(m)), "la crónica personal de C no recoge la guerra ajena");
  ok(await ev(B, () => (narF(2).cola || []).some((q) => q.e === "armas") || G.evY[2] === G.year), "el defendido sí recibe el aviso de guerra");
  /* ahora resuelve C, que no participa: la batalla la dirige A y nunca se abre en C */
  const s4 = await escaramuza(A, 0, 2);
  for (const c of [A, B, C]) await esperar(c, (v) => ONL.ver === v, meta(id3).ver, 10000, "escaramuza 2 de tres");
  await ev(C, () => ((window.__vioBT = false), (window.__textos = []), (ONL.noCerrar = false)));
  for (const c of [A, B]) await ev(c, () => (ONL.noCerrar = true)); // resuelve C, que no participa
  await ev(A, (sc) => camOrdenUI({ tipo: "mover", f: ME, ej: sc.A, x: sc.x, y: sc.y }), s4);
  await ev(A, () => endTurn());
  await ev(B, () => endTurn());
  await esperar(C, () => ONL.meta.listos[0] === ONL.meta.turno && ONL.meta.listos[2] === ONL.meta.turno, null, 8000, "A y B listos");
  await ev(C, () => endTurn());
  if (!(await esperar(A, () => !!document.querySelector('[data-act="s-onlinv-si"]'), null, 30000, "A invitado por C")))
    console.log("    C:", JSON.stringify(await ev(C, () => ({ log: ONL.log.slice(-8), res: !!ONL.resolviendo, esp: ONL.esperaInv, rep: typeof IFZ_REP !== "undefined" && IFZ_REP.on, busy, bt: !!BT, peers: ONL.peers.map((p) => onlUidPeer(p)), meta: ONL.meta && { turno: ONL.meta.turno, listos: ONL.meta.listos, limite: ONL.meta.limite - onlAhora() } }))));
  await pulsar(A, '[data-act="s-onlinv-si"]');
  await esperar(B, () => !!document.querySelector('[data-act="s-onlinv-si"]'), null, 30000, "B invitado por C");
  await pulsar(B, '[data-act="s-onlinv-si"]');
  await esperar(A, () => BT && BT.ctx && BT.ctx.onl, null, 40000, "A dirige la batalla delegada");
  await esperar(B, () => BT && BT.espejo && BT.espejo.ok, null, 20000, "B ve el espejo (delegada)");
  await ev(A, () => battleAct("go"));
  await ev(B, () => battleAct("flee"));
  await esperar(C, (t) => ONL.meta && ONL.meta.turno > t && !ONL.resolviendo, meta(id3).turno, 60000, "C publica tras la batalla delegada");
  const vistoC2 = await ev(C, () => ({ bt: window.__vioBT, log: ONL.log.slice(-6), textos: window.__textos.join(" || ") }));
  ok(!vistoC2.bt, "quien resuelve sin participar no abre la batalla en su pantalla");
  ok(vistoC2.log.some((l) => /^delegar/.test(l)) && (await ev(A, () => ONL.log.some((l) => /^delegado/.test(l)))), "la batalla se delega en un participante");
  ok(!/Victoria|Derrota|Batalla en/i.test(vistoC2.textos), "C tampoco ve el informe de la batalla delegada");
  await ev(C, () => clearInterval(window.__vigia));
  for (const c of [A, B]) await ev(c, () => (ONL.noCerrar = false));
  void recC0;

  console.log("Tamaño del estado y dificultad de la IA");
  const AN = RAPIDA ? 20 : 50;
  const tam = await ev(
    C,
    async (AN) => {
      const t0 = Date.now();
      leaveNet();
      checkEnd = function () {};
      newGame(0, cands(0)[0], { modo: "leyendas", activas: [0, 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] });
      drawBase();
      OC.emitirSync("partidaLista");
      G.human = [];
      document.getElementById("start").classList.remove("show");
      for (let y = 0; y < AN; y++) await yearEnd();
      const pk = onlEmpaquetar(G),
        ida = onlLZd(pk.z) === pk.txt,
        ops = onlDiff(JSON.parse(pk.txt), JSON.parse(pk.txt)).length;
      const o = {};
      for (const k in G) o[k] = JSON.stringify(G[k]).length;
      const grandes = Object.entries(o)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, v]) => `${k} ${Math.round(v / 1024)} KB`)
        .join(", ");
      return { anios: AN, tam: pk.tam, z: pk.tamZ, partes: pk.partes.length, max: Math.max(...pk.partes.map((p) => p.length)), ida, ops, C: G.C.length, vivos: G.C.filter((c) => c.alive).length, grandes, ms: Date.now() - t0 };
    },
    AN,
  );
  console.log(`  ${tam.anios} años, 12 pueblos: estado ${Math.round(tam.tam / 1024)} KB → ${Math.round(tam.z / 1024)} KB comprimido en ${tam.partes} trozo(s); personajes ${tam.C} (${tam.vivos} vivos); mayores: ${tam.grandes}`);
  ok(tam.ida, "la compresión LZ es reversible (estado idéntico)");
  ok(tam.max < 200000, "cada trozo cabe en un documento (< 256 KiB)");
  ok(tam.ops === 0, "sin cambios, la diferencia está vacía");
  const dif = await ev(C, () => {
    /* el defensor se refuerza hasta que la batalla esté igualada (25-75 %) con la IA normal */
    const ej = (f, i) => ({ f, u: { ...cmbVacio(), i, a: 5, c: 3 }, gen: null, vet: {}, ori: {} }),
      ctx = { terreno: "llanura", fort: 0 },
      tasa = (i, dif, N) => {
        let w = 0;
        for (let k = 0; k < N; k++) if (cmbResolverAuto(ej(0, 10), ej(1, i), dif ? { ...ctx, dificultad: ["normal", "dificil"] } : ctx).gana === 1) w++;
        return w / N;
      };
    let i = 10;
    while (i < 40 && tasa(i, false, 80) < 0.3) i += 2;
    return { i, n: tasa(i, false, 400), d: tasa(i, true, 400) };
  });
  console.log(`  batalla igualada (defensor con ${dif.i} levas de infantería): gana con IA normal ${Math.round(dif.n * 100)} %, con IA difícil ${Math.round(dif.d * 100)} %`);
  ok(dif.d > dif.n + 0.04, "la IA difícil gana claramente más que la normal (automática)");
  const tac = await ev(C, () => {
    /* órdenes tácticas de la IA difícil: retira rotas y flanquea con caballería */
    const p = cmbTactica({ f: 0, u: { ...cmbVacio(), i: 10, c: 4 }, gen: null }, { f: 2, u: { ...cmbVacio(), i: 10, c: 4 }, gen: null }, { terreno: "llanura", fort: 0, dificultad: ["normal", "dificil"] }, "t1");
    battleAct("go");
    const ene = BT.units.filter((u) => !u.side);
    ene.forEach((u, i) => {
      u.x = 18 + (i % 3);
      u.y = 8 + i;
      u.eng = 1;
    });
    const mia = BT.units.find((u) => u.side === 1 && UN[u.t].rol === "i");
    mia.mor = mia.morMax * 0.2;
    aiOrders(1);
    const cab = BT.units.filter((u) => u.side === 1 && cmbCab(u.t) && !(u.gen && u.n <= SPU));
    const r = { retira: !!mia.plan[0].o && mia.plan[0].o.tg == null && mia.plan[0].o.x > mia.x, flanco: cab.some((u) => u.plan[0].o && u.plan[0].o.tg == null) };
    finishBattle(false, true);
    return r;
  });
  await C.page.waitForTimeout(300);
  ok(tac.retira, "IA difícil táctica: retira la unidad rota tras la línea");
  ok(tac.flanco, "IA difícil táctica: la caballería busca el flanco del enemigo trabado");

  /* repetición de la estación: viaja en el estado si es pequeña, en documento aparte si pesa */
  const rp = await ev(C, () => {
    const paso = (i) => ({ k: "mov", ej: i % 40, f: i % 7, de: [i % 60, i % 37], a: [(i + 1) % 60, (i + 2) % 37] });
    G.cam.rep = { v: 1, anio: G.year, est: G.estacion, own0: G.P.map((p) => p.owner), ej0: [], pasos: [...Array(80).keys()].map(paso) };
    const chica = onlRepSacar(G, 1) === null && !!G.cam.rep;
    G.cam.rep = { v: 1, anio: G.year, est: G.estacion, own0: G.P.map((p) => p.owner), ej0: [], pasos: [...Array(3000).keys()].map(paso) };
    const tam = JSON.stringify(G.cam.rep).length,
      r = onlRepSacar(G, 2),
      vuelta = r && JSON.parse(onlLZd(r.z));
    let vista = 0;
    window.ifzRepetir = async (x) => (vista = x.pasos.length);
    G.cam.rep = vuelta;
    return { chica, tam, z: r && r.z.length, fuera: !G.cam.rep || true, ext: onlS().rep && onlS().rep.ext, n: vuelta && vuelta.pasos.length, diff: onlDiff({ cam: { rep: null } }, { cam: { rep: vuelta } }).length, vista: (onlRepetir(), vista) };
  });
  console.log(`  repetición de 3000 pasos: ${Math.round(rp.tam / 1024)} KB → ${Math.round(rp.z / 1024)} KB en su propio documento`);
  ok(rp.chica, "una repetición pequeña viaja dentro del estado");
  ok(rp.ext && rp.n === 3000, "una repetición grande va en su documento y se recupera entera");
  ok(rp.diff === 0, "la repetición no viaja en los envíos de los jugadores");
  ok(rp.vista === 3000, "al recibir la estación se llama a ifzRepetir(rep)");

  await A.page.screenshot({ path: path.join(capt, "online-partida.png") });
  console.log(`Mensajes de room: ${hub.emits || 0} · documentos en la db: ${hub.docs.size} · ${Math.round((Date.now() - t0) / 1000)} s`);
  console.log("\n" + (errores.length ? "ERRORES:\n" + errores.join("\n") : "OK sin errores"));
  await browser.close();
  process.exit(errores.length ? 1 : 0);
})().catch(async (e) => {
  console.error(e);
  try {
    await browser.close();
  } catch (_) {}
  process.exit(1);
});
