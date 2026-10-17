-- Narrador Co-op (servidor): los personajes importantes que murieron (ver
-- shared/Narrador/NarradorCaidosDefs.lua). Cada minuto se repasan los NPCs de las historias en
-- curso: el que murio de verdad (no el que se retiro ni el que se descargo) y es importante queda
-- anotado una vez, con su homenaje o, si lo mataste tu, con el lamento. Los misioneros se anotan
-- cuando mueren en la conquista (NarradorDominios llama a CA.anotarContacto): esa muerte siempre
-- es por algo que hiciste. El diario lo muestra en Notas -> "Los que ya no estan", con el nombre
-- tachado, y deja una linea en el registro.
-- Estado: Motor.estado().caidos = { lista = { { clave, nombre, h, mato, texto } }, anotados = { [clave] = true } }.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorCaidosDefs"

local Mundo, Motor, CD = Narrador.Mundo, Narrador.Motor, Narrador.CaidosDefs
local floor = math.floor

local CA = Narrador.Caidos or {}
Narrador.Caidos = CA

CA.MAX = 40
-- Causas de muerte de verdad (Motor: "retirado" es que se fue; "desaparecido", que se descargo).
CA.CAUSAS = { jugador = true, otro = true, transformado = true }

function CA.st()
    local st = Motor.estado()
    st.caidos = st.caidos or { lista = {}, anotados = {} }
    return st.caidos
end

-- Anota a un personaje (una sola vez). mato = lo mataste tu o murio por lo que hiciste.
function CA.anotar(p, mato, quien)
    local e = CA.st()
    if p == nil or e.anotados[p.clave] then return false end
    e.anotados[p.clave] = true
    local texto = CD.texto(p, mato)
    e.lista[#e.lista + 1] = { clave = p.clave, nombre = p.nombre, h = floor(Mundo.horas()), mato = mato == true,
        quien = quien, texto = texto }
    while #e.lista > CA.MAX do table.remove(e.lista, 1) end
    -- Una linea en el registro del diario.
    local st = Motor.estado()
    local linea = mato and ("Murio " .. p.nombre .. ". Fue por mi culpa.") or ("Murio " .. p.nombre .. ".")
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = linea, arco = "Los que ya no estan" }
    while #st.diario > Motor.MAX_DIARIO_GLOBAL do table.remove(st.diario, 1) end
    Motor.enviar(nil, "diario", { texto = linea, arco = "Los que ya no estan" })
    Mundo.log("caido: " .. p.nombre .. (mato and " (por un jugador)" or ""))
    Motor.publicar()
    return true
end

-- Un misionero que murio de verdad (en la conquista). rol = el de C.LISTA ("cabo", "chela"...).
function CA.anotarContacto(rol, mato)
    return CA.anotar(CD.deContacto(rol), mato)
end

-- Repasa los NPCs de las historias en curso.
function CA.revisar()
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        for _, g in pairs(inst ~= nil and inst.grupos or {}) do
            for _, m in pairs(g.miembros or {}) do
                if not m.vivo and not m.caido_visto and not m.desaparecido and CA.CAUSAS[tostring(m.causa)] then
                    m.caido_visto = true
                    local p = CD.deArco(inst.def, m.rol)
                    local mato = m.causa == "jugador"
                    if p ~= nil and (mato or not p.solo_si_jugador) then
                        CA.anotar(p, mato, mato and inst.vars.quien_mato or nil)
                    end
                end
            end
        end
    end
end
Motor.tickExtra.caidos = function() CA.revisar() end

-- Para el diario.
Motor.vistaExtra[#Motor.vistaExtra + 1] = function(vista)
    vista.caidos = CA.st().lista
end

return CA
