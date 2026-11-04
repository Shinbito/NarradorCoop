-- Narrador Co-op: el diario de las misiones de la panaderia Hollis (Arcos/Hollis.lua): el raton
-- de la harina, el primer pan, la camioneta del pan y la iglesia de Shively. Sin tildes ni enies,
-- primera persona.

require "Narrador/NarradorLore"

local Lore = Narrador.Lore

Lore.arcos.raton_harina = {
    intro = "En el rincon de los Bell todo esta doblado en tres pilas iguales. Menos la cuenta de la harina, dice Wade.",
    etapas = {
        espera = "Wade dice que al saco de harina le falta una cucharada por dia desde que llegaron. Puso una trampa de ratones al lado. Los ratones no saben contar; el si. Esta noche duermo en {lugar:refugio}.",
        trampa = "Tres y media de la manana. La trampa de Wade salto y no pillo a un raton: pillo a Yvonne, con una cucharada de harina en la otra mano. Me pide que no despierte al nino.",
        confesion = "Yvonne me conto para que es la harina: para la Vieja, la masa madre de la panaderia. Le da de comer una cucharada al dia, a las tres y media, y la saca de la cuenta de Wade. Dice que esos cinco minutos es feliz y que le da verguenza.",
    },
    finales = {
        final_callado = "Hice como que no vi a Yvonne con el dedo en la trampa de Wade. Desde ese dia la harina le cuadra al nino. Ella me debe un silencio, dice, y el silencio pesa mas.",
        final_secreto = "Yvonne le da de comer a la Vieja con la harina de la racion. Le guardo el secreto. Ahora la cucharada sale de la suya, y la cuenta de Wade cuadra.",
        final_confeso = "Yvonne le conto a su familia lo de la Vieja y la harina, en el desayuno. Bien, no bonito. Daniel se rio de si mismo y Wade saco la cuenta en voz alta: trescientas sesenta y cinco cucharadas al ano.",
        final_daniel = "Desperte a Daniel y encontro a Yvonne con el dedo en la trampa. Sabia del frasco, no de la harina. Le reclamo en voz baja y despues se quedo callado mucho rato, como si el tambien debiera algo.",
        final_wade = "La trampa de Wade salto sin mi. Pillo un pelo largo, castano con canas. Wade sabe quien es el raton y no se lo va a decir a nadie: dice que lo correcto y lo justo no siempre dan el mismo numero.",
    },
}

Lore.arcos.primer_pan = {
    intro = "Yvonne me debe el primer pan de un horno de verdad. Entero y caliente, dice.",
    etapas = {
        viaje = "Yvonne necesita un horno de verdad para la Vieja. En {lugar:horno} queda uno: hay que traer la puerta. Daniel arma el resto en el refugio con un tambor de aceite y ladrillos.",
        cocina = "Estoy en {lugar:horno}. Entre la grasa vieja y los muertos tiene que estar la puerta de un horno que todavia cierre.",
        volver = "Tengo la puerta del horno. Los Bell me esperan en {lugar:refugio}.",
        armar = "Daniel armo el horno en {lugar:refugio} con un tambor de aceite, ladrillos y la puerta que traje. Yvonne despierta a la Vieja temprano: el primer pan sale a las tres y media.",
    },
    finales = {
        final_primer_pan = "A las tres y media Yvonne abrio la puerta del horno y el refugio entero olio a panaderia. Me dio el primer pan, entero y caliente, como me lo debia. Wade los repartio en partes iguales. Desde ahora Yvonne hornea cada dos dias.",
        final_sin_ti = "No estuve a las tres y media, pero Yvonne horneo igual el primer pan del horno nuevo y me guardo el mio en un pano. Desde ahora hornea cada dos dias.",
        final_sin_yvonne = "Yvonne ya no esta en el refugio. El horno se quedo en una idea.",
    },
}

Lore.arcos.camioneta_pan = {
    intro = "La Misia Rosa nunca me habia pedido nada para ella. Esto tampoco es para ella: es para Junior.",
    etapas = {
        viaje = "Walt Hollis, el panadero de Riverside y abuelo de Junior, salio mordido el 10 de julio en su camioneta blanca a buscar a su hija Linda a Rosewood. Nunca llego. El Cabo la vio pasar al sur de Muldraugh esa tarde, zigzagueando. Mas abajo la Guardia tenia la barricada sur de la 31. Tiene que estar en {lugar:camioneta}.",
        camioneta = "La camioneta de la panaderia Hollis esta atravesada en la 31, cerca de la barricada sur de la Guardia, con un pan pintado en la puerta. Algo se mueve adentro.",
        registrar = "Walt Hollis descansa. Tenia el brazo envuelto en el delantal y harina en las cejas. En la camioneta quedan una libreta de recetas, una foto en el parasol y las llaves. Me puedo llevar una sola cosa.",
        volver = "Vuelvo a la gasolinera de Rosewood con lo de Walt. No se como se le dice a alguien que su abuelo si fue a buscarlos.",
        gasolinera = "La Misia Rosa me sirvio cafe recalentado antes de que dijera nada. Ya sabe. Se me nota en la cara.",
        yvonne = "Falta Yvonne. Trabajo diecisiete anos con Walt y fue ella la que cerro la panaderia ese dia.",
    },
    finales = {
        final_yvonne = "Le conte a Yvonne lo de Walt. Me repitio lo ultimo que le dijo: 'Cierra tu, Yvonne. Voy por Linda'. Estaba amasando, como siempre que se muere alguien.",
        final_receta = "Le di a Yvonne la libreta de recetas de Walt. La abrio en la pagina doce sin buscarla: el pan de Hazel, de 1931. Dice que no es una libreta, que es una casa.",
        final_rosa = "Le conte a la Misia Rosa que a Walt Hollis lo paro la Guardia en la barricada sur. Lo anoto en pasado, con letra bonita: tercos como mula y buenos como el pan, los Hollis.",
        final_abandono = "Nunca fui a buscar la camioneta de Walt. Sigue en la 31, con el al volante.",
    },
}

Lore.arcos.iglesia_shively = {
    intro = "Junior por fin le conto a su tia lo de Shively. A tiempo. Bueno, casi.",
    etapas = {
        viaje = "El dato es del Tecolote, que lo oyo del Pato Rengo: una mujer con delantal de farmacia y un chico de catorce en una iglesia de ladrillo de Shively, en la Dixie Highway. Pueden ser Linda Hollis y Nico. Voy a {lugar:iglesia}.",
        sitio = "En {lugar:iglesia} alguien golpea una olla para espantar a los muertos. Son una mujer y un chico flaco con gorra. Hay que sacarlos vivos.",
        hablar = "La mujer me apunta con una barreta. Ya le mintieron dos veces con eso de 'vengo de parte de'. Tengo que convencerla de que me manda Junior.",
        escolta = "Linda Hollis y Nico van a Rosewood. Es un viaje largo desde Louisville. Junior no sabe todavia.",
        vacia = "La iglesia esta vacia: bancos contra las ventanas, frazadas dobladas, ceniza en una olla. Hay un papel clavado en el letrero del bingo.",
        volver_nota = "Linda y Nico estuvieron en Shively y se fueron al norte. Dejaron una nota para Junior. Se la llevo a Rosewood.",
        cebo = "El letrero del bingo esta recien pintado y adentro una radio repite la misma voz. Es cebo, y alguien me esta mirando.",
        radio_pato = "Detras del altar estaba la radio del Pato Rengo, el que le paso el dato al Tecolote. Lo usaron de disco para cazar a los que buscan a los suyos.",
        volver_cebo = "Vuelvo a Rosewood sin Linda y sin Nico. Junior me va a mirar la cara antes de que hable.",
    },
    finales = {
        final_vivos = {
            por_var = "llegaron",
            textos = {
                dos = "Traje a Linda Hollis y a Nico a la gasolinera de Rosewood. Junior le pregunto a su mama 'lleno o normal' y ella dijo 'lleno'. Se quedan con la Misia Rosa, con la luz prendida.",
                otro = "Traje de vuelta a uno de los dos. El otro se quedo en el camino. Junior no dijo nada; la Misia Rosa puso dos tazas igual.",
            },
        },
        final_muertos = "Linda Hollis y Nico murieron antes de llegar a Rosewood. Eran ellos. Junior se fue a la isla de la bomba a mirar la 31.",
        final_nota = "Le di a Junior la nota de su mama. Linda y Nico viven, en algun lado al norte. La pego en la caja, al lado de la foto del tio.",
        final_cebo = "Shively era cebo. El Tecolote no le mintio a Junior: le mintieron a el. Junior dice que su mama sigue en algun lado que no es ese.",
        final_huida = "Shively era cebo. Sali de ahi como pude. Linda y Nico no estaban.",
        final_abandono = "No fui a Shively. La direccion sigue en el cuaderno de Junior, al lado de la linea en blanco.",
    },
}

return Lore
