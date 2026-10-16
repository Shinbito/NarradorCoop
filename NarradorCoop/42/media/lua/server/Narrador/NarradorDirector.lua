-- Narrador Co-op: el director decide cuando arranca una historia nueva y cual.
-- Respeta las opciones de sandbox (dia de inicio, horas entre eventos, maximo simultaneo) y
-- ademas (0.8):
--   * Lleva una tension de 0 a 100 (sube con historias intensas, baja sola). Con tension alta
--     elige cosas tranquilas; con tension baja, accion. Estilo de narrador por sandbox:
--     Pausado, Equilibrado, Implacable o Volado (a veces ignora la tension).
--   * Pesos por estacion y por la fama de los jugadores (al samaritano le piden mas ayuda).
--   * Rumores: antes de lanzar una historia la siembra 24 a 48 horas como rumor que comentan
--     misioneros, vecinos y Sous. Si alguien va a mirar el lugar antes, la historia parte con
--     ventaja. Uno de cada cinco rumores es falso (pero en el lugar igual hay algo).

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorRumores"
require "Narrador/NarradorEtiquetas"

local Defs, Mundo, Motor, Rum = Narrador.Defs, Narrador.Mundo, Narrador.Motor, Narrador.Rumores
local floor = math.floor

local Director = Narrador.Director or {}
Narrador.Director = Director

-- Una vez cumplido el tiempo minimo, cada chequeo (cada 10 min de juego) tiene
-- 1 en CHANCE de lanzar algo: en promedio ~1 hora de juego de margen.
Director.CHANCE = 6
Director.RUMOR_HORAS = { 24, 48 }
Director.CHANCE_FALSO = 20

-- 1 Pausado, 2 Equilibrado, 3 Implacable, 4 Volado
Director.ESTILOS = {
    { id = "pausado", baja = 3, sube = 8, hueco = 1.3 },
    { id = "equilibrado", baja = 2, sube = 6, hueco = 1 },
    { id = "implacable", baja = 1.5, sube = 4, hueco = 0.7 },
    { id = "volado", baja = 2, sube = 6, hueco = 1, volado = true },
}

local SIN_INST = { vars = {}, lugares = {}, grupos = {}, relojes = {}, elecciones = {}, usadas = {} }

function Director.st()
    local st = Motor.estado()
    local d = st.director
    d.tension = d.tension or 20
    d.agenda = d.agenda or {}
    d.oidos = d.oidos or {}
    d.ultimaHoraTension = d.ultimaHoraTension or floor(Mundo.horas())
    return d
end

function Director.estilo()
    local i = tonumber(Mundo.sandbox("EstiloNarrador", 2)) or 2
    return Director.ESTILOS[i] or Director.ESTILOS[2]
end

function Director.tension()
    return Director.st().tension
end

function Director.subirTension(n)
    local d = Director.st()
    d.tension = math.max(0, math.min(100, d.tension + (tonumber(n) or 0)))
end

-- ---------------------------------------------------------------------------
-- Eleccion
-- ---------------------------------------------------------------------------

function Director.elegible(def, ahora)
    if def.automatico == false then return false end
    local st = Motor.estado()
    local dia = ahora / 24
    if def.dia_minimo ~= nil and dia < def.dia_minimo then return false end
    if def.requiere_alife and not Mundo.hayALife() then return false end
    if def.requiere_refugio and Mundo.jugadorConRefugio() == nil then return false end
    local veces = st.director.veces[def.id] or 0
    if def.max_veces ~= nil and veces >= def.max_veces then return false end
    local ultimo = st.director.ultimoPorDef[def.id]
    local enfriamiento = def.enfriamiento or (def.enfriamiento_dias ~= nil and def.enfriamiento_dias * 24 or nil)
    if enfriamiento ~= nil and ultimo ~= nil and ahora - ultimo < enfriamiento then return false end
    if Motor.activos(def.id) > 0 then return false end
    for _, otro in ipairs(def.excluye or {}) do
        if Motor.activos(otro) > 0 then return false end
    end
    for _, a in ipairs(Director.st().agenda) do
        if a.def == def.id then return false end
    end
    if def.si ~= nil and not Motor.cumple(SIN_INST, def.si) then return false end
    return true
end

-- Titulos de fama de los jugadores conectados (para pesar las historias).
local function famas()
    local H = Narrador.Huellas
    local r = {}
    if H == nil or H.titulo == nil then return r end
    for _, p in ipairs(Mundo.jugadores()) do
        local t = H.titulo(Mundo.grupoDe(p))
        if t ~= nil then r[t] = true end
    end
    return r
end

local function tiene(lista, x)
    for _, v in ipairs(lista or {}) do if v == x then return true end end
    return false
end

-- Peso final de una historia: base, estacion, tension y fama.
function Director.peso(def, tension, estilo, fama, ignorarTension)
    local peso = tonumber(def.peso) or 10
    local est = Mundo.estacion()
    if type(def.peso_estacion) == "table" and def.peso_estacion[est] ~= nil then
        peso = peso * (tonumber(def.peso_estacion[est]) or 1)
    end
    local intensidad = tonumber(def.intensidad) or 3
    if not ignorarTension then
        if tension >= 60 then
            if intensidad >= 4 then peso = peso * 0.2
            elseif intensidad <= 2 or def.tono == "humor" or def.tono == "vida" then peso = peso * 1.6 end
        elseif tension <= 25 then
            if intensidad >= 3 then peso = peso * 1.5 end
        end
    end
    if fama["El samaritano"] and (tiene(def.etiquetas, "ayuda") or tiene(def.etiquetas, "trampa")) then peso = peso * 1.5 end
    if fama["El temido"] and tiene(def.etiquetas, "bandidos") then peso = peso * 0.5 end
    if fama["El mercenario"] and tiene(def.etiquetas, "trabajo_sucio") then peso = peso * 2 end
    return peso
end

-- Elige una historia (sin lanzarla). forzado = true ignora tiempos.
function Director.candidatos(forzado)
    local ahora = Mundo.horas()
    local d = Director.st()
    local estilo = Director.estilo()
    local ignorar = estilo.volado and Mundo.azar(2) == 1
    local fama = famas()
    local candidatos, total = {}, 0
    for _, def in ipairs(Defs.todos()) do
        if Director.elegible(def, forzado and 1000000 or ahora) or (forzado and def.automatico ~= false
                and Motor.activos(def.id) == 0 and (not def.requiere_alife or Mundo.hayALife())
                and (not def.requiere_refugio or Mundo.jugadorConRefugio() ~= nil)) then
            local peso = Director.peso(def, d.tension, estilo, fama, ignorar)
            if peso > 0 then
                candidatos[#candidatos + 1] = { def = def, peso = peso }
                total = total + peso
            end
        end
    end
    return candidatos, total
end

local function sacar(candidatos, total)
    local tiro, acumulado, elegido = Mundo.azar(math.max(1, floor(total * 10))) / 10, 0, nil
    for i, c in ipairs(candidatos) do
        acumulado = acumulado + c.peso
        if tiro <= acumulado then elegido = i; break end
    end
    elegido = elegido or #candidatos
    local c = table.remove(candidatos, elegido)
    return c, total - c.peso
end

-- forzado = true ignora los tiempos (lo usa el boton de debug) y lanza sin rumor.
function Director.lanzar(forzado, conRumor)
    local candidatos, total = Director.candidatos(forzado)
    -- A veces, en vez de una historia, un rumor falso.
    if not forzado and Director.rumoresActivos() and Mundo.azar(100) <= Director.CHANCE_FALSO and Director.sembrarFalso() then
        Motor.estado().director.ultimoInicio = Mundo.horas()
        return nil, "rumor falso"
    end
    for _ = 1, 3 do
        if #candidatos == 0 then return nil end
        local c
        c, total = sacar(candidatos, total)
        if (conRumor or not forzado) and Director.rumoresActivos() and Rum.HISTORIAS[c.def.id] ~= nil then
            if Director.sembrar(c.def) then
                Motor.estado().director.ultimoInicio = Mundo.horas()
                return nil, "rumor de " .. c.def.id
            end
        end
        local inst, razon = Motor.iniciar(c.def.id)
        if inst ~= nil then return inst end
        Mundo.log("no se pudo iniciar " .. c.def.id .. ": " .. tostring(razon))
    end
    return nil
end

-- ---------------------------------------------------------------------------
-- Rumores
-- ---------------------------------------------------------------------------

function Director.rumoresActivos()
    return Mundo.sandbox("Rumores", true) ~= false
end

local function lugarRumor(spec)
    if spec == nil then return nil end
    local j = Mundo.jugadorAlAzar()
    if j == nil then return nil end
    local x, y = Mundo.posicion(j)
    local l = Mundo.buscarLugar(spec, x, y)
    if l == nil then return nil end
    l.prefijado = true
    return l, Mundo.nombreJugador(j)
end

function Director.sembrar(def)
    local r = Rum.HISTORIAS[def.id]
    local d = Director.st()
    local lugar, ref
    if r.lugar ~= nil then
        lugar, ref = lugarRumor(r.lugar)
        if lugar == nil then return false end
    else
        local j = Mundo.jugadorAlAzar()
        ref = j ~= nil and Mundo.nombreJugador(j) or nil
    end
    local h = Director.RUMOR_HORAS
    d.agenda[#d.agenda + 1] = { def = def.id, lanzar = Mundo.horas() + h[1] + Mundo.azar(h[2] - h[1]),
        lugar = lugar, lugarId = r.id, ref = ref, dichos = {}, oidos = {}, seguido = false, desde = Mundo.horas() }
    Mundo.log("rumor sembrado: " .. def.id)
    return true
end

function Director.sembrarFalso()
    local d = Director.st()
    for _, a in ipairs(d.agenda) do if a.falso then return false end end
    local i = Mundo.azar(#Rum.FALSOS)
    local lugar, ref = lugarRumor(Rum.FALSOS[i].lugar)
    if lugar == nil then return false end
    d.agenda[#d.agenda + 1] = { falso = i, lanzar = Mundo.horas() + 48 + Mundo.azar(24), lugar = lugar, ref = ref,
        dichos = {}, oidos = {}, seguido = false, desde = Mundo.horas() }
    Mundo.log("rumor falso sembrado")
    return true
end

function Director.lineasDe(a)
    if a.falso ~= nil then return Rum.FALSOS[a.falso].lineas end
    local r = Rum.HISTORIAS[a.def]
    return r ~= nil and r.lineas or {}
end

local ROLES_SOUS = { martin_a = true, martin_z = true, benjamin = true, david = true, bastian = true, hanz = true,
    cristian = true, jorge = true, cristobal = true }

-- Que diria este hablante del rumor (o nil).
function Director.lineaPara(a, h)
    local lineas = Director.lineasDe(a)
    local opciones = {}
    if h.tipo == "contacto" then
        opciones = lineas.misionero or {}
    elseif ROLES_SOUS[tostring(h.rol)] and Motor.estado().memoria.sous == "aliados" then
        for _, l in ipairs(lineas.sous or {}) do if l[1] == h.rol then opciones[#opciones + 1] = l[2] end end
    else
        opciones = lineas.vecino or {}
    end
    if #opciones == 0 then return nil end
    local t = opciones[Mundo.azar(#opciones)]
    local etiqueta = a.lugar ~= nil and tostring(a.lugar.etiqueta) or "por ahi"
    return (string.gsub(t, "{lugar}", etiqueta))
end

-- Residentes y misioneros que pueden contar rumores.
function Director.hablantes()
    local lista = {}
    local st = Motor.estado()
    for _, r in pairs(st.residentes or {}) do
        for uid, m in pairs(r.miembros or {}) do
            if not m.muerto then lista[#lista + 1] = { uid = uid, rol = m.rol, nombre = m.nombre or m.rol, tipo = "residente" } end
        end
    end
    local C = Narrador.Contactos
    for _, c in ipairs(C ~= nil and C.LISTA or {}) do
        local e = C.estado(c.id)
        if e.uid ~= nil then lista[#lista + 1] = { uid = e.uid, rol = c.id, nombre = c.nombre, tipo = "contacto" } end
    end
    return lista
end

function Director.oir(a, x, y, texto)
    local d = Director.st()
    local vistos = {}
    for _, p in ipairs(Mundo.jugadores()) do
        local px, py = Mundo.posicion(p)
        if px ~= nil and math.sqrt((px - x) ^ 2 + (py - y) ^ 2) <= 16 then
            local g = Mundo.grupoDe(p)
            if not vistos[g] then
                vistos[g] = true
                a.oidos[g] = true
                d.oidos[g] = d.oidos[g] or {}
                local lista = d.oidos[g]
                lista[#lista + 1] = { h = floor(Mundo.horas()), t = texto, def = a.def, falso = a.falso ~= nil,
                    clave = tostring(a.def or ("falso" .. tostring(a.falso))) .. ":" .. tostring(a.desde) }
                while #lista > 12 do table.remove(lista, 1) end
            end
        end
    end
end

-- Cada tanto, alguien cerca de un jugador comenta el rumor (una vez cada hablante).
function Director.contarRumores()
    local d = Director.st()
    if #d.agenda == 0 then return end
    local hablantes = Director.hablantes()
    for _, a in ipairs(d.agenda) do
        for _, h in ipairs(hablantes) do
            if not a.dichos[tostring(h.uid)] then
                local x, y = Mundo.posicionActor(h.uid)
                if x ~= nil and Mundo.jugadorCerca(x, y, 12) ~= nil and Mundo.azar(2) == 1 then
                    local CS = Narrador.ConversasServer
                    local ocupado = CS ~= nil and CS.ocupado ~= nil and CS.ocupado(h.uid)
                    local texto = not ocupado and Director.lineaPara(a, h) or nil
                    if texto ~= nil then
                        a.dichos[tostring(h.uid)] = true
                        Motor.decirUid(h.uid, h.nombre, texto)
                        Director.oir(a, x, y, texto)
                    end
                end
            end
        end
    end
end

-- Si alguien va a mirar el lugar antes de tiempo: el rumor queda "seguido".
function Director.revisarVisitas()
    local d = Director.st()
    for i = #d.agenda, 1, -1 do
        local a = d.agenda[i]
        if a.lugar ~= nil and not a.seguido then
            local j = Mundo.jugadorCerca(a.lugar.x, a.lugar.y, 40)
            if j ~= nil and Mundo.cargado(a.lugar.x, a.lugar.y, a.lugar.z) ~= nil then
                a.seguido = true
                local premio = a.falso ~= nil and Rum.FALSOS[a.falso].premio or (Rum.HISTORIAS[a.def] or {}).premio
                for _, tipos in ipairs(premio or {}) do
                    local item = Mundo.crearItem(tipos)
                    if item ~= nil then Mundo.dejarEnSuelo(a.lugar.x, a.lugar.y, a.lugar.z, item) end
                end
                if a.falso ~= nil then
                    local nota = Mundo.crearNota("Nota", Rum.FALSOS[a.falso].nota)
                    if nota ~= nil then Mundo.dejarEnSuelo(a.lugar.x, a.lugar.y, a.lugar.z, nota) end
                    Motor.enviar(j, "aviso", { texto = "El rumor era puro cuento. Pero alguien estuvo aqui antes y dejo algo." })
                    Director.anotar("Fui a ver un rumor a " .. tostring(a.lugar.etiqueta) .. ". Era cuento. Algo encontre igual.")
                    table.remove(d.agenda, i)
                else
                    Motor.enviar(j, "aviso", { texto = "Hay rastros recientes. El rumor era verdad: algo va a pasar aqui." })
                    Director.anotar("Fui a ver el rumor de " .. tostring(a.lugar.etiqueta) .. ". Era verdad. Ahora se algo que otros no saben.")
                end
            end
        end
    end
end

function Director.anotar(texto)
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = texto, arco = "Lo que se dice por ahi" }
    while #st.diario > Motor.MAX_DIARIO_GLOBAL do table.remove(st.diario, 1) end
    Motor.enviar(nil, "diario", { texto = texto, arco = "Lo que se dice por ahi" })
end

function Director.procesarAgenda()
    local d = Director.st()
    local ahora = Mundo.horas()
    for i = #d.agenda, 1, -1 do
        local a = d.agenda[i]
        if ahora >= a.lanzar then
            table.remove(d.agenda, i)
            if a.def ~= nil then
                local ref
                for _, p in ipairs(Mundo.jugadores()) do if Mundo.nombreJugador(p) == a.ref then ref = p end end
                local extra = { vars = { rumor = true, rumor_seguido = a.seguido == true }, lugares = {} }
                if a.lugar ~= nil and a.lugarId ~= nil then extra.lugares[a.lugarId] = a.lugar end
                local inst, razon = Motor.iniciar(a.def, ref, extra)
                if inst == nil then Mundo.log("el rumor de " .. a.def .. " no se pudo lanzar: " .. tostring(razon)) end
            end
        end
    end
end

-- ---------------------------------------------------------------------------
-- Capitulos pendientes y pulso
-- ---------------------------------------------------------------------------

-- Capitulos que dejo pendientes otra historia (por ejemplo, los Bell abren Sous).
function Director.abrirPendientes()
    local st = Motor.estado()
    local ahora = Mundo.horas()
    for i = #st.porAbrir, 1, -1 do
        local pendiente = st.porAbrir[i]
        if ahora >= (tonumber(pendiente.listo) or 0) then
            local inst, razon = Motor.iniciar(pendiente.def, nil, pendiente.extra)
            if inst ~= nil then
                table.remove(st.porAbrir, i)
            else
                pendiente.intentos = (pendiente.intentos or 0) + 1
                if pendiente.intentos >= 72 then
                    Mundo.log("no se pudo abrir " .. tostring(pendiente.def) .. ": " .. tostring(razon))
                    table.remove(st.porAbrir, i)
                end
            end
        end
    end
end

function Director.bajarTension()
    local d = Director.st()
    local h = floor(Mundo.horas())
    if h > d.ultimaHoraTension then
        local horas = h - d.ultimaHoraTension
        d.ultimaHoraTension = h
        d.tension = math.max(0, d.tension - Director.estilo().baja * horas)
    end
end

function Director.alIniciar(inst, def)
    if def.encargo_nivel ~= nil or def.encuentro ~= nil then
        Director.subirTension(def.encuentro ~= nil and 3 or 2)
        return
    end
    Director.subirTension((tonumber(def.intensidad) or 3) * Director.estilo().sube)
end

function Director.tick()
    if Mundo.sandbox("Activado", true) == false then return end
    Director.abrirPendientes()
    Director.bajarTension()
    pcall(Director.procesarAgenda)
    pcall(Director.revisarVisitas)
    pcall(Director.contarRumores)
    local st = Motor.estado()
    local d = Director.st()
    local ahora = Mundo.horas()
    if ahora / 24 < (tonumber(Mundo.sandbox("DiaInicio", 1)) or 1) then return end
    local enAgenda = 0
    for _, a in ipairs(d.agenda) do if a.def ~= nil then enAgenda = enAgenda + 1 end end
    if Motor.activos() + enAgenda >= (tonumber(Mundo.sandbox("MaxActivos", 2)) or 2) then return end
    local estilo = Director.estilo()
    local hueco = (tonumber(Mundo.sandbox("HorasEntreEventos", 20)) or 20) * estilo.hueco
    if estilo.volado then hueco = hueco * (0.4 + Mundo.azar(12) / 10) end
    -- Con tension muy alta (Pausado y Equilibrado) se espera un poco mas.
    if d.tension >= 80 and estilo.id ~= "implacable" then hueco = hueco * 1.5 end
    if ahora - st.director.ultimoInicio < hueco then return end
    if Mundo.jugadorAlAzar() == nil then return end
    if Mundo.azar(Director.CHANCE) ~= 1 then return end
    Director.lanzar(false)
end

-- ---------------------------------------------------------------------------
-- Vista y admin
-- ---------------------------------------------------------------------------

function Director.vista(v)
    local d = Director.st()
    v.tension = floor(d.tension)
    v.estilo = Director.estilo().id
    v.rumores = d.oidos
end

function Director.estadoTexto()
    local d = Director.st()
    local partes = { "Tension: " .. floor(d.tension) .. " | estilo: " .. Director.estilo().id .. " | estacion: " .. Mundo.estacion() }
    for _, a in ipairs(d.agenda) do
        partes[#partes + 1] = "Rumor " .. (a.falso and "falso" or tostring(a.def)) .. ": sale en " .. floor(a.lanzar - Mundo.horas())
            .. " h" .. (a.seguido and " (seguido)" or "") .. (a.lugar and (" en " .. tostring(a.lugar.etiqueta)) or "")
    end
    local st = Motor.estado()
    for _, p in ipairs(st.porAbrir) do partes[#partes + 1] = "Capitulo pendiente: " .. tostring(p.def) end
    local H = Narrador.Huellas
    if H ~= nil and H.estadoTexto ~= nil then partes[#partes + 1] = H.estadoTexto() end
    return table.concat(partes, "\n")
end

Motor.alIniciar[#Motor.alIniciar + 1] = Director.alIniciar
Motor.vistaExtra[#Motor.vistaExtra + 1] = Director.vista
Motor.comandosAdmin.estadoNarrador = function() return Director.estadoTexto() end
Motor.comandosAdmin.rumorAhora = function()
    local _, razon = Director.lanzar(true, true)
    return "Listo: " .. tostring(razon or "se lanzo directo (no tenia rumor)")
end
Motor.comandosAdmin.rumorFalso = function()
    return Director.sembrarFalso() and "Rumor falso sembrado." or "No se pudo (ya hay uno o no hay lugar)."
end
Motor.comandosAdmin.tension = function(_, args)
    Director.st().tension = math.max(0, math.min(100, tonumber(args.valor) or 50))
    return "Tension: " .. Director.st().tension
end

if Events ~= nil and not Director._enganchado then
    Director._enganchado = true
    Events.EveryTenMinutes.Add(Director.tick)
end

return Director
