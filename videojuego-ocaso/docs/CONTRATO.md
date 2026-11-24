# Contrato entre sistemas — Ocaso del Imperio

El juego se desarrolla por **sistemas**, cada uno con un responsable. Para poder
trabajar en paralelo sin pisarse, cada sistema **solo edita sus archivos** y se
comunica con los demás a través del objeto global `OC` (`js/ganchos.js`).

## 1. Propiedad de archivos

| Sistema | Archivos propios (edición libre) | En `js/nucleo.js` puede tocar solo |
|---|---|---|
| **Narrativa** | `js/narrativa.js`, `js/historia.js`, `css/narrativa.css`, `docs/narrativa.md` | `EVENTS` está en narrativa.js; en núcleo nada |
| **Combate y clases** | `js/batalla.js`, `js/clases.js`, `js/habilidades.js`, `css/combate.css`, `docs/combate.md` (desde la fase 2, `campana.js` e `ia.js` pasan a Campaña) | `UN`, `MULT`, `TYP`, `pw`, `tot`, `SP` (sprites de tropa), `REB`-tropas |
| **Tecnología y civilizaciones** | `js/tecnologia.js`, `js/civilizaciones.js`, `css/tecnologia.css`, `docs/tecnologia.md` | `BLD` y los campos de `CIV` relativos a progreso (añadir campos, no borrar) |
| **Economía** | `js/economia.js`, `js/comercio.js`, `css/economia.css`, `docs/economia.md` | `TAX`, `TAXM`, `TAXO` |
| **Diplomacia y social** | `js/diplomacia.js`, `js/sociedad.js`, `js/partida.js`, `css/diplomacia.css`, `docs/diplomacia.md` | `TRAITS`, `trait`, `mkChar`, `marry` |
| **Interfaz** | `js/interfaz.js`, `js/inicio.js`, `js/mapa.js`, `js/musica.js`, `index.html`, `css/ocaso.css`, `css/interfaz.css`, `docs/interfaz.md` | — |
| **Mundo (civilizaciones)** | `js/mundo.js`, `docs/mundo.md`, `pruebas/mundo.js`; además `js/mapa.js` (generación), `js/inicio.js` (pantallas de inicio) y en `js/partida.js` solo `newGame`/`setup` | `CIV`, `NF`, `REB`, `PAL`, `PNAMES` |
| **Campaña (ejércitos en el mapa)** | `js/campana.js`, `js/ia.js`, `js/ejercitos.js`, `js/mercenarios.js`, `css/campana.css`, `docs/campana.md`, `pruebas/campana.js`; en `js/interfaz.js` solo `drawMap`, clics/hover del mapa y `provPanel` sección Ejército; en `js/turnos.js` el bucle de estaciones | — |
| **Online** | `js/online.js`, `css/online.css`, `docs/online.md`, `pruebas/online.js`; en `js/inicio.js` la parte online (lobby, `createOnline`, `joinGame`, `enterGame`, `endOnline`, `leaveNet`); en `js/batalla.js` solo lo necesario para batallas en vivo entre jugadores (marcado `/* ONL */`) | — |
| **Tutorial** | `js/tutorial.js` (carga justo antes de `arranque.js`), `css/tutorial.css`, `docs/tutorial.md`, `pruebas/tutorial.js` | — |
| **Batalla 3D** | `js/batalla3d.js`, `vendor/three.min.js` (y otros en `vendor/`), `css/batalla3d.css`, `docs/batalla3d.md`, `pruebas/batalla3d.js`; en `js/batalla.js` solo ganchos mínimos marcados `/* 3D */` | — |
| **Orquestador** | `js/ganchos.js`, `js/turnos.js`, `js/arranque.js`, `docs/CONTRATO.md`, `pruebas/humo.js` | resto de `nucleo.js` |

Reglas:
- **No crees archivos JS nuevos** (habría que tocar `index.html`). Usa los tuyos.
- Si necesitas un cambio en un archivo ajeno, **no lo hagas**: usa un gancho de
  `OC` y, si falta uno, anótalo en la sección "Peticiones al orquestador" de tu
  `docs/<sistema>.md`. Excepción: una línea mínima para emitir/llamar a un gancho
  ya listado aquí, marcada con el comentario `/* OC */`.
- Todo el texto del juego en **español**, tono sobrio de crónica tardorromana (año 410 d.C.).
- Los scripts son clásicos (no módulos): todo lo de nivel superior es global y
  compartido. Prefija tus funciones/constantes globales nuevas para evitar choques:
  `nar*`, `cmb*`, `tec*`, `eco*`, `dip*`, `ifz*`.

## 2. Estado de partida

- Todo lo que deba guardarse va dentro de `G` (se serializa con JSON en
  `localStorage` y en el modo online). **Solo datos planos** (sin funciones, Map, Set, clases).
- Cada sistema guarda su estado en su propia clave: `OC.estado('tec', () => ({...}))`
  crea `G.tec` si no existe (así funcionan las partidas guardadas antiguas).
  Claves reservadas: `G.nar`, `G.cmb`, `G.tec`, `G.eco`, `G.dip`, `G.cam`, `G.onl`.
- Datos por provincia (`G.P[i]`) o por facción (`G.F[f]`) se pueden añadir como
  campos nuevos con prefijo si no son obvios; siempre con valor por defecto si faltan.
- Facciones: `f` de `0` a `NF-1` (19 pueblos; solo juegan los de `G.activas`); `REB = CIV.length - 1` (hoy 19) son los rebeldes/bagaudas. No uses el literal 7.
  `ME` es el jugador local; `human(f)` indica si una facción la lleva una persona.
- La IA debe usar tu sistema también (investigar, comerciar, pactar...). Engánchate a
  `turnoIA(f)` o `economiaFaccion(f)`.

## 3. API de `OC`

```js
OC.on(evento, fn)                 // escuchar
OC.emitir(evento, ...args)        // async (espera a cada oyente; se puede abrir un modal)
OC.emitirSync(evento, ...args)
OC.mod(calculo, (valor, ctx) => nuevoValor, prio)  // modificar un cálculo
OC.calc(calculo, valorBase, ctx)  // aplicar modificadores (lo llama el dueño del cálculo)
OC.panel({id, titulo, orden, render(dis)})          // pestaña nueva del panel de mando
OC.seccion('prov'|'dyn'|'dip', {id, orden, visible(ctx), render(ctx, dis)})
OC.accion(nombre, fn(valor, boton), {libre})        // <button data-act="nombre-valor">
OC.estado(clave, init)
OC.recurso({id, nombre, icono})   // la economía declara recursos nuevos
OC.saldo(f, id) / OC.sumar(f, id, v) / OC.puedePagar(f, coste) / OC.pagar(f, coste) / OC.ganar(f, bolsa) / OC.textoCoste(coste)
```

`dis` = verdadero si el jugador no puede actuar (no es su turno, partida acabada...).
Tras una acción se redibuja con `ui()` automáticamente. `modal(titulo, html, botones)`
devuelve una promesa con el `v` del botón pulsado.

Pestañas actuales: `prov` (10), `dyn` (20), `dip` (30), `log` (90). Usa `orden` entre medias.
Secciones de provincia actuales: `reclutar` (20, combate), `edificios` (30, tecnología),
`impuestos` (40, economía). Su `ctx` = `{p, f, mine, F}`.

## 4. Eventos

| Evento | Args | Lo emite | Cuándo |
|---|---|---|---|
| `partidaLista` | — | núcleo | partida nueva, cargada o recibida online (puede repetirse: sé idempotente) |
| `inicioTurno` | `f` | narrativa (`startTurn`) | al empezar el año del jugador; puede abrir modales |
| `antesFinAnio` | `anio` | turnos | al pulsar "Fin del año", antes de la economía |
| `economiaFaccion` | `f` | turnos | tras `economy(f)` de cada facción |
| `turnoIA` | `f` | turnos | tras mover la IA de la facción `f` |
| `finAnio` | `anio` | turnos | tras envejecer la corte y pasar al año nuevo |
| `finPartida` | `{win, vivo}` | turnos (`checkEnd`) | justo antes del modal de victoria/derrota |
| `finEstacion` | `{anio, estacion}` | turnos (campaña) | al cerrar cada estación (0 primavera … 3 invierno) |
| `capitanSurge` | `{c, f, lugar}` | combate | surge un capitán de entre las filas |
| `generalAsciende` | `{c, f}` | combate | un capitán es ascendido a general |
| `nivelSube` | `{c, antes, nivel}` | combate | un mando sube de nivel |
| `mercDesercion` | `{f, contrato, saqueo}` | campaña | mercenarios impagados desertan |
| `propuestaHumana` | `{de, a, tipo, ...}` | diplomacia | una propuesta o llamada a las armas queda esperando a un jugador humano |
| `conquista` | `{p, de, a}` | combate | una provincia cambia de dueño por las armas |
| `batallaResuelta` | `{p, atacante, defensor, gana, A, D, s0, gA, gD, ...}` | combate | después de cualquier batalla (auto o táctica) |
| `revuelta` | `{p, de}` | economía (y sociedad en traiciones/guerra civil) | una provincia se subleva y pasa a `REB` (se emite antes del cambio de dueño) |
| `tecnologiaInvestigada` | `{f, id}` | tecnología | |
| `tecnologiaAdoptada` | `{f, p, id}` | tecnología | un descubrimiento se implanta en una ciudad |
| `eraNueva` | `{f, era}` | tecnología | |
| `edificioConstruido` | `{f, p, id, nivel}` | tecnología | |
| `guerraDeclarada` / `pazFirmada` / `alianzaSellada` | `{a, b}` | diplomacia | |
| `bodaCelebrada` | `{a, b}` (personajes) | diplomacia | |
| `muertePersonaje` | `{c, motivo}` | diplomacia (`kill`) | |
| `sucesion` | `{f, anterior, nuevo}` (personajes, no ids) | diplomacia | |
| `crisisEconomica` | `{f, tipo}` con tipo `hambre`, `impagos`, `bancarrota`, `peste`, `inflacion`, `descontento` | economía | |

Quien emite un evento de esta tabla debe hacerlo en todos los caminos de código
correspondientes. Los demás solo escuchan.

## 5. Cálculos (modificadores)

| Cálculo | Valor | ctx | Lo llama | Lo modifican típicamente |
|---|---|---|---|---|
| `rendimiento` | `{g, fo}` (+ otros recursos que añada economía) | `{p, f}` | economía | tecnología, social, narrativa |
| `ordenObjetivo` | número 0-100 | `{p, f}` | economía | social, narrativa, tecnología |
| `costeUnidad` | oro | `{f, t}` | combate (`cost`) | economía, tecnología |
| `mantenimientoTropa` | `{comida, oro}` por unidad | `{f, t}` | economía | tecnología |
| `unidadesDisponibles` | array de tipos | `{f, p}` | combate (reclutar) | tecnología (cuarteles, técnicas) |
| `statsUnidad` | objeto de estadísticas de la clase | `{f, t, p, lado}` | combate (en toda batalla) | tecnología (armas, armaduras, veteranía de cuartel), social (generales) |
| `bonoBatalla` | multiplicador | `{f, lado:'atacante'/'defensor', p}` | combate | tecnología, narrativa, social |
| `costeConstruccion` | objeto coste | `{f, p, id, nivel}` | tecnología | economía |
| `puntosInvestigacion` | número por año | `{f}` | tecnología | economía, social, narrativa |
| `aceptacionDiplomatica` | probabilidad 0-1 | `{f, g, tipo, ...términos}`; tipo: paz, alianza, nag, comercio, paso, rehenes, vasallaje, tributo, embajada, boda, llamada | diplomacia | social, narrativa |

## 6. Pruebas

- `node pruebas/humo.js [años] [civ]` debe acabar en `OK sin errores`.
- Cada sistema puede añadir `pruebas/<sistema>.js` con sus propias comprobaciones.
- Comprueba también que una partida guardada **antes** de tus cambios sigue cargando.

## 7. Notas de integración

- `inc(f).g` es el **saldo neto** de oro del año (puede ser negativo). Ingresos brutos en `inc(f).gi`, gastos en `inc(f).gg`.
- `ecoResumen(f)` → `[{id, nombre, icono, saldo, anual}]` para pintar la barra de recursos.
- `tecLineaEdificios(p)` → texto corto con los edificios construidos de una provincia.
- Tratados: `dipTr(f, g, tipo)` indica si hay un tratado activo (p.ej. `"paso"` = derecho de paso).
- `dipModalGuerra(g)` abre el modal de declarar guerra con coste en reputación y aliados que acudirán.
- Personajes rehenes llevan `c.dipReh`: no deben nombrarse generales.
- `OC.modales`: número de modales abiertos desde el último cambio de año. Úsalo para no saturar al jugador (narrativa: máx. 2 por año).
- Narrativa expone `narLegado(f)`, `narApodoActual(f)`, `narTiene(f, k)`, `narFe(f)`; modifica también `rendimiento` y `aceptacionDiplomatica`.
- `G.log` guarda las últimas 250 entradas.
- Ánimo del pueblo: `ecoAnimo(p)` → `{id, nombre, icono, color, orden, objetivo, tendencia, causas}`; `ecoNivel(p)` (rápido, sin causas); `ecoApoyoAsedio(p, sitiador?)` → −1 (abre las puertas) … +1 (resiste). Sección de provincia `animo` (orden 38).
- Decisiones de ciudad: `ecoPuedeDecidir(f, p, k)` / `ecoDecision(f, p, k)` sobre `ECO_DEC`.
- Tecnología por ciudad: `tecPerfil(p)` → `{id, nombre, icono, sin, militar, economico, saber}`; `tecHuecos(p)`, `tecPuedeReclutar(f, p, t)`, `tecReclutables(f, p)`, `tecAdoptada(p, id)`, `tecPuntosCiudad(p)`. `statsUnidad`/`costeUnidad` deben recibir `p` (ciudad de origen o defendida); sin `p` se usa la media del reino. Las adopciones llaman a `costeConstruccion` con `id: "tec:<id>"`.

## 8. Fase 2: identificadores compartidos

**Civilizaciones** (`CIV[f].id`). Las 7 originales mantienen SIEMPRE su índice 0..6; las nuevas van detrás;
los rebeldes son el ÚLTIMO elemento (`REB = CIV.length - 1`, `NF = REB`). Una partida usa un subconjunto:
`G.activas` (array de índices). Las facciones no activas no tienen provincias (`alive(f)` falso).
- Originales: `occ` 0 Occidente, `ori` 1 Oriente, `vis` 2 Visigodos, `hun` 3 Hunos, `van` 4 Vándalos, `fra` 5 Francos, `per` 6 Persia.
- Nuevas: `ara` árabes, `nor` nórdicos (vikingos), `chi` chinos, `inc` incas, `may` mayas, `azt` aztecas, `gri` griegos, `egi` egipcios, `ind` indios, `cel` celtas, `esl` eslavos, `mon` mongoles. Rebeldes: `reb`.
- Modos: `G.modo = 'historico'` (410 d.C., las 7 originales) o `'leyendas'` (subconjunto elegido de todas). Los arcos históricos de narrativa solo en modo histórico.
- Usa `CIV[f].id` para contenido por pueblo; `civIdx(id)` devuelve el índice.

**Tipos de unidad nuevos** (los define combate en `UN`):
- Asedio (`UN[t].asedio = true`, no se reclutan en ciudad, se construyen durante un asedio): `ari` ariete, `tor` torre de asedio, `cat` catapulta/onagro.
- `ele` elefantes de guerra, `cam` jinetes de camello.
- Únicas por pueblo: `UN[t].civs = ['nor']`, `UN[t].hab = ['berserker', ...]`.
- Mercenarias: `UN[t].merc = true` (las define campaña o combate; campaña lleva los contratos).
- Tipos vetados por pueblo: `CIV[f].sinTipos = ['c','k',...]` (p.ej. sin caballos en América).

**Habilidades** (combate, `js/habilidades.js`): ids `grito`, `berserker` (bono temporal y luego bajón por debajo de lo normal), `muroEscudos`, `testudo`, `carga`, `lluviaFlechas`, `emboscada`, `fuegoGriego`, `estampida`, `espanto` (camellos/elefantes asustan caballos), `disparoParto`, `juramento`, `veneno`, `sacrificio`, `tambores`. Otros sistemas solo usan estos ids.

**Personajes no dinásticos** (generales de carrera, capitanes): entradas de `G.C` con `linaje: false`,
`rol: 'capitan'|'general'|'gobernador'`, `xp`, `nivel` (1-10), `fama`. Los crea combate (capitanes que surgen
tras victorias); no aparecen como herederos ni en bodas. Se pueden renombrar (acción `renombrar-<id>`, la
implementa social). `p.gob` = id del gobernador de la provincia (lo implementa social).

**Estaciones** (campaña): `G.estacion` 0..3 (primavera..invierno). El movimiento, asedios y máquinas avanzan
por estación; economía, investigación y eventos siguen siendo anuales (al cerrar el invierno).
- Campaña: estado en `G.cam` (ejércitos `G.cam.ej`, mercenarios `G.cam.merc`), estación en `G.estacion`. `batallaResuelta` añade `campana: 'encuentro'|'asalto'|'salida'`. Órdenes serializables: `camAplicarOrden(G, orden)`, `camResolverSimultaneo(G, ordenes)` (ver docs/campana.md).
- Los generales de ejércitos en campaña están en `G.cam.ej[].gen` (no los devuelve `genOf`).
- No entregues tropas `UN[t].merc` a otro pueblo por eventos o sobornos; respeta `civPuede(f, t)` al dar tropas.
- Mundo: `G.modo`, `G.activas`, `G.mapa`; pueblos ausentes con `G.F[f].ausente`. `CIV[f].pueblo` (frase), `CIV[f].base` (pueblo original pariente).
- Economía cobra en su balance anual solo lo que campaña no cobra por estación (`b.gAnual`, `b.netAnual`); las tropas `merc` no pagan soldada por `ecoMant` (las paga su contrato). `ecoSaqueo(p, fr, orden)` aplica un saqueo y devuelve el botín.
- Combate acepta en `ctx`: `dificultad` (`"dificil"`: IA de batalla más hábil, la usa el online cuando falta un jugador), `onl` y `onlRes` (batallas en vivo entre jugadores; ver docs/online.md).
- Personajes muertos hace más de 5 años se compactan a un esbozo (`id, n, f, sex, age, fa, mo, sp, tr, alive, dm, linaje, rol`): no leas otros campos de muertos antiguos.

## 9. Repetición de la estación (replay)

Al cerrar una estación (un jugador o online) el jugador ve, a velocidad acelerada, cada movimiento y cómo cambia el mapa.
- **Campaña** graba durante la resolución en `G.cam.rep` (se vacía al empezar cada estación; viaja en el estado online):
  `{ v: 1, anio, est, own0: [dueño de cada provincia al empezar], ej0: [{id, f, x, y, n}], pasos: [...] }` con pasos en orden:
  - `{k:'mov', ej, f, de:[x,y], a:[x,y]}` un paso de marcha
  - `{k:'ej+', ej, f, x, y, n}` ejército formado · `{k:'ej-', ej, motivo}` disuelto, deshecho o resguardado
  - `{k:'bat', x, y, fs:[facciones], gana, lugar}` batalla · `{k:'ase', p, f, fase:'ini'|'fin'}` asedio
  - `{k:'con', p, de, a}` cambio de dueño de una provincia (conquista, revuelta, rendición)
  Tope razonable de pasos (p.ej. 2000; si se supera, se resumen los movimientos de la IA lejana).
- **Interfaz** reproduce con `ifzRepetir(rep)`: dibuja el mapa con `own0` y los ejércitos de `ej0` y aplica los pasos animados (rápido: unos 15-40 s por estación según la cantidad, con botones Saltar y ×2), luego vuelve al estado real.
- **Online** llama a `ifzRepetir(G.cam.rep)` al recibir una estación resuelta (y el que resuelve también la ve); en un jugador se llama tras la estación si hubo movimientos (opción para desactivarla).
- Edificios de explotación por provincia: `p.mina`, `p.cantera`, `p.aserradero`, `p.salinas` (nivel ≤ riqueza del yacimiento) y `p.torre` (torre de vigilancia 0-3, no ocupa hueco). `tecVision(p)` → nivel de torre para el radio de visión. Tecnología lee `ecoYac(p)` / `ecoFertil(p)` de economía si existen (`tecYac(p)` como respaldo).
