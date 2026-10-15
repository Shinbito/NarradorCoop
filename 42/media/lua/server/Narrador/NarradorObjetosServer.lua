-- Narrador Co-op (servidor): mapas anotados, poster de Sous y favores de Sous.
--
-- Agrega al motor, sin tocar sus archivos:
--   accion diferida     "poster" (cuelga el poster de Sous en una pared de la base)
--   accion inmediata    "prestar_residente" (un residente de Sous participa en un arco sin
--                       que el arco lo retire al terminar)
--   comando de cliente  NarradorObjetos / pedirFavor
-- y hace que los mapas con zona del motor sean mapas del mod (muestran justo la zona y las
-- marcas se dibujan bien en B42; ver client/Narrador/NarradorMapas.lua).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorObjetos"
require "Narrador/Arcos/FavoresSous"

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor
local O, F, C = Narrador.Objetos, Narrador.Favores, Narrador.Contactos
local floor = math.floor

local S = Narrador.ObjetosServer or {}
Narrador.ObjetosServer = S
S.MODULO = "NarradorObjetos"

-- ---------------------------------------------------------------------------
-- Mapas
-- ---------------------------------------------------------------------------

-- Zona del mapa: todas las marcas con margen, y un minimo para que se entienda el entorno.
function S.zona(marcas, margen, minimo)
    margen, minimo = margen or 90, minimo or 260
    local x1, y1, x2, y2
    for _, m in ipairs(marcas) do
        x1 = x1 == nil and m.x or math.min(x1, m.x)
        y1 = y1 == nil and m.y or math.min(y1, m.y)
        x2 = x2 == nil and m.x or math.max(x2, m.x)
        y2 = y2 == nil and m.y or math.max(y2, m.y)
    end
    if x1 == nil then return nil end
    x1, y1, x2, y2 = x1 - margen, y1 - margen, x2 + margen, y2 + margen
    local w, h = x2 - x1, y2 - y1
    -- un poco mas ancho que alto, como los mapas del juego
    local lado = math.max(minimo, w, h)
    local cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    local mw, mh = math.max(lado, w), math.max(lado * 0.8, h)
    return { x1 = floor(cx - mw / 2), y1 = floor(cy - mh / 2), x2 = floor(cx + mw / 2), y2 = floor(cy + mh / 2) }
end

-- marcas: { { x, y, simbolo, texto, r, g, b } }. Devuelve el item o nil.
function S.crearMapa(tipos, titulo, marcas, logo)
    local mapa = Mundo.crearItem(tipos)
    if mapa == nil then return nil end
    if titulo ~= nil then Mundo.nombrar(mapa, titulo, nil) end
    local limpias = {}
    for _, m in ipairs(marcas or {}) do
        if tonumber(m.x) ~= nil and tonumber(m.y) ~= nil then
            limpias[#limpias + 1] = { x = floor(m.x), y = floor(m.y), s = m.simbolo or m.s or "Circle",
                t = m.texto or m.t, r = m.r or 0.75, g = m.g or 0.1, b = m.b or 0.1, e = m.e }
        end
    end
    local zona = S.zona(limpias)
    pcall(function()
        mapa:getModData().NarradorMapa = { zona = zona, marcas = limpias, logo = logo == true }
    end)
    return mapa
end

-- Reemplaza el mapa de los encargos: ahora es un mapa del mod que muestra justo la zona.
Mundo.crearMapaVanilla = Mundo.crearMapaVanilla or Mundo.crearMapa
function Mundo.crearMapa(nombre, x, y, marcas)
    local lista = {}
    for _, m in ipairs(marcas or {}) do lista[#lista + 1] = m end
    local mapa = S.crearMapa({ "Narrador.MapaMisionero" }, nombre, lista, false)
    if mapa ~= nil then return mapa end
    return Mundo.crearMapaVanilla(nombre, x, y, marcas)
end

-- Mapas con ZONA (los que da el motor al entrar a una etapa y los de los misioneros):
-- mismo dibujo que pensaba el motor (circulo de puntos + texto + marcas extra), pero en un
-- mapa del mod que muestra justo esa zona y se dibuja bien en B42.
-- Si el titulo, el texto o alguna marca habla de Sous, el mapa lleva el fenix de Sous.
Mundo.crearMapaZonaVanilla = Mundo.crearMapaZonaVanilla or Mundo.crearMapaZona
function Mundo.crearMapaZona(titulo, zona, texto, extras)
    if type(zona) ~= "table" or tonumber(zona.x) == nil then
        return Mundo.crearMapaZonaVanilla ~= nil and Mundo.crearMapaZonaVanilla(titulo, zona, texto, extras) or nil
    end
    local r = tonumber(zona.r) or 70
    local marcas = {}
    local pasos = 20
    for i = 0, pasos - 1 do
        local ang = (i / pasos) * 2 * math.pi
        marcas[#marcas + 1] = { x = zona.x + math.cos(ang) * r, y = zona.y + math.sin(ang) * r, simbolo = "Circle",
            e = 0.45, r = 0.8, g = 0.1, b = 0.1 }
    end
    -- el texto va arriba del circulo, sin simbolo
    marcas[#marcas + 1] = { x = zona.x - r, y = zona.y - r - 12, simbolo = "", texto = texto or "Por aca", r = 0.8, g = 0.1, b = 0.1 }
    local logo = string.find(tostring(titulo) .. " " .. tostring(texto), "Sous", 1, true) ~= nil
    for _, m in ipairs(extras or {}) do
        marcas[#marcas + 1] = { x = m.x, y = m.y, simbolo = m.simbolo or "House", texto = m.texto,
            r = m.r or 0.1, g = m.g or 0.4, b = m.b or 0.9 }
        if m.simbolo == O.SIMBOLO_SOUS or string.find(tostring(m.texto), "Sous", 1, true) ~= nil then logo = true end
    end
    local mapa = S.crearMapa({ "Narrador.MapaMisionero" }, titulo, marcas, logo)
    if mapa ~= nil then return mapa end
    return Mundo.crearMapaZonaVanilla ~= nil and Mundo.crearMapaZonaVanilla(titulo, zona, texto, extras) or nil
end

-- Accion inmediata "mapa_con_marcas": como "mapa" del motor (zona del lugar, a cada jugador),
-- pero con marcas extra tomadas de otros lugares del arco y un texto propio.
--   { "mapa_con_marcas", lugar = id, titulo, texto, marcas = { { lugar = id, simbolo, texto, r, g, b } } }
Motor.inmediatas.mapa_con_marcas = function(inst, a)
    local extras = {}
    for _, m in ipairs(a.marcas or {}) do
        local l = inst.lugares[m.lugar]
        if l ~= nil then
            extras[#extras + 1] = { x = l.x, y = l.y, simbolo = m.simbolo, texto = Motor.texto(inst, m.texto or ""),
                r = m.r, g = m.g, b = m.b }
        end
    end
    if a.texto ~= nil then
        -- el motor pone "Por aca: <lugar>"; aca va el texto del personaje
        local original = Mundo.crearMapaZona
        Mundo.crearMapaZona = function(titulo, zona, _, ex) return original(titulo, zona, Motor.texto(inst, a.texto), ex) end
        local ok, err = pcall(Motor.darMapaZona, inst, a.lugar, { titulo = a.titulo, extras = extras })
        Mundo.crearMapaZona = original
        if not ok then Mundo.log("mapa_con_marcas: " .. tostring(err)) end
        return true
    end
    Motor.darMapaZona(inst, a.lugar, { titulo = a.titulo, extras = extras })
    return true
end

-- ---------------------------------------------------------------------------
-- Poster de Sous
-- ---------------------------------------------------------------------------

-- Busca una casilla con pared al norte o al oeste, ojala dentro de una sala, cerca del punto.
function S.casillaConPared(x, y, z, radio)
    local mejor, mejorD, norte
    for dx = -radio, radio do
        for dy = -radio, radio do
            local sq = Mundo.cargado(x + dx, y + dy, z)
            if sq ~= nil then
                local okN, paredN = pcall(function() return sq:getWall(true) end)
                local okO, paredO = pcall(function() return sq:getWall(false) end)
                local tieneN = okN and paredN ~= nil
                local tieneO = okO and paredO ~= nil
                if tieneN or tieneO then
                    local okS, sala = pcall(function() return sq:getRoom() end)
                    local okF, libre = pcall(function() return sq:isFree(false) end)
                    local d = math.sqrt(dx * dx + dy * dy) + ((okS and sala ~= nil) and 0 or 50) + ((okF and libre) and 0 or 20)
                    if mejorD == nil or d < mejorD then mejor, mejorD, norte = sq, d, tieneN end
                end
            end
        end
    end
    return mejor, norte
end

Motor.diferidas.poster = function(inst, p, l)
    local st = Motor.estado()
    if st.memoria.poster_sous == true then return true end
    local item = Mundo.crearItem({ "Narrador.PosterSous" })
    if item == nil then return true end
    local sq, norte = S.casillaConPared(floor(l.x), floor(l.y), floor(l.z or 0), 8)
    if sq == nil then
        if Mundo.dejarEnSuelo(l.x, l.y, l.z, item) then st.memoria.poster_sous = true end
        return true
    end
    local ok = pcall(function()
        -- Pared norte: el poster mira al sur (rotacion 0). Pared oeste: mira al este (90).
        pcall(function() item:setWorldZRotation(norte and 0 or 90) end)
        if norte then
            sq:AddWorldInventoryItem(item, 0.5, 0.04, 0)
        else
            sq:AddWorldInventoryItem(item, 0.04, 0.5, 0)
        end
    end)
    if ok then st.memoria.poster_sous = true end
    return ok
end

-- ---------------------------------------------------------------------------
-- Residentes prestados a un arco (favores)
-- ---------------------------------------------------------------------------

Motor.inmediatas.prestar_residente = function(inst, a)
    local r = Motor.estado().residentes[a.residente or "sous"]
    if r == nil then return true end
    for uid, m in pairs(r.miembros or {}) do
        if m.rol == a.rol and not m.muerto then
            inst.grupos[a.grupo] = {
                estado = "listo", prestado = true, intentos = 0,
                miembros = { [uid] = { rol = m.rol, nombre = m.nombre, vivo = true } },
                roles = { [m.rol] = uid },
                nombres = { [m.rol] = { m.nombre, m.apellido } },
                rolPorPerfil = {}, femeninos = {},
            }
            return true
        end
    end
    return true
end

-- Un grupo prestado nunca se retira: el personaje sigue viviendo en su base.
if not S._retiroEnvuelto then
    S._retiroEnvuelto = true
    local retirarOriginal = Motor.retirarGrupo
    Motor.retirarGrupo = function(inst, id)
        local g = inst ~= nil and inst.grupos ~= nil and inst.grupos[id] or nil
        if g ~= nil and g.prestado then return end
        return retirarOriginal(inst, id)
    end
end

-- ---------------------------------------------------------------------------
-- Favores: lista para los clientes y pedido desde el menu
-- ---------------------------------------------------------------------------

function S.favoresDisponibles()
    local lista = {}
    if F == nil then return lista end
    local base = Motor.estado().memoria["lugar.base_sous"]
    for _, f in ipairs(F.LISTA) do
        if F.disponible(f.rol) then
            local uid = F.residente(f.rol)
            lista[#lista + 1] = { rol = f.rol, nombre = f.nombre, corto = f.corto, uid = uid,
                bx = type(base) == "table" and base.x or nil, by = type(base) == "table" and base.y or nil }
        end
    end
    return lista
end

if not S._vistaEnvuelta then
    S._vistaEnvuelta = true
    local vistaOriginal = Motor.vista
    Motor.vista = function(...)
        local v = vistaOriginal(...)
        local ok, favores = pcall(S.favoresDisponibles)
        if type(v) == "table" then v.favores = ok and favores or {} end
        return v
    end
end

function S.pedirFavor(jugador, rol)
    rol = tostring(rol)
    local f = F ~= nil and F.def(rol) or nil
    if f == nil then return end
    if not F.disponible(rol) then
        Motor.responder(jugador, "Eso ya no esta disponible.")
        Motor.publicar(jugador)
        return
    end
    -- Hay que estar cerca de el o en la base.
    local px, py = Mundo.posicion(jugador)
    local uid = F.residente(rol)
    local cerca = false
    local x, y = Mundo.posicionActor(uid)
    if px ~= nil and x ~= nil and math.sqrt((x - px) ^ 2 + (y - py) ^ 2) <= 10 then cerca = true end
    local base = Motor.estado().memoria["lugar.base_sous"]
    if not cerca and px ~= nil and type(base) == "table" and math.sqrt((base.x - px) ^ 2 + (base.y - py) ^ 2) <= 45 then
        cerca = true
    end
    if not cerca then
        Motor.responder(jugador, "Estas muy lejos.")
        return
    end
    local inst, razon = Motor.iniciar(F.idDe(rol), jugador)
    if inst == nil then
        Motor.responder(jugador, "No se pudo: " .. tostring(razon))
    end
end

function S.alComando(modulo, comando, jugador, args)
    if modulo ~= S.MODULO then return end
    args = args or {}
    if comando == "pedirFavor" then S.pedirFavor(jugador, args.rol) end
end

if Events ~= nil and not S._enganchado then
    S._enganchado = true
    Events.OnClientCommand.Add(S.alComando)
end

return S
