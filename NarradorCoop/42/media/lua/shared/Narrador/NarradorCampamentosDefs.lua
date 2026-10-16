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

-- Lo que valora cada campamento: multiplica el precio si pagas con eso (menos de 1 = barato,
-- porque es lo que quieren juntar; mas de 1 = caro, porque ya les sobra).
K.GUSTOS = {
    muldraugh = { municion = 0.6, comida = 1.3, abrigo = 1.0, medicina = 0.9 },  -- el Cabo: militar, quiere balas
    westpoint = { municion = 1.1, comida = 0.8, abrigo = 1.0, medicina = 1.0 },  -- la Chela: cocina para todos
    riverside = { municion = 1.2, comida = 0.8, abrigo = 0.7, medicina = 0.7 },  -- el Padre Nacho: enfermos y frio
    rosewood = { municion = 0.9, comida = 0.9, abrigo = 1.1, medicina = 1.0 },   -- la Misia Rosa: compra de todo
}

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

-- Precio final de un articulo: base x gusto del campamento x descuento por confianza.
function K.precio(articulo, contactoId, moneda, nivelConfianza)
    local gustos = K.GUSTOS[contactoId] or {}
    local g = tonumber(gustos[moneda]) or 1
    local d = K.DESCUENTO[math.max(1, math.min(5, tonumber(nivelConfianza) or 1))] or 1
    return math.max(1, math.floor((tonumber(articulo.precio) or 1) * g * d + 0.5))
end

return K
