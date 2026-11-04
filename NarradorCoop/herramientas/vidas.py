#!/usr/bin/env python3
"""Valida los secundarios y las piezas del generador de vidas, y escribe los datos para el juego.

Lee:
  - personajes/secundarios/datos/secundarios.json: los 100 vecinos hechos a mano (ver personajes/secundarios/).
  - personajes/secundarios/datos/piezas.json: las piezas por etapa con que el juego arma vecinos nuevos
    ({"piezas": [...], "etiquetas_nuevas": {...}}). Si no esta, sale sin piezas.
Revisa largos, tildes, marcadores, etiquetas, edades, oficios, pueblos y lazos con el reparto, y escribe
42/media/lua/shared/Narrador/NarradorVidasDatos.lua (no editarlo a mano). Si algo esta mal, sale con error
y no escribe nada. La simulacion de miles de vidas esta en herramientas/pruebas/prueba_vidas.lua.

Uso (desde la raiz del repo):  python3 NarradorCoop/herramientas/vidas.py
"""
import collections
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
DATOS = os.path.join(RAIZ, "personajes", "secundarios", "datos")
SALIDA = os.path.join(RAIZ, "42", "media", "lua", "shared", "Narrador", "NarradorVidasDatos.lua")

ETAPAS = ["origen", "infancia", "juventud", "adultez", "vejez", "oficio", "primera_noche", "despues",
          "secreto", "deseo", "voz"]
MAIN = set("cabo valentina chela eduardo nacho lucia rosa hector pereira vargas kell reyes duarte daniel_bell "
           "yvonne_bell wade_bell gladys hartmann duggan earl julio ray".split())
OFICIOS = set("mecanico enfermera granjero policia carpintero costurera cocinera camionero profesora cazador "
              "electricista pastora".split())
PUEBLOS = {"Muldraugh", "West Point", "Riverside", "Rosewood"}
ETIQUETAS = set("""
enfermizo_nino supero_enfermedad fuerte atleta lesion_pierna lesion_espalda lesion_mano sordo vista_mala asma
corazon diabetes cojo viejo_fragil
rural urbano louisville montana rio minero tabaco granja fort_knox inmigrante refugiado forastero nunca_salio
huerfano adoptado padre_violento familia_grande hijo_unico casado viudo divorciado separado con_hijos sin_hijos
hijo_muerto hijos_lejos cuida_a_alguien
sin_estudios secundaria universidad oficio_aprendido militar veterano_wwii veterano_corea veterano_vietnam marino
policia_pasado comerciante camionero_pasado fabrica iglesia_trabajo
religioso sin_fe catolico bautista metodista santidad alcohol sobrio apostador fumador
preso_pasado deudas pobre acomodado perdio_todo contrabando
solitario lider timido bromista rencoroso culpa mentiroso valiente cobarde
perdio_familia familia_viva sin_noticias vive_solo vive_con_otros cuida_ninos herido_brote mato_transformado
hambre trueque
""".split())
MARCADORES = {"o", "nino", "hijo", "el", "pueblo", "oficio", "ano_nac"}

# Textos de un secundario: largo maximo (la mudanza va en palabras).
TEXTOS_SEC = {"llegada": 120, "rescate": 120, "gracias": 120, "revelacion1": 200, "revelacion2": 200,
              "revelacion3": 220, "diario_conocer": 160, "diario_final": 160, "mudanza": None, "muerte": 140}
CLAVES_SEC = ["id", "nombre", "apellido", "apodo", "sexo", "edad", "pueblo", "oficio", "resumen", "etiquetas",
              "lazos", "vive", "textos"]
CLAVES_PIEZA = ["id", "etapa", "da", "pide", "pide_alguno", "prohibe", "quita", "edad_min", "edad_max", "sexo",
                "oficios", "pueblos", "lazo", "peso"]
LISTAS_PIEZA = ["da", "pide", "pide_alguno", "prohibe", "quita"]
# Lo minimo por etapa para que el generador tenga de donde elegir.
MINIMO = {"origen": 6, "infancia": 8, "juventud": 8, "adultez": 8, "vejez": 5, "oficio": 12, "primera_noche": 7,
          "despues": 7, "secreto": 7, "deseo": 5, "voz": 4}

errores = []


def mal(msg):
    errores.append(msg)


def revisar_texto(donde, s, maximo, marcadores=False):
    if not isinstance(s, str) or not s.strip():
        mal(f"{donde}: vacio")
        return
    if maximo is not None and len(s) > maximo:
        mal(f"{donde}: {len(s)} caracteres (maximo {maximo})")
    raros = sorted(set(c for c in s if ord(c) > 127))
    if raros:
        mal(f"{donde}: caracteres fuera de ASCII {''.join(raros)!r}")
    if re.search(r"\banos?\b", re.sub(r"\{[^}]*\}", "", s)):
        mal(f"{donde}: dice 'ano' (sin la ene cambia el sentido)")
    for m in re.findall(r"\{([^}]*)\}", s):
        if not marcadores:
            mal(f"{donde}: no puede llevar marcadores ({{{m}}})")
        elif m not in MARCADORES and not re.fullmatch(r"ano\+\d+", m):
            mal(f"{donde}: marcador desconocido {{{m}}}")


def revisar_secundarios(lista):
    vistos = set()
    for o in lista:
        i = o.get("id", "?")
        if i in vistos:
            mal(f"{i}: id repetido")
        vistos.add(i)
        if sorted(o) != sorted(CLAVES_SEC):
            mal(f"{i}: claves distintas a las pedidas ({sorted(set(o) ^ set(CLAVES_SEC))})")
            continue
        if o["sexo"] not in ("h", "m"):
            mal(f"{i}: sexo {o['sexo']!r}")
        if not isinstance(o["edad"], int) or not 18 <= o["edad"] <= 95:
            mal(f"{i}: edad {o['edad']!r}")
        if o["pueblo"] not in PUEBLOS:
            mal(f"{i}: pueblo {o['pueblo']!r}")
        if o["oficio"] not in OFICIOS:
            mal(f"{i}: oficio {o['oficio']!r}")
        if not any(l.get("con") in MAIN for l in o["lazos"]):
            mal(f"{i}: sin lazo con el reparto principal")
        for l in o["lazos"]:
            if l.get("con") not in MAIN and l.get("con") != "otro":
                mal(f"{i}: lazo con {l.get('con')!r}")
        for k in ("nombre", "apellido", "apodo"):
            revisar_texto(f"{i}.{k}", o[k] or "x", 40)
        for k, maximo in TEXTOS_SEC.items():
            s = o["textos"].get(k)
            revisar_texto(f"{i}.{k}", s, maximo)
            if k == "mudanza" and isinstance(s, str) and not 80 <= len(s.split()) <= 135:
                mal(f"{i}.mudanza: {len(s.split())} palabras (80 a 130)")
    return len(vistos)


def revisar_piezas(piezas, nuevas):
    etiquetas = ETIQUETAS | set(nuevas)
    ids, por_etapa, lazos, oficios = set(), collections.Counter(), collections.Counter(), set()
    for p in piezas:
        i = p.get("id", "?")
        if i in ids:
            mal(f"{i}: id repetido")
        ids.add(i)
        e = p.get("etapa")
        if e not in ETAPAS:
            mal(f"{i}: etapa {e!r}")
            continue
        por_etapa[e] += 1
        faltan = [k for k in CLAVES_PIEZA if k not in p]
        if faltan:
            mal(f"{i}: faltan {faltan}")
            continue
        for k in LISTAS_PIEZA:
            if not isinstance(p[k], list):
                mal(f"{i}.{k}: no es lista")
                continue
            for t in p[k]:
                if t not in etiquetas:
                    mal(f"{i}.{k}: etiqueta desconocida {t!r}")
        a, b = p["edad_min"], p["edad_max"]
        if not (isinstance(a, int) and isinstance(b, int) and 18 <= a <= b <= 85):
            mal(f"{i}: edades {a}-{b}")
        if p["sexo"] not in (None, "h", "m"):
            mal(f"{i}: sexo {p['sexo']!r}")
        if p["oficios"] is not None:
            for o in p["oficios"]:
                if o not in OFICIOS:
                    mal(f"{i}: oficio {o!r}")
                oficios.add(o)
        elif e == "oficio":
            mal(f"{i}: pieza de oficio sin 'oficios'")
        if p["pueblos"] is not None and any(x not in PUEBLOS for x in p["pueblos"]):
            mal(f"{i}: pueblos {p['pueblos']}")
        if p["lazo"] is not None:
            if p["lazo"] not in MAIN:
                mal(f"{i}: lazo {p['lazo']!r}")
            lazos[p["lazo"]] += 1
        if not isinstance(p["peso"], (int, float)) or p["peso"] <= 0:
            mal(f"{i}: peso {p['peso']!r}")
        if e == "voz":
            for k, maximo in (("llegada", 120), ("rescate", 120), ("gracias", 120), ("muerte", 140)):
                revisar_texto(f"{i}.{k}", p.get(k), maximo, True)
        else:
            revisar_texto(f"{i}.texto", p.get("texto"), 220 if e == "secreto" else 200, True)
        if e == "secreto":
            revisar_texto(f"{i}.diario", p.get("diario"), 160, True)
        if re.search(r"Corea|Vietnam|Segunda Guerra", json.dumps(p)) and b - a > 30:
            mal(f"{i}: nombra una guerra con un rango de edad muy ancho ({a}-{b})")
    if piezas:
        for e, m in MINIMO.items():
            if por_etapa[e] < m:
                mal(f"etapa {e}: {por_etapa[e]} piezas (minimo {m})")
        if OFICIOS - oficios:
            mal(f"oficios sin pieza: {sorted(OFICIOS - oficios)}")
    return por_etapa, lazos


# ---------------------------------------------------------------------------
# Salida en Lua
# ---------------------------------------------------------------------------

def lua(v):
    if v is None:
        return "nil"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, str):
        return '"' + v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'
    if isinstance(v, list):
        return "{" + ", ".join(lua(x) for x in v) + "}"
    if isinstance(v, dict):
        partes = []
        for k, x in v.items():
            if x is None or x == []:
                continue
            clave = k if re.fullmatch(r"[A-Za-z_]\w*", k) else "[" + lua(k) + "]"
            partes.append(f"{clave} = {lua(x)}")
        return "{ " + ", ".join(partes) + " }"
    raise TypeError(type(v))


def escribir(secundarios, piezas, nuevas):
    lineas = [
        "-- Narrador Co-op: datos del generador de vidas. ARCHIVO GENERADO por herramientas/vidas.py desde",
        "-- personajes/secundarios/datos/*.json: no editarlo a mano. Lo usa server/Narrador/NarradorVidas.lua.",
        "-- Textos sin tildes a proposito.",
        "",
        "Narrador = Narrador or {}",
        "Narrador.VidasDatos = {}",
        "local D = Narrador.VidasDatos",
        "",
        "-- Los vecinos hechos a mano: id, nombre, sexo, edad (julio de 1993), pueblo, oficio, lazos y textos.",
        "D.SECUNDARIOS = {",
    ]
    for o in secundarios:
        x = {"id": o["id"], "nombre": o["nombre"], "apellido": o["apellido"], "apodo": o["apodo"] or None,
             "sexo": o["sexo"], "edad": o["edad"], "pueblo": o["pueblo"], "oficio": o["oficio"],
             "vive": o["vive"], "lazos": sorted(set(l["con"] for l in o["lazos"] if l["con"] in MAIN)),
             "textos": {k: o["textos"][k] for k in TEXTOS_SEC}}
        lineas.append("    " + lua(x) + ",")
    lineas += ["}", "", "-- Piezas por etapa (ver personajes/secundarios/README.md).", "D.PIEZAS = {"]
    orden = {e: n for n, e in enumerate(ETAPAS)}
    for p in sorted(piezas, key=lambda p: (orden[p["etapa"]], p["id"])):
        x = {k: p[k] for k in ["id", "etapa"]}
        for k in ("texto", "diario", "llegada", "rescate", "gracias", "muerte"):
            if p.get(k) is not None:
                x[k] = p[k]
        for k in CLAVES_PIEZA[2:]:
            if k == "peso" and p[k] == 10:
                continue
            x[k] = p[k]
        lineas.append("    " + lua(x) + ",")
    # Edad minima de cada oficio segun sus piezas que valen en cualquier pueblo (no hay policias de 18):
    # el motor no arma vecinos mas jovenes.
    minimos = {}
    for p in piezas:
        if p["etapa"] == "oficio" and p["pueblos"] is None:
            for o in p["oficios"]:
                minimos[o] = min(minimos.get(o, 99), p["edad_min"])
    lineas += ["}", "", "D.EDAD_MIN_OFICIO = " + lua(dict(sorted(minimos.items()))),
               "D.ETIQUETAS_NUEVAS = " + lua(sorted(nuevas)), ""]
    texto = "\n".join(lineas)
    with open(SALIDA, "w", encoding="utf-8", newline="\n") as f:
        f.write(texto)


def main():
    secundarios = json.load(open(os.path.join(DATOS, "secundarios.json"), encoding="utf-8"))
    ruta_piezas = os.path.join(DATOS, "piezas.json")
    piezas, nuevas = [], {}
    if os.path.exists(ruta_piezas):
        crudo = json.load(open(ruta_piezas, encoding="utf-8"))
        piezas, nuevas = crudo.get("piezas", []), crudo.get("etiquetas_nuevas", {})
    n = revisar_secundarios(secundarios)
    por_etapa, lazos = revisar_piezas(piezas, nuevas)
    if errores:
        print("\n".join(errores))
        print(f"FALLOS: {len(errores)}")
        return 1
    escribir(secundarios, piezas, nuevas)
    con_lazo = sum(lazos.values())
    print(f"{n} secundarios, {len(piezas)} piezas ({dict(por_etapa)}), {con_lazo} piezas con lazo")
    print(f"Escrito {os.path.relpath(SALIDA, os.path.dirname(RAIZ))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
