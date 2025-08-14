/**
 * @file routes/authRouter.js
 * @description Rutas de autenticación (API y vistas): registro, login, logout y perfil protegido.
 */

import { Router } from 'express';
import { auth } from '../middlewares/authMiddleware.js';
import {
  register,
  registerForm,
  loginForm,
  loginHandler,
  logout,
  logoutView
} from '../controllers/auth/authController.js';

/**
 * Router de autenticación.
 * @type {import('express').Router}
 */
const authRouter = Router();

/**
 * GET /auth/register - Renderiza el formulario de registro de usuario.
 */
authRouter.get('/register', registerForm);

/**
 * POST /auth/register - Procesa el alta de un nuevo usuario.
 */
authRouter.post('/register', register);

/**
 * GET /auth/login - Renderiza el formulario de inicio de sesión.
 */
authRouter.get('/login', loginForm);

/**
 * POST /auth/login - Procesa credenciales y establece cookie o token.
 */
authRouter.post('/login', loginHandler);

/**
 * POST /auth/logout - Cierra sesión (API JSON).
 */
authRouter.post('/logout', logout);

/**
 * GET /auth/logout - Cierra sesión y redirige con mensaje flash.
 */
authRouter.get('/logout', logoutView);

/**
 * GET /auth/profile - Devuelve datos del usuario autenticado (requiere auth).
 */
authRouter.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

export default authRouter;
