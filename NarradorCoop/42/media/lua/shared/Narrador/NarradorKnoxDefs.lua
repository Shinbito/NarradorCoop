-- Narrador Co-op: reputacion global en Knox (datos compartidos por servidor y cliente).
-- Un solo eje por grupo: sube ayudando gente y cumpliendo, baja haciendo dano.
--   Positivo: 1 Desconocido, 2 Mensajero, 3 La nueva esperanza, 4 El guerrero, 5 El heroe de Knox
--   Negativo: 1 Poco confiable, 2 Rumores negativos, 3 La nube negra, 4 El destripador,
--             5 El demonio de Knox
-- El servidor la lleva en server/Narrador/NarradorKnox.lua.
-- Textos sin tildes a proposito.

Narrador = Narrador or {}
local KD = Narrador.KnoxDefs or {}
Narrador.KnoxDefs = KD

KD.MIN, KD.MAX = -200, 200

-- Niveles: 1 de 0 a 20, 2 de 20 a 45, 3 de 45 a 90, 4 de 90 a 150 y 5 desde 150. Igual en
-- negativo (cualquier valor bajo 0 ya es "Poco confiable").
-- { desde (valor minimo), nivel (-5..5), titulo }. Se usa el ultimo que se cumple.
KD.POSITIVOS = {
    { desde = 0, nivel = 1, titulo = "Desconocido" },
    { desde = 20, nivel = 2, titulo = "Mensajero" },
    { desde = 45, nivel = 3, titulo = "La nueva esperanza" },
    { desde = 90, nivel = 4, titulo = "El guerrero" },
    { desde = 150, nivel = 5, titulo = "El heroe de Knox" },
}
-- { hasta (valor maximo), nivel, titulo }.
KD.NEGATIVOS = {
    { hasta = -1, nivel = -1, titulo = "Poco confiable" },
    { hasta = -20, nivel = -2, titulo = "Rumores negativos" },
    { hasta = -45, nivel = -3, titulo = "La nube negra" },
    { hasta = -90, nivel = -4, titulo = "El destripador" },
    { hasta = -150, nivel = -5, titulo = "El demonio de Knox" },
}

-- Puntos por cada acto que deja huella (ver H.ACTOS en server/Narrador/NarradorHuellas.lua).
-- Ayudar a alguien da 4. Matar dentro de una mision no cuenta (puede ser un accidente): las
-- muertes que cuentan son las de NPCs fuera de las historias (KD.MATAR, ver NarradorKnox).
-- Los encargos y misiones cumplidos dan segun su dificultad (KD.DIFICULTAD), no por "cumpliste".
KD.ACTOS = {
    salvaste = 4, protegiste = 4, compartiste = 2, perdonaste = 1,
    lo_dejaste = -2, traicionaste = -5, entregaste = -3, intimidaste = -2,
}
KD.DIFICULTAD = { facil = 4, medio = 6, dificil = 10, ultra = 15 }
-- Recado (ayudar a un comerciante de un campamento).
KD.RECADO = 5
-- Matar a un NPC fuera de una mision.
KD.MATAR = -5
-- Cada mision para los bandidos (la historia de los bandidos, por escribir).
KD.BANDIDOS_MISION = -15

-- Desde este nivel (o peor) los misioneros ya no te dan encargos ni capitulos y los
-- comerciantes de los campamentos no te hacen descuento.
KD.DESPRECIO = -4

-- Con la reputacion en negativo solo se sube salvando gente, acabando con bandidos o haciendo
-- recados a los comerciantes.
KD.REDIMEN = { salvaste = true, protegiste = true, bandidos = true, recado = true, redencion = true, admin = true }
-- Lo que da limpiar un lugar tomado por bandidos.
KD.BANDIDOS = 15

-- Tono de la gente segun el nivel: "odio" (-5..-3), "desconfianza" (-2..-1), "aprecio" (2..3),
-- "amor" (4..5). Nivel 1 (Desconocido): nada especial.
function KD.tono(nivel)
    nivel = tonumber(nivel) or 1
    if nivel <= -3 then return "odio" end
    if nivel < 0 then return "desconfianza" end
    if nivel >= 4 then return "amor" end
    if nivel >= 2 then return "aprecio" end
    return nil
end

-- Lo que se dice al cambiar de nivel.
KD.AVISOS = {
    [2] = "Tu nombre empieza a correr de boca en boca. En Knox te dicen: Mensajero.",
    [3] = "La gente habla de ti con esperanza. En Knox te dicen: La nueva esperanza.",
    [4] = "Los que salvaste cuentan como peleas. En Knox te dicen: El guerrero.",
    [5] = "En todo Knox se cuenta lo que hiciste. Te dicen: El heroe de Knox.",
    [-1] = "Hay gente que ya no te abre la puerta. En Knox te dicen: Poco confiable.",
    [-2] = "Corren rumores sobre lo que haces. En Knox te dicen: Rumores negativos.",
    [-3] = "Donde llegas, la gente se esconde. En Knox te dicen: La nube negra.",
    [-4] = "Las madres asustan a los ninos con tu nombre. En Knox te dicen: El destripador.",
    [-5] = "Ya no eres una persona para ellos. En Knox te dicen: El demonio de Knox.",
}

-- Nivel (-5..5, sin 0) y titulo para un valor.
function KD.nivel(valor)
    valor = tonumber(valor) or 0
    if valor < 0 then
        local r = KD.NEGATIVOS[1]
        for _, n in ipairs(KD.NEGATIVOS) do if valor <= n.hasta then r = n end end
        return r.nivel, r.titulo
    end
    local r = KD.POSITIVOS[1]
    for _, n in ipairs(KD.POSITIVOS) do if valor >= n.desde then r = n end end
    return r.nivel, r.titulo
end

return KD
