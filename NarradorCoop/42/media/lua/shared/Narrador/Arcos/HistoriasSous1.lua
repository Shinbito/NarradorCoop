-- Modo historia de Sous (1 de 2): Martin Akagami, Martin Zent, Benjamin Matric, David Shinbo
-- y Bastian Tati. Cada uno tiene su historia secundaria; si termina bien, te da su arma
-- legendaria con nombre propio (accion "arma_personaje", en server/Narrador/NarradorHistoriasSous1.lua).
--
--   Akagami  "La luz de Sous":           piezas de un generador (con Clau y Renato) -> para que es
--                                        la luz -> el generador atrae una horda a la base.
--                                        Premio: La Lista Negra de Akagami (escopeta de dos canones).
--   Zent     "La Awp de SOUS":           el rifle con mira de la armeria (con Clau y Renato) ->
--                                        prestarselo o no a Renato -> (horda por el tiro).
--                                        Premio: La Awp de SOUS (rifle de caza) y el Palo de Ekko.
--   Matric   "El expediente de los primos": el campamento "del cerro" de Cristonks y Hasag (con
--                                        Clau y Luengo) -> leer o no la bitacora -> horda ->
--                                        que le cuentas a Matric. Premio: La Mancuerna del Amor.
--   Shinbo   "Trabajo de campo":         observar a un grupo que roba comida (con Clau y Waton) ->
--                                        hablar o atacar -> (horda juntos). Premio: La Variable
--                                        Dependiente (revolver Magnum).
--   Tati     "El partido con facha":     camisetas para el partido (con Clau y Luengo) -> la
--                                        jugada -> la horda que atrajeron los gritos.
--                                        Premio: El Chamullo de Tati (palo de golf).
--
-- Se lanzan solas (ver el servidor), con Sous aliado, de a una y con horas entre una y otra.
-- Memorias: hsous_<rol> = hecho, fallido o murio; hsous_primos (lo que le dijiste a Matric).
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"
require "Narrador/Arcos/Sous"
require "Narrador/Arcos/SousAmigos"

Narrador = Narrador or {}
local H = Narrador.HistoriasSous1 or {}
Narrador.HistoriasSous1 = H
local SA = Narrador.SousAmigos or {}

H.ORDEN = { "martin_a", "martin_z", "benjamin", "david", "bastian" }
H.NOMBRES = {
    martin_a = "Martin Akagami", martin_z = "Martin Zent", benjamin = "Benjamin Matric",
    david = "David Shinbo", bastian = "Bastian Tati",
}

function H.idDe(rol) return "hsous_" .. rol end

-- Armas de cada uno: tipo (alternativas), nombre propio, municion y extras (sin marcar).
H.ARMAS = {
    martin_a = {
        { tipo = { "Base.DoubleBarrelShotgun", "Base.Shotgun" }, nombre = "La Lista Negra de Akagami",
          municion = { { "Base.ShotgunShellsBox", "Base.ShotgunShells" }, { "Base.ShotgunShellsBox", "Base.ShotgunShells" } } },
    },
    martin_z = {
        { tipo = { "Base.HuntingRifle" }, nombre = "La Awp de SOUS",
          municion = { { "Base.308Box", "Base.308Bullets" }, { "Base.308Box", "Base.308Bullets" } },
          extras = { { "Base.x8Scope", "Base.x4Scope" } } },
        { tipo = { "Narrador.PaloEkko", "Base.BaseballBat" }, nombre = "Palo de Ekko" },
    },
    benjamin = {
        { tipo = { "Base.DumbBell" }, nombre = "La Mancuerna del Amor" },
    },
    david = {
        { tipo = { "Base.Revolver_Long", "Base.Revolver" }, nombre = "La Variable Dependiente",
          municion = { { "Base.Bullets44Box", "Base.Bullets44" }, { "Base.Bullets44Box", "Base.Bullets44" } } },
    },
    bastian = {
        { tipo = { "Base.Golfclub" }, nombre = "El Chamullo de Tati" },
    },
}

-- ---------------------------------------------------------------------------
-- Amigos de Sous (Arcos/SousAmigos.lua)
-- ---------------------------------------------------------------------------
local function rolAmigo(clave)
    local p = SA.PERFILES ~= nil and SA.PERFILES[clave] or nil
    return (p ~= nil and p[1] ~= nil and p[1][1]) or clave
end
local CLAU, RENATO, LUENGO, WATON = rolAmigo("clau"), rolAmigo("renato"), rolAmigo("luengo"), rolAmigo("waton")

local FACCION_AMIGOS = { "faccion", id = SA.FACCION or "narrador_sous_amigos", postura = "friendly" }

-- Los amigos esperan en el lugar y lo defienden (no te siguen: asi no quedan botados lejos).
local function amigos(lugar, claves)
    local perfiles, nombres = {}, {}
    for _, clave in ipairs(claves) do
        for _, par in ipairs(SA.PERFILES ~= nil and SA.PERFILES[clave] or {}) do
            perfiles[#perfiles + 1] = { par[1], par[2] }
            local n = SA.nombres ~= nil and (SA.nombres[par[1]] or SA.nombres[clave]) or nil
            if n ~= nil then nombres[par[1]] = { n[1], n[2] } end
        end
    end
    return { "npcs", id = "amigos", lugar = lugar, radio = 70, no_mas_cerca = 8, modo = "guard", postura = "friendly",
        radio_grupo = 5, correa = 18, inmortales = true, perfiles = perfiles, nombres = nombres }
end

local CASAS = { "livingroom", "kitchen", "bedroom" }

-- ---------------------------------------------------------------------------
-- Charlas
-- ---------------------------------------------------------------------------
Narrador.Charlas = Narrador.Charlas or {}

-- Lo que dicen los amigos en cualquier historia.
Narrador.Charlas.hsous_amigos = {
    { CLAU, "Claudio Clau, a la orden. Chico pero rapido, compadre." },
    { CLAU, "Donde vaya Sous, voy yo. Aunque no me inviten. Sobre todo si no me invitan." },
    { CLAU, "Estos jeans no son pa correr, wn. Pero corro igual." },
    { CLAU, "Yo no digo nada, pero los primos se fueron otra vez a la nieve. Juntitos." },
    { CLAU, "El Matric me pidio que anotara cuantas veces suben los primos al cerro. Llevo once." },
    { RENATO, "Esto es como Dust 2, wn. Tu vas por A, yo me quedo en el medio. Rush B no, por favor." },
    { RENATO, "Si tuviera una AWP no me estaria escondiendo detras tuyo, compadre." },
    { RENATO, "Me falta un PC y un mouse. Con eso arreglo el fin del mundo. O por lo menos me olvido." },
    { RENATO, "Renaaaaaato. Con seis a. Siempre con seis a." },
    { LUENGO, "Yo no juego a nada, compadre. Yo cocino. Ustedes juegan y despues comen." },
    { LUENGO, "Traje pebre. No pregunten de donde saque tomates." },
    { LUENGO, "Los muertos huelen peor que mi cocina un lunes. Y eso es harto decir." },
    { WATON, "Waton Ju, primo del Walita. De Iquique, como los buenos." },
    { WATON, "Si, si, nunca llegue a nivel 70 pa jugar DZ en PXG. Ya se. Todos lo saben." },
    { WATON, "El Hanz se fue a Arica y yo me quede jugando PXG. Mira como termino todo, compadre." },
}

Narrador.Charlas.hsous_horda = {
    { CLAU, "Vienen por todos lados, compadre! Espalda con espalda!" },
    { CLAU, "Tranquilo, tranquilo. Bueno, no tan tranquilo. CORRE." },
    { RENATO, "Eco, eco! Son como cuarenta! Necesito apoyo en B!" },
    { RENATO, "Ojala esto tuviera respawn, wn." },
    { LUENGO, "Si sobrevivimos, hago completos. Si no, tambien, pero en el cielo." },
    { WATON, "En Iquique por lo menos los zombis eran de mentira, compadre!" },
}

-- ---------------------------------------------------------------------------
-- Partes comunes de cada historia
-- ---------------------------------------------------------------------------

-- spec: rol, titulo, llamado (lo que dice al llamarte), pedido (pista), aceptar (texto de la
-- opcion), acepta / despues (lo que contesta), diario, primera (etapa), final (diario),
-- final_dice (lo que dice al darte el arma), etapas (las propias).
local function historia(spec)
    local rol, nombre = spec.rol, H.NOMBRES[spec.rol]
    local et = spec.etapas
    et.pedido = {
        pista = "Hablar con " .. nombre .. " en la base de Sous (clic derecho cerca de el).",
        ancla = "base", ancla_grupo = "pide", radio = 40, mapa = false,
        al_entrar = {
            { "prestar_residente", residente = "sous", rol = rol, grupo = "pide" },
            { "lugar_memoria", id = "base", clave = "base_sous", salas = { "farmstorage", "barn", "warehouse" }, respaldo = CASAS },
            { "decir", grupo = "pide", rol = rol, texto = spec.llamado },
            { "aviso", texto = nombre .. " te hace senas desde la base de Sous: quiere hablar contigo." },
        },
        opciones = {
            { id = "aceptar", texto = spec.aceptar, dice = { rol = rol, texto = spec.acepta },
              diario = spec.diario },
            { id = "despues", texto = "Ahora no", dice = { rol = rol, texto = spec.despues } },
        },
        salidas = {
            { cuando = { "muerto", "pide", rol }, ir = "final_murio" },
            { cuando = { "eleccion", "aceptar" }, ir = spec.primera },
            { cuando = { "eleccion", "despues" }, ir = "final_despues" },
            { cuando = { "horas", 48 }, ir = "final_despues" },
        },
    }
    local alFinal = {
        { "decir", grupo = "pide", rol = rol, texto = spec.final_dice },
        { "arma_personaje", rol = rol },
        { "memoria", clave = "hsous_" .. rol, valor = "hecho" },
        { "retirar_lejos", grupo = "amigos", lugar = "amigos_punto", radio = 60, retraso = 0.2 },
    }
    for _, d in ipairs(spec.final) do alFinal[#alFinal + 1] = d end
    et.final_hecho = { final = true, al_entrar = alFinal }
    et.final_despues = {
        final = true,
        al_entrar = { { "diario", texto = nombre .. " se quedo con las ganas de contarme su plan. Otro dia sera." } },
    }
    et.final_fallido = {
        final = true,
        al_entrar = {
            { "memoria", clave = "hsous_" .. rol, valor = "fallido" },
            { "retirar_lejos", grupo = "amigos", lugar = "amigos_punto", radio = 60, retraso = 0.2 },
            { "diario", texto = spec.fallido or ("Lo de " .. nombre .. " quedo a medias. No me lo volvio a pedir.") },
        },
    }
    et.final_murio = {
        final = true,
        al_entrar = {
            { "memoria", clave = "hsous_" .. rol, valor = "murio" },
            { "retirar_lejos", grupo = "amigos", lugar = "amigos_punto", radio = 60, retraso = 0.2 },
            { "diario", texto = nombre .. " murio antes de que termine lo que me pidio." },
        },
    }
    Narrador.Defs.registrar({
        id = H.idDe(rol),
        titulo = spec.titulo,
        titulo_menu = "Sous: " .. spec.titulo .. " (" .. nombre .. ")",
        requiere_alife = true,
        automatico = false,
        historia_sous = rol,
        inicio = "pedido",
        etapas = et,
    })
end

-- Salidas de siempre en las etapas del medio (si muere el que pidio, o si pasa mucho tiempo).
local function salidas(lista, horas)
    table.insert(lista, 1, { cuando = { "muerto", "pide", "__rol__" }, ir = "final_murio" })
    lista[#lista + 1] = { cuando = { "horas", horas or 120 }, ir = "final_fallido" }
    return lista
end
local function conRol(etapas, rol)
    for _, e in pairs(etapas) do
        for _, s in ipairs(e.salidas or {}) do
            if type(s.cuando) == "table" and s.cuando[1] == "muerto" and s.cuando[3] == "__rol__" then s.cuando[3] = rol end
        end
    end
    return etapas
end

-- ===========================================================================
-- Martin Akagami: La luz de Sous
-- ===========================================================================
Narrador.Charlas.hsous_aka = {
    { CLAU, "El Aka me dio una lista. Punto uno: no morir. Punto dos: traer las piezas. El orden importa, dijo." },
    { RENATO, "Con un generador prendo un PC. Con un PC armo una LAN. Con una LAN somos felices, wn." },
    { RENATO, "El Aka juega LoL, yo Counter. Igual nos respetamos. Mas o menos." },
    { CLAU, "Si prendemos la luz en la base, el Matric va a querer hacer carrete. Ya lo veo venir." },
}

historia({
    rol = "martin_a",
    titulo = "La luz de Sous",
    llamado = "Mi bro, ven un rato. Tengo una lista. Tres puntos. Todos importantes.",
    aceptar = "Escuchar la lista de Akagami",
    acepta = "Uno: la base necesita luz. Dos: se donde hay piezas de un generador. Tres: tu las vas a buscar, mi bro.",
    despues = "Ya. La lista no se va a ningun lado. Yo tampoco.",
    diario = "Martin Akagami tiene un plan en tres puntos para darle luz a la base de Sous. El punto tres soy yo.",
    primera = "piezas",
    final_dice = "Uno: la luz. Dos: la horda. Tres: esto. La Lista Negra, mi bro. Dos canones, como Zent y Walita. Cuidala.",
    final = {
        { "diario", si = { "var", "luz", "counter" },
          texto = "Le arme la luz a Sous. Renato quiere un torneo de Counter; Akagami dijo que lo va a 'evaluar'. En su idioma eso es no. Me regalo La Lista Negra de Akagami." },
        { "diario", si = { "no", { "var", "luz", "counter" } },
          texto = "La base de Sous tiene luz. Akagami la miro prenderse como si fuera una cancha de noche. Me regalo La Lista Negra de Akagami." },
    },
    etapas = conRol({
        piezas = {
            pista = "Buscar las piezas del generador en {lugar:taller}. Te esperan Claudio Clau y Renaaaaaato.",
            charla = { grupo = "amigos", lista = { "hsous_amigos", "hsous_aka" }, radio = 15, cada = 0.3 },
            al_entrar = {
                { "lugar", id = "taller", desde = "base", salas = { "garagestorage", "warehouse", "factorystorage", "storageunit" },
                  respaldo = { "garagestorage", "kitchen" }, min = 250, max = 1000 },
                { "decir", grupo = "pide", rol = "martin_a",
                  texto = "Uno: las piezas estan en {lugar:taller}. Dos: el Clau y el Renato te esperan ahi. Tres: vuelve vivo, mi bro. El tres es el mas importante." },
                FACCION_AMIGOS,
                { "lugar_cerca", id = "amigos_punto", de = "taller", distancia = 14 },
                amigos("amigos_punto", { "clau", "renato" }),
                { "objeto", id = "piezas", lugar = "taller", radio = 50, tipo = { "Base.ElectronicsScrap", "Base.Wire" },
                  nombre = "Piezas del generador de Akagami" },
                { "oleada", lugar = "taller", radio = 50, cantidad = { 14, 20 } },
                { "nota", lugar = "taller", radio = 40, titulo = "Lista de Akagami",
                  texto = "1. Piezas. 2. No tocar nada mas. 3. Si Renato dice 'rush B', no hacerle caso." },
            },
            salidas = salidas({ { cuando = { "alguien_tiene", "piezas" }, ir = "para_que" } }),
        },
        para_que = {
            pista = "Renato tiene una opinion sobre la luz. Escucharlo (clic derecho cerca de el).",
            ancla = "taller", ancla_grupo = "amigos", radio = 45,
            al_entrar = {
                { "decir", grupo = "amigos", rol = RENATO,
                  texto = "Oe, oe. Antes de llevarle eso al Aka: con esa luz podriamos hacer un torneo de Counter. Uno chiquitito. Por la moral, wn." },
            },
            opciones = {
                { id = "base", texto = "La luz es para la base: guardia, radio y cocina",
                  dice = { rol = CLAU, texto = "Eso, compadre. Primero vivir, despues el Counter." },
                  acciones = { { "variable", nombre = "luz", valor = "base" } } },
                { id = "counter", texto = "Apoyar el torneo de Counter de Renato",
                  dice = { rol = RENATO, texto = "Eso es un compa! Le vamos a decir al Aka que es 'entrenamiento tactico'." },
                  acciones = { { "variable", nombre = "luz", valor = "counter" } } },
            },
            salidas = salidas({
                { cuando = { "o", { "eleccion", "base" }, { "eleccion", "counter" } }, ir = "volver" },
                { cuando = { "horas", 3 }, ir = "volver" },
            }),
        },
        volver = {
            pista = "Llevarle las piezas a Akagami en {lugar:base}.",
            ancla = "base", ancla_grupo = "pide", radio = 40, mapa = false,
            opciones = {
                { id = "entregar", texto = "Entregarle las piezas a Akagami", requiere = { "objeto", "piezas" },
                  falta = "No llevas las piezas.",
                  dice = { rol = "martin_a", texto = "Bien, mi bro. Uno: conectar. Dos: prender. Tres... eso suena muy fuerte." } },
            },
            salidas = salidas({ { cuando = { "eleccion", "entregar" }, ir = "ruido" } }, 168),
        },
        ruido = {
            pista = "El generador atrajo a medio pueblo. Defender la base de Sous en {lugar:base}.",
            mapa = false,
            al_entrar = {
                { "aviso", texto = "El generador arranca con un rugido y la base se ilumina entera. Todo el barrio lo escucho. Y todo el barrio viene." },
                { "ruido", lugar = "base", radio = 160, volumen = 100 },
                { "oleada", lugar = "base", radio = 55, cantidad = { 20, 30 }, retraso = 0.05 },
                { "decir", grupo = "pide", rol = "martin_a", retraso = 0.06,
                  texto = "Cabros, nueva lista! Uno: a la reja. Dos: nadie se queda atras. Tres: despues apagamos esa cuestion!" },
            },
            salidas = salidas({
                { cuando = { "bajas_en", "base", 18, 60 }, ir = "final_hecho" },
                { cuando = { "horas", 8 }, ir = "final_hecho" },
            }),
        },
    }, "martin_a"),
})

-- ===========================================================================
-- Martin Zent: La Awp de SOUS
-- ===========================================================================
Narrador.Charlas.hsous_zent = {
    { RENATO, "Es una AWP, wn. Una AWP de verdad. Bueno, un rifle de caza. Pero en mi corazon es una AWP." },
    { RENATO, "El Zent dijo 'rifle con mira'. Yo escuche 'AWP'. Somos distintos." },
    { CLAU, "El Zent me dijo: 'probabilidad de que vuelvas: decente'. Es lo mas carinoso que me ha dicho." },
    { CLAU, "Dicen que el Zent tenia un cuchillo que no prestaba ni a la mama." },
    { RENATO, "Si me la prestas un ratito te juro que no disparo. Bueno, un tiro. Uno." },
}

historia({
    rol = "martin_z",
    titulo = "La Awp de SOUS",
    llamado = "Oye. Ven. No es nada. Bueno, es algo. No le digas a Akagami que te pedi algo.",
    aceptar = "Preguntarle a Zent que necesita",
    acepta = "Bien. Te explico una vez. Hice calculos: hay un rifle con mira en buen estado cerca. Sous lo necesita. Yo lo quiero.",
    despues = "Ya. Probabilidad de que vuelvas a preguntar: alta. Te espero.",
    diario = "Martin Zent hizo calculos: hay un rifle con mira en buen estado cerca de la base. Me pidio ir a buscarlo, a su manera: sin pedirlo.",
    primera = "armeria",
    final_dice = "La Awp de SOUS. Renato le puso el nombre, yo no. Y esto: el Palo de Ekko. Me lo tallo Walita pa un cosplay que nunca use. Dicen que retrocede el tiempo. No. Pero pega.",
    final = {
        { "diario", si = { "var", "prestada", true },
          texto = "Le lleve el rifle a Zent despues de que Renato lo 'probara' y nos cayera medio pueblo encima. Zent me dio La Awp de SOUS y el Palo de Ekko. Dijo que los regalaba 'por eficiencia'. Yo se que no." },
        { "diario", si = { "no", { "var", "prestada", true } },
          texto = "Le lleve el rifle a Zent sin un rasguno. Me dio La Awp de SOUS y el Palo de Ekko, el que le tallo Walita. No me dio las gracias. Es su forma de darlas." },
    },
    etapas = conRol({
        armeria = {
            pista = "Recuperar el estuche del rifle en {lugar:armeria}. Te esperan Claudio Clau y Renaaaaaato.",
            charla = { grupo = "amigos", lista = { "hsous_amigos", "hsous_zent" }, radio = 15, cada = 0.3 },
            al_entrar = {
                { "lugar", id = "armeria", desde = "base", salas = { "gunstorestorage", "gunstore", "policestorage", "armystorage" },
                  respaldo = { "garagestorage", "warehouse" }, min = 350, max = 1300 },
                { "decir", grupo = "pide", rol = "martin_z",
                  texto = "En {lugar:armeria}. Renato dice que es 'la AWP'. Yo digo que es un rifle. El Clau va igual, porque el Clau va a todo." },
                FACCION_AMIGOS,
                { "lugar_cerca", id = "amigos_punto", de = "armeria", distancia = 16 },
                amigos("amigos_punto", { "clau", "renato" }),
                { "objeto", id = "estuche", lugar = "armeria", radio = 50, tipo = { "Base.Briefcase", "Base.Bag_DuffelBag" },
                  nombre = "Estuche del rifle (para Zent)" },
                { "oleada", lugar = "armeria", radio = 50, cantidad = { 16, 24 } },
                { "bandidos", id = "saqueadores", lugar = "armeria", radio = 60, modo = "guard", cantidad = { 2, 3 } },
            },
            salidas = salidas({ { cuando = { "alguien_tiene", "estuche" }, ir = "renato" } }),
        },
        renato = {
            pista = "Renato quiere 'probar' la Awp. Decidir (clic derecho cerca de el).",
            ancla = "armeria", ancla_grupo = "amigos", radio = 45,
            al_entrar = {
                { "decir", grupo = "amigos", rol = RENATO,
                  texto = "Compadre. Compadre. Prestamela un ratito. Un tiro. Desde el techo. Te juro que es pa probar la mira." },
            },
            opciones = {
                { id = "prestar", texto = "Prestarsela a Renato 'un ratito'",
                  dice = { rol = RENATO, texto = "AWP! AWP! Headshot, wn! ...le pegue a un letrero. Y creo que me escucharon." },
                  acciones = { { "variable", nombre = "prestada", valor = true } } },
                { id = "no", texto = "Llevarsela directo a Zent",
                  dice = { rol = RENATO, texto = "Ya, ya. Pero me debes una partida, wn. Una competitiva." } },
            },
            salidas = salidas({
                { cuando = { "eleccion", "prestar" }, ir = "el_tiro" },
                { cuando = { "eleccion", "no" }, ir = "volver" },
                { cuando = { "horas", 3 }, ir = "volver" },
            }),
        },
        el_tiro = {
            pista = "El tiro de Renato se escucho a kilometros. Aguantar en {lugar:armeria}.",
            charla = { grupo = "amigos", lista = "hsous_horda", radio = 15, cada = 0.15 },
            al_entrar = {
                { "aviso", texto = "Renato se sube al techo, apunta con toda la calma del mundo y le pega a un letrero. El ruido rebota por todo el pueblo." },
                { "ruido", lugar = "armeria", radio = 150, volumen = 100 },
                { "oleada", lugar = "armeria", radio = 55, cantidad = { 24, 34 }, retraso = 0.03 },
            },
            salidas = salidas({
                { cuando = { "bajas_en", "armeria", 20, 60 }, ir = "volver" },
                { cuando = { "horas", 6 }, ir = "volver" },
            }),
        },
        volver = {
            pista = "Llevarle el estuche del rifle a Zent en {lugar:base}.",
            ancla = "base", ancla_grupo = "pide", radio = 40, mapa = false,
            opciones = {
                { id = "entregar", texto = "Entregarle el estuche a Zent", requiere = { "objeto", "estuche" },
                  falta = "No llevas el estuche.",
                  dice = { rol = "martin_z", texto = "Lo trajiste. Con mira y todo. No voy a decir gracias. Espera." } },
            },
            salidas = salidas({ { cuando = { "eleccion", "entregar" }, ir = "final_hecho" } }, 168),
        },
    }, "martin_z"),
})

-- ===========================================================================
-- Benjamin Matric: El expediente de los primos
-- ===========================================================================
Narrador.Charlas.hsous_matric = {
    { CLAU, "El Matric me hizo firmar un papel. Dice 'Expediente Primos'. Tiene hasta foto." },
    { CLAU, "Yo los he visto volver del cerro con la misma bufanda. La MISMA, compadre." },
    { LUENGO, "Traje sopaipillas pa la investigacion. Una investigacion sin sopaipillas no es seria." },
    { LUENGO, "Yo cocino pa los primos cuando bajan del cerro. Siempre piden un solo plato. Pa compartir." },
    { CLAU, "Si encontramos algo, el Matric lo va a contar antes de la cena. Si no encontramos nada, tambien." },
    { LUENGO, "Una carpa pa dos en la nieve, dicen. Pa ahorrar calor. Yo con el calor hago pan, compadre." },
}

historia({
    rol = "benjamin",
    titulo = "El expediente de los primos",
    llamado = "Bro, bro, ven. Es serio. Bueno, medio serio. Es sobre los primos, hermano.",
    aceptar = "Escuchar la teoria de Matric",
    acepta = "Sabia que contigo se podia, bro. Los primos dicen que van a 'mirar la zona'. Yo quiero pruebas, hermano. PRUEBAS.",
    despues = "Ya, pero no les digas nada a los primos, bro. Ni una palabra. Bueno, despues te cuento igual.",
    diario = "Benjamin Matric esta convencido de que los primos Cristonks y Hasag 'se comen' y que por eso se van tanto juntos a la nieve. Me pidio pruebas.",
    primera = "cerro",
    fallido = "Nunca le lleve pruebas a Matric. Sigue mirando raro a los primos cada vez que suben al cerro.",
    final_dice = "Bro. Lo que sea que paso alla, te ganaste esto. La Mancuerna del Amor, hermano. Con ella entrene pa cada carrete. Desde que perdi la Mata Perras es lo que mas quiero.",
    final = {
        { "diario", si = { "var", "contado", "contado" },
          texto = "Le dije a Matric que los primos se comen. Antes de la cena lo sabia todo Sous. Cristonks dijo 'akkakaka'. Hasag no hablo en toda la noche. Matric me regalo La Mancuerna del Amor." },
        { "diario", si = { "var", "contado", "verdad" },
          texto = "Le conte a Matric la verdad: los primos suben al 'cerro' a prepararle el cumpleanos. Lloro un poco. Despues dijo que igual se comen. Me regalo La Mancuerna del Amor." },
        { "diario", si = { "var", "contado", "secreto" },
          texto = "Le dije a Matric que no encontre nada. Me miro como si yo tambien estuviera metido. Igual me regalo La Mancuerna del Amor." },
    },
    etapas = conRol({
        cerro = {
            pista = "Buscar pruebas en el campamento 'del cerro' de los primos, en {lugar:cerro}. Te esperan Claudio Clau y Fucking Luengo.",
            charla = { grupo = "amigos", lista = { "hsous_amigos", "hsous_matric" }, radio = 15, cada = 0.3 },
            al_entrar = {
                { "lugar", id = "cerro", desde = "base", salas = { "campingstorage", "campingstore", "farmstorage", "barn" },
                  respaldo = { "livingroom", "bedroom", "kitchen" }, min = 450, max = 1500 },
                { "decir", grupo = "pide", rol = "benjamin",
                  texto = "Los primos dicen que suben 'al cerro'. Kentucky no tiene cerros, bro. Lo mas parecido es {lugar:cerro}. Ahi tienen su campamento. El Clau y el Luengo te esperan, hermano. El Luengo lleva sopaipillas." },
                FACCION_AMIGOS,
                { "lugar_cerca", id = "amigos_punto", de = "cerro", distancia = 15 },
                amigos("amigos_punto", { "clau", "luengo" }),
                { "objeto", id = "bitacora", lugar = "cerro", radio = 50, tipo = { "Base.Notebook", "Base.Journal" },
                  nombre = "Bitacora del cerro (de los primos)" },
                { "nota", lugar = "cerro", radio = 40, titulo = "Lista de los primos",
                  texto = "Subir: carpa (UNA), saco de dormir (UNO, el grande), chocolate caliente x2. No decirle a Matric. NUNCA decirle a Matric." },
                { "oleada", lugar = "cerro", radio = 50, cantidad = { 14, 22 } },
            },
            salidas = salidas({ { cuando = { "alguien_tiene", "bitacora" }, ir = "leer" } }),
        },
        leer = {
            pista = "Tienes la bitacora de los primos. Decidir si leerla (clic derecho).",
            ancla = "cerro", radio = 45,
            opciones = {
                { id = "leer", texto = "Leer la bitacora",
                  respuesta = "Dia 12: faltan 9 dias pal cumpleanos de Matric. El primo insiste en una torta de proteina. Yo digo que no. Dia 13: hacia frio y el primo me abrazo. Esto no se lo cuento a nadie.",
                  acciones = { { "variable", nombre = "leida", valor = true } } },
                { id = "no_leer", texto = "No leerla: no es asunto tuyo",
                  dice = { rol = CLAU, texto = "Respeto, compadre. Pero el Matric te va a matar." } },
            },
            salidas = salidas({
                { cuando = { "o", { "eleccion", "leer" }, { "eleccion", "no_leer" } }, ir = "pasos" },
                { cuando = { "horas", 3 }, ir = "pasos" },
            }),
        },
        pasos = {
            pista = "Sobrevivir en el campamento de los primos, en {lugar:cerro}.",
            charla = { grupo = "amigos", lista = "hsous_horda", radio = 15, cada = 0.15 },
            al_entrar = {
                { "aviso", texto = "Mientras discuten que significa 'el primo me abrazo', se escuchan pasos. Muchos pasos. Ninguno de los primos." },
                { "oleada", lugar = "cerro", radio = 55, cantidad = { 20, 30 }, retraso = 0.02 },
            },
            salidas = salidas({
                { cuando = { "bajas_en", "cerro", 18, 60 }, ir = "volver" },
                { cuando = { "horas", 6 }, ir = "volver" },
            }),
        },
        volver = {
            pista = "Contarle a Matric lo que encontraste, en {lugar:base}.",
            ancla = "base", ancla_grupo = "pide", radio = 40, mapa = false,
            opciones = {
                { id = "contar", texto = "Mostrarle la bitacora: 'los primos se comen'", requiere = { "objeto", "bitacora" },
                  falta = "No llevas la bitacora.",
                  dice = { rol = "benjamin", texto = "LO SABIA, BRO! LO SABIA! Hermano, esto lo sabe todo Sous antes de la cena!" },
                  acciones = { { "variable", nombre = "contado", valor = "contado" },
                               { "memoria", clave = "hsous_primos", valor = "contado" } } },
                { id = "verdad", texto = "Contarle la verdad: le preparan el cumpleanos", si = { "var", "leida", true },
                  requiere = { "objeto", "bitacora" }, falta = "No llevas la bitacora.",
                  dice = { rol = "benjamin", texto = "Un cumpleanos? Pa mi? Bro... no llores, Benja, no llores. Igual se comen, eso no lo descarta." },
                  acciones = { { "variable", nombre = "contado", valor = "verdad" },
                               { "memoria", clave = "hsous_primos", valor = "verdad" } } },
                { id = "nada", texto = "Decirle que no encontraste nada",
                  dice = { rol = "benjamin", texto = "Nada? NADA? Esos primos son profesionales, hermano. Profesionales." },
                  acciones = { { "variable", nombre = "contado", valor = "secreto" },
                               { "memoria", clave = "hsous_primos", valor = "secreto" } } },
            },
            salidas = salidas({
                { cuando = { "o", { "eleccion", "contar" }, { "eleccion", "verdad" }, { "eleccion", "nada" } }, ir = "final_hecho" },
            }, 168),
        },
    }, "benjamin"),
})

-- ===========================================================================
-- David Shinbo: Trabajo de campo
-- ===========================================================================
Narrador.Charlas.hsous_shinbo = {
    { CLAU, "El Shinbo dice que hay que observar antes de juzgar. Yo observo y juzgo al mismo tiempo." },
    { WATON, "Oe, el Shinbo me hizo una entrevista. Duro una hora. Me pregunto por el PXG. Lloramos los dos." },
    { WATON, "En Iquique esto lo arreglabamos con un completo y conversando, compadre." },
    { CLAU, "El Shinbo tiene un cuaderno con todos nosotros. Yo salgo como 'sujeto C, chico, entusiasta'." },
}

historia({
    rol = "david",
    titulo = "Trabajo de campo",
    llamado = "Hola. Perdona. Tengo una... propuesta de investigacion. Es corta. Bueno, no tanto.",
    aceptar = "Escuchar la propuesta de Shinbo",
    acepta = "Gracias. Hay un grupo que nos roba comida. Todos dicen que son malos. Mi hipotesis es que tienen hambre. Quiero comprobarlo.",
    despues = "Esta bien. La hipotesis puede esperar. Ellos quizas no.",
    diario = "David Shinbo cree que el grupo que le roba comida a Sous no es malo, solo tiene hambre. Quiere que vaya a observarlos antes de hacer nada.",
    primera = "mirador",
    final_dice = "Toma. La Variable Dependiente. Todo lo que pase despues depende de como la uses. Es un chiste de metodologia. No importa.",
    final = {
        { "diario", si = { "var", "hipotesis", "confirmada" },
          texto = "La hipotesis de Shinbo era cierta: tenian hambre. Les di de comer y despues peleamos juntos contra la horda. Shinbo lo anoto todo y me regalo La Variable Dependiente." },
        { "diario", si = { "no", { "var", "hipotesis", "confirmada" } },
          texto = "No hubo conversacion con el grupo de la comida: hubo balas. Shinbo dijo que eso tambien es un dato. Lo anoto en silencio y me regalo La Variable Dependiente." },
    },
    etapas = conRol({
        mirador = {
            pista = "Ir al mirador cerca de {lugar:campamento}. Te esperan Claudio Clau y Waton Ju.",
            charla = { grupo = "amigos", lista = { "hsous_amigos", "hsous_shinbo" }, radio = 15, cada = 0.3 },
            al_entrar = {
                { "lugar", id = "campamento", desde = "base", salas = { "livingroom", "kitchen", "garagestorage", "bedroom" },
                  respaldo = { "kitchen" }, min = 300, max = 1100 },
                { "lugar_cerca", id = "amigos_punto", de = "campamento", distancia = 26 },
                { "decir", grupo = "pide", rol = "david",
                  texto = "Estan en {lugar:campamento}. El Clau y el Waton te esperan en un mirador al lado. Primero observa. Despues decide. Es lo que yo haria. Bueno, yo no iria." },
                FACCION_AMIGOS,
                amigos("amigos_punto", { "clau", "waton" }),
            },
            salidas = salidas({ { cuando = { "cerca", "amigos_punto", 18 }, ir = "observar" } }),
        },
        observar = {
            pista = "Decidir como acercarte al grupo de {lugar:campamento} (clic derecho cerca de Clau).",
            ancla = "amigos_punto", ancla_grupo = "amigos", radio = 30,
            al_entrar = {
                { "aviso", texto = "Desde el mirador se ven tres personas flacas compartiendo una lata entre todos. Uno tiene una pistola. Se nota que no tiene balas." },
            },
            opciones = {
                { id = "hablar", texto = "Acercarte a hablar, como diria Shinbo",
                  dice = { rol = WATON, texto = "Bien, compadre. Conversando se entiende la gente. En Iquique por lo menos." } },
                { id = "atacar", texto = "Atacarlos antes de que te vean",
                  dice = { rol = CLAU, texto = "Ya... el Shinbo no va a estar contento, compadre." } },
            },
            salidas = salidas({
                { cuando = { "eleccion", "hablar" }, ir = "hablar" },
                { cuando = { "eleccion", "atacar" }, ir = "atacar" },
            }, 48),
        },
        hablar = {
            pista = "Llevarle 3 comidas al grupo de {lugar:campamento} (clic derecho cerca de ellos).",
            ancla = "campamento", ancla_grupo = "hambrientos", radio = 30,
            al_entrar = {
                { "npcs", id = "hambrientos", lugar = "campamento", radio = 60, no_mas_cerca = 6, modo = "guard", quietos = true,
                  postura = "friendly", cantidad = 3 },
                { "aviso", texto = "Te ven venir con las manos a la vista. El de la pistola vacia la baja despacio. 'Tenemos hambre', dice. Nada mas." },
            },
            opciones = {
                { id = "dar", texto = "Darles 3 comidas", requiere = { "comida", 3 },
                  falta = "Necesitas 3 comidas.",
                  respuesta = "Comen en silencio. Despues, la mas chica dice que no volveran a robarle a nadie. Justo entonces se escucha el gemido de una horda." },
            },
            salidas = salidas({
                { cuando = { "mato_jugador", "hambrientos" }, ir = "volver" },
                { cuando = { "eleccion", "dar" }, ir = "juntos" },
            }, 48),
        },
        juntos = {
            pista = "Defender {lugar:campamento} junto al grupo que alimentaste.",
            charla = { grupo = "amigos", lista = "hsous_horda", radio = 15, cada = 0.15 },
            al_entrar = {
                { "variable", nombre = "hipotesis", valor = "confirmada" },
                { "banderas", grupo = "hambrientos", quietos = false },
                { "oleada", lugar = "campamento", radio = 50, cantidad = { 20, 28 }, retraso = 0.02 },
            },
            salidas = salidas({
                { cuando = { "bajas_en", "campamento", 16, 60 }, ir = "volver" },
                { cuando = { "horas", 6 }, ir = "volver" },
            }),
        },
        atacar = {
            pista = "Acabar con el grupo de {lugar:campamento}.",
            al_entrar = {
                { "variable", nombre = "hipotesis", valor = "refutada" },
                { "bandidos", id = "ladrones", lugar = "campamento", radio = 60, modo = "guard", cantidad = 3 },
            },
            salidas = salidas({
                { cuando = { "todos_muertos", "ladrones" }, ir = "volver" },
                { cuando = { "horas", 48 }, ir = "volver" },
            }),
        },
        volver = {
            pista = "Contarle a Shinbo lo que paso, en {lugar:base}.",
            ancla = "base", ancla_grupo = "pide", radio = 40, mapa = false,
            al_entrar = {
                { "retirar_lejos", grupo = "hambrientos", lugar = "campamento", radio = 60, retraso = 0.2 },
            },
            opciones = {
                { id = "contar_bien", texto = "Contarle que tenia razon: tenian hambre", si = { "var", "hipotesis", "confirmada" },
                  dice = { rol = "david", texto = "Lo sabia. Bueno, lo suponia. En sociologia eso es casi lo mismo. Gracias. De verdad." } },
                { id = "contar_mal", texto = "Contarle que no hubo conversacion", si = { "no", { "var", "hipotesis", "confirmada" } },
                  dice = { rol = "david", texto = "Entiendo. No estaba ahi. No te voy a juzgar. Lo voy a anotar, eso si." } },
            },
            salidas = salidas({
                { cuando = { "o", { "eleccion", "contar_bien" }, { "eleccion", "contar_mal" } }, ir = "final_hecho" },
            }, 168),
        },
    }, "david"),
})

-- ===========================================================================
-- Bastian Tati: El partido con facha
-- ===========================================================================
Narrador.Charlas.hsous_tati = {
    { CLAU, "El Tati dijo que sin camiseta no hay partido. Y que sin facha no hay camiseta." },
    { LUENGO, "Yo pongo los completos del entretiempo. Si sobrevivo al entretiempo." },
    { LUENGO, "El Tati me pidio una camiseta talla 'que se vea bien'. No se que talla es esa." },
    { CLAU, "Yo juego de arquero. Chico, pero salto. Bueno, salto poco." },
    { CLAU, "El Matric quiere jugar contra los primos. Dice que 'se van a pasar la pelota entre ellos no mas'." },
}

historia({
    rol = "bastian",
    titulo = "El partido con facha",
    llamado = "Oe! Ven pa aca, loco. Tengo una idea con estilo.",
    aceptar = "Escuchar la idea de Tati",
    acepta = "Eso, po. Vamos a hacer el partido del fin del mundo. Sous contra Sous. Pero con camisetas, loco. Sin camiseta no se juega.",
    despues = "Ya, loco. El partido no se suspende, se posterga. Como en la liga.",
    diario = "Bastian Tati quiere organizar un partido en la base de Sous. Primero hay que conseguir camisetas, porque sin facha no se juega.",
    primera = "camisetas",
    final_dice = "Ganamos, perdimos, da lo mismo, loco: jugamos con facha. Toma, El Chamullo. Con ese palo te ganas a cualquiera. Es lo mas elegante que tengo, po.",
    final = {
        { "diario", si = { "var", "jugada", "cano" },
          texto = "En el partido de Sous le hice un cano a Akagami. No me lo va a perdonar nunca. Despues vino la horda, y despues Tati me regalo El Chamullo de Tati." },
        { "diario", si = { "var", "jugada", "pase" },
          texto = "En el partido de Sous le di el pase a Tati y la clavo en el angulo. Se saco la camiseta para celebrar. Despues vino la horda. Tati me regalo El Chamullo de Tati." },
        { "diario", si = { "var", "jugada", "siuu" },
          texto = "En el partido de Sous hice un gol y grite SIUUU. Wertres lloro de emocion. Despues vino la horda. Tati me regalo El Chamullo de Tati." },
    },
    etapas = conRol({
        camisetas = {
            pista = "Conseguir camisetas en {lugar:tienda}. Te esperan Claudio Clau y Fucking Luengo.",
            charla = { grupo = "amigos", lista = { "hsous_amigos", "hsous_tati" }, radio = 15, cada = 0.3 },
            al_entrar = {
                { "lugar", id = "tienda", desde = "base", salas = { "clothesstore", "clothesstorestorage", "sportstore", "sportstorage" },
                  respaldo = { "bedroom", "livingroom" }, min = 250, max = 1100 },
                { "decir", grupo = "pide", rol = "bastian",
                  texto = "En {lugar:tienda} hay camisetas de equipo, loco. El Clau te espera ahi. Y el Luengo, que va a hacer los completos del entretiempo." },
                FACCION_AMIGOS,
                { "lugar_cerca", id = "amigos_punto", de = "tienda", distancia = 14 },
                amigos("amigos_punto", { "clau", "luengo" }),
                { "objeto", id = "camisetas", lugar = "tienda", radio = 50, tipo = { "Base.Tshirt_Sport", "Base.Tshirt_SportDECAL" },
                  nombre = "Camisetas para el partido de Sous" },
                { "oleada", lugar = "tienda", radio = 50, cantidad = { 16, 24 } },
            },
            salidas = salidas({ { cuando = { "alguien_tiene", "camisetas" }, ir = "volver" } }),
        },
        volver = {
            pista = "Llevarle las camisetas a Tati en {lugar:base}.",
            ancla = "base", ancla_grupo = "pide", radio = 40, mapa = false,
            opciones = {
                { id = "entregar", texto = "Entregarle las camisetas a Tati", requiere = { "objeto", "camisetas" },
                  falta = "No llevas las camisetas.",
                  dice = { rol = "bastian", texto = "Esto si, loco! Ahora si somos un equipo. A la cancha, todos!" } },
            },
            salidas = salidas({ { cuando = { "eleccion", "entregar" }, ir = "partido" } }, 168),
        },
        partido = {
            pista = "El partido de Sous esta empatado. Elegir tu jugada (clic derecho cerca de Tati).",
            ancla = "base", ancla_grupo = "pide", radio = 40, mapa = false,
            al_entrar = {
                { "aviso", texto = "Arcos de palo, una pelota parchada y diez tipos gritando en el patio de la base. Faltan dos minutos y van empatados." },
            },
            opciones = {
                { id = "cano", texto = "Hacerle un cano a Akagami",
                  dice = { rol = "bastian", texto = "UUUUY, loco! Al lider! Eso no se hace... eso se aplaude, po!" },
                  acciones = { { "variable", nombre = "jugada", valor = "cano" } } },
                { id = "pase", texto = "Pasarsela a Tati para que la clave",
                  dice = { rol = "bastian", texto = "GOOOL! Al angulo, loco! Con facha! Esto es lo mas lindo que me ha pasado en el fin del mundo!" },
                  acciones = { { "variable", nombre = "jugada", valor = "pase" } } },
                { id = "siuu", texto = "Patear al arco y gritar SIUUU",
                  dice = { rol = "bastian", texto = "Oe, el Wertres se esta emocionando mucho. Wertres, calmate, po!" },
                  acciones = { { "variable", nombre = "jugada", valor = "siuu" } } },
            },
            salidas = salidas({
                { cuando = { "o", { "eleccion", "cano" }, { "eleccion", "pase" }, { "eleccion", "siuu" } }, ir = "gritos" },
                { cuando = { "horas", 2 }, ir = "gritos" },
            }),
        },
        gritos = {
            pista = "Los gritos del partido atrajeron una horda. Defender la base de Sous en {lugar:base}.",
            mapa = false,
            al_entrar = {
                { "aviso", texto = "Tanto grito se escucho lejos. Del bosque empiezan a salir muertos, como hinchas tarde al estadio." },
                { "ruido", lugar = "base", radio = 140, volumen = 100 },
                { "oleada", lugar = "base", radio = 55, cantidad = { 20, 30 }, retraso = 0.05 },
                { "decir", grupo = "pide", rol = "bastian", retraso = 0.06,
                  texto = "Oe, invasion de cancha! Todos a defender, loco! Con la camiseta puesta!" },
            },
            salidas = salidas({
                { cuando = { "bajas_en", "base", 18, 60 }, ir = "final_hecho" },
                { cuando = { "horas", 8 }, ir = "final_hecho" },
            }),
        },
    }, "bastian"),
})

-- ---------------------------------------------------------------------------
-- Ecos en la base: lo que le dijiste a Matric de los primos
-- ---------------------------------------------------------------------------
Narrador.Charlas.sous_aliados = Narrador.Charlas.sous_aliados or {}
H.ECOS = {
    { "benjamin", "Bro, desde que lo conte, los primos suben al cerro por separado. Por separado, hermano. Eso es peor.", si = { "memoria", "hsous_primos", "contado" } },
    { "jorge", "Gracias por lo de la bitacora, broder. Ahora todo Sous me hace ojitos. Todo Sous, manito.", si = { "memoria", "hsous_primos", "contado" } },
    { "cristian", "Akkakaka, ya sabe todo Sous. Bueno. Igual subimos manana, compadre.", si = { "memoria", "hsous_primos", "contado" } },
    { "benjamin", "Los primos me estan preparando un cumpleanos, bro. Me hago el que no se. Soy pesimo haciendome el que no se.", si = { "memoria", "hsous_primos", "verdad" } },
    { "jorge", "El Benja nos mira con cara de que sabe algo, broder. Que sabe? Tu le contaste algo?", si = { "memoria", "hsous_primos", "verdad" } },
    { "benjamin", "No encontraste nada, dijiste. Nada. Hmm. Te tengo vigilado, bro. Con carino, pero vigilado.", si = { "memoria", "hsous_primos", "secreto" } },
    { "martin_a", "Desde que hay luz el Renato pregunta todos los dias por el torneo. Uno: no. Dos: no. Tres: bueno, un dia.", si = { "memoria", "hsous_martin_a", "hecho" } },
    { "martin_z", "La Awp de SOUS esta en buenas manos. Las tuyas. Estadisticamente, las menos malas.", si = { "memoria", "hsous_martin_z", "hecho" } },
    { "david", "Termine el capitulo sobre el grupo de la comida. Tu sales harto. Con nombre ficticio, tranquilo.", si = { "memoria", "hsous_david", "hecho" } },
    { "bastian", "Las camisetas siguen colgadas, loco. Las lavo yo, no confio en nadie mas.", si = { "memoria", "hsous_bastian", "hecho" } },
}
if not H._ecos then
    H._ecos = true
    local lista = Narrador.Charlas.sous_aliados
    for _, l in ipairs(H.ECOS) do lista[#lista + 1] = l end
end

return H
