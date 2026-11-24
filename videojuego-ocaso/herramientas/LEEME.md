# Rediseñar los gráficos de Ocaso del Imperio (con Gemini u otra herramienta)

Todo lo que se ve en el juego —tropas, soldados de batalla, iconos, el **mapa entero** (suelos, mar,
costa, ríos, caminos, puentes, ciudades, murallas, edificios, árboles…) y el fondo del menú— se puede
cambiar por dibujos nuevos sin tocar el código. El flujo es: **exportar → rediseñar → importar**.

Necesitas Node.js y Playwright (los mismos que usan las pruebas). Todo se ejecuta desde la carpeta
`videojuego-ocaso`.

## 1. Exportar los gráficos actuales

```
node herramientas/exportar-sprites.js
```

Crea `assets/sprites/originales/` con:

- `hojas/` — **una hoja por categoría**, lista para mandar a Gemini:
  - `atlas@8x.png` y `atlas@4x.png`: el **kit de mapa** (suelos con variantes, mar, costa, ríos, caminos,
    puentes, vados, ciudades por tamaño, capital, murallas, torre, mina, cantera, aserradero, salinas,
    puerto, árboles, colinas, montes, casas, aldea).
  - `tropas@8x.png`, `batalla@8x.png`, `ejercito@8x.png`, `mapa@8x.png`, `ciudad@8x.png`,
    `naturaleza@8x.png`, `interfaz@8x.png`, `terreno@8x.png`, `escena@4x.png`.
  - Junto a cada hoja, un `.json` con su **plantilla** (dónde está cada celda). No lo borres: la
    importación lo necesita.
- `renders/` — **el mapa completo** tal como se ve hoy (`mapa-historico.png`, `mapa-historico-detalle.png`
  y `mapa-leyendas.png`), para que Gemini vea el conjunto y mantenga el estilo.
- Cada gráfico suelto (a tamaño real y ×8) y `manifest.plantilla.json`, por si quieres trabajar uno a uno.

## 2. Rediseñar con Gemini

Pásale la hoja (por ejemplo `hojas/atlas@8x.png`) y, como referencia, los mapas de `renders/`. Un
encargo que funciona bien:

> Redibuja cada celda de esta hoja de sprites en pixel art más detallado y realista, con el mismo
> estilo para todas. **No muevas ni cambies el tamaño de ninguna celda**, deja las etiquetas, deja el
> **marco dorado** exterior y el **fondo turquesa plano** (#00b4b4) donde hoy está (es la transparencia).
> Respeta los colores **magenta #ff00ff** y **morado #800080**: el juego los repinta con el color de cada
> pueblo. Las celdas de suelo deben poder repetirse una junto a otra sin que se note la costura, y las de
> costa, río y camino deben encajar con sus vecinas (la etiqueta dice qué lados tocan: N = 1, E = 2,
> S = 4, O = 8; por ejemplo `MAPA.rio.5` es un río que va de norte a sur).

Consejos:

- Da igual que la hoja vuelva un poco más grande o más pequeña, algo movida o en JPEG: la importación lo
  corrige. Lo importante es que el marco dorado se vea entero.
- Puedes rediseñar solo algunas celdas: las demás se quedan como estaban.
- Si Gemini cambia el fondo turquesa, las celdas que deberían ser transparentes saldrán con fondo; pídele
  que lo respete o retócalo.

## 3. Importar lo que devuelve Gemini

```
node herramientas/importar-hoja.js ruta/a/la-hoja-de-gemini.png atlas
```

(el segundo dato es la categoría: `atlas`, `tropas`, `batalla`, `ejercito`, `mapa`, `ciudad`,
`naturaleza`, `interfaz`, `terreno` o `escena`).

La herramienta encuentra el marco, recorta cada celda, la reduce a su tamaño real, limpia los colores,
vuelve transparente el turquesa, guarda los PNG en `assets/sprites/<categoría>/` y actualiza
`assets/sprites/manifest.json` y `manifest.js`. Abre `index.html` y el juego ya usa los dibujos nuevos.

Para la versión instalable (PWA / app de iPhone), ejecuta después `node herramientas/lista-archivos.js`
para que los PNG nuevos entren en la lista de archivos que se guardan sin conexión.

Opciones útiles:

- `--prueba`: solo comprueba que encuentra la hoja y cuántas celdas lee, sin escribir nada.
- `--solo MAPA.llanura.0,MAPA.rio.5`: importa solo esas celdas.
- `--plantilla otra.json`: usa una plantilla concreta.

## 4. Deshacer

Borra las entradas que no quieras de `assets/sprites/manifest.json` (o deja `"sprites": {}`) y ejecuta
`node herramientas/exportar-sprites.js --manifest` para regenerar `manifest.js`. Sin entradas, el juego
vuelve a sus dibujos de siempre.

Detalles técnicos (formato del manifest, nombres, autotile, hoja entera `MAPA.atlas`): `docs/interfaz.md` §5.
