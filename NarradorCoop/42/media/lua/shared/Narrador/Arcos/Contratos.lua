-- Encargos que dan los contactos de cada ciudad (ver server/Narrador/NarradorContactos.lua).
-- Se generan por dificultad: facil, medio, dificil y ultra (Louisville, premio legendario).
-- No los lanza el narrador solo: se piden hablando con el contacto.
-- Textos sin tildes a proposito (ver nota en FamiliaInfectada.lua).

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar

local NIVELES = {
    facil = { titulo = "facil", min = 150, max = 600, zombis = { 6, 10 }, plazo = 48 },
    medio = { titulo = "medio", min = 300, max = 1000, zombis = { 14, 22 }, refuerzo = { 6, 10 }, plazo = 72,
              bandidos = { 1, 2 }, chanceBandidos = true },
    dificil = { titulo = "dificil", min = 500, max = 1600, zombis = { 28, 40 }, refuerzo = { 12, 18 }, plazo = 96,
                bandidos = { 2, 4 } },
}

-- Que hay que ir a buscar.
local COSAS = {
    paquete = {
        titulo = "El paquete", salas = { "warehouse", "storageunit", "garagestorage", "factorystorage" },
        respaldo = { "livingroom", "kitchen" }, tipo = { "Base.Briefcase", "Base.Bag_Satchel", "Base.Bag_Schoolbag" },
        nombre = "Paquete de {contacto_nombre}",
        pedido = "Deje un paquete escondido en {lugar:objetivo} y no puedo volver por el. Traemelo sin abrirlo.",
    },
    medicina = {
        titulo = "La medicina", salas = { "pharmacy", "pharmacystorage", "medical", "medicalstorage" },
        respaldo = { "kitchen", "bedroom" }, tipo = { "Base.Antibiotics", "Base.Pills" },
        nombre = "Medicina para {contacto_nombre}",
        pedido = "Hay alguien enfermo con nosotros. En {lugar:objetivo} deberian quedar antibioticos.",
    },
    planos = {
        titulo = "Los planos", salas = { "office", "classroom", "policeoffice" },
        respaldo = { "livingroom" }, tipo = { "Base.Notebook", "Base.SheetPaper2" },
        nombre = "Planos de {ciudad}",
        pedido = "Necesito los planos del pueblo. La ultima copia estaba en {lugar:objetivo}.",
    },
    radio = {
        titulo = "La radio", salas = { "policestorage", "electronicsstore", "office" },
        respaldo = { "livingroom", "garagestorage" },
        tipo = { "Base.WalkieTalkie3", "Base.WalkieTalkie2", "Base.RadioRed", "Base.Notebook" },
        nombre = "Radio de largo alcance",
        pedido = "Con una buena radio podriamos escuchar a otros grupos. Habia una en {lugar:objetivo}.",
    },
}

-- Lo que dice la persona que rescatas en un encargo.
Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.rehen = {
    { "rehen", "Te mandaron a buscarme? De verdad? Pense que me iban a dejar aca." },
    { "rehen", "Hay muchos afuera. Muchos. No salgas por la puerta de adelante." },
    { "rehen", "No me sueltes la mano. Bueno, si, sueltala, que necesitas disparar." },
    { "rehen", "Tres dias sin comer. No sabes lo que es eso. O si sabes, quizas." },
    { "rehen", "Cuando volvamos le debo una a quien te mando. Y a ti, dos." },
    { "rehen", "Escuche disparos ayer. Pense que era otra persona como tu. No volvio nadie." },
}

local PERFILES_REHEN = { "k93_hensley_family_03", "k93_red_cross_04", "k93_truckstop_05", "k93_county_ems_03",
    "k93_hensley_family_04" }

local function comunes(cfg)
    return {
        final_cumplido = {
            final = true,
            al_entrar = {
                { "decir_contacto", texto = "Buen trabajo. Esto es tuyo, te lo ganaste." },
                { "recompensa_nivel", lugar = "contacto", radio = 30 },
                { "diario", texto = "Encargo cumplido para {contacto_nombre} en {ciudad}." },
            },
        },
        final_vencido = {
            final = true,
            al_entrar = { { "diario", texto = "Se acabo el plazo del encargo de {contacto_nombre}. Ya no lo necesita." } },
        },
        final_fallido = {
            final = true,
            al_entrar = { { "diario", texto = "El encargo de {contacto_nombre} salio mal." } },
        },
    }
end

local function salidasDePlazo(lista)
    lista[#lista + 1] = { cuando = { "reloj_vencido", "plazo" }, ir = "final_vencido" }
    return lista
end

-- ---------------------------------------------------------------------------
-- Encargos de buscar algo y traerlo
-- ---------------------------------------------------------------------------
local function encargoBuscar(cosaId, nivelId)
    local cosa, nivel = COSAS[cosaId], NIVELES[nivelId]
    local enSitio = {
        { "oleada", lugar = "objetivo", radio = 50, cantidad = nivel.zombis },
        { "objeto", id = "objeto", lugar = "objetivo", radio = 50, tipo = cosa.tipo, nombre = cosa.nombre },
    }
    if nivel.refuerzo ~= nil then
        enSitio[#enSitio + 1] = { "oleada", lugar = "objetivo", radio = 50, cantidad = nivel.refuerzo, retraso = 0.3 }
    end
    if nivel.bandidos ~= nil then
        enSitio[#enSitio + 1] = { "bandidos", id = "bandidos", lugar = "objetivo", radio = 60, modo = "guard",
            cantidad = nivel.bandidos, si = nivel.chanceBandidos and { "var", "con_bandidos", true } or nil }
    end
    local etapas = comunes()
    etapas.encargo = {
        al_entrar = {
            { "reloj", id = "plazo", horas = nivel.plazo },
            { "lugar", id = "objetivo", desde = "contacto", salas = cosa.salas, respaldo = cosa.respaldo,
              min = nivel.min, max = nivel.max },
            { "decir_contacto", texto = cosa.pedido },
            { "diario", texto = "{contacto_nombre} ({ciudad}) te encarga: " .. string.lower(cosa.titulo) .. ". Esta en {lugar:objetivo}." },
        },
        salidas = { { ir = "viaje" } },
    }
    etapas.viaje = {
        pista = "Ir a {lugar:objetivo} (encargo de {contacto_nombre}).",
        salidas = salidasDePlazo({ { cuando = { "cerca", "objetivo", 50 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Encontrar lo que pidio {contacto_nombre} en {lugar:objetivo}.",
        al_entrar = enSitio,
        salidas = salidasDePlazo({ { cuando = { "alguien_tiene", "objeto" }, ir = "volver" } }),
    }
    etapas.volver = {
        pista = "Llevarselo a {contacto_nombre} en {lugar:contacto}.",
        ancla = "contacto",
        opciones = {
            { id = "entregar", texto = "Entregar el encargo a {contacto_nombre}", requiere = { "objeto", "objeto" },
              falta = "No lo llevas encima." },
        },
        salidas = salidasDePlazo({ { cuando = { "eleccion", "entregar" }, ir = "final_cumplido" } }),
    }
    registrar({
        id = "encargo_" .. cosaId .. "_" .. nivelId,
        titulo = cosa.titulo .. " (" .. nivel.titulo .. ")",
        titulo_menu = "Encargo " .. nivel.titulo .. ": " .. cosa.titulo,
        requiere_alife = true, automatico = false, encargo_nivel = nivelId,
        sorteo = { con_bandidos = { valores = { true, false }, pesos = { 1, 2 } } },
        inicio = "encargo",
        etapas = etapas,
    })
end

-- ---------------------------------------------------------------------------
-- Encargos de rescate: alguien atrapado; hay que mantenerlo vivo una hora.
-- ---------------------------------------------------------------------------
local function encargoRescate(nivelId)
    local nivel = NIVELES[nivelId]
    local etapas = comunes()
    local rescate = {
        { "npcs", id = "rehen", lugar = "objetivo", radio = 50, modo = "guard", quietos = true, correa = 3,
          postura = "friendly", perfiles = { { "rehen", "var:perfil_rehen" } } },
        { "oleada", lugar = "objetivo", radio = 50, cantidad = nivel.zombis, min = 8, max = 20 },
    }
    if nivel.refuerzo ~= nil then
        rescate[#rescate + 1] = { "oleada", lugar = "objetivo", radio = 50, cantidad = nivel.refuerzo, min = 10, max = 22, retraso = 0.4 }
    end
    if nivel.bandidos ~= nil then
        rescate[#rescate + 1] = { "bandidos", id = "bandidos", lugar = "objetivo", radio = 60, modo = "hunt",
            cantidad = nivel.bandidos, si = nivel.chanceBandidos and { "var", "con_bandidos", true } or nil }
    end
    etapas.encargo = {
        al_entrar = {
            { "reloj", id = "plazo", horas = math.min(nivel.plazo, 24) },
            { "lugar", id = "objetivo", desde = "contacto", salas = { "livingroom", "kitchen", "bedroom", "motelroom" },
              min = nivel.min, max = nivel.max },
            { "decir_contacto", texto = "Uno de los mios quedo atrapado en {lugar:objetivo}. Sacalo de ahi, rapido." },
            { "diario", texto = "{contacto_nombre} ({ciudad}) te pide rescatar a alguien atrapado en {lugar:objetivo}." },
        },
        salidas = { { ir = "viaje" } },
    }
    etapas.viaje = {
        pista = "Rescatar a la persona atrapada en {lugar:objetivo}.",
        salidas = salidasDePlazo({ { cuando = { "cerca", "objetivo", 45 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Mantener viva a la persona atrapada en {lugar:objetivo} hasta que pase el peligro.",
        charla = { grupo = "rehen", lista = "rehen", radio = 15, cada = 0.15 },
        al_entrar = rescate,
        salidas = {
            { cuando = { "mato_jugador", "rehen" }, ir = "final_fallido" },
            { cuando = { "todos_muertos", "rehen" }, ir = "final_fallido" },
            { cuando = { { "grupo_listo", "rehen" }, { "horas", 1 } }, ir = "rescatado" },
        },
    }
    etapas.rescatado = {
        al_entrar = {
            { "decir", grupo = "rehen", rol = "rehen", texto = "Gracias... voy donde {contacto_nombre}. Avisale que estoy bien." },
            { "retirar_lejos", grupo = "rehen", lugar = "objetivo", radio = 50, retraso = 0.5 },
        },
        salidas = { { ir = "volver" } },
    }
    etapas.volver = {
        pista = "Avisarle a {contacto_nombre} en {lugar:contacto} que el rescate salio bien.",
        ancla = "contacto",
        opciones = { { id = "entregar", texto = "Contarle a {contacto_nombre} que su gente esta a salvo" } },
        salidas = { { cuando = { "eleccion", "entregar" }, ir = "final_cumplido" } },
    }
    registrar({
        id = "encargo_rescate_" .. nivelId,
        titulo = "El rescate (" .. nivel.titulo .. ")",
        titulo_menu = "Encargo " .. nivel.titulo .. ": El rescate",
        requiere_alife = true, automatico = false, encargo_nivel = nivelId,
        sorteo = { con_bandidos = { valores = { true, false }, pesos = { 1, 2 } },
                   perfil_rehen = { valores = PERFILES_REHEN } },
        inicio = "encargo",
        etapas = etapas,
    })
end

-- ---------------------------------------------------------------------------
-- Encargos de alijo: limpiar un lugar y quedarse con lo que hay (el pago esta en el sitio).
-- ---------------------------------------------------------------------------
local ALIJO_PEDIDOS = {
    "Se de un alijo en {lugar:objetivo}. Yo ya no tengo piernas pa ir. Lo que encuentres es tuyo.",
    "Un grupo dejo provisiones guardadas en {lugar:objetivo} y no volvio. Alguien tiene que ir antes que los muertos.",
    "En {lugar:objetivo} hay un escondite lleno. Solo quiero saber que ya no queda nadie ahi. El resto, tuyo.",
}

local function encargoAlijo(nivelId)
    local nivel = NIVELES[nivelId]
    local etapas = comunes()
    local enSitio = {
        { "oleada", lugar = "objetivo", radio = 50, cantidad = nivel.zombis },
        { "recompensa_nivel", lugar = "objetivo", radio = 50 },
        { "diario", texto = "El alijo de {lugar:objetivo} estaba ahi, como dijo {contacto_nombre}. Los muertos tambien." },
    }
    if nivel.refuerzo ~= nil then
        enSitio[#enSitio + 1] = { "oleada", lugar = "objetivo", radio = 50, cantidad = nivel.refuerzo, retraso = 0.3 }
    end
    if nivel.bandidos ~= nil then
        enSitio[#enSitio + 1] = { "bandidos", id = "bandidos", lugar = "objetivo", radio = 60, modo = "guard",
            cantidad = nivel.bandidos, si = nivel.chanceBandidos and { "var", "con_bandidos", true } or nil }
    end
    etapas.encargo = {
        al_entrar = {
            { "reloj", id = "plazo", horas = nivel.plazo },
            { "lugar", id = "objetivo", desde = "contacto",
              salas = { "warehouse", "storageunit", "garagestorage", "policestorage", "gunstorestorage", "grocerystorage" },
              respaldo = { "storage", "kitchen", "livingroom" }, min = nivel.min, max = nivel.max },
            { "decir_contacto", texto = ALIJO_PEDIDOS },
            { "diario", texto = "{contacto_nombre} ({ciudad}) te pasa el dato de un alijo en {lugar:objetivo}." },
        },
        salidas = { { ir = "viaje" } },
    }
    etapas.viaje = {
        pista = "Ir al alijo en {lugar:objetivo} (dato de {contacto_nombre}).",
        salidas = salidasDePlazo({ { cuando = { "cerca", "objetivo", 50 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Limpiar {lugar:objetivo} y quedarte con el alijo.",
        al_entrar = enSitio,
        salidas = { { cuando = { "horas", 1.5 }, ir = "final_alijo" } },
    }
    etapas.final_alijo = {
        final = true,
        al_entrar = { { "diario", texto = "Vaciaste el alijo de {lugar:objetivo}. {contacto_nombre} va a tener mas datos pronto." } },
    }
    registrar({
        id = "encargo_alijo_" .. nivelId,
        titulo = "El alijo (" .. nivel.titulo .. ")",
        titulo_menu = "Encargo " .. nivel.titulo .. ": El alijo",
        requiere_alife = true, automatico = false, encargo_nivel = nivelId,
        sorteo = { con_bandidos = { valores = { true, false }, pesos = { 1, 2 } } },
        inicio = "encargo",
        etapas = etapas,
    })
end

-- Los encargos no se acaban: cada vez que pides uno se sortea de nuevo el tipo, el lugar y el objeto.
for nivelId in pairs(NIVELES) do
    for cosaId in pairs(COSAS) do encargoBuscar(cosaId, nivelId) end
    encargoRescate(nivelId)
    encargoAlijo(nivelId)
end

-- ---------------------------------------------------------------------------
-- Ultra dificil: Louisville. Premio legendario a eleccion.
-- ---------------------------------------------------------------------------
local ULTRA = {
    hospital = { titulo = "El hospital de Louisville", nombre_lugar = "el hospital de Louisville",
        salas = { "hospitalroom", "hospitalhallway", "hospitalstorage" }, respaldo = { "medical", "medicalstorage" },
        objeto = "Muestras del hospital", pedido = "En {lugar:objetivo} guardaban muestras de los primeros infectados. Las quiero." },
    militar = { titulo = "El puesto militar", nombre_lugar = "el puesto militar de Louisville",
        salas = { "armystorage", "armytent" }, respaldo = { "policestorage", "gunstorestorage" },
        -- El campamento militar queda al sur de Louisville, fuera del rectangulo del pueblo: sin
        -- esto nunca se encontraba y caia en una comisaria o una armeria.
        cerca_de = { 12540, 4250, 150 },
        objeto = "Maletin militar", pedido = "El ejercito dejo un maletin en {lugar:objetivo}. Nadie que haya ido volvio." },
    mall = { titulo = "El centro comercial", nombre_lugar = "el centro comercial de Louisville",
        salas = { "clothesstore", "shoestore", "jewelrystore", "electronicsstore" }, respaldo = { "grocery", "grocerystorage" },
        -- Los malls de Louisville (dato de la comunidad): el grande en 13538,1273 y uno mas chico
        -- en 13380,3053; se sortea cual. Si no hay tiendas ahi, el grupo de tiendas mas grande.
        cerca_de = { { 13538, 1273, 120 }, { 13380, 3053, 100 } }, agrupado = 50, densidad = { "store*", "mall*" },
        objeto = "Llaves de la boveda del centro comercial", pedido = "En {lugar:objetivo} hay una boveda. Las llaves estan adentro, con miles de muertos." },
    comisaria = { titulo = "La comisaria central", nombre_lugar = "la comisaria central de Louisville",
        salas = { "policeoffice", "policestorage", "policehall" }, respaldo = { "office" },
        objeto = "Expediente sellado", pedido = "En {lugar:objetivo} hay un expediente que explica como empezo todo." },
}

for objetivoId, u in pairs(ULTRA) do
    registrar({
        id = "encargo_ultra_" .. objetivoId,
        titulo = u.titulo .. " (ultra)",
        titulo_menu = "Encargo ULTRA: " .. u.titulo,
        requiere_alife = true, automatico = false, encargo_nivel = "ultra",
        inicio = "encargo",
        etapas = {
            encargo = {
                al_entrar = {
                    { "reloj", id = "plazo", horas = 168 },
                    { "lugar", id = "objetivo", pueblo = "Louisville", nombre = u.nombre_lugar,
                      salas = u.salas, respaldo = u.respaldo, agrupado = u.agrupado, densidad = u.densidad,
                      cerca_de = u.cerca_de },
                    { "decir_contacto", texto = u.pedido },
                    { "diario", texto = "{contacto_nombre} ({ciudad}) te encarga algo casi imposible en {lugar:objetivo}. El premio: lo que elijas." },
                },
                salidas = { { ir = "viaje" } },
            },
            viaje = {
                pista = "Llegar a {lugar:objetivo}. Prepararse para lo peor.",
                salidas = salidasDePlazo({ { cuando = { "cerca", "objetivo", 55 }, ir = "en_sitio" } }),
            },
            en_sitio = {
                pista = "Encontrar " .. string.lower(u.objeto) .. " en {lugar:objetivo}.",
                al_entrar = {
                    { "oleada", lugar = "objetivo", radio = 60, cantidad = { 70, 90 } },
                    { "oleada", lugar = "objetivo", radio = 60, cantidad = { 40, 60 }, retraso = 0.4 },
                    { "bandidos", id = "bandidos", lugar = "objetivo", radio = 65, modo = "guard", cantidad = { 4, 5 } },
                    { "objeto", id = "objeto", lugar = "objetivo", radio = 60,
                      tipo = { "Base.Briefcase", "Base.Bag_Satchel", "Base.Notebook" }, nombre = u.objeto },
                },
                salidas = salidasDePlazo({ { cuando = { "alguien_tiene", "objeto" }, ir = "volver" } }),
            },
            volver = {
                pista = "Volver con {contacto_nombre} en {lugar:contacto}.",
                ancla = "contacto",
                opciones = {
                    { id = "entregar", texto = "Entregarle " .. string.lower(u.objeto) .. " a {contacto_nombre}",
                      requiere = { "objeto", "objeto" }, falta = "No lo llevas encima." },
                },
                salidas = salidasDePlazo({ { cuando = { "eleccion", "entregar" }, ir = "premio" } }),
            },
            premio = {
                pista = "Elegir tu premio (clic derecho cerca de {contacto_nombre}).",
                ancla = "contacto",
                al_entrar = { { "decir_contacto", texto = "Lo lograste. Elige: un arma, un traje o un auto. Lo mejor que tengo." } },
                opciones = {
                    { id = "arma", texto = "Elegir el arma legendaria" },
                    { id = "traje", texto = "Elegir el traje legendario" },
                    { id = "auto", texto = "Elegir el auto legendario" },
                },
                salidas = {
                    { cuando = { "eleccion", "arma" }, ir = "final_arma" },
                    { cuando = { "eleccion", "traje" }, ir = "final_traje" },
                    { cuando = { "eleccion", "auto" }, ir = "final_auto" },
                },
            },
            final_arma = { final = true, al_entrar = {
                { "legendario", clase = "arma", lugar = "contacto", radio = 30 },
                { "diario", texto = "{contacto_nombre} te entrego un arma legendaria." } } },
            final_traje = { final = true, al_entrar = {
                { "legendario", clase = "traje", lugar = "contacto", radio = 30 },
                { "diario", texto = "{contacto_nombre} te entrego un traje legendario." } } },
            final_auto = { final = true, al_entrar = {
                { "legendario", clase = "auto", lugar = "contacto", radio = 30 },
                { "diario", texto = "{contacto_nombre} te dejo las llaves de un auto legendario, estacionado al lado." } } },
            final_vencido = { final = true, al_entrar = {
                { "diario", texto = "Se acabo el plazo del encargo de {contacto_nombre} en Louisville." } } },
        },
    })
end
