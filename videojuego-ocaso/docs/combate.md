# Combate y clases de guerreros

Archivos: `js/clases.js` (catálogo, pueblos, veteranía, origen, mandos, reclutar, pestaña Ejército,
informe), `js/habilidades.js` (habilidades), `js/batalla.js` (motor automático por rondas **y** batalla
táctica t3/t1/rt), `css/combate.css`. En `nucleo.js`: `TYP`, `UN`, `MULT`, `tot`, `pw` y los sprites `SP`.
Desde la fase 2, `campana.js` (marchas, `settle`) e `ia.js` son de Campaña. Prueba: `node pruebas/combate.js [batallas=400] [civ=0]` (añade `stats` como 3.er argumento
para solo las estadísticas).

## Clases (`TYP = l i p h a x c k m`)

| Clave | Clase | Papel | Desbloqueo (tecnología `UN[t].edif/nivel`) |
|---|---|---|---|
| `l` | Lanceros | muro de escudos; ×1,5 contra jinetes y anulan el 80% de la carga de frente | Cuartel I |
| `i` | Infantería | línea versátil | en toda ciudad |
| `p` | Infantería pesada | armadura 7, disciplina 8; se cansa ×1,3 | Cuartel II + Disciplina + fama |
| `h` | Escaramuzadores | alcance 5, 5 descargas, ignoran medio escudo; rehúyen la melé | Cuartel I |
| `a` | Arqueros | alcance 8, 8 descargas | Cuartel o Campo de tiro |
| `x` | Caballería ligera | flanqueo y persecución (la mejor cazando fugitivos) | Establo I |
| `c` | Caballería | carga 6, arrolla tiradores | Establo (hunos: libre) |
| `k` | Caballería pesada | carga 9, armadura 8; se agota ×1,4 | Establo II + Remonta + fama |
| `m` | Arqueros a caballo | tiran y se retiran; débiles cuerpo a cuerpo | Establo I |

Estadísticas por soldado en `UN[t]`: `me` ataque, `ca` carga, `de` defensa, `ar` armadura, `es` escudo
contra proyectiles, `vi` vida, `mo` moral, `di` disciplina, `fa` fatiga, `ve` velocidad, `al` alcance,
`mu` munición, `pr` daño a distancia, `pw` fuerza de campaña; `cat` (i/a/c) para tecnología y economía.
Cada pueblo tiene repertorio y nombres propios (`CMB_CIV`: p. ej. Palatinos, Clibanarios, Gardingos,
Arqueros montados, Antrustiones, Dailamitas) y bonos (`CIV[f].bon[t]`, completado al cargar). Sin ciertas
clases: los francos no tienen caballería ligera ni pesada; los hunos no tienen infantería pesada.
**Fama militar** (`G.cmb.fama[f]`): +1 por victoria, +0,25 por derrota; abre las élites (fama 2-4).
**Por ciudad**: cada ciudad recluta según sus edificios y doctrinas adoptadas (tecnología decide con
`unidadesDisponibles {f, p}`: infantería en todas, arqueros con cuartel o campo de tiro, jinetes con establo;
élites con la doctrina adoptada allí). El botón bloqueado muestra el motivo (`tecPuedeReclutar`) y la fama
que falte. El coste se calcula en esa ciudad (`cmbCoste(f, t, p)` → `costeUnidad {f, t, p}`); el oro es del reino.

## Fase 2

### Tipos nuevos (`UN`; `TYP` crece con `push`, las claves viejas siguen)
| Clave | Clase | Notas |
|---|---|---|
| `ari` | Ariete | `asedio`; `sitio.brecha` 0,4 por máquina y ronda; bate la puerta desde la 2.ª ronda |
| `tor` | Torre de asedio | `sitio.torre`: anula 25% del bono de murallas por torre (máx. 75%); sus arqueros solo tiran en asalto |
| `cat` | Catapulta | `sitio.brecha` 0,18 por ronda mientras tenga munición; en campo abierto tira al 40% |
| `ele` | Elefantes (`ind`, `per`) | carga 10, vida 30; `estampida`, `espanto`; con moral < 30% pueden **desbocarse** y pisotear a los suyos. Establo II |
| `cam` | Camellos (`ara`, `egi`) | `espanto`; `calor: true` (el calor no los cansa). Establo I |
| `car` | Carros (`egi`) | carga 9 y tiro corto; `carga` |
| únicas | `com` occ (testudo), `sif` ori (fuego griego), `esg` vis (muro de escudos), `hpa` hun (disparo parto), `cor` van (emboscada), `fca` fra (francisca arrojadiza + grito), `inm` per (juramento), `ber` nor (berserker), `jag`/`agu` azt, `bal` chi (ballesteros), `hop` gri (hoplitas), `mac` inc, `atl` may, `fia` cel, `bos` esl, `kes` mon | `rol` = clase base (doctrina y comportamiento); `civs` = ids |

- Las máquinas (`asedio: true`) **no se reclutan**: las construye Campaña durante el asedio y las mete en
  `ejA.u`. En el asalto (`ctx.fort > 0`) abren brecha (por debajo del 15% la muralla deja de proteger y los
  defensores pierden 10 de moral); en campo abierto casi no cuentan y mueren en la persecución.
- `MULT` se calcula por `rol` (12 roles: l i p h a x c k m ele cam asd). `UN[t].caballo` marca monturas que se
  espantan. `UN[t].civs` = ids + índices (tecnología filtra por índice); `UN[t].civIds` guarda los ids.
- Repertorio por pueblo con `CMB_CIV[id]` (`cmbCivId(f)` usa `CIV[f].id` o el de las 7 originales); incluye a
  los 12 pueblos de Mundo. Se respeta `CIV[f].sinTipos` (tipos o `"caballos"`) en reclutar y códex.

### Habilidades (`js/habilidades.js`, ids del contrato)
`grito`, `berserker` (14 s ×1,6 ataque y sin miedo; luego 18 s ×0,7 y +25 de cansancio), `muroEscudos`,
`testudo`, `carga`, `lluviaFlechas`, `emboscada`, `fuegoGriego` (ignora armadura y escudo), `estampida`,
`espanto` (pasiva: caballos enemigos a < 3 casillas −25% ataque y pierden moral), `disparoParto`, `juramento`
(moral ≥ 30%), `veneno` (más muertos), `sacrificio` (+10 de moral a todo el ejército, una vez), `tambores`.
- Táctica: botón por unidad con enfriamiento (vale en t3, t1 y rt); la IA y los capitanes delegados las usan
  con criterio (`cuando`). Punto dorado sobre la unidad = activa; gris = bajón.
- Automática: 1 ronda = 10 s; cada bando las usa por criterio; salen en el informe («los berserkers muerden
  el hongo y enloquecen…», «…ahora flaquean, exhaustos») y entre los factores decisivos.
- API: `cmbHabIni`, `cmbHabPuede`, `cmbHabUsar`, `cmbHabTick`, `cmbHabMod`, `cmbHabIA` (adaptador por motor).

### General y capitanes
- Táctica: el general lleva su **guardia** (10 hombres de la mejor caballería, o infantería) separada del
  grueso, con grito de guerra; la IA la mantiene tras la línea. Si la guardia rompe o sufre bajas, el
  general puede caer (−12/−18 de moral a todos). Automática: factor de mando y riesgo por ronda.
- Experiencia en `G.C[id]`: `xp`, `nivel` (1-10 con 0, 20, 50, 90, 140, 200, 270, 350, 440, 540 xp) y `fama`.
  Victoria +22 xp y +3 fama (× tamaño de la batalla), derrota +8 y −2, retirada −3. Cada nivel: +1,5% de
  daño y +1,5 de moral; cada nivel impar, +1 de mando (máx. 10).
  **`cmbNivel(c | id)` → `{nivel, xp, fama, sig, titulo, rol}`** (de «Oficial» a «Magister militum») para que
  Social nombre gobernadores.
- **Capitanes**: tropas sin general que ganan suman probabilidad (+0,22 por victoria, +0,08 si es grande) en
  `G.cmb.cap["f:pid"]`; al salir, `mkChar` crea un personaje con `linaje:false`, `rol:'capitan'` y epíteto
  («el Cuervo»), nivel 2, que queda al mando (`p.gen`); la crónica lo anuncia. Se asciende a general
  (`cmbasc-<id>`) y se renombra (`renombrar-<id>`, si Social no la registra: modal, 2-30 letras, sin `<>&"'`).
  Pestaña Ejército → **Mandos**.

## Modelo de batalla: los factores se suman

Nadie muere de golpe. Cada ronda (o cada segundo en la táctica):
- **Proyectiles**: munición limitada; el escudo para el disparo frontal, la armadura lo reduce, la lluvia
  moja los arcos (×0,65), la niebla acorta el alcance, el bosque cubre, la colina da tiro.
- **Choque y melé**: la carga multiplica el primer golpe (1 + 0,11·carga) y sacude la moral; luego la
  caballería se **atasca** (×0,85 en melé prolongada) y solo vuelve a cargar cada 3 rondas. Contra lanceros
  de frente la carga se estrella. Frente limitado: los que no caben en la línea esperan en reserva.
- **Flanqueo**: caballería libre (si su infantería fija al enemigo) o superioridad numérica rodean:
  +50% de daño, sin escudo, −10 de moral por ronda. En la táctica se calcula por geometría (frente,
  flanco ×1,4, retaguardia ×1,8).
- **Caídos**: 30-35% muertos y el resto heridos mientras se combate; 75% muertos al huir.
- **Moral**: baja por bajas (×(1 − 0,05·disciplina)), tensión de la melé, cansancio > 60, flanqueo,
  fugas vecinas (contagio), general herido o muerto (−12/−18), hambre (−10), asedio; sube con el mando
  del general. A 0 la unidad **rompe filas**; puede **reagruparse** si su disciplina lo permite.
- **Cansancio**: marcha, melé y calor; resta ataque, defensa y velocidad.
- **Terreno y murallas**: colinas y vados favorecen al defensor; el bosque frena a los jinetes; las
  murallas reducen el daño (÷(1 + 0,18·nivel) cuerpo a cuerpo) y suben la moral.
- **Veteranía** por clase y provincia (`G.cmb.vet`): hasta +20% ataque/defensa, +20 moral; niveles
  Bisoños, Curtidos (15), Veteranos (40), Élite (75). +18 xp por victoria, +10 por derrota; +2 al año de
  guarnición hasta 20; botón «Instruir tropas» (2 oro por leva, una vez al año): +8 hasta 40 (la élite solo
  se gana en batalla). La IA instruye con el oro ocioso (p. ej. cuando la comida no da para más levas).
- **Fin**: un bando se desmorona cuando le quedan < 30% de hombres en pie o pierde su línea → la
  **persecución** (sobre todo la caballería ligera) causa la matanza. Si cae la noche (14/11/8 rondas según
  la hora de inicio) el atacante se retira sin persecución.
- **Heridos que vuelven**: ganador 60%, perdedor 25% (45% si se retira de noche, 35% en retirada ordenada).

Cifras de `node pruebas/combate.js 600`: 7-8 rondas de media (2-14), el perdedor pierde ~50% (la mitad en
la persecución) y el ganador ~10%; con ventaja > 50% gana el más fuerte el 96-98%, con ventaja moderada
(20-50%) el 70-75%. Táctica: ~40-90 s de combate simulado.

## API reutilizable (para ejércitos en el mapa, asedios, batallas de encuentro)

El motor vive en `batalla.js`. Sus funciones públicas son declaraciones de función: si `campana.js` aún tiene
su copia antigua (`cmbResolverAuto`, `cmbLado`, `cmbEntorno`, `cmbTerreno`, `cmbFactores`, `autoBattle`,
`cmbEstimar`...), la de `batalla.js` (que carga después) la sustituye. **Campaña puede borrar esa sección de
`campana.js`** (de «entorno: terreno de la provincia» a `cmbEstimar`), salvo `march`, `settle` y lo suyo.

```js
cmbResolverAuto(ejA, ejD, ctx)        // síncrona → {gana: 0|1, A, D, heridos:{A,D}, informe, gen:[resA,resD]}
cmbTactica(ejA, ejD, ctx, modo)       // Promise del mismo resultado; modo 't3' | 't1' | 'rt'
cmbEstimar(ejA, ejD, ctx, n)          // probabilidad de que gane ejA (n simulaciones)
// ej  = {f, u:{tipo:n}, gen: idPersonaje|null, vet:{tipo:xp}, ori:{tipo:idProvincia}, fat: 0-100, hambre?}
// ctx = {terreno: {tag,bosque,colina,rio} | 'llanura'|'bosque'|'colinas'|'vado', fort: murallas (0 = campo
//        abierto), asedio: meses, nombreLugar, p: provincia (opcional), clima, hora, est: solo estimar,
//        jugador: 1 si el jugador manda ejD en la táctica, auto: la IA manda ambos, sinModal}
```
`A`/`D` son los supervivientes (con heridos recuperados) en unidades de `SPU` = 10 hombres. `ejD` es
siempre el defensor (murallas, terreno). `gen` dice si cada general resultó `herido` o `muerto` (`settle`
ejecuta `kill`). `informe = {f, gana, fin, rondas:[{r, f, t, b:[bajasA,bajasD], m:[moralA,moralD]}],
factores:[{k, s, txt}], bajas:[{m,h,r}×2], n0, gens, clima, hora, terreno, fort, brecha, lugar, anio, modo,
curva}` (`curva`: ataque por ronda de las unidades con habilidad) y se
pinta con `cmbInfHtml(informe, ladoDelJugador)`. `settle(p, q, s, g)` es solo un caso: ejército que
entra en provincia enemiga (supervivientes del defensor se repliegan a una provincia vecina propia).
`autoBattle(...)` y `tactical(...)` siguen existiendo con la firma antigua.

## V3: batallas de varios ejércitos y bandos (batalla en conjunto)

```js
cmbResolverMulti(lista, ctx)          // síncrona → {gana: bando, ejs:[{id, u, her, f, bando, gana, A, heridos, bajas, gen, llego}], informe, gen, brecha, todos}
cmbTacticaMulti(lista, ctx, modo)     // Promise del mismo resultado; modo 't3' | 't1' | 'rt'
// ej  = {id, f, u, gen, vet, ori, fat, hambre?, bando, dir}   id: el de Campaña (vuelve tal cual en ejs; la
//        guarnición de un asalto, 'guarnicion'); bando: los del mismo bando no se atacan (por defecto uno por
//        ejército = todos contra todos); dir: procedencia 'N'|'E'|'S'|'O' (o 'W') o ángulo (0 = norte, 90 = este);
//        'C' = el que está en el sitio (defiende). Varios ejércitos de una o varias facciones por bando.
// resultado: ejs en el orden recibido (refuerzos detrás); u = supervivientes (igual que A), her = heridos.
// ctx = lo de siempre (terreno, fort, asedio, p, nombreLugar, clima, hora, est, dificultad[por ejército]) y:
//   def: índice del ejército que defiende la plaza (todo su bando goza de murallas y terreno); si falta, el de
//        dir 'C', o con murallas el primero de otro bando que el primero; informe.def lo recoge
//   flancos: 1-4 lados por los que se asalta (no se aplica si ctx.flancosAplicados)
//   refuerzos: [{ej, dir, llegada}] ejércitos que llegan con la batalla empezada (llegada en segundos de
//              batalla: táctica, por su borde; automática, 1 ronda = 10 s); van DETRÁS de ejs en el resultado
//   oportunista: bando que aguarda (false = nadie; por defecto la IA deja aguardar al bando más débil)
//   humanos: facciones que se controlan desde este cliente (táctica; por defecto [ME]); auto: la IA manda todos
//   emitir: emitir 'batallaResuelta' con ejs y bandos (por defecto NO: la emite quien llama, p. ej. camMulti de
//           Campaña con nuestro informe; los mandos ganan experiencia por ejército leyendo informe.f/gens/bandos)
```
- `cmbResolverAuto`/`cmbTactica` son envoltorios de dos ejércitos (bandos 0 y 1, `def` = 1) con el **mismo
  resultado de siempre** (comprobado con semilla fija: batallas idénticas) y no emiten el evento.
- Automática: cada ejército reparte golpes entre los enemigos con preferencia por el que le amenaza; el bando
  que aguarda apenas es blanco y entra cuando los demás flaquean (unas tres rondas). Moral, desbandada y
  persecución por ejército; la batalla sigue hasta que queda un bando. Atacado a la vez desde dos o más
  direcciones (`dir` distintos) → más flanqueo y factor «El ataque desde varias direcciones». Las fugas de un
  aliado pesan a medias en la moral. De noche gana el bando que defiende (o el que tenga más hombres en pie).
- Asalto por `k` flancos: murallas ×(1 − 0,18·(k−1)), −4·(k−1) de moral a la guarnición y menos frente; factor
  «El asalto por k flancos» e hito «Asalto por k flancos: la guarnición se reparte…».
- Táctica: cada ejército despliega por su `dir` (o, si no la trae, el bando del jugador al oeste y los demás al
  este, norte y sur) como grupo propio con su estandarte, su general (guardia) y su color; los aliados que
  comparten lado se reparten la mitad cada uno. El jugador manda solo los suyos; los aliados IA cooperan (mismos
  blancos, no se estorban). Con murallas, la ciudad queda **al fondo (este u oeste) en un recinto de tres
  lienzos** (frente, norte y sur) con puertas y torres; los arietes van a la puerta del lienzo más cercano. Con
  `flancos ≥ 2` parte de los atacantes forma ante los lienzos norte y sur (si no llegan ya ejércitos por ahí) y la
  guarnición se reparte entre los lienzos amenazados. Los refuerzos aparecen por su borde a su hora.
- `batallaResuelta` de las *Multi con `ctx.emitir`: `{p, atacante, defensor, gana, A, D, s0, d0, gA, gD, ...}` de los dos
  **principales** (el primero y el primero de otro bando, o `ctx.def`) para compatibilidad, más `multi: true`,
  `bandos`, `ganaBando` y `ejs: [{f, bando, gen, u0, A, gana, heridos, bajas, general}]`. Experiencia, fama y
  capitanes se reparten a todos los ejércitos.
- **Contrato con Campaña** (encuentros y asaltos, ya en uso por `camMulti`): `cmbResolverMulti([{id, f, bando,
  dir, u, gen, vet, ori, fat, hambre}], {fort, asedio, flancos, flancosAplicados, refuerzos, p, nombreLugar,
  terreno})` → `{gana: bando, ejs: [{id, u, her}], informe}` con un ejército por ejército del mapa y su
  dirección de llegada; la guarnición o el ejército alcanzado va con `dir: 'C'`.
- **Online** (no implementado aquí): `ctx.onl.ctrl` es ya una lista por ejército (`'local'|'remoto'|'ia'`); cada
  cliente manda los planes de sus unidades como hoy (`[[id, [{st, o}...]]...]`, `o = {tg} | {x, y}`, más
  `hab: [[id, habilidad]]`); la autoridad los aplica con `u.side` = índice del ejército en el campo.

### Datos para el render (`cmbRender()`, para la Batalla 3D u otras vistas)
Foto plana en coordenadas de mundo (casillas; campo `BW`×`BH` = 40×24):
`{t, fase, modo, campo:{w, h, terr[y][x] (0 llano, 1 bosque, 2 colina, 3 río, 4 vado), muro:{hp, hp0, x, y0, y1,
e (1 = ciudad al este), rota}, lados}, ejercitos:[{lado, f, bando, dir, mio, aguarda, llega, general:{id, ok}}],
unidades:[...], fx: BT.fx (flechas {arrow, x0, y0, x, y, t0} y textos), muertos: BT.dead ({x, y, f} en píxeles;
std = estandarte caído)}`. Cada unidad: `id, lado, bando, f, t, clase (inf/dis/cab/asd), x, y` (simulada),
`vx, vy` (dibujada, con inercia), `eje` ('x' u 'y'), `cara` (±1 en su eje), `volteo`, `filas, columnas,
figuras` (vivas), `figuras0, caidas` (huecos de la formación ya vacíos), `huecos` ([dx, dy] en casillas de cada
figura respecto al centro), `estado` ('marcha'|'combate'|'huida'|'disparo'|'quieto'), `obj` (id de su blanco),
`carga, gen, n, n0, moral, cansancio` (0-1), `postura, habilidad, desbocados, mio`.

### Ritmo y aspecto (vista 2D)
- Reproducción más pausada: `cmbRitmo()` = `ifzVel()` si existe (por defecto 0,6); no cambia la simulación y no
  afecta si `ctx.velocidad` está puesto (pruebas) ni a la automática. Formaciones con inercia y giros lentos
  (solo en el dibujo: `vx, vy, volteo`).
- Más tropa visible: dos figuras por hombre en infantería y tiradores (una si el campo pasa de ~2400 figuras),
  en filas y columnas fijas; las bajas dejan huecos; estandartes caídos al romper filas; polvo de la caballería.
- Campo: hierba con matices, bosques con árboles y sombra, colinas sombreadas, río con orillas y vados,
  murallas con almenas, puertas y torres y la ciudad al fondo. Sprites nuevos reemplazables por PNG:
  `MS.bat_arbol`, `bat_pino`, `bat_arbusto`, `bat_roca`, `bat_estandarte`, `bat_torre` (catálogo de la interfaz).
- Rendimiento medido: 3 ejércitos y ~1400 figuras, ~4 ms por fotograma de dibujo (sprites cacheados).

**Ciudad de origen**: cada clase recuerda dónde se reclutó (`G.cmb.ori[pid] = {f, o:{tipo:pid}}`; la que
aporta más hombres manda al fusionar). En batalla `statsUnidad` recibe `ctx.p` = ciudad de origen si sigue
siendo del mismo dueño, si no la provincia del combate. `unidadesDisponibles` se llama siempre con la
provincia concreta donde se recluta (jugador e IA).

## Estado `G.cmb`

`{v, vet:{pid:{f, v:{t:xp}}}, ori:{pid:{f, o:{t:pid}}}, fama:[f], inf:[últimos 8 informes con humanos],
ins:{pid:año de la última instrucción}}`.
`p.u` se normaliza (todas las claves de `TYP`, enteros ≥ 0) en `partidaLista`, `inicioTurno`,
`economiaFaccion` y `finAnio`: las partidas antiguas y los `{i,a,c}` de otros sistemas funcionan.

## Interfaz

- Provincia → **Reclutar**: rejilla con icono, nombre propio, coste y papel; tooltip con fuerzas,
  debilidades y estadísticas; clases bloqueadas con su motivo (fama, edificio); línea de veteranía.
- Pestaña **Ejército** (orden 15): huestes (clic = ir a la provincia), últimas batallas con su informe y
  códex plegable de clases.
- Antes de atacar: composición de ambos ejércitos, terreno y pronóstico de los capitanes (≈% de 16 simulaciones).
- Informe (modal) tras la resolución automática y la táctica: rondas con bajas y barras de moral,
  factores decisivos, muertos/heridos/recuperados. En defensa solo si se pierde o la batalla es grande.
- Táctica: barras de tamaño, moral y cansancio bajo cada unidad, aviso parpadeante al vacilar, bandera
  blanca al huir, pendón dorado del general; ficha con estado, munición, heridos; registro narrativo
  ("los catafractos cargan…", "los lanceros clavan las lanzas…", "flanquean…; su moral se tambalea");
  botón **Delegar en los capitanes**; velocidad ×0,5/1/2/4; murallas dibujadas y río con vados.

## IA de campaña (`ia.js`, ahora de Campaña; lo que quedó de la v1)

Doctrina por pueblo (`CMB_DOC`) ajustada a los vecinos (más lanceros si hay jinetes enemigos, jinetes si
hay arqueros, arqueros/pesados contra infantería), sin jinetes si falta comida, sin élites caras si no
sobra oro, y sin reclutar si el saldo neto de oro (`inc(f).g`) quedaría negativo (reserva para la soldada).
Recluta en las fronteras y, si arma mejor, en la ciudad con más clases. Ataca solo si `cmbEstimar` (5
simulaciones con murallas, terreno, veteranía y general) supera ~66% (menos contra rebeldes y capitales).
No nombra generales a los rehenes (`c.dipReh`). Impuestos (economía) y edificios (tecnología) ya no los toca.

## Ganchos

- **Emite**: `batallaResuelta {p, atacante, defensor, gana, A, D, s0, d0, gA, gD, bajas, heridos,
  factores, rondas, general, modo, informe}`, `conquista {p, de, a}`.
- **Llama**: `statsUnidad` (cada clase, ambos lados y ambas resoluciones; `atk` y `hp` del objeto son
  multiplicadores = 1, el resto valores absolutos), `bonoBatalla` (cada bando), `unidadesDisponibles`
  (ctx `{f, p, motivos}`: un modificador puede poner `motivos[t] = "texto"` para explicar un bloqueo),
  `costeUnidad` (`cmbCoste`, ctx `{f, t, p}` con la ciudad donde se recluta).
- **Escucha**: `partidaLista`, `inicioTurno`, `economiaFaccion`, `finAnio`, `revuelta`, `batallaResuelta`
  (experiencia de generales y capitanes; usa `p, atacante, defensor, gana, gA, gD` y, si hay, `informe`) y
  `conquista` (el capitán surgido en un ataque queda al mando de la plaza tomada).
- `G.cmb` suma `cap` (probabilidad acumulada de capitán por `"f:pid"`) y `capPend`.

## Peticiones al orquestador

**V3**
- **Campaña**: `ctx.flancos` ya es nativo: quitar su traducción (murallas ×0,85 por flanco, `flancosAplicados`).
  Pasar las batallas en conjunto a `cmbResolverMulti`/`cmbTacticaMulti` con un ejército por entrada, su `bando` y
  su `dir`, y los que llegan tarde en `ctx.refuerzos` (ya lo hace `camMulti` con el contrato `{id, u, her}`).
- **Online**: sincronizar varios jugadores en la misma batalla con `ctx.onl.ctrl` por ejército (formato arriba).
- **Batalla 3D**: leer `cmbRender()`; ganchos mínimos en `batalla.js` marcados `/* 3D */`.

**Fase 2**
- **Campaña**: borrar de `campana.js` la copia antigua del motor (ver API); seguir emitiendo `batallaResuelta`
  con `p, atacante, defensor, gana, gA, gD, informe` (de ahí salen experiencia y capitanes); construir `ari`,
  `tor` y `cat` en el asedio y pasarlos en `ejA.u` con `ctx.fort` y `ctx.asedio`. `CMB_DOC` de `ia.js` va por
  índice de pueblo: con los 12 nuevos conviene indexarlo por `CIV[f].id` y añadir `ele`, `cam` y las únicas.
  Si los ejércitos del mapa llevan su propio general, pasarlo en `ej.gen`.
- **Social**: excluir `linaje:false` de herederos y bodas; gobernadores con `cmbNivel(c).nivel`; si registra
  `renombrar` (sociedad.js carga antes que clases.js), la mía no se registra.
- **Tecnología**: `UN[t].civs` lleva ids e índices (su `tecUnidadPropia` funciona). Las únicas caras (`inm`,
  `ber`, `com`, `ele`) caen en su regla de élite (doctrina adoptada); si se prefiere, `UN[t].tec` propio.
- **Interfaz**: la rejilla de tropas de la provincia recorre ~30 clases: mostrar solo `p.u[t] > 0`.
- **Mundo**: `CIV[f].id` y `sinTipos` (tipos sueltos o `"caballos"`); los nombres `un` de los pueblos nuevos
  los completa `cmbCivSync()` (también en `partidaLista`).

**Fase 1**

1. **Interfaz** (`provPanel`): la rejilla de tropas recorre las 9 clases de `TYP`; mostrar solo las que
   tengan `p.u[t] > 0` (o usar `cmbS`/`CIV[f].un`). También conviene un acceso a `cmbInfHtml` desde la crónica.
2. **Diplomacia** (`diplomacia.js` ~652): `add(cap.u, p.u)` da `NaN` si `cap.u` no tiene todas las claves;
   usar `cmbSuma(cap.u, p.u)` (o `cmbLlega(cap, p.u, cmbVetDe(p), cmbOriDe(p))` para conservar veteranía).
   **Sociedad** (~544) crea `{i, a, c}`: funciona (se normaliza), pero `cmbVacio()` es más limpio.
3. **Ejércitos en el mapa** (siguiente sistema): usar `cmbResolverAuto`/`cmbTactica` con `ej.vet`/`ej.ori`
   tomados de `cmbVetDe(p)`/`cmbOriDe(p)` y devolverlos con `cmbLlega`. La táctica solo admite que el jugador
   ataque desde `settle`; para defender, pasar `ctx.jugador = 1`.
4. **Narrativa**: el `informe` de `batallaResuelta` trae factores (`carga`, `flanqueo`, `murallas`,
   `persecucion`, `general`...) útiles para crónicas o eventos.
