-- Consecuencias tardias de las historias cortas (EventosCortos.lua). Cada una lee la memoria
-- que dejo un final y pasa una sola vez (max_veces = 1), dias despues, cuando el Director la
-- elige. Los ecos cortos de NarradorEtiquetas (el paquete de Denise, la nota de Ray...) siguen
-- igual: estas llegan despues y son otra cosa.
--   denise = rescatada   -> Lonnie trae la comida que Denise prometio cocinarte.
--   denise = asesinada   -> Lonnie Hensley y unos amigos te salen a cazar.
--   lucas = rescatado    -> Lucas encontro una farmacia intacta y te la marca.
--   lucas = asesinado    -> Loretta Pike cuenta en todo Knox lo que hiciste (Knox -15).
--   trueque = ganado     -> los hermanos de los del trueque vienen a cobrar.
--   alijo = encontrado   -> la viuda del moribundo pide su parte: compartir o negarse.
--   desertor = protegido -> Ray Doyle vuelve con la Guardia pisandole los talones.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar

-- ---------------------------------------------------------------------------
-- La promesa de Denise: "Si salimos de esta, te cocino algo."
-- ---------------------------------------------------------------------------
registrar({
    id = "eco_denise_olla",
    titulo = "La promesa de Denise",
    requiere_alife = true,
    si = { "memoria", "denise", "rescatada" },
    max_veces = 1,
    peso = 5,
    dia_minimo = 8,
    tono = "vida",
    intensidad = 1,
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "mensajero", perfil = "k93_hensley_family_04", nombre = { "Lonnie", "Hensley" },
                  llegada = "Lonnie Hensley llego a {lugar:aviso} con una olla envuelta en un chaleco.",
                  texto = { "Denise dijo que si saliamos de esa te iba a cocinar algo. Ella cumple. Esta tibio todavia.",
                            "Mi hermana cocino para ti. Dice que nadie viene nunca por nadie, pero tu si. Toma." },
                  diario = "Denise Hensley cumplio su promesa: Lonnie te trajo comida hecha por ella." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "final_olla" },
                { cuando = { "horas", 48 }, ir = "final_fria" },
            },
        },
        final_olla = {
            final = true,
            al_entrar = {
                { "recompensa", lugar = "aviso", radio = 30,
                  items = { { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.TinnedBeans", "Base.CannedBeans" },
                            { "Base.Bread", "Base.TinnedSoup" } } },
                { "knox", cantidad = 5, motivo = "salvaste" },
                { "diario", texto = "Comiste lo que cocino Denise. Hace rato que nada sabia a casa." },
            },
        },
        final_fria = {
            final = true,
            al_entrar = { { "diario", texto = "Lonnie te espero con la olla y nadie llego. Se la comio el, seguro." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- El hermano de Denise: la mataste y Lonnie lo sabe.
-- ---------------------------------------------------------------------------
registrar({
    id = "eco_denise_lonnie",
    titulo = "El hermano de Denise",
    requiere_alife = true,
    si = { "memoria", "denise", "asesinada" },
    max_veces = 1,
    peso = 6,
    dia_minimo = 6,
    tono = "accion",
    intensidad = 3,
    inicio = "aviso",
    etapas = {
        aviso = {
            al_entrar = {
                { "lugar_jugador", id = "zona" },
                { "aviso", texto = "Alguien grita tu nombre a lo lejos. Es Lonnie Hensley. No viene solo, y no viene a conversar." },
                { "diario", texto = "Lonnie Hensley sabe que mataste a su hermana Denise. Junto a unos amigos y te anda buscando." },
                { "knox", cantidad = -5, motivo = "denise" },
                { "bandidos", id = "lonnie", lugar = "jugador", radio = 70, modo = "hunt", cantidad = { 2, 3 },
                  distancia_minima = 25, retraso = 0.3 },
            },
            salidas = {
                { cuando = { "todos_muertos", "lonnie" }, ir = "final_muertos" },
                { cuando = { "horas", 12 }, ir = "final_se_fueron" },
            },
        },
        final_muertos = {
            final = true,
            al_entrar = { { "diario", texto = "Lonnie Hensley murio buscando justicia por su hermana. Ya no queda ningun Hensley." } },
        },
        final_se_fueron = {
            final = true,
            al_entrar = { { "diario", texto = "Lonnie y los suyos dejaron de buscarte. Por ahora. Esa cuenta no se cierra sola." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- Lucas explorador: "Cuando sea grande quiero ser como tu."
-- ---------------------------------------------------------------------------
registrar({
    id = "eco_lucas_farmacia",
    titulo = "Lo que encontro Lucas",
    requiere_alife = true,
    si = { "memoria", "lucas", "rescatado" },
    max_veces = 1,
    peso = 5,
    dia_minimo = 10,
    tono = "vida",
    intensidad = 2,
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "lugar", id = "botica", salas = { "pharmacy", "pharmacystorage" }, respaldo = { "medical", "office" },
                  min = 200, max = 900 },
                { "mensajero", perfil = "k93_hensley_family_04", nombre = { "Lucas", "Pike" },
                  llegada = "Lucas Pike llego a {lugar:aviso}, sin aire y orgulloso.",
                  texto = { "Hice lo que tu harias: explore. Hay una farmacia que nadie ha tocado en {lugar:botica}. No entre, lo prometo. Mi mama me mata.",
                            "Te debo una, asi que mire por ahi. En {lugar:botica} hay remedios todavia. Ve tu, que yo no puedo." },
                  diario = "Lucas Pike encontro una farmacia intacta en {lugar:botica} y te la guardo." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "ir" },
                { cuando = { "horas", 48 }, ir = "final_nadie" },
            },
        },
        ir = {
            pista = "Revisar la farmacia que encontro Lucas en {lugar:botica}.",
            salidas = {
                { cuando = { "cerca", "botica", 40 }, ir = "botica" },
                { cuando = { "horas", 96 }, ir = "final_nadie" },
            },
        },
        botica = {
            pista = "Sacar los remedios de {lugar:botica}.",
            al_entrar = {
                { "oleada", lugar = "botica", radio = 45, cantidad = { 8, 14 } },
                { "recompensa", lugar = "botica", radio = 40,
                  items = { { "Base.Antibiotics", "Base.Pills" }, { "Base.PillsBeta", "Base.Pills" },
                            { "Base.Bandage" }, { "Base.Disinfectant", "Base.AlcoholWipes", "Base.Bandage" } } },
                { "nota", lugar = "botica", radio = 40, titulo = "Papel doblado",
                  texto = "Esto lo encontre yo. Lucas Pike, 4to B. (No le digas a mi mama que vine hasta la puerta.)" },
            },
            salidas = { { cuando = { "horas", 2 }, ir = "final_encontrado" } },
        },
        final_encontrado = {
            final = true,
            al_entrar = { { "diario", texto = "La farmacia de Lucas estaba como el dijo. Ese cabro va a llegar lejos." } },
        },
        final_nadie = {
            final = true,
            al_entrar = { { "diario", texto = "Nadie fue a la farmacia que marco Lucas. Otro se la habra llevado." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- La madre de Lucas: lo mataste y Loretta lo cuenta en todos lados.
-- ---------------------------------------------------------------------------
registrar({
    id = "eco_lucas_loretta",
    titulo = "La madre de Lucas",
    requiere_alife = true,
    si = { "memoria", "lucas", "asesinado" },
    max_veces = 1,
    peso = 6,
    dia_minimo = 6,
    tono = "drama",
    intensidad = 2,
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "mensajero", perfil = "k93_red_cross_04", nombre = { "Loretta", "Pike" },
                  llegada = "Loretta Pike llego a {lugar:aviso}. No trae la foto. Trae los ojos secos.",
                  texto = { "Tenia doce anos. Doce. Voy a ir a cada campamento de Knox a contar lo que hiciste. Que todos sepan quien eres.",
                            "No vengo a pelear. Ya no me queda nada por que pelear. Solo vengo a mirarte la cara para contarle a todos como es." },
                  diario = "Loretta Pike sabe que mataste a Lucas. Lo va a contar en todo Knox." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "final_contado" },
                { cuando = { "horas", 48 }, ir = "final_contado" },
            },
        },
        final_contado = {
            final = true,
            al_entrar = {
                { "knox", cantidad = -15, motivo = "lucas" },
                { "diario", texto = "En los campamentos ya cuentan lo de Lucas Pike. Algunos se dan vuelta cuando pasas." },
            },
        },
    },
})

-- ---------------------------------------------------------------------------
-- Los hermanos del trueque: ganaste la emboscada y alguien quedo con ganas de cobrar.
-- ---------------------------------------------------------------------------
registrar({
    id = "eco_trueque_cobro",
    titulo = "El cobro del trueque",
    requiere_alife = true,
    si = { "memoria", "trueque", "ganado" },
    max_veces = 1,
    peso = 5,
    dia_minimo = 7,
    tono = "accion",
    intensidad = 4,
    etiquetas = { "bandidos" },
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "mensajero", texto = { "Me pagaron para traerte esto: 'Los del trueque eran nuestros hermanos. Te vamos a cobrar.' Yo solo traigo el recado, eh.",
                            "Un tipo con la cara tapada me dijo que te diga que los del trueque tenian familia. Y que la familia cobra." },
                  diario = "Los hermanos de los del trueque te mandaron a decir que vienen a cobrar." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "espera" },
                { cuando = { "horas", 24 }, ir = "espera" },
            },
        },
        espera = {
            pista = "Andar con cuidado: los del trueque vienen a cobrar.",
            al_entrar = { { "reloj", id = "cobro", horas = { 4, 8 } } },
            salidas = { { cuando = { "reloj_vencido", "cobro" }, ir = "cobro" } },
        },
        cobro = {
            pista = "Sobrevivir al cobro del trueque.",
            al_entrar = {
                { "aviso", texto = "Silbidos entre las casas. Son los del trueque, y esta vez no ofrecen nada." },
                { "bandidos", id = "cobradores", lugar = "jugador", radio = 70, modo = "hunt", cantidad = { 4, 5 },
                  distancia_minima = 25 },
            },
            salidas = {
                { cuando = { "todos_muertos", "cobradores" }, ir = "final_saldado" },
                { cuando = { "horas", 12 }, ir = "final_se_fueron" },
            },
        },
        final_saldado = {
            final = true,
            al_entrar = {
                { "knox", cantidad = 5, motivo = "bandidos" },
                { "diario", texto = "Se acabo la familia del trueque. Ya nadie va a tender trampas con comida por remedios." },
            },
        },
        final_se_fueron = {
            final = true,
            al_entrar = { { "diario", texto = "Los del trueque se retiraron. Con esa gente, la deuda nunca se paga entera." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- La viuda del alijo: las provisiones eran de su marido.
-- ---------------------------------------------------------------------------
registrar({
    id = "eco_alijo_viuda",
    titulo = "La viuda del alijo",
    requiere_alife = true,
    requiere_refugio = true,
    si = { "memoria", "alijo", "encontrado" },
    max_veces = 1,
    peso = 5,
    dia_minimo = 5,
    tono = "drama",
    intensidad = 1,
    inicio = "llegada",
    etapas = {
        llegada = {
            al_entrar = {
                { "lugar_refugio", id = "refugio" },
                { "npcs", id = "viuda", lugar = "refugio", radio = 60, no_mas_cerca = 12, retraso = 0.5,
                  modo = "guard", quietos = true, correa = 3, postura = "friendly",
                  perfiles = { { "marta", "k93_red_cross_04" } }, nombres = { marta = { "Marta", "Quiroz" } },
                  femeninos = { "marta" } },
            },
            salidas = {
                { cuando = { "grupo_listo", "viuda" }, ir = "pedido" },
                { cuando = { "horas", 48 }, ir = "final_no_llego" },
            },
        },
        pedido = {
            pista = "Hablar con Marta Quiroz, la viuda del alijo (clic derecho cerca de ella).",
            ancla = "refugio",
            ancla_grupo = "viuda",
            al_entrar = {
                { "decir", grupo = "viuda", rol = "marta", texto = "Ese alijo lo junto mi marido para nosotros. Antes de morir se lo regalo a un desconocido. A ti. No te pido todo... solo algo." },
                { "diario", texto = "Marta Quiroz, la viuda del hombre del alijo, vino a {lugar:refugio} a pedir su parte." },
            },
            opciones = {
                { id = "compartir", texto = "Compartir comida con ella", requiere = { "comida" },
                  dice = { rol = "marta", texto = "Dios te lo pague. El tenia razon: lo encontro alguien que lo iba a usar bien." } },
                { id = "negar", texto = "Decirle que lo encontrado es tuyo",
                  dice = { rol = "marta", texto = "Que te aproveche. Ojala te acuerdes de mi cuando abras la ultima lata." } },
            },
            salidas = {
                { cuando = { "mato_jugador", "viuda" }, ir = "final_la_mataste" },
                { cuando = { "eleccion", "compartir" }, ir = "final_compartido" },
                { cuando = { "eleccion", "negar" }, ir = "final_negado" },
                { cuando = { "horas", 24 }, ir = "final_negado" },
            },
        },
        final_compartido = {
            final = true,
            al_entrar = {
                { "knox", cantidad = 10, motivo = "salvaste" },
                { "diario", texto = "Compartiste el alijo con la viuda de su dueno. Marta Quiroz va contando que en Knox todavia hay gente decente." },
                { "memoria", clave = "alijo", valor = "compartido" },
                { "retirar_lejos", grupo = "viuda", lugar = "refugio", radio = 60, retraso = 0.5 },
            },
        },
        final_negado = {
            final = true,
            al_entrar = {
                { "knox", cantidad = -5, motivo = "alijo" },
                { "diario", texto = "Marta Quiroz se fue con las manos vacias. Se lo cuenta a quien quiera oirla." },
                { "memoria", clave = "alijo", valor = "negado" },
                { "retirar_lejos", grupo = "viuda", lugar = "refugio", radio = 60, retraso = 0.5 },
            },
        },
        final_la_mataste = {
            final = true,
            al_entrar = {
                { "knox", cantidad = -15, motivo = "alijo" },
                { "diario", texto = "Marta Quiroz murio en {lugar:refugio}. Fue {quien_mato}. El alijo ya no tiene a nadie que lo reclame." },
                { "memoria", clave = "alijo", valor = "viuda_muerta" },
            },
        },
        final_no_llego = {
            final = true,
            al_entrar = { { "diario", texto = "Alguien pregunto por el alijo en el camino. Nunca llego a tu puerta." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- Ray vuelve: lo escondiste una vez y la Guardia no se olvido de el.
-- ---------------------------------------------------------------------------
registrar({
    id = "eco_desertor_vuelve",
    titulo = "Ray vuelve",
    requiere_alife = true,
    requiere_refugio = true,
    si = { "memoria", "desertor", "protegido" },
    max_veces = 1,
    peso = 5,
    dia_minimo = 12,
    tono = "accion",
    intensidad = 4,
    inicio = "llegada",
    etapas = {
        llegada = {
            al_entrar = {
                { "lugar_refugio", id = "refugio" },
                { "npcs", id = "soldado", lugar = "refugio", radio = 50, no_mas_cerca = 10, retraso = 0.5,
                  modo = "guard", correa = 6, postura = "friendly",
                  perfiles = { { "ray", "k93_deserters_02" } }, nombres = { ray = { "Ray", "Doyle" } } },
            },
            salidas = {
                { cuando = { "grupo_listo", "soldado" }, ir = "aviso" },
                { cuando = { "horas", 48 }, ir = "final_no_llego" },
            },
        },
        aviso = {
            pista = "Prepararse con Ray: una patrulla de la Guardia viene detras de el.",
            ancla = "refugio",
            ancla_grupo = "soldado",
            al_entrar = {
                { "decir", grupo = "soldado", rol = "ray", texto = "Llegue a Lexington. No la encontre. Y la Guardia me encontro a mi. Vienen para aca. Esta vez peleo contigo, como te prometi." },
                { "diario", texto = "Ray Doyle volvio a {lugar:refugio}. Una patrulla de la Guardia le sigue el rastro." },
                { "reloj", id = "patrulla", horas = { 1, 2 } },
            },
            salidas = {
                { cuando = { "mato_jugador", "soldado" }, ir = "final_lo_mataste" },
                { cuando = { "reloj_vencido", "patrulla" }, ir = "pelea" },
            },
        },
        pelea = {
            pista = "Defender {lugar:refugio} junto a Ray.",
            al_entrar = {
                { "aviso", texto = "Motores en la carretera. La Guardia llego a {lugar:refugio}." },
                { "bandidos", id = "guardia", lugar = "refugio", radio = 70, modo = "hunt",
                  faccion = "alife_guard", cantidad = { 4, 5 }, distancia_minima = 25 },
            },
            salidas = {
                { cuando = { "mato_jugador", "soldado" }, ir = "final_lo_mataste" },
                { cuando = { "todos_muertos", "guardia" }, ir = "final_juntos" },
                { cuando = { "todos_muertos", "soldado" }, ir = "final_cayo" },
                { cuando = { "horas", 12 }, ir = "final_juntos" },
            },
        },
        final_juntos = {
            final = true,
            al_entrar = {
                { "decir", grupo = "soldado", rol = "ray", texto = "Ya no les debo nada. A ti si. Si algun dia necesitas un fusil, ya sabes donde buscarme." },
                { "recompensa", lugar = "refugio", radio = 40,
                  items = { { "Base.556Box", "Base.556Bullets" }, { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.Bandage" } } },
                { "knox", cantidad = 10, motivo = "protegiste" },
                { "diario", texto = "Ray Doyle y tu sacaron a la Guardia de {lugar:refugio}. Ray se fue al amanecer, esta vez sin miedo." },
                { "retirar_lejos", grupo = "soldado", lugar = "refugio", radio = 60, retraso = 3 },
            },
        },
        final_cayo = {
            final = true,
            al_entrar = {
                { "diario", texto = "Ray Doyle murio peleando en {lugar:refugio}. Cumplio su promesa." },
                { "memoria", clave = "desertor", valor = "muerto" },
            },
        },
        final_lo_mataste = {
            final = true,
            al_entrar = {
                { "diario", texto = "Ray Doyle murio en {lugar:refugio}. Fue {quien_mato}." },
                { "memoria", clave = "desertor", valor = "asesinado" },
            },
        },
        final_no_llego = {
            final = true,
            al_entrar = { { "diario", texto = "Dicen que vieron a Ray Doyle cerca de tu refugio. No llego a tocar la puerta." } },
        },
    },
})
