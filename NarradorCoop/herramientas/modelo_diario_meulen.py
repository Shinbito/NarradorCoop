#!/usr/bin/env python3
"""Genera el Diario de Meulen: modelo .X, textura e icono (y vistas previas si se pide).

Una libreta de cuero cafe claro con lomo, esquinas y costuras en cafe oscuro, las hojas crema a
la vista por el canto y un cierre a presion: una correa cafe oscuro que sale de la tapa de atras,
da la vuelta por el canto y cruza la tapa de adelante hasta un broche metalico redondo.

Uso:  python3 NarradorCoop/herramientas/modelo_diario_meulen.py [carpeta_para_vistas_previas]
Necesita numpy y Pillow (el icono se renderiza desde el mismo modelo).
Escribe:
  42/media/models_X/Narrador/DiarioMeulen.X
  42/media/textures/Narrador/DiarioMeulen.png       (textura 256x256)
  42/media/textures/Item_NarradorDiarioMeulen.png    (icono 32x32)
Ejes y escala como el diario anterior: Y hacia arriba (base en y = 0, apoyado en el suelo),
X a lo ancho (lomo en -X, canto con la correa en +X), Z a lo largo. 0.15 x 0.21 x 0.028.
"""
import math
import os
import sys

import numpy as np
from PIL import Image

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "42", "media")
NOMBRE = "DiarioMeulen"

# ---------------------------------------------------------------------------
# Medidas
# ---------------------------------------------------------------------------
X0, X1 = -0.075, 0.075        # tapas
Z0, Z1 = -0.105, 0.105
TAPA = 0.0035                 # grosor de cada tapa
ALTO = 0.028                  # alto total del libro
HX0, HX1 = -0.0715, 0.0725    # bloque de hojas (las tapas sobresalen 2.5 mm)
HZ = 0.1025
LOMO_X = -0.0785              # el lomo se abomba un poco hacia afuera
CORREA_Z = 0.018              # media anchura de la correa
CORREA_G = 0.003              # grosor de la correa
CORREA_X = X1 + 0.0035        # cara exterior de la correa en el canto
BROCHE_X = 0.040              # centro del broche
BROCHE_R = 0.011
PUNTA_X = BROCHE_X - CORREA_Z  # la punta redonda de la correa
LARGO_CORREA = (CORREA_X - PUNTA_X) + (ALTO + CORREA_G)

# ---------------------------------------------------------------------------
# Textura 256x256. Regiones (u0, v0, u1, v1), v hacia abajo como en la imagen.
# ---------------------------------------------------------------------------
T = 256
TAPA_R = (0.00, 0.00, 0.50, 0.70)    # tapa (adelante y atras)
METAL_R = (0.00, 0.75, 0.25, 1.00)   # cara del broche
METALL_R = (0.25, 0.75, 0.50, 1.00)  # costado del broche
BORDE_R = (0.50, 0.00, 0.75, 0.10)   # cantos de las tapas
HOJAS_R = (0.50, 0.10, 1.00, 0.30)   # hojas por el canto
CORREA_R = (0.50, 0.30, 0.75, 1.00)  # correa desenrollada
LOMO_R = (0.75, 0.30, 1.00, 1.00)    # lomo

CAFE = np.array((178, 128, 84), float)       # cuero cafecito
CAFE_OSC = np.array((78, 47, 28), float)     # detalles
CAFE_OSC2 = np.array((60, 35, 20), float)
HILO = np.array((52, 30, 17), float)         # costura oscura
HILO_CLARO = np.array((222, 196, 150), float)
CREMA = np.array((238, 226, 190), float)


def region_px(r):
    u0, v0, u1, v1 = r
    return int(round(u0 * T)), int(round(v0 * T)), int(round(u1 * T)), int(round(v1 * T))


def ruido(alto, ancho, semilla, escala=1.0):
    rng = np.random.default_rng(semilla)
    a = rng.normal(0, 1, (alto, ancho))
    # grano de cuero: ruido suavizado un poco + puntitos
    b = (a + np.roll(a, 1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 0) + np.roll(a, -1, 1)) / 5
    return (0.7 * b + 0.3 * a) * escala


def guiones(dist, largo_pos, ancho=1.0, paso=6, lleno=4):
    """Mascara de costura: cerca de una linea (dist ~ 0) y a guiones a lo largo."""
    return (np.abs(dist) < ancho) & ((largo_pos.astype(int) % paso) < lleno)


def textura():
    img = np.zeros((T, T, 3), float)

    # --- tapa -----------------------------------------------------------------
    x0, y0, x1, y1 = region_px(TAPA_R)
    h, w = y1 - y0, x1 - x0
    yy, xx = np.mgrid[0:h, 0:w].astype(float) + 0.5
    s, t = xx / w, yy / h                 # s: 0 lomo, 1 canto ; t: a lo largo
    px_s, px_t = xx, yy
    c = CAFE + ruido(h, w, 1, 9)[..., None]
    borde = np.minimum.reduce([px_s, w - px_s, px_t, h - px_t])
    c *= (0.86 + 0.14 * np.clip(borde / 14, 0, 1))[..., None]          # bordes gastados
    c *= (1 + 0.05 * np.sin(px_t / 9 + px_s / 23))[..., None]
    lomo_px = 0.15 * w                                                  # media cubierta oscura
    lomo = px_s < lomo_px
    c[lomo] = (CAFE_OSC + ruido(h, w, 2, 7)[..., None])[lomo]
    esquina = 34
    esq = ((w - px_s) + px_t < esquina) | ((w - px_s) + (h - px_t) < esquina)
    c[esq] = (CAFE_OSC + ruido(h, w, 3, 7)[..., None])[esq]
    # costuras: marco alrededor (sin pisar el lomo), linea del lomo y diagonal de las esquinas
    ins = 5.0
    marco = np.zeros((h, w), bool)
    marco |= guiones(px_t - ins, px_s) & (px_s > lomo_px + 3) & (px_s < w - ins)
    marco |= guiones(px_t - (h - ins), px_s) & (px_s > lomo_px + 3) & (px_s < w - ins)
    marco |= guiones(px_s - (w - ins), px_t) & (px_t > ins) & (px_t < h - ins)
    c[marco & ~esq] = HILO
    lin = guiones(px_s - (lomo_px + 3.5), px_t) & (px_t > 3) & (px_t < h - 3)
    c[lin] = HILO
    lin_l = guiones(px_s - (lomo_px - 3.5), px_t) & (px_t > 3) & (px_t < h - 3)
    c[lin_l] = HILO_CLARO * 0.8
    for diag in ((w - px_s) + px_t, (w - px_s) + (h - px_t)):
        d = (diag - (esquina + 3.5)) / math.sqrt(2)
        c[guiones(d, px_t, 0.8) & (diag < esquina + 8)] = HILO
        d2 = (diag - (esquina - 4)) / math.sqrt(2)
        c[guiones(d2, px_t, 0.8) & (diag > 4)] = HILO_CLARO * 0.8
    img[y0:y1, x0:x1] = c

    # --- cantos de las tapas ---------------------------------------------------
    x0, y0, x1, y1 = region_px(BORDE_R)
    hh, ww = y1 - y0, x1 - x0
    img[y0:y1, x0:x1] = (CAFE_OSC * 1.15 + ruido(hh, ww, 4, 6)[..., None])

    # --- hojas ------------------------------------------------------------------
    x0, y0, x1, y1 = region_px(HOJAS_R)
    hh, ww = y1 - y0, x1 - x0
    yy, xx = np.mgrid[0:hh, 0:ww].astype(float)
    rng = np.random.default_rng(5)
    linea = rng.uniform(0.86, 1.0, hh)[:, None] * np.ones((1, ww))
    linea[::3] *= 0.9
    amar = 1 - 0.10 * np.clip(1 - np.minimum(yy, hh - 1 - yy) / 6, 0, 1)   # mas amarillo arriba y abajo
    c = CREMA[None, None, :] * (linea * amar)[..., None]
    c[..., 2] *= (0.93 + 0.05 * np.sin(xx / 17))
    img[y0:y1, x0:x1] = c

    # --- correa ----------------------------------------------------------------
    x0, y0, x1, y1 = region_px(CORREA_R)
    hh, ww = y1 - y0, x1 - x0
    yy, xx = np.mgrid[0:hh, 0:ww].astype(float) + 0.5
    zc = (xx / ww - 0.5) * 2 * CORREA_Z          # metros, a lo ancho
    d = yy / hh * LARGO_CORREA                    # metros desde la punta
    ppm = hh / LARGO_CORREA                       # pixeles por metro (a lo largo)
    c = CAFE_OSC2 + ruido(hh, ww, 6, 5)[..., None]
    c *= (1 + 0.10 * np.clip(1 - np.abs(zc) / CORREA_Z, 0, 1) ** 0.5)[..., None]   # lomo de la correa
    r_pt = np.hypot(d - CORREA_Z, zc)
    en_punta = d < CORREA_Z
    dist_borde = np.where(en_punta, CORREA_Z - r_pt, CORREA_Z - np.abs(zc)) * ppm
    largo_pos = np.where(en_punta, np.arctan2(zc, CORREA_Z - d) * CORREA_Z * ppm + 200, d * ppm)
    cost = guiones(dist_borde - 3.5, largo_pos, 0.9, 5, 3)
    c[cost] = HILO_CLARO * 0.75
    c[np.abs(dist_borde) < 1.0] *= 0.7                                # canto teñido
    pliegue = np.abs(d - (CORREA_X - PUNTA_X)) * ppm < 1.2
    c[pliegue] *= 0.65
    img[y0:y1, x0:x1] = c

    # --- lomo --------------------------------------------------------------------
    x0, y0, x1, y1 = region_px(LOMO_R)
    hh, ww = y1 - y0, x1 - x0
    yy, xx = np.mgrid[0:hh, 0:ww].astype(float) + 0.5
    c = CAFE_OSC + ruido(hh, ww, 7, 7)[..., None]
    c *= (0.85 + 0.25 * np.sin(np.pi * xx / ww))[..., None]           # redondeado
    for k in (0.2, 0.4, 0.6, 0.8):                                     # nervios
        dd = np.abs(yy - k * hh)
        c[dd < 2.5] *= 1.35
        c[(dd >= 2.5) & (dd < 4)] *= 0.7
    img[y0:y1, x0:x1] = c

    # --- broche (cara y costado) --------------------------------------------------
    x0, y0, x1, y1 = region_px(METAL_R)
    hh, ww = y1 - y0, x1 - x0
    yy, xx = np.mgrid[0:hh, 0:ww].astype(float) + 0.5
    cu, cv = xx / ww * 2 - 1, yy / hh * 2 - 1
    r = np.hypot(cu, cv)
    luz = 205 - 45 * r + 40 * np.clip(-(cu + cv) / 1.4, -1, 1)        # brillo arriba a la izquierda
    luz = np.where((r > 0.56) & (r < 0.66), luz * 0.45, luz)          # ranura del broche
    luz = np.where(r > 0.93, luz * 0.6, luz)
    luz = np.where((np.hypot(cu + 0.28, cv + 0.28) < 0.16), 250, luz)  # destello
    img[y0:y1, x0:x1] = np.stack([luz * 0.97, luz, luz * 1.04], -1)
    x0, y0, x1, y1 = region_px(METALL_R)
    hh, ww = y1 - y0, x1 - x0
    xx = np.mgrid[0:hh, 0:ww][1].astype(float) + 0.5
    luz = 150 + 70 * np.cos(xx / ww * 2 * np.pi + 2.4)
    img[y0:y1, x0:x1] = np.stack([luz * 0.97, luz, luz * 1.04], -1)

    # resto sin usar
    x0, y0, x1, y1 = region_px((0.75, 0.0, 1.0, 0.10))
    img[y0:y1, x0:x1] = CAFE
    x0, y0, x1, y1 = region_px((0.0, 0.70, 0.5, 0.75))
    img[y0:y1, x0:x1] = CAFE_OSC
    return np.clip(img, 0, 255).astype(np.uint8)

# ---------------------------------------------------------------------------
# Geometria (mismas ayudas que modelo_palo_ekko.py)
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


MARGEN = 1.0 / T  # medio pixel adentro de cada region para que no se cuele el vecino


def en(region, s, t):
    u0, v0, u1, v1 = region
    u0, v0, u1, v1 = u0 + MARGEN, v0 + MARGEN, u1 - MARGEN, v1 - MARGEN
    return (u0 + (u1 - u0) * s, v0 + (v1 - v0) * t)


def cara(region, esquinas, st, normal):
    """Cara de 4 esquinas con sus (s, t) dentro de la region."""
    quad(*esquinas, *(en(region, *p) for p in st), normal)


def caja(x0, x1, y0, y1, z0, z1, regiones):
    """regiones: dict cara -> region ('+y', '-y', '+x', '-x', '+z', '-z'); las que faltan no se hacen."""
    if "+y" in regiones:
        cara(regiones["+y"], [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)],
             [(0, 0), (1, 0), (1, 1), (0, 1)], (0, 1, 0))
    if "-y" in regiones:
        cara(regiones["-y"], [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)],
             [(0, 0), (1, 0), (1, 1), (0, 1)], (0, -1, 0))
    for sx, xx in (("+x", x1), ("-x", x0)):
        if sx in regiones:
            cara(regiones[sx], [(xx, y0, z0), (xx, y0, z1), (xx, y1, z1), (xx, y1, z0)],
                 [(0, 1), (1, 1), (1, 0), (0, 0)], (1 if sx == "+x" else -1, 0, 0))
    for sz, zz in (("+z", z1), ("-z", z0)):
        if sz in regiones:
            cara(regiones[sz], [(x0, y0, zz), (x1, y0, zz), (x1, y1, zz), (x0, y1, zz)],
                 [(0, 1), (1, 1), (1, 0), (0, 0)], (0, 0, 1 if sz == "+z" else -1))


def construir():
    tris.clear()
    # 1. Tapas: atras (abajo, en el suelo) y adelante (arriba). El lomo va aparte.
    tx0 = -0.0715
    for y0, y1, afuera in ((0.0, TAPA, "-y"), (ALTO - TAPA, ALTO, "+y")):
        adentro = "+y" if afuera == "-y" else "-y"
        reg = {adentro: BORDE_R, "+x": BORDE_R, "+z": BORDE_R, "-z": BORDE_R}
        caja(tx0, X1, y0, y1, Z0, Z1, reg)
    # caras de afuera: la s se mide desde X0 para que la media cubierta oscura calce con el lomo

    def s_de(x): return (x - X0) / (X1 - X0)
    cara(TAPA_R, [(tx0, ALTO, Z0), (X1, ALTO, Z0), (X1, ALTO, Z1), (tx0, ALTO, Z1)],
         [(s_de(tx0), 0), (1, 0), (1, 1), (s_de(tx0), 1)], (0, 1, 0))
    cara(TAPA_R, [(tx0, 0, Z0), (X1, 0, Z0), (X1, 0, Z1), (tx0, 0, Z1)],
         [(s_de(tx0), 1), (1, 1), (1, 0), (s_de(tx0), 0)], (0, -1, 0))

    # 2. Lomo redondeado (3 facetas) de tapa a tapa, con sus tapitas arriba y abajo de largo.
    perfil = [(tx0, ALTO), (LOMO_X + 0.0015, ALTO - 0.0045), (LOMO_X, ALTO - 0.012), (LOMO_X, 0.012),
              (LOMO_X + 0.0015, 0.0045), (tx0, 0.0)]
    largo = [0.0]
    for a, b in zip(perfil, perfil[1:]):
        largo.append(largo[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    for i, (a, b) in enumerate(zip(perfil, perfil[1:])):
        nrm = unit((-(b[1] - a[1]), b[0] - a[0], 0))
        if nrm[0] > 0:
            nrm = (-nrm[0], -nrm[1], 0)
        s0, s1 = largo[i] / largo[-1], largo[i + 1] / largo[-1]
        cara(LOMO_R, [(a[0], a[1], Z0), (b[0], b[1], Z0), (b[0], b[1], Z1), (a[0], a[1], Z1)],
             [(s0, 0), (s1, 0), (s1, 1), (s0, 1)], nrm)
    cx = tx0 - 0.002
    for zz, nz in ((Z0, -1), (Z1, 1)):
        for a, b in zip(perfil, perfil[1:]):
            tri((cx, ALTO / 2, zz), a + (zz,), b + (zz,),
                en(BORDE_R, 0.5, 0.5), en(BORDE_R, 0.2, 0.2), en(BORDE_R, 0.8, 0.8), (0, 0, nz))

    # 3. Bloque de hojas entre las tapas (solo los cantos se ven).
    caja(HX0, HX1, TAPA, ALTO - TAPA, -HZ, HZ, {})
    y0, y1 = TAPA, ALTO - TAPA
    cara(HOJAS_R, [(HX1, y0, -HZ), (HX1, y0, HZ), (HX1, y1, HZ), (HX1, y1, -HZ)],
         [(0, 1), (1, 1), (1, 0), (0, 0)], (1, 0, 0))
    for zz, nz in ((HZ, 1), (-HZ, -1)):
        cara(HOJAS_R, [(HX0, y0, zz), (HX1, y0, zz), (HX1, y1, zz), (HX0, y1, zz)],
             [(0.1, 1), (0.8, 1), (0.8, 0), (0.1, 0)], (0, 0, nz))

    # 4. Correa: sube por el canto (desde la tapa de atras) y cruza la tapa de adelante.
    def t_vert(y): return ((CORREA_X - PUNTA_X) + (ALTO + CORREA_G - y)) / LARGO_CORREA

    def t_hor(x): return (x - PUNTA_X) / LARGO_CORREA

    def s_z(z): return (z + CORREA_Z) / (2 * CORREA_Z)

    yt = ALTO + CORREA_G
    # cara de afuera en el canto
    cara(CORREA_R, [(CORREA_X, 0, -CORREA_Z), (CORREA_X, 0, CORREA_Z), (CORREA_X, yt, CORREA_Z), (CORREA_X, yt, -CORREA_Z)],
         [(0, t_vert(0)), (1, t_vert(0)), (1, t_vert(yt)), (0, t_vert(yt))], (1, 0, 0))
    # costados de la parte vertical
    for zz, nz in ((CORREA_Z, 1), (-CORREA_Z, -1)):
        cara(BORDE_R, [(X1, 0, zz), (CORREA_X, 0, zz), (CORREA_X, yt, zz), (X1, yt, zz)],
             [(0, 1), (0.3, 1), (0.3, 0), (0, 0)], (0, 0, nz))
    # parte de arriba: contorno con punta redonda (en el plano x-z) extruido de ALTO a yt
    contorno = [(CORREA_X, -CORREA_Z), (CORREA_X, CORREA_Z), (BROCHE_X, CORREA_Z)]
    for i in range(1, 8):
        a = math.pi / 2 + math.pi * i / 8
        contorno.append((BROCHE_X + CORREA_Z * math.cos(a), CORREA_Z * math.sin(a)))
    contorno.append((BROCHE_X, -CORREA_Z))
    ccx = sum(p[0] for p in contorno) / len(contorno)
    for a, b in zip(contorno, contorno[1:] + contorno[:1]):
        tri((ccx, yt, 0), (a[0], yt, a[1]), (b[0], yt, b[1]),
            en(CORREA_R, s_z(0), t_hor(ccx)), en(CORREA_R, s_z(a[1]), t_hor(a[0])),
            en(CORREA_R, s_z(b[1]), t_hor(b[0])), (0, 1, 0))
        if a[0] == CORREA_X and b[0] == CORREA_X:
            continue  # ese lado empalma con la parte vertical
        nb = unit((b[1] - a[1], 0, -(b[0] - a[0])))
        if punto(nb, (a[0] - ccx, 0, a[1])) < 0:
            nb = (-nb[0], 0, -nb[2])
        quad((a[0], ALTO, a[1]), (b[0], ALTO, b[1]), (b[0], yt, b[1]), (a[0], yt, a[1]),
             en(BORDE_R, 0.1, 1), en(BORDE_R, 0.3, 1), en(BORDE_R, 0.3, 0), en(BORDE_R, 0.1, 0), nb)

    # 5. Broche a presion: disco metalico con un domo al centro.
    def cilindro(r, y0, y1, lados, tapa_escala):
        for i in range(lados):
            a0, a1 = 2 * math.pi * i / lados, 2 * math.pi * (i + 1) / lados
            p0 = (BROCHE_X + r * math.cos(a0), r * math.sin(a0))
            p1 = (BROCHE_X + r * math.cos(a1), r * math.sin(a1))
            nrm = (math.cos((a0 + a1) / 2), 0, math.sin((a0 + a1) / 2))
            quad((p0[0], y0, p0[1]), (p1[0], y0, p1[1]), (p1[0], y1, p1[1]), (p0[0], y1, p0[1]),
                 en(METALL_R, i / lados, 1), en(METALL_R, (i + 1) / lados, 1),
                 en(METALL_R, (i + 1) / lados, 0), en(METALL_R, i / lados, 0), nrm)

            def uvt(x, z): return en(METAL_R, 0.5 + (x - BROCHE_X) / (2 * BROCHE_R) * tapa_escala,
                                     0.5 + z / (2 * BROCHE_R) * tapa_escala)
            tri((BROCHE_X, y1, 0), (p0[0], y1, p0[1]), (p1[0], y1, p1[1]),
                uvt(BROCHE_X, 0), uvt(*p0), uvt(*p1), (0, 1, 0))

    cilindro(BROCHE_R, yt, yt + 0.0035, 16, 1.0)
    cilindro(BROCHE_R * 0.55, yt + 0.0035, yt + 0.0055, 12, 1.0)


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
    out += ('Material Mat_%s {\n 1.000000;1.000000;1.000000;1.000000;;\n 9.999999;\n'
            ' 0.000000;0.000000;0.000000;;\n 0.000000;0.000000;0.000000;;\n\n TextureFilename {\n  "%s.png";\n }\n}\n\n'
            % (NOMBRE, NOMBRE))
    out += "Frame %s {\n \n\n FrameTransformMatrix {\n  1.000000,0.000000,0.000000,0.000000,0.000000,1.000000,0.000000,0.000000," \
           "0.000000,0.000000,1.000000,0.000000,0.000000,0.000000,0.000000,1.000000;;\n }\n\n Mesh %s {\n" % (NOMBRE, NOMBRE)
    out += "  %d;\n" % len(v) + lista(v, lambda p: "%.6f;%.6f;%.6f;" % p)
    out += "  %d;\n" % nf + caras + "\n"
    out += "  MeshNormals {\n   %d;\n" % len(n) + lista(n, lambda p: " %.6f;%.6f;%.6f;" % p)
    out += "   %d;\n" % nf + caras.replace("  3;", "   3;") + "  }\n\n"
    out += "  MeshMaterialList {\n   1;\n   %d;\n" % nf + ",\n".join("   0" for _ in range(nf)) + \
           ";\n   { Mat_%s }\n  }\n\n" % NOMBRE
    out += "  MeshTextureCoords c1 {\n   %d;\n" % len(uvs) + lista(uvs, lambda t: " %.6f;%.6f;" % t) + "  }\n }\n}\n"
    with open(ruta, "w") as f:
        f.write(out)

# ---------------------------------------------------------------------------
# Render por software (para el icono y las vistas previas)
# ---------------------------------------------------------------------------

def rotacion(yaw, pitch):
    cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    cp, sp = math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    return rx @ ry


def render(tex, yaw, pitch, tam, escala, centro=(0, 0.014, 0), fondo=(0, 0, 0, 0)):
    R = rotacion(yaw, pitch)
    luz = R @ np.array(unit((-0.45, 0.85, 0.35)))      # luz de arriba, en el espacio de camara
    img = np.zeros((tam, tam, 4))
    img[:] = fondo
    zbuf = np.full((tam, tam), -1e9)
    th, tw = tex.shape[:2]
    texf = tex.astype(float)
    for p1, p2, p3, nrm, a, b, c in tris:
        P = np.array([p1, p2, p3]) - np.array(centro)
        Q = P @ R.T
        sx = Q[:, 0] * escala + tam / 2
        sy = -Q[:, 1] * escala + tam / 2
        sz = Q[:, 2]
        n = R @ np.array(nrm)
        if n[2] <= 0:          # cara de espaldas: se descarta (como en el juego)
            continue
        x0, x1 = max(int(sx.min()), 0), min(int(sx.max()) + 1, tam - 1)
        y0, y1 = max(int(sy.min()), 0), min(int(sy.max()) + 1, tam - 1)
        if x1 < x0 or y1 < y0:
            continue
        gy, gx = np.mgrid[y0:y1 + 1, x0:x1 + 1].astype(float) + 0.5
        den = (sy[1] - sy[2]) * (sx[0] - sx[2]) + (sx[2] - sx[1]) * (sy[0] - sy[2])
        if abs(den) < 1e-12:
            continue
        w0 = ((sy[1] - sy[2]) * (gx - sx[2]) + (sx[2] - sx[1]) * (gy - sy[2])) / den
        w1 = ((sy[2] - sy[0]) * (gx - sx[2]) + (sx[0] - sx[2]) * (gy - sy[2])) / den
        w2 = 1 - w0 - w1
        m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        z = w0 * sz[0] + w1 * sz[1] + w2 * sz[2]
        zona = zbuf[y0:y1 + 1, x0:x1 + 1]
        m &= z > zona
        if not m.any():
            continue
        u = w0 * a[0] + w1 * b[0] + w2 * c[0]
        v = w0 * a[1] + w1 * b[1] + w2 * c[1]
        tx = np.clip((u * tw).astype(int), 0, tw - 1)
        ty = np.clip((v * th).astype(int), 0, th - 1)
        col = texf[ty, tx, :3]
        sombra = 0.55 + 0.55 * max(0.0, float(np.dot(n, luz)))
        col = np.clip(col * sombra, 0, 255)
        zona[m] = z[m]
        reg = img[y0:y1 + 1, x0:x1 + 1]
        reg[m, :3] = col[m]
        reg[m, 3] = 255
    return img


ICONO_VISTA = dict(yaw=-18, pitch=52)


def icono(tex):
    """Se renderiza el mismo diario a 8x y se promedia a 30x30. La correa y el broche se agrandan
    un poco (solo para el icono) para que el cierre se lea a 32 px."""
    global CORREA_Z, BROCHE_R, BROCHE_X, PUNTA_X, LARGO_CORREA
    guardado = (CORREA_Z, BROCHE_R, BROCHE_X, PUNTA_X, LARGO_CORREA)
    CORREA_Z, BROCHE_R, BROCHE_X = 0.026, 0.015, 0.036
    PUNTA_X = BROCHE_X - CORREA_Z
    LARGO_CORREA = (CORREA_X - PUNTA_X) + (ALTO + CORREA_G)
    construir()
    S = 8
    # encuadre: proyectar el modelo y escalarlo para que llene 30 px
    R = rotacion(ICONO_VISTA["yaw"], ICONO_VISTA["pitch"])
    pts = np.array([p for t in tris for p in t[:3]])
    q = pts @ R.T
    centro_cam = (q.max(0) + q.min(0)) / 2
    centro = R.T @ centro_cam
    escala = 30 * S / max(np.ptp(q[:, 0]), np.ptp(q[:, 1])) * 0.98
    grande = render(tex, ICONO_VISTA["yaw"], ICONO_VISTA["pitch"], 30 * S, escala, tuple(centro))
    bx_world = np.array((BROCHE_X, ALTO + CORREA_G + 0.0055, 0.0))
    pb = R @ (bx_world - centro)
    bx, by = (pb[0] * escala + 15 * S) / S, (-pb[1] * escala + 15 * S) / S
    CORREA_Z, BROCHE_R, BROCHE_X, PUNTA_X, LARGO_CORREA = guardado
    construir()
    # promedio 8x8 con alfa premultiplicado
    g = grande.reshape(30, S, 30, S, 4)
    alfa = g[..., 3:4] / 255
    col = (g[..., :3] * alfa).sum((1, 3)) / np.maximum(alfa.sum((1, 3)), 1e-6)
    a = alfa.mean((1, 3))[..., 0]
    arr = np.zeros((30, 30, 4))
    arr[..., :3] = col
    arr[..., 3] = np.where(a > 0.45, 255, 0)
    # brillo nitido del broche (a 32 px se lava): punto claro con borde oscuro
    def disco(cx, cy, radio, color):
        sub = (np.arange(4) + 0.5) / 4
        yy, xx = np.mgrid[0:30, 0:30].astype(float)
        cob = np.zeros((30, 30))
        for dy in sub:
            for dx in sub:
                cob += np.hypot(xx + dx - cx, yy + dy - cy) < radio
        cob = (cob / 16)[..., None] * (arr[..., 3:4] > 0)
        arr[..., :3] = arr[..., :3] * (1 - cob) + np.array(color, float) * cob

    disco(bx, by, 2.5, (40, 30, 24))
    disco(bx, by, 1.9, (185, 190, 198))
    disco(bx - 0.5, by - 0.5, 0.9, (245, 246, 248))
    salida = np.zeros((32, 32, 4))
    salida[1:31, 1:31] = arr
    # sombra suave abajo a la derecha, como los otros iconos
    sombra = np.zeros((32, 32))
    sombra[2:32, 2:32] = salida[1:31, 1:31, 3] / 255
    fondo = (sombra > 0) & (salida[..., 3] == 0)
    salida[fondo] = (0, 0, 0, 70)
    # contorno un poco mas oscuro en el borde del dibujo
    a = salida[..., 3] == 255
    borde = a & ~(np.roll(a, 1, 0) & np.roll(a, -1, 0) & np.roll(a, 1, 1) & np.roll(a, -1, 1))
    salida[borde, :3] *= 0.7
    return np.clip(salida, 0, 255).astype(np.uint8)


def vistas_previas(tex, carpeta, ico):
    os.makedirs(carpeta, exist_ok=True)
    fondo = (92, 96, 88, 255)
    vistas = [("diario-iso.png", -35, 40, 3800), ("diario-arriba.png", 0, 90, 3800),
              ("diario-canto.png", -80, 18, 4200), ("diario-correa-cerca.png", -60, 35, 9000)]
    for nombre, yaw, pitch, esc in vistas:
        centro = (0.045, 0.02, 0.0) if "cerca" in nombre else (0, 0.014, 0)
        img = render(tex, yaw, pitch, 1000, esc, centro, fondo)
        Image.fromarray(img.astype(np.uint8), "RGBA").convert("RGB").resize((800, 800), Image.LANCZOS).save(
            os.path.join(carpeta, nombre))
    # textura sola
    Image.fromarray(tex).resize((512, 512), Image.NEAREST).save(os.path.join(carpeta, "diario-textura.png"))
    # icono: tamano real y ampliado, junto a otros iconos del mod para comparar
    Image.fromarray(ico, "RGBA").save(os.path.join(carpeta, "diario-icono-32.png"))
    otros = ["Item_NarradorLibroCuentasHasag.png", "Item_NarradorExpedienteSellado.png", "Item_NarradorMaletinMilitar.png"]
    hoja = Image.new("RGBA", (256 * 4, 256 + 96), (90, 90, 90, 255))
    hoja.alpha_composite(Image.fromarray(ico, "RGBA").resize((256, 256), Image.NEAREST), (0, 0))
    for i, f in enumerate(otros):
        ruta = os.path.join(BASE, "textures", f)
        if os.path.exists(ruta):
            hoja.alpha_composite(Image.open(ruta).convert("RGBA").resize((256, 256), Image.NEAREST), (256 * (i + 1), 0))
    for i, f in enumerate([None] + otros):
        im = Image.fromarray(ico, "RGBA") if f is None else Image.open(os.path.join(BASE, "textures", f)).convert("RGBA")
        hoja.alpha_composite(im, (256 * i + 20, 280))
        hoja.alpha_composite(im.resize((64, 64), Image.NEAREST), (256 * i + 80, 270))
    hoja.save(os.path.join(carpeta, "diario-icono-comparado.png"))


if __name__ == "__main__":
    construir()
    tex = textura()
    escribir_x(os.path.join(BASE, "models_X", "Narrador", NOMBRE + ".X"))
    Image.fromarray(tex, "RGB").convert("RGBA").save(os.path.join(BASE, "textures", "Narrador", NOMBRE + ".png"))
    ico = icono(tex)
    Image.fromarray(ico, "RGBA").save(os.path.join(BASE, "textures", "Item_Narrador%s.png" % NOMBRE))
    ys = [p[1] for t in tris for p in t[:3]]
    xs = [p[0] for t in tris for p in t[:3]]
    print("Diario de Meulen: %d triangulos, x %.3f..%.3f, y %.3f..%.3f" % (len(tris), min(xs), max(xs), min(ys), max(ys)))
    if len(sys.argv) > 1:
        vistas_previas(tex, sys.argv[1], ico)
