/* ---------- mercenarios: campamentos del mapa y contratos en ciudades ---------- Sistema CAMPAÑA
   Compañías con nombre propio y origen, más fuertes que las levas (UN[t].merc = true). Se contratan
   (a) llegando con un ejército a un campamento mercenario del mapa (o a una casilla vecina) o
   (b) en una ciudad propia, según su región y sus edificios. Cobran oro del tesoro CADA ESTACIÓN.
   Son fieles mientras cobran: ninguna oferta del rival les hace cambiar de bando. Si no se les paga
   dos estaciones seguidas, desertan, saquean la provincia donde estén y vagan como bandidos.
   Estado en G.cam.merc = {camp:[...], con:[...], usado:{pid:[ids]}, sig}. */

/* tipos: base = clase de UN de la que parten; mod = mejoras (se suman); reg = regiones del mapa
   (n norte, s sur, o oeste, e este); puerto/establo = se ofrecen en ciudades con ese edificio */
const MERC_TIPOS = {
  mhe: { base: "i", s: "Hérulos", gent: "hérulos", reg: "n", mod: { me: 2, ca: 1, mo: 14, di: 1, vi: 1 }, jefes: ["Fara", "Rodulfo", "Sindual", "Datio", "Aluith"], d: "Infantería feroz del Danubio; no retrocede" },
  mgp: { base: "l", s: "Lanceros gépidos", gent: "gépidos", reg: "n", mod: { de: 1, ar: 1, mo: 10, di: 1 }, jefes: ["Ardarico", "Trasarico", "Mundo", "Elemundo"], d: "Muro de lanzas que aguanta cargas" },
  mal: { base: "c", s: "Jinetes alanos", gent: "alanos", reg: "e", establo: true, mod: { me: 1, ca: 2, mo: 8, ve: 0.3 }, jefes: ["Goar", "Respendial", "Sangibano", "Addax"], d: "Caballería de choque de las estepas" },
  msa: { base: "k", s: "Catafractos sármatas", gent: "sármatas", reg: "e", establo: true, mod: { ar: 1, ca: 1, mo: 10, vi: 2 }, jefes: ["Saurmag", "Zartas", "Beuca", "Babai"], d: "Jinetes acorazados; carga devastadora" },
  mba: { base: "h", s: "Honderos baleares", gent: "baleares", reg: "o", puerto: true, mod: { pr: 1.6, al: 1, mu: 2, mo: 8 }, jefes: ["Mago", "Iamo", "Ebuso", "Pollentio"], d: "Los mejores honderos del mar interior" },
  mcr: { base: "a", s: "Arqueros cretenses", gent: "cretenses", reg: "s", puerto: true, mod: { pr: 1.2, al: 1, de: 1, mo: 10 }, jefes: ["Gortina", "Cnosos", "Cidonia", "Lyttos"], d: "Arqueros de oficio, firmes bajo el fuego" },
  mes: { base: "m", s: "Arqueros escitas", gent: "escitas", reg: "e", establo: true, mod: { pr: 1, mu: 2, mo: 8, ve: 0.2 }, jefes: ["Uldin", "Octar", "Kursich", "Basich"], d: "Arqueros a caballo que nunca se dejan alcanzar" },
  mnu: { base: "x", s: "Jinetes númidas", gent: "númidas", reg: "s", establo: true, mod: { me: 1, mo: 8, ve: 0.6, mv: 0.6 }, jefes: ["Gildón", "Mascezel", "Firmo", "Masuna"], d: "Jinetes ligerísimos; persiguen sin descanso" },
  mis: { base: "i", s: "Montañeses isaurios", gent: "isaurios", reg: "e", mod: { de: 2, ar: 1, mo: 10, fa: -0.2 }, jefes: ["Tarasicodisa", "Longino", "Ilo", "Indes"], d: "Montañeses duros; no se cansan" },
  mma: { base: "i", s: "Marinos de Rodas", gent: "marinos", reg: "", puerto: true, mod: { me: 1, de: 1, mo: 8 }, jefes: ["Rodas", "Licia", "Panfilia", "Cilicia"], d: "Gente de mar curtida en abordajes" },
};
const MERC_K = {
  pago: 0.12, // oro por leva y estación = coste de la clase base × pago
  enganche: 0.6, // al firmar: coste × enganche por leva
  coste: 1.55, // coste de reclutamiento equivalente (para pw y economía)
  pw: 1.35,
  vet: 45, // veteranía con la que llegan
  campos: 0.1, // campamentos en el mapa = provincias × campos (mín. 2)
  gracia: 1, // estaciones de impago que aguantan antes de desertar
};
/* --- definir los tipos en UN (y en TYP, MULT, SP y los nombres de cada pueblo) --- */
function mercDefinir() {
  for (const [k, d] of Object.entries(MERC_TIPOS)) {
    const b = UN[d.base];
    if (!b) continue;
    if (!UN[k] || !UN[k].merc) {
      const u = { ...b, s: d.s, merc: true, base: d.base, gent: d.gent, reg: d.reg };
      for (const [c, v] of Object.entries(d.mod)) u[c] = Math.round(((+u[c] || 0) + v) * 100) / 100;
      u.cost = Math.round(b.cost * MERC_K.coste);
      u.pw = Math.round(b.pw * MERC_K.pw * 10) / 10;
      u.edif = undefined;
      u.nivel = undefined;
      UN[k] = u;
    }
    if (!TYP.includes(k)) TYP.push(k);
    if (typeof SP !== "undefined" && !SP[k] && SP[d.base]) SP[k] = SP[d.base];
    if (typeof MS !== "undefined" && !MS[k] && MS[d.base]) MS[k] = MS[d.base];
  }
  mercMult();
  CIV.forEach((c) => {
    c.un = c.un || {};
    c.bon = c.bon || {};
    for (const k in MERC_TIPOS) {
      if (!UN[k]) continue;
      if (!c.un[k]) c.un[k] = UN[k].s;
      if (!c.bon[k]) c.bon[k] = { atk: 1, hp: 1 };
    }
  });
}
/* MULT: la compañía hereda la doctrina de su clase base (y lo mismo contra ella) */
function mercMult() {
  if (typeof MULT === "undefined") return;
  const baseDe = (t) => (UN[t] && UN[t].merc ? UN[t].base : t);
  for (const k of Object.keys(UN)) {
    if (!MULT[k]) MULT[k] = { ...(MULT[baseDe(k)] || {}) };
  }
  for (const a of Object.keys(MULT))
    for (const b of Object.keys(UN)) if (MULT[a][b] == null) MULT[a][b] = (MULT[baseDe(a)] || {})[baseDe(b)] ?? 1;
}
mercDefinir();

/* ---------- estado ---------- */
function mercS() {
  const S = camS();
  if (!S.merc) S.merc = { sig: 1, camp: [], con: [], usado: {} };
  const M = S.merc;
  M.camp = M.camp || [];
  M.con = M.con || [];
  M.usado = M.usado || {};
  M.sig = M.sig || 1;
  return M;
}
const mercPagoU = (t) => Math.round((UN[UN[t].base] || UN[t]).cost * MERC_K.pago * 10) / 10;
const mercEnganche = (c) => Math.ceil((UN[UN[c.t].base] || UN[c.t]).cost * MERC_K.enganche * c.n);
const mercPago = (t, n) => Math.ceil(mercPagoU(t) * n);
/* hombres de un tipo mercenario al servicio de f (ejércitos y guarniciones) */
function mercCuenta(f, t) {
  let n = 0;
  for (const p of G.P) if (p.owner === f) n += p.u[t] || 0;
  for (const e of camS().ej) if (e.f === f) n += e.u[t] || 0;
  return n;
}
const mercCon = (f, t) => mercS().con.find((c) => c.f === f && c.t === t) || null;
function mercNuevaCia(t, r = R) {
  const d = MERC_TIPOS[t],
    j = d.jefes[Math.floor(r() * d.jefes.length)],
    M = mercS();
  return {
    id: M.sig++,
    t,
    n: 3 + Math.floor(r() * 4),
    nom: t === "mcr" || t === "mma" || t === "mba" ? `${d.s.split(" ")[0]} de ${j}` : `${d.s} de ${j}`,
  };
}
/* regiones de una casilla según su posición en el mapa */
function mercRegiones(x, y) {
  const r = [];
  if (y < H * 0.38) r.push("n");
  if (y > H * 0.62) r.push("s");
  if (x < W * 0.34) r.push("o");
  if (x > W * 0.66) r.push("e");
  return r;
}
function mercTiposDe(x, y, o = {}) {
  const rg = mercRegiones(x, y);
  return Object.keys(MERC_TIPOS).filter(
    (k) => UN[k] && ((MERC_TIPOS[k].reg && rg.includes(MERC_TIPOS[k].reg)) || (o.puerto && MERC_TIPOS[k].puerto) || (o.establo && MERC_TIPOS[k].establo)),
  );
}

/* ---------- campamentos mercenarios en el mapa ---------- */
function mercCasillaLibre() {
  const S = camS(),
    M = mercS();
  for (let k = 0; k < 200; k++) {
    const x = ri(1, W - 2),
      y = ri(1, H - 2),
      pid = MAP.grid[y][x];
    if (pid < 0 || !MAP.terr[y][x] || camCiudadEn(x, y)) continue;
    if (S.ej.some((e) => camCheb(e.x, e.y, x, y) <= 1) || M.camp.some((c) => camCheb(c.x, c.y, x, y) < 8)) continue;
    if (G.P.some((p) => camCheb(p.x, p.y, x, y) <= 1)) continue;
    return [x, y];
  }
  return null;
}
function mercPoblar(c) {
  let ts = mercTiposDe(c.x, c.y);
  if (!ts.length) ts = Object.keys(MERC_TIPOS).filter((k) => UN[k]);
  const t1 = pick(ts),
    t2 = R() < 0.6 ? pick(ts) : t1;
  c.cias = [mercNuevaCia(t1), mercNuevaCia(t2)];
  c.nom = `Campamento de los ${MERC_TIPOS[t1].gent}`;
}
function mercCampos() {
  const M = mercS(),
    n = Math.max(2, Math.round(G.P.length * MERC_K.campos));
  M.camp = M.camp.filter((c) => c.hasta >= G.year && c.cias.length);
  while (M.camp.length < n) {
    const xy = mercCasillaLibre();
    if (!xy) break;
    const c = { id: M.sig++, x: xy[0], y: xy[1], cias: [], hasta: G.year + ri(2, 3) };
    mercPoblar(c);
    M.camp.push(c);
  }
}
const mercCampoCerca = (ej) => mercS().camp.filter((c) => camCheb(c.x, c.y, ej.x, ej.y) <= 1 && c.cias.length);

/* ---------- compañías que se ofrecen en una ciudad (deterministas por año) ---------- */
function mercOfertas(p) {
  if (!p) return [];
  const r = mul((G.seed || 1) + p.id * 977 + G.year * 31),
    ts = mercTiposDe(p.x, p.y, { puerto: (p.puerto || 0) > 0, establo: (p.establo || 0) > 0 });
  if (!ts.length) return [];
  const n = 1 + ((p.market || 0) > 0 ? 1 : 0) + ((p.puerto || 0) > 0 ? 1 : 0),
    usados = mercS().usado[p.id] || [],
    out = [];
  for (let k = 0; k < n; k++) {
    const t = ts[Math.floor(r() * ts.length)],
      d = MERC_TIPOS[t],
      j = d.jefes[Math.floor(r() * d.jefes.length)],
      id = `c${p.id}.${G.year}.${k}`;
    if (usados.includes(id)) continue;
    out.push({ id, t, n: 2 + Math.floor(r() * 3), nom: `${d.s} de ${j}` });
  }
  return out;
}

/* ---------- contratar, cobrar, desertar ---------- */
function mercFirmar(f, cia, anos) {
  const M = mercS(),
    c = mercCon(f, cia.t);
  if (c) {
    c.hasta = Math.max(c.hasta, G.year + anos);
    c.n0 += cia.n;
    c.noms = [...new Set([...(c.noms || [c.nom]), cia.nom])];
  } else M.con.push({ id: M.sig++, f, t: cia.t, nom: cia.nom, noms: [cia.nom], n0: cia.n, hasta: G.year + anos, imp: 0, desde: G.year });
}
function mercPuede(f, cia) {
  const F = camF(f);
  if (!F) return "Sin tesoro";
  const e = mercEnganche(cia);
  if (F.gold < e + mercPago(cia.t, cia.n)) return `Faltan ${e + mercPago(cia.t, cia.n) - Math.floor(F.gold)} de oro`;
  return "";
}
function camMercOrden(o, ej) {
  const f = o.f,
    M = mercS();
  if (o.tipo === "contratar") {
    const anos = clamp(+o.anos || 2, 1, 3);
    let cia = null,
      donde = null;
    if (o.camp != null) {
      const c = M.camp.find((x) => x.id === o.camp);
      if (!c || !ej || camCheb(c.x, c.y, ej.x, ej.y) > 1) return { ok: false, motivo: "El campamento está lejos" };
      cia = c.cias.find((x) => x.id === o.cia);
      donde = c;
    } else if (o.p != null) {
      const p = G.P[o.p];
      if (!p || p.owner !== f) return { ok: false, motivo: "No es tu ciudad" };
      if (camAsedio(p.id)) return { ok: false, motivo: "La ciudad está sitiada" };
      cia = mercOfertas(p).find((x) => x.id === o.cia);
      donde = p;
    }
    if (!cia) return { ok: false, motivo: "La compañía ya no está" };
    const m = mercPuede(f, cia);
    if (m) return { ok: false, motivo: m };
    OC.pagar(f, { oro: mercEnganche(cia) });
    mercFirmar(f, cia, anos);
    if (o.camp != null) {
      donde.cias = donde.cias.filter((x) => x !== cia);
      ej.u[cia.t] = (ej.u[cia.t] || 0) + cia.n;
      ej.vet[cia.t] = Math.max(ej.vet[cia.t] || 0, MERC_K.vet);
      ej.mov = Math.min(ej.mov, camMovMax(ej));
    } else {
      (M.usado[donde.id] = M.usado[donde.id] || []).push(cia.id);
      cmbLlega(donde, { [cia.t]: cia.n }, { [cia.t]: MERC_K.vet }, {});
    }
    addLog(
      isMe(f)
        ? `Contratas a los ${cia.nom} (${cia.n * SPU} hombres) por ${anos} ${anos > 1 ? "años" : "año"}: ${mercPago(cia.t, cia.n)} de oro cada estación.`
        : `${CIV[f].s} contrata a los ${cia.nom}.`,
      isMe(f) ? "good" : "",
    );
    return { ok: true };
  }
  const c = mercCon(f, o.t);
  if (!c) return { ok: false, motivo: "No hay contrato" };
  if (o.tipo === "renovar") {
    const n = mercCuenta(f, c.t),
      e = Math.ceil(mercEnganche({ t: c.t, n }) / 2);
    if (!OC.pagar(f, { oro: e })) return { ok: false, motivo: "Falta oro" };
    c.hasta = G.year + clamp(+o.anos || 2, 1, 3);
    c.imp = 0;
    if (isMe(f)) addLog(`Renuevas el contrato de los ${c.nom} hasta ${c.hasta}.`, "good");
    return { ok: true };
  }
  if (o.tipo === "licenciar") {
    mercQuitarTropas(f, c.t);
    M.con = M.con.filter((x) => x !== c);
    addLog(isMe(f) ? `Licencias a los ${c.nom}: vuelven a su tierra con su paga.` : `${CIV[f].s} licencia a los ${c.nom}.`);
    return { ok: true };
  }
  return { ok: false, motivo: "Orden desconocida" };
}
/* quita las tropas de un tipo de todas partes; devuelve [{p|ej, n}] */
function mercQuitarTropas(f, t) {
  const r = [];
  for (const p of G.P)
    if (p.owner === f && p.u[t] > 0) {
      r.push({ p, n: p.u[t] });
      p.u[t] = 0;
    }
  for (const e of camS().ej.slice())
    if (e.f === f && e.u[t] > 0) {
      r.push({ ej: e, n: e.u[t] });
      e.u[t] = 0;
      if (camTot(e.u) <= 0) camQuitar(e);
    }
  camTocar();
  return r;
}
/* impago: desertan, saquean donde estén y se echan al monte como bandidos (rebeldes) */
function mercDesertar(c) {
  const sitios = mercQuitarTropas(c.f, c.t),
    F = camF(c.f);
  let saq = 0;
  for (const s of sitios) {
    const p = s.p || camProv(s.ej),
      x = s.p ? s.p.x : s.ej.x,
      y = s.p ? s.p.y : s.ej.y;
    if (p) {
      p.order = clamp(p.order - 20, 0, 100);
      if (typeof ecoDiezmar === "function") ecoDiezmar(p, 0.05);
      if (p.owner === c.f && F) {
        const robo = Math.min(Math.max(0, Math.floor(F.gold)), s.n * 4);
        F.gold -= robo;
        saq += robo;
      }
    }
    /* la banda sale al campo junto a la ciudad o donde estaba el ejército */
    let bx = x,
      by = y;
    if (s.p) {
      const v = CAM_V8.map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => MAP.terr[b]?.[a] && !camEjsEn(a, b).length && !camCiudadEn(a, b));
      if (v) [bx, by] = v;
    }
    const b = camNuevoEj(REB, bx, by, { [c.t]: s.n }, { vet: { [c.t]: MERC_K.vet }, nom: `Desertores ${c.nom.toLowerCase().startsWith("los") ? c.nom : "de " + c.nom}`, sum: 2 });
    b.est = "campamento";
    b.vida = 8;
  }
  mercS().con = mercS().con.filter((x) => x !== c);
  OC.emitirSync("mercDesercion", { f: c.f, contrato: c, saqueo: saq }); /* OC */
  addLog(
    isMe(c.f)
      ? `Los ${c.nom} no cobran su paga: desertan, saquean ${saq ? saq + " de oro y " : ""}los campos, y se echan al monte.`
      : `Los ${c.nom} abandonan a ${CIV[c.f].s} por falta de paga.`,
    isMe(c.f) ? "bad" : "",
  );
}
/* cobro de cada estación (lo llama camEstacion) */
async function camMercEstacion() {
  const M = mercS();
  for (const c of M.con.slice()) {
    if (!alive(c.f)) {
      M.con = M.con.filter((x) => x !== c);
      continue;
    }
    const n = mercCuenta(c.f, c.t);
    if (n <= 0) {
      M.con = M.con.filter((x) => x !== c);
      if (isMe(c.f)) addLog(`Los ${c.nom} ya no existen: el contrato se cierra.`);
      continue;
    }
    const pago = mercPago(c.t, n);
    if (OC.pagar(c.f, { oro: pago })) {
      c.imp = 0;
      c.pagado = (c.pagado || 0) + pago;
    } else {
      c.imp = (c.imp || 0) + 1;
      if (c.imp > MERC_K.gracia) mercDesertar(c);
      else if (isMe(c.f)) addLog(`No hay oro para los ${c.nom} (${pago}): murmuran y amenazan con marcharse.`, "bad");
    }
  }
}
/* primavera: los campamentos se mudan y vencen los contratos */
async function camMercNuevaEstacion() {
  const M = mercS();
  if (G.estacion !== 0 && M.camp.length) return;
  mercCampos();
  M.usado = {};
  for (const c of M.con.slice()) {
    if (c.hasta > G.year) continue;
    const n = mercCuenta(c.f, c.t),
      ren = Math.ceil(mercEnganche({ t: c.t, n }) / 2);
    if (!n) {
      M.con = M.con.filter((x) => x !== c);
      continue;
    }
    if (human(c.f)) {
      if (!isMe(c.f) || net.on) continue;
      const v = await modal(
        `Termina el contrato de los ${c.nom}`,
        `<p>${n * SPU} ${UN[c.t].s.toLowerCase()} han servido desde ${c.desde}. Su capitán pide ${ren} de oro para seguir dos años más (la paga sigue siendo de ${mercPago(c.t, n)} cada estación).</p>`,
        [
          { t: `Renovar · ${ren} oro`, v: "r", cls: "gold", dis: camF(c.f).gold < ren },
          { t: "Licenciarlos", v: "l" },
        ],
      );
      camMercOrden({ tipo: v === "r" ? "renovar" : "licenciar", f: c.f, t: c.t, anos: 2 }, null);
    } else {
      const guerra = [...Array(NF).keys()].some((g) => g !== c.f && alive(g) && G.st[c.f][g] === "guerra"),
        ok = guerra && camF(c.f).gold > ren + mercPago(c.t, n) * 6;
      camMercOrden({ tipo: ok ? "renovar" : "licenciar", f: c.f, t: c.t, anos: 2 }, null);
    }
  }
}
/* ---------- IA: contrata con sentido (en guerra, con oro de sobra para pagar un año) ---------- */
/* o.anual: llamada desde la IA anual (tras cobrar los impuestos, cuando hay más oro) */
function camMercIA(f, o = {}) {
  const F = camF(f),
    M = mercS();
  if (!F || M.con.filter((c) => c.f === f).length >= 2) return [];
  const guerra = [...Array(NF).keys()].filter((g) => g !== f && alive(g) && G.st[f][g] === "guerra");
  if (!guerra.length && F.gold < 300) return [];
  if (!o.anual && R() < 0.5) return [];
  const pagoYa = M.con.filter((c) => c.f === f).reduce((s, c) => s + mercPago(c.t, mercCuenta(f, c.t)), 0),
    neto = typeof inc === "function" ? inc(f).g : 0,
    reserva = 15 + 3 * owned(f).length + Math.max(0, -neto) * 2;
  /* solo si puede pagarles: un año de paga sale del saldo anual o queda en el tesoro */
  const vale = (cia) => {
    const e = mercEnganche(cia),
      pago = mercPago(cia.t, cia.n) + pagoYa,
      sostiene = neto - 4 * pago >= -3 || F.gold - e > pago * 8;
    return F.gold - e - pago * 2 > reserva && sostiene ? (UN[cia.t].pw * cia.n) / (e + pago * 4) : 0;
  };
  /* 1) campamento junto a un ejército propio */
  for (const ej of camEjDe(f)) {
    for (const c of mercCampoCerca(ej)) {
      const cia = c.cias.slice().sort((a, b) => vale(b) - vale(a))[0];
      if (cia && vale(cia) > 0) return [{ tipo: "contratar", f, ej: ej.id, camp: c.id, cia: cia.id, anos: 2 }];
    }
  }
  /* 2) ciudad fronteriza que no esté sitiada */
  const fr = owned(f).filter((p) => hostile(p, f).some((q) => q.owner !== REB) && !camAsedio(p.id));
  for (const p of fr.slice(0, 3)) {
    const cia = mercOfertas(p).sort((a, b) => vale(b) - vale(a))[0];
    if (cia && vale(cia) > 0) return [{ tipo: "contratar", f, p: p.id, cia: cia.id, anos: 2 }];
  }
  return [];
}

/* ---------- interfaz: sección de ciudad y lista para el panel del ejército ---------- */
const mercFicha = (cia) =>
  `<b>${esc(cia.nom)}</b> <span class="stats">${cia.n * SPU} hombres · ${UN[cia.t].s.toLowerCase()} (${MERC_TIPOS[cia.t].d.toLowerCase()})<br>enganche ${mercEnganche(cia)} oro · ${mercPago(cia.t, cia.n)} oro/estación</span>`;
function mercHtmlCias(cias, dis, act) {
  return cias
    .map((cia) => {
      const m = mercPuede(ME, cia);
      return `<div class="cam-merc"><img src="${icon(ME, cia.t)}" alt=""><div>${mercFicha(cia)}<div class="btns"><button data-act="${act(cia, 1)}" ${dis || m ? "disabled" : ""} title="${esc(m || "Un año de servicio")}">1 año</button><button data-act="${act(cia, 3)}" ${dis || m ? "disabled" : ""} title="${esc(m || "Tres años de servicio")}">3 años</button></div></div></div>`;
    })
    .join("");
}
OC.seccion("prov", {
  id: "mercenarios",
  orden: 46,
  visible: (c) => c.mine,
  render: ({ p }, dis) => {
    const of = mercOfertas(p),
      con = mercS().con.filter((c) => c.f === ME && (p.u[c.t] || 0) > 0);
    if (!of.length && !con.length) return "";
    let h = `<h3>Mercenarios</h3>`;
    if (camAsedio(p.id)) h += `<p class="dim">Con la ciudad sitiada no llegan compañías.</p>`;
    else if (of.length)
      h += `<p class="dim">Compañías que se ofrecen este año en ${p.name}${(p.puerto || 0) > 0 ? " (su puerto atrae gente de mar)" : ""}:</p>` +
        mercHtmlCias(of, dis, (cia, a) => `camm-c:${p.id}:${cia.id}:${a}`);
    if (con.length)
      h += con
        .map((c) => `<p class="stats">${esc(c.nom)}: contrato hasta ${c.hasta} · ${mercPago(c.t, mercCuenta(ME, c.t))} oro/estación${c.imp ? " · ¡impagados!" : ""}</p>`)
        .join("");
    return h;
  },
});
OC.accion("camm", (v) => {
  const [k, a, b, c] = v.split(":");
  let o = null;
  if (k === "c") o = { tipo: "contratar", f: ME, p: +a, cia: b, anos: +c };
  if (k === "k") o = { tipo: "contratar", f: ME, ej: +a, camp: +b, cia: +c.split(".")[0], anos: +c.split(".")[1] };
  if (k === "r") o = { tipo: "renovar", f: ME, t: a, anos: 2 };
  if (k === "l") o = { tipo: "licenciar", f: ME, t: a };
  if (!o) return;
  camAplicarOrden(G, o).then((r) => {
    if (r && !r.ok && r.motivo) addLog(r.motivo, "bad");
    ui();
    save();
  });
  return false;
});
OC.on("partidaLista", () => {
  mercDefinir();
  if (!G || !MAP) return;
  const M = mercS();
  if (!M.camp.length) mercCampos();
});
