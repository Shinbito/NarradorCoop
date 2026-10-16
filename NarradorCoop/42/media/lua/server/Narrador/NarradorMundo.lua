-- Narrador Co-op: todo lo que toca el mundo del juego.
-- El motor no llama nunca a la API del juego directo; pasa por aca. Asi se puede
-- probar el motor fuera del juego reemplazando estas funciones.

Narrador = Narrador or {}
local Mundo = Narrador.Mundo or {}
Narrador.Mundo = Mundo

local floor = math.floor

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

-- ---------------------------------------------------------------------------
-- Project A-Life (NPCs)
-- ---------------------------------------------------------------------------

function Mundo.hayALife()
    return ProjectALife ~= nil and ProjectALife.DebugService ~= nil
        and type(ProjectALife.DebugService.spawnEncounter) == "function"
end

-- Nombres reservados para un pedido: requestId -> { [profileId] = { nombre, apellido } }.
Mundo.nombresReservados = Mundo.nombresReservados or {}

-- A-Life arma la memoria de cada NPC nuevo y llama a Service.attachPerson justo antes de
-- crearlo. Nos colgamos ahi para dejarle el nombre puesto ANTES de que aparezca: asi nace
-- llamandose Daniel Bell (cuerpo, burbujas y menus incluidos) y no hay que renombrarlo despues.
function Mundo.instalarNombres()
    local servicio = ProjectALife ~= nil and ProjectALife.DebugService or nil
    if servicio == nil or type(servicio.attachPerson) ~= "function" or servicio._narradorNombres then return end
    local original = servicio.attachPerson
    servicio.attachPerson = function(memory, job)
        local ok, why = original(memory, job)
        local reservas = type(job) == "table" and Mundo.nombresReservados[tostring(job.requestId)] or nil
        local par = reservas ~= nil and reservas[tostring(job.profileId)] or nil
        if par ~= nil and type(memory) == "table" then
            memory.personFirst, memory.personLast = par[1], par[2]
            memory.personName = (par[2] ~= nil and par[2] ~= "") and (par[1] .. " " .. par[2]) or par[1]
            memory.introducedTo = type(memory.introducedTo) == "table" and memory.introducedTo or {}
            for _, p in ipairs(Mundo.jugadores()) do memory.introducedTo[Mundo.claveALife(p)] = true end
        end
        return ok, why
    end
    servicio._narradorNombres = true
end

function Mundo.reservarNombres(requestId, porPerfil)
    Mundo.instalarNombres()
    Mundo.nombresReservados[tostring(requestId)] = porPerfil
end

-- Pide a A-Life un grupo de NPCs. Al terminar llama aviso(resultado).
function Mundo.spawnGrupo(jugador, args, aviso)
    if not Mundo.hayALife() then return false, "sin_alife" end
    local servicio = ProjectALife.DebugService
    local ok, exito, razon
    if type(servicio.rawSpawn) == "function" then
        -- Igual que el panel de admin de A-Life: sin las reglas de "encuentro dirigido",
        -- que no dejan poner gente adentro de edificios cerrados ni cerca del jugador.
        local resultado
        ok, resultado = pcall(servicio.rawSpawn, jugador, args, true)
        if ok and type(resultado) == "table" then
            exito, razon = resultado.ok == true, resultado.reason
        elseif ok then
            exito = resultado == true
        end
    else
        ok, exito, razon = pcall(servicio.spawnEncounter, jugador, args, true)
    end
    if not ok then return false, tostring(exito) end
    if not exito then return false, razon or "rechazado" end
    if aviso ~= nil and type(servicio.watchGroup) == "function" then
        pcall(servicio.watchGroup, args.requestId, aviso)
    end
    return true, nil
end

function Mundo.actor(uid)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro == nil or type(registro.peek) ~= "function" then return nil end
    local ok, actor = pcall(registro.peek, uid)
    if ok then return actor end
    return nil
end

function Mundo.posicionActor(uid)
    local vigia = ProjectALife ~= nil and ProjectALife.Watchdog or nil
    local enlace = vigia ~= nil and vigia.bindings ~= nil and vigia.bindings[uid] or nil
    if enlace ~= nil and enlace.shell ~= nil then
        local ok, x, y, z = pcall(function() return enlace.shell:getX(), enlace.shell:getY(), enlace.shell:getZ() end)
        if ok and x ~= nil then return x, y, z end
    end
    local actor = Mundo.actor(uid)
    local pos = actor ~= nil and actor.worldPosition or nil
    if type(pos) == "table" then return tonumber(pos.x), tonumber(pos.y), tonumber(pos.z) or 0 end
    return nil
end

-- true si el actor sigue existiendo y no esta muerto.
function Mundo.actorVivo(uid)
    local actor = Mundo.actor(uid)
    if actor == nil then return false end
    return actor.lifecycle ~= "dead"
end

function Mundo.retirar(uid)
    local servicio = ProjectALife ~= nil and ProjectALife.SpawnService or nil
    if servicio == nil or type(servicio.retire) ~= "function" then return false end
    local ok = pcall(servicio.retire, uid, "narrador")
    return ok
end

-- Clave con la que A-Life identifica a un jugador ("sp:0" en un jugador, el usuario en MP).
function Mundo.claveALife(jugador)
    local rep = ProjectALife ~= nil and ProjectALife.Reputation or nil
    if rep ~= nil and type(rep.playerKey) == "function" then
        local ok, clave = pcall(rep.playerKey, jugador)
        if ok and clave ~= nil then return tostring(clave) end
    end
    return Mundo.nombreJugador(jugador)
end

-- Pone nombre y apellido a un NPC de A-Life y lo deja "presentado" a los jugadores
-- conectados, para que A-Life muestre el nombre y no "Desconocido".
-- Devuelve true si quedo bien (o ya estaba).
function Mundo.nombrarActor(uid, nombre, apellido)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro == nil or type(registro.peek) ~= "function" or type(registro.update) ~= "function" then return false end
    local actual = registro.peek(uid)
    if actual == nil then return false end
    Mundo.arreglarCarnet(uid, nombre, apellido)
    local completo = apellido ~= nil and apellido ~= "" and (nombre .. " " .. apellido) or nombre
    local claves = {}
    for _, p in ipairs(Mundo.jugadores()) do claves[#claves + 1] = Mundo.claveALife(p) end
    local mem = type(actual.memory) == "table" and actual.memory or {}
    local falta = mem.personFirst ~= nombre or mem.personLast ~= apellido or mem.personName ~= completo
    local presentado = type(mem.introducedTo) == "table" and mem.introducedTo or {}
    for _, clave in ipairs(claves) do
        if presentado[clave] ~= true then falta = true end
    end
    if not falta then return true end
    local ok, resultado = pcall(registro.update, uid, actual.revision, function(r)
        r.memory = type(r.memory) == "table" and r.memory or {}
        r.memory.personFirst, r.memory.personLast, r.memory.personName = nombre, apellido, completo
        r.memory.introducedTo = type(r.memory.introducedTo) == "table" and r.memory.introducedTo or {}
        for _, clave in ipairs(claves) do r.memory.introducedTo[clave] = true end
    end)
    return ok and resultado ~= nil
end

-- Refugio del jugador: primero la casa marcada como base en A-Life, despues un refugio
-- reclamado del juego (safehouse, propio o compartido). Devuelve un lugar o nil.
function Mundo.refugioDe(jugador)
    if jugador == nil then return nil end
    local nombre = Mundo.nombreJugador(jugador)
    local limites, fuente
    local director = ProjectALife ~= nil and ProjectALife.SafehouseDirector or nil
    if director ~= nil and type(director.markOf) == "function" and type(director.playerKey) == "function" then
        local ok, casa = pcall(function() return director.markOf(director.playerKey(jugador)) end)
        if ok and type(casa) == "table" and tonumber(casa.x1) ~= nil then limites, fuente = casa, "base" end
    end
    if limites == nil and SafeHouse ~= nil and SafeHouse.getSafehouseList ~= nil then
        pcall(function()
            local lista = SafeHouse.getSafehouseList()
            for i = 0, math.min(lista:size(), 256) - 1 do
                local sh = lista:get(i)
                local miembro = tostring(sh:getOwner()) == nombre
                if not miembro then
                    local jugadores = sh:getPlayers()
                    for j = 0, jugadores:size() - 1 do
                        if tostring(jugadores:get(j)) == nombre then miembro = true end
                    end
                end
                if miembro then
                    limites = { x1 = sh:getX(), y1 = sh:getY(), x2 = sh:getX2(), y2 = sh:getY2(), z = 0 }
                    fuente = "refugio"
                    return
                end
            end
        end)
    end
    if limites == nil then return nil end
    local x1, y1 = tonumber(limites.x1), tonumber(limites.y1)
    local x2, y2 = tonumber(limites.x2) or x1, tonumber(limites.y2) or y1
    local cx = tonumber(limites.cx) or (x1 + x2) / 2
    local cy = tonumber(limites.cy) or (y1 + y2) / 2
    local diagonal = math.sqrt((x2 - x1) ^ 2 + (y2 - y1) ^ 2)
    local etiqueta = Mundo.esServidor() and ("el refugio de " .. nombre) or "tu refugio"
    return { x = floor(cx), y = floor(cy), z = floor(tonumber(limites.z) or 0),
        x1 = x1, y1 = y1, x2 = x2, y2 = y2, radio = math.max(10, floor(diagonal / 2) + 4),
        sala = fuente, etiqueta = etiqueta, dueno = nombre }
end

-- Algun jugador conectado con refugio. Si se pasa uno preferido y tiene, ese.
function Mundo.jugadorConRefugio(preferido)
    if preferido ~= nil and Mundo.refugioDe(preferido) ~= nil then return preferido, Mundo.refugioDe(preferido) end
    local con = {}
    for _, p in ipairs(Mundo.jugadores()) do
        local r = Mundo.refugioDe(p)
        if r ~= nil and Mundo.vivo(p) then con[#con + 1] = { p, r } end
    end
    if #con == 0 then return nil end
    local elegido = con[Mundo.azar(#con)]
    return elegido[1], elegido[2]
end

-- Crea (o actualiza) una faccion propia en A-Life con sus integrantes, usando el mismo
-- sistema que el editor de facciones de A-Life. Queda guardada en la partida y aparece en
-- el editor. postura: "friendly" | "careful" | "neutral" | "hostile" hacia los jugadores.
-- spec = { id, nombre, descripcion, postura, relaciones = { [otraFaccion] = "hostile" },
--          miembros = { { id, nombre, rol, arma, cuerpo, ropa, stats, nombre_al_azar } } }
-- Con spec.rehacer se vuelven a escribir los perfiles aunque ya existan (cambio de version).
function Mundo.crearFaccion(spec)
    local CF = ProjectALife ~= nil and ProjectALife.CustomFactions or nil
    local CP = ProjectALife ~= nil and ProjectALife.CustomProfiles or nil
    local FA = ProjectALife ~= nil and ProjectALife.CustomFactionAuthority or nil
    local PA = ProjectALife ~= nil and ProjectALife.CustomProfileAuthority or nil
    if CF == nil or CP == nil or FA == nil or PA == nil then return false, "A-Life sin editor de facciones" end
    local ok, err = pcall(function()
        local f = CF.blank(spec.id)
        f.general.name = spec.nombre
        f.general.description = spec.descripcion or spec.nombre
        f.spawn.enabled = false
        f.spawn.natural = false
        f.spawn.peaceable = spec.postura ~= "hostile"
        f.relations = { player = spec.postura or "friendly", unknown = spec.desconocidos or "careful" }
        for otra, palabra in pairs(spec.relaciones or {}) do f.relations[otra] = palabra end
        f.memberModules = { flee = "off" }
        local listo, razon = FA.upsert(spec.id, CF.serializeFaction(f))
        if not listo then error("faccion: " .. tostring(razon)) end
        local catalogo = ProjectALife.Catalog
        for _, m in ipairs(spec.miembros or {}) do
            local existe = catalogo ~= nil and type(catalogo.npc) == "function" and catalogo.npc(m.id) ~= nil
            if not existe or spec.rehacer then
                local p = CP.blank(m.id)
                p.general.faction = spec.id
                p.general.name = m.nombre .. (m.rol ~= nil and (" - " .. m.rol) or "")
                p.general.female = m.mujer == true
                if not m.nombre_al_azar then
                    p.general.nameMode = "fixed"
                    p.general.fixedName = m.nombre
                end
                p.general.role = m.rango or "Regular"
                for clave, valor in pairs(m.stats or spec.stats or {}) do p.general[clave] = valor end
                if m.arma ~= nil then p.weapons.primary = m.arma end
                if m.cuerpo ~= nil then p.weapons.melee = m.cuerpo end
                if m.ropa ~= nil then
                    for slot, tipo in pairs(m.ropa) do p.clothing[slot] = tipo; p.outfitSets.A[slot] = tipo end
                end
                local hecho, razonP = PA.upsert(m.id, CP.serializeProfiles({ p }))
                if not hecho then error("integrante " .. m.id .. ": " .. tostring(razonP)) end
            end
        end
    end)
    if not ok then return false, tostring(err) end
    return true
end

-- ---------------------------------------------------------------------------
-- Banderas de admin de A-Life (inmortal, quieto, correa, vida, dano), cambiables en vivo
-- ---------------------------------------------------------------------------

local function mismasBanderas(a, b)
    if type(a) ~= "table" or type(b) ~= "table" then return false end
    for _, k in ipairs({ "persistent", "invulnerable", "stationary", "health", "damageOutput", "damageReduction" }) do
        if a[k] ~= b[k] then return false end
    end
    local la, lb = a.leash, b.leash
    if (la == nil) ~= (lb == nil) then return false end
    if la ~= nil and (la.radius ~= lb.radius or floor(la.x or 0) ~= floor(lb.x or 0) or floor(la.y or 0) ~= floor(lb.y or 0)) then
        return false
    end
    return true
end

function Mundo.cuerpoActor(uid)
    local vigia = ProjectALife ~= nil and ProjectALife.Watchdog or nil
    local enlace = vigia ~= nil and vigia.bindings ~= nil and vigia.bindings[uid] or nil
    if enlace ~= nil then return enlace.shell, enlace end
    return nil
end

-- Lo mismo que hace el panel de admin de A-Life ("adminActorFlags"): guarda las banderas en
-- la memoria del NPC, las aplica al cuerpo cargado y avisa a los clientes.
-- flags = { invulnerable, stationary, persistent, health, damageOutput, damageReduction, leashRadius }
-- ancla = { x, y, z } centro de la correa (si no, donde esta el NPC).
function Mundo.banderas(uid, flags, ancla)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    local servicio = ProjectALife ~= nil and ProjectALife.DebugService or nil
    if registro == nil or type(registro.peek) ~= "function" or type(registro.update) ~= "function"
            or servicio == nil or type(servicio.normalizeAdminFlags) ~= "function" then return false end
    local actual = registro.peek(uid)
    if actual == nil or actual.lifecycle == "dead" then return false end
    local viejo = type(actual.memory) == "table" and actual.memory.admin or nil
    local okN, nuevas = pcall(servicio.normalizeAdminFlags, flags, ancla or actual.worldPosition, viejo)
    if not okN or type(nuevas) ~= "table" then return false end
    if flags.leashRadius == 0 then nuevas.leash = nil end
    local generacion = actual.generation
    if not mismasBanderas(viejo, nuevas) then
        local ok, actualizado = pcall(registro.update, uid, actual.revision, function(r)
            r.memory = type(r.memory) == "table" and r.memory or {}
            r.memory.admin = nuevas
            r.memory.persistent = (nuevas.persistent == true or r.memory.encounter ~= nil) and true or nil
        end)
        if not ok or actualizado == nil then return false end
        generacion = actualizado.generation
    end
    local cuerpo, enlace = Mundo.cuerpoActor(uid)
    if cuerpo ~= nil and (enlace.generation == nil or enlace.generation == generacion) then
        pcall(function()
            local data = cuerpo:getModData()
            data.ProjectALifeAdminManaged = true
            data.ProjectALifeAdminPersistent = nuevas.persistent == true
            data.ProjectALifeInvulnerable = nuevas.invulnerable == true or nil
            data.ProjectALifeAdminStationary = nuevas.stationary == true or nil
            data.ProjectALifeLeashX = nuevas.leash and nuevas.leash.x or nil
            data.ProjectALifeLeashY = nuevas.leash and nuevas.leash.y or nil
            data.ProjectALifeLeashZ = nuevas.leash and nuevas.leash.z or nil
            data.ProjectALifeLeashRadius = nuevas.leash and nuevas.leash.radius or nil
            local sim = ProjectALife.ShellSimulation
            if nuevas.invulnerable and sim ~= nil then sim.setHealth(cuerpo, sim.maximumFor(cuerpo)) end
        end)
    end
    if type(servicio.pushAdminFlags) == "function" then pcall(servicio.pushAdminFlags, uid, generacion, nuevas) end
    return true
end

-- El carnet (IDcard) que lleva el NPC y el nombre de su cuerpo: que digan su nombre de verdad.
function Mundo.arreglarCarnet(uid, nombre, apellido)
    local cuerpo = Mundo.cuerpoActor(uid)
    if cuerpo == nil or nombre == nil then return false end
    local completo = (apellido ~= nil and apellido ~= "") and (nombre .. " " .. apellido) or nombre
    local cambio = false
    pcall(function()
        local items = cuerpo:getInventory():getItems()
        for i = 0, items:size() - 1 do
            local it = items:get(i)
            local tipo = it ~= nil and tostring(it:getFullType() or "") or ""
            if string.find(tipo, "Base.IDcard", 1, true) == 1 then
                local etiqueta = "Carnet"
                pcall(function() etiqueta = it:getScriptItem():getDisplayName() end)
                local texto = etiqueta .. " (" .. completo .. ")"
                if getText ~= nil then
                    local ok, t = pcall(getText, "IGUI_ItemWithDisplayName", etiqueta, completo)
                    if ok and type(t) == "string" and t ~= "" and t ~= "IGUI_ItemWithDisplayName" then texto = t end
                end
                if it:getName() ~= texto then
                    it:setName(texto)
                    pcall(function() it:setCustomName(true) end)
                    cambio = true
                end
            end
        end
    end)
    pcall(function()
        local d = cuerpo:getDescriptor()
        if d:getForename() ~= nombre then d:setForename(nombre); cambio = true end
        if d:getSurname() ~= (apellido or "") then d:setSurname(apellido or ""); cambio = true end
    end)
    return cambio
end

-- ---------------------------------------------------------------------------
-- Silencio de A-Life: los personajes del Narrador solo dicen lo que escribe el Narrador
-- ---------------------------------------------------------------------------

-- uid -> true. Lo mantiene al dia el motor (NPCs de historias, residentes y misioneros).
Mundo.uidsPropios = Mundo.uidsPropios or {}

function Mundo.silenciarALife()
    local habla = ProjectALife ~= nil and ProjectALife.Speech or nil
    if habla == nil or type(habla.say) ~= "function" or habla._narradorSilencio then return end
    local original = habla.say
    habla.say = function(cuerpo, texto, opciones)
        local uid
        if cuerpo ~= nil and type(habla.variable) == "function" then
            local ok, v = pcall(habla.variable, cuerpo, "ALifeUID")
            if ok and v ~= nil then uid = tostring(v) end
        end
        if uid ~= nil and Mundo.uidsPropios[uid] then return true end
        return original(cuerpo, texto, opciones)
    end
    habla._narradorSilencio = true
end

-- ---------------------------------------------------------------------------
-- Zonas tranquilas: pocos zombis alrededor de un lugar (base de Sous, misioneros)
-- ---------------------------------------------------------------------------

-- Deja como mucho "maximo" zombis dentro del radio. Solo saca los que ningun jugador
-- tiene cerca (a menos de "vista" casillas), para que nadie los vea desaparecer.
function Mundo.limpiarZona(x, y, radio, maximo, vista)
    if getCell == nil or x == nil then return 0 end
    radio, maximo, vista = radio or 40, maximo or 0, vista or 18
    local interop = ProjectALife ~= nil and ProjectALife.Interop or nil
    local quitados = 0
    pcall(function()
        local lista = getCell():getZombieList()
        local dentro = {}
        for i = 0, lista:size() - 1 do
            local z = lista:get(i)
            if z ~= nil and math.abs(z:getX() - x) <= radio and math.abs(z:getY() - y) <= radio then
                local esNpc = interop ~= nil and interop.isNpc ~= nil and interop.isNpc(z)
                if not esNpc then dentro[#dentro + 1] = z end
            end
        end
        local sobran = #dentro - maximo
        if sobran <= 0 then return end
        for _, z in ipairs(dentro) do
            if sobran <= 0 then break end
            if Mundo.jugadorCerca(z:getX(), z:getY(), vista) == nil then
                pcall(function() z:removeFromWorld(); z:removeFromSquare() end)
                sobran, quitados = sobran - 1, quitados + 1
            end
        end
    end)
    return quitados
end

-- Hace que un NPC de A-Life camine con un jugador (la misma postura que "camina conmigo"
-- del menu de A-Life). Hay que renovarlo cada tanto.
function Mundo.acompanar(uid, jugador, horas)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro == nil or type(registro.peek) ~= "function" or type(registro.update) ~= "function" then return false end
    local clave = Mundo.claveALife(jugador)
    local x, y, z = Mundo.posicion(jugador)
    if clave == nil or x == nil then return false end
    local ahora = Mundo.horas()
    for _ = 1, 3 do
        local actual = registro.peek(uid)
        if actual == nil then return false end
        local ok, r = pcall(registro.update, uid, actual.revision, function(a)
            a.memory = a.memory or {}
            a.memory.walkWith = { key = clave, untilHours = ahora + (horas or 2), startedHours = ahora }
            a.memory.stance, a.memory.stanceAnchor = "walkWith", { x = floor(x), y = floor(y), z = floor(z or 0) }
        end)
        if ok and r ~= nil then return true end
    end
    return false
end

-- Grupo del jugador para los encargos: su faccion del juego (si tiene) o el mismo jugador.
function Mundo.grupoDe(jugador)
    local nombreJugador = Mundo.nombreJugador(jugador)
    local nombre
    if Faction ~= nil and Faction.getPlayerFaction ~= nil then
        local ok, f = pcall(Faction.getPlayerFaction, jugador)
        if not ok or f == nil then ok, f = pcall(Faction.getPlayerFaction, nombreJugador) end
        if ok and f ~= nil then
            local ok2, n = pcall(function() return f:getName() end)
            if ok2 and n ~= nil and n ~= "" then nombre = tostring(n) end
        end
    end
    if nombre ~= nil then return "faccion:" .. nombre, nombre end
    return "jugador:" .. tostring(nombreJugador), tostring(nombreJugador)
end

-- Mapa del pueblo de destino, con marcas (si la version del juego lo permite).
Mundo.MAPAS = {
    ["Muldraugh"] = { "Base.MuldraughMap" }, ["West Point"] = { "Base.WestpointMap" },
    ["Riverside"] = { "Base.RiversideMap" }, ["Rosewood"] = { "Base.RosewoodMap" },
    ["March Ridge"] = { "Base.MarchRidgeMap" }, ["Louisville"] = { "Base.LouisvilleMap1", "Base.LouisvilleMap2" },
    ["Valley Station"] = { "Base.ValleyStationMap" }, ["Brandenburg"] = { "Base.BrandenburgMap" },
    ["Ekron"] = { "Base.EkronMap" }, ["Irvington"] = { "Base.IrvingtonMap" }, ["Echo Creek"] = { "Base.EchoCreekMap" },
    ["Fallas Lake"] = { "Base.FallasLakeMap" },
}

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

return Mundo
