/* Manifest de sprites para abrir el juego desde file:// (fetch no puede leer manifest.json ahí).
   Lo genera `node herramientas/exportar-sprites.js --manifest` a partir de manifest.json, con los PNG
   incrustados como datos (así el navegador deja teñirlos). Vacío = se usan los sprites de código.
   Ver docs/interfaz.md. */
var OCASO_SPRITES = { version: 1, sprites: {} };
