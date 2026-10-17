#!/usr/bin/env python3
"""Revisa que todos los .lua del mod compilen (sin el juego). Sale con 1 si alguno tiene error.

Uso (desde la raiz del repo):  pip install lupa  &&  python3 NarradorCoop/herramientas/pruebas/sintaxis.py
"""
import os
import sys

import lupa

LUA = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "42", "media", "lua")


def main():
    compilar = lupa.LuaRuntime().eval("function(s, n) local ok, e = load(s, n); return e end")
    mal = 0
    for raiz, _, nombres in sorted(os.walk(LUA)):
        for n in sorted(nombres):
            if n.endswith(".lua"):
                ruta = os.path.join(raiz, n)
                error = compilar(open(ruta, encoding="utf-8").read(), "@" + os.path.relpath(ruta, LUA))
                if error:
                    print("error:", error)
                    mal += 1
    print(f"{mal} archivos con error")
    return 1 if mal else 0


if __name__ == "__main__":
    sys.exit(main())
