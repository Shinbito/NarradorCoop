-- Prueba: la base de Sous viva (NarradorSousBase). Plan de muebles en un galpon de mentira,
-- una silla por integrante, el puesto de A-Life en la silla y soltarlos si dejan de ser amigos.
-- Se corre con correr.py.
local Mundo, Motor, SB = Narrador.Mundo, Narrador.Motor, Narrador.SousBase
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
Mundo.horas = function() return 100 end
Mundo.log = function() end
Motor.enviar = function() end

-- Galpon de 100..115 x 200..212 (z 0) con un estante solido en 105,206; afuera, pasto.
local GALPON, SALA = { "galpon" }, { "sala" }
local casillas = {}
local function lista(t) return { size = function() return #t end, get = function(_, i) return t[i + 1] end } end
local function casilla(x, y)
    local k = x .. ":" .. y
    if casillas[k] ~= nil then return casillas[k] end
    local dentro = x >= 100 and x <= 115 and y >= 200 and y <= 212
    local piso = { getSprite = function() return { getName = function() return dentro and "floors_interior_01_0" or "blends_natural_01_0" end } end }
    local objs = { piso }
    local solido = x == 105 and y == 206
    if solido then objs[2] = { getSprite = function() return { getName = function() return "furniture_shelving_01_0" end } end } end
    local sq = {
        isFree = function() return not solido end,
        getFloor = function() return piso end,
        getObjects = function() return lista(objs) end,
        getBuilding = function() return dentro and GALPON or nil end,
        getRoom = function() return dentro and SALA or nil end,
    }
    casillas[k] = sq
    return sq
end
Mundo.cargado = function(x, y, z) if z ~= 0 then return nil end return casilla(math.floor(x), math.floor(y)) end

local plan = SB.planear({ x = 105, y = 205, z = 0 }, 9)
check(plan ~= nil, "hay plan")
check(#plan.mesas == 2 and #plan.sillas == 9, "dos mesas y nueve sillas (" .. #plan.mesas .. ", " .. #plan.sillas .. ")")
local ocupadas, todasAdentro = {}, true
for _, s in ipairs(plan.sillas) do
    local k = s.x .. ":" .. s.y
    check(ocupadas[k] == nil, "silla sin repetir en " .. k)
    ocupadas[k] = true
    if not (s.x >= 100 and s.x <= 115 and s.y >= 200 and s.y <= 212) then todasAdentro = false end
    check(not (s.x == 105 and s.y == 206), "ninguna silla sobre el estante")
end
check(todasAdentro, "todas las sillas adentro del galpon")
check(#plan.sacos == 9, "un saco por integrante (" .. #plan.sacos .. ")")
check(plan.agua ~= nil, "lugar para el agua")
local g = plan.generador
check(g ~= nil and not (g.x >= 100 and g.x <= 115 and g.y >= 200 and g.y <= 212), "generador afuera")
check(g ~= nil and (g.x == 99 or g.x == 116 or g.y == 199 or g.y == 213), "generador pegado a la pared")

-- Sin edificio: no hay plan.
local viejo = Mundo.cargado
Mundo.cargado = function(x, y, z) return casilla(x + 1000, y) end
check(SB.planear({ x = 105, y = 205, z = 0 }, 4) == nil, "sin edificio no se amuebla")
Mundo.cargado = viejo

-- Puestos en A-Life (registro de mentira).
local actores = {}
ProjectALife = { ActorRegistry = {
    peek = function(uid) return actores[uid] end,
    update = function(uid, rev, f) f(actores[uid]); actores[uid].revision = rev + 1; return actores[uid] end,
} }
for i = 1, 3 do actores["u" .. i] = { uid = "u" .. i, revision = 1, memory = {} } end
actores.u3.memory.stance = "walkWith"
local base = { sillas = { { x = 1, y = 1, z = 0, f = "S", mx = 1, my = 2 }, { x = 2, y = 3, z = 0, f = "N", mx = 2, my = 2 } } }
local amigos = { { "u1", "david" }, { "u2", "hanz" }, { "u3", "jorge" } }
SB.sentar(base, amigos)
local m1 = actores.u1.memory
check(m1.stance == "garrison" and m1.stanceRole == "sit" and m1.garrisonPost.x == 1.5 and m1.garrisonPost.y == 1.5, "david a su silla")
check(m1.moduleOverrides.stance == "on", "la postura manda")
check(actores.u2.memory.garrisonPost.x == 2.5, "hanz a la otra silla")
check(actores.u3.memory.stance == "walkWith", "no se pisa otra postura")
check(base.asientos.david == 1 and base.asientos.hanz == 2, "asientos por rol")
-- Hanz deja de estar (por ejemplo, dejaron de ser amigos): se suelta.
SB.sentar(base, { { "u1", "david" } })
check(actores.u2.memory.stance == nil and actores.u2.memory.garrisonPost == nil, "hanz se suelta")
check(actores.u1.memory.garrisonPost.x == 1.5, "david sigue en su silla")
ProjectALife = nil

if fallos == 0 then print("TODO BIEN") else print("FALLOS: " .. fallos) end
