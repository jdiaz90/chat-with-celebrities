/**
 * @file tests/seedDefaultUsers.test.mjs
 * @description Tests para verificar el seeding de usuarios por defecto en SQLite y MongoDB.
 */

import { jest, test, expect, describe } from '@jest/globals';
import { seedDefaultUsers } from '../database/seeders/seedDefaultUsers.js';

/**
 * @module seedDefaultUsers
 * @description Suite de pruebas para validar el comportamiento del seeder en distintos motores de base de datos.
 */
describe('seedDefaultUsers', () => {
  /**
   * @test Inserta usuarios en SQLite
   * @description Verifica que se ejecutan dos comandos `run()` al hacer seeding en SQLite.
   */
  test('inserta usuarios en SQLite', async () => {
    const mockDb = {
      run: jest.fn()
    };

    await seedDefaultUsers(mockDb, 'sqlite');
    expect(mockDb.run).toHaveBeenCalledTimes(2);
  });

  /**
   * @test Inserta usuarios en MongoDB
   * @description Verifica que se crean índices y se actualizan dos documentos en MongoDB.
   */
  test('inserta usuarios en MongoDB', async () => {
    const mockCol = {
      createIndex: jest.fn(),
      updateOne: jest.fn()
    };

    const mockDb = {
      collection: () => mockCol
    };

    await seedDefaultUsers(mockDb, 'mongodb');
    expect(mockCol.createIndex).toHaveBeenCalled();
    expect(mockCol.updateOne).toHaveBeenCalledTimes(2);
  });

  /**
   * @test Motor no soportado
   * @description Verifica que se lanza una advertencia si el motor de base de datos no está soportado.
   */
  test('lanza advertencia si el motor no es soportado', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await seedDefaultUsers({}, 'oracle');
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('no soportado'));
    consoleWarn.mockRestore();
  });

  /**
   * @test Error en SQLite
   * @description Verifica que se lanza una excepción si ocurre un error durante el seeding en SQLite.
   */
  test('lanza error si falla SQLite', async () => {
    const mockDb = {
      run: jest.fn(() => { throw new Error('fallo en SQLite') })
    };

    await expect(seedDefaultUsers(mockDb, 'sqlite')).rejects.toThrow('fallo en SQLite');
  });

  /**
   * @test Error en MongoDB
   * @description Verifica que se lanza una excepción si ocurre un error durante el seeding en MongoDB.
   */
  test('lanza error si falla MongoDB', async () => {
    const mockCol = {
      createIndex: jest.fn(),
      updateOne: jest.fn(() => { throw new Error('fallo en MongoDB') })
    };

    const mockDb = {
      collection: () => mockCol
    };

    await expect(seedDefaultUsers(mockDb, 'mongodb')).rejects.toThrow('fallo en MongoDB');
  });
});
