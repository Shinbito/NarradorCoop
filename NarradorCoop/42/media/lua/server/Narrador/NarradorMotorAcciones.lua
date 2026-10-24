-- Narrador Co-op: motor de arcos, acciones.
-- Las acciones de las etapas: inmediatas (al tiro) y diferidas (cuando el lugar esta cargado).
-- Parte de NarradorMotor.lua, que lo carga al final (no se carga solo).
-- Textos sin tildes a proposito.

if isClient ~= nil and isClient() then return end
if Narrador == nil or Narrador.Motor == nil or Narrador.Motor._partes == nil then return end
if Narrador.Motor._partes.acciones then return end
Narrador.Motor._partes.acciones = true

local Defs, Mundo, Motor = Narrador.Defs, Narrador.Mundo, Narrador.Motor
local floor = math.floor
local grupo = Motor.grupoArco

-- ---------------------------------------------------------------------------
-- Acciones
-- ---------------------------------------------------------------------------

-- Punto de referencia de una accion: un lugar del arco, "jugador" (uno al azar, ahora mismo)
-- o coordenadas explicitas.
function Motor.lugarDe(inst, accion)
    if accion.x ~= nil and accion.y ~= nil then
        return { x = accion.x, y = accion.y, z = accion.z or 0, etiqueta = "ahi" }
    end
    local id = accion.lugar
    if id == "jugador" then
        local j = Mundo.jugadorAlAzar()
        if j == nil then return nil end
        local x, y, z = Mundo.posicion(j)
        return { x = x, y = y, z = z or 0, etiqueta = "tu zona", jugador = j }
    end
    if id == "aviso" then
        -- Donde aparece un mensajero: el refugio (del que inicio el arco o de cualquiera)
        -- o, si nadie tiene, cerca de un jugador.
        if inst.lugares.aviso ~= nil then return inst.lugares.aviso end
        local preferido
        for _, p in ipairs(Mundo.jugadores()) do
            if Mundo.nombreJugador(p) == inst.refNombre then preferido = p end
        end
        local _, refugio = Mundo.jugadorConRefugio(preferido)
        if refugio ~= nil then
            inst.lugares.aviso = Motor.copiar(refugio)
            return inst.lugares.aviso
        end
        local j = preferido or Mundo.jugadorAlAzar()
        if j == nil then return nil end
        local x, y, z = Mundo.posicion(j)
        local angulo = (Mundo.azar(360) / 180) * math.pi
        return { x = floor(x + math.cos(angulo) * 22), y = floor(y + math.sin(angulo) * 22), z = z or 0,
            etiqueta = "cerca de ustedes", jugador = j, temporal = true }
    end
    if id == nil or id == "ref" then
        return { x = inst.refX, y = inst.refY, z = 0, etiqueta = "los alrededores" }
    end
    return inst.lugares[id]
end

function Motor.retirarGrupo(inst, id)
    local g = grupo(inst, id)
    if g == nil then return end
    for uid, m in pairs(g.miembros) do
        if m.vivo then
            Mundo.retirar(uid)
            m.vivo, m.retirado, m.causa = false, true, "retirado"
        end
    end
end

function Motor.transformar(inst, accion)
    local rol = Motor.valor(inst, accion.rol)
    local g = grupo(inst, accion.grupo)
    if g == nil or rol == nil then return true end
    local uid = g.roles[tostring(rol)]
    local m = uid ~= nil and g.miembros[uid] or nil
    if m == nil or not m.vivo then return true end
    local x, y, z = Mundo.posicionActor(uid)
    Mundo.retirar(uid)
    m.vivo, m.retirado, m.causa = false, true, "transformado"
    if x == nil then return true end
    -- Donde quedo el zombi (para que otro de la historia lo remate, ver "bell_rematar").
    inst.vars.transformado_x, inst.vars.transformado_y, inst.vars.transformado_z = floor(x), floor(y), floor(z or 0)
    local femenino = m.femenino == true
    if Mundo.cargado(x, y, z) ~= nil and Mundo.jugadorCerca(x, y, 60) ~= nil then
        Mundo.zombiEn(x, y, z, femenino)
    else
        Motor.diferir(inst, { "zombi_en", x = floor(x), y = floor(y), z = floor(z or 0), femenino = femenino })
    end
    return true
end

function Motor.diferir(inst, accion)
    local p = Motor.copiar(accion)
    local st = Motor.estado()
    st.secuencia = st.secuencia + 1
    p.seq, p.fallos, p.listo = st.secuencia, nil, nil
    if accion.retraso ~= nil then p.listo = Mundo.horas() + (tonumber(accion.retraso) or 0) end
    inst.pendientes[#inst.pendientes + 1] = p
    return true
end

-- Acciones que se hacen al tiro, no necesitan que el lugar este cargado.
Motor.inmediatas = {
    lugar = function(inst, a)
        -- Lugar ya elegido de antes (por ejemplo, el del rumor que se escucho): se respeta.
        if inst.lugares[a.id] ~= nil and inst.lugares[a.id].prefijado then return true end
        local desde = a.desde ~= nil and inst.lugares[a.desde] or nil
        local x, y = inst.refX, inst.refY
        if desde ~= nil then x, y = desde.x, desde.y end
        local l = Mundo.buscarLugar(a, x, y)
        if l == nil then
            -- Sin lugar: si el arco ya tiene otro, usar ese para no trabar la historia.
            for _, otro in pairs(inst.lugares) do
                inst.lugares[a.id] = Motor.copiar(otro)
                Mundo.log("sin lugar para '" .. tostring(a.id) .. "' en " .. inst.id .. ", se reutiliza otro")
                return true
            end
            return false, "no se encontro un lugar para '" .. tostring(a.id) .. "'"
        end
        inst.lugares[a.id] = l
        return true
    end,
    lugar_jugador = function(inst, a)
        local j = Mundo.jugadorAlAzar()
        if j == nil then return false, "sin jugadores" end
        local x, y, z = Mundo.posicion(j)
        local pueblo = Mundo.puebloCercano(x, y)
        inst.lugares[a.id] = { x = floor(x), y = floor(y), z = floor(z or 0),
            etiqueta = pueblo ~= nil and ("los alrededores de " .. pueblo.label) or "tu zona" }
        return true
    end,
    -- El refugio del jugador que dio origen al arco (o de cualquiera que tenga uno).
    lugar_refugio = function(inst, a)
        local preferido
        for _, p in ipairs(Mundo.jugadores()) do
            if Mundo.nombreJugador(p) == inst.refNombre then preferido = p end
        end
        local _, refugio = Mundo.jugadorConRefugio(preferido)
        if refugio == nil then return false, "nadie tiene un refugio reclamado" end
        inst.lugares[a.id] = refugio
        return true
    end,
    decir = function(inst, a)
        Motor.decir(inst, a.grupo, a.rol, a.texto)
        return true
    end,
    -- Guarda un lugar en la memoria de la partida para que otro capitulo lo reuse.
    memoria_lugar = function(inst, a)
        local l = inst.lugares[a.lugar]
        if l ~= nil then Motor.estado().memoria["lugar." .. a.clave] = Motor.copiar(l) end
        return true
    end,
    -- Recupera un lugar guardado por otro capitulo; si no existe, lo busca como "lugar".
    -- {"lugar_base_sous", id, ...}: la base fija de Sous del pueblo mas cercano a quien empezo
    -- la historia (Narrador.SousBases). Si no hay una para ese pueblo, busca como "lugar".
    lugar_base_sous = function(inst, a)
        local pueblo = inst.refX ~= nil and Mundo.puebloCercano(inst.refX, inst.refY) or nil
        local b = pueblo ~= nil and Narrador.SousBases ~= nil and Narrador.SousBases[pueblo.label] or nil
        if b == nil then return Motor.inmediatas.lugar(inst, a) end
        inst.lugares[a.id] = { x = b.x, y = b.y, z = b.z or 0, etiqueta = b.etiqueta, sala = "warehouse" }
        return true
    end,
    lugar_memoria = function(inst, a)
        local l = Motor.estado().memoria["lugar." .. tostring(a.clave)]
        if type(l) == "table" then
            inst.lugares[a.id] = Motor.copiar(l)
            return true
        end
        return Motor.inmediatas.lugar(inst, a)
    end,
    -- Crea o actualiza una faccion propia en A-Life (ver Narrador.Facciones) y su postura.
    faccion = function(inst, a)
        local spec = Narrador.Facciones ~= nil and Narrador.Facciones[a.id] or nil
        if spec == nil then Mundo.log("faccion desconocida: " .. tostring(a.id)); return true end
        local copia = Motor.copiar(spec)
        copia.postura = a.postura or copia.postura
        -- Si cambio la version de la faccion (stats, ropa...), se reescriben los perfiles.
        local st = Motor.estado()
        local claveVer = "faccion_ver." .. a.id
        copia.rehacer = st.memoria[claveVer] ~= (spec.version or 1)
        local ok, razon = Mundo.crearFaccion(copia)
        if ok then st.memoria[claveVer] = spec.version or 1 end
        if not ok then Mundo.log("no se pudo crear la faccion " .. tostring(a.id) .. ": " .. tostring(razon)) end
        Motor.estado().memoria["faccion." .. a.id] = copia.postura
        -- Si la historia la vuelve amiga, se olvida la enemistad que A-Life guardo por golpes.
        if copia.postura ~= "hostile" and Mundo.perdonarFaccion ~= nil then pcall(Mundo.perdonarFaccion, a.id) end
        return true
    end,
    -- Habla el contacto de la ciudad que dio el encargo.
    decir_contacto = function(inst, a)
        local C = Narrador.Contactos
        if C ~= nil then C.decir(inst.vars.contacto, Motor.texto(inst, a.texto)) end
        return true
    end,
    -- Deja anotado que hay que abrir otra historia (capitulo siguiente). El director la
    -- inicia apenas pueda, sin respetar los tiempos entre eventos.
    abrir = function(inst, a)
        local st = Motor.estado()
        st.porAbrir[#st.porAbrir + 1] = { def = a.def, listo = Mundo.horas() + (tonumber(a.horas) or 0), desde = inst.def }
        return true
    end,
    -- Un mensajero trae la noticia (en vez de la radio). Aparece en el refugio o cerca de
    -- un jugador; cuando alguien se le acerca, entrega el mensaje solo.
    mensajero = function(inst, a)
        local texto = a.texto
        if inst.vars.rumor_seguido == true then
            local base = Motor.resolverTexto(inst, texto)
            texto = "Ya te habras enterado, no? Lo andan diciendo por todos lados. " .. tostring(base)
        end
        inst.mensaje = { texto = texto, diario = a.diario, nota = a.nota, entregado = false,
            llegada = a.llegada }
        local perfiles = Motor.PERFILES_MENSAJERO
        local perfil = a.perfil ~= nil and Motor.valor(inst, a.perfil) or nil
        if perfil == nil then perfil = perfiles[Mundo.azar(#perfiles)] end
        Motor.diferir(inst, { "npcs", id = "mensajero", lugar = "aviso", radio = 70, no_mas_cerca = 12,
            modo = "guard", quietos = true, correa = 2, inmortales = true, postura = "friendly",
            perfiles = { { "mensajero", perfil } },
            nombres = a.nombre ~= nil and { mensajero = { a.nombre[1], a.nombre[2] } } or nil })
        return true
    end,
    residentes = function(inst, a) return Motor.hacerResidentes(inst, a) end,
    -- Cambia en vivo las banderas de un grupo: {"banderas", grupo = "sous", inmortales = false}.
    -- Queda guardado en el grupo, asi el repaso periodico no lo deshace.
    banderas = function(inst, a)
        local g = inst.grupos[a.grupo]
        if g == nil then return true end
        g.accion = g.accion or {}
        for _, k in ipairs({ "inmortales", "quietos", "correa", "banderas" }) do
            if a[k] ~= nil then g.accion[k] = a[k] end
        end
        if a.inmortales == false then g.accion.mortales = true end
        Motor.banderasGrupo(inst, g)
        return true
    end,
    -- Entrega un mapa con la zona de un lugar: {"mapa", lugar = "escondite"}.
    mapa = function(inst, a) Motor.darMapaZona(inst, a.lugar, a); return true end,
    -- Un punto a unos metros de otro lugar del arco (para que un grupo llegue "al lado").
    lugar_cerca = function(inst, a)
        local base = inst.lugares[a.de]
        if base == nil then return false, "sin lugar base para '" .. tostring(a.id) .. "'" end
        local d = tonumber(a.distancia) or 20
        inst.lugares[a.id] = { x = base.x + d, y = base.y + floor(d / 2), z = base.z or 0,
            etiqueta = "cerca de " .. tostring(base.etiqueta) }
        return true
    end,
    -- Cuenta quien murio de un grupo. Deja variables (bajas, bajas_nombres, murio_<rol>,
    -- testigo, lider_*) y lo anota en la memoria de la partida con el prefijo dado.
    contar_bajas = function(inst, a)
        local st = Motor.estado()
        local prefijo = a.memoria or "bajas"
        local g = inst.grupos[a.grupo]
        local nombres, vivos, n = {}, {}, 0
        if g ~= nil then
            for _, m in pairs(g.miembros) do
                if not m.vivo and not m.retirado then
                    n = n + 1
                    nombres[#nombres + 1] = Motor.nombreCompleto(g, m)
                    inst.vars["murio_" .. m.rol] = true
                    st.memoria[prefijo .. "_murio_" .. m.rol] = true
                elseif m.vivo or m.retirado then
                    vivos[#vivos + 1] = Motor.nombreCompleto(g, m)
                end
            end
        end
        table.sort(nombres)
        table.sort(vivos)
        inst.vars.bajas = n
        inst.vars.hubo_bajas = n > 0
        inst.vars.bajas_nombres = #nombres > 0 and table.concat(nombres, ", ") or "nadie"
        inst.vars.testigo = vivos[1]
        for _, par in ipairs(a.lider_orden or {}) do
            if st.memoria[prefijo .. "_murio_" .. par[1]] ~= true then
                inst.vars.lider_rol, inst.vars.lider_perfil, inst.vars.lider_nombre = par[1], par[2], par[3]
                st.memoria[prefijo .. "_lider"] = par[1]
                st.memoria[prefijo .. "_lider_perfil"] = par[2]
                st.memoria[prefijo .. "_lider_nombre"] = par[3]
                break
            end
        end
        return true
    end,
    aviso = function(inst, a) Motor.avisar(inst, Motor.texto(inst, a.texto)); return true end,
    diario = function(inst, a) Motor.anotar(inst, Motor.texto(inst, a.texto)); return true end,
    reloj = function(inst, a)
        local horas = Motor.cantidad(Motor.valor(inst, a.horas), 24)
        inst.relojes[a.id] = { vence = Mundo.horas() + horas, activo = true, total = horas }
        return true
    end,
    detener_reloj = function(inst, a)
        if inst.relojes[a.id] ~= nil then inst.relojes[a.id].activo = false end
        return true
    end,
    -- {"memoria", clave, valor, si_vacia}: la clave acepta {var} ("cura_{contacto}"). Con
    -- si_vacia = true no pisa lo que ya habia.
    memoria = function(inst, a)
        local clave, st = Motor.texto(inst, a.clave), Motor.estado()
        if a.si_vacia and st.memoria[clave] ~= nil then return true end
        st.memoria[clave] = Motor.valor(inst, a.valor)
        return true
    end,
    variable = function(inst, a)
        inst.vars[a.nombre] = Motor.valor(inst, a.valor)
        return true
    end,
    retirar = function(inst, a) Motor.retirarGrupo(inst, a.grupo); return true end,
    transformar = function(inst, a) return Motor.transformar(inst, a) end,
}

-- Acciones que esperan a que un jugador este cerca y el lugar este cargado.
-- Tamano de una horda segun el avance de la partida: de "minimo" el dia 3 a "maximo" el dia
-- 30, mas 5 por cada campamento de misionero fundado. Nunca pasa del maximo.
Motor.HORDA_DIAS = { 3, 30 }
function Motor.tamanoHorda(minimo, maximo)
    minimo, maximo = tonumber(minimo) or 25, tonumber(maximo) or 100
    local dia = Mundo.horas() / 24
    local avance = (dia - Motor.HORDA_DIAS[1]) / (Motor.HORDA_DIAS[2] - Motor.HORDA_DIAS[1])
    avance = math.max(0, math.min(1, avance))
    local campamentos = 0
    for clave, valor in pairs(Motor.estado().memoria or {}) do
        if type(clave) == "string" and string.sub(clave, 1, 11) == "campamento_" and valor == "fundado" then
            campamentos = campamentos + 1
        end
    end
    return math.min(maximo, floor(minimo + (maximo - minimo) * avance + 5 * campamentos + 0.5))
end

Motor.diferidas = {
    -- Opciones extra:
    --   fija = true: sin la escala del arco ni el descuento del rumor (cantidad exacta).
    --   por_jugador = n: suma n por cada jugador cerca del lugar despues del primero.
    --   caminantes = true: ningun corredor en esta oleada.
    --   meta = "var", meta_frac = 0.8: deja en inst.vars[meta] cuantos hay que matar.
    --   planta_baja = true: en el piso de la calle (z = 0).
    --   correr = true: todos corredores (sprinters).
    --   al_jugador = true: aparecen al tiro alrededor del lugar (entre min y max casillas, fuera
    --     de la vista) y van directo a donde esta el jugador, con un ruido para que no se pierdan.
    oleada = function(inst, p, l, jugador)
        local n = Motor.cantidad(p.cantidad, 12)
        -- progreso = { min, max }: crece con los dias y los campamentos (ver Motor.tamanoHorda).
        if type(p.progreso) == "table" then n = Motor.tamanoHorda(p.progreso[1], p.progreso[2]) end
        if not p.fija then
            n = n * (tonumber(inst.vars.escala) or 1)
            -- Si siguieron el rumor, llegaron preparados: menos muertos.
            if inst.vars.rumor_seguido == true then n = n * 0.7 end
        end
        if tonumber(p.por_jugador) ~= nil then
            local cerca = 0
            for _, j in ipairs(Mundo.jugadores()) do
                local x, y = Mundo.posicion(j)
                if Mundo.vivo(j) and x ~= nil and math.sqrt((x - l.x) ^ 2 + (y - l.y) ^ 2) <= 120 then cerca = cerca + 1 end
            end
            n = n + tonumber(p.por_jugador) * math.max(0, cerca - 1)
        end
        -- planta_baja: aparecen en la calle aunque el lugar este en un segundo piso.
        local z = p.planta_baja and 0 or l.z
        local opciones = { caminantes = p.caminantes, correr = p.correr == true }
        if p.al_jugador and jugador ~= nil then
            local jx, jy, jz = Mundo.posicion(jugador)
            if jx ~= nil then
                z = 0
                opciones.destino, opciones.ruido = { x = jx, y = jy, z = jz or 0 }, true
            end
        end
        local total = Mundo.oleada(l.x, l.y, z, math.max(1, floor(n + 0.5)), p.min, p.max, opciones)
        if p.meta ~= nil then inst.vars[p.meta] = math.max(1, floor(total * (tonumber(p.meta_frac) or 1))) end
        return true
    end,
    -- {"ruido", lugar, radio, volumen, veces}: un ruido fuerte que atrae a los zombis hacia el
    -- lugar (como una alarma). Se repite unas veces para que la horda no se disperse.
    ruido = function(inst, p, l)
        if addSound == nil then return true end
        local radio, volumen = tonumber(p.radio) or 150, tonumber(p.volumen) or 100
        for _ = 1, math.max(1, tonumber(p.veces) or 3) do
            pcall(addSound, nil, floor(l.x), floor(l.y), floor(l.z or 0), radio, volumen)
        end
        return true
    end,
    -- {"quitar_zombis", lugar, radio}: saca los zombis que ya habia alrededor del lugar (no
    -- los NPCs de A-Life), para que queden solo los que pone la historia.
    quitar_zombis = function(inst, p, l)
        local n = Mundo.quitarZombis(l.x, l.y, tonumber(p.radio) or 35)
        Mundo.log(inst.id .. ": se quitaron " .. tostring(n) .. " zombis en " .. floor(l.x) .. "," .. floor(l.y))
        return true
    end,
    objeto = function(inst, p, l)
        local item = Mundo.crearItem(p.tipo)
        if item == nil then Mundo.log("no existe el item " .. tostring(p.tipo)); return true end
        Mundo.nombrar(item, p.nombre ~= nil and Motor.texto(inst, p.nombre) or nil, inst.id .. ":" .. tostring(p.id))
        return Mundo.dejarEnSuelo(l.x, l.y, l.z, item)
    end,
    nota = function(inst, p, l)
        local nota = Mundo.crearNota(Motor.texto(inst, p.titulo or "Nota"), Motor.texto(inst, p.texto))
        return Mundo.dejarEnSuelo(l.x, l.y, l.z, nota)
    end,
    recompensa = function(inst, p, l)
        for _, tipos in ipairs(p.items or {}) do
            local item = Mundo.crearItem(tipos)
            if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        end
        return true
    end,
    -- Botin segun la dificultad del encargo, con chance chica de un arma "chetada".
    recompensa_nivel = function(inst, p, l)
        local L = Narrador.Legendario
        local nivel = tostring(inst.vars.nivel or "facil")
        for _, tipos in ipairs(Motor.BOTIN[nivel] or Motor.BOTIN.facil) do
            local item = Mundo.crearItem(tipos)
            if item ~= nil then Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        end
        local chance = Motor.CHANCE_CHETADA[nivel] or 0
        local R = Narrador.Reputacion
        if R ~= nil and chance > 0 then chance = chance + R.bonusChetada(inst.vars.dueno, inst.vars.contacto) end
        chance = chance + (tonumber(inst.vars.chetada_extra) or 0)
        if L ~= nil and chance > 0 and Mundo.azar(100) <= chance then
            for _, item in ipairs(L.crear("arma", "chetada")) do Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
            Motor.avisar(inst, "Entre el pago viene algo especial: un arma en un estado increible.")
        end
        return true
    end,
    legendario = function(inst, p, l)
        local L = Narrador.Legendario
        if L == nil then return true end
        if p.clase == "auto" then return L.crearAuto(l.x, l.y, l.z) end
        -- clase = "fuego": el arsenal de armas de fuego con nombre (cantidad = cuantas, todas si no).
        for _, item in ipairs(L.crear(p.clase, "legendaria", p.cantidad)) do Mundo.dejarEnSuelo(l.x, l.y, l.z, item) end
        return true
    end,
    zombi_en = function(inst, p, l)
        Mundo.zombiEn(l.x, l.y, l.z, p.femenino)
        return true
    end,
    -- Varias pastillas K-93 iguales; "reales" de ellas son las verdaderas: un numero, un rango
    -- { min, max } o "var:x" true/false (1 o 0). Las verdaderas van en posiciones distintas.
    pastillas = function(inst, p, l)
        local n = Motor.cantidad(p.cantidad, 4)
        local reales = p.reales
        if reales == true then reales = 1 elseif reales == false or reales == nil then reales = 0 end
        reales = math.min(Motor.cantidad(reales, 0), n)
        local orden = {}
        for i = 1, n do orden[i] = i end
        local cual = {}
        for i = 1, reales do
            local j = i + Mundo.azar(n - i + 1) - 1
            orden[i], orden[j] = orden[j], orden[i]
            cual[orden[i]] = true
        end
        for i = 1, n do
            local item = Mundo.crearItem({ "Narrador.CuraZ", "Base.Pills" })
            if item ~= nil then
                Mundo.nombrar(item, p.nombre ~= nil and Motor.texto(inst, p.nombre) or nil, inst.id .. ":" .. tostring(p.id))
                Mundo.marcarPastilla(item, cual[i] == true)
                Mundo.dejarEnSuelo(l.x, l.y, l.z, item)
            end
        end
        return true
    end,
    corredores = function(inst, p, l)
        local n = Motor.cantidad(p.cantidad, 6) * (tonumber(inst.vars.escala) or 1)
        Mundo.corredores(l.x, l.y, l.z, math.max(1, floor(n + 0.5)), p.min, p.max)
        return true
    end,
    npcs = function(inst, p, l, jugador) return Motor.pedirGrupo(inst, p, l, jugador) end,
    bandidos = function(inst, p, l, jugador)
        p.hostiles = true
        return Motor.pedirGrupo(inst, p, l, jugador)
    end,
}

-- Campos de primer nivel escritos como "var:nombre" toman el valor de la variable del arco
-- (asi un mismo arco sirve para encargos generados: cantidades, salas, textos...).
function Motor.resolverVars(inst, accion)
    local copia
    for k, v in pairs(accion) do
        if k ~= 1 and type(v) == "string" and string.sub(v, 1, 4) == "var:" then
            copia = copia or Motor.copiarPlano(accion)
            copia[k] = inst.vars[string.sub(v, 5)]
        end
    end
    return copia or accion
end

function Motor.copiarPlano(t)
    local c = {}
    for k, v in pairs(t) do c[k] = v end
    return c
end

function Motor.ejecutar(inst, accion)
    if type(accion) ~= "table" or type(accion[1]) ~= "string" then return true end
    if accion.si ~= nil and not Motor.cumple(inst, accion.si) then return true end
    accion = Motor.resolverVars(inst, accion)
    local tipo = accion[1]
    if tipo == "retirar_lejos" or tipo == "retirar_miembros" or Motor.diferidas[tipo] ~= nil then
        return Motor.diferir(inst, accion)
    end
    local f = Motor.inmediatas[tipo]
    if f == nil then
        Mundo.log("accion desconocida: " .. tostring(tipo))
        return true
    end
    if accion.retraso ~= nil then return Motor.diferir(inst, accion) end
    local ok, resultado, razon = pcall(f, inst, accion)
    if not ok then
        Mundo.log("error en accion " .. tipo .. " de " .. inst.id .. ": " .. tostring(resultado))
        return true
    end
    return resultado, razon
end
