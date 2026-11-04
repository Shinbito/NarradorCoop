# Piezas para el generador de vidas

Cuando se acaben los 100 secundarios hechos a mano, el juego va a inventar vecinos nuevos armando una vida con PIEZAS,
una por etapa. Cada pieza es una frase en primera persona y unas ETIQUETAS que agrega, pide o prohibe, para que la vida
no se contradiga (una infancia enfermiza no deja pasar a "campeon de lucha" despues, salvo que una pieza cuente como lo
supero). Tu trabajo: escribir piezas, sacadas de lo que aprendiste con tus 10 personajes pero GENERICAS (sin sus nombres
ni sus secretos exactos), y con muchos lazos con el reparto principal.

## Como arma una vida el juego
1. Sortea sexo, edad (18 a 85 en julio de 1993), pueblo (Muldraugh, West Point, Riverside, Rosewood) y oficio.
2. Recorre las etapas en este orden y en cada una elige al azar una pieza que cumpla todo (edad, sexo, oficio, pueblo,
   "pide", "prohibe"); al elegirla suma sus etiquetas "da" y saca las de "quita":
   origen, infancia, juventud, adultez (si edad >= 25), vejez (si edad >= 60), oficio, primera_noche, despues,
   secreto, deseo, voz.
3. Con eso arma los textos: revelacion1 = pieza de oficio; revelacion2 = una de infancia/juventud/adultez/vejez;
   revelacion3 = secreto; mudanza = origen + adultez + despues + deseo; llegada/rescate/gracias/muerte = pieza de voz.
   El diario usa los campos "diario" de la pieza de secreto.

## Formato: sec/piezas/loteNN.json = {"piezas": [ ...objetos... ], "etiquetas_nuevas": {"nombre": "una linea"}}
{
  "id": "inf_asma_rio",              // unico; empieza con la etapa abreviada y tu lote: "l03_inf_asma_rio"
  "etapa": "infancia",
  "texto": "De {nino} pase mas tiempo en cama que en la escuela: el asma no me dejaba correr ni detras de un perro.",
  "da": ["enfermizo_nino"], "pide": [], "pide_alguno": [], "prohibe": ["atleta"], "quita": [],
  "edad_min": 18, "edad_max": 85,    // edad en julio de 1993 (para que las fechas cuadren)
  "sexo": null,                      // "h", "m" o null
  "oficios": null,                   // solo en la etapa "oficio": lista de ids que cubre
  "pueblos": null,                   // null o lista
  "lazo": null,                      // id del personaje principal que nombra, si nombra a alguno (ver abajo)
  "peso": 10                         // opcional: 5 rara, 10 normal, 20 frecuente
}
Etapa "secreto" agrega: "diario": "linea del diario del jugador al saberlo (maximo 160)".
Etapa "voz" en vez de "texto" lleva: "llegada", "rescate", "gracias", "muerte" (los largos de RONDA_B.md).

## Reglas del texto
- SIN tildes ni enes (como en el juego). Maximo 200 caracteres por "texto" (220 en secreto).
- Marcadores (el juego los reemplaza): {o} -> o/a segun el sexo ("cansad{o}"); {nino} -> nino/nina; {hijo} -> hijo/hija;
  {el} -> el/ella; {pueblo}; {oficio} (el nombre del oficio, "la enfermera"); {ano_nac}; {ano+N} = ano de nacimiento + N
  ("en {ano+17} me fui a Louisville"). Usa {ano+N} para que las fechas cuadren con cualquier edad dentro del rango.
- Guerras: si una pieza dice Corea, Vietnam o la Segunda Guerra, su edad_min y edad_max tienen que cuadrar
  (por ejemplo, Vietnam 1964-1973 -> nacido entre 1938 y 1955 -> edad en 1993 entre 38 y 55).
- Nada de motivos ocupados (personajes/rol/diferenciar.md, MUNDO_SEC.md y los secretos de los 100 secundarios). Las
  piezas de secreto son cosas que un vecino comun podria haber hecho, sin repetir las de los 100 ni del reparto.

## Lazos con el reparto (el creador quiere muchos)
Al menos 1 de cada 4 piezas tiene que nombrar a alguien del reparto principal o un lugar o hecho publico de su historia
(la gasolinera de Rosa y su "lleno o normal", la comisaria del Cabo, la Colorina de la Chela, la misa de las once del
Padre, la panaderia de Walt Hollis, la radio de Eduardo los domingos, el canal 19 de Earl y el Bencinita, el patio de
trenes de la Sargento...). Pon su id en "lazo": cabo, valentina, chela, eduardo, nacho, lucia, rosa, hector, pereira,
vargas, kell, reyes, duarte, daniel_bell, yvonne_bell, wade_bell, gladys, hartmann, duggan, earl, julio, ray.
Solo hechos publicos y que no contradigan las fichas. Si la pieza solo vale en un pueblo, ponlo en "pueblos".

## Etiquetas (usa estas; si necesitas una nueva, agregala al final de tu archivo en "etiquetas_nuevas" con una linea)
Cuerpo: enfermizo_nino, supero_enfermedad, fuerte, atleta, lesion_pierna, lesion_espalda, lesion_mano, sordo,
  vista_mala, asma, corazon, diabetes, cojo, viejo_fragil.
Origen y lugar: rural, urbano, louisville, montana, rio, minero, tabaco, granja, fort_knox, inmigrante, refugiado,
  forastero, nunca_salio.
Familia: huerfano, adoptado, padre_violento, familia_grande, hijo_unico, casado, viudo, divorciado, separado,
  con_hijos, sin_hijos, hijo_muerto, hijos_lejos, cuida_a_alguien.
Estudios y trabajo: sin_estudios, secundaria, universidad, oficio_aprendido, militar, veterano_wwii, veterano_corea,
  veterano_vietnam, marino, policia_pasado, comerciante, camionero_pasado, fabrica, iglesia_trabajo.
Fe y vicios: religioso, sin_fe, catolico, bautista, metodista, santidad, alcohol, sobrio, apostador, fumador.
Ley y plata: preso_pasado, deudas, pobre, acomodado, perdio_todo, contrabando.
Caracter: solitario, lider, timido, bromista, rencoroso, culpa, mentiroso, valiente, cobarde.
Despues del brote: perdio_familia, familia_viva, sin_noticias, vive_solo, vive_con_otros, cuida_ninos, herido_brote,
  mato_transformado, hambre, trueque.
Etiquetas que algunas piezas exigen: militar (para "estuve en la guerra"), universidad (para profesor universitario),
  oficio_aprendido o el oficio en "oficios" (para ejercerlo), fuerte o atleta (para hazanas fisicas).

## Cuantas piezas por lote (unas 75)
origen 6 · infancia 8 · juventud 8 · adultez 8 · vejez 5 · oficio 12 (las 12 profesiones: mecanico, enfermera, granjero,
policia, carpintero, costurera, cocinera, camionero, profesora, cazador, electricista, pastora; cubre edades distintas) ·
primera_noche 7 · despues 7 · secreto 7 · deseo 5 · voz 4.
Incluye a proposito pares que se excluyen y piezas que "superan" algo (pide + quita), para que el generador tenga
caminos distintos. Que las primeras_noche calcen con el canon del 9 de julio (la Guardia, el cordon, la calle Main de
West Point ardiendo, la comisaria de Muldraugh, la radio que pedia quedarse en casa).

Valida el JSON antes de terminar. Solo puedes crear sec/piezas/loteNN.json.
