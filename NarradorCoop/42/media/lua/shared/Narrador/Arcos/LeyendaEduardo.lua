-- Historia de la Tia Chela, capitulo 3: "Un cientifico que dice tener la cura".
-- No tiene nada que ver con la mision de la cura (las pastillas K-93): el doctor Hartmann es
-- un charlatan. Pero sabe hacer remedios: cuando el campamento de la Chela llega a nivel 4
-- es su curandero y vende medicina (ver shared/Narrador/NarradorCampamentosDefs.lua).
-- Sale entre las ofertas de la Chela cuando su capitulo 2 ya se hizo y te tiene confianza 3+
-- (G.ESPECIALES en server/Narrador/NarradorGenerador.lua). Al llegar, alguien ya esta
-- peleando por el cientifico: es Eduardo, el hijo de la Chela, la leyenda que anda ayudando
-- gente por todo Knox. Pelean juntos, se presenta, te deja una de sus armas legendarias
-- ("vas por el mismo camino que yo") y sigue su camino. El cientifico hay que llevarlo vivo
-- donde la Chela.
-- Eduardo: heroe de pelicula, honorable y humilde, siempre ayudando a los demas. Es inmune a la
-- zombificacion (Motor.inmediatas.inmune) y pega fuerte. Si cae, nunca se levanta como zombi:
-- al volver al campamento de la Chela aparece vivo ("uff, pense que la palmaba"), ver
-- eduardo_vuelve abajo y C.REGRESOS en server/Narrador/NarradorContactos.lua.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local EDUARDO = "eduardo"
local DOC = "cientifico"

Narrador.Defs.registrar({
    id = "leyenda_eduardo",
    titulo = "Un cientifico que dice tener la cura",
    titulo_menu = "Historia de la Tia Chela, cap. 3: un cientifico que dice tener la cura",
    requiere_alife = true,
    automatico = false,
    inicio = "encargo",

    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "objetivo", desde = "contacto", salas = { "laboratory", "medical", "hospital*" },
                  respaldo = { "pharmacy", "pharmacystorage", "medicaloffice", "office" }, min = 300, max = 1300 },
                { "decir_contacto", texto = "Mijo, por la radio pide ayuda un cientifico. Dice que tiene la cura. Yo no le creo ni el saludo, pero un doctor nos vendria bien igual. Anda a buscarlo a {lugar:objetivo}. Y me lo traes vivo, ah?" },
                { "mapa", lugar = "objetivo", titulo = "Mapa de la Tia Chela: el cientifico" },
                { "diario", texto = "La Tia Chela me mando a buscar a un cientifico que dice tener la cura. Esta en {lugar:objetivo}." },
            },
            salidas = { { ir = "viaje" } },
        },

        viaje = {
            pista = "Ir a {lugar:objetivo} a buscar al cientifico.",
            objetivo = "objetivo",
            salidas = { { cuando = { "cerca", "objetivo", 80 }, ir = "sitio" } },
        },

        -- Alguien llego antes.
        sitio = {
            pista = "Ayudar en {lugar:objetivo}.",
            objetivo = "objetivo",
            al_entrar = {
                { "npcs", id = DOC, lugar = "objetivo", radio = 45, no_mas_cerca = 14, modo = "guard", quietos = true, correa = 5,
                  inmortales = true, postura = "friendly", perfiles = { { "cientifico", "k93_county_ems_06" } },
                  nombres = { cientifico = { "Elias", "Hartmann" } } },
                { "npcs", id = EDUARDO, lugar = "objetivo", radio = 45, no_mas_cerca = 10, modo = "guard", correa = 12,
                  inmortales = true, postura = "friendly", salud = 400,
                  banderas = { health = 400, damageOutput = 300 },
                  perfiles = { { "eduardo", "k93_stockyard_05" } }, nombres = { eduardo = { "Eduardo", "Giovanns" } } },
                { "variable", nombre = "horda_meta", valor = 9999 },
                { "oleada", lugar = "objetivo", radio = 60, cantidad = 30, por_jugador = 15, fija = true, caminantes = true,
                  planta_baja = true, min = 14, max = 40, meta = "horda_meta", meta_frac = 0.8 },
                { "aviso", texto = "En {lugar:objetivo} alguien ya esta peleando. Un tipo alto, solo contra la horda, con un arma que no parece de este mundo." },
            },
            salidas = {
                { cuando = { "grupo_listo", EDUARDO }, ir = "combate" },
                { cuando = { "horas", 6 }, ir = "combate" },
            },
        },

        combate = {
            pista = "Defender al cientifico junto al desconocido: van {bajas:objetivo} de {horda_meta}.",
            objetivo = "objetivo",
            al_entrar = {
                { "inmune", grupo = EDUARDO, rol = "eduardo", quien = "eduardo" },
                { "armar_legendario", grupo = EDUARDO, rol = "eduardo" },
                { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Llegaste justo, amigo. Tu por la izquierda, yo por la derecha. Primero el doctor, despues nosotros." },
                -- Unos segundos de gracia y ya nadie es inmortal (Eduardo aguanta mucho, pero puede caer).
                { "banderas", grupo = DOC, inmortales = false, retraso = 0.15 },
                { "banderas", grupo = EDUARDO, inmortales = false, retraso = 0.15 },
            },
            salidas = {
                { cuando = { "todos_muertos", DOC }, ir = "final_muerto" },
                { cuando = { "todos_muertos", EDUARDO }, ir = "caido" },
                { cuando = { "o", { "bajas_en", "objetivo", "var:horda_meta", 70 },
                                  { { "horas", 0.5 }, { "sin_zombis", "objetivo", 15 } } }, ir = "conocerlo" },
            },
        },

        -- Se presenta.
        conocerlo = {
            pista = "Hablar con el desconocido en {lugar:objetivo} (clic derecho cerca).",
            objetivo = "objetivo",
            ancla = "objetivo", ancla_grupo = EDUARDO, radio = 25,
            al_entrar = {
                { "banderas", grupo = DOC, inmortales = true },
                { "banderas", grupo = EDUARDO, inmortales = true },
                { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Buena pelea. No, no soy ninguna leyenda: llegue antes, nada mas. Eduardo. Eduardo Giovanns. Gracias por venir." },
            },
            opciones = {
                { id = "decirle", texto = "Giovanns... Eduardo? Tu mama, la Tia Chela, te espera en el cuartel de West Point.",
                  dice = { rol = "eduardo", texto = "La Chela. Viva. Claro que esta viva, si es mas porfiada que yo. Dile que guarde la frazada un poco mas. Todavia no puedo volver." },
                  acciones = { { "variable", nombre = "dijo_eduardo", valor = true } } },
                { id = "callar", texto = "No decirle nada",
                  dice = { rol = "eduardo", texto = "Cuida al doctor, por favor. Yo sigo: siempre hay alguien esperando que llegue alguien." } },
            },
            salidas = {
                { cuando = { "todos_muertos", EDUARDO }, ir = "caido" },
                { cuando = { "o", { "eleccion", "decirle" }, { "eleccion", "callar" } }, ir = "despedida" },
                { cuando = { "horas", 2 }, ir = "despedida" },
            },
        },

        -- Te deja un arma legendaria y se va. El cientifico te sigue.
        despedida = {
            al_entrar = {
                { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Toma. Yo me arreglo con menos. Tu la vas a necesitar: vas por el mismo camino que yo. Cuida a la gente." },
                { "legendario", lugar = "objetivo", radio = 30, clase = "arma" },
                { "aviso", texto = "Eduardo deja un arma a tus pies y se va sin mirar atras." },
                { "retirar_lejos", grupo = EDUARDO, lugar = "objetivo", radio = 70, retraso = 0.3 },
                { "diario", texto = "Conoci a Eduardo Giovanns, el que la gente nombra cuando cuenta como se salvo. Me dejo una de sus armas. Dice que voy por el mismo camino que el." },
                { "huella", acto = "salvaste", texto = "Pelee junto a Eduardo Giovanns, la leyenda de Knox." },
                { "memoria", clave = "eduardo_conocido", valor = true },
            },
            salidas = { { ir = "escolta" } },
        },

        -- Eduardo cayo peleando por el doctor. Su arma queda en el suelo. (No se levanta como
        -- zombi y, al volver al campamento de la Chela, aparece vivo.)
        caido = {
            al_entrar = {
                { "aviso", texto = "Eduardo cae entre los muertos, cubriendo al doctor hasta el final. Su arma queda en el suelo." },
                { "legendario", lugar = "objetivo", radio = 30, clase = "arma" },
                { "diario", texto = "Vi caer a Eduardo Giovanns, el que la gente nombra cuando cuenta como se salvo. Cayo cubriendo al doctor. Me quede con su arma." },
                { "huella", acto = "salvaste", texto = "Pelee junto a Eduardo Giovanns, la leyenda de Knox. Lo vi caer." },
                { "memoria", clave = "eduardo_conocido", valor = true },
            },
            salidas = {
                { cuando = { "todos_muertos", DOC }, ir = "final_muerto" },
                { cuando = { "o", { "bajas_en", "objetivo", "var:horda_meta", 70 },
                                  { { "horas", 0.3 }, { "sin_zombis", "objetivo", 15 } } }, ir = "escolta" },
            },
        },

        -- Llevar al cientifico vivo donde la Chela (te sigue y se sube al auto contigo).
        escolta = {
            pista = "Llevar al cientifico sano y salvo donde {contacto_nombre}.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = DOC, rol = "cientifico", nombre = "El doctor Hartmann", inmortal = false },
                { "banderas", grupo = DOC, inmortales = false, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", DOC }, ir = "final_muerto" },
                { cuando = { "npc_cerca", DOC, "contacto", 15 }, ir = "final_cumplido" },
            },
        },

        final_cumplido = {
            final = true,
            al_entrar = {
                { "soltar_acompanante", grupo = DOC, rol = "cientifico" },
                { "banderas", grupo = DOC, inmortales = true },
                { "variable", nombre = "rep_extra", valor = 10 },
                -- Era un charlatan... pero sabe hacer remedios.
                { "decir", grupo = DOC, rol = "cientifico", texto = "Bueno... la cura, la cura, exactamente no. Lo dije para que alguien viniera. Pero se hacer antibioticos con moho y paciencia. Denme una mesa y les hago medicina." },
                -- Consecuencia de los Bell (curandero_falso): Hartmann es el que les vendio las pastillas de azucar.
                { "decir", grupo = DOC, rol = "cientifico", retraso = 0.08, si = { "memoria", "curandero_falso", true },
                  texto = "...Yo te conozco. Fuiste a buscar el suero para la familia del refugio, los Bell. Si. Las pastillas las vendi yo. Agua, azucar y colorante. Pense que nadie iba a llegar tan lejos por una caja de pastillas." },
                { "diario", si = { "memoria", "curandero_falso", true },
                  texto = "El doctor Hartmann es el que vendio las pastillas falsas de los Bell. Lo traje vivo igual. Todavia no se si hice bien." },
                { "decir_contacto", retraso = 0.05, texto = "Charlatan. Pero un charlatan que hace remedios sirve. Cuando el campamento crezca, te pongo una consulta. Por mientras, te lavas las manos." },
                { "decir_contacto", texto = "Lo viste? A mi Eduardo? Y esta bien? ... Ese cabro porfiado. Ya. Ya. No me mires, que se me metio algo en el ojo.",
                  si = { "var", "dijo_eduardo", true } },
                { "decir_contacto", texto = "Lo trajiste vivo, mijo. Ya veremos si lo de la cura es verdad. Por mientras, que coma algo.",
                  si = { "no", { "var", "dijo_eduardo", true } } },
                { "pago_encargo", lugar = "contacto", radio = 35 },
                { "retirar_lejos", grupo = DOC, lugar = "contacto", radio = 40, retraso = 1 },
                { "memoria", clave = "cientifico_hartmann", valor = "en_west_point" },
                { "memoria", clave = "historia_westpoint_3", valor = true },
                { "diario", texto = "El doctor Hartmann no tenia ninguna cura: era un charlatan. Pero sabe hacer remedios: cuando el campamento de la Tia Chela crezca, va a abrir su consulta ahi." },
            },
        },

        final_muerto = {
            final = true,
            al_entrar = {
                { "soltar_acompanante", grupo = DOC, rol = "cientifico" },
                { "decir_contacto", texto = "No llego, cierto? Ya, mijo. Hiciste lo que pudiste." },
                { "memoria", clave = "cientifico_hartmann", valor = "muerto" },
                { "memoria", clave = "historia_westpoint_3", valor = true },
                { "diario", texto = "El doctor Hartmann murio antes de llegar donde la Chela. Si tenia la cura, se fue con el." },
            },
        },
    },
})

-- Eduardo vuelve: si cayo en alguna parte, la proxima vez que pasas por el campamento de la
-- Chela esta ahi, vivo, como si nada. Lo lanza C.REGRESOS (server/Narrador/NarradorContactos.lua).
Narrador.Defs.registrar({
    id = "eduardo_vuelve",
    titulo = "Eduardo, otra vez",
    titulo_menu = "Eduardo vuelve (lo lanza el campamento de la Chela)",
    requiere_alife = true,
    automatico = false,
    inicio = "llega",

    etapas = {
        llega = {
            al_entrar = {
                { "lugar_contacto", id = "contacto", contacto = "westpoint" },
                { "npcs", id = EDUARDO, lugar = "contacto", radio = 25, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 6,
                  inmortales = true, postura = "friendly", salud = 400, banderas = { health = 400, damageOutput = 300 },
                  perfiles = { { "eduardo", "k93_stockyard_05" } }, nombres = { eduardo = { "Eduardo", "Giovanns" } } },
            },
            salidas = {
                { cuando = { "grupo_listo", EDUARDO }, ir = "charla" },
                { cuando = { "horas", 6 }, ir = "final" },
            },
        },

        charla = {
            pista = "Eduardo esta en {lugar:contacto}. Vivo.",
            ancla = "contacto", ancla_grupo = EDUARDO, radio = 20,
            al_entrar = {
                { "inmune", grupo = EDUARDO, rol = "eduardo", quien = "eduardo" },
                { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Uff... pense que la palmaba. Esta vez si, de verdad." },
                { "decir", grupo = EDUARDO, rol = "eduardo", retraso = 0.05, texto = "Me arrastre hasta un sotano y dormi dos dias. Siempre hay un sotano. Gracias por terminar lo que yo no pude." },
                { "decir_contacto", retraso = 0.1, texto = "Otra vez casi te matai, cabro porfiado. Sientate, que hay sopa. Y no me discutas." },
                { "aviso", texto = "Eduardo Giovanns esta en {lugar:contacto}, con la ropa rota y una sonrisa cansada." },
                { "diario", texto = "Eduardo esta vivo. Aparecio en {lugar:contacto} como si nada: 'pense que la palmaba'. Siempre se salva por las minimas." },
            },
            opciones = {
                { id = "muerto", texto = "Te vi caer. Pense que estabas muerto.",
                  dice = { rol = "eduardo", texto = "Yo tambien. Pero mientras quede alguien a quien ayudar, parece que no me toca. Cuidate tu tambien, ah?" } },
            },
            salidas = {
                { cuando = { "eleccion", "muerto" }, ir = "final" },
                { cuando = { "horas", 2 }, ir = "final" },
            },
        },

        final = {
            final = true,
            al_entrar = {
                { "retirar_lejos", grupo = EDUARDO, lugar = "contacto", radio = 70, retraso = 1 },
                { "memoria", clave = "eduardo_vivo", valor = true },
            },
        },
    },
})
