/**
 * @file services/authService.js
 * @description Servicios de autenticación: firmado de JWT, opciones de cookie y respuesta unificada.
 */

import jwt from 'jsonwebtoken';

/**
 * Firma un token JWT con el payload proporcionado.
 *
 * @function signToken
 * @param {Object} payload - Datos incluidos en el token.
 * @param {(string|number)} payload.id - ID único del usuario.
 * @param {string} payload.email - Correo electrónico.
 * @param {'admin'|'user'} payload.rol - Rol de usuario.
 * @param {string} [payload.name] - Nombre del usuario.
 * @throws {Error} Si no hay una variable de expiración JWT válida.
 * @returns {string} Token JWT firmado.
 */
export function signToken(payload) {
  // Permitir usar JWT_EXPIRES_IN o TOKEN_EXPIRATION en el .env
  const expires = process.env.JWT_EXPIRES_IN || process.env.TOKEN_EXPIRATION;

  if (!expires) {
    throw new Error('JWT_EXPIRES_IN o TOKEN_EXPIRATION no están definidos en el entorno');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expires });
}

/**
 * Envía la respuesta de autenticación al cliente.
 * Si USE_COOKIES=true, coloca el JWT en una cookie httpOnly; si no, lo incluye en el cuerpo JSON.
 *
 * @function sendAuthResponse
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {{id: number|string, email: string, rol: 'admin'|'user'}} user - Datos públicos del usuario.
 * @param {string} token - Token JWT.
 * @param {number} [status=200] - Código de estado HTTP.
 * @returns {void}
 */
export function sendAuthResponse(res, user, token, status = 200) {
  if (USE_COOKIES) {
    res.cookie('token', token, buildCookieOptions(JWT_EXPIRES_IN));
  }
  res.status(status).json({
    message: 'ok',
    user: { id: user.id, email: user.email, rol: user.rol },
    token: USE_COOKIES ? undefined : token
  });
}

/**
 * Construye opciones de cookie coherentes con entorno y expiración.
 *
 * @function buildCookieOptions
 * @param {string|number} jwtExp - Expiración del JWT (p. ej., "1d", "12h", "900s" o segundos).
 * @returns {import('express').CookieOptions} Opciones para res.cookie.
 */
export function buildCookieOptions(jwtExp) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: isProd ? 'lax' : 'lax',
    secure: isProd,
    maxAge: parseJwtExpiryMs(jwtExp)
  };
}

/**
 * Convierte un valor de expiración (formato JWT) a milisegundos.
 *
 * @function parseJwtExpiryMs
 * @param {string|number} exp - Expresión de expiración (p. ej., "1d", "12h", "900s" o segundos).
 * @returns {number} Milisegundos calculados.
 */
export function parseJwtExpiryMs(exp) {
  if (typeof exp === 'number') return exp * 1000;
  const match = /^(\d+)([smhd])$/.exec(exp);
  if (!match) return 86_400_000; // 1 día
  const n = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}
