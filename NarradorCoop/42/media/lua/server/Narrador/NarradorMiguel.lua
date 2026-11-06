-- Narrador Co-op (servidor): Miguel Angel en apuros (shared/Narrador/Arcos/MiguelAngel.lua).
-- Una tirada por dia de juego despues de traerlo a la comisaria (memoria "miguel_angel"), con
-- chance MG.BASE % + MG.POR_DIA % por dia de partida (tope MG.TOPE %) y al menos MG.ENTRE horas
-- entre uno y otro. Solo lejos de Muldraugh (MG.LEJOS_COMISARIA), para que no se cruce con el
-- Miguel Angel que vive en la comisaria, y nunca junto con un evento de Eduardo.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/Arcos/MiguelAngel"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local floor = math.floor

local MG = Narrador.MiguelEventos or {}
Narrador.MiguelEventos = MG

MG.BASE, MG.POR_DIA, MG.TOPE, MG.ENTRE = 4, 0.5, 25, 96
MG.LEJOS_COMISARIA = 250

function MG.puede(m)
    if m.miguel_angel == nil then return false end
    if m.bandido == "pereira" or m.fin ~= nil or m.knox_conquistado == true then return false end
    if Motor.activos("miguel_evento") > 0 or Motor.activos("eduardo_evento") > 0 then return false end
    return true
end

function MG.revisar()
    local m = Motor.estado().memoria
    if not MG.puede(m) then return end
    local ahora = Mundo.horas()
    local dia = floor(ahora / 24)
    if m.miguel_ev_dia == dia then return end
    m.miguel_ev_dia = dia
    if m.miguel_ev_hora ~= nil and ahora - m.miguel_ev_hora < MG.ENTRE then return end
    local chance = math.min(MG.TOPE, MG.BASE + MG.POR_DIA * dia)
    if Mundo.azar(100) > chance then return end
    local j = Mundo.jugadorAlAzar()
    if j == nil then return end
    local d = C ~= nil and C.distancia ~= nil and C.distancia("muldraugh", j) or nil
    if d ~= nil and d < MG.LEJOS_COMISARIA then return end
    local grupo, nombre = Mundo.grupoDe(j)
    local inst = Motor.iniciar("miguel_evento", j, { vars = { dueno = grupo, dueno_nombre = nombre } })
    if inst ~= nil then m.miguel_ev_hora = ahora end
end

function MG.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Mundo.hayALife() then return end
    pcall(MG.revisar)
end

Motor.tickExtra.miguel_eventos = MG.tick

return MG
