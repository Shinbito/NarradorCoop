-- STUB (provisorio): los amigos de Sous los crea otro archivo. Esto solo deja la API que usan
-- las historias de Sous (Arcos/HistoriasSous1.lua) para que carguen y pasen las pruebas.
-- Reemplazar por el SousAmigos.lua de verdad (mismos nombres de campos).
-- Textos sin tildes a proposito.

Narrador = Narrador or {}
Narrador.Facciones = Narrador.Facciones or {}

local SA = Narrador.SousAmigos or {}
Narrador.SousAmigos = SA

SA.FACCION = "narrador_sous_amigos"

SA.PERFILES = SA.PERFILES or {
    waton = { { "waton", "narrador_sous_amigo_01" } },
    clau = { { "clau", "narrador_sous_amigo_02" } },
    luengo = { { "luengo", "narrador_sous_amigo_03" } },
    renato = { { "renato", "narrador_sous_amigo_04" } },
}

SA.nombres = SA.nombres or {
    waton = { "Waton", "Ju" },
    clau = { "Claudio", "Clau" },
    luengo = { "Fucking", "Luengo" },
    renato = { "Renaaaaaato", "" },
}

if Narrador.Facciones[SA.FACCION] == nil then
    Narrador.Facciones[SA.FACCION] = {
        id = SA.FACCION,
        version = 1,
        nombre = "Amigos de Sous",
        descripcion = "Los amigos de siempre de Sous.",
        postura = "friendly",
        miembros = {
            { id = "narrador_sous_amigo_01", respaldo = "k93_truckstop_01", nombre = "Waton Ju", rol = "Amigo", arma = "Base.Pistol", cuerpo = "Base.BaseballBat" },
            { id = "narrador_sous_amigo_02", respaldo = "k93_truckstop_03", nombre = "Claudio Clau", rol = "Amigo", arma = "Base.Pistol", cuerpo = "Base.Crowbar" },
            { id = "narrador_sous_amigo_03", respaldo = "k93_truckstop_06", nombre = "Fucking Luengo", rol = "Chef", arma = "Base.Pistol", cuerpo = "Base.MeatCleaver" },
            { id = "narrador_sous_amigo_04", respaldo = "k93_vfd_01", nombre = "Renaaaaaato", rol = "Amigo", arma = "Base.Pistol", cuerpo = "Base.Crowbar" },
        },
    }
end

return SA
