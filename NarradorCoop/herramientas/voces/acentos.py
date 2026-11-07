#!/usr/bin/env python3
"""Tildes, enies y signos de apertura para el texto que va a ElevenLabs.

El mod escribe sin tildes a proposito (el juego no siempre las muestra), pero la voz las necesita
para pronunciar bien ("manana" -> "mañana", "esta" -> "está"). Hay dos capas:

1. textos_voz.json: el texto revisado a mano, frase por frase (clave = id del texto original):
   {"original", "voz" (con tildes), "emocion" (ademas con etiquetas de emocion para v3/v4)}.
   Es lo que manda. Ver exportar.py --pendientes para sacar las frases nuevas sin revisar.
2. corregir(): un arreglo automatico basico (palabras sin ambiguedad + signos de apertura) para
   las frases que todavia no estan revisadas. No resuelve esta/está, el/él, si/sí, llego/llegó...
"""
import hashlib
import json
import os
import re

AQUI = os.path.dirname(os.path.abspath(__file__))
REVISADOS = os.path.join(AQUI, "textos_voz.json")

# Palabras que siempre llevan tilde o enie (en minuscula). Sin las ambiguas.
SIEMPRE = {
    "aca": "acá", "ahi": "ahí", "alla": "allá", "aqui": "aquí", "asi": "así", "atras": "atrás", "detras": "detrás",
    "despues": "después", "tambien": "también", "todavia": "todavía", "demas": "demás", "quizas": "quizás",
    "ojala": "ojalá", "recien": "recién", "mas": "más", "algun": "algún", "ningun": "ningún",
    "manana": "mañana", "ano": "año", "anos": "años", "nino": "niño", "nina": "niña", "ninos": "niños", "ninas": "niñas",
    "senor": "señor", "senora": "señora", "senal": "señal", "sueno": "sueño", "dano": "daño", "carino": "cariño",
    "tamano": "tamaño", "panuelo": "pañuelo", "senuelo": "señuelo", "rasguno": "rasguño", "cabana": "cabaña",
    "extrano": "extraño", "extrana": "extraña", "ensenar": "enseñar", "pequeno": "pequeño",
    "pequena": "pequeña", "companero": "compañero", "companera": "compañera", "mama": "mamá", "papa": "papá", "tia": "tía", "tio": "tío", "tias": "tías", "tios": "tíos",
    "dia": "día", "dias": "días", "policia": "policía", "comisaria": "comisaría", "carcel": "cárcel",
    "camion": "camión", "capitan": "capitán", "corazon": "corazón", "razon": "razón", "perdon": "perdón",
    "mision": "misión", "decision": "decisión", "direccion": "dirección", "atencion": "atención",
    "cancion": "canción", "estacion": "estación", "situacion": "situación", "informacion": "información",
    "heroe": "héroe", "heroes": "héroes", "facil": "fácil", "dificil": "difícil", "rapido": "rápido",
    "rapida": "rápida", "ultimo": "último", "ultima": "última", "unico": "único", "unica": "única",
    "proximo": "próximo", "proxima": "próxima", "numero": "número", "pagina": "página", "linea": "línea",
    "musica": "música", "medico": "médico", "maquina": "máquina", "telefono": "teléfono", "sotano": "sótano",
    "boveda": "bóveda", "cafe": "café", "azucar": "azúcar", "atun": "atún", "futbol": "fútbol", "rio": "río",
    "frio": "frío", "fria": "fría", "mio": "mío", "mia": "mía", "mios": "míos", "mias": "mías",
    "veintidos": "veintidós", "cumpleanos": "cumpleaños", "angel": "Ángel", "cristobal": "Cristóbal",
    "ramon": "Ramón", "lucia": "Lucía", "bastian": "Bastián", "martin": "Martín", "cristian": "Cristián",
    "maipu": "Maipú", "nacion": "nación", "tecnica": "técnica", "logica": "lógica", "clasico": "clásico",
    "minimo": "mínimo", "minimas": "mínimas", "lastima": "lástima", "capitulo": "capítulo",
    "habia": "había", "tenia": "tenía", "sabia": "sabía", "podia": "podía", "queria": "quería", "decia": "decía",
    "hacia": "hacía", "venia": "venía", "vivia": "vivía", "creia": "creía", "conocia": "conocía", "debia": "debía",
    "habian": "habían", "tenian": "tenían", "sabian": "sabían", "podian": "podían", "decian": "decían",
    "estan": "están", "estas": "estás", "esta": "está",  # "esta" se corrige solo antes de ciertos casos, ver abajo
    "murio": "murió", "salio": "salió", "volvio": "volvió", "pidio": "pidió", "perdio": "perdió",
    "conocio": "conoció", "aprendio": "aprendió", "entendio": "entendió", "prometio": "prometió",
    "cayo": "cayó", "leyo": "leyó", "oyo": "oyó", "huyo": "huyó",
    "encontro": "encontró", "empezo": "empezó",
}
# "esta"/"estas" solo llevan tilde si no van antes de un sustantivo; casi siempre es el verbo cuando
# va al final o antes de estas palabras.
ESTA_VERBO = re.compile(r"\b([Ee])sta(s?)\b(?=\s*(?:[.,!?;:]|$|bien|mal|aca|aqui|alla|ahi|lleno|llena|vivo|viva|"
                        r"muerto|muerta|listo|lista|seguro|segura|cerrad|abiert|loco|loca|en\b|con\b|por\b|muy\b|"
                        r"todo\b|claro|\w+ndo\b|\w+ado\b|\w+ada\b|\w+ido\b|\w+ida\b))")
INTERROGATIVOS = {"que": "qué", "como": "cómo", "donde": "dónde", "cuando": "cuándo", "quien": "quién",
                  "quienes": "quiénes", "cuanto": "cuánto", "cuanta": "cuánta", "cuantos": "cuántos", "cual": "cuál"}


def ident(texto):
    """Id estable de una frase: los primeros 10 de su sha1."""
    return hashlib.sha1(texto.encode("utf-8")).hexdigest()[:10]


def revisados():
    if not os.path.exists(REVISADOS):
        return {}
    return json.load(open(REVISADOS, encoding="utf-8"))


def _palabra(m):
    w = m.group(0)
    r = SIEMPRE.get(w.lower())
    if r is None or w.lower() in ("esta", "estas"):
        return w
    if w[0].isupper():
        r = r[0].upper() + r[1:]
    return r


def _abrir(oracion):
    """Agrega ¿ y ¡ al comienzo de una oracion que termina en ? o !, y la tilde del interrogativo."""
    s = oracion.strip()
    if not s:
        return oracion
    if s.endswith("?") and not s.startswith("¿"):
        primera = re.match(r"(\w+)", s)
        if primera and primera.group(1).lower() in INTERROGATIVOS:
            w = primera.group(1)
            nuevo = INTERROGATIVOS[w.lower()]
            if w[0].isupper():
                nuevo = nuevo[0].upper() + nuevo[1:]
            s = nuevo + s[len(w):]
        s = "¿" + s
    elif s.endswith("!") and not s.startswith("¡"):
        s = "¡" + s
    return oracion[:len(oracion) - len(oracion.lstrip())] + s


def corregir(texto):
    s = re.sub(r"[A-Za-z]+", _palabra, texto)
    s = ESTA_VERBO.sub(lambda m: m.group(1) + "stá" + m.group(2), s)
    partes = re.split(r"(?<=[.?!])\s+", s)
    return " ".join(_abrir(p) for p in partes)


def texto_voz(texto, emocion=False):
    """(texto para ElevenLabs, revisado a mano?). Con emocion=True, la version con etiquetas de
    emocion ([laughs], [sighs]...) si la tiene: solo para los modelos que las entienden (v3, v4)."""
    r = revisados().get(ident(texto))
    if r is not None and r.get("original") == texto:
        if emocion and r.get("emocion"):
            return r["emocion"], True
        return r["voz"], True
    return corregir(texto), False


if __name__ == "__main__":
    import sys
    for t in sys.argv[1:] or ["Que necesitas? Manana vamos a la comisaria. Ya esta. Tambien hay atun!"]:
        print(corregir(t))
