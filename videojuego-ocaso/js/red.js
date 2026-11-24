/* ---------- RED: online sin Claude, con el servidor propio del VPS ----------
   Define window.claude.use('db'|'user'|'room') —la misma API de artefactos de Claude que usa js/online.js—
   hablando por WebSocket con el servidor de Ocaso (servidor Node del VPS; su lógica sale del doble de
   pruebas/online.js). Así el online funciona en la web, en GitHub Pages y en las apps (APK / iPhone).
   Si la página ya trae un `claude` real (publicada como artefacto de Claude), no hace nada.
   Servidor: RED_PUBLICO, salvo que la página la sirva el propio servidor (mismo origen) o que se indique
   otro con localStorage «ocaso.servidor» (p. ej. "http://127.0.0.1:8091") o window.OCASO_SERVIDOR.
   Identidad: nombre + uid + token guardados en este dispositivo (localStorage «ocaso.red.v1»).
   Además: «Invitar amigos» (enlace ?amigo=uid o pegarlo en la app), «Conectados ahora» y la chapa con el
   nombre (abajo a la izquierda). Globales: ninguna salvo window.claude. */
(function () {
  if (typeof window.claude !== "undefined" && window.claude && window.claude.use) return;
  const RED_PUBLICO = "https://ocaso.srv1727399.hstgr.cloud";
  const RED_BASE = (() => {
    try {
      const o = localStorage.getItem("ocaso.servidor") || window.OCASO_SERVIDOR;
      if (o) return String(o).replace(/\/+$/, "");
    } catch (e) {}
    const pub = new URL(RED_PUBLICO);
    // la sirve el propio servidor (dominio público, o el puerto 8080 del VPS): mismo origen
    if (/^https?:$/.test(location.protocol) && (location.host === pub.host || location.port === "8080")) return location.origin;
    return RED_PUBLICO;
  })();
  const CLAVE = "ocaso.red.v1";
  const azar = (n) => {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return [...a].map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  };
  const pInvTemprano = /[?&]amigo=/.test(location.search);
  let ident = null;
  try {
    ident = JSON.parse(localStorage.getItem(CLAVE) || "null");
  } catch (e) {}

  /* ---------- pedir nombre ---------- */
  function pedirNombre(titulo, def, conAhoraNo) {
    return new Promise((res) => {
      const mostrar = () => {
        const fondo = document.createElement("div");
        fondo.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:'Pixelify Sans',sans-serif";
        fondo.innerHTML =
          '<form style="background:#1d1810;border:2px solid #b08d3c;color:#f0e2c0;padding:22px 24px;max-width:340px;width:90%;border-radius:6px;box-shadow:0 8px 30px #000">' +
          '<div style="font-size:18px;margin-bottom:10px"></div>' +
          '<div style="font-size:13px;opacity:.8;margin-bottom:12px">Es el nombre con el que te verán tus amigos en el modo online. Queda guardado en este dispositivo.</div>' +
          '<input maxlength="24" required style="width:100%;box-sizing:border-box;padding:8px;font-size:16px;background:#0e0b07;color:#f0e2c0;border:1px solid #b08d3c;border-radius:4px">' +
          '<button style="margin-top:12px;width:100%;padding:9px;font-size:15px;background:#b08d3c;color:#1d1810;border:0;border-radius:4px;cursor:pointer">Entrar</button>' +
          (conAhoraNo ? '<button type="button" data-ahorano style="margin-top:8px;width:100%;padding:6px;font-size:13px;background:none;color:#f0e2c0;border:1px solid #5a4a2a;border-radius:4px;cursor:pointer;opacity:.8">Ahora no (jugar sin conexión)</button>' : "") +
          "</form>";
        fondo.querySelector("div").textContent = titulo;
        const inp = fondo.querySelector("input");
        inp.value = def || "";
        const ah = fondo.querySelector("[data-ahorano]");
        if (ah)
          ah.onclick = () => {
            fondo.remove();
            res(null);
          };
        fondo.querySelector("form").onsubmit = (e) => {
          e.preventDefault();
          const n = inp.value.trim();
          if (!n) return;
          fondo.remove();
          res(n);
        };
        document.body.appendChild(fondo);
        setTimeout(() => inp.focus(), 50);
      };
      if (document.body) mostrar();
      else document.addEventListener("DOMContentLoaded", mostrar);
    });
  }

  /* ---------- conexión ---------- */
  let ws = null,
    listo = false,
    miPeer = null,
    nId = 0,
    espera = 600;
  const pend = new Map(), // id -> {res, rej, m}
    cola = [], // mensajes a enviar cuando haya conexión
    subsVivas = new Map(), // sid -> {op, a}
    salasVivas = new Map(), // nombre -> presencia acumulada
    fCon = [];
  let resolverIdent;
  const identLista = new Promise((r) => (resolverIdent = r));
  const avisarCon = (v) => fCon.forEach((f) => f(v));

  function mandar(m) {
    if (listo && ws && ws.readyState === 1) ws.send(JSON.stringify(m));
    else cola.push(m);
  }
  function llama(op, a) {
    return new Promise((res, rej) => {
      const id = ++nId;
      pend.set(id, { res, rej, m: { id, op, a } });
      mandar({ id, op, a });
    });
  }
  function conectar() {
    const url = RED_BASE.replace(/^http/, "ws") + "/__red/ws";
    ws = new WebSocket(url);
    ws.onopen = () => {
      const id = ++nId;
      pend.set(id, {
        res: (r) => {
          miPeer = r.peer;
          espera = 600;
          if (r.perfil && ident.name !== r.perfil.name) {
            ident.name = r.perfil.name;
            localStorage.setItem(CLAVE, JSON.stringify(ident));
          }
          // reponer salas, presencias y suscripciones tras (re)conectar
          // (lo que aún está pendiente de respuesta se reenvía abajo con su propio id: no se duplica)
          const enVuelo = [...pend.values()].map((p) => p.m).filter(Boolean);
          const pendientes = [...enVuelo, ...cola];
          const subPend = new Set(pendientes.filter((m) => m.op === "subDoc" || m.op === "subQ").map((m) => m.a.sid));
          const joinPend = new Set(pendientes.filter((m) => m.op === "join").map((m) => m.a.nombre));
          const pre = [];
          for (const [nombre, p] of salasVivas) {
            if (!joinPend.has(nombre)) pre.push({ op: "join", a: { nombre } });
            if (Object.keys(p).length) pre.push({ op: "presence", a: { nombre, p } });
          }
          for (const [sid, s] of subsVivas) if (!subPend.has(sid)) pre.push({ op: s.op, a: s.a });
          listo = true;
          for (const m of pre) ws.send(JSON.stringify(m));
          const vistos = new Set();
          for (const m of [...enVuelo, ...cola.splice(0)]) {
            if (vistos.has(m.id)) continue;
            vistos.add(m.id);
            ws.send(JSON.stringify(m));
          }
          resolverIdent();
          avisarCon(true);
          pintarChapa();
        },
        rej: (e) => {
          console.error("[red] identidad rechazada", e);
          if (e && e.code === "nombre_ocupado") {
            // nombre repetido al registrarse: pedir otro y reintentar
            pedirNombre(`«${ident.name}» ya lo usa otro jugador. Elige otro nombre:`, ident.name + " 2").then((n) => {
              ident.name = n;
              localStorage.setItem(CLAVE, JSON.stringify(ident));
              try {
                ws.close();
              } catch (_) {}
            });
            return;
          }
          if (e && e.code === "permission_denied") {
            localStorage.removeItem(CLAVE);
            alert("Tu identidad guardada no es válida en este servidor. Elige un nombre de nuevo.");
            location.reload();
          }
        },
      });
      ws.send(JSON.stringify({ id, op: "hola", a: ident }));
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id != null) {
        const p = pend.get(m.id);
        if (!p) return;
        pend.delete(m.id);
        if (m.r && m.r.err) p.rej({ code: m.r.err, message: m.r.msg || m.r.err });
        else p.res(m.r);
        return;
      }
      if (m.ev) recibir(m.ev, m.a);
    };
    ws.onclose = () => {
      const era = listo;
      listo = false;
      if (era) avisarCon(false);
      pintarChapa();
      setTimeout(conectar, espera);
      espera = Math.min(espera * 2, 10000);
    };
  }

  let iniciado = false;
  async function iniciar(forzar) {
    if (iniciado) return;
    if (!ident || !ident.uid || !ident.token || !ident.name) {
      // «Ahora no» deja jugar sin conexión; la chapa «Entrar online» lo vuelve a pedir
      if (!forzar && !pInvTemprano && localStorage.getItem(CLAVE + ".ahorano")) return pintarChapa();
      const name = await pedirNombre(pInvTemprano ? "Te han invitado a Ocaso del Imperio. ¿Cómo te llamas?" : "¿Cómo te llamas, señor? (para jugar online)", "", !pInvTemprano);
      if (!name) {
        localStorage.setItem(CLAVE + ".ahorano", "1");
        return pintarChapa();
      }
      localStorage.removeItem(CLAVE + ".ahorano");
      ident = { uid: "u_" + azar(16), token: azar(32), name };
      localStorage.setItem(CLAVE, JSON.stringify(ident));
    }
    iniciado = true;
    conectar();
  }
  iniciar();

  /* ---------- db ---------- */
  const cbs = {},
    salas = {};
  let n = 0;
  const nid = () => "s" + ++n + Math.random().toString(36).slice(2, 6);
  const seg = (p) => String(p).split("/");
  const chk = (p, par) => {
    const s = seg(p);
    if (s.some((x) => !/^[A-Za-z0-9_\-.~:@+]+$/.test(x) || x === "." || x === "..")) throw new TypeError("segmento inválido en " + p);
    if ((s.length % 2 === 0) !== par) throw new TypeError("paridad de ruta (" + s.length + "): " + p);
  };
  const copia = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const snap = (d) => {
    const dd = d.data;
    return { id: d.id, exists: !!d.exists, data: () => (d.exists ? copia(dd) : undefined), metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const qsnap = (l, ch) => {
    const docs = l.map(snap);
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => (ch || []).map((c) => ({ type: c.type, doc: snap(c.doc), oldIndex: -1, newIndex: -1 })), metadata: { fromCache: false, hasPendingWrites: false } };
  };
  function suscribir(op, a, cb, err) {
    const sid = nid();
    a.sid = sid;
    cbs[sid] = cb;
    subsVivas.set(sid, { op, a });
    llama(op, a).catch((e) => err && err(e));
    return () => {
      delete cbs[sid];
      subsVivas.delete(sid);
      llama("unsub", { sid }).catch(() => {});
    };
  }
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
    return suscribir("subDoc", { path: this.path }, (d) => next(snap(d)), err);
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
    return suscribir("subQ", { q: this._q }, (l, ch) => next(qsnap(l, ch)), err);
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

  /* ---------- room ---------- */
  function Sala(nombre) {
    const S = { nombre, on: {}, peers: [], fp: [] };
    salas[nombre] = S;
    if (!salasVivas.has(nombre)) salasVivas.set(nombre, {});
    return {
      name: nombre,
      emit: (topic, data) => llama("emit", { nombre, topic, data }),
      on: (topic, fn) => {
        (S.on[topic] = S.on[topic] || []).push(fn);
        return () => (S.on[topic] = S.on[topic].filter((x) => x !== fn));
      },
      presence: (p) => {
        const acc = salasVivas.get(nombre) || {};
        for (const k in p) if (p[k] === null) delete acc[k];
        else acc[k] = copia(p[k]);
        salasVivas.set(nombre, acc);
        return llama("presence", { nombre, p });
      },
      peers: () => S.peers,
      onPeers: (fn) => {
        S.fp.push(fn);
        setTimeout(() => fn({ peers: S.peers, joined: S.peers, left: [], updated: [] }), 0);
        return () => (S.fp = S.fp.filter((x) => x !== fn));
      },
      connected: () => listo,
      onConnection: (fn) => {
        fCon.push(fn);
        setTimeout(() => fn(listo), 0);
        return () => fCon.splice(fCon.indexOf(fn) >>> 0, 1);
      },
      leave: () => {
        salasVivas.delete(nombre);
        return llama("leave", { nombre });
      },
    };
  }
  const lobby = Sala("");
  llama("join", { nombre: "" }).catch(() => {});
  const room = { ...lobby };
  room.join = async (nm) => {
    const api = Sala(nm);
    salas[nm].api = api;
    await llama("join", { nombre: nm });
    return api;
  };
  function recibir(ev, a) {
    const uid = ident && ident.uid;
    if (ev === "doc" || ev === "q") {
      const f = cbs[a[0]];
      if (f) f(a[1], a[2]);
    }
    if (ev === "peers") {
      const S = salas[a[0]];
      if (!S) return;
      const ant = S.peers,
        ps = Object.freeze(
          a[1].map((p) => Object.freeze({ peer: p.peer, by: p.by, isMe: p.by === uid, sameTab: p.peer === miPeer, kind: "viewer", guest: false, presence: Object.freeze(p.presence || {}), updatedAt: p.t })),
        );
      S.peers = ps;
      const ch = { peers: ps, joined: ps.filter((p) => !ant.some((q) => q.peer === p.peer)), left: ant.filter((p) => !ps.some((q) => q.peer === p.peer)), updated: ps };
      S.fp.forEach((f) => f(ch));
    }
    if (ev === "msg") {
      const S = salas[a[0]];
      if (!S) return;
      const m = a[1],
        msg = { topic: m.topic, data: m.data, peer: m.peer, by: m.by, isMe: m.by === uid, sameTab: m.peer === miPeer, kind: "viewer", guest: false };
      (S.on[m.topic] || []).slice().forEach((f) => f(msg));
    }
  }

  /* ---------- user ---------- */
  const user = {
    id: async () => (await identLista, ident.uid),
    me: async () => (await identLista, { id: ident.uid, name: ident.name, avatarUrl: "", color: "#888", email: null, isOwner: false, canEdit: true }),
    isOwner: async () => false,
    canEdit: async () => true,
    can: async () => null,
    profiles: (ids) => llama("profiles", { ids: [].concat(ids) }),
    search: (q) => llama("search", { q }),
    name: async () => (await identLista, ident.name),
  };

  window.claude = {
    use: async (nm) => {
      await identLista;
      // no responder antes de que se hayan ejecutado todos los <script> del juego
      if (document.readyState === "loading") await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
      await new Promise((r) => setTimeout(r, 0));
      return nm === "db" ? db : nm === "user" ? user : nm === "room" ? room : null;
    },
  };

  /* ---------- invitar amigos por enlace ---------- */
  let pInv = new URLSearchParams(location.search).get("amigo");
  // el enlace lleva a la web pública (desde la app, location es interna: https://localhost)
  const webInv = () => (RED_BASE === location.origin ? location.origin + location.pathname : RED_BASE + "/");
  const enlaceInv = () => webInv() + "?amigo=" + encodeURIComponent(ident.uid);
  const escH = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function cajaInvitar() {
    if (!ident || !ident.uid) return "";
    const url = enlaceInv(),
      txt = `¡Juega conmigo a Ocaso del Imperio! Entra con este enlace y seremos amigos en el juego: ${url}`;
    return `<div class="card red-inv" style="margin:10px 0;padding:10px 12px;border:1px solid #b08d3c;border-radius:6px;background:rgba(176,141,60,.08)">
      <h3 style="margin:0 0 6px">Invitar amigos</h3>
      <p class="dim" style="margin:0 0 8px">Mándales tu enlace. Al abrirlo eligen su nombre y quedáis como amigos al momento; luego invítalos en «Crear partida».</p>
      <input readonly value="${escH(url)}" style="width:100%;box-sizing:border-box;padding:6px;font-size:13px" onclick="this.select()">
      <div class="btns" style="margin-top:8px"><button class="gold" data-red="copiar">Copiar enlace</button>${navigator.share ? '<button data-red="compartir">Compartir…</button>' : ""}<a href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener"><button type="button">WhatsApp</button></a></div>
      <p class="dim red-inv-ok" style="margin:6px 0 0;min-height:1em"></p>
      <p style="margin:8px 0 0"><label class="dim" for="red-pega">¿Te pasaron un enlace de invitación? Pégalo aquí:</label></p>
      <div style="display:flex;gap:6px"><input id="red-pega" placeholder="…?amigo=u_…" autocomplete="off" style="flex:1;min-width:0;padding:6px;font-size:13px"><button data-red="pegar">Aceptar</button></div></div>`;
  }
  document.addEventListener(
    "click",
    async (e) => {
      const b = e.target.closest && e.target.closest("[data-red]");
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      const caja = b.closest(".red-inv"),
        msg = caja && caja.querySelector(".red-inv-ok"),
        url = enlaceInv();
      if (b.dataset.red === "copiar") {
        try {
          await navigator.clipboard.writeText(url);
        } catch (_) {
          const i = caja.querySelector("input");
          i.select();
          document.execCommand("copy");
        }
        if (msg) msg.textContent = "Enlace copiado.";
      }
      if (b.dataset.red === "pegar") {
        const v = ((caja && caja.querySelector("#red-pega")) || {}).value || "",
          m = v.match(/u_[a-z0-9]{8,32}/);
        if (!m) {
          if (msg) msg.textContent = "Ese enlace no parece una invitación.";
          return;
        }
        pInv = m[0];
        await aceptarInvitacion();
        if (typeof onlRefrescarLobby === "function") onlRefrescarLobby();
      }
      if (b.dataset.red === "compartir") navigator.share({ title: "Ocaso del Imperio", text: "¡Juega conmigo a Ocaso del Imperio!", url }).catch(() => {});
    },
    true,
  );
  function aviso(t) {
    const d = document.createElement("div");
    d.textContent = t;
    d.style.cssText = "position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99998;background:#1d1810;color:#f0e2c0;border:1px solid #b08d3c;border-radius:6px;padding:10px 16px;font:15px 'Pixelify Sans',sans-serif;box-shadow:0 6px 20px #000";
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 6000);
  }
  async function aceptarInvitacion() {
    if (!pInv || !/^u_[a-z0-9]{8,32}$/.test(pInv)) return;
    if (/[?&]amigo=/.test(location.search)) history.replaceState(null, "", location.pathname);
    if (pInv === ident.uid) return aviso("Ese es tu propio enlace: mándaselo a tus amigos.");
    try {
      const perf = (await llama("profiles", { ids: [pInv] }))[pInv];
      if (!perf || !perf.name) return aviso("El enlace de invitación no es válido.");
      // mismo id de amistad que el juego (onlParId en js/online.js)
      const parId = typeof onlParId === "function" ? onlParId(ident.uid, pInv) : [ident.uid, pInv].sort().join("~");
      const ref = db.doc("amistades/" + parId);
      const ya = await ref.get();
      if (ya.exists && ya.data().estado === "aceptada") return aviso(`Ya eres amigo de ${perf.name}.`);
      await ref.set({ par: [ident.uid, pInv].sort(), de: pInv, para: ident.uid, estado: "aceptada", ts: Date.now() });
      await db.doc(`avisos/${pInv}/items/ami-${ident.uid}`).set({ ts: Date.now(), de: ident.uid, tipo: "amistad-ok", texto: "Ha entrado con tu enlace de invitación: ya sois amigos." });
      aviso(`¡Ahora eres amigo de ${perf.name}! Ya puede invitarte a sus partidas.`);
    } catch (e) {
      console.error("[red] invitación", e);
    }
  }
  /* ---------- nombres siempre cargados y lista de conectados ---------- */
  const colores = {}; // uid -> color del perfil
  let faltan = new Set(),
    tNombres = null;
  function repintar() {
    try {
      if (typeof ST !== "undefined" && ST.view === "lobby" && typeof onlRefrescarLobby === "function") onlRefrescarLobby();
      if (typeof G !== "undefined" && G && typeof ui === "function") ui();
    } catch (e) {}
    pintarConectados();
  }
  function refrescarNombres(ids) {
    for (const id of ids) if (typeof id === "string" && /^u_/.test(id)) faltan.add(id);
    if (tNombres || !faltan.size) return;
    tNombres = setTimeout(async () => {
      const l = [...faltan];
      faltan = new Set();
      tNombres = null;
      try {
        const ps = await llama("profiles", { ids: l });
        const N = typeof net !== "undefined" ? net.names : {};
        let cambio = false;
        for (const id in ps) {
          const nm = (ps[id] && ps[id].name) || "";
          colores[id] = (ps[id] && ps[id].color) || "#888";
          if (N[id] !== nm) {
            N[id] = nm;
            cambio = true;
          }
        }
        if (cambio) repintar();
        else pintarConectados();
        pintarChapa();
      } catch (e) {}
    }, 120);
  }
  function conectados() {
    const S = salas[""],
      vistos = new Map();
    for (const p of (S && S.peers) || []) {
      const u = p.by || (p.presence && p.presence.u);
      if (!u) continue;
      const x = vistos.get(u) || { u, partida: false };
      if (p.presence && p.presence.p) x.partida = true;
      vistos.set(u, x);
    }
    return [...vistos.values()];
  }
  function cajaConectados() {
    const l = conectados(),
      N = typeof net !== "undefined" ? net.names : {},
      A = typeof ONL !== "undefined" ? ONL.amigos : {};
    const sinNombre = l.filter((x) => !N[x.u] || !colores[x.u]).map((x) => x.u);
    if (sinNombre.length) refrescarNombres(sinNombre);
    l.sort((a, b) => (a.u === ident.uid ? -1 : b.u === ident.uid ? 1 : String(N[a.u] || "").localeCompare(String(N[b.u] || ""))));
    const fila = (x) => {
      const yo = x.u === ident.uid,
        a = A[x.u],
        est = yo ? "" : a && a.estado === "aceptada" ? '<span class="dim">amigo</span>' : a ? '<span class="dim">solicitud pendiente</span>' : `<button class="onl-mini" data-act="s-onlami-${escH(x.u)}">+ amigo</button>`;
      return `<div class="row" style="display:flex;align-items:center;gap:8px;padding:3px 0">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${escH(colores[x.u] || "#888")};box-shadow:0 0 0 2px rgba(0,0,0,.5)"></span>
        <b style="color:${escH(colores[x.u] || "inherit")}">${escH(N[x.u] || "…")}</b>${yo ? ' <span class="dim">(tú)</span>' : ""}
        <span class="dim" style="font-size:12px">${x.partida ? "· en partida" : "· en el menú"}</span>
        <span style="margin-left:auto">${est}</span></div>`;
    };
    return `<div class="card" style="margin:10px 0;padding:10px 12px;border:1px solid #b08d3c;border-radius:6px;background:rgba(176,141,60,.05)">
      <h3 style="margin:0 0 6px">Conectados ahora (${l.length})</h3>${l.length ? l.map(fila).join("") : '<p class="dim">Nadie más conectado.</p>'}</div>`;
  }
  function pintarConectados() {
    const el = document.querySelector(".red-con");
    if (el) el.innerHTML = cajaConectados();
  }

  window.addEventListener("DOMContentLoaded", () => {
    // si el juego pide un nombre que no tiene, se busca solo (nunca «un jugador»)
    if (typeof net !== "undefined" && net.names) {
      const base = net.names;
      net.names = new Proxy(base, {
        get(o, k) {
          if (typeof k === "string" && /^u_/.test(k) && !(k in o)) refrescarNombres([k]);
          return o[k];
        },
      });
    }
    // al cambiar quién está conectado: cargar nombres nuevos (o cambiados) y repintar la lista
    const S = salas[""];
    if (S)
      S.fp.push(() => {
        refrescarNombres(conectados().map((x) => x.u));
        pintarConectados();
      });
    if (typeof onlRefrescarLobby === "function") {
      const ref = onlRefrescarLobby;
      onlRefrescarLobby = function () {
        const r = ref.apply(this, arguments);
        pintarConectados();
        return r;
      };
    }
    // «Invitar amigos» en el menú online, encima de las pestañas de contenido
    if (typeof onlVistaLobby === "function") {
      const vista = onlVistaLobby;
      onlVistaLobby = function () {
        return vista.apply(this, arguments).replace('<div id="onl-lob">', cajaInvitar() + `<div class="red-con">${cajaConectados()}</div>` + '<div id="onl-lob">');
      };
    }
    identLista.then(() => setTimeout(aceptarInvitacion, 300));
  });

  /* ---------- chapa con el nombre (tocar para cambiarlo) ---------- */
  let chapa = null;
  function pintarChapa() {
    if (!document.body) return document.addEventListener("DOMContentLoaded", pintarChapa, { once: true });
    if (!ident) {
      // sin identidad («Ahora no»): la chapa invita a entrar online
      if (!chapa) {
        chapa = document.createElement("button");
        chapa.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:9999;font:12px 'Pixelify Sans',sans-serif;background:rgba(20,16,10,.85);color:#f0e2c0;border:1px solid #b08d3c;border-radius:4px;padding:3px 7px;cursor:pointer;opacity:.85";
        chapa.textContent = "○ Entrar online";
        chapa.onclick = () => {
          chapa.remove();
          chapa = null;
          iniciar(true);
        };
        document.body.appendChild(chapa);
      }
      return;
    }
    if (chapa && !chapa.title) {
      chapa.remove();
      chapa = null;
    }
    if (!chapa) {
      chapa = document.createElement("button");
      chapa.title = "Tu nombre online (toca para cambiarlo)";
      chapa.style.cssText = "position:fixed;left:6px;bottom:6px;z-index:9999;font:12px 'Pixelify Sans',sans-serif;background:rgba(20,16,10,.85);color:#f0e2c0;border:1px solid #b08d3c;border-radius:4px;padding:3px 7px;cursor:pointer;opacity:.85";
      chapa.onclick = async () => {
        const n = await pedirNombre("Cambiar tu nombre", ident.name);
        try {
          const p = await llama("renombrar", { name: n });
          ident.name = p.name;
          localStorage.setItem(CLAVE, JSON.stringify(ident));
          pintarChapa();
          refrescarNombres([ident.uid]);
        } catch (e) {
          alert(e && e.code === "nombre_ocupado" ? "Ese nombre ya lo usa otro jugador." : "No se pudo cambiar el nombre.");
        }
      };
      document.body.appendChild(chapa);
    }
    chapa.textContent = (listo ? "● " : "○ ") + ident.name;
    chapa.style.color = listo ? colores[ident.uid] || "#f0e2c0" : "#c98";
    if (listo && !colores[ident.uid]) refrescarNombres([ident.uid]);
  }
})();
