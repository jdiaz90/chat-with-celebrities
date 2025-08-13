import { Readable } from "stream";
import { celebrityMap, modelMapByCelebrity } from "../utils/modelSelector.js";
import { getAvailableModels, generateResponse } from "../services/ollamaService.js";
import { generatePrompt } from "../utils/promptTemplates.js";

/**
 * Genera un id corto para correlacionar logs por request.
 * @returns {string} Identificador aleatorio de 6 caracteres.
 */
function makeReqId() {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Indica si deben activarse logs de depuración para la petición actual.
 * Lee DEBUG_PROMPTS=1 o query ?debug=1.
 * @param {import('express').Request} req - Objeto Request de Express.
 * @returns {boolean} true si la depuración está activa.
 */
function isDebug(req) {
  return process.env.DEBUG_PROMPTS === "1" || req.query?.debug === "1";
}

/**
 * Acorta un texto largo para su impresión en consola.
 * @param {string} s - Texto original.
 * @param {number} [n=1500] - Longitud máxima antes de truncar.
 * @returns {string} Texto truncado con indicador de omisión.
 */
function shorten(s, n = 1500) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n) + `\n...[${s.length - n} chars más]` : s;
}

/**
 * Normaliza el resultado de generatePrompt (string u objeto) a un conjunto de partes útiles.
 * Convención soportada: { text, system, persona, guardrails }.
 * @param {string|Object} prompt - Resultado devuelto por generatePrompt.
 * @returns {{ text: string, system?: string, persona?: string, guardrails?: string }}
 */
function extractPromptParts(prompt) {
  if (typeof prompt === "string") {
    return { text: prompt };
  }
  const { text, system, persona, guardrails } = prompt || {};
  return { text: text ?? JSON.stringify(prompt, null, 2), system, persona, guardrails };
}

/**
 * Renderiza la página principal del chat.
 *
 * - Valida que la celebridad exista.
 * - Pasa al template la lista de celebridades, el mapa completo, y la selección actual.
 *
 * @param {import('express').Request} req - Request de Express.
 * @param {import('express').Response} res - Response de Express.
 */
export async function renderChatPage(req, res) {
  const { id } = req.params;
  const celebrity = celebrityMap[id];
  if (!celebrity) return res.status(404).send("Celebridad no encontrada");

  res.render("chat", {
    celebrities: Object.values(celebrityMap),
    celebrityMap,
    selected: celebrity,
    selectedId: id,
  });
}

/**
 * Endpoint HTTP que realiza streaming de la respuesta del modelo hacia el cliente.
 *
 * Flujo:
 * 1) Valida parámetros (celebridad y mensaje).
 * 2) Envía cabeceras para streaming de texto.
 * 3) Resuelve el modelo a usar en función de los disponibles.
 * 4) Construye el prompt final (y emite logs si está en modo debug).
 * 5) Llama a la capa de servicio para obtener un stream NDJSON.
 * 6) Itera los fragmentos, decodifica y envía `json.response` por chunks al cliente.
 *
 * Errores:
 * - En errores antes de enviar cabeceras: responde con 4xx/5xx JSON o texto plano.
 * - En errores tras enviar cabeceras: intenta cerrar el stream de forma segura.
 *
 * @param {import('express').Request} req - Request de Express.
 * @param {import('express').Response} res - Response de Express.
 */
export async function streamChatResponse(req, res) {
  const t0 = Date.now();
  const reqId = makeReqId();
  const { id } = req.params;
  const { message } = req.body;
  const celebrity = celebrityMap[id];

  // 1) Validación
  if (!celebrity) return res.status(404).send("Celebridad no encontrada");
  if (typeof message !== "string" || message.trim() === "") {
    return res.status(400).send("Mensaje no válido: debe ser un string no vacío");
  }

  try {
    // 2) Cabeceras para streaming "texto plano" (compatible con proxies como Nginx)
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    // 3) Resolución de modelos
    const availableModels = await getAvailableModels(); // p. ej. ["mistral:latest", "llama3:8b"]
    const perCelebrityModel = modelMapByCelebrity(availableModels); // { id → baseModel }
    const resolvedModel =
      perCelebrityModel[id] || process.env.DEFAULT_MODEL || "gpt-oss:20b";

    // 4) Construcción del prompt
    // Evitar "[object Object]" si generatePrompt devolviera un objeto.
    const promptRaw = generatePrompt(celebrity.name, message);
    const { text: promptText, system, persona, guardrails } = extractPromptParts(promptRaw);

    // 5) Debug (opt-in)
    if (isDebug(req)) {
      console.log(`\n=== DEBUG PROMPT [${reqId}] ===`);
      console.log("Celebridad:", celebrity.name || id);
      console.log("Modelo:", resolvedModel);
      console.log("Mensaje del usuario:", JSON.stringify(message));
      if (system) console.log("\n— SYSTEM —\n" + shorten(system));
      if (persona) console.log("\n— PERSONA —\n" + shorten(persona));
      if (guardrails) console.log("\n— GUARDRAILS —\n" + shorten(guardrails));
      console.log("\n— PROMPT (texto final) —\n" + shorten(promptText));
      console.log("=".repeat(34));
    }

    // 6) Llamada al modelo y streaming de NDJSON → texto plano
    const responseStream = await generateResponse(resolvedModel, promptText);
    const stream = Readable.from(responseStream);

    for await (const chunk of stream) {
      // El servicio envía NDJSON; dividimos por líneas y parseamos cada una
      const lines = chunk.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line); // { response, done, ... }
          if (json.response) {
            res.write(json.response);           // hacia el cliente
            process.stdout.write(json.response); // logging incremental en servidor
          }
          // Puedes manejar json.done aquí si necesitas cerrar antes, etc.
        } catch (err) {
          console.warn(`[${reqId}] ⚠️ Línea no parseable como JSON:`, err.message);
        }
      }
    }

    res.end();
    console.log(`\n✅ [${reqId}] Respuesta completa transmitida en ${Date.now() - t0} ms.`);
  } catch (error) {
    console.error(`❌ [${reqId}] Error en streaming:`, error.message);
    if (!res.headersSent) {
      res.status(500).send("Error en la generación de respuesta");
    } else {
      try { res.end(); } catch {}
    }
  }
}
