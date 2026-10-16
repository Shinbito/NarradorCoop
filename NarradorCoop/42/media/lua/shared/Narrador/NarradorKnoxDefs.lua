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

KD.MIN, KD.MAX = -300, 300

-- { desde (valor minimo), nivel (-5..5), titulo }. Se usa el ultimo que se cumple.
KD.POSITIVOS = {
    { desde = -9, nivel = 1, titulo = "Desconocido" },
    { desde = 20, nivel = 2, titulo = "Mensajero" },
    { desde = 60, nivel = 3, titulo = "La nueva esperanza" },
    { desde = 120, nivel = 4, titulo = "El guerrero" },
    { desde = 200, nivel = 5, titulo = "El heroe de Knox" },
}
-- { hasta (valor maximo), nivel, titulo }.
KD.NEGATIVOS = {
    { hasta = -10, nivel = -1, titulo = "Poco confiable" },
    { hasta = -40, nivel = -2, titulo = "Rumores negativos" },
    { hasta = -90, nivel = -3, titulo = "La nube negra" },
    { hasta = -150, nivel = -4, titulo = "El destripador" },
    { hasta = -220, nivel = -5, titulo = "El demonio de Knox" },
}

-- Puntos por cada acto que deja huella (ver H.ACTOS en server/Narrador/NarradorHuellas.lua).
KD.ACTOS = {
    salvaste = 5, protegiste = 5, compartiste = 3, perdonaste = 2, cumpliste = 2, convenciste = 1, verdad = 1,
    lo_dejaste = -4, mataste = -15, traicionaste = -12, entregaste = -6, intimidaste = -4, obligaste = -2,
    mentiste = -2, abandonaste = -2, cobraste = -1, fallaste = -1,
}

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
    if valor <= -10 then
        local r = KD.NEGATIVOS[1]
        for _, n in ipairs(KD.NEGATIVOS) do if valor <= n.hasta then r = n end end
        return r.nivel, r.titulo
    end
    local r = KD.POSITIVOS[1]
    for _, n in ipairs(KD.POSITIVOS) do if valor >= n.desde then r = n end end
    return r.nivel, r.titulo
end

return KD
