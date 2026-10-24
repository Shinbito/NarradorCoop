-- Narrador Co-op: el diario de vida del jugador (la libreta).
-- Un icono de libro en pantalla (se puede arrastrar) abre un cuaderno de dos paginas.
-- Arriba de todo va siempre la barra de Knox (nivel, titulo y avance; clic para ver la
-- pestana Knox) y debajo las cintas, una por seccion (ver Diario.PESTANAS):
--   Principal   capitulos de la historia principal en curso.
--   Secundarias historias cortas y eventos en curso.
--   Pedidos     encargos de los misioneros, recados de los comerciantes y favores de Sous.
--   Rumores     lo que escuche en persona.
--   Knox        reconocimiento en Knox: nivel, barra, escalera de niveles, que sube y baja.
--   Historias   capitulos cerrados, historias que ya pasaron, lo que hice y los caidos.
--   Contactos   los misioneros, sus campamentos y la libreta de confianza.
--   Notas       el registro de todo lo anotado.
-- Cada seccion es una funcion en Diario.ARMAR que devuelve una lista de bloques; para
-- agregar una seccion basta sumarla a PESTANAS y a ARMAR.
-- Lo que se escribe viene del servidor ya resuelto (ver shared/Narrador/NarradorLore.lua y
-- Motor.vista). Colores y medidas: Diario.ESTILO, aqui abajo.
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

-- ---------------------------------------------------------------------------
-- Estilo: todo lo visual en un solo lugar (colores { r, g, b }, medidas en px de la textura
-- base de 1024 x 640 salvo que se diga otra cosa).
-- ---------------------------------------------------------------------------

Diario.ESTILO = {
    -- Tintas: todo escrito con un lapiz pasta azul (mas cargado en los titulos, gastado en
    -- las fechas y notas al margen). El rojo queda solo para lo urgente.
    tinta = { r = 0.10, g = 0.17, b = 0.47 },
    tinta_titulo = { r = 0.05, g = 0.10, b = 0.38 },
    tinta_azul = { r = 0.16, g = 0.26, b = 0.56 },
    lapiz = { r = 0.33, g = 0.40, b = 0.60 },
    sepia = { r = 0.20, g = 0.28, b = 0.55 },
    rojo = { r = 0.62, g = 0.10, b = 0.08 },
    verde = { r = 0.12, g = 0.38, b = 0.16 },
    -- Barra de avance dentro de las paginas (pestana Knox).
    barra_pagina_alto = 10,
    barra_pagina_ancho = 0.8, -- fraccion del ancho de la pagina
    -- Barra de Knox siempre visible arriba de la libreta (px de pantalla).
    knox_alto = 26,
    knox_fondo = { r = 0.10, g = 0.08, b = 0.06, a = 0.90 },
    knox_borde = { r = 0.55, g = 0.45, b = 0.30, a = 0.80 },
    knox_texto = { r = 0.95, g = 0.90, b = 0.78 },
    knox_bueno = { r = 0.45, g = 0.80, b = 0.42 },
    knox_malo = { r = 0.92, g = 0.35, b = 0.28 },
    knox_neutro = { r = 0.85, g = 0.78, b = 0.58 },
    knox_barra_fondo = { r = 0.25, g = 0.22, b = 0.18 },
    knox_barra_ancho = 200, -- maximo, en px de la textura base
    knox_aviso_ms = 12000,  -- cuanto parpadea la barra despues de cambiar de nivel
    -- Cintas (pestanas): alto en px de pantalla; ancho maximo y margen en px de la textura.
    cinta_alto = 30,
    cinta_max = 124,
    cinta_margen = 36,
    cinta_separacion = 6,
    cinta_texto = { r = 1, g = 0.95, b = 0.85 },
}
local E = Diario.ESTILO
local TINTA, TINTA_TITULO, TINTA_AZUL = E.tinta, E.tinta_titulo, E.tinta_azul
local LAPIZ, SEPIA, ROJO, VERDE = E.lapiz, E.sepia, E.rojo, E.verde

Diario.TEX_LIBRO = "media/textures/NarradorDiario_Libro.png"
Diario.TEX_ICONO = "media/textures/NarradorDiario_Icono.png"
Diario.ARCHIVO_POS = "NarradorDiario_pos.txt"

-- Medidas del libro en la textura original (1024 x 640).
Diario.BASE_W, Diario.BASE_H = 1024, 640
Diario.KNOX_H = E.knox_alto
Diario.CINTA_H = E.cinta_alto
-- Lo que hay arriba del libro: la barra de Knox y las cintas.
Diario.TOPE = Diario.KNOX_H + Diario.CINTA_H
Diario.PAGINAS = {
    { x0 = 82, x1 = 482, y0 = 64, y1 = 566 },  -- izquierda
    { x0 = 545, x1 = 945, y0 = 64, y1 = 566 }, -- derecha
}

Diario.PESTANAS = {
    { id = "principal", texto = "Principal", color = { r = 0.55, g = 0.12, b = 0.10 } },
    { id = "secundarias", texto = "Secundarias", color = { r = 0.16, g = 0.30, b = 0.18 } },
    { id = "pedidos", texto = "Pedidos", color = { r = 0.45, g = 0.30, b = 0.10 } },
    { id = "rumores", texto = "Rumores", color = { r = 0.35, g = 0.20, b = 0.38 } },
    { id = "knox", texto = "Knox", color = { r = 0.60, g = 0.45, b = 0.12 } },
    { id = "historias", texto = "Historias", color = { r = 0.30, g = 0.22, b = 0.16 } },
    { id = "contactos", texto = "Contactos", color = { r = 0.12, g = 0.32, b = 0.36 } },
    { id = "notas", texto = "Notas", color = { r = 0.18, g = 0.24, b = 0.42 } },
}

-- Nombres viejos de las pestanas (otras ventanas abren el diario con estos).
Diario.ALIAS = { historia = "principal", encargos = "pedidos", registro = "notas" }

function Diario.normalizarTab(tab)
    tab = Diario.ALIAS[tostring(tab)] or tab
    for _, p in ipairs(Diario.PESTANAS) do if p.id == tab then return tab end end
    return Diario.PESTANAS[1].id
end

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

-- Cuanto se muestra de cada lista.
Diario.LIMITES = { anotaciones = 2, cerradas = 10, rumores = 12, registro = 12, knox_registro = 6 }

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

local function miGrupo()
    local Cl = Narrador.Cliente
    return Cl ~= nil and Cl.miGrupo ~= nil and Cl.miGrupo() or nil
end

-- Mi reputacion de Knox (ver KD.progreso), o nil si no hay datos.
function Diario.knoxMio(estado)
    local KD = Narrador.KnoxDefs
    if KD == nil or KD.progreso == nil or estado == nil then return nil end
    local g = miGrupo()
    local kx = estado.knox ~= nil and g ~= nil and estado.knox[g] or nil
    return KD.progreso(kx ~= nil and kx.valor or 0)
end

function Diario.textoNivel(nivel)
    return "Nivel " .. tostring(nivel)
end

-- ---------------------------------------------------------------------------
-- Contenido: cada pestana es una lista de bloques
--   { t = texto, f = "titulo|sub|mano|chico|fecha", c = color, sangria = px, antes = px,
--     tachado = bool, centrado = bool, adorno = bool, junto = bool (no separar del siguiente),
--     pagina_nueva = bool, subrayado = bool, accion = { ... } }
--   { barra = 0..1, c = color, antes = px }  (barra de avance)
-- ---------------------------------------------------------------------------

local function agregar(b, bloque) b[#b + 1] = bloque end

local function titulo(b, texto, antes)
    agregar(b, { t = texto, f = "titulo", c = TINTA_TITULO, centrado = true, subrayado = true, antes = antes, junto = antes ~= nil })
    if antes == nil then agregar(b, { adorno = true, antes = 6 }) end
end

local function seccion(b, texto)
    agregar(b, { adorno = true, antes = 10 })
    agregar(b, { t = texto, f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
end

-- Id de la mision que sigue el jugador (la de la flecha), o nil.
function Diario.idSeguida()
    local Conv = Narrador.Conversacion
    if Conv == nil or Conv.misionSeguida == nil then return nil end
    local Cl = Narrador.Cliente
    local ok, it = pcall(Conv.misionSeguida, Cl ~= nil and Cl.estado or nil, Cl ~= nil and Cl.miGrupo ~= nil and Cl.miGrupo() or nil)
    return ok and it ~= nil and it.id or nil
end

local function visible(arco)
    return not arco.terminado and (arco.lore ~= nil or arco.pista ~= nil)
end

local function ultimaHora(arco)
    local d = arco.diario or {}
    if #d > 0 then return d[#d].h end
    return arco.inicio
end

-- A que seccion va un arco (en curso o cerrado): "principal", "pedido" o "secundaria".
function Diario.clase(a)
    if a.tipo == "principal" then return "principal" end
    if a.tipo == "encargo" or a.def == "recado_comerciante" then return "pedido" end
    return "secundaria"
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
        -- Boton para seguir esta mision (la misma eleccion que en la ventana de misiones).
        if arco.id ~= nil then
            local seguida = Diario.idSeguida() == arco.id
            agregar(b, { t = seguida and "[ Siguiendo esta mision - clic para soltarla ]" or "[ Seguir esta mision ]",
                f = "chico", c = seguida and ROJO or TINTA_AZUL, antes = 4, sangria = 8, subrayado = not seguida,
                accion = { seguir = seguida and "-" or arco.id } })
        end
    end
    local d = arco.diario or {}
    if #d > 1 then
        agregar(b, { t = "Anotado antes:", f = "fecha", c = LAPIZ, antes = 8, junto = true })
        local hasta = math.max(1, #d - Diario.LIMITES.anotaciones)
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

local function capitulosCerrados(estado)
    local cer = cerradas(estado, function(h) return h.tipo == "principal" end)
    table.sort(cer, function(x, y) return (x.capitulo or 0) < (y.capitulo or 0) end)
    return cer
end

local function tituloCapitulo(a)
    return "Capitulo " .. tostring(a.capitulo or "?") .. ": " .. tostring(a.titulo)
end

-- Principal: los capitulos en curso.
function Diario.paginaPrincipal(estado)
    local b = {}
    titulo(b, "Historia principal")
    local activos = {}
    for _, a in ipairs(estado.arcos or {}) do
        if Diario.clase(a) == "principal" and visible(a) then activos[#activos + 1] = a end
    end
    table.sort(activos, function(x, y) return (x.capitulo or 0) < (y.capitulo or 0) end)
    for _, a in ipairs(activos) do
        a.mostrarIntro = true
        Diario.entrada(b, a, tituloCapitulo(a))
    end
    local cer = capitulosCerrados(estado)
    if #activos == 0 then
        local fin = false
        for _, h in ipairs(cer) do if h.def == "sous_arsenal" then fin = true end end
        agregar(b, { t = fin and Lore.VACIO.principal_cerrada or Lore.VACIO.principal, f = "mano", c = SEPIA, antes = 8 })
        agregar(b, { adorno = true, antes = 8 })
    end
    if #cer > 0 then
        local ultimo = cer[#cer]
        agregar(b, { t = "Capitulos cerrados: " .. #cer .. " (el ultimo: " .. tituloCapitulo(ultimo) .. "). Estan en Historias.",
            f = "chico", c = LAPIZ, antes = 10 })
    end
    return b
end
Diario.paginaHistoria = Diario.paginaPrincipal

-- Secundarias: historias cortas y eventos en curso.
function Diario.paginaSecundarias(estado)
    local b = {}
    titulo(b, "Asuntos pendientes")
    local hay = false
    for _, a in ipairs(estado.arcos or {}) do
        if Diario.clase(a) == "secundaria" and visible(a) then
            hay = true
            Diario.entrada(b, a, tostring(a.titulo))
        end
    end
    if not hay then agregar(b, { t = Lore.VACIO.secundaria, f = "mano", c = SEPIA, antes = 6 }) end
    return b
end

-- Pedidos: el encargo de un misionero, los recados de los comerciantes y los favores de Sous.
function Diario.paginaPedidos(estado)
    local b = {}
    local grupo = miGrupo()
    titulo(b, "Pedidos")

    -- Encargo de un misionero (uno a la vez por grupo).
    agregar(b, { t = "Encargo de un misionero", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    local mio, otros = nil, 0
    for _, a in ipairs(estado.arcos or {}) do
        if a.tipo == "encargo" and not a.terminado then
            if a.dueno ~= nil and a.dueno == grupo then mio = a else otros = otros + 1 end
        end
    end
    if mio ~= nil and visible(mio) then
        local t = tostring(mio.titulo)
        if mio.contacto_nombre ~= nil then t = t .. " - " .. tostring(mio.contacto_nombre) end
        agregar(b, { t = t, f = "sub", c = TINTA_TITULO, antes = 8, junto = true })
        local h = ultimaHora(mio)
        local linea = (mio.ciudad ~= nil and (tostring(mio.ciudad) .. ". ") or "") .. tostring(Lore.NIVELES[tostring(mio.nivel)] or "")
        agregar(b, { t = (h ~= nil and (Diario.fecha(h) .. "  ") or "") .. linea, f = "fecha", c = LAPIZ, junto = true })
        agregar(b, { t = mio.lore or mio.pista or "", f = "mano", c = TINTA, antes = 4 })
        if mio.pista ~= nil then
            agregar(b, { t = "> " .. mio.pista, f = "chico", c = TINTA_AZUL, antes = 6, sangria = 8 })
        end
        if mio.id ~= nil then
            local seguida = Diario.idSeguida() == mio.id
            agregar(b, { t = seguida and "[ Siguiendo esta mision - clic para soltarla ]" or "[ Seguir esta mision ]",
                f = "chico", c = seguida and ROJO or TINTA_AZUL, antes = 4, sangria = 8, subrayado = not seguida,
                accion = { seguir = seguida and "-" or mio.id } })
        end
    else
        agregar(b, { t = Lore.VACIO.encargo, f = "mano", c = SEPIA, antes = 6 })
    end
    if otros > 0 then
        agregar(b, { t = (otros == 1 and "Otro grupo tiene un encargo en curso." or ("Otros grupos tienen " .. otros .. " encargos en curso.")),
            f = "fecha", c = LAPIZ, antes = 6 })
    end

    -- Recados de los comerciantes: los que estan en curso y los que ofrecen.
    seccion(b, "Recados de los comerciantes")
    local hayRecado = false
    for _, a in ipairs(estado.arcos or {}) do
        if a.def == "recado_comerciante" and visible(a) then
            hayRecado = true
            Diario.entrada(b, a, tostring(a.titulo))
        end
    end
    local ofertas = {}
    for _, c in ipairs(estado.contactos or {}) do
        local k = estado.campamentos ~= nil and estado.campamentos[c.id] or nil
        for _, o in ipairs(k ~= nil and k.oficios or {}) do
            if o.recado ~= nil then
                ofertas[#ofertas + 1] = tostring(o.titulo or o.oficio) .. " " .. tostring(o.nombre or "")
                    .. " (campamento de " .. tostring(c.nombre) .. "): " .. tostring(o.recado)
            end
        end
    end
    if #ofertas > 0 then
        agregar(b, { t = "Lo que piden en los campamentos:", f = "fecha", c = LAPIZ, antes = 6, junto = true })
        for _, t in ipairs(ofertas) do agregar(b, { t = t, f = "chico", c = TINTA, sangria = 8, antes = 3 }) end
    end
    if not hayRecado and #ofertas == 0 then
        agregar(b, { t = "Los comerciantes de los campamentos siempre tienen algo que pedir. Hay que hablarles.", f = "mano", c = SEPIA, antes = 4 })
    end
    agregar(b, { t = "> Cada recado cumplido sube la fama en Knox, aunque la tenga por el suelo.", f = "chico", c = TINTA_AZUL, antes = 6 })

    -- Favores que piden los de la base de Sous.
    local favores = estado.favores or {}
    if #favores > 0 then
        seccion(b, "Favores en la base de Sous")
        for _, f in ipairs(favores) do
            agregar(b, { t = tostring(f.nombre or f.corto or f.rol), f = "chico", c = TINTA, antes = 4, junto = true })
            agregar(b, { t = "Tiene algo que pedirme. Esta en la base de Sous.", f = "mano", c = SEPIA, sangria = 8 })
        end
    end
    return b
end

-- Rumores: lo que se dice por ahi.
function Diario.paginaRumores(estado)
    local b = {}
    titulo(b, "Lo que se dice por ahi")
    Diario.rumores(b, estado, true)
    return b
end

-- Como me trata la gente segun mi nivel en Knox.
Diario.TONOS = {
    odio = "Me odian. Los misioneros ya no me dan encargos ni capitulos y en los campamentos no me venden nada. Solo me queda hacer recados, salvar gente o acabar con bandidos.",
    desconfianza = "Me miran con desconfianza. Me hablan, pero cuidan lo que dicen.",
    aprecio = "Me aprecian. Me reciben con gusto y me cuentan cosas.",
    amor = "Me quieren. Saben lo que hice y me lo agradecen cada vez que me ven.",
    nada = "Nadie sabe mucho de mi todavia. Lo que haga de aqui en adelante es lo que van a contar.",
}

-- Knox: el reconocimiento entre los sobrevivientes del condado.
function Diario.paginaKnox(estado)
    local b = {}
    local KD = Narrador.KnoxDefs
    titulo(b, "Mi nombre en Knox")
    local p = Diario.knoxMio(estado)
    if KD == nil or p == nil then
        agregar(b, { t = "Nadie habla de mi todavia.", f = "mano", c = SEPIA, antes = 4 })
        return b
    end
    local malo = p.nivel < 0
    agregar(b, { t = Diario.textoNivel(p.nivel) .. " - " .. tostring(p.titulo), f = "sub", c = malo and ROJO or TINTA_TITULO,
        centrado = true, antes = 4, junto = true })
    agregar(b, { barra = p.frac, c = malo and ROJO or VERDE, antes = 6, junto = true })
    local linea = "Puntos: " .. tostring(p.valor) .. " (de " .. KD.MIN .. " a " .. KD.MAX .. ")."
    if p.mejor ~= nil then
        linea = linea .. " Faltan " .. p.mejor.falta .. " para " .. Diario.textoNivel(p.mejor.nivel) .. " - " .. p.mejor.titulo .. "."
    else
        linea = linea .. " Mas alto no se llega."
    end
    agregar(b, { t = linea, f = "chico", c = TINTA, antes = 6 })
    if p.peor ~= nil then
        agregar(b, { t = "Si pierdo " .. p.peor.falta .. " me empiezan a decir " .. p.peor.titulo .. ".", f = "chico", c = LAPIZ, antes = 2 })
    end
    local tono = KD.tono ~= nil and KD.tono(p.nivel) or nil
    agregar(b, { t = Diario.TONOS[tono or "nada"] or Diario.TONOS.nada, f = "mano", c = malo and ROJO or SEPIA, antes = 8 })
    local grupo = miGrupo()
    local hu = estado.huellas ~= nil and grupo ~= nil and estado.huellas[grupo] or nil
    if hu ~= nil and hu.titulo ~= nil then
        agregar(b, { t = "En el condado tambien me dicen " .. tostring(hu.titulo) .. ".", f = "mano", c = TINTA_TITULO, antes = 4 })
    end

    -- Escalera de niveles, del mejor al peor, con el mio marcado.
    seccion(b, "Como me pueden conocer")
    local filas = {}
    for i = #KD.POSITIVOS, 1, -1 do
        local n = KD.POSITIVOS[i]
        filas[#filas + 1] = { nivel = n.nivel, titulo = n.titulo, rango = n.desde .. " o mas" }
    end
    for _, n in ipairs(KD.NEGATIVOS) do
        filas[#filas + 1] = { nivel = n.nivel, titulo = n.titulo, rango = (n.hasta == -1 and "bajo 0" or (n.hasta .. " o menos")) }
    end
    for _, f in ipairs(filas) do
        local mia = f.nivel == p.nivel
        local color = mia and (malo and ROJO or TINTA_TITULO) or LAPIZ
        agregar(b, { t = (mia and "> " or "   ") .. Diario.textoNivel(f.nivel) .. "  " .. f.titulo .. "  (" .. f.rango .. ")" .. (mia and "  <- yo" or ""),
            f = "chico", c = color, sangria = 4, antes = 1, subrayado = mia })
    end

    -- Que la sube y que la baja (los puntos salen de KnoxDefs).
    local A, D = KD.ACTOS or {}, KD.DIFICULTAD or {}
    seccion(b, "Que me sube")
    local sube = {
        "Salvar o proteger a alguien: +" .. tostring(A.salvaste or 0) .. ".",
        "Compartir lo mio: +" .. tostring(A.compartiste or 0) .. ". Perdonar: +" .. tostring(A.perdonaste or 0) .. ".",
        "Cumplir encargos y misiones: facil +" .. tostring(D.facil or 0) .. ", medio +" .. tostring(D.medio or 0)
            .. ", dificil +" .. tostring(D.dificil or 0) .. ", ultra +" .. tostring(D.ultra or 0) .. ".",
        "Hacer un recado a un comerciante: +" .. tostring(KD.RECADO or 0) .. ".",
        "Limpiar un lugar tomado por bandidos: +" .. tostring(KD.BANDIDOS or 0) .. ".",
    }
    for _, t in ipairs(sube) do agregar(b, { t = "+ " .. t, f = "chico", c = TINTA, sangria = 8, antes = 2 }) end
    agregar(b, { t = "> Con mala fama solo sirve salvar gente, acabar con bandidos y hacer recados.", f = "chico", c = TINTA_AZUL, antes = 4 })
    seccion(b, "Que me baja")
    local baja = {
        "Matar a alguien fuera de una mision: " .. tostring(KD.MATAR or 0) .. ".",
        "Traicionar: " .. tostring(A.traicionaste or 0) .. ". Entregar a alguien: " .. tostring(A.entregaste or 0) .. ".",
        "Dejar a alguien a su suerte: " .. tostring(A.lo_dejaste or 0) .. ". Intimidar: " .. tostring(A.intimidaste or 0) .. ".",
        "Cada mision para los bandidos: " .. tostring(KD.BANDIDOS_MISION or 0) .. ".",
    }
    for _, t in ipairs(baja) do agregar(b, { t = "- " .. t, f = "chico", c = TINTA, sangria = 8, antes = 2 }) end
    if KD.DESPRECIO ~= nil then
        local n = nil
        for _, x in ipairs(KD.NEGATIVOS) do if x.nivel == KD.DESPRECIO then n = x end end
        if n ~= nil then
            agregar(b, { t = "> Desde " .. n.titulo .. " los misioneros no me dan trabajo y los comerciantes no me venden.",
                f = "chico", c = ROJO, antes = 4 })
        end
    end

    -- Lo anotado sobre Knox en el registro.
    local notas = {}
    local diario = estado.diario or {}
    for i = #diario, 1, -1 do
        if diario[i].arco == "Knox" then notas[#notas + 1] = diario[i] end
        if #notas >= Diario.LIMITES.knox_registro then break end
    end
    if #notas > 0 then
        seccion(b, "Lo que fui anotando")
        for _, e in ipairs(notas) do
            agregar(b, { t = Diario.fecha(e.h) .. "  " .. tostring(e.t), f = "chico", c = TINTA, sangria = 8, antes = 3 })
        end
    end
    return b
end

-- Historias: lo que ya paso (capitulos cerrados, otras historias, lo que hice y los caidos).
function Diario.paginaHistorias(estado)
    local b = {}
    local grupo = miGrupo()
    titulo(b, "Lo que ya paso")
    local cer = capitulosCerrados(estado)
    agregar(b, { t = "Capitulos cerrados", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    if #cer == 0 then
        agregar(b, { t = "Ningun capitulo cerrado todavia.", f = "mano", c = SEPIA, antes = 4 })
    end
    for _, h in ipairs(cer) do
        cerrada(b, { titulo = tituloCapitulo(h), fin = h.fin, epilogo = h.epilogo })
    end
    local otras = cerradas(estado, function(h)
        local k = Diario.clase(h)
        if k == "principal" then return false end
        return h.tipo ~= "encargo" or h.dueno == nil or h.dueno == grupo
    end)
    if #otras > 0 then
        seccion(b, "Otras historias que ya pasaron")
        for i = 1, math.min(Diario.LIMITES.cerradas, #otras) do cerrada(b, otras[i]) end
    end
    Diario.loQueHice(b, estado)
    Diario.enMemoria(b, estado)
    return b
end

-- Contactos: los misioneros, sus campamentos y cuanto me tienen confianza.
function Diario.paginaContactos(estado)
    local b = {}
    titulo(b, "Contactos")
    local contactos = estado.contactos or {}
    agregar(b, { t = "Los misioneros", f = "sub", c = TINTA_TITULO, antes = 6, junto = true })
    if #contactos == 0 then
        agregar(b, { t = "Escuche que en algunos pueblos hay gente que reparte trabajo a cambio de comida. Todavia no los encuentro.",
            f = "mano", c = SEPIA, antes = 4 })
        return b
    end
    local mio = Narrador.Cliente ~= nil and Narrador.Cliente.miEncargo ~= nil and Narrador.Cliente.miEncargo() or nil
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
            agregar(b, { t = linea, f = "chico", c = k.ataque and ROJO or TINTA_AZUL, sangria = 8, antes = 3 })
        end
    end
    agregar(b, { t = "> Para pedir trabajo hay que acercarse y hablarles (clic derecho). Un encargo a la vez por grupo.",
        f = "chico", c = TINTA_AZUL, antes = 8 })
    Diario.libreta(b, estado, contactos)
    return b
end

-- Notas: el registro de todo lo anotado.
function Diario.paginaNotas(estado)
    local b = {}
    titulo(b, "Registro")
    local diario = estado.diario or {}
    if #diario == 0 then
        agregar(b, { t = "Nada anotado todavia.", f = "mano", c = SEPIA, antes = 4 })
    end
    for i = #diario, math.max(1, #diario - Diario.LIMITES.registro + 1), -1 do
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
    local grupo = miGrupo()
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
    local grupo = miGrupo()
    local fila = estado.reputacion ~= nil and grupo ~= nil and estado.reputacion[grupo] or nil
    seccion(b, "Libreta de confianza")
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

-- Lo que se dice por ahi: rumores que escuche en persona. "solo" = es la pagina entera.
function Diario.rumores(b, estado, solo)
    local grupo = miGrupo()
    local lista = estado.rumores ~= nil and grupo ~= nil and estado.rumores[grupo] or nil
    if not solo then seccion(b, "Lo que se dice por ahi") end
    if lista == nil or #lista == 0 then
        agregar(b, { t = "No he escuchado nada raro. Habria que conversar mas con la gente.", f = "mano", c = SEPIA, antes = 4 })
        return
    end
    for i = #lista, math.max(1, #lista - Diario.LIMITES.rumores + 1), -1 do
        local r = lista[i]
        agregar(b, { t = Diario.fecha(r.h), f = "fecha", c = LAPIZ, antes = 6, junto = true })
        agregar(b, { t = '"' .. tostring(r.t) .. '"', f = "mano", c = TINTA, sangria = 8 })
    end
    agregar(b, { t = "> Los rumores se escuchan conversando con la gente. No todos son ciertos.", f = "chico", c = TINTA_AZUL, antes = 8 })
end

-- Lo que hice: las decisiones que me marcaron (con lo que paso despues).
function Diario.loQueHice(b, estado)
    local grupo = miGrupo()
    local mio = estado.huellas ~= nil and grupo ~= nil and estado.huellas[grupo] or nil
    seccion(b, "Lo que hice")
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

-- Los que ya no estan: el nombre tachado y lo que escribi. Si lo mate yo, en rojo.
function Diario.enMemoria(b, estado)
    local lista = estado.caidos or {}
    if #lista == 0 then return end
    seccion(b, "Los que ya no estan")
    for i = #lista, 1, -1 do
        local c = lista[i]
        agregar(b, { t = tostring(c.nombre), f = "chico", c = c.mato and ROJO or TINTA, tachado = true, antes = 6, junto = true })
        agregar(b, { t = Diario.fecha(c.h), f = "fecha", c = LAPIZ, sangria = 8, junto = true })
        agregar(b, { t = tostring(c.texto), f = "mano", c = c.mato and ROJO or SEPIA, sangria = 8, antes = 2 })
    end
end

-- Que arma cada pestana.
Diario.ARMAR = {
    principal = function(e) return Diario.paginaPrincipal(e) end,
    secundarias = function(e) return Diario.paginaSecundarias(e) end,
    pedidos = function(e) return Diario.paginaPedidos(e) end,
    rumores = function(e) return Diario.paginaRumores(e) end,
    knox = function(e) return Diario.paginaKnox(e) end,
    historias = function(e) return Diario.paginaHistorias(e) end,
    contactos = function(e) return Diario.paginaContactos(e) end,
    notas = function(e) return Diario.paginaNotas(e) end,
}

function Diario.contenido(tab, estado)
    if estado == nil then
        return { { t = "Las hojas estan pegadas por la humedad. Espera un momento...", f = "mano", c = SEPIA } }
    end
    local f = Diario.ARMAR[Diario.normalizarTab(tab)] or Diario.ARMAR.principal
    return f(estado)
end

-- ---------------------------------------------------------------------------
-- Paginado: reparte los bloques en paginas del tamano dado.
-- Devuelve { pagina = { { t, x, y, fuente, c, tachado, centrado, adorno, barra, ancho }, ... }, ... }
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
        elseif bl.barra ~= nil then
            c.alto = E.barra_pagina_alto + 4
            c.hl = c.alto
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
        elseif bl.barra ~= nil then
            if y > 0 and y + antes + math.min(necesita, alto) > alto then
                nuevaPagina()
                antes = 0
            end
            y = y + antes
            local w = floor(ancho * E.barra_pagina_ancho)
            table.insert(paginas[#paginas], { barra = math.max(0, math.min(1, tonumber(bl.barra) or 0)), c = bl.c or TINTA,
                x = floor((ancho - w) / 2), y = y + 2, ancho = w, hl = E.barra_pagina_alto })
            y = y + c.alto
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
                    tachado = bl.tachado, subrayado = bl.subrayado, ancho = Diario.ancho(c.fuente, linea), hl = c.hl,
                    accion = bl.accion })
                y = y + c.hl
            end
        end
    end
    if #paginas > 1 and #paginas[#paginas] == 0 then table.remove(paginas) end
    return paginas
end

-- ---------------------------------------------------------------------------
-- Aviso de cambio de nivel en Knox (lo detecta el cliente al llegar el estado)
-- ---------------------------------------------------------------------------

function Diario.revisarKnox(estado)
    local p = Diario.knoxMio(estado)
    if p == nil then return end
    local g = miGrupo()
    local antes = Diario._knoxNivel
    if antes ~= nil and Diario._knoxGrupo == g and p.nivel ~= antes then
        local sube = p.nivel > antes
        Diario.knoxAviso = { t = getTimestampMs(), sube = sube, nivel = p.nivel, titulo = p.titulo }
        local texto = (sube and "Knox: subiste a " or "Knox: bajaste a ") .. Diario.textoNivel(p.nivel) .. " - " .. tostring(p.titulo)
        local Cl = Narrador.Cliente
        if Cl ~= nil and Cl.halo ~= nil then pcall(Cl.halo, texto) end
        pcall(function() getSoundManager():playUISound(sube and "UIActivateMainMenuItem" or "UIToggleTickBox") end)
        Diario.marcarNuevo()
    end
    Diario._knoxNivel, Diario._knoxGrupo = p.nivel, g
end

-- ---------------------------------------------------------------------------
-- Ventana del diario
-- ---------------------------------------------------------------------------

NarradorDiarioLibro = ISPanel:derive("NarradorDiarioLibro")

function NarradorDiarioLibro:new(escala)
    local w = floor(Diario.BASE_W * escala)
    local h = floor(Diario.BASE_H * escala) + Diario.TOPE
    local x = floor((getCore():getScreenWidth() - w) / 2)
    local y = floor((getCore():getScreenHeight() - h) / 2)
    local o = ISPanel.new(self, x, y, w, h)
    o.background = false
    o.moveWithMouse = true
    o.escala = escala
    o.tab = Diario.normalizarTab(Diario.tabActual)
    o.hoja = {}
    o.paginas = { {} }
    o.texLibro = getTexture(Diario.TEX_LIBRO)
    return o
end

function NarradorDiarioLibro:rectPagina(i)
    local p, s = Diario.PAGINAS[i], self.escala
    return floor(p.x0 * s), Diario.TOPE + floor(p.y0 * s), floor((p.x1 - p.x0) * s), floor((p.y1 - p.y0) * s)
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
    id = Diario.normalizarTab(id)
    if self.tab == id then return end
    self.tab = id
    Diario.tabActual = id
    self:refrescar()
    pcall(function() getSoundManager():playUISound("UISelectListItem") end)
end

-- Cintas: el ancho de cada una sale de su texto; quedan centradas sobre el libro.
function NarradorDiarioLibro:armarCintas()
    local s = self.escala
    local n = #Diario.PESTANAS
    local margen = floor(E.cinta_margen * s)
    local sep = math.max(2, floor(E.cinta_separacion * s))
    local disponible = self.width - 2 * margen - (n - 1) * sep
    local anchos, total = {}, 0
    for i, p in ipairs(Diario.PESTANAS) do
        anchos[i] = Diario.ancho(UIFont.Small, p.texto) + 12
        total = total + anchos[i]
    end
    -- Si sobra espacio se ensanchan (hasta cinta_max); si falta, se achican parejo.
    local maximo = floor(E.cinta_max * s)
    local k = total > 0 and disponible / total or 1
    total = 0
    for i = 1, n do
        anchos[i] = math.max(20, floor(math.min(anchos[i] * k, math.max(anchos[i], maximo))))
        total = total + anchos[i]
    end
    local x = floor((self.width - total - (n - 1) * sep) / 2)
    self.cintas = {}
    for i = 1, n do
        self.cintas[i] = { x = x, w = anchos[i] }
        x = x + anchos[i] + sep
    end
end

-- Zonas clicables: barra de Knox, cintas, cerrar, flechas.
function NarradorDiarioLibro:zonaKnox()
    return 0, 0, self.width, Diario.KNOX_H
end

function NarradorDiarioLibro:zonaCinta(i)
    if self.cintas == nil or #self.cintas ~= #Diario.PESTANAS then self:armarCintas() end
    local c = self.cintas[i]
    return c.x, Diario.KNOX_H, c.w, Diario.CINTA_H + floor(14 * self.escala)
end

function NarradorDiarioLibro:zonaCerrar()
    local s = self.escala
    return self.width - floor(38 * s), Diario.TOPE + floor(2 * s), floor(28 * s), floor(26 * s)
end

function NarradorDiarioLibro:zonaFlecha(lado)
    local s = self.escala
    local y = Diario.TOPE + floor(574 * s)
    if lado < 0 then return floor(60 * s), y, floor(64 * s), floor(28 * s) end
    return floor(900 * s), y, floor(64 * s), floor(28 * s)
end

local function dentro(px, py, x, y, w, h)
    return px >= x and px <= x + w and py >= y and py <= y + h
end

function NarradorDiarioLibro:onMouseDown(x, y)
    if dentro(x, y, self:zonaKnox()) then self:cambiarTab("knox"); return true end
    for i, p in ipairs(Diario.PESTANAS) do
        if dentro(x, y, self:zonaCinta(i)) then self:cambiarTab(p.id); return true end
    end
    if dentro(x, y, self:zonaCerrar()) then self:cerrar(); return true end
    if dentro(x, y, self:zonaFlecha(-1)) then self:pasar(-1); return true end
    if dentro(x, y, self:zonaFlecha(1)) then self:pasar(1); return true end
    -- Botones dentro de las paginas (seguir una mision).
    local izq = ((self.hoja[self.tab] or 1) - 1) * 2 + 1
    for i = 1, 2 do
        local px, py = self:rectPagina(i)
        for _, l in ipairs(self.paginas[izq + i - 1] or {}) do
            if l.accion ~= nil and dentro(x, y, px + l.x - 4, py + l.y - 2, (l.ancho or 0) + 8, (l.hl or 12) + 4) then
                local Conv = Narrador.Conversacion
                if l.accion.seguir ~= nil and Conv ~= nil and Conv.cambiarSeguir ~= nil then
                    Conv.cambiarSeguir(l.accion.seguir)
                    pcall(function() getSoundManager():playUISound("UISelectListItem") end)
                    self:refrescar()
                end
                return true
            end
        end
    end
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
        elseif l.barra ~= nil then
            self:drawRect(px + l.x, py + l.y, l.ancho, l.hl, 0.18, LAPIZ.r, LAPIZ.g, LAPIZ.b)
            self:drawRect(px + l.x, py + l.y, floor(l.ancho * l.barra), l.hl, 0.75, l.c.r, l.c.g, l.c.b)
            self:drawRectBorder(px + l.x, py + l.y, l.ancho, l.hl, 0.7, TINTA.r, TINTA.g, TINTA.b)
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

-- Barra de Knox: siempre arriba, "Knox: Nivel 3 - Alguien de palabra [=====   ] faltan 38 para ...".
function NarradorDiarioLibro:dibujarKnox()
    local s = self.escala
    local x0, y0, w, h = self:zonaKnox()
    local f = E.knox_fondo
    self:drawRect(x0, y0, w, h, f.a, f.r, f.g, f.b)
    local bo = E.knox_borde
    self:drawRectBorder(x0, y0, w, h, bo.a, bo.r, bo.g, bo.b)
    local p = Diario.knoxMio(Narrador.Cliente ~= nil and Narrador.Cliente.estado or nil)
    local fuente = UIFont.Small
    local ty = y0 + floor((h - Diario.alto(fuente)) / 2)
    local tx = E.knox_texto
    if p == nil then
        self:drawText("Knox: esperando noticias...", 10, ty, tx.r, tx.g, tx.b, 0.8, fuente)
        return
    end
    local color = p.nivel < 0 and E.knox_malo or (p.nivel >= 2 and E.knox_bueno or E.knox_neutro)
    -- Recien cambio de nivel: la barra parpadea un rato.
    local av = Diario.knoxAviso
    local ahora = getTimestampMs()
    local prefijo = ""
    if av ~= nil and ahora - av.t < E.knox_aviso_ms then
        local c2 = av.sube and E.knox_bueno or E.knox_malo
        local a = 0.25 + 0.2 * math.sin(ahora / 180)
        self:drawRect(x0, y0, w, h, a, c2.r, c2.g, c2.b)
        prefijo = av.sube and "SUBISTE!  " or "BAJASTE.  "
    end
    local texto = prefijo .. "Knox: " .. Diario.textoNivel(p.nivel) .. " - " .. tostring(p.titulo)
    local x = 10
    self:drawText(texto, x, ty, color.r, color.g, color.b, 1, fuente)
    x = x + Diario.ancho(fuente, texto) + 12
    -- La barra de avance hacia el nivel de arriba.
    local resto = "  " .. tostring(p.valor) .. " pts" .. (p.mejor ~= nil and (" - faltan " .. p.mejor.falta .. " para " .. p.mejor.titulo) or " - lo mas alto")
    local bw = math.min(floor(E.knox_barra_ancho * s), w - x - 10 - Diario.ancho(fuente, resto))
    if bw < 40 then
        resto = "  " .. tostring(p.valor) .. " pts"
        bw = math.min(floor(E.knox_barra_ancho * s), w - x - 10 - Diario.ancho(fuente, resto))
    end
    if bw >= 30 then
        local bh = math.max(6, floor(h / 3))
        local by = y0 + floor((h - bh) / 2)
        local bf = E.knox_barra_fondo
        self:drawRect(x, by, bw, bh, 1, bf.r, bf.g, bf.b)
        self:drawRect(x, by, floor(bw * p.frac), bh, 1, color.r, color.g, color.b)
        self:drawRectBorder(x, by, bw, bh, 0.8, bo.r, bo.g, bo.b)
        x = x + bw
    end
    if x + Diario.ancho(fuente, resto) <= w - 6 then
        self:drawText(resto, x, ty, tx.r, tx.g, tx.b, 0.85, fuente)
    end
end

function NarradorDiarioLibro:render()
    local s = self.escala
    local mx, my = self:getMouseX(), self:getMouseY()
    self:dibujarKnox()
    -- Cintas (detras del libro: solo asoman por arriba).
    local ct = E.cinta_texto
    for i, p in ipairs(Diario.PESTANAS) do
        local x, y, w, h = self:zonaCinta(i)
        local activa = self.tab == p.id
        local baja = activa and 0 or 6
        local k = activa and 1 or (dentro(mx, my, x, y, w, h) and 0.85 or 0.7)
        self:drawRect(x, y + baja, w, h + 20 - baja, 1, p.color.r * k, p.color.g * k, p.color.b * k)
        self:drawRect(x + 3, y + baja + 3, w - 6, 1, 0.35, 1, 1, 1)
        local tc = activa and 1 or 0.8
        self:drawTextCentre(p.texto, x + floor(w / 2), y + baja + 6, ct.r * tc, ct.g * tc, ct.b * tc, 1, UIFont.Small)
    end
    -- Libro.
    if self.texLibro ~= nil then
        self:drawTextureScaled(self.texLibro, 0, Diario.TOPE, self.width, self.height - Diario.TOPE, 1, 1, 1, 1)
    else
        self:drawRect(0, Diario.TOPE, self.width, self.height - Diario.TOPE, 1, 0.29, 0.17, 0.11)
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
    local yPie = Diario.TOPE + floor(578 * s)
    local total = #self.paginas
    if self.paginas[izq] ~= nil then
        self:drawTextCentre("- " .. izq .. " -", floor(281 * s), yPie, LAPIZ.r, LAPIZ.g, LAPIZ.b, 1, UIFont.Small)
    end
    if self.paginas[izq + 1] ~= nil then
        self:drawTextCentre("- " .. (izq + 1) .. " -", floor(745 * s), yPie, LAPIZ.r, LAPIZ.g, LAPIZ.b, 1, UIFont.Small)
    end
    if hoja > 1 then
        local x, y = self:zonaFlecha(-1)
        local sobre = dentro(mx, my, self:zonaFlecha(-1))
        self:drawText("< volver", x, y + 4, TINTA.r, TINTA.g, TINTA.b, sobre and 1 or 0.7, UIFont.Small)
    end
    if izq + 1 < total then
        local x, y = self:zonaFlecha(1)
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
    local s = math.min(1, (sw - 40) / Diario.BASE_W, (sh - 60 - Diario.TOPE) / Diario.BASE_H)
    return math.max(0.55, s)
end

function Diario.abrir(tab)
    local C = Narrador.Cliente
    if tab ~= nil then Diario.tabActual = Diario.normalizarTab(tab) end
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

-- Llega un estado nuevo: se revisa si cambio el nivel de Knox y se redibuja la ventana.
function Diario.refrescar()
    local C = Narrador.Cliente
    pcall(Diario.revisarKnox, C ~= nil and C.estado or nil)
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
        local p = Diario.knoxMio(Narrador.Cliente ~= nil and Narrador.Cliente.estado or nil)
        if p ~= nil then texto = texto .. " - Knox: " .. Diario.textoNivel(p.nivel) .. " " .. tostring(p.titulo) end
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
