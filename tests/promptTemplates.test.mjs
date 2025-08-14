/**
 * @file tests/modelSelector.test.js
 * @description Tests unitarios para las utilidades `modelMapByCelebrity` y `celebrityMap`.
 */

import { modelMapByCelebrity, celebrityMap } from '../utils/modelSelector.js';

/**
 * @module modelMapByCelebrity
 * @description Función que asigna el modelo preferido disponible a cada celebridad.
 */
describe('modelMapByCelebrity', () => {
  /**
   * @test Asigna el modelo preferido disponible para cada celebridad
   */
  it('elige el modelo preferido disponible para cada celebridad', () => {
    const available = ['llama3:8b', 'mistral:latest', 'gemma:2b'];
    const result = modelMapByCelebrity(available);
    expect(result.einstein).toBe('llama3');
    expect(result.frida).toBe('mistral');
    expect(result.leonardo).toBe('gemma');
    expect(result.curie).toBe('llama3');
  });

  /**
   * @test Usa modelo por defecto si no hay preferidos disponibles
   */
  it('devuelve el modelo por defecto si no hay preferidos', () => {
    const available = ['foo:bar'];
    const result = modelMapByCelebrity(available);
    Object.values(result).forEach(val => {
      expect(val).toMatch(/mistral|mistral:latest/);
    });
  });
});

/**
 * @module celebrityMap
 * @description Mapa con metadatos de cada celebridad (nombre, avatar, etc.).
 */
describe('celebrityMap', () => {
  /**
   * @test Verifica que cada celebridad tiene datos básicos definidos
   */
  it('tiene los datos básicos de cada celebridad', () => {
    expect(celebrityMap.einstein.name).toBeDefined();
    expect(celebrityMap.frida.avatar).toMatch(/frida.jpg/);
  });
});
