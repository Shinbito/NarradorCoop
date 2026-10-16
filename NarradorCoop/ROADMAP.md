# Roadmap NarradorCoop

Grafo del codigo (graphify): `NarradorCoop/graphify-out/` (`GRAPH_REPORT.md` para leer, `graph.json` y `graph.html`).
Para actualizarlo: `cd NarradorCoop && graphify update .`
Mapa de historias (que historia abre a cual y por que memoria): `NarradorCoop/MAPA_HISTORIAS.md`.
Para actualizarlo: `python3 NarradorCoop/herramientas/mapa_historias.py` (necesita `pip install lupa`).

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

### Misión: la hija del Cabo Ramiro (programada, DESACTIVADA)
- Archivo: `shared/Narrador/Arcos/HijaCabo.lua` (`automatico = false`: nada la lanza sola; un
  admin la puede iniciar a mano para probarla). Para activarla falta decidir cuándo sale
  (por ejemplo, al llegar a confianza 5 con el Cabo).
- Etapas: el Cabo pide el favor y da el mapa -> viaje a una escuela de Louisville -> horda de
  30 (+15 por jugador extra, sin corredores) con Valentina y 3 sobrevivientes peleando ->
  hablar con ella -> traerla al campamento (te sigue y se sube al auto) -> reencuentro.
- Si llega: +25 de confianza con el Cabo, Valentina se queda a vivir en el campamento y hay
  recompensa. Si muere: final triste.
- Falta revisar en el juego que el perfil elegido para Valentina (`k93_hensley_family_03`) se
  vea como una muchacha.

### La leyenda de Eduardo Giovanns, el hijo de la Tia Chela (hecho, falta probar)
- Los NPCs de los encuentros lo nombran: "una vez me saco de una igual a esta un tal Eduardo".
  Despues de conocerlo te dicen que peleas como el.
- Rumores con sus pasos: lugares donde estuvo, con una nota firmada "E.G." y algo para el que
  viene detras (tu vas siguiendo su camino).
- Historia de la Chela, capitulo 3, "Un cientifico que dice tener la cura" (no tiene nada que
  ver con la mision de la cura K-93). Sale entre sus ofertas cuando su capitulo 2 ya se hizo y
  te tiene confianza 3+. Al llegar, Eduardo ya esta peleando solo contra una horda (30 +15 por
  jugador, sin corredores). Pelean juntos, se presenta, puedes contarle de su mama, te deja un
  arma legendaria ("vas por el mismo camino que yo") y se va. Hay que llevar al doctor
  Hartmann vivo donde la Chela: era un charlatan, pero se queda en el cuartel y cada 48 horas
  deja medicina (antibioticos, pastillas, vendas, desinfectante). Archivo:
  `shared/Narrador/Arcos/LeyendaTomas.lua`.
- Eduardo: heroe de pelicula, honorable y humilde. Inmune a la zombificacion, 400 de vida, mucho
  dano y un arma legendaria. Si cae, nunca se levanta: la proxima vez que pasas por el cuartel
  de la Chela aparece vivo ("uff, pense que la palmaba"). Siempre se salva por las minimas.
- El Cabo Ramiro le tiene mala: dice que es un engreido (es envidia).

### Campamentos con niveles y comerciantes (hecho, falta probar)
- Archivos: `shared/Narrador/NarradorCampamentosDefs.lua` (niveles, oficios, catalogos,
  precios), `server/Narrador/NarradorCampamentos.lua`, `client/Narrador/NarradorCampamentosCliente.lua`.
- Nivel 1 carpintero (2 salvados) / 2 herrero (4 + cap. 1 + confianza 2) / 3 mecanico (6 +
  cap. 2 + confianza 3) / 4 curandero (8 + confianza 4; con la Chela, su cap. 3 y el curandero
  es el doctor Hartmann). Un capitulo que no esta escrito no se pide.
- Se paga con comida, municion (caja o 10 balas sueltas), abrigo (ropa que no llevas puesta;
  cada prenda vale 1 a 5 segun el promedio de sus stats y su estado) o medicina (cada una vale
  segun lo que es: botiquin 4, antibioticos 3, venda 1...). El precio depende de lo que valora
  cada campamento y de la confianza con el misionero.

### Guardias, ataques, reservas y forja (hecho, falta probar)
- Guardias: la gente que llevas al campamento se queda rondándolo (máximo 15; si está lleno,
  "queda resguardado haciendo encargos" y no aparece).
- Ataques: con guardias en el campamento y alguien a menos de 150 casillas, cada tanto (al
  menos 72 horas entre uno y otro) llega una horda (15 + 2 por guardia). Los guardias pelean
  y pueden morir de verdad; el misionero y los comerciantes no. Si ayudas a defender: +6 Knox
  y +3 de confianza.
- Reservas: cada campamento tiene de 0 a 100 de comida, munición, abrigo y medicina. Pagar con
  lo que les falta es barato y con lo que les sobra, caro (x0.5 a x1.5). Lo que pagas se suma a
  sus reservas; cada día gastan (comida según los guardias, abrigo más en invierno) y en los
  ataques se les va munición y medicina. El menú de comerciar muestra las reservas y qué les
  falta.
- Forja: el carpintero vende "Mango de arma" (4) y, con confianza 4, "Mango de madera noble"
  (14). El herrero forja un arma con el mango que lleves: con el normal sale excepcional, con
  el noble, legendaria (machete, hacha, katana, lanza o hacha de mano).

### Modo historia de cada misionero
- Cada misionero tiene sus capitulos. Capitulo 1 = su desbloqueo (fundar el campamento).
  Los siguientes salen entre sus ofertas cuando el anterior ya se hizo (`G.ESPECIALES` en
  `server/Narrador/NarradorGenerador.lua`; cada capitulo deja la memoria `historia_<id>_<n>`).
- Hecho: Chela cap. 1 (desbloqueo) y cap. 3 (el cientifico). Por escribir: Chela cap. 2 (sin
  el, el 3 no sale) y los capitulos 2+ del Cabo, el Padre Nacho y la Misia Rosa. La hija del
  Cabo (Valentina) puede ser uno de sus capitulos.
- Falta revisar en el juego los perfiles de Eduardo (`k93_stockyard_05`) y del doctor
  (`k93_red_cross_02`), y si A-Life le deja el arma en la mano.

### Encuentros: llevar a la persona al campamento (hecho, falta probar)
- "Llevarlo donde {misionero}" ya no lo manda solo: te sigue (y se sube al auto contigo) y hay
  que llegar con él vivo al campamento. Si llega: +6 de confianza con aviso. Si muere en el
  camino, o lo pierdes 96 horas, la historia termina sin premio.

### Idea original: la hija del Cabo Ramiro (Louisville)
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
- Ganchos para más misiones así en las capas 5 de los otros: el hijo de la Tía Chela (Eduardo,
  en Louisville), la muchacha que esperaba al Padre Nacho, el estanque de bencina escondido de
  la Misia Rosa.

### Reputación global de Knox (hecho, falta probar)
- Un eje por grupo, de -200 a 200 (`shared/Narrador/NarradorKnoxDefs.lua`,
  `server/Narrador/NarradorKnox.lua`).
- Puntos: ayudar a un NPC +4; recado a un comerciante +5; encargos y misiones según
  dificultad (fácil +4, medio +6, difícil +10, ultra +15); matar a un NPC fuera de una misión
  -5 (las muertes dentro de una misión no cuentan, pueden ser accidentes; los bandidos hostiles
  tampoco); cada misión para los bandidos -15 (`KD.BANDIDOS_MISION`); limpiar un lugar tomado
  por bandidos +15.
- Positivo: 1 Desconocido (0 a 20), 2 Mensajero (20 a 45), 3 La nueva esperanza (45 a 90),
  4 El guerrero (90 a 150), 5 El héroe de Knox (150 o más).
- Negativo, igual: 1 Poco confiable (bajo 0), 2 Rumores negativos (-20), 3 La nube negra
  (-45), 4 El destripador (-90), 5 El demonio de Knox (-150).
- Aviso y entrada en el diario al cambiar de nivel; el diario (Notas -> Lo que hice) muestra
  el título. Admin: Pruebas -> "Reputacion de Knox +30 / -30".
- Con nivel -4 o peor (El destripador, El demonio de Knox): los misioneros no te dan encargos
  ni capítulos ("ya no eres bienvenido por el daño que has hecho") y los comerciantes no te
  venden nada. Pesa más Knox que la confianza: aunque el misionero te tenga confianza 5, si tu
  fama en Knox es de El destripador o peor te sigue despreciando (sin encargos, sin favor
  semanal, sin felicitaciones al subir de rango).
- Los comerciantes siempre tienen un recado ("Quieres que la gente confíe en ti? Ayúdame con
  esto"): una misión chica que te marca un lugar en un mapa ("ayúdame a buscar los clavos,
  estoy seguro de que en el garage de esa casa hay"), buscas la cosa ahí y se la llevas
  (`shared/Narrador/Arcos/Recados.lua`). Se arman al azar: una de las 8 cosas de su oficio
  (`K.RECADOS_OBJETOS`), uno de los lugares donde podría estar y una de sus 3 formas de pedirlo.
- El edificio de un misionero nunca queda como "lugar ocupado" por bandidos (ni al sacar el
  botín en su desbloqueo). Uno a la vez y uno cada 12
  horas por grupo. Da +5 en Knox y +2 de confianza con el misionero, también con mala fama.
- Con la reputación en negativo solo se sube salvando gente, acabando con bandidos o
  haciendo recados.
- La gente habla distinto según tu fama: los misioneros (`C.FRASES_KNOX`) y los NPCs de los
  encuentros te insultan y te temen con mala fama, y con buena te quieren y saben de tus hazañas.
- Ganchos para las historias: acción `{ "knox", cantidad = n }`, acción
  `{ "knox_reiniciar", texto = "..." }`, condiciones `{ "knox_minimo", n }` y
  `{ "knox_maximo", n }`, y la memoria `knox_bandido_<grupo>` = "listo" la primera vez que el
  grupo llega a -5 de Knox o menos.

## PARA EL PRÓXIMO CHAT: historias por desarrollar

### A. Eventos fortuitos de Eduardo (después de conocerlo)
- Condición: memoria `tomas_conocido`. Sale como evento fortuito, más seguido cuanto más
  avanzada la partida (por ejemplo, una tirada por día con chance 5% + 1% por día de partida,
  tope 40%, y al menos 72 horas entre uno y otro).
- Eduardo llega corriendo cerca del jugador y avisa. Dos variantes:
  - Horda gigantesca detrás de él (60 + 20 por jugador extra).
  - Bandidos persiguiéndolo: "Vienen bandidos detrás mío. Escóndete o pelea conmigo."
- Opciones: pelear junto a él o esconderse. Si te vas lejos mientras pelea (abandonarlo),
  baja la reputación de Knox (por ejemplo -15). Si ganan, sube (por ejemplo +10) y Eduardo
  dice algo heroico y humilde.
- Eduardo es inmune (`{ "inmune", grupo, rol, quien = "tomas" }`): si cae, vuelve vivo al
  cuartel de la Chela (ya hecho, `C.REGRESOS` y arco `tomas_vuelve`).

### B. El camino del bandido (Knox negativo)

#### Fase 1: Pereira (hecho, falta probar en el juego)
- Archivos: `shared/Narrador/Arcos/Bandido.lua`, `server/Narrador/NarradorBandido.lua` (lanza los
  capitulos) y `shared/Narrador/NarradorLoreBandido.lua` (diario).
- Se abre la primera vez que el grupo llega a -5 de Knox (`KD.BANDIDO_UMBRAL`): una nota en tu
  casa firmada "P." y un mapa al patio de trenes al oeste de Muldraugh. Del capitulo 2 en
  adelante se piden volviendo al patio (12 horas entre uno y otro).
- La Sargento Pereira mandaba el cordon de la Guardia en Muldraugh: ordeno cerrar la comisaria
  con la gente adentro y el Cabo Ramiro la desobedecio y saco a once. Se odian.
- Cap. 1 El traidor: matar a Julio Cardenas, o dejarlo ir con su hija Marisol y llevarle su
  placa (memoria `julio_vivo`). Si rechazas el trabajo, la puerta queda abierta (vuelve al patio).
- Cap. 2 La comisaria: robarle las reservas al Cabo de noche (-30 a cada reserva, -40 de
  confianza), o avisarle y llevar una caja con piedras. Espera a que el Cabo tenga campamento.
- Cap. 3 La familia: matar a los Salinas, o dejarlos huir con el anillo de Arturo como prueba.
- Cap. 4 Las latas: quitarle la comida al grupo de Ramon Quispe, o llevarse la mitad.
- Cada mision cumplida: -15 de Knox. Cada sabotaje suma sospecha (`bandido_sospecha`): al volver
  al patio hay 30% por sabotaje de que Pereira lo descubra y mande cazadores (`bandido_castigo`).
- Cap. 5 La decision:
  - A su derecha: memoria `bandido` = "pereira" (sigue en la fase 2).
  - Redimirte: asalto al patio. Ayudan los misioneros con confianza 4 (mandan dos guardias
    cada uno), Eduardo si lo conociste y Julio si lo perdonaste. Al matar a Pereira: Knox a 0
    con "La gente perdonara tus pecados del pasado, pero en tu mente sigue existiendo cada acto
    malvado que hiciste", un arma legendaria y memoria `bandido` = "redimido".
- El patio de trenes va de 11544,9590 a 11746,10232 (`Narrador.BandidoPatio` en `Bandido.lua`);
  Pereira se instala en la casa del patio mas cerca del centro.

#### Maulen como jefe (hecho, falta probar en el juego)
- En Sous, si vas solo al escondite y Maulen sigue vivo un cuarto de hora, se rinde. Si lo
  dejas ir, Sous cree que se escapo (memoria `maulen_salvado`).
- 72 horas despues Maulen mata a Pereira y se queda con el patio (`bandido_maulen`): te deja una
  nota porque te debe la vida, sin importar tu Knox. Si ya trabajabas para Pereira, sigues con
  el desde el capitulo en que ibas. Los capitulos 2 a 5 cambian de dialogos y diario segun el
  jefe (memoria `bandido_jefe`).

#### Fase 2: la conquista de Knox (hecho, falta probar en el juego)
- Archivos: `shared/Narrador/Arcos/Conquista.lua`, `shared/Narrador/Arcos/Inmorales.lua`,
  `shared/Narrador/NarradorDominiosDefs.lua` y `server/Narrador/NarradorDominios.lua`.
- Con Maulen de jefe, primero la base de Sous (si Sous es aliado y sigue en su base). Despues la
  comisaria del Cabo; despues West Point, Riverside y Rosewood en el orden que quieras (se
  lanza al entrar a cada pueblo). -15 de Knox cada una. Al terminar: memoria `knox_conquistado`.
- Cada ciudad tiene un dominio (memoria `dominio_<id>`): mision, bandido o nuevo. En la
  conquista el misionero pierde la inmortalidad y, al morir, lo reemplaza su capitan: el Capitan
  Vargas Toledo (Muldraugh), la Capitana Morrigan Kell (West Point), el Diacono Saul Reyes
  (Riverside) y el Capitan Tito Duarte (Rosewood). Mismos comerciantes y campamento; rangos de
  confianza y perfil del diario propios.
- Los capitanes no rechazan a nadie por su fama, no dan capitulos ni la cura, y solo dan
  encargos inmorales: cobrar tributo, silenciar a un testigo, quemar un refugio (con bencina;
  prende fuego de verdad) y cazar a un fugitivo. Cada uno: -5 de Knox. Todos se pueden
  sabotear (dejar ir a la gente), a cambio de confianza con el capitan.
- Falta revisar en el juego el perfil de la Capitana Kell (`k93_vfd_05`), que sea mujer.

#### Fase 3: Eduardo (hecho, falta probar en el juego)
- Archivo: `shared/Narrador/Arcos/Eduardo.lua` (diario en `NarradorLoreBandido.lua`).
- Con Knox conquistado, Eduardo viene por ti 3 veces, cada 48 horas (`eduardo_atentado`):
  aparece donde estes, pelea un rato (es inmortal) y se retira. En el tercero baja el arma
  ("mi mama decia que todos merecen una segunda oportunidad") y deja una nota con un mapa a su
  base: las casas abandonadas al lado del campo de Fallas Lake (`Narrador.EduardoBase`).
- En Fallas Lake (`eduardo_fallas`):
  - "Vengo a terminar esto": duelo a muerte, la ultima mision del juego (memoria `fin` =
    "eduardo_muerto", -30 de Knox, te quedas con su arma).
  - "Vengo a hablar": la reconquista. Con Eduardo sacas a los capitanes de las 4 ciudades en el
    orden que quieras (al entrar a cada pueblo, +15 de Knox cada una) y al final al jefe del
    patio. En cada ciudad vuelve un misionero nuevo: Valentina Mandados (la hija del Cabo),
    Eduardo (West Point), la Hermana Lucia (la que esperaba al Padre Nacho) y Hector Bencina Jr.
    (el sobrino de la Misia Rosa). Al final: Knox a 45 ("La nueva esperanza"), confianza maxima
    con todos y memoria `fin` = "reconquista".
- Las casas de Fallas Lake estan en 7440,7946 (`Narrador.EduardoBase.cerca_de`).
- PENDIENTE: revisar en el juego el perfil de la Hermana Lucia (`k93_red_cross_08`).

### A. Eventos fortuitos de Eduardo (hecho, falta probar en el juego)
- Archivos: `shared/Narrador/Arcos/EduardoEventos.lua` y `server/Narrador/NarradorEduardo.lua`.
- Despues de conocerlo: una tirada por dia (5% + 1% por dia de partida, tope 40%, 72 horas entre
  uno y otro). Llega corriendo con una horda (60 + 20 por jugador) o con bandidos detras.
- Pelear con el y ganar: +10 de Knox y botin dificil. Esconderse (quedarse cerca): nada. Irse
  lejos mientras pelea: -15. No salen si estas del lado de los bandidos ni si Eduardo murio.

### C. Modo historia de los misioneros (hecho, falta probar en el juego)
- Archivos: `shared/Narrador/Arcos/Capitulos.lua` y `shared/Narrador/NarradorLoreCapitulos.lua`;
  se registran en `G.ESPECIALES`. Fundar el campamento es el capitulo 1 (memoria
  `historia_<id>_1`, tambien en partidas viejas).
- Tia Chela: 2 La radio del cuartel (repuestos, antena y la voz de Eduardo) -> 3 el cientifico.
- Cabo Ramiro: 2 La puerta de atras (rescatar a Gladys Moreno, una de los once; nombra a
  Pereira) -> 3 Valentina (la mision que estaba desactivada, ahora con confianza 4).
- Padre Nacho: 2 El ring de Lexington (reto a puno limpio con el Martillo Duggan) -> 3 La
  muchacha que esperaba (traer a Lucia de una iglesia de otro pueblo).
- Misia Rosa: 2 La ruta 31 (traer al Gordo Earl y su carga) -> 3 El estanque (defender la
  bencinera de noche, con la luz apagada por primera vez).
- Los capitulos que salen mal tambien cuentan como hechos (memoria = "fallido"), para no trabar
  el campamento.
- Por escribir: capitulos 4 en adelante.

### Piezas listas para armar historias
- Oleadas: `{ "oleada", cantidad, fija = true, por_jugador = n, caminantes = true,
  planta_baja = true, meta = "var", meta_frac = 0.8 }`.
- Acompañantes que te siguen y se suben al auto: `{ "acompanante", grupo, rol }`,
  `{ "soltar_acompanante", grupo, rol }` y la condición `{ "npc_cerca", grupo, lugar, radio }`.
- NPC inmune a la zombificación: `{ "inmune", grupo, rol, quien }`; con arma legendaria en la
  mano: `{ "armar_legendario", grupo, rol }`.
- El edificio de un misionero como lugar: `{ "lugar_contacto", id, contacto }`.
- La casa del jugador (refugio o donde esté): `{ "lugar_casa", id }`.
- Reputación con un misionero: `{ "reputacion", contacto, cantidad }`; con Knox: `{ "knox", cantidad }`.
- Mapas de papel: `{ "mapa", lugar, titulo }`.

### Qué ya existe en el código y sirve de base
- Misioneros fijos por ciudad y encargos: `server/Narrador/NarradorContactos.lua`.
- Confianza por misionero y por grupo: `server/Narrador/NarradorReputacion.lua`.
- Encuentros aleatorios con NPCs (de donde saldrían los salvados): `server/Narrador/NarradorEncuentros.lua`.
- Arcos de historia por etapas: `shared/Narrador/Arcos/` y `server/Narrador/NarradorMotor.lua`.
