-- Prueba: los Bell en el refugio (huyen y vuelven), los reemplazos de la reconquista y el
-- curandero de la Chela. Se corre con herramientas/pruebas/correr.py.

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local B, D, C, K = Narrador.Bell, Narrador.Dominios, Narrador.Contactos, Narrador.CampamentosDefs
local reloj, retirados, pedidos, items, avisos, sig = 100, {}, {}, 0, {}, 900
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
Mundo.horas = function() return reloj end
Mundo.azar = function(n) return 1 end
Mundo.log = function() end
Mundo.jugadores = function() return { "p1" } end
Mundo.posicion = function() return 10, 10, 0 end
Mundo.jugadorCerca = function() return "p1" end
Mundo.retirar = function(uid) retirados[#retirados + 1] = uid; return true end
Mundo.actorVivo = function(uid) return true end
Mundo.posicionActor = function() return nil end
Mundo.banderas = function() end
Mundo.nombrarActor = function() end
Mundo.reservarNombres = function() end
Mundo.limpiarZona = function() end
Mundo.crearItem = function(t) return t[1] end
Mundo.dejarEnSuelo = function() items = items + 1 end
Mundo.spawnGrupo = function(j, args, cb) pedidos[#pedidos + 1] = args.profileIds[1]; sig = sig + 1; cb({ actorUids = { sig } }); return true end
Motor.enviar = function(p, cmd, d) if cmd == "aviso" then avisos[#avisos + 1] = d.texto end end
Motor.publicar = function() end
Motor.actualizarPropios = function() end
Motor.minutosDesdeArranque = 1
local st = Motor.estado()
st.memoria = st.memoria or {}
st.residentes = st.residentes or {}

print("1. bell_quedarse: el hijo se transformo")
local inst = { grupos = { familia = { miembros = {
    [11] = { rol = "padre", vivo = true }, [12] = { rol = "madre", vivo = true }, [13] = { rol = "hijo", vivo = false } } } },
    lugares = { refugio = { x = 10, y = 10, z = 0 } }, vars = {} }
Motor.inmediatas.bell_quedarse(inst, { grupo = "familia", lugar = "refugio", charla = "bell_refugio" })
local v = B.vivos()
check(#v == 2 and v[1] == "padre" and v[2] == "madre", "quedan padre y madre (" .. table.concat(v, ",") .. ")")

print("2. llega el aviso de una horda cerca del refugio")
Narrador.Amenazas.st().pendientes = { { x = 60, y = 40, llega = reloj + 0.3 } }
B.tick()
check(#retirados == 2 and st.bell.escondidos ~= nil, "arrancan (retirados " .. #retirados .. ")")
check(avisos[#avisos] == B.AVISO_HUYEN, "aviso de que arrancaron")
reloj = reloj + 20
B.tick()
check(st.bell.escondidos ~= nil and #pedidos == 0, "con la amenaza todavia pendiente no vuelven")
Narrador.Amenazas.st().pendientes = {}
B.tick()
check(st.bell.escondidos == nil and #pedidos == 2 and items == 2, "vuelven con 2 cosas (pedidos " .. #pedidos .. ", items " .. items .. ")")
check(avisos[#avisos] == B.AVISO_VUELVEN, "aviso de que volvieron")

print("3. una oleada de una historia cerca del refugio")
local antes = #retirados
pcall(Mundo.oleada, 30, 30, 0, 5)
B.tick()
check(#retirados == antes + 2, "la oleada tambien los hace arrancar")
reloj = reloj + 20
B.tick()
check(st.bell.escondidos == nil, "pasada la alerta de 1 hora vuelven")
pcall(Mundo.oleada, 5000, 5000, 0, 5)
local antes2 = #retirados
B.tick()
check(#retirados == antes2, "una oleada lejos no los asusta")

print("4. reemplazos en la reconquista")
st.memoria.hija_cabo, st.memoria.lucia, st.memoria.cura_rosewood = "muerta", "muerta", "murio"
check(D.presentacion("muldraugh"):find("Daniel") ~= nil, "antes de reconquistar, el texto ya nombra a Daniel: " .. D.presentacion("muldraugh"))
D.cambiar("muldraugh", "nuevo")
check(st.memoria.nuevo_muldraugh == "bell_padre", "Muldraugh: " .. tostring(st.memoria.nuevo_muldraugh))
check(C.def("muldraugh").nombre == "Daniel", "el contacto de Muldraugh se llama " .. tostring(C.def("muldraugh").nombre))
check(st.bell.miembros.padre == nil, "Daniel deja el refugio")
D.cambiar("riverside", "nuevo")
check(st.memoria.nuevo_riverside == "bell_madre", "Riverside: " .. tostring(st.memoria.nuevo_riverside))
D.cambiar("rosewood", "nuevo")
check(st.memoria.nuevo_rosewood == "forastero", "Rosewood sin Bells libres: " .. tostring(st.memoria.nuevo_rosewood))
check(C.def("rosewood").nombre == K.MERCADERES[1].nombre[1], "el forastero es " .. tostring(C.def("rosewood").nombre) .. " " .. tostring(C.def("rosewood").apellido))
st.memoria.lucia = nil
D.cambiar("westpoint", "nuevo")
check(st.memoria.nuevo_westpoint == nil and C.def("westpoint").nombre == "Eduardo", "West Point sigue con Eduardo")
local t = Motor.texto({ vars = {}, lugares = {}, def = "x" }, "Vuelve {nuevo:riverside}.")
check(t == "Vuelve Yvonne Bell, la de la familia que llego a tu refugio.", t)
check(Narrador.DominiosDefs.perfilLore("nuevo", "riverside", "bell_madre")[1]:find("Yvonne") ~= nil, "el diario muestra el perfil de Yvonne")

print("5. curandero de la Chela")
check(K.persona("curandero", "westpoint", {}).nombre[2] == "Hartmann", "con Hartmann vivo, es Hartmann")
local mem = { cientifico_hartmann = "muerto" }
local p = K.persona("curandero", "westpoint", mem)
check(p.nombre[2] ~= "Hartmann" and mem.mercader_curandero_westpoint ~= nil, "Hartmann muerto: " .. p.nombre[1] .. " " .. p.nombre[2])
check(K.persona("curandero", "muldraugh", mem).nombre[1] == "Rosendo", "otros campamentos siguen con el de siempre")

print("6. memoria con {var} y si_vacia")
local ic = { vars = { contacto = "rosewood" }, lugares = {}, def = "encargo_cura" }
st.memoria.cura_rosewood = nil
Motor.inmediatas.memoria(ic, { clave = "cura_{contacto}", valor = "salvo", si_vacia = true })
Motor.inmediatas.memoria(ic, { clave = "cura_{contacto}", valor = "murio", si_vacia = true })
check(st.memoria.cura_rosewood == "salvo", "queda la primera: " .. tostring(st.memoria.cura_rosewood))

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
