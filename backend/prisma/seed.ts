import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ?? 'postgresql://localhost:5432/azatech?schema=public',
  }),
});

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

async function main(): Promise<void> {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD wajib diatur sebelum menjalankan seed');
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@azatech.id' },
    update: { password: hashPassword(adminPassword) },
    create: {
      name: 'Admin AZA',
      email: 'admin@azatech.id',
      password: hashPassword(adminPassword),
    },
  });

  const productNames = [
    'Kopi Susu Aren 250 ml', 'Teh Melati Dingin 330 ml', 'Granola Madu 300 g',
    'Keripik Tempe Original 150 g', 'Sambal Matah 180 g', 'Mie Kuah Kari Pedas',
    'Air Mineral 600 ml', 'Sabun Cuci Tangan 250 ml', 'Tisu Wajah 200 lembar',
    'Beras Pandan Wangi 5 kg', 'Gula Aren Cair 500 ml', 'Susu UHT Cokelat 200 ml',
    'Biskuit Gandum 240 g', 'Cokelat Batang 70% 100 g', 'Minyak Goreng 1 L',
    'Pasta Gigi Herbal 120 g', 'Roti Gandum 400 g', 'Selai Kacang 340 g',
    'Kecap Manis 600 ml', 'Keripik Pisang Cokelat 200 g',
  ];
  const products = productNames.map((productName, index) => ({
    productCode: `P${String(index + 1).padStart(4, '0')}`,
    productName,
    stock: 10 + ((index + 1) % 11),
    price: 5000 + (index + 1) * 1000,
  }));

  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });
  for (const [index, product] of products.entries()) {
    await prisma.product.updateMany({
      where: { productCode: product.productCode, productName: `Produk Azatech ${index + 1}` },
      data: { productName: product.productName },
    });
  }

  const customerNames = [
    'Rizky Mahendra', 'Nadia Putri', 'Bagas Pratama', 'Siti Nurlaila',
    'Dimas Saputra', 'Ayu Larasati', 'Fajar Ramadhan', 'Intan Permata',
    'Ardi Wijaya', 'Maya Anggraini', 'Reza Firmansyah', 'Salma Zahra',
    'Bima Kurniawan', 'Dewi Kartika', 'Yoga Prakoso',
  ];
  const customerAddresses = [
    'Jl. Kemang Raya, Jakarta Selatan', 'Jl. Dago Asri, Bandung',
    'Jl. Margonda Raya, Depok', 'Jl. Cipete Raya, Jakarta Selatan',
    'Jl. Ahmad Yani, Bekasi', 'Jl. Godean, Sleman',
    'Jl. Pemuda, Semarang', 'Jl. Bintaro Utama, Tangerang Selatan',
    'Jl. Raya Pajajaran, Bogor', 'Jl. Ir. H. Juanda, Jakarta Pusat',
    'Jl. Taman Sari, Bandung', 'Jl. Kaliurang, Yogyakarta',
    'Jl. Veteran, Surabaya', 'Jl. Setiabudi, Jakarta Selatan',
    'Jl. Panjang, Jakarta Barat',
  ];
  const customerData = customerNames.map((customerName, index) => ({
    customerName,
    customerAddress: customerAddresses[index],
    gender: index % 2 === 0 ? 'PRIA' as const : 'WANITA' as const,
    birthDate: new Date(1990, (index + 1) % 12, index + 1),
    phone: `081234567${String(index + 1).padStart(3, '0')}`,
  }));

  const existingCustomers = await prisma.customer.count();
  if (existingCustomers === 0) {
    await prisma.customer.createMany({ data: customerData });
  }
  for (const [index, customer] of customerData.entries()) {
    await prisma.customer.updateMany({
      where: { customerName: `Customer ${index + 1}`, phone: customer.phone },
      data: { customerName: customer.customerName, customerAddress: customer.customerAddress },
    });
  }

  const orderCount = await prisma.order.count();
  if (orderCount === 0) {
    const customers = await prisma.customer.findMany({ take: 15, orderBy: { createdAt: 'asc' } });
    const seededProducts = await prisma.product.findMany({ take: 20, orderBy: { id: 'asc' } });
    for (let index = 0; index < 30; index += 1) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - index);
      const product = seededProducts[index % seededProducts.length];
      const quantity = (index % 2) + 1;
      const unitPrice = new Prisma.Decimal(product.price);
      const subtotal = unitPrice.mul(quantity);
      const date = [orderDate.getFullYear(), orderDate.getMonth() + 1, orderDate.getDate()]
        .map((part) => String(part).padStart(2, '0'))
        .join('');

      await prisma.$transaction([
        prisma.order.create({
          data: {
            orderNumber: `INV-${date}-0001`,
            customerId: customers[index % customers.length].id,
            createdById: admin.id,
            orderDate,
            totalAmount: subtotal,
            items: {
              create: [{ productId: product.id, quantity, unitPrice, subtotal }],
            },
          },
        }),
        prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: quantity } },
        }),
      ]);
    }
  }

  // Tambahkan data tren demo deterministik sekali saja agar grafik 7 hari
  // menunjukkan volume harian yang berbeda saat database lokal sudah terisi.
  const demoTrendExists = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: 'DEMO-TREND-' } },
    select: { id: true },
  });
  if (!demoTrendExists) {
    const customers = await prisma.customer.findMany({ take: 15, orderBy: { createdAt: 'asc' } });
    const seededProducts = await prisma.product.findMany({ take: 20, orderBy: { id: 'asc' } });
    const ordersPerDay = [0, 2, 4, 1, 3, 2, 5];
    for (let dayIndex = 0; dayIndex < ordersPerDay.length; dayIndex += 1) {
      for (let sequence = 0; sequence < ordersPerDay[dayIndex]; sequence += 1) {
        const orderDate = new Date();
        orderDate.setHours(9 + sequence * 2, 15, 0, 0);
        orderDate.setDate(orderDate.getDate() - (6 - dayIndex));
        const product = seededProducts[(dayIndex * 3 + sequence) % seededProducts.length];
        const unitPrice = new Prisma.Decimal(product.price);
        const subtotal = unitPrice;
        const date = [orderDate.getFullYear(), orderDate.getMonth() + 1, orderDate.getDate()]
          .map((part) => String(part).padStart(2, '0'))
          .join('');

        await prisma.$transaction([
          prisma.order.create({
            data: {
              orderNumber: `DEMO-TREND-${date}-${String(sequence + 1).padStart(2, '0')}`,
              customerId: customers[(dayIndex + sequence) % customers.length].id,
              createdById: admin.id,
              orderDate,
              totalAmount: subtotal,
              items: { create: [{ productId: product.id, quantity: 1, unitPrice, subtotal }] },
            },
          }),
          prisma.product.update({
            where: { id: product.id },
            data: { stock: { decrement: 1 } },
          }),
        ]);
      }
    }
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
