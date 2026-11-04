-- La mision de la cura: un misionero te manda a un edificio grande de Louisville (hospital,
-- laboratorio o base militar) a buscar el antibiotico experimental K-93, que cura la mordida.
-- Ultra dificil. Sale una vez cada 20 dias de juego para todo el servidor: si un misionero te
-- la da, los otros no la tienen hasta que pasen los 20 dias (ver server/Narrador/NarradorCuraServer.lua).
-- En el lugar hay varias pastillas K-93 iguales: de 1 a 4 son verdaderas (siempre al menos
-- una) y el resto son de azucar. Con Medicina 4 o
-- mas se distinguen; si no, queda la prueba del agua (la falsa se deshace; la verdadera sale
-- entera y queda marcada, ver NarradorCura.lua) o entregar una al azar. Puedes entregar la
-- verdadera, una cualquiera, una falsa a proposito (y quedarte con la buena) o ninguna.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local function plazo(lista)
    lista[#lista + 1] = { cuando = { "reloj_vencido", "plazo" }, ir = "final_vencido" }
    return lista
end

Narrador.Defs.registrar({
    id = "encargo_cura",
    titulo = "La cura ({lugar_nombre})",
    titulo_menu = "Encargo especial: La cura",
    requiere_alife = true, automatico = false, encargo_nivel = "cura", indicador = "encargo",
    tono = "accion", intensidad = 5,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "reloj", id = "plazo", horas = 168 },
                { "lugar", id = "objetivo", pueblo = "Louisville", nombre = "var:lugar_nombre", salas = "var:salas", respaldo = "var:respaldo", cerca_de = "var:cerca_de" },
                { "decir_contacto", texto = "var:pedido" },
                { "diario", texto = "{contacto_nombre} me hablo de un antibiotico experimental que cura la mordida. Esta en {lugar:objetivo}. Hay que traer una dosis. La otra es mia." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Llegar a {lugar:objetivo} en Louisville. Ir preparado.",
            salidas = plazo({ { cuando = { "cerca", "objetivo", 60 }, ir = "en_sitio" } }),
        },
        en_sitio = {
            pista = "Encontrar el refrigerador con las pastillas K-93 en {lugar:objetivo}. Llevatelas todas: no todas son verdaderas.",
            al_entrar = {
                { "oleada", lugar = "objetivo", radio = 70, cantidad = { 80, 100 } },
                { "oleada", lugar = "objetivo", radio = 70, cantidad = { 40, 60 }, retraso = 0.4 },
                { "corredores", lugar = "objetivo", radio = 70, cantidad = { 8, 12 }, retraso = 0.2 },
                { "bandidos", id = "saqueadores", lugar = "objetivo", radio = 70, modo = "guard", cantidad = { 4, 6 } },
                { "pastillas", id = "cura", lugar = "objetivo", radio = 70, cantidad = { 5, 7 }, reales = { 1, 4 }, nombre = "Pastilla K-93" },
                { "aviso", texto = "Aca adentro hay mas muertos que en cualquier lugar que hayas visto. Y algunos corren." },
            },
            salidas = plazo({ { cuando = { "alguien_tiene", "cura" }, ir = "volver" } }),
        },
        volver = {
            pista = "Volver con {contacto_nombre} en {lugar:contacto} con una pastilla K-93.",
            ancla = "contacto",
            al_entrar = { { "diario", texto = "Tengo las pastillas K-93. Todas iguales. Algunas son de azucar y no se cuantas son de verdad. Una tiene que llegar donde {contacto_nombre}... y la buena es un seguro de vida." } },
            opciones = {
                { id = "entregar", texto = "Entregarle una pastilla a {contacto_nombre} (cualquiera)", requiere = { "pastilla", "cura", "cualquiera" },
                  falta = "No llevas las pastillas." },
                { id = "entregar_real", texto = "Entregarle la verdadera (Medicina 4+ o probada en agua)", requiere = { "pastilla", "cura", "real" },
                  falta = "No llevas una que sepas que es la verdadera (Medicina 4 o mas, o meterla en agua: la falsa se deshace)." },
                { id = "entregar_falsa", texto = "Entregarle una falsa y quedarte con la verdadera (Medicina 4+)", requiere = { "pastilla", "cura", "falsa" },
                  falta = "No llevas una que sepas que es falsa (Medicina 4 o mas para distinguirla).",
                  acciones = { { "variable", nombre = "engano", valor = true } } },
                { id = "quedarse", texto = "No entregarle nada y quedarte con todas",
                  acciones = { { "huella", acto = "mentiste", texto = "Me quede con todas las pastillas de la cura." } } },
            },
            salidas = plazo({
                { cuando = { { "o", { "eleccion", "entregar" }, { "eleccion", "entregar_real" }, { "eleccion", "entregar_falsa" } },
                             { "var", "pastilla_dada", "real" } }, ir = "final_cumplido" },
                { cuando = { "o", { "eleccion", "entregar" }, { "eleccion", "entregar_falsa" } }, ir = "final_cumplido_falsa" },
                { cuando = { "eleccion", "quedarse" }, ir = "final_te_la_quedaste" },
            }),
        },
        -- "cura_<contacto>" guarda como termino la primera vez: salvo o murio (en Rosewood es el
        -- sobrino de la Misia Rosa, que despues puede volver de misionero en la reconquista).
        final_cumplido = { final = true, al_entrar = {
            { "memoria", clave = "cura_{contacto}", valor = "salvo", si_vacia = true },
            { "decir_contacto", texto = "var:gracias" },
            { "pago_encargo", lugar = "contacto", radio = 35 },
            { "chetada", chance = 40, lugar = "contacto", radio = 35 },
            { "diario", texto = "Le entregue una dosis a {contacto_nombre}. Alguien va a vivir gracias a eso. La otra la guardo yo." },
        } },
        -- Le entregaste una falsa (sin saber o a proposito). El misionero nunca sabe la diferencia:
        -- la persona que esperaba no se salva, y te lo agradece igual por haberlo intentado.
        final_cumplido_falsa = { final = true, al_entrar = {
            { "memoria", clave = "cura_{contacto}", valor = "murio", si_vacia = true },
            { "decir_contacto", texto = "var:gracias" },
            { "pago_encargo", lugar = "contacto", radio = 35 },
            { "huella", acto = "traicionaste", si = { "var", "engano", true },
              texto = "Le entregue a {contacto_nombre} una pastilla de azucar y me quede con la verdadera. Me sigue dando las gracias." },
            { "huella", acto = "cumpliste", si = { "no", { "var", "engano", true } },
              texto = "Traje una pastilla K-93 desde Louisville. No sabia que era de azucar." },
            { "eco", horas = { 24, 48 }, tipo = "aviso", texto = "var:muerte_eco" },
            { "diario", si = { "var", "engano", true }, texto = "Le di a {contacto_nombre} una de azucar. La buena la tengo yo. Me dio las gracias. No se como mirarlo." },
            { "diario", si = { "no", { "var", "engano", true } }, texto = "Le entregue una pastilla a {contacto_nombre}. Ojala haya sido la buena." },
        } },
        final_te_la_quedaste = { final = true, al_entrar = {
            { "memoria", clave = "cura_{contacto}", valor = "murio", si_vacia = true },
            { "reputacion", cantidad = -20, motivo = "se quedo con la cura" },
            { "decir_contacto", texto = "Te vi la cara. No la trajiste. Alguien se va a morir esperando. Anda." },
            { "diario", texto = "Me quede con las dos dosis. {contacto_nombre} no me lo va a perdonar." },
        } },
        final_vencido = { final = true, al_entrar = {
            { "memoria", clave = "cura_{contacto}", valor = "murio", si_vacia = true },
            { "diario", texto = "No volvi a tiempo de Louisville. La persona que esperaba la cura no aguanto." },
        } },
    },
})

-- Lo que dice cada misionero al pedir la cura.
Narrador.CuraPedidos = {
    muldraugh = "Informacion clasificada, soldado: en {lugar:objetivo} hay un refrigerador con un antibiotico experimental. Cura la mordida. Tengo a un hombre mordido en la bodega. Traiga dos dosis: una para el, otra para usted. Es una orden.",
    westpoint = "Mijito, escuchame bien. En {lugar:objetivo} guardaban un remedio que cura la mordida. La hija de una vecina esta mordida. Trae dos: una para ella y una pa ti. Y vuelve, por favor.",
    riverside = "Hijo, existe un milagro con nombre de laboratorio. Esta en {lugar:objetivo}. Uno de mis feligreses fue mordido. Trae una dosis para el. La otra, guardala: el Senor sabe para quien es.",
    rosewood = "Mijo, en {lugar:objetivo} hay un antibiotico que cura a los mordidos. Mi sobrino esta en la bodega con fiebre. Traeme una. La otra quedatela, que aca nadie regala nada.",
}
Narrador.CuraGracias = {
    muldraugh = "Recibido. El hombre de la bodega le debe la vida. Yo tambien. Firme, soldado.",
    westpoint = "Ay, mijito. Ay, mijito. Ven aca que te abrazo. Toma, todo esto es tuyo.",
    riverside = "Esto si es un milagro, hijo. Y lo trajiste tu. Toma, te lo ganaste.",
    rosewood = "Mi sobrino va a vivir. Mijo, la gasolinera es tuya. Bueno, casi. Toma.",
}

Narrador.CuraMuerte = {
    muldraugh = "El Cabo Ramiro te manda decir: el hombre de la bodega no lo logro. 'No fue su culpa, soldado. Usted fue hasta Louisville.'",
    westpoint = "La Tia Chela te manda decir: la hija de la vecina no aguanto. 'No es tu culpa, mijito. Hiciste todo lo que podias.'",
    riverside = "El Padre Nacho te manda decir: el feligres se fue con el Senor. 'Tu hiciste tu parte, hijo. El resto no era tuyo.'",
    rosewood = "Misia Rosa te manda decir: su sobrino no lo logro. 'No me mires asi, mijo. Fuiste. Eso es lo que importa.'",
}

-- Lo que agrega la Chela al pedir la cura si el doctor Hartmann ya confeso (hartmann_k93).
Narrador.CuraAguaChela = "Y llevate agua, mijo. El doctor dice que las de azucar se deshacen en un vaso en menos de un minuto. El sabra por que."

-- ===========================================================================
-- La K chueca: alguien vio deshacerse una K-93 falsa en agua (memoria k93_falsa_vista) y el
-- doctor Hartmann ya vive en el cuartel de la Chela (cientifico_hartmann = en_west_point). Lo
-- lanza server/Narrador/NarradorCuraServer.lua (CS.revisarHartmann) cuando pasas cerca de la
-- Chela. Canon (fichas de Hartmann y de Eduardo): Hartmann fabrico 240 K-93 falsas en junio de
-- 1993 para Lonnie Gaskins, con la K grabada a mano y la pata de abajo mas corta; la prueba del
-- agua la dijo por la radio. Si se lo cuentas a la Chela, ella le pregunta como sabia y el
-- confiesa (hartmann_k93 = confeso). Si no, queda callado. Si lo trajiste despues de ver la
-- falsa, la misma confesion pasa al llegar (final de leyenda_eduardo).
-- ===========================================================================
Narrador.Defs.registrar({
    id = "hartmann_k93",
    titulo = "La K chueca",
    titulo_menu = "La K chueca (el doctor Hartmann y las K-93)",
    requiere_alife = true, automatico = false, max_veces = 1,
    inicio = "cocina",
    etapas = {
        cocina = {
            pista = "Contarle a la Tia Chela lo de la K-93 que se deshizo en el agua, o callarte (clic derecho cerca de ella).",
            ancla = "contacto",
            al_entrar = {
                { "aviso", texto = "En la cocina del cuartel, el doctor Hartmann pela papas con la bata abotonada hasta arriba. La Chela revuelve la olla y lo mira de reojo." },
                { "diario", texto = "Vi deshacerse una K-93 en un vaso de agua: la K grabada a mano, con la pata de abajo mas corta. El doctor Hartmann dijo lo del agua por la radio antes que nadie. Esta pelando papas en la cocina de la Chela." },
            },
            opciones = {
                { id = "contar", texto = "Contarle a la Chela lo de la pastilla que se deshizo, y la K chueca" },
                { id = "callar", texto = "No decir nada",
                  respuesta = "Te sirves un plato y no dices nada. El doctor sigue pelando papas, una por una, sin levantar la vista." },
            },
            salidas = {
                { cuando = { "eleccion", "contar" }, ir = "confesion" },
                { cuando = { "eleccion", "callar" }, ir = "final_callado" },
                { cuando = { "horas", 6 }, ir = "final_callado" },
            },
        },
        confesion = {
            al_entrar = {
                { "decir_contacto", texto = "Una K grabada a mano, con la pata de abajo mas corta? ... Doctor. Usted dijo lo del agua por la radio antes que nadie. Como sabia?" },
                { "aviso", retraso = 0.05, texto = "El doctor Hartmann deja el cuchillo y se abotona la bata, aunque ya esta abotonada: 'Porque la K la grabe yo, estimada. Con mi lima de relojero. Doscientas cuarenta, en junio, para un tecnico que tenia que cuadrar un inventario. Agua, azucar, almidon y colorante. Pense que nadie iba a llegar tan lejos por una caja de pastillas.'" },
                { "decir_contacto", retraso = 0.1, texto = "Aqui trabaja hasta el charlatan, mijo. Que siga pelando papas. Pero en mi cocina no se le vende nada a nadie. Ni una pastilla." },
                { "decir_eduardo", retraso = 0.12, texto = "El doctor me enseno lo del agua por la radio y yo le crei todo. ... Igual me dio algo que creer, amigo. Eso tambien cuenta." },
            },
            salidas = { { cuando = { "horas", 0.15 }, ir = "final_confeso" } },
        },
        final_confeso = { final = true, al_entrar = {
            { "memoria", clave = "hartmann_k93", valor = "confeso" },
            { "huella", acto = "verdad", texto = "Le conte a la Chela lo de la K-93 que se deshizo en agua. El doctor Hartmann confeso que las hizo el." },
            { "diario", texto = "El doctor Hartmann hizo las K-93 de azucar: doscientas cuarenta, con la K grabada a mano. Se lo confeso a la Chela delante de mi. Ella lo dejo pelando papas." },
        } },
        final_callado = { final = true, al_entrar = {
            { "memoria", clave = "hartmann_k93", valor = "callado" },
            { "diario", texto = "No dije nada de la K chueca. El doctor Hartmann sigue pelando papas en la cocina de la Chela. A veces me mira las manos." },
        } },
    },
})
