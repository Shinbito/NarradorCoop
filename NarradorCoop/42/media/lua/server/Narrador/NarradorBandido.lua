-- Narrador Co-op (servidor): el camino del bandido (shared/Narrador/Arcos/Bandido.lua).
-- Lanza los capitulos de la Sargento Pereira:
--   * El 1 (la nota en tu casa) la primera vez que un grupo conectado tiene la memoria
--     "knox_bandido_<grupo>" = "listo" (llego a -5 de Knox, ver NarradorKnox.lua).
--   * Del 2 al 5, cuando alguien vuelve al patio de trenes y pasaron BA.CADA horas desde el
--     anterior. Si rechazaste el primero, la puerta queda abierta: vuelve al patio.
--   * Con sospecha (misiones saboteadas), al volver al patio Pereira puede descubrirte:
--     BA.CHANCE_SOSPECHA % por cada sabotaje. Entonces manda cazadores (bandido_castigo).
--   * Si dejaste ir a Maulen en Sous (memoria "maulen_salvado"), BA.ESPERA_MAULEN horas despues
--     mata a Pereira y se queda con el patio (bandido_maulen): desde ahi el jefe es el
--     (memoria "bandido_jefe" = "maulen"), sin importar tu Knox.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/Arcos/Bandido"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos

local BA = Narrador.Bandido or {}
Narrador.Bandido = BA

BA.CADA = 12
BA.CHANCE_SOSPECHA = 30
BA.RADIO_PATIO = 40
BA.ESPERA_MAULEN = 72
BA.IDS = { "bandido_1", "bandido_2", "bandido_3", "bandido_4", "bandido_5", "bandido_castigo", "bandido_maulen" }
-- Variables del jefe del patio que reciben todos los capitulos.
BA.JEFES = {
    pereira = { jefe_perfil = "narrador_pereira_01", jefe_nombre = "la Sargento Pereira", jefe_corto = "Pereira" },
    maulen = { jefe_perfil = "narrador_pereira_maulen", jefe_nombre = "Maulen Callupan", jefe_corto = "Maulen" },
}
-- Con estos valores de la memoria "bandido" la historia ya termino.
BA.TERMINADA = { redimido = true, pereira = true, pereira_escapo = true }

function BA.enCurso()
    for _, id in ipairs(BA.IDS) do if Motor.activos(id) > 0 then return true end end
    return false
end

function BA.jefe()
    return Motor.estado().memoria.bandido_jefe == "maulen" and "maulen" or "pereira"
end

function BA.lanzar(defId, jugador, extra)
    local st = Motor.estado()
    if st.director ~= nil and st.director.veces ~= nil then st.director.veces[defId] = nil end
    local grupo, nombreGrupo = Mundo.grupoDe(jugador)
    local vars = { dueno = grupo, dueno_nombre = nombreGrupo, bandido_jefe = BA.jefe() }
    for k, v in pairs(BA.JEFES[vars.bandido_jefe]) do vars[k] = v end
    for k, v in pairs(extra or {}) do vars[k] = v end
    local inst, razon = Motor.iniciar(defId, jugador, { vars = vars })
    if inst == nil then
        Mundo.log("no se pudo lanzar " .. defId .. ": " .. tostring(razon))
        return nil
    end
    st.memoria.bandido_desde = Mundo.horas()
    return inst
end

-- Un jugador conectado de un grupo con el gancho listo.
local function jugadorConGancho(m)
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.vivo(p) and m["knox_bandido_" .. tostring(Mundo.grupoDe(p))] == "listo" then return p end
    end
    return nil
end

local function jugadorEnPatio(m)
    local l = m["lugar.bandido_patio"]
    if type(l) ~= "table" then return nil end
    return Mundo.jugadorCerca(l.x, l.y, BA.RADIO_PATIO)
end

-- Maulen mata a Pereira y toma el patio (una sola vez).
function BA.revisarMaulen(m)
    if m.maulen_salvado ~= true or m.bandido_jefe == "maulen" then return false end
    m.maulen_hora = m.maulen_hora or Mundo.horas()
    if Mundo.horas() - m.maulen_hora < BA.ESPERA_MAULEN then return false end
    local j = Mundo.jugadorAlAzar()
    if j == nil then return false end
    local venia = (tonumber(m.bandido_cap) or 0) >= 1
    m.bandido_jefe = "maulen"
    m.bandido = nil
    m.bandido_sospecha = 0
    if not venia then m.bandido_cap = 1 end
    BA.lanzar("bandido_maulen", j, { venia_de_pereira = venia })
    return true
end

function BA.revisar()
    local m = Motor.estado().memoria
    if BA.TERMINADA[tostring(m.bandido)] or BA.enCurso() then return end
    if BA.revisarMaulen(m) then return end
    local cap = tonumber(m.bandido_cap) or 0
    if cap >= 5 then return end
    -- Rechazaste el trabajo: la puerta queda abierta si vuelves al patio.
    if m.bandido == "rechazado" then
        local j = jugadorEnPatio(m)
        if j ~= nil then
            m.bandido = nil
            BA.lanzar(BA.jefe() == "maulen" and "bandido_maulen" or "bandido_1", j)
        end
        return
    end
    if cap == 0 then
        local j = jugadorConGancho(m)
        if j ~= nil then BA.lanzar("bandido_1", j) end
        return
    end
    if m.bandido_desde ~= nil and Mundo.horas() - m.bandido_desde < BA.CADA then return end
    local j = jugadorEnPatio(m)
    if j == nil then return end
    -- Robarle al Cabo necesita su campamento.
    if cap + 1 == 2 and not C.desbloqueado("muldraugh") then
        if not m.bandido_aviso_cabo then
            m.bandido_aviso_cabo = true
            Motor.enviar(j, "aviso", { texto = "Pereira: 'Todavia no. El cabo no tiene donde caerse muerto. Vuelve cuando haya armado su campamento.'" })
        end
        return
    end
    local sospecha = tonumber(m.bandido_sospecha) or 0
    if sospecha > 0 and Mundo.azar(100) <= sospecha * BA.CHANCE_SOSPECHA then
        m.bandido_sospecha = 0
        BA.lanzar("bandido_castigo", j)
        return
    end
    BA.lanzar("bandido_" .. (cap + 1), j)
end

function BA.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Mundo.hayALife() then return end
    pcall(BA.revisar)
end

Motor.tickExtra.bandido = BA.tick

-- {"sumar_memoria", clave, cantidad}
Motor.inmediatas.sumar_memoria = function(inst, a)
    local m = Motor.estado().memoria
    m[a.clave] = (tonumber(m[a.clave]) or 0) + (tonumber(a.cantidad) or 1)
    return true
end

-- {"robar_reservas", contacto, cantidad}: le quita esa cantidad de cada reserva al campamento.
Motor.inmediatas.robar_reservas = function(inst, a)
    local S = Narrador.Campamentos
    if S == nil or S.estado == nil then return true end
    local k = S.estado(tostring(a.contacto))
    for moneda in pairs(k.reservas or {}) do S.sumarReserva(k, moneda, -(tonumber(a.cantidad) or 20)) end
    return true
end

return BA
