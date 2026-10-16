-- Narrador Co-op: contactos que dan encargos en Muldraugh, West Point, Riverside y Rosewood.
-- Cada uno vive en un edificio fijo de su ciudad, no se mueve y no puede morir. Mientras
-- nadie esta cerca, se limpian los zombis de alrededor para que no se lo coman las hordas.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor

local C = Narrador.Contactos or {}
Narrador.Contactos = C

local floor = math.floor

-- Los "misioneros": cada uno con su apodo y su forma de hablar.
C.LISTA = {
    { id = "muldraugh", rol = "cabo", ciudad = "Muldraugh", nombre = "Cabo Ramiro", apellido = "Mandados",
      perfil = "k93_muldraugh_pd_01", oficio = "ex cabo de policia",
      -- En la oficina del segundo piso de la comisaria (piso = 1; 0 es la planta baja).
      salas = { "policeoffice" }, piso = 1, respaldo = { "policestorage", "policehall", "church", "office" },
      frases = {
          "Atencion, civil. Si busca trabajo, yo tengo. Si busca descanso, se equivoco de oficina.",
          "Veintidos anos de servicio y termino repartiendo mandados. La vida, mi amigo.",
          "Aca se trabaja con orden. Encargo, cumplimiento, pago. Y nada de preguntas.",
          "El que no cumple un encargo queda anotado. Tengo una libreta. Una libreta muy larga.",
          "Antes multaba autos mal estacionados. Ahora los autos estan todos mal estacionados.",
          "Tengo pega pa usted. Siempre tengo pega. Es lo unico que sobra en este pueblo.",
          "No me diga Cabo. Bueno, si, digame Cabo. Me gusta.",
          "Si vuelve con las manos vacias, no se preocupe: el castigo es otro encargo.",
      } },
    { id = "westpoint", rol = "chela", ciudad = "West Point", nombre = "Tia Chela", apellido = "Recados",
      perfil = "k93_vfd_04", oficio = "bombera voluntaria",
      frases = {
          "Pase, mijo, pase. Tengo recados pa regalar y te veo con cara de que te aburres.",
          "Fui bombera treinta anos. Apagaba incendios. Ahora los prendo pa cocinar.",
          "Ay, no me vengas con que estas cansado. Yo tengo sesenta y sigo aca.",
          "Toma agua antes de salir, que despues andas deshidratado y me echan la culpa a mi.",
          "Tengo un recado facil y uno dificil. Elige con el corazon, no con las piernas.",
          "Si te muerden, no vuelvas. Te quiero, pero no tanto.",
          "Mis encargos nunca se acaban, mijo. Como la ropa sucia.",
          "Cuidate harto. Y trae algo dulce si encuentras, que aca no hay nada.",
      },
      salas = { "firestorage", "firegarage" }, respaldo = { "policeoffice", "church", "office" } },
    { id = "riverside", rol = "nacho", ciudad = "Riverside", nombre = "Padre Nacho", apellido = "Pegas",
      perfil = "k93_prather_01", oficio = "pastor",
      frases = {
          "Hijo mio, el Senor da y el Senor quita. Yo solo doy encargos.",
          "Bienaventurados los que traen suministros, porque de ellos sera mi gratitud.",
          "Rezo por ti cada vez que sales. Bueno, cuando me acuerdo.",
          "La fe mueve montanas. Los encargos mueven latas. Ambos son importantes.",
          "No es pecado saquear si es por una buena causa. Lo busque en la Biblia. Mas o menos.",
          "Tengo pega para todos los fieles. Y para los que no, tambien.",
          "Ve en paz, hijo. Y si no hay paz, ve con escopeta.",
          "Confesion rapida: a veces invento la mitad de los encargos para que la gente se mantenga ocupada.",
      },
      salas = { "church" }, respaldo = { "policeoffice", "office", "motelroom" } },
    { id = "rosewood", rol = "rosa", ciudad = "Rosewood", nombre = "Misia Rosa", apellido = "Bencina",
      perfil = "k93_truckstop_04", oficio = "duena de la bencinera",
      frases = {
          "Bienvenido a la bencinera. No hay bencina, pero hay encargos.",
          "Lleno o normal? Es broma, mijito. Hace meses que no sale ni una gota.",
          "Treinta anos atendiendo camioneros. Un zombi no me asusta, he visto cosas peores a las tres de la manana.",
          "Si encuentras cigarros, son mios. Si encuentras chicle, tambien.",
          "Aca todo tiene precio. Tu trabajo, por ejemplo, vale un encargo.",
          "Ay, que gusto ver una cara viva. Toma, aca tengo algo pa ti.",
          "No te demores, que los encargos se ponen rancios igual que el pan.",
          "La bencinera nunca cierra. Ni con el fin del mundo.",
      },
      salas = { "gasstore", "grocery" }, respaldo = { "firestorage", "policeoffice", "church" } },
}

C.NIVELES = { facil = "facil", medio = "medio", dificil = "dificil", ultra = "ultra" }

function C.def(id)
    for _, c in ipairs(C.LISTA) do if c.id == id then return c end end
    return nil
end

function C.estado(id)
    local st = Motor.estado()
    st.contactos[id] = st.contactos[id] or {}
    return st.contactos[id]
end

function C.nombreCompleto(c) return c.nombre .. " " .. c.apellido end

-- Busca (una sola vez por partida) el edificio de cada contacto.
function C.ubicar(c)
    local e = C.estado(c.id)
    if e.x ~= nil then return e end
    local l = Mundo.buscarLugar({ pueblo = c.ciudad, salas = c.salas, respaldo = c.respaldo, cerca_del_centro = true,
        piso = c.piso })
    if l == nil then return nil end
    e.x, e.y, e.z, e.sala, e.etiqueta = l.x, l.y, l.z, l.sala, l.etiqueta
    return e
end

-- Posicion actual del contacto (su NPC si esta cargado, si no su edificio).
function C.posicion(id)
    local e = C.estado(id)
    if e.uid ~= nil then
        local x, y, z = Mundo.posicionActor(e.uid)
        if x ~= nil then return x, y, z end
    end
    return e.x, e.y, e.z
end

function C.lugar(id)
    local c, e = C.def(id), C.estado(id)
    if c == nil or e.x == nil then return nil end
    return { x = e.x, y = e.y, z = e.z or 0, radio = 8, exacto = true,
        etiqueta = C.nombreCompleto(c) .. " en " .. tostring(e.etiqueta or c.ciudad) }
end

function C.decir(id, texto)
    local c, e = C.def(id), C.estado(id)
    if c == nil or e.uid == nil then return end
    local x, y = C.posicion(id)
    Motor.enviar(nil, "decir", { uid = e.uid, nombre = c.nombre, texto = texto, x = x, y = y })
end

function C.aparecer(c, e, jugador)
    if not Mundo.hayALife() then return end
    -- Sin zombis encima antes de que aparezca: si no, a veces nacia y lo mataban antes de
    -- que llegaran las banderas.
    pcall(C.limpiar, e.x, e.y)
    e.intentos = (e.intentos or 0) + 1
    local requestId = "narrador:contacto:" .. c.id .. ":" .. tostring(e.intentos)
    Mundo.reservarNombres(requestId, { [c.perfil] = { c.nombre, c.apellido } })
    local args = {
        requestId = requestId, x = floor(e.x), y = floor(e.y), z = floor(e.z or 0),
        mode = "guard", radius = 4, distance = 0, separation = 1, atomicGroup = true,
        persistent = true, stationary = true, invulnerable = true, leashRadius = 3,
        profileIds = { c.perfil }, count = 1, hostileOverride = false, playerStance = "friendly",
        playerKeepOut = 0,
    }
    local ok, razon = Mundo.spawnGrupo(jugador, args, function(resultado)
        local uids = type(resultado) == "table" and resultado.actorUids or nil
        if type(uids) == "table" and uids[1] ~= nil then
            e.uid, e.pidiendo, e.faltas = uids[1], nil, 0
            -- Inmortal desde el primer momento (no esperar al proximo C.tick).
            pcall(C.proteger, e)
            pcall(Mundo.nombrarActor, e.uid, c.nombre, c.apellido)
            Motor.publicar()
        else
            e.pidiendo = nil
        end
    end)
    if ok then
        e.pidiendo = Mundo.horas()
    else
        Mundo.log("no aparecio el contacto de " .. c.ciudad .. ": " .. tostring(razon))
    end
end

-- Banderas que siempre tiene un misionero. Se vuelven a poner cada 10 minutos por si A-Life
-- las perdio al recargar el cuerpo.
C.BANDERAS = { persistent = true, stationary = true, invulnerable = true, leashRadius = 3 }

-- Zombis alrededor del misionero. Si no hay nadie cerca se limpia todo alrededor; si hay
-- jugadores, solo se sacan los que sobran y que nadie esta viendo (para que no aparezcan y
-- desaparezcan en la cara de nadie).
function C.zonaSegura(e)
    if e.uid == nil or e.x == nil or getCell == nil then return end
    local x, y = e.x, e.y
    local px, py = Mundo.posicionActor(e.uid)
    if px ~= nil then x, y = px, py end
    C.limpiar(x, y)
end

function C.limpiar(x, y)
    if x == nil or getCell == nil then return end
    if Mundo.jugadorCerca(x, y, 25) == nil then
        local interop = ProjectALife ~= nil and ProjectALife.Interop or nil
        pcall(function()
            local lista = getCell():getZombieList()
            local quitar = {}
            for i = 0, lista:size() - 1 do
                local z = lista:get(i)
                if z ~= nil and math.abs(z:getX() - x) <= 14 and math.abs(z:getY() - y) <= 14 then
                    local esNpc = interop ~= nil and interop.isNpc ~= nil and interop.isNpc(z)
                    if not esNpc then quitar[#quitar + 1] = z end
                end
            end
            for _, z in ipairs(quitar) do
                pcall(function() z:removeFromWorld(); z:removeFromSquare() end)
            end
        end)
    end
    Mundo.limpiarZona(x, y, 35, 3, 15)
end

-- Saca la infeccion de un misionero. A-Life mata a los NPC infectados para transformarlos,
-- aunque sean invulnerables.
function C.curar(uid)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro ~= nil and type(registro.peek) == "function" and type(registro.update) == "function" then
        local a = registro.peek(uid)
        if a ~= nil and type(a.memory) == "table" and a.memory.infectedTurnAtHours ~= nil then
            pcall(registro.update, uid, a.revision, function(r)
                if type(r.memory) == "table" then r.memory.infectedTurnAtHours = nil end
            end)
            Mundo.log("se curo la infeccion de un misionero (" .. tostring(uid) .. ")")
        end
    end
    local cuerpo = Mundo.cuerpoActor(uid)
    if cuerpo ~= nil then
        pcall(function()
            local data = cuerpo:getModData()
            if data.ProjectALifeTurnAtHours ~= nil then
                data.ProjectALifeTurnAtHours = nil
                data.ProjectALifeInfectionRead = nil
            end
            data.ProjectALifeInfectedBy = nil
        end)
    end
end

-- Mantiene vivo al misionero: banderas, sin infeccion y con la vida llena.
function C.proteger(e)
    if e.uid == nil then return end
    pcall(Mundo.banderas, e.uid, C.BANDERAS, { x = e.x, y = e.y, z = e.z or 0 })
    pcall(C.curar, e.uid)
end

-- Cancela la transformacion de los misioneros muertos y retira su cuerpo. Se reintenta un
-- par de horas, porque A-Life anota la transformacion un poco despues de la muerte.
function C.enterrar(e)
    if e.muertos == nil then return end
    local L = ProjectALife ~= nil and ProjectALife.Lifecycle or nil
    local ahora = Mundo.horas()
    for uid, cuando in pairs(e.muertos) do
        if L ~= nil and type(L.turning) == "table" and L.turning[uid] ~= nil then
            local t = L.turning[uid]
            L.turning[uid] = nil
            if type(L.saveTurns) == "function" then pcall(L.saveTurns) end
            if type(L.corpseOf) == "function" then
                local ok, cuerpo = pcall(L.corpseOf, t)
                if ok and cuerpo ~= nil then
                    pcall(function() cuerpo:getSquare():removeCorpse(cuerpo, false) end)
                end
            end
            Mundo.log("se cancelo la transformacion de un misionero muerto (" .. tostring(uid) .. ")")
        end
        if ahora - (tonumber(cuando) or 0) > 2 then e.muertos[uid] = nil end
    end
end

-- Si un misionero muere igual: queda anotado, no se levanta como zombi y C.tick lo vuelve a
-- poner en su edificio la proxima vez que alguien pase cerca. Los encargos se guardan por
-- ciudad, asi que siguen valiendo con el nuevo.
function C.alMorir(e, c, uid)
    e.muertos = e.muertos or {}
    e.muertos[uid] = Mundo.horas()
    e.muertes = (e.muertes or 0) + 1
    e.uid, e.faltas, e.pidiendo, e.charla = nil, 0, nil, nil
    Mundo.log(C.nombreCompleto(c) .. " murio (" .. tostring(e.muertes) .. " veces); se repone en "
        .. tostring(e.etiqueta or c.ciudad))
    C.enterrar(e)
    Motor.publicar()
end

function C.onNpcMuerto(cuerpo, uid, asesino)
    if uid == nil then return end
    for _, c in ipairs(C.LISTA) do
        local e = C.estado(c.id)
        if e.uid == uid then
            pcall(C.alMorir, e, c, uid)
            return
        end
    end
end

-- Encargos ULTRA del mall dados antes del arreglo (cuando servia cualquier tienda de
-- Louisville): si nadie ha llegado todavia, el objetivo pasa al mall de verdad y el grupo
-- recibe otro mapa.
function C.revisarMall()
    local st = Motor.estado()
    for _, arcoId in ipairs(st.orden) do
        local inst = st.arcos[arcoId]
        if inst ~= nil and inst.final == nil and inst.def == "encargo_ultra_mall" and inst.vars.mall_v2 == nil
                and (inst.etapa == "encargo" or inst.etapa == "viaje") then
            local delGrupo = {}
            for _, p in ipairs(Mundo.jugadores()) do
                if Mundo.grupoDe(p) == inst.vars.dueno then delGrupo[#delGrupo + 1] = p end
            end
            local def = Defs.get(inst.def)
            local accion
            local etapa = def ~= nil and def.etapas ~= nil and def.etapas.encargo or nil
            for _, a in ipairs(etapa ~= nil and etapa.al_entrar or {}) do
                if a[1] == "lugar" and a.id == "objetivo" then accion = a end
            end
            local viejo = inst.lugares.objetivo
            if #delGrupo > 0 and accion ~= nil and viejo ~= nil then
                inst.vars.mall_v2 = true
                local nuevo = Mundo.buscarLugar(accion, viejo.x, viejo.y)
                if nuevo ~= nil and (math.abs(nuevo.x - viejo.x) > 60 or math.abs(nuevo.y - viejo.y) > 60) then
                    inst.lugares.objetivo = nuevo
                    if inst.mapeados ~= nil then inst.mapeados.objetivo = nil end
                    local c = C.def(inst.vars.contacto)
                    if c ~= nil then pcall(C.darMapa, c, inst) end
                    local texto = Motor.texto(inst, "{contacto_nombre} manda a decir: me equivoque de tienda. "
                        .. "La boveda esta en {lugar:objetivo}, el grande. Te deje un mapa nuevo.")
                    for _, p in ipairs(delGrupo) do Motor.enviar(p, "aviso", { texto = texto }) end
                    Motor.anotar(inst, Motor.texto(inst, "El objetivo cambio: la boveda esta en {lugar:objetivo}."))
                    Mundo.log("encargo del mall movido a " .. tostring(nuevo.x) .. "," .. tostring(nuevo.y))
                    Motor.publicar()
                end
            end
        end
    end
end

function C.tick()
    if not Mundo.hayALife() then return end
    for _, c in ipairs(C.LISTA) do
        local e = C.estado(c.id)
        pcall(function()
            -- Antes la busqueda de edificios solo miraba un pedazo de cada ciudad (por eso el
            -- Cabo Ramiro no quedaba en la comisaria). Si quedo en un edificio de respaldo, se
            -- vuelve a buscar una vez con la busqueda arreglada.
            -- Lo mismo si tiene un piso fijo y quedo en otro (el Cabo Ramiro, que va arriba).
            if e.x ~= nil and e.reubicado ~= 2 then
                local enSuSala = false
                for _, sala in ipairs(c.salas or {}) do if sala == e.sala then enSuSala = true end end
                if c.piso ~= nil and floor(tonumber(e.z) or 0) ~= c.piso then enSuSala = false end
                -- Con un encargo en curso no se mueve (se vuelve a revisar cuando termine).
                if enSuSala then
                    e.reubicado = 2
                elseif C.encargoActivo(c.id) == nil then
                    e.reubicado = 2
                    if e.uid ~= nil then Mundo.retirar(e.uid) end
                    e.x, e.y, e.z, e.sala, e.etiqueta, e.uid, e.pidiendo = nil, nil, nil, nil, nil, nil, nil
                end
            end
            if e.x == nil then C.ubicar(c); e.reubicado = 2 end
        end)
        pcall(C.enterrar, e)
        if e.x ~= nil then
            if e.uid ~= nil then
                local actor = Mundo.actor(e.uid)
                if actor ~= nil and actor.lifecycle == "dead" then
                    -- Murio y el aviso de A-Life no llego: se repone igual.
                    pcall(C.alMorir, e, c, e.uid)
                elseif actor == nil then
                    e.faltas = (e.faltas or 0) + 1
                    if e.faltas >= 3 then e.uid, e.faltas = nil, 0 end
                else
                    e.faltas = 0
                    -- Cada cosa por separado: si una falla, las otras igual corren.
                    pcall(C.proteger, e)
                    pcall(Mundo.nombrarActor, e.uid, c.nombre, c.apellido)
                    pcall(function()
                        -- Conversa solo si hay alguien cerca.
                        local lineas = {}
                        for _, f in ipairs(c.frases or {}) do lineas[#lineas + 1] = { "contacto", f } end
                        e.charla = e.charla or {}
                        local m, texto = Motor.charlaElegir(lineas, { { e.uid, "contacto", c.nombre } }, e.charla, 10, 0.15)
                        if m ~= nil then C.decir(c.id, texto) end
                    end)
                    pcall(C.zonaSegura, e)
                end
            end
            if e.uid == nil then pcall(C.reponer, c, e) end
        end
    end
    pcall(C.revisarMall)
    -- De paso, reaplicar las mejoras de los objetos legendarios que llevan los jugadores.
    local L = Narrador.Legendario
    if L ~= nil then
        for _, p in ipairs(Mundo.jugadores()) do pcall(L.repasarJugador, p) end
    end
end

-- Si falta el misionero y hay alguien cerca con su edificio cargado, se pide de nuevo. Si un
-- pedido no contesta en un cuarto de hora, se vuelve a intentar.
C.ESPERA_PEDIDO = 0.25

function C.reponer(c, e)
    if e.uid ~= nil or e.x == nil then return end
    if e.pidiendo ~= nil and Mundo.horas() - e.pidiendo <= C.ESPERA_PEDIDO then return end
    e.pidiendo = nil
    local j = Mundo.jugadorCerca(e.x, e.y, 70)
    if j ~= nil and Mundo.cargado(e.x, e.y, e.z) ~= nil then C.aparecer(c, e, j) end
end

-- El cuerpo cargado del misionero esta muerto aunque A-Life todavia no lo anote.
function C.cuerpoMuerto(uid)
    local cuerpo = Mundo.cuerpoActor(uid)
    if cuerpo == nil then return false end
    local ok, muerto = pcall(function() return cuerpo:isDead() end)
    return ok and muerto == true
end

-- Cada minuto, solo con jugadores cerca: banderas y vida al dia (A-Life las puede perder al
-- recargar el cuerpo cuando alguien llega), reponer si murio y pedirlo si falta.
function C.vigilar(c, e)
    if e.x == nil or Mundo.jugadorCerca(e.x, e.y, 70) == nil then return end
    if e.uid ~= nil then
        local actor = Mundo.actor(e.uid)
        if (actor ~= nil and actor.lifecycle == "dead") or C.cuerpoMuerto(e.uid) then
            pcall(C.alMorir, e, c, e.uid)
        elseif actor ~= nil then
            pcall(C.proteger, e)
        end
    end
    if e.uid == nil then pcall(C.reponer, c, e) end
end

-- Cada minuto: cancelar a tiempo la transformacion de un misionero que acaba de morir y
-- cuidar a los que tienen jugadores cerca.
function C.tickMinuto()
    if not Mundo.hayALife() then return end
    for _, c in ipairs(C.LISTA) do
        local e = C.estado(c.id)
        if e.muertos ~= nil then pcall(C.enterrar, e) end
        pcall(C.vigilar, c, e)
    end
end

-- Encargo en curso de un contacto (o nil).
function C.encargoActivo(id)
    local st = Motor.estado()
    for _, arcoId in ipairs(st.orden) do
        local inst = st.arcos[arcoId]
        if inst ~= nil and inst.final == nil and inst.vars.contacto == id then return inst end
    end
    return nil
end

-- Encargo en curso de un grupo de jugadores (faccion del juego, o el jugador si no tiene).
function C.encargoDelGrupo(clave)
    local st = Motor.estado()
    for _, arcoId in ipairs(st.orden) do
        local inst = st.arcos[arcoId]
        if inst ~= nil and inst.final == nil and inst.vars.dueno == clave then return inst end
    end
    return nil
end

-- Encargos activos de todos los grupos (para que cada cliente sepa si el suyo tiene uno).
function C.encargosActivos()
    local st, lista = Motor.estado(), {}
    for _, arcoId in ipairs(st.orden) do
        local inst = st.arcos[arcoId]
        if inst ~= nil and inst.final == nil and inst.vars.dueno ~= nil then
            lista[#lista + 1] = { dueno = inst.vars.dueno, contacto = inst.vars.contacto, arco = inst.id }
        end
    end
    return lista
end

function C.vista()
    local lista = {}
    for _, c in ipairs(C.LISTA) do
        local e = C.estado(c.id)
        if e.x ~= nil then
            lista[#lista + 1] = { id = c.id, ciudad = c.ciudad, nombre = C.nombreCompleto(c), uid = e.uid,
                x = e.x, y = e.y }
        end
    end
    return lista
end

-- Elige un encargo al azar del nivel pedido.
function C.elegirEncargo(nivel)
    local candidatos = {}
    for _, def in ipairs(Defs.todos()) do
        if def.encargo_nivel == nivel then candidatos[#candidatos + 1] = def end
    end
    if #candidatos == 0 then return nil end
    return candidatos[Mundo.azar(#candidatos)]
end

C.SALUDOS = {
    facil = "Tengo algo sencillo. Nada que te vaya a matar... probablemente. Toma el mapa.",
    medio = "Este trabajo tiene sus riesgos. Te voy a pagar bien. Llevate el mapa, ahi te marque la zona.",
    dificil = "No te voy a mentir: esto es peligroso. Por eso pago lo que pago. Te marque la zona en un mapa.",
    ultra = "Louisville. Nadie que haya ido ha vuelto entero. Si lo logras, eliges tu premio. Llevate el mapa.",
}

function C.extra(c, nivel, jugador)
    local clave, nombreGrupo
    if jugador ~= nil then clave, nombreGrupo = Mundo.grupoDe(jugador) end
    return {
        vars = { contacto = c.id, nivel = nivel, contacto_nombre = c.nombre .. " " .. c.apellido, ciudad = c.ciudad,
                 dueno = clave, dueno_nombre = nombreGrupo },
        lugares = { contacto = C.lugar(c.id) },
    }
end

-- Le da a cada jugador del grupo un mapa con la ZONA del encargo (un circulo, no una X)
-- y la marca en su mapa del mundo. Tambien sale marcado donde esta el misionero.
function C.darMapa(c, inst)
    local objetivo = inst.lugares.objetivo
    local x, y = C.posicion(c.id)
    if objetivo == nil or x == nil then return end
    local delGrupo = {}
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.grupoDe(p) == inst.vars.dueno then delGrupo[#delGrupo + 1] = p end
    end
    local R = Narrador.Reputacion
    Motor.darMapaZona(inst, "objetivo", {
        radio = R ~= nil and R.radioMapa(inst.vars.dueno, c.id) or nil,
        jugadores = delGrupo,
        titulo = "Mapa de " .. C.nombreCompleto(c),
        extras = { { x = x, y = y, texto = C.nombreCompleto(c), r = 0.1, g = 0.4, b = 0.9 } },
    })
end

-- Para el menu de admin: el contacto ubicado mas cercano al jugador.
function C.extraParaEncargo(jugador, nivel)
    local px, py = Mundo.posicion(jugador)
    local mejor, dist
    for _, c in ipairs(C.LISTA) do
        if C.ubicar(c) ~= nil and px ~= nil then
            local x, y = C.posicion(c.id)
            local d = math.sqrt((x - px) ^ 2 + (y - py) ^ 2)
            if dist == nil or d < dist then mejor, dist = c, d end
        end
    end
    if mejor == nil then return nil end
    return C.extra(mejor, nivel, jugador)
end

function C.pedirTrabajo(jugador, id, nivel)
    local c = C.def(tostring(id))
    if c == nil or C.NIVELES[tostring(nivel)] == nil then return end
    local e = C.estado(c.id)
    local x, y = C.posicion(c.id)
    local px, py = Mundo.posicion(jugador)
    if x == nil or px == nil or math.sqrt((x - px) ^ 2 + (y - py) ^ 2) > 10 then
        Motor.responder(jugador, "Estas muy lejos.")
        return
    end
    local clave, nombreGrupo = Mundo.grupoDe(jugador)
    local activo = C.encargoDelGrupo(clave)
    if activo ~= nil then
        local otro = C.def(tostring(activo.vars.contacto))
        local quien = otro ~= nil and C.nombreCompleto(otro) or "otro misionero"
        if clave == ("faccion:" .. tostring(nombreGrupo)) then
            C.decir(c.id, "Tu grupo, " .. nombreGrupo .. ", ya tiene un encargo con " .. quien .. ". Terminenlo primero.")
        else
            C.decir(c.id, "Ya tienes un encargo con " .. quien .. ". Terminalo primero.")
        end
        return
    end
    local def = C.elegirEncargo(nivel)
    if def == nil then
        Motor.responder(jugador, "No hay encargos de ese tipo cargados.")
        return
    end
    local inst, razon = Motor.iniciar(def.id, jugador, C.extra(c, nivel, jugador))
    if inst == nil then
        Motor.responder(jugador, "No se pudo armar el encargo: " .. tostring(razon))
        return
    end
    C.decir(c.id, C.SALUDOS[nivel])
    pcall(C.darMapa, c, inst)
end

if Events ~= nil and not C._enganchado then
    C._enganchado = true
    Events.EveryTenMinutes.Add(C.tick)
    if Events.EveryOneMinute ~= nil then Events.EveryOneMinute.Add(C.tickMinuto) end
    -- El evento de muertes de A-Life puede existir recien al arrancar la partida.
    local function enganchar()
        if C._muerteEnganchada then return end
        if Events.ProjectALife_NpcDied ~= nil and Events.ProjectALife_NpcDied.Add ~= nil then
            Events.ProjectALife_NpcDied.Add(C.onNpcMuerto)
            C._muerteEnganchada = true
        end
    end
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(enganchar) end
    if Events.OnServerStarted ~= nil then Events.OnServerStarted.Add(enganchar) end
    enganchar()
end

return C
