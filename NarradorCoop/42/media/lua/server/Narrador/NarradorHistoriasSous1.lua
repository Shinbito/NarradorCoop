-- Narrador Co-op (servidor): modo historia de Sous, parte 1 (shared/Narrador/Arcos/HistoriasSous1.lua).
--
--   Lanzador (Motor.tickExtra.historiasSous1): cada 10 minutos, con Sous aliado (memoria "sous"
--   = "aliados") y alguien en la base de Sous, una chance de que el siguiente integrante con
--   historia pendiente (vivo, sin hacer) llame al jugador. De a una: no se lanza si hay otra
--   historia de Sous en curso (cualquier def con historia_sous) y tienen que pasar H.ENTRE horas
--   desde la ultima (memoria "hora_hsous", la comparten todas las historias de Sous).
--   Accion inmediata "arma_personaje": el arma legendaria con nombre propio de ese integrante,
--   para cada jugador conectado del grupo de quien hizo la historia.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/Arcos/FavoresSous"
require "Narrador/Arcos/HistoriasSous1"

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor
local C, F, H = Narrador.Contactos, Narrador.Favores, Narrador.HistoriasSous1

H.ENTRE = 30         -- horas entre una historia de Sous y la siguiente
H.CHANCE = 4         -- 1 en H.CHANCE cada 10 minutos con alguien en la base
H.RADIO_BASE = 45

-- Alguna historia de Sous (de este archivo o de otro que marque historia_sous) en curso.
function H.ocupado()
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        local def = inst ~= nil and inst.final == nil and Defs.get(inst.def) or nil
        if def ~= nil and def.historia_sous ~= nil then return true end
    end
    return false
end

-- El integrante puede tener su historia ahora: vivo en la base, sin hacer y sin favor en curso.
function H.disponible(rol)
    local m = Motor.estado().memoria
    if m["hsous_" .. rol] ~= nil or m["sous_murio_" .. rol] == true then return false end
    if Defs.get(H.idDe(rol)) == nil or Motor.activos(H.idDe(rol)) > 0 then return false end
    if Motor.activos("favor_" .. rol) > 0 then return false end
    return F ~= nil and F.residente(rol) ~= nil
end

function H.revisar()
    local m = Motor.estado().memoria
    if m.sous ~= "aliados" then return end
    if H.ocupado() then return end
    local ahora = Mundo.horas()
    if m.hora_hsous ~= nil and ahora - m.hora_hsous < H.ENTRE then return end
    local base = m["lugar.base_sous"]
    if type(base) ~= "table" then return end
    local j = Mundo.jugadorCerca(base.x, base.y, H.RADIO_BASE)
    if j == nil or Mundo.azar(H.CHANCE) ~= 1 then return end
    for _, rol in ipairs(H.ORDEN) do
        if H.disponible(rol) then
            local inst, razon = Motor.iniciar(H.idDe(rol), j)
            if inst ~= nil then
                m.hora_hsous = ahora
            else
                Mundo.log("no se pudo lanzar la historia de " .. rol .. ": " .. tostring(razon))
            end
            return
        end
    end
end

function H.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Mundo.hayALife() then return end
    pcall(H.revisar)
end

Motor.tickExtra = Motor.tickExtra or {}
Motor.tickExtra.historiasSous1 = H.tick

-- ---------------------------------------------------------------------------
-- Armas de cada integrante
-- ---------------------------------------------------------------------------

-- Crea el arma legendaria con nombre propio (o nil si el tipo no existe).
function H.crearArma(def)
    local L = Narrador.Legendario
    local arma = Mundo.crearItem(def.tipo)
    if arma == nil then return nil end
    if L ~= nil then
        L.marcar(arma, "legendaria")
        pcall(function() arma:getModData().NarradorLegendario.nombre = def.nombre end)
        L.aplicar(arma)
    else
        Mundo.nombrar(arma, def.nombre, nil)
    end
    return arma
end

-- Todo lo que entrega ese integrante (armas, municion y extras). Devuelve items y nombres.
function H.crearArmas(rol)
    local items, nombres = {}, {}
    for _, def in ipairs(H.ARMAS[rol] or {}) do
        local arma = H.crearArma(def)
        if arma ~= nil then
            items[#items + 1] = arma
            nombres[#nombres + 1] = def.nombre
            for _, tipos in ipairs(def.municion or {}) do
                local it = Mundo.crearItem(tipos)
                if it ~= nil then items[#items + 1] = it end
            end
            for _, tipos in ipairs(def.extras or {}) do
                local it = Mundo.crearItem(tipos)
                if it ~= nil then items[#items + 1] = it end
            end
        end
    end
    return items, nombres
end

-- {"arma_personaje", rol = "martin_z"}
Motor.inmediatas.arma_personaje = function(inst, a)
    local rol = tostring(a.rol or "")
    if H.ARMAS[rol] == nil then return true end
    local lista = C.jugadoresDelGrupo(inst.refNombre)
    if #lista == 0 then
        -- Nadie del grupo conectado: queda en el suelo de la base.
        local l = inst.lugares.base
        if l ~= nil then
            for _, it in ipairs((H.crearArmas(rol))) do Mundo.dejarEnSuelo(l.x, l.y, l.z or 0, it) end
        end
        return true
    end
    for _, p in ipairs(lista) do
        local items, nombres = H.crearArmas(rol)
        for _, it in ipairs(items) do Mundo.darItem(p, it) end
        if #nombres > 0 then
            Motor.enviar(p, "aviso", { texto = tostring(H.NOMBRES[rol]) .. " te entrega " .. table.concat(nombres, " y ") .. "." })
        end
    end
    Mundo.log("arma de la historia de " .. rol .. " para " .. #lista .. " jugadores")
    return true
end

-- Admin: el arma de la historia de un integrante, para los jugadores del grupo del admin.
Motor.comandosAdmin = Motor.comandosAdmin or {}
Motor.comandosAdmin.armaHistoriaSous = function(jugador, args)
    local rol = tostring(args and args.rol or "")
    if H.ARMAS[rol] == nil then return "Integrante desconocido." end
    local lista = C.jugadoresDelGrupo(Mundo.nombreJugador(jugador))
    for _, p in ipairs(lista) do
        for _, it in ipairs((H.crearArmas(rol))) do Mundo.darItem(p, it) end
    end
    return "Entregado a " .. #lista .. " jugadores."
end

return H
