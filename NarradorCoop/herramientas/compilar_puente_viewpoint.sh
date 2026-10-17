#!/usr/bin/env bash
# Compila el puente Java NarradorViewpoint (Project Viewpoint -> Lua) y deja el jar en
# NarradorCoop/42/media/java/client/NarradorViewpoint.jar, donde lo carga ZombieBuddy.
#
# Uso:  NarradorCoop/herramientas/compilar_puente_viewpoint.sh
# Variables opcionales:
#   JDK      carpeta de un JDK >= 17 (por defecto /root/repos/wt/brujula-build/jdk o el javac del PATH)
#   ZB_JAR   ZombieBuddy.jar (solo se usa para la anotacion @Exposer.LuaClass)
#
# Se compila con --release 17 (Viewpoint usa clases de Java 17; el juego trae Java 25).
# No hace falta Viewpoint.jar ni projectzomboid.jar: todo se lee por reflexion.
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOD="$(cd "$AQUI/.." && pwd)"
SRC="$MOD/java/NarradorViewpoint/src"
SALIDA="$MOD/42/media/java/client/NarradorViewpoint.jar"
WORKSHOP="/var/lib/docker/volumes/hostinger-stack_zomboid_server/_data/steamapps/workshop/content/108600"
ZB_JAR="${ZB_JAR:-$WORKSHOP/3619862853/mods/ZombieBuddy/libs/ZombieBuddy.jar}"

if [ -n "${JDK:-}" ]; then
    JAVAC="$JDK/bin/javac"; JAR="$JDK/bin/jar"
elif [ -x /root/repos/wt/brujula-build/jdk/bin/javac ]; then
    JAVAC=/root/repos/wt/brujula-build/jdk/bin/javac; JAR=/root/repos/wt/brujula-build/jdk/bin/jar
else
    JAVAC=javac; JAR=jar
fi

[ -f "$ZB_JAR" ] || { echo "No encuentro ZombieBuddy.jar en $ZB_JAR (usa ZB_JAR=...)" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/clases"

"$JAVAC" --release 17 -encoding UTF-8 -nowarn -cp "$ZB_JAR" -d "$TMP/clases" \
    $(find "$SRC" -name '*.java' | sort)

printf 'Manifest-Version: 1.0\nCreated-By: NarradorCoop\n' > "$TMP/MANIFEST.MF"
# Fechas fijas para que el jar (y su SHA-256, que ZombieBuddy pide aprobar) sea reproducible.
mkdir -p "$(dirname "$SALIDA")"
rm -f "$SALIDA"
"$JAR" --create --file "$SALIDA" --manifest "$TMP/MANIFEST.MF" --date 2026-01-01T00:00:00Z -C "$TMP/clases" .
echo "OK: $SALIDA"
sha256sum "$SALIDA" 2>/dev/null || true
