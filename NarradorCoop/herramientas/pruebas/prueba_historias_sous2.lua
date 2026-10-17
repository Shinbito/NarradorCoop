-- Prueba: modo historia de Sous, parte 2 (HistoriasSous2). El lanzador (Sous aliado, una a la
-- vez, espera entre historias, sin chocar con otra historia_sous_*) y la historia de Walita de
-- punta a punta hasta el arma legendaria. Se corre con herramientas/pruebas/correr.py.

local Mundo, Motor = Narrador.Mundo, Narrador.Motor
local H, HS = Narrador.HistoriasSous2Server, Narrador.HistoriasSous2
local reloj, sig, avisos, dados, logs = 100, 900, {}, {}, {}
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
Mundo.horas = function() return reloj end
Mundo.azar = function(n) return 1 end
Mundo.log = function(t) logs[#logs + 1] = t end
Mundo.hayALife = function() return true end
Mundo.jugadores = function() return { "p1" } end
Mundo.jugadorAlAzar = function() return "p1" end
Mundo.nombreJugador = function() return "p1" end
Mundo.vivo = function() return true end
Mundo.grupoDe = function() return nil end
Mundo.posicion = function() return 45, 45, 0 end
Mundo.jugadorCerca = function() return "p1" end
Mundo.cargado = function() return {} end
Mundo.retirar = function() return true end
local perfilDe = {}
Mundo.actor = function(uid) return { lifecycle = "alive", profileId = perfilDe[uid] } end
Mundo.posicionActor = function() return 50, 50, 0 end
Mundo.banderas = function() end
Mundo.nombrarActor = function() end
Mundo.reservarNombres = function() end
Mundo.limpiarZona = function() end
Mundo.existePerfil = function() return true end
Mundo.crearFaccion = function() return true end
Mundo.buscarLugar = function() return { x = 50, y = 50, z = 0, etiqueta = "un lugar" } end
Mundo.crearItem = function(t) return { tipo = type(t) == "table" and t[1] or t, getModData = function(self) self.md = self.md or {}; return self.md end } end
Mundo.nombrar = function() end
Mundo.dejarEnSuelo = function() return true end
Mundo.darItem = function(p, item) dados[#dados + 1] = item end
Mundo.oleada = function() return 10 end
Mundo.corredores = function() end
Mundo.zombiCerca = function() return false end
Mundo.spawnGrupo = function(j, args, cb)
    local uids = {}
    for i = 1, #(args.profileIds or { 1 }) do
        sig = sig + 1; uids[#uids + 1] = sig
        perfilDe[sig] = args.profileIds ~= nil and args.profileIds[i] or nil
    end
    cb({ actorUids = uids }); return true
end
Mundo.buscarItem = function() return nil end
Motor.darMapaZona = function() end
Motor.enviar = function(p, cmd, d) if cmd == "aviso" then avisos[#avisos + 1] = d.texto end end
Motor.responder = function() end
Motor.publicar = function() end
Motor.actualizarPropios = function() end
Narrador.Legendario = { marcar = function(it) it:getModData().NarradorLegendario = {} end, aplicar = function() end }

local st = Motor.estado()
st.memoria = {}
st.residentes = { sous = { miembros = { [1] = { rol = "hanz", nombre = "Hanz", apellido = "Walita" },
    [2] = { rol = "cristian", nombre = "Cristian" }, [3] = { rol = "jorge", nombre = "Jorge" }, [4] = { rol = "cristobal", nombre = "Cristobal" },
    [5] = { rol = "benjamin", nombre = "Benjamin" } } } }

local function tick()
    Motor.minutosDesdeArranque = 10
    H.tick()
end
local function activa()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil and string.sub(inst.def, 1, 14) == "historia_sous_" then return inst end
    end
    return nil
end

print("1. lanzador")
check(Narrador.Defs.get("historia_sous_hanz") ~= nil and Narrador.Defs.get("historia_sous_cristobal") ~= nil, "las cuatro historias estan registradas")
tick()
check(activa() == nil, "sin Sous aliado no sale nada")
st.memoria.sous = "aliados"
tick()
check(activa() == nil and st.memoria["sous_historias2.ultima"] ~= nil, "la primera vez solo empieza a contar")
reloj = reloj + H.ESPERA_INICIAL + 1
st.director.ultimoPorDef.historia_sous_akagami = reloj - 5
tick()
check(activa() == nil, "espera si otra historia de Sous empezo hace poco")
st.director.ultimoPorDef.historia_sous_akagami = reloj - 100
-- Una historia del otro lanzador, en curso.
Narrador.Defs.registrar({ id = "historia_sous_akagami", inicio = "a", etapas = { a = { pista = "x" } } })
local otra = Motor.iniciar("historia_sous_akagami", "p1")
st.director.ultimoPorDef.historia_sous_akagami = reloj - 100
tick()
check(activa().def == "historia_sous_akagami", "no sale si hay otra historia de Sous en curso")
Motor.cancelar(otra.id)
tick()
local inst = activa()
check(inst ~= nil and inst.def == "historia_sous_hanz", "sale la de Walita (" .. tostring(inst and inst.def) .. ")")
reloj = reloj + 10
tick()
check(activa() == inst, "una a la vez")

print("2. Walita de punta a punta")
check(inst.etapa == "pedido" and inst.grupos.pide ~= nil, "pide en la base (" .. tostring(inst.etapa) .. ")")
Motor.elegir("p1", inst.id, "escuchar")
Motor.elegir("p1", inst.id, "aceptar")
check((inst.etapa == "viaje" or inst.etapa == "sitio") and inst.lugares.tienda ~= nil, "acepta y va a la tienda (" .. tostring(inst.etapa) .. ")")
Motor.tick()
Motor.tick()
check(inst.etapa == "sitio", "llega al sitio (" .. tostring(inst.etapa) .. ")")
Motor.tick()
reloj = reloj + 1.5
Motor.tick()
check(inst.etapa == "reencuentro", "reencuentro (" .. tostring(inst.etapa) .. ")")
check(inst.grupos.amigos ~= nil and inst.grupos.amigos.roles[Narrador.SousAmigos.PERFILES.waton[1]] ~= nil, "aparecen Waton y Clau")
Motor.elegir("p1", inst.id, "directo")
check(inst.etapa == "escolta" or inst.final == "final_hecho", "vuelve directo (" .. tostring(inst.etapa) .. ")")
Motor.tick()
check(inst.final == "final_hecho", "llega a la base: final_hecho (" .. tostring(inst.final or inst.etapa) .. ")")
check(st.memoria.sous_historia_hanz == "hecho", "memoria sous_historia_hanz = hecho")
check(#dados == 1 and dados[1].tipo == "Base.Mace" and dados[1].md.NarradorLegendario.nombre == "La Maza del Morro",
    "entrega La Maza del Morro")

print("3. la siguiente espera y es la de Cristonks")
Motor.tick()
reloj = reloj + H.ESPERA + 1
tick()
check(activa() ~= nil and activa().def == "historia_sous_cristian", "sale la de Cristonks")
local i2 = activa()
Motor.elegir("p1", i2.id, "escuchar")
Motor.elegir("p1", i2.id, "despues")
check(st.memoria.sous_historia_cristian == "postergada", "postergada")
reloj = reloj + H.ESPERA + 1
tick()
check(activa() ~= nil and activa().def == "historia_sous_jorge", "despues sigue Hasag (las postergadas al final)")

print("4. todas las etapas de las cuatro corren")
for _, rol in ipairs(HS.ROLES) do
    local def = Narrador.Defs.get(HS.idDe(rol))
    local i = Motor.iniciar(def.id, "p1", { vars = { chaperon = true, probado = false } })
    local n = 0
    for etapa, e in pairs(def.etapas) do
        if i ~= nil and not e.final then
            Motor.forzarEtapa(i.id, etapa)
            for _, op in ipairs(e.opciones or {}) do
                for _, a in ipairs(op.acciones or {}) do Motor.ejecutar(i, a) end
            end
            Motor.tick()
            n = n + 1
        end
    end
    if i ~= nil then Motor.cancelar(i.id) end
    check(i ~= nil and n >= 6, def.id .. ": " .. n .. " etapas")
end

local errores = 0
for _, l in ipairs(logs) do if string.find(tostring(l), "error") or string.find(tostring(l), "desconocid") then errores = errores + 1; print("  log: " .. tostring(l)) end end
check(errores == 0, "sin errores en el log")

if fallos == 0 then print("TODO BIEN") else print("FALLOS: " .. fallos) end
