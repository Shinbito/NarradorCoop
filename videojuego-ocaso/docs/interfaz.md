# Interfaz — barra, pestañas, panel de mando, mapa, modales y sprites reemplazables

Archivos: `js/interfaz.js` (todo lo de abajo, incluidas las partes `CAM` de campaña), `js/inicio.js`
(pantallas de inicio y escena del menú; **no** la parte online: `leaveNet`, `openLobby`, `createOnline`,
`joinGame`, `enterGame`, `endOnline` son de Online), `js/mapa.js` (solo el dibujo: `ifzTileProc`,
`drawBase`; `gen()` es de Mundo), `js/musica.js`, `index.html`, `css/ocaso.css`, `css/interfaz.css`,
`assets/sprites/`, `herramientas/exportar-sprites.js`, `pruebas/interfaz.js`.

## 1. Lo que ve el jugador

- **Barra superior**: estación y año (`CAM_EST[G.estacion]`), oro y comida con su **saldo neto anual con
  signo** (`ecoResumen(ME)`, que es `inc(ME).g` / `.net`), los tres recursos con más reserva como iconos y
  un desplegable (botón ▾, Escape lo cierra) con todos los recursos, su reserva y su saldo anual. Botones
  `?` (ayuda), música y Menú.
- **Botón de fin**: lo escribe `ui()` con `camTextoFin()` («Fin de la primavera ▶» / «Fin del año ▶»).
  En online usa `onlTextoTurno()` (ver §4).
- **Pestañas**: icono pixel + rótulo corto en una rejilla que se reparte en dos filas (5 columnas en
  móvil), botones de ≥ 50 px de alto. Patrón `tablist`: flechas, Inicio y Fin cambian de pestaña con el
  foco; `aria-selected`, `aria-controls="panel"`. El `data-act="tab-<id>"` de siempre se conserva.
  Iconos por id (`IFZ_SP["tab.<id>"]`); una pestaña nueva sin icono usa uno genérico; el rótulo corto sale
  de `IFZ_CORTO[id]` o de su `titulo`.
- **Panel de provincia**: cabecera compacta (nombre, dueño y relación, oro/comida/orden, barra de orden y
  chips de ánimo `ecoNivel`, perfil `tecPerfil`, gobernador `socGob` y «Sitiada»); tropas **solo de las
  clases que hay** (`p.u[t] > 0`) con resumen «N levas · hombres · fuerza»; general; y las **secciones de
  los sistemas** (`OC.seccion('prov')`) envueltas en plegables `<details data-ifzsec="<id>">` cuyo título es
  el primer `<h3>` de la sección (que se oculta dentro, su HTML no se toca) y con un resumen a la derecha
  cuando está plegada (ánimo, impuestos, gobernador, huecos, compañías, oro…). Una sección cuyo HTML no
  empieza por `<h3>` se deja tal cual (p. ej. la línea del gobernador de una provincia ajena).
  Abiertas por defecto: Reclutar y Edificios; lo que el jugador abre o cierra se recuerda
  (`localStorage["ocaso-ifz"].sec`). La sección «Ejército» de campaña (`camSeccionProv`) se mete como
  sección `ejercito` de orden 22, justo tras Reclutar.
- **Potencias**: plegable (se recuerda), solo los pueblos en pie, **ordenados por fuerza** = `totPow(f)` +
  ejércitos de campo (`G.cam.ej`, `camUCampo`, sin máquinas) (`ifzFuerza(f)`), con provincias y etiqueta de
  relación (`dipTag`). Muestra 8 y un botón «Ver las N»; el jugador siempre aparece. Clic → Diplomacia con
  ese pueblo desplegado.
- **Crónica**: agrupada por año (`<details>`, los dos últimos abiertos) con filtros Todo / Mi reino /
  Guerra / Corte / Economía / Rumores. Usa las clases de la entrada (`good`, `bad`, `nar-rumor`… y, si algún
  sistema las añade, `guerra`, `corte`, `eco`) y, si no, palabras del texto (`IFZ_RE`). «Mi reino» = nombra
  a tu pueblo, tu soberano o tus provincias, o habla de «tu/tus».
- **Mapa en alta resolución** (§6): terreno detallado (hierba con matices y flores, bosques de pinos,
  robles y abedules con sombra, colinas iluminadas, montañas nevadas, ríos con meandros en las provincias
  con río, costa con arena, espuma y aguas someras, aldeas), campos de cultivo junto a las ciudades,
  caminos (calzadas empedradas con Calzadas), ciudades que crecen con la población y amurallan según su
  nivel, y castillo a doble tamaño en las capitales. Guarniciones con **insignia** (cifra pixel 3×5;
  ×2 con el mapa entero, ×1 al acercarse; gris si ya marcharon).
- **Ejércitos**: columnas de figuras (1 figura ≈ 1 leva de 10 hombres, entre 3 y 40; jinetes en vanguardia,
  bestias, infantería, arqueros, máquinas y carros de bagaje), estandarte del pueblo ondeando al frente y
  pendón dorado si lleva general, polvo al marchar, campamento con empalizada, tiendas, hoguera y humo,
  cerco con anillo de estacas y torres del color del sitiador y fuego y humo sobre la ciudad. La posición
  dibujada **se desliza** entre casillas a ritmo de `ifzVel()` (aunque la lógica salte de casilla en
  casilla). Alcance con relleno suave y contorno dorado, objetivos con esquinas rojas, ruta con huellas y
  destino marcado. Marcas de flanco y flechas del cerco: `camDibujarCerco` (campaña), que se llama escalado.
  Las órdenes encoladas de Online (`onlDibujarCola`) se dibujan en el lienzo lógico, encima.
- **Opciones** (⚙): velocidad de animación (lenta épica / normal / rápida), repetición de la estación
  sí/no, música y repetir el tutorial.
- **Repetición de la estación** (§7): tras cada estación con movimientos, el mapa vuelve al principio de la
  estación y se ven a velocidad acelerada las marchas, batallas, asedios y conquistas.
- **Minimapa** (esquina del mapa) cuando el mapa no cabe (zoom o móvil): tocarlo o arrastrarlo mueve la
  vista. Botón ♛ para volver a tu capital. Zoom con rueda, pellizco y botones − / +.
- **Hover**: «Provincia · pueblo · hombres · Ánimo ☺ · sitiada», y delante los ejércitos o el campamento de
  la casilla (`camHoverTxt`). **Economía**: el oyente `document.mousemove` de `economia.js` que añadía el
  ánimo ya no hace falta (ve el nombre y no repite nada); puede retirarse.
- **Modales**: cola (como siempre, `mq`), `role="dialog"`, foco al botón dorado o al primero, **Tab no sale
  del modal**, **Escape** pulsa el botón «Cancelar/Cerrar/Volver/Atrás» o el único botón de un aviso (nunca
  decide por el jugador si hay que elegir), al cerrar el foco vuelve a donde estaba. Botones de 48 px; en
  móvil la fila de botones queda pegada abajo y el modal se desplaza dentro.
- **Ayuda**: «¿Cómo se juega?» (tecla `?`, botón `?` y pantalla de inicio). **Tutorial** de 5 pasos para
  la primera partida: una tarjeta (no modal) sobre las pestañas que avanza sola cuando el jugador hace lo
  que dice (tocar provincia, reclutar, formar ejército, cambiar de pestaña, pasar la estación) o con
  «Siguiente»; «Omitir el tutorial»; se puede repetir desde la ayuda. Estado en `IFZ.pref.tut`.
- **Inicio**: menú en rejilla, «Continuar» dice qué partida («Occidente · primavera de 413»), tarjetas de
  pueblo con filete de su color e iconos de sus tropas, modos Histórico/Leyendas destacados. La escena del
  menú queda quieta con `prefers-reduced-motion`.
- **Batalla táctica** (solo CSS): barras más altas, textos del panel más grandes, botones de acción de 40 px,
  la unidad elegida con filete dorado en la lista.
- **Teclado**: `E` terminar (no con un modal, el menú o una batalla abiertos), `Esc` cancelar/cerrar,
  `?` ayuda, flechas en las pestañas. Tras pulsar un botón con el teclado que se redibuja, el foco vuelve al
  botón equivalente.

## 2. Rendimiento

`ui()` se llama muy a menudo. Ahora solo escribe en el DOM lo que cambia (`ifzPon(id, html)` compara con
el último HTML de cada contenedor: `#res`, `#tabs`, `#panel`, `#facs`, `#ifztut`), así no se pierden el
foco, la selección de un `<select>` ni el desplazamiento cuando nada cambia. Medidas en `IFZ.med`
(`n`, `ms` total, `max`, `ult`, `escrituras`). Con la partida inicial: ~0,4-0,6 ms por `ui()` repetido sin
cambios y 0 escrituras (`pruebas/interfaz.js` lo comprueba). El mapa reutiliza su capa estática y la capa
de alcance (clave: ejército, `camVer`, marcha, estación). Mapa HD (partida inicial, 1024×640): terreno
~55-85 ms una vez por mapa, capa política ~13 ms cuando cambia algo, cada cuadro < 1 ms de CPU
(`IFZ_HD.ms`, `IFZ_POL.ms`, `IFZ.medMapa`).

## 3. Estado y preferencias

`IFZ` (no se guarda en `G`): `pref` en `localStorage["ocaso-ifz"]` = `{sec:{id:bool}, pot, potTodas, log,
tut, vel ('lenta'|'normal'|'rapida'), rep (bool), iconos (bool)}`; `res` (desplegable abierto), `anios` (años de la crónica), `baseVer`, `med`. Acciones propias
(libres): `ifzres`, `ifzpot`, `ifzfac-<f>`, `ifzlog-<filtro>`, `ifztut-sig|fin|otra`, `ifzayuda`,
`ifzopc`, `ifzvel-<v>`, `ifzrepo-1|0`, `ifzico-1|0`, `ifzrep-saltar|x2`, `zoom-cap`.

## 4. Online

En partida online `ui()` pide el texto a **`onlTextoTurno()`** si existe (función global de Online):
debe devolver `{info, boton}` (o una cadena = `info`), que van a `#tinfo` y al botón de fin. Si no existe,
con estaciones simultáneas (`ONL.meta.listos`, `onlActivos`) se muestra «Online · listos 2/3» y «Listo ▶»
(«Esperando a los demás…» si ya estás listo); si tampoco, «Online · turno de X» como antes. Online puede
seguir escribiendo `#tinfo` desde su reloj (cuenta atrás): `ui()` solo lo reescribe si su texto cambia.
Cuando el jugador ya está «Listo» y la estación aún no se resuelve (`ONL.meta.fase === 'ordenes'`,
`listos[ME] === turno`, sin `ONL.resolviendo`), el botón de fin pasa a **«Quitar listo ✕»** (o el texto
`quitar` que devuelva `onlTextoTurno()`), con `data-act="ifzquitar"`, y llama a `onlQuitarListo()`.

## 5. Sprites reemplazables por PNG

Todos los gráficos del juego (sprites de `SP`, `MS` e `IFZ_SP`, el **kit de mapa** `MAPA.*`, el fondo del
menú) pueden sustituirse por PNG sin tocar código. El flujo para el usuario está en
**`herramientas/LEEME.md`**: exportar → rediseñar (Gemini) → importar.

1. **Exportar**: `node herramientas/exportar-sprites.js` (Node + Playwright) crea `assets/sprites/originales/`
   (carpeta de trabajo, ignorada por git): cada gráfico a tamaño real y ×8, muestras teñidas, **hojas por
   categoría** `hojas/<cat>@8x.png` (el atlas también `@4x`) con su **plantilla** `hojas/<cat>@<k>x.json`,
   **mapas de referencia** `renders/mapa-historico.png` (×2), `mapa-historico-detalle.png` (×4) y
   `mapa-leyendas.png`, y `manifest.plantilla.json`.
   Cada hoja: fondo #12171c, cada celda sobre **turquesa plano #00b4b4** (= transparente) con su etiqueta
   debajo, una rejilla gris y un **marco dorado #f2c14e de 4 px** alrededor de todo (la importación lo usa
   para encajar la hoja). Sin semitransparencias: cada píxel está entero o es fondo.
2. **Rediseñar** las hojas (Gemini u otro): mismo tamaño y posición de cada celda, el marco dorado y el
   fondo turquesa intactos. En los teñibles, **#ff00ff = color del pueblo** y **#800080 = su tono oscuro**.
3. **Importar**: `node herramientas/importar-hoja.js <hoja.png|jpg> <categoría>` encuentra el marco (tolera
   reescalado, desplazamiento y ruido de JPEG), elige la plantilla de esa categoría que mejor encaja,
   reduce cada celda a su tamaño real por **mayoría de 3×3 muestras por píxel**, cuantiza los colores
   (los cercanos se pegan al más frecuente), fuerza #ff00ff/#800080 en los teñibles, vuelve transparente el
   turquesa (salvo en las celdas opacas: suelos y agua), escribe `assets/sprites/<cat>/<nombre>.png`, añade
   las entradas a `manifest.json` y regenera `manifest.js`. Opciones: `--plantilla`, `--destino`, `--solo
   a,b`, `--prueba`. Probado con hojas ×1,03 y ×0,97, desplazadas y en JPEG: 99 % de píxeles iguales.
4. Para jugar desde `file://`, `manifest.js` lleva los PNG incrustados (lo regeneran el importador y
   `node herramientas/exportar-sprites.js --manifest`).

### Kit de mapa (atlas)

Celda base: **16×16 px = una casilla del mapa HD** (`IFZ_S`). Se decidió no subir a 32: el mapa de
Leyendas con 19 pueblos ya mide 1792×1120 px por capa, y a 32 px serían 3584×2240 (≈ 32 MB por capa,
demasiado para el móvil y la app de iPhone). Para dibujar con detalle se trabaja sobre la hoja ×8 (128 px
por celda); el importador la reduce. `ifzAtlas()` (mapa.js) lista todas las celdas en orden de hoja, cada
una con su dibujo procedural (el mismo que usa el mapa):

| Grupo | Celdas | Uso en el mapa |
|---|---|---|
| suelos | `MAPA.llanura|bosque|bosque_denso|colina|montana|nieve.0-3`, `paso.0-1`, `mar.profundo.0-1`, `mar.somero.0-1` (opacas) | suelo completo de la casilla (con su decorado: árboles, colinas, picos); la variante sale de un hash de la casilla. `nieve` = montaña de altura 9; mar profundo a ≥ 3 casillas de la costa |
| suelos | `MAPA.cultivo.0-3` | campos junto a las ciudades (capa encima del suelo) |
| costa | `MAPA.costa.<m>` (tierra con mar en los lados de la máscara) y `MAPA.espuma.<m>` (mar con tierra), m = 0-15 | autotile |
| ríos | `MAPA.rio.<m>` (vecinos con río; en la desembocadura, el mar), `puente.h|v`, `vado.h|v` | autotile; `v` = se cruza de norte a sur |
| caminos | `MAPA.camino.<m>`, `MAPA.calzada.<m>` (empedrada, con Calzadas) | autotile por casilla de `MAP.camino` |
| edificios | `MAPA.torre` (vigilancia), `mina`, `cantera`, `aserradero`, `salinas`, `puerto` | en una casilla de la provincia según el terreno (el puerto, en el mar junto a la ciudad) |
| ciudades | `MAPA.ciudad.1-4` (2×2, por número de casas), `capital` (3×3), `muralla.1-3` (2×2), `muralla_capital.1-3` (3×3) | ciudad y capital teñibles (bandera magenta) |
| naturaleza y casas | `IFZ.arbol.pino|roble|olivo|abedul`, `IFZ.mapa.colina|monte|monte2|aldea|casa|casa2|torre` | sprites sueltos (se sustituyen con su nombre `IFZ.*`) |

Máscaras de autotile: **N = 1, E = 2, S = 4, O = 8**. Desierto y estepa no existen como terreno del mapa
(son una cualidad económica de la provincia), así que no tienen celda.

El renderizador usa cada PNG si está y si no, el dibujo procedural: se pueden sustituir celdas sueltas.
Los ríos y caminos cambian a autotile en cuanto hay alguna celda `MAPA.rio.*` / `MAPA.camino.*` en el
manifest (si no, siguen con meandros y serpenteo procedurales). También vale una **hoja entera**:
`"MAPA.atlas": {"png": "atlas/hoja.png", "escala": 1, "celdas": {"MAPA.llanura.0": [x, y, w, h, tinte], …}}`
(coordenadas en píxeles de esa hoja; un PNG suelto manda sobre la hoja). Los antiguos `TILE.*` siguen
valiendo como respaldo de los suelos.

Formato de `manifest.json` (y de `OCASO_SPRITES` en `manifest.js`):

```json
{ "version": 1,
  "sprites": {
    "SP.castle":  { "png": "mapa/SP.castle.png", "w": 11, "h": 11, "tinte": true, "escala": 8 },
    "SP.i":       { "png": "tropas/SP.i.png", "w": 7, "h": 9, "tinte": true, "escala": 1 },
    "MS.c.0":     { "png": "batalla/MS.c.0.png", "w": 9, "h": 8, "tinte": true },
    "TILE.bosque":{ "png": "terreno/TILE.bosque.png", "w": 8, "h": 8 },
    "ESCENA.fondo":{ "png": "escena/ESCENA.fondo.png", "w": 200, "h": 112 } } }
```

- `png`: ruta relativa a `assets/sprites/`; o `datos`: data-URL (lo usa `manifest.js`).
- `w`, `h`: tamaño **en píxeles del juego** al que se dibuja (el del sprite de código; la plantilla lo
  trae). El PNG puede ser mayor: se escala sin suavizado.
- `tinte`: si se repinta con el color de cada pueblo (magenta → color, morado → oscuro).
- `escala`: píxeles del PNG por píxel del juego (por defecto 1). Con `escala > 1`, los **iconos de tropa**
  del panel se generan a esa resolución (se ven más nítidos); en el mapa y la batalla, que se dibujan a
  1:1, se usa el PNG reducido.
- Nombres: `MAPA.<clave>` (kit de mapa, tabla de arriba), `SP.<clave>` (mapa y tropas: `castle`, `castle2`, `town`, `tree`, `hill`, cada tipo de tropa…),
  `MS.<tipo>.<fotograma>` (soldados de la batalla táctica, 0 y 1 al andar), `IFZ.<clave>` (iconos de
  pestaña `IFZ.tab.<id>`, y del mapa: `IFZ.mapa.estandarte`, `tienda`, `mercenarios`, `escala`, `fuego`,
  `marcha`, `general`, `estandarte.0|1`, `pendon.0|1`, `tienda`, `tiendaF`, `hoguera.0|1`, `colina`,
  `monte`, `monte2`, `casa`, `casa2`, `torre`, `aldea`; árboles `IFZ.arbol.pino|roble|olivo|abedul`; figuras
  de los ejércitos `IFZ.fig.inf|arq|cab|cam|ele|maq|carro.<0|1>`), `TILE.mar|llanura|bosque|colina|montana`
  (casillas de 16×16 del mapa HD: con PNG se usa en lugar del suelo y el decorado de ese terreno; la costa y
  los ríos se pintan encima) y `ESCENA.fondo` (fondo del menú, 200×112; los soldados que desfilan siguen siendo sprites).
- Muchas tropas únicas y mercenarias **comparten** hoy el dibujo de su clase base (p. ej. `SP.ber` =
  `SP.i`): la plantilla lo indica con `nota`. Si el manifest trae un PNG para una de ellas, el juego la
  desdobla y esa tropa usa su propio PNG sin afectar a las demás.
- Funcionamiento: al cargar la página (`DOMContentLoaded`) se lee `manifest.json` por `fetch` (si no es
  `file://`) o `OCASO_SPRITES`; cada PNG se carga con caché; cuando llega el primero, `spr`, `sprF` e `icon`
  se envuelven para mirar antes si hay PNG para esas filas (índice por referencia del array de filas →
  nombre) y se vacían las cachés (`ICON`, iconos de pestaña, terreno). Un PNG que falta o no carga solo
  deja un aviso en la consola y se sigue usando el sprite de código. Sin manifest, nada cambia (ni se
  envuelve nada).
- Funciones: `ifzSprCatalogo()` (lista de sprites con categoría, tamaño, tinte y alias),
  `ifzSprRender(nombre, escala, 'plantilla'|'muestra', f)` (lienzo), `ifzSprAplicar(manifest)`,
  `ifzTeselaSuelta`, `ifzEscenaFondo`. Las categorías de la exportación: tropas, batalla, mapa, ejercito,
  naturaleza, ciudad, interfaz, terreno, escena.
- Los sprites de interfaz (`IFZ.*`) usan la paleta `IFZ_PAL`; los teñibles llevan `F`/`f` (color del
  pueblo) y `r` (su tono oscuro).

## 6. Mapa en alta resolución

- `#maphd` mide `W·IFZ_S × H·IFZ_S` (IFZ_S = 16; el doble de la lógica, `T` = 8); `#map` (cv) sigue
  midiendo `W·T × H·T`, encima, **transparente**: recibe clics, hover y lo que otros sistemas dibujen con
  `ctx` (en coordenadas lógicas). Ambos van dentro de `#mapcapas`, que es lo que escala el zoom. Las pruebas
  que calculan posiciones con `cv.width` y `getBoundingClientRect()` siguen valiendo.
- Capas: `ifzTerrenoHD()` (mapa.js: suelo, costa, ríos, bosques, relieve y aldeas; una vez por mapa),
  `ifzPolitico(dueños)` (tinte de dueños, campos, caminos, fronteras y ciudades; se rehace solo si cambian
  dueños, murallas, granjas, población, capitales o Calzadas; recibe los dueños, así la repetición pinta
  `own0` sin rehacer el terreno) y, cada cuadro, resaltes, banderas, insignias, campaña y efectos.
- `ifzMapaInfo()` lee el **relieve de Mundo** (`MAP.v` ≥ 2, docs/mundo.md §6): montañas infranqueables
  (`MAP.mont`: roca oscura con picos nevados), pasos (`MAP.paso`: collado con hitos), ríos continuos
  (`MAP.rios`, hasta el mar, más anchos en la desembocadura), puentes (`MAP.puente`: tablero de madera
  orientado según el cauce), vados (`MAP.vado`: aguas claras y piedras), caminos (`MAP.camino`: tramos entre
  casillas vecinas, empedrados si el dueño tiene Calzadas), bosque denso (`MAP.bosque`: sombra y más
  coníferas) y altura (`MAP.alt`: luz del noroeste en las laderas que suben, sombra en las que bajan, tierras
  altas más pardas). En partidas antiguas (v1, sin `G.mapa.v`) se mantiene el dibujo anterior como
  respaldo: montañas solo decorativas en el corazón de las colinas, ríos decorativos en las provincias con
  río de `cmbTerreno` y caminos entre ciudades vecinas. Además calcula distancias a la costa, aldeas y
  casillas/bordes de cada provincia. Nada de esto cambia `gen()` ni la lógica.
- **Recurso principal** (`ecoIconoProv(p)`): icono pequeño (glifo dorado sobre fondo oscuro) junto a cada
  provincia cuya economía ve el jugador (`ecoInfoVisible(p, ME)`, o `camVeProv`); lista cacheada
  (`ifzRecProv`, se rehace al cambiar de estación o de dueños, o cada 4 s, porque `yields` es caro). Se oculta
  en ⚙ Opciones (`IFZ.pref.iconos`). También va en el hover («· ⚒ Hierro») y en el resumen de la sección
  plegada «Tierras» (icono + `ecoFertil(p).txt`, o «ignotas»).
- Hover: el nombre del terreno de la casilla con `mapaInfo` («Montaña infranqueable», «Río», «Puente»,
  «Vado», «Paso de montaña», «Bosque denso», «Llanura con camino»…) tras el nombre de la provincia
  (`ifzTerrenoTxt(x, y)`).
- `drawBase()` solo marca el terreno para rehacerlo en el cuadro siguiente.
- **Niebla de guerra en HD** (`ifzVeloNiebla(c, f)`, con la lógica de campaña: `camVisMapa`, `camExpArr`,
  `G.cam.mem`): lo no explorado, oscuro con grano; lo explorado y no visible, el terreno HD sin los dueños
  actuales, el color del último dueño conocido, un velo y sus ciudades con las últimas levas conocidas. Se
  pinta encima de banderas, guarniciones y resaltes (no filtra información) y se cachea con la clave de
  campaña. `ifzVeCasilla(f, x, y)` dice si el jugador ve una casilla. Si faltan funciones de campaña se usa
  `camDibujarNiebla` escalada.

## 7. Ritmo de las animaciones y repetición

- **`ifzVel()`** → multiplicador de tiempo: 2,5 lenta (por defecto), 1 normal, 0,45 rápida (Opciones,
  `IFZ.pref.vel`); **0** con `prefers-reduced-motion` o en un navegador automatizado (`navigator.webdriver`:
  las pruebas no esperan animaciones). `IFZ.velForzada` lo fija a mano (pruebas).
- **`ifzPasoMs()`** → ms que tarda la interfaz en mostrar un paso de una casilla (250 × `ifzVel()`: 625 en
  lenta). La interfaz desliza cada ejército hacia su casilla real a `4 / ifzVel()` casillas por segundo
  (`ifzPosEj`), aunque la lógica salte antes.
- **`ifzRepetir(rep)`** → Promise (CONTRATO §9): pinta `rep.own0` y los ejércitos de `rep.ej0` y aplica
  `rep.pasos` en orden: marchas (se agrupan los pasos consecutivos de ejércitos distintos para que se muevan
  a la vez), ejércitos que aparecen o se deshacen (fundido), batallas (chispazos, humo y rótulo «lugar ·
  vence X»), asedios (el anillo aparece y desaparece) y conquistas (la provincia cambia de color con un
  destello). Duración por grupo: marcha 260 ms, batalla 950, conquista 850, asedio 450, alta/baja 200;
  si el total pasa de 40 s se acelera, si no llega a 15 s se alarga hasta ×1,6. Barra con progreso, «×2»
  (×2/×4) y «Saltar» (o Escape); una capa cubre la pantalla mientras dura. Al acabar vuelve al estado real.
  Devuelve `false` (sin esperar) si no hay pasos, si ya hay otra en curso o si `ifzVel()` es 0
  (`IFZ.repForzar = true` la fuerza en pruebas).
- **Niebla**: solo se reproducen los pasos cuyo `vh` incluye al jugador (o que no traen `vh`), los
  ejércitos iniciales que ve, y la niebla HD se pinta encima (las conquistas bajo la niebla no destellan).
  Los espías (`esp` / `esp-`) se ven como una figura embozada que se desliza (`IFZ.fig.espia.0|1`).
  `ifzRepVisibles(pasos)` hace el filtro.
- En un jugador se lanza con el evento de campaña **`repeticionLista`** (al cerrar `G.cam.rep`, con lo anual y
  las marchas pendientes incluidas) si `IFZ.pref.rep` no es `false`. En online la llama Online.

## 8. Pruebas

`node pruebas/interfaz.js`: en escritorio (1400×900) y móvil (390×844, `isMobile`) recorre inicio, barra
(estación, oro con signo, desplegable), tutorial, provincia (tropas solo presentes, secciones plegables y su
memoria), todas las pestañas con todo desplegado **midiendo `scrollWidth`** del documento y del panel,
pestañas por teclado, crónica y sus filtros, potencias (fuerza con ejércitos de campo y orden), hover con
ánimo, modales (cola, foco, Tab, Escape, Enter), ayuda, rendimiento de `ui()` y un año de juego; después
sprites por manifest (PNG que sustituye, tinte, iconos a escala, alias desdoblado, PNG que falta); mapa
HD (tamaños, lienzo lógico encima, tiempos del terreno, la capa política y cada cuadro), Opciones
(velocidad guardada), interpolación de un ejército entre casillas, una repetición sintética (grupos,
barra, capa de bloqueo, ×2, Saltar, duración, vuelta al estado real; se salta sola con `ifzVel()` 0) y una
partida guardada antigua. Capturas `interfaz-terreno-*` (antes/después del mapa HD, opciones y repetición). Capturas `pruebas/capturas/interfaz-*.png`.

## 9. Peticiones

1. **Economía**: retirar el oyente `document.mousemove` que añade el ánimo y el recurso principal a `#hv`:
   la interfaz ya los muestra (`ecoNivel`, `ecoIconoProv` con `ecoInfoVisible`) y el oyente no añade nada.
2. **Campaña** (inactiva): `camDibujar` y `camSprite` ya no se usan desde `drawMap` (la interfaz dibuja la
   capa de campaña con sus funciones de lógica); se pueden dejar como respaldo. El texto del botón de fin ya
   no hace falta corregirlo desde `camDibujar`.
3. **Online**: exponer `onlTextoTurno()` → `{info, boton}` (§4) y dejar de escribir `#tinfo` desde el
   reloj salvo la cuenta atrás. `onlInstalar` envuelve `camDibujar` para pintar la cola: la interfaz llama
   a `onlDibujarCola(now)` directamente, así que esa envoltura ya no es necesaria.
4. **Todos**: para que los filtros de la Crónica sean exactos, añadir a `addLog` una clase de categoría
   (`"bad guerra"`, `"good corte"`, `"eco"`…). Hoy se deduce del texto.
5. **Núcleo/combate**: un gancho oficial para los sprites (p. ej. que `spr`/`sprF` consulten
   `OC.sprite(filas, paleta)`) evitaría que la interfaz tenga que envolver `spr`, `sprF` e `icon` cuando
   hay PNG.
6. **Campaña**: para que la lógica vaya a la par del dibujo, esperar `ifzPasoMs()` (250 ms × `ifzVel()`)
   en cada paso de marcha del jugador en `camDarPaso` (hoy `sleep(55/90 ms × camVel())`); el valor `ej.anim`
   no hace falta (la interfaz desliza sola). La repetición se lanza en `finEstacion`, antes de
   `camNuevaEstacion`: si se quiere incluir lo anual y las marchas pendientes en la misma repetición, emitir
   un evento al cerrar `G.cam.rep` (p. ej. `repeticionLista`) y la interfaz se colgará de él.
   `camSprite`/`camDibujar` ya no se usan.
7. **Combate**: escalar sus tiempos de animación de la batalla táctica (marchas, golpes, `sleep`) con
   `ifzVel()` (0 = sin espera) para que la opción de velocidad se note también allí.
8. **Campaña** (niebla): la interfaz ya dibuja la niebla en HD con `ifzVeloNiebla` en lugar de
   `camDibujarNiebla` (que queda como respaldo); si cambia la estructura de `camVisMapa`/`camExpArr`/`mem`,
   avisar para mantenerla.


## Relieve (`js/relieve.js`)

El mapa de campaña se ve de frente (sin girar): clics, zoom y desplazamiento son los de siempre. Al construir el terreno (`ifzTerrenoHD`) se **graban** las llamadas a `ifzDibT` de los decorados con altura (`REL_ESC`: picos, colinas, árboles, aldeas) en vez de pintarlos; después `relCapa` los pinta de pie, más grandes, apoyados en su base, con sombra y ordenados por profundidad, junto con las ciudades (`ifzCiudad`, ahora una función aparte; `relCiudad` mide la base real del dibujo para que no floten). Con relieve, `drawMap` pinta la niebla antes de la capa de pie (lo oculto sale ensombrecido, y las ciudades ocultas como un pueblo cualquiera, `ifzCiudad(…, oculta)`), y encima insignias y ejércitos; las insignias de provincias que no se ven no se pintan. La capa se guarda en caché (se rehace al cambiar mapa, dueños o lo visible: ~13 ms). Botón «Relieve» en la barra del mapa (`localStorage["ocaso-relieve"]`).
