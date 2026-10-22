import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { serializeValue, successResponse } from '../common/api-response';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(requestedPeriod = 'weekly', selectedDate?: string, fromDate?: string, toDate?: string) {
    const preset = periodConfig[requestedPeriod as keyof typeof periodConfig] ?? periodConfig.weekly;
    const endKey = jakartaDateKey(new Date());
    const customRange = isDateKey(fromDate) && isDateKey(toDate) && fromDate <= toDate;
    const startKey = customRange ? fromDate! : shiftJakartaDate(endKey, -(preset.days - 1));
    const rangeEndKey = customRange ? toDate! : endKey;
    const config = customRange ? { key: 'custom', label: 'Rentang tanggal', days: daysBetween(startKey, rangeEndKey), buckets: Math.min(14, daysBetween(startKey, rangeEndKey)) } : preset;
    const endExclusive = new Date(`${shiftJakartaDate(rangeEndKey, 1)}T00:00:00+07:00`);
    const start = new Date(`${startKey}T00:00:00+07:00`);
    const where = { orderDate: { gte: start, lt: endExclusive } };
    const focusWhere = selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
      ? { orderDate: { gte: new Date(`${selectedDate}T00:00:00+07:00`), lt: new Date(`${shiftJakartaDate(selectedDate, 1)}T00:00:00+07:00`) } }
      : where;
    const [orderSummary, topProducts, lowStockProducts, recentOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: focusWhere,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
        where: selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? { order: focusWhere } : undefined,
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null, stock: { lt: 5 } },
        orderBy: { stock: 'asc' },
      }),
      this.prisma.order.findMany({
        where,
        select: { orderDate: true, totalAmount: true },
      }),
    ]);

    const topProductIds = topProducts.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
    });
    const productById = new Map(products.map((product) => [product.id.toString(), product]));

    const trend = Array.from({ length: config.buckets }, (_, index) => {
      const offset = Math.floor(index * config.days / config.buckets);
      const key = shiftJakartaDate(startKey, offset);
      const bucketEnd = shiftJakartaDate(startKey, Math.floor((index + 1) * config.days / config.buckets));
      const orders = recentOrders.filter((order) => jakartaDateKey(order.orderDate) >= key && jakartaDateKey(order.orderDate) < bucketEnd);
      return {
        date: key,
        orders: orders.length,
        sales: orders.reduce((total, order) => total + Number(order.totalAmount), 0),
      };
    });

    return successResponse('OK', {
      total_transactions: orderSummary._count._all,
      total_sales: orderSummary._sum.totalAmount?.toString() ?? '0.00',
      period: config.key,
      period_label: config.label,
      selected_date: selectedDate ?? null,
      range_from: startKey,
      range_to: rangeEndKey,
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

const periodConfig = {
  weekly: { key: 'weekly', label: '7 hari terakhir', days: 7, buckets: 7 },
  quarterly: { key: 'quarterly', label: '3 bulan terakhir', days: 90, buckets: 12 },
  semesterly: { key: 'semesterly', label: '6 bulan terakhir', days: 180, buckets: 12 },
  yearly: { key: 'yearly', label: '12 bulan terakhir', days: 365, buckets: 12 },
} as const;

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

function isDateKey(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function daysBetween(startKey: string, endKey: string): number {
  const start = new Date(`${startKey}T00:00:00Z`).getTime();
  const end = new Date(`${endKey}T00:00:00Z`).getTime();
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
}
