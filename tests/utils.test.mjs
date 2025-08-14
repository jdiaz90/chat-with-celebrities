/**
 * @file tests/utilsExports.test.js
 * @description Verifica que los módulos utilitarios exportan correctamente sus funciones y objetos esperados.
 */

import * as checkOllama from '../utils/checkOllama.js';
import * as promptTemplates from '../utils/promptTemplates.js';

/**
 * @module checkOllama
 * @description Test para asegurar que el módulo exporta la función `checkOllama`.
 */
describe('checkOllama', () => {
  /**
   * @test Exportación de función
   * @description Verifica que `checkOllama.checkOllama` sea una función.
   */
  it('debería exponer una función checkOllama', () => {
    expect(typeof checkOllama.checkOllama).toBe('function');
  });
});

/**
 * @module promptTemplates
 * @description Test para asegurar que el módulo exporta un objeto con plantillas.
 */
describe('promptTemplates', () => {
  /**
   * @test Exportación de objeto
   * @description Verifica que `promptTemplates` sea un objeto.
   */
  it('debería exponer plantillas', () => {
    expect(typeof promptTemplates).toBe('object');
  });
});
