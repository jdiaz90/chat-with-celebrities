import dotenv from "dotenv";
dotenv.config();

/**
 * Modelo por defecto a usar si no hay ningún modelo de la lista de preferencias
 * disponible para una celebridad concreta.
 * 
 * Definido por la variable de entorno DEFAULT_MODEL o, si no existe,
 * por el literal "gpt-oss:20b".
 */
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "gpt-oss:20b";

/**
 * Diccionario de celebridades y sus datos básicos.
 * 
 * La clave es un identificador corto (id) usado en URLs y lógica interna,
 * y el valor es un objeto con:
 * - `name`: nombre completo para mostrar
 * - `avatar`: ruta a la imagen del avatar
 * 
 * @type {Record<string, { name: string, avatar: string }>}
 */
export const celebrityMap = {
  einstein: { name: "Albert Einstein", avatar: "/images/einstein.jpg" },
  frida: { name: "Frida Kahlo", avatar: "/images/frida.jpg" },
  leonardo: { name: "Leonardo da Vinci", avatar: "/images/leonardo.jpg" },
  curie: { name: "Marie Curie", avatar: "/images/curie.jpg" },
};

/**
 * Normaliza la lista completa de modelos disponibles a su "base".
 * 
 * Ejemplo:
 *   ["mistral:latest", "llama3:8b"]
 * → Set { "mistral", "llama3" }
 *
 * @param {string[]} [availableModels=[]] - Lista de modelos (pueden incluir sufijos como ":latest" o ":8b").
 * @returns {Set<string>} Conjunto de nombres base en minúsculas.
 */
function normalizeModels(availableModels = []) {
  const bases = availableModels
    .filter(Boolean)
    .map((m) => String(m).split(":")[0].toLowerCase());
  return new Set(bases);
}

/**
 * Asigna un modelo (por su base) a cada celebridad, según disponibilidad y preferencias.
 * 
 * - Comprueba, para cada celebridad, la lista de modelos preferidos en orden de prioridad.
 * - Si ninguno está disponible, devuelve el modelo por defecto {@link DEFAULT_MODEL}.
 * - El "match" se hace por nombre base (antes de los dos puntos).
 * 
 * @param {string[]} availableModels - Lista de modelos disponibles actualmente.
 * @returns {Record<string, string>} Mapa id de celebridad → nombre base del modelo elegido o modelo por defecto.
 *
 * @example
 * const models = ["mistral:latest", "llama3:8b"];
 * const map = modelMapByCelebrity(models);
 * // map.einstein podría ser "llama3"
 */
export function modelMapByCelebrity(availableModels) {
  const bases = normalizeModels(availableModels);
  const has = (base) => bases.has(base.toLowerCase());

  // Preferencias de modelos por celebridad (en orden de prioridad)
  const preferred = {
    einstein: ["llama3", "mistral", "gemma"],
    frida: ["mistral", "llama3", "gemma"],
    leonardo: ["gemma", "mistral", "llama3"],
    curie: ["llama3", "mistral", "gemma"],
  };

  const pick = (prefs) => {
    for (const base of prefs) {
      if (has(base)) return base;
    }
    return DEFAULT_MODEL;
  };

  return {
    einstein: pick(preferred.einstein),
    frida: pick(preferred.frida),
    leonardo: pick(preferred.leonardo),
    curie: pick(preferred.curie),
  };
}
