-- Narrador Co-op (cliente): ventana de conversacion con los NPCs y panel de misiones.
--
-- * Clic derecho cerca de un personaje del Narrador -> "Hablar con <nombre>". Se abre una
--   ventana abajo al centro con lo que se dicen (el personaje y tu) y tus respuestas
--   numeradas. Las opciones de las historias, los encargos de los misioneros (con el
--   detalle de cada dificultad antes de aceptar) y los favores de Sous salen ahi.
-- * Si una historia tiene opciones en un lugar sin nadie con quien hablar (por ejemplo,
--   decidir que hacer con lo robado), sale "[Historia] Que hacer aqui".
-- * Pestana "Misiones": lo que tienes pendiente (historia, secundarias, tu encargo y los
--   favores por pedir). "Seguir" la deja fija en pantalla (rastreador arrastrable).
--
-- No toca los otros archivos: reemplaza el menu de clic derecho del Narrador por uno que
-- usa la ventana (si algo falla, vuelve al menu de antes). Textos sin tildes a proposito.

require "ISUI/ISPanel"
require "Narrador/NarradorDefs"
require "Narrador/NarradorCliente"
require "Narrador/NarradorDiario"
require "Narrador/NarradorMapas"

Narrador = Narrador or {}
local Conv = Narrador.Conversacion or {}
Narrador.Conversacion = Conv

local Cliente = Narrador.Cliente
local floor = math.floor

Conv.MODULO = "NarradorConversacion"
Conv.DIST_HABLAR = 6        -- casillas para que salga "Hablar con"
Conv.DIST_SEGUIR = 10       -- mas lejos que esto, ya no te escucha
Conv.ARCHIVO_SEGUIR = "NarradorMisiones.txt"
Conv.ARCHIVO_POS = "NarradorRastreador_pos.txt"
Conv.TEX_SOUS = "media/ui/Narrador/SimboloSous.png"
Conv.TEX_DIARIO = "media/textures/NarradorDiario_Icono.png"

-- Colores.
local ORO = { r = 1, g = 0.84, b = 0.5 }
local BORDE = { r = 0.8, g = 0.65, b = 0.3 }
local TEXTO = { r = 0.93, g = 0.91, b = 0.86 }
local YO = { r = 0.62, g = 0.8, b = 1 }
local NARRA = { r = 0.78, g = 0.72, b = 0.6 }
local GRIS = { r = 0.58, g = 0.56, b = 0.52 }
local ROJO = { r = 0.95, g = 0.45, b = 0.4 }
local VERDE = { r = 0.6, g = 0.9, b = 0.6 }

-- Lo que se sabe de cada dificultad de encargo (se muestra antes de aceptar).
Conv.NIVELES = {
    { id = "facil", titulo = "Facil", lineas = {
        "Cerca: entre 150 y 600 metros del misionero. Pocos muertos.",
        "Pago: comida, vendas, balas y lo que pague el cliente." } },
    { id = "medio", titulo = "Medio", lineas = {
        "Entre 300 y 1000 metros. Muertos y a veces bandidos.",
        "Pago mejor, y 5% de salir con un arma chetada." } },
    { id = "dificil", titulo = "Dificil", lineas = {
        "Lejos: hasta 1600 metros. Una horda y bandidos seguro.",
        "Buen botin, y 15% de salir con un arma chetada." } },
    { id = "ultra", titulo = "ULTRA", lineas = {
        "Louisville. Una ciudad entera de muertos y bandidos.",
        "Plazo: 7 dias.",
        "Premio legendario a eleccion: arma, traje o auto." } },
}

function Conv.nivel(id)
    for _, n in ipairs(Conv.NIVELES) do if n.id == id then return n end end
    return nil
end

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

local function ahora() return getTimestampMs ~= nil and getTimestampMs() or (os.time() * 1000) end

local function distancia(ax, ay, bx, by) return math.sqrt((ax - bx) ^ 2 + (ay - by) ^ 2) end

function Conv.medir(fuente, texto)
    return getTextManager():MeasureStringX(fuente, texto)
end

function Conv.altoFuente(fuente)
    return getTextManager():getFontHeight(fuente)
end

-- Corta un texto en lineas que caben en "ancho".
function Conv.envolver(texto, ancho, fuente)
    local lineas = {}
    for parrafo in string.gmatch(tostring(texto or "") .. "\n", "(.-)\n") do
        local linea = ""
        for palabra in string.gmatch(parrafo, "%S+") do
            local prueba = linea == "" and palabra or (linea .. " " .. palabra)
            if Conv.medir(fuente, prueba) > ancho and linea ~= "" then
                lineas[#lineas + 1] = linea
                linea = palabra
            else
                linea = prueba
            end
        end
        lineas[#lineas + 1] = linea
    end
    return lineas
end

local function sonido(nombre)
    pcall(function() getSoundManager():playUISound(nombre) end)
end

function Conv.estado() return Cliente ~= nil and Cliente.estado or nil end

function Conv.miGrupo()
    return Cliente ~= nil and Cliente.miGrupo ~= nil and Cliente.miGrupo() or nil
end

-- uid de A-Life de un cuerpo (o nil).
local function uidDe(cuerpo)
    local speech = ProjectALife ~= nil and ProjectALife.Speech or nil
    if speech == nil or type(speech.variable) ~= "function" then return nil end
    local ok, uid = pcall(speech.variable, cuerpo, "ALifeUID")
    if ok and uid ~= nil and uid ~= "" then return tostring(uid) end
    return nil
end

-- Cuerpos cargados cerca del jugador: uid -> distancia. Una sola pasada por la lista.
function Conv.cuerposCerca(jugador, radio)
    local mapa = {}
    if getCell == nil or jugador == nil then return mapa end
    local px, py = jugador:getX(), jugador:getY()
    pcall(function()
        local lista = getCell():getZombieList()
        for i = 0, lista:size() - 1 do
            local cuerpo = lista:get(i)
            if cuerpo ~= nil and not cuerpo:isDead() then
                local d = distancia(cuerpo:getX(), cuerpo:getY(), px, py)
                if d <= radio then
                    local uid = uidDe(cuerpo)
                    if uid ~= nil and (mapa[uid] == nil or d < mapa[uid]) then mapa[uid] = d end
                end
            end
        end
    end)
    return mapa
end

-- Nombre completo de un NPC del Narrador (A-Life manda solo el nombre de pila, y hay dos
-- Martin en Sous).
function Conv.nombreDeUid(uid, porDefecto)
    local estado = Conv.estado()
    if uid ~= nil and estado ~= nil then
        uid = tostring(uid)
        if Conv.ventana ~= nil and Conv.ventana.obj ~= nil and Conv.ventana.obj.uid == uid then
            return tostring(Conv.ventana.obj.nombre)
        end
        for _, a in ipairs(estado.arcos or {}) do
            for _, n in ipairs(a.npcs or {}) do
                if tostring(n.uid) == uid and n.nombre_completo ~= nil then return tostring(n.nombre_completo) end
            end
        end
        for _, r in ipairs(estado.residentes_info or {}) do
            if tostring(r.uid) == uid and r.nombre ~= nil then return tostring(r.nombre) end
        end
        for _, c in ipairs(estado.contactos or {}) do
            if c.uid ~= nil and tostring(c.uid) == uid then return tostring(c.nombre) end
        end
    end
    return tostring(porDefecto or "?")
end

-- ---------------------------------------------------------------------------
-- Con quien se puede hablar (puro: recibe el estado y los cuerpos cercanos)
-- ---------------------------------------------------------------------------

-- Es de Sous? (para el medallon con el fenix)
local ROLES_SOUS = { martin_a = true, martin_z = true, benjamin = true, david = true, bastian = true,
    hanz = true, cristian = true, jorge = true, cristobal = true, maulen = true }

-- objetivos: lista de { tipo = "npc"|"contacto"|"escena", uid, nombre, rol, id, arco, sub }
--   cerca: uid -> distancia (de Conv.cuerposCerca)
--   px, py: posicion del jugador (para contactos sin cuerpo y escenas)
function Conv.objetivos(estado, cerca, px, py)
    local lista, vistos = {}, {}
    if estado == nil then return lista end
    local function agregar(o)
        if o.uid ~= nil then
            if vistos[o.uid] then return end
            vistos[o.uid] = true
        end
        lista[#lista + 1] = o
    end
    local arcosConGente = {}
    -- Personajes de historias en curso.
    for _, a in ipairs(estado.arcos or {}) do
        if not a.terminado then
            for _, n in ipairs(a.npcs or {}) do
                local uid = tostring(n.uid)
                if cerca[uid] ~= nil and cerca[uid] <= Conv.DIST_HABLAR then
                    arcosConGente[a.id] = true
                    local sub = (ROLES_SOUS[tostring(n.rol)] and string.find(tostring(a.def), "^sous") ~= nil) and "Sous"
                        or (string.find(tostring(a.def), "^favor_") ~= nil and "Sous") or a.titulo
                    agregar({ tipo = "npc", uid = uid, rol = n.rol, nombre = n.nombre_completo or n.nombre or "Alguien",
                        sub = sub, sous = ROLES_SOUS[tostring(n.rol)] == true and sub == "Sous" })
                end
            end
        end
    end
    -- Residentes (Sous aliado en su base).
    for _, r in ipairs(estado.residentes_info or {}) do
        local uid = tostring(r.uid)
        if cerca[uid] ~= nil and cerca[uid] <= Conv.DIST_HABLAR then
            agregar({ tipo = "npc", uid = uid, rol = r.rol, nombre = r.nombre or r.rol, sub = "Sous",
                sous = r.grupo == "sous" })
        end
    end
    -- Misioneros (por su cuerpo o, si no esta cargado, por estar en su edificio).
    local contactosCerca = {}
    for _, c in ipairs(estado.contactos or {}) do
        local uid = c.uid ~= nil and tostring(c.uid) or nil
        local ok = uid ~= nil and cerca[uid] ~= nil and cerca[uid] <= Conv.DIST_HABLAR
        if not ok and c.x ~= nil and px ~= nil and distancia(c.x, c.y, px, py) <= 8 then ok = true end
        if ok then
            contactosCerca[c.id] = true
            local sub = "Misionero de " .. tostring(c.ciudad)
            local rep = Conv.miReputacion(estado, c.id)
            if rep ~= nil and rep.rango ~= nil and rep.rango ~= "" then sub = sub .. "  -  te trata de " .. tostring(rep.rango) end
            agregar({ tipo = "contacto", uid = uid, id = c.id, nombre = c.nombre, sub = sub, ciudad = c.ciudad })
        end
    end
    -- Preguntas de una conversacion entre NPCs (te piden opinion).
    for _, q in ipairs(estado.preguntas or {}) do
        if px ~= nil and distancia(q.x, q.y, px, py) <= 15 then
            agregar({ tipo = "pregunta", id = "preg:" .. tostring(q.conv), i = q.i, conv = q.conv, nombre = tostring(q.texto),
                sub = "Te piden opinion", opciones = q.opciones, x = q.x, y = q.y })
        end
    end
    -- Lugares con opciones y sin nadie con quien hablar.
    for _, a in ipairs(estado.arcos or {}) do
        if not a.terminado and #(a.opciones or {}) > 0 and a.ax ~= nil and px ~= nil
                and distancia(a.ax, a.ay, px, py) <= (a.radio or 8) + 1
                and not arcosConGente[a.id] and not (a.contacto ~= nil and contactosCerca[a.contacto]) then
            agregar({ tipo = "escena", arco = a.id, nombre = tostring(a.titulo), sub = "Lo que se puede hacer aqui" })
        end
    end
    return lista
end

-- Confianza del grupo del jugador con un misionero (o nil).
function Conv.miReputacion(estado, contactoId)
    local grupo = Conv.miGrupo()
    local tabla = estado ~= nil and estado.reputacion or nil
    local fila = tabla ~= nil and grupo ~= nil and tabla[grupo] or nil
    return fila ~= nil and fila[contactoId] or nil
end

function Conv.textoMenu(o)
    if o.tipo == "escena" then return "[" .. tostring(o.nombre) .. "] Que hacer aqui" end
    if o.tipo == "pregunta" then return "[Conversa] " .. tostring(o.nombre) end
    return "Hablar con " .. tostring(o.nombre)
end

-- ---------------------------------------------------------------------------
-- Opciones de la conversacion (puro)
-- Cada opcion: { texto, tipo, ... }. tipo:
--   elegir {arco, opcion}  favor {rol}  charlar  niveles  nivel {nivel}  aceptar {nivel}
--   estado_encargo {arco}  volver  adios  info (linea sin numero)
-- ---------------------------------------------------------------------------

local function arcoPorId(estado, id)
    for _, a in ipairs(estado ~= nil and estado.arcos or {}) do if a.id == id then return a end end
    return nil
end
Conv.arcoPorId = arcoPorId

local function tieneNpc(a, uid)
    for _, n in ipairs(a.npcs or {}) do if tostring(n.uid) == uid then return true end end
    return false
end

-- Texto de una opcion de "Conversar" con una persona (el texto original es su nombre).
Conv.TEXTO_CONVERSAR = "Cuentame algo de ti."

function Conv.opciones(obj, estado, modo, nivelElegido)
    local ops = {}
    if obj == nil or estado == nil then return { { tipo = "adios", texto = "Adios." } } end
    local function op(t) ops[#ops + 1] = t end

    if obj.tipo == "contacto" and modo == "niveles" then
        local mio = Cliente ~= nil and Cliente.miEncargo ~= nil and Cliente.miEncargo() or nil
        if mio ~= nil then
            op({ tipo = "info", texto = "Tu grupo ya tiene un encargo en curso. Terminalo primero." })
        else
            for _, n in ipairs(Conv.NIVELES) do
                op({ tipo = "nivel", nivel = n.id, texto = "Algo " .. string.lower(n.titulo) .. "." })
            end
        end
        op({ tipo = "volver", texto = "Mejor despues." })
        return ops
    end
    if obj.tipo == "contacto" and modo == "ofertas" then
        local of = Cliente ~= nil and Cliente.ofertas or nil
        if of == nil or of.contacto ~= obj.id or of.nivel ~= nivelElegido then
            op({ tipo = "info", texto = "Revisa su libreta buscando algo para ti..." })
        else
            if of.nota ~= nil then op({ tipo = "info", texto = tostring(of.nota) }) end
            for _, o in ipairs(of.lista or {}) do
                op({ tipo = "info", texto = tostring(o.titulo), titulo = true })
                for i, l in ipairs(o.lineas or {}) do if i > 1 then op({ tipo = "info", texto = tostring(l) }) end end
                op({ tipo = "aceptar_oferta", i = o.i, titulo_oferta = o.titulo,
                    texto = #of.lista > 1 and ("Acepto este: " .. tostring(o.titulo) .. ".") or "Acepto. Dame el mapa." })
            end
            if #(of.lista or {}) > 0 then
                op({ tipo = "otra", texto = of.gratis and "Tienes otra cosa? (hoy va por la casa)" or "Tienes otra cosa? (te paso una lata)", suave = true })
            end
        end
        op({ tipo = "niveles", texto = "Mejor otro tipo de trabajo." })
        return ops
    end
    if obj.tipo == "contacto" and modo == "cura" then
        local cura = estado.cura or {}
        local mio = Cliente ~= nil and Cliente.miEncargo ~= nil and Cliente.miEncargo() or nil
        if (cura.falta or 0) > 0 then
            local dias = math.ceil((cura.falta or 0) / 24)
            local otro = nil
            for _, c in ipairs(estado.contactos or {}) do if c.id == cura.contacto and c.id ~= obj.id then otro = c.nombre end end
            op({ tipo = "info", texto = otro ~= nil and (tostring(otro) .. " ya mando a alguien por la cura. Hay que esperar " .. dias .. " dias.")
                or ("No hay nada especial ahora. Vuelve en " .. dias .. " dias.") })
        elseif mio ~= nil then
            op({ tipo = "info", texto = "Primero termina el encargo que tienes." })
        else
            op({ tipo = "info", texto = "La cura", titulo = true })
            op({ tipo = "info", texto = "Un antibiotico experimental que cura la mordida, en un edificio grande de Louisville (hospital, laboratorio o base militar)." })
            op({ tipo = "info", texto = "Ultra dificil: una horda enorme, corredores y saqueadores. Plazo: 7 dias." })
            op({ tipo = "info", texto = "Hay dos dosis: una para la persona que espera el misionero, la otra es tuya." })
            op({ tipo = "info", texto = "Si la aceptas, los otros misioneros no la tienen por 20 dias." })
            op({ tipo = "aceptar_cura", texto = "Acepto. Voy por la cura." })
        end
        op({ tipo = "volver", texto = "Mejor despues." })
        return ops
    end
    if obj.tipo == "contacto" and modo == "abandonar" then
        op({ tipo = "info", texto = "Si dejas el encargo, va a confiar menos en ti." })
        op({ tipo = "abandonar_si", texto = "Si, lo dejo. No puedo." })
        op({ tipo = "volver", texto = "Mejor no. Lo termino." })
        return ops
    end
    if obj.tipo == "pregunta" then
        for _, o in ipairs(obj.opciones or {}) do
            op({ tipo = "responder", pregunta = obj.i, conv = obj.conv, opcion = o.id, texto = tostring(o.texto) })
        end
        op({ tipo = "adios", texto = "No meterse." })
        return ops
    end
    if obj.tipo == "contacto" and modo == "confirmar" then
        local n = Conv.nivel(nivelElegido) or Conv.NIVELES[1]
        op({ tipo = "info", texto = "Encargo " .. n.titulo, titulo = true })
        for _, l in ipairs(n.lineas) do op({ tipo = "info", texto = l }) end
        op({ tipo = "aceptar", nivel = n.id, texto = "Acepto. Dame el mapa." })
        op({ tipo = "niveles", texto = "Mejor otro trabajo." })
        return ops
    end

    if obj.tipo == "escena" then
        local a = arcoPorId(estado, obj.arco)
        for _, o in ipairs(a ~= nil and a.opciones or {}) do
            local t = o.submenu ~= nil and (tostring(o.submenu) .. ": " .. tostring(o.texto)) or tostring(o.texto)
            op({ tipo = "elegir", arco = a.id, opcion = o.id, texto = t, requiere = o.requiere })
        end
        op({ tipo = "adios", texto = "Irse." })
        return ops
    end

    if obj.tipo == "npc" then
        for _, a in ipairs(estado.arcos or {}) do
            if not a.terminado and tieneNpc(a, obj.uid) then
                for _, o in ipairs(a.opciones or {}) do
                    if o.submenu == nil then
                        op({ tipo = "elegir", arco = a.id, opcion = o.id, texto = tostring(o.texto), requiere = o.requiere })
                    elseif o.rol == nil or tostring(o.rol) == tostring(obj.rol) then
                        op({ tipo = "elegir", arco = a.id, opcion = o.id,
                            texto = o.rol ~= nil and Conv.TEXTO_CONVERSAR or tostring(o.texto), suave = true })
                    end
                end
            end
        end
        for _, f in ipairs(estado.favores or {}) do
            if f.uid ~= nil and tostring(f.uid) == obj.uid then
                op({ tipo = "favor", rol = f.rol, texto = "Te noto preocupado. Necesitas algo?" })
            end
        end
        op({ tipo = "charlar", texto = "Y, como va todo?", suave = true })
        op({ tipo = "adios", texto = "Nos vemos." })
        return ops
    end

    if obj.tipo == "contacto" then
        local grupo = Conv.miGrupo()
        for _, a in ipairs(estado.arcos or {}) do
            if not a.terminado and a.contacto == obj.id and (a.dueno == nil or a.dueno == grupo) then
                for _, o in ipairs(a.opciones or {}) do
                    op({ tipo = "elegir", arco = a.id, opcion = o.id, texto = tostring(o.texto), requiere = o.requiere })
                end
            end
        end
        local mio = Cliente ~= nil and Cliente.miEncargo ~= nil and Cliente.miEncargo() or nil
        if mio ~= nil then
            op({ tipo = "estado_encargo", arco = mio.arco, texto = "Como va lo de mi encargo?" })
            op({ tipo = "abandonar", texto = "Quiero dejar el encargo.", suave = true })
        else
            op({ tipo = "niveles", texto = "Tienes pega para mi?" })
            if estado.cura ~= nil then op({ tipo = "cura", texto = "Tienes algo especial?" }) end
        end
        local rep = Conv.miReputacion(estado, obj.id)
        if rep ~= nil and rep.favor then
            op({ tipo = "favor_misionero", texto = "Me harias un favor? Por todo lo que hemos pasado." })
        end
        op({ tipo = "charlar", texto = "Que cuenta?", suave = true })
        op({ tipo = "adios", texto = "Nos vemos." })
        return ops
    end
    return { { tipo = "adios", texto = "Adios." } }
end

-- ---------------------------------------------------------------------------
-- Misiones pendientes (puro)
-- ---------------------------------------------------------------------------

local function visible(a)
    return not a.terminado and (a.lore ~= nil or a.pista ~= nil)
end

local function ultimaNota(a)
    local d = a.diario or {}
    return d[#d] ~= nil and d[#d].t or nil
end

function Conv.misiones(estado, miGrupo)
    local secciones = {}
    if estado == nil then return secciones end
    local historia, secundarias, encargo, favores = {}, {}, {}, {}
    for _, a in ipairs(estado.arcos or {}) do
        if visible(a) then
            local item = { id = a.id, titulo = tostring(a.titulo), pista = a.pista, nota = ultimaNota(a), tipo = a.tipo }
            if a.tipo == "principal" then
                item.titulo = "Capitulo " .. tostring(a.capitulo or "?") .. ": " .. item.titulo
                item.tab = "historia"
                item.orden = a.capitulo or 0
                historia[#historia + 1] = item
            elseif a.tipo == "encargo" then
                if a.dueno == nil or a.dueno == miGrupo then
                    item.tab = "secundarias"
                    item.sub = (a.contacto_nombre ~= nil and (tostring(a.contacto_nombre) .. ", " .. tostring(a.ciudad or "")) or nil)
                    encargo[#encargo + 1] = item
                end
            else
                item.tab = "secundarias"
                secundarias[#secundarias + 1] = item
            end
        end
    end
    table.sort(historia, function(x, y) return x.orden < y.orden end)
    for _, f in ipairs(estado.favores or {}) do
        favores[#favores + 1] = { favor = f.rol, titulo = tostring(f.nombre or f.corto), tab = "secundarias",
            pista = "Tiene algo que pedirte. Esta en la base de Sous." }
    end
    if #historia > 0 then secciones[#secciones + 1] = { titulo = "Historia", items = historia } end
    if #encargo > 0 then secciones[#secciones + 1] = { titulo = "Tu encargo", items = encargo } end
    if #secundarias > 0 then secciones[#secciones + 1] = { titulo = "Secundarias", items = secundarias } end
    if #favores > 0 then secciones[#secciones + 1] = { titulo = "Gente de Sous que necesita algo", items = favores } end
    return secciones
end

-- Mision que muestra el rastreador.
--   Conv.seguir = nil (automatico), "-" (ninguna) o el id de un arco.
function Conv.misionSeguida(estado, miGrupo)
    if estado == nil or Conv.seguir == "-" then return nil end
    local secciones = Conv.misiones(estado, miGrupo)
    if Conv.seguir ~= nil then
        for _, s in ipairs(secciones) do
            for _, it in ipairs(s.items) do if it.id == Conv.seguir then return it end end
        end
    end
    -- Automatico (o la seguida ya termino): la historia, despues el encargo, despues el resto.
    for _, s in ipairs(secciones) do
        for _, it in ipairs(s.items) do
            if it.id ~= nil and it.pista ~= nil then return it end
        end
    end
    return nil
end

function Conv.guardarSeguir()
    pcall(function()
        local f = getFileWriter(Conv.ARCHIVO_SEGUIR, true, false)
        if f == nil then return end
        f:write("seguir=" .. tostring(Conv.seguir or ""))
        f:close()
    end)
end

function Conv.leerSeguir()
    pcall(function()
        local f = getFileReader(Conv.ARCHIVO_SEGUIR, false)
        if f == nil then return end
        local linea = f:readLine()
        f:close()
        local v = linea ~= nil and string.match(linea, "^seguir=(.*)$") or nil
        if v ~= nil and v ~= "" then Conv.seguir = v end
    end)
end

function Conv.cambiarSeguir(id)
    Conv.seguir = id
    Conv.guardarSeguir()
    if Conv.rastreador ~= nil then Conv.rastreador:refrescar() end
end

-- ---------------------------------------------------------------------------
-- Envio al servidor
-- ---------------------------------------------------------------------------

function Conv.pedirFrase(uid)
    if uid == nil then return end
    local jugador = getPlayer()
    if jugador == nil then return end
    if isClient() then
        sendClientCommand(jugador, Conv.MODULO, "hablar", { uid = uid })
    elseif Narrador.ConversacionServer ~= nil then
        Narrador.ConversacionServer.alComando(Conv.MODULO, "hablar", jugador, { uid = uid })
    end
end

-- ---------------------------------------------------------------------------
-- Ventana
-- ---------------------------------------------------------------------------

NarradorConversacionVentana = ISPanel:derive("NarradorConversacionVentana")

local CABECERA = 66
local MARGEN = 12
local FILA_PAD = 5

function NarradorConversacionVentana:new()
    local sw, sh = getCore():getScreenWidth(), getCore():getScreenHeight()
    local w = math.min(820, sw - 40)
    local h = math.min(400, math.max(300, floor(sh * 0.48)))
    local x = floor((sw - w) / 2)
    local y = math.max(10, sh - h - 120)
    local o = ISPanel.new(self, x, y, w, h)
    o.background = false
    o.moveWithMouse = true
    o.tab = "conversacion"
    o.obj = nil
    o.log = {}
    o.modo = "principal"
    o.ops = {}
    o.filas = {}
    o.scrollLog = 0
    o.scrollOps = 0
    o.scrollMis = 0
    o.esperandoHasta = 0
    o.lejos = false
    o.revisado = 0
    o.texSous = getTexture(Conv.TEX_SOUS)
    o.texDiario = getTexture(Conv.TEX_DIARIO)
    return o
end

-- Historial corto por personaje, asi al volver a hablarle se ve lo ultimo que se dijeron.
Conv.historial = Conv.historial or {}

function NarradorConversacionVentana:claveLog()
    local o = self.obj
    if o == nil then return "misiones" end
    return o.uid or o.arco or o.id or "?"
end

function NarradorConversacionVentana:agregar(tipo, quien, texto)
    if texto == nil or texto == "" then return end
    local clave = self:claveLog()
    local log = Conv.historial[clave] or {}
    Conv.historial[clave] = log
    -- No repetir la misma linea dos veces seguidas (por ejemplo, la burbuja y el cartel).
    local ultima = log[#log]
    if ultima ~= nil and ultima.texto == texto and ultima.quien == quien then return end
    log[#log + 1] = { tipo = tipo, quien = quien, texto = tostring(texto) }
    while #log > 40 do table.remove(log, 1) end
    self.log = log
    self.scrollLog = 0
    self.cacheLog = nil
end

function NarradorConversacionVentana:hablarCon(obj)
    self.obj = obj
    self.tab = obj ~= nil and "conversacion" or "misiones"
    self.modo = "principal"
    self.lejos = false
    self.scrollOps = 0
    self.log = Conv.historial[self:claveLog()] or {}
    self.cacheLog = nil
    if obj ~= nil then
        if #self.log > 0 then
            self:agregar("sep", nil, "...")
        end
        if obj.tipo == "pregunta" then
            self:agregar("narrador", nil, "Se quedan mirandote. Esperan que digas algo.")
        elseif obj.tipo == "escena" then
            local a = arcoPorId(Conv.estado(), obj.arco)
            self:agregar("narrador", nil, a ~= nil and (a.lore or a.pista) or "Miras alrededor.")
        elseif obj.uid ~= nil then
            self.esperandoHasta = ahora() + 4000
            Conv.pedirFrase(obj.uid)
        else
            self:agregar("narrador", nil, tostring(obj.nombre) .. " no esta a la vista, pero este es su lugar. Igual te puede dar trabajo.")
        end
    end
    self:refrescar()
end

function NarradorConversacionVentana:refrescar()
    self.ops = Conv.opciones(self.obj, Conv.estado(), self.modo, self.nivelElegido)
    self:armarFilas()
    if self.tab == "misiones" then self:armarMisiones() end
end

-- Zona del cuerpo de la ventana.
function NarradorConversacionVentana:cuerpo()
    return MARGEN, CABECERA + 8, self.width - 2 * MARGEN, self.height - CABECERA - 8 - MARGEN
end

-- Reparte el alto entre el registro (arriba) y las opciones (abajo).
function NarradorConversacionVentana:armarFilas()
    local x, y, w, h = self:cuerpo()
    local fuente = UIFont.Small
    local hl = Conv.altoFuente(fuente) + 1
    local filas, alto = {}, 0
    local n = 0
    for _, o in ipairs(self.ops) do
        local sangria = (o.tipo == "info") and 10 or 30
        local lineas = Conv.envolver(o.texto, w - sangria - 12, o.titulo and UIFont.Medium or fuente)
        local pad = o.tipo == "info" and 2 or FILA_PAD
        local fh = #lineas * (o.titulo and (Conv.altoFuente(UIFont.Medium) + 1) or hl) + pad * 2
        if o.tipo ~= "info" then n = n + 1 end
        filas[#filas + 1] = { op = o, lineas = lineas, alto = fh, num = o.tipo ~= "info" and n or nil, sangria = sangria, pad = pad }
        alto = alto + fh + 2
    end
    self.filas = filas
    -- Las opciones usan hasta el 55% del cuerpo; el resto es para lo que se dice.
    self.altoOps = math.min(alto, floor(h * 0.55))
    self.altoLog = h - self.altoOps - 10
    self.altoOpsTotal = alto
    self.scrollOps = math.max(0, math.min(self.scrollOps, alto - self.altoOps))
end

function NarradorConversacionVentana:lineasLog(ancho)
    if self.cacheLog ~= nil and self.cacheLogAncho == ancho then return self.cacheLog end
    local lineas = {}
    local fuente = UIFont.Small
    for _, e in ipairs(self.log) do
        if e.tipo == "sep" then
            lineas[#lineas + 1] = { t = "", sep = true }
        else
            local prefijo = ""
            if e.tipo == "npc" then prefijo = tostring(e.quien) .. ": "
            elseif e.tipo == "yo" then prefijo = "Tu: " end
            local ancho1 = Conv.medir(fuente, prefijo)
            local partes = Conv.envolver(e.texto, ancho - ancho1, fuente)
            for i, p in ipairs(partes) do
                lineas[#lineas + 1] = { t = p, prefijo = i == 1 and prefijo or nil, x = ancho1, tipo = e.tipo }
            end
        end
        lineas[#lineas].fin = true
    end
    self.cacheLog, self.cacheLogAncho = lineas, ancho
    return lineas
end

-- Misiones: tarjetas con titulo, pista y botones.
function NarradorConversacionVentana:armarMisiones()
    local _, _, w = self:cuerpo()
    local secciones = Conv.misiones(Conv.estado(), Conv.miGrupo())
    local seguida = Conv.misionSeguida(Conv.estado(), Conv.miGrupo())
    local bloques, y = {}, 0
    local hs = Conv.altoFuente(UIFont.Small) + 1
    local hm = Conv.altoFuente(UIFont.Medium) + 2
    if #secciones == 0 then
        bloques[#bloques + 1] = { tipo = "vacio", y = 0,
            lineas = Conv.envolver("No tienes nada pendiente. Los misioneros siempre tienen pega, y la historia sigue cuando alguien golpee la puerta.", w - 20, UIFont.Small) }
        y = #bloques[1].lineas * hs
    end
    for _, s in ipairs(secciones) do
        bloques[#bloques + 1] = { tipo = "seccion", y = y, texto = s.titulo }
        y = y + hm + 2
        for _, it in ipairs(s.items) do
            local anchoTexto = w - 24 - 150
            local lineas = Conv.envolver(it.pista ~= nil and ("> " .. it.pista) or (it.nota or ""), anchoTexto, UIFont.Small)
            local titulo = it.titulo .. (it.sub ~= nil and ("  -  " .. it.sub) or "")
            local alto = 10 + hm + #lineas * hs + 8
            bloques[#bloques + 1] = { tipo = "tarjeta", y = y, alto = alto, item = it, titulo = titulo, lineas = lineas,
                seguida = seguida ~= nil and seguida.id ~= nil and seguida.id == it.id }
            y = y + alto + 6
        end
        y = y + 6
    end
    self.bloques = bloques
    self.altoMisiones = y
end

-- ---------------------------------------------------------------------------
-- Acciones
-- ---------------------------------------------------------------------------

function NarradorConversacionVentana:elegirOpcion(o)
    if o == nil or o.tipo == "info" then return end
    if self.lejos and o.tipo ~= "adios" then
        self:agregar("sistema", nil, "Estas muy lejos para seguir hablando.")
        return
    end
    sonido("UISelectListItem")
    local obj = self.obj
    if o.tipo == "adios" then
        if obj ~= nil and obj.tipo ~= "escena" then self:agregar("yo", nil, o.texto) end
        self:cerrar()
        return
    elseif o.tipo == "volver" then
        self.modo = "principal"
    elseif o.tipo == "niveles" then
        if self.modo == "principal" then self:agregar("yo", nil, o.texto) end
        self.modo = "niveles"
    elseif o.tipo == "nivel" then
        self.nivelElegido = o.nivel
        if Cliente ~= nil then Cliente.ofertas = nil end
        self.modo = "ofertas"
        self.esperandoHasta = ahora() + 5000
        Cliente.enviar("verOfertas", { contacto = obj.id, nivel = o.nivel })
    elseif o.tipo == "aceptar_oferta" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 5000
        Cliente.enviar("tomarOferta", { contacto = obj.id, i = o.i })
        self.modo = "principal"
    elseif o.tipo == "otra" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 5000
        if Cliente ~= nil then Cliente.ofertas = nil end
        Cliente.enviar("otraOferta", { contacto = obj.id })
    elseif o.tipo == "favor_misionero" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 5000
        Cliente.enviar("favorMisionero", { contacto = obj.id })
    elseif o.tipo == "cura" then
        self:agregar("yo", nil, o.texto)
        self.modo = "cura"
    elseif o.tipo == "aceptar_cura" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 5000
        Cliente.enviar("pedirCura", { contacto = obj.id })
        self.modo = "principal"
    elseif o.tipo == "abandonar" then
        self:agregar("yo", nil, o.texto)
        self.modo = "abandonar"
    elseif o.tipo == "abandonar_si" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 5000
        Cliente.enviar("abandonarEncargo", {})
        self.modo = "principal"
    elseif o.tipo == "responder" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 9000
        Cliente.enviar("responderConversa", { pregunta = o.pregunta, conv = o.conv, opcion = o.opcion })
    elseif o.tipo == "aceptar" then
        local n = Conv.nivel(o.nivel)
        self:agregar("yo", nil, "Ya, acepto el trabajo " .. string.lower(n ~= nil and n.titulo or tostring(o.nivel)) .. ".")
        self.esperandoHasta = ahora() + 5000
        Cliente.enviar("pedirTrabajo", { contacto = obj.id, nivel = o.nivel })
        self.modo = "principal"
    elseif o.tipo == "elegir" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 5000
        Cliente.enviar("elegir", { arco = o.arco, opcion = o.opcion })
    elseif o.tipo == "favor" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 5000
        if Narrador.Mapas ~= nil and Narrador.Mapas.pedirFavor ~= nil then Narrador.Mapas.pedirFavor(o.rol) end
    elseif o.tipo == "charlar" then
        self:agregar("yo", nil, o.texto)
        self.esperandoHasta = ahora() + 4000
        Conv.pedirFrase(obj ~= nil and obj.uid or nil)
    elseif o.tipo == "estado_encargo" then
        self:agregar("yo", nil, o.texto)
        local a = arcoPorId(Conv.estado(), o.arco)
        local t = a ~= nil and (a.pista or a.lore) or nil
        self:agregar("narrador", nil, t ~= nil and ("Te recuerda lo que falta: " .. t) or "Te mira raro. Parece que ya no hay nada pendiente.")
    end
    self:refrescar()
end

function NarradorConversacionVentana:cambiarTab(tab)
    if tab == "conversacion" and self.obj == nil then return end
    if self.tab == tab then return end
    self.tab = tab
    self.scrollMis = 0
    if tab == "misiones" then self:armarMisiones() end
    sonido("UISelectListItem")
end

-- Llega algo del servidor mientras la ventana esta abierta.
function NarradorConversacionVentana:recibido(comando, datos)
    if comando == "estado" or comando == "ofertas" then
        self:refrescar()
    elseif comando == "decir" then
        local uid = datos.uid ~= nil and tostring(datos.uid) or nil
        local obj = self.obj
        if obj == nil or obj.tipo == "escena" and ahora() > self.esperandoHasta then return end
        if (obj.uid ~= nil and uid == obj.uid) or ahora() <= self.esperandoHasta then
            self:agregar("npc", Conv.nombreDeUid(uid, datos.nombre), datos.texto)
        end
    elseif comando == "respuesta" then
        self:agregar("narrador", nil, datos.texto)
    end
end

-- ---------------------------------------------------------------------------
-- Zonas clicables
-- ---------------------------------------------------------------------------

local function dentro(px, py, x, y, w, h) return px >= x and px <= x + w and py >= y and py <= y + h end

function NarradorConversacionVentana:zonaTab(i)
    local w = 104
    local x = self.width - MARGEN - 34 - (3 - i) * (w + 6)
    return x, 18, w, 26
end

function NarradorConversacionVentana:zonaCerrar()
    return self.width - MARGEN - 26, 18, 26, 26
end

function NarradorConversacionVentana:zonaOps()
    local x, y, w, h = self:cuerpo()
    return x, y + h - self.altoOps, w, self.altoOps
end

function NarradorConversacionVentana:filaEn(mx, my)
    local x, y, w, h = self:zonaOps()
    if not dentro(mx, my, x, y, w, h) then return nil end
    local fy = y - self.scrollOps
    for _, f in ipairs(self.filas) do
        if my >= fy and my < fy + f.alto then return f end
        fy = fy + f.alto + 2
    end
    return nil
end

-- Botones de una tarjeta de mision: seguir y diario.
function NarradorConversacionVentana:botonesTarjeta(b)
    local x, y, w = self:cuerpo()
    local by = y + b.y - self.scrollMis + 8
    return { x = x + w - 144, y = by, w = 70, h = 20 }, { x = x + w - 68, y = by, w = 60, h = 20 }
end

function NarradorConversacionVentana:onMouseDown(x, y)
    for i, t in ipairs({ "conversacion", "misiones" }) do
        if dentro(x, y, self:zonaTab(i)) then self:cambiarTab(t); return true end
    end
    if dentro(x, y, self:zonaCerrar()) then self:cerrar(); return true end
    if self.tab == "conversacion" then
        local f = self:filaEn(x, y)
        if f ~= nil then self:elegirOpcion(f.op); return true end
    else
        local cx, cy, cw, ch = self:cuerpo()
        if dentro(x, y, cx, cy, cw, ch) then
            for _, b in ipairs(self.bloques or {}) do
                if b.tipo == "tarjeta" then
                    local bs, bd = self:botonesTarjeta(b)
                    if b.item.id ~= nil and dentro(x, y, bs.x, bs.y, bs.w, bs.h) then
                        Conv.cambiarSeguir(b.seguida and "-" or b.item.id)
                        self:armarMisiones()
                        sonido("UISelectListItem")
                        return true
                    end
                    if dentro(x, y, bd.x, bd.y, bd.w, bd.h) then
                        if Narrador.Diario ~= nil then pcall(Narrador.Diario.abrir, b.item.tab) end
                        return true
                    end
                end
            end
        end
    end
    return ISPanel.onMouseDown(self, x, y)
end

function NarradorConversacionVentana:onMouseWheel(delta)
    local mx, my = self:getMouseX(), self:getMouseY()
    local paso = (delta > 0 and 1 or -1) * 30
    if self.tab == "misiones" then
        local _, _, _, h = self:cuerpo()
        self.scrollMis = math.max(0, math.min(self.scrollMis + paso, math.max(0, (self.altoMisiones or 0) - h)))
    elseif dentro(mx, my, self:zonaOps()) then
        self.scrollOps = math.max(0, math.min(self.scrollOps + paso, math.max(0, self.altoOpsTotal - self.altoOps)))
    else
        -- En el registro, la rueda hacia atras muestra lo anterior.
        self.scrollLog = math.max(0, self.scrollLog - (delta > 0 and -3 or 3))
    end
    return true
end

function NarradorConversacionVentana:onRightMouseDown()
    return true
end

-- ---------------------------------------------------------------------------
-- Dibujo
-- ---------------------------------------------------------------------------

function NarradorConversacionVentana:prerender()
    -- Fondo y marco.
    self:drawRect(0, 0, self.width, self.height, 0.9, 0.06, 0.05, 0.04)
    self:drawRectBorder(0, 0, self.width, self.height, 0.85, BORDE.r, BORDE.g, BORDE.b)
    self:drawRect(1, 1, self.width - 2, CABECERA, 0.5, 0.14, 0.1, 0.06)
    self:drawRect(MARGEN, CABECERA, self.width - 2 * MARGEN, 1, 0.6, BORDE.r, BORDE.g, BORDE.b)
    -- Revisar la distancia cada tanto.
    local t = ahora()
    if t - self.revisado > 700 then
        self.revisado = t
        self:revisarDistancia()
    end
end

function NarradorConversacionVentana:revisarDistancia()
    local obj = self.obj
    local jugador = getPlayer()
    if obj == nil or jugador == nil then self.lejos = false; return end
    local lejos = false
    if obj.tipo == "pregunta" then
        lejos = obj.x ~= nil and distancia(obj.x, obj.y, jugador:getX(), jugador:getY()) > 18
    elseif obj.tipo == "escena" then
        local a = arcoPorId(Conv.estado(), obj.arco)
        lejos = a == nil or a.ax == nil or distancia(a.ax, a.ay, jugador:getX(), jugador:getY()) > (a.radio or 8) + 4
    elseif obj.uid ~= nil then
        local cerca = Conv.cuerposCerca(jugador, Conv.DIST_SEGUIR)
        lejos = cerca[obj.uid] == nil
        if lejos and obj.tipo == "contacto" then
            for _, c in ipairs((Conv.estado() or {}).contactos or {}) do
                if c.id == obj.id and c.x ~= nil and distancia(c.x, c.y, jugador:getX(), jugador:getY()) <= 10 then lejos = false end
            end
        end
    end
    if lejos ~= self.lejos then
        self.lejos = lejos
        if lejos then self:agregar("sistema", nil, "Te alejaste. Acercate para seguir hablando.") end
    end
end

function NarradorConversacionVentana:dibujarMedallon()
    local x, y, s = MARGEN, 7, 52
    self:drawRect(x, y, s, s, 1, 0.12, 0.09, 0.06)
    self:drawRectBorder(x, y, s, s, 0.9, BORDE.r, BORDE.g, BORDE.b)
    local obj = self.obj
    if obj == nil then
        if self.texDiario ~= nil then self:drawTextureScaled(self.texDiario, x + 4, y + 4, s - 8, s - 8, 1, 1, 1, 1) end
        return
    end
    if obj.sous and self.texSous ~= nil then
        self:drawTextureScaled(self.texSous, x + 3, y + 3, s - 6, s - 6, 1, 1, 1, 1)
        return
    end
    local letra = obj.tipo == "escena" and "?" or string.upper(string.sub(tostring(obj.nombre or "?"), 1, 1))
    local c = obj.tipo == "contacto" and VERDE or ORO
    self:drawTextCentre(letra, x + floor(s / 2), y + floor((s - Conv.altoFuente(UIFont.Large)) / 2), c.r, c.g, c.b, 1, UIFont.Large)
end

function NarradorConversacionVentana:dibujarCabecera()
    self:dibujarMedallon()
    local nombre, sub
    if self.obj == nil then
        nombre, sub = "Misiones", "Lo que tienes pendiente"
    else
        nombre, sub = tostring(self.obj.nombre), self.obj.sub
    end
    self:drawText(nombre, 76, 9, ORO.r, ORO.g, ORO.b, 1, UIFont.Large)
    if sub ~= nil then self:drawText(tostring(sub), 77, 9 + Conv.altoFuente(UIFont.Large) + 1, GRIS.r, GRIS.g, GRIS.b, 1, UIFont.Small) end
    local mx, my = self:getMouseX(), self:getMouseY()
    for i, t in ipairs({ { "conversacion", "Conversacion" }, { "misiones", "Misiones" } }) do
        local x, y, w, h = self:zonaTab(i)
        local activa = self.tab == t[1]
        local deshabilitada = t[1] == "conversacion" and self.obj == nil
        local sobre = dentro(mx, my, x, y, w, h)
        self:drawRect(x, y, w, h, activa and 0.9 or (sobre and 0.5 or 0.3), activa and 0.45 or 0.2, activa and 0.32 or 0.15, activa and 0.12 or 0.1)
        self:drawRectBorder(x, y, w, h, 0.7, BORDE.r, BORDE.g, BORDE.b)
        local k = deshabilitada and 0.4 or 1
        self:drawTextCentre(t[2], x + floor(w / 2), y + 5, TEXTO.r * k, TEXTO.g * k, TEXTO.b * k, 1, UIFont.Small)
    end
    local x, y, w, h = self:zonaCerrar()
    local sobre = dentro(mx, my, x, y, w, h)
    self:drawRectBorder(x, y, w, h, 0.7, BORDE.r, BORDE.g, BORDE.b)
    self:drawTextCentre("X", x + floor(w / 2), y + 4, 1, sobre and 0.6 or 0.85, sobre and 0.5 or 0.7, 1, UIFont.Small)
end

function NarradorConversacionVentana:dibujarLog()
    local x, y, w = self:cuerpo()
    local h = self.altoLog
    local fuente = UIFont.Small
    local hl = Conv.altoFuente(fuente) + 2
    local lineas = self:lineasLog(w - 8)
    local caben = math.max(1, floor(h / hl))
    local maxScroll = math.max(0, #lineas - caben)
    self.scrollLog = math.min(self.scrollLog, maxScroll)
    local desde = math.max(1, #lineas - caben + 1 - self.scrollLog)
    local hasta = math.min(#lineas, desde + caben - 1)
    -- Si hay pocas lineas, se pegan abajo (como un chat).
    local ly = y + h - (hasta - desde + 1) * hl
    for i = desde, hasta do
        local l = lineas[i]
        if not l.sep then
            local c = TEXTO
            if l.tipo == "yo" then c = YO elseif l.tipo == "narrador" then c = NARRA elseif l.tipo == "sistema" then c = ROJO end
            local tx = x + 4
            if l.prefijo ~= nil and l.prefijo ~= "" then
                local pc = l.tipo == "yo" and YO or ORO
                self:drawText(l.prefijo, tx, ly, pc.r, pc.g, pc.b, 1, fuente)
            end
            self:drawText(l.t, tx + (l.x or 0), ly, c.r, c.g, c.b, 1, fuente)
        else
            self:drawRect(x + floor(w / 2) - 30, ly + floor(hl / 2), 60, 1, 0.4, GRIS.r, GRIS.g, GRIS.b)
        end
        ly = ly + hl
    end
    if self.scrollLog > 0 then
        self:drawTextRight("(rueda: mas reciente)", x + w, y, GRIS.r, GRIS.g, GRIS.b, 0.8, fuente)
    end
    if #lineas == 0 then
        self:drawText("...", x + 4, y + h - hl, GRIS.r, GRIS.g, GRIS.b, 1, fuente)
    end
end

function NarradorConversacionVentana:dibujarOpciones()
    local x, y, w, h = self:zonaOps()
    self:drawRect(x, y - 6, w, 1, 0.35, BORDE.r, BORDE.g, BORDE.b)
    local mx, my = self:getMouseX(), self:getMouseY()
    local sobre = self:filaEn(mx, my)
    local fy = y - self.scrollOps
    local hs = Conv.altoFuente(UIFont.Small) + 1
    local hm = Conv.altoFuente(UIFont.Medium) + 1
    for _, f in ipairs(self.filas) do
        if fy >= y - 1 and fy + f.alto <= y + h + 1 then
            local o = f.op
            local apagada = self.lejos and o.tipo ~= "adios"
            if f == sobre and o.tipo ~= "info" and not apagada then
                self:drawRect(x, fy, w, f.alto, 0.18, ORO.r, ORO.g, ORO.b)
                self:drawRect(x, fy, 3, f.alto, 0.9, ORO.r, ORO.g, ORO.b)
            end
            if f.num ~= nil then
                local c = apagada and GRIS or ORO
                self:drawText(tostring(f.num) .. ".", x + 8, fy + f.pad, c.r, c.g, c.b, 1, UIFont.Small)
            end
            local c = TEXTO
            if o.tipo == "info" then c = o.titulo and ORO or NARRA
            elseif apagada then c = GRIS
            elseif o.suave then c = { r = 0.8, g = 0.78, b = 0.72 } end
            local ly = fy + f.pad
            for _, l in ipairs(f.lineas) do
                self:drawText(l, x + f.sangria, ly, c.r, c.g, c.b, 1, o.titulo and UIFont.Medium or UIFont.Small)
                ly = ly + (o.titulo and hm or hs)
            end
            if o.requiere == "objeto" and not apagada then
                self:drawTextRight("(entregar)", x + w - 6, fy + FILA_PAD, GRIS.r, GRIS.g, GRIS.b, 1, UIFont.Small)
            end
        end
        fy = fy + f.alto + 2
    end
    if self.altoOpsTotal > self.altoOps then
        local barra = floor(h * self.altoOps / self.altoOpsTotal)
        local pos = floor((h - barra) * self.scrollOps / math.max(1, self.altoOpsTotal - self.altoOps))
        self:drawRect(x + w - 3, y + pos, 3, barra, 0.6, BORDE.r, BORDE.g, BORDE.b)
    end
end

function NarradorConversacionVentana:dibujarMisiones()
    local x, y, w, h = self:cuerpo()
    local mx, my = self:getMouseX(), self:getMouseY()
    local hs = Conv.altoFuente(UIFont.Small) + 1
    local hm = Conv.altoFuente(UIFont.Medium) + 2
    for _, b in ipairs(self.bloques or {}) do
        local by = y + b.y - self.scrollMis
        local alto = b.alto or hm
        if by >= y - 1 and by + alto <= y + h + 1 then
            if b.tipo == "seccion" then
                self:drawText(b.texto, x, by, ORO.r, ORO.g, ORO.b, 1, UIFont.Medium)
                local tw = Conv.medir(UIFont.Medium, b.texto)
                self:drawRect(x + tw + 10, by + floor(hm / 2), w - tw - 10, 1, 0.35, BORDE.r, BORDE.g, BORDE.b)
            elseif b.tipo == "vacio" then
                for i, l in ipairs(b.lineas) do self:drawText(l, x + 4, by + (i - 1) * hs, NARRA.r, NARRA.g, NARRA.b, 1, UIFont.Small) end
            else
                self:drawRect(x, by, w, alto, b.seguida and 0.35 or 0.22, 0.2, 0.15, 0.09)
                self:drawRectBorder(x, by, w, alto, b.seguida and 0.9 or 0.4, BORDE.r, BORDE.g, BORDE.b)
                if b.seguida then self:drawRect(x, by, 3, alto, 1, ORO.r, ORO.g, ORO.b) end
                self:drawText(b.titulo, x + 12, by + 8, TEXTO.r, TEXTO.g, TEXTO.b, 1, UIFont.Medium)
                for i, l in ipairs(b.lineas) do
                    local c = b.item.pista ~= nil and YO or NARRA
                    self:drawText(l, x + 12, by + 10 + hm + (i - 1) * hs, c.r, c.g, c.b, 1, UIFont.Small)
                end
                local bs, bd = self:botonesTarjeta(b)
                if b.item.id ~= nil then
                    local s = dentro(mx, my, bs.x, bs.y, bs.w, bs.h)
                    self:drawRect(bs.x, bs.y, bs.w, bs.h, s and 0.7 or 0.45, b.seguida and 0.45 or 0.2, b.seguida and 0.32 or 0.16, 0.1)
                    self:drawRectBorder(bs.x, bs.y, bs.w, bs.h, 0.7, BORDE.r, BORDE.g, BORDE.b)
                    self:drawTextCentre(b.seguida and "Siguiendo" or "Seguir", bs.x + floor(bs.w / 2), bs.y + 3, TEXTO.r, TEXTO.g, TEXTO.b, 1, UIFont.Small)
                end
                local s2 = dentro(mx, my, bd.x, bd.y, bd.w, bd.h)
                self:drawRect(bd.x, bd.y, bd.w, bd.h, s2 and 0.7 or 0.45, 0.2, 0.16, 0.1)
                self:drawRectBorder(bd.x, bd.y, bd.w, bd.h, 0.7, BORDE.r, BORDE.g, BORDE.b)
                self:drawTextCentre("Diario", bd.x + floor(bd.w / 2), bd.y + 3, TEXTO.r, TEXTO.g, TEXTO.b, 1, UIFont.Small)
            end
        end
    end
    if (self.altoMisiones or 0) > h then
        local barra = floor(h * h / self.altoMisiones)
        local pos = floor((h - barra) * self.scrollMis / math.max(1, self.altoMisiones - h))
        self:drawRect(x + w + 4, y + pos, 3, barra, 0.6, BORDE.r, BORDE.g, BORDE.b)
    end
end

function NarradorConversacionVentana:render()
    self:dibujarCabecera()
    if self.tab == "misiones" then
        self:dibujarMisiones()
    else
        self:dibujarLog()
        self:dibujarOpciones()
    end
end

function NarradorConversacionVentana:cerrar()
    self:setVisible(false)
    self:removeFromUIManager()
    if Conv.ventana == self then Conv.ventana = nil end
    sonido("UIToggleTickBox")
end

-- ---------------------------------------------------------------------------
-- Abrir
-- ---------------------------------------------------------------------------

function Conv.ventanaNueva()
    if Conv.ventana ~= nil then return Conv.ventana end
    local v = NarradorConversacionVentana:new()
    v:initialise()
    v:addToUIManager()
    Conv.ventana = v
    sonido("UIToggleTickBox")
    return v
end

function Conv.abrir(obj)
    local v = Conv.ventanaNueva()
    v:hablarCon(obj)
    v:bringToTop()
    if Cliente ~= nil and Cliente.estado == nil then Cliente.enviar("pedirEstado") end
    return v
end

function Conv.abrirMisiones()
    local v = Conv.ventanaNueva()
    if v.obj == nil then v:hablarCon(nil) end
    v.tab = "conversacion"
    v:cambiarTab("misiones")
    v:armarMisiones()
    v:bringToTop()
    return v
end

-- ---------------------------------------------------------------------------
-- Rastreador: la mision seguida, fija en pantalla
-- ---------------------------------------------------------------------------

NarradorRastreador = ISPanel:derive("NarradorRastreador")

Conv.RASTREADOR_W = 300

function NarradorRastreador:new(x, y)
    local o = ISPanel.new(self, x, y, Conv.RASTREADOR_W, 40)
    o.background = false
    o.moveWithMouse = true
    o.lineas = {}
    o.item = nil
    o.cambio = 0
    return o
end

function NarradorRastreador:refrescar()
    local it = Conv.misionSeguida(Conv.estado(), Conv.miGrupo())
    local anterior = self.item ~= nil and ((self.item.id or "") .. "|" .. (self.item.pista or "")) or nil
    self.item = it
    if it == nil then
        self:setVisible(false)
        return
    end
    local clave = (it.id or "") .. "|" .. (it.pista or "")
    if anterior ~= nil and anterior ~= clave then self.cambio = ahora() end
    self.lineas = Conv.envolver(it.pista or it.nota or "", self.width - 20, UIFont.Small)
    while #self.lineas > 3 do table.remove(self.lineas) end
    local hs = Conv.altoFuente(UIFont.Small) + 1
    self:setHeight(8 + hs + 2 + #self.lineas * hs + 8)
    self:setVisible(true)
end

function NarradorRastreador:onMouseDown(x, y)
    self.apreto = { x = getMouseX(), y = getMouseY() }
    return ISPanel.onMouseDown(self, x, y)
end

function NarradorRastreador:onMouseUp(x, y)
    local a = self.apreto
    self.apreto = nil
    local r = ISPanel.onMouseUp(self, x, y)
    local clic = a ~= nil and math.abs(getMouseX() - a.x) + math.abs(getMouseY() - a.y) < 5
    if clic then
        if x >= self.width - 18 and y <= 18 then
            Conv.cambiarSeguir("-")
        else
            Conv.abrirMisiones()
        end
    else
        Conv.guardarPosicion(self:getX(), self:getY())
    end
    return r
end

function NarradorRastreador:onMouseUpOutside(x, y)
    if self.apreto ~= nil then
        self.apreto = nil
        Conv.guardarPosicion(self:getX(), self:getY())
    end
    return ISPanel.onMouseUpOutside(self, x, y)
end

function NarradorRastreador:render()
    local it = self.item
    if it == nil then return end
    local t = ahora()
    local brillo = 0
    if t - self.cambio < 4000 then brillo = 0.5 + 0.5 * math.sin(t / 150) end
    self:drawRect(0, 0, self.width, self.height, 0.55, 0, 0, 0)
    self:drawRect(0, 0, 3, self.height, 0.9, ORO.r, ORO.g, ORO.b)
    if brillo > 0 then self:drawRectBorder(0, 0, self.width, self.height, brillo, ORO.r, ORO.g, ORO.b) end
    local hs = Conv.altoFuente(UIFont.Small) + 1
    local titulo = tostring(it.titulo)
    self:drawText(titulo, 10, 6, ORO.r, ORO.g, ORO.b, 1, UIFont.Small)
    for i, l in ipairs(self.lineas) do
        self:drawText(l, 10, 8 + hs + (i - 1) * hs, TEXTO.r, TEXTO.g, TEXTO.b, 0.95, UIFont.Small)
    end
    if self:isMouseOver() then
        self:drawText("x", self.width - 13, 2, GRIS.r, GRIS.g, GRIS.b, 1, UIFont.Small)
    end
end

function Conv.guardarPosicion(x, y)
    pcall(function()
        local f = getFileWriter(Conv.ARCHIVO_POS, true, false)
        if f == nil then return end
        f:write(tostring(floor(x)) .. "," .. tostring(floor(y)))
        f:close()
    end)
end

function Conv.leerPosicion()
    local x, y
    pcall(function()
        local f = getFileReader(Conv.ARCHIVO_POS, false)
        if f == nil then return end
        local linea = f:readLine()
        f:close()
        if linea ~= nil then
            local a, b = string.match(linea, "^(%-?%d+),(%-?%d+)")
            x, y = tonumber(a), tonumber(b)
        end
    end)
    return x, y
end

function Conv.crearRastreador()
    if Conv.rastreador ~= nil then return end
    Conv.leerSeguir()
    local x, y = Conv.leerPosicion()
    local sw, sh = getCore():getScreenWidth(), getCore():getScreenHeight()
    if x == nil then x, y = 70, 14 end
    x = math.max(0, math.min(x, sw - Conv.RASTREADOR_W))
    y = math.max(0, math.min(y, sh - 40))
    local r = NarradorRastreador:new(x, y)
    r:initialise()
    r:addToUIManager()
    r:setAlwaysOnTop(false)
    Conv.rastreador = r
    r:refrescar()
end

-- ---------------------------------------------------------------------------
-- Enganches: mensajes del servidor y menu de clic derecho
-- ---------------------------------------------------------------------------

function Conv.engancharRecibir()
    if Cliente == nil or Cliente._conversacion then return end
    Cliente._conversacion = true
    local original = Cliente.recibir
    Cliente.recibir = function(comando, datos)
        datos = datos or {}
        local v = Conv.ventana
        -- Con la ventana abierta, las respuestas del narrador van a la conversacion y no al cartel.
        if comando == "respuesta" and v ~= nil then
            pcall(v.recibido, v, comando, datos)
            return
        end
        original(comando, datos)
        if v ~= nil and Conv.ventana == v then
            local ok, err = pcall(v.recibido, v, comando, datos)
            if not ok then print("[Narrador] conversacion: " .. tostring(err)) end
        end
        if comando == "estado" and Conv.rastreador ~= nil then pcall(Conv.rastreador.refrescar, Conv.rastreador) end
    end
end

-- Estado sin las opciones ni los misioneros: el menu de antes queda solo con "Narrador"
-- (diario y admin), porque lo demas ahora va por la ventana.
function Conv.estadoSoloMenu(estado)
    local copia = {}
    for k, v in pairs(estado) do copia[k] = v end
    copia.arcos = {}
    for _, a in ipairs(estado.arcos or {}) do
        local b = {}
        for k, v in pairs(a) do b[k] = v end
        b.opciones = {}
        b.ax = nil -- sin ancla: el menu de antes no busca a nadie cerca
        copia.arcos[#copia.arcos + 1] = b
    end
    copia.contactos = {}
    return copia
end

Conv.menuOriginal = Conv.menuOriginal or (Cliente ~= nil and Cliente.menu or nil)
Conv.menuFavores = Conv.menuFavores or (Narrador.Mapas ~= nil and Narrador.Mapas.menu or nil)

function Conv.menuNuevo(numJugador, context, worldobjects, test)
    local jugador = getSpecificPlayer(numJugador)
    local estado = Conv.estado()
    if jugador == nil or estado == nil then
        if Conv.menuOriginal ~= nil then Conv.menuOriginal(numJugador, context, worldobjects, test) end
        return
    end
    local cerca = Conv.cuerposCerca(jugador, Conv.DIST_HABLAR + 1)
    local objetivos = Conv.objetivos(estado, cerca, jugador:getX(), jugador:getY())
    for _, o in ipairs(objetivos) do
        local obj = o
        context:addOption(Conv.textoMenu(obj), nil, function() Conv.abrir(obj) end)
    end
    -- El submenu "Narrador" (diario y admin) lo arma el menu de antes, sin las opciones.
    local real = Cliente.estado
    Cliente.estado = Conv.estadoSoloMenu(estado)
    local ok, err = pcall(Conv.menuOriginal, numJugador, context, worldobjects, test)
    Cliente.estado = real
    if not ok then print("[Narrador] menu: " .. tostring(err)) end
    local puesto = false
    pcall(function()
        local raiz = context:getOptionFromName("Narrador")
        local sub = raiz ~= nil and raiz.subOption ~= nil and context:getSubMenu(raiz.subOption) or nil
        if sub ~= nil then
            sub:addOption("Misiones", nil, Conv.abrirMisiones)
            puesto = true
        end
    end)
    if not puesto then context:addOption("Narrador: misiones", nil, Conv.abrirMisiones) end
end

function Conv.menu(numJugador, context, worldobjects, test)
    if test then return end
    local ok, err = pcall(Conv.menuNuevo, numJugador, context, worldobjects, test)
    if not ok then
        -- Si algo falla, el menu de siempre.
        print("[Narrador] conversacion (se usa el menu de antes): " .. tostring(err))
        if Conv.menuOriginal ~= nil then pcall(Conv.menuOriginal, numJugador, context, worldobjects, test) end
        if Conv.menuFavores ~= nil then pcall(Conv.menuFavores, numJugador, context, worldobjects, test) end
    end
end

function Conv.instalarMenu()
    if Conv._menu or Events == nil then return end
    Conv._menu = true
    local ev = Events.OnFillWorldObjectContextMenu
    if Conv.menuOriginal ~= nil then pcall(ev.Remove, Conv.menuOriginal) end
    if Conv.menuFavores ~= nil then pcall(ev.Remove, Conv.menuFavores) end
    ev.Add(Conv.menu)
end

function Conv.alCambiarResolucion()
    if Conv.ventana ~= nil then
        local obj, tab = Conv.ventana.obj, Conv.ventana.tab
        Conv.ventana:cerrar()
        local v = Conv.abrir(obj)
        if tab == "misiones" then v:cambiarTab("misiones") end
    end
    if Conv.rastreador ~= nil then
        local r = Conv.rastreador
        local sw, sh = getCore():getScreenWidth(), getCore():getScreenHeight()
        r:setX(math.max(0, math.min(r:getX(), sw - r.width)))
        r:setY(math.max(0, math.min(r:getY(), sh - r.height)))
    end
end

if not Conv._enganchado then
    Conv._enganchado = true
    Conv.engancharRecibir()
    Conv.instalarMenu()
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(Conv.crearRastreador) end
    if Events.OnResolutionChange ~= nil then Events.OnResolutionChange.Add(Conv.alCambiarResolucion) end
end

return Conv
