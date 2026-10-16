-- Encuentros de exploracion: gente en problemas que aparece mientras recorres el mapa.
-- Los lanza server/Narrador/NarradorEncuentros.lua cuando entras a zonas nuevas. Primero
-- escuchas o ves algo (cartel con la direccion y zona en el mapa); el NPC es inmortal
-- hasta que llegas, y al llegar pasa a ser mortal con un rato de gracia para reaccionar.
-- Si nadie va en dos horas, se va solo y a veces, dias despues, aparece su zombi con su carnet.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar

Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.encuentro = {
    { "npc", "Aca! Aca arriba! No me dejen!", si = { "no", { "eleccion", "llevar" } } },
    { "npc", "Pense que nadie iba a escuchar." },
    { "npc", "Cuidado por la izquierda!" },
    { "npc", "No tengo mucho, pero lo que tengo es tuyo si salimos de esta." },
    { "npc2", "Rapido, rapido, que entran!" },
    { "npc2", "No los dejes pasar, por favor." },
    -- La leyenda de Eduardo Giovanns: la gente que salvo lo nombra.
    { "npc", "Una vez me saco de una igual a esta un tal Eduardo. Alto, callado, con un arma que brillaba. Tu me lo recuerdas." },
    { "npc", "Dicen que por aca anda Eduardo, el que ayuda a la gente. Ojala no sea un cuento.", si = { "no", { "mem", "tomas_conocido" } } },
    { "npc", "Peleas como Eduardo. Si, ese Eduardo. Todo Knox habla de el.", si = { "mem", "tomas_conocido" } },
    { "npc2", "Eduardo nunca pide nada a cambio. Dicen. Ojala tu tampoco." },
    -- Segun tu fama en Knox.
    { "npc", "Yo se quien eres. Que me salves no borra lo que hiciste.", si = { "knox_maximo", -90 } },
    { "npc", "No me toques! Me salvas y despues que? Me matas tu?", si = { "knox_maximo", -90 } },
    { "npc2", "Es el. El de las historias. No lo mires a los ojos.", si = { "knox_maximo", -90 } },
    { "npc", "Escuche cosas de ti. Ojala no sean verdad.", si = { { "knox_maximo", -10 }, { "knox_minimo", -89 } } },
    { "npc", "Eres tu! La nueva esperanza! Sabia que ibas a venir.", si = { "knox_minimo", 60 } },
    { "npc", "Todos hablan de lo que hiciste en Knox. Nunca pense que te iba a conocer.", si = { "knox_minimo", 120 } },
    { "npc2", "El heroe de Knox, aca, por nosotros. Mi mama no me lo va a creer.", si = { "knox_minimo", 200 } },
}

-- Datos de cada tipo (el servidor los usa para sortear y armar el encuentro).
Narrador.EncuentrosTipos = {
    techo = { zona = { "ciudad" }, peso = 10, oleada = { 8, 14 },
        senal = "Se escuchan gritos {direccion}, a unos {distancia} metros.",
        llegada = "Alguien esta arriba de un auto, rodeado. Te ve y empieza a gritar mas fuerte.",
        grito = "Aca arriba! Me tienen rodeado!", gracias = "Gracias. Pense que me iba a morir arriba de ese auto.",
        regalo = { { "Base.Bandage" }, { "Base.TinnedBeans", "Base.CannedBeans" } } },
    auto = { zona = { "carretera", "rural" }, peso = 10, oleada = { 6, 10 }, refuerzo = { 6, 10 },
        senal = "Un claxon pegado suena {direccion}, a unos {distancia} metros. No para.",
        llegada = "Un auto volcado al costado del camino. El conductor esta atrapado y el claxon no deja de sonar.",
        grito = "No puedo salir! El claxon no para, los esta llamando a todos!",
        gracias = "Me salvaste. Toma, en el maletero tenia esto.",
        regalo = { { "Base.PetrolCan", "Base.EmptyPetrolCan" }, { "Base.Wrench" } } },
    puerta = { zona = { "ciudad", "rural" }, peso = 9, oleada = { 10, 16 }, dos = true, casa = true,
        senal = "Golpes y gritos {direccion}, a unos {distancia} metros. Suena como una puerta a punto de ceder.",
        llegada = "Una familia encerrada en su casa. Los muertos estan rompiendo la puerta.",
        grito = "La puerta no aguanta! Ayuda!", gracias = "No sabemos como pagarte. Toma, es lo que tenemos.",
        regalo = { { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.WaterBottleFull", "Base.Water" } },
        giro = "mordido", giroChance = 25 },
    carrera = { zona = { "ciudad", "rural", "carretera" }, peso = 7, oleada = { 14, 20 }, sueltos = true,
        senal = "Alguien pasa corriendo {direccion}, a unos {distancia} metros, con una horda detras.",
        llegada = "Un corredor viene hacia ti con una horda pegada a los talones.",
        grito = "Corre! No te quedes ahi parado, corre!", gracias = "Uf... uf... gracias. Te debo la vida. Y unos pulmones.",
        regalo = { { "Base.Bullets9mmBox", "Base.Bullets9mm" } }, giro = "te_la_trae", giroChance = 40 },
    trampa = { zona = { "rural" }, peso = 6, oleada = { 4, 8 },
        senal = "Alguien grita de dolor {direccion}, a unos {distancia} metros. Suena a trampa de metal.",
        llegada = "Un cazador con la pierna atrapada en una trampa para osos.",
        grito = "Mi pierna! No me puedo mover!", gracias = "Gracias, amigo. Toma mi cuchillo, yo tengo otro.",
        regalo = { { "Base.HuntingKnife" }, { "Base.TrapCage", "Base.Twine" } }, giro = "cazador_de_gente", giroChance = 25 },
    pozo = { zona = { "rural", "ciudad" }, peso = 5, oleada = { 4, 8 }, cuerda = true,
        senal = "Una voz pide ayuda {direccion}, a unos {distancia} metros. Suena como si viniera de abajo.",
        llegada = "Alguien cayo a una zanja honda. Sin una cuerda no va a poder salir.",
        grito = "Aca abajo! Tienes una cuerda?", gracias = "Gracias. Pense que me iba a quedar ahi abajo para siempre.",
        regalo = { { "Base.Flashlight", "Base.HandTorch" }, { "Base.Bandage" } } },
    herido = { zona = { "carretera", "rural" }, peso = 6, oleada = { 3, 6 },
        senal = "Alguien pide agua {direccion}, a unos {distancia} metros. Esta tirado en el suelo.",
        llegada = "Un hombre herido, tirado al lado del camino. Tiene pinta de bandido.",
        grito = "Agua... por favor... solo agua.", gracias = "No todos son como yo. Me alegra que tu no lo seas.",
        regalo = { { "Base.Pistol" }, { "Base.Bullets9mm" } }, giro = "emboscada", giroChance = 40 },
    comerciante = { zona = { "carretera" }, peso = 5, oleada = { 8, 12 }, bateria = true,
        senal = "Un motor que no arranca {direccion}, a unos {distancia} metros. Alguien insiste e insiste.",
        llegada = "Un comerciante con su carro en panne. La bateria murio y los muertos se acercan.",
        grito = "Si me ayudas, te pago bien! Lo que quieras del carro!", gracias = "Eres mi cliente favorito. Toma, va por la casa.",
        regalo = { { "Base.Cigarettes" }, { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Battery" } } },
    bengala = { zona = { "ciudad", "rural", "carretera" }, peso = 5, oleada = { 10, 16 }, dos = true,
        senal = "Una bengala roja sube {direccion}, a unos {distancia} metros. Alguien pide ayuda.",
        llegada = "Un grupo atrincherado tira bengalas. Los muertos los tienen cercados.",
        grito = "Aca! Aca! Nos queda una sola bengala!", gracias = "Pensamos que nadie la iba a ver. Gracias.",
        regalo = { { "Base.Flare", "Base.Flashlight" }, { "Base.TinnedBeans", "Base.CannedBeans" } },
        giro = "cebo", giroChance = 25 },
    sous = { zona = { "sous" }, peso = 0, oleada = { 10, 14 }, sous = true,
        senal = "Reconoces una voz {direccion}, a unos {distancia} metros. Es alguien de Sous.",
        llegada = "Es {nombre}, de Sous. Rodeado y sin salida.",
        grito = "var:grito_sous", gracias = "var:gracias_sous",
        regalo = { { "Base.Bandage" } } },
}

-- Arma el arco de un tipo.
local function encuentro(id, t)
    local npcs = { { "npc", "var:perfil" } }
    if t.dos then npcs[#npcs + 1] = { "npc2", "var:perfil2" } end
    local etapas = {
        aviso = {
            pista = "Alguien pide ayuda cerca de {lugar:punto}.",
            objetivo = "punto",
            al_entrar = {
                { "reloj", id = "expira", horas = 2 },
                { "aviso", texto = "var:senal" },
                { "marcar_zona", lugar = "punto", radio = 30, texto = "Alguien pide ayuda" },
                { "npcs", id = "npc", lugar = "punto", radio = 60, modo = "guard", quietos = not t.sueltos, correa = 4,
                  inmortales = true, postura = "friendly", perfiles = npcs, nombres = "var:nombres" },
                { "oleada", lugar = "punto", radio = 60, cantidad = "var:oleada", min = 6, max = 16 },
                { "oleada", lugar = "punto", radio = 60, cantidad = "var:refuerzo", retraso = 0.3, si = { "var_mayor", "refuerzo_n", 0 } },
            },
            salidas = {
                { cuando = { "cerca", "punto", 12 }, ir = "llegada" },
                { cuando = { "reloj_vencido", "expira" }, ir = "final_ignorado" },
            },
        },
        llegada = {
            pista = "Ayudar a {nombre} en {lugar:punto}.",
            objetivo = "punto",
            charla = { grupo = "npc", lista = "encuentro", radio = 18, cada = 0.15 },
            al_entrar = {
                { "aviso", texto = "var:llegada" },
                { "decir", grupo = "npc", rol = "npc", texto = "var:grito" },
                { "variable", nombre = "peligro", valor = true },
                -- Unos segundos de gracia y deja de ser inmortal.
                { "banderas", grupo = "npc", inmortales = false, retraso = 0.2 },
                { "bandidos", id = "emboscada", lugar = "punto", radio = 60, modo = "hunt", cantidad = { 2, 3 }, retraso = 0.05,
                  si = { "o", { "var", "giro", "emboscada" }, { "var", "giro", "cazador_de_gente" }, { "var", "giro", "cebo" } } },
                { "aviso", texto = "Era una trampa! Hay gente armada saliendo de los arbustos.", retraso = 0.05,
                  si = { "o", { "var", "giro", "emboscada" }, { "var", "giro", "cazador_de_gente" }, { "var", "giro", "cebo" } } },
                { "oleada", lugar = "jugador", radio = 40, cantidad = { 8, 12 }, si = { "var", "giro", "te_la_trae" } },
            },
            salidas = {
                { cuando = { "mato_jugador", "npc" }, ir = "final_lo_mataste" },
                { cuando = { "todos_muertos", "npc" }, ir = "final_muerto" },
                { cuando = { "o", { { "horas", 0.25 }, { "sin_zombis", "punto", 14 } }, { "horas", 1 } }, ir = "salvado" },
            },
        },
        salvado = {
            pista = "Hablar con {nombre} en {lugar:punto}.",
            objetivo = "punto",
            ancla = "punto", ancla_grupo = "npc", radio = 18,
            al_entrar = {
                { "variable", nombre = "peligro", valor = false },
                { "banderas", grupo = "npc", inmortales = true },
                { "decir", grupo = "npc", rol = "npc", texto = "var:gracias" },
                { "decir", grupo = "npc", rol = "npc2", texto = "No mires al chico. Esta bien. Esta bien.", retraso = 0.05,
                  si = { "var", "giro", "mordido" } },
            },
            opciones = {
                { id = "cuerda", texto = "Sacarlo con una cuerda", si = { "var", "cuerda", true }, una_vez = true,
                  requiere = { "items", { "Base.Rope", "Base.SheetRope", "Base.RippedSheets" }, 1 }, consume = false,
                  falta = "Necesitas una cuerda (o sabanas amarradas).",
                  dice = { rol = "npc", texto = "Arriba! Al fin! Gracias!" }, acciones = { { "variable", nombre = "cuerda", valor = false } } },
                { id = "bateria", texto = "Pasarle una bateria para el carro", si = { "var", "bateria", true }, una_vez = true,
                  requiere = { "items", { "Base.CarBattery1", "Base.CarBattery2", "Base.CarBattery3" }, 1 },
                  falta = "No llevas una bateria de auto.",
                  dice = { rol = "npc", texto = "Arranco! Toma, esto es tuyo. Vuelve cuando quieras comprar algo." },
                  acciones = { { "recompensa", lugar = "punto", radio = 30, items = "var:regalo_comerciante" },
                               { "variable", nombre = "bateria", valor = false } } },
                { id = "llevar", texto = "Llevarlo donde {misionero}, que ahi hay gente",
                  si = { { "no", { "var", "cuerda", true } }, { "no", { "var", "misionero_id" } } },
                  dice = { rol = "npc", texto = "Donde {misionero}? Ya. Te sigo, pero no me dejes atras." } },
                { id = "provisiones", texto = "Darle algo de comer y dejarlo ir", requiere = { "comida" }, si = { "no", { "var", "cuerda", true } },
                  falta = "No llevas comida.",
                  dice = { rol = "npc", texto = "Comida... de verdad? No me voy a olvidar de esto." } },
                { id = "cobrar", texto = "Pedirle algo a cambio", si = { "no", { "var", "cuerda", true } },
                  dice = { rol = "npc", texto = "Justo. Toma, es lo que tengo." } },
                { id = "dejar", texto = "Despedirse y seguir camino", si = { "no", { "var", "cuerda", true } },
                  dice = { rol = "npc", texto = "Cuidate alla afuera." } },
            },
            salidas = {
                { cuando = { "todos_muertos", "npc" }, ir = "final_muerto" },
                { cuando = { "eleccion", "llevar" }, ir = "escolta" },
                { cuando = { "eleccion", "provisiones" }, ir = "final_compartiste" },
                { cuando = { "eleccion", "cobrar" }, ir = "final_cobraste" },
                { cuando = { "eleccion", "dejar" }, ir = "final_despedida" },
                { cuando = { "horas", 3 }, ir = "final_despedida" },
            },
        },
        -- Llevarlo sano y salvo al campamento del misionero: te sigue a pie y se sube al auto
        -- contigo (ver server/Narrador/NarradorPasajeros.lua). Ya no es inmortal.
        escolta = {
            pista = "Llevar a {nombre} sano y salvo a {lugar:misionero}.",
            objetivo = "misionero",
            al_entrar = {
                { "lugar_misionero", id = "misionero" },
                { "acompanante", grupo = "npc", rol = "npc", inmortal = false },
                { "acompanante", grupo = "npc", rol = "npc2", inmortal = false },
                -- Suelto (sin quedarse quieto ni correa) para que pueda seguirte; el repaso
                -- periodico de banderas del grupo respeta esto.
                { "banderas", grupo = "npc", inmortales = false, quietos = false, correa = 0 },
                { "diario", texto = "{nombre} viene conmigo. Lo llevo donde {misionero}, en {lugar:misionero}." },
            },
            salidas = {
                { cuando = { "mato_jugador", "npc" }, ir = "final_lo_mataste" },
                { cuando = { "todos_muertos", "npc" }, ir = "final_no_llego" },
                { cuando = { "npc_cerca", "npc", "misionero", 15 }, ir = "final_llevado" },
                { cuando = { "horas", 96 }, ir = "final_separados" },
            },
        },
        final_llevado = { final = true, al_entrar = {
            { "soltar_acompanante", grupo = "npc", rol = "npc" },
            { "soltar_acompanante", grupo = "npc", rol = "npc2" },
            { "banderas", grupo = "npc", inmortales = true },
            { "huella", acto = "salvaste" },
            { "cliente_desde_encuentro", salvado = true },
            { "decir", grupo = "npc", rol = "npc", texto = "Llegamos. Llegamos de verdad. Gracias." },
            { "transformar", grupo = "npc", rol = "npc2", retraso = 0.6, si = { "var", "giro", "mordido" } },
            { "retirar_lejos", grupo = "npc", lugar = "misionero", radio = 50, retraso = 2 },
            { "diario", texto = "Lleve a {nombre} sano y salvo donde {misionero}. Ahora vive en {lugar:misionero}." },
        } },
        final_no_llego = { final = true, al_entrar = {
            { "soltar_acompanante", grupo = "npc", rol = "npc" },
            { "soltar_acompanante", grupo = "npc", rol = "npc2" },
            { "huella", acto = "no_alcanzaste" },
            { "diario", texto = "{nombre} no llego donde {misionero}. Lo estaba llevando yo." },
        } },
        final_separados = { final = true, al_entrar = {
            { "soltar_acompanante", grupo = "npc", rol = "npc" },
            { "soltar_acompanante", grupo = "npc", rol = "npc2" },
            { "retirar_lejos", grupo = "npc", lugar = "punto", radio = 50, retraso = 0.3 },
            { "diario", texto = "Perdi a {nombre} en el camino. Ojala haya llegado solo donde {misionero}." },
        } },
        final_compartiste = { final = true, al_entrar = {
            { "huella", acto = "compartiste" },
            { "eco_regalo", horas = { 48, 120 } },
            { "transformar", grupo = "npc", rol = "npc2", retraso = 0.6, si = { "var", "giro", "mordido" } },
            { "retirar_lejos", grupo = "npc", lugar = "punto", radio = 50, retraso = 0.3 },
            { "diario", texto = "Ayude a {nombre} y le deje algo de comer. Algun dia el mundo devuelve esas cosas. Algun dia." },
        } },
        final_cobraste = { final = true, al_entrar = {
            { "huella", acto = "cobraste" },
            { "recompensa", lugar = "punto", radio = 30, items = "var:regalo" },
            { "transformar", grupo = "npc", rol = "npc2", retraso = 0.6, si = { "var", "giro", "mordido" } },
            { "retirar_lejos", grupo = "npc", lugar = "punto", radio = 50, retraso = 0.3 },
            { "diario", texto = "Ayude a {nombre}. Me pago con lo que tenia. Asi funcionan las cosas ahora." },
        } },
        final_despedida = { final = true, al_entrar = {
            { "huella", acto = "salvaste" },
            { "transformar", grupo = "npc", rol = "npc2", retraso = 0.6, si = { "var", "giro", "mordido" } },
            { "retirar_lejos", grupo = "npc", lugar = "punto", radio = 50, retraso = 0.3 },
            { "diario", texto = "Ayude a {nombre} cerca de {lugar:punto}. Cada uno siguio su camino." },
        } },
        final_muerto = { final = true, al_entrar = {
            { "huella", acto = "no_alcanzaste" },
            { "diario", texto = "No alcance a salvar a {nombre}. Llegue, pero no basto." },
        } },
        final_lo_mataste = { final = true, al_entrar = {
            { "huella", acto = "mataste" },
            { "diario", texto = "{nombre} pedia ayuda y lo mate. No se si fue un error o una decision." },
        } },
        final_ignorado = { final = true, al_entrar = {
            { "huella", acto = "lo_dejaste" },
            { "retirar", grupo = "npc" },
            { "zombi_en", lugar = "punto", radio = 50, retraso = "var:eco_horas", si = { "var", "eco_zombi", true } },
            { "eco_marca", lugar = "punto", radio = 50, retraso = "var:eco_horas", si = { "var", "eco_zombi", true },
              texto = "Volvi a pasar por ahi. Encontre a {nombre_completo}, o lo que quedaba.",
              aviso = "Este muerto lleva un carnet. Es {nombre_completo}, el que pedia ayuda." },
            { "objeto", id = "carnet", lugar = "punto", radio = 50, retraso = "var:eco_horas", si = { "var", "eco_zombi", true },
              tipo = { "Base.IDcard", "Base.Wallet", "Base.Notebook" }, nombre = "Carnet de {nombre_completo}" },
            { "diario", texto = "Escuche que alguien pedia ayuda cerca de {lugar:punto}. No fui." },
        } },
    }
    registrar({
        id = "enc_" .. id,
        titulo = "{titulo}",
        titulo_menu = "Encuentro: " .. id,
        requiere_alife = true, automatico = false, encuentro = id, indicador = "encuentro",
        inicio = "aviso",
        etapas = etapas,
    })
end

for id, t in pairs(Narrador.EncuentrosTipos) do encuentro(id, t) end
