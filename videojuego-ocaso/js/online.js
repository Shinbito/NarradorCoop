/* ---------- ONLINE: partidas largas entre amigos y desconocidos ----------
   Sistema Online (ver docs/online.md). Funciona cuando el juego se abre publicado como artefacto de
   Claude: claude.use('db') (partidas, órdenes, amigos, avisos), claude.use('user') (quién eres) y
   claude.use('room') (quién tiene la página abierta AHORA, invitaciones y batallas en vivo).
   Modelo: cada ESTACIÓN es una ronda de órdenes simultáneas. Cada jugador juega en su pantalla sobre una
   copia del estado (reclutar, construir, diplomacia...) y da órdenes de campaña (marchas, asedios,
   asaltos, salidas) que NO se ejecutan al momento: se encolan. Al pulsar «Listo» envía a la db solo la
   diferencia con el estado de partida (ops) + sus ejércitos + sus órdenes. Cuando todos están listos o
   vence el plazo, UN cliente (el anfitrión o el que cierra la ronda, con un cerrojo de la db) fusiona los
   envíos, juega por la IA a los ausentes, resuelve la estación con camResolverSimultaneo (las marchas de
   todos a la vez) y publica el estado nuevo comprimido y troceado.
   Globales con prefijo onl / ONL. */

/* ---------- A. constantes y utilidades ---------- */
const ONL_V = 2;
const ONL_CFG_DEF = {
  modoTurno: "corr", // 'corr' por correspondencia | 'tr' simultáneo en tiempo real (si todos están conectados)
  plazoH: 24, // horas para dar las órdenes de una estación (correspondencia)
  trSeg: 90, // segundos por estación en tiempo real
  invitSeg: 90, // segundos para aceptar una batalla en vivo si el rival está conectado
  amigoMin: 120, // minutos que se espera a un amigo desconectado para que acuda a su batalla (0 = no se espera)
  modoBatalla: "t3", // batallas en vivo: 't3' | 't1' | 'rt'
  faltasMax: 3, // estaciones seguidas sin órdenes antes de pasar el pueblo a la IA
};
const ONL_PLAZOS = [1, 6, 12, 24, 48, 72];
const ONL_COLA = ["mover", "asediar", "asaltar", "salida"]; // órdenes de campaña que se resuelven a la vez
const ONL_PARTE = 190000; // caracteres por trozo de estado (< 256 KiB por documento)
const ONL_ROOM_MAX = 3600; // bytes por mensaje de room (límite 4 KiB)
const ONL = {
  desfase: 0, // pruebas: desplaza el reloj
  room: null,
  peers: [], // presencia del vestíbulo
  meta: null, // documento de la partida en curso
  ver: 0,
  baseTxt: null, // estado de partida de la estación (texto publicado)
  base: null, // el mismo, ya cargado (para calcular la diferencia)
  cola: [], // órdenes de campaña encoladas este turno
  enviado: -1, // turno del último envío propio
  resolviendo: null,
  susp: null,
  amigos: {}, // uid -> {estado, de}
  avisos: [],
  mias: [], // partidas propias (jug contiene mi uid)
  invitadas: [],
  publicas: [],
  unsubs: [],
  unMeta: null,
  timer: null,
  tab: "mis",
  cfg: { ...ONL_CFG_DEF },
  batalla: null, // batalla en vivo en curso (autoridad o espejo)
  inv: null, // invitación pendiente que se muestra
  resp: {}, // respuestas a invitaciones: bid -> {ok, uid}
  hola: {}, // espejos conectados: bid -> {uid: peer}
  partes: {}, // mensajes troceados en recepción
  notif: false,
  vistoResumen: {},
  log: [], // trazas para pruebas
  yo: "anon:" + Math.random().toString(36).slice(2, 8),
};
const onlAhora = () => Date.now() + ONL.desfase;
const onlClon = (o) => JSON.parse(JSON.stringify(o));
function onlHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(36);
}
function onlTraza(...a) {
  ONL.log.push(a.join(" "));
  if (ONL.log.length > 200) ONL.log.shift();
}
function onlFmtResto(ms) {
  if (ms <= 0) return "vencido";
  const s = Math.ceil(ms / 1000);
  if (s < 120) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 120) return `${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} días`;
}
function onlFmtHora(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("es", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}
const onlNombre = (uid) => (uid && net.names[uid]) || (uid === net.uid ? "tú" : "un jugador");
const onlEstTxt = (anio, est) => `${(typeof CAM_EST !== "undefined" ? CAM_EST[est || 0] : "Año").toLowerCase()} de ${anio}`;

/* ---------- B. compresión LZ (texto seguro de 6 bits por carácter) ----------
   LZW de diccionario creciente al estilo de lz-string: los datos de la partida (JSON) quedan en ~1/5.
   Salida con el alfabeto A-Z a-z 0-9 + - (64 símbolos): cabe en un documento JSON sin escapes. */
const ONL_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
const ONL_B64I = (() => {
  const m = {};
  for (let i = 0; i < 64; i++) m[ONL_B64[i]] = i;
  return m;
})();
function onlLZc(txt) {
  if (txt == null || txt === "") return "";
  const dic = new Map(),
    nuevo = new Set(),
    out = [];
  let w = "",
    agr = 2,
    tam = 3,
    nb = 2,
    val = 0,
    pos = 0;
  const bit = (b) => {
    val = (val << 1) | b;
    if (pos === 5) {
      pos = 0;
      out.push(ONL_B64[val]);
      val = 0;
    } else pos++;
  };
  const bits = (v, n) => {
    for (let i = 0; i < n; i++) {
      bit(v & 1);
      v >>= 1;
    }
  };
  const emite = () => {
    if (nuevo.has(w)) {
      const cc = w.charCodeAt(0);
      if (cc < 256) {
        bits(0, nb);
        bits(cc, 8);
      } else {
        bits(1, nb);
        bits(cc, 16);
      }
      if (--agr === 0) {
        agr = 1 << nb;
        nb++;
      }
      nuevo.delete(w);
    } else bits(dic.get(w), nb);
    if (--agr === 0) {
      agr = 1 << nb;
      nb++;
    }
  };
  for (let i = 0; i < txt.length; i++) {
    const c = txt.charAt(i);
    if (!dic.has(c)) {
      dic.set(c, tam++);
      nuevo.add(c);
    }
    const wc = w + c;
    if (dic.has(wc)) w = wc;
    else {
      emite();
      dic.set(wc, tam++);
      w = c;
    }
  }
  if (w !== "") emite();
  bits(2, nb);
  for (;;) {
    val <<= 1;
    if (pos === 5) {
      out.push(ONL_B64[val]);
      break;
    }
    pos++;
  }
  return out.join("");
}
function onlLZd(z) {
  if (!z) return "";
  const n = z.length,
    dic = [0, 1, 2],
    res = [];
  let idx = 0,
    val = ONL_B64I[z[0]],
    pos = 32;
  const lee = (k) => {
    let b = 0,
      p = 1;
    for (let i = 0; i < k; i++) {
      const r = val & pos;
      pos >>= 1;
      if (pos === 0) {
        pos = 32;
        idx++;
        val = idx < n ? ONL_B64I[z[idx]] : 0;
      }
      if (r) b |= p;
      p <<= 1;
    }
    return b;
  };
  let agr = 4,
    tam = 4,
    nb = 3,
    c,
    w;
  const k0 = lee(2);
  if (k0 === 2) return "";
  c = String.fromCharCode(lee(k0 === 0 ? 8 : 16));
  dic[3] = c;
  w = c;
  res.push(c);
  for (;;) {
    if (idx > n) return null;
    let k = lee(nb);
    if (k === 2) return res.join("");
    if (k < 2) {
      dic[tam++] = String.fromCharCode(lee(k === 0 ? 8 : 16));
      k = tam - 1;
      if (--agr === 0) {
        agr = 1 << nb;
        nb++;
      }
    }
    let e;
    if (dic[k] !== undefined && k < tam) e = dic[k];
    else if (k === tam) e = w + w.charAt(0);
    else return null;
    res.push(e);
    dic[tam++] = w + e.charAt(0);
    if (--agr === 0) {
      agr = 1 << nb;
      nb++;
    }
    w = e;
  }
}

/* ---------- C. estado en la db: comprimido y troceado ----------
   partidas/<id>                         metadatos pequeños (lista, turno, asientos, plazos)
   partidas/<id>/estado/v<ver>-<k>       trozos {z, ver, k, n} del estado G comprimido (máx. ONL_PARTE)
   partidas/<id>/ordenes/<f>             el envío de cada pueblo para el turno en curso
   partidas/<id>/batallas/<bid>          batallas entre jugadores (pendientes, resultado)
   partidas/<id>/ctl/res                 cerrojo (acquire) de quien resuelve la estación */
function onlEmpaquetar(g) {
  const txt = JSON.stringify(g),
    z = onlLZc(txt),
    partes = [];
  for (let i = 0; i < z.length; i += ONL_PARTE) partes.push(z.slice(i, i + ONL_PARTE));
  if (!partes.length) partes.push("");
  return { txt, z, partes, tam: txt.length, tamZ: z.length };
}
async function onlGuardarEstado(id, ver, pk) {
  const col = net.db.collection("partidas/" + id + "/estado");
  for (let k = 0; k < pk.partes.length; k++)
    await col.doc(`v${ver}-${k}`).set({ z: pk.partes[k], ver, k, n: pk.partes.length });
}
async function onlCargarEstado(id, meta) {
  const n = meta.partes || 1,
    col = net.db.collection("partidas/" + id + "/estado"),
    ps = [];
  for (let k = 0; k < n; k++) ps.push(col.doc(`v${meta.ver}-${k}`).get());
  const ds = await Promise.all(ps);
  if (ds.some((d) => !d.exists)) throw new Error("estado incompleto");
  const txt = onlLZd(ds.map((d) => d.data().z).join(""));
  if (!txt) throw new Error("estado ilegible");
  return txt;
}
async function onlBorrarEstado(id, ver, n) {
  const col = net.db.collection("partidas/" + id + "/estado");
  for (let k = 0; k < (n || 1); k++)
    try {
      await col.doc(`v${ver}-${k}`).delete();
    } catch (e) {}
}

/* ---------- D. diferencia y fusión de los turnos simultáneos ----------
   onlDiff(base, local) → ops: [ruta, valor] (poner), [ruta] (borrar), [ruta, '$app', [elementos]] (añadir
   al final de una lista que solo creció). Excluye lo que se fusiona aparte: G.log (entradas nuevas),
   G.C nuevos (se renumeran), G.cam.ej y G.cam.sig (cada jugador aporta sus propios ejércitos), G.onl,
   G.human. Fusión: primero todas las ops de poner/borrar por orden de pueblo (si dos jugadores cambian el
   mismo número, se suman los dos cambios: oro, comida, relaciones); después las de añadir (buzones). */
const ONL_EXCL = new Set(["log", "onl", "human"]);
const ONL_REFC = new Set(["sp", "fa", "mo", "gen", "ruler", "heir", "regente"]);
function onlDiff(a, b, ruta = [], ops = []) {
  if (a === b) return ops;
  const ta = a !== null && typeof a === "object",
    tb = b !== null && typeof b === "object";
  if (!ta || !tb || Array.isArray(a) !== Array.isArray(b)) {
    if (b === undefined) ops.push([ruta]);
    else if (!(typeof a === "number" && typeof b === "number" && Number.isNaN(a) && Number.isNaN(b))) ops.push([ruta, b]);
    return ops;
  }
  if (Array.isArray(a)) {
    if (a.length === b.length) {
      for (let i = 0; i < a.length; i++) onlDiff(a[i], b[i], ruta.concat(i), ops);
      return ops;
    }
    if (b.length > a.length && a.every((x, i) => JSON.stringify(x) === JSON.stringify(b[i]))) {
      ops.push([ruta, "$app", b.slice(a.length)]);
      return ops;
    }
    ops.push([ruta, b]);
    return ops;
  }
  for (const k of Object.keys(b)) {
    if (!ruta.length && ONL_EXCL.has(k)) continue;
    if (ruta.length === 1 && ruta[0] === "cam" && (k === "ej" || k === "sig")) continue;
    if (!ruta.length && k === "C") continue;
    if (b[k] === undefined) {
      if (k in a) ops.push([ruta.concat(k)]);
    } else if (!(k in a)) ops.push([ruta.concat(k), b[k]]);
    else onlDiff(a[k], b[k], ruta.concat(k), ops);
  }
  for (const k of Object.keys(a)) {
    if (!ruta.length && (ONL_EXCL.has(k) || k === "C")) continue;
    if (ruta.length === 1 && ruta[0] === "cam" && (k === "ej" || k === "sig")) continue;
    if (!(k in b)) ops.push([ruta.concat(k)]);
  }
  return ops;
}
/* lo que un jugador envía al pulsar «Listo» */
function onlEnvio(base, loc, f) {
  const ops = onlDiff(base, loc),
    n0 = base.C.length;
  /* personajes ya existentes: diferencia normal; nuevos: aparte */
  for (let i = 0; i < Math.min(n0, loc.C.length); i++) onlDiff(base.C[i], loc.C[i], ["C", i], ops);
  const S = loc.cam || {};
  return {
    f,
    ops,
    C: loc.C.slice(n0),
    n0,
    ejs: (S.ej || []).filter((e) => e.f === f),
    sig: S.sig || 1,
    log: (loc.log || []).filter((l) => l.t == null).slice(0, 60),
    ords: ONL.cola.slice(),
  };
}
function onlLeer(o, ruta) {
  let x = o;
  for (const k of ruta) {
    if (x == null || typeof x !== "object") return undefined;
    x = x[k];
  }
  return x;
}
function onlPoner(o, ruta, v) {
  let x = o;
  for (let i = 0; i < ruta.length - 1; i++) {
    const k = ruta[i];
    if (x[k] == null || typeof x[k] !== "object") x[k] = typeof ruta[i + 1] === "number" ? [] : {};
    x = x[k];
  }
  const k = ruta[ruta.length - 1];
  if (v === undefined) {
    if (Array.isArray(x) && typeof k === "number") x[k] = null;
    else delete x[k];
  } else x[k] = v;
}
/* renumera referencias a personajes nuevos (ids >= n0) desplazándolas off */
function onlRenumerar(v, n0, off, clave) {
  if (!off) return v;
  if (typeof v === "number") return clave != null && ONL_REFC.has(clave) && v >= n0 ? v + off : v;
  if (Array.isArray(v)) return v.map((x) => onlRenumerar(x, n0, off, clave));
  if (v && typeof v === "object") {
    const o = {};
    for (const k in v) o[k] = onlRenumerar(v[k], n0, off, k);
    return o;
  }
  return v;
}
function onlFusionar(baseTxt, envios) {
  const M = JSON.parse(baseTxt),
    B = JSON.parse(baseTxt),
    tocado = new Set(),
    apps = [];
  M.cam = M.cam || { ej: [], as: {}, saq: {}, sig: 1 };
  M.cam.ej = M.cam.ej || [];
  let sig = M.cam.sig || 1;
  const nuevosLog = [];
  for (const e of envios.slice().sort((a, b) => a.f - b.f)) {
    /* personajes nuevos: se añaden detrás y se renumeran si otro ya añadió */
    const off = M.C.length - e.n0;
    for (const c of e.C || []) M.C.push({ ...onlRenumerar(c, e.n0, off), id: c.id >= e.n0 ? c.id + off : c.id });
    for (const op of e.ops || []) {
      const ruta = op[0],
        clave = ruta[ruta.length - 1];
      if (op[1] === "$app") {
        apps.push([ruta, onlRenumerar(op[2], e.n0, off, clave)]);
        continue;
      }
      const k = JSON.stringify(ruta);
      if (op.length === 1) onlPoner(M, ruta, undefined);
      else {
        let v = onlRenumerar(op[1], e.n0, off, clave);
        if (tocado.has(k) && typeof v === "number") {
          const b0 = onlLeer(B, ruta),
            cur = onlLeer(M, ruta);
          if (typeof b0 === "number" && typeof cur === "number") v = cur + (v - b0);
        }
        onlPoner(M, ruta, v);
      }
      tocado.add(k);
    }
    /* ejércitos: los del jugador sustituyen a los suyos de la base */
    M.cam.ej = M.cam.ej
      .filter((x) => x.f !== e.f)
      .concat((e.ejs || []).map((x) => (off && x.gen != null && x.gen >= e.n0 ? { ...x, gen: x.gen + off } : x)));
    sig = Math.max(sig, e.sig || 1);
    for (const l of e.log || []) nuevosLog.push(l);
    e.off = off;
  }
  for (const [ruta, items] of apps) {
    const cur = onlLeer(M, ruta);
    if (Array.isArray(cur)) cur.push(...items);
    else onlPoner(M, ruta, items.slice());
  }
  M.cam.ej.sort((a, b) => a.id - b.id);
  M.cam.sig = Math.max(sig, ...M.cam.ej.map((x) => x.id + 1), 1);
  M.log = nuevosLog.concat(M.log || []).slice(0, 250);
  return M;
}
/* ids de ejércitos propios sin choques: cada pueblo usa su tramo durante su turno */
function onlTramoSig(g, f) {
  const S = g.cam;
  if (!S) return;
  const b = S.sig || 1;
  S.sig = b + 1000 * (f + 1);
}

/* ---------- E. red: vestíbulo (room), presencia y mensajes troceados ---------- */
const onlS = () => (G ? OC.estado("onl", () => ({ v: 1, turno: 0, cron: [] })) : null);
function onlRoomIni(room) {
  ONL.room = room;
  try {
    room.onPeers((ch) => {
      ONL.peers = ch.peers.slice();
      if (ST.view === "lobby" && ONL.tab === "ami") onlRefrescarLobby();
    });
    room.on("onl.inv", (m) => onlRecibirInvitacion(m));
    room.on("onl.resp", (m) => onlRecibirRespuesta(m));
    room.on("onl.aviso", (m) => onlRecibirPing(m));
  } catch (e) {
    console.error("[onl] room", e);
  }
  onlPresencia();
}
function onlPresencia() {
  if (!ONL.room) return;
  const p = {
    u: net.uid || null,
    p: net.on ? net.id : null,
    f: net.on ? ME : null,
    l: net.on && ONL.meta ? onlListoYo() : false,
    n: ONL.cola.length,
  };
  ONL.room.presence(p).catch(() => {});
}
const onlUidPeer = (pe) => pe.by || (pe.presence && pe.presence.u) || null;
/* ¿tiene esa persona el juego abierto ahora mismo (en cualquier pestaña)? */
function onlConectado(uid, partida) {
  if (!uid) return false;
  if (uid === net.uid && (!partida || partida === net.id)) return true;
  return ONL.peers.some(
    (pe) => onlUidPeer(pe) === uid && !pe.sameTab && (!partida || (pe.presence && pe.presence.p === partida)),
  );
}
/* data de room: como máximo 4 KiB; los objetos grandes van en trozos */
async function onlEmitir(sala, topic, data) {
  if (!sala) return;
  const s = JSON.stringify(data);
  try {
    if (new Blob([s]).size <= ONL_ROOM_MAX) return await sala.emit(topic, data);
    /* comprimido (alfabeto de 6 bits: sin escapes en JSON) y en trozos */
    const z = onlLZc(s),
      id = Math.random().toString(36).slice(2, 9),
      n = Math.ceil(z.length / ONL_ROOM_MAX);
    for (let i = 0; i < n; i++)
      await sala.emit(topic, { k: "trozo", id, i, n, s: z.slice(i * ONL_ROOM_MAX, (i + 1) * ONL_ROOM_MAX) });
  } catch (e) {
    onlTraza("emit falla", topic, e && e.code);
  }
}
function onlRecomponer(msg) {
  const d = msg.data;
  if (!d || d.k !== "trozo") return d;
  const P = (ONL.partes[d.id] = ONL.partes[d.id] || { n: d.n, s: [], c: 0, t: Date.now() });
  if (P.s[d.i] == null) {
    P.s[d.i] = d.s;
    P.c++;
  }
  if (P.c < P.n) return null;
  delete ONL.partes[d.id];
  for (const k in ONL.partes) if (Date.now() - ONL.partes[k].t > 60000) delete ONL.partes[k];
  try {
    return JSON.parse(onlLZd(P.s.join("")));
  } catch (e) {
    return null;
  }
}

/* ---------- F. amigos, avisos (bandeja), notificaciones del navegador ----------
   amistades/<a>~<b> (par ordenado): {par:[a,b], de, para, estado:'pendiente'|'aceptada', ts}
   avisos/<uid>/items/<clave>: {tipo, partida, nombre, texto, ts, de}. La clave es fija por partida y
   tipo (turno-<id>, bat-<id>, ami-<uid>...): los avisos se sobrescriben y no se acumulan sin fin. */
const onlParId = (a, b) => (a < b ? a + "~" + b : b + "~" + a);
function onlSuscribirUsuario() {
  if (!net.db || !net.uid || ONL.unsubs.length) return;
  const uid = net.uid,
    t0 = Date.now(),
    err = () => {};
  ONL.unsubs.push(
    net.db
      .collection("amistades")
      .where("par", "array-contains", uid)
      .onSnapshot((s) => {
        const A = {};
        for (const d of s.docs) {
          const x = d.data(),
            otro = (x.par || []).find((u) => u !== uid);
          if (otro) A[otro] = { estado: x.estado, de: x.de };
        }
        ONL.amigos = A;
        names(Object.keys(A)).then(onlRefrescarLobby);
        onlRefrescarLobby();
      }, err),
  );
  ONL.unsubs.push(
    net.db
      .collection("avisos/" + uid + "/items")
      .orderBy("ts", "desc")
      .limit(40)
      .onSnapshot((s) => {
        ONL.avisos = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        for (const c of s.docChanges()) {
          const a = c.doc.data() || {};
          if (c.type !== "removed" && (a.ts || 0) > t0 - ONL.desfase && a.de !== uid)
            onlNotificar("Ocaso del Imperio", a.texto || "Tienes un aviso nuevo");
        }
        names(ONL.avisos.map((a) => a.de).filter(Boolean)).then(onlBandeja);
        onlBandeja();
        onlRefrescarLobby();
      }, err),
  );
  const mis = (campo, clave) =>
    net.db
      .collection("partidas")
      .where(campo, "array-contains", uid)
      .limit(60)
      .onSnapshot((s) => {
        ONL[clave] = s.docs.map((d) => ({ id: d.id, d: d.data() }));
        names([...new Set(ONL[clave].flatMap((g) => Object.values(g.d.seats || {})))]).then(onlRefrescarLobby);
        onlRefrescarLobby();
        onlBandeja();
      }, err);
  ONL.unsubs.push(mis("jug", "mias"), mis("invitados", "invitadas"));
  ONL.unsubs.push(
    net.db
      .collection("partidas")
      .where("publica", "==", true)
      .orderBy("created", "desc")
      .limit(25)
      .onSnapshot((s) => {
        ONL.publicas = s.docs.map((d) => ({ id: d.id, d: d.data() }));
        net.games = ONL.publicas;
        names([...new Set(ONL.publicas.flatMap((g) => Object.values(g.d.seats || {})))]).then(onlRefrescarLobby);
        onlRefrescarLobby();
      }, err),
  );
  onlBandeja();
}
const onlEsAmigo = (uid) => !!(ONL.amigos[uid] && ONL.amigos[uid].estado === "aceptada");
async function onlSonAmigos(a, b) {
  if (!a || !b) return false;
  if (a === net.uid) return onlEsAmigo(b);
  if (b === net.uid) return onlEsAmigo(a);
  try {
    const d = await net.db.doc("amistades/" + onlParId(a, b)).get();
    return d.exists && d.data().estado === "aceptada";
  } catch (e) {
    return false;
  }
}
async function onlAviso(uid, clave, datos) {
  if (!uid || uid === net.uid || !net.db) return;
  try {
    await net.db.doc(`avisos/${uid}/items/${clave}`).set({ ts: onlAhora(), de: net.uid, ...datos });
  } catch (e) {
    onlTraza("aviso falla", e && e.code);
  }
}
async function onlAmigoPedir(uid) {
  if (!uid || uid === net.uid || !net.db) return;
  const ya = ONL.amigos[uid];
  if (ya && ya.estado === "pendiente" && ya.de !== net.uid) return onlAmigoAceptar(uid);
  if (ya) return;
  await net.db
    .doc("amistades/" + onlParId(net.uid, uid))
    .set({ par: [net.uid, uid].sort(), de: net.uid, para: uid, estado: "pendiente", ts: onlAhora() });
  await onlAviso(uid, "ami-" + net.uid, {
    tipo: "amistad",
    texto: "Te ofrece su amistad (partidas privadas y batallas en vivo aunque no estés conectado).",
  });
}
async function onlAmigoAceptar(uid) {
  await net.db.doc("amistades/" + onlParId(net.uid, uid)).update({ estado: "aceptada", ts: onlAhora() });
  await onlAviso(uid, "ami-" + net.uid, { tipo: "amistad-ok", texto: "Ha aceptado tu amistad." });
  onlQuitarAviso("ami-" + uid);
}
async function onlAmigoQuitar(uid) {
  try {
    await net.db.doc("amistades/" + onlParId(net.uid, uid)).delete();
  } catch (e) {}
  onlQuitarAviso("ami-" + uid);
}
async function onlQuitarAviso(id) {
  try {
    await net.db.doc(`avisos/${net.uid}/items/${id}`).delete();
  } catch (e) {}
}
/* bandeja flotante (✉): avisos de la db + partidas en las que te toca */
function onlBandeja() {
  if (!net.uid || !net.db) return;
  let b = document.getElementById("onl-bandeja");
  if (!b) {
    b = document.createElement("button");
    b.id = "onl-bandeja";
    b.dataset.act = "s-onlbandeja";
    b.setAttribute("aria-label", "Avisos online");
    document.body.appendChild(b);
  }
  const n = ONL.avisos.length + onlTeTocaN();
  b.textContent = n ? `✉ ${n}` : "✉";
  b.classList.toggle("on", n > 0);
  onlTitulo();
}
const onlTeTocaN = () => ONL.mias.filter((g) => onlEstadoPartida(g.d, g.id).k === "toca").length;
function onlTitulo() {
  const urg =
    ONL.avisos.length > 0 ||
    onlTeTocaN() > 0 ||
    !!ONL.inv ||
    (net.on && G && ONL.meta && ONL.meta.fase === "ordenes" && myTurn());
  const t = (urg ? "(!) " : "") + "Ocaso del Imperio";
  if (document.title !== t) document.title = t;
}
function onlNotificar(titulo, cuerpo) {
  ONL.ultNotif = cuerpo;
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted" || !document.hidden) return;
    new Notification(titulo, { body: cuerpo, tag: "ocaso" });
  } catch (e) {}
}
async function onlPedirNotif() {
  try {
    if (typeof Notification === "undefined")
      return modal("Avisos del navegador", "<p>Este navegador no admite avisos.</p>", [{ t: "Vale" }]);
    const r = await Notification.requestPermission();
    ONL.notif = r === "granted";
    modal(
      "Avisos del navegador",
      ONL.notif
        ? "<p>Con la pestaña abierta en segundo plano te avisaremos de tu turno y de las batallas.</p>"
        : "<p>No se concedió el permiso. Seguirás viendo los avisos dentro del juego (✉) y «(!)» en el título de la pestaña.</p>",
      [{ t: "Vale" }],
    );
  } catch (e) {}
}
function onlVerBandeja() {
  const it = ONL.avisos,
    toca = ONL.mias.filter((g) => onlEstadoPartida(g.d, g.id).k === "toca");
  const h =
    (toca.length
      ? `<h3>Te toca</h3>${toca.map((g) => `<div class="row"><b>${esc(g.d.name || "Partida")}</b> <span class="stats">${esc(onlEstadoPartida(g.d, g.id).t)}</span><div class="btns"><button data-act="s-onlent-${esc(g.id)}" class="gold">Entrar</button></div></div>`).join("")}`
      : "") +
    (it.length
      ? `<h3>Avisos</h3>${it
          .map(
            (a) =>
              `<div class="row onl-av"><span class="stats">${esc(onlFmtHora(a.ts))}${a.de ? " · " + esc(onlNombre(a.de)) : ""}</span><br>${esc(a.texto || "")}${a.nombre ? ` <i>(${esc(a.nombre)})</i>` : ""}<div class="btns">${a.tipo === "amistad" && ONL.amigos[a.de] && ONL.amigos[a.de].estado === "pendiente" ? `<button class="gold" data-act="s-onlamiok-${esc(a.de)}">Aceptar amistad</button>` : ""}${a.partida ? `<button data-act="s-onlent-${esc(a.partida)}">Ir a la partida</button>` : ""}<button data-act="s-onlavx-${esc(a.id)}">Descartar</button></div></div>`,
          )
          .join("")}`
      : "<p class='dim'>No tienes avisos.</p>");
  onlCapa("Avisos", h);
}
/* capa propia por encima de todo (no usa la cola de modales: no bloquea ni la bloquean) */
function onlCapa(titulo, html, id = "onl-capa", sinCerrar) {
  let c = document.getElementById(id);
  if (!c) {
    c = document.createElement("div");
    c.id = id;
    c.className = "onl-capa";
    document.body.appendChild(c);
  }
  if (titulo == null) {
    c.classList.remove("show");
    c.innerHTML = "";
    return;
  }
  c.innerHTML = `<div class="card"><h2>${titulo}</h2>${html}${sinCerrar ? "" : `<div class="btns"><button data-act="s-onlcapa-${id}">Cerrar</button></div>`}</div>`;
  c.classList.add("show");
}

/* ---------- G. vestíbulo: mis partidas, públicas, amigos, avisos, crear ---------- */
const onlSeats = (d) => Object.keys((d && d.seats) || {}).map(Number);
const onlEstSeat = (d, f) => ((d && d.est) || {})[f] || "activo";
/* pueblos que llevan personas este turno (los abandonados o sustituidos los lleva la IA) */
const onlActivos = (d) => onlSeats(d).filter((f) => onlEstSeat(d, f) === "activo");
const onlMiSeat = (d, uid = net.uid) => {
  const k = Object.keys((d && d.seats) || {}).find((f) => d.seats[f] === uid);
  return k === undefined ? null : +k;
};
const onlCivTxt = (f) => `<span style="color:${CIV[f] ? CIV[f].c : "#ccc"}">${CIV[f] ? esc(CIV[f].s) : "?"}</span>`;
function onlEstadoPartida(d, id) {
  if (!d) return { k: "?", t: "" };
  if (!d.v) return { k: "antigua", t: "Partida en formato antiguo (por años): entra para convertirla" };
  if (d.terminada || d.fase === "fin")
    return { k: "fin", t: d.over && d.over.win >= 0 && CIV[d.over.win] ? `Terminada: vence ${CIV[d.over.win].s}` : "Terminada" };
  const f = onlMiSeat(d);
  if (f == null) return (d.invitados || []).includes(net.uid) ? { k: "inv", t: "Te han invitado" } : { k: "libre", t: "" };
  const e = onlEstSeat(d, f),
    resto = onlFmtResto((d.limite || 0) - onlAhora());
  if (e === "abandono") return { k: "aband", t: "La abandonaste: tu pueblo lo lleva la IA" };
  if (e === "ia") return { k: "ia", t: "Por ausencia, tu pueblo lo lleva la IA: entra para retomarlo" };
  if (d.fase === "batalla" && d.batalla) {
    const B = d.batalla;
    if (B.d === net.uid) return { k: "toca", t: `¡Te atacan en ${B.lugar}! Acude antes de ${onlFmtHora(B.limite)}` };
    return { k: "bat", t: `Batalla pendiente en ${B.lugar}: esperando a ${onlNombre(B.d)} (${onlFmtResto(B.limite - onlAhora())})` };
  }
  if ((d.listos || {})[f] !== d.turno) return { k: "toca", t: `Te toca · quedan ${resto}` };
  const faltan = onlActivos(d).filter((g) => (d.listos || {})[g] !== d.turno);
  if (!faltan.length) return { k: "esp", t: "Todos listos: se resuelve la estación" };
  return { k: "esp", t: `Esperando a ${faltan.map((g) => onlNombre(d.seats[g])).join(", ")} · ${resto}` };
}
function onlRefrescarLobby() {
  if (ST.view !== "lobby" || !$("start").classList.contains("show")) return;
  if (ONL.tab === "nueva") return; // no borrar el formulario
  const el = $("onl-lob");
  if (el) el.innerHTML = onlLobbyCuerpo();
  else renderStart();
}
function onlVistaLobby() {
  const tabs = [
    ["mis", `Mis partidas${onlTeTocaN() ? ` (${onlTeTocaN()})` : ""}`],
    ["pub", "Públicas"],
    ["ami", `Amigos${Object.values(ONL.amigos).some((a) => a.estado === "pendiente" && a.de !== net.uid) ? " (!)" : ""}`],
    ["avi", `Avisos${ONL.avisos.length ? ` (${ONL.avisos.length})` : ""}`],
    ["nueva", "Crear partida"],
  ];
  return `<h2>Partidas online</h2><p class="dim">Partidas largas por estaciones: cada uno da sus órdenes cuando puede (con plazo) o, si estáis todos conectados, a la vez en tiempo real. Al vencer el plazo, la IA juega por el ausente.</p>
  <div class="onl-tabs" role="tablist">${tabs.map(([k, t]) => `<button data-act="s-onltab-${k}" class="${ONL.tab === k ? "on" : ""}" aria-pressed="${ONL.tab === k}">${t}</button>`).join("")}</div>
  <div id="onl-lob">${onlLobbyCuerpo()}</div>
  <div class="btns" style="margin-top:12px"><button data-act="s-bk">Atrás</button><button data-act="s-onlnotif">Avisos del navegador</button></div>`;
}
function onlJugadoresTxt(d) {
  return onlSeats(d)
    .map((f) => {
      const u = d.seats[f],
        e = onlEstSeat(d, f);
      return `${onlCivTxt(f)} ${esc(onlNombre(u))}${onlConectado(u) ? ' <i class="onl-on" title="conectado">●</i>' : ""}${e !== "activo" ? ` <i class="dim">(${e === "ia" ? "IA por ausencia" : "abandonó"})</i>` : ""}`;
    })
    .join(", ");
}
function onlFila(g, conAcc) {
  const d = g.d,
    E = onlEstadoPartida(d, g.id),
    f = onlMiSeat(d),
    libres = onlLibres(d);
  let acc = "";
  if (conAcc) {
    if (f != null && E.k !== "fin") acc = `<button class="gold" data-act="s-onlent-${esc(g.id)}">Entrar como ${esc(CIV[f].s)}</button>`;
    else if (f != null) acc = `<button data-act="s-onlent-${esc(g.id)}">Ver el final</button><button data-act="s-onlolv-${esc(g.id)}">Quitar de la lista</button>`;
    else if (libres.length && E.k !== "fin")
      acc = `<select id="onl-js-${esc(g.id)}" aria-label="Pueblo">${libres.map((x) => `<option value="${x.f}">${esc(CIV[x.f].s)}${x.aband ? " (sustituir)" : ""}</option>`).join("")}</select><button data-act="s-onluni-${esc(g.id)}">Unirse</button>`;
    else acc = '<span class="dim">Completa</span>';
  }
  const cfg = d.cfg || {};
  return `<div class="row onl-p onl-${E.k}"><div class="hd"><b>${esc(d.name || "Partida")}</b><span class="stats">${d.modo === "leyendas" ? "leyendas · " : ""}${d.publica ? "pública" : "privada"} · ${cfg.modoTurno === "tr" ? "tiempo real" : "correspondencia " + (cfg.plazoH || 24) + " h"} · ${esc(onlEstTxt(d.year || 410, d.estacion))}</span></div>
  <span class="stats">${onlJugadoresTxt(d)}</span>${E.t ? `<div class="onl-est">${esc(E.t)}</div>` : ""}<div class="btns">${acc}</div></div>`;
}
/* plazas libres: pueblos sin dueño o abandonados (sustitución) */
function onlLibres(d) {
  const act = Array.isArray(d.activas) ? d.activas.filter((f) => f >= 0 && f < NF) : MUNDO_HIST;
  return act
    .filter((f) => !(f in (d.seats || {})) || onlEstSeat(d, f) === "abandono")
    .map((f) => ({ f, aband: f in (d.seats || {}) }));
}
function onlLobbyCuerpo() {
  if (!net.db || !net.uid) return '<p class="dim">El modo online se activa cuando abres el juego publicado con tu cuenta.</p>';
  const t = ONL.tab;
  if (t === "mis") {
    const todas = [...ONL.mias, ...ONL.invitadas.filter((g) => !ONL.mias.some((x) => x.id === g.id))],
      vivas = todas.filter((g) => onlEstadoPartida(g.d, g.id).k !== "fin"),
      fin = todas.filter((g) => onlEstadoPartida(g.d, g.id).k === "fin");
    const ord = { toca: 0, bat: 1, inv: 2, ia: 3, esp: 4, aband: 5, antigua: 6 };
    vivas.sort((a, b) => (ord[onlEstadoPartida(a.d).k] ?? 9) - (ord[onlEstadoPartida(b.d).k] ?? 9) || (b.d.updated || 0) - (a.d.updated || 0));
    return (
      (vivas.length ? vivas.map((g) => onlFila(g, true)).join("") : '<p class="dim">No juegas ninguna partida online. Crea una o únete a una pública.</p>') +
      (fin.length ? `<details class="onl-arch"><summary>Archivo (${fin.length} terminadas)</summary>${fin.map((g) => onlFila(g, true)).join("")}</details>` : "")
    );
  }
  if (t === "pub") {
    const l = ONL.publicas.filter((g) => !g.d.terminada);
    return l.length ? l.map((g) => onlFila(g, true)).join("") : '<p class="dim">No hay partidas públicas abiertas. Crea la primera.</p>';
  }
  if (t === "avi") {
    setTimeout(onlVerBandeja, 0);
    return '<p class="dim">Abriendo los avisos…</p>';
  }
  if (t === "ami") {
    const A = ONL.amigos,
      ids = Object.keys(A),
      ok = ids.filter((u) => A[u].estado === "aceptada"),
      rec = ids.filter((u) => A[u].estado === "pendiente" && A[u].de !== net.uid),
      env = ids.filter((u) => A[u].estado === "pendiente" && A[u].de === net.uid),
      conocidos = [...new Set([...ONL.mias, ...ONL.publicas].flatMap((g) => Object.values(g.d.seats || {})))].filter((u) => u !== net.uid && !A[u]);
    const li = (u, b) => `<div class="row onl-ami"><b>${esc(onlNombre(u))}</b> ${onlConectado(u) ? '<i class="onl-on">● conectado</i>' : '<i class="dim">desconectado</i>'}<div class="btns">${b}</div></div>`;
    return `<p class="dim">Los amigos son mutuos: tú lo pides y el otro acepta. Con un amigo desconectado, sus batallas contra ti esperan a que acuda (plazo de la partida); con desconocidos se resuelven contra una IA difícil.</p>
    <p><label for="onl-busca">Buscar en tu organización</label><input id="onl-busca" placeholder="Nombre" autocomplete="off"></p><div id="onl-res"></div>
    ${rec.length ? `<h3>Solicitudes recibidas</h3>${rec.map((u) => li(u, `<button class="gold" data-act="s-onlamiok-${esc(u)}">Aceptar</button><button data-act="s-onlamix-${esc(u)}">Rechazar</button>`)).join("")}` : ""}
    <h3>Amigos</h3>${ok.length ? ok.map((u) => li(u, `<button data-act="s-onlamix-${esc(u)}">Quitar</button>`)).join("") : '<p class="dim">Aún no tienes amigos en el juego.</p>'}
    ${env.length ? `<h3>Solicitudes enviadas</h3>${env.map((u) => li(u, `<button data-act="s-onlamix-${esc(u)}">Retirar</button>`)).join("")}` : ""}
    ${conocidos.length ? `<h3>Jugadores de tus partidas</h3>${conocidos.map((u) => li(u, `<button data-act="s-onlami-${esc(u)}">Pedir amistad</button>`)).join("")}` : ""}`;
  }
  if (t === "nueva") {
    const c = ONL.cfg,
      ok = Object.keys(ONL.amigos).filter((u) => ONL.amigos[u].estado === "aceptada"),
      sel = (id, val, ops) => `<select id="${id}">${ops.map(([v, tx]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${tx}</option>`).join("")}</select>`;
    return `<div class="onl-form">
    <p><label for="onl-pub">Quién puede entrar</label>${sel("onl-pub", ONL.nuevaPub ? 1 : 0, [[0, "Privada: solo amigos invitados"], [1, "Pública: aparece en la lista para cualquiera"]])}</p>
    <fieldset><legend>Invitar a amigos</legend>${ok.length ? ok.map((u) => `<label class="onl-chk"><input type="checkbox" id="onl-inv-${esc(u)}" ${ONL.nuevaInv && ONL.nuevaInv.includes(u) ? "checked" : ""}> ${esc(onlNombre(u))}</label>`).join("") : '<span class="dim">Sin amigos todavía (pestaña Amigos).</span>'}</fieldset>
    <p><label for="onl-modo">Turnos</label>${sel("onl-modo", c.modoTurno, [["corr", "Por correspondencia: cada uno cuando puede, con plazo"], ["tr", "Simultáneos en tiempo real cuando estéis todos conectados"]])}</p>
    <p><label for="onl-plazo">Plazo para dar las órdenes de cada estación</label>${sel("onl-plazo", c.plazoH, ONL_PLAZOS.map((h) => [h, h + " h"]))}</p>
    <p><label for="onl-trseg">Estación en tiempo real</label>${sel("onl-trseg", c.trSeg, [60, 90, 120, 180, 300].map((s) => [s, s + " s"]))}</p>
    <p><label for="onl-invseg">Espera a que un rival conectado acepte su batalla</label>${sel("onl-invseg", c.invitSeg, [60, 90, 120].map((s) => [s, s + " s"]))}</p>
    <p><label for="onl-amigo">Si el amigo atacado no está conectado, se le espera</label>${sel("onl-amigo", c.amigoMin, [[0, "No: IA difícil al momento"], [30, "30 min"], [120, "2 h"], [360, "6 h"], [720, "12 h"], [1440, "24 h"]])}</p>
    <p><label for="onl-mbat">Batallas en vivo</label>${sel("onl-mbat", c.modoBatalla, [["t3", "Por turnos · 3 acciones"], ["t1", "Por turnos · 1 acción"], ["rt", "Tiempo real (necesita buena conexión)"]])}</p>
    <div class="btns"><button class="gold" data-act="s-onlcfg">Elegir pueblo ▶</button></div></div>`;
  }
  return "";
}
/* búsqueda de personas (user.search) */
document.addEventListener("input", async (e) => {
  if (!e.target || e.target.id !== "onl-busca" || !net.user || !net.user.search) return;
  const q = e.target.value.trim(),
    hs = q ? await net.user.search(q) : [],
    el = $("onl-res");
  if (!el) return;
  el.innerHTML = hs
    .filter((p) => p.id && p.id !== net.uid)
    .map((p) => {
      net.names[p.id] = p.name || net.names[p.id] || "";
      const a = ONL.amigos[p.id];
      return `<div class="row onl-ami"><b>${esc(p.name || "Alguien")}</b><div class="btns">${a ? `<span class="dim">${a.estado === "aceptada" ? "ya es tu amigo" : "solicitud pendiente"}</span>` : `<button data-act="s-onlami-${esc(p.id)}">Pedir amistad</button>`}</div></div>`;
    })
    .join("");
});
function onlLeerCfg() {
  const v = (id, d) => ($(id) ? $(id).value : d);
  ONL.cfg = {
    ...ONL_CFG_DEF,
    modoTurno: v("onl-modo", "corr") === "tr" ? "tr" : "corr",
    plazoH: +v("onl-plazo", 24) || 24,
    trSeg: +v("onl-trseg", 90) || 90,
    invitSeg: +v("onl-invseg", 90) || 90,
    amigoMin: +v("onl-amigo", 120) || 0,
    modoBatalla: ["t3", "t1", "rt"].includes(v("onl-mbat", "t3")) ? v("onl-mbat", "t3") : "t3",
  };
  ONL.nuevaPub = v("onl-pub", "0") === "1";
  ONL.nuevaInv = Object.keys(ONL.amigos).filter((u) => $("onl-inv-" + u) && $("onl-inv-" + u).checked);
}
/* acciones de la pantalla de inicio: data-act="s-onl…" (funcionan sin partida cargada) */
async function onlAccionInicio(k, x) {
  if (k === "onltab") {
    ONL.tab = x;
    renderStart();
    return;
  }
  if (k === "onlbandeja") return onlVerBandeja();
  if (k === "onlcapa") return onlCapa(null, "", x);
  if (k === "onlnotif") return onlPedirNotif();
  if (k === "onlami") return onlAmigoPedir(x);
  if (k === "onlamiok") return onlAmigoAceptar(x).then(() => onlCapa(null));
  if (k === "onlamix") return onlAmigoQuitar(x);
  if (k === "onlavx") {
    await onlQuitarAviso(x);
    return onlVerBandeja();
  }
  if (k === "onlcfg") {
    onlLeerCfg();
    ST.mode = "online";
    ST.modo = ST.modo || "historico";
    openStart("civ");
    return;
  }
  if (k === "onlent") {
    onlCapa(null);
    const g = [...ONL.mias, ...ONL.invitadas, ...ONL.publicas].find((g) => g.id === x);
    let d = g && g.d;
    if (!d)
      try {
        d = (await net.db.doc("partidas/" + x).get()).data();
      } catch (e) {}
    if (!d) return;
    const f = onlMiSeat(d);
    if (f == null) {
      ONL.tab = "mis";
      return openLobby();
    }
    return onlEntrar(x, f);
  }
  if (k === "onluni") {
    const s = $("onl-js-" + x);
    if (s) onlUnirse(x, +s.value);
    return;
  }
  if (k === "onlolv") {
    const g = ONL.mias.find((g) => g.id === x);
    if (g) await net.db.doc("partidas/" + x).update({ jug: (g.d.jug || []).filter((u) => u !== net.uid) });
    return;
  }
  if (k === "onlinv") return onlResponderInvitacion(x === "si");
}

/* ---------- H. la partida: crear, unirse, entrar, recibir el estado ---------- */
function onlLimite(cfg, conectados) {
  const c = { ...ONL_CFG_DEF, ...(cfg || {}) };
  return onlAhora() + (c.modoTurno === "tr" && conectados ? c.trSeg * 1000 : c.plazoH * 3600000);
}
async function onlCrear() {
  if (!net.db || !net.uid) return;
  leaveNet();
  newGame(ST.civ, ST.cands[ST.ci], mundoOpciones());
  drawBase();
  OC.emitirSync("partidaLista");
  const O = onlS();
  O.turno = 0;
  G.human = [ME];
  for (const l of G.log) l.t = -1;
  const pk = onlEmpaquetar(G),
    ref = net.db.collection("partidas").doc(),
    cfg = { ...ONL.cfg },
    inv = (ONL.nuevaInv || []).slice();
  try {
    await onlGuardarEstado(ref.id, 1, pk);
    await ref.set({
      v: ONL_V,
      name: ST.gname || "Partida",
      created: onlAhora(),
      updated: onlAhora(),
      host: net.uid,
      modo: G.modo,
      activas: G.activas,
      publica: !!ONL.nuevaPub,
      invitados: inv,
      jug: [net.uid],
      seats: { [ME]: net.uid },
      est: { [ME]: "activo" },
      faltas: {},
      turno: 0,
      year: G.year,
      estacion: G.estacion || 0,
      ver: 1,
      partes: pk.partes.length,
      tam: pk.tam,
      tamZ: pk.tamZ,
      fase: "ordenes",
      limite: onlLimite(cfg, false),
      cfg,
      listos: {},
      visto: { [net.uid]: 0 },
      batalla: null,
      susp: {},
    });
    for (const u of inv)
      await onlAviso(u, "inv-" + ref.id, { tipo: "invitacion", partida: ref.id, nombre: ST.gname, texto: "Te invita a una partida privada." });
    onlEntrar(ref.id, ME);
  } catch (e) {
    console.error(e);
    modal(
      "No se pudo crear la partida",
      `<p>${e && e.code === "invalid_argument" ? "Necesitas permiso de colaborador en este juego para jugar online." : "Inténtalo de nuevo en un momento."}</p>`,
      [{ t: "Vale" }],
    );
  }
}
async function onlUnirse(id, f) {
  try {
    const ref = net.db.doc("partidas/" + id),
      lk = await net.db.doc(`partidas/${id}/ctl/seat-${f}`).acquire({ holder: ONL.yo, ttlMs: 8000 });
    if (!lk.acquired) throw { code: "ocupada" };
    const d = (await ref.get()).data();
    if (!d) throw { code: "nada" };
    const libre = !(f in (d.seats || {})) || onlEstSeat(d, f) === "abandono",
      priv = !d.publica && !(d.invitados || []).includes(net.uid) && d.host !== net.uid;
    if (!libre || priv) {
      modal("Plaza ocupada", `<p>${priv ? "Es una partida privada: solo entran los invitados." : "Otro jugador tomó ese pueblo. Elige otro."}</p>`, [{ t: "Vale" }]);
      return;
    }
    const sust = f in (d.seats || {}) ? d.seats[f] : null;
    await ref.update({
      seats: { [f]: net.uid },
      est: { [f]: "activo" },
      faltas: { [f]: 0 },
      jug: [...new Set([...(d.jug || []), net.uid])],
      visto: { [net.uid]: d.turno || 0 },
      updated: onlAhora(),
    });
    for (const u of new Set(Object.values(d.seats || {})))
      if (u !== sust)
        onlAviso(u, "uni-" + id, {
          tipo: "union",
          partida: id,
          nombre: d.name,
          texto: `Se une a la partida con ${CIV[f].s}${sust ? " (sustituye a quien la abandonó)" : ""}.`,
        });
    onlQuitarAviso("inv-" + id);
    onlEntrar(id, f);
  } catch (e) {
    modal("No se pudo unir", `<p>${e && e.code === "ocupada" ? "Alguien está tomando esa plaza ahora mismo." : "Necesitas permiso de colaborador en este juego para jugar online."}</p>`, [{ t: "Vale" }]);
  }
}
function onlPanelReg() {
  OC.panel({ id: "onl", titulo: "Online", orden: 85, render: onlPanel });
}
function onlSalir() {
  if (ONL.unMeta) {
    ONL.unMeta();
    ONL.unMeta = null;
  }
  OC.paneles = OC.paneles.filter((p) => p.id !== "onl");
  ONL.meta = null;
  ONL.ver = 0;
  ONL.baseTxt = null;
  ONL.base = null;
  ONL.cola = [];
  ONL.turnoVisto = null;
  ONL.vistoResumen = {};
  net.on = false;
  net.id = null;
  net.ver = 0;
  net.seats = {};
  net.cur = null;
  if (net.unsub) {
    net.unsub();
    net.unsub = null;
  }
  onlPresencia();
}
function onlEntrar(id, f) {
  leaveNet();
  net.on = true;
  net.id = id;
  ME = f;
  ONL.entrada = true;
  onlPanelReg();
  $("start").classList.remove("show");
  onlPresencia();
  ONL.unMeta = net.db.doc("partidas/" + id).onSnapshot(
    (s) => {
      const d = s.data();
      if (!d || net.id !== id) return;
      onlMeta(d);
    },
    () =>
      modal("Conexión perdida", "<p>La partida online dejó de responder. Vuelve al menú y entra de nuevo.</p>", [
        { t: "Menú", fn: () => openStart("home") },
      ]),
  );
  net.unsub = ONL.unMeta;
}
async function onlMeta(d) {
  ONL.meta = d;
  net.seats = d.seats || {};
  names(Object.values(net.seats));
  if (!d.v && d.state) return onlMigrar(d);
  if ((d.ver || 0) > ONL.ver && !ONL.cargando && !ONL.resolviendo) {
    ONL.cargando = true;
    try {
      const txt = await onlCargarEstado(net.id, d);
      if (net.on && (ONL.meta.ver || 0) >= d.ver) onlAdoptar(txt, d);
    } catch (e) {
      console.error("[onl] estado", e);
      onlTraza("carga falla", e && e.message);
    } finally {
      ONL.cargando = false;
    }
    if (ONL.meta && ONL.meta.ver > ONL.ver) return onlMeta(ONL.meta);
  }
  if (!G || ONL.resolviendo) return;
  onlCur();
  G.human = onlActivos(d);
  if (onlMiSeat(d) !== ME && net.on) {
    /* alguien te sustituyó: solo miras */
    net.cur = null;
  }
  ui();
  onlPresencia();
  onlTitulo();
  onlFase();
}
/* turno de quién: tú si te toca; si no, el primero que falta (para el texto de la interfaz) */
function onlCur() {
  const d = ONL.meta;
  if (!d) return;
  const mio = onlMiSeat(d) === ME && onlEstSeat(d, ME) === "activo";
  if (d.fase === "ordenes" && mio && (d.listos || {})[ME] !== d.turno && !d.terminada) net.cur = ME;
  else net.cur = onlActivos(d).find((g) => (d.listos || {})[g] !== d.turno) ?? null;
  if (d.fase === "batalla" && d.batalla) net.cur = d.batalla.fd;
}
const onlListoYo = () => !!(ONL.meta && (ONL.meta.listos || {})[ME] === ONL.meta.turno);
function onlAdoptar(txt, d) {
  const g = JSON.parse(txt);
  if (!MAP || MAP.seed !== g.seed || !G || G.mapa?.w !== g.mapa?.w) {
    MAP = gen(g.seed, g.mapa);
    drawBase();
  }
  G = g;
  G.human = onlActivos(d);
  OC.emitirSync("partidaLista");
  ONL.base = onlClon(G);
  ONL.baseTxt = txt;
  ONL.ver = d.ver;
  net.ver = d.ver;
  onlTramoSig(G, ME);
  if (ONL.turnoVisto !== d.turno) ONL.cola = [];
  if (sel === null || !G.P[sel] || G.P[sel].owner !== ME) {
    sel = G.F[ME] ? G.F[ME].capId : 0;
    centerOn(sel);
  }
}
/* al recibir un estado: resumen «mientras no estabas», eventos del año y aviso del turno */
async function onlFase() {
  const d = ONL.meta;
  if (!d || !G) return;
  const nuevo = ONL.turnoVisto !== d.turno;
  ONL.turnoVisto = d.turno;
  if (ONL.entrada) {
    ONL.entrada = false;
    const v = (d.visto || {})[net.uid];
    if (v != null && v < d.turno) await onlResumen(v, d);
    net.db
      .doc("partidas/" + net.id)
      .update({ visto: { [net.uid]: d.turno } })
      .catch(() => {});
    if (onlEstSeat(d, ME) === "ia" && onlMiSeat(d) === ME)
      modal("Tu pueblo lo lleva la IA", "<p>Faltaste varias estaciones seguidas y la IA tomó el mando. Puedes retomarlo cuando quieras.</p>", [
        { t: "Retomar mi pueblo", cls: "gold", fn: () => onlRetomar() },
        { t: "Ahora no" },
      ]);
  } else if (nuevo && ONL.enviado !== d.turno - 1 && ONL.enviado >= 0 && onlEstSeat(d, ME) === "activo")
    modal("La estación se cerró sin tus órdenes", "<p>Venció el plazo antes de que pulsaras «Listo»: la IA gobernó tu pueblo esa estación.</p>", [{ t: "Vale" }]);
  if (nuevo && myTurn()) {
    onlNotificar("Ocaso del Imperio", `Te toca: ${onlEstTxt(G.year, G.estacion)} en «${d.name}».`);
    if (!busy) startTurn();
  }
  if (d.fase === "batalla" && d.batalla && d.batalla.d === net.uid && !ONL.resolviendo && !ONL.ofrecida) {
    ONL.ofrecida = d.batalla.bid;
    modal(
      "¡Te atacan!",
      `<p>${esc(onlNombre(d.batalla.a))} (${esc(CIV[d.batalla.fa]?.s || "")}) ataca a tus tropas en <b>${esc(d.batalla.lugar)}</b>. La estación está detenida hasta que acudas o venza el plazo (${esc(onlFmtHora(d.batalla.limite))}); si no acudes, tus capitanes lucharán (IA difícil).</p>`,
      [
        { t: "Acudir a la batalla", cls: "gold", v: 1 },
        { t: "Que luchen mis capitanes", v: 0 },
      ],
    ).then((v) => {
      if (v === 1) onlResolver({ acudo: true });
      else onlResolver({ renuncio: true });
    });
  }
}
/* «Mientras no estabas»: la crónica personal (G.onl.cron) y la del reino (G.log) desde tu última visita */
async function onlResumen(v, d) {
  const O = onlS(),
    mias = (O.cron || []).filter((c) => c.t >= v && (c.f || []).includes(ME)).slice(0, 25),
    log = (G.log || []).filter((l) => l.t != null && l.t >= v).slice(0, 25),
    n = d.turno - v;
  if (!mias.length && !log.length) return;
  ONL.vistoResumen = { v, n, mias: mias.length, log: log.length };
  await modal(
    "Mientras no estabas",
    `<p class="dim">${n} ${n === 1 ? "estación" : "estaciones"} desde tu última visita · ahora ${esc(onlEstTxt(G.year, G.estacion))}.</p>
    ${mias.length ? `<h3>Tu pueblo</h3><ul class="onl-res">${mias.map((c) => `<li class="${c.c || ""}">${esc(onlEstTxt(c.a, c.e))}: ${esc(c.m)}</li>`).join("")}</ul>` : ""}
    ${log.length ? `<h3>Crónica</h3><ul class="onl-res">${log.map((l) => `<li class="${l.c || ""}">${l.m}</li>`).join("")}</ul>` : ""}`,
    [{ t: "Continuar", cls: "gold" }],
  );
}
/* partidas del formato antiguo (un jugador por turno, estado entero en el documento) */
async function onlMigrar(d) {
  if (ONL.migrando) return;
  ONL.migrando = true;
  try {
    const g = JSON.parse(d.state);
    G = g;
    if (!MAP || MAP.seed !== g.seed) {
      MAP = gen(g.seed, g.mapa);
      drawBase();
    }
    OC.emitirSync("partidaLista");
    onlS().turno = 0;
    for (const l of G.log) l.t = -1;
    const pk = onlEmpaquetar(G);
    await onlGuardarEstado(net.id, 2, pk);
    const seats = d.seats || {};
    await net.db.doc("partidas/" + net.id).update({
      v: ONL_V,
      state: null,
      host: d.host || seats[Object.keys(seats)[0]] || net.uid,
      jug: [...new Set(Object.values(seats))],
      est: Object.fromEntries(Object.keys(seats).map((f) => [f, "activo"])),
      publica: true,
      invitados: [],
      faltas: {},
      turno: 0,
      estacion: G.estacion || 0,
      ver: 2,
      partes: pk.partes.length,
      tam: pk.tam,
      tamZ: pk.tamZ,
      fase: "ordenes",
      limite: onlLimite(ONL_CFG_DEF, false),
      cfg: { ...ONL_CFG_DEF },
      listos: {},
      visto: {},
      batalla: null,
      susp: {},
      updated: onlAhora(),
    });
  } catch (e) {
    console.error("[onl] migrar", e);
  } finally {
    ONL.migrando = false;
  }
}

/* ---------- I. la fase de órdenes: cola de campaña, panel, «Listo», plazos ---------- */
function onlEncolar(o) {
  const ej = o.ej != null ? camEj(o.ej) : null;
  if (o.tipo === "mover" && ej && !camPlanRuta(ej, o.x, o.y, { luego: o.luego, p: o.p, con: o.con })) {
    addLog("No hay camino hasta allí.", "bad");
    return { ok: false, motivo: "No hay camino" };
  }
  ONL.cola = ONL.cola.filter((q) => !(o.ej != null ? q.ej === o.ej : q.tipo === o.tipo && q.p === o.p));
  ONL.cola.push({ ...o, f: ME });
  const txt = onlOrdenTxt(o);
  addLog(`Orden para esta estación: ${txt}.`, "");
  if (ej && camSel === ej.id) camSel = null;
  onlPresencia();
  return { ok: true, encolada: true };
}
function onlOrdenTxt(o) {
  const ej = o.ej != null ? camEj(o.ej) : null,
    nom = ej ? camNombre(ej) : "Guarnición",
    p = o.p != null ? G.P[o.p] : null,
    casilla = o.x != null && MAP.grid[o.y] ? G.P[MAP.grid[o.y][o.x]] : null;
  if (o.tipo === "mover") return `${nom} marcha hacia ${casilla ? casilla.name : "el campo"}${o.luego ? " y luego " + o.luego : ""}`;
  if (o.tipo === "asediar") return `${nom} asedia ${p ? p.name : "la ciudad"}`;
  if (o.tipo === "asaltar") return `${nom} asalta ${p ? p.name : "la ciudad sitiada"}`;
  if (o.tipo === "salida") return `la guarnición de ${p ? p.name : "la ciudad"} hace una salida`;
  return o.tipo;
}
/* el panel «Online» del juego */
function onlPanel(dis) {
  const d = ONL.meta;
  if (!d || !G) return "<h2>Online</h2><p class='dim'>Cargando la partida…</p>";
  const cfg = { ...ONL_CFG_DEF, ...(d.cfg || {}) },
    E = onlEstadoPartida(d, net.id),
    todos = onlActivos(d).every((f) => onlConectado(d.seats[f], net.id)),
    mio = onlMiSeat(d) === ME;
  let h = `<h2>${esc(d.name || "Partida online")}</h2><p class="dim">${d.publica ? "Pública" : "Privada"} · ${cfg.modoTurno === "tr" ? "simultánea en tiempo real" : "por correspondencia (" + cfg.plazoH + " h por estación)"} · ${esc(onlEstTxt(G.year, G.estacion))} · estación nº ${d.turno + 1}</p>`;
  h += `<div class="onl-fase onl-${E.k}"><b>${esc(E.t || "")}</b><br><span class="stats">Cierre: <span id="onl-cuenta">${esc(onlFmtResto((d.limite || 0) - onlAhora()))}</span></span></div>`;
  h += `<h3>Jugadores</h3><ul class="onl-jug">${onlSeats(d)
    .map((f) => {
      const u = d.seats[f],
        e = onlEstSeat(d, f),
        pe = ONL.peers.find((p) => onlUidPeer(p) === u && p.presence && p.presence.p === net.id),
        lis = (d.listos || {})[f] === d.turno;
      return `<li>${onlCivTxt(f)} ${esc(onlNombre(u))}${u === net.uid ? " (tú)" : ""} · ${e !== "activo" ? (e === "ia" ? "IA por ausencia" : "abandonó (IA)") : lis ? "listo" : pe ? `dando órdenes${pe.presence.n ? " (" + pe.presence.n + ")" : ""}` : "pendiente"}${onlConectado(u, net.id) ? ' <i class="onl-on" title="conectado">●</i>' : ""}${u !== net.uid && !ONL.amigos[u] ? ` <button class="onl-mini" data-act="onl-ami:${esc(u)}">+ amigo</button>` : ""}</li>`;
    })
    .join("")}</ul>`;
  if (d.fase === "ordenes" && mio) {
    h += `<h3>Órdenes de campaña de esta estación</h3>`;
    h += ONL.cola.length
      ? `<ul class="onl-cola">${ONL.cola.map((o, i) => `<li>${esc(onlOrdenTxt(o))} <button class="onl-mini" data-act="onl-q:${i}" ${dis ? "disabled" : ""}>quitar</button></li>`).join("")}</ul>`
      : `<p class="dim">Selecciona un ejército y su destino: las marchas, asedios, asaltos y salidas se resuelven a la vez para todos al cerrar la estación (cada ejército alcanza lo que da su movimiento).</p>`;
    h += onlListoYo()
      ? `<div class="btns"><button data-act="onl-reabrir">Cambiar mis órdenes</button></div>`
      : `<div class="btns"><button class="gold" data-act="end">Listo ▶</button></div>`;
  }
  const btn = [];
  if (cfg.modoTurno === "corr") btn.push(`<button data-act="onl-tr" ${todos && onlActivos(d).length > 1 ? "" : "disabled"} title="Todos deben estar conectados">Pasar a tiempo real</button>`);
  else btn.push(`<button data-act="onl-corr">Volver a correspondencia</button>`);
  btn.push(`<button data-act="onl-notif">Avisos del navegador</button>`);
  if (mio && onlEstSeat(d, ME) === "activo") btn.push(`<button class="red" data-act="onl-aband">Abandonar</button>`);
  if (mio && onlEstSeat(d, ME) !== "activo") btn.push(`<button class="gold" data-act="onl-ret">Retomar mi pueblo</button>`);
  h += `<div class="btns">${btn.join("")}</div>`;
  const O = onlS(),
    ult = (O.cron || []).filter((c) => c.t === d.turno - 1 && (c.f || []).includes(ME)).slice(0, 8);
  if (ult.length) h += `<h3>La estación pasada</h3><ul class="onl-res">${ult.map((c) => `<li class="${c.c || ""}">${esc(c.m)}</li>`).join("")}</ul>`;
  h += `<p class="stats">Estado guardado: ${Math.round((d.tam || 0) / 1024)} KB, comprimido ${Math.round((d.tamZ || 0) / 1024)} KB en ${d.partes || 1} trozo(s).</p>`;
  return h;
}
OC.accion(
  "onl",
  (v) => {
    const [k, a] = v.split(":");
    const d = ONL.meta,
      ref = net.on && net.db ? net.db.doc("partidas/" + net.id) : null;
    if (!d || !ref) return false;
    if (k === "q" && myTurn()) ONL.cola.splice(+a, 1);
    if (k === "ami") onlAmigoPedir(a).then(() => ui());
    if (k === "notif") onlPedirNotif();
    if (k === "reabrir" && d.fase === "ordenes") ref.update({ listos: { [ME]: -1 } });
    if (k === "tr") ref.update({ cfg: { modoTurno: "tr" }, limite: Math.min(d.limite || Infinity, onlAhora() + (d.cfg.trSeg || 90) * 1000), trT: d.turno });
    if (k === "corr") ref.update({ cfg: { modoTurno: "corr" }, limite: onlAhora() + (d.cfg.plazoH || 24) * 3600000 });
    if (k === "aband")
      modal("Abandonar la partida", "<p>Tu pueblo pasará a la IA y otro jugador podrá ocupar tu plaza. Podrás volver mientras nadie la tome.</p>", [
        { t: "Abandonar", cls: "red", v: 1 },
        { t: "Seguir jugando", v: 0 },
      ]).then((x) => x === 1 && ref.update({ est: { [ME]: "abandono" }, updated: onlAhora() }));
    if (k === "ret") onlRetomar();
    onlPresencia();
  },
  { libre: true },
);
function onlRetomar() {
  if (!ONL.meta || onlMiSeat(ONL.meta) !== ME) return;
  net.db.doc("partidas/" + net.id).update({ est: { [ME]: "activo" }, faltas: { [ME]: 0 }, updated: onlAhora() });
}
/* «Terminar mi turno» online = Listo: se envía la diferencia (no el estado entero) */
async function onlListo() {
  const d = ONL.meta;
  if (!G || !d || !ONL.base || d.fase !== "ordenes" || onlListoYo()) return;
  const env = onlEnvio(ONL.base, G, ME);
  env.turno = d.turno;
  env.uid = net.uid;
  env.ts = onlAhora();
  const z = onlLZc(JSON.stringify(env));
  if (z.length > 240000) {
    modal("Demasiados cambios", "<p>Las órdenes de esta estación no caben en un envío. Deshaz parte de ellas.</p>", [{ t: "Vale" }]);
    return;
  }
  try {
    await net.db.doc(`partidas/${net.id}/ordenes/${ME}`).set({ turno: d.turno, uid: net.uid, ts: env.ts, z, n: ONL.cola.length });
    await net.db.doc("partidas/" + net.id).update({ listos: { [ME]: d.turno }, visto: { [net.uid]: d.turno }, faltas: { [ME]: 0 }, updated: onlAhora() });
    ONL.enviado = d.turno;
    ONL.meta.listos = { ...(ONL.meta.listos || {}), [ME]: d.turno };
    onlCur();
    onlPresencia();
    onlTraza("listo", ME, d.turno, env.ops.length, "ops", env.ords.length, "ordenes");
    setTimeout(() => onlCerrar(), 300);
  } catch (e) {
    modal("No se envió el turno", "<p>Revisa tu conexión y vuelve a pulsar «Listo».</p>", [{ t: "Vale" }]);
  }
}
/* ¿se puede cerrar la estación? todos listos o plazo vencido (o batalla pendiente vencida) */
function onlPuedeCerrar(d) {
  if (!d || d.terminada || d.fase === "fin") return false;
  if (d.fase === "batalla") return !!d.batalla && onlAhora() > d.batalla.limite;
  const act = onlActivos(d);
  return onlAhora() > (d.limite || 0) || (act.length > 0 && act.every((f) => (d.listos || {})[f] === d.turno));
}
function onlCerrar() {
  const d = ONL.meta;
  if (!net.on || !d || ONL.resolviendo || ONL.cargando || busy || BT || !onlPuedeCerrar(d)) return;
  /* en tiempo real resuelve el anfitrión (si está); los demás esperan unos segundos */
  const esHost = d.host === net.uid || !onlConectado(d.host, net.id);
  if (!esHost && d.cfg && d.cfg.modoTurno === "tr") {
    ONL.esperaCierre = ONL.esperaCierre || onlAhora();
    if (onlAhora() - ONL.esperaCierre < 8000) return;
  }
  ONL.esperaCierre = 0;
  onlResolver();
}
/* reloj: cuenta atrás, envío automático en tiempo real, cierre por plazo */
function onlTick() {
  onlTitulo();
  if (!net.on || !ONL.meta || !G) return;
  const d = ONL.meta,
    cfg = d.cfg || {},
    resto = (d.limite || 0) - onlAhora(),
    el = $("onl-cuenta");
  if (el) el.textContent = onlFmtResto(resto);
  if (d.fase === "ordenes" && !busy && !BT) {
    const ti = $("tinfo");
    if (ti && cfg.modoTurno === "tr") ti.textContent = `Online · estación en tiempo real · ${onlFmtResto(resto)}${myTurn() ? "" : " · listo"}`;
    /* tiempo real con todos conectados: el anfitrión acorta el plazo */
    if (cfg.modoTurno === "tr" && d.host === net.uid && d.trT !== d.turno && resto > cfg.trSeg * 1000 + 3000) {
      const todos = onlActivos(d).every((f) => onlConectado(d.seats[f], net.id));
      if (todos) {
        d.trT = d.turno;
        net.db.doc("partidas/" + net.id).update({ limite: onlAhora() + cfg.trSeg * 1000, trT: d.turno });
      }
    }
    if (cfg.modoTurno === "tr" && myTurn() && resto < 1500 && resto > -5000 && ONL.autoListo !== d.turno) {
      ONL.autoListo = d.turno;
      endTurn();
    }
  }
  if ((ONL.tick = (ONL.tick || 0) + 1) % 3 === 0) onlCerrar();
}
setInterval(onlTick, 1000);

/* ---------- J. resolución de la estación (un solo cliente, con cerrojo) ---------- */
const ONL_SUSP = { onlSusp: true };
function onlInyectar(ords) {
  const orig = camResolverSimultaneo;
  let usado = false;
  camResolverSimultaneo = async function (g, o, opc) {
    if (!usado) {
      usado = true;
      camResolverSimultaneo = orig;
      o = (o || []).concat(ords);
    }
    return orig(g, o, opc);
  };
  return () => {
    camResolverSimultaneo = orig;
  };
}
async function onlResolver(op = {}) {
  if (ONL.resolviendo || !net.on || !ONL.meta) return;
  const id = net.id,
    ref = net.db.doc("partidas/" + id),
    lock = net.db.doc(`partidas/${id}/ctl/res`);
  let lk;
  for (let k = 0; k < (op.acudo || op.renuncio ? 4 : 1); k++) {
    try {
      lk = await lock.acquire({ holder: ONL.yo, ttlMs: 20000 });
    } catch (e) {
      return;
    }
    if (lk && lk.acquired) break;
    /* otro cliente lo tuvo hace poco: el cerrojo caduca solo */
    if (op.acudo || op.renuncio) await new Promise((r) => setTimeout(r, Math.min(21000, Math.max(500, Date.parse(lk.expiresAt) - Date.now() + 300 || 5000))));
  }
  if (!lk || !lk.acquired) return;
  let m;
  try {
    m = (await ref.get()).data();
  } catch (e) {
    return;
  }
  if (!m || m.ver !== ONL.ver) return; // aún no tengo el último estado
  const defiende = m.fase === "batalla" && m.batalla && m.batalla.d === net.uid && (op.acudo || op.renuncio);
  if (!defiende && !onlPuedeCerrar(m)) return;
  ONL.resolviendo = { turno: m.turno, meta: m, bats: {}, presentes: [], renuncio: !!op.renuncio };
  ONL.susp = null;
  busy = true;
  ui();
  const renov = setInterval(() => lock.acquire({ holder: ONL.yo, ttlMs: 20000 }).catch(() => {}), 7000);
  let restaurar = null,
    pub = false;
  try {
    const baseTxt = ONL.baseTxt && m.ver === ONL.ver ? ONL.baseTxt : await onlCargarEstado(id, m);
    const act = onlActivos(m),
      envs = [];
    for (const f of act) {
      try {
        const s = await net.db.doc(`partidas/${id}/ordenes/${f}`).get();
        if (s.exists && s.data().turno === m.turno && (m.listos || {})[f] === m.turno) {
          const e = JSON.parse(onlLZd(s.data().z));
          if (e && e.f === f) envs.push(e);
        }
      } catch (e) {
        console.error("[onl] envío", f, e);
      }
    }
    try {
      const bs = await net.db.collection(`partidas/${id}/batallas`).where("turno", "==", m.turno).get();
      for (const b of bs.docs) ONL.resolviendo.bats[b.id] = b.data();
    } catch (e) {}
    const presentes = envs.map((e) => e.f);
    ONL.resolviendo.presentes = presentes;
    G = onlFusionar(baseTxt, envs);
    G.human = presentes.slice();
    OC.emitirSync("partidaLista");
    for (const f of act)
      if (!presentes.includes(f)) onlCron([f], `Sin órdenes a tiempo: la IA gobernó ${CIV[f].s} esta estación.`, "bad");
    const ords = envs.flatMap((e) => (e.ords || []).map((o) => ({ ...o, f: e.f })));
    restaurar = onlInyectar(ords);
    onlTraza("resolver", m.turno, "envios", presentes.join(","), "ordenes", ords.length);
    const y0 = G.year;
    await finEstacion();
    restaurar();
    while (!ONL.susp && !G.over && G.year === y0 && G.estacion !== 0 && act.length && act.every((f) => camSaltar(f))) await finEstacion();
    if (ONL.susp) await onlSuspender(m);
    else {
      await onlPublicar(m, act, presentes);
      pub = true;
    }
  } catch (e) {
    if (e === ONL_SUSP || (ONL.susp && e && e.onlSusp)) await onlSuspender(m);
    else {
      console.error("[onl] resolver", e);
      onlTraza("resolver falla", e && (e.stack || e.message || e));
      modal("No se pudo cerrar la estación", "<p>Algo falló al resolverla. Se intentará de nuevo.</p>", [{ t: "Vale" }]);
    }
  } finally {
    if (restaurar) restaurar();
    clearInterval(renov);
    busy = false;
    const R0 = ONL.resolviendo;
    ONL.resolviendo = null;
    /* nada publicado: se vuelve al estado de partida (se recarga) */
    if (!pub && R0) ONL.ver = 0;
    if (G) ui();
    if (ONL.meta && net.on) onlMeta(ONL.meta);
  }
}
async function onlPublicar(m, act, presentes) {
  const id = net.id,
    t = m.turno + 1,
    ver = m.ver + 1,
    cfg = { ...ONL_CFG_DEF, ...(m.cfg || {}) };
  for (const l of G.log) if (l.t == null) l.t = m.turno;
  const O = onlS();
  O.turno = t;
  if (O.cron.length > 300) O.cron.length = 300;
  G.human = act.slice();
  const pk = onlEmpaquetar(G);
  await onlGuardarEstado(id, ver, pk);
  const faltas = {},
    est = {};
  for (const f of act) {
    if (presentes.includes(f)) faltas[f] = 0;
    else {
      faltas[f] = ((m.faltas || {})[f] || 0) + 1;
      if (faltas[f] >= cfg.faltasMax) est[f] = "ia";
    }
  }
  const todos = act.every((f) => onlConectado(m.seats[f], id)),
    upd = {
      ver,
      partes: pk.partes.length,
      tam: pk.tam,
      tamZ: pk.tamZ,
      turno: t,
      year: G.year,
      estacion: G.estacion || 0,
      fase: G.over ? "fin" : "ordenes",
      limite: onlLimite(cfg, todos),
      trT: cfg.modoTurno === "tr" && todos ? t : -1,
      updated: onlAhora(),
      batalla: null,
      faltas,
      est,
    };
  if (G.over) {
    upd.over = { win: G.over.win };
    upd.terminada = true;
  }
  await net.db.doc("partidas/" + id).update(upd);
  onlTraza("publicado", id, "turno", t, "ver", ver, "tam", pk.tam, "z", pk.tamZ, "partes", pk.partes.length);
  /* el que resuelve ya tiene el estado nuevo */
  ONL.meta = { ...m, ...upd, est: { ...(m.est || {}), ...est }, faltas: { ...(m.faltas || {}), ...faltas } };
  onlAdoptar(pk.txt, ONL.meta);
  if (m.ver > 1) onlBorrarEstado(id, m.ver - 1, m.partesPrev || m.partes);
  net.db.doc("partidas/" + id).update({ partesPrev: pk.partes.length }).catch(() => {});
  for (const b in ONL.resolviendo.bats)
    try {
      await net.db.doc(`partidas/${id}/batallas/${b}`).delete();
    } catch (e) {}
  for (const f of act)
    onlAviso(m.seats[f], "turno-" + id, {
      tipo: G.over ? "fin" : "turno",
      partida: id,
      nombre: m.name,
      texto: G.over ? "La partida ha terminado." : `Te toca: ${onlEstTxt(G.year, G.estacion)}.`,
    });
  onlEmitir(ONL.room, "onl.aviso", { partida: id, turno: t });
}
/* batalla con un amigo desconectado: la estación se detiene hasta que acuda o venza el plazo */
async function onlSuspender(m) {
  const S = ONL.susp,
    id = net.id;
  ONL.susp = null;
  if (!S) return;
  onlTraza("suspendida", S.bid, S.lugar);
  await net.db.doc(`partidas/${id}/batallas/${S.bid}`).set({ turno: m.turno, clave: S.clave, estado: "pendiente", a: S.a, d: S.d, fa: S.fa, fd: S.fd, lugar: S.lugar, limite: S.limite, s0: S.s0, d0: S.d0, ts: onlAhora() });
  await net.db.doc("partidas/" + id).update({
    fase: "batalla",
    batalla: { bid: S.bid, a: S.a, d: S.d, fa: S.fa, fd: S.fd, lugar: S.lugar, limite: S.limite, turno: m.turno },
    susp: { [m.turno]: 1 },
    updated: onlAhora(),
  });
  await onlAviso(S.d, "bat-" + id, {
    tipo: "batalla",
    partida: id,
    nombre: m.name,
    texto: `${CIV[S.fa].s} ataca a tus tropas en ${S.lugar}. Acude antes de ${onlFmtHora(S.limite)} o lucharán tus capitanes.`,
  });
  onlEmitir(ONL.room, "onl.aviso", { partida: id, batalla: S.bid });
}
function onlRecibirPing(m) {
  const d = m.data || {};
  if (m.sameTab) return;
  if (net.on && d.partida === net.id) return; // el documento de la partida ya avisa
  const g = ONL.mias.find((x) => x.id === d.partida);
  if (g) onlNotificar("Ocaso del Imperio", `Novedades en «${g.d.name}».`);
}

/* ---------- K. batallas entre jugadores ----------
   Reglas: si el otro humano está CONECTADO (amigo o desconocido) se le invita a dirigirla en vivo; si
   rechaza o no responde en cfg.invitSeg segundos, su lado lo lleva la IA en modo DIFÍCIL. Si NO está
   conectado: amigo → la estación se detiene y se le avisa (cfg.amigoMin minutos para acudir); desconocido
   (o plazo 0, o ya vencido) → IA difícil al momento. Quien resuelve es la autoridad de la batalla. */
function onlUidHumano(m, f) {
  if (!m || f == null || f >= NF) return null;
  const u = (m.seats || {})[f];
  return u && onlEstSeat(m, f) === "activo" ? u : null;
}
function onlInstalar() {
  if (typeof camLibrar === "function" && !camLibrar.onl) {
    const orig = camLibrar;
    const w = async function (ejA, ejD, bctx, o = {}) {
      if (net.on && ONL.resolviendo && bctx && !bctx.onlRes) {
        try {
          await onlPrepararBatalla(ejA, ejD, bctx, o);
        } catch (e) {
          if (e === ONL_SUSP) throw e;
          console.error("[onl] batalla", e);
        }
      }
      return orig(ejA, ejD, bctx, o);
    };
    w.onl = true;
    camLibrar = w;
  }
  if (typeof camOrdenUI === "function" && !camOrdenUI.onl) {
    const orig = camOrdenUI;
    const w = async function (o) {
      if (net.on && G && o && ONL_COLA.includes(o.tipo) && !ONL.resolviendo) {
        if (!myTurn()) return { ok: false };
        const r = onlEncolar(o);
        ui();
        return r;
      }
      return orig(o);
    };
    w.onl = true;
    camOrdenUI = w;
  }
  if (typeof camDibujar === "function" && !camDibujar.onl) {
    const orig = camDibujar;
    const w = function (now) {
      orig(now);
      if (net.on && G && ONL.cola.length) onlDibujarCola(now);
    };
    w.onl = true;
    camDibujar = w;
  }
}
/* las órdenes encoladas, sobre el mapa (líneas de puntos hasta el destino) */
function onlDibujarCola(now) {
  const c = ctx;
  c.save();
  c.setLineDash([2, 2]);
  c.lineWidth = 1;
  for (const o of ONL.cola) {
    const ej = o.ej != null ? camEj(o.ej) : null,
      p = o.p != null ? G.P[o.p] : null;
    let x0, y0, x1, y1;
    if (ej) {
      x0 = ej.x;
      y0 = ej.y;
    } else if (p) {
      x0 = p.x;
      y0 = p.y;
    } else continue;
    if (o.tipo === "mover") {
      x1 = o.x;
      y1 = o.y;
    } else if (p) {
      x1 = p.x;
      y1 = p.y;
    } else continue;
    c.strokeStyle = o.tipo === "mover" ? "rgba(242,193,78,.9)" : "rgba(255,90,74,.9)";
    c.beginPath();
    c.moveTo(x0 * T + 4, y0 * T + 4);
    c.lineTo(x1 * T + 4, y1 * T + 4);
    c.stroke();
    c.fillStyle = c.strokeStyle;
    c.fillRect(x1 * T + 2, y1 * T + 2, 4, 4);
  }
  c.restore();
}
async function onlPrepararBatalla(ejA, ejD, bctx, o) {
  const R0 = ONL.resolviendo,
    m = R0.meta,
    cfg = { ...ONL_CFG_DEF, ...(m.cfg || {}) },
    uA = onlUidHumano(m, ejA.f),
    uD = onlUidHumano(m, ejD.f);
  if (!uA || !uD || uA === uD || tot(ejD.u) <= 0 || tot(ejA.u) <= 0) return;
  const A = o.ejs && o.ejs[0],
    D = o.ejs && o.ejs[1],
    clave = `${m.turno}-${o.tipo || "campo"}-${A ? A.id : "c"}-${D ? D.id : "p" + (bctx.p ? bctx.p.id : "")}`,
    bid = "b" + onlHash(net.id + ":" + clave),
    s0 = JSON.stringify(cmbNorm({ ...ejA.u })),
    d0 = JSON.stringify(cmbNorm({ ...ejD.u })),
    prev = R0.bats[bid],
    lugar = bctx.nombreLugar || "campo abierto";
  if (prev && prev.res && prev.s0 === s0 && prev.d0 === d0) {
    bctx.onlRes = prev.res;
    return;
  }
  const lados = [uA, uD],
    ctrl = lados.map((u) => (u === net.uid ? "local" : onlConectado(u) ? "invitar" : "ausente")),
    dif = ["normal", "normal"],
    vencida = prev && prev.estado === "pendiente" && (onlAhora() > prev.limite || R0.renuncio);
  if (R0.renuncio && lados[1] === net.uid) ctrl[1] = "ausente";
  /* amigo desconectado: detener la estación (una vez por estación) */
  if (ctrl[1] === "ausente" && !vencida && !prev && cfg.amigoMin > 0 && !((m.susp || {})[m.turno]) && (await onlSonAmigos(uA, uD))) {
    ONL.susp = { bid, clave, a: uA, d: uD, fa: ejA.f, fd: ejD.f, lugar, limite: onlAhora() + cfg.amigoMin * 60000, s0, d0 };
    throw ONL_SUSP;
  }
  const inv = [0, 1].filter((s) => ctrl[s] === "invitar");
  if (inv.length) {
    const ok = await onlInvitar(bid, inv.map((s) => lados[s]), { lugar, fa: ejA.f, fd: ejD.f, lados, limiteMs: cfg.invitSeg * 1000 });
    for (const s of inv) ctrl[s] = ok[lados[s]] ? "remoto" : "ausente";
  }
  for (const s of [0, 1])
    if (ctrl[s] === "ausente") {
      ctrl[s] = "ia";
      dif[s] = "dificil";
    }
  let res,
    tact = false,
    modo = cfg.modoBatalla || "t3";
  if (ctrl.includes("remoto") || ctrl.includes("local")) {
    if (!ctrl.includes("remoto")) {
      const yo = ctrl.indexOf("local"),
        pr = Math.round(cmbEstimar(ejA, ejD, { ...bctx, dificultad: dif }, 10) * 100),
        mio = yo === 0 ? pr : 100 - pr;
      modo = await modal(
        `Batalla en ${esc(lugar)}`,
        `<p>${camTxtEj(ejA)}<br>contra ${camTxtEj(ejD)}.</p><p>${esc(onlNombre(lados[1 - yo]))} no dirige la batalla: sus capitanes luchan con <b>IA difícil</b>. Tus capitanes la ven ${mio >= 70 ? "favorable" : mio >= 45 ? "incierta" : "desfavorable"} (≈${mio}%).</p>`,
        [
          { t: "Por turnos · 3 acciones", v: "t3", cls: "gold" },
          { t: "Por turnos · 1 acción", v: "t1", cls: "gold" },
          { t: "Tiempo real", v: "rt", cls: "gold" },
          { t: "Resolución automática", v: "auto" },
        ],
      );
    }
    if (modo !== "auto") {
      res = await onlBatallaVivo(bid, ejA, ejD, bctx, ctrl, dif, modo, lados);
      tact = true;
    }
  }
  if (!res) res = cmbResolverAuto(ejA, ejD, { ...bctx, dificultad: dif });
  if (tact) o.sinInforme = true;
  bctx.onlRes = res;
  const txt = `${CIV[ejA.f].s} contra ${CIV[ejD.f].s} en ${lugar}: ${res.gana === 0 ? "vence " + CIV[ejA.f].s : "resiste " + CIV[ejD.f].s} (${ctrl.map((c, i) => `${CIV[[ejA.f, ejD.f][i]].s}: ${c === "ia" ? (dif[i] === "dificil" ? "IA difícil" : "IA") : "en persona"}`).join(", ")}).`;
  onlCron([ejA.f, ejD.f], txt, "");
  onlTraza("batalla", bid, ctrl.join("/"), dif.join("/"), "gana", res.gana);
  R0.ultBatalla = { bid, ctrl, dif, gana: res.gana, lugar };
  try {
    await net.db.doc(`partidas/${net.id}/batallas/${bid}`).set({
      turno: m.turno,
      clave,
      estado: "fin",
      a: uA,
      d: uD,
      fa: ejA.f,
      fd: ejD.f,
      lugar,
      s0,
      d0,
      ctrl,
      dif,
      res: onlClon(res),
      ts: onlAhora(),
    });
  } catch (e) {}
}
/* invitación en vivo por el vestíbulo; respuesta en cfg.invitSeg o se entiende que no */
async function onlInvitar(bid, uids, info) {
  const limite = onlAhora() + info.limiteMs;
  for (const u of uids) {
    delete ONL.resp[bid + u];
    onlEmitir(ONL.room, "onl.inv", { para: u, bid, partida: net.id, nombre: ONL.meta.name, lugar: info.lugar, fa: info.fa, fd: info.fd, lado: info.lados.indexOf(u), de: net.uid, limite });
    onlAviso(u, "bat-" + net.id, { tipo: "batalla", partida: net.id, nombre: ONL.meta.name, texto: `Batalla en ${info.lugar}: ¿la diriges en persona?` });
  }
  const ok = {};
  ONL.esperaInv = { bid, limite };
  ui();
  while (onlAhora() < limite && uids.some((u) => ONL.resp[bid + u] == null)) await new Promise((r) => setTimeout(r, 250));
  ONL.esperaInv = null;
  for (const u of uids) ok[u] = ONL.resp[bid + u] === true;
  return ok;
}
function onlRecibirInvitacion(m) {
  const d = onlRecomponer(m);
  if (!d || d.para !== net.uid || m.isMe && m.sameTab) return;
  if (onlAhora() > d.limite) return;
  ONL.inv = { ...d, desde: m.peer };
  onlNotificar("¡Batalla!", `Te atacan en ${d.lugar}: ¿la diriges en persona?`);
  onlMostrarInvitacion();
}
function onlMostrarInvitacion() {
  const d = ONL.inv;
  if (!d) return onlCapa(null, "", "onl-inv");
  const resto = d.limite - onlAhora();
  if (resto <= 0) {
    ONL.inv = null;
    return onlCapa(null, "", "onl-inv");
  }
  onlCapa(
    "¡Batalla!",
    `<p>${esc(onlNombre(d.de))} resuelve la estación en «${esc(d.nombre || "")}»: ${esc(CIV[d.fa]?.s || "")} contra ${esc(CIV[d.fd]?.s || "")} en <b>${esc(d.lugar)}</b>.</p><p>¿Diriges a tus tropas en persona? Si no, tus capitanes lucharán (IA difícil).</p><p class="stats">Quedan <span id="onl-inv-t">${Math.ceil(resto / 1000)}</span> s</p><div class="btns"><button class="gold" data-act="s-onlinv-si">Luchar en persona</button><button data-act="s-onlinv-no">Que luchen mis capitanes</button></div>`,
    "onl-inv",
    true,
  );
  clearTimeout(ONL.invT);
  ONL.invT = setTimeout(onlMostrarInvitacion, 1000);
}
async function onlResponderInvitacion(si) {
  const d = ONL.inv;
  ONL.inv = null;
  clearTimeout(ONL.invT);
  onlCapa(null, "", "onl-inv");
  if (!d) return;
  onlEmitir(ONL.room, "onl.resp", { bid: d.bid, ok: !!si, uid: net.uid, para: d.de });
  if (!si) return;
  /* entrar en la partida si no estaba (para nombres y crónica) y abrir el espejo de la batalla */
  if (!net.on || net.id !== d.partida) {
    const g = [...ONL.mias, ...ONL.invitadas].find((x) => x.id === d.partida);
    const f = g ? onlMiSeat(g.d) : null;
    if (f != null) onlEntrar(d.partida, f);
  }
  onlEspejoUnir(d.bid, d.lado);
}
function onlRecibirRespuesta(m) {
  const d = onlRecomponer(m);
  if (!d || !d.bid) return;
  const uid = m.by || d.uid;
  ONL.resp[d.bid + uid] = !!d.ok;
}
const onlSalaNom = (bid) => ("b-" + onlHash(String(net.id) + bid) + bid).toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 40);
async function onlUnirSala(bid) {
  if (!ONL.room || !ONL.room.join) return null;
  try {
    return await ONL.room.join(onlSalaNom(bid));
  } catch (e) {
    onlTraza("sala falla", e && e.code);
    return null;
  }
}
/* ---- autoridad: quien resuelve corre la simulación; los remotos mandan sus planes ---- */
async function onlBatallaVivo(bid, ejA, ejD, bctx, ctrl, dif, modo, lados) {
  const remotos = [0, 1].filter((s) => ctrl[s] === "remoto");
  let sala = null;
  if (remotos.length) {
    sala = await onlUnirSala(bid);
    if (!sala) remotos.forEach((s) => ((ctrl[s] = "ia"), (dif[s] = "dificil")));
  }
  const jugador = ctrl[1] === "local" ? 1 : undefined,
    map = jugador === 1 ? [1, 0] : [0, 1],
    cf = [ctrl[map[0]], ctrl[map[1]]],
    ladoCampo = {};
  lados.forEach((u, i) => (ladoCampo[u] = map.indexOf(i)));
  const O = onlAutoridad(bid, sala, cf, ladoCampo, lados, map);
  if (sala) {
    /* esperar a que los espejos digan «hola» (máx. 30 s) */
    const t0 = onlAhora();
    while (onlAhora() - t0 < 30000 && remotos.some((s) => !O.hola[lados[s]])) await new Promise((r) => setTimeout(r, 200));
    for (const s of remotos)
      if (!O.hola[lados[s]]) {
        cf[map.indexOf(s)] = "ia";
        dif[s] = "dificil";
      }
  }
  const ctx = { ...bctx, dificultad: dif, jugador, onl: cf.includes("remoto") || cf[0] !== "local" ? O : null };
  delete ctx.onlRes;
  ONL.batalla = O;
  try {
    return await cmbTactica(ejA, ejD, ctx, modo);
  } finally {
    ONL.batalla = null;
    O.cerrar();
  }
}
function onlAutoridad(bid, sala, ctrl, ladoCampo, lados, map) {
  const O = {
    bid,
    sala,
    ctrl,
    lados,
    map,
    ladoCampo,
    planes: [null, null],
    faltas: [0, 0],
    hola: {},
    esperaMs: 60000,
    ult: 0,
    unsub: null,
    inicio(B) {
      O.B = B;
      O.enviarIni();
      if (ctrl[0] !== "local") {
        deploy(0, true);
        battleAct("go");
        if (B.mode !== "rt") setTimeout(executeTurn, 150);
      }
    },
    enviarIni() {
      if (!sala || !BT) return;
      const u = BT.units.map((x) => {
        const o = { ...x };
        delete o.hm;
        delete o._morPrev;
        return o;
      });
      onlEmitir(sala, "onl.b", {
        k: "ini",
        bid,
        lados: ladoCampo,
        mode: BT.mode,
        lim: BT.lim,
        place: BT.place,
        env: BT.env,
        fort: BT.fort,
        def: BT.def,
        fa: BT.fa,
        fd: BT.fd,
        terr: BT.terr.map((r) => r.join("")).join("|"),
        units: u,
        gens: BT.gens,
        gb: BT.gb,
        init: BT.init,
        bono: BT.bono,
        muro: BT.muro,
        turn: BT.turn,
        t: BT.t,
        phase: BT.phase,
        log: BT.log.slice(0, 8),
        ejf: [BT.ejs[0].f, BT.ejs[1].f],
      });
    },
    listoTurno() {
      const B = BT,
        falta = [0, 1].filter((s) => ctrl[s] === "remoto" && !(O.planes[s] && O.planes[s].turn === B.turn));
      if (falta.length) {
        B.onlMsg = "Esperando las órdenes del rival…";
        O.esperando = true;
        if (!O.espT)
          O.espT = setTimeout(() => {
            O.espT = null;
            if (!BT || BT !== B) return;
            for (const s of falta)
              if (!(O.planes[s] && O.planes[s].turn === B.turn)) {
                O.planes[s] = { turn: B.turn, ia: true };
                if (++O.faltas[s] >= 3) ctrl[s] = "ia";
                bLog("El rival no responde: sus capitanes deciden este turno.");
              }
            executeTurn();
          }, O.esperaMs);
        bui();
        return false;
      }
      clearTimeout(O.espT);
      O.espT = null;
      O.esperando = false;
      B.onlMsg = "";
      for (const s of [0, 1]) {
        if (ctrl[s] !== "remoto") continue;
        const P = O.planes[s];
        if (!P || P.ia) aiOrders(s);
        else O.aplicar(s, P);
      }
      return true;
    },
    aplicar(s, P) {
      for (const [id, plan] of P.u || []) {
        const u = bU(id);
        if (!u || u.side !== s || !Array.isArray(plan)) continue;
        plan.forEach((p, i) => {
          if (!u.plan[i] || !p) return;
          u.plan[i].st = p.st === "def" ? "def" : "agr";
          const q = p.o;
          u.plan[i].o = !q ? null : q.tg != null ? (bU(q.tg) ? { tg: q.tg } : null) : { x: clamp(+q.x || 0, 0.5, BW - 0.5), y: clamp(+q.y || 0, 0.5, BH - 0.5) };
        });
      }
      for (const [id, h] of P.hab || []) {
        const u = bU(id);
        if (u && u.side === s && cmbHabPuede(u, h)) cmbHabUsar(u, h, BTB);
      }
    },
    recibir(msg) {
      const d = onlRecomponer(msg);
      if (!d || d.bid !== bid) return;
      const uid = msg.by || d.uid,
        s = ladoCampo[uid];
      if (d.k === "hola") {
        O.hola[uid] = true;
        if (BT) O.enviarIni();
        return;
      }
      if (s == null || ctrl[s] !== "remoto" || !BT) return;
      if (d.k === "plan") {
        if (BT.mode === "rt") O.aplicar(s, d);
        else {
          O.planes[s] = { ...d, turn: d.turn };
          if (O.esperando && !BT.run) executeTurn();
        }
      }
      if (d.k === "hab") O.aplicar(s, { hab: d.hab });
      if (d.k === "huir") finishBattle(s === 1, true);
      if (d.k === "cap") {
        ctrl[s] = d.on ? "ia" : "remoto";
        bLog(d.on ? "El rival delega en sus capitanes." : "El rival retoma el mando.");
        if (O.esperando && d.on) executeTurn();
      }
    },
    estado(fin) {
      if (!sala || !BT) return;
      const now = Date.now();
      if (!fin && now - O.ult < 250) return;
      O.ult = now;
      onlEmitir(sala, "onl.b", onlFoto(bid, fin));
    },
    fin(res) {
      if (!sala) return;
      onlEmitir(sala, "onl.b", { k: "fin", bid, gana: res.gana, informe: res.informe, lados: ladoCampo, map });
    },
    cerrar() {
      clearTimeout(O.espT);
      if (O.unsub) O.unsub();
      if (sala) setTimeout(() => sala.leave().catch(() => {}), 3000);
    },
  };
  if (sala) O.unsub = sala.on("onl.b", (m) => O.recibir(m));
  return O;
}
/* foto compacta del campo: [id, x, y, cara, n, heridos, muertos, moral, moralMax, cansancio, munición, banderas, postura, desbocados, habilidades] */
function onlFoto(bid, fin) {
  const B = BT,
    u = B.units.map((x) => [
      x.id,
      Math.round(x.x * 100),
      Math.round(x.y * 100),
      x.face,
      Math.round(x.n),
      Math.round(x.her || 0),
      Math.round(x.muertos || 0),
      Math.round(x.mor * 10),
      Math.round(x.morMax * 10),
      Math.round(x.fat),
      x.ammo,
      (x.rout ? 1 : 0) | (x.gone ? 2 : 0) | (x.eng ? 4 : 0) | (x.flk ? 8 : 0),
      x.st === "def" ? 1 : 0,
      x.desb > 0 ? Math.round(x.desb * 10) : 0,
      (x.hab || []).map((h) => [Math.round((h.t || 0) * 10), Math.round((h.cd || 0) * 10), Math.round((h.b || 0) * 10), h.n || 0]),
    ]),
    o = { k: "est", bid, turn: B.turn, t: Math.round(B.t * 10), run: !!B.run, phase: B.phase, muro: B.muro ? B.muro.hp : null, rota: B.muro ? !!B.muro.rota : false, gok: B.gens.map((g) => g.ok), log: B.log.slice(0, 6), u };
  if (fin) o.planes = B.units.map((x) => [x.id, x.plan.map((p) => ({ st: p.st, o: p.o }))]);
  return o;
}
/* ---- espejo: el jugador remoto ve el campo (girado para que sus tropas estén a la izquierda) y manda planes ---- */
async function onlEspejoUnir(bid, ladoEj) {
  const sala = await onlUnirSala(bid);
  if (!sala) return;
  const E = { bid, sala, ladoEj, ok: false, un: null };
  ONL.espejo = E;
  E.un = sala.on("onl.b", (m) => {
    const d = onlRecomponer(m);
    if (!d || d.bid !== bid) return;
    if (d.k === "ini" && !E.ok) onlEspejoIni(E, d);
    else if (d.k === "est" && E.ok) onlEspejoFoto(E, d);
    else if (d.k === "fin" && E.ok) onlEspejoFin(E, d);
  });
  const hola = () => {
    if (E.ok || ONL.espejo !== E) return;
    onlEmitir(sala, "onl.b", { k: "hola", bid, uid: net.uid });
    setTimeout(hola, 1500);
  };
  hola();
}
const onlFx = (E, x) => (E.flip ? BW - x : x);
function onlEspejoIni(E, d) {
  const sAut = d.lados[net.uid];
  if (sAut == null) return;
  E.ok = true;
  E.sAut = sAut;
  E.flip = sAut === 1;
  const fl = (s) => (E.flip ? 1 - s : s),
    terr0 = d.terr.split("|").map((r) => r.split("").map(Number)),
    terr = E.flip ? terr0.map((r) => r.slice().reverse()) : terr0,
    def = fl(d.def),
    bg = document.createElement("canvas");
  bg.width = BW * TS;
  bg.height = BH * TS;
  paintField(bg.getContext("2d"), terr, d.fort, def);
  const units = d.units.map((u) => {
    const o = { ...u, side: fl(u.side), x: onlFx(E, u.x), face: E.flip ? -u.face : u.face };
    o.plan = (u.plan || []).map((p) => ({ st: p.st, o: p.o ? (p.o.tg != null ? { tg: p.o.tg } : { x: onlFx(E, p.o.x), y: p.o.y }) : null }));
    return o;
  });
  const sw = (a) => (E.flip ? [a[1], a[0]] : a);
  BT = {
    bg,
    dead: [],
    fa: E.flip ? d.fd : d.fa,
    fd: E.flip ? d.fa : d.fd,
    fort: d.fort,
    def,
    map: [0, 1],
    ejs: [{ f: E.flip ? d.fd : d.fa }, { f: E.flip ? d.fa : d.fd }],
    env: d.env,
    lim: d.lim,
    place: d.place,
    ctx: {},
    terr,
    units,
    mode: d.mode,
    phase: "plan",
    turn: d.turn,
    sel: units.find((u) => !u.side)?.id ?? null,
    slot: 0,
    log: [{ m: "Diriges a tus tropas en persona. Planea y pulsa «Ejecutar turno»: la batalla avanza cuando los dos estéis listos.", c: "good" }],
    fx: [],
    tal: [{}, {}],
    hitos: [],
    ult: [0, 0],
    dichos: {},
    t: d.t,
    tH: 0,
    run: false,
    paused: false,
    speed: 1,
    gb: sw(d.gb),
    gens: sw(d.gens),
    muro: d.muro ? { ...d.muro, x: onlFx(E, d.muro.x) } : null,
    habT: 0,
    bono: sw(d.bono),
    auto0: false,
    init: sw(d.init),
    done: () => {},
    aiT: 0,
    espejo: E,
    sels: [],
    atk: false,
  };
  BT.sels = BT.sel == null ? [] : [BT.sel];
  E.habs = [];
  E.ultPlan = "";
  $("battle").classList.add("show");
  music("battle");
  bui();
  if (BT.mode === "rt") E.rtT = setInterval(() => onlEspejoPlanRT(E), 400);
  onlTraza("espejo ini", E.bid, "flip", E.flip);
}
function onlEspejoPlanes(E) {
  return BT.units.filter((u) => !u.side).map((u) => [u.id, u.plan.map((p) => ({ st: p.st, o: p.o ? (p.o.tg != null ? { tg: p.o.tg } : { x: onlFx(E, p.o.x), y: p.o.y }) : null }))]);
}
function onlEspejoEnviar(E) {
  if (!BT || BT.espejo !== E || BT.run) return;
  onlEmitir(E.sala, "onl.b", { k: "plan", bid: E.bid, uid: net.uid, turn: BT.turn, u: onlEspejoPlanes(E), hab: E.habs });
  E.habs = [];
  BT.run = true;
  BT.onlMsg = "Órdenes enviadas: esperando al rival…";
  bui();
}
function onlEspejoPlanRT(E) {
  if (!BT || BT.espejo !== E) return clearInterval(E.rtT);
  const u = onlEspejoPlanes(E),
    s = JSON.stringify(u);
  if (s === E.ultPlan && !E.habs.length) return;
  E.ultPlan = s;
  onlEmitir(E.sala, "onl.b", { k: "plan", bid: E.bid, uid: net.uid, turn: -1, u, hab: E.habs });
  E.habs = [];
}
function onlEspejoAccion(a, x) {
  const E = BT && BT.espejo;
  if (!E) return false;
  if (a === "exec") onlEspejoEnviar(E);
  else if (a === "go") {
    /* sin despliegue: el campo ya está formado */
  } else if (a === "flee") onlEmitir(E.sala, "onl.b", { k: "huir", bid: E.bid, uid: net.uid });
  else if (a === "cap") {
    BT.auto0 = !BT.auto0;
    onlEmitir(E.sala, "onl.b", { k: "cap", bid: E.bid, uid: net.uid, on: BT.auto0 });
    bLog(BT.auto0 ? "Delegas el mando en tus capitanes." : "Retomas el mando de tus tropas.");
  } else if (a === "hab") {
    const us = selU().filter((o) => cmbHabPuede(o, x));
    us.forEach((o) => E.habs.push([o.id, x]));
    bLog(us.length ? "Orden de habilidad dada." : "La habilidad aún no está lista.");
    if (BT.mode === "rt" && us.length) onlEspejoPlanRT(E);
  } else if (a === "pause" || a === "spd") bLog("El ritmo lo lleva quien resuelve la estación.");
  else return false;
  bui();
  return true;
}
function onlEspejoFoto(E, d) {
  if (!BT || BT.espejo !== E) return;
  const now = performance.now();
  for (const r of d.u) {
    const u = bU(r[0]);
    if (!u) continue;
    const x = onlFx(E, r[1] / 100),
      y = r[2] / 100;
    if (Math.abs(x - u.x) > 0.02 || Math.abs(y - u.y) > 0.02) u.mvT = now;
    if (r[4] < u.n) u.fT = now;
    u.x = x;
    u.y = y;
    u.face = E.flip ? -r[3] : r[3];
    u.n = r[4];
    u.her = r[5];
    u.muertos = r[6];
    u.mor = r[7] / 10;
    u.morMax = r[8] / 10;
    u.fat = r[9];
    u.ammo = r[10];
    u.rout = !!(r[11] & 1);
    u.gone = !!(r[11] & 2);
    u.eng = r[11] & 4 ? 1 : 0;
    u.flk = r[11] & 8 ? 1 : 0;
    u.st = r[12] ? "def" : "agr";
    u.desb = r[13] / 10;
    (r[14] || []).forEach((h, i) => {
      if (!u.hab || !u.hab[i]) return;
      u.hab[i].t = h[0] / 10;
      u.hab[i].cd = h[1] / 10;
      u.hab[i].b = h[2] / 10;
      u.hab[i].n = h[3];
    });
  }
  if (BT.muro && d.muro != null) {
    BT.muro.hp = d.muro;
    BT.muro.rota = d.rota;
  }
  BT.gens.forEach((g, i) => (g.ok = d.gok[E.flip ? 1 - i : i]));
  BT.t = d.t / 10;
  const otraTanda = d.turn !== BT.turn;
  BT.turn = d.turn;
  if (d.planes) {
    for (const [id, pl] of d.planes) {
      const u = bU(id);
      if (u) u.plan = pl.map((p) => ({ st: p.st, o: p.o ? (p.o.tg != null ? { tg: p.o.tg } : { x: onlFx(E, p.o.x), y: p.o.y }) : null }));
    }
    BT.run = false;
    BT.onlMsg = "";
    BT.slot = 0;
  } else if (BT.mode !== "rt" && d.run) {
    BT.run = true;
    BT.onlMsg = "";
  }
  if (otraTanda) BT.slot = 0;
  const tr = (s) => (E.flip ? s.replace(/\bTus\b/g, "Los").replace(/\btus\b/g, "sus") : s);
  const nuevos = (d.log || []).filter((l) => !BT.log.some((x) => x.m === tr(l.m))).reverse();
  for (const l of nuevos) bLog(tr(l.m), E.flip ? (l.c === "good" ? "bad" : l.c === "bad" ? "good" : l.c) : l.c);
  E.ultFoto = Date.now();
  bui();
}
function onlEspejoFin(E, d) {
  clearInterval(E.rtT);
  if (E.un) E.un();
  ONL.espejo = null;
  setTimeout(() => E.sala.leave().catch(() => {}), 1000);
  if (BT && BT.espejo === E) {
    BT = null;
    $("battle").classList.remove("show");
    music("camp");
  }
  /* lado del espejo en ejA/ejD */
  const yo = d.map[d.lados[net.uid]];
  onlTraza("espejo fin", E.bid, "gana", d.gana, "yo", yo);
  ONL.ultEspejo = { bid: E.bid, gana: d.gana, yo };
  if (d.informe) modal(d.gana === yo ? `Victoria en ${esc(d.informe.lugar || "")}` : `Derrota en ${esc(d.informe.lugar || "")}`, cmbInfHtml(d.informe, yo), [{ t: "Continuar", cls: "gold" }]);
}

/* ---------- L. crónica personal de la partida (para «mientras no estabas») ---------- */
function onlCron(fs, m, c = "") {
  if (!G || !net.on) return;
  const O = onlS();
  if (!O) return;
  O.cron = O.cron || [];
  O.cron.unshift({ t: ONL.resolviendo ? ONL.resolviendo.turno : O.turno, a: G.year, e: G.estacion || 0, f: [...new Set(fs.filter((f) => f != null && f < NF))], m, c });
  if (O.cron.length > 300) O.cron.length = 300;
}
const onlHum = (f) => ONL.resolviendo && f != null && f < NF && !!onlUidHumano(ONL.resolviendo.meta, f);
OC.on("batallaResuelta", (x) => {
  if (!ONL.resolviendo || !(onlHum(x.atacante) || onlHum(x.defensor))) return;
  if (ONL.resolviendo.ultBatalla && onlHum(x.atacante) && onlHum(x.defensor)) return; // ya anotada
  const p = x.p && x.p.name ? x.p.name : x.p != null && G.P[x.p] ? G.P[x.p].name : "campo abierto",
    a = CIV[x.atacante]?.s || "?",
    d = CIV[x.defensor]?.s || "?";
  onlCron([x.atacante, x.defensor], `${x.gana ? a + " vence a " + d : d + " rechaza a " + a} en ${p}.`, "");
});
OC.on("conquista", (x) => {
  if (!ONL.resolviendo || !(onlHum(x.de) || onlHum(x.a))) return;
  const p = typeof x.p === "object" ? x.p : G.P[x.p];
  onlCron([x.de, x.a], `${CIV[x.a]?.s || "?"} toma ${p ? p.name : "una ciudad"}${x.de != null && CIV[x.de] ? " a " + CIV[x.de].s : ""}.`, "");
});
for (const [ev, tx] of [
  ["guerraDeclarada", (a, b) => `${a} declara la guerra a ${b}.`],
  ["pazFirmada", (a, b) => `${a} y ${b} firman la paz.`],
  ["alianzaSellada", (a, b) => `${a} y ${b} sellan una alianza.`],
])
  OC.on(ev, (x) => {
    if (!ONL.resolviendo || !(onlHum(x.a) || onlHum(x.b))) return;
    onlCron([x.a, x.b], tx(CIV[x.a]?.s || "?", CIV[x.b]?.s || "?"), "");
  });
OC.on("revuelta", (x) => {
  if (!ONL.resolviendo || !onlHum(x.de)) return;
  const p = typeof x.p === "object" ? x.p : G.P[x.p];
  onlCron([x.de], `${p ? p.name : "Una provincia"} se subleva.`, "bad");
});
OC.on("sucesion", (x) => {
  if (!ONL.resolviendo || !onlHum(x.f)) return;
  onlCron([x.f], `${x.nuevo ? x.nuevo.n : "Un heredero"} sucede a ${x.anterior ? x.anterior.n : "su predecesor"}.`, "");
});
OC.on("crisisEconomica", (x) => {
  if (!ONL.resolviendo || !onlHum(x.f)) return;
  onlCron([x.f], `Crisis: ${x.tipo}.`, "bad");
});

/* ---------- M. arranque ---------- */
onlInstalar();
(async () => {
  try {
    if (typeof claude === "undefined" || !claude.use) return;
    const [db, user, room] = await Promise.all([claude.use("db"), claude.use("user"), claude.use("room")]);
    if (!net.db) net.db = db;
    if (!net.user) net.user = user;
    if (user && !net.uid) net.uid = await user.id();
    ONL.yo = (net.uid || "anon") + ":" + Math.random().toString(36).slice(2, 8);
    if (room) onlRoomIni(room);
    if (net.db && net.uid) onlSuscribirUsuario();
    if (ST.view === "home" || ST.view === "lobby") renderStart();
  } catch (e) {
    console.error("[onl] arranque", e);
  }
})();
