-- Narrador Co-op (servidor): consecuencias de decisiones que no viven dentro de una historia.
--   * El estanque de la Misia Rosa (estanque_rosewood = "defendido", su capitulo 3): cada
--     CO.CADA_ESTANQUE horas, cuando alguien pasa por la bencinera, la Misia Rosa le deja un bidon
--     lleno de bencina del estanque que defendio.
-- Las otras consecuencias estan donde pasan: la radio de la Chela (radio_westpoint) en
-- NarradorAmenazas, la desconfianza de Pereira (pereira_desconfia) en NarradorBandido, y lo de
-- los Bell (bell_culpa, curandero_falso) en las charlas de Sous, en Maulen y en el doctor Hartmann.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos

local CO = Narrador.Consecuencias or {}
Narrador.Consecuencias = CO

CO.CADA_ESTANQUE = 72
CO.RADIO_ESTANQUE = 40
CO.BIDON = { "Base.PetrolCan", "Base.JerryCan" }

function CO.estanque()
    local m = Motor.estado().memoria
    if m.estanque_rosewood ~= "defendido" then return end
    -- Solo si la Misia Rosa sigue a cargo de su bencinera.
    local D = Narrador.Dominios
    if (D ~= nil and D.dominio("rosewood") ~= "mision") or not C.desbloqueado("rosewood") then return end
    local ahora = Mundo.horas()
    if m.estanque_ultima ~= nil and ahora - m.estanque_ultima < CO.CADA_ESTANQUE then return end
    local l = C.lugar("rosewood")
    if l == nil or Mundo.jugadorCerca(l.x, l.y, CO.RADIO_ESTANQUE) == nil then return end
    local item = Mundo.crearItem(CO.BIDON)
    if item == nil then return end
    Mundo.llenarBencina(item)
    Mundo.dejarEnSuelo(l.x, l.y, l.z or 0, item)
    m.estanque_ultima = ahora
    C.decir("rosewood", "Del estanque que defendiste, mijo. Lleno, como debe ser. Vuelve en unos dias que hay mas.")
    Mundo.log("la Misia Rosa dejo un bidon del estanque")
end

function CO.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    pcall(CO.estanque)
end
Motor.tickExtra.consecuencias = CO.tick

return CO
