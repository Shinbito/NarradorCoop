-- Narrador Co-op: calculos de la flecha y la brujula (sin interfaz, para poder probarlos).
-- Sin tildes ni enies a proposito.

Narrador = Narrador or {}
local IC = Narrador.IndicadoresCalc or {}
Narrador.IndicadoresCalc = IC

local pi = math.pi

function IC.normalizar(a)
    while a > pi do a = a - 2 * pi end
    while a < -pi do a = a + 2 * pi end
    return a
end

-- Direccion aproximada en pantalla (vista isometrica de Zomboid): x del mundo baja a la derecha,
-- y del mundo baja a la izquierda.
function IC.anguloIso(dx, dy)
    local sx = dx - dy
    local sy = (dx + dy) / 2
    return math.atan2(sy, sx)
end

-- Indice de textura (0..n-1) para un angulo de pantalla (0 = derecha, sentido horario).
function IC.indiceFlecha(angulo, n)
    n = n or 16
    local a = angulo
    if a < 0 then a = a + 2 * pi end
    return math.floor(a / (2 * pi) * n + 0.5) % n
end

-- Punto en el borde del rectangulo (x0, y0, x1, y1) en la direccion "angulo" desde (cx, cy).
function IC.alBorde(cx, cy, angulo, x0, y0, x1, y1)
    local dx, dy = math.cos(angulo), math.sin(angulo)
    local t = math.huge
    if dx > 0.0001 then t = math.min(t, (x1 - cx) / dx) end
    if dx < -0.0001 then t = math.min(t, (x0 - cx) / dx) end
    if dy > 0.0001 then t = math.min(t, (y1 - cy) / dy) end
    if dy < -0.0001 then t = math.min(t, (y0 - cy) / dy) end
    if t == math.huge then t = 0 end
    return cx + dx * t, cy + dy * t
end

-- Brujula: posicion horizontal (0..1, 0.5 = al frente) de un rumbo del mundo segun hacia donde
-- se mira. Devuelve nil si queda a la espalda (mas de 90 grados) y el lado (-1 o 1).
function IC.enBrujula(rumbo, mirada, campo)
    campo = campo or (pi / 2)
    local rel = IC.normalizar(rumbo - mirada)
    if math.abs(rel) > campo then return nil, rel < 0 and -1 or 1 end
    return 0.5 + rel / (2 * campo), 0
end

-- Rumbo en el mundo (x al este, y al sur) desde el jugador hasta el objetivo.
function IC.rumbo(px, py, tx, ty)
    return math.atan2(ty - py, tx - px)
end

-- Puntos cardinales como rumbos del mundo.
IC.CARDINALES = {
    { "N", -pi / 2 }, { "NE", -pi / 4 }, { "E", 0 }, { "SE", pi / 4 },
    { "S", pi / 2 }, { "SO", 3 * pi / 4 }, { "O", pi }, { "NO", -3 * pi / 4 },
}

-- Distancia del jugador al objetivo y si ya llego. Con el contorno del edificio (caja =
-- {x0, y0, x1, y1}) se mide hasta la pared mas cercana y se llega al entrar (o a 2 casillas).
function IC.distancia(obj, px, py)
    local c = obj.caja
    if type(c) == "table" and c[1] ~= nil then
        local dx = math.max(c[1] - px, 0, px - c[3])
        local dy = math.max(c[2] - py, 0, py - c[4])
        local d = math.sqrt(dx * dx + dy * dy)
        return d, d <= 2
    end
    local d = math.sqrt((obj.x - px) ^ 2 + (obj.y - py) ^ 2)
    return d, d <= (obj.r or 10)
end

-- Texto al llegar: "En la zona" para una zona, "Llegaste" para un edificio (con el piso).
function IC.textoLlegada(obj)
    if not obj.exacto then return "En la zona" end
    local piso = tonumber(obj.z) or 0
    if piso > 0 then return "Llegaste (sube al piso " .. tostring(piso + 1) .. ")" end
    return "Llegaste"
end

-- Color segun distancia y peligro.
function IC.color(dist, peligro)
    if peligro then return { r = 0.95, g = 0.25, b = 0.2 }, true end
    if dist > 100 then return { r = 1, g = 0.85, b = 0.3 }, false end
    return { r = 1, g = 0.55, b = 0.15 }, false
end

function IC.textoDistancia(d)
    if d >= 1000 then return string.format("%.1f km", d / 1000) end
    return tostring(math.floor(d / 5 + 0.5) * 5) .. " m"
end

-- Objetivos a mostrar: el encuentro del grupo (siempre) y la mision que se sigue (o el encargo).
-- estado: vista del servidor; seguidaId: id de arco seguido (o nil); miGrupo.
function IC.objetivos(estado, seguidaId, miGrupo)
    local lista, vistos = {}, {}
    if estado == nil then return lista end
    local function agregar(a, prioridad)
        if a == nil or a.objetivo == nil or vistos[a.id] then return end
        vistos[a.id] = true
        lista[#lista + 1] = { id = a.id, x = a.objetivo.x, y = a.objetivo.y, r = a.objetivo.r or 10,
            z = a.objetivo.z or 0, exacto = a.objetivo.exacto == true, caja = a.objetivo.caja,
            tipo = a.objetivo.tipo, peligro = a.objetivo.peligro == true, titulo = a.titulo, prioridad = prioridad }
    end
    for _, a in ipairs(estado.arcos or {}) do
        if not a.terminado and a.objetivo ~= nil and a.objetivo.tipo == "encuentro" and a.dueno == miGrupo then agregar(a, 1) end
    end
    for _, a in ipairs(estado.arcos or {}) do
        if seguidaId ~= nil and a.id == seguidaId and not a.terminado then agregar(a, 2) end
    end
    if #lista < 2 and seguidaId == nil then
        for _, a in ipairs(estado.arcos or {}) do
            if not a.terminado and a.objetivo ~= nil and a.tipo == "encargo" and a.dueno == miGrupo then agregar(a, 3) end
        end
    end
    table.sort(lista, function(x, y) return x.prioridad < y.prioridad end)
    while #lista > 2 do table.remove(lista) end
    return lista
end

return IC
