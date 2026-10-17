#!/usr/bin/env python3
"""Genera NarradorCoop/MAPA_HISTORIAS.md: que historia abre a cual y por que memoria.

Lee los arcos (shared/Narrador/Arcos/*.lua) con un interprete de Lua (lupa) y saca de cada uno:
  - quien lo lanza (el director, otro arco con "abrir", un capitulo de G.ESPECIALES, un eco de
    NarradorEtiquetas o un lanzador del servidor de la lista LANZADORES de abajo, que hay que
    mantener a mano),
  - las memorias que pide (condiciones "mem", "memoria", "misionero_muerto", vars_desde_memoria),
  - las memorias que deja cada final ("memoria", "sumar_memoria"),
  - en las historias con varios finales, la ultima eleccion antes de cada final y la condicion
    que lo decide.
Las memorias salen de la lista central (herramientas/memorias.py), que tambien ve el codigo del
servidor. Tambien revisa que cada historia que el servidor lanza (BA.lanzar, Motor.iniciar con
un id escrito) este en LANZADORES; si no, sale con error. Con eso arma un diagrama mermaid (GitHub lo dibuja) y una tabla por historia. La salida
sale siempre en el mismo orden, para que regenerar no ensucie el diff.

Uso (desde la raiz del repo):  pip install lupa  &&  python3 NarradorCoop/herramientas/mapa_historias.py
"""
import os
import re
import sys

import lupa

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import memorias  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../NarradorCoop
LUA = os.path.join(RAIZ, "42", "media", "lua")
SALIDA = os.path.join(RAIZ, "MAPA_HISTORIAS.md")

# Historias que lanza el servidor por su cuenta (no con "abrir" ni como capitulo).
# def -> (como se lanza, memorias que mira el lanzador, memorias que lo cortan). Una memoria es
# "clave" (cualquier valor) o ("clave", "valor") cuando el lanzador espera un valor justo.
# Que un misionero este desbloqueado se escribe como su memoria historia_<id>_1.
FIN = ["fin"]
LANZADORES = {
    "bandido_1": ("Knox llega a -5 (NarradorBandido)", ["knox_bandido_<grupo>"], []),
    "bandido_2": ("volver al patio de trenes, con el campamento del Cabo (NarradorBandido)",
                  [("bandido_cap", "1"), "historia_muldraugh_1"], []),
    "bandido_3": ("volver al patio de trenes (NarradorBandido)", [("bandido_cap", "2")], []),
    "bandido_4": ("volver al patio de trenes (NarradorBandido)", [("bandido_cap", "3")], []),
    "bandido_5": ("volver al patio de trenes (NarradorBandido)", [("bandido_cap", "4")], []),
    "bandido_castigo": ("al volver al patio, 30% por sabotaje (NarradorBandido)", ["bandido_sospecha"], []),
    "bandido_maulen": ("72 horas despues de perdonar a Maulen (NarradorBandido)", ["maulen_salvado"], []),
    "conquista_sous": ("con Maulen de jefe y Sous aliado (NarradorBandido)",
                       [("bandido", "pereira"), ("sous", "aliados"), "maulen_salvado"], []),
    "conquista_muldraugh": ("despues del cap. 5 con el jefe (NarradorBandido)", [("bandido", "pereira")], []),
    "conquista_westpoint": ("al entrar a West Point (NarradorBandido)", ["conquista_muldraugh"], []),
    "conquista_riverside": ("al entrar a Riverside (NarradorBandido)", ["conquista_muldraugh"], []),
    "conquista_rosewood": ("al entrar a Rosewood (NarradorBandido)", ["conquista_muldraugh"], []),
    "eduardo_atentado": ("3 veces, cada 48 horas (NarradorBandido)", ["knox_conquistado"], FIN),
    "eduardo_fallas": ("despues del tercer atentado (NarradorBandido)", [("eduardo_nota", "true")], FIN),
    "reconquista_muldraugh": ("al entrar a Muldraugh (NarradorBandido)", [("reconquista", "true")], FIN),
    "reconquista_westpoint": ("al entrar a West Point (NarradorBandido)", [("reconquista", "true")], FIN),
    "reconquista_riverside": ("al entrar a Riverside (NarradorBandido)", [("reconquista", "true")], FIN),
    "reconquista_rosewood": ("al entrar a Rosewood (NarradorBandido)", [("reconquista", "true")], FIN),
    "reconquista_patio": ("con las 4 ciudades reconquistadas (NarradorBandido)",
                          ["reconquista_muldraugh", "reconquista_westpoint", "reconquista_riverside", "reconquista_rosewood"], FIN),
    "eduardo_evento": ("tirada diaria (NarradorEduardo)", ["eduardo_conocido"], ["eduardo_muerto_duelo", ("bandido", "pereira"), "fin"]),
    "eduardo_vuelve": ("al pasar por el cuartel de la Chela, con su campamento (NarradorContactos)",
                     ["caido_eduardo", "historia_westpoint_1"], []),
    "desbloqueo_muldraugh": ("al andar por Muldraugh (NarradorContactos)", [], []),
    "desbloqueo_westpoint": ("al andar por West Point (NarradorContactos)", [], []),
    "desbloqueo_riverside": ("al andar por Riverside (NarradorContactos)", [], []),
    "desbloqueo_rosewood": ("al andar por Rosewood (NarradorContactos)", [], []),
    "cal_fonda": ("18 de septiembre, con Sous aliado (NarradorCalendario)", [("sous", "aliados")], []),
    "cal_amigo_secreto": ("24 de diciembre, con Sous aliado (NarradorCalendario)", [("sous", "aliados")], []),
    "encargo_cura": ("pedirle 'algo especial' a un misionero, cada 20 dias (NarradorCuraServer)", [], []),
}
for rol in ["benjamin", "martin_z", "martin_a", "david", "bastian", "hanz", "cristian", "jorge", "cristobal"]:
    LANZADORES["favor_" + rol] = ("pedirle el favor en la base de Sous (FavoresSous)", [("sous", "aliados")], [])
for rol in ["hanz", "cristian", "jorge", "cristobal"]:
    LANZADORES["historia_sous_" + rol] = ("con Sous aliado, una a la vez y 30 horas entre historias de Sous (NarradorHistoriasSous2)",
                                          [("sous", "aliados")], [])

# Memorias que deja el codigo del servidor (no una accion de un arco): clave -> arcos que la causan.
SERVIDOR_DEJA = {
    "knox_conquistado": ["conquista_muldraugh", "conquista_westpoint", "conquista_riverside", "conquista_rosewood"],
    "caido_eduardo": ["leyenda_eduardo", "eduardo_evento"],
}

# Desenlaces: memorias que cierran una linea de la historia. Salen en el diagrama como su propio
# nodo, para que se vean las decisiones que no abren otra historia. (clave, valor) -> texto.
DESENLACES = {
    ("bandido", "rechazado"): "Rechaza a la banda (la puerta queda abierta)",
    ("bandido", "redimido"): "Redencion: Knox vuelve a 0",
    ("bandido", "pereira_escapo"): "El jefe del patio escapa",
    ("fin", "eduardo_muerto"): "FIN: Eduardo muerto, Knox es de la banda",
    ("fin", "reconquista"): "FIN: Knox vuelve a ser luz de esperanza",
    ("sous", "eliminado"): "Sous eliminado",
    ("sous", "conquistada"): "La base de Sous es de Maulen",
    ("sous", "caidos"): "Sous cae en su base",
    ("sous", "negado"): "Le dices que no a Sous",
    ("sous", "maulen_escapa"): "Maulen escapa con todo",
    ("hija_cabo", "salvada"): "Valentina vuelve con el Cabo",
    ("hija_cabo", "muerta"): "Valentina muere",
    ("lucia", "en_riverside"): "Lucia vuelve a Riverside",
    ("estanque_rosewood", "defendido"): "El estanque queda a salvo",
}

# Arcos que se repiten sin fin y no son parte de la trama: van en una linea al final.
REPETIBLES = ("encargo_", "enc_", "inmoral_", "recado_")


def especiales():
    """Capitulos de G.ESPECIALES: def -> (contacto, capitulo, requiere, hecho, confianza)."""
    ruta = os.path.join(LUA, "server", "Narrador", "NarradorGenerador.lua")
    texto = open(ruta, encoding="utf-8").read()
    caps = {}
    for bloque in re.findall(r'\{\s*def = "[^"]+",[^{}]*', texto):
        campos = dict(re.findall(r'(\w+) = "?([^",\s]+)"?', bloque))
        if "capitulo" in campos:
            caps[campos["def"]] = (campos["contacto"], int(campos["capitulo"]), campos.get("requiere"),
                                   campos["hecho"], campos.get("confianza"))
    return caps


def ecos():
    """Ecos de NarradorEtiquetas que abren otra historia: (def, final, def_eco)."""
    ruta = os.path.join(LUA, "shared", "Narrador", "NarradorEtiquetas.lua")
    texto = open(ruta, encoding="utf-8").read()
    out = []
    ecos_txt = texto[texto.index("Et.ECOS"):]
    for bloque in re.split(r"\n\s*\{\s*(?=def = )", ecos_txt)[1:]:
        campos = dict(re.findall(r'(\w+) = "([^"]+)"', bloque))
        if campos.get("def_eco"):
            out.append((campos["def"], campos["final"], campos["def_eco"]))
    return sorted(out)


ANALIZAR = r'''
return function()
  local out = {}
  local function esLista(t) return type(t) == "table" and type(t[1]) == "string" end
  local function recorrer(x, f, vistos)
    if type(x) ~= "table" or vistos[x] then return end
    vistos[x] = true
    if esLista(x) then f(x) end
    for _, v in pairs(x) do recorrer(v, f, vistos) end
  end
  -- Condicion -> texto corto.
  local function fmt(c)
    if type(c) ~= "table" then return tostring(c) end
    if type(c[1]) == "table" then
      local p = {}
      for _, x in ipairs(c) do p[#p + 1] = fmt(x) end
      return table.concat(p, " y ")
    end
    local t = c[1]
    if t == "o" or t == "y" then
      local p = {}
      for i = 2, #c do p[#p + 1] = fmt(c[i]) end
      return "(" .. table.concat(p, t == "o" and " o " or " y ") .. ")"
    end
    if t == "no" then return "no " .. fmt(c[2]) end
    if t == "var" then return tostring(c[2]) .. " = " .. tostring(c[3]) end
    if t == "memoria" then return "memoria " .. tostring(c[2]) .. " = " .. tostring(c[3]) end
    if t == "mem" then return "memoria " .. tostring(c[2]) end
    if t == "eleccion" then return "elige " .. tostring(c[2]) end
    if t == "horas" then return "pasan " .. tostring(c[2]) .. " h" end
    local p = { tostring(t) }
    for i = 2, #c do if type(c[i]) ~= "table" then p[#p + 1] = tostring(c[i]) end end
    return table.concat(p, " ")
  end
  -- Elecciones que pide una condicion (en cualquier nivel) y variables que exige (solo "y").
  local function elecciones(c, l)
    if type(c) ~= "table" then return l end
    if c[1] == "eleccion" then l[#l + 1] = c[2]; return l end
    if c[1] == "no" then return l end
    for _, x in ipairs(c) do elecciones(x, l) end
    return l
  end
  local function vars(c, l)
    if type(c) ~= "table" then return l end
    if c[1] == "var" then l[#l + 1] = { nombre = c[2], valor = tostring(c[3]) }; return l end
    if type(c[1]) == "table" then for _, x in ipairs(c) do vars(x, l) end end
    return l
  end
  for _, def in ipairs(Narrador.Defs.todos()) do
    local titulo = tostring(def.titulo or def.id)
    if string.find(titulo, "{", 1, true) then titulo = tostring(def.titulo_menu or def.id) end
    local d = { id = def.id, titulo = titulo, auto = def.automatico ~= false,
                lee = {}, abre = {}, deja = {}, finales = {}, trans = {}, opciones = {} }
    for _, k in ipairs(def.vars_desde_memoria or {}) do d.lee[#d.lee + 1] = k end
    for nombre, etapa in pairs(def.etapas) do
      local final = etapa.final == true
      if final then d.finales[#d.finales + 1] = nombre end
      recorrer(etapa, function(a)
        local t = a[1]
        if (t == "mem" or t == "memoria") and type(a[2]) == "string" then d.lee[#d.lee + 1] = a[2]
        elseif t == "misionero_muerto" then d.lee[#d.lee + 1] = "misionero_muerto_" .. tostring(a[2])
        elseif t == "abrir" and a.def then d.abre[#d.abre + 1] = { def = a.def, etapa = nombre }
        elseif (t == "memoria" or t == "sumar_memoria") and type(a.clave) == "string" then
          local v = a.valor
          if type(v) ~= "string" and type(v) ~= "number" and type(v) ~= "boolean" then v = "?" end
          d.deja[#d.deja + 1] = { clave = a.clave, valor = tostring(v), etapa = nombre, final = final }
        end
      end, {})
      for _, op in ipairs(etapa.opciones or {}) do
        local pone = {}
        for _, a in ipairs(op.acciones or {}) do
          if a[1] == "variable" then pone[#pone + 1] = { nombre = a.nombre, valor = tostring(a.valor) } end
        end
        d.opciones[#d.opciones + 1] = { id = op.id, texto = tostring(op.texto or op.id), pone = pone }
      end
      for i, s in ipairs(etapa.salidas or {}) do
        d.trans[#d.trans + 1] = { desde = nombre, hasta = s.ir, orden = i, cond = fmt(s.cuando),
                                  elecciones = elecciones(s.cuando, {}), vars = vars(s.cuando, {}) }
      end
    end
    out[#out + 1] = d
  end
  return out
end'''


def lista(t):
    return [t[i] for i in range(1, len(t) + 1)] if t is not None else []


def cargar():
    lua = lupa.LuaRuntime(unpack_returned_tuples=True)
    lua.globals().package.path = os.path.join(LUA, "shared", "?.lua") + ";" + lua.globals().package.path
    lua.execute("ZombRand = function(n) return 0 end; print = function() end")
    lua.require("Narrador/NarradorDefs")
    lua.require("Narrador/NarradorConversasDefs")
    carpeta = os.path.join(LUA, "shared", "Narrador", "Arcos")
    for f in sorted(os.listdir(carpeta)):
        if f.endswith(".lua"):
            lua.require("Narrador/Arcos/" + f[:-4])
    arcos = []
    for d in lista(lua.execute(ANALIZAR)()):
        opciones = {}
        for o in lista(d.opciones):
            opciones[o.id] = (o.texto, {(p.nombre, p.valor) for p in lista(o.pone)})
        arcos.append({
            "id": d.id, "titulo": d.titulo, "auto": d.auto,
            "lee": sorted(set(lista(d.lee))),
            "abre": sorted({(x["def"], x.etapa) for x in lista(d.abre)}),
            "finales": sorted(lista(d.finales)),
            "deja": sorted({(x.clave, x.valor, x.etapa, x.final) for x in lista(d.deja)}),
            "trans": sorted((t.desde, t.orden, t.hasta, t.cond, tuple(lista(t.elecciones)),
                             frozenset((v.nombre, v.valor) for v in lista(t.vars))) for t in lista(d.trans)),
            "opciones": opciones,
        })
    return sorted(arcos, key=lambda a: a["id"])


def decisiones(a, final):
    """Caminos a ese final: la ultima eleccion antes (si hubo) y la condicion que lo decide."""
    entran = {}
    for t in a["trans"]:
        entran.setdefault(t[2], []).append(t)
    caminos = set()
    for desde, _, _, cond, elec, req in entran.get(final, []):
        solo_eleccion = elec and not re.sub(r"elige \w+|[()]| o | y ", "", cond).strip()
        # Hacia atras hasta la ultima etapa donde se eligio algo (o 5 pasos).
        frente, vistos, halladas = [(desde, elec)], set(), set()
        for _ in range(5):
            nuevo = []
            for etapa, ids in frente:
                if ids:
                    halladas.update(ids)
                    continue
                if etapa in vistos:
                    continue
                vistos.add(etapa)
                nuevo += [(t[0], t[4]) for t in entran.get(etapa, [])]
            frente = nuevo
        # Si el final exige una variable que pone alguna opcion, quedan solo las que la ponen.
        pone = {i for i in halladas if a["opciones"].get(i, ("", set()))[1] & req}
        if pone:
            halladas = pone
        halladas = {i for i in halladas
                    if not any(n == rn and v != rv for n, v in a["opciones"].get(i, ("", set()))[1] for rn, rv in req)}
        textos = " o ".join(f'"{a["opciones"][i][0]}"' for i in sorted(halladas) if i in a["opciones"])
        decide = "" if solo_eleccion else f"`{cond}`"
        if textos and decide:
            caminos.add(textos + ", y despues " + decide)
        else:
            caminos.add(textos or decide)
    return sorted(caminos)


def lanzados_por_el_servidor():
    """Historias que el codigo del servidor lanza con un id escrito: {id o patron: archivos}.
    "conquista_" .. id queda como el patron "conquista_<>"."""
    out = {}
    patron = re.compile(r'(?:BA\.lanzar|Motor\.iniciar)\(\s*("[^"]*"(?:\s*\.\.\s*[^,)]+)?)')
    carpeta = os.path.join(LUA, "server", "Narrador")
    for nombre in sorted(os.listdir(carpeta)):
        if nombre.endswith(".lua"):
            texto = open(os.path.join(carpeta, nombre), encoding="utf-8").read()
            for m in patron.finditer(texto):
                partes = re.split(r"\s*\.\.\s*", m.group(1))
                clave = "".join(p.strip('"') if p.startswith('"') else "<>" for p in partes)
                out.setdefault(clave, set()).add(nombre)
    return out


def chequear_lanzadores(arcos, caps):
    """Errores: una historia que el servidor lanza y no esta en LANZADORES (el mapa diria mal
    quien la lanza), o una entrada de LANZADORES que no es ninguna historia."""
    ids = {a["id"] for a in arcos}
    errores = []
    for clave, archivos in sorted(lanzados_por_el_servidor().items()):
        rx = re.compile("^" + ".+".join(re.escape(x) for x in clave.split("<>")) + "$")
        calzan = sorted(i for i in ids if rx.match(i))
        if not calzan:
            errores.append(f"{', '.join(sorted(archivos))} lanza '{clave}' y no hay ninguna historia con ese id")
        for i in calzan:
            if i not in LANZADORES and i not in caps and not i.startswith(REPETIBLES):
                errores.append(f"'{i}' lo lanza {', '.join(sorted(archivos))} y no esta en LANZADORES")
    for i in sorted(LANZADORES):
        if i not in ids:
            errores.append(f"LANZADORES tiene '{i}' y no hay ninguna historia con ese id")
    return errores


def nodo(i):
    return re.sub(r"[^A-Za-z0-9_]", "_", i)


def main():
    caps = especiales()
    todos = cargar()
    arcos = [a for a in todos if not a["id"].startswith(REPETIBLES)]
    repetibles = sorted({re.sub(r"_(facil|medio|dificil|ultra|[a-z]+)$", "", a["id"]) for a in todos
                         if a["id"].startswith(REPETIBLES)})
    abierto_por = {}
    for a in arcos:
        for b, etapa in a["abre"]:
            abierto_por.setdefault(b, []).append((a["id"], etapa))
    eco_de = {}
    for d, final, b in ecos():
        eco_de.setdefault(b, []).append((d, final))

    def lanzado(a):
        """(como se lanza, memorias que pide, memorias que lo cortan)."""
        if a["id"] in caps:
            c, n, req, _, conf = caps[a["id"]]
            return (f"capitulo {n} de {c}, entre sus ofertas" + (f" (confianza {conf}+)" if conf else ""),
                    [req] if req else [], [])
        if a["id"] in LANZADORES:
            return LANZADORES[a["id"]]
        if a["id"] in abierto_por:
            return "lo abre " + ", ".join(sorted({x for x, _ in abierto_por[a["id"]]})), [], []
        if a["id"] in eco_de:
            return "eco de " + ", ".join(sorted(f"{d} ({f})" for d, f in eco_de[a["id"]])), [], []
        if a["auto"]:
            return "el director (al azar, segun tension)", [], []
        return "sin lanzador conocido (admin)", [], []

    # Quien deja cada memoria.
    deja, deja_valor = {}, {}
    for a in arcos:
        for clave, valor, _, _ in a["deja"]:
            deja.setdefault(clave, set()).add(a["id"])
            deja_valor.setdefault((clave, valor), set()).add(a["id"])
    for d, (_, _, _, hecho, _) in caps.items():
        deja.setdefault(hecho, set()).add(d)
    for clave, ids in SERVIDOR_DEJA.items():
        deja.setdefault(clave, set()).update(ids)

    def quienes(p):
        if isinstance(p, tuple):
            return deja_valor.get(p, set())
        return deja.get(p, set())

    def nombre(p):
        return f"{p[0]} = {p[1]}" if isinstance(p, tuple) else p

    donde = {}
    for a in arcos:
        for clave, valor, etapa, _ in a["deja"]:
            donde.setdefault((a["id"], clave, valor), set()).add(etapa)
            donde.setdefault((a["id"], clave, None), set()).add(etapa)

    def etapas_de(a, p):
        clave, valor = (p if isinstance(p, tuple) else (p, None))
        return sorted(donde.get((a, clave, valor), ()))

    # Aristas: A deja una memoria que B necesita para lanzarse; A abre B; o B es un eco de A.
    # La etiqueta dice desde que final de A.
    aristas = set()
    for b in arcos:
        _, pide, _ = lanzado(b)
        for p in pide:
            for a in quienes(p):
                if a != b["id"]:
                    finales = etapas_de(a, p)
                    pre = (", ".join(finales) + ": ") if finales else ""
                    aristas.add((a, b["id"], pre + nombre(p)))
        for a, etapa in abierto_por.get(b["id"], ()):
            aristas.add((a, b["id"], etapa + ": abre"))
        for a, final in eco_de.get(b["id"], ()):
            aristas.add((a, b["id"], final + ": eco"))
    # Cortes: la memoria que deja A apaga el lanzador de B.
    cortes = set()
    for b in arcos:
        for p in lanzado(b)[2]:
            for a in sorted(quienes(p)):
                if a != b["id"]:
                    finales = etapas_de(a, p)
                    pre = (", ".join(finales) + ": ") if finales else ""
                    cortes.add((a, b["id"], pre + nombre(p)))

    finales_aristas = set()
    for a in arcos:
        for clave, valor, etapa, _ in a["deja"]:
            if (clave, valor) in DESENLACES:
                finales_aristas.add((a["id"], "fin_" + nodo(clave + "_" + valor), etapa, DESENLACES[(clave, valor)]))

    lineas = ["# Mapa de historias", "",
              "Generado por `NarradorCoop/herramientas/mapa_historias.py` a partir de los arcos. No editar a mano:",
              "se vuelve a generar con `python3 NarradorCoop/herramientas/mapa_historias.py` (necesita `pip install lupa`).",
              "Los lanzadores del servidor estan en la lista `LANZADORES` del script; si se agrega uno, se agrega ahi.",
              "Las memorias y lo que guardan estan en `NarradorCoop/herramientas/memorias.py`.",
              "",
              "## Diagrama", "",
              "Cada flecha sale del final que la provoca y dice que memoria deja. Los nodos redondeados son desenlaces:",
              "decisiones que cierran una linea en vez de abrir otra historia. Las flechas con `x` cortan una historia:",
              "despues de esa memoria ya no sale.", "",
              "```mermaid", "flowchart LR"]
    usados = {x for a, b, _ in aristas | cortes for x in (a, b)} | {a for a, _, _, _ in finales_aristas}
    for a in arcos:
        if a["id"] in usados:
            lineas.append(f'  {nodo(a["id"])}["{a["titulo"].replace(chr(34), "")}"]')
    for fid, texto in sorted({(f, t) for _, f, _, t in finales_aristas}):
        lineas.append(f'  {fid}(["{texto}"])')
    for a, b, clave in sorted(aristas):
        lineas.append(f"  {nodo(a)} -->|{clave}| {nodo(b)}")
    for a, b, clave in sorted(cortes):
        lineas.append(f"  {nodo(a)} --x|corta: {clave}| {nodo(b)}")
    for a, fid, etapa, _ in sorted(finales_aristas):
        lineas.append(f"  {nodo(a)} -.->|{etapa}| {fid}")
    lineas += ["```", "", "## Decisiones", "",
               "Las historias con mas de un final. Cada camino dice la ultima eleccion antes del final (si hubo que elegir)",
               "y la condicion que lo decide (lo sorteado al empezar, quien murio, el tiempo...). Un renglon por camino.", ""]
    for a in arcos:
        if len(a["finales"]) < 2:
            continue
        lineas += [f"### {a['titulo']} (`{a['id']}`)", "",
                   "| Final | Como se llega | Deja | Lleva a |", "| --- | --- | --- | --- |"]
        for f in a["finales"]:
            dejas = sorted({f"`{c}` = {v}" for c, v, e, _ in a["deja"] if e == f})
            lleva = sorted({b for x, b, et in aristas if x == a["id"] and f in et.split(": ")[0].split(", ")}
                           | {t for x, _, e, t in finales_aristas if x == a["id"] and e == f})
            como = "<br>".join(decisiones(a, f)) or "-"
            lineas.append(f"| `{f}` | {como} | {', '.join(dejas) or '-'} | {', '.join(lleva) or '-'} |")
        lineas.append("")
    lineas += ["## Historias", "",
               "| Historia | Id | Como se lanza | Pide | Lo corta | Deja (memoria = valor, en que final) |",
               "| --- | --- | --- | --- | --- | --- |"]
    for a in arcos:
        como, pide, corta = lanzado(a)
        pide = sorted({nombre(p) for p in pide} | set(a["lee"]))
        dejas = [f"`{c}` = {v} ({e})" for c, v, e, _ in a["deja"]]
        lineas.append(f"| {a['titulo']} | `{a['id']}` | {como} | {', '.join('`' + p + '`' for p in pide) or '-'} | "
                      f"{', '.join('`' + nombre(p) + '`' for p in corta) or '-'} | {'<br>'.join(dejas) or '-'} |")

    # Memorias: lo que ven las historias mas lo que ve el escaner en todo el codigo.
    agrupado, _ = memorias.agrupar()
    piden = {}
    for a in arcos:
        _, pide, corta = lanzado(a)
        for clave in {p[0] if isinstance(p, tuple) else p for p in list(pide) + list(corta)} | set(a["lee"]):
            piden.setdefault(clave, set()).add(a["id"])
    filas = {}
    for clave in set(deja) | set(piden):
        e = memorias.entrada(clave) or clave
        fila = filas.setdefault(e, [set(), set()])
        fila[0].update(deja.get(clave, ()))
        fila[1].update(piden.get(clave, ()))
    for e in agrupado:
        filas.setdefault(e, [set(), set()])

    def fuera(archivos):
        return sorted({os.path.basename(x)[:-4] for x in archivos})

    def codigo(e):
        w, r, _ = agrupado.get(e, (set(), set(), set()))
        partes = []
        if fuera(w):
            partes.append("escribe: " + ", ".join(fuera(w)))
        if fuera(r):
            partes.append("lee: " + ", ".join(fuera(r)))
        return "; ".join(partes) or "-"

    lineas += ["", "## Memorias", "",
               "\"Archivos\" son todos los archivos del mod que la escriben o la leen (tambien servidor y conversaciones).", "",
               "| Memoria | Que guarda | La dejan | La piden | Archivos |", "| --- | --- | --- | --- | --- |"]
    for e in sorted(filas):
        dejan, pidenla = filas[e]
        lineas.append(f"| `{e}` | {memorias.MEMORIAS.get(e, '?')} | {', '.join(sorted(dejan)) or '-'} | "
                      f"{', '.join(sorted(pidenla)) or '-'} | {codigo(e)} |")
    pendientes = sorted((e, m) for e, m in memorias.SIN_LECTOR.items() if m.startswith("pendiente"))
    lineas += ["", "### Memorias sin usar", "",
               "Se escriben y nadie las lee todavia (ver `SIN_LECTOR` en `memorias.py`).", ""]
    lineas += [f"- `{e}`: {m[len('pendiente: '):]}" for e, m in pendientes]
    otras = sorted(e for e, m in memorias.SIN_LECTOR.items() if not m.startswith("pendiente"))
    lineas += ["", "Solo de registro: " + ", ".join(f"`{e}`" for e in otras) + "."]
    lineas += ["", "Encargos que se repiten (no son trama): " + ", ".join(f"`{r}`" for r in repetibles) + ".", ""]
    open(SALIDA, "w", encoding="utf-8").write("\n".join(lineas))
    print(f"{SALIDA}: {len(arcos)} historias, {len(aristas)} conexiones, {len(cortes)} cortes, "
          f"{len(finales_aristas)} desenlaces")
    errores = chequear_lanzadores(todos, caps)
    for e in errores:
        print("error:", e)
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
