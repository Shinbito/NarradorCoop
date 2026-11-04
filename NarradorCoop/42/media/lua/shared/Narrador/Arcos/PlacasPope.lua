-- Las placas de Pope: una historia de Ray Doyle (ver personajes/fichas/ray.md).
-- La segunda noche del cordon, en la barricada sur de la 31W, al teniente Garrity le ordenaron
-- disparar contra los civiles. Ray no disparo; el especialista Darnell Pope (20 anos, del West
-- End de Louisville) disparo por los dos. A las 4 lo mordieron y Ray lo remato cuando el se lo
-- pidio. Despues le puso a Pope sus placas y se colgo las de Pope: a Pope lo quemaron como
-- "Doyle, R., muerto en accion" (para que a Emily le llegue la bandera y no la historia de un
-- desertor) y Pope quedo como desaparecido. Ray carga sus placas en la bota. La mama, Loretta
-- Pope, espera en Louisville a un hijo que en el papel se fue.
--
-- Como se lanza: la elige el director (una vez que salga bien), si escondiste a Ray en tu
-- refugio (desertor = protegido) y Ray no se quedo ya en un campamento. Ray llega a tu refugio y
-- te pide llevarle las placas a Loretta, con una carta suya con la verdad. El te acompana hasta
-- la esquina de la casa: "la puerta la toca usted". Loretta esta viva o ya no (sorteo).
-- Lo que puede salir mal: las placas se pierden (se le cuenta igual, o no le llega nada), Ray
-- muere en el camino (desertor = muerto; las placas se entregan igual) o lo matas tu.
-- Al final, si a Loretta le llego algo, Ray se queda: de mecanico en un campamento de misionero
-- (ray_mecanico = el campamento; accion oficio_campamento de NarradorCampamentos.lua y
-- K.OFICIOS_HISTORIA en NarradorCampamentosDefs.lua). Si no le llego nada, o no tienes donde
-- mandarlo, se va caminando (como siempre que se pone dificil).
-- Memorias: placas_pope (con_carta, sin_carta, contado, tumba o perdidas), ray_mecanico, y
-- desertor = muerto / asesinado si cae Ray. Lee tanque_ray (el aviso del cap. 3 de la Misia Rosa).
-- Ray nunca dice "desertor" ni "fuego". Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar

local RAY = "ray"
local LORETTA = "loretta"
local PERFIL_RAY = "k93_deserters_02"
local PERFIL_LORETTA = "k93_survivor_commune_11"
local PLACAS = { "Base.Necklace_DogTag", "Base.Necklace_Silver" }

-- Lo que dice Ray mientras estas cerca (su voz: seca, frases cortas).
Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.placas = {
    { "ray", "Pope tenia veinte. Hablaba de su mama todo el turno. Nadie le pedia que parara." },
    { "ray", "Mi hija le puso Gerald a un pez. Yo todavia no le pongo nombre a la moto." },
    { "ray", "Mi papa decia que el que duerme descalzo se muere descalzo. Botas puestas." },
    { "ray", "Hay ordenes que uno no cumple. Despues hay que vivir con el silencio." },
    { "ray", "Las placas pesan poco. Lo que pesa es lo que dicen." },
    { "ray", "Pope disparo por los dos. Yo no. Eso no me hace mejor. Me hace el que quedo." },
    { "ray", "Tengo un mapa con el camino a Lexington. Lo marco y lo borro. Ya casi no se ve." },
    { "ray", "No me de ordenes. Ya me dieron una. Mire como termine." },
}

-- El campamento al que se va Ray: opcion del final.
local function campamento(id, texto, dice, si)
    return { id = "a_" .. id, texto = texto, si = si, dice = { rol = RAY, texto = dice },
        acciones = { { "variable", nombre = "campamento", valor = id } } }
end

-- Despues de la casa: si Ray murio en el camino, se cierra; si no, se vuelve a la esquina.
local DESPUES_DE_LA_CASA = {
    { cuando = { "var", "ray_murio", true }, ir = "final_sin_ray" },
    { ir = "volver" },
}

registrar({
    id = "placas_pope",
    titulo = "Las placas de Pope",
    requiere_alife = true,
    requiere_refugio = true,
    si = { { "memoria", "desertor", "protegido" }, { "no", { "mem", "placas_pope" } }, { "no", { "mem", "ray_mecanico" } } },
    excluye = { "el_desertor", "eco_desertor_vuelve" },
    peso = 6,
    dia_minimo = 16,
    enfriamiento = 96,
    tono = "drama",
    intensidad = 3,
    etiquetas = { "ayuda" },
    sorteo = { loretta = { valores = { "viva", "viva", "muerta" } } },
    inicio = "llegada",
    etapas = {
        llegada = {
            al_entrar = {
                { "lugar_refugio", id = "refugio" },
                { "npcs", id = RAY, lugar = "refugio", radio = 50, no_mas_cerca = 10, retraso = 0.5,
                  modo = "guard", quietos = true, correa = 3, postura = "friendly",
                  perfiles = { { "ray", PERFIL_RAY } }, nombres = { ray = { "Ray", "Doyle" } } },
            },
            salidas = {
                { cuando = { "grupo_listo", RAY }, ir = "pedido" },
                { cuando = { "horas", 48 }, ir = "final_no_llego" },
            },
        },
        pedido = {
            pista = "Hablar con Ray Doyle, que espera en {lugar:refugio} (clic derecho cerca de el).",
            charla = { grupo = RAY, lista = "placas", radio = 12, cada = 0.4 },
            ancla = "refugio", ancla_grupo = RAY,
            al_entrar = {
                { "aviso", texto = "Ray Doyle espera en la entrada de {lugar:refugio}, con las botas puestas y una mano en la bota izquierda." },
                { "decir", grupo = RAY, rol = "ray", texto = "Alto. Soy yo. Doyle. No vengo a que me rescate. Vengo a pedirle trabajo. Uno solo." },
                { "decir", grupo = RAY, rol = "ray", retraso = 0.03, si = { "mem", "tanque_ray" },
                  texto = "La noche del tanque hable por el 19. Primera vez desde agosto. Me contestaron. Eso me trajo aca." },
                { "decir", grupo = RAY, rol = "ray", retraso = 0.05,
                  texto = "En la bota llevo algo que no es mio. Las placas del especialista Darnell Pope. Veinte anos. Del West End de Louisville." },
                { "decir", grupo = RAY, rol = "ray", retraso = 0.08,
                  texto = "Segunda noche. Barricada sur de la 31. Me ordenaron disparar. No pude. Pope disparo por los dos. A las cuatro lo mordieron. Me pidio que lo terminara. Lo hice." },
                { "decir", grupo = RAY, rol = "ray", retraso = 0.11,
                  texto = "Despues le puse mis placas. Me colgue las suyas. A el lo quemaron con mi nombre. Mi hija va a recibir una bandera. La mama de Pope, nada. Le robe la muerte a Pope." },
                { "decir", grupo = RAY, rol = "ray", retraso = 0.14,
                  texto = "Se llama Loretta. Pope me hizo aprender la direccion la primera noche. Por si acaso. Escribi una carta. La verdad, entera. Lleve las placas. Yo voy con usted hasta la esquina. La puerta la toca usted." },
                { "diario", texto = "Ray Doyle volvio a {lugar:refugio}. Me conto lo de la barricada: Darnell Pope disparo por los dos, lo mordieron y Ray lo remato cuando se lo pidio. Despues le cambio las placas. Ahora quiere que se las lleve a la mama de Pope, en Louisville." },
            },
            opciones = {
                { id = "aceptar", texto = "Llevarle las placas de Pope a su mama, en Louisville, con Ray",
                  dice = { rol = RAY, texto = "Copiado. Botas puestas." } },
                { id = "despues", texto = "Decirle que ahora no",
                  dice = { rol = RAY, texto = "Copiado. Las sigo cargando. Hasta que usted pueda." } },
            },
            salidas = {
                { cuando = { "mato_jugador", RAY }, ir = "final_lo_mataste" },
                { cuando = { "eleccion", "aceptar" }, ir = "camino" },
                { cuando = { "eleccion", "despues" }, ir = "final_despues" },
                { cuando = { "horas", 48 }, ir = "final_despues" },
            },
        },
        camino = {
            pista = "Ir con Ray a {lugar:casa_pope}, en Louisville, y llevarle las placas a Loretta Pope.",
            objetivo = "casa_pope",
            charla = { grupo = RAY, lista = "placas", radio = 10, cada = 0.6 },
            al_entrar = {
                { "lugar", id = "casa_pope", pueblo = "Louisville", nombre = "la casa de los Pope",
                  cerca_de = { 12050, 2300, 350 }, salas = { "livingroom", "kitchen", "bedroom" }, respaldo = { "bathroom", "hall" } },
                { "dar_objeto", id = "placas", tipo = PLACAS, nombre = "Las placas de Darnell Pope (con una carta de Ray)" },
                { "mapa", lugar = "casa_pope", titulo = "La direccion que Pope le hizo aprender a Ray" },
                { "acompanante", grupo = RAY, rol = "ray", nombre = "Ray Doyle", inmortal = false },
                { "banderas", grupo = RAY, quietos = false, correa = 0 },
                { "diario", texto = "Llevo las placas de Darnell Pope y una carta de Ray, doblada en cuatro. La casa de los Pope esta en {lugar:casa_pope}. Ray viene conmigo hasta la esquina." },
            },
            salidas = {
                { cuando = { "mato_jugador", RAY }, ir = "final_lo_mataste" },
                { cuando = { "todos_muertos", RAY }, ir = "ray_cayo" },
                { cuando = { "cerca", "casa_pope", 50 }, ir = "esquina" },
            },
        },
        -- Ray murio en el camino: las placas las lleva uno solo.
        ray_cayo = {
            al_entrar = {
                { "soltar_acompanante", grupo = RAY, rol = "ray" },
                { "variable", nombre = "ray_murio", valor = true },
                { "memoria", clave = "desertor", valor = "muerto" },
                { "diario", texto = "Ray Doyle murio en el camino a Louisville. Ya no hay nadie que sepa lo de la barricada, salvo yo. Las placas de Pope las llevo igual." },
            },
            salidas = { { ir = "camino_solo" } },
        },
        camino_solo = {
            pista = "Llevarle las placas de Pope a Loretta, en {lugar:casa_pope}. Ray ya no viene.",
            objetivo = "casa_pope",
            salidas = { { cuando = { "cerca", "casa_pope", 50 }, ir = "casa" } },
        },
        esquina = {
            al_entrar = {
                { "soltar_acompanante", grupo = RAY, rol = "ray" },
                { "banderas", grupo = RAY, quietos = true, correa = 4 },
                { "decir", grupo = RAY, rol = "ray", texto = "Hasta aqui llego yo. La puerta la toca usted. Si vuelve, no me cuente en la calle. Me cuenta aca." },
            },
            salidas = { { ir = "casa" } },
        },
        casa = {
            salidas = {
                { cuando = { "var", "loretta", "viva" }, ir = "casa_viva" },
                { ir = "casa_muerta" },
            },
        },
        -- Loretta esta viva, encerrada en su casa con los muertos en la puerta.
        casa_viva = {
            pista = "Encontrar a Loretta Pope en {lugar:casa_pope}. Hay muertos golpeando la puerta.",
            objetivo = "casa_pope",
            al_entrar = {
                { "npcs", id = LORETTA, lugar = "casa_pope", radio = 30, no_mas_cerca = 5, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "loretta", PERFIL_LORETTA } }, nombres = { loretta = { "Loretta", "Pope" } },
                  femeninos = { "loretta" } },
                { "oleada", lugar = "casa_pope", radio = 45, cantidad = { 12, 18 }, min = 12, max = 30 },
            },
            salidas = {
                { cuando = { "mato_jugador", LORETTA }, ir = "final_mataste_loretta" },
                { cuando = { "todos_muertos", LORETTA }, ir = "loretta_cayo" },
                { cuando = { { "grupo_listo", LORETTA }, { "o", { "sin_zombis", "casa_pope", 15 }, { "horas", 1 } } }, ir = "loretta" },
            },
        },
        loretta = {
            pista = "Hablar con Loretta Pope (clic derecho cerca).",
            ancla = "casa_pope", ancla_grupo = LORETTA, radio = 20,
            al_entrar = {
                { "decir", grupo = LORETTA, rol = "loretta", texto = "Si viene por Darnell, no se fue. Los de uniforme me dijeron que se fue. Mi hijo no se va de ninguna parte. Se lo dije a ellos y se lo digo a usted." },
            },
            opciones = {
                { id = "con_carta", texto = "Darle las placas de Darnell y la carta de Ray", requiere = { "objeto", "placas" },
                  falta = "No llevas las placas de Pope.",
                  acciones = { { "variable", nombre = "entrega", valor = "con_carta" } },
                  dice = { rol = "loretta", texto = "Pope, D. ... Esta letra no es de el. 'Murio a mi lado. No se fue. El que se fue fui yo.' ... Darnell. Mi Darnell no se fue." } },
                { id = "sin_carta", texto = "Darle las placas y guardarte la carta de Ray", requiere = { "objeto", "placas" },
                  falta = "No llevas las placas de Pope.",
                  acciones = { { "variable", nombre = "entrega", valor = "sin_carta" } },
                  dice = { rol = "loretta", texto = "Pope, D. ... Entonces no se fue. Murio. ... Que Dios me perdone, pero prefiero esto. Prefiero esto." } },
                { id = "contado", texto = "Contarle lo de Darnell (las placas se perdieron en el camino)",
                  acciones = { { "variable", nombre = "entrega", valor = "contado" } },
                  dice = { rol = "loretta", texto = "Usted no trae nada. Y me pide que le crea. ... Le creo. Nadie camina hasta Louisville para mentirle a una vieja." } },
            },
            salidas = {
                { cuando = { "mato_jugador", LORETTA }, ir = "final_mataste_loretta" },
                { cuando = { "o", { "eleccion", "con_carta" }, { "eleccion", "sin_carta" }, { "eleccion", "contado" } }, ir = "despedida" },
            },
        },
        despedida = {
            al_entrar = {
                { "decir", grupo = LORETTA, rol = "loretta", retraso = 0.05, texto = { por_var = "entrega", textos = {
                    con_carta = "Digale al que escribio esto que no lo perdono. Todavia. Que venga cuando me pueda mirar a la cara. Esta puerta sigue abierta.",
                    sin_carta = "Gracias por traermelo. Ahora puedo dejar de mirar por la ventana.",
                    otro = "Vayase antes de que oscurezca. Yo me quedo. Aqui lo espere y aqui lo lloro." } } },
                { "retirar_lejos", grupo = LORETTA, lugar = "casa_pope", radio = 40, retraso = 1 },
            },
            salidas = DESPUES_DE_LA_CASA,
        },
        -- Loretta murio en el sitio: le queda lo mismo que a la que ya no estaba.
        loretta_cayo = {
            al_entrar = {
                { "aviso", texto = "Loretta Pope cayo en la puerta de su casa, esperando todavia." },
            },
            salidas = { { ir = "tumba" } },
        },
        -- Loretta ya no estaba: se transformo en su cocina, esperando.
        casa_muerta = {
            pista = "Averiguar que paso con Loretta Pope en {lugar:casa_pope}.",
            objetivo = "casa_pope",
            al_entrar = {
                { "aviso", texto = "La puerta de la casa de los Pope esta entornada. En la cocina hay una muerta con vestido de ir a la iglesia, de cara a la ventana." },
                { "zombi_en", lugar = "casa_pope", femenino = true },
                { "nota", lugar = "casa_pope", titulo = "Nota pegada en el refrigerador",
                  texto = "Darnell: los de uniforme dicen que te fuiste. Yo no les creo. Me mordieron en la fila del agua. Si llegas y no te abro, no es que no te espere. La llave esta donde siempre. Mama." },
                { "oleada", lugar = "casa_pope", radio = 40, cantidad = { 5, 8 }, min = 15, max = 30, retraso = 0.05 },
            },
            salidas = { { cuando = { "o", { "sin_zombis", "casa_pope", 12 }, { "horas", 1 } }, ir = "tumba" } },
        },
        tumba = {
            pista = "Despedirte de Loretta Pope en {lugar:casa_pope} (clic derecho cerca).",
            ancla = "casa_pope", radio = 15,
            opciones = {
                { id = "dejar", texto = "Dejarle a Loretta las placas de Darnell, junto a la nota", requiere = { "objeto", "placas" },
                  falta = "No llevas las placas de Pope.",
                  acciones = { { "variable", nombre = "entrega", valor = "tumba" } },
                  respuesta = "Dejas las placas sobre la nota del refrigerador. Pope, D. Ahora la casa sabe donde esta su hijo." },
                { id = "nada", texto = "Irte sin dejarle nada (las placas se perdieron)",
                  acciones = { { "variable", nombre = "entrega", valor = "perdidas" } },
                  respuesta = "Cierras la puerta de los Pope. Adentro no queda nadie esperando, y nadie sabe nada." },
            },
            salidas = { { cuando = { "o", { "eleccion", "dejar" }, { "eleccion", "nada" } }, ir = "despues_tumba" } },
        },
        despues_tumba = { salidas = DESPUES_DE_LA_CASA },
        volver = {
            pista = "Volver a la esquina, donde espera Ray, y contarle lo de Loretta (clic derecho cerca de el).",
            ancla = "casa_pope", ancla_grupo = RAY, radio = 5,
            opciones = { { id = "contar", texto = "Contarle a Ray lo que paso con Loretta Pope" } },
            salidas = {
                { cuando = { "mato_jugador", RAY }, ir = "final_lo_mataste" },
                { cuando = { "todos_muertos", RAY }, ir = "final_sin_ray" },
                { cuando = { { "eleccion", "contar" }, { "var", "entrega", "perdidas" } }, ir = "final_se_fue" },
                { cuando = { "eleccion", "contar" }, ir = "quedarse" },
            },
        },
        -- A Loretta le llego algo: Ray decide entero, por primera vez.
        quedarse = {
            pista = "Ray quiere quedarse en un campamento. Decidir donde (clic derecho cerca de el).",
            ancla = "casa_pope", ancla_grupo = RAY, radio = 5,
            al_entrar = {
                { "decir", grupo = RAY, rol = "ray", texto = { por_var = "entrega", textos = {
                    con_carta = "Le dio la carta. ... Que no me perdona. Todavia. ... Todavia es una palabra con puerta. Copiado.",
                    sin_carta = "Se guardo la carta. ... Copiado. Pope volvio a estar muerto. Yo sigo igual. Es justo.",
                    contado = "Sin las placas. Y le creyo igual. ... Hay gente asi. Pope era asi.",
                    otro = "Ya no estaba. Le dejo las placas. ... Entonces Pope llego a la casa. Tarde. Pero llego." } } },
                { "decir", grupo = RAY, rol = "ray", retraso = 0.04,
                  texto = "Esta vez no me voy caminando. Me quedo. Deme un taller. Se arreglar cosas." },
            },
            opciones = {
                campamento("rosewood", "Mandarlo a la gasolinera de la Misia Rosa, en Rosewood",
                    "Rosewood. El Gordo del 19 dice que alla un tal Cecil desarmo dos veces la bomba de agua. Copiado.",
                    { "no", { "dominio", "rosewood", "bandido" } }),
                campamento("muldraugh", "Mandarlo a la comisaria del Cabo Ramiro, en Muldraugh",
                    "El Cabo. El de los once. Si es cierto, es mejor soldado que yo. Copiado.",
                    { "campamento_abierto", "muldraugh" }),
                campamento("westpoint", "Mandarlo al cuartel de la Tia Chela, en West Point",
                    "Bomberos. Siempre hay un motor que no arranca. Copiado.",
                    { "campamento_abierto", "westpoint" }),
                campamento("riverside", "Mandarlo a la iglesia del Padre Nacho, en Riverside",
                    "Un cura. ... Bien. No le voy a contar nada. Copiado.",
                    { "campamento_abierto", "riverside" }),
                { id = "sin_lugar", texto = "Decirle que no tienes donde mandarlo",
                  dice = { rol = RAY, texto = "Copiado. Entonces sigo caminando. Es lo que se hacer." } },
            },
            salidas = {
                { cuando = { "mato_jugador", RAY }, ir = "final_lo_mataste" },
                { cuando = { "todos_muertos", RAY }, ir = "final_sin_ray" },
                { cuando = { "eleccion", "sin_lugar" }, ir = "final_se_fue" },
                { cuando = { "o", { "eleccion", "a_rosewood" }, { "eleccion", "a_muldraugh" }, { "eleccion", "a_westpoint" },
                    { "eleccion", "a_riverside" } }, ir = "final_mecanico" },
            },
        },
        final_mecanico = {
            final = true,
            al_entrar = {
                { "memoria", clave = "placas_pope", valor = "var:entrega" },
                { "memoria", clave = "ray_mecanico", valor = "var:campamento" },
                { "oficio_campamento", contacto = "var:campamento", oficio = "mecanico", grupo = RAY, rol = "ray" },
                { "decir", grupo = RAY, rol = "ray", retraso = 0.03, texto = "Gracias. Lo anoto. Le devuelvo el favor. Cuidese. Botas puestas." },
                { "huella", acto = "cumpliste", texto = "Le lleve a Loretta Pope lo que quedaba de su hijo." },
                { "diario", texto = { por_var = "entrega", textos = {
                    con_carta = "Loretta Pope tiene las placas de su hijo y la carta de Ray: ahora sabe que Darnell no se fue. Le mando a decir que no lo perdona, todavia. Ray se queda de mecanico en un campamento. Dice que todavia es una palabra con puerta.",
                    sin_carta = "Loretta Pope tiene las placas de su hijo. La carta de Ray me la guarde: ella sabe que Darnell murio, no como. Ray se queda de mecanico en un campamento. Dice que es justo.",
                    contado = "Perdi las placas en el camino, pero Loretta Pope me creyo igual: Darnell no se fue. Ray se queda de mecanico en un campamento.",
                    otro = "Loretta Pope ya no estaba. Le deje las placas de Darnell junto a su nota. Ray se queda de mecanico en un campamento. Dice que Pope llego a la casa, tarde, pero llego." } } },
                { "retirar_lejos", grupo = RAY, lugar = "casa_pope", radio = 50, retraso = 0.5 },
            },
        },
        final_se_fue = {
            final = true,
            al_entrar = {
                { "memoria", clave = "placas_pope", valor = "var:entrega" },
                { "decir", grupo = RAY, rol = "ray", texto = { por_var = "entrega", textos = {
                    perdidas = "No le llego nada. ... Entonces Pope sigue perdido. Igual que yo. Cuidese. Botas puestas.",
                    otro = "Cuidese. Botas puestas. Si algun dia necesita un fusil, ya sabe." } } },
                { "diario", texto = { por_var = "entrega", textos = {
                    perdidas = "Perdi las placas de Pope y Loretta ya no estaba. Ray no dijo nada mas. Se fue caminando por la calle, con las botas puestas, como siempre que se pone dificil.",
                    otro = "No tenia donde mandar a Ray. Se fue caminando por la calle, con las botas puestas. Loretta Pope, por lo menos, ya sabe." } } },
                { "retirar_lejos", grupo = RAY, lugar = "casa_pope", radio = 50, retraso = 0.3 },
            },
        },
        final_sin_ray = {
            final = true,
            al_entrar = {
                { "memoria", clave = "desertor", valor = "muerto" },
                { "memoria", clave = "placas_pope", valor = "var:entrega" },
                { "huella", acto = "cumpliste", texto = "Le lleve a Loretta Pope lo que quedaba de su hijo, aunque Ray no llego." },
                { "diario", texto = { por_var = "entrega", textos = {
                    perdidas = "Ray Doyle murio y las placas de Pope se perdieron. En Louisville nadie sabe lo que paso en la barricada. Solo yo.",
                    otro = "Ray Doyle murio sin saber que Loretta Pope ya sabe. Las placas de Darnell llegaron a su casa. Las de Ray se quemaron en julio con otro nombre." } } },
            },
        },
        final_lo_mataste = {
            final = true,
            al_entrar = {
                { "memoria", clave = "desertor", valor = "asesinado" },
                { "diario", texto = "Ray Doyle murio. Fue {quien_mato}. Las placas de Pope se quedaron en su bota." },
            },
        },
        final_mataste_loretta = {
            final = true,
            al_entrar = {
                { "memoria", clave = "placas_pope", valor = "perdidas" },
                { "huella", acto = "mataste", texto = "Mate a Loretta Pope en su casa." },
                { "diario", si = { "no", { "var", "ray_murio", true } },
                  texto = "Loretta Pope murio en su casa. Fue {quien_mato}. Ray oyo el tiro desde la esquina y se fue sin preguntar." },
                { "diario", si = { "var", "ray_murio", true },
                  texto = "Loretta Pope murio en su casa. Fue {quien_mato}. Ray ya no estaba para preguntar por que." },
                { "retirar_lejos", grupo = RAY, lugar = "casa_pope", radio = 50, retraso = 0.2 },
            },
        },
        final_despues = {
            final = true,
            al_entrar = {
                { "diario", texto = "Ray Doyle sigue cargando las placas de Pope en la bota. Le dije que ahora no. Se fue a esperar." },
                { "retirar_lejos", grupo = RAY, lugar = "refugio", radio = 50, retraso = 0.5 },
            },
        },
        final_no_llego = {
            final = true,
            al_entrar = { { "diario", texto = "Alguien con botas paso cerca de mi refugio y no golpeo la puerta." } },
        },
    },
})
