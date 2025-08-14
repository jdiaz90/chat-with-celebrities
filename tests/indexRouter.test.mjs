/**
 * @file tests/indexRouter.test.js
 * @description Tests para la ruta principal `/`, verificando comportamiento en éxito y error.
 */

import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

/**
 * @module indexRouter
 * @description Ruta principal que depende de `getAvailableModels` del servicio Ollama.
 */
describe('indexRouter', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  /**
   * @test Devuelve 500 si `getAvailableModels` lanza un error
   */
  it('devuelve 500 si getAvailableModels falla', async () => {
    // Mock que fuerza fallo en el servicio
    jest.unstable_mockModule('../services/ollamaService.js', () => ({
      getAvailableModels: jest.fn().mockRejectedValue(new Error('fallo'))
    }));

    const { default: indexRouter } = await import('../routes/indexRouter.js');
    const app = express();
    app.use('/', indexRouter);

    const res = await request(app).get('/');
    expect(res.statusCode).toBe(500);
  });

  /**
   * @test Devuelve 200 y renderiza contenido si el servicio responde correctamente
   */
  it('GET / responde 200 y contiene el título', async () => {
    // Mock que devuelve modelos válidos
    jest.unstable_mockModule('../services/ollamaService.js', () => ({
      getAvailableModels: jest.fn().mockResolvedValue(['mistral:latest'])
    }));

    const { default: indexRouter } = await import('../routes/indexRouter.js');
    const app = express();

    // Mock de render para simular respuesta HTML
    app.response.render = function (view, options) {
      this.send('<html><body><h1>Chat con una persona famosa</h1></body></html>');
    };

    app.use('/', indexRouter);

    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Chat con una persona famosa/);
  });
});
