-- Prueba: el premio de un rumor falso (la mochila de E.G.) queda dentro de la sala, el aviso dice
-- donde, el rumor escuchado espera a que vayan, y las historias que no lanza el director no le
-- ocupan cupo (los Bell no quedan bloqueados). Se corre con herramientas/pruebas/correr.py.

local Mundo, Motor, Director, Rum = Narrador.Mundo, Narrador.Motor, Narrador.Director, Narrador.Rumores
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
local reloj, avisos, enSuelo = 100, {}, {}
Mundo.horas = function() return reloj end
Mundo.azar = function(n) return 1 end
Mundo.log = function() end
Mundo.jugadores = function() return { "p1" } end
Mundo.jugadorCerca = function() return "p1" end
Motor.enviar = function(p, cmd, d) if cmd == "aviso" then avisos[#avisos + 1] = d.texto end end
Motor.publicar = function() end

-- Una oficina de 5x5 en (100..104, 200..204), piso 0; el centro (102,202) tiene un escritorio.
local function inventario()
    local lista = {}
    return { AddItem = function(_, it) lista[#lista + 1] = it end, lista = lista }
end
Mundo.crearItem = function(t)
    local tipo = type(t) == "table" and t[1] or t
    local it = { tipo = tipo }
    if tipo == "Base.Bag_Schoolbag" then it.inv = inventario() end
    return setmetatable(it, { __index = {
        getInventory = function(self) return self.inv end,
        setName = function(self, n) self.nombre = n end, setCustomName = function() end,
        getModData = function(self) self.md = self.md or {}; return self.md end,
        addPage = function(self, _, t) self.texto = t end, setLockedBy = function() end } })
end
local casillas = {}
Mundo.cargado = function(x, y, z)
    local k = x .. "," .. y .. "," .. (z or 0)
    if casillas[k] == nil then
        local dentro = x >= 100 and x <= 104 and y >= 200 and y <= 204 and (z or 0) == 0
        casillas[k] = { X = x, Y = y, getRoom = function() return dentro and { getName = function() return "policeoffice" end } or nil end,
            isFree = function() return not (x == 102 and y == 202) end,
            AddWorldInventoryItem = function(self, it) enSuelo[#enSuelo + 1] = { it = it, x = self.X, y = self.Y } end }
    end
    return casillas[k]
end

print("1. la casilla queda dentro de la sala, libre y cerca del centro")
local l = { x = 102, y = 202, z = 0, sala = "policeoffice", etiqueta = "la comisaria del centro de Rosewood" }
local sq = Director.casillaEnSala(l)
check(sq ~= nil and sq.X >= 100 and sq.X <= 104 and sq.Y >= 200 and sq.Y <= 204, "casilla en la oficina")
check(sq ~= nil and not (sq.X == 102 and sq.Y == 202), "no encima del escritorio")
check(Director.dondeAdentro(l) == "una oficina de la planta baja", "pista: " .. Director.dondeAdentro(l))

print("2. rumor falso de Eduardo: mochila con todo adentro y aviso con el lugar")
local iEdu
for i, f in ipairs(Rum.FALSOS) do if f.bolsa == "Mochila de E.G." then iEdu = iEdu or i end end
check(iEdu ~= nil, "el rumor de Eduardo tiene mochila")
local d = Director.st()
d.agenda = { { falso = iEdu, lanzar = reloj + 48, lugar = l, dichos = {}, oidos = { g1 = true }, seguido = false, desde = reloj } }
Director.revisarVisitas()
check(#enSuelo == 1 and enSuelo[1].it.nombre == "Mochila de E.G.", "una mochila en el suelo (" .. #enSuelo .. ")")
local adentro = enSuelo[1] ~= nil and enSuelo[1].it.inv.lista or {}
check(#adentro == #Rum.FALSOS[iEdu].premio + 1, "adentro el premio y la nota (" .. #adentro .. ")")
check(avisos[#avisos] ~= nil and avisos[#avisos]:find("una oficina de la planta baja", 1, true) ~= nil, "aviso: " .. tostring(avisos[#avisos]))
check(#d.agenda == 0, "el rumor se cierra")

print("3. un rumor falso escuchado espera hasta 7 dias")
d.agenda = { { falso = iEdu, lanzar = reloj + 48, lugar = l, dichos = {}, oidos = { g1 = true }, seguido = false, desde = reloj } }
reloj = reloj + 80
Director.procesarAgenda()
check(#d.agenda == 1, "a las 80 horas sigue ahi")
reloj = reloj + 100
Director.procesarAgenda()
check(#d.agenda == 0, "a los 7 dias se borra")
d.agenda = { { falso = iEdu, lanzar = reloj + 48, lugar = l, dichos = {}, oidos = {}, seguido = false, desde = reloj } }
reloj = reloj + 80
Director.procesarAgenda()
check(#d.agenda == 0, "si nadie lo escucho se borra como antes")

print("4. desbloqueos y encargos no le ocupan cupo al director")
local st = Motor.estado()
-- (en la prueba los Arcos no se cargan: un desbloqueo de mentira, como los de Desbloqueos.lua)
Narrador.Defs.lista.desbloqueo_muldraugh = Narrador.Defs.lista.desbloqueo_muldraugh or { id = "desbloqueo_muldraugh", automatico = false }
Narrador.Defs.lista.desbloqueo_westpoint = Narrador.Defs.lista.desbloqueo_westpoint or { id = "desbloqueo_westpoint", automatico = false }
st.arcos["desbloqueo_muldraugh#1"] = { id = "desbloqueo_muldraugh#1", def = "desbloqueo_muldraugh" }
st.arcos["desbloqueo_westpoint#2"] = { id = "desbloqueo_westpoint#2", def = "desbloqueo_westpoint" }
st.orden[#st.orden + 1] = "desbloqueo_muldraugh#1"
st.orden[#st.orden + 1] = "desbloqueo_westpoint#2"
check(Director.activos() == 0, "dos desbloqueos pendientes: cupo libre (" .. Director.activos() .. ")")
st.arcos["horda_en_camino#3"] = { id = "horda_en_camino#3", def = "horda_en_camino" }
st.orden[#st.orden + 1] = "horda_en_camino#3"
check(Director.activos() == 1, "una historia del director si cuenta")

print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
