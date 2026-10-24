-- Prueba: escolta de un rescatado a un misionero ("va solo", NarradorPasajeros). El NPC no te
-- sigue: espera anclado donde esta, se pasa al misionero cuando nadie lo ve y la etapa avanza
-- cuando un jugador llega alla. Se corre con correr.py.
require "Narrador/Arcos/Capitulos"
local Mundo, Motor, P = Narrador.Mundo, Narrador.Motor, Narrador.Pasajeros
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
Mundo.horas = function() return 100 end
Mundo.log = function() end
Motor.enviar = function() end
Motor.publicar = function() end
local avisos = {}
Motor.avisar = function(_, t) avisos[#avisos + 1] = t end

-- A-Life de mentira: solo el registro (el cuerpo no esta cargado).
local actores = { u1 = { uid = "u1", revision = 1, lifecycle = "active", memory = {}, worldPosition = { x = 100, y = 100, z = 0 } } }
ProjectALife = { ActorRegistry = {
    peek = function(uid) return actores[uid] end,
    update = function(uid, rev, f) f(actores[uid]); actores[uid].revision = rev + 1; return actores[uid] end,
} }
local banderas = {}
Mundo.banderas = function(uid, f, ancla) banderas[#banderas + 1] = { uid = uid, f = f, ancla = ancla }; return true end
Mundo.cargado = function() return nil end
local jugador = { x = 102, y = 100 }
Mundo.jugadorCerca = function(x, y, r)
    if jugador.x ~= nil and math.sqrt((jugador.x - x) ^ 2 + (jugador.y - y) ^ 2) <= r then return jugador end
    return nil
end

local st = Motor.estado()
st.arcos, st.orden, st.pasajeros, st.van_solos = {}, {}, {}, {}
local inst = { id = "cap_rosa_2#1", def = "cap_rosa_2", etapa = "escolta", vars = { contacto_nombre = "la Misia Rosa" },
    lugares = { camion = { x = 100, y = 100, z = 0 }, contacto = { x = 500, y = 500, z = 0 } },
    grupos = { earl = { estado = "listo", miembros = { u1 = { rol = "earl", vivo = true } }, roles = { earl = "u1" }, nombres = {},
        accion = { "npcs", id = "earl", lugar = "camion", quietos = true, correa = 4 } } } }
st.arcos[inst.id], st.orden[1] = inst, inst.id

-- Al entrar a la escolta (como en Capitulos.lua): acompanante y banderas sueltas.
Motor.inmediatas.acompanante(inst, { "acompanante", grupo = "earl", rol = "earl", nombre = "El Gordo Earl", inmortal = false })
check(P.vaSolo("u1") ~= nil, "con destino en un misionero, va solo")
check(not P.esAcompanante("u1"), "no queda como acompanante que te sigue")
check(avisos[1] ~= nil and avisos[1]:find("la Misia Rosa", 1, true) ~= nil and avisos[1]:find("Te espera alla", 1, true) ~= nil,
    "aviso claro: " .. tostring(avisos[1]))
banderas = {}
Motor.inmediatas.banderas(inst, { "banderas", grupo = "earl", quietos = false, correa = 0 })
local b = banderas[#banderas]
check(b ~= nil and b.f.stationary == true and b.f.leashRadius == P.CORREA_ESPERA and b.ancla.x == 100,
    "las banderas del grupo no lo sueltan: sigue anclado donde esta")
check(not Motor.condiciones.npc_cerca(inst, { "npc_cerca", "earl", "contacto", 15 }), "todavia no llega")

-- Con el jugador cerca no se mueve.
P.revisarSolos()
check(actores.u1.worldPosition.x == 100, "con alguien cerca, se queda")

-- El jugador se va lejos: se pasa al lado de la Misia Rosa.
jugador.x, jugador.y = 300, 300
P.revisarSolos()
local pos = actores.u1.worldPosition
check(math.abs(pos.x - 500) <= 3 and math.abs(pos.y - 500) <= 3, "sin nadie cerca, aparece junto al misionero")
check(P.vaSolo("u1").llego == true, "queda como llegado")
check(inst.grupos.earl.accion.ancla_pos ~= nil and inst.grupos.earl.accion.ancla_pos.x == pos.x, "el repaso del grupo lo deja en el destino")
banderas = {}
Motor.banderasGrupo(inst, inst.grupos.earl)
check(banderas[1] ~= nil and banderas[1].ancla.x == pos.x and banderas[1].f.stationary == true, "repaso: anclado en el destino")
check(not Motor.condiciones.npc_cerca(inst, { "npc_cerca", "earl", "contacto", 15 }), "la etapa espera a que llegue un jugador")

-- El jugador llega donde la Misia Rosa: avanza.
jugador.x, jugador.y = 510, 505
check(Motor.condiciones.npc_cerca(inst, { "npc_cerca", "earl", "contacto", 15 }), "con el jugador alla, la etapa avanza")

-- Soltarlo: queda en el destino, no vuelve al camion.
banderas = {}
Motor.inmediatas.soltar_acompanante(inst, { "soltar_acompanante", grupo = "earl", rol = "earl" })
check(P.vaSolo("u1") == nil, "soltado")
local a = inst.grupos.earl.accion
check(a.ancla_pos.x == pos.x and a.correa == P.CORREA_DESTINO and a.quietos == false, "queda en el destino con correa")
banderas = {}
Motor.banderasGrupo(inst, inst.grupos.earl)
check(banderas[1] ~= nil and banderas[1].ancla.x == pos.x, "el repaso ya no lo devuelve a donde aparecio")

-- Una escolta que no va a un misionero (los amigos de Sous a la base) sigue al jugador.
local inst2 = { id = "otro#1", def = "no_existe", etapa = "x", vars = {}, lugares = {},
    grupos = { g = { estado = "listo", miembros = { u1 = { rol = "r", vivo = true } }, roles = { r = "u1" }, nombres = {} } } }
check(P.destinoDe(inst2, { grupo = "g", rol = "r" }) == nil, "sin destino misionero: te sigue")
check(P.destinoDe(inst, { grupo = "earl", rol = "earl", seguir = true }) == nil, "seguir = true obliga a seguir")
ProjectALife = nil

if fallos == 0 then print("TODO BIEN") else print("FALLOS: " .. fallos) end
