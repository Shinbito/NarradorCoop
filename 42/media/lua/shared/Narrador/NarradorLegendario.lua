-- Narrador Co-op: armas, trajes y autos legendarios (o "chetados").
-- Las mejoras se guardan en la memoria del objeto (modData) y se vuelven a aplicar en el
-- servidor y en cada cliente cuando hace falta. Asi no se pierden al guardar, al pasar el
-- objeto de mano en mano ni al cambiar de servidor a cliente.

Narrador = Narrador or {}
local L = Narrador.Legendario or {}
Narrador.Legendario = L

L.VERSION = 1

-- Que tan fuertes son ("fuertes pero justos").
L.NIVELES = {
    legendaria = { dano = 1.5, durabilidad = 4, critico = 10, mordida = 60, rasguno = 90, etiqueta = "Legendario" },
    chetada = { dano = 1.25, durabilidad = 2, critico = 5, mordida = 40, rasguno = 70, etiqueta = "Excepcional" },
}

-- Cada entrada: alternativas por si un tipo no existe. Las armas de fuego traen municion.
L.ARMAS = {
    { tipo = { "Base.AssaultRifle2", "Base.AssaultRifle" }, municion = { { "Base.556Box", "Base.556Bullets" }, { "Base.556Box", "Base.556Bullets" } } },
    { tipo = { "Base.HuntingRifle" }, municion = { { "Base.308Box", "Base.308Bullets" }, { "Base.308Box", "Base.308Bullets" } } },
    { tipo = { "Base.Shotgun" }, municion = { { "Base.ShotgunShellsBox", "Base.ShotgunShells" }, { "Base.ShotgunShells" } } },
    { tipo = { "Base.Machete" } },
    { tipo = { "Base.Axe" } },
    { tipo = { "Base.Crowbar" } },
}

L.TRAJE = {
    { "Base.Vest_BulletArmy", "Base.Vest_BulletPolice" },
    { "Base.Hat_CrashHelmet_Police", "Base.Hat_RiotHelmet", "Base.Hat_Army" },
    { "Base.Jacket_ArmyCamoGreen", "Base.Jacket_ArmyOliveDrab" },
    { "Base.Trousers_ArmyService" },
    { "Base.Shoes_ArmyBoots" },
}

L.AUTOS = { "Base.PickUpTruck_Camo", "Base.OffRoad", "Base.SUV", "Base.PickUpTruck" }

local function azar(n)
    if n <= 1 then return 1 end
    if ZombRand ~= nil then return ZombRand(n) + 1 end
    return math.random(n)
end

local function crearItem(tipos)
    if type(tipos) == "string" then tipos = { tipos } end
    if instanceItem == nil then return nil end
    for _, tipo in ipairs(tipos) do
        local ok, item = pcall(instanceItem, tipo)
        if ok and item ~= nil then return item end
    end
    return nil
end

local function llamar(objeto, metodo, ...)
    if objeto == nil then return nil end
    local f = objeto[metodo]
    if type(f) ~= "function" then return nil end
    local ok, r = pcall(f, objeto, ...)
    if ok then return r end
    return nil
end

local function es(item, clase)
    if instanceof == nil then return false end
    local ok, r = pcall(instanceof, item, clase)
    return ok and r == true
end

-- Aplica (o vuelve a aplicar) las mejoras guardadas en el objeto. Es idempotente: siempre
-- parte de los valores base del tipo de objeto.
function L.aplicar(item)
    if item == nil then return false end
    local md = llamar(item, "getModData")
    local spec = type(md) == "table" and md.NarradorLegendario or nil
    if type(spec) ~= "table" then return false end
    local nivel = L.NIVELES[tostring(spec.nivel)] or L.NIVELES.legendaria
    local script = llamar(item, "getScriptItem")
    if es(item, "HandWeapon") then
        local minBase = tonumber(llamar(script, "getMinDamage")) or tonumber(spec.minBase)
        local maxBase = tonumber(llamar(script, "getMaxDamage")) or tonumber(spec.maxBase)
        local condBase = tonumber(llamar(script, "getConditionMax")) or tonumber(spec.condBase)
        local critBase = tonumber(llamar(script, "getCriticalChance")) or tonumber(spec.critBase) or 0
        if minBase ~= nil then llamar(item, "setMinDamage", minBase * nivel.dano) end
        if maxBase ~= nil then llamar(item, "setMaxDamage", maxBase * nivel.dano) end
        if critBase ~= nil then llamar(item, "setCriticalChance", critBase + nivel.critico) end
        if condBase ~= nil then
            local nuevoMax = math.floor(condBase * nivel.durabilidad)
            llamar(item, "setConditionMax", nuevoMax)
            if spec.recienCreado then llamar(item, "setCondition", nuevoMax) end
        end
    elseif es(item, "Clothing") then
        local mordida = tonumber(llamar(item, "getBiteDefense")) or 0
        local rasguno = tonumber(llamar(item, "getScratchDefense")) or 0
        llamar(item, "setBiteDefense", math.max(mordida, nivel.mordida))
        llamar(item, "setScratchDefense", math.max(rasguno, nivel.rasguno))
        local condBase = tonumber(llamar(script, "getConditionMax"))
        if condBase ~= nil then
            local nuevoMax = math.floor(condBase * nivel.durabilidad)
            llamar(item, "setConditionMax", nuevoMax)
            if spec.recienCreado then llamar(item, "setCondition", nuevoMax) end
        end
    end
    if spec.nombre ~= nil then
        llamar(item, "setName", spec.nombre)
        llamar(item, "setCustomName", true)
    end
    spec.recienCreado = nil
    return true
end

function L.marcar(item, nivelId)
    local md = llamar(item, "getModData")
    if type(md) ~= "table" then return end
    local nivel = L.NIVELES[nivelId] or L.NIVELES.legendaria
    local base = tostring(llamar(item, "getDisplayName") or llamar(item, "getName") or "Objeto")
    md.NarradorLegendario = { nivel = nivelId, nombre = base .. " [" .. nivel.etiqueta .. "]", recienCreado = true, v = L.VERSION }
    L.aplicar(item)
end

-- Crea los objetos de una recompensa. clase: "arma" o "traje". Devuelve una lista de items.
function L.crear(clase, nivelId)
    local items = {}
    if clase == "traje" then
        for _, tipos in ipairs(L.TRAJE) do
            local item = crearItem(tipos)
            if item ~= nil then
                L.marcar(item, nivelId)
                items[#items + 1] = item
            end
        end
        return items
    end
    local opciones = {}
    for _, arma in ipairs(L.ARMAS) do
        if nivelId ~= "chetada" or arma.municion == nil then opciones[#opciones + 1] = arma end
    end
    local elegida = opciones[azar(#opciones)]
    local item = crearItem(elegida.tipo)
    if item ~= nil then
        L.marcar(item, nivelId)
        items[#items + 1] = item
        for _, tipos in ipairs(elegida.municion or {}) do
            local bala = crearItem(tipos)
            if bala ~= nil then items[#items + 1] = bala end
        end
    end
    return items
end

-- Auto legendario: motor al maximo y mas potente, todo reparado y estanque lleno.
-- Devuelve true si quedo puesto (necesita la zona cargada y espacio libre).
function L.crearAuto(x, y, z)
    if addVehicleDebug == nil or getCell == nil then return true end
    local vehiculo
    for intento = 0, 6 do
        local sq
        pcall(function() sq = getCell():getGridSquare(math.floor(x) + intento * 3, math.floor(y) + 4, math.floor(z or 0)) end)
        if sq ~= nil then
            local direccion
            pcall(function() direccion = IsoDirections.S end)
            for _, script in ipairs(L.AUTOS) do
                local ok, v = pcall(addVehicleDebug, script, direccion, nil, sq)
                if ok and v ~= nil then vehiculo = v; break end
            end
        end
        if vehiculo ~= nil then break end
    end
    if vehiculo == nil then return false end
    pcall(function() vehiculo:repair() end)
    pcall(function()
        for i = 0, vehiculo:getPartCount() - 1 do
            local parte = vehiculo:getPartByIndex(i)
            if parte ~= nil then
                parte:setCondition(100)
                pcall(function() vehiculo:transmitPartCondition(parte) end)
            end
        end
    end)
    pcall(function()
        local tanque = vehiculo:getPartById("GasTank")
        if tanque ~= nil then
            tanque:setContainerContentAmount(tanque:getContainerCapacity())
            vehiculo:transmitPartModData(tanque)
        end
    end)
    pcall(function()
        vehiculo:setEngineFeature(100, math.floor(vehiculo:getEngineLoudness() * 0.7),
            math.floor(vehiculo:getEnginePower() * 1.5))
    end)
    pcall(function() vehiculo:getModData().NarradorLegendario = true end)
    -- Llaves: segun la version del juego se crean de una u otra forma.
    local llave
    pcall(function() llave = vehiculo:createVehicleKey() end)
    if llave ~= nil then
        pcall(function()
            local sq = vehiculo:getSquare() or getCell():getGridSquare(math.floor(x), math.floor(y), math.floor(z or 0))
            sq:AddWorldInventoryItem(llave, 0.5, 0.5, 0)
        end)
    else
        pcall(function() vehiculo:setHotwired(true) end)
    end
    return true
end

-- Reaplicar en todo lo que lleva un jugador (al entrar, al equiparse y cada tanto).
function L.repasarJugador(jugador)
    if jugador == nil then return end
    pcall(function()
        local function recorrer(inv, profundidad)
            if inv == nil or profundidad > 2 then return end
            local items = inv:getItems()
            for i = 0, items:size() - 1 do
                local it = items:get(i)
                if it ~= nil then
                    local md = it:hasModData() and it:getModData() or nil
                    if md ~= nil and md.NarradorLegendario ~= nil then L.aplicar(it) end
                    if instanceof(it, "InventoryContainer") then recorrer(it:getInventory(), profundidad + 1) end
                end
            end
        end
        recorrer(jugador:getInventory(), 0)
    end)
end

function L.alEquipar(jugador, item)
    if item ~= nil then L.aplicar(item) end
end

if Events ~= nil and not L._enganchado then
    L._enganchado = true
    if Events.OnEquipPrimary ~= nil then Events.OnEquipPrimary.Add(L.alEquipar) end
    if Events.OnEquipSecondary ~= nil then Events.OnEquipSecondary.Add(L.alEquipar) end
    if Events.OnClothingUpdated ~= nil then
        Events.OnClothingUpdated.Add(function(personaje) L.repasarJugador(personaje) end)
    end
    if Events.OnGameStart ~= nil then
        Events.OnGameStart.Add(function()
            if getPlayer ~= nil then L.repasarJugador(getPlayer()) end
        end)
    end
end

return L
