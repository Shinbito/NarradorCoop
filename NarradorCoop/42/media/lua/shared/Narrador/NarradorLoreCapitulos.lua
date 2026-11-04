-- Narrador Co-op: el diario durante el modo historia de los misioneros (Arcos/Desbloqueos.lua,
-- Arcos/Capitulos.lua, HijaCabo.lua y LeyendaEduardo.lua). Sin tildes ni enies, primera persona.

require "Narrador/NarradorLore"

local Lore = Narrador.Lore

-- ===========================================================================
-- Capitulo 1: fundar el campamento
-- ===========================================================================
local DESBLOQUEO = {
    muldraugh = { quien = "El Cabo Ramiro", edificio = "la comisaria",
        llegada = "El Cabo Ramiro golpeo la puerta de {lugar:casa} como si trajera una orden judicial. Habla como si yo estuviera detenido." },
    westpoint = { quien = "La Tia Chela", edificio = "el cuartel de bomberos",
        llegada = "Una senora con casco de bombero golpeo la puerta de {lugar:casa}. Me dijo mijo antes de saber mi nombre." },
    riverside = { quien = "El Padre Nacho", edificio = "la iglesia",
        llegada = "Tres golpes despacio en la puerta de {lugar:casa}. Era un cura con la nariz quebrada dos veces." },
    rosewood = { quien = "La Misia Rosa", edificio = "la gasolinera",
        llegada = "Una senora con delantal grito 'mijito, abre!' en la puerta de {lugar:casa}, como si me conociera de toda la vida." },
}
for id, d in pairs(DESBLOQUEO) do
    Lore.arcos["desbloqueo_" .. id] = {
        etapas = {
            llegada = d.llegada,
            pedido = d.quien .. " quiere armar un campamento en " .. d.edificio .. ", pero esta lleno de muertos. Me pide ayuda para limpiarlo. Lo que encuentre adentro es mio.",
            pendiente = "Le dije a " .. string.lower(string.sub(d.quien, 1, 1)) .. string.sub(d.quien, 2) .. " que mas tarde. Me espera en {lugar:contacto}. No parece de los que se olvidan.",
            viaje = "Voy a {lugar:contacto} a ayudar a limpiar " .. d.edificio .. ". Despues de eso, ahi va a haber un campamento.",
            en_sitio = "Estoy limpiando {lugar:contacto}. Los muertos de adentro no saben que esto va a ser un campamento. Mejor asi.",
            horda = "El ruido trajo una horda a {lugar:contacto}. Si aguantamos esta, el lugar es nuestro.",
        },
        finales = {
            final_campamento = d.edificio:gsub("^%l", string.upper) .. " quedo limpio. " .. d.quien .. " se instalo ahi y ya da encargos. En este condado eso es casi un pueblo.",
        },
    }
end

-- ===========================================================================
-- Tia Chela
-- ===========================================================================
Lore.arcos.cap_chela_2 = {
    etapas = {
        viaje = "La radio del cuartel de la Tia Chela se murio despues de treinta anos. Dice que quiere escuchar si queda alguien por ahi. Los repuestos estan en {lugar:tienda}.",
        tienda = "Estoy en {lugar:tienda}. Entre cables y cajas tiene que haber algo que sirva para una radio vieja.",
        volver = "Tengo los repuestos. La Chela me espera en el cuartel con la radio desarmada en la mesa de la cocina.",
        subir = "La radio funciono un segundo. Una voz de hombre dijo 'Mama, si me oyes...' y se corto. Era Eduardo. La Chela no lloro delante de mi. Hay que arreglar {lugar:antena}.",
        arreglar = "Estoy en {lugar:antena}. La antena chirria y todo lo que tiene oidos en el cerro la escucho. Hay que aguantar hasta que quede firme.",
    },
    finales = {
        final_cumplido = "Arregle la antena. La Chela escucho la voz entera: 'Mama, si me oyes, estoy bien. Hay un cientifico en Louisville que dice tener la cura. Voy a ayudarlo.' Lloro. Despues me regano por mirarla.",
    },
}

Lore.arcos.leyenda_eduardo = {
    etapas = {
        viaje = "Un cientifico pide ayuda por la radio de la Chela: dice que tiene la cura. Ella no le cree ni el saludo, pero quiere un doctor. Esta en {lugar:objetivo}.",
        sitio = "Llegue a {lugar:objetivo}. Alguien ya esta peleando: un tipo alto, solo contra la horda, con un arma que no parece de este mundo.",
        combate = "Peleo al lado del desconocido para salvar al cientifico. Pega como si cada muerto le debiera algo.",
        conocerlo = "El desconocido se presento: Eduardo Giovanns. El hijo de la Tia Chela. El de la radio. El que la gente nombra cuando cuenta como se salvo.",
        caido = "Eduardo cayo cubriendo al doctor. Su arma quedo en el suelo. No se levanto. Todavia.",
        escolta = "Llevo al doctor Hartmann donde la Chela. Camina detras de mi hablando de la cura que tiene. No le creo.",
    },
    finales = {
        final_cumplido = { por_var = "k_chueca", textos = {
            ["true"] = "El doctor Hartmann no tenia ninguna cura: tenia doscientas cuarenta pastillas de azucar con una K chueca, y lo confeso apenas la Chela le pregunto por el agua. Pero sabe hacer remedios, y la Chela le va a poner una consulta. A pelar papas primero.",
            otro = "El doctor Hartmann no tenia ninguna cura: era un charlatan. Pero sabe hacer remedios, y la Chela le va a poner una consulta. Y le conte de Eduardo, o no se lo conte. Eso lo se yo.",
        } },
        final_muerto = "El doctor Hartmann murio antes de llegar donde la Chela. Si tenia la cura, se fue con el.",
    },
}

Lore.arcos.cap_chela_4 = {
    etapas = {
        irma = "La primera noche la Chela saco a su vecina Irma Kemper de un incendio en la calle Main, ya mordida, y la dejo en la vereda. Irma sigue ahi. La Chela me pidio darle descanso.",
        irma_calle = "Estoy en {lugar:calle_main}. Hay una muerta con delantal de flores en la vereda, justo donde la Chela la dejo. Lleva un relicario al cuello.",
        doris = "Le di descanso a Irma Kemper. Tengo su relicario. Ahora voy por su hija, Doris, a {lugar:refugio_doris}.",
        sitio = "Llegue a {lugar:refugio_doris}. Doris Kemper aguanta adentro con una radio y una pala. Los muertos ya la encontraron.",
        hablar = "Doris esta viva. Su mama le decia que la Chela fue la unica que entro a buscarla esa noche.",
        escolta = "Llevo a Doris al cuartel de West Point. Dice que tiene que preguntarle algo a la Chela, y que no lo va a hacer por radio.",
        cuartel = "Doris y la Chela estan frente a frente en el cuartel. La Chela le conto lo de la vereda. Yo tengo el relicario de Irma en el bolsillo.",
    },
    finales = {
        final_relicario = "Le di a Doris el relicario de su mama: adentro, una foto de Irma y la Chela jovenes en una fiesta del cuartel. Doris le dijo que no la dejo, que la saco del fuego. La Chela lloro delante de mi y no me regano. Dice que vuelve a apagar fuegos.",
        final_descansa = "Le dije a Doris que su mama ya descansa y me guarde el relicario. Doris le dio las gracias a la Chela por entrar esa noche. La Chela salio con el camion a dar una vuelta larga, sola.",
        final_muerta = "Doris Kemper murio antes de llegar al cuartel. La Chela escribio su nombre al lado del de Irma, en la pared de la cocina.",
    },
}

-- ===========================================================================
-- Cabo Ramiro
-- ===========================================================================
Lore.arcos.cap_cabo_2 = {
    etapas = {
        viaje = "El Cabo me conto lo de la primera noche: saco a once por la puerta de atras de la comisaria. Quedan siete. Gladys Moreno es una, y esta rodeada en {lugar:casa}.",
        sitio = "Encontre a Gladys Moreno en {lugar:casa}. Los muertos ya rompieron una ventana. Hay que aguantar.",
        hablar = "Gladys me conto la noche de la comisaria: una sargento grito que cerraran todo y el Cabo abrio la puerta de atras igual. Nunca le dio las gracias.",
        escolta = "Llevo a Gladys Moreno donde el Cabo. Dice que esta vez le da las gracias en la cara.",
    },
    finales = {
        final_cumplido = "Gladys Moreno le dio las gracias al Cabo, diecinueve meses tarde. El tacho un signo de pregunta en su libreta y escribio 'viva'. Despues anoto aparte un nombre: Pereira, la sargento que grito que cerraran.",
        final_muerta = "Gladys Moreno no llego donde el Cabo. El la saco de la comisaria la primera noche y yo no pude sacarla de una casa. Puso una cruz en su libreta sin decir nada.",
    },
}

Lore.arcos.hija_cabo = {
    etapas = {
        viaje = "El Cabo me pidio buscar a su hija, Valentina, en {lugar:escuela}, en Louisville. Es la primera vez que le escucho decir por favor. Lleva las cartas que nunca le mando al final de la libreta.",
        escuela = "Llegue a {lugar:escuela}. Hay gente atrincherada y una horda encima. En la entrada pelea una muchacha con la misma mandibula del Cabo.",
        combate = "Valentina pelea como si alguien le hubiera ensenado a no retroceder. Ya se quien.",
        salvada = "Valentina esta viva. Cuando le dije quien me mandaba, se quedo callada un rato largo y despues me pidio que la llevara.",
        escolta = "Llevo a Valentina donde su papa. Me pregunta si sigue planchandose el uniforme con una olla. Le digo que si. Se rie.",
    },
    finales = {
        final_reencuentro = "Valentina llego a la comisaria. El Cabo le hizo un saludo militar perfecto que le temblo entero, y despues la abrazo sin decir 'negativo' ni una vez. Le dio las cartas. Todas.",
        final_perdida = "Valentina no llego a Muldraugh. Le tuve que contar al Cabo. Anoto una cruz en la libreta, en la ultima pagina, donde estaban las cartas.",
    },
}

Lore.arcos.cap_cabo_4 = {
    etapas = {
        amos = "El Cabo me paso dos nombres de su libreta. El primero es Amos Pruitt, en {lugar:casa_amos}. Quiere una cruz o un 'vivo'. No un 'no se'.",
        amos_casa = "Estoy en {lugar:casa_amos}. La puerta de la cocina esta trancada desde adentro. Alguien la tranco para que nadie entrara, no para que nadie saliera.",
        ortiz = "Amos Pruitt se transformo en su cocina. Dejo una nota y su reloj para el censo del Cabo. Ahora voy por Celia Ortiz y su hijo Joaquin, a {lugar:casa_ortiz}.",
        sitio = "Encontre a los Ortiz en {lugar:casa_ortiz}. Celia tiene un fierro en la mano y al hijo detras. Los muertos ya saben que estan aqui.",
        hablar = "Los Ortiz estan vivos. Celia pensaba que el Cabo ya los habia tachado. El hijo nunca lo creyo.",
        escolta = "Celia y Joaquin Ortiz van a la comisaria. Joaquin pregunta si el Cabo sigue planchandose el uniforme. Le digo que todos los dias.",
        entrega = "Llegamos a la comisaria. Falta lo mas dificil: darle al Cabo el dato de Amos Pruitt.",
    },
    finales = {
        final_cumplido = { por_var = "llegaron", textos = {
            dos = "El Cabo le dio cuerda al reloj de Amos Pruitt y escribio una cruz con letra derecha. Al lado de los Ortiz escribio 'vivos', en mayusculas. Quedan cuatro signos de pregunta.",
            otro = "El Cabo le dio cuerda al reloj de Amos Pruitt. De los Ortiz llego uno solo. En la misma pagina quedaron dos cruces y un 'vivo'." } },
        final_sin_reloj = { por_var = "llegaron", textos = {
            dos = "Le conte al Cabo lo de Amos Pruitt sin el reloj. Escribio la cruz igual, mas despacio que nunca. Al lado de los Ortiz escribio 'vivos'.",
            otro = "Le conte al Cabo lo de Amos Pruitt sin el reloj. De los Ortiz llego uno solo. Escribio dos cruces y un 'vivo', mas despacio que nunca." } },
        final_cruces = "Celia y Joaquin Ortiz murieron antes de llegar a la comisaria. El Cabo escribio dos cruces en la misma linea. Esa noche no se plancho el uniforme.",
    },
}

-- ===========================================================================
-- Padre Nacho
-- ===========================================================================
Lore.arcos.cap_nacho_2 = {
    etapas = {
        viaje = "El Padre Nacho boxeaba en Lexington. Su viejo rival, Frank 'el Martillo' Duggan, ahora roba en Riverside. Le llevo un reto a mano limpia a {lugar:guarida}.",
        guarida = "Llegue a {lugar:guarida}. Duggan es enorme, viejo y tiene las manos llenas de cicatrices.",
        reto = "Duggan leyo la carta del Padre y se rio tan fuerte que se le cayo el cigarro. Acepto: al anochecer, en la iglesia.",
        emboscada = "No todos los de Duggan creen en peleas limpias. Me siguen de vuelta a la iglesia.",
        esperar = "Tengo que estar en la iglesia al anochecer. El Padre se esta vendando las manos con una estola.",
        pelea = "Duggan llego a la iglesia al anochecer, solo, como prometio. El Padre se saco la sotana y la doblo con cuidado.",
        round = "Dos viejos se pegan en el atrio de una iglesia en el fin del mundo. Nadie del pueblo se pierde un segundo.",
    },
    finales = {
        final_cumplido = "El Padre Nacho peleo con Duggan en el atrio, sin guantes, como en el 79. Duggan se fue de Riverside con su banda. El Padre se curo los nudillos con vino de misa y dijo que Dios le dio dos punos por algo.",
    },
}

Lore.arcos.cap_nacho_3 = {
    etapas = {
        viaje = "El Padre me conto lo de Lucia: la muchacha que lo espero toda una tarde de domingo cuando el se fue sin avisar. Dicen que esta viva en {lugar:iglesia}.",
        iglesia = "Llegue a {lugar:iglesia}. La puerta esta abierta y hay muertos golpeando las ventanas. Alguien adentro canta para no escucharlos.",
        hablar = "Lucia se quedo a vivir en iglesias, siempre con la puerta abierta, por si alguien llegaba tarde. Le digo que el Padre la espera. Que ya no se va.",
        escolta = "Llevo a Lucia a Riverside. Dice que se va a sentar en la primera fila y que el la va a mirar a la cara.",
    },
    finales = {
        final_cumplido = "Lucia volvio a la iglesia de Riverside. Se sento en la primera fila y el Padre la miro a la cara. El le pidio perdon y ella le dijo que llegaba tarde, como siempre. Se queda.",
        final_muerta = "Lucia murio antes de llegar a Riverside. El Padre cerro la puerta de la iglesia por primera vez. Una sola noche.",
    },
}

Lore.arcos.cap_nacho_4 = {
    etapas = {
        viaje = "El Padre Nacho quiere tocar las campanas por primera vez en dos anos: una misa de verdad, para que venga el que quede vivo en Riverside. La cuerda se pudrio. Hay una en {lugar:ferreteria}.",
        ferreteria = "Estoy en {lugar:ferreteria}, buscando una cuerda que aguante una campana. Los muertos de aca no van a misa.",
        volver = "Tengo la cuerda. El Padre me espera en la iglesia, mirando el campanario como si fuera un ring.",
        esperar = "La misa es al mediodia. El Padre dice que traiga todo lo que dispare. Sabe lo que trae el ruido.",
        campanario = "Estoy al pie del campanario con la cuerda nueva. El Padre me hace una sena: tocala tu.",
        defensa = "Las campanas suenan y todo Riverside las escucha: los vivos y los muertos. Hay que aguantar en la iglesia hasta que lleguen los feligreses.",
        misa = "Los que llegaron estan sentados en los bancos, con las armas en las rodillas. El Padre se arregla la estola.",
    },
    finales = {
        final_cumplido = { por_var = "vinieron", textos = {
            todos = "Tocamos las campanas de Riverside y vino gente de todo el pueblo. El Padre dijo la misa sin hablar de Dios: dijo que la fe es venir. Otis, Ruth y Helen se quedan en la iglesia.",
            otro = "Tocamos las campanas de Riverside. No todos los que venian llegaron. El Padre rezo por ellos y dijo que la fe es venir. Los que quedaron se quedan en la iglesia." } },
        final_vacia = "Las campanas de Riverside sonaron y a la iglesia no llego nadie vivo. El Padre hizo la misa igual, para los bancos vacios y para mi.",
    },
}

-- ===========================================================================
-- Misia Rosa
-- ===========================================================================
Lore.arcos.cap_rosa_2 = {
    etapas = {
        viaje = "El Gordo Earl Whitaker, uno de los camioneros de las historias de la Misia Rosa, quedo varado en {lugar:camion} con la carga. Tres hijas y deudas con medio Kentucky.",
        sitio = "Encontre al Gordo Earl en {lugar:camion}, encerrado en la cabina, comiendo galletas como si fuera un dia cualquiera. Los muertos golpean el vidrio.",
        escolta = "Llevo al Gordo Earl a la gasolinera. No para de hablar de la Misia Rosa. Creo que la quiere. Creo que ella lo sabe.",
        entrega = "Llegamos a la gasolinera. Falta entregarle la carga a la Misia Rosa.",
    },
    finales = {
        final_cumplido = "La Misia Rosa le sirvio cafe al Gordo Earl como a las tres de la manana de antes y le conto a quien le debe dinero. Earl se rio tanto que se le cayo el cafe. Ella anoto que el seguia vivo.",
        final_muerto = "El Gordo Earl no llego a la gasolinera. La Misia Rosa lo anoto en pasado, con la misma letra de siempre. Despues apago la luz un minuto.",
    },
}

Lore.arcos.cap_rosa_3 = {
    etapas = {
        preparar = "Unos bandidos se enteraron del tanque escondido bajo el taller de la Misia Rosa. Vienen esta noche. Ella dice que no tiene miedo. Le tiemblan las manos.",
        preparar_ray = "Ray Doyle, el soldado que escondi, hablo por el 19 desde el cerro: un Peterbilt rojo y una camioneta, sin focos, seis o siete hombres. Bajan a las dos y dejan los camiones en la curva de la 31. Esta vez se a que hora vienen. Los espero en la gasolinera o les salgo al paso en la curva.",
        asalto = "Por primera vez en treinta anos la gasolinera de Rosewood esta a oscuras. Los bandidos vienen. La Misia Rosa me pidio que apagara yo la luz.",
        emboscada = "Les sali al paso en la curva de la 31, como dijo Ray. Bajan a pie, a oscuras, con palas. Atras se apago la luz de la gasolinera.",
        amanecer = "Paso la noche. El Gordo Earl anda dando vueltas alrededor del mostrador como quien tiene algo atravesado. Quiere hablar con la Misia Rosa.",
        confesion = "El Gordo Earl le confeso a la Misia Rosa que el dato del tanque lo dio el: el Tecolote le llevo insulina a la bascula y el se rio y lo adivino. Rosa no sabia ni que era diabetico. Los dos me miran, como si yo tuviera que decir algo.",
    },
    finales = {
        final_cumplido = { por_var = "earl", textos = {
            perdonado = "Defendimos la gasolinera y el tanque. Earl confeso que el dato lo dio el, por insulina. La Misia Rosa le pregunto lleno o normal, el dijo lleno, y ahora le sirve el cafe sin azucar. El primer camion lo manejo yo.",
            echado = "Defendimos la gasolinera y el tanque. Earl confeso que el dato lo dio el, por insulina, y la Misia Rosa lo mando a dormir a su camion sin cafe. Dejo la luz prendida igual, por si se pierde.",
            callado = "Defendimos la gasolinera y el tanque. El Gordo Earl anduvo rondando el mostrador y no dijo nada. El primer camion lo manejo yo.",
            otro = "Defendimos la gasolinera y el tanque. La Misia Rosa prendio la luz otra vez. Dice que el tanque es para el dia en que haya que sacar a todo el pueblo de una vez, y que yo voy a manejar el primer camion." } },
        final_saqueado = { por_var = "earl", textos = {
            perdonado = "No estuve en la gasolinera esa noche. Los bandidos vaciaron el tanque. Earl confeso que el dato lo dio el; la Misia Rosa le sirvio el cafe sin azucar igual. Dijo que se llevaron bencina, no a el.",
            echado = "No estuve en la gasolinera esa noche. Los bandidos vaciaron el tanque. Earl confeso que el dato lo dio el y la Misia Rosa lo mando a dormir a su camion. La luz la dejo prendida.",
            callado = "No estuve en la gasolinera esa noche. Los bandidos vaciaron el tanque. Earl no dijo nada. La Misia Rosa prendio la luz igual.",
            otro = "No estuve en la gasolinera esa noche. Los bandidos vaciaron el tanque. La Misia Rosa prendio la luz igual y dijo que estamos vivos, que eso no se lo llevan." } },
    },
}

Lore.arcos.cap_rosa_4 = {
    etapas = {
        viaje = "Hank Morrow, un guardia que tomaba cafe en la gasolinera, le conto a la Misia Rosa que la armeria de la carcel de Rosewood quedo cerrada con todo adentro. Nadie ha limpiado esa carcel. Voy para alla.",
        muro = "Las sirenas de la carcel siguen sonando. Del patio sale una marea de presos y guardias muertos. Hay que abrirse paso.",
        pabellones = "Pasamos el patio. Desde los pabellones se oye el golpeteo de las rejas. Vienen mas, y mas rapido.",
        limpieza = "Quedan pocos. Hay que dejar limpio el camino a la armeria antes de abrirla.",
        armeria = "La armeria estaba cerrada, como dijo Hank. Fusiles, escopetas, pistolas y municion para un invierno entero.",
        volver = "La carcel de Rosewood esta limpia. Falta contarselo a la Misia Rosa.",
    },
    finales = {
        final_cumplido = "Limpiamos la carcel de Rosewood, la que nadie se atrevia a tocar. La Misia Rosa anoto a Hank Morrow en pasado y mi nombre al lado, en presente.",
        final_abandono = "Nunca fui a la carcel de Rosewood. La Misia Rosa dijo que la armeria iba a seguir ahi, esperando a alguien mas valiente.",
    },
}

Lore.arcos.cap_rosa_5 = {
    etapas = {
        bencina = "Una marea de muertos baja por la ruta 31 hacia Rosewood y la Misia Rosa quiere sacar al pueblo en camion. Pero el tanque esta vacio: hay que conseguir bencina en {lugar:bencinera}.",
        bencinera = "Estoy en {lugar:bencinera}. Tiene que quedar algun bidon lleno. La marea no espera.",
        bencina_volver = "Tengo la bencina para el camion. La Misia Rosa me espera en la gasolinera con las llaves en la mano.",
        viaje_turner = "Una marea de muertos baja por la ruta 31. La Misia Rosa quiere juntar a las familias del pueblo en la gasolinera. Primero, los Turner, en {lugar:casa_turner}.",
        casa_turner = "Llegue donde los Turner, en {lugar:casa_turner}. Ellen y su tio Roy estan atrincherados en el living. Los muertos ya los olieron.",
        viaje_mercer = "Los Turner van solos a la gasolinera. Ahora los Mercer, en {lugar:casa_mercer}.",
        casa_mercer = "Llegue donde los Mercer, en {lugar:casa_mercer}. Andre tiene una llave inglesa en cada mano. Laura, una escopeta sin cartuchos.",
        reunion = "Las familias van a la gasolinera por su cuenta. Tengo que llegar antes que la marea.",
        marea = "La marea de la 31 llego a la gasolinera. La Misia Rosa carga el camion. Yo no los dejo pasar del surtidor.",
    },
    finales = {
        final_carcel = { por_var = "vinieron", textos = {
            todos = "Maneje el primer camion de la Misia Rosa hasta la carcel que limpiamos. Los Turner y los Mercer viven ahora detras de los muros. La Misia Rosa dice que la carcel ya no es carcel: es el pueblo.",
            otro = "Maneje el primer camion de la Misia Rosa hasta la carcel. No llegaron todos. Los que llegaron viven detras de los muros." } },
        final_gasolinera = { por_var = "vinieron", textos = {
            todos = "Aguantamos la marea en la gasolinera. La carcel sigue llena de muertos, asi que el camion no salio. Los Turner y los Mercer se quedan con la Misia Rosa, de guardias.",
            otro = "Aguantamos la marea en la gasolinera, pero no llegaron todos. Los que quedaron se quedan con la Misia Rosa, de guardias." } },
        final_perdidos = "Los Turner y los Mercer no llegaron a la gasolinera. El primer camion salio vacio y la Misia Rosa no prendio la luz esa noche.",
    },
}

return Lore
