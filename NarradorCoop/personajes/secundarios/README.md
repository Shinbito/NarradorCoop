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
Nada de esto esta en el codigo todavia.
