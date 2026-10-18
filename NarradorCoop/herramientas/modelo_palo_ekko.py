#!/usr/bin/env python3
"""Genera el Palo de Ekko: modelo .X, textura e icono (sin dependencias: PNG con zlib).

El arma de Ekko (League of Legends) es la manecilla de los segundos de un reloj de Piltover:
una hoja plana que brilla turquesa (dos tercios del largo), un mango de metal plateado con el
numero XII en la base y un aro al final del mango. Diseno original inspirado en eso.

Uso:  python3 NarradorCoop/herramientas/modelo_palo_ekko.py
Escribe:
  42/media/models_X/Narrador/PaloEkko.X
  42/media/textures/Narrador/Armas/PaloEkko.png   (textura 128x128)
  42/media/textures/Item_NarradorPaloEkko.png      (icono 32x32)
Ejes: Y a lo largo (como el bate del juego, la mano en y ~ 0), X a lo ancho, Z el grosor.
Ojo: en estos modelos la cara +Z se ve en espejo en X, asi que en esa cara se invierte la u
(como se arreglo el poster de Sous); asi el XII se lee bien.
"""
import math
import os
import struct
import zlib

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "42", "media")

# ---------------------------------------------------------------------------
# PNG
# ---------------------------------------------------------------------------

def png(ruta, ancho, alto, pixel):
    filas = b""
    for y in range(alto):
        fila = b"\x00"
        for x in range(ancho):
            r, g, b, a = pixel(x, y)
            fila += bytes((max(0, min(255, int(r))), max(0, min(255, int(g))), max(0, min(255, int(b))), max(0, min(255, int(a)))))
        filas += fila

    def trozo(tipo, datos):
        c = struct.pack(">I", len(datos)) + tipo + datos
        return c + struct.pack(">I", zlib.crc32(tipo + datos) & 0xFFFFFFFF)

    datos = b"\x89PNG\r\n\x1a\n" + trozo(b"IHDR", struct.pack(">IIBBBBB", ancho, alto, 8, 6, 0, 0, 0))
    datos += trozo(b"IDAT", zlib.compress(filas, 9)) + trozo(b"IEND", b"")
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "wb") as f:
        f.write(datos)

# ---------------------------------------------------------------------------
# Textura (128x128). Regiones en u, v (0..1, v hacia abajo):
#   hoja:  u 0.00-0.50, v 0-1   turquesa brillante al centro, mas oscuro en los bordes
#   mango: u 0.50-0.75, v 0-0.5 plata con vueltas de cuero oscuro
#   aro:   u 0.75-1.00, v 0-0.5 turquesa
#   disco: u 0.50-1.00, v 0.5-1 plata con el XII
# ---------------------------------------------------------------------------

T = 128
HOJA = (0.00, 0.00, 0.50, 1.00)
MANGO = (0.50, 0.00, 0.75, 0.50)
ARO = (0.75, 0.00, 1.00, 0.50)
DISCO = (0.50, 0.50, 1.00, 1.00)

FUENTE = {  # 5x7
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
}


def texto_xii():
    puntos = set()
    x0 = 0
    for letra in "XII":
        for fy, fila in enumerate(FUENTE[letra]):
            for fx, c in enumerate(fila):
                if c == "1":
                    puntos.add((x0 + fx, fy))
        x0 += 6
    return puntos, x0 - 1, 7


XII, XII_W, XII_H = texto_xii()


def textura(x, y):
    u, v = (x + 0.5) / T, (y + 0.5) / T
    if u < 0.5:  # hoja
        c = abs(u - 0.25) / 0.25  # 0 centro, 1 borde
        brillo = 1.0 - 0.55 * c
        veta = 0.08 * math.sin(v * 60.0 + u * 20.0)
        if c > 0.88:  # filo plateado
            return (200, 215, 220, 255)
        return (20 + 90 * brillo, 150 + 105 * (brillo + veta), 150 + 95 * (brillo + veta), 255)
    if v < 0.5 and u < 0.75:  # mango
        vuelta = int(v * T) % 8
        if vuelta < 3:
            return (60, 45, 40, 255)
        luz = 170 + 60 * math.sin((u - 0.5) * 4 * math.pi)
        return (luz, luz + 8, luz + 15, 255)
    if v < 0.5:  # aro
        return (40, 230, 210, 255)
    # disco con XII (centrado en la region)
    cu, cv = (u - 0.75) / 0.25, (v - 0.75) / 0.25  # -1..1
    r = math.hypot(cu, cv)
    if r > 0.96:
        return (120, 125, 130, 255)
    px = int(round((cu + 1) / 2 * 64)) - (32 - XII_W * 2 // 2)
    py = int(round((cv + 1) / 2 * 64)) - (32 - XII_H * 2 // 2)
    if (px // 2, py // 2) in XII and 0 <= px and 0 <= py:
        return (25, 30, 35, 255)
    luz = 205 - 40 * r
    return (luz, luz + 6, luz + 12, 255)


def icono(x, y):
    # palo en diagonal: abajo-izquierda el aro y el mango, arriba-derecha la hoja.
    px, py = x + 0.5, 31.5 - y
    t = (px + py) / 2.0
    d = (px - py) / math.sqrt(2)
    if 3.0 <= t <= 9.5 and abs(d) <= 1.3:
        return (190, 198, 205, 255)
    if 9.5 < t <= 11.5 and abs(d) <= 2.6:
        return (205, 210, 215, 255)
    if 11.5 < t <= 30.0:
        ancho = 2.6 if t < 27 else 2.6 * (30.0 - t) / 3.0
        if abs(d) <= ancho:
            return (60, 235, 215, 255) if abs(d) < ancho * 0.5 else (20, 160, 160, 255)
    rx, ry = px - 2.6, py - 2.6
    if 1.3 <= math.hypot(rx, ry) <= 2.6:
        return (40, 230, 210, 255)
    return (0, 0, 0, 0)

# ---------------------------------------------------------------------------
# Geometria
# ---------------------------------------------------------------------------

tris = []  # (p1, p2, p3, normal, uv1, uv2, uv3)


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def cruz(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def punto(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def unit(a):
    l = math.sqrt(punto(a, a)) or 1.0
    return (a[0] / l, a[1] / l, a[2] / l)


def tri(p1, p2, p3, uv1, uv2, uv3, normal=None):
    n = cruz(sub(p2, p1), sub(p3, p1))
    if normal is None:
        normal = unit(n)
    elif punto(n, normal) < 0:  # siempre antihorario visto desde afuera
        p2, p3, uv2, uv3 = p3, p2, uv3, uv2
    tris.append((p1, p2, p3, unit(normal), uv1, uv2, uv3))


def quad(a, b, c, d, uva, uvb, uvc, uvd, normal=None):
    tri(a, b, c, uva, uvb, uvc, normal)
    tri(a, c, d, uva, uvc, uvd, normal)


def en(region, s, t):
    u0, v0, u1, v1 = region
    return (u0 + (u1 - u0) * s, v0 + (v1 - v0) * t)


def prisma_plano(contorno, z, region, xmin, xmax, ymin, ymax, espejo_frente=True):
    """Pieza plana: contorno (lista de x,y en orden) extruido entre -z y +z."""
    n = len(contorno)
    cx = sum(p[0] for p in contorno) / n
    cy = sum(p[1] for p in contorno) / n

    def uv(x, y, frente):
        s = (x - xmin) / (xmax - xmin)
        if frente and espejo_frente:
            s = 1.0 - s
        return en(region, s, 1.0 - (y - ymin) / (ymax - ymin))

    for i in range(n):
        a, b = contorno[i], contorno[(i + 1) % n]
        for zz, frente in ((z, True), (-z, False)):
            tri((cx, cy, zz), (a[0], a[1], zz), (b[0], b[1], zz),
                uv(cx, cy, frente), uv(a[0], a[1], frente), uv(b[0], b[1], frente), (0, 0, 1 if frente else -1))
        # borde
        nb = unit((b[1] - a[1], -(b[0] - a[0]), 0))
        if punto(nb, (a[0] - cx, a[1] - cy, 0)) < 0:
            nb = (-nb[0], -nb[1], 0)
        ua, ub = uv(a[0], a[1], False), uv(b[0], b[1], False)
        quad((a[0], a[1], z), (b[0], b[1], z), (b[0], b[1], -z), (a[0], a[1], -z), ua, ub, ub, ua, nb)


def cilindro(radio, y0, y1, lados, region):
    for i in range(lados):
        a0, a1 = 2 * math.pi * i / lados, 2 * math.pi * (i + 1) / lados
        p = [(radio * math.cos(a0), radio * math.sin(a0)), (radio * math.cos(a1), radio * math.sin(a1))]
        s0, s1 = i / lados, (i + 1) / lados
        nrm = (math.cos((a0 + a1) / 2), 0, math.sin((a0 + a1) / 2))
        quad((p[0][0], y0, p[0][1]), (p[1][0], y0, p[1][1]), (p[1][0], y1, p[1][1]), (p[0][0], y1, p[0][1]),
             en(region, s0, 1), en(region, s1, 1), en(region, s1, 0), en(region, s0, 0), nrm)
        for yy, ny in ((y0, -1), (y1, 1)):
            tri((0, yy, 0), (p[0][0], yy, p[0][1]), (p[1][0], yy, p[1][1]),
                en(region, 0.5, 0.5), en(region, s0, 0), en(region, s1, 0), (0, ny, 0))


# 1. Aro al final del mango (en el plano XY, mirando a Z).
R_ARO, G_ARO, Y_ARO = 0.024, 0.0055, -0.085
for i in range(12):
    a0, a1 = 2 * math.pi * i / 12, 2 * math.pi * (i + 1) / 12
    exterior = [((R_ARO + G_ARO) * math.cos(a), Y_ARO + (R_ARO + G_ARO) * math.sin(a)) for a in (a0, a1)]
    interior = [((R_ARO - G_ARO) * math.cos(a), Y_ARO + (R_ARO - G_ARO) * math.sin(a)) for a in (a0, a1)]
    seg = [exterior[0], exterior[1], interior[1], interior[0]]
    prisma_plano(seg, 0.005, ARO, -0.03, 0.03, Y_ARO - 0.03, Y_ARO + 0.03, espejo_frente=False)

# 2. Mango plateado (octogonal) desde el aro hasta el disco.
cilindro(0.015, -0.062, 0.175, 8, MANGO)

# 3. Disco del reloj con el XII (cara frontal y trasera).
disco = [(0.036 * math.cos(2 * math.pi * i / 20), 0.205 + 0.036 * math.sin(2 * math.pi * i / 20)) for i in range(20)]
prisma_plano(disco, 0.009, DISCO, -0.036, 0.036, 0.169, 0.241)

# 4. La hoja: manecilla plana que brilla turquesa (dos tercios del largo).
hoja = [(-0.010, 0.236), (-0.034, 0.300), (-0.040, 0.360), (-0.036, 0.560), (-0.020, 0.650), (0.0, 0.705),
        (0.020, 0.650), (0.036, 0.560), (0.040, 0.360), (0.034, 0.300), (0.010, 0.236)]
prisma_plano(hoja, 0.005, HOJA, -0.042, 0.042, 0.236, 0.705, espejo_frente=False)

# ---------------------------------------------------------------------------
# Escribir el .X (mismo formato que los otros modelos del mod)
# ---------------------------------------------------------------------------

def escribir_x(ruta):
    with open(os.path.join(os.path.dirname(ruta), "PosterSous.X")) as f:
        modelo = f.read()
    cabecera = modelo[:modelo.index("\nMaterial ") + 1]
    v, n, uvs = [], [], []
    for p1, p2, p3, nrm, a, b, c in tris:
        v += [p1, p2, p3]
        n += [nrm, nrm, nrm]
        uvs += [a, b, c]
    nf = len(tris)

    def lista(vs, fmt):
        return ",\n".join("  " + fmt(x) for x in vs) + ";\n"

    caras = ",\n".join("  3;%d,%d,%d;" % (3 * i, 3 * i + 1, 3 * i + 2) for i in range(nf)) + ";\n"
    out = cabecera
    out += ('Material Mat_PaloEkko {\n 1.000000;1.000000;1.000000;1.000000;;\n 9.999999;\n'
            ' 0.000000;0.000000;0.000000;;\n 0.000000;0.000000;0.000000;;\n\n TextureFilename {\n  "PaloEkko.png";\n }\n}\n\n')
    out += "Frame PaloEkko {\n \n\n FrameTransformMatrix {\n  1.000000,0.000000,0.000000,0.000000,0.000000,1.000000,0.000000,0.000000," \
           "0.000000,0.000000,1.000000,0.000000,0.000000,0.000000,0.000000,1.000000;;\n }\n\n Mesh PaloEkko {\n"
    out += "  %d;\n" % len(v) + lista(v, lambda p: "%.6f;%.6f;%.6f;" % p)
    out += "  %d;\n" % nf + caras + "\n"
    out += "  MeshNormals {\n   %d;\n" % len(n) + lista(n, lambda p: " %.6f;%.6f;%.6f;" % p)
    out += "   %d;\n" % nf + caras.replace("  3;", "   3;") + "  }\n\n"
    out += "  MeshMaterialList {\n   1;\n   %d;\n" % nf + ",\n".join("   0" for _ in range(nf)) + ";\n   { Mat_PaloEkko }\n  }\n\n"
    out += "  MeshTextureCoords c1 {\n   %d;\n" % len(uvs) + lista(uvs, lambda t: " %.6f;%.6f;" % t) + "  }\n }\n}\n"
    with open(ruta, "w") as f:
        f.write(out)


if __name__ == "__main__":
    escribir_x(os.path.join(BASE, "models_X", "Narrador", "PaloEkko.X"))
    png(os.path.join(BASE, "textures", "Narrador", "Armas", "PaloEkko.png"), T, T, textura)
    png(os.path.join(BASE, "textures", "Item_NarradorPaloEkko.png"), 32, 32, icono)
    ys = [p[1] for t in tris for p in t[:3]]
    print("Palo de Ekko: %d triangulos, largo %.3f (y %.3f a %.3f)" % (len(tris), max(ys) - min(ys), min(ys), max(ys)))
