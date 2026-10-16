-- El camino del bandido, fase 3: Eduardo Giovanns (ver ROADMAP). Con Knox conquistado
-- (memoria "knox_conquistado"), Eduardo, el hijo de la Tia Chela, viene por ti tres veces. Lo
-- lanza server/Narrador/NarradorBandido.lua.
--   eduardo_atentado (x3): aparece donde estes y pelea. Es inmortal: se retira. En el tercero te
--     tiene en el suelo y no dispara: te deja una nota para ir a su base, las casas abandonadas
--     al lado del campo de Fallas Lake.
--   eduardo_fallas: si vas a terminar esto, es la ultima mision del juego (matar a Eduardo).
--     Si vas a hablar, empieza la reconquista.
--   reconquista_<ciudad> (x4, en el orden que quieras) y reconquista_patio (la ultima): con
--     Eduardo matas a los capitanes y al jefe del patio. En cada ciudad vuelve un misionero
--     nuevo (NarradorDominiosDefs.NUEVOS) y en West Point, Eduardo. Al final, Knox vuelve a ser
--     luz de esperanza.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local function registrar(def)
    def.sorteo = def.sorteo or {}
    def.sorteo.bandido_jefe = { valores = { "pereira" } }
    def.sorteo.jefe_perfil = { valores = { "narrador_pereira_01" } }
    def.sorteo.jefe_nombre = { valores = { "la Sargento Pereira" } }
    def.sorteo.jefe_corto = { valores = { "Pereira" } }
    return Narrador.Defs.registrar(def)
end

local TOMAS = "tomas"
local PERFIL_TOMAS = { { "tomas", "k93_stockyard_05" } }
local NOMBRE_TOMAS = { tomas = { "Eduardo", "Giovanns" } }
local FUERTE = { health = 400, damageOutput = 300 }

-- Donde esta la base de Eduardo: las casas abandonadas al lado del campo de Fallas Lake
-- (7440,7946). Se usa la casa mas cercana a ese punto.
Narrador.EduardoBase = {
    pueblo = "Fallas Lake", nombre = "las casas abandonadas al lado del campo de Fallas Lake",
    cerca_de = { 7440, 7946, 80 },
    salas = { "livingroom", "kitchen", "bedroom" }, respaldo = { "barn", "farmstorage", "garagestorage" },
    cerca_del_centro = true,
}

local function T(n1, n2, n3) return { por_var = "atentado", textos = { ["1"] = n1, ["2"] = n2, otro = n3 } } end

-- ===========================================================================
-- Los tres atentados
-- ===========================================================================
registrar({
    id = "eduardo_atentado",
    titulo = "Eduardo viene por ti",
    titulo_menu = "Eduardo: atentado",
    requiere_alife = true, automatico = false,
    inicio = "llega",
    etapas = {
        llega = {
            pista = "Sobrevivir a Eduardo Giovanns.",
            al_entrar = {
                { "lugar_jugador", id = "aqui" },
                { "aviso", texto = T("Alguien te sigue desde hace rato. Paso firme, sin apuro. Cuando te das vuelta, ya esta encima.",
                    "Un silbido que conoces. Es el. Otra vez.",
                    "Esta vez no lo escuchas llegar. Solo sientes el golpe.") },
                { "bandidos", id = TOMAS, lugar = "aqui", radio = 30, modo = "hunt", inmortales = true, salud = 400,
                  banderas = FUERTE, perfiles = PERFIL_TOMAS, nombres = NOMBRE_TOMAS },
            },
            salidas = {
                { cuando = { "grupo_listo", TOMAS }, ir = "pelea" },
                { cuando = { "horas", 3 }, ir = "final" },
            },
        },
        pelea = {
            pista = "Sobrevivir a Eduardo Giovanns.",
            al_entrar = {
                { "inmune", grupo = TOMAS, rol = "tomas", quien = "tomas_bandido" },
                { "armar_legendario", grupo = TOMAS, rol = "tomas" },
                { "decir", grupo = TOMAS, rol = "tomas", texto = T(
                    "Tu. Te vi en la comisaria. Te vi en el cuartel de mi mama. Llegue tarde a todo. A esto no.",
                    "Encontre la frazada. En la silla. Doblada. Ella la doblaba asi.",
                    "Ya esta. Se termina hoy.") },
            },
            salidas = { { cuando = { "horas", 0.3 }, ir = "retirada" } },
        },
        retirada = {
            al_entrar = {
                { "decir", grupo = TOMAS, rol = "tomas", texto = T(
                    "Esto no termina hoy. Pero termina.",
                    "La proxima vez no me voy.",
                    "...Mi mama decia que todos merecen una segunda oportunidad. No se si tu. Pero ella lo diria. Toma.") },
                { "retirar_lejos", grupo = TOMAS, lugar = "aqui", radio = 80, retraso = 0.1 },
                { "variable", nombre = "ultimo", valor = true, si = { "var", "atentado", 3 } },
            },
            salidas = {
                { cuando = { "var", "atentado", 3 }, ir = "nota" },
                { ir = "final" },
            },
        },
        nota = {
            al_entrar = {
                { "lugar", id = "base", pueblo = Narrador.EduardoBase.pueblo, nombre = Narrador.EduardoBase.nombre,
                  salas = Narrador.EduardoBase.salas, respaldo = Narrador.EduardoBase.respaldo, cerca_del_centro = true,
                  cerca_de = Narrador.EduardoBase.cerca_de },
                { "memoria_lugar", lugar = "base", clave = "eduardo_base" },
                { "nota", lugar = "aqui", radio = 3, titulo = "Nota de Eduardo",
                  texto = "Si quieres hablar, ven sin el arma en la mano. Si no, ven con ella. Ya sabes donde. Te espero. -E." },
                { "mapa", lugar = "base", titulo = "Mapa de Eduardo: Fallas Lake" },
                { "memoria", clave = "eduardo_nota", valor = true },
            },
            salidas = { { ir = "final" } },
        },
        final = { final = true, al_entrar = {
            { "diario", texto = T("Eduardo Giovanns, el hijo de la Tia Chela, intento matarme. Se fue. Dijo que esto termina.",
                "Eduardo volvio. Encontro la frazada de su mama. Dijo que la proxima vez no se va.",
                "Eduardo me tuvo en el suelo y no disparo. Me dejo una nota: me espera en Fallas Lake.") },
        } },
    },
})

-- ===========================================================================
-- Fallas Lake: hablar o terminar
-- ===========================================================================
registrar({
    id = "eduardo_fallas",
    titulo = "Fallas Lake",
    titulo_menu = "Eduardo: la base de Fallas Lake",
    requiere_alife = true, automatico = false,
    inicio = "viaje",
    etapas = {
        viaje = {
            pista = "Ir a {lugar:base}, donde espera Eduardo.",
            objetivo = "base",
            al_entrar = {
                { "lugar_memoria", id = "base", clave = "eduardo_base", pueblo = Narrador.EduardoBase.pueblo,
                  nombre = Narrador.EduardoBase.nombre, salas = Narrador.EduardoBase.salas,
                  respaldo = Narrador.EduardoBase.respaldo, cerca_del_centro = true, cerca_de = Narrador.EduardoBase.cerca_de },
            },
            salidas = { { cuando = { "cerca", "base", 40 }, ir = "base" } },
        },
        base = {
            pista = "Encontrar a Eduardo en {lugar:base}.",
            objetivo = "base",
            al_entrar = {
                { "npcs", id = TOMAS, lugar = "base", radio = 30, no_mas_cerca = 8, modo = "guard", quietos = true, correa = 6,
                  inmortales = true, postura = "friendly", salud = 400, banderas = FUERTE, perfiles = PERFIL_TOMAS, nombres = NOMBRE_TOMAS },
            },
            salidas = { { cuando = { { "grupo_listo", TOMAS }, { "cerca", "base", 15 } }, ir = "frente" } },
        },
        frente = {
            pista = "Decidir a que viniste (clic derecho cerca de Eduardo).",
            ancla = "base", ancla_grupo = TOMAS, radio = 20,
            al_entrar = {
                { "inmune", grupo = TOMAS, rol = "tomas", quien = "tomas_bandido" },
                { "decir", grupo = TOMAS, rol = "tomas", texto = "Viniste. Bien. Sientate o dispara, pero no me hagas esperar. Ya espere bastante en mi vida." },
            },
            opciones = {
                { id = "hablar", texto = "Vengo a hablar. Quiero devolverle Knox a la gente",
                  dice = { rol = "tomas", texto = "Devolverselo. Despues de quitarselo. ... Ya. Mi mama te hubiera dado sopa y un reto. Yo te doy las dos cosas: la sopa despues." } },
                { id = "terminar", texto = "Vengo a terminar esto",
                  dice = { rol = "tomas", texto = "Lo sabia. Igual tenia que preguntar. Ella lo hubiera preguntado." } },
            },
            salidas = {
                { cuando = { "eleccion", "hablar" }, ir = "final_reconquista" },
                { cuando = { "eleccion", "terminar" }, ir = "duelo" },
            },
        },
        -- El Eduardo amistoso se va y vuelve el que pelea (A-Life no cambia la postura de un NPC ya creado).
        duelo = {
            pista = "Matar a Eduardo Giovanns. La ultima mision.",
            objetivo = "base",
            al_entrar = {
                { "desinmunizar", grupo = TOMAS },
                { "retirar", grupo = TOMAS },
                { "bandidos", id = "duelo", lugar = "base", radio = 25, modo = "hunt", salud = 400, banderas = FUERTE,
                  perfiles = PERFIL_TOMAS, nombres = NOMBRE_TOMAS },
                { "aviso", texto = "Eduardo levanta su arma. No hay nadie mas en Fallas Lake. Solo ustedes dos y el campo." },
            },
            salidas = { { cuando = { "grupo_listo", "duelo" }, ir = "pelea_final" } },
        },
        pelea_final = {
            pista = "Matar a Eduardo Giovanns. La ultima mision.",
            objetivo = "base",
            al_entrar = { { "armar_legendario", grupo = "duelo", rol = "tomas" } },
            salidas = { { cuando = { "muerto", "duelo", "tomas" }, ir = "final_eduardo_muerto" } },
        },
        final_eduardo_muerto = { final = true, al_entrar = {
            { "legendario", lugar = "base", radio = 20, clase = "arma" },
            { "knox", cantidad = -30, motivo = "mataste a Eduardo Giovanns" },
            { "memoria", clave = "fin", valor = "eduardo_muerto" },
            { "memoria", clave = "tomas_muerto", valor = true },
            { "aviso", texto = "Eduardo Giovanns cae en el campo de Fallas Lake. En Knox ya nadie va a contar como se salvo." },
            { "diario", texto = "Mate a Eduardo Giovanns en el campo de Fallas Lake. Era el ultimo. Knox es de la banda. Me quedo su arma y el silencio." },
        } },
        final_reconquista = { final = true, al_entrar = {
            { "faccion", id = "narrador_pereira", postura = "hostile" },
            { "retirar_lejos", grupo = TOMAS, lugar = "base", radio = 60, retraso = 1 },
            { "memoria", clave = "reconquista", valor = true },
            { "diario", texto = "Le dije a Eduardo que quiero devolverle Knox a la gente. Me creyo, o hizo como que me creia. Vamos a sacar a los bandidos ciudad por ciudad." },
        } },
    },
})

-- ===========================================================================
-- La reconquista: ciudad por ciudad, con Eduardo
-- ===========================================================================
local DEFENSORES = { { "bandido1", "narrador_pereira_04" }, { "bandido2", "narrador_pereira_05" }, { "bandido3", "narrador_pereira_06" } }

local CIUDADES = {
    muldraugh = { titulo = "la comisaria de Muldraugh", nuevo = "Valentina, la hija del Cabo Ramiro",
        eduardo = "El Cabo me decia engreido. Tenia razon a veces. Vamos a devolverle su comisaria." },
    westpoint = { titulo = "el cuartel de West Point", nuevo = "Eduardo",
        eduardo = "Es la casa de mi mama. Yo entro primero. No me discutas." },
    riverside = { titulo = "la iglesia de Riverside", nuevo = "la Hermana Lucia",
        eduardo = "Hay que abrir esa puerta otra vez. Y que no se cierre nunca mas." },
    rosewood = { titulo = "la bencinera de Rosewood", nuevo = "Hector, el sobrino de la Misia Rosa",
        eduardo = "La luz de esa bencinera estuvo prendida treinta anos. Vamos a prenderla." },
}

for id, cd in pairs(CIUDADES) do
    registrar({
        id = "reconquista_" .. id,
        titulo = "La reconquista: " .. cd.titulo,
        titulo_menu = "Reconquista: " .. cd.titulo,
        requiere_alife = true, automatico = false,
        inicio = "orden",
        etapas = {
            orden = {
                al_entrar = {
                    { "lugar_contacto", id = "objetivo", contacto = id },
                    { "lugar_cerca", id = "reunion", de = "objetivo", distancia = 40 },
                    { "mapa", lugar = "objetivo", titulo = "Mapa de Eduardo: " .. cd.titulo },
                    { "aviso", texto = "Eduardo te espera cerca de " .. cd.titulo .. "." },
                },
                salidas = { { ir = "viaje" } },
            },
            viaje = {
                pista = "Juntarte con Eduardo cerca de {lugar:objetivo}.",
                objetivo = "reunion",
                salidas = {
                    { cuando = { "cerca", "reunion", 60 }, ir = "asalto" },
                    { cuando = { "horas", 96 }, ir = "final_abandonado" },
                },
            },
            asalto = {
                pista = "Sacar a los bandidos de " .. cd.titulo .. ".",
                objetivo = "objetivo",
                al_entrar = {
                    { "npcs", id = TOMAS, lugar = "reunion", radio = 30, no_mas_cerca = 8, modo = "guard", correa = 45,
                      inmortales = true, postura = "friendly", salud = 400, banderas = FUERTE, perfiles = PERFIL_TOMAS, nombres = NOMBRE_TOMAS },
                    { "condenar_misionero", contacto = id, dominio = "nuevo" },
                    { "bandidos", id = "defensores", lugar = "objetivo", radio = 40, modo = "guard", perfiles = DEFENSORES },
                },
                salidas = {
                    { cuando = { "grupo_listo", TOMAS }, ir = "pelea" },
                    { cuando = { "misionero_muerto", id }, ir = "final_reconquistado" },
                    { cuando = { "horas", 12 }, ir = "final_abandonado" },
                },
            },
            pelea = {
                pista = "Sacar a los bandidos de " .. cd.titulo .. ". {contacto_nombre} no se va a rendir.",
                objetivo = "objetivo",
                al_entrar = {
                    { "inmune", grupo = TOMAS, rol = "tomas", quien = "tomas_bandido" },
                    { "armar_legendario", grupo = TOMAS, rol = "tomas" },
                    { "decir", grupo = TOMAS, rol = "tomas", texto = cd.eduardo },
                },
                salidas = {
                    { cuando = { "misionero_muerto", id }, ir = "final_reconquistado" },
                    { cuando = { "horas", 12 }, ir = "final_abandonado" },
                },
            },
            final_reconquistado = { final = true, al_entrar = {
                { "knox", cantidad = 15, motivo = "redencion" },
                { "memoria", clave = "reconquista_" .. id, valor = true },
                { "retirar_lejos", grupo = TOMAS, lugar = "objetivo", radio = 70, retraso = 0.5 },
                { "aviso", texto = cd.titulo .. " es libre. Vuelve " .. cd.nuevo .. "." },
                { "diario", texto = "Sacamos a los bandidos de " .. cd.titulo .. ". Ahora la cuida " .. cd.nuevo .. "." },
            } },
            final_abandonado = { final = true, al_entrar = {
                { "retirar", grupo = TOMAS },
                { "indultar_misionero", contacto = id },
                { "diario", texto = "No termine lo de " .. cd.titulo .. ". Eduardo va a volver a buscarme." },
            } },
        },
    })
end

-- El patio de trenes: el jefe de la banda, al final.
registrar({
    id = "reconquista_patio",
    titulo = "La reconquista: el patio de trenes",
    titulo_menu = "Reconquista: el patio de trenes",
    requiere_alife = true, automatico = false,
    inicio = "orden",
    etapas = {
        orden = {
            al_entrar = {
                { "lugar_memoria", id = "patio", clave = "bandido_patio" },
                { "lugar_cerca", id = "reunion", de = "patio", distancia = 50 },
                { "mapa", lugar = "patio", titulo = "Mapa de Eduardo: el patio de trenes" },
                { "aviso", texto = "Solo queda el patio de trenes. Eduardo te espera cerca. {jefe_corto} sabe que vienes." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Juntarte con Eduardo cerca de {lugar:patio}.",
            objetivo = "reunion",
            salidas = { { cuando = { "cerca", "reunion", 60 }, ir = "asalto" } },
        },
        asalto = {
            pista = "Terminar con {jefe_nombre} en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = {
                { "npcs", id = TOMAS, lugar = "reunion", radio = 30, no_mas_cerca = 8, modo = "guard", correa = 45,
                  inmortales = true, postura = "friendly", salud = 400, banderas = FUERTE, perfiles = PERFIL_TOMAS, nombres = NOMBRE_TOMAS },
                { "faccion", id = "narrador_pereira", postura = "hostile" },
                { "npcs", id = "banda", lugar = "patio", radio = 50, modo = "guard", correa = 25, postura = "hostile", hostiles = true,
                  perfiles = { { "pereira", "var:jefe_perfil" }, { "desertor1", "narrador_pereira_02" }, { "desertor2", "narrador_pereira_03" },
                               { "bandido1", "narrador_pereira_04" }, { "bandido2", "narrador_pereira_05" } } },
            },
            salidas = {
                { cuando = { { "grupo_listo", TOMAS }, { "grupo_listo", "banda" } }, ir = "pelea" },
                { cuando = { "muerto", "banda", "pereira" }, ir = "final_luz" },
            },
        },
        pelea = {
            pista = "Terminar con {jefe_nombre} en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = {
                { "inmune", grupo = TOMAS, rol = "tomas", quien = "tomas_bandido" },
                { "armar_legendario", grupo = TOMAS, rol = "tomas" },
                { "decir", grupo = TOMAS, rol = "tomas", texto = "El ultimo. Despues de esto, Knox vuelve a ser de la gente. Vamos." },
                { "decir", grupo = "banda", rol = "pereira", retraso = 0.05, texto = { por_var = "bandido_jefe", textos = {
                    maulen = "Peni! Tu? Con el? ... Mi chuchu tenia razon: todos vuelven. Aunque sea para esto.",
                    otro = "Lo sabia. Los que cambian de bando una vez, cambian dos. Fuego!" } } },
            },
            salidas = { { cuando = { "muerto", "banda", "pereira" }, ir = "final_luz" } },
        },
        final_luz = { final = true, al_entrar = {
            { "knox_reiniciar", texto = "Knox vuelve a ser luz de esperanza. La gente sabe lo que hiciste. Tambien sabe lo que deshiciste." },
            { "knox", cantidad = 45, motivo = "redencion" },
            { "confianza_todos", cantidad = 100 },
            { "retirar_lejos", grupo = TOMAS, lugar = "patio", radio = 70, retraso = 0.5 },
            { "memoria", clave = "fin", valor = "reconquista" },
            { "diario", texto = "El patio de trenes cayo. {jefe_nombre} ya no manda en nada. En cada ciudad hay alguien que cree en la gente, y en West Point, Eduardo cocina para todos. Knox vuelve a ser luz de esperanza. Yo vuelvo a tener nombre." },
        } },
    },
})
