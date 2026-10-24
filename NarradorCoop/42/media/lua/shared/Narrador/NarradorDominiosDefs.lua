-- Narrador Co-op: quien manda en cada ciudad (datos compartidos por servidor y cliente).
-- Cada campamento de misionero tiene un "dominio":
--   mision  : el misionero de siempre (Cabo Ramiro, Tia Chela, Padre Nacho, Misia Rosa).
--   bandido : lo conquisto la banda del patio de trenes (el camino del bandido, fase 2). Manda un
--             capitan, con los mismos comerciantes, y sus encargos son todos inmorales.
--   nuevo   : Knox se reconquisto con Eduardo (fase 3). Manda un misionero nuevo.
-- El servidor lo aplica en server/Narrador/NarradorDominios.lua (memoria "dominio_<id>").
-- Textos sin tildes ni enies a proposito.

Narrador = Narrador or {}
local DD = Narrador.DominiosDefs or {}
Narrador.DominiosDefs = DD

-- Los capitanes: contraparte oscura de cada misionero. nombre y apellido como en C.LISTA.
DD.CAPITANES = {
    muldraugh = {
        rol = "capitan_vargas", nombre = "Capitan Vargas", apellido = "Toledo", perfil = "k93_muldraugh_pd_03",
        oficio = "ex guardia de carcel",
        frases = {
            "Bienvenido a mi comisaria. Aca se paga por entrar y se paga por salir.",
            "El cabo llevaba un censo. Yo llevo una libreta de deudas. Adivina en cual estas.",
            "Veinte anos cuidando presos. Ahora el pueblo entero es mi patio.",
            "No me mires asi. Yo no invente las rejas, solo tengo las llaves.",
            "Tengo trabajo. Del sucio. Del que paga.",
            "Si alguien no paga, me avisas. Si tu no pagas, te aviso yo.",
        },
        rangos = { "Reo", "Recluso", "Cabo de patio", "Guardia", "Alcaide" },
        perfil_lore = {
            "El Capitan Vargas Toledo manda en la comisaria del Cabo Ramiro. Fue guardia de carcel veinte anos. Lleva una libreta, como el Cabo, pero en la suya anota lo que le deben.",
            "Dice que la carcel le enseno todo: que nadie es inocente y que todos tienen precio. Se rie cuando lo dice, pero no con los ojos.",
            "Duerme en la oficina del segundo piso, en la silla del Cabo. No la ha limpiado. Dice que le gusta acordarse de quien estaba antes.",
        },
    },
    westpoint = {
        rol = "capitana_kell", nombre = "Capitana Morrigan", apellido = "Kell", perfil = "k93_vfd_05",
        oficio = "piromana",
        frases = {
            "El fuego es honesto. Lo que no se puede defender, se quema.",
            "La vieja apagaba incendios. Yo los prendo. Alguien tenia que equilibrar.",
            "Una casa vacia es una casa que ocupa otro. Mejor ceniza.",
            "Tengo fosforos y tengo trabajo. Elige cual te doy primero.",
            "No me tiembla el pulso. Me tiembla la paciencia.",
            "Huele a humo, cierto? Es que siempre huele a humo cuando estoy yo.",
        },
        rangos = { "Ceniza", "Chispa", "Fosforo", "Antorcha", "Incendio" },
        perfil_lore = {
            "La Capitana Morrigan Kell manda en el cuartel de bomberos de West Point. Quema casas 'para que no las ocupen'. El camion de bomberos de la Chela esta en el patio, con el tanque lleno de gasolina.",
            "Dicen que antes de todo esto la detuvieron tres veces por incendios que nadie pudo probar. Ella dice que fueron cuatro.",
            "Encontro la frazada que la Chela le guardaba a su hijo. No la quemo. La tiene doblada en una silla y nadie sabe por que.",
        },
    },
    riverside = {
        rol = "diacono_reyes", nombre = "Diacono Saul", apellido = "Reyes", perfil = "k93_prather_06",
        oficio = "falso predicador",
        frases = {
            "El diezmo es voluntario, hijo. Voluntariamente me lo das o voluntariamente te lo quito.",
            "El Padre Nacho creia en las segundas oportunidades. Yo creo en los pagos atrasados.",
            "Dios ve todo. Yo tambien, y soy mas rencoroso.",
            "Arrodillate si quieres. Igual tienes que pagar.",
            "Tengo una mision para ti. Bendita, por supuesto. Todo lo que yo mando es bendito.",
            "La puerta de la iglesia ya no esta abierta. Esta vigilada.",
        },
        rangos = { "Pecador", "Diezmero", "Acolito", "Predicador", "Profeta" },
        perfil_lore = {
            "El Diacono Saul Reyes predica en la iglesia de Riverside, la del Padre Nacho. No es diacono de nada. Cobra el diezmo a punta de pistola y lo llama ofrenda.",
            "Se sabe la Biblia de memoria, pero solo las partes de castigo. Cuando le pregunte por la otra mejilla me pego en las dos.",
            "Cerro la puerta de la iglesia que el Padre Nacho nunca cerraba. La gente de Riverside dice que desde ese dia el pueblo esta mas oscuro.",
        },
    },
    rosewood = {
        rol = "capitan_duarte", nombre = "Capitan Tito", apellido = "Duarte", perfil = "k93_truckstop_11",
        oficio = "contrabandista",
        frases = {
            "Gasolina tengo. La saque de abajo del taller. La vieja la tenia bien escondida.",
            "Todo se vende. La gasolina, las balas, la gente. Sobre todo la gente.",
            "Lleno o normal? Normal te cuesta un brazo. Lleno, los dos.",
            "Treinta anos de ruta. Se donde se esconde todo el mundo. Por eso me pagan.",
            "Tengo un encargo. No preguntes que va adentro del camion.",
            "La gasolinera nunca cierra, decia la vieja. Tenia razon. Ahora es mia y nunca cierra.",
        },
        rangos = { "Carga", "Mula", "Chofer", "Socio", "Patron" },
        perfil_lore = {
            "El Capitan Tito Duarte maneja la gasolinera de Rosewood. Era camionero de la ruta 31 y contrabandista antes de que el mundo se acabara. Encontro el tanque escondido de la Misia Rosa y vende la gasolina a precio de sangre.",
            "Se sabe la vida de todos los camioneros, como la Misia. Pero el no la cuenta para que no se pierdan: la usa para cobrar.",
            "La foto de Hector sigue pegada en la caja registradora. Duarte le pinto bigotes con marcador. Es lo unico que me dan ganas de matarlo sin que nadie me lo pida.",
        },
    },
}

-- Los misioneros nuevos de la reconquista (fase 3): Knox se reconquisto con Eduardo y en cada
-- ciudad vuelve alguien que cree en la gente. Te tienen toda la confianza (trajiste la paz).
DD.NUEVOS = {
    muldraugh = {
        presentacion = "Valentina, la hija del Cabo Ramiro",
        rol = "valentina", nombre = "Valentina", apellido = "Mandados", perfil = "k93_hensley_family_03",
        oficio = "hija del Cabo Ramiro",
        frases = {
            "Mi papa anotaba a todos en una libreta. Yo tambien. Pero en una sola lista: la de los que quedan.",
            "Llegue de Louisville por la radio. Tarde. Siempre llego tarde a lo de mi papa.",
            "Tengo trabajo. Del limpio. Del que ayuda.",
            "Firmes, civil. Asi decia el. Me sale solo.",
            "Encontre sus cartas al final de la libreta. Las leo todas las noches.",
            "Negativo a rendirse. Eso tambien me lo dejo.",
        },
        rangos = { "Civil", "Recluta", "Soldado", "Sargento", "Mi General" },
        perfil_lore = {
            "Valentina Mandados, la hija del Cabo Ramiro, manda ahora en la comisaria de Muldraugh. Llego de Louisville siguiendo la radio, demasiado tarde para su papa.",
            "Encontro las cartas que el Cabo le escribia y nunca mandaba, al final de su libreta. Las lee todas las noches, una por una.",
            "Habla como el sin darse cuenta: 'negativo', 'civil', 'firmes'. Cuando se escucha, se rie y se le mojan los ojos al mismo tiempo.",
        },
    },
    westpoint = {
        presentacion = "Eduardo",
        rol = "eduardo", nombre = "Eduardo", apellido = "Giovanns", perfil = "k93_stockyard_05",
        oficio = "hijo de la Tia Chela",
        frases = {
            "Mi mama tenia recados para todos. Yo tambien. Toma agua antes de salir, ah?",
            "No soy ninguna leyenda. Llegue tarde a casa, nada mas.",
            "La frazada sigue en la silla. No la voy a mover.",
            "Cuida a la gente. Es lo unico que importa.",
            "Si te muerden, no vuelvas. Te quiero, pero no tanto. Asi decia ella. Me sale igual.",
            "Siempre hay alguien esperando que llegue alguien. Hoy te toca a ti.",
        },
        rangos = { "Desconocido", "Mijito", "Consentido", "Sobrino", "Hijo de la casa" },
        perfil_lore = {
            "Eduardo Giovanns volvio al cuartel de West Point, el de su mama. Ahora el reparte los recados. La frazada que ella le guardaba sigue doblada en la silla.",
            "Intento matarme tres veces. A la tercera me tuvo en el suelo y no disparo. Dice que su mama decia que todos merecen una segunda oportunidad. Yo soy la prueba de que tenia razon. O de que no.",
            "Cocina para todos y le falta una porcion, como a ella. Cuando le pregunto, dice que ya comio. No ha comido.",
        },
    },
    riverside = {
        presentacion = "la Hermana Lucia",
        rol = "lucia", nombre = "Hermana Lucia", apellido = "Pegas", perfil = "k93_prather_08",
        oficio = "monja",
        frases = {
            "Hace anos espere al Padre Nacho en esta iglesia. No llego. Ahora la puerta la abro yo.",
            "La puerta no se cierra. Nunca. Eso lo aprendi esperando.",
            "Tengo encargos. No los invento, como el Padre. Bueno, algunos.",
            "Dios no se fue de vacaciones. Se quedo esperando, como yo.",
            "Ve en paz. Y si no hay paz, vuelve que aca hay sopa.",
            "Adopte el apellido del Padre. Pegas. Le hubiera dado risa.",
        },
        rangos = { "Oveja perdida", "Feligres", "Monaguillo", "Diacono", "Santo varon" },
        perfil_lore = {
            "La Hermana Lucia es la muchacha que esperaba al Padre Nacho en la iglesia, hace anos, el domingo que el se fue. Ahora es ella la que abre la puerta.",
            "Tomo el apellido del Padre, Pegas. Dice que es para que alguien en Riverside lo siga llevando.",
            "No cierra nunca la puerta. Cuando le pregunte por que, me dijo: 'Porque se lo que es esperar del otro lado'.",
        },
    },
    rosewood = {
        presentacion = "Hector, el sobrino de la Misia Rosa",
        rol = "hector", nombre = "Hector", apellido = "Bencina Jr.", perfil = "k93_truckstop_10",
        oficio = "sobrino de la Misia Rosa",
        frases = {
            "La tia decia que la bomba no se para. No se para, entonces.",
            "Me salvo una pastilla que alguien trajo desde Louisville. Desde ese dia le debo la vida a un desconocido.",
            "La foto del tio Hector sigue en la caja. Le saque los bigotes de marcador. Me costo.",
            "Gasolina hay poca. Encargos hay muchos.",
            "La luz queda prendida toda la noche. Por la tia. Y porque a mi tambien me da miedo.",
            "Lleno o normal? Es broma. Ella siempre hacia esa broma.",
        },
        rangos = { "Forastero", "Vecino", "Compadre", "Socio de la bomba", "Dueno de la gasolinera" },
        perfil_lore = {
            "Hector Bencina Jr., el sobrino de la Misia Rosa, atiende ahora la gasolinera de Rosewood. Era el que estaba con fiebre en la bodega cuando su tia pedia la cura.",
            "Le limpio los bigotes de marcador a la foto de su tio en la caja registradora. Le tomo una tarde entera.",
            "Deja la luz prendida toda la noche. Dice que es por su tia. Despues admite que tambien es por el.",
        },
    },
}

-- Perfil del diario segun el dominio (el cliente lo usa en Diario.loQueSe).
-- Si el misionero nuevo de una ciudad murio antes (en su capitulo, o el sobrino de la Misia Rosa
-- en la mision de la cura), en la reconquista lo
-- reemplaza un Bell que siga vivo en tu refugio (en el orden de PREFERENCIA_BELL) y, si no
-- queda ninguno, un mercader que andaba de paso (K.MERCADERES). Lo elige el servidor al
-- reconquistar y queda en la memoria "nuevo_<id>" (bell_padre, bell_madre, bell_hijo o forastero).
DD.NUEVO_MURIO = {
    muldraugh = { murio = { "hija_cabo", "muerta" } },
    riverside = { murio = { "lucia", "muerta" } },
    rosewood = { murio = { "cura_rosewood", "murio" } },
}
DD.PREFERENCIA_BELL = {
    muldraugh = { "padre", "hijo", "madre" },
    riverside = { "madre", "padre", "hijo" },
    rosewood = { "hijo", "padre", "madre" },
}

local RANGOS_BELL = { "Forastero", "Vecino", "Conocido", "De la casa", "Familia" }

DD.REEMPLAZOS = {
    bell_padre = {
        presentacion = "Daniel Bell, el de la familia que llego a tu refugio",
        rol = "daniel_bell", nombre = "Daniel", apellido = "Bell", perfil = "k93_bell_family_01",
        oficio = "padre de familia",
        frases = {
            "Llegue a tu puerta pidiendo techo. Ahora la puerta la abro yo. Raro, no?",
            "Aca no se le cierra la puerta a nadie. Me acuerdo de lo que es golpear y que no abran.",
            "Tengo trabajo. Honrado. Como el que tu me diste a mi.",
            "Si viene algo grande, escapamos y volvemos. Eso lo aprendi en tu refugio.",
            "Le debo la vida a mi familia, y la vida de mi familia te la debo a ti.",
            "No soy el que estaba antes. Hago lo que puedo con lo que dejo.",
        },
        rangos = RANGOS_BELL,
        perfil_lore = {
            "Daniel Bell manda ahora donde antes mandaba otro. Llego a mi refugio pidiendo techo unos dias; ahora es el quien da techo.",
            "Dice que no sabe mandar, que solo sabe cuidar a los suyos. Le dije que es lo mismo. Se rio y no me creyo.",
            "Guarda la lista de los que llegan, como hacia el que estaba antes. Al final de la lista anoto a su familia.",
        },
    },
    bell_madre = {
        presentacion = "Yvonne Bell, la de la familia que llego a tu refugio",
        rol = "yvonne_bell", nombre = "Yvonne", apellido = "Bell", perfil = "k93_bell_family_02",
        oficio = "madre de familia",
        frases = {
            "Hay sopa. Poca, pero hay. Despues hablamos de trabajo.",
            "Aca se comparte. El que no comparte, que se vaya a otro pueblo.",
            "Tengo encargos. Y una venda, por si vuelves mal.",
            "Esta puerta se queda abierta. Yo se lo que es esperar del otro lado.",
            "Te debo mas de lo que te puedo pagar. Empecemos por algo.",
            "Si te muerden, no me mientas. Ya me mintieron una vez sobre una cura.",
        },
        rangos = RANGOS_BELL,
        perfil_lore = {
            "Yvonne Bell cuida ahora el lugar. Llego a mi refugio con su familia y una fiebre en la casa; ahora reparte la sopa y los encargos.",
            "No le gusta que le digan que manda. Dice que solo ordena la cocina, y que la cocina es todo.",
            "Deja una vela prendida en la ventana todas las noches. Dice que es para los que todavia vienen caminando.",
        },
    },
    bell_hijo = {
        presentacion = "Wade Bell, el hijo de la familia que llego a tu refugio",
        rol = "wade_bell", nombre = "Wade", apellido = "Bell", perfil = "k93_bell_family_04",
        oficio = "el menor de los Bell",
        frases = {
            "Ya se que soy joven. Pero el que estaba antes tambien fue joven alguna vez.",
            "Tengo trabajo. Del que se hace corriendo, que es lo que mejor me sale.",
            "Mi papa dice que aprenda de ti. Yo le digo que ya aprendi: hay que volver siempre.",
            "Mate a dos con la pala esta manana. Bueno, a uno y medio.",
            "La gente me hace caso. No se por que. Yo tampoco me haria caso.",
            "Si viene una horda, escapamos. Despues volvemos con algo. Asi se hace.",
        },
        rangos = RANGOS_BELL,
        perfil_lore = {
            "Wade Bell, el menor de los Bell, quedo a cargo. Llego a mi refugio con fiebre; ahora es el que sale primero a limpiar la cuadra.",
            "Anota todo en un cuaderno con dibujos. Dice que es para que el que venga despues sepa como se hace.",
            "Cuando nadie lo ve, practica la voz de mando frente a un vidrio. Le sale mejor de lo que cree.",
        },
    },
    -- Nombre y perfil salen de K.MERCADERES (el servidor los pone).
    forastero = {
        rol = "forastero", oficio = "mercader de paso",
        frases = {
            "Venia de paso. Me quede porque nadie mas se quedo.",
            "Se vender. Mandar, estoy aprendiendo.",
            "Tengo encargos. Pagan poco pero pagan.",
            "El que estaba antes era mejor. Eso lo sabe todo el pueblo, y yo tambien.",
            "Aca no hay leyendas. Hay trabajo.",
            "Si me traes algo bueno, te lo pago bien. Es lo unico que se hacer bien.",
        },
        rangos = { "Cliente", "Conocido", "Socio", "Socio de confianza", "Familia" },
        perfil_lore = {
            "Quien manda ahora es un mercader que andaba de paso. Se quedo porque nadie mas quiso quedarse.",
            "Lleva las cuentas del lugar como llevaba las de su carreta: todo anotado, nada regalado.",
            "No habla de los que estuvieron antes. Una vez lo vi limpiar la placa de la puerta sin que nadie se lo pidiera.",
        },
    },
}

-- reemplazo: el de la memoria "nuevo_<id>" (lo manda el servidor en la vista de contactos).
function DD.perfilLore(dominio, id, reemplazo)
    if dominio == "nuevo" and reemplazo ~= nil and DD.REEMPLAZOS[reemplazo] ~= nil then
        return DD.REEMPLAZOS[reemplazo].perfil_lore
    end
    local t = dominio == "bandido" and DD.CAPITANES or (dominio == "nuevo" and DD.NUEVOS or nil)
    local d = t ~= nil and t[id] or nil
    return d ~= nil and d.perfil_lore or nil
end

return DD
