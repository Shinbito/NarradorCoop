-- El camino del bandido (ver ROADMAP). Se abre la primera vez que un grupo llega a -5 de Knox
-- (KD.BANDIDO_UMBRAL, memoria "knox_bandido_<grupo>"). Los capitulos los lanza
-- server/Narrador/NarradorBandido.lua: el 1 llega como nota a tu casa; del 2 en adelante,
-- cuando vuelves al patio de trenes de Muldraugh a pedir trabajo.
--
-- La Sargento Pereira mandaba el cordon de la Guardia en Muldraugh. Ella dio la orden de
-- cerrar la comisaria con la gente adentro y el Cabo Ramiro la desobedecio y saco a once. Desde
-- entonces se odian. Ahora tiene una banda en el patio de trenes y quiere la comisaria.
--   1 El traidor: matar a Julio Cardenas (o dejarlo ir con su hija y llevarle su placa).
--   2 La comisaria: robarle las reservas al Cabo (o avisarle y llevar una caja con piedras).
--   3 La familia: matar a los que escondieron a sus desertores (o dejarlos huir).
--   4 Las latas: quitarle la comida a un grupo de sobrevivientes (o dejarles la mitad).
--   5 La decision: matar al Cabo con Pereira (fase 2, por escribir) o matar a Pereira y
--     redimirte, con los misioneros que te tengan confianza 4 y con Eduardo si lo conociste.
-- Cada mision cumplida: -15 de Knox (KD.BANDIDOS_MISION). Las saboteadas no restan Knox pero
-- suman sospecha: al volver al patio Pereira puede descubrirte (bandido_castigo).
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"
require "Narrador/NarradorKnoxDefs"

-- Variables del jefe del patio por defecto (Pereira). NarradorBandido.lua las cambia si el
-- jefe es Maulen.
local function registrar(def)
    def.sorteo = def.sorteo or {}
    def.sorteo.bandido_jefe = { valores = { "pereira" } }
    def.sorteo.jefe_perfil = { valores = { "narrador_pereira_01" } }
    def.sorteo.jefe_nombre = { valores = { "la Sargento Pereira" } }
    def.sorteo.jefe_corto = { valores = { "Pereira" } }
    return Narrador.Defs.registrar(def)
end
local KNOX = Narrador.KnoxDefs.BANDIDOS_MISION

Narrador.Facciones = Narrador.Facciones or {}

-- El patio de trenes de Muldraugh: de 11544,9590 a 11746,10232, con varias casas. Se busca la
-- casa mas cerca del centro (11645,9911); el radio cubre todo el patio.
Narrador.BandidoPatio = {
    pueblo = "Muldraugh", nombre = "el patio de trenes de Muldraugh",
    cerca_de = { 11645, 9911, 330 },
    salas = { "livingroom", "kitchen", "bedroom" },
    respaldo = { "warehouse", "storageunit", "garagestorage", "storage", "garage" },
}

-- Maulen Callupan (apellido mapuche): piel morena, pelo largo con trarilonco (cintillo rojo
-- anudado), chaleco de tejido con rombos, trapelacucha (collar largo de plata) y botas de cuero.
-- Igual en Sous.lua (narrador_sous_10, narrador_maulen_banda) y Bandido.lua (narrador_pereira_maulen).
local MAULEN_ASPECTO = { piel = 3, pelo = "Grungey", color_pelo = "0.05,0.04,0.04" }
local MAULEN_ROPA = { Hat = "Base.Hat_BandanaTiedTINT", Top = "Base.Tshirt_DefaultTEXTURE_TINT", Jacket = "Base.Jumper_DiamondPatternTINT",
                      LongNecklace = "Base.NecklaceLong_Silver", Pants = "Base.Trousers_DefaultTEXTURE_TINT", Shoes = "Base.Shoes_HideBoots" }
local MAULEN_TINTES = { Hat = "0.65,0.08,0.08", Top = "0.10,0.09,0.09", Jacket = "0.45,0.10,0.10", Pants = "0.22,0.16,0.11" }

Narrador.Facciones.narrador_pereira = {
    id = "narrador_pereira",
    version = 3,
    nombre = "La banda de Pereira",
    descripcion = "Desertores de la Guardia Nacional y bandidos al mando de la Sargento Pereira.",
    postura = "friendly",
    desconocidos = "hostile",
    stats = { healthHP = 110, strength = 8, endurance = 8, awareness = 8, aiming = 8 },
    miembros = {
        { id = "narrador_pereira_01", respaldo = "k93_deserters_09", nombre = "Sargento Pereira", rol = "Sargento", mujer = true,
          arma = "Base.AssaultRifle", cuerpo = "Base.Machete",
          stats = { healthHP = 200, strength = 9, endurance = 10, awareness = 10, aiming = 10 },
          ropa = { Jacket = "Base.Jacket_ArmyCamoGreen", Vest = "Base.Vest_BulletArmy" } },
        { id = "narrador_pereira_02", respaldo = "k93_deserters_02", nombre = "Desertor", rol = "Banda de Pereira", nombre_al_azar = true,
          arma = "Base.AssaultRifle", cuerpo = "Base.HuntingKnife", ropa = { Jacket = "Base.Jacket_ArmyCamoGreen" } },
        { id = "narrador_pereira_03", respaldo = "k93_deserters_03", nombre = "Desertor", rol = "Banda de Pereira", nombre_al_azar = true,
          arma = "Base.Shotgun", cuerpo = "Base.Crowbar" },
        { id = "narrador_pereira_04", nombre = "Bandido", rol = "Banda de Pereira", nombre_al_azar = true, arma = "Base.Pistol", cuerpo = "Base.BaseballBat" },
        { id = "narrador_pereira_05", nombre = "Bandido", rol = "Banda de Pereira", nombre_al_azar = true, arma = "Base.HuntingRifle", cuerpo = "Base.Machete" },
        { id = "narrador_pereira_06", nombre = "Bandido", rol = "Banda de Pereira", nombre_al_azar = true, arma = "Base.Revolver", cuerpo = "Base.Axe" },
        -- Maulen Callupan, si lo dejaste ir en Sous y mato a Pereira (ver bandido_maulen).
        { id = "narrador_pereira_maulen", respaldo = "k93_truckstop_06", nombre = "Maulen Callupan", rol = "Jefe del patio",
          arma = "Base.Pistol", cuerpo = "Base.Machete",
          stats = { healthHP = 200, strength = 8, endurance = 9, awareness = 9, aiming = 8 },
          aspecto = MAULEN_ASPECTO, ropa = MAULEN_ROPA, tintes = MAULEN_TINTES },
        { id = "narrador_pereira_07", nombre = "Bandido", rol = "Banda de Pereira", nombre_al_azar = true, arma = "Base.Shotgun", cuerpo = "Base.Hammer" },
    },
}

local PEREIRA = "pereira"

-- Lo que dice el jefe del patio: la Sargento Pereira o Maulen Callupan, si lo dejaste ir en Sous
-- y la mato (memoria "bandido_jefe" = "maulen"; las variables las pone NarradorBandido.lua).
local function J(pereira, maulen) return { por_var = "bandido_jefe", textos = { maulen = maulen, otro = pereira } } end
local GUARDIA_PATIO = { { "pereira", "var:jefe_perfil" }, { "desertor1", "narrador_pereira_02" }, { "desertor2", "narrador_pereira_03" } }
local BANDA_COMPLETA = {
    { "pereira", "var:jefe_perfil" }, { "desertor1", "narrador_pereira_02" }, { "desertor2", "narrador_pereira_03" },
    { "bandido1", "narrador_pereira_04" }, { "bandido2", "narrador_pereira_05" }, { "bandido3", "narrador_pereira_06" },
    { "bandido4", "narrador_pereira_07" },
}

-- El patio (lo guarda el capitulo 1 y lo reusan los demas).
local function patio()
    local l = { "lugar_memoria", id = "patio", clave = "bandido_patio" }
    for k, v in pairs(Narrador.BandidoPatio) do l[k] = v end
    return l
end

-- Pereira (y su guardia) esperando en el patio, amistosos.
local function pereiraEnPatio(perfiles)
    return { "npcs", id = PEREIRA, lugar = "patio", radio = 40, no_mas_cerca = 8, modo = "guard", quietos = true, correa = 6,
        inmortales = true, postura = "friendly", perfiles = perfiles or GUARDIA_PATIO }
end

-- Etapas comunes: llegar al patio y que aparezca Pereira; al volver, la mision termina al
-- acercarse a ella.
local function llegarAlPatio(siguiente)
    return {
        pista = "Ir al patio de trenes de Muldraugh, donde espera {jefe_nombre}.",
        objetivo = "patio",
        al_entrar = { pereiraEnPatio() },
        salidas = {
            { cuando = { { "grupo_listo", PEREIRA }, { "cerca", "patio", 25 } }, ir = siguiente },
            { cuando = { "horas", 72 }, ir = "final_abandonado" },
        },
    }
end

local function abandonado(cap)
    return { final = true, al_entrar = {
        { "memoria", clave = "bandido_ultimo", valor = "abandonado" },
        { "diario", texto = "No volvi donde Pereira con lo del capitulo " .. cap .. ". Ella no olvida. Yo tampoco." },
    } }
end

-- Sospecha por sabotaje (la suma server/Narrador/NarradorBandido.lua).
local function sospecha() return { "sumar_memoria", clave = "bandido_sospecha", cantidad = 1 } end

-- ===========================================================================
-- Capitulo 1: El traidor
-- ===========================================================================
local JULIO = "julio"

registrar({
    id = "bandido_1",
    titulo = "El camino del bandido: el traidor",
    titulo_menu = "Bandido, cap. 1: el traidor",
    requiere_alife = true, automatico = false,
    inicio = "nota",
    etapas = {
        nota = {
            al_entrar = {
                { "lugar_casa", id = "casa" },
                patio(),
                { "memoria_lugar", lugar = "patio", clave = "bandido_patio" },
                { "faccion", id = "narrador_pereira", postura = "friendly" },
                { "nota", lugar = "casa", radio = 4, titulo = "Nota sin firma",
                  texto = "Me cuentan que en Knox ya no te quieren. Bien. A mi tampoco. Tengo trabajo para gente como tu. Patio de trenes, al oeste de Muldraugh. Ven sola o solo, y desarmado no. -P." },
                { "mapa", lugar = "patio", titulo = "Mapa de la nota: el patio de trenes" },
                { "aviso", texto = "Alguien dejo una nota en {lugar:casa}. No hay huellas en el barro. Sabe lo que hace." },
                { "diario", texto = "Me dejaron una nota en {lugar:casa}, firmada con una P. Dice que en Knox ya no me quieren y que tiene trabajo para gente como yo. Me cita en {lugar:patio}." },
            },
            salidas = { { ir = "citacion" } },
        },
        citacion = llegarAlPatio("reunion"),
        reunion = {
            pista = "Hablar con la Sargento Pereira en {lugar:patio} (clic derecho cerca).",
            ancla = "patio", ancla_grupo = PEREIRA, radio = 20,
            al_entrar = {
                { "decir", grupo = PEREIRA, rol = "pereira", texto = "Sargento Pereira, Guardia Nacional. Lo que queda de ella. No me mires las botas, mirame a los ojos." },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.05, texto = "En Knox hay dos tipos de gente: los que dan ordenes y los que se mueren esperando que alguien las de. Tu ya elegiste. Te lo noto en la cara." },
            },
            opciones = {
                { id = "aceptar", texto = "Que necesitas?",
                  dice = { rol = "pereira", texto = "Un traidor. Julio Cardenas se fue con raciones de la banda. Se esconde en una casa. Lo quiero muerto. Es tu entrada." } },
                { id = "rechazar", texto = "No trabajo para nadie",
                  dice = { rol = "pereira", texto = "Todos trabajan para alguien. Algunos todavia no lo saben. La puerta queda abierta." } },
            },
            salidas = {
                { cuando = { "eleccion", "aceptar" }, ir = "encargo" },
                { cuando = { "eleccion", "rechazar" }, ir = "final_rechazo" },
                { cuando = { "horas", 24 }, ir = "final_abandonado" },
            },
        },
        encargo = {
            al_entrar = {
                { "lugar", id = "escondite", desde = "patio", salas = { "livingroom", "kitchen", "bedroom" }, min = 300, max = 1200 },
                { "mapa", lugar = "escondite", titulo = "Mapa de Pereira: Julio Cardenas" },
                { "reloj", id = "plazo", horas = 72 },
                { "diario", texto = "Pereira quiere muerto a Julio Cardenas, uno de los suyos que se fue con raciones. Esta escondido en {lugar:escondite}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Encontrar a Julio Cardenas en {lugar:escondite}.",
            objetivo = "escondite",
            salidas = {
                { cuando = { "cerca", "escondite", 40 }, ir = "escondite" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        escondite = {
            pista = "Encontrar a Julio Cardenas en {lugar:escondite}.",
            objetivo = "escondite",
            al_entrar = {
                { "npcs", id = JULIO, lugar = "escondite", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  inmortales = true, postura = "friendly", femeninos = { "hija" },
                  perfiles = { { "julio", "k93_truckstop_02" }, { "hija", "k93_hensley_family_03" } },
                  nombres = { julio = { "Julio", "Cardenas" }, hija = { "Marisol", "Cardenas" } } },
                { "oleada", lugar = "escondite", radio = 50, cantidad = { 8, 12 }, min = 20, max = 40 },
            },
            salidas = {
                { cuando = { { "grupo_listo", JULIO }, { "cerca", "escondite", 15 } }, ir = "frente" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        frente = {
            pista = "Decidir que hacer con Julio Cardenas (clic derecho cerca).",
            ancla = "escondite", ancla_grupo = JULIO, radio = 15,
            al_entrar = {
                { "banderas", grupo = JULIO, inmortales = false },
                { "decir", grupo = JULIO, rol = "julio", texto = "Te mando la Sargento, cierto? Lo veo en como caminas. Mira... me lleve comida para la nina. Para Marisol. Nada mas." },
                { "decir", grupo = JULIO, rol = "hija", retraso = 0.05, texto = "Papa, quien es?" },
                { "decir", grupo = JULIO, rol = "julio", retraso = 0.1, texto = "Si me vas a matar, que no sea delante de ella. Te lo pido por favor." },
            },
            opciones = {
                { id = "perdonar", texto = "Dejarlo ir. Pedirle su placa como prueba",
                  dice = { rol = "julio", texto = "Toma. Mi placa de la Guardia. Dile que me enterraste con la cara para abajo, asi no pregunta. Nunca te voy a olvidar." },
                  acciones = { { "variable", nombre = "perdonado", valor = true } } },
            },
            salidas = {
                { cuando = { "muerto", JULIO, "julio" }, ir = "muerto" },
                { cuando = { "eleccion", "perdonar" }, ir = "huida" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        muerto = {
            al_entrar = {
                { "huella", acto = "mataste", texto = "Mate a Julio Cardenas por orden de la Sargento Pereira. Su hija lo vio." },
                { "retirar_lejos", grupo = JULIO, lugar = "escondite", radio = 60, retraso = 0.3 },
                { "diario", texto = "Julio Cardenas esta muerto. Marisol salio corriendo y no la segui. Ahora hay que contarselo a Pereira." },
            },
            salidas = { { ir = "volver" } },
        },
        huida = {
            al_entrar = {
                { "objeto", id = "placa", lugar = "escondite", radio = 6, tipo = { "Base.Necklace_DogTag" }, nombre = "Placa de Julio Cardenas" },
                { "huella", acto = "perdonaste", texto = "Deje ir a Julio Cardenas y a su hija Marisol. Pereira cree que esta muerto." },
                { "retirar_lejos", grupo = JULIO, lugar = "escondite", radio = 70, retraso = 0.3 },
                { "memoria", clave = "julio_vivo", valor = true },
                { "diario", texto = "Deje ir a Julio y a Marisol. Me dio su placa para enganar a Pereira. Si se da cuenta, el muerto soy yo." },
            },
            salidas = { { ir = "volver" } },
        },
        volver = {
            pista = "Volver donde la Sargento Pereira, en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = { pereiraEnPatio() },
            salidas = { { cuando = { { "grupo_listo", PEREIRA }, { "cerca", "patio", 20 } }, ir = "informe" } },
        },
        informe = {
            al_entrar = {
                { "decir", grupo = PEREIRA, rol = "pereira", si = { "no", { "var", "perdonado", true } },
                  texto = "Ya me contaron. Limpio. Sin discursos. Bienvenido a la banda. Aqui no hay misioneros: hay ordenes." },
                { "decir", grupo = PEREIRA, rol = "pereira", si = { "var", "perdonado", true },
                  texto = "Su placa. Hmm. Cara para abajo, dices. Bien. Bienvenido a la banda. La proxima vez quiero ver la sangre." },
            },
            salidas = {
                { cuando = { "var", "perdonado", true }, ir = "final_perdonado" },
                { ir = "final_cumplido" },
            },
        },
        final_cumplido = { final = true, al_entrar = {
            { "knox", cantidad = KNOX, motivo = "bandido: el traidor" },
            { "memoria", clave = "bandido_cap", valor = 1 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "Mate a Julio Cardenas para la Sargento Pereira. Ahora soy parte de su banda." },
        } },
        final_perdonado = { final = true, al_entrar = {
            { "memoria", clave = "bandido_cap", valor = 1 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "Pereira se trago lo de la placa. Julio y Marisol estan vivos en algun lado. Yo estoy adentro de la banda." },
        } },
        final_rechazo = { final = true, al_entrar = {
            { "memoria", clave = "bandido", valor = "rechazado" },
            { "diario", texto = "Le dije a Pereira que no trabajo para nadie. Me dejo ir. Dijo que la puerta queda abierta." },
        } },
        final_abandonado = abandonado(1),
    },
})

-- ===========================================================================
-- Capitulo 2: La comisaria (robarle al Cabo)
-- ===========================================================================
registrar({
    id = "bandido_2",
    titulo = "El camino del bandido: la comisaria",
    titulo_menu = "Bandido, cap. 2: la comisaria",
    requiere_alife = true, automatico = false,
    inicio = "orden",
    etapas = {
        orden = {
            al_entrar = { patio(), pereiraEnPatio() },
            salidas = {
                { cuando = { "grupo_listo", PEREIRA }, ir = "historia" },
                { cuando = { "horas", 6 }, ir = "final_abandonado" },
            },
        },
        historia = {
            pista = "Escuchar a {jefe_nombre} en {lugar:patio}.",
            ancla = "patio", ancla_grupo = PEREIRA, radio = 20,
            al_entrar = {
                { "decir", grupo = PEREIRA, rol = "pereira", texto = J("La primera noche yo mandaba el cordon de Muldraugh. La comisaria estaba llena de mordidos y de sanos, todos mezclados. Ordene cerrar. Protocolo.", "La sargento tenia una libreta, peni. Antes de quemarla la lei entera. Habla de una comisaria y de un cabo que le abrio la puerta a once personas.") },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.08, texto = J("Un cabo de mierda abrio la puerta de atras y saco a once. Por esos once se me escaparon cuarenta muertos al pueblo. El heroe es el. Las tumbas son mias.", "Yo con el cabo no tengo nada. Pero el cabo tiene reservas, y una banda come mucho. Mas que atun, peni.") },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.16, texto = J("Ese cabo hoy tiene un campamento en mi comisaria. Anda de noche y traeme sus reservas. Toda la caja.", "Anda de noche y traeme sus reservas. Toda la caja. Educadamente, si se puede.") },
            },
            opciones = {
                { id = "aceptar", texto = "Voy esta noche",
                  dice = { rol = "pereira", texto = J("De noche. Sin ruido. Si te ve, no te conozco.", "De noche, peni. Y si te ve, saludalo de mi parte. Broma. Broma.") } },
            },
            salidas = {
                { cuando = { "eleccion", "aceptar" }, ir = "encargo" },
                { cuando = { "horas", 24 }, ir = "final_abandonado" },
            },
        },
        encargo = {
            al_entrar = {
                { "lugar_contacto", id = "comisaria", contacto = "muldraugh" },
                { "reloj", id = "plazo", horas = 72 },
                { "diario", texto = J("Pereira me conto su version de la comisaria: ella ordeno cerrar, el Cabo Ramiro abrio. Quiere que le robe las reservas al Cabo, de noche.", "Maulen leyo en la libreta de la sargento la historia de la comisaria. No le importa quien tenia razon: quiere las reservas del Cabo, de noche.") },
            },
            salidas = { { ir = "acercarse" } },
        },
        acercarse = {
            pista = "Robar las reservas del Cabo Ramiro en {lugar:comisaria}, de noche (entre las 22 y las 5). O avisarle (clic derecho cerca de el).",
            objetivo = "comisaria",
            ancla = "comisaria", radio = 25,
            opciones = {
                { id = "avisar", texto = "Avisarle al Cabo lo que quiere {jefe_corto}",
                  respuesta = "El Cabo te escucha sin parpadear. Cuando terminas, saca la libreta y escribe un nombre: {jefe_corto}." },
            },
            salidas = {
                { cuando = { "eleccion", "avisar" }, ir = "avisado" },
                { cuando = { { "cerca", "comisaria", 20 }, { "hora_entre", 22, 5 } }, ir = "robo" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        robo = {
            pista = "Llevarte la caja de reservas del Cabo sin que te vean.",
            objetivo = "comisaria",
            al_entrar = {
                { "objeto", id = "caja", lugar = "comisaria", radio = 10, tipo = { "Base.Bag_DuffelBag" }, nombre = "Reservas del Cabo Ramiro" },
                { "aviso", texto = "La caja de reservas del campamento esta junto a la puerta. El guardia de turno cabecea." },
            },
            salidas = {
                { cuando = { "alguien_tiene", "caja" }, ir = "robado" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        robado = {
            al_entrar = {
                { "robar_reservas", contacto = "muldraugh", cantidad = 30 },
                { "reputacion", contacto = "muldraugh", cantidad = -40, motivo = "le robaste las reservas" },
                { "diario", texto = "Me lleve las reservas del campamento del Cabo Ramiro. Manana va a contar las latas y no le van a cuadrar." },
            },
            salidas = { { ir = "volver" } },
        },
        avisado = {
            al_entrar = {
                { "decir_contacto", texto = J("Pereira. Negativo a sorprenderme, civil: la esperaba. Llevele esto. Piedras y latas vacias. Que crea que gano. Yo anoto.", "Callupan? El de los chilenos? Negativo a sorprenderme, civil. Llevele esto: piedras y latas vacias. Que crea que gano. Yo anoto.") },
                { "objeto", id = "caja", lugar = "comisaria", radio = 6, tipo = { "Base.Bag_DuffelBag" }, nombre = "Reservas del Cabo Ramiro" },
                { "variable", nombre = "sabotaje", valor = true },
                { "reputacion", contacto = "muldraugh", cantidad = 10, motivo = "le avisaste de Pereira" },
                { "diario", texto = "Le avise al Cabo. Me dio una caja con piedras para {jefe_corto}. Si la abre delante de mi, estoy muerto." },
            },
            salidas = { { cuando = { "alguien_tiene", "caja" }, ir = "volver" } },
        },
        volver = {
            pista = "Llevarle la caja a {jefe_nombre}, en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = { pereiraEnPatio() },
            salidas = { { cuando = { { "grupo_listo", PEREIRA }, { "cerca", "patio", 20 } }, ir = "informe" } },
        },
        informe = {
            al_entrar = {
                { "quitar_objeto", id = "caja" },
                { "decir", grupo = PEREIRA, rol = "pereira", texto = J("La caja del cabo. Pesa lo justo. Esta noche duerme con hambre por primera vez desde que me robo la gloria.", "La caja del cabo. Pesa lo justo. El inventario lo llevo yo, ya sabes que se me da bien.") },
            },
            salidas = {
                { cuando = { "var", "sabotaje", true }, ir = "final_saboteado" },
                { ir = "final_cumplido" },
            },
        },
        final_cumplido = { final = true, al_entrar = {
            { "knox", cantidad = KNOX, motivo = "bandido: robo al Cabo" },
            { "memoria", clave = "bandido_cap", valor = 2 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "Le robe las reservas al Cabo Ramiro para {jefe_corto}. El campamento de Muldraugh va a pasar hambre." },
        } },
        final_saboteado = { final = true, al_entrar = {
            sospecha(),
            { "memoria", clave = "bandido_cap", valor = 2 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "{jefe_corto} recibio la caja con piedras sin abrirla. Por ahora. El Cabo sabe lo que viene." },
        } },
        final_abandonado = abandonado(2),
    },
})

-- ===========================================================================
-- Capitulo 3: La familia
-- ===========================================================================
local FAMILIA = "familia"

registrar({
    id = "bandido_3",
    titulo = "El camino del bandido: la familia",
    titulo_menu = "Bandido, cap. 3: la familia",
    requiere_alife = true, automatico = false,
    inicio = "orden",
    etapas = {
        orden = {
            al_entrar = { patio(), pereiraEnPatio() },
            salidas = {
                { cuando = { "grupo_listo", PEREIRA }, ir = "pedido" },
                { cuando = { "horas", 6 }, ir = "final_abandonado" },
            },
        },
        pedido = {
            pista = "Escuchar a {jefe_nombre} en {lugar:patio}.",
            ancla = "patio", ancla_grupo = PEREIRA, radio = 20,
            al_entrar = {
                { "lugar", id = "casa", desde = "patio", salas = { "livingroom", "kitchen", "bedroom" }, min = 400, max = 1400 },
                { "decir", grupo = PEREIRA, rol = "pereira", texto = J("Tres de mis hombres desertaron. Una familia los escondio una semana en {lugar:casa}. Les dio sopa y les curo los pies.", "Tres de los muchachos de la sargento se fueron cuando yo llegue. Una familia los escondio una semana en {lugar:casa}. Les dio sopa.") },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.08, texto = J("Eso tiene un precio. Que todo Knox sepa que esconder a mis desertores se paga. Todos. Nadie queda para contarlo.", "Mi chuchu decia que el que esconde a un ladron es ladron. Yo era el ladron, asi que se de lo que hablo. Que no quede nadie, peni.") },
            },
            opciones = {
                { id = "aceptar", texto = "Entendido",
                  dice = { rol = "pereira", texto = J("No me traigas excusas. Traeme silencio.", "Rapido y en silencio. Como cuando yo vaciaba el deposito de Sous.") } },
            },
            salidas = {
                { cuando = { "eleccion", "aceptar" }, ir = "encargo" },
                { cuando = { "horas", 24 }, ir = "final_abandonado" },
            },
        },
        encargo = {
            al_entrar = {
                { "mapa", lugar = "casa", titulo = "Mapa de {jefe_corto}: la familia" },
                { "reloj", id = "plazo", horas = 72 },
                { "diario", texto = "{jefe_corto} quiere muerta a una familia en {lugar:casa}. Su crimen: darle sopa a tres desertores." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:casa}.",
            objetivo = "casa",
            salidas = {
                { cuando = { "cerca", "casa", 40 }, ir = "casa" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        casa = {
            pista = "Encontrar a la familia en {lugar:casa}.",
            objetivo = "casa",
            al_entrar = {
                { "npcs", id = FAMILIA, lugar = "casa", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  inmortales = true, postura = "friendly", femeninos = { "madre" },
                  perfiles = { { "padre", "k93_hensley_family_01" }, { "madre", "k93_hensley_family_03" }, { "hijo", "k93_hensley_family_04" } },
                  nombres = { padre = { "Arturo", "Salinas" }, madre = { "Rosario", "Salinas" }, hijo = { "Tomasito", "Salinas" } } },
            },
            salidas = {
                { cuando = { { "grupo_listo", FAMILIA }, { "cerca", "casa", 15 } }, ir = "frente" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        frente = {
            pista = "Decidir que hacer con la familia Salinas (clic derecho cerca).",
            ancla = "casa", ancla_grupo = FAMILIA, radio = 15,
            al_entrar = {
                { "banderas", grupo = FAMILIA, inmortales = false },
                { "decir", grupo = FAMILIA, rol = "padre", texto = "Buenas... tiene hambre? Queda sopa. Siempre queda sopa para el que llega." },
                { "decir", grupo = FAMILIA, rol = "madre", retraso = 0.05, texto = "Arturo. Mira lo que trae en la mano." },
                { "decir", grupo = FAMILIA, rol = "hijo", retraso = 0.1, texto = "Mama, por que el senor no se sienta?" },
            },
            opciones = {
                { id = "avisar", texto = "Decirles que huyan esta noche. Pedirles algo para enganar a {jefe_corto}",
                  dice = { rol = "padre", texto = "Mi anillo de casado. Digale que me lo saco de la mano fria. Nos vamos al sur. Que Dios lo cuide." },
                  acciones = { { "variable", nombre = "sabotaje", valor = true } } },
            },
            salidas = {
                { cuando = { "todos_muertos", FAMILIA }, ir = "muertos" },
                { cuando = { "eleccion", "avisar" }, ir = "huida" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        muertos = {
            al_entrar = {
                { "huella", acto = "mataste", texto = "Mate a la familia Salinas por orden de {jefe_corto}. Me ofrecieron sopa." },
                { "diario", texto = "Los Salinas estan muertos. El chico me pregunto por que no me sentaba. No me sente." },
            },
            salidas = { { ir = "volver" } },
        },
        huida = {
            al_entrar = {
                { "objeto", id = "prueba", lugar = "casa", radio = 6, tipo = { "Base.Ring_Left_RingFinger_Gold", "Base.Ring_Right_RingFinger_Gold" },
                  nombre = "Anillo de Arturo Salinas" },
                { "huella", acto = "salvaste", texto = "Deje huir a la familia Salinas en vez de matarla para {jefe_corto}." },
                { "retirar_lejos", grupo = FAMILIA, lugar = "casa", radio = 80, retraso = 0.3 },
                { "diario", texto = "Los Salinas huyeron al sur. Llevo el anillo de Arturo como prueba falsa. {jefe_corto} huele las mentiras." },
            },
            salidas = { { ir = "volver" } },
        },
        volver = {
            pista = "Volver donde {jefe_nombre}, en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = { pereiraEnPatio() },
            salidas = { { cuando = { { "grupo_listo", PEREIRA }, { "cerca", "patio", 20 } }, ir = "informe" } },
        },
        informe = {
            al_entrar = {
                { "decir", grupo = PEREIRA, rol = "pereira", texto = J("Silencio en {lugar:casa}. Bien. Ahora en Knox van a pensar dos veces antes de dar sopa.", "Silencio en {lugar:casa}. Ya ves, peni: aca todos somos amigos. Todos.") },
            },
            salidas = {
                { cuando = { "var", "sabotaje", true }, ir = "final_saboteado" },
                { ir = "final_cumplido" },
            },
        },
        final_cumplido = { final = true, al_entrar = {
            { "knox", cantidad = KNOX, motivo = "bandido: la familia" },
            { "memoria", clave = "bandido_cap", valor = 3 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "Mate a la familia Salinas para {jefe_corto}. Ya no se que escribir aqui." },
        } },
        final_saboteado = { final = true, al_entrar = {
            sospecha(),
            { "quitar_objeto", id = "prueba" },
            { "memoria", clave = "bandido_cap", valor = 3 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "{jefe_corto} se quedo con el anillo de Arturo. Los Salinas estan vivos, lejos. Cada mentira me pesa un poco mas." },
        } },
        final_abandonado = abandonado(3),
    },
})

-- ===========================================================================
-- Capitulo 4: Las latas
-- ===========================================================================
local GRUPO = "sobrevivientes"

registrar({
    id = "bandido_4",
    titulo = "El camino del bandido: las latas",
    titulo_menu = "Bandido, cap. 4: las latas",
    requiere_alife = true, automatico = false,
    inicio = "orden",
    etapas = {
        orden = {
            al_entrar = { patio(), pereiraEnPatio() },
            salidas = {
                { cuando = { "grupo_listo", PEREIRA }, ir = "pedido" },
                { cuando = { "horas", 6 }, ir = "final_abandonado" },
            },
        },
        pedido = {
            pista = "Escuchar a {jefe_nombre} en {lugar:patio}.",
            ancla = "patio", ancla_grupo = PEREIRA, radio = 20,
            al_entrar = {
                { "lugar", id = "almacen", desde = "patio", salas = { "grocery", "grocerystorage", "conveniencestore", "warehouse" },
                  respaldo = { "kitchen", "storage" }, min = 400, max = 1500 },
                { "decir", grupo = PEREIRA, rol = "pereira", texto = J("Un grupo de civiles junto latas para el invierno en {lugar:almacen}. Muchas latas. Demasiadas para gente que no sabe defenderlas.", "Un grupo de civiles junto latas para el invierno en {lugar:almacen}. Me dicen que hay atun. Mucho atun.") },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.08, texto = J("Traemelas todas. El invierno es de los fuertes.", "Traemelas todas. El atun primero.") },
            },
            opciones = {
                { id = "aceptar", texto = "Todas",
                  dice = { rol = "pereira", texto = J("Todas. Si lloran, que lloren con la boca cerrada.", "Todas, peni. Si lloran, que lloren despacito.") } },
            },
            salidas = {
                { cuando = { "eleccion", "aceptar" }, ir = "encargo" },
                { cuando = { "horas", 24 }, ir = "final_abandonado" },
            },
        },
        encargo = {
            al_entrar = {
                { "mapa", lugar = "almacen", titulo = "Mapa de {jefe_corto}: las latas" },
                { "reloj", id = "plazo", horas = 72 },
                { "diario", texto = "{jefe_corto} quiere la comida que un grupo de sobrevivientes junto para el invierno en {lugar:almacen}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:almacen}.",
            objetivo = "almacen",
            salidas = {
                { cuando = { "cerca", "almacen", 40 }, ir = "almacen" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        almacen = {
            pista = "Encontrar al grupo en {lugar:almacen}.",
            objetivo = "almacen",
            al_entrar = {
                { "npcs", id = GRUPO, lugar = "almacen", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 5,
                  inmortales = true, postura = "friendly", femeninos = { "abuela" },
                  perfiles = { { "jefe", "k93_truckstop_05" }, { "abuela", "k93_red_cross_04" }, { "chico", "k93_kessinger_02" } },
                  nombres = { jefe = { "Ramon", "Quispe" }, abuela = { "Dona Elba", "Quispe" }, chico = { "Kevin", "Morales" } } },
                { "oleada", lugar = "almacen", radio = 50, cantidad = { 10, 14 }, min = 20, max = 40 },
            },
            salidas = {
                { cuando = { { "grupo_listo", GRUPO }, { "cerca", "almacen", 15 } }, ir = "frente" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        frente = {
            pista = "Decidir que hacer con la comida del grupo (clic derecho cerca).",
            ancla = "almacen", ancla_grupo = GRUPO, radio = 15,
            al_entrar = {
                { "decir", grupo = GRUPO, rol = "jefe", texto = "Alto ahi. Esto lo juntamos en tres meses. Somos once. Hay cuatro ninos." },
                { "decir", grupo = GRUPO, rol = "abuela", retraso = 0.05, texto = "Ramon, dejalo hablar. Tiene cara de cansado, no de malo." },
            },
            opciones = {
                { id = "todo", texto = "Quitarles todo",
                  dice = { rol = "jefe", texto = "Llevatelo. Y cuando vengan los muertos a buscarnos flacos, acuerdate de esta cara." },
                  acciones = { { "huella", acto = "obligaste", texto = "Le quite toda la comida para el invierno a un grupo de once, con cuatro ninos." } } },
                { id = "mitad", texto = "Llevarte la mitad y decirles que escondan el resto",
                  dice = { rol = "abuela", texto = "La mitad. Que Dios te lo pague, mijo. Al menos los ninos comen." },
                  acciones = { { "variable", nombre = "sabotaje", valor = true },
                               { "huella", acto = "compartiste", texto = "Le deje la mitad de la comida a un grupo que {jefe_corto} queria dejar sin nada." } } },
            },
            salidas = {
                { cuando = { "o", { "eleccion", "todo" }, { "eleccion", "mitad" } }, ir = "carga" },
                { cuando = { "todos_muertos", GRUPO }, ir = "carga" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        carga = {
            pista = "Cargar las provisiones en {lugar:almacen}.",
            al_entrar = {
                { "objeto", id = "latas", lugar = "almacen", radio = 6, tipo = { "Base.Bag_DuffelBag" }, nombre = "Provisiones del grupo de Ramon" },
                { "retirar_lejos", grupo = GRUPO, lugar = "almacen", radio = 70, retraso = 0.5 },
            },
            salidas = { { cuando = { "alguien_tiene", "latas" }, ir = "volver" } },
        },
        volver = {
            pista = "Llevarle las provisiones a {jefe_nombre}, en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = { pereiraEnPatio() },
            salidas = { { cuando = { { "grupo_listo", PEREIRA }, { "cerca", "patio", 20 } }, ir = "informe" } },
        },
        informe = {
            al_entrar = {
                { "quitar_objeto", id = "latas" },
                { "decir", grupo = PEREIRA, rol = "pereira", texto = J("Latas. Bien. Ya estas listo para lo grande. Vuelve cuando quieras saber que es lo grande.", "Latas. Y atun. Ya estas listo para lo grande, peni. Vuelve cuando quieras saber que es lo grande.") },
            },
            salidas = {
                { cuando = { "var", "sabotaje", true }, ir = "final_saboteado" },
                { ir = "final_cumplido" },
            },
        },
        final_cumplido = { final = true, al_entrar = {
            { "knox", cantidad = KNOX, motivo = "bandido: las latas" },
            { "memoria", clave = "bandido_cap", valor = 4 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "Le quite el invierno a once personas para {jefe_corto}. Cuatro eran ninos." },
        } },
        final_saboteado = { final = true, al_entrar = {
            sospecha(),
            { "memoria", clave = "bandido_cap", valor = 4 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "Le lleve a {jefe_corto} la mitad de las latas. La otra mitad la escondieron los Quispe. {jefe_corto} conto dos veces." },
        } },
        final_abandonado = abandonado(4),
    },
})

-- ===========================================================================
-- Capitulo 5: La decision
-- ===========================================================================
local ALIADOS = {
    { contacto = "muldraugh", rol = "guardia_cabo", perfiles = { { "guardia_cabo", "k93_muldraugh_pd_02" }, { "guardia_cabo2", "k93_muldraugh_pd_03" } },
      aviso = "Llegan dos guardias del Cabo Ramiro: 'El Cabo manda decir: firme, civil. Hoy se cobra lo de la comisaria.'" },
    { contacto = "westpoint", rol = "guardia_chela", perfiles = { { "guardia_chela", "k93_vfd_01" }, { "guardia_chela2", "k93_vfd_02" } },
      aviso = "Llegan dos bomberos de la Tia Chela: 'La Chela dice que le traigas el pelo de esa sargento. Y que comas algo despues.'" },
    { contacto = "riverside", rol = "guardia_nacho", perfiles = { { "guardia_nacho", "k93_prather_02" }, { "guardia_nacho2", "k93_prather_03" } },
      aviso = "Llegan dos hombres del Padre Nacho: 'El Padre bendijo las balas. Dice que Dios no, pero el si pone la otra mejilla con calma.'" },
    { contacto = "rosewood", rol = "guardia_rosa", perfiles = { { "guardia_rosa", "k93_truckstop_01" }, { "guardia_rosa2", "k93_truckstop_03" } },
      aviso = "Llegan dos camioneros de la Misia Rosa: 'La Misia dice que tu eres su luz prendida. Que no se apague hoy.'" },
}

local asalto = {
    { "faccion", id = "narrador_pereira", postura = "hostile" },
    { "npcs", id = "banda", lugar = "patio", radio = 50, modo = "guard", correa = 25, postura = "hostile", hostiles = true,
      perfiles = BANDA_COMPLETA },
    { "aviso", texto = "El patio de trenes esta en pie de guerra. {jefe_corto} sabe que vienes." },
}
for i, a in ipairs(ALIADOS) do
    asalto[#asalto + 1] = { "npcs", id = "aliados_" .. i, lugar = "patio", radio = 70, no_mas_cerca = 30, modo = "guard", correa = 40,
        postura = "friendly", perfiles = a.perfiles, si = { "rep_minima", a.contacto, 70 } }
    asalto[#asalto + 1] = { "aviso", texto = a.aviso, si = { "rep_minima", a.contacto, 70 } }
end
asalto[#asalto + 1] = { "npcs", id = "eduardo", lugar = "patio", radio = 70, no_mas_cerca = 30, modo = "guard", correa = 40,
    postura = "friendly", salud = 400, banderas = { health = 400, damageOutput = 300 }, si = { "mem", "eduardo_conocido" },
    perfiles = { { "eduardo", "k93_stockyard_05" } }, nombres = { eduardo = { "Eduardo", "Giovanns" } } }
asalto[#asalto + 1] = { "npcs", id = JULIO, lugar = "patio", radio = 70, no_mas_cerca = 30, modo = "guard", correa = 40,
    postura = "friendly", si = { "mem", "julio_vivo" },
    perfiles = { { "julio", "k93_truckstop_02" } }, nombres = { julio = { "Julio", "Cardenas" } } }

registrar({
    id = "bandido_5",
    titulo = "El camino del bandido: la decision",
    titulo_menu = "Bandido, cap. 5: la decision",
    requiere_alife = true, automatico = false,
    inicio = "orden",
    etapas = {
        orden = {
            al_entrar = { patio(), pereiraEnPatio() },
            salidas = {
                { cuando = { "grupo_listo", PEREIRA }, ir = "plan" },
                { cuando = { "horas", 6 }, ir = "final_abandonado" },
            },
        },
        plan = {
            pista = "Decidir de que lado estas (clic derecho cerca de {jefe_nombre}).",
            ancla = "patio", ancla_grupo = PEREIRA, radio = 20,
            al_entrar = {
                { "decir", grupo = PEREIRA, rol = "pereira", texto = J("Lo grande. Manana tomamos la comisaria. El cabo muere en la misma puerta que abrio. Tu vas adelante, a mi derecha.", "Lo grande: manana vamos por Sous. Me echaron, me cazaron, me dejaron solo con atun y lechuga. Akagami muere colgado de su barra oxidada.") },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.08, texto = J("Despues Muldraugh. Despues Knox entero. Los misioneros son curitas en una herida que hay que cauterizar.", "Despues el cabo y despues Knox entero. Pero primero Sous. Mi chuchu decia que uno es de la tierra. Esa base es mia.") },
            },
            opciones = {
                { id = "con_pereira", texto = "A tu derecha, {jefe_corto}",
                  dice = { rol = "pereira", texto = J("Eso queria escuchar. Duerme. Manana empieza Knox.", "Sabia que no me ibas a fallar, peni. Tu me dejaste vivir. Ahora vivimos los dos.") } },
                { id = "contra_pereira", texto = "Irte en silencio. Esto se termina, pero no como ella quiere",
                  respuesta = "Asientes, te das vuelta y caminas sin apuro. Ya sabes a quien le vas a pedir ayuda." },
            },
            salidas = {
                { cuando = { "eleccion", "con_pereira" }, ir = "final_con_pereira" },
                { cuando = { "eleccion", "contra_pereira" }, ir = "preparar" },
                { cuando = { "horas", 24 }, ir = "final_abandonado" },
            },
        },
        preparar = {
            pista = "Pedir ayuda y volver al patio de trenes a terminar con {jefe_corto}. Los misioneros que te tengan confianza 4 van a mandar a su gente.",
            al_entrar = {
                { "retirar", grupo = PEREIRA },
                { "reloj", id = "plazo", horas = 96 },
                { "diario", texto = J("Le di la espalda a {jefe_corto}. Manana iba a matar al Cabo y despues a todo Knox. Tengo que llegar antes. No voy a llegar solo si alguien todavia confia en mi.", "Le di la espalda a Maulen. Manana iba a matar a Sous, despues al Cabo, despues a todo Knox. Tengo que llegar antes. No voy a llegar solo si alguien todavia confia en mi.") },
            },
            salidas = {
                { cuando = { { "horas", 6 }, { "cerca", "patio", 120 } }, ir = "asalto" },
                { cuando = { "reloj_vencido", "plazo" }, ir = "final_abandonado" },
            },
        },
        asalto = {
            pista = "Acabar con {jefe_nombre} y su banda en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = asalto,
            salidas = {
                { cuando = { "muerto", "banda", "pereira" }, ir = "final_redencion" },
                -- Eduardo (si viene) tiene que estar en el mundo para hacerlo inmune.
                { cuando = { { "grupo_listo", "banda" }, { "o", { "grupo_listo", "eduardo" }, { "no", { "mem", "eduardo_conocido" } } } },
                  ir = "pelea" },
                { cuando = { "horas", 12 }, ir = "final_escapo" },
            },
        },
        pelea = {
            pista = "Acabar con {jefe_nombre} y su banda en {lugar:patio}.",
            objetivo = "patio",
            al_entrar = {
                { "inmune", grupo = "eduardo", rol = "eduardo", quien = "eduardo", si = { "mem", "eduardo_conocido" } },
                { "armar_legendario", grupo = "eduardo", rol = "eduardo", si = { "mem", "eduardo_conocido" } },
                { "decir", grupo = "eduardo", rol = "eduardo", si = { "mem", "eduardo_conocido" },
                  texto = "Escuche que venias a hacer lo correcto. Tarde, pero vienes. Yo por la izquierda." },
                { "decir", grupo = JULIO, rol = "julio", si = { "mem", "julio_vivo" },
                  texto = "Me perdonaste la vida. Vengo a devolverla. Esa sargento es mia tambien." },
            },
            salidas = {
                { cuando = { "muerto", "banda", "pereira" }, ir = "final_redencion" },
                { cuando = { "horas", 12 }, ir = "final_escapo" },
            },
        },
        final_con_pereira = { final = true, al_entrar = {
            { "knox", cantidad = KNOX, motivo = "bandido: a la derecha de Pereira" },
            { "memoria", clave = "bandido", valor = "pereira" },
            { "memoria", clave = "bandido_cap", valor = 5 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = J("Le dije a Pereira que si. Manana tomamos la comisaria del Cabo. Despues, Knox.", "Le dije a Maulen que si. Manana vamos por Sous. Despues el Cabo. Despues, Knox.") },
        } },
        final_redencion = { final = true, al_entrar = {
            { "knox_reiniciar", texto = "La gente perdonara tus pecados del pasado, pero en tu mente sigue existiendo cada acto malvado que hiciste." },
            { "huella", acto = "protegiste", texto = J("Acabe con la Sargento Pereira antes de que tomara la comisaria del Cabo.", "Acabe con Maulen Callupan antes de que fuera por Sous.") },
            { "decir", grupo = "eduardo", rol = "eduardo", si = { "mem", "eduardo_conocido" },
              texto = "No se por que estuviste con ella. Se por que te diste vuelta. Con eso me basta, amigo." },
            { "decir", grupo = JULIO, rol = "julio", si = { "mem", "julio_vivo" },
              texto = "Te debia una. Marisol esta bien. Ahora estamos a mano." },
            { "legendario", lugar = "patio", radio = 30, clase = "arma" },
            { "memoria", clave = "bandido", valor = "redimido" },
            { "memoria", clave = "bandido_cap", valor = 5 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = J("La Sargento Pereira esta muerta en el patio de trenes. No lo hice solo. Me queda su fusil y una lista de nombres que voy a cargar siempre.", "Maulen Callupan esta muerto en el patio de trenes. Esta vez de verdad. Lo deje vivir una vez y me costo caro a mi y a todo Knox. No lo hice solo: vino gente que todavia creia en mi.") },
        } },
        final_escapo = { final = true, al_entrar = {
            { "retirar", grupo = "banda" },
            { "memoria", clave = "bandido", valor = "pereira_escapo" },
            { "memoria", clave = "bandido_cap", valor = 5 },
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = J("Pereira se me escapo del patio. Sigue viva, en algun lado, y sabe mi cara.", "Maulen se me escapo del patio. Otra vez. Desaparecer es lo unico que siempre supo hacer bien.") },
        } },
        final_abandonado = abandonado(5),
    },
})

-- ===========================================================================
-- Castigo: el jefe del patio descubrio un sabotaje y manda a cazarte.
-- ===========================================================================
registrar({
    id = "bandido_castigo",
    titulo = "{jefe_corto} lo sabe",
    titulo_menu = "Bandido: el jefe descubre el sabotaje",
    requiere_alife = true, automatico = false,
    inicio = "caza",
    etapas = {
        caza = {
            pista = "Sobrevivir a los cazadores de {jefe_corto}.",
            al_entrar = {
                { "lugar_jugador", id = "aqui" },
                { "aviso", texto = J("Un silbido corto. Despues otro. {jefe_corto} abrio la caja, conto las latas o encontro a alguien que no debia estar vivo. Viene su gente.", "Un silbido corto. Despues otro. Maulen hizo el inventario y no le cuadro. Te manda saludos con su gente. 'Aca todos somos amigos', decia.") },
                { "bandidos", id = "cazadores", lugar = "aqui", radio = 60, modo = "hunt", cantidad = { 4, 6 } },
                { "diario", texto = "{jefe_corto} descubrio lo que hice. Mando gente a matarme." },
            },
            salidas = {
                { cuando = { "todos_muertos", "cazadores" }, ir = "final_sobreviviste" },
                { cuando = { "horas", 6 }, ir = "final_sobreviviste" },
            },
        },
        final_sobreviviste = { final = true, al_entrar = {
            { "memoria", clave = "pereira_desconfia", valor = true },
            { "diario", texto = "Sobrevivi a los cazadores de {jefe_corto}. Si vuelvo al patio, me va a recibir con una sonrisa y el dedo en el gatillo." },
        } },
    },
})

-- ===========================================================================
-- Maulen toma el patio: si lo dejaste ir en Sous, termina en el patio de trenes, mata a la
-- Sargento Pereira y se queda con su banda. Te busca porque te debe la vida (sin importar tu
-- Knox). Si ya estabas trabajando para Pereira, sigues con el desde el capitulo en que ibas.
-- ===========================================================================
registrar({
    id = "bandido_maulen",
    titulo = "El camino del bandido: Maulen",
    titulo_menu = "Bandido: Maulen toma el patio",
    requiere_alife = true, automatico = false,
    inicio = "nota",
    etapas = {
        nota = {
            al_entrar = {
                { "lugar_casa", id = "casa" },
                patio(),
                { "memoria_lugar", lugar = "patio", clave = "bandido_patio" },
                { "faccion", id = "narrador_pereira", postura = "friendly" },
                { "nota", lugar = "casa", radio = 4, titulo = "Nota con olor a cigarro",
                  texto = "Peni: me dejaste vivir y no se me olvida. Encontre trabajo, y despues encontre algo mejor: el puesto de la jefa. Patio de trenes de Muldraugh. Ven, que aca todos somos amigos. Todos. -M." },
                { "mapa", lugar = "patio", titulo = "Mapa de Maulen: el patio de trenes" },
                { "aviso", texto = "Alguien dejo una nota en {lugar:casa}. Huele a cigarro y a atun." },
                { "diario", texto = "Me dejaron una nota firmada con una M. Huele a cigarro y a atun. Es Maulen. Me espera en {lugar:patio}." },
            },
            salidas = { { ir = "citacion" } },
        },
        citacion = llegarAlPatio("reunion"),
        reunion = {
            pista = "Hablar con Maulen Callupan en {lugar:patio} (clic derecho cerca).",
            ancla = "patio", ancla_grupo = PEREIRA, radio = 20,
            al_entrar = {
                { "decir", grupo = PEREIRA, rol = "pereira", texto = "Peni! Pasa, pasa. Tranquilo, aca todos somos amigos. Todos. Bueno, la sargento ya no, pero ella se lo busco." },
                -- Consecuencia de los Bell (bell_culpa): Maulen sabe lo de la pastilla.
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.1, si = { "memoria", "bell_culpa", true },
                  texto = "Y lo de los Bell, peni... azucar por cura y te quedaste con la buena. Aca nadie te juzga. Aca eso se aplaude." },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.05, si = { "var", "venia_de_pereira", true },
                  texto = "Tu trabajabas para ella, cierto? Lo se todo. Llevaba una libreta. Yo tambien llevo una. Sigues conmigo, peni, donde quedaste." },
                { "decir", grupo = PEREIRA, rol = "pereira", retraso = 0.05, si = { "no", { "var", "venia_de_pereira", true } },
                  texto = "La sargento me recibio con un fusil. Yo la recibi con una sonrisa. Ahora el patio es mio. Y tu me dejaste vivir. Eso se paga." },
            },
            opciones = {
                { id = "unirse", texto = "Que necesitas, Maulen?",
                  dice = { rol = "pereira", texto = "Eso queria escuchar, peni. Primero cosas chicas. Despues, lo grande. Vuelve manana." } },
                { id = "rechazar", texto = "Te deje vivir. No te debo nada mas",
                  dice = { rol = "pereira", texto = "Tranquilo, peni. Tranquilo. La puerta queda abierta. Mi chuchu decia que todos vuelven." } },
            },
            salidas = {
                { cuando = { "eleccion", "unirse" }, ir = "final_unido" },
                { cuando = { "eleccion", "rechazar" }, ir = "final_rechazo" },
                { cuando = { "horas", 24 }, ir = "final_abandonado" },
            },
        },
        final_unido = { final = true, al_entrar = {
            { "memoria", clave = "bandido_ultimo", valor = "hecho" },
            { "diario", texto = "Maulen mato a la Sargento Pereira y se quedo con su banda. Ahora trabajo para el. Lo deje vivir y el me lo devuelve asi." },
        } },
        final_rechazo = { final = true, al_entrar = {
            { "memoria", clave = "bandido", valor = "rechazado" },
            { "diario", texto = "Le dije a Maulen que no le debo nada. Sonrio como siempre. Dijo que todos vuelven." },
        } },
        final_abandonado = abandonado("de Maulen"),
    },
})
