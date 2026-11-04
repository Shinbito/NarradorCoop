-- Prueba: los vecinos de los encargos (NarradorVidas.lua). Los 100 secundarios cargan con sus
-- textos; el generador arma vidas para todas las combinaciones de sexo, edad, oficio y pueblo sin
-- quedarse sin camino; los textos salen sin marcadores, sin tildes y dentro de los largos; las
-- guerras cuadran con la edad; y un cliente con historia la cuenta de a poco en tres encargos y
-- despues se muda. Se corre con herramientas/pruebas/correr.py.

local Mundo, Motor, V, G, C = Narrador.Mundo, Narrador.Motor, Narrador.Vidas, Narrador.Generador, Narrador.Contactos
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
local semilla = 20260709
Mundo.azar = function(n)
    semilla = (semilla * 1103515245 + 12345) % 2147483648
    return math.floor(semilla / 65536) % math.max(1, n) + 1
end
Mundo.horas = function() return 100 end
Mundo.log = function() end
local diario, dichos = {}, {}
Motor.enviar = function(_, cmd, d) if cmd == "diario" then diario[#diario + 1] = d.texto end end
Motor.publicar = function() end
C.decir = function(_, t) dichos[#dichos + 1] = t end

local function limpio(s, maximo)
    if type(s) ~= "string" or s == "" then return false, "vacio" end
    if string.find(s, "[{}]") then return false, "marcador sin reemplazar" end
    if string.find(s, "[\128-\255]") then return false, "fuera de ASCII" end
    if maximo ~= nil and #s > maximo then return false, #s .. " caracteres" end
    return true
end

print("1. los 100 secundarios")
local D = Narrador.VidasDatos
check(#D.SECUNDARIOS == 100, "100 secundarios (" .. #D.SECUNDARIOS .. ")")
for _, pueblo in ipairs(V.PUEBLOS) do
    local n = #V.secundariosDe(pueblo)
    check(n >= 15, pueblo .. ": " .. n .. " vecinos hechos a mano")
end
local malos = 0
for _, s in ipairs(D.SECUNDARIOS) do
    for _, k in ipairs({ "llegada", "rescate", "gracias", "revelacion1", "revelacion2", "revelacion3",
        "diario_conocer", "diario_final", "mudanza", "muerte" }) do
        local ok, por = limpio(s.textos[k])
        if not ok then malos = malos + 1; print("     " .. s.id .. "." .. k .. ": " .. por) end
    end
end
check(malos == 0, "textos de los secundarios limpios")

if not V.hayPiezas() then
    print("  (sin piezas: se salta el generador)")
else
    print("2. ninguna combinacion se queda sin camino")
    local sinCamino, total, maxPasos = 0, 0, 0
    local ejemplos = {}
    for _, sexo in ipairs({ "h", "m" }) do
        for edad = 18, 85, 1 do
            for _, oficio in ipairs(V.OFICIOS) do
                for _, pueblo in ipairs(V.PUEBLOS) do
                  if edad >= ((D.EDAD_MIN_OFICIO or {})[oficio] or 18) then
                    total = total + 1
                    local el, _, pasos = V.recorrer({ sexo = sexo, edad = edad, oficio = oficio, pueblo = pueblo })
                    maxPasos = math.max(maxPasos, pasos or 0)
                    if el == nil then
                        sinCamino = sinCamino + 1
                        if #ejemplos < 12 then ejemplos[#ejemplos + 1] = sexo .. " " .. edad .. " " .. oficio .. " " .. pueblo end
                    end
                  end
                end
            end
        end
    end
    for _, e in ipairs(ejemplos) do print("     sin camino: " .. e) end
    check(sinCamino == 0, "combinaciones con camino: " .. (total - sinCamino) .. " de " .. total .. " (maximo " .. maxPasos .. " piezas probadas)")

    print("3. tres mil vidas: textos limpios y guerras con la edad que corresponde")
    local LARGOS = { llegada = 140, rescate = 140, gracias = 140, muerte = 160, revelacion1 = 230, revelacion2 = 230,
        revelacion3 = 250, diario_conocer = 180, diario_final = 180, mudanza = 1300 }
    local GUERRAS = { veterano_wwii = { 66, 99 }, veterano_corea = { 57, 99 }, veterano_vietnam = { 37, 62 } }
    local malTexto, malGuerra, nulas, usadas, lazos = 0, 0, 0, {}, 0
    for i = 1, 3000 do
        local vida = V.armar({})
        if vida == nil then
            nulas = nulas + 1
        else
            local of = vida.oficio
            local tx = V.textosDe({ sexo = vida.sexo, nombre = "Prueba", vida = vida }, "la " .. of, vida.pueblo)
            for k, maximo in pairs(LARGOS) do
                local ok, por = limpio(tx[k], maximo)
                if not ok then
                    malTexto = malTexto + 1
                    if malTexto <= 6 then print("     " .. k .. " (" .. tostring(vida.piezas[k] or "") .. "): " .. por) end
                end
            end
            local _, et = nil, {}
            for _, id in pairs(vida.piezas) do
                usadas[id] = true
                local p = V.pieza(id)
                if p.lazo ~= nil then lazos = lazos + 1 end
                for _, t in ipairs(p.da or {}) do et[t] = id end
            end
            for t, r in pairs(GUERRAS) do
                if et[t] ~= nil and (vida.edad < r[1] or vida.edad > r[2]) then
                    malGuerra = malGuerra + 1
                    if malGuerra <= 6 then print("     " .. t .. " con " .. vida.edad .. " (" .. et[t] .. ")") end
                end
            end
        end
    end
    local n = 0
    for _ in pairs(usadas) do n = n + 1 end
    check(nulas == 0, "todas las vidas se arman (" .. (3000 - nulas) .. " de 3000)")
    check(malTexto == 0, "textos sin marcadores, sin tildes y dentro del largo")
    check(malGuerra == 0, "las guerras cuadran con la edad")
    check(n >= #D.PIEZAS * 0.85, "salen casi todas las piezas (" .. n .. " de " .. #D.PIEZAS .. ")")
    check(lazos / 3000 >= 1, "cada vida trae lazos con el reparto (" .. string.format("%.1f", lazos / 3000) .. " por vida)")

    print("4. una infancia que prohibe algo lo sigue prohibiendo despues, salvo que se supere")
    local p1 = { id = "t_inf", etapa = "infancia", da = { "enfermizo_nino" }, prohibe = { "atleta" } }
    local vida = { sexo = "h", edad = 40, pueblo = "Rosewood", oficio = "granjero" }
    local _, et, bl = nil, { enfermizo_nino = true }, { { tag = "atleta", por = { "enfermizo_nino" } } }
    check(not V.calza({ da = { "atleta" } }, vida, et, bl), "no se puede ser atleta con el asma de nino")
    check(V.calza({ da = { "atleta" }, quita = { "enfermizo_nino" } }, vida, et, bl), "si, si la pieza cuenta como lo supero")
    check(p1.id == "t_inf", "pieza de prueba")
end

print("5. un cliente con historia la cuenta en tres encargos y se muda")
local e = G.estado()
e.clientes.westpoint = {}
local cl = G.elegirCliente("westpoint")
local intentos = 0
while cl.sec == nil and intentos < 50 do cl = G.elegirCliente("westpoint"); intentos = intentos + 1 end
check(cl.sec ~= nil, "a veces sale un vecino hecho a mano (" .. tostring(cl.sec) .. ")")
local s = V.secundario(cl.sec)
check(s ~= nil and s.pueblo == "West Point", "es de West Point")
for vez = 1, 3 do
    local v = { contacto = "westpoint", ciudad = "West Point", tipo = "buscar", oficio = "la vecina", oficio_id = cl.oficio,
        cliente_corto = cl.nombre, cliente_apellido = cl.apellido, cliente_sexo = cl.sexo, perfil_npc = cl.perfil,
        diario_ini = "Encargo." }
    G.textosCliente(v, cl)
    check(v.diario_cliente ~= nil and string.find(v.diario_cliente, s.textos["revelacion" .. vez], 1, true) ~= nil,
        "encargo " .. vez .. ": revela la parte " .. vez)
    if vez == 1 then check(string.find(v.diario_ini, s.textos.diario_conocer, 1, true) ~= nil, "el diario lo presenta") end
    if vez == 3 then check(v.diario_cliente2 == s.textos.diario_final, "al tercero, la linea final del diario") end
    local inst = { id = "t" .. vez, def = "encargo_gen_buscar", vars = v, diario = {}, lugares = {} }
    G.anotarCliente(inst)
    for _, x in ipairs(e.clientes.westpoint) do if x.sec == cl.sec then cl = x end end
    cl = { nombre = cl.nombre, apellido = cl.apellido, sexo = cl.sexo, perfil = cl.perfil, oficio = cl.oficio,
        frecuente = true, sec = cl.sec, vida = cl.vida, veces = cl.veces }
end
check(e.secs[cl.sec] == "vecino", "quedo como vecino del campamento")
local mudo = false
for _, t in ipairs(diario) do if string.find(t, s.textos.mudanza, 1, true) then mudo = true end end
check(mudo, "el diario cuenta su mudanza")
local libre = true
for _ = 1, 60 do local o = G.secundarioLibre("westpoint"); if o ~= nil and o.id == cl.sec then libre = false end end
check(libre, "no vuelve a salir como cliente nuevo")

if V.hayPiezas() then
    print("6. un vecino generado tambien cuenta su vida")
    local otro
    for _ = 1, 80 do
        local x = G.elegirCliente("rosewood")
        if x.vida ~= nil then otro = x; break end
    end
    check(otro ~= nil and otro.vida.pueblo == "Rosewood", "vida armada en Rosewood")
    if otro ~= nil then
        local v = { contacto = "rosewood", ciudad = "Rosewood", tipo = "buscar", oficio = "la granjera", diario_ini = "Encargo." }
        G.textosCliente(v, otro)
        check(v.cli_tiene and v.diario_cliente ~= nil and v.cli_llegada ~= nil and v.mudanza ~= nil, "con revelacion, saludo y mudanza")
    end
end

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
