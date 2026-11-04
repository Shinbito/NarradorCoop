-- Prueba: las misiones del Padre Nacho que salieron del rol. La despensa (dentro del cap. 2), Eli
-- Danner (antes del cap. 3) y el chico de los sacos (despues del cap. 3), de punta a punta y con
-- sus ramas, y lo que leen despues los capitulos 3 y 4. Tambien la accion reserva_campamento, los
-- que van a "Los que ya no estan" y el cambio de Tomasito Salinas. Se corre con correr.py.
require "Narrador/Arcos/Capitulos"
require "Narrador/Arcos/MisionesRiverside"
local Mundo, Motor, G, C, R, Defs, Lore = Narrador.Mundo, Narrador.Motor, Narrador.Generador, Narrador.Contactos,
    Narrador.Reputacion, Narrador.Defs, Narrador.Lore
local K, CD = Narrador.Campamentos, Narrador.CaidosDefs
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

-- ---------------------------------------------------------------------------
-- Mundo de mentira (como en prueba_capitulos.lua)
-- ---------------------------------------------------------------------------
local ahora = 24 * 40 + 10
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
Mundo.zombiCerca = function() return true end
local px, py = 0, 0
Mundo.posicion = function() return px, py, 0 end
Mundo.jugadorCerca = function(x, y, r)
    if math.sqrt((px - x) ^ 2 + (py - y) ^ 2) <= (r or 35) then return J end
    return nil
end
local lugares = {}
local buscados = {}
Mundo.buscarLugar = function(spec)
    buscados[#buscados + 1] = spec
    local l = lugares[spec.id] or { x = 5000, y = 5000 }
    return { x = l.x, y = l.y, z = 0, etiqueta = tostring(spec.nombre or spec.id), sala = "church" }
end
local tiene = {}
Mundo.tieneEtiqueta = function(it, etiqueta) return it.etiqueta == etiqueta end
Mundo.buscarItem = function(_, f)
    for _, it in ipairs(tiene) do if f(it) then return it, {} end end
    return nil
end
Mundo.quitarItem = function() end
Mundo.darItem = function() end
Mundo.crearItem = function(t) return { tipo = type(t) == "table" and t[1] or t, getModData = function() return {} end } end
local IGLESIA = { x = 6000, y = 6000 }
-- Donde estan los NPC (lejos, salvo cuando la prueba dice que llegaron a la iglesia).
local ax, ay = -9999, -9999
Mundo.posicionActor = function() return ax, ay end
local function llegan() ax, ay = IGLESIA.x + 2, IGLESIA.y end
local dichos, hablan, avisos = {}, {}, {}
Motor.enviar = function() end
Motor.publicar = function() end
Motor.responder = function() end
Motor.avisar = function(_, t) avisos[#avisos + 1] = t end
C.decir = function(id, texto) dichos[#dichos + 1] = texto end
Motor.decir = function(inst, g, rol, texto) hablan[#hablan + 1] = Motor.texto(inst, texto); return true end
local bajas = 0
Motor.contarBajas = function() return bajas end
local guardias = {}
K.sumarSalvado = function(cid, persona) guardias[#guardias + 1] = { cid, persona.nombre, persona.perfil, persona.esperar } end

local function dijo(lista, pedazo)
    for _, d in ipairs(lista) do if tostring(d):find(pedazo, 1, true) then return true end end
    return false
end
-- Pasa un rato: corren las acciones con retraso (lo que se dice un poco despues).
local function pasa(inst, h)
    ahora = ahora + (h or 0.2)
    Motor.procesarPendientes(inst)
end
local function pendiente(inst, tipo, id)
    for _, p in ipairs(inst.pendientes) do
        if p[1] == tipo and (id == nil or p.id == id or p.grupo == id) then return p end
    end
    return nil
end
local function grupo(inst, id, roles)
    local g = { estado = "listo", nombres = {}, roles = {}, miembros = {} }
    for rol, vivo in pairs(roles) do
        g.roles[rol] = id .. "_" .. rol
        g.miembros[id .. "_" .. rol] = { rol = rol, vivo = vivo }
    end
    inst.grupos[id] = g
    return g
end

local st = Motor.estado()
local m = st.memoria
local function limpiar()
    st.arcos, st.orden = {}, {}
    dichos, hablan, avisos, guardias, tiene, bajas, buscados = {}, {}, {}, {}, {}, 0, {}
    ax, ay = -9999, -9999
end
local er = C.estado("riverside")
er.x, er.y, er.z, er.etiqueta = IGLESIA.x, IGLESIA.y, 0, "la iglesia"
R.tabla().g1 = { muldraugh = 95, westpoint = 95, riverside = 95, rosewood = 95 }
m.historia_riverside_1 = true

-- ---------------------------------------------------------------------------
-- 1. La despensa (cap. 2 del Padre)
-- ---------------------------------------------------------------------------
-- Del reto hasta que Duggan llega al atrio; devuelve el arco en despensa_aviso.
local function hastaElAtrio()
    limpiar()
    m.historia_riverside_2, m.despensa_riverside, m.curtis = nil, nil, nil
    local o = G.ofertaEspecial("riverside", "facil", "g1")
    lugares.guarida = { x = 6500, y = 6000 }
    px, py = IGLESIA.x, IGLESIA.y
    local inst = G.iniciarOferta(J, "riverside", "facil", o)
    px, py = 6500, 6000
    Motor.revisarSalidas(inst, 0)
    grupo(inst, "duggan", { duggan = true })
    Motor.revisarSalidas(inst, 0)
    Motor.elegir(J, inst.id, "reto")
    grupo(inst, "matones", { m1 = false, m2 = false, m3 = false })
    Motor.revisarSalidas(inst, 0)
    px, py = IGLESIA.x, IGLESIA.y
    ahora = 24 * 41 + 20
    Motor.revisarSalidas(inst, 0)
    grupo(inst, "duggan_ring", { duggan = true })
    Motor.revisarSalidas(inst, 0)
    pasa(inst, 0.06)
    return inst, o
end

local inst, o = hastaElAtrio()
check(o ~= nil and o.def == "cap_nacho_2", "sale el cap. 2 del Padre")
check(inst.etapa == "despensa_aviso", "Duggan en el atrio: aviso de la despensa (" .. tostring(inst.etapa) .. ")")
check(dijo(hablan, "Curtis no vino"), "Duggan echa de menos a Curtis")
check(dijo(dichos, "alguien tiene que mirar"), "el Padre pide que alguien mire, sin nombrar la despensa")
check(not dijo(dichos, "despensa"), "el Padre no dice nada de la despensa (secreto de confesion)")
local comidaAntes = K.estado("riverside").reservas.comida
Motor.elegir(J, inst.id, "mirar")
check(inst.etapa == "round" and inst.vars.despensa == "mirar", "mira la pelea")
ahora = ahora + 0.3
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido" and m.historia_riverside_2 == true, "final_cumplido, capitulo hecho")
check(m.despensa_riverside == "robada" and m.curtis == nil, "la despensa queda robada")
pasa(inst, 0.1)
check(dijo(avisos, "Curtis Mabry y dos mas se llevaron las latas"), "Ruth descubre el robo")
check(dijo(dichos, "Dios da y Curtis quita"), "el Padre lo agradece: tuvo testigo")
check(K.estado("riverside").reservas.comida == math.max(0, comidaAntes - 25), "Riverside queda con menos comida (reserva_campamento)")
check(Lore.final("cap_nacho_2", "final_cumplido") ~= nil
    and Motor.texto(inst, Lore.final("cap_nacho_2", "final_cumplido")):find("Curtis", 1, true) ~= nil, "el diario cuenta lo de la despensa")

-- Sin elegir: a la media hora empieza la pelea (cuenta como mirar).
inst = hastaElAtrio()
ahora = ahora + 0.6
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "round" and inst.vars.despensa == "mirar", "si no elige, la pelea empieza igual")

-- Ir a la despensa y llevar a Curtis a cargar agua.
inst = hastaElAtrio()
Motor.elegir(J, inst.id, "despensa")
check(inst.etapa == "despensa" and inst.vars.despensa == "defender", "va a la despensa")
check(pendiente(inst, "npcs", "curtis") ~= nil and pendiente(inst, "bandidos", "ladrones") ~= nil, "Curtis y sus ladrones en la despensa")
local d = inst.lugares.despensa
check(d ~= nil and math.sqrt((d.x - IGLESIA.x) ^ 2 + (d.y - IGLESIA.y) ^ 2) > 12, "la despensa queda fuera del atrio")
px, py = d.x, d.y
grupo(inst, "curtis", { curtis = true })
grupo(inst, "ladrones", { l1 = false, l2 = false })
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "curtis", "caen los ladrones: hablar con Curtis")
Motor.elegir(J, inst.id, "agua")
check(inst.etapa == "vuelta" and inst.vars.curtis == "agua", "Curtis va a cargar agua")
px, py = IGLESIA.x, IGLESIA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "relato", "vuelve al atrio: le cuentan la pelea")
check(dijo(hablan, "Llegas tarde. Igual que el arbitro de Lexington"), "Duggan: llegas tarde")
pasa(inst, 0.06)
check(dijo(dichos, "Le gane, hijo") and dijo(dichos, "Te pedi que miraras"), "el Padre cuenta que gano y lo resiente un poco")
ahora = ahora + 0.2
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido_despensa" and m.historia_riverside_2 == true, "final_cumplido_despensa, capitulo hecho")
check(m.despensa_riverside == "defendida" and m.curtis == "agua", "despensa defendida, Curtis carga agua")
pasa(inst, 0.05)
check(dijo(dichos, "Yo no te lo podia pedir"), "el Padre lo entiende: no se lo podia pedir")
check(#guardias == 1 and guardias[1][1] == "riverside" and guardias[1][2] == "Curtis", "Curtis queda de guardia en la iglesia")

-- Matar a Curtis: el Padre lo resiente.
inst = hastaElAtrio()
Motor.elegir(J, inst.id, "despensa")
grupo(inst, "ladrones", { l1 = false })
local gc = grupo(inst, "curtis", { curtis = false })
gc.miembros.curtis_curtis.causa = "jugador"
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "relato" and inst.vars.curtis == "mataste", "mataste a Curtis (y vuelves al atrio)")
ahora = ahora + 0.2
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido_despensa" and m.curtis == "muerto", "Curtis muerto")
pasa(inst, 0.05)
check(dijo(dichos, "no una tumba") or dijo(dichos, "No una tumba"), "el Padre: al que esta en el suelo se le da la mano o un balde")
check(#guardias == 0, "nadie queda de guardia")

-- Echarlo.
inst = hastaElAtrio()
Motor.elegir(J, inst.id, "despensa")
grupo(inst, "curtis", { curtis = true })
grupo(inst, "ladrones", { l1 = false })
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "echar")
check(inst.etapa == "relato" or inst.etapa == "vuelta", "echa a Curtis y vuelve")
ahora = ahora + 0.2
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido_despensa" and m.curtis == "echado" and pendiente(inst, "retirar_lejos", "curtis") ~= nil,
    "Curtis echado de Riverside")

-- Partida de antes de la despensa: ya iba en "round" sin la variable. Termina como antes.
limpiar()
m.historia_riverside_2, m.despensa_riverside, m.curtis = nil, nil, nil
inst = G.iniciarOferta(J, "riverside", "facil", G.ofertaEspecial("riverside", "facil", "g1"))
inst.vars.despensa = nil
Motor.entrar(inst, "round", 0)
ahora = ahora + 0.3
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido" and m.historia_riverside_2 == true and m.despensa_riverside == nil,
    "partida a medio camino: termina igual que antes, sin memoria de la despensa")
check(dijo(st.diario, "") and Motor.texto(inst, Lore.final("cap_nacho_2", "final_cumplido")):find("vino de misa", 1, true) ~= nil,
    "con el texto de siempre")

-- ---------------------------------------------------------------------------
-- 2. Eli Danner (antes del cap. 3)
-- ---------------------------------------------------------------------------
local SJ = { x = 9900, y = 12600 }
local function empezarEli()
    limpiar()
    m.historia_riverside_2, m.historia_riverside_3, m.eli_danner, m["lugar.san_judas"] = true, nil, nil, nil
    lugares.san_judas = SJ
    px, py = IGLESIA.x, IGLESIA.y
    local of = G.ofertaEspecial("riverside", "facil", "g1")
    return G.iniciarOferta(J, "riverside", "facil", of), of
end

local of
inst, of = empezarEli()
check(of ~= nil and of.def == "mision_eli" and of.vars.nivel == "medio", "despues del cap. 2 el Padre ofrece primero lo de Eli")
check(of.titulo:find("Eli Danner", 1, true) ~= nil, "con su titulo de mision: " .. tostring(of.titulo))
check(inst ~= nil and inst.etapa == "viaje" and inst.relojes.patio ~= nil, "arranca con un dia y medio de plazo")
check(type(m["lugar.san_judas"]) == "table" and m["lugar.san_judas"].x == SJ.x, "guarda San Judas para el cap. 3")
check(buscados[1] ~= nil and buscados[1].pueblo == "March Ridge", "San Judas esta en March Ridge")
check(dijo(dichos, "Diacono") and dijo(dichos, "corregir la lista"), "el Padre lo supo por la predica de Reyes")
px, py = SJ.x, SJ.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "san_judas", "llega a tiempo a San Judas")
local pl = pendiente(inst, "npcs", "lucia")
check(pl ~= nil and pl.inmortales == true, "Lucia no puede morir aca (la necesita el cap. 3)")
grupo(inst, "lucia", { lucia = true })
grupo(inst, "eli", { eli = true })
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "puerta" and dijo(hablan, "Lo mando a usted"), "Lucia: le dije que no mandara a nadie")
Motor.elegir(J, inst.id, "avisar")
check(inst.etapa == "patio" and pendiente(inst, "bandidos", "patio") ~= nil, "suben los del patio")
check(inst.relojes.patio.activo == false, "se detiene el reloj")
grupo(inst, "patio", { cabo = false, soldado = false, bandido = false })
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "despues", "caen los del patio")
Motor.elegir(J, inst.id, "quedarse")
check(inst.etapa == "volver", "Eli se queda con Lucia")
px, py = IGLESIA.x, IGLESIA.y
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_cumplido_salvado" and m.eli_danner == "salvado", "final: Eli salvado")
check(pendiente(inst, "pago_encargo") ~= nil, "pago al volver con el Padre")

-- El cap. 3 lee la mision: misma iglesia y Lucia confia.
o = G.ofertaEspecial("riverside", "facil", "g1")
check(o ~= nil and o.def == "cap_nacho_3", "con lo de Eli hecho sale el cap. 3")
lugares.iglesia = { x = 1, y = 1 }
dichos = {}
local i3 = G.iniciarOferta(J, "riverside", "facil", o)
pasa(i3, 0.06)
check(i3.lugares.iglesia.x == SJ.x and i3.lugares.iglesia.y == SJ.y, "el cap. 3 vuelve a San Judas")
check(i3.vars.eli_danner == "salvado" and dijo(dichos, "a ti te abre"), "el Padre: despues de lo de Eli, a ti te abre")
px, py = SJ.x, SJ.y
Motor.revisarSalidas(i3, 0)
check(i3.etapa == "iglesia", "llega a San Judas")
grupo(i3, "lucia", { lucia = true })
Motor.revisarSalidas(i3, 0)
check(i3.etapa == "hablar", "Lucia confia: sale a recibirte sin esperar a que limpies")
check(dijo(hablan, "Eli le guardo la banca"), "Lucia: Eli le guardo la banca de adelante")
Motor.elegir(J, i3.id, "convencer")
check(i3.etapa == "escolta" and dijo(hablan, "Eli se queda cuidando la puerta"), "Lucia va; Eli cuida la puerta")

-- Llevar a Eli a Riverside.
inst = empezarEli()
px, py = SJ.x, SJ.y
Motor.revisarSalidas(inst, 0)
grupo(inst, "lucia", { lucia = true })
grupo(inst, "eli", { eli = true })
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "avisar")
grupo(inst, "patio", { cabo = false, soldado = false, bandido = false })
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "riverside")
check(inst.etapa == "escolta", "Eli va a Riverside")
px, py = IGLESIA.x, IGLESIA.y
llegan()
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido_riverside" and m.eli_danner == "riverside", "Eli llega con el Padre")
check(#guardias == 1 and guardias[1][2] == "Eli", "Eli queda de guardia en la iglesia de Riverside")
check(dijo(dichos, "sin signo de pregunta"), "el Padre lo anota sin signo de pregunta")

-- Eli muere en la pelea.
inst = empezarEli()
px, py = SJ.x, SJ.y
Motor.revisarSalidas(inst, 0)
grupo(inst, "lucia", { lucia = true })
grupo(inst, "eli", { eli = true })
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "avisar")
inst.grupos.eli.miembros.eli_eli.vivo = false
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_muerto" and m.eli_danner == "muerto", "Eli muere: final_muerto")
check(dijo(hablan, "al lado de los tomates"), "Lucia lo entierra al lado de los tomates")

-- Llegar tarde.
inst = empezarEli()
ahora = ahora + 40
px, py = SJ.x, SJ.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "tarde" and pendiente(inst, "nota") ~= nil, "llega tarde: un papel en la puerta")
grupo(inst, "lucia", { lucia = true })
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "tarde_hablar" and dijo(hablan, "Usted llego tarde"), "Lucia: usted llego tarde")
ahora = ahora + 0.2
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_tarde" and m.eli_danner == "tarde", "final_tarde")
o = G.ofertaEspecial("riverside", "facil", "g1")
hablan, dichos = {}, {}
i3 = G.iniciarOferta(J, "riverside", "facil", o)
pasa(i3, 0.06)
check(dijo(dichos, "llegamos tarde"), "el cap. 3 empieza distinto: con Eli llegamos tarde")
px, py = SJ.x, SJ.y
Motor.revisarSalidas(i3, 0)
grupo(i3, "lucia", { lucia = true })
Motor.revisarSalidas(i3, 0)
check(i3.etapa == "iglesia", "sin Eli, Lucia no sale hasta que se calme")
ahora = ahora + 1.1
Motor.revisarSalidas(i3, 0)
check(i3.etapa == "hablar" and dijo(hablan, "Usted llego tarde"), "Lucia te recibe con lo de Eli")

-- No ir nunca, o abandonarla: no traba el cap. 3.
inst = empezarEli()
ahora = ahora + 97
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_no_fue" and m.eli_danner == "tarde", "nunca fue a San Judas: final_no_fue")
inst = empezarEli()
R.abandonar(J, {})
check(inst.final == "final_abandonado" and m.eli_danner == "tarde", "abandonar deja la memoria (no se vuelve a ofrecer)")
check(G.ofertaEspecial("riverside", "facil", "g1").def == "cap_nacho_3", "y sale el cap. 3")
-- Con el cap. 3 hecho ya no sale (partidas que iban adelante).
m.eli_danner, m.historia_riverside_3 = nil, true
o = G.ofertaEspecial("riverside", "facil", "g1")
check(o == nil or o.def ~= "mision_eli", "despues del cap. 3 ya no se ofrece lo de Eli")

-- ---------------------------------------------------------------------------
-- 3. El chico de los sacos (despues del cap. 3)
-- ---------------------------------------------------------------------------
local PAN, TERMINAL = { x = 6200, y = 5900 }, { x = 13000, y = 2400 }
local function empezarTomas(lucia)
    limpiar()
    m.historia_riverside_3, m.historia_riverside_4, m.tomas, m.lucia = true, nil, nil, lucia
    lugares.panaderia, lugares.terminal = PAN, TERMINAL
    px, py = IGLESIA.x, IGLESIA.y
    local of2 = G.ofertaEspecial("riverside", "facil", "g1")
    return G.iniciarOferta(J, "riverside", "facil", of2), of2
end
-- De la panaderia a hablar con Tomas en la terminal.
local function hastaTomas(inst2)
    px, py = PAN.x, PAN.y
    Motor.revisarSalidas(inst2, 0)
    tiene[1] = { etiqueta = inst2.id .. ":horario" }
    Motor.revisarSalidas(inst2, 0)
    px, py = TERMINAL.x, TERMINAL.y
    Motor.revisarSalidas(inst2, 0)
    grupo(inst2, "tomas", { tomas = true })
    inst2.vars.meta_terminal = 20
    bajas = 20
    Motor.revisarSalidas(inst2, 0)
end

inst, of = empezarTomas("en_riverside")
pasa(inst, 0.07)
check(of ~= nil and of.def == "mision_tomas" and of.vars.nivel == "dificil", "despues del cap. 3 el Padre ofrece primero lo de Tomas")
check(inst.etapa == "viaje" and dijo(dichos, "Tom de los sacos") and dijo(dichos, "Lucia lo canta"), "el Padre cuenta lo del Tom de los sacos")
check(buscados[1] ~= nil and buscados[1].pueblo == "Riverside", "la panaderia Hollis esta en Riverside")
px, py = PAN.x, PAN.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "panaderia" and pendiente(inst, "nota") ~= nil and pendiente(inst, "objeto", "horario") ~= nil,
    "en la panaderia: el casillero y el horario del Greyhound")
check(pendiente(inst, "nota").texto:find("5:40", 1, true) ~= nil, "con la salida de las 5:40 marcada")
tiene[1] = { etiqueta = inst.id .. ":horario" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "viaje_terminal" and inst.lugares.terminal ~= nil, "con el horario: a la terminal del Greyhound")
check(buscados[#buscados].pueblo == "Louisville", "la terminal esta en Louisville")
px, py = TERMINAL.x, TERMINAL.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "terminal" and pendiente(inst, "npcs", "tomas") ~= nil, "en la terminal esta Tomas, rodeado")
grupo(inst, "tomas", { tomas = true })
inst.vars.meta_terminal = 20
bajas = 20
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar" and dijo(hablan, "el de las 5:40"), "Tomas: me vine en el de las 5:40")
local def = Defs.get("mision_tomas")
local ops = {}
for _, op in ipairs(def.etapas.hablar.opciones) do ops[op.id] = Motor.opcionVisible(inst, op) end
check(ops.lucia == true and ops.padre == false, "con Lucia en Riverside se le puede decir que esta viva")
Motor.elegir(J, inst.id, "lucia")
check(inst.etapa == "escolta", "Tomas va a Riverside")
px, py = IGLESIA.x, IGLESIA.y
llegan()
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "llegada" and pendiente(inst, "npcs", "lucia") ~= nil, "llega a la iglesia: sale Lucia")
check(dijo(dichos, "Le borro el signo de pregunta"), "el Padre le borra el signo de pregunta")
grupo(inst, "lucia", { lucia = true })
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "reencuentro" and dijo(hablan, "yo tambien me fui un domingo"), "Lucia: tenias razon, yo tambien me fui un domingo")
ahora = ahora + 0.2
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido_vivo" and m.tomas == "vivo", "final: Tomas vivo")
check(#guardias == 1 and guardias[1][2] == "Tomas", "Tomas se queda en la iglesia")
check(Motor.texto(inst, Lore.final("mision_tomas", "final_cumplido_vivo")):find("escalera", 1, true) ~= nil, "el diario cuenta el reencuentro")

-- El cap. 4 lee a Tomas, la despensa y a Curtis.
m.despensa_riverside, m.curtis = "robada", "agua"
o = G.ofertaEspecial("riverside", "facil", "g1")
check(o ~= nil and o.def == "cap_nacho_4", "con lo de Tomas hecho sale el cap. 4")
local i4 = G.iniciarOferta(J, "riverside", "facil", o)
dichos, avisos = {}, {}
Motor.entrar(i4, "esperar", 0)
ahora = ahora + 0.1
Motor.procesarPendientes(i4)
check(dijo(dichos, "Tomas dice que el no entra a misa"), "el Padre: Tomas dice que no entra a misa")
check(dijo(dichos, "despensa sigue flaca"), "el Padre: la despensa sigue flaca desde la noche de Curtis")
Motor.entrar(i4, "misa", 0)
ahora = ahora + 0.2
Motor.procesarPendientes(i4)
check(dijo(avisos, "Tomas Ferrada no se queda en la escalera") and dijo(avisos, "al lado de su hermana"), "en la misa Tomas entra y se sienta con su hermana")
check(dijo(avisos, "seis latas"), "las seis latas del tercer escalon")
check(dijo(avisos, "Curtis Mabry deja dos baldes"), "Curtis carga agua en la misa")

-- Tomas muere en el camino: tumba.
inst = empezarTomas("en_riverside")
hastaTomas(inst)
Motor.elegir(J, inst.id, "lucia")
inst.grupos.tomas.miembros.tomas_tomas.vivo = false
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_tumba" and m.tomas == "tumba", "Tomas muere: final_tumba")
check(dijo(dichos, "Con nombre"), "el Padre le pone cruz, con nombre")
check(Motor.texto(inst, Lore.final("mision_tomas", "final_tumba")):find("cruz", 1, true) ~= nil, "el diario lo cuenta")
i4 = G.iniciarOferta(J, "riverside", "facil", G.ofertaEspecial("riverside", "facil", "g1"))
avisos = {}
Motor.entrar(i4, "misa", 0)
ahora = ahora + 0.2
Motor.procesarPendientes(i4)
check(dijo(avisos, "Esta vez con cruz, y con nombre"), "en la misa el Padre lee su nombre con cruz")

-- Lucia murio en el cap. 3: se le dice que el Padre lo espera, y el Padre le cuenta.
inst = empezarTomas("muerta")
pasa(inst, 0.07)
check(dijo(dichos, "A Lucia la enterramos con la tarjeta"), "sin Lucia el Padre lo hace por ella")
hastaTomas(inst)
ops = {}
for _, op in ipairs(def.etapas.hablar.opciones) do ops[op.id] = Motor.opcionVisible(inst, op) end
check(ops.lucia == false and ops.padre == true, "sin Lucia: decirle que el Padre lo espera")
Motor.elegir(J, inst.id, "padre")
px, py = IGLESIA.x, IGLESIA.y
llegan()
Motor.revisarSalidas(inst, 0)
pasa(inst, 0.05)
check(inst.final == "final_cumplido_vivo" and pendiente(inst, "npcs", "lucia") == nil, "llega y termina, sin Lucia")
check(dijo(dichos, "Esta enterrada atras"), "el Padre le cuenta lo de su hermana")
check(Motor.texto(inst, Lore.final("mision_tomas", "final_cumplido_vivo")):find("tumba de su hermana", 1, true) ~= nil,
    "el diario: lo llevo a la tumba de su hermana")

-- Nunca llegar a la terminal.
inst = empezarTomas("en_riverside")
px, py = PAN.x, PAN.y
Motor.revisarSalidas(inst, 0)
tiene[1] = { etiqueta = inst.id .. ":horario" }
Motor.revisarSalidas(inst, 0)
ahora = ahora + 121
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_sin_rastro" and m.tomas == "sin_rastro", "sin ir a la terminal: sigue con signo de pregunta")
check(G.ofertaEspecial("riverside", "facil", "g1").def == "cap_nacho_4", "y sale el cap. 4 (no se traba)")
i4 = G.iniciarOferta(J, "riverside", "facil", G.ofertaEspecial("riverside", "facil", "g1"))
avisos = {}
Motor.entrar(i4, "misa", 0)
ahora = ahora + 0.2
Motor.procesarPendientes(i4)
check(dijo(avisos, "tu hermana esta aqui"), "en la misa Lucia sigue cantando su recado")

-- ---------------------------------------------------------------------------
-- 4. Diario, Los que ya no estan y Tomasito Salinas
-- ---------------------------------------------------------------------------
for _, id in ipairs({ "mision_eli", "mision_tomas" }) do
    local sinLore = {}
    for nombre, etapa in pairs(Defs.get(id).etapas) do
        if etapa.final and Lore.final(id, nombre) == nil then sinLore[#sinLore + 1] = nombre end
        if not etapa.final and etapa.pista ~= nil and Lore.etapa(id, nombre) == nil then sinLore[#sinLore + 1] = nombre end
    end
    check(#sinLore == 0, id .. ": diario en cada etapa y final " .. table.concat(sinLore, ", "))
end
check(CD.deArco("cap_nacho_2", "curtis") ~= nil and CD.deArco("mision_eli", "eli") ~= nil
    and CD.deArco("mision_tomas", "tomas") ~= nil, "Curtis, Eli y Tomas en Los que ya no estan")
check(CD.deArco("bandido_3", "hijo").nombre == "Pablito Salinas", "el chico de los Salinas ya no se llama Tomas")
local gs = { nombres = { hijo = { "Tomasito", "Salinas" } }, miembros = { u = { rol = "hijo", nombre = "Tomasito" } } }
Motor.corregirNombres(gs)
check(gs.nombres.hijo[1] == "Pablito" and gs.miembros.u.nombre == "Pablito", "partidas guardadas: Tomasito pasa a Pablito")
-- reserva_campamento no pasa de 0 a 100 y no hace nada con monedas que no existen.
local k = K.estado("riverside")
k.reservas.comida = 10
Motor.inmediatas.reserva_campamento({ vars = {} }, { "reserva_campamento", contacto = "riverside", moneda = "comida", cantidad = -25 })
check(k.reservas.comida == 0, "la reserva no baja de 0")
Motor.inmediatas.reserva_campamento({ vars = { contacto = "riverside" } }, { "reserva_campamento", moneda = "comida", cantidad = 150 })
check(k.reservas.comida == 100, "sin contacto usa el del arco, y no pasa de 100")
check(Motor.inmediatas.reserva_campamento({ vars = {} }, { "reserva_campamento", contacto = "riverside", moneda = "oro", cantidad = 5 }) == true
    and k.reservas.oro == nil, "una moneda que no existe no hace nada")

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
