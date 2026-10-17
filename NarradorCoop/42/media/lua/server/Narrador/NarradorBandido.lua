-- Narrador Co-op (servidor): el camino del bandido (shared/Narrador/Arcos/Bandido.lua).
-- Lanza los capitulos de la Sargento Pereira:
--   * El 1 (la nota en tu casa) la primera vez que un grupo conectado tiene la memoria
--     "knox_bandido_<grupo>" = "listo" (llego a -5 de Knox, ver NarradorKnox.lua).
--   * Del 2 al 5, cuando alguien vuelve al patio de trenes y pasaron BA.CADA horas desde el
--     anterior. Si rechazaste el primero, la puerta queda abierta: vuelve al patio.
--   * Con sospecha (misiones saboteadas), al volver al patio Pereira puede descubrirte:
--     BA.CHANCE_SOSPECHA % por cada sabotaje. Entonces manda cazadores (bandido_castigo).
--   * Si dejaste ir a Meulen en Sous (memoria "maulen_salvado"), BA.ESPERA_MAULEN horas despues
--     mata a Pereira y se queda con el patio (bandido_maulen): desde ahi el jefe es el
--     (memoria "bandido_jefe" = "maulen"), sin importar tu Knox.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/Arcos/Bandido"
require "Narrador/Arcos/Conquista"
require "Narrador/Arcos/Eduardo"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos

local BA = Narrador.Bandido or {}
Narrador.Bandido = BA

BA.CADA = 12
BA.CHANCE_SOSPECHA = 30
BA.DESCONFIANZA = 1.5    -- con pereira_desconfia, cada sabotaje pesa 45% en vez de 30%
BA.RADIO_PATIO = 40
BA.ESPERA_MAULEN = 72
BA.IDS = { "bandido_1", "bandido_2", "bandido_3", "bandido_4", "bandido_5", "bandido_castigo", "bandido_maulen",
    "conquista_sous", "conquista_muldraugh", "conquista_westpoint", "conquista_riverside", "conquista_rosewood",
    "eduardo_atentado", "eduardo_fallas", "reconquista_muldraugh", "reconquista_westpoint", "reconquista_riverside",
    "reconquista_rosewood", "reconquista_patio" }
-- Fase 3: horas entre los atentados de Eduardo (y desde que Knox quedo conquistado).
BA.ESPERA_EDUARDO = 48
BA.RECONQUISTA = { "muldraugh", "westpoint", "riverside", "rosewood" }
-- Las ciudades que se conquistan despues de la comisaria, en el orden que quiera el jugador.
BA.CIUDADES = { "westpoint", "riverside", "rosewood" }
-- Variables del jefe del patio que reciben todos los capitulos.
BA.JEFES = {
    pereira = { jefe_perfil = "narrador_pereira_01", jefe_nombre = "la Sargento Pereira", jefe_corto = "Pereira" },
    maulen = { jefe_perfil = "narrador_pereira_maulen", jefe_nombre = "Meulen Canupan", jefe_corto = "Meulen" },
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

-- Como se nombra al jefe del patio en los avisos.
function BA.jefeCorto(m)
    return (m or Motor.estado().memoria).bandido_jefe == "maulen" and "Meulen" or "Pereira"
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

-- Meulen mata a Pereira y toma el patio (una sola vez).
function BA.revisarMeulen(m)
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

-- Sous sigue en su base (aliado, como residentes) y hay que ir por ellos primero (con Meulen).
function BA.sousEnPie(m)
    local st = Motor.estado()
    return m.sous == "aliados" and type(m["lugar.base_sous"]) == "table" and st.residentes.sous ~= nil
end

-- Fase 2: la conquista. Una a la vez, BA.CADA horas entre una y otra.
function BA.revisarConquista(m)
    if m.knox_conquistado == true then return end
    if m.bandido_desde ~= nil and Mundo.horas() - m.bandido_desde < BA.CADA then return end
    if BA.jefe() == "maulen" and not m.conquista_sous and BA.sousEnPie(m) then
        local j = Mundo.jugadorAlAzar()
        if j ~= nil then BA.lanzar("conquista_sous", j) end
        return
    end
    if not m.conquista_muldraugh then
        local j = Mundo.jugadorAlAzar()
        if j ~= nil then BA.lanzar("conquista_muldraugh", j) end
        return
    end
    local faltan = {}
    for _, id in ipairs(BA.CIUDADES) do
        if not m["conquista_" .. id] then
            faltan[#faltan + 1] = id
            local j = C.jugadorEnPueblo(C.def(id))
            if j ~= nil then
                BA.lanzar("conquista_" .. id, j)
                return
            end
        end
    end
    if #faltan == 0 then
        m.knox_conquistado = true
        m.knox_conquistado_hora = Mundo.horas()
        for _, p in ipairs(Mundo.jugadores()) do
            Motor.enviar(p, "aviso", { texto = "Knox es de la banda del patio de trenes. Ya no queda un solo misionero." })
        end
    elseif not m.conquista_aviso then
        m.conquista_aviso = true
        for _, p in ipairs(Mundo.jugadores()) do
            Motor.enviar(p, "aviso", { texto = "La comisaria cayo. Quedan West Point, Riverside y Rosewood: la banda va contigo cuando entres a cada pueblo." })
        end
    end
end

-- Fase 3: Eduardo viene tres veces; despues Fallas Lake; despues, si hablaste, la reconquista.
function BA.revisarEduardo(m)
    if m.fin ~= nil then return end
    local ahora = Mundo.horas()
    local n = tonumber(m.eduardo_atentados) or 0
    if n < 3 then
        local desde = m.eduardo_desde or m.knox_conquistado_hora or ahora
        if ahora - desde < BA.ESPERA_EDUARDO then return end
        local j = Mundo.jugadorAlAzar()
        if j ~= nil and BA.lanzar("eduardo_atentado", j, { atentado = n + 1 }) ~= nil then
            m.eduardo_atentados, m.eduardo_desde = n + 1, ahora
        end
        return
    end
    if m.eduardo_nota and not m.eduardo_fallas then
        local j = Mundo.jugadorAlAzar()
        if j ~= nil and BA.lanzar("eduardo_fallas", j) ~= nil then m.eduardo_fallas = true end
        return
    end
    if m.reconquista ~= true then return end
    if m.bandido_desde ~= nil and ahora - m.bandido_desde < BA.CADA then return end
    local faltan = 0
    for _, id in ipairs(BA.RECONQUISTA) do
        if not m["reconquista_" .. id] then
            faltan = faltan + 1
            local j = C.jugadorEnPueblo(C.def(id))
            if j ~= nil then
                BA.lanzar("reconquista_" .. id, j)
                return
            end
        end
    end
    if faltan == 0 and not m.reconquista_patio_lanzada then
        local j = Mundo.jugadorAlAzar()
        if j ~= nil and BA.lanzar("reconquista_patio", j) ~= nil then m.reconquista_patio_lanzada = true end
    elseif faltan > 0 and not m.reconquista_aviso then
        m.reconquista_aviso = true
        for _, p in ipairs(Mundo.jugadores()) do
            Motor.enviar(p, "aviso", { texto = "Eduardo: 'Ciudad por ciudad. Entra a cualquiera de las cuatro y yo llego.'" })
        end
    end
end

function BA.revisar()
    local m = Motor.estado().memoria
    if BA.enCurso() then return end
    if m.bandido == "pereira" then
        if m.knox_conquistado then BA.revisarEduardo(m) else BA.revisarConquista(m) end
        return
    end
    if BA.TERMINADA[tostring(m.bandido)] then return end
    if BA.revisarMeulen(m) then return end
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
    -- Consecuencia del castigo (pereira_desconfia): desde que sobreviviste a sus cazadores te vigila mas.
    local chance = BA.CHANCE_SOSPECHA * (m.pereira_desconfia == true and BA.DESCONFIANZA or 1)
    if m.pereira_desconfia == true and not m.pereira_aviso_desconfia then
        m.pereira_aviso_desconfia = true
        Motor.enviar(j, "aviso", { texto = BA.jefeCorto(m) .. ": 'Sobreviviste a mi gente. No creas que se me olvido. Desde hoy te miro yo.'" })
    end
    if sospecha > 0 and Mundo.azar(100) <= sospecha * chance then
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
