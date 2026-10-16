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
    return e.campamento
end

local function avisarTodos(texto)
    for _, p in ipairs(Mundo.jugadores()) do Motor.enviar(p, "aviso", { texto = texto }) end
end

local function anotar(texto)
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = texto, arco = "Campamentos" }
    while #st.diario > (Motor.MAX_DIARIO_GLOBAL or 60) do table.remove(st.diario, 1) end
end

-- Una persona salvada llego al campamento.
function S.sumarSalvado(contactoId)
    local k = S.estado(contactoId)
    k.salvados = (k.salvados or 0) + 1
    pcall(S.revisar, C.def(contactoId), C.estado(contactoId))
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
    local p = K.persona(req.oficio, c.id)
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
    local p = K.persona(oficio, c.id)
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
        if not instanceof(it, "Clothing") then return false end
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
    if R == nil or not R.activa() then return 1 end
    return R.nivel(R.valor(Mundo.grupoDe(jugador), contactoId))
end

-- Mejora el arma que el jugador tiene en la mano (la deja "excepcional").
local function mejorar(jugador)
    local L = Narrador.Legendario
    local arma
    pcall(function() arma = jugador:getPrimaryHandItem() end)
    local esArma = false
    pcall(function() esArma = arma ~= nil and instanceof(arma, "HandWeapon") end)
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
    local nivel = S.nivelConfianza(jugador, c.id)
    if art.confianza ~= nil and nivel < art.confianza then
        Motor.responder(jugador, "Eso no te lo vendo todavia. Primero que " .. c.nombre .. " te tenga mas confianza.")
        return
    end
    local precio = K.precio(art, c.id, moneda, nivel)
    local tiene, sacar = S.juntar(jugador, moneda, precio)
    if tiene < precio then
        Motor.responder(jugador, "Te faltan: cuesta " .. precio .. " de " .. moneda .. " y llevas " .. tiene .. ".")
        return
    end
    local p = K.persona(oficio, c.id)
    if art.servicio == "mejorar" then
        local ok, razon = mejorar(jugador)
        if not ok then Motor.responder(jugador, p.nombre[1] .. ": " .. tostring(razon)); return end
    elseif art.servicio == "auto" then
        local L = Narrador.Legendario
        local ok = L ~= nil and L.crearAuto(px + 4, py + 4, 0)
        if not ok then Motor.responder(jugador, p.nombre[1] .. ": No hay espacio aca para dejartelo. Busca una calle despejada."); return end
    end
    for _, par in ipairs(sacar) do Mundo.quitarItem(par[2], par[1]) end
    for _, tipos in ipairs(art.items or {}) do
        local item = Mundo.crearItem(tipos)
        if item ~= nil then Mundo.darItem(jugador, item) end
    end
    Motor.enviar(jugador, "aviso", { texto = p.nombre[1] .. " te vende: " .. art.texto .. " (" .. precio .. " de " .. moneda .. ")." })
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
                local p = K.persona(oficio, c.id)
                oficios[#oficios + 1] = { oficio = oficio, uid = o.uid, titulo = p.titulo, nombre = p.nombre[1] .. " " .. p.nombre[2] }
            end
            local falta = S.falta(c)
            lista[c.id] = { nivel = k.nivel or 0, salvados = k.salvados or 0, oficios = oficios, falta = falta,
                siguiente = K.NIVELES[(k.nivel or 0) + 1] ~= nil and K.NIVELES[(k.nivel or 0) + 1].oficio or nil }
        end
    end
    v.campamentos = lista
end

Motor.vistaExtra[#Motor.vistaExtra + 1] = S.vista
Motor.comandosPublicos.comprar = S.comprar

if Events ~= nil and not S._enganchado then
    S._enganchado = true
    Events.EveryTenMinutes.Add(S.tick)
end

return S
