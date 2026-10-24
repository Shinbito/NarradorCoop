-- Narrador Co-op: rumores. Antes de lanzar una historia, el Director la siembra como rumor
-- durante 24 a 48 horas: los misioneros, los vecinos y Sous (si son aliados) lo comentan cuando
-- tienes cerca. Si vas a mirar el lugar antes, encuentras algo y la historia parte con ventaja.
-- Uno de cada cinco rumores es falso: igual hay algo en el lugar (una mochila o bolso en el suelo
-- de la sala del rumor, con el premio y la nota adentro; ver Director.revisarVisitas).
--   bolsa     nombre del bolso que queda en la sala (falsos)
--   hallazgo  aviso al llegar; {donde} = la sala y el piso ("una oficina de la planta baja")
--
--   lugar   el mismo spec de la accion "lugar" de la historia (se elige antes y se respeta)
--   id      id del lugar en la historia
--   lineas  { misionero = {...}, vecino = {...}, sous = { { rol, texto }, ... } }
--           {lugar} se reemplaza por la descripcion del lugar.
-- Sin tildes ni enies a proposito.

Narrador = Narrador or {}
local Rum = Narrador.Rumores or {}
Narrador.Rumores = Rum

Rum.HISTORIAS = {
    horda_en_camino = {
        lineas = {
            misionero = { "Dicen que al norte se esta juntando una horda grande. De esas que barren pueblos.",
                          "Un explorador paso corriendo esta manana. No quiso parar. Mala senal." },
            vecino = { "Anoche se escuchaba un ruido raro al norte. Como un rio, pero no era agua.",
                       "Vi aves huyendo todas para el mismo lado. Algo viene." },
            sous = { { "cristian", "Compadre, desde el cerro se ve polvo al norte. Mucho polvo. Eso no es viento." },
                     { "martin_z", "Hay mas muertos caminando juntos que de costumbre. Lo anoto, por si acaso." },
                     { "jorge", "Manito, si viene algo grande, hay que tener latas guardadas. Ya conte." } },
        },
    },
    alijo_custodiado = {
        id = "alijo", lugar = { salas = { "warehouse", "storageunit", "factorystorage", "policestorage", "gunstorestorage" },
            respaldo = { "garagestorage", "storage" }, min = 200, max = 1000 },
        premio = { { "Base.Bullets9mm" }, { "Base.Bandage" } },
        lineas = {
            misionero = { "Un tipo herido paso preguntando por alguien de confianza. Hablaba de provisiones en {lugar}.",
                          "Se dice que alguien escondio cosas en {lugar} antes de morir. Rumores, nada mas." },
            vecino = { "Escuche que en {lugar} hay algo guardado. Yo no voy ni loco." },
            sous = { { "jorge", "Broder, alguien comento de un alijo en {lugar}. Si es verdad, es plata en el banco." },
                     { "bastian", "Oe, dicen que en {lugar} hay cosas. Yo voy si alguien me acompana, po." } },
        },
    },
    sobreviviente_acorralada = {
        id = "casa", lugar = { salas = { "livingroom", "kitchen", "bedroom" }, min = 120, max = 600 },
        premio = { { "Base.Bandage" } },
        lineas = {
            misionero = { "Anoche se escuchaban gritos por {lugar}. Una mujer, creo." },
            vecino = { "Hay una casa en {lugar} con muertos golpeando la puerta. Alguien sigue adentro." },
            sous = { { "david", "Escuche gritos para el lado de {lugar}. No se si alguien fue." },
                     { "cristobal", "Hermanito, hay alguien atrapado por {lugar}. Ojala alguien la saque, oye." } },
        },
    },
    trueque_trampa = {
        id = "punto", lugar = { salas = { "grocery", "gasstore", "grocerystorage" }, respaldo = { "warehouse", "storage" }, min = 200, max = 900 },
        premio = { { "Base.Bullets9mm" } },
        lineas = {
            misionero = { "Hay unos tipos ofreciendo trueques por {lugar}. Demasiado buenos para ser verdad.",
                          "Si alguien te ofrece comida por remedios, desconfia. Hay gente rondando {lugar}." },
            vecino = { "Me ofrecieron cambiar latas por pastillas en {lugar}. No fui. Tenian cara de algo." },
            sous = { { "martin_z", "Un trueque generoso en {lugar}. Nadie es generoso ahora. Es una trampa." },
                     { "benjamin", "Bro, dicen que en {lugar} cambian cosas buenas. Yo iria, hermano. Bueno, iria acompanado." } },
        },
    },
    el_desertor = {
        lineas = {
            misionero = { "La Guardia anda buscando a uno de los suyos. Se les escapo. Lo quieren de vuelta. O muerto.",
                          "Vi una patrulla de la Guardia pasar. Preguntaban por un soldado joven." },
            vecino = { "Paso un camion militar preguntando por un desertor. No me gusto como preguntaban." },
            sous = { { "martin_a", "Cabros, la Guardia anda buscando a alguien. Uno, no nos metemos. Dos, si viene, vemos." },
                     { "hanz", "Broder, vi milicos preguntando por un cabro. Pobre del que encuentren, vale." } },
        },
    },
    hijo_perdido = {
        id = "escuela", lugar = { salas = { "classroom" }, min_iguales = 2, respaldo = { "schoolstorage", "office", "livingroom" }, min = 200, max = 900 },
        premio = { { "Base.Bandage" }, { "Base.TinnedBeans", "Base.CannedBeans" } },
        lineas = {
            misionero = { "Un nino fue solo a {lugar} a buscar comida. No lo han visto volver.",
                          "Hay una madre preguntando por su hijo en todos lados. Dice que fue a {lugar}." },
            vecino = { "Vi un nino entrar a {lugar} con una mochila. Iba solo. Nadie lo vio salir." },
            sous = { { "cristobal", "Hermanito, un cabro chico se metio a {lugar}. Solo, wn. Eso no me gusta nada." },
                     { "bastian", "Oe, una senora anda llorando por su hijo. Dice que fue a {lugar}, po." } },
        },
    },
    asalto_nocturno = {
        lineas = {
            misionero = { "Hay una banda contando ventanas en los refugios de la zona. Cuidense de noche." },
            vecino = { "Vi gente armada mirando casas con binoculares. No eran de por aca." },
            sous = { { "martin_z", "Hay una banda estudiando refugios. Contaron nuestras ventanas tambien. Dos veces." },
                     { "martin_a", "Cabros, esta semana guardia doble. Uno, nadie duerme solo. Dos, nadie sale de noche." } },
        },
    },
}

-- Rumores falsos: no llevan a ninguna historia, pero en el lugar siempre hay "algo".
Rum.FALSOS = {
    { lugar = { salas = { "warehouse", "garagestorage", "storageunit" }, min = 200, max = 800 },
      lineas = { misionero = { "Dicen que en {lugar} un grupo dejo armas antes de irse. Yo no lo creeria tanto." },
                 vecino = { "Me contaron que en {lugar} hay un arsenal. Tambien me contaron que la luna es de queso." },
                 sous = { { "benjamin", "Bro, dicen que en {lugar} hay armas. No se quien dice. Dicen." } } },
      premio = { { "Base.Bullets9mm" }, { "Base.Bandage" } },
      nota = "Si llegaste hasta aca por el chisme, bienvenido al club. Yo tambien vine por eso. Te deje un poco de lo que traia." },
    { lugar = { salas = { "livingroom", "kitchen", "bedroom" }, min = 150, max = 700 },
      lineas = { misionero = { "Se habla de un sobreviviente con mucha comida en {lugar}. Nadie lo ha visto." },
                 vecino = { "Dicen que en {lugar} vive alguien que reparte comida. Si es verdad, yo me mudo." },
                 sous = { { "jorge", "Manito, dicen que en {lugar} hay alguien con despensa llena. Habria que ver." } } },
      premio = { { "Base.TinnedBeans", "Base.CannedBeans" } },
      nota = "Me fui. La comida se acabo hace rato. Lo que quedaba, te lo deje. No le creas a todo lo que se dice." },
    { lugar = { salas = { "church", "classroom", "office" }, min = 200, max = 800 },
      lineas = { misionero = { "Unos dicen que en {lugar} se juntan sobrevivientes. Otros que es una trampa. Yo no se." },
                 vecino = { "Se escuchaba musica en {lugar} anoche. Musica, en el fin del mundo." },
                 sous = { { "bastian", "Oe, dicen que anoche habia musica en {lugar}, po. Carrete apocaliptico." } } },
      premio = { { "Base.Battery" }, { "Base.Radio", "Base.Bandage" } },
      nota = "Era una radio a pilas. Se le acabaron. Llevatela si quieres." },
    -- Los pasos de Eduardo Giovanns: donde estuvo, deja algo para el que viene detras.
    { lugar = { salas = { "gasstore", "grocery", "policeoffice", "firestorage" }, min = 250, max = 900 },
      lineas = { misionero = { "Dicen que Eduardo, el que anda ayudando gente, paso por {lugar}. Dicen que deja cosas para los que vienen atras." },
                 vecino = { "Un tal Eduardo limpio {lugar} solo, la semana pasada. Mi primo lo vio. Bueno, mi primo dice." },
                 sous = { { "cristian", "Wn, dicen que Eduardo, el leyenda, estuvo en {lugar}. Hay que ir, po." } } },
      premio = { { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.Bandage" }, { "Base.TinnedBeans", "Base.CannedBeans" } },
      nota = "Si llegaste hasta aca, vas por buen camino. Deje esto para el que venga detras. Cuida a la gente. - E.G.",
      bolsa = "Mochila de E.G.",
      hallazgo = "Ni rastro de Eduardo. Pero alguien dejo una mochila marcada E.G. en el suelo de {donde}. Revisala." },
    { lugar = { salas = { "classroom", "church", "livingroom" }, min = 250, max = 900 },
      lineas = { misionero = { "Una senora juraba que Eduardo, el de las historias, la saco de {lugar}. Yo le creo." },
                 vecino = { "En {lugar} hay una pared con nombres. Al final dice 'Eduardo estuvo aqui'." },
                 sous = { { "martin_a", "Bro, en {lugar} dicen que hay una firma de Eduardo. El leyenda. Raro pero ya." } } },
      premio = { { "Base.FirstAidKit", "Base.Bandage" }, { "Base.WaterBottleFull", "Base.WaterBottle" } },
      nota = "Aca dormimos siete. Se fueron todos al norte, vivos. Si encuentras gente, sacala. Alguien tiene que hacerlo. - E.G.",
      bolsa = "Mochila de E.G.",
      hallazgo = "La pared con nombres no esta, pero hay una mochila marcada E.G. en el suelo de {donde}. Revisala." },
}

return Rum
