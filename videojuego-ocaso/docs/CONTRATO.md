# Contrato entre sistemas — Ocaso del Imperio

El juego se desarrolla por **sistemas**, cada uno con un responsable. Para poder
trabajar en paralelo sin pisarse, cada sistema **solo edita sus archivos** y se
comunica con los demás a través del objeto global `OC` (`js/ganchos.js`).

## 1. Propiedad de archivos

| Sistema | Archivos propios (edición libre) | En `js/nucleo.js` puede tocar solo |
|---|---|---|
| **Narrativa** | `js/narrativa.js`, `js/historia.js`, `css/narrativa.css`, `docs/narrativa.md` | `EVENTS` está en narrativa.js; en núcleo nada |
| **Combate y clases** | `js/batalla.js`, `js/campana.js`, `js/clases.js`, `js/ia.js`, `css/combate.css`, `docs/combate.md` | `UN`, `MULT`, `TYP`, `pw`, `tot`, `SP` (sprites de tropa), `REB`-tropas |
| **Tecnología y civilizaciones** | `js/tecnologia.js`, `js/civilizaciones.js`, `css/tecnologia.css`, `docs/tecnologia.md` | `BLD` y los campos de `CIV` relativos a progreso (añadir campos, no borrar) |
| **Economía** | `js/economia.js`, `js/comercio.js`, `css/economia.css`, `docs/economia.md` | `TAX`, `TAXM`, `TAXO` |
| **Diplomacia y social** | `js/diplomacia.js`, `js/sociedad.js`, `js/partida.js`, `css/diplomacia.css`, `docs/diplomacia.md` | `TRAITS`, `trait`, `mkChar`, `marry` |
| **Interfaz** | `js/interfaz.js`, `js/inicio.js`, `js/mapa.js`, `js/musica.js`, `index.html`, `css/ocaso.css`, `css/interfaz.css`, `docs/interfaz.md` | — |
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
  Claves reservadas: `G.nar`, `G.cmb`, `G.tec`, `G.eco`, `G.dip`.
- Datos por provincia (`G.P[i]`) o por facción (`G.F[f]`) se pueden añadir como
  campos nuevos con prefijo si no son obvios; siempre con valor por defecto si faltan.
- Facciones: `f` de `0` a `NF-1` (7 reinos); `REB = 7` son los rebeldes/bagaudas.
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
| `conquista` | `{p, de, a}` | combate | una provincia cambia de dueño por las armas |
| `batallaResuelta` | `{p, atacante, defensor, gana, A, D, s0, gA, gD, ...}` | combate | después de cualquier batalla (auto o táctica) |
| `revuelta` | `{p, de}` | economía (y sociedad en traiciones/guerra civil) | una provincia se subleva y pasa a `REB` (se emite antes del cambio de dueño) |
| `tecnologiaInvestigada` | `{f, id}` | tecnología | |
| `eraNueva` | `{f, era}` | tecnología | |
| `edificioConstruido` | `{f, p, id, nivel}` | tecnología | |
| `guerraDeclarada` / `pazFirmada` / `alianzaSellada` | `{a, b}` | diplomacia | |
| `bodaCelebrada` | `{a, b}` (personajes) | diplomacia | |
| `muertePersonaje` | `{c, motivo}` | diplomacia (`kill`) | |
| `sucesion` | `{f, anterior, nuevo}` (personajes, no ids) | diplomacia | |
| `crisisEconomica` | `{f, tipo}` con tipo `hambre`, `impagos`, `bancarrota`, `peste`, `inflacion` | economía | |

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
