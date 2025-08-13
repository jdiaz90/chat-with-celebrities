import express from "express";
import {
  renderChatPage,       // Renderiza la vista principal del chat con una celebridad
  streamChatResponse    // Maneja el POST y transmite la respuesta en tiempo real
} from "../controllers/chatController.js";

const router = express.Router();

/**
 * 🔎 GET /generate/:id
 *
 * Genera la vista de chat para una celebridad concreta.
 * - Extrae el `id` de la celebridad desde los parámetros de la URL.
 * - Busca los datos asociados y renderiza la plantilla `chat`.
 * - Si no existe la celebridad, devuelve 404.
 *
 * @name GET/generate/:id
 * @function
 * @memberof module:routes/chatRouter
 * @param {string} id - Identificador de la celebridad (en la URL).
 * @returns {HTML} Render de la vista de chat.
 */
router.get("/generate/:id", renderChatPage);

/**
 * 📡 POST /stream/:id
 *
 * Inicia el streaming de respuesta desde el modelo.
 * - Lee el `id` de la celebridad y el `message` del cuerpo de la petición.
 * - Construye el prompt y llama al modelo correspondiente.
 * - Transmite la respuesta al cliente en tiempo real mediante texto plano en chunks.
 * - Valida parámetros y devuelve 400/404 en caso de error.
 *
 * @name POST/stream/:id
 * @function
 * @memberof module:routes/chatRouter
 * @param {string} id - Identificador de la celebridad (en la URL).
 * @body {string} message - Texto enviado por el usuario.
 * @returns {Stream} Respuesta en streaming.
 */
router.post("/stream/:id", streamChatResponse);

export default router;
