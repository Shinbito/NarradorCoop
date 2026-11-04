-- Narrador Co-op (servidor): las misiones de la familia Hollis que da la Misia Rosa (ver
-- shared/Narrador/Arcos/Hollis.lua): la camioneta del pan y la iglesia de Shively.
--   * No son capitulos (no cuentan para el campamento ni van en G.ESPECIALES): salen entre sus
--     ofertas ademas del capitulo que toque (G.OFERTAS_EXTRA), mientras la Misia Rosa mande en
--     Rosewood, con la confianza minima y si se cumple la condicion "si" de la historia.
--   * Lo que dicen despues en la gasolinera (la Misia Rosa, o Hector Jr. si es el misionero de la
--     reconquista) segun como terminaron: C.FRASES_EXTRA.
-- El raton de la harina lo lanza el director y el primer pan lo abre el raton de la harina.
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorContactos"
require "Narrador/NarradorReputacion"
require "Narrador/NarradorGenerador"
require "Narrador/NarradorDominios"
require "Narrador/Arcos/Hollis"

local Defs, Mundo, Motor, C, R, G = Narrador.Defs, Narrador.Mundo, Narrador.Motor, Narrador.Contactos,
    Narrador.Reputacion, Narrador.Generador

local H = Narrador.Hollis or {}
Narrador.Hollis = H

local SIN_INST = { vars = {}, lugares = {}, grupos = {}, relojes = {}, elecciones = {}, usadas = {} }

-- Cada una: historia, misionero, confianza minima (nivel 1..5), nivel del pago y lo que se ve.
H.OFERTAS = {
    { def = "camioneta_pan", contacto = "rosewood", confianza = 3, pago = "medio",
      titulo = "La camioneta del pan",
      resumen = { "Encargo de la Misia Rosa", "Para: Walt Hollis, el tata de Junior", "Donde: la 31, cerca de la barricada sur",
                  "Pago: botin medio", "Ojo: algo se mueve adentro" } },
    { def = "iglesia_shively", contacto = "rosewood", confianza = 4, pago = "dificil",
      titulo = "La iglesia de Shively",
      resumen = { "Encargo de la Misia Rosa", "Para: Linda Hollis y Nico, la mama y el hermano de Junior",
                  "Donde: una iglesia de Shively, en Louisville", "Pago: botin dificil", "Ojo: el dato es del Tecolote" } },
}

function H.oferta(contactoId, nivel, grupo)
    local D = Narrador.Dominios
    if D ~= nil and D.dominio(contactoId) ~= "mision" then return nil end
    for _, e in ipairs(H.OFERTAS) do
        local def = Defs.get(e.def)
        if e.contacto == contactoId and def ~= nil and Motor.activos(e.def) == 0
                and (def.si == nil or Motor.cumple(SIN_INST, def.si))
                and R.nivel(R.valor(grupo, contactoId)) >= (e.confianza or 1) then
            return { def = e.def, vars = { nivel = e.pago or nivel }, lugares = { contacto = C.lugar(contactoId) },
                titulo = e.titulo, resumen = e.resumen }
        end
    end
    return nil
end

local ya = false
for _, f in ipairs(G.OFERTAS_EXTRA) do if f == H.oferta then ya = true end end
if not ya then G.OFERTAS_EXTRA[#G.OFERTAS_EXTRA + 1] = H.oferta end

-- ---------------------------------------------------------------------------
-- Lo que se dice despues en la gasolinera de Rosewood
-- ---------------------------------------------------------------------------
local ROSA = { "dominio", "rosewood", "mision" }
local NUEVO = { "dominio", "rosewood", "nuevo" }
-- Hector Jr. es el misionero de la reconquista solo si no lo reemplazo nadie.
local HECTOR = { NUEVO, { "memoria", "cura_rosewood", "salvo" } }

C.FRASES_EXTRA.rosewood = {
    { "La foto de Walt esta en la caja, al lado de la de mi Hector. Dos viejos tercos mirando la bomba.",
      si = { ROSA, { "memoria", "camioneta_pan", "foto" } } },
    { "Esa camioneta del pan todavia huele a pan, mijito? Cuidamela, que era de Walt.",
      si = { ROSA, { "memoria", "camioneta_pan", "llaves" } } },
    { "Walt fue a buscar a la Linda mordido y todo. Esa familia no sabe quedarse quieta, mijito.",
      si = { ROSA, { "mem", "camioneta_pan" } } },
    { "La Linda se sienta en la caja a las tres de la manana, conmigo. Ninguna de las dos duerme. Por lo menos ahora conversamos.",
      si = { ROSA, { "memoria", "shively", "vivos" } } },
    { "El Nico le dice a Junior que tiene orejas de Bencina. Junior se rie. Hace meses que no se reia, mijito.",
      si = { ROSA, { "memoria", "shively", "vivos" } } },
    { "Volvio uno de los dos, mijito. Uno es mucho en estos tiempos. Igual pongo dos tazas.",
      si = { ROSA, { "memoria", "shively", "uno" } } },
    { "Junior lee la nota de la Linda todas las noches. Dice que la letra no se borra. Yo creo que la esta gastando.",
      si = { ROSA, { "memoria", "shively", "nota" } } },
    { "Lo de Shively era cebo. Pobre Pato Rengo. Junior sigue mirando la 31 de noche, igual.",
      si = { ROSA, { "memoria", "shively", "trampa" } } },
    { "La Linda y el Nico estan anotados en pasado, mijito. Con letra bonita. Junior no me deja leer su pagina.",
      si = { ROSA, { "memoria", "shively", "muertos" } } },
    { "La foto del tata esta en la caja, al lado del tio. Les limpio el vidrio a los dos.",
      si = { HECTOR, { "memoria", "camioneta_pan", "foto" } } },
    { "La mama atiende la caja de dia y yo de noche. La luz no se apaga nunca, socio. Bueno, casi.",
      si = { HECTOR, { "memoria", "shively", "vivos" } } },
    { "La nota de la mama sigue en la caja. Algun dia vuelve del norte. Por eso tambien dejo la luz prendida.",
      si = { HECTOR, { "memoria", "shively", "nota" } } },
}

return H
