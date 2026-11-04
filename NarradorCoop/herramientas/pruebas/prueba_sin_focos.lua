-- Prueba: "Sin focos", el capitulo 3 de la Misia Rosa con el aviso de Ray y la confesion de Earl.
-- Sin Ray todo sigue como antes; con Ray (desertor = protegido) se sabe hora y lugar, llegan menos
-- y se les puede salir al paso en la curva; si Earl vive, confiesa y Rosa lo perdona o lo echa
-- (earl_tanque, que lee el cap. 5). Tambien una partida que ya estaba en preparar. Se corre con
-- correr.py.
require "Narrador/Arcos/Capitulos"
local Mundo, Motor, G, C, R = Narrador.Mundo, Narrador.Motor, Narrador.Generador, Narrador.Contactos, Narrador.Reputacion
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

-- Mundo de mentira (como en prueba_capitulos.lua).
local ahora = 24 * 50 + 12
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
Mundo.zombiCerca = function() return false end
local px, py = 0, 0
Mundo.posicion = function() return px, py, 0 end
Mundo.jugadorCerca = function(x, y, r)
    if math.sqrt((px - x) ^ 2 + (py - y) ^ 2) <= (r or 35) then return J end
    return nil
end
Mundo.buscarLugar = function(spec)
    return { x = 9000, y = 9000, z = 0, etiqueta = "la casa de " .. tostring(spec.id), sala = "livingroom" }
end
Mundo.buscarItem = function() return nil end
Mundo.crearItem = function(t) return { tipo = type(t) == "table" and t[1] or t } end
local dichos, avisos, hablan = {}, {}, {}
Motor.enviar = function() end
Motor.publicar = function() end
Motor.responder = function() end
Motor.avisar = function(_, t) avisos[#avisos + 1] = t end
C.decir = function(_, texto) dichos[#dichos + 1] = texto end
local decirOriginal = Motor.decir
Motor.decir = function(inst, g, rol, texto) hablan[#hablan + 1] = Motor.texto(inst, texto); return true end
Motor.contarBajas = function() return 0 end

local function dijo(lista, frase)
    for _, d in ipairs(lista) do if tostring(d):find(frase, 1, true) then return true end end
    return false
end

local st = Motor.estado()
local m = st.memoria
local function limpiar()
    st.arcos, st.orden = {}, {}
    dichos, avisos, hablan = {}, {}, {}
    m.historia_rosewood_3, m.estanque_rosewood, m.tanque_ray, m.earl_tanque = nil, nil, nil, nil
end
local eo = C.estado("rosewood")
eo.x, eo.y, eo.z, eo.etiqueta = 8000, 8000, 0, "la gasolinera"
local BOMBA = { x = 8000, y = 8000 }
R.tabla().g1 = { muldraugh = 95, westpoint = 95, riverside = 95, rosewood = 95 }
m.historia_rosewood_1, m.historia_rosewood_2 = true, true

-- Los asaltantes (y Earl) ya aparecieron: el motor de mentira no carga el mundo.
local function asaltantes(inst, vivos)
    inst.grupos.asaltantes = { estado = "listo", nombres = {}, roles = {},
        miembros = { b1 = { rol = "b1", vivo = vivos, causa = vivos and nil or "otro" } } }
end
local function earlListo(inst)
    inst.grupos.earl = { estado = "listo", nombres = {}, roles = { earl = "e1" }, miembros = { e1 = { rol = "earl", vivo = true } } }
end
local function bandidos(inst)
    for _, p in ipairs(inst.pendientes) do
        if p[1] == "bandidos" and p.id == "asaltantes" then return p end
    end
    return nil
end
-- Pasa el tiempo: se hacen las acciones con retraso (avisos, dichos).
local function pasar(horas, inst)
    ahora = ahora + horas
    Motor.procesarPendientes(inst)
end
local function aLas(hora)
    ahora = math.floor(ahora / 24) * 24 + 24 + hora
end

-- ---------------------------------------------------------------------------
-- 1. Sin Ray: como antes (preparar desde las 22, 6 a 8 asaltantes). Earl vive: confiesa.
-- ---------------------------------------------------------------------------
print("1. sin Ray, con Earl")
limpiar()
m.desertor = nil
local o = G.ofertaEspecial("rosewood", "facil", "g1")
check(o ~= nil and o.def == "cap_rosa_3", "con el cap. 2 hecho sale el tanque")
px, py = BOMBA.x, BOMBA.y
local inst = G.iniciarOferta(J, "rosewood", "facil", o)
check(inst ~= nil and inst.etapa == "preparar" and inst.vars.aviso_ray == nil, "sin Ray: preparar, como antes")
pasar(0.2, inst)
check(not dijo(avisos, "Gerald") and not dijo(dichos, "Gerald"), "nadie habla de Gerald")
aLas(23)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "asalto", "a las 23, en la gasolinera: el asalto")
local b = bandidos(inst)
check(b ~= nil and b.cantidad[1] == 6 and b.cantidad[2] == 8, "llegan 6 a 8")
asaltantes(inst, false)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "amanecer" and inst.vars.resultado == "defendido", "defendido; Earl vivo: al amanecer quiere hablar")
earlListo(inst)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "confesion", "Earl confiesa en el mostrador")
pasar(0.2, inst)
check(dijo(hablan, "Tecolote") and dijo(hablan, "whisky"), "Earl cuenta lo del Tecolote y el whisky")
check(dijo(dichos, "Insulina"), "Rosa se entera de la insulina")
Motor.elegir(J, inst.id, "callar")
check(inst.final == "final_cumplido", "nadie se mete: noche defendida, Rosa lo perdona")
pasar(0.2, inst)
check(m.earl_tanque == "perdonado" and dijo(hablan, "Lleno."), "earl_tanque = perdonado; Earl contesta 'Lleno'")
check(m.estanque_rosewood == "defendido" and m.historia_rosewood_3 == true and m.tanque_ray == nil, "estanque defendido, sin aviso de Ray")

-- ---------------------------------------------------------------------------
-- 2. Con Ray: aviso, emboscada en la curva y Rosa echa a Earl.
-- ---------------------------------------------------------------------------
print("2. con Ray: emboscada en la curva")
limpiar()
m.desertor = "protegido"
inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
check(inst.etapa == "preparar_ray" and inst.vars.aviso_ray == true, "con Ray: preparar con el aviso")
check(inst.lugares.curva ~= nil, "la curva de la 31 queda marcada")
pasar(0.2, inst)
check(dijo(avisos, "Aqui Gerald, para el Bencinita") and dijo(avisos, "a las dos"), "Ray avisa por el 19 al Bencinita: hora y lugar")
check(dijo(avisos, "Ray Doyle"), "el jugador reconoce la voz de Ray")
check(dijo(dichos, "el que avisa no es traidor"), "Rosa le contesta con su voz")
local curva = inst.lugares.curva
aLas(0)
px, py = curva.x, curva.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "preparar_ray", "a medianoche todavia no bajan")
aLas(1)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "emboscada" and inst.vars.emboscada == true, "a la una, en la curva: emboscada")
b = bandidos(inst)
check(b ~= nil and b.lugar == "curva" and b.cantidad[2] == 5, "los esperan en la curva: 4 a 5 (Ray espanto a dos)")
asaltantes(inst, false)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "amanecer", "emboscada ganada: al amanecer, Earl")
earlListo(inst)
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "acusar")
check(inst.final == "final_cumplido" and m.earl_tanque == "echado", "le dice que eso no se perdona: Rosa lo echa al camion")
check(m.tanque_ray == "emboscada" and m.estanque_rosewood == "defendido", "tanque_ray = emboscada")
check(dijo(dichos, "dormir a tu camion"), "Rosa lo manda a dormir a Lucille")

-- ---------------------------------------------------------------------------
-- 3. Con Ray, Earl muerto en el cap. 2, y te vas de la gasolinera: saqueado, sin confesion.
-- ---------------------------------------------------------------------------
print("3. con Ray, sin Earl, saqueado")
limpiar()
m.historia_rosewood_2 = "fallido"
m.cura_rosewood = "murio"
px, py = BOMBA.x, BOMBA.y
inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
pasar(0.2, inst)
check(dijo(avisos, "para la senora de la luz prendida") and not dijo(avisos, "Bencinita"),
    "Junior murio: Ray le habla a la senora de la luz")
aLas(2)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "asalto", "a las dos en la gasolinera: el asalto")
b = bandidos(inst)
check(b ~= nil and b.cantidad[1] == 4 and b.cantidad[2] == 5, "con el aviso llegan 4 a 5")
pasar(0.3, inst)
check(dijo(avisos, "tiro seco desde el cerro"), "el tiro al techo de Ray")
asaltantes(inst, true)
px, py = 0, 0
ahora = ahora + 6
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_saqueado" and m.estanque_rosewood == "saqueado", "te fuiste: saqueado, y sin Earl no hay confesion")
check(m.tanque_ray == "aviso" and m.earl_tanque == nil and m.historia_rosewood_3 == "fallido", "tanque_ray = aviso; sin earl_tanque")
m.historia_rosewood_2, m.cura_rosewood = true, nil

-- ---------------------------------------------------------------------------
-- 4. Saqueado con Earl vivo: nadie se mete y Rosa lo echa. Ray ya es el mecanico de Rosewood.
-- ---------------------------------------------------------------------------
print("4. Ray mecanico de Rosewood; saqueado con Earl")
limpiar()
m.ray_mecanico = "rosewood"
px, py = BOMBA.x, BOMBA.y
inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
pasar(0.2, inst)
check(dijo(avisos, "el mecanico del campamento") and not dijo(avisos, "Breaker"), "Ray avisa en persona, no por radio")
check(dijo(dichos, "mi mecanico"), "Rosa lo reconoce: su mecanico")
Motor.entrar(inst, "asalto", 0)
asaltantes(inst, true)
px, py = 0, 0
ahora = ahora + 6
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "amanecer" and inst.vars.resultado == "saqueado", "saqueado: igual Earl quiere hablar")
earlListo(inst)
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "callar")
check(inst.final == "final_saqueado" and m.earl_tanque == "echado", "noche perdida y nadie se mete: Rosa lo echa")
m.ray_mecanico = nil

-- Saqueado y alguien intercede: perdona igual.
limpiar()
inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
Motor.entrar(inst, "saqueo", 0)
earlListo(inst)
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "interceder")
pasar(0.2, inst)
check(inst.final == "final_saqueado" and m.earl_tanque == "perdonado", "intercedes: Rosa lo perdona aunque se llevaron la bencina")
check(dijo(dichos, "Era bencina. Tu no."), "Rosa: era bencina, tu no")

-- ---------------------------------------------------------------------------
-- 5. Partida a medio camino: ya estaba en preparar (sin el aviso de Ray). Nadie vuelve: Earl calla.
-- ---------------------------------------------------------------------------
print("5. partida que ya estaba en preparar")
limpiar()
m.desertor = "protegido"
inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
-- Como una partida de antes: sin las variables nuevas, en la etapa vieja.
inst.vars.aviso_ray, inst.lugares.curva = nil, nil
Motor.entrar(inst, "preparar", 0)
aLas(22)
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "asalto", "la etapa vieja sigue: asalto desde las 22")
b = bandidos(inst)
check(b ~= nil and b.cantidad[2] == 8, "sin el aviso, como antes: 6 a 8")
asaltantes(inst, false)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "amanecer", "defendida: Earl")
px, py = 0, 0
ahora = ahora + 49
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido" and m.earl_tanque == "callado", "nadie vuelve en 48 horas: Earl se lo calla")
check(m.tanque_ray == nil, "sin aviso no queda tanque_ray")

-- ---------------------------------------------------------------------------
-- 6. El cap. 5 lee earl_tanque.
-- ---------------------------------------------------------------------------
print("6. el cap. 5 se acuerda de Earl")
for _, caso in ipairs({ { "perdonado", "El segundo camion es mio" }, { "echado", "no me contestes" }, { "callado", "como si le debiera algo" } }) do
    limpiar()
    m.earl_tanque = caso[1]
    m.historia_rosewood_3, m.historia_rosewood_4 = true, true
    inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
    check(inst ~= nil and inst.def == "cap_rosa_5", "sale el cap. 5")
    Motor.entrar(inst, "marea", 0)
    pasar(0.2, inst)
    check(dijo(avisos, caso[2]), "earl_tanque = " .. caso[1] .. ": '" .. caso[2] .. "'")
    m.earl_tanque = nil
    m.historia_rosewood_4 = nil
end

Motor.decir = decirOriginal
print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
