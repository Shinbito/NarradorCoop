-- Conversaciones de los Bell en tu refugio despues del raton de la harina y del primer pan
-- (Arcos/Hollis.lua). Fuente "res:bell": los Bell que viven en el refugio (NarradorBell, ver
-- CS.hablantes en server/Narrador/NarradorConversas.lua). Sin tildes ni enies a proposito.

require "Narrador/NarradorConversasDefs"

local reg = Narrador.Conversas.varias
local REFUGIO = "res:bell"

reg({
    { id = "bell_harina_callado", fuente = REFUGIO, tipo = "reaccion", cada = 48,
      si = { "o", { "memoria", "harina", "callado" }, { "memoria", "harina", "secreto" } },
      turnos = {
          { "madre", "Wade, la harina te cuadra?" },
          { "hijo", "Desde el martes si. Raro. Los ratones no devuelven." },
          { "padre", "Habra sido un raton honrado, campeon.", opcional = true },
          { "hijo", "Por la estadistica, no existen." },
          { "madre", "Come, chere. Y no le cuentes a la trampa." },
      } },
    { id = "bell_harina_confeso", fuente = REFUGIO, tipo = "reaccion", cada = 48,
      si = { "memoria", "harina", "confeso" },
      turnos = {
          { "hijo", "Mama, hoy la cuenta cuadro. Treinta y una latas, y el saco igual que ayer." },
          { "madre", "Porque la cucharada de hoy la puse de la mia, chere." },
          { "padre", "Y la de manana la pongo yo. Hagamos un trato con la Vieja.", opcional = true },
          { "hijo", "La Vieja no firma tratos, papa. Es levadura.", opcional = true },
      } },
    { id = "bell_harina_daniel", fuente = REFUGIO, tipo = "reaccion", cada = 48,
      si = { "memoria", "harina", "daniel" },
      turnos = {
          { "padre", "Vonnie, le aceite la trampa del nino. Ahora no pilla dedos." },
          { "madre", "Y que pilla, entonces?" },
          { "padre", "Mentiras chicas. Las grandes no caben." },
          { "madre", "Daniel Bell. Come y no filosofes, que se enfria." },
      } },
    { id = "bell_harina_wade", fuente = REFUGIO, tipo = "reaccion", cada = 48,
      si = { "memoria", "harina", "wade" },
      turnos = {
          { "hijo", "Mama, cuantas cucharadas tiene un saco de harina?" },
          { "madre", "Depende de la cuchara, chere." },
          { "hijo", "Con la tuya, ciento ochenta y siete. Lo medi." },
          { "madre", "... Lo mediste." },
          { "hijo", "Si. No le dije a nadie." },
      } },
    { id = "bell_primer_pan", fuente = REFUGIO, tipo = "ambiente", cada = 36,
      si = { "mem", "pan_bell" },
      turnos = {
          { "hijo", "Doce panes por saco. Lo anote." },
          { "padre", "Anota tambien que el horno no chirria.", opcional = true },
          { "madre", "Y que la Vieja come a la vista de todos. Anotalo con lapiz, chere, no con boligrafo." },
      } },
    { id = "bell_libreta_walt", fuente = REFUGIO, tipo = "ambiente", cada = 72,
      si = { "memoria", "receta_walt", true },
      turnos = {
          { "hijo", "Mama, quien es Hazel?" },
          { "madre", "La mama de Walt. Empezo a la Vieja en 1931. Desde entonces nadie la ha dejado morir." },
          { "hijo", "Mil novecientos treinta y uno es primo." },
          { "madre", "Claro que es primo, chere. Es la Vieja." },
      } },
})
