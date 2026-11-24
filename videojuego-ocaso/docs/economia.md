# Economía — Ocaso del Imperio

Archivos: `js/economia.js` (núcleo económico, IA de hacienda, pestaña Tesoro, sección de provincia),
`js/comercio.js` (mercado, rutas, sucesos de mercado), `css/economia.css`, `pruebas/economia.js`.
En `nucleo.js` solo se usan `TAX`, `TAXM`, `TAXO` (sin cambios de valores). Estado en `G.eco`.

## Mecánicas

**Provincias.** Cada provincia tiene una *especialidad* (Trigales, Pesquerías, Bosques madereros,
Canteras, Minas de hierro, Minas de oro, Yeguadas, Salinas, Viñedos, Talleres de seda, Puerto franco),
elegida de forma determinista con `G.seed` y la proporción de llanura/bosque/colina/litoral de
`MAP` (se guarda en `G.eco.esp`). El terreno da además producción base (bosque → madera, colina →
piedra y hierro, gran llanura → caballos).

**Población** (`G.eco.pob`, miles de almas). Crecimiento logístico hacia una capacidad
`4 + casillas·0,22 + granja·3 + mercado·1,5 (+7 capital, +2 trigales/pesca)`. Tasa base 5 %; la
frenan impuestos altos (−1,2 %), desorden (−2 %), conquista reciente, enemigos armados al lado; la
hunden el hambre (−5 %/año) y la peste (−10 %/año). Batallas −3 %, conquista −5 %.
- Impuestos = `pob · 0,38 · TAXM` (× oro de la civilización, gestión del soberano, desorden, peste).
- Comida = `2,5 + pob · 0,24 + granja·5 (+4 capital, +especialidad)`.
- *Levas* = `pob · 0,9`. Con más tropas que el 80 % de las levas, reclutar se encarece (hasta +80 %).

**Recursos** (`OC.recurso`): madera ♣, piedra ▲, hierro ⚒, caballos ♞ y lujos sal ◇, vino ⚱, seda ✦,
incienso ∴, especias ✺, ámbar ◆ y cacao ● (en `F.res`). Almacén máximo `60 + 15·provincias`. El
ejército (guarniciones y ejércitos en campaña) consume 1 hierro por 15 tropas y 1 caballo por 5
monturas con `UN[t].caballo` (camellos y elefantes no). La corte consume `⌈provincias/5⌉` de sus tres
lujos más abundantes: +2 de orden por lujo (máx. +6). Tener sal amplía el granero un 25 %. En el
Tesoro solo se muestran los lujos que tienes o produces.

**Tierras: yacimientos, fertilidad y explotaciones** (`G.eco.yac`, `G.eco.fer`, `G.eco.exp`,
`G.eco.cul` = comarca; deterministas con `G.seed` y el terreno de `MAP`; las partidas antiguas los
calculan al cargar).
- *Yacimientos* `{recurso: riqueza 1..3}`: madera (bosque), piedra (colinas), hierro (colinas, con azar),
  oro (colinas; más en los Andes incas), estaño (colinas; más en tierra celta) y sal (litoral o tierras
  áridas). Las sierras del relieve (`MAP.mont`, mapas v2) dan más piedra, hierro y oro. La especialidad
  confirma su yacimiento (riqueza ≥ 2). El río sale del cauce real (`MAP.rio`: +0,2 con 3 casillas o más,
  +0,12 con menos) o, en mapas viejos, del río por provincia de combate.
- *Fertilidad* 0..1: `0,3 + 0,4·llanura + 0,1·bosque − 0,2·colina + 0,2 río + 0,05 costa + azar`; árido
  (árabes, egipcios) −0,35 salvo con río (+0,15, el Nilo); estepa (hunos, mongoles) −0,15; China e India
  +0,1; Trigales, Nilo y Chinampas ≥ 0,75. Texto: Desierto, Estepa de pastos, Tierras yermas, pobres,
  corrientes, fértiles, muy fértiles. Efecto: comida por almas ×(0,6 + 0,8·v), granjas ×(0,7 + 0,6·v),
  capacidad de población + (v − 0,5)·6.
- *Explotaciones*: Mina (hierro, oro, estaño), Cantera (piedra), Aserradero (madera), Salinas (sal). Las
  provincias con especialidad de mina/cantera/bosque/salinas, y algunas otras con yacimiento rico (12 %, 50 %
  en capitales), empiezan con la suya a nivel 1. Producción: lo que da la tierra sola (madera y piedra
  riqueza − 1; hierro 1 con riqueza 3; sal 1 con riqueza ≥ 2) + `min(nivel, riqueza)` por explotación; la
  mina da además 2 oro por nivel en vetas de oro y 1 en estaño. Nivel efectivo = el mayor entre el
  edificio de tecnología `p.mina`/`p.cantera`/`p.aserradero`/`p.salinas` y el inicial de `G.eco.exp`.
- Sección de provincia **«Tierras»** (orden 39, también en provincias ajenas y rebeldes): fertilidad,
  producción anual con iconos, yacimientos con su riqueza (●●○) y su explotación o «sin explotar». Detrás
  de `ecoInfoVisible(p, f)` (hoy siempre cierto) para la futura niebla de guerra y espías. En el mapa, al
  pasar el ratón, se añade el recurso principal (`ecoIconoProv`).

**Pueblos y comarcas** (`ECO_CIV`, por `CIV[f].id`). Al crear la partida cada provincia pertenece a la
comarca del pueblo cuya capital queda más cerca; ahí pesan más sus especialidades y aparecen las
propias (solo en su comarca). Cada pueblo tiene al menos una especialidad «de firma» fuera de su
capital. Existencias iniciales por pueblo.

| Pueblo | Especialidades propias / favorecidas | Empieza con |
|---|---|---|
| Occidente | Olivares, viñedos, canteras | — |
| Oriente | Talleres de seda ×2, puerto franco, olivares | 4 seda |
| Visigodos / Francos | trigales, yeguadas / bosques, hierro, trigales | — |
| Hunos / Mongoles | Pastos de la estepa (+3 caballos), yeguadas ×2 | 12 / 14 caballos |
| Vándalos | puerto franco, pesquerías | — |
| Persia | seda, yeguadas, minas de oro | 4 seda |
| Árabes | Caminos del incienso (+2), Caballos árabes (+3), puerto | 6 incienso, 8 caballos |
| Nórdicos / Eslavos | Costas del ámbar (+2), Tramperos (+2 oro, +1 madera), pesca / bosques | 4 ámbar (nórdicos) |
| Chinos | Talleres de seda ×4, Talleres de laca (+3 oro) | 8 seda |
| Incas | Terrazas de cultivo (+4 comida), Rebaños de llamas (+2 comida, +2 oro), minas de oro | sin caballos |
| Mayas / Aztecas | Huertos de cacao (+2) / cacao y Chinampas (+5 comida) | 6 / 4 cacao, sin caballos |
| Griegos | Olivares, viñedos ×2, puerto | 6 vino |
| Egipcios | Graneros del Nilo (+6 comida), Papiros del delta (+3 oro), incienso | 2 incienso |
| Indios | Especierías (+2), Algodonales (+2 oro, +1 comida) | 6 especias |
| Celtas | Minas de estaño (+1 hierro, +2 oro), pesca | — |

Pueblos sin caballos (`CIV[f].sinTipos` incluye `"caballos"`): su comarca no tiene yeguadas ni
pastos, empiezan sin caballos, no los consumen, su reclutamiento no se encarece por no tenerlos y su
IA vende los que consiga. Afán comercial de la IA (`com`): árabes y griegos 1,4, Oriente 1,3; hunos
y mongoles 0,6: rutas que se amortizan en `5·com` años y compra de lujos con tesoro sobrante
`(150 + 2·ingresos)/com`.

**Balance anual** (`ecoBalance(f)`): ingresos (impuestos, mercados, capital, especialidades, rutas,
otros = modificadores de `rendimiento`) − gastos (soldada: `coste·0,025·inflación` oro por unidad;
edificios: 0,4 oro por nivel; intereses: 8 % de la deuda; **en campaña**: la soldada de los ejércitos
de `G.cam.ej`; **mercenarios**: 4 × la paga por estación de sus contratos). La comida de las tropas es
`UN[t].food` (la de los ejércitos en campaña solo si están en tierra propia, aliada o con paso).
Los mercenarios (`UN[t].merc`) no tienen soldada en `ecoMant` (oro 0): les paga su contrato.

**Quién cobra qué (una sola vez).** Campaña cobra cada estación la soldada y la comida de los
ejércitos en campaña (`camSuministros`, con `ecoMant`) y la paga de los mercenarios
(`camMercEstacion`). La economía las **muestra** en el balance anual (`inc(f).g`, `inc(f).net` y
`ecoResumen` son el saldo real previsto de todo el año) pero al cerrar el año solo cobra el resto:
`economy(f)` aplica `b.gAnual = b.g + gas.camp + gas.merc` y `b.netAnual = b.net + upCamp`.
Las deserciones por hambre, impagos y bancarrota alcanzan también a los ejércitos en campaña, y las
levas cuentan sus hombres.

**Hacienda (decisiones, una pestaña «Tesoro» · orden 35):**
- Impuestos por provincia (3 niveles de siempre, botones con su efecto).
- *Diezmo*: −10 % de impuestos, +5 de orden en todo el reino.
- *Annona*: un cuarto del tributo se cobra en grano (×1,2 en comida).
- *Recortar la ley* (una vez al año): +60 % de los ingresos brutos ahora, inflación +0,10 y −4 de
  orden. La inflación encarece soldadas, obras, reclutas y compras y resta `(infl−1)·40` de orden;
  baja sola 0,01/año. *Reacuñar*: cuesta 80 % de los ingresos, −0,10 de inflación.
- *Préstamo* de los argentarii (+50 oro, se deben 55) y *Saldar* (50 por pulsación).

**Deuda y bancarrota.** Si el oro queda negativo, los argentarii lo adelantan (deuda). Límite de
crédito = 3 × ingresos brutos. Por encima: *impagos* (deserta el 8 %, −5 orden, reclutar +20 %).
Con 3 años seguidos por encima o deuda > 1,6 × límite: *bancarrota* (se repudia el 70 %, deserta
el 20 %, −15 orden, inflación +0,10, 6 años sin crédito). La deuda resta orden (2–12).

**Graneros y hambre.** Granero = `40 + 12·provincias + 10·granjas` (×1,25 con sal); lo que sobra
se pudre. Comida negativa → hambre: deserta el 15 %, −4 % población, −10 orden 2 años. No se compra en el
mercado por encima del granero o del almacén, y al cerrar el año (`finAnio`) se recorta lo que sobre.

**Peste.** 5 %/año de brote en una provincia poblada; dura 2 años, se contagia (15 %) a vecinas;
inmunidad 12 años. −15 % comida, −20 % oro, −8 orden, −10 % población al año.

**Revueltas.** Igual que antes (orden < 20, 35 %), con bagaudas proporcionales a la población.

**Ánimo del pueblo** (sobre `p.order`). El orden se acerca ±8/año al *orden objetivo*
(`ordTarget`) = 55 + causas visibles + modificadores de otros sistemas (`OC.calc('ordenObjetivo')`).

| Ánimo | Orden | Oro | Comida | Crec. | Levas | Guarnición |
|---|---|---|---|---|---|---|
| ✖ Furioso | < 15 | ×0,4 | ×0,7 | −3 % | ×0,3 | deserta 10 %/año |
| ☹ Disgustado | 15–29 | ×0,6 | ×0,85 | −1,5 % | ×0,6 | deserta 4 %/año |
| ! Inquieto | 30–44 | ×0,85 | — | −0,5 % | ×0,8 | |
| ○ Neutral | 45–59 | — | — | — | ×0,9 | |
| ☺ Contento | 60–74 | ×1,05 | — | +0,4 % | ×0,95 | |
| ✿ Feliz | 75–89 | ×1,1 | ×1,05 | +0,8 % | ×1 | |
| ★ Leal | ≥ 90 | ×1,15 | ×1,05 | +1 % | ×1,1 | |

(Antes: oro ×0,5 por debajo de 35 de orden.) Causas propias: impuestos (+12/0/−20), templo (+12/nivel),
costumbres del pueblo, guarnición ≥ 6 (+6), soberano piadoso +5 / justo +3 / cruel −3, regencia −10,
conquista reciente −25, diezmo +5, lujos +2 c/u, graneros llenos (≥ 60 %) +3, hambre −10, moneda
devaluada, deudas, peste −8, enemigos armados en la frontera −4 (no bagaudas), batallas en los dos
últimos años −6, hacinamiento −4 y los efectos de las decisiones. Lo que suman los modificadores
ajenos se agrupa por sistema («Corte y estamentos», «Técnicas y edificios», «Sucesos», «Otros»), y la
fe de la provincia distinta del soberano (de sociedad, `socFe`) se muestra aparte.

*Decisiones de ciudad* (sección de provincia; enfriamiento en años):

| Decisión | Disponible | Coste | Efecto | Espera |
|---|---|---|---|---|
| Juegos y fiestas | siempre | 8 + almas oro | +10 ánimo 3 años, +5 orden ya | 4 |
| Reparto de grano | siempre | 10 + 0,8·almas comida | +8 ánimo 2 años, +4 ya, +2 % almas | 3 |
| Escuchar a los notables | orden < 60 | 15 oro | +6 ánimo 3 años, +3 ya | 3 |
| Condonar tributos | orden < 75 | — | sin impuestos 1 año, +12 ánimo 2 años | 5 |
| Negociar con los descontentos | < 30 | 10 oro | impuestos bajos, +15 ánimo 3 años | 5 |
| Castigar a los cabecillas | < 30, ≥ 2 tropas | — | +12 orden ya, −5 ánimo 3 años, −2 % almas | 4 |
| Ley marcial | < 45, ≥ 3 tropas | — | +20 orden ya, −8 ánimo 4 años, −5 % almas | 5 |
| Exención para colonos | ≥ 30, almas < 85 % cap. | 20 oro | +8 % almas, +4 ánimo, ½ impuestos 3 años | 8 |

Si un 35 % de las ciudades (mín. 2) están Disgustadas o peor: `crisisEconomica {tipo:'descontento'}`
(como mucho cada 3 años). La IA toma hasta 2 decisiones al año en sus ciudades por debajo de 42 de
orden que no mejoran solas (con < 22 prefiere negociar o la ley marcial), sin bajar de 15 de oro ni
vaciar el granero. El ánimo se ve en la sección de provincia (causas plegables y decisiones), en el
Tesoro (recuento y las tres peores, con botón para ir a ellas) y en la línea de información del mapa.

**Comercio** (`comercio.js`).
- *Mercado común* de comida y los 7 recursos. Precio = `base · (s0/existencias)^0,6` (×0,45–×2,6).
  Lotes de 5 (comida 10); comprar = precio·1,12·inflación, vender = precio·0,88. Cada año las
  existencias vuelven un 30 % hacia el equilibrio con algo de azar.
- *Rutas*: desde una provincia propia a otra propia o de un reino en paz con relación ≥ 10 (sin
  bagaudas, distancia ≥ 4, máx. 2 por provincia). Huecos = `1 + mercados/2 + puertos francos` (máx. 6).
  Coste 30 / 45 oro (extranjera). Rinde `1 + dist·0,06 + mercados·0,6 (+1,5 especialidades distintas,
  +1 marítima, +1,5 por puerto franco)`, ×1,25 si es extranjera; el socio gana el 40 % y ambos
  intercambian 1 unidad/año del bien de la especialidad del otro extremo. +1 de relación al año entre
  socios. La guerra (o perder la provincia) corta la ruta.
- *Sucesos de mercado* (30 %/año): caravana de seda, vendimia, salinas, sequía, forjas vacías,
  muermo, basílicas, piratas (rutas marítimas ½, 2 años), ferias (rutas +25 %).

**IA** (`economiaFaccion` y `turnoIA`, solo facciones no humanas): paga deudas, activa diezmo con
orden bajo y annona con hambre, recorta la ley si la deuda aprieta y reacuña si es rica, compra
grano ante el hambre, vende excedentes sin malvender (precio ≥ 70 % de la base), repone hierro y
caballos, abre la mejor ruta que se pague en ≤ 5 años y licencia tropas de retaguardia si el déficit
es crónico. Impuestos: el nivel más alto que mantenga el orden objetivo ≥ 45 (38 con deuda); con el
tesoro rebosante, los baja.

## API para otros sistemas

- `inc(f)` → `{g, fo, up, net, gi, gg, res}`. **`g` es el saldo neto de oro del año** (ingresos −
  gastos, puede ser negativo, incluye ejércitos en campaña y mercenarios); `gi` ingresos brutos, `gg`
  gastos; `net = fo − up` comida (con las raciones de los ejércitos en tierra propia).
- `ecoResumen(f)` → `[{id, nombre, icono, saldo, anual}]` para cada recurso de `OC.recursos`
  (oro y comida incluidos). Pensado para la barra superior.
- `ecoFiscal(f)` → `{deuda, limite, inflacion, granero, poblacion, levas, tropas}`.
- `ecoBalance(f)` → desglose completo (`ing`, `gas` con `tro, edi, int, camp, merc`, `upCamp`,
  `gAnual`/`netAnual` = lo que cobra la economía al cerrar el año, `prod`, `cons`, `res`, `granero`...).
- `ecoTropasDe(f)` hombres en armas (guarniciones + ejércitos, sin máquinas); `ecoEjercitos(f)`.
- `ecoSaqueo(p, fracción = 0,02, orden = 6)` → botín sugerido (`2 + 0,45·almas`): resta población y
  orden y deja la marca de «Saqueos y batallas» en el ánimo. `ecoSaqueada(p)` lee también `G.cam.saq`.
- `ECO_CIV[id]`, `ecoCiv(f)`, `ecoSinCaballos(f)`, `ecoCapitales()`.
- `ecoYac(p)` → `{madera, piedra, hierro, oro, estano, sal: riqueza 1..3}` (solo los que hay);
  `ecoFertil(p)` → `{v: 0..1, txt}`; `ecoExplotaciones(p)` → `{mina, cantera, aserradero, salinas: nivel}`;
  `ecoNivelExp(p, k)`; `ECO_YAC`, `ECO_EXP`.
- `ecoInfoVisible(p, f)` → hoy `true`: el día que haya niebla de guerra o espías, la sección «Tierras» y
  el icono del mapa se ocultan con solo cambiar esta función.
- `ecoIconoProv(p)` → `{id, icono, nombre}` del recurso principal (por valor de mercado), «Grano» si las
  tierras son fértiles y no saca otra cosa, o `null`.
- `ecoPob(p)`, `ecoEspecialidad(p)` → `{id, n, d, y}`, `ecoCapacidad(p)`, `ecoDiezmar(p, fracción)`.
- `comPrecio(id)`, `comComprar(f,id)`, `comVender(f,id)`, `comDe(f)` (rutas de f), `G.eco.rutas`.
- `ecoAnimo(p)` → `{id, nombre, icono, color, orden, objetivo, tendencia, causas:[{texto, valor}]}`;
  `ecoNivel(p)` → fila de `ECO_ANIMO` (rápido, sin causas).
- `ecoApoyoAsedio(p, sitiador?)` → −1 (abriría las puertas) … +1 (resiste): `(orden−50)/50`, +0,2 Leal,
  +0,1 Feliz, −0,2 con hambre, −0,1 con peste; si se da el sitiador: −0,3 si era su tierra (`p.home`),
  −0,2 si la provincia comparte su fe y no la del dueño. Para el futuro sistema de asedios.
- `ecoDecision(f, p, k)` / `ecoPuedeDecidir(f, p, k)` con `k` en `ECO_DEC` (también para narrativa).
- Consume caballos la clase con `UN[t].caballo` (sin ese campo ni `rol`: `montada`/`mv ≥ 4`).

## Ganchos

- Llama: `rendimiento` (`{g, fo}` + un campo por recurso de `ECO_RES`, ctx `{p,f}`),
  `ordenObjetivo` (ctx `{p,f}`), `mantenimientoTropa` (`{comida, oro}`, ctx `{f,t}`, por cada clase de
  `p.u` y de los ejércitos de `G.cam.ej`).
- Emite: `revuelta` `{p, de}`; `crisisEconomica` `{f, tipo, ...}` con `tipo` = `hambre`
  (`perdidas`), `impagos` (`perdidas`), `bancarrota` (`perdidas`), `peste` (`p`), `inflacion` (`inflacion`),
  `descontento` (`ciudades`).
- Modifica: `costeUnidad` (inflación, hierro ≥10 −8 % / sin hierro +12 %, caballos ≥6 −12 % / sin
  caballos +20 % salvo pueblos sin caballos, levas agotadas, impagos +20 %), `costeConstruccion` (oro × inflación).
- Ánimo: «Ciudad sitiada» −5 si hay cerco en `G.cam.as[p]`; «Saqueos y batallas» −6 con batalla o
  saqueo (también los de campaña) este año o el anterior.
- Escucha: `partidaLista`, `antesFinAnio` (peste, mercado, rutas), `economiaFaccion` y `turnoIA`
  (IA), `batallaResuelta` y `conquista` (población, rutas), `guerraDeclarada` (corta rutas).
- Acciones: `tax`, `eco` (diezmo, annona, recorte, reacunar, prestamo, saldar), `ecov` (libre,
  subpestaña), `mer` (`c:id` / `v:id`), `ruta` (`nueva`, `hasta:p`, `cortar:i`), `eca` (`k:p`,
  decisión de ciudad), `ecoir` (libre, ir a una provincia).
- Secciones de provincia: `animo` (38) e `impuestos` (40). Estado nuevo: `G.eco.efe` (efectos
  temporales), `G.eco.dec` (esperas), `G.eco.saq` (último año de batalla por provincia).
- El hover del mapa se amplía con un `mousemove` en `document` que añade el ánimo al texto de `#hv`
  después de que lo escriba la interfaz (sin tocar `interfaz.js`).

Probado junto a tecnología (commit 1ffc8c6): sus obras piden 4·n de madera/piedra/hierro (o 3 de oro por
unidad que falte), sus técnicas modifican `mantenimientoTropa` y `rendimiento` (aparecen como «Otros»),
y el mantenimiento de 0,4 oro/nivel se aplica a las 11 claves de `BLD`. La IA de economía corre en
`economiaFaccion` antes que la de tecnología (orden de carga) y guarda 25 de cada material para obras.

Partidas antiguas: `ecoE()` crea `G.eco` (especialidades, población, mercado) y existencias
iniciales en `F.res` si faltan. Probado con `pruebas/economia.js`.

## Peticiones al orquestador

1. **Interfaz**: mostrar los recursos en la barra superior con `ecoResumen(ME)`. Con 5 o más pestañas
   la rejilla de 4 columnas deja pestañas sueltas en otra fila.
2. **Combate** (`ia.js`): fija `p.tax` cada año; economía lo afina después en `turnoIA`. Se puede
   quitar esa línea de `ai()`. Si la IA recluta, conviene que deje una reserva de oro para la soldada.
3. **Diplomacia**: emitir `guerraDeclarada` en todos los caminos (corta rutas al instante). Los
   tributos entre reinos (p.ej. foederati) se pueden hacer con `OC.pagar/OC.ganar`; las rutas
   (`G.eco.rutas`) pueden pesar en `aceptacionDiplomatica`.
4. **Tecnología**: ids de recurso `madera`, `piedra`, `hierro`, `caballos`, `sal`, `vino`, `seda`
   (ya encajan). Los edificios cuestan 0,4 oro/nivel/año. Su edificio «Puerto» y mi especialidad
   «Puerto franco» conviven; si se quiere, el Puerto podría sumar huecos de ruta (`comMax`).
   `pruebas/tecnologia.js` falla a veces porque un modal de sucesión tapa un clic (no es de economía).
5. **Contrato**: añadir `descontento` a los `tipo` de `crisisEconomica`, la sección `animo` (38) y
   `ecoAnimo`/`ecoApoyoAsedio` a las notas de integración.
6. **Sociedad**: la penalización de fe por provincia va dentro de su modificador de `ordenObjetivo`;
   el panel la separa leyendo `socFe`/`socF().pol`. Si cambia esa fórmula, conviene exponer
   `socOrdenFe(p)` para no duplicarla. Las guerras civiles pasan provincias a `REB`: pueden emitir
   `revuelta` (economía ya recorta graneros y efectos al recibirla).
7. **Interfaz**: (hecho por la interfaz: el ánimo del hover ya usa `ecoNivel`; retiré mi añadido del ánimo).
8. **Combate/asedios**: usar `ecoApoyoAsedio(p, atacante)` para rendiciones o puertas abiertas.
9. **Campaña** (no hace falta cambiar el cobro: lo sigue haciendo campaña, una sola vez):
   - `camSuministros` ya usa `ecoMant`, que ahora da **0 de oro a los mercenarios** (cobran su contrato
     en `camMercEstacion`): así dejan de pagar soldada dos veces.
   - Saqueo de los campamentos: sustituir el bloque de `ecoDiezmar` + `p.order −= 6` por
     `const botin = ecoSaqueo(p)` para que el ánimo recuerde el saqueo (hoy lo leo de `G.cam.saq`).
   - Alternativa, si se prefiere un cobro anual: borrar en `camSuministros` las líneas `F.gold -=
     Math.round(oro)` y `F.food -= Math.round(comida)` (dejando que los víveres se repongan en tierra
     propia) y en `camMercEstacion` el `OC.pagar` (dejando el conteo de impagos con `F.gold < 0`);
     entonces economía cambiaría `b.gAnual` por `b.g` en `economy()` (una línea). No lo recomiendo:
     el cobro por estación castiga bien las campañas largas.
   - `ecoDesercion` (hambre, impagos, bancarrota) ya quita hombres de `G.cam.ej[].u`.
10. **Mundo**: `pruebas/mundo.js` falla a veces (también sin mis cambios, 1 de cada 3 en la base):
    «se juegan 20 años (año 427-428)» porque un cerco a una ciudad del jugador hace que «Fin» avance
    una sola estación; y «Incas en Cuzco: c2» (jinetes de los incas en 412-413) viene de otro sistema.
11. **Tecnología**: crear los edificios **Mina** (`p.mina`), **Cantera** (`p.cantera`), **Aserradero**
    (`p.aserradero`) y **Salinas** (`p.salinas`) en `BLD` con esas claves (si se prefieren otras, decídmelo
    y cambio `ECO_EXP`). Economía ya los lee (`ecoNivelExp`): cada nivel saca una unidad más del yacimiento,
    sin pasar de su riqueza, así que conviene permitirlos solo donde `ecoYac(p)[recurso] > 0` (mina: hierro,
    oro o estaño) y con máximo 3. En `partidaLista`, poner `p[k] = Math.max(p[k] || 0, ecoNivelExp(p, k))`
    para que las explotaciones iniciales aparezcan como edificios; su mantenimiento (0,4 oro/nivel) entra solo
    al estar en `BLD`.
12. **Interfaz**: dibujar `ecoIconoProv(p)` como icono pequeño sobre cada provincia del mapa (si
    `ecoInfoVisible(p, ME)`), y en `ifzResumenSec` para la sección `tierras` mostrar `ecoFertil(p).txt` y el
    icono. El oyente `document.mousemove` de economía ya no añade el ánimo (lo pone la interfaz): solo el
    recurso principal; si la interfaz lo pone en `ifzHoverTxt`, se puede retirar.
