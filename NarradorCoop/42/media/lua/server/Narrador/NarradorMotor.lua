-- Narrador Co-op: motor de arcos.
-- Corre en el servidor (o en la partida local si es un jugador). Lleva el estado de
-- cada historia, evalua condiciones, ejecuta acciones y avisa a los clientes.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorLore"
require "Narrador/NarradorMundo"

Narrador = Narrador or {}
local Defs = Narrador.Defs
local Mundo = Narrador.Mundo

local Motor = Narrador.Motor or {}
Narrador.Motor = Motor

local MOD = Defs.MODULO
local floor = math.floor

Motor.minutosDesdeArranque = 0
Motor.MAX_DIARIO_ARCO = 30
Motor.MAX_DIARIO_GLOBAL = 40

-- ---------------------------------------------------------------------------
-- Estado persistente (se guarda con la partida)
-- ---------------------------------------------------------------------------

function Motor.estado()
    if Motor._estado ~= nil then return Motor._estado end
    local st
    if ModData ~= nil and ModData.getOrCreate ~= nil then
        st = ModData.getOrCreate("NarradorCoop")
    else
        Motor._sinModData = Motor._sinModData or {}
        st = Motor._sinModData
    end
    st.version = st.version or 1
    st.arcos = st.arcos or {}
    st.orden = st.orden or {}
    st.memoria = st.memoria or {}
    st.diario = st.diario or {}
    st.historial = st.historial or {}
    st.secuencia = st.secuencia or 0
    st.porAbrir = st.porAbrir or {}
    st.contactos = st.contactos or {}
    st.residentes = st.residentes or {}
    st.director = st.director or {}
    st.director.ultimoInicio = st.director.ultimoInicio or -100000
    st.director.veces = st.director.veces or {}
    st.director.ultimoPorDef = st.director.ultimoPorDef or {}
    Motor._estado = st
    return st
end

function Motor.reiniciar()
    local st = Motor.estado()
    st.arcos, st.orden, st.memoria, st.diario, st.historial = {}, {}, {}, {}, {}
    st.porAbrir = {}
    st.director.ultimoInicio, st.director.veces, st.director.ultimoPorDef = -100000, {}, {}
end

-- true si la tabla no tiene nada. El Lua del servidor de Zomboid no trae next(), asi que
-- se revisa con pairs.
function Motor.vacia(t)
    if type(t) ~= "table" then return true end
    for _ in pairs(t) do return false end
    return true
end

function Motor.copiar(valor)
    if type(valor) ~= "table" then return valor end
    local copia = {}
    for k, v in pairs(valor) do
        local tipo = type(v)
        if tipo == "table" then copia[k] = Motor.copiar(v)
        elseif tipo ~= "function" and tipo ~= "userdata" then copia[k] = v end
    end
    return copia
end

-- Numero fijo o rango {min, max}.
function Motor.cantidad(valor, porDefecto)
    if type(valor) == "table" then
        local a, b = tonumber(valor[1]) or 1, tonumber(valor[2]) or tonumber(valor[1]) or 1
        if b < a then a, b = b, a end
        return a + Mundo.azar(b - a + 1) - 1
    end
    return tonumber(valor) or porDefecto or 1
end

function Motor.sortear(spec)
    if type(spec) ~= "table" then return spec end
    if spec.rango ~= nil then return Motor.cantidad(spec.rango) end
    local valores = spec.valores or spec
    local pesos = spec.pesos
    if pesos == nil then return valores[Mundo.azar(#valores)] end
    local total = 0
    for i = 1, #valores do total = total + (tonumber(pesos[i]) or 1) end
    local tiro = Mundo.azar(math.max(1, floor(total)))
    local acumulado = 0
    for i = 1, #valores do
        acumulado = acumulado + (tonumber(pesos[i]) or 1)
        if tiro <= acumulado then return valores[i] end
    end
    return valores[#valores]
end

-- "var:nombre" -> valor de la variable sorteada; cualquier otra cosa se devuelve igual.
function Motor.valor(inst, v)
    if type(v) == "string" and string.sub(v, 1, 4) == "var:" then return inst.vars[string.sub(v, 5)] end
    return v
end

-- ---------------------------------------------------------------------------
-- Textos
-- ---------------------------------------------------------------------------

-- Elige el texto segun una variable ({por_var = "x", textos = {...}}) o al azar de una lista.
function Motor.resolverTexto(inst, t)
    if type(t) == "string" then return t end
    if type(t) ~= "table" then return "" end
    if t.por_var ~= nil then
        local valor = inst.vars[t.por_var]
        local opciones = t.textos ~= nil and t.textos[tostring(valor)] or nil
        if opciones == nil and t.textos ~= nil then opciones = t.textos.otro end
        return Motor.resolverTexto(inst, opciones)
    end
    if #t > 0 then
        -- Lista de textos: sale uno al azar sin repetir hasta que salgan todos (ver Motor.sacarDeBolsa).
        local claves = {}
        for i = 1, #t do claves[i] = type(t[i]) == "string" and t[i] or tostring(i) end
        local bolsas = nil
        if type(inst) == "table" then
            inst.bolsas = inst.bolsas or {}
            bolsas = inst.bolsas
        end
        local idLista = tostring(#t) .. ":" .. string.sub(tostring(claves[1]), 1, 60)
        local bolsa = bolsas ~= nil and bolsas[idLista] or nil
        if bolsas ~= nil and bolsa == nil then
            bolsa = {}
            bolsas[idLista] = bolsa
        end
        local elegida = bolsa ~= nil and Motor.sacarDeBolsa(bolsa, claves) or claves[Mundo.azar(#claves)]
        for i = 1, #t do
            if claves[i] == elegida then return Motor.resolverTexto(inst, t[i]) end
        end
        return Motor.resolverTexto(inst, t[1])
    end
    return ""
end

-- "Bolsa" de frases: cada clave sale una vez, al azar, hasta que salen todas las del grupo;
-- ahi el grupo se reinicia y se vuelve a sacar al azar. La ultima que salio no se repite
-- justo despues del reinicio (si hay mas de una). Las frases se guardan por su texto, asi
-- no se confunden aunque cambie la lista (otra etapa, otra version del mod).
-- bolsa: { dichas = { [texto] = true }, ultima = texto }. claves: lista de textos candidatos.
function Motor.sacarDeBolsa(bolsa, claves)
    if #claves == 0 then return nil end
    bolsa.dichas = bolsa.dichas or {}
    local libres = {}
    for _, k in ipairs(claves) do
        if not bolsa.dichas[k] then libres[#libres + 1] = k end
    end
    if #libres == 0 then
        -- Ya salieron todas: se reinicia solo este grupo de frases.
        for _, k in ipairs(claves) do bolsa.dichas[k] = nil end
        for _, k in ipairs(claves) do
            if k ~= bolsa.ultima or #claves == 1 then libres[#libres + 1] = k end
        end
    end
    local k = libres[Mundo.azar(#libres)]
    bolsa.dichas[k] = true
    bolsa.ultima = k
    return k
end

-- Plantillas extra {tipo:nombre} que agregan otros modulos (por ejemplo {rango:westpoint}).
Motor.plantillas = Motor.plantillas or {}

-- Reemplaza {var}, {nombre:var} y {lugar:id}.
function Motor.texto(inst, t)
    local s = Motor.resolverTexto(inst, t)
    local def = Defs.get(inst.def) or {}
    local resultado = string.gsub(s, "{([%w_:]+)}", function(clave)
        local tipo, nombre = string.match(clave, "^(%w+):([%w_]+)$")
        if tipo == "nombre" then
            local v = inst.vars[nombre]
            return def.nombres ~= nil and def.nombres[tostring(v)] or tostring(v)
        elseif tipo == "lugar" then
            local l = inst.lugares[nombre]
            return l ~= nil and l.etiqueta or "algun lugar"
        elseif tipo ~= nil and Motor.plantillas[tipo] ~= nil then
            local ok, r = pcall(Motor.plantillas[tipo], inst, nombre)
            if ok and r ~= nil then return tostring(r) end
            return "{" .. clave .. "}"
        end
        local v = inst.vars[clave]
        if v ~= nil then return tostring(v) end
        return "{" .. clave .. "}"
    end)
    return resultado
end

-- ---------------------------------------------------------------------------
-- Comunicacion con los clientes
-- ---------------------------------------------------------------------------

function Motor.enviar(jugador, comando, datos)
    if Mundo.esServidor() then
        if sendServerCommand == nil then return end
        if jugador ~= nil then
            pcall(sendServerCommand, jugador, MOD, comando, datos)
        else
            pcall(sendServerCommand, MOD, comando, datos)
        end
    elseif Narrador.Cliente ~= nil and Narrador.Cliente.recibir ~= nil then
        pcall(Narrador.Cliente.recibir, comando, datos)
    end
end

function Motor.responder(jugador, texto)
    Motor.enviar(jugador, "respuesta", { texto = texto })
end

function Motor.anotar(inst, texto)
    if texto == nil or texto == "" then return end
    local def = Defs.get(inst.def) or {}
    local entrada = { h = floor(Mundo.horas()), t = texto }
    inst.diario[#inst.diario + 1] = entrada
    while #inst.diario > Motor.MAX_DIARIO_ARCO do table.remove(inst.diario, 1) end
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = entrada.h, t = texto, arco = Motor.texto(inst, def.titulo or inst.def) }
    while #st.diario > Motor.MAX_DIARIO_GLOBAL do table.remove(st.diario, 1) end
    Motor.enviar(nil, "diario", { texto = texto, arco = Motor.texto(inst, def.titulo or inst.def) })
end

function Motor.avisar(inst, texto)
    if texto == nil or texto == "" then return end
    Motor.enviar(nil, "aviso", { texto = texto })
end

-- Radio en que se ven las opciones: el del lugar (un refugio grande tiene radio grande) o el de la etapa.
function Motor.radioEtapa(inst, etapa)
    local ancla = etapa.ancla ~= nil and inst.lugares[etapa.ancla] or nil
    return math.max(tonumber(etapa.radio) or 8, ancla ~= nil and tonumber(ancla.radio) or 0)
end

-- Distancia del jugador al NPC vivo mas cercano de un grupo del arco (nil si no hay).
function Motor.distanciaAGrupo(inst, grupoId, jugador)
    local g = grupoId ~= nil and inst.grupos[grupoId] or nil
    if g == nil then return nil end
    local px, py = Mundo.posicion(jugador)
    if px == nil then return nil end
    local mejor
    for uid, m in pairs(g.miembros) do
        if m.vivo then
            local x, y = Mundo.posicionActor(uid)
            if x ~= nil then
                local d = math.sqrt((x - px) ^ 2 + (y - py) ^ 2)
                if mejor == nil or d < mejor then mejor = d end
            end
        end
    end
    return mejor
end

-- Hace hablar a un NPC del arco: burbuja de A-Life sobre su cabeza para los que esten cerca.
function Motor.decir(inst, grupoId, rol, texto)
    local g = grupoId ~= nil and inst.grupos[grupoId] or nil
    rol = Motor.valor(inst, rol)
    local uid = g ~= nil and g.roles[tostring(rol)] or nil
    local m = uid ~= nil and g.miembros[uid] or nil
    if m == nil or not m.vivo then return false end
    local x, y = Mundo.posicionActor(uid)
    Motor.enviar(nil, "decir", { uid = uid, nombre = m.nombre or tostring(rol), texto = Motor.texto(inst, texto), x = x, y = y })
    return true
end

function Motor.opcionVisible(inst, op)
    if op.una_vez and inst.usadas[op.id] then return false end
    if op.si ~= nil and not Motor.cumple(inst, op.si) then return false end
    return true
end

-- ---------------------------------------------------------------------------
-- Diario de vida (lore): que tipo de historia es y que escribe el personaje
-- ---------------------------------------------------------------------------

-- "principal" (con numero de capitulo), "encargo" (de un misionero) o "secundaria".
function Motor.tipoDe(def)
    if def == nil then return "secundaria", nil end
    local capitulo = Narrador.Lore ~= nil and Narrador.Lore.capitulo(def.id) or nil
    if capitulo ~= nil then return "principal", capitulo end
    if def.encargo_nivel ~= nil then return "encargo", nil end
    return "secundaria", nil
end

function Motor.loreTexto(inst, spec)
    if spec == nil then return nil end
    local ok, t = pcall(Motor.texto, inst, spec)
    if not ok or t == nil or t == "" then return nil end
    return t
end

-- Datos del diario para un arco en curso.
function Motor.vistaLore(inst, def, v)
    local Lore = Narrador.Lore
    v.tipo, v.capitulo = Motor.tipoDe(def)
    v.inicio = inst.inicio
    if Lore ~= nil then
        v.intro = Motor.loreTexto(inst, Lore.intro(inst.def))
        if inst.final ~= nil then
            v.epilogo = Motor.loreTexto(inst, Lore.final(inst.def, inst.final))
        else
            v.lore = Motor.loreTexto(inst, Lore.etapa(inst.def, inst.etapa))
        end
    end
    if v.tipo == "encargo" then
        v.nivel, v.contacto = inst.vars.nivel, inst.vars.contacto
        v.contacto_nombre, v.ciudad = inst.vars.contacto_nombre, inst.vars.ciudad
        v.dueno, v.dueno_nombre = inst.vars.dueno, inst.vars.dueno_nombre
    end
end

-- Historias ya cerradas (las ultimas), con su epilogo para el diario.
function Motor.vistaHistorial()
    local st = Motor.estado()
    local lista = {}
    for i = math.max(1, #st.historial - 29), #st.historial do
        local h = st.historial[i]
        local def = Defs.get(h.def)
        local tipo, capitulo = h.tipo, h.capitulo
        if tipo == nil then tipo, capitulo = Motor.tipoDe(def) end
        lista[#lista + 1] = { def = h.def, final = h.final, fin = h.fin, inicio = h.inicio, tipo = tipo,
            capitulo = capitulo, dueno = h.dueno,
            titulo = h.titulo or (def ~= nil and def.titulo) or h.def, epilogo = h.epilogo }
    end
    return lista
end

-- Lo que ven los clientes: titulo, pista, opciones y ultimas anotaciones de cada arco.
function Motor.vista()
    local st = Motor.estado()
    local arcos = {}
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        local def = inst ~= nil and Defs.get(inst.def) or nil
        if def ~= nil then
            local etapa = def.etapas[inst.etapa] or {}
            local v = {
                id = inst.id, def = inst.def, etapa = inst.etapa,
                titulo = Motor.texto(inst, def.titulo or inst.def),
                pista = etapa.pista ~= nil and Motor.texto(inst, etapa.pista) or nil,
                terminado = inst.final ~= nil,
                opciones = {}, diario = {}, etapas = {}, npcs = {},
            }
            -- NPCs vivos de la historia: el cliente les apaga el menu de A-Life y
            -- muestra las opciones al estar cerca de cualquiera de ellos.
            if inst.final == nil then
                for _, g in pairs(inst.grupos) do
                    if g.estado == "listo" then
                        for uid, m in pairs(g.miembros) do
                            if m.vivo then v.npcs[#v.npcs + 1] = { uid = uid, nombre = m.nombre or m.rol } end
                        end
                    end
                end
            end
            local ancla = etapa.ancla ~= nil and inst.lugares[etapa.ancla] or nil
            if ancla ~= nil and inst.final == nil then
                v.ax, v.ay, v.az, v.radio = ancla.x, ancla.y, ancla.z or 0, Motor.radioEtapa(inst, etapa)
                for _, op in ipairs(etapa.opciones or {}) do
                    if Motor.opcionVisible(inst, op) then
                        v.opciones[#v.opciones + 1] = { id = op.id, texto = Motor.texto(inst, op.texto), submenu = op.submenu }
                    end
                end
            end
            for i = math.max(1, #inst.diario - 7), #inst.diario do
                v.diario[#v.diario + 1] = inst.diario[i]
            end
            for nombre in pairs(def.etapas) do v.etapas[#v.etapas + 1] = nombre end
            table.sort(v.etapas)
            pcall(Motor.vistaLore, inst, def, v)
            v.dueno = inst.vars.dueno
            pcall(Motor.vistaObjetivo, inst, def, etapa, v)
            for _, f in ipairs(Motor.vistaArcoExtra) do pcall(f, inst, def, v) end
            arcos[#arcos + 1] = v
        end
    end
    local defs = {}
    for _, def in ipairs(Defs.todos()) do defs[#defs + 1] = { id = def.id, titulo = def.titulo_menu or def.titulo or def.id } end
    local C = Narrador.Contactos
    local contactos = C ~= nil and C.vista() or {}
    local encargos = C ~= nil and C.encargosActivos() or {}
    local residentes = {}
    for _, r in pairs(st.residentes) do
        for uid, m in pairs(r.miembros) do if not m.muerto then residentes[#residentes + 1] = tostring(uid) end end
    end
    local okH, historial = pcall(Motor.vistaHistorial)
    local vista = { arcos = arcos, diario = st.diario, defs = defs, alife = Mundo.hayALife(), contactos = contactos,
        encargos = encargos, residentes = residentes, historial = okH and historial or {}, hora = floor(Mundo.horas()) }
    for _, f in ipairs(Motor.vistaExtra) do pcall(f, vista) end
    return vista
end

-- Hacia donde ir en la etapa actual (para la flecha y la brujula del cliente): la zona del
-- lugar que nombra la pista. Si la etapa dice objetivo = "id" se usa ese; objetivo = false lo apaga.
function Motor.vistaObjetivo(inst, def, etapa, v)
    if inst.final ~= nil or etapa.objetivo == false then return end
    local id = etapa.objetivo
    if id == nil and type(etapa.pista) == "string" then id = string.match(etapa.pista, "{lugar:([%w_]+)}") end
    local l = id ~= nil and inst.lugares[id] or nil
    if l == nil or l.temporal then return end
    -- Un edificio puntual (una sala que se busco en el mapa, o el misionero): la flecha lleva
    -- hasta el edificio mismo. Lo demas ("cerca de...", "los alrededores de...") marca la zona.
    -- etapa.flecha = "zona" o lugar.exacto = false obligan a marcar solo la zona.
    local exacto = l.exacto == true or l.sala ~= nil or id == "contacto"
    if l.exacto == false or etapa.flecha == "zona" then exacto = false end
    if exacto then
        v.objetivo = { x = floor(l.x), y = floor(l.y), z = floor(tonumber(l.z) or 0), r = 6, exacto = true,
            caja = type(l.caja) == "table" and l.caja or nil, id = id, tipo = def.indicador or "historia" }
    else
        local zona = l.zona or { x = l.x, y = l.y, r = math.max(10, tonumber(l.radio) or 10) }
        v.objetivo = { x = floor(zona.x), y = floor(zona.y), r = zona.r, id = id, tipo = def.indicador or "historia" }
    end
    local peligro = false
    for _, r in pairs(inst.relojes) do
        if r.activo and r.total ~= nil and r.total > 0 and (r.vence - Mundo.horas()) / r.total < 0.2 then peligro = true end
    end
    if inst.vars.peligro == true then peligro = true end
    v.objetivo.peligro = peligro
end

Motor.vistaExtra = Motor.vistaExtra or {}
Motor.vistaArcoExtra = Motor.vistaArcoExtra or {}

function Motor.publicar(jugador)
    Motor.enviar(jugador, "estado", Motor.vista())
end

-- ---------------------------------------------------------------------------
-- Condiciones
-- ---------------------------------------------------------------------------

local function grupo(inst, id)
    return inst.grupos[id]
end

Motor.condiciones = {
    cerca = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return Mundo.jugadorCerca(l.x, l.y, tonumber(c[3]) or 35) ~= nil
    end,
    horas = function(inst, c)
        return Mundo.horas() - (inst.etapaDesde or 0) >= (tonumber(Motor.valor(inst, c[2])) or 0)
    end,
    -- {"reloj_resta", id, fraccion}: al reloj le queda al menos esa fraccion (0.5 = la mitad).
    reloj_resta = function(inst, c)
        local r = inst.relojes[c[2]]
        if r == nil or not r.activo or r.total == nil or r.total <= 0 then return false end
        return (r.vence - Mundo.horas()) / r.total >= (tonumber(c[3]) or 0.5)
    end,
    eleccion = function(inst, c)
        return inst.elecciones[c[2]] == true
    end,
    var = function(inst, c)
        return inst.vars[c[2]] == c[3]
    end,
    memoria = function(inst, c)
        return Motor.estado().memoria[c[2]] == c[3]
    end,
    reloj_vencido = function(inst, c)
        local r = inst.relojes[c[2]]
        return r ~= nil and r.activo == true and Mundo.horas() >= r.vence
    end,
    grupo_listo = function(inst, c)
        local g = grupo(inst, c[2])
        return g ~= nil and g.estado == "listo"
    end,
    mato_jugador = function(inst, c)
        local g = grupo(inst, c[2])
        if g == nil then return false end
        for _, m in pairs(g.miembros) do if m.causa == "jugador" then return true end end
        return false
    end,
    muerto = function(inst, c)
        local g = grupo(inst, c[2])
        local uid = g ~= nil and g.roles[c[3]] or nil
        local m = uid ~= nil and g.miembros[uid] or nil
        return m ~= nil and m.vivo == false and m.retirado ~= true
    end,
    todos_muertos = function(inst, c)
        local g = grupo(inst, c[2])
        if g == nil or g.estado ~= "listo" then return false end
        if g.vacio then return true end
        local hay = false
        for _, m in pairs(g.miembros) do
            hay = true
            if m.vivo or m.retirado then return false end
        end
        return hay
    end,
    mensaje_entregado = function(inst, c)
        return inst.mensaje ~= nil and inst.mensaje.entregado == true
    end,
    -- {"alguien_tiene", objetoId}: algun jugador conectado lleva el objeto de la historia.
    alguien_tiene = function(inst, c)
        local etiqueta = inst.id .. ":" .. tostring(c[2])
        for _, p in ipairs(Mundo.jugadores()) do
            if Mundo.buscarItem(p, function(it) return Mundo.tieneEtiqueta(it, etiqueta) end) ~= nil then return true end
        end
        return false
    end,
    vivo = function(inst, c)
        local g = grupo(inst, c[2])
        local uid = g ~= nil and g.roles[tostring(Motor.valor(inst, c[3]))] or nil
        local m = uid ~= nil and g.miembros[uid] or nil
        return m ~= nil and m.vivo == true
    end,
    -- {"hora_entre", desde, hasta}: hora del dia (0-23), puede cruzar la medianoche.
    hora_entre = function(inst, c)
        local h = math.floor(Mundo.horas() % 24)
        local a, b = tonumber(c[2]) or 0, tonumber(c[3]) or 24
        if a <= b then return h >= a and h < b end
        return h >= a or h < b
    end,
    -- {"bajas_en", lugar, cantidad, radio}: zombis muertos cerca del lugar desde que empezo la etapa.
    bajas_en = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return Motor.contarBajas(l.x, l.y, tonumber(c[4]) or 40, inst.etapaDesde or 0) >= (tonumber(Motor.valor(inst, c[3])) or 1)
    end,
    -- {"bajas_menor_que", lugar, cantidad, radio}
    bajas_menor_que = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return Motor.contarBajas(l.x, l.y, tonumber(c[4]) or 40, inst.etapaDesde or 0) < (tonumber(Motor.valor(inst, c[3])) or 1)
    end,
    -- {"ausente", lugar, radio, horas}: nadie estuvo dentro del radio durante esas horas seguidas.
    ausente = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        local clave = tostring(c[2]) .. ":" .. tostring(c[3])
        inst.ausencias = inst.ausencias or {}
        if Mundo.jugadorCerca(l.x, l.y, tonumber(c[3]) or 60) ~= nil then
            inst.ausencias[clave] = nil
            return false
        end
        inst.ausencias[clave] = inst.ausencias[clave] or Mundo.horas()
        return Mundo.horas() - inst.ausencias[clave] >= (tonumber(c[4]) or 0.2)
    end,
    -- {"sin_zombis", lugar, radio}: no quedan zombis cerca del lugar.
    sin_zombis = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return not Mundo.zombiCerca(l.x, l.y, tonumber(c[3]) or 12)
    end,
    -- {"mem", clave}: la memoria de la partida tiene algo en esa clave.
    mem = function(inst, c)
        local v = Motor.estado().memoria[c[2]]
        return v ~= nil and v ~= false
    end,
    -- {"var_mayor", nombre, n}
    var_mayor = function(inst, c)
        return (tonumber(inst.vars[c[2]]) or 0) > (tonumber(c[3]) or 0)
    end,
    -- {"no", condicion}
    no = function(inst, c)
        return not Motor.cumple(inst, c[2])
    end,
    -- {"o", condicion1, condicion2, ...}
    o = function(inst, c)
        for i = 2, #c do if Motor.cumple(inst, c[i]) then return true end end
        return false
    end,
}

-- cuando = una condicion {"tipo", ...}, una lista de condiciones (todas deben cumplirse) o una funcion.
function Motor.cumple(inst, cuando)
    if cuando == nil then return true end
    if type(cuando) == "function" then
        local ok, r = pcall(cuando, inst, Motor)
        return ok and r == true
    end
    if type(cuando) ~= "table" then return false end
    if type(cuando[1]) == "string" then
        local f = Motor.condiciones[cuando[1]]
        if f == nil then
            Mundo.log("condicion desconocida: " .. tostring(cuando[1]))
            return false
        end
        local ok, r = pcall(f, inst, cuando)
        return ok and r == true
    end
    for _, c in ipairs(cuando) do
        if not Motor.cumple(inst, c) then return false end
    end
    return true
end

-- ---------------------------------------------------------------------------
-- Bajas de zombis (las usan limpiezas, sigilo y "lo que hiciste")
-- ---------------------------------------------------------------------------

Motor.MAX_BAJAS = 600

function Motor.registrarBaja(x, y)
    if x == nil then return end
    local st = Motor.estado()
    st.bajas = st.bajas or {}
    st.bajas[#st.bajas + 1] = { x = floor(x), y = floor(y), h = Mundo.horas() }
    while #st.bajas > Motor.MAX_BAJAS do table.remove(st.bajas, 1) end
end

function Motor.contarBajas(x, y, radio, desde)
    local n = 0
    for _, b in ipairs(Motor.estado().bajas or {}) do
        if b.h >= (desde or 0) and math.abs(b.x - x) <= radio and math.abs(b.y - y) <= radio then n = n + 1 end
    end
    return n
end

function Motor.onZombiMuerto(zombi)
    if zombi == nil then return end
    if Mundo.esNpc ~= nil and Mundo.esNpc(zombi) then return end
    local ok, x, y = pcall(function() return zombi:getX(), zombi:getY() end)
    if ok then Motor.registrarBaja(x, y) end
end

-- ---------------------------------------------------------------------------
-- Acciones
-- ---------------------------------------------------------------------------

-- Punto de referencia de una accion: un lugar del arco, "jugador" (uno al azar, ahora mismo)
-- o coordenadas explicitas.
function Motor.lugarDe(inst, accion)
    if accion.x ~= nil and accion.y ~= nil then
        return { x = accion.x, y = accion.y, z = accion.z or 0, etiqueta = "ahi" }
    end
    local id = accion.lugar
    if id == "jugador" then
        local j = Mundo.jugadorAlAzar()
        if j == nil then return nil end
        local x, y, z = Mundo.posicion(j)
        return { x = x, y = y, z = z or 0, etiqueta = "tu zona", jugador = j }
    end
    if id == "aviso" then
        -- Donde aparece un mensajero: el refugio (del que inicio el arco o de cualquiera)
        -- o, si nadie tiene, cerca de un jugador.
        if inst.lugares.aviso ~= nil then return inst.lugares.aviso end
        local preferido
        for _, p in ipairs(Mundo.jugadores()) do
            if Mundo.nombreJugador(p) == inst.refNombre then preferido = p end
        end
        local _, refugio = Mundo.jugadorConRefugio(preferido)
        if refugio ~= nil then
            inst.lugares.aviso = Motor.copiar(refugio)
            return inst.lugares.aviso
        end
        local j = preferido or Mundo.jugadorAlAzar()
        if j == nil then return nil end
        local x, y, z = Mundo.posicion(j)
        local angulo = (Mundo.azar(360) / 180) * math.pi
        return { x = floor(x + math.cos(angulo) * 22), y = floor(y + math.sin(angulo) * 22), z = z or 0,
            etiqueta = "cerca de ustedes", jugador = j, temporal = true }
    end
    if id == nil or id == "ref" then
        return { x = inst.refX, y = inst.refY, z = 0, etiqueta = "los alrededores" }
    end
    return inst.lugares[id]
end

function Motor.retirarGrupo(inst, id)
    local g = grupo(inst, id)
    if g == nil then return end
    for uid, m in pairs(g.miembros) do
        if m.vivo then
            Mundo.retirar(uid)
            m.vivo, m.retirado, m.causa = false, true, "retirado"
        end
    end
end

function Motor.transformar(inst, accion)
    local rol = Motor.valor(inst, accion.rol)
    local g = grupo(inst, accion.grupo)
    if g == nil or rol == nil then return true end
    local uid = g.roles[tostring(rol)]
    local m = uid ~= nil and g.miembros[uid] or nil
    if m == nil or not m.vivo then return true end
    local x, y, z = Mundo.posicionActor(uid)
    Mundo.retirar(uid)
    m.vivo, m.retirado, m.causa = false, true, "transformado"
    if x == nil then return true end
    local femenino = m.femenino == true
    if Mundo.cargado(x, y, z) ~= nil and Mundo.jugadorCerca(x, y, 60) ~= nil then
        Mundo.zombiEn(x, y, z, femenino)
    else
        Motor.diferir(inst, { "zombi_en", x = floor(x), y = floor(y), z = floor(z or 0), femenino = femenino })
    end
    return true
end

function Motor.diferir(inst, accion)
    local p = Motor.copiar(accion)
    local st = Motor.estado()
    st.secuencia = st.secuencia + 1
    p.seq, p.fallos, p.listo = st.secuencia, nil, nil
    if accion.retraso ~= nil then p.listo = Mundo.horas() + (tonumber(accion.retraso) or 0) end
    inst.pendientes[#inst.pendientes + 1] = p
    return true
end

-- Acciones que se hacen al tiro, no necesitan que el lugar este cargado.
Motor.inmediatas = {
    lugar = function(inst, a)
        -- Lugar ya elegido de antes (por ejemplo, el del rumor que se escucho): se respeta.
        if inst.lugares[a.id] ~= nil and inst.lugares[a.id].prefijado then return true end
        local desde = a.desde ~= nil and inst.lugares[a.desde] or nil
        local x, y = inst.refX, inst.refY
        if desde ~= nil then x, y = desde.x, desde.y end
        local l = Mundo.buscarLugar(a, x, y)
        if l == nil then
            -- Sin lugar: si el arco ya tiene otro, usar ese para no trabar la historia.
            for _, otro in pairs(inst.lugares) do
                inst.lugares[a.id] = Motor.copiar(otro)
                Mundo.log("sin lugar para '" .. tostring(a.id) .. "' en " .. inst.id .. ", se reutiliza otro")
                return true
            end
            return false, "no se encontro un lugar para '" .. tostring(a.id) .. "'"
        end
        inst.lugares[a.id] = l
        return true
    end,
    lugar_jugador = function(inst, a)
        local j = Mundo.jugadorAlAzar()
        if j == nil then return false, "sin jugadores" end
        local x, y, z = Mundo.posicion(j)
        local pueblo = Mundo.puebloCercano(x, y)
        inst.lugares[a.id] = { x = floor(x), y = floor(y), z = floor(z or 0),
            etiqueta = pueblo ~= nil and ("los alrededores de " .. pueblo.label) or "tu zona" }
        return true
    end,
    -- El refugio del jugador que dio origen al arco (o de cualquiera que tenga uno).
    lugar_refugio = function(inst, a)
        local preferido
        for _, p in ipairs(Mundo.jugadores()) do
            if Mundo.nombreJugador(p) == inst.refNombre then preferido = p end
        end
        local _, refugio = Mundo.jugadorConRefugio(preferido)
        if refugio == nil then return false, "nadie tiene un refugio reclamado" end
        inst.lugares[a.id] = refugio
        return true
    end,
    decir = function(inst, a)
        Motor.decir(inst, a.grupo, a.rol, a.texto)
        return true
    end,
    -- Guarda un lugar en la memoria de la partida para que otro capitulo lo reuse.
    memoria_lugar = function(inst, a)
        local l = inst.lugares[a.lugar]
        if l ~= nil then Motor.estado().memoria["lugar." .. a.clave] = Motor.copiar(l) end
        return true
    end,
    -- Recupera un lugar guardado por otro capitulo; si no existe, lo busca como "lugar".
    lugar_memoria = function(inst, a)
        local l = Motor.estado().memoria["lugar." .. tostring(a.clave)]
        if type(l) == "table" then
            inst.lugares[a.id] = Motor.copiar(l)
            return true
        end
        return Motor.inmediatas.lugar(inst, a)
    end,
    -- Crea o actualiza una faccion propia en A-Life (ver Narrador.Facciones) y su postura.
    faccion = function(inst, a)
        local spec = Narrador.Facciones ~= nil and Narrador.Facciones[a.id] or nil
        if spec == nil then Mundo.log("faccion desconocida: " .. tostring(a.id)); return true end
        local copia = Motor.copiar(spec)
        copia.postura = a.postura or copia.postura
        -- Si cambio la version de la faccion (stats, ropa...), se reescriben los perfiles.
        local st = Motor.estado()
        local claveVer = "faccion_ver." .. a.id
        copia.rehacer = st.memoria[claveVer] ~= (spec.version or 1)
        local ok, razon = Mundo.crearFaccion(copia)
        if ok then st.memoria[claveVer] = spec.version or 1 end
        if not ok then Mundo.log("no se pudo crear la faccion " .. tostring(a.id) .. ": " .. tostring(razon)) end
        Motor.estado().memoria["faccion." .. a.id] = copia.postura
        return true
    end,
    -- Habla el contacto de la ciudad que dio el encargo.
    decir_contacto = function(inst, a)
        local C = Narrador.Contactos
        if C ~= nil then C.decir(inst.vars.contacto, Motor.texto(inst, a.texto)) end
        return true
    end,
    -- Deja anotado que hay que abrir otra historia (capitulo siguiente). El director la
    -- inicia apenas pueda, sin respetar los tiempos entre eventos.
    abrir = function(inst, a)
        local st = Motor.estado()
        st.porAbrir[#st.porAbrir + 1] = { def = a.def, listo = Mundo.horas() + (tonumber(a.horas) or 0), desde = inst.def }
        return true
    end,
    -- Un mensajero trae la noticia (en vez de la radio). Aparece en el refugio o cerca de
    -- un jugador; cuando alguien se le acerca, entrega el mensaje solo.
    mensajero = function(inst, a)
        local texto = a.texto
        if inst.vars.rumor_seguido == true then
            local base = Motor.resolverTexto(inst, texto)
            texto = "Ya te habras enterado, no? Lo andan diciendo por todos lados. " .. tostring(base)
        end
        inst.mensaje = { texto = texto, diario = a.diario, nota = a.nota, entregado = false,
            llegada = a.llegada }
        local perfiles = Motor.PERFILES_MENSAJERO
        local perfil = a.perfil ~= nil and Motor.valor(inst, a.perfil) or nil
        if perfil == nil then perfil = perfiles[Mundo.azar(#perfiles)] end
        Motor.diferir(inst, { "npcs", id = "mensajero", lugar = "aviso", radio = 70, no_mas_cerca = 12,
            modo = "guard", quietos = true, correa = 2, inmortales = true, postura = "friendly",
            perfiles = { { "mensajero", perfil } },
            nombres = a.nombre ~= nil and { mensajero = { a.nombre[1], a.nombre[2] } } or nil })
        return true
    end,
    residentes = function(inst, a) return Motor.hacerResidentes(inst, a) end,
    -- Cambia en vivo las banderas de un grupo: {"banderas", grupo = "sous", inmortales = false}.
    -- Queda guardado en el grupo, asi el repaso periodico no lo deshace.
    banderas = function(inst, a)
        local g = inst.grupos[a.grupo]
        if g == nil then return true end
        g.accion = g.accion or {}
        for _, k in ipairs({ "inmortales", "quietos", "correa", "banderas" }) do
            if a[k] ~= nil then g.accion[k] = a[k] end
        end
        if a.inmortales == false then g.accion.mortales = true end
        Motor.banderasGrupo(inst, g)
        return true
    end,
    -- Entrega un mapa con la zona de un lugar: {"mapa", lugar = "escondite"}.
    mapa = function(inst, a) Motor.darMapaZona(inst, a.lugar, a); return true end,
    -- Un punto a unos metros de otro lugar del arco (para que un grupo llegue "al lado").
    lugar_cerca = function(inst, a)
        local base = inst.lugares[a.de]
        if base == nil then return false, "sin lugar base para '" .. tostring(a.id) .. "'" end
        local d = tonumber(a.distancia) or 20
        inst.lugares[a.id] = { x = base.x + d, y = base.y + floor(d / 2), z = base.z or 0,
            etiqueta = "cerca de " .. tostring(base.etiqueta) }
        return true
    end,
    -- Cuenta quien murio de un grupo. Deja variables (bajas, bajas_nombres, murio_<rol>,
    -- testigo, lider_*) y lo anota en la memoria de la partida con el prefijo dado.
    contar_bajas = function(inst, a)
        local st = Motor.estado()
        local prefijo = a.memoria or "bajas"
        local g = inst.grupos[a.grupo]
        local nombres, vivos, n = {}, {}, 0
        if g ~= nil then
            for _, m in pairs(g.miembros) do
                if not m.vivo and not m.retirado then
                    n = n + 1
                    nombres[#nombres + 1] = Motor.nombreCompleto(g, m)
                    inst.vars["murio_" .. m.rol] = true
                    st.memoria[prefijo .. "_murio_" .. m.rol] = true
                elseif m.vivo or m.retirado then
                    vivos[#vivos + 1] = Motor.nombreCompleto(g, m)
                end
            end
        end
        table.sort(nombres)
        table.sort(vivos)
        inst.vars.bajas = n
        inst.vars.hubo_bajas = n > 0
        inst.vars.bajas_nombres = #nombres > 0 and table.concat(nombres, ", ") or "nadie"
        inst.vars.testigo = vivos[1]
        for _, par in ipairs(a.lider_orden or {}) do
            if st.memoria[prefijo .. "_murio_" .. par[1]] ~= true then
                inst.vars.lider_rol, inst.vars.lider_perfil, inst.vars.lider_nombre = par[1], par[2], par[3]
                st.memoria[prefijo .. "_lider"] = par[1]
                st.memoria[prefijo .. "_lider_perfil"] = par[2]
                st.memoria[prefijo .. "_lider_nombre"] = par[3]
                break
            end
        end
        return true
    end,
    aviso = function(inst, a) Motor.avisar(inst, Motor.texto(inst, a.texto)); return true end,
    diario = function(inst, a) Motor.anotar(inst, Motor.texto(inst, a.texto)); return true end,
    reloj = function(inst, a)
        local horas = Motor.cantidad(Motor.valor(inst, a.horas), 24)
        inst.relojes[a.id] = { vence = Mundo.horas() + horas, activo = true, total = horas }
        return true
    end,
    detener_reloj = function(inst, a)
        if inst.relojes[a.id] ~= nil then inst.relojes[a.id].activo = false end
        return true
    end,
    memoria = function(inst, a)
        Motor.estado().memoria[a.clave] = Motor.valor(inst, a.valor)
        return true
    end,
    variable = function(inst, a)
        inst.vars[a.nombre] = Motor.valor(inst, a.valor)
        return true
    end,
    retirar = function(inst, a) Motor.retirarGrupo(inst, a.grupo); return true end,
    transformar = function(inst, a) return Motor.transformar(inst, a) end,
}

-- Acciones que esperan a que un jugador este cerca y el lugar este cargado.
Motor.diferidas = {
    -- Opciones extra:
    --   fija = true: sin la escala del arco ni el descuento del rumor (cantidad exacta).
    --   por_jugador = n: suma n por cada jugador cerca del lugar despues del primero.
    --   caminantes = true: ningun corredor en esta oleada.
    --   meta = "var", meta_frac = 0.8: deja en inst.vars[meta] cuantos hay que matar.
    --   planta_baja = true: en el piso de la calle (z = 0).
    oleada = function(inst, p, l)
        local n = Motor.cantidad(p.cantidad, 12)
        if not p.fija then
            n = n * (tonumber(inst.vars.escala) or 1)
            -- Si siguieron el rumor, llegaron preparados: menos muertos.
            if inst.vars.rumor_seguido == true then n = n * 0.7 end
        end
        if tonumber(p.por_jugador) ~= nil then
            local cerca = 0
            for _, j in ipairs(Mundo.jugadores()) do
                local x, y = Mundo.posicion(j)
                if Mundo.vivo(j) and x ~= nil and math.sqrt((x - l.x) ^ 2 + (y - l.y) ^ 2) <= 120 then cerca = cerca + 1 end
            end
            n = n + tonumber(p.por_jugador) * math.max(0, cerca - 1)
        end
        -- planta_baja: aparecen en la calle aunque el lugar este en un segundo piso.
        local z = p.planta_baja and 0 or l.z
        local total = Mundo.oleada(l.x, l.y, z, math.max(1, floor(n + 0.5)), p.min, p.max, { caminantes = p.caminantes })
        if p.meta ~= nil then inst.vars[p.meta] = math.max(1, floor(total * (tonumber(p.meta_frac) or 1))) end
        return true
    end,
    objeto = function(inst, p, l)
        local item = Mundo.crearItem(p.tipo)
        if item == nil then Mundo.log("no existe el item " .. tostring(p.tipo)); return true end
        Mundo.nombrar(item, p.nombre ~= nil and Motor.texto(inst, p.nombre) or nil, inst.id .. ":" .. tostring(p.id))
        return Mundo.dejarEnSuelo(l.x, l.y, l.z, item)
    end,
    nota = function(inst, p, l)
        local nota = Mundo.crearNota(Motor.texto(inst, p.titulo or "Nota"), Motor.texto(inst, p.texto))
        return Mundo.dejarEnSuelo(l.x, l.y, l.z, nota)
    end,
    recompensa = function(inst, p, l)
        for _, tipos in ipairs(p.items or {}) do
            local item = Mundo.crearItem(tipos)
            if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        end
        return true
    end,
    -- Botin segun la dificultad del encargo, con chance chica de un arma "chetada".
    recompensa_nivel = function(inst, p, l)
        local L = Narrador.Legendario
        local nivel = tostring(inst.vars.nivel or "facil")
        for _, tipos in ipairs(Motor.BOTIN[nivel] or Motor.BOTIN.facil) do
            local item = Mundo.crearItem(tipos)
            if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        end
        local chance = Motor.CHANCE_CHETADA[nivel] or 0
        local R = Narrador.Reputacion
        if R ~= nil and chance > 0 then chance = chance + R.bonusChetada(inst.vars.dueno, inst.vars.contacto) end
        chance = chance + (tonumber(inst.vars.chetada_extra) or 0)
        if L ~= nil and chance > 0 and Mundo.azar(100) <= chance then
            for _, item in ipairs(L.crear("arma", "chetada")) do Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
            Motor.avisar(inst, "Entre el pago viene algo especial: un arma en un estado increible.")
        end
        return true
    end,
    legendario = function(inst, p, l)
        local L = Narrador.Legendario
        if L == nil then return true end
        if p.clase == "auto" then return L.crearAuto(l.x, l.y, l.z) end
        for _, item in ipairs(L.crear(p.clase, "legendaria")) do Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        return true
    end,
    zombi_en = function(inst, p, l)
        Mundo.zombiEn(l.x, l.y, l.z, p.femenino)
        return true
    end,
    -- Varias pastillas K-93 iguales; "reales" de ellas son las verdaderas: un numero, un rango
    -- { min, max } o "var:x" true/false (1 o 0). Las verdaderas van en posiciones distintas.
    pastillas = function(inst, p, l)
        local n = Motor.cantidad(p.cantidad, 4)
        local reales = p.reales
        if reales == true then reales = 1 elseif reales == false or reales == nil then reales = 0 end
        reales = math.min(Motor.cantidad(reales, 0), n)
        local orden = {}
        for i = 1, n do orden[i] = i end
        local cual = {}
        for i = 1, reales do
            local j = i + Mundo.azar(n - i + 1) - 1
            orden[i], orden[j] = orden[j], orden[i]
            cual[orden[i]] = true
        end
        for i = 1, n do
            local item = Mundo.crearItem({ "Narrador.CuraZ", "Base.Pills" })
            if item ~= nil then
                Mundo.nombrar(item, p.nombre ~= nil and Motor.texto(inst, p.nombre) or nil, inst.id .. ":" .. tostring(p.id))
                Mundo.marcarPastilla(item, cual[i] == true)
                Mundo.dejarEnSuelo(l.x, l.y, l.z, item)
            end
        end
        return true
    end,
    corredores = function(inst, p, l)
        local n = Motor.cantidad(p.cantidad, 6) * (tonumber(inst.vars.escala) or 1)
        Mundo.corredores(l.x, l.y, l.z, math.max(1, floor(n + 0.5)), p.min, p.max)
        return true
    end,
    npcs = function(inst, p, l, jugador) return Motor.pedirGrupo(inst, p, l, jugador) end,
    bandidos = function(inst, p, l, jugador)
        p.hostiles = true
        return Motor.pedirGrupo(inst, p, l, jugador)
    end,
}

-- Campos de primer nivel escritos como "var:nombre" toman el valor de la variable del arco
-- (asi un mismo arco sirve para encargos generados: cantidades, salas, textos...).
function Motor.resolverVars(inst, accion)
    local copia
    for k, v in pairs(accion) do
        if k ~= 1 and type(v) == "string" and string.sub(v, 1, 4) == "var:" then
            copia = copia or Motor.copiarPlano(accion)
            copia[k] = inst.vars[string.sub(v, 5)]
        end
    end
    return copia or accion
end

function Motor.copiarPlano(t)
    local c = {}
    for k, v in pairs(t) do c[k] = v end
    return c
end

function Motor.ejecutar(inst, accion)
    if type(accion) ~= "table" or type(accion[1]) ~= "string" then return true end
    if accion.si ~= nil and not Motor.cumple(inst, accion.si) then return true end
    accion = Motor.resolverVars(inst, accion)
    local tipo = accion[1]
    if tipo == "retirar_lejos" or tipo == "retirar_miembros" or Motor.diferidas[tipo] ~= nil then
        return Motor.diferir(inst, accion)
    end
    local f = Motor.inmediatas[tipo]
    if f == nil then
        Mundo.log("accion desconocida: " .. tostring(tipo))
        return true
    end
    if accion.retraso ~= nil then return Motor.diferir(inst, accion) end
    local ok, resultado, razon = pcall(f, inst, accion)
    if not ok then
        Mundo.log("error en accion " .. tipo .. " de " .. inst.id .. ": " .. tostring(resultado))
        return true
    end
    return resultado, razon
end

-- ---------------------------------------------------------------------------
-- Grupos de NPCs (A-Life)
-- ---------------------------------------------------------------------------

-- Perfiles amistosos de A-Life que hacen de mensajeros.
Motor.PERFILES_MENSAJERO = { "k93_hensley_family_02", "k93_hensley_family_05", "k93_red_cross_03",
    "k93_truckstop_02", "k93_vfd_03", "k93_county_ems_04", "k93_red_cross_02", "k93_hensley_family_03" }

-- Botin por dificultad (cada entrada: alternativas por si un item no existe).
Motor.BOTIN = {
    facil = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.Bandage" },
              { "Base.Bullets9mmBox", "Base.Bullets9mm" } },
    medio = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.Bandage" },
              { "Base.Bandage" }, { "Base.Pills" }, { "Base.ShotgunShells" }, { "Base.Bullets9mmBox", "Base.Bullets9mm" },
              { "Base.Machete", "Base.Crowbar" } },
    dificil = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedBeans", "Base.CannedBeans" },
                { "Base.Antibiotics", "Base.Pills" }, { "Base.Bandage" }, { "Base.Bandage" },
                { "Base.ShotgunShells" }, { "Base.ShotgunShells" }, { "Base.Shotgun", "Base.DoubleBarrelShotgun" },
                { "Base.Vest_BulletPolice", "Base.Vest_BulletCivilian" } },
}
Motor.BOTIN.cura = Motor.BOTIN.dificil
Motor.CHANCE_CHETADA = { facil = 0, medio = 5, dificil = 15 }

-- Facciones hostiles de A-Life que se usan cuando un evento pide "bandidos" sin decir cuales.
Motor.FACCIONES_BANDIDAS = { "alife_hobbs", "alife_cornfield", "alife_tollmen", "alife_pit",
    "alife_dixie_road", "alife_countyline" }

-- "solo_de_grupo": solo los roles que estan vivos (o se fueron) en ese otro grupo del arco.
-- "sin_muertos_de": quita los roles que murieron en otra historia (memoria "<x>_murio_<rol>").
function Motor.filtrarPerfiles(inst, p)
    local lista = {}
    local st = Motor.estado()
    local otro = p.solo_de_grupo ~= nil and inst.grupos[p.solo_de_grupo] or nil
    for _, par in ipairs(p.perfiles or {}) do
        local sirve = true
        if p.solo_de_grupo ~= nil then
            local uid = otro ~= nil and otro.roles[par[1]] or nil
            local m = uid ~= nil and otro.miembros[uid] or nil
            sirve = m ~= nil and (m.vivo or m.retirado == true)
        end
        if sirve and p.sin_muertos_de ~= nil and st.memoria[p.sin_muertos_de .. "_murio_" .. par[1]] == true then
            sirve = false
        end
        if sirve then lista[#lista + 1] = par end
    end
    -- "recortar" = {min, max}: quedan los "fijos" primeros (por ejemplo Maulen) y una
    -- cantidad al azar del resto (sus matones).
    if p.recortar ~= nil then
        local fijos = tonumber(p.fijos) or 0
        local extra = Motor.cantidad(p.recortar, 0)
        local recortada = {}
        for i, par in ipairs(lista) do
            if i <= fijos + extra then recortada[#recortada + 1] = par end
        end
        lista = recortada
    end
    return lista
end

function Motor.perfilPropio(id)
    for _, f in pairs(Narrador.Facciones or {}) do
        for _, m in ipairs(f.miembros or {}) do
            if m.id == id then return m end
        end
    end
    return nil
end

function Motor.pedirGrupo(inst, p, l, jugador)
    if not Mundo.hayALife() then
        Mundo.log("se pidio un grupo de NPCs pero Project A-Life no esta activo")
        return true
    end
    local g = inst.grupos[p.id]
    if g == nil then
        g = { miembros = {}, roles = {}, intentos = 0, rolPorPerfil = {}, femeninos = {}, nombres = {} }
        inst.grupos[p.id] = g
    end
    -- Nombres fijos por rol: { padre = { "Daniel", "Bell" }, ... }
    for rol, par in pairs(p.nombres or {}) do g.nombres[rol] = { par[1], par[2] } end
    if g.estado == "pidiendo" or g.estado == "listo" then return true end
    g.intentos = g.intentos + 1
    local requestId = "narrador:" .. inst.id .. ":" .. tostring(p.id) .. ":" .. tostring(g.intentos)
    local args = {
        requestId = requestId,
        x = floor(l.x), y = floor(l.y), z = floor(l.z or 0),
        mode = p.modo or "guard",
        radius = p.radio_grupo or 6,
        distance = 0,
        separation = p.separacion or 1,
        atomicGroup = true,
        persistent = true,
    }
    if p.perfiles ~= nil then
        args.profileIds = {}
        local perfiles = Motor.filtrarPerfiles(inst, p)
        if #perfiles == 0 then
            -- No queda nadie para este grupo (por ejemplo, todos murieron antes): grupo vacio.
            g.estado, g.vacio = "listo", true
            Motor.revisarSalidas(inst, 0)
            return true
        end
        for _, par in ipairs(perfiles) do
            local perfil = tostring(Motor.valor(inst, par[2]))
            -- Perfiles propios del Narrador (Sous): nombre fijo y respaldo si A-Life no lo tiene.
            local propio = Motor.perfilPropio(perfil)
            if propio ~= nil then
                if g.nombres[par[1]] == nil and not propio.nombre_al_azar then
                    local n, a = string.match(propio.nombre, "^(%S+)%s+(.+)$")
                    g.nombres[par[1]] = { n or propio.nombre, a or "" }
                end
                if propio.respaldo ~= nil and not Mundo.existePerfil(perfil) then perfil = propio.respaldo end
            end
            args.profileIds[#args.profileIds + 1] = perfil
            g.rolPorPerfil[perfil] = par[1]
        end
        args.count = #args.profileIds
    else
        local faccion = p.faccion
        if faccion == nil and p.hostiles then faccion = Motor.FACCIONES_BANDIDAS end
        if type(faccion) == "table" then faccion = faccion[Mundo.azar(#faccion)] end
        args.factionId = faccion
        args.count = Motor.cantidad(p.cantidad, 2)
    end
    for _, rol in ipairs(p.femeninos or {}) do g.femeninos[rol] = true end
    if p.hostiles then
        args.hostileOverride = true
        args.playerKeepOut = p.distancia_minima or 18
        if jugador ~= nil then args.targetUsername = Mundo.nombreJugador(jugador) end
    else
        args.hostileOverride = false
        args.playerStance = p.postura or "friendly"
        args.playerKeepOut = p.distancia_minima or 0
    end
    if p.quietos then
        args.stationary = true
        args.leashRadius = p.correa or 4
    elseif p.correa ~= nil then
        -- Se mueven (por el edificio y los alrededores) pero sin alejarse mas que la correa.
        args.leashRadius = p.correa
    end
    if p.inmortales then args.invulnerable = true end
    if p.salud ~= nil then args.health = p.salud end
    for clave, valor in pairs(p.banderas or {}) do args[clave] = valor end

    -- Nombres de la historia: se reservan para que cada NPC nazca con el suyo.
    local porPerfil, hay = {}, false
    for perfil, rol in pairs(g.rolPorPerfil) do
        local par = g.nombres[rol]
        if par ~= nil then porPerfil[perfil] = { par[1], par[2] }; hay = true end
    end
    if hay then Mundo.reservarNombres(requestId, porPerfil) end

    g.accion = Motor.copiar(p)
    local instId, grupoId = inst.id, p.id
    local ok, razon = Mundo.spawnGrupo(jugador, args, function(resultado)
        Motor.grupoListo(instId, grupoId, resultado)
    end)
    if not ok then
        Mundo.log("A-Life rechazo el grupo '" .. tostring(p.id) .. "' de " .. inst.id .. ": " .. tostring(razon))
        return g.intentos >= 6
    end
    g.estado, g.requestId, g.pedido = "pidiendo", requestId, Mundo.horas()
    if p.lugar == "aviso" and l.temporal then
        inst.lugares.aviso = { x = floor(l.x), y = floor(l.y), z = floor(l.z or 0), etiqueta = l.etiqueta }
    end
    return true
end

function Motor.grupoListo(instId, grupoId, resultado)
    local inst = Motor.estado().arcos[instId]
    if inst == nil then return end
    local g = inst.grupos[grupoId]
    if g == nil then return end
    local uids = type(resultado) == "table" and resultado.actorUids or nil
    if type(uids) ~= "table" or #uids == 0 then
        g.estado = "fallo"
        Mundo.log("el grupo '" .. tostring(grupoId) .. "' de " .. instId .. " no aparecio: "
            .. tostring(type(resultado) == "table" and resultado.reason or "?"))
        if g.intentos < 6 and g.accion ~= nil then Motor.diferir(inst, g.accion) end
        return
    end
    for i, uid in ipairs(uids) do
        local actor = Mundo.actor(uid)
        local rol = actor ~= nil and g.rolPorPerfil[tostring(actor.profileId)] or nil
        if rol == nil or g.roles[rol] ~= nil then rol = "miembro" .. tostring(i) end
        local par = g.nombres ~= nil and g.nombres[rol] or nil
        g.miembros[uid] = { rol = rol, vivo = true, femenino = g.femeninos[rol] == true,
            nombre = par ~= nil and par[1] or nil }
        g.roles[rol] = uid
    end
    g.estado = "listo"
    for uid in pairs(g.miembros) do Mundo.uidsPropios[tostring(uid)] = true end
    Motor.nombrarGrupo(g)
    Motor.banderasGrupo(inst, g)
    if g.accion ~= nil and g.accion.acompanar then Motor.acompanarGrupo(inst, g) end
    if grupoId == "mensajero" and inst.mensaje ~= nil then
        local l = inst.lugares.aviso
        local texto = inst.mensaje.llegada
            or ((l ~= nil and l.sala ~= nil) and "Alguien llego a {lugar:aviso} preguntando por ustedes."
                or "Alguien se acerca buscandolos. Esta cerca.")
        Motor.avisar(inst, Motor.texto(inst, texto))
    end
    Motor.revisarSalidas(inst, 0)
    Motor.publicar()
end

-- Los miembros siguen al jugador mas cercano (postura "caminar con" de A-Life).
function Motor.acompanarGrupo(inst, g)
    for uid, m in pairs(g.miembros) do
        if m.vivo then
            local x, y = Mundo.posicionActor(uid)
            local j = x ~= nil and Mundo.jugadorCerca(x, y, 80) or nil
            if j ~= nil then Mundo.acompanar(uid, j, 2) end
        end
    end
end

-- Banderas de A-Life segun lo que pidio la accion del grupo: inmortales, quietos, correa
-- y extras (vida, dano). Se reaplican cada tanto por si A-Life las pierde o un cliente
-- entra despues (asi los mensajeros y Sous en su base siguen siendo inmortales en MP).
function Motor.banderasDe(inst, a)
    if type(a) ~= "table" then return nil end
    if not a.inmortales and not a.quietos and a.correa == nil and a.banderas == nil and a.mortales == nil then return nil end
    local f = { persistent = true, invulnerable = a.inmortales == true, stationary = a.quietos == true }
    if a.correa ~= nil then f.leashRadius = a.correa end
    for clave, valor in pairs(a.banderas or {}) do f[clave] = valor end
    local l = a.lugar ~= nil and inst.lugares[a.lugar] or nil
    local ancla = l ~= nil and { x = l.x, y = l.y, z = l.z or 0 } or nil
    return f, ancla
end

function Motor.banderasGrupo(inst, g)
    local flags, ancla = Motor.banderasDe(inst, g.accion)
    if flags == nil then return end
    for uid, m in pairs(g.miembros) do
        if m.vivo then pcall(Mundo.banderas, uid, flags, ancla) end
    end
end

function Motor.nombreCompleto(g, m)
    local par = g.nombres ~= nil and g.nombres[m.rol] or nil
    if par ~= nil then return par[2] ~= nil and par[2] ~= "" and (par[1] .. " " .. par[2]) or par[1] end
    return m.nombre or m.rol
end

-- Pone a cada miembro el nombre de su rol en A-Life (y los presenta a los jugadores conectados).
function Motor.nombrarGrupo(g)
    if g.nombres == nil then return end
    for uid, m in pairs(g.miembros) do
        local par = g.nombres[m.rol]
        if m.vivo and par ~= nil then Mundo.nombrarActor(uid, par[1], par[2]) end
    end
end

-- Muerte avisada por A-Life (trae al asesino).
function Motor.onNpcMuerto(cuerpo, uid, asesino)
    if uid == nil then return end
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil then
            for _, g in pairs(inst.grupos) do
                local m = g.miembros[uid]
                if m ~= nil and m.vivo then
                    m.vivo = false
                    if Mundo.esJugador(asesino) then
                        m.causa = "jugador"
                        inst.vars.quien_mato = Mundo.nombreJugador(asesino)
                    else
                        m.causa = "otro"
                    end
                    Motor.revisarSalidas(inst, 0)
                    Motor.publicar()
                    return
                end
            end
        end
    end
end

-- Revision periodica por si el aviso de muerte no llego (por ejemplo, murio sin cargar).
function Motor.revisarGrupos(inst)
    if Motor.minutosDesdeArranque < 10 then return false end
    local cambio = false
    for _, g in pairs(inst.grupos) do
        if g.estado == "listo" then
            -- Cada tanto se repasan los nombres: A-Life los puede pisar o puede entrar un jugador nuevo.
            if Motor.minutosDesdeArranque % 10 == 0 then
                Motor.nombrarGrupo(g)
                if inst.final == nil then Motor.banderasGrupo(inst, g) end
                if g.accion ~= nil and g.accion.acompanar and inst.final == nil then Motor.acompanarGrupo(inst, g) end
            end
            for uid, m in pairs(g.miembros) do
                if m.vivo then
                    local actor = Mundo.actor(uid)
                    if actor ~= nil and actor.lifecycle == "dead" then
                        m.vivo, m.causa, cambio = false, m.causa or "otro", true
                    elseif actor == nil then
                        m.faltas = (m.faltas or 0) + 1
                        if m.faltas >= 3 then m.vivo, m.causa, cambio = false, m.causa or "otro", true end
                    else
                        m.faltas = 0
                    end
                end
            end
        elseif g.estado == "pidiendo" and Mundo.horas() - (g.pedido or 0) > 1 then
            -- A-Life nunca contesto (por ejemplo, se reinicio el servidor): pedirlo de nuevo.
            g.estado = "fallo"
            if g.intentos < 6 and g.accion ~= nil then Motor.diferir(inst, g.accion) end
        end
    end
    return cambio
end

-- ---------------------------------------------------------------------------
-- Pendientes
-- ---------------------------------------------------------------------------

function Motor.procesarPendientes(inst)
    if #inst.pendientes == 0 then return false end
    local ahora = Mundo.horas()
    local restantes, cambio = {}, false
    for _, p in ipairs(inst.pendientes) do
        local terminado = false
        if p.listo == nil or ahora >= p.listo then
            local tipo = p[1]
            local l = Motor.lugarDe(inst, p)
            if l == nil then
                terminado = true
            elseif tipo == "retirar_lejos" then
                if Mundo.jugadorCerca(l.x, l.y, tonumber(p.radio) or 80) == nil then
                    Motor.retirarGrupo(inst, p.grupo)
                    terminado = true
                end
            elseif tipo == "retirar_miembros" then
                -- Algunos del grupo se van (por ejemplo, salen antes que tu): sin nadie mirando.
                if Mundo.jugadorCerca(l.x, l.y, tonumber(p.radio) or 40) == nil then
                    local g = inst.grupos[p.grupo]
                    for _, rol in ipairs(p.roles or {}) do
                        local uid = g ~= nil and g.roles[rol] or nil
                        local m = uid ~= nil and g.miembros[uid] or nil
                        if m ~= nil and m.vivo then
                            Mundo.retirar(uid)
                            m.vivo, m.retirado, m.causa = false, true, "retirado"
                        end
                    end
                    terminado = true
                end
            elseif Motor.inmediatas[tipo] ~= nil then
                pcall(Motor.inmediatas[tipo], inst, p)
                terminado = true
            else
                local jugador = l.jugador or Mundo.jugadorCerca(l.x, l.y, tonumber(p.radio) or 50)
                -- "no_mas_cerca": que nadie este encima del punto, para que no aparezcan frente a
                -- los ojos de alguien. Si pasa media hora de juego esperando, se hace igual.
                if jugador ~= nil and p.no_mas_cerca ~= nil then
                    p.esperaDesde = p.esperaDesde or ahora
                    if ahora - p.esperaDesde < 0.5 and Mundo.jugadorCerca(l.x, l.y, tonumber(p.no_mas_cerca)) ~= nil then
                        jugador = nil
                    end
                end
                if jugador ~= nil and Mundo.cargado(l.x, l.y, l.z) ~= nil then
                    local f = Motor.diferidas[tipo]
                    local ok, listo = pcall(f, inst, p, l, jugador)
                    if ok and listo then
                        terminado = true
                    else
                        if not ok then Mundo.log("error en " .. tostring(tipo) .. ": " .. tostring(listo)) end
                        p.fallos = (p.fallos or 0) + 1
                        if p.fallos >= 20 then
                            Mundo.log("se descarta accion " .. tostring(tipo) .. " de " .. inst.id)
                            terminado = true
                        end
                    end
                end
            end
        end
        if terminado then cambio = true else restantes[#restantes + 1] = p end
    end
    inst.pendientes = restantes
    return cambio
end

-- ---------------------------------------------------------------------------
-- Mapas con la zona de cada lugar
-- ---------------------------------------------------------------------------

-- Radio de la zona marcada en los mapas (en casillas). El lugar real queda adentro.
Motor.RADIO_ZONA = 70

-- Zona fija por lugar (se sortea una vez, asi todos los mapas marcan lo mismo).
function Motor.zonaDe(l, radio)
    if l.zona == nil then
        local r = radio or Motor.RADIO_ZONA
        local ang = (Mundo.azar(360) / 180) * math.pi
        local corrido = Mundo.azar(math.max(1, floor(r * 0.55)))
        l.zona = { x = floor(l.x + math.cos(ang) * corrido), y = floor(l.y + math.sin(ang) * corrido), r = r }
    end
    return l.zona
end

-- Da a cada jugador (o a los de opciones.jugadores) un mapa con la zona del lugar, y lo
-- marca tambien en su mapa del mundo.
function Motor.darMapaZona(inst, lugarId, opciones)
    opciones = opciones or {}
    local l = inst.lugares[lugarId]
    if l == nil then return false end
    inst.mapeados = inst.mapeados or {}
    inst.mapeados[lugarId] = true
    local zona = Motor.zonaDe(l, opciones.radio)
    local etiqueta = tostring(l.etiqueta or "el lugar")
    local titulo = opciones.titulo ~= nil and Motor.texto(inst, opciones.titulo) or ("Mapa: " .. etiqueta)
    local texto = "Por aca: " .. etiqueta
    local jugadores = opciones.jugadores or Mundo.jugadores()
    for _, p in ipairs(jugadores) do
        if Mundo.vivo(p) then
            -- Solo el mapa de papel: el mapa del mundo del jugador queda limpio.
            local mapa = Mundo.crearMapaZona(titulo, zona, texto, opciones.extras)
            if mapa ~= nil then Mundo.darItem(p, mapa) end
        end
    end
    return true
end

-- Al entrar a una etapa, los lugares nuevos que nombra la pista reciben su mapa solos.
-- No se marcan el refugio, los mensajeros ni los misioneros (esos ya se conocen).
-- etapa.mapa = false lo apaga; etapa.mapa = "id" o { "id", ... } elige cuales.
function Motor.mapasDeEtapa(inst, etapa)
    if etapa.mapa == false or inst.vars.contacto ~= nil then return end
    local ids = {}
    if type(etapa.mapa) == "string" then ids = { etapa.mapa }
    elseif type(etapa.mapa) == "table" then ids = etapa.mapa
    elseif type(etapa.pista) == "string" then
        for id in string.gmatch(etapa.pista, "{lugar:([%w_]+)}") do ids[#ids + 1] = id end
    end
    inst.mapeados = inst.mapeados or {}
    for _, id in ipairs(ids) do
        local l = inst.lugares[id]
        if l ~= nil and not inst.mapeados[id] and id ~= "aviso" and id ~= "contacto" and not l.temporal
                and l.sala ~= nil and l.sala ~= "base" and l.sala ~= "refugio" then
            pcall(Motor.darMapaZona, inst, id)
        end
    end
end

-- ---------------------------------------------------------------------------
-- Etapas
-- ---------------------------------------------------------------------------

-- Funciones (inst, def, final) que corren cuando una historia termina (huellas, reputacion...).
Motor.alTerminar = Motor.alTerminar or {}

function Motor.entrar(inst, etapaId, profundidad)
    profundidad = profundidad or 0
    if profundidad > 12 then
        Mundo.log("demasiados saltos de etapa seguidos en " .. inst.id)
        return false, "bucle"
    end
    local def = Defs.get(inst.def)
    local etapa = def ~= nil and def.etapas[etapaId] or nil
    if etapa == nil then return false, "etapa inexistente: " .. tostring(etapaId) end
    inst.etapa = etapaId
    inst.etapaDesde = Mundo.horas()
    inst.elecciones = {}
    if etapa.final then
        -- La historia termino: los NPCs que todavia no aparecian ya no tienen que aparecer.
        local quedan = {}
        for _, p in ipairs(inst.pendientes) do
            if p[1] ~= "npcs" and p[1] ~= "bandidos" then quedan[#quedan + 1] = p end
        end
        inst.pendientes = quedan
    end
    for _, accion in ipairs(etapa.al_entrar or {}) do
        local ok, razon = Motor.ejecutar(inst, accion)
        if ok == false then
            Mundo.log(inst.id .. " / " .. etapaId .. ": " .. tostring(razon))
            if accion[1] == "lugar" or accion[1] == "lugar_refugio" or accion[1] == "lugar_jugador"
                    or accion[1] == "lugar_memoria" then
                return false, razon
            end
        end
    end
    if not etapa.final then pcall(Motor.mapasDeEtapa, inst, etapa) end
    if etapa.final then
        local st = Motor.estado()
        inst.final, inst.terminado = etapaId, Mundo.horas()
        st.memoria[inst.def .. ".final"] = etapaId
        local tipo, capitulo = Motor.tipoDe(def)
        st.historial[#st.historial + 1] = { def = inst.def, final = etapaId, inicio = inst.inicio, fin = inst.terminado,
            titulo = Motor.texto(inst, def.titulo or inst.def), tipo = tipo, capitulo = capitulo,
            dueno = inst.vars.dueno,
            epilogo = Narrador.Lore ~= nil and Motor.loreTexto(inst, Narrador.Lore.final(inst.def, etapaId)) or nil }
        while #st.historial > 50 do table.remove(st.historial, 1) end
        Mundo.log(inst.id .. " termino en " .. etapaId)
        for _, f in ipairs(Motor.alTerminar) do pcall(f, inst, def, etapaId) end
    end
    Motor.publicar()
    return Motor.revisarSalidas(inst, profundidad + 1)
end

function Motor.revisarSalidas(inst, profundidad)
    if inst.final ~= nil then return true end
    local def = Defs.get(inst.def)
    local etapa = def ~= nil and def.etapas[inst.etapa] or nil
    if etapa == nil then return true end
    for _, salida in ipairs(etapa.salidas or {}) do
        if Motor.cumple(inst, salida.cuando) then
            return Motor.entrar(inst, salida.ir, profundidad or 0)
        end
    end
    return true
end

-- ---------------------------------------------------------------------------
-- Inicio, fin y elecciones
-- ---------------------------------------------------------------------------

function Motor.activos(defId)
    local st, n = Motor.estado(), 0
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil and (defId == nil or inst.def == defId) then n = n + 1 end
    end
    return n
end

function Motor.quitarDelEstado(inst)
    local st = Motor.estado()
    st.arcos[inst.id] = nil
    for i = #st.orden, 1, -1 do
        if st.orden[i] == inst.id then table.remove(st.orden, i) end
    end
end

Motor.alIniciar = Motor.alIniciar or {}

-- Escalado: oleadas mas grandes con los dias sobrevividos y con mas jugadores conectados.
-- Se fija al empezar la historia (si alguien se desconecta, no cambia).
-- Dificultad de los eventos (sandbox): 1 Facil, 2 Normal, 3 Dificil, 4 Brutal.
Motor.DIFICULTAD = { 0.65, 1, 1.4, 1.9 }
function Motor.dificultad()
    return Motor.DIFICULTAD[tonumber(Mundo.sandbox("Dificultad", 2)) or 2] or 1
end

-- Tambien se mide el poder de los personajes (habilidades): mas fuertes, eventos mas duros.
function Motor.escala()
    local dif = Motor.dificultad()
    if Mundo.sandbox("Escalado", true) == false then return dif end
    local dias = Mundo.horas() / 24
    local n, poder = 0, 0
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.vivo(p) then n = n + 1; poder = poder + (Mundo.poderJugador ~= nil and Mundo.poderJugador(p) or 1) end
    end
    local promedio = n > 0 and poder / n or 1
    local e = (1 + math.min(0.5, dias / 60) + 0.25 * math.max(0, n - 1)) * math.sqrt(promedio) * dif
    return math.floor(e * 100 + 0.5) / 100
end

function Motor.iniciar(defId, jugadorRef, extra)
    local def = Defs.get(defId)
    if def == nil then return nil, "no existe el arco " .. tostring(defId) end
    if def.requiere_alife and not Mundo.hayALife() then return nil, "este arco necesita Project A-Life" end
    local ref = jugadorRef or Mundo.jugadorAlAzar()
    if def.requiere_refugio then
        ref = Mundo.jugadorConRefugio(jugadorRef)
        if ref == nil then return nil, "nadie conectado tiene un refugio reclamado (o una casa marcada como base en A-Life)" end
    end
    local x, y = Mundo.posicion(ref)
    if x == nil then return nil, "no hay jugadores" end
    local st = Motor.estado()
    st.secuencia = st.secuencia + 1
    local ahora = Mundo.horas()
    local inst = {
        id = defId .. "#" .. tostring(st.secuencia), def = defId,
        inicio = ahora, etapaDesde = ahora, refX = floor(x), refY = floor(y), refNombre = Mundo.nombreJugador(ref),
        vars = {}, lugares = {}, grupos = {}, relojes = {},
        elecciones = {}, usadas = {}, pendientes = {}, diario = {},
    }
    for nombre, spec in pairs(def.sorteo or {}) do inst.vars[nombre] = Motor.sortear(spec) end
    inst.vars.escala = Motor.escala()
    for _, clave in ipairs(def.vars_desde_memoria or {}) do inst.vars[clave] = st.memoria[clave] end
    if type(extra) == "table" then
        for k, v in pairs(extra.vars or {}) do inst.vars[k] = v end
        for k, v in pairs(extra.lugares or {}) do inst.lugares[k] = Motor.copiar(v) end
    end
    st.arcos[inst.id] = inst
    st.orden[#st.orden + 1] = inst.id
    local ok, razon = Motor.entrar(inst, def.inicio, 0)
    if ok == false then
        Motor.quitarDelEstado(inst)
        Motor.publicar()
        return nil, razon
    end
    st.director.ultimoInicio = ahora
    for _, f in ipairs(Motor.alIniciar) do pcall(f, inst, def) end
    st.director.veces[defId] = (st.director.veces[defId] or 0) + 1
    st.director.ultimoPorDef[defId] = ahora
    Mundo.log("inicia " .. inst.id)
    Motor.publicar()
    return inst
end

function Motor.cancelar(instId)
    local inst = Motor.estado().arcos[instId]
    if inst == nil then return false end
    for id in pairs(inst.grupos) do Motor.retirarGrupo(inst, id) end
    Motor.quitarDelEstado(inst)
    Motor.publicar()
    return true
end

function Motor.forzarEtapa(instId, etapaId)
    local inst = Motor.estado().arcos[instId]
    if inst == nil then return false, "no existe" end
    inst.final, inst.terminado = nil, nil
    return Motor.entrar(inst, etapaId, 0)
end

-- Requisitos extra para las opciones: Motor.requisitos[tipo] = function(inst, op, jugador)
-- -> funcion que consume lo pedido, o nil si el jugador no lo tiene.
Motor.requisitos = Motor.requisitos or {}

-- {"pastilla", id, "real" | "falsa" | "cualquiera"}: entregar una pastilla K-93 de la historia.
-- Elegir a sabiendas la real o la falsa exige Medicina 4 o mas (si no, no se sabe cual es cual).
-- Deja inst.vars.pastilla_dada = "real" o "falsa".
Motor.requisitos.pastilla = function(inst, op, jugador)
    local etiqueta = inst.id .. ":" .. tostring(op.requiere[2])
    local cual = op.requiere[3] or "cualquiera"
    if cual ~= "cualquiera" and Mundo.nivelMedicina(jugador) < 4 then return nil end
    local lista = Mundo.buscarItems(jugador, function(it)
        if not Mundo.tieneEtiqueta(it, etiqueta) then return false end
        if cual == "cualquiera" then return true end
        return Mundo.pastillaEs(it) == cual
    end)
    if #lista == 0 then return nil end
    local par = lista[Mundo.azar(#lista)]
    return function()
        inst.vars.pastilla_dada = Mundo.pastillaEs(par[1]) == "falsa" and "falsa" or "real"
        Mundo.quitarItem(par[2], par[1])
    end
end

function Motor.elegir(jugador, instId, opcionId)
    local inst = Motor.estado().arcos[tostring(instId)]
    if inst == nil or inst.final ~= nil then
        Motor.responder(jugador, "Eso ya no esta disponible.")
        return
    end
    local def = Defs.get(inst.def)
    local etapa = def ~= nil and def.etapas[inst.etapa] or nil
    local op
    for _, o in ipairs(etapa ~= nil and etapa.opciones or {}) do
        if o.id == opcionId then op = o end
    end
    if op == nil or not Motor.opcionVisible(inst, op) then
        Motor.responder(jugador, "Eso ya no esta disponible.")
        Motor.publicar(jugador)
        return
    end
    local ancla = etapa.ancla ~= nil and inst.lugares[etapa.ancla] or nil
    if ancla ~= nil then
        -- Vale estar dentro del radio del lugar o al lado de alguno de los NPCs de la historia.
        local x, y = Mundo.posicion(jugador)
        local cerca = x ~= nil and math.sqrt((x - ancla.x) ^ 2 + (y - ancla.y) ^ 2) <= Motor.radioEtapa(inst, etapa) + 3
        if not cerca and etapa.ancla_grupo ~= nil then
            local d = Motor.distanciaAGrupo(inst, etapa.ancla_grupo, jugador)
            cerca = d ~= nil and d <= 8
        end
        if not cerca then
            Motor.responder(jugador, "Estas muy lejos.")
            return
        end
    end
    if op.requiere ~= nil then
        local tipo = op.requiere[1]
        local item, contenedor
        if tipo == "comida" then
            local cuantas = tonumber(op.requiere[2]) or 1
            local encontrados = {}
            for _ = 1, cuantas do
                local it, cont = Mundo.buscarItem(jugador, function(x)
                    if not Mundo.esComida(x) then return false end
                    for _, ya in ipairs(encontrados) do if ya[1] == x then return false end end
                    return true
                end)
                if it == nil then break end
                encontrados[#encontrados + 1] = { it, cont }
            end
            if #encontrados >= cuantas then
                for i = 2, #encontrados do
                    if op.consume ~= false then Mundo.quitarItem(encontrados[i][2], encontrados[i][1]) end
                end
                item, contenedor = encontrados[1][1], encontrados[1][2]
            end
        elseif tipo == "objeto_o" then
            for _, id in ipairs(op.requiere[2] or {}) do
                if item == nil then
                    local etiqueta = inst.id .. ":" .. tostring(id)
                    item, contenedor = Mundo.buscarItem(jugador, function(it) return Mundo.tieneEtiqueta(it, etiqueta) end)
                end
            end
        elseif tipo == "objeto" then
            local etiqueta = inst.id .. ":" .. tostring(op.requiere[2])
            item, contenedor = Mundo.buscarItem(jugador, function(it) return Mundo.tieneEtiqueta(it, etiqueta) end)
        elseif Motor.requisitos[tipo] ~= nil then
            -- Requisitos de otros modulos: devuelven una funcion que consume (o nil si falta).
            local ok, consumir = pcall(Motor.requisitos[tipo], inst, op, jugador)
            if not ok or consumir == nil then
                Motor.responder(jugador, Motor.texto(inst, op.falta or "Te falta algo para hacer eso."))
                return
            end
            if op.consume ~= false then pcall(consumir) end
            item, contenedor = true, nil
        end
        if item == nil then
            Motor.responder(jugador, Motor.texto(inst, op.falta or "Te falta algo para hacer eso."))
            return
        end
        if op.consume ~= false and contenedor ~= nil then Mundo.quitarItem(contenedor, item) end
    end
    inst.usadas[op.id] = true
    inst.elecciones[op.id] = true
    inst.vars.quien_eligio = Mundo.nombreJugador(jugador)
    -- "dice": lo que contesta un personaje (burbuja sobre su cabeza). "respuesta": narracion (cartel).
    local dice = op.dice
    if type(dice) == "table" and dice.rol ~= nil then dice = { dice } end
    for _, linea in ipairs(type(dice) == "table" and dice or {}) do
        Motor.decir(inst, linea.grupo or etapa.ancla_grupo, linea.rol, linea.texto)
    end
    if op.respuesta ~= nil then Motor.responder(jugador, Motor.texto(inst, op.respuesta)) end
    if op.diario ~= nil then Motor.anotar(inst, Motor.texto(inst, op.diario)) end
    for _, accion in ipairs(op.acciones or {}) do Motor.ejecutar(inst, accion) end
    Motor.revisarSalidas(inst, 0)
    Motor.publicar()
end

-- ---------------------------------------------------------------------------
-- Pulso
-- ---------------------------------------------------------------------------

-- Entrega automatica del mensaje cuando un jugador se acerca al mensajero.
function Motor.revisarMensajero(inst)
    local msg = inst.mensaje
    if msg == nil or msg.entregado then return false end
    local g = inst.grupos.mensajero
    local uid = g ~= nil and g.estado == "listo" and g.roles.mensajero or nil
    if uid == nil then return false end
    local x, y, z = Mundo.posicionActor(uid)
    if x == nil or Mundo.jugadorCerca(x, y, 4) == nil then return false end
    msg.entregado = true
    Motor.decir(inst, "mensajero", "mensajero", msg.texto)
    if msg.diario ~= nil then Motor.anotar(inst, Motor.texto(inst, msg.diario)) end
    if type(msg.nota) == "table" then
        Motor.diferir(inst, { "nota", x = floor(x), y = floor(y), z = floor(z or 0), radio = 30,
            titulo = msg.nota.titulo, texto = msg.nota.texto })
    end
    Motor.diferir(inst, { "retirar_lejos", grupo = "mensajero", x = floor(x), y = floor(y), z = floor(z or 0),
        radio = 45, retraso = 0.3 })
    return true
end

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

-- def.zona_segura = { lugar, grupo, radio, max }: mientras el grupo este en pie, alrededor
-- del lugar se dejan pocos zombis (los que quedan los liquidan los NPCs).
function Motor.zonaSegura(inst)
    if inst.final ~= nil or Motor.minutosDesdeArranque % 10 ~= 0 then return end
    local def = Defs.get(inst.def)
    local zs = def ~= nil and def.zona_segura or nil
    if zs == nil then return end
    local l = inst.lugares[zs.lugar]
    if l == nil then return end
    local g = zs.grupo ~= nil and inst.grupos[zs.grupo] or nil
    if zs.grupo ~= nil then
        local hay = false
        for _, m in pairs(g ~= nil and g.estado == "listo" and g.miembros or {}) do if m.vivo then hay = true end end
        if not hay then return end
    end
    Mundo.limpiarZona(l.x, l.y, zs.radio or 45, zs.max or 3)
end

-- Lista de NPCs del Narrador: A-Life no les pone frases propias (solo hablan con el Narrador).
function Motor.actualizarPropios()
    local st, lista = Motor.estado(), {}
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil then
            for _, g in pairs(inst.grupos) do
                for uid, m in pairs(g.miembros) do if m.vivo then lista[tostring(uid)] = true end end
            end
        end
    end
    for _, r in pairs(st.residentes) do
        for uid, m in pairs(r.miembros) do if not m.muerto then lista[tostring(uid)] = true end end
    end
    for _, e in pairs(st.contactos) do
        if type(e) == "table" and e.uid ~= nil then lista[tostring(e.uid)] = true end
    end
    Mundo.uidsPropios = lista
    Mundo.silenciarALife()
    return lista
end

function Motor.tickArco(inst)
    pcall(Motor.zonaSegura, inst)
    local cambio = Motor.procesarPendientes(inst)
    if Motor.revisarMensajero(inst) then cambio = true end
    if Motor.revisarGrupos(inst) then cambio = true end
    pcall(Motor.charlar, inst)
    if inst.final == nil then
        local etapaAntes = inst.etapa
        Motor.revisarSalidas(inst, 0)
        if inst.etapa ~= etapaAntes then cambio = true end
    end
    -- Un arco terminado se archiva cuando no le queda nada pendiente y paso un rato.
    if inst.final ~= nil and #inst.pendientes == 0 and Mundo.horas() - (inst.terminado or 0) >= 6 then
        Motor.quitarDelEstado(inst)
        cambio = true
    end
    return cambio
end

-- Otros modulos agregan aca lo que tiene que correr cada minuto: Motor.tickExtra[nombre] = f
Motor.tickExtra = Motor.tickExtra or {}

function Motor.tick()
    Motor.minutosDesdeArranque = Motor.minutosDesdeArranque + 1
    local st = Motor.estado()
    local cambio = false
    local ids = {}
    for _, id in ipairs(st.orden) do ids[#ids + 1] = id end
    for _, id in ipairs(ids) do
        local inst = st.arcos[id]
        if inst ~= nil then
            local ok, c = pcall(Motor.tickArco, inst)
            if not ok then Mundo.log("error en " .. id .. ": " .. tostring(c)) elseif c then cambio = true end
        end
    end
    local ok, err = pcall(Motor.tickResidentes)
    if not ok then Mundo.log("error en residentes: " .. tostring(err)) end
    for nombre, f in pairs(Motor.tickExtra) do
        local okE, errE = pcall(f)
        if not okE then Mundo.log("error en " .. tostring(nombre) .. ": " .. tostring(errE)) end
    end
    pcall(Motor.actualizarPropios)
    if cambio then Motor.publicar() end
end

-- ---------------------------------------------------------------------------
-- Comandos que llegan desde los clientes
-- ---------------------------------------------------------------------------

Motor.comandosPublicos = Motor.comandosPublicos or {}
Motor.comandosAdmin = Motor.comandosAdmin or {}

function Motor.alComando(modulo, comando, jugador, args)
    if modulo ~= MOD then return end
    args = args or {}
    if comando == "pedirEstado" then
        Motor.publicar(jugador)
        return
    end
    if comando == "elegir" then
        Motor.elegir(jugador, args.arco, args.opcion)
        return
    end
    if comando == "pedirTrabajo" then
        if Narrador.Contactos ~= nil then Narrador.Contactos.pedirTrabajo(jugador, args.contacto, args.nivel) end
        return
    end
    -- Comandos de otros modulos que cualquier jugador puede usar.
    if Motor.comandosPublicos[comando] ~= nil then
        local ok, err = pcall(Motor.comandosPublicos[comando], jugador, args)
        if not ok then Mundo.log("error en comando " .. tostring(comando) .. ": " .. tostring(err)) end
        return
    end
    -- Desde aca, solo admins (en un jugador, siempre).
    if not Mundo.esAdmin(jugador) then
        Motor.responder(jugador, "Solo un admin puede hacer eso.")
        return
    end
    if comando == "iniciar" then
        local def = Defs.get(tostring(args.def))
        if def ~= nil and def.generado ~= nil and Motor.comandosAdmin.encargoGenerado ~= nil then
            local ok, r = pcall(Motor.comandosAdmin.encargoGenerado, jugador, { tipo = def.generado, nivel = args.nivel or "medio" })
            Motor.responder(jugador, ok and tostring(r) or ("Error: " .. tostring(r)))
            return
        end
        local extra
        if def ~= nil and def.encargo_nivel ~= nil and Narrador.Contactos ~= nil then
            -- Un encargo necesita un contacto: se usa el mas cercano al admin.
            extra = Narrador.Contactos.extraParaEncargo(jugador, def.encargo_nivel)
            if extra == nil then
                Motor.responder(jugador, "No se pudo: todavia no hay contactos ubicados.")
                return
            end
        end
        local inst, razon = Motor.iniciar(args.def, jugador, extra)
        Motor.responder(jugador, inst ~= nil and ("Iniciado: " .. inst.id) or ("No se pudo: " .. tostring(razon)))
    elseif comando == "forzarEtapa" then
        local ok, razon = Motor.forzarEtapa(args.arco, args.etapa)
        Motor.responder(jugador, ok and ("Etapa forzada: " .. tostring(args.etapa)) or ("No se pudo: " .. tostring(razon)))
    elseif comando == "cancelar" then
        Motor.cancelar(args.arco)
        Motor.responder(jugador, "Historia cancelada.")
    elseif comando == "reiniciarTodo" then
        for _, id in ipairs(Motor.copiar(Motor.estado().orden)) do Motor.cancelar(id) end
        Motor.reiniciar()
        Motor.publicar()
        Motor.responder(jugador, "Narrador reiniciado.")
    elseif comando == "eventoAhora" then
        local Director = Narrador.Director
        local inst = Director ~= nil and Director.lanzar(true) or nil
        Motor.responder(jugador, inst ~= nil and ("Iniciado: " .. inst.id) or "No habia ningun evento disponible.")
    elseif comando == "info" then
        Motor.responder(jugador, Motor.infoAdmin(args.arco))
    elseif Motor.comandosAdmin[comando] ~= nil then
        local ok, r = pcall(Motor.comandosAdmin[comando], jugador, args)
        if not ok then Motor.responder(jugador, "Error: " .. tostring(r))
        elseif type(r) == "string" then Motor.responder(jugador, r) end
    end
end

-- Resumen con spoilers para probar: variables sorteadas y coordenadas.
function Motor.infoAdmin(instId)
    local inst = Motor.estado().arcos[tostring(instId)]
    if inst == nil then return "No existe." end
    local partes = { inst.id .. " | etapa: " .. tostring(inst.etapa) }
    local vars = {}
    for k, v in pairs(inst.vars) do vars[#vars + 1] = k .. "=" .. tostring(v) end
    table.sort(vars)
    partes[#partes + 1] = "vars: " .. table.concat(vars, ", ")
    for id, l in pairs(inst.lugares) do
        partes[#partes + 1] = id .. ": " .. floor(l.x) .. "," .. floor(l.y) .. "," .. floor(l.z or 0) .. " (" .. tostring(l.sala or "") .. ")"
    end
    for id, r in pairs(inst.relojes) do
        if r.activo then partes[#partes + 1] = "reloj " .. id .. ": faltan " .. floor(r.vence - Mundo.horas()) .. " h" end
    end
    partes[#partes + 1] = "pendientes: " .. #inst.pendientes
    return table.concat(partes, "\n")
end

-- ---------------------------------------------------------------------------
-- Enganche con el juego
-- ---------------------------------------------------------------------------

Motor._enganchado = Motor._enganchado or false
Motor._muerteEnganchada = Motor._muerteEnganchada or false

function Motor.engancharMuertes()
    if Motor._muerteEnganchada or Events == nil then return end
    if Events.ProjectALife_NpcDied ~= nil and Events.ProjectALife_NpcDied.Add ~= nil then
        Events.ProjectALife_NpcDied.Add(Motor.onNpcMuerto)
        Motor._muerteEnganchada = true
    end
end

if Events ~= nil and not Motor._enganchado then
    Motor._enganchado = true
    Events.EveryOneMinute.Add(Motor.tick)
    Events.OnClientCommand.Add(Motor.alComando)
    if Events.OnZombieDead ~= nil then Events.OnZombieDead.Add(Motor.onZombiMuerto) end
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(Motor.engancharMuertes) end
    if Events.OnServerStarted ~= nil then Events.OnServerStarted.Add(Motor.engancharMuertes) end
    Motor.engancharMuertes()
end

return Motor
