-- Narrador Co-op: el diario durante el camino del bandido (ver Arcos/Bandido.lua).
-- Mismas reglas: sin tildes ni enies, primera persona, sin azar.

require "Narrador/NarradorLore"

local Lore = Narrador.Lore

local VOLVER = "Tengo que volver al patio de trenes. Pereira espera parada, con las manos atras, como si el mundo todavia tuviera horarios."

Lore.arcos.bandido_1 = {
    etapas = {
        citacion = "Alguien dejo una nota en {lugar:casa}, firmada con una P. Sabe que en Knox ya no me quieren. Me cita en {lugar:patio}, al oeste de Muldraugh. Una parte de mi quiere quemar la nota. La otra ya esta caminando.",
        reunion = "En el patio de trenes me espera una mujer con uniforme de la Guardia Nacional, limpio, planchado. La Sargento Pereira. Tiene gente armada alrededor que no la mira a los ojos. Me ofrece trabajo. Todavia puedo decir que no.",
        viaje = "Mi primer trabajo para Pereira: matar a Julio Cardenas, uno de los suyos que se fue con raciones. Esta escondido en {lugar:escondite}. Dice que es mi entrada. No dijo entrada a que.",
        escondite = "Llegue a {lugar:escondite}. Hay muertos rondando la casa. Adentro hay alguien respirando bajito. Mas de una persona.",
        frente = "Julio Cardenas no es un soldado. Es un padre flaco con una nina de la mano, Marisol. Me pide que si lo voy a matar, no sea delante de ella. Tengo el arma en la mano y la decision tambien.",
        volver = {
            por_var = "perdonado",
            textos = {
                ["true"] = "Deje ir a Julio y a Marisol. Llevo su placa en el bolsillo como si fuera prueba de algo. " .. VOLVER,
                otro = "Julio Cardenas esta muerto. Marisol corrio y no la segui. " .. VOLVER,
            },
        },
    },
    finales = {
        final_cumplido = "Mate a Julio Cardenas. Pereira no me felicito: me dijo bienvenido y me dio la espalda, que en ella es lo mismo. Ahora soy parte de su banda. Lo escribo para creerlo.",
        final_perdonado = "Pereira se trago lo de la placa. Julio y Marisol estan vivos en algun lado, y yo estoy adentro de una banda que mataria a los tres si supiera. Empece mintiendo. Ojala termine igual.",
        final_rechazo = "Le dije a la Sargento Pereira que no trabajo para nadie. Me miro como se mira a alguien que va a volver. Ojala se equivoque.",
        final_abandonado = "No hice lo que Pereira me pidio. Ni bueno ni malo: nada. Ella no olvida. Yo tampoco.",
    },
}

Lore.arcos.bandido_2 = {
    etapas = {
        historia = { por_var = "bandido_jefe", textos = {
            maulen = "Maulen leyo la libreta de la Sargento Pereira antes de quemarla. Ahi estaba la noche de la comisaria: ella ordeno cerrar, el Cabo Ramiro abrio. A Maulen no le importa quien tenia razon. Le importan las reservas del Cabo.",
            otro = "Pereira me conto la noche de la comisaria. Ella mandaba el cordon de Muldraugh y ordeno cerrar con todos adentro. El Cabo Ramiro desobedecio y saco a once. Ella dice que por esos once se escaparon cuarenta muertos. El Cabo dice que lo hizo para hacerlo bien esta vez. Los dos cuentan la misma noche y no es la misma noche.",
        } },
        acercarse = "{jefe_corto} quiere las reservas del campamento del Cabo, en {lugar:comisaria}. De noche, sin ruido. El Cabo me conoce. Me ha pagado, me ha anotado en su libreta. Podria robarle. Podria contarle todo.",
        robo = "Es de noche en {lugar:comisaria}. La caja de reservas esta junto a la puerta y el guardia de turno cabecea. Nadie me esta mirando. Eso es lo peor.",
        avisado = "Le conte todo al Cabo. Escucho sin parpadear y anoto un nombre en su libreta: {jefe_corto}. Me dio una caja llena de piedras y latas vacias para que se la lleve. Si la abre delante de mi, estoy muerto.",
        volver = {
            por_var = "sabotaje",
            textos = {
                ["true"] = "Llevo la caja de piedras del Cabo. Pesa lo justo para enganar a alguien que no la abra. " .. VOLVER,
                otro = "Llevo las reservas del Cabo Ramiro al hombro. Manana va a contar las latas y no le van a cuadrar. " .. VOLVER,
            },
        },
    },
    finales = {
        final_cumplido = "Le robe las reservas al Cabo Ramiro para {jefe_corto}. El campamento de Muldraugh va a pasar hambre, y el Cabo va a escribir mi nombre en la pagina equivocada de su libreta.",
        final_saboteado = "{jefe_corto} recibio la caja de piedras sin abrirla. Por ahora. El Cabo sabe lo que viene. Yo se que cada mentira suma.",
        final_abandonado = "No hice lo de la comisaria. Ni le robe al Cabo ni le avise. {jefe_corto} lo va a notar.",
    },
}

Lore.arcos.bandido_3 = {
    etapas = {
        pedido = "{jefe_corto} quiere muerta a una familia en {lugar:casa}. Su crimen: esconder una semana a tres desertores, darles sopa y curarles los pies. Quiere que todo Knox sepa que eso se paga.",
        viaje = "Voy a {lugar:casa}. No he decidido nada. Me digo que no he decidido nada.",
        casa = "Llegue a {lugar:casa}. Hay luz en la cocina y olor a sopa. Alguien canta bajito.",
        frente = "Los Salinas: Arturo, Rosario y el chico, Tomasito. Arturo me ofrecio sopa antes de preguntarme el nombre. Rosario ya vio lo que llevo en la mano. El chico pregunta por que no me siento.",
        volver = {
            por_var = "sabotaje",
            textos = {
                ["true"] = "Los Salinas huyeron al sur esta noche. Llevo el anillo de Arturo para que {jefe_corto} crea que lo saque de una mano fria. " .. VOLVER,
                otro = "Los Salinas estan muertos. No me sente. " .. VOLVER,
            },
        },
    },
    finales = {
        final_cumplido = "Mate a la familia Salinas para {jefe_corto}. Me ofrecieron sopa. Ya no se que escribir aqui, y escribo igual, porque si dejo de escribir me olvido de que esto estuvo mal.",
        final_saboteado = "{jefe_corto} se quedo con el anillo de Arturo y lo miro contra la luz un rato largo. Los Salinas estan vivos, lejos. Cada mentira me pesa un poco mas.",
        final_abandonado = "No fui donde los Salinas. Ojala se hayan ido antes de que {jefe_corto} mande a otro.",
    },
}

Lore.arcos.bandido_4 = {
    etapas = {
        pedido = "{jefe_corto} quiere la comida que un grupo de sobrevivientes junto para el invierno en {lugar:almacen}. Dice que el invierno es de los fuertes. Ella siempre dice cosas que suenan a letrero.",
        viaje = "Voy a {lugar:almacen}. Me pregunto cuanta gente come de lo que voy a cargar.",
        almacen = "Llegue a {lugar:almacen}. Hay cajas apiladas con cuidado, contadas, con fechas escritas en plumon. Alguien aqui sabe lo que es pasar hambre.",
        frente = "Ramon Quispe me corto el paso: son once, hay cuatro ninos, juntaron esto en tres meses. Su madre, Dona Elba, le pidio que me dejara hablar. Dice que tengo cara de cansado, no de malo. No se cual de las dos es verdad hoy.",
        carga = "Las provisiones estan en el suelo de {lugar:almacen}. Los Quispe se fueron sin mirar atras. Cargar es lo unico que queda.",
        volver = {
            por_var = "sabotaje",
            textos = {
                ["true"] = "Llevo la mitad de las latas. La otra mitad la escondieron los Quispe donde {jefe_corto} no va a buscar. " .. VOLVER,
                otro = "Llevo el invierno de once personas en la espalda. Pesa menos de lo que deberia. " .. VOLVER,
            },
        },
    },
    finales = {
        final_cumplido = "Le quite el invierno a once personas para {jefe_corto}. Cuatro eran ninos. Dona Elba dijo que tenia cara de cansado, no de malo. Se equivoco.",
        final_saboteado = "Le lleve a {jefe_corto} la mitad de las latas. Conto dos veces y no dijo nada. Eso me asusto mas que si hubiera gritado.",
        final_abandonado = "No fui por las latas. Los Quispe van a pasar el invierno sin saber que estuve a punto.",
    },
}

Lore.arcos.bandido_5 = {
    etapas = {
        plan = { por_var = "bandido_jefe", textos = {
            maulen = "Maulen me conto lo grande: manana van por Sous. Akagami, Zent, Walita, todos. Despues el Cabo, despues Knox. Me quiere a su lado. Me lo pide sonriendo, con el cigarro apagado, como si me pidiera que le pase la sal.",
            otro = "Pereira me conto lo grande: manana toman la comisaria y el Cabo Ramiro muere en la misma puerta que abrio. Despues Muldraugh. Despues todo Knox. Me quiere a su derecha. Me lo pide como si ya supiera la respuesta.",
        } },
        preparar = "Le di la espalda a {jefe_corto}. Tengo poco tiempo antes de que ataque. Si alguien en Knox todavia confia en mi, este es el dia de pedirlo. Despues vuelvo al patio, con quien venga.",
        asalto = "Vuelvo al patio de trenes. Esta vez no a pedir trabajo. {jefe_corto} ya lo sabe: hay fusiles en cada vagon.",
        pelea = "Llegaron. No vine solo. La pelea en el patio de trenes es por todo lo que hice en su nombre.",
    },
    finales = {
        final_con_pereira = "Le dije que si a {jefe_corto}. Manana empieza la guerra. Despues, Knox. Me deberia temblar la mano al escribir esto. No me tiembla.",
        final_redencion = "{jefe_nombre} murio en el patio de trenes. No lo hice solo: vino gente que todavia creia en mi. En Knox me van a perdonar. Yo me acuerdo de cada nombre igual.",
        final_escapo = "{jefe_corto} se me escapo del patio de trenes. Sigue en algun lado, y sabe mi cara. Duermo con las botas puestas.",
        final_abandonado = "No le respondi a {jefe_corto}. Ni si ni no. Ella va a tomar la comisaria igual, conmigo o sin mi.",
    },
}

Lore.arcos.bandido_castigo = {
    etapas = {
        caza = "{jefe_corto} descubrio lo que hice. Un silbido corto, despues otro: su gente me esta cazando. Conozco esas botas. Las vi en el patio.",
    },
    finales = {
        final_sobreviviste = "Sobrevivi a los cazadores de {jefe_corto}. Si vuelvo al patio, me va a recibir con una sonrisa y el dedo en el gatillo. Y voy a volver, porque todavia no termino.",
    },
}

Lore.arcos.bandido_maulen = {
    etapas = {
        citacion = "Una nota firmada con una M, con olor a cigarro y a atun. Maulen Callupan, el que deje ir en el escondite. Dice que encontro trabajo y despues algo mejor: el puesto de la jefa. Me espera en {lugar:patio}.",
        reunion = "Maulen esta en el patio de trenes, con la banda de Pereira detras. De Pereira no queda nada mas que su fusil apoyado en una pared. Me sonrie como siempre. Dice que aca todos somos amigos. Todos.",
    },
    finales = {
        final_unido = "Maulen mato a la Sargento Pereira y se quedo con su banda. Ahora trabajo para el. Lo deje vivir y el me lo devuelve asi. Mi chuchu, diria el, decia que todo vuelve.",
        final_rechazo = "Le dije a Maulen que no le debo nada. Sonrio y dijo que todos vuelven. Lo dijo como una promesa.",
        final_abandonado = "No fui a ver a Maulen. Sabe donde vivo. Siempre supo donde estaba todo.",
    },
}

return Lore
