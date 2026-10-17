-- Narrador Co-op: datos de "la base de Sous viva" (los usa server/Narrador/NarradorSousBase.lua).
-- Muebles (sprites del juego verificados en newtiledefinitions.tiles), items y las frases de cartas.
-- Textos sin tildes ni enies a proposito.

Narrador = Narrador or {}
Narrador.Charlas = Narrador.Charlas or {}

local D = Narrador.SousBaseDefs or {}
Narrador.SousBaseDefs = D

-- Mesa grande de roble oscuro (2 casillas en fila, mira al sur): grilla 0,0 y 1,0.
D.MESA = { "furniture_tables_high_01_0", "furniture_tables_high_01_1" }
-- Sillas de madera oscura. Facing = hacia donde mira el que se sienta (A-Life lo lee de la propiedad
-- Facing de los sprites "furniture_seating_*": ALifeModuleIdleLife.seatFacing).
D.SILLA = { S = "furniture_seating_indoor_02_0", E = "furniture_seating_indoor_02_1",
    N = "furniture_seating_indoor_02_2", W = "furniture_seating_indoor_02_3" }
-- Sillas alrededor de una mesa que empieza en (0,0) y sigue en (1,0): dx, dy, hacia donde miran.
D.PUESTOS = {
    { 0, -1, "S" }, { 1, 1, "N" }, { -1, 0, "E" }, { 2, 0, "W" }, { 1, -1, "S" }, { 0, 1, "N" },
}
-- Saco de dormir rojo a cuadros (2 casillas en fila, mira al sur): grilla 0,0 y 1,0.
D.SACOS = {
    { "camping_02_4", "camping_02_5" },   -- rojo a cuadros
    { "camping_02_12", "camping_02_13" }, -- azul a cuadros
}
D.BARAJA = "Base.CardDeck"
D.GENERADOR = { "Base.Generator", "Base.Generator_Yellow" }
D.AGUA = "Base.WaterDispenserBottle" -- bidon de 15 litros (FluidContainer)
D.BIDONES = 4

D.RADIO_MESA = 8        -- la mesa queda a lo mas a 8 casillas del punto de la base (la correa es 12)
D.RADIO_SACOS = 14
D.RADIO_GENERADOR = 14
D.MAX_SILLAS = 12
D.MIN_SILLAS = 4
D.CERCA = 45            -- alguien tiene que estar a esta distancia para amueblar
D.RELLENO_HORAS = 12    -- cada cuanto se rellena el estanque del generador
D.REINTENTO_HORAS = 0.5 -- si no hubo espacio o la zona no estaba cargada

-- Frases en la mesa (cartas). Brisca, truco, carioca, escoba: se juega lo que hay.
Narrador.Charlas.sous_cartas = {
    { "martin_a", "Ya cabros, una brisca rapida y despues a la guardia. Rapida dije." },
    { "martin_a", "Anoto los puntos yo. No, no confio en ninguno de ustedes." },
    { "martin_a", "Esa no vale, wn. Se te vio la carta, mi bro." },
    { "martin_z", "Truco." },
    { "martin_z", "Quiero retruco. Y no, no estoy bluffeando. O si." },
    { "martin_z", "Calcule las probabilidades. Pierdes igual, pero con estilo." },
    { "benjamin", "Bro, quien barajo? Me llegaron puras cartas chicas, hermano." },
    { "benjamin", "Si gano esta, me toca la cama buena. Dale, apuesta." },
    { "benjamin", "Envido! Bueno, no tengo nada, pero envido igual, bro." },
    { "david", "Interesante. El que pierde siempre es el que mas habla. Hay datos." },
    { "david", "Paso. Me reservo para la otra mano." },
    { "bastian", "Oe, el as de oro es mio, loco. Respeten." },
    { "bastian", "Juego bien vestido y gano bien vestido, po." },
    { "hanz", "Broder, en Iquique esto se juega con apuesta. Pongan una lata, vale." },
    { "hanz", "Esa no vale, wn! Tiraste dos cartas juntas, broder." },
    { "cristian", "Compadre, mire esta mano. Akkakaka. No, no la mire." },
    { "cristian", "Carioca! Ah, no, estamos jugando brisca. Igual gane." },
    { "jorge", "Manito, los numeros no mienten: llevas tres manos perdidas." },
    { "jorge", "Cuenta bien los puntos, que despues alegan." },
    { "cristobal", "Hermanito, me falta una pa la escoba. Me pasai una? Ya, no." },
    { "cristobal", "Quien se comio las cartas buenas, wn? Esto esta arreglado." },
    { "maulen", "Juego callado. El que habla pierde." },
}

return D
