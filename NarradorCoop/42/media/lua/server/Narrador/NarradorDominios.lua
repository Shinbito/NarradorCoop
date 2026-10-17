-- Narrador Co-op (servidor): quien manda en cada ciudad (ver shared/Narrador/NarradorDominiosDefs.lua).
-- Memoria "dominio_<id>" = "bandido" o "nuevo" (sin nada, el misionero de siempre). Al cambiar:
--   * El contacto de esa ciudad pasa a ser otro (nombre, perfil, frases, rangos de confianza y
--     perfil del diario). Su NPC se retira y aparece el nuevo la proxima vez que alguien pasa.
--   * Con un capitan (bandido): no rechaza a nadie por su fama en Knox, no da capitulos de
--     historia ni la cura, y todas sus ofertas son encargos inmorales (Arcos/Inmorales.lua).
-- El campamento, los comerciantes y la confianza siguen siendo de la ciudad.
-- Si el misionero nuevo murio antes (Valentina, la Hermana Lucia), lo reemplaza un Bell vivo de
-- tu refugio o un mercader de paso (D.reemplazo, memoria "nuevo_<id>").
--
-- Para la conquista: { "condenar_misionero", contacto = "muldraugh" } le quita al misionero la
-- inmortalidad; cuando muere, la ciudad pasa al dominio indicado (bandido por defecto) y queda la
-- memoria "misionero_muerto_<id>" (condicion { "misionero_muerto", "muldraugh" }).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDominiosDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorReputacion"
require "Narrador/NarradorGenerador"
require "Narrador/NarradorCuraServer"
require "Narrador/NarradorCampamentosDefs"
require "Narrador/NarradorBell"
require "Narrador/NarradorCaidos"

local DD, Mundo, Motor, C = Narrador.DominiosDefs, Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local R, G = Narrador.Reputacion, Narrador.Generador

local D = Narrador.Dominios or {}
Narrador.Dominios = D

D.CAMPOS = { "rol", "nombre", "apellido", "perfil", "oficio", "frases", "frases_eduardo" }

-- Lo que tenia cada misionero (se guarda una vez, antes de cualquier cambio).
D.ORIGINAL = D.ORIGINAL or {}
for _, c in ipairs(C.LISTA) do
    if D.ORIGINAL[c.id] == nil then
        local o = {}
        for _, k in ipairs(D.CAMPOS) do o[k] = c[k] end
        o.rangos = R.RANGOS ~= nil and R.RANGOS[c.id] or nil
        o.frases_knox = C.FRASES_KNOX[c.id]
        D.ORIGINAL[c.id] = o
    end
end

function D.dominio(id)
    local m = Motor.estado().memoria
    local d = m["dominio_" .. tostring(id)]
    if d == "bandido" or d == "nuevo" then return d end
    return "mision"
end

function D.esBandido(id) return D.dominio(id) == "bandido" end

-- ---------------------------------------------------------------------------
-- Reemplazos de los misioneros nuevos que murieron antes (ver DD.NUEVO_MURIO)
-- ---------------------------------------------------------------------------

-- Quien reemplaza al misionero nuevo de esa ciudad: nil (el de siempre), "bell_<rol>" o
-- "forastero". Con guardar = true queda en la memoria y el Bell deja el refugio.
function D.reemplazo(id, guardar)
    local m = Motor.estado().memoria
    if m["nuevo_" .. tostring(id)] ~= nil then return m["nuevo_" .. tostring(id)] end
    local regla = DD.NUEVO_MURIO[id]
    if regla == nil or m[regla.murio[1]] ~= regla.murio[2] then return nil end
    local tomados = {}
    for _, c in ipairs(C.LISTA) do
        local otro = m["nuevo_" .. c.id]
        if otro ~= nil then tomados[otro] = true end
    end
    local vivos = {}
    for _, rol in ipairs(Narrador.Bell.vivos()) do vivos[rol] = true end
    local elegido = "forastero"
    for _, rol in ipairs(DD.PREFERENCIA_BELL[id] or Narrador.Bell.ORDEN) do
        if vivos[rol] and not tomados["bell_" .. rol] then elegido = "bell_" .. rol; break end
    end
    if guardar then
        m["nuevo_" .. tostring(id)] = elegido
        local rol = string.match(elegido, "^bell_(.+)$")
        if rol ~= nil then Narrador.Bell.sacar(rol) end
        Mundo.log("en " .. tostring(id) .. " el misionero nuevo es " .. elegido)
    end
    return elegido
end

-- Datos del forastero: nombre y perfil de un mercader de paso (uno al azar, fijo por ciudad).
local function forastero(id)
    local K = Narrador.CampamentosDefs
    local m = Motor.estado().memoria
    local i = tonumber(m["mercader_misionero_" .. tostring(id)])
    if i == nil or K.MERCADERES[i] == nil then
        i = Mundo.azar(#K.MERCADERES)
        m["mercader_misionero_" .. tostring(id)] = i
    end
    local merc, d = K.MERCADERES[i], {}
    for k, v in pairs(DD.REEMPLAZOS.forastero) do d[k] = v end
    d.nombre, d.apellido, d.perfil = merc.nombre[1], merc.nombre[2], merc.perfil
    d.presentacion = merc.nombre[1] .. " " .. merc.nombre[2] .. ", que andaba de paso"
    return d
end

local function datosNuevo(id)
    local r = D.reemplazo(id, false)
    if r == "forastero" then return forastero(id) end
    if r ~= nil then return DD.REEMPLAZOS[r] end
    return DD.NUEVOS[id]
end

-- Como se nombra en los textos al misionero nuevo de una ciudad: {nuevo:muldraugh}.
function D.presentacion(id)
    local d = datosNuevo(id)
    return d ~= nil and (d.presentacion or d.nombre) or "alguien nuevo"
end
Motor.plantillas.nuevo = function(inst, id) return D.presentacion(id) end

local function datos(id, d)
    if d == "bandido" then return DD.CAPITANES[id] end
    if d == "nuevo" then return datosNuevo(id) end
    return nil
end

-- Pone en C.LISTA los datos de quien manda hoy en cada ciudad.
function D.aplicar()
    for _, c in ipairs(C.LISTA) do
        local o = D.ORIGINAL[c.id]
        local d = datos(c.id, D.dominio(c.id))
        for _, k in ipairs(D.CAMPOS) do
            if d ~= nil then c[k] = d[k] else c[k] = o[k] end
        end
        if R.RANGOS ~= nil then R.RANGOS[c.id] = (d ~= nil and d.rangos) or o.rangos end
        C.FRASES_KNOX[c.id] = (d ~= nil and (d.frases_knox or {})) or o.frases_knox
    end
end

-- Cambia el dominio de una ciudad y retira al NPC de antes (el nuevo aparece con C.reponer).
function D.cambiar(id, dominio)
    local m = Motor.estado().memoria
    m["dominio_" .. tostring(id)] = dominio ~= "mision" and dominio or nil
    if dominio == "nuevo" then D.reemplazo(id, true) end
    local e = C.estado(id)
    if e.uid ~= nil then pcall(Mundo.retirar, e.uid) end
    e.uid, e.pidiendo, e.faltas, e.charla, e.condenado = nil, nil, 0, nil, nil
    e.desbloqueado = true
    D.aplicar()
    Mundo.log("dominio de " .. tostring(id) .. ": " .. tostring(dominio))
    Motor.publicar()
end

-- ---------------------------------------------------------------------------
-- El misionero puede morir durante la conquista
-- ---------------------------------------------------------------------------
D.BANDERAS_CONDENADO = { persistent = true, stationary = false, invulnerable = false, leashRadius = 12 }

local protegerOriginal = C.proteger
function C.proteger(e)
    if e ~= nil and e.condenado then
        if e.uid ~= nil then pcall(Mundo.banderas, e.uid, D.BANDERAS_CONDENADO, { x = e.x, y = e.y, z = e.z or 0 }) end
        return
    end
    return protegerOriginal(e)
end

local alMorirOriginal = C.alMorir
function C.alMorir(e, c, uid)
    local condenado, dominio = e.condenado, e.condenado_dominio
    alMorirOriginal(e, c, uid)
    if condenado then
        Motor.estado().memoria["misionero_muerto_" .. c.id] = true
        -- Al diario: un misionero de siempre que muere en la conquista murio por lo que hiciste.
        -- Los capitanes que caen en la reconquista no van.
        if D.dominio(c.id) == "mision" then pcall(Narrador.Caidos.anotarContacto, c.rol, true) end
        e.condenado_dominio = nil
        D.cambiar(c.id, dominio or "bandido")
    end
end

-- {"condenar_misionero", contacto, dominio = "bandido"}
Motor.inmediatas.condenar_misionero = function(inst, a)
    local id = tostring(a.contacto or inst.vars.contacto)
    local e = C.estado(id)
    e.desbloqueado = true
    e.condenado, e.condenado_dominio = true, a.dominio or "bandido"
    pcall(C.proteger, e)
    return true
end

-- {"cambiar_dominio", contacto, dominio}
Motor.inmediatas.cambiar_dominio = function(inst, a)
    D.cambiar(tostring(a.contacto), a.dominio or "mision")
    return true
end

-- {"indultar_misionero", contacto}: vuelve a ser inmortal (la conquista quedo a medias).
Motor.inmediatas.indultar_misionero = function(inst, a)
    local e = C.estado(tostring(a.contacto or inst.vars.contacto))
    e.condenado, e.condenado_dominio = nil, nil
    pcall(C.proteger, e)
    return true
end

-- {"disolver_residentes", id}: los residentes de una historia (Sous en su base) dejan de serlo
-- y se retiran del mundo (la conquista los vuelve a poner como defensores).
Motor.inmediatas.disolver_residentes = function(inst, a)
    local st = Motor.estado()
    local r = st.residentes[tostring(a.id)]
    if r == nil then return true end
    for uid, m in pairs(r.miembros or {}) do
        if not m.muerto then pcall(Mundo.retirar, uid) end
    end
    st.residentes[tostring(a.id)] = nil
    return true
end

-- {"incendiar", lugar, radio}: prende fuego alrededor del lugar (cuando esta cargado).
Motor.diferidas.incendiar = function(inst, p, l)
    local ok = Mundo.incendiar(l.x, l.y, l.z or 0, tonumber(p.radio) or 2)
    if not ok then Mundo.log("no se pudo prender fuego en " .. tostring(l.etiqueta)) end
    return true
end

-- {"desinmunizar", grupo}: los del grupo dejan de ser inmunes (pueden morir de verdad).
Motor.inmediatas.desinmunizar = function(inst, a)
    local g = inst.grupos[a.grupo]
    for _, uid in pairs(g ~= nil and g.roles or {}) do C.inmunes()[tostring(uid)] = nil end
    return true
end

-- {"confianza_todos", cantidad}: sube la confianza con todos los de las ciudades (la reconquista).
Motor.inmediatas.confianza_todos = function(inst, a)
    local grupos, vistos = {}, {}
    if inst.vars.dueno ~= nil then grupos[1] = inst.vars.dueno end
    for _, p in ipairs(Mundo.jugadores()) do
        local g = Mundo.grupoDe(p)
        if not vistos[g] then vistos[g] = true; grupos[#grupos + 1] = g end
    end
    for _, g in ipairs(grupos) do
        for _, c in ipairs(C.LISTA) do pcall(R.sumar, g, c.id, tonumber(a.cantidad) or 100, "trajiste la paz a Knox") end
    end
    return true
end

-- Eduardo vuelve al campamento de la Chela cuando cae (C.REGRESOS), pero solo si la Chela
-- sigue mandando en West Point: si no, ese campamento ya no es su casa (o el es el misionero).
local regresosOriginal = C.revisarRegresos
function C.revisarRegresos()
    if D.dominio("westpoint") ~= "mision" then return end
    return regresosOriginal()
end

-- {"misionero_muerto", id}
Motor.condiciones.misionero_muerto = function(inst, c)
    return Motor.estado().memoria["misionero_muerto_" .. tostring(c[2])] == true
end

-- {"dominio", id, "bandido"}
Motor.condiciones.dominio = function(inst, c)
    return D.dominio(tostring(c[2])) == tostring(c[3])
end

-- ---------------------------------------------------------------------------
-- Lo que cambia con un capitan
-- ---------------------------------------------------------------------------
D.TIPOS_INMORALES = {
    tributo = { titulo = "Cobrar tributo", donde = "una casa con sobrevivientes" },
    testigo = { titulo = "Silenciar a un testigo", donde = "donde se esconde el testigo" },
    quemar = { titulo = "Quemar un refugio", donde = "un refugio de sobrevivientes" },
    fugitivo = { titulo = "Cazar a un fugitivo", donde = "el rastro del fugitivo" },
}
D.ORDEN_INMORALES = { "tributo", "testigo", "quemar", "fugitivo" }

function D.generarInmoral(contactoId, nivel)
    local tipo = D.ORDEN_INMORALES[Mundo.azar(#D.ORDEN_INMORALES)]
    local t = D.TIPOS_INMORALES[tipo]
    local c = C.def(contactoId)
    if nivel == "ultra" then nivel = "dificil" end
    local G2 = Narrador.InmoralesGanancia or {}
    return { def = "inmoral_" .. tipo, vars = { nivel = nivel, tipo_inmoral = tipo, ganancia = G2[nivel] or 3 }, lugares = { contacto = C.lugar(contactoId) },
        titulo = t.titulo, tipo = "inmoral_" .. tipo,
        resumen = { "Encargo de " .. C.nombreCompleto(c) .. ": " .. string.lower(t.titulo), "Donde: " .. t.donde,
            "Pago: botin " .. nivel, "Knox: -5 (gente inocente)" } }
end

local generarOriginal, ultraOriginal = G.generar, G.generarUltra
function G.generar(contactoId, nivel, grupo, tipoForzado)
    if D.esBandido(contactoId) then return D.generarInmoral(contactoId, nivel) end
    return generarOriginal(contactoId, nivel, grupo, tipoForzado)
end
function G.generarUltra(contactoId)
    if D.esBandido(contactoId) then return D.generarInmoral(contactoId, "ultra") end
    return ultraOriginal(contactoId)
end

local especialOriginal = G.ofertaEspecial
function G.ofertaEspecial(contactoId, nivel, grupo)
    if D.dominio(contactoId) ~= "mision" then return nil end
    return especialOriginal(contactoId, nivel, grupo)
end

-- Los capitanes no desprecian a nadie por su fama (al reves, les gusta).
local rechazaOriginal = G.rechazaPorKnox
function G.rechazaPorKnox(jugador, contactoId, nivel)
    if D.esBandido(contactoId) then return false end
    return rechazaOriginal(jugador, contactoId, nivel)
end

-- Ni la cura: los capitanes no la tienen.
local CS = Narrador.CuraServer
if CS ~= nil and CS.pedir ~= nil then
    local pedirOriginal = CS.pedir
    function CS.pedir(jugador, args)
        if args ~= nil and D.dominio(tostring(args.contacto)) ~= "mision" then
            C.decir(tostring(args.contacto), "Cura? Aca no curamos a nadie. Aca cobramos.")
            return
        end
        return pedirOriginal(jugador, args)
    end
    Motor.comandosPublicos.pedirCura = CS.pedir
end

-- El cliente ve el dominio (para el perfil del diario).
local vistaOriginal = C.vista
function C.vista()
    local lista = vistaOriginal()
    local m = Motor.estado().memoria
    for _, v in ipairs(lista) do v.dominio, v.reemplazo = D.dominio(v.id), m["nuevo_" .. tostring(v.id)] end
    return lista
end

function D.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    pcall(D.aplicar)
end
Motor.tickExtra.dominios = D.tick

return D
