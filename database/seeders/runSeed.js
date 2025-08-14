/**
 * @file database/runSeed.js
 * @description Ejecuta la inserción de usuarios por defecto al correr el script.
 */

import dotenv from 'dotenv';
dotenv.config();

import db from '../config/db.js';
import { seedDefaultUsers } from './seedDefaultUsers.js';

const engine = process.env.DB_ENGINE || 'sqlite';

try {
  await seedDefaultUsers(db, engine);
} catch (err) {
  console.error('❌ Error al insertar usuarios por defecto:', err.message);
  process.exit(1);
}

process.exit(0);
