/**
 * @file tests/authController.test.mjs
 * @description Tests para el controlador de autenticación: registro, login, logout y vistas.
 */

import { jest } from '@jest/globals';

// 🧪 Mocks globales
await jest.unstable_mockModule('../repositories/userRepository.js', () => ({
  findUserByEmail: jest.fn(),
  insertUser: jest.fn()
}));

await jest.unstable_mockModule('../services/authService.js', () => ({
  signToken: jest.fn().mockReturnValue('mocked-token'),
  sendAuthResponse: jest.fn(),
  buildCookieOptions: jest.fn().mockReturnValue({ httpOnly: true })
}));

await jest.unstable_mockModule('../config/index.js', () => ({
  USE_COOKIES: true
}));

await jest.unstable_mockModule('../utils/normalizers.js', () => ({
  normalizeUserId: jest.fn().mockReturnValue(1)
}));

const {
  register,
  loginHandler,
  logout,
  logoutView,
  registerForm,
  loginForm
} = await import('../controllers/auth/authController.js');

describe('authController', () => {
  /**
   * @function register
   * @description Tests para el registro de usuarios.
   */
  describe('register', () => {
    /**
     * @test Crea usuario nuevo y redirige con cookie
     */
    test('crea usuario nuevo y redirige con cookie', async () => {
      const req = {
        body: { name: 'Javier', email: 'a@a.com', password: '123456' },
        session: {},
        res: {},
      };
      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
        locals: {}
      };

      const { findUserByEmail, insertUser } = await import('../repositories/userRepository.js');
      findUserByEmail.mockResolvedValue(null);
      insertUser.mockResolvedValue({ id: 1, email: 'a@a.com', rol: 'user', name: 'Javier' });

      await register(req, res);

      expect(res.cookie).toHaveBeenCalledWith('token', 'mocked-token', { httpOnly: true });
      expect(req.session.confirmationMessage).toMatch(/Cuenta creada/);
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    /**
     * @test Rechaza registro si falta email
     */
    test('rechaza registro si falta email', async () => {
      const req = { body: { name: 'Javier', password: '123456' }, session: {}, res: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
        locals: {}
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.render).toHaveBeenCalledWith('auth/register', expect.objectContaining({
        error: expect.stringMatching(/obligatorios/)
      }));
    });

    /**
     * @test Rechaza si el email ya está registrado
     */
    test('rechaza si email ya existe', async () => {
      const req = { body: { name: 'Javier', email: 'a@a.com', password: '123456' }, session: {}, res: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
        locals: {}
      };

      const { findUserByEmail } = await import('../repositories/userRepository.js');
      findUserByEmail.mockResolvedValue({ id: 99 });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.render).toHaveBeenCalledWith('auth/register', expect.objectContaining({
        error: expect.stringMatching(/registrado/)
      }));
    });
  });

  /**
   * @function loginHandler
   * @description Tests para el inicio de sesión.
   */
  describe('loginHandler', () => {
    /**
     * @test Inicia sesión con credenciales válidas
     */
    test('inicia sesión con credenciales válidas y redirige', async () => {
      const req = {
        body: { email: 'a@a.com', password: '123456' },
        session: {}
      };
      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
        locals: {}
      };

      const { findUserByEmail } = await import('../repositories/userRepository.js');
      findUserByEmail.mockResolvedValue({
        id: 1,
        email: 'a@a.com',
        rol: 'user',
        name: 'Javier',
        password_hash: await import('bcrypt').then(b => b.hashSync('123456', 10))
      });

      await loginHandler(req, res);

      expect(res.cookie).toHaveBeenCalledWith('token', 'mocked-token', { httpOnly: true });
      expect(req.session.confirmationMessage).toMatch(/Bienvenido/);
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    /**
     * @test Rechaza login con contraseña incorrecta
     */
    test('rechaza login con contraseña incorrecta', async () => {
      const req = { body: { email: 'a@a.com', password: 'wrongpass' }, session: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
        locals: {}
      };

      const { findUserByEmail } = await import('../repositories/userRepository.js');
      findUserByEmail.mockResolvedValue({
        password_hash: await import('bcrypt').then(b => b.hashSync('123456', 10))
      });

      await loginHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({
        error: expect.stringMatching(/Credenciales inválidas/)
      }));
    });
  });

  /**
   * @function logout
   * @description Tests para cerrar sesión vía API.
   */
  describe('logout', () => {
    /**
     * @test Borra cookie y responde con JSON
     */
    test('borra cookie y responde con JSON', () => {
      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      logout({}, res);

      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'logout ok' });
    });
  });

  /**
   * @function logoutView
   * @description Tests para cerrar sesión desde vista.
   */
  describe('logoutView', () => {
    /**
     * @test Borra cookie, guarda mensaje y redirige
     */
    test('borra cookie, guarda mensaje y redirige', () => {
      const req = { session: {} };
      const res = {
        clearCookie: jest.fn(),
        redirect: jest.fn()
      };

      logoutView(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(req.session.confirmationMessage).toMatch(/cerrado sesión/);
      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });

  /**
   * @function registerForm
   * @description Tests para la vista de registro.
   */
  describe('registerForm', () => {
    /**
     * @test Renderiza formulario si no hay usuario
     */
    test('renderiza formulario si no hay usuario', () => {
      const req = {};
      const res = {
        locals: {},
        render: jest.fn(),
        redirect: jest.fn()
      };

      registerForm(req, res);

      expect(res.render).toHaveBeenCalledWith('auth/register', expect.objectContaining({
        title: 'Registro de usuario'
      }));
    });

    /**
     * @test Redirige si ya hay usuario
     */
    test('redirige si ya hay usuario', () => {
      const req = {};
      const res = {
        locals: { user: { email: 'a@a.com' } },
        render: jest.fn(),
        redirect: jest.fn()
      };

      registerForm(req, res);

      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });

  /**
   * @function loginForm
   * @description Tests para la vista de login.
   */
  describe('loginForm', () => {
    /**
     * @test Renderiza login si no hay usuario
     */
    test('renderiza login si no hay usuario', () => {
      const req = {};
      const res = {
        locals: {},
        render: jest.fn(),
        redirect: jest.fn()
      };

      loginForm(req, res);

      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({
        title: 'Iniciar sesión'
      }));
    });

    /**
     * @test Redirige si ya hay usuario
     */
    test('redirige si ya hay usuario', () => {
      const req = {};
      const res = {
        locals: { user: { email: 'a@a.com' } },
        render: jest.fn(),
        redirect: jest.fn()
      };

      loginForm(req, res);

      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });
});
