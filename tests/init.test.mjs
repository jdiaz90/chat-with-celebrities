/**
 * @file tests/init.test.mjs
 * @description Tests para verificar que el script de inicialización maneja errores correctamente y cubre todos los motores.
 */

import { jest, test, expect, beforeEach, afterEach } from '@jest/globals';

let consoleError;
let consoleLog;
let processExit;

/**
 * @setup Configura mocks y variables de entorno antes de cada test.
 */
beforeEach(() => {
  jest.resetModules();
  process.env.DB_ENGINE = undefined;
  process.env.MONGODB_URI = undefined;
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  processExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
});

/**
 * @cleanup Restaura los mocks después de cada test.
 */
afterEach(() => {
  consoleError.mockRestore();
  consoleLog.mockRestore();
  processExit.mockRestore();
});

/**
 * @test Error en inicialización SQLite
 * @description Verifica que se lanza un error si `exec()` falla durante la inicialización con SQLite.
 */
test('init.js lanza error si falla la inicialización', async () => {
  process.env.DB_ENGINE = 'sqlite';

  const mockDb = {
    exec: jest.fn(() => { throw new Error('fallo en exec'); })
  };

  jest.unstable_mockModule('../database/config/db.js', () => ({
    default: mockDb
  }));

  await import('../database/migrations/init.js');

  expect(consoleError).toHaveBeenCalledWith(
    '❌ Error durante la inicialización de la base de datos:',
    expect.stringContaining('fallo en exec')
  );
  expect(processExit).toHaveBeenCalledWith(1);
});

/**
 * @test Inicialización exitosa con MongoDB
 * @description Verifica que se crean índices correctamente y se finaliza con éxito.
 */
test('init.js inicializa correctamente con MongoDB', async () => {
  process.env.DB_ENGINE = 'mongodb';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

  const createIndex = jest.fn();
  const mockDb = {
    collection: jest.fn(() => ({ createIndex }))
  };

  jest.unstable_mockModule('../database/config/db.js', () => ({
    default: mockDb
  }));

  await import('../database/migrations/init.js');

  expect(mockDb.collection).toHaveBeenCalledWith('usuarios');
  expect(mockDb.collection).toHaveBeenCalledWith('conversaciones');
  expect(createIndex).toHaveBeenCalledTimes(2);
  expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ Colecciones e índices de MongoDB listos'));
  expect(processExit).toHaveBeenCalledWith(0);
});

/**
 * @test Motor no soportado
 * @description Verifica que se lanza un error si el motor de base de datos no es válido.
 */
test('init.js lanza error si el motor no es válido', async () => {
  process.env.DB_ENGINE = 'oracle';

  await import('../database/migrations/init.js');

  expect(consoleError).toHaveBeenCalledWith(
    '❌ Error durante la inicialización de la base de datos:',
    expect.stringContaining('Motor de base de datos no soportado')
  );
  expect(processExit).toHaveBeenCalledWith(1);
});
