/**
 * @file controllers/auth/authController.js
 * @description Controladores de autenticación: formularios, registro, login y logout con soporte para JWT y cookies httpOnly.
 */

import bcrypt from 'bcrypt';
import { findUserByEmail, insertUser } from '../../repositories/userRepository.js';
import { signToken, sendAuthResponse } from '../../services/authService.js';
import { USE_COOKIES } from '../../config/index.js';
import { normalizeUserId } from '../../utils/normalizers.js';

/**
 * Renderiza el formulario de registro (vista).
 *
 * @function registerForm
 * @param {import('express').Request} req - Objeto Request.
 * @param {import('express').Response} res - Objeto Response.
 * @returns {void}
 */
export function registerForm(req, res) {
  if (res.locals.user) return res.redirect('/');
  res.render('auth/register', {
    title: 'Registro de usuario',
    error: null,
    name: '',
    email: '',
    user: res.locals.user // ✅ usamos el valor del middleware global
  });
}

/**
 * Procesa el alta de un nuevo usuario y responde en modo vista o JSON.
 *
 * @async
 * @function register
 * @param {import('express').Request} req - Contiene { name, email, password, rol? } en body.
 * @param {import('express').Response} res - Response HTTP.
 * @returns {Promise<void>}
 */
export async function register(req, res) {
  try {
    const { name, email, password, rol = 'user' } = req.body || {};

    if (!name || !email || !password) {
      return respondError(req, res, 400, 'Nombre, email y contraseña son obligatorios', 'auth/register', {
        title: 'Registro de usuario',
        name,
        email,
        user: res.locals.user
      });
    }
    if (password.length < 6) {
      return respondError(req, res, 400, 'La contraseña debe tener al menos 6 caracteres', 'auth/register', {
        title: 'Registro de usuario',
        name,
        email,
        user: res.locals.user
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return respondError(req, res, 409, 'El email ya está registrado', 'auth/register', {
        title: 'Registro de usuario',
        name,
        email,
        user: res.locals.user
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await insertUser(name, email, passwordHash, rol);

    const token = signToken({
      id: normalizeUserId(user),
      email: user.email,
      rol: user.rol,
      name: user.name
    });

    if (USE_COOKIES) {
      const { buildCookieOptions } = await import('../../services/authService.js');
      res.cookie('token', token, buildCookieOptions(process.env.JWT_EXPIRES_IN));
      req.session.confirmationMessage = 'Cuenta creada con éxito. ¡Bienvenido!';
      return res.redirect('/');
    }

    sendAuthResponse(res, user, token, 201);
  } catch (err) {
    console.error('register error:', err);
    respondError(req, res, 500, 'Error en el registro', 'auth/register', {
      title: 'Registro de usuario',
      name: '',
      email: '',
      user: res.locals.user
    });
  }
}

/**
 * Renderiza el formulario de login (vista).
 *
 * @function loginForm
 * @param {import('express').Request} req - Objeto Request.
 * @param {import('express').Response} res - Objeto Response.
 * @returns {void}
 */
export function loginForm(req, res) {
  if (res.locals.user) return res.redirect('/');
  res.render('auth/login', {
    title: 'Iniciar sesión',
    error: null,
    email: '',
    user: res.locals.user // ✅ evitar sobrescribir
  });
}

/**
 * Maneja el inicio de sesión (vista o API JSON).
 *
 * @async
 * @function loginHandler
 * @param {import('express').Request} req - Contiene { email, password } en body.
 * @param {import('express').Response} res - Response HTTP.
 * @returns {Promise<void>}
 */
export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return respondError(req, res, 400, 'Email y contraseña son obligatorios', 'auth/login', {
        title: 'Iniciar sesión',
        email,
        user: res.locals.user
      });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return respondError(req, res, 401, 'Credenciales inválidas', 'auth/login', {
        title: 'Iniciar sesión',
        email,
        user: res.locals.user
      });
    }

    const normalizedUser = {
      id: normalizeUserId(user),
      email: user.email,
      rol: user.rol,
      name: user.name
    };
    const token = signToken(normalizedUser);

    if (USE_COOKIES) {
      const { buildCookieOptions } = await import('../../services/authService.js');
      res.cookie('token', token, buildCookieOptions(process.env.JWT_EXPIRES_IN));
      req.session.confirmationMessage = '¡Bienvenido de nuevo!';
      return res.redirect('/');
    }

    sendAuthResponse(res, normalizedUser, token, 200);
  } catch (err) {
    console.error('login error:', err);
    respondError(req, res, 500, 'Error en el inicio de sesión', 'auth/login', {
      title: 'Iniciar sesión',
      email: '',
      user: res.locals.user
    });
  }
}

/**
 * Cierra sesión (API JSON).
 *
 * @function logout
 * @param {import('express').Request} _req - Request HTTP (no usado).
 * @param {import('express').Response} res - Response HTTP.
 * @returns {void}
 */
export function logout(_req, res) {
  if (USE_COOKIES) {
    res.clearCookie('token');
  }
  res.status(200).json({ message: 'logout ok' });
}

/**
 * Cierra sesión (vista), borra cookie, guarda mensaje flash y redirige.
 *
 * @function logoutView
 * @param {import('express').Request & { session?: Record<string, unknown> }} req - Request con sesión.
 * @param {import('express').Response} res - Response HTTP.
 * @returns {void}
 */
export function logoutView(req, res) {
  if (USE_COOKIES) {
    res.clearCookie('token');
  }
  if (req.session) {
    req.session.confirmationMessage = 'Has cerrado sesión correctamente.';
  }
  res.redirect('/');
}

/**
 * Helper para responder errores en modo JSON o renderizado de vista.
 *
 * @private
 * @function respondError
 * @param {import('express').Request} req - Request HTTP.
 * @param {import('express').Response} res - Response HTTP.
 * @param {number} status - Código de estado HTTP.
 * @param {string} message - Mensaje de error.
 * @param {string} [view] - Nombre de la vista EJS a renderizar si es flujo de vistas.
 * @param {object} [locals] - Datos extra para pasar a la vista.
 * @returns {void}
 */
function respondError(req, res, status, message, view, locals = {}) {
  if (USE_COOKIES && view) {
    return res.status(status).render(view, { error: message, ...locals, user: res.locals.user });
  }
  res.status(status).json({ message });
}
