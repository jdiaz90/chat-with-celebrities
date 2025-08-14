/**
 * @file database/seedDefaultUsers.js
 * @description Inserta usuarios por defecto (admin y usuario normal) en la base de datos si no existen.
 * @module database/seedDefaultUsers
 */

import bcrypt from 'bcrypt';

/**
 * Inserta usuarios por defecto en SQLite o MongoDB si no existen previamente.
 *
 * @async
 * @function seedDefaultUsers
 * @param {import('sqlite').Database|import('mongodb').Db} dbConn Conexión a la base de datos.
 * @param {string} engineType Motor de base de datos: 'sqlite' o 'mongodb'.
 * @returns {Promise<void>}
 */
export async function seedDefaultUsers(dbConn, engineType) {
  const passwordHash = await bcrypt.hash('123456', 10);

  const defaultUsers = [
    { name: 'Administrador', email: 'admin@example.com', password_hash: passwordHash, rol: 'admin' },
    { name: 'Usuario',       email: 'user@example.com',  password_hash: passwordHash, rol: 'user'  }
  ];

  if (engineType === 'sqlite') {
    for (const u of defaultUsers) {
      await dbConn.run(
        'INSERT OR IGNORE INTO usuarios (name, email, password_hash, rol, fecha_alta) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.email, u.password_hash, u.rol, new Date().toISOString()]
      );
    }
    console.log('👥 Usuarios por defecto insertados en SQLite (si no existían)');
  }
  else if (engineType === 'mongodb') {
    const col = dbConn.collection('usuarios');
    await col.createIndex({ email: 1 }, { unique: true });

    for (const u of defaultUsers) {
      await col.updateOne(
        { email: u.email },
        { $setOnInsert: { name: u.name, password_hash: u.password_hash, rol: u.rol, fecha_alta: new Date() } },
        { upsert: true }
      );
    }
    console.log('👥 Usuarios por defecto insertados en MongoDB (si no existían)');
  }
  else {
    console.warn(`⚠️ Motor de base de datos no soportado: ${engineType}`);
  }
}
