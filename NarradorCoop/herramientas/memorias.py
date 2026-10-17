#!/usr/bin/env python3
"""Lista central de las memorias de la partida (Motor.estado().memoria) y su chequeo.

Cada memoria que el mod escribe o lee tiene que estar aca, con una linea que diga que guarda.
Las claves armadas van con <...>: "favor_<rol>" cubre favor_hanz, favor_jorge, etc.

Chequeo (desde la raiz del repo, no necesita lupa):  python3 NarradorCoop/herramientas/memorias.py
Falla (sale con 1) si:
  - el codigo usa una memoria que no esta en la lista (agregarla aca),
  - la lista tiene una memoria que el codigo ya no usa (sacarla),
  - alguien lee una memoria que nadie escribe (casi seguro un error de tipeo),
  - alguien escribe una memoria que nadie lee y no esta en SIN_LECTOR (decidir: usarla o anotarla).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from escaner_memorias import coincide, escanear  # noqa: E402

MEMORIAS = {
    # --- Historia principal: los Bell y Sous ---
    "bell": "Como terminaron los Bell (salvados, enganados, abandonados, masacre...). Sous la lee.",
    "bell_culpa": "Les diste una pastilla falsa a los Bell y te quedaste con la verdadera. Maulen lo sabe; en Sous oyen a los Bell hablar bien de ti.",
    "curandero_falso": "Los Bell compraron pastillas a un curandero falso: era el doctor Hartmann (te lo confiesa en el cap. 3 de la Chela).",
    "sous": "Relacion con Sous: aliados, enemigos, ignorados, negado, caidos, eliminado, conquistada, maulen_escapa.",
    "sous_mentira": "Le mentiste a Sous sobre la noche de Maulen (los misioneros sospechan).",
    "maulen_salvado": "Dejaste ir a Maulen en el escondite: abre su camino como jefe del patio.",
    "meulen_muerte_hora": "Hora en que el lanzador vio a Meulen muerto (en Sous o en el patio): 120 horas despues vuelve (venganza_meulen).",
    "meulen_venganza": "La venganza de Meulen ya se lanzo ('lanzada'): no se repite.",
    "meulen_final": "Como termino la venganza de Meulen: muerto (de verdad; abre el reclutamiento de Sous).",
    "arsenal": "Que sacaste del arsenal de Louisville (arma, auto o traje). Un misionero te lo comenta (NarradorConsecuencias).",
    "arsenal_comentado": "Que misionero ya te comento lo del arsenal (una sola vez).",
    "<prefijo>_lider": "Quien lidera un grupo despues de las bajas (accion 'bajas' del motor, prefijo = 'sous').",
    "<prefijo>_lider_nombre": "Nombre del lider del grupo (accion 'bajas').",
    "<prefijo>_lider_perfil": "Perfil de A-Life del lider del grupo (accion 'bajas').",
    "<prefijo>_murio_<rol>": "Ese rol del grupo murio (sous_murio_hanz...). Lo usan charlas, encuentros y 'sin_muertos_de'.",
    "favor_<rol>": "El favor de ese miembro de Sous: hecho o murio. Con 'hecho' ya no se ofrece.",
    "poster_sous": "Ya se entrego el poster de Sous.",
    "sous_base": "La base de Sous ya se amueblo (NarradorSousBase): sillas, generador, quien se sienta donde.",
    "lugar.base_sous": "Lugar de la base de Sous (memoria_lugar), lo reusan favores, conquista y calendario.",
    "cal.fonda": "Como salio la fonda del 18 de septiembre (hecha o sin).",
    "sous_historia_<rol>": "Modo historia de Sous, parte 2 (Walita, Cristonks, Hasag, Wertres): hecho, fallido, postergada o murio. El lanzador ofrece las nuevas y despues las postergadas.",
    "sous_historias2.ultima": "Hora en que el lanzador de HistoriasSous2 lanzo (o reintento) la ultima historia; marca la espera entre historias.",
    # --- Misioneros y campamentos ---
    "campamento_<id>": "El campamento de ese misionero se fundo (Desbloqueos). Hoy el codigo mira C.desbloqueado().",
    "historia_<id>_<n>": "Capitulo n de la historia de ese misionero hecho (true) o fallido. Lo piden G.ESPECIALES y los niveles del campamento.",
    "caido_<quien>": "Un NPC inmune (Eduardo) cayo: true; 'volvio' cuando reaparece en el cuartel.",
    "dominio_<id>": "De quien es la ciudad: nil = mision, 'bandido' o 'nuevo' (NarradorDominios).",
    "misionero_muerto_<id>": "El misionero de esa ciudad murio en la conquista.",
    "radio_westpoint": "La radio del cuartel de la Chela quedo arreglada (cap. 2): las amenazas se avisan antes y por la radio.",
    "lucia": "Que paso con la Hermana Lucia en el cap. 3 del Padre Nacho (en_riverside o muerta). Si murio, la reemplaza otro.",
    "estanque_rosewood": "El estanque de bencina de la Misia Rosa quedo defendido (cap. 3): cada 72 horas te deja un bidon lleno.",
    "estanque_ultima": "Hora del ultimo bidon del estanque de la Misia Rosa (NarradorConsecuencias).",
    "hija_cabo": "Valentina: salvada o muerta. Si murio, en la reconquista la reemplaza otro (NUEVO_MURIO).",
    "cura_<contacto>": "Como termino la primera mision de la cura de ese misionero: salvo o murio (cura_rosewood = el sobrino de la Misia Rosa).",
    "nuevo_<id>": "Quien reemplaza al misionero nuevo de la reconquista que murio antes: bell_padre, bell_madre, bell_hijo o forastero.",
    "mercader_misionero_<id>": "Cual de K.MERCADERES es el forastero que manda en esa ciudad (indice).",
    "mercader_<oficio>_<contacto>": "Cual de K.MERCADERES hace un oficio del campamento porque el propio murio (indice).",
    # --- Eduardo (en el codigo, "eduardo") ---
    "eduardo_conocido": "Ya conociste a Eduardo (cap. 3 de la Chela). Abre sus eventos fortuitos.",
    "eduardo_vivo": "Eduardo volvio vivo al cuartel despues de caer.",
    "eduardo_muerto_duelo": "Mataste a Eduardo en el duelo de Fallas Lake. Corta sus eventos.",
    "cientifico_hartmann": "El doctor Hartmann: en_west_point o muerto. Muerto, el curandero de la Chela es un mercader.",
    "eduardo_ev_dia": "Ultimo dia en que se tiro el evento fortuito de Eduardo.",
    "eduardo_ev_hora": "Hora del ultimo evento fortuito de Eduardo.",
    # --- Camino del bandido ---
    "knox_bandido_<grupo>": "'listo' la primera vez que el grupo llega a -5 de Knox (abre a Pereira).",
    "bandido": "Camino del bandido: pereira, rechazado, redimido o pereira_escapo.",
    "bandido_cap": "Ultimo capitulo del bandido hecho (1 a 5).",
    "bandido_desde": "Hora del ultimo capitulo del bandido (12 horas entre uno y otro).",
    "bandido_jefe": "Quien manda el patio: nil = Pereira, 'maulen'.",
    "bandido_sospecha": "Sabotajes sin descubrir: cada uno suma 30% de que Pereira mande cazadores.",
    "bandido_aviso_cabo": "Ya se aviso que el cap. 2 espera el campamento del Cabo.",
    "bandido_ultimo": "Como termino el ultimo capitulo del bandido (hecho o abandonado).",
    "pereira_desconfia": "Pereira descubrio un sabotaje (castigo): desde ahi cada sabotaje pesa 45% en vez de 30%.",
    "pereira_aviso_desconfia": "Ya se aviso que el jefe del patio te vigila.",
    "julio_vivo": "Dejaste ir a Julio Cardenas en el cap. 1.",
    "maulen_hora": "Hora en que se perdono a Maulen (72 horas despues toma el patio).",
    "lugar.bandido_patio": "Lugar de la casa de Pereira en el patio de trenes.",
    "conquista_<id>": "Esa ciudad (o 'sous') ya fue conquistada.",
    "conquista_aviso": "Ya se aviso que empieza la conquista.",
    "knox_conquistado": "Las cinco conquistas terminaron: Knox es de la banda.",
    "knox_conquistado_hora": "Hora en que Knox quedo conquistado (cuenta para el primer atentado).",
    "eduardo_atentados": "Atentados de Eduardo hechos (3).",
    "eduardo_desde": "Hora del ultimo atentado de Eduardo.",
    "eduardo_nota": "Eduardo dejo la nota con el mapa a Fallas Lake.",
    "eduardo_fallas": "Ya se lanzo la historia de Fallas Lake.",
    "lugar.eduardo_base": "Lugar de las casas de Fallas Lake.",
    "reconquista": "Elegiste hablar con Eduardo: empieza la reconquista.",
    "reconquista_<id>": "Esa ciudad ya fue reconquistada.",
    "reconquista_aviso": "Ya se aviso que empieza la reconquista.",
    "reconquista_patio_lanzada": "Ya se lanzo el asalto final al patio.",
    "fin": "Final del juego: eduardo_muerto o reconquista. Corta el bandido y los eventos de Eduardo.",
    # --- Eventos cortos ---
    "denise": "Denise (sobreviviente acorralada): rescatada, muerta o asesinada. Rescatada: Lonnie te trae su comida; asesinada: Lonnie te caza (ConsecuenciasExtra).",
    "lucas": "Lucas (hijo perdido): rescatado, muerto, asesinado o transformado. Rescatado: te marca una farmacia; asesinado: Loretta lo cuenta (Knox -15).",
    "desertor": "El desertor: protegido, entregado, echado, muerto o asesinado. Protegido: Ray vuelve con la Guardia detras (ConsecuenciasExtra).",
    "trueque": "El trueque trampa: ganado. Ganado: los hermanos de los emboscadores vienen a cobrar (ConsecuenciasExtra).",
    "asalto": "El asalto nocturno: rechazado.",
    "alijo": "El alijo custodiado: encontrado; despues compartido, negado o viuda_muerta (la viuda del dueno, ConsecuenciasExtra).",
    # --- Motor ---
    "<def>.final": "Ultimo final de cada historia (sous.final = 'final_aliados'). Lo escribe el motor al terminar.",
    "lugar.<clave>": "Lugares guardados con memoria_lugar (ver lugar.base_sous y compania).",
    "faccion.<id>": "Postura de las facciones propias en A-Life (accion 'faccion').",
    "conv.<conv>": "Respuesta elegida en una conversacion de 'pregunta' (NarradorConversas).",
    "conv.<conv>.quien": "Quien respondio esa conversacion.",
    "conv.<conv>.hora": "A que hora se respondio.",
}

# Memorias que se escriben y nadie lee, a proposito. El motivo dice para que estan.
SIN_LECTOR = {
    "cal.fonda": "registro",
    "campamento_<id>": "registro; el codigo mira C.desbloqueado() y historia_<id>_1",
    "eduardo_vivo": "registro",
    "bandido_ultimo": "registro",
    "asalto": "registro (eventos cortos)",
    "faccion.<id>": "registro del motor",
    "conv.<conv>.quien": "registro",
    "conv.<conv>.hora": "registro",
}


# Usos que el escaner no ve (la memoria llega como parametro de una funcion compartida).
OTROS_USOS = {
    "mercader_<oficio>_<contacto>": ("shared/Narrador/NarradorCampamentosDefs.lua", True, True),  # archivo, escribe, lee
}


def entrada(clave):
    """La entrada de MEMORIAS que cubre esa clave del codigo (la mas especifica)."""
    fijas = [e for e in MEMORIAS if e == clave]
    if fijas:
        return fijas[0]
    candidatas = [e for e in MEMORIAS if coincide(clave, e)]
    return min(candidatas, key=lambda e: e.count("<"), default=None) if candidatas else None


def agrupar():
    """entrada -> (archivos que escriben, archivos que leen, claves del codigo)."""
    escribe, lee = escanear()
    for clave, (archivo, w, r) in OTROS_USOS.items():
        if w:
            escribe.setdefault(clave, set()).add(archivo)
        if r:
            lee.setdefault(clave, set()).add(archivo)
    out, sueltas = {}, set()
    for clave in set(escribe) | set(lee):
        e = entrada(clave)
        if e is None:
            sueltas.add(clave)
            continue
        w, r, ks = out.setdefault(e, (set(), set(), set()))
        w.update(escribe.get(clave, ()))
        r.update(lee.get(clave, ()))
        ks.add(clave)
    # Una lectura armada ("historia_<id>_<capitulo>") tambien lee las entradas fijas que calza.
    for clave, archivos in lee.items():
        if "<" in clave:
            for e, (w, r, ks) in out.items():
                if e != entrada(clave) and coincide(clave, e):
                    r.update(archivos)
    for clave, archivos in escribe.items():
        if "<" in clave:
            for e, (w, r, ks) in out.items():
                if e != entrada(clave) and coincide(clave, e):
                    w.update(archivos)
    return out, sueltas


def chequear():
    out, sueltas = agrupar()
    errores, avisos = [], []
    for c in sorted(sueltas):
        errores.append(f"'{c}' se usa en el codigo y no esta en MEMORIAS")
    for e in sorted(MEMORIAS):
        if e not in out:
            errores.append(f"'{e}' esta en MEMORIAS pero el codigo ya no la usa")
            continue
        w, r, _ = out[e]
        if r and not w:
            errores.append(f"'{e}' se lee y nadie la escribe ({', '.join(sorted(r))})")
        if w and not r and e not in SIN_LECTOR:
            errores.append(f"'{e}' se escribe y nadie la lee ({', '.join(sorted(w))}): usarla o anotarla en SIN_LECTOR")
        if r and e in SIN_LECTOR:
            avisos.append(f"'{e}' ya se lee: sacarla de SIN_LECTOR")
    for e in sorted(set(SIN_LECTOR) - set(MEMORIAS)):
        errores.append(f"'{e}' esta en SIN_LECTOR y no en MEMORIAS")
    pendientes = sorted(e for e, m in SIN_LECTOR.items() if m.startswith("pendiente"))
    print(f"{len(MEMORIAS)} memorias, {len(SIN_LECTOR)} sin lector ({len(pendientes)} pendientes de usar)")
    for a in avisos:
        print("aviso:", a)
    for e in errores:
        print("error:", e)
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(chequear())
