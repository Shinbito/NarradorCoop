-- Narrador Co-op: todo lo que toca el mundo del juego.
-- El motor no llama nunca a la API del juego directo; pasa por aca. Asi se puede
-- probar el motor fuera del juego reemplazando estas funciones.

Narrador = Narrador or {}
local Mundo = Narrador.Mundo or {}
Narrador.Mundo = Mundo

local floor = math.floor

-- La parte de Project A-Life esta en NarradorMundoALife.lua (se carga al final de este archivo).
Mundo._partes = Mundo._partes or {}

-- ---------------------------------------------------------------------------
-- Basicos
-- ---------------------------------------------------------------------------

function Mundo.horas()
    if getGameTime == nil then return 0 end
    local ok, horas = pcall(function() return getGameTime():getWorldAgeHours() end)
    return ok and tonumber(horas) or 0
end

-- Entero al azar entre 1 y n.
function Mundo.azar(n)
    n = floor(tonumber(n) or 1)
    if n <= 1 then return 1 end
    if ZombRand ~= nil then return ZombRand(n) + 1 end
    return math.random(n)
end

function Mundo.sandbox(nombre, porDefecto)
    if SandboxVars ~= nil and type(SandboxVars.Narrador) == "table" then
        local valor = SandboxVars.Narrador[nombre]
        if valor ~= nil then return valor end
    end
    return porDefecto
end

function Mundo.esServidor()
    return isServer ~= nil and isServer() == true
end

function Mundo.esCliente()
    return isClient ~= nil and isClient() == true
end

function Mundo.log(texto)
    print("[Narrador] " .. tostring(texto))
end

-- ---------------------------------------------------------------------------
-- Jugadores
-- ---------------------------------------------------------------------------

function Mundo.jugadores()
    local lista = {}
    if Mundo.esServidor() then
        local online = getOnlinePlayers ~= nil and getOnlinePlayers() or nil
        if online ~= nil then
            for i = 0, online:size() - 1 do
                local p = online:get(i)
                if p ~= nil then lista[#lista + 1] = p end
            end
        end
        return lista
    end
    -- Un jugador o pantalla dividida.
    local cuantos = getNumActivePlayers ~= nil and getNumActivePlayers() or 1
    for i = 0, cuantos - 1 do
        local p = getSpecificPlayer ~= nil and getSpecificPlayer(i) or nil
        if p ~= nil then lista[#lista + 1] = p end
    end
    return lista
end

function Mundo.posicion(jugador)
    if jugador == nil then return nil end
    local ok, x, y, z = pcall(function() return jugador:getX(), jugador:getY(), jugador:getZ() end)
    if not ok then return nil end
    return x, y, z
end

function Mundo.nombreJugador(jugador)
    if jugador == nil then return "?" end
    local ok, nombre = pcall(function() return jugador:getUsername() end)
    if ok and nombre ~= nil and nombre ~= "" then return tostring(nombre) end
    ok, nombre = pcall(function() return jugador:getDisplayName() end)
    if ok and nombre ~= nil then return tostring(nombre) end
    return "jugador"
end

function Mundo.vivo(jugador)
    local ok, muerto = pcall(function() return jugador:isDead() end)
    return ok and muerto ~= true
end

function Mundo.esAdmin(jugador)
    if not Mundo.esServidor() then return true end
    if jugador == nil then return false end
    local ok, nivel = pcall(function() return jugador:getAccessLevel() end)
    return ok and string.lower(tostring(nivel or "")) == "admin"
end

-- Jugador vivo mas cercano dentro del radio, o nil.
function Mundo.jugadorCerca(x, y, radio)
    local mejor, mejorD = nil, nil
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.vivo(p) then
            local px, py = Mundo.posicion(p)
            if px ~= nil then
                local d = math.sqrt((px - x) ^ 2 + (py - y) ^ 2)
                if d <= radio and (mejorD == nil or d < mejorD) then mejor, mejorD = p, d end
            end
        end
    end
    return mejor, mejorD
end

function Mundo.jugadorAlAzar()
    local vivos = {}
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.vivo(p) then vivos[#vivos + 1] = p end
    end
    if #vivos == 0 then return nil end
    return vivos[Mundo.azar(#vivos)]
end

-- La casilla si esta cargada en memoria, si no nil.
function Mundo.cargado(x, y, z)
    if getCell == nil then return nil end
    local ok, sq = pcall(function() return getCell():getGridSquare(floor(x), floor(y), floor(z or 0)) end)
    if ok then return sq end
    return nil
end

-- ---------------------------------------------------------------------------
-- Pueblos y descripcion de lugares
-- ---------------------------------------------------------------------------

Mundo.pueblos = {
    { label = "Brandenburg", minX = 1064, maxX = 3564, minY = 5003, maxY = 7503 },
    { label = "Echo Creek", minX = 3185, maxX = 5285, minY = 10019, maxY = 12119 },
    { label = "Ekron", minX = -30, maxX = 2070, minY = 8788, maxY = 10888 },
    { label = "Fallas Lake", minX = 6298, maxX = 8398, minY = 7321, maxY = 9421 },
    { label = "Irvington", minX = 1479, maxX = 3979, minY = 12547, maxY = 15047 },
    { label = "Louisville", minX = 11700, maxX = 14699, minY = 900, maxY = 3899 },
    { label = "March Ridge", minX = 8721, maxX = 11121, minY = 11403, maxY = 13803 },
    { label = "Muldraugh", minX = 9631, maxX = 12731, minY = 8175, maxY = 11275 },
    { label = "Riverside", minX = 4950, maxX = 7650, minY = 4318, maxY = 7018 },
    { label = "Rosewood", minX = 7246, maxX = 9646, minY = 10356, maxY = 12756 },
    { label = "Valley Station", minX = 11656, maxX = 14456, minY = 4631, maxY = 7431 },
    { label = "West Point", minX = 10181, maxX = 12981, minY = 5516, maxY = 8316 },
}

local function centro(p)
    return (p.minX + p.maxX) / 2, (p.minY + p.maxY) / 2
end

function Mundo.puebloCercano(x, y)
    local mejor, mejorD = nil, nil
    for _, p in ipairs(Mundo.pueblos) do
        local cx, cy = centro(p)
        local d = math.sqrt((x - cx) ^ 2 + (y - cy) ^ 2)
        if mejorD == nil or d < mejorD then mejor, mejorD = p, d end
    end
    return mejor, mejorD
end

-- Nombre en castellano para cada tipo de sala del mapa.
Mundo.nombresSala = {
    church = "la iglesia",
    laboratory = "el laboratorio",
    medical = "la clinica",
    medicaloffice = "la consulta medica",
    medicalstorage = "la bodega de la clinica",
    hospitalroom = "el hospital",
    hospitalhallway = "el hospital",
    hospitalstorage = "el hospital",
    pharmacy = "la farmacia",
    pharmacystorage = "la farmacia",
    warehouse = "la bodega",
    storageunit = "las bodegas de arriendo",
    factorystorage = "la fabrica",
    policestorage = "la comisaria",
    policeoffice = "la comisaria",
    gunstore = "la armeria",
    gunstorestorage = "la armeria",
    livingroom = "una casa",
    bedroom = "una casa",
    kitchen = "una casa",
    motelroom = "el motel",
    classroom = "la escuela",
    grocery = "el almacen",
    gasstore = "la gasolinera",
    grocerystorage = "el almacen",
    armystorage = "la base militar",
    armytent = "el campamento militar",
    firestorage = "el cuartel de bomberos",
    firegarage = "el cuartel de bomberos",
    policehall = "la comisaria",
    farmstorage = "la granja",
    barn = "el granero",
    office = "la oficina",
    garagestorage = "el taller",
    storage = "la bodega",
}

function Mundo.describir(x, y, sala, nombre)
    local cosa = nombre or Mundo.nombresSala[tostring(sala)] or "un edificio"
    local pueblo = Mundo.puebloCercano(x, y)
    if pueblo == nil then return cosa end
    local dentro = x >= pueblo.minX and x <= pueblo.maxX and y >= pueblo.minY and y <= pueblo.maxY
    if not dentro then return cosa .. " en las afueras de " .. pueblo.label end
    local cx, cy = centro(pueblo)
    local dx, dy = x - cx, y - cy
    if math.sqrt(dx * dx + dy * dy) < 250 then return cosa .. " del centro de " .. pueblo.label end
    local lado
    if math.abs(dx) > math.abs(dy) * 1.5 then
        lado = dx > 0 and "este" or "oeste"
    elseif math.abs(dy) > math.abs(dx) * 1.5 then
        lado = dy > 0 and "sur" or "norte"
    else
        lado = (dy > 0 and "sur" or "norte") .. (dx > 0 and "este" or "oeste")
    end
    return cosa .. " del lado " .. lado .. " de " .. pueblo.label
end

-- ---------------------------------------------------------------------------
-- Busqueda de lugares reales del mapa
-- ---------------------------------------------------------------------------

-- "church" calza exacto; "hospital*" calza cualquier sala que contenga "hospital".
local function calza(nombreSala, buscadas)
    for _, b in ipairs(buscadas) do
        if string.sub(b, -1) == "*" then
            if string.find(nombreSala, string.sub(b, 1, -2), 1, true) ~= nil then return b end
        elseif nombreSala == b then
            return b
        end
    end
    return nil
end

-- Salas que calzan dentro de un rectangulo (x0, y0, ancho, alto).
-- En Build 42 getRoomsIntersecting solo responde bien por celda de 256x256: se recorren
-- todas las celdas que cubre la caja, sin repetir salas, y se filtra por el centro de cada una.
local function salasEnCaja(x0, y0, ancho, alto, buscadas, tope)
    local encontradas = {}
    if getWorld == nil or ArrayList == nil then return encontradas end
    tope = tope or 600
    pcall(function()
        local grid = getWorld():getMetaGrid()
        local x1, y1 = floor(x0 + ancho), floor(y0 + alto)
        local vistos, revisadas = {}, 0
        for cy = floor(y0 / 256), floor(y1 / 256) do
            for cx = floor(x0 / 256), floor(x1 / 256) do
                local lista = ArrayList.new()
                grid:getRoomsIntersecting(cx * 256, cy * 256, 256, 256, lista)
                for i = 0, lista:size() - 1 do
                    if revisadas >= tope then return end
                    local def = lista:get(i)
                    if def ~= nil and not vistos[def] then
                        vistos[def] = true
                        revisadas = revisadas + 1
                        local sx = def:getX() + floor((def:getW() or 2) / 2)
                        local sy = def:getY() + floor((def:getH() or 2) / 2)
                        local nombre = string.lower(tostring(def:getName() or ""))
                        if sx >= x0 and sx <= x1 and sy >= y0 and sy <= y1 and calza(nombre, buscadas) ~= nil then
                            local s = { sala = nombre, x = sx, y = sy, z = def:getZ() or 0 }
                            -- Contorno del edificio entero (para que la flecha llegue hasta la puerta).
                            pcall(function()
                                local b = def:getBuilding()
                                if b ~= nil then
                                    local bx, by = b:getX(), b:getY()
                                    s.caja = { bx, by, bx + b:getW(), by + b:getH() }
                                end
                            end)
                            encontradas[#encontradas + 1] = s
                        end
                    end
                end
            end
        end
    end)
    return encontradas
end

local function elegirSala(salas, spec, desdeX, desdeY, minD, maxD)
    local validas, abajo = {}, {}
    for _, s in ipairs(salas) do
        local d = math.sqrt((s.x - desdeX) ^ 2 + (s.y - desdeY) ^ 2)
        if d >= minD and d <= maxD then
            validas[#validas + 1] = s
            if s.z == 0 then abajo[#abajo + 1] = s end
        end
    end
    if #validas == 0 then return nil end
    local pool = #abajo > 0 and abajo or validas
    local s = pool[Mundo.azar(#pool)]
    s.etiqueta = Mundo.describir(s.x, s.y, s.sala, spec.nombre)
    return s
end

-- spec: { salas = {...}, respaldo = {...}, min = n, max = n, nombre = "texto opcional" }
-- desdeX, desdeY: punto de referencia (jugador u otro lugar).
-- Primero revisa pueblos enteros a una distancia razonable (asi encuentra salas raras,
-- como iglesias o laboratorios) y despues muestrea los alrededores.
-- Devuelve { x, y, z, sala, etiqueta } o nil.
function Mundo.puebloPorNombre(nombre)
    for _, p in ipairs(Mundo.pueblos) do
        if string.lower(p.label) == string.lower(tostring(nombre)) then return p end
    end
    return nil
end

-- Busca dentro de un pueblo puntual (sin importar la distancia). Con cerca_del_centro elige
-- la sala que calce mas cerca del centro del pueblo.
-- spec.agrupado = radio: elige una sala del grupo de tiendas mas grande del pueblo (por
-- ejemplo el mall de Louisville y no una zapateria suelta). Cuenta, alrededor de cada sala, las
-- salas de spec.densidad (o las mismas buscadas) y se queda con la zona que tiene mas.
function Mundo.elegirAgrupada(p, salas, spec)
    local radio = tonumber(spec.agrupado) or 45
    local vecinas = salas
    if type(spec.densidad) == "table" then
        vecinas = salasEnCaja(p.minX, p.minY, p.maxX - p.minX, p.maxY - p.minY, spec.densidad, 30000)
        if #vecinas == 0 then vecinas = salas end
    end
    local cx, cy = centro(p)
    local mejor, mejorN, mejorD
    for _, s in ipairs(salas) do
        local n = 0
        for _, v in ipairs(vecinas) do
            if math.abs(v.x - s.x) <= radio and math.abs(v.y - s.y) <= radio then n = n + 1 end
        end
        local d = math.sqrt((s.x - cx) ^ 2 + (s.y - cy) ^ 2)
        if mejor == nil or n > mejorN or (n == mejorN and d < mejorD) then mejor, mejorN, mejorD = s, n, d end
    end
    -- Dentro de ese grupo, una sala al azar (en el primer piso si se puede).
    local grupo, abajo = {}, {}
    for _, s in ipairs(salas) do
        if math.abs(s.x - mejor.x) <= radio and math.abs(s.y - mejor.y) <= radio then
            grupo[#grupo + 1] = s
            if s.z == 0 then abajo[#abajo + 1] = s end
        end
    end
    local pool = #abajo > 0 and abajo or grupo
    local elegida = pool[Mundo.azar(#pool)] or mejor
    Mundo.log("lugar agrupado en " .. tostring(p.label) .. ": " .. tostring(mejorN) .. " salas cerca de "
        .. tostring(elegida.x) .. "," .. tostring(elegida.y))
    return elegida
end

-- spec.cerca_de: lugares conocidos del mapa. { x, y, radio } o una lista de ellos
-- ({ {x, y, radio}, {x, y, radio} }, se prueba en orden al azar). Busca las salas alrededor de
-- cada punto (aunque quede fuera del pueblo, como el campamento militar al sur de Louisville)
-- y se queda con la mas cercana, en el primer piso si se puede.
function Mundo.buscarCercaDe(spec)
    local puntos = spec.cerca_de
    if type(puntos) ~= "table" then return nil end
    if type(puntos[1]) == "number" then puntos = { puntos } end
    local orden = {}
    for i = 1, #puntos do orden[i] = puntos[i] end
    for i = #orden, 2, -1 do
        local j = Mundo.azar(i)
        orden[i], orden[j] = orden[j], orden[i]
    end
    local listas = { spec.salas or {} }
    if spec.respaldo ~= nil then listas[#listas + 1] = spec.respaldo end
    for _, pt in ipairs(orden) do
        local px, py = tonumber(pt[1]), tonumber(pt[2])
        local radio = tonumber(pt[3]) or 120
        if px ~= nil and py ~= nil then
            for _, buscadas in ipairs(listas) do
                local mejor, elegida
                for _, s in ipairs(salasEnCaja(px - radio, py - radio, radio * 2, radio * 2, buscadas, 5000)) do
                    local d = math.sqrt((s.x - px) ^ 2 + (s.y - py) ^ 2)
                    if d <= radio then
                        d = d + (s.z ~= 0 and 1000 or 0)
                        if mejor == nil or d < mejor then mejor, elegida = d, s end
                    end
                end
                if elegida ~= nil then
                    elegida.etiqueta = Mundo.describir(elegida.x, elegida.y, elegida.sala, spec.nombre)
                    return elegida
                end
            end
        end
    end
    return nil
end

function Mundo.buscarEnPueblo(spec)
    local cerca = Mundo.buscarCercaDe(spec)
    if cerca ~= nil then return cerca end
    local p = Mundo.puebloPorNombre(spec.pueblo)
    if p == nil then return nil end
    local listas = { spec.salas or {} }
    if spec.respaldo ~= nil then listas[#listas + 1] = spec.respaldo end
    local cx, cy = centro(p)
    for _, buscadas in ipairs(listas) do
        local salas = salasEnCaja(p.minX, p.minY, p.maxX - p.minX, p.maxY - p.minY, buscadas, 30000)
        if #salas > 0 then
            local elegida
            if spec.agrupado ~= nil then
                elegida = Mundo.elegirAgrupada(p, salas, spec)
            elseif spec.cerca_del_centro then
                -- spec.piso: el piso que se prefiere (0 = planta baja, 1 = segundo piso...).
                local piso = tonumber(spec.piso) or 0
                local mejor
                for _, s in ipairs(salas) do
                    local d = math.sqrt((s.x - cx) ^ 2 + (s.y - cy) ^ 2) + (s.z ~= piso and 400 or 0)
                    if mejor == nil or d < mejor then mejor, elegida = d, s end
                end
            else
                local abajo = {}
                for _, s in ipairs(salas) do if s.z == 0 then abajo[#abajo + 1] = s end end
                local pool = #abajo > 0 and abajo or salas
                elegida = pool[Mundo.azar(#pool)]
            end
            elegida.etiqueta = Mundo.describir(elegida.x, elegida.y, elegida.sala, spec.nombre)
            return elegida
        end
    end
    return nil
end

function Mundo.buscarLugar(spec, desdeX, desdeY, relajado)
    if spec.pueblo ~= nil then return Mundo.buscarEnPueblo(spec) end
    local minD = tonumber(spec.min) or 100
    local maxD = tonumber(spec.max) or 900
    if relajado then minD, maxD = minD * 0.5, maxD * 2 end
    local listas = { spec.salas or {} }
    if spec.respaldo ~= nil then listas[#listas + 1] = spec.respaldo end

    local pueblos = {}
    for _, p in ipairs(Mundo.pueblos) do
        -- Distancia del punto de referencia al rectangulo del pueblo.
        local cx = math.max(p.minX, math.min(desdeX, p.maxX))
        local cy = math.max(p.minY, math.min(desdeY, p.maxY))
        local cerca = math.sqrt((cx - desdeX) ^ 2 + (cy - desdeY) ^ 2)
        if cerca <= maxD then pueblos[#pueblos + 1] = p end
    end
    -- Orden al azar.
    for i = #pueblos, 2, -1 do
        local j = Mundo.azar(i)
        pueblos[i], pueblos[j] = pueblos[j], pueblos[i]
    end

    for _, buscadas in ipairs(listas) do
        for i = 1, math.min(4, #pueblos) do
            local p = pueblos[i]
            local s = elegirSala(salasEnCaja(p.minX, p.minY, p.maxX - p.minX, p.maxY - p.minY, buscadas, 20000),
                spec, desdeX, desdeY, minD, maxD)
            if s ~= nil then return s end
        end
        for _ = 1, 12 do
            local angulo = (Mundo.azar(360) / 180) * math.pi
            local dist = minD + Mundo.azar(math.max(1, maxD - minD))
            local px, py = desdeX + math.cos(angulo) * dist, desdeY + math.sin(angulo) * dist
            local s = elegirSala(salasEnCaja(px - 150, py - 150, 300, 300, buscadas, 1500),
                spec, desdeX, desdeY, minD, maxD)
            if s ~= nil then return s end
        end
    end
    -- Ultimo intento con un rango de distancia mas amplio.
    if not relajado then return Mundo.buscarLugar(spec, desdeX, desdeY, true) end
    return nil
end

-- ---------------------------------------------------------------------------
-- Zombis
-- ---------------------------------------------------------------------------

-- Oleada repartida en grupitos alrededor del punto, caminando hacia el.
-- Velocidad de un zombi: 1 corredor, 2 rapido, 3 lento. Para sacar corredores de una oleada.
function Mundo.sinCorrer(zombi)
    pcall(function() zombi:changeSpeed(2) end)
end

function Mundo.oleada(x, y, z, cantidad, distMin, distMax, opciones)
    if addZombiesInOutfit == nil then return 0 end
    local mult = (tonumber(Mundo.sandbox("MultiplicadorZombis", 100)) or 100) / 100
    local total = math.max(1, floor((tonumber(cantidad) or 10) * mult + 0.5))
    distMin, distMax = distMin or 14, distMax or 30
    local creados = 0
    while creados < total do
        local n = math.min(4, total - creados)
        local angulo = (Mundo.azar(360) / 180) * math.pi
        local dist = distMin + Mundo.azar(math.max(1, distMax - distMin))
        local px, py = floor(x + math.cos(angulo) * dist), floor(y + math.sin(angulo) * dist)
        local ok, lista = pcall(addZombiesInOutfit, px, py, floor(z or 0), n, nil, 50)
        if ok and lista ~= nil then
            pcall(function()
                for i = 0, lista:size() - 1 do
                    local zombi = lista:get(i)
                    if zombi ~= nil then
                        if opciones ~= nil and opciones.caminantes then Mundo.sinCorrer(zombi) end
                        pcall(function() zombi:pathToLocation(floor(x), floor(y), floor(z or 0)) end)
                    end
                end
            end)
        end
        creados = creados + n
    end
    return total
end

-- Un zombi en un punto exacto (alguien que se transformo).
function Mundo.zombiEn(x, y, z, femenino)
    if addZombiesInOutfit == nil then return false end
    local ok = pcall(addZombiesInOutfit, floor(x), floor(y), floor(z or 0), 1, nil, femenino and 100 or 0)
    return ok
end

-- ---------------------------------------------------------------------------
-- Objetos
-- ---------------------------------------------------------------------------

function Mundo.crearItem(tipos)
    if type(tipos) == "string" then tipos = { tipos } end
    if instanceItem == nil then return nil end
    for _, tipo in ipairs(tipos) do
        local ok, item = pcall(instanceItem, tipo)
        if ok and item ~= nil then return item end
    end
    return nil
end

local function casillaLibre(x, y, z)
    for r = 0, 5 do
        for dx = -r, r do
            for dy = -r, r do
                if math.max(math.abs(dx), math.abs(dy)) == r then
                    local sq = Mundo.cargado(x + dx, y + dy, z)
                    if sq ~= nil then
                        local ok, libre = pcall(function() return sq:isFree(false) end)
                        if ok and libre then return sq end
                    end
                end
            end
        end
    end
    return Mundo.cargado(x, y, z)
end

-- Deja un item en el suelo cerca del punto. Devuelve true si quedo puesto.
function Mundo.dejarEnSuelo(x, y, z, item)
    if item == nil then return false end
    local sq = casillaLibre(floor(x), floor(y), floor(z or 0))
    if sq == nil then return false end
    local ok = pcall(function()
        sq:AddWorldInventoryItem(item, 0.3 + Mundo.azar(5) * 0.1, 0.3 + Mundo.azar(5) * 0.1, 0)
    end)
    return ok
end

function Mundo.nombrar(item, nombre, etiqueta)
    if item == nil then return end
    if nombre ~= nil then
        pcall(function() item:setName(nombre) end)
        pcall(function() item:setCustomName(true) end)
    end
    if etiqueta ~= nil then
        pcall(function() item:getModData().NarradorObjeto = etiqueta end)
    end
end

function Mundo.crearNota(titulo, texto)
    local nota = Mundo.crearItem({ "Base.SheetPaper2", "Base.Notebook" })
    if nota == nil then return nil end
    Mundo.nombrar(nota, titulo, nil)
    pcall(function() nota:addPage(1, texto) end)
    pcall(function() nota:setLockedBy("Narrador") end)
    return nota
end

-- Busca en el inventario del jugador (y en sus bolsos) el primer item que cumpla.
function Mundo.buscarItem(jugador, cumple)
    local encontrado, contenedor
    pcall(function()
        local function recorrer(inv, profundidad)
            if encontrado ~= nil or inv == nil or profundidad > 2 then return end
            local items = inv:getItems()
            for i = 0, items:size() - 1 do
                local it = items:get(i)
                if it ~= nil then
                    if cumple(it) then encontrado, contenedor = it, inv; return end
                    if instanceof(it, "InventoryContainer") then recorrer(it:getInventory(), profundidad + 1) end
                    if encontrado ~= nil then return end
                end
            end
        end
        recorrer(jugador:getInventory(), 0)
    end)
    return encontrado, contenedor
end

function Mundo.quitarItem(contenedor, item)
    local ok = pcall(function() contenedor:Remove(item) end)
    if ok and Mundo.esServidor() and sendRemoveItemFromContainer ~= nil then
        pcall(sendRemoveItemFromContainer, contenedor, item)
    end
    return ok
end

function Mundo.esComida(item)
    local ok, sirve = pcall(function()
        if not instanceof(item, "Food") then return false end
        if item:isRotten() then return false end
        return true
    end)
    return ok and sirve == true
end

function Mundo.tieneEtiqueta(item, etiqueta)
    local ok, valor = pcall(function() return item:getModData().NarradorObjeto end)
    return ok and valor == etiqueta
end

function Mundo.crearMapa(nombre, x, y, marcas)
    local pueblo = Mundo.puebloCercano(x, y)
    local tipos = {}
    for _, t in ipairs(pueblo ~= nil and Mundo.MAPAS[pueblo.label] or {}) do tipos[#tipos + 1] = t end
    for _, t in ipairs({ "Base.MuldraughMap", "Base.RiversideMap", "Base.Map" }) do tipos[#tipos + 1] = t end
    local mapa = Mundo.crearItem(tipos)
    if mapa == nil then return nil end
    Mundo.nombrar(mapa, nombre, nil)
    pcall(function()
        local simbolos = mapa:getSymbols()
        if simbolos == nil then return end
        for _, m in ipairs(marcas or {}) do
            local hecho = false
            -- Build 41/42: dos firmas posibles segun la version.
            if not hecho then hecho = pcall(function() simbolos:addTexture("Circle", m.x, m.y, m.r or 0.8, m.g or 0.1, m.b or 0.1, 1) end) end
            pcall(function()
                if UIFont ~= nil and UIFont.Handwritten ~= nil then
                    simbolos:addUntranslatedText(m.texto, UIFont.Handwritten, m.x + 6, m.y - 6, m.r or 0.8, m.g or 0.1, m.b or 0.1, 1)
                else
                    simbolos:addUntranslatedText(m.texto, nil, m.x + 6, m.y - 6, m.r or 0.8, m.g or 0.1, m.b or 0.1, 1)
                end
            end)
        end
    end)
    return mapa
end

-- Mapa con una ZONA marcada (un circulo de puntos), no una X exacta: el lugar queda en
-- algun punto adentro del circulo. zona = { x, y, r } (centro ya corrido y radio).
function Mundo.crearMapaZona(titulo, zona, texto, extras)
    local pueblo = Mundo.puebloCercano(zona.x, zona.y)
    local tipos = {}
    for _, t in ipairs(pueblo ~= nil and Mundo.MAPAS[pueblo.label] or {}) do tipos[#tipos + 1] = t end
    for _, t in ipairs({ "Base.MuldraughMap", "Base.RiversideMap", "Base.Map" }) do tipos[#tipos + 1] = t end
    local mapa = Mundo.crearItem(tipos)
    if mapa == nil then return nil end
    Mundo.nombrar(mapa, titulo, nil)
    pcall(function()
        local simbolos = mapa:getSymbols()
        if simbolos == nil then return end
        local function punto(px, py, r, g, b)
            pcall(function() simbolos:addTexture("Circle", px, py, r, g, b, 1) end)
        end
        local function letras(t, px, py, r, g, b)
            pcall(function()
                local fuente = UIFont ~= nil and UIFont.Handwritten or nil
                simbolos:addUntranslatedText(t, fuente, px, py, r, g, b, 1)
            end)
        end
        local pasos = 20
        for i = 0, pasos - 1 do
            local ang = (i / pasos) * 2 * math.pi
            punto(zona.x + math.cos(ang) * zona.r, zona.y + math.sin(ang) * zona.r, 0.8, 0.1, 0.1)
        end
        letras(texto or "Por aca", zona.x - zona.r, zona.y - zona.r - 10, 0.8, 0.1, 0.1)
        for _, m in ipairs(extras or {}) do
            punto(m.x, m.y, m.r or 0.1, m.g or 0.4, m.b or 0.9)
            letras(m.texto, m.x + 6, m.y - 6, m.r or 0.1, m.g or 0.4, m.b or 0.9)
        end
    end)
    return mapa
end

-- Pone un item directo en el inventario del jugador (y lo avisa al cliente en MP).
function Mundo.darItem(jugador, item)
    if jugador == nil or item == nil then return false end
    local ok = pcall(function() jugador:getInventory():AddItem(item) end)
    if ok and Mundo.esServidor() and sendAddItemToContainer ~= nil then
        pcall(sendAddItemToContainer, jugador:getInventory(), item)
    end
    return ok
end

function Mundo.existePerfil(id)
    local catalogo = ProjectALife ~= nil and ProjectALife.Catalog or nil
    if catalogo == nil or type(catalogo.npc) ~= "function" then return false end
    local ok, perfil = pcall(catalogo.npc, id)
    return ok and perfil ~= nil
end

function Mundo.esJugador(objeto)
    if objeto == nil or instanceof == nil then return false end
    local ok, es = pcall(instanceof, objeto, "IsoPlayer")
    return ok and es == true
end

-- ---------------------------------------------------------------------------
-- Extras de la v0.6
-- ---------------------------------------------------------------------------

-- true si el "zombi" es en realidad un NPC de A-Life.
function Mundo.esNpc(cuerpo)
    local interop = ProjectALife ~= nil and ProjectALife.Interop or nil
    if interop == nil or type(interop.isNpc) ~= "function" then return false end
    local ok, es = pcall(interop.isNpc, cuerpo)
    return ok and es == true
end

-- Hay un zombi (no NPC) a menos de "radio" casillas del punto.
function Mundo.zombiCerca(x, y, radio)
    if getCell == nil or x == nil then return false end
    local hay = false
    pcall(function()
        local lista = getCell():getZombieList()
        for i = 0, lista:size() - 1 do
            local z = lista:get(i)
            if z ~= nil and not z:isDead() and math.abs(z:getX() - x) <= radio and math.abs(z:getY() - y) <= radio
                    and not Mundo.esNpc(z) then
                hay = true
                return
            end
        end
    end)
    return hay
end

-- Tipo completo de un item ("Base.Plank").
function Mundo.tipoItem(item)
    local ok, t = pcall(function() return item:getFullType() end)
    if ok and t ~= nil then return tostring(t) end
    return nil
end

-- Todos los items del jugador (y sus bolsos) que cumplen: lista de { item, contenedor }.
function Mundo.buscarItems(jugador, cumple, maximo)
    local lista = {}
    pcall(function()
        local function recorrer(inv, profundidad)
            if inv == nil or profundidad > 2 or (maximo ~= nil and #lista >= maximo) then return end
            local items = inv:getItems()
            for i = 0, items:size() - 1 do
                local it = items:get(i)
                if it ~= nil then
                    if cumple(it) then lista[#lista + 1] = { it, inv } end
                    if maximo ~= nil and #lista >= maximo then return end
                    if instanceof(it, "InventoryContainer") then recorrer(it:getInventory(), profundidad + 1) end
                end
            end
        end
        recorrer(jugador:getInventory(), 0)
    end)
    return lista
end

-- Fecha del juego: dia (1-31), mes (1-12), hora (0-23).
function Mundo.fecha()
    if getGameTime == nil then return 9, 7, 8 end
    local ok, d, m, h = pcall(function()
        local gt = getGameTime()
        return gt:getDay() + 1, gt:getMonth() + 1, gt:getHour()
    end)
    if ok and d ~= nil then return d, m, h end
    return 9, 7, 8
end

-- Zombis corredores alrededor de un punto, caminando hacia el. Devuelve cuantos salieron.
function Mundo.corredores(x, y, z, cantidad, distMin, distMax)
    if addZombiesInOutfit == nil then return 0 end
    local mult = (tonumber(Mundo.sandbox("MultiplicadorZombis", 100)) or 100) / 100
    local total = math.max(1, floor((tonumber(cantidad) or 6) * mult + 0.5))
    distMin, distMax = distMin or 25, distMax or 45
    local creados = 0
    while creados < total do
        local n = math.min(3, total - creados)
        local angulo = (Mundo.azar(360) / 180) * math.pi
        local dist = distMin + Mundo.azar(math.max(1, distMax - distMin))
        local px, py = floor(x + math.cos(angulo) * dist), floor(y + math.sin(angulo) * dist)
        local ok, lista = pcall(addZombiesInOutfit, px, py, floor(z or 0), n, nil, 50)
        if ok and lista ~= nil then
            pcall(function()
                for i = 0, lista:size() - 1 do
                    local zombi = lista:get(i)
                    if zombi ~= nil then
                        -- Corredores: distintas formas segun la version del juego.
                        pcall(function() zombi:setWalkType("sprint" .. tostring(Mundo.azar(5))) end)
                        pcall(function() zombi:setVariable("zombieWalkType", "sprint1") end)
                        pcall(function() zombi:setSpeedMod(1.6) end)
                        pcall(function() zombi:getModData().NarradorCorredor = true end)
                        pcall(function() zombi:pathToLocation(floor(x), floor(y), floor(z or 0)) end)
                    end
                end
            end)
        end
        creados = creados + n
    end
    return total
end

-- Pastillas K-93: verdadera o azucar (queda en el modData del item).
function Mundo.marcarPastilla(item, real)
    pcall(function() item:getModData().NarradorK93 = real and "real" or "falsa" end)
end

function Mundo.pastillaEs(item)
    local ok, v = pcall(function() return item:getModData().NarradorK93 end)
    return ok and v or nil
end

function Mundo.nivelMedicina(jugador)
    if jugador == nil or Perks == nil then return 0 end
    local ok, n = pcall(function() return jugador:getPerkLevel(Perks.Doctor) end)
    return ok and tonumber(n) or 0
end

-- Que tan fuerte es un personaje (1 = recien llegado, hasta ~3): punteria, el mejor combate
-- cuerpo a cuerpo, fuerza y estado fisico.
Mundo.PERKS_COMBATE = { "Axe", "Blunt", "SmallBlunt", "LongBlade", "SmallBlade", "Spear" }
function Mundo.poderJugador(jugador)
    if jugador == nil or Perks == nil then return 1 end
    local function nivel(nombre)
        local ok, n = pcall(function() return jugador:getPerkLevel(Perks[nombre]) end)
        return ok and tonumber(n) or 0
    end
    local combate = 0
    for _, p in ipairs(Mundo.PERKS_COMBATE) do combate = math.max(combate, nivel(p)) end
    local poder = 1 + 0.06 * nivel("Aiming") + 0.05 * combate + 0.04 * nivel("Strength") + 0.04 * nivel("Fitness")
    return math.max(1, math.min(3, poder))
end

-- Estacion del ano en Kentucky (hemisferio norte).
function Mundo.estacion()
    local _, mes = Mundo.fecha()
    if mes == 12 or mes <= 2 then return "invierno" end
    if mes <= 5 then return "primavera" end
    if mes <= 8 then return "verano" end
    return "otono"
end

-- Sube el animo de un jugador: baja estres, tristeza y aburrimiento (B41 y B42).
function Mundo.animo(jugador, cuanto)
    if jugador == nil then return false end
    cuanto = cuanto or 1
    pcall(function()
        local st = jugador:getStats()
        pcall(function() st:setStress(math.max(0, st:getStress() - cuanto)) end)
        pcall(function() st:setBoredom(math.max(0, st:getBoredom() - cuanto * 100)) end)
        pcall(function()
            if CharacterStat ~= nil then
                st:set(CharacterStat.STRESS, 0)
                st:set(CharacterStat.BOREDOM, 0)
                st:set(CharacterStat.UNHAPPINESS, 0)
            end
        end)
    end)
    pcall(function()
        local bd = jugador:getBodyDamage()
        bd:setUnhappynessLevel(math.max(0, bd:getUnhappynessLevel() - cuanto * 100))
        bd:setBoredomLevel(math.max(0, bd:getBoredomLevel() - cuanto * 100))
    end)
    return true
end

-- Clima: { lluvia = 0..1, nieve = 0..1, niebla = 0..1, temperatura = C, tormenta = bool }
function Mundo.clima()
    local c = { lluvia = 0, nieve = 0, niebla = 0, temperatura = 20, tormenta = false }
    if getClimateManager == nil then return c end
    pcall(function()
        local cm = getClimateManager()
        pcall(function() c.lluvia = cm:getRainIntensity() or 0 end)
        pcall(function() c.nieve = cm:getSnowIntensity() or 0 end)
        pcall(function() c.niebla = cm:getFogIntensity() or 0 end)
        pcall(function() c.temperatura = cm:getTemperature() or 20 end)
        pcall(function() c.tormenta = cm:getIsThunderStorming() == true end)
        pcall(function() c.nieveSuelo = cm:isSnowing() == true or (cm:getSnowStrength() or 0) > 0.1 end)
    end)
    return c
end

-- Servicios del pueblo.
function Mundo.hayLuz()
    if getWorld == nil then return true end
    local ok, si = pcall(function() return getWorld():isHydroPowerOn() end)
    return not ok or si == true
end

function Mundo.hayAgua()
    if getGameTime == nil or SandboxVars == nil then return true end
    local ok, si = pcall(function()
        local corte = SandboxVars.WaterShutModifier
        if corte == nil then return true end
        return getGameTime():getWorldAgeHours() / 24 < corte
    end)
    return not ok or si == true
end

-- El jugador va en un vehiculo.
function Mundo.enVehiculo(jugador)
    local ok, v = pcall(function() return jugador:getVehicle() end)
    return ok and v ~= nil
end

-- Un zombi "jefe" con traje (outfit de B42) en un punto. Devuelve el zombi o nil.
function Mundo.zombiJefe(x, y, z, outfit, femenino)
    if addZombiesInOutfit == nil then return nil end
    local jefe
    pcall(function()
        local lista = addZombiesInOutfit(floor(x), floor(y), floor(z or 0), 1, outfit, femenino and 100 or 0)
        if lista ~= nil and lista:size() > 0 then jefe = lista:get(0) end
    end)
    if jefe ~= nil then
        pcall(function() jefe:setHealth(jefe:getHealth() * 3) end)
        pcall(function() jefe:getModData().NarradorJefe = true end)
    end
    return jefe
end

-- ---------------------------------------------------------------------------
-- Para los otros modulos: lo que antes llamaban directo a la API del juego
-- ---------------------------------------------------------------------------

-- Datos que se guardan con la partida (ModData). Sin el juego, una tabla en memoria.
function Mundo.datosGuardados(nombre)
    if ModData ~= nil and ModData.getOrCreate ~= nil then return ModData.getOrCreate(nombre) end
    Mundo._sinModData = Mundo._sinModData or {}
    Mundo._sinModData[nombre] = Mundo._sinModData[nombre] or {}
    return Mundo._sinModData[nombre]
end

-- Manda un comando a un cliente (o a todos con jugador = nil). false si no hay red.
function Mundo.enviarCliente(jugador, mod, comando, datos)
    if sendServerCommand == nil then return false end
    if jugador ~= nil then
        pcall(sendServerCommand, jugador, mod, comando, datos)
    else
        pcall(sendServerCommand, mod, comando, datos)
    end
    return true
end

-- El objeto es de esa clase de Java ("Clothing", "HandWeapon", "IsoWindow"...).
function Mundo.es(objeto, clase)
    if objeto == nil or instanceof == nil then return false end
    local ok, si = pcall(instanceof, objeto, clase)
    return ok and si == true
end

-- Prende fuego alrededor de un punto, cada 2 casillas. false si no se pudo.
function Mundo.incendiar(x, y, z, radio)
    if getCell == nil or IsoFireManager == nil then return false end
    radio = radio or 2
    return pcall(function()
        local cell = getCell()
        for dx = -radio, radio, 2 do
            for dy = -radio, radio, 2 do
                local sq = cell:getGridSquare(floor(x) + dx, floor(y) + dy, floor(z or 0))
                if sq ~= nil then IsoFireManager.StartFire(cell, sq, true, 100) end
            end
        end
    end)
end

-- Saca del mundo los zombis (no los NPCs de A-Life) a menos de "radio" casillas del punto.
function Mundo.quitarZombis(x, y, radio)
    if getCell == nil then return 0 end
    local interop = ProjectALife ~= nil and ProjectALife.Interop or nil
    local quitar = {}
    pcall(function()
        local lista = getCell():getZombieList()
        for i = 0, lista:size() - 1 do
            local z = lista:get(i)
            if z ~= nil and math.abs(z:getX() - x) <= radio and math.abs(z:getY() - y) <= radio then
                local esNpc = interop ~= nil and interop.isNpc ~= nil and interop.isNpc(z)
                if not esNpc then quitar[#quitar + 1] = z end
            end
        end
    end)
    for _, z in ipairs(quitar) do
        pcall(function() z:removeFromWorld(); z:removeFromSquare() end)
    end
    return #quitar
end

-- Pone una puerta (sprite y lado) en una casilla cargada y la manda a los clientes.
function Mundo.ponerPuerta(sq, sprite, norte)
    if sq == nil or IsoDoor == nil or getCell == nil then return false end
    return pcall(function()
        local puerta = IsoDoor.new(getCell(), sq, getSprite(sprite), norte == true)
        sq:AddSpecialObject(puerta)
        if puerta.transmitCompleteItemToClients ~= nil then puerta:transmitCompleteItemToClients() end
    end)
end

-- Saca un cadaver del suelo.
function Mundo.quitarCadaver(cuerpo)
    if cuerpo == nil then return false end
    return pcall(function() cuerpo:getSquare():removeCorpse(cuerpo, false) end)
end

-- La parte de A-Life (ver arriba).
require "Narrador/NarradorMundoALife"

-- Llena de bencina un bidon (Build 42: contenedor de fluidos). false si no se pudo.
function Mundo.llenarBencina(item)
    if item == nil or Fluid == nil then return false end
    return pcall(function()
        local fc = item:getFluidContainer()
        fc:addFluid(Fluid.Petrol, fc:getCapacity() - fc:getAmount())
    end)
end

return Mundo
