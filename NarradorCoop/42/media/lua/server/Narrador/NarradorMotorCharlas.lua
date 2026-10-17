-- Narrador Co-op: motor de arcos, charlas.
-- Charlas (los personajes hablan solos con un jugador cerca) y residentes.
-- Parte de NarradorMotor.lua, que lo carga al final (no se carga solo).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end
if Narrador == nil or Narrador.Motor == nil or Narrador.Motor._partes == nil then return end
if Narrador.Motor._partes.charlas then return end
Narrador.Motor._partes.charlas = true

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor
local floor = math.floor
local grupo = Motor.grupoArco

-- ---------------------------------------------------------------------------
-- Charla: los personajes hablan solos cuando hay un jugador cerca
-- ---------------------------------------------------------------------------

Narrador.Charlas = Narrador.Charlas or {}

-- Habla un NPC cualquiera (por uid), con burbuja para los que esten cerca.
function Motor.decirUid(uid, nombre, texto)
    local x, y = Mundo.posicionActor(uid)
    Motor.enviar(nil, "decir", { uid = uid, nombre = nombre, texto = texto, x = x, y = y })
end

local function lineasDe(ch)
    if ch == nil then return nil end
    if type(ch.lista) == "string" then return Narrador.Charlas[ch.lista] end
    if type(ch.lista) == "table" then
        -- Varias listas juntas (por ejemplo, la charla normal mas las frases de Maulen).
        local todas = {}
        for _, nombre in ipairs(ch.lista) do
            for _, l in ipairs(Narrador.Charlas[nombre] or {}) do todas[#todas + 1] = l end
        end
        return todas
    end
    return ch.lineas
end

-- Elige una linea sin repetir hasta que se digan todas (Motor.sacarDeBolsa). miembros: { {uid, rol, nombre}, ... }
-- memoria: tabla donde se guarda el ritmo (ultima vez y lineas usadas).
local SIN_INST = { vars = {}, lugares = {}, grupos = {}, relojes = {}, elecciones = {}, usadas = {} }

function Motor.charlaElegir(lineas, miembros, memoria, radio, cada, inst)
    if type(lineas) ~= "table" or #lineas == 0 then return nil end
    local ahora = Mundo.horas()
    if memoria.ultima ~= nil and ahora - memoria.ultima < (cada or 0.4) then return nil end
    local cerca = {}
    for _, m in ipairs(miembros) do
        local x, y = Mundo.posicionActor(m[1])
        local pausada = Motor.charlaPausada ~= nil and x ~= nil and Motor.charlaPausada(m[1], x, y)
        if x ~= nil and not pausada and Mundo.jugadorCerca(x, y, radio or 12) ~= nil then cerca[m[2]] = m end
    end
    if Motor.vacia(cerca) then return nil end
    -- Version vieja: marcaba por numero de linea y se confundia al cambiar de lista.
    memoria.usadas = nil
    memoria.bolsa = memoria.bolsa or {}
    local claves, quien = {}, {}
    for _, l in ipairs(lineas) do
        local texto = l[2]
        if type(texto) == "string" and cerca[l[1]] ~= nil and quien[texto] == nil
                and (l.si == nil or Motor.cumple(inst or SIN_INST, l.si)) then
            claves[#claves + 1] = texto
            quien[texto] = cerca[l[1]]
        end
    end
    if #claves == 0 then return nil end
    local texto = Motor.sacarDeBolsa(memoria.bolsa, claves)
    memoria.ultima = ahora
    return quien[texto], texto
end

function Motor.charlar(inst)
    if inst.final ~= nil then return end
    local def = Defs.get(inst.def)
    local etapa = def ~= nil and def.etapas[inst.etapa] or nil
    local ch = etapa ~= nil and etapa.charla or nil
    local lineas = lineasDe(ch)
    if lineas == nil then return end
    local miembros = {}
    for _, gid in ipairs(type(ch.grupos) == "table" and ch.grupos or { ch.grupo }) do
        local g = inst.grupos[gid]
        if g ~= nil and g.estado == "listo" then
            for uid, m in pairs(g.miembros) do
                if m.vivo then miembros[#miembros + 1] = { uid, m.rol, m.nombre or m.rol } end
            end
        end
    end
    inst.charla = inst.charla or {}
    local m, texto = Motor.charlaElegir(lineas, miembros, inst.charla, ch.radio, ch.cada, inst)
    if m ~= nil then Motor.decirUid(m[1], m[3], Motor.texto(inst, texto)) end
end

-- Residentes: personajes que se quedan en el mundo cuando su historia ya termino (Sous
-- aliado en su base). Siguen con su nombre y conversando, pero A-Life los maneja normal.
function Motor.hacerResidentes(inst, a)
    local st = Motor.estado()
    local r = { charla = a.charla, miembros = {}, memoria = {} }
    -- Zona tranquila y banderas (inmortales en su base) que siguen valiendo despues.
    local l = a.lugar ~= nil and inst.lugares[a.lugar] or nil
    if l ~= nil then
        r.zona = { x = l.x, y = l.y, z = l.z or 0, radio = a.radio or 45, max = a.max_zombis or 3 }
    end
    r.banderas = a.banderas
    for _, gid in ipairs(a.grupos or {}) do
        local g = inst.grupos[gid]
        if g ~= nil then
            for uid, m in pairs(g.miembros) do
                if m.vivo then
                    local par = g.nombres ~= nil and g.nombres[m.rol] or nil
                    r.miembros[uid] = { rol = m.rol, nombre = m.nombre, apellido = par ~= nil and par[2] or nil }
                end
            end
        end
    end
    st.residentes[a.id] = r
    return true
end

function Motor.tickResidentes()
    local st = Motor.estado()
    for id, r in pairs(st.residentes) do
        local miembros, vivos = {}, 0
        for uid, m in pairs(r.miembros) do
            if not m.muerto then
                local actor = Mundo.actor(uid)
                if actor == nil or actor.lifecycle == "dead" then
                    m.faltas = (m.faltas or 0) + 1
                    if m.faltas >= 30 then m.muerto = true end
                else
                    m.faltas = 0
                    vivos = vivos + 1
                    miembros[#miembros + 1] = { uid, m.rol, m.nombre or m.rol }
                    if Motor.minutosDesdeArranque % 10 == 0 and m.nombre ~= nil then
                        Mundo.nombrarActor(uid, m.nombre, m.apellido)
                    end
                end
            end
        end
        if vivos == 0 and not Motor.vacia(r.miembros) then
            local quedan = false
            for _, m in pairs(r.miembros) do if not m.muerto then quedan = true end end
            if not quedan then st.residentes[id] = nil end
        end
        local m, texto = Motor.charlaElegir(Narrador.Charlas[r.charla], miembros, r.memoria, 10, 1.5)
        if m ~= nil then Motor.decirUid(m[1], m[3], texto) end
        if Motor.minutosDesdeArranque % 10 == 0 then
            if r.zona ~= nil and vivos > 0 then Mundo.limpiarZona(r.zona.x, r.zona.y, r.zona.radio, r.zona.max) end
            if r.banderas ~= nil then
                local ancla = r.zona ~= nil and { x = r.zona.x, y = r.zona.y, z = r.zona.z } or nil
                for _, mm in ipairs(miembros) do pcall(Mundo.banderas, mm[1], r.banderas, ancla) end
            end
        end
    end
end
