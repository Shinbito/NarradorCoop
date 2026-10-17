-- Los amigos de Sous: cuatro secundarios que pueden aparecer en cualquier historia.
--   Waton Ju: primo de Hanz Walita. Vivieron juntos en Iquique hasta que Walita tenia 12
--             (despues Walita se fue a Arica, donde tenia su taller; nunca vivio en Antofagasta).
--             La talla eterna: nunca llego a nivel 70 pa jugar DZ en PXG (PokeXGames).
--   Claudio Clau: chico y moreno, polera normal y jeans apretados. Amigo de todos. Puede salir
--             en todas las historias y al final se une a Sous.
--   Fucking Luengo: chef, rubio, alto, pelo corto. Amigo de todos; parte de Sous pero no del gaming.
--   Renaaaaaato: flaco, blanco, pelo negro con peinado normal. Amigo de todos; fanatico del Counter.
--
-- Uso desde una historia:
--   { accion = "faccion", id = Narrador.SousAmigos.FACCION },          -- crea la faccion en A-Life
--   { accion = "npcs", id = "clau", perfiles = Narrador.SousAmigos.PERFILES.clau,
--     nombres = { clau = Narrador.SousAmigos.nombres.clau }, ... }
-- Charlas: Narrador.Charlas.amigo_waton / amigo_clau / amigo_luengo / amigo_renato (rol = la clave
-- de cada uno) y Narrador.Charlas.sous_amigos_menciones (hablan los de Sous, roles de Sous.lua).
--
-- Textos sin tildes ni enies a proposito (ver nota en FamiliaInfectada.lua).

require "Narrador/NarradorDefs"

Narrador.Facciones = Narrador.Facciones or {}
Narrador.Charlas = Narrador.Charlas or {}

local SA = {
    FACCION = "narrador_sous_amigos",
    perfil = {
        waton = "narrador_amigo_waton",
        clau = "narrador_amigo_clau",
        luengo = "narrador_amigo_luengo",
        renato = "narrador_amigo_renato",
    },
    nombres = {
        waton = { "Waton", "Ju" },
        clau = { "Claudio", "Clau" },
        luengo = { "Fucking", "Luengo" },
        renato = { "Renaaaaaato", "" },
    },
}
-- Pares { rol, perfil } listos para la accion "npcs".
SA.PERFILES = {
    waton = { { "waton", SA.perfil.waton } },
    clau = { { "clau", SA.perfil.clau } },
    luengo = { { "luengo", SA.perfil.luengo } },
    renato = { { "renato", SA.perfil.renato } },
}
-- Los cuatro juntos (aparte, para no ensuciar PERFILES).
SA.TODOS = {
    { "waton", SA.perfil.waton }, { "clau", SA.perfil.clau },
    { "luengo", SA.perfil.luengo }, { "renato", SA.perfil.renato },
}
Narrador.SousAmigos = SA

-- Colores "r,g,b" de 0 a 1.
local NEGRO = "0.09,0.09,0.10"
local PELO_NEGRO = "0.06,0.05,0.05"
local PELO_OSCURO = "0.10,0.07,0.05"
local RUBIO = "0.82,0.68,0.38"

-- Amigos, no soldados: menos entrenados que Sous.
local STATS_AMIGOS = { healthHP = 130, strength = 7, endurance = 7, awareness = 8, aiming = 7, aimZombiePercent = 100 }

Narrador.Facciones.narrador_sous_amigos = {
    id = "narrador_sous_amigos",
    version = 1,
    nombre = "Amigos de Sous",
    descripcion = "Los amigos de siempre de Sous: Waton Ju, Claudio Clau, Fucking Luengo y Renaaaaaato.",
    postura = "friendly",
    stats = STATS_AMIGOS,
    relaciones = { narrador_sous = "friendly", narrador_banda_maulen = "hostile" },
    miembros = {
        { id = "narrador_amigo_waton", nombre = "Waton Ju", rol = "Primo de Walita", arma = "Base.Pistol2", cuerpo = "Base.LeadPipe",
          -- Nortino de Iquique: piel tostada, pelo corto, jockey al reves, polera estampada,
          -- bermuda de mezclilla y zapatillas.
          aspecto = { piel = 2, pelo = "Short", color_pelo = PELO_OSCURO },
          ropa = { Hat = "Base.Hat_BaseballCapTINT_Reverse", Top = "Base.Tshirt_DefaultDECAL_TINT",
                   Pants = "Base.Shorts_LongDenim", Shoes = "Base.Shoes_TrainerTINT" },
          tintes = { Hat = "0.85,0.55,0.10", Top = "0.15,0.30,0.60", Shoes = "0.92,0.92,0.92" } },
        { id = "narrador_amigo_clau", nombre = "Claudio Clau", rol = "Amigo de todos", arma = "Base.Pistol", cuerpo = "Base.BaseballBat",
          -- Chico y moreno: piel morena, pelo negro corto, polera normal y jeans apretados
          -- (Trousers_Denim usa el modelo de pantalon ajustado, no el baggy).
          stats = { healthHP = 130, strength = 6, endurance = 8, awareness = 9, aiming = 7, aimZombiePercent = 100 },
          aspecto = { piel = 3, pelo = "Fresh", color_pelo = PELO_NEGRO },
          ropa = { Top = "Base.Tshirt_DefaultTEXTURE_TINT", Pants = "Base.Trousers_Denim", Shoes = "Base.Shoes_TrainerTINT" },
          tintes = { Top = "0.55,0.12,0.12", Shoes = NEGRO } },
        { id = "narrador_amigo_luengo", nombre = "Fucking Luengo", rol = "Chef", arma = "Base.Revolver", cuerpo = "Base.MeatCleaver",
          -- Chef rubio, alto, pelo corto: chaqueta de cocinero, pantalon de chef y zapatos negros.
          -- Sin gorro de chef para que se le vea el pelo rubio.
          stats = { healthHP = 140, strength = 8, endurance = 8, awareness = 7, aiming = 6, aimZombiePercent = 100 },
          aspecto = { piel = 0, pelo = "CrewCut", color_pelo = RUBIO },
          ropa = { Top = "Base.Tshirt_WhiteTINT", Jacket = "Base.Jacket_Chef", Pants = "Base.Trousers_Chef",
                   Shoes = "Base.Shoes_Black" },
          tintes = { Top = "0.95,0.95,0.95" } },
        { id = "narrador_amigo_renato", nombre = "Renaaaaaato", rol = "Gamer", arma = "Base.HuntingRifle", cuerpo = "Base.HuntingKnife",
          -- Flaco y blanco, pelo negro peinado normal: poleron gris, polera negra, pantalon
          -- oscuro, zapatillas y protectores de oido que parecen fonos de gamer.
          -- Rifle de caza ("la AWP") y cuchillo, como en el Counter.
          stats = { healthHP = 120, strength = 5, endurance = 7, awareness = 9, aiming = 10, aimZombiePercent = 100 },
          aspecto = { piel = 0, pelo = "Short", color_pelo = PELO_NEGRO },
          ropa = { Hat = "Base.Hat_EarMuff_Protectors", Top = "Base.Tshirt_DefaultTEXTURE_TINT", Jacket = "Base.HoodieDOWN_WhiteTINT",
                   Pants = "Base.Trousers_DefaultTEXTURE_TINT", Shoes = "Base.Shoes_TrainerTINT" },
          tintes = { Top = NEGRO, Jacket = "0.45,0.45,0.47", Pants = "0.15,0.16,0.20", Shoes = NEGRO } },
    },
}

-- ---------------------------------------------------------------------------
-- Como habla cada uno. Sin tildes ni enies a proposito.
--   Waton Ju: iquiqueno, relajado, "sipo", "primo", "ya po". Se defiende de la talla del nivel 70.
--   Claudio Clau: el amigo de todos. Buena onda, servicial, "socio", "compa". Quiere ser de Sous.
--   Fucking Luengo: chef. Habla de comida y de cocina; no juega nada y se rie de los gamers.
--   Renaaaaaato: todo lo ve como una partida de Counter: rush B, eco, headshot, la AWP.
-- ---------------------------------------------------------------------------

Narrador.Charlas.amigo_waton = {
    { "waton", "Sipo, soy el primo del Hanz. Iquique, la tierra del sol y la Zofri." },
    { "waton", "Con el Hanz vivimos juntos hasta que el tenia doce. Despues se fue a Arica y me dejo solo con el PXG." },
    { "waton", "Llegue a nivel 68 en PXG, primo. Sesenta y ocho. Me faltaban dos pa la DZ y se cayo el mundo." },
    { "waton", "Si el Hanz te dice que nunca llegue a 70, es mentira. Bueno, es verdad. Pero es mentira." },
    { "waton", "La gente cree que el Hanz es de Antofa. Nunca vivio ahi, ya po. Iquique y despues Arica." },
    { "waton", "Extrano la Cavancha. El mar, el sol, el completo en la costanera. Aca solo hay muertos y pasto." },
    { "waton", "El Hanz me tallo un Pokemon cuando eramos chicos. Parecia una papa. Lo tengo guardado igual." },
    { "waton", "Yo soy primo del Hanz y nunca nos fuimos solos a la nieve. Solo digo, eh. Cristonks, Hasag." },
    { "waton", "El Matric me pregunto si todos los primos son como el Cristonks y el Hasag. Le dije que no, que esos son especiales." },
    { "waton", "Tranquilo, primo. En el norte aprendes a no apurarte: el sol te castiga si corres." },
    { "waton", "Si salgo vivo de esto, lo primero es subir los dos niveles que me faltan. Lo segundo, comer." },
    { "waton", "El Zent dice que mi apodo es una ofensa. Yo digo que es carino. Waton Ju, como el emperador." },
}

Narrador.Charlas.amigo_clau = {
    { "clau", "Hola socio! Claudio Clau, pero dime Clau no mas. Amigo de todos, enemigo de nadie." },
    { "clau", "Los jeans apretados no son moda, compa. Son estrategia: no se te engancha nada en las rejas." },
    { "clau", "Soy chico, ya se. Pero entro por ventanas donde el Wertres no pasa ni la cabeza." },
    { "clau", "Le pregunte al Akagami si me puedo unir a Sous. Me dijo 'despues vemos'. Ya van tres despues." },
    { "clau", "Con el Tati juego a la pelota, con el Benja voy al gym y con el Luengo como. Tengo la vida armada, socio." },
    { "clau", "El Matric me pregunto si yo creia que los primos se comian. Le dije que no se metiera. Despues le dije que un poquito." },
    { "clau", "Si alguien necesita una mano, aca estoy. Literal: tengo dos y una esta libre." },
    { "clau", "El Shinbo me anoto en su cuaderno. 'El Clau: siempre aparece'. Es lo mas lindo que me han dicho." },
    { "clau", "Le estoy llevando unas latas al Meulen. Nadie le lleva nada, compa. Me da penita." },
    { "clau", "Polera normal, jeans y zapatillas. El fin del mundo me pillo vestido pa cualquier cosa." },
    { "clau", "Algun dia voy a tener mi propio turno de guardia en Sous. Con mi nombre en la lista del Aka." },
    { "clau", "El Renaaaaaato me quiere ensenar Counter. Yo le digo que primero me ensene a disparar de verdad." },
    { "clau", "Donde hay amigos hay base, socio. Aunque la base sea un galpon con olor a hierba." },
}

Narrador.Charlas.amigo_luengo = {
    { "luengo", "Me dicen Fucking Luengo desde la escuela de cocina. No pregunten. Fue un risotto." },
    { "luengo", "Yo no juego al LoL ni al Counter ni a nada, wn. Yo cocino. Ustedes juegan y despues comen." },
    { "luengo", "Con dos latas y una cebolla te hago un plato. Con tres latas te hago un menu." },
    { "luengo", "El Meulen come atun con lechuga todos los dias. Le ofreci un aderezo. Me miro como si le hubiera pegado." },
    { "luengo", "El Benja me pide proteina en todo. Le puse proteina al arroz. Le puse proteina al te. Sigue pidiendo." },
    { "luengo", "Mise en place, cabros. Todo ordenado antes de cocinar. Igual que una guardia, pero rico." },
    { "luengo", "El asado del Matric no es asado. Es carne quemada con autoestima." },
    { "luengo", "Los primos me pidieron comida pa dos pa subir al cerro. Pa dos. Romantico, wn." },
    { "luengo", "Mido casi lo mismo que el Wertres. La diferencia es que yo uso la altura pa alcanzar las ollas." },
    { "luengo", "Cuando hablan de rankeds y elos yo me voy a pelar papas. Es mi forma de meditar." },
    { "luengo", "El Akagami me puso en la lista de turnos como 'cocina, siempre'. No me quejo. Bueno, un poco." },
    { "luengo", "Un cuchillo bien afilado sirve pa la cebolla y pa los muertos. Lo lavo entre medio, tranquilos." },
    { "luengo", "El Clau es el unico que lava los platos sin que se lo pidan. Ese cabro va a llegar lejos." },
}

Narrador.Charlas.amigo_renato = {
    { "renato", "Me dicen Renaaaaaato porque asi me gritaban cuando me iba solo a rushear. Con todas las a." },
    { "renato", "Los zombis son bots en dificultad facil, wn. El problema es que son como quinientos." },
    { "renato", "Rush B, cabros. No paren. Bueno, aca si paren, que hay una horda en la B." },
    { "renato", "Esto es una ronda eco: pistola, cuchillo y fe. La proxima compramos." },
    { "renato", "Con el rifle soy otra persona. Le digo la AWP. Nadie me corrige porque nadie sabe que es." },
    { "renato", "Headshot o nada. Si le pegas en el cuerpo, el muerto sigue caminando y te mira feo." },
    { "renato", "El Wertres es tan alto que lo usaria de muro pa hacer boost. Ya le pregunte. Dijo que no." },
    { "renato", "Los primos se fueron solos al cerro otra vez. El Matric ya esta armando un mapa de calor de donde van." },
    { "renato", "El Akagami juega LoL. Yo juego Counter. Igual nos queremos, pero no hablamos de eso." },
    { "renato", "Soy flaco, pero eso es una ventaja: hitbox chica. Los muertos no me atinan." },
    { "renato", "Extrano el ping bajo y el olor del ciber. Aca huele a muerto y no hay ping." },
    { "renato", "Si tiras una flash, avisa. Si tiras una molotov, avisa dos veces. Lo aprendi a la mala." },
    { "renato", "El Luengo no entiende el Counter, pero me guarda comida cuando me quedo de guardia. Es mi support." },
}

-- Lo que dicen los de Sous de sus amigos (roles de Sous.lua).
Narrador.Charlas.sous_amigos_menciones = {
    { "hanz", "El Waton Ju es mi primo, broder. Lo quiero harto. Igual nunca llego a nivel 70, vale." },
    { "hanz", "Con el Waton vivimos juntos en Iquique hasta que yo tenia doce. Despues me fui a Arica, a mi tallercito." },
    { "hanz", "Si alguien dice que soy de Antofagasta, le tiro una gubia, broder. Nunca vivi ahi. Preguntenle al Waton." },
    { "martin_z", "El Waton dice que llego a 68. Yo lo vi en 64. Los numeros no mienten. El Waton si." },
    { "martin_a", "El Clau pregunta todos los dias si puede entrar a Sous. Un dia le voy a decir que si, mi bro." },
    { "martin_a", "Ya agregue al Luengo a la lista de turnos. Cocina. Siempre. Es lo mejor pa todos." },
    { "benjamin", "El Clau es buena onda, bro. Si tiene polera y jeans apretados, igual. Cada uno con su estilo." },
    { "benjamin", "Hermano, el Luengo le puso proteina al arroz por mi. Eso es amistad. Eso es amor, bro." },
    { "david", "El Clau no es de Sous, pero esta en todas. Sociologicamente, ya es de Sous." },
    { "david", "Anote que el Clau aparecio en las ultimas cinco salidas. Nadie lo invito a ninguna." },
    { "bastian", "Oe, el Luengo cocina mejor que mi abuela. No le digan a mi abuela, po." },
    { "bastian", "El Renaaaaaato juega Counter, loco. Le digo que juegue LoL y me mira como si lo hubiera insultado." },
    { "cristian", "El Renaaaaaato tiene buena punteria, compadre. Lastima que grite 'rush B' cada vez que dispara." },
    { "jorge", "El Luengo lleva las cuentas de la despensa mejor que Meulen, manito. Y el si me muestra los numeros." },
    { "jorge", "Le pedi al Luengo comida pa subir al cerro con el primo y se rio. No se de que, sangre." },
    { "cristobal", "El Luengo es casi tan alto como yo, wn. Por fin alguien con quien hablar sin mirar pa abajo." },
    { "cristobal", "El Renaaaaaato es flaco, hermanito. Hay que darle de comer. Luengo, ayudame." },
}
