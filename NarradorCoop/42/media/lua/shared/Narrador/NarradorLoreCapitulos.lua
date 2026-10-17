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
    rosewood = { quien = "La Misia Rosa", edificio = "la bencinera",
        llegada = "Una senora con delantal grito 'mijito, abre!' en la puerta de {lugar:casa}, como si me conociera de toda la vida." },
}
for id, d in pairs(DESBLOQUEO) do
    Lore.arcos["desbloqueo_" .. id] = {
        etapas = {
            llegada = d.llegada,
            pedido = d.quien .. " quiere armar un campamento en " .. d.edificio .. ", pero esta lleno de muertos. Me pide ayuda para limpiarlo. Lo que encuentre adentro es mio.",
            pendiente = "Le dije a " .. string.lower(string.sub(d.quien, 1, 1)) .. string.sub(d.quien, 2) .. " que mas rato. Me espera en {lugar:contacto}. No parece de los que se olvidan.",
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
        subir = "La radio funciono un segundo. Una voz de hombre dijo 'Mama, si me oyes...' y se corto. Era Eduardo. La Chela no lloro delante mio. Hay que arreglar {lugar:antena}.",
        arreglar = "Estoy en {lugar:antena}. La antena chirria y todo lo que tiene oidos en el cerro la escucho. Hay que aguantar hasta que quede firme.",
    },
    finales = {
        final_cumplido = "Arregle la antena. La Chela escucho la voz entera: 'Mama, si me oyes, estoy bien. Hay un cientifico en Louisville que dice tener la cura. Voy a ayudarlo.' Lloro. Despues me reto por mirarla.",
    },
}

Lore.arcos.leyenda_eduardo = {
    etapas = {
        viaje = "Un cientifico pide ayuda por la radio de la Chela: dice que tiene la cura. Ella no le cree ni el saludo, pero quiere un doctor. Esta en {lugar:objetivo}.",
        sitio = "Llegue a {lugar:objetivo}. Alguien ya esta peleando: un tipo alto, solo contra la horda, con un arma que no parece de este mundo.",
        combate = "Peleo al lado del desconocido para salvar al cientifico. Pega como si cada muerto le debiera algo.",
        conocerlo = "El desconocido se presento: Eduardo Giovanns. El hijo de la Tia Chela. El de la radio. El que la gente nombra cuando cuenta como se salvo.",
        caido = "Eduardo cayo cubriendo al doctor. Su arma quedo en el suelo. No se levanto. Todavia.",
        escolta = "Llevo al doctor Hartmann donde la Chela. Camina detras mio hablando de la cura que tiene. No le creo.",
    },
    finales = {
        final_cumplido = "El doctor Hartmann no tenia ninguna cura: era un charlatan. Pero sabe hacer remedios, y la Chela le va a poner una consulta. Y le conte de Eduardo, o no se lo conte. Eso lo se yo.",
        final_muerto = "El doctor Hartmann murio antes de llegar donde la Chela. Si tenia la cura, se fue con el.",
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

-- ===========================================================================
-- Misia Rosa
-- ===========================================================================
Lore.arcos.cap_rosa_2 = {
    etapas = {
        viaje = "El Gordo Earl Whitaker, uno de los camioneros de las historias de la Misia Rosa, quedo varado en {lugar:camion} con la carga. Tres hijas y deudas con medio Kentucky.",
        sitio = "Encontre al Gordo Earl en {lugar:camion}, encerrado en la cabina, comiendo galletas como si fuera un dia cualquiera. Los muertos golpean el vidrio.",
        escolta = "Llevo al Gordo Earl a la bencinera. No para de hablar de la Misia Rosa. Creo que la quiere. Creo que ella lo sabe.",
        entrega = "Llegamos a la bencinera. Falta entregarle la carga a la Misia Rosa.",
    },
    finales = {
        final_cumplido = "La Misia Rosa le sirvio cafe al Gordo Earl como a las tres de la manana de antes y le conto a quien le debe plata. Earl se rio tanto que se le cayo el cafe. Ella anoto que el seguia vivo.",
        final_muerto = "El Gordo Earl no llego a la bencinera. La Misia Rosa lo anoto en pasado, con la misma letra de siempre. Despues apago la luz un minuto.",
    },
}

Lore.arcos.cap_rosa_3 = {
    etapas = {
        preparar = "Unos bandidos se enteraron del estanque escondido bajo el taller de la Misia Rosa. Vienen esta noche. Ella dice que no tiene miedo. Le tiemblan las manos.",
        asalto = "Por primera vez en treinta anos la bencinera de Rosewood esta a oscuras. Los bandidos vienen. La Misia Rosa me pidio que apagara yo la luz.",
    },
    finales = {
        final_cumplido = "Defendimos la bencinera y el estanque. La Misia Rosa prendio la luz otra vez. Dice que el estanque es para el dia en que haya que sacar a todo el pueblo de una vez, y que yo voy a manejar el primer camion.",
    },
}

return Lore
