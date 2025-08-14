/**
 * @file tests/routesProtected.test.js
 * @description Test de integración para verificar que las rutas protegidas del router de chat
 *              requieren autenticación mediante JWT. Se mockean dependencias para aislar el flujo.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';

let app;
let ollamaService;

/**
 * @setup Inicializa la aplicación Express con mocks de middleware, controladores y servicios.
 */
beforeAll(async () => {
  await jest.isolateModulesAsync(async () => {
    /**
     * @mock authMiddleware
     * Simula validación JWT en el middleware de autenticación.
     */
    jest.unstable_mockModule('../middlewares/authMiddleware.js', () => ({
      auth: jest.fn((req, res, next) => {
        const header = req.headers.authorization;
        if (!header) {
          return res.status(401).json({ error: 'No autorizado' });
        }
        try {
          const token = header.split(' ')[1];
          req.user = jwt.verify(token, JWT_SECRET);
          return next();
        } catch {
          return res.status(401).json({ error: 'Token inválido' });
        }
      })
    }));

    /**
     * @mock chatController
     * Simula respuestas exitosas en las rutas protegidas.
     */
    jest.unstable_mockModule('../controllers/chatController.js', () => ({
      renderChatPage: jest.fn((req, res) => res.sendStatus(200)),
      streamChatResponse: jest.fn((req, res) => res.sendStatus(200))
    }));

    /**
     * @mock ollamaService
     * Simula generación de respuestas por parte del servicio.
     */
    jest.unstable_mockModule('../services/ollamaService.js', () => ({
      generateResponse: jest.fn()
    }));

    const { default: chatRouter } = await import('../routes/chatRouter.js');
    ollamaService = await import('../services/ollamaService.js');

    const express = (await import('express')).default;
    const cookieParser = (await import('cookie-parser')).default;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use((req, _res, next) => {
      req.session = {};
      next();
    });
    app.use('/', chatRouter);
  });
});

/**
 * @module Rutas protegidas
 * @description Verifica que las rutas del router de chat requieren autenticación JWT.
 */
describe('Rutas protegidas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test Rechaza acceso si no se proporciona token
   */
  it('rechaza acceso sin token', async () => {
    const res = await request(app)
      .post('/stream/einstein')
      .send({ message: 'Hola' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'No autorizado' });
  });

  /**
   * @test Permite acceso si el token es válido
   */
  it('permite acceso con token válido', async () => {
    const token = jwt.sign({ email: 'a@a.com', rol: 'user' }, JWT_SECRET);
    ollamaService.generateResponse.mockResolvedValueOnce({ message: 'Respuesta simulada' });

    const res = await request(app)
      .post('/stream/einstein')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hola' });

    expect([200, 500]).toContain(res.statusCode);
  });
});
