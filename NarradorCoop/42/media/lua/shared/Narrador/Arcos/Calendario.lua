-- Historias de fecha (una vez por partida). Las lanza server/Narrador/NarradorCalendario.lua.
--   La fonda de Sous (Sous aliado): se planea desde el 10 de septiembre (carne y carbon) y
--   el asado es el 18 en la base.
--   El amigo secreto (24 de diciembre, Sous aliado): un regalo para un Sous sorteado.
-- Dialogos originales, solo imitando la forma de hablar de cada uno. Sin tildes ni enies.

require "Narrador/NarradorDefs"
require "Narrador/NarradorConversasDefs"

local registrar = Narrador.Defs.registrar

local CARNE = { "Base.Steak", "Base.Chicken", "Base.PorkChop", "Base.MuttonChop", "Base.Salmon", "Base.Bacon",
    "Base.MeatPatty", "Base.Rabbitmeat", "Base.Venison", "Base.Smallanimalmeat", "Base.Smallbirdmeat", "Base.Ham",
    "Base.Sausage", "Base.ChickenWhole", "Base.Beef", "Base.Pork" }
local CARBON = { "Base.Charcoal", "Base.Log", "Base.Plank", "Base.Firewood" }

registrar({
    id = "cal_fonda",
    titulo = "La fonda de Sous",
    titulo_menu = "Fecha: La fonda de Sous",
    requiere_alife = true, automatico = false, tono = "vida", intensidad = 1,
    inicio = "aviso",
    etapas = {
        aviso = {
            al_entrar = {
                { "lugar_memoria", id = "base_sous", clave = "base_sous", salas = { "livingroom" }, min = 50, max = 400 },
                { "conversar", id = "fonda_lista" },
                { "aviso", texto = "Se viene el 18 de septiembre. En la base de Sous ya estan planeando la fonda." },
                { "diario", texto = "Sous quiere celebrar el Dieciocho. Akagami hizo una lista: carne, carbon, y que Walita no baile. Hay que llevarlo antes del 18." },
            },
            salidas = { { ir = "pedido" } },
        },
        pedido = {
            pista = "Llevar 2 carnes y algo para el fuego (carbon o lena) a la base de Sous en {lugar:base_sous}, antes del 18 de septiembre.",
            ancla = "base_sous", radio = 45,
            opciones = {
                { id = "entregar", texto = "Entregar la carne y el carbon para la fonda",
                  requiere = { "items_varios", { { CARNE, 2 }, { CARBON, 1 } } },
                  falta = "Faltan cosas: 2 carnes y algo para el fuego (carbon, lena o tablas)." },
            },
            salidas = {
                { cuando = { "eleccion", "entregar" }, ir = "preparativos" },
                { cuando = { "fecha", 19, 9 }, ir = "final_sin_fonda" },
                { cuando = { "horas", 240 }, ir = "final_sin_fonda" },
            },
        },
        -- Ya llevaste lo de la fonda: Sous espera el 18.
        preparativos = {
            pista = "La fonda de Sous es el 18 de septiembre en {lugar:base_sous}.",
            al_entrar = {
                { "aviso", texto = "Sous guardo la carne y el carbon. La fonda es el 18: Akagami ya esta ensayando la cueca. Mal." },
            },
            salidas = {
                { cuando = { "fecha", 18, 9 }, ir = "asado" },
                { cuando = { "fecha", 19, 9 }, ir = "asado" },
            },
        },
        asado = {
            pista = "Disfrutar la fonda en {lugar:base_sous}. Ojo con el humo: atrae muertos al anochecer.",
            objetivo = "base_sous",
            al_entrar = {
                { "conversar", id = "fonda_asado" },
                { "conversar", id = "fonda_cueca", retraso = 0.6 },
                { "oleada", lugar = "base_sous", radio = 60, cantidad = { 8, 12 }, min = 25, max = 40, retraso = 1.2 },
                { "aviso", texto = "El olor del asado llego lejos. Algo se acerca a la base.", retraso = 1.2 },
            },
            salidas = { { cuando = { "horas", 2.5 }, ir = "final_fonda" } },
        },
        final_fonda = { final = true, al_entrar = {
            { "animo", lugar = "base_sous", radio = 60 },
            { "conversar", id = "fonda_fin" },
            { "huella", acto = "compartiste", texto = "Celebre el Dieciocho con Sous. Hubo asado, cueca mala y nadie murio." },
            { "memoria", clave = "cal.fonda", valor = "hecha" },
            { "diario", texto = "Fonda en la base de Sous. Por unas horas el fin del mundo quedo afuera." },
        } },
        final_sin_fonda = { final = true, al_entrar = {
            { "conversar", id = "fonda_sin" },
            { "memoria", clave = "cal.fonda", valor = "sin" },
            { "diario", texto = "No llegue con lo de la fonda. Sous celebro con lo que tenia. Algunos me lo van a sacar en cara." },
        } },
    },
})

-- Lo que le gusta a cada Sous (para el amigo secreto).
Narrador.GustosSous = {
    martin_a = { nombre = "algo para entrenar (pesas o una barra)", tipos = { "Base.DumbBell", "Base.BarBell", "Base.Kettlebell", "Base.MetalBar", "Base.LeadPipe" },
        gracias = "Mi bro. Uno, que buen regalo. Dos, manana entrenamos. Tres, gracias." },
    martin_z = { nombre = "un libro o una revista", tipos = { "Base.Book", "Base.Magazine", "Base.ComicBook", "Base.Newspaper" },
        gracias = "Un libro. Para mi. Ya. Gracias. No lo voy a decir dos veces." },
    benjamin = { nombre = "una botella", tipos = { "Base.WhiskeyFull", "Base.Wine", "Base.Wine2", "Base.BeerBottle", "Base.BeerCan", "Base.Vodka" },
        gracias = "Hermanoooo! Esto es amistad, bro. Esto se celebra. Con esto mismo." },
    david = { nombre = "un libro o una revista", tipos = { "Base.Book", "Base.Magazine", "Base.ComicBook", "Base.Notebook" },
        gracias = "Gracias. Lo voy a leer dos veces y despues lo voy a anotar en el cuaderno." },
    bastian = { nombre = "ropa de marca o lentes de sol", tipos = { "Base.Glasses_Sun", "Base.Glasses_Aviators", "Base.Jacket_LeatherBlack", "Base.Jacket_Leather", "Base.Shoes_TrainerTINT" },
        gracias = "Oe, loco! Esto tiene estilo, po. Sabias perfecto." },
    hanz = { nombre = "un formon o madera", tipos = { "Base.Chisel", "Base.HuntingKnife", "Base.Plank", "Base.Log", "Base.TreeBranch" },
        gracias = "Broder! Con esto te tallo algo a ti tambien, vale. Ya veras." },
    cristian = { nombre = "ropa de abrigo", tipos = { "Base.Jacket_Padded", "Base.Hat_WinterHat", "Base.Scarf_White", "Base.Gloves_WoolyGloves", "Base.Jumper_RoundNeck" },
        gracias = "Compadre, akkakaka! Ahora si estoy listo pa la nieve!" },
    jorge = { nombre = "una libreta o una calculadora", tipos = { "Base.Notebook", "Base.Calculator", "Base.Notepad", "Base.Pencil", "Base.Pen" },
        gracias = "Manito, justo lo que necesitaba. Ahora el inventario queda impecable, broder." },
    cristobal = { nombre = "algo electronico", tipos = { "Base.ElectronicsScrap", "Base.Radio", "Base.WalkieTalkie2", "Base.RemoteCraftedV1", "Base.Battery", "Base.Earbuds" },
        gracias = "Hermanito! Con esto armo algo, wn. Te quiero, sangre." },
}

registrar({
    id = "cal_amigo_secreto",
    titulo = "El amigo secreto de Sous",
    titulo_menu = "Fecha: El amigo secreto",
    requiere_alife = true, automatico = false, tono = "vida", intensidad = 1,
    inicio = "sorteo",
    etapas = {
        sorteo = {
            al_entrar = {
                { "lugar_memoria", id = "base_sous", clave = "base_sous", salas = { "livingroom" }, min = 50, max = 400 },
                { "reloj", id = "plazo", horas = "var:horas_plazo" },
                { "decir_residente", rol = "jorge", texto = "Manito, regla del amigo secreto: nada robado del deposito. Te toco {amigo_nombre}. Eso lo reviso yo, broder." },
                { "decir_residente", rol = "cristobal", retraso = 0.05, texto = "Hermanito, si me toca a mi, que sea algo con cables. Te quiero igual si no." },
                { "aviso", texto = "Amigo secreto en Sous: te toco {amigo_nombre}. Le gusta {gusto_nombre}." },
                { "diario", texto = "Amigo secreto en Sous. Me toco {amigo_nombre}. Le gusta {gusto_nombre}. Hay hasta la medianoche." },
            },
            salidas = { { ir = "pedido" } },
        },
        pedido = {
            pista = "Conseguir {gusto_nombre} para {amigo_nombre} y llevarlo a la base de Sous en {lugar:base_sous} antes de medianoche.",
            ancla = "base_sous", radio = 45,
            opciones = {
                { id = "regalar", texto = "Darle el regalo a {amigo_nombre}", requiere = { "items", "var:gusto_tipos", 1 },
                  falta = "No llevas {gusto_nombre}." },
            },
            salidas = {
                { cuando = { "eleccion", "regalar" }, ir = "final_regalo" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_sin_regalo" },
            },
        },
        final_regalo = { final = true, al_entrar = {
            { "decir_residente", rol = "var:amigo", texto = "var:gracias" },
            { "decir_residente", rol = "var:regalador", retraso = 0.08, texto = "Y a ti te toco conmigo. Toma, esto es tuyo. Feliz Navidad." },
            { "recompensa", lugar = "base_sous", radio = 40, items = { { "Base.Bag_ALICEpack", "Base.Bag_BigHikingBag", "Base.Bag_DuffelBag" },
                { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Chocolate", "Base.CandyPackage" } } },
            { "chetada", chance = 25, lugar = "base_sous", radio = 40 },
            { "animo", lugar = "base_sous", radio = 60 },
            { "huella", acto = "compartiste", texto = "Le regale {gusto_nombre} a {amigo_nombre} en el amigo secreto de Sous." },
            { "diario", texto = "Amigo secreto en Sous. {amigo_nombre} se puso contento. A mi me regalaron una mochila. Navidad en el fin del mundo." },
        } },
        final_sin_regalo = { final = true, al_entrar = {
            { "decir_residente", rol = "var:amigo", texto = "Bueno. Otro ano sera. Si es que hay otro ano." },
            { "diario", texto = "No llegue con el regalo para {amigo_nombre}. Me miro con una cara que no se me va a olvidar." },
        } },
    },
})

-- Conversaciones de las fechas (solo salen cuando la historia las pide).
Narrador.Conversas.varias({
    { id = "fonda_lista", forzada = true, tipo = "reaccion",
      turnos = {
          { "martin_a", "Cabros, lista de la fonda: uno, carne. Dos, carbon. Tres, que Walita no baile." },
          { "hanz", "Broder, yo bailo cueca mejor que todos ustedes juntos, vale." },
          { "martin_z", "Eso no es dificil." },
          { "benjamin", "Hermano, yo me encargo del copete. Por la patria.", opcional = true },
      } },
    { id = "fonda_asado", forzada = true, tipo = "reaccion",
      turnos = {
          { "jorge", "Manito, la carne a la parrilla no se toca hasta que yo diga. Hay un orden." },
          { "bastian", "Oe, con este olor nos encuentran desde Louisville, po." },
          { "cristian", "Que nos encuentren, compadre! Akkakaka, hoy se celebra!", opcional = true },
          { "martin_a", "Un brindis. Uno: por los que estan. Dos: por los que no. Tres: salud, cabros." },
      } },
    { id = "fonda_cueca", forzada = true, tipo = "reaccion",
      turnos = {
          { "hanz", "Ya, saquen pareja, que sale la cueca. Panuelo no hay, pero hay trapo, vale." },
          { "martin_z", "Esto es una tortura con musica." },
          { "cristobal", "Siuuu! Ya, perdon. La cueca tambien merece un siu, hermanito.", opcional = true },
          { "david", "Interesante: ninguno sabe bailar y todos estan bailando." },
      } },
    { id = "fonda_fin", forzada = true, tipo = "reaccion",
      turnos = {
          { "benjamin", "Bro, mejor carrete del apocalipsis. Por lejos, hermano.", opcional = true },
          { "martin_a", "Mi bro, gracias por la carne. Sin ti era fonda de latas." },
          { "jorge", "Broder, anoto: una fonda, cero bajas. Eso no pasa todos los dias." },
      } },
    { id = "fonda_sin", forzada = true, tipo = "reaccion",
      turnos = {
          { "martin_a", "Fonda con atun. Tambien vale, cabros. Uno se adapta." },
          { "martin_z", "No vale. Pero bueno." },
      } },
    { id = "corte_luz", forzada = true, tipo = "reaccion",
      turnos = {
          { "cristobal", "Wn. Se corto la luz. De todo el condado, hermanito." },
          { "bastian", "Oe, y ahora como cargamos las cosas, loco?" },
          { "cristobal", "Generador y gasolina, sangre. Hay que conseguir los dos. Yo lo armo." },
          { "martin_a", "Lista nueva. Uno, generador. Dos, gasolina. Tres, nadie llora por el refri." },
      } },
    { id = "ultima_noche_sous", forzada = true, tipo = "reaccion",
      turnos = {
          { "martin_a", "Cabros, se acaba el 93. Uno, seguimos vivos. Dos, eso ya es harto." },
          { "martin_z", "Feliz ano nuevo. Que sea menos peor." },
          { "hanz", "Broder, el proximo ano te tallo algo mas bonito, vale.", opcional = true },
          { "cristobal", "Hermanito, abrazo grupal. No acepto un no.", opcional = true },
          { "jorge", "Manito, balance del ano: perdimos mucho. Pero seguimos sumando.", opcional = true },
      } },
})
