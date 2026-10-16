-- Narrador Co-op: lugares emblematicos ocupados (servidor).
-- Si alguien saca aunque sea un objeto de una comisaria, armeria, base militar, hospital,
-- farmacia, supermercado o mall, ese lugar queda marcado. La proxima vez que alguien se
-- acerque (pasados unos dias) hay una faccion de bandidos viviendo ahi: zona sin zombis,
-- autos destrozados, cuerpos y grafitis alrededor, y los bandidos llevan botin segun el lugar.
-- Si los matan a todos, el lugar queda libre y 20 dias despues llegan otros.
-- Sin tildes ni enies a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local floor = math.floor

local O = Narrador.Ocupaciones or {}
Narrador.Ocupaciones = O

O.ESPERA = 72          -- horas desde el saqueo hasta que puede aparecer la faccion
O.REPOBLAR = 24 * 20   -- horas desde que se limpio hasta que llegan otros
O.CERCA_MAX = 110      -- aparecen cuando un jugador esta a esta distancia...
O.CERCA_MIN = 45       -- ...pero no mas cerca (nadie los ve aparecer)
O.REINTENTO = 1        -- horas entre intentos si A-Life no los pudo poner

-- Tipos de lugar: salas que lo identifican, nombre y botin de los ocupantes.
O.TIPOS = {
    { id = "militar", nombre = "la base militar", salas = { "armystorage", "armytent" },
      botin = { "Base.AssaultRifle", "Base.556Box", "Base.556Box", "Base.Vest_BulletArmy", "Base.Hat_Army", "Base.Bandage" } },
    { id = "armeria", nombre = "la armeria", salas = { "gunstore", "gunstorestorage", "armysurplusguns" },
      botin = { "Base.Pistol", "Base.Bullets9mmBox", "Base.Shotgun", "Base.ShotgunShellsBox", "Base.HuntingRifle", "Base.308Box" } },
    { id = "comisaria", nombre = "la comisaria", salas = { "policeoffice", "policestorage", "policehall", "policelocker" },
      botin = { "Base.Pistol", "Base.Bullets9mmBox", "Base.Shotgun", "Base.ShotgunShellsBox", "Base.Vest_BulletPolice", "Base.HandTorch" } },
    { id = "hospital", nombre = "el hospital", salas = { "hospitalroom", "hospitalhallway", "hospitalstorage" },
      botin = { "Base.Antibiotics", "Base.Bandage", "Base.AlcoholBandage", "Base.Pills", "Base.Disinfectant", "Base.SutureNeedle" } },
    { id = "farmacia", nombre = "la farmacia", salas = { "pharmacy", "pharmacystorage" },
      botin = { "Base.Antibiotics", "Base.Pills", "Base.PillsBeta", "Base.PillsAntiDep", "Base.Bandage", "Base.Disinfectant" } },
    { id = "mall", nombre = "el mall", minimo_tiendas = 5,
      botin = { "Base.Money", "Base.CigarettePack", "Base.Battery", "Base.DuctTape", "Base.TinnedBeans", "Base.WaterBottle" } },
    { id = "super", nombre = "el supermercado", salas = { "grocery", "grocerystorage", "gigamart" },
      botin = { "Base.TinnedBeans", "Base.CannedChili", "Base.CannedCorn", "Base.TinnedSoup", "Base.WaterBottle", "Base.CigarettePack" } },
}

O.AUTOS = { "Base.CarNormalBurnt", "Base.ModernCarBurnt", "Base.PickupBurnt", "Base.VanBurnt", "Base.SUVBurnt",
    "Base.NormalCarBurntPolice", "Base.CarNormalSmashedFront", "Base.ModernCarSmashedLeft", "Base.PickUpTruckSmashedFront",
    "Base.SUVSmashedRear", "Base.StepVanSmashedRight", "Base.CarStationWagonSmashedFront" }
O.BASURA = { "Base.BeerEmpty", "Base.BeerCanEmpty", "Base.TinCanEmpty", "Base.Garbagebag", "Base.BeerEmpty", "Base.TinCanEmpty" }
-- Grafitis del juego: los que van en paredes norte y los que van en paredes oeste (mismo
-- patron de profundidad que los carteles pintados: base = norte, +8 = oeste).
O.GRAFITI_N = { 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    48, 49, 50, 51, 52, 53, 59, 60, 61, 62, 63, 66, 67, 68, 69, 70, 71, 77, 78, 79, 88, 89, 90, 91, 96, 97, 98,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 112, 113, 114, 115 }
O.GRAFITI_W = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 40, 41, 42, 43, 44, 45, 46, 47, 54, 55, 56,
    57, 58, 64, 65, 72, 73, 74, 75, 76, 80, 81, 82, 83, 84, 85, 86, 87, 92, 93, 94, 95 }

function O.activo()
    return Mundo.sandbox("Ocupaciones", true) ~= false
end

function O.st()
    local st = Motor.estado()
    st.ocupaciones = st.ocupaciones or {}
    return st.ocupaciones
end

-- Edificios ya revisados que no son emblematicos (solo en memoria, no hace falta guardarlos).
O.descartados = O.descartados or {}

-- ---------------------------------------------------------------------------
-- Edificios
-- ---------------------------------------------------------------------------

local function clave(def) return tostring(def:getX()) .. "_" .. tostring(def:getY()) end

-- Que tipo de lugar emblematico es el edificio (o nil).
function O.clasificar(def)
    local nombres, tiendas = {}, 0
    pcall(function()
        local salas = def:getRooms()
        for i = 0, salas:size() - 1 do
            local n = tostring(salas:get(i):getName() or "")
            nombres[n] = true
            if string.find(n, "store", 1, true) ~= nil and string.find(n, "storage", 1, true) == nil then tiendas = tiendas + 1 end
        end
    end)
    for _, t in ipairs(O.TIPOS) do
        if t.minimo_tiendas ~= nil then
            if tiendas >= t.minimo_tiendas then return t end
        else
            for _, s in ipairs(t.salas) do if nombres[s] then return t end end
        end
    end
    return nil
end

function O.tipo(id)
    for _, t in ipairs(O.TIPOS) do if t.id == id then return t end end
    return nil
end

-- Objetos en los contenedores cargados del edificio (nil si no hay ninguno cargado).
function O.contar(def)
    local total, hay = 0, false
    pcall(function()
        local salas = def:getRooms()
        for i = 0, salas:size() - 1 do
            local cuarto = salas:get(i):getIsoRoom()
            if cuarto ~= nil then
                local conts = cuarto:getContainer()
                for j = 0, conts:size() - 1 do
                    local c = conts:get(j)
                    if c ~= nil then
                        hay = true
                        total = total + c:getItems():size()
                    end
                end
            end
        end
    end)
    if not hay then return nil end
    return total
end

function O.registro(def, tipo)
    local k = clave(def)
    local e = O.st()[k]
    if e == nil then
        local x, y, w, h = def:getX(), def:getY(), def:getW(), def:getH()
        e = { x = x, y = y, w = w, h = h, cx = floor(x + w / 2), cy = floor(y + h / 2), tipo = tipo.id, base = 0 }
        e.etiqueta = Mundo.describir(e.cx, e.cy, nil, tipo.nombre)
        O.st()[k] = e
    end
    return e, k
end

-- Cada minuto: los jugadores que estan dentro de un lugar emblematico. Si el lugar tiene menos
-- objetos que el maximo que se le vio, alguien saco algo: queda saqueado.
function O.revisarJugadores()
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.vivo(p) then
            pcall(function()
                local sq = p:getCurrentSquare()
                local b = sq ~= nil and sq:getBuilding() or nil
                local def = b ~= nil and b:getDef() or nil
                if def == nil then return end
                local k = clave(def)
                if O.descartados[k] then return end
                local e = O.st()[k]
                if e == nil then
                    local t = O.clasificar(def)
                    if t == nil then O.descartados[k] = true; return end
                    e = O.registro(def, t)
                end
                if e.estado == "ocupado" then return end
                local n = O.contar(def)
                if n == nil then return end
                if n > e.base then e.base = n end
                if e.saqueado == nil and e.base > 0 and n < e.base then
                    e.saqueado = Mundo.horas()
                    Mundo.log("ocupaciones: saquearon " .. tostring(e.etiqueta) .. " (" .. n .. " de " .. e.base .. ")")
                end
            end)
        end
    end
end

-- ---------------------------------------------------------------------------
-- Decoracion
-- ---------------------------------------------------------------------------

-- Casilla de afuera, libre y cargada, a "desde".."hasta" casillas del borde del edificio.
local function casillaAfuera(e, desde, hasta)
    for _ = 1, 30 do
        local lado = Mundo.azar(4)
        local d = desde + Mundo.azar(math.max(1, hasta - desde + 1)) - 1
        local x, y
        if lado == 1 then x, y = e.x + Mundo.azar(e.w) - 1, e.y - d
        elseif lado == 2 then x, y = e.x + Mundo.azar(e.w) - 1, e.y + e.h + d
        elseif lado == 3 then x, y = e.x - d, e.y + Mundo.azar(e.h) - 1
        else x, y = e.x + e.w + d, e.y + Mundo.azar(e.h) - 1 end
        local sq = Mundo.cargado(x, y, 0)
        local ok, sirve = pcall(function() return sq ~= nil and sq:getBuilding() == nil and sq:isFree(false) end)
        if ok and sirve then return sq end
    end
    return nil
end

-- Grafitis en las paredes de afuera (norte y oeste del edificio, y las del sur y el este,
-- que en el juego son la pared norte/oeste de la casilla siguiente).
function O.grafitear(e, cuantos)
    local puestos = 0
    local candidatas = {}
    for x = e.x, e.x + e.w - 1 do
        candidatas[#candidatas + 1] = { x, e.y, "N" }
        candidatas[#candidatas + 1] = { x, e.y + e.h, "N" }
    end
    for y = e.y, e.y + e.h - 1 do
        candidatas[#candidatas + 1] = { e.x, y, "W" }
        candidatas[#candidatas + 1] = { e.x + e.w, y, "W" }
    end
    for _ = 1, cuantos * 6 do
        if puestos >= cuantos or #candidatas == 0 then break end
        local c = table.remove(candidatas, Mundo.azar(#candidatas))
        local sq = Mundo.cargado(c[1], c[2], 0)
        if sq ~= nil then
            pcall(function()
                local objs = sq:getObjects()
                for i = 0, objs:size() - 1 do
                    local o = objs:get(i)
                    local pared = (c[3] == "N" and o:isWallN()) or (c[3] == "W" and o:isWallW())
                    if pared then
                        local lista = c[3] == "N" and O.GRAFITI_N or O.GRAFITI_W
                        o:setOverlaySprite("overlay_graffiti_wall_01_" .. lista[Mundo.azar(#lista)], 1, 1, 1, 1)
                        puestos = puestos + 1
                        break
                    end
                end
            end)
        end
    end
    return puestos
end

function O.decorar(e)
    local autos, cuerpos, basura = 0, 0, 0
    if addVehicleDebug ~= nil then
        for _ = 1, 2 + Mundo.azar(2) do
            local sq = casillaAfuera(e, 4, 14)
            if sq ~= nil then
                local dirs = { "N", "S", "E", "W" }
                local ok = pcall(function()
                    local v = addVehicleDebug(O.AUTOS[Mundo.azar(#O.AUTOS)], IsoDirections[dirs[Mundo.azar(4)]], nil, sq)
                    if v ~= nil then autos = autos + 1 end
                end)
                if not ok then break end
            end
        end
    end
    if createRandomDeadBody ~= nil then
        for _ = 1, 5 + Mundo.azar(4) do
            local sq = casillaAfuera(e, 1, 12)
            if sq ~= nil then
                pcall(function()
                    createRandomDeadBody(sq, 10)
                    cuerpos = cuerpos + 1
                    if addBloodSplat ~= nil then addBloodSplat(sq, 8) end
                end)
            end
        end
    end
    for _ = 1, 6 + Mundo.azar(6) do
        local sq = casillaAfuera(e, 0, 8)
        if sq ~= nil then
            pcall(function()
                sq:AddWorldInventoryItem(O.BASURA[Mundo.azar(#O.BASURA)], Mundo.azar(9) / 10, Mundo.azar(9) / 10, 0)
                basura = basura + 1
            end)
        end
    end
    local grafitis = O.grafitear(e, 4 + Mundo.azar(4))
    Mundo.log("ocupaciones: decorado " .. tostring(e.etiqueta) .. ": " .. autos .. " autos, " .. cuerpos
        .. " cuerpos, " .. basura .. " basura, " .. grafitis .. " grafitis")
    return autos + cuerpos + grafitis > 0
end

-- ---------------------------------------------------------------------------
-- Ocupantes
-- ---------------------------------------------------------------------------

function O.ocupar(e, k, jugador)
    e.pedido = Mundo.horas()
    e.intentos = (e.intentos or 0) + 1
    local n = floor((3 + Mundo.azar(5)) * Motor.dificultad() + 0.5)
    n = math.max(3, math.min(10, n))
    local faccion = Motor.FACCIONES_BANDIDAS[Mundo.azar(#Motor.FACCIONES_BANDIDAS)]
    local args = {
        requestId = "narrador:ocupa:" .. k .. ":" .. tostring(e.intentos),
        x = e.cx, y = e.cy, z = 0, mode = "guard", radius = math.max(4, math.min(12, floor(math.min(e.w, e.h) / 2))),
        distance = 0, separation = 1, atomicGroup = true, persistent = true,
        factionId = faccion, count = n, hostileOverride = true, playerKeepOut = 0,
        leashRadius = math.max(e.w, e.h) / 2 + 10,
    }
    local ok, razon = Mundo.spawnGrupo(jugador, args, function(resultado)
        local uids = type(resultado) == "table" and resultado.actorUids or nil
        if type(uids) ~= "table" or uids[1] == nil then return end
        e.uids, e.botin = {}, {}
        for _, uid in ipairs(uids) do e.uids[#e.uids + 1] = uid end
        e.estado, e.desde, e.faccion, e.pedido, e.faltas = "ocupado", Mundo.horas(), faccion, nil, {}
        Mundo.log("ocupaciones: " .. #e.uids .. " bandidos (" .. tostring(faccion) .. ") en " .. tostring(e.etiqueta))
        if not e.decorado then e.decorado = O.decorar(e) end
        Motor.publicar()
    end)
    if not ok then Mundo.log("ocupaciones: A-Life no pudo poner gente en " .. tostring(e.etiqueta) .. ": " .. tostring(razon)) end
    return ok
end

-- Botin segun el lugar, una vez por ocupante y solo con el cuerpo cargado.
function O.darBotin(e, uid)
    if e.botin[uid] then return end
    local cuerpo = Mundo.cuerpoActor(uid)
    if cuerpo == nil then return end
    local t = O.tipo(e.tipo)
    if t == nil then e.botin[uid] = true; return end
    pcall(function()
        local inv = cuerpo:getInventory()
        for _ = 1, 1 + Mundo.azar(2) do inv:AddItem(t.botin[Mundo.azar(#t.botin)]) end
    end)
    e.botin[uid] = true
end

function O.revisarOcupado(e, k)
    local vivos = 0
    for _, uid in ipairs(e.uids or {}) do
        local actor = Mundo.actor(uid)
        local muerto = actor ~= nil and actor.lifecycle == "dead"
        if actor == nil then
            e.faltas[uid] = (e.faltas[uid] or 0) + 1
            if e.faltas[uid] >= 5 then muerto = true end
        else
            e.faltas[uid] = 0
        end
        if not muerto then
            vivos = vivos + 1
            pcall(O.darBotin, e, uid)
        end
    end
    if vivos == 0 then
        e.estado, e.limpiado, e.uids, e.botin, e.faltas, e.avisado = "libre", Mundo.horas(), nil, nil, nil, nil
        Mundo.log("ocupaciones: limpiaron " .. tostring(e.etiqueta))
        local j = Mundo.jugadorCerca(e.cx, e.cy, 120)
        if j ~= nil then
            Motor.enviar(j, "aviso", { texto = "Limpiaste " .. tostring(e.etiqueta) .. ". En unas semanas va a llegar otra gente a ocuparlo." })
            -- Acabar con bandidos mejora la reputacion de Knox (aunque este en negativo).
            if Narrador.Knox ~= nil then pcall(Narrador.Knox.bandidosLimpios, j) end
        end
        Motor.publicar()
        return
    end
    if Motor.minutosDesdeArranque % 10 == 0 then
        Mundo.limpiarZona(e.cx, e.cy, math.max(e.w, e.h) / 2 + 25, 0)
    end
    -- Aviso una vez por visita al acercarse.
    local j = Mundo.jugadorCerca(e.cx, e.cy, 70)
    if j ~= nil and not e.avisado then
        e.avisado = true
        Motor.enviar(j, "aviso", { texto = "Hay gente viviendo en " .. tostring(e.etiqueta) .. ". Autos quemados, cuerpos y rayados en las paredes. No parecen amistosos." })
    elseif j == nil and Mundo.jugadorCerca(e.cx, e.cy, 150) == nil then
        e.avisado = nil
    end
end

function O.listoParaOcupar(e)
    local ahora = Mundo.horas()
    if e.pedido ~= nil and ahora - e.pedido < O.REINTENTO then return false end
    if e.estado == "libre" then return e.limpiado ~= nil and ahora - e.limpiado >= O.REPOBLAR end
    return e.saqueado ~= nil and ahora - e.saqueado >= O.ESPERA
end

function O.tick()
    if not O.activo() or not Mundo.hayALife() then return end
    O.revisarJugadores()
    for k, e in pairs(O.st()) do
        if e.estado == "ocupado" then
            pcall(O.revisarOcupado, e, k)
        elseif O.listoParaOcupar(e) then
            local j, d = Mundo.jugadorCerca(e.cx, e.cy, O.CERCA_MAX)
            if j ~= nil and d >= O.CERCA_MIN and Mundo.jugadorCerca(e.cx, e.cy, O.CERCA_MIN) == nil
                    and Mundo.cargado(e.cx, e.cy, 0) ~= nil then
                pcall(O.ocupar, e, k, j)
            end
        end
    end
end

Motor.tickExtra = Motor.tickExtra or {}
Motor.tickExtra.ocupaciones = O.tick

-- Admin: ocupar ya el lugar emblematico donde esta (o el registrado mas cercano), sin esperas.
function O.ocuparAhora(jugador, args)
    local px, py = Mundo.posicion(jugador)
    if px == nil then return "Sin posicion." end
    local e, k
    pcall(function()
        local sq = jugador:getCurrentSquare()
        local b = sq ~= nil and sq:getBuilding() or nil
        local def = b ~= nil and b:getDef() or nil
        if def ~= nil then
            local t = O.clasificar(def)
            if t ~= nil then e, k = O.registro(def, t) end
        end
    end)
    if e == nil then
        local mejor
        for kk, ee in pairs(O.st()) do
            local d = math.sqrt((ee.cx - px) ^ 2 + (ee.cy - py) ^ 2)
            if ee.estado ~= "ocupado" and (mejor == nil or d < mejor) then mejor, e, k = d, ee, kk end
        end
    end
    if e == nil then return "No hay ningun lugar emblematico registrado. Entra a uno primero." end
    if e.estado == "ocupado" then return tostring(e.etiqueta) .. " ya esta ocupado." end
    e.saqueado = e.saqueado or (Mundo.horas() - O.ESPERA)
    e.pedido = nil
    local ok = O.ocupar(e, k, jugador)
    return ok and ("Ocupando " .. tostring(e.etiqueta) .. ".") or "A-Life no pudo poner a la gente (mira el log)."
end

function O.estadoTexto()
    local partes = {}
    for _, e in pairs(O.st()) do
        partes[#partes + 1] = tostring(e.etiqueta) .. ": " .. tostring(e.estado or (e.saqueado and "saqueado" or "intacto"))
    end
    if #partes == 0 then return "Ningun lugar emblematico registrado todavia." end
    return table.concat(partes, " | ")
end

Motor.comandosAdmin = Motor.comandosAdmin or {}
Motor.comandosAdmin.ocupacionAhora = function(jugador, args) return O.ocuparAhora(jugador, args) end
Motor.comandosAdmin.ocupacionesEstado = function(jugador, args) return O.estadoTexto() end

return O
