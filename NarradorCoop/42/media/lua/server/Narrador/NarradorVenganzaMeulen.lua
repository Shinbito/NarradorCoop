-- Narrador Co-op (servidor): lanza "La venganza de Meulen" (shared/Narrador/Arcos/VenganzaMeulen.lua).
-- Una sola vez, VM.ESPERA horas despues de que se sabe que Meulen Canupan murio:
--   * en Sous: la historia termino despues de matarlo en el escondite (sous.final = final_aliados,
--     final_mentira o final_te_quedaste) y no lo dejaste ir (maulen_salvado);
--   * en el camino del bandido, con Meulen de jefe del patio: la redencion (bandido = redimido)
--     o la reconquista (fin = reconquista).
-- La hora de la muerte se anota la primera vez que se ve (memoria "meulen_muerte_hora").
-- Con alguien conectado (si puede, uno con refugio) y sin otra historia del bandido en curso.
-- Tambien la accion diferida {"cuerpo", lugar}: un cadaver con sangre en el lugar.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/Arcos/VenganzaMeulen"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor

local VM = Narrador.VenganzaMeulen or {}
Narrador.VenganzaMeulen = VM

VM.ID = "venganza_meulen"
VM.ESPERA = 120
-- Finales de Sous a los que se llega despues de matar a Meulen en el escondite.
VM.FINALES_SOUS = { final_aliados = true, final_mentira = true, final_te_quedaste = true }

function VM.meulenMuerto(m)
    if VM.FINALES_SOUS[tostring(m["sous.final"])] and m.maulen_salvado ~= true then return true end
    if m.bandido_jefe == "maulen" and (m.bandido == "redimido" or m.fin == "reconquista") then return true end
    return false
end

function VM.revisar()
    local m = Motor.estado().memoria
    if m.meulen_venganza ~= nil or m.meulen_final ~= nil then return end
    if not VM.meulenMuerto(m) then return end
    m.meulen_muerte_hora = m.meulen_muerte_hora or Mundo.horas()
    if Mundo.horas() - m.meulen_muerte_hora < VM.ESPERA then return end
    if Motor.activos(VM.ID) > 0 then return end
    local BA = Narrador.Bandido
    if BA ~= nil and BA.enCurso ~= nil and BA.enCurso() then return end
    local j = Mundo.jugadorConRefugio() or Mundo.jugadorAlAzar()
    if j == nil then return end
    local grupo, nombre = Mundo.grupoDe(j)
    local inst, razon = Motor.iniciar(VM.ID, j, { vars = { dueno = grupo, dueno_nombre = nombre } })
    if inst == nil then
        Mundo.log("no se pudo lanzar " .. VM.ID .. ": " .. tostring(razon))
        return
    end
    m.meulen_venganza = "lanzada"
end

function VM.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Mundo.hayALife() then return end
    pcall(VM.revisar)
end

Motor.tickExtra.venganzaMeulen = VM.tick

-- {"cuerpo", lugar, radio}: un cadaver con sangre junto al lugar (cuando esta cargado).
-- {"olvidar_grupo", grupo}: retira a los que queden del grupo y lo borra, para que la proxima
-- vez que la historia pida ese grupo aparezca uno nuevo (los matones que te siguen mandando).
Motor.inmediatas.olvidar_grupo = function(inst, a)
    if inst.grupos[a.grupo] ~= nil then
        pcall(Motor.retirarGrupo, inst, a.grupo)
        inst.grupos[a.grupo] = nil
    end
    return true
end

Motor.diferidas.cuerpo = function(inst, p, l)
    local sq = Mundo.cargado(l.x + 1, l.y, l.z)
    if sq == nil then return false end
    if createRandomDeadBody ~= nil then pcall(createRandomDeadBody, sq, 10) end
    if addBloodSplat ~= nil then pcall(addBloodSplat, sq, 8) end
    return true
end

return VM
