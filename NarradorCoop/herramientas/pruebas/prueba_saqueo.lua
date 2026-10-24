-- Prueba: las misiones dificiles son siempre un saqueo a un edificio emblematico (lleno de
-- muertos o tomado por bandidos armados). Se corre con correr.py.
require "Narrador/Arcos/Generados"
local Mundo, Motor, G, Defs = Narrador.Mundo, Narrador.Motor, Narrador.Generador, Narrador.Defs
local fallos = 0
local function check(cond, msg) if cond then print("  ok  " .. msg) else print("  MAL " .. msg); fallos = fallos + 1 end end
Mundo.log = function() end

-- Tipo segun el nivel.
check(G.elegirTipo("rosewood", "dificil") == "saqueo", "dificil = saqueo")
local otro = false
for _ = 1, 30 do if G.elegirTipo("rosewood", "facil") == "saqueo" or G.elegirTipo("rosewood", "medio") == "saqueo" then otro = true end end
check(not otro, "facil y medio nunca sacan saqueo")

-- Las dos variantes.
local azar = Mundo.azar
local vistas = {}
for i = 1, 2 do
    Mundo.azar = function(n) return i == 1 and 1 or n end -- 1: todo al minimo (horda); n: al maximo (bandidos)
    local o = G.generar("rosewood", "dificil", "g1")
    check(o ~= nil and o.def == "encargo_gen_saqueo", "genera encargo_gen_saqueo")
    local v = o.vars
    vistas[v.variante] = v
    check(v.saqueo_nombre ~= nil and type(v.botin_saqueo) == "table" and #v.botin_saqueo >= 5, "trae edificio y botin: " .. tostring(v.saqueo_nombre))
    check(v.comp == "ninguna" and v.cond == "ninguna" and v.con_bandidos == false, "sin complicaciones ni condiciones extra")
    check(v.plazo == 72 and v.max >= 3000, "plazo 72 h y busqueda amplia")
    local txt = table.concat(o.resumen, " | ")
    check(txt:find("Adentro:", 1, true) ~= nil and txt:find("Ojo:", 1, true) ~= nil, "resumen dice que hay y que lo cuida")
end
Mundo.azar = azar
check(vistas.horda ~= nil and vistas.horda.bajas_meta == 60 and vistas.horda.jefe_outfit ~= nil, "variante horda: 60 bajas y jefe")
check(vistas.bandidos ~= nil and type(vistas.bandidos.bandidos) == "table" and vistas.bandidos.bandidos[1] >= 5, "variante bandidos: 5 a 8")

-- El arco: llegada lleva a la etapa de cada variante y ambas terminan en botin.
local def = Defs.get ~= nil and Defs.get("encargo_gen_saqueo") or nil
if def == nil then for _, d in ipairs(Defs.todos()) do if d.id == "encargo_gen_saqueo" then def = d end end end
check(def ~= nil, "el arco esta registrado")
local e = def.etapas
check(e.llegada.salidas[1].ir == "asalto_horda" and e.llegada.salidas[2].ir == "asalto_bandidos", "llegada reparte por variante")
local function vaA(etapa, destino)
    for _, s in ipairs(etapa.salidas) do if s.ir == destino then return true end end
    return false
end
check(vaA(e.asalto_horda, "botin") and vaA(e.asalto_bandidos, "botin"), "las dos terminan en botin")
check(vaA(e.botin, "volver"), "despues del botin se vuelve con el misionero")

-- armar_grupo: espera al grupo y le pone un arma en la mano a cada vivo.
local mano, inventario = {}, {}
local function cuerpo(uid)
    return { getInventory = function() return { AddItem = function(_, it) inventario[#inventario + 1] = { uid, it } end } end,
             setPrimaryHandItem = function(_, it) mano[uid] = it end }
end
Mundo.crearItem = function(t) return t end
local cuerpos = {}
Mundo.cuerpoActor = function(uid) return cuerpos[uid] end
local inst = { grupos = { ocupantes = { estado = "pidiendo", miembros = {} } } }
local p = { "armar_grupo", grupo = "ocupantes" }
check(Motor.diferidas.armar_grupo(inst, p, {}) == false, "espera a que el grupo este listo")
inst.grupos.ocupantes = { estado = "listo", miembros = { a = { vivo = true }, b = { vivo = true }, c = { vivo = false } } }
cuerpos.a = cuerpo("a")
check(Motor.diferidas.armar_grupo(inst, p, {}) == false and mano.a ~= nil and mano.b == nil, "arma a los que ya tienen cuerpo y sigue esperando")
cuerpos.b = cuerpo("b")
check(Motor.diferidas.armar_grupo(inst, p, {}) == true and mano.b ~= nil and mano.c == nil, "termina cuando todos los vivos estan armados")
check(#inventario == 4, "cada uno lleva arma y municion")

if fallos == 0 then print("TODO BIEN") else print(fallos .. " FALLOS") end
