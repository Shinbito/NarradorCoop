-- Conversaciones de Sous entre ellos (cuando quedaron aliados y viven en su base) y de la
-- base antes de la traicion de Meulen. Dialogos originales: solo imitan la forma de hablar
-- de cada uno. Sin tildes ni enies a proposito.
--
-- Roles: martin_a (Akagami), martin_z (Zent), benjamin (Matric), david (Shinbo),
-- bastian (Tati), hanz (Walita), cristian (Cristonks), jorge (Hasag), cristobal (Wertres).

require "Narrador/NarradorConversasDefs"

local reg = Narrador.Conversas.varias
local ALIADOS = { "memoria", "sous", "aliados" }
local function vivo(rol) return { "no", { "memoria", "sous_murio_" .. rol, true } } end
local function murio(rol) return { "memoria", "sous_murio_" .. rol, true } end

reg({
    -- -----------------------------------------------------------------------
    -- Yuntas y tallas (ambiente)
    -- -----------------------------------------------------------------------
    { id = "sous_latas", tipo = "ambiente", si = ALIADOS, peso = 2,
      turnos = {
          { "jorge", "Broder, alguien mas anota cuando saca algo del deposito o soy el unico?" },
          { "martin_z", "Eres el unico. Por eso eres el contador." },
          { "benjamin", "Hermano, yo anoto. Mentalmente. Que es casi lo mismo." },
          { "jorge", "No es lo mismo, manito. Ni cerca." },
      },
      al_cortar = { "jorge", "Ya, despues seguimos. Zombis primero." } },

    { id = "sous_zorro", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "hanz", "Vale, miren. Un zorro. Lo saque de una pata de silla." },
          { "martin_z", "Parece perro." },
          { "hanz", "Parece perro porque tu nunca has visto un zorro, broder." },
          { "martin_a", "Cabros, dos cosas. Uno, es un zorro. Dos, Zent, hazte uno tu y despues hablamos." },
      } },

    { id = "sous_primos", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "cristian", "Primo, akkakaka, si nieva este invierno subimos al techo mas alto. Prometelo." },
          { "jorge", "Primo, si nieva yo me quedo adentro contando frazadas." },
          { "cristian", "Compadre, que fome eres." },
          { "jorge", "Fome pero calentito, broder." },
      } },

    { id = "sous_saludo_secreto", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "benjamin", "Bro, ustedes dos tienen un saludo secreto? En serio?" },
          { "cristobal", "Es secreto, hermanito. Por eso no se pregunta." },
          { "david", "Si te lo explicamos deja de ser secreto. Es una cuestion de definicion." },
          { "benjamin", "Hermano, yo tambien quiero uno. Con alguien. Con quien sea." },
          { "cristobal", "Hazte uno con el Jorge, wn. Algo con flexiones." },
      } },

    { id = "sous_ranked", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "martin_a", "Cabros, si esto fuera una ranked, en que liga estariamos?" },
          { "martin_z", "Hierro. Con suerte." },
          { "bastian", "Oe, que pesimismo, loco. Yo digo oro por lo menos, po." },
          { "martin_a", "Oro. Pero con el Zent de support nos baja a plata." },
          { "martin_z", "Yo los cargo y ustedes me echan la culpa. Clasico." },
      } },

    { id = "sous_pinta", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "bastian", "Loco, miren esta chaqueta. Cuero real. La saque de una tienda sin un rasguno." },
          { "hanz", "Broder, estamos en el fin del mundo y tu andas de pasarela, vale." },
          { "bastian", "Justamente, po. Si me muero, que me encuentren bien vestido." },
          { "david", "Es interesante. La ropa sigue siendo estatus aunque ya no haya sociedad." },
          { "bastian", "Ves? Hasta el sociologo me da la razon." },
      } },

    { id = "sous_gym", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "jorge", "Manito, manana temprano piernas. No me falles." },
          { "benjamin", "Bro, piernas no. Hice piernas el mes pasado." },
          { "jorge", "Por eso, broder. Un mes. Sangre, eso es abandono." },
          { "cristobal", "Yo me sumo, hermanito. Con mi altura, una sentadilla son dos." },
      } },

    { id = "sous_cristiano", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "cristobal", "Wn, ustedes creen que Cristiano sigue vivo? Ese no se muere ni con zombis." },
          { "martin_z", "Seguro esta entrenando en un bunker. Con nutricionista." },
          { "cristobal", "Siuuu. Ya, perdon. Me emocione, hermanito." },
          { "bastian", "Loco, si lo encontramos, yo le pido la polera. Tu le pides el autografo." },
      } },

    { id = "sous_tallado_ajedrez", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "hanz", "Broder, ya tengo la reina del ajedrez. Quedo bonita, vale." },
          { "martin_a", "Bien, mi sangre. Cuantas piezas faltan?" },
          { "hanz", "Como veinte. Pero la reina es la que importa." },
          { "martin_z", "En el ajedrez de verdad importa el rey." },
          { "hanz", "En el mio no, broder. Mi ajedrez, mis reglas." },
      } },

    { id = "sous_cerro", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "cristian", "Compadre, desde el cerro se ve humo para el norte. Nada raro, creo." },
          { "martin_a", "Lo anotamos igual. Uno, humo al norte. Dos, mananas vigilamos." },
          { "martin_z", "Akagami, esa lista tiene dos puntos y uno es 'vigilamos'." },
          { "martin_a", "Las listas cortas tambien son listas, Zent." },
      } },

    { id = "sous_carrete_planes", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "benjamin", "Hermano, cuanto llevamos sin carrete? Calculalo tu que eres de numeros." },
          { "jorge", "Broder, demasiado. Y el copete que queda no alcanza ni para uno." },
          { "benjamin", "Entonces hay que salir a buscar. Por la comunidad, bro." },
          { "martin_a", "Matric, primero la comida. Despues el copete. Ese es el orden." },
          { "benjamin", "Bro, el orden es una construccion social. Pregunta al David." },
          { "david", "No me metan en esto." },
      } },

    { id = "sous_guardia", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "david", "Anoche en la guardia conte las estrellas. Me aburri en la numero ochenta." },
          { "cristobal", "Hermanito, la proxima me despiertas y contamos juntos." },
          { "david", "Eso derrota el proposito de hacer guardia solo." },
          { "cristobal", "El proposito es no morir, sangre. Juntos es mejor." },
      } },

    { id = "sous_wifi", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "cristobal", "Encontre un router en una casa. Si consigo corriente lo prendo, wn." },
          { "martin_z", "Y te vas a conectar a que? No hay internet." },
          { "cristobal", "A la red local, hermanito. Entre nosotros. Una LAN." },
          { "bastian", "Oe, una LAN! Como en el colegio, po." },
          { "martin_a", "Si arman una LAN, la primera partida es mia. Ya lo dije." },
      } },

    { id = "sous_norte", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "hanz", "Saben que extrano del norte? El sol que te parte la cabeza a las tres de la tarde." },
          { "cristian", "Compadre, yo extrano la nieve. Somos opuestos, akkakaka." },
          { "hanz", "Tu extranas el frio, yo extrano el calor, y aca no hay ni lo uno ni lo otro, vale." },
          { "martin_z", "Aca hay zombis. Es un clima en si mismo." },
      } },

    { id = "sous_empresa", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "jorge", "Manito, cuando esto termine armo una empresa de seguridad. Experiencia tengo." },
          { "benjamin", "Y yo de socio, hermano. Sous Fit y Sous Seguridad. Un holding." },
          { "jorge", "Broder, tu de socio no. Tu de cliente." },
          { "benjamin", "Bro, eso duele. Pero es justo." },
      } },

    { id = "sous_perro", tipo = "ambiente", si = ALIADOS,
      turnos = {
          { "bastian", "Oe, ayer vi un perro en la calle. Vivo. Flaquito." },
          { "cristobal", "Hay que traerlo, hermanito. Un perro cuida." },
          { "martin_z", "Un perro come. Ya somos muchos comiendo." },
          { "martin_a", "Votemos. Uno, el que quiera el perro, levanta la mano." },
          { "hanz", "Broder, todos levantaron la mano menos el Zent. Ganamos." },
          { "martin_z", "Democracia. Que asco." },
      } },

    -- -----------------------------------------------------------------------
    -- Discusiones con pregunta al jugador
    -- -----------------------------------------------------------------------
    { id = "sous_salir_noche", tipo = "discusion", si = ALIADOS, cada = 48,
      turnos = {
          { "bastian", "Oe, salgamos ahora, po. De noche hay menos zombis en la calle." },
          { "martin_z", "De noche hay los mismos zombis. Lo que hay menos es luz." },
          { "bastian", "Loco, siempre tan positivo." },
          { "martin_a", "Ya, que decida el que trajo la medicina." },
      },
      pregunta = { texto = "Tati y Zent quieren que decidas",
          opciones = {
              { id = "ahora", texto = "Salir ahora", dice = { { "bastian", "Eso, po! Por fin alguien con energia." } } },
              { id = "dia", texto = "Esperar al dia", dice = { { "martin_z", "Gracias. Al menos uno piensa." } } },
              { id = "akagami", texto = "Que decida Akagami", dice = { { "martin_a", "Mi bro, me tiraste la pelota. Esperamos. Punto final." } } },
          } } },

    { id = "sous_salir_noche_eco", tipo = "reaccion", si = { ALIADOS, { "memoria", "conv.sous_salir_noche", "dia" } }, una_vez = true,
      turnos = {
          { "bastian", "Oe, al final esperamos al dia y nos llovio entera la mochila, po." },
          { "martin_z", "Y llegamos vivos. Es el detalle que se te olvida." },
      } },
    { id = "sous_salir_noche_eco2", tipo = "reaccion", si = { ALIADOS, { "memoria", "conv.sous_salir_noche", "ahora" } }, una_vez = true,
      turnos = {
          { "martin_z", "Salimos de noche, como queria el Tati. Casi pierdo un zapato en una zanja." },
          { "bastian", "Casi, loco. Casi. Y volvimos con todo." },
      } },

    { id = "sous_nombre_perro", tipo = "discusion", si = ALIADOS, una_vez = true,
      turnos = {
          { "hanz", "Broder, si traemos el perro, como le ponemos?" },
          { "cristobal", "Siu. Obvio, hermanito." },
          { "martin_z", "Inventario. Porque lo vamos a tener que contar." },
          { "benjamin", "Bro, Carrete. Asi cuando lo llame suena a fiesta." },
      },
      pregunta = { texto = "Elegir el nombre del perro",
          opciones = {
              { id = "siu", texto = "Siu", dice = { { "cristobal", "Sabia que tenias buen gusto, sangre." } } },
              { id = "inventario", texto = "Inventario", dice = { { "martin_z", "Por fin alguien entiende el humor." } } },
              { id = "carrete", texto = "Carrete", dice = { { "benjamin", "Hermanooo! Carrete, ven aca! Ya me siento mejor." } } },
          } } },

    { id = "sous_lista_prioridades", tipo = "discusion", si = ALIADOS, cada = 72,
      turnos = {
          { "martin_a", "Cabros, lista de prioridades para la semana. Uno, comida. Dos..." },
          { "jorge", "Dos, inventario, manito." },
          { "cristobal", "Dos, el generador, wn. Sin luz no hay nada." },
          { "martin_a", "Ya. Que desempate alguien de afuera." },
      },
      pregunta = { texto = "Akagami te pide desempatar",
          opciones = {
              { id = "inventario", texto = "Primero el inventario", dice = { { "jorge", "Broder, eso es criterio. Te debo una, sangre." } } },
              { id = "generador", texto = "Primero el generador", dice = { { "cristobal", "Hermanito! Esa es. Te prendo la primera ampolleta." } } },
          } } },

    -- -----------------------------------------------------------------------
    -- Duelo (si alguien murio en el capitulo 2)
    -- -----------------------------------------------------------------------
    { id = "sous_duelo_akagami", tipo = "reaccion", si = { ALIADOS, murio("martin_a") }, una_vez = true,
      turnos = {
          { "martin_z", "Hoy encontre una de sus listas. 'Uno, cuidar a los cabros'. No habia dos." },
          { "hanz", "Broder... no tenia que haber dos, vale. Con eso bastaba." },
          { "martin_z", "Ya. Si. Bastaba." },
      } },
    { id = "sous_duelo_zent", tipo = "reaccion", si = { ALIADOS, murio("martin_z") }, una_vez = true,
      turnos = {
          { "martin_a", "Cabros, hoy nadie me corrigio la lista. Me di cuenta recien." },
          { "hanz", "Echo de menos que nos tirara tallas pesadas, broder." },
          { "martin_a", "Hagamos una lista por el. Uno, nada. Dos, nada. El la habria encontrado graciosa." },
      } },
    { id = "sous_duelo_matric", tipo = "reaccion", si = { ALIADOS, murio("benjamin") }, una_vez = true,
      turnos = {
          { "jorge", "Manito, hoy entrene solo. Fue lo peor que he hecho." },
          { "cristobal", "Sangre, el Benja ahora estaria hablando de un carrete." },
          { "jorge", "Le debemos uno, broder. El mejor. Cuando se pueda." },
      } },
    { id = "sous_duelo_shinbo", tipo = "reaccion", si = { ALIADOS, murio("david") }, una_vez = true,
      turnos = {
          { "cristobal", "Encontre el cuaderno del David. Anotaba todo, hermanito. Todo." },
          { "bastian", "Oe, leelo en voz alta. Un pedazo nomas." },
          { "cristobal", "'Este grupo funciona porque nadie lo decidio.' Eso dice, wn." },
          { "bastian", "Siempre tuvo razon el loco." },
      } },
    { id = "sous_duelo_tati", tipo = "reaccion", si = { ALIADOS, murio("bastian") }, una_vez = true,
      turnos = {
          { "david", "Hoy es domingo. Con el Tati jugabamos a esta hora." },
          { "martin_z", "Podemos jugar igual. En su nombre." },
          { "david", "Si. Pero nadie va a llegar bien vestido." },
      } },
    { id = "sous_duelo_walita", tipo = "reaccion", si = { ALIADOS, murio("hanz") }, una_vez = true,
      turnos = {
          { "martin_a", "El ajedrez quedo a medias. Tenia la reina lista." },
          { "martin_z", "Terminemoslo nosotros. Mal, pero terminemoslo." },
          { "martin_a", "Mal tallado, como el lo habria criticado. Me gusta." },
      } },
    { id = "sous_duelo_cristonks", tipo = "reaccion", si = { ALIADOS, murio("cristian") }, una_vez = true,
      turnos = {
          { "jorge", "Hoy subi al cerro. Por el primo. No se veia nada especial, broder." },
          { "benjamin", "Hermano, el veia algo especial en todo. Ese era el truco." },
          { "jorge", "Si. Ese era el truco, manito." },
      } },
    { id = "sous_duelo_hasag", tipo = "reaccion", si = { ALIADOS, murio("jorge") }, una_vez = true,
      turnos = {
          { "cristian", "Compadre, el inventario esta desordenado. Nadie sabe cuanto hay." },
          { "benjamin", "Bro, yo lo llevo desde hoy. Por el." },
          { "cristian", "Akkakaka... el se moriria de nuevo si viera tus numeros." },
          { "benjamin", "Lo se, hermano. Por eso lo voy a hacer bien." },
      } },
    { id = "sous_duelo_wertres", tipo = "reaccion", si = { ALIADOS, murio("cristobal") }, una_vez = true,
      turnos = {
          { "david", "El saludo secreto ya no sirve. Era de dos." },
          { "bastian", "Ensenamelo, loco. No para reemplazarlo. Para que no se pierda." },
          { "david", "Ya. Pero es mas alto de lo que parece." },
      } },

    -- -----------------------------------------------------------------------
    -- Meulen, despues de todo
    -- -----------------------------------------------------------------------
    { id = "sous_lo_que_nunca_vimos", tipo = "reaccion", si = ALIADOS, una_vez = true, cada = 24,
      turnos = {
          { "cristobal", "Hermanito, te puedo decir algo? A veces pienso que igual le fallamos al Meulen." },
          { "david", "Le fallamos. Lo que no se es si eso justifica lo que hizo." },
          { "cristobal", "No lo justifica, sangre. Pero explica harto." },
          { "david", "Explicar no es perdonar. Pero es un comienzo." },
      } },
    { id = "sous_maulen_atun", tipo = "ambiente", si = ALIADOS, una_vez = true,
      turnos = {
          { "jorge", "Encontre una lata de atun en el deposito. La ultima de Meulen, creo." },
          { "martin_a", "Dejala ahi, mi bro. No se. Dejala." },
          { "martin_z", "Primera vez que nadie se pelea una lata." },
      } },
    { id = "sous_mentira_dudas", tipo = "pista", si = { ALIADOS, { "memoria", "sous_mentira", true } }, una_vez = true,
      turnos = {
          { "martin_z", "Hay algo de esa noche que no me cuadra. Pero bueno." },
          { "martin_a", "Que cosa, Zent?" },
          { "martin_z", "Nada. Los numeros. Nunca me cuadran contigo de testigo." },
      } },

    -- -----------------------------------------------------------------------
    -- Antes de la traicion: la base con Meulen (historia "sous", etapas de encargos)
    -- -----------------------------------------------------------------------
    { id = "sous_base_maulen_olla", tipo = "pista", fuente = "arco:sous",
      etapas = { "base", "encargo1", "volver1", "encargo2", "volver2" },
      turnos = {
          { "martin_a", "Meulen, te toca la olla. Otra vez, ya se." },
          { "maulen", "Feley. No hay problema." },
          { "martin_z", "Nunca hay problema con el Meulen. Eso es lo raro." },
          { "maulen", "Algunos aprendemos a no tener problemas en voz alta, peni." },
      } },
    { id = "sous_base_maulen_deposito", tipo = "pista", fuente = "arco:sous",
      etapas = { "encargo1", "volver1", "encargo2", "volver2" },
      turnos = {
          { "jorge", "Meulen, me pasas la llave del deposito? Quiero contar." },
          { "maulen", "Yo ya conte. Esta todo bien, Jorge." },
          { "jorge", "Igual, manito. Me gusta contar dos veces." },
          { "maulen", "Manana. Hoy esta todo ordenado. No lo desarmes." },
      } },
    { id = "sous_base_maulen_nombre", tipo = "pista", fuente = "arco:sous",
      etapas = { "volver1", "encargo2", "volver2" },
      turnos = {
          { "benjamin", "Oe Meulen, nunca te pregunte. De donde eres, bro?" },
          { "maulen", "Del sur. Cerca de Temuco." },
          { "benjamin", "Hermano, como no sabia eso? Llevamos meses juntos." },
          { "maulen", "Nunca preguntaron. Esta bien. Ya no importa." },
      } },
})
