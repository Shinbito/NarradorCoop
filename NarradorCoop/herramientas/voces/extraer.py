#!/usr/bin/env python3
"""Junta todas las frases que dicen los personajes del mod, con la voz que las dice.

Lee con un interprete de Lua (lupa) los arcos, charlas, conversaciones, rumores y dominios
(shared) y algunas tablas del servidor (frases de los misioneros, calendario, rechazos, frases
sueltas de C.decir y Motor.decirUid). No incluye el diario, avisos ni pistas: eso es narracion.

Cada frase sale como {"voz", "texto", "fuente", "contexto"}. "voz" es la clave de
herramientas/voces/voces.json. Las frases que dice "el misionero de turno" salen una vez por cada
misionero (cada uno las graba con su voz).

Lo usa exportar.py. Solo se puede correr suelto para ver el resumen:
    python3 NarradorCoop/herramientas/voces/extraer.py
"""
import collections
import os
import re
import unicodedata

import lupa

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))  # .../NarradorCoop
LUA = os.path.join(RAIZ, "42", "media", "lua")
SERVIDOR = os.path.join(LUA, "server", "Narrador")

MISIONEROS = {"muldraugh": "cabo_ramiro", "westpoint": "tia_chela", "riverside": "padre_nacho", "rosewood": "misia_rosa"}
SOUS = ["akagami", "zent", "matric", "shinbo", "tati", "walita", "cristonks", "hasag", "wertres"]

# Rol (como esta en el codigo) -> voz. Lo que no esta aca sale del nombre del personaje.
VOZ_POR_ROL = {
    "martin_a": "akagami", "martin_z": "zent", "benjamin": "matric", "david": "shinbo", "bastian": "tati",
    "hanz": "walita", "cristian": "cristonks", "jorge": "hasag", "cristobal": "wertres",
    "maulen": "meulen", "meulen": "meulen",
    "eduardo": "eduardo", "miguel": "miguel_angel",
    "cabo": "cabo_ramiro", "chela": "tia_chela", "nacho": "padre_nacho", "rosa": "misia_rosa",
    "padre": "daniel_bell", "madre": "yvonne_bell", "hijo": "wade_bell", "wade_bell": "wade_bell",
    "hija": "valentina", "pereira": "pereira",
}
# Nombre completo -> voz, cuando el nombre no da la clave que queremos.
VOZ_POR_NOMBRE = {"Valentina Mandados": "valentina", "Renaaaaaato": "renato", "Fucking Luengo": "luengo",
                  "Waton Ju": "waton", "Claudio Clau": "clau", "Cabo Ramiro Mandados": "cabo_ramiro",
                  "Tia Chela Recados": "tia_chela", "Padre Nacho Pegas": "padre_nacho",
                  "Misia Rosa Bencina": "misia_rosa", "Miguel Angel Mandados": "miguel_angel",
                  "Eduardo Giovanns": "eduardo"}

RECORRER = r'''
return function()
  local out, nombres, mujeres = {}, {}, {}
  local CLAVES = { memoria=1, var=1, mem=1, eleccion=1, horas=1, no=1, o=1, y=1, cerca=1 }
  local function textos(t, acc)
    acc = acc or {}
    if type(t) == "string" then acc[#acc+1] = t
    elseif type(t) == "table" then for _, v in pairs(t) do textos(v, acc) end end
    return acc
  end
  local function add(ctx, quien, t, fuente)
    for _, s in ipairs(textos(t)) do
      if (s:find(" ") or s:find("[%.!%?]$")) and s:sub(1, 4) ~= "var:" then
        out[#out+1] = { ctx = ctx, rol = tostring(quien), t = s, f = fuente }
      end
    end
  end
  local function walk(x, ctx, vistos)
    if type(x) ~= "table" or vistos[x] then return end
    vistos[x] = true
    local a = x[1]
    if type(a) == "string" and a:sub(1, 5) == "decir" then
      local q = x.rol or x.quien
      if a == "decir_eduardo" then q = "eduardo"
      elseif a == "decir_contacto" then q = "@contacto:" .. tostring(x.contacto or "?")
      elseif a == "decir_misionero" then q = "@contacto:" .. tostring(x.contacto or "?") end
      add(ctx, q or "?", x.texto or x.textos, a)
    elseif type(a) == "string" and not CLAVES[a] and a:match("^[%w_]+$") and #x <= 3
        and (type(x[2]) == "string" or (type(x[2]) == "table" and x[2].textos)) then
      if type(x[2]) == "table" or x[2]:find(" ") then add(ctx, a, x[2], "linea") end
    end
    if (a == "npcs" or a == "bandidos") then
      if type(x.nombres) == "table" then
        for rol, n in pairs(x.nombres) do
          if type(n) == "table" then nombres[ctx .. "|" .. rol] = table.concat(textos(n), " ") end
        end
      end
      for _, rol in ipairs(type(x.femeninos) == "table" and x.femeninos or {}) do mujeres[ctx .. "|" .. rol] = true end
    end
    -- "dice" de una opcion: { rol, texto } o { { rol, texto }, ... }
    if type(x.dice) == "table" and type(x.dice.rol) == "string" then add(ctx, x.dice.rol, x.dice.texto, "dice") end
    for k, v in pairs(x) do if k ~= "si" and k ~= "cuando" then walk(v, ctx, vistos) end end
  end
  for _, id in ipairs(Narrador.Defs.orden) do walk(Narrador.Defs.lista[id], "arco:" .. id, {}) end
  for k, v in pairs(Narrador.Charlas or {}) do walk(v, "charla:" .. k, {}) end
  for _, c in ipairs(Narrador.Conversas.todas()) do walk(c, "conversa:" .. tostring(c.id), {}) end
  -- contactos de cada arco (para decir_contacto)
  local contactos = {}
  for _, id in ipairs(Narrador.Defs.orden) do
    local s, vis = {}, {}
    local function w(x)
      if type(x) ~= "table" or vis[x] then return end
      vis[x] = true
      if (x[1] == "lugar_contacto" or x[1] == "decir_contacto") and type(x.contacto) == "string" then s[x.contacto] = true end
      for _, v in pairs(x) do w(v) end
    end
    w(Narrador.Defs.lista[id])
    local l = {}
    for k in pairs(s) do l[#l+1] = k end
    contactos[id] = table.concat(l, ",")
  end
  return out, nombres, mujeres, contactos
end'''


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")


def runtime():
    lua = lupa.LuaRuntime(unpack_returned_tuples=True)
    lua.globals().package.path = os.path.join(LUA, "shared", "?.lua") + ";" + lua.globals().package.path
    lua.execute("""
    ZombRand = function(n) return 0 end
    print = function() end
    isClient = function() return false end
    Events = setmetatable({}, { __index = function(t, k) local e = { Add = function() end }; rawset(t, k, e); return e end })
    """)
    base = os.path.join(LUA, "shared")
    for carpeta, _, archivos in sorted(os.walk(base)):
        for f in sorted(archivos):
            if f.endswith(".lua"):
                rel = os.path.relpath(os.path.join(carpeta, f), base)[:-4].replace(os.sep, "/")
                lua.require(rel)
    return lua


def tabla(lua, archivo, nombre):
    """Lee una tabla literal de un archivo del servidor (sin cargar el archivo entero)."""
    s = open(os.path.join(SERVIDOR, archivo), encoding="utf-8").read()
    i = s.index(nombre + " = {") + len(nombre) + 3
    d = 0
    for j in range(i - 1, len(s)):
        if s[j] == "{":
            d += 1
        elif s[j] == "}":
            d -= 1
            if d == 0:
                break
    return lua.execute("return " + s[i - 1:j + 1])


def strs(t):
    if isinstance(t, str):
        return [t]
    if t is None or not hasattr(t, "values"):
        return []
    out = []
    for v in t.values():
        out += strs(v)
    return out


def frases():
    lua = runtime()
    out = []

    def add(voz, t, fuente, ctx=""):
        for s in strs(t):
            out.append({"voz": voz, "texto": s, "fuente": fuente, "contexto": ctx})

    filas, nombres, mujeres, contactos = lua.execute(RECORRER)()
    nombres = dict(nombres.items())
    mujeres = set(mujeres.keys())
    contactos = {k: [c for c in v.split(",") if c] for k, v in contactos.items()}
    for r in filas.values():
        ctx, rol = r.ctx, r.rol
        tipo, nom = ctx.split(":", 1)
        if rol.startswith("@contacto"):
            cs = contactos.get(nom, [])
            voces = [MISIONEROS[cs[0]]] if len(cs) == 1 and cs[0] in MISIONEROS else list(MISIONEROS.values())
        elif rol in VOZ_POR_ROL:
            voces = [VOZ_POR_ROL[rol]]
        else:
            n = nombres.get(ctx + "|" + rol)
            if n is None:
                otros = {v for k, v in nombres.items() if k.endswith("|" + rol)}
                n = otros.pop() if len(otros) == 1 else None
            if n is not None:
                n = n.strip()
                voces = [VOZ_POR_NOMBRE.get(n, slug(n))]
            else:
                mujer = (ctx + "|" + rol) in mujeres
                voces = ["extra_mujer" if mujer else "extra_hombre"]
        for v in voces:
            add(v, r.t, tipo, ctx + "|" + rol)

    # Misioneros (servidor)
    for c in tabla(lua, "NarradorContactos.lua", "C.LISTA").values():
        for k in c.keys():
            if str(k).startswith("frases"):
                add(MISIONEROS[c.id], c[k], "misionero", c.id + "." + str(k))
    for k, v in tabla(lua, "NarradorContactos.lua", "C.FRASES_KNOX").items():
        add(MISIONEROS[k], v, "misionero", k + ".knox")
    for nombre in ("Cal.BRUJAS", "Cal.FIN_ANO"):
        for k, v in tabla(lua, "NarradorCalendario.lua", nombre).items():
            add(MISIONEROS[k], v, "calendario", k)
    for k, v in tabla(lua, "NarradorGenerador.lua", "G.RECHAZO").items():
        add(MISIONEROS[k], v, "misionero", k + ".rechazo")
    for voz in MISIONEROS.values():
        add(voz, tabla(lua, "NarradorContactos.lua", "C.SALUDOS"), "misionero", "saludo")
    # Frases sueltas en el servidor
    for f in sorted(os.listdir(SERVIDOR)):
        for ln in open(os.path.join(SERVIDOR, f), encoding="utf-8"):
            m = re.search(r'C\.decir\(\s*("?[\w.]+"?)\s*,\s*"([^"]+)"\s*\)', ln)
            if m:
                quien = m.group(1).strip('"')
                for v in ([MISIONEROS[quien]] if quien in MISIONEROS else MISIONEROS.values()):
                    add(v, m.group(2), "servidor", f)
            m = re.search(r'decirUid\([^,]+,\s*("[^"]*"|[^,]+),\s*"([^"]+)"\)', ln)
            if m:
                for v in (["eduardo"] if "Eduardo" in m.group(1) else SOUS):
                    add(v, m.group(2), "servidor", f)
    # Dominios: capitanes y misioneros nuevos
    for grupo in ("CAPITANES", "NUEVOS"):
        for _, v in lua.eval("Narrador.DominiosDefs." + grupo).items():
            if lupa.lua_type(v) == "table" and v.frases:
                nombre = (str(v.nombre) + " " + str(v.apellido or "")).strip()
                add(VOZ_POR_NOMBRE.get(nombre, slug(nombre)), v.frases, "dominio", nombre)
    # Campamentos: los que piden recados, por oficio
    for k, v in lua.eval("Narrador.CampamentosDefs.RECADOS_FRASES").items():
        add("campamento_" + str(k), v, "campamento", str(k))
    # Rumores
    for k, v in lua.eval("Narrador.Rumores.HISTORIAS").items():
        li = v.lineas
        if li is None:
            continue
        if li.misionero:
            for voz in MISIONEROS.values():
                add(voz, li.misionero, "rumor", str(k))
        if li.vecino:
            add("extra_hombre", li.vecino, "rumor", str(k))
        if li.sous:
            for x in li.sous.values():
                add(VOZ_POR_ROL.get(x[1], "extra_hombre"), x[2], "rumor", str(k))
    # Una vez por voz y texto
    vistos, unicas = set(), []
    for f in out:
        clave = (f["voz"], f["texto"])
        t = f["texto"].strip()
        es_frase = (" " in t or t[-1:] in ".!?") and not t.startswith("var:")
        if clave not in vistos and t and es_frase:
            vistos.add(clave)
            unicas.append(f)
    return unicas


if __name__ == "__main__":
    fs = frases()
    c = collections.Counter(f["voz"] for f in fs)
    print(len(fs), "frases,", sum(len(f["texto"]) for f in fs), "caracteres")
    for voz, n in c.most_common():
        print(f"{n:5d}  {voz}")
