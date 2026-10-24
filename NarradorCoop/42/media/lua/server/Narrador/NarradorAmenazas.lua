-- Narrador Co-op: amenazas (como los ataques de RimWorld).
-- Cada cierto tiempo el narrador manda una horda, un ataque de bandidos o corredores. El
-- tamano sale de un "presupuesto" que depende de:
--   * los dias sobrevividos,
--   * el poder de los personajes (punteria, mejor arma cuerpo a cuerpo, fuerza, estado fisico),
--   * la dificultad y el estilo de narrador elegidos en el sandbox,
--   * cuantos jugadores estan juntos.
-- Los jugadores que estan a menos de RADIO_JUNTOS casillas comparten la amenaza: se promedia su
-- poder y se suma un extra por cada uno (es mas dura). Si estan lejos, cada grupo recibe la suya
-- por separado (mas liviana). Primero llega un aviso con la direccion; un rato despues, la amenaza.
-- Sin tildes ni enies a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local floor = math.floor

local A = Narrador.Amenazas or {}
Narrador.Amenazas = A

A.RADIO_JUNTOS = 150
A.EXTRA_POR_JUGADOR = 0.4
A.HORAS_AVISO = { 0.15, 0.35 }
A.EXTRA_RADIO = 0.25      -- con la radio del cuartel de la Chela arreglada, el aviso llega un cuarto de hora antes

A.TIPOS = {
    horda = { peso = 10, avisos = {
        "Se escucha un murmullo {dir}. Cientos de pies arrastrandose. Viene una horda.",
        "Las aves huyen {dir}. Algo grande viene caminando para aca." } },
    bandidos = { peso = 6, dia_min = 4, avisos = {
        "Se ven siluetas armadas {dir}. No son muertos. Vienen por ustedes.",
        "Alguien grita ordenes {dir}. Un grupo armado se acerca." } },
    corredores = { peso = 5, dia_min = 6, avisos = {
        "Un chillido {dir}. Despues otro. Esos no caminan: corren.",
        "Algo viene corriendo {dir}. Rapido. Demasiado rapido para estar vivo." } },
    mixta = { peso = 3, dia_min = 12, avisos = {
        "Una horda viene {dir}, y entre los muertos hay algunos que corren." } },
}

function A.st()
    local st = Motor.estado()
    st.amenazas = st.amenazas or { proxima = nil, pendientes = {}, historial = {} }
    st.amenazas.pendientes = st.amenazas.pendientes or {}
    st.amenazas.historial = st.amenazas.historial or {}
    return st.amenazas
end

function A.activas()
    return Mundo.sandbox("Amenazas", true) ~= false
end

-- Grupos de jugadores cercanos entre si (union por distancia).
function A.agrupar(jugadores, radio)
    radio = radio or A.RADIO_JUNTOS
    local grupos, asignado = {}, {}
    for i, p in ipairs(jugadores) do
        if not asignado[i] then
            local grupo = { p }
            asignado[i] = true
            local k = 1
            while k <= #grupo do
                local ax, ay = Mundo.posicion(grupo[k])
                for j, q in ipairs(jugadores) do
                    if not asignado[j] then
                        local bx, by = Mundo.posicion(q)
                        if ax ~= nil and bx ~= nil and math.sqrt((ax - bx) ^ 2 + (ay - by) ^ 2) <= radio then
                            asignado[j] = true
                            grupo[#grupo + 1] = q
                        end
                    end
                end
                k = k + 1
            end
            grupos[#grupos + 1] = grupo
        end
    end
    return grupos
end

-- Presupuesto de una amenaza para un grupo de jugadores juntos.
function A.presupuesto(grupo)
    local poder = 0
    for _, p in ipairs(grupo) do poder = poder + Mundo.poderJugador(p) end
    local promedio = poder / math.max(1, #grupo)
    local dias = Mundo.horas() / 24
    local tiempo = 1 + math.min(2, dias / 25)
    local juntos = 1 + A.EXTRA_POR_JUGADOR * (#grupo - 1)
    local D = Narrador.Director
    local estilo = D ~= nil and D.estilo ~= nil and D.estilo() or { id = "equilibrado" }
    local mEstilo = ({ pausado = 0.8, equilibrado = 1, implacable = 1.25, volado = 0.6 + Mundo.azar(10) / 10 })[estilo.id] or 1
    return 10 * tiempo * promedio * juntos * Motor.dificultad() * mEstilo, promedio
end

function A.elegirTipo()
    local dia = Mundo.horas() / 24
    local lista, total = {}, 0
    for id, t in pairs(A.TIPOS) do
        if dia >= (t.dia_min or 0) and (id ~= "bandidos" or Mundo.hayALife()) then
            lista[#lista + 1] = { id = id, peso = t.peso }
            total = total + t.peso
        end
    end
    table.sort(lista, function(a, b) return a.id < b.id end)
    local tiro, acum = Mundo.azar(math.max(1, total)), 0
    for _, c in ipairs(lista) do
        acum = acum + c.peso
        if tiro <= acum then return c.id end
    end
    return "horda"
end

local function centro(grupo)
    local sx, sy, n = 0, 0, 0
    for _, p in ipairs(grupo) do
        local x, y = Mundo.posicion(p)
        if x ~= nil then sx, sy, n = sx + x, sy + y, n + 1 end
    end
    if n == 0 then return nil end
    return sx / n, sy / n
end

function A.direccionTexto(ang)
    local E = Narrador.Encuentros
    if E ~= nil and E.direccion ~= nil then return E.direccion(math.cos(ang), math.sin(ang)) end
    return "a lo lejos"
end

-- Programa una amenaza para un grupo: aviso ahora, llegada en un rato.
function A.programar(grupo, tipo)
    local x, y = centro(grupo)
    if x == nil then return nil end
    tipo = tipo or A.elegirTipo()
    local puntos, poder = A.presupuesto(grupo)
    local ang = (Mundo.azar(360) / 180) * math.pi
    local t = A.TIPOS[tipo]
    local aviso = t.avisos[Mundo.azar(#t.avisos)]
    aviso = string.gsub(aviso, "{dir}", A.direccionTexto(ang))
    local nombres = {}
    for _, p in ipairs(grupo) do nombres[#nombres + 1] = Mundo.nombreJugador(p) end
    local h = A.HORAS_AVISO
    local pend = { tipo = tipo, puntos = puntos, poder = poder, ang = ang, jugadores = nombres, x = floor(x), y = floor(y),
        llega = Mundo.horas() + h[1] + Mundo.azar(floor((h[2] - h[1]) * 100)) / 100, juntos = #grupo }
    -- Consecuencia de la radio de la Chela (radio_westpoint): avisa antes y por la radio.
    if Motor.estado().memoria.radio_westpoint == true then
        pend.llega = pend.llega + A.EXTRA_RADIO
        aviso = "La radio del cuartel de la Chela: '" .. aviso .. "'"
    end
    local e = A.st()
    e.pendientes[#e.pendientes + 1] = pend
    for _, p in ipairs(grupo) do Motor.enviar(p, "aviso", { texto = aviso }) end
    local D = Narrador.Director
    if D ~= nil and D.subirTension ~= nil then D.subirTension(math.min(25, puntos / 2)) end
    return pend
end

-- Donde estan ahora los jugadores de la amenaza (se mueve con ellos).
local function jugadoresDe(pend)
    local lista = {}
    for _, p in ipairs(Mundo.jugadores()) do
        for _, n in ipairs(pend.jugadores) do
            if Mundo.nombreJugador(p) == n and Mundo.vivo(p) then lista[#lista + 1] = p end
        end
    end
    return lista
end

function A.lanzar(pend)
    local grupo = jugadoresDe(pend)
    if #grupo == 0 then return true end
    local x, y = centro(grupo)
    local _, _, z = Mundo.posicion(grupo[1])
    -- Llegan desde la direccion del aviso: aparecen en un anillo a 25-40 casillas de los
    -- jugadores (cerca pero fuera de la vista) y caminan directo hacia ellos. Antes aparecian
    -- alrededor de un punto a 35 casillas y caminaban hacia ESE punto, asi que nunca llegaban.
    if Mundo.cargado(x, y, 0) == nil then return false end
    local d = 35
    local ox, oy = floor(x + math.cos(pend.ang) * d), floor(y + math.sin(pend.ang) * d)
    local hacia = { destino = { x = x, y = y, z = z or 0 }, angulo = pend.ang, ruido = true }
    local puntos = pend.puntos
    local resumen
    if pend.tipo == "horda" then
        local n = floor(puntos * 1.6 + 0.5)
        Mundo.oleada(x, y, 0, n, 25, 40, hacia)
        resumen = n .. " muertos"
    elseif pend.tipo == "corredores" then
        local n = math.max(2, floor(puntos / 2.5 + 0.5))
        Mundo.oleada(x, y, 0, n, 25, 40, { destino = hacia.destino, angulo = pend.ang, ruido = true, correr = true })
        resumen = n .. " corredores"
    elseif pend.tipo == "mixta" then
        local n = floor(puntos * 1.2 + 0.5)
        local c = math.max(2, floor(puntos / 5))
        Mundo.oleada(x, y, 0, n, 25, 40, hacia)
        Mundo.oleada(x, y, 0, c, 25, 40, { destino = hacia.destino, angulo = pend.ang, correr = true })
        resumen = n .. " muertos y " .. c .. " corredores"
    elseif pend.tipo == "bandidos" then
        local n = math.max(1, math.min(8, floor(puntos / 6 + 0.5)))
        local faccion = Motor.FACCIONES_BANDIDAS[Mundo.azar(#Motor.FACCIONES_BANDIDAS)]
        local args = { requestId = "narrador:amenaza:" .. tostring(floor(Mundo.horas() * 100)) .. ":" .. Mundo.azar(9999),
            x = ox, y = oy, z = 0, mode = "hunt", radius = 6, distance = 0, separation = 1, atomicGroup = true,
            persistent = false, factionId = faccion, count = n, hostileOverride = true, playerKeepOut = 12,
            targetUsername = Mundo.nombreJugador(grupo[1]) }
        local ok = Mundo.spawnGrupo(grupo[1], args, nil)
        if not ok then
            Mundo.oleada(x, y, 0, floor(puntos * 1.6), 25, 40, hacia)
            resumen = "una horda (los bandidos no llegaron)"
        else
            resumen = n .. " bandidos"
        end
    end
    local e = A.st()
    e.historial[#e.historial + 1] = { h = floor(Mundo.horas()), tipo = pend.tipo, puntos = floor(puntos), juntos = pend.juntos, resumen = resumen }
    while #e.historial > 20 do table.remove(e.historial, 1) end
    Mundo.log("amenaza " .. pend.tipo .. " (" .. tostring(resumen) .. ") para " .. table.concat(pend.jugadores, ", "))
    return true
end

-- Cada cuanto: sandbox HorasEntreAmenazas, con el estilo del narrador y la tension.
function A.intervalo()
    local base = tonumber(Mundo.sandbox("HorasEntreAmenazas", 36)) or 36
    local D = Narrador.Director
    local estilo = D ~= nil and D.estilo ~= nil and D.estilo() or { hueco = 1 }
    local h = base * (estilo.hueco or 1)
    if estilo.volado then h = h * (0.4 + Mundo.azar(12) / 10) end
    return h
end

function A.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 or not A.activas() then return end
    local e = A.st()
    local ahora = Mundo.horas()
    for i = #e.pendientes, 1, -1 do
        local p = e.pendientes[i]
        if ahora >= p.llega then
            local ok, hecho = pcall(A.lanzar, p)
            if (ok and hecho) or ahora - p.llega > 2 then table.remove(e.pendientes, i) end
        end
    end
    if ahora / 24 < (tonumber(Mundo.sandbox("DiaInicio", 1)) or 1) + 1 then return end
    if e.proxima == nil then e.proxima = ahora + A.intervalo() end
    if ahora < e.proxima or #e.pendientes > 0 then return end
    local D = Narrador.Director
    -- Con la tension muy alta se posterga un poco (salvo el Implacable).
    if D ~= nil and D.tension ~= nil and D.tension() >= 85 and D.estilo().id ~= "implacable" then
        e.proxima = ahora + 4
        return
    end
    local vivos = {}
    for _, p in ipairs(Mundo.jugadores()) do if Mundo.vivo(p) then vivos[#vivos + 1] = p end end
    if #vivos == 0 then return end
    for _, grupo in ipairs(A.agrupar(vivos)) do A.programar(grupo) end
    e.proxima = ahora + A.intervalo()
end

function A.vista(v)
    local e = A.st()
    v.amenazas = { historial = e.historial }
end

Motor.tickExtra.amenazas = A.tick
Motor.vistaExtra[#Motor.vistaExtra + 1] = A.vista
Motor.comandosAdmin.amenazaAhora = function(jugador, args)
    local vivos = {}
    for _, p in ipairs(Mundo.jugadores()) do if Mundo.vivo(p) then vivos[#vivos + 1] = p end end
    local partes = {}
    for _, grupo in ipairs(A.agrupar(vivos)) do
        local p = A.programar(grupo, args.tipo)
        if p ~= nil then
            p.llega = Mundo.horas() + 0.05
            partes[#partes + 1] = p.tipo .. " para " .. table.concat(p.jugadores, ", ") .. " (presupuesto " .. floor(p.puntos)
                .. ", poder " .. string.format("%.2f", p.poder) .. ")"
        end
    end
    return #partes > 0 and table.concat(partes, "\n") or "No hay jugadores."
end

return A
