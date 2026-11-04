-- Prueba: las misiones de la panaderia Hollis (Arcos/Hollis.lua y NarradorHollis.lua) de punta a
-- punta: el raton de la harina (sus cinco finales), el primer pan (con y sin la libreta de Walt,
-- y el pan de cada dos dias), la camioneta del pan (con Hector y Yvonne, sin ellos, y la
-- oferta de la Misia Rosa) y la iglesia de Shively (vivos, uno solo, la nota, el cebo con y sin
-- la radio de la Chela). Se corre con correr.py.
require "Narrador/Arcos/Hollis"
local Mundo, Motor, G, C, R, Defs, Lore = Narrador.Mundo, Narrador.Motor, Narrador.Generador, Narrador.Contactos,
    Narrador.Reputacion, Narrador.Defs, Narrador.Lore
local B, H, K, CS, Director = Narrador.Bell, Narrador.Hollis, Narrador.Campamentos, Narrador.ConversasServer, Narrador.Director
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

-- ---------------------------------------------------------------------------
-- Mundo de mentira
-- ---------------------------------------------------------------------------
local ahora = 24 * 40 + 1
local J = { nombre = "Shinbito" }
Mundo.horas = function() return ahora end
Mundo.log = function() end
Mundo.hayALife = function() return true end
Mundo.sandbox = function(_, d) return d end
Mundo.jugadores = function() return { J } end
Mundo.jugadorAlAzar = function() return J end
Mundo.jugadorConRefugio = function() return J, { x = 100, y = 100, z = 0, etiqueta = "el refugio" } end
Mundo.nombreJugador = function() return "Shinbito" end
Mundo.grupoDe = function() return "g1", "Los de prueba" end
Mundo.vivo = function() return true end
Mundo.retirar = function() return true end
Mundo.azar = function() return 1 end
Mundo.puebloCercano = function() return nil end
Mundo.cargado = function() return nil end
Mundo.zombiCerca = function() return false end
Mundo.actorVivo = function() return true end
Mundo.actorVivoUid = function() return true end
local px, py = 100, 100
Mundo.posicion = function() return px, py, 0 end
Mundo.jugadorCerca = function(x, y, r)
    if math.sqrt((px - x) ^ 2 + (py - y) ^ 2) <= (r or 35) then return J end
    return nil
end
local lugares = {}
Mundo.buscarLugar = function(spec)
    local l = lugares[spec.id] or { x = 5000, y = 5000 }
    return { x = l.x, y = l.y, z = 0, etiqueta = "el lugar " .. tostring(spec.id), sala = "kitchen" }
end
local tiene = {}
Mundo.tieneEtiqueta = function(it, etiqueta) return it.etiqueta == etiqueta end
Mundo.buscarItem = function(_, f)
    for _, it in ipairs(tiene) do if f(it) then return it, {} end end
    return nil
end
Mundo.quitarItem = function() end
local dados = {}
Mundo.darItem = function(_, it) dados[#dados + 1] = it; return true end
Mundo.crearItem = function(t) return { tipo = type(t) == "table" and t[1] or t } end
Mundo.nombrar = function(it, nombre, etiqueta) if it ~= nil then it.nombre, it.etiqueta = nombre, etiqueta end end
local suelo = {}
Mundo.dejarEnSuelo = function(_, _, _, it) suelo[#suelo + 1] = it; return true end
-- Los Bell en el refugio (uids 11, 12, 13).
local POS = { [11] = { 101, 100 }, [12] = { 102, 100 }, [13] = { 103, 100 } }
Mundo.posicionActor = function(uid) local p = POS[uid]; if p then return p[1], p[2], 0 end return nil end
local dichos, burbujas = {}, {}
Motor.enviar = function(_, cmd, d) if cmd == "decir" then burbujas[#burbujas + 1] = d.texto end end
Motor.publicar = function() end
Motor.responder = function() end
Motor.avisar = function() end
Motor.decirUid = function(uid, nombre, texto) dichos[#dichos + 1] = { nombre = nombre, texto = texto } end
C.decir = function(id, texto) dichos[#dichos + 1] = { nombre = id, texto = texto } end
local bajas = 0
Motor.contarBajas = function() return bajas end
local guardias = {}
K.sumarSalvado = function(cid, persona) guardias[#guardias + 1] = { cid, persona.nombre, persona.perfil } end

local st = Motor.estado()
local m = st.memoria
local function limpiar()
    st.arcos, st.orden, st.porAbrir = {}, {}, {}
    dichos, burbujas, tiene, guardias, suelo, dados, bajas = {}, {}, {}, {}, {}, {}, 0
end
local function dijo(quien, trozo)
    for _, d in ipairs(dichos) do
        if (quien == nil or d.nombre == quien) and tostring(d.texto):find(trozo, 1, true) then return true end
    end
    for _, t in ipairs(burbujas) do if quien == "burbuja" and tostring(t):find(trozo, 1, true) then return true end end
    return false
end
local function pendientes(inst)
    ahora = ahora + 5
    Motor.procesarPendientes(inst)
end
local function bells(roles)
    local b = { x = 100, y = 100, z = 0, charla = "bell_refugio", memoria = {}, miembros = {}, alertas = {}, desde = ahora - 100 }
    local uid = { padre = 11, madre = 12, hijo = 13 }
    for _, rol in ipairs(roles) do b.miembros[rol] = { uid = uid[rol] } end
    st.bell = b
    return b
end
local function hora(h)
    ahora = math.floor(ahora / 24) * 24 + 24 + h
end
R.tabla().g1 = { muldraugh = 95, westpoint = 95, riverside = 95, rosewood = 95 }
local eo = C.estado("rosewood")
eo.x, eo.y, eo.z, eo.etiqueta = 8000, 8000, 0, "la gasolinera"
local BOMBA = { x = 8000, y = 8000 }

-- Lore: cada etapa con pista tiene diario y cada final su epilogo.
for _, id in ipairs({ "raton_harina", "primer_pan", "camioneta_pan", "iglesia_shively" }) do
    local def, sin = Defs.get(id), {}
    for nombre, etapa in pairs(def ~= nil and def.etapas or {}) do
        if etapa.final and Lore.final(id, nombre) == nil then sin[#sin + 1] = nombre end
        if not etapa.final and etapa.pista ~= nil and Lore.etapa(id, nombre) == nil then sin[#sin + 1] = nombre end
    end
    check(def ~= nil and #sin == 0, id .. ": registrado, con diario y epilogos " .. table.concat(sin, ", "))
end

-- ---------------------------------------------------------------------------
-- 1. El raton de la harina
-- ---------------------------------------------------------------------------
print("1. el raton de la harina")
limpiar()
local def6 = Defs.get("raton_harina")
st.bell = nil
check(not Director.elegible(def6, ahora), "sin los Bell en el refugio no sale")
bells({ "padre", "madre" })
check(not Director.elegible(def6, ahora), "sin Wade no sale (la trampa es suya)")
bells({ "padre", "madre", "hijo" }).desde = ahora - 10
check(not Director.elegible(def6, ahora), "recien llegados no sale")
bells({ "padre", "madre", "hijo" })
check(Director.elegible(def6, ahora), "con Yvonne y Wade hace dos dias, el director la puede lanzar")

local inst = Motor.iniciar("raton_harina", J)
check(inst ~= nil and inst.etapa == "espera" and inst.lugares.refugio.x == 100, "arranca esperando la noche, en el refugio de los Bell")
check(dijo("Wade", "no me cuadra"), "Wade cuenta lo de la harina")
hora(2)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "espera", "a las dos todavia no")
hora(3)
st.bell.escondidos = { vuelven = ahora + 5 }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "espera", "con los Bell escondidos de una horda no pasa")
st.bell.escondidos = nil
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "trampa" and dijo("Yvonne", "No despierte al nino"), "a las tres y media la trampa pilla a Yvonne")
Motor.elegir(J, inst.id, "daniel")
check(inst.final == "final_daniel" and m.harina == "daniel", "despertar a Daniel: harina = daniel")
pendientes(inst)
check(dijo("Daniel", "Sabia del frasco") and dijo("Yvonne", "No me levante la voz"), "Daniel y Yvonne discuten (bajito)")
check(#st.porAbrir == 1 and st.porAbrir[1].def == "primer_pan", "abre el primer pan")

-- Sin Daniel no se puede despertarlo; preguntar -> confesion -> se lo cuenta ella.
limpiar()
m.harina = nil
bells({ "madre", "hijo" })
inst = Motor.iniciar("raton_harina", J)
Motor.entrar(inst, "trampa", 0)
Motor.elegir(J, inst.id, "daniel")
check(inst.etapa == "trampa", "sin Daniel en el refugio no aparece despertarlo")
Motor.elegir(J, inst.id, "preguntar")
check(inst.etapa == "confesion" and dijo("Yvonne", "Es para la Vieja"), "Yvonne confiesa: es para la Vieja")
pendientes(inst)
check(dijo("Yvonne", "verguenza ser feliz") and dijo("Yvonne", "cuenta de Wade"), "por que lo hace y de donde la saca (lo que dice su ficha)")
Motor.elegir(J, inst.id, "contar_ella")
check(inst.final == "final_confeso" and m.harina == "confeso", "que se lo cuente ella: harina = confeso")

limpiar()
m.harina = nil
bells({ "padre", "madre", "hijo" })
inst = Motor.iniciar("raton_harina", J)
Motor.entrar(inst, "confesion", 0)
Motor.elegir(J, inst.id, "secreto")
check(inst.final == "final_secreto" and m.harina == "secreto", "guardarle el secreto: harina = secreto")

limpiar()
m.harina = nil
inst = Motor.iniciar("raton_harina", J)
Motor.entrar(inst, "trampa", 0)
Motor.elegir(J, inst.id, "callar")
check(inst.final == "final_callado" and m.harina == "callado" and dijo("Yvonne", "Gracias, corazon"), "hacer como que no viste: callado")

limpiar()
m.harina = nil
inst = Motor.iniciar("raton_harina", J)
ahora = ahora + 170
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_wade" and m.harina == "wade" and dijo("Wade", "Los ratones no tienen canas"), "si nunca estas a esa hora, Wade lo descubre solo")

-- Lo que cambia: charlas, conversas.
local SIN = { vars = {}, lugares = {}, grupos = {}, relojes = {}, elecciones = {}, usadas = {} }
local function lineaSale(trozo)
    for _, l in ipairs(Narrador.Charlas.bell_refugio) do
        if l[2]:find(trozo, 1, true) then return l.si == nil or Motor.cumple(SIN, l.si) end
    end
    return false
end
m.harina = "daniel"
check(lineaSale("Que ironia. Hay papeles") and not lineaSale("Wade cuenta las cucharadas"), "Daniel habla distinto segun la harina")
check(lineaSale("Que ironia. Hay papeles") == true, "la linea tambien esta en la charla del refugio")
local enGratitud = false
for _, l in ipairs(Narrador.Charlas.bell_gratitud) do if l[2]:find("dedo en una trampa", 1, true) then enGratitud = true end end
check(enGratitud, "y en la de los Bell enganados")
local hablantes = CS.hablantes()
local bellH = 0
for _, h in ipairs(hablantes) do if h.fuente == "res:bell" then bellH = bellH + 1 end end
check(bellH == 3, "los Bell del refugio pueden conversar (" .. bellH .. ")")
check(CS.preparar(Narrador.Conversas.get("bell_harina_daniel"), hablantes, 100, 100) ~= nil, "sale la conversa de la trampa aceitada")
check(CS.preparar(Narrador.Conversas.get("bell_harina_wade"), hablantes, 100, 100) == nil, "y no la de Wade")

-- ---------------------------------------------------------------------------
-- 2. El primer pan
-- ---------------------------------------------------------------------------
print("2. el primer pan")
limpiar()
m.harina, m.receta_walt, m.pan_bell, m.pan_bell_ultima = "wade", nil, nil, nil
bells({ "padre", "madre", "hijo" })
lugares.horno = { x = 400, y = 100 }
px, py = 2000, 2000
inst = Motor.iniciar("primer_pan", J)
check(inst ~= nil and inst.etapa == "pedido", "abre esperando que alguien vuelva al refugio")
px, py = 100, 100
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "viaje" and inst.lugares.horno ~= nil, "en casa: lo piden y hay que ir al horno")
pendientes(inst)
check(dijo("Wade", "No me pregunte por que lo se") and dijo("Daniel", "Hagamos un trato"), "con harina = wade lo pide Wade; Daniel ofrece armarlo")
px, py = 400, 100
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "cocina", "llega a la cocina")
tiene[1] = { etiqueta = inst.id .. ":puerta" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "volver", "con la puerta del horno: volver")
px, py = 100, 100
Motor.elegir(J, inst.id, "puerta")
check(inst.etapa == "armar" and dijo("Daniel", "tambor de aceite"), "Daniel arma el horno")
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "armar", "todavia no son las tres y media")
hora(3)
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_primer_pan" and m.pan_bell == "vieja", "a las tres y media: el primer pan (pan_bell = vieja)")
check(dijo("Yvonne", "Entero y caliente") and #suelo == 0, "Yvonne se lo da (el pan queda pendiente en el refugio)")
pendientes(inst)
check(dijo("Wade", "esta vez la cuenta cuadra"), "Wade reparte en partes iguales")

-- El pan de cada dos dias.
suelo, dichos = {}, {}
local b = st.bell
B.hornear(b)
check(m.pan_bell_ultima ~= nil and #suelo == 0, "la primera vez solo empieza a contar")
ahora = ahora + 10
B.hornear(b)
check(#suelo == 0, "a las 10 horas nada")
ahora = ahora + 40
B.hornear(b)
check(#suelo == 2 and dijo("Yvonne", "Pan de la Vieja"), "a las 48 horas, dos panes")
b.miembros.madre.uid = nil
ahora = ahora + 50
B.hornear(b)
check(#suelo == 2, "sin Yvonne en el refugio no hay pan")
b.miembros.madre.uid = 12

-- Con la libreta de Walt (de la camioneta del pan).
limpiar()
m.harina, m.receta_walt, m.pan_bell, m.pan_bell_ultima = "confeso", true, nil, nil
inst = Motor.iniciar("primer_pan", J)
Motor.entrar(inst, "armar", 0)
hora(4)
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_primer_pan" and m.pan_bell == "walt" and dijo("Yvonne", "pagina doce"), "con la libreta de Walt: pan de Hazel, pan_bell = walt")
ahora = ahora + 1
B.hornear(st.bell)
ahora = ahora + 49
suelo = {}
B.hornear(st.bell)
check(#suelo == 3, "y despues tambien rollos de canela")

limpiar()
m.pan_bell = nil
inst = Motor.iniciar("primer_pan", J)
Motor.entrar(inst, "viaje", 0)
st.bell.miembros.madre = nil
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_sin_yvonne" and m.pan_bell == nil, "si Yvonne se va del refugio, no hay horno")
st.bell.miembros.madre = { uid = 12 }

-- ---------------------------------------------------------------------------
-- 3. La camioneta del pan
-- ---------------------------------------------------------------------------
print("3. la camioneta del pan")
limpiar()
m.historia_rosewood_2, m.camioneta_pan, m.cura_rosewood, m.receta_walt = nil, nil, "salvo", nil
check(H.oferta("rosewood", "facil", "g1") == nil, "sin el cap. 2 de la Misia Rosa no sale")
m.historia_rosewood_2 = true
local o = H.oferta("rosewood", "facil", "g1")
check(o ~= nil and o.def == "camioneta_pan" and o.vars.nivel == "medio", "despues del cap. 2 la Misia Rosa la ofrece (pago medio)")
check(H.oferta("muldraugh", "facil", "g1") == nil, "el Cabo no la ofrece")
local enLista = false
for _, f in ipairs(G.OFERTAS_EXTRA) do if f == H.oferta then enLista = true end end
check(enLista, "va entre las ofertas extra, ademas del capitulo")
m.dominio_rosewood = "bandido"
check(H.oferta("rosewood", "facil", "g1") == nil, "con un capitan en la gasolinera no sale")
m.dominio_rosewood = nil
R.tabla().g1.rosewood = 30
check(H.oferta("rosewood", "facil", "g1") == nil, "con poca confianza no sale")
R.tabla().g1.rosewood = 95

lugares.camioneta = { x = 9000, y = 9000 }
px, py = BOMBA.x, BOMBA.y
inst = G.iniciarOferta(J, "rosewood", "facil", o)
check(inst ~= nil and inst.etapa == "viaje", "arranca: a la 31")
pendientes(inst)
check(dijo("rosewood", "camioneta blanca") and dijo("rosewood", "Cabo") and dijo("rosewood", "No pide nada"), "la Misia Rosa cuenta lo de Walt, el dato del Cabo y lo de Junior")
check(H.oferta("rosewood", "facil", "g1") == nil, "mientras esta en curso no se ofrece de nuevo")
px, py = 9000, 9000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "camioneta", "llega a la camioneta")
local hay = {}
for _, p in ipairs(inst.pendientes) do hay[p[1]] = true end
check(hay.vehiculo and hay.zombi_jefe and hay.nota, "la camioneta, Walt transformado y su nota")
ahora = ahora + 0.2
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "registrar", "sin muertos cerca: revisar la camioneta")
Motor.elegir(J, inst.id, "foto")
local foto = false
for _, it in ipairs(dados) do if it.etiqueta == inst.id .. ":foto" then foto = true end end
check(inst.etapa == "volver" and foto, "se lleva la foto del parasol")
local pideHector = false
for _, p in ipairs(inst.pendientes) do if p[1] == "npcs" and p.id == "hector" then pideHector = true end end
check(pideHector, "con la cura hecha, Hector Jr. espera en la gasolinera")
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "volver", "espera que aparezca Hector")
inst.grupos.hector = { estado = "listo", miembros = { h1 = { rol = "hector", vivo = true, nombre = "Hector" } }, roles = { hector = "h1" }, nombres = {} }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "gasolinera", "en la gasolinera, con Hector")
Motor.elegir(J, inst.id, "contar")
check(inst.etapa == "yvonne" and m.camioneta_pan == "foto", "le cuenta: camioneta_pan = foto, falta Yvonne")
pendientes(inst)
check(dijo("burbuja", "El tata fue") and dijo("burbuja", "al lado del tio") and dijo("burbuja", "Shively"), "Hector cierra lo del tata, pega la foto y cuenta lo de Shively")
check(dijo("rosewood", "Y me lo dices ahora"), "la Misia Rosa se entera de Shively")
px, py = 100, 100
Motor.elegir(J, inst.id, "receta")
check(inst.final == nil, "sin la libreta no se la puede dar")
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_yvonne" and dijo("Yvonne", "Voy por Linda"), "Yvonne: 'Cierra tu, Yvonne. Voy por Linda'")
pendientes(inst)
check(dijo("Yvonne", "Esa es de Junior"), "y la foto es para Junior")

-- La libreta, sin Hector (fiebre) y con Yvonne.
limpiar()
m.camioneta_pan, m.cura_rosewood = nil, nil
inst = G.iniciarOferta(J, "rosewood", "facil", H.oferta("rosewood", "facil", "g1"))
pendientes(inst)
check(dijo("rosewood", "con la fiebre"), "sin la cura, Junior sigue con fiebre")
Motor.entrar(inst, "registrar", 0)
px, py = 9000, 9000
Motor.elegir(J, inst.id, "receta")
local pideHector2 = false
for _, p in ipairs(inst.pendientes) do if p[1] == "npcs" and p.id == "hector" then pideHector2 = true end end
check(not pideHector2, "sin la cura Hector no aparece")
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "gasolinera", "en la gasolinera no espera a nadie")
Motor.elegir(J, inst.id, "contar")
check(m.camioneta_pan == "receta", "camioneta_pan = receta")
tiene[1] = { etiqueta = inst.id .. ":receta" }
px, py = 100, 100
Motor.elegir(J, inst.id, "receta")
check(inst.final == "final_receta" and m.receta_walt == true, "le da la libreta a Yvonne: receta_walt")

-- Sin Bells en el refugio: termina con la Misia Rosa.
limpiar()
m.camioneta_pan, m.cura_rosewood = nil, "murio"
local guardado = st.bell
st.bell = nil
inst = G.iniciarOferta(J, "rosewood", "facil", H.oferta("rosewood", "facil", "g1"))
Motor.entrar(inst, "registrar", 0)
px, py = 9000, 9000
Motor.elegir(J, inst.id, "llaves")
local llaves = false
for _, p in ipairs(inst.pendientes) do if p[1] == "llaves_vehiculo" then llaves = true end end
check(llaves, "las llaves de la camioneta quedan pedidas")
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_rosa" and m.camioneta_pan == "llaves", "sin Yvonne termina en la gasolinera")
pendientes(inst)
check(dijo("rosewood", "se esperan los dos"), "con Hector muerto, la Misia Rosa habla por el")
check(H.oferta("rosewood", "facil", "g1") == nil, "ya hecha, no se ofrece mas (y Shively necesita a Hector vivo)")
st.bell = guardado

-- ---------------------------------------------------------------------------
-- 4. La iglesia de Shively
-- ---------------------------------------------------------------------------
print("4. la iglesia de Shively")
local function shively(resultado, extra)
    limpiar()
    m.shively = nil
    for k, v in pairs(extra or {}) do m[k] = v end
    local of = H.oferta("rosewood", "facil", "g1")
    local i = of ~= nil and of.def == "iglesia_shively" and G.iniciarOferta(J, "rosewood", "facil", of) or nil
    if i ~= nil then i.vars.resultado = resultado end
    return i
end
m.cura_rosewood, m.camioneta_pan = "murio", "foto"
check(H.oferta("rosewood", "facil", "g1") == nil, "con Hector muerto no sale")
m.cura_rosewood = "salvo"
o = H.oferta("rosewood", "facil", "g1")
check(o ~= nil and o.def == "iglesia_shively" and o.vars.nivel == "dificil", "con Hector vivo y la camioneta hecha sale Shively (pago dificil)")

lugares.iglesia = { x = 12500, y = 3000 }
inst = shively("vivos", { cura_rosewood = "salvo", camioneta_pan = "foto", radio_westpoint = nil })
pendientes(inst)
check(dijo("rosewood", "Shively") and not dijo("rosewood", "disco rayado"), "la Misia Rosa da el dato (sin la radio de la Chela no hay aviso)")
px, py = 12500, 3000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "sitio", "vivos: Linda y Nico rodeados")
inst.grupos.hollis = { estado = "listo", nombres = {}, roles = { linda = "l1", nico = "n1" },
    miembros = { l1 = { rol = "linda", vivo = true, nombre = "Linda" }, n1 = { rol = "nico", vivo = true, nombre = "Nico" } } }
inst.vars.meta_shively = 20
bajas = 20
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "aguanta la horda: hablar con Linda")
Motor.elegir(J, inst.id, "foto")
check(inst.etapa == "escolta" and dijo("burbuja", "el fue. Fue a buscarme"), "con la foto de Walt, Linda sabe que su papa fue a buscarla")
inst.grupos.hector = { estado = "listo", miembros = { h1 = { rol = "hector", vivo = true, nombre = "Hector" } }, roles = { hector = "h1" }, nombres = {} }
POS.l1, POS.n1 = { BOMBA.x + 2, BOMBA.y }, { BOMBA.x + 3, BOMBA.y }
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_vivos" and m.shively == "vivos", "llegan los dos: shively = vivos")
check(#guardias == 2 and guardias[1][1] == "rosewood", "Linda y Nico se quedan en la gasolinera")
pendientes(inst)
check(dijo("burbuja", "Lleno o normal?") and dijo("burbuja", "Lleno, mijo"), "Junior: 'lleno o normal?'; Linda: 'lleno'")

-- Sin la foto la convence la broma de la Rosa; llega uno solo.
inst = shively("vivos", { camioneta_pan = "receta" })
Motor.entrar(inst, "hablar", 0)
inst.grupos.hollis = { estado = "listo", nombres = {}, roles = { linda = "l1", nico = "n1" },
    miembros = { l1 = { rol = "linda", vivo = true, nombre = "Linda" }, n1 = { rol = "nico", vivo = false } } }
Motor.elegir(J, inst.id, "foto")
check(inst.etapa == "hablar", "sin la foto de Walt no se puede mostrar")
px, py = 12500, 3000
POS.l1 = { 12500, 3000 }
Motor.elegir(J, inst.id, "junior")
check(inst.etapa == "escolta" and dijo("burbuja", "Esa es la Rosa"), "'Lleno o normal?': Linda le cree")
POS.l1 = { BOMBA.x + 2, BOMBA.y }
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "reencuentro", "llega Linda: espera que Junior salga de la bodega")
ahora = ahora + 1
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_vivos" and m.shively == "uno" and inst.vars.llegaron == "linda", "llega solo Linda: shively = uno")
check(#guardias == 1 and guardias[1][2] == "Linda", "solo Linda queda en la gasolinera")

-- Mueren los dos.
inst = shively("vivos")
Motor.entrar(inst, "escolta", 0)
inst.grupos.hollis = { estado = "listo", nombres = {}, roles = { linda = "l1", nico = "n1" },
    miembros = { l1 = { rol = "linda", vivo = false }, n1 = { rol = "nico", vivo = false } } }
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_muertos" and m.shively == "muertos" and #guardias == 0, "mueren los dos: shively = muertos")

-- La nota.
inst = shively("nota")
px, py = 12500, 3000
Motor.entrar(inst, "llegada", 0)
check(inst.etapa == "vacia", "nota: la iglesia esta vacia")
local notaConId = false
for _, p in ipairs(inst.pendientes) do if p[1] == "nota" and p.id == "nota_linda" then notaConId = true end end
check(notaConId, "la nota de Linda se puede leer y llevar")
tiene[1] = { etiqueta = inst.id .. ":nota_linda" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "volver_nota", "con la nota: a Rosewood")
px, py = BOMBA.x, BOMBA.y
Motor.elegir(J, inst.id, "entregar")
check(inst.final == "final_nota" and m.shively == "nota", "Junior lee la nota: shively = nota")

-- El cebo, sin y con la radio de la Chela.
inst = shively("trampa", { radio_westpoint = nil })
px, py = 12500, 3000
Motor.entrar(inst, "llegada", 0)
local cuantos
for _, p in ipairs(inst.pendientes) do if p[1] == "bandidos" then cuantos = p.cantidad end end
check(inst.etapa == "cebo" and cuantos ~= nil and cuantos[1] == 5, "cebo sin la radio: 5 a 7 bandidos que cazan")
inst.grupos.cebo = { estado = "listo", nombres = {}, roles = {}, miembros = { b1 = { rol = "uno", vivo = false } } }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "radio_pato", "muertos los bandidos: la radio del Pato Rengo")
tiene[1] = { etiqueta = inst.id .. ":radio" }
Motor.revisarSalidas(inst, 0)
px, py = BOMBA.x, BOMBA.y
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_cebo" and m.shively == "trampa", "se lo cuenta a Junior: shively = trampa")

inst = shively("trampa", { radio_westpoint = true })
pendientes(inst)
check(dijo("rosewood", "disco rayado"), "con la radio de la Chela, la Misia Rosa avisa")
px, py = 12500, 3000
Motor.entrar(inst, "llegada", 0)
cuantos = nil
for _, p in ipairs(inst.pendientes) do if p[1] == "bandidos" then cuantos = p.cantidad end end
check(cuantos ~= nil and cuantos[1] == 3, "y si es cebo hay menos bandidos (3 a 4)")
px, py = 0, 0
ahora = ahora + 4
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_huida" and m.shively == "trampa", "si te vas, final_huida")
check(H.oferta("rosewood", "facil", "g1") == nil, "Shively ya hecha no se ofrece mas")

-- Lo que dice la gasolinera despues.
local function frase(trozo)
    for _, f in ipairs(C.FRASES_EXTRA.rosewood) do
        if f[1]:find(trozo, 1, true) then return Motor.cumple(C.SIN_INST, f.si) end
    end
    return false
end
m.shively = "vivos"
check(frase("La Linda se sienta en la caja"), "la Misia Rosa habla de Linda")
m.dominio_rosewood = "nuevo"
check(not frase("La Linda se sienta en la caja") and frase("La mama atiende la caja"), "en la reconquista lo dice Hector")
m.dominio_rosewood = nil

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
