-- Narrador Co-op (cliente): distinguir las pastillas K-93.
-- Clic derecho sobre la pastilla en el inventario:
--   * "Examinar la pastilla": con Medicina 4 o mas se sabe al tiro cual es cual.
--   * "Probar la pastilla en agua": cualquiera, con agua en el inventario (botella, vaso, olla;
--     sirve la sucia). La falsa se deshace y se pierde; la verdadera sale entera y queda marcada.
--     La prueba la hace el servidor (comando pruebaAgua, server/Narrador/NarradorCuraServer.lua);
--     aca solo se pide y se muestra el resultado.
-- Sin tildes ni enies a proposito.

require "Narrador/NarradorCura"
require "Narrador/NarradorCliente"

local Cura = Narrador.Cura

local function nivelMedicina(jugador)
    local ok, n = pcall(function() return jugador:getPerkLevel(Perks.Doctor) end)
    return ok and tonumber(n) or 0
end

local function tooltip(op, texto)
    pcall(function()
        local tt = ISToolTip:new()
        tt:initialise()
        tt.description = texto
        op.toolTip = tt
    end)
end

function Cura.examinar(jugador, item)
    local es = Cura.es(item)
    local real = es ~= "falsa"
    pcall(function()
        item:setName(real and "Pastilla K-93 (verdadera)" or "Pastilla K-93 (azucar)")
        item:setCustomName(true)
        item:getModData().NarradorK93Vista = true
    end)
    pcall(function()
        jugador:setHaloNote(real and "Esta es distinta: compuesto de verdad. Es la buena." or "Azucar y colorante. Esta no sirve.",
            real and 120 or 230, real and 230 or 160, 120, 300)
    end)
end

function Cura.pedirPruebaAgua(jugador, item)
    local ok, id = pcall(function() return item:getID() end)
    if not ok or id == nil then return end
    pcall(function() jugador:setHaloNote("Echas la pastilla al agua y cuentas un minuto...", 200, 220, 255, 200) end)
    Narrador.Cliente.enviar("pruebaAgua", { id = id })
end

-- Lo que contesta el servidor: { id, falsa }.
function Cura.resultadoAgua(datos)
    local jugador = getPlayer()
    if jugador == nil or datos == nil then return end
    if datos.falsa then
        pcall(function()
            jugador:setHaloNote("Se deshizo en menos de un minuto. El agua quedo celeste. Era de azucar.", 230, 160, 120, 400)
        end)
        return
    end
    -- La copia del cliente tambien queda con el nombre (en un jugador ya lo hizo el servidor).
    pcall(function()
        local item = jugador:getInventory():getItemWithIDRecursiv(tonumber(datos.id))
        if item ~= nil then Cura.marcarVerdadera(item, true) end
    end)
    pcall(function()
        jugador:setHaloNote("No se deshizo. La sacas, la secas en la manga: esta es de verdad.", 120, 230, 160, 400)
    end)
end

function Cura.menuInventario(numJugador, context, items)
    local jugador = getSpecificPlayer(numJugador)
    if jugador == nil then return end
    for _, v in ipairs(items or {}) do
        local item = v
        if type(v) == "table" and v.items ~= nil then item = v.items[1] end
        if Cura.esPastilla(item) then
            if not Cura.conocida(item) then
                local op = context:addOption("Examinar la pastilla", jugador, function() Cura.examinar(jugador, item) end)
                if nivelMedicina(jugador) < Cura.MEDICINA_MIN then
                    op.notAvailable = true
                    tooltip(op, "Necesitas Medicina " .. Cura.MEDICINA_MIN .. " o mas para distinguir la verdadera. Si no, queda la prueba del agua.")
                end
                local agua = context:addOption("Probar la pastilla en agua", jugador, function() Cura.pedirPruebaAgua(jugador, item) end)
                if Cura.buscarAgua(jugador) == nil then
                    agua.notAvailable = true
                    tooltip(agua, "Necesitas agua en el inventario: una botella, un vaso, una olla. Sirve hasta la sucia.")
                else
                    tooltip(agua, "La de azucar se deshace en agua en menos de un minuto y se pierde. La verdadera sale entera y queda marcada.")
                end
            end
            return
        end
    end
end

if Events ~= nil and Events.OnFillInventoryObjectContextMenu ~= nil and not Cura._menu then
    Cura._menu = true
    Events.OnFillInventoryObjectContextMenu.Add(Cura.menuInventario)
end

return Cura
