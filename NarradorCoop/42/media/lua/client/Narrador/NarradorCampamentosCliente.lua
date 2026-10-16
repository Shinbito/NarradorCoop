-- Narrador Co-op (cliente): comerciar con la gente de los campamentos.
-- Clic derecho cerca del carpintero, el herrero, el mecanico o el curandero de un campamento:
-- "Comerciar" con su lista de cosas y el precio en comida, municion, abrigo o medicina (segun lo que valora
-- ese campamento y la confianza que te tiene el misionero).
-- Textos sin tildes a proposito.

require "Narrador/NarradorCampamentosDefs"
require "Narrador/NarradorKnoxDefs"
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
    -- Con muy mala fama en Knox no hay descuento.
    local kx = estado.knox ~= nil and grupo ~= nil and estado.knox[grupo] or nil
    local KD = Narrador.KnoxDefs
    if kx ~= nil and KD ~= nil and (tonumber(kx.nivel) or 1) <= KD.DESPRECIO then return 1 end
    return tonumber(r ~= nil and r.nivel or 1) or 1
end

-- Con fama de El destripador o peor no te venden.
function KC.despreciado(estado)
    local C = Narrador.Cliente
    local grupo = C ~= nil and C.miGrupo() or nil
    local kx = estado.knox ~= nil and grupo ~= nil and estado.knox[grupo] or nil
    local KD = Narrador.KnoxDefs
    return kx ~= nil and KD ~= nil and (tonumber(kx.nivel) or 1) <= KD.DESPRECIO
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
                -- Recado: siempre, aunque tengas mala fama.
                if o.recado ~= nil then
                    local oficioR = o.oficio
                    context:addOption("[" .. tostring(o.titulo) .. "] " .. K.RECADO_PEDIDO .. tostring(o.recado), nil, function()
                        C.enviar("recadoComerciante", { contacto = contactoId, oficio = oficioR })
                    end)
                end
                if KC.despreciado(estado) then
                    local no = context:addOption("[" .. tostring(o.titulo) .. "] " .. tostring(o.nombre) .. " no te vende nada", nil, nil)
                    no.notAvailable = true
                else
                    KC.menuCatalogo(context, o, def, contactoId, nivel, k.reservas)
                end
            end
        end
    end
end

-- Lista de cosas que vende y como pagar cada una.
-- Lo que le falta y lo que le sobra al campamento (para saber con que conviene pagar).
function KC.textoReservas(reservas)
    if type(reservas) ~= "table" then return nil end
    local partes, menor, mayor = {}, nil, nil
    for _, m in ipairs(K.ORDEN_MONEDAS) do
        local v = tonumber(reservas[m]) or 50
        partes[#partes + 1] = m .. " " .. math.floor(v)
        if menor == nil or v < (tonumber(reservas[menor]) or 50) then menor = m end
        if mayor == nil or v > (tonumber(reservas[mayor]) or 50) then mayor = m end
    end
    return "Reservas: " .. table.concat(partes, ", ") .. ". Les falta " .. menor .. "; les sobra " .. mayor .. "."
end

function KC.menuCatalogo(context, o, def, contactoId, nivel, reservas)
    local C = Narrador.Cliente
    local raiz = context:addOption("[" .. tostring(o.titulo) .. "] Comerciar con " .. tostring(o.nombre), nil, nil)
    local sub = ISContextMenu:getNew(context)
    context:addSubMenu(raiz, sub)
    local info = KC.textoReservas(reservas)
    if info ~= nil then
        local op = sub:addOption(info, nil, nil)
        op.notAvailable = true
    end
    for i, art in ipairs(def ~= nil and def.catalogo or {}) do
        local bloqueado = art.confianza ~= nil and nivel < art.confianza
        local precios, partes = {}, {}
        for _, m in ipairs(K.ORDEN_MONEDAS) do
            precios[m] = K.precio(art, contactoId, m, nivel, reservas)
            partes[#partes + 1] = precios[m] .. " " .. m
        end
        local texto = art.texto .. "  (" .. table.concat(partes, " / ") .. ")"
        if bloqueado then texto = art.texto .. "  (pide confianza " .. art.confianza .. ")" end
        local op = sub:addOption(texto, nil, nil)
        if bloqueado then
            op.notAvailable = true
        else
            local pagar = ISContextMenu:getNew(sub)
            sub:addSubMenu(op, pagar)
            local idx, oficio = i, o.oficio
            for _, m in ipairs(K.ORDEN_MONEDAS) do
                local moneda = m
                pagar:addOption("Pagar con " .. moneda .. " (" .. precios[moneda] .. ")", nil, function()
                    C.enviar("comprar", { contacto = contactoId, oficio = oficio, i = idx, moneda = moneda })
                end)
            end
        end
    end
end

if Events ~= nil and not KC._enganchado then
    KC._enganchado = true
    Events.OnFillWorldObjectContextMenu.Add(KC.menu)
end

return KC
