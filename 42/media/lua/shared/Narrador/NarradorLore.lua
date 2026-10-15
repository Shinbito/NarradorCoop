-- Narrador Co-op: lo que se escribe en el diario de vida del jugador.
-- Cada historia tiene una entrada por etapa (lo que el personaje anota en su cuaderno) y
-- un epilogo por final. El servidor resuelve las plantillas ({lugar:x}, {var},
-- {nombre:var}, {por_var=..., textos={...}}) y se las manda al cliente en la vista.
--
-- Reglas: sin tildes ni enies (el juego no siempre las muestra), primera persona, como si
-- lo escribiera el sobreviviente al final del dia. Nada de listas al azar: el texto tiene
-- que ser el mismo cada vez que se abre el diario.

Narrador = Narrador or {}

local Lore = Narrador.Lore or {}
Narrador.Lore = Lore

-- Historia principal: id del arco -> numero de capitulo.
Lore.CAPITULOS = { familia_infectada = 1, sous = 2, sous_guerra = 3, sous_arsenal = 4 }

-- Lo que se ve cuando una seccion del diario esta vacia.
Lore.VACIO = {
    principal = "Las paginas siguen en blanco. Por ahora la unica historia es la de siempre: comer, dormir, no hacer ruido. Algo me dice que eso no va a durar.",
    principal_cerrada = "Lo que tenia que pasar, paso. El resto de este cuaderno es mio.",
    secundaria = "Nadie ha golpeado la puerta pidiendo nada. Todavia. En este condado eso nunca dura mucho.",
    encargo = "Ningun encargo pendiente. Los misioneros siempre tienen pega, si me acerco a pedirla.",
}

-- Texto corto que acompana a cada misionero en la seccion de notas.
Lore.CONTACTOS = {
    muldraugh = "Ex cabo de policia. Anota todo en una libreta y habla como si yo estuviera detenido. Paga lo que promete.",
    westpoint = "Bombera voluntaria de toda la vida. Me reta como si fuera mi tia y despues me pasa trabajo. No le discuto.",
    riverside = "Pastor de la iglesia del pueblo. Bendice cada salida y admite que la mitad de sus encargos los inventa.",
    rosewood = "Atiende una bencinera sin bencina. Dice que nunca cierra. Le debo un par de cigarros.",
}

Lore.NIVELES = {
    facil = "Trabajo facil, segun el.",
    medio = "Trabajo con riesgo. Pagan mejor.",
    dificil = "Trabajo peligroso. Hay que ir preparado.",
    ultra = "Louisville. Nadie vuelve entero de ahi.",
}

Lore.arcos = {}

-- ===========================================================================
-- Capitulo 1: Los Bell
-- ===========================================================================
Lore.arcos.familia_infectada = {
    intro = "Uno se acostumbra a no ver caras vivas. Por eso cuando aparecieron en la puerta de mi refugio casi les disparo por reflejo.",
    etapas = {
        encuentro = "Una familia en mi puerta: Daniel, Yvonne y el chico, Wade. Manos arriba, ropa sucia, ojos de no dormir hace dias. Piden quedarse. El padre habla rapido, como si temiera que lo interrumpa con un balazo. Alguno de ellos esta enfermo, eso se nota. Lo que no se es cual, ni de que.",
        acogidos = "Les hice un espacio en {lugar:refugio}. Yvonne ordeno el rincon como si fuera una casa de verdad. Wade me sigue a todos lados con preguntas. Daniel cuida la puerta aunque nadie se lo pidio. Hace tiempo que este lugar no tenia tanto ruido.",
        pide_ayuda = {
            por_var = "infectado",
            textos = {
                hijo = "Daniel me agarro del brazo y me lo confeso de un tiron: a Wade lo mordieron. Dice que en {lugar:laboratorio} un medico repartia un suero para los mordidos. No se si creerle al medico, pero le creo al padre. Hay que ir antes de que se acabe el tiempo.",
                madre = "Daniel me lo dijo en voz baja, lejos del chico: a Yvonne la mordieron hace dos dias. Habla de un suero en {lugar:laboratorio}, de un medico que lo repartia. Yvonne sigue sonriendo para que Wade no se asuste. No tengo mucho tiempo.",
                nadie = "La fiebre de Wade no baja y Daniel ya no duerme. Me hablo de un suero experimental en {lugar:laboratorio}. Nadie lo mordio, juran. Puede ser una gripe. Puede no serlo. Igual voy a ir a ver.",
            },
        },
    },
    finales = {
        final_salvados = "{nombre:infectado} paso la peor noche que he visto. Al amanecer la fiebre se corto. El suero era real. Daniel me abrazo sin decir nada. Ahora hay tres personas en este mundo que me deben la vida, y yo no se muy bien que hacer con eso.",
        final_engano = "Les di una pastilla de azucar y guarde la verdadera en mi mochila. {nombre:infectado} se levanto distinto esa noche. Daniel me abrazo y me dio las gracias por intentarlo. Me las sigue dando cada manana. Nunca lo va a saber. Yo si.",
        final_falso_remedio = "El suero era agua con azucar. Alguien en {lugar:laboratorio} le vendio esperanza a gente desesperada. {nombre:infectado} se levanto distinto esa noche. No voy a olvidar el grito de Daniel.",
        final_transformado = "No alcance. Volvi tarde y en {lugar:refugio} ya no estaba {nombre:infectado}, estaba otra cosa con su ropa. Escribo esto con las manos temblando.",
        final_era_gripe = "Era una gripe. Una gripe comun, de las de antes. Le di el suero igual y nunca voy a saber si sirvio. Wade ya corre por el refugio. Daniel dice que me debe una. Yo dormi doce horas seguidas.",
        final_se_curo_solo = "La fiebre de Wade se fue sola. Era una gripe y nada mas. Me rei por primera vez en semanas. Los Bell se quedan.",
        final_abandonados = "Les dije que se fueran. Se fueron al amanecer, sin pelear. No me despedi. Me digo que hice lo correcto. Me lo voy a seguir diciendo.",
        final_masacre = "Los Bell estan muertos en {lugar:refugio}. Fue {quien_mato}. No hay mucho mas que escribir. Ojala hubiera menos.",
        final_muertos = "Los Bell murieron en {lugar:refugio}. No fui yo, pero tampoco estuve. Tape los cuerpos con una frazada. Wade todavia tenia un dibujo en el bolsillo.",
        final_olvidados = "Encontre una nota en la puerta de {lugar:refugio}: la familia Bell golpeo, nadie abrio, siguieron al norte. Nunca les vi la cara.",
    },
}

-- ===========================================================================
-- Capitulo 2: Sous
-- ===========================================================================
local ESCUADRA = {
    trio = "Akagami, Zent y Walita",
    jovenes = "Matric, Tati y Shinbo",
    tsz = "Tati, Shinbo y Zent",
    dupla = "Wertres y Shinbo",
    todos = "casi todo Sous",
}

Lore.arcos.sous = {
    intro = "Despues de lo de los Bell llego un tipo demasiado bien vestido para el fin del mundo. Dijo que venia de parte de un grupo llamado Sous. Desde ese dia mi cuaderno tiene mas nombres que paginas.",
    etapas = {
        viaje = "Bastian Tati, de Sous, me dejo indicaciones para llegar a su base en {lugar:base_sous}. Dijo que preguntara por Martin Akagami y que fuera armado. Hablaba como si me conociera de toda la vida. Voy a ir a ver que tienen.",
        base = "Llegue a la base de Sous. Son diez, casi todos chilenos, casi todos amigos de antes de que esto empezara. Se tiran tallas todo el rato, entrenan en una barra oxidada y discuten turnos de guardia como si fuera la final de algo. El lider, Martin Akagami, me mira como evaluando si sirvo. Tengo que hablar con el.",
        encargo1 = "Primer trabajo para Sous: medicina. Cristobal Wertres, el grandote de casi dos metros, hace de medico sin serlo y ya no le queda nada. En {lugar:farmacia} deberia quedar algo. Mientras salia, Maulen, el encargado del deposito, me deseo suerte en voz muy baja.",
        volver1 = "Tengo la medicina. Hay que llevarsela a Wertres en {lugar:base_sous} antes de que alguien en la base empeore.",
        encargo2 = "Segundo trabajo: armas. Akagami dice que sin armas no pasan el invierno, y Jorge Hasag ya saco la cuenta de cuanto vale la base con ellas. En {lugar:armeria} hay algo. Tambien hay saqueadores, segun dicen. Maulen guardo la medicina en el deposito. Dijo que ahi esta mas segura.",
        volver2 = "Tengo las armas de {lugar:armeria}. Sous me espera en {lugar:base_sous}. Hanz Walita prometio tallarme una medalla. Espero que sea chica.",
        encargo3 = "Maulen me paso el tercer encargo, dice que de parte de Akagami: revisar {lugar:senuelo}, que ahi hay de todo. Me lo dijo sonriendo, educado como siempre. Hay algo en como lo dijo que no me termina de cerrar. Seguramente estoy cansado.",
        trampa = "En {lugar:senuelo} no habia nada. Nada. Solo muertos y una nota doblada con la letra de Maulen pidiendome perdon por hacerme caminar. Tengo un mal presentimiento. Vuelvo a la base ahora.",
        pistas = "Maulen vacio el deposito de Sous y desaparecio con todo: la medicina, las armas, la comida. Todo lo que traje, mientras yo estaba lejos persiguiendo nada. Akagami esta furioso consigo mismo. Hay que revisar el deposito saqueado por si dejo algun rastro.",
        abandonado = "Un recibo arrugado en el deposito me lleva a {lugar:abandonado}. Maulen paso por ahi. El lugar esta repleto de muertos. Si dejo algo escrito, tiene que estar adentro.",
        plan = "Encontre el diario de Maulen. Escribio que nadie lo iba a buscar en {lugar:escondite}. Puedo ir solo y terminar esto rapido, o volver a {lugar:base_sous} y pedir que vengan conmigo. Si voy con ellos, Maulen no va a estar solo: ya debe saber que lo buscan.",
        reclutar = "Volvi a la base. Todos quieren ir a buscar a Maulen, cada uno a su manera. Tengo que elegir quien viene conmigo. Mientras mas sean, mas grande va a ser la banda que Maulen junto.",
        viaje_solo = "Decidi ir solo a {lugar:escondite}. Esto empezo conmigo, porque fui yo el que se fue cuando Maulen me lo pidio. Termina conmigo.",
        escondite = "Estoy cerca de {lugar:escondite}. Maulen esta solo, con todo lo que le robo a Sous. Tengo que encontrarlo antes de que se vuelva a esfumar.",
        marcha = {
            por_var = "escuadra",
            textos = {
                trio = "Akagami, Zent y Walita salieron antes que yo hacia {lugar:escondite}. Los tres de siempre: uno da las ordenes, otro las critica, el otro se rie. Me esperan alla.",
                jovenes = "Matric, Tati y Shinbo salieron antes hacia {lugar:escondite}. Matric no paro de hablar ni para amarrarse las zapatillas. Me esperan alla.",
                tsz = "Tati, Shinbo y Zent salieron antes hacia {lugar:escondite}. Zent ya calculo nuestras probabilidades y no quiso decirlas en voz alta. Me esperan alla.",
                dupla = "Wertres y Shinbo salieron antes hacia {lugar:escondite}. Siempre juntos. Uno mira lejos por altura, el otro mira de cerca por costumbre. Me esperan alla.",
                todos = "Casi todo Sous salio antes que yo hacia {lugar:escondite}. Cristian y Jorge siguen en el cerro buscando a Maulen por su cuenta. Me esperan alla.",
                otro = "La gente de Sous salio antes que yo hacia {lugar:escondite}. Me esperan alla.",
            },
        },
        escondite_grupo = {
            por_var = "escuadra",
            textos = {
                trio = "Llegamos a {lugar:escondite}. Maulen no esta solo: junto una banda. Akagami ya esta dando ordenes como si fuera un partido. Hay que terminar esto juntos.",
                jovenes = "Llegamos a {lugar:escondite}. Maulen junto una banda. Tati se arreglo la chaqueta antes de entrar. Matric dice que tiene el corazon a mil pero no se queda atras.",
                tsz = "Llegamos a {lugar:escondite}. Maulen junto una banda. Zent cuenta enemigos en voz baja, Shinbo mira las salidas, Tati ya esta adelante.",
                dupla = "Llegamos a {lugar:escondite}. Maulen junto una banda. Wertres se puso adelante para taparnos. Shinbo no se le despega.",
                todos = "Llegamos a {lugar:escondite} con casi todo Sous. Maulen junto una banda grande. Esto se va a poner feo.",
                otro = "Llegamos a {lugar:escondite}. Maulen junto una banda. Hay que terminar esto.",
            },
        },
        decision = {
            por_var = "hubo_bajas",
            textos = {
                ["true"] = "Maulen Callupan esta muerto. Lo robado esta aqui, en {lugar:escondite}: comida, armas, medicina. Pero la pelea costo caro: {bajas_nombres}. Ahora tengo que decidir. Devolverle todo a Sous... o quedarme con todo.",
                otro = "Maulen Callupan esta muerto. Todo lo que robo esta aqui, en {lugar:escondite}. Podria devolverselo a Sous. Podria quedarmelo. Nadie de afuera sabria la diferencia. Yo si.",
            },
        },
        devolver = "Cargue los suministros. Sous esta esperando en {lugar:base_sous}. Cristian y Jorge volvieron del cerro sin encontrar nada, y Jorge ya esta haciendo la cuenta de lo que falta.",
    },
    finales = {
        final_aliados = {
            por_var = "hubo_bajas",
            textos = {
                ["true"] = "Le devolvi todo a Sous. Esa noche no hubo celebracion: {bajas_nombres} no volvieron. {lider_nombre} me dio su palabra igual. Desde hoy, Sous es mi gente.",
                otro = "Le devolvi todo a Sous. Hubo musica de una radio arreglada con dos cables, carne de lata en el fuego y discusiones de pelota hasta tarde. {lider_nombre} me dio su palabra: desde hoy, Sous es mi gente.",
            },
        },
        final_mentira = "Nadie de Sous quedo vivo para ver lo que paso en {lugar:escondite}. Volvi con una historia: Maulen mato a {bajas_nombres} y escapo con todo. Me creyeron. Por ahora. Escribo esto y no me reconozco la letra.",
        final_te_quedaste = "Me quede con lo que Maulen le robo a Sous. Alguien lo supo. Para ellos ahora soy igual que el. Peor, porque a mi me querian.",
        final_traicion = "Hay sangre de Sous en mis manos. Los que quedan no lo van a olvidar. Yo tampoco.",
        final_negado = "Le dije a Sous que no era mi problema. Akagami asintio y no insistio. Cada uno ve por los suyos.",
        final_sous_caidos = "Los muertos llegaron a la base antes que yo. Sous cayo en su propia casa. Encontre la barra oxidada donde entrenaban, tirada en el patio.",
        final_maulen_escapa = "Maulen se esfumo con todo. Sous nunca recupero lo suyo, y yo nunca pude mirar a Akagami a la cara de nuevo.",
        final_nunca_fuiste = "Nunca fui a la base de Sous. A veces pienso en el tipo bien vestido que vino a buscarme. No volvi a saber de ellos.",
    },
}

-- ===========================================================================
-- Capitulo 3: La guerra con Sous
-- ===========================================================================
Lore.arcos.sous_guerra = {
    intro = "Sous ya no me abre la puerta. Ahora me busca.",
    etapas = {
        represalia = "Silbidos que no son de pajaros. Pasos que se detienen cuando yo me detengo. Sous mando a los suyos a cazarme. Conozco sus voces, y eso lo hace peor.",
        asalto = "Lo que queda de Sous se encerro en {lugar:base_sous}. No van a dejar de buscarme mientras sigan vivos. Tengo que ir yo. Tengo que terminar esto.",
    },
    finales = {
        final_sous_eliminado = "Sous ya no existe. Entre las cosas de Akagami habia una de sus listas, la ultima, y un mapa marcado con un arsenal. No lei la lista.",
    },
}

-- ===========================================================================
-- Capitulo 4: El arsenal
-- ===========================================================================
Lore.arcos.sous_arsenal = {
    intro = "El ultimo capitulo de esta historia esta en Louisville, en un deposito militar que nadie ha vaciado todavia.",
    etapas = {
        viaje = {
            por_var = "sous",
            textos = {
                aliados = "{sous_lider_nombre} vino en persona a decirme que encontraron donde el ejercito guardaba sus armas: {lugar:arsenal}. Sous cuida la base, yo hago la parte dificil. Lo que saque, dicen, es mio. Va a estar repleto.",
                otro = "El mapa de Sous marca un arsenal militar en {lugar:arsenal}. Si sigue ahi, nadie lo ha tocado. Si nadie lo ha tocado, es porque esta repleto.",
            },
        },
        arsenal = "Estoy en {lugar:arsenal}. Cientos de muertos y saqueadores rondando. En algun lado hay una caja del ejercito. Si la encuentro, salgo de aqui distinto.",
        premio = "Tengo la caja. Tres compartimentos y solo alcanzo a abrir uno antes de que me encuentren: un arma, un traje o las llaves de un vehiculo. Tengo que elegir.",
    },
    finales = {
        final_arma = "Del arsenal saque un arma como no hay otra en el condado. Pesa justo lo que tiene que pesar.",
        final_traje = "Del arsenal saque un traje de proteccion militar en perfecto estado. Por primera vez en meses no tengo miedo de un rasguno.",
        final_auto = "Del arsenal me lleve un vehiculo preparado para el fin del mundo. Ahora el condado se ve mas chico.",
        final_saqueado = "Alguien llego antes al arsenal. Estaba vacio. Me quede un rato sentado en el suelo, mirando las cajas abiertas.",
    },
}

-- ===========================================================================
-- Historias secundarias
-- ===========================================================================
Lore.arcos.horda_en_camino = {
    etapas = {
        preparacion = "Un explorador llego sin aire a avisar: viene una horda enorme desde el norte y pasa por aqui. Tengo unas pocas horas para tapar ventanas, juntar municion y decidir si me quedo o corro.",
        llega = "Ya se escucha. Miles de pies arrastrandose al mismo tiempo, como un rio. Llegaron. Solo queda aguantar.",
    },
    finales = { final_paso = "La horda paso. Sigo en pie. Las paredes tienen marcas de manos que antes no tenian." },
}

Lore.arcos.alijo_custodiado = {
    etapas = {
        rumor = "Un desconocido me dejo la nota de un moribundo: provisiones escondidas en {lugar:alijo}. Latas, municion, vendas. Si son reales, alguien las va a encontrar. Mejor que sea yo.",
        llegada = "Llegue a {lugar:alijo}. Las provisiones estaban. Los muertos tambien. Hay que limpiar y cargar lo que se pueda.",
    },
    finales = {
        final_encontrado = "El alijo era real. Le debo una a un muerto que nunca conoci.",
        final_perdido = "Nunca fui por el alijo. Algun otro se lo habra llevado.",
    },
}

Lore.arcos.sobreviviente_acorralada = {
    etapas = {
        gritos = "Lonnie Hensley llego gritando: su hermana Denise esta atrapada en {lugar:casa}, rodeada. El se escapo y no se lo perdona. No hay tiempo. Tengo que llegar antes de que caiga la puerta.",
        rescate = "Encontre a Denise en {lugar:casa}, con un cuchillo de cocina y los nudillos blancos de apretarlo. Vienen mas. Tengo que mantenerla viva hasta que pase la ola.",
    },
    finales = {
        final_rescatada = "Denise salio viva de {lugar:casa}. Me regalo su mochila y se fue a buscar a su hermano. Ojala lo encuentre.",
        final_muerta = "No alcance a protegerla. Denise murio en {lugar:casa}. Nadie va a contarle a Lonnie como fue. Yo tampoco.",
        final_traicion = "Denise murio en {lugar:casa}, y no fueron los muertos. Fue {quien_mato}.",
        final_tarde = "No llegue a tiempo a la casa de Denise. No quiero saber como termino.",
    },
}

Lore.arcos.trueque_trampa = {
    etapas = {
        ir = "Ofrecen un trueque en {lugar:punto}: comida por remedios, sin armas. El que trajo el mensaje no me miro a los ojos ni una vez. Voy a ir. Armado.",
        emboscada = "No habia trueque. Era una trampa. Estan por todos lados en {lugar:punto}. Tengo que salir vivo de aqui.",
    },
    finales = {
        final_ganada = "Los de la emboscada no le van a tender otra trampa a nadie. Tenian comida guardada. Ahora es mia.",
        final_escapaste = "Sali vivo de {lugar:punto}. Corriendo, pero vivo. Por ahora.",
        final_ignorado = "No fui al trueque. Mejor asi, quizas.",
    },
}

Lore.arcos.el_desertor = {
    etapas = {
        pedido = "Un soldado sin insignias espera en {lugar:refugio}. Se llama Ray Doyle. Dice que se nego a disparar contra civiles en el cordon y que ahora la Guardia lo busca. Me pide que lo esconda. Tengo que decidir que hago con el.",
        escondido = "Ray se esconde en {lugar:refugio}. Duerme con las botas puestas y mira la carretera cada vez que suena un motor. Tarde o temprano, la Guardia va a venir.",
        busqueda = "La Guardia llego. Rodearon {lugar:refugio}. Ray ya tiene el fusil en las manos y me mira esperando. Hay que defenderlo.",
    },
    finales = {
        final_protegido = "Ray Doyle sigue vivo gracias a mi. Me regalo su fusil de reserva y se quedo en {lugar:refugio}. Cuida la entrada de noche.",
        final_capturado = "La Guardia mato a Ray Doyle en {lugar:refugio}. Tenia una hija en Lexington. No se como se llama.",
        final_se_rindieron = "La patrulla se canso de buscar. Ray respira tranquilo. Por ahora.",
        final_entregado = "Entregue a Ray Doyle. La patrulla me dejo raciones como pago. No las he abierto.",
        final_echado = "Le dije a Ray que se fuera. Nunca supe que fue de el.",
        final_lo_mataste = "Ray Doyle murio en {lugar:refugio}. Fue {quien_mato}.",
        final_siguio_de_largo = "Alguien paso por mi refugio y siguio de largo. Nunca supe quien.",
    },
}

Lore.arcos.hijo_perdido = {
    etapas = {
        busqueda = "Loretta Pike llego con una foto arrugada: su hijo Lucas fue a {lugar:escuela} a buscar comida hace dos dias y no volvio. Tiene doce. Dice que sabe que esta vivo. Voy a buscarlo.",
        escuela = "Estoy en {lugar:escuela}. Pasillos largos, casilleros abiertos, demasiado silencio. Si Lucas sigue aqui, esta escondido. Tengo que encontrarlo antes que ellos.",
    },
    finales = {
        final_reunidos = "Lucas volvio con su madre. Loretta lloro tanto que no pudo darme las gracias. No hacia falta.",
        final_lo_encontraste_tarde = "Encontre a Lucas en {lugar:escuela}. Ya no era Lucas. Su mochila tenia una nota para su mama. Se la voy a llevar.",
        final_lo_perdiste = "Lucas estaba vivo cuando llegue. No alcance a sacarlo.",
        final_tragedia = "Lucas murio en {lugar:escuela}. Fue {quien_mato}.",
        final_tarde = "Nadie fue a buscar a Lucas. Pienso en la foto de Loretta mas de lo que quisiera.",
    },
}

Lore.arcos.asalto_nocturno = {
    etapas = {
        espera = "Un vecino me aviso: una banda armada estuvo estudiando {lugar:refugio}. Contaron las ventanas, dibujaron un plano. Van a venir de noche. Tengo que estar listo.",
        asalto = "Pasos afuera. Muchos. Ya estan aqui. Hay que defender {lugar:refugio}.",
    },
    finales = {
        final_rechazado = "Rechace el asalto a {lugar:refugio}. Lo que traian ahora es mio.",
        final_se_retiraron = "La banda se retiro antes del amanecer. Volveran? Duermo con un ojo abierto.",
    },
}

-- ===========================================================================
-- Encargos de los misioneros (se buscan sin el nivel: encargo_paquete_facil -> encargo_paquete)
-- ===========================================================================
local VOLVER = "Lo tengo. Ahora hay que llevarselo a {contacto_nombre}, en {lugar:contacto}, antes de que se acabe el plazo."

Lore.arcos.encargo_paquete = {
    etapas = {
        viaje = "{contacto_nombre}, de {ciudad}, me encargo un paquete escondido en {lugar:objetivo}. Dijo que no lo abriera. Ahora tengo muchas ganas de abrirlo.",
        en_sitio = "Estoy en {lugar:objetivo}. El paquete tiene que estar por aqui. Los muertos no saben que es importante, pero igual lo custodian.",
        volver = VOLVER,
    },
}
Lore.arcos.encargo_medicina = {
    etapas = {
        viaje = "{contacto_nombre}, de {ciudad}, tiene a alguien enfermo. En {lugar:objetivo} deberian quedar antibioticos. Ya he hecho este viaje antes por otra gente. Siempre termina igual: corriendo.",
        en_sitio = "Estoy en {lugar:objetivo}. Si queda medicina, esta aqui. Hay que buscar rapido y en silencio.",
        volver = VOLVER,
    },
}
Lore.arcos.encargo_planos = {
    etapas = {
        viaje = "{contacto_nombre}, de {ciudad}, necesita los planos del pueblo. La ultima copia estaba en {lugar:objetivo}. Papel. En el fin del mundo, todavia se mata por papel.",
        en_sitio = "Estoy en {lugar:objetivo}. Los planos tienen que estar entre cajones y escritorios. Ojala no los hayan usado para prender fuego.",
        volver = VOLVER,
    },
}
Lore.arcos.encargo_radio = {
    etapas = {
        viaje = "{contacto_nombre}, de {ciudad}, quiere una radio de largo alcance. Habia una en {lugar:objetivo}. Si funciona, quizas escuchemos a alguien mas. Quizas no queramos escucharlo.",
        en_sitio = "Estoy en {lugar:objetivo}. La radio tiene que estar por aqui. Ojala entera.",
        volver = VOLVER,
    },
}
Lore.arcos.encargo_rescate = {
    etapas = {
        viaje = "Uno de los de {contacto_nombre} quedo atrapado en {lugar:objetivo}. Hay que sacarlo rapido. Las personas atrapadas duran menos que las latas.",
        en_sitio = "Encontre a la persona atrapada en {lugar:objetivo}. Esta asustada y vienen mas. Tengo que mantenerla viva hasta que pase el peligro.",
        volver = "La persona que rescate ya va camino a {ciudad}. Tengo que avisarle a {contacto_nombre}, en {lugar:contacto}, que su gente esta a salvo.",
    },
}
Lore.arcos.encargo_alijo = {
    etapas = {
        viaje = "{contacto_nombre}, de {ciudad}, me paso el dato de un alijo en {lugar:objetivo}. Dice que lo que encuentre es mio. Los datos gratis nunca son gratis.",
        en_sitio = "Llegue a {lugar:objetivo}. El alijo esta aqui, y los muertos tambien. Primero limpio, despues cargo.",
    },
}
Lore.arcos.encargo_ultra = {
    etapas = {
        viaje = "{contacto_nombre} me encargo algo casi imposible en {lugar:objetivo}, en pleno Louisville. El premio, lo que yo elija. Me miro como se mira a alguien por ultima vez. Hay que prepararse para lo peor.",
        en_sitio = "Estoy en {lugar:objetivo}. Nunca habia visto tantos juntos. Lo que busco esta adentro, en algun lado. Si salgo de esta, lo escribo.",
        volver = "Lo tengo. Sali de Louisville con vida, no se como. Ahora hay que volver con {contacto_nombre}, en {lugar:contacto}.",
        premio = "{contacto_nombre} cumplio su palabra. Me ofrece elegir: un arma, un traje o un auto. Lo mejor que tiene. Tengo que elegir.",
    },
    finales = {
        final_arma = "Volvi de Louisville y {contacto_nombre} me entrego un arma legendaria. La limpio cada noche aunque no la haya usado.",
        final_traje = "Volvi de Louisville y {contacto_nombre} me entrego un traje legendario. Me queda como si lo hubieran hecho para mi.",
        final_auto = "Volvi de Louisville y {contacto_nombre} me dejo las llaves de un auto legendario. Lo deje estacionado al lado, como un trofeo con ruedas.",
    },
}

-- Si el encargo no tiene etapa con lore (o es un final generico), se usa esto.
Lore.FINALES_ENCARGO = {
    final_cumplido = "Encargo cumplido para {contacto_nombre}, en {ciudad}. Pago lo que prometio.",
    final_vencido = "Se acabo el plazo del encargo de {contacto_nombre}. Ya no lo necesita.",
    final_fallido = "El encargo de {contacto_nombre} salio mal.",
    final_alijo = "Vacie el alijo de {lugar:objetivo}. {contacto_nombre} va a tener mas datos pronto.",
}

-- ---------------------------------------------------------------------------
-- Busqueda
-- ---------------------------------------------------------------------------

-- Lore de un arco: primero el id exacto, despues sin el ultimo pedazo
-- (encargo_paquete_facil -> encargo_paquete, encargo_ultra_mall -> encargo_ultra).
function Lore.de(defId)
    if defId == nil then return nil end
    local l = Lore.arcos[defId]
    if l ~= nil then return l end
    local corto = string.match(tostring(defId), "^(.+)_[^_]+$")
    return corto ~= nil and Lore.arcos[corto] or nil
end

-- Entrada de una etapa: id exacto, despues sin el ultimo pedazo (marcha_trio -> marcha).
-- Las etapas "escondite_<escuadra>" usan "escondite_grupo".
function Lore.etapa(defId, etapaId)
    local l = Lore.de(defId)
    if l == nil or l.etapas == nil or etapaId == nil then return nil end
    local e = l.etapas[etapaId]
    if e ~= nil then return e end
    if string.match(tostring(etapaId), "^escondite_") then return l.etapas.escondite_grupo end
    local corto = string.match(tostring(etapaId), "^(.+)_[^_]+$")
    return corto ~= nil and l.etapas[corto] or nil
end

function Lore.final(defId, finalId)
    local l = Lore.de(defId)
    local f = l ~= nil and l.finales ~= nil and l.finales[finalId] or nil
    if f == nil and string.sub(tostring(defId), 1, 8) == "encargo_" then f = Lore.FINALES_ENCARGO[finalId] end
    return f
end

function Lore.intro(defId)
    local l = Lore.de(defId)
    return l ~= nil and l.intro or nil
end

function Lore.capitulo(defId)
    return Lore.CAPITULOS[defId]
end

return Lore
