-- Narrador Co-op (servidor): eventos fortuitos de Eduardo (shared/Narrador/Arcos/EduardoEventos.lua).
-- Una tirada por dia de juego, con chance EV.BASE % + EV.POR_DIA % por dia de partida (tope
-- EV.TOPE %) y al menos EV.ENTRE horas entre uno y otro. Solo despues de conocerlo (memoria
-- "eduardo_conocido"), mientras siga vivo y no estes del lado de los bandidos.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/Arcos/EduardoEventos"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local floor = math.floor

local EV = Narrador.EduardoEventos or {}
Narrador.EduardoEventos = EV

EV.BASE, EV.POR_DIA, EV.TOPE, EV.ENTRE = 5, 1, 40, 72

function EV.puede(m)
    if m.eduardo_conocido ~= true or m.eduardo_muerto_duelo == true then return false end
    -- Del lado de los bandidos, Eduardo no te viene a pedir ayuda (te viene a buscar).
    if m.bandido == "pereira" or m.fin ~= nil then return false end
    if Motor.activos("eduardo_evento") > 0 then return false end
    return true
end

function EV.revisar()
    local m = Motor.estado().memoria
    if not EV.puede(m) then return end
    local ahora = Mundo.horas()
    local dia = floor(ahora / 24)
    if m.eduardo_ev_dia == dia then return end
    m.eduardo_ev_dia = dia
    if m.eduardo_ev_hora ~= nil and ahora - m.eduardo_ev_hora < EV.ENTRE then return end
    local chance = math.min(EV.TOPE, EV.BASE + EV.POR_DIA * dia)
    if Mundo.azar(100) > chance then return end
    local j = Mundo.jugadorAlAzar()
    if j == nil then return end
    local grupo, nombre = Mundo.grupoDe(j)
    local inst = Motor.iniciar("eduardo_evento", j, { vars = { dueno = grupo, dueno_nombre = nombre } })
    if inst ~= nil then m.eduardo_ev_hora = ahora end
end

function EV.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Mundo.hayALife() then return end
    pcall(EV.revisar)
end

Motor.tickExtra.eduardo_eventos = EV.tick

return EV
