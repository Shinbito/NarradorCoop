-- Narrador Co-op (cliente): examinar las pastillas K-93 con Medicina 4 o mas.
-- Clic derecho sobre la pastilla en el inventario -> "Examinar la pastilla".
-- Sin tildes ni enies a proposito.

require "Narrador/NarradorCura"

local Cura = Narrador.Cura

local function nivelMedicina(jugador)
    local ok, n = pcall(function() return jugador:getPerkLevel(Perks.Doctor) end)
    return ok and tonumber(n) or 0
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

function Cura.menuInventario(numJugador, context, items)
    local jugador = getSpecificPlayer(numJugador)
    if jugador == nil then return end
    for _, v in ipairs(items or {}) do
        local item = v
        if type(v) == "table" and v.items ~= nil then item = v.items[1] end
        local ok, tipo = pcall(function() return item:getFullType() end)
        if ok and tipo == Cura.TIPO then
            local vista = false
            pcall(function() vista = item:getModData().NarradorK93Vista == true end)
            if not vista then
                local op = context:addOption("Examinar la pastilla", jugador, function() Cura.examinar(jugador, item) end)
                if nivelMedicina(jugador) < Cura.MEDICINA_MIN then
                    op.notAvailable = true
                    pcall(function()
                        local tt = ISToolTip:new()
                        tt:initialise()
                        tt.description = "Necesitas Medicina " .. Cura.MEDICINA_MIN .. " o mas para distinguir la verdadera. Si no, solo queda probarlas."
                        op.toolTip = tt
                    end)
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
