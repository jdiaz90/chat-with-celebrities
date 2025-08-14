/**
 * @file tests/db.test.mjs
 * @description Tests para validar la inicialización de la base de datos en distintos motores y condiciones.
 */

import { jest, test, expect, describe, beforeEach, afterEach } from '@jest/globals';

/**
 * @module db.js
 * @description Suite de pruebas para el módulo de configuración de base de datos.
 */
describe('db.js', () => {
  let consoleError;
  let processExit;

  /**
   * @setup Reinicia módulos y mockea console.error y process.exit antes de cada test.
   */
  beforeEach(() => {
    jest.resetModules();
    process.env.SQLITE_FILE = undefined;
    process.env.MONGODB_URI = undefined;
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  /**
   * @cleanup Restaura los mocks después de cada test.
   */
  afterEach(() => {
    consoleError.mockRestore();
    processExit.mockRestore();
  });

  /**
   * @test Motor no soportado
   * @description Verifica que se lanza un error si el motor de base de datos no está soportado.
   */
  test('lanza error si el motor no es soportado', async () => {
    process.env.DB_ENGINE = 'oracle';

    await import('../database/config/db.js');

    expect(consoleError).toHaveBeenCalledWith(
      '❌ Error al inicializar la base de datos:',
      expect.stringContaining('Motor de base de datos no soportado')
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  /**
   * @test Falta MONGODB_URI
   * @description Verifica que se lanza un error si el motor es MongoDB pero no se define MONGODB_URI.
   */
  test('lanza error si falta MONGODB_URI', async () => {
    process.env.DB_ENGINE = 'mongodb';
    process.env.MONGODB_URI = '';

    // Mock del módulo mongodb para evitar conexión real
    jest.unstable_mockModule('mongodb', () => ({
      MongoClient: class {
        connect = async () => {};
        db = () => ({});
      }
    }));

    await import('../database/config/db.js');

    expect(consoleError).toHaveBeenCalledWith(
      '❌ Error al inicializar la base de datos:',
      expect.stringContaining('MONGODB_URI no está definido')
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });

  /**
   * @test Crea carpeta de SQLite si no existe
   * @description Verifica que se crea el directorio necesario si el archivo SQLite apunta a una ruta inexistente.
   */
  test('crea carpeta de SQLite si no existe', async () => {
    process.env.DB_ENGINE = 'sqlite';
    process.env.SQLITE_FILE = 'database/test/test.sqlite';

    // Mock completo del módulo fs
    jest.unstable_mockModule('fs', () => ({
      default: {
        existsSync: jest.fn(() => false),
        mkdirSync: jest.fn()
      }
    }));

    await import('../database/config/db.js');

    const fs = await import('fs');
    const expectedDir = 'database/test';
    expect(fs.default.existsSync).toHaveBeenCalledWith(expect.stringContaining(expectedDir));
    expect(fs.default.mkdirSync).toHaveBeenCalledWith(expect.stringContaining(expectedDir), { recursive: true });
  });
});
