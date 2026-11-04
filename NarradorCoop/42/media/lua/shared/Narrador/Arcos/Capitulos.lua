-- Modo historia de los misioneros (ver ROADMAP, C). El capitulo 1 de cada uno es su
-- desbloqueo (fundar el campamento, Arcos/Desbloqueos.lua). Estos salen entre sus ofertas
-- cuando el anterior ya se hizo (G.ESPECIALES en server/Narrador/NarradorGenerador.lua) y cada
-- uno deja la memoria "historia_<id>_<n>" (requisito para subir el campamento de nivel).
--   Tia Chela  2: La radio del cuartel        (3: el cientifico, LeyendaEduardo.lua)  4: La calle Main
--   Cabo       2: La puerta de atras          (3: Valentina, HijaCabo.lua)  4: Los signos de pregunta
--   Padre Nacho 2: El ring de Lexington       3: La muchacha que esperaba  4: Las campanas de Riverside
--   Misia Rosa 2: La ruta 31                  3: El tanque (con el aviso de Ray y la confesion de Earl)
--              4: La carcel de Rosewood  5: El primer camion
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
    -- Las acciones extra van antes, en el orden en que se escriben.
    for i, a in ipairs(extra or {}) do table.insert(l, i, a) end
    return { final = true, al_entrar = l }
end

local function fracaso(id, n, diario, extra)
    local l = {
        { "memoria", clave = "historia_" .. id .. "_" .. n, valor = "fallido" },
        { "diario", texto = diario },
    }
    for i, a in ipairs(extra or {}) do table.insert(l, i, a) end
    return { final = true, al_entrar = l }
end

-- Junta dos listas de acciones (en orden).
local function unir(a, b)
    local l = {}
    for _, x in ipairs(a) do l[#l + 1] = x end
    for _, x in ipairs(b) do l[#l + 1] = x end
    return l
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
            "Arregle la antena. La Chela escucho la voz entera: 'Mama, si me oyes, estoy bien. Hay un cientifico en Louisville que dice tener la cura. Voy a ayudarlo.' Lloro. Despues se enojo conmigo por mirarla.",
            { { "decir_contacto", texto = "Esta bien. Mi Eduardo esta bien. Y anda ayudando gente, el muchacho terco. Toma, mijo. Y no me mires, que se me metio algo en el ojo." },
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
            opciones = { { id = "llevar", texto = "Dile que vaya con el Cabo; te espera alla",
                dice = { rol = "gladys", texto = "Vamos. Esta vez se las doy en la cara." } } },
            salidas = {
                { cuando = { "todos_muertos", GLADYS }, ir = "final_muerta" },
                { cuando = { "eleccion", "llevar" }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Gladys Moreno va por su cuenta con el Cabo Ramiro. Vuelve con el Cabo: te espera alla.",
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
            "Lleve a Gladys Moreno con el Cabo. Le dio las gracias en la cara, diecinueve meses tarde. El Cabo tacho un signo de pregunta en su libreta y escribio 'viva'. Me nombro a una sargento que grito que cerraran: Pereira. La anoto aparte.",
            { { "soltar_acompanante", grupo = GLADYS, rol = "gladys" },
              { "decir", grupo = GLADYS, rol = "gladys", texto = "Cabo. Gracias. Por la puerta. Por todo." },
              { "decir_contacto", retraso = 0.05, texto = "Negativo a agradecer, civil. Era mi deber. ... Gracias a usted por venir. Quedan seis signos de pregunta. Uno menos." },
              { "retirar_lejos", grupo = GLADYS, lugar = "contacto", radio = 40, retraso = 1 } }),
        final_muerta = fracaso("muldraugh", 2,
            "Gladys Moreno no llego con el Cabo. El la saco de la comisaria la primera noche y yo no pude sacarla de una casa. Puso una cruz en su libreta sin decir nada.",
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
            -- Duggan aparece solo con alguien a 15 del ring, y a esta etapa se entra desde 25.
            pista = "Acercarte al atrio de la iglesia, donde Frank Duggan espera para pelear.",
            objetivo = "ring",
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
                { id = "convencer", texto = "Decirle que vaya con el Padre, que la espera y ya no se va",
                  dice = { rol = LUCIA, texto = "Que no se va. ... Ya. Vamos. Pero me siento en la primera fila y el me mira a la cara." } },
            },
            salidas = {
                { cuando = { "todos_muertos", LUCIA }, ir = "final_muerta" },
                { cuando = { "eleccion", "convencer" }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Lucia va por su cuenta a la iglesia del Padre Nacho. Vuelve con el Padre: te espera alla.",
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
                { "decir_contacto", texto = "Mijito, Earl Whitaker, el Gordo Earl, quedo varado en {lugar:camion} con el camion lleno. Treinta anos parando aca a las tres de la manana. Tiene tres hijas y le debe dinero a medio Kentucky. Traemelo. Y la carga tambien, que es lo que paga su deuda." },
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
            pista = "El Gordo Earl va por su cuenta a la gasolinera de la Misia Rosa. Llevale la carga: te espera alla.",
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
            "Traje al Gordo Earl y su carga a la gasolinera. La Misia Rosa le sirvio cafe como a las tres de la manana de antes y le conto a quien le debe dinero. Earl se rio tanto que se le cayo el cafe. Ella anoto que el seguia vivo.",
            { { "decir", grupo = EARL, rol = "earl", texto = "Rosa. Cafe. Como antes." },
              { "decir_contacto", retraso = 0.05, texto = "Como antes no, Earl. Ahora pagas. ... Es broma. Sientate. Mijito, gracias. Uno menos que contar en pasado." },
              { "retirar_lejos", grupo = EARL, lugar = "contacto", radio = 40, retraso = 1.5 } }),
        final_muerto = fracaso("rosewood", 2,
            "El Gordo Earl no llego a la gasolinera. La Misia Rosa lo anoto en pasado, con la misma letra de siempre. Despues apago la luz un minuto.",
            { { "soltar_acompanante", grupo = EARL, rol = "earl" },
              { "decir_contacto", texto = "Ya. Earl Whitaker. Treinta anos. Lo voy a contar bien, mijito. Para que no se pierda." } }),
    },
})

-- ===========================================================================
-- Misia Rosa, capitulo 3: El tanque
-- Earl le solto al Tecolote, en broma y por dos frascos de insulina, donde guarda Rosa el tanque
-- ("bajo el taller, donde Hector guardaba el whisky"), y despues aviso por el 19: "si bajan por
-- la 31 sin focos, no es casualidad". Esta noche bajan.
-- Sin focos: si escondiste a Ray Doyle (el desertor, desertor = protegido), Ray ("Gerald" en el
-- 19) los ve desde el cerro y avisa antes: de donde vienen, cuantos son y a que hora. Con eso se
-- los puede esperar en la gasolinera (llegan menos: Ray espanta a dos con un tiro al techo) o
-- salirles al paso en la curva de la 31. Si no, el capitulo sigue como antes.
-- Despues del asalto, si Earl llego vivo en el cap. 2, le confiesa a Rosa lo del tanque y ella lo
-- perdona o lo manda a dormir al camion (earl_tanque, lo lee el cap. 5). Si nadie vuelve a la
-- gasolinera en 48 horas, Earl se lo calla.
-- Partidas a medio camino: preparar, asalto y los dos finales siguen con el mismo nombre; una
-- partida que ya estaba en preparar o en asalto sigue sin el aviso de Ray.
-- ===========================================================================
local RAY_AYUDADO = { "memoria", "desertor", "protegido" }
local RAY_MECANICO = { "memoria", "ray_mecanico", "rosewood" }
local JUNIOR_MURIO = { "memoria", "cura_rosewood", "murio" }
local EARL_VIVO = { "memoria", "historia_rosewood_2", true }
local CON_RAY = { "var", "aviso_ray", true }

-- Despues de la confesion de Earl, al final que corresponde a como salio la noche.
local SEGUN_LA_NOCHE = {
    { cuando = { "var", "resultado", "defendido" }, ir = "final_cumplido" },
    { ir = "final_saqueado" },
}

-- Lo que queda anotado en los dos finales: el aviso de Ray y como se defendio.
local function finalTanque(estanque)
    return {
        { "memoria", clave = "estanque_rosewood", valor = estanque },
        { "memoria", clave = "tanque_ray", valor = "aviso", si = CON_RAY },
        { "memoria", clave = "tanque_ray", valor = "emboscada", si = { "var", "emboscada", true } },
        { "retirar_lejos", grupo = EARL, lugar = "contacto", radio = 40, retraso = 1.5, si = { "grupo_listo", EARL } },
    }
end

registrar({
    id = "cap_rosa_3",
    titulo = "El tanque",
    titulo_menu = "Historia de la Misia Rosa, cap. 3: el tanque",
    requiere_alife = true, automatico = false,
    inicio = "aviso",
    etapas = {
        aviso = {
            al_entrar = {
                { "decir_contacto", texto = "Mijito, ven aca. Bajito. Se enteraron del tanque. El de abajo del taller, el que te mostre. Un camionero hablo de mas. Esta noche vienen. Muchos." },
                { "diario", texto = "Unos bandidos se enteraron del tanque escondido de la Misia Rosa. Vienen esta noche a la gasolinera." },
                -- Sin focos: el aviso de Ray por el 19 (o en persona, si ya es el mecanico de Rosewood).
                { "variable", nombre = "aviso_ray", valor = true, si = RAY_AYUDADO },
                { "lugar_cerca", id = "curva", de = "contacto", distancia = 70, si = RAY_AYUDADO },
                { "aviso", retraso = 0.05, si = { RAY_AYUDADO, { "no", RAY_MECANICO }, { "no", JUNIOR_MURIO } },
                  texto = "La radio de Junior chicharrea en la bodega: 'Breaker diecinueve. Aqui Gerald, para el Bencinita. Copie lo del Gordo. Los vi desde el cerro: un Peterbilt rojo y una camioneta, sin focos, cargando palas en el cruce de la 31. Seis, puede que siete. Escopetas. Esperan noche cerrada: bajan a las dos. Dejan los camiones en la curva antes de la gasolinera y siguen a pie. Cambio.'" },
                { "aviso", retraso = 0.05, si = { RAY_AYUDADO, { "no", RAY_MECANICO }, JUNIOR_MURIO },
                  texto = "La radio de la gasolinera chicharrea: 'Breaker diecinueve. Aqui Gerald, para la senora de la luz prendida. Copie lo del Gordo. Los vi desde el cerro: un Peterbilt rojo y una camioneta, sin focos, cargando palas en el cruce de la 31. Seis, puede que siete. Escopetas. Esperan noche cerrada: bajan a las dos. Dejan los camiones en la curva antes de la gasolinera y siguen a pie. Cambio.'" },
                { "aviso", retraso = 0.07, si = { RAY_AYUDADO, { "no", RAY_MECANICO } },
                  texto = "Conoces esa voz seca, de botas. Es Ray Doyle, el soldado que escondiste en tu refugio. 'Y digale a quien me escondio que estoy en el cerro. Le devuelvo el favor. Fuera.'" },
                { "aviso", retraso = 0.05, si = { RAY_AYUDADO, RAY_MECANICO },
                  texto = "Ray Doyle, el mecanico del campamento, subio al cerro con su radio apenas oyo lo del Gordo. Vuelve con las botas embarradas: 'Senora. Los vi. Un Peterbilt rojo y una camioneta, sin focos, cargando palas en el cruce de la 31. Seis, puede que siete. Escopetas. Bajan a las dos. Dejan los camiones en la curva y siguen a pie. Yo vuelvo al cerro.'" },
                { "decir_contacto", retraso = 0.1, si = { RAY_AYUDADO, { "no", RAY_MECANICO } },
                  texto = "Gerald? Quien sera ese Gerald, por Dios? ... No lo conozco y ya lo quiero, fijate. Escuchaste, mijito? A las dos, y por la curva. Mi papa decia que el que avisa no es traidor." },
                { "decir_contacto", retraso = 0.1, si = { RAY_AYUDADO, RAY_MECANICO },
                  texto = "Ese es mi mecanico, mijito. Me arreglo la bomba del agua en una tarde y ahora esto. A las dos, y por la curva. Ahora si que sabemos." },
                { "mapa", lugar = "curva", titulo = "Lo que vio Gerald: la curva de la 31", si = RAY_AYUDADO },
                { "diario", retraso = 0.1, si = RAY_AYUDADO,
                  texto = "Ray Doyle, el soldado que escondi, los vio desde el cerro: seis o siete, sin focos, bajan a las dos y dejan los camiones en la curva de la 31. Los puedo esperar en la gasolinera o salirles al paso en la curva." },
            },
            salidas = {
                { cuando = CON_RAY, ir = "preparar_ray" },
                { ir = "preparar" },
            },
        },
        preparar = {
            pista = "Prepararte para defender la gasolinera de la Misia Rosa. Vienen de noche (desde las 22).",
            ancla = "contacto",
            salidas = { { cuando = { { "cerca", "contacto", 40 }, { "hora_entre", 22, 5 } }, ir = "asalto" } },
        },
        -- Con el aviso de Ray: se sabe la hora y el lugar.
        preparar_ray = {
            pista = "Ray aviso: bajan a las dos de la manana y dejan los camiones en la curva de la 31. Esperarlos en la gasolinera de la Misia Rosa o salirles al paso en la curva (desde la una).",
            objetivo = "curva",
            salidas = {
                { cuando = { { "cerca", "curva", 25 }, { "hora_entre", 1, 4 } }, ir = "emboscada" },
                { cuando = { { "cerca", "contacto", 40 }, { "hora_entre", 2, 5 } }, ir = "asalto" },
            },
        },
        asalto = {
            pista = "Defender la gasolinera de la Misia Rosa.",
            objetivo = "contacto",
            al_entrar = {
                { "decir_contacto", texto = "Voy a apagar la luz. Treinta anos y nunca la apague. Que no nos vean. ... Tengo miedo, mijito. Pero apagala tu, que a mi me tiemblan las manos." },
                { "aviso", texto = "Por primera vez en treinta anos, la gasolinera de Rosewood esta a oscuras.", retraso = 0.05 },
                { "lugar_cerca", id = "llegada", de = "contacto", distancia = 35 },
                { "bandidos", id = "asaltantes", lugar = "llegada", radio = 40, modo = "hunt", cantidad = { 6, 8 }, retraso = 0.15,
                  si = { "no", CON_RAY } },
                -- Con el aviso de Ray llegan menos: dos se van con su tiro al techo.
                { "bandidos", id = "asaltantes", lugar = "llegada", radio = 40, modo = "hunt", cantidad = { 4, 5 }, retraso = 0.15,
                  si = CON_RAY },
                { "aviso", retraso = 0.2, si = CON_RAY,
                  texto = "Un tiro seco desde el cerro, contra el techo del galpon de la curva. Dos de los que bajaban se dan vuelta y corren por la 31. Los otros llegan a pie, a oscuras, tropezando. Como dijo Ray." },
                { "oleada", lugar = "contacto", radio = 60, cantidad = { 10, 16 }, min = 25, max = 45, retraso = 0.3 },
            },
            salidas = {
                { cuando = { "todos_muertos", "asaltantes" }, ir = "defendido" },
                -- Aguantar la noche cuenta si sigues en la gasolinera; si te fuiste, se lo llevaron.
                { cuando = { { "horas", 6 }, { "cerca", "contacto", 60 } }, ir = "defendido" },
                { cuando = { "horas", 6 }, ir = "saqueo" },
            },
        },
        -- Salirles al paso en la curva, antes de que lleguen a la gasolinera.
        emboscada = {
            pista = "Emboscar en la curva de la 31 a los que vienen por el tanque, antes de que lleguen a la gasolinera.",
            objetivo = "curva",
            al_entrar = {
                { "variable", nombre = "emboscada", valor = true },
                { "aviso", texto = "Un Peterbilt rojo y una camioneta bajan por la 31 con los focos apagados y paran en la curva, como dijo Ray. Bajan hombres con palas." },
                { "bandidos", id = "asaltantes", lugar = "curva", radio = 35, modo = "hunt", cantidad = { 4, 5 }, retraso = 0.05 },
                { "aviso", retraso = 0.1,
                  texto = "Un tiro seco desde el cerro, contra el techo del galpon de la curva. Dos de los que bajaban corren por la 31 y el Peterbilt da la vuelta sin prender los focos. Atras, la luz de la gasolinera se apaga: por primera vez en treinta anos." },
                { "oleada", lugar = "curva", radio = 50, cantidad = { 6, 10 }, min = 25, max = 45, retraso = 0.3 },
            },
            salidas = {
                { cuando = { "todos_muertos", "asaltantes" }, ir = "defendido" },
                { cuando = { { "horas", 6 }, { "o", { "cerca", "contacto", 60 }, { "cerca", "curva", 60 } } }, ir = "defendido" },
                { cuando = { "horas", 6 }, ir = "saqueo" },
            },
        },
        defendido = {
            al_entrar = { { "variable", nombre = "resultado", valor = "defendido" } },
            salidas = { { cuando = EARL_VIVO, ir = "amanecer" }, { ir = "final_cumplido" } },
        },
        saqueo = {
            al_entrar = { { "variable", nombre = "resultado", valor = "saqueado" } },
            salidas = { { cuando = EARL_VIVO, ir = "amanecer" }, { ir = "final_saqueado" } },
        },
        -- Earl llego vivo en el cap. 2: le debe una confesion a Rosa.
        amanecer = {
            pista = "El Gordo Earl quiere hablar con la Misia Rosa. Acercate al mostrador de la gasolinera.",
            objetivo = "contacto",
            al_entrar = {
                { "lugar_cerca", id = "mostrador", de = "contacto", distancia = 3 },
                { "npcs", id = EARL, lugar = "mostrador", radio = 12, no_mas_cerca = 2, modo = "guard", quietos = true, correa = 3,
                  inmortales = true, postura = "friendly", perfiles = { { "earl", "k93_truckstop_08" } }, nombres = { earl = { "Earl", "Whitaker" } } },
            },
            salidas = {
                { cuando = { { "grupo_listo", EARL }, { "cerca", "contacto", 20 } }, ir = "confesion" },
                { cuando = { "horas", 48 }, ir = "earl_callado" },
            },
        },
        confesion = {
            pista = "El Gordo Earl le confiesa a la Misia Rosa de donde salio el dato del tanque. Decide si te metes (clic derecho cerca).",
            ancla = "contacto", ancla_grupo = EARL, radio = 15,
            al_entrar = {
                { "decir", grupo = EARL, rol = "earl", texto = "Rosita. No, no te sientes, que sentada pegas mas facil. ... El camionero que hablo de mas soy yo." },
                { "decir", grupo = EARL, rol = "earl", retraso = 0.03, texto = "El Tecolote llego a la bascula con dos frascos de insulina y me pregunto por lo que guardas. Yo me rei y le dije: bajo el taller, donde Hector guardaba el whisky. No sabia, Rosita. Adivine. Y acerte." },
                { "decir", grupo = EARL, rol = "earl", retraso = 0.06, texto = "Debo plata a medio Kentucky, pero nunca le debi una mentira a nadie. Hasta ahora. Por eso avise por el 19: la 31 sin focos." },
                { "decir_contacto", retraso = 0.09, texto = "Insulina. ... Insulina, Earl? Y yo echandote tres cucharadas de azucar en cada cafe, como una tonta. Desde cuando?" },
                { "decir", grupo = EARL, rol = "earl", retraso = 0.11, texto = "Desde el 91. Me comi dos Moon Pies para celebrar." },
            },
            opciones = {
                { id = "interceder", texto = "Decirle a la Misia Rosa que Earl aviso por el 19 y que sin ese aviso no lo contaban" },
                { id = "callar", texto = "No meterte: es cosa de ellos dos" },
                { id = "acusar", texto = "Decirle a la Misia Rosa que eso no se perdona" },
            },
            salidas = {
                { cuando = { "eleccion", "interceder" }, ir = "earl_perdonado" },
                { cuando = { "eleccion", "acusar" }, ir = "earl_echado" },
                -- Si nadie se mete, Rosa decide sola segun como salio la noche.
                { cuando = { { "eleccion", "callar" }, { "var", "resultado", "defendido" } }, ir = "earl_perdonado" },
                { cuando = { "eleccion", "callar" }, ir = "earl_echado" },
            },
        },
        earl_perdonado = {
            al_entrar = {
                { "variable", nombre = "earl", valor = "perdonado" },
                { "memoria", clave = "earl_tanque", valor = "perdonado" },
                { "decir_contacto", texto = { por_var = "resultado", textos = {
                    defendido = "Treinta anos tarde para todo, Gordo. Hasta para decir la verdad llegas tarde. Pero llegas. ... Lleno o normal?",
                    otro = "Se llevaron la bencina de treinta anos por un chiste tuyo, Gordo. ... Era bencina. Tu no. Lleno o normal?" } } },
                { "decir", grupo = EARL, rol = "earl", retraso = 0.03, texto = "Lleno." },
                { "decir_contacto", retraso = 0.05, texto = "Sin azucar, entonces, que ahora se. Pasa. Por detras del mostrador. Y tu no me mires asi, mijito, que se me corre el rimel que no tengo." },
            },
            salidas = SEGUN_LA_NOCHE,
        },
        earl_echado = {
            al_entrar = {
                { "variable", nombre = "earl", valor = "echado" },
                { "memoria", clave = "earl_tanque", valor = "echado" },
                { "decir_contacto", texto = "Anda a dormir a tu camion, Gordo. Esta noche no te caliento cafe. Y no me hables por el 19 hasta que yo te hable." },
                { "decir", grupo = EARL, rol = "earl", retraso = 0.03, texto = "Copiado, Rosita." },
                { "decir_contacto", retraso = 0.05, texto = "La luz la dejo prendida igual. No vaya a ser que te pierdas, que eres capaz." },
            },
            salidas = SEGUN_LA_NOCHE,
        },
        earl_callado = {
            al_entrar = {
                { "variable", nombre = "earl", valor = "callado" },
                { "memoria", clave = "earl_tanque", valor = "callado" },
                { "aviso", texto = "El Gordo Earl anduvo toda la manana dando vueltas alrededor del mostrador. No dijo nada. Se fue a dormir a su camion." },
            },
            salidas = SEGUN_LA_NOCHE,
        },
        final_cumplido = cierre("rosewood", 3, { por_var = "earl", textos = {
            perdonado = "Defendimos la gasolinera y el tanque. Al amanecer el Gordo Earl le confeso a la Misia Rosa que el dato lo dio el, en broma, por insulina. Ella le pregunto lleno o normal. El dijo lleno. Ahora le sirve el cafe sin azucar. Y el primer camion que salga de aca lo manejo yo.",
            echado = "Defendimos la gasolinera y el tanque. Al amanecer el Gordo Earl confeso que el dato lo dio el, por insulina. La Misia Rosa lo mando a dormir a su camion sin cafe, pero dejo la luz prendida. Dice que el primer camion que salga de aca lo manejo yo.",
            callado = "Defendimos la gasolinera y el tanque. El Gordo Earl anduvo toda la manana rondando el mostrador sin decir nada. La Misia Rosa prendio la luz otra vez y dijo que el primer camion que salga de aca lo manejo yo.",
            otro = "Defendimos la gasolinera y el tanque. Cuando se fue el ultimo, la Misia Rosa prendio la luz otra vez. Dijo que el tanque no es para ella: es para el dia que haya que sacar a todo el pueblo de una vez. Y que yo voy a manejar el primer camion." } },
            unir({ { "decir_contacto", texto = "Prendela, mijito. ... Ahi esta. Treinta anos y una noche. Toma, te lo ganaste. Y el primer camion que salga de aca lo manejas tu." },
                   { "diario", si = CON_RAY, texto = "Ray Doyle aviso desde el cerro y espanto a dos con un tiro al techo. No le apunto a nadie. Le debo una, y el dice que me la estaba pagando." } },
                finalTanque("defendido"))),
        final_saqueado = fracaso("rosewood", 3, { por_var = "earl", textos = {
            perdonado = "No estuve en la gasolinera cuando llegaron los bandidos. Se llevaron la gasolina del tanque. Al amanecer el Gordo Earl confeso que el dato lo dio el. La Misia Rosa le pregunto lleno o normal igual, y le sirvio el cafe sin azucar.",
            echado = "No estuve en la gasolinera cuando llegaron los bandidos. Se llevaron la gasolina del tanque. El Gordo Earl confeso que el dato lo dio el y la Misia Rosa lo mando a dormir a su camion. La luz la dejo prendida.",
            callado = "No estuve en la gasolinera cuando llegaron los bandidos. Se llevaron la gasolina del tanque. El Gordo Earl no le dijo nada a nadie. La Misia Rosa prendio la luz y se quedo mirando el taller vacio.",
            otro = "No estuve en la gasolinera cuando llegaron los bandidos. Se llevaron la gasolina del tanque. La Misia Rosa no me reclamo nada: prendio la luz y se quedo mirando el taller vacio." } },
            unir({ { "decir_contacto", texto = "Se la llevaron toda, mijito. Treinta anos guardandola. ... No importa. Estamos vivos. Eso no se lo llevan." } },
                finalTanque("saqueado"))),
    },
})

-- ===========================================================================
-- Misia Rosa, capitulo 4: La carcel de Rosewood
-- La carcel es el lugar mas dificil de limpiar del condado: por eso guarda el mejor botin.
-- La Misia Rosa sabe (por un guardia que paraba en la gasolinera) que la armeria del penal
-- quedo cerrada con todo adentro. Hay que entrar, aguantar dos oleadas grandes y dejar el
-- patio limpio: el premio es el arsenal legendario (L.ARMAS_FUEGO, clase "fuego") y mucha
-- municion. El lugar se busca alrededor del punto conocido de la carcel (Mundo.CARCEL_ROSEWOOD)
-- con permitir_carcel, porque toda otra busqueda de lugar la excluye.
-- ===========================================================================
registrar({
    id = "cap_rosa_4",
    titulo = "La carcel de Rosewood",
    titulo_menu = "Historia de la Misia Rosa, cap. 4: la carcel de Rosewood",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "carcel", pueblo = "Rosewood", nombre = "la carcel",
                  cerca_de = { 7515, 11810, 220 }, solo_cerca = true, permitir_carcel = true,
                  salas = { "prison*", "cell*" }, respaldo = { "office", "classroom", "kitchen", "security*" } },
                { "decir_contacto", texto = "Mijito, sientate. Hank Morrow era guardia del penal. Paraba aca todas las noches, cafe sin azucar. La ultima vez me dijo que cerraron la armeria con todo adentro y que nadie alcanzo a sacar nada. Nadie ha limpiado esa carcel. Nadie. Si alguien puede, eres tu. Y lo que haya adentro, es tuyo." },
                { "mapa", lugar = "carcel", titulo = "Mapa de la Misia Rosa: la carcel de Rosewood" },
                { "diario", texto = "La Misia Rosa me hablo de la armeria de {lugar:carcel}: Hank Morrow, un guardia, le dijo que la cerraron con todo adentro. Nadie ha limpiado esa carcel." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:carcel}. Lleva todo lo que tengas: es el lugar mas dificil del condado.",
            objetivo = "carcel",
            salidas = {
                { cuando = { "cerca", "carcel", 90 }, ir = "muro" },
                { cuando = { "horas", 96 }, ir = "final_abandono" },
            },
        },
        -- 1. El patio: la primera oleada sale de los pabellones al escuchar el ruido.
        muro = {
            pista = "Abrirte paso en el patio de {lugar:carcel}: van {bajas:carcel} de {meta_patio}.",
            objetivo = "carcel",
            al_entrar = {
                { "variable", nombre = "meta_patio", valor = 9999 },
                { "aviso", texto = "Las sirenas de {lugar:carcel} siguen sonando despues de tanto tiempo. Del patio sale una marea de presos y guardias muertos." },
                { "oleada", lugar = "carcel", radio = 120, cantidad = 45, por_jugador = 15, fija = true, caminantes = true,
                  planta_baja = true, min = 15, max = 45, meta = "meta_patio", meta_frac = 0.75 },
                { "oleada", lugar = "carcel", radio = 120, cantidad = 20, por_jugador = 8, fija = true,
                  planta_baja = true, min = 20, max = 50, retraso = 0.3 },
                { "ruido", lugar = "carcel", radio = 120, volumen = 100, veces = 3, retraso = 0.05 },
            },
            salidas = {
                { cuando = { "bajas_en", "carcel", "var:meta_patio", 140 }, ir = "pabellones" },
            },
        },
        -- 2. Los pabellones: la segunda oleada, mas grande, viene de adentro.
        pabellones = {
            pista = "Limpiar los pabellones de {lugar:carcel}: van {bajas:carcel} de {meta_pabellones}.",
            objetivo = "carcel",
            al_entrar = {
                { "variable", nombre = "meta_pabellones", valor = 9999 },
                { "aviso", texto = "Del fondo de los pabellones se oye un golpeteo de rejas. Vienen mas." },
                { "oleada", lugar = "carcel", radio = 120, cantidad = 55, por_jugador = 20, fija = true,
                  planta_baja = true, min = 12, max = 40, meta = "meta_pabellones", meta_frac = 0.8 },
                { "oleada", lugar = "carcel", radio = 120, cantidad = 15, por_jugador = 5, fija = true, correr = true,
                  planta_baja = true, min = 25, max = 50, retraso = 0.4 },
            },
            salidas = {
                { cuando = { "bajas_en", "carcel", "var:meta_pabellones", 140 }, ir = "limpieza" },
            },
        },
        -- 3. Terminar de limpiar: que no quede ninguno cerca de la armeria.
        limpieza = {
            pista = "Terminar de limpiar {lugar:carcel}: que no quede ningun muerto cerca de la armeria.",
            objetivo = "carcel",
            salidas = {
                { cuando = { "o", { "sin_zombis", "carcel", 25 }, { { "horas", 2 }, { "sin_zombis", "carcel", 12 } } }, ir = "armeria" },
            },
        },
        -- 4. La armeria: el arsenal legendario y mucha municion.
        armeria = {
            pista = "Recoger el arsenal de la armeria de {lugar:carcel}.",
            objetivo = "carcel",
            al_entrar = {
                { "aviso", texto = "La armeria de {lugar:carcel} sigue cerrada, tal como dijo Hank Morrow. Adentro esta todo." },
                { "legendario", lugar = "carcel", radio = 8, clase = "fuego" },
                { "recompensa", lugar = "carcel", radio = 8,
                  items = { { "Base.556Box", "Base.556Bullets" }, { "Base.556Box", "Base.556Bullets" },
                            { "Base.308Box", "Base.308Bullets" }, { "Base.308Box", "Base.308Bullets" },
                            { "Base.ShotgunShellsBox", "Base.ShotgunShells" }, { "Base.ShotgunShellsBox", "Base.ShotgunShells" },
                            { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.Bullets9mmBox", "Base.Bullets9mm" },
                            { "Base.Bullets45Box", "Base.Bullets45" }, { "Base.Bullets44Box", "Base.Bullets44" },
                            { "Base.Vest_BulletPolice", "Base.Vest_BulletArmy" }, { "Base.Hat_RiotHelmet", "Base.Hat_CrashHelmet_Police" } } },
                { "diario", texto = "Limpiamos {lugar:carcel}. Nadie lo habia hecho. La armeria estaba cerrada con todo adentro, como dijo Hank Morrow: fusiles, escopetas, pistolas y municion para un invierno entero." },
            },
            salidas = { { cuando = { "horas", 0.1 }, ir = "volver" } },
        },
        volver = {
            pista = "Volver a la gasolinera y contarle a la Misia Rosa.",
            ancla = "contacto",
            opciones = { { id = "contar", texto = "Contarle que limpiaste la carcel" } },
            salidas = { { cuando = { "eleccion", "contar" }, ir = "final_cumplido" } },
        },
        final_cumplido = cierre("rosewood", 4,
            "Le conte a la Misia Rosa que limpiamos la carcel de Rosewood. Saco su cuaderno y anoto a Hank Morrow en pasado, con letra bonita. Despues anoto mi nombre al lado, en presente.",
            { { "decir_contacto", texto = "La carcel. Limpia. ... Hank decia que ni el ejercito se atrevia. Toma, mijito, esto tambien. Y cuidame esas armas, que con eso se saca a un pueblo entero." },
              { "memoria", clave = "carcel_rosewood", valor = "limpiada" } }),
        final_abandono = fracaso("rosewood", 4,
            "Nunca fui a la carcel de Rosewood. La Misia Rosa no me lo reclamo. Solo dijo que la armeria iba a seguir ahi, esperando a alguien mas valiente.",
            { { "decir_contacto", texto = "No importa, mijito. Esa carcel no se va a ninguna parte. Los muertos tampoco." } }),
    },
})

-- ===========================================================================
-- Cabo Ramiro, capitulo 4: Los signos de pregunta
-- Despues de Gladys (cap. 2) y Valentina (cap. 3), el Cabo manda a revisar dos signos de
-- pregunta de su libreta: Amos Pruitt (se transformo: queda su reloj y una nota) y Celia
-- Ortiz con su hijo Joaquin (vivos y rodeados). Los Ortiz que llegan se quedan de guardias en
-- la comisaria (salvado_campamento, NarradorCampamentos.lua).
-- ===========================================================================
local ORTIZ = "ortiz"
local PERFIL_CELIA, PERFIL_JOAQUIN = "k93_ortiz_family_05", "k93_ortiz_family_04"

-- Al llegar a la comisaria: los Ortiz vivos se quedan de guardias y el grupo se retira.
local function ortizSeQuedan()
    return {
        { "soltar_acompanante", grupo = ORTIZ, rol = "celia" },
        { "soltar_acompanante", grupo = ORTIZ, rol = "joaquin" },
        { "decir", grupo = ORTIZ, rol = "celia", texto = "Cabo. Nos saco por la puerta de atras y nunca le dijimos nada. Gracias." },
        { "decir", grupo = ORTIZ, rol = "joaquin", retraso = 0.03, texto = "Le dije a mi mama que usted iba a mandar a alguien. Se lo dije." },
        { "salvado_campamento", contacto = "muldraugh", nombre = "Celia", apellido = "Ortiz", perfil = PERFIL_CELIA,
          grupo = ORTIZ, rol = "celia", si = { "vivo", ORTIZ, "celia" } },
        { "salvado_campamento", contacto = "muldraugh", nombre = "Joaquin", apellido = "Ortiz", perfil = PERFIL_JOAQUIN,
          grupo = ORTIZ, rol = "joaquin", si = { "vivo", ORTIZ, "joaquin" } },
        { "retirar_lejos", grupo = ORTIZ, lugar = "contacto", radio = 40, retraso = 1 },
    }
end

registrar({
    id = "cap_cabo_4",
    titulo = "Los signos de pregunta",
    titulo_menu = "Historia del Cabo Ramiro, cap. 4: los signos de pregunta",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "casa_amos", desde = "contacto", salas = { "livingroom", "kitchen", "bedroom" }, min = 150, max = 700 },
                { "lugar", id = "casa_ortiz", desde = "casa_amos", salas = { "bedroom", "livingroom", "kitchen" }, min = 400, max = 1100 },
                { "decir_contacto", texto = "Civil. Quedan seis signos de pregunta en mi libreta. Dos tienen direccion: Amos Pruitt, en {lugar:casa_amos}, y Celia Ortiz con su hijo Joaquin, en {lugar:casa_ortiz}. Vaya, mire y vuelva con un dato. Una cruz o un 'vivo'. No me traiga un 'no se'." },
                { "decir_residente", rol = "hija", retraso = 0.05, si = { "memoria", "hija_cabo", "salvada" },
                  texto = "Lleva tres noches mirando esa pagina. Traelos, por favor. O traele algo para tachar, que tambien le sirve." },
                { "decir_contacto", retraso = 0.05, si = { "memoria", "hija_cabo", "muerta" },
                  texto = "Desde lo de Valentina no he tachado a nadie. No me deje la pagina en blanco, civil." },
                { "mapa", lugar = "casa_amos", titulo = "Mapa del Cabo Ramiro: Amos Pruitt" },
                { "mapa", lugar = "casa_ortiz", titulo = "Mapa del Cabo Ramiro: los Ortiz" },
                { "diario", texto = "El Cabo me paso dos nombres de su libreta: Amos Pruitt, en {lugar:casa_amos}, y Celia Ortiz con su hijo, en {lugar:casa_ortiz}. Quiere una cruz o un 'vivo'. No un 'no se'." },
            },
            salidas = { { ir = "amos" } },
        },
        amos = {
            pista = "Ir a {lugar:casa_amos} y averiguar que paso con Amos Pruitt.",
            objetivo = "casa_amos",
            salidas = { { cuando = { "cerca", "casa_amos", 40 }, ir = "amos_casa" } },
        },
        amos_casa = {
            pista = "Buscar a Amos Pruitt en {lugar:casa_amos}.",
            objetivo = "casa_amos",
            al_entrar = {
                { "oleada", lugar = "casa_amos", radio = 45, cantidad = { 8, 12 }, min = 12, max = 30 },
                { "zombi_en", lugar = "casa_amos" },
                { "nota", lugar = "casa_amos", titulo = "Nota en la mesa de la cocina",
                  texto = "Cabo: me mordieron el martes, sacando agua del pozo. No abra la puerta. Le dejo mi reloj para su censo, asi sabe que fui yo y no otro. Gracias por los meses de mas. A. P." },
                { "objeto", id = "reloj", lugar = "casa_amos", tipo = { "Base.Pocketwatch", "Base.WristWatch_Left_ClassicBrown" },
                  nombre = "El reloj de Amos Pruitt" },
            },
            salidas = { { cuando = { "alguien_tiene", "reloj" }, ir = "ortiz" } },
        },
        ortiz = {
            pista = "Ir a {lugar:casa_ortiz}, donde se esconden Celia Ortiz y su hijo Joaquin.",
            objetivo = "casa_ortiz",
            al_entrar = {
                { "diario", texto = "Amos Pruitt se transformo en su cocina. Dejo una nota para el Cabo y su reloj, para que el censo no se equivoque. Me lo llevo." },
            },
            salidas = { { cuando = { "cerca", "casa_ortiz", 45 }, ir = "sitio" } },
        },
        sitio = {
            pista = "Mantener vivos a Celia y Joaquin Ortiz en {lugar:casa_ortiz}: van {bajas:casa_ortiz} de {meta_ortiz}.",
            objetivo = "casa_ortiz",
            al_entrar = {
                { "variable", nombre = "meta_ortiz", valor = 9999 },
                { "npcs", id = ORTIZ, lugar = "casa_ortiz", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "celia", PERFIL_CELIA }, { "joaquin", PERFIL_JOAQUIN } },
                  nombres = { celia = { "Celia", "Ortiz" }, joaquin = { "Joaquin", "Ortiz" } }, femeninos = { "celia" } },
                { "oleada", lugar = "casa_ortiz", radio = 50, cantidad = 20, por_jugador = 8, fija = true, caminantes = true,
                  min = 14, max = 32, meta = "meta_ortiz", meta_frac = 0.8 },
                { "oleada", lugar = "casa_ortiz", radio = 50, cantidad = { 8, 12 }, min = 18, max = 35, retraso = 0.4 },
            },
            salidas = {
                { cuando = { "todos_muertos", ORTIZ }, ir = "final_cruces" },
                { cuando = { { "grupo_listo", ORTIZ }, { "o", { "bajas_en", "casa_ortiz", "var:meta_ortiz", 60 },
                    { { "horas", 1 }, { "sin_zombis", "casa_ortiz", 15 } } } }, ir = "hablar" },
            },
        },
        hablar = {
            pista = "Hablar con Celia Ortiz (clic derecho cerca).",
            ancla = "casa_ortiz", ancla_grupo = ORTIZ, radio = 20,
            al_entrar = {
                { "decir", grupo = ORTIZ, rol = "celia", texto = "Te manda el Cabo? Ese hombre nos saco de la comisaria con una linterna y una lista. Pense que ya nos habia tachado." },
                { "decir", grupo = ORTIZ, rol = "joaquin", retraso = 0.03, texto = "Te dije que iba a mandar a alguien, mama. Te dije." },
            },
            opciones = { { id = "llevar", texto = "Decirles que vayan con el Cabo; te espera en la comisaria",
                dice = { rol = "celia", texto = "Vamos, Joaquin. Y peinate, que es el Cabo." } } },
            salidas = {
                { cuando = { "todos_muertos", ORTIZ }, ir = "final_cruces" },
                { cuando = { "eleccion", "llevar" }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Celia y Joaquin Ortiz van por su cuenta a la comisaria. Vuelve con el Cabo Ramiro: te esperan alla.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = ORTIZ, rol = "celia", nombre = "Celia Ortiz", inmortal = false },
                { "acompanante", grupo = ORTIZ, rol = "joaquin", nombre = "Joaquin Ortiz", inmortal = false },
                { "banderas", grupo = ORTIZ, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", ORTIZ }, ir = "final_cruces" },
                { cuando = { "npc_cerca", ORTIZ, "contacto", 15 }, ir = "entrega" },
            },
        },
        entrega = {
            pista = "Darle al Cabo Ramiro el reloj de Amos Pruitt.",
            ancla = "contacto",
            al_entrar = {
                -- Cuantos Ortiz llegaron (cambia lo que escribe el Cabo).
                { "variable", nombre = "llegaron", valor = "dos" },
                { "variable", nombre = "llegaron", valor = "uno", si = { "o", { "muerto", ORTIZ, "celia" }, { "muerto", ORTIZ, "joaquin" } } },
            },
            opciones = {
                { id = "reloj", texto = "Darle al Cabo el reloj de Amos Pruitt", requiere = { "objeto", "reloj" }, falta = "No llevas el reloj de Amos." },
                { id = "contar", texto = "Contarle lo de Amos (el reloj se perdio)" },
            },
            salidas = {
                { cuando = { "eleccion", "reloj" }, ir = "final_cumplido" },
                { cuando = { "eleccion", "contar" }, ir = "final_sin_reloj" },
            },
        },
        final_cumplido = cierre("muldraugh", 4, { por_var = "llegaron", textos = {
            dos = "Le di al Cabo el reloj de Amos Pruitt y le lleve a los Ortiz. Dio cuerda al reloj, lo escucho un rato y escribio una cruz al lado de Amos, con letra derecha. Al lado de Celia y Joaquin escribio 'vivos', en mayusculas. Quedan cuatro signos de pregunta.",
            otro = "Le di al Cabo el reloj de Amos Pruitt. De los Ortiz llego solo uno. El Cabo escribio dos cruces y un 'vivo' en la misma pagina, y le dio cuerda al reloj sin decir nada. Quedan cuatro signos de pregunta." } },
            unir(ortizSeQuedan(), {
                { "decir_contacto", retraso = 0.05, texto = { por_var = "llegaron", textos = {
                    dos = "Amos Pruitt. Le dio cuerda todos los dias de su vida. ... Cruz. Y aqui: vivos. En mayusculas, civil, mire. Quedan cuatro. Retirese y descanse. Es una orden.",
                    otro = "Amos Pruitt. Le dio cuerda todos los dias de su vida. ... Cruz. Y aqui, una cruz y un vivo. Se hizo lo que se pudo, civil. Quedan cuatro." } } } })),
        final_sin_reloj = cierre("muldraugh", 4, { por_var = "llegaron", textos = {
            dos = "Le conte al Cabo lo de Amos Pruitt y le lleve a los Ortiz. Me pregunto dos veces si estaba seguro. Despues escribio la cruz igual, mas despacio que nunca. Al lado de Celia y Joaquin escribio 'vivos'.",
            otro = "Le conte al Cabo lo de Amos Pruitt. De los Ortiz llego solo uno. Me pregunto dos veces si estaba seguro de todo. Despues escribio dos cruces y un 'vivo', mas despacio que nunca." } },
            unir(ortizSeQuedan(), {
                { "decir_contacto", retraso = 0.05, texto = { por_var = "llegaron", textos = {
                    dos = "Esta seguro, civil? ... Esta seguro. Cruz, entonces. Y aqui: vivos. Quedan cuatro.",
                    otro = "Esta seguro, civil? ... Esta seguro. Cruz, entonces. Y aqui, una cruz y un vivo. Quedan cuatro." } } } })),
        final_cruces = fracaso("muldraugh", 4,
            "Celia y Joaquin Ortiz murieron antes de llegar a la comisaria. El Cabo escribio dos cruces en la misma linea y cerro la libreta. Esa noche no se plancho el uniforme.",
            { { "soltar_acompanante", grupo = ORTIZ, rol = "celia" },
              { "soltar_acompanante", grupo = ORTIZ, rol = "joaquin" },
              { "decir_contacto", texto = "Dos cruces. En la misma linea. ... Entendido, civil. Retirese." } }),
    },
})

-- ===========================================================================
-- Tia Chela, capitulo 4: La calle Main
-- La primera noche la Chela saco a su vecina Irma Kemper de un incendio en la calle Main, ya
-- mordida, y la tuvo que dejar en la vereda (capa 4 de su perfil). Desde ese dia no apaga
-- fuegos. La radio del cuartel (cap. 2) agarra la voz de Doris, la hija de Irma, rodeada en
-- otro pueblo. Primero hay que darle descanso a Irma (sigue en la calle Main) y despues traer
-- a Doris. En el cuartel se decide si Doris recibe el relicario de su mama.
-- ===========================================================================
local DORIS = "doris"
local PERFIL_DORIS = "k93_survivor_commune_09"
local PUEBLOS_DORIS = { "Muldraugh", "Valley Station", "Riverside" }

local function dorisSeQueda()
    return {
        { "salvado_campamento", contacto = "westpoint", nombre = "Doris", apellido = "Kemper", perfil = PERFIL_DORIS,
          grupo = DORIS, rol = "doris", si = { "vivo", DORIS, "doris" } },
        { "retirar_lejos", grupo = DORIS, lugar = "contacto", radio = 40, retraso = 1.5 },
    }
end

registrar({
    id = "cap_chela_4",
    titulo = "La calle Main",
    titulo_menu = "Historia de la Tia Chela, cap. 4: la calle Main",
    requiere_alife = true, automatico = false,
    sorteo = { pueblo_doris = { valores = PUEBLOS_DORIS } },
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "calle_main", desde = "contacto", nombre = "la calle Main", salas = { "livingroom", "kitchen", "bedroom" },
                  min = 40, max = 300 },
                { "lugar", id = "refugio_doris", pueblo = "var:pueblo_doris", salas = { "firestorage", "office", "livingroom" },
                  respaldo = { "kitchen", "bedroom" }, cerca_del_centro = true },
                { "decir_contacto", texto = "Mijo, sientate. Anoche la radio agarro una voz. Doris Kemper. La hija de la Irma, mi vecina de la calle Main. La que saque del incendio la primera noche, ya mordida, y deje en la vereda. Doris esta viva en {lugar:refugio_doris}, con los muertos encima. Traemela." },
                { "decir_contacto", retraso = 0.05, texto = "Y otra cosa. La Irma sigue en la calle Main, mijo. La veo cada vez que salgo con el camion. Dale descanso. Yo no puedo. No la puedo dejar asi otra vez." },
                { "decir_eduardo", retraso = 0.1, texto = "La Irma? La del queque de los domingos? ... Anda tu, amigo. Yo me quedo con la vieja." },
                { "mapa", lugar = "calle_main", titulo = "Mapa de la Tia Chela: la calle Main" },
                { "mapa", lugar = "refugio_doris", titulo = "Mapa de la Tia Chela: Doris Kemper" },
                { "diario", texto = "La Tia Chela me conto lo de la calle Main: la primera noche saco a su vecina Irma Kemper de un incendio, ya mordida, y la dejo en la vereda. La hija, Doris, esta viva en {lugar:refugio_doris}. Antes, la Chela me pidio darle descanso a Irma." },
            },
            salidas = { { ir = "irma" } },
        },
        irma = {
            pista = "Ir a {lugar:calle_main} y darle descanso a Irma Kemper.",
            objetivo = "calle_main",
            salidas = { { cuando = { "cerca", "calle_main", 35 }, ir = "irma_calle" } },
        },
        irma_calle = {
            pista = "Darle descanso a Irma Kemper en {lugar:calle_main} y recoger su relicario.",
            objetivo = "calle_main",
            al_entrar = {
                { "aviso", texto = "En la vereda de la calle Main hay una muerta con delantal de flores y un relicario al cuello. No se ha movido de ahi en todo este tiempo." },
                { "zombi_en", lugar = "calle_main", femenino = true },
                { "oleada", lugar = "calle_main", radio = 40, cantidad = { 5, 8 }, min = 15, max = 30, retraso = 0.05 },
                { "objeto", id = "relicario", lugar = "calle_main", tipo = { "Base.Locket", "Base.Necklace_Silver" },
                  nombre = "El relicario de Irma Kemper" },
            },
            salidas = { { cuando = { "alguien_tiene", "relicario" }, ir = "doris" } },
        },
        doris = {
            pista = "Ir a {lugar:refugio_doris}, donde Doris Kemper aguanta con los muertos encima.",
            objetivo = "refugio_doris",
            al_entrar = {
                { "diario", texto = "Le di descanso a Irma Kemper en la calle Main. Llevaba un relicario al cuello; me lo guarde para su hija." },
            },
            salidas = { { cuando = { "cerca", "refugio_doris", 50 }, ir = "sitio" } },
        },
        sitio = {
            pista = "Mantener viva a Doris Kemper en {lugar:refugio_doris}: van {bajas:refugio_doris} de {meta_doris}.",
            objetivo = "refugio_doris",
            al_entrar = {
                { "variable", nombre = "meta_doris", valor = 9999 },
                { "npcs", id = DORIS, lugar = "refugio_doris", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "doris", PERFIL_DORIS } }, nombres = { doris = { "Doris", "Kemper" } }, femeninos = { "doris" } },
                { "oleada", lugar = "refugio_doris", radio = 50, cantidad = 25, por_jugador = 10, fija = true, caminantes = true,
                  min = 14, max = 35, meta = "meta_doris", meta_frac = 0.8 },
                { "oleada", lugar = "refugio_doris", radio = 50, cantidad = { 6, 9 }, correr = true, min = 25, max = 40, retraso = 0.5 },
            },
            salidas = {
                { cuando = { "todos_muertos", DORIS }, ir = "final_muerta" },
                { cuando = { { "grupo_listo", DORIS }, { "o", { "bajas_en", "refugio_doris", "var:meta_doris", 60 },
                    { { "horas", 1 }, { "sin_zombis", "refugio_doris", 15 } } } }, ir = "hablar" },
            },
        },
        hablar = {
            pista = "Hablar con Doris Kemper (clic derecho cerca).",
            ancla = "refugio_doris", ancla_grupo = DORIS, radio = 20,
            al_entrar = {
                { "decir", grupo = DORIS, rol = "doris", texto = "La Chela? La Chela Recados, la bombera? Mi mama decia que fue la unica que entro a buscarla esa noche. La unica. Nunca supe que paso despues." },
            },
            opciones = { { id = "llevar", texto = "Decirle que la Chela la espera en el cuartel de West Point",
                dice = { rol = "doris", texto = "Vamos. Tengo que preguntarle algo y no lo voy a hacer por radio." } } },
            salidas = {
                { cuando = { "todos_muertos", DORIS }, ir = "final_muerta" },
                { cuando = { "eleccion", "llevar" }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Doris Kemper va por su cuenta al cuartel de la Tia Chela. Vuelve con la Chela: te espera alla.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = DORIS, rol = "doris", nombre = "Doris Kemper", inmortal = false },
                { "banderas", grupo = DORIS, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", DORIS }, ir = "final_muerta" },
                { cuando = { "npc_cerca", DORIS, "contacto", 15 }, ir = "cuartel" },
            },
        },
        cuartel = {
            pista = "Doris Kemper y la Tia Chela, frente a frente en el cuartel. Decide que le dices a Doris.",
            ancla = "contacto",
            al_entrar = {
                { "soltar_acompanante", grupo = DORIS, rol = "doris" },
                { "decir", grupo = DORIS, rol = "doris", texto = "Usted es la Chela. ... Que paso con mi mama esa noche?" },
                { "decir_contacto", retraso = 0.05, texto = "La saque del fuego, hija. Ya estaba mordida. Y la deje en la vereda. Treinta anos de bombera y la deje en la vereda. Desde ese dia no apago un fuego." },
            },
            opciones = {
                { id = "relicario", texto = "Darle a Doris el relicario de su mama", requiere = { "objeto", "relicario" },
                  falta = "No llevas el relicario de Irma." },
                { id = "descansa", texto = "Decirle a Doris que su mama ya descansa" },
            },
            salidas = {
                { cuando = { "todos_muertos", DORIS }, ir = "final_muerta" },
                { cuando = { "eleccion", "relicario" }, ir = "final_relicario" },
                { cuando = { "eleccion", "descansa" }, ir = "final_descansa" },
            },
        },
        final_relicario = cierre("westpoint", 4,
            "Le di a Doris el relicario de su mama. Adentro habia una foto vieja: Irma y la Chela, jovenes, en una fiesta del cuartel. Doris le dijo a la Chela que no la dejo: que la saco del fuego, y que lo otro lo hizo el mundo. La Chela lloro delante de mi por primera vez y no me regano.",
            unir({
                { "decir", grupo = DORIS, rol = "doris", texto = "Son ustedes dos. En el cuartel. ... Usted no la dejo, Chela. La saco del fuego. Lo otro lo hizo el mundo." },
                { "decir_contacto", retraso = 0.05, texto = "Ay, mijita. ... Mijo, no me mires. Mirame nomas, ya da lo mismo. Desde hoy vuelvo a apagar fuegos. Toma, te lo ganaste." },
                { "decir_eduardo", retraso = 0.1, texto = "Hace anos que no la veia llorar asi, amigo. Gracias." },
            }, dorisSeQueda())),
        final_descansa = cierre("westpoint", 4,
            "Le dije a Doris que su mama ya descansa. No le di el relicario. Doris le dio la mano a la Chela y le dijo gracias por entrar esa noche. La Chela no dijo nada; esa tarde salio con el camion a dar una vuelta larga, sola.",
            unir({
                { "decir", grupo = DORIS, rol = "doris", texto = "Ya descansa. ... Gracias por entrar esa noche, Chela. Usted fue la unica." },
                { "decir_contacto", retraso = 0.05, texto = "Gracias a ti, hija. Quedate aca, que aca se come. Mijo, toma. Y gracias por lo de la calle Main." },
            }, dorisSeQueda())),
        final_muerta = fracaso("westpoint", 4,
            "Doris Kemper murio antes de llegar al cuartel. La Chela no pregunto como. Guardo su nombre al lado del de Irma, en la pared de la cocina, y esa noche tampoco apago el fuego de la estufa.",
            { { "soltar_acompanante", grupo = DORIS, rol = "doris" },
              { "decir_contacto", texto = "Las dos, mijo. La mama y la hija. ... Anda a descansar. Yo me quedo un rato aca." } }),
    },
})

-- ===========================================================================
-- Padre Nacho, capitulo 4: Las campanas de Riverside
-- El Padre lleva lista de quien viene a misa y se preocupa cuando alguien falta (capa 3); hace
-- misa para tres personas y un perro (capa 4). Ahora quiere una misa de verdad: tocar las
-- campanas para que venga el que quede vivo. La cuerda se pudrio (hay que traer una nueva) y
-- el ruido trae a todos los muertos del pueblo: hay que defender la iglesia mientras llegan
-- tres feligreses. Los que sobreviven se quedan de guardias en la iglesia.
-- ===========================================================================
local FIELES = "feligreses"
local PERFILES_FIELES = {
    { "otis", "k93_survivor_commune_01", "Otis", "Barker" },
    { "ruth", "k93_survivor_commune_11", "Ruth", "Haney" },
    { "helen", "k93_refugee_walkers_08", "Helen", "Pike" },
}

local function fielesPerfiles()
    local perfiles, nombres = {}, {}
    for _, f in ipairs(PERFILES_FIELES) do
        perfiles[#perfiles + 1] = { f[1], f[2] }
        nombres[f[1]] = { f[3], f[4] }
    end
    return perfiles, nombres
end

-- Al terminar la misa, los feligreses vivos se quedan de guardias en la iglesia.
local function fielesSeQuedan()
    local l = {}
    for _, f in ipairs(PERFILES_FIELES) do
        l[#l + 1] = { "salvado_campamento", contacto = "riverside", nombre = f[3], apellido = f[4], perfil = f[2],
            grupo = FIELES, rol = f[1], si = { "vivo", FIELES, f[1] } }
    end
    l[#l + 1] = { "retirar_lejos", grupo = FIELES, lugar = "contacto", radio = 40, retraso = 1.5 }
    return l
end

local PERFILES_F, NOMBRES_F = fielesPerfiles()
local ALGUN_FIEL_MUERTO = { "o", { "muerto", FIELES, "otis" }, { "muerto", FIELES, "ruth" }, { "muerto", FIELES, "helen" } }

registrar({
    id = "cap_nacho_4",
    titulo = "Las campanas de Riverside",
    titulo_menu = "Historia del Padre Nacho, cap. 4: las campanas de Riverside",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "ferreteria", desde = "contacto", salas = { "toolstore", "garagestorage" },
                  respaldo = { "garage", "kitchen" }, min = 200, max = 900 },
                { "decir_contacto", texto = "Hijo, hace dos anos que no toco las campanas. Hago misa para tres personas y un perro, y el perro se duerme. Quiero una misa de verdad: que suenen las campanas y venga el que quede vivo en Riverside. La cuerda se pudrio. En {lugar:ferreteria} tiene que quedar una buena." },
                { "decir_contacto", retraso = 0.05, texto = "Y si, ya se lo que trae el ruido. Por eso te lo pido a ti y no a Dios: tu contestas." },
                { "mapa", lugar = "ferreteria", titulo = "Mapa del Padre Nacho: la cuerda" },
                { "diario", texto = "El Padre Nacho quiere tocar las campanas de la iglesia por primera vez en dos anos, para que venga a misa el que quede vivo. La cuerda se pudrio: hay una nueva en {lugar:ferreteria}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Buscar una cuerda para la campana en {lugar:ferreteria}.",
            objetivo = "ferreteria",
            salidas = { { cuando = { "cerca", "ferreteria", 40 }, ir = "ferreteria" } },
        },
        ferreteria = {
            pista = "Encontrar la cuerda para la campana en {lugar:ferreteria}.",
            objetivo = "ferreteria",
            al_entrar = {
                { "oleada", lugar = "ferreteria", radio = 45, cantidad = { 10, 14 }, min = 12, max = 30 },
                { "objeto", id = "cuerda", lugar = "ferreteria", radio = 35, tipo = { "Base.Rope" }, nombre = "Cuerda para la campana" },
            },
            salidas = { { cuando = { "alguien_tiene", "cuerda" }, ir = "volver" } },
        },
        volver = {
            pista = "Llevarle la cuerda al Padre Nacho.",
            ancla = "contacto",
            opciones = { { id = "entregar", texto = "Darle la cuerda al Padre Nacho", requiere = { "objeto", "cuerda" }, falta = "No llevas la cuerda." } },
            salidas = { { cuando = { "eleccion", "entregar" }, ir = "esperar" } },
        },
        esperar = {
            pista = "La misa es al mediodia. Estar en la iglesia del Padre Nacho entre las 11 y las 14.",
            objetivo = "contacto",
            al_entrar = {
                { "decir_contacto", texto = "Buena cuerda, hijo. Aguanta un ahorcado y un campanario. ... Mala broma. Manana al mediodia. Trae todo lo que dispare." },
                { "decir_contacto", retraso = 0.05, si = { "memoria", "lucia", "en_riverside" },
                  texto = "Lucia ya aparto la primera fila. Dice que esta vez el que llega tarde es el pueblo, no yo." },
            },
            salidas = { { cuando = { { "cerca", "contacto", 25 }, { "hora_entre", 11, 14 } }, ir = "campanario" } },
        },
        campanario = {
            pista = "Tocar las campanas de la iglesia (clic derecho cerca del Padre Nacho).",
            ancla = "contacto",
            opciones = { { id = "tocar", texto = "Tocar las campanas de Riverside" } },
            salidas = { { cuando = { "eleccion", "tocar" }, ir = "defensa" } },
        },
        defensa = {
            pista = "Defender la iglesia mientras llegan los feligreses: van {bajas:contacto} de {meta_misa}.",
            objetivo = "contacto",
            al_entrar = {
                { "variable", nombre = "meta_misa", valor = 9999 },
                { "aviso", texto = "Las campanas de Riverside suenan por primera vez en dos anos. Se escuchan hasta el rio. Todo lo que camina en el pueblo da vuelta la cabeza." },
                { "ruido", lugar = "contacto", radio = 200, volumen = 100, veces = 3 },
                { "lugar_cerca", id = "atrio", de = "contacto", distancia = 8 },
                { "npcs", id = FIELES, lugar = "atrio", radio = 12, no_mas_cerca = 3, modo = "guard", quietos = true, correa = 6,
                  postura = "friendly", perfiles = PERFILES_F, nombres = NOMBRES_F, femeninos = { "ruth", "helen" }, retraso = 0.15 },
                { "oleada", lugar = "contacto", radio = 70, cantidad = 40, por_jugador = 12, fija = true, caminantes = true,
                  min = 25, max = 50, meta = "meta_misa", meta_frac = 0.8 },
                { "oleada", lugar = "contacto", radio = 70, cantidad = { 8, 12 }, correr = true, min = 30, max = 50, retraso = 0.4 },
            },
            salidas = {
                { cuando = { "todos_muertos", FIELES }, ir = "final_vacia" },
                { cuando = { "ausente", "contacto", 80, 1 }, ir = "final_vacia" },
                { cuando = { { "grupo_listo", FIELES }, { "o", { "bajas_en", "contacto", "var:meta_misa", 80 },
                    { { "horas", 3 }, { "sin_zombis", "contacto", 20 } } } }, ir = "misa" },
            },
        },
        misa = {
            al_entrar = {
                { "variable", nombre = "vinieron", valor = "todos" },
                { "variable", nombre = "vinieron", valor = "algunos", si = ALGUN_FIEL_MUERTO },
                { "aviso", texto = "Despues de la ultima campanada, la iglesia de Riverside tiene mas gente que nunca desde el 93. Huele a polvora y a velas." },
                { "decir_contacto", retraso = 0.03, texto = { por_var = "vinieron", textos = {
                    todos = "Hermanos. No les voy a hablar de Dios, que anda de vacaciones. Les voy a hablar de ustedes: vinieron. Con el mundo como esta, vinieron. Eso es la fe. Lo demas es latin.",
                    otro = "Hermanos. Hoy no llegaron todos los que venian. Vamos a rezar por ellos, aunque sea por costumbre. Y por los que si llegaron: vinieron. Eso es la fe. Lo demas es latin." } } },
                { "decir", grupo = FIELES, rol = "otis", retraso = 0.06, texto = "Cuarenta anos viniendo a esta iglesia, Padre. No me iba a perder la mejor misa." },
                { "decir", grupo = FIELES, rol = "ruth", retraso = 0.08, texto = "Amen. Y que alguien cierre esa puerta. ... No, verdad. Esta puerta no se cierra." },
                { "aviso", retraso = 0.1, si = { "memoria", "lucia", "en_riverside" },
                  texto = "En la primera fila, Lucia mira al Padre a la cara, como pidio. El tambien la mira." },
                { "aviso", retraso = 0.12, si = { "memoria", "historia_riverside_2", true },
                  texto = "Al fondo, de pie, con el sombrero en la mano, esta Frank Duggan. Escucho las campanas desde el camino. Se va antes de la bendicion." },
            },
            salidas = { { cuando = { "horas", 0.3 }, ir = "final_cumplido" } },
        },
        final_cumplido = cierre("riverside", 4, { por_var = "vinieron", textos = {
            todos = "Tocamos las campanas de Riverside y vino gente de todo el pueblo, entre los muertos. Defendimos la iglesia hasta que llegaron. El Padre dijo la misa sin hablar de Dios: dijo que la fe es venir. Otis, Ruth y Helen se quedan en la iglesia.",
            otro = "Tocamos las campanas de Riverside. No todos los que venian llegaron. El Padre rezo por ellos por costumbre y por los que llegaron con ganas. Dijo que la fe es venir. Los que quedaron se quedan en la iglesia." } },
            unir({ { "decir_contacto", texto = "Hijo, toma. Y vuelve el domingo, que la proxima la tocas tu sin que yo te lo pida." } },
                fielesSeQuedan())),
        final_vacia = fracaso("riverside", 4,
            "Las campanas de Riverside sonaron, pero a la iglesia no llego nadie vivo. El Padre Nacho hizo la misa igual, para los bancos vacios y para mi. Dijo que el que toca la campana no elige quien viene.",
            { { "decir_contacto", texto = "No vino nadie, hijo. ... Igual hacemos misa. Para eso esta la puerta abierta." },
              { "retirar_lejos", grupo = FIELES, lugar = "contacto", radio = 40, retraso = 1 } }),
    },
})

-- ===========================================================================
-- Misia Rosa, capitulo 5: El primer camion
-- El tanque escondido era "para el dia en que haya que sacar a todo el pueblo de una vez", y el
-- primer camion lo manejas tu (cap. 3). Ese dia llega: una marea de muertos baja por la ruta
-- 31 hacia Rosewood. Hay que juntar en la gasolinera a dos familias escondidas en el pueblo y
-- aguantar la marea. Si el tanque se lo llevaron los bandidos (estanque_rosewood = saqueado),
-- primero hay que conseguir bencina para el camion. Si la carcel quedo limpia (cap. 4,
-- carcel_rosewood = limpiada), el camion las lleva a vivir alla; si no, se quedan de guardias
-- en la gasolinera.
-- ===========================================================================
local FAM1, FAM2 = "turner", "mercer"
local FAMILIAS = {
    { grupo = FAM1, rol = "ellen", perfil = "k93_turner_family_04", nombre = "Ellen", apellido = "Turner", mujer = true },
    { grupo = FAM1, rol = "roy", perfil = "k93_turner_family_10", nombre = "Roy", apellido = "Turner" },
    { grupo = FAM2, rol = "andre", perfil = "k93_mercer_family_01", nombre = "Andre", apellido = "Mercer" },
    { grupo = FAM2, rol = "laura", perfil = "k93_mercer_family_06", nombre = "Laura", apellido = "Mercer", mujer = true },
}

local function familia(grupo)
    local perfiles, nombres, femeninos = {}, {}, {}
    for _, f in ipairs(FAMILIAS) do
        if f.grupo == grupo then
            perfiles[#perfiles + 1] = { f.rol, f.perfil }
            nombres[f.rol] = { f.nombre, f.apellido }
            if f.mujer then femeninos[#femeninos + 1] = f.rol end
        end
    end
    return perfiles, nombres, femeninos
end

-- Rescate de una familia en su casa: aparecen, llega una horda chica y, cuando se calma, se
-- van solos a la gasolinera.
local function etapasFamilia(etapas, grupo, casa, siguiente, saludo, texto_casa)
    local perfiles, nombres, femeninos = familia(grupo)
    etapas["viaje_" .. grupo] = {
        pista = texto_casa,
        objetivo = casa,
        salidas = { { cuando = { "cerca", casa, 40 }, ir = "casa_" .. grupo } },
    }
    etapas["casa_" .. grupo] = {
        pista = "Sacar a los " .. nombres[perfiles[1][1]][2] .. " de {lugar:" .. casa .. "}.",
        objetivo = casa,
        al_entrar = {
            { "npcs", id = grupo, lugar = casa, radio = 35, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
              postura = "friendly", perfiles = perfiles, nombres = nombres, femeninos = femeninos },
            { "oleada", lugar = casa, radio = 45, cantidad = { 10, 14 }, min = 12, max = 30 },
        },
        salidas = {
            { cuando = { "todos_muertos", grupo }, ir = siguiente },
            { cuando = { { "grupo_listo", grupo }, { "o", { { "horas", 0.25 }, { "sin_zombis", casa, 15 } }, { "horas", 1 } } },
              ir = "sale_" .. grupo },
        },
    }
    local sale = { { "decir", grupo = grupo, rol = perfiles[1][1], texto = saludo } }
    for _, p in ipairs(perfiles) do
        sale[#sale + 1] = { "acompanante", grupo = grupo, rol = p[1], nombre = nombres[p[1]][1] .. " " .. nombres[p[1]][2], inmortal = false }
    end
    sale[#sale + 1] = { "banderas", grupo = grupo, quietos = false, correa = 0 }
    etapas["sale_" .. grupo] = { al_entrar = sale, salidas = { { ir = siguiente } } }
end

-- Las familias que llegaron vivas: con la carcel limpia se van alla (cuentan como salvadas,
-- sin quedarse de guardias); si no, se quedan de guardias en la gasolinera.
local function familiasSeQuedan(enCarcel)
    local l = {}
    for _, f in ipairs(FAMILIAS) do
        l[#l + 1] = { "soltar_acompanante", grupo = f.grupo, rol = f.rol }
    end
    for _, f in ipairs(FAMILIAS) do
        if enCarcel then
            l[#l + 1] = { "salvado_campamento", contacto = "rosewood", nombre = f.nombre, apellido = f.apellido,
                si = { "vivo", f.grupo, f.rol } }
        else
            l[#l + 1] = { "salvado_campamento", contacto = "rosewood", nombre = f.nombre, apellido = f.apellido, perfil = f.perfil,
                grupo = f.grupo, rol = f.rol, si = { "vivo", f.grupo, f.rol } }
        end
    end
    l[#l + 1] = { "retirar_lejos", grupo = FAM1, lugar = "contacto", radio = 40, retraso = 1.5 }
    l[#l + 1] = { "retirar_lejos", grupo = FAM2, lugar = "contacto", radio = 40, retraso = 1.5 }
    return l
end

local LLEGO = function(grupo) return { "o", { "npc_cerca", grupo, "contacto", 20 }, { "todos_muertos", grupo } } end
local TODOS_PERDIDOS = { { "todos_muertos", FAM1 }, { "todos_muertos", FAM2 } }

local etapasCamion = {
    encargo = {
        al_entrar = {
            { "lugar", id = "casa_turner", desde = "contacto", salas = { "livingroom", "bedroom", "kitchen" }, min = 150, max = 700 },
            { "lugar", id = "casa_mercer", desde = "contacto", salas = { "garagestorage", "livingroom", "kitchen" },
              respaldo = { "bedroom" }, min = 200, max = 800 },
            { "decir_contacto", texto = "Mijito. Llego el dia. Por la radio de West Point avisan que una marea de muertos baja por la 31, derecho a Rosewood. Hay dos familias escondidas en el pueblo: los Turner, en {lugar:casa_turner}, y los Mercer, en {lugar:casa_mercer}. Traelas aca. Y el primer camion lo manejas tu, como te prometi." },
            { "decir_contacto", retraso = 0.05, si = { "memoria", "estanque_rosewood", "saqueado" },
              texto = "Lo malo es que el tanque esta vacio, mijito. Se lo llevaron esos desgraciados. Sin bencina no sale ni una carretilla." },
            { "mapa", lugar = "casa_turner", titulo = "Mapa de la Misia Rosa: los Turner" },
            { "mapa", lugar = "casa_mercer", titulo = "Mapa de la Misia Rosa: los Mercer" },
            { "diario", texto = "Una marea de muertos baja por la ruta 31 hacia Rosewood. La Misia Rosa quiere juntar en la gasolinera a los Turner ({lugar:casa_turner}) y a los Mercer ({lugar:casa_mercer}) y sacarlos en camion. El primer camion lo manejo yo." },
        },
        salidas = {
            { cuando = { "memoria", "estanque_rosewood", "saqueado" }, ir = "bencina" },
            { ir = "viaje_" .. FAM1 },
        },
    },
    -- Sin tanque: primero, bencina para el camion.
    bencina = {
        pista = "Conseguir bencina para el camion en {lugar:bencinera}.",
        objetivo = "bencinera",
        al_entrar = {
            { "lugar", id = "bencinera", desde = "contacto", salas = { "gasstore", "garagestorage" }, respaldo = { "garage", "kitchen" },
              min = 400, max = 1200 },
            { "mapa", lugar = "bencinera", titulo = "Mapa de la Misia Rosa: la bencina" },
        },
        salidas = { { cuando = { "cerca", "bencinera", 40 }, ir = "bencinera" } },
    },
    bencinera = {
        pista = "Encontrar un bidon lleno en {lugar:bencinera}.",
        objetivo = "bencinera",
        al_entrar = {
            { "oleada", lugar = "bencinera", radio = 45, cantidad = { 10, 16 }, min = 12, max = 30 },
            { "objeto", id = "bidon", lugar = "bencinera", radio = 30, tipo = { "Base.PetrolCan" }, nombre = "Bencina para el camion" },
        },
        salidas = { { cuando = { "alguien_tiene", "bidon" }, ir = "bencina_volver" } },
    },
    bencina_volver = {
        pista = "Llevarle la bencina a la Misia Rosa.",
        ancla = "contacto",
        opciones = { { id = "bidon", texto = "Darle la bencina a la Misia Rosa", requiere = { "objeto", "bidon" }, falta = "No llevas la bencina." } },
        salidas = { { cuando = { "eleccion", "bidon" }, ir = "viaje_" .. FAM1 } },
    },
    -- Las dos familias van solas a la gasolinera; se espera a que lleguen (o a que no quede nadie).
    reunion = {
        pista = "Volver a la gasolinera: las familias van por su cuenta. La marea viene en camino.",
        objetivo = "contacto",
        salidas = {
            { cuando = TODOS_PERDIDOS, ir = "final_perdidos" },
            { cuando = { { "cerca", "contacto", 30 }, LLEGO(FAM1), LLEGO(FAM2) }, ir = "marea" },
        },
    },
    marea = {
        pista = "Aguantar la marea en la gasolinera hasta que salga el camion: van {bajas:contacto} de {meta_marea}.",
        objetivo = "contacto",
        al_entrar = {
            { "variable", nombre = "meta_marea", valor = 9999 },
            { "decir_contacto", texto = "Ahi viene, mijito. Toda la 31. ... Yo cargo el camion. Tu no los dejes pasar del surtidor." },
            { "aviso", texto = "Por la ruta 31 baja una marea de muertos. No se le ve el final.", retraso = 0.05 },
            -- Lo que paso con Earl despues del tanque (cap. 3, earl_tanque).
            { "aviso", retraso = 0.15, si = { "memoria", "earl_tanque", "perdonado" },
              texto = "Contra la marea, por la 31, aparece Lucille con los focos prendidos. El Gordo Earl toca la bocina dos veces y grita por la ventana: 'El segundo camion es mio, Rosita! Lleno!'" },
            { "aviso", retraso = 0.15, si = { "memoria", "earl_tanque", "echado" },
              texto = "Por el 19, la voz del Gordo Earl: 'Rosita, no me contestes. Deje a Lucille con el motor caliente en la salida de la 31, por si tu camion no alcanza.' La Misia Rosa no contesta. Despues aprieta el microfono dos veces: copiado." },
            { "aviso", retraso = 0.15, si = { "memoria", "earl_tanque", "callado" },
              texto = "El Gordo Earl llega en Lucille y carga cajas al camion de la Misia Rosa sin decir nada, como si le debiera algo. Le debe." },
            { "oleada", lugar = "contacto", radio = 80, cantidad = 50, por_jugador = 15, fija = true, caminantes = true,
              min = 30, max = 60, meta = "meta_marea", meta_frac = 0.75, retraso = 0.1 },
            { "oleada", lugar = "contacto", radio = 80, cantidad = { 10, 15 }, correr = true, min = 35, max = 60, retraso = 0.6 },
        },
        salidas = {
            { cuando = TODOS_PERDIDOS, ir = "final_perdidos" },
            { cuando = { "o", { "bajas_en", "contacto", "var:meta_marea", 90 }, { { "horas", 4 }, { "sin_zombis", "contacto", 20 } } },
              ir = "camion" },
        },
    },
    camion = {
        al_entrar = {
            { "variable", nombre = "vinieron", valor = "todos" },
            { "variable", nombre = "vinieron", valor = "algunos", si = { "o", { "muerto", FAM1, "ellen" }, { "muerto", FAM1, "roy" },
                { "muerto", FAM2, "andre" }, { "muerto", FAM2, "laura" } } },
            { "aviso", texto = "La marea se deshace contra la gasolinera. El camion de la Misia Rosa arranca a la primera, como si la hubiera estado esperando treinta anos." },
        },
        salidas = {
            { cuando = { "memoria", "carcel_rosewood", "limpiada" }, ir = "final_carcel" },
            { ir = "final_gasolinera" },
        },
    },
    final_carcel = cierre("rosewood", 5, { por_var = "vinieron", textos = {
        todos = "Maneje el primer camion de la Misia Rosa hasta la carcel de Rosewood, la que limpiamos. Los Turner y los Mercer se quedaron a vivir detras de los muros. La Misia Rosa dijo que la carcel ya no es carcel: ahora es el pueblo.",
        otro = "Maneje el primer camion de la Misia Rosa hasta la carcel de Rosewood. No llegaron todos. Los que llegaron se quedaron detras de los muros, y la Misia Rosa anoto a los otros en pasado, con letra bonita." } },
        unir({ { "decir_contacto", texto = "Lo manejaste tu, mijito, como te prometi. ... La carcel. Quien me iba a decir que el lugar mas seguro de Rosewood iba a ser la carcel. Toma. Y el segundo camion tambien lo manejas tu." } },
            familiasSeQuedan(true))),
    final_gasolinera = cierre("rosewood", 5, { por_var = "vinieron", textos = {
        todos = "Aguantamos la marea en la gasolinera. El camion no tenia adonde ir: la carcel sigue llena de muertos. Los Turner y los Mercer se quedan con la Misia Rosa, de guardias, con la luz prendida.",
        otro = "Aguantamos la marea en la gasolinera, pero no llegaron todos. Los que quedaron se quedan con la Misia Rosa, de guardias, con la luz prendida." } },
        unir({ { "decir_contacto", texto = "No hay adonde llevarlos, mijito: esa carcel sigue llena. Se quedan aca, conmigo y con la luz prendida. Toma. Algun dia sale ese camion." } },
            familiasSeQuedan(false))),
    final_perdidos = fracaso("rosewood", 5,
        "Los Turner y los Mercer no llegaron a la gasolinera. El primer camion salio vacio. La Misia Rosa los anoto en pasado y no prendio la luz esa noche.",
        { { "decir_contacto", texto = "Ninguno, mijito. Ninguno. ... Apaga tu la luz, que a mi me tiemblan las manos." } }),
}
etapasFamilia(etapasCamion, FAM1, "casa_turner", "viaje_" .. FAM2,
    "La Rosa nos manda a buscar? Esa mujer sabe donde vive cada alma de este pueblo. Vamos, tio Roy.",
    "Ir a {lugar:casa_turner}, donde se esconden los Turner.")
etapasFamilia(etapasCamion, FAM2, "casa_mercer", "reunion",
    "El camion de la Rosa? Ese motor lo arregle yo el 91. Vamos, Laura, que ese no falla.",
    "Ir a {lugar:casa_mercer}, donde se esconden los Mercer.")

registrar({
    id = "cap_rosa_5",
    titulo = "El primer camion",
    titulo_menu = "Historia de la Misia Rosa, cap. 5: el primer camion",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = etapasCamion,
})
