-- Narrador Co-op: confianza de cada grupo de jugadores con cada misionero (0 a 100).
-- Sube cumpliendo encargos y no baja con el tiempo. Cambia como te tratan (rango y saludo),
-- el tamano de la zona del mapa, cuantas ofertas te muestran, la chance de arma chetada,
-- y a 90 abre un favor semanal. Se guarda por grupo (faccion del juego o jugador solo).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"

local Mundo, Motor, C = Narrador.Mundo, Narrador.Motor, Narrador.Contactos
local floor = math.floor

local R = Narrador.Reputacion or {}
Narrador.Reputacion = R

R.UMBRALES = { 0, 15, 40, 70, 90 }
R.GANANCIA = { facil = 3, medio = 6, dificil = 10, ultra = 15, cura = 20 }
R.PERDIDA = 5
R.FAVOR_CADA = 24 * 7

R.RANGOS = {
    muldraugh = { "Civil", "Recluta", "Soldado", "Sargento", "Mi General" },
    westpoint = { "Desconocido", "Mijito", "Regalon", "Sobrino", "Hijo de la casa" },
    riverside = { "Oveja perdida", "Feligres", "Monaguillo", "Diacono", "Santo varon" },
    rosewood = { "Afuerino", "Vecino", "Compadre", "Socio de la bomba", "Dueno de la bencinera" },
}

-- Lo que dice cada misionero al subir a cada rango (2..5).
R.ASCENSOS = {
    muldraugh = {
        [2] = "Recluta {nombre}. Suena bien. No se acostumbre, todavia no lo conozco.",
        [3] = "Soldado. Cumple, no pregunta, no se queja. Asi me gusta.",
        [4] = "Atencion. A contar de hoy, usted es Sargento. No me haga arrepentirme, soldado.",
        [5] = "Mi General. Si. Me cuesta decirlo. Pero la libreta no miente.",
    },
    westpoint = {
        [2] = "Ya, mijito, ya te reconozco. Pasa sin tocar.",
        [3] = "Mi regalon. No le digas a los otros, que se ponen celosos.",
        [4] = "Ay, mijito, ya eres como de la familia. Pasa, pasa, que hay sopa.",
        [5] = "Hijo de la casa. Si me pasa algo, la olla es tuya.",
    },
    riverside = {
        [2] = "Feligres. Todavia no rezas, pero vienes seguido. Algo es algo.",
        [3] = "Monaguillo, hijo. Ahora tienes que cargar las velas. Es broma. Mas o menos.",
        [4] = "Hijo, no se si eres un santo. Pero de los que vienen por aca, eres el que menos peca.",
        [5] = "Santo varon. Si hubiera canonizaciones, te propongo. No hay. Pero te propongo.",
    },
    rosewood = {
        [2] = "Ya no eres afuerino, mijo. Ahora eres vecino. Eso cuesta caro aca.",
        [3] = "Compadre. Desde hoy te saludo de beso. Bueno, de mano.",
        [4] = "Desde hoy cargas bencina gratis. Bueno, cuando haya. Pero la intencion es lo que cuenta.",
        [5] = "La bencinera es tuya tambien. Yo sigo mandando, eso si.",
    },
}

-- El favor de rango maximo de cada uno.
R.FAVORES = {
    muldraugh = { texto = "Por servicios prestados: una caja de municion y vendas. Firme.",
        items = { { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.ShotgunShells" }, { "Base.Bandage" }, { "Base.Bandage" } } },
    westpoint = { texto = "Toma, mijito. Comida casera. Bueno, casera de lata, pero hecha con carino.",
        items = { { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Bread", "Base.TinnedBeans" },
                  { "Base.WaterBottleFull", "Base.Water" } } },
    riverside = { texto = "Mis feligreses van a limpiar los alrededores de tu refugio. No preguntes como.", limpiar = true },
    rosewood = { texto = "Un bidon lleno, mijo. No me preguntes de donde lo saque.",
        items = { { "Base.PetrolCan", "Base.Gasoline", "Base.JerryCan" } } },
}

function R.activa()
    return Mundo.sandbox("Reputacion", true) ~= false
end

function R.tabla()
    local st = Motor.estado()
    st.reputacion = st.reputacion or {}
    return st.reputacion
end

function R.valor(grupo, contacto)
    if grupo == nil or contacto == nil then return 0 end
    local g = R.tabla()[tostring(grupo)]
    return g ~= nil and (tonumber(g[contacto]) or 0) or 0
end

-- Indice de rango (1..5) para un valor.
function R.nivel(valor)
    local n = 1
    for i, u in ipairs(R.UMBRALES) do if (valor or 0) >= u then n = i end end
    return n
end

function R.rango(contacto, valor)
    local lista = R.RANGOS[contacto]
    if lista == nil then return "" end
    return lista[R.nivel(valor)]
end

-- Cuanto falta para el siguiente rango (o nil si ya esta arriba).
function R.falta(valor)
    local n = R.nivel(valor)
    local sig = R.UMBRALES[n + 1]
    if sig == nil then return nil end
    return sig - valor
end

local function nombreGrupo(grupo)
    local n = string.match(tostring(grupo), "^%a+:(.+)$")
    return n or tostring(grupo)
end

-- Suma (o resta) confianza. Un cuarto de lo ganado "se corre la voz" a los otros misioneros.
function R.sumar(grupo, contacto, cantidad, motivo, sinEco)
    if not R.activa() or grupo == nil or contacto == nil or R.RANGOS[contacto] == nil then return end
    local t = R.tabla()
    t[tostring(grupo)] = t[tostring(grupo)] or {}
    local g = t[tostring(grupo)]
    local antes = tonumber(g[contacto]) or 0
    local despues = math.max(0, math.min(100, antes + (tonumber(cantidad) or 0)))
    g[contacto] = despues
    local nAntes, nDespues = R.nivel(antes), R.nivel(despues)
    if nDespues > nAntes then R.ascenso(grupo, contacto, nDespues) end
    if not sinEco and cantidad > 0 then
        local voz = floor(cantidad / 4)
        if voz < 1 and cantidad >= 3 then voz = 1 end
        if voz > 0 then
            for otro in pairs(R.RANGOS) do
                if otro ~= contacto then R.sumar(grupo, otro, voz, "voz", true) end
            end
        end
    end
    g.historial = g.historial or {}
    g.historial[#g.historial + 1] = { h = floor(Mundo.horas()), c = contacto, n = cantidad, m = motivo }
    while #g.historial > 20 do table.remove(g.historial, 1) end
end

-- Con muy mala fama en Knox (nivel -4 o peor) el misionero te desprecia, aunque su confianza
-- contigo sea alta: pesa mas lo que hiciste en Knox.
function R.despreciado(grupo)
    local KX = Narrador.Knox
    return KX ~= nil and KX.despreciado ~= nil and KX.despreciado(grupo)
end

function R.ascenso(grupo, contacto, nivel)
    local c = C.def(contacto)
    local lineas = R.ASCENSOS[contacto]
    local texto = lineas ~= nil and lineas[nivel] or nil
    if c == nil or texto == nil then return end
    if R.despreciado(grupo) then
        Motor.enviar(nil, "aviso", { texto = c.nombre .. " te tiene mas confianza, pero con tu fama en Knox no te lo va a decir." })
        return
    end
    texto = string.gsub(texto, "{nombre}", nombreGrupo(grupo))
    C.decir(contacto, texto)
    local rango = R.rango(contacto, R.UMBRALES[nivel])
    Motor.enviar(nil, "aviso", { texto = C.nombreCompleto(c) .. " ahora te trata de " .. rango .. "." })
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = C.nombreCompleto(c) .. " ahora me dice " .. rango .. ".",
        arco = "Libreta de contactos" }
    -- Si hay algo nuevo que contar de el, el diario avisa (ver Lore.PERFILES).
    local perfiles = Narrador.Lore ~= nil and Narrador.Lore.PERFILES or nil
    if perfiles ~= nil and perfiles[contacto] ~= nil and perfiles[contacto][nivel] ~= nil then
        Motor.enviar(nil, "aviso", { texto = "Anotaste algo nuevo sobre " .. c.nombre .. " en el diario (Notas)." })
    end
    while #st.diario > Motor.MAX_DIARIO_GLOBAL do table.remove(st.diario, 1) end
end

-- Efectos ---------------------------------------------------------------------

function R.radioMapa(grupo, contacto)
    if not R.activa() then return Motor.RADIO_ZONA end
    local n = R.nivel(R.valor(grupo, contacto))
    if n >= 4 then return 25 end
    if n >= 2 then return 45 end
    return Motor.RADIO_ZONA
end

function R.cantidadOfertas(grupo, contacto)
    if not R.activa() then return 1 end
    local n = R.nivel(R.valor(grupo, contacto))
    if n >= 4 then return 3 end
    if n >= 3 then return 2 end
    return 1
end

function R.bonusChetada(grupo, contacto)
    if not R.activa() then return 0 end
    return R.nivel(R.valor(grupo, contacto)) >= 3 and 2 or 0
end

function R.ultraAbierto(grupo, contacto)
    if not R.activa() or Mundo.sandbox("ReputacionBloqueaUltra", false) ~= true then return true end
    return R.valor(grupo, contacto) >= 70
end

-- Saludo con el nombre del grupo a partir del segundo rango.
function R.saludo(grupo, contacto, texto)
    if not R.activa() or R.nivel(R.valor(grupo, contacto)) < 2 or R.despreciado(grupo) then return texto end
    return nombreGrupo(grupo) .. ", " .. string.lower(string.sub(texto, 1, 1)) .. string.sub(texto, 2)
end

-- Favor semanal (rango maximo).
function R.pedirFavor(jugador, args)
    local contacto = tostring(args.contacto)
    local c = C.def(contacto)
    if c == nil then return end
    if R.despreciado(Mundo.grupoDe(jugador)) then
        local G = Narrador.Generador
        C.decir(contacto, G ~= nil and G.RECHAZO ~= nil and G.RECHAZO[contacto] or "Aca ya no eres bienvenido.")
        return
    end
    local x, y = C.posicion(contacto)
    local px, py = Mundo.posicion(jugador)
    if x == nil or px == nil or math.sqrt((x - px) ^ 2 + (y - py) ^ 2) > 10 then
        Motor.responder(jugador, "Estas muy lejos.")
        return
    end
    local grupo = Mundo.grupoDe(jugador)
    if R.valor(grupo, contacto) < 90 then
        C.decir(contacto, "Favores? Primero hay que ganarselos.")
        return
    end
    local t = R.tabla()[tostring(grupo)]
    t.favores = t.favores or {}
    local ultimo = t.favores[contacto]
    if ultimo ~= nil and Mundo.horas() - ultimo < R.FAVOR_CADA then
        local dias = math.ceil((R.FAVOR_CADA - (Mundo.horas() - ultimo)) / 24)
        C.decir(contacto, "Ya te hice un favor esta semana. Vuelve en " .. dias .. " dias.")
        return
    end
    t.favores[contacto] = Mundo.horas()
    local f = R.FAVORES[contacto]
    C.decir(contacto, f.texto)
    for _, tipos in ipairs(f.items or {}) do
        local item = Mundo.crearItem(tipos)
        if item ~= nil then Mundo.darItem(jugador, item) end
    end
    if f.limpiar then
        local refugio = Mundo.refugioDe(jugador)
        if refugio ~= nil then Mundo.limpiarZona(refugio.x, refugio.y, 70, 0, 25) end
    end
    Motor.publicar()
end

-- Abandonar el encargo propio: baja la confianza.
function R.abandonar(jugador, args)
    local grupo = Mundo.grupoDe(jugador)
    local inst = C.encargoDelGrupo(grupo)
    if inst == nil then
        Motor.responder(jugador, "No tienes ningun encargo.")
        return
    end
    local contacto = inst.vars.contacto
    inst.vars.abandonado = true
    local def = Narrador.Defs.get(inst.def)
    if def ~= nil and def.etapas.final_abandonado ~= nil then
        Motor.entrar(inst, "final_abandonado", 0)
    else
        Motor.cancelar(inst.id)
        R.sumar(grupo, contacto, -R.PERDIDA, "abandono")
    end
    if contacto ~= nil then C.decir(contacto, "Ya. Lo dejo anotado. No es la primera vez que alguien se arrepiente.") end
    Motor.publicar()
end

-- Ganchos ---------------------------------------------------------------------

R.EXITOS = { final_cumplido = true, final_alijo = true, final_arma = true, final_traje = true, final_auto = true,
    final_cumplido_extra = true, final_rescatado = true, final_verdad = true, final_mentira_piadosa = true }
R.FRACASOS = { final_vencido = true, final_fallido = true, final_abandonado = true, final_muerto = true }

function R.alTerminar(inst, def, final)
    local grupo, contacto = inst.vars.dueno, inst.vars.contacto
    if grupo == nil or contacto == nil or inst.vars.rep_hecha then return end
    inst.vars.rep_hecha = true
    local nivel = tostring(inst.vars.nivel or "facil")
    if R.EXITOS[final] or string.sub(tostring(final), 1, 14) == "final_cumplido" then
        local n = R.GANANCIA[nivel] or 3
        n = n + (tonumber(inst.vars.rep_extra) or 0)
        R.sumar(grupo, contacto, n, "encargo " .. nivel)
        -- Postas: tambien suben los otros misioneros de la cadena.
        for _, otro in ipairs(type(inst.vars.posta) == "table" and inst.vars.posta or {}) do
            if otro ~= contacto then R.sumar(grupo, otro, 4, "posta", true) end
        end
    elseif R.FRACASOS[final] then
        local n = R.PERDIDA
        if final == "final_muerto" then n = 10 end
        R.sumar(grupo, contacto, -n, "fallo")
    end
end

-- {"reputacion", cantidad = n, contacto = "id" (o el del encargo), motivo}
Motor.inmediatas.reputacion = function(inst, a)
    local grupo = a.grupo or inst.vars.dueno
    local contacto = a.contacto or inst.vars.contacto
    if grupo == nil then
        -- Historia sin dueno: a todos los grupos conectados.
        local vistos = {}
        for _, p in ipairs(Mundo.jugadores()) do
            local g = Mundo.grupoDe(p)
            if not vistos[g] then vistos[g] = true; R.sumar(g, contacto, tonumber(a.cantidad) or 0, a.motivo) end
        end
        return true
    end
    R.sumar(grupo, contacto, tonumber(a.cantidad) or 0, a.motivo)
    return true
end

-- {"rep_minima", contacto, n}: el grupo del encargo (o cualquier grupo conectado) tiene esa confianza.
Motor.condiciones.rep_minima = function(inst, c)
    local contacto, n = c[2], tonumber(c[3]) or 0
    if inst.vars ~= nil and inst.vars.dueno ~= nil then return R.valor(inst.vars.dueno, contacto) >= n end
    for _, p in ipairs(Mundo.jugadores()) do
        if R.valor(Mundo.grupoDe(p), contacto) >= n then return true end
    end
    return false
end

-- {rango:westpoint} -> el rango del grupo del encargo con ese misionero.
Motor.plantillas.rango = function(inst, contacto)
    local grupo = inst.vars ~= nil and inst.vars.dueno or nil
    if grupo == nil then
        local j = Mundo.jugadorAlAzar()
        grupo = j ~= nil and Mundo.grupoDe(j) or nil
    end
    return R.rango(contacto, R.valor(grupo, contacto))
end

function R.vista(v)
    local lista = {}
    for grupo, g in pairs(R.tabla()) do
        local fila = {}
        for contacto in pairs(R.RANGOS) do
            local valor = tonumber(g[contacto]) or 0
            local favor = g.favores ~= nil and g.favores[contacto] or nil
            fila[contacto] = { valor = valor, rango = R.rango(contacto, valor), falta = R.falta(valor),
                nivel = R.nivel(valor),
                favor = valor >= 90 and (favor == nil or Mundo.horas() - favor >= R.FAVOR_CADA) or false }
        end
        lista[grupo] = fila
    end
    v.reputacion = lista
    v.reputacion_activa = R.activa()
    v.rangos = R.RANGOS
end

Motor.alTerminar[#Motor.alTerminar + 1] = R.alTerminar
Motor.vistaExtra[#Motor.vistaExtra + 1] = R.vista
Motor.comandosPublicos.favorMisionero = R.pedirFavor
Motor.comandosPublicos.abandonarEncargo = R.abandonar
Motor.comandosAdmin.repSumar = function(jugador, args)
    local grupo = Mundo.grupoDe(jugador)
    R.sumar(grupo, tostring(args.contacto), tonumber(args.cantidad) or 10, "admin")
    Motor.publicar()
    return "Confianza con " .. tostring(args.contacto) .. ": " .. R.valor(grupo, tostring(args.contacto))
end

return R
