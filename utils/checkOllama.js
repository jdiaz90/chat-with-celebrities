import dotenv from "dotenv";
import { getAvailableModels } from "../services/ollamaService.js";
dotenv.config();

const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";

/**
 * Verifica la disponibilidad de la API de Ollama y, opcionalmente, 
 * muestra por consola los modelos de IA cargados en la instancia.
 *
 * - Llama internamente a {@link getAvailableModels} para obtener la lista.
 * - Si `verbose` es `true`, imprime en consola:
 *   - Dirección base de la API (`OLLAMA_API`).
 *   - Advertencia si no hay modelos disponibles.
 *   - Lista numerada de modelos si existen.
 * - Devuelve siempre el array con los nombres de los modelos obtenidos.
 * - Lanza el error si la conexión o la petición fallan.
 *
 * @param {boolean} [verbose=true] - Si es `true`, muestra información en consola.
 * @returns {Promise<string[]>} Array de nombres de modelos disponibles.
 *
 * @throws {Error} Si la conexión a Ollama falla o no se pueden obtener los modelos.
 *
 * @example
 * // Uso típico en un script de diagnóstico
 * (async () => {
 *   const modelos = await checkOllama();
 *   console.log(`Modelos detectados: ${modelos.length}`);
 * })();
 */
export async function checkOllama(verbose = true) {
  try {
    const models = await getAvailableModels();

    if (verbose) {
      console.log(`\n✅ Ollama disponible en ${OLLAMA_API}`);
      if (models.length === 0) {
        console.log("⚠️ No hay modelos disponibles actualmente.");
      } else {
        console.log("📦 Modelos disponibles:");
        models.forEach((name, i) => {
          console.log(`  ${i + 1}. ${name}`);
        });
      }
    }

    return models;
  } catch (err) {
    console.error("❌ Error al conectar con Ollama:", err.message);
    throw err;
  }
}
