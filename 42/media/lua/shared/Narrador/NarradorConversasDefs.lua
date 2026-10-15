-- Narrador Co-op: registro de conversaciones entre NPCs.
-- Una conversacion es una escena corta de varios turnos donde los personajes se hablan entre
-- ellos (y a veces te preguntan algo). La ejecuta server/Narrador/NarradorConversas.lua.
--
-- Campos:
--   id        unico
--   turnos    { { "rol", "texto", si = condicion }, ... }   el texto acepta {n:rol} (nombre del que
--             hace ese rol) y las plantillas del motor ({var}, {rango:x}...)
--   fuente    "residentes" (por defecto: residentes y misioneros), "arco:<id>" (NPCs de esa
--             historia mientras esta abierta) o "cualquiera"
--   etapas    con fuente arco: solo en estas etapas
--   si        condicion del motor (con fuente arco se evalua con las variables de esa historia)
--   peso      probabilidad relativa (1)
--   cada      horas minimas antes de repetirla (12)
--   radio     el jugador tiene que estar a esta distancia de todos (15)
--   una_vez   true: sale una sola vez por partida
--   forzada   true: solo sale cuando una historia la pide con la accion "conversar"
--   tipo      ambiente | reaccion | pista | discusion | cruzada (solo informativo)
--   al_cortar { "rol", "texto" }: lo que dice alguien si llegan zombis a mitad
--   pregunta  { texto = "...", opciones = { { id, texto, dice = { {rol, texto}, ... }, memoria = valor } } }
--             La respuesta queda en la memoria de la partida como "conv.<id>".
-- Textos sin tildes ni enies a proposito.

Narrador = Narrador or {}
local Conversas = Narrador.Conversas or { lista = {}, orden = {} }
Narrador.Conversas = Conversas

function Conversas.registrar(c)
    if type(c) ~= "table" or type(c.id) ~= "string" then
        print("[Narrador] conversacion invalida: falta id")
        return false
    end
    if type(c.turnos) ~= "table" or #c.turnos == 0 then
        print("[Narrador] conversacion " .. c.id .. ": sin turnos")
        return false
    end
    for i, t in ipairs(c.turnos) do
        if type(t[1]) ~= "string" or (type(t[2]) ~= "string" and type(t[2]) ~= "table") then
            print("[Narrador] conversacion " .. c.id .. ": turno " .. i .. " invalido")
            return false
        end
    end
    if c.pregunta ~= nil then
        for _, op in ipairs(c.pregunta.opciones or {}) do
            if type(op.id) ~= "string" or type(op.texto) ~= "string" then
                print("[Narrador] conversacion " .. c.id .. ": opcion de pregunta invalida")
                return false
            end
        end
    end
    if Conversas.lista[c.id] == nil then Conversas.orden[#Conversas.orden + 1] = c.id end
    Conversas.lista[c.id] = c
    return true
end

-- Registra varias de una vez.
function Conversas.varias(lista)
    for _, c in ipairs(lista) do Conversas.registrar(c) end
end

function Conversas.get(id) return Conversas.lista[id] end

function Conversas.todas()
    local r = {}
    for _, id in ipairs(Conversas.orden) do r[#r + 1] = Conversas.lista[id] end
    return r
end

-- Roles que necesita una conversacion (en orden de aparicion, sin repetir).
function Conversas.roles(c)
    local vistos, lista = {}, {}
    for _, t in ipairs(c.turnos) do
        if not t.opcional and not vistos[t[1]] then vistos[t[1]] = true; lista[#lista + 1] = t[1] end
    end
    return lista
end

return Conversas
