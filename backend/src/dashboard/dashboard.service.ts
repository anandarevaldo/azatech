import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { serializeValue, successResponse } from '../common/api-response';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [orderSummary, topProducts, lowStockProducts] = await Promise.all([
      this.prisma.order.aggregate({
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null, stock: { lt: 5 } },
        orderBy: { stock: 'asc' },
      }),
    ]);

    const topProductIds = topProducts.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
    });
    const productById = new Map(products.map((product) => [product.id.toString(), product]));

    return successResponse('OK', {
      total_transactions: orderSummary._count._all,
      total_sales: orderSummary._sum.totalAmount?.toString() ?? '0.00',
      best_selling_products: topProducts.map((item) => ({
        product: serializeValue(productById.get(item.productId.toString())),
        quantity_sold: item._sum.quantity ?? 0,
      })),
      low_stock_products: serializeValue(lowStockProducts),
    });
  }
}
