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
    check(seguidos and n >= 3, cid .. ": capitulos 2 a " .. n .. " sin saltos")
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
