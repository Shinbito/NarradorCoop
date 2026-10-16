-- Narrador Co-op: acompanantes que "se suben al auto".
-- Los NPC de A-Life no se pueden sentar en un vehiculo. Asi que, si un acompanante esta cerca
-- cuando su jugador se sube a un auto, sale un texto de rol ("se sube donde sea que haya
-- espacio") y el NPC desaparece; cada vez que el jugador se baja, aparece a su lado.
-- Mientras van a pie, camina con el jugador (postura "walkWith" de A-Life).
--
-- Uso desde otros modulos o arcos:
--   Narrador.Pasajeros.agregar(uid, jugador, { nombre = "Sofia" })
--   Narrador.Pasajeros.quitar(uid)
-- Accion de arco: { "acompanante", grupo = "hija", rol = "hija" } (con el jugador mas cercano)
--                 { "soltar_acompanante", grupo = "hija", rol = "hija" }
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local floor = math.floor

local P = Narrador.Pasajeros or {}
Narrador.Pasajeros = P

-- Distancia maxima para subirse al auto con el jugador (casillas).
P.RADIO_SUBIR = 12
-- Cada cuanto se revisa (milisegundos reales).
P.CADA_MS = 1000

function P.lista()
    local st = Motor.estado()
    st.pasajeros = st.pasajeros or {}
    return st.pasajeros
end

local function jugadorPorNombre(nombre)
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.nombreJugador(p) == nombre then return p end
    end
    return nil
end

local function enAuto(jugador)
    local ok, v = pcall(function() return jugador:getVehicle() end)
    return ok and v ~= nil
end

-- Banderas de un acompanante: inmortal, sin correa ni quieto (para que pueda seguirte).
P.BANDERAS = { persistent = true, invulnerable = true, stationary = false, leashRadius = 0 }

function P.agregar(uid, jugador, opciones)
    if uid == nil or jugador == nil then return false end
    opciones = opciones or {}
    local lista = P.lista()
    lista[tostring(uid)] = { uid = uid, jugador = Mundo.nombreJugador(jugador), nombre = opciones.nombre or "Tu acompanante",
        subido = false, inmortal = opciones.inmortal ~= false }
    local banderas = Motor.copiar(P.BANDERAS)
    banderas.invulnerable = opciones.inmortal ~= false
    pcall(Mundo.banderas, uid, banderas)
    pcall(Mundo.acompanar, uid, jugador, 2)
    Mundo.log("acompanante " .. tostring(uid) .. " con " .. tostring(lista[tostring(uid)].jugador))
    return true
end

function P.quitar(uid)
    local lista = P.lista()
    local a = lista[tostring(uid)]
    if a == nil then return false end
    if a.subido then P.bajar(a, jugadorPorNombre(a.jugador)) end
    lista[tostring(uid)] = nil
    return true
end

function P.esAcompanante(uid)
    return P.lista()[tostring(uid)] ~= nil
end

-- ---------------------------------------------------------------------------
-- Esconder y aparecer
-- ---------------------------------------------------------------------------

-- Mueve al NPC: su ficha en A-Life (para cuando se vuelva a cargar) y su cuerpo si esta cargado.
function P.mover(uid, x, y, z)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro ~= nil and type(registro.peek) == "function" and type(registro.update) == "function" then
        for _ = 1, 3 do
            local actual = registro.peek(uid)
            if actual == nil then break end
            local ok, r = pcall(registro.update, uid, actual.revision, function(a)
                a.worldPosition = { x = floor(x), y = floor(y), z = floor(z or 0) }
            end)
            if ok and r ~= nil then break end
        end
    end
    local cuerpo = Mundo.cuerpoActor(uid)
    if cuerpo ~= nil then
        pcall(function()
            cuerpo:setX(x); cuerpo:setY(y); cuerpo:setZ(z or 0)
            cuerpo:setLx(x); cuerpo:setLy(y); cuerpo:setLz(z or 0)
            local sq = getCell():getGridSquare(floor(x), floor(y), floor(z or 0))
            if sq ~= nil then cuerpo:setCurrent(sq) end
        end)
    end
end

local function visible(uid, si)
    local cuerpo = Mundo.cuerpoActor(uid)
    if cuerpo == nil then return end
    pcall(function() cuerpo:setInvisible(not si) end)
    pcall(function() cuerpo:setGhostMode(not si) end)
end

-- Casilla libre al lado del jugador (fuera del auto).
local function alLado(jugador)
    local x, y, z = Mundo.posicion(jugador)
    for _, d in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 }, { 1, 1 }, { -1, -1 }, { 2, 0 }, { 0, 2 } }) do
        local sq = Mundo.cargado(x + d[1], y + d[2], z)
        local libre = false
        pcall(function() libre = sq ~= nil and sq:isFree(false) end)
        if libre then return x + d[1] + 0.5, y + d[2] + 0.5, z end
    end
    return x + 1, y, z
end

function P.subir(a, jugador)
    a.subido = true
    visible(a.uid, false)
    Motor.enviar(jugador, "aviso", { texto = tostring(a.nombre) .. " se sube donde sea que haya espacio." })
    Mundo.log("acompanante " .. tostring(a.uid) .. " se subio al auto")
end

function P.bajar(a, jugador)
    a.subido = false
    if jugador ~= nil then
        local x, y, z = alLado(jugador)
        P.mover(a.uid, x, y, z)
        pcall(Mundo.acompanar, a.uid, jugador, 2)
        Motor.enviar(jugador, "aviso", { texto = tostring(a.nombre) .. " se baja contigo." })
    end
    visible(a.uid, true)
    Mundo.log("acompanante " .. tostring(a.uid) .. " se bajo del auto")
end

-- ---------------------------------------------------------------------------
-- Ciclo
-- ---------------------------------------------------------------------------

P.ultimo = 0

function P.revisar()
    local ahora = getTimestampMs ~= nil and getTimestampMs() or 0
    if ahora - P.ultimo < P.CADA_MS then return end
    P.ultimo = ahora
    local lista = P.lista()
    if next(lista) == nil then return end
    for clave, a in pairs(lista) do
        pcall(function()
            if not Mundo.actorVivo(a.uid) then
                lista[clave] = nil
                return
            end
            local j = jugadorPorNombre(a.jugador)
            if j == nil then return end
            local auto = enAuto(j)
            if auto and not a.subido then
                local jx, jy = Mundo.posicion(j)
                local nx, ny = Mundo.posicionActor(a.uid)
                if nx ~= nil and math.sqrt((nx - jx) ^ 2 + (ny - jy) ^ 2) <= P.RADIO_SUBIR then P.subir(a, j) end
            elseif not auto and a.subido then
                P.bajar(a, j)
            elseif a.subido then
                -- Va en el auto: su ficha viaja con el jugador (por si se descarga y se recarga).
                local x, y, z = Mundo.posicion(j)
                if (a.cuenta or 0) % 5 == 0 then P.mover(a.uid, x, y, z) end
                visible(a.uid, false)
            end
            a.cuenta = (a.cuenta or 0) + 1
        end)
    end
end

-- Cada 10 minutos de juego: renovar el "camina conmigo" de los que van a pie.
function P.renovar()
    for _, a in pairs(P.lista()) do
        if not a.subido then
            local j = jugadorPorNombre(a.jugador)
            if j ~= nil then pcall(Mundo.acompanar, a.uid, j, 2) end
        end
    end
end

-- ---------------------------------------------------------------------------
-- Acciones de arco
-- ---------------------------------------------------------------------------

local function uidDe(inst, a)
    local g = inst.grupos[a.grupo]
    return g ~= nil and g.roles[tostring(a.rol)] or nil
end

Motor.inmediatas.acompanante = function(inst, a)
    local uid = uidDe(inst, a)
    if uid == nil then return true end
    local x, y = Mundo.posicionActor(uid)
    local j = x ~= nil and Mundo.jugadorCerca(x, y, 200) or Mundo.jugadorAlAzar()
    local g = inst.grupos[a.grupo]
    local par = g ~= nil and g.nombres ~= nil and g.nombres[tostring(a.rol)] or nil
    P.agregar(uid, j, { nombre = a.nombre or (par ~= nil and par[1]) or nil, inmortal = a.inmortal })
    return true
end

Motor.inmediatas.soltar_acompanante = function(inst, a)
    local uid = uidDe(inst, a)
    if uid ~= nil then P.quitar(uid) end
    return true
end

-- Admin: el NPC de A-Life mas cercano te acompana (para probar lo del auto).
Motor.comandosAdmin.acompananteAhora = function(jugador)
    local vigia = ProjectALife ~= nil and ProjectALife.Watchdog or nil
    local px, py = Mundo.posicion(jugador)
    local mejor, md
    for uid, enlace in pairs(vigia ~= nil and vigia.bindings or {}) do
        local ok, x, y = pcall(function() return enlace.shell:getX(), enlace.shell:getY() end)
        if ok and x ~= nil then
            local d = math.sqrt((x - px) ^ 2 + (y - py) ^ 2)
            if d <= 20 and (md == nil or d < md) then mejor, md = uid, d end
        end
    end
    if mejor == nil then return "No hay ningun NPC de A-Life a menos de 20 casillas." end
    P.agregar(mejor, jugador, { nombre = "Tu acompanante" })
    return "El NPC " .. tostring(mejor) .. " te acompana. Subete a un auto para probar."
end

Motor.comandosAdmin.soltarAcompanantes = function()
    local n = 0
    for clave in pairs(P.lista()) do P.quitar(clave); n = n + 1 end
    return "Acompanantes soltados: " .. n
end

if Events ~= nil and not P._enganchado then
    P._enganchado = true
    Events.OnTick.Add(P.revisar)
    Events.EveryTenMinutes.Add(P.renovar)
end

return P
