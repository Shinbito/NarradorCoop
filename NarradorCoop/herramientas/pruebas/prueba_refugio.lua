-- Prueba: la compuerta del modo historia (nada parte sin refugio) y el camino del bandido en
-- paralelo a los encargos de misioneros (no ocupa el cupo y, si se bota, no vuelve enseguida).
-- Se corre con correr.py.
local Mundo, Motor, C, BA, Director = Narrador.Mundo, Narrador.Motor, Narrador.Contactos, Narrador.Bandido, Narrador.Director
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

local ahora = 500
local J = { nombre = "Shinbito" }
local avisos = {}
local refugio = nil
local enPatio = false
Mundo.horas = function() return ahora end
Mundo.log = function() end
Mundo.hayALife = function() return true end
Mundo.sandbox = function(_, d) return d end
Mundo.jugadores = function() return { J } end
Mundo.jugadorAlAzar = function() return J end
Mundo.nombreJugador = function() return "Shinbito" end
Mundo.grupoDe = function() return "jugador:Shinbito", "Shinbito" end
Mundo.vivo = function() return true end
Mundo.posicion = function() return 1000, 1000, 0 end
Mundo.jugadorCerca = function() return enPatio and J or nil end
Mundo.azar = function() return 1 end
Mundo.jugadorConRefugio = function() if refugio ~= nil then return J, refugio end return nil end
Motor.enviar = function(_, tipo, datos) if tipo == "aviso" then avisos[#avisos + 1] = datos.texto end end
Motor.publicar = function() end

local st = Motor.estado()
st.arcos, st.orden, st.historial = {}, {}, {}
st.director.veces = {}
local m = st.memoria

-- Compuerta del refugio ---------------------------------------------------------------------
local abierta = Motor.historiaAbierta
Motor.historiaAbierta = Motor._historiaAbiertaReal
m.historia_abierta = nil
local inst, razon = Motor.iniciar("bandido_1", J)
check(inst == nil and razon == Motor.SIN_REFUGIO, "sin refugio no parte ninguna historia")
Motor.minutosDesdeArranque = 10
Motor.revisarRefugio()
check(#avisos == 1 and string.find(avisos[1], "refugio") ~= nil, "aviso para reclamar un refugio")
Motor.revisarRefugio()
check(#avisos == 1, "el aviso no se repite enseguida")
Director.tick()
check(#Director.st().agenda == 0 and Motor.activos() == 0, "el director no siembra rumores ni lanza nada")
refugio = { x = 1000, y = 1000, z = 0 }
check(Motor.historiaAbierta() == true and m.historia_abierta == true, "al reclamar un refugio se abre")
check(string.find(avisos[#avisos], "Tienes refugio") ~= nil, "aviso de que empieza la historia")
refugio = nil
check(Motor.historiaAbierta() == true, "queda abierta aunque se pierda el refugio")
local _, razon2 = Motor.iniciar("bandido_1", J)
check(razon2 ~= Motor.SIN_REFUGIO, "ya abierta, Motor.iniciar no la frena")

-- Partida vieja: con historias de antes queda abierta sola.
local vieja = { migraciones = { eduardo = true }, orden = {}, historial = { { def = "familia_infectada" } },
    director = { veces = {} }, memoria = {} }
Motor.migrar(vieja)
check(vieja.memoria.historia_abierta == true, "partida vieja con historial: abierta")
local nueva = { migraciones = { eduardo = true }, orden = {}, historial = {}, director = { veces = {} }, memoria = {} }
Motor.migrar(nueva)
check(nueva.memoria.historia_abierta == nil and nueva.migraciones.refugio == true, "partida nueva: cerrada hasta el refugio")
Motor.historiaAbierta = abierta

-- Bandido en paralelo a los misioneros ------------------------------------------------------
st.arcos, st.orden = {}, {}
local grupo = "jugador:Shinbito"
st.arcos["bandido_1#1"] = { id = "bandido_1#1", def = "bandido_1", vars = { dueno = grupo } }
st.orden[1] = "bandido_1#1"
check(C.encargoDelGrupo(grupo) == nil, "el capitulo del bandido no ocupa el cupo del misionero")
check(#C.encargosActivos() == 0, "ni aparece como encargo en el cliente")
check(Director.activos() == 0 and Motor.activos() == 1, "ni ocupa cupo del director")
st.arcos["enc#2"] = { id = "enc#2", def = "encargo_x", vars = { dueno = grupo, contacto = "rosewood" } }
st.orden[2] = "enc#2"
check(C.encargoDelGrupo(grupo) == st.arcos["enc#2"], "el encargo de Misia Rosa si ocupa el cupo")
check(BA.enCurso(), "y el bandido sigue en curso a la vez")

-- Botar el capitulo 1: no vuelve solo enseguida.
st.arcos, st.orden = {}, {}
local lanzados = {}
local lanzarReal = BA.lanzar
BA.lanzar = function(id) lanzados[#lanzados + 1] = id; return {} end
m["knox_bandido_" .. grupo] = "listo"
m.bandido_cap, m.bandido, m.bandido_jefe = 0, nil, nil
m["lugar.bandido_patio"] = { x = 11645, y = 9911, z = 0 }
BA.alTerminar({ def = "bandido_1", vars = {} }, nil, "final_abandonado")
m.bandido_ultimo = "abandonado"
check(m.bandido_abandono_hora == ahora, "queda la hora del abandono")
BA.revisar()
check(#lanzados == 0, "recien botado: no se relanza")
ahora = ahora + 60
BA.revisar()
check(#lanzados == 0, "pasado el enfriamiento, la nota no vuelve sola todavia")
enPatio = true
BA.revisar()
check(lanzados[1] == "bandido_1", "si vuelves al patio, Pereira te ofrece el trabajo")
enPatio = false
lanzados = {}
ahora = ahora + 200
BA.revisar()
check(lanzados[1] == "bandido_1", "una semana despues la nota vuelve sola")
-- Un capitulo cualquiera que no es del bandido no cuenta.
local h = m.bandido_abandono_hora
BA.alTerminar({ def = "encargo_x", vars = {} }, nil, "final_abandonado")
check(m.bandido_abandono_hora == h, "botar un encargo de misionero no toca al bandido")
BA.lanzar = lanzarReal

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
