-- Narrador Co-op (servidor): reputacion global en Knox.
-- Cada grupo tiene un valor (de -300 a 300) que sube ayudando gente y cumpliendo encargos y
-- baja haciendo dano. Se alimenta de las huellas (lo que haces en las historias y en los
-- encargos: "cumpliste", "abandonaste"...). Al cambiar de nivel sale un aviso y queda en el diario.
-- Niveles y puntos: shared/Narrador/NarradorKnoxDefs.lua.
--
-- Ganchos para las historias (ver ROADMAP):
--   * Al llegar por primera vez a "Rumores negativos" queda la memoria "knox_bandido_<grupo>" =
--     "listo" (ahi se engancharia el bandido que te ofrece trabajo).
--   * Acciones de arco: { "knox", cantidad = -30, motivo = "..." } y
--     { "knox_reiniciar", texto = "..." } (redencion: vuelve a 0).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorKnoxDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"

local KD, Mundo, Motor = Narrador.KnoxDefs, Narrador.Mundo, Narrador.Motor
local floor = math.floor

local KX = Narrador.Knox or {}
Narrador.Knox = KX

function KX.tabla()
    local st = Motor.estado()
    st.knox = st.knox or {}
    return st.knox
end

function KX.valor(grupo)
    return tonumber(KX.tabla()[tostring(grupo)]) or 0
end

local function avisarGrupo(grupo, texto)
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.grupoDe(p) == grupo then Motor.enviar(p, "aviso", { texto = texto }) end
    end
end

local function anotar(texto)
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = texto, arco = "Knox" }
    while #st.diario > (Motor.MAX_DIARIO_GLOBAL or 40) do table.remove(st.diario, 1) end
end

function KX.sumar(grupo, cantidad, motivo)
    cantidad = tonumber(cantidad) or 0
    if grupo == nil or cantidad == 0 then return end
    local antes = KX.valor(grupo)
    local despues = math.max(KD.MIN, math.min(KD.MAX, antes + cantidad))
    KX.tabla()[tostring(grupo)] = despues
    local nAntes = KD.nivel(antes)
    local nDespues, titulo = KD.nivel(despues)
    if nDespues ~= nAntes then
        avisarGrupo(grupo, KD.AVISOS[nDespues] or ("En Knox ahora te dicen: " .. titulo .. "."))
        anotar("En Knox ahora me dicen " .. titulo .. ".")
        -- Primera vez con mala fama de verdad: queda listo el gancho del bandido.
        local st = Motor.estado()
        if nDespues <= -2 and st.memoria["knox_bandido_" .. tostring(grupo)] == nil then
            st.memoria["knox_bandido_" .. tostring(grupo)] = "listo"
            Mundo.log("knox: " .. tostring(grupo) .. " llego a Rumores negativos (gancho del bandido listo)")
        end
    end
    Mundo.log("knox " .. tostring(grupo) .. ": " .. antes .. " -> " .. despues .. " (" .. tostring(motivo) .. ")")
end

function KX.reiniciar(grupo, texto)
    KX.tabla()[tostring(grupo)] = 0
    if texto ~= nil then avisarGrupo(grupo, texto) end
    anotar("En Knox volvieron a empezar conmigo. Yo no.")
end

-- ---------------------------------------------------------------------------
-- Ganchos
-- ---------------------------------------------------------------------------

-- Cada huella mueve la reputacion de Knox de los grupos a los que se le anota.
function KX.enganchar()
    local H = Narrador.Huellas
    if H == nil or type(H.registrar) ~= "function" or H._knox then return end
    H._knox = true
    local original = H.registrar
    H.registrar = function(inst, acto, texto, extra)
        local h = original(inst, acto, texto, extra)
        local n = KD.ACTOS[tostring(acto)]
        if n ~= nil and h ~= nil then
            for _, g in ipairs(h.grupos or {}) do pcall(KX.sumar, g, n, acto) end
        end
        return h
    end
end

-- Los encargos cumplidos ya dejan la huella "cumpliste" (NarradorHuellas), asi que suman solos.

-- Grupos de un arco (los del dueno o los conectados).
local function gruposDe(inst)
    local H = Narrador.Huellas
    if H ~= nil and H.gruposDe ~= nil then return H.gruposDe(inst) end
    local lista, vistos = {}, {}
    for _, p in ipairs(Mundo.jugadores()) do
        local g = Mundo.grupoDe(p)
        if not vistos[g] then vistos[g] = true; lista[#lista + 1] = g end
    end
    return lista
end

-- { "knox", cantidad = -30, motivo = "..." }
Motor.inmediatas.knox = function(inst, a)
    for _, g in ipairs(gruposDe(inst)) do KX.sumar(g, a.cantidad, a.motivo or inst.def) end
    return true
end

-- { "knox_reiniciar", texto = "La gente perdonara tus pecados..." }
Motor.inmediatas.knox_reiniciar = function(inst, a)
    for _, g in ipairs(gruposDe(inst)) do KX.reiniciar(g, a.texto ~= nil and Motor.texto(inst, a.texto) or nil) end
    return true
end

-- {"knox_minimo", n} / {"knox_maximo", n}: condiciones para historias.
Motor.condiciones.knox_minimo = function(inst, c)
    for _, g in ipairs(gruposDe(inst)) do if KX.valor(g) >= (tonumber(c[2]) or 0) then return true end end
    return false
end
Motor.condiciones.knox_maximo = function(inst, c)
    for _, g in ipairs(gruposDe(inst)) do if KX.valor(g) <= (tonumber(c[2]) or 0) then return true end end
    return false
end

-- Vista para el diario.
Motor.vistaExtra[#Motor.vistaExtra + 1] = function(v)
    local lista = {}
    for grupo, valor in pairs(KX.tabla()) do
        local nivel, titulo = KD.nivel(valor)
        lista[grupo] = { valor = valor, nivel = nivel, titulo = titulo }
    end
    v.knox = lista
end

-- Admin: sumar o restar reputacion de Knox para probar.
Motor.comandosAdmin.knoxSumar = function(jugador, args)
    local g = Mundo.grupoDe(jugador)
    KX.sumar(g, tonumber(args.cantidad) or 20, "admin")
    local _, titulo = KD.nivel(KX.valor(g))
    return "Knox: " .. KX.valor(g) .. " (" .. titulo .. ")"
end

KX.enganchar()
if Events ~= nil and not KX._eventos then
    KX._eventos = true
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(KX.enganchar) end
    if Events.OnServerStarted ~= nil then Events.OnServerStarted.Add(KX.enganchar) end
end

return KX
