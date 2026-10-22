import { INestApplication, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request = require('supertest'); // eslint-disable-line @typescript-eslint/no-require-imports
import { AppModule } from '../app.module';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { PrismaService } from '../database/prisma.service';
import { hashPassword } from '../auth/password.util';

const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === '1';
const describeIntegration = runIntegrationTests ? describe : describe.skip;

describeIntegration('Orders API with PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let customerId: string;
  let productId: bigint;
  let secondProductId: bigint;
  const suffix = Date.now().toString();
  const email = `integration-${suffix}@azatech.test`;
  const password = 'Integration123!';

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET ??= 'integration-access-secret';
    process.env.JWT_REFRESH_SECRET ??= 'integration-refresh-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => new UnprocessableEntityException({
          message: 'Validasi gagal',
          errors: { validation: errors.flatMap((error) => Object.values(error.constraints ?? {})) },
        }),
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    const user = await prisma.user.create({
      data: { name: 'Integration Test', email, password: hashPassword(password) },
    });
    const customer = await prisma.customer.create({
      data: {
        customerName: `Integration Customer ${suffix}`,
        customerAddress: 'Jl. Testing PostgreSQL 1',
        gender: 'PRIA',
        birthDate: new Date('1990-01-01'),
        phone: `0899${suffix.slice(-8)}`,
      },
    });
    const product = await prisma.product.create({
      data: {
        productCode: `IT-${suffix.slice(-14)}`,
        productName: `Integration Product ${suffix}`,
        stock: 5,
        price: new Prisma.Decimal('12000.00'),
      },
    });
    const secondProduct = await prisma.product.create({
      data: {
        productCode: `IT2-${suffix.slice(-13)}`,
        productName: `Integration Product Two ${suffix}`,
        stock: 1,
        price: new Prisma.Decimal('7000.00'),
      },
    });
    customerId = customer.id;
    productId = product.id;
    secondProductId = secondProduct.id;

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    accessToken = login.body.data.access_token as string;
    expect(user.email).toBe(email);
  }, 30000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.order.deleteMany({ where: { createdById: (await prisma.user.findUniqueOrThrow({ where: { email } })).id } });
    await prisma.product.deleteMany({ where: { id: { in: [productId, secondProductId] } } });
    await prisma.customer.deleteMany({ where: { id: customerId } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  }, 30000);

  it('creates an order and persists server-calculated totals and stock changes', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ customer_id: customerId, items: [{ product_id: Number(productId), quantity: 2 }] })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.orderNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    const order = await prisma.order.findUnique({
      where: { orderNumber: response.body.data.orderNumber },
      include: { items: true },
    });
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(order?.totalAmount.toString()).toBe('24000');
    expect(order?.items[0].unitPrice.toString()).toBe('12000');
    expect(product.stock).toBe(3);
  });

  it('rejects insufficient stock atomically for a multi-item order', async () => {
    const beforeCount = await prisma.order.count({ where: { customerId } });
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        items: [
          { product_id: Number(productId), quantity: 1 },
          { product_id: Number(secondProductId), quantity: 2 },
        ],
      })
      .expect(422);

    const afterCount = await prisma.order.count({ where: { customerId } });
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(afterCount).toBe(beforeCount);
    expect(product.stock).toBe(3);
  });

  it('returns 422 for invalid order input', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ customer_id: customerId, items: [] })
      .expect(422)
      .expect(({ body }) => {
        expect(body.success).toBe(false);
        expect(body.message).toBe('Validasi gagal');
      });
  });

  it('returns 401 when the order endpoint has no token', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .send({ customer_id: customerId, items: [{ product_id: Number(productId), quantity: 1 }] })
      .expect(401);
  });
});
