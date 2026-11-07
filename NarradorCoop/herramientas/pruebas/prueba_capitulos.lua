-- Prueba: modo historia de los misioneros (G.ESPECIALES). Que cada capitulo este escrito, con
-- su diario y su memoria al terminar, que la cadena de capitulos no tenga saltos, y los
-- capitulos 4 de punta a punta. Se corre con correr.py.
require "Narrador/Arcos/Capitulos"
require "Narrador/Arcos/HijaCabo"
require "Narrador/Arcos/LeyendaEduardo"
local Mundo, Motor, G, C, R, Defs, Lore = Narrador.Mundo, Narrador.Motor, Narrador.Generador, Narrador.Contactos,
    Narrador.Reputacion, Narrador.Defs, Narrador.Lore
local K = Narrador.Campamentos
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

-- ---------------------------------------------------------------------------
-- 1. Todos los capitulos de G.ESPECIALES
-- ---------------------------------------------------------------------------
local function escribe(etapa, clave)
    for _, a in ipairs(etapa.al_entrar or {}) do
        if a[1] == "memoria" and a.clave == clave then return true end
    end
    return false
end
local porContacto = {}
for _, e in ipairs(G.ESPECIALES) do
    local def = Defs.get(e.def)
    check(def ~= nil, e.def .. " esta registrado")
    if def ~= nil then
        porContacto[e.contacto] = porContacto[e.contacto] or {}
        porContacto[e.contacto][e.capitulo] = e
        check(e.hecho == "historia_" .. e.contacto .. "_" .. e.capitulo, e.def .. ": deja historia_" .. e.contacto .. "_" .. e.capitulo)
        check(e.requiere == "historia_" .. e.contacto .. "_" .. (e.capitulo - 1), e.def .. ": pide el capitulo anterior")
        local finales, sinLore = 0, {}
        for nombre, etapa in pairs(def.etapas) do
            if etapa.final then
                finales = finales + 1
                if not escribe(etapa, e.hecho) then sinLore[#sinLore + 1] = nombre .. " (no deja " .. e.hecho .. ")" end
                if Lore.final(e.def, nombre) == nil then sinLore[#sinLore + 1] = nombre .. " (sin epilogo)" end
            elseif etapa.pista ~= nil and Lore.etapa(e.def, nombre) == nil then
                sinLore[#sinLore + 1] = nombre .. " (sin diario)"
            end
        end
        check(finales >= 1, e.def .. ": tiene final")
        check(#sinLore == 0, e.def .. ": finales con memoria y diario en cada etapa " .. table.concat(sinLore, ", "))
    end
end
for cid, caps in pairs(porContacto) do
    local n = 0
    for i, _ in pairs(caps) do n = math.max(n, i) end
    local seguidos = true
    for i = 2, n do if caps[i] == nil then seguidos = false end end
    check(seguidos and n >= 4, cid .. ": capitulos 2 a " .. n .. " sin saltos")
end

-- ---------------------------------------------------------------------------
-- 2. Mundo de mentira
-- ---------------------------------------------------------------------------
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
local lugares = {}
Mundo.buscarLugar = function(spec)
    local l = lugares[spec.id] or { x = 5000, y = 5000 }
    return { x = l.x, y = l.y, z = 0, etiqueta = "la casa de " .. tostring(spec.id), sala = "livingroom" }
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
local dichos = {}
Motor.enviar = function() end
Motor.publicar = function() end
Motor.responder = function() end
Motor.avisar = function() end
C.decir = function(id, texto) dichos[#dichos + 1] = texto end
local bajas = 0
Motor.contarBajas = function() return bajas end
local guardias = {}
K.sumarSalvado = function(cid, persona) guardias[#guardias + 1] = { cid, persona.nombre, persona.perfil, persona.esperar } end

local st = Motor.estado()
local function limpiar()
    st.arcos, st.orden = {}, {}
    dichos, guardias, tiene, bajas = {}, {}, {}, 0
end
local CASA = { x = 0, y = 0 }
local e = C.estado("muldraugh")
e.x, e.y, e.z, e.etiqueta = CASA.x, CASA.y, 0, "la comisaria"
R.tabla().g1 = { muldraugh = 95, westpoint = 95, riverside = 95, rosewood = 95 }

-- ---------------------------------------------------------------------------
-- 3. Cabo Ramiro, capitulo 4
-- ---------------------------------------------------------------------------
limpiar()
local m = st.memoria
m.historia_muldraugh_3 = nil
check(G.ofertaEspecial("muldraugh", "facil", "g1") == nil or G.ofertaEspecial("muldraugh", "facil", "g1").def ~= "cap_cabo_4",
    "sin el capitulo 3 no sale el 4")
m.historia_muldraugh_1, m.historia_muldraugh_2, m.historia_muldraugh_3 = true, true, "fallido"
local o = G.ofertaEspecial("muldraugh", "facil", "g1")
check(o ~= nil and o.def == "cap_cabo_4" and o.vars.nivel == "dificil", "con el 3 hecho (aunque saliera mal) sale el 4, pago dificil")
R.tabla().g1.muldraugh = 40
check(G.ofertaEspecial("muldraugh", "facil", "g1") == nil, "con poca confianza no sale")
R.tabla().g1.muldraugh = 95
m.dominio_muldraugh = "bandido"
check(G.ofertaEspecial("muldraugh", "facil", "g1") == nil, "con un capitan en la comisaria no sale")
m.dominio_muldraugh = nil

lugares.casa_amos, lugares.casa_ortiz = { x = 300, y = 0 }, { x = 900, y = 0 }
local inst = G.iniciarOferta(J, "muldraugh", "facil", o)
check(inst ~= nil and inst.etapa == "amos", "arranca: a la casa de Amos")
check(inst.lugares.casa_amos ~= nil and inst.lugares.casa_ortiz ~= nil and inst.lugares.contacto ~= nil, "dos casas y la comisaria")
check(dichos[1] ~= nil and dichos[1]:find("Amos Pruitt", 1, true) ~= nil, "el Cabo nombra a Amos")
local hablaMuerta = false
for _, d in ipairs(dichos) do if d:find("Valentina", 1, true) then hablaMuerta = true end end
check(not hablaMuerta, "sin la memoria de Valentina no la nombra")

px, py = 300, 0
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "amos_casa", "llega a la casa de Amos")
local hayZombi, hayNota, hayReloj = false, false, false
for _, p in ipairs(inst.pendientes) do
    if p[1] == "zombi_en" then hayZombi = true end
    if p[1] == "nota" then hayNota = true end
    if p[1] == "objeto" and p.id == "reloj" then hayReloj = true end
end
check(hayZombi and hayNota and hayReloj, "Amos transformado, su nota y su reloj")
tiene[1] = { etiqueta = inst.id .. ":reloj" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "ortiz", "con el reloj: a los Ortiz")
px, py = 900, 0
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "sitio", "llega donde los Ortiz")
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "sitio", "espera al grupo")
inst.grupos.ortiz = { estado = "listo", miembros = { u1 = { rol = "celia", vivo = true }, u2 = { rol = "joaquin", vivo = true } },
    roles = { celia = "u1", joaquin = "u2" }, nombres = {} }
inst.vars.meta_ortiz = 16
bajas = 16
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "aguanta la horda: hablar con Celia")
Motor.elegir(J, inst.id, "llevar")
check(inst.etapa == "escolta", "los manda a la comisaria")
-- Llegan (como en prueba_escolta: el NPC llega y el jugador tambien).
Mundo.posicionActor = function() return CASA.x + 2, CASA.y end
px, py = CASA.x, CASA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "entrega" and inst.vars.llegaron == "dos", "llegan los dos a la comisaria")
Motor.elegir(J, inst.id, "reloj")
check(inst.final == "final_cumplido", "entrega el reloj: final_cumplido")
check(m.historia_muldraugh_4 == true, "memoria historia_muldraugh_4")
check(#guardias == 2 and guardias[1][1] == "muldraugh", "los dos Ortiz quedan de guardias en la comisaria")
check(guardias[1][4] ~= nil and guardias[1][4].arco == inst.id and guardias[1][4].rol == "celia",
    "el guardia espera a que se vaya la Celia de la historia")
local anotado = false
for _, d in ipairs(st.diario or {}) do if tostring(d.t):find("vivos", 1, true) then anotado = true end end
for _, d in ipairs(inst.diario or {}) do if tostring(d.t or d):find("vivos", 1, true) then anotado = true end end
check(anotado, "el diario dice 'vivos'")

-- Si muere uno: el otro queda de guardia y el Cabo escribe una cruz y un vivo.
limpiar()
m.historia_muldraugh_4 = nil
inst = G.iniciarOferta(J, "muldraugh", "facil", G.ofertaEspecial("muldraugh", "facil", "g1"))
inst.grupos.ortiz = { estado = "listo", miembros = { u1 = { rol = "celia", vivo = true }, u2 = { rol = "joaquin", vivo = false } },
    roles = { celia = "u1", joaquin = "u2" }, nombres = {} }
Motor.entrar(inst, "entrega", 0)
check(inst.vars.llegaron == "uno", "llego uno solo")
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_sin_reloj" and m.historia_muldraugh_4 == true, "sin el reloj tambien cierra el capitulo")
check(#guardias == 1 and guardias[1][2] == "Celia", "solo Celia queda de guardia")

-- Si mueren los dos: fallido.
limpiar()
m.historia_muldraugh_4 = nil
inst = G.iniciarOferta(J, "muldraugh", "facil", G.ofertaEspecial("muldraugh", "facil", "g1"))
Motor.entrar(inst, "sitio", 0)
inst.grupos.ortiz = { estado = "listo", miembros = { u1 = { rol = "celia", vivo = false }, u2 = { rol = "joaquin", vivo = false } },
    roles = { celia = "u1", joaquin = "u2" }, nombres = {} }
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cruces" and m.historia_muldraugh_4 == "fallido", "mueren los dos: fallido")
check(#guardias == 0, "nadie queda de guardia")

-- ---------------------------------------------------------------------------
-- 4. Tia Chela, capitulo 4
-- ---------------------------------------------------------------------------
limpiar()
local ew = C.estado("westpoint")
ew.x, ew.y, ew.z, ew.etiqueta = 2000, 2000, 0, "el cuartel"
local CUARTEL = { x = 2000, y = 2000 }
m.historia_westpoint_1, m.historia_westpoint_2, m.historia_westpoint_3 = true, true, true
o = G.ofertaEspecial("westpoint", "medio", "g1")
check(o ~= nil and o.def == "cap_chela_4", "con el cientifico hecho sale el cap. 4 de la Chela")
-- Eduardo en el cuartel: habla. Sin Eduardo, no pasa nada.
local ED = Narrador.EduardoResidente
local habloEduardo = {}
local decirUid = Motor.decirUid
Motor.decirUid = function(uid, nombre, texto) if nombre == "Eduardo" then habloEduardo[#habloEduardo + 1] = texto end end
Mundo.actorVivo = function(uid) return uid == "edu" end
ED.st().uid = "edu"
check(Motor.inmediatas.decir_eduardo({ vars = {}, lugares = {}, def = "cap_chela_4" }, { "decir_eduardo", texto = "Hola" }) == true
    and habloEduardo[1] == "Hola", "decir_eduardo: habla si esta")
ED.st().uid = nil
Motor.inmediatas.decir_eduardo({ vars = {}, lugares = {}, def = "cap_chela_4" }, { "decir_eduardo", texto = "Chao" })
check(#habloEduardo == 1, "decir_eduardo: sin Eduardo no pasa nada")
Motor.decirUid = decirUid

lugares.calle_main, lugares.refugio_doris = { x = 2100, y = 2000 }, { x = 4000, y = 2000 }
inst = G.iniciarOferta(J, "westpoint", "medio", o)
check(inst ~= nil and inst.etapa == "irma" and inst.vars.pueblo_doris ~= nil, "arranca en la calle Main, con el pueblo de Doris sorteado")
local nombraIrma = false
for _, d in ipairs(dichos) do if d:find("Irma", 1, true) then nombraIrma = true end end
check(nombraIrma, "la Chela cuenta lo de Irma")
px, py = 2100, 2000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "irma_calle", "llega a la calle Main")
local zombiMujer, relicario = false, false
for _, p in ipairs(inst.pendientes) do
    if p[1] == "zombi_en" and p.femenino then zombiMujer = true end
    if p[1] == "objeto" and p.id == "relicario" then relicario = true end
end
check(zombiMujer and relicario, "Irma transformada y su relicario")
tiene[1] = { etiqueta = inst.id .. ":relicario" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "doris", "con el relicario: a buscar a Doris")
px, py = 4000, 2000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "sitio", "llega donde Doris")
inst.grupos.doris = { estado = "listo", miembros = { d1 = { rol = "doris", vivo = true } }, roles = { doris = "d1" }, nombres = {} }
inst.vars.meta_doris = 20
bajas = 20
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "aguanta la horda: hablar con Doris")
Motor.elegir(J, inst.id, "llevar")
check(inst.etapa == "escolta", "Doris va al cuartel")
Mundo.posicionActor = function() return CUARTEL.x + 2, CUARTEL.y end
px, py = CUARTEL.x, CUARTEL.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "cuartel", "Doris y la Chela frente a frente")
Motor.elegir(J, inst.id, "relicario")
check(inst.final == "final_relicario" and m.historia_westpoint_4 == true, "le da el relicario: final_relicario")
check(#guardias == 1 and guardias[1][1] == "westpoint" and guardias[1][2] == "Doris", "Doris se queda de guardia en el cuartel")

-- Sin el relicario se puede cerrar igual; si Doris muere, fallido.
limpiar()
m.historia_westpoint_4 = nil
inst = G.iniciarOferta(J, "westpoint", "medio", G.ofertaEspecial("westpoint", "medio", "g1"))
inst.grupos.doris = { estado = "listo", miembros = { d1 = { rol = "doris", vivo = true } }, roles = { doris = "d1" }, nombres = {} }
Motor.entrar(inst, "cuartel", 0)
Motor.elegir(J, inst.id, "relicario")
check(inst.final == nil, "sin el relicario no se puede dar")
Motor.elegir(J, inst.id, "descansa")
check(inst.final == "final_descansa" and m.historia_westpoint_4 == true, "le dice que descansa: final_descansa")
limpiar()
m.historia_westpoint_4 = nil
inst = G.iniciarOferta(J, "westpoint", "medio", G.ofertaEspecial("westpoint", "medio", "g1"))
Motor.entrar(inst, "escolta", 0)
inst.grupos.doris = { estado = "listo", miembros = { d1 = { rol = "doris", vivo = false } }, roles = { doris = "d1" }, nombres = {} }
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_muerta" and m.historia_westpoint_4 == "fallido" and #guardias == 0, "Doris muere: fallido y sin guardia")

-- ---------------------------------------------------------------------------
-- 5. Padre Nacho, capitulo 4
-- ---------------------------------------------------------------------------
limpiar()
local er = C.estado("riverside")
er.x, er.y, er.z, er.etiqueta = 6000, 6000, 0, "la iglesia"
local IGLESIA = { x = 6000, y = 6000 }
m.historia_riverside_1, m.historia_riverside_2, m.historia_riverside_3 = true, true, true
m.lucia = "en_riverside"
o = G.ofertaEspecial("riverside", "facil", "g1")
check(o ~= nil and o.def == "cap_nacho_4", "con Lucia de vuelta sale el cap. 4 del Padre")
lugares.ferreteria = { x = 6300, y = 6000 }
inst = G.iniciarOferta(J, "riverside", "facil", o)
check(inst ~= nil and inst.etapa == "viaje", "arranca: a la ferreteria")
px, py = 6300, 6000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "ferreteria", "llega a la ferreteria")
tiene[1] = { etiqueta = inst.id .. ":cuerda" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "volver", "con la cuerda: volver")
px, py = IGLESIA.x, IGLESIA.y
Motor.elegir(J, inst.id, "entregar")
check(inst.etapa == "esperar", "le da la cuerda: esperar el mediodia")
ahora = ahora + 0.1
Motor.procesarPendientes(inst)
local nombraLucia = false
for _, d in ipairs(dichos) do if d:find("Lucia", 1, true) then nombraLucia = true end end
check(nombraLucia, "con Lucia en Riverside, el Padre la nombra")
ahora = 24 * 50 + 9
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "esperar", "a las 9 todavia no")
ahora = 24 * 50 + 12
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "campanario", "al mediodia: al campanario")
Motor.elegir(J, inst.id, "tocar")
check(inst.etapa == "defensa", "toca las campanas: defender la iglesia")
local hayRuido, hayFieles = false, false
for _, p in ipairs(inst.pendientes) do
    if p[1] == "ruido" then hayRuido = true end
    if p[1] == "npcs" and p.id == "feligreses" and #p.perfiles == 3 then hayFieles = true end
end
check(hayRuido and hayFieles, "las campanas hacen ruido y llegan tres feligreses")
inst.grupos.feligreses = { estado = "listo", nombres = {}, roles = { otis = "f1", ruth = "f2", helen = "f3" },
    miembros = { f1 = { rol = "otis", vivo = true }, f2 = { rol = "ruth", vivo = true }, f3 = { rol = "helen", vivo = false } } }
inst.vars.meta_misa = 30
bajas = 30
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "misa" and inst.vars.vinieron == "algunos", "aguantan: misa, sin uno de los feligreses")
ahora = ahora + 0.5
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_cumplido" and m.historia_riverside_4 == true, "despues de la misa: final_cumplido")
check(#guardias == 2, "los dos feligreses vivos quedan de guardias en la iglesia")

-- Si el jugador se va mientras suenan las campanas: no llega nadie.
limpiar()
m.historia_riverside_4 = nil
inst = G.iniciarOferta(J, "riverside", "facil", G.ofertaEspecial("riverside", "facil", "g1"))
Motor.entrar(inst, "defensa", 0)
px, py = 0, 0
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "defensa", "recien se fue: sigue la defensa")
ahora = ahora + 1.5
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_vacia" and m.historia_riverside_4 == "fallido" and #guardias == 0, "se fue una hora: nadie llego, fallido")

-- ---------------------------------------------------------------------------
-- 6. Misia Rosa, capitulo 5
-- ---------------------------------------------------------------------------
local function familias(inst, vivos)
    inst.grupos.turner = { estado = "listo", nombres = {}, roles = { ellen = "t1", roy = "t2" },
        miembros = { t1 = { rol = "ellen", vivo = vivos.ellen ~= false }, t2 = { rol = "roy", vivo = vivos.roy ~= false } } }
    inst.grupos.mercer = { estado = "listo", nombres = {}, roles = { andre = "m1", laura = "m2" },
        miembros = { m1 = { rol = "andre", vivo = vivos.andre ~= false }, m2 = { rol = "laura", vivo = vivos.laura ~= false } } }
end
limpiar()
local eo = C.estado("rosewood")
eo.x, eo.y, eo.z, eo.etiqueta = 8000, 8000, 0, "la gasolinera"
local BOMBA = { x = 8000, y = 8000 }
m.historia_rosewood_1, m.historia_rosewood_2, m.historia_rosewood_3, m.historia_rosewood_4 = true, true, true, true
m.estanque_rosewood, m.carcel_rosewood = "saqueado", "limpiada"
o = G.ofertaEspecial("rosewood", "facil", "g1")
check(o ~= nil and o.def == "cap_rosa_5", "con la carcel hecha sale el cap. 5 de la Misia Rosa")
lugares.casa_turner, lugares.casa_mercer, lugares.bencinera = { x = 8200, y = 8000 }, { x = 8400, y = 8000 }, { x = 8800, y = 8000 }
px, py = BOMBA.x, BOMBA.y
inst = G.iniciarOferta(J, "rosewood", "facil", o)
check(inst ~= nil and inst.etapa == "bencina", "sin tanque: primero hay que buscar bencina")
px, py = 8800, 8000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "bencinera", "llega a la bencinera")
tiene[1] = { etiqueta = inst.id .. ":bidon" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "bencina_volver", "con el bidon: volver")
px, py = BOMBA.x, BOMBA.y
Motor.elegir(J, inst.id, "bidon")
check(inst.etapa == "viaje_turner", "con bencina: a buscar a los Turner")
px, py = 8200, 8000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa_turner", "llega donde los Turner")
familias(inst, {})
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa_turner", "con zombis cerca, todavia no salen")
Mundo.zombiCerca = function() return false end
ahora = ahora + 0.3
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "viaje_mercer", "los Turner van solos; ahora los Mercer")
px, py = 8400, 8000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa_mercer", "llega donde los Mercer")
ahora = ahora + 0.3
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "reunion", "los Mercer tambien van solos")
Mundo.posicionActor = function() return BOMBA.x + 2, BOMBA.y end
px, py = BOMBA.x, BOMBA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "marea", "llegan todos: la marea")
inst.vars.meta_marea = 40
bajas = 40
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_carcel" and m.historia_rosewood_5 == true, "con la carcel limpia, el camion los lleva alla")
local conPerfil = 0
for _, g2 in ipairs(guardias) do if g2[3] ~= nil then conPerfil = conPerfil + 1 end end
check(#guardias == 4 and conPerfil == 0, "los cuatro cuentan como salvados, sin quedarse de guardias")

-- Con el tanque defendido y la carcel sin limpiar: directo a las familias y se quedan de guardias.
limpiar()
m.historia_rosewood_5 = nil
m.estanque_rosewood, m.carcel_rosewood = "defendido", nil
inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
check(inst.etapa == "viaje_turner", "con el tanque: directo a los Turner")
familias(inst, { roy = false })
Motor.entrar(inst, "marea", 0)
inst.vars.meta_marea = 10
bajas = 10
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_gasolinera" and inst.vars.vinieron == "algunos", "sin carcel: se quedan en la gasolinera; murio Roy")
check(#guardias == 3 and guardias[1][3] ~= nil and guardias[1][4] ~= nil, "los tres vivos quedan de guardias en la gasolinera")

-- Si no llega nadie: fallido.
limpiar()
m.historia_rosewood_5 = nil
inst = G.iniciarOferta(J, "rosewood", "facil", G.ofertaEspecial("rosewood", "facil", "g1"))
familias(inst, { ellen = false, roy = false, andre = false, laura = false })
Motor.entrar(inst, "reunion", 0)
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_perdidos" and m.historia_rosewood_5 == "fallido" and #guardias == 0, "no llega nadie: fallido")

-- ---------------------------------------------------------------------------
-- 7. Cabo Ramiro, capitulo 5
-- ---------------------------------------------------------------------------
local function haines(inst, vivo)
    inst.grupos.haines = { estado = "listo", nombres = {}, roles = { haines = "h1" },
        miembros = { h1 = { rol = "haines", vivo = vivo ~= false } } }
end
limpiar()
Mundo.zombiCerca = function() return true end
Mundo.posicionActor = function() return 0, 0 end
m.historia_muldraugh_1, m.historia_muldraugh_2, m.historia_muldraugh_3 = true, true, true
m.historia_muldraugh_4, m.historia_muldraugh_5, m.hija_cabo = nil, nil, "muerta"
o = G.ofertaEspecial("muldraugh", "facil", "g1")
check(o == nil or o.def ~= "cap_cabo_5", "sin el capitulo 4 no sale el 5 del Cabo")
m.historia_muldraugh_4 = "fallido"
o = G.ofertaEspecial("muldraugh", "facil", "g1")
check(o ~= nil and o.def == "cap_cabo_5" and o.vars.nivel == "dificil", "con el 4 hecho (aunque saliera mal) sale el 5, pago dificil")
lugares.casa_haines = { x = 1000, y = 0 }
px, py = CASA.x, CASA.y
inst = G.iniciarOferta(J, "muldraugh", "facil", o)
check(inst ~= nil and inst.etapa == "viaje", "arranca: a la casa de Haines")
local nombraHaines, nombraValentina = false, false
for _, d in ipairs(dichos) do
    if d:find("Haines", 1, true) then nombraHaines = true end
end
for _, p in ipairs(inst.pendientes) do
    if p[1] == "decir_contacto" and tostring(p.texto):find("Valentina", 1, true) then nombraValentina = true end
end
check(nombraHaines and nombraValentina, "el Cabo nombra a Haines y, con Valentina muerta, la recuerda")
px, py = 1000, 0
Mundo.posicionActor = function() return 1002, 0 end
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa", "llega a la casa de Haines")
haines(inst, true)
ahora = ahora + 0.3
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa", "sin el libro no sigue")
tiene[1] = { etiqueta = inst.id .. ":libro" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa", "con zombis cerca todavia no se habla")
Mundo.zombiCerca = function() return false end
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "con el libro y la casa tranquila: hablar con Haines")
Motor.elegir(J, inst.id, "detenido")
check(inst.etapa == "escolta", "se lo lleva detenido")
Mundo.posicionActor = function() return CASA.x + 2, CASA.y end
px, py = CASA.x, CASA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "entrega", "Haines llega a la comisaria")
Motor.elegir(J, inst.id, "libro")
check(inst.final == "final_juicio" and m.historia_muldraugh_5 == true, "entrega el libro: final_juicio")
check(#guardias == 1 and guardias[1][1] == "muldraugh" and guardias[1][2] == "Walter" and guardias[1][3] ~= nil,
    "Haines queda de guardia en la comisaria")

-- Haines suelto: el libro igual cierra el censo, sin guardia.
limpiar()
m.historia_muldraugh_5 = nil
Mundo.posicionActor = function() return 0, 0 end
inst = G.iniciarOferta(J, "muldraugh", "facil", G.ofertaEspecial("muldraugh", "facil", "g1"))
haines(inst, true)
Motor.entrar(inst, "hablar", 0)
Motor.elegir(J, inst.id, "soltar")
check(inst.etapa == "volver" and inst.vars.haines == "soltado", "lo deja ir: volver con el libro")
tiene[1] = { etiqueta = inst.id .. ":libro" }
Motor.elegir(J, inst.id, "libro")
check(inst.final == "final_libro" and m.historia_muldraugh_5 == true and #guardias == 0, "con Haines suelto: final_libro sin guardia")

-- Haines muere en la casa: con el libro se vuelve igual.
limpiar()
m.historia_muldraugh_5 = nil
inst = G.iniciarOferta(J, "muldraugh", "facil", G.ofertaEspecial("muldraugh", "facil", "g1"))
Motor.entrar(inst, "casa", 0)
haines(inst, false)
tiene[1] = { etiqueta = inst.id .. ":libro" }
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "volver" and inst.vars.haines == "muerto", "murio Haines: volver con el libro")
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_sin_libro" and m.historia_muldraugh_5 == "fallido", "sin el libro: fallido")

-- Si nunca va: a las 96 horas queda fallido.
limpiar()
m.historia_muldraugh_5 = nil
inst = G.iniciarOferta(J, "muldraugh", "facil", G.ofertaEspecial("muldraugh", "facil", "g1"))
ahora = ahora + 97
px, py = CASA.x, CASA.y
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_abandono" and m.historia_muldraugh_5 == "fallido", "no fue en 96 horas: fallido")
m.hija_cabo = nil

-- ---------------------------------------------------------------------------
-- 8. Tia Chela, capitulo 5
-- ---------------------------------------------------------------------------
local function hales(inst, martha, walt)
    inst.grupos.martha = { estado = "listo", nombres = {}, roles = { martha = "h1" },
        miembros = { h1 = { rol = "martha", vivo = martha ~= false } } }
    inst.grupos.walt = { estado = "listo", nombres = {}, roles = { walt = "h2" },
        miembros = { h2 = { rol = "walt", vivo = walt ~= false } } }
end
local function pendienteCon(inst, texto)
    for _, p in ipairs(inst.pendientes) do
        if (p[1] == "decir_contacto" or p[1] == "decir" or p[1] == "aviso") and tostring(p.texto):find(texto, 1, true) then return true end
    end
    return false
end
limpiar()
Mundo.zombiCerca = function() return true end
Mundo.posicionActor = function() return 0, 0 end
m.historia_westpoint_4, m.historia_westpoint_5 = nil, nil
o = G.ofertaEspecial("westpoint", "medio", "g1")
check(o == nil or o.def ~= "cap_chela_5", "sin el capitulo 4 no sale el 5 de la Chela")
m.historia_westpoint_4 = "fallido"
o = G.ofertaEspecial("westpoint", "medio", "g1")
check(o ~= nil and o.def == "cap_chela_5" and o.vars.nivel == "dificil", "con el 4 hecho (aunque saliera mal) sale el 5 de la Chela, pago dificil")
m.radio_westpoint, m["cap_chela_4.final"] = true, "final_relicario"
lugares.casa_hale = { x = 2500, y = 2000 }
px, py = CUARTEL.x, CUARTEL.y
inst = G.iniciarOferta(J, "westpoint", "medio", o)
check(inst ~= nil and inst.etapa == "viaje", "arranca: a la casa de los Hale")
check(dichos[1] ~= nil and dichos[1]:find("Hale", 1, true) ~= nil, "la Chela nombra a los Hale")
check(pendienteCon(inst, "radio") and pendienteCon(inst, "camion rojo") and not pendienteCon(inst, "Yo no apago fuegos"),
    "con la radio y el relicario: Martha llamo y la Chela vuelve a apagar fuegos")
px, py = 2500, 2000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa", "llega donde los Hale")
local dosGrupos = 0
for _, p in ipairs(inst.pendientes) do if p[1] == "npcs" and (p.id == "martha" or p.id == "walt") then dosGrupos = dosGrupos + 1 end end
check(dosGrupos == 2, "aparecen Martha y Walt")
hales(inst, true, true)
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "casa", "con la horda encima todavia no se habla")
inst.vars.meta_hale = 20
bajas = 20
Mundo.posicionActor = function() return 2502, 2000 end
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "aguanta la horda: hablar con los Hale")
Motor.elegir(J, inst.id, "llevar")
check(inst.etapa == "escolta" and inst.vars.walt == "viene", "se lleva a Walt mordido y todo")
Mundo.posicionActor = function() return CUARTEL.x + 2, CUARTEL.y end
px, py = CUARTEL.x, CUARTEL.y
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_juntos" and m.historia_westpoint_5 == true and m.hale == "juntos", "llegan los dos: final_juntos")
check(#guardias == 1 and guardias[1][1] == "westpoint" and guardias[1][2] == "Martha", "solo Martha queda de guardia (Walt viene mordido)")

-- Walt pide quedarse: Martha llega sola.
limpiar()
m.historia_westpoint_5, m.hale, m["cap_chela_4.final"] = nil, nil, "final_descansa"
Mundo.posicionActor = function() return 0, 0 end
px, py = CUARTEL.x, CUARTEL.y
inst = G.iniciarOferta(J, "westpoint", "medio", G.ofertaEspecial("westpoint", "medio", "g1"))
check(pendienteCon(inst, "Yo no apago fuegos") and not pendienteCon(inst, "camion rojo"), "sin el relicario la Chela sigue sin apagar fuegos")
hales(inst, true, true)
Mundo.posicionActor = function() return 2502, 2000 end
px, py = 2500, 2000
Motor.entrar(inst, "hablar", 0)
Motor.elegir(J, inst.id, "quedarse")
check(inst.etapa == "sola" and inst.vars.walt == "se_quedo", "Walt se queda: Martha va sola")
Mundo.posicionActor = function() return CUARTEL.x + 2, CUARTEL.y end
px, py = CUARTEL.x, CUARTEL.y
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_sola" and m.historia_westpoint_5 == true and m.hale == "se_quedo" and #guardias == 1,
    "Martha llega sola: final_sola, de guardia")

-- Walt muere en la casa y despues Martha en el camino: fallido.
limpiar()
m.historia_westpoint_5, m.hale = nil, nil
Mundo.posicionActor = function() return 2502, 2000 end
inst = G.iniciarOferta(J, "westpoint", "medio", G.ofertaEspecial("westpoint", "medio", "g1"))
Motor.entrar(inst, "casa", 0)
hales(inst, true, false)
inst.vars.meta_hale = 20
bajas = 20
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "sola" and inst.vars.walt == "murio", "murio Walt: Martha va sola")
inst.grupos.martha.miembros.h1.vivo = false
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_muertos" and m.historia_westpoint_5 == "fallido" and m.hale == "muertos" and #guardias == 0,
    "Martha muere en el camino: fallido")

-- Si nunca va: a las 24 horas se apago el fuego.
limpiar()
m.historia_westpoint_5, m.hale = nil, nil
px, py = 0, 0
inst = G.iniciarOferta(J, "westpoint", "medio", G.ofertaEspecial("westpoint", "medio", "g1"))
ahora = ahora + 25
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_tarde" and m.historia_westpoint_5 == "fallido", "no fue en 24 horas: fallido")
m.radio_westpoint, m["cap_chela_4.final"], m.hale = nil, nil, nil

-- ---------------------------------------------------------------------------
-- 9. Padre Nacho, capitulo 5
-- ---------------------------------------------------------------------------
local function duggan(inst, vivo)
    inst.grupos.duggan = { estado = "listo", nombres = {}, roles = { duggan = "d5" },
        miembros = { d5 = { rol = "duggan", vivo = vivo ~= false } } }
end
limpiar()
Mundo.zombiCerca = function() return true end
Mundo.posicionActor = function() return 0, 0 end
m.historia_riverside_4, m.historia_riverside_5 = nil, nil
o = G.ofertaEspecial("riverside", "facil", "g1")
check(o == nil or o.def ~= "cap_nacho_5", "sin el capitulo 4 no sale el 5 del Padre")
m.historia_riverside_4 = "fallido"
o = G.ofertaEspecial("riverside", "facil", "g1")
check(o ~= nil and o.def == "cap_nacho_5" and o.vars.nivel == "dificil", "con el 4 hecho (aunque saliera mal) sale el 5 del Padre, pago dificil")
m.lucia, m["cap_nacho_4.final"] = "en_riverside", "final_cumplido"
lugares.guarida = { x = 6500, y = 6000 }
px, py = IGLESIA.x, IGLESIA.y
inst = G.iniciarOferta(J, "riverside", "facil", o)
check(inst ~= nil and inst.etapa == "viaje", "arranca: a la guarida de Duggan")
check(dichos[1] ~= nil and dichos[1]:find("Duggan", 1, true) ~= nil and pendienteCon(inst, "Lucia dice que vaya yo"),
    "el Padre nombra a Duggan y, con Lucia en Riverside, a Lucia")
px, py = 6500, 6000
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "guarida", "llega a la guarida")
duggan(inst, true)
ahora = ahora + 0.3
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "guarida", "con zombis cerca todavia no se habla")
Mundo.zombiCerca = function() return false end
Mundo.posicionActor = function() return 6502, 6000 end
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "la guarida tranquila: hablar con Duggan")
check(pendienteCon(inst, "Fui a su misa"), "si la misa salio bien, Duggan cuenta que fue")
Motor.elegir(J, inst.id, "llevar")
check(inst.etapa == "camino", "Duggan va a la iglesia")
Mundo.posicionActor = function() return IGLESIA.x + 2, IGLESIA.y end
px, py = IGLESIA.x, IGLESIA.y
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "confesion", "Duggan llega a la iglesia: la confesion")
Motor.elegir(J, inst.id, "dejar")
check(inst.final == "final_absuelto" and m.historia_riverside_5 == true and m.duggan == "iglesia", "se confiesa con el Padre: final_absuelto")

-- Escucharlo ahi mismo, en nombre del Padre.
limpiar()
m.historia_riverside_5, m.duggan = nil, nil
Mundo.posicionActor = function() return 6502, 6000 end
px, py = 6500, 6000
inst = G.iniciarOferta(J, "riverside", "facil", G.ofertaEspecial("riverside", "facil", "g1"))
duggan(inst, true)
Motor.entrar(inst, "hablar", 0)
Motor.elegir(J, inst.id, "escuchar")
check(inst.etapa == "volver", "lo escucha ahi: volver con el Padre")
px, py = IGLESIA.x, IGLESIA.y
Motor.elegir(J, inst.id, "contar")
check(inst.final == "final_estola" and m.historia_riverside_5 == true and m.duggan == "escuchado", "le cuenta la confesion: final_estola")

-- Si tarda mas de 4 horas en llegar, Duggan se da vuelta en el camino.
limpiar()
m.historia_riverside_5, m.duggan = nil, nil
Mundo.posicionActor = function() return 0, 0 end
inst = G.iniciarOferta(J, "riverside", "facil", G.ofertaEspecial("riverside", "facil", "g1"))
duggan(inst, true)
Motor.entrar(inst, "camino", 0)
px, py = 0, 0
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "camino", "recien sale: sigue el camino")
ahora = ahora + 4.1
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_tarde" and m.historia_riverside_5 == "fallido" and m.duggan == "se_dio_vuelta"
    and inst.grupos.duggan.miembros.d5.causa == "transformado", "a las 4 horas se da vuelta: fallido")

-- Si nunca va: a las 48 horas, fallido.
limpiar()
m.historia_riverside_5, m.duggan = nil, nil
inst = G.iniciarOferta(J, "riverside", "facil", G.ofertaEspecial("riverside", "facil", "g1"))
ahora = ahora + 49
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_abandono" and m.historia_riverside_5 == "fallido", "no fue en 48 horas: fallido")
m["cap_nacho_4.final"], m.duggan = nil, nil

-- El guardia no aparece mientras el NPC de la historia siga en el mundo.
st.arcos["x#1"] = { grupos = { ortiz = { roles = { celia = "u1" }, miembros = { u1 = { vivo = true } } } } }
local g = { esperar = { arco = "x#1", grupo = "ortiz", rol = "celia", hasta = ahora + 24 } }
check(K.esperaAlDeLaHistoria(g), "espera mientras Celia sigue ahi")
st.arcos["x#1"].grupos.ortiz.miembros.u1.retirado = true
check(not K.esperaAlDeLaHistoria(g) and g.esperar == nil, "Celia se retiro: aparece el guardia")
st.arcos["x#1"].grupos.ortiz.miembros.u1.retirado = nil
g.esperar = { arco = "x#1", grupo = "ortiz", rol = "celia", hasta = ahora - 1 }
check(not K.esperaAlDeLaHistoria(g), "no espera para siempre")
check(not K.esperaAlDeLaHistoria({}), "un guardia de un encuentro no espera a nadie")

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
