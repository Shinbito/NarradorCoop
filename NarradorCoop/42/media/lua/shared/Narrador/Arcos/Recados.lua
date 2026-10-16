-- Recado de un comerciante de campamento: una mision chica. "Ayudame a buscar los clavos,
-- estoy seguro de que en el garage de esa casa hay." Se marca el lugar con un mapa, hay que
-- encontrar la cosa ahi y llevarsela. Da reputacion de Knox y un poco de confianza con el
-- misionero (accion recado_hecho en server/Narrador/NarradorCampamentos.lua), tambien con
-- mala fama. Lo lanza S.recado; los pedidos estan en K.RECADOS
-- (shared/Narrador/NarradorCampamentosDefs.lua).
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"

Narrador.Defs.registrar({
    id = "recado_comerciante",
    titulo = "Recado de {comerciante}",
    titulo_menu = "Recado de un comerciante (lo lanza el campamento)",
    automatico = false,
    inicio = "encargo",

    etapas = {
        encargo = {
            al_entrar = {
                { "lugar", id = "objetivo", desde = "comerciante", salas = "var:salas", respaldo = "var:respaldo",
                  min = 60, max = 400 },
                { "objeto", id = "pieza", lugar = "objetivo", radio = 25, tipo = "var:objeto_tipo", nombre = "var:objeto_nombre" },
                { "mapa", lugar = "objetivo", titulo = "Mapa de {comerciante}" },
                { "diario", texto = "{comerciante} ({oficio}) me pidio buscar {objeto_nombre} en {lugar:objetivo}." },
            },
            salidas = { { ir = "buscar" } },
        },

        buscar = {
            pista = "Buscar {objeto_nombre} en {lugar:objetivo} para {comerciante}.",
            objetivo = "objetivo",
            salidas = {
                { cuando = { "alguien_tiene", "pieza" }, ir = "volver" },
                { cuando = { "horas", 48 }, ir = "final_vencido" },
            },
        },

        volver = {
            pista = "Llevarle {objeto_nombre} a {comerciante} (clic derecho cerca).",
            objetivo = "comerciante",
            ancla = "comerciante", radio = 8,
            opciones = {
                { id = "entregar", texto = "Entregarle {objeto_nombre} a {comerciante}", requiere = { "objeto", "pieza" },
                  falta = "No lo llevas encima." },
            },
            salidas = {
                { cuando = { "eleccion", "entregar" }, ir = "final_cumplido" },
                { cuando = { "horas", 48 }, ir = "final_vencido" },
            },
        },

        final_cumplido = {
            final = true,
            al_entrar = {
                { "recado_hecho" },
                { "diario", texto = "Le lleve {objeto_nombre} a {comerciante}. Dice que la gente se entera de estas cosas." },
            },
        },

        final_vencido = {
            final = true,
            al_entrar = {
                { "diario", texto = "No le lleve {objeto_nombre} a {comerciante}. Ya se las arreglara." },
            },
        },
    },
})
