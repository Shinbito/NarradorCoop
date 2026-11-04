## Misiones del rol en Riverside: la despensa, Eli Danner y el chico de los sacos (falta probar en el juego)
Tres misiones del Padre Nacho que salieron del rol de los personajes (`personajes/fichas`: nacho, lucia, duggan,
reyes, pereira, yvonne_bell y CANON). Prueba de punta a punta: `herramientas/pruebas/prueba_riverside.lua`.

- **La despensa** (dentro de `cap_nacho_2`, Arcos/Capitulos.lua). Cuando Duggan llega al atrio, pregunta por
  Curtis Mabry ("ese siempre mira") y Lazaro se va ladrando a la despensa. El Padre lo sabe por la rejilla (un
  hombre de Duggan se confeso) y no lo puede decir: solo pide que alguien mire la pelea. Etapa nueva
  `despensa_aviso` con dos opciones (si no eliges en media hora, empieza la pelea):
  - Mirar (`round`, como antes): Ruth descubre la despensa forzada; el Padre lo agradece ("tuve testigo").
    `despensa_riverside` = robada y la reserva de comida de Riverside baja 25 (accion nueva
    `{ "reserva_campamento", contacto, moneda, cantidad }` en NarradorCampamentos.lua, de 0 a 100).
  - Ir a la despensa (`despensa`, 14 casillas atras de la iglesia): Curtis (amistoso, pillado con los sacos) y 2-3
    ladrones hostiles. Caidos los ladrones se habla con Curtis: llevarlo a cargar agua para la iglesia (queda de
    guardia, `salvado_campamento`) o echarlo de Riverside; si lo matas, el Padre lo resiente ("al que esta en el
    suelo se le da la mano o un balde, no una tumba"). Al volver, Duggan: "Llegas tarde. Igual que el arbitro de
    Lexington, pero al reves", y el Padre te cuenta la pelea (sorteo `ganador`) y te reprocha un poco no haber
    mirado, pero lo entiende ("yo no te lo podia pedir"). Final nuevo `final_cumplido_despensa`:
    `despensa_riverside` = defendida, `curtis` = agua, echado o muerto.
  - Partidas a medio camino: si ya iban en `round`, la variable `despensa` no existe y el final es el de siempre
    (sin memoria). Las que estaban en `pelea` pasan por la etapa nueva.
- **Eli Danner** (`mision_eli`, Arcos/MisionesRiverside.lua). Sale entre las ofertas del Padre despues del cap. 2
  y antes del 3 (confianza 3, pago medio). El Padre lo supo por Edith Crowe: el Diacono Reyes predico en el puente
  (Numeros 32:23) que tres de la Sargento bajan a San Judas, en March Ridge, a "corregir la lista" (Eli, 16, Reo,
  anotado muerto por Pereira). Hay un dia y medio (reloj `patio`). A tiempo: Lucia (inmortal en esta mision) te
  recibe ("le dije que no mandara a nadie"), suben tres del patio (hostiles, mas una horda chica por los tiros); si
  Eli vive, se elige: que se quede con Lucia cuidando la puerta (`eli_danner` = salvado, se vuelve a contarle al
  Padre) o llevarlo a Riverside (`riverside`, queda de guardia en la iglesia). Si Eli muere, `muerto`. Si llegas
  despues del dia y medio (papel clavado: "Lista corregida"), no vas en 96 horas o la abandonas: `tarde`.
  Deja tambien `lugar.san_judas` (memoria_lugar).
- **El chico de los sacos** (`mision_tomas`, Arcos/MisionesRiverside.lua). Sale despues del cap. 3 y antes del 4
  (confianza 3, pago dificil), con Lucia viva o muerta. Panaderia Hollis de Riverside (cerrada con llave desde el
  10 de julio; la llave la tiene Yvonne): el casillero de Tom con el horario del Greyhound, la salida de las 5:40
  del sabado marcada, y la direccion de las hermanas de Santa Ines. Despues la terminal del Greyhound de Louisville
  (sala bus*/transit*, si no una oficina del centro): un cuaderno ("me quedo aca: aca llegan los buses") y Tomas
  vivo, rodeado (horda de 30 +10 por jugador y corredores). Se va solo a Riverside; si Lucia volvio, sale a la
  escalera ("tenias razon, yo tambien me fui un domingo"); si murio, el Padre lo lleva a su tumba. `tomas` = vivo
  (queda de guardia en la iglesia), `tumba` (muere en el camino: cruz con nombre), `sin_rastro` (no vas a la
  terminal en 120 horas o la abandonas).
- Lanzamiento: las misiones van en `G.ESPECIALES` sin `capitulo` y con su propia memoria en `hecho`, antes del
  capitulo que las lee (G.ofertaEspecial da la primera que calza: el Padre ofrece primero la mision). Ahora
  `G.ofertaEspecial` tambien mira la condicion `si` de la definicion (mision_eli: no despues del cap. 3). Todas
  tienen `final_abandonado` (abandonar deja la memoria y no traba el capitulo siguiente).
- Lo que leen despues:
  - Cap. 3 (`cap_nacho_3`): Lucia vive en San Judas de March Ridge (CANON): ya no se sortea entre cinco pueblos;
    vuelve a `lugar.san_judas` o la busca en March Ridge. Lee `eli_danner` (`vars_desde_memoria`): lo que dice el
    Padre, como te saluda Lucia y su respuesta a la carta (ahora la carta N.P.: "aqui me quedo, venga o no venga;
    el pulgar afuera"); con Eli salvado o en Riverside, Lucia baja por la cuerda a recibirte sin esperar a que
    limpies. Partidas que ya iban por el capitulo conservan su iglesia y los textos de antes.
  - Cap. 4 (`cap_nacho_4`): el Padre comenta la despensa (flaca o con porotos para todos) y a Tomas; en la misa
    Tomas entra y se sienta en la primera fila (con su hermana o en su lugar), o el Padre lee su nombre con cruz, o
    Lucia sigue cantando su recado; Curtis deja dos baldes al fondo; con la despensa robada, seis latas en el
    tercer escalon (las de Duggan, que nadie admite).
- "Los que ya no estan": Curtis Mabry, Eli Danner y Tomas Ferrada. Diario: NarradorLoreCapitulos.lua (cap. 2 y 3)
  y NarradorLoreRiverside.lua (las dos misiones).
- Canon unificado: el chico de los Salinas (bandido_3) se llamaba Tomasito; pasa a **Pablito Salinas** (Bandido.lua,
  NarradorLoreBandido.lua, NarradorCaidosDefs.lua; `Motor.NOMBRES_NUEVOS` lo cambia en partidas guardadas). Esas
  eran las unicas referencias a "Tomas" en el codigo y no eran Tomas Ferrada.
- Herramientas: `memorias.py` (despensa_riverside, curtis, eli_danner, lugar.san_judas, tomas);
  `escaner_memorias.py` y `mapa_historias.py` leen las misiones de G.ESPECIALES (sin capitulo) y el mapa saca los
  cortes de un `{ "no", ... }` en la condicion `si`; `prueba_capitulos.lua` deja fuera de la cadena de capitulos a
  las entradas sin `capitulo` (y espera la mision de Tomas antes del cap. 4).
