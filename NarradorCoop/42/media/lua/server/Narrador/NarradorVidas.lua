-- Narrador Co-op: vidas de los vecinos de los encargos.
-- Dos fuentes: los 100 secundarios hechos a mano (cada uno con sus textos) y el generador, que
-- arma una vida nueva eligiendo una pieza por etapa (origen, infancia, juventud, adultez, vejez,
-- oficio, primera noche, despues, secreto, deseo, voz). Cada pieza da, pide, prohibe o quita
-- etiquetas, asi la vida no se contradice (una infancia enfermiza no deja pasar a "campeon de
-- lucha" salvo que una pieza cuente como lo supero). Los datos estan en
-- shared/Narrador/NarradorVidasDatos.lua (generado por herramientas/vidas.py).
-- Una vida generada se guarda como la lista de piezas elegidas (poco espacio en la partida) y
-- sus textos se vuelven a armar cuando hacen falta. Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorMundo"
require "Narrador/NarradorVidasDatos"

local Mundo = Narrador.Mundo
local D = Narrador.VidasDatos

local V = Narrador.Vidas or {}
Narrador.Vidas = V

V.ETAPAS = { "origen", "infancia", "juventud", "adultez", "vejez", "oficio", "primera_noche", "despues",
    "secreto", "deseo", "voz" }
-- Etapas que solo cuentan desde cierta edad (en julio de 1993).
V.DESDE = { adultez = 25, vejez = 60 }
V.PUEBLOS = { "Muldraugh", "West Point", "Riverside", "Rosewood" }
V.OFICIOS = { "mecanico", "enfermera", "granjero", "policia", "carpintero", "costurera", "cocinera", "camionero",
    "profesora", "cazador", "electricista", "pastora" }
-- Tope de piezas probadas por intento al armar una vida, y cuantos intentos.
V.MAX_PASOS = 150
V.INTENTOS = 8

-- Lo que el jugador anota al conocer a un vecino generado. {nombre}, {oficio}, {pueblo}.
V.DIARIO_CONOCER = {
    "Conoci a {nombre}, {oficio} de {pueblo}. Me miro un rato largo antes de darme la mano.",
    "{nombre}, {oficio} de {pueblo}. Habla bajito, como si alguien pudiera estar escuchando.",
    "Anoto el nombre para no olvidarlo: {nombre}, {oficio}, de {pueblo}. Otro que sigue en pie.",
    "{nombre} es {oficio} en {pueblo}. Tiene las manos de alguien que trabajo toda la vida.",
    "Hoy conoci a {nombre}. {oficio} de {pueblo}, dice, aunque ya nadie le paga por eso.",
    "{nombre}, de {pueblo}. {oficio}. Me pregunto si tenia noticias de alguien. No tenia.",
}

-- ---------------------------------------------------------------------------
-- Indices
-- ---------------------------------------------------------------------------

local porEtapa, porId, secPorId, secPorPueblo

local function indexar()
    if porId ~= nil then return end
    porEtapa, porId, secPorId, secPorPueblo = {}, {}, {}, {}
    for _, e in ipairs(V.ETAPAS) do porEtapa[e] = {} end
    for _, p in ipairs(D.PIEZAS or {}) do
        porId[p.id] = p
        if porEtapa[p.etapa] ~= nil then table.insert(porEtapa[p.etapa], p) end
    end
    for _, s in ipairs(D.SECUNDARIOS or {}) do
        secPorId[s.id] = s
        secPorPueblo[s.pueblo] = secPorPueblo[s.pueblo] or {}
        table.insert(secPorPueblo[s.pueblo], s)
    end
end

-- Para las pruebas: vuelve a leer los datos.
function V.reindexar() porId = nil; indexar() end

function V.hayPiezas() indexar(); return #(porEtapa.voz or {}) > 0 end
function V.pieza(id) indexar(); return porId[id] end
function V.secundario(id) indexar(); return secPorId[id] end
function V.secundariosDe(pueblo) indexar(); return secPorPueblo[pueblo] or {} end

-- ---------------------------------------------------------------------------
-- Armar una vida
-- ---------------------------------------------------------------------------

local function contiene(lista, x)
    if lista == nil then return true end
    for _, y in ipairs(lista) do if y == x then return true end end
    return false
end

-- Lo que prohibe una pieza vale tambien para las que vienen despues: una infancia con asma
-- (da enfermizo_nino, prohibe atleta) no deja que la juventud de "atleta", salvo que esa misma
-- pieza u otra anterior quite enfermizo_nino (la que cuenta como lo supero). Cada bloqueo dura
-- mientras siga alguna etiqueta de las que dio la pieza que lo puso.
local function bloqueada(t, bl, et)
    for _, b in ipairs(bl) do
        if b.tag == t then
            if #b.por == 0 then return true end
            for _, x in ipairs(b.por) do if et[x] then return true end end
        end
    end
    return false
end

-- La pieza calza con la vida, las etiquetas que lleva y los bloqueos de las piezas anteriores.
function V.calza(p, vida, et, bl)
    if vida.edad < (p.edad_min or 18) or vida.edad > (p.edad_max or 99) then return false end
    if p.sexo ~= nil and p.sexo ~= vida.sexo then return false end
    if not contiene(p.oficios, vida.oficio) then return false end
    if not contiene(p.pueblos, vida.pueblo) then return false end
    for _, t in ipairs(p.pide or {}) do if not et[t] then return false end end
    for _, t in ipairs(p.prohibe or {}) do if et[t] then return false end end
    if p.pide_alguno ~= nil and #p.pide_alguno > 0 then
        local alguno = false
        for _, t in ipairs(p.pide_alguno) do if et[t] then alguno = true end end
        if not alguno then return false end
    end
    if bl ~= nil and p.da ~= nil and #p.da > 0 then
        local despues = et
        if p.quita ~= nil and #p.quita > 0 then
            despues = {}
            for k, v in pairs(et) do despues[k] = v end
            for _, t in ipairs(p.quita) do despues[t] = nil end
        end
        for _, t in ipairs(p.da) do if bloqueada(t, bl, despues) then return false end end
    end
    return true
end

local function aplicar(p, et, bl)
    local nuevo = {}
    for k, v in pairs(et) do nuevo[k] = v end
    for _, t in ipairs(p.quita or {}) do nuevo[t] = nil end
    for _, t in ipairs(p.da or {}) do nuevo[t] = true end
    local nbl = bl
    if p.prohibe ~= nil and #p.prohibe > 0 then
        nbl = {}
        for i, b in ipairs(bl) do nbl[i] = b end
        for _, t in ipairs(p.prohibe) do nbl[#nbl + 1] = { tag = t, por = p.da or {} } end
    end
    return nuevo, nbl
end

local function etapasDe(edad)
    local r = {}
    for _, e in ipairs(V.ETAPAS) do
        if V.DESDE[e] == nil or edad >= V.DESDE[e] then r[#r + 1] = e end
    end
    return r
end

-- Saca una al azar segun el peso (y la quita de la lista).
local function sacar(resto)
    local total = 0
    for _, p in ipairs(resto) do total = total + (p.peso or 10) end
    local tiro = Mundo.azar(math.max(1, math.floor(total)))
    local acum = 0
    for i, p in ipairs(resto) do
        acum = acum + (p.peso or 10)
        if tiro <= acum then return table.remove(resto, i) end
    end
    return table.remove(resto)
end

-- vida = { sexo, edad, pueblo, oficio }. Devuelve { etapa = idPieza }, las etiquetas finales y
-- las piezas probadas, o nil si no hay camino (el que llama sortea otra edad). Busca hacia atras
-- desde la etapa que se trabo, pero con un tope corto por intento: si una rama mala se come el
-- tope, conviene mas empezar de nuevo con otro sorteo que seguir escarbando.
function V.recorrer(vida)
    indexar()
    local etapas = etapasDe(vida.edad)
    local total = 0
    for _ = 1, V.INTENTOS do
        local elegidas, pasos = {}, 0
        local function paso(i, et, bl)
            if i > #etapas then return et end
            local e = etapas[i]
            local resto = {}
            for _, p in ipairs(porEtapa[e]) do if V.calza(p, vida, et, bl) then resto[#resto + 1] = p end end
            while #resto > 0 do
                pasos = pasos + 1
                if pasos > V.MAX_PASOS then return nil end
                local p = sacar(resto)
                elegidas[e] = p.id
                local et2, bl2 = aplicar(p, et, bl)
                local fin = paso(i + 1, et2, bl2)
                if fin ~= nil then return fin end
            end
            elegidas[e] = nil
            return nil
        end
        local fin = paso(1, {}, {})
        total = total + pasos
        if fin ~= nil then return elegidas, fin, total end
    end
    return nil, nil, total
end

-- Arma una vida para un vecino. op = { sexo, edad, pueblo, oficio } (lo que falte se sortea).
-- Devuelve lo que se guarda en la partida: { sexo, edad, pueblo, oficio, piezas, r2, dc } o nil.
function V.armar(op)
    if not V.hayPiezas() then return nil end
    op = op or {}
    for _ = 1, 6 do
        local oficio = op.oficio or V.OFICIOS[Mundo.azar(#V.OFICIOS)]
        local desde = (D.EDAD_MIN_OFICIO or {})[oficio] or 18
        local vida = { sexo = op.sexo or (Mundo.azar(2) == 1 and "h" or "m"),
            edad = op.edad or (desde - 1 + Mundo.azar(86 - desde)), pueblo = op.pueblo or V.PUEBLOS[Mundo.azar(#V.PUEBLOS)],
            oficio = oficio }
        local elegidas = V.recorrer(vida)
        if elegidas ~= nil then
            local previas = {}
            for _, e in ipairs({ "infancia", "juventud", "adultez", "vejez" }) do
                if elegidas[e] ~= nil then previas[#previas + 1] = e end
            end
            vida.piezas = elegidas
            vida.r2 = previas[Mundo.azar(#previas)]
            vida.dc = Mundo.azar(#V.DIARIO_CONOCER)
            return vida
        end
        op = { sexo = op.sexo, pueblo = op.pueblo, oficio = op.oficio }   -- otra edad
    end
    return nil
end

-- ---------------------------------------------------------------------------
-- Textos
-- ---------------------------------------------------------------------------

-- Reemplaza los marcadores de una pieza. ctx = { sexo, edad, pueblo, oficioTxt }.
function V.rellenar(s, ctx)
    if s == nil then return nil end
    local h = ctx.sexo == "h"
    local nac = 1993 - (ctx.edad or 40)
    local fijos = { o = h and "o" or "a", nino = h and "nino" or "nina", hijo = h and "hijo" or "hija",
        el = h and "el" or "ella", pueblo = ctx.pueblo or "Knox", oficio = ctx.oficioTxt or "vecino",
        ano_nac = tostring(nac), nombre = ctx.nombre or "" }
    return (string.gsub(s, "{([%w_+]+)}", function(k)
        if fijos[k] ~= nil then return fijos[k] end
        local n = string.match(k, "^ano%+(%d+)$")
        if n ~= nil then return tostring(nac + tonumber(n)) end
        return "{" .. k .. "}"
    end))
end

local function mayus(s)
    return (string.gsub(s, "^%l", string.upper))
end

-- Los diez textos de una vida generada (mismas claves que los secundarios).
function V.textosDeVida(vida, ctx)
    indexar()
    local P = function(e) return vida.piezas ~= nil and porId[vida.piezas[e] or ""] or nil end
    local function t(e, campo)
        local p = P(e)
        return p ~= nil and V.rellenar(p[campo or "texto"], ctx) or nil
    end
    local voz = P("voz") or {}
    local partes = {}
    for _, e in ipairs({ "origen", "adultez", "primera_noche", "despues", "deseo" }) do
        local s = t(e)
        if s == nil and e == "adultez" then s = t("juventud") end
        if s ~= nil then partes[#partes + 1] = s end
    end
    local dc = V.DIARIO_CONOCER[vida.dc or 1] or V.DIARIO_CONOCER[1]
    dc = string.gsub(dc, "{oficio}", ctx.oficioSolo or "vecino")
    return {
        llegada = V.rellenar(voz.llegada, ctx), rescate = V.rellenar(voz.rescate, ctx),
        gracias = V.rellenar(voz.gracias, ctx), muerte = V.rellenar(voz.muerte, ctx),
        revelacion1 = t("oficio"), revelacion2 = t(vida.r2 or "juventud"), revelacion3 = t("secreto"),
        diario_conocer = mayus(V.rellenar(dc, ctx)), diario_final = t("secreto", "diario"),
        mudanza = table.concat(partes, " "),
    }
end

-- Textos de un cliente guardado: secundario hecho a mano (cl.sec) o vida generada (cl.vida).
-- oficioTxt = "la enfermera" (para las piezas); oficioSolo = "enfermera" (para el diario).
function V.textosDe(cl, oficioTxt, pueblo)
    if cl == nil then return nil end
    if cl.sec ~= nil then
        local s = V.secundario(cl.sec)
        return s ~= nil and s.textos or nil
    end
    if cl.vida ~= nil then
        local oficioSolo = oficioTxt ~= nil and (string.gsub(oficioTxt, "^%a+ ", "")) or nil
        return V.textosDeVida(cl.vida, { sexo = cl.sexo, edad = cl.vida.edad, pueblo = pueblo or cl.vida.pueblo,
            oficioTxt = oficioTxt, oficioSolo = oficioSolo, nombre = cl.nombre })
    end
    return nil
end

-- Lo que se revela en el encargo numero n (1, 2 o 3) con ese cliente.
function V.revelacion(textos, n)
    if textos == nil then return nil end
    return textos["revelacion" .. tostring(math.max(1, math.min(3, n or 1)))]
end
