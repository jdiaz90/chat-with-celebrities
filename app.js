/**
 * @file app.js
 * @description Punto de entrada principal de la aplicación Express.
 *
 * Configura:
 * - Motor de plantillas EJS con layout por defecto.
 * - Middlewares globales (estáticos, parseo de body, cookies, sesión).
 * - Middleware unificado `userLocalsMiddleware` para exponer el usuario autenticado.
 * - Manejo de mensajes flash (`res.locals.confirmationMessage`).
 * - Registro de routers principales.
 * - Ejemplo de ruta protegida con middleware `auth`.
 * - Arranque del servidor tras comprobar dependencias externas.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import expressLayouts from 'express-ejs-layouts';
import cookieParser from 'cookie-parser';
import session from 'express-session';

// 📦 Rutas y middlewares personalizados
import indexRouter from './routes/indexRouter.js';
import chatRouter from './routes/chatRouter.js';
import authRouter from './routes/authRouter.js';
import { checkOllama } from './utils/checkOllama.js';
import { auth } from './middlewares/authMiddleware.js';
import { userLocalsMiddleware } from './middlewares/userLocalsMiddleware.js';

// 📄 Variables de entorno
dotenv.config();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Instancia principal de Express.
 * @type {import('express').Express}
 */
const app = express();

/* ------------------------------------------------------------------
 * Configuración de vistas y motor de plantillas
 * ------------------------------------------------------------------ */

/**
 * Configura EJS como motor de plantillas y define carpeta de vistas y layout por defecto.
 */
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

/* ------------------------------------------------------------------
 * Middlewares globales
 * ------------------------------------------------------------------ */

/**
 * Middleware para servir contenido estático desde /public.
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Middlewares para parsear el cuerpo de las solicitudes.
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Middleware para parsear cookies y exponerlas en `req.cookies`.
 */
app.use(cookieParser());

/**
 * Configuración de sesión para almacenar datos temporales
 * como mensajes flash.
 */
app.use(session({
  secret: process.env.SESSION_SECRET || 'cambiaEstoEnProduccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    maxAge: 1000 * 60 * 5 // 5 minutos
  }
}));

/**
 * Middleware global para exponer el usuario autenticado (si existe)
 * en `res.locals.user` para todas las vistas.
 */
app.use(userLocalsMiddleware);

/**
 * Middleware para exponer mensajes flash en `res.locals.confirmationMessage`.
 */
app.use((req, res, next) => {
  res.locals.confirmationMessage = req.session.confirmationMessage || null;
  delete req.session.confirmationMessage;
  next();
});

/* ------------------------------------------------------------------
 * Rutas de la aplicación
 * ------------------------------------------------------------------ */
app.use('/', indexRouter);
app.use('/', chatRouter);
app.use('/auth', authRouter);

/**
 * Ejemplo de ruta protegida.
 *
 * @name GET /generate/:id
 * @function
 * @memberof module:app
 * @param {string} id - Identificador del recurso a generar.
 * @returns {string} Mensaje con el email del usuario autenticado.
 */
app.get('/generate/:id', auth, (req, res) => {
  res.send(`Hola ${req.user.email}, accediste a ${req.params.id}`);
});

/* ------------------------------------------------------------------
 * Arranque del servidor
 * ------------------------------------------------------------------ */

/**
 * Puerto en el que escuchará la aplicación.
 * @type {number|string}
 */
const PORT = process.env.PORT || 5000;

/**
 * Función autoinvocada para comprobar dependencias y arrancar el servidor.
 * Verifica que Ollama está disponible antes de escuchar conexiones.
 */
(async function startServer() {
  try {
    await checkOllama();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('🛑 Error al iniciar: Ollama no disponible');
    process.exit(1);
  }
})();
