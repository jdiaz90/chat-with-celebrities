/**
 * @file routes/indexRouter.js
 * @description Ruta principal de la aplicación: listado de celebridades y modelos disponibles.
 */

import express from 'express';
import {
  celebrityMap,
  modelMapByCelebrity
} from '../utils/modelSelector.js';
import { getAvailableModels } from '../services/ollamaService.js';

/**
 * Router de índice/home.
 * @type {import('express').Router}
 */
const indexRouter = express.Router();

/**
 * GET /
 * Página de inicio:
 * 1. Consulta a Ollama los modelos disponibles.
 * 2. Calcula para cada celebridad qué modelo usar.
 * 3. Renderiza la vista index con la info y el usuario autenticado (si lo hay).
 */
indexRouter.get('/', async (req, res) => {
  try {
    const availableModels = await getAvailableModels();
    const modelMap = modelMapByCelebrity(availableModels);

    res.render('index', {
      title: 'Famosos disponibles',
      celebrities: Object.values(celebrityMap),
      celebrityMap,
      modelMap,
      user: res.locals.user // ✅ usamos el valor del middleware global
    });
  } catch (error) {
    console.error('Error al cargar modelos:', error);
    res.status(500).send('Error al cargar la página');
  }
});

export default indexRouter;
