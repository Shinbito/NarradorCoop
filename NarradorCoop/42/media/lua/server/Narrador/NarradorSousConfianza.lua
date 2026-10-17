-- Narrador Co-op (servidor): la confianza de Sous y el reclutamiento ("Sigueme").
-- La confianza es por grupo (faccion del juego o jugador) y solo sube ayudando a Sous en sus
-- misiones: los encargos de la historia de Sous, su final como aliados, el arsenal y las
-- historias de cada integrante. Cuando la historia termino con Sous como aliado, Meulen esta
-- muerto de verdad (memoria "meulen_final" = "muerto", la deja "La venganza de Meulen") y la
-- confianza llega a SC.UMBRAL, en la conversacion con cada integrante aparece "Sigueme": te
-- acompana (con el sistema de acompanantes, NarradorPasajeros.lua) hasta que le digas que vuelva.
-- Estado: Motor.estado().sous_confianza = { [grupo] = numero }.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorPasajeros"

local Mundo, Motor = Narrador.Mundo, Narrador.Motor

local SC = Narrador.SousConfianza or {}
Narrador.SousConfianza = SC

SC.UMBRAL = 40
SC.MAXIMO = 100
-- Lo que suma cada paso de la historia de Sous (al entrar a esa etapa).
SC.ETAPAS = { sous = { encargo2 = 10, encargo3 = 10 } }
-- Lo que suma terminar una historia en ese final.
SC.FINALES = {
    sous = { final_aliados = 30, final_devolver = 30, final_mentira = 10 },
    sous_arsenal = { ["*"] = 15 },
}
-- Las historias de cada integrante ("historia_sous_<rol>") suman al terminar bien.
SC.HISTORIA_PERSONAJE = 15
SC.FINALES_MALOS = { final_abandonado = true, final_fallido = true, final_muerto = true, final_traicion = true,
    final_vencido = true }

function SC.tabla()
    local st = Motor.estado()
    st.sous_confianza = st.sous_confianza or {}
    return st.sous_confianza
end

function SC.valor(grupo)
    return tonumber(SC.tabla()[tostring(grupo)]) or 0
end

-- Suma a los grupos de todos los jugadores conectados (la historia de Sous es de todos).
function SC.sumarConectados(cantidad, motivo)
    local vistos = {}
    for _, p in ipairs(Mundo.jugadores()) do
        local g = Mundo.grupoDe(p)
        if g ~= nil and not vistos[g] then
            vistos[g] = true
            local t = SC.tabla()
            t[g] = math.max(0, math.min(SC.MAXIMO, (tonumber(t[g]) or 0) + cantidad))
            Mundo.log("confianza de Sous " .. tostring(g) .. ": " .. tostring(t[g]) .. " (" .. tostring(motivo) .. ")")
        end
    end
end

-- Sous esta abierto a seguirte: aliados, Meulen muerto de verdad y confianza suficiente.
function SC.reclutable(grupo)
    local m = Motor.estado().memoria
    return m.sous == "aliados" and m.meulen_final == "muerto" and SC.valor(grupo) >= SC.UMBRAL
end

-- Integrantes de Sous que viven en la base (residentes) y estan vivos.
function SC.integrante(uid)
    local r = Motor.estado().residentes.sous
    local m = r ~= nil and r.miembros[tostring(uid)] or nil
    if m == nil and r ~= nil then m = r.miembros[uid] end
    if m == nil or m.muerto then return nil end
    return m
end

-- ---------------------------------------------------------------------------
-- Ganancias
-- ---------------------------------------------------------------------------

local desempacar = table.unpack or unpack

if not SC._entrarEnvuelto then
    SC._entrarEnvuelto = true
    local entrar = Motor.entrar
    Motor.entrar = function(inst, etapaId, ...)
        local r = { entrar(inst, etapaId, ...) }
        pcall(function()
            local suma = SC.ETAPAS[tostring(inst.def)] and SC.ETAPAS[tostring(inst.def)][tostring(etapaId)] or nil
            if suma ~= nil then SC.sumarConectados(suma, inst.def .. ":" .. etapaId) end
        end)
        return desempacar(r)
    end
end

Motor.alTerminar[#Motor.alTerminar + 1] = function(inst, def, final)
    local id = tostring(def ~= nil and def.id or inst.def)
    local tabla = SC.FINALES[id]
    local suma = tabla ~= nil and (tabla[tostring(final)] or (not SC.FINALES_MALOS[tostring(final)] and tabla["*"])) or nil
    if suma == nil and string.find(id, "^historia_sous_") ~= nil and not SC.FINALES_MALOS[tostring(final)] then
        suma = SC.HISTORIA_PERSONAJE
    end
    if suma ~= nil then SC.sumarConectados(suma, id .. ":" .. tostring(final)) end
end

-- ---------------------------------------------------------------------------
-- Sigueme / Vuelve a la base
-- ---------------------------------------------------------------------------

local P = Narrador.Pasajeros

function SC.sigueme(jugador, args)
    local uid = args ~= nil and args.uid or nil
    local m = uid ~= nil and SC.integrante(uid) or nil
    if m == nil then return end
    if not SC.reclutable(Mundo.grupoDe(jugador)) then
        Motor.responder(jugador, "Todavia no confia lo suficiente en ti para dejar la base.")
        return
    end
    local nombre = m.nombre or m.rol or "Alguien de Sous"
    P.agregar(uid, jugador, { nombre = nombre })
    Motor.decirUid(uid, nombre, "Dale, voy contigo. Sous no deja a nadie solo.")
    Motor.publicar()
end

function SC.vuelve(jugador, args)
    local uid = args ~= nil and args.uid or nil
    if uid == nil or not P.esAcompanante(uid) then return end
    P.quitar(uid)
    -- De vuelta a su base: las banderas de residente lo vuelven a amarrar alla.
    local r = Motor.estado().residentes.sous
    if r ~= nil and r.banderas ~= nil and r.zona ~= nil then
        pcall(Mundo.banderas, uid, r.banderas, { x = r.zona.x, y = r.zona.y, z = r.zona.z })
    end
    local m = SC.integrante(uid)
    Motor.decirUid(uid, m ~= nil and (m.nombre or m.rol) or "Sous", "Ya, me devuelvo a la base. Avisa si me necesitas.")
    Motor.publicar()
end

Motor.comandosPublicos = Motor.comandosPublicos or {}
Motor.comandosPublicos.sousSigueme = SC.sigueme
Motor.comandosPublicos.sousVuelve = SC.vuelve

-- Lo que ve el cliente: la confianza por grupo, si se puede reclutar y quienes te siguen.
Motor.vistaExtra = Motor.vistaExtra or {}
Motor.vistaExtra[#Motor.vistaExtra + 1] = function(v)
    local m = Motor.estado().memoria
    local siguiendo = {}
    for clave in pairs(P.lista()) do
        if SC.integrante(clave) ~= nil then siguiendo[#siguiendo + 1] = tostring(clave) end
    end
    v.sous_confianza = {
        valores = SC.tabla(), umbral = SC.UMBRAL,
        abierto = m.sous == "aliados" and m.meulen_final == "muerto",
        siguiendo = siguiendo,
    }
end

return SC
