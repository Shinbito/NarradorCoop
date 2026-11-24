/* ---------- ejércitos en el mapa: marcha, campamento, asedio, encuentros ---------- Sistema CAMPAÑA
   Un ejército es una entidad del mapa (G.cam.ej) que ocupa una CASILLA (x, y) de MAP.grid. Las guarniciones
   siguen en p.u; un ejército se forma sacando tropas de una provincia y se disuelve dentro de una propia.
   Turno = estación (G.estacion 0..3). Todo cambio se expresa como ORDEN serializable aplicada por
   camAplicarOrden(G, orden) (ver docs/campana.md); camResolverSimultaneo(G, órdenes) resuelve las de
   varios bandos a la vez, paso a paso, decidiendo quién llega antes a cada casilla. */

const CAM_EST = ["Primavera", "Verano", "Otoño", "Invierno"];
const CAM_EST_DE = ["la primavera", "el verano", "el otoño", "el invierno"];
/* números del sistema (documentados en docs/campana.md) */
const CAM_K = {
  pts: 4, // puntos de marcha por estación = UN[t].mv (de la clase más lenta) × pts
  gen: 0.3, // + mando del general × gen
  invierno: 0.6, // en invierno se anda un 40 % menos
  calzadas: 0.7, // coste en tierra propia o aliada con Calzadas (tecnología «vias»)
  ajeno: 1.25, // coste en tierra ajena (sin caminos conocidos ni guías)
  terr: [Infinity, 1, 2, 2.5], // mar, llanura, bosque, colinas
  vado: 0.5, // + en llanuras de provincias con río
  diag: 1.41,
  sumMax: 3, // estaciones de víveres que carga un ejército
  fortCampo: 0.6, // el campamento fortificado cuenta como murallas de nivel 0,6
  fatPaso: 2.2, // cansancio por punto de marcha
  desHambre: 0.08, // deserción por estación sin víveres
  desInvierno: 0.04, // desgaste por invernar fuera de tierra propia (la mitad acampado)
  maxEj: 3, // ejércitos de la IA a la vez (más con muchas provincias)
  emboscada: 1.2, // bono de daño del que sale de un bosque contra quien no lo veía
};
/* máquinas de asedio: se construyen in situ durante un asedio (estaciones, coste, efecto en el asalto) */
const CAM_MAQ = {
  ari: { n: "Ariete", pl: "arietes", est: 1, coste: { madera: 14, oro: 4 }, max: 2, fort: 1 },
  tor: { n: "Torre de asedio", pl: "torres", est: 2, coste: { madera: 26, oro: 8 }, max: 2, fort: 0.75 },
  cat: { n: "Catapulta", pl: "catapultas", est: 2, coste: { madera: 18, hierro: 3, oro: 10 }, max: 3, fort: 0.4, brecha: 0.25, bomb: 0.03 },
};
let camSel = null, // ejército seleccionado por el jugador (id)
  camVer = 1, // cambia con cada movimiento (cachés de alcance)
  camHov = -1; // casilla bajo el ratón

/* ---------- estado ---------- */
function camS() {
  if (!G) return { ej: [], as: {}, saq: {}, sig: 1 };
  const S = OC.estado("cam", () => ({ v: 1, sig: 1, ej: [], as: {}, saq: {}, rapido: true }));
  S.ej = S.ej || [];
  S.as = S.as || {};
  S.saq = S.saq || {};
  S.sig = S.sig || 1;
  if (S.rapido === undefined) S.rapido = true;
  if (G.estacion == null) G.estacion = 0;
  return S;
}
/* ---------- repetición de la estación (CONTRATO §9) ----------
   G.cam.rep = {v:1, anio, est, own0, ej0, pasos} se abre al empezar la resolución (camEstacion) y se cierra
   al acabar camNuevaEstacion (incluye lo anual: revueltas y conquistas). Pasos: mov, ej+, ej-, bat, ase, con. */
const CAM_REP_TOPE = 2000;
function camRepIni() {
  const S = camS();
  S.rep = {
    v: 1,
    anio: G.year,
    est: G.estacion,
    own0: G.P.map((p) => p.owner),
    ej0: S.ej.filter((e) => camTot(e.u) > 0).map((e) => ({ id: e.id, f: e.f, x: e.x, y: e.y, n: camTot(e.u) })),
    pasos: [],
  };
}
function camRep(o) {
  const r = G && G.cam && G.cam.rep;
  if (!r || r.fin) return;
  /* niebla: vh = jugadores humanos que llegan a ver el paso (la repetición de cada uno solo muestra esos) */
  if (typeof camNieblaOn === "function" && camNieblaOn() && G.human && ["mov", "ej+", "bat", "esp", "esp-"].includes(o.k)) {
    const e = o.ej != null ? camEj(o.ej) : null;
    o.vh = G.human.filter(
      (h) =>
        h < NF &&
        ((o.f != null && camSocio(h, o.f)) ||
          (o.k === "mov" && ((e && camVeEj(h, e)) || camVisible(h, o.de[0], o.de[1]))) ||
          (o.k === "ej+" && e && camVeEj(h, e)) ||
          (o.k === "bat" && (camVisible(h, o.x, o.y) || (o.fs || []).some((f) => camSocio(h, f))))),
    );
  }
  const P = r.pasos;
  if (P.length >= CAM_REP_TOPE && o.k === "mov") {
    /* pasado el tope, los pasos de marcha de un ejército se resumen en uno (su último tramo) */
    for (let i = P.length - 1; i >= Math.max(0, P.length - 400); i--) {
      const q = P[i];
      if (q.k === "mov" && q.ej === o.ej) {
        q.a = o.a;
        return;
      }
      if (q.ej === o.ej) break;
    }
  }
  P.push(o);
}
const camRepMov = (e, x0, y0) => (x0 !== e.x || y0 !== e.y) && camRep({ k: "mov", ej: e.id, f: e.f, de: [x0, y0], a: [e.x, e.y] });
function camAsedioFin(pid) {
  const S = camS();
  if (!S.as[pid]) return;
  camRep({ k: "ase", p: +pid, f: S.as[pid].f, fase: "fin" });
  delete S.as[pid];
}
OC.on("conquista", ({ p, de, a }) => p && camRep({ k: "con", p: p.id, de, a }));
OC.on("revuelta", ({ p, de }) => p && camRep({ k: "con", p: p.id, de: de != null ? de : p.owner, a: REB }));
const camEj = (id) => camS().ej.find((e) => e.id === id) || null;
const camEjDe = (f) => camS().ej.filter((e) => e.f === f);
const camIdx = (x, y) => y * W + x;
const camXY = (i) => [i % W, Math.floor(i / W)];
const camPid = (x, y) => (MAP && MAP.grid[y] ? MAP.grid[y][x] : -1);
const camProv = (ej) => G.P[camPid(ej.x, ej.y)] || null;
const camF = (f) => (G.F && G.F[f]) || null;
const camGen = (ej) => (ej.gen != null && G.C[ej.gen] && G.C[ej.gen].alive ? G.C[ej.gen] : null);
const camTot = (u) => Object.keys(u || {}).reduce((s, t) => s + (UN[t] ? +u[t] || 0 : 0), 0);
const camCheb = (a, b, x, y) => Math.max(Math.abs(a - x), Math.abs(b - y));
const camTocar = () => camVer++;
const camEstTxt = (e) => `${CAM_EST[e != null ? e : G.estacion]} de ${G.year}`;
function camCiudades() {
  const m = new Map();
  for (const p of G.P) m.set(camIdx(p.x, p.y), p);
  return m;
}
const camCiudadEn = (x, y) => G.P.find((p) => p.x === x && p.y === y) || null;
/* unidades que combaten en campo abierto (las máquinas de asedio no) */
function camUCampo(u) {
  const r = cmbVacio();
  for (const t in u) if (UN[t] && !UN[t].asedio && u[t] > 0) r[t] = (r[t] || 0) + u[t];
  return r;
}
/* máquinas: en ej.u si combate ya definió UN[clave]; si no, en ej.maq */
function camMaq(ej) {
  const r = {};
  for (const k in CAM_MAQ) r[k] = ((ej.u && UN[k] && ej.u[k]) || 0) + ((ej.maq && ej.maq[k]) || 0);
  return r;
}
const camMaqTot = (ej) => Object.values(camMaq(ej)).reduce((a, b) => a + b, 0);
function camNombre(ej) {
  const g = camGen(ej);
  return ej.nom || (g ? `Hueste de ${g.n}` : `Ejército de ${CIV[ej.f].s}`);
}

/* ---------- relaciones: quién puede pisar qué ---------- */
const camAliado = (f, o) => f === o || (f < NF && o < NF && G.st[f] && G.st[f][o] === "alianza");
const camGuerra = (f, o) => f !== o && (f === REB || o === REB || (G.st[f] && G.st[f][o] === "guerra"));
function camPaso(f, o, ej) {
  if (f === o || f === REB || o === REB) return true;
  /* derecho de salida: si un ejército se ha quedado dentro de tierras de alguien con quien está en paz
     (p.ej. un tercero conquistó la provincia donde estaba), puede cruzarlas para salir */
  if (ej && MAP.grid[ej.y] && MAP.grid[ej.y][ej.x] >= 0 && G.P[MAP.grid[ej.y][ej.x]].owner === o) return true;
  if (camGuerra(f, o) || camAliado(f, o)) return true;
  return typeof dipTr === "function" && G.dip ? !!dipTr(f, o, "paso") : false;
}
/* la provincia es tierra «propia» a efectos de víveres y calzadas */
const camPropia = (f, o) => f === o || camAliado(f, o) || (f < NF && o < NF && typeof dipTr === "function" && G.dip && !!dipTr(f, o, "paso"));
function camCalzadas(f) {
  return f < NF && typeof tecTiene === "function" && G.tec ? !!tecTiene(f, "vias") : false;
}

/* ---------- terreno de una casilla ----------
   Relieve (mundo.md §6, mapas v2): montañas infranqueables, ríos que solo se cruzan por puente o vado,
   caminos baratos, pasos de montaña caros y bosque denso que oculta. En mapas v1 (partidas antiguas) esas
   capas vienen vacías: todo funciona como antes (río «por provincia», cualquier bosque oculta). */
const CAM_REL = { camino: 0.6, caminoCalz: 0.45, paso: 1.5, vado: 2, vadoInv: 2, montana: Infinity };
let camRelC = null;
function camRelieve() {
  if (!MAP) return false;
  if (!camRelC || camRelC.m !== MAP) {
    const tiene = (k) => !!(MAP[k] && MAP[k].some((r) => r && r.some && r.some((v) => v)));
    camRelC = { m: MAP, v: tiene("mont") || tiene("rio") || tiene("camino") || tiene("bosque") };
  }
  return camRelC.v;
}
const camCapa = (k, x, y) => !!(MAP[k] && MAP[k][y] && MAP[k][y][x]);
/* casilla transitable: tierra, no montaña y, si es río, con puente o vado */
function camPasable(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H || !MAP.terr[y] || !MAP.terr[y][x]) return false;
  return typeof mapaTransitable === "function" ? mapaTransitable(x, y) : true;
}
/* bosque que oculta ejércitos: el denso en mapas con relieve, cualquier bosque en los antiguos */
const camEsBosque = (x, y) => (camRelieve() ? camCapa("bosque", x, y) : MAP.terr[y] && MAP.terr[y][x] === 2);
function camRio(pid) {
  return typeof cmbTerreno === "function" && G.P[pid] ? !!cmbTerreno(G.P[pid]).rio : false;
}
function camTerrCasilla(x, y) {
  const t = MAP.terr[y][x],
    pid = camPid(x, y);
  let b = 0,
    c = 0,
    n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const k = MAP.terr[y + dy]?.[x + dx];
      if (!k) continue;
      n++;
      if (k === 2) b++;
      if (k === 3) c++;
    }
  const rio = camRelieve()
    ? CAM_V8.some(([dx, dy]) => camCapa("rio", x + dx, y + dy)) || camCapa("rio", x, y)
    : pid >= 0 && camRio(pid) && t === 1;
  return {
    tag: t === 3 ? "colinas" : t === 2 ? "bosque" : rio ? "vado" : "llanura",
    bosque: n ? b / n : 0,
    colina: n ? c / n : 0,
    rio,
  };
}
/* coste de entrar en la casilla i para la facción f (cc: caché por cálculo de caminos) */
function camCoste(f, i, cc) {
  const x = i % W,
    y = (i - x) / W,
    t = MAP.terr[y][x],
    pid = MAP.grid[y][x];
  if (!t || pid < 0 || !camPasable(x, y)) return Infinity;
  const rel = camRelieve();
  let c = CAM_K.terr[t] + (!rel && t === 1 && camRio(pid) ? CAM_K.vado : 0);
  const o = G.P[pid].owner;
  let pr;
  if (cc) {
    if (!cc.pr.has(o)) cc.pr.set(o, camPropia(f, o));
    pr = cc.pr.get(o);
    if (cc.cz == null) cc.cz = camCalzadas(f);
  } else pr = camPropia(f, o);
  const calz = cc ? cc.cz : camCalzadas(f);
  if (rel) {
    /* camino (más barato aún con Calzadas, en cualquier tierra), paso de montaña, vado (peor en invierno) */
    if (camCapa("camino", x, y)) c = Math.min(c, 1) * (calz ? CAM_REL.caminoCalz : CAM_REL.camino);
    if (camCapa("paso", x, y)) c += CAM_REL.paso;
    if (camCapa("rio", x, y) && camCapa("vado", x, y) && !camCapa("puente", x, y)) c += CAM_REL.vado + (G.estacion === 3 ? CAM_REL.vadoInv : 0);
  }
  if (pr) {
    if (calz && !(rel && camCapa("camino", x, y))) c *= CAM_K.calzadas;
  } else c *= CAM_K.ajeno;
  return c;
}
/* alcance máximo por estación: clase más lenta, mando del general, invierno, cansancio */
function camMovMax(ej, est = G.estacion) {
  const ts = Object.keys(ej.u || {}).filter((t) => ej.u[t] > 0 && UN[t]);
  let mv = ts.length ? Math.min(...ts.map((t) => (UN[t].asedio ? UN[t].mv || 1.6 : UN[t].mv || 2.6))) : 2.6;
  if (ej.maq && Object.values(ej.maq).some((v) => v > 0)) mv = Math.min(mv, 1.6);
  let m = mv * CAM_K.pts;
  const g = camGen(ej);
  if (g) m += g.ma * CAM_K.gen;
  if (est === 3) m *= CAM_K.invierno;
  if ((ej.fat || 0) > 70) m *= 0.8;
  /* OC alcanceEjercito: puntos de marcha por estación. ctx {f, ej, est} */
  m = +OC.calc("alcanceEjercito", m, { f: ej.f, ej, est }) || m;
  return Math.round(m * 10) / 10;
}

/* ---------- ocupación: ejércitos, zonas de control, ciudades ---------- */
function camEjsEn(x, y, sin) {
  return camS().ej.filter((e) => e.x === x && e.y === y && e.id !== sin && camTot(e.u) > 0);
}
/* enemigo (en guerra) adyacente: frena la marcha (zona de control) */
function camZocEn(f, x, y) {
  return camS().ej.some((e) => camGuerra(f, e.f) && camTot(e.u) > 0 && camCheb(e.x, e.y, x, y) <= 1 && !(e.x === x && e.y === y));
}
/* ciudad hostil con defensores o murallas: no se cruza, se asedia o se asalta */
const camCiudadCerrada = (f, p) => p && p.owner !== f && camGuerra(f, p.owner) && (tot(p.u) > 0 || (p.walls || 0) > 0);

/* ---------- caminos: Dijkstra determinista por casillas (8 vecinos, sin cortar costas) ---------- */
function camHeap() {
  const a = [];
  return {
    n: () => a.length,
    push(d, i) {
      a.push([d, i]);
      let k = a.length - 1;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (a[p][0] < a[k][0] || (a[p][0] === a[k][0] && a[p][1] <= a[k][1])) break;
        [a[p], a[k]] = [a[k], a[p]];
        k = p;
      }
    },
    pop() {
      const r = a[0],
        l = a.pop();
      if (a.length) {
        a[0] = l;
        let k = 0;
        for (;;) {
          const L = 2 * k + 1,
            Rr = L + 1;
          let m = k;
          const lt = (x, y) => a[x][0] < a[y][0] || (a[x][0] === a[y][0] && a[x][1] < a[y][1]);
          if (L < a.length && lt(L, m)) m = L;
          if (Rr < a.length && lt(Rr, m)) m = Rr;
          if (m === k) break;
          [a[m], a[k]] = [a[k], a[m]];
          k = m;
        }
      }
      return r;
    },
  };
}
const CAM_V8 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
/* o = {presu: puntos, sinZoc: ignorar zonas de control (planes largos de la IA)} */
function camDijkstra(ej, o = {}) {
  const f = ej.f,
    N = W * H,
    dist = new Float64Array(N).fill(Infinity),
    prev = new Int32Array(N).fill(-1),
    alto = new Uint8Array(N), // casillas donde la marcha se detiene (no se expande)
    presu = o.presu != null ? o.presu : Infinity,
    ciu = camCiudades(),
    S = camS();
  /* ocupación y zonas de control */
  const enem = new Uint8Array(N),
    neut = new Uint8Array(N),
    zoc = new Uint8Array(N);
  for (const e of S.ej) {
    if (e.id === ej.id || camTot(e.u) <= 0) continue;
    const i = camIdx(e.x, e.y);
    if (camGuerra(f, e.f)) {
      /* niebla: el camino se traza con lo que se ve; el que no se ve aparece al toparse con él */
      if (typeof camVeEj === "function" && !camVeEj(f, e)) continue;
      enem[i] = 1;
      if (!o.sinZoc)
        for (const [dx, dy] of CAM_V8) {
          const x = e.x + dx,
            y = e.y + dy;
          if (x >= 0 && y >= 0 && x < W && y < H) zoc[camIdx(x, y)] = 1;
        }
    } else if (e.f !== f) neut[i] = 1;
  }
  const s = camIdx(ej.x, ej.y),
    q = camHeap(),
    pasa = new Map(),
    cc = { pr: new Map(), cz: null };
  const puede = (pid) => {
    if (!pasa.has(pid)) pasa.set(pid, camPaso(f, G.P[pid].owner, ej));
    return pasa.get(pid);
  };
  dist[s] = 0;
  q.push(0, s);
  while (q.n()) {
    const [d, i] = q.pop();
    if (d > dist[i]) continue;
    if (i !== s && alto[i]) continue;
    /* en zona de control enemiga la marcha se detiene: solo cabe atacar al ejército vecino */
    const enZoc = i !== s && zoc[i];
    const x = i % W,
      y = (i - x) / W;
    for (const [dx, dy] of CAM_V8) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !MAP.terr[ny][nx]) continue;
      if (dx && dy && (!camPasable(nx, y) || !camPasable(x, ny))) continue; // sin cortar esquinas de costa, sierra o río
      const j = camIdx(nx, ny),
        pid = MAP.grid[ny][nx];
      if (pid < 0 || neut[j] || !puede(pid) || (enZoc && !enem[j])) continue;
      const c = ciu.get(j);
      let para = enem[j];
      if (c && c.owner !== f && camGuerra(f, c.owner)) {
        if (camCiudadCerrada(f, c) || camCercoAjeno(f, c)) continue;
        para = 1; // ciudad vacía y sin murallas: se toma al entrar
      }
      const nd = d + camCoste(f, j, cc) * (dx && dy ? CAM_K.diag : 1);
      if (nd > presu + 1e-9) continue;
      if (nd < dist[j] - 1e-9) {
        dist[j] = nd;
        prev[j] = i;
        if (para) alto[j] = 1;
        q.push(nd, j);
      }
    }
  }
  return { dist, prev, s, enem, zoc };
}
function camCamino(D, j) {
  if (!Number.isFinite(D.dist[j])) return null;
  const r = [];
  for (let k = j; k !== D.s && k >= 0; k = D.prev[k]) r.push(k);
  return r.reverse();
}
/* alcance de la estación (cacheado para dibujar) */
let camAlcC = null;
function camAlcance(ej) {
  const k = `${ej.id}|${ej.x}|${ej.y}|${ej.mov}|${camVer}|${G.estacion}`;
  if (camAlcC && camAlcC.k === k) return camAlcC.D;
  const D = camDijkstra(ej, { presu: ej.mov });
  camAlcC = { k, D };
  return D;
}
/* mejor casilla junto a una ciudad para asediarla (la más barata de alcanzar) */
/* Prefiere un FLANCO libre: un lado de la ciudad que no cubra ya otro ejército del mismo bando (o aliado),
   si se alcanza esta estación o cuesta poco más que el flanco cubierto más cercano. */
function camJuntoA(ej, p, D) {
  const cub = camFlancosDe(ej.f, p, ej.id).lados,
    ops = [];
  for (const [dx, dy] of CAM_V8) {
    const x = p.x + dx,
      y = p.y + dy;
    if (x < 0 || y < 0 || x >= W || y >= H || !camPasable(x, y)) continue;
    if (x === ej.x && y === ej.y) return camIdx(x, y);
    const j = camIdx(x, y);
    if (!Number.isFinite(D.dist[j])) continue;
    const ocup = camEjsEn(x, y, ej.id).length > 0;
    ops.push({ j, d: D.dist[j], libre: !cub.includes(camFlanco(dx, dy)) && !ocup, ocup });
  }
  if (!ops.length) return -1;
  ops.sort((a, b) => a.d - b.d || a.j - b.j);
  const cerca = ops.find((o) => !o.ocup) || ops[0],
    libre = ops.find((o) => o.libre && (o.d <= (ej.mov || 0) + 1e-9 || o.d <= cerca.d + Math.max(4, camMovMax(ej) * 0.4)));
  return (libre || cerca).j;
}

/* ---------- flancos de una ciudad ----------
   Las 8 casillas vecinas se agrupan en 4 lados (cada uno, una recta y una diagonal en sentido horario):
   N = (0,−1)(1,−1) · E = (1,0)(1,1) · S = (0,1)(−1,1) · O = (−1,0)(−1,−1). */
const CAM_LADOS = ["N", "E", "S", "O"];
const CAM_LADO_N = { N: "norte", E: "este", S: "sur", O: "oeste" };
function camFlanco(dx, dy) {
  if (!dx && !dy) return null;
  if (dy === -1 && dx >= 0) return "N";
  if (dx === 1 && dy >= 0) return "E";
  if (dy === 1 && dx <= 0) return "S";
  return "O";
}
/* ejércitos de f (y de sus aliados en guerra con el dueño) junto a la ciudad y lados que cubren */
function camFlancosDe(f, p, sin) {
  const as = camAsedio(p.id);
  const ejs = camS().ej.filter(
    (e) =>
      e.id !== sin &&
      camTot(camUCampo(e.u)) > 0 &&
      camCheb(e.x, e.y, p.x, p.y) === 1 &&
      camGuerra(e.f, p.owner) &&
      (e.f === f ||
        (as ? camCoCerco(as, f) && camCoCerco(as, e.f) && (e.est === "asedio" || camAliado(f, e.f)) : camAliado(f, e.f))),
  );
  const lados = [...new Set(ejs.map((e) => camFlanco(e.x - p.x, e.y - p.y)))].sort((a, b) => CAM_LADOS.indexOf(a) - CAM_LADOS.indexOf(b));
  return { ejs, lados };
}
/* quiénes atacarían con ej en un asalto conjunto: sus ejércitos (y los de aliados que no lleva una persona)
   junto a la ciudad que no hayan asaltado ya esta estación; con con = [ids], solo esos */
const camClaveEst = () => `${G.year}.${G.estacion}`;
function camParticipantes(ej, p, con) {
  if (!ej || !p || camCheb(ej.x, ej.y, p.x, p.y) > 1) return [];
  const clave = camClaveEst(),
    { ejs } = camFlancosDe(ej.f, p, ej.id),
    ok = (e) => e.acc !== clave && (e.f === ej.f || !human(e.f)) && (!con || con.includes(e.id));
  return [ej, ...ejs.filter(ok).sort((a, b) => a.id - b.id)];
}
/* ¿cabe la ruta en el movimiento que le queda a la estación? */
function camRutaCabe(ej, ruta) {
  let c = 0,
    x = ej.x,
    y = ej.y;
  for (const j of ruta || []) {
    const [nx, ny] = camXY(j);
    c += camCoste(ej.f, j) * (nx !== x && ny !== y ? CAM_K.diag : 1);
    x = nx;
    y = ny;
  }
  return c <= (ej.mov || 0) + 1e-9;
}
const camLadosDe = (ejs, p) => [...new Set(ejs.map((e) => camFlanco(e.x - p.x, e.y - p.y)).filter(Boolean))];

/* ---------- formar, disolver, dividir ---------- */
function camNuevoEj(f, x, y, u, o = {}) {
  const S = camS(),
    ej = {
      id: S.sig++,
      f,
      x,
      y,
      u: { ...cmbVacio(), ...u },
      vet: o.vet || {},
      ori: o.ori || {},
      gen: o.gen != null ? o.gen : null,
      mov: 0,
      est: "marcha",
      sum: o.sum != null ? o.sum : CAM_K.sumMax,
      fat: o.fat || 0,
      mor: o.mor != null ? o.mor : 70,
      her: {},
      maq: {},
      obra: [],
      asd: null,
      plan: null,
      pas: [],
      nom: o.nom || null,
      obj: null,
    };
  ej.mov = o.mov != null ? o.mov : camMovMax(ej);
  S.ej.push(ej);
  camRep({ k: "ej+", ej: ej.id, f, x, y, n: camTot(ej.u) });
  camTocar();
  return ej;
}
function camFormar(f, p, sel, conGen) {
  if (!p || p.owner !== f) return { ok: false, motivo: "La provincia no es tuya" };
  cmbNorm(p.u);
  const s = cmbVacio();
  for (const t of TYP) s[t] = clamp(Math.floor(+sel[t] || 0), 0, p.u[t] || 0);
  if (!tot(s)) return { ok: false, motivo: "Sin tropas" };
  if (camEjsEn(p.x, p.y).some((e) => e.f !== f)) return { ok: false, motivo: "Hay enemigos ante las puertas" };
  const xp = { ...cmbVetDe(p) },
    ori = { ...cmbOriDe(p) },
    vet = {},
    o2 = {};
  for (const t of TYP) {
    p.u[t] -= s[t];
    if (s[t] > 0) {
      if (xp[t] != null) vet[t] = xp[t];
      if (ori[t] != null) o2[t] = ori[t];
    }
  }
  cmbVetFijar(p, xp);
  cmbOriFijar(p, ori);
  let g = null;
  if (conGen && p.gen != null && G.C[p.gen] && G.C[p.gen].alive) {
    g = p.gen;
    p.gen = null;
  }
  const ej = camNuevoEj(f, p.x, p.y, s, { vet, ori: o2, gen: g, nom: `Ejército de ${p.name}`, mov: p.tired ? 0 : undefined });
  if (isMe(f)) addLog(`Se forma el ${ej.nom.toLowerCase()}: ${tot(s) * SPU} hombres.`);
  return { ok: true, ej };
}
function camDisolver(ej) {
  const p = camProv(ej);
  if (!p || p.owner !== ej.f) return { ok: false, motivo: "Solo en una provincia propia" };
  const u = camUCampo(ej.u);
  cmbLlega(p, u, ej.vet, ej.ori);
  for (const t in ej.her) if (UN[t] && TYP.includes(t)) p.u[t] = (p.u[t] || 0) + ej.her[t];
  const g = camGen(ej);
  if (g && p.gen == null) p.gen = g.id;
  p.tired = true;
  camQuitar(ej);
  if (isMe(ej.f)) addLog(`El ${camNombre(ej).toLowerCase()} entra en ${p.name} y se acuartela.`);
  return { ok: true };
}
function camQuitar(ej, motivo) {
  const S = camS();
  if (S.ej.includes(ej)) camRep({ k: "ej-", ej: ej.id, motivo: motivo || "" });
  S.ej = S.ej.filter((e) => e !== ej);
  if (camSel === ej.id) camSel = null;
  camTocar();
}
function camDividir(ej, frac = 0.5) {
  const s = cmbVacio();
  let n = 0;
  for (const t in ej.u) {
    if (!UN[t]) continue;
    const k = Math.floor((ej.u[t] || 0) * frac);
    if (k > 0) {
      s[t] = k;
      n += k;
    }
  }
  if (!n || n >= camTot(ej.u)) return { ok: false, motivo: "No se puede dividir" };
  for (const t in s) ej.u[t] -= s[t];
  const nv = camNuevoEj(ej.f, ej.x, ej.y, s, {
    vet: { ...ej.vet },
    ori: { ...ej.ori },
    sum: ej.sum,
    fat: ej.fat,
    mor: ej.mor,
    mov: Math.min(ej.mov, camMovMax({ ...ej, u: s })),
    nom: `${camNombre(ej)} (destacamento)`,
  });
  return { ok: true, ej: nv };
}
function camUnir(a, b) {
  if (!a || !b || a.f !== b.f || camCheb(a.x, a.y, b.x, b.y) > 0) return { ok: false, motivo: "Deben estar en la misma casilla" };
  const na = camTot(a.u),
    nb = camTot(b.u);
  for (const t in b.u) {
    if (!UN[t]) continue;
    const x = a.u[t] || 0,
      y = b.u[t] || 0;
    if (x + y > 0) a.vet[t] = ((a.vet[t] || 0) * x + (b.vet[t] || 0) * y) / (x + y);
    if (y > x && b.ori[t] != null) a.ori[t] = b.ori[t];
    a.u[t] = x + y;
  }
  for (const k in b.maq || {}) a.maq[k] = (a.maq[k] || 0) + b.maq[k];
  for (const k in b.her || {}) a.her[k] = (a.her[k] || 0) + b.her[k];
  if (a.gen == null && b.gen != null) a.gen = b.gen;
  a.sum = Math.min(a.sum, b.sum);
  a.mov = Math.min(a.mov, b.mov);
  a.fat = Math.round((a.fat * na + b.fat * nb) / Math.max(1, na + nb));
  camQuitar(b);
  return { ok: true };
}

/* ---------- batallas: la elección del jugador y las consecuencias ---------- */
function camParaBatalla(ej) {
  return {
    f: ej.f,
    u: camUCampo(ej.u),
    gen: camGen(ej) ? ej.gen : null,
    vet: ej.vet || {},
    ori: ej.ori || {},
    fat: clamp(Math.round(ej.fat || 0), 0, 100),
    hambre: (ej.sum || 0) <= 0,
  };
}
const camTxtEj = (e) =>
  `${CIV[e.f].s}: ${tot(e.u) * SPU} hombres${e.gen != null && G.C[e.gen] ? " al mando de " + G.C[e.gen].n : ""}<br><span class="stats">${cmbComp(e.f, e.u)}</span>`;
/* libra una batalla: modal táctica/automática si hay un jugador; emite batallaResuelta */
async function camLibrar(ejA, ejD, bctx, o = {}) {
  const yoA = isMe(ejA.f),
    yoD = isMe(ejD.f);
  let ch = "auto";
  if ((yoA || yoD) && !o.auto && !net.on) {
    const pr = Math.round(cmbEstimar(ejA, ejD, bctx, 12) * 100),
      mio = yoA ? pr : 100 - pr;
    ch = await modal(
      o.titulo || `Batalla en ${bctx.nombreLugar}`,
      `<p>${camTxtEj(ejA)}<br>contra ${camTxtEj(ejD)}${bctx.fort ? `<br>${o.campo ? "tras la empalizada del campamento" : "tras murallas de nivel " + Math.round(bctx.fort * 10) / 10}` : ""}.</p><p class="dim">Terreno: ${CMBA_TERR[bctx.terreno.tag] || bctx.terreno.tag} · ${CAM_EST[G.estacion].toLowerCase()}. Tus capitanes ven la batalla ${mio >= 70 ? "favorable" : mio >= 45 ? "incierta" : "desfavorable"} (≈${mio}% de victoria).</p><p>¿Cómo quieres librarla?</p>`,
      [
        { t: "Por turnos · 3 acciones", v: "t3", cls: "gold" },
        { t: "Por turnos · 1 acción", v: "t1", cls: "gold" },
        { t: "Tiempo real", v: "rt", cls: "gold" },
        { t: "Resolución automática", v: "auto" },
      ],
    );
  }
  if (yoD && !yoA) bctx.jugador = 1;
  const res =
    tot(ejD.u) <= 0
      ? { gana: 0, A: { ...ejA.u }, D: cmbVacio(), heridos: { A: 0, D: 0 }, informe: null, gen: [null, null] }
      : ch !== "auto"
        ? await cmbTactica(ejA, ejD, bctx, ch)
        : cmbResolverAuto(ejA, ejD, bctx);
  /* factor propio de campaña (p. ej. «asalto por 3 flancos») al frente del informe */
  if (o.factor && res.informe && Array.isArray(res.informe.factores)) res.informe.factores.unshift(o.factor);
  res.A = cmbNorm(res.A || cmbVacio());
  res.D = cmbNorm(res.D || cmbVacio());
  const inf = res.informe,
    n0 = tot(ejA.u),
    d0 = tot(ejD.u),
    win = res.gana === 0,
    gm = res.gen || [null, null];
  if (inf) cmbGuardarInf(inf);
  if (d0 > 0 && typeof cmbFamaSumar === "function") {
    if ((win ? ejA.f : ejD.f) < NF) cmbFamaSumar(win ? ejA.f : ejD.f, d0 >= 2 && n0 >= 2 ? 1 : 0.25);
    if ((win ? ejD.f : ejA.f) < NF) cmbFamaSumar(win ? ejD.f : ejA.f, 0.25);
  }
  const nC0 = G.C.length;
  if (d0 > 0)
    OC.emitirSync("batallaResuelta", {
      p: bctx.p,
      atacante: ejA.f,
      defensor: ejD.f,
      gana: win,
      A: res.A,
      D: res.D,
      s0: ejA.u,
      d0: ejD.u,
      gA: ejA.gen,
      gD: ejD.gen,
      bajas: inf ? inf.bajas : null,
      heridos: res.heridos,
      factores: inf ? inf.factores.map((x) => x.k) : [],
      rondas: inf ? inf.rondas.length : 0,
      general: gm,
      modo: ch,
      informe: inf,
      campana: o.tipo || "campo",
      ejercitos: o.ejercitos || null,
    });
  /* un capitán surgido de la victoria (combate, cmbCapitanSurge) manda el ejército que la ganó */
  for (const c of G.C.slice(nC0)) {
    const lado = c.f === ejA.f ? 0 : c.f === ejD.f ? 1 : -1,
      arm = lado >= 0 && o.ejs ? o.ejs[lado] : null;
    if (!arm || arm.gen != null || c.rol !== "capitan" || c.alive === false) continue;
    G.P.forEach((q) => {
      if (q.gen === c.id) q.gen = null;
    });
    if (G.cmb && G.cmb.capPend && G.cmb.capPend.id === c.id) G.cmb.capPend = null;
    arm.gen = c.id;
  }
  const lugar = bctx.nombreLugar;
  if (gm[0] === "muerto" && ejA.gen != null && G.C[ejA.gen]) kill(G.C[ejA.gen], "cae en la batalla de " + lugar);
  if (gm[1] === "muerto" && ejD.gen != null && G.C[ejD.gen]) kill(G.C[ejD.gen], "cae en la batalla de " + lugar);
  if (d0 > 0) camRep({ k: "bat", x: bctx.x != null ? bctx.x : bctx.p ? bctx.p.x : 0, y: bctx.y != null ? bctx.y : bctx.p ? bctx.p.y : 0, fs: [ejA.f, ejD.f], gana: win ? ejA.f : ejD.f, lugar: bctx.nombreLugar || "" });
  if (bctx.p) flash = { x: bctx.x * T + 4, y: bctx.y * T + 4, t0: performance.now() };
  if (inf && (yoA || yoD) && ch === "auto" && !o.sinInforme) {
    const yo = yoA ? 0 : 1,
      gano = inf.gana === yo;
    if (yo === 0 || !gano || d0 + n0 >= 8)
      await modal(`${gano ? "Victoria" : "Derrota"} en ${lugar}`, cmbInfHtml(inf, yo), [{ t: "Continuar", cls: "gold" }]);
  }
  res.modo = ch;
  res.rondas = inf ? inf.rondas.length : 0;
  return res;
}
/* vuelve a poner en el ejército lo que sobrevive (y guarda heridos graves) */
function camTrasBatalla(ej, u0, uFin, gana, rondas) {
  const vivos = cmbNorm({ ...uFin });
  for (const t in u0) {
    if (!UN[t] || UN[t].asedio) continue;
    const perd = Math.max(0, (u0[t] || 0) - (vivos[t] || 0)),
      her = Math.floor(perd * (gana ? 0.2 : 0.1));
    if (her > 0) ej.her[t] = (ej.her[t] || 0) + her;
    ej.u[t] = vivos[t] || 0;
  }
  ej.vet = cmbVetGanar(ej.vet, ej.u, gana, rondas || 4);
  ej.fat = clamp((ej.fat || 0) + 18, 0, 100);
  ej.mor = clamp((ej.mor || 70) + (gana ? 12 : -18), 5, 100);
  if (!gana) for (const k in ej.maq || {}) ej.maq[k] = Math.floor(ej.maq[k] / 2);
}
/* el vencido retrocede hasta 2 casillas, lejos del vencedor; si no puede, se rinde */
function camRetirar(ej, dx, dy) {
  const f = ej.f;
  let best = null,
    bs = -Infinity;
  for (let ry = -2; ry <= 2; ry++)
    for (let rx = -2; rx <= 2; rx++) {
      const x = ej.x + rx,
        y = ej.y + ry;
      if (x < 0 || y < 0 || x >= W || y >= H || !camPasable(x, y) || (rx === 0 && ry === 0)) continue;
      const pid = MAP.grid[y][x];
      if (pid < 0 || !camPaso(f, G.P[pid].owner, ej) || camEjsEn(x, y, ej.id).some((e) => e.f !== f)) continue;
      const c = camCiudadEn(x, y);
      if (c && c.owner !== f) continue;
      const sc = Math.hypot(x - dx, y - dy) * 2 + (G.P[pid].owner === f ? 3 : 0) - (camZocEn(f, x, y) ? 4 : 0);
      if (sc > bs) {
        bs = sc;
        best = [x, y];
      }
    }
  if (!best) return false;
  const x0r = ej.x,
    y0r = ej.y;
  ej.x = best[0];
  ej.y = best[1];
  camRepMov(ej, x0r, y0r);
  ej.est = "marcha";
  ej.asd = null;
  ej.mov = 0;
  camTocar();
  return true;
}
/* el ejército se dispersa (aniquilado o rendido) */
function camDispersar(ej, motivo) {
  const g = camGen(ej);
  if (g && R() < 0.35) kill(g, motivo || "cae con su ejército");
  if (isMe(ej.f)) addLog(`El ${camNombre(ej).toLowerCase()} deja de existir: ${motivo || "aniquilado"}.`, "bad");
  camQuitar(ej);
}

/* encuentro en campo abierto: A entra en la casilla de D */
/* ---------- batalla en conjunto (encuentros) ----------
   Al chocar A con D en la casilla de D, acuden los ejércitos de cada bando (propios y aliados en guerra con
   el otro bando) que estén a 1 casilla del punto de la batalla, o a 2 si les queda marcha y no asedian.
   El jugador elige con un modal cuáles de los suyos se suman (marcados por defecto según ej.apoyo); la IA,
   y el jugador en el online o sin preguntar, deciden solos: la IA se suma salvo que su bando ya tenga la
   batalla ganada (≥ 85 %); un ejército humano según ej.apoyo ('siempre' por defecto | 'nunca' | id del
   ejército al que apoya). Cada uno lleva su dirección (dir N/E/S/O) respecto al punto de la batalla. */
let camBatPrep = null; // {x, y, lados:[[ids],[ids]], t0}: flechas en el mapa mientras se prepara la batalla
const camDir = (e, x, y) => camFlanco(Math.sign(e.x - x), Math.sign(e.y - y)) || "C";
function camBandoDe(e, a, d) {
  /* 0 = del lado de a, 1 = del lado de d, -1 = ninguno o ambiguo */
  const conA = e.f === a || (camAliado(a, e.f) && camGuerra(e.f, d)),
    conD = e.f === d || (camAliado(d, e.f) && camGuerra(e.f, a));
  return conA && !conD ? 0 : conD && !conA ? 1 : -1;
}
function camCandidatos(A, D, x, y) {
  const r = [[], []];
  for (const e of camS().ej) {
    if (e === A || e === D || camTot(camUCampo(e.u)) <= 0) continue;
    const d = camCheb(e.x, e.y, x, y);
    if (d < 1 || d > 2 || (d === 2 && (e.mov <= 0.5 || e.est === "asedio"))) continue;
    const b = camBandoDe(e, A.f, D.f);
    if (b >= 0) r[b].push(e);
  }
  return r;
}
const camApoya = (e, otros) => e.apoyo == null || e.apoyo === "siempre" || (e.apoyo !== "nunca" && otros.some((x) => x.id === e.apoyo));
/* decide quiénes se suman de cada lado; el jugador, con un modal */
async function camReunir(A, D, x, y, o = {}) {
  const cand = camCandidatos(A, D, x, y),
    lados = [[A], [D]],
    bctx0 = { fort: D.est === "campamento" ? CAM_K.fortCampo : 0, terreno: camTerrCasilla(x, y), p: G.P[camPid(x, y)] || null, est: true };
  for (const s of [0, 1]) {
    const mios = cand[s].filter((e) => isMe(e.f) && !net.on && !o.auto),
      solos = cand[s].filter((e) => !mios.includes(e));
    /* IA y jugador sin modal */
    for (const e of solos) {
      if (human(e.f)) {
        if (camApoya(e, lados[s])) lados[s].push(e);
        continue;
      }
      const yo = camFuerzaConjunta(lados[s], true).ej,
        el = camFuerzaConjunta(lados[1 - s], true).ej,
        est = s === 0 ? cmbEstimar(yo, el, bctx0, 3) : 1 - cmbEstimar(el, yo, bctx0, 3);
      if (est < 0.85) lados[s].push(e);
    }
    if (mios.length) {
      camBatPrep = { x, y, lados: [lados[0].map((e) => e.id), lados[1].map((e) => e.id)], t0: performance.now(), cand: mios.map((e) => e.id) };
      let elegidos = mios.filter((e) => camApoya(e, lados[s]));
      await modal(
        `¿Quién acude a la batalla?`,
        `<p>${s === 0 ? "Tu ataque" : "La defensa"} en ${bctx0.p ? bctx0.p.name : "campo abierto"}: tus ejércitos vecinos pueden sumarse.</p><div class="cam-el">${mios
          .map(
            (e) =>
              `<label><input type="checkbox" data-cam-ej="${e.id}" ${camApoya(e, lados[s]) ? "checked" : ""}> ${esc(camNombre(e))} · ${camTot(e.u) * SPU} hombres · desde el ${CAM_LADO_N[camDir(e, x, y)] || "centro"}</label>`,
          )
          .join("")}</div>`,
        [
          {
            t: "Combatir",
            cls: "gold",
            fn: () => {
              const sel = [...document.querySelectorAll("#modalc [data-cam-ej]")].filter((i) => i.checked).map((i) => +i.dataset.camEj);
              elegidos = mios.filter((e) => sel.includes(e.id));
            },
          },
          { t: "Solo el que choca", fn: () => (elegidos = []) },
        ],
      );
      lados[s].push(...elegidos);
    }
  }
  for (const s of [0, 1]) for (const e of lados[s]) e.dir = camDir(e, x, y);
  A.dir = camFlanco(Math.sign(A.x - x), Math.sign(A.y - y)) || "O";
  D.dir = "C";
  camBatPrep = { x, y, lados: [lados[0].map((e) => e.id), lados[1].map((e) => e.id)], t0: performance.now() };
  return lados;
}
/* batalla de varios ejércitos por bando: con cmbResolverMulti/cmbTacticaMulti de combate si existen;
   si no, cada bando se funde en una fuerza (camFuerzaConjunta) y se libra con camLibrar.
   Devuelve {gana: 0|1, sup: [[u por ejército del lado 0], [u por ejército del lado 1]], rondas}. */
async function camBatallaLados(lados, bctx, o = {}) {
  const F = lados.map((l) => camFuerzaConjunta(l, true));
  if (lados[0].length > 1 || lados[1].length > 1) {
    /* los que acuden desde 2 casillas llegan con la batalla empezada (ctx.refuerzos de combate, 10 s por casilla) */
    const lista = [],
      refuerzos = [];
    lados.forEach((l, s) =>
      l.forEach((e, i) => {
        const it = { ...camParaBatalla(e), id: e.id, bando: s, dir: e.dir, u: F[s].aport[i] },
          d = camCheb(e.x, e.y, bctx.x, bctx.y);
        if (i > 0 && d >= 2) refuerzos.push({ ej: it, dir: e.dir, llegada: 10 * d });
        else lista.push(it);
      }),
    );
    const r = await camMulti(lista, { ...bctx, refuerzos }, o, [F[0].ej, F[1].ej]);
    if (r) return { gana: r.gana, sup: lados.map((l) => l.map((e) => cmbNorm({ ...(r.by.get(e.id) || {}) }))), rondas: r.rondas, informe: r.informe };
  }
  /* alternativa (sin batallas de varios bandos en combate): cada bando, una fuerza; los generales de más
     dan su pequeño bono a cada lado */
  camBonoAct = [
    camBonoGen(F[0].ej.f, F[0].extraGen, "atacante"),
    camBonoGen(F[1].ej.f, F[1].extraGen, "defensor"),
    o.emboscada ? { f: F[0].ej.f, lado: "atacante", v: CAM_K.emboscada } : null,
  ];
  let res;
  try {
    res = await camLibrar(F[0].ej, F[1].ej, bctx, {
      ...o,
      ejs: [lados[0][0], lados[1][0]],
      ejercitos: lados.map((l) => l.map((e) => ({ id: e.id, f: e.f, dir: e.dir }))),
    });
  } finally {
    camBonoAct = null;
  }
  return { gana: res.gana, sup: [camRepartir(res.A, F[0].aport), camRepartir(res.D, F[1].aport)], rondas: res.rondas, informe: res.informe, F };
}
/* Batalla de varios ejércitos con el motor de combate (cmbResolverMulti / cmbTacticaMulti), si existe.
   Contrato propuesto: lista = [{id, f, bando: 0 ataca | 1 defiende, dir: N/E/S/O/C, u, gen, vet, ori, fat,
   hambre}]; resultado {gana: bando, ejs: [{id, u: supervivientes}], informe}. Devuelve null si no está (o
   si el resultado no tiene esa forma), y entonces se usa la fusión de cada bando. fz = [fuerza A, fuerza D]
   fundidas, solo para el modal y el evento. Emite batallaResuelta (con ejercitos y multi: true). */
async function camMulti(lista, bctx, o, fz) {
  if (typeof cmbResolverMulti !== "function") return null;
  const yo = lista.some((e) => isMe(e.f)),
    modo = yo && !o.auto && !net.on && typeof cmbTacticaMulti === "function" ? await camModoBatalla(fz[0], fz[1], bctx, o) : "auto",
    soloDef = lista.some((e) => e.bando === 1 && isMe(e.f)) && !lista.some((e) => e.bando === 0 && isMe(e.f)),
    r = modo !== "auto" ? await cmbTacticaMulti(lista, { ...bctx, jugador: soloDef ? 1 : 0 }, modo) : cmbResolverMulti(lista, bctx);
  if (!r || !Array.isArray(r.ejs)) return null;
  const by = new Map(r.ejs.map((x) => [x.id, cmbNorm({ ...(x.u || x.A || {}) })])),
    inf = r.informe || null,
    rondas = inf && inf.rondas ? inf.rondas.length : 4,
    a0 = lista.find((e) => e.bando === 0),
    d0 = lista.find((e) => e.bando === 1);
  if (inf && o.factor && Array.isArray(inf.factores)) inf.factores.unshift(o.factor);
  if (inf && typeof cmbGuardarInf === "function") cmbGuardarInf(inf);
  OC.emitirSync("batallaResuelta", {
    p: bctx.p,
    atacante: a0.f,
    defensor: d0.f,
    gana: r.gana === 0,
    A: by.get(a0.id),
    D: by.get(d0.id),
    s0: fz[0].u,
    d0: fz[1].u,
    gA: fz[0].gen,
    gD: fz[1].gen,
    informe: inf,
    rondas,
    campana: o.tipo || "encuentro",
    ejercitos: [0, 1].map((s) => [...lista, ...(bctx.refuerzos || []).map((x) => ({ ...x.ej, tarde: x.llegada }))].filter((e) => e.bando === s).map((e) => ({ id: e.id, f: e.f, dir: e.dir, tarde: e.tarde || 0 }))),
    multi: true,
  });
  camRep({ k: "bat", x: bctx.x, y: bctx.y, fs: [...new Set(lista.map((e) => e.f))], gana: r.gana === 0 ? a0.f : d0.f, lugar: bctx.nombreLugar || "" });
  return { gana: r.gana, by, rondas, informe: inf };
}
/* modo de la batalla de varios ejércitos (táctica o automática) para el jugador */
async function camModoBatalla(ejA, ejD, bctx, o = {}) {
  const yoA = isMe(ejA.f),
    pr = Math.round(cmbEstimar(ejA, ejD, bctx, 12) * 100),
    mio = yoA ? pr : 100 - pr;
  return modal(
    o.titulo || `Batalla en ${bctx.nombreLugar}`,
    `<p>${camTxtEj(ejA)}<br>contra ${camTxtEj(ejD)}.</p><p class="dim">Tus capitanes ven la batalla ${mio >= 70 ? "favorable" : mio >= 45 ? "incierta" : "desfavorable"} (≈${mio}% de victoria).</p><p>¿Cómo quieres librarla?</p>`,
    [
      { t: "Por turnos · 3 acciones", v: "t3", cls: "gold" },
      { t: "Por turnos · 1 acción", v: "t1", cls: "gold" },
      { t: "Tiempo real", v: "rt", cls: "gold" },
      { t: "Resolución automática", v: "auto" },
    ],
  );
}
/* encuentro con varios ejércitos por bando: reparto de supervivientes, retirada de los vencidos */
async function camChoqueConjunto(lados, x, y, p, o = {}) {
  const A = lados[0][0],
    D = lados[1][0],
    n = lados[0].length + lados[1].length,
    bctx = {
      terreno: camTerrCasilla(x, y),
      fort: D.est === "campamento" ? CAM_K.fortCampo : 0,
      p,
      x,
      y,
      nombreLugar: p ? (camCiudadEn(x, y) ? p.name : `los campos de ${p.name}`) : "campo abierto",
      emboscada: !!o.emboscada,
    },
    u0 = lados.map((l) => l.map((e) => camUCampo(e.u)));
  camRep({ k: "bat+", x, y, lados: lados.map((l) => l.map((e) => ({ ej: e.id, f: e.f, dir: e.dir }))) });
  const r = await camBatallaLados(lados, bctx, {
    tipo: "encuentro",
    campo: D.est === "campamento",
    auto: o.auto,
    emboscada: o.emboscada,
    titulo: `Batalla de ${n} ejércitos en ${bctx.nombreLugar} (${lados[0].length} contra ${lados[1].length})`,
    factor: { k: "conjunto", s: 0, txt: `Batalla en conjunto: ${lados[0].length} contra ${lados[1].length} ejércitos` },
  });
  const win = r.gana === 0;
  lados.forEach((l, s) => l.forEach((e, i) => camTrasBatalla(e, u0[s][i], r.sup[s][i] || {}, s === 0 ? win : !win, r.rondas)));
  A.mov = 0;
  for (const e of lados[0]) e.mov = Math.min(e.mov, 0);
  const vence = win ? 0 : 1,
    pierde = 1 - vence,
    fv = lados[vence][0].f,
    fp = lados[pierde][0].f;
  if (lados.flat().some((e) => isMe(e.f)) || A.f === REB)
    addLog(
      `${CIV[fv].s}${lados[vence].some((e) => e.f !== fv) ? " y sus aliados" : ""} vencen a ${CIV[fp].s} en ${bctx.nombreLugar} (${lados[0].length} contra ${lados[1].length} ejércitos).`,
      lados[vence].some((e) => isMe(e.f)) ? "good" : lados[pierde].some((e) => isMe(e.f)) ? "bad" : "",
    );
  lados[pierde].forEach((e, i) => {
    if (!camEj(e.id)) return;
    const n0 = camTot(u0[pierde][i]);
    if (camTot(camUCampo(e.u)) <= 0 || camTot(camUCampo(e.u)) < n0 * 0.12) camDispersar(e, `deshecho en ${bctx.nombreLugar}`);
    else if (!camRetirar(e, x, y)) camDispersar(e, `cercado y rendido en ${bctx.nombreLugar}`);
  });
  for (const e of lados[vence]) if (camEj(e.id) && camTot(camUCampo(e.u)) <= 0) camQuitar(e, "sin hombres");
  camBatPrep = null;
  camTocar();
  return { ok: true, gana: win, lados: lados.map((l) => l.map((e) => e.id)) };
}
async function camChoque(A, D, o = {}) {
  const x = D.x,
    y = D.y,
    p = G.P[camPid(x, y)] || null,
    lados = o.solo ? [[A], [D]] : await camReunir(A, D, x, y, o),
    multi = lados[0].length > 1 || lados[1].length > 1;
  if (multi) return camChoqueConjunto(lados, x, y, p, o);
  camBatPrep = null;
  const ejA = camParaBatalla(A),
    ejD = camParaBatalla(D),
    uA0 = { ...ejA.u },
    uD0 = { ...ejD.u };
  /* socorro: si D asedia una ciudad de A (o de su aliado), la guarnición hace una salida a la vez */
  let sal = null,
    ps = null;
  if (D.est === "asedio" && D.asd != null) {
    ps = G.P[D.asd];
    if (ps && camAliado(A.f, ps.owner) && tot(ps.u) > 0) {
      sal = cmbVacio();
      for (const t of TYP) {
        sal[t] = Math.floor((ps.u[t] || 0) / 2);
        ps.u[t] -= sal[t];
      }
      cmbSuma(ejA.u, sal);
    }
  }
  const bctx = {
      terreno: camTerrCasilla(x, y),
      fort: D.est === "campamento" ? CAM_K.fortCampo : 0,
      p,
      x,
      y,
      nombreLugar: p ? (camCiudadEn(x, y) ? p.name : `los campos de ${p.name}`) : "campo abierto",
      emboscada: !!o.emboscada,
    };
  /* emboscada: mientras combate no lea ctx.emboscada, campaña da el bono de sorpresa al atacante */
  camBonoAct = o.emboscada ? [{ f: A.f, lado: "atacante", v: CAM_K.emboscada }] : null;
  let res;
  try {
    res = await camLibrar(ejA, ejD, bctx, {
      tipo: "encuentro",
      ejs: [A, D],
      campo: D.est === "campamento",
      auto: o.auto,
      titulo: `${o.emboscada ? "¡Emboscada! " : sal ? "Socorro de " + ps.name + ": " : "Encuentro "}en ${bctx.nombreLugar}`,
      factor: o.emboscada ? { k: "emboscada", s: 0, txt: `Emboscada desde el bosque (${CIV[A.f].s})` } : null,
    });
  } finally {
    camBonoAct = null;
  }
  let rA = res.A;
  if (sal) {
    /* los de la salida vuelven a la ciudad en proporción */
    const tot0 = cmbVacio();
    cmbSuma(tot0, ejA.u);
    for (const t of TYP) {
      if (!sal[t]) continue;
      const v = Math.round(((rA[t] || 0) * sal[t]) / Math.max(1, tot0[t]));
      ps.u[t] += v;
      rA[t] = Math.max(0, (rA[t] || 0) - v);
    }
  }
  const win = res.gana === 0;
  camTrasBatalla(A, uA0, rA, win, res.rondas);
  camTrasBatalla(D, uD0, res.D, !win, res.rondas);
  A.mov = 0;
  const vence = win ? A : D,
    pierde = win ? D : A,
    cls = isMe(A.f) === win || (isMe(D.f) && !win) ? "good" : isMe(A.f) || isMe(D.f) ? "bad" : "";
  if (isMe(A.f) || isMe(D.f) || A.f === REB)
    addLog(
      `${CIV[vence.f].s} vence a ${CIV[pierde.f].s} en ${bctx.nombreLugar}${sal ? " con la salida de la guarnición de " + ps.name : ""}.`,
      isMe(vence.f) ? "good" : isMe(pierde.f) ? "bad" : cls,
    );
  if (camTot(pierde.u) <= 0 || camTot(pierde.u) < camTot(pierde === A ? uA0 : uD0) * 0.12) camDispersar(pierde, `deshecho en ${bctx.nombreLugar}`);
  else if (!camRetirar(pierde, vence.x, vence.y)) camDispersar(pierde, `cercado y rendido en ${bctx.nombreLugar}`);
  if (camTot(vence.u) <= 0) camQuitar(vence);
  camTocar();
  return { ok: true, gana: win };
}

/* ---------- conquista de una ciudad (asalto, rendición o ciudad vacía) ---------- */
function camConquistar(p, ej, modo, D, ron) {
  const f = ej.f,
    old = p.owner,
    gD = p.gen,
    xpD = { ...cmbVetDe(p) },
    oriD = { ...cmbOriDe(p) };
  /* supervivientes del defensor: si no había cerco, se repliegan; si había, caen prisioneros */
  const cerco = camS().as[p.id];
  let ref = null;
  if (D && tot(D) && !(cerco && cerco.n > 0) && old < NF) {
    ref = MAP.adj[p.id]
      .map((i) => G.P[i])
      .filter((x) => x.owner === old)
      .sort((a, b) => tot(b.u) - tot(a.u))[0];
    if (ref) {
      cmbLlega(ref, D, cmbVetGanar(xpD, D, false, ron || 4), oriD);
      if (gD != null && G.C[gD] && G.C[gD].alive && ref.gen == null) ref.gen = gD;
    }
  }
  if (gD != null && G.C[gD] && G.C[gD].alive && !ref && R() < 0.3) kill(G.C[gD], "cae defendiendo " + p.name);
  /* la guarnición nueva: una cuarta parte del ejército (infantería primero); si es pequeño, entero */
  const gu = cmbVacio(),
    n = camTot(ej.u);
  let falta = n <= 3 ? n : Math.max(1, Math.ceil(n * 0.25));
  for (const t of ["i", "l", "p", "h", "a", ...TYP]) {
    if (falta <= 0) break;
    if (!UN[t] || UN[t].asedio || UN[t].merc) continue;
    const k = Math.min(falta, ej.u[t] || 0);
    gu[t] += k;
    ej.u[t] -= k;
    falta -= k;
  }
  Object.assign(p, {
    owner: f,
    u: gu,
    tired: true,
    recent: 3,
    order: Math.min(p.order, modo === "rendicion" ? 50 : 45),
    tax: 1,
    gen: null,
  });
  cmbVetFijar(p, ej.vet);
  cmbOriFijar(p, ej.ori);
  if (modo === "asalto" && p.walls) p.walls--;
  camAsedioFin(p.id);
  for (const e of camS().ej) if (e.asd === p.id) {
    e.asd = null;
    if (e.est === "asedio") e.est = "marcha";
  }
  OC.emitirSync("conquista", { p, de: old, a: f });
  if (f < NF && CIV[f].loot && camF(f)) camF(f).gold += CIV[f].loot;
  const cls = isMe(f) ? "good" : isMe(old) ? "bad" : "";
  addLog(
    modo === "rendicion"
      ? `${p.name} abre sus puertas a ${CIV[f].s}${old !== REB ? " y abandona a " + CIV[old].s : ""}.`
      : modo === "vacia"
        ? `${CIV[f].s} ocupa ${p.name}, que nadie defendía.`
        : `${CIV[f].s} toma al asalto ${p.name}${old !== REB ? " a " + CIV[old].s : ""}${ref ? `; los supervivientes huyen a ${ref.name}` : ""}.`,
    cls,
  );
  if (p.cap && old < REB && p.home === old) addLog(`¡Cae la capital de ${CIV[old].s}!`, cls);
  if (old < REB && !alive(old)) addLog(`${CIV[old].n} desaparece de la historia.`, isMe(old) ? "bad" : "good");
  /* el ejército entra en la ciudad (o se disuelve en ella si quedó vacío) */
  camSinMaquinas(ej);
  for (const e of camS().ej) if (e.f === f && e !== ej && camCheb(e.x, e.y, p.x, p.y) <= 1) camSinMaquinas(e);
  if (camTot(ej.u) <= 0) camQuitar(ej);
  else {
    const x0c = ej.x,
      y0c = ej.y;
    ej.x = p.x;
    ej.y = p.y;
    camRepMov(ej, x0c, y0c);
    ej.est = "marcha";
    ej.asd = null;
    ej.obj = null;
  }
  camTocar();
  checkEnd();
}

/* ---------- asedio ---------- */
const camAsedio = (pid) => camS().as[pid] || null;
const camSitiadores = (pid) =>
  camS().ej.filter((e) => e.asd === pid && e.est === "asedio" && camTot(e.u) > 0);
/* ---------- un cerco es de quien lo puso ----------
   Si A cerca una ciudad, otro bando B (aunque esté en guerra con su dueño) no puede asediarla por su
   cuenta, asaltarla ni ocuparla vacía: o se SUMA al cerco como co-sitiador (aliado de A, o en paz y A lo
   acepta: la IA según la relación, el jugador con un modal) o declara la guerra a A y lucha contra sus
   ejércitos. Al caer la ciudad es de quien inició el cerco (as.f); el botín se reparte según lo aportado.
   as.co = bandos aceptados; as.no = {f: año} rechazados (no se vuelve a pedir ese año). */
const camSocios = (as) => (as ? [as.f, ...(as.co || [])] : []);
function camCoCerco(as, f) {
  if (!as || as.f === f) return true;
  if ((as.co || []).includes(f)) return true;
  return f < NF && as.f < NF && camAliado(as.f, f);
}
/* cerco ajeno que impide a f tocar la ciudad (null si no lo hay o f puede sumarse ya) */
function camCercoAjeno(f, p) {
  const as = p ? camAsedio(p.id) : null;
  return as && !camCoCerco(as, f) ? as : null;
}
/* ¿acepta A que B se sume a su cerco? IA: aliado o relación ≥ 15 en paz; persona: modal (fuera del online) */
async function camPedirCerco(f, p) {
  const as = camAsedio(p.id);
  if (!as || camCoCerco(as, f)) return true;
  const A = as.f;
  if (A >= NF || f >= NF || camGuerra(A, f)) return false;
  as.no = as.no || {};
  if (as.no[f] === G.year) return false;
  let si;
  if (human(A) && isMe(A) && !net.on && !isMe(f)) {
    si =
      (await modal(
        `${CIV[f].s} pide sumarse a tu cerco`,
        `<p>${CIV[f].n} quiere cercar ${p.name} contigo. Si aceptas, sus ejércitos ocupan otros flancos y pueden entrar en un asalto conjunto; la ciudad será tuya (iniciaste el cerco) y el botín se reparte según lo que aporte cada uno.</p>`,
        [
          { t: "Aceptar", v: "si", cls: "gold" },
          { t: "Rechazar", v: "no" },
        ],
      )) === "si";
  } else si = (G.rel && G.rel[A] ? G.rel[A][f] || 0 : 0) >= 15;
  if (si) {
    as.co = [...new Set([...(as.co || []), f])];
    addLog(`${CIV[f].s} se suma al cerco de ${p.name} junto a ${CIV[A].s}.`, isMe(f) || isMe(A) ? "good" : "");
  } else {
    as.no[f] = G.year;
    if (isMe(f)) addLog(`${CIV[A].s} no quiere compartir el cerco de ${p.name}.`, "bad");
  }
  return si;
}
/* si el que inició el cerco ya no tiene ejércitos en él, pasa al co-sitiador más fuerte */
function camCercoReasignar(pid) {
  const as = camAsedio(pid);
  if (!as) return;
  const sit = camSitiadores(pid);
  if (!sit.length) {
    camAsedioFin(pid);
    return;
  }
  if (sit.some((e) => e.f === as.f)) return;
  const nuevo = sit.slice().sort((a, b) => pw(b.u) - pw(a.u) || a.id - b.id)[0].f;
  as.co = (as.co || []).filter((x) => x !== nuevo);
  as.f = nuevo;
}
function camAsediar(ej, p) {
  if (!p) return { ok: false, motivo: "Sin ciudad" };
  if (camCheb(ej.x, ej.y, p.x, p.y) > 1) return { ok: false, motivo: "Hay que llegar junto a la ciudad" };
  if (p.owner === ej.f || !camGuerra(ej.f, p.owner)) return { ok: false, motivo: "No estáis en guerra" };
  const ajeno = camCercoAjeno(ej.f, p);
  if (ajeno) return { ok: false, motivo: `${p.name} ya está cercada por ${CIV[ajeno.f].s}: únete a su cerco o declárale la guerra`, ajeno: ajeno.f };
  if (!tot(p.u) && !(p.walls > 0) && !camAsedio(p.id)) {
    camConquistar(p, ej, "vacia", null, 0);
    return { ok: true, tomada: true };
  }
  const S = camS();
  if (!S.as[p.id]) {
    S.as[p.id] = {
      p: p.id,
      f: ej.f,
      n: 0,
      vi: 2 + (p.walls || 0) + (p.cap ? 1 : 0) + ((p.farm || 0) > 0 ? 1 : 0),
      mo: 70 + (p.walls || 0) * 5,
      brecha: 0,
      ini: [G.year, G.estacion],
    };
    camRep({ k: "ase", p: p.id, f: ej.f, fase: "ini" });
    addLog(`${CIV[ej.f].s} pone cerco a ${p.name}${p.owner !== REB ? ", ciudad de " + CIV[p.owner].s : ""}.`, isMe(ej.f) ? "good" : isMe(p.owner) ? "bad" : "");
  }
  ej.est = "asedio";
  ej.asd = p.id;
  ej.mov = 0;
  ej.plan = null;
  camTocar();
  return { ok: true };
}
/* murallas que quedan en pie para el asalto según las máquinas (ctx.fort ya es el efectivo) */
function camFortEf(p, ej, as) {
  /* si combate define las máquinas (UN[k] en TYP), van como unidades en ejA.u y él calcula su brecha
     en el asalto; aquí solo cuenta la brecha abierta por el bombardeo de las estaciones de cerco */
  const m = camMaq(ej),
    sin = (k) => (UN[k] && TYP.includes(k) ? 0 : m[k]),
    red = (as ? as.brecha || 0 : 0) + Math.min(2, sin("ari")) * CAM_MAQ.ari.fort + sin("tor") * CAM_MAQ.tor.fort + sin("cat") * CAM_MAQ.cat.fort;
  return Math.max(0, Math.round(((p.walls || 0) - red) * 100) / 100);
}
function camCtxAsalto(ej, p) {
  const as = camAsedio(p.id);
  return {
    fort: camFortEf(p, ej, as),
    murallas: p.walls || 0,
    asedio: as ? as.n : 0,
    maquinas: camMaq(ej),
    p,
    x: p.x,
    y: p.y,
    nombreLugar: p.name,
    terreno: cmbTerreno(p),
  };
}
function camGuarnicion(p) {
  const as = camAsedio(p.id);
  return { f: p.owner, u: { ...p.u }, gen: p.gen, vet: cmbVetDe(p), ori: cmbOriDe(p), fat: 0, hambre: as ? as.vi < 0 : false };
}
/* ---------- asalto (de un ejército o conjunto, por varios flancos) ----------
   Fuerza conjunta: tropas y máquinas sumadas, veteranía ponderada por hombres, origen de quien más aporta,
   el mejor general al mando (mando y nivel) y +3 % de daño por cada general más (máx. +9 %, OC 'bonoBatalla').
   Cada flanco extra (ctx.flancos) reparte a los defensores: −15 % de bono de murallas y −5 de moral de la
   guarnición por flanco (lo aplica batalla.js, marcado CAM). Supervivientes, heridos y botín se reparten
   según lo que aportó cada ejército. */
let camBonoAct = null;
OC.mod("bonoBatalla", (v, c) => {
  const l = !camBonoAct ? [] : Array.isArray(camBonoAct) ? camBonoAct : [camBonoAct],
    m = c ? l.filter((x) => x && x.f === c.f && (x.lado || "atacante") === c.lado) : [];
  return m.length ? m.reduce((a, x) => a * x.v, v) : undefined;
});
const camBonoGen = (f, n, lado) => (n > 0 ? { f, lado, v: 1 + Math.min(0.09, 0.03 * n) } : null);
/* k flancos en un contexto de asalto cualquiera (estimaciones de la IA); combate los aplica de forma nativa */
const camCtxFlancos = (ctx, k) => ({ ...ctx, flancos: Math.max(1, k || 1) });
function camFuerzaConjunta(ejs, campo) {
  const u = cmbVacio(),
    vet = {},
    ori = {},
    mx = {},
    aport = [];
  let fat = 0,
    ham = 0;
  for (const e of ejs) {
    const b = camParaBatalla(e),
      m = camMaq(e);
    /* con UN[ari/tor/cat] definidos (combate v2), las máquinas van como unidades en el asalto */
    if (!campo) for (const k in CAM_MAQ) if (UN[k] && TYP.includes(k) && m[k]) b.u[k] = m[k];
    aport.push(b.u);
    const n0 = camTot(b.u);
    fat += (b.fat || 0) * n0;
    if (b.hambre) ham += n0;
    for (const t in b.u) {
      const n = b.u[t] || 0;
      if (!n) continue;
      const a = u[t] || 0;
      vet[t] = ((vet[t] || 0) * a + ((e.vet && e.vet[t]) || 0) * n) / (a + n);
      if (n > (mx[t] || 0) && e.ori && e.ori[t] != null) {
        mx[t] = n;
        ori[t] = e.ori[t];
      }
      u[t] = a + n;
    }
  }
  const N = Math.max(1, camTot(u)),
    gens = ejs
      .map(camGen)
      .filter(Boolean)
      .sort((a, b) => b.ma - a.ma || (b.xp || 0) - (a.xp || 0) || a.id - b.id);
  return {
    ej: { f: ejs[0].f, u, gen: gens.length ? gens[0].id : null, vet, ori, fat: Math.round(fat / N), hambre: ham * 2 > N },
    aport,
    extraGen: Math.max(0, gens.length - 1),
    /* desglose por ejército y facción (para batallas de varios bandos aliados: cmbResolverMulti) */
    por: ejs.map((e, i) => ({ ej: e.id, f: e.f, u: aport[i], gen: e.gen })),
  };
}
/* reparte los supervivientes de cada clase en proporción a lo que aportó cada ejército (restos mayores) */
function camRepartir(fin, aport) {
  const r = aport.map(() => ({}));
  const ts = new Set(aport.flatMap((a) => Object.keys(a)));
  for (const t of ts) {
    const tot0 = aport.reduce((s, a) => s + (a[t] || 0), 0),
      v = Math.min(tot0, Math.max(0, Math.round((fin && fin[t]) || 0)));
    if (!tot0) continue;
    const ex = aport.map((a) => ((a[t] || 0) * v) / tot0),
      base = ex.map(Math.floor);
    let resto = v - base.reduce((a, b) => a + b, 0);
    ex.map((x, i) => [x - base[i], i])
      .sort((a, b) => b[0] - a[0] || a[1] - b[1])
      .forEach(([, i]) => {
        if (resto > 0) {
          base[i]++;
          resto--;
        }
      });
    base.forEach((n, i) => (r[i][t] = n));
  }
  return r;
}
/* contexto del asalto: murallas menos la brecha del bombardeo; flancos cubiertos por los participantes */
function camCtxAsalto(ej, p, ejs) {
  const as = camAsedio(p.id),
    l = ejs && ejs.length ? ejs : [ej],
    m = { ari: 0, tor: 0, cat: 0 };
  for (const e of l) {
    const x = camMaq(e);
    for (const k in m) m[k] += x[k] || 0;
  }
  const fz = { u: {}, maq: {} };
  for (const k in m) {
    if (UN[k] && TYP.includes(k)) fz.u[k] = m[k];
    else fz.maq[k] = m[k];
  }
  /* flancos: combate los aplica de forma nativa (murallas, moral y frente de la guarnición) */
  const k = Math.max(1, camLadosDe(l, p).length);
  return {
    fort: camFortEf(p, fz, as),
    murallas: p.walls || 0,
    asedio: as ? as.n : 0,
    estaciones: as ? as.n : 0,
    maquinas: m,
    flancos: k,
    p,
    x: p.x,
    y: p.y,
    nombreLugar: p.name,
    terreno: cmbTerreno(p),
  };
}
/* probabilidad de tomar la ciudad con estos ejércitos (la IA y el panel) */
function camEstimarAsalto(ejs, p, n = 6) {
  if (!ejs.length || !tot(p.u)) return 1;
  const F = camFuerzaConjunta(ejs);
  camBonoAct = F.extraGen ? { f: ejs[0].f, v: 1 + Math.min(0.09, 0.03 * F.extraGen) } : null;
  try {
    return cmbEstimar(F.ej, camGuarnicion(p), camCtxAsalto(ejs[0], p, ejs), n);
  } finally {
    camBonoAct = null;
  }
}
let camAnimAsalto = null; // {p, t0, ejs:[[x, y, f]]}: animación breve del asalto conjunto
/* multiplicador de tiempo de las animaciones de campaña (interfaz: ifzVel, «lenta» ≈ 2,5) */
const camVel = () => (typeof ifzVel === "function" ? +ifzVel() || 1 : 1);
async function camAsaltar(ej, o = {}) {
  const p = G.P[ej.asd != null ? ej.asd : -1] || (o.p != null ? G.P[o.p] : null);
  if (!p || camCheb(ej.x, ej.y, p.x, p.y) > 1 || !camGuerra(ej.f, p.owner)) return { ok: false, motivo: "No hay ciudad que asaltar" };
  const clave = camClaveEst();
  if (ej.acc === clave) return { ok: false, motivo: "Este ejército ya asaltó esta estación" };
  const ajeno = camCercoAjeno(ej.f, p),
    cerco = camAsedio(p.id);
  if (ajeno) return { ok: false, motivo: `${p.name} está cercada por ${CIV[ajeno.f].s}: únete a su cerco o declárale la guerra`, ajeno: ajeno.f };
  /* un co-sitiador no asalta por su cuenta: solo junto a los ejércitos de quien inició el cerco */
  let con = Array.isArray(o.con) && o.con.length ? o.con : null;
  if (cerco && cerco.f !== ej.f) {
    const suyos = camParticipantes(ej, p).filter((e) => e.f === cerco.f);
    if (!suyos.length) return { ok: false, motivo: `Solo puedes asaltar ${p.name} junto a ${CIV[cerco.f].s}, que inició el cerco` };
    con = [...new Set([...(con || []), ...suyos.map((e) => e.id)])];
  }
  if (!tot(p.u)) {
    const dueno = cerco ? camParticipantes(ej, p).find((e) => e.f === cerco.f) || ej : ej;
    camConquistar(p, dueno, "vacia", null, 0);
    return { ok: true, gana: true };
  }
  const ejs = con ? camParticipantes(ej, p, con) : [ej],
    k = Math.max(1, camLadosDe(ejs, p).length),
    F = camFuerzaConjunta(ejs),
    bctx = camCtxAsalto(ej, p, ejs),
    ejD = camGuarnicion(p),
    aportPw = F.aport.map((a) => pw(camUCampo(a))),
    /* entra (y se queda la ciudad) el ejército que más aporta de quien inició el cerco; sin cerco, el que más aporta */
    li = aportPw.reduce((b, v, i) => ((!cerco || ejs[i].f === cerco.f) && (b < 0 || v > aportPw[b]) ? i : b), -1),
    lider = ejs[li >= 0 ? li : aportPw.indexOf(Math.max(...aportPw))];
  for (const e of ejs) e.acc = clave;
  if (ejs.length > 1) {
    camAnimAsalto = { p: p.id, t0: performance.now(), ejs: ejs.map((e) => [e.x, e.y, e.f]) };
    if (o.anim && !reduce) await sleep(Math.round(650 * camVel()));
  }
  const oB = {
    tipo: "asalto",
    ejs: [lider, null],
    auto: o.auto,
    titulo: ejs.length > 1 ? `Asalto conjunto a ${p.name} (${ejs.length} ejércitos, ${k} ${k > 1 ? "flancos" : "flanco"})` : `Asalto a ${p.name}`,
    factor: k > 1 ? { k: "flancos", s: 0, txt: `Asalto por ${k} flancos (${CIV[ej.f].s})` } : null,
    ejercitos: [ejs.map((e) => ({ id: e.id, f: e.f, dir: camFlanco(e.x - p.x, e.y - p.y) })), [{ id: "guarnicion", f: p.owner, dir: "C" }]],
  };
  let res,
    partesM = null;
  /* con batallas de varios bandos en combate, cada ejército va por separado (su facción, su flanco, su general) */
  if (ejs.length > 1 && typeof cmbResolverMulti === "function") {
    const lista = ejs.map((e, i) => ({ ...camParaBatalla(e), id: e.id, bando: 0, dir: camFlanco(e.x - p.x, e.y - p.y), u: F.aport[i] }));
    lista.push({ ...ejD, id: "guarnicion", bando: 1, dir: "C" });
    const r = await camMulti(lista, bctx, oB, [F.ej, ejD]);
    if (r) {
      partesM = ejs.map((e) => r.by.get(e.id) || cmbVacio());
      res = { gana: r.gana, D: r.by.get("guarnicion") || cmbVacio(), rondas: r.rondas, informe: r.informe };
    }
  }
  if (!res) {
    camBonoAct = camBonoGen(ej.f, F.extraGen, "atacante");
    try {
      res = await camLibrar(F.ej, ejD, bctx, oB);
    } finally {
      camBonoAct = null;
    }
  }
  const win = res.gana === 0,
    partes = partesM || camRepartir(res.A, F.aport),
    bajas = [];
  ejs.forEach((e, i) => {
    const n0 = camTot(camUCampo(F.aport[i]));
    camTrasBatalla(e, F.aport[i], partes[i], win, res.rondas);
    for (const q in CAM_MAQ) if (UN[q] && TYP.includes(q) && e.u[q] != null) e.u[q] = partes[i][q] || 0;
    e.mov = 0;
    bajas.push({ ej: e.id, f: e.f, n0, n1: camTot(camUCampo(e.u)) });
  });
  if (win) {
    /* botín de la ciudad tomada, repartido según lo aportado (entre bandos aliados) */
    if (ejs.length > 1) {
      const pob = typeof ecoPob === "function" ? ecoPob(p) : 8,
        botin = Math.round(4 + pob * 0.4),
        sum = aportPw.reduce((a, b) => a + b, 0) || 1,
        porF = {};
      ejs.forEach((e, i) => (porF[e.f] = (porF[e.f] || 0) + Math.round((botin * aportPw[i]) / sum)));
      for (const f in porF) if (+f < NF && camF(+f)) OC.ganar(+f, { oro: porF[f] });
      addLog(
        `Asalto conjunto a ${p.name} por ${k} ${k > 1 ? "flancos" : "flanco"} (${camLadosDe(ejs, p).map((l) => CAM_LADO_N[l]).join(", ")}): ${ejs.length} ejércitos, botín de ${botin} de oro.`,
        isMe(ej.f) ? "good" : isMe(p.owner) ? "bad" : "",
      );
    }
    camConquistar(p, lider, "asalto", res.D, res.rondas);
  } else {
    p.u = cmbNorm(res.D);
    const as = camAsedio(p.id);
    if (as) as.mo = clamp(as.mo + 10, 0, 100);
    addLog(
      `${CIV[ej.f].s} fracasa en el ${ejs.length > 1 ? `asalto conjunto (${ejs.length} ejércitos)` : "asalto"} a ${p.name}.`,
      isMe(ej.f) ? "bad" : isMe(p.owner) ? "good" : "",
    );
    const resto = ejs.reduce((s, e) => s + camTot(camUCampo(e.u)), 0);
    for (const e of ejs) {
      if (!camEj(e.id)) continue;
      if (camTot(camUCampo(e.u)) <= 0) camDispersar(e, `deshecho al pie de las murallas de ${p.name}`);
      else if (resto < tot(p.u) * 0.4 && !human(e.f)) camLevantar(e);
    }
  }
  camTocar();
  return { ok: true, gana: win, ejs: ejs.map((e) => e.id), flancos: k, bajas };
}
/* las máquinas no se llevan de campaña: se abandonan (o queman) al acabar el cerco */
function camSinMaquinas(ej) {
  for (const k in CAM_MAQ) if (ej.u && ej.u[k]) ej.u[k] = 0;
  ej.maq = {};
  ej.obra = [];
}
function camLevantar(ej) {
  const pid = ej.asd;
  ej.est = "marcha";
  ej.asd = null;
  camSinMaquinas(ej);
  if (pid != null && !camSitiadores(pid).length) {
    camAsedioFin(pid);
    const p = G.P[pid];
    if (p) addLog(`${CIV[ej.f].s} levanta el cerco de ${p.name}.`, isMe(p.owner) ? "good" : "");
  } else if (pid != null) camCercoReasignar(pid);
  camTocar();
  return { ok: true };
}
/* salida de los sitiados contra el ejército sitiador más débil */
async function camSalida(p, o = {}) {
  const sit = camSitiadores(p.id).sort((a, b) => pw(a.u) - pw(b.u))[0];
  if (!sit || !tot(p.u)) return { ok: false, motivo: "Nadie a quien atacar" };
  const ejA = camGuarnicion(p),
    ejD = camParaBatalla(sit),
    uD0 = { ...ejD.u },
    uA0 = { ...ejA.u },
    bctx = {
      terreno: camTerrCasilla(sit.x, sit.y),
      fort: 0,
      p,
      x: sit.x,
      y: sit.y,
      nombreLugar: `las puertas de ${p.name}`,
    };
  const res = await camLibrar(ejA, ejD, bctx, { tipo: "salida", ejs: [null, sit], auto: o.auto, titulo: `Salida desde ${p.name}` });
  const win = res.gana === 0;
  /* los que salen vuelven tras las murallas */
  p.u = cmbNorm({ ...res.A });
  cmbVetFijar(p, cmbVetGanar(cmbVetDe(p), p.u, win, res.rondas));
  camTrasBatalla(sit, uD0, res.D, !win, res.rondas);
  const as = camAsedio(p.id);
  if (as) as.mo = clamp(as.mo + (win ? 15 : -10), 0, 100);
  addLog(
    `La guarnición de ${p.name} hace una salida ${win ? "y rompe el cerco" : "y es rechazada"}.`,
    isMe(p.owner) === win ? "good" : isMe(p.owner) || isMe(sit.f) ? "bad" : "",
  );
  if (win) {
    if (camTot(sit.u) < camTot(uD0) * 0.12) camDispersar(sit, `roto ante ${p.name}`);
    else if (!camRetirar(sit, p.x, p.y)) camDispersar(sit, `cercado ante ${p.name}`);
    if (!camSitiadores(p.id).length) camAsedioFin(p.id);
  }
  void uA0;
  camTocar();
  return { ok: true, gana: win };
}
/* máquinas de asedio: se pagan al empezar y se terminan al cabo de sus estaciones */
function camCosteMaq(f, k) {
  /* OC costeMaquina: coste de una máquina de asedio. ctx {f, k} */
  const c = { ...(OC.calc("costeMaquina", { ...CAM_MAQ[k].coste }, { f, k }) || CAM_MAQ[k].coste) };
  if (OC.puedePagar(f, c)) return c;
  /* sin madera suficiente: se compra a 3 de oro por unidad que falte */
  const r = { oro: c.oro || 0 };
  for (const id in c) {
    if (id === "oro") continue;
    const tiene = Math.max(0, Math.floor(OC.saldo(f, id)));
    if (tiene >= c[id]) r[id] = c[id];
    else {
      if (tiene > 0) r[id] = tiene;
      r.oro += (c[id] - tiene) * 3;
    }
  }
  return r;
}
function camPuedeMaq(ej, k) {
  const d = CAM_MAQ[k];
  if (!d) return "Máquina desconocida";
  if (ej.est !== "asedio") return "Solo durante un asedio";
  const ya = camMaq(ej)[k] + (ej.obra || []).filter((o) => o.t === k).length;
  if (ya >= d.max) return `Máximo ${d.max}`;
  if (!camF(ej.f) || !OC.puedePagar(ej.f, camCosteMaq(ej.f, k))) return "Faltan recursos";
  return "";
}
function camConstruir(ej, k) {
  const m = camPuedeMaq(ej, k);
  if (m) return { ok: false, motivo: m };
  OC.pagar(ej.f, camCosteMaq(ej.f, k));
  ej.obra = ej.obra || [];
  /* OC estacionesMaquina: estaciones de obra. ctx {f, k, ej} */
  const q = Math.max(1, Math.round(OC.calc("estacionesMaquina", CAM_MAQ[k].est, { f: ej.f, k, ej }) || CAM_MAQ[k].est));
  ej.obra.push({ t: k, q });
  if (isMe(ej.f)) addLog(`Los carpinteros del ${camNombre(ej).toLowerCase()} empiezan ${k === "ari" ? "un ariete" : k === "tor" ? "una torre de asedio" : "una catapulta"} (${q} ${q > 1 ? "estaciones" : "estación"}).`);
  return { ok: true };
}

/* ---------- un paso de marcha (lo usan la marcha y la resolución simultánea) ---------- */
async function camDarPaso(ej, j, o = {}) {
  const [x, y] = camXY(j),
    f = ej.f;
  if (camCheb(ej.x, ej.y, x, y) !== 1) return { ok: false, parar: true };
  const diag = x !== ej.x && y !== ej.y,
    c = camCoste(f, j) * (diag ? CAM_K.diag : 1);
  if (diag && (!camPasable(x, ej.y) || !camPasable(ej.x, y))) return { ok: false, parar: true };
  if (!Number.isFinite(c) || ej.mov + 1e-9 < c) return { ok: false, parar: true, sinMov: true };
  const pid = MAP.grid[y][x];
  if (pid < 0 || !camPaso(f, G.P[pid].owner, ej)) return { ok: false, parar: true };
  const otros = camEjsEn(x, y, ej.id);
  const ene = otros.filter((e) => camGuerra(f, e.f)).sort((a, b) => pw(b.u) - pw(a.u))[0];
  if (ene) {
    /* emboscada: sale de un bosque contra quien no lo veía (bono de sorpresa; ctx.emboscada para combate) */
    const emb = typeof camNieblaOn === "function" && camNieblaOn() && camEsBosque(ej.x, ej.y) && !camVeEj(ene.f, ej);
    await camChoque(ej, ene, { ...o, emboscada: emb });
    return { ok: false, parar: true, batalla: true };
  }
  if (otros.some((e) => e.f !== f)) return { ok: false, parar: true };
  const ciu = camCiudadEn(x, y);
  if (ciu && ciu.owner !== f && camGuerra(f, ciu.owner)) {
    if (camCiudadCerrada(f, ciu) || camCercoAjeno(f, ciu)) return { ok: false, parar: true, ciudad: ciu.id };
    ej.mov -= c;
    camConquistar(ciu, ej, "vacia", null, 0);
    return { ok: true, c, parar: true };
  }
  /* animación: la interfaz interpola de (x0, y0) a la casilla nueva durante dur ms (solo con o.anim) */
  const x0r = ej.x,
    y0r = ej.y;
  ej.anim = o.anim && !reduce ? { x0: ej.x, y0: ej.y, t0: performance.now(), dur: typeof ifzPasoMs === "function" ? ifzPasoMs() : Math.round((o.lento ? 90 : 55) * camVel()) } : null;
  ej.x = x;
  ej.y = y;
  camRep({ k: "mov", ej: ej.id, f, de: [x0r, y0r], a: [x, y] });
  ej.mov = Math.max(0, Math.round((ej.mov - c) * 100) / 100);
  ej.fat = clamp((ej.fat || 0) + c * CAM_K.fatPaso, 0, 100);
  if (ej.est === "campamento" || ej.est === "asedio") {
    if (ej.est === "asedio") camLevantar(ej);
    ej.est = "marcha";
  }
  ej.pas = (ej.pas || []).concat([j]).slice(-24);
  camTocar();
  if (o.anim && !reduce && ej.anim) {
    await sleep(ej.anim.dur);
    ej.anim = null;
  }
  /* zona de control: se para, salvo que el paso siguiente sea atacar a ese enemigo */
  const sig = o.sig != null ? camXY(o.sig) : null,
    ataca = sig && camEjsEn(sig[0], sig[1], ej.id).some((e) => camGuerra(f, e.f));
  return { ok: true, c, parar: camZocEn(f, x, y) && !ataca };
}
/* recorre una ruta hasta agotar el movimiento; guarda lo que falte en ej.plan */
async function camMarchar(ej, ruta, plan, o = {}) {
  let k = 0;
  for (; k < ruta.length; k++) {
    if (!camEj(ej.id)) return { ok: true, fin: true };
    const r = await camDarPaso(ej, ruta[k], { ...o, sig: ruta[k + 1] });
    if (!r.ok || r.parar) {
      if (r.ok) k++;
      break;
    }
  }
  if (!camEj(ej.id)) return { ok: true };
  const llego = k >= ruta.length;
  ej.plan = llego || !plan ? null : plan;
  if (llego && plan && plan.luego) await camLuego(ej, plan, o);
  return { ok: true, llego };
}
async function camLuego(ej, plan, o) {
  if (!camEj(ej.id)) return;
  const p = plan.p != null ? G.P[plan.p] : null;
  if (plan.luego === "asediar" && p) camAsediar(ej, p);
  else if (plan.luego === "asaltar" && p) {
    const r = camAsediar(ej, p);
    if (r.ok && !r.tomada) await camAsaltar(ej, { ...o, con: Array.isArray(plan.con) ? plan.con : null });
  } else if (plan.luego === "acampar") camAcampar(ej);
  else if (plan.luego === "disolver") camDisolver(ej);
  else if (plan.luego === "unir" && plan.con != null) camUnir(camEj(plan.con), ej);
}
function camAcampar(ej) {
  if (ej.est === "asedio") return { ok: false, motivo: "Ya está asediando" };
  ej.est = "campamento";
  ej.mov = 0;
  ej.plan = null;
  camTocar();
  return { ok: true };
}
/* ruta hacia un destino: dentro del alcance o, si no, plan de varias estaciones */
function camPlanRuta(ej, x, y, o = {}) {
  const pc = camCiudadEn(x, y),
    asedio = pc && pc.owner !== ej.f && (camCiudadCerrada(ej.f, pc) || (camAsedio(pc.id) && camGuerra(ej.f, pc.owner)));
  const D = camDijkstra(ej, { sinZoc: !!o.sinZoc });
  let j = camIdx(x, y),
    luego = o.luego || null,
    pid = o.p != null ? o.p : null;
  if (asedio) {
    j = camJuntoA(ej, pc, D);
    if (j < 0) return null;
    luego = luego || "asediar";
    pid = pc.id;
  } else if (pc && pc.owner === ej.f && !luego && !o.noEntrar) luego = "disolver";
  else if (!pc && !camPasable(x, y)) {
    /* destino en una montaña o en un río sin puente: se marcha a la casilla transitable más cercana */
    let best = -1,
      bk = Infinity;
    for (let r = 1; r <= 2 && best < 0; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const a = x + dx,
            b = y + dy;
          if (camCheb(a, b, x, y) !== r || !camPasable(a, b)) continue;
          const i = camIdx(a, b);
          if (Number.isFinite(D.dist[i]) && D.dist[i] < bk) {
            bk = D.dist[i];
            best = i;
          }
        }
    if (best < 0) return null;
    j = best;
    [x, y] = camXY(best);
  }
  if (j === D.s) return { ruta: [], plan: { x, y, luego, p: pid, con: o.con } };
  const r = camCamino(D, j);
  if (!r) return null;
  return { ruta: r, plan: { x, y, luego, p: pid, con: o.con } };
}

/* ======================================================================
   ÓRDENES: la API pública. Cada orden es un objeto plano (JSON) con f = bando que la da.
   ====================================================================== */
const CAM_ORDENES = ["formar", "mover", "acampar", "asediar", "asaltar", "construir", "levantar", "disolver", "dividir", "unir", "general", "salida", "contratar", "licenciar", "renovar", "apoyo", "espia", "espiaMover", "mision", "espiaRetirar"];
async function camAplicarOrden(g, o, opc = {}) {
  if (g && g !== G) return { ok: false, motivo: "Estado distinto del de la partida" };
  if (!o || !CAM_ORDENES.includes(o.tipo)) return { ok: false, motivo: "Orden desconocida" };
  camS();
  const ej = o.ej != null ? camEj(o.ej) : null;
  if (o.ej != null && (!ej || (o.f != null && ej.f !== o.f))) return { ok: false, motivo: "Ejército desconocido" };
  let r;
  switch (o.tipo) {
    case "formar":
      r = camFormar(o.f, G.P[o.p], o.u || {}, o.gen !== false);
      if (r.ok) r = { ok: true, ej: r.ej.id };
      break;
    case "mover": {
      const pr = camPlanRuta(ej, o.x, o.y, { luego: o.luego, p: o.p, con: o.con, noEntrar: o.noEntrar });
      if (!pr) {
        r = { ok: false, motivo: "No hay camino" };
        break;
      }
      r = await camMarchar(ej, pr.ruta, pr.plan, opc);
      break;
    }
    case "apoyo":
      /* «unirse a la batalla»: si este ejército acude a las batallas vecinas (siempre | nunca | id de un ejército) */
      ej.apoyo = o.modo === "nunca" ? "nunca" : o.modo == null || o.modo === "siempre" ? "siempre" : +o.modo;
      r = { ok: true };
      break;
    case "acampar":
      r = camAcampar(ej);
      break;
    case "asediar":
      r = camAsediar(ej, G.P[o.p != null ? o.p : -1]);
      break;
    case "asaltar":
      /* asalto conjunto: {tipo:'asaltar', f, ej, con:[ids de los demás ejércitos junto a la ciudad]} */
      r = await camAsaltar(ej, { ...opc, p: o.p, con: Array.isArray(o.con) ? o.con.map(Number) : null });
      break;
    case "construir":
      r = camConstruir(ej, o.maq);
      break;
    case "levantar":
      r = camLevantar(ej);
      break;
    case "disolver":
      r = camDisolver(ej);
      break;
    case "dividir":
      r = camDividir(ej, o.frac || 0.5);
      if (r.ok) r = { ok: true, ej: r.ej.id };
      break;
    case "unir":
      r = camUnir(ej, camEj(o.con));
      break;
    case "general": {
      const c = G.C[o.c];
      if (o.c == null) {
        ej.gen = null;
        r = { ok: true };
      } else if (!c || !c.alive || c.f !== ej.f || c.dipReh) r = { ok: false, motivo: "No puede mandar" };
      else {
        G.P.forEach((q) => {
          if (q.gen === c.id) q.gen = null;
        });
        camS().ej.forEach((e) => {
          if (e.gen === c.id) e.gen = null;
        });
        ej.gen = c.id;
        r = { ok: true };
      }
      break;
    }
    case "salida": {
      const p = G.P[o.p];
      r = p && p.owner === o.f ? await camSalida(p, opc) : { ok: false, motivo: "No es tu ciudad" };
      break;
    }
    default:
      r = ["espia", "espiaMover", "mision", "espiaRetirar"].includes(o.tipo)
        ? await camEspOrden(o)
        : typeof camMercOrden === "function"
          ? camMercOrden(o, ej)
          : { ok: false, motivo: "Sin mercenarios" };
  }
  camTocar();
  return r || { ok: false };
}
/* Órdenes de varios bandos a la vez (IA de cada estación y, en el futuro, jugadores online).
   1) Las órdenes que no son de marcha se aplican primero, ordenadas por (f, ej, tipo).
   2) Las marchas avanzan paso a paso: en cada vuelta mueve antes quien llega antes a su siguiente casilla
      (tiempo = coste acumulado / alcance máximo; empate: más rápido, luego id menor). Si dos bandos en guerra
      quieren la misma casilla, el que llega primero la ocupa y el segundo le ataca (batalla de encuentro). */
const camOrdCmp = (a, b) => (a.f - b.f) || ((a.ej || 0) - (b.ej || 0)) || String(a.tipo).localeCompare(String(b.tipo));
async function camResolverSimultaneo(g, ordenes, opc = {}) {
  if (g && g !== G) return [];
  const res = [],
    mov = ordenes.filter((o) => o && o.tipo === "mover").slice().sort(camOrdCmp),
    otras = ordenes.filter((o) => o && o.tipo !== "mover").slice().sort(camOrdCmp);
  for (const o of otras) res.push({ o, r: await camAplicarOrden(g, o, opc) });
  const vs = [];
  for (const o of mov) {
    const ej = camEj(o.ej);
    if (!ej || (o.f != null && ej.f !== o.f)) continue;
    const pr = camPlanRuta(ej, o.x, o.y, { luego: o.luego, p: o.p, con: o.con, noEntrar: o.noEntrar });
    if (!pr) {
      res.push({ o, r: { ok: false, motivo: "No hay camino" } });
      continue;
    }
    vs.push({ o, ej, ruta: pr.ruta, plan: pr.plan, k: 0, acum: 0, fin: !pr.ruta.length, mx: Math.max(1, camMovMax(ej)) });
  }
  for (let vuelta = 0; vuelta < 400 && vs.some((v) => !v.fin); vuelta++) {
    const act = vs
      .filter((v) => !v.fin)
      .map((v) => {
        const j = v.ruta[v.k],
          [x, y] = camXY(j),
          c = camCoste(v.ej.f, j) * (x !== v.ej.x && y !== v.ej.y ? CAM_K.diag : 1);
        return { v, t: (v.acum + c) / v.mx };
      })
      .sort((a, b) => a.t - b.t || b.v.mx - a.v.mx || a.v.ej.id - b.v.ej.id);
    for (const { v } of act) {
      if (!camEj(v.ej.id)) {
        v.fin = true;
        continue;
      }
      const r = await camDarPaso(v.ej, v.ruta[v.k], { ...opc, sig: v.ruta[v.k + 1] });
      if (r.ok) {
        v.k++;
        v.acum += r.c;
      }
      if (!r.ok || r.parar || v.k >= v.ruta.length) v.fin = true;
    }
  }
  for (const v of vs) {
    if (!camEj(v.ej.id)) {
      res.push({ o: v.o, r: { ok: true, fin: true } });
      continue;
    }
    const llego = v.k >= v.ruta.length;
    v.ej.plan = llego ? null : v.plan;
    if (llego && v.plan.luego) await camLuego(v.ej, v.plan, opc);
    res.push({ o: v.o, r: { ok: true, llego } });
  }
  return res;
}

/* ---------- la estación: lo que pasa al terminar (lo llama turnos.js) ---------- */
async function camEstacion() {
  if (!G || G.over) return;
  const S = camS();
  camRepIni();
  /* 1) la IA da sus órdenes; las marchas de todos se resuelven a la vez */
  const ords = [];
  for (let f = 0; f < NF; f++) {
    if (G.over) return;
    if (human(f) || !alive(f)) continue;
    try {
      if (typeof camEspIA === "function") camEspIA(f);
      if (typeof camIA === "function") ords.push(...(await camIA(f)));
    } catch (e) {
      console.error("[cam] IA", f, e);
    }
  }
  if (typeof camIARebeldes === "function") ords.push(...camIARebeldes());
  await camResolverSimultaneo(G, ords, { auto: false });
  /* 2) asedios, obras, víveres, mercenarios */
  await camAsedios();
  if (typeof camEspias === "function") await camEspias();
  camObras();
  camSuministros();
  if (typeof camMercEstacion === "function") await camMercEstacion();
  for (const e of S.ej.slice()) if (camTot(e.u) <= 0) camQuitar(e);
}
/* al empezar la estación siguiente: movimiento nuevo y marchas pendientes del jugador */
async function camNuevaEstacion() {
  if (!G) return;
  const S = camS();
  if (!S.rep) camRepIni();
  for (const e of S.ej.slice()) {
    if (e.f < NF && !alive(e.f)) {
      camQuitar(e);
      continue;
    }
    if (e.gen != null && (!camGen(e) || G.P.some((p) => p.gen === e.gen))) e.gen = null;
    e.mov = camMovMax(e);
    /* ejército varado en tierra de un reino en paz (derecho de salida): aviso y, si se queda, enfado */
    const pr = camProv(e);
    if (pr && e.f < NF && pr.owner < NF && !camPaso(e.f, pr.owner)) {
      e.intruso = (e.intruso || 0) + 1;
      if (e.intruso === 1 && (isMe(e.f) || isMe(pr.owner)))
        addLog(`${camNombre(e)} (${CIV[e.f].s}) está en tierras de ${CIV[pr.owner].s} sin derecho de paso: debe salir.`, isMe(e.f) ? "bad" : "");
      if (e.intruso >= 3) relAdd(e.f, pr.owner, -2);
    } else e.intruso = 0;
    e.pas = [];
  }
  G.P.forEach((p) => (p.tired = false));
  if (typeof camMercNuevaEstacion === "function") await camMercNuevaEstacion();
  if (typeof camEspNuevaEstacion === "function") camEspNuevaEstacion();
  for (const e of S.ej.slice())
    if (human(e.f) && e.plan && camEj(e.id) && !G.over) {
      const pl = e.plan;
      await camAplicarOrden(G, { tipo: "mover", f: e.f, ej: e.id, x: pl.x, y: pl.y, luego: pl.luego, p: pl.p, con: pl.con }, {});
    }
  camRepCerrar();
  /* la repetición está completa (incluye lo anual y las marchas pendientes): la interfaz puede mostrarla */
  if (S.rep && S.rep.fin && !S.rep.avisada) {
    S.rep.avisada = true;
    await OC.emitir("repeticionLista", S.rep);
  }
  camTocar();
}
/* estado que resulta de aplicar los pasos de una repetición (hasta el paso n): {own:[], ej: Map id→{f,x,y,n}} */
function camRepEstado(rep, n) {
  const own = rep.own0.slice(),
    ej = new Map(rep.ej0.map((e) => [e.id, { ...e }]));
  for (const s of rep.pasos.slice(0, n == null ? rep.pasos.length : n)) {
    if (s.k === "mov" && ej.has(s.ej)) Object.assign(ej.get(s.ej), { x: s.a[0], y: s.a[1] });
    else if (s.k === "ej+") ej.set(s.ej, { id: s.ej, f: s.f, x: s.x, y: s.y, n: s.n });
    else if (s.k === "ej-") ej.delete(s.ej);
    else if (s.k === "con") own[s.p] = s.a;
  }
  return { own, ej };
}
/* cierra la repetición; si algo cambió sin pasar por los ganchos (sucesos, sociedad…), lo añade al final */
function camRepCerrar() {
  const S = camS(),
    r = S.rep;
  if (!r || r.fin) return;
  const st = camRepEstado(r);
  let aj = 0;
  G.P.forEach((p, i) => {
    if (st.own[i] !== p.owner) {
      r.pasos.push({ k: "con", p: i, de: st.own[i], a: p.owner });
      aj++;
    }
  });
  const vivos = new Set();
  for (const e of S.ej) {
    if (camTot(e.u) <= 0) continue;
    vivos.add(e.id);
    const s = st.ej.get(e.id);
    if (!s) {
      r.pasos.push({ k: "ej+", ej: e.id, f: e.f, x: e.x, y: e.y, n: camTot(e.u) });
      aj++;
    } else if (s.x !== e.x || s.y !== e.y) {
      r.pasos.push({ k: "mov", ej: e.id, f: e.f, de: [s.x, s.y], a: [e.x, e.y] });
      aj++;
    }
  }
  for (const id of st.ej.keys())
    if (!vivos.has(id)) {
      r.pasos.push({ k: "ej-", ej: id, motivo: "" });
      aj++;
    }
  r.ajustes = aj;
  r.fin = true;
}
async function camAsedios() {
  const S = camS();
  for (const k of Object.keys(S.as)) {
    const as = S.as[k],
      p = G.P[as.p];
    if (G.over) return;
    if (!p) {
      camAsedioFin(k);
      continue;
    }
    const sit = camSitiadores(p.id).filter((e) => camCheb(e.x, e.y, p.x, p.y) <= 1 && camGuerra(e.f, p.owner));
    if (!sit.length || p.owner === as.f) {
      camAsedioFin(k);
      for (const e of camS().ej) if (e.asd === p.id) {
        e.asd = null;
        if (e.est === "asedio") e.est = "marcha";
      }
      continue;
    }
    if (!sit.some((e) => e.f === as.f)) camCercoReasignar(p.id);
    as.n++;
    as.vi--;
    const cat = sit.reduce((s, e) => s + camMaq(e).cat, 0);
    if (cat) {
      as.brecha = Math.min(p.walls || 0, (as.brecha || 0) + cat * CAM_MAQ.cat.brecha);
      for (const t of TYP) p.u[t] = Math.floor((p.u[t] || 0) * (1 - Math.min(0.3, cat * CAM_MAQ.cat.bomb)));
    }
    if (as.vi < 0) {
      for (const t of TYP) p.u[t] = Math.floor((p.u[t] || 0) * 0.88);
      as.mo -= 12;
      if (as.vi === -1) addLog(`El hambre llega a ${p.name}: se comen los caballos.`, isMe(p.owner) ? "bad" : isMe(as.f) ? "good" : "");
    }
    as.mo = clamp(as.mo - 6, 0, 100);
    if (typeof ecoDiezmar === "function") ecoDiezmar(p, as.vi < 0 ? 0.03 : 0.01);
    p.order = clamp(p.order - (as.vi < 0 ? 5 : 2), 0, 100);
    /* rendición o puertas abiertas: ánimo de la ciudad (economía), hambre, moral, fuerza del sitiador */
    const ap = typeof ecoApoyoAsedio === "function" ? ecoApoyoAsedio(p, as.f) : (p.order - 50) / 50,
      ps = sit.reduce((s, e) => s + pw(camUCampo(e.u)), 0),
      ratio = ps / (pw(p.u) * (1 + 0.25 * (p.walls || 0)) + 1),
      pr = clamp(0.03 * as.n + (as.vi < 0 ? 0.22 : 0) + (100 - as.mo) / 300 - ap * 0.2 + (ratio > 3 ? 0.08 : 0) - (p.cap ? 0.05 : 0), 0, 0.85),
      traicion = ap < -0.4 && R() < -ap * 0.25;
    if (!tot(p.u) || traicion || R() < pr) {
      const e = sit.filter((x) => x.f === as.f).sort((a, b) => pw(b.u) - pw(a.u))[0] || sit.sort((a, b) => pw(b.u) - pw(a.u))[0];
      if (traicion && tot(p.u)) addLog(`Traición en ${p.name}: los vecinos abren de noche una poterna.`, isMe(p.owner) ? "bad" : "good");
      camConquistar(p, e, "rendicion", null, 0);
      continue;
    }
    /* salida de los sitiados (la IA decide sola; el jugador tiene el botón) */
    if (!human(p.owner) && tot(p.u) >= 3) {
      const peor = sit.sort((a, b) => pw(a.u) - pw(b.u))[0],
        est = cmbEstimar(camGuarnicion(p), camParaBatalla(peor), { fort: 0, p, terreno: camTerrCasilla(peor.x, peor.y), est: true }, 3);
      if (est >= 0.67) await camSalida(p, { auto: !isMe(peor.f) ? true : undefined });
    }
  }
}
function camObras() {
  for (const e of camS().ej) {
    if (!e.obra || !e.obra.length) continue;
    if (e.est !== "asedio") {
      e.obra = [];
      continue;
    }
    for (const o of e.obra) o.q--;
    for (const o of e.obra.filter((o) => o.q <= 0)) {
      if (UN[o.t]) e.u[o.t] = (e.u[o.t] || 0) + 1;
      else e.maq[o.t] = (e.maq[o.t] || 0) + 1;
      if (isMe(e.f)) addLog(`${CAM_MAQ[o.t].n} terminado ante ${G.P[e.asd]?.name || "la ciudad"}.`, "good");
    }
    e.obra = e.obra.filter((o) => o.q > 0);
  }
}
/* víveres, soldada, desgaste, cansancio, heridos y saqueo de los campamentos */
function camSuministros() {
  const S = camS(),
    inv = G.estacion === 3,
    clave = `${G.year}.${G.estacion}`;
  for (const e of S.ej.slice()) {
    const p = camProv(e),
      F = camF(e.f);
    if (!p) continue;
    const propia = camPropia(e.f, p.owner);
    let comida = 0,
      oro = 0;
    for (const t in e.u) {
      if (!UN[t] || !(e.u[t] > 0)) continue;
      const m = typeof ecoMant === "function" ? ecoMant(e.f, t) : { comida: UN[t].food || 1, oro: (UN[t].cost || 10) * 0.025 };
      comida += (e.u[t] * m.comida) / 4;
      oro += (e.u[t] * m.oro) / 4;
    }
    if (F) F.gold -= Math.round(oro);
    if (propia && F && F.food >= comida) {
      F.food -= Math.round(comida);
      e.sum = CAM_K.sumMax;
    } else e.sum -= inv ? 2 : 1;
    /* campamento en tierra ajena: forrajeo y saqueo de la comarca */
    if (e.est === "campamento" && !propia) {
      const ya = S.saq[p.id] === clave,
        pob = typeof ecoPob === "function" ? ecoPob(p) : 8,
        k = ya ? 0.4 : 1;
      e.sum += ya ? 0 : 1;
      const botin = Math.round((2 + pob * 0.45) * k);
      if (F) F.gold += botin;
      if (!ya) {
        S.saq[p.id] = clave;
        /* OC: el saqueo pasa por economía (población, orden y marca de saqueo para el ánimo) */
        if (typeof ecoSaqueo === "function") ecoSaqueo(p, 0.02, 6);
        else p.order = clamp(p.order - 6, 0, 100);
        if (p.owner < NF && e.f < NF) relAdd(e.f, p.owner, -2);
        if (isMe(e.f)) addLog(`Tu ${camNombre(e).toLowerCase()} saquea la comarca de ${p.name}: ${botin} de oro.`, "good");
        else if (isMe(p.owner)) addLog(`${CIV[e.f].s} saquea los campos de ${p.name}.`, "bad");
      }
    }
    e.sum = clamp(e.sum, -1, CAM_K.sumMax);
    if (e.sum < 0) {
      e.sum = 0;
      for (const t in e.u) if (UN[t] && !UN[t].asedio) e.u[t] = Math.floor(e.u[t] * (1 - CAM_K.desHambre * 1.5));
      e.mor = clamp((e.mor || 70) - 15, 5, 100);
      if (isMe(e.f)) addLog(`El ${camNombre(e).toLowerCase()} pasa hambre: desertan muchos.`, "bad");
    }
    if (inv && !propia) {
      const d = CAM_K.desInvierno * (e.est === "campamento" ? 0.5 : 1);
      for (const t in e.u) if (UN[t] && !UN[t].asedio && e.u[t] > 2) e.u[t] -= Math.max(0, Math.round(e.u[t] * d));
    }
    /* descanso, moral, heridos que vuelven */
    const camp = e.est === "campamento";
    e.fat = clamp((e.fat || 0) - (camp ? 40 : propia ? 25 : 12), 0, 100);
    e.mor = clamp((e.mor || 70) + (camp ? 8 : propia ? 5 : 0) - (e.sum <= 0 ? 8 : 0), 5, 100);
    if (camp || propia)
      for (const t in e.her) {
        const v = Math.ceil(e.her[t] / 2);
        e.u[t] = (e.u[t] || 0) + v;
        e.her[t] -= v;
        if (e.her[t] <= 0) delete e.her[t];
      }
    if (e.f < NF && (e.mor || 70) < 25)
      for (const t in e.u) if (UN[t] && !UN[t].asedio && !UN[t].merc) e.u[t] = Math.floor(e.u[t] * 0.94);
  }
}
/* ¿pasa sola la estación? Sí si el jugador no tiene ejércitos fuera ni cercos que le toquen */
function camSaltar(f = ME) {
  const S = camS();
  if (!S.rapido) return false;
  if (S.ej.some((e) => e.f === f)) return false;
  if (Object.values(S.as).some((a) => a.f === f || (G.P[a.p] && G.P[a.p].owner === f))) return false;
  return true;
}
function camTextoFin() {
  if (camSaltar(ME) && G.estacion === 0) return "Fin del año ▶";
  return camSaltar(ME) ? `Fin del año ▶ (${CAM_EST[G.estacion].toLowerCase()})` : `Fin de${G.estacion === 0 ? " la primavera" : G.estacion === 1 ? "l verano" : G.estacion === 2 ? "l otoño" : "l invierno"} ▶`;
}

/* ---------- partidas antiguas, paz, provincias perdidas ---------- */
OC.on("partidaLista", () => {
  camSel = null;
  camAlcC = null;
  const S = camS();
  for (const e of S.ej) {
    e.u = e.u || {};
    for (const k of ["vet", "ori", "her", "maq"]) e[k] = e[k] || {};
    e.obra = e.obra || [];
    if (e.mov == null) e.mov = camMovMax(e);
  }
  camTocar();
});
OC.on("pazFirmada", ({ a, b }) => {
  /* con la paz se levantan los cercos y los ejércitos vuelven a su tierra */
  const S = camS();
  for (const e of S.ej.slice()) {
    const p = camProv(e);
    if (!p) continue;
    const otro = e.f === a ? b : e.f === b ? a : null;
    if (otro == null || p.owner !== otro) continue;
    if (e.est === "asedio") camLevantar(e);
    const casa = owned(e.f).sort((x, y) => Math.hypot(x.x - e.x, x.y - e.y) - Math.hypot(y.x - e.x, y.y - e.y))[0];
    if (casa) {
      const x0 = e.x,
        y0 = e.y;
      e.x = casa.x;
      e.y = casa.y;
      camRepMov(e, x0, y0);
      e.plan = null;
      e.est = "marcha";
    } else camQuitar(e);
  }
  camTocar();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && camSel != null) {
    camSel = null;
    if (G) ui();
  }
});
