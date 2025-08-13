// 📦 Carga de módulos principales
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import expressLayouts from 'express-ejs-layouts';

// 🔀 Rutas y utilidades personalizadas
import indexRouter from './routes/indexRouter.js';
import chatRouter from './routes/chatRouter.js';
import { checkOllama } from './utils/checkOllama.js';

// 🔧 Carga variables de entorno desde .env
dotenv.config();

// 📍 Determina la ruta absoluta del directorio actual del archivo (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🚀 Inicializa la app Express
const app = express();

/**
 * Configuración del motor de plantillas y layout:
 * - Usa EJS como motor de vistas.
 * - Establece carpeta de vistas en `/views`.
 * - Habilita `express-ejs-layouts` para plantillas con layout base.
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // layout por defecto

/**
 * Middleware global:
 * - `express.static`: Servir ficheros públicos (imágenes, CSS, JS cliente…).
 * - `express.urlencoded`: Parseo de bodies de formularios.
 * - `express.json`: Parseo de JSON en cuerpos de petición.
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Registro de rutas principales:
 * - `/` (GET): Página principal del índice (`indexRouter`).
 * - `/generate/:id` y `/stream/:id`: Gestión de chat con celebridades (`chatRouter`).
 */
app.use('/', indexRouter);
app.use('/', chatRouter);

/**
 * Puerto de escucha:
 * - Lee de `process.env.PORT` o por defecto 5000.
 * - Se usa 5000 para evitar conflicto con Webpack Dev Server (3000).
 */
const PORT = process.env.PORT || 5000;

/**
 * 🔍 Comprobación previa de dependencia externa:
 * - Ejecuta `checkOllama()` para verificar que la API de Ollama está disponible.
 * - Si está disponible, inicia el servidor.
 * - Si falla, muestra error y termina el proceso (exit code 1).
 */
(async () => {
  try {
    await checkOllama();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express ejecutándose en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('🛑 Error al iniciar el servidor: Ollama no disponible');
    process.exit(1);
  }
})();
