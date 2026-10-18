-- Historia principal, capitulo 1: la familia Bell llega a tu refugio. Al terminar (con
-- cualquier final) se abre el capitulo 2, Sous (ver Sous.lua). Uno de los Bell puede estar infectado (o ninguno).
-- Necesita que algun jugador tenga un refugio reclamado (o una casa marcada como base en A-Life).
-- Si los dejas quedarse, se quedan a vivir ahi aunque la historia termine: inmortales, limpian la
-- zona y arrancan de las hordas (accion "bell_quedarse", server/Narrador/NarradorBell.lua).
--
-- "dice" = lo que habla un personaje (burbuja de A-Life sobre su cabeza).
-- "respuesta" = narracion (cartel arriba de la pantalla).
-- Textos sin tildes a proposito: el juego no siempre muestra bien los caracteres
-- especiales escritos directo en archivos .lua.

require "Narrador/NarradorDefs"

local FAMILIA = "familia"

-- Lo que conversan los Bell mientras viven en tu refugio (algunas frases dependen de quien esta enfermo).
Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.bell = {
    { "padre", "Voy a ayudar con la guardia. No disparo bien, pero tengo buenos ojos." },
    { "padre", "Antes vendia seguros. Seguros de vida. Que ironia, no?" },
    { "padre", "Si necesitas que cargue algo, avisame. No quiero ser una boca mas." },
    { "padre", "Wade era el mejor de su clase en matematicas. Ahora cuenta balas." },
    { "padre", "Yvonne no duerme bien. Yo tampoco. Pero aca es distinto, aca hay paredes." },
    { "padre", "Arregle la bisagra de la puerta del fondo. Sonaba mucho. Los atrae, el ruido." },
    { "padre", "Un dia le voy a contar a Wade como nos salvaste. Cuando sea grande." },
    { "padre", "Si alguien sabe de un medico... de lo que sea. Por favor.", si = { "no", { "var", "infectado", "nadie" } } },
    { "madre", "Wade, no molestes a la gente. Dejalos trabajar." },
    { "madre", "Gracias por dejarnos quedar. No sabes lo que significa para nosotros." },
    { "madre", "Antes de todo esto yo era profesora. Ahora enseno a hervir agua." },
    { "madre", "Si consigues hilo y aguja, te arreglo la ropa. Es lo minimo." },
    { "madre", "Daniel se hace el fuerte. Por las noches lo escucho llorar." },
    { "madre", "Cocine algo con lo que habia. No es mucho, pero esta caliente." },
    { "madre", "Wade dibuja tu refugio en las paredes. Dice que es un castillo." },
    { "madre", "Estoy bien. Solo necesito dormir un poco.", si = { "var", "infectado", "madre" } },
    { "madre", "No me miren asi. Es cansancio, nada mas.", si = { "var", "infectado", "madre" } },
    { "madre", "Daniel, la fiebre no le baja. No le baja.", si = { "var", "infectado", "hijo" } },
    { "madre", "Daniel, deja que te mire esa mano. Por favor.", si = { "var", "infectado", "padre" } },
    { "padre", "Es un corte, Yvonne. Un corte nomas.", si = { "var", "infectado", "padre" } },
    { "hijo", "Papa tiene la mano vendada y no me deja tocarla.", si = { "var", "infectado", "padre" } },
    { "hijo", "Papa dice que aca estamos seguros. Es verdad?" },
    { "hijo", "Tienes algun comic? Lo que sea para leer. Me aburro." },
    { "hijo", "Yo se poner trampas. Me enseno mi abuelo. Te hago una si quieres." },
    { "hijo", "No tengo hambre. Bueno... un poco." },
    { "hijo", "Mataste a muchos zombis? Cuantos? Mas de cien?" },
    { "hijo", "Papa ronca. Mucho. Si los zombis nos encuentran va a ser culpa de el." },
    { "hijo", "Te hice un dibujo. Eres tu, con una escopeta gigante." },
    { "hijo", "Extrano a mi perro. Se llamaba Biscuit. Se escapo el primer dia." },
    { "hijo", "Me pica el brazo. No es nada, de verdad.", si = { "var", "infectado", "hijo" } },
    { "hijo", "Por que tengo tanto frio? Afuera hace calor.", si = { "var", "infectado", "hijo" } },
    { "hijo", "Mama esta rara. Duerme todo el dia.", si = { "var", "infectado", "madre" } },
    { "hijo", "Ya me siento mejor, creo. Ya no toso tanto.", si = { "var", "infectado", "nadie" } },
}

-- Lo que dicen los Bell mientras viven en tu refugio despues de su historia (NarradorBell). Los
-- del que se transformo no salen solos: solo hablan los que estan.
Narrador.Charlas.bell_refugio = {
    { "padre", "Di una vuelta por la cuadra. Limpie dos. Uno era el cartero, creo." },
    { "padre", "Si viene algo grande, nos vamos. No es cobardia, es que ya perdimos bastante." },
    { "padre", "Arregle la reja de atras. No va a aguantar una horda, pero algo es algo." },
    { "madre", "Hay sopa. Poca, pero hay. Come antes de salir." },
    { "madre", "Cuando nos vamos corriendo, siempre volvemos. Aunque sea con una lata de porotos." },
    { "madre", "Lave tu ropa. Bueno, la que no estaba rota." },
    { "hijo", "Mate a uno con la pala! Bueno, papa me ayudo. Un poco." },
    { "hijo", "Encontre una pila en el auto de la esquina. Funciona!" },
    { "hijo", "Cuando arrancamos me escondo en la bodega de la bencinera. Nadie me encuentra ahi." },
}

-- Lo que dicen los Bell que quedan despues del engano. Nunca lo supieron.
Narrador.Charlas.bell_gratitud = {
    { "padre", "Todavia pienso en lo que hiciste por nosotros. Fuiste hasta alla. Nadie mas lo habria hecho." },
    { "padre", "No fue tu culpa. Esas pastillas eran una estafa. Tu hiciste todo lo que podias." },
    { "padre", "Cuando Wade sea grande le voy a contar que alguien arriesgo la vida por esta familia." },
    { "padre", "Si alguna vez necesitas algo, lo que sea. Te debemos demasiado." },
    { "madre", "Gracias por intentarlo. De verdad. Lo digo todos los dias en voz baja.", si = { "no", { "var", "infectado", "madre" } } },
    { "madre", "Dejamos un plato para ti. Siempre. Es lo minimo.", si = { "no", { "var", "infectado", "madre" } } },
    { "hijo", "Papa dice que eres la persona mas valiente que conoce.", si = { "no", { "var", "infectado", "hijo" } } },
    { "hijo", "Te hice otro dibujo. Eres tu con la pastilla, salvandonos. No salio bien la parte final.", si = { "no", { "var", "infectado", "hijo" } } },
}

Narrador.Defs.registrar({
    id = "familia_infectada",
    titulo = "Los Bell",
    titulo_menu = "Cap. 1: Los Bell (historia principal)",
    requiere_alife = true,
    requiere_refugio = true,
    peso = 10,
    max_veces = 1,
    dia_minimo = 2,

    nombres = { padre = "Daniel", madre = "Yvonne", hijo = "Wade", nadie = "nadie" },

    -- Se sortea una vez al empezar. Nadie lo ve (salvo un admin con "Ver secretos").
    sorteo = {
        infectado = { valores = { "hijo", "madre", "padre", "nadie" }, pesos = { 5, 3, 2, 2 } },
        cura_real = { valores = { true, false }, pesos = { 2, 1 } },
        horas_infeccion = { rango = { 36, 60 } },
        laboratorio_ocupado = { valores = { true, false }, pesos = { 1, 2 } },
    },

    inicio = "llegada",

    etapas = {
        -- 1. Sin aviso: un dia aparecen en la puerta de tu refugio, cuando alguien anda cerca.
        llegada = {
            al_entrar = {
                { "lugar_refugio", id = "refugio" },
                { "npcs", id = FAMILIA, lugar = "refugio", radio = 60, no_mas_cerca = 12, retraso = 1,
                  -- Inmortales hasta que termine lo de la cura (despues, en tu refugio, tambien).
                  -- Rondan por el refugio (correa corta, a ratos sentados: NarradorBell B.rondar).
                  modo = "guard", correa = 8, postura = "friendly", inmortales = true,
                  perfiles = { { "padre", "k93_bell_family_01" }, { "madre", "k93_bell_family_02" },
                               { "hijo", "k93_bell_family_04" } },
                  nombres = { padre = { "Daniel", "Bell" }, madre = { "Yvonne", "Bell" }, hijo = { "Wade", "Bell" } },
                  femeninos = { "madre" } },
            },
            salidas = {
                { cuando = { "grupo_listo", FAMILIA }, ir = "encuentro" },
                { cuando = { "horas", 96 }, ir = "final_olvidados" },
            },
        },

        -- 2. Llegaron. Piden quedarse.
        encuentro = {
            pista = "Decidir que hacer con los Bell (clic derecho cerca de ellos).",
            ancla = "refugio",
            ancla_grupo = FAMILIA,
            al_entrar = {
                { "aviso", texto = "Hay una familia en la puerta de {lugar:refugio}. Levantan las manos para que no les disparen." },
                { "decir", grupo = FAMILIA, rol = "padre", texto = "Gracias por no disparar. Somos los Bell. Solo necesitamos un techo unos dias." },
                { "reloj", id = "infeccion", horas = "var:horas_infeccion",
                  si = { "no", { "var", "infectado", "nadie" } } },
                { "diario", texto = "Daniel Bell, su esposa Yvonne y su hijo Wade llegaron a {lugar:refugio}. Piden quedarse." },
            },
            opciones = {
                { id = "acoger", texto = "Dejarlos quedarse en el refugio",
                  dice = { rol = "padre", texto = "Dios te lo pague. No vamos a ser una carga, lo prometo." } },
                { id = "comida", texto = "Darles comida", requiere = { "comida" },
                  falta = "No llevas comida en el inventario.",
                  dice = { rol = "madre", texto = "Gracias... Wade, come tu primero." } },
                { id = "preguntar", texto = "Preguntar quien esta enfermo", una_vez = true,
                  dice = { rol = "padre", texto = { por_var = "infectado", textos = {
                      hijo = "Es un resfrio. Wade tiene que tener un resfrio.",
                      madre = "Yvonne esta cansada, nada mas. Cierto, amor?",
                      padre = "Nadie, nadie. Estamos todos bien. Yo estoy bien.",
                      nadie = "Wade tiene fiebre hace dos dias. Tose, pero come. No lo mordio nada, lo juro.",
                  } } },
                  respuesta = { por_var = "infectado", textos = {
                      hijo = "Wade tose envuelto en una frazada y no te mira a los ojos.",
                      madre = "Yvonne se baja la manga sin que nadie se lo pida.",
                      padre = "Daniel suda aunque hace frio, y esconde la mano izquierda en el bolsillo.",
                      nadie = "Wade se encoge de hombros. Parece una gripe comun.",
                  } } },
                { id = "brazos", texto = "Pedir ver los brazos de todos", una_vez = true,
                  dice = { rol = "padre", texto = { por_var = "infectado", textos = {
                      hijo = "Se corto con una lata. Dejalo tranquilo.",
                      madre = "Yvonne... por favor, muestrales.",
                      padre = "Los brazos? Ya. Los de ellos. Los mios estan bien, me corte con una reja.",
                      nadie = "Ves? Nada. Te lo dije.",
                  } } },
                  respuesta = { por_var = "infectado", textos = {
                      hijo = "Wade esconde el antebrazo vendado detras de la espalda.",
                      madre = "Yvonne se niega y se aleja hacia la ventana.",
                      padre = "Daniel muestra los brazos de Yvonne y de Wade, limpios. El suyo lo deja vendado hasta el codo.",
                      nadie = "Los tres se arremangan. Solo rayones de alambre, nada de mordidas.",
                  } } },
                { id = "echar", texto = "Decirles que se vayan",
                  dice = { rol = "padre", texto = "Entendido. Nos vamos al amanecer." } },
            },
            salidas = {
                { cuando = { "mato_jugador", FAMILIA }, ir = "final_masacre" },
                { cuando = { "todos_muertos", FAMILIA }, ir = "final_muertos" },
                { cuando = { "eleccion", "acoger" }, ir = "acogidos" },
                { cuando = { "eleccion", "echar" }, ir = "final_abandonados" },
                { cuando = { "reloj_vencido", "infeccion" }, ir = "final_transformado" },
                { cuando = { "horas", 72 }, ir = "acogidos" },
            },
        },

        -- 3. Se instalan. Unas horas despues, la enfermedad empeora.
        acogidos = {
            pista = "Los Bell se quedan en {lugar:refugio}.",
            ancla = "refugio",
            ancla_grupo = FAMILIA,
            charla = { grupo = FAMILIA, lista = "bell", radio = 12, cada = 0.5 },
            al_entrar = {
                { "diario", texto = "Los Bell se acomodan en un rincon de {lugar:refugio}." },
            },
            opciones = {
                { id = "comida", texto = "Darles comida", requiere = { "comida" },
                  falta = "No llevas comida en el inventario.",
                  dice = { rol = "madre", texto = "Gracias. Guardo esto para Wade." } },
            },
            salidas = {
                { cuando = { "mato_jugador", FAMILIA }, ir = "final_masacre" },
                { cuando = { "todos_muertos", FAMILIA }, ir = "final_muertos" },
                { cuando = { "reloj_vencido", "infeccion" }, ir = "final_transformado" },
                -- Si los dejas quedarse, te piden la cura al tiro.
                { cuando = { "horas", 0.05 }, ir = "pide_ayuda" },
            },
        },

        -- 4. Daniel confiesa y pide que vayas por un suero.
        pide_ayuda = {
            pista = "Buscar el suero experimental en {lugar:laboratorio} y traerlo a los Bell.",
            ancla = "refugio",
            ancla_grupo = FAMILIA,
            charla = { grupo = FAMILIA, lista = "bell", radio = 12, cada = 0.5 },
            al_entrar = {
                { "lugar", id = "laboratorio", desde = "refugio",
                  salas = { "laboratory", "medicalstorage", "medical", "hospital*" },
                  respaldo = { "pharmacy", "pharmacystorage", "medicaloffice" },
                  min = 250, max = 1500 },
                { "decir", grupo = FAMILIA, rol = "padre", texto = { por_var = "infectado", textos = {
                    hijo = "Te menti. A Wade lo mordieron. En {lugar:laboratorio} un medico repartia un suero. Por favor.",
                    madre = "Es Yvonne. La mordieron hace dos dias. En {lugar:laboratorio} habia un suero. Por favor.",
                    padre = "Soy yo. Me mordieron cruzando la reja. En {lugar:laboratorio} habia un suero. Si no vuelves a tiempo, Yvonne sabe que hacer.",
                    nadie = "La fiebre de Wade no baja. En {lugar:laboratorio} un medico repartia un suero. Por favor.",
                } } },
                { "aviso", texto = "Daniel Bell te pide que busques un suero en {lugar:laboratorio}." },
                { "diario", texto = "Daniel cuenta que en {lugar:laboratorio} un medico repartia unas pastillas experimentales 'para los mordidos'. Si existen, tienen que seguir ahi." },
                -- Varias pastillas K-93 iguales: una es la verdadera solo si el suero era real.
                { "pastillas", id = "suero", lugar = "laboratorio", radio = 45, cantidad = { 3, 5 },
                  reales = "var:cura_real", nombre = "Pastilla K-93" },
                { "oleada", lugar = "laboratorio", radio = 45, cantidad = { 14, 22 } },
                { "bandidos", id = "ocupantes", lugar = "laboratorio", radio = 55, modo = "guard", cantidad = { 2, 3 },
                  si = { "var", "laboratorio_ocupado", true } },
            },
            opciones = {
                { id = "entregar", texto = "Darles una de las pastillas K-93 (cualquiera)", requiere = { "pastilla", "suero", "cualquiera" },
                  falta = "No tienes las pastillas. Estan en {lugar:laboratorio}." },
                { id = "entregar_real", texto = "Darles la pastilla verdadera (Medicina 4+)", requiere = { "pastilla", "suero", "real" },
                  falta = "No llevas una pastilla que sepas que es verdadera (necesitas Medicina 4 o mas para distinguirla)." },
                { id = "entregar_falsa", texto = "Darles una falsa y quedarte con la verdadera (Medicina 4+)",
                  requiere = { "pastilla", "suero", "falsa" },
                  falta = "No llevas una pastilla que sepas que es falsa (necesitas Medicina 4 o mas para distinguirla).",
                  acciones = { { "variable", nombre = "engano", valor = true } } },
                { id = "comida", texto = "Darles comida", requiere = { "comida" },
                  falta = "No llevas comida en el inventario.",
                  dice = { rol = "madre", texto = "Que Dios te lo pague." } },
            },
            salidas = {
                { cuando = { "mato_jugador", FAMILIA }, ir = "final_masacre" },
                { cuando = { "todos_muertos", FAMILIA }, ir = "final_muertos" },
                { cuando = { "o", { "eleccion", "entregar" }, { "eleccion", "entregar_real" }, { "eleccion", "entregar_falsa" } }, ir = "aplicar" },
                { cuando = { "reloj_vencido", "infeccion" }, ir = "final_transformado" },
                { cuando = { { "var", "infectado", "nadie" }, { "horas", 72 } }, ir = "final_se_curo_solo" },
            },
        },

        -- 5. Paso de transicion: se decide al tiro segun lo sorteado.
        aplicar = {
            al_entrar = {
                { "detener_reloj", id = "infeccion" },
            },
            salidas = {
                { cuando = { "var", "infectado", "nadie" }, ir = "final_era_gripe" },
                -- Engano solo si de verdad habia una buena y te la quedaste (si eran todas de azucar, no hay a quien enganar).
                { cuando = { { "var", "engano", true }, { "var", "pastilla_dada", "falsa" }, { "var", "cura_real", true } }, ir = "final_engano" },
                { cuando = { "var", "pastilla_dada", "real" }, ir = "final_salvados" },
                { cuando = { "var", "pastilla_dada", "falsa" }, ir = "final_falso_remedio" },
            },
        },

        -- ------------------------------------------------------------------
        -- Finales. Salvo que los eches o los mates, los Bell se quedan en tu refugio.
        -- ------------------------------------------------------------------

        final_salvados = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "diario", texto = "{nombre:infectado} pasa la noche con fiebre altisima. Al amanecer, la fiebre baja. El suero era real." },
                { "decir", grupo = FAMILIA, rol = "padre", texto = "Le salvaste la vida. Mientras estemos aqui, cuenta con nosotros." },
                { "recompensa", lugar = "refugio", radio = 40,
                  items = { { "Base.Shotgun", "Base.DoubleBarrelShotgun" }, { "Base.ShotgunShells" }, { "Base.ShotgunShells" },
                            { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Bandage" } } },
                { "memoria", clave = "bell", valor = "salvados" },
                { "bell_quedarse", grupo = FAMILIA, lugar = "refugio", charla = "bell_refugio" },
            },
        },

        final_falso_remedio = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "transformar", grupo = FAMILIA, rol = "var:infectado" },
                -- El padre remata al que se transformo (o la madre, si el transformado es el padre).
                { "bell_rematar", lugar = "refugio", radio = 60, retraso = 0.08 },
                { "decir", grupo = FAMILIA, rol = "padre", texto = "No... no, no, no. Era agua. Nos vendieron agua." },
                { "diario", texto = "El suero era agua con azucar y colorante. Esa misma noche {nombre:infectado} se levanta distinto. Alguien vendio esperanza falsa en {lugar:laboratorio}." },
                { "memoria", clave = "bell", valor = "falso_remedio" },
                { "bell_quedarse", grupo = FAMILIA, lugar = "refugio", charla = "bell_refugio" },
                { "memoria", clave = "curandero_falso", valor = true },
            },
        },

        -- Les diste una falsa a proposito y te quedaste con la verdadera. Nunca lo van a saber:
        -- se quedan en tu refugio, agradecidos porque lo intentaste.
        final_engano = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "transformar", grupo = FAMILIA, rol = "var:infectado" },
                -- El padre remata al que se transformo (o la madre, si el transformado es el padre).
                { "bell_rematar", lugar = "refugio", radio = 60, retraso = 0.08 },
                { "decir", grupo = FAMILIA, rol = "padre", retraso = 0.3,
                  texto = "No funciono... pero tu lo intentaste. Fuiste hasta alla por nosotros. Eso no lo voy a olvidar nunca." },
                { "diario", texto = "Les di una pastilla de azucar. La verdadera la tengo yo. Esa noche {nombre:infectado} se levanto distinto. Daniel me abrazo y me dio las gracias por intentarlo." },
                { "huella", acto = "traicionaste", texto = "Les di a los Bell una pastilla falsa y me quede con la verdadera. Ellos me lo agradecen todavia." },
                { "bell_quedarse", grupo = FAMILIA, lugar = "refugio", charla = "bell_gratitud" },
                { "memoria", clave = "bell", valor = "enganados" },
                { "memoria", clave = "bell_culpa", valor = true },
            },
        },

        final_transformado = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "transformar", grupo = FAMILIA, rol = "var:infectado" },
                -- El padre remata al que se transformo (o la madre, si el transformado es el padre).
                { "bell_rematar", lugar = "refugio", radio = 60, retraso = 0.08 },
                { "aviso", texto = "Un grito largo llega desde {lugar:refugio}." },
                { "diario", texto = "No alcanzo el tiempo. {nombre:infectado} se transformo dentro de {lugar:refugio}." },
                { "memoria", clave = "bell", valor = "transformado" },
                { "bell_quedarse", grupo = FAMILIA, lugar = "refugio", charla = "bell_refugio" },
            },
        },

        final_era_gripe = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "diario", texto = "Le das el suero a Wade por si acaso. Dos dias despues la fiebre se le pasa: era una gripe comun. Nunca vas a saber si el suero hizo algo." },
                { "decir", grupo = FAMILIA, rol = "padre", texto = "Te debemos una. Lo que necesites, aqui estamos." },
                { "recompensa", lugar = "refugio", radio = 40,
                  items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Bandage" }, { "Base.Pills" } } },
                { "memoria", clave = "bell", valor = "era_gripe" },
                { "bell_quedarse", grupo = FAMILIA, lugar = "refugio", charla = "bell_refugio" },
            },
        },

        final_se_curo_solo = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "diario", texto = "La fiebre de Wade se pasa sola. Era una gripe. Los Bell se quedan en {lugar:refugio}." },
                { "memoria", clave = "bell", valor = "se_curo_solo" },
                { "bell_quedarse", grupo = FAMILIA, lugar = "refugio", charla = "bell_refugio" },
            },
        },

        final_abandonados = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "diario", texto = "Los Bell se van al amanecer. Nadie se despide." },
                { "retirar_lejos", grupo = FAMILIA, lugar = "refugio", radio = 60, retraso = 2 },
                { "nota", lugar = "refugio", radio = 40, retraso = 24, titulo = "Nota debajo de la puerta",
                  texto = { por_var = "infectado", textos = {
                      hijo = "Nos fuimos al norte. Wade no lo logro. Perdonanos, hijo. - D.B.",
                      madre = "Nos fuimos al norte. Yvonne no quiso seguir. La deje descansar. - D.B.",
                      padre = "Nos fuimos al norte. Daniel no llego. Yo tuve que hacerlo. Wade no lo vio. - Y.B.",
                      nadie = "Nos fuimos al norte. Estamos los tres bien. Gracias igual. - D.B.",
                  } } },
                { "memoria", clave = "bell", valor = "abandonados" },
            },
        },

        final_masacre = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "aviso", texto = "Disparos en {lugar:refugio}. Despues, silencio." },
                { "diario", texto = "Los Bell murieron en {lugar:refugio}. Fue {quien_mato}." },
                { "memoria", clave = "bell", valor = "masacre" },
                { "retirar_lejos", grupo = FAMILIA, lugar = "refugio", radio = 60, retraso = 2 },
            },
        },

        final_muertos = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "diario", texto = "Los Bell murieron en {lugar:refugio}. No fuiste tu, pero no alcanzaste a protegerlos." },
                { "memoria", clave = "bell", valor = "muertos" },
            },
        },

        final_olvidados = {
            final = true,
            al_entrar = {
                { "abrir", def = "sous", horas = 24 },
                { "diario", texto = "Nadie volvio a {lugar:refugio} en dias. Los Bell siguieron de largo." },
                { "nota", lugar = "refugio", radio = 40, titulo = "Nota en la puerta",
                  texto = "Pasamos por aqui. Golpeamos y nadie abrio. Seguimos al norte. - Familia Bell" },
                { "memoria", clave = "bell", valor = "olvidados" },
            },
        },
    },
})
