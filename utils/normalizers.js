/**
 * @file utils/normalizers.js
 * @description Utilidades para normalizar datos entre distintos motores/formatos.
 */

/**
 * Normaliza el identificador de usuario entre SQLite (id) y MongoDB (_id).
 *
 * @function normalizeUserId
 * @param {{id?: number|string, _id?: unknown}} user - Objeto de usuario.
 * @returns {number|string|undefined} ID normalizado como string o número.
 */
export function normalizeUserId(user) {
  return user.id ?? user._id?.toString();
}
