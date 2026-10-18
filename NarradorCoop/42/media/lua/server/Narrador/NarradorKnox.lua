-- Narrador Co-op (servidor): reputacion global en Knox.
-- Cada grupo tiene un valor (de -300 a 300) que sube ayudando gente y cumpliendo encargos y
-- baja haciendo dano. Se alimenta de las huellas (lo que haces en las historias y en los
-- encargos: "cumpliste", "abandonaste"...). Al cambiar de nivel sale un aviso y queda en el diario.
-- Niveles y puntos: shared/Narrador/NarradorKnoxDefs.lua.
--
-- Ganchos para las historias (ver ROADMAP):
--   * Al llegar por primera vez a KD.BANDIDO_UMBRAL (-5) o menos queda la memoria
--     "knox_bandido_<grupo>" = "listo" (ahi se engancha el camino del bandido).
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

function KX.nivelDe(grupo)
    return (KD.nivel(KX.valor(grupo)))
end

-- Ya no lo quieren en ningun campamento (nivel -4 o peor).
function KX.despreciado(grupo)
    return grupo ~= nil and KX.nivelDe(grupo) <= KD.DESPRECIO
end

function KX.despreciadoJugador(jugador)
    return jugador ~= nil and KX.despreciado(Mundo.grupoDe(jugador))
end

function KX.sumar(grupo, cantidad, motivo)
    cantidad = tonumber(cantidad) or 0
    if grupo == nil or cantidad == 0 then return end
    local antes = KX.valor(grupo)
    -- Con mala fama, solo salvar gente o acabar con bandidos la mejora.
    if cantidad > 0 and antes < 0 and not KD.REDIMEN[tostring(motivo)] then return end
    local despues = math.max(KD.MIN, math.min(KD.MAX, antes + cantidad))
    KX.tabla()[tostring(grupo)] = despues
    local nAntes = KD.nivel(antes)
    local nDespues, titulo = KD.nivel(despues)
    if nDespues ~= nAntes then
        avisarGrupo(grupo, KD.AVISOS[nDespues] or ("En Knox ahora te dicen: " .. titulo .. "."))
        anotar("En Knox ahora me dicen " .. titulo .. ".")
    end
    -- Primera vez en KD.BANDIDO_UMBRAL o menos: queda listo el gancho del bandido.
    local st = Motor.estado()
    if despues <= KD.BANDIDO_UMBRAL and st.memoria["knox_bandido_" .. tostring(grupo)] == nil then
        st.memoria["knox_bandido_" .. tostring(grupo)] = "listo"
        Mundo.log("knox: " .. tostring(grupo) .. " llego a " .. KD.BANDIDO_UMBRAL .. " (gancho del bandido listo)")
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

-- Encargos y misiones cumplidos: segun su dificultad (facil 4, medio 6, dificil 10, ultra 15).
Motor.alTerminar[#Motor.alTerminar + 1] = function(inst, def, final)
    local nivel = inst.vars ~= nil and inst.vars.nivel or nil
    local n = nivel ~= nil and KD.DIFICULTAD[tostring(nivel)] or nil
    if n == nil then return end
    local R = Narrador.Reputacion
    local exito = (R ~= nil and R.EXITOS ~= nil and R.EXITOS[final]) or string.sub(tostring(final), 1, 14) == "final_cumplido"
    if not exito then return end
    for _, g in ipairs(KX.gruposDeFin(inst)) do pcall(KX.sumar, g, n, "encargo " .. tostring(nivel)) end
end

-- Matar a un NPC fuera de las historias: -5. Los que son parte de una historia (o bandidos
-- hostiles) no cuentan: pueden ser accidentes o defensa propia.
function KX.npcEnHistoria(uid)
    local st = Motor.estado()
    for _, id in ipairs(st.orden or {}) do
        local inst = st.arcos[id]
        for _, g in pairs(inst ~= nil and inst.grupos or {}) do
            if g.miembros ~= nil and g.miembros[uid] ~= nil then return true end
        end
    end
    local C = Narrador.Contactos
    if C ~= nil and C.inmunes ~= nil and C.inmunes()[tostring(uid)] ~= nil then return true end
    return false
end

function KX.esHostil(uid)
    local actor = Mundo.actor(uid)
    local m = actor ~= nil and actor.memory or nil
    if type(m) ~= "table" then return false end
    local faccion = tostring(m.factionId or m.faction or "")
    for _, f in ipairs(Motor.FACCIONES_BANDIDAS or {}) do if faccion == f then return true end end
    return m.hostile == true or m.hostileOverride == true
end

function KX.alMorirNpc(cuerpo, uid, asesino)
    if uid == nil or asesino == nil or not Mundo.esJugador(asesino) then return end
    if KX.npcEnHistoria(uid) or KX.esHostil(uid) then return end
    KX.sumar(Mundo.grupoDe(asesino), KD.MATAR, "mataste a un npc")
end

-- Grupos de un arco (los del dueno o los conectados).
function KX.gruposDeFin(inst)
    local H = Narrador.Huellas
    if H ~= nil and H.gruposDe ~= nil then return H.gruposDe(inst) end
    return {}
end

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
    -- El evento de muertes de A-Life puede existir recien al arrancar la partida.
    local function muertes()
        if KX._muertes or Events.ProjectALife_NpcDied == nil or Events.ProjectALife_NpcDied.Add == nil then return end
        Events.ProjectALife_NpcDied.Add(function(...) pcall(KX.alMorirNpc, ...) end)
        KX._muertes = true
    end
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(muertes) end
    if Events.OnServerStarted ~= nil then Events.OnServerStarted.Add(muertes) end
    muertes()
end

-- Lugar tomado por bandidos que queda limpio: cuenta como acabar con bandidos.
function KX.bandidosLimpios(jugador)
    if jugador == nil then return end
    KX.sumar(Mundo.grupoDe(jugador), KD.BANDIDOS, "bandidos")
end

return KX
