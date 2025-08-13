// 📦 Estilos
import '../css/style.css';

// Módulos
import { $, autoScroll } from './ui/domHelpers.js';
import { createBubble } from './ui/chatBubbles.js';
import { sendMessage } from './api/chatApi.js';
import { initFormHandlers } from './events/formHandlers.js';

// Constantes
const fallbackAvatar = '/images/fallback.jpg';
const userAvatar = '/images/user.jpg';

/**
 * Punto de entrada principal de la aplicación de chat.
 *
 * 1. Importa los estilos globales y los módulos necesarios para:
 *    - Selección y manipulación del DOM (`$`, `autoScroll`)
 *    - Creación de burbujas de chat (`createBubble`)
 *    - Envío de mensajes a la API y recepción en streaming (`sendMessage`)
 *    - Registro de los eventos del formulario (`initFormHandlers`)
 *
 * 2. Define las rutas de imágenes por defecto para el avatar de fallback y el del usuario.
 *
 * 3. Inicializa los controladores de eventos del formulario de chat
 *    pasándoles todas las dependencias necesarias.
 *
 * @module main
 */
initFormHandlers({
  $,
  autoScroll,
  createBubble,
  sendMessage,
  fallbackAvatar,
  userAvatar
});
