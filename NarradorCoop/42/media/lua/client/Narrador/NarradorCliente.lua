-- Narrador Co-op: lado del jugador.
-- Muestra avisos y respuestas, el diario de historias y las opciones de clic derecho
-- cuando estas cerca de un personaje o lugar de una historia.

require "ISUI/ISPanel"
require "ISUI/ISCollapsableWindow"
require "Narrador/NarradorDefs"

Narrador = Narrador or {}
local Cliente = Narrador.Cliente or {}
Narrador.Cliente = Cliente

local MOD = Narrador.Defs.MODULO
Cliente.estado = Cliente.estado or nil

-- ---------------------------------------------------------------------------
-- Envio al servidor (o al motor local si es un jugador)
-- ---------------------------------------------------------------------------

function Cliente.enviar(comando, args)
    local jugador = getPlayer()
    if jugador == nil then return end
    if isClient() then
        sendClientCommand(jugador, MOD, comando, args or {})
    elseif Narrador.Motor ~= nil and Narrador.Motor.alComando ~= nil then
        Narrador.Motor.alComando(MOD, comando, jugador, args or {})
    end
end

-- Mismo criterio que el servidor: faccion del juego o, si no tiene, el jugador.
function Cliente.miGrupo()
    local jugador = getPlayer()
    if jugador == nil then return nil end
    local usuario = tostring(jugador:getUsername())
    if Faction ~= nil and Faction.getPlayerFaction ~= nil then
        local ok, f = pcall(Faction.getPlayerFaction, jugador)
        if not ok or f == nil then ok, f = pcall(Faction.getPlayerFaction, usuario) end
        if ok and f ~= nil then
            local ok2, n = pcall(function() return f:getName() end)
            if ok2 and n ~= nil and n ~= "" then return "faccion:" .. tostring(n) end
        end
    end
    return "jugador:" .. usuario
end

function Cliente.miEncargo()
    local clave = Cliente.miGrupo()
    for _, e in ipairs(Cliente.estado ~= nil and Cliente.estado.encargos or {}) do
        if e.dueno == clave then return e end
    end
    return nil
end

-- Marcas en el mapa del mundo. Si el mapa nunca se abrio, quedan pendientes hasta que se abra.
Cliente.marcasPendientes = Cliente.marcasPendientes or {}

function Cliente.ponerMarcas()
    local instancia = ISWorldMap_instance
    local api = instancia ~= nil and instancia.mapAPI ~= nil and type(instancia.mapAPI.getSymbolsAPI) == "function"
        and instancia.mapAPI:getSymbolsAPI() or nil
    if api == nil or type(api.addUntranslatedText) ~= "function" then return false end
    for _, m in ipairs(Cliente.marcasPendientes) do
        local r = tonumber(m.radio)
        -- Con radio: un circulo de puntos (la zona donde esta el lugar) y el texto arriba.
        if r ~= nil and r > 0 then
            local pasos = 24
            for i = 0, pasos - 1 do
                local ang = (i / pasos) * 2 * math.pi
                pcall(function()
                    local punto = api:addTexture("Circle", m.x + math.cos(ang) * r, m.y + math.sin(ang) * r)
                    punto:setRGBA(0.85, 0.15, 0.15, 1.0)
                    punto:setAnchor(0.5, 0.5)
                end)
            end
        end
        pcall(function()
            local capa = type(api.getDefaultTextLayerID) == "function" and api:getDefaultTextLayerID() or nil
            local simbolo = api:addUntranslatedText(tostring(m.texto), capa, m.x, m.y - (r or 0) - 8)
            simbolo:setRGBA(0.85, 0.15, 0.15, 1.0)
            simbolo:setAnchor(0.5, 0.5)
        end)
    end
    Cliente.marcasPendientes = {}
    return true
end

function Cliente.marcar(datos)
    if datos == nil or tonumber(datos.x) == nil then return end
    Cliente.marcasPendientes[#Cliente.marcasPendientes + 1] = { x = tonumber(datos.x), y = tonumber(datos.y),
        texto = datos.texto, radio = tonumber(datos.radio) }
    if not Cliente.ponerMarcas() then
        Cliente.halo("Zona marcada en el mapa")
    end
end

function Cliente.engancharMapa()
    if ISWorldMap == nil or type(ISWorldMap.ShowWorldMap) ~= "function" or ISWorldMap._narrador then return end
    local original = ISWorldMap.ShowWorldMap
    ISWorldMap.ShowWorldMap = function(...)
        local r = original(...)
        if #Cliente.marcasPendientes > 0 then pcall(Cliente.ponerMarcas) end
        return r
    end
    ISWorldMap._narrador = true
end

function Cliente.esAdmin()
    if not isClient() then return true end
    local jugador = getPlayer()
    if jugador == nil then return false end
    local ok, nivel = pcall(function() return jugador:getAccessLevel() end)
    return ok and string.lower(tostring(nivel or "")) == "admin"
end

-- ---------------------------------------------------------------------------
-- Cartel de mensajes (arriba al centro, se esconde solo)
-- ---------------------------------------------------------------------------

NarradorMensaje = ISPanel:derive("NarradorMensaje")

local function envolver(texto, ancho, fuente)
    local lineas = {}
    local tm = getTextManager()
    for parrafo in string.gmatch(texto .. "\n", "(.-)\n") do
        local linea = ""
        for palabra in string.gmatch(parrafo, "%S+") do
            local prueba = linea == "" and palabra or (linea .. " " .. palabra)
            if tm:MeasureStringX(fuente, prueba) > ancho and linea ~= "" then
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

function NarradorMensaje:new()
    local ancho = math.min(720, getCore():getScreenWidth() - 40)
    local o = ISPanel.new(self, (getCore():getScreenWidth() - ancho) / 2, 70, ancho, 60)
    o.background = true
    o.backgroundColor = { r = 0, g = 0, b = 0, a = 0.65 }
    o.borderColor = { r = 0.8, g = 0.65, b = 0.3, a = 0.8 }
    o.lineas = {}
    o.hasta = 0
    o.color = { r = 1, g = 0.9, b = 0.7 }
    return o
end

function NarradorMensaje:mostrar(texto, segundos, color)
    local fuente = UIFont.Medium
    self.lineas = envolver(texto, self.width - 24, fuente)
    local alto = getTextManager():getFontHeight(fuente)
    self:setHeight(16 + #self.lineas * (alto + 2))
    self.hasta = getTimestampMs() + (segundos or 10) * 1000
    self.color = color or { r = 1, g = 0.9, b = 0.7 }
    self:setVisible(true)
    self:bringToTop()
end

function NarradorMensaje:prerender()
    ISPanel.prerender(self)
    if getTimestampMs() > self.hasta then self:setVisible(false) end
end

function NarradorMensaje:render()
    local alto = getTextManager():getFontHeight(UIFont.Medium)
    for i, linea in ipairs(self.lineas) do
        self:drawText(linea, 12, 8 + (i - 1) * (alto + 2), self.color.r, self.color.g, self.color.b, 1, UIFont.Medium)
    end
end

function NarradorMensaje:onMouseDown()
    self:setVisible(false)
    return true
end

function Cliente.cartel(texto, segundos, color)
    if texto == nil or texto == "" then return end
    if Cliente.panelMensaje == nil then
        Cliente.panelMensaje = NarradorMensaje:new()
        Cliente.panelMensaje:initialise()
        Cliente.panelMensaje:addToUIManager()
    end
    Cliente.panelMensaje:mostrar(texto, segundos, color)
end

function Cliente.halo(texto)
    local jugador = getPlayer()
    if jugador ~= nil and jugador.setHaloNote ~= nil then
        pcall(function() jugador:setHaloNote(texto, 230, 200, 120, 300) end)
    end
end

-- ---------------------------------------------------------------------------
-- Ventana del diario
-- ---------------------------------------------------------------------------

-- Panel de texto con scroll (rueda del mouse).
NarradorTexto = ISPanel:derive("NarradorTexto")

function NarradorTexto:new(x, y, w, h)
    local o = ISPanel.new(self, x, y, w, h)
    o.background = true
    o.backgroundColor = { r = 0, g = 0, b = 0, a = 0.35 }
    o.borderColor = { r = 0.4, g = 0.4, b = 0.4, a = 0.6 }
    o.lineas = {}
    o.scroll = 0
    return o
end

-- bloques: { { t = "texto", color = {r,g,b}, fuente = UIFont.X }, ... }
function NarradorTexto:setBloques(bloques)
    self.lineas = {}
    for _, b in ipairs(bloques) do
        local fuente = b.fuente or UIFont.Small
        local color = b.color or { r = 1, g = 1, b = 1 }
        for _, linea in ipairs(envolver(tostring(b.t or ""), self.width - 28, fuente)) do
            self.lineas[#self.lineas + 1] = { t = linea, color = color, fuente = fuente }
        end
    end
    self:limitarScroll()
end

function NarradorTexto:altoLinea(fuente)
    return getTextManager():getFontHeight(fuente) + 2
end

function NarradorTexto:limitarScroll()
    self.scroll = math.max(0, math.min(self.scroll, math.max(0, #self.lineas - 5)))
end

function NarradorTexto:onMouseWheel(delta)
    self.scroll = self.scroll + (delta > 0 and 3 or -3)
    self:limitarScroll()
    return true
end

function NarradorTexto:render()
    local y = 6
    for i = self.scroll + 1, #self.lineas do
        local l = self.lineas[i]
        local alto = self:altoLinea(l.fuente)
        if y + alto > self.height - 4 then break end
        self:drawText(l.t, 12, y, l.color.r, l.color.g, l.color.b, 1, l.fuente)
        y = y + alto
    end
end

NarradorVentana = ISCollapsableWindow:derive("NarradorVentana")

function NarradorVentana:new(x, y, w, h)
    local o = ISCollapsableWindow.new(self, x, y, w, h)
    o.title = "Diario del narrador"
    o.resizable = false
    return o
end

function NarradorVentana:createChildren()
    ISCollapsableWindow.createChildren(self)
    local th = self:titleBarHeight()
    self.texto = NarradorTexto:new(6, th + 6, self.width - 12, self.height - th - 12)
    self.texto:initialise()
    self:addChild(self.texto)
    self:refrescar()
end

local function horaJuego(h)
    h = tonumber(h) or 0
    return "Dia " .. tostring(math.floor(h / 24) + 1) .. ", " .. string.format("%02d", math.floor(h % 24)) .. ":00"
end

local GRIS = { r = 0.65, g = 0.65, b = 0.65 }
local ORO = { r = 1, g = 0.85, b = 0.5 }
local ROJO = { r = 1, g = 0.5, b = 0.5 }

function NarradorVentana:refrescar()
    if self.texto == nil then return end
    local b = {}
    local estado = Cliente.estado
    if estado == nil then
        b[#b + 1] = { t = "Esperando al servidor..." }
    else
        local activos = 0
        for _, arco in ipairs(estado.arcos or {}) do
            if not arco.terminado then
                activos = activos + 1
                b[#b + 1] = { t = tostring(arco.titulo), fuente = UIFont.Medium }
                if arco.pista ~= nil then b[#b + 1] = { t = arco.pista, color = ORO } end
                for i = #(arco.diario or {}), 1, -1 do
                    local e = arco.diario[i]
                    b[#b + 1] = { t = horaJuego(e.h), color = GRIS }
                    b[#b + 1] = { t = tostring(e.t) }
                end
                b[#b + 1] = { t = " " }
            end
        end
        if activos == 0 then b[#b + 1] = { t = "No hay historias abiertas por ahora." }; b[#b + 1] = { t = " " } end
        local contactos = estado.contactos or {}
        if #contactos > 0 then
            b[#b + 1] = { t = "Contactos", fuente = UIFont.Medium }
            local mio = Cliente.miEncargo()
            for _, c in ipairs(contactos) do
                local suyo = mio ~= nil and mio.contacto == c.id
                local linea = tostring(c.ciudad) .. ": " .. tostring(c.nombre)
                if suyo then linea = linea .. "  (tu grupo tiene un encargo suyo en curso)" end
                b[#b + 1] = { t = linea, color = suyo and ORO or nil }
            end
            b[#b + 1] = { t = "Acercate a ellos y usa clic derecho para pedir trabajo. Un encargo a la vez por faccion.", color = GRIS }
            b[#b + 1] = { t = " " }
        end
        b[#b + 1] = { t = "Registro", fuente = UIFont.Medium }
        local diario = estado.diario or {}
        for i = #diario, math.max(1, #diario - 25), -1 do
            local e = diario[i]
            b[#b + 1] = { t = horaJuego(e.h) .. " - " .. tostring(e.arco), color = GRIS }
            b[#b + 1] = { t = tostring(e.t) }
        end
        if not estado.alife then
            b[#b + 1] = { t = " " }
            b[#b + 1] = { t = "Project A-Life no esta activo: las historias con NPCs no van a aparecer.", color = ROJO }
        end
    end
    self.texto:setBloques(b)
end

function NarradorVentana:close()
    self:setVisible(false)
    self:removeFromUIManager()
    Cliente.ventana = nil
end

-- El diario de vida (ver NarradorDiario.lua). Si por algo no cargo, se abre el registro simple.
function Cliente.abrirDiario()
    if Narrador.Diario ~= nil and Narrador.Diario.abrir ~= nil then
        local ok, err = pcall(Narrador.Diario.abrir)
        if ok then return end
        print("[Narrador] no se pudo abrir el diario: " .. tostring(err))
    end
    Cliente.abrirRegistro()
end

-- Registro en texto plano (la ventana de antes). Util para probar.
function Cliente.abrirRegistro()
    if Cliente.ventana ~= nil then
        Cliente.ventana:refrescar()
        Cliente.ventana:bringToTop()
        return
    end
    local w, h = 560, 520
    local v = NarradorVentana:new((getCore():getScreenWidth() - w) / 2, (getCore():getScreenHeight() - h) / 2, w, h)
    v:initialise()
    v:addToUIManager()
    Cliente.ventana = v
    if Cliente.estado == nil then Cliente.enviar("pedirEstado") end
end

-- ---------------------------------------------------------------------------
-- Mensajes del servidor
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- NPCs de las historias (A-Life)
-- ---------------------------------------------------------------------------

Cliente.npcsPropios = Cliente.npcsPropios or {}

function Cliente.actualizarNpcs()
    local propios = {}
    for _, arco in ipairs(Cliente.estado ~= nil and Cliente.estado.arcos or {}) do
        for _, n in ipairs(arco.npcs or {}) do propios[tostring(n.uid)] = arco.id end
    end
    for _, c in ipairs(Cliente.estado ~= nil and Cliente.estado.contactos or {}) do
        if c.uid ~= nil then propios[tostring(c.uid)] = "contacto:" .. tostring(c.id) end
    end
    for _, uid in ipairs(Cliente.estado ~= nil and Cliente.estado.residentes or {}) do
        propios[tostring(uid)] = "residente"
    end
    Cliente.npcsPropios = propios
end

local function uidDe(cuerpo)
    local speech = ProjectALife ~= nil and ProjectALife.Speech or nil
    if speech == nil or type(speech.variable) ~= "function" then return nil end
    local ok, uid = pcall(speech.variable, cuerpo, "ALifeUID")
    if ok and uid ~= nil and uid ~= "" then return tostring(uid) end
    return nil
end

-- Busca el cuerpo cargado de un NPC de A-Life por su uid (o nil si no esta cerca).
function Cliente.cuerpoDe(uid)
    if uid == nil or getCell == nil then return nil end
    local encontrado
    pcall(function()
        local lista = getCell():getZombieList()
        for i = 0, lista:size() - 1 do
            local cuerpo = lista:get(i)
            if cuerpo ~= nil and not cuerpo:isDead() and uidDe(cuerpo) == tostring(uid) then
                encontrado = cuerpo
                return
            end
        end
    end)
    return encontrado
end

-- Mientras dura la historia, A-Life no ofrece su menu de conversacion para estos NPCs:
-- se habla con ellos desde las opciones del Narrador.
function Cliente.silenciarALife()
    local speech = ProjectALife ~= nil and ProjectALife.Speech or nil
    if speech == nil or type(speech.talkable) ~= "function" or speech._narradorParchado then return end
    local original = speech.talkable
    speech.talkable = function(cuerpo, registro, ahora)
        if type(registro) == "table" and registro.uid ~= nil and Cliente.npcsPropios[tostring(registro.uid)] ~= nil then
            return false, "narrador"
        end
        return original(cuerpo, registro, ahora)
    end
    speech._narradorParchado = true
    -- Y no muestra sus frases propias (saludos, comentarios, charla entre NPCs) para ellos:
    -- los personajes del Narrador solo dicen lo que escribe el Narrador.
    local function esPropio(cuerpo, uid)
        if uid == nil and cuerpo ~= nil then uid = uidDe(cuerpo) end
        return uid ~= nil and Cliente.npcsPropios[tostring(uid)] ~= nil
    end
    if type(speech.display) == "function" then
        local display = speech.display
        speech.display = function(cuerpo, texto, color, kind, uid)
            if not Cliente.hablandoNarrador and esPropio(cuerpo, uid) then return true end
            return display(cuerpo, texto, color, kind, uid)
        end
    end
    if type(speech.sayLine) == "function" then
        local sayLine = speech.sayLine
        speech.sayLine = function(cuerpo, texto, kind)
            if not Cliente.hablandoNarrador and esPropio(cuerpo, nil) then return true end
            return sayLine(cuerpo, texto, kind)
        end
    end
end

-- Un personaje habla: burbuja de A-Life si esta a la vista, si no un cartel (solo si estas cerca).
function Cliente.decir(datos)
    local cuerpo = Cliente.cuerpoDe(datos.uid)
    local burbujas = ProjectALife ~= nil and ProjectALife.SpeechBubbles or nil
    if cuerpo ~= nil and burbujas ~= nil and type(burbujas.show) == "function" then
        local ok, mostrado = pcall(burbujas.show, cuerpo, tostring(datos.texto), nil, "directed", tostring(datos.uid))
        if ok and mostrado then return end
    end
    -- Sin burbuja de A-Life (por ejemplo en primera persona con Project Viewpoint, donde la
    -- burbuja cae fuera de la pantalla): el texto del juego sobre la cabeza del personaje.
    if cuerpo ~= nil then
        local ok = pcall(function() cuerpo:addLineChatElement(tostring(datos.texto), 0.8, 1, 0.8) end)
        if ok then return end
    end
    local jugador = getPlayer()
    if jugador == nil then return end
    if datos.x ~= nil and math.sqrt((jugador:getX() - datos.x) ^ 2 + (jugador:getY() - datos.y) ^ 2) > 30 then return end
    Cliente.cartel(tostring(datos.nombre) .. ": " .. tostring(datos.texto), 10, { r = 0.8, g = 1, b = 0.8 })
end

function Cliente.recibir(comando, datos)
    datos = datos or {}
    if comando == "estado" then
        Cliente.estado = datos
        Cliente.actualizarNpcs()
        if Cliente.ventana ~= nil then Cliente.ventana:refrescar() end
        if Narrador.Diario ~= nil then pcall(Narrador.Diario.refrescar) end
    elseif comando == "decir" then
        Cliente.decir(datos)
    elseif comando == "aviso" then
        Cliente.cartel(datos.texto, 14)
    elseif comando == "diario" then
        if Narrador.Diario ~= nil then pcall(Narrador.Diario.marcarNuevo) end
        Cliente.halo("Anotado en el diario: " .. tostring(datos.arco))
        Cliente.cartel(tostring(datos.texto), 12, { r = 0.85, g = 0.9, b = 1 })
    elseif comando == "respuesta" then
        Cliente.cartel(tostring(datos.texto), 12, { r = 1, g = 1, b = 1 })
    elseif comando == "marcar" then
        Cliente.marcar(datos)
    elseif comando == "ofertas" then
        Cliente.ofertas = datos
    end
    if comando == "estado" then pcall(Cliente.avisarPreguntas, datos) end
end

-- Si una conversacion cercana termina en pregunta, se avisa con un halo (clic derecho para opinar).
Cliente.preguntasVistas = Cliente.preguntasVistas or {}
function Cliente.avisarPreguntas(estado)
    local jugador = getPlayer()
    if jugador == nil then return end
    for _, q in ipairs(estado.preguntas or {}) do
        local clave = tostring(q.conv) .. ":" .. tostring(q.x) .. ":" .. tostring(q.y)
        if not Cliente.preguntasVistas[clave] and math.sqrt((jugador:getX() - q.x) ^ 2 + (jugador:getY() - q.y) ^ 2) <= 20 then
            Cliente.preguntasVistas[clave] = true
            Cliente.halo("Te piden opinion (clic derecho cerca de ellos)")
        end
    end
end

function Cliente.alComandoServidor(modulo, comando, datos)
    if modulo ~= MOD then return end
    Cliente.recibir(comando, datos)
end

-- ---------------------------------------------------------------------------
-- Menu de clic derecho
-- ---------------------------------------------------------------------------

Cliente.NIVELES = {
    { id = "facil", texto = "Facil" },
    { id = "medio", texto = "Medio" },
    { id = "dificil", texto = "Dificil (puede salir un arma chetada)" },
    { id = "ultra", texto = "ULTRA - Louisville (premio legendario)" },
}

local function distancia(jugador, x, y)
    return math.sqrt((jugador:getX() - x) ^ 2 + (jugador:getY() - y) ^ 2)
end

function Cliente.menu(numJugador, context, worldobjects, test)
    if test then return end
    local jugador = getSpecificPlayer(numJugador)
    if jugador == nil then return end
    local estado = Cliente.estado
    if estado == nil then Cliente.enviar("pedirEstado") end

    -- Opciones de historia, directo en el menu, si estas cerca del lugar o de sus personajes.
    for _, arco in ipairs(estado ~= nil and estado.arcos or {}) do
        local cerca = arco.ax ~= nil and distancia(jugador, arco.ax, arco.ay) <= (arco.radio or 8) + 1
        if not cerca and arco.ax ~= nil then
            for _, n in ipairs(arco.npcs or {}) do
                local cuerpo = Cliente.cuerpoDe(n.uid)
                if cuerpo ~= nil and distancia(jugador, cuerpo:getX(), cuerpo:getY()) <= 6 then cerca = true end
            end
        end
        if cerca and #(arco.opciones or {}) > 0 then
            local submenus = {}
            for _, op in ipairs(arco.opciones) do
                local destino = context
                if op.submenu ~= nil then
                    -- Opciones agrupadas (por ejemplo "Conversar"): van en un submenu.
                    if submenus[op.submenu] == nil then
                        local padre = context:addOption("[" .. tostring(arco.titulo) .. "] " .. tostring(op.submenu), nil, nil)
                        submenus[op.submenu] = ISContextMenu:getNew(context)
                        context:addSubMenu(padre, submenus[op.submenu])
                    end
                    destino = submenus[op.submenu]
                end
                local texto = op.submenu ~= nil and tostring(op.texto) or ("[" .. tostring(arco.titulo) .. "] " .. tostring(op.texto))
                destino:addOption(texto, nil, function()
                    Cliente.enviar("elegir", { arco = arco.id, opcion = op.id })
                end)
            end
        end
    end

    -- Contactos: pedir encargos segun dificultad.
    for _, c in ipairs(estado ~= nil and estado.contactos or {}) do
        local cerca = c.x ~= nil and distancia(jugador, c.x, c.y) <= 8
        if not cerca and c.uid ~= nil then
            local cuerpo = Cliente.cuerpoDe(c.uid)
            if cuerpo ~= nil and distancia(jugador, cuerpo:getX(), cuerpo:getY()) <= 6 then cerca = true end
        end
        if cerca then
            if Cliente.miEncargo() ~= nil then
                context:addOption("[" .. tostring(c.nombre) .. "] Tu grupo ya tiene un encargo en curso", nil, function()
                    Cliente.enviar("pedirTrabajo", { contacto = c.id, nivel = "facil" })
                end)
            else
                local op = context:addOption("[" .. tostring(c.nombre) .. "] Pedir encargo", nil, nil)
                local subC = ISContextMenu:getNew(context)
                context:addSubMenu(op, subC)
                for _, n in ipairs(Cliente.NIVELES) do
                    subC:addOption(n.texto, nil, function()
                        Cliente.enviar("pedirTrabajo", { contacto = c.id, nivel = n.id })
                    end)
                end
            end
        end
    end

    local raiz = context:addOption("Narrador", nil, nil)
    local sub = ISContextMenu:getNew(context)
    context:addSubMenu(raiz, sub)
    sub:addOption("Ver diario", nil, Cliente.abrirDiario)

    if not Cliente.esAdmin() or estado == nil then return end
    local admin = sub:addOption("Admin (pruebas)", nil, nil)
    local subAdmin = ISContextMenu:getNew(sub)
    sub:addSubMenu(admin, subAdmin)
    subAdmin:addOption("Lanzar un evento al azar", nil, function() Cliente.enviar("eventoAhora") end)
    subAdmin:addOption("Registro en texto plano", nil, Cliente.abrirRegistro)

    local iniciar = subAdmin:addOption("Iniciar historia", nil, nil)
    local subIniciar = ISContextMenu:getNew(subAdmin)
    subAdmin:addSubMenu(iniciar, subIniciar)
    for _, def in ipairs(estado.defs or {}) do
        subIniciar:addOption(tostring(def.titulo), nil, function() Cliente.enviar("iniciar", { def = def.id }) end)
    end

    for _, arco in ipairs(estado.arcos or {}) do
        local opArco = subAdmin:addOption(tostring(arco.titulo) .. " (" .. tostring(arco.etapa) .. ")", nil, nil)
        local subArco = ISContextMenu:getNew(subAdmin)
        subAdmin:addSubMenu(opArco, subArco)
        subArco:addOption("Ver secretos y coordenadas", nil, function() Cliente.enviar("info", { arco = arco.id }) end)
        local forzar = subArco:addOption("Forzar etapa", nil, nil)
        local subForzar = ISContextMenu:getNew(subArco)
        subArco:addSubMenu(forzar, subForzar)
        for _, etapa in ipairs(arco.etapas or {}) do
            subForzar:addOption(etapa, nil, function() Cliente.enviar("forzarEtapa", { arco = arco.id, etapa = etapa }) end)
        end
        subArco:addOption("Cancelar historia", nil, function() Cliente.enviar("cancelar", { arco = arco.id }) end)
    end
    subAdmin:addOption("Reiniciar narrador (borra todo)", nil, function() Cliente.enviar("reiniciarTodo") end)
end

-- ---------------------------------------------------------------------------
-- Enganches
-- ---------------------------------------------------------------------------

function Cliente.alIniciar()
    Cliente.silenciarALife()
    Cliente.engancharMapa()
    Cliente.enviar("pedirEstado")
end

if not Cliente._enganchado then
    Cliente._enganchado = true
    Events.OnServerCommand.Add(Cliente.alComandoServidor)
    Events.OnFillWorldObjectContextMenu.Add(Cliente.menu)
    Events.OnGameStart.Add(Cliente.alIniciar)
    Cliente.silenciarALife()
    Cliente.engancharMapa()
end

return Cliente
