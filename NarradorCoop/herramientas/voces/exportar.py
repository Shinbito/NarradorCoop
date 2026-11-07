#!/usr/bin/env python3
"""Arma el guion de voces: todas las frases de los personajes, con su voz y el texto para ElevenLabs.

Salida (en herramientas/voces/):
  guion.csv   una fila por frase: id, voz, personaje, tipo de voz, texto del juego, texto para la
              voz, revisado (si/no), variable (si la frase cambia en el juego: no se graba).
  guion.json  lo mismo, para generar.py.
Y avisa si en voces.json falta alguna voz (la agrega como "biblioteca" para elegir).

Uso (desde la raiz del repo, necesita lupa):
    python3 NarradorCoop/herramientas/voces/exportar.py
    python3 NarradorCoop/herramientas/voces/exportar.py --pendientes   # ademas escribe pendientes.json:
        las frases sin revisar en textos_voz.json, para pasarles las tildes a mano y sumarlas ahi.

El id de cada frase es <voz>_<sha1 del texto del juego>: si se cambia el texto en el juego, la
frase pasa a ser otra (hay que regenerar su audio).
"""
import csv
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import acentos  # noqa: E402
import extraer  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
CATALOGO = os.path.join(AQUI, "voces.json")


def tiene_variable(texto):
    return "{" in texto


def guion():
    cat = json.load(open(CATALOGO, encoding="utf-8"))
    voces = cat["voces"]
    nuevas = []
    filas = []
    for f in extraer.frases():
        voz = f["voz"]
        if voz not in voces:
            voces[voz] = {"nombre": voz, "tipo": "biblioteca", "genero": "hombre", "nombres_juego": [],
                          "elevenlabs_voice_id": "", "descripcion": "Personaje nuevo: describir y elegir voz."}
            nuevas.append(voz)
        tv, ok = acentos.texto_voz(f["texto"])
        te, _ = acentos.texto_voz(f["texto"], emocion=True)
        filas.append({
            "id": voz + "_" + acentos.ident(f["texto"]),
            "voz": voz,
            "personaje": voces[voz]["nombre"],
            "tipo_voz": voces[voz]["tipo"],
            "texto_juego": f["texto"],
            "texto_voz": tv,
            "texto_emocion": te,
            "revisado": ok,
            "variable": tiene_variable(f["texto"]),
            "fuente": f["fuente"],
            "contexto": f["contexto"],
        })
    if nuevas:
        json.dump(cat, open(CATALOGO, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    filas.sort(key=lambda r: (r["voz"], r["id"]))
    return filas, nuevas


def main():
    filas, nuevas = guion()
    json.dump(filas, open(os.path.join(AQUI, "guion.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(os.path.join(AQUI, "guion.csv"), "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "voz", "personaje", "tipo_voz", "texto_juego", "texto_voz", "texto_emocion", "revisado", "variable"])
        for r in filas:
            w.writerow([r["id"], r["voz"], r["personaje"], r["tipo_voz"], r["texto_juego"], r["texto_voz"],
                        r["texto_emocion"], "si" if r["revisado"] else "no", "si" if r["variable"] else "no"])
    grabar = [r for r in filas if not r["variable"]]
    print(f"{len(filas)} frases ({len(grabar)} para grabar, {len(filas) - len(grabar)} con partes variables: solo murmullo)")
    print(f"{sum(len(r['texto_voz']) for r in grabar)} caracteres para ElevenLabs")
    sin = [r for r in grabar if not r["revisado"]]
    print(f"{len(sin)} sin revisar en textos_voz.json")
    if nuevas:
        print("Voces nuevas agregadas a voces.json (elegir voz):", ", ".join(nuevas))
    if "--pendientes" in sys.argv:
        unicos = {}
        for r in sin:
            unicos.setdefault(acentos.ident(r["texto_juego"]), {"original": r["texto_juego"], "voz": r["texto_voz"]})
        json.dump(unicos, open(os.path.join(AQUI, "pendientes.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"pendientes.json: {len(unicos)} textos para revisar")


if __name__ == "__main__":
    main()
