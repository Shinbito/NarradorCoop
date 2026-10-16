-- Narrador Co-op: generador de encargos de los misioneros.
-- Cada encargo se arma sorteando nueve piezas: cliente (un vecino con nombre y oficio),
-- tipo, lugar, objetivo, condicion, complicacion, giro, pago y texto (armado con frases en
-- la voz de cada misionero). Los tipos pesan segun lo que necesita cada pueblo (comida,
-- medicina, defensa, energia). Los arcos que ejecutan cada tipo estan en
-- shared/Narrador/Arcos/Generados.lua.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorReputacion"
require "Narrador/Arcos/Generados"

local Defs, Mundo, Motor, C, R = Narrador.Defs, Narrador.Mundo, Narrador.Motor, Narrador.Contactos, Narrador.Reputacion
local floor = math.floor

local G = Narrador.Generador or {}
Narrador.Generador = G

-- ---------------------------------------------------------------------------
-- Datos
-- ---------------------------------------------------------------------------

G.NOMBRES_H = { "Walt", "Hector", "Earl", "Gus", "Carl", "Leroy", "Dale", "Frank", "Roy", "Wayne", "Bobby", "Clyde",
    "Vernon", "Floyd", "Hank", "Dewey", "Harlan", "Buck", "Otis", "Lester", "Merle", "Virgil", "Rufus", "Jesse" }
G.NOMBRES_M = { "Doris", "Linda", "Martha", "Ruth", "Betty", "Peggy", "Judy", "Nancy", "Carol", "Sharon", "Donna",
    "Wanda", "Gloria", "Joyce", "Brenda", "Darla", "Opal", "Faye", "Mae", "Lorene", "Edna", "Hazel", "Irene", "Velma" }
G.APELLIDOS = { "Pruitt", "Ferris", "Lindqvist", "Beaumont", "Tackett", "Caudill", "Spurlock", "Mullins", "Combs",
    "Napier", "Sizemore", "Gentry", "Bowling", "Puckett", "Stidham", "Whitt", "Collier", "Rowe", "Slone", "Hensley",
    "Begley", "Fugate", "Couch", "Noble", "Amburgey", "Ritchie", "Shepherd", "Baker" }

-- Perfiles civiles amistosos de A-Life por sexo (para que el nombre calce con el cuerpo).
G.PERFILES_H = { "k93_hensley_family_02", "k93_hensley_family_05", "k93_hensley_family_06", "k93_hensley_family_09",
    "k93_truckstop_02", "k93_truckstop_03", "k93_truckstop_05", "k93_truckstop_08", "k93_truckstop_10",
    "k93_red_cross_03", "k93_red_cross_06", "k93_red_cross_08", "k93_county_ems_04", "k93_county_ems_06",
    "k93_stockyard_02", "k93_stockyard_03", "k93_stockyard_05", "k93_stockyard_08", "k93_kessinger_02",
    "k93_kessinger_06", "k93_kessinger_10", "k93_vfd_02", "k93_vfd_03", "k93_vfd_06" }
G.PERFILES_M = { "k93_hensley_family_03", "k93_hensley_family_08", "k93_red_cross_02", "k93_red_cross_04",
    "k93_red_cross_05", "k93_red_cross_07", "k93_red_cross_09", "k93_county_ems_02", "k93_county_ems_03",
    "k93_county_ems_05", "k93_prather_03", "k93_prather_04", "k93_prather_05", "k93_prather_07", "k93_vfd_05",
    "k93_vfd_09", "k93_stockyard_04", "k93_stockyard_07", "k93_kessinger_04", "k93_kessinger_05",
    "k93_truckstop_07", "k93_truckstop_09" }

-- Oficio del cliente: con que paga (ademas del botin del misionero).
G.OFICIOS = {
    { id = "mecanico", h = "el mecanico", m = "la mecanica", pago = { { "Base.Wrench" }, { "Base.Screwdriver" }, { "Base.DuctTape" }, { "Base.CarBattery1", "Base.Screws" } } },
    { id = "enfermera", h = "el enfermero", m = "la enfermera", pago = { { "Base.Bandage" }, { "Base.AlcoholBandage", "Base.Bandage" }, { "Base.Pills" }, { "Base.Antibiotics", "Base.Pills" } } },
    { id = "granjero", h = "el granjero", m = "la granjera", pago = { { "Base.CarrotSeed", "Base.TomatoSeed", "Base.Carrots" }, { "Base.Potato" }, { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Apple" } } },
    { id = "policia", h = "el ex policia", m = "la ex policia", pago = { { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.ShotgunShells" }, { "Base.Nightstick" } } },
    { id = "carpintero", h = "el carpintero", m = "la carpintera", pago = { { "Base.Nails" }, { "Base.Hammer" }, { "Base.Plank" }, { "Base.Saw" } } },
    { id = "costurera", h = "el sastre", m = "la costurera", pago = { { "Base.Needle" }, { "Base.Thread" }, { "Base.RippedSheets", "Base.Sheet" }, { "Base.Jacket_Padded" } } },
    { id = "cocinera", h = "el cocinero", m = "la cocinera", pago = { { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Pot" }, { "Base.Salt" } } },
    { id = "camionero", h = "el camionero", m = "la camionera", pago = { { "Base.PetrolCan", "Base.EmptyPetrolCan" }, { "Base.Cigarettes" }, { "Base.Flashlight", "Base.HandTorch" } } },
    { id = "profesora", h = "el profesor", m = "la profesora", pago = { { "Base.Book" }, { "Base.Notebook" }, { "Base.Pencil" }, { "Base.Book" } } },
    { id = "cazador", h = "el cazador", m = "la cazadora", pago = { { "Base.HuntingKnife" }, { "Base.223Bullets", "Base.Bullets9mm" }, { "Base.TrapCage", "Base.Twine" } } },
    { id = "electricista", h = "el electricista", m = "la electricista", pago = { { "Base.ElectronicsScrap" }, { "Base.Battery" }, { "Base.Radio", "Base.WalkieTalkie2" } } },
    { id = "pastora", h = "el diacono", m = "la catequista", pago = { { "Base.Candle" }, { "Base.WaterBottleFull", "Base.Water" }, { "Base.Bread", "Base.TinnedBeans" } } },
}

G.NIVELES = {
    facil = { min = 150, max = 600, zombis = { 6, 10 }, plazo = 48, chanceComp = 25, chanceGiro = 20, chanceCond = 20,
        bandidos = { 1, 1 }, chanceBandidos = 0, txtDistancia = "cerca, entre 150 y 600 metros", pagoExtra = 1 },
    medio = { min = 300, max = 1000, zombis = { 14, 22 }, refuerzo = { 6, 10 }, plazo = 72, chanceComp = 40, chanceGiro = 30,
        chanceCond = 30, bandidos = { 1, 2 }, chanceBandidos = 33, txtDistancia = "entre 300 metros y un kilometro", pagoExtra = 2 },
    dificil = { min = 500, max = 1600, zombis = { 28, 40 }, refuerzo = { 12, 18 }, plazo = 96, chanceComp = 60, chanceGiro = 40,
        chanceCond = 40, bandidos = { 2, 4 }, chanceBandidos = 100, txtDistancia = "lejos, hasta un kilometro y medio", pagoExtra = 3 },
}

-- Tipos: peso base y necesidades del pueblo que lo empujan.
G.TIPOS = {
    buscar = { peso = 10, nec = { "medicina", "energia" }, titulo = "Buscar algo" },
    recuerdo = { peso = 6, nec = {}, titulo = "Un recuerdo" },
    recolectar = { peso = 8, nec = { "comida", "medicina", "energia" }, titulo = "Juntar cosas" },
    entregar = { peso = 7, nec = { "comida" }, titulo = "Llevar un paquete" },
    rescate = { peso = 7, nec = { "defensa" }, titulo = "Un rescate" },
    investigar = { peso = 6, nec = {}, titulo = "Averiguar que paso" },
    alijo = { peso = 6, nec = { "comida" }, titulo = "Un alijo" },
    contrarreloj = { peso = 6, nec = { "medicina" }, titulo = "Contrarreloj" },
    limpieza = { peso = 7, nec = { "defensa" }, titulo = "Limpieza" },
    reconocimiento = { peso = 5, nec = { "defensa" }, titulo = "Reconocimiento" },
    defensa = { peso = 4, nec = { "defensa" }, titulo = "Defensa" },
    posta = { peso = 4, nec = {}, titulo = "La posta" },
    instalar = { peso = 5, nec = { "energia", "defensa" }, titulo = "Instalar algo" },
}

G.SALAS_CASA = { "livingroom", "kitchen", "bedroom" }

-- Que se busca (tipo buscar): segun la necesidad.
G.BUSCAR = {
    { nec = "medicina", nombre = "Antibioticos para {cliente_corto}", tipo = { "Narrador.Antibioticos", "Base.Antibiotics", "Base.Pills" },
      salas = { "pharmacy", "pharmacystorage", "medical", "medicalstorage" }, respaldo = { "bathroom", "kitchen" },
      que = "antibioticos" },
    { nec = "energia", nombre = "Bateria para {cliente_corto}", tipo = { "Base.CarBattery1", "Base.CarBattery2", "Base.Battery" },
      salas = { "garagestorage", "mechanic", "gasstore", "warehouse" }, respaldo = { "storage", "livingroom" },
      que = "una bateria de auto" },
    { nombre = "Paquete de {cliente_corto}", tipo = { "Narrador.PaqueteMisionero", "Base.Briefcase", "Base.Bag_Satchel" },
      salas = { "warehouse", "storageunit", "garagestorage", "factorystorage" }, respaldo = { "livingroom", "kitchen" },
      que = "un paquete que dejo escondido", ruido = true },
    { nombre = "Planos de {ciudad}", tipo = { "Narrador.PlanosPueblo", "Base.Notebook" },
      salas = { "office", "classroom", "policeoffice" }, respaldo = { "livingroom" }, que = "los planos del pueblo" },
    { nombre = "Radio de largo alcance", tipo = { "Base.WalkieTalkie3", "Base.WalkieTalkie2", "Base.RadioRed" },
      salas = { "policestorage", "electronicsstore", "office" }, respaldo = { "livingroom", "garagestorage" },
      que = "una radio de largo alcance" },
    { nombre = "Caja de herramientas de {cliente_corto}", tipo = { "Base.Toolbox", "Base.Wrench", "Base.Hammer" },
      salas = { "garagestorage", "mechanic", "warehouse" }, respaldo = { "storage", "kitchen" }, que = "su caja de herramientas" },
}

G.RECUERDOS = {
    { nombre = "Foto de la familia {cliente_apellido}", tipo = { "Narrador.FotoSous", "Base.Photo", "Base.Notebook" }, que = "una foto de su familia" },
    { nombre = "Reloj de {cliente_corto}", tipo = { "Base.WristWatch_Right_ClassicGold", "Base.WristWatch_Left_ClassicBlack", "Base.Notebook" }, que = "el reloj de su papa" },
    { nombre = "Carta de {cliente_corto}", tipo = { "Base.SheetPaper2", "Base.Notebook" }, que = "una carta que nunca alcanzo a leer" },
    { nombre = "Muneco del hijo de {cliente_corto}", tipo = { "Base.Doll", "Base.ToyBear", "Base.Notebook" }, que = "el muneco de su hijo" },
    { nombre = "Anillo de {cliente_corto}", tipo = { "Base.Ring_Right_RingFinger_Gold", "Base.Necklace_Gold", "Base.Notebook" }, que = "su anillo de matrimonio" },
}

G.RECOLECTAR = {
    { nec = "comida", nombre = "latas de comida", tipos = { "Base.TinnedBeans", "Base.CannedBeans", "Base.TinnedSoup", "Base.CannedSoup",
        "Base.CannedCorn", "Base.CannedPeas", "Base.CannedTomato", "Base.CannedChili", "Base.TunaTin", "Base.CannedSardines",
        "Base.CannedPotato2", "Base.CannedCarrots2", "Base.Dogfood" }, cant = { facil = 4, medio = 8, dificil = 14 } },
    { nec = "energia", nombre = "troncos", tipos = { "Base.Log" }, cant = { facil = 3, medio = 6, dificil = 10 } },
    { nec = "defensa", nombre = "tablas", tipos = { "Base.Plank" }, cant = { facil = 6, medio = 12, dificil = 20 } },
    { nec = "medicina", nombre = "vendas", tipos = { "Base.Bandage", "Base.AlcoholBandage", "Base.RippedSheets" }, cant = { facil = 4, medio = 8, dificil = 14 } },
    { nec = "medicina", nombre = "frascos de pastillas", tipos = { "Base.Pills", "Base.PillsBeta", "Base.PillsAntiDep", "Base.PillsSleepingTablets", "Base.PillsVitamins" },
      cant = { facil = 2, medio = 4, dificil = 6 } },
    { nec = "energia", nombre = "bidones de gasolina", tipos = { "Base.PetrolCan", "Base.JerryCan" }, cant = { facil = 1, medio = 2, dificil = 3 } },
    { nec = "comida", nombre = "botellas de agua", tipos = { "Base.WaterBottleFull", "Base.Water", "Base.WaterPopBottle" }, cant = { facil = 3, medio = 6, dificil = 10 } },
}

G.REMEDIOS = {
    { nombre = "antibioticos", tipos = { "Base.Antibiotics", "Narrador.Antibioticos" } },
    { nombre = "vendas limpias", tipos = { "Base.Bandage", "Base.AlcoholBandage" } },
    { nombre = "analgesicos", tipos = { "Base.Pills" } },
    { nombre = "pastillas para dormir", tipos = { "Base.PillsSleepingTablets", "Base.Pills" } },
    { nombre = "betabloqueadores", tipos = { "Base.PillsBeta", "Base.Pills" } },
}

G.INSTALAR = {
    { nec = "defensa", nombre = "una barricada", lista = "4 tablas y clavos",
      req = { { { "Base.Plank" }, 4 }, { { "Base.Nails" }, 1 } }, salas = { "livingroom", "kitchen", "grocery", "church" } },
    { nec = "energia", nombre = "un generador", lista = "un generador",
      req = { { { "Base.Generator" }, 1 } }, salas = { "garagestorage", "warehouse", "kitchen", "office" } },
    { nec = "defensa", nombre = "una alarma de ruido lejos del pueblo", lista = "un reloj despertador o una radio",
      req = { { { "Base.AlarmClock2", "Base.AlarmClock", "Base.Radio", "Base.RadioBlack", "Base.RadioRed" }, 1 } },
      salas = { "gasstore", "warehouse", "barn", "farmstorage" } },
    { nec = "energia", nombre = "una antena de radio", lista = "una radio y cinta",
      req = { { { "Base.Radio", "Base.RadioBlack", "Base.RadioRed", "Base.WalkieTalkie2" }, 1 }, { { "Base.DuctTape", "Base.Scotchtape" }, 1 } },
      salas = { "office", "policeoffice", "church" } },
}

G.JEFES = {
    { outfit = "Fireman", nombre = "un bombero enorme" }, { outfit = "Police", nombre = "un policia" },
    { outfit = "Chef", nombre = "el cocinero" }, { outfit = "Doctor", nombre = "un medico" },
    { outfit = "Priest", nombre = "un cura" }, { outfit = "Hunter", nombre = "un cazador" },
}

G.SALAS_LIMPIEZA = { "warehouse", "classroom", "grocery", "church", "motelroom", "office", "gasstore", "policeoffice" }
G.SALAS_ALIJO = { "warehouse", "storageunit", "garagestorage", "policestorage", "gunstorestorage", "grocerystorage" }
G.SALAS_TRABAJO = { "office", "warehouse", "garagestorage", "grocery", "policeoffice", "classroom", "motelroom" }

G.CONDICIONES = {
    plazo = { texto = "Pero lo necesito rapido: tienes la mitad del tiempo de siempre. Pago mas, eso si.", resumen = "Con apuro (menos plazo, mas pago)" },
    noche = { texto = "Y entregamelo de noche, entre las diez y las cinco. Nadie tiene que verte llegar. Pago extra por eso.", resumen = "Entregar de noche (pago extra)" },
    sigilo = { texto = "Haz el menor ruido posible: si dejas pocos muertos por ahi, te pago extra.", resumen = "Sin hacer ruido (pocos muertos = pago extra)" },
}
G.COMPLICACIONES = { "horda", "bandidos", "competencia", "alarma" }

-- ---------------------------------------------------------------------------
-- Voz de cada misionero
-- ---------------------------------------------------------------------------
G.VOZ = {
    muldraugh = {
        saludo = { "Soldado, a la orden.", "Firme. Hay mision.", "Atencion, civil.", "Tengo pega. Escuche bien.", "Al pie, que esto es serio." },
        plazo = { "Tiene {plazo_txt}. Ni un minuto mas.", "Plazo: {plazo_txt}. Lo anoto en la libreta.", "{plazo_txt}. Despues no me sirve." },
        despedida = { "Retirese.", "Vuelva entero, es una orden.", "Eso es todo.", "Mueva esas piernas." },
        gracias = { "Mision cumplida. Lo anoto con lapiz pasta.", "Buen trabajo, soldado. Su pago.", "Cumplio. Eso es lo unico que pido.",
            "Afirmativo. Aqui tiene lo suyo." },
        frecuente = { "{cliente_corto} otra vez. Ya tiene expediente propio.", "Usted ya conoce a {cliente_corto}. Repite pedido." },
    },
    westpoint = {
        saludo = { "Mijito, ven, ven.", "Ay, que bueno que llegaste.", "Pasa, que tengo un recado.", "Mijo, sientate un poquito.", "No me pongas esa cara, que es facil." },
        plazo = { "Tienes {plazo_txt}, no mas.", "Y apurate, que en {plazo_txt} ya no sirve.", "Te doy {plazo_txt}. Si te demoras, me preocupo." },
        despedida = { "Cuidate harto.", "Y toma agua antes de salir.", "Anda con Dios. O con escopeta.", "Vuelve entero, que te quiero." },
        gracias = { "Ay, mijito, gracias. Toma, te lo ganaste.", "Sabia que podia contar contigo.", "Eres un sol. Toma tu pago.",
            "Esto es pa ti. No me discutas." },
        frecuente = { "La {cliente_corto} otra vez, mijito. Ya es de la casa.", "Otro recado de {cliente_corto}. Esa no para." },
    },
    riverside = {
        saludo = { "Hijo mio, ven.", "Que la paz este contigo. Y el trabajo tambien.", "Bienaventurado el que llega cuando lo necesito.", "Hijo, tengo una mision.", "Escucha, oveja." },
        plazo = { "El Senor da plazos, y este es de {plazo_txt}.", "Tienes {plazo_txt}. Despues rezo por otra cosa.", "{plazo_txt}, hijo. Ni la paciencia de Job alcanza para mas." },
        despedida = { "Ve en paz. Y si no hay paz, ve con escopeta.", "Rezo por ti. Cuando me acuerde.", "Amen. Ahora anda.", "Que Dios te acompane. Yo no puedo." },
        gracias = { "Bendito seas, hijo. Tu pago, como prometi.", "Milagro. Bueno, trabajo. Pero parece milagro.", "Gracias, hijo. Esto es tuyo.",
            "Lo hiciste. Ni yo tenia tanta fe." },
        frecuente = { "{cliente_corto} vuelve a pedir. Es de los fieles, hijo.", "Otra vez {cliente_corto}. El Senor le dio muchas necesidades." },
    },
    rosewood = {
        saludo = { "Mijo, llegaste justo.", "Ven pa aca, que hay pega.", "Bienvenido a la bencinera. Hay encargo.", "No hay bencina, pero hay trabajo.", "Mira lo que tengo pa ti." },
        plazo = { "Tienes {plazo_txt}. Despues se pone rancio, como el pan.", "Y apurate, que esto no espera ni a la bencina: {plazo_txt}.", "Te doy {plazo_txt}. Ni un dia mas." },
        despedida = { "Anda, mijo.", "Y si ves cigarros, son mios.", "Cuidate, que no tengo otro como tu.", "Ya, anda, que se hace tarde." },
        gracias = { "Ese es mi mijo. Toma lo tuyo.", "Pagado y bien pagado.", "Ves que eres bueno pa esto? Toma.", "Lo prometido es deuda. Aca esta." },
        frecuente = { "Otra vez {cliente_corto}, mijo. Cliente fiel.", "{cliente_corto} vuelve a pedir. Ya le abri cuenta." },
    },
}

-- Pedido por tipo (en boca del misionero). Placeholders: {cliente}, {oficio}, {objeto_que}, {lugar:objetivo}...
G.PEDIDOS = {
    buscar = { "{cliente}, {oficio} del pueblo, necesita {objeto_que}. Deberia haber en {lugar:objetivo}.",
        "Me pidieron {objeto_que} para {cliente}, {oficio}. La ultima vez que alguien vio algo asi fue en {lugar:objetivo}." },
    recuerdo = { "{cliente} perdio {objeto_que} cuando arranco de su casa. Quedo en {lugar:objetivo}. No es comida, no es bala, pero para {cliente} es todo.",
        "Hay un encargo raro: {objeto_que} de {cliente}. Esta en {lugar:objetivo}. Me dijo que sin eso no duerme." },
    recolectar = { "{cliente}, {oficio}, necesita {cantidad} {recolectar_nombre}. De donde los saques es asunto tuyo.",
        "Hacen falta {cantidad} {recolectar_nombre} para {cliente}. Junta y me los traes." },
    entregar = { "Toma este paquete. Es para {cliente}, que esta en {lugar:objetivo}. No lo abras.",
        "Llevale esto a {cliente} en {lugar:objetivo}. Paga {cliente_corto} cuando lo reciba." },
    rescate = { "{cliente}, {oficio}, quedo atrapado en {lugar:objetivo}. Sacalo de ahi, rapido.",
        "Uno de los nuestros, {cliente}, no puede salir de {lugar:objetivo}. Hay muertos en la puerta." },
    investigar = { "{cliente} salio a buscar a {buscado} a {lugar:objetivo} hace dias. Averigua que paso.",
        "{buscado} se perdio en {lugar:objetivo}. {cliente} no come de la preocupacion. Anda a ver." },
    alijo = { "Se de un alijo en {lugar:objetivo}. Me lo conto {cliente}. Lo que encuentres es tuyo.",
        "{cliente}, {oficio}, dejo provisiones guardadas en {lugar:objetivo} y no puede volver. Limpia y quedatelas." },
    contrarreloj = { "{cliente} esta enfermo en {lugar:objetivo}. Necesita {remedio_nombre}, y rapido.",
        "Hay alguien grave en {lugar:objetivo}: {cliente}. Sin {remedio_nombre} no pasa de esta semana." },
    limpieza = { "{lugar:objetivo} esta lleno de muertos. Lo quiero limpio: unos {bajas_meta}. Despues mando gente a ocuparlo.",
        "Necesito {lugar:objetivo} limpio. Calculo que hay {bajas_meta} muertos adentro." },
    reconocimiento = { "Necesito ojos en la zona. Pasa por {puntos} puntos que te voy marcando y anota lo que ves. Empieza por {lugar:p1}.",
        "Hay que saber que se mueve por aca. {puntos} lugares, en orden. El primero es {lugar:p1}." },
    defensa = { "Se viene gente muerta para aca. Necesito que aguantes en {lugar:objetivo} unas {horas_defensa} horas.",
        "Esta noche llegan. Quedate en {lugar:objetivo} y no dejes que pasen. {n_oleadas} oleadas, calculo yo." },
    posta = { "Este paquete tiene que dar la vuelta: {ruta_posta}. No preguntes que lleva.",
        "Una posta: llevas esto donde {nombre_c2}, y de ahi te mandan a otro lado. Ruta: {ruta_posta}." },
    instalar = { "Hay que dejar {instalar_nombre} en {lugar:objetivo}. Lleva {instalar_lista}.",
        "{cliente}, {oficio}, quiere {instalar_nombre} en {lugar:objetivo}. Necesitas {instalar_lista}." },
}

G.TITULOS = {
    buscar = "{objeto_nombre}", recuerdo = "{objeto_nombre}", recolectar = "{cantidad} {recolectar_nombre} para {cliente_corto}",
    entregar = "Un paquete para {cliente_corto}", rescate = "Rescatar a {cliente_corto}", investigar = "Que paso con {buscado}",
    alijo = "El alijo de {cliente_corto}", contrarreloj = "{remedio_nombre} para {cliente_corto}", limpieza = "Limpieza",
    reconocimiento = "Reconocimiento ({puntos} puntos)", defensa = "Aguantar la defensa", posta = "La posta",
    instalar = "{instalar_nombre} para {cliente_corto}",
}

G.RECIBE_POSTA = {
    muldraugh = "Recibido. Lo anoto y sigue la ruta. Firme.",
    westpoint = "Ay, mijito, otra vez esto. Ya, sigue tu camino.",
    riverside = "Recibido, hijo. Que el paquete llegue a su destino. Yo solo bendigo.",
    rosewood = "Aca paso. Se lo paso a quien sigue, mijo.",
}
G.REMATES = {
    "Mijito, dile al Cabo que la cafetera llego. Y que no se haga ilusiones.",
    "Ramiro tejiendo? No te creo. Bueno, si te creo. Es feo.",
    "Esto no se lee delante de nadie. Andate.",
    "Una caja de municion con un mono. Que hombre mas raro.",
    "Un libro de recetas, con una pagina doblada. Mira tu.",
    "Puras semillas. Alguien esta pensando en la primavera.",
}

G.GRACIAS_CLIENTE = { "Llego! Pense que nunca iba a llegar.", "Gracias. De verdad. Toma, esto es tuyo.",
    "No sabes lo que significa esto. Toma, te lo ganaste.", "Al fin. Dile a quien te mando que le debo una." }

G.NECESIDADES = { "comida", "medicina", "defensa", "energia" }
G.COMENTARIOS_NEC = {
    comida = "Esta semana nadie paso hambre en {ciudad}. Eso es tuyo.",
    medicina = "Con esto los enfermos de {ciudad} aguantan otra semana.",
    defensa = "{ciudad} duerme un poco mas tranquilo gracias a ti.",
    energia = "Volvio la luz a una casa de {ciudad}. Una sola, pero algo es algo.",
}

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

local function elegir(lista) return lista[Mundo.azar(#lista)] end
local function chance(p) return Mundo.azar(100) <= (tonumber(p) or 0) end

local function rellenar(texto, vars)
    return (string.gsub(texto, "{([%w_]+)}", function(k)
        local v = vars[k]
        if v ~= nil and type(v) ~= "table" then return tostring(v) end
        return "{" .. k .. "}"
    end))
end

local function plazoTexto(horas)
    if horas < 24 then return floor(horas) .. " horas" end
    local dias = floor(horas / 24 + 0.5)
    return dias == 1 and "un dia" or (dias .. " dias")
end

function G.estado()
    local st = Motor.estado()
    st.gen = st.gen or {}
    local g = st.gen
    g.ultimos = g.ultimos or {}
    g.necesidades = g.necesidades or {}
    g.clientes = g.clientes or {}
    g.ofertas = g.ofertas or {}
    g.puntos = g.puntos or {}
    g.diaNec = g.diaNec or floor(Mundo.horas() / 24)
    g.vecinos = g.vecinos or 0
    return g
end

function G.necesidades(contacto)
    local e = G.estado()
    if e.necesidades[contacto] == nil then
        local n = {}
        for _, k in ipairs(G.NECESIDADES) do n[k] = 25 + Mundo.azar(30) end
        e.necesidades[contacto] = n
    end
    return e.necesidades[contacto]
end

-- Un dia mas: las necesidades suben (en invierno, comida y energia suben mas).
function G.subirNecesidades()
    local e = G.estado()
    local dia = floor(Mundo.horas() / 24)
    if dia <= e.diaNec then return end
    local dias = dia - e.diaNec
    e.diaNec = dia
    local _, mes = Mundo.fecha()
    local invierno = mes == 12 or mes == 1 or mes == 2
    for _, c in ipairs(C.LISTA) do
        local n = G.necesidades(c.id)
        for _, k in ipairs(G.NECESIDADES) do
            local suba = 4
            if invierno and (k == "comida" or k == "energia") then suba = 7 end
            n[k] = math.min(100, n[k] + suba * dias)
        end
    end
end

function G.nombreCliente(sexo)
    sexo = sexo or (Mundo.azar(2) == 1 and "h" or "m")
    local nombre = elegir(sexo == "h" and G.NOMBRES_H or G.NOMBRES_M)
    local apellido = elegir(G.APELLIDOS)
    local perfil = elegir(sexo == "h" and G.PERFILES_H or G.PERFILES_M)
    return { nombre = nombre, apellido = apellido, sexo = sexo, perfil = perfil }
end

-- ---------------------------------------------------------------------------
-- Generacion
-- ---------------------------------------------------------------------------

function G.elegirTipo(contacto, nivel)
    local e = G.estado()
    local nec = G.necesidades(contacto)
    local ultimos = e.ultimos[contacto] or {}
    local candidatos, total = {}, 0
    for id, t in pairs(G.TIPOS) do
        local peso = t.peso
        for _, k in ipairs(t.nec) do peso = peso * (1 + (nec[k] or 0) / 60) end
        if ultimos[1] == id then peso = 0 end
        if ultimos[2] == id then peso = peso * 0.3 end
        if id == "defensa" and nivel == "facil" then peso = peso * 0.5 end
        if peso > 0 then candidatos[#candidatos + 1] = { id = id, peso = peso }; total = total + peso end
    end
    table.sort(candidatos, function(a, b) return a.id < b.id end)
    local tiro = Mundo.azar(math.max(1, floor(total * 10))) / 10
    local acum = 0
    for _, c in ipairs(candidatos) do
        acum = acum + c.peso
        if tiro <= acum then return c.id end
    end
    return candidatos[#candidatos].id
end

-- Elige de una lista dando preferencia a lo que el pueblo necesita.
function G.porNecesidad(lista, contacto)
    local nec = G.necesidades(contacto)
    local total, pesos = 0, {}
    for i, it in ipairs(lista) do
        local p = 10
        if it.nec ~= nil then p = p * (1 + (nec[it.nec] or 0) / 40) end
        pesos[i] = p
        total = total + p
    end
    local tiro = Mundo.azar(math.max(1, floor(total)))
    local acum = 0
    for i, it in ipairs(lista) do
        acum = acum + pesos[i]
        if tiro <= acum then return it end
    end
    return lista[#lista]
end

-- Cliente: a veces uno frecuente (sigue una cadena de pedidos).
function G.elegirCliente(contacto)
    local e = G.estado()
    local lista = e.clientes[contacto] or {}
    local disponibles = {}
    for _, cl in ipairs(lista) do if (cl.veces or 0) < 3 and not cl.residente then disponibles[#disponibles + 1] = cl end end
    if #disponibles > 0 and chance(30) then
        local cl = elegir(disponibles)
        return { nombre = cl.nombre, apellido = cl.apellido, sexo = cl.sexo, perfil = cl.perfil, oficio = cl.oficio, frecuente = true }
    end
    local cl = G.nombreCliente()
    cl.oficio = elegir(G.OFICIOS).id
    return cl
end

local function oficioDe(id)
    for _, o in ipairs(G.OFICIOS) do if o.id == id then return o end end
    return G.OFICIOS[1]
end

-- Arma las variables del encargo. Devuelve { def, vars, lugares, resumen }.
function G.generar(contactoId, nivel, grupo, tipoForzado)
    local c = C.def(contactoId)
    if c == nil then return nil end
    nivel = G.NIVELES[nivel] ~= nil and nivel or "facil"
    local N = G.NIVELES[nivel]
    local tipo = tipoForzado or G.elegirTipo(contactoId, nivel)
    local cl = G.elegirCliente(contactoId)
    local of = oficioDe(cl.oficio)
    local v = {
        tipo = tipo, nivel = nivel, contacto = c.id, contacto_nombre = C.nombreCompleto(c), ciudad = c.ciudad,
        cliente = cl.nombre .. " " .. cl.apellido, cliente_corto = cl.nombre, cliente_apellido = cl.apellido,
        cliente_sexo = cl.sexo, perfil_npc = cl.perfil, nombres_npc = { cliente = { cl.nombre, cl.apellido },
            rehen = { cl.nombre, cl.apellido }, paciente = { cl.nombre, cl.apellido } },
        oficio = cl.sexo == "h" and of.h or of.m, oficio_id = of.id, frecuente = cl.frecuente == true,
        min = N.min, max = N.max, plazo = N.plazo, zombis = N.zombis, refuerzo = N.refuerzo,
        refuerzo_n = N.refuerzo ~= nil and 1 or 0, bandidos = N.bandidos,
        con_bandidos = chance(N.chanceBandidos), zombis_comp = { 20, 30 },
        salas = G.SALAS_CASA, respaldo = { "kitchen", "livingroom" }, pago_lugar = "contacto",
        comp = "ninguna", giro = "ninguno", cond = "ninguna", rep_extra = 0, sigilo_max = 8,
        chetada_extra = 0,
    }
    local resumen = {}
    local function linea(t) resumen[#resumen + 1] = t end

    -- Objetivo segun el tipo.
    if tipo == "buscar" then
        local b = G.porNecesidad(G.BUSCAR, contactoId)
        v.objeto_nombre = rellenar(b.nombre, v); v.objeto_tipo = b.tipo; v.objeto_que = b.que
        v.salas, v.respaldo = b.salas, b.respaldo
        v.necesidad = b.nec
        if b.ruido and chance(N.chanceGiro) then v.giro = "ruido" end
        if v.giro == "ninguno" and chance(N.chanceGiro / 2) then v.giro = "ocupada"; v.salas = G.SALAS_CASA end
    elseif tipo == "recuerdo" then
        local b = elegir(G.RECUERDOS)
        v.objeto_nombre = rellenar(b.nombre, v); v.objeto_tipo = b.tipo; v.objeto_que = b.que
        v.salas = G.SALAS_CASA
        if chance(N.chanceGiro) then v.giro = (Mundo.azar(2) == 1) and "ocupada" or "otra_duena" end
    elseif tipo == "recolectar" then
        local b = G.porNecesidad(G.RECOLECTAR, contactoId)
        v.recolectar_nombre, v.recolectar_tipos = b.nombre, b.tipos
        v.cantidad = b.cant[nivel] or b.cant.facil
        v.necesidad = b.nec
    elseif tipo == "entregar" then
        v.objeto_nombre = "Paquete para " .. v.cliente
        v.objeto_tipo = { "Narrador.PaqueteMisionero", "Base.Briefcase", "Base.Bag_Satchel" }
        v.min, v.max = N.min + 200, N.max + 600
        v.pago_lugar = "objetivo"
        v.gracias_cliente = elegir(G.GRACIAS_CLIENTE)
        v.necesidad = "comida"
    elseif tipo == "rescate" then
        v.salas = { "livingroom", "kitchen", "bedroom", "motelroom", "office" }
        if chance(N.chanceGiro) then v.giro = "no_quiere" end
        v.necesidad = "defensa"
    elseif tipo == "investigar" then
        local b = G.nombreCliente()
        v.buscado = b.nombre .. " " .. b.apellido
        v.perfil_buscado = b.perfil
        v.nombres_buscado = { buscado = { b.nombre, b.apellido } }
        v.salas = { "policeoffice", "office", "warehouse", "livingroom", "church", "grocery" }
        local r = Mundo.azar(10)
        v.giro = r <= 4 and "vivo" or (r <= 7 and "convertido" or "se_fue")
    elseif tipo == "alijo" then
        v.salas, v.respaldo = G.SALAS_ALIJO, { "storage", "kitchen", "livingroom" }
        v.pago_lugar = "objetivo"
        v.necesidad = "comida"
    elseif tipo == "contrarreloj" then
        local r = elegir(G.REMEDIOS)
        v.remedio_nombre, v.remedio_tipos = r.nombre, r.tipos
        v.plazo = ({ facil = 48, medio = 24, dificil = 12 })[nivel]
        if nivel == "dificil" then v.min, v.max = 900, 2000 end
        v.pago_lugar = "objetivo"
        v.necesidad = "medicina"
    elseif tipo == "limpieza" then
        v.salas, v.respaldo = G.SALAS_LIMPIEZA, { "storage", "livingroom" }
        v.bajas_meta = ({ facil = 15, medio = 40, dificil = 80 })[nivel]
        v.zombis = { floor(v.bajas_meta * 0.8), floor(v.bajas_meta * 1.1) }
        if nivel == "dificil" then
            local j = elegir(G.JEFES)
            v.con_jefe, v.jefe_outfit, v.jefe_nombre = true, j.outfit, j.nombre
        end
        v.necesidad = "defensa"
    elseif tipo == "reconocimiento" then
        v.puntos = ({ facil = 2, medio = 3, dificil = 4 })[nivel]
        v.hallazgo_tipo = { "Base.Bullets9mmBox", "Base.TinnedBeans", "Base.Bandage", "Base.WaterBottleFull" }
        for k = 1, 4 do
            local r = Mundo.azar(10)
            local ev = r <= 4 and "nada" or (r <= 7 and "oleada" or (r <= 9 and "objeto" or "bandidos"))
            if ev == "bandidos" and nivel == "facil" then ev = "oleada" end
            v["evento_" .. k] = ev
        end
        v.necesidad = "defensa"
    elseif tipo == "defensa" then
        v.n_oleadas = ({ facil = 2, medio = 4, dificil = 6 })[nivel]
        v.horas_defensa = v.n_oleadas
        for k = 1, 6 do v["ret_" .. k] = (k - 1) * (v.horas_defensa / v.n_oleadas) + 0.1 end
        v.pago_lugar = "objetivo"
        v.necesidad = "defensa"
    elseif tipo == "posta" then
        local otros = {}
        for _, o in ipairs(C.LISTA) do if o.id ~= c.id and C.estado(o.id).x ~= nil then otros[#otros + 1] = o.id end end
        for i = #otros, 2, -1 do local j = Mundo.azar(i); otros[i], otros[j] = otros[j], otros[i] end
        local n = math.min(({ facil = 1, medio = 2, dificil = 3 })[nivel], #otros)
        if n == 0 then return G.generar(contactoId, nivel, grupo, "buscar") end
        v.posta = { c.id }
        local nombres = {}
        for k = 1, n do
            local id = otros[k]
            v.posta[#v.posta + 1] = id
            local d = C.def(id)
            v["id_c" .. (k + 1)] = id
            v["nombre_c" .. (k + 1)] = C.nombreCompleto(d)
            v["recibe_c" .. (k + 1)] = G.RECIBE_POSTA[id]
            v["asalto_" .. (k + 1)] = chance(30)
            nombres[#nombres + 1] = d.nombre .. " (" .. d.ciudad .. ")"
        end
        v.n_posta = n + 1
        v.ultimo = v.posta[#v.posta]
        v.ruta_posta = table.concat(nombres, ", despues ")
        v.objeto_nombre = "Paquete de la posta"
        v.objeto_tipo = { "Narrador.PaqueteMisionero", "Base.Briefcase" }
        v.remate = elegir(G.REMATES)
        v.pago_lugar = "c" .. (n + 1)
        v.plazo = 48 + 24 * n
    elseif tipo == "instalar" then
        local b = G.porNecesidad(G.INSTALAR, contactoId)
        v.instalar_nombre, v.instalar_lista, v.instalar_req = b.nombre, b.lista, b.req
        v.salas = b.salas
        v.necesidad = b.nec
    end

    -- Condicion (no en todos los tipos).
    local conPlazo = tipo ~= "contrarreloj" and tipo ~= "defensa"
    if chance(N.chanceCond) then
        local opciones = { }
        if conPlazo then opciones[#opciones + 1] = "plazo" end
        if tipo == "buscar" or tipo == "recuerdo" or tipo == "recolectar" then opciones[#opciones + 1] = "noche" end
        if tipo == "buscar" or tipo == "recuerdo" or tipo == "instalar" then opciones[#opciones + 1] = "sigilo" end
        if #opciones > 0 then v.cond = elegir(opciones) end
    end
    if v.cond == "plazo" then v.plazo = math.max(8, floor(v.plazo / 2)); v.bonus_cond = true end

    -- Complicacion.
    if tipo ~= "recolectar" and tipo ~= "posta" and tipo ~= "defensa" and chance(N.chanceComp) then
        v.comp = elegir(G.COMPLICACIONES)
        if nivel == "facil" and v.comp == "competencia" then v.comp = "horda" end
    end
    -- Ocupantes (giro de la casa ocupada).
    if v.giro == "ocupada" then
        local a, b = G.nombreCliente("h"), G.nombreCliente("m")
        v.perfil_ocupante, v.perfil_ocupante2 = a.perfil, b.perfil
        v.nombres_ocupantes = { ocupante = { a.nombre, a.apellido }, ocupante2 = { b.nombre, a.apellido } }
    end
    if v.giro == "ruido" then
        v.ruido_premio = Mundo.azar(2) == 1
        v.ruido_texto = v.ruido_premio and "Adentro hay municion envuelta en diarios. Te sacas un poco. Nadie se va a enterar. Creo."
            or "Adentro hay un despertador sonando. Lo apagas tarde: algo se mueve afuera."
        v.ruido_items = { { "Base.Bullets9mmBox", "Base.Bullets9mm" } }
    end

    v.plazo_txt = plazoTexto(v.plazo)
    v.titulo = rellenar(G.TITULOS[tipo] or "Encargo", v)

    -- Texto del pedido en la voz del misionero.
    local voz = G.VOZ[c.id] or G.VOZ.muldraugh
    local partes = { elegir(voz.saludo) }
    if v.frecuente then partes[#partes + 1] = rellenar(elegir(voz.frecuente), v) end
    partes[#partes + 1] = rellenar(elegir(G.PEDIDOS[tipo]), v)
    if v.cond ~= "ninguna" then partes[#partes + 1] = G.CONDICIONES[v.cond].texto end
    if tipo ~= "alijo" then partes[#partes + 1] = rellenar(elegir(voz.plazo), v) end
    partes[#partes + 1] = elegir(voz.despedida)
    v.pedido = table.concat(partes, " ")
    v.gracias = elegir(voz.gracias)
    v.diario_ini = rellenar("{contacto_nombre} ({ciudad}) me encarga: " .. string.lower(G.TIPOS[tipo].titulo) .. ". {titulo}.", v)
    if v.diario_fin == nil then v.diario_fin = rellenar("Encargo cumplido para {contacto_nombre}: {titulo}.", v) end
    v.pago_items = {}
    local n = N.pagoExtra
    for i = 1, n do v.pago_items[#v.pago_items + 1] = of.pago[((i - 1) % #of.pago) + 1] end

    -- Resumen para elegir antes de aceptar.
    linea(G.TIPOS[tipo].titulo .. " (" .. nivel .. "): " .. v.titulo)
    linea("Para: " .. v.cliente .. ", " .. v.oficio .. (v.frecuente and " (cliente frecuente)" or ""))
    if tipo == "posta" then linea("Ruta: " .. v.ruta_posta)
    elseif tipo == "recolectar" then linea("Donde: donde los encuentres")
    elseif tipo == "defensa" then linea("Donde: al lado de " .. c.nombre .. ", " .. v.n_oleadas .. " oleadas")
    else linea("Donde: " .. (tipo == "contrarreloj" and nivel == "dificil" and "otro pueblo" or N.txtDistancia)) end
    linea("Plazo: " .. v.plazo_txt)
    linea("Pago: botin " .. nivel .. " + lo que paga " .. v.oficio)
    if v.cond ~= "ninguna" then linea("Extra: " .. G.CONDICIONES[v.cond].resumen) end
    if v.con_bandidos then linea("Ojo: hay bandidos") end

    local lugares = { contacto = C.lugar(c.id) }
    if tipo == "posta" then
        for k = 2, #v.posta do lugares["c" .. k] = C.lugar(v.posta[k]) end
    end
    return { def = "encargo_gen_" .. tipo, vars = v, lugares = lugares, resumen = resumen, titulo = v.titulo, tipo = tipo }
end

-- Oferta ULTRA: uno de los cuatro de Louisville (ver Contratos.lua).
function G.generarUltra(contactoId)
    local ids = {}
    for _, def in ipairs(Defs.todos()) do if def.encargo_nivel == "ultra" then ids[#ids + 1] = def end end
    if #ids == 0 then return nil end
    local def = elegir(ids)
    return { def = def.id, vars = {}, lugares = { contacto = C.lugar(contactoId) }, titulo = def.titulo,
        resumen = { "ULTRA: " .. tostring(def.titulo), "Donde: Louisville", "Plazo: 7 dias",
            "Pago: legendario a eleccion (arma, traje o auto)" }, ultra = true }
end

-- ---------------------------------------------------------------------------
-- Ofertas: el jugador ve lo que hay antes de aceptar
-- ---------------------------------------------------------------------------

local function cerca(jugador, contactoId)
    -- Un misionero sin campamento todavia no da trabajo (ver C.desbloqueado).
    if C.desbloqueado ~= nil and not C.desbloqueado(contactoId) then return false end
    local x, y = C.posicion(contactoId)
    local px, py = Mundo.posicion(jugador)
    return x ~= nil and px ~= nil and math.sqrt((x - px) ^ 2 + (y - py) ^ 2) <= 10
end

function G.verOfertas(jugador, args)
    local contactoId, nivel = tostring(args.contacto), tostring(args.nivel)
    local c = C.def(contactoId)
    if c == nil or C.NIVELES[nivel] == nil then return end
    if not cerca(jugador, contactoId) then Motor.responder(jugador, "Estas muy lejos."); return end
    local grupo = Mundo.grupoDe(jugador)
    if C.encargoDelGrupo(grupo) ~= nil then
        C.decir(contactoId, "Primero termina lo que tienes. Uno a la vez.")
        return
    end
    if nivel == "ultra" and not R.ultraAbierto(grupo, contactoId) then
        C.decir(contactoId, "Louisville no es para cualquiera. Cuando te tenga mas confianza, hablamos.")
        Motor.enviar(jugador, "ofertas", { contacto = contactoId, nivel = nivel, lista = {},
            nota = "Te falta confianza con " .. c.nombre .. " (70) para los ULTRA." })
        return
    end
    local n = R.cantidadOfertas(grupo, contactoId)
    local lista = {}
    local usados = {}
    for _ = 1, n do
        local o
        for _ = 1, 4 do
            o = nivel == "ultra" and G.generarUltra(contactoId) or G.generar(contactoId, nivel, grupo)
            if o ~= nil and not usados[o.def] then break end
        end
        if o ~= nil then usados[o.def] = true; lista[#lista + 1] = o end
    end
    local especial = G.ofertaEspecial(contactoId, nivel, grupo)
    if especial ~= nil then lista[#lista + 1] = especial end
    G.estado().ofertas[grupo] = { contacto = contactoId, nivel = nivel, lista = lista, hora = Mundo.horas() }
    G.enviarOfertas(jugador, grupo)
end

-- Modo historia de cada misionero: sus capitulos salen entre las ofertas (en cualquier
-- nivel) cuando el capitulo anterior ya se hizo. Cada uno: contacto, capitulo, memoria que
-- pide (requiere) y la que deja al terminar (hecho), confianza minima (nivel 1..5), nivel del
-- pago y chance (1 en n; 1 = siempre). El desbloqueo (fundar el campamento) va aparte, antes
-- del capitulo 1. Los capitulos tambien son requisito para subir el campamento de nivel
-- (shared/Narrador/NarradorCampamentosDefs.lua).
G.ESPECIALES = {
    -- Tia Chela, capitulo 3. Faltan sus capitulos 1 y 2 (dejan "historia_westpoint_1" y "_2").
    { def = "leyenda_tomas", contacto = "westpoint", capitulo = 3, requiere = "historia_westpoint_2",
      hecho = "historia_westpoint_3", confianza = 3, pago = "dificil", chance = 1,
      titulo = "Un cientifico que dice tener la cura",
      resumen = { "Historia de la Tia Chela, cap. 3", "Para: un cientifico que pide ayuda por la radio",
                  "Donde: un hospital o laboratorio", "Pago: botin dificil", "Ojo: hay una horda" } },
}

function G.ofertaEspecial(contactoId, nivel, grupo)
    local st = Motor.estado()
    for _, e in ipairs(G.ESPECIALES) do
        if e.contacto == contactoId and (e.nivel == nil or e.nivel == nivel) and Defs.get(e.def) ~= nil
                and Motor.activos(e.def) == 0 and st.memoria[e.hecho] == nil
                and (e.requiere == nil or st.memoria[e.requiere] ~= nil)
                and R.nivel(R.valor(grupo, contactoId)) >= (e.confianza or 1) and Mundo.azar(e.chance or 1) == 1 then
            local titulo = e.capitulo ~= nil and ("Historia, cap. " .. e.capitulo .. ": " .. e.titulo) or e.titulo
            return { def = e.def, vars = { nivel = e.pago or nivel }, lugares = { contacto = C.lugar(contactoId) },
                titulo = titulo, resumen = e.resumen, tipo = nil }
        end
    end
    return nil
end

function G.enviarOfertas(jugador, grupo)
    local of = G.estado().ofertas[grupo]
    if of == nil then return end
    local lista = {}
    for i, o in ipairs(of.lista) do lista[#lista + 1] = { i = i, titulo = o.titulo, lineas = o.resumen, tipo = o.tipo } end
    local R2 = R.valor(grupo, of.contacto)
    Motor.enviar(jugador, "ofertas", { contacto = of.contacto, nivel = of.nivel, lista = lista,
        gratis = R2 >= 90, nota = #lista > 1 and ("Por tu confianza con " .. tostring(C.def(of.contacto).nombre) .. ", puedes elegir.") or nil })
end

function G.tomarOferta(jugador, args)
    local grupo, nombreGrupo = Mundo.grupoDe(jugador)
    local of = G.estado().ofertas[grupo]
    local i = tonumber(args.i)
    if of == nil or of.contacto ~= tostring(args.contacto) or i == nil or of.lista[i] == nil then
        Motor.responder(jugador, "Esa oferta ya no esta. Pide de nuevo.")
        return
    end
    if not cerca(jugador, of.contacto) then Motor.responder(jugador, "Estas muy lejos."); return end
    if C.encargoDelGrupo(grupo) ~= nil then C.decir(of.contacto, "Ya tienes uno. Terminalo primero."); return end
    local o = of.lista[i]
    G.estado().ofertas[grupo] = nil
    G.iniciarOferta(jugador, of.contacto, of.nivel, o)
end

function G.iniciarOferta(jugador, contactoId, nivel, o)
    local c = C.def(contactoId)
    local grupo, nombreGrupo = Mundo.grupoDe(jugador)
    local extra = C.extra(c, nivel, jugador)
    for k, v in pairs(o.vars or {}) do extra.vars[k] = v end
    extra.vars.dueno, extra.vars.dueno_nombre = grupo, nombreGrupo
    for k, l in pairs(o.lugares or {}) do extra.lugares[k] = l end
    local inst, razon = Motor.iniciar(o.def, jugador, extra)
    if inst == nil then
        Motor.responder(jugador, "No se pudo armar el encargo: " .. tostring(razon))
        return nil
    end
    G.registrarUltimo(contactoId, o.tipo)
    if o.ultra then C.decir(contactoId, R.saludo(grupo, contactoId, C.SALUDOS.ultra)) end
    if inst.lugares.objetivo ~= nil then pcall(C.darMapa, c, inst) end
    if o.tipo == "reconocimiento" and inst.lugares.p1 ~= nil then pcall(G.mapaGrupo, inst, "p1") end
    return inst
end

function G.registrarUltimo(contactoId, tipo)
    if tipo == nil then return end
    local e = G.estado()
    e.ultimos[contactoId] = e.ultimos[contactoId] or {}
    table.insert(e.ultimos[contactoId], 1, tipo)
    while #e.ultimos[contactoId] > 3 do table.remove(e.ultimos[contactoId]) end
end

-- "Pedir otro": se paga con una lata (o gratis una vez al dia con confianza 90).
function G.otraOferta(jugador, args)
    local grupo = Mundo.grupoDe(jugador)
    local of = G.estado().ofertas[grupo]
    if of == nil then return end
    if not cerca(jugador, of.contacto) then Motor.responder(jugador, "Estas muy lejos."); return end
    local t = R.tabla()[tostring(grupo)] or {}
    local gratis = R.valor(grupo, of.contacto) >= 90 and (t.reroll == nil or Mundo.horas() - t.reroll >= 24)
    if gratis then
        t.reroll = Mundo.horas()
        R.tabla()[tostring(grupo)] = t
    else
        local item, cont = Mundo.buscarItem(jugador, function(it) return Mundo.esComida(it) end)
        if item == nil then
            C.decir(of.contacto, "Otro? Eso cuesta una lata. No traes ni una.")
            return
        end
        Mundo.quitarItem(cont, item)
    end
    C.decir(of.contacto, "Ya, ya. Deja ver que mas tengo.")
    G.verOfertas(jugador, { contacto = of.contacto, nivel = of.nivel })
end

-- Compatibilidad: pedir trabajo directo (menu antiguo). Se toma la primera oferta.
function G.pedirTrabajo(jugador, id, nivel)
    local c = C.def(tostring(id))
    if c == nil or C.NIVELES[tostring(nivel)] == nil then return end
    if not cerca(jugador, c.id) then Motor.responder(jugador, "Estas muy lejos."); return end
    local grupo = Mundo.grupoDe(jugador)
    local activo = C.encargoDelGrupo(grupo)
    if activo ~= nil then
        local otro = C.def(tostring(activo.vars.contacto))
        C.decir(c.id, "Ya tienes un encargo con " .. (otro ~= nil and C.nombreCompleto(otro) or "otro misionero") .. ". Terminalo primero.")
        return
    end
    if nivel == "ultra" and not R.ultraAbierto(grupo, c.id) then
        C.decir(c.id, "Louisville no es para cualquiera. Cuando te tenga mas confianza, hablamos.")
        return
    end
    local o = nivel == "ultra" and G.generarUltra(c.id) or G.generar(c.id, nivel, grupo)
    if o == nil then Motor.responder(jugador, "No hay encargos de ese tipo."); return end
    G.iniciarOferta(jugador, c.id, nivel, o)
end

-- ---------------------------------------------------------------------------
-- Acciones nuevas que usan los arcos generados
-- ---------------------------------------------------------------------------

-- Jugadores del grupo dueno del encargo (o todos si no tiene).
function G.jugadoresDe(inst)
    local lista = {}
    for _, p in ipairs(Mundo.jugadores()) do
        if inst.vars.dueno == nil or Mundo.grupoDe(p) == inst.vars.dueno then lista[#lista + 1] = p end
    end
    return lista
end

function G.mapaGrupo(inst, lugarId)
    local c = C.def(inst.vars.contacto or "")
    local x, y
    if c ~= nil then x, y = C.posicion(c.id) end
    Motor.darMapaZona(inst, lugarId, {
        jugadores = G.jugadoresDe(inst),
        radio = R.radioMapa(inst.vars.dueno, inst.vars.contacto),
        titulo = c ~= nil and ("Mapa de " .. C.nombreCompleto(c)) or nil,
        extras = x ~= nil and { { x = x, y = y, texto = C.nombreCompleto(c), r = 0.1, g = 0.4, b = 0.9 } } or nil,
    })
end

Motor.inmediatas.mapa_grupo = function(inst, a)
    if inst.lugares[a.lugar] ~= nil then pcall(G.mapaGrupo, inst, a.lugar) end
    return true
end

-- Da un objeto de la historia al jugador que tomo el encargo (o a uno del grupo).
Motor.inmediatas.dar_objeto = function(inst, a)
    local item = Mundo.crearItem(a.tipo)
    if item == nil then return true end
    Mundo.nombrar(item, a.nombre ~= nil and Motor.texto(inst, a.nombre) or nil, inst.id .. ":" .. tostring(a.id))
    local destino
    for _, p in ipairs(G.jugadoresDe(inst)) do if Mundo.nombreJugador(p) == inst.refNombre then destino = p end end
    destino = destino or G.jugadoresDe(inst)[1] or Mundo.jugadorAlAzar()
    if destino ~= nil then Mundo.darItem(destino, item) end
    return true
end

Motor.inmediatas.quitar_objeto = function(inst, a)
    local etiqueta = inst.id .. ":" .. tostring(a.id)
    for _, p in ipairs(Mundo.jugadores()) do
        local it, cont = Mundo.buscarItem(p, function(x) return Mundo.tieneEtiqueta(x, etiqueta) end)
        if it ~= nil then Mundo.quitarItem(cont, it); return true end
    end
    return true
end

Motor.inmediatas.decir_misionero = function(inst, a)
    if a.contacto ~= nil then C.decir(tostring(a.contacto), Motor.texto(inst, a.texto or "")) end
    return true
end

Motor.inmediatas.marcar_hora = function(inst, a)
    inst.vars[a.nombre or "hora"] = Mundo.horas()
    return true
end

-- Cierre del encargo: necesidades, clientes frecuentes y comentario del misionero.
Motor.inmediatas.cerrar_gen = function(inst, a)
    local contacto = inst.vars.contacto
    if contacto == nil then return true end
    local resultado = a.resultado
    if resultado == "cumplido" then
        local nec = inst.vars.necesidad
        local n = G.necesidades(contacto)
        if nec ~= nil and n[nec] ~= nil then
            local alta = n[nec] >= 60
            local baja = ({ facil = 15, medio = 22, dificil = 30 })[tostring(inst.vars.nivel)] or 15
            n[nec] = math.max(0, n[nec] - baja)
            if alta and G.COMENTARIOS_NEC[nec] ~= nil then
                Motor.diferir(inst, { "decir_misionero", contacto = contacto, retraso = 0.1,
                    texto = string.gsub(G.COMENTARIOS_NEC[nec], "{ciudad}", tostring(inst.vars.ciudad)) })
            end
        end
        G.anotarCliente(inst)
    end
    return true
end

function G.anotarCliente(inst)
    local v = inst.vars
    if v.cliente_corto == nil or v.tipo == "limpieza" or v.tipo == "defensa" or v.tipo == "reconocimiento" or v.tipo == "posta" then return end
    local e = G.estado()
    e.clientes[v.contacto] = e.clientes[v.contacto] or {}
    local lista = e.clientes[v.contacto]
    local cl
    for _, x in ipairs(lista) do if x.nombre == v.cliente_corto and x.apellido == v.cliente_apellido then cl = x end end
    if cl == nil then
        if not chance(20) then return end
        cl = { nombre = v.cliente_corto, apellido = v.cliente_apellido, sexo = v.cliente_sexo, perfil = v.perfil_npc,
            oficio = v.oficio_id, veces = 0 }
        lista[#lista + 1] = cl
        while #lista > 8 do table.remove(lista, 1) end
    end
    cl.veces = (cl.veces or 0) + 1
    if cl.veces >= 3 and not cl.residente then
        cl.residente = true
        G.hacerVecino(v.contacto, cl)
    end
end

-- El cliente se viene a vivir al lado del misionero (residente, conversa con el).
function G.hacerVecino(contactoId, cl)
    local e = G.estado()
    e.vecinosPend = e.vecinosPend or {}
    e.vecinosPend[#e.vecinosPend + 1] = { contacto = contactoId, nombre = cl.nombre, apellido = cl.apellido, perfil = cl.perfil }
    local c = C.def(contactoId)
    if c ~= nil then
        C.decir(contactoId, cl.nombre .. " " .. cl.apellido .. " se viene a vivir aca al lado. Dice que te debe demasiado como para irse lejos.")
    end
end

function G.revisarVecinos()
    local e = G.estado()
    if e.vecinosPend == nil or #e.vecinosPend == 0 or not Mundo.hayALife() then return end
    for i = #e.vecinosPend, 1, -1 do
        local vp = e.vecinosPend[i]
        local ce = C.estado(vp.contacto)
        if ce.x ~= nil and not vp.pidiendo then
            local j = Mundo.jugadorCerca(ce.x, ce.y, 70)
            if j ~= nil and Mundo.cargado(ce.x, ce.y, ce.z) ~= nil then
                e.vecinos = e.vecinos + 1
                local requestId = "narrador:vecino:" .. tostring(e.vecinos)
                Mundo.reservarNombres(requestId, { [vp.perfil] = { vp.nombre, vp.apellido } })
                local args = { requestId = requestId, x = floor(ce.x + 4), y = floor(ce.y + 2), z = floor(ce.z or 0),
                    mode = "guard", radius = 3, distance = 0, separation = 1, atomicGroup = true, persistent = true,
                    stationary = true, invulnerable = true, leashRadius = 6, profileIds = { vp.perfil }, count = 1,
                    hostileOverride = false, playerStance = "friendly", playerKeepOut = 0 }
                vp.pidiendo = true
                local idRes = "vecino_" .. tostring(e.vecinos)
                local ok = Mundo.spawnGrupo(j, args, function(resultado)
                    local uids = type(resultado) == "table" and resultado.actorUids or nil
                    if type(uids) == "table" and uids[1] ~= nil then
                        local st = Motor.estado()
                        st.residentes[idRes] = { charla = "vecinos", memoria = {}, alias = { "vecino" },
                            miembros = { [uids[1]] = { rol = "vecino", nombre = vp.nombre, apellido = vp.apellido, alias = { "vecino" } } },
                            zona = { x = ce.x, y = ce.y, z = ce.z or 0, radio = 20, max = 2 },
                            banderas = { persistent = true, invulnerable = true, stationary = true, leashRadius = 6 } }
                        Mundo.nombrarActor(uids[1], vp.nombre, vp.apellido)
                        for k = #e.vecinosPend, 1, -1 do if e.vecinosPend[k] == vp then table.remove(e.vecinosPend, k) end end
                        Motor.publicar()
                    else
                        vp.pidiendo = nil
                    end
                end)
                if not ok then vp.pidiendo = nil end
            end
        end
    end
end

-- Un lugar limpiado queda como punto seguro: pocos zombis mientras nadie mira.
Motor.inmediatas.punto_seguro = function(inst, a)
    local l = inst.lugares[a.lugar]
    if l == nil then return true end
    local e = G.estado()
    e.puntos[#e.puntos + 1] = { x = l.x, y = l.y, z = l.z or 0, etiqueta = l.etiqueta, contacto = inst.vars.contacto }
    while #e.puntos > 20 do table.remove(e.puntos, 1) end
    return true
end

-- Pago del encargo: botin del nivel + lo que paga el oficio del cliente + extras.
Motor.diferidas.pago_encargo = function(inst, p, l)
    local nivel = tostring(inst.vars.nivel or "facil")
    for _, tipos in ipairs(Motor.BOTIN[nivel] or Motor.BOTIN.facil) do
        local item = Mundo.crearItem(tipos)
        if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
    end
    for _, tipos in ipairs(type(inst.vars.pago_items) == "table" and inst.vars.pago_items or {}) do
        local item = Mundo.crearItem(tipos)
        if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
    end
    if inst.vars.bonus_cond == true then
        for _, tipos in ipairs(Motor.BOTIN.facil) do
            local item = Mundo.crearItem(tipos)
            if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        end
        Motor.avisar(inst, "Pago extra por cumplir la condicion.")
    end
    local chanceCh = Motor.CHANCE_CHETADA[nivel] or 0
    if chanceCh > 0 then chanceCh = chanceCh + R.bonusChetada(inst.vars.dueno, inst.vars.contacto) end
    if inst.vars.bonus_cond == true and chanceCh > 0 then chanceCh = chanceCh + 3 end
    local L = Narrador.Legendario
    if L ~= nil and chanceCh > 0 and Mundo.azar(100) <= chanceCh then
        for _, item in ipairs(L.crear("arma", "chetada")) do Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        Motor.avisar(inst, "Entre el pago viene algo especial: un arma en un estado increible.")
    end
    return true
end

Motor.diferidas.zombi_jefe = function(inst, p, l)
    Mundo.zombiJefe(l.x, l.y, l.z, p.outfit)
    return true
end

-- {bajas:lugar}: zombis muertos cerca del lugar desde que empezo la etapa.
Motor.plantillas.bajas = function(inst, lugarId)
    local l = inst.lugares[lugarId]
    if l == nil then return 0 end
    return Motor.contarBajas(l.x, l.y, 45, inst.etapaDesde or 0)
end

-- Requisitos: {"items", tipos, cantidad} y {"items_varios", { { tipos, cantidad }, ... }}
local function contarTipos(jugador, tipos, cantidad)
    local set = {}
    for _, t in ipairs(type(tipos) == "table" and tipos or { tipos }) do set[t] = true end
    local lista = Mundo.buscarItems(jugador, function(it)
        local t = Mundo.tipoItem(it)
        return t ~= nil and set[t] == true
    end, cantidad)
    return lista
end

Motor.requisitos.items = function(inst, op, jugador)
    local tipos = Motor.valor(inst, op.requiere[2])
    local n = tonumber(Motor.valor(inst, op.requiere[3])) or 1
    local lista = contarTipos(jugador, tipos, n)
    if #lista < n then return nil end
    return function() for _, par in ipairs(lista) do Mundo.quitarItem(par[2], par[1]) end end
end

Motor.requisitos.items_varios = function(inst, op, jugador)
    local req = Motor.valor(inst, op.requiere[2])
    local todos = {}
    for _, r in ipairs(type(req) == "table" and req or {}) do
        local n = tonumber(r[2]) or 1
        local lista = contarTipos(jugador, r[1], n)
        if #lista < n then return nil end
        for _, par in ipairs(lista) do todos[#todos + 1] = par end
    end
    return function() for _, par in ipairs(todos) do Mundo.quitarItem(par[2], par[1]) end end
end

-- ---------------------------------------------------------------------------
-- Tick, vista y comandos
-- ---------------------------------------------------------------------------

function G.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    G.subirNecesidades()
    pcall(G.revisarVecinos)
    local e = G.estado()
    for _, pt in ipairs(e.puntos) do Mundo.limpiarZona(pt.x, pt.y, 25, 1, 25) end
    -- Ofertas viejas se borran.
    for grupo, of in pairs(e.ofertas) do
        if Mundo.horas() - (of.hora or 0) > 3 then e.ofertas[grupo] = nil end
    end
    -- Limpiezas en curso: refrescar el conteo en la pista.
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil and inst.vars.tipo == "limpieza" and inst.etapa == "en_sitio" then
            Motor.publicar()
            break
        end
    end
end

function G.vista(v)
    local e = G.estado()
    local nec = {}
    for id, n in pairs(e.necesidades) do nec[id] = n end
    v.necesidades = nec
    local puntos = {}
    for _, pt in ipairs(e.puntos) do puntos[#puntos + 1] = { x = pt.x, y = pt.y, etiqueta = pt.etiqueta } end
    v.puntos_seguros = puntos
end

Motor.tickExtra.generador = G.tick
Motor.vistaExtra[#Motor.vistaExtra + 1] = G.vista
Motor.comandosPublicos.verOfertas = G.verOfertas
Motor.comandosPublicos.tomarOferta = G.tomarOferta
Motor.comandosPublicos.otraOferta = G.otraOferta
-- El pedido directo (menu antiguo y ventana de conversacion) ahora usa el generador.
C.pedirTrabajo = G.pedirTrabajo

-- Admin: iniciar un tipo generado a mano (con el misionero mas cercano).
Motor.comandosAdmin.encargoGenerado = function(jugador, args)
    local px, py = Mundo.posicion(jugador)
    local mejor, dist
    for _, c in ipairs(C.LISTA) do
        if C.ubicar(c) ~= nil and px ~= nil then
            local x, y = C.posicion(c.id)
            local d = math.sqrt((x - px) ^ 2 + (y - py) ^ 2)
            if dist == nil or d < dist then mejor, dist = c, d end
        end
    end
    if mejor == nil then return "No hay misioneros ubicados todavia." end
    local o = G.generar(mejor.id, tostring(args.nivel or "facil"), Mundo.grupoDe(jugador), args.tipo)
    if o == nil then return "No se pudo generar." end
    local inst = G.iniciarOferta(jugador, mejor.id, tostring(args.nivel or "facil"), o)
    return inst ~= nil and ("Encargo generado: " .. inst.id .. " (" .. o.tipo .. ")") or "No se pudo iniciar."
end

return G
