-- Narrador Co-op: motor de arcos, grupos.
-- Los grupos de NPCs de A-Life de cada arco: pedirlos, nombrarlos, banderas y muertes.
-- Parte de NarradorMotor.lua, que lo carga al final (no se carga solo).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end
if Narrador == nil or Narrador.Motor == nil or Narrador.Motor._partes == nil then return end
if Narrador.Motor._partes.grupos then return end
Narrador.Motor._partes.grupos = true

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor
local floor = math.floor
local grupo = Motor.grupoArco

-- ---------------------------------------------------------------------------
-- Grupos de NPCs (A-Life)
-- ---------------------------------------------------------------------------

-- Perfiles amistosos de A-Life que hacen de mensajeros.
Motor.PERFILES_MENSAJERO = { "k93_hensley_family_02", "k93_hensley_family_05", "k93_red_cross_03",
    "k93_truckstop_02", "k93_vfd_03", "k93_county_ems_04", "k93_red_cross_02", "k93_hensley_family_03" }

-- Botin por dificultad (cada entrada: alternativas por si un item no existe).
Motor.BOTIN = {
    facil = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.Bandage" },
              { "Base.Bullets9mmBox", "Base.Bullets9mm" } },
    medio = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.Bandage" },
              { "Base.Bandage" }, { "Base.Pills" }, { "Base.ShotgunShells" }, { "Base.Bullets9mmBox", "Base.Bullets9mm" },
              { "Base.Machete", "Base.Crowbar" } },
    dificil = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedBeans", "Base.CannedBeans" },
                { "Base.Antibiotics", "Base.Pills" }, { "Base.Bandage" }, { "Base.Bandage" },
                { "Base.ShotgunShells" }, { "Base.ShotgunShells" }, { "Base.Shotgun", "Base.DoubleBarrelShotgun" },
                { "Base.Vest_BulletPolice", "Base.Vest_BulletCivilian" } },
}
Motor.BOTIN.cura = Motor.BOTIN.dificil
Motor.CHANCE_CHETADA = { facil = 0, medio = 5, dificil = 15 }

-- Facciones hostiles de A-Life que se usan cuando un evento pide "bandidos" sin decir cuales.
Motor.FACCIONES_BANDIDAS = { "alife_hobbs", "alife_cornfield", "alife_tollmen", "alife_pit",
    "alife_dixie_road", "alife_countyline" }

-- "solo_de_grupo": solo los roles que estan vivos (o se fueron) en ese otro grupo del arco.
-- "sin_muertos_de": quita los roles que murieron en otra historia (memoria "<x>_murio_<rol>").
function Motor.filtrarPerfiles(inst, p)
    local lista = {}
    local st = Motor.estado()
    local otro = p.solo_de_grupo ~= nil and inst.grupos[p.solo_de_grupo] or nil
    for _, par in ipairs(p.perfiles or {}) do
        local sirve = true
        if p.solo_de_grupo ~= nil then
            local uid = otro ~= nil and otro.roles[par[1]] or nil
            local m = uid ~= nil and otro.miembros[uid] or nil
            sirve = m ~= nil and (m.vivo or m.retirado == true)
        end
        if sirve and p.sin_muertos_de ~= nil and st.memoria[p.sin_muertos_de .. "_murio_" .. par[1]] == true then
            sirve = false
        end
        if sirve then lista[#lista + 1] = par end
    end
    -- "recortar" = {min, max}: quedan los "fijos" primeros (por ejemplo Maulen) y una
    -- cantidad al azar del resto (sus matones).
    if p.recortar ~= nil then
        local fijos = tonumber(p.fijos) or 0
        local extra = Motor.cantidad(p.recortar, 0)
        local recortada = {}
        for i, par in ipairs(lista) do
            if i <= fijos + extra then recortada[#recortada + 1] = par end
        end
        lista = recortada
    end
    return lista
end

function Motor.perfilPropio(id)
    for _, f in pairs(Narrador.Facciones or {}) do
        for _, m in ipairs(f.miembros or {}) do
            if m.id == id then return m end
        end
    end
    return nil
end

function Motor.pedirGrupo(inst, p, l, jugador)
    if not Mundo.hayALife() then
        Mundo.log("se pidio un grupo de NPCs pero Project A-Life no esta activo")
        return true
    end
    local g = inst.grupos[p.id]
    if g == nil then
        g = { miembros = {}, roles = {}, intentos = 0, rolPorPerfil = {}, femeninos = {}, nombres = {} }
        inst.grupos[p.id] = g
    end
    -- Nombres fijos por rol: { padre = { "Daniel", "Bell" }, ... }
    for rol, par in pairs(p.nombres or {}) do g.nombres[rol] = { par[1], par[2] } end
    if g.estado == "pidiendo" or g.estado == "listo" then return true end
    g.intentos = g.intentos + 1
    local requestId = "narrador:" .. inst.id .. ":" .. tostring(p.id) .. ":" .. tostring(g.intentos)
    local args = {
        requestId = requestId,
        x = floor(l.x), y = floor(l.y), z = floor(l.z or 0),
        mode = p.modo or "guard",
        radius = p.radio_grupo or 6,
        distance = 0,
        separation = p.separacion or 1,
        atomicGroup = true,
        persistent = true,
    }
    if p.perfiles ~= nil then
        args.profileIds = {}
        local perfiles = Motor.filtrarPerfiles(inst, p)
        if #perfiles == 0 then
            -- No queda nadie para este grupo (por ejemplo, todos murieron antes): grupo vacio.
            g.estado, g.vacio = "listo", true
            Motor.revisarSalidas(inst, 0)
            return true
        end
        for _, par in ipairs(perfiles) do
            local perfil = tostring(Motor.valor(inst, par[2]))
            -- Perfiles propios del Narrador (Sous): nombre fijo y respaldo si A-Life no lo tiene.
            local propio = Motor.perfilPropio(perfil)
            if propio ~= nil then
                if g.nombres[par[1]] == nil and not propio.nombre_al_azar then
                    local n, a = string.match(propio.nombre, "^(%S+)%s+(.+)$")
                    g.nombres[par[1]] = { n or propio.nombre, a or "" }
                end
                if propio.respaldo ~= nil and not Mundo.existePerfil(perfil) then perfil = propio.respaldo end
            end
            args.profileIds[#args.profileIds + 1] = perfil
            g.rolPorPerfil[perfil] = par[1]
        end
        args.count = #args.profileIds
    else
        local faccion = p.faccion
        if faccion == nil and p.hostiles then faccion = Motor.FACCIONES_BANDIDAS end
        if type(faccion) == "table" then faccion = faccion[Mundo.azar(#faccion)] end
        args.factionId = faccion
        args.count = Motor.cantidad(p.cantidad, 2)
    end
    for _, rol in ipairs(p.femeninos or {}) do g.femeninos[rol] = true end
    if p.hostiles then
        args.hostileOverride = true
        args.playerKeepOut = p.distancia_minima or 18
        if jugador ~= nil then args.targetUsername = Mundo.nombreJugador(jugador) end
    else
        args.hostileOverride = false
        args.playerStance = p.postura or "friendly"
        args.playerKeepOut = p.distancia_minima or 0
    end
    if p.quietos then
        args.stationary = true
        args.leashRadius = p.correa or 4
    elseif p.correa ~= nil then
        -- Se mueven (por el edificio y los alrededores) pero sin alejarse mas que la correa.
        args.leashRadius = p.correa
    end
    if p.inmortales then args.invulnerable = true end
    if p.salud ~= nil then args.health = p.salud end
    for clave, valor in pairs(p.banderas or {}) do args[clave] = valor end

    -- Nombres de la historia: se reservan para que cada NPC nazca con el suyo.
    local porPerfil, hay = {}, false
    for perfil, rol in pairs(g.rolPorPerfil) do
        local par = g.nombres[rol]
        if par ~= nil then porPerfil[perfil] = { par[1], par[2] }; hay = true end
    end
    if hay then Mundo.reservarNombres(requestId, porPerfil) end

    g.accion = Motor.copiar(p)
    local instId, grupoId = inst.id, p.id
    local ok, razon = Mundo.spawnGrupo(jugador, args, function(resultado)
        Motor.grupoListo(instId, grupoId, resultado)
    end)
    if not ok then
        Mundo.log("A-Life rechazo el grupo '" .. tostring(p.id) .. "' de " .. inst.id .. ": " .. tostring(razon))
        return g.intentos >= 6
    end
    g.estado, g.requestId, g.pedido = "pidiendo", requestId, Mundo.horas()
    if p.lugar == "aviso" and l.temporal then
        inst.lugares.aviso = { x = floor(l.x), y = floor(l.y), z = floor(l.z or 0), etiqueta = l.etiqueta }
    end
    return true
end

function Motor.grupoListo(instId, grupoId, resultado)
    local inst = Motor.estado().arcos[instId]
    if inst == nil then return end
    local g = inst.grupos[grupoId]
    if g == nil then return end
    local uids = type(resultado) == "table" and resultado.actorUids or nil
    if type(uids) ~= "table" or #uids == 0 then
        g.estado = "fallo"
        Mundo.log("el grupo '" .. tostring(grupoId) .. "' de " .. instId .. " no aparecio: "
            .. tostring(type(resultado) == "table" and resultado.reason or "?"))
        if g.intentos < 6 and g.accion ~= nil then Motor.diferir(inst, g.accion) end
        return
    end
    for i, uid in ipairs(uids) do
        local actor = Mundo.actor(uid)
        local rol = actor ~= nil and g.rolPorPerfil[tostring(actor.profileId)] or nil
        if rol == nil or g.roles[rol] ~= nil then rol = "miembro" .. tostring(i) end
        local par = g.nombres ~= nil and g.nombres[rol] or nil
        g.miembros[uid] = { rol = rol, vivo = true, femenino = g.femeninos[rol] == true,
            nombre = par ~= nil and par[1] or nil }
        g.roles[rol] = uid
    end
    g.estado = "listo"
    for uid in pairs(g.miembros) do Mundo.uidsPropios[tostring(uid)] = true end
    Motor.nombrarGrupo(g)
    Motor.banderasGrupo(inst, g)
    if g.accion ~= nil and g.accion.acompanar then Motor.acompanarGrupo(inst, g) end
    if grupoId == "mensajero" and inst.mensaje ~= nil then
        local l = inst.lugares.aviso
        local texto = inst.mensaje.llegada
            or ((l ~= nil and l.sala ~= nil) and "Alguien llego a {lugar:aviso} preguntando por ustedes."
                or "Alguien se acerca buscandolos. Esta cerca.")
        Motor.avisar(inst, Motor.texto(inst, texto))
    end
    Motor.revisarSalidas(inst, 0)
    Motor.publicar()
end

-- Los miembros siguen al jugador mas cercano (postura "caminar con" de A-Life).
function Motor.acompanarGrupo(inst, g)
    for uid, m in pairs(g.miembros) do
        if m.vivo then
            local x, y = Mundo.posicionActor(uid)
            local j = x ~= nil and Mundo.jugadorCerca(x, y, 80) or nil
            if j ~= nil then Mundo.acompanar(uid, j, 2) end
        end
    end
end

-- Banderas de A-Life segun lo que pidio la accion del grupo: inmortales, quietos, correa
-- y extras (vida, dano). Se reaplican cada tanto por si A-Life las pierde o un cliente
-- entra despues (asi los mensajeros y Sous en su base siguen siendo inmortales en MP).
function Motor.banderasDe(inst, a)
    if type(a) ~= "table" then return nil end
    if not a.inmortales and not a.quietos and a.correa == nil and a.banderas == nil and a.mortales == nil then return nil end
    local f = { persistent = true, invulnerable = a.inmortales == true, stationary = a.quietos == true }
    if a.correa ~= nil then f.leashRadius = a.correa end
    for clave, valor in pairs(a.banderas or {}) do f[clave] = valor end
    local l = a.lugar ~= nil and inst.lugares[a.lugar] or nil
    local ancla = l ~= nil and { x = l.x, y = l.y, z = l.z or 0 } or nil
    return f, ancla
end

function Motor.banderasGrupo(inst, g)
    local flags, ancla = Motor.banderasDe(inst, g.accion)
    if flags == nil then return end
    for uid, m in pairs(g.miembros) do
        if m.vivo then pcall(Mundo.banderas, uid, flags, ancla) end
    end
end

function Motor.nombreCompleto(g, m)
    local par = g.nombres ~= nil and g.nombres[m.rol] or nil
    if par ~= nil then return par[2] ~= nil and par[2] ~= "" and (par[1] .. " " .. par[2]) or par[1] end
    return m.nombre or m.rol
end

-- Pone a cada miembro el nombre de su rol en A-Life (y los presenta a los jugadores conectados).
function Motor.nombrarGrupo(g)
    if g.nombres == nil then return end
    for uid, m in pairs(g.miembros) do
        local par = g.nombres[m.rol]
        if m.vivo and par ~= nil then Mundo.nombrarActor(uid, par[1], par[2]) end
    end
end

-- Muerte avisada por A-Life (trae al asesino).
function Motor.onNpcMuerto(cuerpo, uid, asesino)
    if uid == nil then return end
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil then
            for _, g in pairs(inst.grupos) do
                local m = g.miembros[uid]
                if m ~= nil and m.vivo then
                    m.vivo = false
                    if Mundo.esJugador(asesino) then
                        m.causa = "jugador"
                        inst.vars.quien_mato = Mundo.nombreJugador(asesino)
                    else
                        m.causa = "otro"
                    end
                    Motor.revisarSalidas(inst, 0)
                    Motor.publicar()
                    return
                end
            end
        end
    end
end

-- Revision periodica por si el aviso de muerte no llego (por ejemplo, murio sin cargar).
function Motor.revisarGrupos(inst)
    if Motor.minutosDesdeArranque < 10 then return false end
    local cambio = false
    for _, g in pairs(inst.grupos) do
        if g.estado == "listo" then
            -- Cada tanto se repasan los nombres: A-Life los puede pisar o puede entrar un jugador nuevo.
            if Motor.minutosDesdeArranque % 10 == 0 then
                Motor.nombrarGrupo(g)
                if inst.final == nil then Motor.banderasGrupo(inst, g) end
                if g.accion ~= nil and g.accion.acompanar and inst.final == nil then Motor.acompanarGrupo(inst, g) end
            end
            for uid, m in pairs(g.miembros) do
                if m.vivo then
                    local actor = Mundo.actor(uid)
                    if actor ~= nil and actor.lifecycle == "dead" then
                        m.vivo, m.causa, cambio = false, m.causa or "otro", true
                    elseif actor == nil then
                        m.faltas = (m.faltas or 0) + 1
                        -- No se sabe si murio o solo se descargo: queda "desaparecido" (no va al diario de caidos).
                        if m.faltas >= 3 then m.vivo, m.causa, m.desaparecido, cambio = false, m.causa or "otro", true, true end
                    else
                        m.faltas = 0
                    end
                end
            end
        elseif g.estado == "pidiendo" and Mundo.horas() - (g.pedido or 0) > 1 then
            -- A-Life nunca contesto (por ejemplo, se reinicio el servidor): pedirlo de nuevo.
            g.estado = "fallo"
            if g.intentos < 6 and g.accion ~= nil then Motor.diferir(inst, g.accion) end
        end
    end
    return cambio
end
