-- Narrador Co-op (servidor): un maniqui fijo en el puesto de cada misionero.
-- Queda siempre ahi, vestido como el misionero (decoracion del campamento). Si el NPC del
-- misionero no esta, se le pueden pedir misiones al maniqui (clic derecho, ver
-- client/Narrador/NarradorManiquiesCliente.lua); si el NPC esta, se habla con el.
-- Se pone una sola vez por misionero (e.maniqui) cuando el campamento ya esta fundado y su
-- puesto esta cargado; si alguien lo saca o lo rompe, se vuelve a poner.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local floor = math.floor

local MQ = Narrador.Maniquies or {}
Narrador.Maniquies = MQ

MQ.ETIQUETA = "NarradorManiqui"
MQ.SPRITE = { mujer = "location_shop_mall_01_65", hombre = "location_shop_mall_01_68" }
MQ.DEFS = {
    muldraugh = { script = "MaleWhite01", ropa = { "Base.Hat_Police", "Base.Shirt_PoliceBlue", "Base.Vest_BulletPolice",
        "Base.Trousers_Police", "Base.Shoes_BlackBoots" } },
    westpoint = { script = "FemaleWhite01", mujer = true, ropa = { "Base.Hat_Fireman", "Base.Jacket_Fireman",
        "Base.Trousers_Fireman", "Base.Shoes_BlackBoots" } },
    riverside = { script = "MaleWhite02", ropa = { "Base.Shirt_Priest", "Base.Necklace_Crucifix", "Base.Trousers_Black",
        "Base.Shoes_Black", "Base.Glasses_Normal" } },
    rosewood = { script = "FemaleWhite02", mujer = true, ropa = { "Base.Jumper_RoundNeck", "Base.Apron_White",
        "Base.Skirt_Normal", "Base.Shoes_Black" } },
}

-- El maniqui de este misionero en esa casilla (o nil).
function MQ.buscar(sq, id)
    local hallado
    pcall(function()
        local objs = sq:getSpecialObjects()
        for i = 0, objs:size() - 1 do
            local o = objs:get(i)
            if instanceof(o, "IsoMannequin") and o:getModData()[MQ.ETIQUETA] == id then hallado = o end
        end
    end)
    return hallado
end

-- Casilla libre junto al puesto (el puesto es donde se para el NPC).
function MQ.casillaJunto(e)
    local z = floor(tonumber(e.z) or 0)
    for _, d in ipairs({ { 1, 0 }, { 0, 1 }, { -1, 0 }, { 0, -1 }, { 1, 1 }, { -1, 1 }, { 1, -1 }, { -1, -1 } }) do
        local sq = Mundo.cargado(floor(e.x) + d[1], floor(e.y) + d[2], z)
        local libre = false
        if sq ~= nil then pcall(function() libre = sq:isFree(false) and sq:getRoom() ~= nil end) end
        if libre then return sq end
    end
    return nil
end

function MQ.poner(c, e, sq)
    local def = MQ.DEFS[c.id]
    if def == nil or sq == nil or IsoMannequin == nil then return false end
    local ok, err = pcall(function()
        local spr = getSprite(def.mujer and MQ.SPRITE.mujer or MQ.SPRITE.hombre)
        local m = IsoMannequin.new(getCell(), sq, spr)
        m:setSquare(sq)
        pcall(function() m:setMannequinScriptName(def.script) end)
        pcall(function() m:setDir(IsoDirections.S) end)
        m:getModData()[MQ.ETIQUETA] = c.id
        for _, tipo in ipairs(def.ropa) do
            local item = Mundo.crearItem(tipo)
            if item ~= nil then
                pcall(function()
                    local cont = m:getContainer()
                    if cont ~= nil then cont:AddItem(item) end
                    m:wearItem(item, nil)
                end)
            end
        end
        sq:AddSpecialObject(m)
        m:transmitCompleteItemToClients()
    end)
    if not ok then Mundo.log("no se pudo poner el maniqui de " .. tostring(c.id) .. ": " .. tostring(err)) end
    return ok
end

-- Cada 10 minutos: el maniqui de cada campamento fundado, si su puesto esta cargado.
function MQ.revisar()
    for _, c in ipairs(C.LISTA or {}) do
        pcall(function()
            local e = C.estado(c.id)
            if e.x == nil or not C.desbloqueado(c.id) or MQ.DEFS[c.id] == nil then return end
            if e.maniqui ~= nil then
                local sq = Mundo.cargado(e.maniqui.x, e.maniqui.y, e.maniqui.z)
                if sq == nil or MQ.buscar(sq, c.id) ~= nil then return end
            end
            if Mundo.cargado(e.x, e.y, e.z) == nil then return end
            local sq = MQ.casillaJunto(e)
            if sq ~= nil and MQ.poner(c, e, sq) then
                e.maniqui = { x = sq:getX(), y = sq:getY(), z = sq:getZ() }
                Mundo.log("maniqui de " .. C.nombreCompleto(c) .. " en " .. e.maniqui.x .. "," .. e.maniqui.y)
            end
        end)
    end
end

-- El cliente necesita saber de quien es cada maniqui y si su NPC esta (para ofrecer misiones).
Motor.vistaExtra = Motor.vistaExtra or {}
Motor.vistaExtra[#Motor.vistaExtra + 1] = function(v)
    local lista = {}
    for _, c in ipairs(C.LISTA or {}) do
        local e = C.estado(c.id)
        if e.maniqui ~= nil then
            lista[#lista + 1] = { id = c.id, x = e.maniqui.x, y = e.maniqui.y, z = e.maniqui.z, nombre = C.nombreCompleto(c),
                npc = C.npcEnPuesto(c.id) }
        end
    end
    v.maniquies = lista
end

if Events ~= nil and not MQ._enganchado then
    MQ._enganchado = true
    Events.EveryTenMinutes.Add(function() pcall(MQ.revisar) end)
end

return MQ
