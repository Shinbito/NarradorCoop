-- Encargo especial de la Tia Chela: "Un cientifico que dice tener la cura".
-- Aparece a veces entre sus ofertas dificiles cuando ya te tiene confianza (nivel 3+), ver
-- G.ESPECIALES en server/Narrador/NarradorGenerador.lua. Al llegar, alguien ya esta
-- peleando por el cientifico: es Tomas, el hijo de la Chela, la leyenda que anda ayudando
-- gente por todo Knox. Pelean juntos, se presenta, te deja una de sus armas legendarias
-- ("vas por el mismo camino que yo") y sigue su camino. El cientifico hay que llevarlo vivo
-- donde la Chela.
-- Tomas es inmune a la zombificacion (Motor.inmediatas.inmune) y pega fuerte, pero puede morir.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local TOMAS = "tomas"
local DOC = "cientifico"

Narrador.Defs.registrar({
    id = "leyenda_tomas",
    titulo = "Un cientifico que dice tener la cura",
    titulo_menu = "Encargo especial (Tia Chela): la leyenda de Tomas",
    requiere_alife = true,
    automatico = false,
    inicio = "encargo",

    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "objetivo", desde = "contacto", salas = { "laboratory", "medical", "hospital*" },
                  respaldo = { "pharmacy", "pharmacystorage", "medicaloffice", "office" }, min = 300, max = 1300 },
                { "decir_contacto", texto = "Mijo, por la radio pide ayuda un cientifico. Dice que tiene la cura. Yo no le creo nada, pero si es verdad... Anda a buscarlo a {lugar:objetivo}. Y me lo traes vivo, ah?" },
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
                  inmortales = true, postura = "friendly", perfiles = { { "cientifico", "k93_red_cross_02" } },
                  nombres = { cientifico = { "Elias", "Hartmann" } } },
                { "npcs", id = TOMAS, lugar = "objetivo", radio = 45, no_mas_cerca = 10, modo = "guard", correa = 12,
                  inmortales = true, postura = "friendly", salud = 400,
                  banderas = { health = 400, damageOutput = 300 },
                  perfiles = { { "tomas", "k93_stockyard_05" } }, nombres = { tomas = { "Tomas", "Recados" } } },
                { "variable", nombre = "horda_meta", valor = 9999 },
                { "oleada", lugar = "objetivo", radio = 60, cantidad = 30, por_jugador = 15, fija = true, caminantes = true,
                  planta_baja = true, min = 14, max = 40, meta = "horda_meta", meta_frac = 0.8 },
                { "aviso", texto = "En {lugar:objetivo} alguien ya esta peleando. Un tipo alto, solo contra la horda, con un arma que no parece de este mundo." },
            },
            salidas = {
                { cuando = { "grupo_listo", TOMAS }, ir = "combate" },
                { cuando = { "horas", 6 }, ir = "combate" },
            },
        },

        combate = {
            pista = "Defender al cientifico junto al desconocido: van {bajas:objetivo} de {horda_meta}.",
            objetivo = "objetivo",
            al_entrar = {
                { "inmune", grupo = TOMAS, rol = "tomas" },
                { "armar_legendario", grupo = TOMAS, rol = "tomas" },
                { "decir", grupo = TOMAS, rol = "tomas", texto = "Llegaste justo. Tu por la izquierda, yo por la derecha. Que no toquen al doctor." },
                -- Unos segundos de gracia y ya nadie es inmortal (Tomas aguanta mucho, pero puede caer).
                { "banderas", grupo = DOC, inmortales = false, retraso = 0.15 },
                { "banderas", grupo = TOMAS, inmortales = false, retraso = 0.15 },
            },
            salidas = {
                { cuando = { "todos_muertos", DOC }, ir = "final_muerto" },
                { cuando = { "o", { "bajas_en", "objetivo", "var:horda_meta", 70 },
                                  { { "horas", 0.5 }, { "sin_zombis", "objetivo", 15 } } }, ir = "conocerlo" },
            },
        },

        -- Se presenta.
        conocerlo = {
            pista = "Hablar con el desconocido en {lugar:objetivo} (clic derecho cerca).",
            objetivo = "objetivo",
            ancla = "objetivo", ancla_grupo = TOMAS, radio = 25,
            al_entrar = {
                { "banderas", grupo = DOC, inmortales = true },
                { "banderas", grupo = TOMAS, inmortales = true },
                { "decir", grupo = TOMAS, rol = "tomas", texto = "Buena pelea. Me dicen de muchas formas por ahi. Tomas, nomas. Tomas Recados." },
            },
            opciones = {
                { id = "decirle", texto = "Recados? Tu mama te espera en el cuartel de West Point.",
                  dice = { rol = "tomas", texto = "La Chela. Viva. Claro que esta viva, si es mas porfiada que yo. Dile que guarde la frazada un poco mas. Todavia no puedo volver." },
                  acciones = { { "variable", nombre = "dijo_tomas", valor = true } } },
                { id = "callar", texto = "No decirle nada",
                  dice = { rol = "tomas", texto = "Bueno. Cuida al doctor. Yo sigo, que hay gente esperando." } },
            },
            salidas = {
                { cuando = { "o", { "eleccion", "decirle" }, { "eleccion", "callar" } }, ir = "despedida" },
                { cuando = { "horas", 2 }, ir = "despedida" },
            },
        },

        -- Te deja un arma legendaria y se va. El cientifico te sigue.
        despedida = {
            al_entrar = {
                { "decir", grupo = TOMAS, rol = "tomas", texto = "Toma. A mi me sobra. Tu la vas a necesitar: vas por el mismo camino que yo." },
                { "legendario", lugar = "objetivo", radio = 30, clase = "arma" },
                { "aviso", texto = "Tomas deja un arma a tus pies y se va sin mirar atras." },
                { "retirar_lejos", grupo = TOMAS, lugar = "objetivo", radio = 70, retraso = 0.3 },
                { "diario", texto = "Conoci a Tomas Recados, el que la gente nombra cuando cuenta como se salvo. Me dejo una de sus armas. Dice que voy por el mismo camino que el." },
                { "huella", acto = "salvaste", texto = "Pelee junto a Tomas Recados, la leyenda de Knox." },
                { "memoria", clave = "tomas_conocido", valor = true },
            },
            salidas = { { ir = "escolta" } },
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
                { "decir_contacto", texto = "Lo viste? A mi Tomas? Y esta bien? ... Ese cabro porfiado. Ya. Ya. No me mires, que se me metio algo en el ojo.",
                  si = { "var", "dijo_tomas", true } },
                { "decir_contacto", texto = "Lo trajiste vivo, mijo. Ya veremos si lo de la cura es verdad. Por mientras, que coma algo.",
                  si = { "no", { "var", "dijo_tomas", true } } },
                { "pago_encargo", lugar = "contacto", radio = 35 },
                { "residentes", id = "hartmann", grupos = { DOC }, lugar = "contacto", radio = 20, max_zombis = 2 },
                { "memoria", clave = "cientifico_hartmann", valor = "en_west_point" },
                { "diario", texto = "Deje al doctor Hartmann con la Tia Chela. Dice que tiene la cura. La Chela dice que primero tiene que comer." },
            },
        },

        final_muerto = {
            final = true,
            al_entrar = {
                { "soltar_acompanante", grupo = DOC, rol = "cientifico" },
                { "decir_contacto", texto = "No llego, cierto? Ya, mijo. Hiciste lo que pudiste." },
                { "memoria", clave = "cientifico_hartmann", valor = "muerto" },
                { "diario", texto = "El doctor Hartmann murio antes de llegar donde la Chela. Si tenia la cura, se fue con el." },
            },
        },
    },
})
