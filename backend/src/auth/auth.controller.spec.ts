import { INestApplication, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request = require('supertest'); // eslint-disable-line @typescript-eslint/no-require-imports
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { signToken } from './token.util';

describe('AuthController', () => {
  let app: INestApplication;
  const authService = {
    login: jest.fn().mockResolvedValue({ success: true, message: 'Login berhasil', data: { access_token: 'access', refresh_token: 'refresh' } }),
    refresh: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    me: jest.fn().mockResolvedValue({ success: true, message: 'OK', data: { id: '1', name: 'Admin', email: 'admin@example.com' } }),
  };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => new UnprocessableEntityException({
        message: 'Validasi gagal',
        errors: { validation: errors.flatMap((error) => Object.values(error.constraints ?? {})) },
      }),
    }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('logs in with valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.access_token).toBe('access');
        expect(authService.login).toHaveBeenCalled();
      });
  });

  it('rejects invalid login input', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(422);
  });

  it('rejects protected access without a token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('allows protected access with a valid access token', async () => {
    const token = signToken('1', 'access', 'test-secret', 60);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => expect(body.data.id).toBe('1'));
  });

  it('refreshes an access token', async () => {
    authService.refresh.mockResolvedValueOnce({ success: true, message: 'Token berhasil diperbarui', data: { access_token: 'refreshed-access' } });
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refresh_token: 'refresh' })
      .expect(200)
      .expect(({ body }) => expect(body.data.access_token).toBe('refreshed-access'));
  });
});
