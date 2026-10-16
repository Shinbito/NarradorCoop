-- Narrador Co-op (servidor): quien manda en cada ciudad (ver shared/Narrador/NarradorDominiosDefs.lua).
-- Memoria "dominio_<id>" = "bandido" o "nuevo" (sin nada, el misionero de siempre). Al cambiar:
--   * El contacto de esa ciudad pasa a ser otro (nombre, perfil, frases, rangos de confianza y
--     perfil del diario). Su NPC se retira y aparece el nuevo la proxima vez que alguien pasa.
--   * Con un capitan (bandido): no rechaza a nadie por su fama en Knox, no da capitulos de
--     historia ni la cura, y todas sus ofertas son encargos inmorales (Arcos/Inmorales.lua).
-- El campamento, los comerciantes y la confianza siguen siendo de la ciudad.
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

local DD, Mundo, Motor, C = Narrador.DominiosDefs, Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local R, G = Narrador.Reputacion, Narrador.Generador

local D = Narrador.Dominios or {}
Narrador.Dominios = D

D.CAMPOS = { "rol", "nombre", "apellido", "perfil", "oficio", "frases", "frases_tomas" }

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

local function datos(id, d)
    if d == "bandido" then return DD.CAPITANES[id] end
    if d == "nuevo" then return DD.NUEVOS[id] end
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
    local radio = tonumber(p.radio) or 2
    local ok = pcall(function()
        local cell = getCell()
        for dx = -radio, radio, 2 do
            for dy = -radio, radio, 2 do
                local sq = cell:getGridSquare(l.x + dx, l.y + dy, l.z or 0)
                if sq ~= nil then IsoFireManager.StartFire(cell, sq, true, 100) end
            end
        end
    end)
    if not ok then Mundo.log("no se pudo prender fuego en " .. tostring(l.etiqueta)) end
    return true
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
    for _, v in ipairs(lista) do v.dominio = D.dominio(v.id) end
    return lista
end

function D.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    pcall(D.aplicar)
end
Motor.tickExtra.dominios = D.tick

return D
