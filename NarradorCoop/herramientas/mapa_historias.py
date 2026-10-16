#!/usr/bin/env python3
"""Genera NarradorCoop/MAPA_HISTORIAS.md: que historia abre a cual y por que memoria.

Lee los arcos (shared/Narrador/Arcos/*.lua) con un interprete de Lua (lupa) y saca de cada uno:
  - quien lo lanza (el director, otro arco con "abrir", un capitulo de G.ESPECIALES o un lanzador
    del servidor de la lista LANZADORES de abajo, que hay que mantener a mano),
  - las memorias que pide (condiciones "mem", "memoria", "misionero_muerto", vars_desde_memoria),
  - las memorias que deja cada final ("memoria", "sumar_memoria").
Con eso arma un diagrama mermaid (GitHub lo dibuja) y una tabla por historia.

Uso (desde la raiz del repo):  pip install lupa  &&  python3 NarradorCoop/herramientas/mapa_historias.py
"""
import os
import re
import sys

import lupa

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../NarradorCoop
LUA = os.path.join(RAIZ, "42", "media", "lua")
SALIDA = os.path.join(RAIZ, "MAPA_HISTORIAS.md")

# Historias que lanza el servidor por su cuenta (no con "abrir" ni como capitulo).
# def -> (como se lanza, memorias que mira el lanzador). Una memoria es "clave" (cualquier valor)
# o ("clave", "valor") cuando el lanzador espera un valor justo.
LANZADORES = {
    "bandido_1": ("Knox llega a -5 (NarradorBandido)", ["knox_bandido_<grupo>"]),
    "bandido_2": ("volver al patio de trenes (NarradorBandido)", [("bandido_cap", "1")]),
    "bandido_3": ("volver al patio de trenes (NarradorBandido)", [("bandido_cap", "2")]),
    "bandido_4": ("volver al patio de trenes (NarradorBandido)", [("bandido_cap", "3")]),
    "bandido_5": ("volver al patio de trenes (NarradorBandido)", [("bandido_cap", "4")]),
    "bandido_castigo": ("al volver al patio, 30% por sabotaje (NarradorBandido)", ["bandido_sospecha"]),
    "bandido_maulen": ("72 horas despues de perdonar a Maulen (NarradorBandido)", ["maulen_salvado"]),
    "conquista_sous": ("con Maulen de jefe y Sous aliado (NarradorBandido)", [("bandido", "pereira"), ("sous", "aliados"), "maulen_salvado"]),
    "conquista_muldraugh": ("despues del cap. 5 con el jefe (NarradorBandido)", [("bandido", "pereira")]),
    "conquista_westpoint": ("al entrar a West Point (NarradorBandido)", ["conquista_muldraugh"]),
    "conquista_riverside": ("al entrar a Riverside (NarradorBandido)", ["conquista_muldraugh"]),
    "conquista_rosewood": ("al entrar a Rosewood (NarradorBandido)", ["conquista_muldraugh"]),
    "eduardo_atentado": ("3 veces, cada 48 horas (NarradorBandido)", ["knox_conquistado"]),
    "eduardo_fallas": ("despues del tercer atentado (NarradorBandido)", [("eduardo_nota", "true")]),
    "reconquista_muldraugh": ("al entrar a Muldraugh (NarradorBandido)", [("reconquista", "true")]),
    "reconquista_westpoint": ("al entrar a West Point (NarradorBandido)", [("reconquista", "true")]),
    "reconquista_riverside": ("al entrar a Riverside (NarradorBandido)", [("reconquista", "true")]),
    "reconquista_rosewood": ("al entrar a Rosewood (NarradorBandido)", [("reconquista", "true")]),
    "reconquista_patio": ("con las 4 ciudades reconquistadas (NarradorBandido)",
                          ["reconquista_muldraugh", "reconquista_westpoint", "reconquista_riverside", "reconquista_rosewood"]),
    "eduardo_evento": ("tirada diaria (NarradorEduardo)", ["tomas_conocido"]),
    "tomas_vuelve": ("al pasar por el cuartel de la Chela (NarradorContactos)", ["caido_tomas"]),
    "desbloqueo_muldraugh": ("al andar por Muldraugh (NarradorContactos)", []),
    "desbloqueo_westpoint": ("al andar por West Point (NarradorContactos)", []),
    "desbloqueo_riverside": ("al andar por Riverside (NarradorContactos)", []),
    "desbloqueo_rosewood": ("al andar por Rosewood (NarradorContactos)", []),
    "cal_fonda": ("18 de septiembre, con Sous aliado (NarradorCalendario)", [("sous", "aliados")]),
    "cal_amigo_secreto": ("24 de diciembre, con Sous aliado (NarradorCalendario)", [("sous", "aliados")]),
    "encargo_cura": ("pedirle 'algo especial' a un misionero, cada 20 dias (NarradorCuraServer)", []),
}
for rol in ["benjamin", "martin_z", "martin_a", "david", "bastian", "hanz", "cristian", "jorge", "cristobal"]:
    LANZADORES["favor_" + rol] = ("pedirle el favor en la base de Sous (FavoresSous)", [("sous", "aliados")])

# Memorias que deja el codigo del servidor (no una accion de un arco): clave -> arcos que la causan.
SERVIDOR_DEJA = {
    "knox_conquistado": ["conquista_westpoint", "conquista_riverside", "conquista_rosewood"],
    "caido_tomas": ["leyenda_tomas", "eduardo_evento"],
}

# Arcos que se repiten sin fin y no son parte de la trama: van en una linea al final.
REPETIBLES = ("encargo_", "enc_", "inmoral_", "recado_")


def especiales():
    """Capitulos de G.ESPECIALES: def -> (contacto, capitulo, requiere, hecho)."""
    ruta = os.path.join(LUA, "server", "Narrador", "NarradorGenerador.lua")
    texto = open(ruta, encoding="utf-8").read()
    caps = {}
    patron = re.compile(r'\{\s*def = "([^"]+)", contacto = "([^"]+)", capitulo = (\d+), requiere = "([^"]+)",\s*hecho = "([^"]+)"')
    for d, c, n, req, hecho in patron.findall(texto):
        caps[d] = (c, int(n), req, hecho)
    return caps


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
    analizar = lua.execute(r'''
    return function()
      local out = {}
      local function esLista(t) return type(t) == "table" and type(t[1]) == "string" end
      local function recorrer(x, f, vistos)
        if type(x) ~= "table" or vistos[x] then return end
        vistos[x] = true
        if esLista(x) then f(x) end
        for _, v in pairs(x) do recorrer(v, f, vistos) end
      end
      for _, def in ipairs(Narrador.Defs.todos()) do
        local titulo = tostring(def.titulo or def.id)
        if string.find(titulo, "{", 1, true) then titulo = tostring(def.titulo_menu or def.id) end
        local d = { id = def.id, titulo = titulo, auto = def.automatico ~= false,
                    lee = {}, abre = {}, deja = {} }
        for _, k in ipairs(def.vars_desde_memoria or {}) do d.lee[#d.lee + 1] = k end
        for nombre, etapa in pairs(def.etapas) do
          local final = etapa.final == true
          recorrer(etapa, function(a)
            local t = a[1]
            if (t == "mem" or t == "memoria") and type(a[2]) == "string" then d.lee[#d.lee + 1] = a[2]
            elseif t == "misionero_muerto" then d.lee[#d.lee + 1] = "misionero_muerto_" .. tostring(a[2])
            elseif t == "abrir" and a.def then d.abre[#d.abre + 1] = a.def
            elseif (t == "memoria" or t == "sumar_memoria") and type(a.clave) == "string" then
              local v = a.valor
              if type(v) ~= "string" and type(v) ~= "number" and type(v) ~= "boolean" then v = "?" end
              d.deja[#d.deja + 1] = { clave = a.clave, valor = tostring(v), etapa = nombre, final = final }
            end
          end, {})
        end
        out[#out + 1] = d
      end
      return out
    end''')
    arcos = []
    for d in analizar().values():
        arcos.append({
            "id": d.id, "titulo": d.titulo, "auto": d.auto,
            "lee": sorted(set(d.lee.values())),
            "abre": sorted(set(d.abre.values())),
            "deja": [(x.clave, x.valor, x.etapa, x.final) for x in d.deja.values()],
        })
    return arcos


def nodo(i):
    return re.sub(r"[^A-Za-z0-9_]", "_", i)


def main():
    caps = especiales()
    arcos = [a for a in cargar() if not a["id"].startswith(REPETIBLES)]
    repetibles = sorted({re.sub(r"_(facil|medio|dificil|ultra|[a-z]+)$", "", a["id"]) for a in cargar() if a["id"].startswith(REPETIBLES)})
    por_id = {a["id"]: a for a in arcos}
    abierto_por = {}
    for a in arcos:
        for b in a["abre"]:
            abierto_por.setdefault(b, []).append(a["id"])

    def lanzado(a):
        if a["id"] in caps:
            c, n, req, _ = caps[a["id"]]
            return f"capitulo {n} de {c}, entre sus ofertas", [req]
        if a["id"] in LANZADORES:
            return LANZADORES[a["id"]]
        if a["id"] in abierto_por:
            return "lo abre " + ", ".join(abierto_por[a["id"]]), []
        if a["auto"]:
            return "el director (al azar, segun tension)", []
        return "sin lanzador conocido (admin)", []

    # Quien deja cada memoria.
    deja, deja_valor = {}, {}
    for a in arcos:
        for clave, valor, _, _ in a["deja"]:
            deja.setdefault(clave, set()).add(a["id"])
            deja_valor.setdefault((clave, valor), set()).add(a["id"])
    for d, (_, _, _, hecho) in caps.items():
        deja.setdefault(hecho, set()).add(d)
    for clave, ids in SERVIDOR_DEJA.items():
        deja.setdefault(clave, set()).update(ids)

    def quienes(p):
        if isinstance(p, tuple):
            return deja_valor.get(p, set())
        return deja.get(p, set())

    def nombre(p):
        return f"{p[0]} = {p[1]}" if isinstance(p, tuple) else p

    # Aristas: A deja una memoria que B necesita para lanzarse; o A abre B.
    aristas = set()
    for b in arcos:
        _, pide = lanzado(b)
        for p in pide:
            for a in quienes(p):
                if a != b["id"]:
                    aristas.add((a, b["id"], nombre(p)))
        for a in abierto_por.get(b["id"], ()):
            aristas.add((a, b["id"], "abre"))

    lineas = ["# Mapa de historias", "",
              "Generado por `NarradorCoop/herramientas/mapa_historias.py` a partir de los arcos. No editar a mano:",
              "se vuelve a generar con `python3 NarradorCoop/herramientas/mapa_historias.py` (necesita `pip install lupa`).",
              "Los lanzadores del servidor estan en la lista `LANZADORES` del script; si se agrega uno, se agrega ahi.", "",
              "## Diagrama", "", "Cada flecha dice que memoria deja una historia para que se abra la siguiente.", "",
              "```mermaid", "flowchart LR"]
    usados = {x for a, b, _ in aristas for x in (a, b)}
    for a in arcos:
        if a["id"] in usados:
            lineas.append(f'  {nodo(a["id"])}["{a["titulo"].replace(chr(34), "")}"]')
    for a, b, clave in sorted(aristas):
        lineas.append(f"  {nodo(a)} -->|{clave}| {nodo(b)}")
    lineas += ["```", "", "## Historias", "",
               "| Historia | Id | Como se lanza | Pide | Deja (memoria = valor, en que final) |",
               "| --- | --- | --- | --- | --- |"]
    for a in sorted(arcos, key=lambda x: x["id"]):
        como, pide = lanzado(a)
        pide = sorted({nombre(p) for p in pide} | set(a["lee"]))
        dejas = [f"`{c}` = {v} ({e})" for c, v, e, _ in sorted(set(a["deja"]))]
        lineas.append(f"| {a['titulo']} | `{a['id']}` | {como} | {', '.join('`' + p + '`' for p in pide) or '-'} | "
                      f"{'<br>'.join(dejas) or '-'} |")
    lineas += ["", "## Memorias", "", "| Memoria | La dejan | La piden |", "| --- | --- | --- |"]
    piden = {}
    for a in arcos:
        _, pide = lanzado(a)
        for clave in {p[0] if isinstance(p, tuple) else p for p in pide} | set(a["lee"]):
            piden.setdefault(clave, set()).add(a["id"])
    for clave in sorted(set(deja) | set(piden)):
        lineas.append(f"| `{clave}` | {', '.join(sorted(deja.get(clave, ()))) or '-'} | "
                      f"{', '.join(sorted(piden.get(clave, ()))) or '-'} |")
    lineas += ["", "Encargos que se repiten (no son trama): " + ", ".join(f"`{r}`" for r in repetibles) + ".", ""]
    open(SALIDA, "w", encoding="utf-8").write("\n".join(lineas))
    print(f"{SALIDA}: {len(arcos)} historias, {len(aristas)} conexiones")


if __name__ == "__main__":
    sys.exit(main())
