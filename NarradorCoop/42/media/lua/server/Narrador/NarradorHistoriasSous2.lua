-- Narrador Co-op: lanzador del modo historia de Sous, parte 2 (Walita, Cristonks, Hasag y
-- Wertres; las historias estan en shared/Narrador/Arcos/HistoriasSous2.lua) y la accion
-- "arma_personaje2" que entrega el arma legendaria de cada uno.
--
-- Cuando se lanzan: Sous aliado (memoria "sous" == "aliados"), una a la vez, con horas entre
-- una y otra. No se lanza nada si hay cualquier historia "historia_sous_*" en curso (tambien
-- las del otro lanzador), y la espera se cuenta desde la ultima que empezo de cualquiera de los dos.
-- Sin tildes ni enies a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorLegendario"
require "Narrador/Arcos/FavoresSous"
require "Narrador/Arcos/HistoriasSous2"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local HS = Narrador.HistoriasSous2

local H = Narrador.HistoriasSous2Server or {}
Narrador.HistoriasSous2Server = H

H.PREFIJO = "historia_sous_"
H.ESPERA_INICIAL = 24  -- horas desde que este lanzador ve a Sous aliado por primera vez
H.ESPERA = 30          -- horas entre una historia de Sous y la siguiente
H.REINTENTO = 2        -- si no se pudo lanzar, se vuelve a probar en estas horas

-- Armas legendarias (alternativas por si un tipo no existe).
H.ARMAS = {
    hanz = { tipo = { "Base.Mace", "Base.BaseballBat" }, nombre = "La Maza del Morro" },
    cristian = { tipo = { "Base.IceAxe", "Base.PickAxe" }, nombre = "El Piolet de Farellones" },
    jorge = { tipo = { "Base.Machete" }, nombre = "El Recorte de Presupuesto" },
    cristobal = { tipo = { "Base.Sledgehammer", "Base.Sledgehammer2" }, nombre = "El Siuuu de Wertres" },
}

function H.crearArma(rol)
    local def = H.ARMAS[rol]
    if def == nil then return nil end
    local arma = Mundo.crearItem(def.tipo)
    if arma == nil then return nil end
    local L = Narrador.Legendario
    if L ~= nil then
        L.marcar(arma, "legendaria")
        pcall(function() arma:getModData().NarradorLegendario.nombre = def.nombre end)
        L.aplicar(arma)
    else
        Mundo.nombrar(arma, def.nombre, nil)
    end
    return arma
end

-- {"arma_personaje2", rol = "hanz", de = "Hanz Walita"}: el arma legendaria de ese integrante
-- de Sous para cada jugador conectado del grupo de quien lanzo la historia.
Motor.inmediatas.arma_personaje2 = function(inst, a)
    local rol = tostring(a.rol)
    local def = H.ARMAS[rol]
    if def == nil then return true end
    local C = Narrador.Contactos
    local lista = C ~= nil and C.jugadoresDelGrupo(inst.refNombre) or {}
    if #lista == 0 then
        for _, p in ipairs(Mundo.jugadores()) do if Mundo.vivo(p) then lista[#lista + 1] = p end end
    end
    for _, p in ipairs(lista) do
        local arma = H.crearArma(rol)
        if arma ~= nil then
            Mundo.darItem(p, arma)
            Motor.enviar(p, "aviso", { texto = tostring(a.de or rol) .. " te regala " .. def.nombre .. "." })
        end
    end
    Mundo.log("arma de " .. rol .. " (" .. def.nombre .. ") para " .. #lista .. " jugadores")
    return true
end

-- Hay alguna historia de Sous en curso (de este lanzador o del otro)?
function H.haySousActiva()
    local st = Motor.estado()
    local n = string.len(H.PREFIJO)
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil and string.sub(tostring(inst.def), 1, n) == H.PREFIJO then return true end
    end
    return false
end

-- Hora en que empezo la ultima historia de Sous (de cualquiera de los dos lanzadores).
function H.ultimoInicioSous()
    local st, n, ultima = Motor.estado(), string.len(H.PREFIJO), nil
    for defId, hora in pairs(st.director.ultimoPorDef or {}) do
        if string.sub(tostring(defId), 1, n) == H.PREFIJO and (ultima == nil or hora > ultima) then ultima = hora end
    end
    return ultima
end

-- La siguiente que toca: primero las nunca ofrecidas, despues las postergadas. El integrante
-- tiene que seguir vivo en la base de Sous.
function H.siguiente()
    local m = Motor.estado().memoria
    local F = Narrador.Favores
    for _, cual in ipairs({ "nueva", "postergada" }) do
        for _, rol in ipairs(HS.ROLES) do
            local v = m["sous_historia_" .. rol]
            local sirve = (cual == "nueva" and v == nil) or (cual == "postergada" and v == "postergada")
            if sirve and Narrador.Defs.get(HS.idDe(rol)) ~= nil and (F == nil or F.residente(rol) ~= nil) then return rol end
        end
    end
    return nil
end

function H.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Mundo.hayALife() then return end
    local st = Motor.estado()
    local m = st.memoria
    if m.sous ~= "aliados" then return end
    local ahora = Mundo.horas()
    if m["sous_historias2.ultima"] == nil then
        -- Primera vez que se ve a Sous aliado: la primera historia sale despues de la espera inicial.
        m["sous_historias2.ultima"] = ahora - H.ESPERA + H.ESPERA_INICIAL
        return
    end
    if ahora - (tonumber(m["sous_historias2.ultima"]) or 0) < H.ESPERA then return end
    local otra = H.ultimoInicioSous()
    if otra ~= nil and ahora - otra < H.ESPERA then return end
    if H.haySousActiva() or Motor.activos("sous") > 0 then return end
    local rol = H.siguiente()
    if rol == nil then return end
    local j = Mundo.jugadorAlAzar()
    if j == nil then return end
    local defId = HS.idDe(rol)
    local inst, razon = Motor.iniciar(defId, j)
    if inst ~= nil then
        m["sous_historias2.ultima"] = ahora
    else
        m["sous_historias2.ultima"] = ahora - H.ESPERA + H.REINTENTO
        Mundo.log("no se pudo lanzar " .. defId .. ": " .. tostring(razon))
    end
end

Motor.tickExtra.historiasSous2 = H.tick

return H
