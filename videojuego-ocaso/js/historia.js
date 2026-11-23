/* ---------- historia ----------
   Sistema de NARRATIVA: arcos históricos del ocaso de Roma (capítulos que avanzan con los años y
   con lo que pasa en el juego), prólogo según el pueblo, hechos menores de la crónica y epílogo.
   Arco: {id, t, para(f), caps: [capítulo], fines: {clave: {t, d, ep}}, finDef(c)}.
   Capítulo: como un evento de EVENTS más {y: año mínimo, tras: años tras el anterior, max, tarde,
   cad(c) → clave de fin}. Una opción puede llevar fin (clave o fn(c, éxito)) o sig (id del capítulo). */

const narHay = (f, ...ks) => ks.some((k) => narTiene(f, k));
const narFrontera = (c) => c.own.filter((p) => foes(p, c.f).length)[0] || c.p;
/* la fe del reino la guarda sociedad (G.dip.soc[f].fe → CIV[f].rel); sin ella, G.nar.f[f].fe */
function narConvertir(f, fe) {
  if (typeof socConvertir === "function") socConvertir(f, fe);
  else narF(f).fe = fe;
}

const NAR_ARCOS = [
  /* ---------- I. La caída de Roma (todos) ---------- */
  {
    id: "roma",
    t: "La caída de Roma",
    para: () => true,
    caps: [
      {
        id: "roma1",
        t: (c) => (c.f === 2 ? "El botín de Roma" : "Roma ha caído"),
        y: 411,
        max: 416,
        d: (c) =>
          c.f === 2
            ? `Las carretas crujen bajo el oro de los senadores romanos. En los campamentos, los obispos arrianos y los cautivos nicenos se miran con recelo, y los guerreros ya preguntan cuánto les toca. ${narTit(c.r)} debe decidir qué hacer con lo que la Ciudad dejó.`
            : c.f === 0
              ? `Llegan a ${c.cap.name} jinetes cubiertos de polvo: Roma, que en ocho siglos no había visto un enemigo dentro de sus murallas, ha sido saqueada por los godos. En la corte, unos lloran; otros ya calculan.`
              : `La noticia llega como llegan las tormentas: Roma ha sido saqueada por los godos de Alarico. Los mercaderes no hablan de otra cosa, y por los caminos aparecen refugiados con códices bajo el brazo y joyas cosidas a la ropa.`,
        o: [
          {
            vis: (c) => c.f === 2,
            t: "Repartir el botín entre los guerreros",
            tip: "+30 oro, +2 infantería en la capital",
            ef: (c) => {
              OC.ganar(c.f, { oro: 30 });
              narTropa(c.cap, "i", 2);
            },
            leg: { gl: 5 },
            mk: "roma_botin",
            cr: (c) =>
              `${narTit(c.r)} reparte el oro de Roma entre sus guerreros. Nadie en el campamento olvidará su nombre.`,
          },
          {
            vis: (c) => c.f === 2,
            t: "Devolver los vasos sagrados a las basílicas",
            tip: "+10 relación con los reinos nicenos",
            ef: (c) => relFe(c.f, "niceno", 10),
            leg: { pi: 6 },
            mk: "roma_basilicas",
            cr: (c) =>
              `${narTit(c.r)} devuelve los vasos sagrados a las basílicas de Roma. Hasta los obispos nicenos lo alaban.`,
          },
          {
            vis: (c) => c.f === 2,
            t: "Guardar el tesoro para comprar tierra",
            tip: "+80 oro",
            ef: (c) => OC.ganar(c.f, { oro: 80 }),
            leg: { sa: 3, cr: 1 },
            mk: "roma_tesoro",
          },
          {
            vis: (c) => c.f === 0,
            t: "Abrir la ciudad a los refugiados",
            coste: { comida: 10 },
            tip: "+6 orden en la capital",
            ef: (c) => narOrden(c.f, 6, c.cap),
            leg: { pi: 4, sa: 2 },
            mk: "roma_refugiados",
            cr: (c) => `${c.cap.name} abre sus puertas a los refugiados de Roma.`,
          },
          {
            vis: (c) => c.f === 0,
            t: "Castigar a los senadores que pactaron",
            tip: "+50 oro confiscado, −5 orden",
            ef: (c) => {
              OC.ganar(c.f, { oro: 50 });
              narOrden(c.f, -5);
            },
            leg: { cr: 6 },
            mk: "roma_purga",
            cr: (c) => `${narTit(c.r)} confisca los bienes de los senadores que negociaron con los godos.`,
          },
          {
            vis: (c) => c.f === 0,
            t: "Enviar legados a los godos",
            req: () => narReq(alive(2), "los godos ya no existen"),
            tip: "+25 relación con los visigodos",
            ef: (c) => relAdd(c.f, 2, 25),
            leg: { sa: 3 },
            mk: "roma_tregua",
          },
          {
            vis: (c) => c.f !== 0 && c.f !== 2,
            t: "Acoger a los refugiados",
            coste: { comida: 10 },
            tip: "+4 orden",
            ef: (c) => narOrden(c.f, 4),
            leg: { pi: 2, sa: 4 },
            mk: "roma_refugiados",
            cr: (c) => `${narTit(c.r)} acoge a los refugiados de Roma y a sus libros.`,
          },
          {
            vis: (c) => c.f !== 0 && c.f !== 2,
            t: "Comprar barato lo que salvaron",
            coste: { oro: 30 },
            tip: "+8% investigación durante 6 años",
            ef: (c) => narEf(c.f, "invest", 0.08, 6, "Códices de Roma"),
            leg: { sa: 2 },
            mk: "roma_tesoro",
          },
          {
            vis: (c) => c.f !== 0 && c.f !== 2 && narCristiano(c.f),
            t: "Predicar que Roma cayó por sus pecados",
            tip: "+5 orden",
            ef: (c) => narOrden(c.f, 5),
            leg: { pi: 3 },
            mk: "roma_hora",
          },
          {
            vis: (c) => c.f !== 0 && c.f !== 2 && !narCristiano(c.f),
            t: "Proclamar que la hora de Roma ha pasado",
            tip: "+5 orden",
            ef: (c) => narOrden(c.f, 5),
            leg: { gl: 3 },
            mk: "roma_hora",
          },
        ],
      },
      {
        id: "roma2",
        tras: 3,
        max: 426,
        t: (c) =>
          narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora")
            ? "La sombra de Roma"
            : "La ciudad de Dios",
        d: (c) =>
          narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora")
            ? "Los veteranos cuentan en las tabernas lo que vieron en Roma: mármoles, termas, leyes escritas en bronce. Los jóvenes de la corte ya visten a la romana y citan a Virgilio; los viejos escupen al oírlos."
            : `Entre los refugiados llegó un ${narCristiano(c.f) ? "clérigo africano" : "filósofo de Atenas"} de dedos manchados de tinta. Escribe que la ciudad de los hombres puede caer sin que caiga ${narCristiano(c.f) ? "la ciudad de Dios" : "la de la razón"}, y solo pide un copista y una lámpara.`,
        o: [
          {
            vis: (c) => !narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora"),
            t: "Costear un scriptorium",
            coste: { oro: 30 },
            tip: "+10% investigación durante 8 años",
            ef: (c) => narEf(c.f, "invest", 0.1, 8, "Scriptorium"),
            leg: { sa: 6 },
            fin: "letras",
          },
          {
            vis: (c) => !narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora"),
            t: (c) => `Que predique en ${c.cap.name}`,
            tip: "+3 orden durante 6 años",
            ef: (c) => narEf(c.f, "orden", 3, 6, "Sermones del refugiado"),
            leg: { pi: 5 },
            fin: "pulpito",
          },
          {
            vis: (c) => !narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora"),
            t: "Despedirle: no queremos profetas",
            leg: { cr: 1 },
            fin: "olvido",
          },
          {
            vis: (c) => narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora"),
            t: "Adoptar el derecho romano",
            tip: "+3 orden durante 10 años",
            ef: (c) => narEf(c.f, "orden", 3, 10, "Derecho romano"),
            leg: { sa: 5 },
            fin: "ley",
          },
          {
            vis: (c) => narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora"),
            t: "Nuestras costumbres bastan",
            tip: "+5% en batalla durante 6 años",
            ef: (c) => narEf(c.f, "batalla", 0.05, 6, "Costumbre de los padres"),
            leg: { gl: 5 },
            fin: "espada",
          },
          {
            vis: (c) => narHay(c.f, "roma_botin", "roma_purga", "roma_tregua", "roma_hora"),
            t: "Tomar de Roma solo su fisco",
            req: (c) => narStat(c.r, "ge", 5),
            tip: "+4 oro al año durante 8 años",
            ef: (c) => narEf(c.f, "oro", 4, 8, "Fisco a la romana"),
            leg: { sa: 3 },
            fin: "fisco",
          },
        ],
      },
    ],
    fines: {
      letras: {
        t: "Las letras sobreviven",
        d: "Bajo tu techo se copian los libros que Roma dejó caer.",
        ep: "En su corte se copiaron los libros que Roma había dejado caer, y algunos aún se leen.",
      },
      pulpito: {
        t: "La palabra del refugiado",
        d: "Sus sermones se repiten en cada plaza del reino.",
        ep: "Un refugiado de Roma convirtió la caída del imperio en lección, y el pueblo la aprendió.",
      },
      olvido: {
        t: "El profeta despedido",
        d: "El refugiado marchó a otra corte. Allí escribió su libro.",
        ep: "Despidió a un sabio que otros acogieron; la historia suele recordar esas cosas.",
      },
      ley: {
        t: "La ley de Roma",
        d: "Los jueces del reino juzgan ya por el código de los romanos.",
        ep: "Adoptó la ley de Roma, y la ley sobrevivió al imperio.",
      },
      espada: {
        t: "La costumbre de los padres",
        d: "El reino da la espalda a Roma y mira a sus antepasados.",
        ep: "Dio la espalda a Roma y gobernó a la vieja usanza de su pueblo.",
      },
      fisco: {
        t: "El fisco romano",
        d: "Los recaudadores del reino aprenden a contar como los romanos.",
        ep: "Tomó de Roma lo que servía: sus registros, sus recaudadores y su paciencia.",
      },
    },
  },

  /* ---------- II. El foedus (visigodos, vándalos, francos) ---------- */
  {
    id: "foedus",
    t: "El foedus",
    para: (f) => [2, 4, 5].includes(f) && alive(0),
    caps: [
      {
        id: "foedus1",
        t: "La oferta de Rávena",
        y: 413,
        max: 432,
        tarde: "sin_roma",
        ok: () => alive(0),
        d: () =>
          `Un tribuno romano, con la capa raída y la dignidad intacta, trae una propuesta de ${narTit(ruler(0))}: tierras para tu pueblo dentro de las fronteras y la annona cada año, a cambio de que tus guerreros sirvan bajo las águilas. Los romanos lo llaman <i>foedus</i>.`,
        o: [
          {
            t: "Aceptar el foedus",
            tip: "+8 oro al año (10 años), paz con Occidente",
            ef: (c) => {
              narEf(c.f, "oro", 8, 10, "Annona de Roma");
              relAdd(c.f, 0, 25);
              if (G.st[c.f][0] === "guerra") makePeace(c.f, 0);
            },
            leg: { sa: 3 },
            mk: "foedus",
            cr: (c) => `${narTit(c.r)} firma el foedus con Roma. Su pueblo será federado del imperio.`,
          },
          {
            t: "Exigir más tierra",
            req: (c) => narStat(c.r, "di", 4),
            prob: (c) => 0.3 + c.r.di * 0.06,
            px: (c) => `según la diplomacia de ${c.r.n}`,
            si: (c) => {
              narEf(c.f, "oro", 12, 10, "Annona de Roma");
              relAdd(c.f, 0, 15);
              return "El tribuno cede: más tierra y más annona (+12 oro al año durante 10 años).";
            },
            no: (c) => {
              relAdd(c.f, 0, -20);
              return "El tribuno recoge sus tablillas y se marcha. Roma buscará otros federados.";
            },
            mk: (c, ok) => (ok ? "foedus" : null),
            fin: (c, ok) => (ok ? null : "libres"),
            leg: { gl: 2 },
          },
          {
            t: "Rechazar: no seremos siervos de Roma",
            tip: "−10 relación con Occidente",
            ef: (c) => relAdd(c.f, 0, -10),
            leg: { gl: 5 },
            fin: "libres",
          },
        ],
      },
      {
        id: "foedus2",
        t: "La llamada del magister",
        tras: 5,
        max: 456,
        tarde: "olvidado",
        ok: (c) => narTiene(c.f, "foedus") && alive(0),
        prep: (c) => {
          c.g = narEnemigos(0).filter((g) => g !== c.f)[0] ?? null;
        },
        d: (c) =>
          `El magister militum de Occidente reclama a sus federados: ${c.g != null ? `${narPueblo(c.g)} amenaza las fronteras del imperio` : "los bagaudas arrasan la Galia"} y Roma ya no tiene soldados propios. El tribuno de la capa raída ha vuelto, esta vez con menos cortesía.`,
        o: [
          {
            t: "Enviar a tus guerreros",
            req: (c) => narReq(c.cap.u.i >= 3, "hacen falta 3 infantes en la capital"),
            tip: "−3 infantería de la capital, +20 relación con Occidente",
            ef: (c) => {
              narTropa(c.cap, "i", -3);
              relAdd(c.f, 0, 20);
            },
            prob: 0.6,
            px: "la guerra es la guerra",
            si: (c) => {
              OC.ganar(c.f, { oro: 50 });
              return "Vuelven cargados de botín y de historias: +50 oro.";
            },
            no: (c) => {
              relAdd(c.f, 0, 10);
              return "Vuelven pocos, pero Roma no lo olvida: +10 relación más.";
            },
            leg: { gl: 5 },
            mk: "foedus_honrado",
          },
          {
            t: "Enviar excusas y algo de oro",
            coste: { oro: 30 },
            tip: "−5 relación con Occidente",
            ef: (c) => relAdd(c.f, 0, -5),
            leg: { sa: 1 },
            mk: "foedus_tibio",
          },
          {
            t: "Romper el foedus",
            tip: "pierdes la annona; −30 relación con Occidente",
            ef: (c) => {
              narEfQuita(c.f, "Annona de Roma");
              relAdd(c.f, 0, -30);
            },
            leg: { gl: 3, cr: 2 },
            fin: "roto",
          },
        ],
      },
      {
        id: "foedus3",
        t: "Tierra propia",
        y: 440,
        tras: 6,
        ok: (c) => narHay(c.f, "foedus_honrado", "foedus_tibio"),
        d: (c) =>
          `Roma se apaga como una vela. La annona llega tarde o no llega, y en tus tierras ya nadie recuerda al tribuno. Tus nobles dicen que es hora de que ${narTit(c.r)} se llame ${narO(c.r, "rey", "reina")} de su propia tierra, y no huésped de nadie.`,
        o: [
          {
            t: "Proclamar el reino",
            tip: "+4 orden durante 10 años; adiós a la annona",
            ef: (c) => {
              narEfQuita(c.f, "Annona de Roma");
              narEf(c.f, "orden", 4, 10, "Reino propio");
              if (alive(0)) relAdd(c.f, 0, -20);
            },
            leg: { gl: 8 },
            fin: "reino",
            cr: (c) => `${narTit(c.r)} se proclama soberano de su tierra sin pedir permiso a Roma.`,
          },
          {
            t: "Seguir siendo fieles a Roma",
            req: () => narReq(alive(0), "Roma ya no existe"),
            tip: "+20 relación con Occidente, +5% diplomacia (10 años)",
            ef: (c) => {
              relAdd(c.f, 0, 20);
              narEf(c.f, "diplo", 0.05, 10, "Fieles a Roma");
            },
            leg: { pi: 3, sa: 3 },
            fin: "fieles",
          },
          {
            t: "Pedir a Roma el título de patricio",
            req: (c) => (alive(0) ? narStat(c.r, "di", 5) : "Roma ya no existe"),
            prob: (c) => 0.35 + c.r.di * 0.05,
            px: (c) => `según la diplomacia de ${c.r.n}`,
            si: (c) => {
              narEf(c.f, "oro", 6, 10, "Patriciado");
              return `Roma concede a ${narTit(c.r)} el título de patricio: un trono bárbaro con manto romano (+6 oro al año, 10 años).`;
            },
            no: (c) => {
              relAdd(c.f, 0, -10);
              return "Roma se niega. Los nobles toman la negativa como permiso para proclamar el reino.";
            },
            leg: { gl: 3, sa: 3 },
            fin: (c, ok) => (ok ? "patricio" : "reino"),
          },
        ],
      },
    ],
    fines: {
      libres: {
        t: "Libres de Roma",
        d: "Tu pueblo no sirve a nadie.",
        ep: "Rechazó el foedus de Roma y no sirvió a ningún emperador.",
      },
      sin_roma: {
        t: "Sin Roma",
        d: "Roma cayó antes de poder ofrecer nada.",
        ep: "Llegó tarde para servir a Roma: Roma ya no estaba.",
      },
      olvidado: {
        t: "El foedus olvidado",
        d: "Roma nunca volvió a llamar.",
        ep: "Fue federado de un imperio que se olvidó de llamarle.",
      },
      roto: {
        t: "El foedus roto",
        d: "Rompiste el pacto con Roma.",
        ep: "Rompió el foedus con Roma cuando Roma más lo necesitaba.",
      },
      reino: {
        t: "Un reino propio",
        d: "Los federados de ayer son hoy un reino.",
        ep: "De federado de Roma pasó a rey de su propia tierra.",
      },
      fieles: {
        t: "Fieles hasta el final",
        d: "Sirves a Roma mientras Roma exista.",
        ep: "Fue fiel a Roma cuando ya nadie lo era.",
      },
      patricio: {
        t: "Patricio de Roma",
        d: "Un manto romano sobre hombros bárbaros.",
        ep: "Gobernó con manto de patricio romano y espada de bárbaro.",
      },
    },
  },

  /* ---------- III. Los federados (Occidente, Oriente) ---------- */
  {
    id: "federados",
    t: "Los federados",
    para: (f) => f === 0 || f === 1,
    caps: [
      {
        id: "fed1",
        t: "Pueblos a las puertas",
        y: 414,
        max: 440,
        prep: (c) => {
          c.pueblo = pick(["los suevos", "los alanos", "los gépidos", "los ostrogodos", "los burgundios"]);
          c.rio = c.f === 0 ? "Rin" : "Danubio";
          c.pf = narFrontera(c);
        },
        d: (c) =>
          `Al otro lado del ${c.rio}, miles de familias —${c.pueblo}— esperan en la orilla con sus carros y sus rebaños. Su rey pide tierra a cambio de espadas. Si se le niega, dicen, cruzará igualmente cuando el río se hiele.`,
        o: [
          {
            t: "Asentarlos como federados",
            tip: (c) => `+4 infantería y +1 caballería; −5 orden en ${c.pf.name} (8 años)`,
            ef: (c) => {
              narTropa(c.cap, "i", 4);
              narTropa(c.cap, "c", 1);
              narEf(c.f, "orden", -5, 8, "Federados en " + c.pf.name, c.pf.id);
              narMk(c.f, "fed_p", c.pf.id);
            },
            leg: { sa: 2 },
            mk: "federados",
            cr: (c) => `${narTit(c.r)} asienta a ${c.pueblo} como federados junto a ${c.pf.name}.`,
          },
          {
            t: "Asentarlos, pero tomar rehenes",
            req: (c) => narStat(c.r, "in", 5),
            tip: "+3 infantería",
            ef: (c) => {
              narTropa(c.cap, "i", 3);
              narMk(c.f, "fed_p", c.pf.id);
            },
            leg: { sa: 3, cr: 1 },
            mk: "federados_rehenes",
          },
          {
            t: "Cerrar el río",
            prob: (c) => 0.4 + Math.min(0.35, tot(c.pf.u) * 0.03),
            px: (c) => `según la guarnición de ${c.pf.name}`,
            si: () => "Las legiones queman las barcas. Los bárbaros se retiran... hacia otro reino.",
            no: (c) => {
              narOrden(c.f, -15, c.pf);
              narTropa(c.pf, "i", -2);
              return `Cruzan de noche sobre el hielo: −15 orden y −2 infantería en ${c.pf.name}.`;
            },
            leg: { gl: 4 },
            fin: "rio",
          },
        ],
      },
      {
        id: "fed2",
        t: "El hambre de los federados",
        tras: 6,
        ok: (c) => narHay(c.f, "federados", "federados_rehenes"),
        prep: (c) => {
          const q = G.P[c.N.mk.fed_p];
          c.pf = q && q.owner === c.f ? q : c.p;
        },
        d: (c) =>
          `Los federados acampan junto a <b>${c.pf.name}</b> y pasan hambre. Los oficiales imperiales les venden carne de perro a precio de oro y se llevan a sus hijos como esclavos a cambio. Sus capitanes piden justicia; los más jóvenes, venganza.`,
        o: [
          {
            t: "Darles grano de los almacenes",
            coste: { comida: 20 },
            tip: (c) => `+3 orden en ${c.pf.name} durante 8 años`,
            ef: (c) => narEf(c.f, "orden", 3, 8, "Federados integrados", c.pf.id),
            leg: { pi: 4 },
            fin: "integrados",
          },
          {
            t: "Juzgar a los oficiales corruptos",
            req: (c) => narStat(c.r, "ge", 4),
            coste: { oro: 20 },
            tip: "+5 orden",
            ef: (c) => narOrden(c.f, 5),
            leg: { sa: 5 },
            fin: "justicia",
            cr: (c) =>
              `${narTit(c.r)} hace azotar a los oficiales que vendían carne de perro a los federados.`,
          },
          {
            t: "Que se aguanten",
            prob: (c) => (narTiene(c.f, "federados_rehenes") ? 0.7 : 0.4),
            px: "la paciencia de los bárbaros (mayor con rehenes)",
            si: () => "Aguantan. Por ahora.",
            no: (c) => {
              narOrden(c.f, -30, c.pf);
              narTropa(c.pf, "i", -3);
              return `Los federados se alzan junto a ${c.pf.name}: −30 orden y −3 infantería. Los viejos recuerdan Adrianópolis.`;
            },
            leg: { cr: 3 },
            fin: (c, ok) => (ok ? "sometidos" : "adrianopolis"),
          },
        ],
      },
    ],
    fines: {
      rio: {
        t: "El río cerrado",
        d: "Ningún bárbaro se asienta en tus tierras.",
        ep: "Cerró el río a los pueblos que llamaban a sus puertas.",
      },
      integrados: {
        t: "Nuevos súbditos",
        d: "Los federados aprenden tu lengua.",
        ep: "Dio pan a los federados, y sus nietos fueron súbditos leales.",
      },
      justicia: {
        t: "Justicia para los bárbaros",
        d: "Hasta los federados alaban tus leyes.",
        ep: "Hizo justicia a los bárbaros contra sus propios funcionarios.",
      },
      sometidos: {
        t: "Federados sometidos",
        d: "Los federados callan, pero no olvidan.",
        ep: "Tuvo a los federados sometidos por el hambre y el miedo.",
      },
      adrianopolis: {
        t: "Otra Adrianópolis",
        d: "Los federados se alzaron contra ti.",
        ep: "Los federados que despreció se alzaron contra él, como en Adrianópolis.",
      },
    },
  },

  /* ---------- IV. El azote de Dios (todos menos los hunos) ---------- */
  {
    id: "azote",
    t: "El azote de Dios",
    para: (f) => f !== 3 && alive(3),
    finDef: (c) =>
      narTiene(c.f, "catalaunicos")
        ? "vencedores"
        : narTiene(c.f, "pacto_huno")
          ? "complices"
          : narTiene(c.f, "tributo")
            ? "tributarios"
            : "testigos",
    caps: [
      {
        id: "az1",
        t: "Rumores de la estepa",
        y: 430,
        max: 450,
        cad: (c) => (!alive(3) ? "testigos" : null),
        d: () =>
          `Los mercaderes que vuelven del Danubio hablan de un nuevo señor entre los hunos, ${narTit(ruler(3))}, que ha unido a las tribus con oro y con miedo. Dicen que sus jinetes duermen sobre el caballo y que las ciudades se rinden con solo oír su nombre.`,
        o: [
          {
            t: "Reforzar las murallas",
            coste: { oro: 40 },
            tip: "+8% al defender durante 10 años",
            ef: (c) => narEf(c.f, "batalla", 0.08, 10, "Murallas contra el Azote", null, "defensor"),
            leg: { sa: 2 },
          },
          {
            t: "Enviar espías a su corte",
            req: (c) => narStat(c.r, "in", 4),
            prob: (c) => 0.35 + c.r.in * 0.06,
            px: (c) => `según la intriga de ${c.r.n}`,
            si: (c) => {
              narEf(c.f, "batalla", 0.05, 8, "Espías en la estepa");
              return "Tus espías vuelven con mapas de sus caminos y los nombres de sus capitanes (+5% en batalla, 8 años).";
            },
            no: (c) => {
              relAdd(c.f, 3, -10);
              return "Tus espías vuelven en un saco, atados a la silla de un caballo.";
            },
            leg: { sa: 2 },
          },
          { t: "No temer a unos pastores a caballo", leg: { gl: 2 } },
        ],
      },
      {
        id: "az2",
        t: "La embajada del Azote",
        y: 436,
        tras: 3,
        max: 452,
        cad: (c) => (!alive(3) ? "testigos" : null),
        ok: (c) => alive(3) && G.st[3][c.f] !== "alianza",
        d: () =>
          "Los embajadores hunos no desmontan para hablar. Exigen oro cada año, la entrega de los fugitivos que se refugian en tus tierras y un mercado libre en la frontera. «Detrás de nosotros», dice el más viejo, «viene el Azote de Dios».",
        o: [
          {
            t: "Pagar el tributo",
            coste: { oro: 70 },
            tip: "+30 relación con los hunos",
            ef: (c) => relAdd(c.f, 3, 30),
            leg: { sa: 1 },
            mk: "tributo",
            cr: (c) => `${narTit(c.r)} paga tributo a los hunos. La frontera queda en silencio.`,
          },
          {
            t: "Negarse",
            tip: "−30 relación con los hunos",
            ef: (c) => relAdd(c.f, 3, -30),
            prob: 0.55,
            px: "¿mirará el Azote hacia otra parte?",
            si: () => "El Azote mira hacia otro reino... por ahora.",
            no: (c) => {
              if (G.st[3][c.f] !== "guerra") declareWar(3, c.f);
              return "Antes de la luna nueva, los jinetes hunos cruzan la frontera.";
            },
            leg: { gl: 5 },
          },
          {
            t: "Agasajar a los embajadores",
            req: (c) => narStat(c.r, "di", 6),
            prob: (c) => 0.35 + c.r.di * 0.06,
            px: (c) => `según la diplomacia de ${c.r.n}`,
            si: (c) => {
              relAdd(c.f, 3, 15);
              return "Se van con regalos menores y la palabra de que no habrá guerra este año.";
            },
            no: (c) => {
              relAdd(c.f, 3, -15);
              return "Los hunos toman los halagos por miedo. El miedo, para ellos, es una invitación.";
            },
            leg: { sa: 2 },
          },
        ],
      },
      {
        id: "az3",
        t: "Los Campos Cataláunicos",
        y: 451,
        tras: 2,
        max: 460,
        cad: (c) => (!alive(3) ? "testigos" : null),
        ok: () => alive(3),
        d: (c) =>
          c.f === 0
            ? "El Azote ha cruzado el Rin. Tu magister militum reúne en la Galia lo que puede: legiones, godos, francos, alanos y burgundios. En una llanura junto al Marne se decidirá si Occidente será de la estepa, y te pide tus mejores tropas."
            : "Un general romano reúne a godos, francos, alanos y romanos contra los hunos. Te pide hombres: en una llanura de la Galia, los Campos Cataláunicos, se decidirá si el mundo será de la estepa.",
        o: [
          {
            t: "Enviar tus mejores tropas",
            req: (c) => narReq(tot(c.cap.u) >= 5, "hacen falta 5 soldados en la capital"),
            tip: "−3 infantería y −2 caballería de la capital",
            ef: (c) => {
              narTropa(c.cap, "i", -3);
              narTropa(c.cap, "c", -2);
            },
            prob: (c) => 0.55 + c.N.leg.gl * 0.002,
            px: "según la gloria de tus armas",
            si: (c) => {
              for (let g = 0; g < NF; g++) if (g !== c.f && g !== 3) relAdd(c.f, g, 8);
              relAdd(c.f, 3, -30);
              narEf(c.f, "batalla", 0.06, 8, "Vencedores de los Campos Cataláunicos");
              narLeg(c.f, { gl: 6 });
              narMk(c.f, "catalaunicos");
              return "La línea huna se rompe al caer la tarde. Tus guerreros vuelven cubiertos de gloria (+6% en batalla durante 8 años).";
            },
            no: () => "La batalla termina sin vencedor. Tus hombres vuelven pocos y cuentan horrores.",
            leg: { gl: 4 },
          },
          {
            t: "Mantenerse al margen",
            tip: (c) => (c.f !== 0 && alive(0) ? "−10 relación con Occidente" : ""),
            ef: (c) => {
              if (c.f !== 0 && alive(0)) relAdd(c.f, 0, -10);
            },
            leg: { sa: 2 },
          },
          {
            t: "Pactar en secreto con el Azote",
            vis: (c) => c.f !== 0,
            tip: "+40 oro, +30 relación con los hunos, −20 con Occidente",
            ef: (c) => {
              OC.ganar(c.f, { oro: 40 });
              relAdd(c.f, 3, 30);
              if (alive(0)) relAdd(c.f, 0, -20);
            },
            leg: { cr: 4 },
            mk: "pacto_huno",
            cr: (c) => `${narTit(c.r)} cobra oro huno mientras otros reinos mueren en la llanura.`,
          },
        ],
      },
      {
        id: "az4",
        t: "La noche de Ildico",
        y: 453,
        tras: 1,
        max: 470,
        cad: (c) => (!alive(3) ? narVal(c.arc.finDef, c) : null),
        ok: () => alive(3) && !human(3),
        al: (c) => {
          const m = narMundo();
          if (m.ildico == null) {
            m.ildico = G.year;
            const hr = ruler(3);
            if (hr && hr.age >= 35) {
              m.ildicoN = hr.n;
              kill(hr, "muere en su noche de bodas, ahogado en su propia sangre");
            }
          }
          c.muerto = m.ildicoN || null;
        },
        d: (c) =>
          c.muerto
            ? `Llega la noticia al amanecer: ${c.muerto}, el Azote de Dios, ha muerto la noche de su boda con una muchacha germana llamada Ildico. Dicen que la sangre le brotó de la nariz mientras dormía ebrio. Sus hijos ya se disputan el reino.`
            : "Llegan noticias de la estepa: la boda de un señor huno con una muchacha germana llamada Ildico terminó a cuchilladas entre hermanos. El reino del Azote se agrieta.",
        o: [
          {
            t: "Dar gracias al cielo",
            tip: "+4 orden",
            ef: (c) => narOrden(c.f, 4),
            leg: { pi: 4 },
          },
          {
            t: "Enviar embajadores a sus herederos",
            tip: "+25 relación con los hunos",
            ef: (c) => relAdd(c.f, 3, 25),
            leg: { sa: 3 },
          },
          {
            t: "Caer sobre ellos mientras se dividen",
            tip: "guerra con los hunos; +10% en batalla durante 3 años",
            ef: (c) => {
              if (G.st[c.f][3] !== "guerra") declareWar(c.f, 3);
              narEf(c.f, "batalla", 0.1, 3, "Los hunos, divididos");
            },
            leg: { gl: 5 },
          },
        ],
      },
    ],
    fines: {
      vencedores: {
        t: "Los Campos Cataláunicos",
        d: "Estuviste en la llanura donde se detuvo al Azote.",
        ep: "Cuando el Azote de Dios avanzó sobre Occidente, sus guerreros estuvieron en la llanura donde se le detuvo.",
      },
      complices: {
        t: "El pacto con la estepa",
        d: "Cobraste el oro del Azote mientras otros morían.",
        ep: "Pactó con el Azote de Dios cuando otros morían frente a él, y los demás reinos no lo olvidaron.",
      },
      tributarios: {
        t: "La paz comprada",
        d: "Pagaste para que los jinetes miraran a otra parte.",
        ep: "Compró al Azote la paz con oro, y sus campos no ardieron.",
      },
      testigos: {
        t: "Tiempos del Azote",
        d: "Viste pasar la tormenta huna y sobreviviste.",
        ep: "Vio pasar la tormenta de los hunos y sobrevivió a ella.",
      },
    },
  },

  /* ---------- V. Un solo arco (hunos) ---------- */
  {
    id: "atila",
    t: "Un solo arco",
    para: (f) => f === 3,
    finDef: (c) => (narTiene(c.f, "fratricidio") ? "unsolo" : narTiene(c.f, "espada") ? "espada" : "estepa"),
    caps: [
      {
        id: "at1",
        t: "Dos señores para un pueblo",
        y: 425,
        prep: (c) => {
          c.pj = pick(narAdultos(c.f, (x) => x.sex === "m" && x.id !== c.F.heir)) || null;
        },
        d: (c) =>
          `El pueblo huno tiene dos señores: ${narTit(c.r)} y ${c.pj ? narB(c.pj) : "su primo Bleda"}, que comparte el mando de las tribus y el reparto del oro. Los chamanes dicen que un arco no puede tener dos cuerdas.`,
        o: [
          {
            t: "Matarlo en una cacería",
            tip: (c) => `${c.pj ? c.pj.n + " morirá; " : ""}+8% en batalla durante 8 años`,
            ef: (c) => {
              if (c.pj) kill(c.pj, "muere en una cacería, alcanzado por una flecha perdida");
              narEf(c.f, "batalla", 0.08, 8, "Un solo señor");
            },
            leg: { cr: 8, gl: 3 },
            mk: "fratricidio",
            cr: (c) =>
              `${c.pj ? c.pj.n : "Bleda"} muere en una cacería. Desde hoy, los hunos tienen un solo señor.`,
          },
          {
            t: "Compartir el poder",
            tip: "+4 orden durante 8 años",
            ef: (c) => narEf(c.f, "orden", 4, 8, "Dos señores"),
            leg: { sa: 3, pi: 2 },
          },
          {
            t: "Darle el ala occidental del ejército",
            vis: (c) => !!c.pj,
            tip: (c) => `${c.pj.n} será general en la frontera (+1 mando)`,
            ef: (c) => {
              const p = c.own.find((q) => foes(q, c.f).length && q.gen == null);
              if (p) {
                G.P.forEach((q) => {
                  if (q.gen === c.pj.id) q.gen = null;
                });
                p.gen = c.pj.id;
              }
              c.pj.ma = Math.min(10, c.pj.ma + 1);
            },
            leg: { gl: 2 },
          },
        ],
      },
      {
        id: "at2",
        t: "La espada del dios",
        y: 434,
        tras: 3,
        d: () =>
          "Un pastor vio cojear a una novilla y, siguiendo el rastro de sangre, desenterró una espada antigua. Los ancianos dicen que es la espada del dios de la guerra, perdida hace siglos, y que quien la empuñe será señor del mundo.",
        o: [
          {
            t: "Empuñarla ante el pueblo",
            tip: "+5 orden durante 10 años",
            ef: (c) => narEf(c.f, "orden", 5, 10, "La espada del dios"),
            leg: { gl: 8 },
            mk: "espada",
            cr: (c) => `${narTit(c.r)} alza la espada del dios de la guerra ante las tribus reunidas.`,
          },
          {
            t: "Ofrecerla a los chamanes",
            tip: "+3 orden durante 10 años",
            ef: (c) => narEf(c.f, "orden", 3, 10, "Ofrenda de la espada"),
            leg: { pi: 6 },
          },
          {
            t: "Fundirla: un hierro es un hierro",
            tip: "+15 oro",
            ef: (c) => OC.ganar(c.f, { oro: 15 }),
            leg: { sa: 3 },
          },
        ],
      },
      {
        id: "at3",
        t: "Oriente u Occidente",
        y: 441,
        tras: 3,
        d: (c) =>
          `Constantinopla paga, Rávena promete. Tus jinetes están inquietos y la hierba del verano se agota. ${narTit(c.r)} debe elegir hacia dónde mira el Azote.`,
        o: [
          {
            t: "Contra Constantinopla",
            vis: () => alive(1),
            tip: "guerra con Oriente; +8% en batalla durante 5 años",
            ef: (c) => {
              if (G.st[3][1] !== "guerra") declareWar(3, 1);
              narEf(c.f, "batalla", 0.08, 5, "Campaña de Oriente");
              if (alive(0)) relAdd(3, 0, 15);
            },
            leg: { gl: 5 },
          },
          {
            t: "Contra Rávena",
            vis: () => alive(0),
            tip: "guerra con Occidente; +8% en batalla durante 5 años",
            ef: (c) => {
              if (G.st[3][0] !== "guerra") declareWar(3, 0);
              narEf(c.f, "batalla", 0.08, 5, "Campaña de Occidente");
              if (alive(1)) relAdd(3, 1, 15);
            },
            leg: { gl: 5 },
          },
          {
            t: "Exigir tributo a ambos imperios",
            prob: (c) => 0.4 + c.r.di * 0.05,
            px: (c) => `según la diplomacia de ${c.r.n}`,
            si: (c) => {
              OC.ganar(c.f, { oro: 90 });
              return "Los dos imperios pagan, y se odian un poco más entre ellos: +90 oro.";
            },
            no: () => {
              relAdd(3, 0, -20);
              relAdd(3, 1, -20);
              return "Los dos imperios se ríen de tus embajadores. La risa les costará cara.";
            },
            leg: { cr: 3 },
          },
        ],
      },
      {
        id: "at4",
        t: "La noche de Ildico",
        y: 450,
        tras: 3,
        ok: (c) => c.r.age >= 38,
        d: (c) =>
          `${narTit(c.r)} toma una nueva esposa, una muchacha germana llamada Ildico. El banquete dura hasta el alba y el vino corre como el Danubio. Tu médico griego te mira con preocupación cada vez que alzas la copa.`,
        o: [
          {
            t: "Beber con tus guerreros hasta el alba",
            prob: (c) => clamp(0.85 - (c.r.age - 38) * 0.015, 0.45, 0.85),
            px: "según tu edad",
            si: () => "Despiertas al mediodía con la cabeza ardiendo y una leyenda más.",
            no: (c) => {
              kill(c.r, "muere en su noche de bodas, ahogado en su propia sangre");
              return "Ildico grita al alba. La sangre ha brotado de la nariz del Azote mientras dormía. Los guerreros se cortan las mejillas en señal de duelo.";
            },
            leg: { gl: 4 },
          },
          { t: "Retirarte temprano", leg: { sa: 3, gl: -2 } },
          { t: "Que un esclavo pruebe cada copa", tip: "a salvo", leg: { cr: 2 } },
        ],
      },
    ],
    fines: {
      unsolo: {
        t: "Un solo arco",
        d: "Los hunos tienen un solo señor.",
        ep: "Unió a las tribus con la sangre de su propia casa; desde entonces los hunos tuvieron un solo señor.",
      },
      espada: {
        t: "La espada del dios",
        d: "El mundo cree en la leyenda.",
        ep: "Empuñó la espada del dios de la guerra, y el mundo creyó la leyenda.",
      },
      estepa: {
        t: "Señores de la estepa",
        d: "Gobiernas como gobernaron tus padres: a caballo.",
        ep: "Gobernó la estepa como la habían gobernado sus padres: a caballo.",
      },
    },
  },

  /* ---------- VI. La querella de los obispos (cristianos) ---------- */
  {
    id: "obispos",
    t: "La querella de los obispos",
    para: (f) => narCristiano(f),
    caps: [
      {
        id: "ob1",
        t: (c) => (narFe(c.f) === "niceno" ? "El concilio de Éfeso" : "Los nicenos se pelean"),
        y: 431,
        max: 446,
        d: (c) =>
          narFe(c.f) === "niceno"
            ? `En Éfeso, los obispos se tiran de las barbas: Nestorio dice que María es madre de Cristo, no de Dios; Cirilo de Alejandría le llama hereje y ha llenado la ciudad de monjes con garrotes. Ambos esperan que ${narTit(c.r)} tome partido.`
            : "Los obispos nicenos se han reunido en Éfeso y se excomulgan unos a otros por una palabra griega. Tus obispos arrianos sonríen: quizá sea el momento de ganar almas entre los romanos de tus tierras.",
        o: [
          {
            vis: (c) => narFe(c.f) === "niceno",
            t: "Con Cirilo: María es Madre de Dios",
            tip: "+4 orden, +8 relación con los nicenos",
            ef: (c) => {
              narOrden(c.f, 4);
              relFe(c.f, "niceno", 8);
            },
            leg: { pi: 5 },
          },
          {
            vis: (c) => narFe(c.f) === "niceno",
            t: "Con Nestorio",
            tip: "+10 relación con Persia, que acoge a los nestorianos",
            ef: (c) => {
              if (c.f !== 6) relAdd(c.f, 6, 10);
              if (c.f !== 1) relAdd(c.f, 1, -10);
            },
            leg: { sa: 4 },
          },
          { vis: (c) => narFe(c.f) === "niceno", t: "Que los obispos se apañen", leg: { sa: 2 } },
          {
            vis: (c) => narFe(c.f) === "arriano",
            t: "Enviar misioneros arrianos",
            tip: "+3 orden, −8 relación con los nicenos",
            ef: (c) => {
              narOrden(c.f, 3);
              relFe(c.f, "niceno", -8);
            },
            leg: { pi: 4 },
          },
          {
            vis: (c) => narFe(c.f) === "arriano",
            t: "Proteger a los nicenos de tus tierras",
            tip: "+5 orden, +10 relación con los nicenos",
            ef: (c) => {
              narOrden(c.f, 5);
              relFe(c.f, "niceno", 10);
            },
            leg: { sa: 4 },
            mk: "tolerancia",
          },
          { vis: (c) => narFe(c.f) === "arriano", t: "Reírse de los romanos", leg: { cr: 1, gl: 1 } },
        ],
      },
      {
        id: "ob2",
        t: (c) => (narFe(c.f) === "niceno" ? "El latrocinio de Éfeso" : "El obispo de los romanos"),
        y: 449,
        tras: 3,
        d: (c) =>
          narFe(c.f) === "niceno"
            ? "Un segundo concilio en Éfeso ha terminado a palos: los monjes de Alejandría han apaleado al patriarca de Constantinopla hasta matarlo. El obispo de Roma no lo llama concilio, sino latrocinio. Las cartas se amontonan en tu mesa."
            : `El obispo niceno de ${c.p.name} predica cada domingo que tu fe es herejía y que tus guerreros arderán en el infierno. La iglesia está llena. Tus obispos arrianos exigen su cabeza.`,
        o: [
          {
            vis: (c) => narFe(c.f) === "niceno",
            t: "Condenar a los asesinos",
            tip: "+10 relación con Oriente",
            ef: (c) => {
              if (c.f !== 1) relAdd(c.f, 1, 10);
            },
            leg: { pi: 4 },
          },
          {
            vis: (c) => narFe(c.f) === "niceno",
            t: "Callar y pedir oro a ambos bandos",
            tip: "+40 oro",
            ef: (c) => OC.ganar(c.f, { oro: 40 }),
            leg: { cr: 2, pi: -3 },
          },
          {
            vis: (c) => narFe(c.f) === "arriano",
            t: "Desterrarle",
            tip: (c) => `−3 orden en ${c.p.name}, −8 relación con los nicenos`,
            ef: (c) => {
              narOrden(c.f, -3, c.p);
              relFe(c.f, "niceno", -8);
            },
            leg: { cr: 3 },
          },
          {
            vis: (c) => narFe(c.f) === "arriano",
            t: "Debatir con él en público",
            req: (c) => narStat(c.r, "di", 5),
            prob: (c) => 0.35 + c.r.di * 0.05,
            px: (c) => `según la diplomacia de ${c.r.n}`,
            si: (c) => {
              narOrden(c.f, 6);
              return "El obispo se queda sin argumentos ante la plebe. Los arrianos te llevan a hombros: +6 orden.";
            },
            no: (c) => {
              narOrden(c.f, -5, c.p);
              return `El obispo te humilla con citas de las Escrituras. En ${c.p.name} se ríen de ti: −5 orden.`;
            },
            leg: { sa: 4 },
          },
          { vis: (c) => narFe(c.f) === "arriano", t: "Dejarle predicar", leg: { sa: 1 } },
        ],
      },
      {
        id: "ob3",
        t: (c) => (narFe(c.f) === "niceno" ? "Calcedonia" : "Una fe para el reino"),
        y: 451,
        tras: 2,
        d: (c) =>
          narFe(c.f) === "niceno"
            ? "Seiscientos obispos reunidos en Calcedonia han decidido que Cristo tiene dos naturalezas en una sola persona. Egipto y Siria no lo aceptan, y sus monjes amenazan con el cisma. Tus súbditos esperan saber qué cree su soberano."
            : "Tus súbditos romanos son nicenos; tus guerreros, arrianos. Dos iglesias, dos obispos en cada ciudad, dos pueblos que no se casan entre sí. Los consejeros dicen que un reino no puede tener dos almas.",
        o: [
          {
            vis: (c) => narFe(c.f) === "niceno",
            t: "Abrazar Calcedonia",
            tip: "+3 orden durante 8 años, +10 relación con los nicenos",
            ef: (c) => {
              narEf(c.f, "orden", 3, 8, "Fe de Calcedonia");
              relFe(c.f, "niceno", 10);
            },
            leg: { pi: 5 },
            fin: "ortodoxia",
          },
          {
            vis: (c) => narFe(c.f) === "niceno",
            t: "Defender a los monofisitas",
            tip: "+5 orden durante 8 años, −15 relación con Oriente",
            ef: (c) => {
              narEf(c.f, "orden", 5, 8, "Monofisitas protegidos");
              if (c.f !== 1) relAdd(c.f, 1, -15);
            },
            leg: { sa: 3 },
            fin: "disidencia",
          },
          {
            vis: (c) => narFe(c.f) === "niceno",
            t: "Una fe y mil interpretaciones",
            req: (c) => narStat(c.r, "di", 5),
            tip: "+5% diplomacia durante 10 años",
            ef: (c) => narEf(c.f, "diplo", 0.05, 10, "Tolerancia religiosa"),
            leg: { sa: 5 },
            fin: "tolerancia",
          },
          {
            vis: (c) => narFe(c.f) === "arriano",
            t: "Convertirse al credo niceno",
            tip: "+6 orden durante 10 años; nicenos +20, arrianos −20",
            ef: (c) => {
              narConvertir(c.f, "niceno");
              relFe(c.f, "niceno", 20);
              relFe(c.f, "arriano", -20);
              narEf(c.f, "orden", 6, 10, "Un solo credo");
            },
            leg: { pi: 6 },
            fin: "conversion",
            cr: (c) => `${narTit(c.r)} abjura del arrianismo y abraza el credo de Nicea.`,
          },
          {
            vis: (c) => narFe(c.f) === "arriano",
            t: "Mantener la fe de los padres",
            leg: { pi: 4, gl: 2 },
            fin: "arrianos",
          },
          {
            vis: (c) => narFe(c.f) === "arriano",
            t: "Imponer el arrianismo a todos",
            tip: "−5 orden durante 8 años; −25 relación con los nicenos",
            ef: (c) => {
              narEf(c.f, "orden", -5, 8, "Persecución de los nicenos");
              relFe(c.f, "niceno", -25);
            },
            leg: { cr: 8 },
            fin: "imposicion",
          },
        ],
      },
    ],
    fines: {
      ortodoxia: {
        t: "La fe de Calcedonia",
        d: "Tu reino cree lo que creen los concilios.",
        ep: "Defendió la fe de Calcedonia y la Iglesia le contó entre los suyos.",
      },
      disidencia: {
        t: "Refugio de disidentes",
        d: "Los monjes perseguidos encuentran asilo en tu reino.",
        ep: "Dio asilo a los monjes que los concilios condenaban.",
      },
      tolerancia: {
        t: "Mil interpretaciones",
        d: "En tu reino nadie muere por una palabra griega.",
        ep: "En su reino nadie murió por una palabra griega, lo que entonces era mucho decir.",
      },
      conversion: {
        t: "Un solo credo",
        d: "Godos y romanos rezan ya en la misma iglesia.",
        ep: "Abrazó el credo de Nicea, y godos y romanos rezaron por fin en la misma iglesia.",
      },
      arrianos: {
        t: "La fe de los padres",
        d: "Tu pueblo sigue siendo arriano.",
        ep: "Mantuvo la fe arriana de sus padres, contra Roma y contra el siglo.",
      },
      imposicion: {
        t: "La fe impuesta",
        d: "Los nicenos rezan a escondidas.",
        ep: "Impuso su fe por la fuerza, y la fuerza no convenció a nadie.",
      },
    },
  },

  /* ---------- VII. El bautismo del rey (paganos) ---------- */
  {
    id: "bautismo",
    t: "El bautismo del rey",
    para: (f) => narFe(f) === "pagano",
    caps: [
      {
        id: "bau1",
        t: "La reina cristiana",
        y: 465,
        prep: (c) => {
          c.pj = c.sp;
        },
        d: (c) =>
          `${c.sp ? `${narB(c.sp)}, tu consorte, se ha hecho bautizar en secreto y` : "Un obispo de los romanos ha llegado a la corte y"} te habla cada noche de un dios que murió en una cruz y venció a la muerte. Tus guerreros se ríen; tus súbditos romanos, que son muchos, escuchan.`,
        o: [
          { t: "Escuchar sus palabras", leg: { sa: 2 }, mk: "escucha" },
          {
            t: "Permitir que bautice a tus hijos",
            vis: (c) => narHijos(c.f).length > 0,
            tip: "+5 relación con los nicenos",
            ef: (c) => relFe(c.f, "niceno", 5),
            leg: { pi: 3 },
            mk: "hijos_bautizados",
          },
          { t: "Prohibir ese culto en tu casa", leg: { gl: 2, cr: 2 }, fin: "paganos" },
        ],
      },
      {
        id: "bau2",
        t: "El voto",
        tras: 3,
        ok: (c) => narHay(c.f, "escucha", "hijos_bautizados"),
        d: (c) =>
          `La guerra se acerca y ${c.sp ? c.sp.n : "el obispo"} te pide un voto: si el dios de los cristianos te da la victoria en la próxima batalla, te harás bautizar. Tus dioses, dicen los viejos, no perdonan a quien duda.`,
        o: [
          { t: "Hacer el voto", tip: "la próxima victoria decidirá", leg: { pi: 2 }, mk: "voto" },
          { t: "No hacer votos a dioses ajenos", leg: { gl: 2 }, fin: "paganos" },
        ],
      },
      {
        id: "bau3",
        t: "El bautismo",
        tras: 1,
        ok: (c) => narTiene(c.f, "voto_cumplido"),
        cad: (c) => (narDesde(c.f, "voto") > 8 && !narTiene(c.f, "voto_cumplido") ? "voto_vano" : null),
        d: (c) =>
          `Vencidos tus enemigos, ${c.sp ? c.sp.n : "el obispo"} te recuerda tu voto. En la catedral esperan el agua, el óleo y tres mil guerreros dispuestos a seguirte a la pila. «Inclina la cabeza, fiero guerrero», dice el obispo. «Adora lo que quemaste y quema lo que adoraste.»`,
        o: [
          {
            t: "Bautizarse en la fe nicena",
            tip: "+6 orden durante 10 años; nicenos +20, paganos −10",
            ef: (c) => {
              narConvertir(c.f, "niceno");
              relFe(c.f, "niceno", 20);
              relFe(c.f, "pagano", -10);
              narEf(c.f, "orden", 6, 10, "Bautismo del rey");
            },
            leg: { pi: 10 },
            fin: "bautismo",
            cr: (c) => `${narTit(c.r)} se bautiza en la fe nicena con tres mil de sus guerreros.`,
          },
          {
            t: "Bautizarse en la fe arriana, como los godos",
            tip: "arrianos +20",
            ef: (c) => {
              narConvertir(c.f, "arriano");
              relFe(c.f, "arriano", 20);
            },
            leg: { pi: 6 },
            fin: "arriano",
          },
          { t: "Faltar a tu palabra", leg: { cr: 3, pi: -5, gl: 1 }, fin: "perjuro" },
        ],
      },
    ],
    fines: {
      paganos: {
        t: "Los viejos dioses",
        d: "Tu pueblo sigue rezando en los bosques.",
        ep: "Se mantuvo fiel a los viejos dioses cuando el mundo entero cambiaba de fe.",
      },
      bautismo: {
        t: "El bautismo del rey",
        d: "El rey y su pueblo son ya cristianos de Nicea.",
        ep: "Se bautizó con tres mil guerreros, y su pueblo entró en la Iglesia de Roma.",
      },
      arriano: {
        t: "Cristianos a la manera goda",
        d: "Tu pueblo es ahora arriano.",
        ep: "Abrazó la fe de Cristo a la manera de los godos, y Roma nunca se lo perdonó del todo.",
      },
      perjuro: {
        t: "El voto roto",
        d: "Prometiste y no cumpliste.",
        ep: "Prometió el bautismo a cambio de una victoria, y cuando la tuvo, olvidó la promesa.",
      },
      voto_vano: {
        t: "El voto en vano",
        d: "La victoria nunca llegó.",
        ep: "Hizo un voto al dios de los cristianos, pero la victoria prometida nunca llegó.",
      },
    },
  },

  /* ---------- VIII. El basileus (Oriente) ---------- */
  {
    id: "oriente",
    t: "La púrpura de Oriente",
    para: (f) => f === 1,
    caps: [
      {
        id: "or1",
        t: "La paz de los cien años",
        y: 422,
        max: 432,
        ok: () => alive(6),
        d: () =>
          `Los embajadores de ${narTit(ruler(6))} proponen una paz eterna entre Roma y Persia: cada imperio defenderá su lado del Cáucaso contra los nómadas, y los cristianos de Persia no serán perseguidos.`,
        o: [
          {
            t: "Firmar la paz eterna",
            tip: "+30 relación con Persia, +5 oro al año (10 años)",
            ef: (c) => {
              if (G.st[1][6] === "guerra") makePeace(1, 6);
              relAdd(1, 6, 30);
              narEf(c.f, "oro", 5, 10, "Comercio con Persia");
            },
            leg: { sa: 4 },
            mk: "paz_eterna",
            cr: () => "Roma y Persia firman una paz que, dicen los embajadores, durará cien años.",
          },
          {
            t: "Exigir oro por los pasos del Cáucaso",
            prob: (c) => 0.35 + c.r.di * 0.05,
            px: (c) => `según la diplomacia de ${c.r.n}`,
            si: (c) => {
              OC.ganar(c.f, { oro: 60 });
              relAdd(1, 6, -5);
              return "Persia paga, entre dientes: +60 oro.";
            },
            no: () => {
              relAdd(1, 6, -20);
              return "El shahanshah rompe la carta y la arroja al fuego sagrado.";
            },
            leg: { sa: 1, gl: 1 },
          },
          {
            t: "Persia es el enemigo eterno",
            tip: "−20 relación con Persia, +5% en batalla durante 6 años",
            ef: (c) => {
              relAdd(1, 6, -20);
              narEf(c.f, "batalla", 0.05, 6, "Guerra eterna");
            },
            leg: { gl: 5 },
          },
        ],
      },
      {
        id: "or2",
        t: "Las murallas de Teodosio",
        tras: 3,
        y: 447,
        d: (c) =>
          `Un terremoto ha derribado cincuenta y siete torres de las murallas de ${c.cap.name}, y se dice que los hunos ya lo saben. El prefecto propone movilizar a las facciones del hipódromo, azules y verdes, para reconstruirlas en sesenta días.`,
        o: [
          {
            t: "Reconstruirlas con las facciones",
            coste: { oro: 50 },
            tip: "+15% al defender durante 15 años, +6 orden en la capital",
            ef: (c) => {
              narEf(c.f, "batalla", 0.15, 15, "Murallas de Teodosio", null, "defensor");
              narOrden(c.f, 6, c.cap);
            },
            leg: { sa: 3, gl: 2 },
            mk: "murallas",
            cr: (c) => `Azules y verdes reconstruyen juntos las murallas de ${c.cap.name} en sesenta días.`,
          },
          {
            t: "Reconstruirlas con esclavos y prisa",
            coste: { oro: 25 },
            tip: "+8% al defender durante 10 años",
            ef: (c) => narEf(c.f, "batalla", 0.08, 10, "Murallas a toda prisa", null, "defensor"),
            leg: { cr: 3 },
          },
          { t: "Confiar en Dios y en la flota", leg: { pi: 3 } },
        ],
      },
      {
        id: "or3",
        t: "Azules y verdes",
        tras: 4,
        y: 532,
        d: (c) =>
          `En el hipódromo, la facción de los verdes ha abucheado a ${narTit(c.r)} y los azules han respondido con cuchillos. La ciudad arde por tres barrios. Los dos bandos, unidos de pronto, gritan «¡Niká!» y alguien ha proclamado a otro emperador.`,
        o: [
          {
            t: "Encerrarlos en el hipódromo y soltar a la guardia",
            tip: "+15 orden en la capital, +3 orden durante 10 años",
            ef: (c) => {
              narOrden(c.f, 15, c.cap);
              narEf(c.f, "orden", 3, 10, "El silencio del hipódromo");
            },
            leg: { cr: 10, gl: 2 },
            fin: "masacre",
            cr: (c) => `Treinta mil muertos en el hipódromo de ${c.cap.name}. La revuelta termina.`,
          },
          {
            t: "Negociar con los cabecillas",
            req: (c) => narStat(c.r, "di", 5),
            prob: (c) => 0.35 + c.r.di * 0.05,
            px: (c) => `según la diplomacia de ${c.r.n}`,
            si: (c) => {
              narOrden(c.f, 8, c.cap);
              return "Los cabecillas aceptan perdones y cargos. El usurpador es entregado atado: +8 orden.";
            },
            no: (c) => {
              narOrden(c.f, -15, c.cap);
              narLeg(c.f, { gl: -4 });
              return "Los cabecillas toman la oferta por miedo. La revuelta dura semanas: −15 orden en la capital.";
            },
            leg: { sa: 5 },
            fin: (c, ok) => (ok ? "concordia" : "huida"),
          },
          {
            t: (c) => (c.sp ? `Escuchar a ${c.sp.n}` : "Huir en la flota"),
            tip: (c) => (c.sp ? "«La púrpura es una buena mortaja»" : "−10 orden en la capital"),
            ef: (c) => {
              if (c.sp) narOrden(c.f, 10, c.cap);
              else narOrden(c.f, -10, c.cap);
              return c.sp
                ? `${c.sp.n} se niega a huir: «La púrpura es una buena mortaja». Su firmeza devuelve el valor a la guardia, y la revuelta se ahoga en sangre.`
                : "Huyes en la flota. La ciudad se calma sola, pero nadie olvida que te fuiste.";
            },
            ver: true,
            leg: { gl: 4 },
            fin: (c) => (c.sp ? "purpura" : "huida"),
          },
        ],
      },
    ],
    fines: {
      masacre: {
        t: "El silencio del hipódromo",
        d: "Nadie volverá a abuchear al emperador.",
        ep: "Ahogó en sangre la revuelta del hipódromo, y nadie volvió a gritar «¡Niká!».",
      },
      concordia: {
        t: "La concordia de las facciones",
        d: "Azules y verdes vuelven a las carreras.",
        ep: "Calmó a azules y verdes con palabras, que es más difícil que con espadas.",
      },
      huida: {
        t: "La huida",
        d: "El emperador huyó y la ciudad lo recuerda.",
        ep: "Huyó cuando ardía la ciudad, y la ciudad se lo recordó siempre.",
      },
      purpura: {
        t: "La púrpura es una buena mortaja",
        d: "Tu consorte salvó el trono.",
        ep: "Cuando todo parecía perdido, su consorte se negó a huir, y el trono se salvó.",
      },
    },
  },

  /* ---------- IX. El trono de los reyes de reyes (Persia) ---------- */
  {
    id: "persia",
    t: "El trono de los reyes de reyes",
    para: (f) => f === 6,
    caps: [
      {
        id: "pe1",
        t: "Los cristianos de Persia",
        y: 421,
        d: (c) =>
          `Los magos del fuego sagrado exigen que se cierre la iglesia de ${c.cap.name}: dicen que los cristianos son espías de Constantinopla. Su patriarca, en cambio, jura lealtad a ${narTit(c.r)} y no al emperador de Roma.`,
        o: [
          {
            t: "Perseguirlos, como piden los magos",
            tip: "+3 orden, −20 relación con Oriente",
            ef: (c) => {
              narOrden(c.f, 3);
              relAdd(6, 1, -20);
            },
            leg: { pi: 5, cr: 4 },
          },
          {
            t: "Protegerlos si se separan de Roma",
            tip: "+3 orden durante 10 años",
            ef: (c) => {
              narEf(c.f, "orden", 3, 10, "Iglesia de Oriente");
              relAdd(6, 1, 5);
            },
            leg: { sa: 5 },
            mk: "iglesia_persa",
            cr: () => "Los cristianos de Persia rompen con Constantinopla y juran lealtad al shahanshah.",
          },
          {
            t: "Proteger a todos los credos",
            req: (c) => narStat(c.r, "di", 5),
            tip: "+15 relación con Oriente, −3 orden",
            ef: (c) => {
              relAdd(6, 1, 15);
              narOrden(c.f, -3);
            },
            leg: { sa: 3, pi: -2 },
          },
        ],
      },
      {
        id: "pe2",
        t: "Los heftalitas",
        tras: 3,
        y: 476,
        prep: (c) => {
          c.pj = pick(narAdultos(c.f, (x) => x.sex === "f" && x.sp == null && x.age <= 30)) || null;
        },
        d: () =>
          "Por el este, más allá de Merv, los hunos blancos —los heftalitas— cruzan el Oxo. No saquean como bárbaros: exigen tributo como reyes, y sus arqueros no fallan.",
        o: [
          { t: "Pagar tributo", coste: { oro: 60 }, leg: { sa: 2 } },
          {
            t: "Marchar contra ellos",
            req: (c) => narReq(c.cap.u.c >= 2, "hacen falta 2 jinetes en la capital"),
            prob: (c) => 0.45 + c.r.ma * 0.04,
            px: (c) => `según el mando de ${c.r.n}`,
            si: (c) => {
              OC.ganar(c.f, { oro: 40 });
              narEf(c.f, "batalla", 0.05, 8, "Vencedores de los heftalitas");
              narLeg(c.f, { gl: 4 });
              return "Los heftalitas huyen más allá del Oxo dejando su campamento: +40 oro, +5% en batalla.";
            },
            no: (c) => {
              narTropa(c.cap, "c", -3);
              narTropa(c.cap, "i", -2);
              return "El ejército cae en una trampa de zanjas cubiertas con ramas. Vuelven muy pocos.";
            },
            leg: { gl: 4 },
          },
          {
            t: (c) => `Casar a ${c.pj ? c.pj.n : "una princesa"} con su khan`,
            vis: (c) => !!c.pj,
            tip: "paz en el este; +4 oro al año durante 10 años",
            ef: (c) => {
              kill(c.pj, "parte hacia el este para casarse con el khan heftalita");
              narEf(c.f, "oro", 4, 10, "Paz con los heftalitas");
            },
            leg: { sa: 4 },
          },
        ],
      },
      {
        id: "pe3",
        t: "El profeta de los pobres",
        tras: 4,
        y: 490,
        d: () =>
          "Un predicador llamado Mazdak recorre las aldeas: dice que la tierra y el grano son de todos, como la luz del sol. Los campesinos le escuchan con lágrimas en los ojos; los grandes del reino afilan los cuchillos.",
        o: [
          {
            t: "Escucharle y repartir el grano de los nobles",
            tip: "+8 orden durante 10 años; los nobles conspiran",
            ef: (c) => {
              narEf(c.f, "orden", 8, 10, "Grano para los pobres");
              narMk(c.f, "conjura_viva");
            },
            leg: { pi: 3, sa: 3 },
            mk: "pe_reforma",
          },
          {
            t: "Entregarle a los nobles",
            tip: "+40 oro, −3 orden durante 6 años",
            ef: (c) => {
              OC.ganar(c.f, { oro: 40 });
              narEf(c.f, "orden", -3, 6, "Mazdak traicionado");
            },
            leg: { cr: 6 },
            mk: "pe_nobles",
          },
          {
            t: "Usarlo contra los nobles y luego eliminarlo",
            req: (c) => narStat(c.r, "in", 6),
            tip: "+60 oro",
            ef: (c) => OC.ganar(c.f, { oro: 60 }),
            leg: { cr: 3, sa: 3 },
            mk: "pe_astucia",
          },
        ],
      },
      {
        id: "pe4",
        t: "El rey de alma inmortal",
        y: 531,
        tras: 5,
        d: (c) =>
          `Los grandes del reino llaman ya a ${narTit(c.r)} «el de alma inmortal». Los consejeros proponen medir de nuevo todas las tierras y fijar un impuesto justo; los generales, aprovechar que Roma mira a Occidente para tomar Antioquía.`,
        o: [
          {
            t: "Medir las tierras y fijar el impuesto",
            req: (c) => narStat(c.r, "ge", 4),
            tip: "+7 oro al año durante 15 años",
            ef: (c) => narEf(c.f, "oro", 7, 15, "El catastro del rey"),
            leg: { sa: 6 },
            fin: "catastro",
          },
          {
            t: "Marchar sobre Antioquía",
            vis: () => alive(1),
            tip: "guerra con Oriente; +60 oro de botín",
            ef: (c) => {
              if (G.st[6][1] !== "guerra") declareWar(6, 1);
              OC.ganar(c.f, { oro: 60 });
            },
            leg: { gl: 6, cr: 2 },
            fin: "antioquia",
          },
          {
            t: "Traducir los libros de la India y de Grecia",
            coste: { oro: 30 },
            tip: "+12% investigación durante 12 años",
            ef: (c) => narEf(c.f, "invest", 0.12, 12, "Escuela de Gundishapur"),
            leg: { sa: 5 },
            fin: "gundishapur",
          },
        ],
      },
    ],
    finDef: (c) =>
      narTiene(c.f, "pe_astucia") ? "astucia" : narTiene(c.f, "pe_reforma") ? "reforma" : "nobles",
    fines: {
      reforma: {
        t: "El grano de todos",
        d: "Los pobres bendicen tu nombre; los nobles lo maldicen.",
        ep: "Escuchó al profeta de los pobres y repartió el grano de los grandes.",
      },
      nobles: {
        t: "Los grandes del reino",
        d: "Mazdak murió y los nobles quedaron contentos.",
        ep: "Entregó al profeta de los pobres a los grandes del reino.",
      },
      astucia: {
        t: "El juego del rey",
        d: "Usaste al profeta y luego te deshiciste de él.",
        ep: "Usó al profeta contra los nobles y a los nobles contra el profeta, y ganó él.",
      },
      catastro: {
        t: "El impuesto justo",
        d: "Cada campo del reino tiene su medida y su tributo.",
        ep: "Midió cada campo del reino y fijó un impuesto que duró siglos.",
      },
      antioquia: {
        t: "El saqueo de Antioquía",
        d: "Antioquía ardió y sus artesanos marcharon a Persia.",
        ep: "Saqueó Antioquía y se llevó a sus artesanos a construir una ciudad nueva.",
      },
      gundishapur: {
        t: "La escuela de Gundishapur",
        d: "Médicos y sabios de tres mundos enseñan en tu reino.",
        ep: "Reunió en su escuela a los sabios de Grecia, de la India y de Persia.",
      },
    },
  },

  /* ---------- X. Las últimas águilas (Occidente) ---------- */
  {
    id: "aguilas",
    t: "Las últimas águilas",
    para: (f) => f === 0,
    caps: [
      {
        id: "ag1",
        t: "El último romano",
        y: 450,
        max: 468,
        prep: (c) => {
          c.pj = narAdultos(c.f, (x) => x.ma >= 5 && x.id !== c.F.heir).sort((a, b) => b.ma - a.ma)[0];
          if (!c.pj) return false;
          c.hija = narHijos(c.f).find((x) => x.sex === "f" && x.sp == null && x.age >= 16);
        },
        ok: (c) => narAdultos(c.f, (x) => x.ma >= 5 && x.id !== c.F.heir).length > 0,
        d: (c) =>
          `${narB(c.pj)} ha ganado tantas batallas que el pueblo le llama «el último de los romanos». Los eunucos de palacio susurran a ${narTit(c.r)} que un general así ya no necesita emperador.`,
        o: [
          {
            t: "Matarlo con tu propia mano",
            tip: (c) => `${c.pj.n} morirá`,
            ef: (c) => {
              kill(c.pj, "muere apuñalado en palacio por mano de su señor");
              return "«Has cortado tu mano derecha con la izquierda», te dice un senador al salir del salón.";
            },
            ver: true,
            leg: { cr: 10, gl: -3 },
            mk: "aecio_muerto",
          },
          {
            t: "Honrarle con el consulado",
            coste: { oro: 30 },
            tip: "+1 mando",
            ef: (c) => {
              c.pj.ma = Math.min(10, c.pj.ma + 1);
            },
            leg: { gl: 4 },
            mk: "aecio_vive",
          },
          {
            t: (c) => `Casarle con ${c.hija ? c.hija.n : "tu hija"}`,
            vis: (c) => !!c.hija && c.pj.sp == null && c.pj.sex === "m",
            tip: "lo atas a la familia",
            ef: (c) => marry(c.pj, c.hija),
            leg: { sa: 3, pi: 2 },
            mk: "aecio_familia",
          },
        ],
      },
      {
        id: "ag2",
        t: "El tercio de los federados",
        y: 472,
        tras: 3,
        d: (c) =>
          `Los mercenarios hérulos y esciros que guardan el reino exigen un tercio de las tierras, como se les dio a los godos. Su capitán, un tal Odoacro, espera la respuesta en el patio de ${c.cap.name} con la mano en la empuñadura.`,
        o: [
          {
            t: "Darles el tercio de las tierras",
            tip: "+4 infantería; −5 oro al año durante 10 años",
            ef: (c) => {
              narTropa(c.cap, "i", 4);
              narEf(c.f, "oro", -5, 10, "Tercio de los federados");
            },
            leg: { sa: 2 },
            mk: "ag_tercio",
          },
          {
            t: "Negarse",
            prob: (c) => 0.3 + Math.min(0.4, c.own.length * 0.04),
            px: "según el tamaño del imperio",
            si: () => "Odoacro duda, mira a tu guardia y se retira. Esta vez.",
            no: (c) => {
              const q = pick(c.own.filter((p) => p !== c.cap)) || c.cap;
              narOrden(c.f, -40, q);
              return `Los federados se alzan en ${q.name}: −40 orden. La provincia está a un paso de perderse.`;
            },
            leg: { gl: 4 },
            mk: (c, ok) => (ok ? "ag_resistencia" : "ag_odoacro"),
          },
          { t: "Pagarles con el tesoro", coste: { oro: 80 }, leg: { sa: 1 }, mk: "ag_oro" },
        ],
      },
      {
        id: "ag3",
        t: (c) => (c.own.length >= 8 ? "Renovatio imperii" : "Lo que queda de Roma"),
        y: 500,
        tras: 8,
        d: (c) =>
          c.own.length >= 8
            ? "Tus legiones han devuelto las águilas a ciudades que llevaban medio siglo sin verlas. En el Senado se habla de restaurar el imperio entero, de Britania a Mauritania, y alguien ha mandado acuñar monedas con la leyenda «Roma renace»."
            : "Del imperio de Occidente queda una corte, un Senado de ancianos y un nombre que todavía hace temblar a los bárbaros. Los consejeros piden a la casa reinante que decida qué será de la herencia de Roma.",
        o: [
          {
            t: "Proclamar la restauración del imperio",
            req: (c) => narReq(c.own.length >= 8, "necesitas al menos 8 provincias"),
            tip: "+4 orden durante 15 años, +8% en batalla durante 10",
            ef: (c) => {
              narEf(c.f, "orden", 4, 15, "Renovatio imperii");
              narEf(c.f, "batalla", 0.08, 10, "Las águilas vuelven");
            },
            leg: { gl: 10 },
            fin: "renovatio",
            cr: (c) => `${narTit(c.r)} proclama la restauración del imperio de Occidente.`,
          },
          {
            t: "Gobernar con prudencia lo que queda",
            tip: "+5 oro al año durante 10 años",
            ef: (c) => narEf(c.f, "oro", 5, 10, "Prudencia de Rávena"),
            leg: { sa: 5 },
          },
          {
            t: "Ceder la púrpura a Constantinopla",
            vis: () => alive(1),
            tip: "+40 relación con Oriente, +5% diplomacia (15 años)",
            ef: (c) => {
              relAdd(c.f, 1, 40);
              narEf(c.f, "diplo", 0.05, 15, "Vasallos de Constantinopla");
            },
            leg: { pi: 3, sa: 3 },
            fin: "vasallos",
          },
        ],
      },
    ],
    finDef: (c) =>
      narTiene(c.f, "ag_odoacro")
        ? "odoacro"
        : narTiene(c.f, "ag_tercio")
          ? "tercio"
          : narTiene(c.f, "ag_oro")
            ? "oro"
            : "resistencia",
    fines: {
      tercio: {
        t: "El tercio",
        d: "Los bárbaros tienen ya tierra en el corazón del imperio.",
        ep: "Dio a los mercenarios un tercio de la tierra, y el imperio siguió en pie un tiempo más.",
      },
      resistencia: {
        t: "Las águilas resisten",
        d: "Odoacro se retiró sin su tierra.",
        ep: "Se negó a entregar la tierra a los mercenarios, y las águilas siguieron volando.",
      },
      odoacro: {
        t: "La hora de Odoacro",
        d: "Los federados se alzaron contra el imperio.",
        ep: "Negó la tierra a Odoacro, y Odoacro la tomó por la fuerza.",
      },
      oro: {
        t: "Paz pagada",
        d: "El oro compró lo que la espada no podía.",
        ep: "Pagó a los mercenarios con el último oro del imperio.",
      },
      renovatio: {
        t: "Roma renace",
        d: "Las águilas vuelven a volar sobre Occidente.",
        ep: "Restauró el imperio de Occidente cuando todos lo daban por muerto.",
      },
      vasallos: {
        t: "La púrpura cedida",
        d: "Occidente obedece ya a Constantinopla.",
        ep: "Cedió la púrpura de Occidente a Constantinopla, y Roma fue una sola otra vez.",
      },
    },
  },

  /* ---------- XI. El mar de los vándalos ---------- */
  {
    id: "genserico",
    t: "El mar de los vándalos",
    para: (f) => f === 4,
    caps: [
      {
        id: "va1",
        t: "El paso del estrecho",
        y: 425,
        d: () =>
          "Desde las playas del sur se ve la costa de África: trigo, aceite, ciudades sin murallas y un conde romano en rebeldía que pide ayuda contra su propio emperador. Solo hace falta cruzar el estrecho.",
        o: [
          {
            t: "Construir la flota",
            coste: { oro: 50 },
            tip: "+8 oro al año durante 12 años",
            ef: (c) => narEf(c.f, "oro", 8, 12, "El trigo de África"),
            leg: { gl: 4 },
            mk: "flota",
            cr: (c) => `${narTit(c.r)} cruza el estrecho con todo su pueblo. África será vándala.`,
          },
          {
            t: "Aliarse con el conde rebelde",
            req: (c) => narStat(c.r, "in", 4),
            prob: (c) => 0.35 + c.r.in * 0.05,
            px: (c) => `según la intriga de ${c.r.n}`,
            si: (c) => {
              OC.ganar(c.f, { oro: 60 });
              narEf(c.f, "oro", 6, 12, "El trigo de África");
              return "El conde os abre los puertos y luego descubre que no os iréis nunca: +60 oro, +6 oro al año.";
            },
            no: (c) => {
              if (alive(0)) relAdd(c.f, 0, -15);
              return "El conde se reconcilia con Roma y te denuncia: −15 relación con Occidente.";
            },
            mk: (c, ok) => (ok ? "flota" : null),
            leg: { sa: 2 },
          },
          { t: "La tierra firme nos basta", leg: { sa: 1 }, fin: "tierra" },
        ],
      },
      {
        id: "va2",
        t: "Las naves ante Roma",
        tras: 4,
        y: 452,
        ok: (c) => narTiene(c.f, "flota"),
        cad: (c) => (!narTiene(c.f, "flota") && G.year > 470 ? "africa" : null),
        d: () =>
          `Tus naves fondean en Ostia. Roma, ya saqueada una vez, ${alive(0) ? "no tiene ejército que la defienda" : "no tiene ya emperador"}. Su obispo, un anciano llamado León, sale a tu encuentro descalzo y te pide que no incendies la ciudad ni derrames sangre.`,
        o: [
          {
            t: "Saquearla catorce días",
            tip: "+120 oro; −40 relación con Occidente",
            ef: (c) => {
              OC.ganar(c.f, { oro: 120 });
              if (alive(0)) relAdd(c.f, 0, -40);
              relFe(c.f, "niceno", -10);
            },
            leg: { cr: 8, gl: 5 },
            fin: "saqueo",
            cr: () =>
              "Roma es saqueada catorce días por los vándalos. El mundo inventará una palabra para eso.",
          },
          {
            t: "Saquearla sin fuego ni sangre",
            tip: "+70 oro; −15 relación con Occidente",
            ef: (c) => {
              OC.ganar(c.f, { oro: 70 });
              if (alive(0)) relAdd(c.f, 0, -15);
            },
            leg: { pi: 5, gl: 3 },
            fin: "leon",
          },
          {
            t: "Llevarse a la emperatriz y a sus hijas",
            tip: "+40 oro; una princesa romana para tu casa",
            ef: (c) => {
              OC.ganar(c.f, { oro: 40 });
              const e = mkChar(c.f, "f", ri(17, 22));
              e.n = "Eudocia de Roma";
              e.di = Math.min(10, e.di + 2);
              const h = c.h && c.h.sp == null && c.h.sex === "m" ? c.h : null;
              if (h) marry(h, e);
              if (alive(0)) relAdd(c.f, 0, -30);
              return h ? `${e.n} se casa con tu heredero ${h.n}.` : `${e.n} vivirá en tu corte.`;
            },
            ver: true,
            leg: { gl: 3, cr: 2 },
            fin: "rehenes",
          },
        ],
      },
    ],
    fines: {
      tierra: {
        t: "Tierra firme",
        d: "Tu pueblo no cruzó el mar.",
        ep: "No quiso cruzar el estrecho, y el mar fue de otros.",
      },
      saqueo: {
        t: "El saqueo de Roma",
        d: "Catorce días de saqueo.",
        ep: "Saqueó Roma catorce días, y su pueblo dio nombre a toda destrucción.",
      },
      leon: {
        t: "La palabra de León",
        d: "Saqueaste Roma, pero sin fuego ni sangre.",
        ep: "Escuchó al obispo León y saqueó Roma sin fuego ni sangre.",
      },
      rehenes: {
        t: "La princesa de Roma",
        d: "La sangre de los césares corre ya por tu casa.",
        ep: "Se llevó a una princesa de Roma, y la sangre de los césares corrió por su casa.",
      },
      africa: {
        t: "Reyes de África",
        d: "El mar fue vuestro, pero Roma quedó lejos.",
        ep: "Reinó en África sobre el trigo que antes alimentaba a Roma.",
      },
    },
  },

  /* ---------- XII. Las insignias del imperio (todos menos Occidente) ---------- */
  {
    id: "insignias",
    t: "Las insignias del imperio",
    para: (f) => f !== 0,
    caps: [
      {
        id: "in1",
        t: "Las insignias imperiales",
        y: 470,
        ok: () => !alive(0) || owned(0).length <= 2,
        d: (c) =>
          `Un senador de Roma llega a ${c.cap.name} con un cofre: dentro están la diadema y el manto de púrpura del último emperador de Occidente. «Ya no hay emperador en Occidente», dice. «Alguien debe guardarlas».`,
        o: [
          {
            t: "Enviarlas a Constantinopla",
            vis: (c) => c.f !== 1 && alive(1),
            tip: "+30 relación con Oriente",
            ef: (c) => relAdd(c.f, 1, 30),
            leg: { pi: 3, sa: 3 },
            fin: "oriente",
          },
          {
            t: (c) => `Guardarlas: ${CIV[c.f].s} es heredero de Roma`,
            vis: (c) => c.f !== 1,
            tip: "+3 orden durante 10 años",
            ef: (c) => {
              narEf(c.f, "orden", 3, 10, "Herederos de Roma");
              narMk(c.f, "heredero_roma");
              if (alive(1)) relAdd(c.f, 1, -15);
            },
            leg: { gl: 10 },
            fin: "herederos",
            cr: (c) => `${narTit(c.r)} guarda las insignias del último emperador de Occidente.`,
          },
          {
            t: "Recibirlas: el imperio vuelve a ser uno",
            vis: (c) => c.f === 1,
            tip: "+4 orden durante 10 años",
            ef: (c) => narEf(c.f, "orden", 4, 10, "Un solo imperio"),
            leg: { gl: 10, sa: 2 },
            fin: "unidad",
          },
          {
            t: "Fundirlas",
            tip: "+80 oro",
            ef: (c) => OC.ganar(c.f, { oro: 80 }),
            leg: { cr: 2, sa: -2 },
            fin: "fundidas",
          },
        ],
      },
    ],
    fines: {
      oriente: {
        t: "Las insignias en Constantinopla",
        d: "La púrpura vuelve a Oriente.",
        ep: "Devolvió a Constantinopla las insignias del último emperador de Occidente.",
      },
      herederos: {
        t: "Herederos de Roma",
        d: "Tu casa guarda la diadema de los césares.",
        ep: "Guardó la diadema de los césares y se llamó heredero de Roma.",
      },
      unidad: {
        t: "Un solo imperio",
        d: "Constantinopla es la única Roma.",
        ep: "Recibió las insignias de Occidente: desde entonces hubo una sola Roma.",
      },
      fundidas: {
        t: "Oro fundido",
        d: "La púrpura se vendió al peso.",
        ep: "Fundió las insignias del último emperador y pagó con ellas a sus soldados.",
      },
    },
  },

  /* ---------- XIII. Los hijos de Atila (hunos, segunda mitad del siglo V) ---------- */
  {
    id: "hijos",
    t: "Los hijos de Atila",
    para: (f) => f === 3,
    caps: [
      {
        id: "hi1",
        t: "Los pueblos sometidos",
        y: 455,
        d: () =>
          "Gépidos, ostrogodos y hérulos, que durante años sirvieron a los hunos como perros de caza, se han reunido junto a un río de Panonia. Dicen que ya no pagarán tributo a los hijos de quien les ató la correa.",
        o: [
          {
            t: "Aplastarlos en el río",
            prob: (c) => 0.45 + c.r.ma * 0.04 + c.N.leg.gl * 0.002,
            px: (c) => `según el mando de ${c.r.n} y tu gloria`,
            si: (c) => {
              narEf(c.f, "orden", 5, 10, "Los vasallos sometidos");
              return "La sangre de los gépidos tiñe el río durante tres días. Nadie más volverá a rebelarse (+5 orden, 10 años).";
            },
            no: (c) => {
              narTropa(c.cap, "c", -3);
              narTropa(c.cap, "a", -2);
              narEf(c.f, "orden", -4, 6, "La derrota del río");
              return "Los vasallos vencen junto al río. El imperio de los hunos se deshace como la nieve en primavera.";
            },
            leg: { gl: 6, cr: 3 },
            mk: (c, ok) => (ok ? "nedao_vencido" : "nedao_perdido"),
          },
          {
            t: "Liberarlos a cambio de oro",
            tip: "+60 oro; −2 caballería",
            ef: (c) => {
              OC.ganar(c.f, { oro: 60 });
              narTropa(c.cap, "c", -2);
            },
            leg: { sa: 4 },
            mk: "nedao_libres",
          },
        ],
      },
      {
        id: "hi2",
        t: "Ante las murallas de Constantinopla",
        y: 468,
        tras: 5,
        d: () =>
          "Los últimos señores hunos discuten en la tienda real. Unos quieren cruzar el Danubio y sitiar Constantinopla como en los viejos tiempos; otros, pedir tierra al emperador y vivir como federados. Los caballos están flacos.",
        o: [
          {
            t: "Cruzar el Danubio",
            vis: () => alive(1),
            tip: "guerra con Oriente; +10% en batalla durante 4 años",
            ef: (c) => {
              if (G.st[3][1] !== "guerra") declareWar(3, 1);
              narEf(c.f, "batalla", 0.1, 4, "La última cabalgada");
            },
            leg: { gl: 6 },
            fin: "cabalgada",
          },
          {
            t: "Pedir tierra al emperador",
            vis: () => alive(1),
            tip: "+30 relación con Oriente, +6 oro al año (12 años)",
            ef: (c) => {
              relAdd(3, 1, 30);
              if (G.st[3][1] === "guerra") makePeace(3, 1);
              narEf(c.f, "oro", 6, 12, "Federados de Oriente");
            },
            leg: { sa: 5 },
            fin: "federados",
          },
          {
            t: "Volver a la estepa",
            tip: "+5 orden durante 10 años",
            ef: (c) => narEf(c.f, "orden", 5, 10, "La hierba de los padres"),
            leg: { pi: 3 },
            fin: "estepa",
          },
        ],
      },
    ],
    fines: {
      cabalgada: {
        t: "La última cabalgada",
        d: "Los hunos cabalgan otra vez contra Roma.",
        ep: "Cuando todos daban a los hunos por acabados, volvieron a cabalgar contra Constantinopla.",
      },
      federados: {
        t: "Hunos de Roma",
        d: "Los nietos del Azote sirven al emperador.",
        ep: "Los nietos del Azote de Dios acabaron sirviendo al emperador de Oriente.",
      },
      estepa: {
        t: "La hierba de los padres",
        d: "El pueblo vuelve a la estepa de donde salió.",
        ep: "Devolvió a su pueblo a la estepa, y allí no los alcanzó la historia.",
      },
    },
  },

  /* ---------- XIV. La consolación de la filosofía (todos, hacia el 500) ---------- */
  {
    id: "filosofo",
    t: "La consolación de la filosofía",
    para: () => true,
    caps: [
      {
        id: "fi1",
        t: "El ministro acusado",
        y: 505,
        max: 540,
        prep: (c) => {
          c.pj = narAdultos(c.f, (x) => x.id !== c.F.heir && x.id !== c.r.sp).sort(
            (a, b) => b.ge + b.di - (a.ge + a.di),
          )[0];
          if (!c.pj) return false;
          c.g = pick(narVecinos(c.f).concat(narEnemigos(c.f))) ?? null;
        },
        d: (c) =>
          `${narB(c.pj)}, el consejero más sabio de la corte, es acusado por tres nobles de cartearse en secreto con ${c.g != null ? narPueblo(c.g) : "los enemigos del reino"}. Las cartas existen, pero podrían ser falsas. ${c.pj.n} jura que solo defendió al Senado.`,
        o: [
          {
            t: "Encarcelarle mientras se investiga",
            tip: (c) => `${c.pj.n} esperará en una torre`,
            ef: (c) => narMk(c.f, "filosofo_" + c.pj.id),
            leg: { sa: 1 },
          },
          {
            t: "Ejecutarle sin juicio",
            tip: (c) => `${c.pj.n} morirá`,
            ef: (c) => kill(c.pj, "es ejecutado por traición sin juicio"),
            leg: { cr: 8 },
            fin: "cicuta",
          },
          {
            t: "Defenderle ante la corte",
            prob: (c) => 0.3 + c.r.in * 0.06,
            px: (c) => `según la intriga de ${c.r.n}`,
            si: (c) => {
              c.pj.ge = Math.min(10, c.pj.ge + 1);
              return `Las cartas resultan falsas. ${c.pj.n} vuelve al consejo y los acusadores al destierro.`;
            },
            no: (c) => {
              narOrden(c.f, -6);
              return "No se prueba nada, pero la nobleza cree que proteges a un traidor: −6 orden.";
            },
            leg: { sa: 4 },
            fin: "inocente",
          },
        ],
      },
      {
        id: "fi2",
        t: "La consolación",
        tras: 2,
        prep: (c) => {
          const k = Object.keys(c.N.mk).find((k) => k.startsWith("filosofo_"));
          const p = k && G.C[+k.split("_")[1]];
          if (!p || !p.alive) return false;
          c.pj = p;
        },
        ok: (c) => Object.keys(c.N.mk).some((k) => k.startsWith("filosofo_") && G.C[+k.split("_")[1]]?.alive),
        cad: (c) =>
          Object.keys(c.N.mk).some((k) => k.startsWith("filosofo_") && G.C[+k.split("_")[1]]?.alive)
            ? null
            : "olvido",
        d: (c) =>
          `En su celda, ${narB(c.pj)} ha escrito un libro: una mujer vestida de luz, la Filosofía, le consuela y le enseña que la fortuna gira como una rueda. Los guardias lo copian a escondidas y ya se lee fuera del reino.`,
        o: [
          {
            t: "Liberarle y leer su libro",
            tip: "+10% investigación durante 12 años",
            ef: (c) => narEf(c.f, "invest", 0.1, 12, "La consolación de la filosofía"),
            leg: { sa: 6, pi: 2 },
            fin: "consolacion",
            cr: (c) => `${narTit(c.r)} libera a ${c.pj.n}, autor de un libro que se leerá mil años.`,
          },
          {
            t: "Ejecutarle de todos modos",
            tip: "el libro sobrevive (+5% investigación)",
            ef: (c) => {
              kill(c.pj, "es ejecutado en su celda");
              narEf(c.f, "invest", 0.05, 10, "El libro del condenado");
            },
            leg: { cr: 6 },
            fin: "cicuta",
          },
          { t: "Dejarle morir olvidado", leg: { cr: 2 }, fin: "olvido" },
        ],
      },
    ],
    fines: {
      cicuta: {
        t: "La sangre del sabio",
        d: "El consejero murió; su nombre, no.",
        ep: "Mandó matar al hombre más sabio de su corte, y la posteridad recordó al sabio, no al rey.",
      },
      inocente: {
        t: "El sabio absuelto",
        d: "La justicia del soberano salvó al consejero.",
        ep: "Defendió a su consejero contra la calumnia de los nobles.",
      },
      consolacion: {
        t: "La rueda de la fortuna",
        d: "El libro de la celda se copia en todo el mundo.",
        ep: "Liberó al autor de «La consolación de la filosofía», y el libro le hizo inmortal a él también.",
      },
      olvido: {
        t: "La torre",
        d: "El consejero murió en su celda.",
        ep: "Dejó morir en una torre a un sabio cuyo libro leyeron otros.",
      },
    },
  },

  /* ---------- XV. La reconquista de Justiniano (todos, siglo VI) ---------- */
  {
    id: "justiniano",
    t: "La reconquista de Justiniano",
    para: () => true,
    finDef: (c) =>
      narTiene(c.f, "ju_reconquista") ? "reconquista" : narTiene(c.f, "ju_codigo") ? "codigo" : "superv",
    caps: [
      {
        id: "ju1",
        t: (c) => (c.f === 1 ? "El código de las leyes" : "El código de Constantinopla"),
        y: 527,
        max: 545,
        d: (c) =>
          c.f === 1
            ? `Tus juristas proponen reunir en un solo código todas las leyes de Roma, de las Doce Tablas a hoy: mil años de derecho en cincuenta libros. «Que el imperio tenga una sola ley», dicen, «y que la ley tenga un solo dueño».`
            : `Llegan copias del nuevo código de leyes de Constantinopla: mil años de derecho romano ordenados en cincuenta libros. Los jueces de ${c.cap.name} lo leen con envidia.`,
        o: [
          {
            t: (c) => (c.f === 1 ? "Promulgar el código" : "Adoptar el código romano"),
            tip: "+3 orden durante 15 años",
            ef: (c) => narEf(c.f, "orden", 3, 15, "El código"),
            leg: { sa: 6 },
            mk: "ju_codigo",
          },
          {
            t: "Escribir una ley propia",
            vis: (c) => c.f !== 1,
            req: (c) => narStat(c.r, "ge", 5),
            tip: "+5 oro al año durante 12 años",
            ef: (c) => narEf(c.f, "oro", 5, 12, "La ley del reino"),
            leg: { sa: 4, gl: 2 },
            mk: "ju_codigo",
            cr: (c) => `${narTit(c.r)} promulga una ley escrita para su pueblo.`,
          },
          { t: "La costumbre basta", leg: { gl: 1 } },
        ],
      },
      {
        id: "ju2",
        t: (c) => (c.f === 1 ? "Belisario" : "Las naves de Constantinopla"),
        y: 533,
        tras: 3,
        max: 555,
        ok: (c) => c.f === 1 || alive(1),
        d: (c) =>
          c.f === 1
            ? "Tu mejor general, un tracio de pocas palabras llamado Belisario, propone reconquistar Occidente: primero África, luego Italia, luego Hispania. Pide quince mil hombres, quinientas naves y paciencia. Los ministros piden prudencia."
            : `Una flota de Constantinopla ha sido vista frente a tus costas. ${narTit(ruler(1))} quiere recuperar el Occidente que perdió Roma, y sus generales no preguntan a quién pertenece hoy.`,
        o: [
          {
            vis: (c) => c.f === 1,
            t: "Lanzar la reconquista",
            coste: { oro: 80 },
            tip: "+10% en batalla durante 10 años",
            ef: (c) => narEf(c.f, "batalla", 0.1, 10, "La reconquista de Occidente"),
            leg: { gl: 8 },
            mk: "ju_reconquista",
            cr: () => "Zarpan quinientas naves de Constantinopla para reconquistar Occidente.",
          },
          {
            vis: (c) => c.f === 1,
            t: "Solo África: el trigo y el mar",
            coste: { oro: 40 },
            tip: "+6 oro al año durante 12 años",
            ef: (c) => narEf(c.f, "oro", 6, 12, "El trigo de África"),
            leg: { gl: 3, sa: 2 },
          },
          {
            vis: (c) => c.f === 1,
            t: "Pagar a Persia y esperar",
            tip: (c) => (alive(6) ? "+20 relación con Persia" : ""),
            ef: (c) => {
              if (alive(6)) relAdd(1, 6, 20);
            },
            leg: { sa: 4 },
          },
          {
            vis: (c) => c.f !== 1,
            t: "Resistir en las costas",
            tip: "+10% al defender durante 8 años",
            ef: (c) => narEf(c.f, "batalla", 0.1, 8, "Contra la flota de Oriente", null, "defensor"),
            leg: { gl: 4 },
          },
          {
            vis: (c) => c.f !== 1,
            t: "Ofrecer alianza al emperador",
            tip: "+25 relación con Oriente",
            ef: (c) => relAdd(c.f, 1, 25),
            leg: { sa: 3 },
          },
          {
            vis: (c) => c.f !== 1,
            t: "Pagarle para que pase de largo",
            coste: { oro: 50 },
            tip: "+10 relación con Oriente",
            ef: (c) => relAdd(c.f, 1, 10),
            leg: { sa: 1 },
          },
        ],
      },
      {
        id: "ju3",
        t: "La gran mortandad",
        y: 541,
        tras: 2,
        d: (c) =>
          `Llega en los barcos de grano de Egipto, con las ratas: una peste como no se veía desde hace siglos. En ${c.cap.name} los muertos se cuentan por miles cada día; no hay tumbas ni quien las cave. Los médicos callan.`,
        o: [
          {
            t: "Cerrar puertos y caminos",
            coste: { oro: 40 },
            tip: "−5 comida al año durante 3 años",
            ef: (c) => narEf(c.f, "comida", -5, 3, "Puertos cerrados"),
            leg: { sa: 4 },
          },
          {
            t: "Procesiones con las reliquias",
            prob: (c) => 0.35 + c.N.leg.pi * 0.004,
            px: "según tu piedad",
            si: (c) => {
              narOrden(c.f, 6);
              return "La peste respeta tu reino más que a los vecinos. El pueblo lo atribuye a tus oraciones: +6 orden.";
            },
            no: (c) => {
              for (const t of TYP) c.cap.u[t] = Math.floor(c.cap.u[t] / 2);
              narOrden(c.f, -8);
              return "Las procesiones esparcen la peste. La mitad de la guarnición de la capital muere: −8 orden.";
            },
            leg: { pi: 4 },
          },
          {
            t: "Retirar la corte al campo",
            tip: "−8 orden en la capital",
            ef: (c) => narOrden(c.f, -8, c.cap),
            leg: { cr: 2 },
          },
        ],
      },
    ],
    fines: {
      reconquista: {
        t: "La reconquista",
        d: "Las águilas de Oriente vuelven a Occidente.",
        ep: "Lanzó la reconquista de Occidente, y por un tiempo el Mediterráneo volvió a ser un lago romano.",
      },
      codigo: {
        t: "El código",
        d: "Tu reino se gobierna por la ley escrita.",
        ep: "Dio a su reino una ley escrita que sobrevivió a su dinastía.",
      },
      superv: {
        t: "Tiempos de peste",
        d: "Sobreviviste a la gran mortandad.",
        ep: "Sobrevivió a la gran mortandad, cuando los vivos no bastaban para enterrar a los muertos.",
      },
    },
  },

  /* ---------- XVI. El concilio de Toledo (arrianos, finales del siglo VI) ---------- */
  {
    id: "toledo",
    t: "El concilio de Toledo",
    para: (f) => narFe(f) === "arriano",
    caps: [
      {
        id: "to1",
        t: "El rey y los obispos",
        y: 560,
        ok: (c) => narFe(c.f) === "arriano",
        cad: (c) => (narFe(c.f) !== "arriano" ? "nicenos" : null),
        d: (c) =>
          `Han pasado generaciones y tu pueblo sigue siendo arriano entre súbditos nicenos. El heredero${c.h ? `, ${narB(c.h)},` : ""} ha estudiado con obispos católicos y dice que ha llegado la hora de convocar un concilio en ${c.cap.name} y cerrar la herida.`,
        o: [
          {
            t: "Convocar el concilio y abjurar",
            tip: "+8 orden durante 15 años; nicenos +20",
            ef: (c) => {
              narConvertir(c.f, "niceno");
              relFe(c.f, "niceno", 20);
              narEf(c.f, "orden", 8, 15, "Concilio de Toledo");
            },
            leg: { pi: 8, sa: 3 },
            fin: "nicenos",
            cr: (c) => `${narTit(c.r)} abjura del arrianismo ante el concilio. Un solo pueblo, una sola fe.`,
          },
          {
            t: "Prohibir el concilio",
            tip: "−3 orden durante 8 años",
            ef: (c) => narEf(c.f, "orden", -3, 8, "La herida abierta"),
            leg: { gl: 2, cr: 2 },
            fin: "fieles",
          },
        ],
      },
    ],
    fines: {
      nicenos: {
        t: "Un solo pueblo",
        d: "Godos y romanos son ya un mismo pueblo.",
        ep: "En un concilio cerró la herida entre conquistadores y conquistados.",
      },
      fieles: {
        t: "Los últimos arrianos",
        d: "Tu pueblo es el último fiel a Arrio.",
        ep: "Fue el último en mantener la fe de Arrio, cuando ya todos la habían abandonado.",
      },
    },
  },
];

/* ---------- prólogo ---------- */
const NAR_PROLOGO = {
  0: {
    t: "Rávena, año 410",
    d: (c) =>
      `Agosto. Los godos de Alarico han entrado en Roma por la puerta Salaria y la saquean desde hace tres días. En ${c.cap.name}, protegida por los pantanos, ${narTit(c.r)} recibe la noticia entre consejeros pálidos. Al imperio de Occidente le quedan legiones veteranas, un Senado intrigante y ${c.own.length} provincias. Lo que hagas con ellas lo dirá la historia.`,
    j: [
      "Jurar ante el altar de la catedral",
      "Jurar ante las legiones",
      "Jurar ante el Senado",
      "Jurar con un escarmiento a los traidores",
    ],
  },
  1: {
    t: "La Nueva Roma",
    d: (c) =>
      `Las noticias de Roma llegan a ${c.cap.name} con un mes de retraso y suenan a profecía. Detrás de sus murallas, ${narTit(c.r)} gobierna el imperio más rico del mundo: oro de Egipto, seda de Siria y enemigos en todas las fronteras. Persia acecha al este; los hunos, al norte.`,
    j: [
      "Jurar en la gran iglesia",
      "Jurar ante los catafractos",
      "Jurar ante el consistorio",
      "Jurar con un castigo ejemplar",
    ],
  },
  2: {
    t: "Tras el saqueo",
    d: (c) =>
      `Tres días y tres noches anduvieron los godos por las calles de Roma. Ahora el pueblo de Alarico marcha cargado de oro, de cautivos y de una pregunta: ¿dónde vivir? ${narTit(c.r)} hereda un pueblo sin tierra y un nombre que todo el mundo teme.`,
    j: [
      "Jurar ante el obispo arriano",
      "Jurar alzado sobre los escudos",
      "Jurar ante la asamblea de los ancianos",
      "Jurar con sangre de cautivos",
    ],
  },
  3: {
    t: "La estepa",
    d: (c) =>
      `Más allá del Danubio, donde la hierba no tiene fin, ${narTit(c.r)} reúne a las tribus hunas. Los romanos pagan tributo para que no crucéis el río; los godos huyen de vosotros desde hace treinta años. El mundo es de quien tenga más caballos.`,
    j: [
      "Sacrificar un caballo blanco a los dioses",
      "Jurar sobre la espada desnuda",
      "Jurar ante los jefes de los clanes",
      "Jurar sobre el cráneo de un enemigo",
    ],
  },
  4: {
    t: "Un pueblo en marcha",
    d: (c) =>
      `Los vándalos cruzaron el Rin helado hace cuatro inviernos y no se han detenido. Hispania es rica y está mal defendida; más allá del estrecho brillan los trigales de África. ${narTit(c.r)} gobierna un pueblo que vive del botín y no teme al mar.`,
    j: [
      "Jurar ante el obispo arriano",
      "Jurar ante los guerreros",
      "Jurar ante los ancianos del pueblo",
      "Jurar con un saqueo ejemplar",
    ],
  },
  5: {
    t: "Los hijos de Meroveo",
    d: (c) =>
      `Entre el Rin y los bosques de las Ardenas, los francos viven en paz con Roma... cuando les conviene. ${narTit(c.r)} es de la estirpe de Meroveo, el hijo del monstruo marino, y sus guerreros arrojan la francisca mejor que nadie. Los viejos dioses aún reinan en los bosques.`,
    j: [
      "Sacrificar en el bosque sagrado",
      "Jurar sobre la francisca",
      "Jurar ante la asamblea de hombres libres",
      "Jurar con la cabeza de un rival",
    ],
  },
  6: {
    t: "Ctesifonte",
    d: (c) =>
      `Bajo la gran bóveda de ladrillo de ${c.cap.name}, ${narTit(c.r)} recibe a los embajadores de Roma con la cortesía de quien sabe que su imperio es más antiguo. Los magos guardan el fuego sagrado; los savaran, la frontera. Roma se tambalea: el mundo podría volver a ser persa.`,
    j: [
      "Jurar ante el fuego sagrado",
      "Jurar ante los savaran",
      "Jurar ante los grandes del reino",
      "Jurar con un castigo a los rebeldes",
    ],
  },
};

/* ---------- hechos menores de la crónica (sin modal) ---------- */
const NAR_MENORES = [
  (c) => `El invierno es largo en ${c.p.name}; los lobos bajan hasta las puertas de la ciudad.`,
  () =>
    "Un cometa con cola de fuego cruza el cielo siete noches seguidas. Los adivinos no se ponen de acuerdo.",
  (c) =>
    `En ${c.cap.name}, ${narTit(c.r)} preside la audiencia de los pleitos; los litigantes alaban su ${c.r.ge >= 6 ? "juicio" : "paciencia"}.`,
  (c) =>
    c.h && c.h.age >= 14
      ? `${c.h.n} sale de caza con los jóvenes nobles y vuelve con un jabalí y dos amigos nuevos.`
      : null,
  (c) =>
    c.sp
      ? `${c.sp.n} manda bordar un manto para ${narCristiano(c.f) ? "la iglesia" : "el templo"} de ${c.cap.name}.`
      : null,
  (c) => {
    const g = narEnemigos(c.f)[0];
    return g != null
      ? `Las madres de ${c.p.name} rezan por los hijos que marcharon contra ${narPueblo(g)}.`
      : null;
  },
  (c) => {
    const q = c.own.find((p) => p.order < 40);
    return q ? `En ${q.name} se oyen murmullos contra los recaudadores.` : null;
  },
  (c) => (c.F.gold > 200 ? "El tesoro rebosa; los aduladores multiplican sus visitas a palacio." : null),
  (c) => (c.F.gold < 20 ? "El tesorero cuenta las monedas dos veces y siguen saliendo pocas." : null),
  (c) =>
    !narEnemigos(c.f).length ? `Año tranquilo. En ${c.p.name} se celebran bodas y se siembra en paz.` : null,
  (c) => `Un temblor de tierra agrieta los muros de ${c.p.name}. No hay muertos, pero sí presagios.`,
  (c) =>
    `Llegan a ${c.cap.name} mercaderes de ${pick(["Alejandría", "Antioquía", "Cartago", "Marsella", "Cádiz", "Tréveris"])} con vino, papiro y noticias atrasadas.`,
  (c) =>
    c.r.age >= 60
      ? `${c.r.n} cumple ${c.r.age} años. Los médicos le aconsejan menos vino; los nobles, que piense en la sucesión.`
      : null,
  (c) =>
    c.r.age < 16
      ? `${c.r.n} reina con ${c.r.age} años; los consejeros discuten quién gobierna de verdad.`
      : null,
  (c) => {
    const g = family(c.f).find((x) => genOf(x));
    return g ? `${g.n} adiestra a la guarnición de ${genOf(g).name}; sus soldados le llaman «padre».` : null;
  },
  (c) =>
    narCristiano(c.f)
      ? `Un monje de ${c.p.name} asegura haber visto un ángel sobre el río. Acuden peregrinos.`
      : narFe(c.f) === "zoroastra"
        ? `Los magos reavivan el fuego sagrado del templo de ${c.cap.name}.`
        : `Los ancianos de ${c.p.name} sacrifican un caballo blanco para que el verano sea largo.`,
  (c) => `Una nube de langosta oscurece el cielo sobre ${c.p.name}, pero pasa de largo.`,
  (c) => {
    const L = c.N.leg;
    if (L.pi >= 30) return `Los obispos llaman a ${c.r.n} «columna de la fe».`;
    if (L.cr >= 30) return `Las nodrizas asustan a los niños con el nombre de ${c.r.n}.`;
    if (L.gl >= 30) return `Los juglares cantan en las tabernas las victorias de ${c.r.n}.`;
    if (L.sa >= 30)
      return `Llegan estudiantes de tierras lejanas atraídos por la fama de la corte de ${c.r.n}.`;
    return null;
  },
  (c) => {
    const g = pick(narVecinos(c.f));
    if (g == null) return null;
    const rr = ruler(g);
    return `Se dice en el mercado que ${narTit(rr)}, de ${CIV[g].s}, ${pick(["ha caído enfermo de fiebres", "manda construir un palacio nuevo", "ha hecho azotar a su tesorero", "caza leones en sus jardines", "no duerme por miedo al veneno"])}.`;
  },
  (c) =>
    `Nace en ${c.p.name} un ternero de dos cabezas. Los campesinos lo queman y esparcen la ceniza en el río.`,
  (c) => {
    const k = narHijos(c.f).find((x) => x.age >= 5 && x.age < 14);
    return k
      ? `${k.n}, de ${k.age} años, aprende las letras con un preceptor ${pick(["griego", "de Hispania", "monje"])}.`
      : null;
  },
  (c) => `La vendimia es buena en ${c.p.name}; del vino de este año se hablará mucho tiempo.`,
  (c) => `Un incendio arrasa el barrio de los curtidores de ${c.cap.name}. Se reconstruye en un mes.`,
];

/* ---------- epílogo ---------- */
const NAR_VEREDICTO = {
  pi: [
    "Los cronistas te recuerdan como un soberano piadoso: levantaste templos sobre las ruinas, y se rezó por tu alma durante siglos.",
    "Cayó tu reino, pero los monjes guardaron tu memoria: un soberano piadoso en un tiempo sin piedad.",
  ],
  gl: [
    "Tu nombre se cantó en las mesas de los guerreros durante generaciones; ningún poeta supo contar todas tus batallas.",
    "Caíste como caen los héroes de los cantares: rodeado y sin rendirte. Los vencedores también cantaron tu nombre.",
  ],
  cr: [
    "Reinaste por el miedo, y el miedo te sirvió bien. Las madres asustaron a sus hijos con tu nombre durante cien años.",
    "Sembraste el miedo y recogiste el odio. Cuando cayó tu reino, nadie lo lloró.",
  ],
  sa: [
    "Bajo tu gobierno se copiaron libros, se escribieron leyes y se abrieron escuelas. Otros conquistaron; tú supiste conservar.",
    "Tus leyes sobrevivieron a tu reino: los conquistadores las copiaron palabra por palabra.",
  ],
  no: [
    "Fuiste un soberano de tu tiempo, ni santo ni monstruo, y aun así venciste.",
    "Fuiste uno más entre los soberanos que el siglo vio caer.",
  ],
};
function narTextoEpilogo(f) {
  const N = narF(f),
    need = Math.ceil(G.P.length * 0.6),
    k = owned(f).length,
    vivo = alive(f),
    gano = vivo && k >= need;
  N.maxP = Math.max(N.maxP, k);
  const w =
    G.over && G.over.win != null ? G.over.win : G.human.find((x) => alive(x) && owned(x).length >= need);
  const ab = gano
    ? `En el año ${G.year}, ${narPueblo(f)} domina ${k} de ${G.P.length} provincias. Ningún otro pueblo puede ya disputarle la herencia de Roma.`
    : !vivo
      ? `En el año ${G.year} cayó la última ciudad de ${narPueblo(f)}. Sus estandartes ardieron, y su nombre quedó solo en las crónicas de los vencedores.`
      : w != null && w >= 0 && w !== f
        ? `En el año ${G.year}, ${narPueblo(w)} se impuso sobre el mundo conocido. ${narPueblo(f)} sobrevivió a la sombra de otro.`
        : `En el año ${G.year} se cierran estos anales.`;
  let dom = null;
  for (const L of NAR_LEG) if (N.leg[L.k] >= 12 && (!dom || N.leg[L.k] > N.leg[dom.k])) dom = L;
  const ver = NAR_VEREDICTO[dom ? dom.k : "no"][gano || (vivo && !(w >= 0 && w !== f)) ? 0 : 1];
  const reyes = N.reyes
    .map((x) => {
      const ap = x.h == null ? narApodo(f, G.C[x.id], x) : x.ap;
      return `${x.n}${ap ? ` «${ap}»` : ""} (${x.d}–${x.h ?? G.year})`;
    })
    .join(", ");
  const eps = narArcos()
    .map((a) => {
      const A = N.arc[a.id];
      return A && A.fin && a.fines && a.fines[A.fin] ? { y: A.y, ep: a.fines[A.fin].ep } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.y - b.y)
    .slice(-4)
    .map((x) => x.ep);
  const cierre = pick([
    "Así termina la crónica. Lo demás es silencio y polvo.",
    "Aquí calla el cronista. Que otros escriban lo que vino después.",
    "Sic transit gloria mundi.",
  ]);
  return `<p>${narFrase(ab)}</p><p>${ver}</p>${eps.length ? `<p>${eps.join(" ")}</p>` : ""}<p class="dim">Reinaron en tu linaje: ${reyes}.</p><p class="stats">${N.vic} conquistas · ${N.bat} batallas ganadas · ${N.dec.length} decisiones · hasta ${N.maxP} provincias</p><p class="nar-cierre">${cierre}</p>`;
}
