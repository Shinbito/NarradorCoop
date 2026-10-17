package narradorvp;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

import me.zed_0xff.zombie_buddy.Exposer;

/**
 * Puente minimo entre Project Viewpoint (mod Java via ZombieBuddy) y el Lua de Narrador Co-op.
 *
 * ZombieBuddy registra esta clase en Lua (por @Exposer.LuaClass) como la tabla global
 * "NarradorViewpoint"; sus metodos estaticos se llaman desde Lua con punto:
 *   NarradorViewpoint.yaw()  -> rumbo de la camara en radianes, o nil
 *
 * Todo se lee por reflexion: si Viewpoint no esta, cambia de version o renombra campos,
 * los metodos devuelven nil/false en vez de romper. No se compila contra Viewpoint.jar.
 *
 * Convencion del angulo (verificada en el bytecode de Viewpoint 0.1.6.1):
 *   viewpoint.input.Look.yaw (float, radianes) es la camara; Viewpoint hace
 *   IsoPlayer.setForwardDirection(cos(yaw), sin(yaw)) y mueve con (cos(yaw), sin(yaw)),
 *   asi que es un rumbo del mundo de PZ: atan2(dy, dx) con x al este e y al sur.
 *   Es la misma convencion que IC.rumbo / IC.enBrujula: no hace falta conversion.
 *   Cada frame Viewpoint copia Look.yaw a viewpoint.core.Frame.viewYaw (respaldo).
 */
@Exposer.LuaClass
public final class NarradorViewpoint {
    public static final String VERSION = "1";

    private static boolean iniciado;
    private static String error = "";
    private static Field fEnabled;     // viewpoint.core.View.enabled (boolean)
    private static Field fThird;       // viewpoint.core.View.thirdPerson (boolean)
    private static Field fLookYaw;     // viewpoint.input.Look.yaw (float)
    private static Field fFrames;      // viewpoint.FP.frames (Frame[])
    private static Field fViewYaw;     // viewpoint.core.Frame.viewYaw (float)
    private static String fuente = "ninguna";

    private NarradorViewpoint() {}

    private static Class<?> clase(String nombre) {
        try {
            ClassLoader cl = Thread.currentThread().getContextClassLoader();
            if (cl != null) {
                try { return Class.forName(nombre, false, cl); } catch (Throwable ignored) { }
            }
            return Class.forName(nombre, false, NarradorViewpoint.class.getClassLoader());
        } catch (Throwable t) {
            return null;
        }
    }

    private static Field campo(Class<?> c, String nombre) {
        if (c == null) return null;
        try {
            Field f = c.getDeclaredField(nombre);
            f.setAccessible(true);
            return f;
        } catch (Throwable t) {
            return null;
        }
    }

    // Si el nombre exacto no esta, busca un campo estatico del tipo pedido cuyo nombre contenga "pista".
    private static Field campoParecido(Class<?> c, Class<?> tipo, String pista, boolean estatico, String evitar) {
        if (c == null) return null;
        try {
            for (Field f : c.getDeclaredFields()) {
                String n = f.getName().toLowerCase();
                if (f.getType() != tipo) continue;
                if (Modifier.isStatic(f.getModifiers()) != estatico) continue;
                if (!n.contains(pista)) continue;
                if (evitar != null && n.contains(evitar)) continue;
                f.setAccessible(true);
                return f;
            }
        } catch (Throwable ignored) { }
        return null;
    }

    private static long ultimoIntento;

    // Si Viewpoint aun no estaba cargado (orden de mods) se reintenta cada 5 s.
    private static synchronized void iniciar() {
        if (iniciado) return;
        long ahora = System.currentTimeMillis();
        if (ultimoIntento != 0 && ahora - ultimoIntento < 5000) return;
        ultimoIntento = ahora;
        try {
            Class<?> view = clase("viewpoint.core.View");
            Class<?> look = clase("viewpoint.input.Look");
            Class<?> fp = clase("viewpoint.FP");
            Class<?> frame = clase("viewpoint.core.Frame");
            if (view == null && look == null) { error = "sin clases de Viewpoint"; return; }
            fEnabled = campo(view, "enabled");
            fThird = campo(view, "thirdPerson");
            if (fThird == null) fThird = campoParecido(view, boolean.class, "third", true, null);
            fLookYaw = campo(look, "yaw");
            if (fLookYaw == null || fLookYaw.getType() != float.class)
                fLookYaw = campoParecido(look, float.class, "yaw", true, "held");
            fFrames = campo(fp, "frames");
            fViewYaw = campo(frame, "viewYaw");
            if (fViewYaw == null) fViewYaw = campoParecido(frame, float.class, "yaw", false, null);
            fuente = fLookYaw != null ? "Look." + fLookYaw.getName()
                   : (fFrames != null && fViewYaw != null) ? "Frame." + fViewYaw.getName() : "ninguna";
            System.out.println("[NarradorCoop] puente Viewpoint: yaw=" + fuente
                + " enabled=" + (fEnabled != null) + " thirdPerson=" + (fThird != null));
            if (fLookYaw != null || (fFrames != null && fViewYaw != null)) { iniciado = true; error = ""; }
        } catch (Throwable t) {
            error = String.valueOf(t);
        }
    }

    private static boolean bool(Field f, boolean porDefecto) {
        if (f == null) return porDefecto;
        try { return f.getBoolean(null); } catch (Throwable t) { return porDefecto; }
    }

    private static float yawCrudo() {
        iniciar();
        if (fLookYaw != null) {
            try {
                float v = fLookYaw.getFloat(null);
                if (!Float.isNaN(v) && !Float.isInfinite(v)) return v;
            } catch (Throwable ignored) { }
        }
        if (fFrames != null && fViewYaw != null) {
            try {
                Object arr = fFrames.get(null);
                if (arr != null && Array.getLength(arr) > 0) {
                    Object fr = Array.get(arr, 0);
                    if (fr != null) {
                        float v = fViewYaw.getFloat(fr);
                        if (!Float.isNaN(v) && !Float.isInfinite(v)) return v;
                    }
                }
            } catch (Throwable ignored) { }
        }
        return Float.NaN;
    }

    /** true si se encontraron las clases de Viewpoint y algun campo de yaw. */
    public static boolean disponible() {
        iniciar();
        return fLookYaw != null || (fFrames != null && fViewYaw != null);
    }

    /** true si la vista de Viewpoint esta activa (primera o tercera persona). */
    public static boolean activo() {
        iniciar();
        return bool(fEnabled, false);
    }

    /** true si Viewpoint esta activo y en primera persona. */
    public static boolean primeraPersona() {
        iniciar();
        return bool(fEnabled, false) && !bool(fThird, false);
    }

    /** Rumbo de la camara (radianes, convencion atan2(dy,dx) del mundo) o nil si no esta en primera persona. */
    public static Double yaw() {
        if (!primeraPersona()) return null;
        float v = yawCrudo();
        return Float.isNaN(v) ? null : Double.valueOf(v);
    }

    /** Igual que yaw() pero tambien en tercera persona (camara orbital de Viewpoint). nil si Viewpoint esta apagado. */
    public static Double yawCualquiera() {
        if (!activo()) return null;
        float v = yawCrudo();
        return Float.isNaN(v) ? null : Double.valueOf(v);
    }

    /** Texto de diagnostico para console.txt. */
    public static String estado() {
        iniciar();
        return "puente=" + VERSION + " fuente=" + fuente + " activo=" + activo() + " primeraPersona=" + primeraPersona()
            + " yaw=" + yawCrudo() + (error.isEmpty() ? "" : " error=" + error);
    }

    public static String version() {
        return VERSION;
    }
}
