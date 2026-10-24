-- Narrador Co-op: reputacion global en Knox (datos compartidos por servidor y cliente).
-- Un solo eje por grupo: sube ayudando gente y cumpliendo, baja haciendo dano.
--   Positivo: 1 Forastero, 2 Cara conocida, 3 Alguien de palabra, 4 Protector de Knox,
--             5 Leyenda de Knox
--   Negativo: 1 Sospechoso, 2 Mala fama, 3 Ave de mal aguero, 4 El carnicero de Knox,
--             5 Peor que los muertos
-- El servidor la lleva en server/Narrador/NarradorKnox.lua.
-- Textos sin tildes a proposito.

Narrador = Narrador or {}
local KD = Narrador.KnoxDefs or {}
Narrador.KnoxDefs = KD

KD.MIN, KD.MAX = -200, 200

-- Niveles: 1 de 0 a 20, 2 de 20 a 45, 3 de 45 a 90, 4 de 90 a 150 y 5 desde 150. Igual en
-- negativo (cualquier valor bajo 0 ya es "Sospechoso").
-- { desde (valor minimo), nivel (-5..5), titulo }. Se usa el ultimo que se cumple.
KD.POSITIVOS = {
    { desde = 0, nivel = 1, titulo = "Forastero" },
    { desde = 20, nivel = 2, titulo = "Cara conocida" },
    { desde = 45, nivel = 3, titulo = "Alguien de palabra" },
    { desde = 90, nivel = 4, titulo = "Protector de Knox" },
    { desde = 150, nivel = 5, titulo = "Leyenda de Knox" },
}
-- { hasta (valor maximo), nivel, titulo }.
KD.NEGATIVOS = {
    { hasta = -1, nivel = -1, titulo = "Sospechoso" },
    { hasta = -20, nivel = -2, titulo = "Mala fama" },
    { hasta = -45, nivel = -3, titulo = "Ave de mal aguero" },
    { hasta = -90, nivel = -4, titulo = "El carnicero de Knox" },
    { hasta = -150, nivel = -5, titulo = "Peor que los muertos" },
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
-- Reputacion de Knox con la que se abre el camino del bandido (la primera vez que llegas).
KD.BANDIDO_UMBRAL = -5

-- Desde este nivel (o peor) los misioneros ya no te dan encargos ni capitulos y los
-- comerciantes de los campamentos no te hacen descuento.
KD.DESPRECIO = -4

-- Con la reputacion en negativo solo se sube salvando gente, acabando con bandidos o haciendo
-- recados a los comerciantes.
KD.REDIMEN = { salvaste = true, protegiste = true, bandidos = true, recado = true, redencion = true, admin = true }
-- Lo que da limpiar un lugar tomado por bandidos.
KD.BANDIDOS = 15

-- Tono de la gente segun el nivel: "odio" (-5..-4, muy mala fama), "desconfianza" (-3..-1),
-- "aprecio" (2..3),
-- "amor" (4..5). Nivel 1 (Forastero): nada especial.
function KD.tono(nivel)
    nivel = tonumber(nivel) or 1
    if nivel <= KD.DESPRECIO then return "odio" end
    if nivel < 0 then return "desconfianza" end
    if nivel >= 4 then return "amor" end
    if nivel >= 2 then return "aprecio" end
    return nil
end

-- Lo que se dice al cambiar de nivel.
KD.AVISOS = {
    [1] = "Lo que hiciste se va olvidando. En Knox vuelves a ser: Forastero.",
    [2] = "Ya te saludan en los caminos. En Knox te dicen: Cara conocida.",
    [3] = "Lo que prometes, lo cumples, y eso se sabe. En Knox te dicen: Alguien de palabra.",
    [4] = "Los que salvaste cuentan tus peleas. En Knox te dicen: Protector de Knox.",
    [5] = "En todo el condado se cuenta lo que hiciste. Te dicen: Leyenda de Knox.",
    [-1] = "Hay gente que ya no te abre la puerta. En Knox te dicen: Sospechoso.",
    [-2] = "Corren historias feas sobre lo que haces. En Knox te dicen: Mala fama.",
    [-3] = "Donde llegas, la gente se esconde. En Knox te dicen: Ave de mal aguero.",
    [-4] = "Las madres asustan a los ninos con tu nombre. En Knox te dicen: El carnicero de Knox.",
    [-5] = "Ya no eres una persona para ellos. En Knox te dicen: Peor que los muertos.",
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

-- Donde esta un valor dentro de su nivel, para la barra del diario.
-- Devuelve { valor, nivel, titulo, frac (0..1, avance hacia el nivel de arriba),
--   mejor = { nivel, titulo, falta } o nil (ya en lo mas alto),
--   peor = { nivel, titulo, falta } o nil (ya en lo mas bajo) }.
-- "falta" es cuanto hay que subir (mejor) o bajar (peor) para cambiar de nivel.
function KD.progreso(valor)
    valor = tonumber(valor) or 0
    local nivel, titulo = KD.nivel(valor)
    local P, N = KD.POSITIVOS, KD.NEGATIVOS
    local r = { valor = valor, nivel = nivel, titulo = titulo, frac = 1 }
    if valor >= 0 then
        local i = 1
        for k, n in ipairs(P) do if valor >= n.desde then i = k end end
        local sig = P[i + 1]
        if sig ~= nil then
            r.mejor = { nivel = sig.nivel, titulo = sig.titulo, falta = sig.desde - valor }
            r.frac = (valor - P[i].desde) / math.max(1, sig.desde - P[i].desde)
        else
            r.frac = 1
        end
        local ant = i > 1 and P[i - 1] or N[1]
        r.peor = { nivel = ant.nivel, titulo = ant.titulo, falta = valor - P[i].desde + 1 }
    else
        local i = 1
        for k, n in ipairs(N) do if valor <= n.hasta then i = k end end
        local arriba = i > 1 and N[i - 1] or P[1]
        r.mejor = { nivel = arriba.nivel, titulo = arriba.titulo, falta = N[i].hasta + 1 - valor }
        local abajo = N[i + 1]
        local piso = abajo ~= nil and (abajo.hasta + 1) or KD.MIN
        r.frac = (valor - piso) / math.max(1, N[i].hasta + 1 - piso)
        if abajo ~= nil then r.peor = { nivel = abajo.nivel, titulo = abajo.titulo, falta = valor - abajo.hasta } end
    end
    r.frac = math.max(0, math.min(1, r.frac))
    return r
end

return KD
