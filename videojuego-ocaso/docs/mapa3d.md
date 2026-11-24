# Mapa de campaña en 3D

Archivos: `js/mapa3d.js` (carga después de `vendor/three.min.js` y `js/batalla3d.js`), `css/mapa3d.css`.

El mapa de campaña se ve en **vista isométrica ortográfica** (inclinación fija de 30°, como la batalla 3D) con
**giro libre** alrededor del eje vertical. No dibuja nada por su cuenta: cada fotograma, tras `drawMap`, copia
`#maphd` (terreno, dueños, niebla, ciudades) y `#map` (ejércitos, rutas, órdenes, selección) a un lienzo que es
la textura de un relieve hecho con `MAP.alt` (mar más bajo, costa suave). Todo lo que se pinte en el mapa 2D,
también lo que añadan otros sistemas, sale igual en 3D. La textura se sube a ~20 fps.

## Controles
| | Escritorio | Móvil |
|---|---|---|
| Desplazar | arrastrar | arrastrar |
| Zoom | rueda, botones − / + | pellizco, botones |
| Girar (libre) | botón derecho y arrastrar | girar dos dedos |
| Girar 22,5° | ⟲ ⟳, teclas **Q / W** (E sigue siendo «terminar turno») | ⟲ ⟳ |
| Elegir, marchar, atacar | clic | toque |

Un clic o toque se convierte (rayo contra el relieve → coordenadas de textura) en el mismo `click` sobre `#map`,
así que la lógica de selección y órdenes es la del mapa 2D; el ratón sin pulsar manda `mousemove` (texto de la
casilla). `centerOn` también centra la vista 3D. El botón **3D / 2D** de la barra del mapa cambia de vista; se
guarda en `localStorage["ocaso-m3d"]` (`{vista: "3d" | "2d"}`). Sin elección: 3D, salvo con WebGL por software
(SwiftShader, llvmpipe…) o sin WebGL, donde queda el mapa plano.

## Pendiente
- Ciudades, ejércitos y estandartes en volumen (ahora van pintados sobre el relieve, como en el 2D).
