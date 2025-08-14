/**
 * @file tests/chatController.test.js
 * @description Tests para el controlador de chat, incluyendo renderizado de vistas, validaciones y flujo de streaming.
 */

import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { Readable } from 'stream';

// Mocks de dependencias antes de importar el controlador
jest.unstable_mockModule('../services/ollamaService.js', () => ({
  getAvailableModels: jest.fn().mockResolvedValue(['mistral:latest']),
  generateResponse: jest.fn().mockImplementation(() => {
    console.log('✅ generateResponse MOCK llamado');
    return Readable.from([
      '{"response":"Hola","done":false}\n',
      '{"response":"Adiós","done":true}\n'
    ]);
  })
}));

jest.unstable_mockModule('../utils/promptTemplates.js', () => ({
  generatePrompt: jest.fn().mockReturnValue('prompt simulado')
}));

jest.unstable_mockModule('../utils/modelSelector.js', () => ({
  celebrityMap: {
    einstein: { id: 'einstein', name: 'Albert Einstein' }
  },
  modelMapByCelebrity: (available) => ({
    einstein: available?.[0] || 'mistral:latest'
  })
}));

let chatController;
let ollamaService;
let app;

/**
 * @setup Inicializa el entorno Express y carga el controlador con mocks.
 */
beforeAll(async () => {
  await jest.isolateModulesAsync(async () => {
    ollamaService = await import('../services/ollamaService.js');
    chatController = await import('../controllers/chatController.js');

    app = express();
    app.use(express.json());
    app.post('/stream/:id', chatController.streamChatResponse);
    app.get('/chat/:id', chatController.renderChatPage);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

/**
 * @module chatController
 * @description Suite de pruebas para el controlador de chat.
 */
describe('chatController', () => {
  /**
   * @module renderChatPage
   * @description Tests para renderizado de la vista de chat.
   */
  describe('renderChatPage', () => {
    /**
     * @test Devuelve 404 si la celebridad no existe.
     */
    it('devuelve 404 si la celebridad no existe', async () => {
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      await chatController.renderChatPage({ params: { id: 'desconocido' } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    /**
     * @test Renderiza la vista con la celebridad seleccionada.
     */
    it('renderiza la página con la celebridad', async () => {
      const res = { render: jest.fn(), locals: { user: { name: 'Test' } } };
      await chatController.renderChatPage({ params: { id: 'einstein' } }, res);
      expect(res.render).toHaveBeenCalledWith(
        'chat',
        expect.objectContaining({
          selectedId: 'einstein',
          user: { name: 'Test' }
        })
      );
    });
  });

  /**
   * @module streamChatResponse (unit)
   * @description Tests unitarios para el endpoint de streaming.
   */
  describe('streamChatResponse (unit)', () => {
    /**
     * @test Devuelve 400 si el mensaje está ausente.
     */
    it('responde 400 si falta mensaje', async () => {
      const req = { params: { id: 'einstein' }, body: {}, user: { name: 'Test' }, session: {} };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      await chatController.streamChatResponse(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    /**
     * @test Devuelve 500 si generateResponse lanza error.
     */
    it('responde 500 si generateResponse lanza error', async () => {
      ollamaService.generateResponse.mockRejectedValueOnce(new Error('fail'));
      const req = { params: { id: 'einstein' }, body: { message: 'Hola' }, user: { name: 'Test' }, session: {} };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn(), headersSent: false };
      await chatController.streamChatResponse(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    /**
     * @test Activa modo debug si query contiene debug=1.
     */
    it('activa modo debug si query contiene debug=1', async () => {
      const req = {
        params: { id: 'einstein' },
        body: { message: 'hola' },
        query: { debug: '1' }
      };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        write: jest.fn(),
        end: jest.fn(),
        flushHeaders: jest.fn(),
        headersSent: false
      };

      await chatController.streamChatResponse(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('text/plain'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('Hola'));
    });

    /**
     * @test Cierra el stream si ya se enviaron cabeceras.
     */
    it('intenta cerrar stream si ya se enviaron cabeceras', async () => {
      ollamaService.generateResponse.mockRejectedValueOnce(new Error('fallo interno'));
      const req = { params: { id: 'einstein' }, body: { message: 'hola' } };
      const res = {
        headersSent: true,
        end: jest.fn()
      };

      await chatController.streamChatResponse(req, res);
      expect(res.end).toHaveBeenCalled();
    });
  });

  /**
   * @module streamChatResponse (integration)
   * @description Tests de integración para el endpoint de streaming.
   */
  describe('streamChatResponse (integration)', () => {
    /**
     * @test Devuelve 404 si la celebridad no existe.
     */
    it('devuelve 404 si la celebridad no existe', async () => {
      const res = await request(app).post('/stream/desconocido').send({ message: 'hola' });
      expect(res.statusCode).toBe(404);
      expect(res.text).toContain('Celebridad no encontrada');
    });

    /**
     * @test Devuelve 400 si el mensaje está ausente.
     */
    it('devuelve 400 si falta el mensaje', async () => {
      const res = await request(app).post('/stream/einstein').send({});
      expect(res.statusCode).toBe(400);
      expect(res.text).toContain('Mensaje no válido');
    });

    /**
     * @test Flujo feliz: devuelve 200 y texto plano.
     */
    it('flujo feliz devuelve 200 y texto', async () => {
      const res = await request(app).post('/stream/einstein').send({ message: 'hola' });
      console.log('📦 Recibido en test:', JSON.stringify(res.text));
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/plain/);
      expect(res.text).toContain('Hola');
      expect(res.text).toContain('Adiós');
    });

    /**
     * @test Ignora líneas malformadas en el stream.
     */
    it('ignora líneas malformadas en el stream', async () => {
      ollamaService.generateResponse.mockImplementationOnce(() =>
        Readable.from([
          '{"response":"Hola"}\n',
          'esto no es JSON\n',
          '{"response":"Adiós"}\n'
        ])
      );

      const res = await request(app).post('/stream/einstein').send({ message: 'hola' });
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Hola');
      expect(res.text).toContain('Adiós');
    });

    /**
     * @test Devuelve 200 vacío si el stream no tiene chunks.
     */
    it('responde 200 vacío si no hay chunks en el stream', async () => {
      ollamaService.generateResponse.mockImplementationOnce(() => Readable.from([]));
      const res = await request(app).post('/stream/einstein').send({ message: 'hola' });
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('');
    });
  });
});
