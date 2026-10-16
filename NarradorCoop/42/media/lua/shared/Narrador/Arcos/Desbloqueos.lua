-- Desbloqueo de los misioneros: cuando un jugador anda por el pueblo de un misionero, este
-- llega a su casa y le pide ayuda para limpiar su edificio (la comisaria, el cuartel de
-- bomberos, la iglesia o la bencinera). Quiere armar ahi un campamento y el jugador se queda
-- con todo lo que encuentre adentro. No se puede rechazar: solo decir "mas rato". Al quedar
-- limpio, el misionero se instala y empieza a dar encargos.
--
-- Las lanza server/Narrador/NarradorContactos.lua (C.revisarDesbloqueo), no el director, asi
-- que corren en paralelo con la historia principal (los Bell).
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

local VISITA = "visita"
-- Primero 15 zombis adentro; despues llega una horda de 30 (mas 15 por cada jugador extra).
-- Sin corredores. Para terminar hay que matar el 80% de la horda.
local META = 15
local HORDA = 30
local HORDA_POR_JUGADOR = 15

local LISTA = {
    { id = "muldraugh", nombre = "Cabo Ramiro", apellido = "Mandados", perfil = "k93_muldraugh_pd_01",
      edificio = "la comisaria",
      llega = "El Cabo Ramiro golpea la puerta de {lugar:casa} como si trajera una orden judicial.",
      pedido = "Atencion, civil. Cabo Ramiro Mandados. La comisaria esta tomada por los muertos. Ayudeme a limpiarla y todo lo que encuentre adentro es suyo. Quiero armar ahi un campamento. Con orden.",
      ayudar = "Asi me gusta. Nos vemos en la comisaria. Llegue armado.",
      mas_rato = "Mas rato, dice. Ya. Queda anotado en la libreta. Lo espero en la comisaria.",
      gracias = "Despejado. Gracias, civil. Desde hoy esta comisaria es un campamento. Si busca trabajo, ya sabe donde estoy.",
      items = { { "Base.Pistol", "Base.Pistol2" }, { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.Nightstick", "Base.BaseballBat" },
                { "Base.Vest_BulletPolice", "Base.Hat_Police" } } },
    { id = "westpoint", nombre = "Tia Chela", apellido = "Recados", perfil = "k93_vfd_04", femenina = true,
      edificio = "el cuartel de bomberos",
      llega = "Alguien golpea la puerta de {lugar:casa}. Es una senora con casco de bombero.",
      pedido = "Mijo, soy la Tia Chela. El cuartel de bomberos esta lleno de muertos y yo ahi quiero armar un campamento pa la gente que queda. Ayudame a limpiarlo y te quedas con todo lo que pilles.",
      ayudar = "Ese es mi mijo. Te espero en el cuartel. Toma agua antes de salir.",
      mas_rato = "Mas rato... ya, mijo, pero no me dejes plantada. Te espero en el cuartel.",
      gracias = "Quedo limpiecito. Gracias, mijo. Aca va a vivir gente de nuevo. Pasa cuando quieras, que recados me sobran.",
      items = { { "Base.Axe", "Base.WoodAxe" }, { "Base.Crowbar" }, { "Base.FirstAidKit", "Base.Bandage" }, { "Base.WaterBottleFull", "Base.WaterBottle" } } },
    { id = "riverside", nombre = "Padre Nacho", apellido = "Pegas", perfil = "k93_prather_01",
      edificio = "la iglesia",
      llega = "Golpean tres veces la puerta de {lugar:casa}, muy despacio. Es un cura.",
      pedido = "Hijo mio, soy el Padre Nacho. La iglesia esta llena de feligreses que ya no rezan. Ayudame a limpiarla y lo que encuentres es tuyo. Quiero que sea un campamento para los que quedan.",
      ayudar = "Bendito seas. Te espero en la iglesia. Lleva algo mas que fe.",
      mas_rato = "Mas rato. El Senor es paciente; yo un poco menos. Te espero en la iglesia.",
      gracias = "Aleluya. Y gracias a ti tambien, hijo. Desde hoy la iglesia es un campamento. Tengo pega para todos los fieles.",
      items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.Candle" }, { "Base.Bandage" } } },
    { id = "rosewood", nombre = "Misia Rosa", apellido = "Bencina", perfil = "k93_truckstop_04", femenina = true,
      edificio = "la bencinera",
      llega = "Una senora con delantal golpea la puerta de {lugar:casa} y grita: 'Mijito, abre!'",
      pedido = "Mijito, soy la Misia Rosa, la de la bencinera. Se me lleno de muertos y ahi quiero armar un campamento. Ayudame a limpiarla y te quedas con todo lo que haya.",
      ayudar = "Que gusto. Te espero en la bencinera. No te demores, que se pone rancio.",
      mas_rato = "Mas rato... como los camioneros. Ya, te espero en la bencinera.",
      gracias = "Limpiecita! Gracias, mijito. La bencinera nunca cierra, y ahora es campamento. Pasa cuando quieras, que hay encargos.",
      items = { { "Base.PetrolCan", "Base.EmptyPetrolCan" }, { "Base.Chips", "Base.Crisps" }, { "Base.Cigarettes" }, { "Base.TinnedBeans", "Base.CannedBeans" } } },
}

for _, c in ipairs(LISTA) do
    local quien = c.nombre
    Narrador.Defs.registrar({
        id = "desbloqueo_" .. c.id,
        titulo = quien .. " quiere un campamento",
        titulo_menu = "Desbloqueo: " .. quien,
        requiere_alife = true,
        automatico = false,
        max_veces = 1,
        inicio = "llegada",

        etapas = {
            -- 1. Llega a la casa del jugador (su refugio, o donde este si no tiene).
            llegada = {
                al_entrar = {
                    { "lugar_casa", id = "casa" },
                    { "npcs", id = VISITA, lugar = "casa", radio = 40, no_mas_cerca = 10, retraso = 0.5,
                      modo = "guard", quietos = true, correa = 4, inmortales = true, postura = "friendly",
                      perfiles = { { "visita", c.perfil } }, nombres = { visita = { c.nombre, c.apellido } },
                      femeninos = c.femenina and { "visita" } or nil },
                },
                salidas = {
                    { cuando = { "grupo_listo", VISITA }, ir = "pedido" },
                    -- Si A-Life nunca lo trajo, igual queda el recado.
                    { cuando = { "horas", 48 }, ir = "pendiente" },
                },
            },

            -- 2. Pide ayuda. No se puede rechazar: solo "mas rato".
            pedido = {
                pista = "Hablar con " .. quien .. " (clic derecho cerca).",
                ancla = "casa",
                ancla_grupo = VISITA,
                al_entrar = {
                    { "aviso", texto = c.llega },
                    { "decir", grupo = VISITA, rol = "visita", texto = c.pedido },
                    { "diario", texto = quien .. " llego a {lugar:casa}. Quiere que lo ayude a limpiar " .. c.edificio
                        .. " para armar un campamento. Lo que encuentre adentro es mio." },
                },
                opciones = {
                    { id = "ayudar", texto = "Te ayudo", dice = { rol = "visita", texto = c.ayudar } },
                    { id = "mas_rato", texto = "Mas rato", dice = { rol = "visita", texto = c.mas_rato } },
                },
                salidas = {
                    { cuando = { "eleccion", "ayudar" }, ir = "viaje" },
                    { cuando = { "eleccion", "mas_rato" }, ir = "pendiente" },
                    { cuando = { "horas", 24 }, ir = "pendiente" },
                },
            },

            -- 3a. Mas rato: se va a esperar a su edificio. No hay plazo.
            pendiente = {
                pista = "Cuando puedas, ir a {lugar:contacto} a ayudar a " .. quien .. " a limpiarlo.",
                al_entrar = {
                    { "retirar_lejos", grupo = VISITA, lugar = "casa", radio = 60, retraso = 0.3 },
                    { "diario", texto = quien .. " me espera en {lugar:contacto}. Cuando pueda, voy." },
                },
                salidas = {
                    { cuando = { "cerca", "contacto", 55 }, ir = "en_sitio" },
                },
            },

            -- 3b. Te ayudo: se adelanta a su edificio.
            viaje = {
                pista = "Ir a {lugar:contacto} a ayudar a " .. quien .. " a limpiarlo.",
                al_entrar = {
                    { "retirar_lejos", grupo = VISITA, lugar = "casa", radio = 60, retraso = 0.3 },
                },
                salidas = {
                    { cuando = { "cerca", "contacto", 55 }, ir = "en_sitio" },
                },
            },

            -- 4. Limpiar el edificio.
            en_sitio = {
                pista = "Limpiar {lugar:contacto}: van {bajas:contacto} de {bajas_meta}.",
                al_entrar = {
                    { "variable", nombre = "bajas_meta", valor = META },
                    { "oleada", lugar = "contacto", radio = 35, cantidad = META, fija = true, caminantes = true, planta_baja = true, min = 2, max = 14 },
                    { "aviso", texto = "{lugar:contacto} esta lleno de muertos. Hay que limpiarlo." },
                },
                salidas = {
                    { cuando = { "bajas_en", "contacto", META, 45 }, ir = "horda" },
                },
            },

            -- 5. El ruido atrajo una horda. Aguantar en el edificio.
            horda = {
                pista = "Aguantar la horda en {lugar:contacto}: van {bajas:contacto} de {horda_meta}.",
                al_entrar = {
                    -- Hasta que aparezca la horda, la meta es imposible (no se termina antes).
                    { "variable", nombre = "horda_meta", valor = 9999 },
                    { "aviso", texto = "Tanto disparo y tanto golpe se escucho lejos. Viene una horda hacia {lugar:contacto}. Aguanta." },
                    { "oleada", lugar = "contacto", radio = 60, cantidad = HORDA, por_jugador = HORDA_POR_JUGADOR, fija = true,
                      caminantes = true, planta_baja = true, min = 30, max = 55, meta = "horda_meta", meta_frac = 0.8, retraso = 0.15 },
                },
                salidas = {
                    { cuando = { "bajas_en", "contacto", "var:horda_meta", 70 }, ir = "final_campamento" },
                },
            },

            -- 6. Limpio: el misionero se instala y queda desbloqueado.
            final_campamento = {
                final = true,
                al_entrar = {
                    { "desbloquear_contacto", contacto = c.id, texto = c.gracias },
                    { "recompensa", lugar = "contacto", radio = 20, items = c.items },
                    { "aviso", texto = "{lugar:contacto} quedo limpio. Lo que hay adentro es tuyo. " .. quien .. " ya viene a instalarse." },
                    { "diario", texto = "Limpie " .. c.edificio .. " con " .. quien .. ". Ahora es un campamento y ahi da encargos." },
                    { "memoria", clave = "campamento_" .. c.id, valor = "fundado" },
                    -- Capitulo 1 de su modo historia (los siguientes: G.ESPECIALES en NarradorGenerador).
                    { "memoria", clave = "historia_" .. c.id .. "_1", valor = true },
                },
            },
        },
    })
end
