-- Misiones del Padre Nacho que salieron del rol de los personajes (personajes/fichas): no son
-- capitulos, pero salen entre sus ofertas como ellos (G.ESPECIALES en
-- server/Narrador/NarradorGenerador.lua, sin "capitulo") y dejan su propia memoria.
--   mision_eli   "Eli Danner": antes del cap. 3. Los del patio bajan a San Judas a buscar al
--                muchacho que esconde Lucia. Deja eli_danner (salvado, riverside, muerto o
--                tarde) y lugar.san_judas; el cap. 3 lee las dos (como te recibe Lucia y donde).
--   mision_tomas "El chico de los sacos": despues del cap. 3. De la panaderia Hollis de Riverside
--                a la terminal del Greyhound de Louisville, detras de Tomas Ferrada, el hermano
--                de Lucia. Deja tomas (vivo, tumba o sin_rastro); el cap. 4 (la misa) la lee.
-- La tercera mision del rol, "La despensa", va dentro del cap. 2 (Capitulos.lua, cap_nacho_2).
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local registrar = Narrador.Defs.registrar

local LUCIA = "lucia"
local PERFIL_LUCIA = "k93_prather_08"
local NPC_LUCIA = { "npcs", id = LUCIA, radio = 35, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 5,
    inmortales = true, postura = "friendly", perfiles = { { "lucia", PERFIL_LUCIA } },
    nombres = { lucia = { "Lucia", "Ferrada" } }, femeninos = { "lucia" } }

-- Copia de una accion con campos extra (para no repetir los NPC de Lucia).
local function con(base, extra)
    local a = {}
    for k, v in pairs(base) do a[k] = v end
    for k, v in pairs(extra) do a[k] = v end
    return a
end

-- Final de una mision: deja su memoria, el diario y (si salio bien) el pago al volver con el Padre.
-- Las acciones extra van antes, en el orden en que se escriben (como en Capitulos.lua).
local function fin(clave, valor, diario, extra, pago)
    local l = {}
    for _, a in ipairs(extra or {}) do l[#l + 1] = a end
    if pago then l[#l + 1] = { "pago_encargo", lugar = "contacto", radio = 35 } end
    l[#l + 1] = { "memoria", clave = clave, valor = valor }
    l[#l + 1] = { "diario", texto = diario }
    return { final = true, al_entrar = l }
end

-- ===========================================================================
-- Eli Danner (antes del cap. 3)
-- Eli Danner, 16, de Vine Grove, Reo del patio de Pereira: desertor, le disparo el centinela del
-- vagon 14 el 17 de noviembre y llego arrastrandose a San Judas el 18. Lucia le saco la bala con
-- las pinzas de las velas y lo esconde en el coro. Pereira lo anoto muerto ("Danner, E., 31,
-- 17-nov") y le advirtio a Lucia que alguno de los suyos podia bajar por su cuenta (lucia.md,
-- pereira.md). El Padre se entera por Edith Crowe, que oyo al Diacono Reyes predicarlo en el
-- puente de Riverside (reyes.md: solo cita castigos, Numeros 32:23). Hay que llegar antes que
-- ellos (reloj de 36 horas); si no, Lucia ya lo enterro.
-- ===========================================================================
local ELI, PATIO = "eli", "patio"
local PERFIL_ELI = "k93_kessinger_06"
local PERFILES_PATIO = { { "cabo", "k93_deserters_03" }, { "soldado", "k93_deserters_02" }, { "bandido", "k93_stockyard_08" } }

registrar({
    id = "mision_eli",
    titulo = "Eli Danner",
    titulo_menu = "Mision del Padre Nacho: Eli Danner (antes del cap. 3)",
    requiere_alife = true, automatico = false,
    -- Solo antes del cap. 3 (despues ya no tiene sentido): lo mira G.ofertaEspecial.
    si = { "no", { "mem", "historia_riverside_3" } },
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "san_judas", pueblo = "March Ridge", nombre = "San Judas", salas = { "church" },
                  respaldo = { "livingroom", "office" }, cerca_del_centro = true },
                -- El cap. 3 vuelve a esta misma iglesia.
                { "memoria_lugar", lugar = "san_judas", clave = "san_judas" },
                { "reloj", id = "patio", horas = 36 },
                { "decir_contacto", texto = "Hijo. La Edith Crowe fue otra vez a la lona del Diacono, en el puente. Reyes predico Numeros: vuestro pecado os alcanzara. Dijo que en San Judas, en March Ridge, hay una oveja del patio anotada muerta que respira. Y que tres de la Sargento van a bajar a corregir la lista." },
                { "decir_contacto", retraso = 0.05, texto = "San Judas es la iglesia de Lucia. Me clavo un recado: que no mande a nadie. Te mando igual. Anda antes que ellos, hoy. Manana es tarde." },
                { "mapa", lugar = "san_judas", titulo = "Mapa del Padre Nacho: San Judas" },
                { "diario", texto = "El Diacono Reyes predico en el puente que tres hombres del patio de Pereira bajan a San Judas, en March Ridge, a 'corregir la lista': hay un muchacho anotado muerto que respira. San Judas es la iglesia de Lucia. El Padre me mando antes que ellos." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Llegar a {lugar:san_judas} antes que los hombres del patio (tienen un dia y medio).",
            objetivo = "san_judas",
            salidas = {
                { cuando = { { "cerca", "san_judas", 50 }, { "reloj_vencido", "patio" } }, ir = "tarde" },
                { cuando = { "cerca", "san_judas", 50 }, ir = "san_judas" },
                { cuando = { "horas", 96 }, ir = "final_no_fue" },
            },
        },
        san_judas = {
            pista = "Encontrar a Lucia en {lugar:san_judas}. La puerta esta abierta.",
            objetivo = "san_judas",
            al_entrar = {
                con(NPC_LUCIA, { lugar = "san_judas" }),
                { "npcs", id = ELI, lugar = "san_judas", radio = 35, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "eli", PERFIL_ELI } }, nombres = { eli = { "Eli", "Danner" } } },
                { "aviso", texto = "La puerta grande de San Judas esta abierta de par en par, llena de recados clavados. Desde el coro alguien cuenta en voz baja a los muertos de las bancas." },
            },
            salidas = {
                { cuando = { "todos_muertos", ELI }, ir = "final_muerto" },
                { cuando = { { "grupo_listo", LUCIA }, { "grupo_listo", ELI }, { "cerca", "san_judas", 25 } }, ir = "puerta" },
            },
        },
        puerta = {
            pista = "Hablar con Lucia (clic derecho cerca).",
            ancla = "san_judas", ancla_grupo = LUCIA, radio = 20,
            al_entrar = {
                { "decir", grupo = LUCIA, rol = "lucia", texto = "Pase nomas. La puerta esta abierta, como siempre. Fijese donde pisa, que hay feligreses. ... Le dije a Nacho que no mandara a nadie. Ya ve. Lo mando a usted." },
            },
            opciones = {
                { id = "avisar", texto = "Avisarle que vienen tres del patio a buscar a Eli",
                  dice = { rol = "lucia", texto = "Ya lo se. La Sargento me lo advirtio por escrito. Eli, sube al coro. ... Usted quedese en la puerta. Yo no la voy a cerrar, Dios me perdone." } },
            },
            salidas = {
                { cuando = { "todos_muertos", ELI }, ir = "final_muerto" },
                { cuando = { "eleccion", "avisar" }, ir = "patio" },
            },
        },
        patio = {
            pista = "Defender San Judas de los hombres del patio. Que no toquen a Eli.",
            objetivo = "san_judas",
            al_entrar = {
                { "detener_reloj", id = "patio" },
                { "decir", grupo = ELI, rol = "eli", texto = "La Sargento me anoto muerto. Treinta y uno, diecisiete de noviembre. Y vienen igual." },
                { "lugar_cerca", id = "calle", de = "san_judas", distancia = 30 },
                { "aviso", retraso = 0.05, texto = "Por la calle suben tres hombres, dos con el uniforme de la Guardia sin insignias. El de adelante grita: 'Hermana! Venimos a corregir la lista. Danner, E., treinta y uno. Esta mal anotado.'" },
                { "bandidos", id = PATIO, lugar = "calle", radio = 40, modo = "hunt", perfiles = PERFILES_PATIO, retraso = 0.08 },
                -- Los tiros despiertan a los muertos de March Ridge.
                { "oleada", lugar = "san_judas", radio = 50, cantidad = { 8, 12 }, min = 15, max = 30, retraso = 0.2 },
            },
            salidas = {
                { cuando = { "todos_muertos", ELI }, ir = "final_muerto" },
                { cuando = { "todos_muertos", PATIO }, ir = "despues" },
                -- Si te vas, los del patio hacen lo que vinieron a hacer.
                { cuando = { "ausente", "san_judas", 90, 0.5 }, ir = "final_muerto" },
            },
        },
        despues = {
            pista = "Hablar con Lucia y Eli (clic derecho cerca). Eli se queda en San Judas o va a Riverside.",
            ancla = "san_judas", ancla_grupo = LUCIA, radio = 20,
            al_entrar = {
                { "decir", grupo = LUCIA, rol = "lucia", texto = "Dios se lo pague. Yo no tengo con que, pero le canto una estrofa entera, sin equivocarme. ... La Sargento no los mando. Me lo advirtio. Que Dios la cuide a ella tambien." },
                { "decir", grupo = ELI, rol = "eli", retraso = 0.03, texto = "Gracias, senor. En el patio me decian Reo. Aca la hermana me dice Eli." },
            },
            opciones = {
                { id = "quedarse", texto = "Que Eli se quede con Lucia, cuidando la puerta",
                  dice = { rol = "lucia", texto = "Se queda. Le voy a ensenar a clavar recados. ... A Nacho digale que el muchacho esta vivo. Lo demas se lo digo yo en la cara." } },
                { id = "riverside", texto = "Llevar a Eli a Riverside, con el Padre: alla el patio no lo busca",
                  dice = { { rol = "lucia", texto = "Llevelo. Aca la puerta canta y vienen los muertos; alla por lo menos el techo es de piedra. Digale a Nacho que no es un recado. Es un muchacho." },
                           { grupo = ELI, rol = "eli", texto = "Con el cura boxeador? ... Ya. Cojeando, pero llego." } } },
            },
            salidas = {
                { cuando = { "todos_muertos", ELI }, ir = "final_muerto" },
                { cuando = { "eleccion", "quedarse" }, ir = "volver" },
                { cuando = { "eleccion", "riverside" }, ir = "escolta" },
            },
        },
        volver = {
            pista = "Volver con el Padre Nacho y contarle lo de San Judas.",
            ancla = "contacto",
            al_entrar = { { "retirar_lejos", grupo = LUCIA, lugar = "san_judas", radio = 60, retraso = 0.5 },
                          { "retirar_lejos", grupo = ELI, lugar = "san_judas", radio = 60, retraso = 0.5 } },
            opciones = { { id = "contar", texto = "Contarle al Padre que Eli esta vivo, con Lucia" } },
            salidas = { { cuando = { "eleccion", "contar" }, ir = "final_cumplido_salvado" } },
        },
        escolta = {
            pista = "Eli Danner va por su cuenta a la iglesia del Padre Nacho. Vuelve con el Padre: te espera alla.",
            objetivo = "contacto",
            al_entrar = {
                { "retirar_lejos", grupo = LUCIA, lugar = "san_judas", radio = 60, retraso = 0.5 },
                { "acompanante", grupo = ELI, rol = "eli", nombre = "Eli Danner", inmortal = false },
                { "banderas", grupo = ELI, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", ELI }, ir = "final_muerto" },
                { cuando = { "npc_cerca", ELI, "contacto", 15 }, ir = "final_cumplido_riverside" },
            },
        },
        -- Llegaste despues del dia y medio: Lucia ya lo enterro.
        tarde = {
            pista = "Entrar a {lugar:san_judas}.",
            objetivo = "san_judas",
            al_entrar = {
                con(NPC_LUCIA, { lugar = "san_judas" }),
                { "nota", lugar = "san_judas", titulo = "Papel clavado en la puerta de San Judas",
                  texto = "Lista corregida. Danner, E., 31. 17-nov." },
            },
            salidas = {
                { cuando = { { "grupo_listo", LUCIA }, { "cerca", "san_judas", 25 } }, ir = "tarde_hablar" },
                { cuando = { "horas", 1 }, ir = "final_tarde" },
            },
        },
        tarde_hablar = {
            al_entrar = {
                { "decir", grupo = LUCIA, rol = "lucia", texto = "Usted llego tarde. Ya lo se. Igual lo estaba esperando, que es lo peor de esperar. ... Vinieron anoche, tres. Eli esta al lado de los tomates. Le cante las cuatro estrofas." },
            },
            salidas = { { cuando = { "horas", 0.1 }, ir = "final_tarde" } },
        },
        final_cumplido_salvado = fin("eli_danner", "salvado",
            "Los hombres del patio no tocaron a Eli Danner. Se quedo en San Judas con Lucia, cuidando la puerta y aprendiendo a clavar recados. Le conte al Padre que estaba vivo. Se quedo mirando la primera fila vacia un rato largo.",
            { { "decir_contacto", texto = "Vivo. ... Bien, hijo. Te abrieron la puerta. Esa mujer no le abre a cualquiera: le abre a todos, que es distinto. Toma." } }, true),
        final_cumplido_riverside = fin("eli_danner", "riverside",
            "Traje a Eli Danner a Riverside. El Padre lo anoto en la lista sin signo de pregunta y le paso un balde. Lucia se quedo en San Judas, con la puerta abierta y un recado menos que cantar.",
            { { "soltar_acompanante", grupo = ELI, rol = "eli" },
              { "decir_contacto", texto = "Eli Danner. Te anoto en la lista, hijo, sin signo de pregunta. Aca se carga agua y no se pregunta de donde viene nadie. ... Gracias. Toma." },
              { "decir", grupo = ELI, rol = "eli", retraso = 0.05, texto = "La hermana me dijo que usted pega fuerte. ... No se ve tan malo." },
              { "salvado_campamento", contacto = "riverside", nombre = "Eli", apellido = "Danner", perfil = PERFIL_ELI,
                grupo = ELI, rol = "eli", si = { "vivo", ELI, "eli" } },
              { "retirar_lejos", grupo = ELI, lugar = "contacto", radio = 40, retraso = 1 } }, true),
        final_muerto = fin("eli_danner", "muerto",
            "Eli Danner murio en San Judas. Lucia lo enterro al lado de los tomates del padre Ames y le canto las cuatro estrofas sin equivocarse. A mi me dijo que pelee, que eso lo vio. Despues me pidio que me fuera, que tenia que cantar.",
            { { "soltar_acompanante", grupo = ELI, rol = "eli" },
              { "decir", grupo = LUCIA, rol = "lucia", texto = "Lo voy a enterrar al lado de los tomates. ... Usted peleo. Eso lo vi. Vayase ahora, que tengo que cantar." },
              { "retirar_lejos", grupo = LUCIA, lugar = "san_judas", radio = 60, retraso = 0.5 },
              { "retirar_lejos", grupo = ELI, lugar = "san_judas", radio = 60, retraso = 0.5 },
              { "decir_contacto", texto = "Lo se, hijo. Te lo veo en la cara. ... El que se sienta se muere. Anda a lavarte." } }),
        final_tarde = fin("eli_danner", "tarde",
            "Llegue tarde a San Judas. Los del patio habian venido la noche antes y dejaron un papel clavado en la puerta: 'Lista corregida'. Lucia enterro a Eli Danner al lado de los tomates. Me dijo que igual me estaba esperando, que es lo peor de esperar.",
            { { "retirar_lejos", grupo = LUCIA, lugar = "san_judas", radio = 60, retraso = 0.5 },
              { "decir_contacto", texto = "Tarde. ... Yo tambien, una vez. Lo que importa es... no. Hoy no importa nada, hijo." } }),
        final_no_fue = fin("eli_danner", "tarde",
            "Nunca llegue a San Judas. El Padre supo despues, por la Edith Crowe, que los del patio corrigieron la lista. Eli Danner esta enterrado al lado de los tomates de March Ridge.",
            { { "decir_contacto", texto = "Corrigieron la lista, hijo. Lo predico el Diacono en el puente. ... No te reto. Ya me reto yo." } }),
        final_abandonado = fin("eli_danner", "tarde",
            "Le dije al Padre que no iba a ir a San Judas. Despues supe que los del patio corrigieron la lista. Eli Danner esta enterrado en March Ridge.",
            {}),
    },
})

-- ===========================================================================
-- El chico de los sacos (despues del cap. 3)
-- Tomas Ferrada ("Tom", 15) cargaba sacos en la panaderia de Walt Hollis desde la primavera
-- del 92 y dormia en la bodega. Los domingos se comia el pan duro en la escalera del Padre, sin
-- entrar. Yvonne lo vio por ultima vez el viernes 9 de julio a las 7:00; el sabado 10 no llego a
-- las 3:30, por primera vez en un ano. En su casillero tenia el horario del Greyhound Riverside -
-- Louisville con la salida de las 5:40 marcada (lucia.md, yvonne_bell.md, nacho.md, CANON). La
-- historia lo decide: tomo ese bus a buscar a su hermana a Santa Ines (Shelby St.), donde ella ya
-- no estaba, y se quedo en la terminal esperando que llegara un bus con ella. Se fue a las 5:40:
-- no supo que a Walt lo mordieron a las 7:20.
-- ===========================================================================
local TOMAS = "tomas"
local PERFIL_TOMAS = "k93_kessinger_02"
local LUCIA_VIVA = { "memoria", "lucia", "en_riverside" }

registrar({
    id = "mision_tomas",
    titulo = "El chico de los sacos",
    titulo_menu = "Mision del Padre Nacho: el chico de los sacos (despues del cap. 3)",
    requiere_alife = true, automatico = false,
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "panaderia", pueblo = "Riverside", nombre = "la panaderia Hollis", salas = { "bakery*" },
                  respaldo = { "grocery", "restaurantkitchen", "kitchen" }, cerca_del_centro = true },
                { "decir_contacto", texto = "Hijo. El Tom de los sacos. Tomas Ferrada. Los domingos se comia el pan duro en mi escalera y nunca entro. Lo tengo en la lista con signo de pregunta desde el 92. Lo busque sin salir de Riverside: la bodega de granos, la calle del correo. Nada." },
                { "decir_contacto", retraso = 0.04, texto = "Me falta la panaderia de Walt Hollis, en {lugar:panaderia}. Esta cerrada con llave desde el 10 de julio. Anda tu. Yo no me muevo de esta puerta, ya sabes." },
                { "decir_contacto", retraso = 0.06, si = LUCIA_VIVA, texto = "Lucia lo canta todas las tardes. Ya no le alcanza con cantar. A mi tampoco." },
                { "decir_contacto", retraso = 0.06, si = { "memoria", "lucia", "muerta" }, texto = "A Lucia la enterramos con la tarjeta. Se lo debo a ella, hijo. Y a el." },
                { "mapa", lugar = "panaderia", titulo = "Mapa del Padre Nacho: la panaderia Hollis" },
                { "diario", texto = "El Padre me pidio buscar al Tom de los sacos: Tomas Ferrada, el hermano de Lucia, que cargaba sacos en la panaderia de Walt Hollis y desaparecio el 10 de julio. Empiezo por la panaderia, en {lugar:panaderia}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:panaderia}, donde Tomas cargaba sacos.",
            objetivo = "panaderia",
            salidas = { { cuando = { "cerca", "panaderia", 40 }, ir = "panaderia" } },
        },
        panaderia = {
            pista = "Buscar el casillero de Tomas en {lugar:panaderia}.",
            objetivo = "panaderia",
            al_entrar = {
                { "aviso", texto = "La panaderia Hollis esta cerrada con llave desde julio; la llave la tiene Yvonne Bell, colgada al cuello. Adentro todavia huele a pan quemado: nadie saco las bandejas de las seis." },
                { "oleada", lugar = "panaderia", radio = 40, cantidad = { 8, 12 }, min = 12, max = 30 },
                { "nota", lugar = "panaderia", titulo = "El casillero de 'Tom'",
                  texto = "Pegado con cinta en la puerta del casillero: el horario del Greyhound Riverside - Louisville. La salida de las 5:40 del sabado esta marcada con lapiz, dos veces. Abajo, con letra apretada y en castellano: 'Lucia. Hermanas de Santa Ines, Shelby St., Louisville.' Adentro, una camisa doblada y nada mas." },
                { "objeto", id = "horario", lugar = "panaderia", tipo = { "Base.SheetPaper2", "Base.Notebook" },
                  nombre = "El horario del Greyhound de Tomas" },
            },
            salidas = { { cuando = { "alguien_tiene", "horario" }, ir = "pista" } },
        },
        pista = {
            al_entrar = {
                { "lugar", id = "terminal", pueblo = "Louisville", nombre = "la terminal del Greyhound",
                  salas = { "bus*", "transit*", "ticket*" }, respaldo = { "office", "restaurant", "cafe" }, cerca_del_centro = true },
                { "mapa", lugar = "terminal", titulo = "Mapa del Padre Nacho: la terminal del Greyhound" },
                { "diario", texto = "En el casillero de Tomas estaba el horario del Greyhound a Louisville, con la salida de las 5:40 del sabado marcada dos veces, y la direccion de las hermanas de Santa Ines, donde estuvo Lucia. El sabado 10 no llego a la panaderia a las 3:30. El bus salia dos horas despues. Se fue a buscar a su hermana." },
            },
            salidas = { { ir = "viaje_terminal" } },
        },
        viaje_terminal = {
            pista = "Ir a {lugar:terminal}: Tomas tomo el bus de las 5:40 del 10 de julio.",
            objetivo = "terminal",
            salidas = {
                { cuando = { "cerca", "terminal", 60 }, ir = "terminal" },
                { cuando = { "horas", 120 }, ir = "final_sin_rastro" },
            },
        },
        terminal = {
            pista = "Buscar a Tomas en {lugar:terminal}: van {bajas:terminal} de {meta_terminal}.",
            objetivo = "terminal",
            al_entrar = {
                { "variable", nombre = "meta_terminal", valor = 9999 },
                { "aviso", texto = "La terminal del Greyhound tiene los vidrios rotos y un bus atravesado en la salida. En la pizarra de llegadas alguien escribio con tiza, en castellano: 'Lucia Ferrada: tu hermano te espera aca.'" },
                { "nota", lugar = "terminal", titulo = "Un cuaderno en la banca de la terminal",
                  texto = "10 de julio, 6:20. Llego el bus. En Shelby St las hermanas no abren. Una me grita por la ventana que Lucia se fue el 92 a una parroquia chica. No sabe cual. Me quedo aca: aca llegan los buses.\nAgosto. Ya no llegan buses. Me quedo igual. Si me voy y ella viene, no la veo.\nNoviembre. Tengo la maquina del cafe y la de los dulces. Tom." },
                { "npcs", id = TOMAS, lugar = "terminal", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "tomas", PERFIL_TOMAS } }, nombres = { tomas = { "Tomas", "Ferrada" } } },
                { "oleada", lugar = "terminal", radio = 55, cantidad = 30, por_jugador = 10, fija = true, caminantes = true,
                  min = 15, max = 40, meta = "meta_terminal", meta_frac = 0.8, retraso = 0.05 },
                { "oleada", lugar = "terminal", radio = 55, cantidad = { 8, 12 }, correr = true, min = 25, max = 45, retraso = 0.4 },
            },
            salidas = {
                { cuando = { "todos_muertos", TOMAS }, ir = "final_tumba" },
                { cuando = { { "grupo_listo", TOMAS }, { "o", { "bajas_en", "terminal", "var:meta_terminal", 70 },
                    { { "horas", 1 }, { "sin_zombis", "terminal", 15 } } } }, ir = "hablar" },
            },
        },
        hablar = {
            pista = "Hablar con Tomas (clic derecho cerca).",
            ancla = "terminal", ancla_grupo = TOMAS, radio = 20,
            al_entrar = {
                { "decir", grupo = TOMAS, rol = "tomas", texto = "Usted viene de Riverside? Huele a Riverside. ... Me dicen Tom. Me vine el sabado en el de las 5:40, a buscar a mi hermana. No estaba. Me quede, por si llegaba un bus con ella. Y el patron Walt? La senora Yvonne?" },
            },
            opciones = {
                { id = "lucia", si = LUCIA_VIVA, texto = "Decirle que Lucia esta viva, en la iglesia de Riverside",
                  dice = { rol = "tomas", texto = "En Riverside? En la iglesia del cura de la escalera? ... Ella se fue un domingo. Yo me fui un sabado. Quedamos a mano. Vamos." } },
                { id = "padre", si = { "no", LUCIA_VIVA }, texto = "Decirle que el Padre de Riverside lo tiene en su lista y lo espera",
                  dice = { rol = "tomas", texto = "El cura de la escalera? Nunca entre a su iglesia. ... Y mi hermana? ... No me diga. Que me lo diga el, en la cara." } },
            },
            salidas = {
                { cuando = { "todos_muertos", TOMAS }, ir = "final_tumba" },
                { cuando = { "o", { "eleccion", "lucia" }, { "eleccion", "padre" } }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Tomas va por su cuenta a la iglesia del Padre Nacho. Vuelve con el Padre: te espera alla.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = TOMAS, rol = "tomas", nombre = "Tomas Ferrada", inmortal = false },
                { "banderas", grupo = TOMAS, quietos = false, correa = 0 },
            },
            salidas = {
                { cuando = { "todos_muertos", TOMAS }, ir = "final_tumba" },
                { cuando = { "npc_cerca", TOMAS, "contacto", 15 }, ir = "llegada" },
            },
        },
        llegada = {
            al_entrar = {
                { "soltar_acompanante", grupo = TOMAS, rol = "tomas" },
                { "decir_contacto", texto = "Tomas Ferrada. Le borro el signo de pregunta, hijo. ... Pasa, Tom. Esta vez entras. La puerta esta abierta, como siempre." },
                { "lugar_cerca", id = "primera_fila", de = "contacto", distancia = 3 },
                -- Si Lucia volvio a Riverside (cap. 3), sale de la iglesia.
                con(NPC_LUCIA, { lugar = "primera_fila", radio = 20, no_mas_cerca = 2, si = LUCIA_VIVA }),
                { "aviso", retraso = 0.03, si = LUCIA_VIVA, texto = "Lucia sale de la iglesia con el breviario en la mano. Se para en la escalera, donde Tomas se comia el pan los domingos." },
                { "decir_contacto", retraso = 0.03, si = { "no", LUCIA_VIVA },
                  texto = "Tu hermana vino a buscarte, Tom, a su manera. Esta enterrada atras, con una tarjeta mia. Anda a verla. Yo voy despues. No antes." },
            },
            salidas = {
                { cuando = { "no", LUCIA_VIVA }, ir = "final_cumplido_vivo" },
                { cuando = { "grupo_listo", LUCIA }, ir = "reencuentro" },
                { cuando = { "horas", 0.5 }, ir = "final_cumplido_vivo" },
            },
        },
        reencuentro = {
            al_entrar = {
                { "decir", grupo = LUCIA, rol = "lucia", texto = "Tomas. ... Me dijiste que yo tambien me fui un domingo. Tenias razon. No te pregunto donde estabas. Ven. Sientate conmigo, adelante." },
                { "decir", grupo = TOMAS, rol = "tomas", retraso = 0.04, texto = "Tom. Me dicen Tom. ... Ya. Tomas." },
            },
            salidas = { { cuando = { "horas", 0.15 }, ir = "final_cumplido_vivo" } },
        },
        final_cumplido_vivo = fin("tomas", "vivo", { por_var = "lucia_viva", textos = {
                si = "Traje a Tomas Ferrada de la terminal del Greyhound de Louisville. Lucia salio a la escalera de la iglesia, la misma donde el se comia el pan los domingos, y le dijo que tenia razon: ella tambien se fue un domingo. El Padre le borro el signo de pregunta de la lista.",
                otro = "Traje a Tomas Ferrada de la terminal del Greyhound de Louisville. El Padre le borro el signo de pregunta de la lista y lo llevo atras, a la tumba de su hermana. Tomas entro a la iglesia por primera vez, despues." } },
            { { "variable", nombre = "lucia_viva", valor = "si", si = LUCIA_VIVA },
              { "soltar_acompanante", grupo = TOMAS, rol = "tomas" },
              { "decir_contacto", retraso = 0.05, texto = "Dios te lo pague, hijo. Y si El no paga, te pago yo. Toma. ... Un signo de pregunta menos. Me quedan muchos, pero uno menos." },
              { "salvado_campamento", contacto = "riverside", nombre = "Tomas", apellido = "Ferrada", perfil = PERFIL_TOMAS,
                grupo = TOMAS, rol = "tomas", si = { "vivo", TOMAS, "tomas" } },
              { "retirar_lejos", grupo = TOMAS, lugar = "contacto", radio = 40, retraso = 1.5 },
              { "retirar_lejos", grupo = LUCIA, lugar = "contacto", radio = 40, retraso = 1.5 } }, true),
        final_tumba = fin("tomas", "tumba", { por_var = "lucia_viva", textos = {
                si = "Tomas Ferrada murio antes de llegar a Riverside. Lo enterre donde cayo, con una tabla que dice Tom. El Padre le cambio el signo de pregunta por una cruz, con nombre. Esa tarde Lucia no canto el recado de su hermano: canto 'Gracias a la vida', que nunca canta delante de los muertos.",
                otro = "Tomas Ferrada murio antes de llegar a Riverside. Lo enterre donde cayo, con una tabla que dice Tom. El Padre le cambio el signo de pregunta por una cruz, con nombre, y le hizo otra al lado de la de Lucia." } },
            { { "variable", nombre = "lucia_viva", valor = "si", si = LUCIA_VIVA },
              { "soltar_acompanante", grupo = TOMAS, rol = "tomas" },
              { "decir_contacto", texto = "Tomas Ferrada. Le borro el signo de pregunta y le pongo cruz. Con nombre, hijo. Con nombre." } }),
        final_sin_rastro = fin("tomas", "sin_rastro",
            "Nunca llegue a la terminal del Greyhound de Louisville. Tomas Ferrada sigue con signo de pregunta en la lista del Padre.",
            { { "decir_contacto", texto = "Sigue con signo de pregunta, hijo. Los signos de pregunta no se borran solos. Tampoco se tachan." } }),
        final_abandonado = fin("tomas", "sin_rastro",
            "Le dije al Padre que no iba a seguir buscando a Tomas Ferrada. Sigue con signo de pregunta en su lista.",
            {}),
    },
})
