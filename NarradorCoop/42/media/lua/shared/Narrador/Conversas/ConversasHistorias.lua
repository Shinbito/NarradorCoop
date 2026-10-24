-- Conversaciones de los personajes de las historias mientras estan abiertas (los Bell, el
-- desertor, etc.) y de los misioneros con sus vecinos. Sin tildes ni enies a proposito.

require "Narrador/NarradorConversasDefs"

local reg = Narrador.Conversas.varias
local BELL = "arco:familia_infectada"
local EN_REFUGIO = { "acogidos", "pide_ayuda" }

reg({
    -- -----------------------------------------------------------------------
    -- Los Bell en tu refugio
    -- -----------------------------------------------------------------------
    { id = "bell_cena", fuente = BELL, etapas = EN_REFUGIO, tipo = "ambiente",
      turnos = {
          { "madre", "Wade, come despacio. No sabemos cuando vamos a comer de nuevo." },
          { "hijo", "Por eso como rapido, mama." },
          { "padre", "El chico tiene logica, Yvonne." },
          { "madre", "No lo defiendas, Daniel." },
      } },
    { id = "bell_trampas", fuente = BELL, etapas = EN_REFUGIO, tipo = "ambiente",
      turnos = {
          { "hijo", "Papa, puedo poner una trampa en la puerta del fondo?" },
          { "padre", "Una que no nos mate a nosotros, si." },
          { "hijo", "No prometo nada." },
          { "madre", "Wade." },
          { "hijo", "Prometo. Prometo." },
      } },
    { id = "bell_fiebre_hijo", fuente = BELL, etapas = EN_REFUGIO, tipo = "pista",
      si = { "var", "infectado", "hijo" },
      turnos = {
          { "madre", "Daniel, tocale la frente al nino." },
          { "padre", "Esta tibio. Es el encierro, Yvonne. Nada mas." },
          { "hijo", "Estoy bien. Solo tengo frio." },
          { "madre", "Hace calor, Wade." },
      } },
    { id = "bell_fiebre_madre", fuente = BELL, etapas = EN_REFUGIO, tipo = "pista",
      si = { "var", "infectado", "madre" },
      turnos = {
          { "padre", "Yvonne, sientate. Llevas todo el dia de pie." },
          { "madre", "Si me siento no me levanto, Daniel." },
          { "hijo", "Mama, tienes los ojos rojos." },
          { "madre", "Es el humo. Anda a lavarte las manos." },
      } },
    { id = "bell_sanos", fuente = BELL, etapas = EN_REFUGIO, tipo = "pista",
      si = { "var", "infectado", "nadie" },
      turnos = {
          { "hijo", "Ya no toso, mama. Mira. Nada." },
          { "madre", "Gracias a Dios." },
          { "padre", "Ves? Era el polvo del camino. Te lo dije." },
          { "madre", "Me lo dijiste despues, Daniel. Antes estabas igual de asustado." },
      } },
    { id = "bell_biscuit", fuente = BELL, etapas = EN_REFUGIO, tipo = "ambiente",
      turnos = {
          { "hijo", "Creen que Biscuit esta vivo?" },
          { "padre", "Los perros son listos. Mas que nosotros." },
          { "madre", "Seguro encontro otra familia que le de de comer." },
          { "hijo", "Ojala no lo quieran mas que nosotros." },
      } },

    -- -----------------------------------------------------------------------
    -- Misioneros con los vecinos que se quedaron a vivir cerca (encargos de clientes frecuentes)
    -- -----------------------------------------------------------------------
    { id = "vecino_cabo", tipo = "cruzada",
      turnos = {
          { "vecino", "Cabo, ya no hay ley. Por que sigue anotando todo en esa libreta?" },
          { "cabo", "Porque alguien tiene que acordarse, civil. Negativo a olvidar." },
          { "vecino", "Y que anota de mi?" },
          { "cabo", "Que usted debe tres latas. Y que es buena persona. En ese orden." },
      } },
    { id = "vecino_chela", tipo = "cruzada",
      turnos = {
          { "chela", "Mijo, ya comiste? No me mientas, que se te nota en la cara." },
          { "vecino", "Comi, senora. Una lata." },
          { "chela", "Una lata no es comida. Es una excusa con tapa." },
      } },
    { id = "vecino_padre", tipo = "cruzada",
      turnos = {
          { "vecino", "Padre, usted de verdad cree que esto es un castigo?" },
          { "nacho", "No, hijo. Creo que es un examen. Y que la mayoria esta copiando." },
          { "vecino", "Y usted?" },
          { "nacho", "Yo invento los encargos. Asi que soy el profesor que no preparo la prueba." },
      } },
    { id = "vecino_rosa", tipo = "cruzada",
      turnos = {
          { "rosa", "Mijo, si vas a quedarte por aca, aprende una cosa: nunca le debas a una gasolinera." },
          { "vecino", "Y si ya le debo?" },
          { "rosa", "Entonces trabajas para mi. Bienvenido." },
      } },
    { id = "vecino_agradece", tipo = "cruzada", cada = 48,
      turnos = {
          { "vecino", "Si ve a la persona que me ayudo, digale que {n:vecino} no se olvida." },
          { "misionero", "Se lo digo. O mejor: le doy otro encargo. Asi se lo dice usted." },
      } },
})
