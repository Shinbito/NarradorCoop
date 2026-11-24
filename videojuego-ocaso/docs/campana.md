# Campaña — ejércitos en el mapa, estaciones, asedios y mercenarios

Archivos: `js/ejercitos.js` (modelo, caminos, órdenes, asedios, estación), `js/mercenarios.js`
(compañías, campamentos, contratos), `js/ia.js` (IA anual de reclutamiento y IA de campaña por
estación), `js/campana.js` (`march`/`settle`, traslados instantáneos entre provincias vecinas que la IA
usa para llevar guarniciones al frente, y la interfaz de campaña; el motor automático se mudó a
`batalla.js`, de combate), `css/campana.css`,
`pruebas/campana.js`. En `js/interfaz.js`: `drawMap` (llama a `camDibujar`), clic/hover del mapa (llaman
a `camClic`/`camHoverTxt`) y `provPanel` (panel del ejército seleccionado y sección «Ejército»), todo
marcado con `CAM`. En `js/turnos.js`: el bucle de estaciones. Estado: `G.cam` y `G.estacion`.

## Turno = estación

`G.estacion` 0 primavera, 1 verano, 2 otoño, 3 invierno. «Fin de la estación» (`endTurn`) llama a
`finEstacion()`:
1. `camEstacion()`: la IA de cada reino da sus órdenes (`camIA`) y las bandas rebeldes las suyas
   (`camIARebeldes`); **todas las marchas se resuelven a la vez** (`camResolverSimultaneo`); luego
   asedios, obras de máquinas, víveres/soldada/desgaste y la paga de los mercenarios.
2. Evento nuevo **`finEstacion` `{anio, estacion}`** (async).
3. Si era invierno: `G.estacion = 0` y `finDeAnio()` = el antiguo `yearEnd` (antesFinAnio, economía,
   `economiaFaccion`, IA anual `ai(f)` + `turnoIA`, envejecer, año nuevo, `finAnio`). Si no, `estacion++`.
4. `camNuevaEstacion()`: movimiento nuevo para todos, `p.tired = false`, en primavera campamentos
   mercenarios nuevos y vencimiento de contratos, y las marchas pendientes del jugador continúan.

`yearEnd()` conserva su sentido (un año entero: ejecuta las estaciones que falten), así que el modo
online (`endOnline`) y las pruebas que lo llaman siguen funcionando. **Estaciones rápidas** (opción de
la pestaña Campaña, activada por defecto): si el jugador no tiene ejércitos fuera ni cercos que le
toquen, el botón hace pasar el año entero (las demás potencias mueven igualmente estación a estación).
El botón dice qué termina (`camTextoFin()`: «Fin del verano ▶» / «Fin del año ▶») y el mapa muestra
la estación arriba a la izquierda.

## Ejércitos

`G.cam.ej = [{id, f, x, y, u:{tipo:n}, vet, ori, gen, mov, est, sum, fat, mor, her, maq, obra, asd, plan,
pas, nom, obj, vida}]`
- `x, y`: **casilla** de `MAP.grid` (se mueve por casillas, no por provincias). `est`: `marcha`,
  `campamento`, `asedio`. `sum`: estaciones de víveres (máx. 3). `fat` cansancio 0-100, `mor` moral.
  `her` heridos graves en los carros (vuelven al acampar o en tierra propia: la mitad por estación).
  `maq` máquinas (si combate no ha definido `UN[ari/tor/cat]`; si existe, van en `u`). `obra` máquinas
  en construcción `[{t, q: estaciones que faltan}]`. `plan` marcha de varias estaciones
  `{x, y, luego, p, con}`. `pas` huella de la última marcha. `obj` objetivo de la IA.
- Se **forma** sacando tropas de una provincia (veteranía y origen viajan con ellas, el general de la
  provincia va al mando si se pide) y aparece en la casilla de la ciudad. Se **disuelve** dentro de una
  provincia propia (las tropas vuelven a `p.u` con `cmbLlega`). Marchar a una ciudad propia = entrar y
  acuartelarse. **Dividir** (la mitad) y **unir** (misma casilla).
- Las guarniciones siguen en `p.u`. Las partidas antiguas sin `G.cam` lo crean vacío; las guarniciones
  no se tocan.

### Movimiento (por casillas)

Alcance por estación (`camMovMax`) = `UN[t].mv` de la clase más lenta × 4 (+ mando del general × 0,3);
×0,6 en invierno; ×0,8 con cansancio > 70; máquinas de asedio: mv 1,6. Infantería ≈ 10-12 puntos,
caballería ≈ 17-22. Coste de entrar en una casilla (`camCoste`): llanura 1, bosque 2, colinas 2,5,
+0,5 en llanuras de provincias con río (vados); ×0,7 en tierra propia o aliada con **Calzadas**
(`tecTiene(f, "vias")`); ×1,25 en tierra ajena; diagonal ×1,41 (sin cortar costas). El mapa no tiene
montañas: las colinas hacen ese papel. Caminos con Dijkstra determinista (`camDijkstra`, desempate por
índice de casilla).
- **Zona de control**: entrar junto a un ejército enemigo (en guerra) detiene la marcha; desde ahí solo
  se puede atacarle. Las casillas de ejércitos de reinos en paz no se pisan.
- **Animación**: solo con `opc.anim` (órdenes del jugador): pausa por paso de 55 ms × `ifzVel()` (la
  interfaz, «lenta» ≈ 2,5) y `ej.anim = {x0, y0, t0, dur}` para que la interfaz interpole entre casillas
  (se borra al acabar el paso). La IA, las pruebas y el online resuelven sin pausas.
- **Derecho de salida** (orquestador, `camPaso(f, o, ej)`): un ejército que queda en tierra de un reino
  en paz (un tercero conquistó la provincia) puede cruzarla para salir. Cada estación que siga allí
  suma `ej.intruso` (aviso en la crónica la primera vez; desde la tercera, −2 de relación con el
  dueño) y la IA lo saca antes que nada.
- **Fronteras**: no se entra en tierra de un reino en paz sin derecho de paso (`dipTr(f, dueño, "paso")`)
  o alianza; el jugador recibe la opción de declarar la guerra (`dipModalGuerra`). Rebeldes: siempre.
- Ciudades hostiles con defensores o murallas no se cruzan: se **asedian** desde una casilla vecina.
  Una ciudad vacía y sin murallas se ocupa al entrar.
- Lo que no alcanza en una estación queda en `plan` y sigue sola en la siguiente (jugador) o la IA
  la recalcula.

Interfaz: clic en un ejército → se selecciona (parpadea), se iluminan las casillas alcanzables (blanco),
en rojo las ciudades que puede asediar y los enemigos que puede atacar; al pasar el ratón se dibuja la
ruta (puntos claros dentro del alcance, tenues más allá). Clic en el destino → marcha animada paso a
paso. Panel: composición, marcha restante, víveres, cansancio, moral, general (dar/retirar el mando),
máquinas, asedio y botones Acampar, Asediar, Asaltar, Ariete/Torre/Catapulta, Levantar el cerco,
Disolver, Dividir, Unir, contratar mercenarios del campamento vecino. Pestaña «Campaña» (orden 16):
ejércitos propios, enemigos en tu tierra, asedios, contratos y campamentos mercenarios.

### Víveres, soldada y desgaste (cada estación, `camSuministros`)

- Soldada: `ecoMant(f, t).oro / 4` por leva y estación, del tesoro (la economía no ve los ejércitos
  fuera de `p.u`; ver peticiones). Comida: en tierra propia o aliada `ecoMant.comida / 4` del granero y
  víveres al máximo; fuera, −1 estación de víveres (−2 en invierno).
- **Campamento** fortificado: cuenta como murallas 0,6 si le atacan; −40 de cansancio, +8 de moral,
  cura heridos. En tierra ajena **forrajea** (+1 víveres) y **saquea** una vez por estación:
  `2 + 0,45·población` de oro, −6 de orden, −2 % de población (`ecoDiezmar`), −2 de relación.
- Sin víveres: −12 % de hombres y −15 de moral por estación. Invernar fuera de tierra propia: −4 %
  (−2 % acampado). Moral < 25: −6 % por estación (no mercenarios).

## Encuentros en campo abierto

Entrar en la casilla de un ejército enemigo = batalla (`camChoque`) con el terreno de la casilla
(`camTerrCasilla`: llanura, bosque, colinas o vado según la casilla y sus vecinas) y `fort` 0 (0,6 si el
defensor está acampado). El jugador elige táctica o automática si interviene (también cuando defiende:
se pasa `ctx.jugador = 1`). El vencido se retira hasta 2 casillas lejos del vencedor (preferencia por
tierra propia, evitando zonas de control); si no puede o le queda < 12 % de sus hombres, se dispersa
(el general puede morir). **Socorro**: si el atacado está asediando una ciudad del atacante (o de su
aliado), media guarnición sale a la vez y vuelve después. Se emite `batallaResuelta` con
`campana: 'encuentro' | 'asalto' | 'salida'` además de los campos de siempre.

### Batalla en conjunto (encuentros de varios ejércitos)

- Cuando un ejército A choca con D (entra en su casilla), acuden de cada bando los ejércitos **propios y
  aliados en guerra con el otro bando** (`camBandoDe`; si alguno sirve a ambos, no acude) que estén a 1
  casilla del punto de la batalla, o a 2 si les queda marcha y no están asediando (`camCandidatos`).
- **Quién se suma** (`camReunir`): el jugador elige en un modal «¿Quién acude a la batalla?» (casillas
  marcadas por defecto según `ej.apoyo`; «Solo el que choca» para ir solo). La IA se suma salvo que su bando
  ya vea la batalla ganada (≥ 85 % con `cmbEstimar`). Un ejército humano sin modal (online, `opc.auto`)
  sigue `ej.apoyo`: `'siempre'` (por defecto), `'nunca'` o el id del ejército al que apoya. Orden
  serializable «unirse a la batalla»: `{tipo:'apoyo', f, ej, modo:'siempre'|'nunca'|id}`; en el panel, botón
  «Acude / No acude a batallas vecinas».
- Cada participante lleva `ej.dir` (N/E/S/O respecto al punto; el defensor, `C`).
- **Motor**: con `cmbResolverMulti` / `cmbTacticaMulti` de combate v3 (detectado con `typeof`), cada
  ejército va por separado (`camMulti`): `[{id, f, bando: 0|1, dir, u, gen, vet, ori, fat, hambre}]`, y se
  espera `{gana: bando, ejs: [{id, u: supervivientes}], informe}` (si no llega esa forma, se usa la
  alternativa). Los que acuden desde **2 casillas** no empiezan la batalla: van en `ctx.refuerzos =
  [{ej, dir, llegada}]` con `llegada` = 10 s por casilla (20 s) y en `batallaResuelta.ejercitos` llevan
  `tarde` (segundos). Alternativa actual: cada bando se funde (`camFuerzaConjunta`, sin máquinas en campo
  abierto) y se libra con `camLibrar`; el mejor general manda cada bando y los demás suman +3 % (máx. +9 %)
  a su lado. Supervivientes, heridos y veteranía se reparten por ejército según lo aportado (`camRepartir`),
  así cada aliado de otra facción conserva su color, sus tropas y su parte. Los vencidos se retiran o se
  dispersan uno a uno.
- `batallaResuelta` lleva `ejercitos: [[{id, f, dir}], [{id, f, dir}]]` (también en los asaltos: la
  guarnición va como `{id:'guarnicion'}`) y `multi: true` si la resolvió el motor de varios bandos. La
  repetición graba `{k:'bat+', x, y, lados}` antes de la batalla (además del `bat` de siempre).
- **Mapa**: mientras se prepara (`camBatPrep`), flechas del color de cada pueblo desde cada participante
  hasta el punto de choque, los candidatos que se están preguntando parpadean, y espadas cruzadas en el
  centro.
- El asalto conjunto usa el mismo camino de varios bandos (cada ejército con su flanco como `dir`, su
  facción y su general; la guarnición como bando 1) en cuanto exista `cmbResolverMulti`; hasta entonces,
  la fusión de siempre.

## Asedio

`G.cam.as[pid] = {p, f, n (estaciones), vi (víveres de la guarnición), mo (moral), brecha, ini}`.
- Empieza con la orden `asediar` desde una casilla vecina de la ciudad (o al llegar con `luego:
  'asediar'`). Víveres iniciales: `2 + murallas + 1 capital + 1 con granja`. Moral `70 + 5·murallas`.
- Cada estación: `n+1`, `vi−1`, moral −6; sin víveres, −12 % de la guarnición y −12 de moral; −1/−3 %
  de población y −2/−5 de orden. Las **catapultas** bombardean (−3 % de la guarnición cada una) y abren
  **brecha** (+0,25 de muralla por catapulta y estación).
- **Rendición** cada estación con probabilidad `0,03·n + 0,22 (hambre) + (100 − moral)/300 −
  0,2·ecoApoyoAsedio(p, sitiador) + 0,08 (sitiador > 3× más fuerte) − 0,05 (capital)` (máx. 0,85).
  **Puertas abiertas**: con apoyo < −0,4, probabilidad `−apoyo × 0,25` de traición. Sin guarnición, la
  ciudad cae. Rendida: murallas intactas, orden ≤ 50, la guarnición cae prisionera.
- **Salidas**: la IA sitiada sale si `cmbEstimar` ≥ 0,67 contra el sitiador más débil; el jugador tiene
  el botón «Hacer una salida». Si gana, el sitiador se retira o se dispersa.
- **Máquinas** (`CAM_MAQ`, se pagan con `OC.pagar` al encargarlas; sin madera, 3 de oro por unidad que
  falte): ariete 1 estación (14 madera, 4 oro), torre 2 estaciones (26 madera, 8 oro), catapulta
  2 estaciones (18 madera, 3 hierro, 10 oro; además bombardea cada estación de cerco). Máximo 2/2/3.
  Como combate ya define `UN.ari/tor/cat` (`asedio: true`, en `TYP`), se añaden a `ej.u[k]` y van
  **como unidades en `ejA.u`** al asalto: combate calcula su brecha y sus torres. (Sin combate v2 irían a
  `ej.maq[k]` y campaña restaría −1/−0,75/−0,4 niveles de muralla.) No se llevan de campaña: se
  abandonan al levantar el cerco o tomar la ciudad (y no luchan en campo abierto: `camUCampo`).
- **Asalto** (`camAsaltar`): `cmbTactica`/`cmbResolverAuto` con `ejA.u` = ejército + máquinas,
  `ejA.gen` = su general y `ctx = {fort: murallas − brecha del bombardeo (camFortEf), murallas: nivel
  bruto, asedio: estaciones de cerco, maquinas: {ari, tor, cat}, p, terreno, nombreLugar}`; la guarnición
  lleva `hambre` si no le quedan víveres. Si gana: conquista (murallas −1, `conquista`, botín vándalo,
  capital, fin de reinos), una cuarta parte del ejército queda de guarnición y el resto sigue en campaña
  desde la ciudad. Si pierde: la IA levanta el cerco si quedó muy débil.
- **Capitanes**: si de una victoria de un ejército sin general surge un capitán (combate,
  `cmbCapitanSurge`), campaña le da el mando de ese ejército (en vez de la provincia).
- Cada ejército asalta como mucho **una vez por estación** (`ej.acc = "año.estación"`).

### Cerco por flancos y asalto conjunto

- **Flancos**: las 8 casillas vecinas de una ciudad forman 4 lados, cada uno una recta y una diagonal
  en sentido horario: N = (0,−1)(1,−1), E = (1,0)(1,1), S = (0,1)(−1,1), O = (−1,0)(−1,−1)
  (`camFlanco(dx, dy)`). `camFlancosDe(f, p)` → `{ejs, lados}`: ejércitos de f (y de sus aliados en
  guerra con el dueño) junto a la ciudad y lados que cubren.
- Al asediar con un segundo ejército, `camJuntoA` busca un **flanco libre** (sin ejército propio ni
  casilla ocupada) si se alcanza esta estación o cuesta poco más (≤ 4 puntos o 40 % del alcance) que el
  lado cubierto más cercano.
- **Asalto conjunto**: `{tipo:'asaltar', f, ej, p?, con:[ids]}` (o `mover` con `luego:'asaltar'` y
  `con`). Atacan en **una** batalla `ej` y los de `con` que sigan junto a la ciudad y no hayan asaltado
  esta estación (`camParticipantes`; los aliados solo si no los lleva una persona). Fuerza conjunta
  (`camFuerzaConjunta`): tropas y máquinas sumadas, veteranía ponderada por hombres, origen de quien
  más aporta, al mando el mejor general (mando, luego experiencia) y +3 % de daño por cada general más
  (máx. +9 %, `OC.mod('bonoBatalla')` solo durante ese asalto). `F.por` guarda el desglose por ejército
  y facción para cuando combate tenga batallas de varios bandos (`cmbResolverMulti`).
- **Ventaja por flancos** (k lados): solo se pasa `ctx.flancos = k`; combate v3 lo aplica de forma nativa
  (murallas ×(1 − 0,18·(k−1)), −4·(k−1) de moral a la guarnición y menos frente). En la prueba, la misma
  fuerza toma la ciudad ≈88 % de las veces por 3 flancos frente a ≈20 % por 1. El informe lleva al frente el
  factor «Asalto por k flancos».
- **Reparto**: supervivientes de cada clase en proporción a lo aportado (restos mayores,
  `camRepartir`), heridos y veteranía por ejército; botín de la ciudad (`4 + 0,4·población` de oro)
  repartido por bandos según fuerza aportada. Si se gana entra en la ciudad el que más aportó y los
  demás quedan junto a ella; si se pierde, cada uno sigue (la IA levanta el cerco si quedan débiles).
- **Interfaz**: el modal de la ciudad rival muestra «Tus ejércitos junto a la ciudad: N · flancos
  cubiertos k/4» y ofrece «Asalto conjunto (N ejércitos, k flancos)»; el panel del ejército, la
  estimación conjunta y el botón. En el mapa (`camDibujarCerco`, llamado desde `ifzCamDibujar`, marcado
  CAM): marca del color del sitiador en cada lado ocupado, flechas de cada ejército hacia la ciudad,
  esquinas doradas en los ejércitos que participarían al seleccionar uno y una animación breve del
  asalto conjunto (columnas que convergen y estallido).
- **Táctica**: el asalto conjunto se libra con la fuerza sumada en un solo bando; desplegar a los
  atacantes por varios lados del campo táctico queda para combate (no se toca `batalla.js`).
- **Un cerco es de quien lo puso** (regla del usuario): si A cerca una ciudad, otro bando B —aunque esté
  en guerra con su dueño— no puede asediarla por su cuenta, asaltarla ni ocuparla vacía
  (`camCercoAjeno(f, p)`; también la evita el Dijkstra). Opciones de B: (a) **sumarse al cerco** como
  co-sitiador: automático si es aliado de A; en paz, A decide (`camPedirCerco(B, p)`: la IA acepta con
  relación ≥ 15; el jugador A recibe un modal; fuera de eso, una negativa vale para todo el año,
  `as.no`); los aceptados van en `as.co`, ocupan otro flanco y cuentan para el asalto conjunto. Un
  co-sitiador no asalta solo: su asalto arrastra siempre a los ejércitos de A. **La ciudad es de quien
  inició el cerco** (entra su ejército que más aportó) y el botín se reparte por fuerza aportada.
  (b) Si no, declarar la guerra a A (`dipModalGuerra`) y luchar contra sus ejércitos sitiadores. El modal
  de la ciudad lo dice: «Asediada por X: Unirse al asedio / Declarar la guerra a X». Si A se va y queda un
  co-sitiador, el cerco pasa a él (`camCercoReasignar`). En la resolución simultánea, el primero que
  cerca manda (el segundo queda fuera o se suma si puede). La IA (y las bandas rebeldes) respetan la regla.
- **IA**: si tiene varios ejércitos junto a una ciudad y la estimación conjunta (`camEstimarAsalto`)
  supera 0,6 y mejora en 5 puntos la de uno solo, asalta en conjunto; puede enviar un segundo ejército
  a una ciudad que ya cerca (llega por otro flanco y se suma al cerco).

## Repetición de la estación (CONTRATO §9)

`G.cam.rep = {v:1, anio, est, own0, ej0:[{id, f, x, y, n}], pasos, fin, ajustes}`. Se abre al empezar la
resolución (`camEstacion` → `camRepIni`, que vacía la anterior) y se cierra al acabar `camNuevaEstacion`
(`camRepCerrar`), así que incluye la IA, `camResolverSimultaneo` (órdenes online), batallas, asedios, lo
anual (revueltas, conquistas) y las marchas pendientes del jugador; lo que el jugador mueve en su turno ya
lo vio animado y no se graba. Pasos: `mov` (cada paso de marcha, retiradas, entrada en una ciudad, vuelta a
casa tras la paz), `ej+` (`camNuevoEj`: formar, dividir, desertores), `ej-` (`camQuitar(ej, motivo)`),
`bat` (`camLibrar` y `settle`), `ase` `ini`/`fin` (`camAsedioFin`), `con` (ganchos `conquista` y
`revuelta`). Tope 2000 pasos: pasado, los pasos de marcha de un ejército se funden en su último tramo. Al
cerrar, si algo cambió sin pasar por los ganchos (sucesos, sociedad…) se añade al final y se cuenta en
`ajustes` (0 en la prueba). `camRepEstado(rep, n)` → `{own, ej}` tras aplicar los n primeros pasos (útil
para `ifzRepetir`). Al cerrarla se emite **`repeticionLista` (rep)** (async; la interfaz lanza ahí la
repetición). Con niebla, los pasos `mov`, `ej+`, `bat`, `esp`, `esp-` llevan `vh`: los jugadores humanos que
llegaron a verlos (la repetición de cada uno debería mostrar solo esos). Pasos nuevos de espías: `esp`
(`{esp, f, de, a}`) y `esp-` (apresado).

## Niebla de guerra (en `campana.js`)

- **Visibilidad por facción** (`camVisMapa(f)`, cacheada por movimiento/estación): todas las casillas de
  las provincias propias y aliadas; 3 casillas alrededor de cada ciudad (+2 por nivel de **torre de
  vigilancia**, `tecVision(p)`, que además ve dentro de los bosques a 1 + nivel casillas); ejércitos propios
  y aliados 2 casillas (3 si son mayoría jinetes); espías 3 (y ven dentro de los bosques); las colinas dan +1.
  Disco `dx² + dy² ≤ r² + r`. Los rebeldes ven todo.
- **Bosque**: un ejército en bosque denso (`MAP.bosque`; en mapas antiguos cualquier bosque) solo se ve
  desde 1 casilla, con una torre cerca o con un espía (`camVeEj`). **Emboscada**: quien sale de un bosque
  contra quien no lo veía recibe +20 % de daño (`CAM_K.emboscada`, por `bonoBatalla`) y `ctx.emboscada =
  true` para combate; factor «Emboscada desde el bosque» en el informe.
- **Explorado y memoria**: lo visto queda explorado (`G.cam.exp[f]`, bits en base64, ~430 caracteres) y cada
  ciudad vista deja su última noticia (`G.cam.mem[f][pid] = [dueño, levas, murallas, año, estación]`).
- **API**: `camVisible(f, x, y)`, `camExplorado(f, x, y)`, `camVeProv(f, pid)`, `camVeEj(f, ej)`,
  `camMemProv(f, pid)` → `{o, n, w, y, e, vista}`, `camInfoVisible(p, f)` (para `ecoInfoVisible` de
  economía), `camInfoCiudad(f, q)` (lo que f sabe de una guarnición). Opción «Niebla de guerra» en la
  pestaña Campaña (`G.cam.niebla`, activa por defecto, también en partidas antiguas).
- **Efectos**: sin visión no se ven ejércitos ajenos (mapa, ratón, clics, paneles, objetivos), ni cercos ni
  campamentos mercenarios no explorados; una provincia ajena no vista muestra solo su última noticia (panel
  propio `camPanelNiebla`, texto del ratón) y en el mapa su último dueño y levas bajo un velo; lo no
  explorado es tierra ignota (oscuro). Las rutas se trazan con lo que se ve: el ejército oculto aparece al
  toparse con él (batalla o zona de control). Online: cada cliente dibuja según su facción (`ME`).
- **IA justa**: solo intercepta y persigue ejércitos que ve; elige ciudades y estima asaltos con lo que ve
  o recuerda (`camIAGuarn`, `camIACtxCiudad(q, f)`; sin noticias supone 5 levas).
- **Interfaz** (ganchos CAM en `interfaz.js`): `camDibujarNiebla` al principio de `ifzCamDibujar`
  (escalado a HD), filtros de visibilidad en huellas, campamentos, cercos, objetivos y ejércitos; en
  `provPanel`, panel del espía y de la provincia oculta.

## Espías (en `campana.js`, estado `G.cam.esp`)

- Unidad de mapa propia (no es tropa): `{id, f, x, y, cal (destreza 1-10), mov, mis, nom, plan}`. Se
  recluta en una ciudad propia (30 oro; 20 con **maestro de espías**, `socCargo(f, "esp")`); destreza
  `2 + intriga × 0,7 + azar` (intriga del maestro, o del soberano × 0,6). Máximo `1 + provincias/5 (+1 con
  maestro)`. Marcha 14 casillas por estación en línea recta, sin bloquear ni ser bloqueado.
- **Misiones** (junto al objetivo; se resuelven al acabar la estación): vigilar una ciudad (ve toda su
  provincia, también los bosques), sabotear (máquinas y obras de un ejército; o brecha si la ciudad está
  cercada; o graneros), sobornar la guarnición de una ciudad que cercas tú o tus socios (20 + 2/leva de oro;
  abre las puertas, más fácil si `ecoApoyoAsedio` es bajo), robar una técnica (una que ellos tienen y tú
  puedes aprender: `tecAprender`), incitar revuelta (−15 de orden) y contraespionaje (en tierra propia).
- **Probabilidades**: éxito `clamp(0,35 + 0,06 × (destreza − contraespionaje), 0,1, 0,85)` × dificultad
  (sabotaje 1, revuelta 0,8, soborno 0,6, robo 0,5). Contraespionaje del dueño = intriga de su maestro (o
  soberano × 0,6) + 1,5 por nivel de torre a ≤ 4 casillas + 2 por espía suyo de guardia a ≤ 3. Descubierto
  cada estación en tierra ajena: `0,05 + 0,03 × (contra − destreza)` (+0,08 si actúa, +0,12 si falla); preso:
  −8 de relación (`dipMem`) y agravio de 3 años (casus belli, `dipAgravio`). Los de guardia pueden apresar
  espías ajenos a 3 casillas.
- **IA**: recluta si está en guerra y le sobra oro; soborna cercos suyos de 2+ estaciones, si no vigila,
  roba técnicas o incita revueltas en ciudades enemigas.
- **Órdenes** (serializables): `{tipo:'espia', f, p}`, `{tipo:'espiaMover', f, esp, x, y}`,
  `{tipo:'mision', f, esp, mis, p?, obj?}` (`obj` = ejército a sabotear), `{tipo:'espiaRetirar', f, esp}`.
- **Interfaz**: sección «Espías» de la ciudad, figura encapuchada en el mapa (punto violeta si vigila,
  naranja si actúa), panel del espía con las misiones posibles y sus probabilidades; clic en el mapa lo
  mueve.

## Relieve (mundo.md §6)

Coste infinito en montaña y en río sin puente ni vado (`camPasable` → `mapaTransitable`); vado +2 (+2 más
en invierno); camino ×0,6 (×0,45 con Calzadas); paso de montaña +1,5; sin diagonales que corten esquinas
de costa, sierra o río (Dijkstra y `camDarPaso`). Retiradas, campamentos mercenarios, desertores y espías
solo en casillas transitables. `camTerrCasilla` toma el río de `MAP.rio`. En mapas v1 (partidas antiguas,
capas vacías) todo sigue como antes (`camRelieve()` lo detecta).

## Órdenes (API para el futuro online)

Todo se expresa con objetos planos (JSON) con `f` = bando que da la orden:

| tipo | campos | efecto |
|---|---|---|
| `formar` | `p`, `u:{tipo:n}`, `gen` (bool, def. true) | nuevo ejército en la ciudad de `p`; devuelve `{ok, ej}` |
| `mover` | `ej`, `x`, `y`, `luego?` (`asediar`/`asaltar`/`acampar`/`disolver`/`unir`), `p?`, `con?` | marcha por la ruta más barata hasta agotar el alcance; lo que falte queda en `plan` |
| `acampar` / `levantar` / `disolver` / `dividir` (`frac`) / `unir` (`con`) | `ej` | |
| `asediar` | `ej`, `p` | cerco desde una casilla vecina |
| `asaltar` | `ej`, `p?`, `con?:[ids]` | asalto a la ciudad sitiada (o vecina); con `con`, asalto conjunto por varios flancos |
| `construir` | `ej`, `maq` (`ari`/`tor`/`cat`) | encarga una máquina |
| `general` | `ej`, `c` (id o null) | da o quita el mando |
| `salida` | `p` | la guarnición sitiada ataca |
| `contratar` | `ej` + `camp` + `cia`, o `p` + `cia`; `anos` 1-3 | compañía mercenaria |
| `renovar` / `licenciar` | `t` (tipo mercenario) | contrato |
| `apoyo` | `ej`, `modo` (`siempre`/`nunca`/id) | «unirse a la batalla»: si acude a las batallas vecinas |

- `await camAplicarOrden(G, orden, opc)` → `{ok, motivo?, ...}`. Determinista salvo las batallas (usan
  `R()`): en online, el anfitrión resolverá y difundirá `G` (como hoy). `opc.anim` anima la marcha;
  `opc.auto` resuelve batallas sin preguntar.
- `await camResolverSimultaneo(G, órdenes, opc)` → `[{o, r}]`: órdenes de varios bandos a la vez.
  Primero las que no son de marcha (orden `(f, ej, tipo)`); luego las marchas **paso a paso**: en cada
  vuelta mueve antes quien llega antes a su siguiente casilla (tiempo = coste acumulado / alcance;
  empate: más rápido, luego id menor). Si dos bandos en guerra quieren la misma casilla, el primero la
  ocupa y el segundo le ataca. La IA ya usa esta función cada estación; el modo online solo tiene que
  reunir las órdenes de los jugadores (cada uno las da en su pantalla con `camAplicarOrden` sobre una
  copia o guardándolas) y llamarla.
- Otras funciones: `camDijkstra(ej, {presu, sinZoc})`, `camAlcance(ej)`, `camPlanRuta(ej, x, y)`,
  `camMovMax(ej, estacion)`, `camCoste(f, casilla)`, `camEjsEn(x, y)`, `camAsedio(pid)`,
  `camSitiadores(pid)`, `camFortEf(p, ej, as)`, `camSaltar(f)`, `camEstacion()`, `camNuevaEstacion()`.

## Mercenarios (`js/mercenarios.js`, estado `G.cam.merc`)

Tipos (en `UN`, `merc: true`, `base`, coste ×1,55, fuerza ×1,35, veteranía 45 al llegar; también se
añaden a `TYP`, `MULT` —heredan la doctrina de su clase base—, `SP`/`MS` —sprite de la base— y a
`CIV[f].un`): `mhe` Hérulos (inf., norte), `mgp` Lanceros gépidos (norte), `mal` Jinetes alanos
(este, establo), `msa` Catafractos sármatas (este, establo), `mba` Honderos baleares (oeste, puerto),
`mcr` Arqueros cretenses (sur, puerto), `mes` Arqueros escitas (este, establo), `mnu` Jinetes númidas
(sur, establo; +0,6 de marcha), `mis` Montañeses isaurios (este), `mma` Marinos de Rodas (puerto).
Cada compañía tiene nombre propio («Hérulos de Fara», «Jinetes alanos de Goar»…).
- **Campamentos** en el mapa (tienda dorada): `max(2, provincias × 0,1)`, en casillas libres lejos de
  ciudades, con 2 compañías de la región; duran 2-3 años y se mudan en primavera. Se contrata llegando
  con un ejército al campamento o a una casilla vecina (la compañía se une al ejército).
- **Ciudades propias**: 1 compañía (+1 con mercado, +1 con puerto) según región, puerto y establo;
  deterministas por ciudad y año (`mercOfertas(p)`); no con la ciudad sitiada. Van a la guarnición.
- **Contrato** de 1 o 3 años (la IA, 2): enganche `coste base × 0,6 × levas` al firmar y **paga cada
  estación** `coste base × 0,12 × levas` (`OC.pagar`, del tesoro). Si no hay oro: una estación de gracia
  (murmuran); a la segunda **desertan**: desaparecen de ejércitos y guarniciones, saquean la provincia
  (−20 de orden, −5 % de población, roban hasta 4 de oro por leva) y forman una banda rebelde que vaga
  2 años, acampa, saquea y toma ciudades indefensas. Al vencer (primavera): renovar (medio enganche) o
  licenciar; el jugador recibe un modal, la IA renueva si está en guerra y puede pagarles.
- Son **fieles**: no hay oferta del rival que les haga cambiar de bando (decisión de diseño).
- IA: contrata en guerra con un reino si el saldo anual sostiene la paga (un año) o el tesoro la cubre;
  prefiere campamentos junto a sus ejércitos y si no, ciudades fronterizas; máximo 2 contratos.

## IA (`js/ia.js`)

- Anual (`ai(f)`): generales (no a rehenes ni a quien ya manda un ejército), reclutamiento por
  **doctrina de su pueblo** (`CMB_DOC[CIV[f].id]`, también para los 12 pueblos nuevos; elefantes,
  camellos y carros con peso propio, tropas únicas `UN[t].civs` con el de su `rol` ×1,5; máquinas y
  mercenarios nunca se reclutan) con una **reserva de campaña** (`camIAReserva`: un año de paga mercenaria,
  15 si tiene ejércitos fuera, 20 + 2/provincia en guerra), mercenarios con el oro recién cobrado,
  instrucción y redistribución de guarniciones hacia la frontera. Ya no ataca provincias de golpe.
- Cada estación (`camIA(f)`): forma ejércitos para echar a los intrusos (si `cmbEstimar` ≥ 0,6) y, salvo
  en invierno, uno ofensivo contra la mejor ciudad hostil vecina (≥ 0,62; ≥ 0,5 si tiene murallas y se
  puede cercar). Cada ejército: en asedio asalta si ve ≥ 62 %, si no encarga ariete/torre/catapulta y
  espera; levanta el cerco tras 8 estaciones sin esperanza. Fuera: intercepta enemigos al alcance
  (≥ 55 % en tierra propia, 64 % fuera), acampa para forrajear o vuelve sin víveres, inverna acampado
  o en casa, marcha a su ciudad objetivo (asedio si tiene murallas, asalto si no) y, sin objetivo,
  vuelve y se disuelve. Máximo `min(4, 1 + provincias/4)` ejércitos.

## Ganchos

- **Emite**: `finEstacion {anio, estacion}` (turnos), `batallaResuelta` (con `campana`), `conquista`.
- **Escucha**: `partidaLista` (crea `G.cam`, define mercenarios, campamentos), `pazFirmada` (levanta
  cercos y devuelve los ejércitos a su tierra).
- **Usa**: `cmbResolverAuto`, `cmbTactica`, `cmbEstimar`, `cmbVetDe/Fijar`, `cmbOriDe/Fijar`, `cmbLlega`,
  `cmbVacio`, `cmbSuma`, `cmbNorm`, `cmbVetGanar`, `cmbGuardarInf`, `cmbFamaSumar`, `cmbInfHtml`,
  `cmbTerreno`; `ecoMant`, `ecoApoyoAsedio`, `ecoDiezmar`, `ecoPob`, `inc`; `dipTr`, `dipModalGuerra`,
  `declareWar`; `tecTiene(f, "vias")`; `OC.pagar/ganar/puedePagar/saldo`.
- Secciones/paneles: sección de provincia `mercenarios` (46); pestaña `cam` (16); acciones `cam`, `camm`.

## Pruebas

`node pruebas/campana.js [años=16] [civ=0] [semilla=20261124]` (Math.random con semilla fija: el resultado no depende del azar): marcha con alcance limitado (caballería, invierno,
Calzadas), marcha pendiente, campamento y saqueo, asedio de varias estaciones con ariete y torre,
murallas efectivas y asalto, rendición por hambre sin asalto, encuentro en campo abierto, órdenes
simultáneas (llega antes el más rápido), mercenarios de campamento y de ciudad que cobran cada estación
y desertan sin paga, partida antigua, y 16 años de IA (forma, marcha, asedia, asalta, conquista,
contrata; para forzar campañas, la prueba pone en guerra a los reinos de la IA con frontera común).
Capturas `pruebas/capturas/campana-*.png`. `pruebas/humo.js` **no** hizo falta cambiarlo: con
«estaciones rápidas», un jugador sin ejércitos fuera pasa el año con una sola pulsación (las pruebas de
los demás sistemas, que pulsan «Fin» o llaman a `yearEnd()`, siguen contando años).

## Peticiones al orquestador

1. **Economía**: `ecoBalance` solo cuenta `p.u`; los ejércitos de `G.cam.ej` pagan su soldada y comida
   por estación desde campaña. Para que `inc(f)` y la barra los muestren, sumar en `ecoBalance` las
   tropas de `camEjDe(f)` (y quitar entonces mi cobro en `camSuministros`). Igual `ecoDesercion`
   (impagos/hambre) podría alcanzar a los ejércitos.
2. **Interfaz**: `ui()` escribe «Fin del año ▶»; uso `camTextoFin()` desde `drawMap` para corregirlo.
   Mejor que `ui()` lo use directamente y que la barra superior muestre `CAM_EST[G.estacion]`. La barra
   de fuerza (`totPow`) no cuenta los ejércitos en campaña (`camEjDe(f)`). El atajo «E» y el modal de
   declarar guerra del clic antiguo (rama `aim`) ya no se usan desde el mapa.
3. **Online** (`inicio.js` `endOnline`): hoy llama a `yearEnd()` (un año entero por ronda). Para turnos
   por estación, llamar a `finEstacion()` y sincronizar `G.estacion`; para turnos simultáneos, reunir
   las órdenes de cada jugador y aplicar `camResolverSimultaneo(G, órdenes)` en el anfitrión.
4. **Combate**: las máquinas van en `ejA.u` y `ctx.fort` = murallas − brecha del bombardeo de las
   estaciones de cerco (catapultas, `G.cam.as[p].brecha`); `ctx.murallas` = nivel bruto, `ctx.asedio` =
   estaciones de cerco (no meses). `cmbTactica` recibe `fort` no entero (campamento 0,6). Los
   mercenarios copian la entrada de su clase base (`rol`, `base`, `merc: true`): MULT y sprites caen solos
   por `rol`. `genOf(c)` no ve a los generales de ejércitos (`camS().ej[].gen`): conviene que lo mire
   (o que `cmbNivel`/Mandos lo muestre).
5. **Diplomacia/narrativa**: los mercenarios (`UN[t].merc`) no deben pasarse al rival por eventos o
   sobornos. `pazFirmada` ya devuelve los ejércitos a casa; la IA de paz podría pesar los asedios en
   curso (`G.cam.as`).
6. **Contrato**: añadir el evento `finEstacion {anio, estacion}`, `G.cam`, `G.estacion` y el campo
   `campana` de `batallaResuelta`; `ia.js` y `campana.js` pasan a Campaña (ya anotado).
7. **Economía**: conectar `ecoInfoVisible(p, f)` a `camInfoVisible(p, f)` (o `camVeProv(f, p.id)`) para que
   sus paneles de provincias ajenas no muestren lo que la niebla oculta.
8. **Interfaz**: en `ifzRepetir`, mostrar a cada jugador solo los pasos cuyo `vh` lo incluya (o de su
   bando) y dibujar los pasos `esp`/`esp-`. El velo de lo explorado usa el `base` de baja resolución
   escalado; si hay un fondo HD, `camDibujarNiebla` podría usarlo.
9. **Combate**: leer `ctx.emboscada` (hoy campaña da +20 % de daño por `bonoBatalla`; si combate lo aplica,
   avisad para quitarlo).
10. **Tecnología**: ya existen los cálculos `alcanceEjercito`, `costeMaquina` y `estacionesMaquina`
   (CONTRATO §5). Las Calzadas siguen abaratando la marcha en tierra propia y por caminos
   (`tecTiene(f, "vias")`); el Yam u otras pueden sumar alcance con `alcanceEjercito`.
