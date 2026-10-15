-- Narrador Co-op: las pastillas K-93 (item Narrador.CuraZ).
-- Todas se ven iguales. Cada una lleva en su modData si es la verdadera ("real") o azucar
-- ("falsa"). La verdadera cura la infeccion zombi (mordida incluida); las falsas solo dan
-- dolor de estomago. Con Medicina (First Aid) 4 o mas se pueden examinar para saber cual es
-- cual; si no, toca probarlas. Las usan la mision de la cura (Louisville) y los Bell.
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
