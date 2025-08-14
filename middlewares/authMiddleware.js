/**
 * @file middlewares/authMiddleware.js
 * @description Middleware de Express que verifica la validez de un token JWT para proteger rutas.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';

/**
 * Middleware que valida un token JWT antes de acceder a rutas protegidas.
 *
 * - Si el token es válido, añade `req.user` y llama a `next()`.
 * - Si no hay token o es inválido:
 *   - En rutas API (Accept: application/json): responde con `401 Unauthorized` y un mensaje JSON.
 *   - En rutas de vistas: redirige a `/auth/login` y guarda un mensaje en `req.session` si está disponible.
 *
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar al siguiente middleware.
 */
export function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  // detección robusta del tipo de respuesta
  const expectsJson = req.accepts(['html', 'json']) === 'json';

  if (!token || token.trim() === '') {
    const message = 'Debes iniciar sesión para acceder a esta ruta';

    if (expectsJson) {
      return res.status(401).json({ error: message });
    }

    // proteger acceso a req.session
    if (req.session) {
      req.session.confirmationMessage = message;
    }

    return res.redirect('/auth/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const message = 'Tu sesión ha expirado o el token es inválido';

    if (expectsJson) {
      return res.status(401).json({ error: message });
    }

    if (req.session) {
      req.session.confirmationMessage = message;
    }

    return res.redirect('/auth/login');
  }
}
