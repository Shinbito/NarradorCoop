-- Narrador Co-op: objetos propios del mod (items de mision con modelo 3D, armas de Sous,
-- mapas anotados y poster de Sous).
--
-- Este archivo no toca los arcos a mano: al cargar (y de nuevo al empezar la partida) les
-- cambia los objetos vanilla por los del mod. Si los items del mod no cargaran por algun
-- motivo, los arcos siguen funcionando con los objetos vanilla de respaldo.
-- Textos sin tildes a proposito.

require "Narrador/NarradorDefs"
require "Narrador/Arcos/Contratos"
require "Narrador/Arcos/Sous"

Narrador = Narrador or {}
local O = Narrador.Objetos or {}
Narrador.Objetos = O

-- Simbolo para marcar mapas con el fenix de Sous.
O.SIMBOLO_SOUS = "NarradorSous"

function O.registrarSimbolos()
    if O._simbolos or MapSymbolDefinitions == nil then return end
    pcall(function()
        MapSymbolDefinitions.getInstance():addTexture(O.SIMBOLO_SOUS, "media/ui/Narrador/SimboloSous.png", "Symbols")
        O._simbolos = true
    end)
end
O.registrarSimbolos()

-- ---------------------------------------------------------------------------
-- Armas de Sous: la recompensa de cada favor (ver Arcos/FavoresSous.lua).
-- ---------------------------------------------------------------------------
O.ARMAS_SOUS = {
    benjamin = "Narrador.MataPerrasMatric",
    martin_z = "Narrador.SarcasmoZent",
    martin_a = "Narrador.BarraAkagami",
    david = "Narrador.MarcoTeoricoShinbo",
    bastian = "Narrador.FachaTati",
    hanz = "Narrador.HachaWalita",
    cristian = "Narrador.PicotaCristonks",
    jorge = "Narrador.BalanceHasag",
    cristobal = "Narrador.PalaWertres",
}

-- ---------------------------------------------------------------------------
-- Cambios a los arcos existentes
-- ---------------------------------------------------------------------------

-- Objetos de mision: { def (patron), id del objeto, item del mod }.
O.CAMBIOS_OBJETOS = {
    { "^sous$", "medicina", "Narrador.BotiquinSous" },
    { "^sous$", "diario_maulen", "Narrador.DiarioMaulen" },
    { "^sous_arsenal$", "caja", "Narrador.CajaArsenal" },
    { "^encargo_paquete_", "objeto", "Narrador.PaqueteMisionero" },
    { "^encargo_medicina_", "objeto", "Narrador.Antibioticos" },
    { "^encargo_planos_", "objeto", "Narrador.PlanosPueblo" },
    { "^encargo_ultra_hospital$", "objeto", "Narrador.MuestrasHospital" },
    { "^encargo_ultra_militar$", "objeto", "Narrador.MaletinMilitar" },
    { "^encargo_ultra_mall$", "objeto", "Narrador.LlavesBoveda" },
    { "^encargo_ultra_comisaria$", "objeto", "Narrador.ExpedienteSellado" },
}

-- Acciones nuevas que se agregan al entrar a una etapa: { def, etapa, accion }.
O.ACCIONES_EXTRA = {
    -- El poster con el fenix, en una pared de la base.
    { "^sous$", "base", { "poster", lugar = "base_sous", radio = 45 } },
}

local function anteponer(lista, tipo)
    if type(lista) == "string" then lista = { lista } end
    lista = lista or {}
    if lista[1] == tipo then return lista end
    local nueva = { tipo }
    for _, t in ipairs(lista) do if t ~= tipo then nueva[#nueva + 1] = t end end
    return nueva
end

local function recorrerAcciones(def, f)
    for _, etapa in pairs(def.etapas or {}) do
        for _, a in ipairs(etapa.al_entrar or {}) do
            if type(a) == "table" then f(a, etapa) end
        end
    end
end

-- Idempotente: se puede llamar varias veces (al cargar, al empezar la partida, etc.).
function O.ajustarArcos()
    local Defs = Narrador.Defs
    if Defs == nil or Defs.todos == nil then return 0 end
    local cambios = 0
    for _, def in ipairs(Defs.todos()) do
        local id = tostring(def.id)
        for _, c in ipairs(O.CAMBIOS_OBJETOS) do
            if string.find(id, c[1]) ~= nil then
                recorrerAcciones(def, function(a)
                    if a[1] == "objeto" and a.id == c[2] then
                        local nueva = anteponer(a.tipo, c[3])
                        if nueva ~= a.tipo then a.tipo = nueva; cambios = cambios + 1 end
                    end
                end)
            end
        end
        for _, c in ipairs(O.ACCIONES_EXTRA) do
            local etapa = def.etapas ~= nil and def.etapas[c[2]] or nil
            if string.find(id, c[1]) ~= nil and etapa ~= nil then
                etapa.al_entrar = etapa.al_entrar or {}
                local clave = c[1] .. "|" .. c[2] .. "|" .. tostring(c[3][1])
                local ya = false
                for _, a in ipairs(etapa.al_entrar) do if type(a) == "table" and a._extra == clave then ya = true end end
                if not ya then
                    local copia = {}
                    for k, v in pairs(c[3]) do copia[k] = v end
                    copia._extra = clave
                    etapa.al_entrar[#etapa.al_entrar + 1] = copia
                    cambios = cambios + 1
                end
            end
        end
    end
    return cambios
end

O.ajustarArcos()
if Events ~= nil and not O._enganchado then
    O._enganchado = true
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(function() O.registrarSimbolos(); O.ajustarArcos() end) end
    if Events.OnServerStarted ~= nil then Events.OnServerStarted.Add(function() O.ajustarArcos() end) end
end

return O
