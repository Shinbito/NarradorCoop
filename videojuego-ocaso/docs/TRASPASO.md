# Traspaso: estado del proyecto y cómo seguir

Documento para quien continúe el desarrollo (persona o Claude Code en otra máquina).
Rama de trabajo: `claude/gifted-gauss-pdu6a2` del repositorio `Shinbito/NarradorCoop`, carpeta `videojuego-ocaso/`.

## Qué es
«Ocaso del Imperio»: gran estrategia por turnos (estaciones) en navegador. HTML + JS clásico sin compilación
(scripts globales cargados en orden por `index.html`), pixel art, todo en español. Modos Histórico (410 d.C., 7
pueblos) y Mundo de leyendas (19 pueblos). Se juega abriendo `index.html` o sirviendo la carpeta.

## Arquitectura (leer primero)
- `docs/CONTRATO.md`: **obligatorio**. Propiedad de archivos por sistema, API `OC` (`js/ganchos.js`): eventos
  (`OC.on/emitir`), cálculos (`OC.mod/calc`), paneles, secciones, acciones, `OC.estado`, recursos; y notas de
  integración acumuladas (§7-9).
- Cada sistema tiene su `docs/<sistema>.md` con diseño, API y peticiones pendientes:
  narrativa, combate (motor de batalla, varios bandos, «Datos para el render»), campana (ejércitos en el mapa,
  asedios, flancos, batalla conjunta, niebla, espías, repetición), tecnologia, economia, diplomacia (y sociedad,
  gobernadores), mundo (pueblos, mapa y relieve), interfaz (mapa HD, sprites reemplazables por PNG, opciones),
  online (partidas largas, turnos simultáneos, batallas en vivo; solo funciona publicado como artefacto de Claude),
  batalla3d (Three.js r160 local en `vendor/`).
- Estado guardado en `G` (JSON; `localStorage` y online). Cada sistema en su clave (`G.nar`, `G.cmb`, `G.tec`,
  `G.eco`, `G.dip`, `G.cam`, `G.onl`). Las partidas antiguas deben seguir cargando.

## Pruebas (Playwright + Chromium)
En `videojuego-ocaso/`: `npm i -D playwright` (o global) y `npx playwright install chromium` la primera vez. Luego:
`node pruebas/humo.js 20`, y por sistema `node pruebas/<sistema>.js` (campana admite semilla; mundo admite
`--todas` para lanzar la batería completa). Todas deben acabar en «OK…». Fallos aleatorios conocidos: algunas
comprobaciones estadísticas de combate con pocas batallas, `diplomacia` «se emite 'sucesion'», `online` con
tiempos agotados bajo carga: repetir antes de investigar. Las capturas van a `pruebas/capturas/` (ignorado).

## Apps
- Android: `.github/workflows/apk-ocaso.yml` compila con Capacitor en cada push que toque `videojuego-ocaso/` y
  publica `ocaso.apk` en la release `ocaso-android`. Proyecto en `app-movil/` (ver su README).
- iPhone: `.github/workflows/ipa-ocaso.yml` compila un `.ipa` SIN FIRMAR en macOS (release `ocaso-iphone`) para
  instalar con Sideloadly/AltStore. La primera ejecución está por verificar.
- PWA: `manifest.webmanifest`, `sw.js` (lista de archivos con `node herramientas/lista-archivos.js` →
  `archivos.json`; regenerarla al añadir archivos), iconos con `node herramientas/generar-iconos.js`.

## Convenciones
- Commits en español, terminados con las líneas de atribución que use quien trabaje.
- Respetar la propiedad de archivos del contrato; cambios mínimos en archivos ajenos marcados con
  `/* OC */`, `/* CAM */`, `/* ONL */`, `/* 3D */`.
- Sin dependencias de CDN: todo local (funciona sin internet y dentro de la app).
- Prettier con ancho 110 para JS.

## Pendiente (a fecha de este traspaso)
1. **Tutorial extenso y Códice**: 14 capítulos guiados que señalan elementos reales, Códice generado a partir de
   los datos del juego con buscador, «?» de ayuda en cada pestaña y sección, elección al empezar (completo /
   básico / ya sé jugar). Archivos ya preparados: `js/tutorial.js`, `css/tutorial.css` (vacíos). Hacerlo al final
   para que explique el juego terminado. Sustituye el tutorial corto de interfaz (`IFZ_TUT`).
2. **Mapa de campaña en 3D**: se probó (relieve texturizado con giro libre, ciudades, montañas y bosques en volumen) y el usuario prefirió el mapa 2D: retirado. Se quiere, en cambio, ejércitos y personajes en pseudo-3D sobre el mapa 2D con la misma cámara isométrica girable de `batalla3d.js` (`b3dCamara`, `b3dGira`,
   `b3dPan`), usando el relieve de `MAP` (`mapaInfo`, `MAP.alt/mont/rio/puente/vado/camino/bosque`) y
   `ifzMapaInfo()` / `ifzFiguras(u)` de interfaz; el mapa 2D HD queda como vista clásica.
3. **Paquete de diseños para Gemini**: `node herramientas/exportar-sprites.js` (sprites a PNG ×1 y ×8, hojas por
   categoría y manifest) + capturas de cada pantalla + `assets/batalla3d/` + ficha técnica (paleta, tamaños,
   estilo) + texto listo para pegar en Gemini; y cómo reimportar con `assets/sprites/manifest.js`.
4. **Servidor propio para el VPS** (online sin Claude): Node que sirva el juego y emule `claude.use('db'|'user'|
   'room')` con cuentas propias (la prueba `pruebas/online.js` ya simula esa API en Node: buena base), cierre de
   estaciones vencidas en el servidor, notificaciones push (Web Push), Docker + Caddy (HTTPS con el nombre del
   proveedor o `<ip-con-guiones>.sslip.io`).
5. Peticiones abiertas entre sistemas (ver «Peticiones» de cada `docs/*.md`): combate (`cmbRender` con puertas y
   brecha, `huecos` sin reasignar, estado 'carga', leer `ctx.emboscada`), campaña (gancho `antesBatalla`,
   mercenarios online, `vh` en `rep.ej0`), interfaz («Quitar listo» en el botón, iconos de recurso en el mapa,
   repetición con niebla, niebla HD).
6. Decisión de diseño pendiente con el usuario: en leyendas, en 120 años sobreviven 4-5 de 12 pueblos (frenos en
   `dipTensionLey` de `js/diplomacia.js`).
