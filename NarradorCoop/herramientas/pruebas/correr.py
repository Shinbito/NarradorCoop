#!/usr/bin/env python3
"""Corre las pruebas de herramientas/pruebas/*.lua con los modulos reales del servidor.

El juego no esta: se cargan todos los modulos de shared y server con lo minimo (sin A-Life, sin Events) y cada prueba
reemplaza las funciones de Mundo que necesita. Cada prueba imprime "TODO BIEN" o "FALLOS: n".

Uso (desde la raiz del repo):  pip install lupa  &&  python3 NarradorCoop/herramientas/pruebas/correr.py
"""
import glob
import os
import sys

import lupa

AQUI = os.path.dirname(os.path.abspath(__file__))
LUA = os.path.join(os.path.dirname(os.path.dirname(AQUI)), "42", "media", "lua")


def modulos():
    """Todos los modulos de shared/Narrador y server/Narrador (asi se prueba tambien que carguen)."""
    out = []
    for carpeta in ("shared", "server"):
        base = os.path.join(LUA, carpeta, "Narrador")
        out += ["Narrador/" + n[:-4] for n in sorted(os.listdir(base)) if n.endswith(".lua")]
    return out


def correr(ruta):
    lua = lupa.LuaRuntime(unpack_returned_tuples=True)
    lua.globals().package.path = (os.path.join(LUA, "shared", "?.lua") + ";" + os.path.join(LUA, "server", "?.lua")
                                  + ";" + lua.globals().package.path)
    salida = []
    lua.globals().print = lambda *a: salida.append(" ".join(str(x) for x in a))
    lua.execute("""
    ZombRand = function(n) return 0 end
    isClient = function() return false end
    Events = setmetatable({}, { __index = function(t, k) local e = { Add = function() end }; rawset(t, k, e); return e end })
    """)
    for m in modulos():
        lua.require(m)
    # Las pruebas no tienen refugios: el modo historia queda abierto (la compuerta real queda en
    # Motor._historiaAbiertaReal, la usa prueba_refugio.lua).
    lua.execute("""
    Narrador.Motor._historiaAbiertaReal = Narrador.Motor.historiaAbierta
    Narrador.Motor.historiaAbierta = function() return true end
    """)
    lua.execute(open(ruta, encoding="utf-8").read())
    return salida


def main():
    mal = 0
    for ruta in sorted(glob.glob(os.path.join(AQUI, "prueba_*.lua"))):
        salida = correr(ruta)
        print(f"== {os.path.basename(ruta)}")
        print("\n".join(salida))
        if not salida or salida[-1] != "TODO BIEN":
            mal += 1
    return 1 if mal else 0


if __name__ == "__main__":
    sys.exit(main())
