-- Narrador Co-op (servidor): la base de Sous viva.
-- Cuando Sous esta en su base y es amigo (los grupos "npcs" de la historia de Sous con
-- lugar = base_sous y postura friendly, y despues los residentes "sous" con Sous aliado):
--   * Se amuebla la base UNA vez (memoria sous_base), con alguien cerca y la zona cargada: mesas
--     con una baraja, una silla por integrante, sacos de dormir, un generador funcionando (afuera,
--     pegado al edificio, el estanque se rellena solo cada tanto) y bidones de agua.
--   * Cada integrante queda con su silla como puesto de guardia de A-Life (stance "garrison",
--     garrisonPost = la silla, stanceRole = "sit"): A-Life camina hasta ahi y lo sienta
--     (ALifeModuleStances garrison -> ALifeModuleIdleLife.seatPost/sitPose).
--   * Sentados a la mesa hablan de cartas (Narrador.Charlas.sous_cartas).
-- Datos (sprites, items, frases) en shared/Narrador/NarradorSousBaseDefs.lua.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorSousBaseDefs"

local Mundo, Motor, D = Narrador.Mundo, Narrador.Motor, Narrador.SousBaseDefs
local floor = math.floor

local SB = Narrador.SousBase or {}
Narrador.SousBase = SB

SB.CORREA = 12
SB.charla = SB.charla or {}       -- ritmo de las frases de cartas (no se guarda)
SB.reintento = SB.reintento or nil -- hora del proximo intento de amueblar si fallo

-- ---------------------------------------------------------------------------
-- Quienes estan en la base y donde queda
-- ---------------------------------------------------------------------------

local function esGrupoBase(g)
    local a = g ~= nil and g.accion or nil
    return type(a) == "table" and a[1] == "npcs" and a.lugar == "base_sous" and a.postura == "friendly"
        and not a.hostiles and g.estado == "listo"
end

-- Instancia activa de la historia de Sous (sin final) o nil.
function SB.arcoActivo()
    local st = Motor.estado()
    for _, id in ipairs(st.orden or {}) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.def == "sous" and inst.final == nil then return inst end
    end
    return nil
end

-- Lugar de la base: el de la historia activa o el guardado al quedar aliados.
function SB.lugar()
    local inst = SB.arcoActivo()
    local l = inst ~= nil and inst.lugares ~= nil and inst.lugares.base_sous or nil
    if type(l) ~= "table" then l = Motor.estado().memoria["lugar.base_sous"] end
    if type(l) ~= "table" or tonumber(l.x) == nil or tonumber(l.y) == nil then return nil end
    return { x = floor(l.x), y = floor(l.y), z = floor(tonumber(l.z) or 0) }
end

-- Los amigos en la base: lista { uid, rol, nombre } sin repetir.
function SB.amigos()
    local st = Motor.estado()
    local lista, visto = {}, {}
    local function sumar(uid, rol, nombre)
        local k = tostring(uid)
        if visto[k] then return end
        visto[k] = true
        lista[#lista + 1] = { uid, rol, nombre or rol }
    end
    local inst = SB.arcoActivo()
    if inst ~= nil then
        for _, g in pairs(inst.grupos or {}) do
            if esGrupoBase(g) then
                for uid, m in pairs(g.miembros or {}) do
                    if m.vivo then sumar(uid, m.rol, m.nombre) end
                end
            end
        end
    end
    local r = st.residentes ~= nil and st.residentes.sous or nil
    if r ~= nil and st.memoria.sous == "aliados" then
        for uid, m in pairs(r.miembros or {}) do
            if not m.muerto then sumar(uid, m.rol, m.nombre) end
        end
    end
    table.sort(lista, function(a, b)
        if tostring(a[2]) ~= tostring(b[2]) then return tostring(a[2]) < tostring(b[2]) end
        return tostring(a[1]) < tostring(b[1])
    end)
    return lista
end

-- Partidas de antes: la correa vieja (35) en los grupos y residentes guardados.
function SB.correaCorta()
    local st = Motor.estado()
    local inst = SB.arcoActivo()
    if inst ~= nil then
        for _, g in pairs(inst.grupos or {}) do
            local a = g.accion
            if type(a) == "table" and a[1] == "npcs" and a.lugar == "base_sous" and a.postura == "friendly" then
                if (tonumber(a.correa) or 0) > SB.CORREA then a.correa = SB.CORREA end
                if a.modo == "patrol" then a.modo = "guard" end
            end
        end
    end
    local r = st.residentes ~= nil and st.residentes.sous or nil
    if r ~= nil and type(r.banderas) == "table" and (tonumber(r.banderas.leashRadius) or 0) > SB.CORREA then
        r.banderas.leashRadius = SB.CORREA
    end
end

-- ---------------------------------------------------------------------------
-- Casillas
-- ---------------------------------------------------------------------------

local SUELO = { "floors_", "blends_", "overlay_", "e_newgrass", "d_floorleaves", "d_streetcracks", "street_" }

local function nombreSprite(o)
    local ok, n = pcall(function() return o:getSprite():getName() end)
    return ok and n or nil
end

local function esSuelo(nombre)
    if type(nombre) ~= "string" then return true end
    for _, p in ipairs(SUELO) do
        if string.sub(nombre, 1, #p) == p then return true end
    end
    return false
end

-- Casilla sin nada encima (solo piso), sin nadie parado y caminable.
function SB.vacia(sq)
    if sq == nil then return false end
    local ok, res = pcall(function()
        if not sq:isFree(false) then return false end
        if sq:getFloor() == nil then return false end
        local objs = sq:getObjects()
        for i = 0, objs:size() - 1 do
            local o = objs:get(i)
            if o ~= sq:getFloor() and not esSuelo(nombreSprite(o)) then return false end
        end
        return true
    end)
    return ok and res == true
end

local function edificio(sq)
    if sq == nil then return nil end
    local ok, b = pcall(function() return sq:getBuilding() end)
    return ok and b or nil
end

local function adentro(sq, b)
    if sq == nil or b == nil then return false end
    local ok, res = pcall(function() return sq:getBuilding() == b and sq:getRoom() ~= nil end)
    return ok and res == true
end

local function libre(sq)
    local ok, res = pcall(function() return sq:isFree(false) end)
    return ok and res == true
end

local function clave(x, y) return x .. ":" .. y end

-- El edificio de la base: el del punto o el mas cercano a 6 casillas.
function SB.edificioBase(l)
    local b = edificio(Mundo.cargado(l.x, l.y, l.z))
    if b ~= nil then return b end
    for r = 1, 6 do
        for dx = -r, r do
            for dy = -r, r do
                if math.max(math.abs(dx), math.abs(dy)) == r then
                    b = edificio(Mundo.cargado(l.x + dx, l.y + dy, l.z))
                    if b ~= nil then return b end
                end
            end
        end
    end
    return nil
end

-- Casillas a la redonda ordenadas por distancia (anillos).
local function anillos(cx, cy, desde, hasta, f)
    for r = desde, hasta do
        for dx = -r, r do
            for dy = -r, r do
                if math.max(math.abs(dx), math.abs(dy)) == r then
                    local res = f(cx + dx, cy + dy)
                    if res ~= nil then return res end
                end
            end
        end
    end
    return nil
end

-- Una mesa con su ronda de sillas en (tx,ty): nucleo 4x3 vacio y borde caminable.
local function cabeMesa(tx, ty, z, b, usadas)
    for x = tx - 2, tx + 3 do
        for y = ty - 2, ty + 2 do
            if usadas[clave(x, y)] then return false end
            local sq = Mundo.cargado(x, y, z)
            if sq == nil or not adentro(sq, b) then return false end
            local nucleo = x >= tx - 1 and x <= tx + 2 and y >= ty - 1 and y <= ty + 1
            if nucleo then
                if not SB.vacia(sq) then return false end
            elseif not libre(sq) then
                return false
            end
        end
    end
    return true
end

local function marcar(usadas, x1, y1, x2, y2)
    for x = x1, x2 do for y = y1, y2 do usadas[clave(x, y)] = true end end
end

-- Arma el plan completo (nada se pone si falta algo de lo principal). nil, motivo si no cabe.
function SB.planear(l, n)
    local b = SB.edificioBase(l)
    if b == nil then return nil, "sin edificio" end
    local z = l.z
    local usadas = {}
    local plan = { mesas = {}, sillas = {}, sacos = {}, z = z }
    local faltan = n
    while faltan > 0 do
        local mesa = anillos(l.x, l.y, 0, D.RADIO_MESA, function(x, y)
            if cabeMesa(x, y, z, b, usadas) then return { x = x, y = y } end
        end)
        if mesa == nil then break end
        marcar(usadas, mesa.x - 2, mesa.y - 2, mesa.x + 3, mesa.y + 2)
        plan.mesas[#plan.mesas + 1] = mesa
        for i = 1, math.min(#D.PUESTOS, faltan) do
            local p = D.PUESTOS[i]
            plan.sillas[#plan.sillas + 1] = { x = mesa.x + p[1], y = mesa.y + p[2], z = z, f = p[3],
                mx = mesa.x + (p[1] >= 1 and 1 or 0), my = mesa.y }
            faltan = faltan - 1
        end
    end
    if #plan.mesas == 0 then return nil, "sin espacio para la mesa" end
    -- Sacos de dormir: dos casillas en fila, vacias y adentro.
    local cx, cy = plan.mesas[1].x, plan.mesas[1].y
    for _ = 1, #plan.sillas do
        local saco = anillos(cx, cy, 3, D.RADIO_SACOS, function(x, y)
            if usadas[clave(x, y)] or usadas[clave(x + 1, y)] then return nil end
            local a, c = Mundo.cargado(x, y, z), Mundo.cargado(x + 1, y, z)
            if adentro(a, b) and adentro(c, b) and SB.vacia(a) and SB.vacia(c) then return { x = x, y = y } end
        end)
        if saco == nil then break end
        marcar(usadas, saco.x, saco.y, saco.x + 1, saco.y)
        plan.sacos[#plan.sacos + 1] = saco
    end
    -- Agua: una casilla adentro.
    plan.agua = anillos(cx, cy, 2, D.RADIO_SACOS, function(x, y)
        if usadas[clave(x, y)] then return nil end
        local sq = Mundo.cargado(x, y, z)
        if adentro(sq, b) and SB.vacia(sq) then return { x = x, y = y } end
    end)
    if plan.agua ~= nil then marcar(usadas, plan.agua.x, plan.agua.y, plan.agua.x, plan.agua.y) end
    -- Generador: afuera (el humo adentro mata), pegado a una pared del edificio.
    plan.generador = anillos(l.x, l.y, 1, D.RADIO_GENERADOR, function(x, y)
        local sq = Mundo.cargado(x, y, z)
        if sq == nil or edificio(sq) ~= nil or not SB.vacia(sq) then return nil end
        for _, d in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } }) do
            if edificio(Mundo.cargado(x + d[1], y + d[2], z)) == b then return { x = x, y = y } end
        end
    end)
    return plan
end

-- ---------------------------------------------------------------------------
-- Poner las cosas (todo con pcall)
-- ---------------------------------------------------------------------------

local function mandar(obj)
    if isServer ~= nil and isServer() then pcall(function() obj:transmitCompleteItemToClients() end) end
end

function SB.ponerTile(x, y, z, sprite)
    local sq = Mundo.cargado(x, y, z)
    if sq == nil or IsoObject == nil or getSprite == nil then return nil end
    local puesto
    pcall(function()
        local spr = getSprite(sprite)
        if spr == nil then return end
        local obj = IsoObject.new(getCell(), sq, spr)
        sq:AddTileObject(obj)
        mandar(obj)
        pcall(function() sq:RecalcProperties() end)
        pcall(function() sq:RecalcAllWithNeighbours(true) end)
        puesto = obj
    end)
    return puesto
end

function SB.ponerGenerador(x, y, z)
    local sq = Mundo.cargado(x, y, z)
    if sq == nil or IsoGenerator == nil then return false end
    local item = Mundo.crearItem(D.GENERADOR)
    if item == nil then return false end
    return pcall(function()
        -- El constructor ya lo agrega a la casilla (MOGenerator.lua).
        local gen = IsoGenerator.new(item, getCell(), sq)
        gen:setCondition(100)
        gen:setFuel(gen:getMaxFuel())
        gen:setConnected(true)
        gen:setActivated(true)
        mandar(gen)
        pcall(function() gen:sync() end)
    end)
end

function SB.generadorEn(x, y, z)
    local sq = Mundo.cargado(x, y, z)
    if sq == nil then return nil end
    local gen
    pcall(function()
        local objs = sq:getSpecialObjects()
        for i = 0, objs:size() - 1 do
            local o = objs:get(i)
            if instanceof(o, "IsoGenerator") then gen = o end
        end
        if gen == nil then
            objs = sq:getObjects()
            for i = 0, objs:size() - 1 do
                local o = objs:get(i)
                if instanceof(o, "IsoGenerator") then gen = o end
            end
        end
    end)
    return gen
end

-- Rellena el estanque y lo deja prendido (si alguien se lo llevo, no se repone).
function SB.rellenar(gen)
    if gen == nil then return false end
    return pcall(function()
        if gen:getFuel() < gen:getMaxFuel() * 0.6 then gen:setFuel(gen:getMaxFuel()) end
        if not gen:isConnected() then gen:setConnected(true) end
        if not gen:isActivated() and gen:getFuel() > 0 then gen:setActivated(true) end
        gen:sync()
    end)
end

local function llenarAgua(item)
    if item == nil or Fluid == nil then return end
    pcall(function()
        local fc = item:getFluidContainer()
        fc:addFluid(Fluid.Water, fc:getCapacity() - fc:getAmount())
    end)
end

local function alturaMesa(obj)
    local ok, h = pcall(function() return obj:getSurfaceOffsetNoTable() / 96 end)
    if ok and tonumber(h) ~= nil and h > 0 then return h end
    return 33 / 96
end

function SB.ponerTodo(plan)
    local z = plan.z
    for i, m in ipairs(plan.mesas) do
        local a = SB.ponerTile(m.x, m.y, z, D.MESA[1])
        SB.ponerTile(m.x + 1, m.y, z, D.MESA[2])
        local baraja = i == 1 and Mundo.crearItem(D.BARAJA) or nil
        local sq = Mundo.cargado(m.x, m.y, z)
        if baraja ~= nil and sq ~= nil then
            local h = a ~= nil and alturaMesa(a) or 33 / 96
            pcall(function() sq:AddWorldInventoryItem(baraja, 0.8, 0.5, h) end)
        end
    end
    for _, s in ipairs(plan.sillas) do SB.ponerTile(s.x, s.y, z, D.SILLA[s.f]) end
    for i, s in ipairs(plan.sacos) do
        local par = D.SACOS[(i - 1) % #D.SACOS + 1]
        SB.ponerTile(s.x, s.y, z, par[1])
        SB.ponerTile(s.x + 1, s.y, z, par[2])
    end
    if plan.agua ~= nil then
        local sq = Mundo.cargado(plan.agua.x, plan.agua.y, z)
        for _ = 1, D.BIDONES do
            local bidon = Mundo.crearItem(D.AGUA)
            llenarAgua(bidon)
            if bidon ~= nil and sq ~= nil then
                pcall(function() sq:AddWorldInventoryItem(bidon, 0.2 + Mundo.azar(6) * 0.1, 0.2 + Mundo.azar(6) * 0.1, 0) end)
            end
        end
    end
    plan.hayGenerador = plan.generador ~= nil and SB.ponerGenerador(plan.generador.x, plan.generador.y, z) or false
end

-- ---------------------------------------------------------------------------
-- Memoria propia y el tick
-- ---------------------------------------------------------------------------

function SB.memoria()
    local m = Motor.estado().memoria
    return m.sous_base
end

function SB.amueblar(l, amigos)
    local ahora = Mundo.horas()
    if SB.reintento ~= nil and ahora < SB.reintento then return false end
    if Mundo.cargado(l.x, l.y, l.z) == nil or Mundo.jugadorCerca(l.x, l.y, D.CERCA) == nil then return false end
    local n = math.max(D.MIN_SILLAS, math.min(D.MAX_SILLAS, #amigos))
    local plan, motivo = SB.planear(l, n)
    if plan == nil then
        SB.reintento = ahora + D.REINTENTO_HORAS
        Mundo.log("base de Sous: no se pudo amueblar (" .. tostring(motivo) .. "), se reintenta")
        return false
    end
    SB.ponerTodo(plan)
    local sillas = {}
    for _, s in ipairs(plan.sillas) do
        sillas[#sillas + 1] = { x = s.x, y = s.y, z = s.z, f = s.f, mx = s.mx, my = s.my }
    end
    local m = Motor.estado().memoria
    m.sous_base = {
        x = l.x, y = l.y, z = l.z, hora = ahora, sillas = sillas,
        generador = plan.hayGenerador and { x = plan.generador.x, y = plan.generador.y, z = plan.z } or nil,
        relleno = ahora, sentados = {},
    }
    Mundo.log("base de Sous amueblada: " .. #plan.mesas .. " mesa(s), " .. #sillas .. " sillas, "
        .. #plan.sacos .. " sacos, generador " .. tostring(plan.hayGenerador))
    return true
end

-- Escribe en la memoria de A-Life el puesto (la silla) de un NPC. puesto = nil lo suelta.
function SB.fijarPuesto(uid, puesto)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro == nil or type(registro.peek) ~= "function" or type(registro.update) ~= "function" then return false end
    for _ = 1, 3 do
        local actual = registro.peek(uid)
        if actual == nil or actual.lifecycle == "dead" then return false end
        local mem = type(actual.memory) == "table" and actual.memory or {}
        if puesto ~= nil then
            -- No pisar otra postura (por ejemplo "camina conmigo").
            if mem.stance ~= nil and mem.stance ~= "" and mem.stance ~= "garrison" then return false end
            local p = mem.garrisonPost
            if mem.stance == "garrison" and mem.stanceRole == "sit" and type(p) == "table"
                    and p.x == puesto.x and p.y == puesto.y then return true end
        elseif mem.stance ~= "garrison" or mem.narradorSilla == nil then
            return true
        end
        local ok, r = pcall(registro.update, uid, actual.revision, function(a)
            a.memory = type(a.memory) == "table" and a.memory or {}
            local am = a.memory
            if puesto ~= nil then
                local post = { x = puesto.x, y = puesto.y, z = puesto.z }
                am.stance, am.stanceRole = "garrison", "sit"
                am.stanceAnchor, am.garrisonPost = post, { x = post.x, y = post.y, z = post.z }
                am.stanceFace = { x = puesto.fx, y = puesto.fy }
                am.stancePost, am.stancePostUntilMs = nil, nil
                am.narradorSilla = true
                am.moduleOverrides = type(am.moduleOverrides) == "table" and am.moduleOverrides or {}
                am.moduleOverrides.stance = "on"
            else
                am.stance, am.stanceRole, am.stanceAnchor, am.garrisonPost, am.stanceFace = nil, nil, nil, nil, nil
                am.narradorSilla = nil
                if type(am.moduleOverrides) == "table" then am.moduleOverrides.stance = nil end
            end
        end)
        if ok and r ~= nil then return true end
    end
    return false
end

-- Cada integrante a su silla (la misma siempre: base.asientos[rol]); los que dejaron de ser
-- amigos se sueltan.
function SB.asignar(base, amigos)
    base.asientos = base.asientos or {}
    local presentes, ocupadas = {}, {}
    for _, a in ipairs(amigos) do presentes[tostring(a[2] or a[1])] = true end
    for k, i in pairs(base.asientos) do
        if presentes[k] and base.sillas[i] ~= nil then ocupadas[i] = true else base.asientos[k] = nil end
    end
    local silla = {}
    for _, a in ipairs(amigos) do
        local k = tostring(a[2] or a[1])
        if base.asientos[k] == nil then
            for i = 1, #base.sillas do
                if not ocupadas[i] then base.asientos[k], ocupadas[i] = i, true; break end
            end
        end
        silla[a] = base.asientos[k]
    end
    return silla
end

function SB.sentar(base, amigos)
    base.sentados = base.sentados or {}
    local silla = SB.asignar(base, amigos)
    local ahora = {}
    for _, a in ipairs(amigos) do
        local s = silla[a] ~= nil and base.sillas[silla[a]] or nil
        if s ~= nil then
            local puesto = { x = s.x + 0.5, y = s.y + 0.5, z = s.z, fx = s.mx + 0.5, fy = s.my + 0.5 }
            if SB.fijarPuesto(a[1], puesto) then ahora[tostring(a[1])] = a[1] end
        end
    end
    for k, uid in pairs(base.sentados) do
        if ahora[k] == nil then SB.fijarPuesto(uid, nil) end
    end
    base.sentados = ahora
    return silla
end

-- Los que estan sentados (a menos de 1.5 de su silla) hablan de cartas.
function SB.cartas(base, amigos, silla)
    local mesa = {}
    for _, a in ipairs(amigos) do
        local s = silla ~= nil and silla[a] ~= nil and base.sillas[silla[a]] or nil
        local x, y = Mundo.posicionActor(a[1])
        if s ~= nil and x ~= nil and (x - s.x - 0.5) ^ 2 + (y - s.y - 0.5) ^ 2 <= 2.25 then mesa[#mesa + 1] = a end
    end
    if #mesa < 2 then return end
    local m, texto = Motor.charlaElegir(Narrador.Charlas.sous_cartas, mesa, SB.charla, 10, 0.8)
    if m ~= nil then Motor.decirUid(m[1], m[3], texto) end
end

function SB.tick()
    if Motor.minutosDesdeArranque % 5 ~= 0 then return end
    pcall(SB.correaCorta)
    local l = SB.lugar()
    if l == nil then return end
    local amigos = SB.amigos()
    local base = SB.memoria()
    if base == nil then
        if #amigos == 0 then return end
        local ok, hecho = pcall(SB.amueblar, l, amigos)
        if not ok then Mundo.log("base de Sous: error al amueblar: " .. tostring(hecho)) end
        base = SB.memoria()
        if base == nil then return end
    end
    local ok, silla = pcall(SB.sentar, base, amigos)
    pcall(SB.cartas, base, amigos, ok and silla or nil)
    local g = base.generador
    if g ~= nil and Mundo.horas() - (base.relleno or 0) >= D.RELLENO_HORAS and Mundo.cargado(g.x, g.y, g.z) ~= nil then
        local gen = SB.generadorEn(g.x, g.y, g.z)
        if gen ~= nil then SB.rellenar(gen) end
        base.relleno = Mundo.horas()
    end
end
Motor.tickExtra.sousBase = SB.tick

return SB
