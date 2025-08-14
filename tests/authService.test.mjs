/**
 * @file tests/authService.test.mjs
 * @description Tests unitarios para los servicios de autenticación: firmado de JWT, opciones de cookie y respuesta unificada.
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import * as authService from '../services/authService.js';

process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1d';

describe('authService', () => {
  /**
   * @test Debe firmar y verificar un token JWT válido.
   */
  it('firma y verifica un token', () => {
    const payload = { id: 1, email: 'a@a.com', rol: 'user' };
    const token = authService.signToken(payload);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.email).toBe('a@a.com');
  });

  /**
   * @test Debe lanzar error si no hay expiración definida.
   */
  it('lanza error si falta expiración', () => {
    const oldExp = process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.TOKEN_EXPIRATION;
    expect(() => authService.signToken({ id: 1, email: 'a@a.com', rol: 'user' })).toThrow();
    process.env.JWT_EXPIRES_IN = oldExp;
  });

  /**
   * @test Debe devolver opciones de cookie seguras en producción.
   */
  it('devuelve opciones con secure=true en producción', () => {
    process.env.NODE_ENV = 'production';
    const opts = authService.buildCookieOptions('1d');
    expect(opts.secure).toBe(true);
    expect(opts.httpOnly).toBe(true);
    expect(typeof opts.maxAge).toBe('number');
  });

  /**
   * @test Debe devolver opciones con secure=false en desarrollo.
   */
  it('devuelve opciones con secure=false en desarrollo', () => {
    process.env.NODE_ENV = 'development';
    const opts = authService.buildCookieOptions('1d');
    expect(opts.secure).toBe(false);
  });

  /**
   * @test Debe convertir formatos de expiración válidos a milisegundos.
   */
  it('convierte expiraciones válidas a milisegundos', () => {
    expect(authService.parseJwtExpiryMs('1d')).toBe(86400000);
    expect(authService.parseJwtExpiryMs('12h')).toBe(43200000);
    expect(authService.parseJwtExpiryMs('30m')).toBe(1800000);
    expect(authService.parseJwtExpiryMs('900s')).toBe(900000);
    expect(authService.parseJwtExpiryMs(900)).toBe(900000);
  });

  /**
   * @test Debe devolver valor por defecto si el formato es inválido.
   */
  it('devuelve valor por defecto si formato inválido', () => {
    expect(authService.parseJwtExpiryMs('invalid')).toBe(86400000);
  });

  /**
   * @test Debe enviar cookie y ocultar token si USE_COOKIES=true.
   */
  it('envía cookie y oculta token si USE_COOKIES=true', () => {
    global.USE_COOKIES = true;
    global.JWT_EXPIRES_IN = '1d';
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const user = { id: 1, email: 'a@a.com', rol: 'user' };
    authService.sendAuthResponse(res, user, 'token123', 201);
    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'ok',
      user,
      token: undefined
    });
  });

  /**
   * @test Debe incluir token en JSON si USE_COOKIES=false.
   */
  it('incluye token en JSON si USE_COOKIES=false', () => {
    global.USE_COOKIES = false;
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const user = { id: 1, email: 'a@a.com', rol: 'user' };
    authService.sendAuthResponse(res, user, 'token123');
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'ok',
      user,
      token: 'token123'
    });
  });
});
