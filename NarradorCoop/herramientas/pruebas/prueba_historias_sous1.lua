-- Prueba: historias personales de Sous (parte 1). El lanzador (Sous aliado, de a una, horas
-- entre una y otra) y la historia de Zent de punta a punta, con sus dos armas. Se corre con correr.py.
local Mundo, Motor, H = Narrador.Mundo, Narrador.Motor, Narrador.HistoriasSous1
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

local ahora = 500
local J = { nombre = "Shinbito" }
local dados = {}
Mundo.horas = function() return ahora end
Mundo.log = function() end
Mundo.retirar = function() return true end
Mundo.hayALife = function() return true end
Mundo.sandbox = function(_, d) return d end
Mundo.jugadores = function() return { J } end
Mundo.jugadorAlAzar = function() return J end
Mundo.nombreJugador = function() return "Shinbito" end
Mundo.grupoDe = function() return nil end
Mundo.vivo = function() return true end
local px, py = 1000, 1000
Mundo.posicion = function() return px, py, 0 end
Mundo.jugadorCerca = function() return J end
Mundo.cargado = function() return nil end
Mundo.azar = function() return 1 end
Mundo.puebloCercano = function() return nil end
Mundo.buscarLugar = function() return { x = 1300, y = 1000, z = 0, etiqueta = "la armeria", sala = "gunstore" } end
Mundo.contarBajas = nil
local tiene = false
Mundo.buscarItem = function() if tiene then return {}, {} end return nil end
Mundo.quitarItem = function() end
Mundo.darItem = function(_, it) dados[#dados + 1] = it end
Mundo.crearItem = function(tipos)
    local tipo = type(tipos) == "table" and tipos[1] or tipos
    local md = {}
    return { tipo = tipo, getModData = function() return md end, getDisplayName = function() return tipo end }
end
Motor.enviar = function() end
Motor.publicar = function() end
local bajas = 0
Motor.contarBajas = function() return bajas end

local st = Motor.estado()
st.arcos, st.orden = {}, {}
local m = st.memoria
m["lugar.base_sous"] = { x = 1000, y = 1000, z = 0, etiqueta = "la base de Sous" }
st.residentes = st.residentes or {}
st.residentes.sous = { miembros = {
    [11] = { rol = "martin_a", nombre = "Martin", apellido = "Akagami" },
    [12] = { rol = "martin_z", nombre = "Martin", apellido = "Zent" },
    [13] = { rol = "benjamin", nombre = "Benjamin", apellido = "Matric" },
} }

-- Lanzador
m.sous = "enemigos"
H.revisar()
check(Motor.activos("hsous_martin_a") == 0, "sin Sous aliado no se lanza nada")
m.sous = "aliados"
H.revisar()
check(Motor.activos("hsous_martin_a") == 1, "con Sous aliado llama Akagami (el primero)")
check(m.hora_hsous == ahora, "queda la hora de la ultima")
H.revisar()
check(Motor.activos(nil) == 1, "de a una")
local id = st.orden[1]
Motor.elegir(J, id, "despues")
check(st.arcos[id].final == "final_despues" and m.hsous_martin_a == nil, "'Ahora no' no la cierra para siempre")
ahora = ahora + 10
H.revisar()
check(Motor.activos(nil) == 0, "hay que esperar horas entre una y otra")
m.hsous_martin_a = "hecho"
m.sous_murio_martin_z = true
ahora = ahora + 40
H.revisar()
check(Motor.activos("hsous_benjamin") == 1, "salta a los que ya la hicieron o murieron")
st.arcos, st.orden = {}, {}
m.sous_murio_martin_z = nil

-- Zent de punta a punta
local inst = Motor.iniciar("hsous_martin_z", J)
check(inst ~= nil and inst.etapa == "pedido", "Zent empieza pidiendo")
check(inst.grupos.pide ~= nil and inst.grupos.pide.prestado, "Zent viene prestado de la base")
Motor.elegir(J, inst.id, "aceptar")
check(inst.etapa == "armeria", "acepta: a la armeria")
check(inst.lugares.armeria ~= nil and inst.lugares.amigos_punto ~= nil, "lugares de la armeria y de los amigos")
local hayAmigos = false
for _, p in ipairs(inst.pendientes) do if p[1] == "npcs" and p.id == "amigos" then hayAmigos = true end end
check(hayAmigos, "Clau y Renato esperan en la armeria")
tiene = true
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "renato", "con el estuche: Renato quiere probar")
px, py = 1300, 1000
Motor.elegir(J, inst.id, "prestar")
check(inst.etapa == "el_tiro" and inst.vars.prestada == true, "se la presta: horda por el tiro")
bajas = 50
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "volver", "despues de la horda: volver con Zent")
px, py = 1000, 1000
Motor.elegir(J, inst.id, "entregar")
check(inst.final == "final_hecho", "entrega el estuche: final_hecho")
check(m.hsous_martin_z == "hecho", "memoria hsous_martin_z = hecho")
local nombres = {}
for _, it in ipairs(dados) do
    local md = it.getModData()
    if md.NarradorLegendario ~= nil then nombres[md.NarradorLegendario.nombre] = it.tipo end
end
check(nombres["La Awp de SOUS"] == "Base.HuntingRifle", "La Awp de SOUS es un rifle de caza legendario")
check(nombres["Palo de Ekko"] == "Narrador.PaloEkko", "el Palo de Ekko es el item propio")
local municion = 0
for _, it in ipairs(dados) do if it.tipo == "Base.308Box" then municion = municion + 1 end end
check(municion == 2, "con su municion")

-- Todas las historias registradas, con su arma
for _, rol in ipairs(H.ORDEN) do
    check(Narrador.Defs.get(H.idDe(rol)) ~= nil and H.ARMAS[rol] ~= nil, "historia y arma de " .. rol)
end
print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
