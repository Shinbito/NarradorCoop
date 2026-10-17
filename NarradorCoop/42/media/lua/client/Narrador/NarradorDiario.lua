-- Narrador Co-op: el diario de vida del jugador.
-- Un icono de libro en pantalla (se puede arrastrar) abre un cuaderno de dos paginas con
-- tres cintas: Historia (principal), Secundarias (historias cortas y encargos) y Notas
-- (misioneros y registro). Lo que se escribe viene del servidor ya resuelto (ver
-- shared/Narrador/NarradorLore.lua y Motor.vista).
-- Textos sin tildes ni enies a proposito.

require "ISUI/ISPanel"
require "Narrador/NarradorDefs"
require "Narrador/NarradorLore"
require "Narrador/NarradorDominiosDefs"
require "Narrador/NarradorCliente"
require "Narrador/NarradorKnoxDefs"

Narrador = Narrador or {}
local Diario = Narrador.Diario or {}
Narrador.Diario = Diario

local Lore = Narrador.Lore
local floor = math.floor

Diario.TEX_LIBRO = "media/textures/NarradorDiario_Libro.png"
Diario.TEX_ICONO = "media/textures/NarradorDiario_Icono.png"
Diario.ARCHIVO_POS = "NarradorDiario_pos.txt"

-- Medidas del libro en la textura original (1024 x 640).
Diario.BASE_W, Diario.BASE_H = 1024, 640
Diario.CINTA_H = 30
Diario.PAGINAS = {
    { x0 = 82, x1 = 482, y0 = 64, y1 = 566 },  -- izquierda
    { x0 = 545, x1 = 945, y0 = 64, y1 = 566 }, -- derecha
}

Diario.PESTANAS = {
    { id = "historia", texto = "Historia", color = { r = 0.55, g = 0.12, b = 0.10 } },
    { id = "secundarias", texto = "Secundarias", color = { r = 0.16, g = 0.30, b = 0.18 } },
    { id = "notas", texto = "Notas", color = { r = 0.18, g = 0.24, b = 0.42 } },
}

-- Tintas: todo escrito con un lapiz pasta azul (mas cargado en los titulos, gastado en las
-- fechas y notas al margen). El rojo queda solo para lo urgente.
local TINTA = { r = 0.10, g = 0.17, b = 0.47 }
local TINTA_TITULO = { r = 0.05, g = 0.10, b = 0.38 }
local TINTA_AZUL = { r = 0.16, g = 0.26, b = 0.56 }
local LAPIZ = { r = 0.33, g = 0.40, b = 0.60 }
local SEPIA = { r = 0.20, g = 0.28, b = 0.55 }
local ROJO = { r = 0.62, g = 0.10, b = 0.08 }

-- Fuentes: todo a mano con la letra manuscrita del juego (la de las notas del mapa), del
-- mismo tamano; los titulos se distinguen por la tinta y el subrayado, no por ser enormes.
-- Las fechas y notas al margen van en letra chica.
function Diario.fuentes()
    local mano = UIFont.Handwritten or UIFont.Small
    return {
        titulo = mano,
        sub = mano,
        mano = mano,
        chico = UIFont.Small,
        fecha = UIFont.Small,
    }
end

-- Interlineado extra: deja aire entre renglones para que no sea un bloque de texto.
Diario.INTERLINEA = 3

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

function Diario.fecha(h)
    h = tonumber(h)
    if h == nil then return "" end
    return "Dia " .. tostring(floor(h / 24) + 1) .. " - " .. string.format("%02d", floor(h % 24)) .. ":00"
end

function Diario.ancho(fuente, texto)
    local tm = getTextManager()
    return tm:MeasureStringX(fuente, texto)
end

function Diario.alto(fuente)
    return getTextManager():getFontHeight(fuente)
end

-- Corta un texto en lineas que caben en "ancho".
function Diario.envolver(texto, ancho, fuente)
    local lineas = {}
    for parrafo in string.gmatch(tostring(texto) .. "\n", "(.-)\n") do
        local linea = ""
        for palabra in string.gmatch(parrafo, "%S+") do
            local prueba = linea == "" and palabra or (linea .. " " .. palabra)
            if Diario.ancho(fuente, prueba) > ancho and linea ~= "" then
                lineas[#lineas + 1] = linea
                linea = palabra
            else
                linea = prueba
            end
        end
        lineas[#lineas + 1] = linea
    end
    return lineas
end

-- ---------------------------------------------------------------------------
-- Contenido: cada pestana es una lista de bloques
--   { t = texto, f = "titulo|sub|mano|chico|fecha", c = color, sangria = px, antes = px,
--     tachado = bool, centrado = bool, adorno = bool, junto = bool (no separar del siguiente),
--     pagina_nueva = bool }
-- ---------------------------------------------------------------------------

local function agregar(b, bloque) b[#b + 1] = bloque end

local function visible(arco)
    return not arco.terminado and (arco.lore ~= nil or arco.pista ~= nil)
end

local function ultimaHora(arco)
    local d = arco.diario or {}
    if #d > 0 then return d[#d].h end
    return arco.inicio
end

-- Entrada de una historia en curso: titulo, fecha, lo que escribio el personaje,
-- lo pendiente y las ultimas anotaciones.
function Diario.entrada(b, arco, titulo)
    agregar(b, { t = titulo, f = "sub", c = TINTA_TITULO, antes = 10, junto = true })
    local h = ultimaHora(arco)
    if h ~= nil then agregar(b, { t = Diario.fecha(h), f = "fecha", c = LAPIZ, junto = true }) end
    -- La introduccion solo al empezar el capitulo; despues ya se sabe y es texto de mas.
    if arco.intro ~= nil and arco.mostrarIntro and #(arco.diario or {}) <= 1 then
        agregar(b, { t = arco.intro, f = "mano", c = SEPIA, antes = 4 })
    end
    agregar(b, { t = arco.lore or arco.pista or "", f = "mano", c = TINTA, antes = 4 })
    if arco.pista ~= nil then
        agregar(b, { t = "> " .. arco.pista, f = "chico", c = TINTA_AZUL, antes = 6, sangria = 8 })
    end
    local d = arco.diario or {}
    if #d > 1 then
        agregar(b, { t = "Anotado antes:", f = "fecha", c = LAPIZ, antes = 8, junto = true })
        local hasta = math.max(1, #d - 2)
        for i = #d - 1, hasta, -1 do
            local e = d[i]
            agregar(b, { t = Diario.fecha(e.h) .. "  " .. tostring(e.t), f = "fecha", c = LAPIZ, sangria = 8, antes = 2 })
        end
    end
    agregar(b, { adorno = true, antes = 8 })
end

local function cerrada(b, h)
    agregar(b, { t = tostring(h.titulo), f = "sub", c = LAPIZ, tachado = true, antes = 8, junto = true })
    if h.fin ~= nil then agregar(b, { t = Diario.fecha(h.fin), f = "fecha", c = LAPIZ, junto = true }) end
    agregar(b, { t = h.epilogo or "Esta historia termino.", f = "mano", c = SEPIA, antes = 2 })
end

-- Historias cerradas, sin repetir (se queda la ultima de cada una).
local function cerradas(estado, filtro)
    local vistas, lista = {}, {}
    local hist = estado.historial or {}
    for i = #hist, 1, -1 do
        local h = hist[i]
        local clave = tostring(h.def) .. ":" .. tostring(h.inicio)
        if not vistas[clave] and filtro(h) then
            vistas[clave] = true
            lista[#lista + 1] = h
        end
    end
    return lista
end

function Diario.paginaHistoria(estado)
    local b = {}
    agregar(b, { t = "Historia", f = "titulo", c = TINTA_TITULO, centrado = true, subrayado = true })
    agregar(b, { adorno = true, antes = 6 })
    local activos = {}
    for _, a in ipairs(estado.arcos or {}) do
        if a.tipo == "principal" and visible(a) then activos[#activos + 1] = a end
    end
    table.sort(activos, function(x, y) return (x.capitulo or 0) < (y.capitulo or 0) end)
    for _, a in ipairs(activos) do
        a.mostrarIntro = true
        Diario.entrada(b, a, "Capitulo " .. tostring(a.capitulo or "?") .. ": " .. tostring(a.titulo))
    end
    local cer = cerradas(estado, function(h) return h.tipo == "principal" end)
    table.sort(cer, function(x, y) return (x.capitulo or 0) < (y.capitulo or 0) end)
    if #activos == 0 then
        local fin = false
        for _, h in ipairs(cer) do if h.def == "sous_arsenal" then fin = true end end
        agregar(b, { t = fin and Lore.VACIO.principal_cerrada or Lore.VACIO.principal, f = "mano", c = SEPIA, antes = 8 })
        agregar(b, { adorno = true, antes = 8 })
    end
    if #cer > 0 then
        agregar(b, { t = "Capitulos cerrados", f = "sub", c = LAPIZ, antes = 12, junto = true })
        for _, h in ipairs(cer) do
            cerrada(b, { titulo = "Capitulo " .. tostring(h.capitulo or "?") .. ": " .. tostring(h.titulo),
                fin = h.fin, epilogo = h.epilogo })
        end
    end
    return b
end

function Diario.paginaSecundarias(estado)
    local b = {}
    local miGrupo = Narrador.Cliente ~= nil and Narrador.Cliente.miGrupo() or nil
    agregar(b, { t = "Asuntos pendientes", f = "titulo", c = TINTA_TITULO, centrado = true, subrayado = true })
    agregar(b, { adorno = true, antes = 6 })
    local hay = false
    for _, a in ipairs(estado.arcos or {}) do
        if a.tipo == "secundaria" and visible(a) then
            hay = true
            Diario.entrada(b, a, tostring(a.titulo))
        end
    end
    if not hay then agregar(b, { t = Lore.VACIO.secundaria, f = "mano", c = SEPIA, antes = 6 }) end

    agregar(b, { t = "Encargos", f = "titulo", c = TINTA_TITULO, centrado = true, subrayado = true, antes = 16, junto = true })
    local mio, otros = nil, 0
    for _, a in ipairs(estado.arcos or {}) do
        if a.tipo == "encargo" and not a.terminado then
            if a.dueno ~= nil and a.dueno == miGrupo then mio = a else otros = otros + 1 end
        end
    end
    if mio ~= nil and visible(mio) then
        local titulo = tostring(mio.titulo)
        if mio.contacto_nombre ~= nil then titulo = titulo .. " - " .. tostring(mio.contacto_nombre) end
        agregar(b, { t = titulo, f = "sub", c = TINTA_TITULO, antes = 8, junto = true })
        local h = ultimaHora(mio)
        local linea = (mio.ciudad ~= nil and (tostring(mio.ciudad) .. ". ") or "") .. tostring(Lore.NIVELES[tostring(mio.nivel)] or "")
        agregar(b, { t = (h ~= nil and (Diario.fecha(h) .. "  ") or "") .. linea, f = "fecha", c = LAPIZ, junto = true })
        agregar(b, { t = mio.lore or mio.pista or "", f = "mano", c = TINTA, antes = 4 })
        if mio.pista ~= nil then
            agregar(b, { t = "> " .. mio.pista, f = "chico", c = TINTA_AZUL, antes = 6, sangria = 8 })
        end
    else
        agregar(b, { t = Lore.VACIO.encargo, f = "mano", c = SEPIA, antes = 6 })
    end
    if otros > 0 then
        agregar(b, { t = (otros == 1 and "Otro grupo tiene un encargo en curso." or ("Otros grupos tienen " .. otros .. " encargos en curso.")),
            f = "fecha", c = LAPIZ, antes = 6 })
    end

    local cer = cerradas(estado, function(h)
        return h.tipo == "secundaria" or (h.tipo == "encargo" and (h.dueno == nil or h.dueno == miGrupo))
    end)
    if #cer > 0 then
        agregar(b, { adorno = true, antes = 10 })
        agregar(b, { t = "Ya pasaron", f = "sub", c = LAPIZ, antes = 8, junto = true })
        for i = 1, math.min(3, #cer) do cerrada(b, cer[i]) end
    end
    return b
end

function Diario.paginaNotas(estado)
    local b = {}
    agregar(b, { t = "Notas", f = "titulo", c = TINTA_TITULO, centrado = true, subrayado = true })
    agregar(b, { adorno = true, antes = 6 })
    local contactos = estado.contactos or {}
    agregar(b, { t = "Los misioneros", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    if #contactos == 0 then
        agregar(b, { t = "Escuche que en algunos pueblos hay gente que reparte trabajo a cambio de comida. Todavia no los encuentro.",
            f = "mano", c = SEPIA, antes = 4 })
    else
        local mio = Narrador.Cliente ~= nil and Narrador.Cliente.miEncargo() or nil
        for _, c in ipairs(contactos) do
            local suyo = mio ~= nil and mio.contacto == c.id
            agregar(b, { t = tostring(c.nombre) .. " (" .. tostring(c.ciudad) .. ")", f = "chico",
                c = suyo and ROJO or TINTA, antes = 6, junto = true })
            -- Lo que se de el: mas cuanto mas confianza me tiene.
            local capas = Diario.loQueSe(estado, c.id)
            for i, texto in ipairs(capas) do
                local ultima = i == #capas
                agregar(b, { t = texto .. ((ultima and suyo) and " Tengo un encargo suyo pendiente." or ""),
                    f = "mano", c = SEPIA, sangria = 8, antes = i > 1 and 3 or 0 })
            end
            -- Su campamento: nivel, gente salvada y lo que falta para el siguiente.
            local k = estado.campamentos ~= nil and estado.campamentos[c.id] or nil
            if k ~= nil then
                local linea = "Campamento nivel " .. tostring(k.nivel or 0) .. ". Salve y traje a " .. tostring(k.salvados or 0)
                    .. ". Guardias: " .. tostring(k.guardias or 0) .. " de " .. tostring(k.max_guardias or 15) .. "."
                if k.ataque then linea = linea .. " LO ESTA ATACANDO UNA HORDA." end
                if k.siguiente ~= nil and type(k.falta) == "table" and #k.falta > 0 then
                    linea = linea .. " Para que llegue el " .. tostring(k.siguiente) .. ": " .. table.concat(k.falta, ", ") .. "."
                end
                agregar(b, { t = linea, f = "chico", c = TINTA_AZUL, sangria = 8, antes = 3 })
            end
        end
        agregar(b, { t = "> Para pedir trabajo hay que acercarse y hablarles (clic derecho). Un encargo a la vez por grupo.",
            f = "chico", c = TINTA_AZUL, antes = 8 })
        Diario.libreta(b, estado, contactos)
    end
    Diario.rumores(b, estado)
    Diario.loQueHice(b, estado)
    agregar(b, { adorno = true, antes = 10 })
    agregar(b, { t = "Registro", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    local diario = estado.diario or {}
    if #diario == 0 then
        agregar(b, { t = "Nada anotado todavia.", f = "mano", c = SEPIA, antes = 4 })
    end
    for i = #diario, math.max(1, #diario - 7), -1 do
        local e = diario[i]
        agregar(b, { t = Diario.fecha(e.h) .. "  -  " .. tostring(e.arco), f = "fecha", c = LAPIZ, antes = 6, junto = true })
        agregar(b, { t = tostring(e.t), f = "chico", c = TINTA, sangria = 8 })
    end
    if estado.alife == false then
        agregar(b, { t = "Project A-Life no esta activo: las historias con personas no van a aparecer.", f = "chico", c = ROJO, antes = 12 })
    end
    return b
end

-- Entradas del perfil de un misionero hasta mi nivel de confianza con el.
function Diario.loQueSe(estado, id)
    local lista = Lore.PERFILES ~= nil and Lore.PERFILES[id] or nil
    -- Si en esa ciudad manda otro (un capitan de los bandidos o un misionero nuevo), su perfil.
    local DD = Narrador.DominiosDefs
    for _, c in ipairs(estado.contactos or {}) do
        if c.id == id and c.dominio ~= nil and c.dominio ~= "mision" and DD ~= nil then
            lista = DD.perfilLore(c.dominio, id, c.reemplazo) or lista
        end
    end
    if lista == nil then return { tostring(Lore.CONTACTOS[id] or "") } end
    local grupo = Narrador.Cliente ~= nil and Narrador.Cliente.miGrupo() or nil
    local fila = estado.reputacion ~= nil and grupo ~= nil and estado.reputacion[grupo] or nil
    local r = fila ~= nil and fila[id] or nil
    local nivel = math.max(1, math.min(#lista, tonumber(r ~= nil and r.nivel or 1) or 1))
    if estado.reputacion_activa == false then nivel = 1 end
    local r2 = {}
    for i = 1, nivel do r2[#r2 + 1] = lista[i] end
    return r2
end

-- Libreta de contactos: como me trata cada misionero y cuanto falta para que me tenga mas confianza.
function Diario.libreta(b, estado, contactos)
    if estado.reputacion_activa == false then return end
    local grupo = Narrador.Cliente ~= nil and Narrador.Cliente.miGrupo() or nil
    local fila = estado.reputacion ~= nil and grupo ~= nil and estado.reputacion[grupo] or nil
    agregar(b, { adorno = true, antes = 10 })
    agregar(b, { t = "Libreta de contactos", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    for _, c in ipairs(contactos) do
        local r = fila ~= nil and fila[c.id] or nil
        local valor = r ~= nil and r.valor or 0
        local rangos = estado.rangos ~= nil and estado.rangos[c.id] or nil
        local rango = r ~= nil and r.rango or (rangos ~= nil and rangos[1] or "")
        local linea = tostring(c.nombre) .. ": me dice " .. tostring(rango) .. " (" .. tostring(valor) .. ")"
        if r ~= nil and r.falta ~= nil and rangos ~= nil and rangos[(r.nivel or 1) + 1] ~= nil then
            linea = linea .. ". Faltan " .. tostring(r.falta) .. " para " .. tostring(rangos[(r.nivel or 1) + 1]) .. "."
        elseif r ~= nil and r.falta == nil then
            linea = linea .. ". Mas no se puede."
        end
        if r ~= nil and r.favor then linea = linea .. " Me debe un favor." end
        -- Con muy mala fama en Knox pesa mas lo que hice que su confianza.
        local kx = estado.knox ~= nil and grupo ~= nil and estado.knox[grupo] or nil
        local KD = Narrador.KnoxDefs
        if kx ~= nil and KD ~= nil and (tonumber(kx.nivel) or 1) <= KD.DESPRECIO then
            linea = linea .. " Pero con lo que he hecho en Knox, ya no me quiere ver."
        end
        agregar(b, { t = linea, f = "chico", c = TINTA, sangria = 8, antes = 3 })
    end
    agregar(b, { t = "> La confianza sube cumpliendo encargos y se corre la voz entre ellos. Abre mas ofertas, mapas mas exactos y favores.",
        f = "chico", c = TINTA_AZUL, antes = 6 })
end

-- Lo que se dice por ahi: rumores que escuche en persona.
function Diario.rumores(b, estado)
    local grupo = Narrador.Cliente ~= nil and Narrador.Cliente.miGrupo() or nil
    local lista = estado.rumores ~= nil and grupo ~= nil and estado.rumores[grupo] or nil
    agregar(b, { adorno = true, antes = 10 })
    agregar(b, { t = "Lo que se dice por ahi", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    if lista == nil or #lista == 0 then
        agregar(b, { t = "No he escuchado nada raro. Habria que conversar mas con la gente.", f = "mano", c = SEPIA, antes = 4 })
        return
    end
    for i = #lista, math.max(1, #lista - 2), -1 do
        local r = lista[i]
        agregar(b, { t = Diario.fecha(r.h), f = "fecha", c = LAPIZ, antes = 4, junto = true })
        agregar(b, { t = '"' .. tostring(r.t) .. '"', f = "mano", c = TINTA, sangria = 8 })
    end
end

-- Lo que hice: mi fama y las decisiones que me marcaron (con lo que paso despues).
function Diario.loQueHice(b, estado)
    local grupo = Narrador.Cliente ~= nil and Narrador.Cliente.miGrupo() or nil
    local mio = estado.huellas ~= nil and grupo ~= nil and estado.huellas[grupo] or nil
    agregar(b, { adorno = true, antes = 10 })
    agregar(b, { t = "Lo que hice", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    -- Como me conocen en Knox (reputacion global).
    local kx = estado.knox ~= nil and grupo ~= nil and estado.knox[grupo] or nil
    if kx ~= nil then
        local malo = (tonumber(kx.nivel) or 1) < 0
        agregar(b, { t = "En Knox me conocen como: " .. tostring(kx.titulo) .. ".", f = "mano", c = malo and ROJO or TINTA_TITULO, antes = 4 })
    end
    if mio == nil or #(mio.huellas or {}) == 0 then
        agregar(b, { t = "Todavia nada que me pese. O que me enorgullezca.", f = "mano", c = SEPIA, antes = 4 })
        return
    end
    if mio.titulo ~= nil then
        agregar(b, { t = "En el condado me dicen " .. tostring(mio.titulo) .. ".", f = "mano", c = TINTA_TITULO, antes = 4 })
    end
    for _, h in ipairs(mio.huellas) do
        agregar(b, { t = Diario.fecha(h.h) .. "  " .. tostring(h.t), f = "chico", c = TINTA, sangria = 8, antes = 3 })
        if h.eco ~= nil then
            agregar(b, { t = "> Despues: " .. tostring(h.eco), f = "chico", c = TINTA_AZUL, sangria = 18 })
        end
    end
end

function Diario.contenido(tab, estado)
    if estado == nil then
        return { { t = "Las hojas estan pegadas por la humedad. Espera un momento...", f = "mano", c = SEPIA } }
    end
    if tab == "secundarias" then return Diario.paginaSecundarias(estado) end
    if tab == "notas" then return Diario.paginaNotas(estado) end
    return Diario.paginaHistoria(estado)
end

-- ---------------------------------------------------------------------------
-- Paginado: reparte los bloques en paginas del tamano dado.
-- Devuelve { pagina = { { t, x, y, fuente, c, tachado, centrado, adorno, ancho }, ... }, ... }
-- ---------------------------------------------------------------------------

function Diario.paginar(bloques, ancho, alto)
    local F = Diario.fuentes()
    local paginas = { {} }
    local y = 0
    -- Primero se cortan todos los bloques en lineas, para saber cuanto mide el siguiente.
    local cortados = {}
    for i, bl in ipairs(bloques) do
        local c = { bl = bl, lineas = {}, alto = 0 }
        if bl.adorno then
            c.alto = 10
        else
            local fuente = F[bl.f or "mano"] or F.mano
            c.fuente = fuente
            c.hl = Diario.alto(fuente) + Diario.INTERLINEA
            c.lineas = Diario.envolver(bl.t or "", ancho - (bl.sangria or 0), fuente)
            c.alto = #c.lineas * c.hl
        end
        cortados[i] = c
    end
    local function nuevaPagina()
        paginas[#paginas + 1] = {}
        y = 0
    end
    for i, c in ipairs(cortados) do
        local bl = c.bl
        if bl.pagina_nueva and y > 0 then nuevaPagina() end
        local antes = y > 0 and (bl.antes or 0) or 0
        -- Lo que no puede quedar solo al pie de la pagina (titulos): pide espacio para
        -- si mismo y un par de lineas del siguiente bloque.
        local necesita = c.alto
        local j = i
        while cortados[j].bl.junto and cortados[j + 1] ~= nil do
            local sig = cortados[j + 1]
            if sig.bl.junto then
                necesita = necesita + sig.alto + (sig.bl.antes or 0)
            else
                necesita = necesita + math.min(sig.alto, 2 * (sig.hl or 10)) + (sig.bl.antes or 0)
            end
            j = j + 1
        end
        if bl.adorno then
            if y + antes + c.alto <= alto and y > 0 then
                y = y + antes
                table.insert(paginas[#paginas], { adorno = true, y = y, ancho = ancho })
                y = y + c.alto
            end
        else
            if y > 0 and y + antes + math.min(necesita, alto) > alto then
                nuevaPagina()
                antes = 0
            end
            y = y + antes
            for _, linea in ipairs(c.lineas) do
                if y + c.hl > alto then nuevaPagina() end
                local x = bl.sangria or 0
                if bl.centrado then x = floor((ancho - Diario.ancho(c.fuente, linea)) / 2) end
                table.insert(paginas[#paginas], { t = linea, x = x, y = y, fuente = c.fuente, c = bl.c or TINTA,
                    tachado = bl.tachado, subrayado = bl.subrayado, ancho = Diario.ancho(c.fuente, linea), hl = c.hl })
                y = y + c.hl
            end
        end
    end
    if #paginas > 1 and #paginas[#paginas] == 0 then table.remove(paginas) end
    return paginas
end

-- ---------------------------------------------------------------------------
-- Ventana del diario
-- ---------------------------------------------------------------------------

NarradorDiarioLibro = ISPanel:derive("NarradorDiarioLibro")

function NarradorDiarioLibro:new(escala)
    local w = floor(Diario.BASE_W * escala)
    local h = floor(Diario.BASE_H * escala) + Diario.CINTA_H
    local x = floor((getCore():getScreenWidth() - w) / 2)
    local y = floor((getCore():getScreenHeight() - h) / 2)
    local o = ISPanel.new(self, x, y, w, h)
    o.background = false
    o.moveWithMouse = true
    o.escala = escala
    o.tab = Diario.tabActual or "historia"
    o.hoja = {}
    o.paginas = { {} }
    o.texLibro = getTexture(Diario.TEX_LIBRO)
    return o
end

function NarradorDiarioLibro:rectPagina(i)
    local p, s = Diario.PAGINAS[i], self.escala
    return floor(p.x0 * s), Diario.CINTA_H + floor(p.y0 * s), floor((p.x1 - p.x0) * s), floor((p.y1 - p.y0) * s)
end

function NarradorDiarioLibro:refrescar()
    local _, _, ancho, alto = self:rectPagina(1)
    local ok, bloques = pcall(Diario.contenido, self.tab, Narrador.Cliente ~= nil and Narrador.Cliente.estado or nil)
    if not ok then
        print("[Narrador] error armando el diario: " .. tostring(bloques))
        bloques = { { t = "Una mancha de tinta tapa esta pagina.", f = "mano" } }
    end
    self.paginas = Diario.paginar(bloques, ancho, alto)
    local hoja = self.hoja[self.tab] or 1
    self.hoja[self.tab] = math.max(1, math.min(hoja, self:totalHojas()))
end

-- Una "hoja" son dos paginas (izquierda y derecha).
function NarradorDiarioLibro:totalHojas()
    return math.max(1, math.ceil(#self.paginas / 2))
end

function NarradorDiarioLibro:pasar(delta)
    local hoja = (self.hoja[self.tab] or 1) + delta
    hoja = math.max(1, math.min(hoja, self:totalHojas()))
    if hoja ~= self.hoja[self.tab] then
        self.hoja[self.tab] = hoja
        pcall(function() getSoundManager():playUISound("UISelectListItem") end)
    end
end

function NarradorDiarioLibro:cambiarTab(id)
    if self.tab == id then return end
    self.tab = id
    Diario.tabActual = id
    self:refrescar()
    pcall(function() getSoundManager():playUISound("UISelectListItem") end)
end

-- Zonas clicables: cintas, cerrar, flechas.
function NarradorDiarioLibro:zonaCinta(i)
    local s = self.escala
    local x = floor((560 + (i - 1) * 132) * s)
    return x, 0, floor(124 * s), Diario.CINTA_H + floor(14 * s)
end

function NarradorDiarioLibro:zonaCerrar()
    local s = self.escala
    return self.width - floor(38 * s), Diario.CINTA_H + floor(2 * s), floor(28 * s), floor(26 * s)
end

function NarradorDiarioLibro:zonaFlecha(lado)
    local s = self.escala
    local y = Diario.CINTA_H + floor(574 * s)
    if lado < 0 then return floor(60 * s), y, floor(64 * s), floor(28 * s) end
    return floor(900 * s), y, floor(64 * s), floor(28 * s)
end

local function dentro(px, py, x, y, w, h)
    return px >= x and px <= x + w and py >= y and py <= y + h
end

function NarradorDiarioLibro:onMouseDown(x, y)
    for i, p in ipairs(Diario.PESTANAS) do
        if dentro(x, y, self:zonaCinta(i)) then self:cambiarTab(p.id); return true end
    end
    if dentro(x, y, self:zonaCerrar()) then self:cerrar(); return true end
    if dentro(x, y, self:zonaFlecha(-1)) then self:pasar(-1); return true end
    if dentro(x, y, self:zonaFlecha(1)) then self:pasar(1); return true end
    return ISPanel.onMouseDown(self, x, y)
end

function NarradorDiarioLibro:onRightMouseDown()
    return true
end

function NarradorDiarioLibro:onMouseWheel(delta)
    self:pasar(delta > 0 and 1 or -1)
    return true
end

function NarradorDiarioLibro:dibujarPagina(i, pagina)
    local px, py = self:rectPagina(i)
    for _, l in ipairs(pagina or {}) do
        if l.adorno then
            local _, _, ancho = self:rectPagina(i)
            local cx = px + floor(ancho / 2)
            self:drawRect(cx - 40, py + l.y + 4, 80, 1, 0.4, LAPIZ.r, LAPIZ.g, LAPIZ.b)
        else
            self:drawText(l.t, px + l.x, py + l.y, l.c.r, l.c.g, l.c.b, 1, l.fuente)
            if l.tachado then
                self:drawRect(px + l.x - 2, py + l.y + floor(l.hl / 2), l.ancho + 4, 1, 0.8, l.c.r, l.c.g, l.c.b)
            end
            if l.subrayado then
                -- Doble raya a mano, la de abajo un poco mas corta.
                local yl = py + l.y + l.hl - 2
                self:drawRect(px + l.x - 4, yl, l.ancho + 8, 1, 0.75, l.c.r, l.c.g, l.c.b)
                self:drawRect(px + l.x + 2, yl + 2, l.ancho - 6, 1, 0.5, l.c.r, l.c.g, l.c.b)
            end
        end
    end
end

function NarradorDiarioLibro:render()
    local s = self.escala
    local mx, my = self:getMouseX(), self:getMouseY()
    -- Cintas (detras del libro: solo asoman por arriba).
    for i, p in ipairs(Diario.PESTANAS) do
        local x, y, w, h = self:zonaCinta(i)
        local activa = self.tab == p.id
        local baja = activa and 0 or 6
        local k = activa and 1 or 0.7
        self:drawRect(x, y + baja, w, h + 20 - baja, 1, p.color.r * k, p.color.g * k, p.color.b * k)
        self:drawRect(x + 3, y + baja + 3, w - 6, 1, 0.35, 1, 1, 1)
        local tc = activa and 1 or 0.8
        self:drawTextCentre(p.texto, x + floor(w / 2), y + baja + 6, tc, tc * 0.95, tc * 0.85, 1, UIFont.Small)
    end
    -- Libro.
    if self.texLibro ~= nil then
        self:drawTextureScaled(self.texLibro, 0, Diario.CINTA_H, self.width, self.height - Diario.CINTA_H, 1, 1, 1, 1)
    else
        self:drawRect(0, Diario.CINTA_H, self.width, self.height - Diario.CINTA_H, 1, 0.29, 0.17, 0.11)
        for i = 1, 2 do
            local x, y, w, h = self:rectPagina(i)
            self:drawRect(x - 20, y - 20, w + 40, h + 50, 1, 0.92, 0.88, 0.77)
        end
    end
    -- Las dos paginas de la hoja actual.
    local hoja = self.hoja[self.tab] or 1
    local izq = (hoja - 1) * 2 + 1
    self:dibujarPagina(1, self.paginas[izq])
    self:dibujarPagina(2, self.paginas[izq + 1])
    -- Pie: numero de pagina y flechas.
    local yPie = Diario.CINTA_H + floor(578 * s)
    local total = #self.paginas
    if self.paginas[izq] ~= nil then
        self:drawTextCentre("- " .. izq .. " -", floor(281 * s), yPie, LAPIZ.r, LAPIZ.g, LAPIZ.b, 1, UIFont.Small)
    end
    if self.paginas[izq + 1] ~= nil then
        self:drawTextCentre("- " .. (izq + 1) .. " -", floor(745 * s), yPie, LAPIZ.r, LAPIZ.g, LAPIZ.b, 1, UIFont.Small)
    end
    if hoja > 1 then
        local x, y, w = self:zonaFlecha(-1)
        local sobre = dentro(mx, my, self:zonaFlecha(-1))
        self:drawText("< volver", x, y + 4, TINTA.r, TINTA.g, TINTA.b, sobre and 1 or 0.7, UIFont.Small)
    end
    if izq + 1 < total then
        local x, y, w = self:zonaFlecha(1)
        local sobre = dentro(mx, my, self:zonaFlecha(1))
        self:drawText("seguir >", x, y + 4, TINTA.r, TINTA.g, TINTA.b, sobre and 1 or 0.7, UIFont.Small)
    end
    -- Cerrar.
    local cx, cy, cw, ch = self:zonaCerrar()
    local sobre = dentro(mx, my, cx, cy, cw, ch)
    self:drawTextCentre("X", cx + floor(cw / 2), cy + 2, 0.95, sobre and 0.6 or 0.85, sobre and 0.5 or 0.7, 1, UIFont.Medium)
end

function NarradorDiarioLibro:cerrar()
    self:setVisible(false)
    self:removeFromUIManager()
    if Diario.ventana == self then Diario.ventana = nil end
    pcall(function() getSoundManager():playUISound("UIToggleTickBox") end)
end

-- ---------------------------------------------------------------------------
-- Abrir / cerrar
-- ---------------------------------------------------------------------------

function Diario.escala()
    local sw, sh = getCore():getScreenWidth(), getCore():getScreenHeight()
    local s = math.min(1, (sw - 40) / Diario.BASE_W, (sh - 60 - Diario.CINTA_H) / Diario.BASE_H)
    return math.max(0.55, s)
end

function Diario.abrir(tab)
    local C = Narrador.Cliente
    if tab ~= nil then Diario.tabActual = tab end
    if Diario.ventana ~= nil then
        if tab ~= nil then Diario.ventana:cambiarTab(tab) end
        Diario.ventana:refrescar()
        Diario.ventana:bringToTop()
    else
        local v = NarradorDiarioLibro:new(Diario.escala())
        v:initialise()
        v:addToUIManager()
        v:refrescar()
        Diario.ventana = v
        pcall(function() getSoundManager():playUISound("UIToggleTickBox") end)
    end
    Diario.hayNuevo = false
    if C ~= nil and C.estado == nil then C.enviar("pedirEstado") end
end

function Diario.alternar()
    if Diario.ventana ~= nil then Diario.ventana:cerrar() else Diario.abrir() end
end

function Diario.refrescar()
    if Diario.ventana ~= nil then Diario.ventana:refrescar() end
end

-- Llego una anotacion nueva: el icono avisa hasta que se abra el diario.
function Diario.marcarNuevo()
    if Diario.ventana ~= nil then return end
    Diario.hayNuevo = true
end

-- ---------------------------------------------------------------------------
-- Icono en pantalla
-- ---------------------------------------------------------------------------

NarradorDiarioIcono = ISPanel:derive("NarradorDiarioIcono")

Diario.ICONO_TAM = 48

function NarradorDiarioIcono:new(x, y)
    local o = ISPanel.new(self, x, y, Diario.ICONO_TAM, Diario.ICONO_TAM)
    o.background = false
    o.moveWithMouse = true
    o.tex = getTexture(Diario.TEX_ICONO)
    return o
end

function NarradorDiarioIcono:onMouseDown(x, y)
    self.apreto = { x = getMouseX(), y = getMouseY() }
    return ISPanel.onMouseDown(self, x, y)
end

local function fueClic(self)
    local a = self.apreto
    self.apreto = nil
    return a ~= nil and math.abs(getMouseX() - a.x) + math.abs(getMouseY() - a.y) < 5
end

function NarradorDiarioIcono:onMouseUp(x, y)
    local clic = fueClic(self)
    local r = ISPanel.onMouseUp(self, x, y)
    if clic then Diario.alternar() else Diario.guardarPosicion(self:getX(), self:getY()) end
    return r
end

function NarradorDiarioIcono:onMouseUpOutside(x, y)
    if self.apreto ~= nil then
        self.apreto = nil
        Diario.guardarPosicion(self:getX(), self:getY())
    end
    return ISPanel.onMouseUpOutside(self, x, y)
end

function NarradorDiarioIcono:render()
    local t = Diario.ICONO_TAM
    local sobre = self:isMouseOver()
    local ahora = getTimestampMs()
    local salto = 0
    if Diario.hayNuevo then salto = floor(math.abs(math.sin(ahora / 260)) * 4) end
    if self.tex ~= nil then
        local k = sobre and 1 or 0.92
        self:drawTextureScaled(self.tex, 0, -salto, t, t, 1, k, k, k)
    else
        self:drawRect(6, 4 - salto, t - 12, t - 8, 1, 0.38, 0.22, 0.13)
        self:drawRect(10, 14 - salto, t - 20, 6, 1, 0.9, 0.85, 0.7)
    end
    if Diario.hayNuevo then
        -- Sello rojo: hay algo nuevo escrito.
        local a = 0.75 + 0.25 * math.sin(ahora / 200)
        self:drawRect(t - 14, 2, 12, 12, a, 0.75, 0.08, 0.06)
        self:drawRectBorder(t - 14, 2, 12, 12, a, 0.35, 0.02, 0.02)
        self:drawText("!", t - 10, 0, 1, 0.95, 0.9, a, UIFont.Small)
    end
    if sobre and self.apreto == nil then
        local texto = Diario.hayNuevo and "Diario (hay algo nuevo)" or "Diario"
        local w = getTextManager():MeasureStringX(UIFont.Small, texto) + 10
        self:drawRect(t + 4, floor(t / 2) - 9, w, 18, 0.75, 0, 0, 0)
        self:drawText(texto, t + 9, floor(t / 2) - 8, 1, 0.92, 0.75, 1, UIFont.Small)
    end
end

-- Posicion del icono entre sesiones (archivo en la carpeta Lua del usuario).
function Diario.guardarPosicion(x, y)
    pcall(function()
        local f = getFileWriter(Diario.ARCHIVO_POS, true, false)
        if f == nil then return end
        f:write(tostring(floor(x)) .. "," .. tostring(floor(y)))
        f:close()
    end)
end

function Diario.leerPosicion()
    local x, y
    pcall(function()
        local f = getFileReader(Diario.ARCHIVO_POS, false)
        if f == nil then return end
        local linea = f:readLine()
        f:close()
        if linea ~= nil then
            local a, b = string.match(linea, "^(%-?%d+),(%-?%d+)")
            x, y = tonumber(a), tonumber(b)
        end
    end)
    return x, y
end

function Diario.acomodarIcono()
    local ic = Diario.icono
    if ic == nil then return end
    local sw, sh = getCore():getScreenWidth(), getCore():getScreenHeight()
    ic:setX(math.max(0, math.min(ic:getX(), sw - Diario.ICONO_TAM)))
    ic:setY(math.max(0, math.min(ic:getY(), sh - Diario.ICONO_TAM)))
end

function Diario.crearIcono()
    if Diario.icono ~= nil then return end
    local x, y = Diario.leerPosicion()
    if x == nil then
        x = 14
        y = floor(getCore():getScreenHeight() * 0.62)
    end
    local ic = NarradorDiarioIcono:new(x, y)
    ic:initialise()
    ic:addToUIManager()
    ic:setAlwaysOnTop(false)
    Diario.icono = ic
    Diario.acomodarIcono()
end

function Diario.alCambiarResolucion()
    Diario.acomodarIcono()
    if Diario.ventana ~= nil then
        Diario.ventana:cerrar()
        Diario.abrir()
    end
end

if not Diario._enganchado then
    Diario._enganchado = true
    Events.OnGameStart.Add(Diario.crearIcono)
    if Events.OnResolutionChange ~= nil then Events.OnResolutionChange.Add(Diario.alCambiarResolucion) end
end

return Diario
