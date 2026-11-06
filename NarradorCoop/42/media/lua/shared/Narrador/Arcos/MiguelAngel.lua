-- Miguel Angel Mandados, el hijo del Cabo Ramiro (y hermano menor de Valentina).
-- Se fue de la comisaria detras de Eduardo Giovanns: quiere ser su aprendiz y seguir su
-- legado. Es valiente de mas y torpe de menos, y tiene una peculiaridad: nunca muere. Siempre
-- se salva por las minimas, casi siempre porque Eduardo llega justo a tiempo.
--   cap_cabo_5 (Historia del Cabo Ramiro, cap. 5): el Cabo pide traerlo de vuelta. Lo
--     encuentras peleando solo contra una horda; cae, y llega Eduardo a salvarlo. Despues vuelve
--     contigo a la comisaria y se queda ahi (residente "miguel_angel", inmortal).
--   miguel_evento: cada tanto Miguel Angel aparece en apuros donde estes. Casi siempre lo
--     salva Eduardo; a veces te toca a ti. Si no lo salva nadie, igual se salva.
--     Lo lanza server/Narrador/NarradorMiguel.lua.
-- Miguel Angel es inmortal en todo momento (inmortales = true, nunca se baja): "caer" es solo
-- quedar en el suelo con tres muertos encima.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"
require "Narrador/NarradorConversasDefs"

local MIGUEL = "miguel"
local EDUARDO = "eduardo"
local PERFIL_MIGUEL = { { "miguel", "k93_muldraugh_pd_02" } }
local NOMBRE_MIGUEL = { miguel = { "Miguel Angel", "Mandados" } }
local PERFIL_EDUARDO = { { "eduardo", "k93_stockyard_05" } }
local NOMBRE_EDUARDO = { eduardo = { "Eduardo", "Giovanns" } }
local FUERTE = { health = 400, damageOutput = 300 }
local LEJOS = 120

Narrador.MiguelAngel = { PERFIL = PERFIL_MIGUEL[1][2], NOMBRE = NOMBRE_MIGUEL.miguel }

-- ===========================================================================
-- Historia del Cabo Ramiro, cap. 5: el aprendiz
-- ===========================================================================
Narrador.Defs.registrar({
    id = "cap_cabo_5",
    titulo = "El aprendiz",
    titulo_menu = "Historia del Cabo Ramiro, cap. 5: el aprendiz",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "sitio", desde = "contacto", salas = { "grocery", "gasstore", "grocerystorage" },
                  respaldo = { "garage", "warehouse", "livingroom" }, min = 500, max = 1400 },
                { "decir_contacto", texto = "Civil. Tengo un hijo. Miguel Angel. No lo anote en el censo porque no se donde ponerlo. Hace una semana se fue detras del tal Eduardo Giovanns. Dice que va a ser su aprendiz. Lo vieron en {lugar:sitio}. Traigamelo. Entero, si se puede." },
                { "decir_residente", rol = "hija", retraso = 0.05, si = { "memoria", "hija_cabo", "salvada" },
                  texto = "Mi hermano chico. Se cree inmortal. Lo peor es que hasta ahora tiene razon." },
                { "mapa", lugar = "sitio", titulo = "Mapa del Cabo Ramiro: Miguel Angel" },
                { "diario", texto = "El Cabo Ramiro tiene un hijo, Miguel Angel. Se fue detras de Eduardo Giovanns. Lo vieron en {lugar:sitio}." },
            },
            salidas = { { ir = "viaje" } },
        },

        viaje = {
            pista = "Ir a {lugar:sitio} a buscar a Miguel Angel, el hijo del Cabo.",
            objetivo = "sitio",
            salidas = {
                { cuando = { "cerca", "sitio", 80 }, ir = "sitio" },
                { cuando = { "horas", 120 }, ir = "final_lo_trajo_eduardo" },
            },
        },

        -- Miguel Angel pelea solo contra una horda. Va perdiendo, pero no se entera.
        sitio = {
            pista = "Ayudar a Miguel Angel en {lugar:sitio}: van {bajas:sitio} de {horda_meta}.",
            objetivo = "sitio",
            al_entrar = {
                { "npcs", id = MIGUEL, lugar = "sitio", radio = 40, no_mas_cerca = 10, modo = "guard", correa = 10,
                  inmortales = true, postura = "friendly", salud = 150, perfiles = PERFIL_MIGUEL, nombres = NOMBRE_MIGUEL },
                { "variable", nombre = "horda_meta", valor = 9999 },
                { "oleada", lugar = "sitio", radio = 60, cantidad = 30, por_jugador = 15, fija = true, caminantes = true,
                  planta_baja = true, min = 14, max = 40, meta = "horda_meta", meta_frac = 0.8 },
                { "aviso", texto = "En {lugar:sitio} un muchacho con un casco de policia pelea solo contra una horda. Grita frases de pelicula. Ninguna le esta funcionando." },
            },
            salidas = {
                { cuando = { "grupo_listo", MIGUEL }, ir = "pelea" },
                { cuando = { "horas", 6 }, ir = "pelea" },
            },
        },

        pelea = {
            pista = "Ayudar a Miguel Angel en {lugar:sitio}: van {bajas:sitio} de {horda_meta}.",
            objetivo = "sitio",
            al_entrar = {
                { "decir", grupo = MIGUEL, rol = "miguel", texto = "Tu por la izquierda, yo por la derecha! Asi dice Eduardo. Bueno, asi dice el. Yo lo digo tambien." },
            },
            salidas = { { cuando = { "horas", 0.12 }, ir = "cae" } },
        },

        -- Cae. Y llega Eduardo, como siempre.
        cae = {
            pista = "Miguel Angel esta en el suelo. Sacarle los muertos de encima.",
            objetivo = "sitio",
            al_entrar = {
                { "aviso", texto = "Miguel Angel tropieza con su propio pie y desaparece bajo tres muertos. Desde algun lado llega un silbido que todo Knox conoce." },
                { "decir", grupo = MIGUEL, rol = "miguel", retraso = 0.02, texto = "Estoy bien! Estoy... no estoy bien! Pero voy a estar bien!" },
                { "npcs", id = EDUARDO, lugar = "sitio", radio = 30, no_mas_cerca = 8, modo = "guard", correa = 15,
                  inmortales = true, postura = "friendly", salud = 400, banderas = FUERTE, perfiles = PERFIL_EDUARDO, nombres = NOMBRE_EDUARDO },
            },
            salidas = {
                { cuando = { "grupo_listo", EDUARDO }, ir = "rescate" },
                { cuando = { "horas", 1 }, ir = "rescate" },
            },
        },

        rescate = {
            pista = "Terminar con la horda junto a Eduardo: van {bajas:sitio} de {horda_meta}.",
            objetivo = "sitio",
            al_entrar = {
                { "inmune", grupo = EDUARDO, rol = "eduardo", quien = "eduardo" },
                { "armar_legendario", grupo = EDUARDO, rol = "eduardo" },
                { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Miguel. Otra vez. Levantate, que el suelo no es lugar para un aprendiz." },
                { "decir", grupo = MIGUEL, rol = "miguel", retraso = 0.04, texto = "Maestro! Lo tenia controlado. Casi. Bueno, controlado no. Pero casi." },
            },
            salidas = {
                { cuando = { "o", { "bajas_en", "sitio", "var:horda_meta", 70 }, { { "horas", 0.5 }, { "sin_zombis", "sitio", 15 } } }, ir = "hablar" },
                { cuando = { "horas", 3 }, ir = "hablar" },
            },
        },

        hablar = {
            pista = "Hablar con Miguel Angel (clic derecho cerca de el).",
            ancla = "sitio", ancla_grupo = MIGUEL, radio = 25,
            al_entrar = {
                { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Es la cuarta vez esta semana, amigo. Tiene corazon de sobra. Lo que le falta es mirar donde pisa." },
                { "decir", grupo = MIGUEL, rol = "miguel", retraso = 0.04, texto = "Tres. La del perro no cuenta. El perro era chico." },
            },
            opciones = {
                { id = "papa", texto = "Tu papa te esta esperando en la comisaria",
                  dice = { rol = "miguel", texto = "Mi papa? Me va a anotar en la libreta. Con signo de pregunta. ... Ya. Voy. Pero Eduardo me sigue ensenando. Eso no se negocia." } },
                { id = "eduardo", texto = "Eduardo, llevatelo un tiempo contigo",
                  dice = { rol = "eduardo", texto = "No, amigo. Un aprendiz primero vuelve a su casa. Despues aprende. Asi me lo enseno mi mama. Miguel, con tu papa." } },
            },
            salidas = {
                { cuando = { "o", { "eleccion", "papa" }, { "eleccion", "eduardo" } }, ir = "escolta" },
            },
        },

        -- Va contigo a la comisaria. Eduardo sigue su camino.
        escolta = {
            pista = "Llevar a Miguel Angel a {lugar:contacto}, con el Cabo.",
            objetivo = "contacto",
            al_entrar = {
                { "retirar_lejos", grupo = EDUARDO, lugar = "sitio", radio = 70, retraso = 0.1 },
                { "acompanante", grupo = MIGUEL, rol = "miguel", nombre = "Miguel Angel", inmortal = true },
                { "banderas", grupo = MIGUEL, quietos = false, correa = 0 },
            },
            salidas = { { cuando = { "npc_cerca", MIGUEL, "contacto", 15 }, ir = "final_reencuentro" } },
        },

        final_reencuentro = { final = true, al_entrar = {
            { "soltar_acompanante", grupo = MIGUEL, rol = "miguel" },
            { "decir", grupo = MIGUEL, rol = "miguel", texto = "Papa. Antes de que digas nada: aprendi a afilar un machete y a no gritar en los techos. Lo segundo todavia no." },
            { "decir_contacto", retraso = 0.05, texto = "Miguel Angel. Firme. ... Descanse. Usted no se va de esta comisaria sin avisar nunca mas. Y si se va, avisa dos veces." },
            { "decir_residente", rol = "hija", retraso = 0.08, si = { "memoria", "hija_cabo", "salvada" },
              texto = "Volviste con todos los dedos. Te lo dije, papa: este no se muere ni aunque quiera." },
            { "reputacion", contacto = "muldraugh", cantidad = 20, motivo = "le traje a su hijo" },
            { "residentes", id = "miguel_angel", grupos = { MIGUEL }, lugar = "contacto", radio = 20, max_zombis = 2,
              charla = "miguel_angel", banderas = { invulnerable = true, persistent = true, leashRadius = 10 } },
            { "recompensa_nivel", lugar = "contacto", radio = 20 },
            { "memoria", clave = "miguel_angel", valor = "en_muldraugh" },
            { "memoria", clave = "historia_muldraugh_5", valor = true },
            { "diario", texto = "Le traje a Miguel Angel al Cabo. El Cabo abrio la libreta, busco una pagina en blanco y escribio su nombre arriba. Sin cruz y sin signo de pregunta." },
        } },

        -- No fuiste: lo trajo Eduardo (Miguel Angel nunca muere).
        final_lo_trajo_eduardo = { final = true, al_entrar = {
            { "decir_contacto", texto = "Civil. Mi hijo llego solo. Bueno, solo no: lo trajo Eduardo Giovanns en el hombro, como un saco de papas. Vivo. Siempre vivo. Usted no tuvo nada que ver." },
            { "memoria", clave = "miguel_angel", valor = "en_muldraugh" },
            { "memoria", clave = "historia_muldraugh_5", valor = "fallido" },
            { "diario", texto = "No fui a buscar a Miguel Angel. Lo trajo Eduardo a la comisaria, en el hombro. El Cabo no me miro a los ojos." },
        } },
    },
})

-- ===========================================================================
-- Miguel Angel, en apuros (evento fortuito)
-- ===========================================================================
local function V(eduardo, jugador) return { por_var = "rescate", textos = { eduardo = eduardo, otro = jugador } } end

Narrador.Defs.registrar({
    id = "miguel_evento",
    titulo = "Miguel Angel, en apuros",
    titulo_menu = "Miguel Angel: evento fortuito",
    requiere_alife = true, automatico = false,
    -- Casi siempre lo salva Eduardo; a veces te toca a ti.
    sorteo = { rescate = { valores = { "eduardo", "eduardo", "eduardo", "jugador" } }, nivel = { valores = { "medio" } } },
    inicio = "llega",
    etapas = {
        llega = {
            pista = "Alguien viene corriendo y gritando tu nombre.",
            al_entrar = {
                { "lugar_jugador", id = "aqui" },
                { "lugar_cerca", id = "llegada", de = "aqui", distancia = 20 },
                { "npcs", id = MIGUEL, lugar = "llegada", radio = 20, no_mas_cerca = 10, modo = "guard", correa = 25,
                  inmortales = true, postura = "friendly", salud = 150, perfiles = PERFIL_MIGUEL, nombres = NOMBRE_MIGUEL },
                { "aviso", texto = "Alguien viene corriendo hacia ti con un casco de policia que le baila en la cabeza. Detras, una horda." },
            },
            salidas = {
                { cuando = { "grupo_listo", MIGUEL }, ir = "apuro" },
                { cuando = { "horas", 2 }, ir = "final_nada" },
            },
        },
        apuro = {
            pista = "Miguel Angel trae una horda detras. Ayudarlo.",
            objetivo = "llegada",
            al_entrar = {
                { "decir", grupo = MIGUEL, rol = "miguel", texto = "Hola! Perdon! Los traje sin querer! Bueno, un poco queriendo: queria practicar!" },
                { "variable", nombre = "horda_meta", valor = 9999 },
                { "oleada", lugar = "llegada", radio = 50, cantidad = 25, por_jugador = 10, fija = true, caminantes = true,
                  min = 18, max = 40, meta = "horda_meta", meta_frac = 0.8, retraso = 0.03 },
            },
            salidas = { { cuando = { "horas", 0.1 }, ir = "cae" } },
        },
        cae = {
            pista = V("Miguel Angel cayo. Aguantar hasta que llegue ayuda.", "Miguel Angel cayo. Sacarle los muertos de encima."),
            objetivo = "llegada",
            al_entrar = {
                { "aviso", texto = V("Miguel Angel cae bajo tres muertos. Desde algun lado llega un silbido que todo Knox conoce.",
                    "Miguel Angel cae bajo tres muertos. Esta vez no llega nadie. Solo tu.") },
                { "decir", grupo = MIGUEL, rol = "miguel", retraso = 0.02, texto = V(
                    "Ese silbido! Es el! Ves? Siempre llega! Bueno, casi siempre! Hasta ahora siempre!",
                    "Socio! Ayuda! No es urgente! Bueno, si es urgente!") },
                { "npcs", id = EDUARDO, lugar = "llegada", radio = 30, no_mas_cerca = 8, modo = "guard", correa = 20,
                  inmortales = true, postura = "friendly", salud = 400, banderas = FUERTE, perfiles = PERFIL_EDUARDO,
                  nombres = NOMBRE_EDUARDO, si = { "var", "rescate", "eduardo" } },
            },
            salidas = {
                { cuando = { { "var", "rescate", "eduardo" }, { "grupo_listo", EDUARDO } }, ir = "con_eduardo" },
                { cuando = { "var", "rescate", "jugador" }, ir = "contigo" },
                { cuando = { "horas", 1 }, ir = "contigo" },
            },
        },
        con_eduardo = {
            pista = "Terminar con la horda junto a Eduardo: van {bajas:llegada} de {horda_meta}.",
            objetivo = "llegada",
            al_entrar = {
                { "inmune", grupo = EDUARDO, rol = "eduardo", quien = "eduardo" },
                { "armar_legendario", grupo = EDUARDO, rol = "eduardo" },
                { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Miguel. Que te dije de traer hordas de regalo?" },
                { "decir", grupo = MIGUEL, rol = "miguel", retraso = 0.04, texto = "Que no se traen. Que se esquivan. Ya se, maestro. Ya se." },
            },
            salidas = {
                { cuando = { "o", { "bajas_en", "llegada", "var:horda_meta", 70 }, { { "horas", 0.5 }, { "sin_zombis", "llegada", 15 } } }, ir = "final_eduardo" },
                { cuando = { "ausente", "aqui", LEJOS, 0.2 }, ir = "final_eduardo" },
                { cuando = { "horas", 2 }, ir = "final_eduardo" },
            },
        },
        contigo = {
            pista = "Sacarle la horda de encima a Miguel Angel: van {bajas:llegada} de {horda_meta}.",
            objetivo = "llegada",
            salidas = {
                { cuando = { "o", { "bajas_en", "llegada", "var:horda_meta", 70 }, { { "horas", 0.5 }, { "sin_zombis", "llegada", 15 } } }, ir = "final_tu" },
                { cuando = { "ausente", "aqui", LEJOS, 0.2 }, ir = "final_solo" },
                { cuando = { "horas", 2 }, ir = "final_solo" },
            },
        },
        final_eduardo = { final = true, al_entrar = {
            { "decir", grupo = EDUARDO, rol = "eduardo", texto = "Ya esta. Gracias, amigo. Si no estabas, igual llegaba. Pero contigo llegue mas tranquilo." },
            { "decir", grupo = MIGUEL, rol = "miguel", retraso = 0.04, texto = "Lo anoto en mi libreta: rescate numero... perdi la cuenta. Toma, para ti. Por aguantar." },
            { "recompensa_nivel", lugar = "llegada", radio = 20 },
            { "knox", cantidad = 5, motivo = "protegiste" },
            { "retirar_lejos", grupo = EDUARDO, lugar = "llegada", radio = 70, retraso = 0.3 },
            { "retirar_lejos", grupo = MIGUEL, lugar = "llegada", radio = 70, retraso = 0.35 },
            { "diario", texto = "Miguel Angel, el hijo del Cabo, llego con una horda detras. Cayo, como siempre, y llego Eduardo, como siempre. No se cual de los dos tiene mas suerte." },
        } },
        final_tu = { final = true, al_entrar = {
            { "decir", grupo = MIGUEL, rol = "miguel", texto = "Me salvaste! Tu! No Eduardo: tu! Te voy a anotar en la libreta, en la pagina de las leyendas. Esta casi vacia. Toma." },
            { "recompensa_nivel", lugar = "llegada", radio = 20 },
            { "knox", cantidad = 10, motivo = "protegiste" },
            { "retirar_lejos", grupo = MIGUEL, lugar = "llegada", radio = 70, retraso = 0.3 },
            { "diario", texto = "Esta vez Eduardo no llego y le saque yo los muertos de encima a Miguel Angel. Dice que me va a anotar en su pagina de leyendas. Me dio verguenza y un poco de orgullo." },
        } },
        -- Nadie lo salvo y se salvo igual (nunca muere).
        final_solo = { final = true, al_entrar = {
            { "retirar", grupo = MIGUEL },
            { "knox", cantidad = -5, motivo = "dejaste solo a Miguel Angel" },
            { "aviso", texto = "Mas tarde se sabe: Miguel Angel salio de abajo de la horda con un rasguno y una historia nueva. Nadie entiende como." },
            { "diario", texto = "Deje solo a Miguel Angel con la horda. Se salvo igual, por las minimas. Siempre se salva. Eso no me deja mejor parado." },
        } },
        final_nada = { final = true, al_entrar = {} },
    },
})

-- ===========================================================================
-- Lo que dice en la comisaria (residente "miguel_angel")
-- ===========================================================================
Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.miguel_angel = {
    { "miguel", "Eduardo dice que un heroe no es el que no tiene miedo. Es el que tiene miedo y va igual. Yo voy igual y despues me da el miedo." },
    { "miguel", "Tengo una libreta como la de mi papa. En la mia no hay cruces: hay rescates. Casi todos me los hicieron a mi." },
    { "miguel", "Ayer me cayo una muralla encima. Una muralla chica. Pero muralla." },
    { "miguel", "Socio, si ves a Eduardo, dile que estoy practicando. Que no se le olvide que tiene aprendiz." },
    { "miguel", "Mi papa me hizo planchar el uniforme con la olla. Me queme dos dedos. Dice que asi se aprende." },
    { "miguel", "Me han mordido el casco, la mochila y una bota. A mi nunca. Mi hermana dice que es suerte. Yo digo que es tecnica." },
    { "miguel", "Tu por la izquierda, yo por la derecha. Lo practico frente al espejo. El espejo siempre gana." },
    { "miguel", "Eduardo me salvo de un techo, de un pozo y de una lavanderia. La lavanderia no la quiero contar." },
    { "miguel", "Algun dia van a contar historias de mi en Knox. Ojala no sean todas de cuando me rescataron." },
    { "miguel", "Mi papa dice 'civil' a todo el mundo. A mi me dice 'Miguel Angel', completo. Eso es peor." },
    { "miguel", "Eduardo come de pie, por si hay que salir corriendo. Yo tambien como de pie. Se me cae todo." },
    { "miguel", "Hoy no me cai de ninguna parte. Lo anote. Es un record." },
}

-- Conversaciones en la comisaria (con Valentina y el Cabo).
do
    local CON_MIGUEL = { "memoria", "miguel_angel", "en_muldraugh" }
    local CON_VALENTINA = { CON_MIGUEL, { "memoria", "hija_cabo", "salvada" } }
    Narrador.Conversas.varias({
        { id = "miguel_hermanos", tipo = "ambiente", si = CON_VALENTINA,
          turnos = {
              { "hija", "Miguel, de nuevo con el casco puesto adentro?" },
              { "miguel", "Eduardo dice que hay que estar listo siempre." },
              { "hija", "Eduardo no se cae de las escaleras de la comisaria." },
              { "miguel", "Eso fue una vez. Bueno, dos. La segunda fue estrategica." },
          } },
        { id = "miguel_libreta", tipo = "ambiente", si = CON_MIGUEL,
          turnos = {
              { "cabo", "Miguel Angel. Su libreta. Que anota ahi?" },
              { "miguel", "Rescates, papa. Como tu censo, pero al reves: aca todos siguen vivos." },
              { "cabo", "... Negativo. Eso no es al reves. Eso es mejor. Siga anotando." },
          } },
        { id = "miguel_eduardo", tipo = "ambiente", si = CON_VALENTINA,
          turnos = {
              { "miguel", "Vale, cuando sea como Eduardo voy a tener un arma que brilla." },
              { "hija", "Cuando seas como Eduardo vas a mirar donde pisas." },
              { "miguel", "Las dos cosas. Primero el arma." },
          } },
    })
end
