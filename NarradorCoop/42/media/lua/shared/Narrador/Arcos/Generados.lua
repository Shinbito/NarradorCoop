-- Encargos generados: un arco por tipo, sin nada fijo. Todo lo que cambia (cliente, lugar,
-- objeto, cantidades, plazo, complicacion, giro, pago y textos) lo sortea el generador
-- (server/Narrador/NarradorGenerador.lua) y llega en las variables del arco ("var:...").
-- Asi los encargos de los misioneros no se repiten nunca igual.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar

-- ---------------------------------------------------------------------------
-- Piezas comunes
-- ---------------------------------------------------------------------------

local function plazo(lista)
    lista[#lista + 1] = { cuando = { "reloj_vencido", "plazo" }, ir = "final_vencido" }
    return lista
end

-- Acciones de una complicacion al llegar al sitio (segun var "comp").
local function complicaciones(lugar)
    return {
        -- Horda: al tiro, alrededor del lugar pero fuera de la vista, corriendo hacia el jugador.
        -- (Antes llegaba con retraso y solo si seguias cerca: si te ibas, nunca aparecia.)
        { "oleada", lugar = lugar, radio = 60, cantidad = "var:zombis_comp", min = 25, max = 40,
          correr = true, al_jugador = true, si = { "var", "comp", "horda" } },
        { "aviso", texto = "Se escucha una horda acercandose a {lugar:" .. lugar .. "}. Vienen corriendo.", si = { "var", "comp", "horda" } },
        { "bandidos", id = "de_paso", lugar = lugar, radio = 70, modo = "hunt", cantidad = { 2, 3 }, retraso = 0.2,
          si = { "var", "comp", "bandidos" } },
        { "bandidos", id = "competencia", lugar = lugar, radio = 60, modo = "guard", cantidad = { 2, 4 },
          si = { "var", "comp", "competencia" } },
        { "aviso", texto = "No eres el unico buscando aca. Hay otro grupo en {lugar:" .. lugar .. "}.",
          si = { "var", "comp", "competencia" } },
        { "oleada", lugar = lugar, radio = 50, cantidad = { 8, 14 }, min = 6, max = 14, si = { "var", "comp", "alarma" } },
        { "aviso", texto = "Suena una alarma en {lugar:" .. lugar .. "}. Todos los muertos de la cuadra la escucharon.",
          si = { "var", "comp", "alarma" } },
    }
end

local function unir(...)
    local r = {}
    for _, lista in ipairs({ ... }) do for _, a in ipairs(lista) do r[#r + 1] = a end end
    return r
end

-- Lo que se repite en el sitio: zombis, refuerzo y bandidos segun el nivel.
local function enSitio(lugar)
    return unir({
        { "oleada", lugar = lugar, radio = 50, cantidad = "var:zombis" },
        { "oleada", lugar = lugar, radio = 50, cantidad = "var:refuerzo", retraso = 0.3, si = { "var_mayor", "refuerzo_n", 0 } },
        { "bandidos", id = "bandidos", lugar = lugar, radio = 60, modo = "guard", cantidad = "var:bandidos",
          si = { "var", "con_bandidos", true } },
        { "marcar_hora", nombre = "llegada" },
    }, complicaciones(lugar))
end

local function finales(extra)
    local f = {
        final_cumplido = { final = true, al_entrar = {
            { "decir_contacto", texto = "var:gracias", si = { "var", "pago_lugar", "contacto" } },
            { "pago_encargo", lugar = "var:pago_lugar", radio = 35 },
            { "cerrar_gen", resultado = "cumplido" },
            { "diario", texto = "var:diario_fin" },
        } },
        final_vencido = { final = true, al_entrar = {
            { "cerrar_gen", resultado = "vencido" },
            { "diario", texto = "Se acabo el plazo del encargo de {contacto_nombre} para {cliente}. Ya no lo necesitan." },
        } },
        final_fallido = { final = true, al_entrar = {
            { "cerrar_gen", resultado = "fallido" },
            { "diario", texto = "El encargo de {contacto_nombre} salio mal. {cliente} se va a enterar." },
        } },
        final_abandonado = { final = true, al_entrar = {
            { "cerrar_gen", resultado = "abandonado" },
            { "diario", texto = "Abandone el encargo de {contacto_nombre}. Lo anoto en su libreta, seguro." },
        } },
    }
    for k, v in pairs(extra or {}) do f[k] = v end
    return f
end

local function inicio(lugarSpec, siguiente)
    local acciones = { { "reloj", id = "plazo", horas = "var:plazo" } }
    if lugarSpec ~= nil then acciones[#acciones + 1] = lugarSpec end
    acciones[#acciones + 1] = { "decir_contacto", texto = "var:pedido" }
    acciones[#acciones + 1] = { "diario", texto = "var:diario_ini" }
    return { al_entrar = acciones, salidas = { { ir = siguiente or "viaje" } } }
end

local OBJETIVO = { "lugar", id = "objetivo", desde = "contacto", salas = "var:salas", respaldo = "var:respaldo",
    min = "var:min", max = "var:max", pueblo = "var:pueblo_obj" }

local function base(id, titulo, etapas, extra)
    local def = {
        id = "encargo_gen_" .. id,
        titulo = "{titulo}",
        titulo_menu = "Encargo generado: " .. titulo,
        requiere_alife = true, automatico = false, encargo_nivel = "generado", generado = id,
        indicador = "encargo",
        inicio = "encargo",
        etapas = etapas,
    }
    for k, v in pairs(extra or {}) do def[k] = v end
    registrar(def)
end

-- Opcion de entregar en el misionero (con bonus de noche si corresponde).
local function entregarAlMisionero(requiere, texto)
    return {
        pista = "Volver con {contacto_nombre} en {lugar:contacto}.",
        ancla = "contacto",
        opciones = {
            { id = "entregar", texto = texto or "Entregarle el encargo a {contacto_nombre}", requiere = requiere,
              falta = "No lo llevas encima.",
              acciones = { { "variable", nombre = "bonus_cond", valor = true,
                             si = { { "var", "cond", "noche" }, { "hora_entre", 22, 5 } } } } },
        },
        salidas = plazo({ { cuando = { "eleccion", "entregar" }, ir = "final_cumplido" } }),
    }
end

-- ---------------------------------------------------------------------------
-- Buscar y Recuerdo: ir a un lugar, encontrar algo y traerlo
-- ---------------------------------------------------------------------------
local function buscar(id, titulo)
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    etapas.viaje = {
        pista = "Ir a {lugar:objetivo}: {objeto_nombre} para {cliente}.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 50 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Encontrar {objeto_nombre} en {lugar:objetivo}.",
        ancla = "objetivo", ancla_grupo = "ocupantes", radio = 25,
        al_entrar = unir(enSitio("objetivo"), {
            { "objeto", id = "objeto", lugar = "objetivo", radio = 50, tipo = "var:objeto_tipo", nombre = "var:objeto_nombre" },
            -- Giro: la casa esta ocupada por una familia.
            { "npcs", id = "ocupantes", lugar = "objetivo", radio = 50, modo = "guard", quietos = true, correa = 5,
              inmortales = true, postura = "friendly", perfiles = { { "ocupante", "var:perfil_ocupante" }, { "ocupante2", "var:perfil_ocupante2" } },
              nombres = "var:nombres_ocupantes", si = { "var", "giro", "ocupada" } },
            { "aviso", texto = "Hay una familia viviendo en {lugar:objetivo}. Te miran con miedo.", si = { "var", "giro", "ocupada" } },
            { "nota", lugar = "objetivo", radio = 50, titulo = "Nota detras de la foto",
              texto = "Para Peggy, con carino. Verano del 89.", si = { "var", "giro", "otra_duena" } },
        }),
        opciones = {
            { id = "permiso", texto = "Pedirles permiso para buscar (darles comida)", requiere = { "comida" }, una_vez = true,
              falta = "No llevas comida para ofrecer.", si = { "var", "giro", "ocupada" },
              dice = { rol = "ocupante", texto = "Busca lo que quieras. Gracias por la comida. De verdad." },
              acciones = { { "variable", nombre = "trato", valor = "bueno" }, { "huella", acto = "compartiste" } } },
            { id = "mala", texto = "Buscar igual, sin preguntar", una_vez = true, si = { "var", "giro", "ocupada" },
              dice = { rol = "ocupante2", texto = "Llevate lo que quieras y vete. Por favor." },
              acciones = { { "variable", nombre = "trato", valor = "malo" }, { "huella", acto = "intimidaste" } } },
            { id = "dejar", texto = "Dejarlos tranquilos e irte", una_vez = true, si = { "var", "giro", "ocupada" },
              acciones = { { "huella", acto = "perdonaste" } } },
        },
        salidas = plazo({
            { cuando = { "eleccion", "dejar" }, ir = "final_dejaste" },
            { cuando = { "alguien_tiene", "objeto" }, ir = "tomado" },
        }),
    }
    etapas.tomado = {
        al_entrar = {
            { "variable", nombre = "bonus_cond", valor = true,
              si = { { "var", "cond", "sigilo" }, { "bajas_menor_que", "objetivo", "var:sigilo_max", 45 } } },
            { "aviso", texto = "La foto no es de {cliente}: atras dice otro nombre.", si = { "var", "giro", "otra_duena" } },
            { "retirar_lejos", grupo = "ocupantes", lugar = "objetivo", radio = 60 },
        },
        salidas = { { ir = "volver" } },
    }
    etapas.volver = entregarAlMisionero({ "objeto", "objeto" })
    -- Giro del paquete que hace ruido: se puede abrir antes de entregar.
    etapas.volver.opciones[#etapas.volver.opciones + 1] = { id = "abrir", texto = "Abrir el paquete antes de entregarlo",
        una_vez = true, si = { "var", "giro", "ruido" }, respuesta = "var:ruido_texto",
        acciones = { { "variable", nombre = "rep_extra", valor = -2 }, { "huella", acto = "curioseaste" },
                     { "recompensa", lugar = "jugador", radio = 10, items = "var:ruido_items", si = { "var", "ruido_premio", true } },
                     { "oleada", lugar = "jugador", radio = 30, cantidad = { 6, 10 }, si = { "var", "ruido_premio", false } } } }
    -- Giro de la foto de otra persona: contarle la verdad al misionero.
    etapas.volver.opciones[#etapas.volver.opciones + 1] = { id = "verdad", texto = "Contarle que la foto es de otra familia",
        una_vez = true, si = { "var", "giro", "otra_duena" }, requiere = { "objeto", "objeto" }, falta = "No la llevas encima.",
        respuesta = "{contacto_nombre} la mira un rato largo. 'Se la llevo igual. Que sepa que alguien la busco.'",
        acciones = { { "variable", nombre = "rep_extra", valor = 2 }, { "huella", acto = "verdad" } } }
    table.insert(etapas.volver.salidas, 1, { cuando = { "eleccion", "verdad" }, ir = "final_cumplido" })
    etapas.final_dejaste = { final = true, al_entrar = {
        { "cerrar_gen", resultado = "perdonado" },
        { "diario", texto = "No quise sacar a una familia de su casa por {objeto_nombre}. {contacto_nombre} lo va a entender. Creo." },
    } }
    base(id, titulo, etapas)
end

buscar("buscar", "Buscar algo")
buscar("recuerdo", "Un recuerdo")

-- ---------------------------------------------------------------------------
-- Recolectar: juntar cantidad de algo comun y llevarselo
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(nil, "volver")
    etapas.volver = entregarAlMisionero({ "items", "var:recolectar_tipos", "var:cantidad" },
        "Entregar {cantidad} {recolectar_nombre} a {contacto_nombre}")
    etapas.volver.pista = "Juntar {cantidad} {recolectar_nombre} y llevarselos a {contacto_nombre} en {lugar:contacto}."
    etapas.volver.opciones[1].falta = "Te faltan: tienen que ser {cantidad} {recolectar_nombre}."
    base("recolectar", "Juntar cosas", etapas)
end

-- ---------------------------------------------------------------------------
-- Entregar: llevar un paquete a alguien de otro lugar
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    table.insert(etapas.encargo.al_entrar, 2, { "dar_objeto", id = "paquete", tipo = "var:objeto_tipo", nombre = "var:objeto_nombre" })
    etapas.viaje = {
        pista = "Llevarle {objeto_nombre} a {cliente} en {lugar:objetivo}.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 45 }, ir = "en_destino" } }),
    }
    etapas.en_destino = {
        pista = "Encontrar a {cliente} en {lugar:objetivo} y entregarle el paquete.",
        ancla = "objetivo", ancla_grupo = "cliente", radio = 20,
        al_entrar = unir({
            { "npcs", id = "cliente", lugar = "objetivo", radio = 50, modo = "guard", quietos = true, correa = 4,
              inmortales = true, postura = "friendly", perfiles = { { "cliente", "var:perfil_npc" } }, nombres = "var:nombres_npc" },
            { "oleada", lugar = "objetivo", radio = 50, cantidad = "var:zombis", min = 15, max = 30 },
        }, complicaciones("objetivo")),
        opciones = {
            { id = "entregar", texto = "Entregarle el paquete a {cliente}", requiere = { "objeto", "paquete" },
              falta = "No llevas el paquete.", dice = { rol = "cliente", texto = "var:gracias_cliente" } },
        },
        salidas = plazo({ { cuando = { "eleccion", "entregar" }, ir = "final_cumplido" } }),
    }
    etapas.final_cumplido.al_entrar[#etapas.final_cumplido.al_entrar + 1] =
        { "retirar_lejos", grupo = "cliente", lugar = "objetivo", radio = 50, retraso = 0.3 }
    base("entregar", "Llevar un paquete", etapas)
end

-- ---------------------------------------------------------------------------
-- Rescate: alguien atrapado; hay que sacarlo vivo
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    etapas.viaje = {
        pista = "Rescatar a {cliente}, atrapado en {lugar:objetivo}.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 45 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Mantener vivo a {cliente} en {lugar:objetivo} hasta que pase el peligro.",
        charla = { grupo = "rehen", lista = "rehen", radio = 15, cada = 0.15 },
        al_entrar = unir({
            { "npcs", id = "rehen", lugar = "objetivo", radio = 50, modo = "guard", quietos = true, correa = 3,
              postura = "friendly", perfiles = { { "rehen", "var:perfil_npc" } }, nombres = "var:nombres_npc", salud = 150 },
        }, enSitio("objetivo")),
        salidas = {
            { cuando = { "mato_jugador", "rehen" }, ir = "final_muerto" },
            { cuando = { "todos_muertos", "rehen" }, ir = "final_muerto" },
            { cuando = { { "grupo_listo", "rehen" }, { "horas", 1 }, { "var", "giro", "no_quiere" } }, ir = "no_quiere" },
            { cuando = { { "grupo_listo", "rehen" }, { "horas", 1 } }, ir = "rescatado" },
        },
    }
    etapas.no_quiere = {
        pista = "{cliente} no quiere volver. Decidir que hacer.",
        ancla = "objetivo", ancla_grupo = "rehen", radio = 25,
        al_entrar = { { "decir", grupo = "rehen", rol = "rehen", texto = "No vuelvo. Alla me mandaron a buscar esto y me dejaron solo. Me quedo aca." } },
        opciones = {
            { id = "convencer", texto = "Convencerlo: alla tiene gente que lo espera", una_vez = true,
              dice = { rol = "rehen", texto = "...Ya. Esta bien. Pero si me vuelven a mandar solo, me voy." },
              acciones = { { "huella", acto = "convenciste" } } },
            { id = "obligar", texto = "Obligarlo a volver", una_vez = true,
              dice = { rol = "rehen", texto = "Ya, ya. Vamos. Pero no me toques." },
              acciones = { { "huella", acto = "obligaste" }, { "variable", nombre = "rep_extra", valor = 1 } } },
            { id = "dejar", texto = "Dejarlo ir por su cuenta", una_vez = true,
              dice = { rol = "rehen", texto = "Gracias. De verdad. Dile a quien te mando que estoy vivo." },
              acciones = { { "huella", acto = "perdonaste" }, { "variable", nombre = "rep_extra", valor = -2 } } },
        },
        salidas = {
            { cuando = { "todos_muertos", "rehen" }, ir = "final_muerto" },
            { cuando = { "o", { "eleccion", "convencer" }, { "eleccion", "obligar" }, { "eleccion", "dejar" } }, ir = "rescatado" },
        },
    }
    etapas.rescatado = {
        al_entrar = {
            { "decir", grupo = "rehen", rol = "rehen", texto = "Voy con {contacto_nombre}. Avisale que estoy bien.",
              si = { "no", { "eleccion", "dejar" } } },
            { "retirar_lejos", grupo = "rehen", lugar = "objetivo", radio = 50, retraso = 0.5 },
        },
        salidas = { { ir = "volver" } },
    }
    etapas.volver = entregarAlMisionero(nil, "Contarle a {contacto_nombre} que {cliente} esta a salvo")
    etapas.final_muerto = { final = true, al_entrar = {
        { "cerrar_gen", resultado = "muerto" },
        { "diario", texto = "{cliente} no salio de {lugar:objetivo}. No hay forma linda de contarselo a {contacto_nombre}." },
    } }
    base("rescate", "Un rescate", etapas)
end

-- ---------------------------------------------------------------------------
-- Investigar: averiguar que paso con alguien
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    etapas.viaje = {
        pista = "Averiguar que paso con {buscado} en {lugar:objetivo}.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 45 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Buscar rastros de {buscado} en {lugar:objetivo}.",
        al_entrar = unir(enSitio("objetivo"), {
            -- Vivo y escondido.
            { "npcs", id = "buscado", lugar = "objetivo", radio = 50, modo = "guard", quietos = true, correa = 3,
              postura = "friendly", inmortales = true, perfiles = { { "buscado", "var:perfil_buscado" } }, nombres = "var:nombres_buscado",
              si = { "var", "giro", "vivo" } },
            -- Convertido: su zombi y su carnet.
            { "zombi_en", lugar = "objetivo", radio = 50, si = { "var", "giro", "convertido" } },
            { "objeto", id = "carnet", lugar = "objetivo", radio = 50, tipo = { "Base.IDcard", "Base.Wallet", "Base.Notebook" },
              nombre = "Identificacion de {buscado}", si = { "var", "giro", "convertido" } },
            -- Se fue: deja una nota con su nuevo paradero.
            { "lugar", id = "segundo", desde = "objetivo", salas = { "livingroom", "kitchen", "motelroom", "church" },
              min = 150, max = 500, si = { "var", "giro", "se_fue" } },
            { "nota", lugar = "objetivo", radio = 50, titulo = "Nota de {buscado}",
              texto = "Si alguien me busca: me fui a {lugar:segundo}. Aca ya no se podia. -{buscado}", si = { "var", "giro", "se_fue" } },
        }),
        salidas = plazo({
            { cuando = { { "var", "giro", "vivo" }, { "grupo_listo", "buscado" }, { "horas", 0.4 } }, ir = "encontrado" },
            { cuando = { { "var", "giro", "convertido" }, { "alguien_tiene", "carnet" } }, ir = "volver_triste" },
            { cuando = { { "var", "giro", "se_fue" }, { "horas", 0.3 } }, ir = "segundo_viaje" },
        }),
    }
    etapas.segundo_viaje = {
        pista = "Seguir la nota de {buscado} hasta {lugar:segundo}.",
        al_entrar = { { "mapa_grupo", lugar = "segundo" } },
        salidas = plazo({ { cuando = { "cerca", "segundo", 40 }, ir = "en_segundo" } }),
    }
    etapas.en_segundo = {
        pista = "Encontrar a {buscado} en {lugar:segundo}.",
        al_entrar = {
            { "npcs", id = "buscado", lugar = "segundo", radio = 50, modo = "guard", quietos = true, correa = 3,
              postura = "friendly", inmortales = true, perfiles = { { "buscado", "var:perfil_buscado" } }, nombres = "var:nombres_buscado" },
            { "oleada", lugar = "segundo", radio = 50, cantidad = { 6, 12 } },
        },
        salidas = plazo({ { cuando = { { "grupo_listo", "buscado" }, { "horas", 0.4 } }, ir = "encontrado" } }),
    }
    etapas.encontrado = {
        al_entrar = {
            { "decir", grupo = "buscado", rol = "buscado", texto = "Me buscaba {cliente}? De verdad? Dile que estoy vivo. Que voy cuando pueda." },
            { "retirar_lejos", grupo = "buscado", lugar = "objetivo", radio = 60, retraso = 0.5 },
            { "variable", nombre = "hallazgo", valor = "vivo" },
        },
        salidas = { { ir = "volver" } },
    }
    etapas.volver = entregarAlMisionero(nil, "Contarle a {contacto_nombre} que {buscado} esta vivo")
    etapas.volver_triste = {
        pista = "Volver con {contacto_nombre} con la identificacion de {buscado}.",
        ancla = "contacto",
        opciones = {
            { id = "verdad", texto = "Contarle la verdad y darle la identificacion", requiere = { "objeto", "carnet" }, falta = "No llevas la identificacion.",
              acciones = { { "huella", acto = "verdad" } } },
            { id = "mentir", texto = "Decirle que no lo encontraste",
              acciones = { { "huella", acto = "mentiste" }, { "variable", nombre = "diario_fin",
                  valor = "Le dije a {contacto_nombre} que no encontre a {buscado}. Guarde su identificacion. Algun dia se lo voy a tener que contar." } } },
        },
        salidas = plazo({ { cuando = { "o", { "eleccion", "verdad" }, { "eleccion", "mentir" } }, ir = "final_cumplido" } }),
    }
    base("investigar", "Averiguar que paso", etapas)
end

-- ---------------------------------------------------------------------------
-- Alijo: limpiar un lugar y quedarse con lo que hay (el pago esta en el sitio)
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    etapas.viaje = {
        pista = "Ir al alijo de {lugar:objetivo} (dato de {contacto_nombre}).",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 50 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Limpiar {lugar:objetivo} y quedarte con el alijo.",
        al_entrar = enSitio("objetivo"),
        salidas = { { cuando = { "horas", 1.2 }, ir = "final_cumplido" } },
    }
    base("alijo", "Un alijo", etapas)
end

-- ---------------------------------------------------------------------------
-- Contrarreloj: llevar un remedio a alguien antes de que sea tarde
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    etapas.viaje = {
        pista = "Llevar {remedio_nombre} a {cliente} en {lugar:objetivo} antes de que sea tarde.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 40 }, ir = "en_casa" } }),
    }
    etapas.en_casa = {
        pista = "Darle {remedio_nombre} a {cliente} en {lugar:objetivo}.",
        ancla = "objetivo", ancla_grupo = "paciente", radio = 20,
        al_entrar = {
            { "npcs", id = "paciente", lugar = "objetivo", radio = 50, modo = "guard", quietos = true, correa = 2,
              inmortales = true, postura = "friendly", perfiles = { { "paciente", "var:perfil_npc" } }, nombres = "var:nombres_npc" },
            { "oleada", lugar = "objetivo", radio = 50, cantidad = "var:zombis", min = 18, max = 30 },
        },
        opciones = {
            { id = "dar", texto = "Darle {remedio_nombre}", requiere = { "items", "var:remedio_tipos", 1 },
              falta = "No llevas {remedio_nombre}.",
              dice = { rol = "paciente", texto = "Pense que nadie iba a venir. Gracias. De verdad." },
              acciones = { { "variable", nombre = "rep_extra", valor = 2, si = { "reloj_resta", "plazo", 0.5 } },
                           { "variable", nombre = "bonus_cond", valor = true, si = { "reloj_resta", "plazo", 0.5 } } } },
        },
        salidas = plazo({ { cuando = { "eleccion", "dar" }, ir = "final_cumplido" } }),
    }
    etapas.final_vencido.al_entrar[2] = { "diario", texto = "No llegue a tiempo con {remedio_nombre}. {cliente} no aguanto. {contacto_nombre} ya lo sabe." }
    etapas.final_cumplido.al_entrar[#etapas.final_cumplido.al_entrar + 1] =
        { "retirar_lejos", grupo = "paciente", lugar = "objetivo", radio = 50, retraso = 1 }
    base("contrarreloj", "Contrarreloj", etapas)
end

-- ---------------------------------------------------------------------------
-- Limpieza: vaciar un edificio de zombis
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    etapas.viaje = {
        pista = "Ir a {lugar:objetivo} y limpiarlo.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 55 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Limpiar {lugar:objetivo}: van {bajas:objetivo} de {bajas_meta}.",
        al_entrar = unir(enSitio("objetivo"), {
            { "zombi_jefe", lugar = "objetivo", radio = 50, outfit = "var:jefe_outfit", si = { "var", "con_jefe", true } },
            { "aviso", texto = "Entre los muertos de {lugar:objetivo} hay uno mas grande que los demas.", si = { "var", "con_jefe", true } },
        }),
        salidas = plazo({ { cuando = { "bajas_en", "objetivo", "var:bajas_meta", 45 }, ir = "limpio" } }),
    }
    etapas.limpio = {
        al_entrar = { { "aviso", texto = "{lugar:objetivo} quedo limpio. Hay que avisarle a {contacto_nombre}." } },
        salidas = { { ir = "volver" } },
    }
    etapas.volver = entregarAlMisionero(nil, "Avisarle a {contacto_nombre} que {lugar:objetivo} quedo limpio")
    table.insert(etapas.final_cumplido.al_entrar, { "punto_seguro", lugar = "objetivo" })
    base("limpieza", "Limpieza", etapas)
end

-- ---------------------------------------------------------------------------
-- Reconocimiento: pasar por varios puntos en orden y anotar lo que hay
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    local SALAS = { "warehouse", "grocery", "gasstore", "church", "classroom", "office", "motelroom", "livingroom" }
    etapas.encargo = inicio({ "lugar", id = "p1", desde = "contacto", salas = SALAS, min = "var:min", max = "var:max" }, "punto1")
    for k = 1, 4 do
        local id = "p" .. k
        local acciones = {
            { "oleada", lugar = id, radio = 40, cantidad = { 6, 12 }, si = { "var", "evento_" .. k, "oleada" } },
            { "objeto", id = "hallazgo" .. k, lugar = id, radio = 40, tipo = "var:hallazgo_tipo", nombre = "Algo que encontraste",
              si = { "var", "evento_" .. k, "objeto" } },
            { "aviso", texto = "En {lugar:" .. id .. "} hay algo tirado que vale la pena.", si = { "var", "evento_" .. k, "objeto" } },
            { "bandidos", id = "vigias" .. k, lugar = id, radio = 50, modo = "hunt", cantidad = { 1, 2 }, retraso = 0.1,
              si = { "var", "evento_" .. k, "bandidos" } },
        }
        if k < 4 then
            acciones[#acciones + 1] = { "lugar", id = "p" .. (k + 1), desde = id, salas = SALAS, min = 150, max = 450,
                si = { "var_mayor", "puntos", k } }
            acciones[#acciones + 1] = { "mapa_grupo", lugar = "p" .. (k + 1), si = { "var_mayor", "puntos", k } }
        end
        local salidas = {}
        if k < 4 then
            salidas[#salidas + 1] = { cuando = { { "eleccion", "anotar" }, { "var_mayor", "puntos", k } }, ir = "punto" .. (k + 1) }
        end
        salidas[#salidas + 1] = { cuando = { "eleccion", "anotar" }, ir = "volver" }
        etapas["punto" .. k] = {
            pista = "Pasar por {lugar:" .. id .. "} y anotar lo que ves (punto " .. k .. " de {puntos}).",
            ancla = id, radio = 25,
            opciones = { { id = "anotar", texto = "Anotar lo que ves", acciones = acciones } },
            salidas = plazo(salidas),
        }
    end
    etapas.volver = entregarAlMisionero(nil, "Entregarle tus anotaciones a {contacto_nombre}")
    base("reconocimiento", "Reconocimiento", etapas)
end

-- ---------------------------------------------------------------------------
-- Defensa: aguantar oleadas en un punto del misionero
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio({ "lugar_cerca", id = "objetivo", de = "contacto", distancia = 6 }, "espera")
    local oleadas = {}
    for k = 1, 6 do
        oleadas[#oleadas + 1] = { "oleada", lugar = "objetivo", radio = 70, cantidad = "var:zombis", min = 20, max = 35,
            retraso = "var:ret_" .. k, si = { "var_mayor", "n_oleadas", k - 1 } }
        oleadas[#oleadas + 1] = { "aviso", texto = "Viene otra oleada hacia {lugar:objetivo}.", retraso = "var:ret_" .. k,
            si = { "var_mayor", "n_oleadas", k - 1 } }
    end
    etapas.espera = {
        pista = "Ir a {lugar:objetivo} y prepararse para aguantar.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 30 }, ir = "defensa" } }),
    }
    etapas.defensa = {
        pista = "Aguantar en {lugar:objetivo} hasta que pasen las oleadas. No alejarse.",
        al_entrar = oleadas,
        salidas = {
            { cuando = { "ausente", "objetivo", 60, 0.2 }, ir = "final_fallido" },
            { cuando = { "horas", "var:horas_defensa" }, ir = "final_cumplido" },
        },
    }
    base("defensa", "Defensa", etapas)
end

-- ---------------------------------------------------------------------------
-- Posta: un paquete pasa de misionero en misionero
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(nil, "tramo2")
    table.insert(etapas.encargo.al_entrar, 2, { "dar_objeto", id = "paquete", tipo = "var:objeto_tipo", nombre = "var:objeto_nombre" })
    for k = 2, 4 do
        local id = "c" .. k
        local salidas = {}
        if k < 4 then
            salidas[#salidas + 1] = { cuando = { { "eleccion", "pasar" }, { "var_mayor", "n_posta", k } }, ir = "tramo" .. (k + 1) }
        end
        salidas[#salidas + 1] = { cuando = { "eleccion", "pasar" }, ir = "final_cumplido" }
        etapas["tramo" .. k] = {
            pista = "Llevar el paquete a {nombre_" .. id .. "} en {lugar:" .. id .. "}.",
            ancla = id,
            al_entrar = {
                { "mapa_grupo", lugar = id },
                { "bandidos", id = "asalto" .. k, lugar = "jugador", radio = 80, modo = "hunt", cantidad = { 2, 3 }, retraso = 1,
                  si = { "var", "asalto_" .. k, true } },
            },
            opciones = {
                { id = "pasar", texto = "Entregarle el paquete a {nombre_" .. id .. "}", requiere = { "objeto", "paquete" },
                  consume = false, falta = "No llevas el paquete.",
                  acciones = { { "decir_misionero", contacto = "var:id_" .. id, texto = "var:recibe_" .. id } } },
            },
            salidas = plazo(salidas),
        }
    end
    table.insert(etapas.final_cumplido.al_entrar, 1, { "quitar_objeto", id = "paquete" })
    table.insert(etapas.final_cumplido.al_entrar, 2, { "decir_misionero", contacto = "var:ultimo", texto = "var:remate", retraso = 0.05 })
    base("posta", "La posta", etapas)
end

-- ---------------------------------------------------------------------------
-- Instalar: dejar algo armado en un lugar (barricada, generador, alarma)
-- ---------------------------------------------------------------------------
do
    local etapas = finales()
    etapas.encargo = inicio(OBJETIVO)
    etapas.viaje = {
        pista = "Llevar lo necesario para {instalar_nombre} a {lugar:objetivo}.",
        salidas = plazo({ { cuando = { "cerca", "objetivo", 40 }, ir = "en_sitio" } }),
    }
    etapas.en_sitio = {
        pista = "Instalar {instalar_nombre} en {lugar:objetivo} (llevar {instalar_lista}).",
        ancla = "objetivo", radio = 20,
        al_entrar = enSitio("objetivo"),
        opciones = {
            { id = "instalar", texto = "Instalar {instalar_nombre}", requiere = { "items_varios", "var:instalar_req" },
              falta = "Te falta material: {instalar_lista}.",
              acciones = { { "variable", nombre = "bonus_cond", valor = true,
                             si = { { "var", "cond", "sigilo" }, { "bajas_menor_que", "objetivo", "var:sigilo_max", 45 } } } } },
        },
        salidas = plazo({ { cuando = { "eleccion", "instalar" }, ir = "instalado" } }),
    }
    etapas.instalado = {
        al_entrar = { { "aviso", texto = "Quedo instalado. {contacto_nombre} te espera para pagarte." } },
        salidas = { { ir = "volver" } },
    }
    etapas.volver = entregarAlMisionero(nil, "Contarle a {contacto_nombre} que quedo instalado")
    base("instalar", "Instalar algo", etapas)
end

-- Charla de los vecinos que se quedaron a vivir cerca de un misionero.
Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.vecinos = {
    { "vecino", "Aca estoy bien. Hay gente, hay trabajo, hay alguien que anota todo." },
    { "vecino", "Si no fuera por la persona que me ayudo, no estaria contando el cuento." },
    { "vecino", "Arregle la ventana del lado. Ahora entra menos frio. Y menos muertos." },
    { "vecino", "Antes de todo esto yo tenia un trabajo normal. Ahora tengo un trabajo raro. Es mejor." },
    { "vecino", "Cuando llueve me acuerdo de mi casa. Despues se me pasa." },
    { "vecino", "Le debo una a quien me trajo. Bueno, le debo varias." },
    { "vecino", "Dicen que en Louisville hay de todo. Yo no voy ni amarrado." },
    { "vecino", "Si necesitas algo y yo lo tengo, pide nomas." },
    { "vecino", "Cuento los dias con rayitas en la pared. Ya no me alcanza la pared." },
    { "vecino", "Hoy no paso nada. Esos son los mejores dias." },
}
