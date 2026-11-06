-- Prueba: Miguel Angel, el hijo del Cabo (cap. 5 del Cabo y su evento fortuito).
-- Se corre con herramientas/pruebas/correr.py.

require "Narrador/Arcos/Capitulos"
require "Narrador/Arcos/HijaCabo"
require "Narrador/Arcos/MiguelAngel"
local Mundo, Motor, C, G, R = Narrador.Mundo, Narrador.Motor, Narrador.Contactos, Narrador.Generador, Narrador.Reputacion
local MG = Narrador.MiguelEventos
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

local ahora = 1000
local J = { nombre = "Shinbito" }
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
Mundo.buscarLugar = function(spec)
    return { x = 800, y = 0, z = 0, etiqueta = "el almacen", sala = "grocery" }
end
Mundo.darItem = function() end
Mundo.crearItem = function(t) return { tipo = type(t) == "table" and t[1] or t, getModData = function() return {} end } end
local dichos = {}
Motor.enviar = function(_, cmd, d) if cmd == "decir" then dichos[#dichos + 1] = d.texto end end
Motor.publicar = function() end
Motor.responder = function() end
Motor.avisar = function() end
C.decir = function(id, texto) dichos[#dichos + 1] = texto end
local bajas = 0
Motor.contarBajas = function() return bajas end

local st = Motor.estado()
st.arcos, st.orden = {}, {}
local e = C.estado("muldraugh")
e.x, e.y, e.z, e.etiqueta = 0, 0, 0, "la comisaria"
R.tabla().g1 = { muldraugh = 95, westpoint = 95, riverside = 95, rosewood = 95 }
local m = st.memoria
local function hay(txt) for _, d in ipairs(dichos) do if d:find(txt, 1, true) then return true end end return false end
local function grupo(inst, id, rol, uid)
    inst.grupos[id] = { estado = "listo", miembros = { [uid] = { rol = rol, vivo = true } }, roles = { [rol] = uid }, nombres = {} }
end

print("1. El capitulo 5 sale despues del 4")
m.historia_muldraugh_1, m.historia_muldraugh_2, m.historia_muldraugh_3, m.historia_muldraugh_4 = true, true, true, nil
local o = G.ofertaEspecial("muldraugh", "facil", "g1")
check(o == nil or o.def ~= "cap_cabo_5", "sin el 4 no sale el 5")
m.historia_muldraugh_4 = true
o = G.ofertaEspecial("muldraugh", "facil", "g1")
check(o ~= nil and o.def == "cap_cabo_5", "con el 4 hecho sale el 5")

print("2. Lo encuentras, cae, llega Eduardo, vuelve a la comisaria")
local inst = G.iniciarOferta(J, "muldraugh", "facil", o)
check(inst ~= nil and inst.etapa == "viaje", "arranca: a buscarlo")
check(hay("Miguel Angel"), "el Cabo nombra a su hijo")
px, py = 800, 0
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "sitio", "llega al almacen")
grupo(inst, "miguel", "miguel", "m1")
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "pelea", "pelea con Miguel Angel")
check(inst.grupos.miguel.accion == nil or inst.grupos.miguel.accion.mortales ~= true, "Miguel Angel sigue inmortal")
ahora = ahora + 0.2
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "cae", "Miguel Angel cae")
grupo(inst, "eduardo", "eduardo", "e1")
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "rescate" and hay("Otra vez"), "llega Eduardo a salvarlo")
inst.vars.horda_meta = 20
bajas = 20
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "termina la horda: hablar")
Motor.elegir(J, inst.id, "papa")
check(inst.etapa == "escolta", "vuelve contigo a la comisaria")
Mundo.posicionActor = function() return 2, 0 end
px, py = 0, 0
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_reencuentro", "llega a la comisaria")
check(m.historia_muldraugh_5 == true and m.miguel_angel == "en_muldraugh", "memorias del capitulo y de Miguel Angel")
local r = st.residentes.miguel_angel
check(r ~= nil and r.charla == "miguel_angel" and r.banderas.invulnerable == true, "se queda en la comisaria, inmortal y con su charla")
check(#Narrador.Charlas.miguel_angel >= 10, "tiene charla propia")

print("3. Si no vas, lo trae Eduardo (nunca muere)")
st.arcos, st.orden = {}, {}
m.historia_muldraugh_5, m.miguel_angel = nil, nil
px, py = 0, 0
inst = G.iniciarOferta(J, "muldraugh", "facil", G.ofertaEspecial("muldraugh", "facil", "g1"))
ahora = ahora + 130
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_lo_trajo_eduardo" and m.miguel_angel == "en_muldraugh", "lo trajo Eduardo, vivo")

print("4. El evento fortuito")
st.arcos, st.orden = {}, {}
m.miguel_ev_dia, m.miguel_ev_hora = nil, nil
px, py = 0, 0
MG.revisar()
check(Motor.activos("miguel_evento") == 0, "cerca de la comisaria no sale")
px, py = 3000, 0
m.miguel_ev_dia = nil
MG.revisar()
check(Motor.activos("miguel_evento") == 1, "lejos de Muldraugh sale")
local ev
for _, id in ipairs(st.orden) do if st.arcos[id].def == "miguel_evento" then ev = st.arcos[id] end end
check(ev ~= nil and ev.vars.rescate == "eduardo", "casi siempre lo salva Eduardo (sorteo)")
grupo(ev, "miguel", "miguel", "m2")
Motor.revisarSalidas(ev, 0)
check(ev.etapa == "apuro", "llega con una horda")
ahora = ahora + 0.2
Motor.revisarSalidas(ev, 0)
check(ev.etapa == "cae", "cae")
grupo(ev, "eduardo", "eduardo", "e2")
Motor.revisarSalidas(ev, 0)
check(ev.etapa == "con_eduardo", "llega Eduardo")
ev.vars.horda_meta = 10
bajas = 10
Motor.revisarSalidas(ev, 0)
check(ev.final == "final_eduardo", "Eduardo lo salva")

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
