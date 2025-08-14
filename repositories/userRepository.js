/**
 * @file repositories/userRepository.js
 * @description Capa de acceso a datos para usuarios, compatible con SQLite y MongoDB.
 */

import db from '../database/config/db.js';
import { engine } from '../config/index.js';

/**
 * Busca un usuario por email (incluyendo el campo name).
 *
 * @async
 * @function findUserByEmail
 * @param {string} email - Correo electrónico del usuario.
 * @returns {Promise<null|{id?: number|string, _id?: unknown, name: string, email: string, password_hash: string, rol: 'admin'|'user', fecha_alta?: string|Date}>}
 */
export async function findUserByEmail(email) {
  if (engine === 'sqlite') {
    return await db.get(
      'SELECT id, name, email, password_hash, rol, fecha_alta FROM usuarios WHERE email = ?',
      [email]
    );
  }
  if (engine === 'mongodb') {
    return await db.collection('usuarios').findOne(
      { email },
      { projection: { name: 1, email: 1, password_hash: 1, rol: 1, fecha_alta: 1 } }
    );
  }
  throw new Error(`Motor de base de datos no soportado: ${engine}`);
}

/**
 * Inserta un nuevo usuario con hash de contraseña y nombre.
 *
 * @async
 * @function insertUser
 * @param {string} name - Nombre del nuevo usuario.
 * @param {string} email - Correo del nuevo usuario.
 * @param {string} passwordHash - Hash de contraseña (bcrypt).
 * @param {'admin'|'user'} [rol='user'] - Rol del usuario.
 * @returns {Promise<{id: number|string, name: string, email: string, rol: 'admin'|'user'}>}
 */
export async function insertUser(name, email, passwordHash, rol = 'user') {
  const nowIso = new Date().toISOString();

  if (engine === 'sqlite') {
    const result = await db.run(
      'INSERT INTO usuarios (name, email, password_hash, rol, fecha_alta) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, rol, nowIso]
    );
    return { id: result.lastID, name, email, rol };
  }
  if (engine === 'mongodb') {
    const doc = { name, email, password_hash: passwordHash, rol, fecha_alta: new Date(nowIso) };
    const res = await db.collection('usuarios').insertOne(doc);
    return { id: res.insertedId.toString(), name, email, rol };
  }
  throw new Error(`Motor de base de datos no soportado: ${engine}`);
}
