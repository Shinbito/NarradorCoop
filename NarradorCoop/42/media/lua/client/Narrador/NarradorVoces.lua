-- Narrador Co-op (cliente): voces de los personajes, por proximidad.
-- Cuando un personaje habla (Cliente.decir), suena su voz desde su cuerpo:
--   * cerca (V.CERCA casillas o menos): la frase clara.
--   * lejos (hasta la distancia de la opcion Narrador.VocesDistancia): la misma frase apagada,
--     como a traves de una pared. Se oye que hablan, no lo que dicen.
--   * frases sin audio (las que cambian en el juego, con lugares o nombres): un murmullo con la voz
--     de ese personaje (otra frase suya, apagada). Se puede apagar con Narrador.VocesMurmullos.
-- Si hablan varios a la vez se mezclan solos (cada voz sale de su cuerpo). Para que no se sature,
-- como mucho V.MAX voces a la vez: las mas lejanas se saltan primero.
-- Los audios y su indice los genera herramientas/voces/generar.py (NarradorVocesIndice.lua).
-- Textos sin tildes a proposito.

require "Narrador/NarradorCliente"
require "Narrador/NarradorVocesIndice"

local Cliente = Narrador.Cliente
local V = Narrador.Voces or {}
Narrador.Voces = V

V.CERCA = 8
V.LEJOS = 25
V.MAX = 6
V.MAX_MURMULLOS = 3
V.activas = V.activas or {} -- { uid, emisor, sonido, fin, lejos }

local function indice() return Narrador.VocesIndice or {} end

local function opcion(nombre, porDefecto)
    local sv = SandboxVars ~= nil and SandboxVars.Narrador or nil
    if sv == nil or sv[nombre] == nil then return porDefecto end
    return sv[nombre]
end

local function ahora()
    if getTimestampMs ~= nil then return getTimestampMs() end
    return os.time() * 1000
end

-- Voz de un personaje por como se llama en el juego: nombre completo, despues cada palabra
-- (Eduardo, Akagami...). nil si no se sabe.
function V.vozDe(nombre)
    local nombres = indice().nombres or {}
    if nombre == nil then return nil end
    nombre = tostring(nombre)
    if nombres[nombre] ~= nil then return nombres[nombre] end
    local quitado = string.gsub(nombre, "^%s+", "")
    quitado = string.gsub(quitado, "%s+$", "")
    if nombres[quitado] ~= nil then return nombres[quitado] end
    -- Nombre + apellido, despues el apellido y al final el nombre de pila.
    local palabras = {}
    for p in string.gmatch(quitado, "%S+") do palabras[#palabras + 1] = p end
    for i = #palabras, 1, -1 do
        if nombres[palabras[i]] ~= nil then return nombres[palabras[i]] end
    end
    return nil
end

-- Sonido para lo que se dijo: (id, es_la_frase). Si no hay audio de esa frase, otro de la misma
-- voz para el murmullo (es_la_frase = false).
function V.elegir(texto, voz)
    local ind = indice()
    local opciones = (ind.lineas or {})[tostring(texto)]
    if opciones ~= nil then
        for _, o in ipairs(opciones) do
            if voz == nil or o[1] == voz then return o[2], true end
        end
    end
    local suyas = voz ~= nil and (ind.porVoz or {})[voz] or nil
    if suyas ~= nil and #suyas > 0 then return suyas[ZombRand(#suyas) + 1], false end
    return nil, false
end

local function limpiar()
    local t = ahora()
    local quedan = {}
    for _, a in ipairs(V.activas) do
        if a.fin > t then quedan[#quedan + 1] = a end
    end
    V.activas = quedan
end

local function cuantas(soloMurmullos)
    local n = 0
    for _, a in ipairs(V.activas) do
        if not soloMurmullos or a.murmullo then n = n + 1 end
    end
    return n
end

-- Corta lo que estaba diciendo ese mismo personaje (no habla dos frases encima).
local function callar(uid)
    local quedan = {}
    for _, a in ipairs(V.activas) do
        if a.uid == uid then
            pcall(function() a.emisor:stopSound(a.sonido) end)
        else
            quedan[#quedan + 1] = a
        end
    end
    V.activas = quedan
end

local function emisorDe(cuerpo, x, y, z)
    if cuerpo ~= nil then
        local ok, e = pcall(function() return cuerpo:getEmitter() end)
        if ok and e ~= nil then return e end
    end
    if x ~= nil and getWorld ~= nil then
        local ok, e = pcall(function() return getWorld():getFreeEmitter(x, y, z or 0) end)
        if ok and e ~= nil then return e end
    end
    return nil
end

-- Lo que hace cuando alguien habla. Devuelve true si sono algo.
function V.alDecir(datos)
    if not opcion("Voces", true) then return false end
    local jugador = getPlayer()
    if jugador == nil or datos == nil or datos.texto == nil then return false end
    local cuerpo = Cliente.cuerpoDe ~= nil and Cliente.cuerpoDe(datos.uid) or nil
    local x, y, z = datos.x, datos.y, 0
    if cuerpo ~= nil then x, y, z = cuerpo:getX(), cuerpo:getY(), cuerpo:getZ() end
    if x == nil or y == nil then return false end
    local d = math.sqrt((jugador:getX() - x) ^ 2 + (jugador:getY() - y) ^ 2)
    local lejos = tonumber(opcion("VocesDistancia", V.LEJOS)) or V.LEJOS
    if d > lejos then return false end

    local voz = V.vozDe(datos.nombre)
    local id, esLaFrase = V.elegir(datos.texto, voz)
    if id == nil then return false end
    local murmullo = not esLaFrase
    if murmullo and not opcion("VocesMurmullos", true) then return false end
    local apagada = murmullo or d > V.CERCA

    limpiar()
    callar(tostring(datos.uid))
    if cuantas(false) >= V.MAX and apagada then return false end
    if murmullo and cuantas(true) >= V.MAX_MURMULLOS then return false end

    local emisor = emisorDe(cuerpo, x, y, z)
    if emisor == nil then return false end
    local sonido = "NarradorVoz_" .. id .. (apagada and "_lejos" or "")
    local ok, h = pcall(function() return emisor:playSound(sonido) end)
    if not ok or h == nil then return false end
    local seg = ((indice().duracion or {})[id] or 4)
    -- El murmullo de una frase sin audio dura lo que dura el texto, mas o menos.
    if murmullo then
        local porTexto = string.len(tostring(datos.texto)) / 14
        if porTexto < seg then
            seg = math.max(1.5, porTexto)
        end
    end
    V.activas[#V.activas + 1] = { uid = tostring(datos.uid), emisor = emisor, sonido = h, fin = ahora() + seg * 1000,
        murmullo = murmullo }
    if murmullo and seg < ((indice().duracion or {})[id] or 4) then
        -- Cortarlo cuando termina "su" frase.
        V.porCortar = V.porCortar or {}
        V.porCortar[#V.porCortar + 1] = { emisor = emisor, sonido = h, fin = ahora() + seg * 1000 }
    end
    return true
end

function V.tick()
    if V.porCortar == nil or #V.porCortar == 0 then return end
    local t = ahora()
    local quedan = {}
    for _, c in ipairs(V.porCortar) do
        if c.fin <= t then
            pcall(function() c.emisor:stopSound(c.sonido) end)
        else
            quedan[#quedan + 1] = c
        end
    end
    V.porCortar = quedan
end

-- Engancha Cliente.decir: primero la voz, despues la burbuja de siempre.
if Cliente ~= nil and not V._enganchado and type(Cliente.decir) == "function" then
    V._enganchado = true
    local decir = Cliente.decir
    Cliente.decir = function(datos)
        pcall(V.alDecir, datos)
        return decir(datos)
    end
    if Events ~= nil and Events.OnTick ~= nil then Events.OnTick.Add(V.tick) end
end

return V
