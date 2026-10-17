"""Busca en todo el Lua del mod quien escribe y quien lee cada memoria de la partida.

La memoria de la partida es `Motor.estado().memoria` (en el codigo tambien `st.memoria` o un
alias local como `local m = Motor.estado().memoria`). Se escribe y se lee de varias formas:

  arcos:     { "memoria", clave = "x", valor = ... }   { "sumar_memoria", clave = "x" }
             { "mem", "x" }   { "memoria", "x", valor }   { "misionero_muerto", "id" }
             vars_desde_memoria = { "x", ... }
             { "memoria_lugar", clave = "x" } / { "lugar_memoria", clave = "x" }  (clave "lugar.x")
  capitulos: G.ESPECIALES en NarradorGenerador.lua (requiere = "x", hecho = "x")
  servidor:  memoria["x"]  memoria.x  m["x"]  m.x  (con "=" escribe; si no, lee)

Las claves armadas ("favor_" .. rol) salen como patron: "favor_<rol>". El escaner trabaja sobre
el texto (sin interprete) para ver tambien el codigo del servidor y del cliente.
"""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../NarradorCoop
LUA = os.path.join(RAIZ, "42", "media", "lua")

CADENA = r'"([^"]*)"'
# Una clave: literal ("x") o armada ("x_" .. algo [.. "_y"]). Devuelve el patron con <...>.
PIEZA = r'(?:"[^"]*"|[A-Za-z_][\w.]*(?:\[[^\[\]]*\])?(?:\([^()]*\))?)'
CLAVE = r"(" + PIEZA + r"(?:\s*\.\.\s*" + PIEZA + r")*)"


def patron(expr):
    """'"favor_" .. rol' -> 'favor_<rol>'; '"x"' -> 'x'."""
    partes = re.split(r"\s*\.\.\s*", expr.strip())
    out = []
    for p in partes:
        if p.startswith('"'):
            # "cura_{contacto}": la accion memoria rellena {var} (Motor.texto).
            out.append(re.sub(r"\{(\w+)\}", r"<\1>", p.strip('"')))
        else:
            p = re.sub(r"^tostring\((.*)\)$", r"\1", p)
            nombres = re.findall(r"[A-Za-z_]\w*", re.sub(r"\[.*?\]", "", p))
            out.append("<" + (nombres[-1] if nombres else "x") + ">")
    return "".join(out) if '"' in expr else None


def sin_comentarios(texto):
    texto = re.sub(r"--\[(=*)\[.*?\]\1\]", "", texto, flags=re.S)
    lineas = []
    for l in texto.split("\n"):
        comillas, i = None, 0
        while i < len(l):
            ch = l[i]
            if comillas:
                if ch == "\\":
                    i += 1
                elif ch == comillas:
                    comillas = None
            elif ch in "\"'":
                comillas = ch
            elif l.startswith("--", i):
                l = l[:i]
                break
            i += 1
        lineas.append(l)
    return "\n".join(lineas)


def archivos():
    for raiz, _, nombres in os.walk(LUA):
        for n in sorted(nombres):
            if n.endswith(".lua"):
                yield os.path.join(raiz, n)


def escanear():
    """Devuelve (escribe, lee): clave -> set de archivos (relativos a lua/)."""
    escribe, lee = {}, {}

    def anotar(d, clave, ruta):
        if clave:
            d.setdefault(clave, set()).add(os.path.relpath(ruta, LUA).replace(os.sep, "/"))

    for ruta in archivos():
        texto = sin_comentarios(open(ruta, encoding="utf-8").read())
        alias = set(re.findall(r"local\s+(\w+)\s*=\s*[\w.()]*memoria\s*$", texto, flags=re.M))
        # Acciones y condiciones de los arcos.
        for m in re.finditer(r'\{\s*"(memoria|sumar_memoria)"\s*,[^{}]*?\bclave\s*=\s*' + CLAVE, texto):
            anotar(escribe, patron(m.group(2)), ruta)
        for m in re.finditer(r'\{\s*"(memoria_lugar|lugar_memoria)"\s*,[^{}]*?\bclave\s*=\s*' + CLAVE, texto):
            anotar(escribe if m.group(1) == "memoria_lugar" else lee, "lugar." + patron(m.group(2)), ruta)
        for m in re.finditer(r'\{\s*"(mem|memoria)"\s*,\s*' + CLAVE, texto):
            anotar(lee, patron(m.group(2)), ruta)
        for m in re.finditer(r'\{\s*"misionero_muerto"\s*,\s*' + CADENA, texto):
            anotar(lee, "misionero_muerto_" + m.group(1), ruta)
        # Reglas de datos { murio = { "clave", valor } }: se lee esa memoria.
        for m in re.finditer(r'\bmurio\s*=\s*\{\s*' + CADENA, texto):
            anotar(lee, m.group(1), ruta)
        for m in re.finditer(r"vars_desde_memoria\s*=\s*\{([^}]*)\}", texto):
            for c in re.findall(CADENA, m.group(1)):
                anotar(lee, c, ruta)
        # Capitulos de G.ESPECIALES.
        for m in re.finditer(r'\{\s*def\s*=\s*"[^"]+",[^{}]*', texto):
            bloque = m.group(0)
            if "capitulo" not in bloque:
                continue
            for campo, d in (("requiere", lee), ("hecho", escribe)):
                c = re.search(campo + r"\s*=\s*" + CADENA, bloque)
                if c:
                    anotar(d, c.group(1), ruta)
        # Acceso directo a la tabla: memoria["x"], memoria["x_" .. id], memoria.x. Cuenta
        # "st.memoria" o "Motor.estado().memoria" (no un parametro que se llame memoria) y los
        # alias locales ("local m = Motor.estado().memoria") hasta el "end" de su funcion.
        regiones = [(r"(?<=[\w)])\.memoria", 0, len(texto))]
        for m in re.finditer(r"local\s+(\w+)\s*=\s*[\w.()]*\.memoria\s*$", texto, flags=re.M):
            fin = re.compile(r"^end\b", re.M).search(texto, m.end())
            regiones.append((r"(?<![\w.])" + m.group(1), m.end(), fin.start() if fin else len(texto)))
        # Funciones que reciben ese alias como parametro: "function BA.revisarConquista(m)".
        for nombre in {re.escape(r[0][len(r"(?<![\w.])"):]) for r in regiones[1:]}:
            for m in re.finditer(r"function\s*[\w.:]*\(([^)]*)\)", texto):
                if re.search(r"(?<!\w)" + nombre + r"(?!\w)", m.group(1)):
                    fin = re.compile(r"^end\b", re.M).search(texto, m.end())
                    regiones.append((r"(?<![\w.])" + nombre, m.end(), fin.start() if fin else len(texto)))
        for tabla, desde, hasta in regiones:
            acceso = re.compile(tabla + r"(?:\[" + CLAVE + r"\]|\.([A-Za-z_]\w*))(?!\s*\()")
            for m in acceso.finditer(texto, desde, hasta):
                clave = patron(m.group(1)) if m.group(1) else m.group(2)
                linea = texto[m.end():texto.find("\n", m.end())]
                # "m.x = ..." escribe; "m.x, m.y = a, b" tambien; "==" y lo demas lee.
                escritura = re.match(r"\s*=(?!=)", linea) or re.match(r"\s*,[\w\s.,\[\]\"]*=(?!=)", linea)
                anotar(escribe if escritura else lee, clave, ruta)
    return escribe, lee


def coincide(a, b):
    """Dos claves (con o sin <...>) pueden ser la misma: "favor_<rol>" y "favor_hanz" si."""
    def rx(p):
        partes = re.split(r"<[^>]+>", p)
        return re.compile("^" + ".+".join(re.escape(x) for x in partes) + "$")
    def fija(p):
        return re.sub(r"<[^>]+>", "X", p)
    return a == b or rx(a).match(fija(b)) is not None or rx(b).match(fija(a)) is not None
