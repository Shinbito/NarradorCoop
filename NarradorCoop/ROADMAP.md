# Roadmap NarradorCoop

## Técnico

### Brújula sigue a la cámara (hecho, falta probar en el juego)
- La brújula intenta leer hacia dónde mira la cámara de Project Viewpoint y, si no lo
  encuentra, sigue al personaje como antes.
- Menú: clic derecho -> Narrador -> Indicador -> "La brujula sigue a: la camara / el personaje".
- Si sigue moviéndose con el personaje: usar "Diagnostico de la brujula (console.txt)" y pasar
  las líneas `[Narrador]` del `console.txt`. Viewpoint es un mod Java (ZombieBuddy) y no
  publica cómo se lee la cámara desde Lua; con ese listado se conecta la brújula al dato real.

### Misioneros que no aparecen o aparecen muertos (hecho, falta probar en el juego)
- Antes de pedir el NPC se limpian los zombis de alrededor.
- Las banderas (inmortal, quieto, correa) se ponen apenas aparece, no 10 minutos después.
- Cada minuto, con un jugador a menos de 70 casillas: se reponen banderas y vida, se detecta
  si el cuerpo cargado murió (aunque A-Life no lo anote) y se pide de nuevo.
- Si un pedido no contesta, se reintenta a los 15 minutos de juego (antes, 1 hora).
- Mantener el chunk siempre cargado como en Minecraft no es posible: Project Zomboid solo
  carga celdas alrededor de los jugadores y no hay forma desde Lua de forzarlo. Por eso el
  misionero se guarda como "persistente" en A-Life y se vuelve a poner al llegar.

## Estético

### Diario en lápiz pasta azul (hecho, falta probar en el juego)
- Todo en la letra manuscrita del juego y del mismo tamaño; los títulos se distinguen por la
  tinta más cargada y un subrayado doble, no por ser enormes.
- Toda la tinta en azul (más cargada en títulos, gastada en fechas); rojo solo para lo urgente.
- Menos texto: sin las frases bajo los títulos, la introducción del capítulo solo al empezar,
  2 anotaciones viejas por historia (antes 4), 3 historias cerradas (antes 6), 3 rumores
  (antes 6) y 8 entradas en el registro (antes 25). Más aire entre renglones.

## Misioneros y campamentos (hecho, falta probar en el juego)
- Cada misionero empieza bloqueado. Al andar por su pueblo, llega a tu casa (refugio, o donde
  estés si no tienes) y te pide ayudarlo a limpiar su edificio para armar un campamento; lo
  que encuentres adentro es tuyo. Solo se puede responder "Te ayudo" o "Mas rato".
- Al limpiarlo queda desbloqueado: se instala ahí y da encargos. Primero hay 15 zombis
  adentro y después llega una horda de 30 (+15 por cada jugador extra), sin corredores; hay
  que matar el 80% de la horda.
- Corre en paralelo con la historia principal (los Bell). Archivo: `shared/Narrador/Arcos/Desbloqueos.lua`.
- Sandbox "Misioneros se desbloquean" para apagarlo. En partidas viejas los misioneros que ya
  estaban siguen desbloqueados.
- Diario: la descripción de un misionero aparece al conocerlo y crece con la confianza
  (`Lore.PERFILES`). Los cuatro tienen sus 5 capas.
- Mandar a alguien de un encuentro al campamento sube la confianza (+3, con aviso).

## Ideas futuras: campamentos de supervivientes

### Fase 1: el campamento existe y crece
- Los próximos capítulos de la historia mandan al campamento de los misioneros.
- Cada NPC salvado en un evento aleatorio suma al campamento. 3 salvados = nivel 1.
- Los salvados rondan el campamento como guardias y dan misiones secundarias.
- Cada nivel desbloquea capítulos de la historia con NPCs clave (definidos, no generados).

### Fase 2: reservas y trueque
- El campamento tiene reservas: munición, comida/agua y ropa/abrigo.
- El precio de cada cosa depende de cuánto tienen: si sobra munición, pagar con munición rinde
  poco; si falta comida, pagar con comida rinde mucho.
- La reputación con el campamento mejora los trueques y abre el acceso a armas.
- Cada campamento tiene una prioridad. El del Cabo Ramiro es militar: quiere armas y balas,
  así que comerciarlas con ellos sale a cuenta, y con buena reputación vende armas más baratas.

### Fase 3: oficios
- Mecánico: vende partes de auto; con suficientes misiones o una misión excelente, un auto.
- Carpintero: mangos de armas legendarios, muebles.
- Herrero: hojas, mejora y fabrica armas (necesita los mangos del carpintero).
- Cada oficio tiene sus propias misiones secundarias.

### Fase 4: historia propia del campamento
- El Cabo Ramiro tiene una historia principal propia cuando se crea su campamento, aparte de
  los encargos.

### Misión futura: la hija del Cabo Ramiro (Louisville)
- Sale de su capa 5 de personalidad: tiene una hija en Louisville a la que le escribe cartas
  que nunca manda.
- Hay que ir a buscarla a una escuela de Louisville. Ahí hay varios NPCs intentando
  sobrevivir mientras los ataca una horda; la hija está peleando y hay que salvarla.
- Traerla de vuelta al campamento del Cabo. Los NPCs de A-Life son cuerpos de zombi
  controlados, así que probablemente no pueden subirse a un auto. Para eso ya está el sistema
  de acompañantes (`server/Narrador/NarradorPasajeros.lua`, hecho, falta probar): te sigue a
  pie; si subes a un auto con ella a menos de 12 casillas, sale "X se sube donde sea que haya
  espacio" y desaparece; cada vez que te bajas, aparece a tu lado. Prueba de admin:
  Narrador -> Pruebas -> "Acompanante: el NPC mas cercano me sigue".
- Ganchos para más misiones así en las capas 5 de los otros: el hijo de la Tía Chela (Tomás,
  en Louisville), la muchacha que esperaba al Padre Nacho, el estanque de bencina escondido de
  la Misia Rosa.

### Qué ya existe en el código y sirve de base
- Misioneros fijos por ciudad y encargos: `server/Narrador/NarradorContactos.lua`.
- Confianza por misionero y por grupo: `server/Narrador/NarradorReputacion.lua`.
- Encuentros aleatorios con NPCs (de donde saldrían los salvados): `server/Narrador/NarradorEncuentros.lua`.
- Arcos de historia por etapas: `shared/Narrador/Arcos/` y `server/Narrador/NarradorMotor.lua`.
