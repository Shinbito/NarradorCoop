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
- **Mapa**: la capa de terreno + color de dueños + fronteras se cachea y solo se rehace si cambian dueños,
  selección, hover o el terreno. Guarniciones con **insignia** (cifra pixel 3×5 sobre fondo oscuro con
  filete del color del pueblo; gris si ya marcharon). Campaña (`ifzCamDibujar`, sustituye al dibujo de
  `camDibujar` usando la misma lógica): estandarte del pueblo (con punta dorada si lleva general), sprite de
  infantería o caballería, insignia con las levas (gris si no le queda marcha; a la izquierda si está en una
  ciudad, para no tapar el castillo), tienda si acampa, escala si asedia, flecha si tiene marcha pendiente;
  alcance como relleno suave con **contorno**, objetivos con esquinas rojas, ruta con puntos con borde y el
  destino marcado (dorado si no llega esta estación); asedios con esquinas rojas, escala, fuego y punto rojo
  de hambre; campamentos mercenarios con tienda dorada. Si faltara alguna función de campaña se llama a
  `camDibujar()` como antes. Las órdenes encoladas de Online (`onlDibujarCola`) se dibujan también.
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
de alcance (clave: ejército, `camVer`, marcha, estación).

## 3. Estado y preferencias

`IFZ` (no se guarda en `G`): `pref` en `localStorage["ocaso-ifz"]` = `{sec:{id:bool}, pot, potTodas, log,
tut}`; `res` (desplegable abierto), `anios` (años de la crónica), `baseVer`, `med`. Acciones propias
(libres): `ifzres`, `ifzpot`, `ifzfac-<f>`, `ifzlog-<filtro>`, `ifztut-sig|fin|otra`, `ifzayuda`,
`zoom-cap`.

## 4. Online

En partida online `ui()` pide el texto a **`onlTextoTurno()`** si existe (función global de Online):
debe devolver `{info, boton}` (o una cadena = `info`), que van a `#tinfo` y al botón de fin. Si no existe,
con estaciones simultáneas (`ONL.meta.listos`, `onlActivos`) se muestra «Online · listos 2/3» y «Listo ▶»
(«Esperando a los demás…» si ya estás listo); si tampoco, «Online · turno de X» como antes. Online puede
seguir escribiendo `#tinfo` desde su reloj (cuenta atrás): `ui()` solo lo reescribe si su texto cambia.

## 5. Sprites reemplazables por PNG

Todos los sprites del juego son matrices de texto en el código (`SP` en nucleo.js, `MS` en batalla.js,
`IFZ_SP` en interfaz.js) o dibujo procedural (terreno, fondo del menú). Cualquiera puede sustituirse por
un PNG sin tocar código:

1. Exportar los actuales: `node herramientas/exportar-sprites.js` (Node + Playwright) crea
   `assets/sprites/originales/` con cada sprite a tamaño original y ×8 sin suavizado
   (`<categoría>/<nombre>.png`, `<nombre>@8x.png`), muestras teñidas (`muestras/`), **hojas por categoría**
   (`hojas/tropas.png`, `mapa`, `batalla`, `interfaz`, `terreno`, `escena`) y `manifest.plantilla.json`
   con todas las entradas. (Esa carpeta es de trabajo: no hace falta subirla.)
2. Rediseñar los PNG (p. ej. con Gemini). Se pueden entregar a ×1 o más grandes (×2, ×4, ×8: poner
   `escala`). En los teñibles, **#ff00ff (magenta) = color del pueblo** y **#800080 = su tono oscuro**;
   los tonos intermedios de magenta se respetan como sombreado.
3. Guardarlos en `assets/sprites/<categoría>/<nombre>.png` y copiar sus entradas a
   `assets/sprites/manifest.json`.
4. Para jugar desde `file://` (abrir index.html con doble clic): `node herramientas/exportar-sprites.js
   --manifest` regenera `assets/sprites/manifest.js` con los PNG incrustados en base64 (en `file://` el
   navegador no deja leer el JSON ni teñir PNG sueltos).

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
- Nombres: `SP.<clave>` (mapa y tropas: `castle`, `castle2`, `town`, `tree`, `hill`, cada tipo de tropa…),
  `MS.<tipo>.<fotograma>` (soldados de la batalla táctica, 0 y 1 al andar), `IFZ.<clave>` (iconos de
  pestaña `IFZ.tab.<id>`, y del mapa: `IFZ.mapa.estandarte`, `tienda`, `mercenarios`, `escala`, `fuego`,
  `marcha`, `general`), `TILE.mar|llanura|bosque|colina` (casillas de 8×8 del terreno; la costa se pinta
  encima) y `ESCENA.fondo` (fondo del menú, 200×112; los soldados que desfilan siguen siendo sprites).
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
  `ifzTileProc`, `ifzEscenaFondo`.

## 6. Pruebas

`node pruebas/interfaz.js`: en escritorio (1400×900) y móvil (390×844, `isMobile`) recorre inicio, barra
(estación, oro con signo, desplegable), tutorial, provincia (tropas solo presentes, secciones plegables y su
memoria), todas las pestañas con todo desplegado **midiendo `scrollWidth`** del documento y del panel,
pestañas por teclado, crónica y sus filtros, potencias (fuerza con ejércitos de campo y orden), hover con
ánimo, modales (cola, foco, Tab, Escape, Enter), ayuda, rendimiento de `ui()` y un año de juego; después
sprites por manifest (PNG que sustituye, tinte, iconos a escala, alias desdoblado, PNG que falta) y una
partida guardada antigua. Capturas `pruebas/capturas/interfaz-*.png`.

## 7. Peticiones

1. **Economía**: retirar el oyente `document.mousemove` que añade el ánimo a `#hv` (la interfaz ya lo
   muestra con `ecoNivel`).
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
