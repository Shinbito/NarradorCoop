-- Modo historia de los misioneros (ver ROADMAP, C). El capitulo 1 de cada uno es su
-- desbloqueo (fundar el campamento, Arcos/Desbloqueos.lua). Estos salen entre sus ofertas
-- cuando el anterior ya se hizo (G.ESPECIALES en server/Narrador/NarradorGenerador.lua) y cada
-- uno deja la memoria "historia_<id>_<n>" (requisito para subir el campamento de nivel).
--   Tia Chela  2: La radio del cuartel        (3: el cientifico, LeyendaEduardo.lua)
--   Cabo       2: La puerta de atras          (3: Valentina, HijaCabo.lua)
--   Padre Nacho 2: El ring de Lexington       3: La muchacha que esperaba
--   Misia Rosa 2: La ruta 31                  3: El estanque
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar
local FUERTE = { health = 400, damageOutput = 300 }

local function cierre(id, n, diario, extra)
    local l = {
        { "pago_encargo", lugar = "contacto", radio = 35 },
        { "memoria", clave = "historia_" .. id .. "_" .. n, valor = true },
        { "diario", texto = diario },
    }
    for _, a in ipairs(extra or {}) do table.insert(l, 1, a) end
    return { final = true, al_entrar = l }
end

local function fracaso(id, n, diario, extra)
    local l = {
        { "memoria", clave = "historia_" .. id .. "_" .. n, valor = "fallido" },
        { "diario", texto = diario },
    }
    for _, a in ipairs(extra or {}) do table.insert(l, 1, a) end
    return { final = true, al_entrar = l }
end

-- ===========================================================================
-- Tia Chela, capitulo 2: La radio del cuartel
-- ===========================================================================
registrar({
    id = "cap_chela_2",
    titulo = "La radio del cuartel",
    titulo_menu = "Historia de la Tia Chela, cap. 2: la radio del cuartel",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "tienda", desde = "contacto", salas = { "electronicsstore", "policestorage", "office" },
                  respaldo = { "garagestorage", "livingroom" }, min = 200, max = 900 },
                { "decir_contacto", texto = "Mijo, la radio del cuartel se murio. Treinta anos funcionando y se muere justo ahora. En {lugar:tienda} deberian quedar repuestos. Traemelos, que quiero escuchar si queda alguien por ahi." },
                { "mapa", lugar = "tienda", titulo = "Mapa de la Tia Chela: los repuestos" },
                { "diario", texto = "La Tia Chela quiere arreglar la radio del cuartel. Los repuestos estan en {lugar:tienda}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Buscar repuestos de radio en {lugar:tienda}.",
            objetivo = "tienda",
            salidas = { { cuando = { "cerca", "tienda", 45 }, ir = "tienda" } },
        },
        tienda = {
            pista = "Encontrar los repuestos de radio en {lugar:tienda}.",
            objetivo = "tienda",
            al_entrar = {
                { "oleada", lugar = "tienda", radio = 50, cantidad = { 12, 18 } },
                { "objeto", id = "repuestos", lugar = "tienda", radio = 45, tipo = { "Base.ElectronicsScrap", "Base.RadioRed" }, nombre = "Repuestos de radio" },
            },
            salidas = { { cuando = { "alguien_tiene", "repuestos" }, ir = "volver" } },
        },
        volver = {
            pista = "Llevarle los repuestos a la Tia Chela.",
            ancla = "contacto",
            opciones = { { id = "entregar", texto = "Entregarle los repuestos a la Tia Chela", requiere = { "objeto", "repuestos" }, falta = "No llevas los repuestos." } },
            salidas = { { cuando = { "eleccion", "entregar" }, ir = "voz" } },
        },
        voz = {
            al_entrar = {
                { "decir_contacto", texto = "A ver... estatica... estatica... Mijo. Mijo, escucha." },
                { "aviso", texto = "Entre la estatica, una voz de hombre, cortada: 'Mama... si me oyes... Louisville... un cientifico...' y nada mas.", retraso = 0.05 },
                { "decir_contacto", retraso = 0.1, texto = "Eduardo. Ese era mi Eduardo. Necesito que se escuche mejor. En el cerro hay una antena vieja. Si la arreglas, lo escuchamos entero." },
                { "lugar", id = "antena", desde = "contacto", nombre = "la antena del cerro", salas = { "church", "firestorage", "policeoffice", "office" },
                  respaldo = { "livingroom", "barn" }, min = 500, max = 1400 },
                { "mapa", lugar = "antena", titulo = "Mapa de la Tia Chela: la antena" },
                { "diario", texto = "La radio de la Chela funciono un segundo. Una voz dijo 'Mama, si me oyes'. Era Eduardo. Hay que arreglar la antena de {lugar:antena}." },
            },
            salidas = { { ir = "subir" } },
        },
        subir = {
            pista = "Ir a {lugar:antena} y arreglar la antena.",
            objetivo = "antena",
            salidas = { { cuando = { "cerca", "antena", 30 }, ir = "arreglar" } },
        },
        arreglar = {
            pista = "Arreglar la antena y aguantar a los muertos que atrae el ruido: van {bajas:antena} de {horda_meta}.",
            objetivo = "antena",
            al_entrar = {
                { "aviso", texto = "La antena chirria cuando la mueves. Todo lo que tiene oidos en el cerro la escucho." },
                { "oleada", lugar = "antena", radio = 50, cantidad = 25, por_jugador = 10, fija = true, caminantes = true,
                  min = 18, max = 40, meta = "horda_meta", meta_frac = 0.8, retraso = 0.1 },
            },
            salidas = { { cuando = { "o", { "bajas_en", "antena", "var:horda_meta", 60 }, { { "horas", 1 }, { "sin_zombis", "antena", 15 } } },
                ir = "final_cumplido" } },
        },
        final_cumplido = cierre("westpoint", 2,
            "Arregle la antena. La Chela escucho la voz entera: 'Mama, si me oyes, estoy bien. Hay un cientifico en Louisville que dice tener la cura. Voy a ayudarlo.' Lloro. Despues me reto por mirarla.",
            { { "decir_contacto", texto = "Esta bien. Mi Eduardo esta bien. Y anda ayudando gente, el cabro porfiado. Toma, mijo. Y no me mires, que se me metio algo en el ojo." },
              { "memoria", clave = "radio_westpoint", valor = true } }),
    },
})

-- ===========================================================================
-- Cabo Ramiro, capitulo 2: La puerta de atras
-- ===========================================================================
local GLADYS = "gladys"

registrar({
    id = "cap_cabo_2",
    titulo = "La puerta de atras",
    titulo_menu = "Historia del Cabo Ramiro, cap. 2: la puerta de atras",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "casa", desde = "contacto", salas = { "livingroom", "kitchen", "bedroom" }, min = 300, max = 1100 },
                { "decir_contacto", texto = "Civil. La primera noche saque a once por la puerta de atras de esta comisaria. Quedan siete. Gladys Moreno es una. Esta en {lugar:casa}, rodeada, con su gente. Traigamela. Es una orden. Y un favor." },
                { "mapa", lugar = "casa", titulo = "Mapa del Cabo Ramiro: Gladys Moreno" },
                { "diario", texto = "El Cabo me hablo de la noche de la comisaria: saco a once por la puerta de atras. Gladys Moreno es una de ellos. Esta rodeada en {lugar:casa}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:casa}, donde esta Gladys Moreno.",
            objetivo = "casa",
            salidas = { { cuando = { "cerca", "casa", 45 }, ir = "sitio" } },
        },
        sitio = {
            pista = "Mantener viva a Gladys Moreno en {lugar:casa} hasta que pase el peligro.",
            objetivo = "casa",
            al_entrar = {
                { "npcs", id = GLADYS, lugar = "casa", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "gladys", "k93_red_cross_09" } }, nombres = { gladys = { "Gladys", "Moreno" } }, femeninos = { "gladys" } },
                { "oleada", lugar = "casa", radio = 50, cantidad = { 18, 26 }, min = 12, max = 30 },
                { "oleada", lugar = "casa", radio = 50, cantidad = { 10, 14 }, min = 14, max = 30, retraso = 0.4 },
            },
            salidas = {
                { cuando = { "todos_muertos", GLADYS }, ir = "final_muerta" },
                { cuando = { { "grupo_listo", GLADYS }, { "horas", 1 } }, ir = "hablar" },
            },
        },
        hablar = {
            pista = "Hablar con Gladys Moreno (clic derecho cerca).",
            ancla = "casa", ancla_grupo = GLADYS, radio = 20,
            al_entrar = {
                { "decir", grupo = GLADYS, rol = "gladys", texto = "Te manda el cabo? Claro que te manda el cabo. Esa noche una sargento grito que cerraran todo. El abrio la puerta de atras igual. Nunca le di las gracias." },
            },
            opciones = { { id = "llevar", texto = "Llevarla donde el Cabo",
                dice = { rol = "gladys", texto = "Vamos. Esta vez se las doy en la cara." } } },
            salidas = {
                { cuando = { "todos_muertos", GLADYS }, ir = "final_muerta" },
                { cuando = { "eleccion", "llevar" }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Llevar a Gladys Moreno sana y salva donde el Cabo Ramiro.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = GLADYS, rol = "gladys", nombre = "Gladys Moreno", inmortal = false },
                { "banderas", grupo = GLADYS, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", GLADYS }, ir = "final_muerta" },
                { cuando = { "npc_cerca", GLADYS, "contacto", 15 }, ir = "final_cumplido" },
            },
        },
        final_cumplido = cierre("muldraugh", 2,
            "Lleve a Gladys Moreno donde el Cabo. Le dio las gracias en la cara, diecinueve meses tarde. El Cabo tacho un signo de pregunta en su libreta y escribio 'viva'. Me nombro a una sargento que grito que cerraran: Pereira. La anoto aparte.",
            { { "soltar_acompanante", grupo = GLADYS, rol = "gladys" },
              { "decir", grupo = GLADYS, rol = "gladys", texto = "Cabo. Gracias. Por la puerta. Por todo." },
              { "decir_contacto", retraso = 0.05, texto = "Negativo a agradecer, civil. Era mi deber. ... Gracias a usted por venir. Quedan seis signos de pregunta. Uno menos." },
              { "retirar_lejos", grupo = GLADYS, lugar = "contacto", radio = 40, retraso = 1 } }),
        final_muerta = fracaso("muldraugh", 2,
            "Gladys Moreno no llego donde el Cabo. El la saco de la comisaria la primera noche y yo no pude sacarla de una casa. Puso una cruz en su libreta sin decir nada.",
            { { "soltar_acompanante", grupo = GLADYS, rol = "gladys" },
              { "decir_contacto", texto = "Entendido, civil. Una cruz. ... Retirese." } }),
    },
})

-- ===========================================================================
-- Padre Nacho, capitulo 2: El ring de Lexington
-- ===========================================================================
local DUGGAN = "duggan"

registrar({
    id = "cap_nacho_2",
    titulo = "El ring de Lexington",
    titulo_menu = "Historia del Padre Nacho, cap. 2: el ring de Lexington",
    requiere_alife = true, automatico = false,
    sorteo = { ganador = { valores = { "nacho", "nacho", "duggan" } } },
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "guarida", desde = "contacto", salas = { "bar", "barstorage", "warehouse", "gym" },
                  respaldo = { "livingroom", "garagestorage" }, min = 300, max = 1000 },
                { "decir_contacto", texto = "Hijo, el que anda robando en Riverside es Frank Duggan. El Martillo. Le gane en Lexington el 79 y nunca me lo perdono. Llevale esta carta a {lugar:guarida}: lo reto a mano limpia, aqui, al anochecer. Si gano, se va de Riverside." },
                { "mapa", lugar = "guarida", titulo = "Mapa del Padre Nacho: el Martillo Duggan" },
                { "diario", texto = "El Padre Nacho boxeaba en Lexington. Su viejo rival, Frank 'el Martillo' Duggan, roba en Riverside. Tengo que llevarle un reto a {lugar:guarida}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Llevarle el reto del Padre a Duggan en {lugar:guarida}.",
            objetivo = "guarida",
            salidas = { { cuando = { "cerca", "guarida", 40 }, ir = "guarida" } },
        },
        guarida = {
            pista = "Encontrar a Frank Duggan en {lugar:guarida}.",
            objetivo = "guarida",
            al_entrar = {
                { "npcs", id = DUGGAN, lugar = "guarida", radio = 35, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 5,
                  inmortales = true, postura = "friendly", salud = 250, perfiles = { { "duggan", "k93_kessinger_10" } },
                  nombres = { duggan = { "Frank", "Duggan" } } },
            },
            salidas = { { cuando = { { "grupo_listo", DUGGAN }, { "cerca", "guarida", 15 } }, ir = "reto" } },
        },
        reto = {
            pista = "Darle el reto a Frank Duggan (clic derecho cerca).",
            ancla = "guarida", ancla_grupo = DUGGAN, radio = 15,
            opciones = { { id = "reto", texto = "Darle la carta del Padre Nacho",
                dice = { rol = DUGGAN, texto = "Nacho Pegas. Cura. JA! Dile que acepto. Al anochecer, en su iglesia. Y dile que esta vez no me agacho." } } },
            salidas = { { cuando = { "eleccion", "reto" }, ir = "emboscada" } },
        },
        emboscada = {
            pista = "Volver a la iglesia del Padre Nacho. Los hombres de Duggan no estan de acuerdo con su jefe.",
            objetivo = "contacto",
            al_entrar = {
                { "retirar_lejos", grupo = DUGGAN, lugar = "guarida", radio = 60, retraso = 0.1 },
                { "lugar_jugador", id = "camino" },
                { "bandidos", id = "matones", lugar = "camino", radio = 60, modo = "hunt", cantidad = { 3, 4 }, retraso = 0.2 },
                { "aviso", texto = "No todos en la banda de Duggan creen en peleas limpias. Te siguen.", retraso = 0.2 },
            },
            salidas = { { cuando = { "o", { "todos_muertos", "matones" }, { "horas", 3 } }, ir = "esperar" } },
        },
        esperar = {
            pista = "Estar en la iglesia del Padre Nacho al anochecer (entre las 19 y las 23).",
            objetivo = "contacto",
            salidas = { { cuando = { { "cerca", "contacto", 25 }, { "hora_entre", 19, 23 } }, ir = "pelea" } },
        },
        pelea = {
            al_entrar = {
                { "lugar_cerca", id = "ring", de = "contacto", distancia = 6 },
                { "npcs", id = DUGGAN .. "_ring", lugar = "ring", radio = 15, no_mas_cerca = 3, modo = "guard", quietos = true, correa = 3,
                  inmortales = true, postura = "friendly", perfiles = { { "duggan", "k93_kessinger_10" } }, nombres = { duggan = { "Frank", "Duggan" } } },
                { "decir_contacto", texto = "Frank. Cuarenta anos. Estas mas viejo. Yo tambien. Sin guantes, como en el 79." },
            },
            salidas = { { cuando = { "grupo_listo", DUGGAN .. "_ring" }, ir = "round" } },
        },
        round = {
            al_entrar = {
                { "decir", grupo = DUGGAN .. "_ring", rol = "duggan", texto = "Sin guantes, Nacho. Y sin rezar." },
                { "aviso", texto = { por_var = "ganador", textos = {
                    nacho = "Tres rounds en el atrio de la iglesia. El Padre Nacho esquiva como si tuviera treinta anos menos. En el tercero, una derecha. Duggan se sienta en el suelo y se rie.",
                    otro = "Tres rounds en el atrio de la iglesia. Duggan pega como un martillo. En el tercero el Padre cae de rodillas. Se levanta. Duggan baja los punos." } }, retraso = 0.05 },
                { "decir", grupo = DUGGAN .. "_ring", rol = "duggan", retraso = 0.12, texto = { por_var = "ganador", textos = {
                    nacho = "Otra vez, cura. Otra vez la derecha. ... Me voy de Riverside. Palabra de boxeador.",
                    otro = "Te gane, cura. Pero te levantaste. En el 79 tambien te levantaste. ... Me voy igual. Un hombre que se levanta asi se merece su pueblo." } } },
            },
            salidas = { { cuando = { "horas", 0.2 }, ir = "final_cumplido" } },
        },
        final_cumplido = cierre("riverside", 2,
            "El Padre Nacho peleo con Frank Duggan en el atrio de la iglesia, sin guantes, como en Lexington el 79. Duggan se fue de Riverside con su banda. El Padre se curo los nudillos con vino de misa y dijo que Dios le dio dos punos por algo.",
            { { "retirar_lejos", grupo = DUGGAN .. "_ring", lugar = "contacto", radio = 60, retraso = 0.5 },
              { "decir_contacto", texto = "Hijo, no le cuentes a nadie que el cura anda a punetazos. ... Bueno, cuentale a todos. Toma." } }),
    },
})

-- ===========================================================================
-- Padre Nacho, capitulo 3: La muchacha que esperaba
-- ===========================================================================
local LUCIA = "lucia"
local PUEBLOS_LUCIA = { "March Ridge", "Ekron", "Brandenburg", "Irvington", "Echo Creek" }

registrar({
    id = "cap_nacho_3",
    titulo = "La muchacha que esperaba",
    titulo_menu = "Historia del Padre Nacho, cap. 3: la muchacha que esperaba",
    requiere_alife = true, automatico = false,
    sorteo = { pueblo_lucia = { valores = PUEBLOS_LUCIA } },
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "iglesia", pueblo = "var:pueblo_lucia", salas = { "church" }, respaldo = { "livingroom", "office" },
                  cerca_del_centro = true },
                { "decir_contacto", texto = "Hijo... hace anos me fui un domingo sin avisar. Una muchacha, Lucia, me espero en la iglesia toda la tarde. Nunca supe que paso con ella. Un feligres dice que la vio en {lugar:iglesia}. Si esta viva... dile que el cura ya no se va." },
                { "mapa", lugar = "iglesia", titulo = "Mapa del Padre Nacho: Lucia" },
                { "diario", texto = "El Padre Nacho me conto lo de Lucia, la muchacha que lo espero un domingo. Dicen que esta en {lugar:iglesia}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Buscar a Lucia en {lugar:iglesia}.",
            objetivo = "iglesia",
            salidas = { { cuando = { "cerca", "iglesia", 50 }, ir = "iglesia" } },
        },
        iglesia = {
            pista = "Encontrar a Lucia en {lugar:iglesia}. Hay muertos golpeando la puerta.",
            objetivo = "iglesia",
            al_entrar = {
                { "npcs", id = LUCIA, lugar = "iglesia", radio = 35, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 5,
                  postura = "friendly", perfiles = { { "lucia", "k93_prather_08" } }, nombres = { lucia = { "Lucia", "Ferrada" } }, femeninos = { "lucia" } },
                { "oleada", lugar = "iglesia", radio = 50, cantidad = { 20, 28 }, min = 12, max = 30 },
            },
            salidas = {
                { cuando = { "todos_muertos", LUCIA }, ir = "final_muerta" },
                { cuando = { { "grupo_listo", LUCIA }, { "o", { "sin_zombis", "iglesia", 15 }, { "horas", 1 } } }, ir = "hablar" },
            },
        },
        hablar = {
            pista = "Hablar con Lucia (clic derecho cerca).",
            ancla = "iglesia", ancla_grupo = LUCIA, radio = 20,
            al_entrar = {
                { "decir", grupo = LUCIA, rol = "lucia", texto = "Pegas? Nacho Pegas? ... Lo espere toda una tarde. Despues me quede a vivir en iglesias. Siempre con la puerta abierta. Por si alguien llegaba tarde." },
            },
            opciones = {
                { id = "convencer", texto = "Decirle que el Padre la espera y que ya no se va",
                  dice = { rol = LUCIA, texto = "Que no se va. ... Ya. Vamos. Pero me siento en la primera fila y el me mira a la cara." } },
            },
            salidas = {
                { cuando = { "todos_muertos", LUCIA }, ir = "final_muerta" },
                { cuando = { "eleccion", "convencer" }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Llevar a Lucia sana y salva a la iglesia del Padre Nacho.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = LUCIA, rol = "lucia", nombre = "Lucia", inmortal = false },
                { "banderas", grupo = LUCIA, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", LUCIA }, ir = "final_muerta" },
                { cuando = { "npc_cerca", LUCIA, "contacto", 15 }, ir = "final_cumplido" },
            },
        },
        final_cumplido = cierre("riverside", 3,
            "Lucia volvio a la iglesia de Riverside. Se sento en la primera fila y el Padre Nacho la miro a la cara, como ella pidio. Ninguno de los dos dijo nada un rato largo. Despues el le pidio perdon y ella le dijo que llegaba tarde, como siempre. Se queda.",
            { { "soltar_acompanante", grupo = LUCIA, rol = "lucia" },
              { "decir", grupo = LUCIA, rol = "lucia", texto = "Llegaste tarde, Nacho. Como siempre." },
              { "decir_contacto", retraso = 0.05, texto = "Perdoname, hija. No me voy a ir de nuevo. No otra vez." },
              { "memoria", clave = "lucia", valor = "en_riverside" },
              { "retirar_lejos", grupo = LUCIA, lugar = "contacto", radio = 30, retraso = 1.5 } }),
        final_muerta = fracaso("riverside", 3,
            "Lucia murio antes de llegar a Riverside. La encontre despues de tantos anos solo para perderla en el camino. El Padre cerro la puerta de la iglesia por primera vez. Una sola noche.",
            { { "soltar_acompanante", grupo = LUCIA, rol = "lucia" },
              { "memoria", clave = "lucia", valor = "muerta" },
              { "decir_contacto", texto = "Otra vez llegue tarde, hijo. Otra vez." } }),
    },
})

-- ===========================================================================
-- Misia Rosa, capitulo 2: La ruta 31
-- ===========================================================================
local EARL = "earl"

registrar({
    id = "cap_rosa_2",
    titulo = "La ruta 31",
    titulo_menu = "Historia de la Misia Rosa, cap. 2: la ruta 31",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "camion", desde = "contacto", salas = { "gasstore", "motelroom", "garagestorage" },
                  respaldo = { "livingroom", "kitchen" }, min = 600, max = 1500 },
                { "decir_contacto", texto = "Mijito, Earl Whitaker, el Gordo Earl, quedo varado en {lugar:camion} con el camion lleno. Treinta anos parando aca a las tres de la manana. Tiene tres hijas y le debe plata a medio Kentucky. Traemelo. Y la carga tambien, que es lo que paga su deuda." },
                { "mapa", lugar = "camion", titulo = "Mapa de la Misia Rosa: el Gordo Earl" },
                { "diario", texto = "La Misia Rosa me mando a buscar al Gordo Earl Whitaker, un camionero de sus historias, varado en {lugar:camion} con su carga." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:camion}, donde esta varado el Gordo Earl.",
            objetivo = "camion",
            salidas = { { cuando = { "cerca", "camion", 45 }, ir = "sitio" } },
        },
        sitio = {
            pista = "Sacar al Gordo Earl de {lugar:camion} vivo.",
            objetivo = "camion",
            al_entrar = {
                { "npcs", id = EARL, lugar = "camion", radio = 35, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "earl", "k93_truckstop_08" } }, nombres = { earl = { "Earl", "Whitaker" } } },
                { "oleada", lugar = "camion", radio = 50, cantidad = { 16, 24 }, min = 12, max = 30 },
                { "objeto", id = "carga", lugar = "camion", radio = 30, tipo = { "Base.Bag_DuffelBag" }, nombre = "La carga del Gordo Earl" },
                { "recompensa", lugar = "camion", radio = 30, items = { { "Base.PetrolCan" }, { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.Cigarettes" } } },
            },
            salidas = {
                { cuando = { "todos_muertos", EARL }, ir = "final_muerto" },
                { cuando = { { "grupo_listo", EARL }, { "alguien_tiene", "carga" }, { "o", { "sin_zombis", "camion", 15 }, { "horas", 1 } } }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Llevar al Gordo Earl y su carga a la bencinera de la Misia Rosa.",
            objetivo = "contacto",
            al_entrar = {
                { "decir", grupo = EARL, rol = "earl", texto = "La Rosa te mando? Esa mujer me tiene anotado hasta los suspiros. Vamos, que tengo hambre." },
                { "acompanante", grupo = EARL, rol = "earl", nombre = "El Gordo Earl", inmortal = false },
                { "banderas", grupo = EARL, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", EARL }, ir = "final_muerto" },
                { cuando = { "npc_cerca", EARL, "contacto", 15 }, ir = "entrega" },
            },
        },
        entrega = {
            pista = "Entregarle la carga a la Misia Rosa.",
            ancla = "contacto",
            al_entrar = { { "soltar_acompanante", grupo = EARL, rol = "earl" } },
            opciones = { { id = "entregar", texto = "Entregarle la carga del Gordo Earl", requiere = { "objeto", "carga" }, falta = "No llevas la carga." } },
            salidas = { { cuando = { "eleccion", "entregar" }, ir = "final_cumplido" } },
        },
        final_cumplido = cierre("rosewood", 2,
            "Traje al Gordo Earl y su carga a la bencinera. La Misia Rosa le sirvio cafe como a las tres de la manana de antes y le conto a quien le debe plata. Earl se rio tanto que se le cayo el cafe. Ella anoto que el seguia vivo.",
            { { "decir", grupo = EARL, rol = "earl", texto = "Rosa. Cafe. Como antes." },
              { "decir_contacto", retraso = 0.05, texto = "Como antes no, Earl. Ahora pagas. ... Es broma. Sientate. Mijito, gracias. Uno menos que contar en pasado." },
              { "retirar_lejos", grupo = EARL, lugar = "contacto", radio = 40, retraso = 1.5 } }),
        final_muerto = fracaso("rosewood", 2,
            "El Gordo Earl no llego a la bencinera. La Misia Rosa lo anoto en pasado, con la misma letra de siempre. Despues apago la luz un minuto.",
            { { "soltar_acompanante", grupo = EARL, rol = "earl" },
              { "decir_contacto", texto = "Ya. Earl Whitaker. Treinta anos. Lo voy a contar bien, mijito. Para que no se pierda." } }),
    },
})

-- ===========================================================================
-- Misia Rosa, capitulo 3: El estanque
-- ===========================================================================
registrar({
    id = "cap_rosa_3",
    titulo = "El estanque",
    titulo_menu = "Historia de la Misia Rosa, cap. 3: el estanque",
    requiere_alife = true, automatico = false,
    inicio = "aviso",
    etapas = {
        aviso = {
            al_entrar = {
                { "decir_contacto", texto = "Mijito, ven aca. Bajito. Se enteraron del estanque. El de abajo del taller, el que te mostre. Un camionero hablo de mas. Esta noche vienen. Muchos." },
                { "diario", texto = "Unos bandidos se enteraron del estanque escondido de la Misia Rosa. Vienen esta noche a la bencinera." },
            },
            salidas = { { ir = "preparar" } },
        },
        preparar = {
            pista = "Prepararte para defender la bencinera de la Misia Rosa. Vienen de noche (desde las 22).",
            ancla = "contacto",
            salidas = { { cuando = { { "cerca", "contacto", 40 }, { "hora_entre", 22, 5 } }, ir = "asalto" } },
        },
        asalto = {
            pista = "Defender la bencinera de la Misia Rosa.",
            objetivo = "contacto",
            al_entrar = {
                { "decir_contacto", texto = "Voy a apagar la luz. Treinta anos y nunca la apague. Que no nos vean. ... Tengo miedo, mijito. Pero apagala tu, que a mi me tiemblan las manos." },
                { "aviso", texto = "Por primera vez en treinta anos, la bencinera de Rosewood esta a oscuras.", retraso = 0.05 },
                { "lugar_cerca", id = "llegada", de = "contacto", distancia = 35 },
                { "bandidos", id = "asaltantes", lugar = "llegada", radio = 40, modo = "hunt", cantidad = { 6, 8 }, retraso = 0.15 },
                { "oleada", lugar = "contacto", radio = 60, cantidad = { 10, 16 }, min = 25, max = 45, retraso = 0.3 },
            },
            salidas = {
                { cuando = { "todos_muertos", "asaltantes" }, ir = "final_cumplido" },
                { cuando = { "horas", 6 }, ir = "final_cumplido" },
            },
        },
        final_cumplido = cierre("rosewood", 3,
            "Defendimos la bencinera y el estanque. Cuando se fue el ultimo, la Misia Rosa prendio la luz otra vez. Dijo que el estanque no es para ella: es para el dia que haya que sacar a todo el pueblo de una vez. Y que yo voy a manejar el primer camion.",
            { { "decir_contacto", texto = "Prendela, mijito. ... Ahi esta. Treinta anos y una noche. Toma, te lo ganaste. Y el primer camion que salga de aca lo manejas tu." },
              { "memoria", clave = "estanque_rosewood", valor = "defendido" } }),
    },
})
