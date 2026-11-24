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
| Establo / Campo de tiro | 2 | sus jinetes / arqueros −6% coste, +4% ataque (el establo no se ofrece sin caballos) | militar |
| Casa de guerreros | 2 | solo pueblos sin caballos (incas «Kallanka», mayas «Casa de los guerreros», aztecas «Casa de los guerreros águila»): infantería y tiradores −5% coste, +4% ataque; abre arqueros y sus únicas | militar |
| Herrería | 2 | sus tropas +4% ataque y vida | militar |
| Templo | 3 | +12 orden (economía) | saber |
| Escuela | 3 | +1,5 investigación | saber |
| Acueducto | 2 | +4 orden, +1 comida | neutro |
| Torre de vigilancia (`p.torre`) | 3 | visión sobre la comarca para la niebla de guerra (`tecVision(p)` = nivel 0-3; Campaña lo convierte en radio). **No ocupa hueco.** II desde 430; III desde 455 con Poliorcética | neutro |
| Mina (`p.mina`) | 3 | hierro u oro (y plata, estaño, cobre si economía los define) según el yacimiento | económica |
| Cantera (`p.cantera`) | 3 | piedra según el yacimiento | económica |
| Aserradero (`p.aserradero`) | 3 | madera según el bosque | económica |
| Salinas (`p.salinas`) | 2 | sal según el yacimiento | económica |

- **Huecos**: `2 + 1 por cada 5.000 almas (+2 la capital)`, entre 3 y 9. Un edificio nuevo ocupa un
  hueco; subir de nivel no. Obliga a elegir: una ciudad pequeña no puede tenerlo todo.
- Coste del nivel n: `base × (1 + 0,6·(n−1)) × 0,62` oro (`TEC_ORO`: el oro bajó un 38% porque el
  progreso era muy lento) + 4·n del material (madera, piedra, hierro, **sin cambios**) si existe;
  el material que falte se suple con 3 de oro por unidad. Pasa por `costeConstruccion`.
- Tardan 1–3 años (Ingeniería resta uno). Cola de 3 por ciudad (obras y adopciones; una avanza).
  Cancelar devuelve la mitad. Conquista o revuelta: se pierde la cola, no los edificios.

### Yacimientos — minas, canteras, aserraderos y salinas
- `tecYac(p)` → `{hierro, oro, piedra, madera, sal, ...}` con riqueza 0-3. Usa `ecoYac(p)` de economía si existe
  (acepta `bosque` como sinónimo de `madera`); si no, lo estima: especialidad de la provincia (minas de hierro
  → hierro 3, canteras → piedra 3, bosques madereros → madera 3, salinas → sal 3, minas de oro → oro 2) y
  terreno (colinas → hierro y piedra; bosque → madera; costa → sal 1). `ecoFertil(p)` se muestra si existe.
- Cada explotación **solo se ofrece donde hay yacimiento** y su nivel máximo es la riqueza (`tecRiqueza(p, k)`).
- Producción (vía `rendimiento`): por nivel, `+riqueza` del recurso y `×(1 + 0,25·nivel)` lo que ya daba la
  tierra; el oro de las minas va al tesoro (`2 × nivel × riqueza`; plata 1,5). Coste base 45 / 35 / 30 / 35
  oro (× 0,62) + madera (hierro el aserradero); niveles II desde 425 (salinas 440) y III desde 450.
- **Las explotaciones que existan al empezar las pone economía**: basta con fijar `p.mina`, `p.cantera`,
  `p.aserradero` o `p.salinas` (números, claves de `BLD`) antes o después de `partidaLista`; tecnología no
  los pisa (solo pone 0 donde falta el campo). Un nivel por encima de la riqueza se respeta pero no sube más.
- La sección de la ciudad muestra «⛏ hierro ●●○ · piedra ●○○ …» y qué da cada explotación y su siguiente nivel.
- La IA las levanta donde la riqueza es alta, sobre todo si le falta ese recurso (`tecIAYac`).

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
- Primero `civPuede(f, t)` (Mundo: `CIV[f].sinTipos`, sin caballos en América). Las máquinas (`asedio`) nunca.
- Infantería (`i`): en cualquier ciudad. Arqueros (`a`): con Cuartel, Campo de tiro o Casa de guerreros.
  Jinetes (`c`): con Establo. Excepción: `CIV[f].tecLibres` (hunos y mongoles: `a`, `c`, `x`, `m` en
  cualquier ciudad).
- Resto de clases: edificio y nivel = `TEC_UNIDADES[t]` (civilizaciones.js) > `UN[t].edif/nivel` > el de su
  categoría. Técnica que debe regir en la ciudad (adoptada si es «de ciudad»): `UN[t].tec` (si combate la
  define) > `TEC_UNIDADES[t].tec` (puede ser `{idPueblo: técnica}`) > regla general (élite, coste > 1,4× su
  clase base: la doctrina Disciplina, Arco compuesto o Remonta). Año: `UN[t].anio` o el del nivel de edificio.
- Sin `p`: lo que alguna ciudad del reino puede reclutar. Las clases con `UN[t].edif` se añaden a la lista.
- `tecPuedeReclutar(f, p, t)` → `{ok, motivo}`; `tecReclutables(f, p)` (repertorio `cmbRoster` sin vetos ni
  máquinas); `tecReclutaAqui(f, p)` = lo que de verdad se recluta (`cmbDisp(f, p).ok`, o
  `OC.calc('unidadesDisponibles')` + `civPuede`): es lo que muestra la línea «Recluta:» de la ciudad.

#### Únicas y bestias de los 19 pueblos (`TEC_UNIDADES`)
| Pueblo | Unidad | Edificio | Técnica que debe regir en la ciudad |
|---|---|---|---|
| occ | `com` Comitatenses | Cuartel II | Legión palatina (adoptada) |
| ori | `sif` Sifonarios | Cuartel II | Poliorcética (reino) |
| vis | `esg` Escuderos godos | Cuartel I | — |
| hun | `hpa` Jinetes de Atila | Establo I (o libre) | Arco huno (adoptada) |
| van | `cor` Corsarios | Cuartel I | — |
| fra | `fca` Lanzadores de francisca | Cuartel I | Francisca (adoptada) |
| per | `inm` Inmortales | Cuartel II | Lorigas y escamas (adoptada) |
| per / ind | `ele` Elefantes | Establo II (desde 445) | Clibanarios (persas) / Gajashastra (indios), adoptada |
| ara / egi | `cam` Camellos | Establo I | — |
| egi | `car` Carros | Establo I | — |
| nor | `ber` Berserkers | Cuartel I | Piedras rúnicas (adoptada) |
| chi | `bal` Ballesteros | Campo de tiro I | Ballesta de repetición (adoptada) |
| inc | `mac` Guerreros de maza | Cuartel I | — |
| may | `atl` Lanzadores de átlatl | Casa de los guerreros I | — |
| azt | `jag` Guerreros jaguar | Casa de los guerreros águila I | Guerras floridas (adoptada) |
| azt | `agu` Guerreros águila | Casa de los guerreros águila I | — |
| gri | `hop` Hoplitas | Cuartel I | Disciplina de campaña (adoptada) |
| cel | `fia` Fianna | Cuartel I | — |
| esl | `bos` Lanceros del bosque | Cuartel I | — |
| mon | `kes` Keshig | Establo I (o libre) | Remonta de caballos (adoptada) |

Las bestias y únicas baratas no piden técnica; las caras, una concreta de su pueblo en lugar de la
doctrina genérica. Los pueblos sin caballos no ven el establo, la Remonta ni ninguna técnica `caballo: true`.

### Calidad de las tropas — `statsUnidad`, `costeUnidad`
Con `ctx.p` (ciudad propia de origen, o la que defienden): técnicas del reino + edificios de **esa**
ciudad + técnicas adoptadas allí + sinergia de plaza fuerte. Sin `p` (o si `p` no es del reino): la
**media de las ciudades del reino** (prudente: ni la mejor forja ni la peor). Mínimo de coste: 60%.

## Descubrimientos del reino

Puntos al año = suma de las ciudades, por `OC.calc('puntosInvestigacion')`:
`0,6 + 0,075·miles de almas + escuela (1,5/nivel) + técnicas adoptadas (letras, monasterios, santuarios)
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

**Adoptar** = obra en la cola de la ciudad: `(15 + coste en puntos) × 0,62` de oro + 4 hierro (milicia), 3 madera
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

`TEC_CIV` va **por id** (`CIV[f].id`) y cubre los 19 pueblos; al cargar fija en `CIV[f]` `eras`, `tecPri`,
`tecEdi`, `tecIni`, `tecLibres` y `tecGuerreros`, de modo que el relleno provisional de Mundo
(`mundoRelleno`) ya no copia nada del pariente. Las capitales empiezan con Cuartel I y Establo I (o Casa de
guerreros I si no hay caballos), más lo propio de cada pueblo.

| id | Eras (I → IV) | Técnicas propias (1.ª desde 415 · 2.ª era II) | Edificio propio |
|---|---|---|---|
| occ | Imperio en crisis → Imperio renacido | Legión palatina · Renovatio Imperii | Curia |
| ori | Corte de Constantinopla → Imperio universal | Murallas teodosianas · Tesoro de Constantinopla | Hipódromo |
| vis | Pueblo en marcha → Reino consolidado | Hospitalitas · Código de Eurico | Iglesia arriana |
| hun | Horda de la estepa → Azote de Dios | Arco huno · Tributo de los pueblos | Campamento de la horda |
| van | Pueblo errante → Señores del mar | Flota vándala · Saqueo de Roma | Astillero |
| fra | Tribus del Rin → Reino consolidado | Francisca · Ley Sálica | Mallus |
| per | Corte de Ctesifonte → Rey de reyes | Clibanarios · Dihqanes | Templo del fuego |
| ara | Tribus del desierto → Señores de Arabia | Ruta del incienso (mercado: +4 oro, +10%) · Mu'allaqat (+4 orden, +6% aceptación) | Caravasar (+6 oro, +1 saber) |
| nor | Clanes del fiordo → Señores de los mares | Piedras rúnicas (orden, saber; berserkers) · Drakkar (+15 oro por conquista, +10% al atacar) | Salón del jarl (tropas +6% ataque) |
| chi | Reinos divididos → Edad dorada | Ballesta de repetición (+10% arqueros) · Examen imperial (+3 orden, +3 saber) | Talleres de seda (+7 oro) |
| inc | Curacazgo del Cuzco → Hijos del Sol | Andenes (+3 comida, +10%) · Quipus (oro, orden, saber) | Qollqas (+5 comida, +5 orden) |
| may | Aldeas del Petén → Edad de las estelas | Cuenta larga (reino: orden, saber) · Códices y estelas (escuela) | Observatorio (+3 saber) |
| azt | Peregrinos de Aztlán → Imperio mexica | Guerras floridas (+8% infantería; jaguares) · Chinampas (+5 comida) | Templo Mayor (+10 orden) |
| gri | Ciudades libres → Nueva Hélade | Academia (escuela: +2 saber) · Fuego griego (+12% al defender) | Gimnasio (tropas +6% vida) |
| egi | Nomos del Nilo → Herederos de los faraones | Canales del Nilo (+15% comida) · Papiro y escribas | Nilómetro (+4 comida, +4 oro) |
| ind | Janapadas → Edad dorada del Ganges | Gajashastra (elefantes) · Acero wootz (+8% ataque) | Estupa (+8 orden, +2 saber) |
| cel | Tribus de los bosques → Edad de los bardos | Saber druídico (templo) · Ogam | Oppidum (+12% al defender) |
| esl | Tribus de los pantanos → Gran Rus | Roza del bosque (+3 comida) · Veche (+5 orden, +10% al defender) | Gord (+12% al defender) |
| mon | Clanes de la estepa → Señores del mundo | Yam (postas: +1 oro por ciudad) · Kurultái (+10% al atacar) | Ordu del kan (jinetes −10% coste, +6%) |

Edificios propios: un nivel, uno por reino, desde 415-440. `def` (oppidum, gord) suma al defender la ciudad.

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
- Funciones para otros: `tecVision(p)`, `tecYac(p)`, `tecRiqueza(p, k)`, `tecPerfil(p)`, `tecHuecos(p)`, `tecPuedeReclutar(f, p, t)`, `tecReclutables(f, p)`,
  `tecAdoptada(p, id)`, `tecPuntosCiudad(p)`, `tecDesde(anio)`, `tecTiene(f, id)`, `tecPuntos(f)`,
  `tecResumen(p)`, `tecLineaEdificios(p)` (ahora empieza por el perfil), `tecAnioUnidad(t)`, `tecEras(f)`.

## Equilibrio (simulación de 40 años, `pruebas/tecnologia.js` y un jugador «medio» automático)

| | Antes | Ahora |
|---|---|---|
| Obras terminadas por el jugador (francos / Occidente) | 18 / 12 | 30 / 23 |
| Obras terminadas por cada IA (media) | 33,5 / 27,8 | 47,7 / 41,8 |
| Niveles de edificio por ciudad de la IA | 8,0 / 6,5 | 8,3 / 8,2 (los frenan huecos y riqueza) |
| Investigación del jugador al empezar | 5,3 | 7,5 por año |

Con el empujón, todos llegan a lo que permiten las puertas por año (20 técnicas en 450): la investigación
ya no frena; lo que marca el ritmo a partir de entonces es el calendario.

## Peticiones al orquestador

- **Contrato**: anotar los campos de provincia `p.mina`, `p.cantera`, `p.aserradero`, `p.salinas` (economía
  pone las explotaciones iniciales) y `p.torre` (Campaña lee `tecVision(p)`), y las funciones `ecoYac(p)` /
  `ecoFertil(p)` que tecnología consume si existen.

- **Campaña**: no hay cálculo para las máquinas de asedio. Propongo que `ejercitos.js` pase el coste y las
  estaciones de `CAM_MAQ` por `OC.calc('costeMaquina', {madera, hierro, oro}, {f, maq, p})` y
  `OC.calc('estacionesMaquina', n, {f, maq})`; tecnología abarataría/aceleraría con Poliorcética (−20% coste,
  −1 estación la torre y la catapulta) e Ingeniería. Igual para el alcance: hoy `ejercitos.js` mira
  `tecTiene(f, "vias")`; un `OC.calc('alcanceEjercito', v, {f, ej})` permitiría que Yam (mongoles) y
  Calzadas sumen sin tocar campaña.
- **Mundo**: `mundoRelleno` ya no hace falta (tecnología define los 19); se puede borrar.
- **Combate**: si quiere fijar otra técnica para una única, basta con `UN[t].tec` (manda sobre la tabla).

(Las peticiones anteriores —evento `tecnologiaAdoptada`, `p` en costeUnidad/statsUnidad, quitar `bld` de
`ia.js`, redondear el orden— ya están atendidas.)
