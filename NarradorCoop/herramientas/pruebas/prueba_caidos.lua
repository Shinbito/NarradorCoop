-- Prueba: personajes importantes que mueren (homenaje, lamento si los mato el jugador) y lo que
-- no cuenta (se retiro, se descargo, gente sin nombre que no mataste). Se corre con correr.py.
local Mundo, Motor, CA, C, D = Narrador.Mundo, Narrador.Motor, Narrador.Caidos, Narrador.Contactos, Narrador.Dominios
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
Mundo.horas = function() return 200 end
Mundo.log = function() end
Mundo.retirar = function() return true end
Motor.enviar = function() end
Motor.publicar = function() end
local st = Motor.estado()
st.arcos, st.orden, st.diario = {}, {}, {}

local function arco(id, def, miembros)
    st.arcos[id] = { id = id, def = def, vars = { quien_mato = "Shinbito" }, grupos = { g = { miembros = miembros } } }
    st.orden[#st.orden + 1] = id
end
arco("a#1", "familia_infectada", {
    [1] = { rol = "padre", vivo = false, causa = "jugador" },
    [2] = { rol = "hijo", vivo = false, causa = "transformado" },
    [3] = { rol = "madre", vivo = false, causa = "otro", desaparecido = true },
})
arco("a#2", "inmoral_testigo", { [4] = { rol = "testigo", vivo = false, causa = "otro" } })
arco("a#3", "inmoral_quemar", { [5] = { rol = "uno", vivo = false, causa = "jugador" } })
arco("a#4", "bandido_3", { [6] = { rol = "padre", vivo = false, causa = "retirado" } })
CA.revisar()
CA.revisar()
local por = {}
for _, c in ipairs(CA.st().lista) do por[c.clave] = c end
check(por.daniel_bell ~= nil and por.daniel_bell.mato and por.daniel_bell.texto:find("En que me converti") ~= nil, "Daniel muerto por el jugador: lamento")
check(por.daniel_bell.quien == "Shinbito", "queda quien lo mato")
check(por.wade_bell ~= nil and not por.wade_bell.mato and por.wade_bell.texto:find("fiebre") ~= nil, "Wade transformado: homenaje")
check(por.yvonne_bell == nil, "Yvonne solo se descargo: no se anota")
check(por.oscar_lagos == nil, "el testigo que no mataste no se anota")
check(por.marta_ibanez ~= nil and por.marta_ibanez.texto == "A Marta Ibanez la mate yo. Escribo su nombre y lo tacho, y me pregunto en que me converti."
      or por.marta_ibanez ~= nil and por.marta_ibanez.texto:find("Marta Ibanez") ~= nil, "la refugiada que mataste: lamento generico con su nombre")
check(por.arturo_salinas == nil, "Arturo se retiro: no se anota")
check(#CA.st().lista == 3, "sin repetidos (" .. #CA.st().lista .. ")")
check(st.diario[#st.diario].arco == "Los que ya no estan", "linea en el registro del diario")

-- Un misionero en la conquista
local c = C.def("muldraugh")
local e = C.estado("muldraugh")
e.condenado, e.condenado_dominio = true, "bandido"
pcall(C.alMorir, e, c, 99)
check(por.cabo_ramiro == nil and CA.st().anotados.cabo_ramiro == true, "el Cabo Ramiro muerto en la conquista se anota")
local ultimo = CA.st().lista[#CA.st().lista]
check(ultimo.clave == "cabo_ramiro" and ultimo.mato, "con lamento (la conquista la trajiste tu)")
-- Un capitan que cae en la reconquista no va
local e2 = C.estado("westpoint")
D.cambiar("westpoint", "bandido")
e2.condenado, e2.condenado_dominio = true, "nuevo"
local antes = #CA.st().lista
pcall(C.alMorir, e2, C.def("westpoint"), 98)
check(#CA.st().lista == antes, "la capitana que cae en la reconquista no se anota")
print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
