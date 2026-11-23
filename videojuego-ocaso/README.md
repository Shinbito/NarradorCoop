# Videojuego Ocaso — *Ocaso del Imperio*

Juego de gran estrategia por turnos en el navegador: año 410 d.C., Roma se desmorona
y siete pueblos se disputan sus provincias. Dinastías, bodas, traiciones, economía,
tecnología y batallas tácticas en pixel art.

## Jugar

Abre `index.html` en el navegador (no necesita servidor ni compilación).

## Estructura

- `index.html` — página y carga de módulos.
- `js/ganchos.js` — API `OC` que conecta los sistemas (ver `docs/CONTRATO.md`).
- `js/nucleo.js` — constantes, civilizaciones, estado global.
- Sistemas: narrativa (`narrativa.js`, `historia.js`), combate (`clases.js`, `campana.js`,
  `batalla.js`, `ia.js`), tecnología (`tecnologia.js`, `civilizaciones.js`), economía
  (`economia.js`, `comercio.js`), diplomacia y social (`diplomacia.js`, `sociedad.js`,
  `partida.js`), interfaz (`interfaz.js`, `inicio.js`, `mapa.js`, `musica.js`).
- `docs/` — diseño de cada sistema.
- `pruebas/humo.js` — prueba automática con Playwright: `node pruebas/humo.js 15`.
- `original/ocaso-original.html` — versión de partida en un solo archivo.
