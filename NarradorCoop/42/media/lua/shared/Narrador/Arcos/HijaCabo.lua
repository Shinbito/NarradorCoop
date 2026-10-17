-- La hija del Cabo Ramiro: capitulo 3 de su historia. Sale entre sus ofertas despues del
-- capitulo 2 y con confianza 4 (G.ESPECIALES en server/Narrador/NarradorGenerador.lua).
-- Sale de la capa 5 de su personalidad: tiene una hija en Louisville, Valentina, a la que le
-- escribe cartas que nunca manda. El Cabo pide ir a buscarla a una escuela de Louisville: hay
-- gente atrincherada, una horda encima y Valentina peleando en la entrada. Hay que salvarla y
-- traerla de vuelta al campamento: te sigue a pie y "se sube" al auto contigo
-- (server/Narrador/NarradorPasajeros.lua).
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local HIJA = "hija"
local GENTE = "sobrevivientes"

Narrador.Defs.registrar({
    id = "hija_cabo",
    titulo = "Valentina",
    titulo_menu = "Historia del Cabo Ramiro, cap. 3: Valentina",
    requiere_alife = true,
    automatico = false,
    max_veces = 1,
    inicio = "pedido",

    etapas = {
        -- 1. El Cabo pide el favor y da el mapa de la escuela.
        pedido = {
            al_entrar = {
                { "lugar_contacto", id = "contacto", contacto = "muldraugh" },
                { "lugar", id = "escuela", pueblo = "Louisville", salas = { "classroom" },
                  respaldo = { "schoolstorage", "gym", "office" } },
                { "decir_contacto", texto = "Soldado. Le tengo que pedir algo que no es un encargo. Mi hija, Valentina, estaba en Louisville. Una radio dijo que hay gente viva en una escuela. Traigamela. Por favor." },
                { "mapa", lugar = "escuela", titulo = "Mapa del Cabo Ramiro: la escuela" },
                { "diario", texto = "El Cabo Ramiro me pidio buscar a su hija, Valentina, en {lugar:escuela}. Es la primera vez que le escucho decir por favor." },
            },
            salidas = { { ir = "viaje" } },
        },

        -- 2. Ir a Louisville.
        viaje = {
            pista = "Ir a {lugar:escuela}, en Louisville, a buscar a Valentina.",
            objetivo = "escuela",
            salidas = {
                { cuando = { "cerca", "escuela", 80 }, ir = "escuela" },
            },
        },

        -- 3. La escuela: gente atrincherada, una horda y Valentina peleando.
        escuela = {
            pista = "Ayudar a la gente de {lugar:escuela}. Valentina esta peleando en la entrada.",
            objetivo = "escuela",
            al_entrar = {
                { "npcs", id = HIJA, lugar = "escuela", radio = 50, no_mas_cerca = 15,
                  modo = "guard", quietos = true, correa = 6, inmortales = true, postura = "friendly", salud = 200,
                  perfiles = { { "hija", "k93_hensley_family_03" } }, nombres = { hija = { "Valentina", "Mandados" } },
                  femeninos = { "hija" } },
                { "npcs", id = GENTE, lugar = "escuela", radio = 50, no_mas_cerca = 15,
                  modo = "guard", quietos = true, correa = 8, inmortales = true, postura = "friendly",
                  perfiles = { { "uno", "k93_red_cross_03" }, { "dos", "k93_red_cross_04" }, { "tres", "k93_county_ems_03" } }, femeninos = { "dos", "tres" } },
                { "variable", nombre = "horda_meta", valor = 9999 },
                { "oleada", lugar = "escuela", radio = 60, cantidad = 30, por_jugador = 15, fija = true, caminantes = true,
                  planta_baja = true, min = 14, max = 40, meta = "horda_meta", meta_frac = 0.8 },
                { "aviso", texto = "En {lugar:escuela} hay gente atrincherada y una horda encima. En la entrada, una muchacha pelea sola con un bate." },
            },
            salidas = {
                { cuando = { "grupo_listo", HIJA }, ir = "combate" },
                { cuando = { "horas", 6 }, ir = "combate" },
            },
        },

        -- 4. Combate: unos segundos de gracia y ya nadie es inmortal.
        combate = {
            pista = "Salvar a Valentina en {lugar:escuela}: van {bajas:escuela} de {horda_meta}.",
            objetivo = "escuela",
            al_entrar = {
                { "decir", grupo = HIJA, rol = "hija", texto = "Atras! Atras, malditos! Nadie entra mientras yo este aqui!" },
                { "banderas", grupo = HIJA, inmortales = false, retraso = 0.1 },
                { "banderas", grupo = GENTE, inmortales = false, retraso = 0.1 },
            },
            salidas = {
                { cuando = { "todos_muertos", HIJA }, ir = "final_perdida" },
                { cuando = { "o", { "bajas_en", "escuela", "var:horda_meta", 70 },
                                  { { "horas", 0.5 }, { "sin_zombis", "escuela", 15 } } }, ir = "salvada" },
            },
        },

        -- 5. Salvada: hay que decirle quien te manda.
        salvada = {
            pista = "Hablar con Valentina en {lugar:escuela} (clic derecho cerca).",
            objetivo = "escuela",
            ancla = "escuela", ancla_grupo = HIJA, radio = 25,
            al_entrar = {
                { "banderas", grupo = HIJA, inmortales = true },
                { "decir", grupo = HIJA, rol = "hija", texto = "Quien eres tu? No te acerques mas. Gracias, pero no te acerques mas." },
                { "retirar_lejos", grupo = GENTE, lugar = "escuela", radio = 60, retraso = 1 },
            },
            opciones = {
                { id = "papa", texto = "Te manda tu papa. El Cabo Ramiro esta vivo.",
                  dice = { rol = "hija", texto = "Mi papa? Esta vivo? ... Ese viejo terco. Claro que esta vivo. Vamos. Llevame con el." } },
            },
            salidas = {
                { cuando = { "todos_muertos", HIJA }, ir = "final_perdida" },
                { cuando = { "eleccion", "papa" }, ir = "escolta" },
            },
        },

        -- 6. Traerla de vuelta: te sigue y se sube al auto contigo.
        escolta = {
            pista = "Llevar a Valentina sana y salva a {lugar:contacto}.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = HIJA, rol = "hija", nombre = "Valentina", inmortal = false },
                { "banderas", grupo = HIJA, inmortales = false, quietos = false, correa = 0 },
                { "diario", texto = "Encontre a Valentina en {lugar:escuela}. Pelea igual que su papa: sin retroceder. La llevo de vuelta." },
            },
            salidas = {
                { cuando = { "todos_muertos", HIJA }, ir = "final_perdida" },
                { cuando = { "npc_cerca", HIJA, "contacto", 15 }, ir = "final_reencuentro" },
            },
        },

        final_reencuentro = {
            final = true,
            al_entrar = {
                { "soltar_acompanante", grupo = HIJA, rol = "hija" },
                { "banderas", grupo = HIJA, inmortales = true },
                { "decir", grupo = HIJA, rol = "hija", texto = "Papa! Te planchaste el uniforme. Claro que te planchaste el uniforme." },
                { "decir_contacto", retraso = 0.05, texto = "Valentina... Atencion. Atencion, soldado. Yo... Gracias. A contar de hoy usted no me debe nada. Nunca." },
                { "reputacion", contacto = "muldraugh", cantidad = 25, motivo = "le traje a su hija" },
                { "residentes", id = "valentina", grupos = { HIJA }, lugar = "contacto", radio = 20, max_zombis = 2 },
                { "recompensa", lugar = "contacto", radio = 20,
                  items = { { "Base.Shotgun", "Base.DoubleBarrelShotgun" }, { "Base.ShotgunShellsBox", "Base.ShotgunShells" },
                            { "Base.Vest_BulletPolice", "Base.Hat_Police" } } },
                { "diario", texto = "Le traje a Valentina al Cabo Ramiro. Saco las cartas de la libreta y se las dio todas juntas. Ella las leyo sentada en la escalera de la comisaria." },
                { "memoria", clave = "hija_cabo", valor = "salvada" },
                { "memoria", clave = "historia_muldraugh_3", valor = true },
            },
        },

        final_perdida = {
            final = true,
            al_entrar = {
                { "soltar_acompanante", grupo = HIJA, rol = "hija" },
                { "decir_contacto", texto = "No me lo diga. No me lo diga, soldado. Ya se." },
                { "diario", texto = "Valentina murio. No la pude traer. El Cabo Ramiro no anoto nada en su libreta ese dia." },
                { "memoria", clave = "hija_cabo", valor = "muerta" },
                { "memoria", clave = "historia_muldraugh_3", valor = "fallido" },
            },
        },
    },
})
