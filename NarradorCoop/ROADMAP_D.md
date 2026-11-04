## La prueba del agua de las K-93 (falta probar en el juego)
- Canon (fichas de Hartmann y Eduardo, CANON.md): el Dr. Hartmann hizo 240 K-93 falsas en junio
  de 1993; la falsa se deshace en agua en menos de un minuto y su K tiene la pata de abajo mas
  corta. Antes las pastillas solo se distinguian con Medicina 4 ("Examinar la pastilla").
- Clic derecho en una K-93 del inventario: "Probar la pastilla en agua"
  (client/Narrador/NarradorPastillas.lua). Pide agua en el inventario (botella, vaso, olla; sirve
  la sucia) y gasta un vaso (`Cura.AGUA` = 0.1 L). La falsa se deshace y se pierde; la verdadera
  sale entera, queda con el nombre "Pastilla K-93 (verdadera)" y marcada (`NarradorK93Probada`).
- MP: la prueba la hace el servidor (comando publico `pruebaAgua`, `CS.pruebaAgua` en
  NarradorCuraServer.lua): busca la pastilla por id, gasta el agua, borra la falsa con
  `Mundo.quitarItem` (sincroniza) o marca la verdadera, y le contesta al cliente (`pruebaAgua` en
  `Cliente.recibir`), que muestra el halo. Helpers compartidos en NarradorCura.lua
  (`Cura.buscarAgua`, `Cura.aguaDe`, `Cura.gastarAgua` para el B42 con FluidContainer y el B41).
- Requisito `{"pastilla", id, "real"}` (NarradorMotor.lua): ahora tambien vale una pastilla
  probada en agua sin Medicina 4 (`Mundo.pastillaProbada`). La falsa a sabiendas sigue pidiendo
  Medicina 4. Cambian los textos de "entregar la verdadera" en la cura y en los Bell.
- Diario: la primera falsa anota la K chueca; en la historia de la pastilla (la cura, los Bell)
  cuenta `agua_falsas` / `agua_reales`; las sueltas van a "Las pastillas K-93".
- Eduardo te ensena la prueba al despedirse en el cap. 3 de la Chela ("me lo enseno el doctor por
  la radio").
- Lo que abre (memoria `k93_falsa_vista`): el doctor Hartmann confiesa que el hizo las K-93.
  - Si llega a West Point despues de que viste una falsa (y no confeso ya por los Bell), en el
    final del cap. 3 la Chela le pregunta como sabia lo del agua y el confiesa.
  - Si ya estaba en el cuartel: historia corta `hartmann_k93` "La K chueca" (Arcos/Cura.lua), la
    lanza `CS.revisarHartmann` al pasar cerca de la Chela. Contarle (confiesa) o callarte.
  - Memoria `hartmann_k93` = confeso / callado (la confesion de los Bell tambien deja confeso).
    Con confeso, la Chela agrega al pedir la cura: "Y llevate agua, mijo".
- Prueba: `herramientas/pruebas/prueba_pastillas.lua` (sin agua, falsa, verdadera, entregar sin
  Medicina, pastilla suelta, la K chueca contar y callar, el agua de la Chela, la confesion al
  llegar y la de los Bell).

## Bandido: los giros de La Grange (falta probar en el juego)
- `bandido_giros` (Arcos/Bandido.lua): con Pereira de jefe, la primera vez que vuelves al patio
  con el capitulo 4 hecho sale esto en vez del 5 (BA.revisar, una sola vez: memoria
  `danny_pereira`). Con Meulen de jefe no sale. No cuenta como capitulo (`bandido_cap` sigue en 4).
- Canon (fichas de Pereira y Vargas, CANON.md): Pereira pago la proteccion de su hermano Danny en
  La Grange con 33 giros a una casilla de Vargas; fueron 34 meses, en abril de 1988 no llego el
  giro y a Danny le sacaron dos muelas. Vargas lo sabe y calla. Danny trabajaba en una gomeria de
  la calle Preston, en Louisville.
- Vargas Toledo (NPC nuevo en el patio) te manda a Louisville a ver si Danny respira: "esto va en
  mi libreta, no en la de ella". Cinco dias. En la gomeria: horda de 35 +12 por jugador extra y 6
  a 9 corredores (Louisville, como los ULTRA). Danny puede morir.
- Con Danny: decirle quien pagaba (te da un recado: "que venga ella, que me lo diga en la cara, es
  una orden mia") o callarte. De vuelta en el patio: el dato es solo para Vargas (le da cuerda al
  reloj y paga en latas) o se lo cuentas a la Sargento (la gomeria, las dos muelas, abril del 88).
- Memorias: `danny_pereira` = vivo / muerto (solo Vargas sabe), vivo_contado / muerto_contado
  (Pereira sabe), rechazado, no_fue; `danny_sabe` = le dijiste a Danny quien pagaba.
- Lo que cambia en el capitulo 5 (bandido_5, lee las memorias en la etapa `orden`):
  - Pereira sabe y Danny mando su orden: tercer camino en el plan, "repetirle la orden de Danny".
    Te deja el Hamilton de su padre ("Anote la hora...", la frase de su ficha), se va caminando
    a Louisville y la banda se desarma sola: `final_lena` (redimido, Knox a 0, sin pelea, Vargas
    te deja su libreta; `danny_pereira` = lena_fue). Despues el Cabo comenta que se fue
    (`BA.consecuenciaLena`, memoria `lena_comentada`).
  - Pereira sabe (sin orden, o Danny muerto): en la redencion, su carpeta tiene un papel nuevo
    ("Danny. Calle Preston. Vivo. Ir." o "...Cruz.").
  - Solo Vargas sabe: en la redencion Vargas no dispara y te deja su libreta ("lo de la calle
    Preston quedo en cero").
  - Camino con Pereira (reconquista_patio): si sabia, cae con un giro sin mandar para Danny.
  - Con Meulen de jefe despues (bandido_maulen): Meulen encontro el papel de Danny en la carpeta.
- Danny Pereira esta en "Los que ya no estan". Prueba: `herramientas/pruebas/prueba_giros.lua`
  (final_lena de punta a punta con el Cabo, la redencion con la libreta de Vargas, Danny muerto,
  rechazo, Meulen de jefe y no ir).
