/* ---------- IA ----------
   Sistema CAMPAÑA (antes combate). Una vez al año (ai, desde turnos.js) recluta una mezcla de clases
   según la doctrina de su pueblo y los enemigos vecinos, nombra generales e instruye. Cada estación
   (camIA, desde camEstacion) forma ejércitos, marcha, intercepta, asedia, construye máquinas, asalta
   solo cuando sus capitanes ven la batalla ganable (cmbEstimar) y contrata mercenarios. */
/* doctrina de reclutamiento por pueblo (CIV[f].id); ele/cam/car y las tropas únicas (UN[t].civs)
   entran con su peso o, si faltan, con el de su clase base (rol) × 1,5 */
const CMB_DOC = {
  occ: { l: 2, i: 4, p: 2, h: 1, a: 2, x: 1, c: 1.5, k: 1 },
  ori: { l: 1.5, i: 2.5, p: 1, h: 1, a: 2.5, x: 1, c: 2, k: 1.5, m: 1.5 },
  vis: { l: 3, i: 4, p: 1.5, h: 1.5, a: 1, c: 2, k: 1.5 },
  hun: { l: 1, i: 1.5, a: 1, x: 2, c: 3, k: 1, m: 4 },
  van: { l: 2, i: 3, p: 1, h: 1.5, a: 1, x: 2, c: 2.5 },
  fra: { l: 3, i: 5, p: 2, h: 2, a: 1, c: 1 },
  per: { l: 2, i: 1.5, p: 1, h: 1, a: 3.5, x: 1.5, c: 2.5, k: 2, m: 1.5, ele: 1.5 },
  ara: { l: 1.5, i: 2, h: 1.5, a: 2, x: 2, c: 2, m: 1.5, cam: 3 },
  nor: { l: 2, i: 5, p: 1.5, h: 1, a: 1.5, c: 0.5 },
  chi: { l: 2.5, i: 2.5, p: 1, a: 3.5, x: 1.5, c: 1.5, k: 1, m: 1 },
  inc: { l: 3, i: 4, h: 3, a: 1.5 },
  may: { l: 2, i: 4, h: 3.5, a: 1.5 },
  azt: { l: 2, i: 4, h: 2.5, a: 2 },
  gri: { l: 3, i: 2.5, p: 2, h: 2, a: 1.5, x: 1, c: 1.5 },
  egi: { l: 2, i: 2.5, h: 1.5, a: 3, x: 1, c: 1, cam: 2, car: 2 },
  ind: { l: 2, i: 3, h: 1, a: 3, x: 1, c: 1.5, ele: 2.5 },
  cel: { l: 2, i: 4, h: 3, a: 1, x: 1.5, c: 1.5 },
  esl: { l: 3, i: 4, h: 2, a: 2, x: 1, c: 1 },
  mon: { l: 0.5, i: 1, a: 1, x: 2, c: 2, k: 1.5, m: 5 },
  reb: { l: 2, i: 4, a: 1, c: 1 },
};
function cmbDocDe(f) {
  const id = typeof cmbCivId === "function" ? cmbCivId(f) : (CIV[f] && CIV[f].id) || "reb";
  return CMB_DOC[id] || CMB_DOC.reb;
}
function cmbDocPeso(f, doc, t) {
  if (doc[t] != null) return doc[t];
  const u = UN[t] || {},
    civs = u.civIds || u.civs || [],
    id = typeof cmbCivId === "function" ? cmbCivId(f) : CIV[f] && CIV[f].id;
  if (civs.includes(id) || civs.includes(f)) return (doc[u.rol] || 1.5) * 1.5;
  return doc[u.rol] != null ? doc[u.rol] : 0.3;
}
/* elige qué clase reclutar en p: la que más se aleja de la proporción deseada */
function cmbIAElegir(f, p, disp, F, net) {
  const doc = cmbDocDe(f),
    ene = cmbVacio();
  hostile(p, f).forEach((q) => cmbSuma(ene, q.u));
  const ne = tot(ene) || 1,
    sh = (l) => l.reduce((s, t) => s + (ene[t] || 0), 0) / ne,
    eCab = sh(["x", "c", "k", "m"]),
    eDis = sh(["h", "a", "m"]),
    eInf = sh(["l", "i", "p"]),
    w = {};
  for (const t of disp) {
    if (UN[t].asedio || UN[t].merc) continue;
    let v = cmbDocPeso(f, doc, t);
    const rl = UN[t].rol || t;
    if (rl === "l") v *= 1 + 2.5 * eCab;
    if (rl === "x" || rl === "c" || rl === "cam") v *= 1 + 1.5 * eDis;
    if (rl === "a" || rl === "k" || rl === "p" || rl === "ele") v *= 1 + eInf;
    if (UN[t].food > 1 && net < 2) v *= 0.15;
    const c = cmbCoste(f, t, p);
    if (c > F.gold) v = 0;
    if (c > 24 && F.gold < c * 1.6) v *= 0.4;
    w[t] = v;
  }
  const sw = Object.values(w).reduce((a, b) => a + b, 0);
  if (!sw) return null;
  if (R() < 0.2) {
    let x = R() * sw;
    for (const t in w) if ((x -= w[t]) < 0) return t;
  }
  const n = tot(p.u) + 1;
  return Object.keys(w)
    .filter((t) => w[t] > 0)
    .sort((a, b) => w[b] / sw - (p.u[b] || 0) / n - (w[a] / sw - (p.u[a] || 0) / n))[0];
}
async function ai(f) {
  if (!alive(f) || G.over) return;
  const F = G.F[f];
  aiDiplo(f);
  const own = owned(f);
  own.forEach((p) => cmbNorm(p.u));
  const th = (p) =>
    hostile(p, f).reduce((s, q) => s + pw(q.u) * (q.owner === REB ? 0.4 : 1), 0) + foes(p, f).length;
  /* impuestos: economía (turnoIA); edificios: tecnología (economiaFaccion) */
  const bord = own.filter((p) => foes(p, f).length).sort((a, b) => th(b) - th(a));
  for (const c of family(f).filter(
    (c) => c.age >= 18 && c.sex === "m" && !genOf(c) && c.id !== F.ruler && !c.dipReh && !camS().ej.some((e) => e.gen === c.id),
  )) {
    const p = bord.find((p) => p.gen == null);
    if (!p) break;
    p.gen = c.id;
  }
  /* dónde reclutar: las dos fronteras más amenazadas y, si arma mejor (cada ciudad tiene sus cuarteles),
     la provincia propia con más clases disponibles; desde allí marchará luego al frente */
  const sitios = bord.slice(0, 2),
    mejor = own
      .filter((p) => !sitios.includes(p))
      .map((p) => ({ p, n: cmbDisp(f, p).ok.length }))
      .sort((a, b) => b.n - a.n)[0];
  if (mejor && sitios.length && mejor.n > Math.max(...sitios.map((p) => cmbDisp(f, p).ok.length)))
    sitios.push(mejor.p);
  /* CAMPAÑA: en guerra con un reino, compañías mercenarias en vez de levas si el oro lo permite;
     y una reserva para la paga de los mercenarios y las máquinas de asedio */
  if (typeof camMercIA === "function") for (const o of camMercIA(f, { anual: true })) await camIAOrd(o);
  const resCam = camIAReserva(f);
  for (let g = 0; F.gold >= 8 + resCam && sitios.length && g < 40; g++) {
    const ee = inc(f);
    if (ee.net < 0 && F.food + ee.net * 3 < 0) break;
    /* soldada: inc(f).g es el saldo neto del año; no endeudarse por reclutar */
    if (ee.g < -Math.max(3, owned(f).length)) break;
    const p = sitios[g % sitios.length],
      t = cmbIAElegir(f, p, cmbDisp(f, p).ok, F, ee.net);
    if (!t) break;
    const sold = typeof ecoMant === "function" ? ecoMant(f, t).oro : 0;
    if (F.gold - cmbCoste(f, t, p) < Math.max(0, -ee.g) * 2 + sold * 3 + resCam || !cmbReclutar(f, p, t)) break;
  }
  /* oro ocioso (p. ej. sin comida para más levas): instrucción de las guarniciones de frontera */
  const gNeto = inc(f).g;
  for (const p of [...bord, ...own.filter((x) => !bord.includes(x))])
    if (gNeto > 0 && F.gold > 120 + 12 * own.length + cmbInstrCoste(p)) cmbInstruir(f, p);
  /* redistribución: las guarniciones del interior se acercan a la frontera (la guerra la hacen los
     ejércitos del mapa: camIA, cada estación) */
  for (const p of own) {
    if (G.over) return;
    if (p.owner !== f || p.tired || pw(p.u) < 10 || foes(p, f).length || camAsedio(p.id)) continue;
    const n = MAP.adj[p.id]
      .map((i) => G.P[i])
      .filter((q) => q.owner === f)
      .sort((a, b) => foes(b, f).length - foes(a, f).length)[0];
    if (n && foes(n, f).length) await march(p.id, n.id, 1, true);
  }
}

/* ======================================================================
   IA de campaña: cada estación. Devuelve órdenes de marcha (se resuelven a la vez para todos los
   bandos con camResolverSimultaneo); las demás órdenes las aplica en el acto.
   ====================================================================== */
const camIAOrd = (o) => camAplicarOrden(G, o, { auto: true });
/* oro que la IA no gasta en levas: un año de paga de sus mercenarios, máquinas para sus cercos y,
   en guerra con un reino, un fondo de campaña */
function camIAReserva(f) {
  const M = typeof mercS === "function" ? mercS() : { con: [] },
    merc = M.con.filter((c) => c.f === f).reduce((s, c) => s + mercPago(c.t, mercCuenta(f, c.t)) * 4, 0),
    guerra = [...Array(NF).keys()].some((g) => g !== f && alive(g) && G.st[f][g] === "guerra");
  return merc + (camEjDe(f).length ? 15 : 0) + (guerra ? 20 + 2 * owned(f).length : 0);
}
/* tropas que puede sacar de una provincia sin dejarla indefensa */
function camIATomar(f, p, fr) {
  cmbNorm(p.u);
  const amen = hostile(p, f).filter((q) => q.owner !== REB).length;
  if (p.cap) fr = Math.min(fr, 0.6);
  if (amen > 1) fr = Math.min(fr, 0.55);
  const u = cmbVacio();
  for (const t of TYP) if (!UN[t].asedio) u[t] = Math.floor((p.u[t] || 0) * fr);
  while (tot(p.u) - tot(u) < 2 && tot(u) > 0) {
    const t = TYP.filter((k) => u[k] > 0).sort((a, b) => u[b] - u[a])[0];
    u[t]--;
  }
  return u;
}
const camIAEjDe = (f, p, u) => ({ f, u, gen: p.gen, vet: cmbVetDe(p), ori: cmbOriDe(p), fat: 5 });
/* lo que la IA sabe de una ciudad (niebla de guerra: si no la ve, la última noticia o una suposición) */
const camIACtxCiudad = (q, f) => {
  const w = f != null && typeof camInfoCiudad === "function" ? camInfoCiudad(f, q).walls : q.walls || 0;
  return { fort: Math.max(0, (w || 0) - 1.25), p: q, terreno: cmbTerreno(q), asedio: w ? 2 : 0 };
};
function camIAGuarn(f, q) {
  const i = typeof camInfoCiudad === "function" ? camInfoCiudad(f, q) : { vista: true };
  return i.vista ? camGuarnicion(q) : { f: q.owner, u: i.u, gen: null, vet: {}, ori: {}, fat: 0, hambre: false };
}
async function camIAFormar(f) {
  const S = camS(),
    mios = camEjDe(f),
    own = owned(f),
    max = Math.min(CAM_K.maxEj + 1, 1 + Math.floor(own.length / 4));
  /* defensa: ejércitos enemigos dentro de su tierra */
  const intr = S.ej.filter((e) => camGuerra(f, e.f) && camVeEj(f, e) && camProv(e) && camProv(e).owner === f && camTot(e.u) > 0);
  for (const e of intr.slice(0, 2)) {
    if (mios.some((m) => m.obj && m.obj.ej === e.id)) continue;
    const cand = own
      .filter((p) => !camAsedio(p.id) && tot(p.u) >= 4 && Math.hypot(p.x - e.x, p.y - e.y) < 14)
      .sort((a, b) => pw(b.u) - pw(a.u))[0];
    if (!cand) continue;
    const u = camIATomar(f, cand, 0.75);
    if (tot(u) < 3) continue;
    const est = cmbEstimar(
      camIAEjDe(f, cand, u),
      camParaBatalla(e),
      { fort: e.est === "campamento" ? CAM_K.fortCampo : 0, terreno: camTerrCasilla(e.x, e.y), p: camProv(e) },
      4,
    );
    if (est < 0.6) continue;
    const r = await camIAOrd({ tipo: "formar", f, p: cand.id, u });
    if (r.ok) {
      camEj(r.ej).obj = { ej: e.id };
      mios.push(camEj(r.ej));
    }
  }
  if (G.estacion === 3 || mios.length >= max) return;
  /* ofensiva: la mejor ciudad hostil vecina de una provincia propia con tropas */
  const c = [];
  for (const p of own) {
    if (tot(p.u) < 5 || camAsedio(p.id) || camEjsEn(p.x, p.y).some((e) => e.f !== f)) continue;
    const u = camIATomar(f, p, 0.8);
    if (tot(u) < 4) continue;
    const my = pw(u) * gb(p.gen);
    for (const i of MAP.adj[p.id]) {
      const q = G.P[i];
      if (q.owner === f || !camGuerra(f, q.owner)) continue;
      /* una ciudad que ya cerca un ejército propio puede recibir un segundo por otro flanco (asalto conjunto) */
      const asq = camAsedio(q.id),
        van = mios.filter((m) => (m.obj && m.obj.p === q.id) || m.asd === q.id),
        refuerzo = asq && asq.f === f && van.length === 1;
      if ((asq && !refuerzo) || (!asq && van.length) || van.length >= 2) continue;
      const ya = refuerzo ? van.reduce((t, m) => t + pw(camUCampo(m.u)), 0) : 0,
        s =
          ((my + ya) / (pw(camInfoCiudad(f, q).u) * (1 + 0.15 * (camInfoCiudad(f, q).walls || 0)) * gb(q.gen) + 3)) *
          (q.owner === REB ? 1.15 : 1) *
          (q.cap ? 1.2 : 1);
      if (s > 0.9) c.push({ p, q, u, s, con: refuerzo ? van : null });
    }
  }
  c.sort((a, b) => b.s - a.s);
  for (const x of c.slice(0, 3)) {
    const uu = x.con ? x.con.reduce((t, m) => cmbSuma(t, camUCampo(m.u)), { ...x.u }) : x.u,
      e = tot(camInfoCiudad(f, x.q).u) ? cmbEstimar(camIAEjDe(f, x.p, uu), camIAGuarn(f, x.q), camCtxFlancos(camIACtxCiudad(x.q, f), x.con ? 2 : 1), 4) : 1;
    if (e < ((x.q.walls || 0) > 0 ? 0.5 : 0.62) / (x.q.owner === REB ? 1.1 : 1)) continue;
    const r = await camIAOrd({ tipo: "formar", f, p: x.p.id, u: x.u });
    if (r.ok) camEj(r.ej).obj = { p: x.q.id };
    return;
  }
}
const camIACasa = (ej) =>
  owned(ej.f)
    .filter((p) => !camAsedio(p.id))
    .sort((a, b) => Math.hypot(a.x - ej.x, a.y - ej.y) - Math.hypot(b.x - ej.x, b.y - ej.y))[0] || null;
async function camIAEj(f, ej) {
  if (!camEj(ej.id) || camTot(ej.u) <= 0) return null;
  const p = camProv(ej),
    propia = p && camPropia(f, p.owner),
    inv = G.estacion === 3,
    S = camS();
  /* 0) asedio en curso: asaltar, construir máquinas, esperar o levantar el cerco */
  if (ej.est === "asedio" && ej.asd != null) {
    const q = G.P[ej.asd];
    if (!q || !camGuerra(f, q.owner)) camLevantar(ej);
    else {
      if (ej.acc === camClaveEst()) return null; // ya asaltó (sola o con otros) esta estación
      const e = tot(q.u) ? cmbEstimar(camParaBatalla(ej), camGuarnicion(q), camCtxAsalto(ej, q), 4) : 1;
      /* asalto conjunto con los demás ejércitos junto a la ciudad si así mejora la estimación */
      const part = camParticipantes(ej, q);
      if (part.length > 1 && tot(q.u)) {
        const ec = camEstimarAsalto(part, q, 4);
        if (ec >= 0.6 && ec > e + 0.05) {
          await camIAOrd({ tipo: "asaltar", f, ej: ej.id, con: part.slice(1).map((x) => x.id) });
          return null;
        }
      }
      if (e >= 0.62 || (!(q.walls > 0) && e >= 0.55)) {
        await camIAOrd({ tipo: "asaltar", f, ej: ej.id });
        return null;
      }
      const m = camMaq(ej),
        en = (k) => m[k] + (ej.obra || []).filter((o) => o.t === k).length,
        quiere =
          (q.walls || 0) >= 1
            ? [
                ["ari", 1],
                ["tor", (q.walls || 0) >= 2 ? 1 : 0],
                ["cat", camF(f) && camF(f).gold > 160 ? 2 : 0],
              ]
            : [];
      for (const [k, n] of quiere)
        if (en(k) < n && !camPuedeMaq(ej, k)) {
          await camIAOrd({ tipo: "construir", f, ej: ej.id, maq: k });
          break;
        }
      const as = camAsedio(q.id);
      if (!(as && as.n >= 8 && e < 0.3) && camTot(ej.u) >= 2) return null;
      camLevantar(ej);
      ej.obj = null;
      ej.veto = q.id;
    }
  }
  if (ej.mov <= 0.5) return null;
  /* varado en tierra de un reino en paz (derecho de salida): lo primero es salir */
  if (p && !camPaso(f, p.owner)) {
    const c = camIACasa(ej);
    if (c) return { tipo: "mover", f, ej: ej.id, x: c.x, y: c.y };
  }
  const D = camDijkstra(ej, { presu: ej.mov }),
    ataca = (x, y) => ({ tipo: "mover", f, ej: ej.id, x, y });
  /* 1) interceptar ejércitos enemigos al alcance (sobre todo los que pisan tierra propia) */
  const yo = camParaBatalla(ej),
    ene = S.ej
      .filter((e) => camGuerra(f, e.f) && camTot(e.u) > 0 && camVeEj(f, e) && Number.isFinite(D.dist[camIdx(e.x, e.y)]))
      .map((e) => ({ e, dentro: camProv(e) && camProv(e).owner === f ? 1 : 0, r: pw(yo.u) / (pw(camUCampo(e.u)) + 1) }))
      .filter((x) => x.r > 0.8)
      .sort((a, b) => b.dentro - a.dentro || b.r - a.r);
  for (const x of ene.slice(0, 2)) {
    const est = cmbEstimar(
      yo,
      camParaBatalla(x.e),
      { fort: x.e.est === "campamento" ? CAM_K.fortCampo : 0, terreno: camTerrCasilla(x.e.x, x.e.y), p: camProv(x.e) },
      3,
    );
    if (est >= (x.dentro ? 0.55 : 0.64)) return ataca(x.e.x, x.e.y);
  }
  /* persecución de un intruso elegido al formar */
  if (ej.obj && ej.obj.ej != null) {
    const e = camEj(ej.obj.ej);
    if (e && camGuerra(f, e.f) && camVeEj(f, e) && camProv(e) && camProv(e).owner === f) return ataca(e.x, e.y);
    ej.obj = null;
  }
  /* 2) sin víveres en tierra ajena: forrajear acampado o volver */
  const clave = `${G.year}.${G.estacion}`;
  if (!propia && ej.sum <= 1 && ej.est !== "asedio") {
    if (p && S.saq[p.id] !== clave && !inv && ej.sum >= 0 && !ej.obj) {
      await camIAOrd({ tipo: "acampar", f, ej: ej.id });
      return null;
    }
    const c = camIACasa(ej);
    if (c) return { tipo: "mover", f, ej: ej.id, x: c.x, y: c.y };
  }
  /* 3) invierno: no se emprenden campañas; se acampa en tierra ajena o se vuelve */
  if (inv && ej.est !== "asedio") {
    if (!propia && ej.sum >= 2) {
      await camIAOrd({ tipo: "acampar", f, ej: ej.id });
      return null;
    }
    const c = camIACasa(ej);
    return c ? { tipo: "mover", f, ej: ej.id, x: c.x, y: c.y } : null;
  }
  if (ej.est === "asedio") return null;
  /* 4) ciudad objetivo (la elegida al formar o la mejor hostil cercana) */
  let q = ej.obj && ej.obj.p != null ? G.P[ej.obj.p] : null;
  if (!q || q.owner === f || !camGuerra(f, q.owner)) {
    q = null;
    ej.obj = null;
    const L = camDijkstra(ej, { sinZoc: true }),
      mx = Math.max(1, camMovMax(ej)),
      cs = G.P.filter(
        (c) => c.owner !== f && camGuerra(f, c.owner) && c.id !== ej.veto && Math.hypot(c.x - ej.x, c.y - ej.y) < 22,
      )
        .map((c) => {
          const j = camJuntoA(ej, c, L),
            d = j >= 0 ? L.dist[j] : Infinity,
            ic = camInfoCiudad(f, c),
            r = pw(yo.u) / (pw(ic.u) * (1 + 0.15 * (ic.walls || 0)) + 2);
          return { c, d, s: (r * (c.cap ? 1.2 : 1) * (c.owner === REB ? 1.1 : 1)) / (1 + d / mx) };
        })
        .filter((x) => Number.isFinite(x.d) && x.d < mx * 3)
        .sort((a, b) => b.s - a.s);
    /* una ciudad cercada por otro bando solo se toca sumándose a su cerco (si lo acepta) */
    let pedidas = 0;
    for (const x of cs.slice(0, 3)) {
      const aj = camCercoAjeno(f, x.c);
      if (aj && (camGuerra(f, aj.f) || pedidas++ || !(await camPedirCerco(f, x.c)))) continue;
      const ic = camInfoCiudad(f, x.c),
        e = tot(ic.u) ? cmbEstimar(yo, camIAGuarn(f, x.c), camIACtxCiudad(x.c, f), 3) : 1;
      if (e >= ((x.c.walls || 0) > 0 ? 0.5 : 0.6) || (camAsedio(x.c.id) && e >= 0.35)) {
        q = x.c;
        ej.obj = { p: q.id };
        break;
      }
    }
  }
  if (q && camCercoAjeno(f, q)) {
    ej.obj = null;
    q = null;
  }
  if (q) {
    const vacia = !tot(q.u) && !(q.walls > 0) && !camAsedio(q.id);
    return {
      tipo: "mover",
      f,
      ej: ej.id,
      x: q.x,
      y: q.y,
      luego: vacia ? null : (q.walls || 0) > 0 || (camAsedio(q.id) && camAsedio(q.id).f === f) ? "asediar" : "asaltar",
      p: q.id,
    };
  }
  /* 5) nada que hacer: a casa y a los cuarteles */
  if (p && p.owner === f) {
    await camIAOrd({ tipo: "disolver", f, ej: ej.id });
    return null;
  }
  const c = camIACasa(ej);
  return c ? { tipo: "mover", f, ej: ej.id, x: c.x, y: c.y } : null;
}
async function camIA(f) {
  if (!alive(f) || G.over) return [];
  const ords = [];
  if (typeof camMercIA === "function") for (const o of camMercIA(f)) await camIAOrd(o);
  await camIAFormar(f);
  for (const ej of camEjDe(f)) {
    if (G.over) break;
    const o = await camIAEj(f, ej);
    if (o) ords.push(o);
  }
  return ords;
}
/* bandas de desertores y bandidos (rebeldes): saquean, toman ciudades indefensas y acaban dispersándose */
function camIARebeldes() {
  const S = camS(),
    ords = [],
    clave = `${G.year}.${G.estacion}`;
  for (const e of S.ej.filter((x) => x.f === REB)) {
    e.vida = (e.vida == null ? 8 : e.vida) - 1;
    const p = camProv(e);
    if (e.vida <= 0) {
      if (p && p.owner === REB) cmbLlega(p, camUCampo(e.u), e.vet, e.ori);
      camQuitar(e);
      continue;
    }
    const presa = G.P.filter(
      (q) => q.owner !== REB && !camCercoAjeno(REB, q) && Math.hypot(q.x - e.x, q.y - e.y) < 12 && pw(q.u) * (1 + 0.3 * (q.walls || 0)) < pw(e.u) * 0.8,
    ).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
    if (presa && e.est !== "asedio")
      ords.push({ tipo: "mover", f: REB, ej: e.id, x: presa.x, y: presa.y, luego: "asaltar", p: presa.id });
    else if (p && p.owner !== REB && S.saq[p.id] !== clave) e.est = "campamento";
  }
  return ords;
}
