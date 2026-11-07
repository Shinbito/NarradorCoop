#!/usr/bin/env python3
"""Genera las voces con ElevenLabs y las deja listas para el juego.

Por cada frase del guion (exportar.py) cuya voz tenga elevenlabs_voice_id en voces.json:
  1. Pide el audio a ElevenLabs (texto con tildes de textos_voz.json; con los modelos v3/v4, la
     version con etiquetas de emocion) y lo guarda en
     herramientas/voces/audio/<id>.mp3 (el original: no se vuelve a pedir si ya esta).
  2. Con ffmpeg hace dos versiones mono en .ogg, en 42/media/sound/NarradorVoces/:
       <id>.ogg        cerca: la frase clara.
       <id>_lejos.ogg  lejos: apagada, como a traves de una pared (murmullo).
  3. Escribe 42/media/scripts/NarradorVoces.txt (los sonidos para el juego) y
     42/media/lua/shared/Narrador/NarradorVocesIndice.lua (que frase tiene audio y de que voz).
Las frases con partes variables ({lugar}, nombres) no se graban: en el juego suenan como murmullo.

Uso (desde la raiz del repo; necesita lupa y ffmpeg):
    export ELEVENLABS_API_KEY=...            # la clave de tu cuenta de ElevenLabs
    python3 NarradorCoop/herramientas/voces/generar.py --probar          # que se generaria y cuantos caracteres
    python3 NarradorCoop/herramientas/voces/generar.py --voz eduardo     # solo una voz (se puede repetir)
    python3 NarradorCoop/herramientas/voces/generar.py --limite 20       # como mucho 20 frases nuevas
    python3 NarradorCoop/herramientas/voces/generar.py --sin-api         # solo rehace ogg, sonidos e indice
    python3 NarradorCoop/herramientas/voces/generar.py --rehacer <id>    # vuelve a pedir una frase (otra toma)
    python3 NarradorCoop/herramientas/voces/generar.py --sin-api --reconvertir   # tras cambiar "velocidad"
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import exportar  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
MEDIA = os.path.join(RAIZ, "42", "media")
AUDIO = os.path.join(AQUI, "audio")
SONIDOS = os.path.join(MEDIA, "sound", "NarradorVoces")
SCRIPT = os.path.join(MEDIA, "scripts", "NarradorVoces.txt")
INDICE = os.path.join(MEDIA, "lua", "shared", "Narrador", "NarradorVocesIndice.lua")
API = "https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=mp3_44100_128"

# Filtros de ffmpeg. Mono para que el juego lo ponga en el espacio (3D).
# Primero se recorta el silencio del principio y del final y se acelera (atempo no cambia el tono):
# ElevenLabs habla lento para un juego. La velocidad sale de voces.json ("velocidad" del catalogo o
# de cada voz; 1.0 = como viene).
RECORTE = ("silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
           "silenceremove=start_periods=1:start_threshold=-45dB,areverse")
CERCA = "highpass=f=70,loudnorm=I=-18:TP=-2:LRA=11"
LEJOS = "highpass=f=180,lowpass=f=850,aecho=0.7:0.6:35|70:0.25|0.15,loudnorm=I=-26:TP=-6:LRA=11"


def filtro(base, velocidad):
    v = max(0.5, min(2.0, float(velocidad or 1.0)))
    return RECORTE + ("" if v == 1.0 else ",atempo=%.3f" % v) + "," + base
DISTANCIA_MAX = 30  # casillas: mas alla no se escucha nada


# Modelos que entienden las etiquetas de emocion ([laughs], [sighs]...).
CON_EMOCION = ("eleven_v3", "eleven_v4")


def con_emocion(cat):
    return str(cat.get("modelo", "")).startswith(CON_EMOCION)


def texto_de(r, cat):
    return r["texto_emocion"] if con_emocion(cat) else r["texto_voz"]


def ajustes(cat):
    a = dict(cat.get("ajustes", {}))
    if con_emocion(cat):
        # v3/v4: sin style ni speaker boost; la estabilidad va en pasos (0 creativa, 0.5 natural, 1 firme).
        a.pop("style", None)
        a.pop("use_speaker_boost", None)
        if "stability" in a:
            a["stability"] = min((0.0, 0.5, 1.0), key=lambda x: abs(x - float(a["stability"])))
    return a


def pedir(texto, voice_id, cat, clave):
    cuerpo = {"text": texto, "model_id": cat.get("modelo", "eleven_multilingual_v2"),
              "voice_settings": ajustes(cat)}
    if cat.get("idioma"):
        cuerpo["language_code"] = cat["idioma"]
    req = urllib.request.Request(API.format(voz=voice_id), data=json.dumps(cuerpo).encode("utf-8"), method="POST",
                                 headers={"xi-api-key": clave, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    for intento in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            detalle = e.read().decode("utf-8", "ignore")[:300]
            if e.code in (429, 500, 502, 503) and intento < 4:
                time.sleep(2 ** (intento + 1))
                continue
            raise SystemExit(f"ElevenLabs respondio {e.code}: {detalle}")
        except urllib.error.URLError:
            if intento < 4:
                time.sleep(2 ** (intento + 1))
                continue
            raise


def convertir(mp3, ogg, filtro):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp3, "-ac", "1", "-ar", "44100", "-af", filtro,
                    "-c:a", "libvorbis", "-q:a", "4", ogg], check=True)


def duracion(ruta):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip() or 0), 2)


def lua_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def escribir_indice(filas, cat, hechos):
    """hechos: id -> duracion en segundos (solo las frases que tienen audio)."""
    lineas, porvoz = {}, {}
    for r in filas:
        if r["id"] in hechos:
            lineas.setdefault(r["texto_juego"], []).append((r["voz"], r["id"], hechos[r["id"]]))
            porvoz.setdefault(r["voz"], []).append(r["id"])
    nombres = {}
    for voz, v in sorted(cat["voces"].items()):
        for n in v.get("nombres_juego", []):
            nombres.setdefault(n, voz)
    out = ["-- Generado por herramientas/voces/generar.py. No editar a mano.",
           "-- Que frases tienen voz grabada (texto del juego -> voz, sonido, segundos) y como se llama cada voz en el juego.",
           "Narrador = Narrador or {}", "Narrador.VocesIndice = {", "    lineas = {"]
    for texto in sorted(lineas):
        partes = ", ".join("{ %s, %s, %s }" % (lua_str(v), lua_str(i), d) for v, i, d in lineas[texto])
        out.append("        [%s] = { %s }," % (lua_str(texto), partes))
    out += ["    },", "    porVoz = {"]
    for voz in sorted(porvoz):
        out.append("        %s = { %s }," % (voz, ", ".join(lua_str(i) for i in sorted(porvoz[voz]))))
    out += ["    },", "    duracion = {"]
    for i in sorted(hechos):
        out.append("        [%s] = %s," % (lua_str(i), hechos[i]))
    out += ["    },", "    nombres = {"]
    for n in sorted(nombres):
        out.append("        [%s] = %s," % (lua_str(n), lua_str(nombres[n])))
    out += ["    },", "}", "return Narrador.VocesIndice", ""]
    open(INDICE, "w", encoding="utf-8").write("\n".join(out))


def escribir_sonidos(hechos):
    out = ["/* Generado por herramientas/voces/generar.py. No editar a mano. */", "module Base", "{"]
    for i in sorted(hechos):
        for sufijo in ("", "_lejos"):
            out += ["    sound NarradorVoz_%s%s" % (i, sufijo), "    {",
                    "        category = World,", "        master = Primary,", "        is3D = true,",
                    "        clip", "        {",
                    "            file = media/sound/NarradorVoces/%s%s.ogg," % (i, sufijo),
                    "            distanceMin = 2,", "            distanceMax = %d," % DISTANCIA_MAX,
                    "            reverbFactor = 0.1,", "            volume = 1.0,",
                    "        }", "    }"]
    out += ["}", ""]
    open(SCRIPT, "w", encoding="utf-8").write("\n".join(out))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--probar", action="store_true", help="no pide nada: muestra que se generaria")
    ap.add_argument("--sin-api", action="store_true", help="no pide audio nuevo, solo convierte lo que ya hay")
    ap.add_argument("--voz", action="append", help="solo estas voces")
    ap.add_argument("--limite", type=int, default=0, help="como mucho N frases nuevas")
    ap.add_argument("--rehacer", action="append", default=[], help="ids a volver a pedir")
    ap.add_argument("--reconvertir", action="store_true", help="rehace todos los ogg (por ejemplo, al cambiar la velocidad)")
    a = ap.parse_args()

    filas, _ = exportar.guion()
    cat = json.load(open(exportar.CATALOGO, encoding="utf-8"))
    os.makedirs(AUDIO, exist_ok=True)
    os.makedirs(SONIDOS, exist_ok=True)

    grabables = [r for r in filas if not r["variable"] and (not a.voz or r["voz"] in a.voz)]
    sin_id = sorted({r["voz"] for r in grabables if not cat["voces"][r["voz"]].get("elevenlabs_voice_id")})
    nuevas = [r for r in grabables if cat["voces"][r["voz"]].get("elevenlabs_voice_id")
              and (r["id"] in a.rehacer or not os.path.exists(os.path.join(AUDIO, r["id"] + ".mp3")))]
    if a.limite:
        nuevas = nuevas[:a.limite]
    sin_revisar = sum(1 for r in nuevas if not r["revisado"])
    print(f"{len(nuevas)} frases por pedir ({sum(len(texto_de(r, cat)) for r in nuevas)} caracteres, modelo {cat.get('modelo')})"
          + (f", {sin_revisar} con tildes automaticas (sin revisar)" if sin_revisar else ""))
    if sin_id:
        print("Voces sin elevenlabs_voice_id en voces.json (se saltan):", ", ".join(sin_id))
    if a.probar:
        return

    if nuevas and not a.sin_api:
        clave = os.environ.get("ELEVENLABS_API_KEY")
        if not clave:
            raise SystemExit("Falta ELEVENLABS_API_KEY (la clave de la API de ElevenLabs).")
        for n, r in enumerate(nuevas, 1):
            audio = pedir(texto_de(r, cat), cat["voces"][r["voz"]]["elevenlabs_voice_id"], cat, clave)
            open(os.path.join(AUDIO, r["id"] + ".mp3"), "wb").write(audio)
            print(f"  [{n}/{len(nuevas)}] {r['id']}: {texto_de(r, cat)[:70]}")

    # Convertir todo lo que tenga audio y sea del guion actual.
    hechos = {}
    vigentes = {r["id"] for r in filas if not r["variable"]}
    for r in filas:
        mp3 = os.path.join(AUDIO, r["id"] + ".mp3")
        if r["id"] not in vigentes or not os.path.exists(mp3):
            continue
        cerca = os.path.join(SONIDOS, r["id"] + ".ogg")
        lejos = os.path.join(SONIDOS, r["id"] + "_lejos.ogg")
        vel = cat["voces"][r["voz"]].get("velocidad", cat.get("velocidad", 1.0))
        if (r["id"] in a.rehacer or a.reconvertir or not os.path.exists(cerca)
                or os.path.getmtime(cerca) < os.path.getmtime(mp3)):
            convertir(mp3, cerca, filtro(CERCA, vel))
            convertir(mp3, lejos, filtro(LEJOS, vel))
        hechos[r["id"]] = duracion(cerca)
    # Sonidos de frases que ya no estan en el guion (se cambio el texto): fuera del mod.
    for f in os.listdir(SONIDOS):
        base = f[:-4].removesuffix("_lejos")
        if f.endswith(".ogg") and base not in hechos:
            os.remove(os.path.join(SONIDOS, f))
    escribir_sonidos(hechos)
    escribir_indice(filas, cat, hechos)
    print(f"Listo: {len(hechos)} frases con voz en el mod.")


if __name__ == "__main__":
    main()
