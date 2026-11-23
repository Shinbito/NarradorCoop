# Combate y clases de guerreros

Archivos: `js/clases.js` (catálogo, pueblos, veteranía, origen, reclutar, pestaña Ejército, informe),
`js/campana.js` (marchas, modelo por rondas, `settle`), `js/batalla.js` (batalla táctica t3/t1/rt),
`js/ia.js` (IA militar), `css/combate.css`. En `nucleo.js`: `TYP`, `UN`, `MULT`, `tot`, `pw` y los sprites
`SP` de tropa. Prueba: `node pruebas/combate.js [batallas=400] [civ=0]` (añade `stats` como 3.er argumento
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
factores:[{k, s, txt}], bajas:[{m,h,r}×2], n0, clima, hora, terreno, fort, lugar, anio, modo}` y se
pinta con `cmbInfHtml(informe, ladoDelJugador)`. `settle(p, q, s, g)` es solo un caso: ejército que
entra en provincia enemiga (supervivientes del defensor se repliegan a una provincia vecina propia).
`autoBattle(...)` y `tactical(...)` siguen existiendo con la firma antigua.

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

## IA (`ia.js`)

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
- **Escucha**: `partidaLista`, `inicioTurno`, `economiaFaccion`, `finAnio`, `revuelta`.

## Peticiones al orquestador

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
