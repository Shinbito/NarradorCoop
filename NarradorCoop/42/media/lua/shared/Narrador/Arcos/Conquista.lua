-- El camino del bandido, fase 2: la conquista de Knox (ver ROADMAP). Solo si en el capitulo 5
-- elegiste quedarte con el jefe del patio (memoria "bandido" = "pereira"). Los lanza
-- server/Narrador/NarradorBandido.lua, uno a la vez:
--   * Con Meulen de jefe, primero la base de Sous (si Sous sigue en pie y aliado).
--   * Despues la comisaria del Cabo Ramiro (Muldraugh).
--   * Despues West Point, Riverside y Rosewood, en el orden que quieras: se lanza al entrar al
--     pueblo de cada uno.
-- En cada ciudad el misionero pierde la inmortalidad (condenar_misionero); al morir, la ciudad
-- pasa a un capitan de los bandidos (server/Narrador/NarradorDominios.lua). -15 de Knox cada una.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"
require "Narrador/NarradorKnoxDefs"
require "Narrador/Arcos/Bandido"

local KNOX = Narrador.KnoxDefs.BANDIDOS_MISION

-- La banda del patio pelea contra Sous (antes no se cruzaban).
Narrador.Facciones.narrador_pereira.relaciones = { narrador_sous = "hostile", narrador_banda_maulen = "friendly" }

local function J(pereira, maulen) return { por_var = "bandido_jefe", textos = { maulen = maulen, otro = pereira } } end

local function registrar(def)
    def.sorteo = def.sorteo or {}
    def.sorteo.bandido_jefe = { valores = { "pereira" } }
    def.sorteo.jefe_perfil = { valores = { "narrador_pereira_01" } }
    def.sorteo.jefe_nombre = { valores = { "la Sargento Pereira" } }
    def.sorteo.jefe_corto = { valores = { "Pereira" } }
    return Narrador.Defs.registrar(def)
end

-- La banda que va contigo: el jefe y cuatro mas, amistosos contigo.
local function banda(lugar)
    return { "npcs", id = "banda", lugar = lugar, radio = 40, no_mas_cerca = 10, modo = "guard", correa = 45,
        inmortales = true, postura = "friendly",
        perfiles = { { "pereira", "var:jefe_perfil" }, { "desertor1", "narrador_pereira_02" }, { "desertor2", "narrador_pereira_03" },
                     { "bandido1", "narrador_pereira_04" }, { "bandido2", "narrador_pereira_05" } } }
end

-- ===========================================================================
-- La base de Sous (solo con Meulen de jefe)
-- ===========================================================================
local SOUS_DEFENSORES = {
    { "martin_a", "narrador_sous_01" }, { "martin_z", "narrador_sous_02" }, { "benjamin", "narrador_sous_03" },
    { "david", "narrador_sous_04" }, { "bastian", "narrador_sous_05" }, { "hanz", "narrador_sous_06" },
    { "cristian", "narrador_sous_07" }, { "jorge", "narrador_sous_08" }, { "cristobal", "narrador_sous_09" },
}

registrar({
    id = "conquista_sous",
    titulo = "La conquista: la base de Sous",
    titulo_menu = "Conquista: la base de Sous (Meulen)",
    requiere_alife = true, automatico = false,
    inicio = "orden",
    etapas = {
        orden = {
            al_entrar = {
                { "lugar_memoria", id = "base", clave = "base_sous", salas = { "farmstorage", "barn", "warehouse" },
                  respaldo = { "livingroom", "kitchen" }, min = 300, max = 1200 },
                { "lugar_cerca", id = "reunion", de = "base", distancia = 45 },
                { "mapa", lugar = "base", titulo = "Mapa de Meulen: la base de Sous" },
                { "aviso", texto = "Meulen te manda decir: 'Hoy, peni. La base de Sous. Te espero a la vuelta de la esquina.'" },
                { "diario", texto = "Meulen va por Sous. Me espera cerca de {lugar:base}. Conozco a cada uno de los que estan adentro." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Juntarte con Meulen cerca de {lugar:base}.",
            objetivo = "reunion",
            salidas = {
                { cuando = { "cerca", "reunion", 60 }, ir = "asalto" },
                { cuando = { "horas", 96 }, ir = "final_abandonado" },
            },
        },
        asalto = {
            pista = "Tomar la base de Sous en {lugar:base}.",
            objetivo = "base",
            al_entrar = {
                banda("reunion"),
                { "disolver_residentes", id = "sous" },
                { "faccion", id = "narrador_sous", postura = "hostile" },
                { "bandidos", id = "sous_base", lugar = "base", radio = 60, modo = "guard", perfiles = SOUS_DEFENSORES, sin_muertos_de = "sous" },
                { "aviso", texto = "Sous esta en la base. Ya los vieron llegar." },
            },
            salidas = {
                { cuando = { "grupo_listo", "banda" }, ir = "pelea" },
                { cuando = { "horas", 12 }, ir = "final_abandonado" },
            },
        },
        pelea = {
            pista = "Tomar la base de Sous en {lugar:base}.",
            objetivo = "base",
            al_entrar = {
                { "banderas", grupo = "banda", inmortales = false },
                { "decir", grupo = "banda", rol = "pereira", texto = "Akagami! Mi chuchu decia que uno es de la tierra. Esta tierra es mia ahora. Todos somos amigos, cierto? Todos!" },
                { "decir", grupo = "sous_base", rol = "martin_a", retraso = 0.05, texto = "Meulen?! Y tu... tu? Mi bro, no. No me hagas esto." },
                { "decir", grupo = "sous_base", rol = "martin_z", retraso = 0.1, texto = "Sabia que algo no cuadraba. Lo dije. Nadie me escucha." },
            },
            salidas = {
                { cuando = { "todos_muertos", "sous_base" }, ir = "final_conquistado" },
                { cuando = { "horas", 12 }, ir = "final_abandonado" },
            },
        },
        final_conquistado = { final = true, al_entrar = {
            { "knox", cantidad = KNOX, motivo = "conquista: Sous" },
            { "memoria", clave = "sous", valor = "conquistada" },
            { "memoria", clave = "conquista_sous", valor = true },
            { "decir", grupo = "banda", rol = "pereira", texto = "Ya esta, peni. Atun para todos. Ahora el cabo." },
            { "huella", acto = "mataste", texto = "Ayude a Meulen a tomar la base de Sous. Los conocia a todos." },
            { "diario", texto = "La base de Sous es de Meulen. No queda nadie que se ria en la barra oxidada. Yo estuve ahi." },
        } },
        final_abandonado = { final = true, al_entrar = {
            { "retirar", grupo = "banda" },
            { "diario", texto = "No llegue a lo de Sous. Meulen va a volver a pedirlo." },
        } },
    },
})

-- ===========================================================================
-- Las ciudades de los misioneros
-- ===========================================================================
local CIUDADES = {
    muldraugh = {
        titulo = "la comisaria del Cabo Ramiro",
        defensores = { { "guardia1", "k93_muldraugh_pd_02" }, { "guardia2", "k93_muldraugh_pd_03" }, { "civil", "k93_truckstop_08" } },
        llegada = J("Pereira entra primero a la comisaria, como si volviera a su casa. 'Te acuerdas de mi, cabo?'",
                    "Meulen sube la escalera de la comisaria fumando. 'Buenas, cabo. Vengo por lo que queda en la libreta.'"),
        ultimas = J("Pereira. La anote en la libreta hace mucho, sargento. Negativo a rendirme. Abri esa puerta y la volveria a abrir.",
                    "Canupan. El de los chilenos. Usted esta en mi libreta, civil. Y usted tambien, el de al lado. Negativo a rendirme."),
        diario = "La comisaria de Muldraugh es de la banda. El Cabo Ramiro murio en la oficina del segundo piso, con la libreta abierta. No quise leer la ultima pagina.",
    },
    westpoint = {
        titulo = "el cuartel de la Tia Chela",
        defensores = { { "bombero1", "k93_vfd_01" }, { "bombero2", "k93_vfd_02" }, { "vecino", "k93_hensley_family_05" } },
        llegada = J("Pereira se para frente al cuartel de bomberos. 'Una bombera vieja y un carro sin frenos. Esto es rapido.'",
                    "Meulen mira el cuartel. 'Aca cocinan rico, me dijeron. Ojala quede algo.'"),
        ultimas = "Mijo... tu? ... Ya. Ya entendi. Dile a Eduardo que la frazada esta en la silla. Y que comi. Dile que comi.",
        diario = "El cuartel de West Point es de la banda. La Tia Chela murio diciendome mijo. La frazada de Eduardo sigue doblada en la silla.",
    },
    riverside = {
        titulo = "la iglesia del Padre Nacho",
        defensores = { { "fiel1", "k93_prather_02" }, { "fiel2", "k93_prather_03" }, { "fiel3", "k93_red_cross_05" } },
        llegada = J("Pereira patea la puerta de la iglesia. Estaba abierta. Siempre estaba abierta.",
                    "Meulen se persigna en la puerta de la iglesia, por si acaso. 'Mi chuchu era catolica, peni.'"),
        ultimas = "Hijo. Te estaba esperando. Ya me fui una vez y alguien se quedo esperando. Esta vez no me voy. Ven.",
        diario = "La iglesia de Riverside es de la banda. El Padre Nacho no se fue. Se quedo en la puerta, como dijo. La puerta ahora esta cerrada.",
    },
    rosewood = {
        titulo = "la bencinera de la Misia Rosa",
        defensores = { { "camionero1", "k93_truckstop_01" }, { "camionero2", "k93_truckstop_03" }, { "camionero3", "k93_truckstop_09" } },
        llegada = J("Pereira mira la bencinera. 'La vieja tiene bencina escondida. Todos lo saben menos ella.'",
                    "Meulen mira la bencinera. 'Bencina escondida y cigarros, peni. El paraiso.'"),
        ultimas = "Mijito... se apago la luz. Ya no tengo miedo. Que raro, no? Ya no tengo miedo.",
        diario = "La bencinera de Rosewood es de la banda. La Misia Rosa murio con la luz apagada. Dijo que ya no tenia miedo. Yo si.",
    },
}

for id, cd in pairs(CIUDADES) do
    registrar({
        id = "conquista_" .. id,
        titulo = "La conquista: " .. cd.titulo,
        titulo_menu = "Conquista: " .. cd.titulo,
        requiere_alife = true, automatico = false,
        inicio = "orden",
        etapas = {
            orden = {
                al_entrar = {
                    { "lugar_contacto", id = "objetivo", contacto = id },
                    { "lugar_cerca", id = "reunion", de = "objetivo", distancia = 40 },
                    { "mapa", lugar = "objetivo", titulo = "Mapa de {jefe_corto}: " .. cd.titulo },
                    { "aviso", texto = "{jefe_corto} te manda decir: hoy es " .. cd.titulo .. ". La banda espera cerca." },
                    { "diario", texto = "Hoy la banda va por " .. cd.titulo .. ". Me esperan cerca de {lugar:objetivo}." },
                },
                salidas = { { ir = "viaje" } },
            },
            viaje = {
                pista = "Juntarte con la banda cerca de {lugar:objetivo}.",
                objetivo = "reunion",
                salidas = {
                    { cuando = { "cerca", "reunion", 60 }, ir = "asalto" },
                    { cuando = { "horas", 96 }, ir = "final_abandonado" },
                },
            },
            asalto = {
                pista = "Tomar " .. cd.titulo .. ".",
                objetivo = "objetivo",
                al_entrar = {
                    banda("reunion"),
                    { "condenar_misionero", contacto = id },
                    { "bandidos", id = "defensores", lugar = "objetivo", radio = 40, modo = "guard", perfiles = cd.defensores },
                    { "aviso", texto = cd.llegada },
                },
                salidas = {
                    { cuando = { "grupo_listo", "banda" }, ir = "pelea" },
                    { cuando = { "misionero_muerto", id }, ir = "final_conquistado" },
                    { cuando = { "horas", 12 }, ir = "final_abandonado" },
                },
            },
            pelea = {
                pista = "Tomar " .. cd.titulo .. ". {contacto_nombre} no se va a rendir.",
                objetivo = "objetivo",
                al_entrar = {
                    { "banderas", grupo = "banda", inmortales = false },
                    { "decir_contacto", texto = cd.ultimas },
                },
                salidas = {
                    { cuando = { "misionero_muerto", id }, ir = "final_conquistado" },
                    { cuando = { "horas", 12 }, ir = "final_abandonado" },
                },
            },
            final_conquistado = { final = true, al_entrar = {
                { "knox", cantidad = KNOX, motivo = "conquista: " .. id },
                { "memoria", clave = "conquista_" .. id, valor = true },
                { "huella", acto = "mataste", texto = "Ayude a la banda a tomar " .. cd.titulo .. "." },
                { "diario", texto = cd.diario },
            } },
            final_abandonado = { final = true, al_entrar = {
                { "retirar", grupo = "banda" },
                { "indultar_misionero", contacto = id },
                { "diario", texto = "No termine lo de " .. cd.titulo .. ". La banda va a volver a pedirlo." },
            } },
        },
    })
end
