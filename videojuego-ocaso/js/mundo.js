/* ---------- mundo ----------
   Sistema MUNDO: los pueblos de la partida, los dos modos de juego y el tamaño del mundo.
   - CIV (nucleo.js): las 7 originales en 0..6, las 12 nuevas detrás y los rebeldes al final (REB = NF).
   - G.modo: 'historico' (410 d.C., las 7 originales, como siempre) o 'leyendas' (subconjunto elegido).
   - G.activas: índices de los pueblos que juegan. Los demás existen en G.F (para que todo bucle f < NF
     funcione) pero sin provincias ni corte viva: alive(f) es falso y G.F[f].ausente = true.
   - G.mapa: {w, h, gx, gy} tamaño del mapa (gen() en mapa.js lo usa para regenerarlo desde la semilla).
   Ver docs/mundo.md. */

const MUNDO_HIST = [0, 1, 2, 3, 4, 5, 6];
/* el mapa del modo histórico: 64×40 casillas, rejilla de 8×5 semillas (~38 provincias) */
const MUNDO_DIM0 = { w: 64, h: 40, gx: 8, gy: 5 };

/* tamaño del mundo para n pueblos activos: el área crece con el número de pueblos (~5 provincias por pueblo) */
function mundoDims(modo, n) {
  if (modo !== "leyendas" || n <= 7) return { ...MUNDO_DIM0 };
  const s = Math.sqrt(n / 6.2);
  return { w: Math.round(64 * s), h: Math.round(40 * s), gx: Math.round(8 * s), gy: Math.round(5 * s) };
}
/* fija W/H y redimensiona los lienzos del mapa (lo llama gen) */
function mundoLienzo(w, h) {
  W = w;
  H = h;
  if (cv.width !== W * T || cv.height !== H * T) {
    cv.width = W * T;
    cv.height = H * T;
    base.width = cv.width;
    base.height = cv.height;
  }
}

/* --- consultas para los demás sistemas --- */
const mundoActivas = () => (G && Array.isArray(G.activas) ? G.activas : MUNDO_HIST);
const civActiva = (f) => mundoActivas().includes(f);
const mundoLeyendas = () => !!(G && G.modo === "leyendas");
/* ¿puede el pueblo f tener tropas de la clase t? CIV[f].sinTipos: clases vetadas y, si incluye
   "caballos" (o es esa cadena), toda montura con UN[t].caballo (jinetes, carros...). P.ej. América. */
const civPuede = (f, t) => {
  const no = CIV[f] && CIV[f].sinTipos;
  if (!no || !no.length) return true;
  return !(no.includes(t) || ((no === "caballos" || no.includes("caballos")) && UN[t] && UN[t].caballo));
};
/* índice del pueblo original «pariente» (CIV[f].base), para usar su contenido mientras falte el propio */
const civBase = (f) => {
  const i = CIV[f] ? civIdx(CIV[f].base) : -1;
  return i >= 0 ? i : f;
};
/* motivo legible del veto de una clase */
function mundoMotivoVeto(f) {
  const no = CIV[f].sinTipos || [];
  return no === "caballos" || no.includes("caballos")
    ? "No hay caballos en estas tierras"
    : "Ajeno a la tradición de tu pueblo";
}

/* --- geografía de leyenda: posición aproximada de cada pueblo (x oeste→este, y norte→sur) ---
   Se usa para repartir las capitales del mapa de forma que los vecinos «tengan sentido». */
const MUNDO_GEO = {
  azt: [0.04, 0.32],
  may: [0.1, 0.55],
  inc: [0.07, 0.88],
  cel: [0.24, 0.14],
  nor: [0.4, 0.02],
  vis: [0.24, 0.45],
  fra: [0.33, 0.26],
  occ: [0.38, 0.46],
  van: [0.32, 0.72],
  esl: [0.52, 0.12],
  hun: [0.56, 0.3],
  gri: [0.47, 0.56],
  ori: [0.56, 0.46],
  egi: [0.5, 0.84],
  ara: [0.63, 0.76],
  per: [0.69, 0.55],
  ind: [0.83, 0.76],
  mon: [0.82, 0.14],
  chi: [0.96, 0.42],
};
/* --- nombres de provincia con sabor de cada pueblo (la primera es la capital) --- */
// prettier-ignore
const MUNDO_PN = {
  occ: ["Roma", "Rávena", "Mediolanum", "Aquilea", "Arelate", "Lugdunum", "Tarraco", "Burdigala", "Treveris", "Hispalis", "Corduba", "Verona", "Neápolis", "Augusta Taurinorum"],
  ori: ["Constantinopla", "Tesalónica", "Nicea", "Antioquía", "Ancira", "Cesarea", "Sárdica", "Adrianópolis", "Trebisonda", "Jerusalén", "Nicomedia", "Tarso", "Edesa", "Dirraquio"],
  vis: ["Tolosa", "Barcino", "Narbona", "Toletum", "Emerita", "Carcaso", "Recópolis", "Gerunda", "Caesaraugusta", "Valentia", "Asturica", "Pompaelo", "Complutum", "Ilerda"],
  hun: ["Campo de Atila", "Sirmio", "Tisza", "Sarmacia", "Olbia", "Tanais", "Escitia", "Ripa Danubii", "Moesia", "Dacia", "Hunnivar", "Tápolca", "Margus", "Naissus"],
  van: ["Cartago", "Hipona", "Cesarea de Mauritania", "Tingis", "Sufetula", "Leptis Magna", "Útica", "Cirta", "Hadrumetum", "Tapso", "Tamugadi", "Sala", "Volubilis", "Theveste"],
  fra: ["Tornacum", "Colonia Agrippina", "Moguntiacum", "Lutecia", "Remis", "Suessio", "Turonum", "Aurelianum", "Ambiani", "Metis", "Tungri", "Noviomagus", "Cameracum", "Vormatia"],
  per: ["Ctesifonte", "Persépolis", "Isfahán", "Susa", "Merv", "Nishapur", "Ecbatana", "Rey", "Istajr", "Bishapur", "Gundishapur", "Hamadán", "Ardabil", "Herat"],
  ara: ["La Meca", "Yatrib", "Petra", "Palmira", "Taif", "Najrán", "Hira", "Marib", "Saba", "Dumat al-Yandal", "Tayma", "Jaybar", "Hadramaut", "Saná"],
  nor: ["Uppsala", "Hedeby", "Birka", "Kaupang", "Roskilde", "Hlaðir", "Lejre", "Ribe", "Sigtuna", "Bergen", "Jelling", "Gotland", "Avaldsnes", "Borre"],
  chi: ["Chang'an", "Luoyang", "Jiankang", "Chengdu", "Ye", "Xuchang", "Pingcheng", "Yangzhou", "Guangzhou", "Taiyuan", "Jingzhou", "Xiangyang", "Hangzhou", "Kaifeng"],
  inc: ["Cuzco", "Quito", "Cajamarca", "Vilcabamba", "Ollantaytambo", "Pachacámac", "Huánuco Pampa", "Tumbes", "Chan Chan", "Sacsayhuamán", "Tiahuanaco", "Vilcashuamán", "Jauja", "Machu Picchu"],
  may: ["Tikal", "Calakmul", "Palenque", "Copán", "Chichén Itzá", "Uxmal", "Yaxchilán", "Caracol", "Piedras Negras", "Quiriguá", "Dos Pilas", "Cobá", "Bonampak", "Mayapán"],
  azt: ["Tenochtitlán", "Texcoco", "Tlacopan", "Tlatelolco", "Cholula", "Tula", "Teotihuacán", "Xochimilco", "Coyoacán", "Culhuacán", "Azcapotzalco", "Tlaxcala", "Chalco", "Tenayuca"],
  gri: ["Atenas", "Esparta", "Corinto", "Tebas", "Argos", "Delfos", "Olimpia", "Siracusa", "Rodas", "Mileto", "Micenas", "Megara", "Cnosos", "Pela"],
  egi: ["Menfis", "Alejandría", "Uaset", "Heliópolis", "Abidos", "Asuán", "Elefantina", "Amarna", "Sais", "Tanis", "Bubastis", "Edfu", "Dendera", "Avaris"],
  ind: ["Pataliputra", "Ujjain", "Mathura", "Varanasi", "Prayaga", "Ayodhya", "Taxila", "Nalanda", "Kanauj", "Vidisha", "Ajanta", "Kanchipuram", "Madurai", "Sanchi"],
  cel: ["Tara", "Alesia", "Bibracte", "Gergovia", "Cashel", "Emain Macha", "Cruachan", "Dunadd", "Tintagel", "Camulodunon", "Dinas Emrys", "Aileach", "Dún Aonghasa", "Manching"],
  esl: ["Kiev", "Nóvgorod", "Smolensk", "Chernígov", "Pskov", "Vyšehrad", "Gniezno", "Cracovia", "Arkona", "Polotsk", "Ládoga", "Rostov", "Turov", "Retra"],
  mon: ["Karakorum", "Avarga", "Onón", "Kerulen", "Burkhan Jaldún", "Orjón", "Altái", "Jangái", "Tuul", "Selengá", "Ötüken", "Jentii", "Shangdu", "Gobi"],
};
/* tierras sin dueño cuando se agotan los nombres de la región */
// prettier-ignore
const MUNDO_PN_LIBRE = ["Tierras Altas", "Vado del Cuervo", "Paso de las Nieblas", "Colina del Eco", "Valle Hondo", "Marca Salvaje", "Bosque Viejo", "Llanura Ceniza", "Peña Roja", "Lago Quieto", "Desfiladero Negro", "Costa Brava", "Isla Larga", "Monte Solitario", "Ciénaga Gris", "Sierra Azul", "Mesa del Viento", "Río Lento", "Cumbre Blanca", "Selva Muda"];

/* --- facciones que no juegan esta partida --- */
function mundoAusente(f) {
  /* un soberano «de nombre» ya muerto: así ruler(f).n funciona, pero no hay corte viva que envejezca ni intrigue */
  const r = mkChar(f, "m", 40);
  r.alive = false;
  r.mundoAusente = true;
  return { gold: 0, food: 0, ruler: r.id, heir: null, amb: 0, tre: 0, asn: 0, dip: {}, capId: 0, ausente: true };
}
/* normaliza la lista de pueblos activos de una partida de leyendas: siempre incluye al jugador */
function mundoNormActivas(me, act) {
  const s = new Set((act || []).filter((f) => Number.isInteger(f) && f >= 0 && f < NF));
  s.add(me);
  if (s.size < 2) for (const f of MUNDO_HIST) if (s.size < 2) s.add(f);
  return [...s].sort((a, b) => a - b);
}
/* rivales al azar (sin el jugador) */
function mundoRivalesAzar(me, n) {
  const otros = [...Array(NF).keys()].filter((f) => f !== me).sort(() => R() - 0.5);
  return otros.slice(0, clamp(n, 1, NF - 1));
}

/* reparte las capitales entre los pueblos según MUNDO_GEO: asignación voraz y luego intercambios
   que reducen la distancia total. caps: provincias (con x, y), act: índices de pueblo. Devuelve [{f, p}] */
function mundoRepartir(caps, act) {
  const xs = caps.map((p) => p.x),
    ys = caps.map((p) => p.y),
    x0 = Math.min(...xs),
    y0 = Math.min(...ys),
    sx = Math.max(1, Math.max(...xs) - x0),
    sy = Math.max(1, Math.max(...ys) - y0),
    pos = caps.map((p) => [(p.x - x0) / sx, (p.y - y0) / sy]),
    geo = act.map((f) => MUNDO_GEO[CIV[f].id] || [0.5, 0.5]),
    d = (i, j) => (pos[j][0] - geo[i][0]) ** 2 + (pos[j][1] - geo[i][1]) ** 2,
    asg = Array(act.length).fill(-1),
    libre = new Set(caps.map((_, j) => j));
  /* los pueblos más alejados del centro eligen primero */
  const orden = act
    .map((_, i) => i)
    .sort((a, b) => Math.hypot(geo[b][0] - 0.5, geo[b][1] - 0.45) - Math.hypot(geo[a][0] - 0.5, geo[a][1] - 0.45));
  for (const i of orden) {
    let bj = -1;
    for (const j of libre) if (bj < 0 || d(i, j) < d(i, bj)) bj = j;
    asg[i] = bj;
    libre.delete(bj);
  }
  for (let vuelta = 0, mejora = true; mejora && vuelta < 20; vuelta++) {
    mejora = false;
    for (let a = 0; a < act.length; a++)
      for (let b = a + 1; b < act.length; b++)
        if (d(a, asg[b]) + d(b, asg[a]) < d(a, asg[a]) + d(b, asg[b]) - 1e-9) {
          [asg[a], asg[b]] = [asg[b], asg[a]];
          mejora = true;
        }
  }
  return act.map((f, i) => ({ f, p: caps[asg[i]] }));
}

/* nombres de provincia en el modo leyendas: cada tierra toma nombres del pueblo que la ocupa
   (o del más cercano si es de los rebeldes); la capital, el nombre más ilustre */
function mundoNombrar() {
  const usados = new Set(),
    caps = G.activas.map((f) => G.P[G.F[f].capId]),
    resto = {};
  for (const f of G.activas) resto[f] = (MUNDO_PN[CIV[f].id] || []).slice();
  const libres = MUNDO_PN_LIBRE.concat(PNAMES).filter((n) => !Object.values(MUNDO_PN).flat().includes(n));
  const toma = (l) => {
    while (l && l.length) {
      const n = l.shift();
      if (!usados.has(n)) return n;
    }
    return null;
  };
  const cercanos = (p) =>
    caps
      .slice()
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))
      .map((c) => c.owner);
  const pon = (p, n) => {
    p.name = n;
    usados.add(n);
  };
  for (const p of caps) pon(p, toma(resto[p.owner]) || p.name);
  /* las tierras de cada pueblo primero; después las libres, por cercanía */
  const orden = G.P.filter((p) => !p.cap).sort((a, b) => (a.owner === REB) - (b.owner === REB));
  for (const p of orden) {
    let n = null;
    const pref = p.owner !== REB ? [p.owner, ...cercanos(p)] : cercanos(p);
    for (const f of pref) if (!n) n = toma(resto[f]);
    pon(p, n || toma(libres) || "Provincia " + (p.id + 1));
  }
}

/* --- partidas guardadas antiguas (antes de la fase 2: 7 pueblos y rebeldes en el índice 7) ---
   Idempotente: solo remapea si falta G.activas; el resto solo rellena lo que falte. */
function mundoMigrar() {
  if (!G || !Array.isArray(G.P)) return;
  if (!Array.isArray(G.activas)) {
    const viejo = 7;
    if (REB !== viejo) {
      const re = (v) => (v === viejo ? REB : v);
      for (const p of G.P) {
        p.owner = re(p.owner);
        p.home = re(p.home);
      }
      for (const c of G.C || []) c.f = re(c.f);
      /* combate guarda la facción de origen de las tropas por provincia */
      for (const k of ["vet", "ori"]) {
        const o = G.cmb && G.cmb[k];
        if (o) for (const i in o) if (o[i] && o[i].f === viejo) o[i].f = REB;
      }
    }
    G.activas = MUNDO_HIST.filter((f) => f < (G.F || []).length);
    if (!G.modo) G.modo = "historico";
  }
  if (!G.modo) G.modo = "historico";
  if (!G.mapa) G.mapa = { ...MUNDO_DIM0 };
  G.rel = G.rel || [];
  G.st = G.st || [];
  for (let a = 0; a < NF; a++) {
    G.rel[a] = G.rel[a] || [];
    G.st[a] = G.st[a] || [];
    for (let b = 0; b < NF; b++) {
      if (G.rel[a][b] == null) G.rel[a][b] = 0;
      if (G.st[a][b] == null) G.st[a][b] = "paz";
    }
  }
  G.F = G.F || [];
  for (let f = 0; f < NF; f++) if (!G.F[f]) G.F[f] = mundoAusente(f);
  /* reputación de diplomacia: era un array de 7 */
  if (G.dip && Array.isArray(G.dip.rep)) for (let f = 0; f < NF; f++) if (G.dip.rep[f] == null) G.dip.rep[f] = 60;
}
/* relleno PROVISIONAL de progreso: mientras tecnología no defina los campos de un pueblo nuevo, usa los
   de su pariente (CIV[f].base) para la técnica y edificios de partida, las prioridades de la IA y las
   clases libres. Solo rellena lo que falta: en cuanto TEC_CIV los defina, esto no hace nada. */
function mundoRelleno() {
  for (let f = 0; f < NF; f++) {
    const c = CIV[f],
      b = CIV[civBase(f)];
    if (!c.tecIni && b.tecIni) c.tecIni = b.tecIni;
    if (!c.tecPri && b.tecPri) c.tecPri = b.tecPri;
    if (!c.tecLibres && b.tecLibres) c.tecLibres = b.tecLibres.filter((t) => civPuede(f, t));
  }
}
/* mundo.js se carga antes que los demás sistemas: estos oyentes corren los primeros */
OC.on("partidaLista", mundoRelleno);
OC.on("partidaLista", mundoMigrar);

/* tipos vetados por pueblo (p.ej. incas, mayas y aztecas no tienen caballos). Prioridad alta: se aplica al final. */
OC.mod(
  "unidadesDisponibles",
  (arr, x = {}) => {
    if (!Array.isArray(arr) || x.f == null || !CIV[x.f]) return;
    const no = CIV[x.f].sinTipos || [];
    if (!no.length) return;
    const fuera = arr.filter((t) => !civPuede(x.f, t));
    if (x.motivos) for (const t of fuera) x.motivos[t] = mundoMotivoVeto(x.f);
    return arr.filter((t) => civPuede(x.f, t));
  },
  100,
);

/* Garantía de sinTipos: si algún sistema da a un pueblo tropas que no puede tener (p.ej. un favor de la
   aristocracia que regala jinetes a los incas), se convierten en su equivalente a pie al cerrar el año. */
const MUNDO_A_PIE = { x: "h", c: "i", k: "p", m: "a" };
function mundoDepurar() {
  if (!G || !Array.isArray(G.P)) return;
  for (const p of G.P) {
    const f = p.owner;
    if (f == null || f >= NF || !p.u || !CIV[f].sinTipos || !CIV[f].sinTipos.length) continue;
    for (const t of Object.keys(p.u)) {
      if (!(p.u[t] > 0) || civPuede(f, t)) continue;
      let d = MUNDO_A_PIE[t] || (UN[t] && MUNDO_A_PIE[UN[t].rol]) || "i";
      if (!civPuede(f, d)) d = "i";
      p.u[d] = (p.u[d] || 0) + p.u[t];
      p.u[t] = 0;
    }
  }
}
/* se registra al terminar de cargar la página, para correr DESPUÉS de los oyentes de los demás sistemas */
if (typeof window !== "undefined")
  window.addEventListener("load", () => {
    for (const ev of ["economiaFaccion", "turnoIA", "finAnio", "inicioTurno", "partidaLista"]) OC.on(ev, mundoDepurar);
  });

/* --- estilos de la pantalla de inicio (no hay css propio: se inyectan aquí) --- */
(() => {
  if (typeof document === "undefined") return;
  const st = document.createElement("style");
  st.textContent = `
.mun-modos{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:8px 0 4px}
.mun-modos button{text-align:left;padding:12px;font:15px/1.35 "Pixelify Sans",sans-serif;display:flex;flex-direction:column;gap:4px}
.mun-modos button b{font:400 11px/1.5 "Press Start 2P",monospace;color:var(--gold)}
.civs.mun-g{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.civ.mun-civ{min-height:0;font-size:14px;gap:4px}
.civ.mun-civ .dim{font-size:13px}
.mun-sin{color:#e8a87c;font-size:13px}
.mun-riv{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:8px}
.mun-riv button{display:flex;align-items:center;gap:8px;text-align:left;font:13px/1.2 "Pixelify Sans",sans-serif;min-height:40px;padding:6px 8px}
.mun-riv button i{flex:none;width:14px;height:14px;border:2px solid #000}
.mun-riv button.off{opacity:.55}
.mun-num{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px}
.mun-num b{font:400 18px/1 "Press Start 2P",monospace;color:var(--gold);min-width:2.2em;text-align:center}
.mun-sel{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px;font-size:14px}
.mun-sel span{white-space:nowrap}
@media (max-width:640px){.civs.mun-g{grid-template-columns:minmax(0,1fr)}.mun-riv{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
  document.head.appendChild(st);
})();
