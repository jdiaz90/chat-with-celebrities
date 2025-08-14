/**
 * @file tests/chatRouter.test.js
 * @description Tests para el router de chat que usa ollamaService.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Readable } from 'stream';

/**
 * @setup Mocks de dependencias antes de importar el router
 */
jest.unstable_mockModule('../middlewares/authMiddleware.js', () => ({
  auth: jest.fn((req, res, next) => next()) // Middleware auth "dummy"
}));

jest.unstable_mockModule('../utils/modelSelector.js', () => ({
  celebrityMap: {
    einstein: { id: 'einstein', name: 'Albert Einstein' }
  },
  modelMapByCelebrity: (available) => ({
    einstein: available?.[0] || 'mistral:latest'
  })
}));

jest.unstable_mockModule('../utils/promptTemplates.js', () => ({
  generatePrompt: jest.fn().mockReturnValue('prompt simulado')
}));

jest.unstable_mockModule('../services/ollamaService.js', () => ({
  getAvailableModels: jest.fn().mockResolvedValue(['mistral:latest']),
  generateResponse: jest.fn()
}));

let chatRouter;
let ollamaService;

/**
 * @setup Carga del router y servicio con mocks
 */
beforeAll(async () => {
  await jest.isolateModulesAsync(async () => {
    ollamaService = await import('../services/ollamaService.js');
    chatRouter = (await import('../routes/chatRouter.js')).default;
  });
});

/**
 * @module chatRouter
 * @description Suite de pruebas para el router de chat.
 */
describe('chatRouter', () => {
  let app;

  /**
   * @setup Inicializa la app de Express antes de cada test
   */
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = {}; // Simula sesión
      next();
    });
    app.use('/', chatRouter);
  });

  /**
   * @test Devuelve 400 si faltan parámetros en el body
   */
  it('responde 400 si faltan parámetros', async () => {
    const res = await request(app).post('/stream/einstein').send({});
    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/Mensaje no válido|Faltan parámetros/);
  });

  /**
   * @test Devuelve 200 con respuesta válida del servicio
   */
  it('responde 200 con respuesta válida', async () => {
    ollamaService.generateResponse.mockResolvedValueOnce(
      Readable.from([
        '{"response":"Hola","done":false}\n',
        '{"response":"Adiós","done":true}\n'
      ])
    );

    const res = await request(app)
      .post('/stream/einstein')
      .send({ message: '¿Cuál es tu teoría?' });

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Hola');
    expect(res.text).toContain('Adiós');
    expect(ollamaService.generateResponse).toHaveBeenCalled();
  });

  /**
   * @test Devuelve 500 si el servicio lanza un error
   */
  it('responde 500 si ollamaService lanza error', async () => {
    ollamaService.generateResponse.mockImplementationOnce(() => {
      return Promise.reject(new Error('Fallo interno'));
    });

    const res = await request(app)
      .post('/stream/einstein')
      .send({ message: '¿Qué opinas del tiempo?' });

    expect(res.statusCode).toBe(500);
    expect(res.text).toMatch(/Error/);
  });
});
