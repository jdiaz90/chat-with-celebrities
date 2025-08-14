/**
 * @file middlewares/userLocalsMiddleware.js
 * @description Middleware que expone el usuario autenticado (si existe) en res.locals.user para todas las vistas.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';

export function userLocalsMiddleware(req, res, next) {
  // Si un middleware previo ya ha establecido req.user
  if (req.user) {
    res.locals.user = req.user;
    console.log('🔍 userLocalsMiddleware: req.user presente', req.user);
    return next();
  }

  // Intentar leer desde cookie (para páginas no protegidas)
  const token = req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.locals.user = decoded;
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  next();
}

