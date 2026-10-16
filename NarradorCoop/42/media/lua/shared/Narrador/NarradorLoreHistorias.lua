-- Narrador Co-op: lo que el personaje escribe en el diario durante las misiones que no estan
-- en NarradorLore.lua: la cura, las fechas de Sous, los encuentros de exploracion y los
-- favores de Sous. Mismas reglas: sin tildes ni enies, primera persona, sin azar.

require "Narrador/NarradorLore"

local Lore = Narrador.Lore

Lore.NIVELES.cura = "La cura. Louisville otra vez. Esta vez corren."

-- ===========================================================================
-- La cura (encargo especial de los misioneros, ver Arcos/Cura.lua)
-- ===========================================================================
Lore.arcos.encargo_cura = {
    etapas = {
        viaje = "{contacto_nombre} me hablo de un antibiotico experimental, el K-93, que cura la mordida. Lo guardaban en {lugar:objetivo}, en pleno Louisville. Tiene a alguien mordido esperando. Una dosis es para esa persona. La otra, dice, es mia. Nunca una promesa me habia pesado tanto en la mochila.",
        en_sitio = "Estoy en {lugar:objetivo}. Hay mas muertos que en cualquier lugar que haya visto, y algunos corren. Corren. El refrigerador con el K-93 tiene que estar adentro. Las pastillas son todas iguales y no todas sirven. Me las llevo todas y despues pienso.",
        volver = "Sali de Louisville con un punado de pastillas iguales en el bolsillo. Algunas son de verdad, otras de azucar, y a simple vista no hay como saber cuantas. Alguien espera donde {contacto_nombre}, en {lugar:contacto}, y cada hora cuenta. Y yo tengo en la mano lo unico en el mundo que me salvaria de una mordida. Tengo que decidir que entrego.",
    },
    finales = {
        final_cumplido = "Le entregue la dosis a {contacto_nombre}. La verdadera. La persona que esperaba va a despertar manana sin fiebre, y no va a saber nunca como me llamo. Esta bien asi. Hay cosas que valen mas que un seguro de vida.",
        final_cumplido_falsa = {
            por_var = "engano",
            textos = {
                ["true"] = "Le di a {contacto_nombre} una pastilla de azucar y me guarde la verdadera. Me dio las gracias con los ojos mojados. En unos dias me van a avisar que no resulto, y voy a tener que poner cara de sorpresa. La pastilla buena pesa mas que todo lo que llevo encima.",
                otro = "Le entregue una pastilla a {contacto_nombre}. No sabia cual era la buena; elegi una y rece. Si me toco la equivocada, alguien se va a morir esperando un milagro que llevaba yo en el bolsillo. Prefiero no saberlo. Lo voy a saber igual.",
            },
        },
        final_te_la_quedaste = "Me quede con todas las pastillas. {contacto_nombre} me miro la cara y supo antes de que abriera la boca. Alguien se va a morir esperando en {ciudad}. Yo voy a vivir un poco mas tranquilo. No se si eso me hace sobreviviente o otra cosa.",
        final_vencido = "No volvi a tiempo de Louisville. Cuando llegue donde {contacto_nombre} ya no habia nadie a quien darle nada. Guarde las pastillas en el fondo de la mochila. No las he vuelto a mirar.",
    },
}

-- ===========================================================================
-- Fechas de Sous (ver Arcos/Calendario.lua)
-- ===========================================================================
Lore.arcos.cal_fonda = {
    etapas = {
        pedido = "Sous quiere hacer la fonda en {lugar:base_sous}. Akagami hizo una lista con numeros: uno, carne; dos, carbon; tres, que Walita no baile. Me toca conseguir dos piezas de carne y algo para el fuego. Benjamin ya prometio el copete. Jorge ya anoto quien debe que.",
        asado = "Hay asado en {lugar:base_sous}. Jorge no deja que nadie toque la parrilla, Walita saco a todos a bailar cueca con un trapo de panuelo y Zent dice que es una tortura con musica, pero no se va. El humo sube derecho y se ve desde lejos. Eso me preocupa. Por un rato, solo un rato, decido no preocuparme.",
    },
    finales = {
        final_fonda = "Fonda en la base de Sous. Hubo carne, cueca mala, un brindis de Akagami por los que estan y los que no, y ninguna baja. Jorge lo anoto en su libro: una fonda, cero muertos. Yo lo anoto en el mio. Hace meses que no me reia tanto.",
        final_sin_fonda = "No llegue con la carne para la fonda. Sous celebro con atun y lo que habia. Akagami dijo que tambien valia; Zent dijo que no. Los dos tenian razon. La proxima vez llego.",
    },
}

Lore.arcos.cal_amigo_secreto = {
    etapas = {
        pedido = "Me toco {amigo_nombre} en el amigo secreto de Sous. Le gusta {gusto_nombre}. Tengo hasta la medianoche para encontrarlo y llevarlo a {lugar:base_sous}. Jorge dejo claro que nada robado del deposito. Wertres pidio que, si le toca a el, sea algo con cables. No me toco Wertres.",
    },
    finales = {
        final_regalo = "Le regale {gusto_nombre} a {amigo_nombre}. Se le iluminaron los ojos como a un nino. Despues me toco a mi: alguien de Sous me paso una mochila envuelta en una bolsa de basura con una cinta. Navidad en el fin del mundo. No se cuantas mas quedan, pero esta fue buena.",
        final_sin_regalo = "No llegue con el regalo de {amigo_nombre}. Me dijo que otro ano sera, si es que hay otro ano. Lo dijo sonriendo. Eso fue peor.",
    },
}

-- ===========================================================================
-- Encuentros de exploracion (ver Arcos/Encuentros.lua)
-- Cada tipo tiene su aviso, su llegada y su despedida. Los finales son comunes salvo
-- los que cambian con el tipo.
-- ===========================================================================
local ENC_FINALES = {
    final_llevado = "Ayude a {nombre} cerca de {lugar:punto} y le dije que fuera donde {misionero}, que alla hay gente y hay trabajo. Lo vi alejarse sin mirar atras. Ojala llegue. Ojala algun dia me cruce con el y me cuente que llego.",
    final_compartiste = "Ayude a {nombre} cerca de {lugar:punto} y le deje algo de comer. No tenia mucho para dar, pero el tenia menos. Algun dia el mundo devuelve esas cosas. Algun dia.",
    final_cobraste = "Ayude a {nombre} cerca de {lugar:punto} y le pedi algo a cambio. Me pago con lo que tenia sin discutir. Asi funcionan las cosas ahora. No me gusta como suena cuando lo escribo.",
    final_despedida = "Ayude a {nombre} cerca de {lugar:punto}. Nos dimos la mano y cada uno siguio su camino. En este condado eso es casi una amistad.",
    final_muerto = "No alcance a salvar a {nombre}. Llegue a {lugar:punto}, pelee, y no basto. Cerre sus ojos antes de irme. Era lo unico que quedaba por hacer.",
    final_lo_mataste = "{nombre} pedia ayuda en {lugar:punto} y termino muerto por mi mano. No se si fue miedo, un error o una decision. Escribo su nombre para que alguien lo recuerde. Me toca a mi.",
    final_ignorado = "Escuche que alguien pedia ayuda cerca de {lugar:punto}. No fui. Me dije que no podia arriesgarme, que no era mi problema. Los gritos se callaron solos, despues de un rato.",
}

local ENC_MORDIDO = "Gracias a mi, la familia de {nombre} sigue viva. Pero el chico tenia una mordida que no mostraron. Lo vi cuando ya nos despediamos. No dije nada. No se si debi."

local ENCUENTROS = {
    techo = {
        aviso = "Gritos cerca de {lugar:punto}. Alguien pide ayuda a todo pulmon, y eso en este condado es lo mismo que tocar la campana de la cena. Si voy, tengo que ir ya.",
        llegada = "Hay alguien arriba del techo de un auto en {lugar:punto}, rodeado de muertos que le rascan los zapatos. Se llama {nombre}. Me vio y grito mas fuerte. Hay que limpiar abajo antes de que se resbale.",
        salvado = "{nombre} se bajo del auto temblando. Me dijo que llevaba horas ahi arriba, contando nubes para no mirar abajo. Ahora tengo que decidir que hago con el.",
    },
    auto = {
        aviso = "Un claxon pegado suena cerca de {lugar:punto}. No para. Cada muerto en kilometros a la redonda lo esta escuchando, igual que yo.",
        llegada = "Un auto volcado al costado del camino en {lugar:punto}. El conductor, {nombre}, esta atrapado y el claxon no deja de sonar. Los muertos llegan de todos lados. Primero ellos, despues el claxon.",
        salvado = "Saque a {nombre} del auto volcado. Tiene un corte en la frente y la voz ronca de tanto gritar. Me ofrecio lo que tenia en el maletero. Tengo que decidir que hago con el.",
    },
    puerta = {
        aviso = "Golpes y gritos cerca de {lugar:punto}. Suena como una puerta a punto de ceder. Detras de una puerta asi casi siempre hay una familia.",
        llegada = "Una familia encerrada en {lugar:punto}. Los muertos estan rompiendo la puerta y {nombre} empuja del otro lado con todo el cuerpo. Hay que sacarles los muertos de encima antes de que la madera se rinda.",
        salvado = {
            por_var = "giro",
            textos = {
                mordido = "La puerta aguanto. {nombre} y los suyos salieron a darme las gracias. El chico se escondia detras, con la manga bajada hasta la muneca. Nadie quiso mirarlo. Yo tampoco.",
                otro = "La puerta aguanto. {nombre} y los suyos salieron a darme las gracias con lo poco que tenian en las manos. Ahora tengo que decidir que hago con ellos.",
            },
        },
        finales = {
            final_llevado = {
                por_var = "giro",
                textos = { mordido = ENC_MORDIDO, otro = ENC_FINALES.final_llevado },
            },
            final_despedida = {
                por_var = "giro",
                textos = { mordido = ENC_MORDIDO, otro = ENC_FINALES.final_despedida },
            },
        },
    },
    carrera = {
        aviso = "Alguien pasa corriendo cerca de {lugar:punto} con una horda pegada a los talones. Si sigue derecho, me la va a traer a mi.",
        llegada = {
            por_var = "giro",
            textos = {
                te_la_trae = "{nombre} corrio directo hacia mi, con la horda detras. Gracias, {nombre}. Ahora los muertos son de los dos.",
                otro = "{nombre} viene corriendo hacia {lugar:punto} con una horda pegada a la espalda. No le queda aire. Hay que frenarlos aqui.",
            },
        },
        salvado = "{nombre} se doblo en dos tratando de recuperar el aire. Cuando pudo hablar me dijo que me debia la vida y unos pulmones nuevos. Ahora tengo que decidir que hago con el.",
    },
    trampa = {
        aviso = "Alguien grita de dolor cerca de {lugar:punto}. Suena a trampa de metal. Los cazadores ponen trampas para osos. Los osos no gritan asi.",
        llegada = {
            por_var = "giro",
            textos = {
                cazador_de_gente = "{nombre} tenia la pierna en una trampa en {lugar:punto}, pero no estaba solo: sus amigos salieron de los arbustos con armas. El cebo era el. La presa era yo.",
                otro = "Un cazador, {nombre}, con la pierna atrapada en una trampa para osos en {lugar:punto}. La sangre atrae muertos. Hay que mantenerlos lejos mientras pienso como abrir esto.",
            },
        },
        salvado = "Abri la trampa y {nombre} saco la pierna. No esta rota, dice, aunque cojea como si lo estuviera. Me ofrecio su cuchillo. Tengo que decidir que hago con el.",
    },
    pozo = {
        aviso = "Una voz pide ayuda cerca de {lugar:punto}. Suena como si viniera de abajo, de un hoyo o una zanja.",
        llegada = "{nombre} cayo a una zanja honda en {lugar:punto}. Grita para arriba y los muertos se asoman al borde a mirarlo. Primero los saco a ellos.",
        salvado = "Los muertos se acabaron. {nombre} sigue abajo, en la zanja de {lugar:punto}. Sin una cuerda no va a salir nunca. Tengo que conseguir una, o algo que sirva igual.",
    },
    herido = {
        aviso = "Alguien pide agua cerca de {lugar:punto}. Esta tirado en el suelo, al lado del camino. Puede estar herido. Puede estar fingiendo.",
        llegada = {
            por_var = "giro",
            textos = {
                emboscada = "El herido de {lugar:punto}, {nombre}, no estaba tan herido. Cuando me acerque salieron sus amigos armados de detras de los autos. Era una emboscada, y yo me la cai entera.",
                otro = "Un hombre herido, {nombre}, tirado al lado del camino en {lugar:punto}. Tiene pinta de bandido y la voz de alguien que ya se rindio. Los muertos huelen la sangre. Hay que alejarlos.",
            },
        },
        salvado = "{nombre} tomo agua como si fuera la primera vez. Me dijo que no todos son como el. Me lo dijo mirando el suelo. Ahora tengo que decidir que hago con el.",
    },
    comerciante = {
        aviso = "Un motor que no arranca cerca de {lugar:punto}. Alguien insiste e insiste con la llave. Cada intento es una invitacion para los muertos.",
        llegada = "Un comerciante, {nombre}, con su carro en panne en {lugar:punto}. La bateria murio y los muertos se acercan a su mercaderia. Me grita que si lo ayudo me paga bien. Primero los muertos.",
        salvado = "Los muertos ya no estan. El carro de {nombre} sigue muerto en {lugar:punto}. Si le consigo una bateria de auto, dice, puedo sacar lo que quiera de atras. Si no, tendra que dejar todo ahi.",
    },
    bengala = {
        aviso = "Una bengala roja subio cerca de {lugar:punto}. Alguien pide ayuda de la unica forma que le queda.",
        llegada = {
            por_var = "giro",
            textos = {
                cebo = "La bengala de {lugar:punto} era un cebo. {nombre} la tiro para atraer a alguien como yo, y sus amigos esperaban armados. Me cai como un novato.",
                otro = "Un grupo atrincherado en {lugar:punto}, con {nombre} adelante. Les queda una sola bengala y muchos muertos alrededor. Hay que romper el cerco.",
            },
        },
        salvado = "Rompimos el cerco en {lugar:punto}. {nombre} me dijo que pensaban que nadie iba a ver la bengala. Que nadie mira para arriba ya. Ahora tengo que decidir que hago con ellos.",
    },
    sous = {
        aviso = "Reconoci una voz cerca de {lugar:punto}. Es alguien de Sous. Grita mi nombre, o algo parecido. Voy.",
        llegada = "Es {nombre_completo}, de Sous, rodeado en {lugar:punto} sin salida. Me vio llegar y grito algo que solo un amigo grita. No lo voy a dejar aqui.",
        salvado = "{nombre_completo} esta vivo. Se rio de nervios, me dio un abrazo que me levanto del suelo y me dijo que no le contara a nadie en la base. Le voy a contar a todos.",
        finales = {
            final_llevado = "Saque a {nombre_completo} del lio en {lugar:punto}. Le dije que volviera a la base y me hizo caso por primera vez en la vida. Sous me debe una. Otra mas.",
            final_compartiste = "Saque a {nombre_completo} del lio en {lugar:punto} y le pase algo de comer para el camino. Me dijo que en la base me lo devuelve con intereses. Jorge se va a encargar de cobrarle.",
            final_cobraste = "Saque a {nombre_completo} del lio en {lugar:punto}. Le cobre la ayuda, y me pago sin decir nada. Entre amigos eso no se hace. Lo se. Lo hice igual.",
            final_despedida = "Saque a {nombre_completo} del lio en {lugar:punto}. Volvio a la base caminando como si nada, silbando. Asi son en Sous: casi mueren y despues fingen que fue un paseo.",
            final_muerto = "{nombre_completo} murio en {lugar:punto}. Llegue a tiempo para verlo y no a tiempo para salvarlo. Ahora tengo que ir a la base de Sous a decirlo en voz alta.",
            final_lo_mataste = "{nombre_completo} murio en {lugar:punto}, y fui yo. No hay forma de escribir esto que lo haga menos verdad. Sous no lo va a olvidar.",
            final_ignorado = "Escuche a {nombre_completo} pidiendo ayuda cerca de {lugar:punto} y no fui. Si alguien de Sous me pregunta, voy a mentir. Ya estoy ensayando la cara.",
        },
    },
}

for tipo, t in pairs(ENCUENTROS) do
    local finales = {}
    for k, v in pairs(ENC_FINALES) do finales[k] = v end
    for k, v in pairs(t.finales or {}) do finales[k] = v end
    Lore.arcos["enc_" .. tipo] = {
        etapas = { aviso = t.aviso, llegada = t.llegada, salvado = t.salvado },
        finales = finales,
    }
end

-- ===========================================================================
-- Favores de Sous (ver Arcos/FavoresSous.lua)
-- ===========================================================================
local FAVORES = {
    benjamin = {
        buscar = "Matric dejo su katana, la Mata Perras, apoyada en la barra de {lugar:perdido} y salio arrancando. Me lo conto muerto de verguenza y de risa al mismo tiempo. Me dio un mapa dibujado con una flecha enorme. Voy a buscarla antes de que otro se la lleve.",
        volver = "Tengo la Mata Perras. Pesa mas de lo que pensaba y corta mejor de lo que pensaba. Matric me espera en la base de Sous. Ya me imagino como va a gritar.",
        final_hecho = "Le mostre la katana a Matric y me dijo que me la quedara, que me la gane. La Mata Perras ahora es mia. Benjamin dice que es mia de por vida, y que si la pierdo me mata. Creo que bromea.",
        final_murio = "Matric murio antes de que le llevara su katana. La Mata Perras sigue en el mundo y el ya no. Me hubiera gustado verle la cara una vez mas.",
    },
    martin_z = {
        buscar = "Zent perdio su cuchillo en {lugar:perdido}. Me lo pidio como quien no pide nada: si vas, vas; si no, tambien. Pero me paso un mapa con la marca hecha dos veces. Le importa. Voy.",
        volver = "Encontre el cuchillo de Zent. Es feo, gastado y perfecto. Lo llevo de vuelta a la base de Sous sabiendo que no me va a dar las gracias.",
        final_hecho = "Zent miro su cuchillo y me dijo que me lo quedara, que si me lo recibia iba a tener que agradecerme y eso no le sale. Ahora tengo El Comentario Sarcastico. Es lo mas parecido a un abrazo que me va a dar.",
        final_murio = "Zent murio antes de que le devolviera el cuchillo. Nunca me pidio nada mas. Esa fue su unica vez.",
    },
    martin_a = {
        buscar = "Akagami me pidio, en tres puntos, que le trajera la pelota de la ultima pichanga, firmada por todos. Quedo en {lugar:perdido}. Uno: la pelota. Dos: volver. Tres: volver vivo. Asi decia el mapa.",
        volver = "Tengo la pelota de Akagami. Esta desinflada y las firmas se ven apenas. Para el es la cosa mas importante del mundo. Vuelvo a la base de Sous.",
        final_hecho = "Le devolvi la pelota a Akagami. La tuvo en las manos un rato largo sin decir nada, que en el es mucho. Despues me regalo La Barra de Dominadas con tres reglas: cuidarla, usarla y nunca devolversela.",
        final_murio = "Akagami murio antes de que le devolviera la pelota. La deje en la base, en el patio, al lado de la barra oxidada donde entrenaba.",
    },
    david = {
        buscar = "Shinbo me pidio, casi en un susurro, que buscara una foto de todos ellos, de antes. La dejo en {lugar:perdido}. Le costo pedirlo. A mi me cuesta pensar que alguien guarde fotos todavia.",
        volver = "Encontre la foto de Sous. Estan todos, mas jovenes, sonriendo en algun lugar con sol. Algunos de ellos ya no estan. La llevo con cuidado a la base, para Shinbo.",
        final_hecho = "Le devolvi la foto a Shinbo. La miro un rato largo y despues la guardo en su cuaderno. Me regalo El Marco Teorico. Dice que pesa harto, como toda buena teoria. Creo que es un chiste. Con Shinbo nunca se sabe.",
        final_murio = "Shinbo murio antes de que le llevara la foto. La guarde en mi diario, entre estas paginas. Alguien tiene que acordarse de como eran.",
    },
    bastian = {
        buscar = "Tati perdio su collar de plata en {lugar:perdido}, buscando ropa. Me pidio que no lo mirara asi. Dice que sin el collar no es el. Voy a buscarlo.",
        volver = "Tengo el collar de Tati. Brilla mas de lo que deberia brillar algo en el fin del mundo. Vuelvo a la base de Sous antes de que me tiente ponermelo.",
        final_hecho = "Le devolvi el collar a Tati y se lo puso al tiro, arreglandose la chaqueta. Me regalo La Facha, su machete. Dice que con facha se pelea mejor. No le voy a llevar la contra.",
        final_murio = "Tati murio antes de que le devolviera el collar. Lo enterraron con la chaqueta puesta. El collar lo tengo yo.",
    },
    hanz = {
        buscar = "Walita dejo una llamita tallada en {lugar:perdido}. La hizo con sus manos y no la quiere dejar botada. Me lo dijo serio, sin una sola broma. Voy a buscarla.",
        volver = "Encontre la llamita de Walita. Es chica, de madera clara, con las orejas paradas. Se nota que le dedico horas. Vuelvo a la base de Sous.",
        final_hecho = "Le devolvi la llamita a Walita. La puso en la repisa con las demas piezas que talla. Me regalo El Hacha Tallada, con el mango hecho por el. Me pidio que la cuidara. Lo voy a hacer.",
        final_murio = "Walita murio antes de que le devolviera la llamita. La deje en su repisa, con el ajedrez a medio terminar.",
    },
    cristian = {
        buscar = "Cristonks perdio sus antiparras de nieve en {lugar:perdido}. Dice que sin ellas no sube ni al segundo piso, y se rie como siempre. Me paso un mapa con una marca y un dibujo de un cerro. Voy.",
        volver = "Tengo las antiparras de Cristonks. Estan rayadas y les falta un elastico. Para el son el pasaporte a la nieve. Vuelvo a la base de Sous.",
        final_hecho = "Le devolvi las antiparras a Cristonks y se las puso de inmediato, en plena base, riendose. Me regalo La Picota del Cerro. Dice que sirve para los cerros y para los muertos. Algun dia voy a subir con el.",
        final_murio = "Cristonks murio antes de que le devolviera las antiparras. Nunca me llevo a la nieve. Las guardo para cuando yo suba.",
    },
    jorge = {
        buscar = "Hasag dejo su libro de cuentas en {lugar:perdido}. Sin el, dice, no le cuadra nada: ni las latas, ni las balas, ni lo que le debo. Me dio un mapa con la marca en un escritorio. Puede haber gente armada.",
        volver = "Tengo el libro de cuentas de Hasag. Cada lata, cada bala, cada bidon de la base, anotado con una letra chiquitita. Mi nombre aparece varias veces. Vuelvo a la base de Sous.",
        final_hecho = "Le devolvi el libro a Hasag. Lo reviso pagina por pagina antes de agradecerme. Despues me regalo El Balance General, su bate. Dice que es una inversion. Creo que borro una de mis deudas.",
        final_murio = "Hasag murio antes de que le devolviera el libro de cuentas. Lo deje en el deposito de Sous. Alguien tiene que seguir llevando la cuenta.",
    },
    cristobal = {
        buscar = "Wertres dejo su camiseta del Bicho, la numero 7, en {lugar:perdido}. Dice que es sagrada. Lo dijo con una mano en el pecho. Voy a buscarla.",
        volver = "Encontre la camiseta de Wertres. Esta gastada y huele a guardado. Es enorme, como el. Vuelvo a la base de Sous.",
        final_hecho = "Le devolvi la camiseta a Wertres y grito siuuu tan fuerte que me preocupe por los muertos. Me regalo La Pala del Bicho, larga como el. Me dio un abrazo que casi me quiebra.",
        final_murio = "Wertres murio antes de que le devolviera su camiseta. Era el que nos curaba a todos. Nadie lo pudo curar a el.",
    },
}

for rol, f in pairs(FAVORES) do
    Lore.arcos["favor_" .. rol] = {
        etapas = { buscar = f.buscar, volver = f.volver },
        finales = { final_hecho = f.final_hecho, final_murio = f.final_murio },
    }
end

return Lore
