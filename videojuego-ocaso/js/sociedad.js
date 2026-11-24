/* ---------- sociedad: estamentos, consejo, lealtades y religión ----------
   Estado en G.dip.soc[f] (ver docs/diplomacia.md). Los efectos se aplican con OC.mod a
   'rendimiento', 'ordenObjetivo', 'bonoBatalla' y 'puntosInvestigacion'. */
/* estamentos de cada pueblo por CIV[f].id: clave -> nombre ("" en cle: según su fe).
   Claves: nob élite de la tierra, ari aristocracia guerrera, ej ejército, cle clero,
   pro mercaderes/letrados/provinciales, pue pueblo llano. */
const SOC_ROM = { nob: "Senado", cle: "", ej: "Ejército", pue: "Plebe y colonos" },
  SOC_GER = { ari: "Aristocracia guerrera", cle: "", pro: "Provinciales romanos", pue: "Hombres libres" };
const SOC_PUEBLO = {
  occ: SOC_ROM,
  ori: SOC_ROM,
  vis: SOC_GER,
  van: SOC_GER,
  fra: SOC_GER,
  hun: { ari: "Lógades", cle: "", ej: "Jinetes de los clanes", pue: "Pueblos sometidos" },
  per: { nob: "Grandes casas", cle: "", ej: "Savaran", pue: "Campesinos" },
  ara: { nob: "Jeques de las tribus", cle: "", pro: "Mercaderes de caravana", pue: "Beduinos y oasis" },
  nor: { ari: "Jarls", cle: "", ej: "Huscarles", pue: "Karls y thralls" },
  chi: { nob: "Mandarines", cle: "", ej: "Ejército imperial", pue: "Campesinos" },
  inc: { nob: "Curacas", cle: "", ej: "Orejones", pue: "Ayllus" },
  may: { nob: "Linajes nobles", cle: "", pro: "Mercaderes", pue: "Campesinos de la milpa" },
  azt: { nob: "Pipiltin", cle: "", ej: "Órdenes guerreras", pue: "Macehualtin" },
  gri: { nob: "Eupátridas", cle: "", pro: "Comerciantes del ágora", pue: "Demos" },
  egi: { nob: "Nomarcas", cle: "", pro: "Escribas", pue: "Campesinos del Nilo" },
  ind: { ari: "Kshatriyas", cle: "", pro: "Vaishyas", pue: "Shudras" },
  cel: { ari: "Nobles guerreros", cle: "", pro: "Artesanos y bardos", pue: "Clanes libres" },
  esl: { ari: "Boyardos", cle: "", ej: "Druzhina", pue: "Comunidades del mir" },
  mon: { ari: "Noyanes", cle: "", ej: "Tumenes", pue: "Arats" },
};
const socEstDe = (f) => SOC_PUEBLO[CIV[f] && CIV[f].id] || SOC_PUEBLO[CIV[civBase(f)].id] || SOC_GER;
/* pueblos donde una mujer al frente de la hueste despierta recelo */
const SOC_GUERRERO = ["vis", "van", "fra", "hun", "nor", "cel", "esl", "mon", "azt"];
const SOC_CLE = {
  niceno: "Iglesia",
  arriano: "Clero arriano",
  pagano: "Sacerdotes",
  zoroastra: "Magos",
  arabe: "Kahines",
  nordico: "Godar",
  confuciano: "Letrados del rito",
  andino: "Sacerdotes del Sol",
  mesoamericano: "Sacerdotes",
  olimpico: "Sacerdotes y oráculos",
  egipcio: "Sacerdotes de Amón",
  hindu: "Brahmanes",
  druidico: "Druidas",
  eslavo: "Volkhvy",
  tengri: "Chamanes",
};
const SOC_FEN = {
  niceno: "nicena",
  arriano: "arriana",
  pagano: "pagana",
  zoroastra: "zoroástrica",
  arabe: "de los dioses de Arabia",
  nordico: "nórdica",
  confuciano: "confuciana",
  andino: "andina",
  mesoamericano: "mesoamericana",
  olimpico: "olímpica",
  egipcio: "egipcia",
  hindu: "hindú",
  druidico: "druídica",
  eslavo: "eslava",
  tengri: "de Tengri",
};
/* cabeza del clero en el consejo, según la fe */
const SOC_OBI = {
  pagano: "Gran sacerdote",
  zoroastra: "Mobad",
  arabe: "Kahin mayor",
  nordico: "Godi mayor",
  confuciano: "Ministro de Ritos",
  andino: "Willaq Umu",
  mesoamericano: "Sumo sacerdote",
  olimpico: "Hierofante",
  egipcio: "Sumo sacerdote",
  hindu: "Purohita",
  druidico: "Archidruida",
  eslavo: "Volkhv mayor",
  tengri: "Gran chamán",
};
const SOC_MAG = {
  occ: "Magister militum",
  ori: "Magister militum",
  per: "Spahbed",
  chi: "Gran mariscal",
  azt: "Tlacateccatl",
  gri: "Estratego",
  inc: "Apusquipay",
};
/* fes que pueden abrazar el credo niceno o arriano */
const SOC_CONV = ["pagano", "nordico", "eslavo", "druidico", "tengri", "arriano"];
const SOC_INF = { nob: 30, ari: 34, cle: 20, ej: 26, pue: 24, pro: 22 };
const SOC_DON = {
  nob: ["Honores", { oro: 40 }],
  ari: ["Tierras", { oro: 40 }],
  cle: ["Donación", { oro: 35 }],
  ej: ["Donativo", { oro: 40 }],
  pue: ["Grano", { comida: 25 }],
  pro: ["Privilegios", { oro: 30 }],
};
/* categoría de un acto -> estamento que lo siente si el pueblo no tiene esa clave */
const SOC_RESP = {
  nob: ["ari", "pro"],
  ari: ["ej", "nob"],
  ej: ["ari", "nob"],
  pro: ["nob", "pue"],
  pue: ["pro"],
  cle: [],
};
const SOC_CARGOS = { can: "di", mag: "ma", tes: "ge", obi: "di", esp: "in" };
const SOC_RASGO = {
  Cruel: { nob: -8, ari: -2, pue: -6, ej: 2, pro: -6 },
  Justo: { nob: 4, pue: 8, pro: 5 },
  Piadoso: { cle: 10, pue: 3 },
  Valiente: { ej: 8, ari: 8 },
  Belicoso: { ej: 5, ari: 8, pue: -4 },
  Prudente: { nob: 4, pro: 4, ari: -3 },
  Elocuente: { nob: 5, pro: 5 },
  Erudito: { cle: 4, pro: 5 },
  Codicioso: { nob: -4, pue: -4, pro: -3 },
  Paranoico: { nob: -6, ari: -4 },
  Enfermizo: { ej: -3, ari: -4 },
  Ambicioso: { ari: 3, nob: -2 },
  Astuto: { nob: 2 },
};
const SOC_CARGO_DESC = {
  can: "más aceptación en cada propuesta diplomática",
  mag: "más fuerza en batalla y un ejército más leal",
  tes: "más oro de cada provincia (si es codicioso, desfalca)",
  obi: "más orden y saber; contenta al clero",
  esp: "asesinatos y reclamaciones; protege de conjuras",
};
const SOC_POL = { tol: "Tolerancia", neu: "Neutralidad", celo: "Celo" };
const SOC_DEM = {
  oro: { t: "un donativo de 50 oro", inm: { oro: 50 } },
  grano: { t: "el reparto de 30 de comida", inm: { comida: 30 } },
  imp: { t: "bajar los impuestos en todo el reino", ok: (f) => socTasa(f) <= 0.75 },
  templo: { t: "levantar un templo nuevo", ok: (f, d) => socTemplos(f) > d.b },
  celo: { t: "mano dura con los de otra fe", ok: (f) => socF(f).pol === "celo" },
  guerra: { t: "una guerra que traiga botín", ok: (f) => dipGuerras(f).length > 0 },
  paz: { t: "la paz con todos los reinos", ok: (f) => !dipGuerras(f).length },
  cargo: { t: "un puesto en el consejo para uno de los suyos", ok: (f) => socCortesanos(f) > 0 },
  mag: { t: "un jefe militar en el consejo", ok: (f) => !!socCargo(f, "mag") },
};
const SOC_DEM_EST = {
  nob: ["imp", "oro", "cargo"],
  ari: ["guerra", "oro", "mag"],
  cle: ["templo", "celo", "oro"],
  ej: ["oro", "guerra", "mag"],
  pue: ["imp", "grano", "paz"],
  pro: ["imp", "oro", "cargo"],
};
const SOC_FE0 = CIV.map((c) => c.rel);

/* ---------- estado ---------- */
function socInit(f) {
  const e = {};
  for (const k in socEstDe(f)) e[k] = { l: 55 + ri(-6, 8), i: SOC_INF[k] };
  socNorm(e);
  return { e, dem: [], car: {}, pol: "neu", uso: {}, paz: 0 };
}
function socF(f) {
  if (!G || f == null || f < 0 || f >= NF || !G.F || !G.F[f]) return null;
  const S = dipS();
  return S.soc[f] || (S.soc[f] = socInit(f));
}
function socNorm(e) {
  const t = Object.values(e).reduce((s, x) => s + x.i, 0) || 1;
  for (const k in e) e[k].i = Math.max(8, Math.round((e[k].i * 100) / t));
}
const socNombre = (f, k) => (k === "cle" ? SOC_CLE[CIV[f].rel] || "Clero" : socEstDe(f)[k] || k);
const socClave = (f, k) => {
  const s = socF(f);
  return s && s.e[k] ? k : s ? (SOC_RESP[k] || []).find((j) => s.e[j]) : k;
};
function socLealtad(f, k) {
  const s = socF(f),
    e = s && s.e[socClave(f, k)];
  return e ? e.l : 50;
}
function socEstabilidad(f) {
  const s = socF(f);
  if (!s) return 50;
  let a = 0,
    b = 0;
  for (const k in s.e) {
    a += s.e[k].l * s.e[k].i;
    b += s.e[k].i;
  }
  return b ? a / b : 50;
}
/* -1..1 aprox.: cuánto empuja un estamento (lealtad por influencia) */
function socFac(f, k) {
  const s = socF(f),
    e = s && s.e[k];
  return e ? clamp(((e.l - 50) / 50) * (e.i / 25), -1.4, 1.4) : 0;
}
/* impulso inmediato a la lealtad: o = {categoría o estamento: valor} */
function socImp(f, o) {
  const s = socF(f);
  if (!s || !alive(f)) return;
  const r = {};
  for (const c in o) {
    const k = socClave(f, c);
    if (!s.e[k]) continue;
    if (r[k] == null || Math.abs(o[c]) > Math.abs(r[k])) r[k] = o[c];
  }
  for (const k in r) s.e[k].l = clamp(Math.round(s.e[k].l + r[k]), 0, 100);
}
const socOwn = (f) => owned(f);
const socTasa = (f) => {
  const o = socOwn(f);
  return o.length ? o.reduce((a, p) => a + p.tax, 0) / o.length : 1;
};
const socTemplos = (f) => socOwn(f).reduce((a, p) => a + (p.temple || 0), 0);
const socCap = (f) => {
  const c = G.P[G.F[f].capId];
  return c && c.owner === f ? c : owned(f)[0];
};

/* ---------- consejo ---------- */
function socNomCargo(f, k) {
  if (k === "mag") return SOC_MAG[CIV[f].id] || "Jefe de la hueste";
  if (k === "obi") return SOC_OBI[CIV[f].rel] || "Obispo";
  return { can: "Canciller", tes: "Tesorero", esp: "Maestro de espías" }[k];
}
function socCargo(f, k) {
  const s = socF(f);
  if (!s) return null;
  const id = s.car[k],
    c = id != null ? G.C[id] : null;
  if (c && c.alive && c.f === f && c.id !== G.F[f].ruler && c.dipReh == null) return c;
  if (id != null) delete s.car[k];
  return null;
}
function socCargoNombre(c) {
  const s = c && c.f < NF ? socF(c.f) : null;
  if (!s) return "";
  for (const k in s.car) if (s.car[k] === c.id && socCargo(c.f, k)) return socNomCargo(c.f, k);
  return "";
}
const socCortesanos = (f) => Object.keys(SOC_CARGOS).filter((k) => socCargo(f, k)?.dipCort).length;
const socCandidatos = (f) =>
  family(f).filter((c) => c.age >= 16 && c.id !== G.F[f].ruler && c.dipReh == null);
function socNombrar(f, k, c) {
  const s = socF(f);
  for (const j in s.car) if (s.car[j] === c.id) delete s.car[j];
  s.car[k] = c.id;
  c.lea = clamp((c.lea ?? 50) + 5, 0, 100);
}
function socNoble(f, k) {
  const st = SOC_CARGOS[k],
    c = mkChar(f, R() < 0.8 ? "m" : "f", ri(28, 55));
  c.dipCort = 1;
  c[st] = clamp(c[st] + ri(1, 3), 1, 10);
  socNombrar(f, k, c);
  socImp(f, { nob: 3 });
  return c;
}
function socEfCargo(f, k, c) {
  if (!c)
    return {
      can: "sin efecto",
      mag: "sin efecto",
      tes: "sin efecto",
      obi: "−4 lealtad del clero",
      esp: "sin efecto",
    }[k];
  const s = (v, u = "") => dipSg(v) + u;
  return {
    can: s((c.di - 4) * 1.5, "% aceptación"),
    mag: s((c.ma - 4) * 1.5, "% en batalla"),
    tes: s((c.ge - 4) * 2, "% oro"),
    obi: s((c.di - 4) * 0.8, " orden") + " · " + s((c.in - 3) * 3, "% saber"),
    esp: s((c.in - 4) * 3, "% intriga"),
  }[k];
}

/* ---------- religión ---------- */
function socFe(p) {
  if (!p.dipFe) {
    if (p.home < NF) p.dipFe = SOC_FE0[p.home];
    else {
      let best = null,
        bd = 1e9;
      for (let f = 0; f < NF; f++) {
        const c = G.F[f] && !G.F[f].ausente && G.P[G.F[f].capId];
        if (!c) continue;
        const d = Math.hypot(c.x - p.x, c.y - p.y);
        if (d < bd) {
          bd = d;
          best = f;
        }
      }
      p.dipFe = best != null ? SOC_FE0[best] : "niceno";
    }
  }
  return p.dipFe;
}
function socTension(f) {
  const o = socOwn(f);
  return o.length ? o.filter((p) => socFe(p) !== CIV[f].rel).length / o.length : 0;
}
function socPolitica(f, pol) {
  const s = socF(f);
  if (s.pol === pol) return;
  s.pol = pol;
  s.uso.pol = G.year;
  if (pol === "celo") socImp(f, { cle: 6, pro: -6, pue: -2 });
  if (pol === "tol") socImp(f, { cle: -5, pro: 4, pue: 2 });
  if (isMe(f)) addLog(`Política religiosa: ${SOC_POL[pol].toLowerCase()}.`);
}
/* recuerdos de fe con los demás pueblos (afinidades y rechazos: dipFeAfin en diplomacia.js) */
const socFeMem = (f) => dipFeMem(f);
/* la fe ajena más extendida en las tierras de f → [fe, proporción] */
function socFeMayor(f) {
  const o = socOwn(f),
    n = {};
  for (const p of o) {
    const x = socFe(p);
    if (x !== CIV[f].rel) n[x] = (n[x] || 0) + 1;
  }
  const fe = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
  return fe ? [fe, n[fe] / Math.max(1, o.length)] : [null, 0];
}
/* fes que f puede abrazar: niceno/arriano desde SOC_CONV; en leyendas, además la fe ajena
   que ya profesa al menos el 40 % de sus tierras */
function socConversiones(f) {
  const r = CIV[f].rel,
    l = SOC_CONV.includes(r) ? ["niceno", "arriano"].filter((x) => x !== r) : [];
  if (dipLey()) {
    const [fe, sh] = socFeMayor(f);
    if (fe && sh >= 0.4 && SOC_FEN[fe] && !l.includes(fe)) l.push(fe);
  }
  return l;
}
function socConvertir(f, fe) {
  const s = socF(f);
  s.fe = fe;
  CIV[f].rel = fe;
  s.uso.conv = G.year;
  s.e.cle.l = 45;
  s.e.cle.i += 4;
  socNorm(s.e);
  socImp(f, { nob: -8 });
  socFeMem(f);
  addLog(
    `${ttl(ruler(f))} ${ruler(f).n} de ${CIV[f].s} abraza la fe ${SOC_FEN[fe]}. Los viejos sacerdotes murmuran.`,
    isMe(f) ? "good" : "",
  );
}
/* la fe del reino (si se convirtió) vive en G.dip.soc[f].fe y se reaplica al cargar */
OC.on("partidaLista", () => {
  for (let f = 0; f < NF; f++) CIV[f].rel = G.dip?.soc?.[f]?.fe || SOC_FE0[f];
  /* afinidades de fe (en leyendas, entre todas las religiones); idempotente */
  if (G.dip) for (const f of dipActivas()) dipFeMem(f);
});

/* ---------- objetivo de lealtad de cada estamento (con motivos visibles) ---------- */
function socObjetivo(f, k) {
  const s = socF(f),
    r = ruler(f),
    F = G.F[f],
    mot = [],
    add = (t, v) => {
      v = Math.round(v);
      if (v) mot.push([t, v]);
    };
  const own = socOwn(f),
    n = Math.max(1, own.length),
    tax = socTasa(f),
    gu = dipGuerras(f).length,
    ten = socTension(f),
    cort = socCortesanos(f),
    merc = own.reduce((a, p) => a + (p.market || 0), 0),
    ord = own.reduce((a, p) => a + p.order, 0) / n,
    tx = tax > 1.3 ? "Impuestos altos" : tax < 0.7 ? "Impuestos bajos" : "Impuestos";
  switch (k) {
    case "nob":
      add(tx, (1 - tax) * 8);
      add("Consejeros de su linaje", cort * 4);
      add("Mercados", Math.min(6, merc));
      break;
    case "ari":
      add(gu ? "Guerra y botín" : "Largos años de paz", gu ? 7 : s.paz > 4 ? -6 : 0);
      add(tx, (1 - tax) * 4);
      add("Consejeros de su linaje", cort * 3);
      break;
    case "cle":
      add("Fieles de otra fe", -ten * 25);
      add("Templos", Math.min(12, socTemplos(f) * 2));
      add(SOC_POL[s.pol], { celo: 10, neu: 0, tol: -5 }[s.pol]);
      break;
    case "ej":
      add(gu ? "En campaña" : "Cuarteles ociosos", gu ? 4 : -2);
      if (F.food <= 0) add("Hambre", -10);
      break;
    case "pue":
      add(tx, (1 - tax) * 14);
      add("Guerras", -Math.min(12, gu * 5));
      if (F.food <= 0) add("Hambre", -12);
      add("Orden en las provincias", (ord - 55) / 4);
      break;
    case "pro":
      add(tx, (1 - tax) * 8);
      add("Mercados", Math.min(8, merc));
      add("Consejeros de su linaje", cort * 3);
      if (ten > 0.2)
        add(
          s.pol === "celo" ? "Persecución" : s.pol === "tol" ? "Tolerancia" : "Fe distinta",
          { celo: -12, tol: 6, neu: -3 }[s.pol],
        );
      break;
  }
  const mag = socCargo(f, "mag"),
    obi = socCargo(f, "obi");
  if (mag && (k === "ej" || (k === "ari" && !s.e.ej)))
    add(socNomCargo(f, "mag") + " " + mag.n, (mag.ma - 4) * 1.5);
  if (k === "cle")
    add(
      obi ? socNomCargo(f, "obi") + " " + obi.n : "Sin " + socNomCargo(f, "obi").toLowerCase(),
      obi ? 4 + (obi.di - 5) : -4,
    );
  const rt = SOC_RASGO[r.tr]?.[k];
  if (rt) add(`${ttl(r)} ${r.tr.toLowerCase()}`, rt);
  if (r.age < 16 && (k === "nob" || k === "ari")) add("Regencia", -8);
  const lg = socLegit(f, G.C[F.heir]);
  if (lg.d[k]) add("Sucesión", lg.d[k]);
  return {
    v: clamp(55 + mot.reduce((a, m) => a + m[1], 0), 5, 95),
    mot: mot.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])),
  };
}

/* ---------- sucesión: legitimidad del heredero ---------- */
function socLegit(f, c) {
  const o = { d: {}, t: [] },
    nob = socClave(f, "nob"),
    put = (k, v, t) => {
      o.d[k] = (o.d[k] || 0) + v;
      o.t.push(`${t} (${socNombre(f, k)} ${dipSg(v)})`);
    };
  if (!G.F[f] || !socF(f)) return o;
  if (!c || !c.alive) {
    put(nob, -6, "Sucesión incierta");
    return o;
  }
  const r = ruler(f),
    hijo = c.fa === r.id || c.mo === r.id,
    esp = heirCands(f)[0];
  if (!hijo) put(nob, -10, "No es de la sangre del soberano");
  else if (esp && esp.id !== c.id && esp.sex === "m" && (esp.fa === r.id || esp.mo === r.id))
    put(nob, -5, `Posterga al primogénito ${esp.n}`);
  if (c.sex === "f" && SOC_GUERRERO.includes(CIV[f].id)) put(nob, -6, "Una mujer al frente de la hueste");
  if (c.age >= 12 && c.ma + c.in + c.di + c.ge < 14) put(socClave(f, "ej"), -4, "Heredero sin dotes");
  if (c.tr === "Cruel") put("pue", -4, "Heredero cruel");
  return o;
}
function socNuevoHeredero(f, c, prev) {
  const lg = socLegit(f, c),
    r = ruler(f),
    esp = heirCands(f)[0];
  const imp = {};
  for (const k in lg.d) imp[k] = Math.round(lg.d[k] * 0.6);
  socImp(f, imp);
  if (esp && esp.id !== c.id && (esp.fa === r.id || esp.mo === r.id)) {
    esp.dipAg = (esp.dipAg || 0) - 30;
    esp.amb = Math.min(10, (esp.amb ?? 5) + 1);
    if (isMe(f)) addLog(`${esp.n} no olvidará que lo apartaron de la sucesión.`, "bad");
  }
}

/* ---------- personajes: lealtad, ambición y traiciones ---------- */
function socLeaObj(f, c) {
  const r = ruler(f);
  let v = 50;
  if (c.fa === r.id || c.mo === r.id) v += 15;
  if (c.id === r.sp) v += 15;
  if (socCargoNombre(c)) v += 10;
  if (genOf(c)) v += 5;
  if (socGobDe(c)) v += socInfluencia(c) >= 60 ? 2 : 8;
  if (c.linaje === false && c.rol === "general") v += 5;
  v += { Leal: 25, Ambicioso: -10, Codicioso: -5 }[c.tr] || 0;
  v += { Cruel: -8, Justo: 6, Elocuente: 4, Paranoico: -6 }[r.tr] || 0;
  return clamp(v + (c.dipAg || 0) - Math.max(0, (c.amb ?? 5) - 6) * 3, 0, 100);
}
function socSacar(c) {
  G.P.forEach((p) => {
    if (p.gen === c.id) p.gen = null;
  });
}
function socTraicion(f, c) {
  const p = genOf(c) || socGobDe(c),
    r = ruler(f),
    esp = socCargo(f, "esp"),
    cls = isMe(f) ? "bad" : "";
  dipS().hist.traiciones = (dipS().hist.traiciones || 0) + 1;
  if (p && !p.cap && R() < 0.5) {
    c.f = REB;
    OC.emitirSync("revuelta", { p, de: f }); /* OC */
    p.owner = REB;
    p.order = 50;
    p.tax = 1;
    addLog(`${c.n} se alza en ${p.name} y se proclama señor de la provincia.`, cls);
    return;
  }
  if (R() < 0.5) {
    if (R() < clamp(0.3 - (esp ? (esp.in - 4) * 0.04 : 0), 0.08, 0.4)) {
      addLog(`${c.n} encabeza una conjura y usurpa el trono de ${CIV[f].s}.`, cls);
      delete c.dipCort;
      G.F[f].heir = c.id;
      kill(r, "es asesinado por los conjurados de " + c.n);
    } else {
      addLog(`Se descubre la conjura de ${c.n} contra ${r.n}.`, isMe(f) ? "good" : "");
      kill(c, "es ejecutado por traición");
    }
    return;
  }
  const g = [...Array(NF).keys()]
    .filter((g) => g !== f && alive(g))
    .sort((a, b) => G.rel[f][a] - G.rel[f][b])[0];
  if (g == null) return;
  socSacar(c);
  c.f = g;
  if (G.F[f].heir === c.id) {
    G.F[f].heir = null;
    autoHeir(f);
  }
  relAdd(f, g, -5);
  addLog(`${c.n} huye de ${CIV[f].s} y se acoge a la corte de ${CIV[g].s}.`, cls);
}
function socPersonajes(f) {
  for (const c of family(f)) {
    if (c.id === G.F[f].ruler || c.age < 12) continue;
    dipAmbLea(c);
    c.lea = clamp(Math.round(c.lea + clamp(socLeaObj(f, c) - c.lea, -5, 5)), 0, 100);
    if (c.dipAg) c.dipAg = Math.min(0, c.dipAg + 3);
    const gp = socGobDe(c);
    if (gp) {
      /* gobernar curte: experiencia de mando y fama (influencia) */
      c.xp = (c.xp || 0) + 3;
      if (typeof cmbNivel === "function") c.nivel = cmbNivel(c).nivel;
      c.fama = Math.round(((c.fama || 0) + 0.2) * 10) / 10;
      if (!gp.cap && c.lea < 30 && (c.amb ?? 5) >= 6 && socInfluencia(c) >= 45 && R() < 0.08) {
        socAlzamiento(f, c, gp);
        break;
      }
    }
    if (c.age >= 16 && c.lea < 25 && c.amb >= 6 && c.dipReh == null && R() < 0.06) {
      socTraicion(f, c);
      break;
    }
  }
  const tes = socCargo(f, "tes");
  if (tes && (tes.tr === "Codicioso" || tes.lea < 35) && R() < 0.15) {
    const v = Math.min(ri(8, 25), Math.max(0, G.F[f].gold));
    G.F[f].gold -= v;
    if (isMe(f) && v) addLog(`Faltan ${v} de oro en el tesoro: ${tes.n} no sabe explicarlo.`, "bad");
  }
}

/* ---------- demandas de los estamentos ---------- */
function socDemandas(f, s) {
  s.dem = s.dem.filter((d) => {
    const D = SOC_DEM[d.k];
    if (!D || !s.e[d.e]) return false;
    if (!d.ac) return d.y >= G.year - 1;
    if (D.ok(f, d)) {
      socImp(f, { [d.e]: 12 });
      if (isMe(f)) addLog(`${socNombre(f, d.e)}: cumples lo prometido (${D.t}).`, "good");
      return false;
    }
    if (G.year >= d.h) {
      socImp(f, { [d.e]: -15 });
      if (isMe(f)) addLog(`${socNombre(f, d.e)}: no cumpliste tu promesa (${D.t}).`, "bad");
      return false;
    }
    return true;
  });
  if (s.dem.length >= 2 || R() > 0.3) return;
  const k = Object.keys(s.e)
    .filter((k) => s.e[k].l < 55 && !s.dem.some((d) => d.e === k))
    .sort((a, b) => s.e[a].l - s.e[b].l)[0];
  if (!k) return;
  const b = socTemplos(f),
    t = pick(SOC_DEM_EST[k].filter((t) => !(SOC_DEM[t].ok && SOC_DEM[t].ok(f, { b }))));
  if (!t) return;
  const d = { e: k, k: t, y: G.year, h: G.year + 3, b };
  dipS().hist.demandas = (dipS().hist.demandas || 0) + 1;
  if (human(f)) {
    d.nuevo = 1;
    s.dem.push(d);
    return;
  }
  const D = SOC_DEM[t];
  if (D.inm) {
    if ((s.e[k].l < 45 || R() < 0.5) && OC.pagar(f, D.inm)) socImp(f, { [k]: 10 });
    else socImp(f, { [k]: -8 });
  } else {
    d.ac = 1;
    s.dem.push(d);
  }
}
OC.on("inicioTurno", async (f) => {
  const s = socF(f);
  if (!s) return;
  for (const d of s.dem.filter((d) => d.nuevo)) {
    const D = SOC_DEM[d.k],
      nm = socNombre(f, d.e);
    delete d.nuevo;
    const quitar = () => (s.dem = s.dem.filter((x) => x !== d));
    const no = { t: "Negarse (−10 lealtad)", fn: () => (quitar(), socImp(f, { [d.e]: -10 })) };
    await modal(
      `Demanda: ${nm}`,
      `<p>${nm} exige ${D.t}.</p><p class="dim">Lealtad actual ${s.e[d.e].l}. ${D.inm ? "Concederlo la sube (+10)." : "Si lo prometes, tienes 3 años: cumplirlo da +12; fallar, −15."}</p>`,
      D.inm
        ? [
            {
              t: `Conceder (${OC.textoCoste(D.inm)})`,
              cls: "gold",
              dis: !OC.puedePagar(f, D.inm),
              fn: () => {
                quitar();
                if (OC.pagar(f, D.inm)) socImp(f, { [d.e]: 10 });
              },
            },
            no,
          ]
        : [{ t: "Prometerlo (3 años)", cls: "gold", fn: () => (d.ac = 1) }, no],
    );
  }
});

/* ---------- crisis: conjuras, motines, guerras civiles y favores ---------- */
/* primera clase de prefs que el pueblo puede tener (civPuede) y que no sea mercenaria */
function socTropa(f, prefs) {
  const ok = (t) =>
    UN[t] && !UN[t].merc && !UN[t].asedio && (typeof civPuede !== "function" || civPuede(f, t));
  return prefs.find(ok) || "i";
}
function socGuerraCivil(f, s, bajos) {
  const own = socOwn(f).filter((p) => !p.cap),
    n = Math.min(4, Math.ceil(socOwn(f).length / 3));
  if (own.length < 2) return;
  const ps = own.sort((a, b) => a.order - b.order).slice(0, n);
  for (const p of ps) OC.emitirSync("revuelta", { p, de: f }); /* OC */
  for (const p of ps)
    Object.assign(p, {
      owner: REB,
      gen: null,
      order: 50,
      tax: 1,
      u: socLevantados(f, p.u),
    });
  for (const k of bajos) s.e[k].l = 45;
  for (const k in s.e) if (!bajos.includes(k)) s.e[k].l = clamp(s.e[k].l + 5, 0, 100);
  dipS().hist.civiles = (dipS().hist.civiles || 0) + 1;
  const m = `¡Guerra civil en ${CIV[f].s}! ${bajos.map((k) => socNombre(f, k)).join(" y ")} se alzan: ${ps.map((p) => p.name).join(", ")} desconocen al soberano.`;
  addLog(m, isMe(f) ? "bad" : "");
  if (isMe(f))
    modal("Guerra civil", `<p>${m}</p><p class="dim">Recupera esas provincias por las armas.</p>`, [
      { t: "A las armas" },
    ]);
}
/* la guarnición que se alza: la que había, reforzada con levas que el pueblo pueda tener */
function socLevantados(f, u0) {
  const u = { ...u0 },
    jin = socTropa(f, ["c", "x", "i"]);
  for (const t in u) if (UN[t] && UN[t].merc) delete u[t];
  u.i = Math.max(u.i || 0, 4);
  u.a = Math.max(u.a || 0, 2);
  u[jin] = Math.max(u[jin] || 0, jin === "i" ? 5 : 1);
  return u;
}
function socComplot(f, s, k) {
  const cls = isMe(f) ? "bad" : "",
    nm = socNombre(f, k),
    esp = socCargo(f, "esp"),
    own = socOwn(f);
  dipS().hist.complots = (dipS().hist.complots || 0) + 1;
  if (k === "nob" || k === "pro") {
    const t = R() < 0.4 ? ruler(f) : G.C[G.F[f].heir] || ruler(f);
    if (R() < clamp(0.3 - (esp ? (esp.in - 4) * 0.04 : 0), 0.08, 0.45))
      kill(t, `muere a manos de los conjurados del ${nm.toLowerCase()}`);
    else {
      s.e[k].l += 8;
      s.e[k].i = Math.max(8, s.e[k].i - 5);
      socNorm(s.e);
      addLog(`Se descubre una conjura de ${nm} en ${CIV[f].s}: rueda alguna cabeza.`, isMe(f) ? "good" : "");
    }
  } else if (k === "ari" || k === "ej") {
    const c = socCap(f);
    if (c) for (const t in c.u) if (c.u[t] > 0) c.u[t] = Math.floor(c.u[t] * 0.75);
    own.forEach((p) => (p.order = clamp(p.order - 10, 0, 100)));
    addLog(`Motín de ${nm} en ${CIV[f].s}: desertan tropas de la capital.`, cls);
  } else if (k === "cle") {
    own.forEach((p) => (p.order = clamp(p.order - 8, 0, 100)));
    addLog(`${nm} lanza anatemas contra el soberano de ${CIV[f].s}.`, cls);
  } else {
    for (const p of own
      .slice()
      .sort(() => R() - 0.5)
      .slice(0, 2))
      p.order = clamp(p.order - 20, 0, 100);
    addLog(`Revueltas de ${nm.toLowerCase()} en ${CIV[f].s}.`, cls);
  }
}
function socFavor(f, k) {
  const c = socCap(f),
    nm = socNombre(f, k);
  if (!c) return;
  if (k === "nob" || k === "pro") G.F[f].gold += k === "nob" ? 30 : 25;
  else if (k === "ari") {
    const t = socTropa(f, ["c", "x", "m", "p", "i"]);
    c.u[t] = (c.u[t] || 0) + 2;
  } else if (k === "ej") c.u.i = (c.u.i || 0) + 3;
  else if (k === "cle") socOwn(f).forEach((p) => (p.order = clamp(p.order + 5, 0, 100)));
  else G.F[f].food += 25;
  if (isMe(f))
    addLog(
      `${nm} muestra su lealtad: ${{ nob: "un donativo de 30 oro", pro: "un donativo de 25 oro", ari: "jinetes para tu hueste", ej: "veteranos que se reenganchan", cle: "sermones de obediencia", pue: "25 de comida" }[k]}.`,
      "good",
    );
}
function socCrisis(f, s) {
  const bajos = Object.keys(s.e).filter((k) => s.e[k].l < 22),
    inf = bajos.reduce((a, k) => a + s.e[k].i, 0);
  if (bajos.length >= 2 && inf >= 45 && socOwn(f).length >= 3 && R() < 0.3)
    return socGuerraCivil(f, s, bajos);
  for (const k in s.e) {
    const e = s.e[k];
    if (e.l < 25 && R() < ((25 - e.l) / 100) * (e.i / 25)) return socComplot(f, s, k);
  }
  for (const k in s.e) if (s.e[k].l >= 80 && R() < 0.12) return socFavor(f, k);
}

/* ---------- mandos de carrera y gobernadores ----------
   p.gob = id del gobernador. Pueden gobernar los parientes adultos y los mandos de carrera
   (linaje:false) con nivel >= SOC_GOB_NIVEL (cmbNivel). No el soberano, ni un rehén, ni quien manda
   un ejército en campaña (G.cam.ej[].gen), ni quien ya gobierna otra ciudad. */
const SOC_GOB_NIVEL = 3;
const socNivel = (c) => (typeof cmbNivel === "function" ? cmbNivel(c).nivel : c.nivel || 1);
const socEnCampana = (c) => typeof camS === "function" && camS().ej.some((e) => e.gen === c.id);
function socGob(p) {
  if (!p || p.gob == null) return null;
  const c = G.C[p.gob],
    F = G.F[p.owner];
  if (c && c.alive && F && c.f === p.owner && c.dipReh == null && c.id !== F.ruler && !socEnCampana(c))
    return c;
  delete p.gob;
  return null;
}
const socGobDe = (c) => G.P.find((p) => p.gob === c.id && socGob(p) === c) || null;
function socPuedeGobernar(f, c, p) {
  if (!c || !c.alive || c.f !== f) return "No sirve a tu reino";
  if (c.id === G.F[f].ruler) return "Es el soberano";
  if (c.age < 16) return "Demasiado joven";
  if (c.dipReh != null) return "Es rehén";
  if (socEnCampana(c)) return "Manda un ejército en campaña";
  if (c.linaje === false && socNivel(c) < SOC_GOB_NIVEL)
    return `Necesita nivel ${SOC_GOB_NIVEL} (tiene ${socNivel(c)})`;
  const otra = G.P.find((q) => q.gob === c.id && q !== p && socGob(q));
  return otra ? "Ya gobierna " + otra.name : "";
}
/* influencia (0-100): nivel, fama, años de gobierno y sangre real */
function socInfluencia(c) {
  const gp = G.P.find((p) => p.gob === c.id);
  return clamp(
    Math.round(
      socNivel(c) * 8 +
        (c.fama || 0) * 2 +
        (gp && c.dipGobY != null ? Math.min(20, (G.year - c.dipGobY) * 2) : 0) +
        (c.linaje !== false ? 10 : 0),
    ),
    0,
    100,
  );
}
/* efecto de un gobernador sobre su ciudad */
function socGobEf(c) {
  const n = socNivel(c);
  return {
    g: clamp(0.03 * (c.ge - 4) + 0.01 * n, -0.1, 0.3),
    fo: clamp(0.02 * (c.ge - 4), -0.08, 0.15),
    ord: (c.di - 4) * 0.8 + n * 0.5 + ({ Justo: 3, Piadoso: 1, Cruel: -3 }[c.tr] || 0) - (c.lea < 30 ? 3 : 0),
    coste: -clamp(0.015 * (c.ma - 4) + 0.005 * n, -0.05, 0.15),
    def: clamp(0.01 * (n + c.ma - 4), 0, 0.15),
  };
}
function socGobTxt(c) {
  const e = socGobEf(c),
    pc = (v) => dipSg(v * 100) + "%";
  return `${pc(e.g)} oro · ${dipSg(e.ord)} orden · ${pc(e.coste)} levas · ${pc(e.def)} defensa`;
}
function socNombrarGob(p, c) {
  for (const q of G.P) if (q.gob === c.id) delete q.gob;
  const prev = socGob(p);
  if (prev && prev !== c) prev.dipAg = (prev.dipAg || 0) - 10;
  p.gob = c.id;
  c.dipGobY = G.year;
  c.lea = clamp((c.lea ?? 50) + 5, 0, 100);
  if (isMe(p.owner)) addLog(`${c.n} gobernará ${p.name}.`);
}
function socAlzamiento(f, c, p) {
  dipS().hist.traiciones = (dipS().hist.traiciones || 0) + 1;
  OC.emitirSync("revuelta", { p, de: f }); /* OC */
  delete p.gob;
  c.f = REB;
  Object.assign(p, { owner: REB, order: 50, tax: 1, gen: c.id, u: socLevantados(f, p.u) });
  const m = `${c.n}, gobernador de ${p.name}, se alza contra ${ruler(f).n} y se proclama señor de la ciudad.`;
  addLog(m, isMe(f) ? "bad" : "");
  if (isMe(f)) modal("Un gobernador se alza", `<p>${m}</p>`, [{ t: "Habrá que recuperarla" }]);
}
const socMandos = (f) => family(f).filter((c) => c.linaje === false);
const socRolTxt = (c) =>
  c.linaje === false
    ? c.rol === "capitan"
      ? "capitán"
      : "general"
    : c.id === G.F[c.f].heir
      ? "heredero"
      : "pariente";
/* la IA nombra gobernadores en sus mejores ciudades y destituye a los desleales */
function socIAGob(f) {
  for (const p of owned(f)) {
    const g = socGob(p);
    if (g && g.lea < 20 && R() < 0.5) delete p.gob;
  }
  const val = (c) => c.ge * 1.5 + c.di + socNivel(c) * 2 + (c.lea ?? 50) / 20,
    peso = (p) => (p.cap ? 100 : 0) + (p.market || 0) * 5,
    libres = owned(f)
      .filter((p) => !socGob(p))
      .sort((a, b) => peso(b) - peso(a));
  let n = 0;
  for (const p of libres) {
    if (n >= 2) break;
    const c = family(f)
      .filter((c) => !socPuedeGobernar(f, c, p) && (c.lea ?? 50) >= 35)
      .sort((a, b) => val(b) - val(a))[0];
    if (!c) break;
    socNombrarGob(p, c);
    n++;
  }
}
OC.on("conquista", ({ p, de }) => {
  if (!p || p.gob == null) return;
  const c = G.C[p.gob];
  delete p.gob;
  if (!c || !c.alive || c.f !== de) return;
  if (R() < 0.35) kill(c, `cae al perder ${p.name}`);
  else if (isMe(de)) addLog(`${c.n} huye de ${p.name} antes de que caiga.`, "bad");
});
OC.mod("rendimiento", (y, c) => {
  const g = c.p && c.p.owner === c.f && socGob(c.p);
  if (!g) return;
  const e = socGobEf(g);
  return { ...y, g: y.g * (1 + e.g), fo: y.fo * (1 + e.fo) };
});
OC.mod("ordenObjetivo", (v, c) => {
  const g = c.p && socGob(c.p);
  return g ? v + socGobEf(g).ord : undefined;
});
const socProvCtx = (p) => (p == null ? null : typeof p === "number" ? G.P[p] : p);
OC.mod("costeUnidad", (v, c) => {
  const p = socProvCtx(c.p),
    g = p && p.owner === c.f && socGob(p);
  return g ? v * (1 + socGobEf(g).coste) : undefined;
});
OC.mod("bonoBatalla", (v, c) => {
  if (c.lado !== "defensor") return;
  const p = socProvCtx(c.p),
    g = p && p.owner === c.f && socGob(p);
  return g ? v * (1 + socGobEf(g).def) : undefined;
});
/* sin ciudad en el contexto: los gobernadores letrados suman saber al reino (máx. +15%) */
OC.mod("puntosInvestigacion", (v, c) => {
  if (!socF(c.f)) return;
  let k = 0;
  for (const p of owned(c.f)) {
    const g = socGob(p);
    if (g) k += Math.max(0, g.in - 4) * 0.01;
  }
  return k ? v * (1 + Math.min(0.15, k)) : undefined;
});
/* sección de la provincia */
OC.seccion("prov", {
  id: "gobierno",
  orden: 36,
  visible: (x) => x.f < NF && (x.mine || (x.p.gob != null && !!socGob(x.p))),
  render: ({ p, mine }, dis) => {
    const g = socGob(p);
    if (!mine) return g ? `<p class="stats">Gobernador: ${g.n} (nivel ${socNivel(g)})</p>` : "";
    return `<h3>Gobernador</h3><div class="soc-c"><div>${
      g
        ? `<b>${g.n}</b> <span class="stats">${socRolTxt(g)} · nivel ${socNivel(g)} · gestión ${g.ge} · lealtad ${Math.round(g.lea ?? 50)}</span><br><span class="stats">${socGobTxt(g)}</span>`
        : '<span class="stats">Sin gobernador: la ciudad se rige por sus curiales.</span>'
    }</div><button data-act="socgob-${p.id}" ${dis ? "disabled" : ""}>${g ? "Cambiar" : "Nombrar"}</button></div>`;
  },
});
/* sección de la Corte: mandos de carrera y gobernadores */
function socMandosHtml(dis) {
  const own = owned(ME),
    gobs = own.filter((p) => socGob(p)).length,
    ls = socMandos(ME).concat(family(ME).filter((c) => c.linaje !== false && socGobDe(c)));
  let h = `<h3>Mandos y gobernadores</h3><p class="stats">Gobernadores en ${gobs} de ${own.length} ciudades. Un mando de carrera gobierna desde el nivel ${SOC_GOB_NIVEL}.</p>`;
  if (!ls.length)
    return h + '<p class="stats">Aún no hay mandos de carrera: surgen de las filas tras las victorias.</p>';
  for (const c of ls.sort((a, b) => socNivel(b) - socNivel(a))) {
    const gp = socGobDe(c),
      inf = socInfluencia(c),
      lea = Math.round(c.lea ?? 50),
      peligro = inf >= 45 && lea < 30 && (c.amb ?? 5) >= 6;
    h += `<div class="soc-c"><div><b>${c.n}</b> <span class="stats">${socRolTxt(c)} · nivel ${socNivel(c)} · mando ${c.ma} · gestión ${c.ge}</span><br><span class="stats">Influencia ${inf} · lealtad <b class="${lea < 30 ? "neg" : lea > 70 ? "pos" : ""}">${lea}</b>${gp ? " · gobierna " + gp.name : ""}${peligro ? ' · <b class="neg">puede alzarse</b>' : ""}</span></div><span class="btns soc-mb"><button data-act="socgobc-${c.id}" ${dis ? "disabled" : ""}>Gobernar</button><button data-act="renombrar-${c.id}" aria-label="Renombrar">✎</button></span></div>`;
  }
  return h;
}
OC.accion("socgob", (v) => {
  const p = G.P[+v];
  if (!p || p.owner !== ME) return;
  const val = (c) => c.ge * 1.5 + c.di + socNivel(c) * 2,
    cur = socGob(p),
    cs = family(ME)
      .filter((c) => c !== cur && c.id !== G.F[ME].ruler && c.age >= 16)
      .sort(
        (a, b) =>
          (socPuedeGobernar(ME, a, p) ? 1 : 0) - (socPuedeGobernar(ME, b, p) ? 1 : 0) || val(b) - val(a),
      )
      .slice(0, 10);
  const btns = cs.map((c) => ({
    inl: 1,
    fn: () => {
      if (!socPuedeGobernar(ME, c, p)) socNombrarGob(p, c);
    },
  }));
  if (cur)
    btns.push({
      t: "Destituir",
      fn: () => {
        delete p.gob;
        cur.dipAg = (cur.dipAg || 0) - 10;
        addLog(`${cur.n} deja el gobierno de ${p.name}.`);
      },
    });
  btns.push({ t: "Cancelar" });
  const filas = cs
    .map((c, i) => {
      const no = socPuedeGobernar(ME, c, p);
      return `<div class="row dip-op-row"><span><b>${c.n}</b> <span class="stats">${socRolTxt(c)} · nivel ${socNivel(c)} · lealtad ${Math.round(c.lea ?? 50)}<br>${no || socGobTxt(c)}</span></span><button data-mi="${i}" class="gold" ${no ? "disabled" : ""}>Nombrar</button></div>`;
    })
    .join("");
  modal(
    `Gobierno de ${p.name}`,
    `<p class="dim">Cuenta su gestión (oro), su diplomacia (orden), su mando (levas y defensa) y su nivel. Un gobernador ambicioso, influyente y desleal puede alzarse con la ciudad.</p><div style="max-height:46vh;overflow:auto">${filas || '<p class="dim">No hay nadie disponible.</p>'}</div>`,
    btns,
  );
});
OC.accion("socgobc", (v) => {
  const c = G.C[+v];
  if (!c || c.f !== ME || !c.alive) return;
  const ps = owned(ME)
      .filter((p) => !socPuedeGobernar(ME, c, p))
      .sort((a, b) => (socGob(a) ? 1 : 0) - (socGob(b) ? 1 : 0) || (b.cap ? 1 : 0) - (a.cap ? 1 : 0))
      .slice(0, 10),
    no = owned(ME).length ? socPuedeGobernar(ME, c, owned(ME)[0]) : "no tienes ciudades";
  const btns = ps.map((p) => ({ inl: 1, fn: () => socNombrarGob(p, c) }));
  btns.push({ t: "Cancelar" });
  modal(
    `${c.n}: gobierno`,
    ps.length
      ? `<p class="dim">${socGobTxt(c)}</p>${ps.map((p, i) => `<div class="row dip-op-row"><span>${p.name}${p.cap ? " ♛" : ""} <span class="stats">${socGob(p) ? "gobierna " + socGob(p).n : "sin gobernador"}</span></span><button data-mi="${i}" class="gold">Gobernar</button></div>`).join("")}`
      : `<p>No puede gobernar: ${no || "no hay ciudades libres"}.</p>`,
    btns,
  );
});
/* renombrar a un pariente o a un mando (combate solo registra la suya si esta no existe) */
function socLimpiarNombre(s) {
  const l = String(s || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>&"'`\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return l.length >= 2 && l.length <= 30 ? l : "";
}
OC.accion(
  "renombrar",
  async (v) => {
    const c = G.C[+v];
    if (!c || c.f !== ME || !c.alive) return false;
    let nuevo = null;
    await modal(
      "Renombrar",
      `<p>Nuevo nombre para ${esc(c.n)} (2-30 letras):</p><input id="cmbnom" maxlength="30" value="${esc(c.n)}" aria-label="Nombre">`,
      [{ t: "Aceptar", cls: "gold", fn: () => (nuevo = ($("cmbnom") || {}).value) }, { t: "Cancelar" }],
    );
    const l = socLimpiarNombre(nuevo);
    if (l && l !== c.n) {
      addLog(`${esc(c.n)} será conocido en adelante como ${l}.`);
      c.n = l;
    }
    if (G) ui();
    return false;
  },
  { libre: true },
);

/* ---------- el año social de cada reino (tras su economía) ---------- */
function socAnual(f) {
  if (!alive(f)) return;
  const s = socF(f);
  if (s.y === G.year) return;
  s.y = G.year;
  s.paz = dipGuerras(f).length ? 0 : (s.paz || 0) + 1;
  for (const k in s.e) {
    const e = s.e[k],
      d = socObjetivo(f, k).v - e.l;
    e.l = clamp(Math.round(e.l + (Math.abs(d) < 3 ? d : d * 0.25)), 0, 100);
    if (e.l >= 80) e.i += 1;
  }
  socNorm(s.e);
  const conv = { tol: 0.02, neu: 0.04, celo: 0.1 }[s.pol] || 0.04;
  for (const p of socOwn(f))
    if (socFe(p) !== CIV[f].rel && R() < conv + (p.temple || 0) * 0.03) {
      p.dipFe = CIV[f].rel;
      if (isMe(f)) addLog(`${p.name} abraza la fe ${SOC_FEN[CIV[f].rel] || ""} del soberano.`);
    }
  socDemandas(f, s);
  socPersonajes(f);
  socCrisis(f, s);
}
OC.on("economiaFaccion", (f) => {
  if (f < NF) socAnual(f);
});

/* ---------- la IA gobierna su corte ---------- */
function socIA(f) {
  if (!alive(f) || human(f)) return;
  const s = socF(f),
    F = G.F[f];
  socIAGob(f);
  for (const k in SOC_CARGOS) {
    if (socCargo(f, k)) continue;
    const st = SOC_CARGOS[k],
      c = socCandidatos(f)
        .filter((c) => !socCargoNombre(c))
        .sort((a, b) => b[st] - a[st])[0];
    if (c && c[st] >= 4) socNombrar(f, k, c);
    else if (F.gold > 60 && R() < 0.5) {
      F.gold -= 25;
      socNoble(f, k);
    }
  }
  for (const k in s.e)
    if (s.e[k].l < 38 && (s.uso[k] || 0) < G.year && R() < 0.6 && OC.pagar(f, SOC_DON[k][1]))
      socConceder(f, k);
  if ((s.uso.pol || 0) < G.year - 5 && R() < 0.3) {
    const ten = socTension(f),
      want = ruler(f).tr === "Piadoso" || s.e.cle.l < 35 ? "celo" : ten > 0.35 ? "tol" : "neu";
    socPolitica(f, want);
  }
  const nic = socOwn(f).filter((p) => socFe(p) === "niceno").length / Math.max(1, socOwn(f).length);
  if (SOC_CONV.includes(CIV[f].rel) && !s.fe && nic > 0.55 && R() < 0.04) socConvertir(f, "niceno");
  else if (dipLey() && (s.uso.conv || -99) < G.year - 15 && ruler(f).tr !== "Piadoso") {
    const [fe, sh] = socFeMayor(f);
    if (fe && sh >= 0.55 && R() < 0.05) socConvertir(f, fe);
  }
}
OC.on("turnoIA", socIA);
function socConceder(f, k) {
  const s = socF(f);
  s.e[k].l = clamp(s.e[k].l + 12, 0, 100);
  s.e[k].i += 2;
  socNorm(s.e);
  s.uso[k] = G.year;
}

/* ---------- reacciones a los actos del reino ---------- */
OC.on("batallaResuelta", ({ atacante, defensor, gana }) => {
  const w = gana ? atacante : defensor,
    l = gana ? defensor : atacante;
  if (w < NF) socImp(w, { ej: 2 });
  if (l < NF) socImp(l, { ej: -3, nob: -1 });
});
OC.on("conquista", ({ p, de, a }) => {
  if (a < NF) socImp(a, { ej: 2, nob: 2 });
  if (de < NF)
    socImp(de, p.cap && p.home === de ? { nob: -8, ej: -8, pue: -6, cle: -4 } : { nob: -3, pue: -2 });
});
OC.on("guerraDeclarada", ({ a, b }) => {
  for (const f of [a, b]) socImp(f, { pue: -3, ari: 3 });
  socImp(a, { cle: CIV[a].rel === CIV[b].rel ? -2 : 2 });
});
OC.on("pazFirmada", ({ a, b }) => {
  for (const f of [a, b]) socImp(f, { pue: 4, cle: 2, ari: -2 });
});
OC.on("alianzaSellada", ({ a, b }) => {
  for (const f of [a, b]) socImp(f, { nob: 2 });
});
OC.on("bodaCelebrada", ({ a, b }) => {
  for (const c of [a, b]) {
    const F = G.F[c.f];
    if (F && (c.id === F.ruler || c.id === F.heir)) socImp(c.f, { nob: 3 });
  }
});
OC.on("sucesion", ({ f, anterior, nuevo }) => {
  const s = socF(f);
  if (!s || !nuevo) return;
  const imp = {},
    rt = SOC_RASGO[nuevo.tr] || {};
  for (const k in rt) imp[k] = Math.round(rt[k] * 0.6);
  if (nuevo.age < 16) for (const k in s.e) imp[k] = (imp[k] || 0) - 5;
  if (anterior && nuevo.fa !== anterior.id && nuevo.mo !== anterior.id) imp.nob = (imp.nob || 0) - 8;
  socImp(f, imp);
  const nk = socClave(f, "nob");
  if (s.e[nk].l < 30 && R() < 0.4) socGuerraCivil(f, s, [nk]);
});
OC.on("edificioConstruido", ({ f, id }) => {
  if (f < NF)
    socImp(
      f,
      { temple: { cle: 4 }, market: { pro: 2 }, farm: { pue: 2 }, walls: { ej: 1 } }[id] || { nob: 1 },
    );
});
OC.on("revuelta", ({ de }) => {
  if (de < NF) socImp(de, { nob: -3, pue: -2 });
});
OC.on("crisisEconomica", ({ f, tipo }) => {
  socImp(
    f,
    tipo === "hambre" ? { pue: -8, ej: -4 } : tipo === "bancarrota" ? { ej: -6, nob: -4 } : { pue: -3 },
  );
});
OC.on("tecnologiaInvestigada", ({ f }) => socImp(f, { pro: 1 }));
OC.on("eraNueva", ({ f }) => socImp(f, { nob: 2 }));

/* ---------- efectos en los cálculos del contrato ---------- */
OC.mod("rendimiento", (y, c) => {
  if (!socF(c.f)) return;
  const tes = socCargo(c.f, "tes"),
    g = 1 + 0.1 * socFac(c.f, "nob") + 0.08 * socFac(c.f, "pro") + (tes ? 0.02 * (tes.ge - 4) : 0),
    fo = 1 + 0.1 * socFac(c.f, "pue");
  return { ...y, g: y.g * g, fo: y.fo * fo };
});
OC.mod("ordenObjetivo", (v, c) => {
  const s = socF(c.f);
  if (!s) return;
  const obi = socCargo(c.f, "obi");
  let d = 4 * socFac(c.f, "nob") + 4 * socFac(c.f, "ari") + 5 * socFac(c.f, "cle") + 5 * socFac(c.f, "pue");
  if (obi) d += (obi.di - 4) * 0.8;
  if (c.p && socFe(c.p) !== CIV[c.f].rel) d += { tol: -1, neu: -4, celo: -8 }[s.pol] || 0;
  return v + d;
});
OC.mod("bonoBatalla", (v, c) => {
  if (!socF(c.f)) return;
  const mag = socCargo(c.f, "mag");
  return v * (1 + 0.06 * socFac(c.f, "ari") + 0.08 * socFac(c.f, "ej") + (mag ? 0.015 * (mag.ma - 4) : 0));
});
OC.mod("puntosInvestigacion", (v, c) => {
  if (!socF(c.f)) return;
  const obi = socCargo(c.f, "obi");
  return v * (1 + 0.12 * socFac(c.f, "cle") + 0.1 * socFac(c.f, "pro") + (obi ? 0.03 * (obi.in - 3) : 0));
});

/* ---------- panel de la corte ---------- */
function socEfTxt(f, k) {
  const x = socFac(f, k),
    s = (v, u) => dipSg(v) + u;
  return {
    nob: s(x * 10, "% oro") + " · " + s(x * 4, " orden"),
    ari: s(x * 6, "% batalla") + " · " + s(x * 4, " orden"),
    cle: s(x * 5, " orden") + " · " + s(x * 12, "% saber"),
    ej: s(x * 8, "% batalla"),
    pue: s(x * 10, "% comida") + " · " + s(x * 5, " orden"),
    pro: s(x * 8, "% oro") + " · " + s(x * 10, "% saber"),
  }[k];
}
let socAbiertos = {};
document.addEventListener(
  "toggle",
  (e) => {
    const d = e.target;
    if (d && d.dataset && d.dataset.soce) socAbiertos[d.dataset.soce] = d.open;
  },
  true,
);
function socPanel(dis) {
  const f = ME,
    s = socF(f),
    F = G.F[f],
    ten = socTension(f),
    bajos = Object.keys(s.e).filter((k) => s.e[k].l < 25);
  let h = `<h2>Corte y sociedad</h2><p class="dim">Estabilidad <b>${Math.round(socEstabilidad(f))}</b> · fe ${SOC_FEN[CIV[f].rel] || "—"}${ten ? ` · ${Math.round(ten * 100)}% de tus tierras con otra fe` : ""}</p>`;
  if (bajos.length)
    h += `<p class="dip-cb">⚠ Riesgo de ${bajos.length >= 2 && bajos.reduce((a, k) => a + s.e[k].i, 0) >= 45 ? "guerra civil" : "conjura"}: ${bajos.map((k) => socNombre(f, k)).join(", ")}.</p>`;
  h += "<h3>Estamentos</h3>";
  for (const k in s.e) {
    const e = s.e[k],
      ob = socObjetivo(f, k),
      [dn, coste] = SOC_DON[k],
      us = (s.uso[k] || 0) >= G.year,
      col = e.l < 30 ? "#e0503f" : e.l < 55 ? "#e8b632" : "#4caf50";
    h += `<div class="soc-e"><div class="hd"><b>${socNombre(f, k)}</b><span class="stats">poder ${e.i}%</span></div><div class="bar"><i style="width:${e.l}%;background:${col}"></i></div>`;
    h += `<details data-soce="${k}"${socAbiertos[k] ? " open" : ""}><summary>Lealtad ${e.l} ${ob.v > e.l ? "↗" : ob.v < e.l ? "↘" : "→"} ${ob.v} · ${socEfTxt(f, k)}</summary><ul class="dip-mot">${ob.mot.length ? ob.mot.map(([t, v]) => `<li><b class="${v < 0 ? "neg" : "pos"}">${dipSg(v)}</b> ${t}</li>`).join("") : "<li>Sin motivos especiales</li>"}</ul></details>`;
    h += `<div class="btns"><button data-act="socdon-${k}" ${dis || us || !OC.puedePagar(f, coste) ? "disabled" : ""}>${dn} · ${OC.textoCoste(coste)}</button><button data-act="socrec-${k}" ${dis || (s.uso.rec || 0) >= G.year || e.i <= 12 ? "disabled" : ""}>Recortar poder</button></div></div>`;
  }
  const dem = s.dem.filter((d) => d.ac);
  if (dem.length)
    h += `<h3>Promesas</h3><ul class="dip-tr">${dem.map((d) => `<li>${socNombre(f, d.e)}: ${SOC_DEM[d.k].t} · ${d.h - G.year} años</li>`).join("")}</ul>`;
  h += "<h3>Consejo</h3>";
  for (const k in SOC_CARGOS) {
    const c = socCargo(f, k),
      st = SOC_CARGOS[k];
    h += `<div class="soc-c"><div><b>${socNomCargo(f, k)}</b> <span class="stats">${c ? `${c.n} · ${{ ma: "mando", in: "intriga", di: "diplomacia", ge: "gestión" }[st]} ${c[st]}` : "vacante"}</span><br><span class="stats">${socEfCargo(f, k, c)}</span></div><button data-act="soccar-${k}" ${dis ? "disabled" : ""}>${c ? "Cambiar" : "Nombrar"}</button></div>`;
  }
  h += socMandosHtml(dis);
  h += `<h3>Religión</h3><p class="stats">${SOC_POL[s.pol]}: ${{ tol: "poca conversión, el clero protesta", neu: "conversión lenta", celo: "conversión rápida, más desorden en tierras de otra fe" }[s.pol]}.</p><div class="g3">${Object.keys(
    SOC_POL,
  )
    .map(
      (p) =>
        `<button data-act="socpol-${p}" class="${s.pol === p ? "on" : ""}" ${dis || (s.uso.pol || 0) >= G.year ? "disabled" : ""}>${SOC_POL[p]}</button>`,
    )
    .join("")}</div>`;
  const conv = socConversiones(f);
  if (conv.length)
    h += `<div class="btns">${conv.map((x) => `<button data-act="socconv-${x}" ${dis || F.gold < 60 || (s.uso.conv || -99) > G.year - 15 ? "disabled" : ""}>Abrazar la fe ${SOC_FEN[x]} · 60 oro</button>`).join("")}</div>`;
  return (
    h +
    '<p class="note">Cada estamento tiende a su lealtad objetivo. Muy descontentos, conspiran o se alzan.</p>'
  );
}
OC.panel({ id: "corte", titulo: "Corte", orden: 25, render: socPanel });

/* ---------- acciones ---------- */
OC.accion("socdon", (k) => {
  const s = socF(ME);
  if (!s.e[k] || (s.uso[k] || 0) >= G.year || !OC.pagar(ME, SOC_DON[k][1])) return;
  socConceder(ME, k);
  addLog(`Concedes ${SOC_DON[k][0].toLowerCase()} a ${socNombre(ME, k)}.`);
});
OC.accion("socrec", (k) => {
  const s = socF(ME),
    e = s.e[k];
  if (!e || (s.uso.rec || 0) >= G.year) return;
  modal(
    `¿Recortar el poder de ${socNombre(ME, k)}?`,
    `<p class="dim">Su influencia baja 8 puntos y su lealtad 15; los demás estamentos ganan peso.</p>`,
    [
      {
        t: "Recortar",
        cls: "red",
        fn: () => {
          e.i = Math.max(8, e.i - 8);
          e.l = clamp(e.l - 15, 0, 100);
          for (const j in s.e) if (j !== k) s.e[j].i += 2;
          socNorm(s.e);
          s.uso.rec = G.year;
          addLog(`Recortas los privilegios de ${socNombre(ME, k)}.`);
        },
      },
      { t: "Cancelar" },
    ],
  );
});
OC.accion("socpol", (v) => {
  const s = socF(ME);
  if (!SOC_POL[v] || (s.uso.pol || 0) >= G.year) return;
  socPolitica(ME, v);
});
OC.accion("socconv", (v) => {
  if (G.F[ME].gold < 60 || !socConversiones(ME).includes(v)) return;
  modal(
    `¿Abrazar la fe ${SOC_FEN[v]}?`,
    `<p>Tu clero será sustituido (lealtad 45) y la ${socNombre(ME, socClave(ME, "nob")).toLowerCase()} recelará (−8). Cambiará tu relación con los reinos de cada credo y qué provincias comparten tu fe.</p>`,
    [
      {
        t: v === "niceno" || v === "arriano" ? "Recibir el bautismo" : "Abrazar la nueva fe",
        cls: "gold",
        fn: () => {
          G.F[ME].gold -= 60;
          socConvertir(ME, v);
        },
      },
      { t: "Cancelar" },
    ],
  );
});
OC.accion("soccar", (k) => {
  if (!SOC_CARGOS[k]) return;
  const st = SOC_CARGOS[k],
    stn = { ma: "Mando", in: "Intriga", di: "Diplomacia", ge: "Gestión" }[st],
    cur = socCargo(ME, k),
    cs = socCandidatos(ME)
      .filter((c) => c !== cur)
      .sort((a, b) => b[st] - a[st])
      .slice(0, 8);
  const btns = cs.map((c) => ({ inl: 1, fn: () => socNombrar(ME, k, c) }));
  btns.push(
    {
      t: "Llamar a un noble · 25 oro",
      dis: G.F[ME].gold < 25,
      fn: () => {
        if (G.F[ME].gold < 25) return;
        G.F[ME].gold -= 25;
        const c = socNoble(ME, k);
        addLog(`${c.n}, de una familia noble, entra en el consejo como ${socNomCargo(ME, k).toLowerCase()}.`);
      },
    },
    ...(cur ? [{ t: "Destituir", fn: () => delete socF(ME).car[k] }] : []),
    { t: "Cancelar" },
  );
  modal(
    socNomCargo(ME, k),
    `<p class="dim">Cuenta su ${stn.toLowerCase()}: ${SOC_CARGO_DESC[k]}. Un cargo eleva la lealtad de quien lo ocupa; los nobles de fuera agradan a su estamento.</p><div style="max-height:46vh;overflow:auto">${cs.length ? cs.map((c, i) => `<div class="row dip-op-row"><span><b>${c.n}</b> <span class="stats">${stn} ${c[st]} · lealtad ${Math.round(c.lea ?? 50)}${socCargoNombre(c) ? " · " + socCargoNombre(c) : ""}</span></span><button data-mi="${i}" class="gold">Nombrar</button></div>`).join("") : '<p class="dim">No hay parientes adultos disponibles.</p>'}</div>`,
    btns,
  );
});
