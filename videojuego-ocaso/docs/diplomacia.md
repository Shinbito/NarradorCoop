# Diplomacia y sociedad — Ocaso del Imperio

Archivos: `js/diplomacia.js` (tratados, opinión, reputación, casus belli, IA diplomática, panel
Diplomacia), `js/sociedad.js` (estamentos, consejo, lealtad de personajes, religión, pestaña Corte),
`js/partida.js` (partida nueva, sucesión, panel Dinastía), `css/diplomacia.css`,
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

**IA** (`aiDiplo`, desde `ai()`): personalidad por pueblo (agresividad, honor, negociación, codicia:
hunos y vándalos belicosos y codiciosos, Oriente negociador, sasánidas de palabra) ajustada por el rasgo
del soberano. Declara la guerra según deseo (frontera, fuerza propia contra la del rival y sus aliados,
opinión, casus belli, tratados vigentes, otras guerras, estabilidad interna); fabrica reclamaciones;
pide la paz con términos según el marcador; una propuesta en paz al año (alianza, pacto, comercio, paso,
rehenes, tributo, protección, embajada o regalos); bodas y asesinatos. Al jugador: buzón propio
`G.dip.buzon[f]` (máx. 3 propuestas), atendido en `inicioTurno`. `G.inbox` solo para `marry`.

## Sociedad (G.dip.soc[f])

**Estamentos** (4 por cultura, lealtad `l` 0–100 e influencia `i` que suma ~100):
romanos Senado/Iglesia/Ejército/Plebe; godos, vándalos y francos Aristocracia guerrera/Clero/Provinciales
romanos/Hombres libres; hunos Lógades/Chamanes/Jinetes/Pueblos sometidos; persas Grandes casas/Magos/
Savaran/Campesinos. Cada año la lealtad se acerca un 25 % a su **objetivo** (motivos visibles en el
panel: impuestos, guerras, hambre, templos, mercados, fe, política religiosa, consejeros, rasgo del
soberano, regencia, legitimidad del heredero). Los actos dan impulsos: batallas, conquistas, guerra y
paz, bodas reales, edificios, revueltas, crisis económicas, sucesión.

Efecto `x = (l−50)/50 · i/25`: Senado/Grandes casas ±10 % oro ±4 orden; Aristocracia ±6 % batalla ±4
orden; Clero ±5 orden ±12 % saber; Ejército ±8 % batalla; Pueblo ±10 % comida ±5 orden; Provinciales ±8 %
oro ±10 % saber. Acciones: conceder (oro o grano, +12 lealtad, +2 poder, una al año) y recortar poder.
**Demandas** (30 %/año del estamento más descontento): donativo, grano, bajar impuestos, templo, celo,
guerra, paz, un consejero de su linaje, un jefe militar. Inmediatas o promesas a 3 años (+12 / −15).
**Crisis**: lealtad < 25 → conjura, motín, anatema o revueltas; dos estamentos < 22 con ≥ 45 % del poder →
guerra civil (hasta 4 provincias pasan a rebeldes). Lealtad ≥ 80 → favores.

**Consejo**: canciller (diplomacia: aceptación), magister militum (mando: batalla, ejército), tesorero
(gestión: oro; si es codicioso o desleal, desfalca), obispo/gran sacerdote/mobad (orden y saber), maestro
de espías (intriga: asesinatos, reclamaciones, defensa ante conjuras). Parientes o nobles llamados (25 oro,
`c.dipCort`, nunca herederos; heredan si se extingue la sangre real).

**Personajes**: rasgos nuevos (Leal, Codicioso, Erudito, Justo, Belicoso, Paranoico), ambición `amb` y
lealtad al soberano `lea`. Lealtad baja + ambición alta → alzarse con su provincia, conjura/usurpación o
huida a una corte rival. Designar un heredero que no sea el primogénito, mujer en culturas guerreras,
sin dotes o cruel → penalización a los estamentos (aviso previo) y agravio del postergado.

**Religión**: cada provincia tiene fe (`p.dipFe`); tensión = % de tierras de otra fe. Política
tolerancia/neutralidad/celo (orden −1/−4/−8 en tierras de otra fe, conversión 2/4/10 % al año + templos).
Conversión del reino (60 oro, cada 15 años; la IA franca/goda puede hacerlo): se guarda en
`G.dip.soc[f].fe` y se reaplica a `CIV[f].rel` en `partidaLista`.

## Ganchos

- **Emite**: `guerraDeclarada` (único camino: `declareWar`, también desde mapa y narrativa),
  `pazFirmada`, `alianzaSellada`, `bodaCelebrada` (en `marry`, salvo las del arranque),
  `muertePersonaje` (en `kill`, antes de la sucesión), `sucesion` `{f, anterior, nuevo}` (personajes).
- **Llama**: `aceptacionDiplomatica` (ctx `{f, g, tipo, ...términos}`; tipos `paz, alianza, nag,
  comercio, paso, rehenes, vasallaje, tributo, embajada, boda, llamada`).
- **Modifica**: `rendimiento`, `ordenObjetivo`, `bonoBatalla` (estamentos, consejo, paso),
  `puntosInvestigacion`.
- **Escucha**: `partidaLista`, `inicioTurno`, `economiaFaccion` (año social), `turnoIA` (IA de corte),
  `batallaResuelta`, `conquista`, `guerraDeclarada`, `pazFirmada`, `alianzaSellada`, `bodaCelebrada`,
  `sucesion`, `edificioConstruido`, `revuelta`, `crisisEconomica`, `tecnologiaInvestigada`, `eraNueva`.
- **Usa de economía**: `OC.pagar/ganar/saldo`, `inc(f).gi`, `G.eco.rutas`, `comMotivo/comValor/comAbrir`,
  `comPrecio` (todo con comprobación de existencia).
- **API**: `dipTr`, `dipTratados`, `dipSenor`, `dipVasallos`, `dipAliados`, `dipGuerras`, `dipCB`,
  `dipAceptacion`, `dipRutas`, `dipMem`, `socCargo(f,k)`, `socLealtad(f,k)`, `socEstabilidad(f)`.
- Paneles: `dip` (reescrito), `dyn` (reescrito), `corte` (orden 25). Acciones: `dipp`, `dipemb`, `diprec`,
  `dipcan`, `gift`, `war`, `peace`, `ally`, `asn`, `heir`, `marry`, `socdon`, `socrec`, `socpol`,
  `socconv`, `soccar`.

Partidas antiguas: `dipSync` (en `partidaLista`) crea `G.dip`, tratados de alianza y guerras desde
`G.st`, y ambición/lealtad de los personajes. Probado en `pruebas/diplomacia.js`.

## Peticiones al orquestador

1. **Combate**: el derecho de paso solo da `bonoBatalla`; si se quiere mover tropas por tierras del
   socio, `march`/`settle` podrían consultar `dipTr(f, dueño, "paso")`. `ia.js` podría evitar nombrar
   generales a rehenes (`c.dipReh`) y preferir no atacar con tregua (ya lo frena `aiDiplo`).
2. **Economía**: en guerras civiles la sociedad pasa provincias a `REB` sin emitir `revuelta` (es
   evento de economía). Si se prefiere, permitir que sociedad lo emita.
3. **Interfaz**: la barra de pestañas tiene ya 7–8 botones; quizá conviene una rejilla de 4 más
   compacta. El modal de ataque desde el mapa no muestra el coste en reputación ni los aliados que
   acudirán; podría llamar a `dipModalGuerra(g)` y atacar después.
4. **Narrativa**: el evento «Concilio de obispos» podría usar `socPolitica`/`socImp` (clero) además del
   orden; `inboxItem` puede seguir con `peace/ally/marry`, las propuestas nuevas van por `G.dip.buzon`.
5. **Contrato**: anotar el ctx ampliado de `aceptacionDiplomatica` y que `sucesion` pasa personajes.
