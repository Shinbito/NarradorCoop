# Tecnología y civilizaciones

Archivos: `js/tecnologia.js` (edificios, obras, investigación, eras, IA, interfaz),
`js/civilizaciones.js` (identidad de cada pueblo), `css/tecnologia.css`, `BLD` en `js/nucleo.js`.
Prueba: `node pruebas/tecnologia.js [años=30] [civ=5]`.

## Estado `G.tec`

```js
G.tec = {
  v: 1, rev: 0, ini: true,                 // rev invalida la caché de bonificaciones
  f: [{ inv, pts, h: [ids], era, ult }],   // una ficha por reino (0..NF-1)
  obras: { [idProvincia]: [{ k, n, a, t, f, c }] }, // cola: edificio, nivel, años que faltan, total, dueño, pagado
}
```
Niveles en la propia provincia: `G.P[i][clave]` (número; `farm`, `market`, `walls`, `temple` siguen
igual para economía y combate). `partidaLista` completa partidas antiguas: crea `G.tec`, pone a 0 los
edificios que falten y aplica los regalos de partida de cada pueblo.

## Edificios y obras

`BLD[k] = [nombre, efecto, coste base, nivel máximo]`; años y requisitos en `TEC_EDI`.

| Edificio | Máx | Efecto por nivel | Requisito |
|---|---|---|---|
| Granja / Mercado / Templo | 3 | +5 comida / +5 oro / +12 orden (economía) | nivel III: Arado, Reforma del sólido, Jerarquía sacerdotal |
| Murallas | 3 (4) | +25% defensa (combate) | III: Poliorcética; IV solo capital bizantina |
| Cuartel | 3 | reino: −4% coste de tropa, +3% vida infantería; +4% vida a quien defiende esa provincia | — |
| Establo / Campo de tiro | 2 | reino: jinetes / arqueros −6% coste, +4% ataque | — |
| Herrería | 2 | reino: +4% ataque y vida | — |
| Escuela | 3 | +1 investigación (+2 en la capital) | III: Escuelas de retórica |
| Acueducto | 2 | +4 orden, +1 comida | Ingeniería |
| Puerto | 2 | +3 oro; solo provincias costeras (`MAP.grid`/`MAP.terr`) | — |

- Coste del nivel n: `base × (1 + 0,6·(n−1))` oro, pasado por `OC.calc('costeConstruccion')`. Si la economía
  declara `madera`, `piedra` o `hierro`, se piden 4·n; **si faltan se suplen con 3 de oro por unidad**.
- Tardan 1–3 años (Ingeniería resta uno). Cola de 2 por provincia (una en marcha). Cancelar devuelve la mitad.
- Los efectos «de reino» toman el mejor nivel que haya en el reino (no se suman entre provincias).
- Conquista o revuelta: se pierden las obras en curso; los edificios quedan para el nuevo dueño.

## Investigación

Puntos al año: `4 + 0,25·provincias + era + escuelas + técnicas + (gestión−5)·0,3` (−1 en regencia),
por `OC.calc('puntosInvestigacion')`. Los puntos se acumulan aunque no haya encargo.
Ramas: Milicia (9), Economía (7), Gobierno (6), Culto (5) y Propias (2 por pueblo; la segunda pide era II).
Costes 12 → 80. Árbol completo ≈ 950 puntos; además, cada técnica espera a su año (abajo).

## Eras

| Era | Técnicas | Provincias | Niveles de edificio | Año |
|---|---|---|---|---|
| I (inicio) | — | — | — | 410 |
| II | 4 | 5 | 10 | 425 |
| III | 9 | 8 | 22 | 455 |
| IV | 15 | 11 | 38 | 490 |

Cada era: +1 investigación, +1 orden por provincia, +4% oro, +3% de aceptación diplomática por era de
ventaja. Nombres propios por pueblo (p. ej. visigodos: Pueblo en marcha → Federados de Roma → Reino de
Tolosa → Reino consolidado). Al jugador se le anuncia con un modal.

## Puertas por año

Además de los prerrequisitos, todo tiene un año mínimo de partida (`G.year`, empieza en 410) para que el
contenido se despliegue a lo largo de partidas largas (online, 100–150 años). Helper global:
`tecDesde(anio)` → verdadero si `G.year >= anio` (o si `anio` es 0/indefinido). Campos: `TEC[id].anio`,
`TEC_EDI[k].anio = {nivel: año}`, `TEC_ERA[n].anio`. Lo bloqueado se ve en el panel («disponible en el año
455», «desde el año 450» en los edificios, «desde 455» en la era siguiente) y la IA lo respeta igual porque
usa `tecDisponible` y `tecMejora`. Las obras ya encargadas terminan siempre; los regalos de partida
(p. ej. murallas II de Constantinopla) no pasan por la puerta.

| Año | Técnicas | Niveles de edificio | Propio de cada pueblo |
|---|---|---|---|
| 410 | Disciplina, Remonta, Arco compuesto, Arado, Reforma del sólido, Censo, Escuelas de retórica, Liturgia | nivel I de granja, mercado, murallas, templo, cuartel, establo, campo de tiro, escuela | — |
| 415 | — | Puerto I | 1.ª técnica propia; Campamento de la horda |
| 420 | — | Granja II, Mercado II, Templo II, Herrería I | — |
| 425 | Lorigas, Molinos, Jerarquía sacerdotal | Murallas II | Iglesia arriana, Mallus, Templo del fuego |
| 430 | Poliorcética, Calzadas, Derecho | Cuartel II, Escuela II | Curia |
| 435 | Ingeniería | — | Tributo de los pueblos |
| 440 | Spatha larga | Acueducto I | Hipódromo, Astillero |
| 445 | Monasterios | Establo II, Campo de tiro II | — |
| 450 | — | Granja III, Mercado III, Puerto II | Tesoro de Constantinopla, Dihqanes |
| 455 | — | Templo III | Saqueo de Roma |
| 460 | Limitanei | Murallas III, Herrería II | Renovatio Imperii |
| 465 | Annona | Cuartel III | — |
| 470 | Collegia de artesanos | Escuela III | Código de Eurico |
| 475 | Cancillería | — | — |
| 480 | Concilios | Murallas IV (capital), Acueducto II | — |
| 490 | Comitatenses | — | — |
| 500 | — | — | Ley Sálica |
| 520 | Grandes santuarios | — | — |
| 530 | Corpus Iuris Civilis | — | — |
| 540 | Strategikon | — | — |
| 550 | Sericultura | — | — |

Tropas (`unidadesDisponibles`): `i`, `a`, `c` sin puerta. Las demás usan `UN[t].anio` si combate lo define;
si no, el año del nivel de edificio que piden (`tecAnioUnidad(t)`): cuartel II → 430, cuartel III (élite) → 465,
establo/campo de tiro I → 410, II (élite) → 445.

## Civilizaciones (`civilizaciones.js`)

Cada pueblo: nombres de era, prioridades de la IA, técnica y edificios de partida, dos técnicas propias y un
edificio propio (uno por reino): Occidente (Legión palatina, Renovatio Imperii, Curia), Oriente (Murallas
teodosianas, Tesoro, Hipódromo), visigodos (Hospitalitas, Código de Eurico, Iglesia arriana), hunos (Arco
huno, Tributo de los pueblos, Campamento de la horda), vándalos (Flota, Saqueo de Roma, Astillero), francos
(Francisca, Ley Sálica, Mallus), sasánidas (Clibanarios, Dihqanes, Templo del fuego).
Campos añadidos en tiempo de carga a `CIV[f]`: `eras`, `tecPri`, `tecEdi`, `tecIni`.

## IA

En `economiaFaccion(f)` (oro recién cobrado, antes de que `ia.js` lo gaste en tropas): elige técnica según
`tecPri` y su situación (guerra → milicia, hambre → economía, desorden → culto/gobierno) y encarga 1–2 obras
puntuadas por necesidad (granja si falta comida, templo si hay desorden, murallas si hay vecinos hostiles...),
guardando `6 + provincias` de oro.

## Ganchos

- **Emite**: `tecnologiaInvestigada {f, id}`, `edificioConstruido {f, p, id, nivel}`, `eraNueva {f, era}`
  (todos en `economiaFaccion`, para todas las facciones).
- **Escucha**: `partidaLista`, `economiaFaccion`, `conquista`, `revuelta`.
- **Llama**: `costeConstruccion`, `puntosInvestigacion`.
- **Modifica**: `rendimiento`, `ordenObjetivo`, `statsUnidad` (multiplica `atk` y `hp` si existen),
  `bonoBatalla`, `costeUnidad` (mín. 60%), `mantenimientoTropa` (mín. 50%), `unidadesDisponibles`,
  `aceptacionDiplomatica`.
- `unidadesDisponibles`: `i`, `a`, `c` siempre. Cualquier otra clave de `UN` pide edificio según su perfil
  (con `rg` → campo de tiro; `mv ≥ 4` → establo; si no, cuartel II; élite —coste > 1,4× su clase base— un
  nivel más). Combate puede fijarlo con `UN[t].edif` y `UN[t].nivel`; las clases con `edif` se **añaden** a la
  lista en cuanto hay edificio (respetando `UN[t].civ`/`civs` si existe). Categoría: `UN[t].cat|base|clase`.
- Funciones útiles para otros: `tecDesde(anio)`, `tecTiene(f, id)`, `tecPuntos(f)`, `tecResumen(p)`,
  `tecLineaEdificios(p)`, `tecAnioUnidad(t)`, `tecEras(f)`, `G.tec.f[f].era`.

## Peticiones al orquestador

1. ~~Interfaz: usar `tecLineaEdificios(p)`~~ (hecho en la integración).
2. **Combate** (`ia.js`): el bloque `bld` construye granja/templo/mercado/murallas II al instante, sin
   `costeConstruccion` y **saltándose las puertas por año** (granja II antes de 420...). La IA ya construye vía
   tecnología; hay que quitar ese bloque.
3. **Combate**: llamar a `statsUnidad`, `bonoBatalla` y `unidadesDisponibles` (sección «Reclutar» y `ia.js`)
   para que herrería, cuarteles, establos y técnicas militares se noten en batalla; y marcar las clases nuevas
   con `UN[t].edif`/`nivel`/`cat`.
4. **Economía**: llamar a `mantenimientoTropa` en `inc()` para que Limitanei, Annona y Calzadas surtan efecto.
