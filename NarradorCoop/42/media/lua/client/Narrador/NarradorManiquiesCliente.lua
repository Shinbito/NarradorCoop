-- Narrador Co-op (cliente): el maniqui fijo de cada misionero (server/Narrador/NarradorManiquies.lua).
-- Clic derecho sobre el maniqui: si el NPC del misionero no esta, se le pueden pedir misiones
-- igual (se abre la misma conversacion del misionero). Si el NPC esta, el maniqui solo avisa
-- que el misionero anda cerca.
-- Textos sin tildes a proposito.

require "Narrador/NarradorCliente"
require "Narrador/NarradorConversacion"

local MC = Narrador.ManiquiesCliente or {}
Narrador.ManiquiesCliente = MC

-- El maniqui (de la vista del servidor) en la casilla clickeada, o nil.
local function maniquiEn(worldobjects)
    local estado = Narrador.Cliente ~= nil and Narrador.Cliente.estado or nil
    if estado == nil or estado.maniquies == nil then return nil end
    for _, o in ipairs(worldobjects or {}) do
        local sq
        pcall(function() sq = o:getSquare() end)
        if sq ~= nil then
            for _, m in ipairs(estado.maniquies) do
                if m.x == sq:getX() and m.y == sq:getY() and m.z == sq:getZ() then return m, estado end
            end
        end
    end
    return nil
end

function MC.menu(numJugador, context, worldobjects, test)
    if test then return end
    local m, estado = maniquiEn(worldobjects)
    if m == nil then return end
    local Conv = Narrador.Conversacion
    if m.npc then
        local op = context:addOption("Maniqui de " .. tostring(m.nombre), nil, nil)
        op.notAvailable = true
        local tip = ISToolTip:new()
        tip.description = tostring(m.nombre) .. " anda por aqui: habla con el."
        op.toolTip = tip
        return
    end
    local ciudad
    for _, c in ipairs(estado.contactos or {}) do if c.id == m.id then ciudad = c.ciudad end end
    local obj = { tipo = "contacto", id = m.id, nombre = m.nombre,
        sub = "Maniqui de " .. tostring(m.nombre) .. " (no esta: su libreta sigue aqui)", ciudad = ciudad }
    context:addOption("Pedir trabajo a " .. tostring(m.nombre) .. " (maniqui)", nil, function()
        if Conv ~= nil and Conv.abrir ~= nil then Conv.abrir(obj) end
    end)
end

if Events ~= nil and not MC._enganchado then
    MC._enganchado = true
    Events.OnFillWorldObjectContextMenu.Add(MC.menu)
end

return MC
