-- Narrador Co-op: lo que toca el mundo del juego, la parte de Project A-Life (NPCs, nombres,
-- banderas, facciones, refugios y acompanantes).
-- Parte de NarradorMundo.lua, que la carga al final (no se carga sola).

if Narrador == nil or Narrador.Mundo == nil or Narrador.Mundo._partes == nil then return end
if Narrador.Mundo._partes.alife then return end
Narrador.Mundo._partes.alife = true

local Mundo = Narrador.Mundo
local floor = math.floor

-- ---------------------------------------------------------------------------
-- Project A-Life (NPCs)
-- ---------------------------------------------------------------------------

function Mundo.hayALife()
    return ProjectALife ~= nil and ProjectALife.DebugService ~= nil
        and type(ProjectALife.DebugService.spawnEncounter) == "function"
end

-- Nombres reservados para un pedido: requestId -> { [profileId] = { nombre, apellido } }.
Mundo.nombresReservados = Mundo.nombresReservados or {}

-- A-Life arma la memoria de cada NPC nuevo y llama a Service.attachPerson justo antes de
-- crearlo. Nos colgamos ahi para dejarle el nombre puesto ANTES de que aparezca: asi nace
-- llamandose Daniel Bell (cuerpo, burbujas y menus incluidos) y no hay que renombrarlo despues.
function Mundo.instalarNombres()
    local servicio = ProjectALife ~= nil and ProjectALife.DebugService or nil
    if servicio == nil or type(servicio.attachPerson) ~= "function" or servicio._narradorNombres then return end
    local original = servicio.attachPerson
    servicio.attachPerson = function(memory, job)
        local ok, why = original(memory, job)
        local reservas = type(job) == "table" and Mundo.nombresReservados[tostring(job.requestId)] or nil
        local par = reservas ~= nil and reservas[tostring(job.profileId)] or nil
        if par ~= nil and type(memory) == "table" then
            memory.personFirst, memory.personLast = par[1], par[2]
            memory.personName = (par[2] ~= nil and par[2] ~= "") and (par[1] .. " " .. par[2]) or par[1]
            memory.introducedTo = type(memory.introducedTo) == "table" and memory.introducedTo or {}
            for _, p in ipairs(Mundo.jugadores()) do memory.introducedTo[Mundo.claveALife(p)] = true end
        end
        return ok, why
    end
    servicio._narradorNombres = true
end

function Mundo.reservarNombres(requestId, porPerfil)
    Mundo.instalarNombres()
    Mundo.nombresReservados[tostring(requestId)] = porPerfil
end

-- Pide a A-Life un grupo de NPCs. Al terminar llama aviso(resultado).
function Mundo.spawnGrupo(jugador, args, aviso)
    if not Mundo.hayALife() then return false, "sin_alife" end
    local servicio = ProjectALife.DebugService
    local ok, exito, razon
    if type(servicio.rawSpawn) == "function" then
        -- Igual que el panel de admin de A-Life: sin las reglas de "encuentro dirigido",
        -- que no dejan poner gente adentro de edificios cerrados ni cerca del jugador.
        local resultado
        ok, resultado = pcall(servicio.rawSpawn, jugador, args, true)
        if ok and type(resultado) == "table" then
            exito, razon = resultado.ok == true, resultado.reason
        elseif ok then
            exito = resultado == true
        end
    else
        ok, exito, razon = pcall(servicio.spawnEncounter, jugador, args, true)
    end
    if not ok then return false, tostring(exito) end
    if not exito then return false, razon or "rechazado" end
    if aviso ~= nil and type(servicio.watchGroup) == "function" then
        pcall(servicio.watchGroup, args.requestId, aviso)
    end
    return true, nil
end

function Mundo.actor(uid)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro == nil or type(registro.peek) ~= "function" then return nil end
    local ok, actor = pcall(registro.peek, uid)
    if ok then return actor end
    return nil
end

function Mundo.posicionActor(uid)
    local vigia = ProjectALife ~= nil and ProjectALife.Watchdog or nil
    local enlace = vigia ~= nil and vigia.bindings ~= nil and vigia.bindings[uid] or nil
    if enlace ~= nil and enlace.shell ~= nil then
        local ok, x, y, z = pcall(function() return enlace.shell:getX(), enlace.shell:getY(), enlace.shell:getZ() end)
        if ok and x ~= nil then return x, y, z end
    end
    local actor = Mundo.actor(uid)
    local pos = actor ~= nil and actor.worldPosition or nil
    if type(pos) == "table" then return tonumber(pos.x), tonumber(pos.y), tonumber(pos.z) or 0 end
    return nil
end

-- true si el actor sigue existiendo y no esta muerto.
function Mundo.actorVivo(uid)
    local actor = Mundo.actor(uid)
    if actor == nil then return false end
    return actor.lifecycle ~= "dead"
end

function Mundo.retirar(uid)
    local servicio = ProjectALife ~= nil and ProjectALife.SpawnService or nil
    if servicio == nil or type(servicio.retire) ~= "function" then return false end
    local ok = pcall(servicio.retire, uid, "narrador")
    return ok
end

-- Clave con la que A-Life identifica a un jugador ("sp:0" en un jugador, el usuario en MP).
function Mundo.claveALife(jugador)
    local rep = ProjectALife ~= nil and ProjectALife.Reputation or nil
    if rep ~= nil and type(rep.playerKey) == "function" then
        local ok, clave = pcall(rep.playerKey, jugador)
        if ok and clave ~= nil then return tostring(clave) end
    end
    return Mundo.nombreJugador(jugador)
end

-- Pone nombre y apellido a un NPC de A-Life y lo deja "presentado" a los jugadores
-- conectados, para que A-Life muestre el nombre y no "Desconocido".
-- Devuelve true si quedo bien (o ya estaba).
function Mundo.nombrarActor(uid, nombre, apellido)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro == nil or type(registro.peek) ~= "function" or type(registro.update) ~= "function" then return false end
    local actual = registro.peek(uid)
    if actual == nil then return false end
    Mundo.arreglarCarnet(uid, nombre, apellido)
    local completo = apellido ~= nil and apellido ~= "" and (nombre .. " " .. apellido) or nombre
    local claves = {}
    for _, p in ipairs(Mundo.jugadores()) do claves[#claves + 1] = Mundo.claveALife(p) end
    local mem = type(actual.memory) == "table" and actual.memory or {}
    local falta = mem.personFirst ~= nombre or mem.personLast ~= apellido or mem.personName ~= completo
    local presentado = type(mem.introducedTo) == "table" and mem.introducedTo or {}
    for _, clave in ipairs(claves) do
        if presentado[clave] ~= true then falta = true end
    end
    if not falta then return true end
    local ok, resultado = pcall(registro.update, uid, actual.revision, function(r)
        r.memory = type(r.memory) == "table" and r.memory or {}
        r.memory.personFirst, r.memory.personLast, r.memory.personName = nombre, apellido, completo
        r.memory.introducedTo = type(r.memory.introducedTo) == "table" and r.memory.introducedTo or {}
        for _, clave in ipairs(claves) do r.memory.introducedTo[clave] = true end
    end)
    return ok and resultado ~= nil
end

-- Refugio del jugador: primero la casa marcada como base en A-Life, despues un refugio
-- reclamado del juego (safehouse, propio o compartido). Devuelve un lugar o nil.
function Mundo.refugioDe(jugador)
    if jugador == nil then return nil end
    local nombre = Mundo.nombreJugador(jugador)
    local limites, fuente
    local director = ProjectALife ~= nil and ProjectALife.SafehouseDirector or nil
    if director ~= nil and type(director.markOf) == "function" and type(director.playerKey) == "function" then
        local ok, casa = pcall(function() return director.markOf(director.playerKey(jugador)) end)
        if ok and type(casa) == "table" and tonumber(casa.x1) ~= nil then limites, fuente = casa, "base" end
    end
    if limites == nil and SafeHouse ~= nil and SafeHouse.getSafehouseList ~= nil then
        pcall(function()
            local lista = SafeHouse.getSafehouseList()
            for i = 0, math.min(lista:size(), 256) - 1 do
                local sh = lista:get(i)
                local miembro = tostring(sh:getOwner()) == nombre
                if not miembro then
                    local jugadores = sh:getPlayers()
                    for j = 0, jugadores:size() - 1 do
                        if tostring(jugadores:get(j)) == nombre then miembro = true end
                    end
                end
                if miembro then
                    limites = { x1 = sh:getX(), y1 = sh:getY(), x2 = sh:getX2(), y2 = sh:getY2(), z = 0 }
                    fuente = "refugio"
                    return
                end
            end
        end)
    end
    if limites == nil then return nil end
    local x1, y1 = tonumber(limites.x1), tonumber(limites.y1)
    local x2, y2 = tonumber(limites.x2) or x1, tonumber(limites.y2) or y1
    local cx = tonumber(limites.cx) or (x1 + x2) / 2
    local cy = tonumber(limites.cy) or (y1 + y2) / 2
    local diagonal = math.sqrt((x2 - x1) ^ 2 + (y2 - y1) ^ 2)
    local etiqueta = Mundo.esServidor() and ("el refugio de " .. nombre) or "tu refugio"
    return { x = floor(cx), y = floor(cy), z = floor(tonumber(limites.z) or 0),
        x1 = x1, y1 = y1, x2 = x2, y2 = y2, radio = math.max(10, floor(diagonal / 2) + 4),
        sala = fuente, etiqueta = etiqueta, dueno = nombre }
end

-- Algun jugador conectado con refugio. Si se pasa uno preferido y tiene, ese.
function Mundo.jugadorConRefugio(preferido)
    if preferido ~= nil and Mundo.refugioDe(preferido) ~= nil then return preferido, Mundo.refugioDe(preferido) end
    local con = {}
    for _, p in ipairs(Mundo.jugadores()) do
        local r = Mundo.refugioDe(p)
        if r ~= nil and Mundo.vivo(p) then con[#con + 1] = { p, r } end
    end
    if #con == 0 then return nil end
    local elegido = con[Mundo.azar(#con)]
    return elegido[1], elegido[2]
end

-- Crea (o actualiza) una faccion propia en A-Life con sus integrantes, usando el mismo
-- sistema que el editor de facciones de A-Life. Queda guardada en la partida y aparece en
-- el editor. postura: "friendly" | "careful" | "neutral" | "hostile" hacia los jugadores.
-- spec = { id, nombre, descripcion, postura, relaciones = { [otraFaccion] = "hostile" },
--          miembros = { { id, nombre, rol, arma, cuerpo, ropa, stats, nombre_al_azar } } }
-- Con spec.rehacer se vuelven a escribir los perfiles aunque ya existan (cambio de version).
function Mundo.crearFaccion(spec)
    local CF = ProjectALife ~= nil and ProjectALife.CustomFactions or nil
    local CP = ProjectALife ~= nil and ProjectALife.CustomProfiles or nil
    local FA = ProjectALife ~= nil and ProjectALife.CustomFactionAuthority or nil
    local PA = ProjectALife ~= nil and ProjectALife.CustomProfileAuthority or nil
    if CF == nil or CP == nil or FA == nil or PA == nil then return false, "A-Life sin editor de facciones" end
    local ok, err = pcall(function()
        local f = CF.blank(spec.id)
        f.general.name = spec.nombre
        f.general.description = spec.descripcion or spec.nombre
        f.spawn.enabled = false
        f.spawn.natural = false
        f.spawn.peaceable = spec.postura ~= "hostile"
        f.relations = { player = spec.postura or "friendly", unknown = spec.desconocidos or "careful" }
        for otra, palabra in pairs(spec.relaciones or {}) do f.relations[otra] = palabra end
        f.memberModules = { flee = "off" }
        local listo, razon = FA.upsert(spec.id, CF.serializeFaction(f))
        if not listo then error("faccion: " .. tostring(razon)) end
        local catalogo = ProjectALife.Catalog
        for _, m in ipairs(spec.miembros or {}) do
            local existe = catalogo ~= nil and type(catalogo.npc) == "function" and catalogo.npc(m.id) ~= nil
            if not existe or spec.rehacer then
                local p = CP.blank(m.id)
                p.general.faction = spec.id
                p.general.name = m.nombre .. (m.rol ~= nil and (" - " .. m.rol) or "")
                p.general.female = m.mujer == true
                if not m.nombre_al_azar then
                    p.general.nameMode = "fixed"
                    p.general.fixedName = m.nombre
                end
                p.general.role = m.rango or "Regular"
                for clave, valor in pairs(m.stats or spec.stats or {}) do p.general[clave] = valor end
                if m.arma ~= nil then p.weapons.primary = m.arma end
                if m.cuerpo ~= nil then p.weapons.melee = m.cuerpo end
                if m.ropa ~= nil then
                    for slot, tipo in pairs(m.ropa) do p.clothing[slot] = tipo; p.outfitSets.A[slot] = tipo end
                end
                -- Color de cada prenda ("r,g,b" de 0 a 1), para las que se pueden tenir.
                for slot, color in pairs(m.tintes or {}) do p.outfitTints.A[slot] = color end
                -- Aspecto: piel (0 a 4), peinado y barba (nombres de hairStyles.xml / beardStyles.xml).
                local a = m.aspecto
                if a ~= nil then
                    if a.piel ~= nil then p.general.skin = a.piel end
                    if a.pelo ~= nil then p.general.hairStyle = a.pelo end
                    if a.color_pelo ~= nil then p.general.hairColor = a.color_pelo end
                    if a.barba ~= nil then p.general.beardStyle = a.barba end
                    if a.color_barba ~= nil then p.general.beardColor = a.color_barba end
                end
                local hecho, razonP = PA.upsert(m.id, CP.serializeProfiles({ p }))
                if not hecho then error("integrante " .. m.id .. ": " .. tostring(razonP)) end
            end
        end
    end)
    if not ok then return false, tostring(err) end
    return true
end

-- ---------------------------------------------------------------------------
-- Banderas de admin de A-Life (inmortal, quieto, correa, vida, dano), cambiables en vivo
-- ---------------------------------------------------------------------------

local function mismasBanderas(a, b)
    if type(a) ~= "table" or type(b) ~= "table" then return false end
    for _, k in ipairs({ "persistent", "invulnerable", "stationary", "health", "damageOutput", "damageReduction" }) do
        if a[k] ~= b[k] then return false end
    end
    local la, lb = a.leash, b.leash
    if (la == nil) ~= (lb == nil) then return false end
    if la ~= nil and (la.radius ~= lb.radius or floor(la.x or 0) ~= floor(lb.x or 0) or floor(la.y or 0) ~= floor(lb.y or 0)) then
        return false
    end
    return true
end

function Mundo.cuerpoActor(uid)
    local vigia = ProjectALife ~= nil and ProjectALife.Watchdog or nil
    local enlace = vigia ~= nil and vigia.bindings ~= nil and vigia.bindings[uid] or nil
    if enlace ~= nil then return enlace.shell, enlace end
    return nil
end

-- Lo mismo que hace el panel de admin de A-Life ("adminActorFlags"): guarda las banderas en
-- la memoria del NPC, las aplica al cuerpo cargado y avisa a los clientes.
-- flags = { invulnerable, stationary, persistent, health, damageOutput, damageReduction, leashRadius }
-- ancla = { x, y, z } centro de la correa (si no, donde esta el NPC).
function Mundo.banderas(uid, flags, ancla)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    local servicio = ProjectALife ~= nil and ProjectALife.DebugService or nil
    if registro == nil or type(registro.peek) ~= "function" or type(registro.update) ~= "function"
            or servicio == nil or type(servicio.normalizeAdminFlags) ~= "function" then return false end
    local actual = registro.peek(uid)
    if actual == nil or actual.lifecycle == "dead" then return false end
    local viejo = type(actual.memory) == "table" and actual.memory.admin or nil
    local okN, nuevas = pcall(servicio.normalizeAdminFlags, flags, ancla or actual.worldPosition, viejo)
    if not okN or type(nuevas) ~= "table" then return false end
    if flags.leashRadius == 0 then nuevas.leash = nil end
    local generacion = actual.generation
    if not mismasBanderas(viejo, nuevas) then
        local ok, actualizado = pcall(registro.update, uid, actual.revision, function(r)
            r.memory = type(r.memory) == "table" and r.memory or {}
            r.memory.admin = nuevas
            r.memory.persistent = (nuevas.persistent == true or r.memory.encounter ~= nil) and true or nil
        end)
        if not ok or actualizado == nil then return false end
        generacion = actualizado.generation
    end
    local cuerpo, enlace = Mundo.cuerpoActor(uid)
    if cuerpo ~= nil and (enlace.generation == nil or enlace.generation == generacion) then
        pcall(function()
            local data = cuerpo:getModData()
            data.ProjectALifeAdminManaged = true
            data.ProjectALifeAdminPersistent = nuevas.persistent == true
            data.ProjectALifeInvulnerable = nuevas.invulnerable == true or nil
            data.ProjectALifeAdminStationary = nuevas.stationary == true or nil
            data.ProjectALifeLeashX = nuevas.leash and nuevas.leash.x or nil
            data.ProjectALifeLeashY = nuevas.leash and nuevas.leash.y or nil
            data.ProjectALifeLeashZ = nuevas.leash and nuevas.leash.z or nil
            data.ProjectALifeLeashRadius = nuevas.leash and nuevas.leash.radius or nil
            local sim = ProjectALife.ShellSimulation
            if nuevas.invulnerable and sim ~= nil then sim.setHealth(cuerpo, sim.maximumFor(cuerpo)) end
        end)
    end
    if type(servicio.pushAdminFlags) == "function" then pcall(servicio.pushAdminFlags, uid, generacion, nuevas) end
    return true
end

-- El carnet (IDcard) que lleva el NPC y el nombre de su cuerpo: que digan su nombre de verdad.
function Mundo.arreglarCarnet(uid, nombre, apellido)
    local cuerpo = Mundo.cuerpoActor(uid)
    if cuerpo == nil or nombre == nil then return false end
    local completo = (apellido ~= nil and apellido ~= "") and (nombre .. " " .. apellido) or nombre
    local cambio = false
    pcall(function()
        local items = cuerpo:getInventory():getItems()
        for i = 0, items:size() - 1 do
            local it = items:get(i)
            local tipo = it ~= nil and tostring(it:getFullType() or "") or ""
            if string.find(tipo, "Base.IDcard", 1, true) == 1 then
                local etiqueta = "Carnet"
                pcall(function() etiqueta = it:getScriptItem():getDisplayName() end)
                local texto = etiqueta .. " (" .. completo .. ")"
                if getText ~= nil then
                    local ok, t = pcall(getText, "IGUI_ItemWithDisplayName", etiqueta, completo)
                    if ok and type(t) == "string" and t ~= "" and t ~= "IGUI_ItemWithDisplayName" then texto = t end
                end
                if it:getName() ~= texto then
                    it:setName(texto)
                    pcall(function() it:setCustomName(true) end)
                    cambio = true
                end
            end
        end
    end)
    pcall(function()
        local d = cuerpo:getDescriptor()
        if d:getForename() ~= nombre then d:setForename(nombre); cambio = true end
        if d:getSurname() ~= (apellido or "") then d:setSurname(apellido or ""); cambio = true end
    end)
    return cambio
end

-- ---------------------------------------------------------------------------
-- Silencio de A-Life: los personajes del Narrador solo dicen lo que escribe el Narrador
-- ---------------------------------------------------------------------------

-- uid -> true. Lo mantiene al dia el motor (NPCs de historias, residentes y misioneros).
Mundo.uidsPropios = Mundo.uidsPropios or {}

function Mundo.silenciarALife()
    local habla = ProjectALife ~= nil and ProjectALife.Speech or nil
    if habla == nil or type(habla.say) ~= "function" or habla._narradorSilencio then return end
    local original = habla.say
    habla.say = function(cuerpo, texto, opciones)
        local uid
        if cuerpo ~= nil and type(habla.variable) == "function" then
            local ok, v = pcall(habla.variable, cuerpo, "ALifeUID")
            if ok and v ~= nil then uid = tostring(v) end
        end
        if uid ~= nil and Mundo.uidsPropios[uid] then return true end
        return original(cuerpo, texto, opciones)
    end
    habla._narradorSilencio = true
end

-- ---------------------------------------------------------------------------
-- Zonas tranquilas: pocos zombis alrededor de un lugar (base de Sous, misioneros)
-- ---------------------------------------------------------------------------

-- Deja como mucho "maximo" zombis dentro del radio. Solo saca los que ningun jugador
-- tiene cerca (a menos de "vista" casillas), para que nadie los vea desaparecer.
function Mundo.limpiarZona(x, y, radio, maximo, vista)
    if getCell == nil or x == nil then return 0 end
    radio, maximo, vista = radio or 40, maximo or 0, vista or 18
    local interop = ProjectALife ~= nil and ProjectALife.Interop or nil
    local quitados = 0
    pcall(function()
        local lista = getCell():getZombieList()
        local dentro = {}
        for i = 0, lista:size() - 1 do
            local z = lista:get(i)
            if z ~= nil and math.abs(z:getX() - x) <= radio and math.abs(z:getY() - y) <= radio then
                local esNpc = interop ~= nil and interop.isNpc ~= nil and interop.isNpc(z)
                if not esNpc then dentro[#dentro + 1] = z end
            end
        end
        local sobran = #dentro - maximo
        if sobran <= 0 then return end
        for _, z in ipairs(dentro) do
            if sobran <= 0 then break end
            if Mundo.jugadorCerca(z:getX(), z:getY(), vista) == nil then
                pcall(function() z:removeFromWorld(); z:removeFromSquare() end)
                sobran, quitados = sobran - 1, quitados + 1
            end
        end
    end)
    return quitados
end

-- Hace que un NPC de A-Life camine con un jugador (la misma postura que "camina conmigo"
-- del menu de A-Life). Hay que renovarlo cada tanto.
function Mundo.acompanar(uid, jugador, horas)
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro == nil or type(registro.peek) ~= "function" or type(registro.update) ~= "function" then return false end
    local clave = Mundo.claveALife(jugador)
    local x, y, z = Mundo.posicion(jugador)
    if clave == nil or x == nil then return false end
    local ahora = Mundo.horas()
    for _ = 1, 3 do
        local actual = registro.peek(uid)
        if actual == nil then return false end
        local ok, r = pcall(registro.update, uid, actual.revision, function(a)
            a.memory = a.memory or {}
            a.memory.walkWith = { key = clave, untilHours = ahora + (horas or 2), startedHours = ahora }
            a.memory.stance, a.memory.stanceAnchor = "walkWith", { x = floor(x), y = floor(y), z = floor(z or 0) }
        end)
        if ok and r ~= nil then return true end
    end
    return false
end

-- Grupo del jugador para los encargos: su faccion del juego (si tiene) o el mismo jugador.
function Mundo.grupoDe(jugador)
    local nombreJugador = Mundo.nombreJugador(jugador)
    local nombre
    if Faction ~= nil and Faction.getPlayerFaction ~= nil then
        local ok, f = pcall(Faction.getPlayerFaction, jugador)
        if not ok or f == nil then ok, f = pcall(Faction.getPlayerFaction, nombreJugador) end
        if ok and f ~= nil then
            local ok2, n = pcall(function() return f:getName() end)
            if ok2 and n ~= nil and n ~= "" then nombre = tostring(n) end
        end
    end
    if nombre ~= nil then return "faccion:" .. nombre, nombre end
    return "jugador:" .. tostring(nombreJugador), tostring(nombreJugador)
end

-- Mapa del pueblo de destino, con marcas (si la version del juego lo permite).
Mundo.MAPAS = {
    ["Muldraugh"] = { "Base.MuldraughMap" }, ["West Point"] = { "Base.WestpointMap" },
    ["Riverside"] = { "Base.RiversideMap" }, ["Rosewood"] = { "Base.RosewoodMap" },
    ["March Ridge"] = { "Base.MarchRidgeMap" }, ["Louisville"] = { "Base.LouisvilleMap1", "Base.LouisvilleMap2" },
    ["Valley Station"] = { "Base.ValleyStationMap" }, ["Brandenburg"] = { "Base.BrandenburgMap" },
    ["Ekron"] = { "Base.EkronMap" }, ["Irvington"] = { "Base.IrvingtonMap" }, ["Echo Creek"] = { "Base.EchoCreekMap" },
    ["Fallas Lake"] = { "Base.FallasLakeMap" },
}

-- A-Life, al cargar el cuerpo de un NPC, "repara" los usos de sus objetos y manda los datos a
-- los clientes con sendItemStats. Si el objeto todavia no esta en ningun contenedor con casilla,
-- Java tira un error, la carga del NPC se corta a la mitad y queda un zombi comun en su lugar
-- (le paso al Cabo Ramiro). Aca la reparacion queda protegida: si falla el envio, el NPC
-- igual termina de cargarse.
function Mundo.protegerReparacionALife()
    local U = ProjectALife ~= nil and ProjectALife.ItemUses or nil
    if type(U) ~= "table" or type(U.repair) ~= "function" or U._narradorProtegido then return end
    local original = U.repair
    U.repair = function(item, ...)
        local ok, resultado = pcall(original, item, ...)
        return ok and resultado or false
    end
    U._narradorProtegido = true
end

pcall(Mundo.protegerReparacionALife)
if Events ~= nil and Events.OnServerStarted ~= nil then
    Events.OnServerStarted.Add(function() pcall(Mundo.protegerReparacionALife) end)
end


-- Quien mato a un NPC segun A-Life, cuando el evento de muerte llega sin asesino (pasa en MP:
-- el cliente que maneja al NPC reporta la muerte y el servidor lo mata con "server_kill").
-- Devuelve el jugador (IsoPlayer) o nil.
function Mundo.asesinoALife(cuerpo)
    local KA = ProjectALife ~= nil and ProjectALife.KillAttribution or nil
    if KA == nil or type(KA.peek) ~= "function" or cuerpo == nil then return nil end
    local ok, tipo, clave, _, _, asesino = pcall(KA.peek, cuerpo)
    if not ok or tipo ~= "player" then return nil end
    if asesino ~= nil and Mundo.esJugador(asesino) then return asesino end
    for _, p in ipairs(Mundo.jugadores()) do
        if Mundo.claveALife(p) == tostring(clave) then return p end
    end
    return nil
end

-- A-Life deja hostil a toda una faccion amistosa con el jugador que dana o mata a uno de sus
-- NPCs. Para las facciones de la historia (Narrador.Facciones) eso cuenta como traicion: se
-- avisa al motor, que corta las misiones de esa faccion (Motor.traicionFaccion).
function Mundo.engancharReputacion()
    local R = ProjectALife ~= nil and ProjectALife.Reputation or nil
    if type(R) ~= "table" or type(R.escalate) ~= "function" or R._narradorEnganchado then return end
    local original = R.escalate
    R.escalate = function(player, actorOrFaction, deed, ...)
        local ok, razon = original(player, actorOrFaction, deed, ...)
        if ok == true then
            pcall(function()
                local faccion = type(actorOrFaction) == "string" and actorOrFaction
                    or (type(actorOrFaction) == "table" and actorOrFaction.factionId) or nil
                if faccion == nil then
                    local data = actorOrFaction:getModData()
                    faccion = data.ProjectALifeFactionId
                    if faccion == nil and data.ProjectALifeUID ~= nil then
                        local a = Mundo.actor(data.ProjectALifeUID)
                        faccion = a ~= nil and a.factionId or nil
                    end
                end
                local Motor = Narrador.Motor
                if faccion ~= nil and Narrador.Facciones ~= nil and Narrador.Facciones[faccion] ~= nil
                        and Motor ~= nil and Motor.traicionFaccion ~= nil then
                    Motor.traicionFaccion(faccion, player, deed)
                end
            end)
        end
        return ok, razon
    end
    R._narradorEnganchado = true
end

pcall(Mundo.engancharReputacion)
if Events ~= nil and Events.OnServerStarted ~= nil then
    Events.OnServerStarted.Add(function() pcall(Mundo.engancharReputacion) end)
end


-- Borra la enemistad que A-Life guardo de los jugadores con una faccion (por haber danado o
-- matado a uno de los suyos), y la de los NPCs vivos de la lista uids. Se usa cuando la
-- historia vuelve a poner a esa faccion como amiga o un admin repone sus NPCs.
function Mundo.perdonarFaccion(faccion, uids)
    local R = ProjectALife ~= nil and ProjectALife.Reputation or nil
    local estado = R ~= nil and R.storage or nil
    local cambio = false
    if type(estado) == "table" and type(estado.players) == "table" then
        for _, porFaccion in pairs(estado.players) do
            if type(porFaccion) == "table" and porFaccion[faccion] ~= nil then
                porFaccion[faccion] = nil
                cambio = true
            end
        end
    end
    if cambio then
        R.dirty = true
        for _, p in ipairs(Mundo.jugadores()) do pcall(R.sync, p) end
    end
    local registro = ProjectALife ~= nil and ProjectALife.ActorRegistry or nil
    if registro ~= nil and type(registro.peek) == "function" and type(registro.update) == "function" then
        for _, uid in ipairs(uids or {}) do
            local a = registro.peek(uid)
            if a ~= nil then
                pcall(registro.update, uid, a.revision, function(r)
                    if type(r.memory) == "table" then
                        r.memory.hostileToPlayerKeys, r.memory.hostileAct, r.memory.hitByAt = nil, nil, nil
                    end
                end)
            end
        end
    end
    return cambio
end
