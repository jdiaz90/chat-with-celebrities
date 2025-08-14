/**
 * @file tests/userLocalsMiddleware.test.js
 * @description Tests unitarios para verificar el comportamiento del middleware userLocalsMiddleware.
 */

import { userLocalsMiddleware } from '../middlewares/userLocalsMiddleware.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import { jest } from '@jest/globals';

/**
 * @module userLocalsMiddleware
 * @description Suite de pruebas para validar cómo el middleware asigna el usuario a res.locals.
 */
describe('userLocalsMiddleware', () => {
  const next = jest.fn();
  const res = { locals: {} };

  /**
   * @test Usa req.user si ya está presente
   * @description Si el objeto req ya tiene un usuario, se asigna directamente a res.locals.user.
   */
  it('usa req.user si existe', () => {
    const req = { user: { email: 'a@a.com' }, cookies: {} };
    userLocalsMiddleware(req, res, next);
    expect(res.locals.user).toEqual({ email: 'a@a.com' });
    expect(next).toHaveBeenCalled();
  });

  /**
   * @test Decodifica token válido desde cookies
   * @description Si no hay req.user pero hay un token válido en cookies, lo decodifica y lo asigna.
   */
  it('decodifica token válido de cookie', () => {
    const token = jwt.sign({ email: 'b@b.com' }, JWT_SECRET);
    const req = { cookies: { token } };
    userLocalsMiddleware(req, res, next);
    expect(res.locals.user.email).toBe('b@b.com');
    expect(next).toHaveBeenCalled();
  });

  /**
   * @test Token inválido en cookies
   * @description Si el token no se puede decodificar, se asigna null a res.locals.user.
   */
  it('pone user en null si token inválido', () => {
    const req = { cookies: { token: 'invalid' } };
    userLocalsMiddleware(req, res, next);
    expect(res.locals.user).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  /**
   * @test Sin token en cookies
   * @description Si no hay token ni req.user, se asigna null a res.locals.user.
   */
  it('pone user en null si no hay token', () => {
    const req = { cookies: {} };
    userLocalsMiddleware(req, res, next);
    expect(res.locals.user).toBeNull();
    expect(next).toHaveBeenCalled();
  });
});
