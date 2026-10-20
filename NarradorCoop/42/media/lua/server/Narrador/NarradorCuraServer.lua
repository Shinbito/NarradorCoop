-- Narrador Co-op: la mision de la cura (servidor).
-- Solo la da un misionero, hablando con el ("Tienes algo especial?"). Esta disponible una vez
-- cada 20 dias de juego para todo el servidor: cuando un misionero se la da a alguien, los
-- demas misioneros no la tienen hasta que pasen 20 dias. El narrador nunca la lanza solo.
-- Sin tildes ni enies a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorCura"
require "Narrador/Arcos/Cura"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local floor = math.floor

local CS = Narrador.CuraServer or {}
Narrador.CuraServer = CS

CS.CADA = 24 * 20

CS.LUGARES = {
    { nombre = "el hospital de Louisville", salas = { "hospitalroom", "hospitalhallway", "hospitalstorage" }, respaldo = { "medical", "medicalstorage" } },
    { nombre = "el laboratorio de Louisville", salas = { "laboratory" }, respaldo = { "medicalstorage", "medical", "hospitalstorage" } },
    { nombre = "la base militar de Louisville", salas = { "armystorage", "armytent" }, respaldo = { "policestorage", "medicalstorage" },
      cerca_de = { 12540, 4250, 150 } },
}

function CS.st()
    local st = Motor.estado()
    st.cura = st.cura or {}
    return st.cura
end

-- Horas que faltan para que vuelva a estar disponible (0 = disponible).
function CS.falta()
    local e = CS.st()
    local desde = e.ultima or 0
    return math.max(0, desde + CS.CADA - Mundo.horas())
end

-- Ojo: NarradorDominios.lua envuelve esta funcion (cambia lo que hace segun quien manda en la ciudad).
function CS.pedir(jugador, args)
    local c = C.def(tostring(args.contacto))
    if c == nil then return end
    local d = C.distancia(c.id, jugador)
    if d == nil or d > 10 then
        Motor.responder(jugador, "Estas muy lejos.")
        return
    end
    local grupo = Mundo.grupoDe(jugador)
    if C.encargoDelGrupo(grupo) ~= nil then
        C.decir(c.id, "Primero termina lo que tienes. Esto no es para hacerlo a medias.")
        return
    end
    local falta = CS.falta()
    if falta > 0 then
        local e = CS.st()
        local quien = e.contacto ~= nil and C.def(e.contacto) or nil
        local dias = math.ceil(falta / 24)
        if quien ~= nil and quien.id ~= c.id then
            C.decir(c.id, "Lo de la cura? " .. quien.nombre .. " ya mando a alguien. Hasta dentro de " .. dias .. " dias no se sabe nada mas.")
        else
            C.decir(c.id, "No hay nada especial por ahora. Vuelve en " .. dias .. " dias.")
        end
        return
    end
    local l = CS.LUGARES[Mundo.azar(#CS.LUGARES)]
    local extra = C.extra(c, "cura", jugador)
    extra.vars.lugar_nombre = l.nombre
    extra.vars.salas, extra.vars.respaldo = l.salas, l.respaldo
    extra.vars.cerca_de = l.cerca_de
    extra.vars.pedido = Narrador.CuraPedidos[c.id]
    extra.vars.gracias = Narrador.CuraGracias[c.id]
    extra.vars.muerte_eco = Narrador.CuraMuerte[c.id]
    local inst, razon = Motor.iniciar("encargo_cura", jugador, extra)
    if inst == nil then
        Motor.responder(jugador, "No se pudo armar la mision: " .. tostring(razon))
        return
    end
    local e = CS.st()
    e.ultima, e.contacto, e.grupo = Mundo.horas(), c.id, grupo
    pcall(C.darMapa, c, inst)
    Motor.enviar(nil, "aviso", { texto = C.nombreCompleto(c) .. " le encargo a alguien la mision de la cura. Los demas misioneros ya no la tienen por un tiempo." })
    Motor.publicar()
end

function CS.curarme(jugador)
    -- El cliente ya se curo; aca se cura la copia del servidor (que es la que manda en MP).
    if Narrador.Cura ~= nil then
        Narrador.Cura.curar(jugador)
        Narrador.Cura.marcarRepaso(jugador)
    end
end

-- Cada minuto: los que tomaron la verdadera hace poco siguen curados (fiebre e infeccion en 0).
function CS.repasoCura()
    local Cura = Narrador.Cura
    if Cura == nil then return end
    local ahora = Mundo.horas()
    for _, p in ipairs(Mundo.jugadores()) do
        pcall(function()
            local md = p:getModData()
            local hasta = tonumber(md.NarradorCuraHasta)
            if hasta == nil then return end
            if ahora > hasta then md.NarradorCuraHasta = nil; return end
            if Cura.infectado(p) and Cura.curar(p) then Mundo.log("repaso de la cura: se volvio a sacar la infeccion a " .. tostring(Mundo.nombreJugador(p))) end
        end)
    end
end
Motor.tickExtra.curaRepaso = CS.repasoCura

function CS.dolor(jugador)
    if Narrador.Cura ~= nil then Narrador.Cura.dolor(jugador) end
end

function CS.vista(v)
    local e = CS.st()
    v.cura = { falta = floor(CS.falta()), contacto = e.contacto }
end

Motor.comandosPublicos.pedirCura = CS.pedir
Motor.comandosPublicos.curarme = CS.curarme
Motor.comandosPublicos.dolorPastilla = CS.dolor
Motor.vistaExtra[#Motor.vistaExtra + 1] = CS.vista
Motor.comandosAdmin.curaDisponible = function()
    CS.st().ultima = Mundo.horas() - CS.CADA
    Motor.publicar()
    return "La mision de la cura ya esta disponible."
end

return CS
