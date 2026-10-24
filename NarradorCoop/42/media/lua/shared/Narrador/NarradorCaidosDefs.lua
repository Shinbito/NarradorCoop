-- Narrador Co-op: los personajes importantes que pueden morir y lo que se escribe en el diario.
-- Cuando muere uno, en Notas -> "Los que ya no estan" sale su nombre tachado y unas lineas en su
-- honor. Si lo mataste tu (o lo mataron por algo que hiciste, como la conquista), en vez del
-- homenaje va un lamento. Lo anota el servidor (server/Narrador/NarradorCaidos.lua).
--
-- Cada personaje: clave, nombre y como reconocerlo:
--   def + rol : un NPC de esa historia con ese rol (sin def, el rol en cualquier historia),
--   contacto  : el rol de un misionero (C.LISTA), cuando muere de verdad (la conquista).
-- solo_si_jugador = true: solo se anota si lo mataste tu (gente sin nombre propio en la trama).
-- Sin homenaje o sin lamento se usan los de CD.GENERICO ({nombre} se reemplaza).
-- Textos sin tildes ni enies a proposito.

Narrador = Narrador or {}
local CD = Narrador.CaidosDefs or {}
Narrador.CaidosDefs = CD

CD.GENERICO = {
    homenaje = "{nombre} ya no esta. Lo anoto aca para que no se me olvide que existio.",
    lamento = "A {nombre} lo mate yo. Escribo su nombre y lo tacho, y me pregunto en que me converti.",
}

CD.PERSONAJES = {
    -- Los misioneros
    { clave = "cabo_ramiro", nombre = "Cabo Ramiro Mandados", contacto = "cabo",
      homenaje = "El Cabo Ramiro murio en su comisaria. Saco a once personas de un cordon cuando le ordenaron dejarlas adentro. Que alguien anote eso en su libreta.",
      lamento = "El Cabo Ramiro murio en su comisaria, y fui yo quien trajo a la banda hasta su puerta. Me anoto en su libreta, en la lista de los que no cumplieron. En que me converti." },
    { clave = "tia_chela", nombre = "Tia Chela Recados", contacto = "chela",
      homenaje = "La Tia Chela ya no reparte recados. Me decia que tomara agua antes de salir. Hoy salgo sin que nadie me lo diga.",
      lamento = "La Tia Chela murio en su cuartel por la banda que yo traje. Me guardaba comida como a un hijo. No se en que me converti, pero ella no lo merecia." },
    { clave = "padre_nacho", nombre = "Padre Nacho Pegas", contacto = "nacho",
      homenaje = "El Padre Nacho murio en su iglesia, con la puerta abierta. Siempre decia que la puerta no se cierra. No la voy a cerrar.",
      lamento = "El Padre Nacho murio por lo que yo hice. Me abrio la puerta de su iglesia cuando nadie me la abria. Yo le traje a los que se la cerraron para siempre. En que me converti." },
    { clave = "misia_rosa", nombre = "Misia Rosa Bencina", contacto = "rosa",
      homenaje = "Se apago la luz de la gasolinera de Rosewood. La Misia Rosa la tuvo prendida treinta anos. Lleno o normal, me preguntaba. Normal, Misia. Normal.",
      lamento = "La Misia Rosa murio en su gasolinera y la luz se apago por mi culpa. Treinta anos prendida, y yo la apague. En que me converti." },
    -- Los Bell
    { clave = "daniel_bell", nombre = "Daniel Bell", def = "familia_infectada", rol = "padre",
      homenaje = "Daniel Bell golpeo mi puerta pidiendo techo unos dias. Cuido a su familia hasta el final. Eso es lo que voy a recordar de el.",
      lamento = "Mate a Daniel Bell en mi propio refugio. Me pidio techo y le di una bala. En que me converti." },
    { clave = "yvonne_bell", nombre = "Yvonne Bell", def = "familia_infectada", rol = "madre",
      homenaje = "Yvonne Bell ya no esta. Siempre habia sopa cuando ella estaba, aunque fuera poca.",
      lamento = "Mate a Yvonne Bell. Me servia sopa. No se como escribir esto sin que me tiemble la mano. En que me converti." },
    { clave = "wade_bell", nombre = "Wade Bell", def = "familia_infectada", rol = "hijo",
      homenaje = "Wade Bell era el menor. Llego con fiebre a mi puerta. Le quedaba toda la vida por delante y el mundo no lo dejo.",
      lamento = "Mate a Wade Bell. Era un nino con fiebre. No hay nada que escribir despues de eso. En que me converti." },
    -- Eduardo y los suyos
    { clave = "eduardo", nombre = "Eduardo Giovanns", rol = "eduardo",
      homenaje = "Eduardo Giovanns, el hijo de la Tia Chela, siempre se salvaba por las minimas. Esta vez no. Peleo hasta el final, como un heroe de pelicula.",
      lamento = "Mate a Eduardo Giovanns. Era el ultimo que quedaba ayudando gente en Knox. Me quede con su arma y con el silencio. En que me converti." },
    { clave = "hartmann", nombre = "Doctor Elias Hartmann", rol = "cientifico",
      homenaje = "El doctor Hartmann era un charlatan que vendia curas. Al final solo queria curar a alguien de verdad. No alcanzo.",
      lamento = "Mate al doctor Hartmann. Era un mentiroso, pero tambien era alguien. En que me converti." },
    -- Los capitulos de los misioneros
    { clave = "valentina", nombre = "Valentina Mandados", def = "hija_cabo", rol = "hija",
      homenaje = "Valentina, la hija del Cabo Ramiro, murio antes de leer las cartas que su papa le escribia. Las voy a guardar yo.",
      lamento = "Mate a Valentina, la hija del Cabo Ramiro. El me mando a buscarla. No se como mirarlo a la cara. En que me converti." },
    { clave = "gladys", nombre = "Gladys Moreno", def = "cap_cabo_2", rol = "gladys",
      homenaje = "Gladys Moreno era una de los once que el Cabo saco de la comisaria. Sobrevivio a eso y no a esto.",
      lamento = "Mate a Gladys Moreno, una de los once que el Cabo salvo. Le deshice lo unico bueno que le paso. En que me converti." },
    { clave = "lucia", nombre = "Lucia Ferrada", def = "cap_nacho_3", rol = "lucia",
      homenaje = "Lucia espero al Padre Nacho un domingo entero, hace anos. Ya no va a esperar a nadie.",
      lamento = "Mate a Lucia. El Padre Nacho me mando a traerla de vuelta. Yo le traje otra cosa. En que me converti." },
    { clave = "duggan", nombre = "Frank Duggan", rol = "duggan",
      homenaje = "Frank Duggan, el Martillo, peleaba a puno limpio en Lexington. Ya no hay quien le gane, ni quien pierda contra el.",
      lamento = "Mate a Frank Duggan. Era una pelea a puno limpio y yo no la termine limpio. En que me converti." },
    { clave = "earl", nombre = "Earl Whitaker", def = "cap_rosa_2", rol = "earl",
      homenaje = "El Gordo Earl manejo por la ruta 31 con su carga hasta el final del camino.",
      lamento = "Mate al Gordo Earl. La Misia Rosa lo esperaba con su carga. En que me converti." },
    -- El camino del bandido
    { clave = "julio", nombre = "Julio Cardenas", rol = "julio",
      homenaje = "Julio Cardenas desobedecio cuando importaba. Lo voy a recordar por eso.",
      lamento = "Mate a Julio Cardenas porque Pereira me lo pidio. Tenia una hija. En que me converti." },
    { clave = "marisol", nombre = "Marisol Cardenas", def = "bandido_1", rol = "hija",
      homenaje = "Marisol, la hija de Julio, ya no esta. Era demasiado chica para este mundo.",
      lamento = "Mate a Marisol, la hija de Julio. No hay trabajo que valga eso. En que me converti." },
    { clave = "arturo_salinas", nombre = "Arturo Salinas", def = "bandido_3", rol = "padre",
      homenaje = "Arturo Salinas me ofrecio sopa antes de preguntarme el nombre.",
      lamento = "Mate a Arturo Salinas. Me ofrecio sopa antes de preguntarme el nombre. En que me converti." },
    { clave = "rosario_salinas", nombre = "Rosario Salinas", def = "bandido_3", rol = "madre",
      homenaje = "Rosario Salinas cuido a su familia hasta el final.",
      lamento = "Mate a Rosario Salinas delante de su hijo. En que me converti." },
    { clave = "tomasito_salinas", nombre = "Tomasito Salinas", def = "bandido_3", rol = "hijo",
      homenaje = "Tomasito Salinas era un nino. Ya no esta.",
      lamento = "Mate a Tomasito Salinas. Era un nino. En que me converti." },
    { clave = "ramon_quispe", nombre = "Ramon Quispe", def = "bandido_4", rol = "jefe",
      homenaje = "Ramon Quispe juntaba latas para su gente. Las latas siguen ahi; el no.",
      lamento = "Mate a Ramon Quispe por sus latas. Por latas. En que me converti." },
    { clave = "elba_quispe", nombre = "Dona Elba Quispe", def = "bandido_4", rol = "abuela",
      homenaje = "Dona Elba Quispe sobrevivio al fin del mundo un buen rato. Mas que muchos jovenes.",
      lamento = "Mate a Dona Elba Quispe. Una abuela. En que me converti." },
    { clave = "kevin_morales", nombre = "Kevin Morales", def = "bandido_4", rol = "chico",
      homenaje = "Kevin Morales era el chico del grupo de Ramon. Ya no esta.",
      lamento = "Mate a Kevin Morales. Era un chico. En que me converti." },
    { clave = "maulen", nombre = "Meulen Canupan", rol = "maulen",
      homenaje = "Meulen Canupan traiciono a Sous y despues me debio la vida. Murio sin pagar ninguna de las dos cosas.",
      lamento = "Mate a Meulen Canupan. Se lo merecia, me digo. Y aun asi lo anoto, porque ya no se distinguir cuando alguien se lo merece. En que me converti." },
    -- Sous
    { clave = "martin_akagami", nombre = "Martin Akagami", rol = "martin_a",
      homenaje = "Martin Akagami lideraba Sous. Siempre iba adelante." },
    { clave = "martin_zent", nombre = "Martin Zent", rol = "martin_z",
      homenaje = "Martin Zent hacia las cuentas de todo. Las de esta noche no le cuadraron." },
    { clave = "benjamin_matric", nombre = "Benjamin Matric", rol = "benjamin",
      homenaje = "Benjamin Matric arreglaba cualquier aparato. A este mundo no lo pudo arreglar." },
    { clave = "david_shinbo", nombre = "David Shinbo", rol = "david",
      homenaje = "David Shinbo entendia a la gente mejor que nadie en Sous." },
    { clave = "bastian_tati", nombre = "Bastian Tati", rol = "bastian",
      homenaje = "Bastian Tati era el enlace de Sous. Ya no va a llegar ningun mensaje suyo." },
    { clave = "hanz_walita", nombre = "Hanz Walita", rol = "hanz",
      homenaje = "Hanz Walita tallaba madera en las noches tranquilas. Ya no quedan noches tranquilas." },
    { clave = "cristian_cristonks", nombre = "Cristian Cristonks", rol = "cristian",
      homenaje = "Cristian Cristonks manejaba cualquier cosa con ruedas. Esta vez no llego." },
    { clave = "jorge_hasag", nombre = "Jorge Hasag", rol = "jorge",
      homenaje = "Jorge Hasag llevaba las cuentas del deposito de Sous. Nunca le falto una lata." },
    { clave = "cristobal_wertres", nombre = "Cristobal Wertres", rol = "cristobal",
      homenaje = "Cristobal Wertres construia lo que hiciera falta. Se va dejando cosas en pie." },
    -- Encuentros y la gente de los encargos inmorales: solo si los mataste tu.
    { clave = "denise", nombre = "Denise Hensley", rol = "denise", solo_si_jugador = true },
    { clave = "lucas_pike", nombre = "Lucas Pike", rol = "lucas", solo_si_jugador = true },
    { clave = "ray_doyle", nombre = "Ray Doyle", def = "el_desertor", rol = "ray", solo_si_jugador = true },
    { clave = "benjamin_sotelo", nombre = "Benjamin Sotelo", def = "inmoral_fugitivo", rol = "fugitivo", solo_si_jugador = true },
    { clave = "oscar_lagos", nombre = "Oscar Lagos", def = "inmoral_testigo", rol = "testigo", solo_si_jugador = true },
    { clave = "marta_ibanez", nombre = "Marta Ibanez", def = "inmoral_quemar", rol = "uno", solo_si_jugador = true },
    { clave = "luis_ibanez", nombre = "Luis Ibanez", def = "inmoral_quemar", rol = "dos", solo_si_jugador = true },
    { clave = "ignacio_fuentes", nombre = "Ignacio Fuentes", def = "inmoral_tributo", rol = "padre", solo_si_jugador = true },
    { clave = "paula_fuentes", nombre = "Paula Fuentes", def = "inmoral_tributo", rol = "hija", solo_si_jugador = true },
}

-- El personaje de un NPC de una historia (def, rol), o nil si no es importante.
function CD.deArco(def, rol)
    for _, p in ipairs(CD.PERSONAJES) do
        if p.rol ~= nil and p.rol == rol and (p.def == nil or p.def == def) then return p end
    end
    return nil
end

-- El personaje de un misionero por su rol (C.LISTA), o nil.
function CD.deContacto(rol)
    for _, p in ipairs(CD.PERSONAJES) do
        if p.contacto ~= nil and p.contacto == rol then return p end
    end
    return nil
end

-- Lo que se escribe: el homenaje o, si lo mataste tu, el lamento.
function CD.texto(p, mato)
    local t = mato and (p.lamento or CD.GENERICO.lamento) or (p.homenaje or CD.GENERICO.homenaje)
    return (string.gsub(t, "{nombre}", p.nombre))
end

return CD
