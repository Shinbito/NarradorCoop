-- Narrador Co-op (cliente): hacia donde ir.
--   * Vista isometrica: una flecha pegada al borde de la pantalla apunta al objetivo, con la
--     distancia abajo. Si el objetivo esta en pantalla, sale un marcador encima.
--   * Primera persona (Project Viewpoint): una brujula arriba con los puntos cardinales y un
--     marcador por objetivo.
--   * Dentro de la zona de un encargo la flecha se apaga (nunca da la X exacta).
-- Objetivos: el encuentro de tu grupo (siempre) y la mision que sigues en el rastreador.
-- Modo (clic derecho -> Narrador -> Indicador): automatico, flecha, brujula, solo mapa o nada.
-- Sin tildes ni enies a proposito.

require "ISUI/ISPanel"
require "Narrador/NarradorDefs"
require "Narrador/NarradorIndicadoresCalc"
require "Narrador/NarradorCliente"

Narrador = Narrador or {}
local Ind = Narrador.Indicadores or {}
Narrador.Indicadores = Ind

local IC = Narrador.IndicadoresCalc
local Cliente = Narrador.Cliente
local floor = math.floor

Ind.ARCHIVO = "NarradorIndicador.txt"
Ind.MODOS = { "auto", "flecha", "brujula", "mapa", "nada" }
Ind.NOMBRES = { auto = "Automatico (flecha o brujula)", flecha = "Siempre flecha", brujula = "Siempre brujula",
    mapa = "Solo el mapa", nada = "Nada" }
Ind.modo = Ind.modo or "auto"
Ind.sigue = Ind.sigue or "camara"
Ind.N_FLECHAS = 16
Ind.texturas = Ind.texturas or {}

-- ---------------------------------------------------------------------------
-- Preferencias
-- ---------------------------------------------------------------------------

function Ind.guardar()
    pcall(function()
        local f = getFileWriter(Ind.ARCHIVO, true, false)
        if f == nil then return end
        f:write("modo=" .. tostring(Ind.modo) .. "\n")
        f:write("sigue=" .. tostring(Ind.sigue or "camara") .. "\n")
        f:close()
    end)
end

function Ind.leer()
    pcall(function()
        local f = getFileReader(Ind.ARCHIVO, false)
        if f == nil then return end
        local linea = f:readLine()
        while linea ~= nil do
            local v = string.match(linea, "^modo=(%a+)")
            if v ~= nil and Ind.NOMBRES[v] ~= nil then Ind.modo = v end
            local s = string.match(linea, "^sigue=(%a+)")
            if s == "camara" or s == "personaje" then Ind.sigue = s end
            linea = f:readLine()
        end
        f:close()
    end)
end

function Ind.cambiarModo(m)
    Ind.modo = m
    Ind.guardar()
    if Cliente ~= nil and Cliente.halo ~= nil then Cliente.halo("Indicador: " .. Ind.NOMBRES[m]) end
end

-- Opcion del servidor: 1 todos, 2 solo mapa, 3 modo dificil (nada en pantalla).
function Ind.permitido()
    local v = 1
    pcall(function()
        if SandboxVars ~= nil and SandboxVars.Narrador ~= nil and SandboxVars.Narrador.Indicadores ~= nil then
            v = tonumber(SandboxVars.Narrador.Indicadores) or 1
        end
    end)
    return v == 1
end

-- ---------------------------------------------------------------------------
-- Project Viewpoint: esta activo? esta en primera persona?
-- ---------------------------------------------------------------------------

function Ind.hayViewpoint()
    if Ind._hayVP ~= nil then return Ind._hayVP end
    local hay = false
    pcall(function()
        local mods = getActivatedMods()
        for i = 0, mods:size() - 1 do
            local id = string.lower(tostring(mods:get(i)))
            if string.find(id, "viewpoint", 1, true) ~= nil then hay = true end
        end
    end)
    Ind._hayVP = hay
    return hay
end

-- Busca una vez alguna tabla global del mod de camara que diga si esta en primera persona.
function Ind.buscarApiVP()
    if Ind._apiVP ~= nil then return Ind._apiVP end
    Ind._apiVP = false
    pcall(function()
        for k, v in pairs(_G) do
            if type(k) == "string" and type(v) == "table" and string.find(string.lower(k), "viewpoint", 1, true) ~= nil then
                Ind._apiVP = v
                return
            end
        end
    end)
    return Ind._apiVP
end

function Ind.primeraPersona()
    if not Ind.hayViewpoint() then return false end
    local api = Ind.buscarApiVP()
    if type(api) ~= "table" then return Ind.vpManual == true end
    local campos = { "isFirstPerson", "IsFirstPerson", "isFPS", "isEnabled", "isActive", "firstPerson", "FirstPerson",
        "enabled", "active", "fps" }
    for _, c in ipairs(campos) do
        local v = api[c]
        if type(v) == "function" then
            local ok, r = pcall(v)
            if ok and type(r) == "boolean" then return r end
            ok, r = pcall(v, api)
            if ok and type(r) == "boolean" then return r end
        elseif type(v) == "boolean" then
            return v
        end
    end
    return Ind.vpManual == true
end

function Ind.modoActual()
    if not Ind.permitido() then return "nada" end
    local m = Ind.modo
    if m == "auto" then return Ind.primeraPersona() and "brujula" or "flecha" end
    if m == "mapa" then return "nada" end
    return m
end

-- ---------------------------------------------------------------------------
-- Objetivos y geometria
-- ---------------------------------------------------------------------------

function Ind.objetivos()
    local estado = Cliente ~= nil and Cliente.estado or nil
    local seguida
    local Conv = Narrador.Conversacion
    if Conv ~= nil and Conv.misionSeguida ~= nil then
        local ok, it = pcall(Conv.misionSeguida, estado, Cliente.miGrupo())
        if ok and it ~= nil then seguida = it.id end
    end
    return IC.objetivos(estado, seguida, Cliente.miGrupo())
end

-- Pantalla de un punto del mundo (o nil).
function Ind.aPantalla(num, x, y, z)
    local sx, sy
    local ok = pcall(function()
        sx = isoToScreenX(num, x, y, z or 0)
        sy = isoToScreenY(num, x, y, z or 0)
    end)
    if ok and sx ~= nil then return sx, sy end
    ok = pcall(function()
        local zoom = getCore():getZoom(num)
        sx = (IsoUtils.XToScreen(x, y, z or 0, 0) - IsoCamera.getOffX()) / zoom
        sy = (IsoUtils.YToScreen(x, y, z or 0, 0) - IsoCamera.getOffY()) / zoom
    end)
    if ok and sx ~= nil then return sx, sy end
    return nil
end

function Ind.textura(i)
    if Ind.texturas[i] == nil then
        Ind.texturas[i] = getTexture(string.format("media/ui/Narrador/Flecha_%02d.png", i)) or false
    end
    return Ind.texturas[i] or nil
end

-- ---------------------------------------------------------------------------
-- Flecha (un panel chico que se mueve al borde de la pantalla)
-- ---------------------------------------------------------------------------

NarradorFlecha = ISPanel:derive("NarradorFlecha")

function NarradorFlecha:new(slot)
    local o = ISPanel.new(self, 0, 0, 120, 74)
    o.background = false
    o.slot = slot
    o.obj = nil
    return o
end

function NarradorFlecha:onMouseDown() return false end
function NarradorFlecha:onMouseUp() return false end

-- Ojo: un panel invisible no recibe prerender/render, asi que la posicion y la visibilidad
-- se calculan desde el tick (Ind.actualizarPaneles), no desde prerender.
function NarradorFlecha:actualizar()
    local jugador = getPlayer()
    local obj = Ind.actuales ~= nil and Ind.actuales[self.slot] or nil
    if jugador == nil or obj == nil or Ind.modoActual() ~= "flecha" then
        self.obj = nil
        self:setVisible(false)
        return
    end
    local px, py, pz = jugador:getX(), jugador:getY(), jugador:getZ()
    local dist, dentro = IC.distancia(obj, px, py)
    self.obj, self.dist = obj, dist
    self.dentro = dentro
    local sw, sh = getCore():getScreenWidth(), getCore():getScreenHeight()
    local num = jugador:getPlayerNum()
    local jx, jy = Ind.aPantalla(num, px, py, pz)
    local tx, ty = Ind.aPantalla(num, obj.x, obj.y, obj.exacto and (obj.z or 0) or 0)
    local angulo
    if jx ~= nil and tx ~= nil then angulo = math.atan2(ty - jy, tx - jx) else angulo = IC.anguloIso(obj.x - px, obj.y - py) end
    self.angulo = angulo
    local margen = 56
    local enPantalla = tx ~= nil and tx > margen and tx < sw - margen and ty > margen and ty < sh - margen
    local cx, cy
    if self.dentro then
        cx, cy = sw / 2, 120 + (self.slot - 1) * 40
    elseif enPantalla then
        cx, cy = tx, ty - 40
        self.angulo = math.pi / 2
    else
        local ox, oy = jx or sw / 2, jy or sh / 2
        -- Abajo se deja espacio para la barra de objetos.
        cx, cy = IC.alBorde(ox, oy, angulo, margen, margen + 20, sw - margen, sh - margen - 70)
    end
    self:setX(floor(cx - self.width / 2))
    self:setY(floor(cy - 24))
    self:setVisible(true)
end

function NarradorFlecha:render()
    local obj = self.obj
    if obj == nil then return end
    local color, parpadea = IC.color(self.dist, obj.peligro)
    local alfa = 1
    if parpadea then alfa = 0.55 + 0.45 * math.sin((getTimestampMs and getTimestampMs() or 0) / 140) end
    local cx = self.width / 2
    if self.dentro then
        local aviso = IC.textoLlegada(obj) .. ": " .. tostring(obj.titulo or "")
        self:drawText(aviso, cx - getTextManager():MeasureStringX(UIFont.Small, aviso) / 2,
            8, 0.4, 0.95, 0.45, 1, UIFont.Small)
        return
    end
    local tex = Ind.textura(IC.indiceFlecha(self.angulo, Ind.N_FLECHAS))
    if tex ~= nil then
        self:drawTextureScaled(tex, cx - 20, 4, 40, 40, alfa, color.r, color.g, color.b)
    else
        self:drawText(">", cx - 4, 10, color.r, color.g, color.b, alfa, UIFont.Large)
    end
    local t = IC.textoDistancia(self.dist)
    self:drawTextCentre(t, cx, 46, color.r, color.g, color.b, alfa, UIFont.Small)
    local titulo = tostring(obj.titulo or "")
    if string.len(titulo) > 22 then titulo = string.sub(titulo, 1, 21) .. "." end
    self:drawTextCentre(titulo, cx, 60, 0.9, 0.88, 0.8, 0.85, UIFont.Small)
end

-- ---------------------------------------------------------------------------
-- Brujula (arriba al centro)
-- ---------------------------------------------------------------------------

NarradorBrujula = ISPanel:derive("NarradorBrujula")

function NarradorBrujula:new()
    local w = 520
    local o = ISPanel.new(self, floor((getCore():getScreenWidth() - w) / 2), 4, w, 46)
    o.background = false
    return o
end

function NarradorBrujula:onMouseDown() return false end
function NarradorBrujula:onMouseUp() return false end

-- Hacia donde mira la camara de Project Viewpoint (rumbo del mundo en radianes, o nil si el
-- mod no lo dice). Se prueban los nombres tipicos de "yaw" en su tabla global y en sus
-- subtablas de camara. Si viene en grados (mas de una vuelta) se pasa a radianes.
Ind.CAMPOS_YAW = { "getCameraYaw", "getYaw", "getCamYaw", "getHeading", "getCameraAngle", "getLookAngle",
    "getRotation", "cameraYaw", "camYaw", "yaw", "heading", "cameraAngle", "lookAngle" }

local function leerNumero(t, campo)
    local v = t[campo]
    if type(v) == "number" then return v end
    if type(v) == "function" then
        local ok, r = pcall(v)
        if ok and type(r) == "number" then return r end
        ok, r = pcall(v, t)
        if ok and type(r) == "number" then return r end
    end
    return nil
end

function Ind.yawCamara()
    local api = Ind.buscarApiVP()
    if type(api) ~= "table" then return nil end
    local tablas = { api }
    for _, sub in ipairs({ "Camera", "camera", "Cam", "cam", "FirstPerson", "firstPerson" }) do
        if type(api[sub]) == "table" then tablas[#tablas + 1] = api[sub] end
    end
    for _, t in ipairs(tablas) do
        for _, campo in ipairs(Ind.CAMPOS_YAW) do
            local v = leerNumero(t, campo)
            if v ~= nil then
                if math.abs(v) > 2 * math.pi + 0.1 then v = math.rad(v) end
                return v + (Ind.ajusteCamara or 0)
            end
        end
    end
    return nil
end

-- La brujula sigue a la camara (si se sabe hacia donde mira) o al personaje.
function Ind.mirada(jugador)
    if Ind.sigue ~= "personaje" then
        local yaw = Ind.yawCamara()
        if yaw ~= nil then return yaw end
    end
    return Ind.miradaPersonaje(jugador)
end

-- Lista en la consola (console.txt) lo que expone Project Viewpoint, para saber de donde
-- sacar la direccion de la camara si la brujula no la encuentra sola.
function Ind.diagnostico()
    local jugador = getPlayer()
    print("[Narrador] brujula: viewpoint=" .. tostring(Ind.hayViewpoint()) .. " primeraPersona=" .. tostring(Ind.primeraPersona())
        .. " yawCamara=" .. tostring(Ind.yawCamara()) .. " personaje=" .. tostring(jugador and Ind.miradaPersonaje(jugador)))
    for k, v in pairs(_G) do
        local n = type(k) == "string" and string.lower(k) or ""
        if (string.find(n, "viewpoint", 1, true) or string.find(n, "camera", 1, true)) then
            print("[Narrador] global " .. tostring(k) .. " (" .. type(v) .. ")")
            if type(v) == "table" then
                for k2, v2 in pairs(v) do print("[Narrador]   ." .. tostring(k2) .. " = " .. type(v2) .. " " .. tostring(v2)) end
            end
        end
    end
    if Cliente ~= nil and Cliente.halo ~= nil then Cliente.halo("Brujula: datos en console.txt") end
end

function Ind.miradaPersonaje(jugador)
    local ang
    pcall(function()
        local v = jugador:getForwardDirection()
        ang = math.atan2(v:getY(), v:getX())
    end)
    if ang == nil then
        pcall(function() ang = math.rad(jugador:getDirectionAngle()) end)
    end
    return ang or 0
end

function NarradorBrujula:actualizar()
    local visible = Ind.modoActual() == "brujula" and getPlayer() ~= nil
    self:setVisible(visible)
    if visible then self:setX(floor((getCore():getScreenWidth() - self.width) / 2)) end
end

function NarradorBrujula:render()
    local jugador = getPlayer()
    if jugador == nil then return end
    local w = self.width
    self:drawRect(0, 0, w, 24, 0.5, 0, 0, 0)
    self:drawRectBorder(0, 0, w, 24, 0.6, 0.8, 0.65, 0.3)
    local mirada = Ind.mirada(jugador)
    for _, c in ipairs(IC.CARDINALES) do
        local pos = IC.enBrujula(c[2], mirada)
        if pos ~= nil then
            local x = pos * w
            local grande = string.len(c[1]) == 1
            self:drawTextCentre(c[1], x, grande and 3 or 5, 1, 1, 1, grande and 0.95 or 0.6, grande and UIFont.Medium or UIFont.Small)
        end
    end
    self:drawRect(w / 2 - 1, 0, 2, 24, 0.5, 1, 1, 1)
    local px, py = jugador:getX(), jugador:getY()
    for i, obj in ipairs(Ind.actuales or {}) do
        local dist, dentro = IC.distancia(obj, px, py)
        local color, parpadea = IC.color(dist, obj.peligro)
        local alfa = parpadea and (0.55 + 0.45 * math.sin((getTimestampMs and getTimestampMs() or 0) / 140)) or 1
        if dentro then
            self:drawTextCentre(IC.textoLlegada(obj), w / 2, 26 + (i - 1) * 10, 0.4, 0.95, 0.45, 1, UIFont.Small)
        else
            local pos, lado = IC.enBrujula(IC.rumbo(px, py, obj.x, obj.y), mirada)
            local x = pos ~= nil and pos * w or (lado < 0 and 8 or w - 8)
            self:drawRect(x - 4, 15, 8, 8, alfa, color.r, color.g, color.b)
            local t = IC.textoDistancia(dist) .. (pos == nil and (lado < 0 and " <" or " >") or "")
            self:drawTextCentre(t, math.max(30, math.min(w - 30, x)), 26, color.r, color.g, color.b, alfa, UIFont.Small)
        end
    end
end

-- ---------------------------------------------------------------------------
-- Ciclo
-- ---------------------------------------------------------------------------

Ind.ultimaBusqueda = 0

function Ind.actualizarPaneles()
    for _, f in ipairs(Ind.flechas or {}) do pcall(f.actualizar, f) end
    if Ind.brujula ~= nil then pcall(Ind.brujula.actualizar, Ind.brujula) end
end

function Ind.alTick()
    if not Ind._creado then pcall(Ind.crear) end
    local ahora = getTimestampMs ~= nil and getTimestampMs() or 0
    if ahora - Ind.ultimaBusqueda >= 500 then
        Ind.ultimaBusqueda = ahora
        local ok, lista = pcall(Ind.objetivos)
        Ind.actuales = ok and lista or {}
    end
    Ind.actualizarPaneles()
end

function Ind.crear()
    if Ind._creado then return end
    if getPlayer == nil or getPlayer() == nil then return end
    Ind._creado = true
    Ind.leer()
    Ind.flechas = {}
    for i = 1, 2 do
        local f = NarradorFlecha:new(i)
        f:initialise()
        f:addToUIManager()
        f:setAlwaysOnTop(false)
        f:setVisible(false)
        -- Que no se coma los clics del mundo ni de la barra.
        pcall(function() f.javaObject:setConsumeMouseEvents(false) end)
        Ind.flechas[i] = f
    end
    local b = NarradorBrujula:new()
    b:initialise()
    b:addToUIManager()
    b:setVisible(false)
    pcall(function() b.javaObject:setConsumeMouseEvents(false) end)
    Ind.brujula = b
end

-- Menu: elegir el modo (y, para admins, pruebas de la 0.7).
function Ind.menu(numJugador, context, worldobjects, test)
    if test then return end
    local raiz = context:getOptionFromName("Narrador")
    local sub = raiz ~= nil and raiz.subOption ~= nil and context:getSubMenu(raiz.subOption) or nil
    local destino = sub or context
    local op = destino:addOption("Indicador: " .. Ind.NOMBRES[Ind.modo], nil, nil)
    local subM = ISContextMenu:getNew(destino)
    destino:addSubMenu(op, subM)
    for _, m in ipairs(Ind.MODOS) do
        subM:addOption((m == Ind.modo and "> " or "") .. Ind.NOMBRES[m], nil, function() Ind.cambiarModo(m) end)
    end
    if Cliente ~= nil and Cliente.esAdmin ~= nil and Cliente.esAdmin() then Ind.menuAdmin(destino) end
    if Ind.hayViewpoint() then
        subM:addOption(Ind.vpManual and "Estoy en primera persona: si" or "Estoy en primera persona: no", nil, function()
            Ind.vpManual = not Ind.vpManual
        end)
        local camara = Ind.sigue ~= "personaje"
        subM:addOption(camara and "La brujula sigue a: la camara" or "La brujula sigue a: el personaje", nil, function()
            Ind.sigue = camara and "personaje" or "camara"
            Ind.guardar()
            if camara == true or Ind.yawCamara() ~= nil then return end
            if Cliente ~= nil and Cliente.halo ~= nil then
                Cliente.halo("No encuentro la camara de Viewpoint: la brujula sigue al personaje")
            end
        end)
        subM:addOption("Diagnostico de la brujula (console.txt)", nil, Ind.diagnostico)
    end
end

-- Pruebas de la 0.7 para admins: encuentros, encargos generados, confianza y conversaciones.
function Ind.menuAdmin(destino)
    local raiz = destino:addOption("Pruebas del narrador (admin)", nil, nil)
    local sub = ISContextMenu:getNew(destino)
    destino:addSubMenu(raiz, sub)
    sub:addOption("Encuentro de exploracion ahora", nil, function() Cliente.enviar("encuentroAhora", {}) end)
    sub:addOption("Ocupar el lugar emblematico (donde estoy o el mas cercano)", nil, function() Cliente.enviar("ocupacionAhora", {}) end)
    sub:addOption("Estado de los lugares emblematicos", nil, function() Cliente.enviar("ocupacionesEstado", {}) end)
    local enc = sub:addOption("Encuentro de un tipo", nil, nil)
    local subEnc = ISContextMenu:getNew(sub)
    sub:addSubMenu(enc, subEnc)
    for id in pairs(Narrador.EncuentrosTipos or {}) do
        subEnc:addOption(id, nil, function() Cliente.enviar("encuentroAhora", { tipo = id }) end)
    end
    local gen = sub:addOption("Encargo generado (misionero mas cercano)", nil, nil)
    local subGen = ISContextMenu:getNew(sub)
    sub:addSubMenu(gen, subGen)
    for _, t in ipairs({ "buscar", "recuerdo", "recolectar", "entregar", "rescate", "investigar", "alijo", "contrarreloj",
                         "limpieza", "reconocimiento", "defensa", "posta", "instalar" }) do
        subGen:addOption(t, nil, function() Cliente.enviar("encargoGenerado", { tipo = t, nivel = "medio" }) end)
    end
    local rep = sub:addOption("+20 de confianza con...", nil, nil)
    local subRep = ISContextMenu:getNew(sub)
    sub:addSubMenu(rep, subRep)
    for _, c in ipairs({ { "muldraugh", "Cabo Ramiro" }, { "westpoint", "Tia Chela" }, { "riverside", "Padre Nacho" }, { "rosewood", "Misia Rosa" } }) do
        subRep:addOption(c[2], nil, function() Cliente.enviar("repSumar", { contacto = c[1], cantidad = 20 }) end)
    end
    sub:addOption("Estado del narrador (tension, rumores, fama)", nil, function() Cliente.enviar("estadoNarrador", {}) end)
    sub:addOption("Acompanante: el NPC mas cercano me sigue (probar el auto)", nil, function() Cliente.enviar("acompananteAhora", {}) end)
    sub:addOption("Soltar a los acompanantes", nil, function() Cliente.enviar("soltarAcompanantes", {}) end)
    local am = sub:addOption("Amenaza ahora", nil, nil)
    local subAm = ISContextMenu:getNew(sub)
    sub:addSubMenu(am, subAm)
    for _, t in ipairs({ "horda", "bandidos", "corredores", "mixta" }) do
        subAm:addOption(t, nil, function() Cliente.enviar("amenazaAhora", { tipo = t }) end)
    end
    sub:addOption("Sembrar rumor de una historia", nil, function() Cliente.enviar("rumorAhora", {}) end)
    sub:addOption("Sembrar rumor falso", nil, function() Cliente.enviar("rumorFalso", {}) end)
    sub:addOption("Adelantar un eco pendiente", nil, function() Cliente.enviar("ecoAhora", {}) end)
    sub:addOption("Mision de la cura disponible ya", nil, function() Cliente.enviar("curaDisponible", {}) end)
    local fe = sub:addOption("Evento de fecha ahora", nil, nil)
    local subFe = ISContextMenu:getNew(sub)
    sub:addSubMenu(fe, subFe)
    for _, f in ipairs({ { "fonda", "La fonda de Sous" }, { "amigo", "Amigo secreto" }, { "brujas", "Noche de brujas" },
                         { "fin", "Ultima noche del 93" }, { "luz", "Corte de luz" } }) do
        subFe:addOption(f[2], nil, function() Cliente.enviar("fechaAhora", { evento = f[1] }) end)
    end
    local te = sub:addOption("Tension del narrador", nil, nil)
    local subTe = ISContextMenu:getNew(sub)
    sub:addSubMenu(te, subTe)
    for _, v in ipairs({ 0, 50, 90 }) do subTe:addOption(tostring(v), nil, function() Cliente.enviar("tension", { valor = v }) end) end
    local cv = sub:addOption("Conversacion ahora (si estan cerca)", nil, nil)
    local subCv = ISContextMenu:getNew(sub)
    sub:addSubMenu(cv, subCv)
    for _, c in ipairs(Narrador.Conversas ~= nil and Narrador.Conversas.todas() or {}) do
        subCv:addOption(c.id, nil, function() Cliente.enviar("conversaAhora", { id = c.id }) end)
    end
end

if not Ind._enganchado and Events ~= nil then
    Ind._enganchado = true
    Events.OnGameStart.Add(Ind.crear)
    Events.OnTick.Add(Ind.alTick)
    Events.OnFillWorldObjectContextMenu.Add(Ind.menu)
end

return Ind
