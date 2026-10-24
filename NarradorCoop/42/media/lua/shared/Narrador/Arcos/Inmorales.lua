-- Encargos inmorales: los unicos que dan los capitanes de los bandidos cuando una ciudad fue
-- conquistada (ver server/Narrador/NarradorDominios.lua, D.generarInmoral). Cuatro tipos:
--   tributo  : cobrarle comida y balas a una familia (o quitarselas).
--   testigo  : matar a alguien que vio demasiado (o dejarlo huir).
--   quemar   : prenderle fuego a un refugio de sobrevivientes (con bencina).
--   fugitivo : traer de vuelta a alguien que se escapo del campamento (o matarlo).
-- Cumplido: -5 de Knox (KD.MATAR), confianza con el capitan y botin segun el nivel.
-- Los finales no se llaman "final_cumplido" a proposito: esos suben Knox.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"
require "Narrador/NarradorKnoxDefs"

local registrar = Narrador.Defs.registrar
local KNOX = Narrador.KnoxDefs.MATAR
local GANANCIA = { facil = 3, medio = 6, dificil = 10 }

local CASAS = { "livingroom", "kitchen", "bedroom" }

local function plazo(lista)
    lista[#lista + 1] = { cuando = { "reloj_vencido", "plazo" }, ir = "final_vencido" }
    return lista
end

local function inicio(pedido, diario, lugar)
    return {
        al_entrar = {
            { "reloj", id = "plazo", horas = 72 },
            lugar or { "lugar", id = "objetivo", desde = "contacto", salas = CASAS, min = 200, max = 900 },
            { "decir_contacto", texto = pedido },
            { "diario", texto = diario },
        },
        salidas = { { ir = "viaje" } },
    }
end

local function viaje(pista)
    return { pista = pista, objetivo = "objetivo",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 40 }, ir = "sitio" } }) }
end

local function volver(pista, requiere)
    local op = { id = "entregar", texto = "Darle cuenta a {contacto_nombre}" }
    if requiere ~= nil then op.requiere = { "objeto", requiere }; op.falta = "No llevas la prueba." end
    return { pista = pista, ancla = "contacto", opciones = { op },
        salidas = plazo({ { cuando = { "eleccion", "entregar" }, ir = "final_hecho" } }) }
end

local function finales(id, diario)
    return {
        final_hecho = { final = true, al_entrar = {
            { "knox", cantidad = KNOX, motivo = "encargo inmoral: " .. id },
            { "reputacion", cantidad = "var:ganancia", motivo = "encargo inmoral" },
            { "decir_contacto", texto = "Bien. Asi se trabaja aca. Toma, tu parte." },
            { "pago_encargo", lugar = "contacto", radio = 35 },
            { "diario", texto = diario },
        } },
        final_perdonado = { final = true, al_entrar = {
            { "reputacion", cantidad = -10, motivo = "no cumpliste un encargo inmoral" },
            { "huella", acto = "perdonaste" },
            { "diario", texto = "No hice lo que me pidio {contacto_nombre}. Me va a cobrar. Que cobre." },
        } },
        final_vencido = { final = true, al_entrar = {
            { "diario", texto = "Se acabo el plazo del encargo de {contacto_nombre}. Mejor asi." },
        } },
    }
end

local function registrarInmoral(id, def)
    def.id = "inmoral_" .. id
    def.requiere_alife = true
    def.automatico = false
    def.encargo_nivel = "inmoral"
    def.inicio = "encargo"
    def.sorteo = def.sorteo or {}
    for k, v in pairs(finales(id, def.diario_final)) do def.etapas[k] = v end
    def.diario_final = nil
    registrar(def)
end

-- La ganancia de confianza segun el nivel (la pone server/Narrador/NarradorDominios.lua).
Narrador.InmoralesGanancia = GANANCIA

-- ---------------------------------------------------------------------------
-- Cobrar tributo
-- ---------------------------------------------------------------------------
registrarInmoral("tributo", {
    titulo = "Cobrar tributo",
    titulo_menu = "Inmoral: cobrar tributo",
    diario_final = "Le cobre el tributo a los Fuentes para {contacto_nombre}. Me pagaron mirando el suelo.",
    etapas = {
        encargo = inicio("Una familia en {lugar:objetivo} no ha pagado. Comida y balas. Lo que tengan. Si no tienen, que paguen de otra forma.",
            "{contacto_nombre} me mando a cobrarle tributo a una familia en {lugar:objetivo}."),
        viaje = viaje("Cobrarle el tributo a la familia de {lugar:objetivo}."),
        sitio = {
            pista = "Cobrarle el tributo a la familia de {lugar:objetivo}.",
            objetivo = "objetivo",
            al_entrar = {
                { "npcs", id = "familia", lugar = "objetivo", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  inmortales = true, postura = "friendly",
                  perfiles = { { "padre", "k93_hensley_family_02" }, { "hija", "k93_hensley_family_08" } }, femeninos = { "hija" },
                  nombres = { padre = { "Ignacio", "Fuentes" }, hija = { "Paula", "Fuentes" } } },
            },
            salidas = plazo({ { cuando = { { "grupo_listo", "familia" }, { "cerca", "objetivo", 15 } }, ir = "frente" } }),
        },
        frente = {
            pista = "Cobrarle a la familia Fuentes (clic derecho cerca).",
            ancla = "objetivo", ancla_grupo = "familia", radio = 15,
            al_entrar = {
                { "banderas", grupo = "familia", inmortales = false },
                { "decir", grupo = "familia", rol = "padre", texto = "Otra vez? Pagamos la semana pasada. Nos queda para tres dias." },
                { "decir", grupo = "familia", rol = "hija", retraso = 0.05, texto = "Papa, dale lo del sotano. Que se vaya." },
            },
            opciones = {
                { id = "cobrar", texto = "Cobrarles todo",
                  dice = { rol = "padre", texto = "Tome. Y digale a su capitan que si seguimos vivos el mes que viene, es porque Dios no le hace caso." } },
                { id = "perdonar", texto = "Decirles que se vayan del pueblo esta noche",
                  dice = { rol = "padre", texto = "Gracias... no se como se llama, pero gracias." } },
            },
            salidas = plazo({
                { cuando = { "o", { "eleccion", "cobrar" }, { "todos_muertos", "familia" } }, ir = "cobrado" },
                { cuando = { "eleccion", "perdonar" }, ir = "huida" },
            }),
        },
        cobrado = {
            al_entrar = {
                { "objeto", id = "tributo", lugar = "objetivo", radio = 6, tipo = { "Base.Bag_Satchel" }, nombre = "Tributo para {contacto_nombre}" },
                { "huella", acto = "obligaste", texto = "Le cobre tributo a la familia Fuentes para los bandidos." },
            },
            salidas = { { cuando = { "alguien_tiene", "tributo" }, ir = "volver" } },
        },
        huida = {
            al_entrar = { { "retirar_lejos", grupo = "familia", lugar = "objetivo", radio = 80, retraso = 0.3 } },
            salidas = { { ir = "final_perdonado" } },
        },
        volver = volver("Llevarle el tributo a {contacto_nombre}.", "tributo"),
    },
})

-- ---------------------------------------------------------------------------
-- Silenciar a un testigo
-- ---------------------------------------------------------------------------
registrarInmoral("testigo", {
    titulo = "Silenciar a un testigo",
    titulo_menu = "Inmoral: silenciar a un testigo",
    diario_final = "Silencie a Oscar Lagos para {contacto_nombre}. Lo ultimo que dijo fue un nombre que no conozco.",
    etapas = {
        encargo = inicio("Hay uno en {lugar:objetivo} que vio lo que no tenia que ver. Quiere contarselo a otros grupos. Que no cuente nada.",
            "{contacto_nombre} quiere muerto a un testigo escondido en {lugar:objetivo}."),
        viaje = viaje("Encontrar al testigo en {lugar:objetivo}."),
        sitio = {
            pista = "Encontrar al testigo en {lugar:objetivo}.",
            objetivo = "objetivo",
            al_entrar = {
                { "npcs", id = "testigo", lugar = "objetivo", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  inmortales = true, postura = "friendly", perfiles = { { "testigo", "k93_county_ems_07" } },
                  nombres = { testigo = { "Oscar", "Lagos" } } },
            },
            salidas = plazo({ { cuando = { { "grupo_listo", "testigo" }, { "cerca", "objetivo", 15 } }, ir = "frente" } }),
        },
        frente = {
            pista = "Decidir que hacer con Oscar Lagos (clic derecho cerca).",
            ancla = "objetivo", ancla_grupo = "testigo", radio = 15,
            al_entrar = {
                { "banderas", grupo = "testigo", inmortales = false },
                { "decir", grupo = "testigo", rol = "testigo", texto = "Te mando el capitan, cierto? Vi lo que hicieron en la comisaria. Alguien tiene que saberlo." },
            },
            opciones = {
                { id = "perdonar", texto = "Dejarlo huir lejos de Knox",
                  dice = { rol = "testigo", texto = "Me voy al norte. Y lo voy a contar igual. Pero no tu nombre. Te lo prometo." } },
            },
            salidas = plazo({
                { cuando = { "muerto", "testigo", "testigo" }, ir = "muerto" },
                { cuando = { "eleccion", "perdonar" }, ir = "huida" },
            }),
        },
        muerto = {
            al_entrar = {
                { "huella", acto = "mataste", texto = "Mate a Oscar Lagos porque vio demasiado." },
                { "objeto", id = "prueba", lugar = "objetivo", radio = 6, tipo = { "Base.IDcard", "Base.Wallet" }, nombre = "Carnet de Oscar Lagos" },
            },
            salidas = { { cuando = { "alguien_tiene", "prueba" }, ir = "volver" } },
        },
        huida = {
            al_entrar = { { "retirar_lejos", grupo = "testigo", lugar = "objetivo", radio = 80, retraso = 0.3 } },
            salidas = { { ir = "final_perdonado" } },
        },
        volver = volver("Llevarle a {contacto_nombre} el carnet del testigo.", "prueba"),
    },
})

-- ---------------------------------------------------------------------------
-- Quemar un refugio
-- ---------------------------------------------------------------------------
local BENCINA = { "Base.PetrolCan", "Base.JerryCanFull", "Base.Gasoline" }

registrarInmoral("quemar", {
    titulo = "Quemar un refugio",
    titulo_menu = "Inmoral: quemar un refugio",
    diario_final = "Queme el refugio de {lugar:objetivo} para {contacto_nombre}. Todavia huelo a humo cuando escribo.",
    etapas = {
        encargo = inicio("En {lugar:objetivo} se juntan sobrevivientes que no pagan. Quemalo. Que no quede donde volver. Lleva gasolina.",
            "{contacto_nombre} quiere que queme un refugio en {lugar:objetivo}. Necesito gasolina."),
        viaje = viaje("Ir al refugio de {lugar:objetivo}, con gasolina."),
        sitio = {
            pista = "Quemar el refugio de {lugar:objetivo}.",
            objetivo = "objetivo",
            al_entrar = {
                { "npcs", id = "refugiados", lugar = "objetivo", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  inmortales = true, postura = "friendly",
                  perfiles = { { "uno", "k93_red_cross_07" }, { "dos", "k93_red_cross_06" } }, femeninos = { "uno" },
                  nombres = { uno = { "Marta", "Ibanez" }, dos = { "Luis", "Ibanez" } } },
            },
            salidas = plazo({ { cuando = { { "grupo_listo", "refugiados" }, { "cerca", "objetivo", 15 } }, ir = "frente" } }),
        },
        frente = {
            pista = "Quemar el refugio de {lugar:objetivo} (clic derecho cerca).",
            ancla = "objetivo", ancla_grupo = "refugiados", radio = 15,
            al_entrar = {
                { "decir", grupo = "refugiados", rol = "uno", texto = "Ese bidon es de gasolina? ... Luis. Luis, saca a los ninos." },
            },
            opciones = {
                { id = "quemar", texto = "Echarlos y prenderle fuego al refugio",
                  requiere = { "items", BENCINA, 1 }, falta = "Necesitas gasolina (un bidon lleno).",
                  dice = { rol = "uno", texto = "Ojala que el fuego te siga hasta tu casa." } },
                { id = "perdonar", texto = "Avisarles que se vayan y no quemar nada",
                  dice = { rol = "dos", texto = "Nos vamos esta noche. No vamos a decir que estuviste aqui." } },
            },
            salidas = plazo({
                { cuando = { "eleccion", "quemar" }, ir = "incendio" },
                { cuando = { "eleccion", "perdonar" }, ir = "huida" },
            }),
        },
        incendio = {
            al_entrar = {
                { "retirar_lejos", grupo = "refugiados", lugar = "objetivo", radio = 80, retraso = 0.1 },
                { "incendiar", lugar = "objetivo", radio = 3 },
                { "aviso", texto = "El refugio de {lugar:objetivo} arde. Desde lejos, alguien grita un nombre." },
                { "huella", acto = "obligaste", texto = "Queme un refugio de sobrevivientes para los bandidos." },
            },
            salidas = { { ir = "volver" } },
        },
        huida = {
            al_entrar = { { "retirar_lejos", grupo = "refugiados", lugar = "objetivo", radio = 80, retraso = 0.3 } },
            salidas = { { ir = "final_perdonado" } },
        },
        volver = volver("Avisarle a {contacto_nombre} que el refugio ardio."),
    },
})

-- ---------------------------------------------------------------------------
-- Cazar a un fugitivo
-- ---------------------------------------------------------------------------
registrarInmoral("fugitivo", {
    titulo = "Cazar a un fugitivo",
    titulo_menu = "Inmoral: cazar a un fugitivo",
    diario_final = "Cace a Benjamin Sotelo para {contacto_nombre}. Vivo o muerto, da lo mismo para ellos.",
    etapas = {
        encargo = inicio("Uno de los mios se escapo con cosas que no eran suyas. Esta escondido en {lugar:objetivo}. Traemelo. Vivo si se puede. Si no, su carnet.",
            "{contacto_nombre} quiere de vuelta a un fugitivo escondido en {lugar:objetivo}. Vivo o muerto.",
            { "lugar", id = "objetivo", desde = "contacto", salas = { "motelroom", "bedroom", "livingroom", "garagestorage" }, min = 400, max = 1300 }),
        viaje = viaje("Encontrar al fugitivo en {lugar:objetivo}."),
        sitio = {
            pista = "Encontrar al fugitivo en {lugar:objetivo}.",
            objetivo = "objetivo",
            al_entrar = {
                { "npcs", id = "fugitivo", lugar = "objetivo", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  inmortales = true, postura = "friendly", perfiles = { { "fugitivo", "k93_kessinger_11" } },
                  nombres = { fugitivo = { "Benjamin", "Sotelo" } } },
                { "oleada", lugar = "objetivo", radio = 50, cantidad = { 8, 14 }, min = 20, max = 40 },
            },
            salidas = plazo({ { cuando = { { "grupo_listo", "fugitivo" }, { "cerca", "objetivo", 15 } }, ir = "frente" } }),
        },
        frente = {
            pista = "Decidir que hacer con Benjamin Sotelo (clic derecho cerca).",
            ancla = "objetivo", ancla_grupo = "fugitivo", radio = 15,
            al_entrar = {
                { "banderas", grupo = "fugitivo", inmortales = false },
                { "decir", grupo = "fugitivo", rol = "fugitivo", texto = "No me lleves de vuelta. Me escape porque querian que matara a una familia. No pude." },
            },
            opciones = {
                { id = "llevar", texto = "Mandarlo de vuelta con {contacto_nombre}; te espera alla",
                  dice = { rol = "fugitivo", texto = "Ya. Ya. Camino. No me tires." } },
                { id = "perdonar", texto = "Dejarlo ir",
                  dice = { rol = "fugitivo", texto = "Gracias. Me voy de Knox. Ojala tu tambien puedas algun dia." } },
            },
            salidas = plazo({
                { cuando = { "muerto", "fugitivo", "fugitivo" }, ir = "muerto" },
                { cuando = { "eleccion", "llevar" }, ir = "escolta" },
                { cuando = { "eleccion", "perdonar" }, ir = "huida" },
            }),
        },
        escolta = {
            pista = "Benjamin Sotelo va por su cuenta donde {contacto_nombre}. Vuelve alla: te espera.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = "fugitivo", rol = "fugitivo", nombre = "Benjamin Sotelo", inmortal = false },
                { "banderas", grupo = "fugitivo", inmortales = false, quietos = false, correa = 0 },
                { "huella", acto = "entregaste", texto = "Entregue a Benjamin Sotelo a los bandidos." },
            },
            salidas = plazo({
                { cuando = { "muerto", "fugitivo", "fugitivo" }, ir = "muerto" },
                { cuando = { "npc_cerca", "fugitivo", "contacto", 15 }, ir = "entregado" },
            }),
        },
        entregado = {
            al_entrar = {
                { "soltar_acompanante", grupo = "fugitivo", rol = "fugitivo" },
                { "retirar_lejos", grupo = "fugitivo", lugar = "contacto", radio = 40, retraso = 1 },
            },
            salidas = { { ir = "final_hecho" } },
        },
        muerto = {
            al_entrar = {
                { "soltar_acompanante", grupo = "fugitivo", rol = "fugitivo" },
                { "huella", acto = "mataste", texto = "Mate a Benjamin Sotelo, que se escapo de los bandidos." },
                { "lugar_jugador", id = "aqui" },
                { "objeto", id = "prueba", lugar = "aqui", radio = 6, tipo = { "Base.IDcard", "Base.Wallet" }, nombre = "Carnet de Benjamin Sotelo" },
            },
            salidas = { { ir = "volver" } },
        },
        huida = {
            al_entrar = { { "retirar_lejos", grupo = "fugitivo", lugar = "objetivo", radio = 80, retraso = 0.3 } },
            salidas = { { ir = "final_perdonado" } },
        },
        volver = volver("Llevarle a {contacto_nombre} el carnet del fugitivo.", "prueba"),
    },
})
