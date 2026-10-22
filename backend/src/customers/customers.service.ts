import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { serializeValue, successResponse } from '../common/api-response';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCustomersDto) {
    const where = {
      deletedAt: null,
      ...(query.gender ? { gender: query.gender } : {}),
      ...(query.search
        ? { OR: [
            { customerName: { contains: query.search, mode: 'insensitive' as const } },
            { phone: { contains: query.search, mode: 'insensitive' as const } },
          ] }
        : {}),
    };
    const skip = (query.page - 1) * query.per_page;
    const [customers, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: { customerName: 'asc' },
        skip,
        take: query.per_page,
        include: { _count: { select: { orders: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return successResponse('OK', serializeValue(customers), {
      page: query.page,
      per_page: query.per_page,
      total,
      total_pages: Math.ceil(total / query.per_page),
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');
    return successResponse('OK', serializeValue(customer));
  }

  async create(dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        customerName: dto.customer_name,
        customerAddress: dto.customer_address,
        gender: dto.gender,
        birthDate: new Date(dto.birth_date),
        phone: dto.phone,
        imageUrl: dto.image_url,
      },
    });
    return successResponse('Pelanggan berhasil dibuat', serializeValue(customer));
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.ensureExists(id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.customer_name !== undefined && { customerName: dto.customer_name }),
        ...(dto.customer_address !== undefined && { customerAddress: dto.customer_address }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.birth_date !== undefined && { birthDate: new Date(dto.birth_date) }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.image_url !== undefined && { imageUrl: dto.image_url }),
      },
    });
    return successResponse('Pelanggan berhasil diperbarui', serializeValue(customer));
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async ensureExists(id: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');
  }
}
