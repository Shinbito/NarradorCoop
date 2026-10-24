-- Narrador Co-op (servidor): campamentos de los misioneros.
-- Cuenta las personas salvadas que llegan a cada campamento, sube su nivel cuando se cumplen
-- los requisitos (ver shared/Narrador/NarradorCampamentosDefs.lua), trae al del oficio de
-- cada nivel (un NPC de A-Life que no se mueve y no puede morir) y atiende las compras.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorCampamentosDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"

local K, Mundo, Motor, C = Narrador.CampamentosDefs, Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local floor = math.floor

local S = Narrador.Campamentos or {}
Narrador.Campamentos = S

-- Donde se para cada uno, alrededor del misionero.
S.PUESTOS = { carpintero = { 3, 0 }, herrero = { -3, 0 }, mecanico = { 0, 3 }, curandero = { 0, -3 } }

function S.estado(contactoId)
    local e = C.estado(contactoId)
    e.campamento = e.campamento or { nivel = 0, salvados = 0, oficios = {} }
    if e.campamento.reservas == nil then e.campamento.reservas = K.reservasIniciales(contactoId) end
    return e.campamento
end

-- ---------------------------------------------------------------------------
-- Reservas (comida, municion, abrigo, medicina: de 0 a 100)
-- ---------------------------------------------------------------------------

function S.sumarReserva(k, moneda, n)
    k.reservas[moneda] = math.max(0, math.min(100, (tonumber(k.reservas[moneda]) or 50) + (tonumber(n) or 0)))
end

-- Cada dia el campamento gasta lo suyo.
function S.gastar(c, k)
    local ahora = Mundo.horas()
    if k.gastoHora == nil then k.gastoHora = ahora; return end
    if ahora - k.gastoHora < 24 then return end
    k.gastoHora = ahora
    local invierno = false
    pcall(function() invierno = Mundo.estacion() == "invierno" end)
    for moneda, n in pairs(K.gastoDiario(#(k.guardias or {}), invierno)) do S.sumarReserva(k, moneda, -n) end
end

local function avisarTodos(texto)
    for _, p in ipairs(Mundo.jugadores()) do Motor.enviar(p, "aviso", { texto = texto }) end
end

local function anotar(texto)
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = texto, arco = "Campamentos" }
    while #st.diario > (Motor.MAX_DIARIO_GLOBAL or 60) do table.remove(st.diario, 1) end
end

-- ---------------------------------------------------------------------------
-- Guardias: la gente que salvas y llevas al campamento
-- ---------------------------------------------------------------------------
-- Se quedan como guardias (rondan el campamento) hasta un maximo de 15. Si ya hay 15, la
-- persona queda resguardada adentro haciendo encargos y no sale a rondar. Cuando una horda
-- ataca el campamento, los guardias pelean y pueden morir de verdad.
S.MAX_GUARDIAS = 15
S.RADIO_GUARDIAS = 18

-- Una persona salvada llego al campamento. persona = { nombre, apellido, perfil } (opcional).
function S.sumarSalvado(contactoId, persona)
    local c = C.def(contactoId)
    local k = S.estado(contactoId)
    k.salvados = (k.salvados or 0) + 1
    k.guardias = k.guardias or {}
    if persona ~= nil and persona.perfil ~= nil then
        local nombre = tostring(persona.nombre or "Alguien")
        if #k.guardias < S.MAX_GUARDIAS then
            -- Aparece como guardia un rato despues (cuando la persona del encuentro ya se fue).
            k.guardias[#k.guardias + 1] = { nombre = persona.nombre, apellido = persona.apellido, perfil = persona.perfil,
                desde = Mundo.horas() + 0.5 }
            avisarTodos(nombre .. " se queda en el campamento de " .. (c ~= nil and c.nombre or "?") .. " como guardia ("
                .. #k.guardias .. " de " .. S.MAX_GUARDIAS .. ").")
        else
            avisarTodos(nombre .. " queda resguardado en el campamento de " .. (c ~= nil and c.nombre or "?")
                .. " haciendo encargos. Ya hay " .. S.MAX_GUARDIAS .. " guardias rondando.")
        end
    end
    pcall(S.revisar, c, C.estado(contactoId))
end

local function banderasGuardia(e, inmortal)
    return { persistent = true, invulnerable = inmortal, stationary = false, leashRadius = S.RADIO_GUARDIAS }
end

function S.aparecerGuardia(c, e, g, jugador)
    local ang = (Mundo.azar(360) / 180) * math.pi
    local x, y = floor(e.x + math.cos(ang) * 6), floor(e.y + math.sin(ang) * 6)
    g.intentos = (g.intentos or 0) + 1
    local requestId = "narrador:guardia:" .. c.id .. ":" .. tostring(g.nombre) .. ":" .. tostring(g.intentos)
    if g.nombre ~= nil then Mundo.reservarNombres(requestId, { [g.perfil] = { g.nombre, g.apellido or "" } }) end
    local args = {
        requestId = requestId, x = x, y = y, z = 0,
        mode = "patrol", radius = 4, distance = 0, separation = 1, atomicGroup = true,
        persistent = true, stationary = false, invulnerable = true, leashRadius = S.RADIO_GUARDIAS,
        profileIds = { g.perfil }, count = 1, hostileOverride = false, playerStance = "friendly", playerKeepOut = 0,
    }
    local ok = Mundo.spawnGrupo(jugador, args, function(resultado)
        local uids = type(resultado) == "table" and resultado.actorUids or nil
        if type(uids) == "table" and uids[1] ~= nil then
            g.uid, g.pidiendo = uids[1], nil
            if g.nombre ~= nil then pcall(Mundo.nombrarActor, g.uid, g.nombre, g.apellido or "") end
            local k = S.estado(c.id)
            pcall(Mundo.banderas, g.uid, banderasGuardia(e, k.ataque == nil), { x = e.x, y = e.y, z = 0 })
        else
            g.pidiendo = nil
        end
    end)
    if ok then g.pidiendo = Mundo.horas() end
end

-- Cada 10 minutos: guardias vivos con sus banderas, muertos fuera de la lista, faltantes a
-- aparecer (de a uno, con alguien cerca).
function S.cuidarGuardias(c, e)
    local k = S.estado(c.id)
    local quedan, pidio = {}, false
    for _, g in ipairs(k.guardias or {}) do
        local muerto = false
        if g.uid ~= nil then
            local actor = Mundo.actor(g.uid)
            if (actor ~= nil and actor.lifecycle == "dead") or C.cuerpoMuerto(g.uid) then muerto = true end
        end
        if muerto then
            avisarTodos(tostring(g.nombre or "Un guardia") .. " murio defendiendo el campamento de " .. c.nombre .. ".")
            anotar(tostring(g.nombre or "Un guardia") .. " murio defendiendo el campamento de " .. c.nombre .. ".")
        else
            quedan[#quedan + 1] = g
            if g.uid ~= nil then
                pcall(Mundo.banderas, g.uid, banderasGuardia(e, k.ataque == nil), { x = e.x, y = e.y, z = 0 })
                pcall(C.curar, g.uid)
            elseif not pidio and Mundo.horas() >= (g.desde or 0) and (g.pidiendo == nil or Mundo.horas() - g.pidiendo > 0.25) then
                g.pidiendo = nil
                local j = Mundo.jugadorCerca(e.x, e.y, 70)
                if j ~= nil and Mundo.cargado(e.x, e.y, 0) ~= nil then
                    S.aparecerGuardia(c, e, g, j)
                    pidio = true
                end
            end
        end
    end
    k.guardias = quedan
end

-- ---------------------------------------------------------------------------
-- Hordas que atacan los campamentos
-- ---------------------------------------------------------------------------
-- Con un jugador cerca (a menos de 150 casillas) y guardias en el campamento, cada tanto
-- llega una horda. Mientras dura, los guardias no son inmortales y no se limpian los zombis
-- de alrededor (C.zonaSegura). Si ayudas a defenderlo, sube tu fama en Knox y la confianza.
S.ATAQUE_CADA = 72        -- horas minimas entre ataques al mismo campamento
S.ATAQUE_CHANCE = 48      -- 1 en n por cada chequeo de 10 minutos (pasada la espera)
S.ATAQUE_DURA = 3         -- horas maximas
S.ATAQUE_KNOX = 6
S.ATAQUE_CONFIANZA = 3

function S.empezarAtaque(c, e, k)
    local n = 15 + 2 * #(k.guardias or {})
    local total = Mundo.oleada(e.x, e.y, 0, n, 30, 55)
    k.ataque = { inicio = Mundo.horas(), meta = math.max(5, floor(total * 0.8)), ayudaron = {} }
    for moneda, g in pairs(K.GASTO_ATAQUE) do S.sumarReserva(k, moneda, -g) end
    k.ultimoAtaque = Mundo.horas()
    for _, p in ipairs(Mundo.jugadores()) do
        local x, y = Mundo.posicion(p)
        if x ~= nil and math.sqrt((x - e.x) ^ 2 + (y - e.y) ^ 2) <= 300 then
            Motor.enviar(p, "aviso", { texto = "Una horda va hacia el campamento de " .. c.nombre .. ". Los guardias se preparan." })
        end
    end
    anotar("Una horda ataco el campamento de " .. c.nombre .. " (" .. c.ciudad .. ").")
    Mundo.log("ataque al campamento " .. c.id .. ": " .. total .. " zombis")
    Motor.publicar()
end

function S.seguirAtaque(c, e, k)
    local a = k.ataque
    for _, p in ipairs(Mundo.jugadores()) do
        local x, y = Mundo.posicion(p)
        if x ~= nil and Mundo.vivo(p) and math.sqrt((x - e.x) ^ 2 + (y - e.y) ^ 2) <= 60 then a.ayudaron[Mundo.grupoDe(p)] = true end
    end
    local bajas = Motor.contarBajas(e.x, e.y, 60, a.inicio)
    if bajas < a.meta and Mundo.horas() - a.inicio < S.ATAQUE_DURA then return end
    k.ataque = nil
    local KX, R = Narrador.Knox, Narrador.Reputacion
    for grupo in pairs(a.ayudaron) do
        if KX ~= nil then KX.sumar(grupo, S.ATAQUE_KNOX, "protegiste") end
        if R ~= nil and R.activa() then R.sumar(grupo, c.id, S.ATAQUE_CONFIANZA, "defendio el campamento", true) end
        for _, p in ipairs(Mundo.jugadores()) do
            if Mundo.grupoDe(p) == grupo then
                Motor.enviar(p, "aviso", { texto = c.nombre .. ": Aguantamos. Gracias por quedarte a pelear con nosotros." })
            end
        end
    end
    pcall(S.cuidarGuardias, c, e)
    anotar("El campamento de " .. c.nombre .. " aguanto la horda. Quedan " .. #(k.guardias or {}) .. " guardias.")
    Motor.publicar()
end

function S.revisarAtaque(c, e)
    local k = S.estado(c.id)
    if k.ataque ~= nil then return S.seguirAtaque(c, e, k) end
    if #(k.guardias or {}) == 0 then return end
    if k.ultimoAtaque ~= nil and Mundo.horas() - k.ultimoAtaque < S.ATAQUE_CADA then return end
    if k.ultimoAtaque == nil then k.ultimoAtaque = Mundo.horas(); return end
    if Mundo.jugadorCerca(e.x, e.y, 150) == nil or Mundo.cargado(e.x, e.y, 0) == nil then return end
    if Mundo.azar(S.ATAQUE_CHANCE) ~= 1 then return end
    S.empezarAtaque(c, e, k)
end

function S.enAtaque(contactoId)
    local e = C.estado(contactoId)
    return e.campamento ~= nil and e.campamento.ataque ~= nil
end

-- ---------------------------------------------------------------------------
-- Niveles
-- ---------------------------------------------------------------------------

-- El capitulo n de la historia del misionero ya esta escrito? (si no, no se pide).
function S.capituloExiste(contactoId, n)
    local G = Narrador.Generador
    for _, e in ipairs(G ~= nil and G.ESPECIALES or {}) do
        if e.contacto == contactoId and e.capitulo == n and Narrador.Defs.get(e.def) ~= nil then return true end
    end
    return false
end

-- Lo que falta para el nivel siguiente (lista de textos; vacia = se cumple todo).
function S.falta(c, grupoRef)
    local k = S.estado(c.id)
    local req = K.NIVELES[(k.nivel or 0) + 1]
    if req == nil then return nil end
    local st = Motor.estado()
    local lista = {}
    if (k.salvados or 0) < req.salvados then
        lista[#lista + 1] = "salvar y traer a " .. (req.salvados - (k.salvados or 0)) .. " persona(s) mas"
    end
    local capitulo = req.historia
    if req.historia_de ~= nil and req.historia_de[c.id] ~= nil then capitulo = req.historia_de[c.id] end
    if capitulo ~= nil and S.capituloExiste(c.id, capitulo) and st.memoria["historia_" .. c.id .. "_" .. capitulo] == nil then
        lista[#lista + 1] = "hacer el capitulo " .. capitulo .. " de su historia"
    end
    if req.confianza ~= nil then
        local R = Narrador.Reputacion
        local mejor = 0
        if R ~= nil and R.activa() then
            for grupo, fila in pairs(R.tabla()) do
                if type(fila) == "table" and (grupoRef == nil or grupo == grupoRef) then
                    mejor = math.max(mejor, R.nivel(tonumber(fila[c.id]) or 0))
                end
            end
        else
            mejor = 5
        end
        if mejor < req.confianza then lista[#lista + 1] = "confianza " .. req.confianza .. " con " .. c.nombre end
    end
    return lista
end

function S.revisar(c, e)
    if c == nil or not C.desbloqueado(c.id) then return end
    local k = S.estado(c.id)
    local falta = S.falta(c)
    if falta == nil or #falta > 0 then return end
    k.nivel = (k.nivel or 0) + 1
    local req = K.NIVELES[k.nivel]
    local p = K.persona(req.oficio, c.id, Motor.estado().memoria)
    k.oficios[req.oficio] = k.oficios[req.oficio] or {}
    avisarTodos("El campamento de " .. c.nombre .. " sube a nivel " .. k.nivel .. ". " .. tostring(p.llega))
    anotar("El campamento de " .. c.nombre .. " (" .. c.ciudad .. ") subio a nivel " .. k.nivel .. ": llego "
        .. string.lower(p.titulo) .. ", " .. p.nombre[1] .. " " .. p.nombre[2] .. ".")
    Mundo.log("campamento " .. c.id .. " nivel " .. k.nivel)
    Motor.publicar()
end

-- ---------------------------------------------------------------------------
-- La gente de los oficios: aparecer, proteger, reponer
-- ---------------------------------------------------------------------------

function S.posicionPuesto(e, oficio)
    local d = S.PUESTOS[oficio] or { 2, 2 }
    return e.x + d[1], e.y + d[2], e.z or 0
end

function S.aparecer(c, e, oficio, o, jugador)
    local p = K.persona(oficio, c.id, Motor.estado().memoria)
    local x, y, z = S.posicionPuesto(e, oficio)
    o.intentos = (o.intentos or 0) + 1
    local requestId = "narrador:oficio:" .. c.id .. ":" .. oficio .. ":" .. tostring(o.intentos)
    Mundo.reservarNombres(requestId, { [p.perfil] = { p.nombre[1], p.nombre[2] } })
    local args = {
        requestId = requestId, x = floor(x), y = floor(y), z = floor(z),
        mode = "guard", radius = 2, distance = 0, separation = 1, atomicGroup = true,
        persistent = true, stationary = true, invulnerable = true, leashRadius = 3,
        profileIds = { p.perfil }, count = 1, hostileOverride = false, playerStance = "friendly", playerKeepOut = 0,
    }
    local ok = Mundo.spawnGrupo(jugador, args, function(resultado)
        local uids = type(resultado) == "table" and resultado.actorUids or nil
        if type(uids) == "table" and uids[1] ~= nil then
            o.uid, o.pidiendo = uids[1], nil
            pcall(Mundo.nombrarActor, o.uid, p.nombre[1], p.nombre[2])
            pcall(Mundo.banderas, o.uid, C.BANDERAS, { x = x, y = y, z = z })
            Motor.publicar()
        else
            o.pidiendo = nil
        end
    end)
    if ok then o.pidiendo = Mundo.horas() end
end

function S.cuidar(c, e)
    local k = S.estado(c.id)
    for oficio, o in pairs(k.oficios or {}) do
        pcall(function()
            if o.uid ~= nil then
                local actor = Mundo.actor(o.uid)
                if (actor ~= nil and actor.lifecycle == "dead") or C.cuerpoMuerto(o.uid) then
                    o.uid = nil
                elseif actor ~= nil then
                    local x, y, z = S.posicionPuesto(e, oficio)
                    pcall(Mundo.banderas, o.uid, C.BANDERAS, { x = x, y = y, z = z })
                    pcall(C.curar, o.uid)
                end
            end
            if o.uid == nil and (o.pidiendo == nil or Mundo.horas() - o.pidiendo > 0.25) then
                o.pidiendo = nil
                local j = Mundo.jugadorCerca(e.x, e.y, 70)
                if j ~= nil and Mundo.cargado(e.x, e.y, e.z) ~= nil then S.aparecer(c, e, oficio, o, j) end
            end
        end)
    end
end

function S.tick()
    if not Mundo.hayALife() then return end
    for _, c in ipairs(C.LISTA) do
        local e = C.estado(c.id)
        if e.x ~= nil and C.desbloqueado(c.id) then
            pcall(S.revisar, c, e)
            pcall(S.cuidar, c, e)
            pcall(S.cuidarGuardias, c, e)
            pcall(S.revisarAtaque, c, e)
            pcall(S.gastar, c, S.estado(c.id))
        end
    end
end

-- ---------------------------------------------------------------------------
-- Pagar y comprar
-- ---------------------------------------------------------------------------

local function esMunicion(it)
    local ok, t = pcall(function() return it:getFullType() end)
    if not ok or t == nil then return false end
    return string.find(t, "Bullets", 1, true) ~= nil or string.find(t, "Shells", 1, true) ~= nil
end

local function esCaja(it)
    local ok, t = pcall(function() return it:getFullType() end)
    return ok and t ~= nil and string.find(t, "Box", 1, true) ~= nil
end

-- Stats de una prenda para K.valorPrenda (con pcall: no todas las versiones tienen todo).
function S.statsPrenda(it)
    local function num(m)
        local ok, v = pcall(function() return it[m](it) end)
        return ok and tonumber(v) or 0
    end
    local estado = 1
    local max = num("getConditionMax")
    if max > 0 then estado = num("getCondition") / max end
    return { aislacion = num("getInsulation"), viento = num("getWindresistance"), agua = num("getWaterResistance"),
        mordida = num("getBiteDefense"), rasguno = num("getScratchDefense"), estado = estado }
end

local function esRopaSuelta(jugador, it)
    local ok, sirve = pcall(function()
        if not Mundo.es(it, "Clothing") then return false end
        if it:isEquipped() then return false end
        if jugador:isEquipped(it) then return false end
        return true
    end)
    return ok and sirve == true
end

-- Junta items con valor (de menor a mayor) hasta pagar n. lista = { { par, valor } }
local function porValor(lista, n)
    table.sort(lista, function(a, b) return a.valor < b.valor end)
    local total, sacar, juntado = 0, {}, 0
    for _, p in ipairs(lista) do total = total + p.valor end
    for _, p in ipairs(lista) do
        if juntado >= n then break end
        sacar[#sacar + 1] = p.par
        juntado = juntado + p.valor
    end
    return total, sacar
end

-- Cuantas unidades de la moneda lleva el jugador y que items se sacarian para pagar n.
function S.juntar(jugador, moneda, n)
    if moneda == "medicina" then
        local lista = {}
        for _, par in ipairs(Mundo.buscarItems(jugador, function(it)
            local ok, t = pcall(function() return it:getFullType() end)
            return ok and K.valorMedicina(t) > 0
        end)) do
            local ok, t = pcall(function() return par[1]:getFullType() end)
            lista[#lista + 1] = { par = par, valor = K.valorMedicina(ok and t or "") }
        end
        return porValor(lista, n)
    end
    if moneda == "abrigo" then
        local prendas = {}
        for _, par in ipairs(Mundo.buscarItems(jugador, function(it) return esRopaSuelta(jugador, it) end)) do
            prendas[#prendas + 1] = { par = par, valor = K.valorPrenda(S.statsPrenda(par[1])) }
        end
        -- Primero las que menos valen, hasta juntar lo que cuesta.
        return porValor(prendas, n)
    end
    if moneda == "comida" then
        local lista = Mundo.buscarItems(jugador, function(it) return Mundo.esComida(it) end, n)
        return #lista, lista
    end
    local cajas = Mundo.buscarItems(jugador, function(it) return esMunicion(it) and esCaja(it) end)
    local sueltas = Mundo.buscarItems(jugador, function(it) return esMunicion(it) and not esCaja(it) end)
    local total = #cajas + floor(#sueltas / 10)
    local sacar = {}
    for i = 1, math.min(n, #cajas) do sacar[#sacar + 1] = cajas[i] end
    local faltan = n - #sacar
    for i = 1, math.min(faltan * 10, #sueltas) do sacar[#sacar + 1] = sueltas[i] end
    return total, sacar
end

function S.nivelConfianza(jugador, contactoId)
    local R = Narrador.Reputacion
    -- Con muy mala fama en Knox no hay descuento para nadie.
    local KX = Narrador.Knox
    if KX ~= nil and KX.despreciadoJugador(jugador) then return 1 end
    if R == nil or not R.activa() then return 1 end
    return R.nivel(R.valor(Mundo.grupoDe(jugador), contactoId))
end

-- Mejora el arma que el jugador tiene en la mano (la deja "excepcional").
local function mejorar(jugador)
    local L = Narrador.Legendario
    local arma
    pcall(function() arma = jugador:getPrimaryHandItem() end)
    local esArma = false
    esArma = Mundo.es(arma, "HandWeapon")
    if not esArma then return false, "Pasame un arma en la mano, pues." end
    local md
    pcall(function() md = arma:getModData() end)
    if md ~= nil and md.NarradorLegendario ~= nil then return false, "Esa ya esta mejor de lo que yo la puedo dejar." end
    if L == nil then return false, "No tengo con que." end
    pcall(L.marcar, arma, "chetada")
    pcall(L.aplicar, arma)
    pcall(function() if syncItemFields ~= nil then syncItemFields(jugador, arma) end end)
    return true
end

-- El herrero forja un arma con el mango del carpintero que llevas: mango de arma -> arma
-- excepcional; mango de madera noble -> arma legendaria. Se gasta el mango.
function S.forjar(jugador)
    local L = Narrador.Legendario
    local function buscar(tipo)
        return Mundo.buscarItem(jugador, function(it)
            local ok, t = pcall(function() return it:getFullType() end)
            return ok and t == tipo
        end)
    end
    local nivel = "legendaria"
    local mango, cont = buscar("Narrador.MangoLegendario")
    if mango == nil then
        nivel = "chetada"
        mango, cont = buscar("Narrador.MangoArma")
    end
    if mango == nil then return false, "Sin mango no hay arma. El carpintero los hace." end
    local arma = Mundo.crearItem(K.FORJA[Mundo.azar(#K.FORJA)])
    if arma == nil then return false, "Se me apago el fuego. Vuelve despues." end
    Mundo.quitarItem(cont, mango)
    if L ~= nil then pcall(L.marcar, arma, nivel) end
    Mundo.darItem(jugador, arma)
    return true
end

-- Comando publico: { contacto, oficio, i, moneda }
function S.comprar(jugador, args)
    local c = C.def(tostring(args.contacto))
    local oficio = tostring(args.oficio)
    local moneda = K.MONEDAS[tostring(args.moneda)] ~= nil and tostring(args.moneda) or "comida"
    if c == nil or K.OFICIOS[oficio] == nil then return end
    local k = S.estado(c.id)
    local o = k.oficios[oficio]
    if o == nil or o.uid == nil then Motor.responder(jugador, "No hay nadie atendiendo."); return end
    local x, y = Mundo.posicionActor(o.uid)
    local px, py = Mundo.posicion(jugador)
    if x == nil or px == nil or math.sqrt((x - px) ^ 2 + (y - py) ^ 2) > 6 then Motor.responder(jugador, "Estas muy lejos."); return end
    local art = K.OFICIOS[oficio].catalogo[tonumber(args.i) or 0]
    if art == nil then return end
    -- Con fama de El carnicero de Knox o peor no te venden nada (los recados siguen, ver S.recado).
    local KX = Narrador.Knox
    if KX ~= nil and KX.despreciadoJugador(jugador) then
        local quien = K.persona(oficio, c.id, Motor.estado().memoria)
        Motor.responder(jugador, quien.nombre[1] .. ": A ti no te vendo nada. Pero si quieres que la gente confie en ti, tengo un recado.")
        return
    end
    local nivel = S.nivelConfianza(jugador, c.id)
    if art.confianza ~= nil and nivel < art.confianza then
        Motor.responder(jugador, "Eso no te lo vendo todavia. Primero que " .. c.nombre .. " te tenga mas confianza.")
        return
    end
    local precio = K.precio(art, c.id, moneda, nivel, k.reservas)
    local tiene, sacar = S.juntar(jugador, moneda, precio)
    if tiene < precio then
        Motor.responder(jugador, "Te faltan: cuesta " .. precio .. " de " .. moneda .. " y llevas " .. tiene .. ".")
        return
    end
    local p = K.persona(oficio, c.id, Motor.estado().memoria)
    if art.servicio == "mejorar" then
        local ok, razon = mejorar(jugador)
        if not ok then Motor.responder(jugador, p.nombre[1] .. ": " .. tostring(razon)); return end
    elseif art.servicio == "forjar" then
        local ok, razon = S.forjar(jugador)
        if not ok then Motor.responder(jugador, p.nombre[1] .. ": " .. tostring(razon)); return end
    elseif art.servicio == "auto" then
        local L = Narrador.Legendario
        local ok = L ~= nil and L.crearAuto(px + 4, py + 4, 0)
        if not ok then Motor.responder(jugador, p.nombre[1] .. ": No hay espacio aca para dejartelo. Busca una calle despejada."); return end
    end
    for _, par in ipairs(sacar) do Mundo.quitarItem(par[2], par[1]) end
    -- Lo que pagaste queda en las reservas del campamento.
    S.sumarReserva(k, moneda, precio * K.RESERVA_POR_UNIDAD)
    for _, tipos in ipairs(art.items or {}) do
        local item = Mundo.crearItem(tipos)
        if item ~= nil then Mundo.darItem(jugador, item) end
    end
    Motor.enviar(jugador, "aviso", { texto = p.nombre[1] .. " te vende: " .. art.texto .. " (" .. precio .. " de " .. moneda .. ")." })
end

-- ---------------------------------------------------------------------------
-- Recados de los comerciantes
-- ---------------------------------------------------------------------------

-- El recado que tiene ahora un comerciante: se arma al azar y se cambia al cumplirse.
function S.recadoActual(o, oficio)
    if o.recadoGen == nil then o.recadoGen = K.generarRecado(oficio, Mundo.azar) end
    return o.recadoGen
end

-- Recado en curso de un grupo (o nil).
function S.recadoDelGrupo(grupo)
    local st = Motor.estado()
    for _, id in ipairs(st.orden or {}) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil and inst.def == "recado_comerciante" and inst.vars.recado_grupo == grupo then return inst end
    end
    return nil
end

-- Comando publico: { contacto, oficio }. El comerciante te da su recado (una mision chica).
function S.recado(jugador, args)
    local c = C.def(tostring(args.contacto))
    local oficio = tostring(args.oficio)
    if c == nil or K.OFICIOS[oficio] == nil then return end
    local e = C.estado(c.id)
    local k = S.estado(c.id)
    local o = k.oficios[oficio]
    if o == nil or o.uid == nil then return end
    local x, y = Mundo.posicionActor(o.uid)
    local px, py = Mundo.posicion(jugador)
    if x == nil or px == nil or math.sqrt((x - px) ^ 2 + (y - py) ^ 2) > 6 then Motor.responder(jugador, "Estas muy lejos."); return end
    local p = K.persona(oficio, c.id, Motor.estado().memoria)
    local grupo = Mundo.grupoDe(jugador)
    if S.recadoDelGrupo(grupo) ~= nil then
        Motor.responder(jugador, p.nombre[1] .. ": Primero termina el recado que ya tienes.")
        return
    end
    o.hechos = o.hechos or {}
    local ultimo = o.hechos[grupo]
    if ultimo ~= nil and Mundo.horas() - ultimo < K.RECADO_CADA then
        Motor.responder(jugador, p.nombre[1] .. ": Ya me ayudaste hoy. Vuelve manana, que siempre sale algo.")
        return
    end
    local r = S.recadoActual(o, oficio)
    if r == nil then return end
    local px2, py2, pz2 = S.posicionPuesto(e, oficio)
    local comerciante = p.nombre[1] .. " " .. p.nombre[2]
    local inst, razon = Motor.iniciar("recado_comerciante", jugador, {
        vars = { comerciante = comerciante, oficio = string.lower(p.titulo), salas = r.salas, respaldo = r.respaldo,
                 objeto_tipo = r.objeto, objeto_nombre = r.nombre, recado_grupo = grupo, recado_contacto = c.id,
                 recado_oficio = oficio },
        lugares = { comerciante = { x = floor(px2), y = floor(py2), z = floor(pz2 or 0), radio = 8, exacto = true,
                                    etiqueta = comerciante .. " en el campamento de " .. c.nombre } },
    })
    if inst == nil then
        Motor.responder(jugador, p.nombre[1] .. ": Ahora no se me ocurre nada. (" .. tostring(razon) .. ")")
        return
    end
    Motor.enviar(jugador, "aviso", { texto = p.nombre[1] .. ": " .. r.pedido })
end

-- Accion del recado cumplido: Knox, confianza con el misionero y el siguiente recado.
Motor.inmediatas.recado_hecho = function(inst, a)
    local grupo, cid, oficio = inst.vars.recado_grupo, inst.vars.recado_contacto, inst.vars.recado_oficio
    local c = C.def(tostring(cid))
    if c == nil or grupo == nil then return true end
    local o = S.estado(c.id).oficios[tostring(oficio)]
    if o ~= nil then
        o.hechos = o.hechos or {}
        o.hechos[grupo] = Mundo.horas()
        o.recadoGen = nil
    end
    local KX, KD, R = Narrador.Knox, Narrador.KnoxDefs, Narrador.Reputacion
    if KX ~= nil and KD ~= nil then KX.sumar(grupo, KD.RECADO, "recado") end
    if R ~= nil and R.activa() then R.sumar(grupo, c.id, K.RECADO_CONFIANZA, "recado", true) end
    local nombre = tostring(inst.vars.comerciante or "El comerciante")
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.grupoDe(p) == grupo then
            Motor.enviar(p, "aviso", { texto = nombre .. ": Gracias. Esto se sabe, ah? La gente se entera de estas cosas."
                .. (KD ~= nil and (" (+" .. KD.RECADO .. " de reputacion en Knox)") or "") })
        end
    end
    Motor.publicar()
    return true
end

-- ---------------------------------------------------------------------------
-- Vista para los clientes
-- ---------------------------------------------------------------------------

function S.vista(v)
    local lista = {}
    for _, c in ipairs(C.LISTA) do
        local e = C.estado(c.id)
        if e.x ~= nil and C.desbloqueado(c.id) then
            local k = S.estado(c.id)
            local oficios = {}
            for oficio, o in pairs(k.oficios or {}) do
                local p = K.persona(oficio, c.id, Motor.estado().memoria)
                local r = S.recadoActual(o, oficio)
                oficios[#oficios + 1] = { oficio = oficio, uid = o.uid, titulo = p.titulo, nombre = p.nombre[1] .. " " .. p.nombre[2],
                    recado = r ~= nil and r.corto or nil }
            end
            local falta = S.falta(c)
            lista[c.id] = { nivel = k.nivel or 0, salvados = k.salvados or 0, oficios = oficios, falta = falta,
                guardias = #(k.guardias or {}), max_guardias = S.MAX_GUARDIAS, ataque = k.ataque ~= nil,
                reservas = k.reservas,
                siguiente = K.NIVELES[(k.nivel or 0) + 1] ~= nil and K.NIVELES[(k.nivel or 0) + 1].oficio or nil }
        end
    end
    v.campamentos = lista
end

Motor.vistaExtra[#Motor.vistaExtra + 1] = S.vista
Motor.comandosPublicos.comprar = S.comprar
Motor.comandosPublicos.recadoComerciante = S.recado

if Events ~= nil and not S._enganchado then
    S._enganchado = true
    Events.EveryTenMinutes.Add(S.tick)
end

return S
