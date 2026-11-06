# Voces de los personajes (ElevenLabs)

Los personajes del Narrador hablan con su voz, por proximidad:

- **Cerca** (8 casillas o menos): la frase clara.
- **Lejos** (hasta 25 casillas, opción `Narrador.VocesDistancia`): la misma frase apagada, como a
  través de una pared. Se oye que hablan, no qué dicen.
- **Frases sin audio** (las que nombran lugares o personas y cambian en cada partida): un
  murmullo con la voz de ese personaje (opción `Narrador.VocesMurmullos`).
- Si hablan varios a la vez se mezclan solos (cada voz sale de su cuerpo). Como mucho 6 voces a la
  vez para que no se sature.

El código del juego está en `42/media/lua/client/Narrador/NarradorVoces.lua`. Los audios, sus
sonidos y su índice los genera `generar.py`.

## Archivos

| Archivo | Qué es |
|---|---|
| `voces.json` | Catálogo de voces: una por personaje, con su `elevenlabs_voice_id`. |
| `textos_voz.json` | Texto con tildes, eñes y ¿¡ para cada frase (revisado frase por frase). |
| `guion.csv` / `guion.json` | El guion completo: id, voz, texto del juego y texto para la voz. Lo arma `exportar.py`. |
| `audio/` | Los mp3 originales de ElevenLabs (no van al repo: **guárdalos**, cuestan créditos). |
| `../../42/media/sound/NarradorVoces/` | Los .ogg del mod (cerca y `_lejos`). |

## Paso a paso

1. **Crear las voces propias** (Sous, Meulen, Eduardo y Miguel Ángel: `"tipo": "diseñada"` en
   `voces.json`). En ElevenLabs, *Voices → Add a new voice → Voice Design*: pegar la `descripcion`,
   probar un texto del personaje (sacarlo de `guion.csv`), guardar y copiar el *Voice ID* en
   `elevenlabs_voice_id`.
2. **Elegir las de biblioteca** (el resto, `"tipo": "biblioteca"`): en la *Voice Library* buscar una
   que calce con la `descripcion` (filtrar por español), agregarla a "My Voices" y copiar su ID.
   Los personajes secundarios con 1 a 3 frases pueden compartir voz (mismo ID).
3. **Armar el guion** (necesita `pip install lupa`):
   ```bash
   python3 NarradorCoop/herramientas/voces/exportar.py
   ```
4. **Ver cuánto va a costar** antes de gastar créditos:
   ```bash
   python3 NarradorCoop/herramientas/voces/generar.py --probar
   ```
5. **Generar** (necesita `ffmpeg`). Conviene empezar por una voz y escucharla en el juego:
   ```bash
   export ELEVENLABS_API_KEY=tu_clave
   python3 NarradorCoop/herramientas/voces/generar.py --voz eduardo
   ```
   Después, todo: `python3 NarradorCoop/herramientas/voces/generar.py`. Si una toma salió mal:
   `--rehacer <id>` (el id está en `guion.csv`).

## Cuando se agregan o cambian diálogos

El id de cada frase sale de su texto: si se cambia una frase, pasa a ser otra y hay que
generarla de nuevo (la vieja se borra del mod sola).

1. `python3 NarradorCoop/herramientas/voces/exportar.py --pendientes` escribe `pendientes.json`
   con las frases nuevas sin revisar (con un intento automático de tildes).
2. Corregir sus tildes y pasarlas a `textos_voz.json` (mismo formato: `id → {original, voz}`).
3. `generar.py` pide solo las que faltan.

Si aparece un personaje nuevo, `exportar.py` lo agrega a `voces.json` para que le elijas voz.
