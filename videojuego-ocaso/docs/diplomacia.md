# Diplomacia y sociedad — Ocaso del Imperio

Archivos: `js/diplomacia.js` (tratados, opinión, reputación, casus belli, IA diplomática, panel
Diplomacia), `js/sociedad.js` (estamentos, consejo, lealtad de personajes, religión, pestaña Corte),
`js/partida.js` (herederos, muerte, sucesión, panel Dinastía; `newGame`/`setup` son de Mundo), `css/diplomacia.css`,
`pruebas/diplomacia.js`. En `nucleo.js`: `TRAITS`, `trait`, `mkChar`, `marry`. Estado en `G.dip`.

## Diplomacia

**Estados.** `G.st` sigue valiendo `guerra` / `paz` / `alianza` (lo leen combate e interfaz). Los demás
pactos viven en `G.dip.tr` = `[{id, t, a, b, y, h, ...}]` (`h` = año en que expira, 0 = indefinido):

| Tratado | Duración | Efecto | Romperlo (reputación) |
|---|---|---|---|
| `tregua` | 5 años, tras toda paz | la IA casi nunca la rompe | −20 |
| `nag` pacto de no agresión | 10 | freno fuerte a la guerra | −15 |
| `alianza` (`sub` defensiva/ofensiva) | indef. | llamada a las armas | −25, traición −45 opinión |
| `vasallaje` (a = señor, b = tributario; «foedus» si el señor es Roma) | 10 | `trib` oro/año (15 % de los ingresos brutos, 5–30; si no hay oro, en especie al precio del mercado); el señor protege y llama | −12 |
| `comercio` | 10 | +2 oro/año a cada uno, +2 por ruta de `G.eco.rutas` entre ambos (máx. 10); al firmar la IA abre una ruta | 0 |
| `paso` | 8 | +6 % en batallas junto al territorio del socio (`bonoBatalla`) | 0 |
| `rehenes` | 10 | un joven (5–17) de cada corte (`c.dipReh`); quien rompe un pacto arriesga a su rehén | −10 |

Embajada (25 oro, 8 años): +8 % de aceptación y el embajador revela sus planes contra ti.
Reclamación (30 oro, una al año, intriga del soberano o del maestro de espías): casus belli 20 años.

**Opinión con causas.** `G.rel` es la opinión total; cada recuerdo (`G.dip.mem["a-b"] = [{k,t,v,d}]`)
se suma a `G.rel` y decae `d`/año: «Boda dinástica +20», «Traición de la alianza −45», «Guerra abierta»
(−15 y −3/año mientras dura), «Perjurio −25», «Abandonó a su aliado −25», «Regalos», «Comercio próspero»,
«Misma fe +12» / «Disputa de credo −8» (permanentes). Lo que no explican los recuerdos es el «trato
general» y tiende a 0 (lo que suman otros sistemas con `relAdd`).

**Reputación** `G.dip.rep[f]` 0–100 (empieza 60, se recupera +2/año hasta 60): romper tratados, guerra
sin casus belli (−10 y −3 de opinión con todos), negarse a una llamada (−8), complot descubierto (−10);
acudir a una llamada +3. Pesa en toda aceptación.

**Casus belli** (`dipCB(a,b)`): tierras perdidas (`p.home`), reclamaciones, agravios (traición, pacto
roto, complot, tributo negado, vasallo moroso o rebelde; 6–15 años), enemistad ≤ −50, defensa de un
aliado o tributario, guerra por la fe (soberano piadoso o clero muy leal).

**Llamada a las armas.** Al declararse una guerra se llama a los aliados y señor/tributarios del
atacado, y a los aliados ofensivos y tributarios del atacante. La IA decide con `aceptacionDiplomatica`
(`tipo:'llamada'`); el jugador recibe un modal al empezar su turno. Negarse: −8 reputación, −25 opinión,
35 % de romper la alianza. Las entradas por llamada no encadenan más llamadas.

**Propuestas.** `dipAceptacion(f, g, tipo, ext)` → `{p, mot}`: opinión, reputación, diplomacia del
soberano y del canciller, embajada, rehenes, rutas comerciales, fuerza relativa, años y marcador de
guerra (provincias y batallas, por los eventos de combate), personalidad, fe, crisis interna; y los
términos: exigir/ofrecer oro, exigir/ceder provincia, exigir/ofrecer tributo. Después pasa por
`OC.calc('aceptacionDiplomatica', p, {f, g, tipo, ...ext})`. El jugador ve el % en cada botón y los
motivos en el modal. Si la IA rechaza, puede **contraofertar** (oro, una provincia o tributo).

**IA** (`aiDiplo`, desde `ai()`): personalidad por pueblo (`DIP_PERS[CIV[f].id]`, respaldo `civBase`:
agresividad, honor, negociación, codicia). Belicosos: hunos, mongoles, aztecas, nórdicos, vándalos,
celtas. Negociadores: Oriente, chinos, griegos, sasánidas. Codiciosos: hunos, mongoles, árabes. De
palabra: incas, sasánidas, indios. Se ajusta por el rasgo del soberano. Declara la guerra según deseo (frontera, fuerza propia contra la del rival y sus aliados,
opinión, casus belli, tratados vigentes, otras guerras, estabilidad interna); fabrica reclamaciones;
pide la paz con términos según el marcador; una propuesta en paz al año (alianza, pacto, comercio, paso,
rehenes, tributo, protección, embajada o regalos); bodas y asesinatos. Al jugador: buzón propio
`G.dip.buzon[f]` (máx. 3 propuestas), atendido en `inicioTurno`. `G.inbox` solo para `marry`.

## Sociedad (G.dip.soc[f])

**Estamentos** (4 por pueblo, `SOC_PUEBLO[CIV[f].id]`; lealtad `l` 0–100 e influencia `i` que suma ~100).
Claves comunes: `nob` élite de la tierra, `ari` aristocracia guerrera, `ej` ejército, `cle` clero (nombre
según la fe), `pro` mercaderes/letrados/provinciales, `pue` pueblo llano. Si un acto toca una clave que el
pueblo no tiene, lo siente la equivalente (`SOC_RESP`: nob→ari/pro, ej→ari/nob...).

| Pueblos | Estamentos |
|---|---|
| occ, ori | Senado · Iglesia · Ejército · Plebe y colonos |
| vis, van, fra | Aristocracia guerrera · Clero · Provinciales romanos · Hombres libres |
| hun / mon | Lógades / Noyanes · Chamanes · Jinetes de los clanes / Tumenes · Pueblos sometidos / Arats |
| per | Grandes casas · Magos · Savaran · Campesinos |
| ara | Jeques de las tribus · Kahines · Mercaderes de caravana · Beduinos y oasis |
| nor / esl | Jarls / Boyardos · Godar / Volkhvy · Huscarles / Druzhina · Karls y thralls / Comunidades del mir |
| chi | Mandarines · Letrados del rito · Ejército imperial · Campesinos |
| inc | Curacas · Sacerdotes del Sol · Orejones · Ayllus |
| may / azt | Linajes nobles / Pipiltin · Sacerdotes · Mercaderes / Órdenes guerreras · Campesinos de la milpa / Macehualtin |
| gri / egi | Eupátridas / Nomarcas · Sacerdotes y oráculos / de Amón · Comerciantes del ágora / Escribas · Demos / Campesinos del Nilo |
| ind / cel | Kshatriyas / Nobles guerreros · Brahmanes / Druidas · Vaishyas / Artesanos y bardos · Shudras / Clanes libres |

Cada año la lealtad se acerca un 25 % a su **objetivo** (motivos visibles en el panel: impuestos,
guerras, hambre, templos, mercados, fe, política religiosa, consejeros, rasgo del soberano, regencia,
legitimidad del heredero). Los actos dan impulsos: batallas, conquistas, guerra y paz, bodas reales,
edificios, revueltas, crisis económicas, sucesión.

Efecto `x = (l−50)/50 · i/25`:
- nob: ±10 % oro, ±4 orden.
- ari: ±6 % batalla, ±4 orden.
- cle: ±5 orden, ±12 % saber.
- ej: ±8 % batalla.
- pue: ±10 % comida, ±5 orden.
- pro: ±8 % oro, ±10 % saber.

Acciones: conceder (oro o grano, +12 lealtad, +2 poder, una al año) y recortar poder.
**Demandas** (30 %/año del estamento más descontento): donativo, grano, bajar impuestos, templo, celo,
guerra, paz, un consejero de su linaje, un jefe militar. Pueden ser inmediatas o promesas a 3 años (+12 si
se cumplen, −15 si no).
**Crisis**: lealtad < 25 → conjura, motín, anatema o revueltas. Dos estamentos < 22 con ≥ 45 % del poder →
guerra civil (hasta 4 provincias pasan a rebeldes, con `revuelta`). Lealtad ≥ 80 → favores. Las tropas que
se dan o se alzan pasan por `socTropa`: respetan `civPuede(f, t)` y nunca son `UN[t].merc` ni de asedio.

**Consejo**: canciller (diplomacia: aceptación), magister militum / spahbed / gran mariscal / estratego /
jefe de la hueste (mando: batalla, ejército), tesorero (gestión: oro; si es codicioso o desleal, desfalca),
cabeza del clero según la fe (obispo, mobad, godi mayor, ministro de Ritos, Willaq Umu, hierofante,
purohita, archidruida, gran chamán…: orden y saber), maestro de espías (intriga: asesinatos,
reclamaciones, defensa ante conjuras). Pueden ocuparlo parientes, mandos o nobles llamados (25 oro,
`c.dipCort`). Nunca son herederos, pero heredan si se extingue la sangre real.

**Personajes**: rasgos nuevos (Leal, Codicioso, Erudito, Justo, Belicoso, Paranoico), ambición `amb` y
lealtad al soberano `lea`. Con lealtad baja y ambición alta: alzarse con su provincia o su gobierno,
conjura o usurpación, o huida a una corte rival. Un heredero que no sea el primogénito, una mujer en pueblos
guerreros (`SOC_GUERRERO`), un heredero sin dotes o cruel → penalización a los estamentos (con aviso
previo) y agravio del postergado.

**Religión**: cada provincia tiene fe (`p.dipFe`; en tierra rebelde, la del pueblo con la capital más
cercana). La tensión es el % de tierras de otra fe. Política tolerancia/neutralidad/celo: orden −1/−4/−8 en
tierras de otra fe, conversión 2/4/10 % al año más los templos. `SOC_CLE`/`SOC_FEN`/`SOC_OBI` cubren
las 15 religiones. Conversión del reino al credo niceno o arriano (60 oro, cada 15 años) para las fes de
`SOC_CONV` (pagana, nórdica, eslava, druídica, Tengri, arriana); se guarda en `G.dip.soc[f].fe` y se
reaplica a `CIV[f].rel` en `partidaLista`.

## Mandos de carrera y gobernadores

**Mandos** (`linaje: false`, `rol: 'capitan'|'general'`, creados por combate): no heredan ni se casan y no
aparecen en la Dinastía (`heirCands`, `bachelors`, rehenes, acciones `heir`/`marry`). Se listan en
Corte → «Mandos y gobernadores» con su nivel (`cmbNivel`), mando, gestión, influencia y lealtad. Si se
extingue la sangre real, un general de nivel ≥ 4 puede ser aclamado soberano (pasa a `linaje: true`).

**Gobernadores** (`p.gob` = id). Pueden gobernar:
- los parientes adultos;
- los mandos de nivel ≥ 3 (`SOC_GOB_NIVEL`).

No puede gobernar el soberano, un rehén, quien manda un ejército en campaña (`G.cam.ej[].gen`) ni quien ya
gobierna otra ciudad. Si alguna condición deja de cumplirse, `socGob(p)` lo retira.

Se nombran desde:
- la sección de provincia «Gobernador» (`OC.seccion('prov', {id:'gobierno', orden:36})`);
- el botón «Gobernar» de cada mando en la Corte.

Efectos en su ciudad (`socGobEf`, nivel `n`):

| Efecto | Fórmula | Pasa por |
|---|---|---|
| Oro | `+3 %·(gestión−4) +1 %·n` | `rendimiento` |
| Comida | `+2 %·(gestión−4)` | `rendimiento` |
| Orden | `+0,8·(diplomacia−4) +0,5·n` (Justo +3, Cruel −3; −3 si desleal) | `ordenObjetivo` |
| Levas | `−(1,5 %·(mando−4) +0,5 %·n)` | `costeUnidad` con `p` |
| Defensa | `+1 %·(n + mando − 4)`, máx. 15 % | `bonoBatalla`, lado defensor |
| Saber | `+1 % por intriga > 4` de cada gobernador, máx. +15 % | `puntosInvestigacion` (no trae `p`: va al reino) |

Gobernar da +3 de experiencia y +0,2 de fama al año.

**Influencia** (`socInfluencia`): `nivel·8 + fama·2 + 2/año de gobierno (máx. 20) + 10 si es de la
sangre real`. Un gobernador con influencia ≥ 45, ambición ≥ 6 y lealtad < 30 puede alzarse (8 %/año, no en
la capital): la ciudad pasa a rebeldes con `revuelta` y él la manda. El cargo da +8 de lealtad (+2 si su
influencia ya es ≥ 60). Destituirlo cuesta −10 de agravio. Si la ciudad cae, el gobernador muere (35 %) o
huye.

La IA nombra hasta 2 gobernadores al año (capital y mercados primero; gestión, diplomacia, nivel y
lealtad ≥ 35) y destituye a los desleales.

**Renombrar** (acción `renombrar-<id>`, libre): la registra sociedad (combate solo la suya si falta), para
parientes, soberano y mandos. Usa un modal con un campo de 2-30 caracteres; quita etiquetas y `<>&"'`\`.
Botones ✎ en Dinastía y en Mandos.

## Ganchos

- **Emite**:
  - `guerraDeclarada` (único camino: `declareWar`, también desde mapa y narrativa);
  - `pazFirmada`, `alianzaSellada`;
  - `bodaCelebrada` (en `marry`, salvo las del arranque);
  - `muertePersonaje` (en `kill`, antes de la sucesión);
  - `sucesion` `{f, anterior, nuevo}` (personajes);
  - `revuelta` (línea `/* OC */`) en traiciones, alzamientos de gobernadores y guerras civiles.
- **Llama**: `aceptacionDiplomatica` (ctx `{f, g, tipo, ...términos}`; tipos `paz, alianza, nag,
  comercio, paso, rehenes, vasallaje, tributo, embajada, boda, llamada`).
- **Modifica**:
  - `rendimiento`, `ordenObjetivo`, `bonoBatalla` (estamentos, consejo, paso, gobernador defensor);
  - `costeUnidad` (gobernador de la ciudad);
  - `puntosInvestigacion`.
- **Escucha**:
  - partida y turnos: `partidaLista`, `inicioTurno`, `economiaFaccion` (año social), `turnoIA` (IA de corte y gobernadores);
  - guerra: `batallaResuelta`, `conquista` (también el gobernador de la plaza);
  - diplomacia y corte: `guerraDeclarada`, `pazFirmada`, `alianzaSellada`, `bodaCelebrada`, `sucesion`;
  - otros sistemas: `edificioConstruido`, `revuelta`, `crisisEconomica`, `tecnologiaInvestigada`, `eraNueva`.
- **Usa**:
  - de economía: `OC.pagar/ganar/saldo`, `inc(f).gi`, `G.eco.rutas`, `comMotivo/comValor/comAbrir`,
    `comPrecio`;
  - de combate y campaña: `cmbNivel`, `camS().ej`;
  - de Mundo: `civPuede`, `civBase`, `CIV[f].id`;
  - de narrativa: `narApodoActual` (apodo del soberano en Diplomacia).

  Todo con comprobación de existencia.
- **API**:
  - diplomacia: `dipTr`, `dipTratados`, `dipSenor`, `dipVasallos`, `dipAliados`, `dipGuerras`, `dipCB`,
    `dipAceptacion`, `dipRutas`, `dipMem`;
  - corte: `socCargo(f,k)`, `socLealtad(f,k)`, `socEstabilidad(f)`;
  - gobernadores: `socGob(p)`, `socPuedeGobernar(f,c,p)`, `socInfluencia(c)`, `socGobEf(c)`.
- **Paneles**: `dip` (reescrito), `dyn` (reescrito), `corte` (orden 25); sección de provincia `gobierno` (36).
- **Acciones**:
  - diplomacia: `dipp`, `dipemb`, `diprec`, `dipcan`, `gift`, `war`, `peace`, `ally`, `asn`;
  - dinastía: `heir`, `marry`;
  - corte: `socdon`, `socrec`, `socpol`, `socconv`, `soccar`;
  - gobierno: `socgob`, `socgobc`, `renombrar`.

Partidas antiguas: `dipSync` (en `partidaLista`) crea `G.dip`, los tratados de alianza y las guerras desde
`G.st`, y la ambición y lealtad de los personajes. Probado en `pruebas/diplomacia.js`, que cubre tratados,
llamadas, gobernadores, renombrar, 30 años de IA, la partida antigua y un mundo de leyendas con 12 pueblos.

## Peticiones al orquestador

1. **Narrativa**: `life()` casa a cualquier soltero de `family(f)` de la IA, también a los mandos
   `linaje:false`. Debería filtrar `c.linaje !== false`. El «Concilio de obispos» podría usar
   `socPolitica`/`socImp`.
2. **Combate**: `cmbMandosHtml` podría mostrar «gobierna X» (`socGob`) y el botón de gobernar (acción
   `socgobc-<id>`). El derecho de paso solo da `bonoBatalla`; mover tropas por tierras del socio exigiría
   que campaña consulte `dipTr(f, dueño, "paso")`.
3. **Tecnología**: `puntosInvestigacion` no recibe `p`. Si `tecPuntosCiudad` llamara a un cálculo con
   `p`, el saber del gobernador iría a su ciudad y no al reino.
4. **Interfaz**: el panel de provincia lista las 18 clases, incluso con 0 tropas; la sección del
   gobernador queda muy abajo. Las pestañas ya son 8 o más.
5. **Mundo**: en leyendas no hay disputas de credo entre las religiones nuevas, solo la memoria
   «Misma fe». Podría añadirse en `newGame`, que ahora es de Mundo.
