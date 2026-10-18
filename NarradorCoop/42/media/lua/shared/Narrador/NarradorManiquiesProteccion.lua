-- Narrador Co-op: los maniquies de los misioneros (server/Narrador/NarradorManiquies.lua) no se
-- pueden recoger ni desarmar. Solo un admin con el modo de construir (cheat) puede moverlos.
-- Textos sin tildes a proposito.

pcall(require, "Moveables/ISMoveableSpriteProps")

Narrador = Narrador or {}
local MP = Narrador.ManiquiesProteccion or {}
Narrador.ManiquiesProteccion = MP

MP.ETIQUETA = "NarradorManiqui"

function MP.esDelMod(objeto)
    if objeto == nil then return false end
    local ok, si = pcall(function()
        return instanceof(objeto, "IsoMannequin") and objeto:getModData()[MP.ETIQUETA] ~= nil
    end)
    return ok and si == true
end

function MP.hayEn(sq)
    if sq == nil then return false end
    local hay = false
    pcall(function()
        local objs = sq:getSpecialObjects()
        for i = 0, objs:size() - 1 do if MP.esDelMod(objs:get(i)) then hay = true end end
    end)
    return hay
end

if ISMoveableSpriteProps ~= nil and not MP._enganchado then
    MP._enganchado = true
    local recoger = ISMoveableSpriteProps.canPickUpMoveableInternal
    ISMoveableSpriteProps.canPickUpMoveableInternal = function(self, character, sq, objeto, multi)
        if MP.esDelMod(objeto) or (objeto == nil and MP.hayEn(sq)) then return false end
        return recoger(self, character, sq, objeto, multi)
    end
    local desarmar = ISMoveableSpriteProps.canScrapObject
    ISMoveableSpriteProps.canScrapObject = function(self, character, ...)
        -- Devuelve (resultado, chance, perk) como el original, pero sin poder desarmar.
        if MP.esDelMod(self.object) then return { canScrap = false }, 0, nil end
        return desarmar(self, character, ...)
    end
end

return MP
