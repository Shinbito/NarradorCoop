-- Narrador Co-op (servidor): los Bell en tu refugio, despues de su historia.
-- Si sobreviven (salvados, era gripe, se curo solo, o con uno transformado), se quedan a vivir en
-- el refugio: son inmortales, ayudan a limpiar la zona y conversan. Cuando ven venir una horda o
-- un ataque (el aviso de una amenaza, o una oleada que aparece cerca del refugio), arrancan para
-- mantenerse con vida: desaparecen y vuelven unas horas despues, cuando ya paso y hay alguien
-- cerca, con algo chico que encontraron en el camino.
-- Un Bell puede irse para siempre: en la reconquista reemplaza a un misionero que murio
-- (B.sacar, ver NarradorDominios).
-- Estado: Motor.estado().bell = { x, y, z, charla, memoria, miembros = { [rol] = { uid } },
--   escondidos = { vuelven = hora }, alertas = { { x, y, h } } }.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorAmenazas"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local floor = math.floor

local B = Narrador.Bell or {}
Narrador.Bell = B

B.ORDEN = { "padre", "madre", "hijo" }
B.PERFILES = { padre = "k93_bell_family_01", madre = "k93_bell_family_02", hijo = "k93_bell_family_04" }
B.NOMBRES = { padre = { "Daniel", "Bell" }, madre = { "Yvonne", "Bell" }, hijo = { "Wade", "Bell" } }
B.RADIO_ALERTA = 200   -- una amenaza o una oleada a esta distancia del refugio los hace arrancar
B.HORAS_ALERTA = 1     -- una oleada cuenta como peligro durante esta cantidad de horas
B.HORAS_FUERA = { 6, 12 }
B.RADIO_VOLVER = 120   -- vuelven cuando hay un jugador a esta distancia del refugio
B.ZONA = { radio = 30, max = 2 }
B.BANDERAS = { persistent = true, invulnerable = true, stationary = false, leashRadius = 15 }
-- Lo que traen al volver: dos cosas al azar.
B.BOTIN = {
    { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Bandage" }, { "Base.Pills" },
    { "Base.ShotgunShells" }, { "Base.NailsBox", "Base.Nails" }, { "Base.Disinfectant", "Base.AlcoholBandage" },
}
B.AVISO_HUYEN = "Los Bell vieron venir el peligro y arrancaron del refugio. Daniel dejo dicho que vuelven cuando se calme."
B.AVISO_VUELVEN = "Los Bell volvieron al refugio. Trajeron algo que encontraron en el camino."

-- Finales de los Bell en que se quedan en el refugio, y quienes quedan en partidas de antes
-- (sin st.bell): con uno transformado no se sabe cual, asi que queda solo Daniel, que nunca se
-- infecta.
B.QUEDAN = {
    salvados = B.ORDEN, era_gripe = B.ORDEN, se_curo_solo = B.ORDEN,
    falso_remedio = { "padre" }, enganados = { "padre" }, transformado = { "padre" },
}

function B.st()
    return Motor.estado().bell
end

-- Roles de los Bell que viven en el refugio (no los que se fueron de misioneros).
function B.vivos()
    local b, lista = B.st(), {}
    if b == nil then return lista end
    for _, rol in ipairs(B.ORDEN) do
        if b.miembros[rol] ~= nil then lista[#lista + 1] = rol end
    end
    return lista
end

-- Un Bell deja el refugio para siempre (pasa a ser misionero).
function B.sacar(rol)
    local b = B.st()
    local m = b ~= nil and b.miembros[rol] or nil
    if m == nil then return end
    if m.uid ~= nil then pcall(Mundo.retirar, m.uid) end
    b.miembros[rol] = nil
end

-- {"bell_quedarse", grupo, lugar, charla}: los Bell vivos del grupo se quedan en el refugio.
Motor.inmediatas.bell_quedarse = function(inst, a)
    local g = inst.grupos[a.grupo]
    local l = inst.lugares[a.lugar or "refugio"]
    if l == nil then return true end
    local b = { x = floor(l.x), y = floor(l.y), z = floor(l.z or 0), charla = a.charla, memoria = {}, miembros = {}, alertas = {} }
    for uid, m in pairs(g ~= nil and g.miembros or {}) do
        if m.vivo and B.NOMBRES[m.rol] ~= nil then b.miembros[m.rol] = { uid = uid } end
    end
    Motor.estado().bell = b
    for _, m in pairs(b.miembros) do pcall(Mundo.banderas, m.uid, B.BANDERAS, { x = b.x, y = b.y, z = b.z }) end
    return true
end

-- Partidas de antes: los Bell como "residentes" del motor (final del engano) o sin nada guardado.
function B.migrar()
    local st = Motor.estado()
    if st.bell ~= nil then return end
    local quedan = B.QUEDAN[tostring(st.memoria.bell)]
    if quedan == nil then return end
    local r = st.residentes.bell
    local b = { charla = r ~= nil and r.charla or "bell_refugio", memoria = {}, miembros = {}, alertas = {} }
    if r ~= nil and r.zona ~= nil then
        b.x, b.y, b.z = r.zona.x, r.zona.y, r.zona.z or 0
        for uid, m in pairs(r.miembros) do
            if not m.muerto and B.NOMBRES[m.rol] ~= nil then b.miembros[m.rol] = { uid = uid } end
        end
        st.residentes.bell = nil
    else
        local j = Mundo.jugadorConRefugio()
        local ref = j ~= nil and Mundo.refugioDe(j) or nil
        if ref == nil then return end
        b.x, b.y, b.z = floor(ref.x), floor(ref.y), floor(ref.z or 0)
        for _, rol in ipairs(quedan) do b.miembros[rol] = { uid = nil } end
    end
    st.bell = b
end

local function cerca(x, y, b)
    local dx, dy = x - b.x, y - b.y
    return dx * dx + dy * dy <= B.RADIO_ALERTA * B.RADIO_ALERTA
end

-- Hay peligro cerca del refugio: una amenaza avisada o una oleada reciente.
function B.peligro(b)
    local A = Narrador.Amenazas
    if A ~= nil and A.st ~= nil then
        for _, p in ipairs(A.st().pendientes) do
            if p.x ~= nil and cerca(p.x, p.y, b) then return true end
        end
    end
    local ahora = Mundo.horas()
    for i = #b.alertas, 1, -1 do
        local al = b.alertas[i]
        if ahora - al.h > B.HORAS_ALERTA then table.remove(b.alertas, i)
        elseif cerca(al.x, al.y, b) then return true end
    end
    return false
end

-- Las oleadas y los corredores que aparecen cerca del refugio cuentan como peligro.
for _, nombre in ipairs({ "oleada", "corredores" }) do
    local original = Mundo[nombre]
    Mundo[nombre] = function(x, y, ...)
        local b = Motor.estado ~= nil and Motor.estado().bell or nil
        if b ~= nil and x ~= nil and y ~= nil and b.x ~= nil then
            b.alertas = b.alertas or {}
            b.alertas[#b.alertas + 1] = { x = floor(x), y = floor(y), h = Mundo.horas() }
        end
        return original(x, y, ...)
    end
end

local function avisarCerca(b, texto)
    for _, p in ipairs(Mundo.jugadores()) do
        local x, y = Mundo.posicion(p)
        if x ~= nil and math.abs(x - b.x) + math.abs(y - b.y) <= 400 then Motor.enviar(p, "aviso", { texto = texto }) end
    end
end

function B.huir(b)
    for _, m in pairs(b.miembros) do
        if m.uid ~= nil then pcall(Mundo.retirar, m.uid) end
        m.uid, m.pidiendo = nil, nil
    end
    local h = B.HORAS_FUERA
    b.escondidos = { vuelven = Mundo.horas() + h[1] + Mundo.azar(h[2] - h[1]) }
    b.botin = true
    avisarCerca(b, B.AVISO_HUYEN)
    Mundo.log("los Bell arrancaron del refugio")
end

function B.aparecer(b, rol, m, jugador)
    local ang = (Mundo.azar(360) / 180) * math.pi
    local x, y = floor(b.x + math.cos(ang) * 4), floor(b.y + math.sin(ang) * 4)
    m.intentos = (m.intentos or 0) + 1
    local requestId = "narrador:bell:" .. rol .. ":" .. tostring(m.intentos)
    local par = B.NOMBRES[rol]
    Mundo.reservarNombres(requestId, { [B.PERFILES[rol]] = { par[1], par[2] } })
    local args = {
        requestId = requestId, x = x, y = y, z = b.z or 0,
        mode = "guard", radius = 4, distance = 0, separation = 1, atomicGroup = true,
        persistent = true, stationary = false, invulnerable = true, leashRadius = B.BANDERAS.leashRadius,
        profileIds = { B.PERFILES[rol] }, count = 1, hostileOverride = false, playerStance = "friendly", playerKeepOut = 0,
    }
    local ok = Mundo.spawnGrupo(jugador, args, function(resultado)
        local uids = type(resultado) == "table" and resultado.actorUids or nil
        if type(uids) == "table" and uids[1] ~= nil and B.st() ~= nil and B.st().miembros[rol] == m then
            m.uid, m.pidiendo = uids[1], nil
            pcall(Mundo.nombrarActor, m.uid, par[1], par[2])
            pcall(Mundo.banderas, m.uid, B.BANDERAS, { x = b.x, y = b.y, z = b.z or 0 })
            Motor.actualizarPropios()
        else
            m.pidiendo = nil
        end
    end)
    if ok then m.pidiendo = Mundo.horas() end
end

function B.volver(b, jugador)
    b.escondidos = nil
    for rol, m in pairs(b.miembros) do
        if m.uid == nil then B.aparecer(b, rol, m, jugador) end
    end
    if b.botin then
        b.botin = nil
        local elegidos = {}
        for _ = 1, 2 do elegidos[#elegidos + 1] = B.BOTIN[Mundo.azar(#B.BOTIN)] end
        for _, tipos in ipairs(elegidos) do
            local item = Mundo.crearItem(tipos)
            if item ~= nil then Mundo.dejarEnSuelo(b.x, b.y, b.z or 0, item) end
        end
        avisarCerca(b, B.AVISO_VUELVEN)
    end
    Mundo.log("los Bell volvieron al refugio")
end

function B.tick()
    pcall(B.migrar)
    local b = B.st()
    if b == nil or b.x == nil or Motor.vacia(b.miembros) then return end
    local peligro = B.peligro(b)
    if b.escondidos == nil and peligro then
        B.huir(b)
        return
    end
    local jugador = Mundo.jugadorCerca(b.x, b.y, B.RADIO_VOLVER)
    if b.escondidos ~= nil then
        if Mundo.horas() >= b.escondidos.vuelven and not peligro and jugador ~= nil then B.volver(b, jugador) end
        return
    end
    -- Inmortales: si alguno no esta (se descargo o A-Life lo perdio), se vuelve a pedir.
    local presentes = {}
    for rol, m in pairs(b.miembros) do
        if m.uid ~= nil and not Mundo.actorVivo(m.uid) then m.uid = nil end
        if m.uid ~= nil then
            presentes[#presentes + 1] = { m.uid, rol, B.NOMBRES[rol][1] }
        elseif jugador ~= nil and (m.pidiendo == nil or Mundo.horas() - m.pidiendo > 0.25) then
            B.aparecer(b, rol, m, jugador)
        end
    end
    local charla, texto = Motor.charlaElegir(Narrador.Charlas ~= nil and Narrador.Charlas[b.charla] or nil, presentes, b.memoria, 10, 1.5)
    if charla ~= nil then Motor.decirUid(charla[1], charla[3], texto) end
    if Motor.minutosDesdeArranque % 10 == 0 and #presentes > 0 then
        Mundo.limpiarZona(b.x, b.y, B.ZONA.radio, B.ZONA.max)
        for _, p in ipairs(presentes) do
            pcall(Mundo.banderas, p[1], B.BANDERAS, { x = b.x, y = b.y, z = b.z or 0 })
            pcall(Mundo.nombrarActor, p[1], B.NOMBRES[p[2]][1], B.NOMBRES[p[2]][2])
        end
    end
end
Motor.tickExtra.bell = B.tick

-- Son NPCs del Narrador: A-Life no les pone frases y el cliente los trata como residentes.
Motor.propiosExtra = Motor.propiosExtra or {}
Motor.propiosExtra.bell = function(lista)
    local b = B.st()
    for _, m in pairs(b ~= nil and b.miembros or {}) do
        if m.uid ~= nil then lista[tostring(m.uid)] = true end
    end
end
Motor.vistaExtra[#Motor.vistaExtra + 1] = function(vista)
    local b = B.st()
    for _, m in pairs(b ~= nil and b.miembros or {}) do
        if m.uid ~= nil then vista.residentes[#vista.residentes + 1] = tostring(m.uid) end
    end
end

return B
