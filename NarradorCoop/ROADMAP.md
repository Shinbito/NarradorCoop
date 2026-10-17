# Roadmap NarradorCoop

Grafo del codigo (graphify): `NarradorCoop/graphify-out/` (`GRAPH_REPORT.md` para leer, `graph.json` y `graph.html`).
Para actualizarlo: `cd NarradorCoop && graphify update .`
Mapa de historias (que historia abre a cual y por que memoria): `NarradorCoop/MAPA_HISTORIAS.md`.
Para actualizarlo: `python3 NarradorCoop/herramientas/mapa_historias.py` (necesita `pip install lupa`).
Memorias de la partida (que guarda cada una): `NarradorCoop/herramientas/memorias.py`. Al agregar una
memoria nueva, anotarla ahi y correr `python3 NarradorCoop/herramientas/memorias.py`: falla si una
memoria no esta en la lista, si se lee y nadie la escribe, o si se escribe y nadie la lee.
El grafo ignora los `.md`, `herramientas/` y `common/` (`NarradorCoop/.graphifyignore`).

## Pendiente (versión 0.12.0)

### 1. Probar en el juego (lo más importante)
Todo lo de las versiones 0.10, 0.11 y 0.12 está hecho pero sin probar. Lo que más hay que mirar:
- Perfiles de A-Life: Valentina (`k93_hensley_family_03`, que se vea como una muchacha), la
  Capitana Kell (`k93_vfd_05`, que sea mujer), la Hermana Lucía (`k93_red_cross_08`), Eduardo
  (`k93_stockyard_05`) y el doctor Hartmann (`k93_red_cross_02`); y si A-Life le deja el arma en
  la mano a Eduardo.
- El fuego de "quemar un refugio" (encargos inmorales de los capitanes).
- El camino del bandido completo, por las dos rutas (Pereira y Meulen), y la reconquista.
- La brújula con Project Viewpoint (ver "Brújula sigue a la cámara").
- Cuando esté probado: fusionar el PR #1 a `main` (`main` sigue en la versión del 15 de octubre).

### 2. Errores de historia (arreglados en 0.11.0, falta probar en el juego)
- Si el misionero nuevo de la reconquista murió antes, lo reemplaza un Bell que siga vivo en tu
  refugio; si no queda ninguno, un mercader de paso (`DD.NUEVO_MURIO` y `DD.REEMPLAZOS` en
  `NarradorDominiosDefs.lua`, `D.reemplazo` en `NarradorDominios.lua`, memoria `nuevo_<id>`):
  - Muldraugh, si Valentina murió (`hija_cabo` = muerta): Daniel, Wade o Yvonne, en ese orden.
  - Riverside, si la Hermana Lucía murió (`lucia` = muerta): Yvonne, Daniel o Wade.
  - Rosewood, si el sobrino de la Misia Rosa murió en la misión de la cura (`cura_rosewood` =
    murio, nueva): Wade, Daniel o Yvonne.
  - El Bell que pasa a ser misionero deja el refugio. Los textos de la reconquista lo nombran
    con la plantilla `{nuevo:<id>}`.
- Si el doctor Hartmann murió (`cientifico_hartmann` = muerto), el curandero de la Chela es un
  mercader de paso al azar (`K.MERCADERES`, campo `murio` en `por_contacto`).

### Los Bell en tu refugio (hecho en 0.11.0, falta probar en el juego)
- Archivo: `server/Narrador/NarradorBell.lua` (acción `bell_quedarse` en los finales de los Bell).
- En los finales en que sobreviven se quedan a vivir en el refugio: inmortales, limpian la zona
  (dejan 2 zombis como máximo en 30 casillas) y conversan (`Narrador.Charlas.bell_refugio`).
- Cuando ven venir una horda o un ataque (aviso de una amenaza a menos de 200 casillas del
  refugio, o una oleada que aparece cerca) arrancan para salvarse: desaparecen y vuelven entre 6
  y 12 horas después, cuando ya no hay peligro y hay alguien cerca, con dos cosas chicas
  (comida, vendas, pastillas, cartuchos, clavos o desinfectante).
- Partidas de antes: si estaban como residentes (final del engaño) se pasan solos; si no hay nada
  guardado, vuelve solo Daniel, que nunca se infecta.
- Prueba: `python3 NarradorCoop/herramientas/pruebas/correr.py`.

### Los que ya no están (hecho en 0.11.0, falta probar en el juego)
- Archivos: `shared/Narrador/NarradorCaidosDefs.lua` (quién es importante y qué se escribe) y
  `server/Narrador/NarradorCaidos.lua`. Diario: Notas -> "Los que ya no están".
- Cuando muere de verdad un personaje importante (no si se retira o se descarga), sale su nombre
  tachado, la fecha y un homenaje. Si lo mató el jugador, o es un misionero que murió en la
  conquista, va en rojo con un lamento ("en qué me convertí"). Deja también una línea en el
  registro.
- La gente sin nombre propio en la trama (encuentros, víctimas de los encargos inmorales) solo
  se anota si la mataste tú, con un lamento genérico.
- Prueba: `herramientas/pruebas/prueba_caidos.lua`.

### Sous con el aspecto de sus fotos y modelos del sexo correcto (hecho en 0.11.0, falta probar)
- `Mundo.crearFaccion` acepta `aspecto` (piel 0 a 4, peinado, barba y sus colores, con los nombres
  de `hairStyles.xml` / `beardStyles.xml`) y `tintes` (color "r,g,b" por prenda) en cada integrante.
- Sous (versión 3 de la facción, se reescriben los perfiles): Akagami, Zent, Tati, Walita,
  Cristonks, Hasag, Wertres, Matric y Shinbo según sus fotos (versión 5). Meulen Canupan sin foto:
  aspecto mapuche (piel morena, pelo largo con trarilonco, chaleco de tejido, trapelacucha), igual
  en sus tres perfiles (Sous, su banda y jefe del patio).
- Se revisaron todos los perfiles k93 del mod contra el catálogo de A-Life (`body.sex`): Lucía,
  Hartmann, el Diácono Reyes, el Capitán Duarte, Marta y Luis Ibáñez, Oscar Lagos, Benjamín
  Sotelo, Kevin Morales, el respaldo de Pereira y dos mercaderes tenían el sexo cambiado. Las
  mujeres con nombre tienen `femeninos` (Gladys, Lucía, Paula, Marta y las sobrevivientes de la
  escuela).
- Los NPCs de Sous que ya estaban en el mundo pueden seguir con la ropa vieja hasta que vuelvan
  a aparecer.

### 3. Técnico (hecho en 0.11.0)
- Chequeo automático en GitHub (`.github/workflows/chequeos.yml`) en cada push y pull request:
  que todos los `.lua` compilen, la lista de memorias, el mapa de historias (y que esté al día) y
  las pruebas de `herramientas/pruebas/`. Se puede correr todo a mano con los mismos comandos.
- `mapa_historias.py` revisa que cada historia que el servidor lanza (`BA.lanzar`,
  `Motor.iniciar` con un id escrito) esté en `LANZADORES`, y que `LANZADORES` no tenga ids que no
  existen.
- Las 9 funciones que `NarradorDominios.lua` envuelve tienen un comentario en su archivo original.
- Los archivos del servidor ya no llaman directo al juego: `Mundo.datosGuardados`,
  `Mundo.enviarCliente`, `Mundo.es`, `Mundo.incendiar`, `Mundo.quitarZombis`,
  `Mundo.ponerPuerta` y `Mundo.quitarCadaver`. Quedan dos archivos compartidos
  (`NarradorLegendario.lua` y `NarradorCura.lua`) que corren también en el cliente, donde
  `Mundo` no existe.
- El motor quedó repartido: `NarradorMotor.lua` (estado, textos, comunicación, etapas, inicio y
  fin, pulso y comandos) carga al final `NarradorMotorCondiciones`, `NarradorMotorAcciones`,
  `NarradorMotorGrupos` y `NarradorMotorCharlas`. Igual `NarradorMundo.lua` con
  `NarradorMundoALife`. Se comparó que el motor y `Mundo` tengan las mismas funciones que antes.
- Eduardo ya no se llama `tomas` en el código (`leyenda_eduardo`, `eduardo_vuelve`,
  `eduardo_conocido`...). `Motor.migrar` cambia las partidas guardadas una sola vez.
- Quedan grandes `client/Narrador/NarradorConversacion.lua` (1412 líneas, interfaz del cliente,
  que no se puede probar fuera del juego) y `Arcos/Sous.lua` (1309, los datos de una sola
  historia). Partirlos no tiene mucha ganancia; se puede ver más adelante.

### 4. Contenido
- Capítulos 4 en adelante de cada misionero.
- ~~Más consecuencias para las memorias "solo de registro" (encuentros, alijo, trueque...).~~ Hecho
  para arsenal, denise, lucas, trueque, alijo y desertor (ver "Consecuencias de las decisiones");
  quedan solo de registro cal.fonda, eduardo_vivo, bandido_ultimo, asalto y las del motor.

## Versión 0.12.0: hecho el 17 de octubre (falta probar en el juego)
- Mapa anotado que cerraba el juego (texto sin fuente en la API v1 de simbolos).
- Puertas dobles en los campamentos (una puerta abierta no se reconocia por el sprite).
- A-Life dejaba un zombi en lugar del NPC si fallaba `sendItemStats` al cargarlo.
- Misioneros: se reponen solos si su NPC falta o esta roto con alguien cerca; boton de admin.
- Mision 1 de los misioneros: se borran los zombis que habia; kit inicial (pistola, cargador,
  funda, cinturon, mochila, balas segun zombis y arma legendaria del misionero).
- Horda en camino: 25 a 100 zombis segun dias y campamentos, va a la casa y hace ruido.
- Bandido: "Redimido" si atacas a la banda del patio; campamento del patio con 10 bandidos mas;
  la banda con ropa, peinado y barba propios.
- Contador de bajas al dia; asesino tomado de A-Life cuando la muerte llega sin asesino;
  atacar a una faccion de la historia cuenta como traicion; perdon de A-Life al volver a ser amigos.
- Grupos de NPCs en tandas de 4 (A-Life crea maximo 8 por pedido) y se completan los grupos cortos.
- Base de Sous fija por pueblo (`Narrador.SousBases`). Meulen Canupan (antes Maulen Callupan).
- Admin: "Respawnear NPCs de las historias activas" y "Arma legendaria de un misionero".
- Libreta: boton para seguir una mision. Frases sobre la cabeza si no sale la burbuja de A-Life.
- Poster y foto de Sous: la cara de la imagen salia en espejo.

## Pedidos nuevos (17 de octubre)

### Modo historia de cada integrante de Sous (por hacer)
- Hechas (falta probar en el juego) las de Walita, Cristonks, Hasag y Wertres:
  `shared/Narrador/Arcos/HistoriasSous2.lua`, lanzador en `server/Narrador/NarradorHistoriasSous2.lua`
  (Sous aliado, una a la vez, 30 horas entre historias de Sous; memoria `sous_historia_<rol>`).
- Cada integrante de Sous tiene su propia historia secundaria. Al terminarla te da su arma
  legendaria (como el kit de los misioneros: `C.armaKit` y `Narrador.Legendario`).
- En esas historias aparecen los amigos de Sous (perfiles propios, como los de `Narrador.Facciones`):
  - **Waton Ju**: primo de Walita; vivieron juntos en Iquique hasta que Walita tenia 12 (despues
    Walita se fue a Arica, donde tenia su taller; nunca vivio en Antofagasta). Nunca llego a nivel
    70 para jugar DZ en PXG (la talla de siempre).
  - **Claudio Clau**: chico y moreno; polera normal y jeans apretados. Amigo de todos en Sous.
    Puede aparecer en cualquier historia y al final se une a Sous.
  - **Fucking Luengo**: chef, rubio, alto y con el pelo corto. Amigo de todos; es parte de Sous
    pero no del gaming.
  - **Renaaaaaato**: flaco, blanco, pelo negro con peinado normal. Amigo de todos; fanatico del Counter.
- Lore que tiene que estar en esas historias: la talla eterna de que los primos Cristonks y Hasag
  "se comen" y por eso se van tanto juntos a la nieve; Matric es el que mas sospecha. (Las
  primeras frases ya estan en `Narrador.Charlas.sous_base`.)

### La venganza de Meulen (por hacer)
- Despues de que Meulen muere (final de la historia de Sous), un tiempo despues reaparece vivo:
  dice que la Pachamama lo trajo de vuelta. Ahora busca venganza.
- Ataque al refugio: Meulen llega con una banda de bandidos a tu refugio. Durante el ataque
  vuelve a salir vivo "por nada" (se escapa en el ultimo momento, no se le puede matar ahi).
- Persecucion por pistas: siguiendo lo que dejo en el camino (notas, cuerpos, un mapa) se llega a
  su base nueva, con su banda. Ahi si se le mata, de verdad.
- Piezas que ya existen: `bandidos` con `salud` alta e inmortal en una etapa (como Meulen en el
  escondite de Sous), `mapa` y `nota` para las pistas, `retirar_lejos` para la huida, y la
  "Horda en camino" para el ataque al refugio (lugar "casa" + "ruido").
- Engancha con "Reclutar a Sous": la opcion "Sigueme" se abre recien cuando Meulen esta muerto
  de verdad (al final de esta historia).

### Reclutar a Sous: "Sigueme" (por hacer)
- Sous tiene su propia confianza, como la de los misioneros (`NarradorReputacion.lua`), pero solo
  sube ayudandolos con sus misiones (no con encargos sueltos ni regalos).
- Cuando termina la historia de Sous y Meulen esta muerto, en la conversacion con cada integrante
  aparece la opcion "Sigueme". Se puede reclutar a todos los que quieras.
- Base: `Mundo.acompanar` (postura "caminar con" de A-Life) y la renovacion de
  `NarradorPasajeros.lua`. Falta decidir como se les dice que vuelvan a la base.

### La base de Sous viva (hecho, falta probar en el juego)
- Sous en su base (amigos) usa modo "guard" con correa 12: se quedan adentro.
- La primera vez que alguien pasa con la zona cargada se amuebla la base una sola vez (memoria
  `sous_base`, `server/Narrador/NarradorSousBase.lua`): mesas grandes con una baraja, una silla por
  integrante, sacos de dormir, bidones de agua (15 L) y un generador afuera pegado a la pared,
  conectado y prendido; cada 12 horas se rellena solo.
- Cada uno tiene su silla como puesto de guardia de A-Life (stance "garrison", rol "sit") y A-Life
  los sienta; sentados a la mesa hablan de cartas (`Narrador.Charlas.sous_cartas`).
- Probar: que los sienta de verdad (si no, mirar la opcion "Idle_BenchSeat" de A-Life), que el
  generador da luz al galpon y que los muebles se ven en otros clientes.

### Maniqui del misionero (por hacer)
- Cuando el NPC del misionero no esta, un maniqui fijo vestido como el en su puesto; con clic
  derecho se le pueden pedir misiones igual mientras el mod intenta reponer al NPC.

### Los Bell durante su historia (por decidir)
- La pista de "acogidos" (la espera de 3 horas de juego antes de que Daniel pida el suero) tiene
  que decir que hay que esperar. Opcional: que no los mate una horda mientras dura su historia.

### Brujula con Project Viewpoint (por hacer)
- Viewpoint guarda el angulo de la camara en Java (`viewpoint.FP.viewYaw`) y no lo expone al Lua.
  Hace falta un mini mod Java (ZombieBuddy) que lo pase al Lua; mientras tanto la brujula usa la
  direccion del personaje.

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

### Misión: la hija del Cabo Ramiro (hecho, falta probar en el juego)
- Archivo: `shared/Narrador/Arcos/HijaCabo.lua`. Es el capítulo 3 del Cabo: sale entre sus
  ofertas con su capítulo 2 hecho y confianza 4 (`G.ESPECIALES`).
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

### Modo historia de cada misionero (hecho hasta el capitulo 3, falta probar)
- Cada misionero tiene sus capitulos. Capitulo 1 = su desbloqueo (fundar el campamento).
  Los siguientes salen entre sus ofertas cuando el anterior ya se hizo (`G.ESPECIALES` en
  `server/Narrador/NarradorGenerador.lua`; cada capitulo deja la memoria `historia_<id>_<n>`).
- Hechos los capitulos 1 a 3 de los cuatro (detalle en "C. Modo historia de los misioneros").
  Por escribir: capitulos 4 en adelante.
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

## Consecuencias de las decisiones (hecho en 0.11.0, falta probar en el juego)
Las 5 memorias que se escribían y nadie leía ahora tienen consecuencia (`memorias.py` ya no tiene
pendientes):
- `bell_culpa` (le diste una falsa a los Bell): Meulen lo sabe y te lo dice cuando te llama al
  patio; en Sous, Martín Zent y David escuchan a los Bell hablar maravillas de ti.
- `curandero_falso`: el doctor Hartmann es el que les vendió las pastillas de azúcar a los Bell;
  te lo confiesa al llegar al cuartel de la Chela (cap. 3) y queda en el diario.
- `pereira_desconfia` (sobreviviste a los cazadores): el jefe del patio te avisa que te vigila y
  desde ahí cada sabotaje pesa 45% en vez de 30% (`BA.DESCONFIANZA`).
- `radio_westpoint` (arreglaste la radio de la Chela, cap. 2): los avisos de amenazas llegan por
  la radio y un cuarto de hora antes (`A.EXTRA_RADIO`).
- `estanque_rosewood` (defendiste el estanque, cap. 3): cada 72 horas, cuando pasas por la
  bencinera, la Misia Rosa te deja un bidón lleno (`server/Narrador/NarradorConsecuencias.lua`).

### Más consecuencias (falta probar en el juego)
Siete historias cortas nuevas en `shared/Narrador/Arcos/ConsecuenciasExtra.lua`: salen una sola
vez (`max_veces = 1`), las elige el Director días después (`si` = la memoria del final), y una
frase de misionero en `server/Narrador/NarradorConsecuencias.lua`:
- `denise` = rescatada → "La promesa de Denise": Lonnie te trae la comida que Denise prometió
  cocinarte (Knox +5).
- `denise` = asesinada → "El hermano de Denise": Lonnie y 2-3 amigos te salen a cazar (Knox -5).
- `lucas` = rescatado → "Lo que encontró Lucas": te marca una farmacia intacta (remedios + nota).
- `lucas` = asesinado → "La madre de Lucas": Loretta lo cuenta en todo Knox (Knox -15).
- `trueque` = ganado → "El cobro del trueque": los hermanos de los emboscadores vienen a cobrar
  (4-5 bandidos; si los matas, Knox +5).
- `alijo` = encontrado → "La viuda del alijo": Marta Quiroz pide su parte en tu refugio. Compartir
  comida: Knox +10; negarte: Knox -5; matarla: Knox -15 (`alijo` pasa a compartido/negado/viuda_muerta).
- `desertor` = protegido → "Ray vuelve": Ray Doyle llega con una patrulla de la Guardia detrás y
  pelea contigo (munición y Knox +10).
- `arsenal` (arma/traje/auto) → el primer misionero vivo al que te acerques comenta lo que
  sacaste del arsenal (una vez, memoria `arsenal_comentado`).

## Historias del roadmap (hechas en 0.11.0, falta probar en el juego)

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

#### Meulen como jefe (hecho, falta probar en el juego)
- En Sous, si vas solo al escondite y Meulen sigue vivo un cuarto de hora, se rinde. Si lo
  dejas ir, Sous cree que se escapo (memoria `maulen_salvado`).
- 72 horas despues Meulen mata a Pereira y se queda con el patio (`bandido_maulen`): te deja una
  nota porque te debe la vida, sin importar tu Knox. Si ya trabajabas para Pereira, sigues con
  el desde el capitulo en que ibas. Los capitulos 2 a 5 cambian de dialogos y diario segun el
  jefe (memoria `bandido_jefe`).

#### Fase 2: la conquista de Knox (hecho, falta probar en el juego)
- Archivos: `shared/Narrador/Arcos/Conquista.lua`, `shared/Narrador/Arcos/Inmorales.lua`,
  `shared/Narrador/NarradorDominiosDefs.lua` y `server/Narrador/NarradorDominios.lua`.
- Con Meulen de jefe, primero la base de Sous (si Sous es aliado y sigue en su base). Despues la
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
