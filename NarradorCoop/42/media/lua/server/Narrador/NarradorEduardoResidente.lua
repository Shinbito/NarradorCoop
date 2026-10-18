-- Narrador Co-op (servidor): Eduardo Giovanns vive en el campamento de la Tia Chela.
-- Desde que lo conociste (memoria "eduardo_conocido") aparece en el campamento de su madre
-- cuando alguien pasa cerca. Se le puede decir "Sigueme" (te acompana con el sistema de
-- acompanantes, NarradorPasajeros.lua) y "Vuelve con la Chela". Si muere, a los ED.DIAS dias
-- de juego vuelve a aparecer en el campamento ("siempre se salva por las minimas").
-- No aparece mientras una historia lo esta usando (leyenda, eventos, el bandido...), ni si
-- vas por el camino del bandido o Knox ya fue conquistado.
-- Estado: Motor.estado().eduardo_residente = { uid, muertoHora, intentos, pidiendo }.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorPasajeros"

local Mundo, Motor, C, P = Narrador.Mundo, Narrador.Motor, Narrador.Contactos, Narrador.Pasajeros
local floor = math.floor

local ED = Narrador.EduardoResidente or {}
Narrador.EduardoResidente = ED

ED.PERFIL = "k93_stockyard_05"
ED.CONTACTO = "westpoint"
ED.DIAS = 3
ED.RADIO = 60
ED.BANDERAS = { persistent = true, invulnerable = false, stationary = false, leashRadius = 10, health = 400, damageOutput = 300 }

function ED.st()
    local st = Motor.estado()
    st.eduardo_residente = st.eduardo_residente or {}
    return st.eduardo_residente
end

-- Alguna historia en curso tiene a Eduardo en uno de sus grupos.
function ED.enHistoria()
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil then
            for _, g in pairs(inst.grupos or {}) do
                if (g.rolPorPerfil or {})[ED.PERFIL] ~= nil then return true end
            end
        end
    end
    return false
end

function ED.corresponde()
    local m = Motor.estado().memoria
    if m.eduardo_conocido ~= true and m.eduardo_vivo ~= true then return false end
    if m.caido_eduardo == true then return false end -- primero vuelve con "eduardo_vuelve"
    if m.bandido == "pereira" or m.knox_conquistado == true then return false end
    return C.desbloqueado(ED.CONTACTO)
end

function ED.aparecer(jugador, e)
    local ed = ED.st()
    ed.intentos = (ed.intentos or 0) + 1
    local requestId = "narrador:eduardo_residente:" .. tostring(ed.intentos)
    Mundo.reservarNombres(requestId, { [ED.PERFIL] = { "Eduardo", "Giovanns" } })
    local args = {
        requestId = requestId, x = floor(e.x) + 2, y = floor(e.y) + 1, z = floor(e.z or 0),
        mode = "guard", radius = 4, distance = 0, separation = 1, atomicGroup = true,
        persistent = true, stationary = false, invulnerable = false, leashRadius = ED.BANDERAS.leashRadius,
        health = ED.BANDERAS.health, profileIds = { ED.PERFIL }, count = 1, hostileOverride = false,
        playerStance = "friendly", playerKeepOut = 0,
    }
    local ok = Mundo.spawnGrupo(jugador, args, function(resultado)
        local uids = type(resultado) == "table" and resultado.actorUids or nil
        local e2 = ED.st()
        e2.pidiendo = nil
        if type(uids) == "table" and uids[1] ~= nil then
            e2.uid = uids[1]
            Mundo.uidsPropios[tostring(e2.uid)] = true
            pcall(Mundo.nombrarActor, e2.uid, "Eduardo", "Giovanns")
            pcall(Mundo.banderas, e2.uid, ED.BANDERAS, { x = e.x, y = e.y, z = e.z or 0 })
            if e2.muertoHora ~= nil then
                Motor.decirUid(e2.uid, "Eduardo", "Uff... otra vez pense que la palmaba. Siempre hay un sotano.")
                e2.muertoHora = nil
            end
            Motor.publicar()
        end
    end)
    if ok then ed.pidiendo = Mundo.horas() end
end

function ED.tick()
    if Motor.minutosDesdeArranque % 2 ~= 0 or not Mundo.hayALife() then return end
    local ed = ED.st()
    -- Murio o se perdio.
    if ed.uid ~= nil then
        local actor = Mundo.actor(ed.uid)
        local muerto = (actor ~= nil and actor.lifecycle == "dead") or (C.cuerpoMuerto ~= nil and C.cuerpoMuerto(ed.uid))
        if muerto then
            pcall(P.quitar, ed.uid)
            ed.uid, ed.muertoHora, ed.faltas = nil, Mundo.horas(), 0
            Motor.enviar(nil, "aviso", { texto = "Eduardo Giovanns cayo. La Tia Chela no dice nada; deja un plato servido igual." })
            Mundo.log("eduardo residente murio")
            return
        elseif actor == nil then
            ed.faltas = (ed.faltas or 0) + 1
            if ed.faltas >= 3 then ed.uid, ed.faltas = nil, 0 end
            return
        end
        ed.faltas = 0
        -- Si una historia lo necesita, el de la casa se va (para que no haya dos).
        if ED.enHistoria() and not P.esAcompanante(ed.uid) then
            Mundo.retirar(ed.uid)
            ed.uid = nil
        end
        return
    end
    if not ED.corresponde() or ED.enHistoria() then return end
    if ed.muertoHora ~= nil and Mundo.horas() - ed.muertoHora < ED.DIAS * 24 then return end
    if ed.pidiendo ~= nil and Mundo.horas() - ed.pidiendo < 0.25 then return end
    local e = C.estado(ED.CONTACTO)
    if e.x == nil or Mundo.cargado(e.x, e.y, e.z) == nil then return end
    local j = Mundo.jugadorCerca(e.x, e.y, ED.RADIO)
    if j ~= nil then ED.aparecer(j, e) end
end

Motor.tickExtra.eduardo_residente = function() pcall(ED.tick) end

-- Sigueme / Vuelve con la Chela.
function ED.sigueme(jugador)
    local ed = ED.st()
    if ed.uid == nil then return end
    P.agregar(ed.uid, jugador, { nombre = "Eduardo", inmortal = false })
    Motor.decirUid(ed.uid, "Eduardo", "Vamos, amigo. Mientras quede alguien a quien ayudar.")
    Motor.publicar()
end

function ED.vuelve(jugador)
    local ed = ED.st()
    if ed.uid == nil or not P.esAcompanante(ed.uid) then return end
    P.quitar(ed.uid)
    local e = C.estado(ED.CONTACTO)
    if e.x ~= nil then pcall(Mundo.banderas, ed.uid, ED.BANDERAS, { x = e.x, y = e.y, z = e.z or 0 }) end
    Motor.decirUid(ed.uid, "Eduardo", "Me vuelvo con la vieja. Si me necesitas, ya sabes donde estoy.")
    Motor.publicar()
end

Motor.comandosPublicos = Motor.comandosPublicos or {}
Motor.comandosPublicos.eduardoSigueme = ED.sigueme
Motor.comandosPublicos.eduardoVuelve = ED.vuelve

Motor.vistaExtra = Motor.vistaExtra or {}
Motor.vistaExtra[#Motor.vistaExtra + 1] = function(v)
    local ed = ED.st()
    if ed.uid ~= nil then
        v.eduardo = { uid = tostring(ed.uid), siguiendo = P.esAcompanante(ed.uid) }
    end
end

-- Lo que hace que A-Life no ofrezca su menu propio para Eduardo.
Motor.propiosExtra = Motor.propiosExtra or {}
Motor.propiosExtra.eduardo_residente = function(lista)
    local ed = ED.st()
    if ed.uid ~= nil then lista[tostring(ed.uid)] = true end
end

return ED
