-- Narrador Co-op (servidor): datos para la ventana de conversacion.
--
-- Agrega al motor, sin tocar sus archivos:
--   * En la vista, por cada opcion de una historia: quien la contesta (rol y uid) y, por
--     cada NPC, su rol y nombre completo. Asi el cliente sabe que opciones mostrar al
--     hablar con cada personaje.
--   * Nombres de los residentes (Sous aliado) para el menu "Hablar con".
--   * Comando de cliente NarradorConversacion / hablar { uid }: el personaje dice una
--     frase suya (de la charla de su etapa, de sus frases de misionero o de residente).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorObjetosServer"

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor
local C = Narrador.Contactos

local S = Narrador.ConversacionServer or {}
Narrador.ConversacionServer = S
S.MODULO = "NarradorConversacion"

-- Frases cuando el personaje no tiene nada propio que decir.
S.GENERICAS = {
    "Que necesitas?",
    "Dime.",
    "Aca estoy. Que pasa?",
    "Anda con cuidado alla afuera.",
}

-- ---------------------------------------------------------------------------
-- Vista: rol y hablante de cada opcion
-- ---------------------------------------------------------------------------

-- Quien contesta una opcion: el rol de la primera linea de "dice" (o nil si es narracion).
function S.rolDeOpcion(inst, etapa, op)
    local dice = op.dice
    if type(dice) == "table" and dice.rol ~= nil then dice = { dice } end
    if type(dice) ~= "table" or dice[1] == nil then return nil, nil end
    local linea = dice[1]
    local rol = Motor.valor(inst, linea.rol)
    return rol ~= nil and tostring(rol) or nil, linea.grupo or etapa.ancla_grupo
end

function S.uidDeRol(inst, grupoId, rol)
    local g = grupoId ~= nil and inst.grupos[grupoId] or nil
    if g == nil or rol == nil then return nil end
    local uid = g.roles[rol]
    local m = uid ~= nil and g.miembros[uid] or nil
    if m == nil or not m.vivo then return nil end
    return uid
end

function S.nombreDe(g, m)
    if Motor.nombreCompleto ~= nil then
        local ok, n = pcall(Motor.nombreCompleto, g, m)
        if ok and n ~= nil then return n end
    end
    return m.nombre or m.rol
end

function S.completarArco(v)
    local st = Motor.estado()
    local inst = st.arcos[tostring(v.id)]
    local def = inst ~= nil and Defs.get(inst.def) or nil
    if def == nil then return end
    local etapa = def.etapas[inst.etapa] or {}
    -- NPCs: rol y nombre completo.
    local porUid = {}
    for _, g in pairs(inst.grupos) do
        for uid, m in pairs(g.miembros) do porUid[tostring(uid)] = { g = g, m = m } end
    end
    for _, n in ipairs(v.npcs or {}) do
        local x = porUid[tostring(n.uid)]
        if x ~= nil then
            n.rol = x.m.rol
            n.nombre_completo = S.nombreDe(x.g, x.m)
        end
    end
    -- Opciones: quien las contesta.
    local porId = {}
    for _, op in ipairs(etapa.opciones or {}) do porId[op.id] = op end
    for _, o in ipairs(v.opciones or {}) do
        local op = porId[o.id]
        if op ~= nil then
            local rol, grupoId = S.rolDeOpcion(inst, etapa, op)
            o.rol = rol
            o.quien = S.uidDeRol(inst, grupoId, rol)
            o.requiere = op.requiere ~= nil and tostring(op.requiere[1]) or nil
        end
    end
    v.ancla_grupo = etapa.ancla_grupo
end

function S.residentesInfo()
    local st, lista = Motor.estado(), {}
    for id, r in pairs(st.residentes) do
        for uid, m in pairs(r.miembros or {}) do
            if not m.muerto then
                local nombre = m.nombre or m.rol
                if m.apellido ~= nil and m.apellido ~= "" then nombre = tostring(nombre) .. " " .. tostring(m.apellido) end
                lista[#lista + 1] = { uid = tostring(uid), rol = m.rol, nombre = nombre, grupo = id }
            end
        end
    end
    return lista
end

if not S._vistaEnvuelta then
    S._vistaEnvuelta = true
    local vistaAnterior = Motor.vista
    Motor.vista = function(...)
        local v = vistaAnterior(...)
        if type(v) == "table" then
            for _, a in ipairs(v.arcos or {}) do pcall(S.completarArco, a) end
            local ok, info = pcall(S.residentesInfo)
            v.residentes_info = ok and info or {}
        end
        return v
    end
end

-- ---------------------------------------------------------------------------
-- Hablar: el personaje dice algo suyo
-- ---------------------------------------------------------------------------

local SIN_INST = { vars = {}, lugares = {}, grupos = {}, relojes = {}, elecciones = {}, usadas = {} }

-- Ultima frase dicha por cada uid (para no repetir la misma dos veces seguidas).
S.ultima = S.ultima or {}

function S.elegirLinea(uid, lineas, rol, inst)
    local candidatas = {}
    for _, l in ipairs(lineas or {}) do
        if type(l) == "table" and l[1] == rol and type(l[2]) == "string" then
            if l.si == nil or Motor.cumple(inst or SIN_INST, l.si) then candidatas[#candidatas + 1] = l[2] end
        elseif type(l) == "string" and rol == nil then
            candidatas[#candidatas + 1] = l
        end
    end
    if #candidatas == 0 then return nil end
    local ultima = S.ultima[tostring(uid)]
    local libres = {}
    for _, t in ipairs(candidatas) do if t ~= ultima then libres[#libres + 1] = t end end
    if #libres == 0 then libres = candidatas end
    local t = libres[Mundo.azar(#libres)]
    S.ultima[tostring(uid)] = t
    return t
end

local function listasDe(ch)
    if ch == nil then return {} end
    local todas = {}
    local nombres = type(ch.lista) == "table" and ch.lista or (ch.lista ~= nil and { ch.lista } or {})
    for _, nombre in ipairs(nombres) do
        for _, l in ipairs(Narrador.Charlas[nombre] or {}) do todas[#todas + 1] = l end
    end
    for _, l in ipairs(ch.lineas or {}) do todas[#todas + 1] = l end
    return todas
end

-- Devuelve nombre, texto (ya resuelto) para el uid, o nil si no es un personaje del Narrador.
function S.frase(uid)
    uid = tostring(uid)
    local st = Motor.estado()
    local conocido, nombre
    -- 1) Personaje de una historia en curso: charla de su etapa.
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil then
            for _, g in pairs(inst.grupos) do
                local m = g.miembros[uid]
                if m ~= nil and m.vivo then
                    conocido, nombre = true, m.nombre or m.rol
                    local def = Defs.get(inst.def)
                    local etapa = def ~= nil and def.etapas[inst.etapa] or nil
                    local t = S.elegirLinea(uid, listasDe(etapa ~= nil and etapa.charla or nil), m.rol, inst)
                    if t ~= nil then return nombre, Motor.texto(inst, t) end
                end
            end
        end
    end
    -- 2) Misionero.
    for _, c in ipairs(C ~= nil and C.LISTA or {}) do
        local e = C.estado(c.id)
        if e.uid ~= nil and tostring(e.uid) == uid then
            local t = S.elegirLinea(uid, c.frases, nil)
            return c.nombre, t or S.GENERICAS[1]
        end
    end
    -- 3) Residente (Sous aliado en su base).
    for _, r in pairs(st.residentes) do
        local m = r.miembros ~= nil and r.miembros[uid] or nil
        if m ~= nil and not m.muerto then
            conocido, nombre = true, m.nombre or m.rol
            local t = S.elegirLinea(uid, Narrador.Charlas[r.charla], m.rol)
            if t ~= nil then return nombre, t end
        end
    end
    if conocido then return nombre, S.GENERICAS[Mundo.azar(#S.GENERICAS)] end
    return nil
end

function S.hablar(jugador, uid)
    if uid == nil then return end
    local nombre, texto = S.frase(uid)
    if nombre == nil then return end
    -- Que no hable si el jugador esta lejos (evita abusos desde el cliente).
    local px, py = Mundo.posicion(jugador)
    local x, y = Mundo.posicionActor(uid)
    if px ~= nil and x ~= nil and math.sqrt((x - px) ^ 2 + (y - py) ^ 2) > 14 then return end
    -- Se dice con la burbuja normal: los que esten cerca tambien lo escuchan.
    Motor.decirUid(uid, nombre, texto)
end

function S.alComando(modulo, comando, jugador, args)
    if modulo ~= S.MODULO then return end
    args = args or {}
    if comando == "hablar" then
        local ok, err = pcall(S.hablar, jugador, args.uid)
        if not ok then Mundo.log("conversacion: " .. tostring(err)) end
    end
end

if Events ~= nil and not S._enganchado then
    S._enganchado = true
    Events.OnClientCommand.Add(S.alComando)
end

return S
