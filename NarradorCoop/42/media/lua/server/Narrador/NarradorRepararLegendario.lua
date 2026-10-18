-- Narrador Co-op (servidor): reparar las armas legendarias (Narrador.Legendario).
-- Clic derecho en el arma (client/Narrador/NarradorRepararCliente.lua): las de fuego gastan
-- tornillos y un pedazo de metal; las cuerpo a cuerpo, cinta o pegamento. Recupera la mitad de
-- la durabilidad maxima (la legendaria, x4) sin que el arma pierda sus mejoras.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor

local RL = Narrador.RepararLegendario or {}
Narrador.RepararLegendario = RL

RL.FUEGO = { { "Base.Screws" }, { "Base.ScrapMetal", "Base.SmallSheetMetal" } }
RL.MANO = { { "Base.DuctTape", "Base.Glue", "Base.Woodglue" } }
RL.RECUPERA = 0.5

local function buscar(inv, tipos)
    for _, t in ipairs(tipos) do
        local it = inv:getFirstTypeRecurse(t)
        if it ~= nil then return it end
    end
    return nil
end

function RL.reparar(jugador, args)
    local ok, err = pcall(function()
        local inv = jugador:getInventory()
        local arma = inv:getItemWithIDRecursiv(tonumber(args.id))
        if arma == nil or type(arma:getModData().NarradorLegendario) ~= "table" then return end
        if arma:getCondition() >= arma:getConditionMax() then
            Motor.responder(jugador, "Esta arma no necesita arreglo.")
            return
        end
        local fuego = arma.isRanged ~= nil and arma:isRanged()
        local lista = fuego and RL.FUEGO or RL.MANO
        local usar = {}
        for _, tipos in ipairs(lista) do
            local it = buscar(inv, tipos)
            if it == nil then
                Motor.responder(jugador, fuego and "Para arreglarla necesitas tornillos y un pedazo de metal."
                    or "Para arreglarla necesitas cinta adhesiva o pegamento.")
                return
            end
            usar[#usar + 1] = it
        end
        for _, it in ipairs(usar) do
            local cont = it:getContainer() or inv
            cont:Remove(it)
            if sendRemoveItemFromContainer ~= nil then sendRemoveItemFromContainer(cont, it) end
        end
        local max = arma:getConditionMax()
        arma:setCondition(math.min(max, arma:getCondition() + math.ceil(max * RL.RECUPERA)))
        if arma.syncItemFields ~= nil then arma:syncItemFields() end
        if sendItemStats ~= nil then pcall(sendItemStats, arma) end
        Motor.responder(jugador, "Arreglaste " .. tostring(arma:getName()) .. ". Queda como para seguir dando pelea.")
    end)
    if not ok then Mundo.log("error al reparar legendaria: " .. tostring(err)) end
end

Motor.comandosPublicos = Motor.comandosPublicos or {}
Motor.comandosPublicos.repararLegendario = RL.reparar

return RL
