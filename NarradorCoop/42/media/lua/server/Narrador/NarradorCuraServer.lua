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
    -- Si el doctor Hartmann confeso lo de las K-93 de azucar (hartmann_k93), la Chela manda agua.
    if c.id == "westpoint" and Motor.estado().memoria.hartmann_k93 == "confeso" then
        extra.vars.pedido = extra.vars.pedido .. " " .. Narrador.CuraAguaChela
    end
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

-- ---------------------------------------------------------------------------
-- La prueba del agua (clic derecho en la pastilla, client/Narrador/NarradorPastillas.lua).
-- La hace el servidor, que es el dueno del inventario en MP: gasta el agua, borra la falsa o
-- marca la verdadera, anota el diario y le devuelve el resultado al cliente ("pruebaAgua").
-- ---------------------------------------------------------------------------
CS.DIARIO = "Las pastillas K-93"
CS.TEXTOS_AGUA = {
    primera_falsa = "Eche una pastilla K-93 en un vaso de agua. Antes le mire la K: la pata de abajo mas corta, como grabada a mano. En menos de un minuto se deshizo y el agua quedo celeste. Azucar y colorante. Alguien las hizo una por una.",
    falsa = "Otra K-93 al agua. Se deshizo antes de que terminara de contar. De azucar, como la otra.",
    real = "Eche una pastilla K-93 en un vaso de agua. Conte un minuto, despues otro. No se deshizo. La saque, la seque en la manga y la guarde aparte: esta es de verdad.",
}

-- La historia a la que pertenece la pastilla (su etiqueta es "<historia>:<id>"), si sigue viva.
local function historiaDe(item)
    local etiqueta
    pcall(function() etiqueta = item:getModData().NarradorObjeto end)
    if type(etiqueta) ~= "string" then return nil end
    local instId = string.match(etiqueta, "^(.*):[^:]*$")
    local inst = instId ~= nil and Motor.estado().arcos[instId] or nil
    if inst == nil or inst.final ~= nil then return nil end
    return inst
end

function CS.anotarPrueba(inst, falsa)
    local m = Motor.estado().memoria
    local texto = CS.TEXTOS_AGUA.real
    if falsa then texto = m.k93_falsa_vista and CS.TEXTOS_AGUA.falsa or CS.TEXTOS_AGUA.primera_falsa end
    -- La primera K-93 falsa que alguien ve deshacerse: Hartmann puede tener que dar explicaciones.
    if falsa then m.k93_falsa_vista = true end
    if inst ~= nil then
        -- En la historia de la pastilla: cuantas fallaron y si ya aparecio una buena.
        local k = falsa and "agua_falsas" or "agua_reales"
        inst.vars[k] = (tonumber(inst.vars[k]) or 0) + 1
        if inst.vars[k] == 1 then Motor.anotar(inst, texto) end
        return
    end
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = math.floor(Mundo.horas()), t = texto, arco = CS.DIARIO }
    while #st.diario > (Motor.MAX_DIARIO_GLOBAL or 60) do table.remove(st.diario, 1) end
    Motor.enviar(nil, "diario", { texto = texto, arco = CS.DIARIO })
end

function CS.pruebaAgua(jugador, args)
    local Cura = Narrador.Cura
    if Cura == nil then return end
    local inv = jugador:getInventory()
    local pastilla
    pcall(function() pastilla = inv:getItemWithIDRecursiv(tonumber(args.id)) end)
    if pastilla == nil or not Cura.esPastilla(pastilla) then return end
    if Cura.conocida(pastilla) then
        Motor.responder(jugador, "Esa ya sabes que es la verdadera.")
        return
    end
    local agua = Cura.buscarAgua(jugador)
    if agua == nil then
        Motor.responder(jugador, "Para la prueba necesitas agua: una botella, un vaso, una olla. Sirve hasta la sucia.")
        return
    end
    if not Cura.gastarAgua(agua) then Mundo.log("prueba del agua: no se pudo descontar el agua de " .. tostring(agua:getFullType())) end
    pcall(function() if agua.syncItemFields ~= nil then agua:syncItemFields() end end)
    if sendItemStats ~= nil then pcall(sendItemStats, agua) end
    local falsa = Mundo.pastillaEs(pastilla) == "falsa"
    local inst = historiaDe(pastilla)
    if falsa then
        Mundo.quitarItem(pastilla:getContainer() or inv, pastilla)
    else
        Cura.marcarVerdadera(pastilla, true)
        pcall(function() if pastilla.syncItemFields ~= nil then pastilla:syncItemFields() end end)
        if sendItemStats ~= nil then pcall(sendItemStats, pastilla) end
    end
    CS.anotarPrueba(inst, falsa)
    Motor.enviar(jugador, "pruebaAgua", { id = args.id, falsa = falsa })
    Mundo.log("prueba del agua de " .. tostring(Mundo.nombreJugador(jugador)) .. ": " .. (falsa and "falsa" or "verdadera"))
    Motor.publicar()
end

-- La K chueca (Arcos/Cura.lua, hartmann_k93): alguien vio deshacerse una K-93 falsa y el doctor
-- Hartmann ya vive en el cuartel de la Chela. La proxima vez que pasas cerca de ella, la escena.
-- Si lo trajiste despues de ver la falsa, lo confiesa al llegar (leyenda_eduardo).
CS.RADIO_CHELA = 15
function CS.revisarHartmann()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    local m = Motor.estado().memoria
    if m.k93_falsa_vista ~= true or m.hartmann_k93 ~= nil or m.cientifico_hartmann ~= "en_west_point" then return end
    if Motor.activos("hartmann_k93") > 0 then return end
    local D = Narrador.Dominios
    if not C.desbloqueado("westpoint") or (D ~= nil and D.dominio("westpoint") ~= "mision") then return end
    local l = C.lugar("westpoint")
    local j = l ~= nil and Mundo.jugadorCerca(l.x, l.y, CS.RADIO_CHELA) or nil
    if j == nil then return end
    Motor.iniciar("hartmann_k93", j, C.extra(C.def("westpoint"), nil, j))
end
Motor.tickExtra.curaHartmann = function() pcall(CS.revisarHartmann) end

function CS.vista(v)
    local e = CS.st()
    v.cura = { falta = floor(CS.falta()), contacto = e.contacto }
end

Motor.comandosPublicos.pedirCura = CS.pedir
Motor.comandosPublicos.curarme = CS.curarme
Motor.comandosPublicos.dolorPastilla = CS.dolor
Motor.comandosPublicos.pruebaAgua = CS.pruebaAgua
Motor.vistaExtra[#Motor.vistaExtra + 1] = CS.vista
Motor.comandosAdmin.curaDisponible = function()
    CS.st().ultima = Mundo.horas() - CS.CADA
    Motor.publicar()
    return "La mision de la cura ya esta disponible."
end

return CS
