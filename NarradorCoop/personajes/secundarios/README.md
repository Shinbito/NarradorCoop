# Los 100 secundarios (clientes de los encargos)

Vecinos de Muldraugh, West Point, Riverside y Rosewood para las misiones generadas: el misionero da un encargo "para"
uno de ellos. Salieron de un rol en dos rondas, con un escritor por cada 10 personajes:
- Ronda A, "Antes": la vida hasta el 8 de julio de 1993 (monologo y ficha por etapas: infancia, juventud, adultez).
- Ronda B, "Despues": la primera noche, como sobrevivio, su secreto de despues y los TEXTOS PARA EL JUEGO (sin tildes):
  llegada, rescate, gracias, revelacion1-3 (una por encargo si es cliente frecuente), diario_conocer, diario_final,
  mudanza (si se va a vivir al campamento) y muerte.

Archivos:
- `lotes/lote01.md` ... `lote10.md`: cada lote tiene su ronda A y su ronda B (personajes s001 a s100).
- `lotes.json`: los datos base de cada uno (id, nombre, sexo, edad, pueblo, oficio del encargo, semilla).
- `MUNDO_SEC.md`: el contexto y las reglas de coherencia que se le dieron a los escritores.
- `revision/`: lo que unifico el editor de continuidad entre lotes (nombres renombrados, lugares, cargos, quien se queda
  con cada lazo con el reparto y que secretos se cambiaron por repetidos).

Fijado para todos: un solo jefe de policia en Rosewood (Talbert Ruark, desaparecido desde el amanecer del 10 de julio),
y los secretos no repiten motivos del reparto principal ni entre ellos (ver revision/).
El oficio "pastora" del generador sale en el juego como "el diacono" / "la catequista".
Cada secundario tiene al menos un lazo con el reparto principal que se ve en alguno de sus textos.

## En el juego

- `datos/secundarios.json`: los 100, con sus textos ya corregidos (es lo que lee el juego).
- `datos/piezas.json`: las piezas del generador de vidas, para cuando se acaben los vecinos hechos a mano o para
  mezclarlos. Cada pieza es una frase de una etapa (origen, infancia, juventud, adultez, vejez, oficio, primera noche,
  despues, secreto, deseo, voz) con etiquetas que da, pide, prohibe o quita, para que la vida no se contradiga. Las
  reglas con que se escribieron estan en `PIEZAS.md`.
- `herramientas/vidas.py` revisa los dos archivos (largos, tildes, marcadores, etiquetas, edades, lazos) y escribe
  `42/media/lua/shared/Narrador/NarradorVidasDatos.lua`. Despues de cambiar un JSON hay que correrlo (CI revisa que
  el .lua este al dia). La prueba `herramientas/pruebas/prueba_vidas.lua` arma todas las combinaciones de sexo, edad,
  oficio y pueblo y miles de vidas al azar.
- El motor es `server/Narrador/NarradorVidas.lua` y lo usa el generador de encargos (`NarradorGenerador.lua`):
  - El cliente de un encargo es, la mitad de las veces, un secundario del pueblo del misionero que no se conocio
    todavia; si no, un vecino con una vida armada por el generador.
  - Primer encargo: el diario lo presenta (diario_conocer) y, al cumplirlo, anota lo que conto (revelacion1).
    Segundo: revelacion2. Tercero: revelacion3 y la linea final del diario; se viene a vivir al lado del misionero
    y esa noche cuenta su vida (mudanza).
  - En los encargos donde aparece en persona dice su llegada (opcion "Saludar"), su linea de rescate o sus gracias.
  - Si muere en un rescate o no llega el remedio, el diario anota su linea de muerte y no vuelve a salir.
