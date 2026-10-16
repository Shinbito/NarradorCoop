-- Narrador Co-op: campamentos de los misioneros (datos compartidos por servidor y cliente).
-- Cada misionero, una vez desbloqueado, tiene un campamento que sube de nivel. En cada nivel
-- llega alguien con un oficio que vende cosas a cambio de comida o municion:
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
    muldraugh = { municion = 0.6, comida = 1.3 },  -- el Cabo: militar, quiere balas
    westpoint = { municion = 1.1, comida = 0.8 },  -- la Chela: cocina para todos
    riverside = { municion = 1.2, comida = 0.7 },  -- el Padre Nacho: muchas bocas
    rosewood = { municion = 0.9, comida = 0.9 },   -- la Misia Rosa: compra de todo
}

-- Descuento por confianza con el misionero (nivel 1..5).
K.DESCUENTO = { 1, 1, 0.9, 0.8, 0.65 }

K.MONEDAS = {
    comida = "comida",
    municion = "municion (cajas, o 10 balas sueltas)",
}

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
