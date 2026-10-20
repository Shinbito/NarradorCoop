-- Narrador Co-op: las armas legendarias de los misioneros (scripts/NarradorArmasMisioneros.txt).
-- Al crearse quedan marcadas como legendarias con su nombre propio, vengan del kit de la
-- mision 1 o del menu de items del admin. Textos sin tildes a proposito.

require "Narrador/NarradorLegendario"

Narrador = Narrador or {}

Narrador.ARMAS_MISIONEROS = {
    ["Narrador.LumaRamiro"] = "La Luma del Cabo Ramiro",
    ["Narrador.HachaChela"] = "El Hacha de la Tia Chela",
    ["Narrador.CastigoDivino"] = "El Castigo Divino",
    ["Narrador.PalanquetaRosa"] = "La Palanqueta de la Misia Rosa",
}

-- OnCreate del item. Si ya es legendaria (por ejemplo al cargar) no la toca.
function NarradorArmaMisioneroCreada(item)
    pcall(function()
        local L = Narrador.Legendario
        if item == nil or L == nil then return end
        local md = item:getModData()
        if type(md.NarradorLegendario) == "table" then return end
        L.marcar(item, "legendaria")
        local nombre = Narrador.ARMAS_MISIONEROS[item:getFullType()]
        if nombre ~= nil then md.NarradorLegendario.nombre = nombre end
        L.aplicar(item)
    end)
end
