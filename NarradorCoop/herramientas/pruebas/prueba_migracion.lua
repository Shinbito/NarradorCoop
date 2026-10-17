-- Prueba: una partida guardada de antes de la 0.11.0, con Eduardo todavia como "tomas".
-- Se corre con herramientas/pruebas/correr.py.
local Motor = Narrador.Motor
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end

local st = {
    memoria = { tomas_conocido = true, caido_tomas = "volvio", bell = "salvados", fin = "eduardo_muerto" },
    arcos = { ["leyenda_tomas#7"] = { id = "leyenda_tomas#7", def = "leyenda_tomas", vars = { dijo_tomas = true, contacto = "westpoint" },
        grupos = { tomas = { roles = { tomas = 55 }, miembros = { [55] = { rol = "tomas", vivo = true } } } } } },
    orden = { "leyenda_tomas#7" },
    historial = { { def = "tomas_vuelve", final = "final" } },
    inmunes = { ["55"] = { uid = 55, quien = "tomas" } },
    director = { veces = { leyenda_tomas = 1 } },
    jugadores = { "tomas" },
}
Motor.migrar(st)
local inst = st.arcos["leyenda_tomas#7"]
check(st.memoria.eduardo_conocido == true and st.memoria.tomas_conocido == nil, "memoria tomas_conocido -> eduardo_conocido")
check(st.memoria.caido_eduardo == "volvio", "memoria caido_tomas -> caido_eduardo")
check(st.memoria.fin == "eduardo_muerto" and st.memoria.bell == "salvados", "las otras memorias no cambian")
check(inst ~= nil and inst.def == "leyenda_eduardo", "la historia en curso pasa a leyenda_eduardo")
check(inst.vars.dijo_eduardo == true and inst.vars.contacto == "westpoint", "variables de la historia")
check(inst.grupos.eduardo ~= nil and inst.grupos.tomas == nil, "grupo tomas -> eduardo")
check(inst.grupos.eduardo.roles.eduardo == 55 and inst.grupos.eduardo.miembros[55].rol == "eduardo", "rol tomas -> eduardo")
check(st.historial[1].def == "eduardo_vuelve", "historial")
check(st.inmunes["55"].quien == "eduardo", "inmunes: quien")
check(st.director.veces.leyenda_eduardo == 1, "cuantas veces salio (director)")
check(st.jugadores[1] == "tomas", "un jugador que se llama tomas no cambia")
local antes = st.memoria.eduardo_conocido
st.memoria.tomas_conocido = "otra"
Motor.migrar(st)
check(st.memoria.tomas_conocido == "otra", "la migracion corre una sola vez")
print(fallos == 0 and "TODO BIEN" or ("FALLOS: " .. fallos))
