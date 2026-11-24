# Batalla 3D

Archivos: `js/batalla3d.js` (carga justo después de `js/batalla.js` y de `vendor/three.min.js`),
`vendor/three.min.js` + `vendor/LICENSE-three.txt`, `css/batalla3d.css`, `pruebas/batalla3d.js`,
`assets/batalla3d/` (vistas previas de los modelos y paleta para el paquete de diseños).

La batalla táctica (`js/batalla.js`, sistema Combate) se ve en 3D con una **vista isométrica ortográfica
que gira alrededor del eje vertical**. La simulación no cambia: cada fotograma se **lee** la foto que da
`cmbRender()` (Combate, «Datos para el render» en `docs/combate.md`: campo, muro, ejércitos, unidades con
sus huecos de formación, caídas y estado, efectos y muertos) y se dibuja en un lienzo WebGL propio
(`#b3dgl`) que sustituye visualmente al lienzo 2D (`#bmap`). Los botones del panel lateral (`#bside`) no
cambian. Funciona con las batallas de dos ejércitos (`cmbTactica`) y con las de varios ejércitos y bandos
(`cmbTacticaMulti`: batalla en conjunto, asaltos por varios flancos, refuerzos a mitad de batalla).

## Three.js

- `vendor/three.min.js` = **three.js r160** (`npm pack three@0.160.1`, publicado en diciembre de 2023),
  `build/three.min.js` sin tocar. Es la última versión que trae la compilación UMD (global `THREE`);
  desde r161 solo hay módulos ES, que no sirven para scripts clásicos ni para `file://`. Licencia MIT en
  `vendor/LICENSE-three.txt`. Al cargar escribe un aviso de obsolescencia en la consola (es un `warn`, no
  un error). Todo es local: sin CDN, funciona en `file://`, en un servidor y en el APK.
- Comprobar la versión: `THREE.REVISION === "160"`.

## Opciones (barra bajo el campo, `#b3dbar`)

| Botón | Qué hace |
|---|---|
| **Vista: 3D / clásica** | Cambia entre la vista 3D y el lienzo 2D de siempre (la elección se recuerda). Si el jugador no ha elegido: 3D cuando hay WebGL con GPU; con WebGL **por software** (SwiftShader, llvmpipe… detectado con `WEBGL_debug_renderer_info`) se empieza en la clásica, porque cada fotograma costaría cientos de milisegundos y frenaría los turnos. Sin WebGL el botón queda en «clásica» y deshabilitado (sin errores: se sondea el contexto antes de crear el renderizador). |
| **⟲ ⟳** | Giran la vista 22,5° (con transición suave; instantánea con `prefers-reduced-motion`). El giro es libre: con el botón derecho o dos dedos gira de forma continua. |
| **Reiniciar vista** | Giro, zoom y encuadre iniciales (tu línea abajo a la izquierda). |
| **Seguir unidad** | La cámara sigue a la unidad elegida (`BT.sel`). |
| **Barras** | Cifras de hombres y barras de tamaño, moral y cansancio sobre cada unidad. Los avisos (general ⚑, habilidad, vacilación, desbocados) se ven siempre. |
| **Calidad: baja / media / alta** | Sombras, resolución del render y tope de figuras (tabla abajo). Por defecto: media en móvil, alta en escritorio. |

Los botones «− Zoom / Zoom +» de la barra existente hacen zoom ortográfico en 3D (se envuelve
`battleAct("zoom:…")`). Las preferencias se guardan en `localStorage["ocaso-b3d"]` (`{vista: "3d" | "2d" | null, cal, barras}`); `b3dVista()` da la vista efectiva.

## Controles

La cámara es **ortográfica con inclinación fija de 30°** (aire isométrico, figuras nítidas). No hay vistas
desde el suelo: se gira libremente alrededor del eje vertical (sin pasos fijos).

| Gesto | Escritorio | Móvil |
|---|---|---|
| Elegir unidad propia | clic | toque |
| Sumar/quitar de la selección | mayúsculas + clic, o mantener pulsado | mantener pulsada |
| Selección por rectángulo | mayúsculas + arrastre sobre el suelo, o mantener pulsado el suelo y arrastrar | mantener pulsado el suelo y arrastrar |
| Mover | clic en el suelo, o arrastrar desde la unidad hasta el destino | toque en el suelo, o arrastrar desde la unidad |
| Atacar | clic en un enemigo (⚔ / «A distancia» eligen cuerpo a cuerpo o tiro) | toque en un enemigo |
| Desplegar | clic en tu franja clara, o arrastrar la unidad | igual |
| Desplazar la vista | arrastrar el suelo (sin unidad bajo el puntero), botón central, flechas | arrastrar el suelo, o mover dos dedos |
| Zoom | rueda (conserva el punto bajo el cursor), `+` / `−`, botones de zoom | pellizco |
| Girar | ⟲ ⟳ y **Q / E** (22,5°), arrastre horizontal con el botón derecho (continuo) | girar dos dedos (continuo) |
| Reiniciar / seguir | R / F | botones |

Toques y clics se convierten en casillas del campo con un rayo desde la cámara contra el **relieve**
(marcha por el campo de alturas + bisección). Para elegir unidades se proyecta cada una a la pantalla
(elipse de su círculo `rad(u)` más la altura de las figuras) y se pasa su centro a `tapAt`, de modo que
toda la lógica de selección, órdenes de grupo (`orderGroup`, `groupSlots`), despliegue, ⚔/«A distancia»,
turnos y batallas en vivo (`canOrder`) es la de `batalla.js`. El rectángulo de selección se dibuja en
pantalla y elige las unidades cuya proyección cae dentro.

## Qué se dibuja

- **Terreno** (`BT.terr`): malla con relieve (2 subdivisiones por casilla, color plano por triángulo):
  colinas con altura suavizada, bosques con pinos y robles voxel instanciados, río con lecho hundido y
  agua, vados someros con piedras, dos o tres campos de labor (trigo o arado) y un faldón de tierra que
  convierte el campo en un diorama. Franjas de despliegue pegadas al relieve.
- **Cielo y luz** (`BT.env`): degradado del cielo, sol y su altura según la hora (alba, media mañana,
  tarde) y el clima (lluvia: luz apagada y gotas; niebla: niebla densa y sin sombras; calor: bruma
  dorada). Niebla ligera en la distancia.
- **Murallas** (`campo.muro`, ver `cmbRecinto` en `docs/combate.md`): la plaza en el **centro del campo**,
  cuatro lienzos de `x0..x1`, `y0..y1` con almenas hacia fuera, una puerta (dintel y hojas de madera abiertas)
  en el centro de cada lienzo, torres en las esquinas y cada seis casillas con banderas del defensor. Dentro,
  **la ciudad**: casas voxel con tejado a cuatro aguas (a la altura del adarve) y alguna torre. El daño
  (`hp / hp0`) derriba almenas y la parte alta y siembra escombros al pie del lienzo del `frente`; con `rota`
  se abre la brecha (`brecha.a..b` del lienzo del frente: lienzo y torres por los suelos y cascotes). Barra de
  integridad flotante sobre el lienzo norte. Muros sin `x0` (espejos online antiguos): no se dibujan.
- **Tropas**: cada unidad es su formación de `cmbRender()`: una figura voxel por **hueco vivo** de `huecos`
  (sin las `caidas`, de modo que las bajas dejan claros como en 2D; dos figuras por hombre cuando Combate
  usa `BT.dens = 2`, algo más pequeñas), columnas a lo ancho y filas en fondo, con el frente perpendicular
  a su rumbo. La posición dibujada sigue a la simulada con inercia y el rumbo se suaviza: mira hacia
  donde marcha o huye, a su blanco (`obj`) o al enemigo más cercano, o según `eje`/`cara` (asaltos por el
  norte o el sur). El estado (`estado` + `carga`) elige la animación. Los ejércitos que aún no han llegado
  (refuerzos) no se dibujan hasta que entran por su borde.
  Estados: quieto, marcha, carga (lanzas bajas, galope), melé (tajos, empujones en las dos primeras
  filas), tiro (brazo que tensa/lanza; la catapulta bate el brazo), huida (formación que se dispersa,
  bandera blanca). Estandarte en la retaguardia con los colores del pueblo; el del general, mayor y con
  remate de oro (`ejercitos[lado].general.ok`). Caídos (`muertos`) tumbados en el suelo y estandartes
  caídos (`std`) tendidos con sus colores. Flechas en parábola (`fx` con `arrow`).
  Anillos de selección dorados con borde oscuro (siempre visibles, también entre árboles), círculos de
  alcance a rayas en los modos por turnos, órdenes planeadas con destino y blanco (rojo), flecha y
  fantasmas verdes al arrastrar.
- **Rótulos** (`#b3dhud`, 2D a resolución de pantalla): cifras y barras, avisos, textos flotantes
  (bajas, habilidades), rectángulo de selección y una brújula (verde: tu lado; rojo: el enemigo) que
  orienta tras girar.

Varios bandos: el color de las figuras sale del pueblo de cada unidad (`CIV[f]`); las barras usan los
colores de la vista 2D: lo tuyo verde (`mio`), aliados verdiazul (`aliado`) y cada bando enemigo el suyo
(`CMB_COL_B`). Zonas de despliegue (`cmbZonaRects`: franjas junto a cada borde o, en un asedio, la plaza para la guarnición
y el anillo de alrededor para los atacantes): la tuya clara, las aliadas verdosas, las enemigas rojizas. La vista inicial (y «Reiniciar vista») gira la cámara para que **tu lado quede abajo a
la izquierda** (`b3dAz0()` según `cmbLadoDe` de tu ejército) y la brújula señala tu lado. Solo se eligen y
mandan tus unidades (`mio`); tocar un enemigo es atacarlo y tocar un aliado es como tocar el terreno.

## Modelos y colores (cómo cambiarlos)

Todo está en `js/batalla3d.js`:

- `B3D_PAL`: paleta de las figuras, una letra por color. `F` y `D` no son colores fijos: se tiñen por
  instancia con `CIV[f].c` y `CIV[f].d` del pueblo de la unidad.
- `B3D_TERR_PAL`: colores del terreno, agua y piedra. `B3D_CIELO` / `B3D_CLIMA`: cielo y luz.
- `B3D_MOD[id](L)`: cada modelo es una lista de cajas `[x, y, z, ancho, alto, fondo, color, parte,
  pivoteY, pivoteX]` en vóxeles (la figura mira a +X, +Y arriba, +Z a su derecha; 1 vóxel =
  `B3D_S` = 0,04 casillas). Ayudantes: `b3dHum(L, opciones)` (soldado: `escudo` medio/grande/peq/
  redondo/hoplon, `arma` espada/lanza/hacha/maza/jabalina/arco/ballesta/sifon, `casco`, `cresta`,
  `tocado` pelo/gorro/tiara/oso/jaguar/aguila/plumas/panuelo, `peto`, `capa`, `desnudo`, `mont`) y
  `b3dCaballo(L, {pelo, crin, barda})`. Partes animadas: 1/2 piernas, 3 brazo de tajo, 4/5 patas de
  montura, 6 tela de estandarte, 7 lanza, 8 brazo de tiro, 9 brazo de catapulta, 10 tronco del ariete.
- `B3D_TIPO`: tipo de tropa → modelo (las únicas tienen el suyo: testudo de los comitatenses, sifón del
  fuego griego, tiara de los Inmortales, piel de oso de los berserkers, yelmo de jaguar, plumas de águila,
  hoplon de bronce, ballesta, etc.). Un tipo nuevo sin entrada usa el modelo de su `rol`.
- `B3D_ESC`: escala por modelo (máquinas y elefantes más grandes).
- Para regenerar las vistas previas: `node pruebas/batalla3d.js exportar` → `assets/batalla3d/`
  (`modelo-<id>.png` a 288×288 con los colores de Occidente, `paleta.png`, `terreno.png`, `paleta.json`
  con todas las tablas). Si un diseñador entrega colores nuevos, basta con cambiar las tablas.

## Rendimiento

- **Un `InstancedMesh` por modelo** y un **único material** para todas las figuras
  (`MeshLambertMaterial` con `onBeforeCompile`): el tinte por pueblo y la animación (piernas, brazos,
  lanzas, patas, estandartes al viento, balanceo) se hacen en el sombreador de vértices con atributos
  por instancia (`iA` fase/estado/ritmo, `iC1`/`iC2` colores). Unas 20-30 llamadas de dibujo por
  fotograma aunque haya miles de figuras.
- Render a baja resolución (`px` píxeles CSS por píxel de render) escalado sin suavizado.
- Calidad baja y media usan modelos simplificados (sin las piezas diminutas que no son armas: pies,
  umbos, guardas, orejas, cascos de caballo…), unos 20-30 % menos triángulos.
- Con el mando delegado solo se dibujan las órdenes de la selección.
- Calidad:

  | | Render | Sombras | Figuras (tope) | Modelos | Árboles/casilla | Lluvia |
  |---|---|---|---|---|---|---|
  | baja | 1/3 (300-640 px) | no (manchas bajo las unidades) | 1 800 | simples | 1 | no |
  | media | 1/2,5 (360-820 px) | 1024², PCF suave | 4 000 | simples | 2 | 260 gotas |
  | alta | 1/2 (420-1100 px) | 2048², PCF suave | 8 000 | completos | 2 | 520 gotas |

  Si una batalla supera el tope, cada figura representa a varios hombres (la formación conserva su
  tamaño).
- Sin trabajo cuando la pestaña está oculta (`document.hidden`; además `requestAnimationFrame` se para).
- Al cerrar la batalla (o pasar a la vista clásica, o cambiar la calidad) se liberan geometrías,
  materiales e instancias (`dispose`) y se vacía la escena; el renderizador (un solo contexto WebGL) se
  conserva para la siguiente batalla. Si se pierde el contexto, se pasa a la vista clásica.
- Medidas de `node pruebas/batalla3d.js` (Chromium sin GPU, SwiftShader por software): ver la salida de
  la prueba («Rendimiento»). En SwiftShader el coste lo pone la rasterización por CPU; con GPU real el
  fotograma es de pocos milisegundos de JavaScript (actualizar matrices de miles de figuras).

## Accesibilidad

- `prefers-reduced-motion`: giros y zoom sin transición, rumbos sin suavizado, sin lluvia animada, sin
  parpadeo del aviso de vacilación.
- Selección: anillo dorado (la principal) o crema (las demás) con borde oscuro, dibujado por encima del
  suelo y de la vegetación; cifras en oro para las seleccionadas. Blancos de ataque en rojo.
- El contenedor 3D es enfocable (`tabindex=0`, `role="application"`) y todas las acciones tienen botón
  y tecla.

## Ganchos `/* 3D */` en `batalla.js`

**Ninguno.** No ha hecho falta tocar `batalla.js`: `batalla3d.js` carga después y envuelve dos
funciones globales:

- `drawBattle(now)` (la llama `frame()` de interfaz cada fotograma): con la vista 3D activa dibuja en
  WebGL a partir de `cmbRender()`; si no, llama a la original. También caduca `BT.fx` como hace la
  original.
- `battleAct(v)`: intercepta solo `zoom:in` / `zoom:out` en 3D; todo lo demás pasa a la original.

La escena se construye cuando cambia el objeto `BT` (cualquier camino: `cmbTactica`, batalla en vivo de
Online) y se libera cuando `#battle` pierde la clase `show`. Fuente de datos: `cmbRender()`. Para la
entrada y las guías se usan (solo lectura o llamadas) estas funciones de `batalla.js`: `act`, `bU`, `rad`,
`cmbFig`, `cmbCab`, `cmbSlots`, `cmbDens`, `nearest`, `tirador`, `alc`, `reach`, `slotStart`, `selU`,
`groupSlots`, `hitAt`, `tapAt`, `orderGroup`, `toggleSel`, `fixSlot`, `canOrder`, `mio`, `aliado`,
`cmbBnd`, `cmbLadoDe`, `cmbEnZona`, `cmbAZona`, `buzz`, `bui`, `CMB_COL_B` y las constantes `BW`, `BH`,
`TS`. Si Combate renombra alguna, hay que tocar `batalla3d.js`.

## Pruebas

`node pruebas/batalla3d.js` (Playwright; Chromium con `--use-angle=swiftshader --enable-unsafe-swiftshader`):
batallas t3, t1 (con murallas y máquinas) y rt con la vista 3D — despliegue tocando el suelo, selección
tocando una unidad (cambia `BT.sel`), orden de mover y de atacar por rayo, arrastre de una unidad,
rectángulo de selección, giros con botones y Q/E (capturas desde los 4 giros), zoom con botones y rueda,
desplazar, seguir y reiniciar, ejecución de turnos, vista clásica y vuelta, cierre con liberación de la
escena; tres batallas automáticas completas (lluvia al alba en colinas, asedio en bosque por la tarde,
niebla en vado); un asalto de varios bandos con `cmbTacticaMulti` (tú por el sur, un aliado por el
oeste, la guarnición en la ciudad y refuerzos enemigos por el norte, dos flancos): giro inicial por tu
lado, zonas, recinto con torres, elegir lo tuyo y no lo aliado; rendimiento con tres pueblos en tres
bandos y miles de figuras; calidad baja; exportación de modelos;
móvil táctil (toque, pellizco, giro con dos dedos); y caída a la vista clásica sin WebGL.
Capturas: `pruebas/capturas/batalla3d-*.png`.

## Peticiones

- **Combate**: (1) que `cmbRender()` incluya las puertas y el tramo de brecha del recinto
  (`muro.puertas: [[x, y]…]`, `muro.brecha: [y0, y1]`); hoy se replican las reglas del dibujo 2D
  (`y % 6`, casillas 8-15). (2) `cmbRender()` crea un array de `huecos` por figura en cada llamada;
  si diera `huecos` ya cacheados (p. ej. el mismo array de `cmbSlots`) el 3D se ahorraría basura en
  batallas de miles de figuras. (3) Un `estado: 'carga'` explícito (hoy se deduce de `marcha` + `carga`).
- **Mundo / siguiente fase**: el campo de batalla podría tomar el tono del lugar (nieve, desierto,
  estepa) de `mapaInfo(x, y)` alrededor de la provincia (`MAP.alt`, `MAP.tipo`, `MAP.rio`, `MAP.bosque`),
  sin cambiar `BT.terr` (que es lo que usa la simulación). La misma cámara isométrica girable
  (`b3dCamara`, `b3dGira`, `b3dPan`, `b3dCampo`) servirá para el mapa de campaña en 3D.
- **Interfaz**: el texto de ayuda bajo el campo (`.bmain .btns span.stats`) lo cambia la vista 3D mientras
  está activa; si se le da un id (`#bayuda`) la búsqueda sería más robusta.
