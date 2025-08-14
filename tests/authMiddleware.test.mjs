/**
 * @file tests/authMiddleware.test.js
 * @description Tests unitarios para el middleware de autenticación JWT.
 */

import { auth } from '../middlewares/authMiddleware.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import { jest } from '@jest/globals';

/**
 * @module authMiddleware
 * @description Middleware que protege rutas mediante validación de tokens JWT.
 */
describe('auth middleware', () => {
  let next;
  let res;

  beforeEach(() => {
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test Verifica acceso con token válido en header Authorization
   */
  it('permite acceso con token válido en header', () => {
    const token = jwt.sign({ email: 'test@test.com' }, JWT_SECRET);

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json'
      },
      cookies: {},
      accepts: jest.fn().mockReturnValue('json')
    };

    auth(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('test@test.com');
    expect(next).toHaveBeenCalled();
  });

  /**
   * @test Verifica acceso con token válido en cookie
   */
  it('permite acceso con token válido en cookie', () => {
    const token = jwt.sign({ email: 'test2@test.com' }, JWT_SECRET);

    const req = {
      headers: {},
      cookies: { token },
      accepts: jest.fn().mockReturnValue('html')
    };

    auth(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('test2@test.com');
    expect(next).toHaveBeenCalled();
  });

  /**
   * @test Rechaza acceso sin token en API (respuesta JSON)
   */
  it('rechaza acceso sin token en API', () => {
    const req = {
      headers: { accept: 'application/json' },
      cookies: {},
      session: {},
      accepts: jest.fn().mockReturnValue('json')
    };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Debes iniciar sesión para acceder a esta ruta' });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * @test Rechaza acceso sin token en vista (redirección)
   */
  it('rechaza acceso sin token en vista y redirige', () => {
    const req = {
      headers: { accept: 'text/html' },
      cookies: {},
      session: {},
      accepts: jest.fn().mockReturnValue('html')
    };

    auth(req, res, next);

    expect(req.session.confirmationMessage).toBe('Debes iniciar sesión para acceder a esta ruta');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * @test Rechaza acceso con token inválido en API
   */
  it('rechaza acceso con token inválido en API', () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid',
        accept: 'application/json'
      },
      cookies: {},
      session: {},
      accepts: jest.fn().mockReturnValue('json')
    };

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tu sesión ha expirado o el token es inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * @test Rechaza acceso con token inválido en vista
   */
  it('rechaza acceso con token inválido en vista y redirige', () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid',
        accept: 'text/html'
      },
      cookies: {},
      session: {},
      accepts: jest.fn().mockReturnValue('html')
    };

    auth(req, res, next);

    expect(req.session.confirmationMessage).toBe('Tu sesión ha expirado o el token es inválido');
    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    expect(next).not.toHaveBeenCalled();
  });

  /**
   * @test Simula middleware personalizado para vistas sin token
   */
  it('redirige si el middleware está configurado para vistas (simulado)', () => {
    const customAuth = (req, res, next) => {
      const token = req.cookies?.token;
      if (!token) return res.redirect('/auth/login');
      try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
      } catch {
        return res.redirect('/auth/login');
      }
    };

    const req = { headers: {}, cookies: {}, session: {} };

    customAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    expect(next).not.toHaveBeenCalled();
  });
});
