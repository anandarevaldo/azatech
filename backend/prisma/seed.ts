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

function dateKey(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('');
}

const productImages = [
  'https://i.gojekapi.com/darkroom/gofood-indonesia/v2/images/uploads/35b7370a-a805-4581-9869-4ef8d8bc1cd5_Go-Biz_20240926_173307.jpeg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/103/MTA-155875710/teh_pucuk_teh_pucuk_350ml_full01_5320d981.jpg',
  'https://id-live-01.slatic.net/p/6e3533a24b6f2ef1654ed2d4826965c4.png',
  'https://pesonanusantara.co.id/images/upload/p/e/pes-kdr020037003944.jpg',
  'https://pesonanusantara.co.id/images/upload/p/e/pes-kdr020037003944.jpg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/resize/sedaap_sedaap_mie_kuah_kari_ayam_72_g_full01_k9qk6bnm.jpg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-4492431/aqua_aqua_air_mineral_botol_600_ml_full04_ol4hu7bg.webp',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6920210/lifebuoy_lifebuoy_sabun_cuci_tangan_anti_bakteri_total_10_pump_200_ml_full02_ohax27q2.jpeg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/97/MTA-32835084/tessa_tessa_facial_tissue_-200_sheet-_full01_sfn2sfke.jpg',
  'https://down-id.img.susercontent.com/file/id-11134207-7r98u-lv99ptnu63ir63',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/102/MTA-163814817/manisin_gula_aren_cair_500ml_simanis_full13_jxlvmfaj.jpg',
  'https://down-id.img.susercontent.com/file/id-11134207-822wj-mlxlgdk7e0ase9',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/102/MTA-45460649/roma_roma_sari_gandum_biskuit_240_gram_full01_jafsl0ag.jpg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/97/MTA-5645455/PEPSODENT_Bandung_-_PEPSODENT_Natural_Herbal_Toothpaste_-120_g-_full01_pwx95t79.jpg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/86/MTA-3007416/bimoli_surabaya---bimoli-classic-minyak-goreng--1-l--botol-_full02.jpg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/97/MTA-5645455/PEPSODENT_Bandung_-_PEPSODENT_Natural_Herbal_Toothpaste_-120_g-_full01_pwx95t79.jpg',
  'https://image.astronauts.cloud/product-images/2024/10/SariRotiTawarGandum10Lembar400gram_5a795539-f8c1-4378-857c-dce70930ea80_900x900.jpg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/106/MTA-181932928/selma_selma-peanut-butter-creamy-340gr_full01-00033060.jpg',
  'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/102/MTA-163814817/manisin_gula_aren_cair_500ml_simanis_full13_jxlvmfaj.jpg',
  'https://pesonanusantara.co.id/images/upload/p/e/pes-kdr020037003944.jpg',
];

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
    imageUrl: productImages[index],
    stock: 10 + ((index + 1) % 11),
    price: 5000 + (index + 1) * 1000,
  }));

  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });
  for (const [index, product] of products.entries()) {
    await prisma.product.updateMany({
      where: { productCode: product.productCode },
      data: { productName: product.productName, imageUrl: product.imageUrl },
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
      const date = dateKey(orderDate);

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

  // Normalisasi data trend lama dari seed sebelumnya ke format invoice resmi.
  const legacyTrendOrders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: 'DEMO-TREND-' } },
    select: { id: true, orderDate: true },
    orderBy: { orderDate: 'asc' },
  });

  const legacySequenceByDate = new Map<string, number>();
  for (const order of legacyTrendOrders) {
    const date = dateKey(order.orderDate);
    const sequence = (legacySequenceByDate.get(date) ?? 1) + 1;
    legacySequenceByDate.set(date, sequence);
    await prisma.order.update({
      where: { id: order.id },
      data: { orderNumber: `INV-${date}-${String(sequence).padStart(4, '0')}` },
    });
  }

  // Tambahkan data tren demo deterministik agar grafik 7 hari terisi penuh.
  const customers = await prisma.customer.findMany({ take: 15, orderBy: { createdAt: 'asc' } });
  const seededProducts = await prisma.product.findMany({ take: 20, orderBy: { id: 'asc' } });
  const ordersPerDay = [0, 2, 4, 1, 3, 2, 5];
  for (let dayIndex = 0; dayIndex < ordersPerDay.length; dayIndex += 1) {
    const orderDateForDay = new Date();
    orderDateForDay.setDate(orderDateForDay.getDate() - (6 - dayIndex));
    const date = dateKey(orderDateForDay);
    const existingOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          in: Array.from({ length: ordersPerDay[dayIndex] }, (_, index) =>
            `INV-${date}-${String(index + 2).padStart(4, '0')}`),
        },
      },
      select: { orderNumber: true },
    });
    const existingNumbers = new Set(existingOrders.map((order) => order.orderNumber));

    for (let sequence = 0; sequence < ordersPerDay[dayIndex]; sequence += 1) {
      const orderDate = new Date(orderDateForDay);
      orderDate.setHours(9 + sequence * 2, 15, 0, 0);
      const orderNumber = `INV-${date}-${String(sequence + 2).padStart(4, '0')}`;
      if (existingNumbers.has(orderNumber)) continue;

      const product = seededProducts[(dayIndex * 3 + sequence) % seededProducts.length];
      const unitPrice = new Prisma.Decimal(product.price);
      const subtotal = unitPrice;

      await prisma.$transaction([
        prisma.order.create({
          data: {
            orderNumber,
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

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
