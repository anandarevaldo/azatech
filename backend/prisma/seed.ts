import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${key}`;
}

async function main(): Promise<void> {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD wajib diatur sebelum menjalankan seed');
  }

  await prisma.user.upsert({
    where: { email: 'admin@azatech.id' },
    update: {},
    create: {
      name: 'Admin AZA',
      email: 'admin@azatech.id',
      password: hashPassword(adminPassword),
    },
  });

  const products = Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    return {
      productCode: `P${String(number).padStart(4, '0')}`,
      productName: `Produk Azatech ${number}`,
      stock: 10 + (number % 11),
      price: 5000 + number * 1000,
    };
  });

  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  const customerData = Array.from({ length: 15 }, (_, index) => {
    const number = index + 1;
    return {
      customerName: `Customer ${number}`,
      customerAddress: `Jakarta Selatan ${number}`,
      gender: number % 2 === 0 ? 'WANITA' : 'PRIA',
      birthDate: new Date(1990, number % 12, number),
      phone: `081234567${String(number).padStart(3, '0')}`,
    } as const;
  });

  const existingCustomers = await prisma.customer.count();
  if (existingCustomers === 0) {
    await prisma.customer.createMany({ data: customerData });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
