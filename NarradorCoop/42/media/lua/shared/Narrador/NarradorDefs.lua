-- Narrador Co-op: registro de arcos (historias).
-- Un arco es pura data: etapas, condiciones de salida, acciones y finales.
-- El motor (server/Narrador/NarradorMotor.lua) es el que lo ejecuta.

Narrador = Narrador or {}

local Defs = Narrador.Defs or { lista = {}, orden = {} }
Narrador.Defs = Defs

Defs.MODULO = "NarradorCoop"

-- Registra un arco. Valida lo minimo para que un error de tipeo se note al cargar
-- y no a mitad de partida.
function Defs.registrar(def)
    if type(def) ~= "table" or type(def.id) ~= "string" or def.id == "" then
        print("[Narrador] arco invalido: falta id")
        return false
    end
    if type(def.etapas) ~= "table" or type(def.inicio) ~= "string" or def.etapas[def.inicio] == nil then
        print("[Narrador] arco " .. def.id .. ": falta 'inicio' o la etapa inicial no existe")
        return false
    end
    for nombre, etapa in pairs(def.etapas) do
        for _, salida in ipairs(etapa.salidas or {}) do
            if type(salida.ir) ~= "string" or def.etapas[salida.ir] == nil then
                print("[Narrador] arco " .. def.id .. ", etapa " .. tostring(nombre)
                    .. ": salida hacia etapa inexistente '" .. tostring(salida.ir) .. "'")
                return false
            end
        end
        for _, opcion in ipairs(etapa.opciones or {}) do
            if type(opcion.id) ~= "string" or type(opcion.texto) ~= "string" then
                print("[Narrador] arco " .. def.id .. ", etapa " .. tostring(nombre) .. ": opcion sin id o texto")
                return false
            end
        end
    end
    if Defs.lista[def.id] == nil then Defs.orden[#Defs.orden + 1] = def.id end
    Defs.lista[def.id] = def
    return true
end

function Defs.get(id)
    return Defs.lista[id]
end

function Defs.todos()
    local resultado = {}
    for _, id in ipairs(Defs.orden) do resultado[#resultado + 1] = Defs.lista[id] end
    return resultado
end

return Defs
