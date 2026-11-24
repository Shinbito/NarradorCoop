/* ---------- civilizaciones ----------
   Sistema de TECNOLOGÍA. Identidad y progreso propio de cada pueblo (por CIV[f].id, los 19): nombres de sus
   eras, prioridades de la IA, lo que trae al empezar, dos técnicas propias, un edificio propio y lo que piden
   sus tropas únicas. Los campos de progreso se añaden a CIV[f] al cargar: eras, tecPri, tecEdi, tecIni,
   tecLibres (clases básicas que recluta en cualquier ciudad) y tecGuerreros (nombre de su casa de guerreros,
   para los pueblos sin caballos). */
const TEC_CIV = {
  occ: {
    eras: ["Imperio en crisis", "Restauración", "Renovatio Imperii", "Imperio renacido"],
    pri: { mil: 3, eco: 2, civ: 3, rel: 2 },
    edi: ["cuartel", "herreria", "walls", "curia"],
    ini: { tec: ["disciplina"], edi: { herreria: 1 } },
  },
  ori: {
    eras: ["Corte de Constantinopla", "Basileia", "Nueva Roma", "Imperio universal"],
    pri: { mil: 2, eco: 3, civ: 3, rel: 2 },
    edi: ["escuela", "walls", "market", "hipodromo"],
    ini: { tec: ["moneda"], edi: { escuela: 1, walls: 2 } },
  },
  vis: {
    eras: ["Pueblo en marcha", "Federados de Roma", "Reino de Tolosa", "Reino consolidado"],
    pri: { mil: 3, eco: 2, civ: 2, rel: 2 },
    edi: ["cuartel", "farm", "temple", "iglesia"],
    ini: { tec: ["liturgia"], edi: {} },
  },
  hun: {
    eras: ["Horda de la estepa", "Confederación", "Imperio de la estepa", "Azote de Dios"],
    pri: { mil: 5, eco: 1, civ: 1, rel: 1 },
    edi: ["establo", "arqueria", "campamento"],
    libres: ["a", "c", "x", "m"], // la horda monta y tira con arco en cualquier campamento
    ini: { tec: ["arcos"], edi: {} },
  },
  van: {
    eras: ["Pueblo errante", "Federados", "Reino vándalo", "Señores del mar"],
    pri: { mil: 3, eco: 3, civ: 1, rel: 1 },
    edi: ["puerto", "establo", "astillero"],
    ini: { tec: ["remonta"], edi: { puerto: 1 } },
  },
  fra: {
    eras: ["Tribus del Rin", "Federados", "Reino franco", "Reino consolidado"],
    pri: { mil: 3, eco: 3, civ: 2, rel: 2 },
    edi: ["cuartel", "farm", "mallus"],
    ini: { tec: ["arado"], edi: {} },
  },
  per: {
    eras: ["Corte de Ctesifonte", "Eranshahr", "Eran y Aneran", "Rey de reyes"],
    pri: { mil: 3, eco: 2, civ: 3, rel: 2 },
    edi: ["establo", "temple", "atashkadeh"],
    ini: { tec: ["censo"], edi: {} },
  },
  ara: {
    eras: ["Tribus del desierto", "Confederación de Kinda", "Reinos de las caravanas", "Señores de Arabia"],
    pri: { mil: 3, eco: 4, civ: 2, rel: 1 },
    edi: ["market", "establo", "caravasar"],
    ini: { tec: ["remonta"], edi: { market: 1 } },
  },
  nor: {
    eras: ["Clanes del fiordo", "Jarlazgos", "Reinos del Norte", "Señores de los mares"],
    pri: { mil: 4, eco: 2, civ: 1, rel: 2 },
    edi: ["cuartel", "puerto", "langhus"],
    ini: { tec: ["disciplina"], edi: {} },
  },
  chi: {
    eras: ["Reinos divididos", "Mandato del Cielo", "Imperio del Centro", "Edad dorada"],
    pri: { mil: 2, eco: 3, civ: 4, rel: 1 },
    edi: ["escuela", "market", "arqueria", "sederia"],
    ini: { tec: ["censo"], edi: { escuela: 1 } },
  },
  inc: {
    eras: ["Curacazgo del Cuzco", "Señorío de los Andes", "Tahuantinsuyo", "Hijos del Sol"],
    pri: { mil: 3, eco: 4, civ: 3, rel: 2 },
    edi: ["farm", "guerreros", "qollqa"],
    guerreros: "Kallanka",
    ini: { tec: ["arado"], edi: { farm: 1 } },
  },
  may: {
    eras: ["Aldeas del Petén", "Señoríos mayas", "Reinos sagrados", "Edad de las estelas"],
    pri: { mil: 2, eco: 3, civ: 3, rel: 4 },
    edi: ["temple", "escuela", "observatorio"],
    guerreros: "Casa de los guerreros",
    ini: { tec: ["liturgia"], edi: { temple: 1 } },
  },
  azt: {
    eras: ["Peregrinos de Aztlán", "Señorío de Tenochtitlan", "Triple Alianza", "Imperio mexica"],
    pri: { mil: 4, eco: 3, civ: 1, rel: 3 },
    edi: ["guerreros", "farm", "teocalli"],
    guerreros: "Casa de los guerreros águila",
    ini: { tec: ["disciplina"], edi: {} },
  },
  gri: {
    eras: ["Ciudades libres", "Liga Helénica", "Hegemonía helena", "Nueva Hélade"],
    pri: { mil: 3, eco: 3, civ: 3, rel: 2 },
    edi: ["escuela", "puerto", "gimnasio"],
    ini: { tec: ["letras"], edi: { escuela: 1 } },
  },
  egi: {
    eras: ["Nomos del Nilo", "Reino del Nilo", "Las Dos Tierras", "Herederos de los faraones"],
    pri: { mil: 2, eco: 4, civ: 3, rel: 3 },
    edi: ["farm", "temple", "nilometro"],
    ini: { tec: ["arado"], edi: { farm: 1 } },
  },
  ind: {
    eras: ["Janapadas", "Reinos del Ganges", "Imperio Gupta", "Edad dorada del Ganges"],
    pri: { mil: 3, eco: 3, civ: 2, rel: 4 },
    edi: ["temple", "establo", "estupa"],
    ini: { tec: ["liturgia"], edi: { temple: 1 } },
  },
  cel: {
    eras: ["Tribus de los bosques", "Reinos de los clanes", "Alta Realeza", "Edad de los bardos"],
    pri: { mil: 3, eco: 2, civ: 1, rel: 3 },
    edi: ["cuartel", "temple", "oppidum"],
    ini: { tec: ["liturgia"], edi: {} },
  },
  esl: {
    eras: ["Tribus de los pantanos", "Uniones tribales", "Principados eslavos", "Gran Rus"],
    pri: { mil: 3, eco: 3, civ: 1, rel: 2 },
    edi: ["walls", "farm", "gord"],
    ini: { tec: ["arado"], edi: { walls: 1 } },
  },
  mon: {
    eras: ["Clanes de la estepa", "Kanato", "Gran Kanato", "Señores del mundo"],
    pri: { mil: 5, eco: 1, civ: 2, rel: 1 },
    edi: ["establo", "arqueria", "ordu"],
    libres: ["a", "c", "x", "m"],
    ini: { tec: ["remonta"], edi: {} },
  },
};
CIV.forEach((c) => {
  const t = TEC_CIV[c.id];
  if (t)
    Object.assign(c, {
      eras: t.eras,
      tecPri: t.pri,
      tecEdi: t.edi,
      tecIni: t.ini,
      tecLibres: t.libres || [],
      tecGuerreros: t.guerreros || null,
    });
});
const tecCiv = (id) => civIdx(id);

/* Técnicas propias (rama «Propias»). La segunda exige haber dejado atrás la primera era.
   Las militares y las de oficio se implantan ciudad a ciudad; las leyes y políticas rigen en todo el reino. */
// prettier-ignore
Object.assign(TEC, {
  /* --- los siete pueblos de 410 --- */
  legio: { n: "Legión palatina", r: "pro", civ: tecCiv("occ"), c: 20, anio: 415, req: [], amb: "ciudad", en: "cuartel", ef: "+8% ataque y vida de la infantería; comitatenses", st: { i: { atk: 0.08, hp: 0.08 } } },
  renovatio: { n: "Renovatio Imperii", r: "pro", civ: tecCiv("occ"), c: 45, anio: 460, req: ["legio"], era: 1, ef: "+5 orden · +8% en batalla", ord: () => 5, bono: { atacante: 0.08, defensor: 0.08 } },
  teodosianas: { n: "Murallas teodosianas", r: "pro", civ: tecCiv("ori"), c: 20, anio: 415, req: [], ef: "Murallas IV en la capital · +8% al defender", maxCap: { walls: 4 }, bono: { defensor: 0.08 } },
  tesoro: { n: "Tesoro de Constantinopla", r: "pro", civ: tecCiv("ori"), c: 45, anio: 450, req: ["teodosianas"], era: 1, ef: "+10% oro", gpct: 0.1 },
  hospitalitas: { n: "Hospitalitas", r: "pro", civ: tecCiv("vis"), c: 18, anio: 415, req: [], ef: "+1 comida por ciudad · +6 orden en tierras recién ganadas", ren: (y) => ({ ...y, fo: y.fo + 1 }), ord: (p) => (p.recent ? 6 : 0) },
  eurico: { n: "Código de Eurico", r: "pro", civ: tecCiv("vis"), c: 40, anio: 470, req: ["hospitalitas"], era: 1, ef: "+5 orden · +5% aceptación diplomática", ord: () => 5, dip: 0.05 },
  arcohuno: { n: "Arco huno", r: "pro", civ: tecCiv("hun"), c: 18, anio: 415, req: [], amb: "ciudad", en: ["establo", "arqueria"], caballo: true, ef: "+12% ataque de arqueros; jinetes de Atila", st: { a: { atk: 0.12 } } },
  tributo: { n: "Tributo de los pueblos", r: "pro", civ: tecCiv("hun"), c: 40, anio: 435, req: ["arcohuno"], era: 1, ef: "+2 oro por ciudad", ren: (y) => ({ ...y, g: y.g + 2 }) },
  flota: { n: "Flota vándala", r: "pro", civ: tecCiv("van"), c: 18, anio: 415, req: [], amb: "ciudad", en: "puerto", ef: "+3 oro por nivel de puerto", ren: (y, p) => ({ ...y, g: y.g + 3 * (p.puerto || 0) }) },
  saqueo: { n: "Saqueo de Roma", r: "pro", civ: tecCiv("van"), c: 40, anio: 455, req: ["flota"], era: 1, ef: "+20 oro por conquista · +8% al atacar", botin: 20, bono: { atacante: 0.08 } },
  francisca: { n: "Francisca", r: "pro", civ: tecCiv("fra"), c: 18, anio: 415, req: [], amb: "ciudad", en: "cuartel", ef: "+10% ataque de la infantería; lanzadores de francisca", st: { i: { atk: 0.1 } } },
  salica: { n: "Ley Sálica", r: "pro", civ: tecCiv("fra"), c: 40, anio: 500, req: ["francisca"], era: 1, ef: "+5 orden · +1 comida por ciudad", ord: () => 5, ren: (y) => ({ ...y, fo: y.fo + 1 }) },
  clibanarios: { n: "Clibanarios", r: "pro", civ: tecCiv("per"), c: 20, anio: 415, req: [], amb: "ciudad", en: "establo", caballo: true, ef: "+10% vida de la caballería; elefantes", st: { c: { hp: 0.1 } } },
  dihqanes: { n: "Dihqanes", r: "pro", civ: tecCiv("per"), c: 40, anio: 450, req: ["clibanarios"], era: 1, ef: "+2 comida y +1 oro por ciudad", ren: (y) => ({ ...y, fo: y.fo + 2, g: y.g + 1 }) },
  /* --- los doce pueblos del Mundo de leyendas --- */
  incienso: { n: "Ruta del incienso", r: "pro", civ: tecCiv("ara"), c: 18, anio: 415, req: [], amb: "ciudad", en: "market", ef: "+4 oro y +10% oro", ren: (y) => ({ ...y, g: y.g + 4 }), gpct: 0.1 },
  muallaqat: { n: "Mu'allaqat", r: "pro", civ: tecCiv("ara"), c: 40, anio: 450, req: ["incienso"], era: 1, ef: "+4 orden · +6% aceptación diplomática", ord: () => 4, dip: 0.06 },
  runas: { n: "Piedras rúnicas", r: "pro", civ: tecCiv("nor"), c: 18, anio: 415, req: [], amb: "ciudad", en: ["temple", "cuartel"], ef: "+3 orden, +1 investigación; berserkers", ord: () => 3, ptsC: () => 1 },
  drakkar: { n: "Drakkar", r: "pro", civ: tecCiv("nor"), c: 40, anio: 440, req: ["runas"], era: 1, ef: "+15 oro por conquista · +10% al atacar", botin: 15, bono: { atacante: 0.1 } },
  ballesta: { n: "Ballesta de repetición", r: "pro", civ: tecCiv("chi"), c: 20, anio: 415, req: [], amb: "ciudad", en: "arqueria", ef: "+10% ataque de arqueros; ballesteros", st: { a: { atk: 0.1 } } },
  examen: { n: "Examen imperial", r: "pro", civ: tecCiv("chi"), c: 45, anio: 450, req: ["ballesta"], era: 1, ef: "+3 orden · +3 investigación en la capital", ord: () => 3, pts: () => 3 },
  andenes: { n: "Andenes", r: "pro", civ: tecCiv("inc"), c: 18, anio: 415, req: [], amb: "ciudad", en: "farm", ef: "+3 comida y +10% comida", ren: (y) => ({ ...y, fo: y.fo + 3 }), fpct: 0.1 },
  quipu: { n: "Quipus", r: "pro", civ: tecCiv("inc"), c: 40, anio: 440, req: ["andenes"], era: 1, ef: "+6% oro · +3 orden · +1 investigación en la capital", gpct: 0.06, ord: () => 3, pts: () => 1 },
  calendario: { n: "Cuenta larga", r: "pro", civ: tecCiv("may"), c: 18, anio: 415, req: [], ef: "+3 orden · +2 investigación en la capital", ord: () => 3, pts: () => 2 },
  codices: { n: "Códices y estelas", r: "pro", civ: tecCiv("may"), c: 40, anio: 450, req: ["calendario"], era: 1, amb: "ciudad", en: "escuela", ef: "+2 investigación, +3 orden", ptsC: () => 2, ord: () => 3 },
  floridas: { n: "Guerras floridas", r: "pro", civ: tecCiv("azt"), c: 18, anio: 415, req: [], amb: "ciudad", en: "guerreros", ef: "+8% ataque de la infantería; guerreros jaguar", st: { i: { atk: 0.08 } } },
  chinampas: { n: "Chinampas", r: "pro", civ: tecCiv("azt"), c: 40, anio: 440, req: ["floridas"], era: 1, amb: "ciudad", en: "farm", ef: "+5 comida", ren: (y) => ({ ...y, fo: y.fo + 5 }) },
  academia: { n: "Academia", r: "pro", civ: tecCiv("gri"), c: 18, anio: 415, req: [], amb: "ciudad", en: "escuela", ef: "+2 investigación, +2 orden", ptsC: () => 2, ord: () => 2 },
  fuegogriego: { n: "Fuego griego", r: "pro", civ: tecCiv("gri"), c: 45, anio: 460, req: ["academia"], era: 1, ef: "+12% al defender", bono: { defensor: 0.12 } },
  riego: { n: "Canales del Nilo", r: "pro", civ: tecCiv("egi"), c: 18, anio: 415, req: [], amb: "ciudad", en: "farm", ef: "+15% comida", fpct: 0.15 },
  papiro: { n: "Papiro y escribas", r: "pro", civ: tecCiv("egi"), c: 40, anio: 445, req: ["riego"], era: 1, ef: "+5% oro · +2 investigación en la capital", gpct: 0.05, pts: () => 2 },
  gajashastra: { n: "Gajashastra", r: "pro", civ: tecCiv("ind"), c: 20, anio: 415, req: [], amb: "ciudad", en: "establo", caballo: true, ef: "+8% vida de la caballería; elefantes de guerra", st: { c: { hp: 0.08 } } },
  wootz: { n: "Acero wootz", r: "pro", civ: tecCiv("ind"), c: 45, anio: 450, req: ["gajashastra"], era: 1, amb: "ciudad", en: "herreria", ef: "+8% ataque de todas las tropas", st: { all: { atk: 0.08 } } },
  druidas: { n: "Saber druídico", r: "pro", civ: tecCiv("cel"), c: 18, anio: 415, req: [], amb: "ciudad", en: "temple", ef: "+1,5 investigación, +3 orden", ptsC: () => 1.5, ord: () => 3 },
  ogham: { n: "Ogam", r: "pro", civ: tecCiv("cel"), c: 40, anio: 450, req: ["druidas"], era: 1, ef: "+4 orden · +2 investigación en la capital", ord: () => 4, pts: () => 2 },
  roza: { n: "Roza del bosque", r: "pro", civ: tecCiv("esl"), c: 18, anio: 415, req: [], amb: "ciudad", en: "farm", ef: "+3 comida", ren: (y) => ({ ...y, fo: y.fo + 3 }) },
  veche: { n: "Veche", r: "pro", civ: tecCiv("esl"), c: 40, anio: 445, req: ["roza"], era: 1, ef: "+5 orden · +10% al defender", ord: () => 5, bono: { defensor: 0.1 } },
  yam: { n: "Yam (postas)", r: "pro", civ: tecCiv("mon"), c: 20, anio: 415, req: [], ef: "+1 oro por ciudad · −10% oro de tropa", ren: (y) => ({ ...y, g: y.g + 1 }), mant: { oro: -0.1 } },
  kurultai: { n: "Kurultái", r: "pro", civ: tecCiv("mon"), c: 40, anio: 445, req: ["yam"], era: 1, ef: "+4 orden · +10% al atacar", ord: () => 4, bono: { atacante: 0.1 } },
});

/* Edificios propios: un nivel y uno solo en todo el reino (unico). Si otro pueblo conquista la ciudad, lo
   conserva. def = bono al defender la ciudad; local = bono a sus tropas; reino = efecto en todo el reino. */
const tecEdiPropio = (id, o) => ({ max: 1, unico: true, civ: tecCiv(id), ...o });
// prettier-ignore
Object.assign(TEC_EDI, {
  curia: tecEdiPropio("occ", { n: "Curia", ef: "+8 orden, +3 oro", c: 60, t: [2], anio: { 1: 430 }, mat: "piedra", ord: () => 8, ren: (y) => ({ ...y, g: y.g + 3 }) }),
  hipodromo: tecEdiPropio("ori", { n: "Hipódromo", ef: "+12 orden, +4 oro", c: 70, t: [2], anio: { 1: 440 }, mat: "piedra", ord: () => 12, ren: (y) => ({ ...y, g: y.g + 4 }) }),
  iglesia: tecEdiPropio("vis", { n: "Iglesia arriana", ef: "+6 orden, +3 investigación", c: 50, t: [1], anio: { 1: 425 }, cat: "saber", ord: () => 6, pts: () => 3 }),
  campamento: tecEdiPropio("hun", { n: "Campamento de la horda", ef: "reino: −10% coste de jinetes y arqueros, +5% ataque de jinetes", c: 40, t: [1], anio: { 1: 415 }, cat: "mil", reino: (b) => { b.cu.c -= 0.1; b.cu.a -= 0.1; b.st.c.atk += 0.05; } }),
  astillero: tecEdiPropio("van", { n: "Astillero", ef: "+6 oro, +2 comida (costa)", c: 55, t: [2], anio: { 1: 440 }, cat: "eco", costa: true, mat: "madera", ren: (y) => ({ ...y, g: y.g + 6, fo: y.fo + 2 }) }),
  mallus: tecEdiPropio("fra", { n: "Mallus", ef: "+6 orden; reino: −10% coste de infantería", c: 40, t: [1], anio: { 1: 425 }, ord: () => 6, reino: (b) => { b.cu.i -= 0.1; } }),
  atashkadeh: tecEdiPropio("per", { n: "Templo del fuego", ef: "+10 orden, +2 investigación", c: 50, t: [1], anio: { 1: 425 }, cat: "saber", mat: "piedra", ord: () => 10, pts: () => 2 }),
  caravasar: tecEdiPropio("ara", { n: "Caravasar", ef: "+6 oro, +1 investigación", c: 55, t: [2], anio: { 1: 425 }, cat: "eco", mat: "piedra", ren: (y) => ({ ...y, g: y.g + 6 }), pts: () => 1 }),
  langhus: tecEdiPropio("nor", { n: "Salón del jarl", ef: "+6 orden; tropas de aquí +6% ataque", c: 45, t: [1], anio: { 1: 425 }, cat: "mil", mat: "madera", ord: () => 6, local: (b) => { for (const c of TEC_CAT) b.st[c].atk += 0.06; } }),
  sederia: tecEdiPropio("chi", { n: "Talleres de seda", ef: "+7 oro, +1 investigación", c: 60, t: [2], anio: { 1: 430 }, cat: "eco", ren: (y) => ({ ...y, g: y.g + 7 }), pts: () => 1 }),
  qollqa: tecEdiPropio("inc", { n: "Qollqas", ef: "+5 comida, +5 orden", c: 45, t: [1], anio: { 1: 425 }, cat: "eco", mat: "piedra", ren: (y) => ({ ...y, fo: y.fo + 5 }), ord: () => 5 }),
  observatorio: tecEdiPropio("may", { n: "Observatorio", ef: "+3 investigación, +4 orden", c: 55, t: [2], anio: { 1: 430 }, cat: "saber", mat: "piedra", pts: () => 3, ord: () => 4 }),
  teocalli: tecEdiPropio("azt", { n: "Templo Mayor", ef: "+10 orden, +1 investigación", c: 60, t: [2], anio: { 1: 430 }, cat: "saber", mat: "piedra", ord: () => 10, pts: () => 1 }),
  gimnasio: tecEdiPropio("gri", { n: "Gimnasio", ef: "+4 orden; tropas de aquí +6% vida", c: 45, t: [1], anio: { 1: 425 }, cat: "mil", ord: () => 4, local: (b) => { for (const c of TEC_CAT) b.st[c].hp += 0.06; } }),
  nilometro: tecEdiPropio("egi", { n: "Nilómetro", ef: "+4 comida, +4 oro", c: 50, t: [1], anio: { 1: 425 }, cat: "eco", mat: "piedra", ren: (y) => ({ ...y, fo: y.fo + 4, g: y.g + 4 }) }),
  estupa: tecEdiPropio("ind", { n: "Estupa", ef: "+8 orden, +2 investigación", c: 50, t: [2], anio: { 1: 430 }, cat: "saber", mat: "piedra", ord: () => 8, pts: () => 2 }),
  oppidum: tecEdiPropio("cel", { n: "Oppidum", ef: "+5 orden; +12% al defender la ciudad", c: 45, t: [1], anio: { 1: 420 }, cat: "mil", mat: "piedra", ord: () => 5, def: 0.12 }),
  gord: tecEdiPropio("esl", { n: "Gord", ef: "+5 orden; +12% al defender la ciudad", c: 40, t: [1], anio: { 1: 420 }, cat: "mil", mat: "madera", ord: () => 5, def: 0.12 }),
  ordu: tecEdiPropio("mon", { n: "Ordu del kan", ef: "reino: −10% coste de jinetes, +6% ataque de jinetes", c: 45, t: [1], anio: { 1: 415 }, cat: "mil", reino: (b) => { b.cu.c -= 0.1; b.st.c.atk += 0.06; } }),
});

/* Lo que pide cada tropa única (y las bestias) para reclutarse en una ciudad, además de su edificio
   (UN[t].edif/nivel). tec = técnica que debe regir allí (adoptada si es «de ciudad»); puede ser un mapa
   {idPueblo: técnica}. edif/nivel sustituyen a los de UN. Si combate define UN[t].tec, manda la suya.
   Las que no aparecen aquí siguen la regla general (élite = doctrina adoptada). */
const TEC_UNIDADES = {
  com: { tec: "legio" }, // occ · Cuartel II + Legión palatina
  sif: { tec: "poliorcetica" }, // ori · Cuartel II + Poliorcética (ingenios de guerra)
  esg: { tec: null }, // vis · Cuartel I
  hpa: { tec: "arcohuno" }, // hun · Establo I + Arco huno
  cor: { tec: null }, // van · Cuartel I
  fca: { tec: "francisca" }, // fra · Cuartel I + Francisca
  inm: { tec: "lorigas" }, // per · Cuartel II + Lorigas y escamas
  ele: { tec: { per: "clibanarios", ind: "gajashastra" } }, // per/ind · Establo II + su técnica
  cam: { tec: null }, // ara/egi · Establo I
  car: { tec: null }, // egi · Establo I
  ber: { tec: "runas" }, // nor · Cuartel I + Piedras rúnicas
  bal: { tec: "ballesta" }, // chi · Campo de tiro I + Ballesta de repetición
  mac: { tec: null }, // inc · Cuartel I
  atl: { tec: null, edif: "guerreros", nivel: 1 }, // may · Casa de los guerreros I
  jag: { tec: "floridas", edif: "guerreros", nivel: 1 }, // azt · Casa de los guerreros águila I + Guerras floridas
  agu: { tec: null, edif: "guerreros", nivel: 1 }, // azt · Casa de los guerreros águila I
  hop: { tec: "disciplina" }, // gri · Cuartel I + Disciplina de campaña
  fia: { tec: null }, // cel · Cuartel I
  bos: { tec: null }, // esl · Cuartel I
  kes: { tec: "remonta" }, // mon · Establo I + Remonta de caballos
};
