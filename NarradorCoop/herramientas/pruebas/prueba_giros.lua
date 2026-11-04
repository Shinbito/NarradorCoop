-- Prueba: los giros de La Grange (bandido_giros, Arcos/Bandido.lua). Vargas te manda a Louisville
-- por Danny Pereira entre el capitulo 4 y el 5; lo que se descubre cambia el capitulo 5 (final_lena,
-- las notas del final de redencion) y lo comenta el Cabo. Se corre con correr.py.
require "Narrador/Arcos/Bandido"
local Mundo, Motor, C, BA, Defs, Lore = Narrador.Mundo, Narrador.Motor, Narrador.Contactos, Narrador.Bandido,
    Narrador.Defs, Narrador.Lore
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

-- ---------------------------------------------------------------------------
-- Mundo de mentira
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
Mundo.azar = function() return 100 end
Mundo.puebloCercano = function() return nil end
Mundo.cargado = function() return nil end
local px, py = 0, 0
Mundo.posicion = function() return px, py, 0 end
Mundo.jugadorCerca = function(x, y, r)
    if math.sqrt((px - x) ^ 2 + (py - y) ^ 2) <= (r or 35) then return J end
    return nil
end
local GOMERIA, CABO = { x = 13000, y = 2000 }, { x = 400, y = 400 }
Mundo.buscarLugar = function(spec)
    local l = spec.pueblo == "Louisville" and GOMERIA or { x = 5000, y = 5000 }
    return { x = l.x, y = l.y, z = 0, etiqueta = tostring(spec.nombre or "algun lado"), sala = "mechanic" }
end
Mundo.buscarItem = function() return nil end
Mundo.quitarItem = function() end
Mundo.darItem = function() end
Mundo.crearItem = function(t) return { tipo = type(t) == "table" and t[1] or t, getModData = function() return {} end } end
local dichos, avisos, cabo = {}, {}, {}
Motor.enviar = function(_, cmd, d) if cmd == "aviso" and d ~= nil then avisos[#avisos + 1] = d.texto end end
Motor.publicar = function() end
Motor.responder = function() end
Motor.decir = function(inst, grupo, rol, texto)
    texto = Motor.texto(inst, texto)
    dichos[#dichos + 1] = tostring(grupo) .. ":" .. tostring(texto)
end
C.decir = function(id, texto) cabo[#cabo + 1] = id .. ":" .. texto end
local KN = Narrador.Knox
if KN ~= nil then KN.sumar = function() end end
Motor.minutosDesdeArranque = 0

local st = Motor.estado()
local m = st.memoria
local function dijo(trozo)
    for _, d in ipairs(dichos) do if d:find(trozo, 1, true) then return true end end
    return false
end
local function pendiente(trozo)
    for _, i in pairs(st.arcos) do
        for _, p in ipairs(i.pendientes or {}) do
            if type(p.texto) == "string" and p.texto:find(trozo, 1, true) then return true end
        end
    end
    return false
end
local function listo(inst, id, roles, vivos)
    local g = { estado = "listo", miembros = {}, roles = {}, nombres = {} }
    for i, rol in ipairs(roles) do
        g.miembros["u" .. id .. i] = { rol = rol, vivo = vivos == nil or vivos[i] ~= false }
        g.roles[rol] = "u" .. id .. i
    end
    inst.grupos[id] = g
end
local function instDe(defId)
    for _, i in pairs(st.arcos) do if i.def == defId and i.final == nil then return i end end
    return nil
end
local function nuevaPartida()
    for k in pairs(st.arcos) do st.arcos[k] = nil end
    st.orden = {}
    for k in pairs(m) do m[k] = nil end
    m["lugar.bandido_patio"] = { x = 0, y = 0, z = 0, etiqueta = "el patio de trenes" }
    m.bandido_cap, m.bandido_ultimo, m.bandido_ultimo_visto = 4, "hecho", "hecho"
    m.bandido_desde = ahora - 100
    m.historia_abierta = true
    dichos, avisos, cabo = {}, {}, {}
    px, py = 0, 0
end
local function opcion(inst, id)
    local def = Defs.get(inst.def)
    for _, op in ipairs(def.etapas[inst.etapa].opciones or {}) do
        if op.id == id then return Motor.opcionVisible(inst, op) end
    end
    return false
end
-- Del patio a la gomeria y de vuelta, hasta el informe con Vargas.
local function hastaLaGomeria(inst)
    listo(inst, "vargas", { "vargas" })
    Motor.revisarSalidas(inst, 0)
    check(inst.etapa == "cuenta", "Vargas espera en el vagon de raciones")
    check(pendiente("Danny Pereira. El hermano") and pendiente("calle Preston"), "Vargas nombra a Danny y la gomeria")
    Motor.elegir(J, inst.id, "aceptar")
    check(inst.etapa == "viaje" and inst.lugares.gomeria ~= nil and inst.lugares.gomeria.x == GOMERIA.x, "la gomeria esta en Louisville")
    px, py = GOMERIA.x, GOMERIA.y
    Motor.revisarSalidas(inst, 0)
    check(inst.etapa == "gomeria", "llega a la calle Preston")
end
local function deVuelta(inst)
    check(inst.etapa == "volver", "vuelve al patio")
    px, py = 0, 0
    listo(inst, "vargas", { "vargas" })
    listo(inst, "pereira", { "pereira", "desertor1", "desertor2" })
    Motor.revisarSalidas(inst, 0)
    check(inst.etapa == "informe", "Vargas pide el dato")
end

-- ---------------------------------------------------------------------------
-- 0. Esta escrito, con diario, y en "Los que ya no estan"
-- ---------------------------------------------------------------------------
local def = Defs.get("bandido_giros")
check(def ~= nil, "bandido_giros esta registrado")
local sinLore = {}
for nombre, etapa in pairs(def.etapas) do
    if etapa.final and Lore.final("bandido_giros", nombre) == nil then sinLore[#sinLore + 1] = nombre end
    if not etapa.final and etapa.pista ~= nil and Lore.etapa("bandido_giros", nombre) == nil then sinLore[#sinLore + 1] = nombre end
end
check(#sinLore == 0, "diario en cada etapa y final " .. table.concat(sinLore, ", "))
check(Lore.final("bandido_5", "final_lena") ~= nil, "final_lena tiene epilogo")
local enCaidos = false
for _, p in ipairs(Narrador.CaidosDefs.PERSONAJES) do if p.def == "bandido_giros" and p.rol == "danny" then enCaidos = true end end
check(enCaidos, "Danny Pereira esta en Los que ya no estan")
check(def.etapas.cuenta.salidas[1].ir == "final_redimido", "matar a alguien de la banda en el patio tambien redime")
-- La reconquista (camino con Pereira): si sabia que Danny vivia, el giro sin mandar.
local giro = false
for _, a in ipairs(Defs.get("reconquista_patio").etapas.final_luz.al_entrar) do
    if a[1] == "aviso" and type(a.texto) == "string" and a.texto:find("Danny", 1, true) then giro = true end
end
check(giro, "en la reconquista del patio, Pereira cae con el giro de Danny sin mandar")

-- ---------------------------------------------------------------------------
-- 1. Le cuentas a Danny quien pagaba y a la Sargento lo de Danny: final_lena
-- ---------------------------------------------------------------------------
print("1. Danny sabe, Pereira sabe: se va a Louisville")
nuevaPartida()
BA.revisar()
local inst = instDe("bandido_giros")
check(inst ~= nil and instDe("bandido_5") == nil, "con el cap. 4 hecho, al volver al patio sale Vargas (no el 5)")
hastaLaGomeria(inst)
inst.vars.meta_gomeria = 20
listo(inst, "danny", { "danny" })
Motor.contarBajas = function() return 20 end
Motor.revisarSalidas(inst, 0)
check(inst.etapa == "hablar", "aguanta la horda: hablar con Danny")
check(dijo("Lena me metio aqui") or pendiente("Lena me metio aqui"), "Danny dice 'Lena me metio aqui'")
check(dijo("dos muelas") or pendiente("dos muelas"), "Danny cuenta lo de las dos muelas")
Motor.elegir(J, inst.id, "contarle")
check(inst.vars.danny_sabe == true, "Danny sabe que pagaba su hermana")
check(dijo("Es una orden mia"), "Danny le manda una orden a Lena")
deVuelta(inst)
Motor.elegir(J, inst.id, "sargento")
check(inst.etapa == "sargento" and dijo("Dos muelas. Abril del ochenta y ocho"), "se lo cuentas a Pereira")
ahora = ahora + 1
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_sargento", "final_sargento")
check(m.danny_pereira == "vivo_contado" and m.danny_sabe == true, "memorias danny_pereira = vivo_contado y danny_sabe")
check(m.bandido_cap == 4, "no cuenta como capitulo: sigue en el 4")

ahora = ahora + BA.CADA + 1
BA.revisar()
local c5 = instDe("bandido_5")
check(c5 ~= nil and instDe("bandido_giros") == nil, "despues sale el capitulo 5")
check(c5.vars.danny_carpeta == "vivo" and c5.vars.danny_orden == true, "el 5 sabe lo de Danny (carpeta y orden)")
listo(c5, "pereira", { "pereira", "desertor1", "desertor2" })
Motor.revisarSalidas(c5, 0)
check(c5.etapa == "plan" and opcion(c5, "danny"), "en el plan aparece la orden de Danny")
Motor.elegir(J, c5.id, "danny")
check(c5.etapa == "lena" and dijo("Anote la hora"), "Pereira deja el reloj: 'Anote la hora'")
ahora = ahora + 1
Motor.revisarSalidas(c5, 0)
check(c5.final == "final_lena", "final_lena")
check(m.bandido == "redimido" and m.danny_pereira == "lena_fue" and m.bandido_cap == 5, "redimido, lena_fue, capitulo 5 hecho")
BA.revisar()
check(next(st.arcos) == nil or (instDe("bandido_5") == nil and instDe("bandido_giros") == nil), "no sale nada mas del bandido")
-- El Cabo se entera.
C.desbloqueado = function() return true end
C.lugar = function() return CABO end
BA.consecuenciaLena(m)
check(#cabo == 0, "lejos del Cabo no pasa nada")
px, py = CABO.x, CABO.y
BA.consecuenciaLena(m)
check(#cabo == 1 and cabo[1]:find("Louisville", 1, true) ~= nil and m.lena_comentada == true, "el Cabo comenta que se fue a Louisville")
BA.consecuenciaLena(m)
check(#cabo == 1, "una sola vez")

-- ---------------------------------------------------------------------------
-- 2. A Danny no le dices nada y el dato es solo para Vargas: redencion con la libreta
-- ---------------------------------------------------------------------------
print("2. Callas con Danny, el dato es de Vargas")
nuevaPartida()
BA.revisar()
inst = instDe("bandido_giros")
hastaLaGomeria(inst)
inst.vars.meta_gomeria = 20
listo(inst, "danny", { "danny" })
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "callar")
check(inst.vars.danny_sabe == nil and dijo("deberle a un fantasma"), "Danny sigue sin saber")
deVuelta(inst)
Motor.elegir(J, inst.id, "vargas")
check(inst.final == "final_vargas" and m.danny_pereira == "vivo" and m.danny_sabe == nil, "final_vargas: danny_pereira = vivo")
check(pendiente("le da cuerda") or dijo("le da cuerda"), "Vargas le da cuerda al reloj")
ahora = ahora + BA.CADA + 1
BA.revisar()
c5 = instDe("bandido_5")
check(c5 ~= nil and c5.vars.vargas_cero == true and c5.vars.danny_carpeta == nil, "el 5: Vargas en cero, Pereira no sabe")
listo(c5, "pereira", { "pereira", "desertor1", "desertor2" })
Motor.revisarSalidas(c5, 0)
check(not opcion(c5, "danny"), "sin la orden de Danny no hay tercer camino")
Motor.elegir(J, c5.id, "contra_pereira")
check(c5.etapa == "preparar", "le da la espalda")
ahora = ahora + 7
Motor.revisarSalidas(c5, 0)
check(c5.etapa == "asalto", "vuelve al patio a pelear")
listo(c5, "banda", { "pereira" }, { false })
Motor.revisarSalidas(c5, 0)
check(c5.final == "final_redencion" and m.bandido == "redimido", "final_redencion")
check(pendiente("Lo de la calle Preston quedo en cero"), "Vargas deja su libreta: la calle Preston quedo en cero")
check(not pendiente("Danny. Calle Preston"), "la carpeta de Pereira no dice nada de Danny")

-- ---------------------------------------------------------------------------
-- 3. Danny muere en la gomeria y se lo cuentas a Pereira
-- ---------------------------------------------------------------------------
print("3. Danny muere; Pereira lo sabe")
nuevaPartida()
BA.revisar()
inst = instDe("bandido_giros")
hastaLaGomeria(inst)
listo(inst, "danny", { "danny" }, { false })
Motor.revisarSalidas(inst, 0)
check(inst.vars.danny == "muerto", "Danny murio en la gomeria")
deVuelta(inst)
Motor.elegir(J, inst.id, "sargento")
check(dijo("Muerto"), "Pereira: 'Calle Preston. Muerto.'")
ahora = ahora + 1
Motor.revisarSalidas(inst, 0)
check(m.danny_pereira == "muerto_contado" and m.danny_sabe == nil, "danny_pereira = muerto_contado")
ahora = ahora + BA.CADA + 1
BA.revisar()
c5 = instDe("bandido_5")
check(c5.vars.danny_carpeta == "muerto" and c5.vars.danny_orden == nil, "el 5: la cruz en la carpeta, sin orden")
listo(c5, "pereira", { "pereira", "desertor1", "desertor2" })
Motor.revisarSalidas(c5, 0)
check(not opcion(c5, "danny"), "con Danny muerto no hay tercer camino")
Motor.elegir(J, c5.id, "contra_pereira")
ahora = ahora + 7
Motor.revisarSalidas(c5, 0)
listo(c5, "banda", { "pereira" }, { false })
Motor.revisarSalidas(c5, 0)
check(c5.final == "final_redencion" and pendiente("Danny. Calle Preston. Cruz."), "en la carpeta: 'Danny. Calle Preston. Cruz.'")

-- ---------------------------------------------------------------------------
-- 4. Le dices a Vargas que no; y con Meulen de jefe no sale
-- ---------------------------------------------------------------------------
print("4. Rechazo, y Meulen")
nuevaPartida()
BA.revisar()
inst = instDe("bandido_giros")
listo(inst, "vargas", { "vargas" })
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "rechazar")
check(inst.final == "final_rechazo" and m.danny_pereira == "rechazado", "final_rechazo")
ahora = ahora + BA.CADA + 1
BA.revisar()
check(instDe("bandido_5") ~= nil and instDe("bandido_giros") == nil, "despues sale el 5, sin repetir lo de Vargas")

nuevaPartida()
m.bandido_jefe = "maulen"
BA.revisar()
check(instDe("bandido_giros") == nil and instDe("bandido_5") ~= nil, "con Meulen de jefe no sale (Pereira ya no esta)")

-- Si nunca vas a Louisville, se cierra sola.
nuevaPartida()
BA.revisar()
inst = instDe("bandido_giros")
listo(inst, "vargas", { "vargas" })
Motor.revisarSalidas(inst, 0)
Motor.elegir(J, inst.id, "aceptar")
ahora = ahora + 121
Motor.revisarSalidas(inst, 0)
check(inst.final == "final_no_fue" and m.danny_pereira == "no_fue", "sin ir en cinco dias: final_no_fue")

if fallos == 0 then print("TODO BIEN") else print("FALLOS: " .. fallos) end
