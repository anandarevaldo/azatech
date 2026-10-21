import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { serializeValue, successResponse } from '../common/api-response';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const trendStartKey = shiftJakartaDate(jakartaDateKey(new Date()), -6);
    const trendStart = new Date(`${trendStartKey}T00:00:00+07:00`);
    const [orderSummary, topProducts, lowStockProducts, recentOrders] = await Promise.all([
      this.prisma.order.aggregate({
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null, stock: { lt: 5 } },
        orderBy: { stock: 'asc' },
      }),
      this.prisma.order.findMany({
        where: { orderDate: { gte: trendStart } },
        select: { orderDate: true, totalAmount: true },
      }),
    ]);

    const topProductIds = topProducts.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
    });
    const productById = new Map(products.map((product) => [product.id.toString(), product]));

    const trend = Array.from({ length: 7 }, (_, index) => {
      const key = shiftJakartaDate(trendStartKey, index);
      const orders = recentOrders.filter((order) => jakartaDateKey(order.orderDate) === key);
      return {
        date: key,
        orders: orders.length,
        sales: orders.reduce((total, order) => total + Number(order.totalAmount), 0),
      };
    });

    return successResponse('OK', {
      total_transactions: orderSummary._count._all,
      total_sales: orderSummary._sum.totalAmount?.toString() ?? '0.00',
      best_selling_products: topProducts.map((item) => ({
        product: serializeValue(productById.get(item.productId.toString())),
        quantity_sold: item._sum.quantity ?? 0,
        sales_contribution: Number(item._sum.subtotal ?? 0),
      })),
      low_stock_products: serializeValue(lowStockProducts),
      daily_trend: trend,
    });
  }
}

const jakartaFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function jakartaDateKey(date: Date): string {
  return jakartaFormatter.format(date);
}

function shiftJakartaDate(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
