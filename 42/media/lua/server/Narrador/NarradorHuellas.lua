-- Narrador Co-op: huellas, fama y ecos.
--   * Huella: cada decision importante queda anotada (que hiciste, en que historia, cuando).
--   * Fama: tres ejes por grupo (compasion, palabra, miedo) mas lo que cobras. Dan un titulo
--     (El samaritano, El de palabra, El temido, El mercenario, El mentiroso) que cambia que
--     historias te llegan y como te saludan.
--   * Ecos: consecuencias que llegan dias despues (regalos, avisos, otra historia).
--   * "Lo que hiciste": pagina del diario con tus huellas; cuando llega un eco, la entrada
--     se completa con lo que paso despues.
-- Sin tildes ni enies a proposito.

if isClient ~= nil and isClient() then return end

require "Narrador/NarradorDefs"
require "Narrador/NarradorMundo"
require "Narrador/NarradorMotor"
require "Narrador/NarradorEtiquetas"

local Defs, Mundo, Motor, Et = Narrador.Defs, Narrador.Mundo, Narrador.Motor, Narrador.Etiquetas
local floor = math.floor

local H = Narrador.Huellas or {}
Narrador.Huellas = H

-- Como mueve cada acto la fama: c = compasion, p = palabra, m = miedo, cobro.
H.ACTOS = {
    salvaste = { c = 4 }, compartiste = { c = 3 }, perdonaste = { c = 3 }, protegiste = { c = 4, m = 1 },
    convenciste = { c = 1, p = 1 }, verdad = { p = 3, c = 1 }, cumpliste = { p = 2 },
    lo_dejaste = { c = -3 }, no_alcanzaste = {}, mataste = { c = -5, m = 4 }, entregaste = { c = -3, p = -1, cobro = 1 },
    obligaste = { c = -1, m = 1 }, intimidaste = { c = -2, m = 2 }, mentiste = { p = -4 }, traicionaste = { p = -6, m = 2 },
    peleaste = { m = 2 }, huiste = { m = -1 }, cobraste = { c = -1, cobro = 1 }, curioseaste = { p = -1 },
    pagaste = { m = -2 }, abandonaste = { p = -3 }, fallaste = { p = -1 },
}

-- Texto por defecto si la huella no trae uno.
H.TEXTOS = {
    salvaste = "Ayude a alguien que lo necesitaba", compartiste = "Comparti lo que tenia", perdonaste = "Deje ir a alguien",
    protegiste = "Proteji a alguien", convenciste = "Convenci a alguien de hacer lo correcto", verdad = "Dije la verdad aunque doliera",
    cumpliste = "Cumpli mi palabra", lo_dejaste = "No fui cuando me necesitaban", no_alcanzaste = "No alcance a llegar",
    mataste = "Mate a alguien", entregaste = "Entregue a alguien", obligaste = "Obligue a alguien", intimidaste = "Asuste a gente que no lo merecia",
    mentiste = "Menti", traicionaste = "Traicione a quien confiaba en mi", peleaste = "Pelee", huiste = "Arranque",
    cobraste = "Cobre por ayudar", curioseaste = "Abri lo que no era mio", pagaste = "Pague para evitar problemas",
    abandonaste = "Deje botado un encargo", fallaste = "Falle un encargo",
}

H.TITULOS = { c = "El samaritano", p = "El de palabra", m = "El temido" }
H.SALUDOS = {
    ["El samaritano"] = "En el condado ya te dicen El samaritano. La gente que necesita ayuda va a saber donde buscarte.",
    ["El de palabra"] = "En el condado ya te dicen El de palabra. Hasta los bandidos negocian en serio contigo.",
    ["El temido"] = "En el condado ya te dicen El temido. Algunos se apartan cuando te ven llegar.",
    ["El mercenario"] = "En el condado ya te dicen El mercenario. Te van a llegar ofertas que nadie mas acepta.",
    ["El mentiroso"] = "En el condado ya te dicen El mentiroso. Te va a costar mas que te crean.",
}

function H.st()
    local st = Motor.estado()
    st.huellas = st.huellas or {}
    st.fama = st.fama or {}
    st.ecos = st.ecos or {}
    st.secHuella = st.secHuella or 0
    return st
end

function H.fama(grupo)
    local st = H.st()
    st.fama[grupo] = st.fama[grupo] or { c = 0, p = 0, m = 0, cobro = 0 }
    return st.fama[grupo]
end

function H.titulo(grupo)
    if grupo == nil then return nil end
    local f = H.st().fama[grupo]
    if f == nil then return nil end
    if f.p <= -15 then return "El mentiroso" end
    if (f.cobro or 0) >= 5 and f.c < 0 then return "El mercenario" end
    local mejor, valor
    for _, eje in ipairs({ "c", "p", "m" }) do
        if f[eje] >= 20 and (valor == nil or f[eje] > valor) then mejor, valor = eje, f[eje] end
    end
    return mejor ~= nil and H.TITULOS[mejor] or nil
end

-- Grupos a los que se le anota una huella de un arco.
function H.gruposDe(inst)
    if inst.vars ~= nil and inst.vars.dueno ~= nil then return { inst.vars.dueno } end
    local nombre = inst.vars ~= nil and inst.vars.quien_eligio or nil
    local lista, vistos = {}, {}
    for _, p in ipairs(Mundo.jugadores()) do
        local n = Mundo.nombreJugador(p)
        if nombre == nil or n == nombre or n == inst.refNombre then
            local g = Mundo.grupoDe(p)
            if not vistos[g] then vistos[g] = true; lista[#lista + 1] = g end
        end
    end
    return lista
end

function H.registrar(inst, acto, texto, extra)
    local st = H.st()
    local def = inst.def ~= nil and Defs.get(inst.def) or nil
    local titulo = def ~= nil and Motor.texto(inst, def.titulo or inst.def) or nil
    local t = texto ~= nil and Motor.texto(inst, texto) or nil
    if t == nil or t == "" then
        t = (H.TEXTOS[acto] or acto) .. (titulo ~= nil and (" (" .. titulo .. ")") or "") .. "."
    end
    local grupos = H.gruposDe(inst)
    st.secHuella = st.secHuella + 1
    local h = { id = st.secHuella, h = floor(Mundo.horas()), acto = acto, def = inst.def, inst = inst.id, texto = t,
        grupos = grupos, quien = inst.vars ~= nil and inst.vars.quien_eligio or nil, extra = extra }
    st.huellas[#st.huellas + 1] = h
    while #st.huellas > 200 do table.remove(st.huellas, 1) end
    local mov = H.ACTOS[acto] or {}
    for _, g in ipairs(grupos) do
        local antes = H.titulo(g)
        local f = H.fama(g)
        f.c = math.max(-100, math.min(100, f.c + (mov.c or 0)))
        f.p = math.max(-100, math.min(100, f.p + (mov.p or 0)))
        f.m = math.max(-100, math.min(100, f.m + (mov.m or 0)))
        f.cobro = (f.cobro or 0) + (mov.cobro or 0)
        local despues = H.titulo(g)
        if despues ~= nil and despues ~= antes then H.anunciarTitulo(g, despues) end
    end
    if acto == "mataste" or acto == "traicionaste" then
        local D = Narrador.Director
        if D ~= nil and D.subirTension ~= nil then D.subirTension(4) end
    end
    return h
end

function H.anunciarTitulo(grupo, titulo)
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.grupoDe(p) == grupo then Motor.enviar(p, "aviso", { texto = H.SALUDOS[titulo] or titulo }) end
    end
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = "Ahora me dicen " .. titulo .. ".", arco = "Lo que hiciste" }
    while #st.diario > Motor.MAX_DIARIO_GLOBAL do table.remove(st.diario, 1) end
end

-- {"huella", acto = "salvaste", texto = "..."}
Motor.inmediatas.huella = function(inst, a)
    local h = H.registrar(inst, a.acto, a.texto, a.extra)
    inst.ultimaHuella = h.id
    return true
end

-- {fama} -> el titulo del grupo dueno (o del primero conectado) o "alguien sin fama".
Motor.plantillas.fama = function(inst)
    local grupo = inst.vars ~= nil and inst.vars.dueno or nil
    if grupo == nil then
        local j = Mundo.jugadorAlAzar()
        grupo = j ~= nil and Mundo.grupoDe(j) or nil
    end
    return H.titulo(grupo) or "alguien sin fama"
end

-- {"fama_es", "El samaritano"}: algun grupo conectado (o el dueno) tiene ese titulo.
Motor.condiciones.fama_es = function(inst, c)
    if inst.vars ~= nil and inst.vars.dueno ~= nil then return H.titulo(inst.vars.dueno) == c[2] end
    for _, p in ipairs(Mundo.jugadores()) do if H.titulo(Mundo.grupoDe(p)) == c[2] then return true end end
    return false
end

-- {"huella_de", acto}: alguna vez (en esta partida) alguien hizo eso.
Motor.condiciones.huella_de = function(inst, c)
    for _, h in ipairs(H.st().huellas) do
        if h.acto == c[2] and (c[3] == nil or h.def == c[3]) then return true end
    end
    return false
end

-- ---------------------------------------------------------------------------
-- Encargos: cumplir, vencer y abandonar tambien dejan huella
-- ---------------------------------------------------------------------------

function H.alTerminar(inst, def, final)
    if inst.vars.contacto == nil or inst.vars.huella_fin then return end
    inst.vars.huella_fin = true
    if final == "final_cumplido" or final == "final_alijo" or final == "final_arma" or final == "final_traje" or final == "final_auto" then
        H.registrar(inst, "cumpliste", "Cumpli el encargo de {contacto_nombre}: " .. tostring(Motor.texto(inst, def.titulo or "")) .. ".")
    elseif final == "final_abandonado" then
        H.registrar(inst, "abandonaste", "Deje botado el encargo de {contacto_nombre}.")
    elseif final == "final_vencido" then
        H.registrar(inst, "fallaste", "No alcance a cumplir el encargo de {contacto_nombre}.")
    end
end

-- ---------------------------------------------------------------------------
-- Ecos
-- ---------------------------------------------------------------------------

-- {"eco", indice = n} (de Etiquetas.ECOS) o {"eco", horas, tipo, texto, items, nota, def_eco}
Motor.inmediatas.eco = function(inst, a)
    local spec = a.indice ~= nil and Et.ECOS[a.indice] or a
    if spec == nil then return true end
    local st = H.st()
    local horas = Motor.cantidad(spec.horas, 72)
    st.ecos[#st.ecos + 1] = { cuando = Mundo.horas() + horas, tipo = spec.tipo or "aviso",
        texto = Motor.texto(inst, spec.texto or ""), nota = spec.nota ~= nil and Motor.texto(inst, spec.nota) or nil,
        items = spec.items, def_eco = spec.def_eco, grupos = H.gruposDe(inst), ref = inst.refNombre,
        huella = inst.ultimaHuella, desde = inst.def }
    return true
end

-- Diferida: marca la huella de este arco con lo que paso (se usa en el encuentro ignorado).
Motor.diferidas.eco_marca = function(inst, p, l, jugador)
    H.completarHuella(inst.ultimaHuella, Motor.texto(inst, p.texto or ""))
    if jugador ~= nil and p.aviso ~= nil then Motor.enviar(jugador, "aviso", { texto = Motor.texto(inst, p.aviso) }) end
    return true
end

function H.completarHuella(id, texto)
    if id == nil then return end
    for _, h in ipairs(H.st().huellas) do
        if h.id == id then h.eco = texto; return end
    end
end

local function jugadorDe(eco)
    local candidato
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.vivo(p) then
            if Mundo.nombreJugador(p) == eco.ref then return p end
            for _, g in ipairs(eco.grupos or {}) do if Mundo.grupoDe(p) == g then candidato = candidato or p end end
        end
    end
    return candidato
end

function H.dispararEco(eco)
    local p = jugadorDe(eco)
    if p == nil then return false end
    if eco.tipo == "regalo" then
        local x, y, z = Mundo.posicion(p)
        local refugio = Mundo.refugioDe(p)
        if refugio ~= nil and Mundo.cargado(refugio.x, refugio.y, refugio.z) ~= nil then x, y, z = refugio.x, refugio.y, refugio.z end
        if Mundo.cargado(x, y, z) == nil then return false end
        for _, tipos in ipairs(eco.items or {}) do
            local item = Mundo.crearItem(tipos)
            if item ~= nil then Mundo.dejarEnSuelo(x, y, z, item) end
        end
        if eco.nota ~= nil then
            local nota = Mundo.crearNota("Nota", eco.nota)
            if nota ~= nil then Mundo.dejarEnSuelo(x, y, z, nota) end
        end
    elseif eco.tipo == "historia" and eco.def_eco ~= nil then
        if Motor.activos(eco.def_eco) == 0 then
            local inst = Motor.iniciar(eco.def_eco, p, { vars = { por_eco = eco.desde } })
            if inst == nil then return false end
        end
    end
    Motor.enviar(p, "aviso", { texto = eco.texto })
    local st = Motor.estado()
    st.diario[#st.diario + 1] = { h = floor(Mundo.horas()), t = eco.texto, arco = "Lo que hiciste" }
    while #st.diario > Motor.MAX_DIARIO_GLOBAL do table.remove(st.diario, 1) end
    H.completarHuella(eco.huella, eco.texto)
    return true
end

function H.tick()
    if Motor.minutosDesdeArranque % 10 ~= 0 then return end
    local st = H.st()
    local ahora = Mundo.horas()
    for i = #st.ecos, 1, -1 do
        local eco = st.ecos[i]
        if ahora >= eco.cuando then
            local ok, hecho = pcall(H.dispararEco, eco)
            if (ok and hecho) or ahora - eco.cuando > 24 * 7 then
                table.remove(st.ecos, i)
            end
        end
    end
end

-- ---------------------------------------------------------------------------
-- Vista
-- ---------------------------------------------------------------------------

function H.vista(v)
    local st = H.st()
    local porGrupo = {}
    for grupo, f in pairs(st.fama) do
        porGrupo[grupo] = { titulo = H.titulo(grupo), c = f.c, p = f.p, m = f.m, huellas = {} }
    end
    for i = #st.huellas, 1, -1 do
        local h = st.huellas[i]
        for _, g in ipairs(h.grupos or {}) do
            porGrupo[g] = porGrupo[g] or { huellas = {}, c = 0, p = 0, m = 0 }
            local lista = porGrupo[g].huellas
            if #lista < 14 then lista[#lista + 1] = { h = h.h, t = h.texto, eco = h.eco } end
        end
    end
    v.huellas = porGrupo
end

function H.estadoTexto()
    local partes = {}
    for grupo, f in pairs(H.st().fama) do
        partes[#partes + 1] = tostring(grupo) .. ": " .. tostring(H.titulo(grupo) or "sin fama") .. " (compasion " .. f.c
            .. ", palabra " .. f.p .. ", miedo " .. f.m .. ", cobro " .. (f.cobro or 0) .. ")"
    end
    partes[#partes + 1] = "Ecos pendientes: " .. #H.st().ecos
    return table.concat(partes, "\n")
end

Motor.alTerminar[#Motor.alTerminar + 1] = H.alTerminar
Motor.vistaExtra[#Motor.vistaExtra + 1] = H.vista
Motor.tickExtra.huellas = H.tick
Motor.comandosAdmin.ecoAhora = function()
    local st = H.st()
    if #st.ecos == 0 then return "No hay ecos pendientes." end
    st.ecos[1].cuando = Mundo.horas()
    H.tick()
    return "Eco forzado."
end

return H
