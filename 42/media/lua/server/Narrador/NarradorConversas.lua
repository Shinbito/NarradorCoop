-- Narrador Co-op: conversaciones entre NPCs (servidor).
-- Cada pocos minutos busca, cerca de cada jugador, personajes que puedan tener una de las
-- conversaciones registradas (shared/Narrador/NarradorConversasDefs.lua) y la reproduce turno
-- a turno con las burbujas del Narrador. Si llegan zombis se corta. Si termina en pregunta,
-- el jugador puede meterse con clic derecho por un rato.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorConversasDefs"

local Mundo, Motor, Conversas = Narrador.Mundo, Narrador.Motor, Narrador.Conversas
local floor = math.floor

local CS = Narrador.ConversasServer or {}
Narrador.ConversasServer = CS

CS.CADA_REVISION = 3        -- minutos de juego entre revisiones
CS.CHANCE = 3               -- 1 en CHANCE de empezar una cuando se puede
CS.HUECO = 1.0              -- horas minimas entre conversaciones en la misma zona
CS.RECIENTES = 5            -- no repetir ninguna de las ultimas N
CS.CADA_DEFECTO = 12        -- horas antes de repetir la misma
CS.RADIO_DEFECTO = 15
CS.RADIO_ZOMBI = 8
CS.DURA_PREGUNTA = 0.35     -- horas que queda abierta una pregunta
CS.VENCE_FORZADA = 3        -- horas que espera una conversacion pedida por una historia

local SIN_INST = { vars = {}, lugares = {}, grupos = {}, relojes = {}, elecciones = {}, usadas = {} }

function CS.estado()
    local st = Motor.estado()
    st.conv = st.conv or {}
    local c = st.conv
    c.recientes = c.recientes or {}
    c.ultimaVez = c.ultimaVez or {}
    c.usadas = c.usadas or {}
    c.activas = c.activas or {}
    c.preguntas = c.preguntas or {}
    c.forzadas = c.forzadas or {}
    c.zonas = c.zonas or {}
    return c
end

-- ---------------------------------------------------------------------------
-- Quienes pueden hablar
-- ---------------------------------------------------------------------------

-- Lista de hablantes: { uid, rol, nombre, x, y, alias = { [otroRol] = true }, fuente, inst }
function CS.hablantes()
    local st = Motor.estado()
    local lista = {}
    local function agregar(uid, rol, nombre, fuente, inst, alias)
        local x, y = Mundo.posicionActor(uid)
        if x == nil then return end
        lista[#lista + 1] = { uid = uid, rol = rol, nombre = nombre or rol, x = x, y = y, fuente = fuente,
            inst = inst, alias = alias or {} }
    end
    for resId, r in pairs(st.residentes or {}) do
        for uid, m in pairs(r.miembros or {}) do
            if not m.muerto then
                local alias = {}
                for _, a in ipairs(m.alias or r.alias or {}) do alias[a] = true end
                agregar(uid, m.rol, m.nombre, "res:" .. tostring(resId), nil, alias)
            end
        end
    end
    local C = Narrador.Contactos
    if C ~= nil then
        for _, c in ipairs(C.LISTA) do
            local e = C.estado(c.id)
            if e.uid ~= nil then agregar(e.uid, c.rol or c.id, c.nombre, "contacto", nil, { misionero = true, [c.id] = true }) end
        end
    end
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil then
            for _, g in pairs(inst.grupos) do
                if g.estado == "listo" then
                    for uid, m in pairs(g.miembros) do
                        if m.vivo then agregar(uid, m.rol, m.nombre, "arco:" .. tostring(inst.def), inst) end
                    end
                end
            end
        end
    end
    return lista
end

local function sirveFuente(c, h)
    local fuente = c.fuente or "residentes"
    if fuente == "cualquiera" then return true end
    if fuente == "residentes" then return h.fuente ~= nil and (string.sub(h.fuente, 1, 4) == "res:" or h.fuente == "contacto") end
    return h.fuente == fuente
end

local function calza(h, rol)
    return h.rol == rol or h.alias[rol] == true
end

-- Asigna un hablante a cada rol de la conversacion. Todos tienen que estar dentro del radio
-- del centro (un jugador, o el primero que se encuentre si no hay centro).
function CS.repartir(c, hablantes, cx, cy)
    local radio = tonumber(c.radio) or CS.RADIO_DEFECTO
    local roles = Conversas.roles(c)
    local asignados, usados = {}, {}
    local inst
    for _, rol in ipairs(roles) do
        local elegido
        local candidatos = {}
        for _, h in ipairs(hablantes) do
            if not usados[h.uid] and calza(h, rol) and sirveFuente(c, h) and not CS.ocupado(h.uid) then
                local d = cx ~= nil and math.sqrt((h.x - cx) ^ 2 + (h.y - cy) ^ 2) or 0
                if d <= radio and (inst == nil or h.inst == nil or h.inst == inst) then candidatos[#candidatos + 1] = h end
            end
        end
        -- Reemplazo: si el rol no esta, puede decirlo otro (ver turno.reemplazo).
        if #candidatos == 0 then
            local rem
            for _, t in ipairs(c.turnos) do if t[1] == rol and t.reemplazo ~= nil then rem = t.reemplazo end end
            if rem ~= nil then
                for _, h in ipairs(hablantes) do
                    if not usados[h.uid] and calza(h, rem) and sirveFuente(c, h) and not CS.ocupado(h.uid) then
                        local d = cx ~= nil and math.sqrt((h.x - cx) ^ 2 + (h.y - cy) ^ 2) or 0
                        if d <= radio then candidatos[#candidatos + 1] = h end
                    end
                end
            end
        end
        if #candidatos == 0 then return nil end
        elegido = candidatos[Mundo.azar(#candidatos)]
        if cx == nil then cx, cy = elegido.x, elegido.y end
        asignados[rol] = elegido
        usados[elegido.uid] = true
        inst = inst or elegido.inst
    end
    -- Roles opcionales: si estan, hablan; si no, se saltan sus turnos.
    for _, t in ipairs(c.turnos) do
        if t.opcional and asignados[t[1]] == nil then
            for _, h in ipairs(hablantes) do
                if not usados[h.uid] and calza(h, t[1]) and sirveFuente(c, h) and not CS.ocupado(h.uid) then
                    local d = cx ~= nil and math.sqrt((h.x - cx) ^ 2 + (h.y - cy) ^ 2) or 0
                    if d <= radio then asignados[t[1]] = h; usados[h.uid] = true; break end
                end
            end
        end
    end
    return asignados, inst
end

-- ---------------------------------------------------------------------------
-- Elegibilidad
-- ---------------------------------------------------------------------------

function CS.elegible(c, ahora, forzada)
    local e = CS.estado()
    if c.forzada and not forzada then return false end
    if c.una_vez and e.usadas[c.id] then return false end
    if not forzada then
        for _, id in ipairs(e.recientes) do if id == c.id then return false end end
        local ultima = e.ultimaVez[c.id]
        if ultima ~= nil and ahora - ultima < (tonumber(c.cada) or CS.CADA_DEFECTO) then return false end
    end
    return true
end

local function cumpleSi(c, inst)
    if c.si == nil then return true end
    return Motor.cumple(inst or SIN_INST, c.si)
end

local function enEtapa(c, inst)
    if c.etapas == nil then return true end
    if inst == nil then return false end
    for _, et in ipairs(c.etapas) do if inst.etapa == et then return true end end
    return false
end

-- Arma la conversacion lista para reproducir (o nil si no se puede).
function CS.preparar(c, hablantes, cx, cy)
    local asignados, inst = CS.repartir(c, hablantes, cx, cy)
    if asignados == nil then return nil end
    if not cumpleSi(c, inst) or not enEtapa(c, inst) then return nil end
    local base = inst or SIN_INST
    local turnos = {}
    local sx, sy, n = 0, 0, 0
    for _, h in pairs(asignados) do sx, sy, n = sx + h.x, sy + h.y, n + 1 end
    local function nombres(texto)
        return (string.gsub(texto, "{n:([%w_]+)}", function(rol)
            local h = asignados[rol]
            return h ~= nil and tostring(h.nombre) or rol
        end))
    end
    for _, t in ipairs(c.turnos) do
        local h = asignados[t[1]]
        if h ~= nil and (t.si == nil or Motor.cumple(base, t.si)) then
            local texto = nombres(Motor.texto(base, t[2]))
            turnos[#turnos + 1] = { uid = h.uid, nombre = h.nombre, texto = texto }
        end
    end
    if #turnos == 0 then return nil end
    local corte
    if c.al_cortar ~= nil and asignados[c.al_cortar[1]] ~= nil then
        local h = asignados[c.al_cortar[1]]
        corte = { uid = h.uid, nombre = h.nombre, texto = nombres(Motor.texto(base, c.al_cortar[2])) }
    end
    local uids = {}
    for _, h in pairs(asignados) do uids[#uids + 1] = h.uid end
    local roles = {}
    for rol, h in pairs(asignados) do roles[rol] = { uid = h.uid, nombre = h.nombre } end
    return { id = c.id, turnos = turnos, i = 1, proximo = 0, x = sx / n, y = sy / n, uids = uids, corte = corte,
        roles = roles, inst = inst ~= nil and inst.id or nil }
end

-- ---------------------------------------------------------------------------
-- Reproduccion
-- ---------------------------------------------------------------------------

function CS.ocupado(uid)
    for _, a in ipairs(CS.estado().activas) do
        for _, u in ipairs(a.uids) do if u == uid then return true end end
    end
    return false
end

-- Hay una conversacion sonando cerca de ese punto (la charla suelta se calla).
function CS.activaCerca(x, y, radio)
    for _, a in ipairs(CS.estado().activas) do
        if math.abs(a.x - x) <= radio and math.abs(a.y - y) <= radio then return true end
    end
    return false
end

local function claveZona(x, y) return tostring(floor(x / 60)) .. ":" .. tostring(floor(y / 60)) end

function CS.empezar(p)
    local e = CS.estado()
    local ahora = Mundo.horas()
    p.proximo = Motor.minutosDesdeArranque
    e.activas[#e.activas + 1] = p
    e.ultimaVez[p.id] = ahora
    e.usadas[p.id] = true
    e.zonas[claveZona(p.x, p.y)] = ahora
    table.insert(e.recientes, 1, p.id)
    while #e.recientes > CS.RECIENTES do table.remove(e.recientes) end
    return p
end

function CS.duracion(texto)
    return 1 + floor(string.len(tostring(texto)) / 70)
end

function CS.terminar(p, cortada)
    local e = CS.estado()
    for i = #e.activas, 1, -1 do if e.activas[i] == p then table.remove(e.activas, i) end end
    if cortada then return end
    local c = Conversas.get(p.id)
    if c ~= nil and c.pregunta ~= nil then
        local base = SIN_INST
        local inst = p.inst ~= nil and Motor.estado().arcos[p.inst] or nil
        if inst ~= nil then base = inst end
        local ops = {}
        for _, op in ipairs(c.pregunta.opciones or {}) do ops[#ops + 1] = { id = op.id, texto = Motor.texto(base, op.texto) } end
        e.preguntas[#e.preguntas + 1] = { conv = p.id, texto = Motor.texto(base, c.pregunta.texto or "Meterte en la conversa"),
            opciones = ops, x = floor(p.x), y = floor(p.y), vence = Mundo.horas() + CS.DURA_PREGUNTA, roles = p.roles,
            inst = p.inst }
        Motor.publicar()
    end
end

function CS.avanzar(p)
    if Motor.minutosDesdeArranque < (p.proximo or 0) then return end
    -- Alguien murio o desaparecio a mitad: se corta sin aviso.
    for _, uid in ipairs(p.uids) do
        if not Mundo.actorVivoUid(uid) then CS.terminar(p, true); return end
    end
    if Mundo.zombiCerca(p.x, p.y, CS.RADIO_ZOMBI) then
        if p.corte ~= nil then Motor.decirUid(p.corte.uid, p.corte.nombre, p.corte.texto) end
        CS.terminar(p, true)
        return
    end
    local t = p.turnos[p.i]
    if t == nil then CS.terminar(p, false); return end
    Motor.decirUid(t.uid, t.nombre, t.texto)
    p.i = p.i + 1
    p.proximo = Motor.minutosDesdeArranque + CS.duracion(t.texto)
    if p.turnos[p.i] == nil and Conversas.get(p.id) ~= nil and Conversas.get(p.id).pregunta == nil then
        CS.terminar(p, false)
    end
end

-- Pide una conversacion puntual (la usan las historias para reacciones).
function CS.forzar(id, inst)
    local e = CS.estado()
    if Conversas.get(id) == nil then
        Mundo.log("conversacion desconocida: " .. tostring(id))
        return false
    end
    e.forzadas[#e.forzadas + 1] = { id = id, desde = Mundo.horas(), inst = inst ~= nil and inst.id or nil }
    return true
end

function CS.intentarForzadas(hablantes)
    local e = CS.estado()
    local ahora = Mundo.horas()
    for i = #e.forzadas, 1, -1 do
        local f = e.forzadas[i]
        local c = Conversas.get(f.id)
        if c == nil or ahora - f.desde > CS.VENCE_FORZADA then
            table.remove(e.forzadas, i)
        elseif CS.elegible(c, ahora, true) then
            -- Primero cerca de algun jugador; si no, donde esten.
            local p
            for _, j in ipairs(Mundo.jugadores()) do
                local x, y = Mundo.posicion(j)
                if p == nil and x ~= nil then p = CS.preparar(c, hablantes, x, y) end
            end
            if p ~= nil then
                CS.empezar(p)
                table.remove(e.forzadas, i)
            end
        end
    end
end

function CS.intentarAmbiente(hablantes)
    if Mundo.sandbox("Conversaciones", true) == false then return end
    local e = CS.estado()
    local ahora = Mundo.horas()
    for _, j in ipairs(Mundo.jugadores()) do
        local x, y = Mundo.posicion(j)
        if x ~= nil and Mundo.vivo(j) and not CS.activaCerca(x, y, 30) then
            local ultima = e.zonas[claveZona(x, y)]
            if (ultima == nil or ahora - ultima >= CS.HUECO) and Mundo.azar(CS.CHANCE) == 1 then
                local candidatos, total = {}, 0
                for _, c in ipairs(Conversas.todas()) do
                    if CS.elegible(c, ahora, false) then
                        local p = CS.preparar(c, hablantes, x, y)
                        if p ~= nil then
                            local peso = tonumber(c.peso) or 1
                            candidatos[#candidatos + 1] = { p = p, peso = peso }
                            total = total + peso
                        end
                    end
                end
                if #candidatos > 0 then
                    local tiro = Mundo.azar(math.max(1, floor(total * 10))) / 10
                    local acum = 0
                    for _, cand in ipairs(candidatos) do
                        acum = acum + cand.peso
                        if tiro <= acum then CS.empezar(cand.p); break end
                    end
                end
            end
        end
    end
end

function CS.tick()
    local e = CS.estado()
    for _, p in ipairs(Motor.copiar(e.activas)) do
        -- copiar() rompe la identidad: se avanza la original
        for _, orig in ipairs(e.activas) do if orig.id == p.id and orig.x == p.x then CS.avanzar(orig); break end end
    end
    local ahora = Mundo.horas()
    local cambio = false
    for i = #e.preguntas, 1, -1 do
        if ahora > e.preguntas[i].vence then table.remove(e.preguntas, i); cambio = true end
    end
    if cambio then Motor.publicar() end
    if Motor.minutosDesdeArranque % CS.CADA_REVISION ~= 0 then return end
    local hablantes = CS.hablantes()
    if #hablantes < 2 then return end
    CS.intentarForzadas(hablantes)
    CS.intentarAmbiente(hablantes)
end

-- ---------------------------------------------------------------------------
-- Preguntas al jugador
-- ---------------------------------------------------------------------------

function CS.responder(jugador, args)
    local e = CS.estado()
    local idx = tonumber(args.pregunta)
    local q = idx ~= nil and e.preguntas[idx] or nil
    if q == nil or q.conv ~= args.conv then
        Motor.responder(jugador, "Ya siguieron con otra cosa.")
        return
    end
    local x, y = Mundo.posicion(jugador)
    if x == nil or math.sqrt((x - q.x) ^ 2 + (y - q.y) ^ 2) > 16 then
        Motor.responder(jugador, "Estas muy lejos.")
        return
    end
    local c = Conversas.get(q.conv)
    local op
    for _, o in ipairs(c ~= nil and c.pregunta.opciones or {}) do if o.id == args.opcion then op = o end end
    if op == nil then return end
    table.remove(e.preguntas, idx)
    local st = Motor.estado()
    st.memoria["conv." .. q.conv] = op.memoria ~= nil and op.memoria or op.id
    st.memoria["conv." .. q.conv .. ".quien"] = Mundo.nombreJugador(jugador)
    st.memoria["conv." .. q.conv .. ".hora"] = Mundo.horas()
    -- Las respuestas de los personajes van como una conversacion corta.
    local inst = q.inst ~= nil and st.arcos[q.inst] or nil
    local base = inst or SIN_INST
    local turnos = {}
    local dice = op.dice
    if type(dice) == "table" and type(dice[1]) == "string" then dice = { dice } end
    for _, d in ipairs(dice or {}) do
        local r = q.roles[d[1]]
        if r ~= nil and Mundo.actorVivoUid(r.uid) then
            turnos[#turnos + 1] = { uid = r.uid, nombre = r.nombre, texto = Motor.texto(base, d[2]) }
        end
    end
    if #turnos > 0 then
        local uids = {}
        for _, t in ipairs(turnos) do uids[#uids + 1] = t.uid end
        e.activas[#e.activas + 1] = { id = q.conv .. ":respuesta", turnos = turnos, i = 1,
            proximo = Motor.minutosDesdeArranque, x = q.x, y = q.y, uids = uids, roles = q.roles }
    end
    for _, accion in ipairs(op.acciones or {}) do
        if inst ~= nil then Motor.ejecutar(inst, accion)
        elseif Motor.inmediatas[accion[1]] ~= nil then pcall(Motor.inmediatas[accion[1]], SIN_INST, accion) end
    end
    if op.respuesta ~= nil then Motor.responder(jugador, Motor.texto(base, op.respuesta)) end
    Motor.publicar()
end

-- Lo que ve el cliente: preguntas abiertas (para el menu de clic derecho).
function CS.vista(v)
    local lista = {}
    for i, q in ipairs(CS.estado().preguntas) do
        lista[#lista + 1] = { i = i, conv = q.conv, texto = q.texto, opciones = q.opciones, x = q.x, y = q.y }
    end
    v.preguntas = lista
end

-- La charla suelta no pisa una conversacion.
function CS.charlaPausada(uid, x, y)
    if CS.ocupado(uid) then return true end
    return x ~= nil and CS.activaCerca(x, y, 20)
end

-- ---------------------------------------------------------------------------
-- Enganche con el motor
-- ---------------------------------------------------------------------------

function Mundo.actorVivoUid(uid)
    local a = Mundo.actor(uid)
    return a ~= nil and a.lifecycle ~= "dead"
end

Motor.inmediatas.conversar = function(inst, a)
    CS.forzar(a.id, inst)
    return true
end

Motor.tickExtra.conversas = CS.tick
Motor.comandosPublicos.responderConversa = CS.responder
Motor.charlaPausada = CS.charlaPausada
local yaVista = false
for _, f in ipairs(Motor.vistaExtra) do if f == CS.vista then yaVista = true end end
if not yaVista then Motor.vistaExtra[#Motor.vistaExtra + 1] = CS.vista end

Motor.comandosAdmin.conversaAhora = function(jugador, args)
    local c = Conversas.get(tostring(args.id))
    if c == nil then return "No existe esa conversacion." end
    local x, y = Mundo.posicion(jugador)
    local p = CS.preparar(c, CS.hablantes(), x, y)
    if p == nil then return "No estan los personajes cerca (o no se cumple la condicion)." end
    CS.empezar(p)
    return "Conversacion: " .. c.id
end

return CS
