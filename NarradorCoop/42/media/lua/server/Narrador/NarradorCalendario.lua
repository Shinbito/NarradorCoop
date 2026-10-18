-- Narrador Co-op: calendario y clima.
-- Condiciones nuevas para las historias (estacion, fecha, nieve, lluvia, tormenta, niebla,
-- temperatura, luz y agua cortadas) y eventos de una vez por partida:
--   10-18 sep: la fonda de Sous (si son aliados).        31 oct: noche de brujas.
--   24 dic: el amigo secreto de Sous.                 31 dic: la ultima noche del 93.
--   El dia que se corta la luz.  Tormentas, niebla y olas de calor (cada cierto tiempo).
-- Sin tildes ni enies a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/Arcos/Calendario"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local floor = math.floor

local Cal = Narrador.Calendario or {}
Narrador.Calendario = Cal

Cal.SOUS = { "martin_a", "martin_z", "benjamin", "david", "bastian", "hanz", "cristian", "jorge", "cristobal" }
Cal.NOMBRES_SOUS = { martin_a = "Akagami", martin_z = "Zent", benjamin = "Matric", david = "Shinbo", bastian = "Tati",
    hanz = "Walita", cristian = "Cristonks", jorge = "Hasag", cristobal = "Wertres" }

Cal.DULCES = { { "Base.CandyPackage", "Base.Chocolate", "Base.Lollipop", "Base.MintCandy", "Base.TinnedBeans" },
    { "Base.Chocolate", "Base.CandyCaramel", "Base.Lollipop", "Base.Crisps" } }

Cal.BRUJAS = {
    muldraugh = "Noche de brujas. Le requise esto a unos ninos que ya no lo van a necesitar. Tome. Es una orden.",
    westpoint = "Ay, mijito, dulce o travesura? Toma, toma, que hoy se regalonea.",
    riverside = "Hijo, en mi tiempo uno se disfrazaba de muerto. Ahora ni hace falta. Toma un dulce.",
    rosewood = "Dulces de la bencinera, mijo. Vencidos, pero dulces igual.",
}
Cal.FIN_ANO = {
    muldraugh = "Fin del ano 93. Sin novedad. Bueno, con muchas novedades. Firme.",
    westpoint = "Feliz ano, mijito. Abrigate, que el 94 viene frio.",
    riverside = "Que el ano que viene sea mejor, hijo. No es dificil.",
    rosewood = "Un ano mas abierta. Ni el fin del mundo me cierra la bomba.",
}

function Cal.st()
    local st = Motor.estado()
    st.cal = st.cal or { hechos = {}, dulces = {} }
    st.cal.hechos = st.cal.hechos or {}
    st.cal.dulces = st.cal.dulces or {}
    return st.cal
end

function Cal.eventosActivos()
    return Mundo.sandbox("EventosEstacion", true) ~= false
end

-- ---------------------------------------------------------------------------
-- Condiciones
-- ---------------------------------------------------------------------------

local cond = Motor.condiciones
cond.estacion = function(inst, c)
    for i = 2, #c do if Mundo.estacion() == c[i] then return true end end
    return false
end
-- {"fecha", dia, mes}
cond.fecha = function(inst, c)
    local d, m = Mundo.fecha()
    return d == tonumber(c[2]) and m == tonumber(c[3])
end
cond.nieve = function() local cl = Mundo.clima(); return (cl.nieve or 0) > 0.1 or cl.nieveSuelo == true end
cond.lloviendo = function() return (Mundo.clima().lluvia or 0) > 0.1 end
cond.tormenta = function() return Mundo.clima().tormenta == true end
cond.niebla = function(inst, c) return (Mundo.clima().niebla or 0) >= (tonumber(c[2]) or 0.5) end
-- {"temperatura", ">", 30}
cond.temperatura = function(inst, c)
    local t = Mundo.clima().temperatura or 20
    if c[2] == "<" then return t < (tonumber(c[3]) or 0) end
    return t > (tonumber(c[3]) or 30)
end
cond.luz_cortada = function() return not Mundo.hayLuz() end
cond.agua_cortada = function() return not Mundo.hayAgua() end

-- ---------------------------------------------------------------------------
-- Acciones
-- ---------------------------------------------------------------------------

-- Busca un residente por rol y lo hace hablar.
function Cal.residente(rol)
    for _, r in pairs(Motor.estado().residentes or {}) do
        for uid, m in pairs(r.miembros or {}) do
            if not m.muerto and m.rol == rol then return uid, m end
        end
    end
    return nil
end

Motor.inmediatas.decir_residente = function(inst, a)
    local rol = Motor.valor(inst, a.rol)
    local uid, m = Cal.residente(tostring(rol))
    if uid ~= nil then Motor.decirUid(uid, m.nombre or rol, Motor.texto(inst, a.texto or "")) end
    return true
end

-- Sube el animo de los jugadores cerca del lugar.
Motor.inmediatas.animo = function(inst, a)
    local l = inst.lugares[a.lugar]
    for _, p in ipairs(Mundo.jugadores()) do
        local x, y = Mundo.posicion(p)
        if l == nil or (x ~= nil and math.sqrt((x - l.x) ^ 2 + (y - l.y) ^ 2) <= (tonumber(a.radio) or 50)) then
            Mundo.animo(p, 1)
        end
    end
    return true
end

-- Chance de un arma chetada en el suelo del lugar.
Motor.diferidas.chetada = function(inst, p, l)
    local L = Narrador.Legendario
    if L ~= nil and Mundo.azar(100) <= (tonumber(p.chance) or 0) then
        for _, item in ipairs(L.crear("arma", "chetada")) do Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        Motor.avisar(inst, "Entre los regalos viene algo especial: un arma en un estado increible.")
    end
    return true
end

-- ---------------------------------------------------------------------------
-- Eventos
-- ---------------------------------------------------------------------------

function Cal.sousAliados()
    local st = Motor.estado()
    return st.memoria.sous == "aliados" and st.residentes.sous ~= nil and type(st.memoria["lugar.base_sous"]) == "table"
end

function Cal.vivosSous()
    local lista = {}
    for _, rol in ipairs(Cal.SOUS) do if Cal.residente(rol) ~= nil then lista[#lista + 1] = rol end end
    return lista
end

function Cal.una(clave, f)
    local e = Cal.st()
    if e.hechos[clave] then return end
    local ok, hecho = pcall(f)
    if ok and hecho ~= false then e.hechos[clave] = true end
end

function Cal.fonda()
    if not Cal.sousAliados() then return false end
    return Motor.iniciar("cal_fonda") ~= nil
end

function Cal.amigoSecreto()
    if not Cal.sousAliados() then return false end
    local vivos = Cal.vivosSous()
    if #vivos < 2 then return false end
    local amigo = vivos[Mundo.azar(#vivos)]
    local regalador
    repeat regalador = vivos[Mundo.azar(#vivos)] until regalador ~= amigo
    local g = Narrador.GustosSous[amigo]
    local _, _, hora = Mundo.fecha()
    local vars = { amigo = amigo, amigo_nombre = Cal.NOMBRES_SOUS[amigo], gusto_nombre = g.nombre, gusto_tipos = g.tipos,
        gracias = g.gracias, regalador = regalador, horas_plazo = math.max(4, 24 - (hora or 8)) }
    return Motor.iniciar("cal_amigo_secreto", nil, { vars = vars }) ~= nil
end

function Cal.dulces()
    local e = Cal.st()
    for _, c in ipairs(C.LISTA) do
        if not e.dulces[c.id] then
            local x, y = C.posicion(c.id)
            local j = x ~= nil and Mundo.jugadorCerca(x, y, 8) or nil
            if j ~= nil then
                e.dulces[c.id] = true
                C.decir(c.id, Cal.BRUJAS[c.id])
                for _, tipos in ipairs(Cal.DULCES) do
                    local item = Mundo.crearItem(tipos)
                    if item ~= nil then Mundo.darItem(j, item) end
                end
            end
        end
    end
end

function Cal.brujasNoche()
    local hubo = false
    for _, p in ipairs(Mundo.jugadores()) do
        local x, y, z = Mundo.posicion(p)
        if x ~= nil and Mundo.vivo(p) then
            Mundo.oleada(x, y, z, 10 + Mundo.azar(8), 30, 50)
            Motor.enviar(p, "aviso", { texto = "Noche de brujas. Los muertos andan raros esta noche. Mas de los que deberia haber." })
            hubo = true
        end
    end
    return hubo
end

function Cal.ultimaNoche()
    for _, c in ipairs(C.LISTA) do
        if C.estado(c.id).uid ~= nil then C.decir(c.id, Cal.FIN_ANO[c.id]) end
    end
    if Cal.sousAliados() and Narrador.ConversasServer ~= nil then Narrador.ConversasServer.forzar("ultima_noche_sous") end
    local H = Narrador.Huellas
    for _, p in ipairs(Mundo.jugadores()) do
        local g = Mundo.grupoDe(p)
        local titulo = H ~= nil and H.titulo(g) or nil
        Motor.enviar(p, "aviso", { texto = "Se acaba 1993. Sigues vivo." .. (titulo ~= nil and (" En el condado te dicen " .. titulo .. ".") or "") })
    end
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = "Ultima noche del 93. Si alguien lee esto: llegue hasta aqui.", arco = "Calendario" }
    return true
end

function Cal.corteLuz()
    if Mundo.hayLuz() then return false end
    Motor.enviar(nil, "aviso", { texto = "Se corto la luz en todo el condado. Ya no va a volver." })
    if Cal.sousAliados() and Narrador.ConversasServer ~= nil then Narrador.ConversasServer.forzar("corte_luz") end
    local G = Narrador.Generador
    if G ~= nil then
        for _, c in ipairs(C.LISTA) do G.necesidades(c.id).energia = 100 end
    end
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = "Se corto la luz. Los misioneros van a pedir generadores y gasolina.", arco = "Calendario" }
    return true
end

local function noche()
    local _, _, h = Mundo.fecha()
    return h >= 20 or h < 5
end

function Cal.tormenta()
    local e = Cal.st()
    if not Mundo.clima().tormenta or not noche() then return end
    if e.ultTormenta ~= nil and Mundo.horas() - e.ultTormenta < 24 * 5 then return end
    if Mundo.azar(100) > 30 then return end
    e.ultTormenta = Mundo.horas()
    if C.estado("rosewood").uid ~= nil then C.decir("rosewood", "Me duelen las rodillas, mijo. Se viene agua y se viene feo.") end
    for _, p in ipairs(Mundo.jugadores()) do
        local r = Mundo.refugioDe(p)
        if r ~= nil and Mundo.cargado(r.x, r.y, r.z) ~= nil and Mundo.jugadorCerca(r.x, r.y, 80) ~= nil then
            Mundo.oleada(r.x, r.y, r.z, 15 + Mundo.azar(10), 35, 55)
            Motor.enviar(p, "aviso", { texto = "Con cada trueno se escuchan mas pasos afuera. La tormenta los esta empujando hacia tu refugio." })
        end
    end
end

function Cal.niebla()
    local e = Cal.st()
    if (Mundo.clima().niebla or 0) < 0.6 then return end
    if e.ultNiebla ~= nil and Mundo.horas() - e.ultNiebla < 24 * 3 then return end
    if Mundo.azar(100) > 25 then return end
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil and inst.vars.dueno ~= nil and inst.lugares.objetivo ~= nil then
            e.ultNiebla = Mundo.horas()
            Motor.diferir(inst, { "bandidos", id = "niebla", lugar = "objetivo", radio = 60, modo = "hunt", cantidad = { 2, 3 } })
            for _, p in ipairs(Mundo.jugadores()) do
                if Mundo.grupoDe(p) == inst.vars.dueno then
                    Motor.enviar(p, "aviso", { texto = "La niebla esta espesa. Alguien se mueve cerca de " .. tostring(inst.lugares.objetivo.etiqueta) .. ", y no son muertos." })
                end
            end
            return
        end
    end
end

function Cal.calor()
    local e = Cal.st()
    if Mundo.estacion() ~= "verano" or (Mundo.clima().temperatura or 20) <= 32 then return end
    if e.ultCalor ~= nil and Mundo.horas() - e.ultCalor < 24 * 5 then return end
    e.ultCalor = Mundo.horas()
    if C.estado("rosewood").uid ~= nil then C.decir("rosewood", "Con este calor el agua vale mas que la bencina, mijo. Y la bencina ya valia harto.") end
    local G = Narrador.Generador
    if G ~= nil then
        for _, c in ipairs(C.LISTA) do
            local n = G.necesidades(c.id)
            n.comida = math.min(100, n.comida + 20)
        end
    end
    Motor.enviar(nil, "aviso", { texto = "Ola de calor. Los misioneros van a pedir agua y comida." })
end

function Cal.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    if not Cal.eventosActivos() then return end
    local d, m, h = Mundo.fecha()
    -- La fonda se empieza a planear el 10 de septiembre (y se celebra el 18).
    if m == 9 and d >= 10 and d <= 18 and h >= 9 then Cal.una("fonda", Cal.fonda) end
    if d == 24 and m == 12 and h >= 8 then Cal.una("amigo_secreto", Cal.amigoSecreto) end
    if d == 31 and m == 10 and h >= 17 then pcall(Cal.dulces) end
    if d == 31 and m == 10 and h >= 22 then Cal.una("brujas_noche", Cal.brujasNoche) end
    if d == 31 and m == 12 and h >= 23 then Cal.una("ultima_noche", Cal.ultimaNoche) end
    Cal.una("corte_luz", Cal.corteLuz)
    pcall(Cal.tormenta)
    pcall(Cal.niebla)
    pcall(Cal.calor)
end

Motor.tickExtra.calendario = Cal.tick
Motor.comandosAdmin.fechaAhora = function(_, args)
    local f = ({ fonda = Cal.fonda, amigo = Cal.amigoSecreto, brujas = Cal.brujasNoche, fin = Cal.ultimaNoche, luz = Cal.corteLuz })[tostring(args.evento)]
    if f == nil then return "Evento desconocido." end
    local ok, r = pcall(f)
    return ok and (r == false and "No se cumplen las condiciones (Sous aliado? luz?)." or "Listo.") or ("Error: " .. tostring(r))
end

return Cal
