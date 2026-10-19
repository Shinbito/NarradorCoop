-- Historia principal, capitulos 2 a 4: Sous y Meulen Canupan.
-- Se abre sola cuando terminan los Bell (capitulo 1).
--
--   Cap. 2 "Sous": llegas a la base y les haces dos encargos. El tercero te lo da Meulen
--          Canupan, uno de los suyos: es una trampa para alejarte mientras se roba todo.
--          Pistas -> lugar abandonado lleno de zombis -> escondite -> ir solo o con gente de
--          Sous -> pelea -> quedarte con todo o devolverlo.
--          Sous queda como faccion de A-Life amiga o enemiga segun lo que elijas.
--   Cap. 3 "La guerra con Sous" (solo si quedaron enemigos): hay que acabar con todos.
--   Cap. 4 "El arsenal": si son amigos te lo encargan ellos; si no, lo encuentras en su base.
--          Premio a eleccion: arma, traje o auto legendario.
--
-- Textos sin tildes a proposito (ver nota en FamiliaInfectada.lua).

require "Narrador/NarradorDefs"

Narrador.Facciones = Narrador.Facciones or {}

-- La faccion Sous en A-Life, con sus integrantes (nombres fijos).
-- "respaldo": perfil normal de A-Life (hombre, amistoso) que se usa si por algun motivo
-- A-Life no acepto el perfil propio; igual nace con el nombre de Sous.
-- Stats de A-Life (1 a 10, vida hasta 200): Sous esta bien entrenado.
-- Aspecto de los que tienen foto (ver Mundo.crearFaccion): colores "r,g,b" de 0 a 1.
local PELO_OSCURO, NEGRO = "0.10,0.07,0.05", "0.09,0.09,0.10"

-- Meulen Canupan (apellido mapuche): piel morena, pelo largo con trarilonco (cintillo rojo
-- anudado), chaleco de tejido con rombos, trapelacucha (collar largo de plata) y botas de cuero.
-- Igual en Sous.lua (narrador_sous_10, narrador_maulen_banda) y Bandido.lua (narrador_pereira_maulen).
local MAULEN_ASPECTO = { piel = 3, pelo = "Grungey", color_pelo = "0.05,0.04,0.04" }
local MAULEN_ROPA = { Hat = "Base.Hat_BandanaTiedTINT", Top = "Base.Tshirt_DefaultTEXTURE_TINT", Jacket = "Base.Jumper_DiamondPatternTINT",
                      LongNecklace = "Base.NecklaceLong_Silver", Pants = "Base.Trousers_DefaultTEXTURE_TINT", Shoes = "Base.Shoes_HideBoots" }
local MAULEN_TINTES = { Hat = "0.65,0.08,0.08", Top = "0.10,0.09,0.09", Jacket = "0.45,0.10,0.10", Pants = "0.22,0.16,0.11" }

local STATS_SOUS = { healthHP = 160, strength = 10, endurance = 10, awareness = 10, aiming = 9, aimZombiePercent = 100 }

Narrador.Facciones.narrador_sous = {
    id = "narrador_sous",
    version = 6,
    nombre = "Sous",
    descripcion = "Grupo de sobrevivientes de amigos que se juntaban a jugar a la pelota y al LoL.",
    postura = "friendly",
    stats = STATS_SOUS,
    -- La banda de Meulen es otra faccion: se odian (antes Meulen salia como Sous y su banda
    -- como otra faccion, y terminaban matandose entre ellos).
    relaciones = { narrador_banda_maulen = "hostile" },
    miembros = {
        { id = "narrador_sous_01", respaldo = "k93_hensley_family_01", nombre = "Martin Akagami", rol = "Lider", arma = "Base.Shotgun", cuerpo = "Base.Machete",
          -- Overol de obrero, casco, antiparras, pasamontanas y chaleco reflectante: solo se le ve la cara.
          aspecto = { piel = 1, pelo = "Short", color_pelo = PELO_OSCURO },
          ropa = { Hat = "Base.Hat_HardHat", Eyes = "Base.Glasses_SafetyGoggles", Mask = "Base.Hat_BalaclavaFace",
                   Top = "Base.Boilersuit_BlueRed", Pants = "none", Vest = "Base.Vest_HighViz",
                   Hands = "Base.Gloves_LeatherGloves", Shoes = "Base.Shoes_WorkBoots" } },
        { id = "narrador_sous_02", respaldo = "k93_vfd_01", nombre = "Martin Zent", rol = "Analista", arma = "Base.HuntingRifle", cuerpo = "Base.Crowbar",
          -- Pelo crespo, polera verde con estampado, pantalon negro y pulsera.
          aspecto = { piel = 1, pelo = "MessyCurly", color_pelo = PELO_OSCURO },
          ropa = { Top = "Base.Tshirt_DefaultDECAL_TINT", Pants = "Base.Trousers_DefaultTEXTURE_TINT",
                   RightWrist = "Base.Bracelet_RightFriendshipTINT", Shoes = "Base.Shoes_BlackBoots" },
          tintes = { Top = "0.13,0.27,0.18", Pants = NEGRO, RightWrist = NEGRO } },
        { id = "narrador_sous_03", respaldo = "k93_red_cross_01", nombre = "Benjamin Matric", rol = "Informatico", arma = "Base.Pistol", cuerpo = "Base.BaseballBat",
          -- Pelo crespo, lentes, polera negra ajustada, buzo gris, mochila verde y reloj.
          aspecto = { piel = 1, pelo = "MessyCurly", color_pelo = PELO_OSCURO },
          ropa = { Eyes = "Base.Glasses_Normal", Top = "Base.Tshirt_DefaultTEXTURE_TINT", Pants = "Base.Trousers_DefaultTEXTURE_TINT",
                   Back = "Base.Bag_ALICEpack_Army", LeftWrist = "Base.WristWatch_Left_DigitalBlack", Shoes = "Base.Shoes_TrainerTINT" },
          tintes = { Top = NEGRO, Pants = "0.62,0.62,0.62", Shoes = NEGRO } },
        { id = "narrador_sous_04", respaldo = "k93_truckstop_01", nombre = "David Shinbo", rol = "Sociologo", arma = "Base.Pistol", cuerpo = "Base.Axe",
          -- Pelo oscuro desordenado, polera blanca, jeans y reloj negro.
          aspecto = { piel = 1, pelo = "Messy", color_pelo = PELO_OSCURO },
          ropa = { Top = "Base.Tshirt_WhiteTINT", Pants = "Base.Trousers_Denim", LeftWrist = "Base.WristWatch_Left_ClassicBlack",
                   Shoes = "Base.Shoes_TrainerTINT" },
          tintes = { Top = "0.95,0.95,0.95", Shoes = "0.90,0.90,0.90" } },
        { id = "narrador_sous_05", respaldo = "k93_hensley_family_06", nombre = "Bastian Tati", rol = "Enlace", arma = "Base.Pistol", cuerpo = "Base.HuntingKnife",
          -- Pelo crespo, lentes de sol, polera negra, pantalon cafe, reloj y pulsera roja.
          aspecto = { piel = 1, pelo = "MessyCurly", color_pelo = PELO_OSCURO },
          ropa = { Eyes = "Base.Glasses_Sun", Top = "Base.Tshirt_DefaultTEXTURE_TINT", Pants = "Base.Trousers_DefaultTEXTURE_TINT",
                   LeftWrist = "Base.WristWatch_Left_DigitalBlack", RightWrist = "Base.Bracelet_RightFriendshipTINT",
                   Shoes = "Base.Shoes_TrainerTINT" },
          tintes = { Top = NEGRO, Pants = "0.36,0.24,0.15", RightWrist = "0.70,0.10,0.10", Shoes = NEGRO } },
        { id = "narrador_sous_06", respaldo = "k93_muldraugh_pd_02", nombre = "Hanz Walita", rol = "Artesano", arma = "Base.Shotgun", cuerpo = "Base.Nightstick",
          -- Pelo oscuro hacia el lado, barba completa, aro y polera negra.
          aspecto = { piel = 1, pelo = "LeftParting", color_pelo = PELO_OSCURO, barba = "Full", color_barba = PELO_OSCURO },
          ropa = { Ears = "Base.Earring_LoopSmall_Silver_Both", Top = "Base.Tshirt_DefaultTEXTURE_TINT", Pants = "Base.Trousers_Black",
                   Shoes = "Base.Shoes_BlackBoots" },
          tintes = { Top = NEGRO } },
        { id = "narrador_sous_07", respaldo = "k93_truckstop_03", nombre = "Cristian Cristonks", rol = "Piloto", arma = "Base.Revolver", cuerpo = "Base.Hammer",
          -- Ropa de ski: casco blanco, antiparras azules, cuello tapado, parka negra y guantes.
          aspecto = { piel = 1, pelo = "Short", color_pelo = PELO_OSCURO },
          ropa = { Hat = "Base.Hat_CrashHelmet", Eyes = "Base.Glasses_SkiGoggles", Mask = "Base.Hat_BalaclavaFace",
                   Jacket = "Base.Jacket_Padded", Pants = "Base.Trousers_Padded", Hands = "Base.Gloves_LeatherGlovesBlack",
                   Shoes = "Base.Shoes_BlackBoots" },
          tintes = { Hat = "0.92,0.92,0.92", Jacket = NEGRO, Pants = NEGRO } },
        { id = "narrador_sous_08", respaldo = "k93_prather_02", nombre = "Jorge Hasag", rol = "Intendente", arma = "Base.HuntingRifle", cuerpo = "Base.Machete",
          -- Ropa de ski: casco negro, antiparras azules, cuello tapado, parka verde claro, guantes cafe y pantalon oscuro.
          aspecto = { piel = 1, pelo = "Short", color_pelo = PELO_OSCURO },
          ropa = { Hat = "Base.Hat_CrashHelmet", Eyes = "Base.Glasses_SkiGoggles", Mask = "Base.Hat_BalaclavaFace",
                   Jacket = "Base.Jacket_Padded", Pants = "Base.Trousers_Padded", Hands = "Base.Gloves_LeatherGlovesBrown",
                   Shoes = "Base.Shoes_HikingBoots" },
          tintes = { Hat = NEGRO, Jacket = "0.66,0.66,0.55", Pants = "0.15,0.17,0.20" } },
        { id = "narrador_sous_09", respaldo = "k93_county_ems_01", nombre = "Cristobal Wertres", rol = "Ingeniero", arma = "Base.Pistol", cuerpo = "Base.Crowbar",
          -- Pelo corto oscuro, poleron negro, jeans y bolso cruzado.
          aspecto = { piel = 1, pelo = "Fresh", color_pelo = PELO_OSCURO },
          ropa = { Top = "Base.Tshirt_DefaultTEXTURE_TINT", Jacket = "Base.HoodieDOWN_WhiteTINT", Pants = "Base.Trousers_Denim",
                   Shoes = "Base.Shoes_TrainerTINT" },
          tintes = { Top = NEGRO, Jacket = "0.17,0.17,0.18", Shoes = NEGRO } },
        { id = "narrador_sous_10", respaldo = "k93_truckstop_06", nombre = "Meulen Canupan", rol = "Encargado del deposito", arma = "Base.Pistol", cuerpo = "Base.Machete",
          aspecto = MAULEN_ASPECTO, ropa = MAULEN_ROPA, tintes = MAULEN_TINTES },
    },
}

-- Meulen ya traidor y los matones que junto. Todos de la misma faccion, asi no se pelean
-- entre ellos, y enemigos de Sous y de los jugadores.
Narrador.Facciones.narrador_banda_maulen = {
    id = "narrador_banda_maulen",
    version = 3,
    nombre = "Banda de Meulen",
    descripcion = "Los matones que junto Meulen Canupan despues de robarle a Sous.",
    postura = "hostile",
    desconocidos = "hostile",
    relaciones = { narrador_sous = "hostile" },
    stats = { healthHP = 90, strength = 7, endurance = 7, awareness = 7, aiming = 6 },
    miembros = {
        { id = "narrador_maulen_banda", respaldo = "narrador_sous_10", nombre = "Meulen Canupan", rol = "Traidor", arma = "Base.Pistol", cuerpo = "Base.Machete",
          stats = { healthHP = 200, strength = 8, endurance = 9, awareness = 9, aiming = 8 },
          aspecto = MAULEN_ASPECTO, ropa = MAULEN_ROPA, tintes = MAULEN_TINTES },
        { id = "narrador_banda_01", nombre = "Maton", rol = "Banda de Meulen", nombre_al_azar = true, arma = "Base.Shotgun", cuerpo = "Base.BaseballBat" },
        { id = "narrador_banda_02", nombre = "Maton", rol = "Banda de Meulen", nombre_al_azar = true, arma = "Base.Pistol", cuerpo = "Base.Crowbar" },
        { id = "narrador_banda_03", nombre = "Maton", rol = "Banda de Meulen", nombre_al_azar = true, arma = "Base.HuntingRifle", cuerpo = "Base.HuntingKnife" },
        { id = "narrador_banda_04", nombre = "Maton", rol = "Banda de Meulen", nombre_al_azar = true, arma = "Base.Pistol", cuerpo = "Base.Machete" },
        { id = "narrador_banda_05", nombre = "Maton", rol = "Banda de Meulen", nombre_al_azar = true, arma = "Base.Revolver", cuerpo = "Base.Hammer" },
        { id = "narrador_banda_06", nombre = "Maton", rol = "Banda de Meulen", nombre_al_azar = true, arma = "Base.Shotgun", cuerpo = "Base.Axe" },
        { id = "narrador_banda_07", nombre = "Maton", rol = "Banda de Meulen", nombre_al_azar = true, arma = "Base.Pistol", cuerpo = "Base.BaseballBat" },
    },
}

local SOUS = "sous"
local BASE = "base_sous"

-- Donde esta la base de Sous segun el pueblo mas cercano a quien empieza la historia.
Narrador.SousBases = {
    ["Muldraugh"] = { x = 11612, y = 8844, z = 0, etiqueta = "la bodega del lado norte de Muldraugh" },
    ["West Point"] = { x = 10095, y = 6650, z = 0, etiqueta = "la base de Sous en West Point" },
    ["Riverside"] = { x = 7335, y = 6244, z = 0, etiqueta = "la base de Sous en Riverside" },
    ["Rosewood"] = { x = 8046, y = 12032, z = 0, etiqueta = "la base de Sous en Rosewood" },
}

-- Sous en su base: inmortales, con el dano al maximo (para los pocos zombis que lleguen) y
-- adentro del edificio (correa corta). Cuando la base esta amueblada, cada uno tiene su silla en
-- la mesa como puesto y A-Life los sienta (server/Narrador/NarradorSousBase.lua).
local BASE_NPC = { modo = "guard", radio_grupo = 4, correa = 12, inmortales = true,
    banderas = { health = 200, damageOutput = 300 } }
local BANDERAS_BASE = { persistent = true, invulnerable = true, stationary = false, leashRadius = 12,
    health = 200, damageOutput = 300 }

local function enBase(spec)
    for k, v in pairs(BASE_NPC) do if spec[k] == nil then spec[k] = v end end
    return spec
end

-- Los que estan en la base cuando llegas (todos, Meulen incluido).
local EN_LA_BASE = {
    { "martin_a", "narrador_sous_01" }, { "martin_z", "narrador_sous_02" }, { "benjamin", "narrador_sous_03" },
    { "david", "narrador_sous_04" }, { "bastian", "narrador_sous_05" }, { "hanz", "narrador_sous_06" },
    { "cristian", "narrador_sous_07" }, { "jorge", "narrador_sous_08" }, { "cristobal", "narrador_sous_09" },
    { "maulen", "narrador_sous_10" },
}
local RECOLECTORES = { { "cristian", "narrador_sous_07" }, { "jorge", "narrador_sous_08" } }
-- En la guerra: Bastian, Cristian y Jorge salen a cazarte; el resto defiende la base.
local CAZADORES = { { "bastian", "narrador_sous_05" }, { "cristian", "narrador_sous_07" }, { "jorge", "narrador_sous_08" } }
local DEFENSORES = {
    { "martin_a", "narrador_sous_01" }, { "martin_z", "narrador_sous_02" }, { "benjamin", "narrador_sous_03" },
    { "david", "narrador_sous_04" }, { "hanz", "narrador_sous_06" }, { "cristobal", "narrador_sous_09" },
}

-- ---------------------------------------------------------------------------
-- Como habla cada uno. Dialogos originales, escritos con su forma de hablar.
-- Sin tildes ni enies a proposito.
--   Martin Akagami: lider, de Maipu. Serio casi siempre, chistes secos. Calistenia, pelota, LoL.
--                   Dice "cabros", "mi bro", "mi sangre". Le gusta ordenar y armar listas.
--   Martin Zent: reservado y analitico. Sarcastico y molestoso, frases cortas. Yunta de Akagami y Walita.
--   Benjamin Matric: se dice ansioso social pero no para de hablar. Carretero, gym, calistenia,
--                    ingeniero informatico. Jote: siempre pensando en mujeres y en el proximo carrete.
--                    "Bro", "hermano", "apano", "dale".
--   David Shinbo: sociologo, introvertido, directo. Pelota y calistenia. Yunta de Tati y de Zent.
--   Bastian Tati: gym, pelota, ingeniero informatico. Carismatico, siempre bien vestido. "Oe", "po", "loco".
--   Hanz Walita: nortino, chistoso, artesano. "Broder", "vale". Tercero del grupito con Aka y Zent.
--                Nacio en Iquique y vivio ahi con su primo Waton Ju hasta los 12; despues se fue a
--                Arica, donde tenia su taller. Nunca vivio en Antofagasta.
--   Cristian Cristonks: piloto de aviones, extrovertido, primo de Hasag. Ama la montana con nieve.
--   Jorge Hasag: ingeniero comercial, gym, simpatico. "Broder", "sangre", "manito". Yunta de Matric.
--   Cristobal Wertres: 1.96, ingeniero, deportista, fan de Cristiano. Buena persona, carinoso
--                      ("hermanito", "sangre"), frases cortas con "wn". Fanatico de la tecnologia.
--                      Hace dupla con David Shinbo.
--   Meulen Canupan: mapuche, del sur, cerca de Temuco. Encargado del deposito. Educado y callado;
--                    siente que Sous nunca lo tomo en cuenta y les guarda rencor, pero lo disimula.
--                    Usa algunas palabras en mapudungun (mari mari, peni, chaltu may, feley, pewkallal).
--                    Come siempre lo mismo: atun con lechuga. Fuma marihuana desde los 10 anos y
--                    se escapa a fumar solo detras del galpon. Antes del colapso lo buscaba la PDI
--                    como testigo de un homicidio y nunca se presento: sabe desaparecer.
-- ---------------------------------------------------------------------------

Narrador.Charlas = Narrador.Charlas or {}

-- ===========================================================================
-- Antes de la traicion (Meulen todavia es parte de Sous)
-- ===========================================================================

-- En la base, el dia a dia.
Narrador.Charlas.sous_base = {
    { "martin_a", "Cabros, la guardia de la noche no se negocia. El que se queda dormido, lava." },
    { "martin_a", "Esto es como una ranked mala: se pierde una pelea, no la partida." },
    { "martin_a", "Diez dominadas antes de cada turno. El fin del mundo no nos saca la rutina." },
    { "martin_a", "Ya arme los turnos. Nadie los va a respetar, pero quedaron bonitos." },
    { "martin_a", "En Maipu habia una plaza con barras. Daria cualquier cosa por una tarde ahi, mi bro." },
    { "martin_z", "Hice un inventario. Tenemos tres latas y mucha fe. La fe no se come." },
    { "martin_z", "Su apocalipsis. Su lluvia. Su suerte." },
    { "martin_z", "Walita, si sigues tallando palitos te voy a nombrar ministro de defensa." },
    { "martin_z", "Akagami hizo otra lista. Ya van once. Yo las colecciono." },
    { "benjamin", "Bro, yo con gente nueva me pongo nervioso. Igual hablo harto, ya se." },
    { "benjamin", "Apenas tengamos comida de sobra, asado. No me importa el fin del mundo, hermano." },
    { "benjamin", "Oe, si en tus salidas ves un grupo con chicas simpaticas, me avisas. Por la comunidad." },
    { "benjamin", "Sin gym hago flexiones con la mochila llena. Algo es algo, bro." },
    { "david", "Fijate como se reparten los roles sin que nadie los decida. Es de libro." },
    { "david", "No me gusta mucho salir. Antes por la gente. Ahora por los muertos. Es parecido." },
    { "david", "Si sobra tiempo, propongo un partido. Tres contra tres, en el patio." },
    { "david", "Llevo un cuaderno con todo lo que pasa aca. Algun dia alguien lo va a querer leer." },
    { "bastian", "Oe, el fin del mundo no es excusa pa andar con la polera al reves." },
    { "bastian", "Cuando esto se calme organizo un partido. Ustedes ponen la excusa, yo la pelota." },
    { "bastian", "Encontre una chaqueta de cuero en perfecto estado. El apocalipsis tiene sus cosas buenas, loco." },
    { "hanz", "Vale broder, aca no sobra nada, pero buena onda hay pa regalar." },
    { "hanz", "Alla en el norte el sol te mata. Aca te matan otras cosas. Uno elige, wn." },
    { "hanz", "Te tallo un amuleto pa la suerte. No funciona, pero queda bonito." },
    { "cristian", "Desde el cerro de atras se ve todo el valle. Si quieres te llevo un dia, compadre." },
    { "cristian", "Extrano volar. Alla arriba no hay ruido. Ni muertos." },
    { "cristian", "El primo dice que yo hablo mucho. Yo digo que el calcula mucho. Estamos a mano." },
    { "jorge", "Que tal broder. Yo llevo las cuentas aca. Bueno, las cuentas que no lleva Meulen." },
    { "jorge", "Todo es oferta y demanda, manito. Hoy la oferta es cero y la demanda es todo." },
    { "jorge", "Con el Benja entrenamos en la manana. Te sumas cuando quieras, sangre." },
    { "cristobal", "Wn. Con mi altura me ven a una cuadra. Ventaja: yo tambien los veo." },
    { "cristobal", "Hay que seguir entrenando, hermanito. El cuerpo es lo unico que no nos pueden quitar." },
    { "cristobal", "Si encuentro un panel solar armo algo. Lo que sea. Extrano las pantallas, wn." },
    { "martin_z", "No hablo mucho. Ahorro energia. Alguien tiene que ser eficiente aca." },
    { "martin_z", "Akagami dice que soy pesimista. Yo digo que estoy bien informado." },
    { "david", "Me gusta la guardia de noche. Es silenciosa. Nadie te habla." },
    { "david", "Con el Tati jugabamos a la pelota todos los domingos. Extrano los domingos." },
    { "benjamin", "Hermano, alguien vio mi botella de proteina? Estaba vacia, pero era mia." },
    { "benjamin", "Programaba apps antes de esto, bro. Ahora programo turnos de guardia." },
    { "benjamin", "El Jorge y yo vamos a abrir un gym cuando esto termine. 'Sous Fit'. Ya tengo el logo." },
    { "benjamin", "Bro, si el fin del mundo trae sobrevivientes solteras, yo me ofrezco de comite de bienvenida." },
    { "benjamin", "Hermano, llevo tres semanas sin carrete. Tres. Esto es peor que los zombis." },
    { "benjamin", "Antes de todo esto tenia tres matches pendientes, bro. Ahora tengo cero matches y una pala." },
    { "benjamin", "Yo no soy jote, hermano. Soy sociable con enfasis en las mujeres. Es distinto." },
    { "benjamin", "Escuche una voz de mujer en la radio, bro. Una voz. Y ya me enamore. Toque fondo, hermano." },
    { "jorge", "Cuando esto termine pongo una empresa de supervivencia. Seria millonario, manito." },
    { "jorge", "El primo se fue a mirar el cerro otra vez. Yo me quedo con los numeros." },
    { "cristobal", "Hice una lista de lo que hay que arreglar en la base, wn. Es larga." },
    { "cristobal", "Con el Shinbo tenemos un saludo secreto. No te lo puedo mostrar, hermanito." },
    { "hanz", "En Arica tenia mi tallercito. Vendia llaveros a los turistas. Ahora no hay turistas, broder." },
    { "hanz", "Naci en Iquique, broder. Hasta los doce anduve pa todos lados con el primo, el Waton Ju." },
    { "hanz", "El Waton Ju nunca llego a nivel 70 pa jugar DZ en PXG. Se lo recuerdo cada vez que puedo, vale." },
    { "hanz", "El Aka es serio, el Zent es pesado y yo soy el lindo del grupo. Equilibrio." },
    { "hanz", "Le estoy tallando un ajedrez al grupo. Ya tengo los peones. Faltan como treinta piezas." },
    { "cristian", "Primo, deja los numeros un rato. Sube conmigo al cerro, hay que ver la zona." },
    { "cristian", "En el aeropuerto deciamos: el que no mira el cielo, no vuela. Aca el que no mira el suelo, se muere." },
    { "cristian", "Igual, igual. Lo que digan ustedes, compadre." },
    -- La talla eterna de Sous: que los primos Cristonks y Hasag "se comen" y que por eso se
    -- van tanto juntos a la nieve. Matric es el que mas sospecha.
    { "benjamin", "Yo no digo nada, pero los primos se fueron solos al cerro otra vez. Otra vez, bro." },
    { "benjamin", "Mucha nieve, mucha nieve. Yo creo que en ese cerro no hace tanto frio, bro." },
    { "benjamin", "Hasag, sangre, tu primo te mira raro cuando cuentas latas. Te lo digo como amigo." },
    { "benjamin", "Una carpa para dos en la nieve. Para ahorrar calor, dicen. Ya, claro, bro." },
    { "jorge", "Matric, por ultima vez: es mi PRIMO. Subimos al cerro a mirar la zona, manito." },
    { "jorge", "Cada vez que vuelvo del cerro con el primo, Matric me hace la misma cara. Basta, sangre." },
    { "cristian", "Que se comen, que se comen... Somos primos, wn. Bueno, primos lejanos. Igual no." },
    { "cristian", "En la nieve uno se abraza para no morir congelado, compadre. Es supervivencia." },
    { "martin_z", "Estadisticamente, ningun primo va tanto a la nieve con otro primo. Solo digo." },
    { "martin_a", "Ya, dejen tranquilos a los primos. Cuando se casen, los padrinos los elijo yo, mi bro." },
    { "hanz", "Le estoy tallando una figurita a los primos. Los dos juntitos en el cerro, broder." },
    { "bastian", "Oe, primos, la proxima vez que suban al cerro avisen. Pa no interrumpir, po." },
    { "david", "Los primos no se comen. Pero si se comen, que se coman en paz." },
    { "cristobal", "Hermanito, yo los vi volver del cerro con la misma chaqueta. Wn." },
}

-- Lo que dicen de Meulen sin darse cuenta de nada (algunos son pistas).
Narrador.Charlas.sous_maulen = {
    { "martin_a", "Meulen, te toca la olla otra vez. No pongas esa cara, alguien tiene que hacerlo." },
    { "martin_a", "Meulen es callado, pero cumple. Eso es lo que importa." },
    { "martin_z", "Meulen anda callado. Bueno, siempre anda callado. O esta tramando algo. Broma." },
    { "martin_z", "Le pregunte a Meulen cuantas latas quedan. Me dijo 'suficientes'. Que respuesta es esa?" },
    { "martin_z", "Meulen come atun con lechuga todos los dias. Le ofreci otra cosa una vez. Me miro como si lo hubiera insultado." },
    { "martin_z", "Meulen siempre se sienta mirando la puerta. Como el que espera una visita que no quiere." },
    { "benjamin", "Oe Meulen, sonrie un poco, hermano! Pareces guardia de banco." },
    { "benjamin", "Meulen no se ha reido de ningun chiste mio. Ni uno, bro. Ni de los buenos." },
    { "benjamin", "Bro, detras del galpon siempre hay olor a hierba. Y siempre a la hora en que desaparece Meulen. Coincidencia, hermano." },
    { "david", "Meulen no se integra mucho. O nosotros no lo integramos. Es una buena pregunta." },
    { "david", "Nadie le pregunta nada a Meulen. Nunca. Lo anote ayer y me quede pensando." },
    { "david", "Meulen se va a fumar solo todas las tardes. Nadie lo acompana. Tambien lo anote." },
    { "david", "Una vez Meulen dijo que antes lo buscaba la policia. Despues dijo que era broma. No sonaba a broma." },
    { "bastian", "Meulen nunca quiere jugar a la pelota. Bueno, tampoco lo invitamos mucho, loco." },
    { "hanz", "Meulen me pidio una gubia prestada. Pa que querra una gubia, broder?" },
    { "hanz", "Le voy a tallar una lata de atun al Meulen pa su cumple. Es lo unico que le gusta, broder." },
    { "cristian", "Meulen se sabe todos los caminos de la zona. Raro, si casi nunca sale." },
    { "jorge", "Las cuentas del deposito las lleva Meulen. Yo igual las reviso, por si acaso, manito." },
    { "jorge", "Raro, manito: Meulen come atun todos los dias y el atun nunca baja en el inventario." },
    { "cristobal", "Meulen es buena onda, wn. Medio serio no mas. Hay que incluirlo mas, hermanito." },
}

-- Meulen al principio: amable, educado... con algo raro.
Narrador.Charlas.maulen_piola = {
    { "maulen", "Mari mari, peni. Bienvenido a Sous. Bueno... a lo que Sous llama hogar." },
    { "maulen", "Yo me encargo del deposito. Alguien tiene que contar las latas mientras los demas juegan a la pelota." },
    { "maulen", "Akagami es un gran lider. Eso dice el, al menos." },
    { "maulen", "Tranquilo, aca todos somos amigos. Todos." },
    { "maulen", "Si necesitas algo del deposito, pidemelo a mi. Yo se donde esta todo. Todo." },
    { "maulen", "Mi chuchu decia que uno es de la tierra, no la tierra de uno. Aca todo parece ser de Akagami." },
    { "maulen", "Atun con lechuga. Todos los dias. No necesito mas, peni. Nunca he necesitado mas." },
    { "maulen", "Si sientes olor raro detras del galpon, no es nada. Es mi rato de paz." },
    { "maulen", "Fumo desde los diez. Mi tio decia que me iba a quedar tonto. Mirame: le llevo el inventario a todos." },
    { "maulen", "Antes de todo esto me buscaba la PDI. No por algo que hice. Por algo que vi... Broma, peni. Broma." },
}

-- Meulen despues del primer encargo: se le empiezan a notar las grietas.
Narrador.Charlas.maulen_grietas = {
    { "maulen", "Dos encargos y ya te quieren mas que a mi. Me alegro por ti, en serio." },
    { "maulen", "Cuando yo traje comida, nadie hizo fiesta. Pero bueno, no importa." },
    { "maulen", "Nunca me eligen pa la pelota. Ni pa la guardia buena. Siempre el deposito." },
    { "maulen", "Chaltu may por ayudar. Ellos nunca dan las gracias, ya te vas a dar cuenta." },
    { "maulen", "El Zent hace chistes. Algunos dan risa. Otros no." },
    { "maulen", "Feley... el invierno va a ser largo. Hay que pensar en uno mismo, peni." },
    { "maulen", "El Benja hizo asado y a mi me guardaron la lechuga. Bueno. Yo tenia mi atun." },
    { "maulen", "Hace tres dias que no tengo hierba. Ando de mal genio y nadie aca se dio cuenta. Como siempre." },
    { "maulen", "Me fumo uno y me pongo a pensar. Ultimamente pienso mucho en lo que me deben." },
    { "maulen", "Una vez vi algo que no tenia que ver. Desde ahi aprendi a no estar donde me buscan." },
}

-- Mientras haces los encargos de Sous.
Narrador.Charlas.sous_encargos = {
    { "martin_a", "Si los encargos salen bien, te ganas un lugar en la lista, mi bro. Y aca la lista es sagrada." },
    { "martin_z", "Volviste vivo. Perdi una apuesta. Bien por ti." },
    { "martin_z", "Calculo que con un par de salidas mas pasamos el invierno. Calculo. No prometo." },
    { "benjamin", "Bro, eres una maquina! Despues de esto te debemos un carrete, hermano." },
    { "benjamin", "Si encuentras cables, routers, lo que sea, traelos. Algo armo, bro." },
    { "david", "Desde que llegaste el grupo esta mas tranquilo. Interesante como cambia la dinamica." },
    { "david", "Gracias. De verdad. No soy bueno diciendolo, pero gracias." },
    { "bastian", "Oe, tienes que contarme como lo haces pa volver siempre entero, loco." },
    { "bastian", "Te ganaste un lugar en el equipo. El de futbol, digo. El otro ya lo tenias." },
    { "hanz", "Buenaaa broder, otra vez con las manos llenas. Te tallo una medalla." },
    { "hanz", "Si sigues asi te vamos a tener que pagar sueldo. En latas, eso si." },
    { "cristian", "Te vi llegar desde el cerro, compadre. Caminas como piloto: con estilo." },
    { "cristian", "Algun dia te llevo arriba, a la nieve. Ahi se te olvida todo esto." },
    { "jorge", "Con lo que trajiste el inventario sube un veinte por ciento, broder. Numeros reales." },
    { "jorge", "Si fueras empresa, invertia en ti, manito." },
    { "cristobal", "Bien, hermanito! Sabia que volvias, wn." },
    { "cristobal", "Siempre que sales me quedo mirando el camino hasta que vuelves. Con 1.96 se ve lejos." },
    { "david", "Te anote en mi cuaderno: 'persona confiable'. No lo escribo a la ligera." },
    { "benjamin", "Oe, como te fue? Cuentame todo, bro. Todo. Con detalles." },
    { "benjamin", "Bro, en tu salida viste minas? Vivas, digo. Las otras no cuentan, hermano." },
    { "benjamin", "Si encuentras un parlante y algo pa tomar, hay carrete. Si encuentras amigas, hay carrete del bueno, bro." },
    { "jorge", "Te calculo el costo de cada salida, broder. Hasta ahora eres rentable." },
    { "cristobal", "Volviste entero, hermanito. Eso es lo importante, wn." },
    { "hanz", "Mira, te talle esto. Es un zombi. O un perro. Decide tu, broder." },
    { "cristian", "Te vi por los binoculares desde el cerro. Peleas bien, compadre. Medio desordenado, pero bien." },
    { "cristian", "Si necesitas ver un camino desde arriba, me dices. Soy tu radar." },
}

-- ===========================================================================
-- Despues de la traicion
-- ===========================================================================

Narrador.Charlas.sous_robados = {
    { "martin_a", "Se llevo todo. Lo que trajiste tu, lo que juntamos meses. Todo, mi sangre." },
    { "martin_a", "Yo le di la llave del deposito. Yo. Es culpa mia." },
    { "martin_a", "No quiero venganza. Quiero lo nuestro de vuelta. Bueno... un poco de venganza tambien." },
    { "martin_z", "Siempre dije que tramaba algo. Era broma. No deberia haber sido broma." },
    { "martin_z", "Inventario actual: cero. Moral: bajo cero." },
    { "martin_z", "Se llevo todas las latas de atun. Y nos dejo la lechuga. Eso fue a proposito." },
    { "benjamin", "Hermano, no lo puedo creer. Yo le hacia chistes todos los dias." },
    { "benjamin", "Bro, ni las mancuernas dejo. Que clase de persona hace eso?" },
    { "benjamin", "Detras del galpon hay colillas de semanas, hermano. Ahi se sentaba a planearlo, bro." },
    { "david", "Lo vi venir y no dije nada. Eso tambien es responsabilidad mia." },
    { "david", "Nadie traiciona de la nada. Algo le hicimos. No lo justifica, pero algo hubo." },
    { "david", "Lo de la policia no era broma. Alguien que sabe desaparecer asi, ya lo hizo antes." },
    { "bastian", "Loco, se llevo hasta mi chaqueta buena. Esto ya es personal." },
    { "bastian", "Organizo lo que sea pa encontrarlo. Lo que sea, loco." },
    { "hanz", "Pa eso queria la gubia el desgraciado. Pa abrir el candado del deposito." },
    { "hanz", "En el norte decimos que el que le roba al amigo se queda sin casa. Ahora Meulen no tiene casa, broder." },
    { "cristobal", "No puede ser, wn. Yo lo defendia cuando los demas lo molestaban." },
    { "cristobal", "Tranquilo, hermanito. Lo vamos a arreglar. Juntos." },
    { "martin_z", "Meulen conto las latas durante meses. Ahora entiendo para que." },
    { "benjamin", "Y yo que lo invitaba a todos los asados, hermano. Siempre decia que tenia su atun." },
    { "jorge", "Revise las cuentas de Meulen. Estaban perfectas. Demasiado perfectas, manito." },
    { "jorge", "Ya se por que el atun nunca bajaba. Lo iba guardando aparte. Meses, broder." },
    { "jorge", "Perdon, broder. Es que eran nuestras cosas. Meses juntandolas." },
    { "cristobal", "Meulen me pidio que le ensenara a abrir candados. Le ensene, wn. Le ensene yo." },
    { "cristian", "Primo, vamos al cerro. Desde arriba lo vamos a ver, no puede haber ido lejos." },
}

-- Cuando vuelves con lo robado (ya volvieron Cristian y Jorge del cerro).
Narrador.Charlas.sous_vuelta = {
    { "martin_a", "Se recupero lo nuestro, cabros. Hoy se come, manana se entrena." },
    { "martin_z", "Volvio la comida. Ahora el unico peligro es la cocina del Benja." },
    { "martin_z", "Venia una lata de atun en el bolso. La deje en el deposito. Por respeto. O por burla. No decido." },
    { "benjamin", "Hermanoooo, esto se celebra! Alguien tiene musica? Lo que sea, bro." },
    { "david", "Bien. Ahora hay que repartir parejo, si no esto se repite." },
    { "bastian", "Oe! Sabia que volvias, loco. Tienes cara de ganador." },
    { "hanz", "Les dije que el broder volvia. Me deben una cerveza cada uno. Cuando haya cerveza." },
    { "cristian", "Subimos al cerro con el primo buscando a ese y nada. Y estaba en el plano. Akkakaka." },
    { "cristian", "Desde arriba se veia todo nevado. Por un rato se me olvido lo demas." },
    { "cristian", "Oe, que paso aca? Uno se va dos dias al cerro y se arma la teleserie." },
    { "jorge", "Saque la cuenta, manito: con esto pasamos el invierno. Sin esto, ni la semana." },
    { "jorge", "Buena broder. Se reparte parejo y nadie se queja." },
    { "jorge", "Primo, te dije que estaba en el plano. Nunca me escuchas." },
    { "cristobal", "Gracias, hermanito. De verdad, wn. Esto no se olvida." },
    { "martin_z", "Bien. Recuperamos lo nuestro. No lo voy a celebrar, pero bien." },
    { "david", "Ojala esto nos una mas. Estadisticamente, despues de una crisis pasa." },
    { "benjamin", "Bro, esto merece un carrete de tres dias. Minimo." },
    { "benjamin", "Hermano, si alguien conoce a una sobreviviente soltera, hoy es el dia. Ando con la autoestima arriba." },
    { "cristobal", "Te traje agua, hermanito. Debes estar muerto. Bueno, no muerto. Cansado, wn." },
    { "hanz", "Broder, te ganaste un monumento tallado. Tamano bolsillo, eso si." },
    { "cristian", "Primo, te lo dije: ese no era de fiar. Bueno, tu lo dijiste. Pero yo lo pense." },
}

-- Despues, como aliados: lo que dicen cuando pasas por su base.
Narrador.Charlas.sous_aliados = {
    { "martin_a", "Mi bro. Aca siempre hay un plato pa ti. Y una barra pa colgarte." },
    { "martin_a", "Si alguien encuentra un PC que prenda, me avisan. Por motivos estrategicos." },
    { "martin_a", "Cabros, se viene visita. Ordenen un poco, no sean asi." },
    { "martin_a", "Desde lo de Meulen, cada uno lleva su propia llave. Aprendimos, mi sangre." },
    { "martin_z", "Volviste. Ya estaba apostando a que no." },
    -- Consecuencia de los Bell (bell_culpa): ellos no saben nada y hablan bien de ti.
    { "martin_z", "Pase por tu refugio. Los Bell hablan maravillas de ti. Que fuiste hasta el laboratorio por ellos y todo.", si = { "memoria", "bell_culpa", true } },
    { "david", "Daniel Bell todavia reza por ti en las noches. Es lindo que alguien rece por uno, no?", si = { "memoria", "bell_culpa", true } },
    { "martin_z", "Encontre una ruta segura. Bueno, menos insegura. No te ilusiones." },
    { "martin_z", "Akagami hizo otra lista. Tu estas primero. No te acostumbres." },
    { "martin_z", "Si alguna vez quieres aprender a calcular probabilidades, te enseno. Spoiler: todas son malas." },
    { "benjamin", "Cuando hacemos la junta, bro? Yo pongo la musica, tu traes lo demas." },
    { "benjamin", "Arregle una radio con dos cables y fe. Ingenieria, hermano." },
    { "benjamin", "Ya no me pongo nervioso contigo, bro. Eso es un logro pa mi." },
    { "benjamin", "Con el Jorge armamos un gym con fierros del galpon. Apanas?" },
    { "benjamin", "Paso una chica de otro grupo y le ofreci mi turno de guardia, bro. Eso es romance en el apocalipsis." },
    { "benjamin", "Ya tengo el carrete planeado, hermano: fogata, musica y que vengan las vecinas de la granja de al lado." },
    { "benjamin", "El Jorge dice que soy jote. Yo digo que soy optimista, bro." },
    { "david", "Llevo registro de quien hace que en la base. Hay datos que preocupan." },
    { "david", "Hay que armar un partido. Aunque sea con una pelota de trapo." },
    { "david", "Despues de lo de Meulen ahora preguntamos como esta cada uno. Algo aprendimos." },
    { "david", "Te puse en mi cuaderno. Capitulo aparte. Es un honor, creo." },
    { "bastian", "Oe, buena la chaqueta. Pa ser el fin del mundo, te ves bien." },
    { "bastian", "Aca estamos firmes, loco. Pasa cuando quieras." },
    { "bastian", "Arme un arco con dos palos. Partido el domingo. No acepto un no." },
    { "hanz", "Termine otra figurita. Esta te salio parecida. Es un halago, broder." },
    { "hanz", "Buenaaa broder. Pasa, que hay fuego." },
    { "hanz", "Te guarde un cuchillo tallado a mano. El mango es de rauli. Bueno, de un palo cualquiera." },
    { "hanz", "Si algun dia vamos al norte, te invito. Hay sol, hay mar y ojala no haya muertos." },
    { "cristian", "Desde el cerro vi una pista de aterrizaje. Algun dia, cabros. Algun dia vuelo de nuevo." },
    { "cristian", "Hay que subir al cerro un dia de estos. Con nieve. Me hace falta." },
    { "cristian", "Si encuentro una avioneta con bencina, los llevo a dar una vuelta. Sin cobrar, compadre." },
    { "cristian", "El primo saca cuentas, yo saco la cara. Asi funcionamos." },
    { "cristian", "Arriba en el cerro no hay muertos. Hay frio, pero no muertos." },
    { "jorge", "Que tal broder. Por primera vez desde que empezo esto, las cuentas cuadran." },
    { "jorge", "Si traes cosas pa cambiar, negociamos. Precio de socio, manito." },
    { "jorge", "Lleve el inventario a una planilla, sangre. En papel, pero planilla al fin." },
    { "jorge", "Con el Benja hacemos rutina en la manana. Te sumas, broder?" },
    { "jorge", "Mi primo dice que vuela. Yo digo que primero aprenda a aterrizar." },
    { "cristobal", "Bienvenido, hermanito. Pide nomas lo que necesites." },
    { "cristobal", "Me quedo de guardia. Con 1.96 soy la torre de vigilancia, wn." },
    { "cristobal", "Con el Shinbo hacemos dupla: el ve los patrones, yo veo por encima de la reja." },
    { "cristobal", "Si vuelve la luz algun dia, juego de todo. Todo, wn. Una semana sin dormir." },
    -- Si alguien murio buscando a Meulen, los demas lo recuerdan.
    { "martin_z", "Akagami habria sabido que hacer. Yo solo hago calculos.", si = { "memoria", "sous_murio_martin_a", true } },
    { "hanz", "Le estoy tallando una figura al Aka. Pa que no se nos olvide la cara, broder.", si = { "memoria", "sous_murio_martin_a", true } },
    { "martin_a", "El Zent se reia de todos. Ahora nadie se rie de nada. Hace falta, mi bro.", si = { "memoria", "sous_murio_martin_z", true } },
    { "martin_a", "Walita nos alegraba hasta los peores dias. Ya no esta.", si = { "memoria", "sous_murio_hanz", true } },
    { "martin_z", "Sin Walita esto es muy silencioso. No pense que lo iba a extranar.", si = { "memoria", "sous_murio_hanz", true } },
    { "bastian", "El Benja hablaba sin parar. Ahora el silencio molesta, loco.", si = { "memoria", "sous_murio_benjamin", true } },
    { "jorge", "Sin el Benja no hay con quien ir al gym, manito. Ni con quien reirse.", si = { "memoria", "sous_murio_benjamin", true } },
    { "benjamin", "El Tati organizaba todo, bro. Ahora nadie arma nada.", si = { "memoria", "sous_murio_bastian", true } },
    { "david", "El Tati me sacaba de la pieza a la fuerza. Nadie mas lo hace.", si = { "memoria", "sous_murio_bastian", true } },
    { "cristobal", "Me quede sin dupla, wn. Se siente raro hacer la guardia solo.", si = { "memoria", "sous_murio_david", true } },
    { "bastian", "Al Shinbo no le gustaba salir. Y salio igual, por nosotros.", si = { "memoria", "sous_murio_david", true } },
    { "david", "Sin el Wertres la guardia se siente baja. Literal y no literal.", si = { "memoria", "sous_murio_cristobal", true } },
    { "martin_z", "Todavia no entiendo como Meulen mato a todos y tu saliste sin un rasguno.", si = { "memoria", "sous_mentira", true } },
    { "jorge", "Hice las cuentas de esa noche varias veces, broder. No me cuadran.", si = { "memoria", "sous_mentira", true } },
    { "david", "El Zent dice que soy raro. Viniendo de el, es casi un cumplido." },
    { "benjamin", "Hermano, si te encuentras gente simpatica, invitala. A la base. Por la comunidad." },
    { "jorge", "Si algun dia abrimos el gym con el Benja, tu entras gratis. Socio fundador." },
    { "jorge", "El primo dice que te llevemos al cerro. Yo digo que primero pagues la cuota. Broma, sangre." },
    { "cristobal", "Sueno con una pantalla gigante y un partido de Cristiano. Algun dia, wn." },
    { "cristobal", "Te queremos harto aca, hermanito. Que lo sepas." },
    { "hanz", "El Aka me pidio que hiciera menos ruido tallando. Yo le pedi que hiciera menos dominadas." },
    { "hanz", "Aca en Kentucky no hay ni una empanada decente, broder. Extrano el norte." },
    { "cristian", "Algun dia vamos a la cordillera de verdad. Con nieve hasta las rodillas." },
    { "cristian", "Akkakaka, el Benja se cayo de la barra otra vez. No le digas que te conte." },
    { "cristian", "Vi helicopteros pasar hace dos dias. Lejos. No volvieron." },
}

-- La guerra: los que salen a cazarte...
Narrador.Charlas.sous_cazadores = {
    { "bastian", "Oe, me caias bien, loco. Lastima." },
    { "bastian", "Ni la mejor ropa te salva de esta." },
    { "cristian", "Te vimos desde el cerro. No hay donde esconderse, compadre." },
    { "cristian", "Nada personal. Bueno, si, un poco personal." },
    { "cristian", "El primo dijo que eras buena inversion. Se equivoco por primera vez." },
    { "jorge", "Son negocios, sangre. Te quedaste con lo que no era tuyo." },
    { "jorge", "Saque la cuenta: sin ti nos alcanza para el invierno, manito." },
    { "cristian", "Desde arriba te tenia en la mira hace rato, compadre." },
}

-- ...y los que defienden la base.
Narrador.Charlas.sous_defensores = {
    { "martin_a", "Te dimos la mano y nos traicionaste. Esto se termina hoy." },
    { "martin_a", "Eras igual que Meulen. Peor: a ti te queriamos." },
    { "martin_z", "Analisis rapido: tu contra seis. Malas probabilidades. Para ti." },
    { "benjamin", "Hermano, por que? Si eramos yuntas, bro." },
    { "david", "El que rompe con el grupo termina solo. Siempre pasa lo mismo." },
    { "hanz", "Y yo que te iba a tallar algo, broder." },
    { "cristobal", "No queria que terminara asi, wn. De verdad que no, hermanito." },
    { "hanz", "Te iba a tallar una medalla, broder. Ahora te voy a tallar una lapida." },
}

-- La pelea en el escondite cuando vas con gente de Sous.
Narrador.Charlas.pelea_maulen = {
    { "maulen", "Trajiste a Sous? Mejor. Asi termino con todos de una." },
    { "maulen", "Ninguno de ustedes duraba una semana sin mi. Ni una." },
    { "maulen", "Ahora si me miran, ah? Tuve que robarles pa que me miraran." },
    { "maulen", "Nunca me guardaron un pedazo de asado. Atun con lechuga, meses enteros. Ahora como lo que quiero." },
    { "maulen", "Me busco la PDI y no me encontro. Y ustedes, que no encontraban ni la pelota, me encontraron a mi?" },
    { "martin_a", "Se acabo, Meulen. Devuelve lo que no es tuyo y quizas te vas caminando." },
    { "martin_a", "Cabros, en formacion. Como en la cancha: nadie se queda atras." },
    { "martin_z", "Cuento cuatro a la izquierda. Y uno muy enojado al medio. Ese es Meulen." },
    { "martin_z", "Si muero aqui, borren mi historial. Es todo lo que pido." },
    { "hanz", "Devuelve la gubia, desgraciado!" },
    { "hanz", "Tranquilos, tranquilos. Igual estoy nervioso, pero tranquilos." },
    { "benjamin", "Bro, tengo el corazon a mil. Igual voy, igual voy!" },
    { "benjamin", "Despues de esto me debo un carrete, hermano. Uno grande." },
    { "benjamin", "Bro, si muero aca, diganle a todas que las queria. A todas, hermano." },
    { "david", "Cubre la puerta, yo entro por el lado. Como en el futbolito." },
    { "david", "Respira. Contar hasta cuatro. Disparar. Ok." },
    { "bastian", "Oe, Meulen! Devuelveme la chaqueta, loco!" },
    { "bastian", "Vamos Sous, vamos! Como en los partidos que nunca jugamos!" },
    { "bastian", "Oe Meulen, ni el humo de tu hierba te va a esconder, loco!" },
    { "cristobal", "Atras mio, hermanito. Con 1.96 los tapo a todos, wn." },
    { "cristobal", "Por Sous, wn! SIUUU!" },
}

-- Meulen en su escondite (si vas solo).
Narrador.Charlas.maulen = {
    { "maulen", "Sous no me iba a durar el invierno. Yo si." },
    { "maulen", "Te mandaron a ti a hacer el trabajo sucio. Como siempre hacen." },
    { "maulen", "Todo esto es mio ahora. Ven a buscarlo si puedes." },
    { "maulen", "Ellos jugaban a la pelota mientras yo contaba latas. Asi se gana." },
    { "maulen", "Nunca me vieron. Ni cuando estaba al frente de ellos." },
    { "maulen", "Te caia bien, peni. Por eso te mande lejos y no te deje en la base." },
    { "maulen", "Pewkallal. No nos vamos a volver a ver." },
    { "maulen", "Aca huele a hierba y a atun, peni. Por fin algo huele a algo mio." },
    { "maulen", "La PDI me busco meses y nunca me encontro. Tu me encontraste en una semana. Felicitaciones." },
}

-- Opciones de "Conversar" en la base (submenu). Cada una elige una frase al azar.
local function conversar(rol, nombre, frases)
    return { id = "hablar_" .. rol, texto = nombre, submenu = "Conversar con Sous", dice = { rol = rol, texto = frases } }
end
local CONVERSAR = {
    conversar("martin_a", "Martin Akagami", {
        "En Maipu uno aprende a cuidar a los suyos. Aca es igual, pero con menos micros.",
        "Me gusta tener todo ordenado, mi bro. Si no, esto se cae a pedazos.",
        "Si nos ayudas, quedas en la lista. Y aca la lista es sagrada.",
        "No soy de hablar mucho. Pero cuando hablo, cumplo.",
        "Antes del fin del mundo jugabamos LoL todas las noches. Ahora hacemos guardia. Mismo horario." }),
    conversar("martin_z", "Martin Zent", {
        "Que.",
        "Akagami confia en ti. Eso es raro. No lo arruines.",
        "No me mires asi. Estoy pensando. Se nota menos que en otros, pero pienso.",
        "Walita y Akagami son lo mas parecido a familia que tengo. No les digas que dije eso.",
        "Te estoy analizando. Hasta ahora: aprobado. Con nota baja." }),
    conversar("benjamin", "Benjamin Matric", {
        "Bro! Benja. Me pongo nervioso con gente nueva, pero contigo cero atado.",
        "Consiganme un generador y levanto una red, hermano. Pa algo estudie.",
        "Despues de esto: asado, musica y cero zombis. Apano a todo.",
        "Igual extrano el gym, bro. Las dominadas en la puerta no es lo mismo.",
        "El Jorge es mi yunta. Si me pasa algo, que el se quede con mis cosas. Menos la musica.",
        "Oe, tu grupo tiene amigas? Pregunto por la comunidad, bro. Por la comunidad.",
        "El ultimo carrete antes del fin del mundo fue epico, hermano. Termine bailando con tres. O con una tres veces, no me acuerdo." }),
    conversar("david", "David Shinbo", {
        "Hola. Perdona, me cuesta un poco conversar con gente nueva.",
        "Estoy anotando como se organiza la gente despues del colapso. Alguien tiene que hacerlo.",
        "Un consejo: fijate en quien se ofrece a cocinar. Ese es el que manda de verdad.",
        "Con el Wertres hacemos dupla. Si no estoy, el sabe donde encontrarme.",
        "El Tati y el Zent son los unicos que me sacan de la pieza. Les debo mucho." }),
    conversar("bastian", "Bastian Tati", {
        "Viste, loco? Te dije que la base era piola. Bueno, piola dentro de todo.",
        "Uno puede estar en el fin del mundo, pero bien vestido. Es una filosofia, po.",
        "Cuando tengamos tiempo, partido. Sous contra quien se atreva.",
        "Oe, si encuentras ropa de marca en tus saqueos, acuerdate de mi.",
        "Yo fui a buscarte porque alguien tenia que hacerlo con estilo." }),
    conversar("hanz", "Hanz Walita", {
        "Vale broder, pasa nomas. Aca no se cobra entrada. Todavia.",
        "Tenia un taller de artesania. Ahora tallo estacas. Mismo oficio, otro cliente.",
        "En el norte decimos que el que madruga... bueno, aca el que madruga ve mas zombis.",
        "Akagami y el Zent son mis yuntas. Yo pongo los chistes, ellos ponen la cara seria.",
        "Te hago un llavero tallado. Gratis. Bueno, a cambio de una lata." }),
    conversar("cristian", "Cristian Cristonks", {
        "Cristian, piloto. Bueno, era piloto. Ahora soy el que mira desde el cerro.",
        "El Jorge es mi primo. El saca cuentas, yo saco la cara.",
        "Si alguna vez encuentras una avioneta, no la toques. Avisame a mi, compadre.",
        "Lo que mas extrano es la nieve. Subir, mirar todo blanco y bajar en silencio." }),
    conversar("jorge", "Jorge Hasag", {
        "Que tal broder. Jorge. Ingeniero comercial, o sea, el que reparte las latas.",
        "Mi primo vuela, yo cuento. Entre los dos sumamos una persona normal, manito.",
        "Si traes algo pa cambiar, conmigo se negocia. Siempre justo, sangre.",
        "Con el Benja somos uno. Entrenamos juntos, comemos juntos, nos quejamos juntos." }),
    conversar("cristobal", "Cristobal Wertres", {
        "Si, mido 1.96. Si, me lo preguntan todos, wn.",
        "Soy ingeniero, no doctor, pero aprendo rapido. Si alguien sale herido, traelo, hermanito.",
        "Cristiano se entrenaba aunque nadie lo viera. Aca hay que hacer lo mismo, sangre.",
        "Con el Shinbo hacemos dupla. Si lo cuidas a el, me cuidas a mi, wn." }),
    conversar("maulen", "Meulen Canupan", {
        "Yo soy Meulen. Llevo el deposito. Nadie me pregunta mucho mas que eso.",
        "Mi familia es del sur, de cerca de Temuco. Aca nadie sabe donde queda.",
        "Me caes bien. Eres el primero que me pregunta algo en semanas.",
        "Son buenos cabros. A su manera. Una manera bien especial.",
        "Cuando todo esto termine, me vuelvo al sur. Solo. Es mas tranquilo.",
        "Si quieres comer conmigo, hay atun con lechuga. Es lo que hay. Siempre es lo que hay.",
        "Despues del turno me voy detras del galpon a fumar uno. Si vienes, no le cuentes a Akagami.",
        "Alla en el sur vi algo que no tenia que ver. Me citaron de testigo y no fui. Desde ahi se desaparecer, peni." }),
}

-- ---------------------------------------------------------------------------
-- Ir por Meulen con gente de Sous. Cada escuadra cambia cuantos matones tiene Meulen.
-- ---------------------------------------------------------------------------
local PERFIL_DE = {}
for _, par in ipairs(EN_LA_BASE) do PERFIL_DE[par[1]] = par[2] end
for _, par in ipairs(RECOLECTORES) do PERFIL_DE[par[1]] = par[2] end

-- Quien queda a cargo si el lider muere (rol, perfil, nombre).
local LIDERES = {
    { "martin_a", "narrador_sous_01", "Martin Akagami" }, { "martin_z", "narrador_sous_02", "Martin Zent" },
    { "hanz", "narrador_sous_06", "Hanz Walita" }, { "david", "narrador_sous_04", "David Shinbo" },
    { "bastian", "narrador_sous_05", "Bastian Tati" }, { "benjamin", "narrador_sous_03", "Benjamin Matric" },
    { "cristobal", "narrador_sous_09", "Cristobal Wertres" }, { "jorge", "narrador_sous_08", "Jorge Hasag" },
    { "cristian", "narrador_sous_07", "Cristian Cristonks" },
}

local ESCUADRAS = {
    { id = "trio", texto = "Ir con Akagami, Zent y Walita", nombres = "Martin Akagami, Martin Zent y Hanz Walita",
      roles = { "martin_a", "martin_z", "hanz" }, matones = { 3, 4 },
      dice = { rol = "martin_a", texto = "Los tres de siempre. Yo voy adelante, cabros. Zent, tu cuentas. Walita, tu haces reir." } },
    { id = "jovenes", texto = "Ir con Matric, Tati y David Shinbo", nombres = "Benjamin Matric, Bastian Tati y David Shinbo",
      roles = { "benjamin", "bastian", "david" }, matones = { 3, 4 },
      dice = { rol = "bastian", texto = "Oe, vamos con todo, loco. Me pongo la chaqueta buena pa la ocasion." } },
    { id = "tsz", texto = "Ir con Tati, Shinbo y Zent", nombres = "Bastian Tati, David Shinbo y Martin Zent",
      roles = { "bastian", "david", "martin_z" }, matones = { 3, 4 },
      dice = { rol = "martin_z", texto = "Bien. Yo calculo, Shinbo observa, Tati se ve bien. Equipo completo." } },
    { id = "dupla", texto = "Ir con Wertres y David Shinbo", nombres = "Cristobal Wertres y David Shinbo",
      roles = { "cristobal", "david" }, matones = { 2, 3 },
      dice = { rol = "cristobal", texto = "Vamos, hermanito. La dupla no se separa, wn." } },
    { id = "todos", texto = "Ir con todo Sous", nombres = "todo Sous (menos Cristian y Jorge, que siguen en el cerro)",
      roles = { "martin_a", "martin_z", "benjamin", "david", "bastian", "hanz", "cristobal" }, matones = { 5, 7 },
      dice = { rol = "martin_a", texto = "Sous completo. Que se prepare Meulen, cabros. Hoy se termina." } },
}

local function perfilesDe(roles)
    local lista = {}
    for _, rol in ipairs(roles) do lista[#lista + 1] = { rol, PERFIL_DE[rol] } end
    return lista
end

-- Meulen y (si va gente de Sous) su banda: un solo grupo de la faccion de la banda, asi
-- salen juntos y no se atacan entre ellos.
local BANDA = {
    { "maulen", "narrador_maulen_banda" },
    { "maton1", "narrador_banda_01" }, { "maton2", "narrador_banda_02" }, { "maton3", "narrador_banda_03" },
    { "maton4", "narrador_banda_04" }, { "maton5", "narrador_banda_05" }, { "maton6", "narrador_banda_06" },
    { "maton7", "narrador_banda_07" },
}

-- Lo que hay en el escondite siempre (Meulen, lo robado y su botin), mas lo que se agregue.
-- matones = nil (Meulen solo) o rango { min, max } de matones que lo acompanan.
local function esconditeComun(extra, matones)
    local lista = {
        { "bandidos", id = "maulen", lugar = "escondite", radio = 55, modo = "guard", salud = 200,
          perfiles = matones ~= nil and BANDA or { BANDA[1] }, fijos = 1, recortar = matones,
          nombres = { maulen = { "Meulen", "Canupan" } } },
        { "objeto", id = "suministros", lugar = "escondite", radio = 55,
          tipo = { "Base.Bag_DuffelBag", "Base.Bag_Schoolbag" }, nombre = "Suministros robados de Sous" },
        { "recompensa", lugar = "escondite", radio = 55,
          items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedBeans", "Base.CannedBeans" },
                    { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.Shotgun" }, { "Base.ShotgunShells" },
                    { "Base.HuntingRifle" }, { "Base.Pistol" }, { "Base.Bullets9mmBox", "Base.Bullets9mm" },
                    -- El atun que Meulen fue guardando aparte durante meses.
                    { "Base.TunaTin", "Base.TinnedBeans" }, { "Base.TunaTin", "Base.TinnedBeans" },
                    { "Base.TunaTin", "Base.TinnedBeans" } } },
        { "nota", lugar = "escondite", radio = 55, titulo = "Papel arrugado",
          texto = "Lista de Meulen: atun (todo), lechuga (si hay), fosforos, papelillos. Lo demas que se lo queden ellos." },
    }
    for _, a in ipairs(extra) do table.insert(lista, 1, a) end
    return lista
end

local OPCIONES_ESCUADRA, SALIDAS_ESCUADRA = {}, {
    { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
    { cuando = { "eleccion", "solo" }, ir = "viaje_solo" },
    { cuando = { "horas", 72 }, ir = "viaje_solo" },
}
for _, e in ipairs(ESCUADRAS) do
    OPCIONES_ESCUADRA[#OPCIONES_ESCUADRA + 1] = { id = e.id, texto = e.texto, dice = e.dice }
    table.insert(SALIDAS_ESCUADRA, 2, { cuando = { "eleccion", e.id }, ir = "marcha_" .. e.id })
end
OPCIONES_ESCUADRA[#OPCIONES_ESCUADRA + 1] = { id = "solo", texto = "Mejor ir solo",
    dice = { rol = "martin_a", texto = "Como quieras, mi bro. Pero vuelve entero." } }

-- Etapas de cada escuadra: salen antes que tu y te esperan al lado del escondite.
local function etapasEscuadras(etapas)
    for _, e in ipairs(ESCUADRAS) do
        etapas["marcha_" .. e.id] = {
            pista = "Ir a {lugar:escondite}. Te esperan ahi: " .. e.nombres .. ".",
            al_entrar = {
                { "variable", nombre = "escuadra", valor = e.id },
                { "retirar_miembros", grupo = SOUS, lugar = BASE, roles = e.roles, radio = 40 },
                { "diario", texto = e.nombres .. " salen antes que tu hacia {lugar:escondite}. Se juntan ahi." },
            },
            salidas = {
                { cuando = { "cerca", "escondite", 70 }, ir = "escondite_" .. e.id },
                { cuando = { "horas", 120 }, ir = "final_maulen_escapa" },
            },
        }
        etapas["escondite_" .. e.id] = {
            pista = "Acabar con Meulen Canupan y su banda en {lugar:escondite}. Van contigo: " .. e.nombres .. ".",
            charla = { grupos = { "escuadra", "maulen" }, lista = "pelea_maulen", radio = 25, cada = 0.1 },
            al_entrar = esconditeComun({
                { "aviso", texto = "Meulen no esta solo: sabia que Sous lo buscaba y junto una banda. Aqui ya nadie es inmortal: cuiden a los suyos." },
                -- La escuadra ya no es inmortal: si cae alguien, cae de verdad.
                { "npcs", id = "escuadra", lugar = "encuentro", radio = 70, modo = "guard", postura = "friendly",
                  acompanar = true, perfiles = perfilesDe(e.roles) },
                { "lugar_cerca", id = "encuentro", de = "escondite", distancia = 22 },
            }, e.matones),
            salidas = {
                { cuando = { "mato_jugador", "escuadra" }, ir = "final_traicion" },
                { cuando = { "muerto", "maulen", "maulen" }, ir = "decision" },
                { cuando = { "horas", 120 }, ir = "final_maulen_escapa" },
            },
        }
    end
    return etapas
end

-- ===========================================================================
-- Capitulo 2: Sous
-- ===========================================================================
Narrador.Defs.registrar({
    id = "sous",
    titulo = "Sous",
    titulo_menu = "Cap. 2: Sous y Meulen Canupan",
    requiere_alife = true,
    automatico = false,
    vars_desde_memoria = { "bell" },
    inicio = "mensaje",
    -- Mientras Sous este en pie en su base, alrededor quedan pocos zombis (ellos los liquidan).
    zona_segura = { lugar = BASE, grupo = SOUS, radio = 50, max = 3 },

    etapas = etapasEscuadras({
        mensaje = {
            al_entrar = {
                { "faccion", id = "narrador_sous", postura = "friendly" },
                { "faccion", id = "narrador_banda_maulen", postura = "hostile" },
                -- La base queda en un lugar fijo segun el pueblo donde viven (Narrador.SousBases);
                -- en otro pueblo se busca una bodega o un granero como antes.
                { "lugar_base_sous", id = BASE, salas = { "farmstorage", "barn", "warehouse" },
                  respaldo = { "livingroom", "kitchen", "garagestorage" }, min = 300, max = 1200 },
                { "mensajero", perfil = "narrador_sous_05",
                  llegada = "Un tipo sorprendentemente bien vestido para el fin del mundo llego a {lugar:aviso}. Dice que viene de parte de un grupo llamado Sous.",
                  texto = { por_var = "bell", textos = {
                      salvados = "Oe! Bastian, de Sous, Tati pa los amigos. Daniel Bell nos conto lo que hiciste por su familia. Necesitamos a alguien asi, broder.",
                      era_gripe = "Oe! Bastian, de Sous. Los Bell hablan muy bien de ti. Somos un grupo chico y nos falta de todo. Nos vendria bien alguien como tu.",
                      se_curo_solo = "Oe! Bastian, de Sous. Los Bell dicen que les diste techo. Nosotros estamos cortos de todo y buscamos gente de confianza.",
                      falso_remedio = "Bastian, de Sous. Supimos lo del suero falso de los Bell. Feo. Nosotros necesitamos a alguien que sepa salir a buscar cosas de verdad.",
                      transformado = "Bastian, de Sous. Supimos lo de los Bell. Lo siento, de verdad. Nosotros tampoco la estamos pasando bien. Nos falta de todo.",
                      abandonados = "Bastian, de Sous. Me cruce con los Bell en la carretera; dicen que los echaste. No te juzgo. Igual necesitamos a alguien que sepa moverse.",
                      masacre = "Bastian, de Sous. Se lo que paso con los Bell. No me importa: necesitamos a alguien al que no le tiemble la mano.",
                      muertos = "Bastian, de Sous. Encontramos a los Bell... lo que quedaba. Nosotros no queremos terminar igual. Necesitamos ayuda.",
                      otro = "Oe! Bastian, de Sous. Dicen que eres de los que todavia ayudan. Nos falta de todo, broder.",
                  } },
                  diario = "Bastian Tati, de un grupo llamado Sous, te invita a su base en {lugar:base_sous}. Necesitan ayuda con suministros.",
                  nota = { titulo = "Indicaciones de Bastian", texto = "La base de Sous esta en {lugar:base_sous}. Pregunta por Martin Akagami. Ven armado. -Tati" } },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "viaje" },
                { cuando = { "horas", 96 }, ir = "final_nunca_fuiste" },
            },
        },

        viaje = {
            pista = "Ir a la base de Sous en {lugar:base_sous}.",
            salidas = {
                { cuando = { "cerca", BASE, 40 }, ir = "base" },
                { cuando = { "horas", 120 }, ir = "final_nunca_fuiste" },
            },
        },

        base = {
            pista = "Hablar con Martin Akagami en la base de Sous (clic derecho cerca de ellos).",
            ancla = BASE,
            ancla_grupo = SOUS,
            charla = { grupo = SOUS, lista = { "sous_base", "maulen_piola" }, radio = 12, cada = 0.3 },
            al_entrar = {
                enBase({ "npcs", id = SOUS, lugar = BASE, radio = 60, postura = "friendly", perfiles = EN_LA_BASE }),
                { "diario", texto = "Llegaste a la base de Sous. Martin Akagami, su lider, te esta esperando." },
            },
            opciones = {
                { id = "ayudar", texto = "Ofrecer tu ayuda a Sous",
                  dice = { rol = "martin_a", texto = "Sabia que podiamos contar contigo, mi bro. Lo primero es la medicina. Despues vemos lo demas." } },
                { id = "negar", texto = "Decir que no es tu problema",
                  dice = { rol = "martin_a", texto = "Entiendo. Cada uno ve por los suyos. Suerte, mi bro." } },
                CONVERSAR[1], CONVERSAR[2], CONVERSAR[3], CONVERSAR[4], CONVERSAR[5], CONVERSAR[6], CONVERSAR[7],
                CONVERSAR[8], CONVERSAR[9], CONVERSAR[10],
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "todos_muertos", SOUS }, ir = "final_sous_caidos" },
                { cuando = { "eleccion", "ayudar" }, ir = "encargo1" },
                { cuando = { "eleccion", "negar" }, ir = "final_negado" },
            },
        },

        -- Encargo 1 de Sous: medicina.
        encargo1 = {
            pista = "Traer medicina para Sous desde {lugar:farmacia}.",
            charla = { grupo = SOUS, lista = { "sous_base", "maulen_piola", "sous_maulen" }, radio = 12, cada = 0.4 },
            al_entrar = {
                { "lugar", id = "farmacia", desde = BASE, salas = { "pharmacy", "pharmacystorage", "medical", "medicalstorage" },
                  respaldo = { "bathroom", "kitchen" }, min = 200, max = 900 },
                { "decir", grupo = SOUS, rol = "cristobal", texto = "Hago de doctor, pero sin remedios no hago milagros, wn. En {lugar:farmacia} deberia quedar algo, hermanito." },
                { "objeto", id = "medicina", lugar = "farmacia", radio = 50, tipo = { "Base.Antibiotics", "Base.Pills" },
                  nombre = "Medicina para Sous" },
                { "oleada", lugar = "farmacia", radio = 50, cantidad = { 10, 16 } },
                { "diario", texto = "Primer encargo de Sous: traer medicina desde {lugar:farmacia}." },
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "alguien_tiene", "medicina" }, ir = "volver1" },
                { cuando = { "horas", 120 }, ir = "final_no_volviste" },
            },
        },
        volver1 = {
            pista = "Llevarle la medicina a Cristobal Wertres en {lugar:base_sous}.",
            ancla = BASE,
            ancla_grupo = SOUS,
            charla = { grupo = SOUS, lista = { "sous_base", "sous_encargos", "maulen_piola", "sous_maulen" }, radio = 12, cada = 0.4 },
            opciones = {
                { id = "entregar", texto = "Entregar la medicina", requiere = { "objeto", "medicina" }, falta = "No llevas la medicina.",
                  dice = { rol = "cristobal", texto = "Esto nos salva la semana, wn. Gracias, hermanito." } },
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "eleccion", "entregar" }, ir = "encargo2" },
            },
        },

        -- Encargo 2 de Sous: armas.
        encargo2 = {
            pista = "Conseguir armas para Sous en {lugar:armeria}.",
            charla = { grupo = SOUS, lista = { "sous_base", "sous_encargos", "maulen_grietas", "sous_maulen" }, radio = 12, cada = 0.4 },
            al_entrar = {
                { "decir", grupo = SOUS, rol = "maulen", texto = "Bien hecho. Yo guardo la medicina en el deposito. Ahi esta mas segura." },
                { "lugar", id = "armeria", desde = BASE, salas = { "gunstorestorage", "gunstore", "policestorage", "armystorage" },
                  respaldo = { "garagestorage", "warehouse" }, min = 300, max = 1200 },
                { "decir", grupo = SOUS, rol = "martin_a", texto = "Ahora las armas, mi bro. En {lugar:armeria} deberia quedar algo. Con eso aguantamos el invierno." },
                { "decir", grupo = SOUS, rol = "jorge", texto = "Si traes armas, manito, la base vale el doble. Es inversion pura." },
                { "objeto", id = "armas", lugar = "armeria", radio = 50, tipo = { "Base.Bag_DuffelBag", "Base.Bag_Schoolbag" },
                  nombre = "Armas para Sous" },
                { "oleada", lugar = "armeria", radio = 50, cantidad = { 16, 24 } },
                { "bandidos", id = "saqueadores", lugar = "armeria", radio = 60, modo = "guard", cantidad = { 2, 3 } },
                { "diario", texto = "Segundo encargo de Sous: conseguir armas en {lugar:armeria}." },
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "alguien_tiene", "armas" }, ir = "volver2" },
                { cuando = { "horas", 120 }, ir = "final_no_volviste" },
            },
        },
        volver2 = {
            pista = "Llevarle las armas a Sous en {lugar:base_sous}.",
            ancla = BASE,
            ancla_grupo = SOUS,
            charla = { grupo = SOUS, lista = { "sous_base", "sous_encargos", "maulen_grietas", "sous_maulen" }, radio = 12, cada = 0.4 },
            opciones = {
                { id = "entregar", texto = "Entregar las armas", requiere = { "objeto", "armas" }, falta = "No llevas las armas.",
                  dice = { rol = "hanz", texto = "Buenaaa broder! Ahora si nos respetan." } },
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "eleccion", "entregar" }, ir = "encargo3" },
            },
        },

        -- Encargo 3: te lo da Meulen. Es una trampa para alejarte de la base.
        encargo3 = {
            pista = "Revisar {lugar:senuelo}: Meulen dice que ahi hay de todo.",
            charla = { grupo = SOUS, lista = { "sous_encargos", "maulen_grietas", "sous_maulen" }, radio = 12, cada = 0.4 },
            al_entrar = {
                { "decir", grupo = SOUS, rol = "maulen", texto = "Lo guardo con lo demas. Todo junto, mas facil de cuidar." },
                { "lugar", id = "senuelo", desde = BASE, salas = { "warehouse", "factorystorage", "storageunit", "grocerystorage" },
                  respaldo = { "garagestorage", "livingroom" }, min = 700, max = 1600 },
                { "decir", grupo = SOUS, rol = "maulen", retraso = 0.05,
                  texto = "Akagami esta en la guardia y me pidio que te dijera: revisa {lugar:senuelo}, dicen que hay de todo. Anda tranquilo, peni. Yo cuido el deposito." },
                { "diario", texto = "Meulen Canupan te pasa el tercer encargo de parte de Akagami: revisar {lugar:senuelo}." },
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "cerca", "senuelo", 45 }, ir = "trampa" },
                { cuando = { "horas", 48 }, ir = "trampa" },
            },
        },

        -- La trampa: no hay nada. Mientras tanto, Meulen vacia el deposito y se va.
        trampa = {
            pista = "Volver a {lugar:base_sous}: algo anda mal.",
            al_entrar = {
                { "oleada", lugar = "senuelo", radio = 50, cantidad = { 25, 35 } },
                { "nota", lugar = "senuelo", radio = 50, titulo = "Nota doblada",
                  texto = "Peni: perdon por hacerte caminar tanto. No es contra ti. Es contra ellos. Chaltu may por todo. -M." },
                { "retirar_miembros", grupo = SOUS, lugar = BASE, roles = { "maulen" }, radio = 60 },
                { "aviso", texto = "En {lugar:senuelo} no hay nada. Solo muertos... y una nota doblada con la letra de Meulen." },
                { "diario", texto = "El encargo de Meulen era mentira. En {lugar:senuelo} no habia nada. Hay que volver a la base de Sous." },
            },
            salidas = { { cuando = { "cerca", BASE, 30 }, ir = "pistas" } },
        },

        pistas = {
            pista = "Revisar el deposito de Sous buscando pistas de Meulen.",
            ancla = BASE,
            ancla_grupo = SOUS,
            charla = { grupo = SOUS, lista = "sous_robados", radio = 12, cada = 0.3 },
            al_entrar = {
                { "lugar", id = "abandonado", desde = BASE,
                  salas = { "factorystorage", "warehouse", "storageunit" },
                  respaldo = { "hospital*", "medical", "grocerystorage" }, min = 400, max = 1400 },
                { "decir", grupo = SOUS, rol = "martin_a", texto = "Meulen se llevo todo, mi bro. La medicina, las armas, la comida. Todo. Mientras tu estabas afuera." },
                { "decir", grupo = SOUS, rol = "david", retraso = 0.05, texto = "Meulen siempre hablaba de un lugar donde 'nadie lo iba a molestar'. Nunca dijo cual." },
                { "diario", texto = "Meulen Canupan engano a todos: mientras te mandaba lejos, vacio el deposito de Sous y desaparecio con todo lo que trajiste." },
                -- Cristian y Jorge salen al cerro a buscarlo (vuelven mas adelante).
                { "retirar_miembros", grupo = SOUS, lugar = BASE, roles = { "cristian", "jorge" }, radio = 40 },
            },
            opciones = {
                { id = "revisar", texto = "Revisar el deposito saqueado",
                  respuesta = "Entre cajas vacias encuentras un recibo arrugado con una direccion: {lugar:abandonado}. Al lado hay una lata de atun abierta y colillas aplastadas: Meulen estuvo aca hasta el ultimo minuto. Hay huellas de botas con barro seco.",
                  diario = "Primera pista: un recibo con la direccion de {lugar:abandonado}. Meulen paso por ahi." },
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "todos_muertos", SOUS }, ir = "final_sous_caidos" },
                { cuando = { "eleccion", "revisar" }, ir = "abandonado" },
            },
        },

        abandonado = {
            pista = "Investigar {lugar:abandonado}: Meulen paso por ahi. Esta lleno de muertos.",
            al_entrar = {
                { "oleada", lugar = "abandonado", radio = 50, cantidad = { 35, 50 } },
                { "oleada", lugar = "abandonado", radio = 50, cantidad = { 15, 25 }, retraso = 0.4 },
                { "objeto", id = "diario_maulen", lugar = "abandonado", radio = 50,
                  tipo = { "Base.Notebook", "Base.SheetPaper2" }, nombre = "Diario de Meulen Canupan" },
                { "nota", lugar = "abandonado", radio = 50, titulo = "Rayado en la pared",
                  texto = "M.C. estuvo aqui. Que nadie toque lo que es mio." },
                { "nota", lugar = "abandonado", radio = 50, titulo = "Latas vacias",
                  texto = "Una ruma de latas de atun vacias, hojas de lechuga podrida y olor a hierba quemada. Alguien se quedo aqui varios dias." },
            },
            salidas = {
                { cuando = { "alguien_tiene", "diario_maulen" }, ir = "revelado" },
                { cuando = { "horas", 120 }, ir = "final_maulen_escapa" },
            },
        },

        revelado = {
            al_entrar = {
                { "faccion", id = "narrador_banda_maulen", postura = "hostile" },
                { "lugar", id = "escondite", desde = "abandonado",
                  salas = { "livingroom", "kitchen", "garagestorage", "motelroom" }, min = 300, max = 1200 },
                { "diario", texto = "En el diario, Meulen escribio: 'Nadie me va a buscar en {lugar:escondite}. Con lo de Sous me alcanza para el invierno.'" },
                { "diario", texto = "Entre las paginas del diario hay una citacion vieja de la PDI, doblada en cuatro: buscaban a Meulen Canupan como testigo de un homicidio. Nunca se presento." },
                { "aviso", texto = "El diario de Meulen dice donde se esconde: {lugar:escondite}. Puedes ir solo o volver a la base de Sous a pedir refuerzos." },
            },
            salidas = { { ir = "plan" } },
        },

        -- Ir solo (Meulen te espera solo) o volver a la base por gente de Sous (Meulen tiene banda).
        plan = {
            pista = "Ir solo a {lugar:escondite}, o volver a {lugar:base_sous} a pedir refuerzos.",
            salidas = {
                { cuando = { "cerca", BASE, 25 }, ir = "reclutar" },
                { cuando = { "cerca", "escondite", 70 }, ir = "escondite" },
                { cuando = { "horas", 120 }, ir = "final_maulen_escapa" },
            },
        },

        reclutar = {
            pista = "Elegir quien de Sous va contigo a buscar a Meulen (clic derecho cerca de ellos).",
            ancla = BASE,
            ancla_grupo = SOUS,
            charla = { grupo = SOUS, lista = "sous_robados", radio = 12, cada = 0.4 },
            al_entrar = {
                { "decir", grupo = SOUS, rol = "martin_a", texto = "Lo encontraste? Dime quien va contigo, mi bro. Pero ojo: si vamos varios, Meulen no va a estar solo. Ya debe saber que lo buscamos." },
            },
            opciones = OPCIONES_ESCUADRA,
            salidas = SALIDAS_ESCUADRA,
        },

        viaje_solo = {
            pista = "Ir solo a {lugar:escondite}.",
            salidas = {
                { cuando = { "cerca", "escondite", 70 }, ir = "escondite" },
                { cuando = { "horas", 120 }, ir = "final_maulen_escapa" },
            },
        },

        -- Solo: Meulen esta solo.
        escondite = {
            pista = "Encontrar a Meulen Canupan en {lugar:escondite}. Esta solo.",
            charla = { grupo = "maulen", lista = "maulen", radio = 20, cada = 0.15 },
            al_entrar = esconditeComun({}),
            salidas = {
                { cuando = { "muerto", "maulen", "maulen" }, ir = "decision" },
                { cuando = { "horas", 120 }, ir = "final_maulen_escapa" },
            },
        },

        decision = {
            pista = "Decidir que hacer con lo que robo Meulen.",
            ancla = "escondite",
            radio = 25,
            al_entrar = {
                { "contar_bajas", grupo = "escuadra", memoria = "sous", lider_orden = LIDERES },
                { "diario", texto = "Meulen Canupan esta muerto. La comida y las armas de Sous estan ahi, en {lugar:escondite}." },
                { "diario", si = { "var", "hubo_bajas", true }, texto = "La pelea costo caro. Cayeron: {bajas_nombres}." },
                { "diario", si = { { "var", "hubo_bajas", false }, { "no", { "var", "escuadra", nil } } },
                  texto = "Todos los de Sous que fueron contigo siguen vivos." },
            },
            opciones = {
                { id = "quedarse", texto = "Quedarte con todo lo que robo Meulen",
                  respuesta = "Nadie tiene por que enterarse... o eso crees." },
                { id = "devolver", texto = "Decidir devolverle las cosas a Sous",
                  respuesta = "Cargas los suministros. Sous esta esperando." },
            },
            salidas = {
                { cuando = { "mato_jugador", "escuadra" }, ir = "final_traicion" },
                -- Si nadie de los que fueron sobrevivio, nadie vio nada.
                { cuando = { { "eleccion", "quedarse" }, { "todos_muertos", "escuadra" } }, ir = "final_mentira" },
                { cuando = { "eleccion", "quedarse" }, ir = "final_te_quedaste" },
                { cuando = { "eleccion", "devolver" }, ir = "devolver" },
            },
        },

        devolver = {
            pista = "Llevar los suministros robados a Sous en {lugar:base_sous}.",
            ancla = BASE,
            ancla_grupo = SOUS,
            charla = { grupos = { SOUS, "recolectores", "regresan" }, lista = "sous_vuelta", radio = 12, cada = 0.3 },
            al_entrar = {
                { "contar_bajas", grupo = "escuadra", memoria = "sous", lider_orden = LIDERES },
                -- Los que fueron contigo vuelven a la base por su cuenta (los vivos).
                { "retirar_lejos", grupo = "escuadra", lugar = "escondite", radio = 50, retraso = 0.2 },
                enBase({ "npcs", id = "regresan", lugar = BASE, radio = 80, no_mas_cerca = 25,
                  postura = "friendly", perfiles = EN_LA_BASE, solo_de_grupo = "escuadra" }),
                -- Cristian y Jorge volvieron del cerro mientras tanto.
                enBase({ "npcs", id = "recolectores", lugar = BASE, radio = 80, no_mas_cerca = 25,
                  postura = "friendly", perfiles = RECOLECTORES }),
                { "diario", texto = "Cristian Cristonks y Jorge Hasag volvieron a la base: subieron al cerro buscando a Meulen y no encontraron nada." },
            },
            opciones = {
                { id = "entregar", texto = "Entregar los suministros a Sous", requiere = { "objeto", "suministros" },
                  falta = "No llevas los suministros de Sous. Quedaron en {lugar:escondite}." },
            },
            salidas = {
                { cuando = { "mato_jugador", SOUS }, ir = "final_traicion" },
                { cuando = { "eleccion", "entregar" }, ir = "final_aliados" },
                { cuando = { "horas", 72 }, ir = "final_te_quedaste" },
            },
        },

        -- ------------------------------------------------------------------
        -- Finales del capitulo 2
        -- ------------------------------------------------------------------

        final_aliados = {
            final = true,
            al_entrar = {
                { "faccion", id = "narrador_sous", postura = "friendly" },
                { "contar_bajas", grupo = "escuadra", memoria = "sous", lider_orden = LIDERES },
                { "decir", grupo = SOUS, rol = "martin_a", si = { "no", { "var", "murio_martin_a", true } },
                  texto = "Sous no olvida, mi bro. Desde hoy eres de los nuestros. Palabra de Akagami." },
                { "decir", grupo = "regresan", rol = "martin_a", si = { "no", { "var", "murio_martin_a", true } },
                  texto = "Sous no olvida, mi bro. Desde hoy eres de los nuestros. Palabra de Akagami." },
                { "decir", grupo = "recolectores", rol = "jorge", texto = "Buena, broder. Ahora si los numeros cierran." },
                { "diario", si = { "var", "hubo_bajas", false },
                  texto = "Le devolviste todo a Sous. {lider_nombre} te da su palabra: Sous es tu aliado." },
                { "diario", si = { "var", "hubo_bajas", true },
                  texto = "Le devolviste todo a Sous, pero no volvieron todos: {bajas_nombres}. Esa noche no hubo celebracion. {lider_nombre} te da igual su palabra: Sous es tu aliado." },
                { "diario", si = { "var", "murio_martin_a", true },
                  texto = "Sin Martin Akagami, {lider_nombre} queda a cargo de Sous." },
                { "recompensa", lugar = BASE, radio = 40,
                  items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Bandage" }, { "Base.Bandage" },
                            { "Base.ShotgunShells" }, { "Base.Antibiotics", "Base.Pills" } } },
                { "residentes", id = "sous", grupos = { SOUS, "recolectores", "regresan" }, charla = "sous_aliados",
                  lugar = BASE, radio = 50, max_zombis = 3, banderas = BANDERAS_BASE },
                { "memoria", clave = "sous", valor = "aliados" },
                { "memoria_lugar", clave = "base_sous", lugar = BASE },
                { "abrir", def = "sous_arsenal", horas = 12 },
            },
        },

        -- Quedarte con todo cuando nadie de Sous quedo vivo para verlo.
        final_mentira = {
            final = true,
            al_entrar = {
                { "contar_bajas", grupo = "escuadra", memoria = "sous", lider_orden = LIDERES },
                { "faccion", id = "narrador_sous", postura = "friendly" },
                { "diario", texto = "Nadie de Sous quedo vivo para contar lo que paso en {lugar:escondite}. Volviste con una historia: Meulen mato a {bajas_nombres} y escapo con todo. Sous te creyo." },
                { "aviso", texto = "Sous te cree. Por ahora." },
                { "residentes", id = "sous", grupos = { SOUS }, charla = "sous_aliados",
                  lugar = BASE, radio = 50, max_zombis = 3, banderas = BANDERAS_BASE },
                { "memoria", clave = "sous", valor = "aliados" },
                { "memoria", clave = "sous_mentira", valor = true },
                { "memoria_lugar", clave = "base_sous", lugar = BASE },
                { "abrir", def = "sous_arsenal", horas = 12 },
            },
        },

        final_te_quedaste = {
            final = true,
            al_entrar = {
                { "contar_bajas", grupo = "escuadra", memoria = "sous", lider_orden = LIDERES },
                { "faccion", id = "narrador_sous", postura = "hostile" },
                { "aviso", si = { "var", "escuadra", nil },
                  texto = "Sous se entero de que te quedaste con sus cosas. Ya no son amigos." },
                { "aviso", si = { "no", { "var", "escuadra", nil } },
                  texto = "{testigo} lo vio todo. Sous ya sabe que te quedaste con sus cosas." },
                { "diario", texto = "Te quedaste con lo que Meulen le robo a Sous. Para ellos, ahora eres igual que el." },
                { "memoria", clave = "sous", valor = "enemigos" },
                { "memoria_lugar", clave = "base_sous", lugar = BASE },
                { "retirar_lejos", grupo = SOUS, lugar = BASE, radio = 60, retraso = 1 },
                { "retirar_lejos", grupo = "escuadra", lugar = "escondite", radio = 50, retraso = 0.3 },
                { "abrir", def = "sous_guerra", horas = 12 },
            },
        },

        final_traicion = {
            final = true,
            al_entrar = {
                { "contar_bajas", grupo = "escuadra", memoria = "sous", lider_orden = LIDERES },
                { "faccion", id = "narrador_sous", postura = "hostile" },
                { "diario", texto = "Sangre de Sous en tus manos. Los que quedan no lo van a perdonar." },
                { "memoria", clave = "sous", valor = "enemigos" },
                { "memoria_lugar", clave = "base_sous", lugar = BASE },
                { "retirar_lejos", grupo = SOUS, lugar = BASE, radio = 60, retraso = 1 },
                { "retirar_lejos", grupo = "escuadra", lugar = "escondite", radio = 50, retraso = 0.3 },
                { "abrir", def = "sous_guerra", horas = 12 },
            },
        },

        final_negado = {
            final = true,
            al_entrar = {
                { "diario", texto = "Sous tendra que arreglarselas sin ti." },
                { "memoria", clave = "sous", valor = "negado" },
                { "retirar_lejos", grupo = SOUS, lugar = BASE, radio = 60, retraso = 1 },
            },
        },

        -- Dijiste que si y no volviste con el encargo a tiempo (no es lo mismo que negarte).
        final_no_volviste = {
            final = true,
            al_entrar = {
                { "diario", texto = "Le dije a Sous que lo ayudaba y nunca volvi con lo que me pidieron. Dejaron de esperarme." },
                { "memoria", clave = "sous", valor = "ignorados" },
                { "retirar_lejos", grupo = SOUS, lugar = BASE, radio = 60, retraso = 1 },
            },
        },

        final_sous_caidos = {
            final = true,
            al_entrar = {
                { "diario", texto = "Los muertos llegaron antes que tu. Sous cayo en su propia base." },
                { "memoria", clave = "sous", valor = "caidos" },
            },
        },

        final_maulen_escapa = {
            final = true,
            al_entrar = {
                { "diario", texto = "Meulen Canupan se esfumo con todo. Sous nunca recupero lo suyo. Desaparecer era lo unico que siempre supo hacer bien." },
                { "memoria", clave = "sous", valor = "maulen_escapa" },
            },
        },

        final_nunca_fuiste = {
            final = true,
            al_entrar = {
                { "diario", texto = "Nunca fuiste a la base de Sous. Nadie volvio a saber de ellos." },
                { "memoria", clave = "sous", valor = "ignorados" },
            },
        },
    }),
})

-- ---------------------------------------------------------------------------
-- Perdonar a Meulen (solo si fuiste solo al escondite): si sigue vivo un cuarto de hora despues
-- de encontrarlo, se rinde. Si lo dejas ir, Sous nunca lo sabe (cree que se escapo) y Meulen
-- termina en el patio de trenes de Muldraugh, matando a la Sargento Pereira y quedandose con su
-- banda (ver Arcos/Bandido.lua, bandido_maulen).
-- ---------------------------------------------------------------------------
do
    local def = Narrador.Defs.get("sous")
    local et = def.etapas
    table.insert(et.escondite.salidas, 2,
        { cuando = { { "grupo_listo", "maulen" }, { "vivo", "maulen", "maulen" }, { "horas", 0.25 } }, ir = "rendicion" })
    et.rendicion = {
        pista = "Meulen se rinde. Decidir que hacer con el (clic derecho cerca).",
        ancla = "escondite", ancla_grupo = "maulen_rendido", radio = 20,
        al_entrar = {
            { "retirar", grupo = "maulen" },
            { "npcs", id = "maulen_rendido", lugar = "escondite", radio = 30, no_mas_cerca = 6, modo = "guard", quietos = true,
              correa = 3, inmortales = true, postura = "friendly", perfiles = { { "maulen", "narrador_sous_10" } },
              nombres = { maulen = { "Meulen", "Canupan" } } },
            { "aviso", texto = "Meulen sale de detras de un mueble con las manos arriba y el cigarro apagado en la boca." },
        },
        opciones = {
            { id = "perdonar", texto = "Dejarlo ir. Sous va a creer que se escapo",
              dice = { rol = "maulen", texto = "Peni... no se te va a olvidar esto. A mi tampoco. Me voy lejos, donde nadie me conozca. Bueno, casi nadie." },
              acciones = { { "variable", nombre = "maulen_perdonado", valor = true } } },
            { id = "matar", texto = "Terminar con el",
              respuesta = "Meulen cierra los ojos. 'Atun con lechuga, peni. Todos los dias.'",
              acciones = { { "banderas", grupo = "maulen_rendido", inmortales = false } } },
        },
        salidas = {
            { cuando = { "muerto", "maulen_rendido", "maulen" }, ir = "decision" },
            { cuando = { "eleccion", "perdonar" }, ir = "perdonado" },
            { cuando = { "horas", 24 }, ir = "final_maulen_escapa" },
        },
    }
    et.perdonado = {
        al_entrar = {
            { "retirar_lejos", grupo = "maulen_rendido", lugar = "escondite", radio = 80, retraso = 0.2 },
            { "memoria", clave = "maulen_salvado", valor = true },
            { "huella", acto = "perdonaste", texto = "Deje ir a Meulen Canupan. Sous cree que se escapo." },
        },
        salidas = { { ir = "decision_perdonado" } },
    }
    local d = et.decision
    et.decision_perdonado = {
        pista = d.pista, ancla = d.ancla, radio = d.radio, opciones = d.opciones, salidas = d.salidas,
        al_entrar = {
            { "contar_bajas", grupo = "escuadra", memoria = "sous", lider_orden = LIDERES },
            { "diario", texto = "Deje ir a Meulen. Las cosas de Sous estan en {lugar:escondite}. Cuando vuelva voy a decir que se escapo." },
        },
    }
end

-- ===========================================================================
-- Capitulo 3 (rama enemiga): la guerra con Sous
-- ===========================================================================
Narrador.Defs.registrar({
    id = "sous_guerra",
    titulo = "La guerra con Sous",
    titulo_menu = "Cap. 3: La guerra con Sous",
    requiere_alife = true,
    automatico = false,
    inicio = "represalia",

    etapas = {
        represalia = {
            pista = "Sous viene por ti. Defiendete.",
            charla = { grupo = "cazadores", lista = "sous_cazadores", radio = 25, cada = 0.2 },
            al_entrar = {
                { "faccion", id = "narrador_sous", postura = "hostile" },
                { "lugar_memoria", id = BASE, clave = "base_sous",
                  salas = { "farmstorage", "barn", "warehouse" }, respaldo = { "livingroom", "kitchen" }, min = 300, max = 1200 },
                { "aviso", texto = "Escuchas silbidos que no son de pajaros. Sous viene por ti." },
                { "bandidos", id = "cazadores", lugar = "aviso", radio = 70, modo = "hunt", retraso = 1,
                  perfiles = CAZADORES, sin_muertos_de = "sous" },
            },
            salidas = {
                { cuando = { "todos_muertos", "cazadores" }, ir = "asalto" },
                { cuando = { "horas", 48 }, ir = "asalto" },
            },
        },

        asalto = {
            pista = "Terminar con Sous en {lugar:base_sous}.",
            charla = { grupo = "sous_base", lista = "sous_defensores", radio = 25, cada = 0.2 },
            al_entrar = {
                { "diario", texto = "Lo que queda de Sous se atrinchero en {lugar:base_sous}. Hay que terminar esto." },
                { "bandidos", id = "sous_base", lugar = BASE, radio = 60, modo = "guard", perfiles = DEFENSORES, sin_muertos_de = "sous" },
            },
            salidas = {
                { cuando = { "todos_muertos", "sous_base" }, ir = "final_sous_eliminado" },
            },
        },

        final_sous_eliminado = {
            final = true,
            al_entrar = {
                { "diario", texto = "Sous ya no existe. Entre las cosas de Martin Akagami hay un mapa marcado con un arsenal militar." },
                { "memoria", clave = "sous", valor = "eliminado" },
                { "abrir", def = "sous_arsenal", horas = 6 },
            },
        },
    },
})

-- ===========================================================================
-- Capitulo 4: el arsenal (premio legendario a eleccion)
-- ===========================================================================
Narrador.Defs.registrar({
    id = "sous_arsenal",
    titulo = "El arsenal",
    titulo_menu = "Cap. 4: El arsenal",
    requiere_alife = true,
    automatico = false,
    vars_desde_memoria = { "sous", "sous_lider", "sous_lider_perfil", "sous_lider_nombre" },
    inicio = "encargo",

    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "arsenal", pueblo = "Louisville", nombre = "el arsenal",
                  salas = { "armystorage", "armytent", "policestorage", "gunstorestorage" },
                  respaldo = { "warehouse", "factorystorage" } },
                { "mensajero", perfil = "var:sous_lider_perfil", si = { "var", "sous", "aliados" },
                  llegada = "{sous_lider_nombre} en persona llego a {lugar:aviso}. Viene de parte de Sous.",
                  texto = { por_var = "sous_lider", textos = {
                      martin_a = "Que onda, mi bro. El Zent encontro donde el ejercito guardaba sus armas: {lugar:arsenal}. Nosotros cuidamos la base. Lo que saques es tuyo.",
                      martin_z = "Ahora me toca a mi dar los recados. Hay un arsenal en {lugar:arsenal}. Probabilidad de que salgas vivo: decente. Anda.",
                      hanz = "Vale broder, vengo yo porque no queda nadie mas serio. Hay un arsenal en {lugar:arsenal}. Todo tuyo.",
                      david = "Hola. Me mandaron a mi... no es lo mio, pero bueno. Hay un arsenal militar en {lugar:arsenal}. Es tuyo si lo quieres.",
                      otro = "Te traigo un mensaje de Sous: hay un arsenal militar en {lugar:arsenal}. Lo que saques es tuyo.",
                  } },
                  diario = "{sous_lider_nombre} te encarga, de parte de Sous, el arsenal militar de {lugar:arsenal}." },
                { "diario", si = { "no", { "var", "sous", "aliados" } },
                  texto = "El mapa de Sous marca un arsenal militar en {lugar:arsenal}." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "viaje" },
                { cuando = { "no", { "var", "sous", "aliados" } }, ir = "viaje" },
                { cuando = { "horas", 96 }, ir = "viaje" },
            },
        },

        viaje = {
            pista = "Llegar al arsenal en {lugar:arsenal}. Va a estar repleto.",
            salidas = { { cuando = { "cerca", "arsenal", 50 }, ir = "arsenal" } },
        },

        arsenal = {
            pista = "Encontrar la caja del arsenal en {lugar:arsenal}.",
            al_entrar = {
                { "oleada", lugar = "arsenal", radio = 55, cantidad = { 60, 80 } },
                { "oleada", lugar = "arsenal", radio = 55, cantidad = { 30, 40 }, retraso = 0.5 },
                { "bandidos", id = "saqueadores", lugar = "arsenal", radio = 60, modo = "guard", cantidad = { 4, 5 } },
                { "objeto", id = "caja", lugar = "arsenal", radio = 55,
                  tipo = { "Base.Bag_DuffelBag", "Base.Briefcase", "Base.Bag_Schoolbag" }, nombre = "Caja del arsenal" },
            },
            salidas = {
                { cuando = { "alguien_tiene", "caja" }, ir = "premio" },
                { cuando = { "horas", 168 }, ir = "final_saqueado" },
            },
        },

        premio = {
            pista = "Elegir que sacar del arsenal (clic derecho).",
            ancla = "arsenal",
            radio = 40,
            al_entrar = { { "aviso", texto = "La caja tiene tres compartimentos. Solo alcanzas a abrir uno." } },
            opciones = {
                { id = "arma", texto = "Sacar el arma legendaria" },
                { id = "traje", texto = "Sacar el traje legendario" },
                { id = "auto", texto = "Quedarte con las llaves del auto legendario" },
            },
            salidas = {
                { cuando = { "eleccion", "arma" }, ir = "final_arma" },
                { cuando = { "eleccion", "traje" }, ir = "final_traje" },
                { cuando = { "eleccion", "auto" }, ir = "final_auto" },
            },
        },

        final_arma = {
            final = true,
            al_entrar = {
                { "legendario", clase = "arma", lugar = "jugador" },
                { "diario", texto = "Del arsenal sacaste un arma como no hay otra en el condado." },
                { "memoria", clave = "arsenal", valor = "arma" },
            },
        },
        final_traje = {
            final = true,
            al_entrar = {
                { "legendario", clase = "traje", lugar = "jugador" },
                { "diario", texto = "Del arsenal sacaste un traje de proteccion militar en perfecto estado." },
                { "memoria", clave = "arsenal", valor = "traje" },
            },
        },
        final_auto = {
            final = true,
            al_entrar = {
                { "legendario", clase = "auto", lugar = "jugador" },
                { "diario", texto = "Del arsenal te llevaste un vehiculo preparado para el fin del mundo." },
                { "memoria", clave = "arsenal", valor = "auto" },
            },
        },
        final_saqueado = {
            final = true,
            al_entrar = { { "diario", texto = "Alguien se te adelanto. El arsenal de {lugar:arsenal} quedo vacio." } },
        },
    },
})
