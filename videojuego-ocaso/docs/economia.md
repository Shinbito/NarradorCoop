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

**Recursos** (`OC.recurso`): madera ♣, piedra ▲, hierro ⚒, caballos ♞ y lujos sal ◇, vino ⚱, seda ✦
(en `F.res`). Almacén máximo `60 + 15·provincias`. El ejército consume 1 hierro por 15 tropas y 1
caballo por 5 jinetes al año. La corte consume `⌈provincias/5⌉` de cada lujo si lo tiene: +2 de
orden por lujo (máx. +6). Tener sal amplía el granero un 25 %.

**Balance anual** (`ecoBalance(f)`): ingresos (impuestos, mercados, capital, especialidades, rutas,
otros = modificadores de `rendimiento`) − gastos (soldada: `coste·0,025·inflación` oro por unidad;
edificios: 0,4 oro por nivel; intereses: 8 % de la deuda). La comida de las tropas es `UN[t].food`.

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
se pudre. Comida negativa → hambre: deserta el 15 %, −4 % población, −10 orden 2 años.

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

- `inc(f)` → `{g, fo, up, net, gi, gg, res}`. **`g` es ahora el saldo neto de oro** (ingresos −
  gastos, puede ser negativo); `gi` ingresos brutos, `gg` gastos; `net = fo − up` comida.
- `ecoResumen(f)` → `[{id, nombre, icono, saldo, anual}]` para cada recurso de `OC.recursos`
  (oro y comida incluidos). Pensado para la barra superior.
- `ecoFiscal(f)` → `{deuda, limite, inflacion, granero, poblacion, levas, tropas}`.
- `ecoBalance(f)` → desglose completo (`ing`, `gas`, `prod`, `cons`, `res`, `granero`...).
- `ecoPob(p)`, `ecoEspecialidad(p)` → `{id, n, d, y}`, `ecoCapacidad(p)`, `ecoDiezmar(p, fracción)`.
- `comPrecio(id)`, `comComprar(f,id)`, `comVender(f,id)`, `comDe(f)` (rutas de f), `G.eco.rutas`.
- `ecoAnimo(p)` → `{id, nombre, icono, color, orden, objetivo, tendencia, causas:[{texto, valor}]}`;
  `ecoNivel(p)` → fila de `ECO_ANIMO` (rápido, sin causas).
- `ecoApoyoAsedio(p, sitiador?)` → −1 (abriría las puertas) … +1 (resiste): `(orden−50)/50`, +0,2 Leal,
  +0,1 Feliz, −0,2 con hambre, −0,1 con peste; si se da el sitiador: −0,3 si era su tierra (`p.home`),
  −0,2 si la provincia comparte su fe y no la del dueño. Para el futuro sistema de asedios.
- `ecoDecision(f, p, k)` / `ecoPuedeDecidir(f, p, k)` con `k` en `ECO_DEC` (también para narrativa).
- Una clase de `UN` con `montada: true` (o `mv ≥ 4`) cuenta como caballería (caballos).

## Ganchos

- Llama: `rendimiento` (`{g, fo, madera, piedra, hierro, caballos, sal, vino, seda}`, ctx `{p,f}`),
  `ordenObjetivo` (ctx `{p,f}`), `mantenimientoTropa` (`{comida, oro}`, ctx `{f,t}`, por cada clase de `p.u`).
- Emite: `revuelta` `{p, de}`; `crisisEconomica` `{f, tipo, ...}` con `tipo` = `hambre`
  (`perdidas`), `impagos` (`perdidas`), `bancarrota` (`perdidas`), `peste` (`p`), `inflacion` (`inflacion`),
  `descontento` (`ciudades`).
- Modifica: `costeUnidad` (inflación, hierro ≥10 −8 % / sin hierro +12 %, caballos ≥6 −12 % / sin
  caballos +20 %, levas agotadas, impagos +20 %), `costeConstruccion` (oro × inflación).
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
7. **Interfaz**: el hover del mapa podría usar `ecoNivel(p)` directamente en lugar de mi añadido.
8. **Combate/asedios**: usar `ecoApoyoAsedio(p, atacante)` para rendiciones o puertas abiertas.
