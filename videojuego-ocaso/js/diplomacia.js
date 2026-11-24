/* ---------- diplomacia: tratados, reputación, agravios y llamadas a las armas ----------
   Estado en G.dip (ver docs/diplomacia.md). G.st sigue guardando solo "guerra" / "paz" /
   "alianza" (lo leen otros sistemas); el resto de pactos vive en G.dip.tr. */
const DIP_DUR = { tregua: 5, nag: 10, comercio: 10, paso: 8, rehenes: 10, vasallaje: 10 };
const DIP_N = {
  paz: "Paz",
  tregua: "Tregua",
  alianza: "Alianza",
  nag: "Pacto de no agresión",
  comercio: "Acuerdo comercial",
  paso: "Derecho de paso",
  rehenes: "Intercambio de rehenes",
  vasallaje: "Protección y tributo",
  tributo: "Exigir tributo",
  embajada: "Embajada",
  boda: "Boda",
  llamada: "Llamada a las armas",
};
const DIP_ART = {
  nag: "un pacto de no agresión",
  comercio: "un acuerdo comercial",
  paso: "un derecho de paso",
  rehenes: "un intercambio de rehenes",
  tregua: "la tregua",
  alianza: "la alianza",
  vasallaje: "el vasallaje",
};
const DIP_DESC = {
  alianza: "Defensiva: acudís si atacan al otro. Ofensiva: también en las guerras que declaréis.",
  nag: "Ninguno atacará al otro en 10 años. Romperlo cuesta reputación.",
  comercio: "10 años de aranceles rebajados: +2 oro al año, +2 por cada ruta comercial entre ambos.",
  paso: "Tus ejércitos se abastecen en sus tierras: +6% en batallas junto a su territorio. 8 años.",
  rehenes: "Cada corte acoge a un joven de la otra durante 10 años. Romper un pacto los condena.",
  vasallaje: "Pasas a pagar tributo a cambio de su protección: acudirán si te atacan.",
  tributo: "Exiges un tributo anual durante 10 años. Si se niegan, tendrás casus belli.",
};
/* reputación que cuesta romper cada tratado declarando la guerra */
const DIP_ROMPER = { alianza: 25, tregua: 20, nag: 15, vasallaje: 12, rehenes: 10, comercio: 0, paso: 0 };
/* personalidad por pueblo: agresividad, honor (cumple su palabra), negociación, codicia */
/* por CIV[f].id; los que falten usan la de su pueblo pariente (civBase) */
const DIP_PERS = {
  occ: { agr: 0.4, hon: 0.6, neg: 0.6, cod: 0.3 },
  ori: { agr: 0.3, hon: 0.5, neg: 0.9, cod: 0.4 },
  vis: { agr: 0.6, hon: 0.5, neg: 0.5, cod: 0.5 },
  hun: { agr: 0.9, hon: 0.3, neg: 0.3, cod: 0.9 },
  van: { agr: 0.75, hon: 0.3, neg: 0.4, cod: 0.65 },
  fra: { agr: 0.6, hon: 0.6, neg: 0.5, cod: 0.4 },
  per: { agr: 0.5, hon: 0.65, neg: 0.7, cod: 0.5 },
  ara: { agr: 0.55, hon: 0.5, neg: 0.6, cod: 0.85 },
  nor: { agr: 0.85, hon: 0.45, neg: 0.3, cod: 0.7 },
  chi: { agr: 0.35, hon: 0.6, neg: 0.85, cod: 0.45 },
  inc: { agr: 0.5, hon: 0.7, neg: 0.5, cod: 0.4 },
  may: { agr: 0.5, hon: 0.5, neg: 0.55, cod: 0.5 },
  azt: { agr: 0.9, hon: 0.4, neg: 0.3, cod: 0.7 },
  gri: { agr: 0.4, hon: 0.55, neg: 0.85, cod: 0.5 },
  egi: { agr: 0.35, hon: 0.6, neg: 0.65, cod: 0.5 },
  ind: { agr: 0.4, hon: 0.65, neg: 0.65, cod: 0.45 },
  cel: { agr: 0.7, hon: 0.6, neg: 0.4, cod: 0.45 },
  esl: { agr: 0.55, hon: 0.55, neg: 0.45, cod: 0.4 },
  mon: { agr: 0.95, hon: 0.35, neg: 0.25, cod: 0.9 },
};
const dipPersBase = (f) =>
  DIP_PERS[CIV[f] && CIV[f].id] || DIP_PERS[CIV[civBase(f)] && CIV[civBase(f)].id] || DIP_PERS.occ;
const DIP_RASGO = {
  Ambicioso: { agr: 0.15, hon: -0.2 },
  Cruel: { agr: 0.1, neg: -0.1 },
  Elocuente: { neg: 0.15 },
  Prudente: { agr: -0.15, hon: 0.1 },
  Piadoso: { hon: 0.15 },
  Valiente: { agr: 0.1 },
  Astuto: { hon: -0.1, neg: 0.05 },
  Leal: { hon: 0.25 },
  Codicioso: { cod: 0.2 },
  Belicoso: { agr: 0.2, neg: -0.1 },
  Paranoico: { neg: -0.15 },
  Justo: { hon: 0.15 },
  Erudito: { neg: 0.1, agr: -0.05 },
};
const dipK = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
const dipSg = (v) => {
  const r = Math.round(v);
  return (r > 0 ? "+" : r < 0 ? "−" : "±") + Math.abs(r);
};
const dipPct = (p) => Math.round(clamp(p, 0, 1) * 100) + "%";
const dipRepTxt = (r) =>
  r >= 80 ? "intachable" : r >= 60 ? "fiable" : r >= 40 ? "dudosa" : r >= 20 ? "pérfida" : "perjura";
const dipNm = (f) => (isMe(f) ? "tu reino" : CIV[f].s);

/* ---------- estado ---------- */
function dipInit() {
  return {
    v: 1,
    tr: [],
    nid: 1,
    mem: {},
    rep: Array(NF).fill(60),
    agr: [],
    rec: [],
    gu: {},
    emb: {},
    buzon: {},
    uso: {},
    hist: { firm: {}, rotos: 0, guerras: 0, paces: 0, llOk: 0, llNo: 0, ia: 0, sinCb: 0 },
    soc: {},
  };
}
function dipS() {
  const S = OC.estado("dip", dipInit);
  if (!S) return null;
  if (!S._ok) {
    const d = dipInit();
    for (const k in d) if (S[k] === undefined) S[k] = d[k];
    S._ok = 1;
  }
  return S;
}
/* partidas antiguas o recibidas online: crea lo que falte a partir de G.st */
function dipSync() {
  if (!G || !G.st) return;
  const S = dipS();
  S._ok = 0;
  dipS();
  for (let a = 0; a < NF; a++)
    for (let b = a + 1; b < NF; b++) {
      const st = G.st[a][b];
      if (st === "alianza" && !dipTr(a, b, "alianza")) dipAdd("alianza", a, b, { sub: "defensiva" }, true);
      if (st !== "alianza") {
        const x = dipTr(a, b, "alianza");
        if (x) dipQuitar(x);
      }
      if (st === "guerra" && !S.gu[dipK(a, b)]) S.gu[dipK(a, b)] = dipGuerraNueva(a, b);
      if (st !== "guerra") delete S.gu[dipK(a, b)];
    }
  for (const c of G.C) dipAmbLea(c);
}
OC.on("partidaLista", dipSync);
/* ambición (0-10) y lealtad al soberano (0-100) de un personaje; ver sociedad.js */
function dipAmbLea(o) {
  const t = o.tr;
  if (o.amb == null)
    o.amb = clamp(ri(1, 7) + (t === "Ambicioso" ? 3 : t === "Leal" ? -3 : t === "Codicioso" ? 1 : 0), 0, 10);
  if (o.lea == null)
    o.lea = clamp(55 + (t === "Leal" ? 20 : t === "Ambicioso" ? -10 : 0) + ri(-5, 5), 0, 100);
  return o;
}
function dipGuerraNueva(a, b) {
  return { y: G.year, a, b, ca: 0, cb: 0, va: 0, vb: 0 };
}

/* ---------- tratados ---------- */
const dipEntre = (x, a, b) => (x.a === a && x.b === b) || (x.a === b && x.b === a);
function dipTr(a, b, t) {
  return dipS().tr.find((x) => x.t === t && dipEntre(x, a, b));
}
function dipTratados(a, b) {
  return dipS().tr.filter((x) => dipEntre(x, a, b));
}
function dipSenor(f) {
  const x = dipS().tr.find((x) => x.t === "vasallaje" && x.b === f);
  return x ? x.a : null;
}
const dipVasallos = (f) =>
  dipS()
    .tr.filter((x) => x.t === "vasallaje" && x.a === f)
    .map((x) => x.b);
const dipAliados = (f) => [...Array(NF).keys()].filter((g) => g !== f && G.st[f][g] === "alianza");
const dipGuerras = (f) => [...Array(NF).keys()].filter((g) => g !== f && alive(g) && G.st[f][g] === "guerra");
function dipAdd(t, a, b, o = {}, quiet) {
  const S = dipS();
  let x = t !== "vasallaje" && dipTr(a, b, t);
  if (x) {
    if (DIP_DUR[t]) x.h = G.year + DIP_DUR[t];
    return x;
  }
  x = { id: S.nid++, t, a, b, y: G.year, h: DIP_DUR[t] ? G.year + DIP_DUR[t] : 0, ...o };
  S.tr.push(x);
  if (!quiet) S.hist.firm[t] = (S.hist.firm[t] || 0) + 1;
  return x;
}
function dipQuitar(x) {
  const S = dipS();
  S.tr = S.tr.filter((y) => y !== x);
  if (x.t === "rehenes") dipLiberar(x);
}
function dipTributo(f) {
  /* sobre los ingresos brutos (inc(f).g es el saldo neto con la economía) */
  const e = inc(f);
  return clamp(Math.round((e.gi ?? e.g) * 0.15), 5, 30);
}
const dipNomVas = (lord) => (["occ", "ori"].includes(CIV[lord].id) ? "federado (foedus)" : "tributario");
function dipVasallaje(lord, vas) {
  const S = dipS(),
    old = S.tr.find((x) => x.t === "vasallaje" && x.b === vas);
  if (old) dipQuitar(old);
  const n = dipTr(lord, vas, "nag");
  if (n) dipQuitar(n);
  const trib = dipTributo(vas);
  dipAdd("vasallaje", lord, vas, { trib, imp: 0 });
  dipMem(lord, vas, "vasallaje", "Pacto de vasallaje", 8, 1);
  addLog(
    `${CIV[vas].s} se somete a ${CIV[lord].s} como ${dipNomVas(lord)}: pagará ${trib} oro al año.`,
    isMe(vas) ? "bad" : isMe(lord) ? "good" : "",
  );
}
/* rehenes: jóvenes de la familia (5-17 años) que no sean soberano ni heredero */
function dipRehenElegible(f) {
  const F = G.F[f];
  return family(f)
    .filter(
      (c) =>
        c.age >= 5 &&
        c.age <= 17 &&
        c.id !== F.heir &&
        c.id !== F.ruler &&
        c.dipReh == null &&
        c.linaje !== false,
    )
    .sort((a, b) => b.age - a.age)[0];
}
function dipRehenes(a, b) {
  const ca = dipRehenElegible(a),
    cb = dipRehenElegible(b);
  if (!ca || !cb) return false;
  ca.dipReh = b;
  cb.dipReh = a;
  dipAdd("rehenes", a, b, { ra: ca.id, rb: cb.id });
  dipMem(a, b, "rehenes", "Rehenes intercambiados", 10, 1);
  addLog(
    `Intercambio de rehenes: ${ca.n} parte a la corte de ${CIV[b].s} y ${cb.n} a la de ${CIV[a].s}.`,
    isMe(a) || isMe(b) ? "good" : "",
  );
  return true;
}
function dipLiberar(x) {
  for (const id of [x.ra, x.rb]) {
    const c = G.C[id];
    if (c && c.dipReh != null) delete c.dipReh;
  }
}
/* quien rompe el pacto (a) arriesga a su rehén en la corte de b */
function dipEjecutarRehen(x, a, b) {
  const c = G.C[x.a === a ? x.ra : x.rb];
  if (!c || !c.alive) return;
  const P = dipPers(b),
    p = 0.55 + (ruler(b).tr === "Cruel" ? 0.3 : 0) - P.hon * 0.3;
  delete c.dipReh;
  if (R() < p) kill(c, `es ejecutado como rehén en la corte de ${CIV[b].s}`);
  else addLog(`${CIV[b].s} devuelve con vida a ${c.n}, rehén de ${CIV[a].s}.`);
}

/* ---------- memoria de agravios y favores (opinión con causas) ----------
   G.rel[a][b] es la opinión total. Cada recuerdo se suma a G.rel y decae d puntos al año;
   lo que no explican los recuerdos es el "trato general", que tiende a 0. */
function dipMem(a, b, k, t, v, d = 1, max = 0) {
  if (a >= NF || b >= NF || a === b || !v) return;
  const S = dipS(),
    key = dipK(a, b),
    l = (S.mem[key] = S.mem[key] || []);
  let m = l.find((x) => x.k === k);
  const old = m ? m.v : 0,
    nv = Math.round(max ? clamp(old + v, -max, max) : old + v);
  if (!m) l.push((m = { k, t, v: 0, d }));
  m.t = t;
  m.d = d;
  m.v = nv;
  relAdd(a, b, nv - old);
}
function dipMotivosRel(a, b) {
  const l = (dipS().mem[dipK(a, b)] || []).filter((m) => m.v).map((m) => [m.t, m.v]),
    rest = Math.round(G.rel[a][b] - l.reduce((s, m) => s + m[1], 0));
  if (Math.abs(rest) >= 2) l.push(["Trato general", rest]);
  return l.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
}
function dipRep(f, v) {
  if (f >= NF) return;
  const S = dipS();
  S.rep[f] = clamp(Math.round((S.rep[f] ?? 60) + v), 0, 100);
}

/* ---------- casus belli ---------- */
function dipCB(a, b) {
  const S = dipS(),
    l = [];
  const lost = G.P.find((p) => p.owner === b && p.home === a);
  if (lost) l.push("Tierras perdidas: " + lost.name);
  const rc = S.rec.find((r) => r.f === a && G.P[r.p] && G.P[r.p].owner === b && r.h >= G.year);
  if (rc) l.push("Reclamación sobre " + G.P[rc.p].name);
  for (const x of S.agr) if (x.a === a && x.b === b && x.h >= G.year) l.push(x.t);
  if (G.rel[a][b] <= -50) l.push("Enemistad declarada");
  const al = dipAliados(a).find((z) => G.st[z][b] === "guerra");
  if (al != null) l.push("Defensa de " + CIV[al].s);
  const sv = dipVasallos(a).find((z) => G.st[z][b] === "guerra");
  if (sv != null) l.push("Protección de " + CIV[sv].s);
  const ra = ruler(a),
    fe = typeof socLealtad === "function" ? socLealtad(a, "cle") : 0;
  const af = dipFeAfin(CIV[a].rel, CIV[b].rel);
  if (
    CIV[a].rel &&
    CIV[b].rel &&
    CIV[a].rel !== CIV[b].rel &&
    (ra.tr === "Piadoso" || fe >= 75 || (dipLey() && af && af.v <= -5 && fe >= 55))
  )
    l.push("Guerra por la fe");
  return [...new Set(l)];
}
function dipAgravio(a, b, t, anios) {
  dipS().agr.push({ a, b, t, h: G.year + anios });
}

/* ---------- afinidades y rechazos entre fes ----------
   Histórico: misma fe +12 y nicenos contra arrianos −8 (como siempre). En el mundo de leyendas,
   además, familias de creencias: los cristianos ven idólatras en los politeístas, los dioses de
   Europa se reconocen entre sí, los ritos americanos extrañan a todos; Tengri tolera. */
const DIP_FE_FAM = {
  niceno: "cri",
  arriano: "cri",
  pagano: "eur",
  nordico: "eur",
  eslavo: "eur",
  druidico: "eur",
  olimpico: "med",
  egipcio: "med",
  andino: "ame",
  mesoamericano: "ame",
  hindu: "asi",
  confuciano: "asi",
  tengri: "est",
  zoroastra: "zor",
  arabe: "ara",
};
const dipLey = () => typeof mundoLeyendas === "function" && mundoLeyendas();
const dipActivas = () => (typeof mundoActivas === "function" ? mundoActivas() : [...Array(NF).keys()]);
/* → {k:'fe'|'credo', v, t} o null */
function dipFeAfin(ra, rb) {
  if (!ra || !rb) return null;
  if (ra === rb) return { k: "fe", v: 12, t: "Misma fe" };
  const par = (x, y) => (ra === x && rb === y) || (ra === y && rb === x);
  if (par("niceno", "arriano")) return { k: "credo", v: -8, t: "Disputa de credo" };
  if (!dipLey()) return null;
  const fa = DIP_FE_FAM[ra],
    fb = DIP_FE_FAM[rb],
    otra = fa === "cri" ? fb : fa;
  if (!fa || !fb || fa === "est" || fb === "est") return null;
  if (fa === fb) return { k: "credo", v: 5, t: "Dioses hermanos" };
  if (fa === "cri" || fb === "cri")
    return otra === "zor"
      ? { k: "credo", v: -6, t: "Rivales en la fe" }
      : otra === "asi"
        ? { k: "credo", v: -3, t: "Fe lejana y extraña" }
        : { k: "credo", v: -6, t: "Idólatras a sus ojos" };
  if (fa === "ame" || fb === "ame") return { k: "credo", v: -5, t: "Ritos de sangre extraños" };
  if (par("zoroastra", "arabe")) return { k: "credo", v: -4, t: "El fuego contra los ídolos" };
  if ((fa === "eur" && fb === "med") || (fa === "med" && fb === "eur"))
    return { k: "credo", v: 2, t: "Dioses parecidos" };
  return null;
}
/* fija los recuerdos permanentes de fe de f con los demás pueblos (tras empezar o convertirse) */
function dipFeMem(f) {
  for (const g of dipActivas()) {
    if (g === f || g >= NF || f >= NF) continue;
    const A = dipFeAfin(CIV[f].rel, CIV[g].rel),
      l = dipS().mem[dipK(f, g)] || [];
    for (const k of ["fe", "credo"]) {
      const m = l.find((x) => x.k === k),
        obj = A && A.k === k ? A : null,
        cur = m ? m.v : 0,
        want = obj ? obj.v : 0;
      if (want !== cur) dipMem(f, g, k, obj ? obj.t : m.t, want - cur, 0);
      else if (m && obj) m.t = obj.t;
    }
  }
}

/* ---------- guerra, paz y alianza ---------- */
function declareWar(a, b, o = {}) {
  if (a === b || a >= NF || b >= NF || G.st[a][b] === "guerra") return;
  const S = dipS(),
    was = G.st[a][b],
    cbs = dipCB(a, b),
    ll = o.motivo === "llamada",
    med = ll ? 0.5 : 1,
    roto = [];
  for (const x of dipTratados(a, b)) {
    const pen = DIP_ROMPER[x.t] || 0;
    if (pen) {
      dipRep(a, -pen * med);
      roto.push(DIP_ART[x.t] || DIP_N[x.t].toLowerCase());
      S.hist.rotos++;
    }
    if (x.t === "rehenes") dipEjecutarRehen(x, a, b);
    dipQuitar(x);
  }
  for (let g = 0; g < NF; g++)
    if (g !== a && g !== b && roto.length) relAdd(a, g, was === "alianza" ? -8 : -4);
  if (was === "alianza") {
    dipMem(a, b, "traicion", `Traición de la alianza (${CIV[a].s})`, -45, 1);
    dipAgravio(b, a, "Traición de " + CIV[a].s, 15);
    addLog(
      `¡Traición! ${ruler(a).n} de ${CIV[a].s} rompe la alianza y declara la guerra a ${CIV[b].s}.`,
      isMe(b) ? "bad" : "",
    );
  } else if (roto.length) {
    dipMem(a, b, "perjurio", `Perjurio: rompió ${roto[0]} (${CIV[a].s})`, -25, 1);
    dipAgravio(b, a, "Pacto roto por " + CIV[a].s, 10);
    addLog(`${CIV[a].s} rompe ${roto.join(" y ")} y declara la guerra a ${CIV[b].s}.`, isMe(b) ? "bad" : "");
  } else
    addLog(
      `${CIV[a].s} declara la guerra a ${CIV[b].s}${ll ? "" : cbs.length ? " (" + cbs[0] + ")" : " sin motivo legítimo"}.`,
      isMe(b) ? "bad" : "",
    );
  if (!cbs.length && !ll) {
    dipRep(a, -10);
    S.hist.sinCb++;
    for (let g = 0; g < NF; g++) if (g !== a && g !== b) relAdd(a, g, -3);
  }
  G.st[a][b] = G.st[b][a] = "guerra";
  S.gu[dipK(a, b)] = dipGuerraNueva(a, b);
  dipMem(a, b, "guerra", "Guerra abierta", -15, 2, 40);
  S.hist.guerras++;
  OC.emitirSync("guerraDeclarada", { a, b });
  if (o.cascada !== false) dipLlamadas(a, b);
}
/* t: términos desde el punto de vista de a (quien propone): ver dipAplicarTerminos */
function makePeace(a, b, t = {}) {
  const S = dipS(),
    war = G.st[a][b] === "guerra";
  G.st[a][b] = G.st[b][a] = "paz";
  delete S.gu[dipK(a, b)];
  if (!war) return;
  const txt = dipAplicarTerminos(a, b, t);
  dipAdd("tregua", a, b);
  relAdd(a, b, 10);
  S.hist.paces++;
  addLog(
    `${CIV[a].s} y ${CIV[b].s} firman la paz${txt ? ": " + txt : ""}. Tregua de ${DIP_DUR.tregua} años.`,
    isMe(a) || isMe(b) ? "good" : "",
  );
  OC.emitirSync("pazFirmada", { a, b });
}
function ally(a, b, sub = "defensiva") {
  const was = G.st[a][b] === "alianza";
  if (G.st[a][b] === "guerra") delete dipS().gu[dipK(a, b)];
  G.st[a][b] = G.st[b][a] = "alianza";
  const x = dipTr(a, b, "alianza");
  if (x) x.sub = sub;
  else dipAdd("alianza", a, b, { sub });
  const n = dipTr(a, b, "nag");
  if (n) dipQuitar(n);
  if (was) return;
  dipMem(a, b, "alianza", "Alianza sellada", 12, 1);
  addLog(`${CIV[a].s} y ${CIV[b].s} sellan una alianza ${sub}.`, isMe(a) || isMe(b) ? "good" : "");
  OC.emitirSync("alianzaSellada", { a, b });
}
/* romper sin guerra: disolver alianza, cancelar comercio/paso, independizarse o liberar a un vasallo */
function dipCancelar(f, x) {
  const g = x.a === f ? x.b : x.a;
  if (x.t === "alianza") {
    G.st[f][g] = G.st[g][f] = "paz";
    dipRep(f, -5);
    dipMem(f, g, "disuelta", `Alianza disuelta por ${CIV[f].s}`, -15, 1);
    addLog(`${CIV[f].s} disuelve su alianza con ${CIV[g].s}.`, isMe(g) ? "bad" : "");
  } else if (x.t === "vasallaje" && x.b === f) {
    if (!x.fallo) {
      dipRep(f, -10);
      dipAgravio(g, f, "Vasallo rebelde", 8);
    }
    dipMem(f, g, "rebelde", `Rechazó el tributo (${CIV[f].s})`, -20, 1);
    addLog(`${CIV[f].s} deja de pagar tributo a ${CIV[g].s} y se proclama libre.`, isMe(g) ? "bad" : "");
  } else if (x.t === "vasallaje") {
    dipMem(f, g, "liberado", "Liberado del tributo", 15, 1);
    addLog(`${CIV[f].s} libera a ${CIV[g].s} de su tributo.`, isMe(g) ? "good" : "");
  } else {
    dipMem(f, g, "cancela", `Canceló ${DIP_ART[x.t] || x.t}`, -6, 1);
    addLog(`${CIV[f].s} cancela ${DIP_ART[x.t] || x.t} con ${CIV[g].s}.`);
  }
  dipQuitar(x);
}

/* ---------- llamada a las armas ---------- */
function dipLlamadas(at, de) {
  const S = dipS(),
    l = [];
  for (let z = 0; z < NF; z++) {
    if (z === at || z === de || !alive(z)) continue;
    const vas = (a, b) => S.tr.some((x) => x.t === "vasallaje" && x.a === a && x.b === b);
    if (dipTr(z, de, "alianza")) l.push([z, de, at, "alianza"]);
    else if (vas(z, de) || vas(de, z)) l.push([z, de, at, "vasallaje"]);
    const ya = dipTr(z, at, "alianza");
    if (ya && ya.sub === "ofensiva") l.push([z, at, de, "alianza"]);
    else if (vas(at, z)) l.push([z, at, de, "vasallaje"]);
  }
  for (const [z, aliado, enemigo, por] of l) dipLlamar(z, aliado, enemigo, por);
}
function dipLlamar(z, aliado, enemigo, por) {
  if (!alive(z) || G.st[z][enemigo] === "guerra" || G.st[z][aliado] === "guerra") return;
  if (G.st[z][enemigo] === "alianza") {
    addLog(`${CIV[z].s} se declara neutral: tiene pactos con ambos bandos.`);
    return;
  }
  if (human(z)) {
    dipBuzon(z, { k: "llamada", from: aliado, contra: enemigo, por });
    return;
  }
  if (R() < dipAceptacion(aliado, z, "llamada", { contra: enemigo }).p) dipAcudir(z, aliado, enemigo);
  else dipNegarLlamada(z, aliado, enemigo, por);
}
function dipAcudir(z, aliado, enemigo) {
  if (G.st[z][enemigo] === "guerra") return;
  dipS().hist.llOk++;
  dipRep(z, 3);
  dipMem(z, aliado, "ayuda", `Acudió a la llamada (${CIV[z].s})`, 15, 1, 30);
  addLog(
    `${CIV[z].s} acude a la llamada de ${CIV[aliado].s} y entra en guerra contra ${CIV[enemigo].s}.`,
    isMe(aliado) || isMe(z) ? "good" : isMe(enemigo) ? "bad" : "",
  );
  declareWar(z, enemigo, { motivo: "llamada", cascada: false });
}
function dipNegarLlamada(z, aliado, enemigo, por) {
  const S = dipS();
  S.hist.llNo++;
  dipRep(z, -8);
  dipMem(z, aliado, "abandono", `Abandonó a su aliado (${CIV[z].s})`, -25, 1, 40);
  let txt = "";
  if (por === "alianza" && R() < 0.35) {
    const x = dipTr(z, aliado, "alianza");
    if (x) dipQuitar(x);
    G.st[z][aliado] = G.st[aliado][z] = "paz";
    txt = " La alianza queda rota.";
  }
  if (por === "vasallaje") {
    const x = S.tr.find((x) => x.t === "vasallaje" && dipEntre(x, z, aliado));
    if (x && x.b === z) dipAgravio(aliado, z, "Vasallo desleal", 8);
    else if (x) x.fallo = 1;
  }
  addLog(`${CIV[z].s} no acude a la llamada de ${CIV[aliado].s}.${txt}`, isMe(aliado) ? "bad" : "");
}

/* ---------- aceptación: probabilidad y motivos ----------
   f propone a g. ext: {sub, contra, exOro, ofOro, exProv, cdProv, exVas, ofVas} */
function dipPers(f) {
  const o = { ...dipPersBase(f) },
    r = ruler(f),
    F = G.F[f],
    m = r && DIP_RASGO[r.tr];
  if (m) for (const k in m) o[k] += m[k];
  if (F) {
    o.agr += ((F.amb ?? 0.5) - 0.5) * 0.2;
    o.hon -= ((F.tre ?? 0.5) - 0.5) * 0.2;
  }
  for (const k in o) o[k] = clamp(o[k], 0, 1);
  return o;
}
function dipPersTxt(f) {
  const P = dipPers(f),
    l = [];
  if (P.agr > 0.7) l.push("belicoso");
  else if (P.agr < 0.35) l.push("pacífico");
  if (P.neg > 0.7) l.push("negociador");
  if (P.hon > 0.65) l.push("de palabra");
  else if (P.hon < 0.35) l.push("traicionero");
  if (P.cod > 0.7) l.push("codicioso");
  return l.slice(0, 2).join(", ") || "cauto";
}
function dipEnemigosComunes(f, g) {
  let n = 0;
  for (let e = 0; e < NF; e++)
    if (e !== f && e !== g && alive(e) && (G.st[f][e] === "guerra" || G.rel[f][e] < -40))
      if (G.st[g][e] === "guerra" || G.rel[g][e] < -40) n++;
  return n;
}
/* marcador de una guerra desde el punto de vista de f (provincias y batallas ganadas) */
function dipMarcador(f, g) {
  const w = dipS().gu[dipK(f, g)];
  if (!w) return 0;
  const s = (w.ca - w.cb) * 2 + (w.va - w.vb) * 0.5;
  return Math.round(w.a === f ? s : -s);
}
function dipAceptacion(f, g, tipo, ext = {}) {
  const S = dipS(),
    mot = [],
    add = (t, v) => {
      if (Math.abs(v) >= 0.01) mot.push([t, v]);
      return v;
    };
  if (!alive(f) || !alive(g)) return { p: 0, mot: [["Reino caído", -1]] };
  if (tipo !== "paz" && tipo !== "llamada" && G.st[f][g] === "guerra")
    return { p: 0, mot: [["Estáis en guerra", -1]] };
  const rl = G.rel[f][g],
    P = dipPers(g),
    rf = ruler(f),
    ratio = (totPow(f) + 5) / (totPow(g) + 5),
    fe = CIV[f].rel && CIV[f].rel === CIV[g].rel;
  let p = 0;
  if (tipo !== "llamada") {
    const nr = dipRutas(f, g);
    if (nr) p += add(`${nr} rutas comerciales`, Math.min(0.15, nr * 0.05));
    p += add("Opinión " + dipSg(rl), tipo === "paz" ? rl / 250 : rl / 120);
    p += add("Reputación " + dipRepTxt(S.rep[f]), (S.rep[f] - 55) / 220);
    p += add("Diplomacia de " + rf.n, (rf.di - 5) * 0.025);
    const can = typeof socCargo === "function" ? socCargo(f, "can") : null;
    if (can) p += add("Canciller " + can.n, (can.di - 4) * 0.015);
    if ((S.emb[f + ">" + g] || 0) >= G.year) p += add("Embajada en su corte", 0.08);
    if (dipTr(f, g, "rehenes")) p += add("Rehenes intercambiados", 0.08);
  }
  switch (tipo) {
    case "paz": {
      const w = S.gu[dipK(f, g)],
        anios = w ? G.year - w.y : 0,
        m = dipMarcador(f, g);
      p += 0.12;
      p += add(`${anios} años de guerra`, Math.min(0.3, anios * 0.06));
      p += add(
        m > 0 ? "Les vas ganando" : m < 0 ? "Te van ganando" : "Guerra igualada",
        clamp(m * 0.06, -0.3, 0.3),
      );
      p += add(ratio > 1 ? "Eres más fuerte" : "Son más fuertes", clamp((ratio - 1) * 0.25, -0.25, 0.25));
      p += add(P.agr > 0.6 ? "Pueblo belicoso" : "Pueblo pacífico", (0.5 - P.agr) * 0.3);
      const otras = dipGuerras(g).length - 1;
      if (otras > 0) p += add("Lucha en otros frentes", otras * 0.1);
      break;
    }
    case "alianza": {
      p -= 0.15;
      const c = dipEnemigosComunes(f, g);
      if (c) p += add("Enemigos comunes", c * 0.15);
      p += add(fe ? "Misma fe" : "Otra fe", fe ? 0.08 : -0.06);
      if (ratio < 0.5) p += add("Te ven débil", -0.15);
      if (ext.sub === "ofensiva") p += add("Alianza ofensiva", -0.12 + (P.agr - 0.5) * 0.3);
      if (dipSenor(f) === g || dipSenor(g) === f) p += add("Vasallaje", 0.1);
      const co = dipCoalicion(f, g);
      if (co != null) p += add("Contra el poder de " + CIV[co].s, 0.15);
      break;
    }
    case "nag":
      p += 0.3;
      if (ratio > 1.3) p += add("Te temen", 0.12);
      if (P.agr > 0.7 && border(f, g)) p += add("Codician tus tierras", -0.15);
      break;
    case "comercio":
      p += 0.3;
      p += add(P.cod > 0.5 ? "Codicia" : "Desinterés", (P.cod - 0.5) * 0.3);
      break;
    case "paso":
      p += 0.05;
      if (dipGuerras(f).some((e) => G.st[g][e] === "alianza")) p += add("Luchas contra su aliado", -0.5);
      break;
    case "rehenes":
      p += 0.15;
      p += add("Honor", (P.hon - 0.5) * 0.3);
      break;
    case "vasallaje":
      p += 0.45;
      p += add("Codicia", P.cod * 0.25);
      if (ratio > 0.8) p += add("Demasiado poderoso para vasallo", -0.3);
      break;
    case "tributo":
      p -= 0.3;
      p += add(ratio > 1.5 ? "Temen tu poder" : "No temen tu poder", clamp((ratio - 1.5) * 0.35, -0.4, 0.5));
      p += add("Orgullo", (0.5 - P.agr) * 0.3 - 0.05);
      if (border(f, g)) p += add("Frontera común", 0.08);
      break;
    case "embajada":
      p += 0.6;
      break;
    case "boda":
      p += 0.3;
      if (ext.c && (ext.c.id === G.F[f].heir || ext.c.fa === G.F[f].ruler)) p += add("Sangre real", 0.1);
      p += add(fe ? "Misma fe" : "Otra fe", fe ? 0.06 : -0.08);
      break;
    case "llamada": {
      const e = ext.contra,
        fz = totPow(f) + totPow(g),
        fe2 = totPow(e) + 1;
      p += 0.3;
      p += add("Honor", P.hon * 0.4);
      p += add("Opinión del llamado " + dipSg(rl), rl / 250);
      p += add("Opinión del enemigo", -G.rel[g][e] / 300);
      p += add(fz > fe2 ? "Bando más fuerte" : "Bando más débil", fz > fe2 ? 0.1 : -0.15);
      p += add("Otras guerras", -0.15 * dipGuerras(g).length);
      break;
    }
  }
  if (tipo !== "llamada" && typeof socEstabilidad === "function" && socEstabilidad(g) < 35)
    p += add("Crisis en su corte", tipo === "paz" ? 0.12 : -0.05);
  if (ext.ofOro) p += add(`Ofreces ${ext.ofOro} oro`, ext.ofOro / 150);
  if (ext.exOro) p += add(`Exiges ${ext.exOro} oro`, -ext.exOro / 140 - (G.F[g].gold < ext.exOro ? 0.25 : 0));
  if (ext.exProv != null) p += add("Exiges " + G.P[ext.exProv].name, -0.3);
  if (ext.cdProv != null) p += add("Cedes " + G.P[ext.cdProv].name, 0.3);
  if (ext.exVas) p += add("Exiges tributo", -0.4 + clamp((ratio - 1.5) * 0.2, 0, 0.3));
  if (ext.ofVas) p += add("Te ofreces como tributario", 0.35);
  const p0 = clamp(p, 0.02, 0.95);
  /* OC 'aceptacionDiplomatica': probabilidad 0..1. ctx {f, g, tipo, ...términos} */
  const p1 = clamp(OC.calc("aceptacionDiplomatica", p0, { f, g, tipo, ...ext }), 0, 1);
  if (Math.abs(p1 - p0) >= 0.01) mot.push(["Otros factores", p1 - p0]);
  mot.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  return { p: p1, mot };
}
function dipPuede(f, g, tipo) {
  const st = G.st[f][g];
  if (f === g || !alive(g) || !alive(f)) return "—";
  if (tipo === "paz") return st === "guerra" ? "" : "No estáis en guerra";
  if (st === "guerra") return "Estáis en guerra";
  switch (tipo) {
    case "alianza":
      return st === "alianza" ? "Ya sois aliados" : "";
    case "nag":
      return st === "alianza" ? "Ya sois aliados" : dipTr(f, g, "nag") ? "Ya hay pacto" : "";
    case "comercio":
    case "paso":
      return dipTr(f, g, tipo) ? "Ya está en vigor" : "";
    case "rehenes":
      return dipTr(f, g, "rehenes")
        ? "Ya hay rehenes"
        : !dipRehenElegible(f) || !dipRehenElegible(g)
          ? "No hay jóvenes que enviar"
          : "";
    case "tributo":
      return dipSenor(g) != null ? "Ya paga tributo" : dipSenor(f) === g ? "Eres su tributario" : "";
    case "vasallaje":
      return dipSenor(f) != null ? "Ya pagas tributo" : dipSenor(g) === f ? "Es tu tributario" : "";
    case "embajada":
      return (dipS().emb[f + ">" + g] || 0) >= G.year ? "Ya tienes embajada" : "";
  }
  return "";
}

/* ---------- términos (oro, provincias, tributo) ---------- */
function dipProvExigible(f, g) {
  const S = dipS(),
    val = (p) =>
      (p.home === f || S.rec.some((r) => r.f === f && r.p === p.id) ? 100 : 0) +
      p.market * 5 +
      p.farm * 4 +
      tot(p.u);
  return owned(g)
    .filter((p) => !p.cap && MAP.adj[p.id].some((i) => G.P[i].owner === f))
    .sort((a, b) => val(b) - val(a))[0];
}
function dipProvCedible(f, g) {
  return owned(f)
    .filter((p) => !p.cap && MAP.adj[p.id].some((i) => G.P[i].owner === g))
    .sort((a, b) => a.market + a.farm - (b.market + b.farm))[0];
}
function dipCeder(p, a) {
  const old = p.owner,
    cap = G.P[G.F[old].capId];
  if (cap && cap.owner === old && cap !== p) add(cap.u, p.u);
  Object.assign(p, {
    owner: a,
    u: { i: 2, a: 0, c: 0 },
    gen: null,
    recent: 2,
    tax: 1,
    order: Math.min(p.order, 50),
  });
}
/* tributo anual: en oro y, si no llega, en especie (bienes al precio del mercado de economía) */
function dipPagarTributo(x) {
  let falta = x.trib - dipPagar(x.b, x.a, x.trib);
  for (const id of ["seda", "vino", "sal", "caballos", "hierro", "madera", "piedra", "comida"]) {
    if (falta <= 0) break;
    const pr = Math.max(0.5, typeof comPrecio === "function" ? +comPrecio(id) || 2 : 2),
      n = Math.min(Math.floor(OC.saldo(x.b, id)), Math.ceil(falta / pr));
    if (n > 0 && OC.pagar(x.b, { [id]: n })) {
      OC.ganar(x.a, { [id]: n });
      falta -= n * pr;
    }
  }
  return falta <= 0.5;
}
/* transfiere hasta n oro de un reino a otro (lo que pueda pagar) con la API de recursos */
function dipPagar(de, a, n) {
  const v = Math.max(0, Math.min(n, Math.floor(OC.saldo(de, "oro"))));
  if (v && OC.pagar(de, { oro: v })) OC.ganar(a, { oro: v });
  return v;
}
function dipAplicarTerminos(f, g, t = {}) {
  const l = [];
  if (t.exOro) l.push(`${CIV[g].s} paga ${dipPagar(g, f, t.exOro)} oro`);
  if (t.ofOro) l.push(`${CIV[f].s} paga ${dipPagar(f, g, t.ofOro)} oro`);
  const pe = G.P[t.exProv],
    pc = G.P[t.cdProv];
  if (pe && pe.owner === g && !pe.cap) {
    dipCeder(pe, f);
    l.push(`${CIV[g].s} cede ${pe.name}`);
  }
  if (pc && pc.owner === f && !pc.cap) {
    dipCeder(pc, g);
    l.push(`${CIV[f].s} cede ${pc.name}`);
  }
  if (t.exVas && dipSenor(g) == null) {
    dipVasallaje(f, g);
    l.push(`${CIV[g].s} queda como ${dipNomVas(f)}`);
  }
  if (t.ofVas && dipSenor(f) == null) {
    dipVasallaje(g, f);
    l.push(`${CIV[f].s} queda como ${dipNomVas(g)}`);
  }
  return l.join(", ");
}
function dipTxtExt(f, g, t = {}) {
  const l = [];
  if (t.exOro) l.push(`${dipNm(g)} paga ${t.exOro} oro`);
  if (t.ofOro) l.push(`${dipNm(f)} paga ${t.ofOro} oro`);
  if (t.exProv != null) l.push(`${dipNm(g)} cede ${G.P[t.exProv].name}`);
  if (t.cdProv != null) l.push(`${dipNm(f)} cede ${G.P[t.cdProv].name}`);
  if (t.exVas) l.push(`${dipNm(g)} paga tributo a ${dipNm(f)}`);
  if (t.ofVas) l.push(`${dipNm(f)} paga tributo a ${dipNm(g)}`);
  if (t.sub) l.push("alianza " + t.sub);
  return l.join(", ");
}
const dipSinExig = (e) => {
  const o = { ...e };
  delete o.exOro;
  delete o.exProv;
  delete o.exVas;
  return o;
};
function dipExtValido(f, g, e = {}) {
  if (e.exProv != null && (!G.P[e.exProv] || G.P[e.exProv].owner !== g)) return false;
  if (e.cdProv != null && (!G.P[e.cdProv] || G.P[e.cdProv].owner !== f)) return false;
  return true;
}

/* ---------- ejecutar / rechazar propuestas ---------- */
function dipEjecutar(f, g, tipo, ext = {}) {
  if (!dipExtValido(f, g, ext)) return;
  if (tipo === "paz") return makePeace(f, g, ext);
  if (dipPuede(f, g, tipo)) return;
  const txt = dipAplicarTerminos(f, g, ext),
    cls = isMe(f) || isMe(g) ? "good" : "";
  if (tipo === "alianza") ally(f, g, ext.sub || "defensiva");
  else if (tipo === "nag" || tipo === "comercio" || tipo === "paso") {
    dipAdd(tipo, f, g);
    if (tipo === "comercio") {
      dipAbrirRuta(f, g);
      dipAbrirRuta(g, f);
    }
    dipMem(f, g, tipo, DIP_N[tipo], 6, 1);
    addLog(`${CIV[f].s} y ${CIV[g].s} firman ${DIP_ART[tipo]}${txt ? " (" + txt + ")" : ""}.`, cls);
  } else if (tipo === "rehenes") dipRehenes(f, g);
  else if (tipo === "vasallaje") dipVasallaje(g, f);
  else if (tipo === "tributo") dipVasallaje(f, g);
  else if (tipo === "embajada") dipEmbajada(f, g);
}
function dipRechazo(f, g, tipo) {
  relAdd(f, g, -3);
  if (tipo === "tributo") {
    dipAgravio(f, g, "Tributo negado", 6);
    dipMem(f, g, "tributoNo", `Negó el tributo (${CIV[g].s})`, -10, 1);
    addLog(`${CIV[g].s} se niega a pagar tributo a ${CIV[f].s}.`, isMe(f) ? "bad" : "");
  }
}
function dipProponer(f, g, tipo, ext = {}) {
  if (dipPuede(f, g, tipo) || !dipExtValido(f, g, ext)) return false;
  if (human(g)) return dipBuzon(g, { k: "prop", from: f, tipo, ext });
  if (!human(f)) dipS().hist.ia++;
  if (R() < dipAceptacion(f, g, tipo, ext).p) {
    dipEjecutar(f, g, tipo, ext);
    return true;
  }
  dipRechazo(f, g, tipo);
  return false;
}
function dipEmbajada(f, g) {
  dipS().emb[f + ">" + g] = G.year + 8;
  dipMem(f, g, "embajada", `Embajada de ${CIV[f].s}`, 8, 1);
  addLog(`${CIV[f].s} abre una embajada en la corte de ${CIV[g].s}.`, isMe(g) ? "good" : "");
}
function dipFabricar(f, g) {
  const S = dipS(),
    esp = typeof socCargo === "function" ? socCargo(f, "esp") : null,
    it = Math.max(ruler(f).in, esp ? esp.in : 0),
    p = owned(g).find(
      (q) => MAP.adj[q.id].some((i) => G.P[i].owner === f) && !S.rec.some((r) => r.f === f && r.p === q.id),
    );
  (S.uso[f] = S.uso[f] || {}).rec = G.year;
  if (!p) return false;
  if (R() < clamp(0.35 + (it - 5) * 0.06, 0.15, 0.85)) {
    S.rec.push({ f, p: p.id, h: G.year + 20 });
    if (isMe(f))
      addLog(`Tus juristas documentan derechos antiguos sobre ${p.name}: reclamación válida.`, "good");
    return true;
  }
  if (R() < 0.5) {
    dipMem(f, g, "falsario", `Documentos falsos de ${CIV[f].s}`, -10, 1);
    addLog(`${CIV[g].s} descubre a los falsarios de ${CIV[f].s}.`, isMe(f) ? "bad" : isMe(g) ? "good" : "");
  } else if (isMe(f)) addLog("Los juristas no hallan nada convincente.");
  return false;
}

/* ---------- buzón propio (propuestas nuevas al jugador) ---------- */
function dipBuzon(f, it) {
  const S = dipS(),
    b = (S.buzon[f] = S.buzon[f] || []);
  if (b.some((x) => x.k === it.k && x.from === it.from)) return false;
  if (it.k === "prop" && b.filter((x) => x.k === "prop").length >= 3) return false;
  b.push({ ...it, y: G.year });
  dipAvisarHumano(f, it);
  return true;
}
/* G.inbox (narrativa) solo para los tipos de siempre: peace, ally, marry */
function pushInbox(f, it) {
  (G.inbox[f] = G.inbox[f] || []).push(it);
  dipAvisarHumano(f, it);
}
/* evento 'propuestaHumana' {de, a, tipo, ...}: una propuesta espera a un jugador humano
   (online la usa para dejar aviso a quien no está conectado) */
function dipAvisarHumano(f, it) {
  if (!human(f)) return;
  const tipo =
    it.k === "prop"
      ? it.tipo
      : it.k === "marry"
        ? "boda"
        : it.k === "peace"
          ? "paz"
          : it.k === "ally"
            ? "alianza"
            : it.k;
  OC.emitirSync("propuestaHumana", {
    de: it.from,
    a: f,
    tipo,
    ...(it.ext ? { ext: it.ext } : {}),
    ...(it.contra != null ? { contra: it.contra } : {}),
    ...(it.k === "marry" ? { pa: it.a, pb: it.b } : {}),
  });
}
OC.on("inicioTurno", async (f) => {
  const S = dipS(),
    box = (S.buzon[f] || []).filter((x) => x.y >= G.year - 1);
  S.buzon[f] = [];
  for (const it of box) await dipItem(f, it);
});
function dipFrase(g, f, tipo, ext) {
  const t = dipTxtExt(g, f, ext);
  const fr = {
    paz: "ofrece la paz",
    alianza: `propone una alianza ${ext.sub || "defensiva"}`,
    nag: "propone un pacto de no agresión por 10 años",
    comercio: "propone un acuerdo comercial por 10 años",
    paso: "pide derecho de paso mutuo para vuestros ejércitos",
    rehenes: "propone intercambiar rehenes como prenda de buena fe",
    vasallaje: "ofrece pagarte tributo a cambio de tu protección",
    tributo: `exige que le pagues ${dipTributo(f)} oro al año como tributario`,
  }[tipo];
  return `${fr}${t && tipo !== "alianza" ? ". Condiciones: " + t : ""}.`;
}
async function dipItem(f, it) {
  const g = it.from;
  if (!alive(g) || !alive(f)) return;
  const rn = `${ttl(ruler(g))} ${ruler(g).n} de ${CIV[g].s}`;
  if (it.k === "llamada") {
    const e = it.contra;
    if (G.st[g][e] !== "guerra" || G.st[f][e] === "guerra" || G.st[f][g] === "guerra") return;
    await modal(
      "Llamada a las armas",
      `<p>${rn} invoca vuestra ${it.por} y te llama a las armas contra ${CIV[e].n}.</p><p class="dim">Si acudes, entrarás en guerra con ellos sin perder reputación. Si te niegas, perderás 8 de reputación y su favor${it.por === "alianza" ? "; la alianza puede romperse" : ""}.</p>`,
      [
        { t: "Acudir a la guerra", cls: "red", fn: () => dipAcudir(f, g, e) },
        { t: "Quedarse al margen", fn: () => dipNegarLlamada(f, g, e, it.por) },
      ],
    );
    return;
  }
  if (it.k !== "prop" || dipPuede(g, f, it.tipo) || !dipExtValido(g, f, it.ext)) return;
  await modal(
    DIP_N[it.tipo],
    `<p>${rn} ${dipFrase(g, f, it.tipo, it.ext || {})}</p>${DIP_DESC[it.tipo] && it.tipo !== "vasallaje" && it.tipo !== "tributo" ? `<p class="dim">${DIP_DESC[it.tipo]}</p>` : ""}${it.tipo === "tributo" ? '<p class="dim">Si te niegas, tendrán casus belli contra ti.</p>' : ""}`,
    [
      { t: "Aceptar", cls: "gold", fn: () => dipEjecutar(g, f, it.tipo, it.ext || {}) },
      { t: "Rechazar", fn: () => dipRechazo(g, f, it.tipo) },
    ],
  );
}

/* ---------- el año diplomático (lo llama turnos.js antes de mover la IA) ---------- */
function drift() {
  const S = dipS();
  for (const key in S.mem) {
    const [a, b] = key.split("-").map(Number);
    S.mem[key] = S.mem[key].filter((m) => {
      if (!m.v) return false;
      if (!m.d || (m.k === "guerra" && G.st[a][b] === "guerra")) return true;
      const nv = m.v > 0 ? Math.max(0, m.v - m.d) : Math.min(0, m.v + m.d);
      relAdd(a, b, nv - m.v);
      m.v = nv;
      return nv !== 0;
    });
  }
  for (let a = 0; a < NF; a++)
    for (let b = a + 1; b < NF; b++) {
      if (G.st[a][b] === "guerra") dipMem(a, b, "guerra", "Guerra abierta", -3, 2, 40);
      const rest = G.rel[a][b] - (S.mem[dipK(a, b)] || []).reduce((s, m) => s + m.v, 0);
      if (rest >= 1) relAdd(a, b, -1);
      else if (rest <= -1) relAdd(a, b, 1);
    }
  for (const x of S.tr.slice()) {
    if (!alive(x.a) || !alive(x.b)) {
      dipQuitar(x);
      continue;
    }
    if (x.t === "vasallaje") {
      if (dipPagarTributo(x)) x.imp = 0;
      else {
        x.imp = (x.imp || 0) + 1;
        dipMem(x.a, x.b, "impago", "Tributo impagado", -8, 1, 20);
        if (x.imp >= 2) dipAgravio(x.a, x.b, "Vasallo moroso", 6);
        if (isMe(x.a) || isMe(x.b)) addLog(`${CIV[x.b].s} no puede pagar su tributo a ${CIV[x.a].s}.`, "bad");
      }
    }
    if (x.t === "comercio") {
      for (const f of [x.a, x.b]) OC.ganar(f, { oro: dipComercio(f, f === x.a ? x.b : x.a) });
      dipMem(x.a, x.b, "comercio", "Comercio próspero", 1, 0, 10);
    }
    if (x.h && x.h <= G.year) {
      dipQuitar(x);
      if (isMe(x.a) || isMe(x.b))
        addLog(
          `Expira ${DIP_ART[x.t] || x.t} entre ${CIV[x.a].s} y ${CIV[x.b].s}.`,
          x.t === "vasallaje" && isMe(x.b) ? "good" : "",
        );
    }
  }
  for (let f = 0; f < NF; f++) if (S.rep[f] < 60) dipRep(f, 2);
  S.agr = S.agr.filter((x) => x.h >= G.year);
  S.rec = S.rec.filter((x) => x.h >= G.year && G.P[x.p]);
  for (const k in S.emb) if (S.emb[k] < G.year) delete S.emb[k];
  if (dipLey()) dipLeyAnual();
}
/* oro anual que da un acuerdo comercial a f (economía puede leer G.dip.tr y definir
   ecoComercioDiplomacia = true para encargarse ella del pago) */
function dipComercio(f, g) {
  return Math.min(10, 2 + 2 * dipRutas(f, g));
}
/* rutas comerciales de economía (G.eco.rutas) que unen a f y g en cualquier sentido */
function dipRutas(f, g) {
  const R = G.eco && G.eco.rutas;
  if (!R) return 0;
  return R.filter((r) => {
    const A = G.P[r.a],
      B = G.P[r.b];
    return A && B && ((A.owner === f && B.owner === g) || (A.owner === g && B.owner === f));
  }).length;
}
/* al firmar el acuerdo, la IA abre una ruta hacia su socio si la economía lo permite */
function dipAbrirRuta(f, g) {
  if (human(f) || typeof comMotivo !== "function" || typeof comAbrir !== "function") return;
  let best = null;
  for (const A of owned(f))
    for (const B of owned(g))
      if (!comMotivo(f, A, B)) {
        const v = typeof comValor === "function" ? comValor(f, A, B).v : 1;
        if (!best || v > best.v) best = { A, B, v };
      }
  if (best) comAbrir(f, best.A, best.B);
}

/* ---------- mundo de leyendas: fronteras vivas, tierras disputadas y coaliciones ----------
   Solo con G.modo === 'leyendas' (el histórico no cambia): pueblos en expansión que se encuentran,
   rivalidades de fe, disputas por las tierras libres que ambos codiciaban y recelo del más fuerte. */
/* el más fuerte del mapa: muchas más provincias que la media y que el segundo */
function dipHegemon() {
  const n = dipActivas()
    .filter(alive)
    .map((f) => [f, owned(f).length])
    .sort((a, b) => b[1] - a[1]);
  if (n.length < 3) return null;
  const media = n.reduce((s, x) => s + x[1], 0) / n.length;
  return n[0][1] >= Math.max(8, media * 1.6) && n[0][1] >= n[1][1] * 1.2 ? n[0][0] : null;
}
/* empuje extra hacia la guerra contra un vecino g (solo leyendas) */
function dipTensionLey(f, g) {
  if (!dipLey()) return 0;
  const P = dipPers(f),
    A = dipFeAfin(CIV[f].rel, CIV[g].rel),
    libre = owned(f).some((p) => MAP.adj[p.id].some((i) => G.P[i].owner === REB)),
    h = dipHegemon();
  let d = 0.08;
  if (!libre) d += 0.08 + (P.agr > 0.6 ? 0.08 : 0);
  if (A && A.v < 0) d += -A.v / 50;
  if (h === g) d += 0.15 + (dipAliados(f).some((z) => G.st[z][g] === "guerra") ? 0.25 : 0);
  /* sin ensañarse con un pueblo casi vencido; un imperio ya extenso pierde el apetito */
  if (owned(g).length <= 2 && !G.P.some((p) => p.owner === g && p.home === f)) d -= 0.2;
  const media =
    dipActivas()
      .filter(alive)
      .reduce((s, x) => s + owned(x).length, 0) / Math.max(1, dipActivas().filter(alive).length);
  if (owned(f).length >= media * 2) d -= 0.15;
  return d;
}
function dipLeyAnual() {
  const S = dipS(),
    act = dipActivas().filter(alive);
  S.cto = S.cto || {};
  for (const a of act)
    for (const b of act) {
      if (b <= a || S.cto[dipK(a, b)] || !border(a, b)) continue;
      S.cto[dipK(a, b)] = G.year;
      const A = dipFeAfin(CIV[a].rel, CIV[b].rel),
        v = (A ? Math.sign(A.v) * 6 : 0) + 3 - Math.round((dipPers(a).agr + dipPers(b).agr) * 6);
      dipMem(a, b, "contacto", v >= 0 ? "Primer contacto cordial" : "Fronteras nuevas y recelosas", v, 1);
      if (isMe(a) || isMe(b)) addLog(`${CIV[a].s} y ${CIV[b].s} se encuentran: sus fronteras ya se tocan.`);
    }
  const h = dipHegemon();
  if (h != null)
    for (const f of act)
      if (f !== h && (border(f, h) || G.st[f][h] === "guerra"))
        dipMem(f, h, "recelo", `Recelo del poder de ${CIV[h].s}`, -3, 1, 18);
}
/* quien conquista tierras libres que un vecino también tocaba le deja un agravio */
OC.on("conquista", ({ p, de, a }) => {
  if (de !== REB || a == null || a >= NF || !p || !dipLey()) return;
  for (const f of dipActivas()) {
    if (f === a || !alive(f) || !MAP.adj[p.id].some((i) => G.P[i].owner === f)) continue;
    if (R() < 0.35 + dipPers(f).agr * 0.4) {
      dipAgravio(f, a, "Tierras disputadas: " + p.name, 10);
      dipMem(f, a, "disputa", "Disputa por tierras de frontera", -6, 1, 18);
    }
  }
});
/* ¿f y g se aliarían contra el más fuerte? */
function dipCoalicion(f, g) {
  const h = dipLey() ? dipHegemon() : null;
  return h != null && h !== f && h !== g && G.rel[f][h] < 0 && G.rel[g][h] < 0 ? h : null;
}
/* marcador de guerra y abastecimiento por derecho de paso */
OC.on("conquista", ({ de, a }) => {
  const w = de < NF && a < NF && dipS().gu[dipK(de, a)];
  if (w) w.a === a ? w.ca++ : w.cb++;
});
OC.on("batallaResuelta", ({ atacante, defensor, gana }) => {
  const w = atacante < NF && defensor < NF && dipS().gu[dipK(atacante, defensor)];
  if (!w) return;
  const v = gana ? atacante : defensor;
  w.a === v ? w.va++ : w.vb++;
});
OC.mod("bonoBatalla", (v, c) => {
  if (!G || !G.dip || c.f == null || c.f >= NF || c.p == null) return;
  const p = typeof c.p === "number" ? G.P[c.p] : c.p;
  if (!p) return;
  const ok = dipS().tr.some((x) => {
    if (x.t !== "paso" || (x.a !== c.f && x.b !== c.f)) return false;
    const h = x.a === c.f ? x.b : x.a;
    return p.owner === h || MAP.adj[p.id].some((i) => G.P[i].owner === h);
  });
  return ok ? v * 1.06 : v;
});

/* apodo del soberano según la crónica (narrativa), si lo hay */
function dipApodo(f) {
  try {
    return typeof narApodoActual === "function" ? narApodoActual(f) || "" : "";
  } catch (e) {
    return "";
  }
}

/* ---------- bodas y asesinatos ---------- */
const border = (a, b) => owned(a).some((p) => MAP.adj[p.id].some((i) => G.P[i].owner === b));
const bachelors = (f) =>
  family(f).filter(
    (c) =>
      c.sp == null &&
      c.age >= 16 &&
      c.age <= 42 &&
      c.id !== G.F[f].ruler &&
      c.id !== G.F[f].heir &&
      c.dipReh == null &&
      c.linaje !== false &&
      !c.dipCort,
  );
function marryAcross(mine, theirs) {
  const g = theirs.f,
    f = mine.f;
  theirs.f = f;
  G.P.forEach((p) => {
    if (p.gen === theirs.id) p.gen = null;
  });
  marry(mine, theirs);
  dipMem(f, g, "boda", "Boda dinástica", 20, 1, 35);
  addLog(
    `Boda: ${mine.n} (${CIV[f].s}) se casa con ${theirs.n} (${CIV[g].s}).`,
    isMe(f) || isMe(g) ? "good" : "",
  );
  if (G.st[f][g] === "paz" && G.rel[f][g] >= 25) ally(f, g);
}
function dipProbAsesinato(f, t) {
  const esp = typeof socCargo === "function" ? socCargo(f, "esp") : null,
    def = typeof socCargo === "function" ? socCargo(t.f, "esp") : null,
    it = Math.max(ruler(f).in, esp ? esp.in : 0);
  return clamp(0.35 + (it - t.in) * 0.05 - (def ? (def.in - 4) * 0.02 : 0), 0.1, 0.8);
}
function tryAssassin(f, target) {
  const ch = dipProbAsesinato(f, target);
  G.F[f].asn = 1;
  if (R() < ch) {
    addLog(
      `${target.n} (${CIV[target.f].s}) aparece muerto: ¿veneno?`,
      isMe(f) ? "good" : isMe(target.f) ? "bad" : "",
    );
    kill(target, "ha sido asesinado");
    return true;
  }
  if (R() < 0.6) {
    dipMem(f, target.f, "complot", `Complot de ${CIV[f].s} descubierto`, -40, 1);
    dipAgravio(target.f, f, "Complot de " + CIV[f].s, 10);
    dipRep(f, -10);
    addLog(
      `Se descubre un complot de ${CIV[f].s} contra ${target.n}.`,
      isMe(target.f) ? "good" : isMe(f) ? "bad" : "",
    );
    if (!human(target.f) && G.st[f][target.f] !== "guerra" && R() < 0.6) declareWar(target.f, f);
  } else if (isMe(f)) addLog(`El asesino fracasa en silencio. Nadie sabe nada.`);
  return false;
}

/* ---------- IA ---------- */
function dipDeseoGuerra(f, g) {
  if (!alive(g) || G.st[f][g] === "guerra" || !border(f, g)) return 0;
  const P = dipPers(f),
    rl = G.rel[f][g],
    pg =
      totPow(g) +
      5 +
      dipAliados(g)
        .filter((z) => z !== f)
        .reduce((s, z) => s + totPow(z) * 0.4, 0) +
      (dipSenor(g) != null && dipSenor(g) !== f ? totPow(dipSenor(g)) * 0.4 : 0);
  let d = P.agr * 0.6 + clamp((totPow(f) + 5) / pg - 1, -1, 1.5) * 0.5 - rl / 120;
  d += dipCB(f, g).length ? 0.2 : -0.25 * P.hon - 0.05;
  for (const x of dipTratados(f, g))
    d -= {
      alianza: 0.9,
      tregua: 0.4 + P.hon * 0.5,
      nag: 0.3 + P.hon * 0.4,
      rehenes: 0.4,
      vasallaje: 0.5,
      comercio: 0.1,
      paso: 0.05,
    }[x.t];
  d += dipTensionLey(f, g);
  d -= dipGuerras(f).length * 0.35;
  if (human(g) && G.year < 414) d -= 0.4;
  if (typeof socEstabilidad === "function") d -= Math.max(0, 45 - socEstabilidad(f)) / 100;
  return d;
}
function dipTerminosIA(f, g) {
  const m = dipMarcador(f, g),
    P = dipPers(f),
    ratio = (totPow(f) + 5) / (totPow(g) + 5);
  if (m >= 4 || (m >= 2 && ratio > 1.5)) {
    if (P.cod > 0.6 && dipSenor(g) == null && dipSenor(f) !== g) return { exVas: 1 };
    const p = dipProvExigible(f, g);
    if (p && R() < 0.6) return { exProv: p.id };
    return { exOro: clamp(Math.round(G.F[g].gold * 0.5), 20, 80) };
  }
  if (m >= 2) return { exOro: 40 };
  if (m <= -3 || ratio < 0.5) {
    if (owned(f).length <= 2 && dipSenor(f) == null && dipSenor(g) == null) return { ofVas: 1 };
    if (G.F[f].gold >= 40) return { ofOro: Math.min(80, Math.round(G.F[f].gold / 2)) };
    if (P.neg > 0.5 && dipSenor(f) == null) return { ofVas: 1 };
  }
  return {};
}
function dipIAPropuesta(f) {
  const P = dipPers(f),
    l = [];
  for (let g = 0; g < NF; g++) {
    if (g === f || !alive(g) || G.st[f][g] === "guerra") continue;
    const rl = G.rel[f][g],
      ratio = (totPow(f) + 5) / (totPow(g) + 5),
      bo = border(f, g),
      com = dipEnemigosComunes(f, g),
      ok = (t) => !dipPuede(f, g, t),
      c = (tipo, peso, ext = {}) => {
        if (ok(tipo)) l.push({ g, tipo, ext, s: dipAceptacion(f, g, tipo, ext).p * peso });
      };
    const coal = dipCoalicion(f, g) != null;
    if (rl > 30 || com || coal)
      c("alianza", 0.6 + com * 0.3 + (coal ? 0.4 : 0), {
        sub: P.agr > 0.6 && R() < 0.5 ? "ofensiva" : "defensiva",
      });
    if (bo && rl > -15 && (P.agr < 0.6 || ratio < 1)) c("nag", 0.45);
    if (rl > -5) c("comercio", 0.25 + P.cod * 0.5);
    if (dipGuerras(f).some((e) => border(g, e))) c("paso", 0.35);
    if (dipTr(f, g, "tregua") || dipTr(f, g, "nag")) c("rehenes", 0.2);
    if (bo && ratio > 1.6 && P.cod > 0.45) c("tributo", P.cod);
    if (
      dipLey()
        ? ratio < 0.5 && (dipGuerras(f).length || owned(f).length <= 3) && rl > -20
        : ratio < 0.4 && dipGuerras(f).length && rl > 0
    )
      c("vasallaje", 0.6);
    if (rl > -25 && rl < 60 && G.F[f].gold > 60) c("embajada", 0.25);
  }
  return l.sort((a, b) => b.s - a.s)[0];
}
function aiDiplo(f) {
  if (!alive(f)) return;
  const S = dipS(),
    F = G.F[f],
    P = dipPers(f);
  /* vasallo que ya no teme a su señor */
  const sn = dipSenor(f);
  if (sn != null && (totPow(f) + 5) / (totPow(sn) + 5) > 1.2 && R() < 0.12 * (1.2 - P.hon)) {
    const x = S.tr.find((x) => x.t === "vasallaje" && x.b === f);
    if (x) dipCancelar(f, x);
  }
  for (let g = 0; g < NF; g++) {
    if (g === f || !alive(g)) continue;
    const s = G.st[f][g];
    if (s === "guerra") {
      const w = S.gu[dipK(f, g)],
        anios = w ? G.year - w.y : 0,
        m = dipMarcador(f, g),
        q =
          0.12 +
          anios * 0.06 +
          (m < 0 ? 0.15 : 0) +
          (dipGuerras(f).length - 1) * 0.1 +
          P.neg * 0.15 -
          P.agr * 0.1;
      if (R() < q) dipProponer(f, g, "paz", dipTerminosIA(f, g));
      continue;
    }
    if (s === "alianza" && G.rel[f][g] < -20 && R() < 0.2) {
      const x = dipTr(f, g, "alianza");
      if (x) dipCancelar(f, x);
      continue;
    }
    const d = dipDeseoGuerra(f, g);
    if (d > 0.7 && R() < 0.1 + (d - 0.7)) {
      declareWar(f, g);
      continue;
    }
    if (
      d > 0.35 &&
      !dipCB(f, g).length &&
      P.agr > 0.55 &&
      F.gold > 50 &&
      (S.uso[f]?.rec || 0) < G.year - 2 &&
      R() < 0.3
    ) {
      F.gold -= 30;
      dipFabricar(f, g);
    }
  }
  /* una propuesta en tiempo de paz por año */
  if (R() < 0.35 + P.neg * 0.35) {
    const op = dipIAPropuesta(f);
    if (op && op.s > 0.12) {
      if (op.tipo === "embajada") {
        if (!human(op.g)) S.hist.ia++;
        F.gold -= 25;
        dipEmbajada(f, op.g);
      } else if (op.s < 0.3 && op.tipo === "alianza" && F.gold > 120 && !human(op.g)) {
        F.gold -= 40;
        dipMem(f, op.g, "regalo", "Regalos", 8, 2, 30);
      } else dipProponer(f, op.g, op.tipo, op.ext);
    }
  }
  /* bodas y asesinatos */
  for (let g = 0; g < NF; g++) {
    if (g === f || !alive(g)) continue;
    const rl = G.rel[f][g];
    if (G.st[f][g] !== "guerra" && rl > 10 && R() < 0.07) {
      const a = pick(bachelors(f)),
        b = a && bachelors(g).find((c) => c.sex !== a.sex);
      if (a && b) {
        if (human(g)) pushInbox(g, { k: "marry", from: f, a: a.id, b: b.id });
        else if (R() < dipAceptacion(f, g, "boda", { c: a }).p) marryAcross(a, b);
      }
    }
    if (rl < -40 && !F.asn && R() < 0.04) {
      const t = pick([G.C[G.F[g].heir], ...family(g).filter((c) => genOf(c))].filter(Boolean));
      if (t) tryAssassin(f, t);
    }
  }
}

/* ---------- panel de diplomacia ---------- */
function dipTag(f, g) {
  const st = G.st[f][g],
    tg = (c, t) => `<span class="tag ${c}">${t}</span>`;
  if (st === "guerra") return tg("guerra", "guerra");
  if (st === "alianza")
    return tg("alianza", dipTr(f, g, "alianza")?.sub === "ofensiva" ? "alianza of." : "alianza");
  if (dipSenor(g) === f) return tg("dip-vas", "tributario");
  if (dipSenor(f) === g) return tg("dip-vas", "tu señor");
  const t = dipTr(f, g, "tregua");
  if (t) return tg("dip-tre", `tregua ${Math.max(1, t.h - G.year)}a`);
  return tg("", dipTr(f, g, "nag") ? "pacto" : "paz");
}
function dipLineaTratado(x, f) {
  const g = x.a === f ? x.b : x.a,
    left = x.h ? ` · ${Math.max(1, x.h - G.year)} años` : "";
  let t = DIP_N[x.t];
  if (x.t === "alianza") t = `Alianza ${x.sub}`;
  if (x.t === "vasallaje")
    t = x.a === f ? `Tributario: te paga ${x.trib} oro/año` : `Pagas ${x.trib} oro/año de tributo`;
  if (x.t === "comercio") t += ` · +${dipComercio(f, g)} oro/año · ${dipRutas(f, g)} rutas`;
  if (x.t === "rehenes") {
    const c = G.C[x.a === f ? x.rb : x.ra];
    t += c ? ` · tienes a ${c.n}` : "";
  }
  const can = ["alianza", "comercio", "paso", "vasallaje"].includes(x.t);
  return `<li>${t}${left}${can ? ` <button class="dip-x" data-act="dipcan-${x.id}" title="Romper">✕</button>` : ""}</li>`;
}
function dipFila(g, dis) {
  const S = dipS(),
    F = G.F[ME],
    rl = Math.round(G.rel[ME][g]),
    rr = ruler(g),
    hum = human(g),
    used = !!F.dip[g],
    st = G.st[ME][g],
    open = !!dipAbiertos[g],
    oc = rl < -20 ? "neg" : rl < 20 ? "mid" : "pos";
  let h = `<details class="dip-r" data-dipg="${g}"${open ? " open" : ""}><summary><b style="color:${CIV[g].c}">${CIV[g].s}</b>${dipTag(ME, g)}<span class="dip-op ${oc}" title="Opinión">${dipSg(rl)}</span></summary>`;
  const apo = dipApodo(g);
  h += `<span class="stats">${ttl(rr)} ${esc(rr.n)}${apo ? " " + apo : ""} (${rr.age}) · ${dipPersTxt(g)} · reputación ${S.rep[g]}${hum ? " · jugador" + (net.names[net.seats[g]] ? " " + esc(net.names[net.seats[g]]) : "") : ""}</span>`;
  h += `<div class="bar"><i style="width:${(rl + 100) / 2}%;background:${rl < -20 ? "#e0503f" : rl < 20 ? "#e8b632" : "#4caf50"}"></i></div>`;
  const mot = dipMotivosRel(ME, g).slice(0, 5);
  if (mot.length)
    h += `<ul class="dip-mot">${mot.map(([t, v]) => `<li><b class="${v < 0 ? "neg" : "pos"}">${dipSg(v)}</b> ${t}</li>`).join("")}</ul>`;
  const trs = dipTratados(ME, g);
  if (trs.length) h += `<ul class="dip-tr">${trs.map((x) => dipLineaTratado(x, ME)).join("")}</ul>`;
  if (st === "guerra") {
    const w = S.gu[dipK(ME, g)];
    h += `<p class="dip-cb">En guerra desde ${w ? w.y : G.year} · marcador ${dipSg(dipMarcador(ME, g))}</p>`;
  } else {
    const cb = dipCB(ME, g);
    h += `<p class="dip-cb">${cb.length ? "Casus belli: " + cb.slice(0, 2).join("; ") : "Sin casus belli: atacar costará 10 de reputación"}</p>`;
    if ((S.emb[ME + ">" + g] || 0) >= G.year) {
      const d = dipDeseoGuerra(g, ME);
      h += `<p class="dip-cb">Tu embajador: ${d > 0.5 ? "preparan la guerra contra ti" : d > 0.2 ? "recelan de ti" : "no planean atacarte"}.</p>`;
    }
  }
  const pb = (tipo, txt, ext = {}) => {
    const no = dipPuede(ME, g, tipo);
    if (no) return "";
    const pc = hum ? "" : " " + dipPct(dipAceptacion(ME, g, tipo, ext).p);
    return `<button data-act="dipp-${g}:${tipo}" ${dis || used ? "disabled" : ""}>${txt}${pc}</button>`;
  };
  const ratio = (totPow(ME) + 5) / (totPow(g) + 5),
    rec = (S.uso[ME]?.rec || 0) >= G.year;
  let b = "";
  if (st === "guerra") b += pb("paz", "Paz");
  else {
    b += pb("alianza", "Alianza") + pb("nag", "Pacto") + pb("comercio", "Comercio") + pb("paso", "Paso");
    b += pb("rehenes", "Rehenes");
    if (ratio > 1.2) b += pb("tributo", "Tributo", {});
    if (ratio < 0.8) b += pb("vasallaje", "Protección");
    b += `<button data-act="gift-${g}" ${dis || used || F.gold < 50 ? "disabled" : ""}>Regalo 50</button>`;
    if (!dipPuede(ME, g, "embajada"))
      b += `<button data-act="dipemb-${g}" ${dis || used || F.gold < 25 ? "disabled" : ""}>Embajada 25</button>`;
    if (border(ME, g))
      b += `<button data-act="diprec-${g}" ${dis || rec || F.gold < 30 ? "disabled" : ""} title="Fabricar una reclamación">Reclamar 30</button>`;
    b += `<button data-act="war-${g}" class="red" ${dis ? "disabled" : ""}>${st === "alianza" ? "Traicionar" : "Guerra"}</button>`;
  }
  b += `<button data-act="asn-${g}" ${dis || F.asn || F.gold < 60 ? "disabled" : ""}>Asesino 60</button>`;
  return h + `<div class="btns dip-b">${b}</div></details>`;
}
let dipAbiertos = {};
document.addEventListener(
  "toggle",
  (e) => {
    const d = e.target;
    if (d && d.dataset && d.dataset.dipg != null) dipAbiertos[d.dataset.dipg] = d.open;
  },
  true,
);
function dipPanel(dis) {
  const S = dipS(),
    F = G.F[ME],
    r = ruler(ME),
    can = typeof socCargo === "function" ? socCargo(ME, "can") : null,
    sn = dipSenor(ME);
  let h = `<h2>Diplomacia</h2><p class="dim">Reputación <b>${S.rep[ME]}</b> (${dipRepTxt(S.rep[ME])}) · diplomacia ${r.di} · astucia ${r.in}${can ? ` · canciller ${can.n} (${can.di})` : ""}${sn != null ? ` · tributario de ${CIV[sn].s}` : ""}</p>`;
  for (let g = 0; g < NF; g++) if (g !== ME && alive(g)) h += dipFila(g, dis);
  h += OC.renderSecciones("dip", { F, r }, dis);
  return (
    h +
    '<p class="note">Toca un reino para ver motivos y tratados. Una gestión por reino y año; el % es la probabilidad de que acepten.</p>'
  );
}

/* ---------- modales: propuesta, guerra, boda, asesinato ---------- */
function dipModalPropuesta(g, tipo) {
  const F = G.F[ME],
    hum = human(g),
    ops = [];
  if (tipo === "paz") {
    ops.push(["Paz blanca", {}]);
    const pe = dipProvExigible(ME, g),
      pc = dipProvCedible(ME, g);
    ops.push([`Exigir 50 oro`, { exOro: 50 }]);
    if (pe) ops.push([`Exigir ${pe.name}`, { exProv: pe.id }]);
    if (dipSenor(g) == null) ops.push(["Exigir tributo anual", { exVas: 1 }]);
    if (F.gold >= 50) ops.push(["Ofrecer 50 oro", { ofOro: 50 }]);
    if (pc) ops.push([`Ceder ${pc.name}`, { cdProv: pc.id }]);
  } else if (tipo === "alianza") {
    ops.push(["Alianza defensiva", { sub: "defensiva" }], ["Alianza ofensiva", { sub: "ofensiva" }]);
    if (F.gold >= 40) ops.push(["Defensiva y 40 oro", { sub: "defensiva", ofOro: 40 }]);
  } else {
    ops.push(["Proponer", {}]);
    if (F.gold >= 40 && tipo !== "tributo") ops.push(["Proponer con 40 oro", { ofOro: 40 }]);
  }
  const ac = ops.map(([, e]) => dipAceptacion(ME, g, tipo, e)),
    mot = ac[0].mot.slice(0, 5);
  const desc =
    tipo === "tributo"
      ? `Exiges ${dipTributo(g)} oro al año durante 10 años. Si se niegan, tendrás casus belli.`
      : tipo === "paz"
        ? `Tras la paz rige una tregua de ${DIP_DUR.tregua} años. Marcador de la guerra: ${dipSg(dipMarcador(ME, g))}.`
        : DIP_DESC[tipo] || "";
  const btns = ops.map(([, e]) => ({ inl: 1, fn: () => dipJugadorPropone(g, tipo, e) }));
  btns.push({ t: "Cancelar" });
  modal(
    `${DIP_N[tipo]} · ${CIV[g].s}`,
    `<p class="dim">${desc}</p>${hum ? '<p class="dim">Lo decidirá el otro jugador en su turno.</p>' : `<ul class="dip-mot">${mot.map(([t, v]) => `<li><b class="${v < 0 ? "neg" : "pos"}">${dipSg(v * 100)}%</b> ${t}</li>`).join("")}</ul>`}${ops.map(([t], i) => `<div class="row dip-op-row"><span>${t}</span><button data-mi="${i}" class="gold">${hum ? "Enviar" : dipPct(ac[i].p)}</button></div>`).join("")}`,
    btns,
  );
}
function dipContraoferta(f, g, tipo, ext) {
  const F = G.F[f],
    base = dipSinExig(ext),
    c = [];
  if (Object.keys(base).length !== Object.keys(ext).length) c.push(base);
  for (const n of [30, 60, 100]) if (F.gold >= n && !(ext.ofOro >= n)) c.push({ ...base, ofOro: n });
  if (tipo === "paz") {
    const pv = dipProvCedible(f, g);
    if (pv) c.push({ cdProv: pv.id });
    if (dipSenor(f) == null) c.push({ ofVas: 1 });
  }
  return c.find((e) => dipAceptacion(f, g, tipo, e).p >= 0.65) || null;
}
function dipJugadorPropone(g, tipo, ext) {
  const F = G.F[ME];
  if (F.dip[g] || (ext.ofOro && F.gold < ext.ofOro)) return;
  F.dip[g] = 1;
  if (human(g)) {
    dipBuzon(g, { k: "prop", from: ME, tipo, ext });
    addLog(`Propuesta enviada a ${CIV[g].s}.`);
    return;
  }
  if (R() < dipAceptacion(ME, g, tipo, ext).p) {
    dipEjecutar(ME, g, tipo, ext);
    return;
  }
  dipRechazo(ME, g, tipo);
  if (tipo !== "tributo") addLog(`${CIV[g].s} rechaza tu propuesta: ${DIP_N[tipo].toLowerCase()}.`, "bad");
  const co =
    tipo !== "tributo" && R() < 0.3 + dipPers(g).neg * 0.6 ? dipContraoferta(ME, g, tipo, ext) : null;
  if (co)
    modal(
      "Contraoferta",
      `<p>${ttl(ruler(g))} ${ruler(g).n} no acepta tus condiciones, pero firmaría ${tipo === "paz" ? "la paz" : DIP_N[tipo].toLowerCase()} si ${dipTxtExt(ME, g, co) || "no hay más exigencias"}.</p>`,
      [
        { t: "Aceptar la contraoferta", cls: "gold", fn: () => dipEjecutar(ME, g, tipo, co) },
        { t: "Rechazar" },
      ],
    );
}
function dipModalGuerra(g) {
  const tr = G.st[ME][g] === "alianza",
    cb = dipCB(ME, g),
    trs = dipTratados(ME, g).filter((x) => DIP_ROMPER[x.t]),
    rep = trs.reduce((s, x) => s + DIP_ROMPER[x.t], 0) + (cb.length ? 0 : 10),
    S = dipS();
  const suyos = [
      ...dipAliados(g).filter((z) => z !== ME),
      ...S.tr
        .filter((x) => x.t === "vasallaje" && (x.a === g || x.b === g))
        .map((x) => (x.a === g ? x.b : x.a)),
    ].filter((z, i, a) => z !== ME && alive(z) && a.indexOf(z) === i),
    mios = [
      ...dipAliados(ME).filter((z) => dipTr(ME, z, "alianza")?.sub === "ofensiva"),
      ...dipVasallos(ME),
    ].filter((z, i, a) => z !== g && alive(z) && a.indexOf(z) === i);
  modal(
    tr ? "¿Traicionar la alianza?" : "¿Declarar la guerra?",
    `<p>${cb.length ? "Casus belli: " + cb.join("; ") + "." : "No tienes casus belli: los demás reinos lo verán como una agresión."}</p>${trs.length ? `<p>Romperás: ${trs.map((x) => DIP_ART[x.t]).join(", ")}.</p>` : ""}<p class="dim">Reputación: −${rep}.${suyos.length ? " Pueden acudir en su ayuda: " + suyos.map((z) => CIV[z].s).join(", ") + "." : ""}${mios.length ? " Llamarás a: " + mios.map((z) => CIV[z].s).join(", ") + "." : ""}</p>`,
    [
      { t: tr ? "Traicionar" : "Declarar la guerra", cls: "red", fn: () => declareWar(ME, g) },
      { t: "Cancelar" },
    ],
  );
}
function marryModal(c) {
  const opts = [];
  for (let g = 0; g < NF; g++) {
    if (g === ME || !alive(g) || G.st[ME][g] === "guerra") continue;
    for (const b of bachelors(g).filter((b) => b.sex !== c.sex)) opts.push(b);
  }
  const chance = (b) => dipAceptacion(ME, b.f, "boda", { c }).p;
  const btns = opts.map((b) => ({
    inl: 1,
    fn: () => {
      G.F[ME].dip[b.f] = 1;
      if (human(b.f)) {
        pushInbox(b.f, { k: "marry", from: ME, a: c.id, b: b.id });
        addLog(`Propuesta de boda enviada a ${CIV[b.f].s}.`);
      } else if (R() < chance(b)) marryAcross(c, b);
      else {
        addLog(`${CIV[b.f].s} rechaza la boda de ${c.n} con ${b.n}.`, "bad");
        relAdd(ME, b.f, -3);
      }
    },
  }));
  btns.push(
    {
      t: "Nobleza local",
      fn: () => {
        marry(c, mkChar(ME, c.sex === "m" ? "f" : "m", clamp(c.age + ri(-4, 2), 16, 45)));
        addLog(`${c.n} se casa con una familia noble del reino.`);
      },
    },
    { t: "Cancelar" },
  );
  const list = opts.length
    ? opts
        .map(
          (b, i) =>
            `<div class="row"><div class="hd"><b style="color:${CIV[b.f].c}">${b.n}</b><span class="stats">${CIV[b.f].s} · ${b.age} años</span></div>${cline(b)}<div class="btns"><button data-mi="${i}" ${G.F[ME].dip[b.f] ? "disabled" : ""}>Proponer · ${human(b.f) ? "—" : dipPct(chance(b))}</button></div></div>`,
        )
        .join("")
    : '<p class="dim">No hay candidatos libres en los reinos con los que estás en paz.</p>';
  modal(
    `Boda para ${c.n}`,
    `<p class="dim">Una boda con otro pueblo deja un buen recuerdo (+20 de opinión) y, si estáis en paz con buena relación, sella una alianza. El cónyuge se une a tu corte.</p><div style="max-height:52vh;overflow:auto">${list}</div>`,
    btns,
  );
}
function asnModal(g) {
  const F = G.F[g],
    ts = [G.C[F.ruler], G.C[F.heir], ...family(g).filter((c) => genOf(c))].filter(
      (c, i, a) => c && c.alive && a.indexOf(c) === i,
    );
  const btns = ts.map((t) => ({
    inl: 1,
    fn: () => {
      G.F[ME].gold -= 60;
      tryAssassin(ME, t);
      checkEnd();
    },
  }));
  btns.push({ t: "Cancelar" });
  modal(
    `Asesinato en ${CIV[g].s}`,
    `<p class="dim">Cuesta 60 oro. Si se descubre: −40 de opinión, −10 de reputación, casus belli para ellos y quizá la guerra.</p>${ts.map((t, i) => `<div class="row"><div class="hd"><b>${t.n}</b><span class="tag">${t.id === F.ruler ? ttl(t) : t.id === F.heir ? "Heredero" : "General"}</span></div>${cline(t)}<div class="btns"><button data-mi="${i}" class="red">Enviar al asesino · ${dipPct(dipProbAsesinato(ME, t))}</button></div></div>`).join("")}`,
    btns,
  );
}

/* ---------- acciones diplomáticas ---------- */
OC.accion("asn", (v) => {
  asnModal(+v);
});
OC.accion("gift", (v) => {
  const F = G.F[ME],
    g = +v;
  if (F.gold < 50 || F.dip[g]) return;
  F.gold -= 50;
  F.dip[g] = 1;
  dipMem(ME, g, "regalo", "Regalos", 10 + ruler(ME).di, 2, 35);
  addLog(`Envías regalos a ${CIV[g].s}.`);
});
OC.accion("war", (v) => {
  dipModalGuerra(+v);
});
OC.accion("dipp", (v) => {
  const [g, tipo] = v.split(":");
  dipModalPropuesta(+g, tipo);
});
OC.accion("peace", (v) => dipModalPropuesta(+v, "paz"));
OC.accion("ally", (v) => dipModalPropuesta(+v, "alianza"));
OC.accion("dipemb", (v) => {
  const F = G.F[ME],
    g = +v;
  if (F.gold < 25 || F.dip[g] || dipPuede(ME, g, "embajada")) return;
  F.gold -= 25;
  F.dip[g] = 1;
  dipEmbajada(ME, g);
});
OC.accion("diprec", (v) => {
  const F = G.F[ME];
  if (F.gold < 30 || (dipS().uso[ME]?.rec || 0) >= G.year) return;
  F.gold -= 30;
  dipFabricar(ME, +v);
});
OC.accion("dipcan", (v) => {
  const x = dipS().tr.find((x) => x.id === +v);
  if (!x || (x.a !== ME && x.b !== ME)) return;
  const g = x.a === ME ? x.b : x.a,
    cost =
      x.t === "alianza"
        ? "Perderás 5 de reputación y su aprecio."
        : x.t === "vasallaje" && x.b === ME
          ? x.fallo
            ? "Tu señor no te defendió: puedes irte sin deshonra."
            : "Perderás 10 de reputación y tendrán casus belli contra ti."
          : "Su opinión de ti empeorará un poco.";
  modal(`¿Romper ${DIP_ART[x.t] || x.t}?`, `<p>Con ${CIV[g].n}. ${cost}</p>`, [
    { t: "Romper", cls: "red", fn: () => dipCancelar(ME, x) },
    { t: "Cancelar" },
  ]);
});
