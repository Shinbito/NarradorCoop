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
-- Escoltas a un misionero ("va solo"): si la etapa sale con { "npc_cerca", grupo, "contacto" }
-- (o "misionero"), o la accion trae destino = "lugar", el NPC NO te sigue: se queda anclado
-- donde esta y, cuando no hay ningun jugador cerca (y su cuerpo ya no esta cargado), se pasa
-- solo al lado del misionero. La etapa avanza cuando un jugador llega alla. seguir = true
-- obliga a que te siga como antes.
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
            local sq = Mundo.cargado(x, y, z)
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
    -- Escondido no lo puede morder nadie.
    if not a.inmortal then pcall(Mundo.banderas, a.uid, P.BANDERAS) end
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
    if not a.inmortal then
        local banderas = Motor.copiar(P.BANDERAS)
        banderas.invulnerable = false
        pcall(Mundo.banderas, a.uid, banderas)
    end
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
    if Motor.vacia(lista) then return end
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

-- Si el NPC todavia no aparece (A-Life lo rechazo o tarda), se reintenta cada minuto
-- mientras la historia siga en la misma etapa. Si no, nunca te seguiria.
local function acompanarLuego(inst, a)
    inst.acompanar_luego = inst.acompanar_luego or {}
    inst.acompanar_luego[#inst.acompanar_luego + 1] = { grupo = a.grupo, rol = a.rol, nombre = a.nombre,
        inmortal = a.inmortal, etapa = inst.etapa, seguir = a.seguir, destino = a.destino }
end

-- ---------------------------------------------------------------------------
-- "Va solo": el rescatado espera anclado y aparece junto al misionero de destino
-- ---------------------------------------------------------------------------

-- Lugares de destino que son un misionero (los rescates se llevan ahi).
P.DESTINOS_MISIONERO = { contacto = true, misionero = true }
-- Sin jugadores a esta distancia del NPC, se pasa solo al destino (casillas).
P.LEJOS = 60
-- Correa mientras espera y al llegar (casillas).
P.CORREA_ESPERA = 4
P.CORREA_DESTINO = 6
-- La etapa avanza cuando un jugador esta a esta distancia del destino (y el NPC ya llego).
P.RADIO_LLEGADA = 40

function P.solos()
    local st = Motor.estado()
    st.van_solos = st.van_solos or {}
    return st.van_solos
end

function P.vaSolo(uid)
    return uid ~= nil and P.solos()[tostring(uid)] or nil
end

-- Destino de la escolta: el pedido en la accion o el de la salida "npc_cerca" de la etapa,
-- si es un misionero. nil = te sigue como siempre.
function P.destinoDe(inst, a)
    if a.seguir then return nil end
    if a.destino ~= nil then return tostring(a.destino) end
    local def = Narrador.Defs ~= nil and Narrador.Defs.get ~= nil and Narrador.Defs.get(inst.def) or nil
    local etapa = def ~= nil and def.etapas ~= nil and def.etapas[inst.etapa] or nil
    for _, s in ipairs(etapa ~= nil and etapa.salidas or {}) do
        local c = s.cuando
        if type(c) == "table" and c[1] == "npc_cerca" and c[2] == a.grupo and P.DESTINOS_MISIONERO[tostring(c[3])] then
            return tostring(c[3])
        end
    end
    return nil
end

-- Banderas de quien va solo: quieto con correa corta, en su ancla (donde espera o el destino).
function P.banderasSolo(e)
    return { persistent = true, invulnerable = e.inmortal == true, stationary = true, leashRadius = P.CORREA_ESPERA },
        e.ancla
end

-- El grupo repasa sus banderas cada tanto (Motor.banderasGrupo): a los acompanantes no se
-- los vuelve a amarrar al lugar donde aparecieron, y los que van solos quedan en su ancla.
function P.banderasPropias(uid, flags, ancla)
    local e = P.vaSolo(uid)
    if e ~= nil then
        local f, a = P.banderasSolo(e)
        if flags ~= nil and flags.invulnerable ~= nil then f.invulnerable = flags.invulnerable end
        return f, a
    end
    local c = P.lista()[tostring(uid)]
    if c ~= nil then
        local f = Motor.copiar(P.BANDERAS)
        f.invulnerable = c.inmortal or c.subido or false
        return f, nil
    end
    return flags, ancla
end

function P.irSolo(inst, a, uid, destino)
    local x, y, z = Mundo.posicionActor(uid)
    local g = inst.grupos[a.grupo]
    local par = g ~= nil and g.nombres ~= nil and g.nombres[tostring(a.rol)] or nil
    local e = { uid = uid, arco = inst.id, grupo = a.grupo, rol = tostring(a.rol), destino = destino,
        nombre = a.nombre or (par ~= nil and par[1]) or "Tu rescatado", inmortal = a.inmortal ~= false,
        ancla = x ~= nil and { x = floor(x), y = floor(y), z = floor(z or 0) } or nil, llego = false }
    P.solos()[tostring(uid)] = e
    pcall(Mundo.banderas, uid, P.banderasSolo(e))
    local l = inst.lugares[destino]
    local donde = (inst.vars ~= nil and inst.vars.contacto_nombre) or (l ~= nil and l.nombre) or "el misionero"
    if destino == "misionero" and inst.vars ~= nil and inst.vars.misionero ~= nil then donde = inst.vars.misionero end
    Motor.avisar(inst, tostring(e.nombre) .. " se va por su cuenta con " .. tostring(donde) .. ". Te espera alla.")
    Mundo.log("va solo " .. tostring(uid) .. " (" .. inst.id .. ") hacia '" .. destino .. "'")
    return true
end

-- Casilla libre cerca de un punto (si esta cargado), o el punto corrido un par de casillas.
local function cercaDe(x, y, z)
    for _, d in ipairs({ { 2, 1 }, { -2, 1 }, { 1, 2 }, { 1, -2 }, { 3, 0 }, { 0, 3 }, { -3, 0 }, { 0, -3 } }) do
        local sq = Mundo.cargado(x + d[1], y + d[2], z)
        local libre = false
        pcall(function() libre = sq ~= nil and sq:isFree(false) end)
        if libre then return x + d[1] + 0.5, y + d[2] + 0.5, z end
    end
    return x + 2.5, y + 1.5, z
end

-- Pasa al NPC al destino: solo si nadie lo esta mirando y no queda cargado en un lugar
-- que despues no se pueda mover (si el cuerpo sigue cargado, el destino tambien tiene que estarlo).
function P.pasarAlDestino(inst, e)
    local l = inst.lugares[e.destino]
    if l == nil or l.x == nil then return false end
    local x, y = Mundo.posicionActor(e.uid)
    if x == nil or Mundo.jugadorCerca(x, y, P.LEJOS) ~= nil then return false end
    local lz = floor(l.z or 0)
    if Mundo.cuerpoActor(e.uid) ~= nil and Mundo.cargado(l.x, l.y, lz) == nil then return false end
    local nx, ny, nz = cercaDe(floor(l.x), floor(l.y), lz)
    P.mover(e.uid, nx, ny, nz)
    e.ancla, e.llego = { x = floor(nx), y = floor(ny), z = nz }, true
    pcall(Mundo.banderas, e.uid, P.banderasSolo(e))
    -- El repaso del grupo lo deja en el destino de ahora en adelante.
    local g = inst.grupos[e.grupo]
    if g ~= nil and g.accion ~= nil then g.accion.ancla_pos = { x = e.ancla.x, y = e.ancla.y, z = e.ancla.z } end
    Mundo.log("va solo " .. tostring(e.uid) .. " llego a '" .. tostring(e.destino) .. "' (" .. inst.id .. ")")
    return true
end

function P.revisarSolos()
    local solos = P.solos()
    if Motor.vacia(solos) then return end
    local arcos = Motor.estado().arcos or {}
    for clave, e in pairs(solos) do
        local inst = arcos[e.arco]
        if inst == nil or inst.final ~= nil or not Mundo.actorVivo(e.uid) then
            solos[clave] = nil
        elseif not e.llego then
            pcall(P.pasarAlDestino, inst, e)
        end
    end
end

Motor.inmediatas.acompanante = function(inst, a)
    local uid = uidDe(inst, a)
    if uid == nil or not Mundo.actorVivo(uid) then
        acompanarLuego(inst, a)
        return true
    end
    local destino = P.destinoDe(inst, a)
    if destino ~= nil then return P.irSolo(inst, a, uid, destino) end
    local x, y = Mundo.posicionActor(uid)
    local j = x ~= nil and Mundo.jugadorCerca(x, y, 200) or Mundo.jugadorAlAzar()
    local g = inst.grupos[a.grupo]
    local par = g ~= nil and g.nombres ~= nil and g.nombres[tostring(a.rol)] or nil
    P.agregar(uid, j, { nombre = a.nombre or (par ~= nil and par[1]) or nil, inmortal = a.inmortal })
    return true
end

Motor.inmediatas.soltar_acompanante = function(inst, a)
    for i = #(inst.acompanar_luego or {}), 1, -1 do
        local e = inst.acompanar_luego[i]
        if e.grupo == a.grupo and tostring(e.rol) == tostring(a.rol) then table.remove(inst.acompanar_luego, i) end
    end
    local uid = uidDe(inst, a)
    if uid == nil then return true end
    local e = P.vaSolo(uid)
    P.solos()[tostring(uid)] = nil
    P.quitar(uid)
    -- Queda donde lo soltaste (el destino): el repaso del grupo ya no lo devuelve a donde aparecio.
    local x, y, z = Mundo.posicionActor(uid)
    if e ~= nil and e.llego and e.ancla ~= nil then x, y, z = e.ancla.x, e.ancla.y, e.ancla.z end
    local g = inst.grupos[a.grupo]
    if g ~= nil and x ~= nil then
        g.accion = g.accion or {}
        g.accion.ancla_pos = { x = floor(x), y = floor(y), z = floor(z or 0) }
        g.accion.quietos, g.accion.correa = false, P.CORREA_DESTINO
        pcall(Mundo.banderas, uid, { persistent = true, invulnerable = g.accion.inmortales == true,
            stationary = false, leashRadius = P.CORREA_DESTINO }, g.accion.ancla_pos)
    end
    return true
end

function P.reintentar()
    local st = Motor.estado()
    for _, inst in pairs(st.arcos or {}) do
        local l = inst.acompanar_luego
        if l ~= nil and #l > 0 then
            local quedan = {}
            for _, e in ipairs(l) do
                if inst.final == nil and inst.etapa == e.etapa then
                    local uid = uidDe(inst, e)
                    if uid ~= nil and Mundo.actorVivo(uid) then
                        local ok = pcall(Motor.inmediatas.acompanante, inst, e)
                        if not ok then quedan[#quedan + 1] = e end
                    else
                        quedan[#quedan + 1] = e
                    end
                end
            end
            inst.acompanar_luego = #quedan > 0 and quedan or nil
        end
    end
end
Motor.tickExtra.acompanantes = function() pcall(P.reintentar); pcall(P.revisarSolos) end

-- {"npc_cerca", grupo, lugar, radio}: algun miembro vivo del grupo llego cerca del lugar
-- (si va "en el auto", cuenta donde esta su jugador; si se fue solo al misionero, cuenta
-- cuando ya esta alla y llega un jugador).
Motor.condiciones.npc_cerca = function(inst, c)
    local g, l = inst.grupos[c[2]], inst.lugares[c[3]]
    if g == nil or l == nil then return false end
    local radio = tonumber(c[4]) or 15
    for uid, m in pairs(g.miembros or {}) do
        local solo = m.vivo and P.vaSolo(uid) or nil
        if solo ~= nil and solo.llego and solo.destino == c[3] then
            if Mundo.jugadorCerca(l.x, l.y, math.max(radio, P.RADIO_LLEGADA)) ~= nil then return true end
        elseif m.vivo then
            local x, y = Mundo.posicionActor(uid)
            local a = P.lista()[tostring(uid)]
            if a ~= nil and a.subido then
                local j = jugadorPorNombre(a.jugador)
                if j ~= nil then x, y = Mundo.posicion(j) end
            end
            if x ~= nil and math.sqrt((x - l.x) ^ 2 + (y - l.y) ^ 2) <= radio then return true end
        end
    end
    return false
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
