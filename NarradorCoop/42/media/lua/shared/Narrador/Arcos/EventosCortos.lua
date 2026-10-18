-- Historias cortas. Ninguna se anuncia por radio: llega un mensajero (al refugio o cerca
-- de ustedes) o los personajes aparecen en tu puerta.
-- Textos sin tildes a proposito (ver nota en FamiliaInfectada.lua).

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar

-- Lo que conversan los personajes de las historias cortas mientras estas cerca.
Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.denise = {
    { "denise", "No me dejes sola, por favor. Llevo dos dias escuchandolos rasgunar la puerta." },
    { "denise", "Lonnie fue a buscarte? Ese tonto... lo quiero tanto." },
    { "denise", "Tengo un cuchillo de cocina. No se usarlo, pero lo tengo." },
    { "denise", "Si salimos de esta, te cocino algo. Lo que sea. Lo que encontremos." },
    { "denise", "Hay mas en el patio. Los escucho. No paran nunca." },
    { "denise", "Gracias por venir. Nadie viene nunca por nadie." },
}
Narrador.Charlas.desertor = {
    { "ray", "Me llamo Ray. Ray Doyle. Hace un mes era soldado. Ahora no se que soy." },
    { "ray", "Nos ordenaron disparar contra los que querian cruzar el cordon. Gente sana. Yo baje el arma." },
    { "ray", "Si escuchas motores, avisame. Ellos no paran hasta encontrarte." },
    { "ray", "Se usar un fusil. Si me dejas quedarme, cuido la entrada de noche." },
    { "ray", "Mi sargento era buen tipo. Seguia ordenes, nada mas. Eso es lo que da miedo." },
    { "ray", "Tengo una hija en Lexington. No se si sigue viva. Prefiero no pensarlo." },
    { "ray", "No te voy a robar, si es lo que estas pensando. Ya robe suficiente: me robe a mi mismo del ejercito." },
    { "ray", "Duermo con las botas puestas. Costumbre. O miedo. No se." },
    { "ray", "La Guardia no perdona. Pero tampoco es muy inteligente. Hay que pensar como ellos." },
}
Narrador.Charlas.lucas = {
    { "lucas", "Shh! Hay uno en el pasillo. Lo escucho caminar." },
    { "lucas", "Mi mama te mando? Esta bien? Dime que esta bien." },
    { "lucas", "Solo vine por las barras de cereal de la cafeteria. Fue una idea tonta." },
    { "lucas", "Me escondi en el armario del conserje. Huele horrible, pero ellos no entran." },
    { "lucas", "Cuando sea grande quiero ser como tu. Bueno, si llego a ser grande." },
    { "lucas", "Tengo hambre. Y frio. Y miedo. En ese orden." },
}

-- ---------------------------------------------------------------------------
-- Horda en camino: un explorador llega corriendo a avisar.
-- ---------------------------------------------------------------------------
registrar({
    id = "horda_en_camino",
    titulo = "Horda en camino",
    requiere_alife = true,
    peso = 8,
    enfriamiento = 72,
    dia_minimo = 3,
    inicio = "aviso",
    etapas = {
        aviso = {
            al_entrar = {
                { "mensajero", llegada = "Alguien llego corriendo a {lugar:aviso}, casi sin aire.",
                  texto = { "Viene una horda enorme desde el norte. Pasa por aqui. Tienen unas horas, no mas.",
                            "Corran o atrincherense! Vi cientos bajando por la carretera. Vienen para aca.",
                            "Una horda, la mas grande que he visto. Van a pasar por aqui antes de que oscurezca." },
                  diario = "Un explorador avisa que una horda grande viene hacia ustedes." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "preparacion" },
                { cuando = { "horas", 12 }, ir = "llega" },
            },
        },
        preparacion = {
            pista = "Prepararse: la horda llega en pocas horas.",
            al_entrar = { { "reloj", id = "llegada", horas = { 2, 4 } } },
            salidas = { { cuando = { "reloj_vencido", "llegada" }, ir = "llega" } },
        },
        llega = {
            pista = "Aguantar la horda en {lugar:casa}.",
            al_entrar = {
                -- La horda va a la casa (el refugio, o donde este el jugador si no tiene).
                -- De 25 zombis el dia 3 hasta 100 el dia 30 (mas 5 por campamento fundado).
                { "lugar_casa", id = "casa" },
                { "oleada", lugar = "casa", progreso = { 25, 100 }, min = 30, max = 60 },
                { "ruido", lugar = "casa", radio = 150, volumen = 100, veces = 3 },
                { "aviso", texto = "Se escucha el arrastrar de cientos de pies. Algo hizo ruido en {lugar:casa} y vienen todos para aca." },
            },
            salidas = { { cuando = { "horas", 4 }, ir = "final_paso" } },
        },
        final_paso = {
            final = true,
            al_entrar = { { "diario", texto = "La horda paso. Siguen en pie." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- El alijo: un desconocido trae la nota de un moribundo.
-- ---------------------------------------------------------------------------
registrar({
    id = "alijo_custodiado",
    titulo = "El alijo",
    requiere_alife = true,
    peso = 12,
    enfriamiento = 48,
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "lugar", id = "alijo", salas = { "warehouse", "storageunit", "factorystorage", "policestorage", "gunstorestorage" },
                  respaldo = { "garagestorage", "storage" }, min = 200, max = 1000 },
                { "mensajero", texto = { "Un hombre se murio en mis brazos. Me dio esta nota para 'alguien que la pueda usar'. Yo ya no tengo fuerzas.",
                            "Encontre esta nota en el bolsillo de un muerto. Habla de provisiones. Yo no llego vivo hasta alla. Tu quizas si.",
                            "Toma. Me la dio un tipo antes de morir. Dice que hay de todo escondido. Que te sirva." },
                  diario = "Una nota de un moribundo: dejo provisiones escondidas en {lugar:alijo}.",
                  nota = { titulo = "Nota manchada de sangre", texto = "Latas, municion, vendas. Todo en {lugar:alijo}. Que lo use otro." } },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "rumor" },
                { cuando = { "horas", 72 }, ir = "final_perdido" },
            },
        },
        rumor = {
            pista = "Revisar {lugar:alijo}.",
            salidas = {
                { cuando = { "cerca", "alijo", 45 }, ir = "llegada" },
                { cuando = { "horas", 96 }, ir = "final_perdido" },
            },
        },
        llegada = {
            pista = "Encontrar las provisiones en {lugar:alijo}.",
            al_entrar = {
                { "oleada", lugar = "alijo", radio = 50, cantidad = { 10, 18 } },
                { "recompensa", lugar = "alijo", radio = 50,
                  items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" },
                            { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.Bandage" }, { "Base.Bandage" } } },
                { "diario", texto = "Las provisiones estaban en {lugar:alijo}. Los muertos tambien." },
            },
            salidas = { { cuando = { "horas", 2 }, ir = "final_encontrado" } },
        },
        final_encontrado = {
            final = true,
            al_entrar = { { "memoria", clave = "alijo", valor = "encontrado" } },
        },
        final_perdido = {
            final = true,
            al_entrar = { { "diario", texto = "Nadie fue a buscar el alijo. Algun otro se lo habra llevado." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- Gritos de auxilio: el hermano de Denise viene a pedir ayuda.
-- ---------------------------------------------------------------------------
registrar({
    id = "sobreviviente_acorralada",
    titulo = "Gritos de auxilio",
    requiere_alife = true,
    peso = 10,
    enfriamiento = 48,
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "lugar", id = "casa", salas = { "livingroom", "kitchen", "bedroom" }, min = 120, max = 600 },
                { "mensajero", perfil = "k93_hensley_family_04", nombre = { "Lonnie", "Hensley" },
                  llegada = "Un muchacho llego a {lugar:aviso} gritando por ayuda.",
                  texto = { "Mi hermana Denise esta atrapada en {lugar:casa}! La casa esta rodeada. Yo no pude hacer nada... por favor!",
                            "Por favor, ayudame! Denise, mi hermana, sigue en {lugar:casa}. Son demasiados, yo solo no puedo!",
                            "Me arranque y la deje sola. Soy un cobarde. Denise esta en {lugar:casa}. Por favor, sacala de ahi." },
                  diario = "Lonnie Hensley pide ayuda: su hermana Denise esta atrapada en {lugar:casa}." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "gritos" },
                { cuando = { "horas", 24 }, ir = "final_tarde" },
            },
        },
        gritos = {
            pista = "Llegar rapido a {lugar:casa}.",
            salidas = {
                { cuando = { "cerca", "casa", 40 }, ir = "rescate" },
                { cuando = { "horas", 8 }, ir = "final_tarde" },
            },
        },
        rescate = {
            pista = "Mantener viva a Denise en {lugar:casa}.",
            charla = { grupo = "denise", lista = "denise", radio = 15, cada = 0.15 },
            ancla = "casa",
            ancla_grupo = "denise",
            al_entrar = {
                { "npcs", id = "denise", lugar = "casa", modo = "guard", quietos = true, correa = 3,
                  postura = "friendly", perfiles = { { "denise", "k93_hensley_family_08" } },
                  nombres = { denise = { "Denise", "Hensley" } }, femeninos = { "denise" } },
                { "oleada", lugar = "casa", radio = 50, cantidad = { 12, 20 }, min = 8, max = 20 },
            },
            opciones = {
                { id = "calmar", texto = "Decirle que se quede detras tuyo", una_vez = true,
                  dice = { rol = "denise", texto = "Si... si. No me dejes sola." } },
            },
            salidas = {
                { cuando = { "mato_jugador", "denise" }, ir = "final_traicion" },
                { cuando = { "todos_muertos", "denise" }, ir = "final_muerta" },
                { cuando = { { "grupo_listo", "denise" }, { "horas", 1 } }, ir = "final_rescatada" },
            },
        },
        final_rescatada = {
            final = true,
            al_entrar = {
                { "decir", grupo = "denise", rol = "denise", texto = "Me salvaste la vida. Mi mochila esta debajo de la escalera, llevatela." },
                { "diario", texto = "Denise sobrevivio y se fue a buscar a su hermano." },
                { "recompensa", lugar = "casa", radio = 30,
                  items = { { "Base.Bag_Schoolbag", "Base.Bag_DuffelBag" }, { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Pills" } } },
                { "memoria", clave = "denise", valor = "rescatada" },
                { "retirar_lejos", grupo = "denise", lugar = "casa", radio = 70, retraso = 3 },
            },
        },
        final_muerta = {
            final = true,
            al_entrar = {
                { "diario", texto = "No alcanzaste a protegerla. Denise murio en {lugar:casa}." },
                { "memoria", clave = "denise", valor = "muerta" },
            },
        },
        final_traicion = {
            final = true,
            al_entrar = {
                { "diario", texto = "Denise murio en {lugar:casa}, y no fueron los zombis. Fue {quien_mato}." },
                { "memoria", clave = "denise", valor = "asesinada" },
            },
        },
        final_tarde = {
            final = true,
            al_entrar = { { "diario", texto = "Nadie llego a tiempo a la casa de Denise." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- El trueque: alguien ofrece cambiar comida por remedios. Es una emboscada.
-- ---------------------------------------------------------------------------
registrar({
    id = "trueque_trampa",
    titulo = "El trueque",
    requiere_alife = true,
    peso = 8,
    enfriamiento = 72,
    dia_minimo = 4,
    inicio = "oferta",
    etapas = {
        oferta = {
            al_entrar = {
                { "lugar", id = "punto", salas = { "grocery", "gasstore", "grocerystorage" },
                  respaldo = { "warehouse", "storage" }, min = 200, max = 900 },
                { "mensajero", texto = { "Mi gente cambia comida por remedios. Vengan a {lugar:punto}, sin armas y sin problemas.",
                            "Tenemos comida de sobra y nos faltan remedios. Trueque justo en {lugar:punto}. Vengan tranquilos.",
                            "Buenas. Hacemos intercambios en {lugar:punto}. Comida por medicina. Sin armas, eso si, por seguridad." },
                  diario = "Ofrecen un trueque en {lugar:punto}: comida por remedios. El que trajo el mensaje no miraba a los ojos." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "ir" },
                { cuando = { "horas", 48 }, ir = "final_ignorado" },
            },
        },
        ir = {
            pista = "Ir al trueque en {lugar:punto}.",
            salidas = {
                { cuando = { "cerca", "punto", 50 }, ir = "emboscada" },
                { cuando = { "horas", 72 }, ir = "final_ignorado" },
            },
        },
        emboscada = {
            pista = "Salir vivo de {lugar:punto}.",
            al_entrar = {
                { "bandidos", id = "emboscadores", lugar = "punto", radio = 60, modo = "hunt", cantidad = { 3, 4 } },
                { "aviso", texto = "No hay ningun trueque. Era una trampa." },
            },
            salidas = {
                { cuando = { "todos_muertos", "emboscadores" }, ir = "final_ganada" },
                { cuando = { "horas", 12 }, ir = "final_escapaste" },
            },
        },
        final_ganada = {
            final = true,
            al_entrar = {
                { "diario", texto = "Los de la emboscada no le van a tender otra trampa a nadie. Tenian comida guardada en {lugar:punto}." },
                { "recompensa", lugar = "punto", radio = 40,
                  items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" } } },
                { "memoria", clave = "trueque", valor = "ganado" },
            },
        },
        final_escapaste = {
            final = true,
            al_entrar = { { "diario", texto = "Escapaste de la emboscada en {lugar:punto}. Por ahora." } },
        },
        final_ignorado = {
            final = true,
            al_entrar = { { "diario", texto = "Nadie fue al trueque de {lugar:punto}. Mejor asi, quizas." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- El desertor: un soldado llega a tu refugio pidiendo que lo escondas.
-- ---------------------------------------------------------------------------
registrar({
    id = "el_desertor",
    titulo = "El desertor",
    requiere_alife = true,
    requiere_refugio = true,
    peso = 8,
    enfriamiento = 120,
    dia_minimo = 5,
    inicio = "llegada",
    etapas = {
        llegada = {
            al_entrar = {
                { "lugar_refugio", id = "refugio" },
                { "npcs", id = "soldado", lugar = "refugio", radio = 60, no_mas_cerca = 12, retraso = 0.5,
                  modo = "guard", quietos = true, correa = 3, postura = "friendly",
                  perfiles = { { "ray", "k93_deserters_02" } }, nombres = { ray = { "Ray", "Doyle" } } },
            },
            salidas = {
                { cuando = { "grupo_listo", "soldado" }, ir = "pedido" },
                { cuando = { "horas", 72 }, ir = "final_siguio_de_largo" },
            },
        },
        pedido = {
            pista = "Decidir que hacer con Ray Doyle, el desertor (clic derecho cerca de el).",
            charla = { grupo = "soldado", lista = "desertor", radio = 12, cada = 0.3 },
            ancla = "refugio",
            ancla_grupo = "soldado",
            al_entrar = {
                { "aviso", texto = "Un soldado sin insignias espera en {lugar:refugio}." },
                { "decir", grupo = "soldado", rol = "ray", texto = "Me llamo Ray. Me negue a disparar contra civiles en el cordon. Ahora me buscan. Escondeme, por favor." },
                { "diario", texto = "Ray Doyle, desertor de la Guardia Nacional, pide que lo escondas en {lugar:refugio}." },
            },
            opciones = {
                { id = "esconder", texto = "Esconderlo en el refugio",
                  dice = { rol = "ray", texto = "No te vas a arrepentir. Si vienen, peleo contigo." } },
                { id = "entregar", texto = "Entregarlo a los soldados",
                  respuesta = "Dejas una senal en la carretera. Al rato llega una patrulla y se lo lleva sin decir palabra." },
                { id = "echar", texto = "Decirle que se vaya",
                  dice = { rol = "ray", texto = "Entiendo. Suerte." } },
            },
            salidas = {
                { cuando = { "mato_jugador", "soldado" }, ir = "final_lo_mataste" },
                { cuando = { "eleccion", "esconder" }, ir = "escondido" },
                { cuando = { "eleccion", "entregar" }, ir = "final_entregado" },
                { cuando = { "eleccion", "echar" }, ir = "final_echado" },
            },
        },
        escondido = {
            pista = "Proteger a Ray: la Guardia lo esta buscando.",
            charla = { grupo = "soldado", lista = "desertor", radio = 12, cada = 0.4 },
            al_entrar = {
                { "reloj", id = "patrulla", horas = { 6, 10 } },
                { "diario", texto = "Ray se esconde en {lugar:refugio}. Tarde o temprano, la Guardia va a venir." },
            },
            salidas = {
                { cuando = { "mato_jugador", "soldado" }, ir = "final_lo_mataste" },
                { cuando = { "reloj_vencido", "patrulla" }, ir = "busqueda" },
            },
        },
        busqueda = {
            pista = "La Guardia llego a {lugar:refugio}. Defender a Ray.",
            al_entrar = {
                { "aviso", texto = "Una patrulla de la Guardia rodea {lugar:refugio}." },
                { "bandidos", id = "guardia", lugar = "refugio", radio = 70, modo = "hunt",
                  faccion = "alife_guard", cantidad = { 3, 4 }, distancia_minima = 25 },
            },
            salidas = {
                { cuando = { "todos_muertos", "soldado" }, ir = "final_capturado" },
                { cuando = { "todos_muertos", "guardia" }, ir = "final_protegido" },
                { cuando = { "horas", 18 }, ir = "final_se_rindieron" },
            },
        },
        final_protegido = {
            final = true,
            al_entrar = {
                { "decir", grupo = "soldado", rol = "ray", texto = "Te debo la vida. Toma, esto me sobra." },
                { "recompensa", lugar = "refugio", radio = 40,
                  items = { { "Base.AssaultRifle2", "Base.AssaultRifle" }, { "Base.556Box", "Base.556Bullets" }, { "Base.Vest_BulletArmy" } } },
                { "diario", texto = "Ray Doyle sobrevivio gracias a ti. Se queda en {lugar:refugio}." },
                { "memoria", clave = "desertor", valor = "protegido" },
            },
        },
        final_capturado = {
            final = true,
            al_entrar = {
                { "diario", texto = "La Guardia mato a Ray Doyle en {lugar:refugio}." },
                { "memoria", clave = "desertor", valor = "muerto" },
            },
        },
        final_se_rindieron = {
            final = true,
            al_entrar = {
                { "diario", texto = "La patrulla se canso de buscar. Ray respira tranquilo, por ahora." },
                { "memoria", clave = "desertor", valor = "protegido" },
            },
        },
        final_entregado = {
            final = true,
            al_entrar = {
                { "retirar", grupo = "soldado" },
                { "recompensa", lugar = "refugio", radio = 40,
                  items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedBeans", "Base.CannedBeans" },
                            { "Base.Bullets9mmBox", "Base.Bullets9mm" } } },
                { "diario", texto = "Entregaste a Ray Doyle. La patrulla te dejo raciones como pago." },
                { "memoria", clave = "desertor", valor = "entregado" },
            },
        },
        final_echado = {
            final = true,
            al_entrar = {
                { "retirar_lejos", grupo = "soldado", lugar = "refugio", radio = 50, retraso = 0.5 },
                { "diario", texto = "Ray Doyle se fue. Nunca supiste que fue de el." },
                { "memoria", clave = "desertor", valor = "echado" },
            },
        },
        final_lo_mataste = {
            final = true,
            al_entrar = {
                { "diario", texto = "Ray Doyle murio en {lugar:refugio}. Fue {quien_mato}." },
                { "memoria", clave = "desertor", valor = "asesinado" },
            },
        },
        final_siguio_de_largo = {
            final = true,
            al_entrar = { { "diario", texto = "Alguien paso por tu refugio y siguio de largo." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- El hijo perdido: una madre busca a su hijo, que fue a la escuela por comida.
-- ---------------------------------------------------------------------------
registrar({
    id = "hijo_perdido",
    titulo = "El hijo perdido",
    requiere_alife = true,
    peso = 9,
    enfriamiento = 96,
    sorteo = { vivo = { valores = { true, false }, pesos = { 2, 1 } } },
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "lugar", id = "escuela", salas = { "classroom" }, respaldo = { "office", "livingroom" }, min = 200, max = 900 },
                { "mensajero", perfil = "k93_red_cross_04", nombre = { "Loretta", "Pike" },
                  llegada = "Una mujer llego a {lugar:aviso} con una foto en la mano.",
                  texto = { "Mi hijo Lucas fue a {lugar:escuela} a buscar comida hace dos dias. No volvio. Por favor, encuentrenlo.",
                            "Lucas tiene doce anos. Doce. Fue a {lugar:escuela} solo porque yo tenia hambre. Ayudenme a traerlo.",
                            "No duermo hace dos noches. Mi hijo esta en {lugar:escuela}. Se que esta vivo. Lo se." },
                  diario = "Loretta Pike busca a su hijo Lucas. Fue a {lugar:escuela} y no volvio." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "busqueda" },
                { cuando = { "horas", 48 }, ir = "final_tarde" },
            },
        },
        busqueda = {
            pista = "Buscar a Lucas en {lugar:escuela}.",
            salidas = {
                { cuando = { "cerca", "escuela", 40 }, ir = "escuela" },
                { cuando = { "horas", 72 }, ir = "final_tarde" },
            },
        },
        escuela = {
            pista = "Encontrar a Lucas en {lugar:escuela}.",
            charla = { grupo = "lucas", lista = "lucas", radio = 15, cada = 0.15 },
            ancla = "escuela",
            ancla_grupo = "lucas",
            al_entrar = {
                { "oleada", lugar = "escuela", radio = 50, cantidad = { 14, 22 } },
                { "npcs", id = "lucas", lugar = "escuela", radio = 50, modo = "guard", quietos = true, correa = 3,
                  postura = "friendly", perfiles = { { "lucas", "k93_hensley_family_04" } },
                  nombres = { lucas = { "Lucas", "Pike" } }, si = { "var", "vivo", true } },
                { "zombi_en", lugar = "escuela", radio = 50, si = { "var", "vivo", false } },
                { "nota", lugar = "escuela", radio = 50, titulo = "Mochila de Lucas", si = { "var", "vivo", false },
                  texto = "Lucas Pike. 4to B. Si me encuentran, diganle a mi mama que la quiero." },
            },
            salidas = {
                { cuando = { "var", "vivo", false }, ir = "final_lo_encontraste_tarde" },
                { cuando = { "mato_jugador", "lucas" }, ir = "final_tragedia" },
                { cuando = { "todos_muertos", "lucas" }, ir = "final_lo_perdiste" },
                { cuando = { { "grupo_listo", "lucas" }, { "horas", 1 } }, ir = "final_reunidos" },
            },
        },
        final_reunidos = {
            final = true,
            al_entrar = {
                { "decir", grupo = "lucas", rol = "lucas", texto = "Gracias! Voy con mi mama. Le voy a decir que fuiste tu." },
                { "retirar_lejos", grupo = "lucas", lugar = "escuela", radio = 50, retraso = 0.5 },
                { "recompensa", lugar = "aviso", radio = 40,
                  items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Bandage" }, { "Base.Pills" } } },
                { "diario", texto = "Lucas volvio con su madre. Loretta te dejo lo poco que tenia en {lugar:aviso}." },
                { "memoria", clave = "lucas", valor = "rescatado" },
            },
        },
        final_lo_encontraste_tarde = {
            final = true,
            al_entrar = {
                { "diario", texto = "Encontraste a Lucas en {lugar:escuela}. Ya no era Lucas. Su mochila tenia una nota para su madre." },
                { "memoria", clave = "lucas", valor = "transformado" },
            },
        },
        final_lo_perdiste = {
            final = true,
            al_entrar = {
                { "diario", texto = "Lucas estaba vivo cuando llegaste. No alcanzaste a sacarlo." },
                { "memoria", clave = "lucas", valor = "muerto" },
            },
        },
        final_tragedia = {
            final = true,
            al_entrar = {
                { "diario", texto = "Lucas murio en {lugar:escuela}. Fue {quien_mato}." },
                { "memoria", clave = "lucas", valor = "asesinado" },
            },
        },
        final_tarde = {
            final = true,
            al_entrar = { { "diario", texto = "Nadie fue a buscar a Lucas." } },
        },
    },
})

-- ---------------------------------------------------------------------------
-- Asalto nocturno: un vecino avisa que hay gente armada rondando tu refugio.
-- ---------------------------------------------------------------------------
registrar({
    id = "asalto_nocturno",
    titulo = "Asalto al refugio",
    requiere_alife = true,
    requiere_refugio = true,
    peso = 7,
    enfriamiento = 120,
    dia_minimo = 6,
    inicio = "mensaje",
    etapas = {
        mensaje = {
            al_entrar = {
                { "lugar_refugio", id = "refugio" },
                { "mensajero", texto = { "Ojo: vi gente armada rondando {lugar:refugio}. Contaron las ventanas. Van a volver de noche.",
                            "Te aviso porque eres buena gente: una banda estuvo mirando {lugar:refugio}. Hasta dibujaron un plano.",
                            "Escuche a unos tipos hablar de {lugar:refugio}. Dicen que tienen comida. Van a venir por ella." },
                  diario = "Un vecino avisa que una banda armada estudio {lugar:refugio}. Van a atacar." },
            },
            salidas = {
                { cuando = { "mensaje_entregado" }, ir = "espera" },
                { cuando = { "horas", 24 }, ir = "espera" },
            },
        },
        espera = {
            pista = "Prepararse: una banda va a atacar {lugar:refugio}.",
            al_entrar = { { "reloj", id = "ataque", horas = { 6, 10 } } },
            salidas = { { cuando = { "reloj_vencido", "ataque" }, ir = "asalto" } },
        },
        asalto = {
            pista = "Defender {lugar:refugio}.",
            al_entrar = {
                { "aviso", texto = "Pasos afuera. Muchos. Ya estan aqui." },
                { "bandidos", id = "asaltantes", lugar = "refugio", radio = 70, modo = "hunt",
                  cantidad = { 4, 6 }, distancia_minima = 25 },
            },
            salidas = {
                { cuando = { "todos_muertos", "asaltantes" }, ir = "final_rechazado" },
                { cuando = { "horas", 12 }, ir = "final_se_retiraron" },
            },
        },
        final_rechazado = {
            final = true,
            al_entrar = {
                { "diario", texto = "Rechazaste el asalto a {lugar:refugio}. Lo que traian ahora es tuyo." },
                { "memoria", clave = "asalto", valor = "rechazado" },
                -- La fama recorre Knox: una banda entera no pudo con tu refugio.
                { "knox", cantidad = 10, motivo = "protegiste" },
                { "aviso", retraso = 0.5, texto = "La noticia corre por Knox: una banda entera se estrello contra {lugar:refugio} y nadie volvio a contarlo." },
                { "aviso", retraso = 6, si = { "memoria", "campamento_muldraugh", "fundado" },
                  texto = "Por la radio, el Cabo Ramiro: 'Me contaron lo de su refugio, civil. Una banda entera. Queda anotado en la libreta. Bien hecho.'" },
                { "aviso", retraso = 8, si = { "memoria", "campamento_westpoint", "fundado" },
                  texto = "Por la radio, la Tia Chela: 'Mijo, en West Point no se habla de otra cosa. Cuidate igual, que los que quedan vivos se enojan.'" },
            },
        },
        final_se_retiraron = {
            final = true,
            al_entrar = { { "diario", texto = "La banda se retiro antes del amanecer. Volveran?" } },
        },
    },
})
