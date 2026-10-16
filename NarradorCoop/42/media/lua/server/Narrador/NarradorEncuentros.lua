-- Narrador Co-op: encuentros de exploracion.
-- Mientras un jugador recorre el mapa (lejos de su refugio y de los misioneros), al entrar a
-- una zona nueva puede escuchar a alguien pidiendo ayuda en la direccion en que va. Uno
-- activo por grupo, con pausa entre encuentros. Los arcos estan en Arcos/Encuentros.lua.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/Arcos/Encuentros"

local Defs, Mundo, Motor, C = Narrador.Defs, Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local floor = math.floor

local E = Narrador.Encuentros or {}
Narrador.Encuentros = E

E.CELDA = 100
E.CHANCE_NUEVA = 15
E.CHANCE_VIEJA = 3
E.PAUSA = { 2, 4 }
E.MIN_MOVIMIENTO = 30
E.LEJOS_REFUGIO = 150
E.LEJOS_MISIONERO = 100
E.CHANCE_ECO = 50

-- Frases de cada Sous cuando esta en apuros.
E.SOUS = {
    { rol = "cristian", perfil = "narrador_sous_07", nombre = { "Cristian", "Cristonks" },
      grito = "Compadre! Aca arriba! Subi a mirar el paisaje y el paisaje subio conmigo, akkakaka!",
      gracias = "Compadre, te debo una. Bueno, dos. No le cuentes al primo." },
    { rol = "bastian", perfil = "narrador_sous_05", nombre = { "Bastian", "Tati" },
      grito = "Oe, loco, ayuda! Fui a buscar una chaqueta y la chaqueta tenia dueno, po!",
      gracias = "Loco, me salvaste la vida y la pinta. Te debo una, po." },
    { rol = "jorge", perfil = "narrador_sous_08", nombre = { "Jorge", "Hasag" },
      grito = "Manito, conte catorce. Despues deje de contar. Apurate, broder!",
      gracias = "Sangre, eso no estaba en el inventario. Te debo una." },
    { rol = "cristobal", perfil = "narrador_sous_09", nombre = { "Cristobal", "Wertres" },
      grito = "Hermanito! Estaba sacando un cable y se me vinieron todos, sangre!",
      gracias = "Hermanito, sabia que venias. Te quiero, wn. Te debo una." },
    { rol = "benjamin", perfil = "narrador_sous_03", nombre = { "Benjamin", "Matric" },
      grito = "Bro, te juro que fue un malentendido! Yo solo queria saludar!",
      gracias = "Hermano, eres un crack. Esto lo celebramos. Te debo una, bro." },
    { rol = "martin_a", perfil = "narrador_sous_01", nombre = { "Martin", "Akagami" },
      grito = "Mi bro! Uno, estoy rodeado. Dos, apurate. Tres, eso es todo!",
      gracias = "Mi sangre. Uno, gracias. Dos, no le digas a los cabros. Te debo una." },
    { rol = "martin_z", perfil = "narrador_sous_02", nombre = { "Martin", "Zent" },
      grito = "Estoy rodeado. Sorpresa. Si vienes, ven ya.",
      gracias = "Gracias. Lo digo una vez. No te acostumbres. Te debo una." },
    { rol = "hanz", perfil = "narrador_sous_06", nombre = { "Hanz", "Walita" },
      grito = "Broder! Vine por madera y me encontre con la familia entera, vale!",
      gracias = "Broder, te tallo algo por esto. Algo bonito. Te debo una, vale." },
}

function E.estado()
    local st = Motor.estado()
    st.enc = st.enc or {}
    local e = st.enc
    e.celdas = e.celdas or {}
    e.ultimaPos = e.ultimaPos or {}
    e.proximo = e.proximo or {}
    return e
end

function E.nivelSandbox()
    local v = tonumber(Mundo.sandbox("Encuentros", 3)) or 3
    if v <= 1 then return 0 end
    if v == 2 then return 0.5 end
    if v >= 4 then return 2 end
    return 1
end

-- "al norte", "al sureste"... (en Zomboid el norte es -y)
function E.direccion(dx, dy)
    local ang = math.deg(math.atan2(-dy, dx))
    if ang < 0 then ang = ang + 360 end
    local nombres = { "al este", "al noreste", "al norte", "al noroeste", "al oeste", "al suroeste", "al sur", "al sureste" }
    local i = floor((ang + 22.5) / 45) % 8 + 1
    return nombres[i]
end

function E.zonaDe(jugador, x, y)
    if Mundo.enVehiculo(jugador) then return "carretera" end
    for _, p in ipairs(Mundo.pueblos) do
        if x >= p.minX and x <= p.maxX and y >= p.minY and y <= p.maxY then return "ciudad" end
    end
    return "rural"
end

function E.activo(grupo)
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        local def = inst ~= nil and Defs.get(inst.def) or nil
        if inst ~= nil and inst.final == nil and def ~= nil and def.encuentro ~= nil and inst.vars.dueno == grupo then return inst end
    end
    return nil
end

local function lejosDe(x, y, jugador)
    local refugio = Mundo.refugioDe(jugador)
    if refugio ~= nil and math.sqrt((refugio.x - x) ^ 2 + (refugio.y - y) ^ 2) < E.LEJOS_REFUGIO then return false end
    for _, c in ipairs(C.LISTA) do
        local ce = C.estado(c.id)
        if ce.x ~= nil and math.sqrt((ce.x - x) ^ 2 + (ce.y - y) ^ 2) < E.LEJOS_MISIONERO then return false end
    end
    return true
end

function E.elegirTipo(zona, jugador, x, y)
    local candidatos, total = {}, 0
    local st = Motor.estado()
    for id, t in pairs(Narrador.EncuentrosTipos) do
        local sirve = false
        for _, z in ipairs(t.zona) do if z == zona then sirve = true end end
        if sirve and t.peso > 0 then candidatos[#candidatos + 1] = { id = id, peso = t.peso }; total = total + t.peso end
    end
    -- Sous en apuros: si son aliados y estas a menos de 1 km de su base.
    local base = st.memoria["lugar.base_sous"]
    if st.memoria.sous == "aliados" and type(base) == "table" and math.sqrt((base.x - x) ^ 2 + (base.y - y) ^ 2) < 1000 then
        candidatos[#candidatos + 1] = { id = "sous", peso = 6 }
        total = total + 6
    end
    if #candidatos == 0 then return nil end
    table.sort(candidatos, function(a, b) return a.id < b.id end)
    local tiro, acum = Mundo.azar(total), 0
    for _, c in ipairs(candidatos) do
        acum = acum + c.peso
        if tiro <= acum then return c.id end
    end
    return candidatos[#candidatos].id
end

function E.misioneroCercano(x, y)
    local mejor, md
    for _, c in ipairs(C.LISTA) do
        local ce = C.estado(c.id)
        -- Solo los que ya tienen campamento (desbloqueados).
        if ce.x ~= nil and (C.desbloqueado == nil or C.desbloqueado(c.id)) then
            local d = math.sqrt((ce.x - x) ^ 2 + (ce.y - y) ^ 2)
            if md == nil or d < md then mejor, md = c, d end
        end
    end
    return mejor
end

-- Arma y lanza un encuentro de "tipo" para el jugador, en la direccion en que se mueve.
function E.lanzar(jugador, tipo, dirX, dirY)
    local t = Narrador.EncuentrosTipos[tipo]
    if t == nil then return nil, "tipo desconocido" end
    local x, y, z = Mundo.posicion(jugador)
    if x == nil then return nil, "sin posicion" end
    local largo = math.sqrt((dirX or 0) ^ 2 + (dirY or 0) ^ 2)
    if largo < 1 then
        local ang = (Mundo.azar(360) / 180) * math.pi
        dirX, dirY, largo = math.cos(ang), math.sin(ang), 1
    end
    dirX, dirY = dirX / largo, dirY / largo
    local dist = 80 + Mundo.azar(120)
    local lateral = Mundo.azar(60) - 30
    local px = floor(x + dirX * dist - dirY * lateral)
    local py = floor(y + dirY * dist + dirX * lateral)
    local punto = { x = px, y = py, z = 0, etiqueta = Mundo.describir(px, py, nil, "el lugar del aviso") }
    if t.casa then
        local casa = Mundo.buscarLugar({ salas = { "livingroom", "kitchen", "bedroom" }, min = 0, max = 90 }, px, py)
        if casa ~= nil then punto = casa end
    end
    local grupo, nombreGrupo = Mundo.grupoDe(jugador)
    local G = Narrador.Generador
    local npc = G ~= nil and G.nombreCliente() or { nombre = "Alguien", apellido = "", perfil = "k93_red_cross_03" }
    local npc2 = G ~= nil and G.nombreCliente() or npc
    local v = {
        tipo = tipo, dueno = grupo, dueno_nombre = nombreGrupo,
        perfil = npc.perfil, perfil2 = npc2.perfil,
        nombre = npc.nombre, nombre_completo = npc.nombre .. " " .. npc.apellido,
        nombres = { npc = { npc.nombre, npc.apellido }, npc2 = { npc2.nombre, npc.apellido } },
        oleada = t.oleada, refuerzo = t.refuerzo, refuerzo_n = t.refuerzo ~= nil and 1 or 0,
        regalo = t.regalo, regalo_comerciante = { { "Base.Cigarettes" }, { "Base.TinnedBeans", "Base.CannedBeans" },
            { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.Battery" } },
        cuerda = t.cuerda == true, bateria = t.bateria == true, giro = "ninguno",
        eco_zombi = Mundo.azar(100) <= E.CHANCE_ECO, eco_horas = 72 + Mundo.azar(168),
    }
    local m = E.misioneroCercano(px, py)
    v.misionero = m ~= nil and m.nombre or "los misioneros"
    v.misionero_id = m ~= nil and m.id or nil
    if t.giro ~= nil and Mundo.azar(100) <= (t.giroChance or 0) then v.giro = t.giro end
    if tipo == "sous" then
        local st = Motor.estado()
        local vivos = {}
        for _, s in ipairs(E.SOUS) do
            if st.memoria["sous_murio_" .. s.rol] ~= true and st.memoria["sous2_murio_" .. s.rol] ~= true then vivos[#vivos + 1] = s end
        end
        if #vivos == 0 then return nil, "no queda nadie de Sous" end
        local s = vivos[Mundo.azar(#vivos)]
        v.perfil, v.nombre, v.nombre_completo = s.perfil, s.nombre[1], s.nombre[1] .. " " .. s.nombre[2]
        v.nombres = { npc = { s.nombre[1], s.nombre[2] } }
        v.grito_sous, v.gracias_sous, v.rol_sous = s.grito, s.gracias, s.rol
        v.eco_zombi = false
    end
    local function res(texto)
        if type(texto) == "string" and string.sub(texto, 1, 4) == "var:" then return v[string.sub(texto, 5)] end
        return texto
    end
    v.grito, v.gracias = res(t.grito), res(t.gracias)
    v.llegada = string.gsub(t.llegada, "{nombre}", v.nombre_completo)
    v.senal = string.gsub(string.gsub(t.senal, "{direccion}", E.direccion(px - x, py - y)), "{distancia}",
        tostring(floor(math.sqrt((px - x) ^ 2 + (py - y) ^ 2) / 10 + 0.5) * 10))
    v.titulo = tipo == "sous" and ("{nombre_completo} en apuros") or "Alguien pide ayuda"
    local inst, razon = Motor.iniciar("enc_" .. tipo, jugador, { vars = v, lugares = { punto = punto } })
    if inst ~= nil then
        local e = E.estado()
        e.proximo[grupo] = Mundo.horas() + E.PAUSA[1] + Mundo.azar((E.PAUSA[2] - E.PAUSA[1]) * 10) / 10
    end
    return inst, razon
end

function E.revisarJugador(p)
    local nivel = E.nivelSandbox()
    if nivel <= 0 or not Mundo.vivo(p) then return end
    local x, y = Mundo.posicion(p)
    if x == nil then return end
    local e = E.estado()
    local nombre = Mundo.nombreJugador(p)
    local antes = e.ultimaPos[nombre]
    e.ultimaPos[nombre] = { x = floor(x), y = floor(y) }
    if antes == nil then return end
    local dx, dy = x - antes.x, y - antes.y
    if math.sqrt(dx * dx + dy * dy) < E.MIN_MOVIMIENTO then return end
    local grupo = Mundo.grupoDe(p)
    e.celdas[grupo] = e.celdas[grupo] or {}
    local clave = floor(x / E.CELDA) .. ":" .. floor(y / E.CELDA)
    local nueva = e.celdas[grupo][clave] == nil
    e.celdas[grupo][clave] = true
    if E.activo(grupo) ~= nil then return end
    if e.proximo[grupo] ~= nil and Mundo.horas() < e.proximo[grupo] then return end
    if not lejosDe(x, y, p) then return end
    local D = Narrador.Director
    if D ~= nil and D.tension ~= nil and D.tension() >= 75 then return end
    local chance = (nueva and E.CHANCE_NUEVA or E.CHANCE_VIEJA) * nivel
    if Mundo.azar(100) > chance then return end
    local tipo = E.elegirTipo(E.zonaDe(p, x, y), p, x, y)
    if tipo == nil then return end
    E.lanzar(p, tipo, dx, dy)
end

function E.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Mundo.hayALife() then return end
    for _, p in ipairs(Mundo.jugadores()) do pcall(E.revisarJugador, p) end
end

-- ---------------------------------------------------------------------------
-- Acciones que usan los encuentros
-- ---------------------------------------------------------------------------

-- La zona del encuentro va en un mapa de papel para los jugadores del grupo dueno (el mapa
-- del mundo del jugador queda limpio).
Motor.inmediatas.marcar_zona = function(inst, a)
    local l = inst.lugares[a.lugar]
    if l == nil then return true end
    local zona = Motor.zonaDe(l, tonumber(a.radio) or 30)
    local texto = Motor.texto(inst, a.texto or "Por aca")
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.vivo(p) and (inst.vars.dueno == nil or Mundo.grupoDe(p) == inst.vars.dueno) then
            local mapa = Mundo.crearMapaZona("Mapa: algo paso por aca", zona, texto)
            if mapa ~= nil then Mundo.darItem(p, mapa) end
        end
    end
    return true
end

-- La persona salvada queda como cliente del misionero mas cercano (puede volver a pedir).
E.REP_LLEVAR = 3

-- El campamento del misionero al que se manda a la persona salvada.
Motor.inmediatas.lugar_misionero = function(inst, a)
    local c = C.def(tostring(inst.vars.misionero_id))
    local e = c ~= nil and C.estado(c.id) or nil
    if e == nil or e.x == nil then return false, "sin misionero" end
    inst.lugares[a.id or "misionero"] = { x = e.x, y = e.y, z = e.z or 0, radio = 15, exacto = true,
        etiqueta = "el campamento de " .. c.nombre }
    return true
end
Motor.inmediatas.cliente_desde_encuentro = function(inst, a)
    local G = Narrador.Generador
    local cid = inst.vars.misionero_id
    if G == nil or cid == nil or inst.vars.tipo == "sous" then return true end
    local e = G.estado()
    e.clientes[cid] = e.clientes[cid] or {}
    local n = inst.vars.nombres and inst.vars.nombres.npc or nil
    if n ~= nil then
        table.insert(e.clientes[cid], { nombre = n[1], apellido = n[2], perfil = inst.vars.perfil, oficio = "camionero", veces = 1,
            sexo = "h" })
        while #e.clientes[cid] > 8 do table.remove(e.clientes[cid], 1) end
    end
    -- Llego al campamento: cuenta para su nivel (ver NarradorCampamentos).
    local K = Narrador.Campamentos
    if a.salvado and K ~= nil then pcall(K.sumarSalvado, cid) end
    -- Mandarle gente sin pedir nada a cambio sube la confianza con el misionero. Poco a
    -- proposito: salvando gente sola no alcanza para los niveles de confianza del campamento.
    local R = Narrador.Reputacion
    local c = C.def(cid)
    if R ~= nil and R.activa() and c ~= nil then
        local vistos = {}
        for _, p in ipairs(Mundo.jugadores()) do
            local g = Mundo.grupoDe(p)
            if inst.vars.dueno == nil or g == inst.vars.dueno then
                if not vistos[g] then
                    vistos[g] = true
                    R.sumar(g, cid, tonumber(a.rep) or E.REP_LLEVAR, "le lleve a " .. tostring(inst.vars.nombre or "alguien"))
                end
                Motor.enviar(p, "aviso", { texto = "+" .. tostring(tonumber(a.rep) or E.REP_LLEVAR) .. " de reputacion con " .. C.nombreCompleto(c) })
            end
        end
    end
    return true
end

-- Dias despues, la persona a la que le diste comida te deja un regalo.
Motor.inmediatas.eco_regalo = function(inst, a)
    Motor.diferir(inst, { "regalo_eco", lugar = "jugador", radio = 200, retraso = Motor.cantidad(a.horas, 72) })
    return true
end

Motor.diferidas.regalo_eco = function(inst, p, l)
    local items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Bandage" }, { "Base.Bullets9mm" } }
    for _, tipos in ipairs(items) do
        local item = Mundo.crearItem(tipos)
        if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
    end
    local nota = Mundo.crearNota("Nota para ti", "Te acuerdas de mi? Me diste de comer cuando no tenia nada. Esto es poco, pero es lo que pude juntar. -" .. tostring(inst.vars.nombre))
    if nota ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, nota) end
    Motor.enviar(nil, "aviso", { texto = "Alguien dejo un paquete cerca tuyo, con una nota." })
    return true
end

Motor.tickExtra.encuentros = E.tick

Motor.comandosAdmin.encuentroAhora = function(jugador, args)
    local tipo = args.tipo
    local x, y = Mundo.posicion(jugador)
    if tipo == nil then tipo = E.elegirTipo(E.zonaDe(jugador, x, y), jugador, x, y) or "techo" end
    local inst, razon = E.lanzar(jugador, tostring(tipo), 1, 0)
    return inst ~= nil and ("Encuentro: " .. inst.id) or ("No se pudo: " .. tostring(razon))
end

return E
