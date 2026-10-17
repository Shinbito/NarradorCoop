-- Narrador Co-op: motor de arcos, condiciones.
-- Las condiciones de las salidas de cada etapa ({"cerca", lugar}, {"horas", n}...).
-- Parte de NarradorMotor.lua, que lo carga al final (no se carga solo).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end
if Narrador == nil or Narrador.Motor == nil or Narrador.Motor._partes == nil then return end
if Narrador.Motor._partes.condiciones then return end
Narrador.Motor._partes.condiciones = true

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor
local floor = math.floor
local grupo = Motor.grupoArco

-- ---------------------------------------------------------------------------
-- Condiciones
-- ---------------------------------------------------------------------------

Motor.condiciones = {
    cerca = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return Mundo.jugadorCerca(l.x, l.y, tonumber(c[3]) or 35) ~= nil
    end,
    horas = function(inst, c)
        return Mundo.horas() - (inst.etapaDesde or 0) >= (tonumber(Motor.valor(inst, c[2])) or 0)
    end,
    -- {"reloj_resta", id, fraccion}: al reloj le queda al menos esa fraccion (0.5 = la mitad).
    reloj_resta = function(inst, c)
        local r = inst.relojes[c[2]]
        if r == nil or not r.activo or r.total == nil or r.total <= 0 then return false end
        return (r.vence - Mundo.horas()) / r.total >= (tonumber(c[3]) or 0.5)
    end,
    eleccion = function(inst, c)
        return inst.elecciones[c[2]] == true
    end,
    var = function(inst, c)
        return inst.vars[c[2]] == c[3]
    end,
    memoria = function(inst, c)
        return Motor.estado().memoria[c[2]] == c[3]
    end,
    reloj_vencido = function(inst, c)
        local r = inst.relojes[c[2]]
        return r ~= nil and r.activo == true and Mundo.horas() >= r.vence
    end,
    grupo_listo = function(inst, c)
        local g = grupo(inst, c[2])
        return g ~= nil and g.estado == "listo"
    end,
    mato_jugador = function(inst, c)
        local g = grupo(inst, c[2])
        if g == nil then return false end
        for _, m in pairs(g.miembros) do if m.causa == "jugador" then return true end end
        return false
    end,
    muerto = function(inst, c)
        local g = grupo(inst, c[2])
        local uid = g ~= nil and g.roles[c[3]] or nil
        local m = uid ~= nil and g.miembros[uid] or nil
        return m ~= nil and m.vivo == false and m.retirado ~= true
    end,
    todos_muertos = function(inst, c)
        local g = grupo(inst, c[2])
        if g == nil or g.estado ~= "listo" then return false end
        if g.vacio then return true end
        local hay = false
        for _, m in pairs(g.miembros) do
            hay = true
            if m.vivo or m.retirado then return false end
        end
        return hay
    end,
    mensaje_entregado = function(inst, c)
        return inst.mensaje ~= nil and inst.mensaje.entregado == true
    end,
    -- {"alguien_tiene", objetoId}: algun jugador conectado lleva el objeto de la historia.
    alguien_tiene = function(inst, c)
        local etiqueta = inst.id .. ":" .. tostring(c[2])
        for _, p in ipairs(Mundo.jugadores()) do
            if Mundo.buscarItem(p, function(it) return Mundo.tieneEtiqueta(it, etiqueta) end) ~= nil then return true end
        end
        return false
    end,
    vivo = function(inst, c)
        local g = grupo(inst, c[2])
        local uid = g ~= nil and g.roles[tostring(Motor.valor(inst, c[3]))] or nil
        local m = uid ~= nil and g.miembros[uid] or nil
        return m ~= nil and m.vivo == true
    end,
    -- {"hora_entre", desde, hasta}: hora del dia (0-23), puede cruzar la medianoche.
    hora_entre = function(inst, c)
        local h = math.floor(Mundo.horas() % 24)
        local a, b = tonumber(c[2]) or 0, tonumber(c[3]) or 24
        if a <= b then return h >= a and h < b end
        return h >= a or h < b
    end,
    -- {"bajas_en", lugar, cantidad, radio}: zombis muertos cerca del lugar desde que empezo la etapa.
    bajas_en = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return Motor.contarBajas(l.x, l.y, tonumber(c[4]) or 40, inst.etapaDesde or 0) >= (tonumber(Motor.valor(inst, c[3])) or 1)
    end,
    -- {"bajas_menor_que", lugar, cantidad, radio}
    bajas_menor_que = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return Motor.contarBajas(l.x, l.y, tonumber(c[4]) or 40, inst.etapaDesde or 0) < (tonumber(Motor.valor(inst, c[3])) or 1)
    end,
    -- {"ausente", lugar, radio, horas}: nadie estuvo dentro del radio durante esas horas seguidas.
    ausente = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        local clave = tostring(c[2]) .. ":" .. tostring(c[3])
        inst.ausencias = inst.ausencias or {}
        if Mundo.jugadorCerca(l.x, l.y, tonumber(c[3]) or 60) ~= nil then
            inst.ausencias[clave] = nil
            return false
        end
        inst.ausencias[clave] = inst.ausencias[clave] or Mundo.horas()
        return Mundo.horas() - inst.ausencias[clave] >= (tonumber(c[4]) or 0.2)
    end,
    -- {"sin_zombis", lugar, radio}: no quedan zombis cerca del lugar.
    sin_zombis = function(inst, c)
        local l = inst.lugares[c[2]]
        if l == nil then return false end
        return not Mundo.zombiCerca(l.x, l.y, tonumber(c[3]) or 12)
    end,
    -- {"mem", clave}: la memoria de la partida tiene algo en esa clave.
    mem = function(inst, c)
        local v = Motor.estado().memoria[c[2]]
        return v ~= nil and v ~= false
    end,
    -- {"var_mayor", nombre, n}
    var_mayor = function(inst, c)
        return (tonumber(inst.vars[c[2]]) or 0) > (tonumber(c[3]) or 0)
    end,
    -- {"no", condicion}
    no = function(inst, c)
        return not Motor.cumple(inst, c[2])
    end,
    -- {"o", condicion1, condicion2, ...}
    o = function(inst, c)
        for i = 2, #c do if Motor.cumple(inst, c[i]) then return true end end
        return false
    end,
}

-- cuando = una condicion {"tipo", ...}, una lista de condiciones (todas deben cumplirse) o una funcion.
function Motor.cumple(inst, cuando)
    if cuando == nil then return true end
    if type(cuando) == "function" then
        local ok, r = pcall(cuando, inst, Motor)
        return ok and r == true
    end
    if type(cuando) ~= "table" then return false end
    if type(cuando[1]) == "string" then
        local f = Motor.condiciones[cuando[1]]
        if f == nil then
            Mundo.log("condicion desconocida: " .. tostring(cuando[1]))
            return false
        end
        local ok, r = pcall(f, inst, cuando)
        return ok and r == true
    end
    for _, c in ipairs(cuando) do
        if not Motor.cumple(inst, c) then return false end
    end
    return true
end
