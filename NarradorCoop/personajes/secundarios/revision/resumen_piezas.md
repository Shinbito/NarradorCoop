# Revision de piezas: resumen (arreglos_P)

Diez lotes, 919 piezas. Un jugador conoce 30 a 50 vecinos en un pueblo: un motivo que sale en 9 piezas de la misma etapa le aparece varias veces. Criterio: un hecho publico grande queda en 3 o 4 piezas por etapa como maximo, contado desde angulos distintos; un motivo chico, en 2; un secreto, en 2 con detalle distinto. Los lazos con el reparto no se borran: se mueven a otro personaje o a otro hecho publico de su ficha.

Las tablas se calcularon con `_trabajo/genera.py` (regex sobre los textos; el "despues" cuenta las piezas que se quedan, las partes que se quedan de las piezas parciales y la propuesta nueva). Las propuestas nuevas se pueden recontar despues de reescribir.

## Cuantas piezas cambian por lote

| Lote | Piezas | Cambian | Enteras | Solo una parte |
|---|---|---|---|---|
| 01 | 98 | 25 | 23 | 2 |
| 02 | 98 | 25 | 23 | 2 |
| 03 | 89 | 24 | 22 | 2 |
| 04 | 77 | 24 | 20 | 4 |
| 05 | 87 | 22 | 21 | 1 |
| 06 | 97 | 24 | 20 | 4 |
| 07 | 90 | 23 | 22 | 1 |
| 08 | 91 | 24 | 17 | 7 |
| 09 | 97 | 23 | 18 | 5 |
| 10 | 95 | 24 | 21 | 3 |
| Total | 919 | 238 | 207 | 31 |

Por etapa: origen 21, infancia 17, juventud 22, adultez 33, vejez 12, oficio 33, primera_noche 35, despues 22, secreto 13, deseo 9, voz 21.

## Motivos: antes y despues

| Motivo | Antes | Despues | Tope por etapa |
|---|---|---|---|
| Megafono de Pereira en la comisaria | 10 (10 lotes; primera_noche 10) | 3 (primera_noche 3) | 3 |
| Calle Main de West Point ardiendo | 10 (10 lotes; primera_noche 10) | 3 (primera_noche 3) | 3 |
| Tonico de Hartmann | 11 (10 lotes; infancia 3, adultez 5, vejez 2, oficio 1) | 9 (infancia 2, adultez 3, vejez 1, oficio 2, primera_noche 1) | 3 |
| Spiffo's de Julio | 11 (10 lotes; juventud 3, adultez 3, oficio 4, primera_noche 1) | 8 (juventud 2, adultez 2, vejez 1, oficio 2, primera_noche 1) | 3 |
| Camisa celeste / seguros de Daniel Bell | 10 (10 lotes; adultez 10) | 5 (juventud 1, adultez 2, oficio 1, secreto 1) | 2 |
| Guantes de Oro del 79 (Nacho vs Duggan) | 9 (9 lotes; infancia 1, juventud 8) | 4 (infancia 1, juventud 3) | 3 |
| Canal 19 / CB | 29 (10 lotes; juventud 1, adultez 3, vejez 1, oficio 8, primera_noche 5, despues 6, secreto 1, deseo 2, voz 2) | 21 (juventud 1, adultez 3, vejez 1, oficio 4, primera_noche 4, despues 4, secreto 1, deseo 1, voz 2) | 4 |
| Bencinita | 9 (8 lotes; adultez 1, oficio 5, primera_noche 1, despues 2) | 5 (adultez 1, oficio 2, primera_noche 1, despues 1) | 3 |
| Gordo Ruta / camionero gordo | 16 (9 lotes; infancia 2, juventud 1, adultez 3, vejez 2, oficio 5, secreto 1, deseo 2) | 10 (infancia 1, juventud 1, adultez 3, vejez 2, oficio 1, secreto 1, deseo 1) | 3 |
| Tecolote | 7 (7 lotes; adultez 1, oficio 3, despues 3) | 6 (juventud 1, adultez 1, oficio 2, despues 2) | 3 |
| "Lleno o normal" de Rosa | 16 (10 lotes; adultez 5, vejez 3, oficio 3, deseo 4, voz 1) | 8 (adultez 3, vejez 1, oficio 1, deseo 2, voz 1) | 3 |
| Luz de la gasolinera de Rosa (primera noche) | 7 (7 lotes; primera_noche 7) | 3 (primera_noche 3) | 3 |
| Panaderia Hollis | 13 (10 lotes; infancia 3, adultez 5, oficio 4, deseo 1) | 12 (infancia 2, adultez 4, oficio 3, primera_noche 2, deseo 1) | 3 |
| Radio de Eduardo los domingos | 11 (9 lotes; oficio 1, despues 9, secreto 1) | 5 (oficio 1, despues 3, secreto 1) | 3 |
| No saber leer (secreto) | 5 (5 lotes; secreto 5) | 2 (secreto 2) | 2 |
| Libreta / censo del Cabo | 11 (8 lotes; oficio 2, despues 3, secreto 5, deseo 1) | 7 (oficio 1, despues 2, secreto 3, deseo 1) | 3 |
| Raciones de muertos en la libreta del Cabo (secreto) | 3 (3 lotes; secreto 3) | 2 (secreto 2) | 2 |
| Barricada de la 31 (primera noche) | 7 (6 lotes; primera_noche 7) | 6 (primera_noche 6) | 3 |
| Carpa del predicador (Reyes) | 7 (7 lotes; infancia 1, juventud 1, adultez 1, oficio 3, primera_noche 1) | 7 (infancia 1, juventud 1, adultez 2, oficio 2, primera_noche 1) | 2 |
| Petardos / fuegos artificiales de Kell | 6 (6 lotes; infancia 1, juventud 4, despues 1) | 6 (infancia 1, juventud 2, oficio 1, despues 1, deseo 1) | 2 |
| San Judas y la monja de los recados | 8 (8 lotes; despues 6, deseo 2) | 5 (despues 3, deseo 2) | 3 |
| Vulcanizacion de Ekron | 5 (5 lotes; oficio 5) | 2 (oficio 2) | 2 |
| Campanas de la iglesia de piedra | 8 (7 lotes; vejez 2, oficio 1, deseo 5) | 4 (infancia 1, vejez 1, deseo 2) | 2 |
| Misa de las once | 5 (5 lotes; vejez 3, oficio 1, despues 1) | 3 (vejez 1, oficio 1, despues 1) | 2 |
| Iglesia de piedra / cura de Riverside | 23 (9 lotes; juventud 1, vejez 5, oficio 3, primera_noche 3, despues 5, secreto 1, deseo 5) | 17 (adultez 1, vejez 3, oficio 4, primera_noche 2, despues 4, secreto 1, deseo 2) | 4 |
| Gladys / Arreglos Gladys | 15 (9 lotes; juventud 1, adultez 6, oficio 6, despues 2) | 10 (juventud 1, adultez 2, oficio 3, despues 3, deseo 1) | 3 |
| La Grange | 9 (9 lotes; juventud 7, adultez 1, secreto 1) | 8 (juventud 4, adultez 2, oficio 1, secreto 1) | 3 |
| Ollie's Diner (Valentina) | 4 (4 lotes; juventud 4) | 2 (juventud 2) | 2 |
| Concurso de matematicas / el nino Bell que cuenta todo | 7 (7 lotes; adultez 3, oficio 4) | 4 (adultez 2, oficio 2) | 2 |
| Cobro de los viernes del Martillo | 5 (5 lotes; despues 5) | 2 (despues 2) | 3 |
| Medieros / aparceros de tabaco (origen) | 7 (7 lotes; origen 7) | 2 (origen 2) | 3 |
| Hijo de sargento del Fuerte (origen) | 7 (7 lotes; origen 7) | 3 (origen 3) | 4 |
| "Mido dos veces, corto una" | 5 (4 lotes; oficio 4, voz 1) | 1 (oficio 1) | 2 |
| Radio "quedense en casa" (primera noche) | 11 (10 lotes; primera_noche 11) | 5 (primera_noche 5) | 4 |
| Viudez "un martes" | 6 (4 lotes; adultez 6) | 3 (adultez 3) | 1 |
| Catarata | 5 (5 lotes; vejez 5) | 3 (vejez 3) | 3 |
| Ardilla con la 22 | 9 (8 lotes; infancia 4, oficio 5) | 6 (infancia 2, oficio 4) | 3 |
| Asma: "mas tiempo en cama que en la escuela" | 3 (3 lotes; infancia 3) | 1 (infancia 1) | 1 |
| Inundacion del 37 | 5 (4 lotes; infancia 4, primera_noche 1) | 4 (infancia 3, primera_noche 1) | 3 |
| Aserradero de la 31 | 3 (3 lotes; juventud 1, adultez 2) | 3 (juventud 1, adultez 1, primera_noche 1) | 2 |
| Motel River View | 2 (2 lotes; primera_noche 2) | 2 (adultez 1, primera_noche 1) | 2 |
| Nevazon del 77 | 3 (3 lotes; infancia 1, adultez 1, vejez 1) | 2 (infancia 1, adultez 1) | 2 |
| Funeral de Hector Bencina (88) | 3 (3 lotes; adultez 3) | 2 (adultez 2) | 2 |
| Colorina | 4 (4 lotes; despues 1, deseo 3) | 6 (oficio 1, primera_noche 1, despues 2, deseo 2) | 3 |
| Moon Pie de los Bencina | 2 (2 lotes; origen 2) | 1 (origen 1) | 1 |
| Falso paramedico (secreto) | 2 (2 lotes; secreto 2) | 1 (secreto 1) | 1 |
| Sorteo con trampa (secreto) | 2 (2 lotes; secreto 2) | 1 (secreto 1) | 1 |
| Cobrar la pension de un muerto (secreto) | 2 (2 lotes; secreto 2) | 1 (secreto 1) | 1 |
| Radio escondida o rota a proposito (secreto) | 3 (3 lotes; secreto 3) | 2 (secreto 2) | 2 |
| Voz: "Dios se lo pague, yo no tengo con que" (frase de Rosa) | 7 (6 lotes; voz 7) | 1 (voz 1) | 2 |
| Voz: "te debo una, yo pago" (frase de Duggan) | 9 (6 lotes; voz 9) | 4 (voz 4) | 3 |
| Voz: "murio... como vivio" | 5 (5 lotes; voz 5) | 1 (voz 1) | 1 |
| Voz: murio contando un chiste sin final | 4 (4 lotes; voz 4) | 2 (voz 2) | 2 |
| "Aprendi a X antes que a leer" | 4 (3 lotes; origen 2, infancia 1, oficio 1) | 3 (origen 1, infancia 1, oficio 1) | 2 |
| "Leerle la cara desde la puerta" | 3 (3 lotes; infancia 3) | 0 () | 1 |
| Deseo: una carta de afuera | 2 (2 lotes; deseo 2) | 1 (deseo 1) | 1 |
| Deseo: enterrar a los mios con nombre | 3 (3 lotes; deseo 3) | 2 (deseo 2) | 2 |

Los mas recortados: Canal 19 / CB (29 -> 21); "Lleno o normal" de Rosa (16 -> 8); Megafono de Pereira en la comisaria (10 -> 3); Calle Main de West Point ardiendo (10 -> 3); Voz: "Dios se lo pague, yo no tengo con que" (frase de Rosa) (7 -> 1); Radio de Eduardo los domingos (11 -> 5); Radio "quedense en casa" (primera noche) (11 -> 5); Iglesia de piedra / cura de Riverside (23 -> 17).

## Lazos por personaje

Antes y despues (piezas con ese id en "lazo"). Entre parentesis, las etapas despues.

| Personaje | Antes | Despues | Etapas despues |
|---|---|---|---|
| ray | 3 | 9 | origen 1, juventud 1, oficio 2, primera_noche 2, despues 2, deseo 1 |
| vargas | 5 | 7 | juventud 3, adultez 2, oficio 1, despues 1 |
| duarte | 7 | 8 | juventud 1, adultez 3, oficio 2, despues 2 |
| wade_bell | 7 | 9 | adultez 4, vejez 1, oficio 2, despues 2 |
| valentina | 8 | 14 | infancia 1, juventud 4, adultez 1, vejez 1, oficio 3, primera_noche 1, despues 2, deseo 1 |
| kell | 8 | 12 | infancia 1, juventud 3, adultez 1, vejez 1, oficio 2, primera_noche 1, despues 2, deseo 1 |
| lucia | 9 | 14 | origen 1, juventud 1, adultez 2, vejez 1, oficio 2, despues 5, deseo 2 |
| reyes | 9 | 12 | infancia 1, juventud 1, adultez 3, oficio 3, primera_noche 1, despues 3 |
| daniel_bell | 10 | 8 | origen 1, juventud 1, adultez 5, oficio 1 |
| yvonne_bell | 11 | 13 | origen 1, infancia 1, juventud 1, adultez 4, oficio 3, primera_noche 2, deseo 1 |
| julio | 11 | 11 | juventud 3, adultez 3, vejez 1, oficio 2, primera_noche 1, despues 1 |
| pereira | 12 | 9 | juventud 2, primera_noche 4, despues 2, deseo 1 |
| hartmann | 12 | 13 | infancia 2, juventud 1, adultez 3, vejez 2, oficio 2, primera_noche 1, despues 1, deseo 1 |
| duggan | 13 | 13 | origen 1, infancia 1, juventud 1, adultez 2, vejez 1, oficio 2, primera_noche 1, despues 3, deseo 1 |
| eduardo | 17 | 11 | juventud 1, adultez 2, oficio 3, despues 4, secreto 1 |
| gladys | 17 | 13 | juventud 1, adultez 4, oficio 4, despues 3, deseo 1 |
| hector | 19 | 16 | origen 1, infancia 1, adultez 2, oficio 5, primera_noche 4, despues 3 |
| earl | 19 | 15 | infancia 2, juventud 1, adultez 3, vejez 2, oficio 4, primera_noche 1, secreto 1, deseo 1 |
| cabo | 21 | 19 | origen 1, adultez 1, vejez 2, oficio 6, primera_noche 2, despues 3, secreto 3, deseo 1 |
| chela | 27 | 22 | origen 2, infancia 5, adultez 1, vejez 1, oficio 2, primera_noche 4, despues 4, deseo 3 |
| nacho | 30 | 21 | juventud 2, adultez 2, vejez 3, oficio 5, primera_noche 2, despues 4, secreto 1, deseo 2 |
| rosa | 33 | 21 | origen 2, infancia 2, adultez 5, vejez 1, oficio 2, primera_noche 3, despues 2, secreto 1, deseo 2, voz 1 |
| Total piezas con lazo | 308 (34%) | 290 (32%) | |

Los que mas bajan (Rosa, Chela, Nacho, Pereira, Eduardo, Daniel Bell, Gladys) tenian sus lazos amontonados en un solo hecho (lleno o normal, la calle Main, las campanas, el megafono, la radio de los domingos, la camisa celeste, el vestido de novia). Los que suben (Lucia, Valentina, Kell, Ray, Vargas, Yvonne, Reyes, Duarte) ganan lazos con hechos de su ficha que nadie habia usado: los Ostrowski, el armonio del 85, Raul y Norma Ferrada, Ruth Haney; Otter Creek, las multas con crayon, Crescent Hill, el parque Cherokee; el desfile del 70, el funeral de Desmond, el River View y Ballard; la Compania Bravo, la Ford de Frankfort, el granero; el motin del 79 y el aserradero; Portland, Lucienne Hale, la boda del 79; la Good Seed y la Econoline; Lorene, La Lorene y los trabajadores de Laredo.

## Hechos publicos nuevos que entran como lazo (verificados en las fichas)

- cabo: l01_pn_megafono, l01_ofi_camionero_luz
- chela: l05_adu_grua, l10_inf_tonico
- daniel_bell: l07_adu_spiffos, l09_juv_petardos, l06_ori_rio, l10_ofi_pastora_reyes
- duarte: l06_adu_rosa, l10_adu_lleno_normal, l04_juv_guantes_oro, l10_ofi_mecanico_vulca
- duggan: l06_pn_megafono, l05_adu_seguro_bell, l02_vej_campanas, l02_deseo_campanas
- earl: l09_adu_seguro_bell
- eduardo: l05_des_san_judas, l06_of_mecanico, l04_ofi_mecanico_peterbilt
- gladys: l01_des_radio_domingo, l02_ofi_camionero2, l03_dse_campanas
- hartmann: l03_pn_megafono_comisaria, l06_des_eduardo, l10_juv_guantes_oro, l07_ofi_camionero_19
- hector: l05_pn_megafono, l01_pn_calle_main, l01_adu_rollos_canela, l10_ofi_electricista
- julio: l03_des_radio_domingos, l01_adu_vestido, l07_vej_rosa
- kell: l01_des_cobro_viernes, l03_adu_gladys_vestido, l08_inf_pan_hollis, l10_vej_misa_once, l01_ofi_camionero_tecolote, l04_ofi_cocinera_spiffos, l09_dso_lleno
- lucia: l10_adu_ruedo_gladys, l08_adu_cocina_quemada, l05_juv_guantes, l09_vej_nevazon, l07_ofi_costurera_4h, l04_ofi_profesora_cuenta
- nacho: l03_adu_seguro_bell, l09_adu_tonico_radio, l10_ofi_costurera_gladys, l09_ofi_enfermera_hogar
- pereira: l09_juv_la_grange, l01_juv_ollies, l06_deseo_colorina
- ray: l05_des_radio_domingo, l06_des_iglesia, l03_juv_guantes_oro, l05_ori_fuerte, l05_ofi_vulcanizacion, l06_of_policia_cabo, l07_dese_gordo_ruta
- reyes: l02_des_eduardo, l04_adu_poliza_bell, l05_adu_vestido_gladys, l07_ofi_mecanico_vulcanizacion
- rosa: l03_ofi_camionero_bencinita
- valentina: l10_pn_megafono, l07_des_radio_domingo, l03_des_tecolote_19, l04_adu_aserradero, l07_inf_bocina_earl, l03_vej_mesa_once, l02_ofi_profesora
- vargas: l07_des_duggan, l08_adu_poliza_celeste, l10_ofi_policia_richmond
- wade_bell: l09_des_radio_domingo, l08_des_tiza_viernes, l05_adu_pan_hollis, l08_vej_lleno_normal
- yvonne_bell: l07_pn_megafono, l01_pn_iglesia_abierta, l07_adu_poliza_dan, l07_juv_guantes_oro, l04_ori_portland_rio, l08_of_costurera

## Motivos de secreto ya usados (despues de los cambios)

Son los 74 secretos de las piezas tal como quedan. Nadie suma otro con la misma idea. Donde dice "par", ya hay dos y no cabe un tercero.

**Mentir sobre uno mismo**
- Cicatriz de "mordida sobrevivida" que es un corte de alambre (l01_sec_cicatriz).
- Diploma con el nombre pegado encima del de una prima (l05_sec_diploma).
- Falso paramedico que cose con hilo de pescar (l09_sec_falso_paramedico). Uno solo.
- Apellido falso: par. Al Cabo, por una orden de arresto (l10_sec_apellido_falso); prestado desde 1978, por una familia abandonada en Ohio (l04_sec_no_leer, nuevo).
- Dice ser viud{o} y la pareja vive a tres casas (l07_sec_no_leo, nuevo).
- Biblia familiar de una casa vacia con los nombres propios encima (l06_sec_censo, nuevo).
- No saber leer: par. Las latas por el dibujo (l02_sec_leer); la cruz en el cuaderno de Rosa (l10_sec_no_leer).

**Fingir para no cumplir un turno**: par. Finge no saber disparar (l03_sec_finge_no_disparar) y la tos de las noches (l05_sec_tos). Fuera de esto: fingir que no se maneja (es de Forrest, s067) y fingir sordera.

**Evitar la guerra**: par. Certificado de sordera comprado (l02_sec_sordo) y certificado de soplo con el primo muerto (l03_sec_certificado_leva). Aparte, la carta de reclutamiento escondida del hermano (l10_sec_carta_hermano).

**Robar o acaparar lo comun**
- De noche al vecino, y de dia ayudarlo a buscar al ladron (l01_sec_papas). Uno solo: el molde ya no se repite.
- Semilla de maiz comida a punados (l07_sec_semilla) y semillas comunes plantadas en un claro escondido (l04_sec_falsa_sordera, nuevo): par.
- Llave de la farmacia (l07_sec_llave_farmacia) y copia de la llave de la despensa para la madre (l08_sec_llave_despensa): par de llaves.
- Chancho escondido con sobras ajenas (l03_sec_chancho_sotano).
- Pilas gastadas para el grupo, las buenas para la musica (l06_sec_paramedico, nuevo).
- Pozo bueno que no se muestra (l09_sec_no_manejo, nuevo).
- Escopeta del grupo cambiada por una gallina (l05_sec_doble_libreta, nuevo).
- Camioneta escondida con medio estanque (l07_sec_camioneta) y pieza del carburador en el bolsillo (l05_sec_carburador).

**Cobrar por muertos o por lo ajeno**
- Pension de la madre muerta (l10_sec_pension). Una sola.
- Racion de una muerta en la libreta del Cabo (l04_sec_tia_censo). Una sola (las de l05 y l06 cambian). Aparte, la firma falsa del Cabo en un vale (l09_sec_firma_cabo).
- Arriendo de casas ajenas a los que llegan (l09_sec_hermano_heroe, nuevo).
- Dientes de oro de los muertos (l09_sec_dientes_oro); reloj de una casa vacia contado como herencia (l04_sec_reloj_casa).
- Casa ajena con las fotos dadas vuelta (l06_sec_casa) y testamento falso del vecino (l08_sec_papel_casa): par de casas.
- Testigo del testamento de una tia que ya no conocia a nadie (l03_sec_firma_testamento).

**Trampas y votos**: rifa arreglada (l01_sec_rifa); sorteo de salidas con trampa, "uno no volvio" (l09_sec_sorteo, uno solo); voto en contra de una familia y despues negarlo (l09_sec_voto); apuestas a la fiebre de los heridos (l07_sec_apuestas_fiebre); deuda con el Gordo contada al reves (l04_sec_deuda_gordo).

**Esperanza falsa o noticias escondidas**: calendario adelantado para los ninos (l01_sec_calendario); avisos falsos de que abren el cordon (l05_sec_avisos); el bus de evacuacion de los jueves para el padre (l05_sec_maleta); finge buscar a la familia los lunes (l06_sec_lunes); carta de afuera comprada y negada (l03_sec_carta_cordon); radio: par (l04_sec_radio_rota, para que duerman; l10_sec_valvula, para que el hijo no se vaya detras de Eduardo).

**Culpas de la primera noche**: dejar el puesto en la planta de agua (l01_sec_puesto); con el amante el 9 o el 10: par (l02_sec_otra, l08_sec_esa_noche); escaner y solo los suyos (l08_sec_escaner); la tranca abierta del corral (l08_sec_tranca); atropellar a alguien en la 31 sin parar (l08_sec_palito_largo, nuevo).

**Animales**: perro robado para que no se lo coman (l06_sec_perro); media racion al perro (l07_sec_perro_racion); perro amarrado en el monte (l08_sec_perro_monte); el gallo del vecino que llamaba a los muertos (l05_sec_pension, nuevo). Ya son cuatro con animales: no sumar otro.

**Otros**: diarios de los muertos leidos y quemados (l01_sec_diarios); racion segun cuantos muertos mata cada uno (l01_sec_radio, nuevo); alegrarse del fin del mundo por la deuda (l02_sec_deuda); hijo con la cunada (l02_sec_hijo_cunada); hijo de otra mujer en Elizabethtown (l03_sec_hijo_otro_pueblo); que otro pagara un robo en La Grange (l02_sec_reformatorio); cartas anonimas al pastor: par (l02_sec_cartas, l04_sec_cartas_pastor); ahorros perdidos en los casinos y robo inventado (l03_sec_ahorros_botes); reloj adelantado para la guardia del hijo (l06_sec_reloj); MORDIDOS ADENTRO en la puerta (l06_sec_letrero); nombres de vivos en la pared de los muertos (l06_sec_bencina, nuevo); enamorado de quien espera a otro (l07_sec_enamorado); pastillas de dormir en la sopa de la pareja (l03_sec_no_se_leer, nuevo); soplon del sheriff en los 70 (l10_sec_informante); bicicleta robada a un vecino que se fue a pie (l10_sec_bicicleta); cigarrillos enterrados detras de la iglesia (l10_sec_cigarrillos).

**Ocupados afuera de las piezas (no usar)**: los de `personajes/rol/diferenciar.md` (puertas y candados, matar a un rendido, quitarle la comida a un viejo, negar ayuda mintiendo, salida falsa del cordon, "ya vuelvo" a un mordido, firmar sabiendo que mandaba gente a morir, "fue un clavo", velorios de la primera noche) y los de `sec/arreglos_B/RESUMEN.md`. En esta revision salieron cuatro choques con los 100 secundarios: fingir que no se maneja para que otro vaya (Forrest s067), el familiar que se fue con la camioneta y la comida (Homer s069), el 4-F y el alivio que no se cuenta (Benny s057, era l06_juv_4f) y esconder un remedio que otro necesita (Vonda s078; evitado en la propuesta de l06_sec_censo).

## Choques con el canon encontrados al revisar

1. **l03_dse_campanas**: "desde que murio el sacristan nadie las toca". En la ficha del Padre las campanas callan desde que se rajo la viga en noviembre de 1991; Delbert murio la tercera semana. Cambia.
2. **l10_pn_bar_31** y **l05_pn_barra** cuentan la misma escena del Rebel Spur (el cantinero que muere esa noche, y Stosh s049 ya estaba ahi). Queda l05.
3. **l03_sec_carta_cordon**: un soldado del cordon que pasa una carta. El unico trato entre la Guardia y los civiles es el soldado Kimbrell en el porton viejo del Doe Run (arreglos_B). Ajuste chico en el lote 03.
4. **l10_dsp_cruces_cabo**: "me deja latas en la escalera" queda muy cerca del gesto de Duggan. Ajuste chico en el lote 10.
5. **Voces que copian frases del reparto**: "Dios te lo pague, yo no tengo con que" (Rosa, frase 3; tambien el Padre y Julio) salia en 7 voces; "Te debo una. Yo pago" (Duggan) en 9; "Manos donde las vea" y "Gracias. Lo anoto" (Ray); "Cumplio" (Pereira); "lavese las manos" y "guardeselo" (la Chela); "Pase, corazon" (Yvonne). Se cambian en las voces de los lotes 01, 02, 03, 04, 06, 08, 09 y 10.
6. **Lo que no es publico el dia 0** (`personajes/rol/reloj_dia0.md`, "Lo que NO es publico"): tres piezas que se quedaban lo rompen y entran a la lista: **l01_pn_bascula** (Earl escondido en la bascula), **l08_pn_luz_bencina** (algo golpeando en el bano de la gasolinera: Bobby Lee encadenado) y **l02_pn_iglesia** (pasar la noche en la iglesia de piedra abierta: el Padre abrio las puertas a las 6:00 del 10). Las propuestas evitan tambien lo que cobro el sereno del aserradero (Vargas), el "turn around" de Duarte y a Bishop subiendose al camion de la Guardia (reservado al Narrador).
7. **CANON, Dia 0**: la camioneta de Walt Hollis salio de Riverside recien en la tarde del 10 y el Cabo la vio entre las 16 y las 17 al sur de Muldraugh. La propuesta de l07_pn_megafono usa esa hora y no dice si paso la barricada.

## Etiquetas

Casi todos los cambios mantienen las etiquetas. Las que hay que tocar estan marcadas "Etiquetas:" en cada lote, con las actuales entre parentesis. Las importantes:
- Las cuatro piezas de asma que cambian (l01_inf_asma, l03_inf_asma_cama, l03_juv_asma_se_fue, l09_juv_supero_asma) mantienen asma y enfermizo_nino o el "pide asma + quita", para que los caminos de "supero el asma" sigan funcionando.
- l05_juv_reformatorio pasa de preso_pasado a militar, y l08_juv_la_grange deja de dar preso_pasado (ahora es cocina): revisar las piezas que piden preso_pasado (siguen l01_juv_cobre, l04_juv_la_grange, l10_juv_la_grange, l03_juv_preso_robo y l09_juv_la_grange).
- l10_ori_medieros, l04_ori_hondonada_carbon, l07_ori_campamento_minero y l10_ori_casa_compania dejan de dar tabaco o minero: quedan 4 origenes con tabaco y 5 con minero.
- l04_vej_corazon pasa de corazon a diabetes.
- Los secretos nuevos que reemplazan a "no se leer" (l03, l04, l07) quitan sin_estudios si lo daban.
- l09_adu_viudez da viudo y casado a la vez: confirmar que el generador lo acepte.

## Detalles menores (opcionales)

- Las tres voces del lote 05 terminan la muerte con "Murio en el encargo" y cuatro del lote 08 con "Murio en el camino". Si el juego no lo exige, variar dos de cada lote.
- "Aprendi a X antes que a leer" queda en tres piezas (l02_ori_rio, l05_inf_salon, l05_ofi_por_patas): no sumar otra.
- "Me hace bien" cerraba tres piezas de despues del lote 06; quedan una.
- "La madera no me apura" sale dos veces en el lote 09.

## Piezas con lazo que quedan sin lazo

23 piezas que tenian lazo quedan sin el. Once son de primera noche (l03_pn_calle_main, l05_pn_calle_main, l07_pn_calle_main, l08_pn_calle_main, l03_pn_luz_rosa, l04_pn_luz_bomba, l05_pn_luz_bomba, l07_pn_canal19, l10_pn_canal19, l06_pn_barricada, l06_pn_riverview): el lazo era el mismo hecho repetido, o era algo que no es publico, y la etapa sigue llena de lazos (Bishop con el altavoz, la barricada norte armandose, Cody Turner, Merle, el Chato Medina, la Colorina saliendo a las ocho, la camioneta de la Hollis, la panaderia cerrada, Crescent Hill, el tonico "contra la gripe de Knox"). Las demas: l01_des_canal19, l07_adu_tonico_radio, l01_juv_cohetes, l09_ori_moon_pie, l02_ofi_mecanico, l05_ofi_gordo_ruta, l05_ofi_spiffos, l08_of_cocinera (solo pierde la Hollis), dos secretos (l05_sec_doble_libreta, l06_sec_censo; mejor sin lazo) y dos deseos (l01_dese_campanas, l06_deseo_rosa). Si se quiere subir el total, esas son las primeras candidatas.
