## Sin focos: el capitulo 3 de la Misia Rosa con Ray y Earl (falta probar en el juego)
- `cap_rosa_3` (Arcos/Capitulos.lua), "El tanque", ahora cierra lo que venia del canon: Earl le
  dio al Tecolote el dato del tanque, en broma y por insulina, y despues aviso por el 19 ("la 31
  sin focos"); Ray ("Gerald") vigila la 31 de noche desde el cerro.
- Si escondiste a Ray en el evento del desertor (`desertor` = protegido), apenas empieza el
  capitulo Ray avisa por el 19 (al Bencinita; si Junior murio en la cura, `cura_rosewood` =
  murio, "a la senora de la luz prendida"; si ya es el mecanico de Rosewood, en persona): un
  Peterbilt rojo y una camioneta sin focos, seis o siete hombres, bajan a las dos y dejan los
  camiones en la curva de la 31 (lugar `curva`, con mapa). Etapa nueva `preparar_ray`: o se los
  espera en la gasolinera desde las 2 (llegan 4 a 5 en vez de 6 a 8: Ray espanta a dos con un
  tiro al techo) o se les sale al paso en la curva desde la 1 (etapa nueva `emboscada`, 4 a 5
  bandidos y pocos muertos). Sin Ray todo sigue como antes (preparar desde las 22, 6 a 8).
- Despues del asalto (etapas puente `defendido` / `saqueo`), si Earl llego vivo en el cap. 2
  (`historia_rosewood_2` = true), aparece en el mostrador (`amanecer`) y le confiesa a Rosa lo
  del Tecolote y el whisky; Rosa se entera ahi de la insulina. El jugador intercede (Rosa lo
  perdona: "Lleno o normal?" "Lleno." y el cafe sin azucar), dice que eso no se perdona (lo manda
  a dormir a Lucille, con la luz prendida igual) o no se mete (Rosa decide segun la noche:
  defendida perdona, saqueada echa). Si nadie vuelve en 48 horas, Earl se lo calla.
- Memorias nuevas: `tanque_ray` (aviso o emboscada; la lee Las placas de Pope) y `earl_tanque`
  (perdonado, echado o callado; la lee el cap. 5: Lucille llega a la marea, Earl avisa por el 19
  sin que le contesten, o carga cajas callado). Los dos finales siguen siendo `final_cumplido` y
  `final_saqueado` (con su diario segun Earl).
- Partidas a medio camino: `preparar`, `asalto` y los finales no cambiaron de nombre; una partida
  que ya estaba en preparar o en asalto sigue sin el aviso de Ray (y con la confesion si Earl
  vive). Las que ya cerraron el cap. 3 no tienen `earl_tanque`: el cap. 5 no dice nada de Earl.
- Prueba: `herramientas/pruebas/prueba_sin_focos.lua` (sin Ray; con Ray y emboscada; con Ray,
  sin Earl y saqueado; Ray mecanico en persona; perdonar y echar en las dos noches; la partida
  que estaba en preparar; el cap. 5 con los tres valores de `earl_tanque`).

## Las placas de Pope: una historia de Ray Doyle (falta probar en el juego)
- `placas_pope` (Arcos/PlacasPope.lua, diario en NarradorLoreHistorias.lua). La elige el
  director (no es de un misionero: Ray no es de ningun campamento todavia) desde el dia 16, con
  refugio, si `desertor` = protegido y todavia no hay `placas_pope` ni `ray_mecanico`. No sale
  junto con `el_desertor` ni `eco_desertor_vuelve` (`excluye`), y "Ray vuelve" ya no sale si Ray
  se quedo en un campamento.
- Ray llega al refugio ("No vengo a que me rescate. Vengo a pedirle trabajo.") y cuenta la
  barricada: Pope disparo por los dos, lo mordieron, Ray lo remato y le cambio las placas ("Le
  robe la muerte a Pope"). Da las placas con una carta suya (`dar_objeto`) y acompana hasta la
  esquina de la casa de los Pope, en el West End de Louisville ("La puerta la toca usted").
- Loretta Pope esta viva (2 de 3, rodeada: hay que sacarle los muertos) o se transformo en su
  cocina con una nota para Darnell en el refrigerador. Viva: darle las placas con la carta (sabe
  que Darnell no se fue y que Ray si: "no lo perdono. Todavia"), sin la carta, o contarle sin las
  placas si se perdieron. Muerta (o si cae en el sitio): dejarle las placas junto a la nota o
  irse sin nada.
- De vuelta en la esquina, si a Loretta le llego algo, Ray se queda: el jugador lo manda de
  mecanico a la gasolinera de Rosewood (si no es de la banda; si el campamento aun no se funda,
  aparece cuando se funde) o a otro campamento ya fundado (condicion nueva
  `{ "campamento_abierto", id }`). Si no le llego nada, o no tienes donde mandarlo, se va
  caminando (y "Ray vuelve" puede salir despues). Si Ray muere en el camino, las placas se
  llevan igual (`desertor` = muerto); si lo matas, `desertor` = asesinado; si matas a Loretta,
  Ray se va.
- Accion nueva `{ "oficio_campamento", contacto, oficio, grupo, rol }` (NarradorCampamentos.lua):
  abre el oficio en ese campamento aunque no tenga el nivel, retira al que atendia, cuenta como
  salvado y espera a que se vaya el NPC de la historia. Quien es lo dice `K.OFICIOS_HISTORIA`
  (NarradorCampamentosDefs.lua): con `ray_mecanico` = id, `K.persona` devuelve a Ray Doyle de
  mecanico de ese campamento.
- Memorias nuevas: `placas_pope` (con_carta, sin_carta, contado, tumba o perdidas) y
  `ray_mecanico` (el campamento; la leen K.persona, "Ray vuelve" y el cap. 3 de la Misia Rosa).
- Ray y Loretta estan en "Los que ya no estan" (Ray, fuera del evento del desertor, va siempre,
  no solo si lo matas tu). Prueba: `herramientas/pruebas/prueba_placas_pope.lua` (cuando sale;
  viva con la carta y Ray a Rosewood; muerta y sin placas, Ray se va; Ray muere en el camino;
  sin placas y Ray a West Point; Rosewood de la banda; matar a Loretta o a Ray; "ahora no").
