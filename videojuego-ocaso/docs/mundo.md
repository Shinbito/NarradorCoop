# Mundo (civilizaciones nuevas) — Ocaso del Imperio

Sistema **Mundo**: qué pueblos existen, cuáles juegan cada partida, los dos modos de juego y el
tamaño del mapa. Archivos: `js/mundo.js`, `docs/mundo.md`, `pruebas/mundo.js`,
`pruebas/datos/partida-antigua-410.json`; además `js/mapa.js` (generación), `js/inicio.js`
(pantallas de inicio), `newGame`/`setup` de `js/partida.js` y en `js/nucleo.js` `CIV`, `NF`, `REB`,
`PAL`, `PNAMES`, `civIdx` y `W`/`H` (ahora `let`).

## 1. Modos

| `G.modo` | Pueblos | Mapa | Inicio |
|---|---|---|---|
| `historico` (por defecto) | las 7 originales (`G.activas = [0..6]`) | 64×40, rejilla 8×5 (~38 provincias), **idéntico al de antes** (misma semilla → mismo mapa) | alianza romana, foedus franco, guerras de 410, nombres latinos (`PNAMES`) |
| `leyendas` | el jugador elige su pueblo entre los 19 y de 1 a 18 rivales (al azar o a mano) | crece con el número de pueblos: `mundoDims` (≤7 pueblos 64×40; 12 → 89×56 ~57 prov.; 19 → 112×70 ~100 prov.) | sin tratados históricos; capitales repartidas según la geografía real aproximada (`MUNDO_GEO`: América al oeste, China al este...); provincias con nombres de cada pueblo (`MUNDO_PN`) |

Pantalla de inicio: «Nueva campaña» → elegir modo (botones `s-modo-historico` / `s-modo-leyendas`) y
pueblo (`s-civ-N`) → en leyendas, rivales (`s-rmodo-azar|mano`, `s-nriv-inc|dec`, `s-rsort`, `s-rtog-N`,
`s-rtodos`, `s-rning`, `s-rok`) → soberano → `s-go`. El modo histórico conserva el flujo de antes
(las pruebas `s-new` → `s-civ-N` → `s-go` siguen valiendo). Online: `G.modo`/`G.activas`/`G.mapa`
viajan en `G`; el documento de la partida guarda además `modo` y `activas` para que el lobby solo
ofrezca los pueblos que juegan.

## 2. Estructura

- `CIV[0..6]` originales (índices FIJOS), `CIV[7..18]` nuevas, `CIV[19]` rebeldes.
  `REB = CIV.length - 1` (19), `NF = REB` (19). Todos los `CIV[f]` tienen `id`.
- `G.activas`: índices que juegan. Las demás facciones existen en `G.F` (todo bucle `for f < NF`
  funciona) con `G.F[f].ausente = true`, `capId: 0`, sin provincias (`alive(f)` falso) y un soberano
  «de nombre» **muerto** (`G.C[...]` con `alive: false`, `mundoAusente: true`), para que `ruler(f).n`
  no falle pero no haya corte que envejezca, se case ni herede.
- `G.rel` / `G.st`: matrices NF×NF (19×19).
- `G.mapa = {w, h, gx, gy, v}`: con `gen(G.seed, G.mapa)` se regenera el mismo mapa (`v` = versión del generador, §6). `W`/`H` (globales)
  los fija `gen()`, que también redimensiona los lienzos `cv`/`base`. Usad siempre `W`/`H`, nunca 64/40.
- Guarnición inicial de la capital: `CIV[f].u0` (hunos y mongoles a caballo; incas, mayas y aztecas
  con honderos/átlatl y sin jinetes), por defecto `{i:6, a:4, c:2}`.

### API (`js/mundo.js`, `js/nucleo.js`)

| Función | Qué hace |
|---|---|
| `civIdx(id)` | índice de un pueblo por id (−1 si no existe) |
| `mundoActivas()` / `civActiva(f)` | pueblos de la partida (las 7 si no hay `G`) |
| `mundoLeyendas()` | `G.modo === 'leyendas'` |
| `civPuede(f, t)` | falso si la clase `t` está en `CIV[f].sinTipos` |
| `civBase(f)` | índice del pueblo original «pariente» (`CIV[f].base`): úsalo como respaldo mientras falte contenido propio: `TABLA[f] ?? TABLA[civBase(f)]` |
| `mundoDims(modo, n)` | tamaño del mapa para n pueblos |
| `mundoRivalesAzar(me, n)` | n rivales al azar |
| `newGame(me, cand, {modo, activas})` | sin tercer argumento, modo histórico |

Relleno provisional (`mundoRelleno`, en `partidaLista`): si tecnología no define `tecIni`, `tecPri`
o `tecLibres` de un pueblo nuevo, se copian de su pariente (`base`), sin clases vetadas. Solo rellena
lo que falta; las eras y edificios propios se dejan al respaldo genérico de tecnología.

Garantía `mundoDepurar` (tras `economiaFaccion`, `turnoIA`, `finAnio`, `inicioTurno` y `partidaLista`,
registrada al cargar la página para correr después de los demás): las tropas que un pueblo no puede tener
(p.ej. jinetes regalados a los incas) pasan a su equivalente a pie (x→h, c→i, k→p, m→a; resto → i).

Modificador `unidadesDisponibles` (prioridad 100, se aplica el último): quita los tipos de
`CIV[f].sinTipos` y rellena `motivos[t]` («No hay caballos en estas tierras»).

### Partidas guardadas antiguas

`mundoMigrar` escucha `partidaLista` (es el primer oyente: `mundo.js` se carga tras `nucleo.js`).
Si falta `G.activas` (partida anterior a la fase 2), remapea el 7 de los rebeldes a `REB` en
`p.owner`, `p.home`, `c.f` y `G.cmb.vet/ori[*].f`, y marca `G.activas = [0..6]`, `G.modo = 'historico'`.
Siempre (idempotente) completa `G.mapa`, amplía `G.rel`/`G.st` a NF×NF, crea las facciones ausentes
en `G.F` y rellena `G.dip.rep`. Probado con `pruebas/datos/partida-antigua-410.json` (guardada con el
código anterior).

## 3. Pueblos

| id | f | Nombre | Religión (`rel`) | `sinTipos` | Únicas (`unicas`, claves reales de `UN`) | `base` | Rasgos (bon, gold, ord, otros) |
|---|---|---|---|---|---|---|---|
| occ | 0 | Imperio de Occidente | niceno | — | `com` comitatenses | occ | infantería resistente, orden +6 |
| ori | 1 | Imperio de Oriente | niceno | — | `sif` sifonarios | ori | oro ×1,25, catafractos |
| vis | 2 | Visigodos | arriano | — | `esg` escuderos godos | vis | infantería al ataque |
| hun | 3 | Hunos | pagano | — | `hpa` jinetes de Atila | hun | caballería y arqueros, oro ×0,85, `u0` a caballo |
| van | 4 | Vándalos | arriano | — | `cor` corsarios | van | botín 30 |
| fra | 5 | Francos | pagano | — | `fca` lanzadores de francisca | fra | infantería barata (`icost` 0,8) |
| per | 6 | Persia Sasánida | zoroastra | — | `inm` inmortales, `ele` elefantes | per | arqueros y caballería pesada |
| ara | 7 | Reinos de Arabia (Árabes) | `arabe` (politeísmo árabe preislámico) | — | `cam` jinetes de camello | per | oro ×1,15, jinetes +15%, botín 15 |
| nor | 8 | Reinos del Norte (Nórdicos) | `nordico` | m | `ber` berserkers | fra | infantería +20%, huscarles, botín 25, caballería floja |
| chi | 9 | Imperio del Centro (Chinos) | `confuciano` | — | `bal` ballesteros | ori | oro ×1,2, orden +4, alabarderos |
| inc | 10 | Imperio del Tahuantinsuyo (Incas) | `andino` | x c k m + `"caballos"` | `mac` guerreros de maza | occ | honderos +25%, orden +5, infantería barata (mita) |
| may | 11 | Señoríos mayas | `mesoamericano` | x c k m + `"caballos"` | `atl` lanzadores de átlatl | ori | oro ×1,1, arqueros y átlatl |
| azt | 12 | Imperio mexica (Aztecas) | `mesoamericano` | x c k m + `"caballos"` | `jag` guerreros jaguar, `agu` guerreros águila | fra | infantería +15% |
| gri | 13 | Liga Helénica (Griegos) | `olimpico` | — | `hop` hoplitas | ori | falange resistente, oro ×1,1 |
| egi | 14 | Reino del Nilo (Egipcios) | `egipcio` | — | `car` carros de guerra, `cam` camellos | per | oro ×1,2, arqueros nubios, orden +3 |
| ind | 15 | Imperio Gupta (Indios) | `hindu` | — | `ele` elefantes de guerra | per | arco largo +15%, oro ×1,15 |
| cel | 16 | Reinos celtas | `druidico` | m | `fia` fianna | fra | infantería +15%, honderos, orden −2 |
| esl | 17 | Tribus eslavas | `eslavo` | — | `bos` lanceros del bosque | vis | infantería muy resistente, jabalineros |
| mon | 18 | Hordas mongolas | `tengri` | — | `kes` keshig | hun | arqueros a caballo +25%, oro ×0,85, orden −4, `u0` a caballo |
| reb | 19 | Rebeldes | — | — | — | reb | |

`sinTipos` es un array: clases vetadas y, si incluye `"caballos"`, además toda montura con
`UN[t].caballo` (jinetes, carros, únicas montadas). Combate lo respeta en su repertorio; Mundo lo
aplica en `unidadesDisponibles` y lo expone como `civPuede(f, t)`.

Todos los nuevos traen `un` para las 9 clases básicas permitidas (combate completa el resto con
`cmbCivSync()` y puede renombrar algunas desde `CMB_CIV`), `tm`/`tf`, 14-16 soberanos y 12 soberanas
auténticos, `desc`, `pueblo` («el pueblo nórdico», para la crónica) y 14 nombres de provincia
(`MUNDO_PN`, el primero es la capital). Colores claros y distintos entre sí (distancia RGB mínima 44,
todos legibles sobre el panel oscuro).

Las únicas ya existen en `UN` (combate v2) con `civs`/`civIds`; `pruebas/mundo.js` comprueba que cada
clave de `CIV[f].unicas` existe y pertenece a ese pueblo. La pantalla de inicio las muestra como «Únicas: …».

## 4. Peticiones a cada sistema (contenido por pueblo nuevo)

Lo que falte cae en un respaldo razonable, pero conviene completarlo. Usad `CIV[f].id`, nunca el índice.

**Combate** (`clases.js`, `habilidades.js`, `batalla.js`)
- Hecho en combate v2: `CMB_CIV` por id, únicas, `sinTipos`. Pendiente: dar a cada pueblo nuevo sus
  nombres de las clases básicas en `CMB_CIV` solo si se quieren distintos de los de `CIV[f].un`
  (hoy `CMB_CIV` pisa algunos, p.ej. inc `p` «Guardia del Inca» en vez de «Orejones»; es aceptable).

**Campaña** (`ia.js`, `campana.js`, `mercenarios.js`)
- `CMB_DOC` (ia.js) es posicional con los rebeldes en el 7 (`CMB_DOC[f] || CMB_DOC[7]`): ahora el 7 es
  **ara** y los rebeldes (19) caen en el respaldo. Indexar por id, con doctrina para los nuevos
  (incas/mayas/aztecas sin caballería; mongoles a caballo) y para `reb`, y añadir `ele`, `cam` y únicas.
- Mercenarios: no ofrecer clases vetadas (`civPuede(f, t)`); en América no hay mercenarios a caballo.

**Tecnología** (`civilizaciones.js`, `tecnologia.js`)
- `TEC_CIV` solo tiene las 7: añadir eras, prioridades, edificio propio y técnicas para los 12
  (p.ej. chi: imprenta/pólvora temprana; may: calendario/escritura; inc: quipu, caminos, terrazas;
  egi: graneros del Nilo; gri: filosofía, fuego griego; ind: cifras, elefantes; nor: drakkar).
  Hoy usan las eras genéricas y, provisionalmente, `tecIni`/`tecPri`/`tecLibres` del pariente (`mundoRelleno`).
- La línea «Recluta:» de la ciudad (`tecReclutables`) no pasa por `unidadesDisponibles` y mostraba
  «Caballería» a los aztecas: filtrar con `civPuede`.
- El establo no debería ofrecerse a quien tiene `"caballos"` en `sinTipos` (o darle otro uso).

**Narrativa** (`narrativa.js`, `historia.js`)
- `NAR_PUEBLO[f]` cae en «los rebeldes» para los nuevos: usar `CIV[f].pueblo`.
- Prólogo (`NAR_PROLOGO`) por pueblo nuevo; los arcos históricos de 410 (Roma, Atila...) **solo si
  `G.modo === 'historico'`**; eventos propios de cada pueblo y del modo leyendas.
- Mensajes con «d.C.»/«el imperio se resquebraja» pensados para 410: revisar en leyendas.

**Diplomacia y social** (`diplomacia.js`, `sociedad.js`)
- `DIP_PERS[f]` (personalidad de la IA) solo para 7: añadir los 12 (mongoles y aztecas agresivos,
  chinos y griegos negociadores, árabes codiciosos...).
- `SOC_GRUPO(f)` es posicional (`f <= 1`, `f === 3`, `f === 6`): todos los nuevos caen en «ger».
  Proponer grupos: chi/egi/inc → burocracia imperial; may/azt/gri → ciudades-estado; mon → estepa (como hun);
  nor/cel/esl → tribal (como ger); ara/ind → como per.
- `socFavor(f, "ari")` regala 2 jinetes a la capital (`c.u.c += 2`) también a incas, mayas y aztecas:
  usar `civPuede(f, "c")` (hoy Mundo los desmonta al cerrar el año). Igual en la guerra civil (`c: 1`).
- `SOC_CLE` / `SOC_FEN` / sumo sacerdote (`socCargo 'obi'`) para las religiones nuevas: `arabe`,
  `nordico`, `confuciano`, `andino`, `mesoamericano`, `olimpico`, `egipcio`, `hindu`, `druidico`,
  `eslavo`, `tengri`. Disputas de credo entre religiones nuevas (hoy solo niceno/arriano).

**Economía** (`economia.js`, `comercio.js`)
- Recursos y comercio con sabor por pueblo (seda y té en chi, incienso en ara, oro y plata en inc,
  cacao en may/azt, papiro y grano en egi, especias en ind, pieles y ámbar en nor/esl).
- `ecoTerreno` y similares ya usan `W`/`H` y la semilla: funcionan con mapas grandes.

**Interfaz**
- Con 19 pueblos la lista «Potencias» es larga; el mapa grande se ve pequeño al 100 % (hay zoom).
- La rejilla de tropas de la provincia lista todas las clases (los aztecas ven «0 Caballería»): mostrar solo `p.u[t] > 0` y, si acaso, las que `civPuede(f, t)`.

**Orquestador**
- `pruebas/combate.js` falla «en campo abierto las máquinas son casi inútiles» también en la rama
  `claude/gifted-gauss-pdu6a2` sin los cambios de Mundo (no es de este sistema).
- `docs/CONTRATO.md` §2 dice aún «`REB = 7`»: ahora `REB = NF = 19` (la §8 ya lo recoge).

## 5. Pruebas

- `node pruebas/mundo.js [años=20] [--todas]`: estructura de CIV (ids, campos, colores, iconos de las
  9 clases para los 20 pueblos), modo histórico (64×40, tratados, 19 facciones con 12 ausentes), pantalla
  de inicio en escritorio y móvil, cuatro partidas de leyendas (incas+aztecas+mayas sin caballos; los
  19 pueblos; 3 pueblos; árabes con 11 rivales durante 20 años) comprobando capitales, nombres y que
  nadie sin caballos tenga jinetes, el relieve de cada mapa (capas, ríos que bajan al mar, ninguna ciudad
  aislada; captura de depuración `mundo-relieve-*.png`), guardar/cargar una partida de leyendas y cargar la partida antigua.
  Con `--todas` ejecuta también humo (20 años), economía, tecnología, diplomacia, narrativa y combate.
- Capturas: `pruebas/capturas/mundo-*.png`.

## 6. Relieve del mapa (generador v2)

`gen(semilla, G.mapa)` primero fija costa, provincias y ciudades exactamente como antes (misma forma con
la misma semilla) y después, con su propio generador aleatorio, calcula el relieve (`mapaRelieve`).

### Versiones del generador (`G.mapa.v`)
| v | Partidas | Relieve |
|---|---|---|
| 1 (sin `v`) | las guardadas antes de este cambio (y las de leyendas creadas antes) | solo `alt` (informativa); `mont`, `rio`, `puente`, `vado`, `camino`, `bosque` vacías: nada infranqueable, como siempre |
| 2 (`MUNDO_GEN_V`) | todas las partidas nuevas (histórico y leyendas) | montañas, pasos, ríos, puentes, vados, caminos y bosques densos |

La forma (costa, `grid`, `pts`, `adj`, `terr`) es idéntica en v1 y v2 (comprobado con 15 semillas por tamaño),
así que provincias, capitales y economía del modo histórico no cambian. Los ejércitos de una partida vieja
no pueden quedar dentro de una montaña nueva porque las viejas siguen en v1.

### Capas de `MAP` (todas `[y][x]`, de `H`×`W`)
| Capa | Valores | Qué es |
|---|---|---|
| `terr` | 0 mar, 1 llanura, 2 bosque, 3 colina | **Sin códigos nuevos** (economía, combate y campaña indexan arrays de 4). Las montañas están siempre en casillas `terr` 3 |
| `tipo` | `MAPA_T`: 0 mar, 1 llanura, 2 bosque, 3 colina, **4 montaña**, **5 río** | código extendido para el dibujo y el 3D (`MAPA_TN[tipo]` = nombre) |
| `alt` | 0 (mar) … 9 | altura: 1-7 en tierra (crece tierra adentro y con el relieve; colinas ≥ 4), 8-9 montaña, 7 en los pasos. A lo largo de un río nunca sube |
| `mont` | 0/1 | montaña **infranqueable** (≈5,5 % de la tierra, en el corazón de las colinas, formando sierras; nunca en la costa ni junto a una ciudad) |
| `paso` | 0/1 | paso de montaña: casilla de sierra abierta por un camino (transitable, `terr` 3) |
| `rio` | 0/1 | cauce (4-conexo). Nace al pie de una montaña o en colinas altas y baja hasta el mar u otro río. **Solo se cruza por puente o vado** |
| `puente` | 0/1 | donde un camino cruza un río, o una ciudad está sobre él |
| `vado` | 0/1 | pocos, en tramos de llanura lejos de los puentes |
| `camino` | 0/1 | caminos entre ciudades vecinas: un árbol que une TODAS las provincias más algún ramal (≈12 % de los pares vecinos) |
| `bosque` | 0/1 | bosque denso (subconjunto de `terr` 2 fuera de caminos y ríos): donde se ocultan tropas |
| `costa` | 0 mar, 1 costa, n | distancia en casillas al mar |
| `rios`, `caminos` | listas | cauces (`[[x,y],...]`, de la fuente a la desembocadura) y pares de provincias unidas por camino |

`mapaTransitable(x, y)`: tierra, no montaña, y si es río solo con puente o vado.
`mapaInfo(x, y)` → `{tipo, terr, alt, rio, puente, vado, bosque, camino, paso, montana, costa, infranqueable, provincia}`.

**Garantía de conexión:** los caminos forman un árbol entre todas las ciudades; donde cruzan un río ponen
puente y donde cruzan una sierra abren un paso. Por eso cualquier ciudad llega a cualquier otra por casillas
transitables (8 direcciones; en diagonal solo si las dos casillas ortogonales también lo son).
`pruebas/mundo.js` lo comprueba en cada mapa con una búsqueda en anchura.

### Peticiones del relieve
- **Campaña** (`ejercitos.js`: `camCoste`, búsqueda de caminos, `camTerrCasilla`; `mercenarios.js`):
  - coste **infinito** si `MAP.mont[y][x]` (usar `mapaTransitable`);
  - un río solo se pisa por `MAP.puente` o `MAP.vado`; el vado, caro (y quizá solo fuera del invierno);
  - en diagonal, prohibir el paso si alguna de las dos ortogonales no es transitable (como ya se hace con el mar),
    para que nadie cruce un río o una sierra por una esquina;
  - `MAP.camino` más barato (el bono de vías de tecnología encaja aquí); `MAP.paso`, caro;
  - `MAP.bosque`: los ejércitos dentro no se ven desde lejos (niebla/ocultación) y emboscan;
  - no colocar ejércitos, mercenarios ni guarniciones en casillas no transitables;
  - `camRio(pid)` puede usar `MAP.rio` de la casilla en vez del río «por provincia».
- **Interfaz** (`drawBase`/`ifzTileProc` en `mapa.js`): dibujar `MAP.tipo` 4 (montaña nevada) y 5 (agua),
  puentes, vados, caminos y bosque denso; `mapaInfo` sirve para el texto de la casilla al pasar el ratón.
- **Batalla 3D**: `MAP.alt` (0-9) y `MAP.tipo` dan la altura y el tipo de cada casilla; un río por provincia
  puede salir de `MAP.rio`.
- **Combate** (`cmbTerreno`): el río de una batalla puede salir de `MAP.rio`/`MAP.puente` de la provincia.
- **Economía**: si quiere, provincias con río más fértiles y con puente más comerciales.
