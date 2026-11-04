-- La panaderia Hollis de Riverside y su gente: cuatro misiones que salieron del rol (ver
-- NarradorCoop/personajes). Walt Hollis era el dueno; Yvonne Bell su panadera 17 anos; Hector
-- Bencina Jr. (el sobrino de la Misia Rosa) su nieto. Yvonne se llevo "la Vieja", la masa madre
-- de la familia (Hazel Hollis, 1931).
--
--   raton_harina    El raton de la harina. La trampa de ratones de Wade pilla a Yvonne sacando
--                   harina para la Vieja. Lo lanza el director, con Yvonne y Wade viviendo en tu
--                   refugio (NarradorBell). Deja "harina" (callado, secreto, confeso, daniel o
--                   wade): cambia lo que dicen los Bell y como empieza el primer pan.
--   primer_pan      El primer pan. Un horno de verdad para Yvonne y la Vieja. Lo abre el raton de
--                   la harina. Lee "harina" y, si la camioneta del pan dejo la libreta de Walt en
--                   manos de Yvonne, "receta_walt". Deja "pan_bell": desde ahi Yvonne hornea cada
--                   dos dias (B.hornear en NarradorBell).
--   camioneta_pan   La camioneta del pan. La camioneta blanca de Walt en la ruta 31, con Walt
--                   transformado. Oferta de la Misia Rosa (NarradorHollis) despues de su cap. 2.
--                   Cierre para Hector Jr. (en la gasolinera, si la cura lo salvo) y para Yvonne
--                   (en el refugio, si vive). Deja "camioneta_pan" (lo que te llevaste: receta,
--                   foto o llaves) y "receta_walt".
--   iglesia_shively La iglesia de Shively. El dato del Tecolote: Linda Hollis y Nico, la mama y
--                   el hermano de Hector Jr., en una iglesia de ladrillo de la Dixie Highway, en
--                   Louisville. Oferta de la Misia Rosa despues de la camioneta, con Hector vivo.
--                   Se sortea si estan vivos, si dejaron una nota o si era cebo de bandidos; la
--                   radio de la Chela (radio_westpoint) avisa del cebo y la foto de Walt (camioneta)
--                   convence a Linda. Deja "shively".
-- Los Bell del refugio no son de ningun arco: se habla con ellos con "decir_bell" y se pregunta
-- por ellos con "bell_vive" / "bell_presente" (server/Narrador/NarradorBell.lua).
-- Textos sin tildes ni enies a proposito.

require "Narrador/NarradorDefs"
require "Narrador/Arcos/FamiliaInfectada"
require "Narrador/Conversas/ConversasHollis"

local registrar = Narrador.Defs.registrar

local PRESENTE = function(rol) return { "bell_presente", rol } end
local SIN_YVONNE = { "no", { "bell_vive", "madre" } }

-- ---------------------------------------------------------------------------
-- Lo que dicen los Bell en el refugio despues del raton de la harina y del primer pan
-- (se suma a las charlas del refugio y a las de gratitud del engano).
-- ---------------------------------------------------------------------------
local LINEAS_BELL = {
    { "madre", "Le debo una cucharada, corazon. Y un silencio. El silencio pesa mas.", si = { "memoria", "harina", "callado" } },
    { "hijo", "La harina me cuadra desde el martes. Raro. Los ratones no devuelven.", si = { "memoria", "harina", "callado" } },
    { "madre", "La Vieja esta contenta. A las tres y media huele a panaderia. Gracias por no contar.", si = { "memoria", "harina", "secreto" } },
    { "hijo", "Alguien repone la harina. Una cucharada por dia. Por la estadistica, no es un raton.", si = { "memoria", "harina", "secreto" } },
    { "padre", "Una cucharada al dia, jefe. Vonnie le daba de comer a una masa a escondidas. Diecisiete anos casado y todavia me sorprende.", si = { "memoria", "harina", "confeso" } },
    { "madre", "Ahora le doy de comer a la Vieja con la puerta abierta. Wade cuenta las cucharadas. Es justo.", si = { "memoria", "harina", "confeso" } },
    { "hijo", "Mama dijo lo de la harina en voz alta, en el desayuno. Lo justo es decirlo en voz alta.", si = { "memoria", "harina", "confeso" } },
    { "padre", "Me desperto para mostrarme a mi mujer con el dedo en una trampa. Gracias, jefe. Creo.", si = { "memoria", "harina", "daniel" } },
    { "padre", "Le reclame una cucharada de harina a Vonnie. Que ironia. Hay papeles mas pesados que uno no entrega.", si = { "memoria", "harina", "daniel" } },
    { "madre", "Daniel me arreglo la trampa del nino para que no pille dedos. Asi pide perdon el.", si = { "memoria", "harina", "daniel" } },
    { "hijo", "La trampa pillo un pelo largo, castano con canas. Los ratones no tienen canas. No dije nada.", si = { "memoria", "harina", "wade" } },
    { "madre", "Wade me mira las manos cuando amaso. Como si contara. Ese nino cuenta todo.", si = { "memoria", "harina", "wade" } },
    { "madre", "La Vieja come a la vista de todos ahora. Una cucharada y un chorrito de agua, al tibio.", si = { "mem", "pan_bell" } },
    { "madre", "Anoche dormi de corrido, corazon. Alguien hizo la guardia por mi. Primera vez desde julio.", si = { "mem", "pan_bell" } },
    { "padre", "Le aceite la puerta del horno con grasa de tocino. Ni un chirrido, jefe. Y huele a pan.", si = { "mem", "pan_bell" } },
    { "hijo", "Doce panes por saco. Lo anote en el cuaderno. Usted sigue teniendo la pagina mas larga.", si = { "mem", "pan_bell" } },
    { "madre", "Leo la libreta de Walt de noche. Tiene manchas de mantequilla en las mejores paginas.", si = { "memoria", "receta_walt", true } },
}

local function sumarLineas(lista, lineas)
    if type(lista) ~= "table" then return end
    for _, l in ipairs(lineas) do
        local ya = false
        for _, x in ipairs(lista) do if x[2] == l[2] then ya = true end end
        if not ya then lista[#lista + 1] = l end
    end
end
sumarLineas(Narrador.Charlas.bell_refugio, LINEAS_BELL)
sumarLineas(Narrador.Charlas.bell_gratitud, LINEAS_BELL)

-- ===========================================================================
-- 6. El raton de la harina
-- Yvonne alimenta a la Vieja con una cucharada diaria de la harina de la racion, a las 3:30,
-- cuando nadie mira (la saca de la cuenta de Wade). Wade nota que la harina no le cuadra y pone
-- una trampa de ratones al lado del saco. Una noche la trampa la pilla. El jugador decide.
-- ===========================================================================
local function abrirPan()
    return { "abrir", def = "primer_pan", horas = 36 }
end

registrar({
    id = "raton_harina",
    titulo = "El raton de la harina",
    requiere_alife = true,
    requiere_refugio = true,
    peso = 14,
    intensidad = 1,
    tono = "vida",
    max_veces = 1,
    dia_minimo = 4,
    -- Con Yvonne y Wade en el refugio, y los Bell ya instalados hace dos dias.
    si = { { "bell_vive", "madre" }, { "bell_vive", "hijo" }, { "bell_hace", 48 } },
    inicio = "espera",
    etapas = {
        espera = {
            pista = "Pasar la noche en {lugar:refugio}. Wade le puso una trampa al raton de la harina.",
            ancla = "refugio",
            al_entrar = {
                { "lugar_bell", id = "refugio" },
                { "decir_bell", rol = "hijo", texto = "La harina no me cuadra. Falta una cucharada por dia desde que llegamos. Puse una trampa de ratones al lado del saco. Los ratones no saben contar. Yo si." },
                { "diario", texto = "Wade dice que la harina del saco no le cuadra: falta una cucharada por dia. Le puso una trampa de ratones al lado." },
            },
            salidas = {
                -- A las tres y media, con alguien en casa y Yvonne en el refugio.
                { cuando = { { "horas", 4 }, { "cerca", "refugio", 25 }, { "hora_entre", 3, 5 }, PRESENTE("madre") }, ir = "trampa" },
                -- No ocupa el cupo del director para siempre: a los tres dias la trampa salta sola.
                { cuando = { "horas", 72 }, ir = "final_wade" },
            },
        },
        trampa = {
            pista = "Yvonne tiene un dedo en la trampa de Wade y una cucharada de harina en la otra mano. Decidir que hacer (clic derecho en {lugar:refugio}).",
            ancla = "refugio", radio = 20,
            al_entrar = {
                { "aviso", texto = "Tres y media de la manana. Un chasquido de metal junto al saco de harina y un quejido ahogado. Es Yvonne: un dedo en la trampa de Wade y una cucharada de harina en la otra mano." },
                { "decir_bell", rol = "madre", texto = "Shh. No despierte al nino, corazon. Es un dedo nomas. He visto quemaduras de horno peores." },
            },
            opciones = {
                { id = "callar", texto = "Hacer como que no viste nada y volver a dormir",
                  acciones = { { "decir_bell", rol = "madre", texto = "Gracias, corazon. Manana la cuenta le cuadra al nino. Se lo prometo." } } },
                { id = "preguntar", texto = "Preguntarle a Yvonne para que es la harina", si = PRESENTE("madre") },
                { id = "daniel", texto = "Despertar a Daniel", si = PRESENTE("padre") },
            },
            salidas = {
                { cuando = { "eleccion", "callar" }, ir = "final_callado" },
                { cuando = { "eleccion", "preguntar" }, ir = "confesion" },
                { cuando = { "eleccion", "daniel" }, ir = "final_daniel" },
                -- Si nadie hace nada, en la manana Wade encuentra la trampa.
                { cuando = { "horas", 2 }, ir = "final_wade" },
            },
        },
        confesion = {
            pista = "Yvonne te conto para que es la harina. Decidir que haces con eso (clic derecho en {lugar:refugio}).",
            ancla = "refugio", radio = 20,
            al_entrar = {
                { "decir_bell", rol = "madre", texto = "Es para la Vieja. La masa madre de la panaderia. Come una cucharada al dia y un chorrito de agua, al tibio. A las tres y media, cuando nadie mira." },
                { "decir_bell", rol = "madre", retraso = 0.03, texto = "Cinco minutos destapo el frasco y huele a panaderia. Esos cinco minutos soy feliz, corazon. Y me da verguenza ser feliz en el fin del mundo." },
                { "decir_bell", rol = "madre", retraso = 0.06, texto = "Y la saco de la cuenta de Wade. Ya se. Por eso no le cuadra." },
            },
            opciones = {
                { id = "secreto", texto = "Guardarle el secreto",
                  acciones = { { "decir_bell", rol = "madre", texto = "Gracias, corazon. Desde manana la cucharada sale de la mia. La Vieja come lo mismo; el nino, lo que le toca." } } },
                { id = "contar_ella", texto = "Decirle que se lo cuente ella a su familia: bien, no bonito",
                  acciones = { { "decir_bell", rol = "madre", texto = "Bien, no bonito. Asi se dicen las cosas, ya se. ... Manana, en el desayuno. Delante del nino." } } },
            },
            salidas = {
                { cuando = { "eleccion", "secreto" }, ir = "final_secreto" },
                { cuando = { "eleccion", "contar_ella" }, ir = "final_confeso" },
                { cuando = { "horas", 2 }, ir = "final_secreto" },
            },
        },

        final_callado = { final = true, al_entrar = {
            { "memoria", clave = "harina", valor = "callado" },
            abrirPan(),
            { "diario", texto = "La trampa de Wade pillo a Yvonne con una cucharada de harina. Hice como que no vi nada. Ella me dio las gracias con la mano envuelta en el delantal." },
        } },
        final_secreto = { final = true, al_entrar = {
            { "memoria", clave = "harina", valor = "secreto" },
            abrirPan(),
            { "diario", texto = "Yvonne le da de comer a la Vieja, la masa madre de la panaderia, una cucharada de harina al dia. Me lo conto a las tres y media de la manana. Le guardo el secreto; ella va a reponer la cucharada de su racion." },
        } },
        final_confeso = { final = true, al_entrar = {
            { "memoria", clave = "harina", valor = "confeso" },
            { "decir_bell", rol = "padre", retraso = 4, texto = "Una cucharada al dia, Vonnie? Diecisiete anos casados y todavia me sorprendes. ... No, no estoy enojado. Que ironia: yo, enojado por una cucharada." },
            { "decir_bell", rol = "hijo", retraso = 4.05, texto = "Una cucharada al dia son trescientas sesenta y cinco al ano. ... Lo justo es decirlo en voz alta, mama. Ya lo dijiste." },
            abrirPan(),
            { "diario", texto = "Yvonne le conto a su familia lo de la harina, en el desayuno, delante de Wade. Bien, no bonito. Daniel se rio. Wade saco la cuenta y despues la abrazo." },
        } },
        final_daniel = { final = true, al_entrar = {
            { "memoria", clave = "harina", valor = "daniel" },
            { "decir_bell", rol = "padre", texto = "Vonnie? ... Que es eso? Una trampa? Una cucharada de harina?" },
            { "decir_bell", rol = "madre", retraso = 0.03, texto = "No me levante la voz delante del nino, Daniel Bell. Afuera me grita lo que quiera. ... Es para la Vieja." },
            { "decir_bell", rol = "padre", retraso = 0.06, texto = "Sabia del frasco. No sabia de la harina. ... Hay cosas que uno tendria que decir en persona, Vonnie. Que ironia que te lo diga yo." },
            { "decir_bell", rol = "padre", retraso = 0.09, texto = "Gracias por despertarme, jefe. Creo." },
            abrirPan(),
            { "diario", texto = "Desperte a Daniel. Encontro a su mujer con un dedo en la trampa de Wade y una cucharada de harina para la Vieja. Le reclamo en voz baja y despues se quedo callado mucho rato, como si el tambien tuviera algo que decir." },
        } },
        final_wade = { final = true, al_entrar = {
            { "memoria", clave = "harina", valor = "wade" },
            { "decir_bell", rol = "hijo", texto = "La trampa salto anoche. Tenia harina pegada y un pelo largo, castano con canas. Los ratones no tienen canas." },
            { "decir_bell", rol = "hijo", retraso = 0.03, texto = "No le voy a decir nada a mama. Lo correcto y lo justo no siempre dan el mismo numero." },
            abrirPan(),
            { "diario", texto = "La trampa de Wade salto una noche sin que yo estuviera. Pillo un pelo largo, castano con canas. Wade sabe quien es el raton y no se lo dijo a nadie. Solo a mi." },
        } },
    },
})

-- ===========================================================================
-- 11. El primer pan
-- Yvonne quiere un horno de verdad para hornear con la Vieja (su deseo en la ficha) y le debe al
-- jugador "el primer pan de horno de verdad. Entero y caliente". Se trae la puerta de un horno de
-- una panaderia o un restaurante; Daniel arma el resto en el refugio con un tambor y ladrillos.
-- ===========================================================================
local POR_HARINA = function(textos) return { por_var = "harina", textos = textos } end

registrar({
    id = "primer_pan",
    titulo = "El primer pan",
    requiere_alife = true, requiere_refugio = true, automatico = false,
    intensidad = 2, tono = "vida",
    vars_desde_memoria = { "harina" },
    inicio = "pedido",
    etapas = {
        pedido = {
            al_entrar = {
                { "lugar_bell", id = "refugio" },
                { "lugar", id = "horno", desde = "refugio", salas = { "bakery*", "restaurantkitchen", "cafekitchen", "dinerkitchen", "pizza*" },
                  respaldo = { "restaurant*", "cafe*", "kitchen" }, min = 150, max = 1100 },
            },
            salidas = {
                { cuando = SIN_YVONNE, ir = "final_sin_yvonne" },
                -- Lo pide cuando hay alguien en casa y Yvonne esta.
                { cuando = { PRESENTE("madre"), { "cerca", "refugio", 25 } }, ir = "anuncio" },
            },
        },
        anuncio = {
            al_entrar = {
                { "decir_bell", rol = "madre", texto = POR_HARINA({
                    callado = "Corazon, usted ya sabe para que es la cucharada. La Vieja no aguanta otro invierno en un frasco: necesita un horno de verdad. En {lugar:horno} habia uno.",
                    secreto = "Corazon, usted ya sabe para que es la cucharada. La Vieja no aguanta otro invierno en un frasco: necesita un horno de verdad. En {lugar:horno} habia uno.",
                    confeso = "Ahora que todos saben de la Vieja, corazon, le pido una sola cosa: un horno de verdad. En {lugar:horno} habia uno.",
                    daniel = "Daniel dice que si la Vieja come de la racion, por lo menos que devuelva pan. Tiene razon, el condenado. En {lugar:horno} habia un horno de verdad, corazon.",
                    otro = "Si encuentra un horno de verdad, corazon, traigame la puerta. Lo demas lo armamos aca. En {lugar:horno} habia uno.",
                }) },
                { "decir_bell", rol = "hijo", retraso = 0.03, si = { "var", "harina", "wade" },
                  texto = "Mama necesita un horno. No me pregunte por que lo se. Lo calcule: con un horno, una cucharada de la Vieja da doce panes. Doce." },
                { "decir_bell", rol = "padre", retraso = 0.06,
                  texto = "Hagamos un trato, jefe: usted trae la puerta del horno y yo le armo el resto con un tambor de aceite y ladrillos. Las bisagras son lo mio." },
                { "mapa", lugar = "horno", titulo = "Mapa de los Bell: el horno" },
                { "diario", texto = "Yvonne quiere un horno de verdad para hornear con la Vieja. En {lugar:horno} queda uno: hay que traer la puerta. Daniel arma el resto en el refugio." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:horno} por la puerta de un horno de verdad.",
            objetivo = "horno",
            salidas = {
                { cuando = SIN_YVONNE, ir = "final_sin_yvonne" },
                { cuando = { "cerca", "horno", 40 }, ir = "cocina" },
            },
        },
        cocina = {
            pista = "Sacar la puerta del horno de {lugar:horno}. Las bandejas tambien sirven.",
            objetivo = "horno",
            al_entrar = {
                { "oleada", lugar = "horno", radio = 45, cantidad = { 10, 16 }, min = 12, max = 30 },
                { "objeto", id = "puerta", lugar = "horno", radio = 35, tipo = { "Base.SheetMetal", "Base.SmallSheetMetal", "Base.MetalBar" },
                  nombre = "La puerta del horno" },
                { "recompensa", lugar = "horno", radio = 35, items = { { "Base.BakingTray", "Base.BakingPan", "Base.Pan" }, { "Base.Flour2", "Base.Flour" } } },
            },
            salidas = {
                { cuando = SIN_YVONNE, ir = "final_sin_yvonne" },
                { cuando = { "alguien_tiene", "puerta" }, ir = "volver" },
            },
        },
        volver = {
            pista = "Llevar la puerta del horno a {lugar:refugio} (clic derecho cerca de los Bell).",
            ancla = "refugio", radio = 20,
            opciones = {
                { id = "puerta", texto = "Darles la puerta del horno a los Bell", requiere = { "objeto", "puerta" },
                  falta = "No llevas la puerta del horno.", si = { "o", PRESENTE("padre"), PRESENTE("hijo"), PRESENTE("madre") } },
            },
            salidas = {
                { cuando = SIN_YVONNE, ir = "final_sin_yvonne" },
                { cuando = { "eleccion", "puerta" }, ir = "armar" },
            },
        },
        armar = {
            pista = "Los Bell arman el horno en {lugar:refugio}. Yvonne hornea a las tres y media: estar ahi a esa hora.",
            ancla = "refugio",
            al_entrar = {
                { "decir_bell", rol = "padre", si = PRESENTE("padre"),
                  texto = "Un tambor de aceite, ladrillos de la reja y esta puerta. Para las tres y media hay horno, jefe. Ya le aceite las bisagras: ni un chirrido." },
                { "decir_bell", rol = "hijo", si = { { "no", PRESENTE("padre") }, PRESENTE("hijo") },
                  texto = "Lo armo yo. Un tambor, ladrillos y la puerta. Lo lei en un libro. Bueno, no. Lo calcule." },
                { "decir_bell", rol = "madre", retraso = 0.05, texto = "Esta noche despierto a la Vieja temprano, corazon. Venga a las tres y media. No antes, que la masa se pone timida." },
                { "diario", texto = "Les lleve la puerta del horno a los Bell. Daniel lo arma en el refugio con un tambor de aceite y ladrillos. Yvonne hornea a las tres y media." },
            },
            salidas = {
                { cuando = SIN_YVONNE, ir = "final_sin_yvonne" },
                { cuando = { { "horas", 6 }, { "cerca", "refugio", 25 }, { "hora_entre", 3, 6 }, PRESENTE("madre") }, ir = "final_primer_pan" },
                { cuando = { "horas", 96 }, ir = "final_sin_ti" },
            },
        },

        final_primer_pan = { final = true, al_entrar = {
            { "aviso", texto = "Tres y media de la manana. Yvonne abre la puerta del horno y el refugio entero huele a panaderia." },
            { "decir_bell", rol = "madre", si = { "memoria", "receta_walt", true },
              texto = "La libreta de Walt, pagina doce: el pan de Hazel, de 1931. Con la Vieja y un horno de verdad. ... Tome, corazon. Entero y caliente. Se lo debia." },
            { "decir_bell", rol = "madre", si = { "no", { "memoria", "receta_walt", true } },
              texto = "Tome, corazon. Entero y caliente. Se lo debia desde que llegamos." },
            { "decir_bell", rol = "hijo", retraso = 0.03, si = { "bell_vive", "padre" }, texto = "Doce panes. Somos cuatro con usted: tres para cada uno. Tres es primo." },
            { "decir_bell", rol = "hijo", retraso = 0.03, si = { "no", { "bell_vive", "padre" } }, texto = "Doce panes. Somos tres con usted: cuatro para cada uno. Cuatro no es primo, pero es cuadrado perfecto." },
            { "decir_bell", rol = "hijo", retraso = 0.05, si = { "var", "harina", "wade" }, texto = "Y esta vez la cuenta cuadra. Lo anote." },
            { "decir_bell", rol = "padre", retraso = 0.07, texto = POR_HARINA({
                confeso = "Diecisiete anos casado y nunca la vi tan contenta, jefe. Ni el dia del casamiento. Bueno, casi.",
                daniel = "Le aceite la puerta del horno, Vonnie. Ni un chirrido. Y la cucharada de la Vieja ahora la pongo yo.",
                otro = "Huele a la panaderia de Riverside, jefe. Huele a antes.",
            }) },
            { "decir_bell", rol = "madre", retraso = 0.1, texto = "Esta noche a lo mejor duermo, corazon. De corrido. Hace anos que no." },
            { "recompensa", lugar = "refugio", radio = 6, items = { { "Base.Bread" }, { "Base.Bread" }, { "Base.Bread" } } },
            { "recompensa", lugar = "refugio", radio = 6, items = { { "Base.CinnamonRoll", "Base.Bread" }, { "Base.CinnamonRoll", "Base.Bread" } },
              si = { "memoria", "receta_walt", true } },
            { "memoria", clave = "pan_bell", valor = "walt", si = { "memoria", "receta_walt", true } },
            { "memoria", clave = "pan_bell", valor = "vieja", si = { "no", { "memoria", "receta_walt", true } } },
            { "diario", texto = "El primer pan del horno de Yvonne. Entero y caliente, como me lo debia. La Vieja come ahora a la vista de todos, y Yvonne dice que esta noche a lo mejor duerme." },
        } },
        final_sin_ti = { final = true, al_entrar = {
            { "recompensa", lugar = "refugio", radio = 6, items = { { "Base.Bread" }, { "Base.Bread" } } },
            { "memoria", clave = "pan_bell", valor = "walt", si = { "memoria", "receta_walt", true } },
            { "memoria", clave = "pan_bell", valor = "vieja", si = { "no", { "memoria", "receta_walt", true } } },
            { "diario", texto = "No estuve a las tres y media. Yvonne horneo igual el primer pan del horno nuevo y me guardo el mio envuelto en un pano, en la entrada. Todavia estaba tibio." },
        } },
        final_sin_yvonne = { final = true, al_entrar = {
            { "diario", texto = "Yvonne ya no esta en el refugio. El horno se quedo en una idea, como tantas cosas." },
        } },
    },
})

-- ===========================================================================
-- 2. La camioneta del pan
-- Walt Hollis salio mordido de la panaderia hacia las 7:30 del 10 de julio, a buscar a Linda a
-- Rosewood, pero la camioneta blanca (con un pan pintado en la puerta) dejo Riverside recien en
-- la tarde. El Cabo la vio pasar al sur de Muldraugh entre las 16 y las 17, zigzagueando. La
-- barricada sur de la Guardia en la 31 (la de los disparos de esa madrugada) no lo dejo pasar:
-- la camioneta quedo en la 31, cerca de la barricada, y Walt sigue al volante, transformado
-- (CANON, "Dia 0"). Hector Jr. creia que no habia pasado por la 31: se entera aca.
-- ===========================================================================
local HECTOR = "hector"
local PERFIL_HECTOR = "k93_truckstop_10"
-- Hector Jr. en la gasolinera para su escena (solo si la cura lo salvo). Se va al terminar.
local function hectorEnLaBomba()
    return { "npcs", id = HECTOR, lugar = "contacto", radio = 40, no_mas_cerca = 4, modo = "guard", quietos = true, correa = 4,
             inmortales = true, postura = "friendly", perfiles = { { "hector", PERFIL_HECTOR } },
             nombres = { hector = { "Hector", "Bencina Jr." } }, si = { "memoria", "cura_rosewood", "salvo" } }
end
local HECTOR_VIVO = { "memoria", "cura_rosewood", "salvo" }
local VAN = { "Base.StepVan", "Base.Van", "Base.VanSeats" }
local LLEGO_A_LA_BOMBA = { { "cerca", "contacto", 25 },
    { "o", { "no", HECTOR_VIVO }, { "grupo_listo", HECTOR }, { "horas", 3 } } }

registrar({
    id = "camioneta_pan",
    titulo = "La camioneta del pan",
    requiere_alife = true, automatico = false,
    -- Para la oferta de la Misia Rosa (NarradorHollis): despues de su cap. 2, una sola vez.
    si = { { "mem", "historia_rosewood_2" }, { "no", { "mem", "camioneta_pan" } } },
    vars_desde_memoria = { "cura_rosewood" },
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                -- En la 31, cerca de la barricada sur de la Guardia, al sur de Muldraugh: si no hay
                -- casas cerca, el punto mismo (la berma de la carretera).
                { "lugar", id = "camioneta", pueblo = "Muldraugh", nombre = "la barricada sur de la 31, al sur de Muldraugh",
                  cerca_de = { 10560, 11200, 300 }, solo_cerca = true,
                  salas = { "gasstore", "garagestorage", "farmstorage", "barn", "kitchen", "livingroom" } },
                { "decir_contacto", texto = "Mijito, sientate. Walt Hollis, el de la panaderia de Riverside, el tata de mi Junior, salio el 10 de julio en su camioneta blanca, la del pan pintado en la puerta, a buscar a la Linda. Nunca llego. Junior estuvo todo ese dia en la isla de la bomba mirando la 31, y no la vio pasar." },
                { "decir_contacto", retraso = 0.05, texto = "Le pregunte al Cabo por la radio de la Chela. Esa tarde, entre las cuatro y las cinco, vio una camioneta blanca al sur de Muldraugh, zigzagueando por la 31. Mas abajo estaba la barricada de la Guardia, mijito. Por ahi no pasaba nadie. Encuentrala." },
                { "decir_contacto", retraso = 0.1, texto = { por_var = "cura_rosewood", textos = {
                    salvo = "Junior no me lo va a pedir nunca. No pide nada, ese nino. Por eso te lo pido yo.",
                    murio = "Junior ya no alcanzo a saber que fue de su tata. Hazlo por el, mijito.",
                    otro = "Junior sigue en la bodega con la fiebre. Quiero tenerle algo cuando despierte. Algo que no sea una pastilla.",
                } } },
                { "mapa", lugar = "camioneta", titulo = "Mapa de la Misia Rosa: la camioneta del pan" },
                { "diario", texto = "La Misia Rosa me pidio buscar la camioneta blanca de la panaderia Hollis. Walt Hollis, el abuelo de su sobrino, salio el 10 de julio a buscar a su hija Linda y nunca llego. El Cabo la vio pasar al sur de Muldraugh. Tiene que estar en {lugar:camioneta}." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Buscar la camioneta blanca de la panaderia Hollis en {lugar:camioneta}.",
            objetivo = "camioneta",
            salidas = {
                { cuando = { "cerca", "camioneta", 50 }, ir = "camioneta" },
                { cuando = { "horas", 168 }, ir = "final_abandono" },
            },
        },
        camioneta = {
            pista = "Revisar la camioneta de Walt Hollis en {lugar:camioneta}. Algo se mueve adentro.",
            objetivo = "camioneta",
            al_entrar = {
                { "aviso", texto = "Cerca de la barricada sur de la Guardia, entre sacos de arena y casquillos viejos, hay una camioneta blanca atravesada en la berma de la 31, con la puerta abierta. En la puerta, un pan pintado a mano y 'Panaderia Hollis - Riverside'." },
                { "vehiculo", lugar = "camioneta", radio = 40, scripts = VAN, bencina = 0.2, blanco = true },
                { "zombi_jefe", lugar = "camioneta", radio = 40, outfit = "Chef" },
                { "oleada", lugar = "camioneta", radio = 45, cantidad = { 6, 10 }, min = 15, max = 30, retraso = 0.05 },
                { "nota", lugar = "camioneta", radio = 40, titulo = "Una bolsa de pan escrita con lapiz de carpintero",
                  texto = "10 de julio, en la tarde. Me mordio Purdy, el cartero. Me envolvi el brazo con el delantal. Se me fue el dia entero tratando de salir de Riverside. Voy por Linda a Rosewood, pero la Guardia cerro la 31 y no deja pasar a nadie. Me tiembla el pulso. Si alguien encuentra esto: digale a Linda que el viejo fue. Digale a Junior que el tata fue. W. H." },
            },
            salidas = {
                { cuando = { { "horas", 0.1 }, { "sin_zombis", "camioneta", 10 } }, ir = "registrar" },
                { cuando = { { "horas", 2 }, { "cerca", "camioneta", 20 } }, ir = "registrar" },
            },
        },
        registrar = {
            pista = "Elegir que te llevas de la camioneta de Walt (clic derecho cerca): la libreta, la foto o las llaves.",
            ancla = "camioneta", radio = 15,
            al_entrar = {
                { "aviso", texto = "Walt Hollis ya descansa. Tenia el brazo envuelto en un delantal y harina en las cejas. En la camioneta quedan tres cosas suyas: una libreta de recetas en la guantera, una foto en el parasol y las llaves en el contacto." },
                { "diario", texto = "Encontre la camioneta de Walt Hollis en la 31, cerca de la barricada sur de la Guardia: no lo dejaron pasar. Walt seguia al volante, transformado. Le di descanso. Dejo una bolsa de pan escrita: 'Digale a Junior que el tata fue'." },
            },
            opciones = {
                { id = "receta", texto = "Llevarte la libreta de recetas de Walt",
                  acciones = { { "variable", nombre = "recuerdo", valor = "receta" },
                               { "dar_objeto", id = "receta", tipo = { "Base.Notebook", "Base.Journal" }, nombre = "La libreta de recetas de Walt Hollis" } } },
                { id = "foto", texto = "Llevarte la foto del parasol",
                  acciones = { { "variable", nombre = "recuerdo", valor = "foto" },
                               { "dar_objeto", id = "foto", tipo = { "Base.Photo", "Base.Postcard", "Base.SheetPaper2" }, nombre = "La foto del parasol de Walt Hollis" } } },
                { id = "llaves", texto = "Llevarte las llaves (y la camioneta)",
                  acciones = { { "variable", nombre = "recuerdo", valor = "llaves" },
                               { "llaves_vehiculo", lugar = "camioneta", radio = 40, nombre = "Las llaves de la camioneta del pan",
                                 scripts = VAN, bencina = 0.2, blanco = true } } },
            },
            salidas = { { cuando = { "o", { "eleccion", "receta" }, { "eleccion", "foto" }, { "eleccion", "llaves" } }, ir = "volver" } },
        },
        volver = {
            pista = "Volver a la gasolinera de la Misia Rosa y contarle lo de Walt.",
            objetivo = "contacto",
            al_entrar = {
                hectorEnLaBomba(),
                { "diario", texto = { por_var = "recuerdo", textos = {
                    receta = "Me traje la libreta de recetas de Walt. Tiene la letra apretada y manchas de mantequilla.",
                    foto = "Me traje la foto del parasol: Walt con una mujer joven de chaleco cafe y tres ninos en la puerta de la panaderia.",
                    llaves = "Me traje las llaves de la camioneta del pan. El motor tose, pero anda. Huele a pan hasta en el estanque.",
                } } },
            },
            salidas = { { cuando = LLEGO_A_LA_BOMBA, ir = "gasolinera" } },
        },
        gasolinera = {
            pista = "Contarle a la Misia Rosa lo de Walt (clic derecho cerca).",
            ancla = "contacto", ancla_grupo = HECTOR, radio = 15,
            al_entrar = {
                { "decir_contacto", texto = "La encontraste. Se te nota en la cara, mijito. ... Sientate. El cafe esta recalentado, como debe ser." },
                { "decir", grupo = HECTOR, rol = "hector", retraso = 0.03, texto = "Socio. ... Encontro la camioneta del tata, cierto? No me diga que no pasa nada." },
            },
            opciones = { { id = "contar", texto = "Contarle lo de Walt y la camioneta" } },
            salidas = { { cuando = { "eleccion", "contar" }, ir = "contado" } },
        },
        -- La escena de Hector Jr. (si esta) y de la Misia Rosa. Paga aca y despues, si Yvonne vive
        -- en el refugio, falta contarle a ella.
        contado = {
            al_entrar = {
                { "aviso", si = { "grupo_listo", HECTOR }, texto = "La Misia Rosa le toma la mano a Junior por encima del mostrador. El no la suelta." },
                { "decir_contacto", texto = "Fue a buscar a la Linda. Mordido y todo, fue, y lo paro la Guardia en la barricada. Asi eran los Hollis, mijito: tercos como mula y buenos como el pan." },
                { "decir", grupo = HECTOR, rol = "hector", retraso = 0.03, texto = "Yo creia que no habia pasado por la 31. Estuve todo el dia en la isla, mirando. ... Paso. Llego hasta la barricada y la Guardia no lo dejo seguir. Fue. El tata fue. Ya." },
                { "decir", grupo = HECTOR, rol = "hector", retraso = 0.06, texto = { por_var = "recuerdo", textos = {
                    foto = "El tata y la mama, con el chaleco cafe de los sabados. Y los tres en la puerta. ... La pego en la caja, al lado del tio. Ahi queda.",
                    receta = "La letra del tata. ... No, socio. Esa llevesela a la senora Yvonne. Ella sabe leerla; yo con suerte parcho neumaticos.",
                    llaves = "La camioneta del pan. Si le falla algo, traigamela. Bueno, casi todo lo arreglo.",
                } } },
                { "decir_contacto", retraso = 0.06, si = { "no", HECTOR_VIVO }, texto = { por_var = "cura_rosewood", textos = {
                    murio = "Junior lo espero todo ese dia en la isla de la bomba. Ahora se esperan los dos, mijito. Alla.",
                    otro = "Se lo cuento yo a Junior cuando le baje la fiebre. Despacito, con cafe.",
                } } },
                -- Hector dice las cosas a tiempo: le cuenta a la tia lo de Shively (abre la iglesia de Shively).
                { "decir", grupo = HECTOR, rol = "hector", retraso = 0.1, texto = "Tia... hay otra cosa. El Tecolote me dio una direccion: una iglesia de ladrillo en Shively, en la Dixie Highway. Una mujer con delantal de farmacia y un cabro de catorce. Puede ser la mama. Puede ser nada." },
                { "decir_contacto", retraso = 0.13, si = { "grupo_listo", HECTOR }, texto = "Y me lo dices ahora, mijito? ... Ya. Por lo menos me lo dijiste. De eso hablamos manana." },
                { "pago_encargo", lugar = "contacto", radio = 35 },
                { "memoria", clave = "camioneta_pan", valor = "var:recuerdo" },
                { "retirar_lejos", grupo = HECTOR, lugar = "contacto", radio = 40, retraso = 1 },
            },
            salidas = {
                { cuando = { "bell_vive", "madre" }, ir = "yvonne" },
                { ir = "final_rosa" },
            },
        },
        yvonne = {
            pista = "Contarle a Yvonne lo de Walt, en {lugar:refugio} (clic derecho cerca de ella).",
            ancla = "refugio", radio = 20,
            al_entrar = {
                { "lugar_bell", id = "refugio" },
                { "diario", texto = "Falta contarle a Yvonne. Trabajo diecisiete anos con Walt. Ella cerro la panaderia ese dia." },
            },
            opciones = {
                { id = "contar", texto = "Contarle a Yvonne que encontraste a Walt", si = PRESENTE("madre") },
                { id = "receta", texto = "Contarle y darle la libreta de recetas de Walt", requiere = { "objeto", "receta" },
                  falta = "No llevas la libreta de Walt.", si = { PRESENTE("madre"), { "var", "recuerdo", "receta" } } },
            },
            salidas = {
                { cuando = { "eleccion", "contar" }, ir = "final_yvonne" },
                { cuando = { "eleccion", "receta" }, ir = "final_receta" },
                { cuando = SIN_YVONNE, ir = "final_rosa" },
            },
        },

        final_yvonne = { final = true, al_entrar = {
            { "decir_bell", rol = "madre", texto = "'Cierra tu, Yvonne. Voy por Linda.' Eso fue lo ultimo que me dijo, corazon. Yo estaba amasando. Siempre estoy amasando cuando se muere alguien." },
            { "decir_bell", rol = "madre", retraso = 0.03, texto = "Diecisiete anos llegando a las tres y veinte y esperando en la camioneta, para que yo creyera que llegaba antes. ... Gracias por ir a buscarlo." },
            { "decir_bell", rol = "madre", retraso = 0.06, si = { "var", "recuerdo", "foto" }, texto = "La foto del parasol. Linda con el chaleco cafe de los sabados. Esa es de Junior, corazon. Que la tenga el." },
            { "decir_bell", rol = "madre", retraso = 0.06, si = { "var", "recuerdo", "llaves" }, texto = "Esa camioneta olia a pan hasta en el estanque. Cuidemela, corazon." },
            { "decir_bell", rol = "madre", retraso = 0.06, si = { "var", "recuerdo", "receta" }, texto = "Y la libreta de Walt... guardela usted, corazon. Cuando haya horno, me la presta." },
            { "diario", texto = "Le conte a Yvonne que encontre a Walt. Me repitio lo ultimo que le dijo: 'Cierra tu, Yvonne. Voy por Linda'. No lloro. Doblo una manta en tres y la volvio a doblar." },
        } },
        final_receta = { final = true, al_entrar = {
            { "decir_bell", rol = "madre", texto = "'Cierra tu, Yvonne. Voy por Linda.' Eso fue lo ultimo que me dijo, corazon. Yo estaba amasando. Siempre estoy amasando cuando se muere alguien." },
            { "decir_bell", rol = "madre", retraso = 0.03, texto = "La letra de Walt. Pagina doce: el pan de Hazel, de 1931. ... Esto no es una libreta, corazon. Es una casa." },
            { "memoria", clave = "receta_walt", valor = true },
            { "diario", texto = "Le conte a Yvonne lo de Walt y le di su libreta de recetas. La abrio en la pagina doce sin buscarla, como si supiera donde estaba. Dice que no es una libreta: es una casa." },
        } },
        final_rosa = { final = true, al_entrar = {
            { "diario", texto = "Le conte a la Misia Rosa lo de Walt Hollis. Dijo que los Hollis eran tercos como mula y buenos como el pan. Anoto a Walt en pasado, con letra bonita." },
        } },
        final_abandono = { final = true, al_entrar = {
            { "decir_contacto", texto = "No importa, mijito. La camioneta no se va a ninguna parte. Walt tampoco." },
            { "diario", texto = "Nunca fui a buscar la camioneta de Walt Hollis. Sigue en la 31, con el adentro." },
        } },
    },
})

-- ===========================================================================
-- 3. La iglesia de Shively
-- El dato del Tecolote (que no lo vio: se lo conto el Pato Rengo por el 19 en septiembre): una
-- mujer con delantal de farmacia y un chico de unos 14 en una iglesia de ladrillo de la Dixie
-- Highway, en Shively, con el letrero del bingo de los martes. Puede ser Linda Hollis con Nico.
-- Se sortea: vivos, una nota (se fueron al norte) o cebo de bandidos (el Pato Rengo, grabado).
-- Con la radio de la Chela arreglada (radio_westpoint), la Misia Rosa te avisa que la voz se
-- repite como disco rayado, y si es cebo hay menos bandidos y los ves antes.
-- ===========================================================================
local HOLLIS = "hollis"
local PERFIL_LINDA, PERFIL_NICO = "k93_county_ems_03", "k93_hensley_family_04"

local function unir(a, b)
    local l = {}
    for _, x in ipairs(a) do l[#l + 1] = x end
    for _, x in ipairs(b) do l[#l + 1] = x end
    return l
end

-- Linda y Nico se quedan con la Misia Rosa, de guardias en la gasolinera (los que lleguen).
local function hollisSeQuedan()
    return {
        { "soltar_acompanante", grupo = HOLLIS, rol = "linda" },
        { "soltar_acompanante", grupo = HOLLIS, rol = "nico" },
        { "salvado_campamento", contacto = "rosewood", nombre = "Linda", apellido = "Hollis", perfil = PERFIL_LINDA,
          grupo = HOLLIS, rol = "linda", si = { "vivo", HOLLIS, "linda" } },
        { "salvado_campamento", contacto = "rosewood", nombre = "Nico", apellido = "Bencina", perfil = PERFIL_NICO,
          grupo = HOLLIS, rol = "nico", si = { "vivo", HOLLIS, "nico" } },
        { "retirar_lejos", grupo = HOLLIS, lugar = "contacto", radio = 40, retraso = 1.5 },
        { "retirar_lejos", grupo = HECTOR, lugar = "contacto", radio = 40, retraso = 1.5 },
    }
end

registrar({
    id = "iglesia_shively",
    titulo = "La iglesia de Shively",
    requiere_alife = true, automatico = false,
    -- Para la oferta de la Misia Rosa (NarradorHollis): despues de la camioneta, con Hector vivo.
    si = { HECTOR_VIVO, { "mem", "camioneta_pan" }, { "no", { "mem", "shively" } } },
    vars_desde_memoria = { "camioneta_pan", "radio_westpoint" },
    sorteo = { resultado = { valores = { "vivos", "nota", "trampa" }, pesos = { 2, 2, 1 } } },
    inicio = "encargo",
    etapas = {
        encargo = {
            al_entrar = {
                -- Shively queda al suroeste de Louisville; si no hay iglesia ahi, cualquiera del pueblo.
                { "lugar", id = "iglesia", pueblo = "Louisville", nombre = "la iglesia de ladrillo de Shively", salas = { "church" },
                  respaldo = { "office", "livingroom" }, cerca_de = { 12200, 3300, 700 } },
                { "decir_contacto", texto = "Mijito. Junior me conto una cosa que se tenia guardada: el Tecolote le dio una direccion. Una iglesia de ladrillo en Shively, en la Dixie Highway, con el letrero del bingo de los martes. Dicen que ahi vieron a una mujer con delantal de farmacia y un cabro de catorce. Puede ser la Linda con el Nico." },
                { "decir_contacto", retraso = 0.05, texto = "Al Tecolote no le compro ni la hora. Pero una mama con su cabro chico eso no se vende, dice Junior. Anda a Louisville, mijito. Y vuelve antes que oscurezca, aunque sea de otro dia." },
                { "decir_contacto", retraso = 0.1, si = { "var", "radio_westpoint", true },
                  texto = "Otra cosa. La Chela me dijo por su radio que en el 19 alguien repite lo de esa iglesia todas las noches, igualito, como disco rayado. Puede ser la Linda llamando. Puede ser cebo. Ojo, mijito." },
                { "mapa", lugar = "iglesia", titulo = "Mapa de la Misia Rosa: la iglesia de Shively" },
                { "diario", texto = "El Tecolote le paso a Hector Jr. una direccion: una iglesia de ladrillo de Shively, en Louisville. Ahi vieron a una mujer con delantal de farmacia y un chico de catorce. Pueden ser Linda Hollis y Nico, su mama y su hermano. La Misia Rosa me manda a ver." },
            },
            salidas = { { ir = "viaje" } },
        },
        viaje = {
            pista = "Ir a {lugar:iglesia}, en Louisville, a buscar a Linda y Nico.",
            objetivo = "iglesia",
            salidas = {
                { cuando = { "cerca", "iglesia", 60 }, ir = "llegada" },
                { cuando = { "horas", 168 }, ir = "final_abandono" },
            },
        },
        llegada = {
            salidas = {
                { cuando = { "var", "resultado", "vivos" }, ir = "sitio" },
                { cuando = { "var", "resultado", "nota" }, ir = "vacia" },
                { ir = "cebo" },
            },
        },

        -- Siguen vivos.
        sitio = {
            pista = "Mantener vivos a Linda y Nico en {lugar:iglesia}: van {bajas:iglesia} de {meta_shively}.",
            objetivo = "iglesia",
            al_entrar = {
                { "variable", nombre = "meta_shively", valor = 9999 },
                { "aviso", texto = "El letrero del bingo de los martes sigue colgado en {lugar:iglesia}. Adentro alguien golpea una olla para que no entren los muertos. Son muchos." },
                { "npcs", id = HOLLIS, lugar = "iglesia", radio = 40, no_mas_cerca = 6, modo = "guard", quietos = true, correa = 4,
                  postura = "friendly", perfiles = { { "linda", PERFIL_LINDA }, { "nico", PERFIL_NICO } },
                  nombres = { linda = { "Linda", "Hollis" }, nico = { "Nico", "Bencina" } }, femeninos = { "linda" } },
                { "oleada", lugar = "iglesia", radio = 55, cantidad = 35, por_jugador = 12, fija = true, caminantes = true,
                  planta_baja = true, min = 14, max = 40, meta = "meta_shively", meta_frac = 0.8 },
                { "oleada", lugar = "iglesia", radio = 55, cantidad = { 6, 9 }, correr = true, planta_baja = true, min = 25, max = 45, retraso = 0.4 },
            },
            salidas = {
                { cuando = { "todos_muertos", HOLLIS }, ir = "final_muertos" },
                { cuando = { { "grupo_listo", HOLLIS }, { "o", { "bajas_en", "iglesia", "var:meta_shively", 70 },
                    { { "horas", 1 }, { "sin_zombis", "iglesia", 15 } } } }, ir = "hablar" },
            },
        },
        hablar = {
            pista = "Hablar con Linda Hollis (clic derecho cerca).",
            ancla = "iglesia", ancla_grupo = HOLLIS, radio = 20,
            al_entrar = {
                { "decir", grupo = HOLLIS, rol = "linda", texto = "No se acerque mas. Ya nos mintieron dos veces con eso de 'vengo de parte de'. Quien lo manda?" },
            },
            opciones = {
                { id = "junior", texto = "Decirle que la manda Junior: 'Lleno o normal?', como dice la Misia Rosa",
                  dice = { rol = "linda", texto = "Lleno o normal... Esa es la Rosa. Entonces Junior esta vivo. ... Vamos, Nico. Nos vamos a la casa." } },
                { id = "foto", texto = "Mostrarle la foto del parasol de Walt", si = { "var", "camioneta_pan", "foto" },
                  dice = { rol = "linda", texto = "Mi papa. Esa foto la tenia en el parasol de la camioneta. ... Si usted la tiene, el fue. Fue a buscarme, el viejo terco. Vamos, Nico." } },
            },
            salidas = {
                { cuando = { "todos_muertos", HOLLIS }, ir = "final_muertos" },
                { cuando = { "o", { "eleccion", "junior" }, { "eleccion", "foto" } }, ir = "escolta" },
            },
        },
        escolta = {
            pista = "Linda y Nico van por su cuenta a la gasolinera de Rosewood. Vuelve con la Misia Rosa: te esperan alla.",
            objetivo = "contacto",
            al_entrar = {
                { "acompanante", grupo = HOLLIS, rol = "linda", nombre = "Linda Hollis", inmortal = false },
                { "acompanante", grupo = HOLLIS, rol = "nico", nombre = "Nico Bencina", inmortal = false },
                { "banderas", grupo = HOLLIS, quietos = false, correa = 0 },
                hectorEnLaBomba(),
                { "diario", texto = { por_var = "camioneta_pan", textos = {
                    foto = "Encontre a Linda Hollis y a Nico en la iglesia de Shively. Linda reconocio la foto de su papa y supo, sin que se lo dijera, que Walt habia ido a buscarla. Vamos a Rosewood.",
                    otro = "Encontre a Linda Hollis y a Nico en la iglesia de Shively. Le dije 'Lleno o normal?' y entendio que la mandaba buscar la Rosa. Vamos a Rosewood.",
                } } },
            },
            salidas = {
                { cuando = { "todos_muertos", HOLLIS }, ir = "final_muertos" },
                { cuando = { "npc_cerca", HOLLIS, "contacto", 15 }, ir = "reencuentro" },
            },
        },
        reencuentro = {
            al_entrar = {
                { "variable", nombre = "llegaron", valor = "dos" },
                { "variable", nombre = "llegaron", valor = "linda", si = { "muerto", HOLLIS, "nico" } },
                { "variable", nombre = "llegaron", valor = "nico", si = { "muerto", HOLLIS, "linda" } },
            },
            -- Que Junior este en la bomba para la escena (si no aparece en media hora, igual).
            salidas = { { cuando = { "o", { "grupo_listo", HECTOR }, { "horas", 0.5 } }, ir = "final_vivos" } },
        },
        final_vivos = { final = true, al_entrar = unir(hollisSeQuedan(), {
            { "decir", grupo = HOLLIS, rol = "linda", texto = { por_var = "llegaron", textos = {
                dos = "Junior. ... Mijo, estas flaco. Y esa mano?",
                linda = "Junior. ... Nico se quedo en el camino, mijo. Se quedo." } } },
            { "decir", grupo = HOLLIS, rol = "nico", texto = { por_var = "llegaron", textos = {
                dos = "Junior. Mama decia todas las noches que la luz de la Rosa se veia desde la 31.",
                nico = "Junior. Mama... mama no llego." } } },
            { "decir", grupo = HECTOR, rol = "hector", retraso = 0.03, texto = { por_var = "llegaron", textos = {
                dos = "Mama. ... Nico. ... Lleno o normal?",
                linda = "Ya. ... Ya, mama. Sientese.",
                nico = "Ven aca, cabro. Ven." } } },
            { "decir", grupo = HOLLIS, rol = "linda", retraso = 0.06, si = { "var", "llegaron", "dos" }, texto = "Lleno, mijo. Lleno." },
            { "decir_contacto", retraso = 0.09, texto = { por_var = "llegaron", textos = {
                dos = "Linda. Pasa, que hay cafe. Y tu, Nico, sientate en el cajon bueno. ... Mijito, toma. Esto no se paga, pero toma igual.",
                otro = "Pasa. Hay cafe y hay silla. ... Mijito, toma. Uno es mucho en estos tiempos." } } },
            { "memoria", clave = "shively", valor = "vivos", si = { "var", "llegaron", "dos" } },
            { "memoria", clave = "shively", valor = "uno", si = { "no", { "var", "llegaron", "dos" } } },
            { "pago_encargo", lugar = "contacto", radio = 35 },
            { "diario", texto = { por_var = "llegaron", textos = {
                dos = "Traje a Linda Hollis y a Nico a la gasolinera de Rosewood. Junior le pregunto a su mama 'lleno o normal' y ella dijo 'lleno'. La Misia Rosa puso tres tazas y no anoto nada en el cuaderno. Se quedan con ella.",
                linda = "Traje a Linda Hollis a la gasolinera de Rosewood. Nico no llego. Junior la sento en el cajon bueno y no le solto la mano. Se queda con la Misia Rosa.",
                nico = "Traje a Nico a la gasolinera de Rosewood. Su mama no llego. Junior lo abrazo con la mano del guante. Se queda con la Misia Rosa.",
            } } },
        }) },
        final_muertos = { final = true, al_entrar = {
            { "soltar_acompanante", grupo = HOLLIS, rol = "linda" },
            { "soltar_acompanante", grupo = HOLLIS, rol = "nico" },
            { "decir_contacto", texto = "No me lo digas, mijito. Ya se. ... Los anoto en pasado, con letra bonita. A Junior se lo digo yo." },
            { "memoria", clave = "shively", valor = "muertos" },
            { "retirar_lejos", grupo = HECTOR, lugar = "contacto", radio = 40, retraso = 1 },
            { "diario", texto = "Linda Hollis y Nico murieron antes de llegar a Rosewood. Eran ellos. La Misia Rosa los anoto en pasado y Junior se fue a la isla de la bomba a mirar la 31." },
        } },

        -- Ya no estan: dejaron una nota en el letrero del bingo.
        vacia = {
            pista = "Buscar a Linda y Nico en {lugar:iglesia}.",
            objetivo = "iglesia",
            al_entrar = {
                { "aviso", texto = "La iglesia esta vacia. Bancos corridos contra las ventanas, frazadas dobladas, una olla con ceniza. En el letrero del bingo de los martes hay un papel clavado." },
                { "oleada", lugar = "iglesia", radio = 50, cantidad = { 12, 18 }, min = 14, max = 35 },
                { "nota", id = "nota_linda", lugar = "iglesia", radio = 40, titulo = "La nota del letrero del bingo",
                  texto = "Junior: estuvimos aqui desde julio. Nico esta bien, flaco pero bien. Nos vamos con la gente del bingo al norte, por el puente. No se adonde. Si alguien de Rosewood lee esto: digan en la bomba que la Linda vive. Que dejen la luz prendida. L. H." },
            },
            salidas = { { cuando = { "alguien_tiene", "nota_linda" }, ir = "volver_nota" } },
        },
        volver_nota = {
            pista = "Llevarle la nota de Linda a Junior, a la gasolinera de Rosewood.",
            ancla = "contacto", ancla_grupo = HECTOR, radio = 15,
            al_entrar = {
                hectorEnLaBomba(),
                { "diario", texto = "Linda Hollis y Nico estuvieron en la iglesia de Shively. Ya no estan: dejaron una nota para Junior en el letrero del bingo. Se fueron al norte." },
            },
            opciones = { { id = "entregar", texto = "Darle a Junior la nota de su mama", requiere = { "objeto", "nota_linda" },
                falta = "No llevas la nota de Linda." } },
            salidas = { { cuando = { "eleccion", "entregar" }, ir = "final_nota" } },
        },
        final_nota = { final = true, al_entrar = {
            { "decir", grupo = HECTOR, rol = "hector", texto = "La letra de la mama. ... Vive. Se fue al norte con el Nico, pero vive." },
            { "decir", grupo = HECTOR, rol = "hector", retraso = 0.03, texto = "Que dejen la luz prendida, dice. ... Como si aca se apagara, tia." },
            { "decir_contacto", retraso = 0.06, texto = "Aca no se apaga, mijito. Nunca. Ahora menos. ... Toma, mijito. Por traerle la letra de su mama." },
            { "pago_encargo", lugar = "contacto", radio = 35 },
            { "memoria", clave = "shively", valor = "nota" },
            { "retirar_lejos", grupo = HECTOR, lugar = "contacto", radio = 40, retraso = 1 },
            { "diario", texto = "Le di a Junior la nota de su mama. La leyo dos veces y la pego en la caja, al lado de la foto del tio. Linda y Nico viven, en algun lado al norte. La luz de la gasolinera queda prendida." },
        } },

        -- Era cebo: el letrero recien pintado y una radio que repite la voz del Pato Rengo.
        cebo = {
            pista = "Algo no calza en {lugar:iglesia}. Salir vivo.",
            objetivo = "iglesia",
            al_entrar = {
                { "aviso", texto = "El letrero del bingo esta recien pintado. Adentro, una radio CB repite la misma voz grabada: 'una mujer y un cabro, en la iglesia de Shively'. Es cebo." },
                { "aviso", retraso = 0.02, si = { "var", "radio_westpoint", true },
                  texto = "La Chela tenia razon: es un disco rayado. Por eso los ves a ellos antes que ellos a ti." },
                { "bandidos", id = "cebo", lugar = "iglesia", radio = 55, modo = "hunt", cantidad = { 5, 7 }, retraso = 0.05,
                  si = { "no", { "var", "radio_westpoint", true } } },
                { "bandidos", id = "cebo", lugar = "iglesia", radio = 55, modo = "guard", cantidad = { 3, 4 }, retraso = 0.05,
                  si = { "var", "radio_westpoint", true } },
                { "armar_grupo", grupo = "cebo", lugar = "iglesia", radio = 90, retraso = 0.1 },
                { "oleada", lugar = "iglesia", radio = 50, cantidad = { 8, 12 }, min = 20, max = 40, retraso = 0.3 },
            },
            salidas = {
                { cuando = { "todos_muertos", "cebo" }, ir = "radio_pato" },
                { cuando = { { "horas", 3 }, { "no", { "cerca", "iglesia", 100 } } }, ir = "final_huida" },
            },
        },
        radio_pato = {
            pista = "Revisar la radio de {lugar:iglesia}.",
            objetivo = "iglesia",
            al_entrar = {
                { "aviso", texto = "Detras del altar hay una radio CB con una cinta en loop, y una billetera con una licencia de camionero. Es del Pato Rengo, el que le paso el dato al Tecolote en septiembre." },
                { "objeto", id = "radio", lugar = "iglesia", radio = 30, tipo = { "Base.RadioRed", "Base.WalkieTalkie2" }, nombre = "La radio del Pato Rengo" },
            },
            salidas = { { cuando = { "alguien_tiene", "radio" }, ir = "volver_cebo" } },
        },
        volver_cebo = {
            pista = "Volver a la gasolinera de Rosewood y contarle a Junior lo de Shively.",
            ancla = "contacto", ancla_grupo = HECTOR, radio = 15,
            al_entrar = {
                hectorEnLaBomba(),
                { "diario", texto = "La iglesia de Shively era cebo. Una radio repetia la voz del Pato Rengo para atraer a los que buscan a los suyos. Linda y Nico no estaban. Tengo que contarle a Junior." },
            },
            opciones = { { id = "contar", texto = "Contarle a Junior que era cebo" } },
            salidas = { { cuando = { "eleccion", "contar" }, ir = "final_cebo" } },
        },
        final_cebo = { final = true, al_entrar = {
            { "decir", grupo = HECTOR, rol = "hector", texto = "Cebo. ... El Tecolote no mintio, socio. Le mintieron a el. Al Pato Rengo lo usaron de disco." },
            { "decir", grupo = HECTOR, rol = "hector", retraso = 0.03, texto = "La mama sigue en algun lado. En algun lado que no es ese. Ya." },
            { "decir_contacto", retraso = 0.06, texto = "Ven, mijito. Deja esa radio. ... La luz queda prendida igual. Por si acaso. Toma, mijito: volviste, y eso se paga." },
            { "pago_encargo", lugar = "contacto", radio = 35 },
            { "memoria", clave = "shively", valor = "trampa" },
            { "retirar_lejos", grupo = HECTOR, lugar = "contacto", radio = 40, retraso = 1 },
            { "diario", texto = "Le conte a Junior que Shively era cebo. Dijo que el Tecolote no le mintio: le mintieron a el. Sigue mirando la 31 de noche. La luz de la gasolinera, prendida." },
        } },
        final_huida = { final = true, al_entrar = {
            { "memoria", clave = "shively", valor = "trampa" },
            { "diario", texto = "La iglesia de Shively era cebo: una radio repetia la voz del Pato Rengo y habia gente armada esperando. Sali de ahi como pude. Linda y Nico no estaban." },
        } },
        final_abandono = { final = true, al_entrar = {
            { "diario", texto = "No fui a Shively. La direccion sigue en el cuaderno de Junior, al lado de la linea en blanco." },
        } },
    },
})
