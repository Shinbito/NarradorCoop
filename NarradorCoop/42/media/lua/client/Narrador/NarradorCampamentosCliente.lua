-- Narrador Co-op (cliente): comerciar con la gente de los campamentos.
-- Clic derecho cerca del carpintero, el herrero, el mecanico o el curandero de un campamento:
-- "Comerciar" con su lista de cosas y el precio en comida o en municion (segun lo que valora
-- ese campamento y la confianza que te tiene el misionero).
-- Textos sin tildes a proposito.

require "Narrador/NarradorCampamentosDefs"
require "Narrador/NarradorCliente"

Narrador = Narrador or {}
local KC = Narrador.CampamentosCliente or {}
Narrador.CampamentosCliente = KC

local K = Narrador.CampamentosDefs

-- Nivel de confianza (1..5) de mi grupo con un misionero, segun la vista del servidor.
function KC.miConfianza(estado, contactoId)
    local C = Narrador.Cliente
    local grupo = C ~= nil and C.miGrupo() or nil
    local fila = estado.reputacion ~= nil and grupo ~= nil and estado.reputacion[grupo] or nil
    local r = fila ~= nil and fila[contactoId] or nil
    if estado.reputacion_activa == false then return 1 end
    return tonumber(r ~= nil and r.nivel or 1) or 1
end

function KC.menu(numJugador, context, worldobjects, test)
    if test then return end
    local C = Narrador.Cliente
    local estado = C ~= nil and C.estado or nil
    local jugador = getSpecificPlayer(numJugador)
    if jugador == nil or estado == nil or type(estado.campamentos) ~= "table" then return end
    for contactoId, k in pairs(estado.campamentos) do
        for _, o in ipairs(k.oficios or {}) do
            local cuerpo = o.uid ~= nil and C.cuerpoDe(o.uid) or nil
            if cuerpo ~= nil and math.sqrt((cuerpo:getX() - jugador:getX()) ^ 2 + (cuerpo:getY() - jugador:getY()) ^ 2) <= 5 then
                local def = K.OFICIOS[o.oficio]
                local nivel = KC.miConfianza(estado, contactoId)
                local raiz = context:addOption("[" .. tostring(o.titulo) .. "] Comerciar con " .. tostring(o.nombre), nil, nil)
                local sub = ISContextMenu:getNew(context)
                context:addSubMenu(raiz, sub)
                for i, art in ipairs(def ~= nil and def.catalogo or {}) do
                    local bloqueado = art.confianza ~= nil and nivel < art.confianza
                    local pc = K.precio(art, contactoId, "comida", nivel)
                    local pm = K.precio(art, contactoId, "municion", nivel)
                    local texto = art.texto .. "  (" .. pc .. " comida / " .. pm .. " municion)"
                    if bloqueado then texto = art.texto .. "  (pide confianza " .. art.confianza .. ")" end
                    local op = sub:addOption(texto, nil, nil)
                    if bloqueado then
                        op.notAvailable = true
                    else
                        local pagar = ISContextMenu:getNew(sub)
                        sub:addSubMenu(op, pagar)
                        local idx, oficio = i, o.oficio
                        pagar:addOption("Pagar con comida (" .. pc .. ")", nil, function()
                            C.enviar("comprar", { contacto = contactoId, oficio = oficio, i = idx, moneda = "comida" })
                        end)
                        pagar:addOption("Pagar con municion (" .. pm .. ")", nil, function()
                            C.enviar("comprar", { contacto = contactoId, oficio = oficio, i = idx, moneda = "municion" })
                        end)
                    end
                end
            end
        end
    end
end

if Events ~= nil and not KC._enganchado then
    KC._enganchado = true
    Events.OnFillWorldObjectContextMenu.Add(KC.menu)
end

return KC
