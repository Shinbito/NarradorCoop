-- Narrador Co-op: lo que el personaje escribe en el diario durante los encargos generados.
-- Una entrada por etapa de cada tipo (ver Arcos/Generados.lua). Sin tildes ni enies.

require "Narrador/NarradorLore"

local Lore = Narrador.Lore

local VOLVER = "Ya esta. Ahora hay que volver donde {contacto_nombre}, en {lugar:contacto}, antes de que se acabe el plazo."

local FINALES = {
    final_cumplido = "Cumpli el encargo de {contacto_nombre}: {titulo}. {cliente} va a dormir mejor esta noche. Yo tambien, un poco.",
    final_vencido = "Se acabo el plazo del encargo de {contacto_nombre}. {cliente} ya no me necesita. O ya no puede necesitarme.",
    final_fallido = "El encargo de {contacto_nombre} salio mal. No todo se puede.",
    final_abandonado = "Deje abandonado el encargo de {contacto_nombre}. Me lo va a recordar cada vez que pase por {ciudad}.",
    final_muerto = "{cliente} no salio vivo. Lo escribo para no olvidarme de su nombre.",
    final_dejaste = "No le quite nada a una familia que apenas tenia techo. {contacto_nombre} lo va a entender. Yo lo entiendo.",
}

local TIPOS = {
    buscar = {
        viaje = "{contacto_nombre} me mando a buscar {objeto_que} para {cliente}. Esta en {lugar:objetivo}. Siempre esta en el lugar con mas muertos.",
        en_sitio = "Estoy en {lugar:objetivo}. {objeto_nombre} tiene que estar por aqui. Silencio y ojos abiertos.",
        volver = VOLVER,
    },
    recuerdo = {
        viaje = "{cliente} perdio {objeto_que}. No sirve para sobrevivir, pero sirve para algo mas. Voy a {lugar:objetivo}.",
        en_sitio = "Estoy en la casa de {cliente}, o lo que queda. Hay fotos en las paredes de gente que ya no esta.",
        volver = VOLVER,
    },
    recolectar = {
        volver = "{contacto_nombre} necesita {cantidad} {recolectar_nombre} para {cliente}. Tengo que juntarlos donde sea y llevarselos.",
    },
    entregar = {
        viaje = "Llevo un paquete para {cliente}, en {lugar:objetivo}. No lo voy a abrir. Probablemente.",
        en_destino = "Llegue a {lugar:objetivo}. {cliente} tiene que estar cerca, esperando su paquete.",
    },
    rescate = {
        viaje = "{cliente} esta atrapado en {lugar:objetivo}. Cada hora que pasa son mas los que golpean su puerta.",
        en_sitio = "Encontre a {cliente}. Esta asustado y vienen mas. Hay que aguantar.",
        no_quiere = "{cliente} no quiere volver. Dice que lo dejaron solo una vez y no le va a pasar de nuevo. Tengo que decidir.",
        volver = "{cliente} va camino a {ciudad}. Tengo que avisarle a {contacto_nombre}.",
    },
    investigar = {
        viaje = "{buscado} desaparecio en {lugar:objetivo}. {cliente} quiere saber que paso. Yo tambien, ahora.",
        en_sitio = "Estoy en {lugar:objetivo}. Busco rastros de {buscado}: una nota, un zapato, algo.",
        segundo_viaje = "{buscado} dejo una nota: se fue a {lugar:segundo}. La sigo.",
        en_segundo = "Llegue a {lugar:segundo}. Si {buscado} esta vivo, esta aqui.",
        volver = "{buscado} esta vivo. Tengo que contarselo a {contacto_nombre}.",
        volver_triste = "Encontre a {buscado}. Lo que quedaba de {buscado}. Llevo su identificacion. No se que le voy a decir a {contacto_nombre}.",
    },
    alijo = {
        viaje = "{contacto_nombre} me paso el dato de un alijo en {lugar:objetivo}. Lo que encuentre es mio. Eso dicen siempre.",
        en_sitio = "El alijo esta en {lugar:objetivo}. Los muertos tambien. Primero limpio, despues cargo.",
    },
    contrarreloj = {
        viaje = "{cliente} esta enfermo en {lugar:objetivo}. Necesita {remedio_nombre}. El reloj corre mas rapido que yo.",
        en_casa = "Llegue donde {cliente}. Respira mal. Hay que darle {remedio_nombre} ya.",
    },
    limpieza = {
        viaje = "{contacto_nombre} quiere {lugar:objetivo} limpio. Unos {bajas_meta} muertos. Despues manda gente a ocuparlo.",
        en_sitio = "Estoy limpiando {lugar:objetivo}. Llevo {bajas:objetivo}. Faltan. Siempre faltan.",
        volver = "{lugar:objetivo} quedo limpio. {contacto_nombre} va a querer saberlo.",
    },
    reconocimiento = {
        punto1 = "Reconocimiento para {contacto_nombre}: {puntos} lugares en orden. El primero es {lugar:p1}.",
        punto2 = "Sigo con el reconocimiento. Ahora {lugar:p2}.",
        punto3 = "Tercer punto: {lugar:p3}. Ya se me acaba la libreta.",
        punto4 = "Ultimo punto: {lugar:p4}. Despues vuelvo con todo anotado.",
        volver = "Termine el reconocimiento. Tengo todo anotado para {contacto_nombre}.",
    },
    defensa = {
        espera = "{contacto_nombre} dice que se vienen muertos. Me pidio que aguante en {lugar:objetivo}.",
        defensa = "Aguanto en {lugar:objetivo}. {n_oleadas} oleadas, calcula {contacto_nombre}. Ojala calcule bien.",
    },
    posta = {
        tramo2 = "Llevo un paquete en posta: ahora va para {nombre_c2}, en {lugar:c2}.",
        tramo3 = "La posta sigue. Ahora le toca a {nombre_c3}, en {lugar:c3}.",
        tramo4 = "Ultimo tramo de la posta: {nombre_c4}, en {lugar:c4}.",
    },
    instalar = {
        viaje = "Tengo que dejar {instalar_nombre} en {lugar:objetivo}. Necesito {instalar_lista}.",
        en_sitio = "Estoy en {lugar:objetivo}. Hay que instalar {instalar_nombre} sin que me coman mientras tanto.",
        volver = "Quedo instalado. Ahora a cobrarle a {contacto_nombre}.",
    },
}

for tipo, etapas in pairs(TIPOS) do
    Lore.arcos["encargo_gen_" .. tipo] = { etapas = etapas, finales = FINALES }
end

return Lore
