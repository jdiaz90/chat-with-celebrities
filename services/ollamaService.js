import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * 🔗 Dirección base de la API de Ollama.
 * Por defecto usa localhost si no está definida en .env.
 * 
 * Variables de entorno:
 * - OLLAMA_API: URL base (p. ej., http://localhost:11434)
 */
const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";

/**
 * 📋 Obtiene los modelos disponibles en la instancia de Ollama.
 *
 * Realiza un GET a `${OLLAMA_API}/api/tags` y extrae los nombres de los modelos.
 * Estructura esperada de la respuesta:
 * `{ models: [{ name: 'mistral:latest', ... }, ...] }`
 *
 * En caso de error, devuelve un array vacío y registra el error en consola.
 *
 * @returns {Promise<string[]>} Array de nombres de modelos (p. ej., ['mistral:latest', 'gemma:2b']).
 *
 * @example
 * const models = await getAvailableModels();
 * console.log(models.includes('mistral:latest')); // true/false
 */
export async function getAvailableModels() {
  try {
    const response = await fetch(`${OLLAMA_API}/api/tags`);
    const data = await response.json();

    // El formato esperado es: { models: [{ name: '...' }, ...] }
    return data.models.map((model) => model.name);
  } catch (error) {
    console.error("❌ Error al obtener modelos de Ollama:", error);
    return [];
  }
}

/**
 * 🧠 Genera una respuesta utilizando un modelo de Ollama.
 *
 * Realiza un POST a `${OLLAMA_API}/api/generate` con:
 * `{ model: <nombreModelo>, prompt: <textoPrompt> }`
 *
 * La respuesta es un stream NDJSON (cada línea es un JSON con campos como `response`, `done`, ...).
 * Este método solo devuelve el stream (`response.body`) para que el controlador
 * lo procese y lo envíe al cliente como corresponda.
 *
 * @param {string} model - Nombre del modelo (p. ej., 'mistral:latest').
 * @param {string} prompt - Texto del prompt a enviar.
 * @returns {Promise<ReadableStream>} Stream con la respuesta generada (NDJSON).
 *
 * @throws {Error} Lanza el error si la petición falla. El llamador debe manejarlo.
 *
 * @example
 * const body = await generateResponse('mistral:latest', 'Hola, ¿qué tal?');
 * // Iterar el stream (en un entorno que soporte ReadableStream):
 * const reader = body.getReader();
 * const decoder = new TextDecoder();
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   console.log(decoder.decode(value));
 * }
 */
export async function generateResponse(model, prompt) {
  try {
    const response = await fetch(`${OLLAMA_API}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt }),
    });

    // El cuerpo es un stream NDJSON (líneas con objetos { response, done, ... })
    return response.body;
  } catch (error) {
    console.error("❌ Error al generar respuesta:", error);
    throw error;
  }
}
