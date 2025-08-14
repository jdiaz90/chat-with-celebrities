/**
 * @file routes/chatRouter.js
 * @description Rutas de chat con personajes famosos (vistas y streaming de respuesta).
 */

import express from 'express';
import {
  renderChatPage,
  streamChatResponse
} from '../controllers/chatController.js';
import { auth } from '../middlewares/authMiddleware.js';

/**
 * Router de chat.
 * @type {import('express').Router}
 */
const chatRouter = express.Router();

/**
 * GET /generate/:id
 * Genera la vista de chat para una celebridad concreta.
 * Ruta protegida por middleware `auth`.
 *
 * @param {string} id - Identificador de la celebridad en la URL.
 */
chatRouter.get('/generate/:id', auth, renderChatPage);

/**
 * POST /stream/:id
 * Inicia el streaming de respuesta desde el modelo.
 * Ruta protegida por middleware `auth`.
 *
 * @param {string} id - Identificador de la celebridad en la URL.
 * @body {string} message - Mensaje enviado por el usuario.
 */
chatRouter.post('/stream/:id', auth, streamChatResponse);

export default chatRouter;
