-- Narrador Co-op: quien manda en cada ciudad (datos compartidos por servidor y cliente).
-- Cada campamento de misionero tiene un "dominio":
--   mision  : el misionero de siempre (Cabo Ramiro, Tia Chela, Padre Nacho, Misia Rosa).
--   bandido : lo conquisto la banda del patio de trenes (el camino del bandido, fase 2). Manda un
--             capitan, con los mismos comerciantes, y sus encargos son todos inmorales.
--   nuevo   : Knox se reconquisto con Eduardo (fase 3). Manda un misionero nuevo.
-- El servidor lo aplica en server/Narrador/NarradorDominios.lua (memoria "dominio_<id>").
-- Textos sin tildes ni enies a proposito.

Narrador = Narrador or {}
local DD = Narrador.DominiosDefs or {}
Narrador.DominiosDefs = DD

-- Los capitanes: contraparte oscura de cada misionero. nombre y apellido como en C.LISTA.
DD.CAPITANES = {
    muldraugh = {
        rol = "capitan_vargas", nombre = "Capitan Vargas", apellido = "Toledo", perfil = "k93_muldraugh_pd_03",
        oficio = "ex guardia de carcel",
        frases = {
            "Bienvenido a mi comisaria. Aca se paga por entrar y se paga por salir.",
            "El cabo llevaba un censo. Yo llevo una libreta de deudas. Adivina en cual estas.",
            "Veinte anos cuidando presos. Ahora el pueblo entero es mi patio.",
            "No me mires asi. Yo no invente las rejas, solo tengo las llaves.",
            "Tengo trabajo. Del sucio. Del que paga.",
            "Si alguien no paga, me avisas. Si tu no pagas, te aviso yo.",
        },
        rangos = { "Reo", "Recluso", "Cabo de patio", "Guardia", "Alcaide" },
        perfil_lore = {
            "El Capitan Vargas Toledo manda en la comisaria del Cabo Ramiro. Fue guardia de carcel veinte anos. Lleva una libreta, como el Cabo, pero en la suya anota lo que le deben.",
            "Dice que la carcel le enseno todo: que nadie es inocente y que todos tienen precio. Se rie cuando lo dice, pero no con los ojos.",
            "Duerme en la oficina del segundo piso, en la silla del Cabo. No la ha limpiado. Dice que le gusta acordarse de quien estaba antes.",
        },
    },
    westpoint = {
        rol = "capitana_kell", nombre = "Capitana Morrigan", apellido = "Kell", perfil = "k93_vfd_05",
        oficio = "piromana",
        frases = {
            "El fuego es honesto. Lo que no se puede defender, se quema.",
            "La vieja apagaba incendios. Yo los prendo. Alguien tenia que equilibrar.",
            "Una casa vacia es una casa que ocupa otro. Mejor ceniza.",
            "Tengo fosforos y tengo trabajo. Elige cual te doy primero.",
            "No me tiembla el pulso. Me tiembla la paciencia.",
            "Huele a humo, cierto? Es que siempre huele a humo cuando estoy yo.",
        },
        rangos = { "Ceniza", "Chispa", "Fosforo", "Antorcha", "Incendio" },
        perfil_lore = {
            "La Capitana Morrigan Kell manda en el cuartel de bomberos de West Point. Quema casas 'para que no las ocupen'. El carro bomba de la Chela esta en el patio, con el estanque lleno de bencina.",
            "Dicen que antes de todo esto la detuvieron tres veces por incendios que nadie pudo probar. Ella dice que fueron cuatro.",
            "Encontro la frazada que la Chela le guardaba a su hijo. No la quemo. La tiene doblada en una silla y nadie sabe por que.",
        },
    },
    riverside = {
        rol = "diacono_reyes", nombre = "Diacono Saul", apellido = "Reyes", perfil = "k93_prather_04",
        oficio = "falso predicador",
        frases = {
            "El diezmo es voluntario, hijo. Voluntariamente me lo das o voluntariamente te lo quito.",
            "El Padre Nacho creia en las segundas oportunidades. Yo creo en los pagos atrasados.",
            "Dios ve todo. Yo tambien, y soy mas rencoroso.",
            "Arrodillate si quieres. Igual tienes que pagar.",
            "Tengo una mision para ti. Bendita, por supuesto. Todo lo que yo mando es bendito.",
            "La puerta de la iglesia ya no esta abierta. Esta vigilada.",
        },
        rangos = { "Pecador", "Diezmero", "Acolito", "Predicador", "Profeta" },
        perfil_lore = {
            "El Diacono Saul Reyes predica en la iglesia de Riverside, la del Padre Nacho. No es diacono de nada. Cobra el diezmo a punta de pistola y lo llama ofrenda.",
            "Se sabe la Biblia de memoria, pero solo las partes de castigo. Cuando le pregunte por la otra mejilla me pego en las dos.",
            "Cerro la puerta de la iglesia que el Padre Nacho nunca cerraba. La gente de Riverside dice que desde ese dia el pueblo esta mas oscuro.",
        },
    },
    rosewood = {
        rol = "capitan_duarte", nombre = "Capitan Tito", apellido = "Duarte", perfil = "k93_truckstop_07",
        oficio = "contrabandista",
        frases = {
            "Bencina tengo. La saque de abajo del taller. La vieja la tenia bien escondida.",
            "Todo se vende. La bencina, las balas, la gente. Sobre todo la gente.",
            "Lleno o normal? Normal te cuesta un brazo. Lleno, los dos.",
            "Treinta anos de ruta. Se donde se esconde todo el mundo. Por eso me pagan.",
            "Tengo un encargo. No preguntes que va adentro del camion.",
            "La bencinera nunca cierra, decia la vieja. Tenia razon. Ahora es mia y nunca cierra.",
        },
        rangos = { "Carga", "Burrero", "Chofer", "Socio", "Patron" },
        perfil_lore = {
            "El Capitan Tito Duarte maneja la bencinera de Rosewood. Era camionero de la ruta 31 y contrabandista antes de que el mundo se acabara. Encontro el estanque escondido de la Misia Rosa y vende la bencina a precio de sangre.",
            "Se sabe la vida de todos los camioneros, como la Misia. Pero el no la cuenta para que no se pierdan: la usa para cobrar.",
            "La foto de Hector sigue pegada en la caja registradora. Duarte le pinto bigotes con plumon. Es lo unico que me dan ganas de matarlo sin que nadie me lo pida.",
        },
    },
}

-- Los misioneros nuevos de la reconquista (fase 3). Llenos en server/Narrador/NarradorDominios.lua
-- cuando se escriba la fase 3; por ahora solo los datos.
DD.NUEVOS = {}

-- Perfil del diario segun el dominio (el cliente lo usa en Diario.loQueSe).
function DD.perfilLore(dominio, id)
    local t = dominio == "bandido" and DD.CAPITANES or (dominio == "nuevo" and DD.NUEVOS or nil)
    local d = t ~= nil and t[id] or nil
    return d ~= nil and d.perfil_lore or nil
end

return DD
