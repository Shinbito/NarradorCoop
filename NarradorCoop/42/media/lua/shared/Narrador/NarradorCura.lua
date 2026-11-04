-- Narrador Co-op: las pastillas K-93 (item Narrador.CuraZ).
-- Todas se ven iguales. Cada una lleva en su modData si es la verdadera ("real") o azucar
-- ("falsa"). La verdadera cura la infeccion zombi (mordida incluida); las falsas solo dan
-- dolor de estomago. Con Medicina (First Aid) 4 o mas se pueden examinar para saber cual es
-- cual; si no, queda la prueba del agua (la falsa se deshace, ver Cura.AGUA) o probarlas.
-- Las usan la mision de la cura (Louisville) y los Bell.
-- El juego llama a NarradorCuraZ_OnEat al tomarla. En MP tambien se avisa al servidor.
-- Sin tildes ni enies a proposito.

Narrador = Narrador or {}
local Cura = Narrador.Cura or {}
Narrador.Cura = Cura

Cura.TIPO = "Narrador.CuraZ"
Cura.MEDICINA_MIN = 4

function Cura.es(item)
    local ok, v = pcall(function() return item:getModData().NarradorK93 end)
    if ok then return v end
    return nil
end

function Cura.esPastilla(item)
    local ok, tipo = pcall(function() return item:getFullType() end)
    return ok and tipo == Cura.TIPO
end

-- Ya se sabe que es la verdadera: la examino alguien con Medicina 4+ o paso la prueba del agua.
function Cura.conocida(item)
    local ok, si = pcall(function()
        local md = item:getModData()
        return md.NarradorK93Vista == true or md.NarradorK93Probada == true
    end)
    return ok and si == true
end

-- La prueba del agua (canon: la falsa del Dr. Hartmann se deshace en agua en menos de un
-- minuto; la verdadera no). Gasta un vaso de agua (Cura.AGUA litros) de cualquier recipiente
-- del inventario, limpia o sucia. La falsa se deshace (el item se pierde); la verdadera sale
-- entera y queda marcada (NarradorK93Probada): desde ahi se puede entregar "la verdadera" sin
-- Medicina 4. La hace el servidor (server/Narrador/NarradorCuraServer.lua, comando pruebaAgua);
-- el cliente solo pone la opcion del menu (client/Narrador/NarradorPastillas.lua).
Cura.AGUA = 0.1

local function fluidoEsAgua(fc)
    local si = false
    pcall(function()
        if Fluid == nil then return end
        if Fluid.Water ~= nil and fc:contains(Fluid.Water) then si = true end
        if not si and Fluid.TaintedWater ~= nil and fc:contains(Fluid.TaintedWater) then si = true end
    end)
    if si then return true end
    pcall(function()
        local f = fc:getPrimaryFluid()
        if f == nil then return end
        local n = f.getFluidTypeString ~= nil and f:getFluidTypeString() or tostring(f)
        if string.find(string.lower(tostring(n)), "water", 1, true) then si = true end
    end)
    return si
end

-- Cuanta agua tiene un item: en el B42, su recipiente de fluidos; en el B41, un item con agua.
function Cura.aguaDe(item)
    local cant = 0
    pcall(function()
        local fc = item.getFluidContainer ~= nil and item:getFluidContainer() or nil
        if fc ~= nil and not fc:isEmpty() and fluidoEsAgua(fc) then cant = tonumber(fc:getAmount()) or 0 end
    end)
    if cant > 0 then return cant end
    pcall(function()
        if item.isWaterSource ~= nil and item:isWaterSource() then
            local d = item.getCurrentUsesFloat ~= nil and item:getCurrentUsesFloat() or item:getUsedDelta()
            if (tonumber(d) or 0) > 0 then cant = 1 end
        end
    end)
    return cant
end

-- El primer recipiente con agua del inventario (y de las mochilas que lleva).
function Cura.buscarAgua(jugador)
    local hallado
    pcall(function()
        local function recorrer(inv, prof)
            if inv == nil or prof > 2 or hallado ~= nil then return end
            local items = inv:getItems()
            for i = 0, items:size() - 1 do
                local it = items:get(i)
                if it ~= nil and hallado == nil then
                    if Cura.aguaDe(it) > 0 then hallado = it; return end
                    if instanceof(it, "InventoryContainer") then recorrer(it:getInventory(), prof + 1) end
                end
            end
        end
        recorrer(jugador:getInventory(), 0)
    end)
    return hallado
end

-- Saca un vaso de agua del recipiente. Devuelve true si pudo (si la version del juego no deja,
-- la prueba se hace igual: es mejor eso que trabar la mision).
function Cura.gastarAgua(item)
    local ok = false
    pcall(function()
        local fc = item:getFluidContainer()
        if fc == nil then return end
        local antes = tonumber(fc:getAmount()) or 0
        local quitar = math.min(antes, Cura.AGUA)
        pcall(function() fc:removeFluid(quitar) end)
        if (tonumber(fc:getAmount()) or 0) >= antes then pcall(function() fc:adjustAmount(antes - quitar) end) end
        ok = (tonumber(fc:getAmount()) or 0) < antes
    end)
    if ok then return true end
    pcall(function()
        if item.isWaterSource ~= nil and item:isWaterSource() then item:Use(); ok = true end
    end)
    return ok
end

-- La que paso la prueba del agua (o el examen): nombre a la vista y marcada.
function Cura.marcarVerdadera(item, probada)
    pcall(function()
        item:setName("Pastilla K-93 (verdadera)")
        item:setCustomName(true)
        local md = item:getModData()
        md.NarradorK93Vista = true
        if probada then md.NarradorK93Probada = true end
    end)
end

-- Saca la infeccion zombi de un personaje. Devuelve true si estaba infectado.
-- En B42 la infeccion vive en varias partes: el BodyDamage, cada parte del cuerpo (mordida,
-- infeccion zombi e infeccion de herida) y dos stats, ZOMBIE_INFECTION y ZOMBIE_FEVER. Si
-- queda la fiebre o una parte infectada, el juego vuelve a contagiar y mata igual.
-- En MP el servidor manda: despues de curar se sincroniza el cuerpo y las stats al cliente.
function Cura.curar(personaje)
    if personaje == nil then return false end
    local estaba = false
    local partes
    pcall(function()
        local bd = personaje:getBodyDamage()
        pcall(function() estaba = bd:IsInfected() == true end)
        pcall(function() bd:setInfected(false) end)
        pcall(function() bd:setIsFakeInfected(false) end)
        pcall(function() bd:setInfectionTime(-1) end)
        pcall(function() bd:setInfectionMortalityDuration(-1) end)
        pcall(function()
            partes = bd:getBodyParts()
            for i = 0, partes:size() - 1 do
                local p = partes:get(i)
                pcall(function() if p:IsInfected() then estaba = true end end)
                pcall(function() p:SetInfected(false) end)
                pcall(function() p:SetFakeInfected(false) end)
                -- La mordida queda cerrada (como el "bite" del menu de salud del juego).
                pcall(function() if p:bitten() then p:SetBitten(false) end end)
                pcall(function() p:setInfectedWound(false) end)
                pcall(function() p:setWoundInfectionLevel(0) end)
            end
        end)
    end)
    pcall(function()
        if CharacterStat == nil then return end
        local st = personaje:getStats()
        pcall(function() if st:get(CharacterStat.ZOMBIE_INFECTION) > 0 then estaba = true end end)
        pcall(function() if st:get(CharacterStat.ZOMBIE_FEVER) > 0 then estaba = true end end)
        pcall(function() st:set(CharacterStat.ZOMBIE_INFECTION, 0) end)
        pcall(function() st:set(CharacterStat.ZOMBIE_FEVER, 0) end)
    end)
    Cura.sincronizar(personaje, partes)
    return estaba
end

-- true si queda algo de la infeccion zombi (sin cambiar nada).
function Cura.infectado(personaje)
    local si = false
    pcall(function()
        local bd = personaje:getBodyDamage()
        pcall(function() if bd:IsInfected() then si = true end end)
        local partes = bd:getBodyParts()
        for i = 0, partes:size() - 1 do
            pcall(function() if partes:get(i):IsInfected() then si = true end end)
        end
    end)
    pcall(function()
        local st = personaje:getStats()
        if st:get(CharacterStat.ZOMBIE_INFECTION) > 0 or st:get(CharacterStat.ZOMBIE_FEVER) > 0 then si = true end
    end)
    return si
end

-- Servidor -> cliente: el cuerpo entero y las stats (lo mismo que hace el menu de salud del
-- juego con syncBodyPart). En el cliente o en un solo jugador no hace nada.
function Cura.sincronizar(personaje, partes)
    if isServer == nil or not isServer() then return end
    if partes ~= nil and syncBodyPart ~= nil then
        for i = 0, partes:size() - 1 do
            pcall(syncBodyPart, partes:get(i), 0xFFFFFFFFFFF)
        end
    end
    if syncPlayerStats ~= nil then pcall(syncPlayerStats, personaje, 0x7FFFFFFF) end
end

-- Durante 2 horas de juego despues de tomarla, el servidor repasa la cura cada minuto (por si
-- el juego alcanza a subir la fiebre otra vez antes de enterarse).
Cura.HORAS_REPASO = 2
function Cura.marcarRepaso(personaje)
    pcall(function()
        local horas = getGameTime():getWorldAgeHours()
        personaje:getModData().NarradorCuraHasta = horas + Cura.HORAS_REPASO
    end)
end

-- Dolor de estomago (una pastilla falsa).
function Cura.dolor(personaje)
    pcall(function()
        local bd = personaje:getBodyDamage()
        pcall(function() bd:setFoodSicknessLevel(math.min(100, bd:getFoodSicknessLevel() + 25)) end)
        pcall(function() bd:getBodyPart(BodyPartType.Torso_Lower):setAdditionalPain(30) end)
    end)
    pcall(function()
        if CharacterStat ~= nil then
            local st = personaje:getStats()
            st:set(CharacterStat.SICKNESS, math.min(1, st:get(CharacterStat.SICKNESS) + 0.25))
        end
    end)
end

function NarradorCuraZ_OnEat(comida, personaje, porcentaje)
    local real = Cura.es(comida) ~= "falsa"
    local estaba = false
    if real then
        estaba = Cura.curar(personaje)
        Cura.marcarRepaso(personaje)
    else
        Cura.dolor(personaje)
    end
    pcall(function()
        if isClient ~= nil and isClient() and sendClientCommand ~= nil then
            sendClientCommand(personaje, "NarradorCoop", real and "curarme" or "dolorPastilla", {})
        end
    end)
    pcall(function()
        local texto
        if not real then texto = "Sabe a azucar. Al rato te empieza a doler el estomago."
        elseif estaba then texto = "La fiebre baja. La herida deja de arder. Vas a vivir."
        else texto = "Sabe a metal y a remedio de verdad. No pasa nada... no estabas infectado." end
        personaje:setHaloNote(texto, real and 120 or 230, real and 230 or 160, real and 160 or 120, 400)
    end)
end

return Cura
