# Online — partidas largas por estaciones

Archivos: `js/online.js` (todo el sistema, prefijo `onl`/`ONL`), `css/online.css`, `docs/online.md`,
`pruebas/online.js`; en `js/inicio.js` la parte online (vista `lobby`, acciones `s-onl…`, y los nombres
de siempre `leaveNet`, `names`, `openLobby`, `createOnline`, `joinGame`, `enterGame`, `endOnline`, que
ahora delegan en `online.js`); en `js/batalla.js` los ganchos marcados `/* ONL */` (batallas en vivo e
IA difícil).

El online solo funciona con el juego **publicado como artefacto de Claude** (ver «Publicar»): usa
`claude.use('db')`, `claude.use('user')` y `claude.use('room')`. No hay servidor: un cliente de los
jugadores hace de autoridad en cada estación, y no hay notificaciones push al móvil o al correo (ver
«Limitaciones»).

## 1. Cómo se juega

- **Partida online** (inicio) → vestíbulo con pestañas: *Mis partidas* (con su estado: «Te toca · quedan
  5 h», «Esperando a Ben», «¡Te atacan en Turris! Acude antes de…», «Por ausencia, tu pueblo lo lleva la
  IA», archivo de terminadas), *Públicas*, *Amigos*, *Avisos* y *Crear partida*.
- **Crear partida**: privada (solo amigos invitados) o pública (aparece en la lista para cualquiera);
  amigos a invitar; modo de turno (correspondencia o tiempo real); plazo por estación (1-72 h); duración
  de la estación en tiempo real (60-300 s); espera para aceptar una batalla en vivo (60-120 s); cuánto se
  espera a un amigo desconectado al que atacan (no, 30 min … 24 h); modo de las batallas en vivo (t3, t1,
  rt). Después, el flujo de siempre: modo histórico/leyendas, pueblo, rivales, soberano.
- **Unirse**: las plazas libres de una partida (pueblos de `activas` sin dueño) y las abandonadas
  («sustituir») se eligen con un desplegable. Una privada solo admite a sus invitados.
- En la partida, la pestaña **Online** (orden 85): estado y cuenta atrás, jugadores (conectado ●, listo,
  dando órdenes (n), IA por ausencia, abandonó; «+ amigo»), las **órdenes de campaña de la estación**
  (con «quitar»), «Listo ▶» / «Quitar «Listo» (seguir dando órdenes)», «Pasar a tiempo real» (solo con todos conectados),
  «Volver a correspondencia», «Avisos del navegador», «Abandonar» / «Retomar mi pueblo», lo que le pasó a
  tu pueblo la estación pasada y el tamaño del estado guardado.

## 2. Modelo de turno: estaciones con órdenes simultáneas

Una **ronda = una estación** (`G.estacion`, campaña). En ambos modos todos juegan la misma estación a la
vez, cada uno en su pantalla sobre una copia del estado publicado:

1. **Gobierno** (reclutar, construir, impuestos, diplomacia, eventos del año de `startTurn`…): se aplica
   en la copia local como en un jugador.
2. **Campaña**: `formar`, `acampar`, `dividir`, `unir`, `general`, `construir`, `levantar`, `disolver` y los
   contratos mercenarios se aplican en local (solo tocan lo tuyo). Las órdenes que **mueven o enfrentan**
   — `mover`, `asediar`, `asaltar`, `salida` (`ONL_COLA`) — **no se ejecutan**: se encolan (`ONL.cola`, una
   por ejército; se dibujan en el mapa con una línea de puntos). El alcance de cada ejército es el de
   campaña (`camMovMax`): lo que no llegue queda en `plan` y sigue la estación siguiente.
3. **Listo** (`endOnline` → `onlListo`): se envía a `partidas/<id>/ordenes/<f>` solo la **diferencia**
   con el estado de partida (no el G entero), comprimida: `{ops, C (personajes nuevos), ejs (tus
   ejércitos), log (entradas nuevas), ords (la cola)}`, con versión `v`, y se marca `listos[f] = turno`,
   `envV[f] = v`. **Quitar «Listo»** (`onlQuitarListo`, botón del panel): mientras la estación no se esté
   resolviendo, `listos[f] = -1`, vuelve a ser tu turno con tu copia local intacta (las órdenes enviadas
   siguen ahí), puedes cambiarlas y reenviar; el contador «listos n/m» (`onlTextoTurno`) cambia al
   instante. Quien resuelve marca `meta.resolviendo = {turno, ts, por}` y desde entonces ya no se puede
   quitar («La estación ya se está resolviendo»); usa siempre el último envío (versión = `envV[f]`) y, si
   tras leer los envíos alguien quitó su «Listo» o reenvió, aplaza el cierre sin publicar nada.
4. **Cierre**: cuando todos los pueblos activos están listos (tras 2,5 s de cortesía, por si alguien se
   arrepiente) o vence el plazo (`limite`), un cliente toma el cerrojo `partidas/<id>/ctl/res` (`acquire`,
   20 s renovado cada 7 s; además un cierre a la vez por pestaña) y resuelve (`onlResolver`).
5. **Repetición**: al recibir la estación resuelta (también quien la resolvió) se llama a
   `ifzRepetir(G.cam.rep)` (Interfaz; Campaña graba `G.cam.rep`, contrato §9) antes del resumen y de los
   eventos del jugador. `G.cam.rep` viaja dentro del estado comprimido si pesa ≤ 30 KB de JSON; si pesa
   más, va comprimida en `partidas/<id>/rep/t<turno>` (una repetición sintética de 3 000 pasos: 146 KB →
   32 KB) y se borra al publicar la estación siguiente; nunca viaja en los envíos de los jugadores. Al
   volver tras una estación se reproduce sola; tras varias, «Mientras no estabas» ofrece «Ver la repetición
   de la última estación» (solo se conserva la última). **Niebla**: cada jugador solo ve los pasos cuyo
   `vh` lo incluye (`onlRepFiltrada`); para que `vh` cuente a todos los jugadores de la partida y no solo a
   los que enviaron órdenes, `camRep` (ejercitos.js, cambio mínimo `/* ONL */`) usa `onlHumanosVista()`
   mientras se resuelve.

**Por correspondencia** (`cfg.modoTurno = 'corr'`): plazo `cfg.plazoH` horas. **Simultáneo en tiempo
real** (`'tr'`): mientras todos los jugadores activos tienen la partida abierta (presencia del room), la
estación dura `cfg.trSeg` segundos; el anfitrión acorta el plazo en cuanto están todos, cada cliente pulsa
«Listo» solo al acabar el reloj y resuelve el anfitrión (los demás esperan 8 s antes de intentarlo). Si
alguien se desconecta, el plazo que queda es el de correspondencia. Se cambia de uno a otro con los
botones del panel (a tiempo real solo con todos conectados). Durante la estación se sincronizan
**órdenes, no estado**: la presencia (`{u, p, f, l: listo, n: órdenes}`) dice quién está dando órdenes y
cuántas; las órdenes van a la db al pulsar «Listo».

### Resolución (un solo cliente)

`onlResolver`: lee la meta y todos los envíos del turno, **fusiona** (`onlFusionar`), pone
`G.human = presentes` (los que no enviaron los lleva la IA esa estación, también en el año: `ai(f)`),
inyecta las órdenes humanas en la primera llamada a `camResolverSimultaneo` de `camEstacion` (las marchas
de humanos e IA se resuelven a la vez, como pide campaña) y llama a `finEstacion()` (API de turnos/campaña,
sin duplicar el bucle: tras el invierno hace `finDeAnio`). Como en un jugador, si ningún humano tiene
campañas en marcha (`camSaltar(f)` de todos) pasan solas las estaciones hasta la primavera. Todas las
tiradas (`R()`) las hace quien resuelve; el resultado se publica entero y los demás lo cargan.

**Fusión**: `onlDiff(base, local)` da operaciones `[ruta, valor]`, `[ruta]` (borrar) y `[ruta, '$app',
items]` (lista que solo creció, p. ej. buzones de propuestas `G.inbox`). Se aplican por orden de pueblo;
si dos jugadores cambian el mismo número (oro, comida, relación) se **suman los dos cambios**; las
añadiduras van al final. Aparte: `G.log` (entradas nuevas de todos delante), `G.C` (personajes nuevos al
final, renumerados si otro también añadió: `sp, fa, mo, gen, ruler, heir, regente`), `G.cam.ej` (cada
jugador aporta sus ejércitos) y `G.cam.sig` (cada pueblo usa su tramo de ids durante su turno:
`onlTramoSig`). `G.onl` y `G.human` no viajan.

**Publicar** (`onlPublicar`): marca las entradas nuevas de `G.log` con `t = turno`, guarda el estado en
trozos `v<ver+1>-<k>`, actualiza la meta (`turno+1`, `ver+1`, año/estación, `limite` nuevo, faltas),
borra la versión `ver-1` y las batallas del turno, deja el aviso `turno-<id>` a cada jugador y lanza
`onl.aviso` por el room. Tras `cfg.faltasMax` (3) estaciones seguidas sin órdenes, el asiento pasa a
`est[f] = 'ia'` (lo lleva la IA hasta que su dueño pulse «Retomar»).

## 3. Datos en la db

| Ruta | Contenido |
|---|---|
| `partidas/<id>` | meta: `v:2, name, created, updated, host, modo, activas, publica, invitados[], jug[], seats{f:uid}, est{f:'activo'|'ia'|'abandono'}, faltas{f}, turno, year, estacion, ver, partes, tam, tamZ, fase('ordenes'|'batalla'|'fin'), limite, cfg{…}, listos{f:turno}, visto{uid:turno}, batalla, susp{turno}, over, terminada` |
| `partidas/<id>/estado/v<ver>-<k>` | `{z, ver, k, n}`: el G comprimido, en trozos de 190 000 caracteres |
| `partidas/<id>/ordenes/<f>` | `{turno, uid, ts, z, n}`: el envío de ese pueblo (se sobrescribe cada estación) |
| `partidas/<id>/batallas/<bid>` | batalla entre jugadores: pendiente (`estado, a, d, fa, fd, lugar, limite, s0, d0`) o con su resultado (`res`) |
| `partidas/<id>/ctl/res`, `ctl/seat-<f>` | cerrojos (`acquire`) para resolver y para ocupar una plaza |
| `amistades/<a>~<b>` | `{par:[a,b], de, para, estado:'pendiente'|'aceptada', ts}` |
| `avisos/<uid>/items/<clave>` | `{tipo, partida, nombre, texto, ts, de}`; claves fijas (`turno-<id>`, `bat-<id>`, `inv-<id>`, `ami-<uid>`…): no se acumulan |

Consultas: *Mis partidas* = `jug array-contains uid` ∪ `invitados array-contains uid`; *Públicas* =
`publica == true` por `created`. Los asientos se toman con `acquire` sobre `ctl/seat-<f>` (no hay
transacciones). Documentos por partida: meta + 2 versiones × trozos + ≤ NF envíos + batallas del turno.

### Tamaño de G y compresión

Medido con `pruebas/online.js` y con 120 años de IA en leyendas (12 pueblos):

| Partida | JSON | Comprimido (LZ) | Trozos |
|---|---|---|---|
| 20 años, 12 pueblos | ~135 KB | ~58 KB | 1 |
| 50 años, 12 pueblos | 200-240 KB (`G.C` 80-100 KB, 500-660 personajes) | 82-93 KB | 1 |
| 120 años, 12 pueblos | 1,6 MB (de ellos `G.C` 1,4 MB: 9 137 personajes, 6 606 vivos) | 417 KB (0,26) | 3 |

El límite de un documento es 256 KiB, así que el estado **nunca** va en la meta: va comprimido con
`onlLZc`/`onlLZd` (LZW de diccionario creciente, al estilo de lz-string, con un alfabeto de 64 símbolos
seguros en JSON; ~0,5 s para 1,6 MB) y troceado. La meta se escribe la última, así que nadie lee una
versión a medias. Los mensajes de room de más de 3,6 KB (inicio y fotos de una batalla) van también
comprimidos y en trozos. **Aviso**: `G.C` crece casi exponencialmente (ver peticiones); con 150 años el
estado pasaría de varios MB y cada estación costaría más.

## 4. Partidas largas

- **Mis partidas** con estado (te toca / esperando a X / batalla pendiente / IA por ausencia / terminada),
  ordenadas por urgencia; terminadas en un **archivo** plegable («Ver el final», «Quitar de la lista»).
- **«Mientras no estabas»**: al entrar, si `visto[uid] < turno`, un modal con lo que le pasó a tu pueblo
  (crónica personal `G.onl.cron`: batallas, conquistas, guerras/paces/alianzas, revueltas, sucesiones,
  crisis y «la IA gobernó…», registradas por los eventos de `OC` mientras se resuelve) y la crónica del
  reino (`G.log` con `t ≥ visto`). En juego continuo, el panel muestra la estación pasada.
- **Abandono** (`est = 'abandono'`): la IA lleva el pueblo y la plaza aparece libre («sustituir») para
  otro; el dueño puede volver mientras nadie la tome. **Sustitución por IA** automática tras 3 faltas;
  **reincorporación** con «Retomar mi pueblo».
- Una estación que se cierra sin tus órdenes te lo dice al recibirla.
- Las partidas del formato antiguo (un jugador por turno, `state` en la meta) se convierten al entrar.

## 5. Amigos, avisos y notificaciones

- Amistad **mutua**: solicitud (`onlAmigoPedir`, desde la búsqueda `user.search`, desde los jugadores de
  tus partidas o con «+ amigo» en el panel) y aceptación (`onlAmigoAceptar`). Desconocido = cualquiera que
  no sea amigo (p. ej. quien entró por la lista pública).
- **Bandeja** (botón ✉ fijo abajo a la derecha, cuenta de avisos + partidas en las que te toca) y título de
  la pestaña con «(!)» si algo requiere tu acción. Los avisos para quien no está conectado quedan en la db
  y aparecen al abrir el juego.
- **Notification API**: «Avisos del navegador» pide permiso; con la pestaña en segundo plano avisa de tu
  turno, de invitaciones a batalla y de avisos nuevos.

## 6. Batallas entre jugadores

`camLibrar` (campaña) está envuelta: si durante la resolución se enfrentan dos pueblos con dueño humano
activo (encuentro, asalto o salida), `onlPrepararBatalla` aplica las reglas:

| Defensor | Qué pasa |
|---|---|
| conectado (amigo o desconocido) | invitación en vivo (capa propia «¡Batalla!», `onl.inv`); si rechaza o no responde en `cfg.invitSeg` s → **IA difícil** |
| desconectado y **amigo** | la estación se **detiene** (`fase: 'batalla'`, `meta.batalla`, aviso `bat-<id>`): tiene `cfg.amigoMin` minutos para acudir. Al abrir la partida le sale «¡Te atacan!»: si acude, su cliente resuelve de nuevo la estación y dirige la defensa (el atacante, si está conectado, es invitado en vivo; si no, IA difícil). Si no acude a tiempo o elige «Que luchen mis capitanes» → IA difícil. Una sola espera por estación. |
| desconectado y desconocido (o plazo 0) | **IA difícil** al momento |

El atacante sigue las mismas reglas (si quien resuelve no es él y está conectado, se le invita). Quien
juega en persona contra la IA difícil elige táctica (t3/t1/rt) o automática. La resolución abortada al
detenerse no publica nada; al reanudarla se repite desde el mismo estado y las mismas órdenes, y una
batalla ya librada se reutiliza (`batallas/<bid>.res`) si las dos tropas coinciden (`s0`, `d0`).

**Batallas de varios ejércitos** (combate v3: `camMulti` → `cmbResolverMulti`/`cmbTacticaMulti`, p. ej.
dos aliados contra uno o tres bandos): `camMulti` también está envuelta (`onlPrepararMulti`). Si en la
batalla hay ejércitos de dos o más jugadores, cada ejército tiene su dueño y su mando (`desc = {lista,
uids, ctrl, dif, multi, bandos}`, una entrada por ejército): se invita a los conectados, los ausentes los
lleva la IA difícil y los de la IA, la IA normal. El resultado se entrega a `camMulti` con
`ctx.onlResMulti` (gancho `/* ONL */` en `cmbResolverMulti`). Las batallas conjuntas no detienen la
estación para esperar a un amigo (solo las de dos ejércitos).

**En vivo** (`onlBatallaVivo`): la **autoridad** (quien resuelve, si participa; si no, el primer
participante que aceptó, por delegación) corre `cmbTactica` (dos ejércitos) o `cmbTacticaMulti` (varios,
con `ctx.humanos = [ME]`) con `ctx.onl = {ctrl:[…], …}`: `'local' | 'remoto' | 'ia'` **por ejército del
campo** (`BT.map`), y difunde el campo por una sala con nombre (`room.join('b-…')`). Cada otro jugador abre
un **espejo** (`onlEspejoIni`): el mismo campo, con `BT.mios` = sus ejércitos (solo puede mandar esos), y
la interfaz táctica de siempre; planea y pulsa «Ejecutar turno»: manda su plan (`plan`: `[[id, [{st, o}…]]…]`
con `o = {x, y} | {tg, dis?, cc?}`, y `hab: [[id, habilidad]]`); la autoridad solo lo aplica a las unidades
de los ejércitos de ese jugador y ejecuta el turno cuando tiene los de todos (si alguien tarda 60 s, deciden
sus capitanes; tras 3 veces, la IA se queda sus ejércitos). Fotos compactas del campo (`est`) cada 250 ms
durante el turno y al acabarlo (con los planes); al final `fin` con el resultado y, para cada jugador, si
ganó (`gano`) y su ejército (`yoDe`) para su informe. Habilidades, retirada («huir»: gana el bando más
fuerte de los demás y la batalla termina) y delegar en los capitanes (`cap`) también viajan. En tiempo real
(`rt`) el espejo manda sus órdenes cada 0,4 s y la autoridad envía fotos cada 0,4 s (depende de la latencia
del room; por turnos es lo más robusto y es el valor por defecto).

**IA difícil** (`ctx.dificultad = ['normal'|'dificil', …]` por ejA/ejD, lo respeta combate):
- automática (`cmbDificultadAuto`): +4 % de daño, +5 % de moral y algo más de fortuna (en la prueba, en una
  batalla igualada el bando que gana el ~50 % con la IA normal gana el ~70 % con la difícil);
- táctica (`cmbIADificil`, tras `aiOrders`): retira tras la línea las unidades rotas (≤ 35 % de hombres o
  ≤ 30 % de moral), la caballería rodea al enemigo trabado y carga por el flanco o la espalda (en t3:
  acción 1 al flanco, 2-3 al ataque), los tiradores concentran el tiro en la unidad más tocada o en la
  caballería que se acerca, la infantería no persigue escaramuzadores; entra con +6 % de moral. Las
  habilidades las sigue usando `cmbHabIA`.

### Ganchos `/* ONL */` en `js/batalla.js`

`cmbResolverAuto` (resultado precalculado `ctx.onlRes`, dificultad), `cmbResolverMulti` (`ctx.onlResMulti`), `cmbDificultadAuto`, `cmbTactica`
(moral de la IA difícil, `ctx.onl.inicio(BT)`), `executeTurn` (espera de planes remotos, IA solo en sus
lados, foto final, bucle sin lado local), `runPhase` y `realtime` (fotos, IA por lados), `finishBattle`
(`ctx.onl.fin`), `simStep` (`cmbHabIALado`), `canOrder` (sin lado local no se ordena), `battleAct`
(el espejo redirige exec/huir/cap/hab), `bui` (`BT.onlMsg`), `aiOrders` → `aiOrdersBase` + `cmbIADificil`.
Sin `ctx.onl` ni `ctx.dificultad` todo se comporta como antes.

### Envolturas sobre funciones globales de campaña (desde `online.js`, sin tocar sus archivos)

`camLibrar` (batallas entre humanos), `camMulti` (batallas conjuntas entre humanos), `camOrdenUI` (encolar las órdenes de movimiento en online) y, solo
durante una resolución, `camResolverSimultaneo` (añadir las órdenes humanas). Fuera del modo online no
cambian nada. Interfaz llama directamente a `onlDibujarCola(now)` (las órdenes encoladas sobre el mapa) y
a `onlTextoTurno()` → `{info, boton}` (barra de turno: «Online · correspondencia · listos 1/3 · 5 h»).

### Cambio mínimo en `js/ejercitos.js` (campaña)

`camRep`: `o.vh = ((typeof onlHumanosVista === "function" && onlHumanosVista()) || G.human).filter(…)`,
marcado `/* ONL */` (ver «Repetición»). Las batallas de varios ejércitos por bando (`camReunir`, sin modal
en online: usa `ej.apoyo`) pasan por `camLibrar` mientras combate no defina `cmbResolverMulti`; si lo
define, las batallas conjuntas entre humanos se resolverán en automático (ver peticiones).

### La guerra es cosa de los implicados (partidas de 3 o más)

Nada de una guerra o batalla ajena llega a quien no participa (salvo, si procede, una línea en la crónica
general `G.log`):
- **Declaración**: diplomacia/narrativa ya avisan por pueblo (`narEncolar(b, 'armas')` solo al defendido;
  las llamadas a las armas de aliados humanos van a su buzón). Online solo anota en la crónica personal de
  los dos (`G.onl.cron`, filtrada por pueblo) y deja aviso ✉ solo al destinatario de una propuesta o
  llamada (`propuestaHumana`).
- **Invitación**: el mensaje `onl.inv` lleva `para` y solo lo muestra ese jugador (capa propia); su plazo
  se cuenta con su propio reloj (`dur`).
- **Sala de la batalla**: una por batalla (`b-<hash>`), a la que solo entran los invitados que aceptan;
  la autoridad solo admite `hola` de los dos participantes y el `ini` lleva la lista (`part`): un tercero
  no abre el espejo ni recibe fotos.
- **Quien resuelve y no participa** (p. ej. el anfitrión en tiempo real) **no abre la batalla**: la
  delega (`onlDelegar` → `delegar`) en el participante que aceptó (el atacante si aceptó), que la dirige
  como autoridad con el otro en espejo y devuelve el resultado (`fin` con `res`). Si nadie acepta o el
  delegado se desconecta, se resuelve en automático con IA difícil por los ausentes.
- **Avisos y estados**: el aviso `bat-<id>` y el modal «¡Te atacan!» solo al defensor; en «Mis partidas»
  y en la barra, a un tercero solo «Estación detenida: se espera a un jugador» (ni lugar ni nombres). La
  pausa no emite ping por el room.
- **«Mientras no estabas»**: tu crónica personal y, de la general, solo las entradas que nombran a tu
  pueblo.
- **Modales en el cliente que resuelve**: los sistemas usan `isMe(f)` para modales (sucesión, era nueva,
  guerra civil, informes) y colas por pueblo para el resto (narrativa `narEncolar`, buzón de diplomacia,
  demandas sociales): a quien resuelve no le salen los de otro jugador. Los informes de batalla los ve
  cada participante en su pantalla.

## 7. Publicar el juego para jugar online

1. Publica la carpeta `videojuego-ocaso/` como artefacto (index.html + js/ + css/), p. ej. con
   `publish_files` de la herramienta de artefactos.
2. Declara sus capacidades (`declare_capabilities`) con esta declaración entera:
   ```js
   { db: {},
     user: { scopes: ["profile"] },
     room: { topics: { "onl.inv": "interact", "onl.resp": "interact", "onl.aviso": "interact", "onl.b": "interact" } } }
   ```
   (`profile` para ver los nombres; los temas del room abiertos a colaboradores, si no solo los editores
   podrían emitir).
3. Comparte el artefacto con tus amigos con permiso de **Colaborador** (Contributor): con «Lector» se
   puede mirar pero no escribir en la db ni emitir en el room. Todos deben entrar con su cuenta.

### Limitaciones

- **Sin servidor**: la estación se cierra cuando algún jugador tiene el juego abierto después del plazo
  (o cuando todos están listos). Si nadie lo abre, la partida espera.
- **Sin push** al móvil ni al correo: avisos en el juego (bandeja ✉, «(!)» en el título, avisos en la db
  que aparecen al abrir) y la Notification API solo con la pestaña abierta.
- La db del artefacto es de confianza entre sus colaboradores (las reglas por defecto dejan escribir a
  todos los colaboradores): un jugador con malas artes podría alterar el estado.
- La fusión de turnos simultáneos es por campos: dos jugadores que cambian la misma cosa a la vez (p. ej.
  el mismo tratado) se quedan con la del pueblo de índice mayor; los números se suman. Las órdenes de
  movimiento no tienen ese problema (se resuelven juntas).
- La crónica `G.log` la escriben los sistemas pensando en `ME`: en online refleja a quien resolvió cada
  estación (por eso existe la crónica personal `G.onl.cron`).
- Al reanudar una estación detenida por la batalla de un amigo se repiten las mismas órdenes (también las
  de la IA, guardadas en la batalla pendiente), pero el azar (`R()` = `Math.random`, sin semilla) de lo
  que pasa antes puede cambiar el encuentro: si no se repite, la estación sigue sin esa batalla.
- Recargar la página a mitad de turno pierde lo hecho en esa estación (las órdenes ya enviadas no).
- Partida de 100-150 años: posible, pero el tamaño de `G.C` (ver peticiones) la hará lenta.

### Sin Claude: servidor propio del VPS (`js/red.js`)
Fuera de un artefacto de Claude, `js/red.js` (el primer script de `index.html`) define `window.claude.use('db'|
'user'|'room')` hablando por WebSocket con el servidor de Ocaso del VPS (`https://ocaso.srv1727399.hstgr.cloud`,
`/__red/ws`; su lógica es la del doble de `pruebas/online.js`, con datos en disco). Así el online funciona en la
web, en GitHub Pages y en las apps (APK / iPhone). Si `claude` ya existe (artefacto) no hace nada. Otro servidor:
`localStorage["ocaso.servidor"] = "http://host:puerto"`. Identidad: un nombre (único) + uid + token guardados en
el dispositivo; «Ahora no» deja jugar sin conexión. Añade al menú online «Invitar amigos» (enlace `?amigo=<uid>`,
o pegarlo en la app) y «Conectados ahora». `js/online-ia.js` (tras `online.js`) hace que las batallas de UN
jugador contra un pueblo de la IA también se repartan con `onlRepartirMando`/`onlLibrar` (en vivo si está
conectado), en vez de resolverse solas.

## 8. Pruebas

`node pruebas/online.js [rapida]` (doble de la API en Node, compartido por varias páginas): amigos
mutuos y avisos; crear (interfaz) y unirse por invitación; estación con órdenes de los dos y fusión;
plazo vencido → IA por el ausente y aviso al volver; tiempo real con envío automático; batalla en vivo
entre dos páginas (autoridad + espejo girado, fotos, retirada, informe a los dos); IA difícil contra un
desconocido desconectado sin esperas; batalla pendiente con un amigo desconectado que vuelve, ve
«Mientras no estabas» y dirige su defensa; tamaño del estado de 50 años con 12 pueblos (20 en `rapida`),
compresión reversible y trozos < 256 KiB; la IA difícil gana más (automática) y sus órdenes tácticas
(retirar rotas, flanquear); **batalla conjunta** de tres jugadores (A y C aliados contra B: cada uno manda
solo sus ejércitos, gana el aliado y pierde B); **quitar «Listo»** (contador al instante, reenvío versionado, bloqueado si ya
se resuelve); **tres jugadores**: A declara la guerra a B y libran una batalla en vivo mientras C, conectado,
no ve capa, espejo, fotos (contadas en el doble), modales, avisos ni notificaciones, ni entra en su crónica;
y cuando resuelve C (que no participa) la batalla se delega en A; repetición pequeña dentro del estado y
grande en su documento, sin viajar en los envíos, y llamada a `ifzRepetir`. Capturas `pruebas/capturas/online-*.png`.

## 9. Peticiones al orquestador

1. **Diplomacia / núcleo (`life`, bodas, nacimientos)**: `G.C` crece casi exponencialmente: 168
   personajes a los 19 años, 9 137 (6 606 **vivos**) a los 120 años en leyendas con 12 pueblos (1,4 MB de
   1,6 MB de estado). Conviene limitar los nacimientos por corte y compactar los muertos antiguos (los ids
   son índices: dejar un esqueleto `{id, n, f, sex, alive:false}`).
2. **Campaña**: exponer ganchos oficiales en vez de mis envolturas: `camEstacion(ordenesExtra)` (las
   órdenes humanas), un evento/gancho antes de librar una batalla (`camLibrar`) que permita darle el
   resultado, y que `camOrdenUI` consulte un filtro (`OC.calc('ordenCampana', o)`); y que la IA de campaña
   no mueva ejércitos humanos (hoy `camNuevaEstacion` continúa sus `plan` al empezar la estación, fuera de
   la resolución simultánea).
3. **Interfaz**: el botón de fin está desactivado cuando no es tu turno; con «Listo» pulsado podría
   ofrecer directamente «Quitar listo» (llamando a `onlQuitarListo()`), hoy está en la pestaña Online.
   Implementar `ifzRepetir(rep)` (ya la llamo si existe).
4. **Narrativa**: `startTurn` se ejecuta en cada cliente para su pueblo (`G.evY`) y sus cambios viajan en la
   diferencia: bien. Los eventos que salen durante la resolución (fin de año) se muestran a quien resuelve;
   para los demás jugadores convendría encolarlos en `G.inbox[f]` en lugar de decidir por ellos.
5. **Diplomacia**: las propuestas entre humanos van por `G.inbox` y se fusionan como añadidos; la respuesta
   llega a la estación siguiente. Un aviso de la db para propuestas a jugadores desconectados sería útil
   (puedo escribirlo si se emite un evento `propuestaHumana {de, a, tipo}`).
6. **Contrato**: añadir `G.onl` (clave reservada de Online).
7. **Campaña (mercenarios)**: en online, al vencer el contrato de un jugador humano
   (`mercenarios.js`, `if (!isMe(c.f) || net.on) continue;`) no se decide nada y el contrato queda vencido
   para siempre; convendría encolar la decisión para su dueño (buzón) o renovarlo por defecto.
8. **Campaña**: un gancho oficial en `camMulti`/`camLibrar` («antes de librar») para no tener que
   envolverlas desde online.
9. **Interfaz/Campaña**: `rep.ej0` (ejércitos al empezar la repetición) no lleva `vh`: con niebla, cada
   jugador vería al principio todos los ejércitos; convendría filtrarlos por visibilidad al grabarlos.
