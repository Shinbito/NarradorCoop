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
    -- "recortar" = {min, max}: quedan los "fijos" primeros (por ejemplo Meulen) y una
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
    Motor.corregirNombres(g)
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
    g.accion = Motor.copiar(p)
    local instId, grupoId = inst.id, p.id
    -- A-Life crea como mucho 8 NPCs por pedido: los grupos grandes se piden en tandas de 4 y
    -- se juntan cuando contestan todas.
    local lotes = Motor.partirPedido(args)
    local pendientes, juntos, aceptados, hecho = #lotes, { actorUids = {} }, 0, false
    local function terminar()
        if pendientes > 0 or hecho then return end
        hecho = true
        if #juntos.actorUids == 0 then juntos.actorUids = nil end
        Motor.grupoListo(instId, grupoId, juntos)
    end
    local razon
    for _, a in ipairs(lotes) do
        if hay then Mundo.reservarNombres(a.requestId, porPerfil) end
        local ok, r = Mundo.spawnGrupo(jugador, a, function(resultado)
            if type(resultado) == "table" and type(resultado.actorUids) == "table" then
                for _, uid in ipairs(resultado.actorUids) do juntos.actorUids[#juntos.actorUids + 1] = uid end
            elseif juntos.reason == nil then
                juntos.reason = type(resultado) == "table" and resultado.reason or nil
            end
            pendientes = pendientes - 1
            terminar()
        end)
        if ok then aceptados = aceptados + 1 else pendientes, razon = pendientes - 1, r end
    end
    if aceptados == 0 then
        Mundo.log("A-Life rechazo el grupo '" .. tostring(p.id) .. "' de " .. inst.id .. ": " .. tostring(razon))
        return g.intentos >= 6
    end
    if not hecho then g.estado, g.requestId, g.pedido = "pidiendo", requestId, Mundo.horas() end
    -- Por si las tandas que si salieron ya contestaron antes de que se rechazara la ultima.
    if pendientes == 0 then terminar() end
    if p.lugar == "aviso" and l.temporal then
        inst.lugares.aviso = { x = floor(l.x), y = floor(l.y), z = floor(l.z or 0), etiqueta = l.etiqueta }
    end
    return true
end

-- Un grupo que quedo corto (antes A-Life solo creaba 8 y se perdian los demas, como Wertres y
-- Meulen en la base de Sous): se piden una sola vez los que faltan y se suman al grupo.
-- No se toca a los grupos que se recortan al azar o que dependen de otro grupo.
function Motor.completarGrupo(inst, gid)
    local g = inst.grupos[gid]
    if g == nil or g.estado ~= "listo" or g.completado or g.vacio then return end
    g.completado = true
    local p = g.accion
    if p == nil or p.perfiles == nil or p.recortar ~= nil or p.solo_de_grupo ~= nil then return end
    if inst.fusionar ~= nil and inst.fusionar[gid] ~= nil then return end
    local perfiles = Motor.filtrarPerfiles(inst, p)
    local n = 0
    for _ in pairs(g.miembros) do n = n + 1 end
    if n >= #perfiles then return end
    local faltan = {}
    for _, par in ipairs(perfiles) do
        if g.roles[par[1]] == nil then faltan[#faltan + 1] = par end
    end
    if #faltan == 0 then return end
    local extra = Motor.copiar(p)
    extra.id, extra.perfiles, extra.retraso, extra.no_mas_cerca = tostring(gid) .. "_faltan", faltan, nil, nil
    inst.fusionar = inst.fusionar or {}
    inst.fusionar[extra.id] = gid
    Motor.diferir(inst, extra)
    Mundo.log("al grupo '" .. tostring(gid) .. "' de " .. inst.id .. " le faltan " .. #faltan .. "; se piden")
end

-- Admin: repone los NPCs de las historias activas. En cada grupo amistoso saca a los que
-- murieron o se perdieron, olvida la traicion y la enemistad de A-Life con su faccion, y pide
-- de nuevo a los que faltan (aparecen cuando hay alguien cerca de su lugar).
function Motor.reponerHistorias()
    local st = Motor.estado()
    local grupos, faltan = 0, 0
    local perfilFaccion = {}
    for fid, f in pairs(Narrador.Facciones or {}) do
        for _, m in ipairs(f.miembros or {}) do perfilFaccion[m.id] = fid end
    end
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil then
            for gid, g in pairs(inst.grupos) do
                local p = g.accion
                if g.estado == "listo" and p ~= nil and p.perfiles ~= nil and not p.hostiles
                        and not (inst.fusionar ~= nil and inst.fusionar[gid] ~= nil) then
                    local vivos, facciones = {}, {}
                    for uid, m in pairs(g.miembros) do
                        local actor = Mundo.actor(uid)
                        if not m.vivo or actor == nil or actor.lifecycle == "dead" then
                            if actor ~= nil and actor.lifecycle ~= "dead" then Mundo.retirar(uid) end
                            if m.rol ~= nil and g.roles[m.rol] == uid then g.roles[m.rol] = nil end
                            g.miembros[uid] = nil
                        else
                            vivos[#vivos + 1] = uid
                        end
                    end
                    for perfil in pairs(g.rolPorPerfil or {}) do
                        if perfilFaccion[perfil] ~= nil then facciones[perfilFaccion[perfil]] = true end
                    end
                    for fid in pairs(facciones) do pcall(Mundo.perdonarFaccion, fid, vivos) end
                    g.traicion, g.completado, g.vacio = nil, false, nil
                    local antes = 0
                    for _ in pairs(inst.pendientes) do antes = antes + 1 end
                    Motor.completarGrupo(inst, gid)
                    local despues = 0
                    for _ in pairs(inst.pendientes) do despues = despues + 1 end
                    grupos = grupos + 1
                    if despues > antes then faltan = faltan + 1 end
                end
            end
        end
    end
    Motor.publicar()
    return "Repuestos: " .. grupos .. " grupos revisados, " .. faltan
        .. " con NPCs pedidos de nuevo (aparecen cuando alguien este cerca de su lugar)."
end

Motor.comandosAdmin = Motor.comandosAdmin or {}
Motor.comandosAdmin.reponerHistorias = function() return Motor.reponerHistorias() end

-- NPCs por pedido. A-Life acepta hasta 8 (ALifeAdminConsoleService / ALifeDebugService);
-- se piden de a 4 para no cargar tanto de una vez.
Motor.MAX_POR_PEDIDO = 4

-- Parte un pedido en tandas de Motor.MAX_POR_PEDIDO (con perfiles o con cantidad).
function Motor.partirPedido(args)
    local tope = Motor.MAX_POR_PEDIDO
    local total = args.profileIds ~= nil and #args.profileIds or (tonumber(args.count) or 1)
    if total <= tope then return { args } end
    local lotes = {}
    for desde = 1, total, tope do
        local a = {}
        for k, v in pairs(args) do a[k] = v end
        a.requestId = args.requestId .. ":" .. tostring(#lotes + 1)
        if args.profileIds ~= nil then
            a.profileIds = {}
            for i = desde, math.min(total, desde + tope - 1) do a.profileIds[#a.profileIds + 1] = args.profileIds[i] end
            a.count = #a.profileIds
        else
            a.count = math.min(tope, total - desde + 1)
        end
        lotes[#lotes + 1] = a
    end
    return lotes
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
    -- Los que faltaban de otro grupo (ver Motor.completarGrupo) se suman a ese grupo.
    local destino = inst.fusionar ~= nil and inst.fusionar[grupoId] or nil
    if destino ~= nil and inst.grupos[destino] ~= nil then
        local t = inst.grupos[destino]
        for uid, m in pairs(g.miembros) do
            t.miembros[uid] = m
            if t.roles[m.rol] == nil then t.roles[m.rol] = uid end
        end
        for perfil, rol in pairs(g.rolPorPerfil) do t.rolPorPerfil[perfil] = rol end
        inst.grupos[grupoId], inst.fusionar[grupoId] = nil, nil
        Mundo.log("se sumaron los que faltaban al grupo '" .. tostring(destino) .. "' de " .. instId)
    end
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
-- Nombres que cambiaron (las partidas guardadas todavia tienen el viejo).
Motor.NOMBRES_NUEVOS = { Maulen = "Meulen", Callupan = "Canupan" }

function Motor.corregirNombres(g)
    for _, par in pairs(g.nombres or {}) do
        par[1] = Motor.NOMBRES_NUEVOS[par[1]] or par[1]
        par[2] = Motor.NOMBRES_NUEVOS[par[2]] or par[2]
    end
    for _, m in pairs(g.miembros or {}) do
        if m.nombre ~= nil then m.nombre = Motor.NOMBRES_NUEVOS[m.nombre] or m.nombre end
    end
end

function Motor.nombrarGrupo(g)
    if g.nombres == nil then return end
    Motor.corregirNombres(g)
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
                    if not Mundo.esJugador(asesino) and Mundo.asesinoALife ~= nil then
                        asesino = Mundo.asesinoALife(cuerpo) or asesino
                    end
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

-- Un jugador quedo hostil con una faccion de la historia (A-Life, por danar o matar a uno
-- de los suyos): los grupos de esa faccion en las historias activas cuentan como traicionados,
-- y la condicion "mato_jugador" se cumple (lleva a los finales de traicion).
function Motor.traicionFaccion(faccion, jugador, motivo)
    local spec = Narrador.Facciones ~= nil and Narrador.Facciones[faccion] or nil
    if spec == nil then return end
    local perfiles = {}
    for _, m in ipairs(spec.miembros or {}) do perfiles[m.id] = true end
    local st = Motor.estado()
    for _, id in ipairs(st.orden) do
        local inst = st.arcos[id]
        if inst ~= nil and inst.final == nil then
            for gid, g in pairs(inst.grupos) do
                local delGrupo = false
                for perfil in pairs(g.rolPorPerfil or {}) do if perfiles[perfil] then delGrupo = true end end
                if delGrupo and g.accion ~= nil and not g.accion.hostiles and not g.traicion then
                    g.traicion = Mundo.nombreJugador(jugador)
                    inst.vars.quien_mato = inst.vars.quien_mato or g.traicion
                    Mundo.log(inst.id .. ": " .. tostring(g.traicion) .. " ataco a '" .. tostring(gid) .. "' ("
                        .. tostring(motivo) .. "); cuenta como traicion")
                    Motor.revisarSalidas(inst, 0)
                end
            end
        end
    end
    Motor.publicar()
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
