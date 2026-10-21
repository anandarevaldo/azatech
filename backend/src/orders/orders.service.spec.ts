import { Prisma } from '@prisma/client';
import { UnprocessableEntityException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  function createService(products: Array<{ id: bigint; productName: string; stock: number; price: Prisma.Decimal }>) {
    const tx = {
      customer: { findFirst: jest.fn().mockResolvedValue({ id: 'customer-1' }) },
      product: {
        findMany: jest.fn().mockResolvedValue(products),
        update: jest.fn().mockResolvedValue(undefined),
      },
      order: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1n, orderNumber: 'INV-20261021-0001' }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    return { service: new OrdersService(prisma as never), tx };
  }

  it('creates an order and decrements stock after validation', async () => {
    const { service, tx } = createService([
      { id: 1n, productName: 'Hydrococo', stock: 10, price: new Prisma.Decimal('12000.00') },
    ]);
    await service.create(
      { customer_id: 'customer-1', items: [{ product_id: 1, quantity: 2 }] },
      '1',
    );
    expect(tx.order.create).toHaveBeenCalled();
    expect(tx.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stock: { decrement: 2 } } }),
    );
  });

  it('rejects an order when stock is insufficient', async () => {
    const { service, tx } = createService([
      { id: 1n, productName: 'Hydrococo', stock: 1, price: new Prisma.Decimal('12000.00') },
    ]);
    await expect(
      service.create(
        { customer_id: 'customer-1', items: [{ product_id: 1, quantity: 2 }] },
        '1',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.product.update).not.toHaveBeenCalled();
  });

  it('rejects duplicate products in one order', async () => {
    const { service } = createService([]);
    await expect(
      service.create(
        {
          customer_id: 'customer-1',
          items: [
            { product_id: 1, quantity: 1 },
            { product_id: 1, quantity: 1 },
          ],
        },
        '1',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
