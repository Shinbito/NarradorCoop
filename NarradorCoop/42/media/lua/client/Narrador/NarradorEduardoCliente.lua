-- Narrador Co-op (cliente): Eduardo en el campamento de la Chela (server/Narrador/NarradorEduardoResidente.lua).
-- Clic derecho cerca de el: "Eduardo: sigueme" o "Eduardo: vuelve con la Chela".
-- Textos sin tildes a proposito.

require "Narrador/NarradorCliente"

local EC = Narrador.EduardoCliente or {}
Narrador.EduardoCliente = EC

EC.DISTANCIA = 4

function EC.menu(numJugador, context, worldobjects, test)
    if test then return end
    local Cl = Narrador.Cliente
    local estado = Cl ~= nil and Cl.estado or nil
    local ed = estado ~= nil and estado.eduardo or nil
    if ed == nil or ed.uid == nil then return end
    local jugador = getSpecificPlayer(numJugador)
    local cuerpo = Cl.cuerpoDe ~= nil and Cl.cuerpoDe(ed.uid) or nil
    if jugador == nil or cuerpo == nil then return end
    local dx, dy = cuerpo:getX() - jugador:getX(), cuerpo:getY() - jugador:getY()
    if dx * dx + dy * dy > EC.DISTANCIA * EC.DISTANCIA then return end
    if ed.siguiendo then
        context:addOption("Eduardo: vuelve con la Chela", nil, function() Cl.enviar("eduardoVuelve", {}) end)
    else
        context:addOption("Eduardo: sigueme", nil, function() Cl.enviar("eduardoSigueme", {}) end)
    end
end

if Events ~= nil and not EC._enganchado then
    EC._enganchado = true
    Events.OnFillWorldObjectContextMenu.Add(EC.menu)
end

return EC
