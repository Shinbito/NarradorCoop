-- Narrador Co-op: campamentos de los misioneros (datos compartidos por servidor y cliente).
-- Cada misionero, una vez desbloqueado, tiene un campamento que sube de nivel. En cada nivel
-- llega alguien con un oficio que vende cosas a cambio de comida, municion, abrigo (ropa) o
-- medicina:
--   nivel 1: carpintero  (2 personas salvadas y llevadas al campamento)
--   nivel 2: herrero     (4 salvadas + capitulo 1 de la historia del misionero + confianza 2)
--   nivel 3: mecanico    (6 salvadas + capitulo 2 + confianza 3)
--   nivel 4: curandero   (8 salvadas + confianza 4; con la Tia Chela, ademas su capitulo 3:
--                         el curandero es el doctor Hartmann)
-- Si un capitulo todavia no esta escrito, ese requisito no se pide.
-- Los precios dependen de lo que le sobra o le falta a cada campamento y de la confianza.
-- Textos sin tildes a proposito.

Narrador = Narrador or {}
local K = Narrador.CampamentosDefs or {}
Narrador.CampamentosDefs = K

K.NIVELES = {
    { salvados = 2, oficio = "carpintero" },
    { salvados = 4, historia = 1, confianza = 2, oficio = "herrero" },
    { salvados = 6, historia = 2, confianza = 3, oficio = "mecanico" },
    { salvados = 8, confianza = 4, oficio = "curandero", historia_de = { westpoint = 3 } },
}

-- Reservas: cada campamento tiene de 0 a 100 de comida, municion, abrigo y medicina. Pagar con
-- lo que les falta rinde mas (barato) y con lo que les sobra rinde menos (caro): el precio se
-- multiplica por 0.5 (reserva 0) a 1.5 (reserva 100). Lo que pagas se suma a sus reservas y
-- cada dia gastan (mas con mas guardias; abrigo mas en invierno; municion y medicina en los
-- ataques de hordas). Empiezan segun lo que valora cada uno (K.GUSTOS: menos de 1 = le falta).
K.GUSTOS = {
    muldraugh = { municion = 0.6, comida = 1.3, abrigo = 1.0, medicina = 0.9 },  -- el Cabo: militar, quiere balas
    westpoint = { municion = 1.1, comida = 0.8, abrigo = 1.0, medicina = 1.0 },  -- la Chela: cocina para todos
    riverside = { municion = 1.2, comida = 0.8, abrigo = 0.7, medicina = 0.7 },  -- el Padre Nacho: enfermos y frio
    rosewood = { municion = 0.9, comida = 0.9, abrigo = 1.1, medicina = 1.0 },   -- la Misia Rosa: compra de todo
}

function K.reservasIniciales(contactoId)
    local g = K.GUSTOS[contactoId] or {}
    local r = {}
    for _, m in ipairs({ "comida", "municion", "abrigo", "medicina" }) do
        r[m] = math.max(5, math.min(95, math.floor(50 * (tonumber(g[m]) or 1) + 0.5)))
    end
    return r
end

-- Gasto diario de un campamento (guardias = cuantos hay; invierno = true en invierno).
function K.gastoDiario(guardias, invierno)
    guardias = tonumber(guardias) or 0
    return { comida = 3 + math.floor(guardias / 2), medicina = 1 + math.floor(guardias / 5),
        abrigo = invierno and 4 or 1, municion = 1 }
end
K.GASTO_ATAQUE = { municion = 10, medicina = 6 }
-- Cuanto suben las reservas por cada unidad pagada.
K.RESERVA_POR_UNIDAD = 2

-- Descuento por confianza con el misionero (nivel 1..5).
K.DESCUENTO = { 1, 1, 0.9, 0.8, 0.65 }

K.MONEDAS = {
    comida = "comida",
    municion = "municion (cajas, o 10 balas sueltas)",
    abrigo = "abrigo (ropa que no llevas puesta)",
    medicina = "medicina",
}
K.ORDEN_MONEDAS = { "comida", "municion", "abrigo", "medicina" }

-- Cuanto vale cada medicina (por parte del nombre del tipo; la primera que calce). Lo que no
-- esta en la lista no sirve como pago (las pastillas K-93 y los objetos de las historias, no).
K.MEDICINAS = {
    { "FirstAidKit", 4 }, { "Antibiotics", 3 }, { "Antibioticos", 3 }, { "SutureNeedleHolder", 2 },
    { "Disinfectant", 2 }, { "PillsAntiDep", 2 }, { "PillsBeta", 2 }, { "PillsSleepingTablets", 2 }, { "PillsVitamins", 1 },
    { "Pills", 2 }, { "AlcoholBandage", 2 }, { "SutureNeedle", 1 }, { "Splint", 1 }, { "Bandage", 1 },
    { "AlcoholWipes", 1 }, { "CottonBalls", 1 },
}

function K.valorMedicina(tipo)
    tipo = tostring(tipo or "")
    if string.find(tipo, "CuraZ", 1, true) ~= nil then return 0 end
    for _, m in ipairs(K.MEDICINAS) do
        if string.find(tipo, m[1], 1, true) ~= nil then return m[2] end
    end
    return 0
end

-- Cuanto vale una prenda (1 a 5): el promedio de sus stats (abrigo, viento, agua, defensa
-- contra mordidas y rasgunos), por su estado. Una polera rota vale 1; una parka militar
-- entera, 4 o 5. stats = { aislacion, viento, agua (0..1), mordida, rasguno (0..100), estado (0..1) }
function K.valorPrenda(stats)
    local s = stats or {}
    local prom = ((tonumber(s.aislacion) or 0) + (tonumber(s.viento) or 0) + (tonumber(s.agua) or 0)
        + (tonumber(s.mordida) or 0) / 100 + (tonumber(s.rasguno) or 0) / 100) / 5
    prom = prom * math.max(0, math.min(1, tonumber(s.estado) or 1))
    return math.max(1, math.min(5, 1 + math.floor(prom * 8)))
end

-- Oficios: quien llega, con que perfil de A-Life, y que vende. Cada articulo: texto, items
-- (alternativas por si un tipo no existe), precio base y, si pide, confianza minima.
-- servicio = "mejorar" (el herrero mejora el arma que llevas en la mano) o "auto".
K.OFICIOS = {
    carpintero = {
        titulo = "Carpintero", perfil = "k93_stockyard_02", nombre = { "Anselmo", "Tablas" },
        llega = "Llega al campamento un carpintero con su caja de herramientas al hombro.",
        catalogo = {
            { texto = "4 tablas", items = { { "Base.Plank" }, { "Base.Plank" }, { "Base.Plank" }, { "Base.Plank" } }, precio = 2 },
            { texto = "Clavos", items = { { "Base.NailsBox", "Base.Nails" } }, precio = 2 },
            { texto = "Martillo", items = { { "Base.Hammer", "Base.HammerStone" } }, precio = 4 },
            { texto = "Serrucho", items = { { "Base.Saw", "Base.GardenSaw" } }, precio = 4 },
            { texto = "Bate con clavos", items = { { "Base.BaseballBatNails", "Base.BaseballBat" } }, precio = 5, confianza = 3 },
            -- Para el herrero: con un mango te forja un arma.
            { texto = "Mango de arma (para el herrero)", items = { { "Narrador.MangoArma" } }, precio = 4 },
            { texto = "Mango de madera noble (arma legendaria)", items = { { "Narrador.MangoLegendario" } }, precio = 14, confianza = 4 },
        },
    },
    herrero = {
        titulo = "Herrero", perfil = "k93_stockyard_03", nombre = { "Rufino", "Yunque" },
        llega = "Llega al campamento un herrero. Se instala junto al fuego y empieza a martillar.",
        catalogo = {
            { texto = "Cuchillo", items = { { "Base.HuntingKnife", "Base.KitchenKnife" } }, precio = 3 },
            { texto = "Machete", items = { { "Base.Machete" } }, precio = 8 },
            { texto = "Hacha", items = { { "Base.Axe", "Base.WoodAxe" } }, precio = 8 },
            { texto = "Mejorar el arma que llevas en la mano", servicio = "mejorar", precio = 10, confianza = 3 },
            -- Necesita un mango del carpintero: normal -> arma excepcional; noble -> legendaria.
            { texto = "Forjar un arma con tu mango del carpintero", servicio = "forjar", precio = 6 },
        },
    },
    mecanico = {
        titulo = "Mecanico", perfil = "k93_truckstop_02", nombre = { "Wilson", "Tuercas" },
        llega = "Llega al campamento un mecanico con las manos negras de grasa. Pregunta donde esta el taller.",
        catalogo = {
            { texto = "Bateria de auto", items = { { "Base.CarBattery1", "Base.CarBattery2", "Base.CarBattery3" } }, precio = 6 },
            { texto = "Bidon de bencina", items = { { "Base.PetrolCan", "Base.JerryCan" } }, precio = 6 },
            { texto = "Llave de ruedas y gata", items = { { "Base.LugWrench" }, { "Base.Jack" } }, precio = 4 },
            { texto = "Un auto en buen estado", servicio = "auto", precio = 40, confianza = 5 },
        },
    },
    curandero = {
        titulo = "Curandero", perfil = "k93_county_ems_04", nombre = { "Rosendo", "Hierbas" },
        -- La Tia Chela: el curandero es el doctor Hartmann (su capitulo 3).
        por_contacto = { westpoint = { perfil = "k93_red_cross_02", nombre = { "Elias", "Hartmann" },
            llega = "El doctor Hartmann abre su consulta en el cuartel. Dice que ya no promete curas, solo remedios." } },
        llega = "Llega al campamento un curandero con una maleta llena de frascos.",
        catalogo = {
            { texto = "Vendas", items = { { "Base.Bandage" }, { "Base.Bandage" } }, precio = 2 },
            { texto = "Desinfectante", items = { { "Base.Disinfectant", "Base.AlcoholBandage" } }, precio = 3 },
            { texto = "Pastillas", items = { { "Base.Pills" } }, precio = 3 },
            { texto = "Antibioticos", items = { { "Narrador.Antibioticos", "Base.Antibiotics" } }, precio = 6 },
            { texto = "Botiquin", items = { { "Base.FirstAidKit", "Base.Bandage" } }, precio = 8, confianza = 4 },
        },
    },
}

-- Recados: cada comerciante siempre tiene una mision chica para ti, aunque tengas mala fama
-- ("Quieres que la gente confie en ti? Ayudame con esto."). Te marca un lugar en un mapa,
-- buscas la cosa ahi y se la llevas (shared/Narrador/Arcos/Recados.lua). Dan reputacion de
-- Knox (KnoxDefs.RECADO) y un poco de confianza con el misionero. Uno cada 12 horas por grupo.
-- Con fama de El destripador o peor no te venden nada, pero los recados siguen.
K.RECADO_CADA = 12
K.RECADO_CONFIANZA = 2
-- Los recados se arman al azar: una cosa del oficio (de su lista), uno de los lugares donde
-- podria estar y una de sus formas de pedirlo. Cada cosa: tipos (alternativas; la ultima es
-- un objeto del juego base que existe seguro), nombre y salas donde buscar.
K.RECADOS_OBJETOS = {
    carpintero = {
        { tipos = { "Base.NailsBox", "Base.Nails" }, nombre = "una caja de clavos", salas = { "garage", "garagestorage", "shed", "toolstore" } },
        { tipos = { "Base.ScrewsBox", "Base.Screws", "Base.Nails" }, nombre = "tornillos", salas = { "garage", "toolstore", "shed" } },
        { tipos = { "Base.Hammer" }, nombre = "un martillo", salas = { "garage", "shed", "toolstore", "garagestorage" } },
        { tipos = { "Base.Saw", "Base.GardenSaw" }, nombre = "un serrucho", salas = { "shed", "garage", "toolstore" } },
        { tipos = { "Base.Woodglue", "Base.Glue" }, nombre = "pegamento para madera", salas = { "toolstore", "garage", "kitchen" } },
        { tipos = { "Base.Plank" }, nombre = "tablas buenas", salas = { "garage", "shed", "warehouse", "storageunit" } },
        { tipos = { "Base.Paintbrush", "Base.Hammer" }, nombre = "una brocha", salas = { "garage", "toolstore", "shed" } },
        { tipos = { "Base.Screwdriver" }, nombre = "un destornillador", salas = { "kitchen", "garage", "toolstore" } },
    },
    herrero = {
        { tipos = { "Base.MetalBar", "Base.MetalPipe" }, nombre = "barras de metal", salas = { "warehouse", "garagestorage", "garage", "storageunit" } },
        { tipos = { "Base.SheetMetal", "Base.SmallSheetMetal" }, nombre = "una plancha de metal", salas = { "warehouse", "garage", "shed" } },
        { tipos = { "Base.ScrapMetal", "Base.MetalPipe" }, nombre = "chatarra", salas = { "garage", "shed", "warehouse", "storageunit" } },
        { tipos = { "Base.BlowTorch", "Base.Hammer" }, nombre = "un soplete", salas = { "garage", "toolstore", "warehouse" } },
        { tipos = { "Base.WeldingMask", "Base.Hammer" }, nombre = "una mascara de soldar", salas = { "garage", "toolstore", "warehouse" } },
        { tipos = { "Base.Crowbar" }, nombre = "una palanca", salas = { "garage", "shed", "toolstore" } },
        { tipos = { "Base.LeadPipe", "Base.MetalPipe" }, nombre = "un tubo de plomo", salas = { "garage", "bathroom", "shed" } },
        { tipos = { "Base.Toolbox", "Base.Hammer" }, nombre = "una caja de herramientas", salas = { "garage", "garagestorage", "shed" } },
    },
    mecanico = {
        { tipos = { "Base.CarBattery1", "Base.CarBattery2", "Base.CarBattery3" }, nombre = "una bateria de auto", salas = { "garage", "garagestorage", "gasstore" } },
        { tipos = { "Base.Wrench" }, nombre = "una llave inglesa", salas = { "garage", "toolstore", "shed" } },
        { tipos = { "Base.Jack" }, nombre = "una gata", salas = { "garage", "garagestorage" } },
        { tipos = { "Base.LugWrench" }, nombre = "una llave de ruedas", salas = { "garage", "garagestorage", "gasstore" } },
        { tipos = { "Base.TirePump", "Base.Wrench" }, nombre = "un inflador", salas = { "garage", "gasstore", "shed" } },
        { tipos = { "Base.EmptyPetrolCan", "Base.PetrolCan" }, nombre = "un bidon", salas = { "garage", "shed", "gasstore" } },
        { tipos = { "Base.EngineParts", "Base.Screwdriver" }, nombre = "repuestos de motor", salas = { "garage", "garagestorage", "warehouse" } },
        { tipos = { "Base.Screwdriver" }, nombre = "un destornillador", salas = { "garage", "kitchen", "toolstore" } },
    },
    curandero = {
        { tipos = { "Base.Pills" }, nombre = "pastillas para el dolor", salas = { "pharmacy", "bathroom", "pharmacystorage" } },
        { tipos = { "Base.PillsVitamins", "Base.Pills" }, nombre = "vitaminas", salas = { "pharmacy", "kitchen", "grocery" } },
        { tipos = { "Base.Antibiotics", "Base.Pills" }, nombre = "antibioticos", salas = { "pharmacy", "pharmacystorage", "medicaloffice" } },
        { tipos = { "Base.Disinfectant", "Base.Bandage" }, nombre = "desinfectante", salas = { "bathroom", "pharmacy", "medicaloffice" } },
        { tipos = { "Base.Bandage" }, nombre = "vendas", salas = { "bathroom", "pharmacy", "medicaloffice" } },
        { tipos = { "Base.SutureNeedle", "Base.Bandage" }, nombre = "una aguja de sutura", salas = { "medicaloffice", "pharmacy", "bathroom" } },
        { tipos = { "Base.Tweezers", "Base.Bandage" }, nombre = "unas pinzas", salas = { "bathroom", "medicaloffice", "pharmacy" } },
        { tipos = { "Base.FirstAidKit", "Base.Bandage" }, nombre = "un botiquin", salas = { "bathroom", "kitchen", "medicaloffice" } },
    },
}

-- Como se nombra cada sala en el pedido.
K.RECADOS_LUGARES = {
    garage = "el garage de esa casa", garagestorage = "esa bodega del garage", shed = "ese galpon",
    toolstore = "esa ferreteria", warehouse = "esa bodega", storageunit = "esa bodega de alquiler",
    kitchen = "la cocina de esa casa", bathroom = "el bano de esa casa", bedroom = "esa pieza",
    livingroom = "el living de esa casa", pharmacy = "esa farmacia", pharmacystorage = "la bodega de esa farmacia",
    medicaloffice = "esa consulta", gasstore = "esa bencinera", grocery = "ese almacen",
}
K.RECADOS_RESPALDO = { "garage", "kitchen", "shed", "storageunit" }

-- Formas de pedirlo, con la voz de cada oficio. {cosa} y {lugar} se rellenan.
K.RECADOS_FRASES = {
    carpintero = {
        "Ayudame a buscar {cosa}. Estoy seguro de que en {lugar} hay. Te marque donde.",
        "Ando buscando {cosa}. Cuando pasamos por {lugar} me parecio ver. Trae lo que encuentres y quedamos a mano.",
        "Sin {cosa} no puedo terminar las paredes. Revisa {lugar}, que ahi tiene que haber.",
    },
    herrero = {
        "El fuego no espera. Necesito {cosa}: en {lugar} tiene que haber. Te marque la zona.",
        "Traeme {cosa}. Revisa {lugar}, la gente guardaba de todo ahi.",
        "Con {cosa} te hago maravillas. Busca en {lugar}.",
    },
    mecanico = {
        "Para que ande el motor me falta {cosa}. En {lugar} tiene que haber, estoy casi seguro.",
        "Si me traes {cosa}, el auto arranca. Busca en {lugar}. Te marque donde.",
        "Revisa {lugar}: ahi tiene que haber {cosa}. Sin eso no hago nada.",
    },
    curandero = {
        "Necesito {cosa} para los enfermos. En {lugar} quedaba algo, lo se.",
        "Nadie se acuerda de {cosa} hasta que le hace falta. Busca en {lugar}, por favor.",
        "Traeme {cosa}. Revisa {lugar}. Hay gente que depende de eso.",
    },
}

-- Arma un recado al azar. azar(n) devuelve 1..n.
function K.generarRecado(oficio, azar)
    local objetos = K.RECADOS_OBJETOS[oficio]
    local frases = K.RECADOS_FRASES[oficio]
    if objetos == nil or frases == nil or #objetos == 0 then return nil end
    local o = objetos[azar(#objetos)]
    local sala = o.salas[azar(#o.salas)]
    local lugar = K.RECADOS_LUGARES[sala] or "ese lugar"
    local frase = frases[azar(#frases)]
    local pedido = string.gsub(string.gsub(frase, "{cosa}", o.nombre), "{lugar}", lugar)
    return { corto = "buscar " .. o.nombre .. " en " .. lugar, pedido = pedido, salas = { sala },
        respaldo = K.RECADOS_RESPALDO, objeto = o.tipos, nombre = o.nombre }
end
K.RECADO_PEDIDO = "Quieres que la gente confie en ti? Ayudame con esto: "

-- Lo que forja el herrero con un mango (alternativas por si un tipo no existe).
K.FORJA = {
    { "Base.Machete" }, { "Base.Axe", "Base.WoodAxe" }, { "Base.Katana", "Base.Machete" },
    { "Base.SpearMachete", "Base.SpearKnife", "Base.Machete" }, { "Base.HandAxe", "Base.Axe" },
}

-- Quien es el del oficio en un campamento (perfil, nombre, texto de llegada).
function K.persona(oficio, contactoId)
    local o = K.OFICIOS[oficio]
    if o == nil then return nil end
    local propio = o.por_contacto ~= nil and o.por_contacto[contactoId] or nil
    return {
        perfil = propio ~= nil and propio.perfil or o.perfil,
        nombre = propio ~= nil and propio.nombre or o.nombre,
        llega = propio ~= nil and propio.llega or o.llega,
        titulo = o.titulo,
    }
end

-- Precio final de un articulo: base x lo que le falta o le sobra al campamento x descuento por
-- confianza. reservas = las del campamento (si no se pasan, se usa lo que valora de base).
function K.precio(articulo, contactoId, moneda, nivelConfianza, reservas)
    local gustos = K.GUSTOS[contactoId] or {}
    local g = tonumber(gustos[moneda]) or 1
    if type(reservas) == "table" and tonumber(reservas[moneda]) ~= nil then
        g = 0.5 + math.max(0, math.min(100, tonumber(reservas[moneda]))) / 100
    end
    local d = K.DESCUENTO[math.max(1, math.min(5, tonumber(nivelConfianza) or 1))] or 1
    return math.max(1, math.floor((tonumber(articulo.precio) or 1) * g * d + 0.5))
end

return K
