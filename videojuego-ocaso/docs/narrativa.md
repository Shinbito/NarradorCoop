# Narrativa — Ocaso del Imperio

Archivos: `js/narrativa.js` (vida de la corte `life`, motor de eventos, `EVENTS`, `runEvent`,
`inboxItem`, `startTurn`, reacciones, legado, pestaña Anales), `js/historia.js` (arcos históricos,
prólogo, hechos menores, epílogo), `css/narrativa.css`, `pruebas/narrativa.js`. Estado en `G.nar`.

## Qué ve el jugador

- **Dos modos** (`G.modo`). Histórico: los 16 arcos del 410 (marcados `hist`). Mundo de leyendas: prólogos
  de leyenda para los 19 pueblos, un arco cultural por cada pueblo nuevo y el arco «Mundos que se
  encuentran» (marcados `ley`). Los eventos sueltos de época romana (`hist: true`) solo salen en el histórico.
  Todo el contenido por pueblo usa `CIV[f].id` (nunca el índice) y `CIV[f].pueblo` para nombrarlo.
- **Prólogo** (año 410) distinto para cada pueblo, con un juramento que da tono al reinado:
  altar (+piedad, +4 orden 6 años), ejército (+gloria, +6 % batalla), consejo (+sabiduría, +5 oro/año)
  o escarmiento (+temor, +3 orden).
- **Arcos históricos** de varios capítulos que avanzan con los años y con lo que pasa (16 arcos, 42
  capítulos), con desenlaces según las decisiones. Escalonados para partidas de 100–150 años:

  | Arco                           | Para                         | Años (mínimo)                              |
  | ------------------------------ | ---------------------------- | ------------------------------------------ |
  | La caída de Roma               | todos                        | 411, +3                                    |
  | El foedus                      | visigodos, vándalos, francos | 413, +5, 440                               |
  | Los federados                  | Occidente, Oriente           | 414, +6                                    |
  | Un solo arco (Atila)           | hunos                        | 425, 434, 441, 450                         |
  | La púrpura de Oriente          | Oriente                      | 422, 447, 532 (Niká)                       |
  | Los reyes de reyes             | Persia                       | 421, 476, 490 (Mazdak), 531 (Cosroes)      |
  | El mar de los vándalos         | vándalos                     | 425, 452                                   |
  | El azote de Dios               | todos menos hunos            | 430, 436, 451 (Cataláunicos), 453 (Ildico) |
  | La querella de los obispos     | cristianos                   | 431 (Éfeso), 449, 451 (Calcedonia)         |
  | Las últimas águilas            | Occidente                    | 450, 472 (Odoacro), 500                    |
  | Los hijos de Atila             | hunos                        | 455, 468                                   |
  | El bautismo del rey            | paganos                      | 465, +3, voto cumplido en batalla          |
  | Las insignias del imperio      | todos menos Occidente        | 470, si Occidente cae                      |
  | La consolación de la filosofía | todos                        | 505, +2                                    |
  | La reconquista de Justiniano   | todos                        | 527, 533, 541 (peste)                      |
  | El concilio de Toledo          | arrianos                     | 560                                        |

- **Mundo de leyendas**: 12 arcos culturales de 4 capítulos (412, ~430, ~466, ~510), con desenlaces:

  | Pueblo   | Arco                 | Capítulos                                                                       |
  | -------- | -------------------- | ------------------------------------------------------------------------------- |
  | nórdicos | Las sagas del Norte  | el thing, naves de proa de dragón, la profecía de la völva, el skald            |
  | aztecas  | El Quinto Sol        | el águila sobre el nopal, la guerra florida, el Quinto Sol, el fuego nuevo      |
  | incas    | Los cuatro suyos     | la mita, el camino del Inca, los quipus, los mitimaes                           |
  | mayas    | La cuenta larga      | la cuenta larga, el juego de pelota, la gran sequía, la serpiente emplumada     |
  | chinos   | El Mandato del Cielo | el examen imperial, la Gran Muralla, las señales del Cielo, el Gran Canal       |
  | egipcios | El don del Nilo      | la crecida, la biblioteca, los sacerdotes de Isis, el canal de los faraones     |
  | griegos  | La Liga Helénica     | el oráculo de Delfos, la asamblea, los Juegos Olímpicos, la Academia            |
  | indios   | La rueda del dharma  | la sangha, el mercader y la casta, los hunos blancos, el cero                   |
  | árabes   | Las arenas de Arabia | la caravana del incienso, la feria de Ukaz, la presa de Marib, el santuario     |
  | celtas   | Los druidas          | el consejo de los druidas, el combate de campeones, Samhain, los monjes del mar |
  | eslavos  | El veche             | la campana del veche, Perún y Veles, los ríos del este, las letras propias      |
  | mongoles | La estepa azul       | el kurultai, el yam, el chamán del cielo, la Yassa                              |

  «Mundos que se encuentran» (todos, en leyendas): el primer contacto con un pueblo de otro mundo
  (América / Oriente lejano / Viejo Mundo) al lindar con él (o por embajada a partir del 450), la peste
  traída de lejos (más dura para los pueblos americanos) y el intercambio de cultivos.

- **Eventos** (59: 35 de azar, 5 encadenados y 19 reacciones): de corte, reino, fe, frontera y saber, con un personaje real de tu corte
  (`G.C`: soberano, heredero, consorte, generales, hijos, con sus rasgos y estadísticas) como protagonista.
  Algunos sólo existen en su época (`y`/`hasta`): alanos y embajada huna hasta 470–480; partición del
  reino desde 470; la regla de San Benito y los filósofos de Atenas en 529; el año sin sol en 536; el
  gusano de seda en 552; ávaros en 558; lombardos en 568; las cartas del papa Gregorio en 590.
- **Opciones condicionadas**: coste (`OC.textoCoste`), requisitos de estadística, tropas, rasgo, fe o
  alianza; las bloqueadas se ven desactivadas con el motivo («✕ requiere intriga 5 (Aecio tiene 3)»).
  Las arriesgadas muestran la probabilidad y de qué depende («≈62% según la diplomacia de…»), y tras
  elegir un modal breve cuenta el desenlace.
- **Memoria y consecuencias**: las decisiones dejan marcas (`mk`) que desbloquean capítulos y eventos
  encadenados años después: conjura fallida → el puñal; mercenarios → reclaman su paga; préstamo →
  acreedores; general sin recompensa → se rebela; consorte con séquito → sus cartas de espía; voto
  del rey pagano → bautismo si gana una batalla; federados → su hambre; filósofo encarcelado → su libro;
  partición prometida → herencia repartida (−6 orden) al morir el soberano.
- **Reacciones** a lo que pasa (se encolan y salen al empezar el año): gran victoria de un general
  ambicioso (pide recompensa), derrota (destituir o perdonar: si vence luego, se redime), capital
  enemiga tomada (saqueo, clemencia o coronarse si era romana), capital perdida (corte en el exilio, y
  «El regreso» al recuperarla), revuelta, coronación (primer edicto o regencia), muerte del heredero
  (investigar al sospechoso), consorte extranjera, guerra declarada contra ti, nuevo saber, hambre y bancarrota.
  La nueva era (que ya anuncia tecnología con su modal) sólo queda anotada en los Anales.
- **Campaña**: asedio largo de una ciudad propia (repartir despensas, ahorcar derrotistas o procesión:
  todo sube o baja el orden de la ciudad, que es lo que decide la rendición en `ecoApoyoAsedio`) y
  cerco propio que no acaba (prometer clemencia o terror —con consecuencia al tomarla— o pagar a un
  traidor); el capitán sin linaje que llega a general y el general de nivel ≥ 6 (honrarle, atarle a la
  casa o alejarle, que enlaza con «El general resentido»); mercenarios que desertan sin paga. Los
  capitanes nuevos tienen voz en la crónica y los factores del informe de batalla (berserkers,
  elefantes, fuego griego, muro de escudos, carga, flanqueo…) se cuentan como crónica.
- **Tropas**: los eventos nunca dan clases `UN[t].merc` y respetan `civPuede(f, t)` (si no, infantería).
- **Ritmo**: como mucho 2 modales al año contando los del buzón de diplomacia y las demandas de
  sociedad (`OC.modales`, contado desde el comienzo de `startTurn`); si ya hubo 2, sólo sale lo urgente
  (coronación, exilio). Orden: reacciones → consecuencias → capítulo → azar (40 %, o 15 % si ya hubo uno).
  Los hechos menores (23 frases variadas que leen el estado: guerra, tesoro, orden, edad del
  soberano, legado, rumores de otras cortes) van a la crónica.
- **Crónica**: las decisiones memorables se destacan (`nar-dec` oro, `nar-cap` capítulo, `nar-fin`
  desenlace, `nar-rumor` prosa menor en cursiva).
- **Pestaña «Anales»** (orden 85): soberano con su apodo, legado con barras y efecto, influjos
  temporales, historias en curso o concluidas, decisiones, crónica de la casa y linaje con apodos.
- **Epílogo** al acabar la partida según resultado, legado dominante, desenlaces de los arcos y linaje;
  queda guardado en los Anales.

## Legado (G.nar.f[f].leg, 0–100)

Piedad `pi`, Gloria `gl`, Temor `cr`, Sabiduría `sa`. Sube con las decisiones (+1…+10), las victorias
(+1 por batalla ganada de ≥5 tropas, +2 por capital), los templos (+1 piedad) y los saberes (+1/+2
sabiduría). En cada sucesión el legado de la casa se reduce a la mitad; lo ganado en el reinado (`lr`)
da el apodo (≥10 en un eje): «el Piadoso», «el Grande», «el Terrible», «el Sabio» (o «el Breve»).

Efectos moderados (también para la IA), con `OC.mod` prio 20:

- `ordenObjetivo`: +piedad×0,04 (máx +4), +temor×0,015 (×0,06 en provincias recién conquistadas),
  más los influjos de orden.
- `bonoBatalla`: ×(1 + gloria×0,0006 + influjos de batalla), máx +6 % por gloria.
- `puntosInvestigacion`: ×(1 + sabiduría×0,0015 + influjos), máx +15 %.
- `aceptacionDiplomatica`: −temor×0,001, +gloria×0,0008 en paz, +piedad×0,0006 con la misma fe, −0,06
  durante 10 años tras traicionar una alianza (perjuro).
- `rendimiento`: los influjos de oro/comida se suman a la capital.

Influjos temporales `G.nar.f[f].ef = [{k, v, h, t, p, lado}]` (`k`: orden, oro, comida, batalla,
invest, diplo), visibles en Anales con su fecha de fin.

## La IA

En `turnoIA` cada reino tiene un 22 % de resolver un evento de azar elegido por los rasgos de su
soberano (Piadoso → piedad, Cruel → temor…), paga costes y gana legado; a veces llega como rumor a la
crónica del jugador. También acumula gloria en batalla, sucesiones y apodos («Los cronistas de los
Hunos llamarán a Atila "el Terrible"»).

## Estado

`G.nar = {v:1, m: {marcas del mundo}, f: {[f]: {arc, mk, dec, cron, leg, lr, cola, vis, ef, hx,
reyes, rey, vivos, sp, her, st, my, mn, ini, epi, vic, per, bat, maxP, fe}}}`, sólo datos planos y
listas acotadas (crónica 80, decisiones 40, cola 8). `narInit` (en `partidaLista`) completa los campos
que falten; las partidas sin `G.nar` cargan sin prólogo.

API para otros sistemas: `narLegado(f)`, `narApodoActual(f)`, `narTiene(f, marca)`, `narFe(f)`.

## Ganchos

- **Emite**: `inicioTurno` (en `startTurn`, sólo para `ME`; en online, `startTurn` sigue el guardia
  `G.evY`).
- **Escucha**: `partidaLista`, `conquista`, `batallaResuelta`, `revuelta`, `sucesion` (personajes o
  ids), `muertePersonaje`, `bodaCelebrada`, `guerraDeclarada`, `pazFirmada`, `alianzaSellada`,
  `tecnologiaInvestigada` (usa `TEC[id].n`), `eraNueva` (usa `tecEras`), `edificioConstruido`,
  `crisisEconomica` (`hambre`, `impagos`, `bancarrota` → evento; `peste`, `inflacion` → crónica),
  `turnoIA`, `antesFinAnio` (foto del estado), `batallaResuelta.informe.factores` (crónica), `finAnio` (sucesiones), `finPartida` (el epílogo se abre
  justo antes del modal de victoria/derrota).
  Respaldo al empezar el año por si un evento no llegara: sucesión, muertes, consorte nueva, guerras
  nuevas, hambre y deudas.
- **Modifica**: `ordenObjetivo`, `rendimiento`, `bonoBatalla`, `puntosInvestigacion`,
  `aceptacionDiplomatica`.
- **Lee** (sin modificarlos, una vez al año en `startTurn`): `G.cam.as` (asedios), `G.cam.merc.con`
  (contratos), `G.C[].linaje/rol/nivel` (capitanes y generales), `cmbNivel`, `civPuede`, `civBase`,
  `G.modo`. Solo toca `p.order` de la ciudad sitiada en las opciones del cerco.
- **Ritmo con estaciones**: todo lo narrativo sigue siendo anual (en `startTurn`, que el guardia
  `G.evY` limita a una vez por año aunque se llame cada estación); nada abre modales por estación.
- **Usa**: `OC.pagar/ganar/puedePagar/textoCoste`; sociedad si existe: `socImp` (estamentos),
  `socPolitica` (el Concilio de obispos fija celo o tolerancia), `socConvertir` (las conversiones de
  los arcos), `socTension`; `kill`, `marry`, `mkChar`, `declareWar`, `makePeace`, `relAdd`,
  `marryModal`, `heirCands`.

## Pruebas

`node pruebas/narrativa.js [años=30] [civ=0]`: campaña con elecciones al azar; comprueba prólogo,
≤ 2 modales narrativos por año, decisiones, arcos, legado, uso por la IA, reacciones (capital perdida,
sucesión), contenido a partir del 500 (saltando años hasta el 590), epílogo antes del modal de victoria
y carga de una partida guardada sin `G.nar`. En leyendas: nombres y prólogos de los 19 pueblos, arcos
de los 12 nuevos, tropas sin jinetes ni mercenarios, reacciones de campaña (asedio, capitán, general)
y un salto de años con arco cultural y choque de mundos, sin ningún arco del 410. Capturas
`pruebas/capturas/narrativa-*.png`.

## Peticiones al orquestador

Atendidas: `finPartida`, `OC.modales` y `G.log` de 250 entradas (ya integradas en este sistema).

1. **Diplomacia**: el panel de dinastía/diplomacia podría mostrar `narApodoActual(g)` junto al
   soberano extranjero, y la aceptación podría leer `narLegado(g)` del receptor.
2. **Contrato**: anotar en la sección 5 que la narrativa modifica también `rendimiento` y
   `aceptacionDiplomatica`, y el campo `lado:'defensor'` que uso en `bonoBatalla`.
3. **Interfaz**: `logPanel` podría agrupar la crónica por año; las entradas `nar-*` ya llevan estilo.
4. **Campaña**: un evento `asedioLargo {p, f, n}` (o `capitulacion`) y `mercDesercion {f, nom}` ahorrarían
   leer `G.cam` y el texto de la crónica; y una función `camAsedioAjustar(pid, {vi, mo})` permitiría que
   los eventos del cerco tocaran víveres y moral en lugar de solo el orden.
5. **Combate**: un evento `capitanSurge {c, f}` / `generalAsciende {c}` / `nivelSube {c, nivel}` (hoy los
   detecto una vez al año por `rol` y `nivel`).
