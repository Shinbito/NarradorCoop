# Mundo (civilizaciones nuevas) — Ocaso del Imperio

Sistema **Mundo**: qué pueblos existen, cuáles juegan cada partida, los dos modos de juego y el
tamaño del mapa. Archivos: `js/mundo.js`, `docs/mundo.md`, `pruebas/mundo.js`,
`pruebas/datos/partida-antigua-410.json`; además `js/mapa.js` (generación), `js/inicio.js`
(pantallas de inicio), `newGame`/`setup` de `js/partida.js` y en `js/nucleo.js` `CIV`, `NF`, `REB`,
`PAL`, `PNAMES`, `civIdx` y `W`/`H` (ahora `let`).

## 1. Modos

| `G.modo` | Pueblos | Mapa | Inicio |
|---|---|---|---|
| `historico` (por defecto) | las 7 originales (`G.activas = [0..6]`) | 64×40, rejilla 8×5 (~38 provincias), **idéntico al de antes** (misma semilla → mismo mapa) | alianza romana, foedus franco, guerras de 410, nombres latinos (`PNAMES`) |
| `leyendas` | el jugador elige su pueblo entre los 19 y de 1 a 18 rivales (al azar o a mano) | crece con el número de pueblos: `mundoDims` (≤7 pueblos 64×40; 12 → 89×56 ~57 prov.; 19 → 112×70 ~100 prov.) | sin tratados históricos; capitales repartidas según la geografía real aproximada (`MUNDO_GEO`: América al oeste, China al este...); provincias con nombres de cada pueblo (`MUNDO_PN`) |

Pantalla de inicio: «Nueva campaña» → elegir modo (botones `s-modo-historico` / `s-modo-leyendas`) y
pueblo (`s-civ-N`) → en leyendas, rivales (`s-rmodo-azar|mano`, `s-nriv-inc|dec`, `s-rsort`, `s-rtog-N`,
`s-rtodos`, `s-rning`, `s-rok`) → soberano → `s-go`. El modo histórico conserva el flujo de antes
(las pruebas `s-new` → `s-civ-N` → `s-go` siguen valiendo). Online: `G.modo`/`G.activas`/`G.mapa`
viajan en `G`; el documento de la partida guarda además `modo` y `activas` para que el lobby solo
ofrezca los pueblos que juegan.

## 2. Estructura

- `CIV[0..6]` originales (índices FIJOS), `CIV[7..18]` nuevas, `CIV[19]` rebeldes.
  `REB = CIV.length - 1` (19), `NF = REB` (19). Todos los `CIV[f]` tienen `id`.
- `G.activas`: índices que juegan. Las demás facciones existen en `G.F` (todo bucle `for f < NF`
  funciona) con `G.F[f].ausente = true`, `capId: 0`, sin provincias (`alive(f)` falso) y un soberano
  «de nombre» **muerto** (`G.C[...]` con `alive: false`, `mundoAusente: true`), para que `ruler(f).n`
  no falle pero no haya corte que envejezca, se case ni herede.
- `G.rel` / `G.st`: matrices NF×NF (19×19).
- `G.mapa = {w, h, gx, gy}`: con `gen(G.seed, G.mapa)` se regenera el mismo mapa. `W`/`H` (globales)
  los fija `gen()`, que también redimensiona los lienzos `cv`/`base`. Usad siempre `W`/`H`, nunca 64/40.
- Guarnición inicial de la capital: `CIV[f].u0` (hunos y mongoles a caballo; incas, mayas y aztecas
  con honderos/átlatl y sin jinetes), por defecto `{i:6, a:4, c:2}`.

### API (`js/mundo.js`, `js/nucleo.js`)

| Función | Qué hace |
|---|---|
| `civIdx(id)` | índice de un pueblo por id (−1 si no existe) |
| `mundoActivas()` / `civActiva(f)` | pueblos de la partida (las 7 si no hay `G`) |
| `mundoLeyendas()` | `G.modo === 'leyendas'` |
| `civPuede(f, t)` | falso si la clase `t` está en `CIV[f].sinTipos` |
| `civBase(f)` | índice del pueblo original «pariente» (`CIV[f].base`): úsalo como respaldo mientras falte contenido propio: `TABLA[f] ?? TABLA[civBase(f)]` |
| `mundoDims(modo, n)` | tamaño del mapa para n pueblos |
| `mundoRivalesAzar(me, n)` | n rivales al azar |
| `newGame(me, cand, {modo, activas})` | sin tercer argumento, modo histórico |

Relleno provisional (`mundoRelleno`, en `partidaLista`): si tecnología no define `tecIni`, `tecPri`
o `tecLibres` de un pueblo nuevo, se copian de su pariente (`base`), sin clases vetadas. Solo rellena
lo que falta; las eras y edificios propios se dejan al respaldo genérico de tecnología.

Modificador `unidadesDisponibles` (prioridad 100, se aplica el último): quita los tipos de
`CIV[f].sinTipos` y rellena `motivos[t]` («No hay caballos en estas tierras»).

### Partidas guardadas antiguas

`mundoMigrar` escucha `partidaLista` (es el primer oyente: `mundo.js` se carga tras `nucleo.js`).
Si falta `G.activas` (partida anterior a la fase 2), remapea el 7 de los rebeldes a `REB` en
`p.owner`, `p.home`, `c.f` y `G.cmb.vet/ori[*].f`, y marca `G.activas = [0..6]`, `G.modo = 'historico'`.
Siempre (idempotente) completa `G.mapa`, amplía `G.rel`/`G.st` a NF×NF, crea las facciones ausentes
en `G.F` y rellena `G.dip.rep`. Probado con `pruebas/datos/partida-antigua-410.json` (guardada con el
código anterior).

## 3. Pueblos

| id | f | Nombre | Religión (`rel`) | `sinTipos` | Únicas sugeridas (`unicas`) | `base` | Rasgos (bon, gold, ord, otros) |
|---|---|---|---|---|---|---|---|
| occ | 0 | Imperio de Occidente | niceno | — | — | occ | infantería resistente, orden +6 |
| ori | 1 | Imperio de Oriente | niceno | — | — | ori | oro ×1,25, catafractos |
| vis | 2 | Visigodos | arriano | — | — | vis | infantería al ataque |
| hun | 3 | Hunos | pagano | — | — | hun | caballería y arqueros, oro ×0,85, `u0` a caballo |
| van | 4 | Vándalos | arriano | — | — | van | botín 30 |
| fra | 5 | Francos | pagano | — | — | fra | infantería barata (`icost` 0,8) |
| per | 6 | Persia Sasánida | zoroastra | — | — | per | arqueros y caballería pesada |
| ara | 7 | Reinos de Arabia (Árabes) | `arabe` (politeísmo árabe preislámico) | — | `cam` jinetes de camello | per | oro ×1,15, jinetes +15%, botín 15 |
| nor | 8 | Reinos del Norte (Nórdicos) | `nordico` | m | `ber` berserkers | fra | infantería +20%, huscarles, botín 25, caballería floja |
| chi | 9 | Imperio del Centro (Chinos) | `confuciano` | — | `bal` ballesteros | ori | oro ×1,2, orden +4, alabarderos |
| inc | 10 | Imperio del Tahuantinsuyo (Incas) | `andino` | x c k m | `ore` orejones (infantería de élite) | occ | honderos +25%, orden +5, infantería barata (mita) |
| may | 11 | Señoríos mayas | `mesoamericano` | x c k m | `hol` holcanes | ori | oro ×1,1, arqueros y átlatl |
| azt | 12 | Imperio mexica (Aztecas) | `mesoamericano` | x c k m | `jag` guerreros jaguar, `agu` guerreros águila | fra | infantería +15% |
| gri | 13 | Liga Helénica (Griegos) | `olimpico` | — | `hop` hoplitas | ori | falange resistente, oro ×1,1 |
| egi | 14 | Reino del Nilo (Egipcios) | `egipcio` | — | `car` carros de guerra | per | oro ×1,2, arqueros nubios, orden +3 |
| ind | 15 | Imperio Gupta (Indios) | `hindu` | — | `ele` elefantes de guerra | per | arco largo +15%, oro ×1,15 |
| cel | 16 | Reinos celtas | `druidico` | m | `gae` gaesatae (carga desnuda) | fra | infantería +15%, honderos, orden −2 |
| esl | 17 | Tribus eslavas | `eslavo` | — | `bog` bogatyres | vis | infantería muy resistente, jabalineros |
| mon | 18 | Hordas mongolas | `tengri` | — | `m` (arqueros a caballo, ya existe: solo darlo en su repertorio) | hun | arqueros a caballo +25%, oro ×0,85, orden −4, `u0` a caballo |
| reb | 19 | Rebeldes | — | — | — | reb | |

Todos los nuevos traen `un` para las 9 clases permitidas, `tm`/`tf`, 14-16 soberanos y 12 soberanas
auténticos, `desc`, `pueblo` («el pueblo nórdico», para la crónica) y 14 nombres de provincia
(`MUNDO_PN`, el primero es la capital). Colores claros y distintos entre sí (distancia RGB mínima 44,
todos legibles sobre el panel oscuro).

**Claves de unidad única que debe crear combate** (en `UN`, con `civs: [id]`, sprite en `SP` y
habilidades de la lista del contrato): `cam` (ara, `espanto`), `ber` (nor, `berserker`),
`bal` (chi, `lluviaFlechas`), `ore` (inc), `hol` (may, `emboscada`), `jag` y `agu` (azt, `sacrificio`),
`hop` (gri, `muroEscudos`), `car` (egi, `carga`), `ele` (ind, `espanto`/`estampida`), `gae` (cel, `grito`),
`bog` (esl, `juramento`), y `m` en el repertorio de mon (`disparoParto`). Ninguna existe todavía: la
pantalla de inicio muestra «Únicas: …» en cuanto `UN[k]` exista.

## 4. Peticiones a cada sistema (contenido por pueblo nuevo)

Lo que falte cae en un respaldo razonable, pero conviene completarlo. Usad `CIV[f].id`, nunca el índice.

**Combate** (`clases.js`, `habilidades.js`, `batalla.js`)
- `CMB_CIV` es un array posicional cuyo 8.º elemento (índice 7) son los rebeldes: ahora el 7 es **ara**
  (los árabes reciben «Campesinos armados» como lanceros) y los rebeldes (19) se quedan sin entrada.
  Pasadlo a un objeto por id o poned los rebeldes en `CMB_CIV[REB]`. Igual `UN[t].civs` (calculado de CMB_CIV).
- Crear las únicas de la tabla (stats, `civs`, `hab`, sprites `SP`) y añadir repertorio (`CMB_CIV`) para los 12 nuevos.
- Respetar `CIV[f].sinTipos` en todo lo que dé tropas fuera de `cmbDisp` (el veto ya está en
  `unidadesDisponibles`) y no listar esas clases en el panel de ejército de la provincia
  (hoy los aztecas ven «0 Caballería»).
- Elefantes y camellos espantan caballos (`espanto`): las civs sin caballos son vulnerables a nada de eso.

**Campaña** (`ia.js`, `campana.js`, `mercenarios.js`)
- `CMB_DOC` (ia.js) es posicional con los rebeldes en el 7 (`CMB_DOC[f] || CMB_DOC[7]`): añadir doctrina
  por id para los nuevos (incas/mayas/aztecas sin caballería; mongoles a caballo) y para `REB`.
- Mercenarios: no ofrecer clases vetadas (`civPuede(f, t)`); en América no hay mercenarios a caballo.

**Tecnología** (`civilizaciones.js`, `tecnologia.js`)
- `TEC_CIV` solo tiene las 7: añadir eras, prioridades, edificio propio y técnicas para los 12
  (p.ej. chi: imprenta/pólvora temprana; may: calendario/escritura; inc: quipu, caminos, terrazas;
  egi: graneros del Nilo; gri: filosofía, fuego griego; ind: cifras, elefantes; nor: drakkar).
  Hoy usan las eras genéricas de respaldo.
- La línea «Recluta:» de la ciudad (`tecReclutables`) no pasa por `unidadesDisponibles` y muestra
  «Caballería» a los aztecas: filtrar con `civPuede`.
- Establo/caballería no deberían ofrecerse a quien tiene `sinTipos` con todas las montadas.

**Narrativa** (`narrativa.js`, `historia.js`)
- `NAR_PUEBLO[f]` cae en «los rebeldes» para los nuevos: usar `CIV[f].pueblo`.
- Prólogo (`NAR_PROLOGO`) por pueblo nuevo; los arcos históricos de 410 (Roma, Atila...) **solo si
  `G.modo === 'historico'`**; eventos propios de cada pueblo y del modo leyendas.
- Mensajes con «d.C.»/«el imperio se resquebraja» pensados para 410: revisar en leyendas.

**Diplomacia y social** (`diplomacia.js`, `sociedad.js`)
- `DIP_PERS[f]` (personalidad de la IA) solo para 7: añadir los 12 (mongoles y aztecas agresivos,
  chinos y griegos negociadores, árabes codiciosos...).
- `SOC_GRUPO(f)` es posicional (`f <= 1`, `f === 3`, `f === 6`): todos los nuevos caen en «ger».
  Proponer grupos: chi/egi/inc → burocracia imperial; may/azt/gri → ciudades-estado; mon → estepa (como hun);
  nor/cel/esl → tribal (como ger); ara/ind → como per.
- `SOC_CLE` / `SOC_FEN` / sumo sacerdote (`socCargo 'obi'`) para las religiones nuevas: `arabe`,
  `nordico`, `confuciano`, `andino`, `mesoamericano`, `olimpico`, `egipcio`, `hindu`, `druidico`,
  `eslavo`, `tengri`. Disputas de credo entre religiones nuevas (hoy solo niceno/arriano).

**Economía** (`economia.js`, `comercio.js`)
- Recursos y comercio con sabor por pueblo (seda y té en chi, incienso en ara, oro y plata en inc,
  cacao en may/azt, papiro y grano en egi, especias en ind, pieles y ámbar en nor/esl).
- `ecoTerreno` y similares ya usan `W`/`H` y la semilla: funcionan con mapas grandes.

**Interfaz**
- Con 19 pueblos la lista «Potencias» es larga; el mapa grande se ve pequeño al 100 % (hay zoom).

**Orquestador**
- `docs/CONTRATO.md` §2 dice aún «`REB = 7`»: ahora `REB = NF = 19` (la §8 ya lo recoge).

## 5. Pruebas

- `node pruebas/mundo.js [años=20] [--todas]`: estructura de CIV (ids, campos, colores, iconos de las
  9 clases para los 20 pueblos), modo histórico (64×40, tratados, 19 facciones con 12 ausentes), pantalla
  de inicio en escritorio y móvil, cuatro partidas de leyendas (incas+aztecas+mayas sin caballos; los
  19 pueblos; 3 pueblos; árabes con 11 rivales durante 20 años) comprobando capitales, nombres y que
  nadie sin caballos tenga jinetes, guardar/cargar una partida de leyendas y cargar la partida antigua.
  Con `--todas` ejecuta también humo (20 años), economía, tecnología, diplomacia, narrativa y combate.
- Capturas: `pruebas/capturas/mundo-*.png`.
