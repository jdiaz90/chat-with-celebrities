/**
 * @file tests/ollamaService.test.mjs
 * @description Tests unitarios para el servicio de integración con la API de Ollama.
 */

import { jest } from '@jest/globals';

// 🧪 Mock de node-fetch antes de importar el servicio
jest.unstable_mockModule('node-fetch', () => ({
  default: jest.fn()
}));

const fetch = (await import('node-fetch')).default;
const { getAvailableModels, generateResponse } = await import('../services/ollamaService.js');

describe('ollamaService', () => {
  /**
   * @test Debe devolver nombres de modelos disponibles.
   * Simula una respuesta válida de la API de tags.
   */
  it('getAvailableModels devuelve nombres de modelos', async () => {
    fetch.mockResolvedValue({
      json: async () => ({
        models: [{ name: 'mistral:latest' }, { name: 'gemma:2b' }]
      })
    });

    const models = await getAvailableModels();
    expect(models).toEqual(['mistral:latest', 'gemma:2b']);
  });

  /**
   * @test Debe devolver array vacío si la API falla.
   */
  it('getAvailableModels devuelve [] si hay error', async () => {
    fetch.mockRejectedValueOnce(new Error('fallo de red'));
    const models = await getAvailableModels();
    expect(models).toEqual([]);
  });

  /**
   * @test Debe llamar a /api/generate con método POST.
   */
  it('generateResponse llama a /api/generate con POST', async () => {
    fetch.mockResolvedValue({ body: 'respuesta' });

    const body = await generateResponse('llama3', 'Hola');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', prompt: 'Hola' })
      })
    );
    expect(body).toBe('respuesta');
  });

  /**
   * @test Debe lanzar error si la petición falla.
   */
  it('generateResponse lanza error si fetch falla', async () => {
    fetch.mockRejectedValueOnce(new Error('fallo interno'));
    await expect(generateResponse('llama3', 'Hola')).rejects.toThrow('fallo interno');
  });
});
