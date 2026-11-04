-- Prueba: la prueba del agua de las K-93 (NarradorCura.lua, NarradorCuraServer.lua) y lo que
-- abre: entregar la verdadera sin Medicina 4, la confesion del doctor Hartmann (al llegar a West
-- Point o despues, historia hartmann_k93) y el agua que manda la Chela al pedir la cura.
-- Se corre con correr.py.
require "Narrador/Arcos/Cura"
require "Narrador/Arcos/LeyendaEduardo"
local Mundo, Motor, C, CS, Cura, Defs, Lore = Narrador.Mundo, Narrador.Motor, Narrador.Contactos, Narrador.CuraServer,
    Narrador.Cura, Narrador.Defs, Narrador.Lore
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

-- ---------------------------------------------------------------------------
-- Objetos de mentira: pastillas, una botella con agua y el inventario
-- ---------------------------------------------------------------------------
Fluid = { Water = "agua", TaintedWater = "agua_sucia" }
instanceof = function(o, clase) return type(o) == "table" and o.clase == clase end
local sigId = 0
local function lista(t)
    return { size = function() return #t end, get = function(_, i) return t[i + 1] end }
end
local inv = { items = {} }
function inv:getItems() return lista(self.items) end
function inv:Remove(it) for i, x in ipairs(self.items) do if x == it then table.remove(self.items, i) end end end
function inv:getItemWithIDRecursiv(id) for _, x in ipairs(self.items) do if x.id == id then return x end end return nil end
local function pastilla(es, etiqueta)
    sigId = sigId + 1
    local it = { id = sigId, md = { NarradorK93 = es, NarradorObjeto = etiqueta }, nombre = "Pastilla K-93" }
    function it:getFullType() return "Narrador.CuraZ" end
    function it:getModData() return self.md end
    function it:getID() return self.id end
    function it:getContainer() return inv end
    function it:setName(n) self.nombre = n end
    function it:setCustomName() end
    inv.items[#inv.items + 1] = it
    return it
end
local litros = 0
local botella = { id = 999 }
function botella:getFullType() return "Base.WaterBottle" end
function botella:getModData() return {} end
function botella:getFluidContainer()
    return {
        isEmpty = function() return litros <= 0 end,
        getAmount = function() return litros end,
        contains = function(_, f) return f == Fluid.Water end,
        removeFluid = function(_, n) litros = litros - n end,
    }
end
local J = { nombre = "Shinbito" }
function J:getInventory() return inv end

-- ---------------------------------------------------------------------------
-- Mundo de mentira
-- ---------------------------------------------------------------------------
local ahora = 1000
Mundo.horas = function() return ahora end
Mundo.log = function() end
Mundo.hayALife = function() return true end
Mundo.sandbox = function(_, d) return d end
Mundo.jugadores = function() return { J } end
Mundo.jugadorAlAzar = function() return J end
Mundo.nombreJugador = function() return "Shinbito" end
Mundo.grupoDe = function() return "g1", "Los de prueba" end
Mundo.vivo = function() return true end
Mundo.retirar = function() return true end
Mundo.azar = function() return 1 end
Mundo.puebloCercano = function() return nil end
Mundo.cargado = function() return nil end
local px, py = 0, 0
Mundo.posicion = function() return px, py, 0 end
Mundo.jugadorCerca = function(x, y, r)
    if math.sqrt((px - x) ^ 2 + (py - y) ^ 2) <= (r or 35) then return J end
    return nil
end
Mundo.buscarLugar = function(spec) return { x = 3000, y = 3000, z = 0, etiqueta = "el hospital", sala = "medical" } end
local respuestas, enviados, dichos = {}, {}, {}
Motor.responder = function(_, t) respuestas[#respuestas + 1] = t end
Motor.enviar = function(_, cmd, d) enviados[#enviados + 1] = { cmd, d } end
Motor.publicar = function() end
Motor.decir = function(inst, grupo, rol, texto) dichos[#dichos + 1] = tostring(grupo) .. ":" .. tostring(Motor.texto(inst, texto)) end
C.decir = function(id, texto) dichos[#dichos + 1] = id .. ":" .. texto end
local CHELA = { x = 500, y = 500 }
C.desbloqueado = function() return true end
C.lugar = function() return { x = CHELA.x, y = CHELA.y, z = 0 } end
Motor.minutosDesdeArranque = 0
local st = Motor.estado()
local m = st.memoria
m.historia_abierta = true
local function dijo(trozo)
    for _, d in ipairs(dichos) do if d:find(trozo, 1, true) then return true end end
    return false
end
local function enDiario(trozo)
    for _, d in ipairs(st.diario) do if tostring(d.t):find(trozo, 1, true) then return d end end
    return nil
end
local function pendiente(inst, trozo)
    for _, p in ipairs(inst.pendientes or {}) do
        if type(p.texto) == "string" and p.texto:find(trozo, 1, true) then return true end
    end
    return false
end
local function ultimo() return enviados[#enviados] end

-- ---------------------------------------------------------------------------
-- 1. La prueba del agua dentro de la mision de la cura
-- ---------------------------------------------------------------------------
print("1. Prueba del agua")
local inst = { id = "encargo_cura#1", def = "encargo_cura", vars = { contacto = "westpoint" }, lugares = {}, grupos = {},
    diario = {}, pendientes = {}, relojes = {}, elecciones = {}, usadas = {} }
st.arcos[inst.id] = inst
local falsa = pastilla("falsa", inst.id .. ":cura")
local real = pastilla("real", inst.id .. ":cura")
local op = { requiere = { "pastilla", "cura", "real" } }
check(Motor.requisitos.pastilla(inst, op, J) == nil, "sin Medicina 4 ni prueba, no se puede entregar 'la verdadera'")

CS.pruebaAgua(J, { id = falsa.id })
check(#inv.items == 3 - 1 and respuestas[#respuestas]:find("agua", 1, true) ~= nil, "sin agua no hay prueba (y no se pierde nada)")
inv.items[#inv.items + 1] = botella
litros = 1
CS.pruebaAgua(J, { id = falsa.id })
check(inv:getItemWithIDRecursiv(falsa.id) == nil, "la falsa se deshace: ya no esta en el inventario")
check(math.abs(litros - (1 - Cura.AGUA)) < 0.001, "se gasto un vaso de agua")
check(ultimo()[1] == "pruebaAgua" and ultimo()[2].falsa == true, "el cliente recibe 'era falsa'")
check(m.k93_falsa_vista == true and inst.vars.agua_falsas == 1, "memoria k93_falsa_vista y la historia cuenta la falsa")
check(enDiario("pata de abajo mas corta") ~= nil, "el diario anota la K chueca")

CS.pruebaAgua(J, { id = real.id })
check(inv:getItemWithIDRecursiv(real.id) ~= nil and real.md.NarradorK93Probada == true and real.nombre:find("verdadera", 1, true) ~= nil,
    "la verdadera sale entera y queda marcada")
check(ultimo()[2].falsa == false and inst.vars.agua_reales == 1, "el cliente recibe 'era verdadera'")
local antes = #respuestas
CS.pruebaAgua(J, { id = real.id })
check(#respuestas == antes + 1 and respuestas[#respuestas]:find("ya sabes", 1, true) ~= nil, "la que ya se probo no se vuelve a probar")
local entregar = Motor.requisitos.pastilla(inst, op, J)
check(entregar ~= nil, "probada en agua, se puede entregar 'la verdadera' sin Medicina 4")
entregar()
check(inst.vars.pastilla_dada == "real" and inv:getItemWithIDRecursiv(real.id) == nil, "la entrega es la verdadera")
check(Motor.requisitos.pastilla(inst, { requiere = { "pastilla", "cura", "falsa" } }, J) == nil,
    "la falsa a sabiendas sigue pidiendo Medicina 4 (en agua se deshace)")

-- Una pastilla que quedo de una mision ya terminada: igual se prueba y va al diario.
local suelta = pastilla("falsa", "encargo_cura#0:cura")
CS.pruebaAgua(J, { id = suelta.id })
local d = enDiario("Otra K-93 al agua")
check(inv:getItemWithIDRecursiv(suelta.id) == nil and d ~= nil and d.arco == CS.DIARIO, "sin historia: al diario de 'Las pastillas K-93'")
st.arcos[inst.id] = nil

-- ---------------------------------------------------------------------------
-- 2. El doctor Hartmann ya vive con la Chela: la K chueca
-- ---------------------------------------------------------------------------
print("2. La K chueca (despues)")
check(Defs.get("hartmann_k93") ~= nil, "hartmann_k93 esta registrada")
local sinLore = {}
for nombre, etapa in pairs(Defs.get("hartmann_k93").etapas) do
    if etapa.final and Lore.final("hartmann_k93", nombre) == nil then sinLore[#sinLore + 1] = nombre end
    if not etapa.final and etapa.pista ~= nil and Lore.etapa("hartmann_k93", nombre) == nil then sinLore[#sinLore + 1] = nombre end
end
check(#sinLore == 0, "diario en cada etapa y final " .. table.concat(sinLore, ", "))
m.cientifico_hartmann = "en_west_point"
CS.revisarHartmann()
check(Motor.activos("hartmann_k93") == 0, "lejos de la Chela no pasa nada")
px, py = CHELA.x, CHELA.y
CS.revisarHartmann()
local k
for _, i in pairs(st.arcos) do if i.def == "hartmann_k93" then k = i end end
check(k ~= nil and k.etapa == "cocina", "cerca de la Chela: la escena de la cocina")
CS.revisarHartmann()
check(Motor.activos("hartmann_k93") == 1, "no se lanza dos veces")
Motor.elegir(J, k.id, "contar")
check(k.etapa == "confesion" and dijo("Como sabia?"), "la Chela le pregunta al doctor como sabia lo del agua")
check(pendiente(k, "la K la grabe yo"), "Hartmann confiesa que grabo la K")
ahora = ahora + 1
Motor.revisarSalidas(k, 0)
check(k.final == "final_confeso" and m.hartmann_k93 == "confeso", "final_confeso: hartmann_k93 = confeso")
st.arcos[k.id] = nil
CS.revisarHartmann()
check(Motor.activos("hartmann_k93") == 0, "con la confesion hecha no vuelve")

-- Callarse tambien cierra.
m.hartmann_k93 = nil
CS.revisarHartmann()
for _, i in pairs(st.arcos) do if i.def == "hartmann_k93" then k = i end end
Motor.elegir(J, k.id, "callar")
check(k.final == "final_callado" and m.hartmann_k93 == "callado", "si te callas: hartmann_k93 = callado")
st.arcos[k.id] = nil

-- La Chela manda agua al pedir la cura.
m.hartmann_k93 = "confeso"
local pedido
local iniciarReal = Motor.iniciar
Motor.iniciar = function(defId, j, extra) pedido = extra.vars.pedido; return nil, "prueba" end
C.distancia = function() return 1 end
C.encargoDelGrupo = function() return nil end
CS.pedir(J, { contacto = "westpoint" })
check(pedido ~= nil and pedido:find("Y llevate agua", 1, true) ~= nil, "con la confesion, la Chela pide la cura y manda agua")
pedido = nil
CS.pedir(J, { contacto = "rosewood" })
check(pedido ~= nil and pedido:find("agua", 1, true) == nil, "la Misia Rosa no sabe nada del agua")
Motor.iniciar = iniciarReal

-- ---------------------------------------------------------------------------
-- 3. Lo trajiste despues de ver la falsa: confiesa al llegar (cap. 3 de la Chela)
-- ---------------------------------------------------------------------------
print("3. La K chueca al llegar a West Point")
local function llegada(memorias)
    for k2 in pairs(m) do m[k2] = nil end
    m.historia_abierta = true
    for k2, v in pairs(memorias) do m[k2] = v end
    dichos = {}
    local e = { id = "leyenda_eduardo#9", def = "leyenda_eduardo", vars = { contacto = "westpoint" }, lugares = { contacto = CHELA },
        grupos = {}, diario = {}, pendientes = {}, relojes = {}, elecciones = {}, usadas = {} }
    st.arcos[e.id] = e
    Motor.entrar(e, "final_cumplido", 0)
    st.arcos[e.id] = nil
    return e
end
local e = llegada({ k93_falsa_vista = true })
check(e.vars.k_chueca == true and m.hartmann_k93 == "confeso", "con la falsa vista, confiesa al llegar")
check(pendiente(e, "la K la grabe yo") and pendiente(e, "Ni una pastilla"), "la confesion y la respuesta de la Chela")
check(Motor.loreTexto(e, Lore.final("leyenda_eduardo", "final_cumplido")):find("K chueca", 1, true) ~= nil, "el epilogo lo cuenta")
e = llegada({ k93_falsa_vista = true, curandero_falso = true })
check(e.vars.k_chueca == nil and m.hartmann_k93 == "confeso" and pendiente(e, "Las pastillas las vendi yo"),
    "con los Bell confiesa por los Bell (una sola confesion)")
e = llegada({})
check(e.vars.k_chueca == nil and m.hartmann_k93 == nil, "sin nada, no confiesa")
local ensena = false
for _, a in ipairs(Defs.get("leyenda_eduardo").etapas.despedida.al_entrar) do
    if a[1] == "decir" and type(a.texto) == "string" and a.texto:find("echalas al agua", 1, true) then ensena = true end
end
check(ensena, "Eduardo te ensena la prueba del agua al despedirse")

if fallos == 0 then print("TODO BIEN") else print("FALLOS: " .. fallos) end
