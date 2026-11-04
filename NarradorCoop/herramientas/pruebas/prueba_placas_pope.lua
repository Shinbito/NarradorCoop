-- Prueba: "Las placas de Pope" (Arcos/PlacasPope.lua). Cuando la elige el director (Ray escondido
-- y sin campamento), de punta a punta: Loretta viva o no, con o sin las placas, Ray muerto en el
-- camino, Ray que se va caminando, el que mata a Ray o a Loretta. Al final Ray queda de mecanico
-- en un campamento (oficio_campamento y K.persona). Se corre con correr.py.
require "Narrador/Arcos/PlacasPope"
require "Narrador/Arcos/ConsecuenciasExtra"
require "Narrador/Arcos/EventosCortos"
local Mundo, Motor, C, Defs, Lore = Narrador.Mundo, Narrador.Motor, Narrador.Contactos, Narrador.Defs, Narrador.Lore
local Director, S, K, CD = Narrador.Director, Narrador.Campamentos, Narrador.CampamentosDefs, Narrador.CaidosDefs
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

local ahora = 24 * 30
local J = { nombre = "Shinbito" }
local REFUGIO = { x = 100, y = 100, z = 0, etiqueta = "tu refugio", radio = 20 }
Mundo.horas = function() return ahora end
Mundo.log = function() end
Mundo.hayALife = function() return true end
Mundo.sandbox = function(_, d) return d end
Mundo.jugadores = function() return { J } end
Mundo.jugadorAlAzar = function() return J end
Mundo.nombreJugador = function() return "Shinbito" end
Mundo.grupoDe = function() return "g1", "Los de prueba" end
Mundo.jugadorConRefugio = function() return J, REFUGIO end
Mundo.vivo = function() return true end
local retirados = {}
Mundo.retirar = function(uid) retirados[#retirados + 1] = uid; return true end
Mundo.azar = function() return 1 end
Mundo.puebloCercano = function() return nil end
Mundo.cargado = function() return nil end
Mundo.zombiCerca = function() return false end
Mundo.actorVivo = function() return true end
Mundo.banderas = function() return true end
Mundo.acompanar = function() return true end
Mundo.posicionActor = function() return nil end
local px, py = REFUGIO.x, REFUGIO.y
Mundo.posicion = function() return px, py, 0 end
Mundo.jugadorCerca = function(x, y, r)
    if math.sqrt((px - x) ^ 2 + (py - y) ^ 2) <= (r or 35) then return J end
    return nil
end
local CASA = { x = 12100, y = 2300 }
local buscado
Mundo.buscarLugar = function(spec)
    buscado = spec
    return { x = CASA.x, y = CASA.y, z = 0, etiqueta = "una casa del West End de Louisville", sala = "livingroom" }
end
local tiene, dados = {}, {}
Mundo.nombrar = function(it, nombre, etiqueta) it.nombre, it.etiqueta = nombre, etiqueta end
Mundo.tieneEtiqueta = function(it, etiqueta) return it.etiqueta == etiqueta end
Mundo.buscarItem = function(_, f)
    for _, it in ipairs(tiene) do if f(it) then return it, {} end end
    return nil
end
Mundo.quitarItem = function(_, it)
    for i, x in ipairs(tiene) do if x == it then table.remove(tiene, i) end end
end
Mundo.darItem = function(_, it) dados[#dados + 1] = it; tiene[#tiene + 1] = it end
Mundo.crearItem = function(t) return { tipo = type(t) == "table" and t[1] or t } end
local avisos, hablan = {}, {}
Motor.enviar = function() end
Motor.publicar = function() end
Motor.responder = function() end
Motor.avisar = function(_, t) avisos[#avisos + 1] = t end
Motor.decir = function(inst, g, rol, texto) hablan[#hablan + 1] = rol .. ": " .. tostring(Motor.texto(inst, texto)); return true end
Motor.contarBajas = function() return 0 end

local function dijo(lista, frase)
    for _, d in ipairs(lista) do if tostring(d):find(frase, 1, true) then return true end end
    return false
end
-- Cuantas placas de la historia lleva el jugador (el mapa tambien llega al inventario).
local function placas(inst)
    local n = 0
    for _, it in ipairs(tiene) do if it.etiqueta == inst.id .. ":placas" then n = n + 1 end end
    return n
end
local function diario(inst, frase)
    for _, d in ipairs(inst.diario or {}) do if tostring(d.t or d):find(frase, 1, true) then return true end end
    return false
end

local st = Motor.estado()
local m = st.memoria
local function limpiar()
    st.arcos, st.orden = {}, {}
    st.director.veces.placas_pope, st.director.ultimoPorDef.placas_pope = nil, nil
    avisos, hablan, tiene, dados, retirados = {}, {}, {}, {}, {}
    m.placas_pope, m.ray_mecanico, m.tanque_ray = nil, nil, nil
    m.desertor = "protegido"
    px, py = REFUGIO.x, REFUGIO.y
end
local function grupo(inst, id, rol, vivo, causa)
    inst.grupos[id] = { estado = "listo", nombres = {}, roles = { [rol] = id .. "1" },
        miembros = { [id .. "1"] = { rol = rol, vivo = vivo, causa = causa } } }
end
local function morir(inst, id, causa)
    local mm = inst.grupos[id].miembros[id .. "1"]
    mm.vivo, mm.causa = false, causa or "otro"
end
-- Arranca la historia y llega hasta Louisville con Ray (en la esquina).
local function hastaLaEsquina(loretta)
    local inst = Motor.iniciar("placas_pope", J)
    inst.vars.loretta = loretta
    grupo(inst, "ray", "ray", true)
    Motor.revisarSalidas(inst, 0)
    Motor.elegir(J, inst.id, "aceptar")
    px, py = CASA.x, CASA.y
    Motor.revisarSalidas(inst, 0)
    return inst
end

local def = Defs.get("placas_pope")
check(def ~= nil and Lore.arcos.placas_pope ~= nil, "la historia esta registrada y tiene diario")
local sinLore = {}
for nombre, etapa in pairs(def.etapas) do
    if etapa.final and Lore.final("placas_pope", nombre) == nil then sinLore[#sinLore + 1] = nombre end
    if not etapa.final and etapa.pista ~= nil and Lore.etapa("placas_pope", nombre) == nil then sinLore[#sinLore + 1] = nombre end
end
check(#sinLore == 0, "cada etapa con pista y cada final tienen diario " .. table.concat(sinLore, ", "))

-- ---------------------------------------------------------------------------
-- 1. Cuando sale (el director)
-- ---------------------------------------------------------------------------
print("1. cuando sale")
limpiar()
check(Director.elegible(def, ahora), "Ray escondido (desertor = protegido): puede salir")
check(not Director.elegible(def, 24 * 10), "antes del dia 16 no")
m.desertor = "entregado"
check(not Director.elegible(def, ahora), "si lo entregaste, no")
m.desertor = "protegido"
m.placas_pope = "con_carta"
check(not Director.elegible(def, ahora), "ya hecha, no se repite")
m.placas_pope = nil
m.ray_mecanico = "rosewood"
check(not Director.elegible(def, ahora), "Ray ya se quedo en un campamento: no")
local eco = Defs.get("eco_desertor_vuelve")
check(not Director.elegible(eco, ahora), "y 'Ray vuelve' tampoco sale (no vuelve a huir)")
m.ray_mecanico = nil
check(Director.elegible(eco, ahora), "sin campamento, 'Ray vuelve' puede salir")
local i0 = Motor.iniciar("placas_pope", J)
check(not Director.elegible(eco, ahora), "pero no mientras corren las placas")
st.arcos, st.orden = {}, {}

-- ---------------------------------------------------------------------------
-- 2. Loretta viva, placas con la carta, Ray a Rosewood
-- ---------------------------------------------------------------------------
print("2. Loretta viva, con la carta; Ray de mecanico en Rosewood")
limpiar()
m.tanque_ray = "aviso"
local k = S.estado("rosewood")
k.oficios = { mecanico = { uid = "wilson" } }
local salvadosAntes = k.salvados or 0
local inst = Motor.iniciar("placas_pope", J)
check(inst ~= nil and inst.etapa == "llegada" and inst.lugares.refugio ~= nil, "Ray llega al refugio")
grupo(inst, "ray", "ray", true)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "pedido", "Ray pide trabajo")
ahora = ahora + 0.2
Motor.procesarPendientes(inst)
check(dijo(hablan, "Darnell Pope") and dijo(hablan, "Le robe la muerte a Pope"), "Ray cuenta lo de las placas")
check(dijo(hablan, "La noche del tanque"), "se acuerda de su aviso la noche del tanque")
local malas = 0
for _, t in ipairs(hablan) do
    if t:find("^ray: ") and (t:lower():find("desertor") or t:lower():find("fuego")) then malas = malas + 1 end
end
check(malas == 0, "Ray nunca dice desertor ni fuego")
Motor.elegir(J, inst.id, "aceptar")
check(inst.etapa == "camino" and inst.lugares.casa_pope ~= nil, "a Louisville, con Ray")
check(buscado ~= nil and buscado.pueblo == "Louisville", "la casa de los Pope se busca en Louisville")
check(placas(inst) == 1, "Ray le da las placas al jugador")
px, py = CASA.x, CASA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa_viva", "Ray se queda en la esquina; Loretta esta viva y rodeada")
check(dijo(hablan, "La puerta la toca usted"), "Ray: la puerta la toca usted")
grupo(inst, "loretta", "loretta", true)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "loretta", "sin muertos cerca: hablar con Loretta")
Motor.elegir(J, inst.id, "con_carta")
check(inst.etapa == "volver" and inst.vars.entrega == "con_carta" and placas(inst) == 0, "le da las placas con la carta")
ahora = ahora + 0.1
Motor.procesarPendientes(inst)
check(dijo(hablan, "no lo perdono. Todavia"), "Loretta: no lo perdona, todavia")
Motor.elegir(J, inst.id, "contar")
check(inst.etapa == "quedarse", "le cuenta a Ray: Ray se queda")
local op
for _, o in ipairs(def.etapas.quedarse.opciones) do if o.id == "a_muldraugh" then op = o end end
check(not Motor.opcionVisible(inst, op), "la comisaria del Cabo sin fundar no aparece")
Motor.elegir(J, inst.id, "a_rosewood")
check(inst.final == "final_mecanico", "a Rosewood: final_mecanico")
check(m.placas_pope == "con_carta" and m.ray_mecanico == "rosewood", "placas_pope = con_carta, ray_mecanico = rosewood")
check(diario(inst, "Darnell no se fue") and diario(inst, "palabra con puerta"), "el diario cuenta como termino")
check(k.oficios.mecanico.uid == nil and retirados[#retirados] == "wilson", "el mecanico que habia se retira")
check(k.oficios.mecanico.esperar ~= nil and k.oficios.mecanico.esperar.rol == "ray", "Ray aparece en el taller cuando se va el de la historia")
check((k.salvados or 0) == salvadosAntes + 1, "Ray cuenta como salvado")
local p = K.persona("mecanico", "rosewood", m)
check(p.nombre[1] == "Ray" and p.nombre[2] == "Doyle" and p.perfil == "k93_deserters_02", "el mecanico de Rosewood es Ray Doyle")
check(K.persona("mecanico", "westpoint", m).nombre[1] ~= "Ray", "los otros campamentos siguen con el suyo")
check(m.desertor == "protegido", "Ray sigue vivo")

-- ---------------------------------------------------------------------------
-- 3. Loretta ya no estaba y las placas se perdieron: Ray se va caminando
-- ---------------------------------------------------------------------------
print("3. Loretta muerta, placas perdidas")
limpiar()
inst = hastaLaEsquina("muerta")
check(inst.etapa == "tumba", "la casa esta abierta: Loretta ya no estaba (sin muertos cerca, despedirse al tiro)")
local hayZombi, hayNota = false, false
for _, pp in ipairs(inst.pendientes) do
    if pp[1] == "zombi_en" and pp.femenino then hayZombi = true end
    if pp[1] == "nota" then hayNota = true end
end
check(hayZombi and hayNota, "Loretta transformada y su nota para Darnell")
tiene = {}
Motor.elegir(J, inst.id, "dejar")
check(inst.etapa == "tumba", "sin las placas no se pueden dejar")
Motor.elegir(J, inst.id, "nada")
check(inst.etapa == "volver" and inst.vars.entrega == "perdidas", "se va sin dejarle nada")
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_se_fue" and m.placas_pope == "perdidas", "a Loretta no le llego nada: Ray se va caminando")
check(m.ray_mecanico == nil and m.desertor == "protegido", "sin campamento; Ray sigue vivo por ahi")

-- ---------------------------------------------------------------------------
-- 4. Ray muere en el camino: las placas se llevan igual
-- ---------------------------------------------------------------------------
print("4. Ray muere en el camino")
limpiar()
inst = Motor.iniciar("placas_pope", J)
inst.vars.loretta = "muerta"
grupo(inst, "ray", "ray", true)
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "aceptar")
morir(inst, "ray")
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "camino_solo" and inst.vars.ray_murio == true and m.desertor == "muerto", "Ray murio: desertor = muerto, sigue uno solo")
px, py = CASA.x, CASA.y
Motor.revisarSalidas(inst, 0)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "tumba", "llega a la casa de los Pope")
Motor.elegir(J, inst.id, "dejar")
check(inst.final == "final_sin_ray" and m.placas_pope == "tumba", "le deja las placas: final_sin_ray, placas_pope = tumba")
check(CD.deArco("placas_pope", "ray") ~= nil and not CD.deArco("placas_pope", "ray").solo_si_jugador, "Ray muerto aca va a 'Los que ya no estan'")
check(CD.deArco("el_desertor", "ray").solo_si_jugador, "en el evento del desertor sigue solo si lo matas tu")

-- ---------------------------------------------------------------------------
-- 5. Loretta viva pero sin placas: se le cuenta y Ray va a West Point (fundado)
-- ---------------------------------------------------------------------------
print("5. sin placas, Loretta cree igual; Ray a West Point")
limpiar()
C.estado("westpoint").desbloqueado = true
inst = hastaLaEsquina("viva")
tiene = {}
grupo(inst, "loretta", "loretta", true)
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "sin_carta")
check(inst.etapa == "loretta", "sin las placas no se las puede dar")
Motor.elegir(J, inst.id, "contado")
check(inst.etapa == "volver" and inst.vars.entrega == "contado", "se lo cuenta igual")
Motor.elegir(J, inst.id, "contar")
for _, o in ipairs(def.etapas.quedarse.opciones) do if o.id == "a_westpoint" then op = o end end
check(Motor.opcionVisible(inst, op), "el cuartel de la Chela, fundado, aparece")
Motor.elegir(J, inst.id, "a_westpoint")
check(inst.final == "final_mecanico" and m.ray_mecanico == "westpoint" and m.placas_pope == "contado", "Ray de mecanico en West Point")
check(K.persona("mecanico", "westpoint", m).nombre[1] == "Ray" and S.estado("westpoint").oficios.mecanico ~= nil,
    "el cuartel tiene mecanico desde ya, y es Ray")
C.estado("westpoint").desbloqueado = nil

-- Rosewood en manos de la banda: no se lo puede mandar alla; sin lugar, se va.
limpiar()
m.dominio_rosewood = "bandido"
inst = hastaLaEsquina("viva")
grupo(inst, "loretta", "loretta", true)
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "sin_carta")
Motor.elegir(J, inst.id, "contar")
for _, o in ipairs(def.etapas.quedarse.opciones) do if o.id == "a_rosewood" then op = o end end
check(inst.etapa == "quedarse" and not Motor.opcionVisible(inst, op), "con la gasolinera en manos de la banda, Rosewood no aparece")
Motor.elegir(J, inst.id, "sin_lugar")
check(inst.final == "final_se_fue" and m.placas_pope == "sin_carta" and m.ray_mecanico == nil, "sin donde mandarlo: se va caminando")
m.dominio_rosewood = nil

-- ---------------------------------------------------------------------------
-- 6. Lo que no deberia pasar: matar a Loretta, matar a Ray, decirle que ahora no
-- ---------------------------------------------------------------------------
print("6. matar a Loretta, matar a Ray, ahora no")
limpiar()
inst = hastaLaEsquina("viva")
grupo(inst, "loretta", "loretta", true)
morir(inst, "loretta", "jugador")
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_mataste_loretta" and m.placas_pope == "perdidas", "matas a Loretta: final_mataste_loretta")
check(CD.deArco("placas_pope", "loretta") ~= nil, "Loretta esta en 'Los que ya no estan'")

limpiar()
inst = Motor.iniciar("placas_pope", J)
grupo(inst, "ray", "ray", true)
Motor.revisarSalidas(inst, 0)
morir(inst, "ray", "jugador")
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_lo_mataste" and m.desertor == "asesinado", "matas a Ray: desertor = asesinado")

limpiar()
inst = Motor.iniciar("placas_pope", J)
grupo(inst, "ray", "ray", true)
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "despues")
check(inst.final == "final_despues" and m.placas_pope == nil, "ahora no: no deja memoria")
st.arcos, st.orden = {}, {}
st.director.ultimoPorDef.placas_pope = nil
check(Director.elegible(def, ahora), "y puede volver a salir")

-- Loretta muere en el sitio: se le dejan las placas igual.
limpiar()
inst = hastaLaEsquina("viva")
grupo(inst, "loretta", "loretta", true)
morir(inst, "loretta")
Motor.revisarSalidas(inst, 0)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "tumba", "Loretta cae en el sitio: despedirse")
Motor.elegir(J, inst.id, "dejar")
Motor.elegir(J, inst.id, "contar")
check(inst.etapa == "quedarse", "con las placas dejadas, Ray se queda")

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
