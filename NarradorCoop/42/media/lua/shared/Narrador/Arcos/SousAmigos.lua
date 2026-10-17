-- STUB (agente historias2): version minima de la API de los amigos de Sous para que las
-- historias de HistoriasSous2.lua carguen y se puedan probar. El archivo de verdad lo escribe
-- otro agente; al juntar el trabajo, este se reemplaza por ese (misma API):
--   Narrador.SousAmigos.FACCION   = "narrador_sous_amigos"
--   Narrador.SousAmigos.PERFILES  = { waton = { rol, perfil }, clau = ..., luengo = ..., renato = ... }
--   Narrador.SousAmigos.nombres[rol]
-- Sin tildes ni enies a proposito.

require "Narrador/NarradorDefs"

Narrador = Narrador or {}
Narrador.Facciones = Narrador.Facciones or {}

if Narrador.SousAmigos == nil then
    local A = {}
    Narrador.SousAmigos = A
    A.FACCION = "narrador_sous_amigos"
    A.PERFILES = {
        waton = { "waton", "narrador_sous_amigo_01" },
        clau = { "clau", "narrador_sous_amigo_02" },
        luengo = { "luengo", "narrador_sous_amigo_03" },
        renato = { "renato", "narrador_sous_amigo_04" },
    }
    A.nombres = { waton = "Waton Ju", clau = "Claudio Clau", luengo = "Fucking Luengo", renato = "Renaaaaaato" }

    if Narrador.Facciones[A.FACCION] == nil then
        Narrador.Facciones[A.FACCION] = {
            id = A.FACCION, version = 1, nombre = "Amigos de Sous", postura = "friendly",
            descripcion = "Los amigos de siempre de Sous.",
            relaciones = { narrador_sous = "friendly" },
            stats = { healthHP = 120, strength = 7, endurance = 7, awareness = 7, aiming = 6 },
            miembros = {
                { id = "narrador_sous_amigo_01", respaldo = "k93_truckstop_02", nombre = "Waton Ju", rol = "Primo de Walita", arma = "Base.Pistol", cuerpo = "Base.BaseballBat" },
                { id = "narrador_sous_amigo_02", respaldo = "k93_hensley_family_02", nombre = "Claudio Clau", rol = "Amigo de Sous", arma = "Base.Pistol", cuerpo = "Base.Crowbar" },
                { id = "narrador_sous_amigo_03", respaldo = "k93_vfd_03", nombre = "Fucking Luengo", rol = "Chef", arma = "Base.Pistol", cuerpo = "Base.KitchenKnife" },
                { id = "narrador_sous_amigo_04", respaldo = "k93_red_cross_03", nombre = "Renaaaaaato", rol = "Amigo de Sous", arma = "Base.Pistol", cuerpo = "Base.Hammer" },
            },
        }
    end
end

return Narrador.SousAmigos
