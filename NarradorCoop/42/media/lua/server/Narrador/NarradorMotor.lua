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

-- El motor esta repartido: NarradorMotorCondiciones, NarradorMotorAcciones, NarradorMotorGrupos y
-- NarradorMotorCharlas. Se cargan al final de este archivo (Motor._partes marca cuales ya estan).
Motor._partes = Motor._partes or {}

-- Un grupo de NPCs del arco por su id (lo usan las condiciones y las acciones).
function Motor.grupoArco(inst, id)
    return inst.grupos[id]
end

-- ---------------------------------------------------------------------------
-- Estado persistente (se guarda con la partida)
-- ---------------------------------------------------------------------------

function Motor.estado()
    if Motor._estado ~= nil then return Motor._estado end
    local st = Mundo.datosGuardados("NarradorCoop")
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
    pcall(Motor.migrar, st)
    Motor._estado = st
    return st
end

-- ---------------------------------------------------------------------------
-- Migraciones de partidas guardadas (una vez cada una; quedan en st.migraciones)
-- ---------------------------------------------------------------------------

-- 0.11.0: Eduardo Giovanns se llamaba "tomas" en el codigo (ids de historias, grupos, roles,
-- memorias y variables). Se cambia en todo el estado guardado:
--   * ids de historias en cualquier valor (inst.def, historial, porAbrir, director...),
--   * memorias y variables (claves),
--   * grupos, roles y "quien" de los inmunes (claves y los campos rol, quien y grupo).
Motor.MIGRACION_EDUARDO = {
    ids = { leyenda_tomas = "leyenda_eduardo", tomas_vuelve = "eduardo_vuelve" },
    claves = { tomas_conocido = "eduardo_conocido", tomas_muerto = "eduardo_muerto_duelo",
               tomas_vivo = "eduardo_vivo", caido_tomas = "caido_eduardo", caido_tomas_bandido = "caido_eduardo_bandido",
               dijo_tomas = "dijo_eduardo", tomas = "eduardo", tomas_bandido = "eduardo_bandido",
               leyenda_tomas = "leyenda_eduardo", tomas_vuelve = "eduardo_vuelve" },
    campos = { rol = true, quien = true, grupo = true },
    nombres = { tomas = "eduardo", tomas_bandido = "eduardo_bandido" },
}

function Motor.migrarEduardo(t, vistos)
    local M = Motor.MIGRACION_EDUARDO
    if type(t) ~= "table" or vistos[t] then return end
    vistos[t] = true
    local cambios = {}
    for k, v in pairs(t) do
        local nk = type(k) == "string" and M.claves[k] or k
        local nv = v
        if type(v) == "string" then
            nv = M.ids[v] or (M.campos[k] and M.nombres[v]) or v
        elseif type(v) == "table" then
            Motor.migrarEduardo(v, vistos)
        end
        if nk ~= k or nv ~= v then cambios[#cambios + 1] = { k, nk, nv } end
    end
    for _, c in ipairs(cambios) do
        t[c[1]] = nil
        if t[c[2]] == nil then t[c[2]] = c[3] end
    end
end

function Motor.migrar(st)
    st.migraciones = st.migraciones or {}
    if not st.migraciones.eduardo then
        local vistos = { [st.migraciones] = true }
        Motor.migrarEduardo(st, vistos)
        st.migraciones.eduardo = true
    end
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
        Mundo.enviarCliente(jugador, MOD, comando, datos)
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

-- Las pistas con {bajas:lugar} se arman en el servidor, asi que el contador solo cambia en
-- pantalla cuando se vuelve a mandar el estado. Con una baja nueva se manda al tiro (como
-- mucho una vez por segundo) y, si quedo alguna sin mandar, en el siguiente minuto de juego.
Motor.bajaSinPublicar = false
Motor.ultimaPublicacionBajas = 0

local function hayContadorDeBajas()
    for _, id in ipairs(Motor.estado().orden or {}) do
        local inst = Motor.estado().arcos[id]
        local def = inst ~= nil and Defs.get(inst.def) or nil
        local etapa = def ~= nil and def.etapas[inst.etapa] or nil
        if etapa ~= nil and type(etapa.pista) == "string" and string.find(etapa.pista, "{bajas:", 1, true) then return true end
    end
    return false
end

function Motor.avisarContador()
    if not hayContadorDeBajas() then return end
    local ahora = getTimestampMs ~= nil and getTimestampMs() or 0
    if ahora - Motor.ultimaPublicacionBajas >= 1000 then
        Motor.ultimaPublicacionBajas = ahora
        Motor.bajaSinPublicar = false
        Motor.publicar()
    else
        Motor.bajaSinPublicar = true
    end
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
    if ok then
        Motor.registrarBaja(x, y)
        Motor.avisarContador()
    end
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
    -- Otros modulos agregan los suyos: Motor.propiosExtra[nombre] = function(lista) ... end
    for _, f in pairs(Motor.propiosExtra or {}) do pcall(f, lista) end
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
            if st.arcos[id] ~= nil then
                for gid in pairs(inst.grupos or {}) do pcall(Motor.completarGrupo, inst, gid) end
            end
        end
    end
    local ok, err = pcall(Motor.tickResidentes)
    if not ok then Mundo.log("error en residentes: " .. tostring(err)) end
    for nombre, f in pairs(Motor.tickExtra) do
        local okE, errE = pcall(f)
        if not okE then Mundo.log("error en " .. tostring(nombre) .. ": " .. tostring(errE)) end
    end
    pcall(Motor.actualizarPropios)
    if Motor.bajaSinPublicar then
        Motor.bajaSinPublicar = false
        cambio = true
    end
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

-- Las partes del motor (ver arriba).
require "Narrador/NarradorMotorCondiciones"
require "Narrador/NarradorMotorAcciones"
require "Narrador/NarradorMotorGrupos"
require "Narrador/NarradorMotorCharlas"

return Motor
