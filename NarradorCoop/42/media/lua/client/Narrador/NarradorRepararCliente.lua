-- Narrador Co-op (cliente): opcion "Reparar arma legendaria" en el inventario
-- (server/Narrador/NarradorRepararLegendario.lua).
-- Textos sin tildes a proposito.

require "Narrador/NarradorCliente"

local RC = Narrador.RepararCliente or {}
Narrador.RepararCliente = RC

local function itemDe(entrada)
    if type(entrada) == "table" and entrada.items ~= nil then return entrada.items[1] end
    return entrada
end

function RC.menu(numJugador, context, items)
    for _, e in ipairs(items or {}) do
        local it = itemDe(e)
        local ok, legendaria = pcall(function()
            return type(it:getModData().NarradorLegendario) == "table" and it:getCondition() < it:getConditionMax()
        end)
        if ok and legendaria then
            local fuego = false
            pcall(function() fuego = it:isRanged() end)
            local op = context:addOption("Reparar arma legendaria", nil, function()
                Narrador.Cliente.enviar("repararLegendario", { id = it:getID() })
            end)
            local tip = ISToolTip:new()
            tip.description = fuego and "Gasta tornillos y un pedazo de metal. Recupera la mitad de la durabilidad."
                or "Gasta cinta adhesiva o pegamento. Recupera la mitad de la durabilidad."
            op.toolTip = tip
            return
        end
    end
end

if Events ~= nil and not RC._enganchado then
    RC._enganchado = true
    Events.OnFillInventoryObjectContextMenu.Add(RC.menu)
end

return RC
