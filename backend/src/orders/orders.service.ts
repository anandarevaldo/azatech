import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { serializeValue, successResponse } from '../common/api-response';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, createdById: string) {
    const uniqueProductIds = new Set(dto.items.map((item) => item.product_id));
    if (uniqueProductIds.size !== dto.items.length) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'Produk duplikat dalam order',
        errors: { items: ['Setiap produk hanya boleh muncul satu kali'] },
      });
    }

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findFirst({
          where: { id: dto.customer_id, deletedAt: null },
        });
        if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');

        const products = await tx.product.findMany({
          where: {
            id: { in: dto.items.map((item) => BigInt(item.product_id)) },
            deletedAt: null,
          },
        });
        const productsById = new Map(products.map((product) => [product.id.toString(), product]));
        const errors: Record<string, string[]> = {};

        dto.items.forEach((item, index) => {
          const product = productsById.get(String(item.product_id));
          if (!product) {
            errors[`items.${index}.product_id`] = ['Produk tidak ditemukan'];
          } else if (product.stock < item.quantity) {
            errors[`items.${index}.quantity`] = [
              `Stok ${product.productName} tersisa ${product.stock}, diminta ${item.quantity}`,
            ];
          }
        });
        if (Object.keys(errors).length > 0) {
          throw new UnprocessableEntityException({
            success: false,
            message: 'Stok tidak mencukupi atau produk tidak tersedia',
            errors,
          });
        }

        const orderNumber = await this.generateOrderNumber(tx);
        const items = dto.items.map((item) => {
          const product = productsById.get(String(item.product_id))!;
          const unitPrice = new Prisma.Decimal(product.price);
          const subtotal = unitPrice.mul(item.quantity);
          return {
            product,
            quantity: item.quantity,
            unitPrice,
            subtotal,
          };
        });
        const totalAmount = items.reduce(
          (total, item) => total.add(item.subtotal),
          new Prisma.Decimal(0),
        );

        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            customerId: dto.customer_id,
            createdById: BigInt(createdById),
            totalAmount,
            items: {
              create: items.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
            },
          },
          include: { items: true },
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
        return createdOrder;
      });

      return successResponse('Order berhasil dibuat', serializeValue(order));
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Nomor order bentrok, silakan coba lagi');
      }
      throw error;
    }
  }

  async list(query: ListOrdersDto) {
    const where = this.buildListWhere(query);
    const skip = (query.page - 1) * query.per_page;
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { orderDate: 'desc' },
        skip,
        take: query.per_page,
        include: { customer: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return successResponse('OK', serializeValue(orders), {
      page: query.page,
      per_page: query.per_page,
      total,
      total_pages: Math.ceil(total / query.per_page),
    });
  }

  async exportCsv(query: ListOrdersDto): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: this.buildListWhere(query),
      orderBy: { orderDate: 'desc' },
      include: { customer: true, items: { include: { product: true } } },
    });
    const rows = [
      ['Nomor Order', 'Tanggal', 'Customer', 'Produk', 'Qty', 'Harga Satuan', 'Subtotal', 'Total Order'],
      ...orders.flatMap((order) => order.items.map((item) => [
        order.orderNumber,
        new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(order.orderDate),
        order.customer.customerName,
        item.product.productName,
        String(item.quantity),
        item.unitPrice.toString(),
        item.subtotal.toString(),
        order.totalAmount.toString(),
      ])),
    ];
    return rows.map((row) => row.map((value) => this.escapeCsv(value)).join(',')).join('\n');
  }

  async findOne(id: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return successResponse('OK', serializeValue(order));
  }

  private async generateOrderNumber(tx: TransactionClient): Promise<string> {
    const now = new Date();
    const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('');
    const prefix = `INV-${date}-`;
    const latest = await tx.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const next = latest ? Number(latest.orderNumber.slice(-4)) + 1 : 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  private buildListWhere(query: ListOrdersDto): Prisma.OrderWhereInput {
    return {
      ...(query.customer_id ? { customerId: query.customer_id } : {}),
      ...(query.search ? { OR: [
        { orderNumber: { contains: query.search, mode: 'insensitive' as const } },
        { customer: { customerName: { contains: query.search, mode: 'insensitive' as const } } },
      ] } : {}),
      ...(query.from || query.to
        ? {
            orderDate: {
              ...(query.from && { gte: new Date(`${query.from}T00:00:00+07:00`) }),
              ...(query.to && { lt: new Date(Date.parse(`${query.to}T00:00:00+07:00`) + 24 * 60 * 60 * 1000) }),
            },
          }
        : {}),
    };
  }

  private escapeCsv(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
