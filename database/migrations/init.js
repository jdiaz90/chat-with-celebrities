/**
 * @file database/init.js
 * @description Inicializa la base de datos según el motor definido en .env,
 * creando tablas/colecciones e índices iniciales de forma segura.
 */

import dotenv from 'dotenv';
dotenv.config();

import db from '../config/db.js';

const engine = process.env.DB_ENGINE || 'sqlite';

try {
  if (engine === 'sqlite') {
    console.log('🔧 Inicializando SQLite…');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        rol TEXT NOT NULL CHECK (rol IN ('admin','user')),
        fecha_alta TEXT NOT NULL
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS conversaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        celebridad TEXT NOT NULL,
        mensajes TEXT NOT NULL,
        fecha TEXT NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tablas de SQLite listas');
  }
  else if (engine === 'mongodb') {
    console.log('🔧 Inicializando MongoDB…');

    await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
    await db.collection('conversaciones').createIndex({ usuario_id: 1, fecha: -1 });

    console.log('✅ Colecciones e índices de MongoDB listos');
  }
  else {
    throw new Error(`Motor de base de datos no soportado: ${engine}`);
  }
} catch (err) {
  console.error('❌ Error durante la inicialización de la base de datos:', err.message);
  process.exit(1);
}

process.exit(0);
