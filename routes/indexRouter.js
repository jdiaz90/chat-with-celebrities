import express from "express";
import {
  celebrityMap,            // Diccionario con configuración de cada personaje
  modelMapByCelebrity      // Función que asigna modelos por personaje según disponibilidad
} from "../utils/modelSelector.js";
import { getAvailableModels } from "../services/ollamaService.js";

const router = express.Router();

/**
 * 🏠 GET /
 *
 * Página de inicio del proyecto.
 *
 * Flujo:
 * 1. Consulta a Ollama para obtener la lista de modelos disponibles actualmente.
 * 2. Calcula, para cada celebridad del `celebrityMap`, qué modelo es el más adecuado usando `modelMapByCelebrity`.
 * 3. Renderiza la plantilla `index` pasando:
 *    - `celebrities`: array con los datos de todas las celebridades.
 *    - `celebrityMap`: mapa id → datos de la celebridad.
 *    - `modelMap`: asignación de id de celebridad → modelo seleccionado.
 *
 * Errores:
 * - Si `getAvailableModels` falla, se captura el error, se loguea en consola y se responde con estado 500.
 *
 * @name GET/
 * @function
 * @memberof module:routes/indexRouter
 * @param {import('express').Request} req - Request de Express.
 * @param {import('express').Response} res - Response de Express.
 */
router.get("/", async (req, res) => {
  try {
    const availableModels = await getAvailableModels();
    const modelMap = modelMapByCelebrity(availableModels);

    res.render("index", {
      celebrities: Object.values(celebrityMap),
      celebrityMap,
      modelMap,
    });
  } catch (error) {
    console.error("Error al cargar modelos:", error);
    res.status(500).send("Error al cargar la página");
  }
});

export default router;
