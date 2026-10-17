-- Narrador Co-op (cliente): mapas del mod y menu de favores de Sous.
--
-- Mapas: todos los mapas del Narrador usan el MapID "NarradorMapa". La zona que muestran y
-- sus marcas vienen guardadas en el propio item (modData.NarradorMapa = { zona, marcas, logo }).
-- Las marcas se dibujan al abrir el mapa y no se duplican si lo abres de nuevo.
-- Textos sin tildes a proposito.

require "ISUI/Maps/ISMap"
require "ISUI/Maps/ISMapDefinitions"
require "Narrador/NarradorDefs"
require "Narrador/NarradorObjetos"

Narrador = Narrador or {}
local M = Narrador.Mapas or {}
Narrador.Mapas = M

local floor = math.floor

local function datosDe(item)
    if item == nil then return nil end
    local ok, md = pcall(function() return item:getModData().NarradorMapa end)
    if ok and type(md) == "table" then return md end
    return nil
end

-- Imagen encima del mapa (como las insignias de los mapas del juego).
local function imagenEncima(mapUI, x, y, escala, capa, ruta)
    local tex = getTexture(ruta)
    if tex == nil then return end
    local api = mapUI.javaObject:getAPIv1()
    local estilo = api:getStyleAPI()
    local layer = estilo:newTextureLayer(capa)
    layer:setMinZoom(0)
    layer:addFill(0, 255, 255, 255, 255)
    layer:addTexture(0, ruta)
    layer:setBoundsInSquares(x, y, x + tex:getWidth() * escala, y + tex:getHeight() * escala)
end

function M.iniciarMapa(mapUI)
    local api = mapUI.javaObject:getAPIv1()
    MapUtils.initDirectoryMapData(mapUI, LootMaps.DEFAULT_MAP_DIRECTORY or "media/maps/Muldraugh, KY")
    MapUtils.initDefaultStyleV3(mapUI)
    local item = mapUI.mapItem or mapUI.mapObj
    local md = datosDe(item)
    local z = md ~= nil and md.zona or nil
    if type(z) ~= "table" or tonumber(z.x1) == nil then
        local j = getPlayer()
        local x, y = j ~= nil and j:getX() or 10900, j ~= nil and j:getY() or 9800
        z = { x1 = x - 200, y1 = y - 160, x2 = x + 200, y2 = y + 160 }
    end
    api:setBoundsInSquares(z.x1, z.y1, z.x2, z.y2)
    if md ~= nil and md.logo then
        local ancho = (z.x2 - z.x1) * 0.16
        imagenEncima(mapUI, z.x1 + (z.x2 - z.x1) * 0.02, z.y1 + (z.y2 - z.y1) * 0.02, ancho / 160, "narrador_insignia",
            "media/textures/Narrador/Mapas/InsigniaSous.png")
    end
    MapUtils.overlayPaper(mapUI)
end

if LootMaps ~= nil and LootMaps.Init ~= nil then
    LootMaps.Init.NarradorMapa = M.iniciarMapa
end

-- API de simbolos del mapa abierto. El mapa del mundo usa getSymbolsAPI (y ese funciona);
-- antes aca se pedia solo getSymbolsAPIv2, que no siempre existe, y por eso el mapa del
-- misionero salia sin anotaciones.
local function apiSimbolos(mapUI)
    local mapAPI = mapUI.mapAPI
    if mapAPI == nil then pcall(function() mapAPI = mapUI.javaObject:getAPIv1() end) end
    if mapAPI == nil then return nil end
    -- Se mira si el metodo existe antes de llamarlo: llamar uno que no existe tira una
    -- excepcion que el juego vuelca entera al log en cada intento.
    for _, nombre in ipairs({ "getSymbolsAPIv2", "getSymbolsAPI" }) do
        local metodo = mapAPI[nombre]
        if metodo ~= nil then
            local ok, api = pcall(metodo, mapAPI)
            if ok and api ~= nil then return api end
        end
    end
    return nil
end

-- Segundo argumento de addUntranslatedText. La API v2 pide el id de una capa de texto; la
-- v1 (la de los mapas de papel, ISMap) pide una UIFont. Nunca devuelve nil: un texto sin
-- fuente revienta el dibujo del mapa en Java y cierra el juego.
local function fuenteTexto(api)
    if api.getDefaultTextLayerID ~= nil then
        local ok, capa = pcall(api.getDefaultTextLayerID, api)
        if ok and capa ~= nil then return capa end
    end
    if UIFont ~= nil then return UIFont.Handwritten or UIFont.Small end
    return nil
end

-- Dibuja las marcas guardadas en el item (sin duplicar las que ya esten). Devuelve true si
-- pudo dibujar.
function M.ponerMarcas(mapUI)
    local item = mapUI.mapObj or mapUI.mapItem
    local md = datosDe(item)
    if md == nil or type(md.marcas) ~= "table" then return true end
    local api = apiSimbolos(mapUI)
    if api == nil then return false end
    local ya = {}
    pcall(function()
        for i = 0, api:getSymbolCount() - 1 do
            local s = api:getSymbolByIndex(i)
            if s ~= nil then
                local tipo = s:isText() and "t" or "s"
                ya[tipo .. floor(s:getWorldX()) .. "," .. floor(s:getWorldY())] = true
            end
        end
    end)
    local escala = ISMap ~= nil and ISMap.SCALE or 0.666
    local capaTexto = fuenteTexto(api)
    -- separacion del texto respecto del simbolo, proporcional al tamano del mapa
    local z = md.zona or {}
    local sep = math.max(4, floor(((tonumber(z.x2) or 300) - (tonumber(z.x1) or 0)) / 45))
    for _, m in ipairs(md.marcas) do
        local x, y = tonumber(m.x), tonumber(m.y)
        if x ~= nil and y ~= nil then
            local simbolo = m.s == nil and "Circle" or tostring(m.s)
            if simbolo ~= "" and not ya["s" .. floor(x) .. "," .. floor(y)] then
                pcall(function()
                    local s = api:addTexture(simbolo, x, y)
                    s:setRGBA(m.r or 0.75, m.g or 0.1, m.b or 0.1, 1.0)
                    s:setAnchor(0.5, 0.5)
                    s:setScale(escala * (tonumber(m.e) or 1))
                end)
            end
            -- el texto va al lado del simbolo; si no hay simbolo, justo en el punto
            local tx, ty = floor(x + sep), floor(y - sep)
            if simbolo == "" then tx, ty = floor(x), floor(y) end
            if capaTexto ~= nil and m.t ~= nil and m.t ~= "" and not ya["t" .. tx .. "," .. ty] then
                pcall(function()
                    local s = api:addUntranslatedText(tostring(m.t), capaTexto, tx, ty)
                    s:setRGBA(m.r or 0.75, m.g or 0.1, m.b or 0.1, 1.0)
                    s:setAnchor(0.0, 0.5)
                    s:setScale(escala)
                end)
            end
        end
    end
    return true
end

-- Las marcas se ponen la primera vez que el mapa se dibuja (para entonces el mapa ya esta
-- armado), y ademas despues de initMapData si esa funcion existe en esta version.
function M.engancharISMap()
    if ISMap == nil or M._enganchado then return end
    M._enganchado = true
    if type(ISMap.initMapData) == "function" then
        local original = ISMap.initMapData
        ISMap.initMapData = function(self, ...)
            local r = original(self, ...)
            local ok, listo = pcall(M.ponerMarcas, self)
            if ok and listo then self._narradorMarcas = true end
            return r
        end
    end
    local render = ISMap.render
    ISMap.render = function(self, ...)
        if not self._narradorMarcas then
            local ok, listo = pcall(M.ponerMarcas, self)
            if ok and listo then self._narradorMarcas = true end
        end
        if render ~= nil then return render(self, ...) end
    end
end

function M.enganchar() M.engancharISMap() end
M.enganchar()

-- ---------------------------------------------------------------------------
-- Favores de Sous: "Preguntarle a X si necesita algo"
-- ---------------------------------------------------------------------------

function M.pedirFavor(rol)
    local jugador = getPlayer()
    if jugador == nil then return end
    if isClient() then
        sendClientCommand(jugador, "NarradorObjetos", "pedirFavor", { rol = rol })
    elseif Narrador.ObjetosServer ~= nil then
        Narrador.ObjetosServer.alComando("NarradorObjetos", "pedirFavor", jugador, { rol = rol })
    end
end

function M.menu(numJugador, context, worldobjects, test)
    if test then return end
    local jugador = getSpecificPlayer(numJugador)
    local Cliente = Narrador.Cliente
    local estado = Cliente ~= nil and Cliente.estado or nil
    if jugador == nil or estado == nil or type(estado.favores) ~= "table" then return end
    for _, f in ipairs(estado.favores) do
        local cerca = false
        if f.uid ~= nil and Cliente.cuerpoDe ~= nil then
            local cuerpo = Cliente.cuerpoDe(f.uid)
            if cuerpo ~= nil and math.sqrt((cuerpo:getX() - jugador:getX()) ^ 2 + (cuerpo:getY() - jugador:getY()) ^ 2) <= 6 then
                cerca = true
            end
        end
        if not cerca and f.bx ~= nil and math.sqrt((f.bx - jugador:getX()) ^ 2 + (f.by - jugador:getY()) ^ 2) <= 25 then
            cerca = true
        end
        if cerca then
            local rol = f.rol
            context:addOption("[Sous] Preguntarle a " .. tostring(f.corto) .. " si necesita algo", nil, function()
                M.pedirFavor(rol)
            end)
        end
    end
end

if Events ~= nil and not M._menu then
    M._menu = true
    Events.OnFillWorldObjectContextMenu.Add(M.menu)
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(M.enganchar) end
end

return M
