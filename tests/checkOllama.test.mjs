/**
 * @file tests/checkOllama.test.js
 * @description Tests unitarios para la utilidad `checkOllama`, que verifica modelos disponibles en Ollama.
 */

import { jest } from '@jest/globals';

/**
 * @module ollamaService
 * @description Mock del servicio que obtiene modelos disponibles de Ollama.
 */
jest.unstable_mockModule('../services/ollamaService.js', () => ({
  getAvailableModels: jest.fn()
}));

const { getAvailableModels } = await import('../services/ollamaService.js');
const { checkOllama } = await import('../utils/checkOllama.js');

/**
 * @module checkOllama
 * @description Función que verifica si hay modelos disponibles en Ollama y muestra logs si se solicita.
 */
describe('checkOllama', () => {
  /**
   * @test Devuelve array vacío si no hay modelos disponibles
   */
  it('muestra aviso si no hay modelos', async () => {
    getAvailableModels.mockResolvedValue([]);
    const result = await checkOllama(false);
    expect(result).toEqual([]);
  });

  /**
   * @test Devuelve lista de modelos si están disponibles
   */
  it('devuelve lista si hay modelos', async () => {
    getAvailableModels.mockResolvedValue(['m1', 'm2']);
    const result = await checkOllama(false);
    expect(result).toEqual(['m1', 'm2']);
  });

  /**
   * @test Lanza error si la API de modelos falla
   */
  it('lanza error si la API falla', async () => {
    getAvailableModels.mockRejectedValue(new Error('fallo'));
    await expect(checkOllama(false)).rejects.toThrow('fallo');
  });

  /**
   * @test Muestra logs si el parámetro verbose está activado
   */
  it('muestra logs si verbose=true', async () => {
    getAvailableModels.mockResolvedValue(['m1']);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await checkOllama(true);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
