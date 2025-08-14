/**
 * @file database/seed.js
 * @description Script ejecutable que importa y ejecuta la función de seeding.
 */

import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';
import { seedDefaultUsers } from './seeders/seedDefaultUsers.js';

const engine = process.env.DB_ENGINE || 'sqlite';

try {
  await seedDefaultUsers(db, engine);
} catch (err) {
  console.error('❌ Error al insertar usuarios por defecto:', err.message);
  process.exit(1);
}

process.exit(0);
