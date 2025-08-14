/**
 * @file config/index.js
 * @description Carga y expone configuración de la aplicación desde variables de entorno.
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Motor de base de datos a utilizar.
 * @constant
 * @type {'sqlite'|'mongodb'}
 */
export const engine = process.env.DB_ENGINE || 'sqlite';

/**
 * Clave secreta para firmar/verificar JWT.
 * @constant
 * @type {string}
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Cadena de expiración de JWT (p. ej., "1d", "12h", "900s").
 * @constant
 * @type {string}
 */
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Indica si se deben usar cookies httpOnly para entregar el JWT.
 * @constant
 * @type {boolean}
 */
export const USE_COOKIES = (process.env.AUTH_COOKIE || 'true') === 'true';
