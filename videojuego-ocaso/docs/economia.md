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
- Una clase de `UN` con `montada: true` (o `mv ≥ 4`) cuenta como caballería (caballos).

## Ganchos

- Llama: `rendimiento` (`{g, fo, madera, piedra, hierro, caballos, sal, vino, seda}`, ctx `{p,f}`),
  `ordenObjetivo` (ctx `{p,f}`), `mantenimientoTropa` (`{comida, oro}`, ctx `{f,t}`, por cada clase de `p.u`).
- Emite: `revuelta` `{p, de}`; `crisisEconomica` `{f, tipo, ...}` con `tipo` = `hambre`
  (`perdidas`), `impagos` (`perdidas`), `bancarrota` (`perdidas`), `peste` (`p`), `inflacion` (`inflacion`).
- Modifica: `costeUnidad` (inflación, hierro ≥10 −8 % / sin hierro +12 %, caballos ≥6 −12 % / sin
  caballos +20 %, levas agotadas, impagos +20 %), `costeConstruccion` (oro × inflación).
- Escucha: `partidaLista`, `antesFinAnio` (peste, mercado, rutas), `economiaFaccion` y `turnoIA`
  (IA), `batallaResuelta` y `conquista` (población, rutas), `guerraDeclarada` (corta rutas).
- Acciones: `tax`, `eco` (diezmo, annona, recorte, reacunar, prestamo, saldar), `ecov` (libre,
  subpestaña), `mer` (`c:id` / `v:id`), `ruta` (`nueva`, `hasta:p`, `cortar:i`).

Probado junto a tecnología (commit 1ffc8c6): sus obras piden 4·n de madera/piedra/hierro (o 3 de oro por
unidad que falte), sus técnicas modifican `mantenimientoTropa` y `rendimiento` (aparecen como «Otros»),
y el mantenimiento de 0,4 oro/nivel se aplica a las 11 claves de `BLD`. La IA de economía corre en
`economiaFaccion` antes que la de tecnología (orden de carga) y guarda 25 de cada material para obras.

Partidas antiguas: `ecoE()` crea `G.eco` (especialidades, población, mercado) y existencias
iniciales en `F.res` si faltan. Probado con `pruebas/economia.js`.

## Peticiones al orquestador

1. **Interfaz**: la barra superior pinta `+${e.g}`; como `g` ya es neto puede salir «+-5». Usar el
   signo real, y mostrar los recursos con `ecoResumen(ME)`. Con 5 pestañas la rejilla de 4 columnas
   deja «Crónica» sola en otra fila.
2. **Combate** (`ia.js`): fija `p.tax` cada año; economía lo afina después en `turnoIA`. Se puede
   quitar esa línea de `ai()`. Si la IA recluta, conviene que deje una reserva de oro para la soldada.
3. **Diplomacia**: emitir `guerraDeclarada` en todos los caminos (corta rutas al instante). Los
   tributos entre reinos (p.ej. foederati) se pueden hacer con `OC.pagar/OC.ganar`; las rutas
   (`G.eco.rutas`) pueden pesar en `aceptacionDiplomatica`.
4. **Tecnología**: ids de recurso `madera`, `piedra`, `hierro`, `caballos`, `sal`, `vino`, `seda`
   (ya encajan). Los edificios cuestan 0,4 oro/nivel/año. Su edificio «Puerto» y mi especialidad
   «Puerto franco» conviven; si se quiere, el Puerto podría sumar huecos de ruta (`comMax`).
   `pruebas/tecnologia.js` falla a veces porque un modal de sucesión tapa un clic (no es de economía).
5. **Contrato**: anotar los `tipo` de `crisisEconomica` y que `inc(f).g` es saldo neto.
