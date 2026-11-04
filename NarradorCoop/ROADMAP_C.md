## La panaderia Hollis: cuatro misiones del rol (grupo C, falta probar en el juego)
Archivos: `shared/Narrador/Arcos/Hollis.lua` (los cuatro arcos y las charlas nuevas de los Bell),
`shared/Narrador/Conversas/ConversasHollis.lua`, `shared/Narrador/NarradorLoreHollis.lua` (diario),
`server/Narrador/NarradorHollis.lua` (ofertas de la Misia Rosa y sus frases despues). Prueba:
`herramientas/pruebas/prueba_hollis.lua` (todas las ramas de las cuatro).

- **El raton de la harina** (`raton_harina`, mision 6): la lanza el director (peso 14, tono vida,
  una vez) con Yvonne y Wade viviendo en tu refugio hace 48 horas. Wade avisa que la harina no le
  cuadra y pone una trampa. Con alguien en el refugio entre las 3 y las 5, la trampa pilla a
  Yvonne con una cucharada para la Vieja. Callar, preguntarle (confiesa lo que dice su ficha: la
  Vieja, la verguenza de ser feliz, la cuenta de Wade; despues guardarle el secreto o que lo cuente
  ella) o despertar a Daniel (si vive). Si nadie aparece en 72 horas, Wade lo descubre solo.
  Deja `harina` = callado, secreto, confeso, daniel o wade, y abre el primer pan (36 horas).
- **El primer pan** (`primer_pan`, mision 11): lo pide Yvonne (o Wade, con harina = wade; Daniel
  ofrece armarlo). Hay que traer la puerta de un horno de una panaderia o restaurante; Daniel lo
  arma en el refugio y Yvonne hornea a las 3:30. Con `receta_walt` sale el pan de Hazel (1931) y
  rollos de canela. Deja `pan_bell` = vieja o walt: desde ahi Yvonne deja pan cada 48 horas en el
  refugio si esta en casa (`B.hornear` en NarradorBell, memoria `pan_bell_ultima`). Si Yvonne deja
  el refugio antes, no hay horno.
- **La camioneta del pan** (`camioneta_pan`, mision 2): oferta de la Misia Rosa despues de su
  cap. 2, con confianza 3, ademas del capitulo que toque. La camioneta de Walt esta en la 31 cerca de
  la barricada sur de la Guardia (decision del creador, CANON "Dia 0"): un vehiculo blanco, Walt
  transformado (zombi jefe de cocinero) y su nota. Uno elige llevarse la libreta de recetas, la foto
  del parasol o las llaves (la camioneta queda tuya). En la gasolinera, si la cura salvo a Hector
  Jr., aparece para su escena: se entera de que el tata si paso por la 31, cierra lo de Walt y le
  cuenta a su tia lo de Shively. Si murio o sigue con fiebre, habla la Misia Rosa. Despues, si
  Yvonne vive, falta contarle a ella (y darle la libreta: `receta_walt`). Deja `camioneta_pan`.
- **La iglesia de Shively** (`iglesia_shively`, mision 3): oferta de la Misia Rosa con la camioneta
  hecha, Hector vivo y confianza 4. Pago dificil. Una iglesia de Louisville (se busca al suroeste,
  donde queda Shively). Se sortea: vivos (2), nota (2) o cebo (1). Vivos: defender a Linda Hollis y
  Nico; con la foto de Walt Linda le cree al tiro, si no con el "lleno o normal" de la Rosa; van
  solos a Rosewood y se quedan de guardias en la gasolinera (`salvado_campamento`). Nota: se fueron
  al norte; Junior la lee. Cebo: la voz grabada del Pato Rengo y bandidos; con la radio de la Chela
  arreglada (`radio_westpoint`) la Misia Rosa avisa antes y hay 3 a 4 bandidos en vez de 5 a 7.
  Deja `shively` = vivos, uno, nota, trampa o muertos. Linda y Nico estan en "Los que ya no estan".
- **Lo que cambia despues**: las charlas de los Bell en el refugio (y las de gratitud del engano)
  segun `harina`, `pan_bell` y `receta_walt`; conversas nuevas de los Bell en el refugio; las frases
  de la Misia Rosa (o de Hector en la reconquista) segun `camioneta_pan` y `shively`.
- **Cosas nuevas del motor**:
  - NarradorBell: condiciones `bell_vive`, `bell_presente`, `bell_hace`; acciones `lugar_bell` y
    `decir_bell` (los Bell del refugio no son de ningun arco); `st.bell.desde`.
  - NarradorConversas: los Bell del refugio son hablantes con fuente `res:bell`.
  - NarradorGenerador: `G.OFERTAS_EXTRA` (ofertas con historia que no son capitulos, salen ademas
    del capitulo). NarradorContactos: `C.FRASES_EXTRA[id]` (frases con condicion del motor).
  - Acciones `vehiculo` y `llaves_vehiculo` (Mundo.crearVehiculo / Mundo.llavesVehiculo); la
    accion `nota` acepta `id` para que la nota sea objeto de la historia.
  - `mapa_historias.py`: camioneta_pan e iglesia_shively en LANZADORES.
