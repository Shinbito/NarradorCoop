-- La venganza de Meulen (ver ROADMAP). Meulen Canupan murio (en el escondite de Sous o en el
-- patio de trenes), pero un tiempo despues vuelve: dice que la Pachamama lo trajo de vuelta.
-- Lo lanza server/Narrador/NarradorVenganzaMeulen.lua, una sola vez.
--
--   1. Presagio: una lata de atun con lechuga en la puerta de tu refugio y una nota firmada.
--   2. Asalto: la banda de saqueadores de Meulen ataca el refugio, en dos tandas. Meulen no
--      viene (manda a los suyos); los matones traen sus papeles: notas, mapas y atun con lechuga.
--      Si no estabas en casa, la saquean igual y te dejan la nota.
--   3. Persecucion: un mapa que se le cayo -> el cuerpo de un maton que dejaron atras ->
--      los rezagados con la libreta de Meulen -> su guarida nueva.
--   4. La guarida: Meulen con su banda, ya sin suerte. Se le mata de verdad.
-- Final: memoria "meulen_final" = "muerto" (abre el reclutamiento de Sous). Si no lo persigues,
-- no se termina: cada VM.ACOSO horas sin avanzar te manda matones donde estes (etapa "acoso").
--
-- Ids internos con "maulen" (perfiles narrador_maulen_banda y narrador_banda_0x de Sous.lua).
-- Textos sin tildes a proposito (ver nota en FamiliaInfectada.lua).

require "Narrador/NarradorDefs"
require "Narrador/Arcos/Sous"

Narrador.Charlas = Narrador.Charlas or {}

local VM = Narrador.VenganzaMeulen or {}
Narrador.VenganzaMeulen = VM

-- Horas sin avanzar en la persecucion antes de que Meulen te mande matones otra vez.
VM.ACOSO = 36

-- Lo que traen todos los de la banda en los bolsillos (Meulen les ensena a comer): atun con lechuga.
local ATUN_LECHUGA = { { "Base.TunaTin", "Base.TinnedBeans" }, { "Base.Lettuce", "Base.Cabbage" } }
local function bolsillos(n)
    local items = {}
    for _ = 1, n do items[#items + 1] = ATUN_LECHUGA[1]; items[#items + 1] = ATUN_LECHUGA[2] end
    return items
end

local MEULEN = { { "maulen", "narrador_maulen_banda" } }
local NOMBRES = { maulen = { "Meulen", "Canupan" } }
local MATONES = {
    { "maton1", "narrador_banda_01" }, { "maton2", "narrador_banda_02" }, { "maton3", "narrador_banda_03" },
    { "maton4", "narrador_banda_04" }, { "maton5", "narrador_banda_05" }, { "maton6", "narrador_banda_06" },
    { "maton7", "narrador_banda_07" },
}

-- Sous aliado y su lider vivo (para los avisos por radio).
local SOUS_ALIADO = { { "memoria", "sous", "aliados" }, { "mem", "sous_lider_nombre" } }
local HANZ_VIVO = { { "memoria", "sous", "aliados" }, { "no", { "memoria", "sous_murio_hanz", true } } }

-- Los matones de Meulen en el asalto (el no viene: manda a los suyos).
Narrador.Charlas.venganza_asalto = {
    { "maton1", "Mari mari, peni! Te manda saludos el jefe. Dice que te acuerdes de el." },
    { "maton2", "El jefe dice que la Pachamama lo trajo de vuelta. Yo no pregunto, yo cobro." },
    { "maton3", "Atun con lechuga pa todos, dijo el jefe. Y despues tu casa." },
    { "maton1", "Cuantas latas tienes? El jefe ya las conto desde afuera." },
    { "maton4", "Sous le quito todo al jefe. Ahora le toca a tu casa." },
    { "maton2", "El jefe no vino, no. El jefe nunca viene. Por algo sigue vivo." },
    { "maton5", "Si me matas, revisa bien. El jefe nos hace cargar sus papeles." },
}

-- Meulen en su guarida: ya sin suerte.
Narrador.Charlas.venganza_guarida = {
    { "maulen", "Llegaste. Siempre llegan. Nadie me deja tranquilo con mi atun." },
    { "maulen", "Aca no hay Pachamama que valga, peni. Aca estamos tu y yo no mas." },
    { "maulen", "La PDI no me encontro. Sous no me encontro. La muerte no me quiso. Y tu si?" },
    { "maulen", "Pewkallal, peni. Esta vez uno de los dos no se va caminando." },
    { "maulen", "Me fume el ultimo antes de que llegaras. Algo me decia." },
    { "maulen", "Cabros, el de la puerta es mio. Los demas, hagan lo que quieran." },
    { "maulen", "Mi chuchu decia que uno es de la tierra. Parece que la tierra me quiere de vuelta." },
}

-- Una parada de la persecucion: llegar al lugar o perderle el rastro.
-- Si no avanzas en VM.ACOSO horas, Meulen te manda matones (etapa "acoso") y despues vuelves
-- a esta misma parada ("volver_a").
local function tramo(pista, lugar, siguiente, radio, id)
    return {
        pista = pista,
        salidas = {
            { cuando = { "cerca", lugar, radio or 45 }, ir = siguiente },
            { cuando = { "horas", VM.ACOSO }, ir = "acoso" },
        },
        al_entrar = { { "variable", nombre = "volver_a", valor = id } },
    }
end

Narrador.Defs.registrar({
    id = "venganza_meulen",
    titulo = "La venganza de Meulen",
    titulo_menu = "Sous: la venganza de Meulen",
    requiere_alife = true,
    automatico = false,
    vars_desde_memoria = { "sous", "sous_lider_nombre" },
    inicio = "presagio",

    etapas = {
        -- La lata de atun en la puerta.
        presagio = {
            pista = "Algo raro paso en {lugar:casa}.",
            al_entrar = {
                { "lugar_casa", id = "casa" },
                { "lugar_cerca", id = "llegada", de = "casa", distancia = 35 },
                { "lugar_cerca", id = "llegada2", de = "casa", distancia = -35 },
                { "faccion", id = "narrador_banda_maulen", postura = "hostile" },
                { "recompensa", lugar = "casa", radio = 40, items = { { "Base.TunaTin", "Base.TinnedBeans" }, { "Base.Lettuce", "Base.Cabbage" } } },
                { "nota", lugar = "casa", radio = 40, titulo = "Nota bajo una lata de atun",
                  texto = "Mari mari, peni. La Pachamama no me quiso y me devolvio. Ahora voy yo a visitarte. Atun con lechuga, como siempre. -M.C." },
                { "aviso", texto = "En la puerta de {lugar:casa} alguien dejo una lata de atun abierta, una hoja de lechuga y una colilla de hierba todavia tibia." },
                { "diario", texto = "Una lata de atun con lechuga en mi puerta y una nota firmada M.C. Meulen Canupan esta muerto. Yo lo vi. Entonces quien dejo esto?" },
                { "aviso", si = SOUS_ALIADO, retraso = 0.1,
                  texto = "Por la radio, {sous_lider_nombre}: 'Mi bro, Cristian vio a alguien con trarilonco rojo rondando el cerro. Dice que fumaba detras de un galpon. No puede ser, cierto?'" },
                { "reloj", id = "llegada", horas = { 3, 6 } },
            },
            salidas = {
                { cuando = { { "reloj_vencido", "llegada" }, { "cerca", "casa", 60 } }, ir = "asalto" },
                { cuando = { "horas", 30 }, ir = "saqueo" },
            },
        },

        -- Meulen y los saqueadores atacan el refugio. Meulen no muere aca.
        asalto = {
            pista = "Defender {lugar:casa}: la banda de Meulen Canupan viene por ti.",
            mapa = false,
            charla = { grupo = "banda", lista = "venganza_asalto", radio = 30, cada = 0.1 },
            al_entrar = {
                { "aviso", texto = "Un silbido corto afuera. Despues otro. Alguien grita 'Mari mari, peni!' y empiezan los disparos." },
                { "bandidos", id = "banda", lugar = "llegada", radio = 90, modo = "hunt",
                  perfiles = MATONES, recortar = { 3, 4 } },
                -- La segunda tanda llega por el otro lado.
                { "bandidos", id = "banda2", lugar = "llegada2", radio = 90, modo = "hunt", retraso = 0.25,
                  perfiles = MATONES, recortar = { 2, 4 } },
                { "aviso", retraso = 0.25, texto = "Llegan mas por el otro lado de {lugar:casa}. Meulen mando a todos los que pudo juntar." },
                { "diario", texto = "Meulen Canupan esta vivo y mando a su banda de saqueadores a mi refugio. El no vino. Nunca viene." },
                { "aviso", si = HANZ_VIVO, retraso = 0.15,
                  texto = "En la radio de Sous, Hanz Walita: 'Pachamama?! Broder, la Pachamama es de nosotros, del norte! Los mapuche le dicen Nuke Mapu. Ni pa resucitar se informa el Meulen.'" },
            },
            salidas = {
                { cuando = { { "todos_muertos", "banda" }, { "todos_muertos", "banda2" } }, ir = "huida" },
                { cuando = { "horas", 2 }, ir = "huida" },
            },
        },

        -- Despues del asalto: lo que traian los matones en los bolsillos.
        huida = {
            pista = "Revisar a los matones caidos en {lugar:casa}.",
            mapa = false,
            al_entrar = {
                { "aviso", texto = "Los que quedan de la banda arrancan gritando 'Pewkallal!'. Los caidos tienen los bolsillos llenos: atun, lechuga y papeles." },
                { "retirar_lejos", grupo = "banda", lugar = "casa", radio = 70 },
                { "retirar_lejos", grupo = "banda2", lugar = "casa", radio = 70 },
                { "recompensa", lugar = "casa", radio = 40, items = bolsillos(4) },
                { "lugar", id = "rastro1", desde = "casa", salas = { "garagestorage", "storageunit", "warehouse", "kitchen", "livingroom" },
                  respaldo = { "bedroom", "bathroom" }, min = 300, max = 900 },
                { "nota", lugar = "casa", radio = 40, titulo = "Libreta de un maton",
                  texto = "Ordenes del jefe, con letra apretada: 'Despues de la casa, todos a {lugar:rastro1}. El que se quede, se queda. Atun con lechuga, nada de otra cosa.'" },
                { "mapa", lugar = "rastro1", titulo = "Mapa en el bolsillo de un maton" },
                { "diario", texto = "Meulen no vino al asalto: mando a su banda. Uno de los matones traia una libreta con ordenes y un mapa hacia {lugar:rastro1}. Si no lo sigo, me va a seguir mandando gente." },
            },
            salidas = { { ir = "seguir1" } },
        },

        -- No estabas en casa: la saquearon igual.
        saqueo = {
            pista = "Volver a {lugar:casa}: Meulen paso por ahi.",
            mapa = false,
            al_entrar = {
                { "lugar", id = "rastro1", desde = "casa", salas = { "garagestorage", "storageunit", "warehouse", "kitchen", "livingroom" },
                  respaldo = { "bedroom", "bathroom" }, min = 300, max = 900 },
                { "recompensa", lugar = "casa", radio = 40, items = bolsillos(1) },
                { "nota", lugar = "casa", radio = 40, titulo = "Nota clavada en la puerta",
                  texto = "Vine a visitarte y no estabas, peni. Me lleve un par de cosas pa los cabros. La proxima te espero. Si quieres conversar, ya sabes donde no buscarme. -M.C." },
                { "mapa", lugar = "rastro1", titulo = "Mapa que se le cayo a Meulen" },
                { "aviso", texto = "Alguien entro a {lugar:casa} mientras no estabas: puertas abiertas, colillas en el suelo y huellas de botas de cuero. Dejaron caer un mapa." },
                { "diario", texto = "Meulen y su banda pasaron por mi refugio mientras yo no estaba. Dejaron caer un mapa que marca {lugar:rastro1}." },
            },
            salidas = { { ir = "seguir1" } },
        },

        seguir1 = tramo("Seguir el rastro de Meulen hasta {lugar:rastro1}.", "rastro1", "pista1", nil, "seguir1"),

        -- El cuerpo de un maton que dejaron atras.
        pista1 = {
            pista = "Revisar el cuerpo en {lugar:rastro1}.",
            al_entrar = {
                { "lugar", id = "rastro2", desde = "rastro1", salas = { "garagestorage", "storageunit", "warehouse", "farmstorage", "barn" },
                  respaldo = { "livingroom", "kitchen" }, min = 300, max = 900 },
                { "cuerpo", lugar = "rastro1", radio = 50 },
                { "recompensa", lugar = "rastro1", radio = 50, items = bolsillos(1) },
                { "oleada", lugar = "rastro1", radio = 50, cantidad = { 8, 14 } },
                { "nota", lugar = "rastro1", radio = 50, titulo = "Papel en el bolsillo de un muerto",
                  texto = "Si alguien queda herido se queda. Lo dijo el jefe. Nos juntamos en {lugar:rastro2} y de ahi a la casa nueva. No le digan a nadie que el jefe sangra." },
                { "aviso", texto = "En {lugar:rastro1} hay un maton de la banda, muerto. No lo mataron los zombis: tiene un tiro en la nuca. Meulen no carga heridos." },
                { "diario", texto = "Meulen dejo atras a uno de los suyos, rematado. En su bolsillo habia un papel: se juntan en {lugar:rastro2}. Y dice que 'el jefe sangra'." },
            },
            salidas = { { ir = "seguir2" } },
        },

        seguir2 = tramo("Seguir a la banda de Meulen hasta {lugar:rastro2}.", "rastro2", "pista2", 60, "seguir2"),

        -- Los rezagados de la banda, con la libreta de Meulen.
        pista2 = {
            pista = "Encontrar la libreta de Meulen en {lugar:rastro2}. Quedan unos de su banda.",
            al_entrar = {
                { "variable", nombre = "volver_a", valor = "pista2_espera" },
                { "bandidos", id = "rezagados", lugar = "rastro2", radio = 60, modo = "guard", perfiles = MATONES, recortar = { 2, 3 } },
                { "recompensa", lugar = "rastro2", radio = 60, items = bolsillos(3) },
                { "objeto", id = "libreta", lugar = "rastro2", radio = 60, tipo = { "Base.Notebook", "Base.SheetPaper2" }, nombre = "Libreta de Meulen Canupan" },
                { "nota", lugar = "rastro2", radio = 60, titulo = "Latas vacias",
                  texto = "Una ruma de latas de atun, hojas de lechuga y colillas aplastadas. Alguien conto las latas y las anoto en la pared con carbon." },
            },
            salidas = {
                { cuando = { "alguien_tiene", "libreta" }, ir = "revelada" },
                { cuando = { "horas", VM.ACOSO }, ir = "acoso" },
            },
        },

        -- La misma parada, de vuelta despues de un acoso (sin volver a poner a nadie).
        pista2_espera = {
            pista = "Encontrar la libreta de Meulen en {lugar:rastro2}.",
            salidas = {
                { cuando = { "alguien_tiene", "libreta" }, ir = "revelada" },
                { cuando = { "horas", VM.ACOSO }, ir = "acoso" },
            },
        },

        revelada = {
            al_entrar = {
                { "lugar", id = "guarida", desde = "rastro2", salas = { "warehouse", "farmstorage", "barn", "factorystorage", "garagestorage" },
                  respaldo = { "livingroom", "kitchen" }, min = 400, max = 1200 },
                { "mapa", lugar = "guarida", titulo = "Mapa de la libreta de Meulen" },
                { "diario", texto = "La libreta de Meulen: inventarios, nombres tachados (el mio sin tachar) y un dibujo de su casa nueva en {lugar:guarida}. En la ultima hoja: 'Weupife. El que cuenta la historia es el que queda vivo.'" },
                { "diario", texto = "Entre las hojas hay una venda con sangre seca. El jefe sangra. Esta vez se le puede matar." },
                { "aviso", texto = "La libreta de Meulen marca su guarida: {lugar:guarida}. Esta vez no tiene humo ni suerte." },
                { "aviso", si = SOUS_ALIADO, retraso = 0.05,
                  texto = "Por la radio, {sous_lider_nombre}: 'Lo encontraste? Anda con cuidado, mi bro. Y cuando termines, ven a contarnos. Queremos saber que esta vez es verdad.'" },
            },
            salidas = { { ir = "hacia" } },
        },

        hacia = tramo("Ir a la guarida de Meulen en {lugar:guarida}.", "guarida", "guarida", 70, "hacia"),

        -- Ahora si: Meulen se puede matar.
        guarida = {
            pista = "Matar a Meulen Canupan en {lugar:guarida}. Esta vez de verdad.",
            charla = { grupos = { "jefe", "guardia" }, lista = "venganza_guarida", radio = 25, cada = 0.12 },
            al_entrar = {
                { "bandidos", id = "jefe", lugar = "guarida", radio = 60, modo = "guard", salud = 200,
                  perfiles = MEULEN, nombres = NOMBRES },
                { "variable", nombre = "volver_a", valor = "guarida_espera" },
                { "bandidos", id = "guardia", lugar = "guarida", radio = 60, modo = "guard", perfiles = MATONES, recortar = { 4, 6 } },
                { "recompensa", lugar = "guarida", radio = 60, items = bolsillos(4) },
                { "recompensa", lugar = "guarida", radio = 60,
                  items = { { "Base.TunaTin", "Base.TinnedBeans" }, { "Base.TunaTin", "Base.TinnedBeans" }, { "Base.TunaTin", "Base.TinnedBeans" },
                            { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.ShotgunShells" }, { "Base.Bandage" } } },
                { "aviso", texto = "Huele a hierba y a atun. Meulen esta adentro con lo que le queda de banda. Ya no hay humo que lo salve." },
            },
            salidas = {
                { cuando = { "muerto", "jefe", "maulen" }, ir = "final_muerto" },
                { cuando = { "horas", VM.ACOSO }, ir = "acoso" },
            },
        },

        -- Meulen sigue en su guarida; de vuelta despues de un acoso.
        guarida_espera = {
            pista = "Matar a Meulen Canupan en {lugar:guarida}. Esta vez de verdad.",
            charla = { grupos = { "jefe", "guardia" }, lista = "venganza_guarida", radio = 25, cada = 0.12 },
            salidas = {
                { cuando = { "muerto", "jefe", "maulen" }, ir = "final_muerto" },
                { cuando = { "horas", VM.ACOSO }, ir = "acoso" },
            },
        },

        -- No lo persigues: te manda matones donde estes, cada VM.ACOSO horas, hasta que lo mates.
        acoso = {
            pista = "La banda de Meulen te encontro. Defenderte.",
            mapa = false,
            al_entrar = {
                { "olvidar_grupo", grupo = "acoso" },
                { "lugar_jugador", id = "acosado" },
                { "lugar_cerca", id = "acoso_llegada", de = "acosado", distancia = 30 },
                { "bandidos", id = "acoso", lugar = "acoso_llegada", radio = 90, modo = "hunt", perfiles = MATONES, recortar = { 3, 5 } },
                { "aviso", texto = "Un silbido corto, despues otro. Meulen te mando a su gente: 'Mari mari, peni! El jefe se aburrio de esperarte.'" },
                { "diario", texto = "Como no fui a buscar a Meulen, el me vino a buscar a mi. Otra vez mando a sus matones." },
            },
            salidas = {
                { cuando = { "todos_muertos", "acoso" }, ir = "acoso_fin" },
                { cuando = { "horas", 3 }, ir = "acoso_fin" },
            },
        },

        -- Lo que traian: atun con lechuga y otra pista hacia donde ibas.
        acoso_fin = {
            mapa = false,
            al_entrar = {
                { "retirar_lejos", grupo = "acoso", lugar = "acosado", radio = 70 },
                { "recompensa", lugar = "acosado", radio = 40, items = bolsillos(3) },
                { "nota", lugar = "acosado", radio = 40, titulo = "Papel en el bolsillo de un maton",
                  texto = "'El jefe dice que si no viene, vamos nosotros. Cada dia y medio, hasta que venga o hasta que no quede nadie.' Atras, una mancha de atun." },
                { "aviso", texto = "Los matones traian atun con lechuga y un papel con ordenes. Meulen va a seguir mandando gente hasta que lo encuentres." },
            },
            salidas = {
                { cuando = { "var", "volver_a", "seguir1" }, ir = "seguir1" },
                { cuando = { "var", "volver_a", "seguir2" }, ir = "seguir2" },
                { cuando = { "var", "volver_a", "pista2_espera" }, ir = "pista2_espera" },
                { cuando = { "var", "volver_a", "hacia" }, ir = "hacia" },
                { cuando = { "var", "volver_a", "guarida_espera" }, ir = "guarida_espera" },
                { ir = "seguir1" },
            },
        },

        final_muerto = {
            final = true,
            al_entrar = {
                { "memoria", clave = "meulen_final", valor = "muerto" },
                { "legendario", lugar = "guarida", radio = 40, clase = "arma" },
                { "recompensa", lugar = "guarida", radio = 40,
                  items = { { "Base.NecklaceLong_Silver" }, { "Base.Hat_BandanaTiedTINT" }, { "Base.Pistol" } } },
                { "huella", acto = "protegiste", texto = "Mate a Meulen Canupan de verdad. Ya no va a volver por nadie." },
                { "aviso", texto = "Meulen Canupan cae de espaldas, con el cigarro apagado en la boca. Esta vez no se levanta." },
                { "diario", texto = "Meulen Canupan esta muerto en {lugar:guarida}. Esta vez lo vi quedarse quieto. Me lleve su trapelacucha de plata y su trarilonco: que nadie mas tenga que contar sus latas." },
                { "aviso", si = SOUS_ALIADO, retraso = 0.05,
                  texto = "Por la radio, {sous_lider_nombre}: 'Ya esta, entonces. De verdad esta vez. Ven a la base, mi bro. Sous te debe una... y Sous no olvida.'" },
                { "aviso", si = HANZ_VIVO, retraso = 0.1,
                  texto = "Hanz Walita, por la radio: 'Que la Nuke Mapu se lo quede esta vez, broder. Y que no lo devuelva.'" },
            },
        },
    },
})

return VM
