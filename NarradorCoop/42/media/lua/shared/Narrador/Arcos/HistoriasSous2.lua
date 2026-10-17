-- Modo historia de Sous (parte 2): las historias de Hanz Walita, Cristian Cristonks, Jorge Hasag
-- y Cristobal Wertres. Las de Akagami, Zent, Matric, Shinbo y Tati van en otro archivo.
-- Las lanza server/Narrador/NarradorHistoriasSous2.lua (Sous aliado, una a la vez, con horas
-- entre una y otra). Al terminar bien, cada uno te da su arma legendaria con nombre propio
-- (accion "arma_personaje2").
--
--   Walita    "El primo de Iquique": rescatar a Waton Ju y Claudio Clau; desvio opcional por
--             el computador del Waton (cuenta de PXG nivel 69). Arma: La Maza del Morro.
--   Cristonks "Mayday en el cerro": bengalas; Clau y Renaaaaaato rodeados; rush B o rodear por
--             el cerro. Arma: El Piolet de Farellones.
--   Hasag     "La cabana del cerro": con el primo (y Matric de chaperon, si quieres); bandidos
--             tienen al Fucking Luengo cocinando; repartir la despensa. Arma: El Recorte de Presupuesto.
--   Wertres   "Los goles del Bicho": un generador para ver los goles de Cristiano; probarlo ahi
--             (horda) o llevarlo sin probar (falta una bateria). Arma: El Siuuu de Wertres.
--
-- Grupos de cada historia: "pide" (el residente de Sous en su base, prestado), "yo" (una copia
-- del mismo personaje que te espera en terreno, inmortal) y "amigos" (los amigos de Sous).
-- Memoria: "sous_historia_<rol>" = hecho, fallido, postergada o murio.
-- Dialogos originales, solo imitando la forma de hablar de cada uno. Sin tildes ni enies.

require "Narrador/NarradorDefs"
require "Narrador/NarradorLore"
require "Narrador/Arcos/Sous"
require "Narrador/Arcos/SousAmigos"

Narrador = Narrador or {}
local registrar = Narrador.Defs.registrar
local AM = Narrador.SousAmigos
local P = AM.PERFILES

local HS = Narrador.HistoriasSous2 or {}
Narrador.HistoriasSous2 = HS

-- Orden en que se ofrecen.
HS.ROLES = { "hanz", "cristian", "jorge", "cristobal" }
HS.PERFILES_SOUS = { hanz = "narrador_sous_06", cristian = "narrador_sous_07", jorge = "narrador_sous_08",
    cristobal = "narrador_sous_09", benjamin = "narrador_sous_03", david = "narrador_sous_04" }
HS.NOMBRES = { hanz = "Hanz Walita", cristian = "Cristian Cristonks", jorge = "Jorge Hasag", cristobal = "Cristobal Wertres" }

function HS.idDe(rol) return "historia_sous_" .. rol end
function HS.memoriaDe(rol) return "sous_historia_" .. rol end

local WATON, CLAU, LUENGO, RENATO = P.waton[1], P.clau[1], P.luengo[1], P.renato[1]
local CASAS = { "livingroom", "kitchen", "bedroom" }
local COMIDA = { { "Base.TinnedBeans", "Base.CannedChili" }, { "Base.TinnedSoup", "Base.CannedCorn" }, { "Base.TunaTin", "Base.TinnedBeans" },
    { "Base.Pasta", "Base.Rice" }, { "Base.Ham", "Base.Bread" } }

local function sous(rol) return { rol, HS.PERFILES_SOUS[rol] } end

-- ---------------------------------------------------------------------------
-- Piezas comunes
-- ---------------------------------------------------------------------------

-- Lo primero de cada historia: amigos de Sous amistosos, el residente prestado y la base.
local function llamado(rol, aviso, diario)
    return {
        al_entrar = {
            { "faccion", id = AM.FACCION, postura = "friendly" },
            { "prestar_residente", residente = "sous", rol = rol, grupo = "pide" },
            { "lugar_memoria", id = "base", clave = "base_sous", salas = { "farmstorage", "barn", "warehouse" }, respaldo = CASAS },
            { "aviso", texto = aviso },
            { "diario", texto = diario },
        },
        salidas = { { ir = "pedido" } },
    }
end

-- En la base: escuchar, y despues aceptar (una o varias formas) o dejarlo para otro dia.
local function pedido(rol, corto, escuchar, aceptar, despues)
    local opciones = { { id = "escuchar", texto = "Escuchar a " .. corto, una_vez = true, dice = { rol = rol, texto = escuchar.texto },
                         acciones = escuchar.acciones } }
    local salidas = { { cuando = { "muerto", "pide", rol }, ir = "final_murio" } }
    for _, a in ipairs(aceptar) do
        opciones[#opciones + 1] = { id = a.id, texto = a.texto, si = { "eleccion", "escuchar" }, dice = { rol = rol, texto = a.dice },
                                    acciones = a.acciones }
        salidas[#salidas + 1] = { cuando = { "eleccion", a.id }, ir = a.ir }
    end
    opciones[#opciones + 1] = { id = "despues", texto = "Decirle que ahora no puedes", si = { "eleccion", "escuchar" },
                                dice = { rol = rol, texto = despues } }
    salidas[#salidas + 1] = { cuando = { "eleccion", "despues" }, ir = "final_postergada" }
    salidas[#salidas + 1] = { cuando = { "horas", 48 }, ir = "final_postergada" }
    return {
        pista = "Hablar con " .. corto .. " en la base de Sous (clic derecho cerca de el).",
        ancla = "base", ancla_grupo = "pide", radio = 40,
        opciones = opciones,
        salidas = salidas,
    }
end

-- Los amigos te siguen hasta la base (y se suben al auto contigo).
local function seguir(roles)
    local l = {}
    for _, r in ipairs(roles) do
        l[#l + 1] = { "acompanante", grupo = "amigos", rol = r, nombre = type(AM.nombres[r]) == "string" and AM.nombres[r] or nil, inmortal = false }
    end
    l[#l + 1] = { "banderas", grupo = "amigos", quietos = false, correa = 0 }
    return l
end

local function soltar(roles)
    local l = {}
    for _, r in ipairs(roles) do l[#l + 1] = { "soltar_acompanante", grupo = "amigos", rol = r } end
    return l
end

local function juntar(...)
    local out = {}
    for _, lista in ipairs({ ... }) do
        for _, a in ipairs(lista) do out[#out + 1] = a end
    end
    return out
end

local function finales(rol, t)
    return {
        final_hecho = { final = true, al_entrar = juntar(t.hecho, {
            { "arma_personaje2", rol = rol, de = HS.NOMBRES[rol] },
            { "memoria", clave = "sous_historia_" .. rol, valor = "hecho" },
            { "diario", texto = t.diario_hecho },
        }) },
        final_fallido = { final = true, al_entrar = juntar(t.fallido, {
            { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
            { "retirar_lejos", grupo = "amigos", lugar = "llegada", radio = 60, retraso = 2 },
            { "memoria", clave = "sous_historia_" .. rol, valor = "fallido" },
            { "diario", texto = t.diario_fallido },
        }) },
        final_postergada = { final = true, al_entrar = {
            { "memoria", clave = "sous_historia_" .. rol, valor = "postergada" },
            { "diario", texto = t.diario_postergada },
        } },
        final_murio = { final = true, al_entrar = {
            { "memoria", clave = "sous_historia_" .. rol, valor = "murio" },
            { "diario", texto = t.diario_murio },
        } },
    }
end

local function con(etapas, extra)
    for k, v in pairs(extra) do etapas[k] = v end
    return etapas
end

Narrador.Charlas = Narrador.Charlas or {}

-- ===========================================================================
-- Hanz Walita: El primo de Iquique
-- ===========================================================================
Narrador.Charlas.hs2_hanz = {
    { "hanz", "Waton! Agachate, que te van a morder la cabeza y no te queda tanta, vale!" },
    { "hanz", "Broder, este es mi primo. Es buena gente. Lento, pero buena gente." },
    { WATON, "Primo! Llegaste! Igual que en Iquique: tarde y haciendose el heroe." },
    { WATON, "Me falta un nivel, Hanz. UNO. Y se acabo el mundo. Que mala suerte la mia." },
    { CLAU, "Hola Hanz! Hola desconocido. Yo soy el Clau. El chico, si. El moreno, tambien." },
    { CLAU, "Tres dias aca adentro con el Waton hablando de PXG. Los zombis eran lo de menos." },
    { "hanz", "Clau! Sabia que si estaba el Waton, tu estabas cuidandolo. Como siempre, broder." },
}

local HANZ_FIN = finales("hanz", {
    hecho = juntar(soltar({ WATON, CLAU }), {
        { "decir", grupo = "pide", rol = "hanz", texto = "Vale broder. Me trajiste al primo. Toma: la Maza del Morro. El mango lo talle yo, con el Morro de Arica y todo. Pa que te acuerdes del norte aunque nunca hayas ido." },
        { "decir", grupo = "amigos", rol = WATON, retraso = 0.05, si = { "var", "pc", true }, texto = "Prendio el computador! Nivel 69... y sin internet. Bueno, igual lo voy a mirar todos los dias." },
        { "decir", grupo = "amigos", rol = CLAU, retraso = 0.08, texto = "Gracias por venir. De verdad. Tres dias mas con el Waton y me convertia yo solito." },
        { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
        { "retirar_lejos", grupo = "amigos", lugar = "base", radio = 30, retraso = 1 },
    }),
    fallido = juntar(soltar({ WATON, CLAU }), {
        { "decir", grupo = "pide", rol = "hanz", texto = "No llego el primo, broder. ... Nunca llego al 70. Le voy a tallar una figurita con el numero. Pa que lo tenga alla arriba." },
    }),
    diario_hecho = "Walita recupero a su primo, Waton Ju, y de pasada al Clau. Se pasaron la tarde discutiendo si Hanz vivio en Antofagasta (nunca, Iquique y despues Arica). Walita me regalo La Maza del Morro, con el mango tallado por el.",
    diario_fallido = "No pude traer vivo al Waton Ju. Walita se quedo callado toda la noche, tallando. No le salio ningun chiste.",
    diario_postergada = "Walita queria ir a buscar a su primo. Le dije que ahora no. Me miro con cara de 'vale', pero no era un vale contento.",
    diario_murio = "Walita murio antes de poder ir a buscar a su primo. El Waton Ju sigue alla afuera, en algun lado, con su nivel 69.",
})

registrar({
    id = HS.idDe("hanz"),
    titulo = "El primo de Iquique",
    titulo_menu = "Historia de Sous: Hanz Walita, el primo de Iquique",
    requiere_alife = true, automatico = false, tono = "vida", intensidad = 2,
    inicio = "llamado",
    etapas = con({
        llamado = llamado("hanz", "Hanz Walita te anda buscando en la base de Sous. Dice que es cosa de familia.",
            "Walita me mando a llamar a la base de Sous. Cosa de familia, dijo. En el nunca se sabe si eso es serio."),
        pedido = pedido("hanz", "Walita",
            { texto = "Broder, sientate. Anoche en la radio una voz repetia 'nivel 69, nivel 69'. Hay una sola persona en el mundo que se queda pegada en el 69: el Waton Ju, mi primo. Vivimos juntos en Iquique hasta que yo tenia doce. Dice que esta encerrado en una tienda con el Clau." },
            { { id = "aceptar", texto = "Ir con Walita a buscar a su primo", ir = "viaje",
                dice = "Vale! Yo me adelanto. Si llegas y estoy peleando, es que llegue primero, no que me perdi.",
                acciones = {
                    { "lugar", id = "tienda", desde = "base", salas = { "electronicsstore", "bookstore", "office" }, respaldo = CASAS, min = 250, max = 1000 },
                    { "lugar_cerca", id = "llegada", de = "tienda", distancia = 14 },
                    { "mapa_con_marcas", lugar = "tienda", titulo = "Mapa de Walita: el Waton Ju", texto = "Aca el Waton (nivel 69)",
                      marcas = { { lugar = "base", simbolo = "NarradorSous", texto = "Base de Sous", r = 0.75, g = 0.12, b = 0.05 } } },
                    { "diario", texto = "El primo de Walita, Waton Ju, esta encerrado en {lugar:tienda} con Claudio Clau. Walita salio antes que yo." },
                } } },
            "Ya broder, otro dia. El Waton espero treinta anos el nivel 70, puede esperar un poco mas. Creo."),
        viaje = {
            pista = "Ir a {lugar:tienda}, donde estan encerrados Waton Ju y Claudio Clau. Walita se adelanto.",
            objetivo = "tienda",
            salidas = {
                { cuando = { "cerca", "tienda", 60 }, ir = "sitio" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
        sitio = {
            pista = "Sacar a Waton Ju y a Claudio Clau de {lugar:tienda}. Que no muera el Waton.",
            objetivo = "tienda",
            charla = { grupos = { "yo", "amigos" }, lista = "hs2_hanz", radio = 25, cada = 0.15 },
            al_entrar = {
                { "aviso", texto = "Hay muertos golpeando las vitrinas. Adentro alguien grita: 'Hanz! Aca, wn!'" },
                { "npcs", id = "yo", lugar = "llegada", radio = 50, modo = "guard", inmortales = true, postura = "friendly", perfiles = { sous("hanz") } },
                { "npcs", id = "amigos", lugar = "tienda", radio = 45, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { P.waton, P.clau } },
                { "oleada", lugar = "tienda", radio = 50, cantidad = { 16, 24 }, min = 12, max = 30 },
                { "oleada", lugar = "tienda", radio = 50, cantidad = { 8, 12 }, min = 14, max = 30, retraso = 0.4 },
            },
            salidas = {
                { cuando = { "muerto", "amigos", WATON }, ir = "final_fallido" },
                { cuando = { { "grupo_listo", "amigos" }, { "horas", 1 } }, ir = "reencuentro" },
            },
        },
        reencuentro = {
            pista = "Hablar con Waton Ju (clic derecho cerca).",
            ancla = "tienda", ancla_grupo = "amigos", radio = 25,
            al_entrar = {
                { "decir", grupo = "amigos", rol = WATON, texto = "Primo! Sabia que venias. Igual que cuando vivias en Antofagasta: llegando tarde." },
                { "decir", grupo = "yo", rol = "hanz", retraso = 0.03, texto = "Nunca vivi en Antofagasta, wn! Iquique hasta los doce, contigo, y despues Arica, con mi taller. Treinta anos y no te lo aprendes." },
                { "decir", grupo = "amigos", rol = CLAU, retraso = 0.06, texto = "No salimos antes porque el Waton no se quiere ir sin su computador. Esta en su casa, aca cerca." },
            },
            opciones = {
                { id = "computador", texto = "Ir a buscar el computador del Waton Ju (hay saqueadores)",
                  dice = { rol = WATON, texto = "Ahi esta mi cuenta de PXG. Nivel 69. Si la pierdo empiezo de cero, y de cero no llego nunca al 70." } },
                { id = "directo", texto = "Volver directo a la base de Sous",
                  dice = { grupo = "yo", rol = "hanz", texto = "El PXG se murio con el internet, primo. Vamos, que se va la luz." } },
            },
            salidas = {
                { cuando = { "muerto", "amigos", WATON }, ir = "final_fallido" },
                { cuando = { "eleccion", "computador" }, ir = "desvio" },
                { cuando = { "eleccion", "directo" }, ir = "escolta" },
            },
        },
        desvio = {
            pista = "Recuperar el computador del Waton Ju en {lugar:casa_waton}. Hay saqueadores adentro.",
            objetivo = "casa_waton",
            al_entrar = juntar({
                { "lugar", id = "casa_waton", desde = "tienda", salas = { "bedroom", "livingroom" }, respaldo = { "kitchen" }, min = 80, max = 300 },
                { "mapa", lugar = "casa_waton", titulo = "La casa del Waton Ju" },
                { "bandidos", id = "saqueadores", lugar = "casa_waton", radio = 55, modo = "guard", cantidad = { 2, 3 } },
                { "oleada", lugar = "casa_waton", radio = 50, cantidad = { 6, 10 } },
                { "objeto", id = "pc", lugar = "casa_waton", radio = 45, tipo = { "Base.ElectronicsScrap" }, nombre = "Computador del Waton Ju (nivel 69)" },
                { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
                { "decir", grupo = "yo", rol = "hanz", texto = "Yo vuelvo por el cerro y les cuido la retirada, broder. Llevalos tu." },
            }, seguir({ WATON, CLAU })),
            salidas = {
                { cuando = { "muerto", "amigos", WATON }, ir = "final_fallido" },
                { cuando = { "alguien_tiene", "pc" }, ir = "con_pc" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
        con_pc = {
            al_entrar = {
                { "variable", nombre = "pc", valor = true },
                { "decir", grupo = "amigos", rol = WATON, texto = "Mi bebe! Primo, si llego al 70 en el fin del mundo, la primera figurita que tallas es mia." },
            },
            salidas = { { ir = "escolta" } },
        },
        escolta = {
            pista = "Llevar a Waton Ju y a Claudio Clau vivos a la base de Sous.",
            objetivo = "base",
            al_entrar = juntar(seguir({ WATON, CLAU }), {
                { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
                { "oleada", lugar = "jugador", cantidad = { 6, 9 }, min = 25, max = 40, retraso = 0.5 },
                { "aviso", texto = "El Waton Ju habla fuerte. Muy fuerte. Algo en el camino lo escucho.", retraso = 0.5 },
            }),
            salidas = {
                { cuando = { "muerto", "amigos", WATON }, ir = "final_fallido" },
                { cuando = { "npc_cerca", "amigos", "base", 18 }, ir = "final_hecho" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
    }, HANZ_FIN),
})

-- ===========================================================================
-- Cristian Cristonks: Mayday en el cerro
-- ===========================================================================
Narrador.Charlas.hs2_cristian = {
    { "cristian", "Compadre, cubreme! Desde el cerro esto se veia mas facil. Akkakaka." },
    { "cristian", "Tres bengalas rojas. Mayday. Les dije mil veces que era pa emergencias, no pa saludar." },
    { RENATO, "Rush B! Rush B! ... Ya, aca no hay B, pero la idea se entiende." },
    { RENATO, "Esto es como Dust 2, pero los terroristas no se mueren con un tiro en la cabeza. Bueno, si se mueren." },
    { CLAU, "Cristian! Sabia que ibas a ver las bengalas desde tu cerro." },
    { CLAU, "Yo le dije al Renato que no tirara las tres juntas. Las tiro todas juntas, obvio." },
    { "cristian", "Y el primo? No, el primo se quedo. Alguien tiene que contar las latas. No me miren asi." },
}

local CRISTIAN_FIN = finales("cristian", {
    hecho = juntar(soltar({ CLAU, RENATO }), {
        { "decir", grupo = "pide", rol = "cristian", texto = "Compadre, me trajiste a los cabros! Toma: el Piolet de Farellones. Con este subi la cordillera entera. Bueno, el cerro de atras. Pero con nieve, compadre!" },
        { "decir_residente", rol = "benjamin", retraso = 0.04, texto = "Bro, Cristonks vuelve de un rescate y lo primero que pregunta es si el Hasag lo extrano. Lo primero, hermano. Yo solo observo." },
        { "decir_residente", rol = "jorge", retraso = 0.08, texto = "Matric, deja de anotar cuantas veces pregunta por mi. Es mi PRIMO, sangre." },
        { "decir", grupo = "amigos", rol = RENATO, retraso = 0.1, texto = "Despues de esto, LAN de Counter en la base. Clau, tu eres el bot. Como siempre." },
        { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
        { "retirar_lejos", grupo = "amigos", lugar = "base", radio = 30, retraso = 1 },
    }),
    fallido = juntar(soltar({ CLAU, RENATO }), {
        { "decir", grupo = "pide", rol = "cristian", texto = "No llegamos, compadre. Desde arriba se ve todo... menos a tiempo." },
    }),
    diario_hecho = "Cristonks vio bengalas desde el cerro y fuimos por el Clau y el Renaaaaaato. Volvieron vivos. Matric le pregunto a Cristonks por el Hasag antes que por los rescatados. Me regalo El Piolet de Farellones.",
    diario_fallido = "Las bengalas de Cristonks eran de verdad un mayday, y no llegamos a tiempo para el Clau. Cristonks subio solo al cerro. Esta vez no conto nada de la nieve.",
    diario_postergada = "Cristonks vio bengalas desde el cerro. Le dije que ahora no podia. Se fue a mirar con los binoculares, solo.",
    diario_murio = "Cristonks murio antes de ir por las bengalas. Nadie mas en Sous las habia visto.",
})

registrar({
    id = HS.idDe("cristian"),
    titulo = "Mayday en el cerro",
    titulo_menu = "Historia de Sous: Cristian Cristonks, mayday en el cerro",
    requiere_alife = true, automatico = false, tono = "vida", intensidad = 2,
    inicio = "llamado",
    etapas = con({
        llamado = llamado("cristian", "Cristian Cristonks te anda buscando en la base de Sous. Bajo corriendo del cerro.",
            "Cristonks bajo del cerro corriendo y pregunto por mi. Cuando un piloto corre, algo paso."),
        pedido = pedido("cristian", "Cristonks",
            { texto = "Compadre! Anoche desde el cerro vi bengalas. Rojas, tres seguidas: eso es mayday. Akkakaka... no, no es chiste. El Clau y el Renato salieron hace una semana a buscar repuestos. Me acompanas?",
              acciones = { { "decir_residente", rol = "benjamin", retraso = 0.03, texto = "Y esta vez el Hasag no va? Raro, bro. Sin el primo no hay cerro. Sin cerro no hay nieve. Sin nieve no hay... ya, no digo nada." } } },
            { { id = "aceptar", texto = "Ir con Cristonks a buscar a Clau y Renato", ir = "viaje",
                dice = "Buena, compadre! Yo me adelanto. Desde arriba te voy guiando. Bueno, sin radio. Te guio con fe.",
                acciones = {
                    { "lugar", id = "campamento", desde = "base", salas = { "campingstore", "sportstore", "barn", "garagestorage" }, respaldo = CASAS, min = 300, max = 1100 },
                    { "lugar_cerca", id = "llegada", de = "campamento", distancia = 14 },
                    { "mapa_con_marcas", lugar = "campamento", titulo = "Mapa de Cristonks: las bengalas", texto = "Bengalas! (3, rojas)",
                      marcas = { { lugar = "base", simbolo = "NarradorSous", texto = "Base de Sous", r = 0.75, g = 0.12, b = 0.05 } } },
                    { "diario", texto = "Cristonks vio tres bengalas rojas sobre {lugar:campamento}. El Clau y el Renaaaaaato estan ahi." },
                } } },
            "Ya, compadre. Pero si tiran otra bengala, voy solo. Igual, igual."),
        viaje = {
            pista = "Ir a {lugar:campamento}, donde se vieron las bengalas. Cristonks se adelanto.",
            objetivo = "campamento",
            salidas = {
                { cuando = { "cerca", "campamento", 60 }, ir = "sitio" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
        sitio = {
            pista = "Salvar a Claudio Clau y a Renaaaaaato en {lugar:campamento}.",
            objetivo = "campamento",
            charla = { grupos = { "yo", "amigos" }, lista = "hs2_cristian", radio = 25, cada = 0.15 },
            al_entrar = {
                { "aviso", texto = "Hay humo rojo todavia colgando sobre el lugar. Y muertos por todas partes, mirando hacia arriba." },
                { "npcs", id = "yo", lugar = "llegada", radio = 50, modo = "guard", inmortales = true, postura = "friendly", perfiles = { sous("cristian") } },
                { "npcs", id = "amigos", lugar = "campamento", radio = 45, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { P.clau, P.renato } },
                { "oleada", lugar = "campamento", radio = 50, cantidad = { 14, 20 }, min = 12, max = 30 },
                { "corredores", lugar = "campamento", radio = 50, cantidad = { 2, 3 }, min = 20, max = 35, retraso = 0.3 },
            },
            salidas = {
                { cuando = { "muerto", "amigos", CLAU }, ir = "final_fallido" },
                { cuando = { { "grupo_listo", "amigos" }, { "horas", 0.75 } }, ir = "plan" },
            },
        },
        plan = {
            pista = "Decidir como salir de {lugar:campamento} (clic derecho cerca de Renato o Cristonks).",
            ancla = "campamento", ancla_grupo = "amigos", radio = 25,
            al_entrar = {
                { "decir", grupo = "amigos", rol = RENATO, texto = "Oe, viene otra horda por el camino. Yo digo rush B: salimos por el frente, a lo Counter, y que sea lo que Dios quiera." },
                { "decir", grupo = "yo", rol = "cristian", retraso = 0.03, texto = "O rodeamos por el cerro, compadre. Mas largo, pero desde arriba se ve todo. El que no mira el cielo, no vuela." },
            },
            opciones = {
                { id = "rush", texto = "Hacerle caso a Renato: rush B por el frente",
                  dice = { rol = RENATO, texto = "Rush B, cabros! No paren, no paren! ... Clau, no pares!" },
                  acciones = { { "oleada", lugar = "campamento", radio = 50, cantidad = { 14, 20 }, min = 10, max = 25 } } },
                { id = "cerro", texto = "Hacerle caso a Cristonks: rodear por el cerro",
                  dice = { grupo = "yo", rol = "cristian", texto = "Buena, compadre. Agachados y en silencio, como en la nieve." } },
            },
            salidas = {
                { cuando = { "muerto", "amigos", CLAU }, ir = "final_fallido" },
                { cuando = { "eleccion", "rush" }, ir = "escolta" },
                { cuando = { "eleccion", "cerro" }, ir = "rodeo" },
            },
        },
        rodeo = {
            pista = "Rodear por el cerro: pasar por {lugar:mirador} con Clau y Renato.",
            objetivo = "mirador",
            al_entrar = juntar({
                { "lugar", id = "mirador", desde = "campamento", salas = { "barn", "shed", "farmstorage" }, respaldo = CASAS, min = 80, max = 250 },
                { "mapa", lugar = "mirador", titulo = "El rodeo de Cristonks" },
                { "bandidos", id = "mirones", lugar = "mirador", radio = 50, modo = "guard", cantidad = { 1, 2 } },
                { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
            }, seguir({ CLAU, RENATO })),
            salidas = {
                { cuando = { "muerto", "amigos", CLAU }, ir = "final_fallido" },
                { cuando = { "npc_cerca", "amigos", "mirador", 25 }, ir = "escolta" },
                { cuando = { "horas", 72 }, ir = "final_fallido" },
            },
        },
        escolta = {
            pista = "Llevar a Claudio Clau y a Renaaaaaato vivos a la base de Sous.",
            objetivo = "base",
            al_entrar = juntar(seguir({ CLAU, RENATO }), {
                { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
                { "decir", grupo = "yo", rol = "cristian", texto = "Yo subo y los miro desde arriba, compadre. Nos vemos en la base." },
                { "corredores", lugar = "jugador", cantidad = { 2, 3 }, min = 25, max = 40, retraso = 0.4, si = { "eleccion", "rush" } },
                { "oleada", lugar = "jugador", cantidad = { 4, 6 }, min = 25, max = 40, retraso = 0.6 },
            }),
            salidas = {
                { cuando = { "muerto", "amigos", CLAU }, ir = "final_fallido" },
                { cuando = { "npc_cerca", "amigos", "base", 18 }, ir = "final_hecho" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
    }, CRISTIAN_FIN),
})

-- ===========================================================================
-- Jorge Hasag: La cabana del cerro
-- ===========================================================================
Narrador.Charlas.hs2_jorge = {
    { "jorge", "Manito, esto no estaba en el presupuesto. Nada de esto estaba en el presupuesto." },
    { "jorge", "Primo, cubreme! ... No asi, de lejos, compadre. De lejos." },
    { "cristian", "Primo, te cubro! Siempre te cubro. Es supervivencia, compadre." },
    { "cristian", "Esta es la cabana, compadre! Aca veniamos en invierno con el primo. A mirar la zona." },
    { LUENGO, "Nadie entra a mi cocina sin delantal, wn! Ni los muertos!" },
    { LUENGO, "Les cocine tres dias a estos giles. Y ni las gracias. Ni las gracias, wn." },
    { CLAU, "Luengo, suelta la olla y pelea! ... Ya, pelea con la olla, da lo mismo." },
    { "benjamin", "Bro, se cubren entre ellos todo el rato. Lo anoto. Neutral, eso si.", si = { "var", "chaperon", true } },
    { "benjamin", "Una cabana chica, una chimenea, una cama. UNA cama, hermano. Yo no digo nada.", si = { "var", "chaperon", true } },
    { "jorge", "Matric, si vuelves a decir 'una cama', te descuento la cena, sangre.", si = { "var", "chaperon", true } },
}

local JORGE_FIN = finales("jorge", {
    hecho = juntar(soltar({ LUENGO, CLAU }), {
        { "decir", grupo = "pide", rol = "jorge", texto = "Cuadra todo, manito. Tu inversion rindio. Toma: el Recorte de Presupuesto. Corta gastos, corta cuellos. Lo afile yo, sangre." },
        { "decir_residente", rol = "benjamin", retraso = 0.04, si = { "var", "chaperon", true }, texto = "Encontre una lista en la cabana, bro. 'Un saco de dormir doble'. DOBLE. No digo nada. Lo dejo ahi, en la mesa, pa que lo vean todos." },
        { "decir_residente", rol = "benjamin", retraso = 0.04, si = { "no", { "var", "chaperon", true } }, texto = "Volvieron de la cabana con la misma cara de siempre, bro. La cara de los que comparten frazada." },
        { "decir_residente", rol = "cristian", retraso = 0.08, texto = "Es por el calor, compadre! Es ciencia! Akkakaka." },
        { "decir", grupo = "amigos", rol = LUENGO, retraso = 0.1, texto = "Desde hoy el que cocina en Sous soy yo, wn. Y Matric lava." },
        { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
        { "retirar_lejos", grupo = "amigos", lugar = "base", radio = 30, retraso = 1 },
    }),
    fallido = juntar(soltar({ LUENGO, CLAU }), {
        { "decir", grupo = "pide", rol = "jorge", texto = "Perdimos al Luengo, manito. Esa cuenta no la voy a poder cuadrar nunca." },
    }),
    diario_hecho = "Fuimos a la cabana del cerro de los primos. Habia bandidos con el Fucking Luengo cocinandoles. Lo sacamos, y al Clau. Hasag me regalo El Recorte de Presupuesto. Matric sigue hablando de la cabana.",
    diario_fallido = "En la cabana del cerro murio el Fucking Luengo. Hasag no hablo en todo el camino de vuelta. Cristonks tampoco.",
    diario_postergada = "Hasag me propuso ir a la cabana del cerro con su primo. Le dije que otro dia. Matric se rio desde el fondo.",
    diario_murio = "Hasag murio antes de volver a su cabana del cerro. Cristonks no ha querido subir desde entonces.",
})

-- La lista vieja de Hasag que queda en la cabana.
local LISTA_HASAG = "Temporada de nieve con el primo:\n- 12 latas\n- fosforos\n- 2 sacos de dormir... no, 1 saco de dormir doble (ahorra calor, es ciencia)\n- antiparras de repuesto pa Cristian\nCuadrar con Cristian. NO CONTARLE A MATRIC."

registrar({
    id = HS.idDe("jorge"),
    titulo = "La cabana del cerro",
    titulo_menu = "Historia de Sous: Jorge Hasag, la cabana del cerro",
    requiere_alife = true, automatico = false, tono = "vida", intensidad = 2,
    inicio = "llamado",
    etapas = con({
        llamado = llamado("jorge", "Jorge Hasag te anda buscando en la base de Sous. Dice que tiene una propuesta de negocio.",
            "Hasag me mando a llamar a la base de Sous. Tiene una propuesta de negocio, dijo. Con el, todo es una propuesta de negocio."),
        pedido = pedido("jorge", "Hasag",
            { texto = "Manito, propuesta: antes de todo esto anote una cabana con despensa en el cerro. Pa temporadas de nieve con el primo, si... ya se como suena. El Fucking Luengo se fue pa alla hace dias y no volvio. El Clau fue a buscarlo y tampoco. Vamos? Va el primo tambien.",
              acciones = { { "decir_residente", rol = "benjamin", retraso = 0.03, texto = "Una cabana. En la nieve. Con el primo. Y lo cuenta asi, en voz alta, bro. Yo voy de chaperon." } } },
            { { id = "chaperon", texto = "Aceptar, y que Matric vaya de chaperon", ir = "viaje",
                dice = "Ya, que venga. Asi se le quita la duda de una vez, manito.",
                acciones = {
                    { "variable", nombre = "chaperon", valor = true },
                    { "decir_residente", rol = "benjamin", retraso = 0.03, texto = "Voy de observador, bro. Neutral. Totalmente neutral. Llevo cuaderno." },
                    { "lugar", id = "cabana", desde = "base", nombre = "la cabana del cerro", salas = { "bedroom", "livingroom", "kitchen" }, min = 500, max = 1300 },
                    { "lugar_cerca", id = "llegada", de = "cabana", distancia = 16 },
                    { "mapa_con_marcas", lugar = "cabana", titulo = "Mapa de Hasag: la cabana", texto = "Cabana (despensa). Inversion segura.",
                      marcas = { { lugar = "base", simbolo = "NarradorSous", texto = "Base de Sous", r = 0.75, g = 0.12, b = 0.05 } } },
                } },
              { id = "primos", texto = "Aceptar e ir solo con los primos", ir = "viaje",
                dice = "Buena, sangre. Menos gente, menos gasto.",
                acciones = {
                    { "decir_residente", rol = "benjamin", retraso = 0.03, texto = "Ya. Solos. Los primos. Y el. Bueno, por lo menos hay testigo, bro." },
                    { "lugar", id = "cabana", desde = "base", nombre = "la cabana del cerro", salas = { "bedroom", "livingroom", "kitchen" }, min = 500, max = 1300 },
                    { "lugar_cerca", id = "llegada", de = "cabana", distancia = 16 },
                    { "mapa_con_marcas", lugar = "cabana", titulo = "Mapa de Hasag: la cabana", texto = "Cabana (despensa). Inversion segura.",
                      marcas = { { lugar = "base", simbolo = "NarradorSous", texto = "Base de Sous", r = 0.75, g = 0.12, b = 0.05 } } },
                } } },
            "Ya manito, lo anoto como inversion a largo plazo. Pero no se demore mucho, que el Luengo no se cocina solo. Bueno, si."),
        viaje = {
            pista = "Ir a {lugar:cabana}. Los primos van adelante.",
            objetivo = "cabana",
            salidas = {
                { cuando = { "cerca", "cabana", 60 }, ir = "sitio" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
        sitio = {
            pista = "Sacar al Fucking Luengo y a Claudio Clau de {lugar:cabana}. Hay bandidos cuidando la despensa.",
            objetivo = "cabana",
            charla = { grupos = { "yo", "amigos" }, lista = "hs2_jorge", radio = 25, cada = 0.15 },
            al_entrar = {
                { "aviso", texto = "Sale humo de la chimenea y huele a comida. Alguien cocina adentro. Y alguien con armas cuida la puerta." },
                { "npcs", id = "yo", lugar = "llegada", radio = 50, modo = "guard", inmortales = true, postura = "friendly",
                  perfiles = { sous("jorge"), sous("cristian"), sous("benjamin") }, si = { "var", "chaperon", true } },
                { "npcs", id = "yo", lugar = "llegada", radio = 50, modo = "guard", inmortales = true, postura = "friendly",
                  perfiles = { sous("jorge"), sous("cristian") }, si = { "no", { "var", "chaperon", true } } },
                { "npcs", id = "amigos", lugar = "cabana", radio = 45, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { P.luengo, P.clau } },
                { "bandidos", id = "saqueadores", lugar = "cabana", radio = 55, modo = "guard", cantidad = { 2, 3 } },
                { "oleada", lugar = "cabana", radio = 50, cantidad = { 10, 14 }, min = 14, max = 30, retraso = 0.2 },
                { "nota", lugar = "cabana", radio = 40, titulo = "Lista vieja de Hasag", texto = LISTA_HASAG },
            },
            salidas = {
                { cuando = { "muerto", "amigos", LUENGO }, ir = "final_fallido" },
                { cuando = { { "todos_muertos", "saqueadores" }, { "grupo_listo", "amigos" } }, ir = "despensa" },
                { cuando = { { "grupo_listo", "amigos" }, { "horas", 3 } }, ir = "despensa" },
            },
        },
        despensa = {
            pista = "Decidir que pasa con la despensa de la cabana (clic derecho cerca de Luengo).",
            ancla = "cabana", ancla_grupo = "amigos", radio = 25,
            al_entrar = {
                { "decir", grupo = "amigos", rol = LUENGO, texto = "Gracias, wn. Estos llegaron hace tres dias y me tenian cocinandoles. Lo bueno: cocine harto. Lo malo: les gusto." },
                { "decir", grupo = "yo", rol = "jorge", retraso = 0.03, texto = "Manito, la despensa da pa Sous un mes. Pero el Luengo dice que la mitad es suya." },
                { "decir", grupo = "amigos", rol = LUENGO, retraso = 0.06, texto = "La mitad es mia. Yo la cocine, wn." },
            },
            opciones = {
                { id = "parejo", texto = "Repartir parejo con Luengo",
                  dice = { grupo = "yo", rol = "jorge", texto = "Parejo y nadie se queja. Asi se hacen los negocios, sangre." },
                  acciones = { { "recompensa", lugar = "cabana", radio = 40, items = { COMIDA[1], COMIDA[2], COMIDA[4] } } } },
                { id = "todo", texto = "Llevarse toda la despensa para Sous",
                  dice = { rol = LUENGO, texto = "Ya, llevensela. Pero el que cocina en Sous ahora soy yo, wn." },
                  acciones = { { "recompensa", lugar = "cabana", radio = 40, items = { COMIDA[1], COMIDA[2], COMIDA[3], COMIDA[4], COMIDA[5], COMIDA[1] } } } },
            },
            salidas = {
                { cuando = { "muerto", "amigos", LUENGO }, ir = "final_fallido" },
                { cuando = { "o", { "eleccion", "parejo" }, { "eleccion", "todo" } }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Llevar al Fucking Luengo y a Claudio Clau vivos a la base de Sous.",
            objetivo = "base",
            al_entrar = juntar(seguir({ LUENGO, CLAU }), {
                { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
                { "decir", grupo = "yo", rol = "cristian", texto = "Nosotros nos quedamos a cerrar la cabana, compadre. Despues bajamos. Juntos. Por seguridad." },
                { "oleada", lugar = "jugador", cantidad = { 6, 10 }, min = 25, max = 40, retraso = 0.5 },
                { "aviso", texto = "El Luengo trae una olla con comida caliente. El olor llega lejos.", retraso = 0.5 },
            }),
            salidas = {
                { cuando = { "muerto", "amigos", LUENGO }, ir = "final_fallido" },
                { cuando = { "npc_cerca", "amigos", "base", 18 }, ir = "final_hecho" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
    }, JORGE_FIN),
})

-- ===========================================================================
-- Cristobal Wertres: Los goles del Bicho
-- ===========================================================================
Narrador.Charlas.hs2_cristobal = {
    { "cristobal", "Siuuu! Ahi esta el generador, hermanito. Es hermoso, wn." },
    { "cristobal", "Con 1.96 los veo venir desde lejos, sangre. Vienen muchos. Muchos, wn." },
    { "david", "Yo anoto. Si nos morimos, que quede registro de que fue por un DVD." },
    { "david", "La dupla no se separa. Aunque la idea sea mala. Sobre todo si la idea es mala." },
    { RENATO, "Este taller es como de_nuke, wn. Puros pasillos y nadie se acuerda del mapa." },
    { RENATO, "El DVD lo tengo yo, Cristobal. Si me muero, el Bicho muere conmigo." },
    { CLAU, "Yo vine porque me prometieron empanadas. No hay empanadas, cierto?" },
}

local CRISTOBAL_FIN = finales("cristobal", {
    hecho = juntar(soltar({ CLAU, RENATO }), {
        { "decir", grupo = "pide", rol = "cristobal", texto = "SIUUUU! Prendio la tele, hermanito! Los goles del Bicho en la base, wn! Toma: el Siuuu de Wertres. Largo como yo y pesado como un tiro libre del Bicho." },
        { "decir_residente", rol = "david", retraso = 0.04, texto = "Lo anoto: hoy Sous fue feliz dos horas seguidas. Es un dato." },
        { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
        { "retirar_lejos", grupo = "amigos", lugar = "base", radio = 30, retraso = 1 },
    }),
    fallido = juntar(soltar({ CLAU, RENATO }), {
        { "decir", grupo = "pide", rol = "cristobal", texto = "Se murio el Renato, hermanito. Y con el, el DVD. No importa el DVD, wn. Importaba el." },
    }),
    diario_hecho = "Conseguimos el generador de Wertres. Esa noche Sous entero vio los goles de Cristiano en una tele vieja, gritando siuuu a cada rato. Wertres me regalo El Siuuu de Wertres.",
    diario_fallido = "El Renaaaaaato no volvio del taller. Wertres guardo el generador en un rincon y no lo ha vuelto a mirar.",
    diario_postergada = "Wertres queria un generador para ver los goles del Bicho. Le dije que ahora no. Me dijo 'tranquilo, hermanito'. Se nota que igual le dolio, wn.",
    diario_murio = "Wertres murio sin ver sus goles del Bicho. El DVD lo sigue teniendo el Renato.",
})

registrar({
    id = HS.idDe("cristobal"),
    titulo = "Los goles del Bicho",
    titulo_menu = "Historia de Sous: Cristobal Wertres, los goles del Bicho",
    requiere_alife = true, automatico = false, tono = "vida", intensidad = 2,
    inicio = "llamado",
    etapas = con({
        llamado = llamado("cristobal", "Cristobal Wertres te anda buscando en la base de Sous. Dice que tiene un sueno.",
            "Wertres me mando a llamar. Dice que tiene un sueno. Con 1.96, sus suenos son grandes."),
        pedido = pedido("cristobal", "Wertres",
            { texto = "Hermanito, tengo un sueno, wn: un generador, una tele y el DVD con los goles del Bicho que guarda el Renato. El Clau dice que hay un generador entero en un taller. El Renato y el Clau ya estan alla, cuidandolo. Me acompanas, sangre?",
              acciones = { { "decir_residente", rol = "david", retraso = 0.03, texto = "Prender un generador es tocar la campana de la cena. Pero voy igual. La dupla no se separa." } } },
            { { id = "aceptar", texto = "Ir con Wertres y Shinbo por el generador", ir = "viaje",
                dice = "Siuuu! Gracias, hermanito. Nos adelantamos con el Shinbo, wn.",
                acciones = {
                    { "lugar", id = "taller", desde = "base", salas = { "garagestorage", "mechanic", "warehouse", "toolstore", "storageunit" }, respaldo = CASAS, min = 250, max = 1000 },
                    { "lugar_cerca", id = "llegada", de = "taller", distancia = 14 },
                    { "mapa_con_marcas", lugar = "taller", titulo = "Mapa de Wertres: el generador", texto = "Generador (siuuu)",
                      marcas = { { lugar = "base", simbolo = "NarradorSous", texto = "Base de Sous", r = 0.75, g = 0.12, b = 0.05 } } },
                    { "diario", texto = "Wertres quiere un generador para ver los goles de Cristiano. Hay uno en {lugar:taller}, cuidado por el Clau y el Renaaaaaato." },
                } } },
            "Tranquilo, hermanito. El Bicho espera. Bueno, el no espera a nadie, pero yo si, wn."),
        viaje = {
            pista = "Ir a {lugar:taller}, donde esta el generador. Wertres y Shinbo se adelantaron.",
            objetivo = "taller",
            salidas = {
                { cuando = { "cerca", "taller", 60 }, ir = "sitio" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
        sitio = {
            pista = "Limpiar {lugar:taller} y juntar las piezas del generador. Que no muera el Renato.",
            objetivo = "taller",
            charla = { grupos = { "yo", "amigos" }, lista = "hs2_cristobal", radio = 25, cada = 0.15 },
            al_entrar = {
                { "aviso", texto = "El taller esta lleno de muertos. Al fondo, alguien grita 'cubranme, estoy plantando la bomba'. Es el Renato." },
                { "npcs", id = "yo", lugar = "llegada", radio = 50, modo = "guard", inmortales = true, postura = "friendly",
                  perfiles = { sous("cristobal"), sous("david") } },
                { "npcs", id = "amigos", lugar = "taller", radio = 45, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { P.clau, P.renato } },
                { "oleada", lugar = "taller", radio = 50, cantidad = { 12, 16 }, min = 12, max = 30 },
                { "objeto", id = "piezas", lugar = "taller", radio = 40, tipo = { "Base.ElectronicsScrap" }, nombre = "Piezas del generador de Wertres" },
            },
            salidas = {
                { cuando = { "muerto", "amigos", RENATO }, ir = "final_fallido" },
                { cuando = { { "alguien_tiene", "piezas" }, { "grupo_listo", "amigos" } }, ir = "prueba" },
            },
        },
        prueba = {
            pista = "Decidir con Wertres que hacer con el generador (clic derecho cerca de el).",
            ancla = "taller", ancla_grupo = "yo", radio = 25,
            al_entrar = {
                { "decir", grupo = "yo", rol = "cristobal", texto = "Decision de ingeniero, hermanito: lo probamos aca, a ver si prende? O lo llevamos asi nomas y confiamos, wn?" },
                { "decir", grupo = "yo", rol = "david", retraso = 0.03, texto = "Si lo prenden aca, todo lo que tiene oidos viene. Lo anoto igual." },
            },
            opciones = {
                { id = "probar", texto = "Prenderlo aca para probarlo",
                  dice = { rol = "cristobal", texto = "Siuuuu! Prendio, wn! ... Y ahi vienen todos. Todos, hermanito." },
                  acciones = {
                      { "variable", nombre = "probado", valor = true },
                      { "ruido", lugar = "taller", radio = 120, volumen = 100, veces = 3 },
                      { "oleada", lugar = "taller", radio = 50, cantidad = 20, por_jugador = 8, fija = true, caminantes = true,
                        min = 18, max = 40, meta = "meta", meta_frac = 0.75, retraso = 0.05 },
                  } },
                { id = "llevar", texto = "Llevarlo sin probar",
                  dice = { rol = "cristobal", texto = "Ya, confiemos en la ingenieria, sangre. Y en Cristiano." } },
            },
            salidas = {
                { cuando = { "muerto", "amigos", RENATO }, ir = "final_fallido" },
                { cuando = { "eleccion", "probar" }, ir = "defensa" },
                { cuando = { "eleccion", "llevar" }, ir = "escolta" },
            },
        },
        defensa = {
            pista = "Aguantar en {lugar:taller} con el generador rugiendo: van {bajas:taller} de {meta}.",
            objetivo = "taller",
            charla = { grupos = { "yo", "amigos" }, lista = "hs2_cristobal", radio = 25, cada = 0.1 },
            salidas = {
                { cuando = { "muerto", "amigos", RENATO }, ir = "final_fallido" },
                { cuando = { "o", { "bajas_en", "taller", "var:meta", 60 }, { { "horas", 1.2 }, { "sin_zombis", "taller", 15 } } }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Llevar a Claudio Clau y a Renaaaaaato (con el DVD) vivos a la base de Sous.",
            objetivo = "base",
            al_entrar = juntar(seguir({ CLAU, RENATO }), {
                { "retirar_lejos", grupo = "yo", lugar = "llegada", radio = 50 },
                { "decir", grupo = "yo", rol = "cristobal", texto = "Nosotros llevamos el generador por atras, hermanito. Tu cuida a los cabros, wn." },
                { "oleada", lugar = "jugador", cantidad = { 5, 8 }, min = 25, max = 40, retraso = 0.5 },
            }),
            salidas = {
                { cuando = { "muerto", "amigos", RENATO }, ir = "final_fallido" },
                { cuando = { { "npc_cerca", "amigos", "base", 18 }, { "var", "probado", true } }, ir = "final_hecho" },
                { cuando = { "npc_cerca", "amigos", "base", 18 }, ir = "no_prende" },
                { cuando = { "horas", 96 }, ir = "final_fallido" },
            },
        },
        no_prende = {
            pista = "Traer una bateria desde {lugar:repuesto} para el generador de Wertres.",
            objetivo = "repuesto",
            al_entrar = juntar(soltar({ CLAU, RENATO }), {
                { "decir", grupo = "pide", rol = "cristobal", texto = "Wn. No prende. Le falta una bateria, hermanito. Te juro que en la teoria funcionaba." },
                { "decir", grupo = "amigos", rol = RENATO, retraso = 0.03, texto = "Te dije que lo probaras. Esto es como comprar la AWP sin plata pa la armadura." },
                { "retirar_lejos", grupo = "amigos", lugar = "base", radio = 30, retraso = 1 },
                { "lugar", id = "repuesto", desde = "base", salas = { "garagestorage", "mechanic", "gasstore" }, respaldo = CASAS, min = 150, max = 600 },
                { "mapa", lugar = "repuesto", titulo = "Mapa de Wertres: la bateria" },
                { "oleada", lugar = "repuesto", radio = 50, cantidad = { 10, 14 } },
                { "objeto", id = "bateria", lugar = "repuesto", radio = 40, tipo = { "Base.CarBattery1", "Base.Battery" }, nombre = "Bateria para el generador de Wertres" },
            }),
            salidas = {
                { cuando = { "alguien_tiene", "bateria" }, ir = "entregar" },
                { cuando = { "muerto", "pide", "cristobal" }, ir = "final_murio" },
            },
        },
        entregar = {
            pista = "Llevarle la bateria a Wertres en la base de Sous.",
            ancla = "base", ancla_grupo = "pide", radio = 40,
            opciones = { { id = "entregar", texto = "Darle la bateria a Wertres", requiere = { "objeto", "bateria" }, falta = "No llevas la bateria." } },
            salidas = {
                { cuando = { "eleccion", "entregar" }, ir = "final_hecho" },
                { cuando = { "muerto", "pide", "cristobal" }, ir = "final_murio" },
            },
        },
    }, CRISTOBAL_FIN),
})

-- ---------------------------------------------------------------------------
-- Diario (lo que el personaje escribe en cada etapa)
-- ---------------------------------------------------------------------------
local Lore = Narrador.Lore
if Lore ~= nil and Lore.arcos ~= nil then
    Lore.arcos[HS.idDe("hanz")] = { etapas = {
        viaje = "Walita salio antes que yo a buscar a su primo, el Waton Ju, encerrado en {lugar:tienda} con el Clau. Me conto que vivieron juntos en Iquique hasta los doce. Despues el se fue a Arica, a su taller. Me lo repitio tres veces: nunca vivio en Antofagasta.",
        sitio = "Llegue a {lugar:tienda}. Muertos golpeando las vitrinas y, adentro, alguien gritando el nombre de Hanz. Walita ya estaba repartiendo palos.",
        desvio = "El Waton Ju no se va sin su computador. Tiene una cuenta de PXG en nivel 69. Por eso vamos a {lugar:casa_waton}, con saqueadores adentro. Asi es la familia.",
        escolta = "Llevo de vuelta a la base al Waton Ju y al Clau. El Waton habla fuerte. Muy fuerte.",
    } }
    Lore.arcos[HS.idDe("cristian")] = { etapas = {
        viaje = "Cristonks vio tres bengalas rojas desde el cerro, sobre {lugar:campamento}. El Clau y el Renaaaaaato estan ahi. Matric pregunto por que el Hasag no venia. Nadie le contesto.",
        sitio = "Humo rojo y muertos mirando hacia arriba en {lugar:campamento}. El Renato gritaba algo de la B.",
        rodeo = "Le hicimos caso al piloto: rodear por el cerro, pasando por {lugar:mirador}. Mas largo. Mas silencioso.",
        escolta = "Llevo al Clau y al Renato a la base de Sous. Cristonks subio al cerro para mirarnos desde arriba.",
    } }
    Lore.arcos[HS.idDe("jorge")] = { etapas = {
        viaje = "Vamos con los primos a {lugar:cabana}, la cabana del cerro donde pasaban la temporada de nieve. Ahi deberian estar el Fucking Luengo y el Clau. Matric tiene opiniones sobre esa cabana.",
        sitio = "Hay bandidos en la cabana y el Luengo les esta cocinando. Huele bien. Eso es lo peor.",
        despensa = "La despensa de la cabana da para un mes. El Luengo dice que la mitad es suya porque la cocino. Hasag saco la calculadora mental.",
        escolta = "Llevo al Luengo y al Clau a la base. Los primos se quedaron a cerrar la cabana. Juntos. Por seguridad, dijeron.",
    } }
    Lore.arcos[HS.idDe("cristobal")] = { etapas = {
        viaje = "Wertres quiere ver los goles de Cristiano en una tele, con un generador de {lugar:taller}. Shinbo dice que es mala idea y va igual. La dupla no se separa.",
        sitio = "El taller de {lugar:taller} esta lleno de muertos. El Renato grita que esta plantando la bomba. No hay ninguna bomba.",
        defensa = "Wertres prendio el generador para probarlo. Prendio. Y todo lo que tenia oidos en kilometros vino a ver.",
        no_prende = "El generador no prendio en la base. Falta una bateria. Hay que ir a buscarla a {lugar:repuesto}. Renato dice que se lo advirtio.",
    } }
end

return HS
