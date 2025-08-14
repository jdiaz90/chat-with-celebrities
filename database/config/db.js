/**
 * @module database/db
 * @description Inicializa y exporta la conexión a la base de datos según el motor definido en `process.env.DB_ENGINE`.
 * Permite conmutar entre SQLite y MongoDB sin cambiar el resto de la aplicación.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

// 🛠 Motor: 'sqlite' o 'mongodb' (por defecto sqlite)
export const engine = process.env.DB_ENGINE || 'sqlite';

// 📂 Resolver __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Instancia de conexión a la base de datos.
 * - Para SQLite: objeto `sqlite.Database`
 * - Para MongoDB: instancia de `Db`
 *
 * @type {import('sqlite').Database | import('mongodb').Db}
 */
let db;

try {
  if (engine === 'sqlite') {
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');

    // 📌 Ruta absoluta segura
    const relativePath = process.env.SQLITE_FILE || 'database/data/app.sqlite';
    const dbPath = path.resolve(__dirname, '..', relativePath);

    // 🧱 Asegurar que la carpeta existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log(`🗄️ Conectado a SQLite en ${dbPath}`);
  }
  else if (engine === 'mongodb') {
    const { MongoClient } = await import('mongodb');

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definido en .env');
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    db = client.db();
    console.log(`🗄️ Conectado a MongoDB: ${process.env.MONGODB_URI}`);
  }
  else {
    throw new Error(`Motor de base de datos no soportado: ${engine}`);
  }
} catch (err) {
  console.error('❌ Error al inicializar la base de datos:', err.message);
  process.exit(1);
}

export default db;
