# Tecnología, ciudades y civilizaciones

Archivos: `js/tecnologia.js` (edificios, obras, descubrimientos, adopción local, perfiles, eras, IA,
interfaz), `js/civilizaciones.js` (identidad de cada pueblo), `css/tecnologia.css`, `BLD` en `js/nucleo.js`.
Prueba: `node pruebas/tecnologia.js [años=30] [civ=5]`.

Idea: **cada ciudad se microgestiona**. El reino descubre técnicas con el saber de sus ciudades, pero
la mayoría solo rinden donde se implantan; lo que cada ciudad construye y adopta decide qué es (plaza
fuerte, granero, ciudad mercantil, de saber...), qué tropas recluta y cómo salen armadas. No hay botón de
«tipo de ciudad»: es la suma de decisiones. El oro (y los materiales) son nacionales (`F.gold`, `OC.pagar`).

## Estado `G.tec`

```js
G.tec = {
  v: 2, rev: 0, ini: true,                 // rev invalida la caché de bonificaciones
  f: [{ inv, pts, h: [ids], era, ult }],   // descubrimientos de cada reino (0..NF-1)
  obras: { [idProv]: [{ k, n, a, t, f, c } | { ad, a, t, f, c }] }, // cola: edificio o adopción
  ad: { [idProv]: [ids] },                 // técnicas implantadas en cada ciudad
}
```
Niveles de edificio en `G.P[i][clave]` (número; `farm`, `market`, `walls`, `temple` siguen igual para
economía y combate). Las adopciones son de la **ciudad**: si cambia de dueño, el conquistador las conserva.

**Partidas antiguas.** Sin `G.tec`: se crea, se ponen a 0 los edificios que falten y se aplican los regalos
de partida. Versión 1 (técnicas nacionales, sin `ad`): todo lo ya investigado de ámbito «ciudad» se da
por **adoptado en todas las ciudades que cada reino poseía**, y cada capital recibe Cuartel I y Establo I
para no perder la capacidad de reclutar arqueros y jinetes. Se elige así para que nadie pierda de golpe lo
que ya tenía.

## La ciudad

### Edificios y huecos
`BLD[k] = [nombre, efecto, coste base, nivel máximo]`; detalles en `TEC_EDI` (`t` años, `anio`, `req`,
`mat`, `cat` = vocación militar/económica/saber).

| Edificio | Máx | Efecto por nivel (en esa ciudad) | Vocación |
|---|---|---|---|
| Granja / Mercado | 3 | +5 comida / +5 oro (economía) | económica |
| Puerto | 2 | +3 oro; solo costa | económica |
| Murallas | 3 (4) | +25% defensa (combate) | militar |
| Cuartel | 3 | sus tropas −4% coste, infantería +3% vida; +4% vida al defenderla | militar |
| Establo / Campo de tiro | 2 | sus jinetes / arqueros −6% coste, +4% ataque | militar |
| Herrería | 2 | sus tropas +4% ataque y vida | militar |
| Templo | 3 | +12 orden (economía) | saber |
| Escuela | 3 | +1,5 investigación | saber |
| Acueducto | 2 | +4 orden, +1 comida | neutro |

- **Huecos**: `2 + 1 por cada 5.000 almas (+2 la capital)`, entre 3 y 9. Un edificio nuevo ocupa un
  hueco; subir de nivel no. Obliga a elegir: una ciudad pequeña no puede tenerlo todo.
- Coste del nivel n: `base × (1 + 0,6·(n−1))` oro + 4·n del material (madera, piedra, hierro) si existe;
  el material que falte se suple con 3 de oro por unidad. Pasa por `costeConstruccion`.
- Tardan 1–3 años (Ingeniería resta uno). Cola de 3 por ciudad (obras y adopciones; una avanza).
  Cancelar devuelve la mitad. Conquista o revuelta: se pierde la cola, no los edificios.

### Perfil emergente — `tecPerfil(p)`
`{id, nombre, icono, sin, militar, economico, saber}`. Cada vocación suma los niveles de sus edificios
y las técnicas adoptadas de su rama (milicia → militar; economía → económica; gobierno y culto → saber).
Especializada si la mayor llega a **4** y es al menos el **55%** del total; si no, «Ciudad mixta»
(o «Aldea» con menos de 3).

| Perfil | Cuándo | Sinergia |
|---|---|---|
| ⚔ Plaza fuerte | militar | tropas de aquí −10% coste y +5% vida; +5% al defenderla |
| ❦ Granero | económica con más granja que mercado+puerto | +10% comida |
| ◉ Ciudad mercantil | económica, resto | +10% oro |
| ✎ Ciudad de saber | saber | +25% investigación de la ciudad |

### Tropas por ciudad — `unidadesDisponibles` con `{f, p}`
- Infantería (`i`): en cualquier ciudad. Arqueros (`a`): con Cuartel o Campo de tiro. Jinetes (`c`): con
  Establo. Excepción: `CIV[f].tecLibres` (hunos: arqueros y jinetes en cualquier ciudad).
- Clases nuevas de combate: el edificio y nivel de su perfil (`rg` → Campo de tiro; `mv ≥ 4` → Establo;
  si no, Cuartel II), o los que fije `UN[t].edif` / `UN[t].nivel`. Élite (coste > 1,4× su clase base): un
  nivel más **y** la doctrina adoptada en la ciudad (Disciplina, Arco compuesto o Remonta), o la técnica que
  fije `UN[t].tec`. Año: `UN[t].anio` o el del nivel de edificio (`tecAnioUnidad`). Respeta `UN[t].civ/civs`.
- Sin `p`: lo que alguna ciudad del reino puede reclutar. Las clases con `UN[t].edif` se añaden a la lista.
- `tecPuedeReclutar(f, p, t)` → `{ok, motivo}` y `tecReclutables(f, p)` para la interfaz.

### Calidad de las tropas — `statsUnidad`, `costeUnidad`
Con `ctx.p` (ciudad propia de origen, o la que defienden): técnicas del reino + edificios de **esa**
ciudad + técnicas adoptadas allí + sinergia de plaza fuerte. Sin `p` (o si `p` no es del reino): la
**media de las ciudades del reino** (prudente: ni la mejor forja ni la peor). Mínimo de coste: 60%.

## Descubrimientos del reino

Puntos al año = suma de las ciudades, por `OC.calc('puntosInvestigacion')`:
`0,4 + 0,07·miles de almas + escuela (1,5/nivel) + técnicas adoptadas (letras, monasterios, santuarios)
+ edificios propios`; la capital suma `1,5 + era + (gestión del soberano − 5)·0,3` (−1 en regencia);
×1,25 en una ciudad de saber. La pestaña Progreso muestra qué aporta cada ciudad.
Los avanzados piden **una ciudad con Escuela II** (`saber: 2`) o **III** (`saber: 3`).

Ramas: Milicia (9), Economía (8), Gobierno (7), Culto (5), Propias (2 por pueblo; la segunda pide era II).
Costes 12 → 80; además cada técnica espera a su año.

### Ámbito: «ciudad» (adopción local) o «reino»
| Ámbito | Técnicas |
|---|---|
| ciudad (en: edificio que pide) | Disciplina (cuartel), Remonta (establo), Arco compuesto (campo de tiro o cuartel), Lorigas y Hierro templado (herrería), Comitatenses (cuartel II), Arado, Rotación de cultivos (granja), Molinos (granja II), Collegia y Sericultura (mercado II), Escuelas de retórica (escuela), Termas y sanidad (acueducto), Liturgia (templo), Monasterios y Grandes santuarios (templo II); propias: Legión palatina, Francisca (cuartel), Arco huno (establo o campo de tiro), Clibanarios (establo), Flota (puerto) |
| reino | Poliorcética, Limitanei, Strategikon, Reforma del sólido, Calzadas, Annona, Censo, Ingeniería, Derecho, Cancillería, Corpus Iuris, Jerarquía sacerdotal, Concilios y las propias de leyes y política |

**Adoptar** = obra en la cola de la ciudad: `15 + coste en puntos` de oro + 4 hierro (milicia), 3 madera
(economía) o 3 piedra (resto); 1 año (2 si cuesta más de 20 puntos; Ingeniería lo deja en 1).
Los niveles III de granja/mercado/templo/escuela piden su técnica **adoptada en esa ciudad** si es de
ámbito ciudad (Arado, Escuelas de retórica) o conocida si es del reino (Reforma del sólido, Jerarquía).

## Eras

| Era | Técnicas | Provincias | Niveles de edificio | Año |
|---|---|---|---|---|
| I (inicio) | — | — | — | 410 |
| II | 4 | 5 | 10 | 425 |
| III | 9 | 8 | 22 | 455 |
| IV | 15 | 11 | 38 | 490 |

Cada era: +1 investigación en la capital, +1 orden en las ciudades, +4% oro, +3% de aceptación diplomática
por era de ventaja. Nombres propios por pueblo. Al jugador se le anuncia con un modal.

## Puertas por año

`tecDesde(anio)` → verdadero si `G.year >= anio`. Campos `TEC[id].anio`, `TEC_EDI[k].anio = {nivel: año}`,
`TEC_ERA[n].anio`. Se ven en el panel («disponible en el año 455», «desde el año 450») y la IA las respeta.

| Año | Técnicas | Niveles de edificio | Propio de cada pueblo |
|---|---|---|---|
| 410 | Disciplina, Remonta, Arco compuesto, Arado, Reforma del sólido, Censo, Escuelas de retórica, Liturgia | nivel I de granja, mercado, murallas, templo, cuartel, establo, campo de tiro, escuela | — |
| 415 | — | Puerto I | 1.ª técnica propia; Campamento de la horda |
| 420 | Rotación de cultivos | Granja II, Mercado II, Templo II, Herrería I | — |
| 425 | Lorigas, Molinos, Jerarquía sacerdotal | Murallas II | Iglesia arriana, Mallus, Templo del fuego |
| 430 | Poliorcética, Calzadas, Derecho | Cuartel II, Escuela II | Curia |
| 435 | Ingeniería | — | Tributo de los pueblos |
| 440 | Hierro templado | Acueducto I | Hipódromo, Astillero |
| 445 | Monasterios, Termas y sanidad | Establo II, Campo de tiro II | — |
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

## Civilizaciones (`civilizaciones.js`)

Cada pueblo: nombres de era, prioridades de la IA, técnica y edificios de partida (toda capital empieza con
Cuartel I y Establo I), dos técnicas propias y un edificio propio (uno por reino): Occidente (Legión
palatina, Renovatio Imperii, Curia), Oriente (Murallas teodosianas, Tesoro, Hipódromo), visigodos
(Hospitalitas, Código de Eurico, Iglesia arriana), hunos (Arco huno, Tributo, Campamento de la horda;
jinetes y arqueros en cualquier ciudad), vándalos (Flota, Saqueo de Roma, Astillero), francos (Francisca,
Ley Sálica, Mallus), sasánidas (Clibanarios, Dihqanes, Templo del fuego).
Campos añadidos a `CIV[f]` al cargar: `eras`, `tecPri`, `tecEdi`, `tecIni`, `tecLibres`.

## IA

En `economiaFaccion(f)` (oro recién cobrado, antes de que `ia.js` lo gaste en tropas):
1. Elige descubrimiento según `tecPri` y su situación (guerra → milicia, hambre → economía, desorden →
   culto/gobierno).
2. Construye 1–2 obras. Cada ciudad tiene una **vocación**: la de su perfil si ya está especializada; si no,
   militar si tiene vecinos hostiles, saber en la capital, económica en el resto. Los edificios de su
   vocación pesan ×2 y los de otra ×0,5; gastar un hueco pesa algo más que subir de nivel.
3. Adopta 1–2 técnicas donde más rinden: milicia en plazas fuertes y fronteras, economía en graneros y
   ciudades mercantiles, gobierno y culto en ciudades de saber o con desorden; la capital, algo antes.
Guarda `6 + provincias` de oro.

## Ganchos

- **Emite**: `tecnologiaInvestigada {f, id}`, `edificioConstruido {f, p, id, nivel}`, `eraNueva {f, era}`
  y el nuevo `tecnologiaAdoptada {f, p, id}` (todos en `economiaFaccion`, para todas las facciones).
- **Escucha**: `partidaLista`, `economiaFaccion`, `conquista`, `revuelta`.
- **Llama**: `costeConstruccion` (edificios y adopciones, `id: "tec:<técnica>"`), `puntosInvestigacion`.
- **Modifica**: `rendimiento` y `ordenObjetivo` (por ciudad), `statsUnidad` (multiplica `atk` y `hp`),
  `bonoBatalla`, `costeUnidad`, `mantenimientoTropa` (mín. 50%), `unidadesDisponibles`, `aceptacionDiplomatica`.
- Funciones para otros: `tecPerfil(p)`, `tecHuecos(p)`, `tecPuedeReclutar(f, p, t)`, `tecReclutables(f, p)`,
  `tecAdoptada(p, id)`, `tecPuntosCiudad(p)`, `tecDesde(anio)`, `tecTiene(f, id)`, `tecPuntos(f)`,
  `tecResumen(p)`, `tecLineaEdificios(p)` (ahora empieza por el perfil), `tecAnioUnidad(t)`, `tecEras(f)`.

## Peticiones al orquestador

1. **Contrato**: añadir el evento `tecnologiaAdoptada {f, p, id}` (lo emite tecnología al implantar).
2. **Combate**: pasar `p` en `costeUnidad` y en `statsUnidad` (ciudad de origen del ejército: la provincia
   de la que marcha el atacante; la provincia defendida para el defensor), y usar `unidadesDisponibles` con
   `{f, p}` tanto en «Reclutar» como en `ia.js`. Sin eso, la calidad por ciudad se aplica como media del reino.
3. **Combate** (`ia.js`): quitar el bloque `bld` (construye al instante, sin huecos ni puertas por año).
4. **Interfaz**: el orden de la provincia se muestra con decimales («orden 93.8608»); viene de otro
   modificador, no de tecnología (que solo suma enteros). Redondear al mostrar.
