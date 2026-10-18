-- Narrador Co-op (servidor): consecuencias de decisiones que no viven dentro de una historia.
--   * El estanque de la Misia Rosa (estanque_rosewood = "defendido", su capitulo 3): cada
--     CO.CADA_ESTANQUE horas, cuando alguien pasa por la bencinera, la Misia Rosa le deja un bidon
--     lleno de bencina del estanque que defendio.
--   * El arsenal de Louisville (arsenal = arma, traje o auto): la primera vez que pasas cerca de
--     un misionero despues, te comenta lo que sacaste (memoria arsenal_comentado).
--   * Las consecuencias tardias de las historias cortas (denise, lucas, trueque, alijo,
--     desertor) son historias propias en shared/Narrador/Arcos/ConsecuenciasExtra.lua.
-- Las otras consecuencias estan donde pasan: la radio de la Chela (radio_westpoint) en
-- NarradorAmenazas, la desconfianza de Pereira (pereira_desconfia) en NarradorBandido, y lo de
-- los Bell (bell_culpa, curandero_falso) en las charlas de Sous, en Meulen y en el doctor Hartmann.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/Arcos/ConsecuenciasExtra"

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

-- Lo que dice cada misionero del arsenal, segun lo que sacaste.
CO.RADIO_ARSENAL = 12
CO.ARSENAL = {
    arma = {
        muldraugh = "Me contaron que del arsenal de Louisville sacaste un fierro de esos que no se ven. Cuidalo, soldado. Y no me apuntes con el.",
        westpoint = "Asi que sacaste un arma del arsenal. Mi viejo decia que un arma buena no te hace bueno a ti. Pienso en eso.",
        riverside = "Supe lo del arma del arsenal. Que el Senor te guie la mano, hijo, porque esa cosa no perdona.",
        rosewood = "Con esa arma que sacaste de Louisville ya nadie te va a venir a robar bencina, mijo.",
    },
    traje = {
        muldraugh = "Ese traje del arsenal es de los que usaban los de arriba, no la tropa. Te queda bien. Mejor que a ellos.",
        westpoint = "Elegiste el traje y no el arma. Eso dice algo de ti, mijo. Algo bueno.",
        riverside = "Te protegiste en vez de armarte. Hay sabiduria en eso, aunque no lo parezca.",
        rosewood = "Con ese traje pareces astronauta, mijo. Pero vivo, que es lo que importa.",
    },
    auto = {
        muldraugh = "Escuche el motor desde lejos. Asi que esas eran las llaves del arsenal. Ojala corra mas que los muertos.",
        westpoint = "Ese auto del arsenal mete un ruido... Pasa a verme mas seguido ahora que tienes ruedas.",
        riverside = "Un vehiculo del ejercito en manos de buena gente. Dios escribe derecho con renglones torcidos.",
        rosewood = "Ese auto del arsenal tiene que tomar harta bencina. Ya sabes donde llenarlo, mijo.",
    },
}

function CO.arsenal()
    local m = Motor.estado().memoria
    local lineas = m.arsenal ~= nil and CO.ARSENAL[m.arsenal] or nil
    if lineas == nil or m.arsenal_comentado then return end
    for id, texto in pairs(lineas) do
        -- Solo si el misionero esta parado ahi (vivo y con su NPC puesto).
        local l = C.desbloqueado(id) and C.estado(id).uid ~= nil and C.lugar(id) or nil
        if l ~= nil and Mundo.jugadorCerca(l.x, l.y, CO.RADIO_ARSENAL) ~= nil then
            C.decir(id, texto)
            m.arsenal_comentado = id
            Mundo.log("el misionero de " .. id .. " comento el arsenal (" .. tostring(m.arsenal) .. ")")
            return
        end
    end
end

function CO.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    pcall(CO.estanque)
    pcall(CO.arsenal)
end
Motor.tickExtra.consecuencias = CO.tick

return CO
