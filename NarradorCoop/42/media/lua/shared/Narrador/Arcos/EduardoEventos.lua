-- Eventos fortuitos de Eduardo Giovanns (ver ROADMAP, A). Despues de conocerlo (memoria
-- "tomas_conocido"), cada tanto llega corriendo donde estas y avisa:
--   horda    : una horda gigantesca detras de el (60 + 20 por jugador extra).
--   bandidos : "Vienen bandidos detras mio. Escondete o pelea conmigo."
-- Puedes pelear con el o esconderte (quedarte cerca sin pelear). Si te vas lejos mientras
-- pelea, lo abandonaste: -15 de Knox. Si ganan peleando juntos: +10 y botin dificil.
-- Eduardo es inmune: si cae, vuelve al cuartel de la Chela (C.REGRESOS).
-- Lo lanza server/Narrador/NarradorEduardo.lua. Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local TOMAS = "tomas"
local LEJOS = 120

local function V(horda, bandidos) return { por_var = "variante", textos = { horda = horda, otro = bandidos } } end

Narrador.Defs.registrar({
    id = "eduardo_evento",
    titulo = "Eduardo, corriendo",
    titulo_menu = "Eduardo: evento fortuito",
    requiere_alife = true, automatico = false,
    sorteo = { variante = { valores = { "horda", "bandidos" } }, nivel = { valores = { "dificil" } } },
    inicio = "llega",
    etapas = {
        llega = {
            pista = "Alguien viene corriendo hacia ti.",
            al_entrar = {
                { "lugar_jugador", id = "aqui" },
                { "lugar_cerca", id = "llegada", de = "aqui", distancia = 20 },
                { "npcs", id = TOMAS, lugar = "llegada", radio = 20, no_mas_cerca = 10, modo = "guard", correa = 25,
                  inmortales = true, postura = "friendly", salud = 400, banderas = { health = 400, damageOutput = 300 },
                  perfiles = { { "tomas", "k93_stockyard_05" } }, nombres = { tomas = { "Eduardo", "Giovanns" } } },
                { "aviso", texto = V("Alguien viene corriendo hacia ti. Detras, un ruido como de rio: pies, cientos de pies.",
                    "Alguien viene corriendo hacia ti. Detras, disparos.") },
            },
            salidas = {
                { cuando = { "grupo_listo", TOMAS }, ir = "aviso" },
                { cuando = { "horas", 2 }, ir = "final_nada" },
            },
        },
        aviso = {
            pista = "Eduardo te pide ayuda: pelear con el o esconderte (clic derecho cerca).",
            ancla = "aqui", ancla_grupo = TOMAS, radio = 30,
            al_entrar = {
                { "inmune", grupo = TOMAS, rol = "tomas", quien = "tomas" },
                { "armar_legendario", grupo = TOMAS, rol = "tomas" },
                { "decir", grupo = TOMAS, rol = "tomas", texto = V(
                    "Amigo! Viene una horda detras mio. Gigante. Escondete o pelea conmigo, pero decide ya.",
                    "Vienen bandidos detras mio. Escondete o pelea conmigo. No hay tiempo para mas.") },
                { "oleada", lugar = "llegada", radio = 50, cantidad = 60, por_jugador = 20, fija = true, caminantes = true,
                  min = 20, max = 45, meta = "horda_meta", meta_frac = 0.8, retraso = 0.05, si = { "var", "variante", "horda" } },
                { "bandidos", id = "bandidos", lugar = "llegada", radio = 60, modo = "hunt", cantidad = { 4, 6 }, retraso = 0.05,
                  si = { "var", "variante", "bandidos" } },
            },
            opciones = {
                { id = "pelear", texto = "Pelear junto a Eduardo",
                  dice = { rol = "tomas", texto = "Asi me gusta. Tu por la izquierda, yo por la derecha." } },
                { id = "esconderse", texto = "Esconderte y dejar que el se encargue",
                  dice = { rol = "tomas", texto = "Bien. Escondido es mejor que muerto. No te alejes mucho, por si acaso." } },
            },
            salidas = {
                { cuando = { "eleccion", "pelear" }, ir = "pelea" },
                { cuando = { "eleccion", "esconderse" }, ir = "escondido" },
                { cuando = { "ausente", "aqui", LEJOS, 0.15 }, ir = "final_abandonado" },
                { cuando = { "horas", 0.3 }, ir = "pelea" },
            },
        },
        pelea = {
            pista = V("Pelear con Eduardo contra la horda: van {bajas:llegada} de {horda_meta}.", "Pelear con Eduardo contra los bandidos."),
            objetivo = "llegada",
            al_entrar = { { "banderas", grupo = TOMAS, inmortales = false } },
            salidas = {
                { cuando = { "todos_muertos", TOMAS }, ir = "final_cayo" },
                { cuando = { "ausente", "aqui", LEJOS, 0.2 }, ir = "final_abandonado" },
                { cuando = { { "var", "variante", "horda" }, { "o", { "bajas_en", "llegada", "var:horda_meta", 70 },
                    { { "horas", 0.5 }, { "sin_zombis", "llegada", 15 } } } }, ir = "final_ganado" },
                { cuando = { { "var", "variante", "bandidos" }, { "todos_muertos", "bandidos" } }, ir = "final_ganado" },
            },
        },
        escondido = {
            pista = "Quedarte escondido cerca mientras Eduardo pelea. No te alejes.",
            al_entrar = { { "banderas", grupo = TOMAS, inmortales = false } },
            salidas = {
                { cuando = { "todos_muertos", TOMAS }, ir = "final_cayo" },
                { cuando = { "ausente", "aqui", LEJOS, 0.2 }, ir = "final_abandonado" },
                { cuando = { { "var", "variante", "bandidos" }, { "todos_muertos", "bandidos" } }, ir = "final_escondido" },
                { cuando = { "horas", 0.6 }, ir = "final_escondido" },
            },
        },
        final_ganado = { final = true, al_entrar = {
            { "banderas", grupo = TOMAS, inmortales = true },
            { "decir", grupo = TOMAS, rol = "tomas", texto = V(
                "Uff. No fui yo, fuimos los dos. Y la suerte. Mucha suerte. Toma, encontre esto por ahi.",
                "Se acabo. No eran malos, eran gente con hambre y un arma. Toma, era de ellos. Les sobraba.") },
            { "recompensa_nivel", lugar = "aqui", radio = 20 },
            { "knox", cantidad = 10, motivo = "protegiste" },
            { "retirar_lejos", grupo = TOMAS, lugar = "aqui", radio = 70, retraso = 0.3 },
            { "diario", texto = V("Eduardo llego corriendo con una horda detras. Peleamos juntos y salimos vivos. Dijo que fue suerte. No fue suerte.",
                "Eduardo llego con bandidos detras. Peleamos juntos. Me dejo lo que traian. Dijo que no eran malos, solo tenian hambre.") },
        } },
        final_escondido = { final = true, al_entrar = {
            { "banderas", grupo = TOMAS, inmortales = true },
            { "decir", grupo = TOMAS, rol = "tomas", texto = "Ya esta. Puedes salir. No te preocupes, a mi tambien me da miedo. Solo que corro para el otro lado." },
            { "retirar_lejos", grupo = TOMAS, lugar = "aqui", radio = 70, retraso = 0.3 },
            { "diario", texto = "Eduardo peleo solo mientras yo me escondia. Cuando termino me dijo que a el tambien le da miedo. No le crei." },
        } },
        final_abandonado = { final = true, al_entrar = {
            { "knox", cantidad = -15, motivo = "abandonaste a Eduardo" },
            { "huella", acto = "lo_dejaste", texto = "Deje solo a Eduardo Giovanns peleando por los dos." },
            { "diario", texto = "Me fui lejos mientras Eduardo peleaba. En Knox se va a saber. Siempre se sabe." },
        } },
        final_cayo = { final = true, al_entrar = {
            { "diario", texto = "Eduardo cayo peleando. Si es como dicen, va a aparecer en el cuartel de su mama, como si nada." },
        } },
        final_nada = { final = true, al_entrar = {} },
    },
})
