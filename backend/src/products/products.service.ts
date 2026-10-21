import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { successResponse, serializeValue } from '../common/api-response';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsDto) {
    const where = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { productName: { contains: query.search, mode: 'insensitive' as const } },
              { productCode: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const orderBy = {
      name: { productName: query.order },
      price: { price: query.order },
      stock: { stock: query.order },
    }[query.sort];
    const skip = (query.page - 1) * query.per_page;
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, skip, take: query.per_page }),
      this.prisma.product.count({ where }),
    ]);

    return successResponse(
      'OK',
      serializeValue(products),
      {
        page: query.page,
        per_page: query.per_page,
        total,
        total_pages: Math.ceil(total / query.per_page),
      },
    );
  }

  async findOne(id: bigint) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return successResponse('OK', serializeValue(product));
  }

  async create(dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          productCode: dto.product_code,
          productName: dto.product_name,
          stock: dto.stock,
          price: dto.price,
        },
      });
      return successResponse('Produk berhasil dibuat', serializeValue(product));
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Kode produk sudah digunakan');
      }
      throw error;
    }
  }

  async update(id: bigint, dto: UpdateProductDto) {
    await this.ensureExists(id);
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.product_code !== undefined && { productCode: dto.product_code }),
          ...(dto.product_name !== undefined && { productName: dto.product_name }),
          ...(dto.stock !== undefined && { stock: dto.stock }),
          ...(dto.price !== undefined && { price: dto.price }),
        },
      });
      return successResponse('Produk berhasil diperbarui', serializeValue(product));
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Kode produk sudah digunakan');
      }
      throw error;
    }
  }

  async remove(id: bigint) {
    await this.ensureExists(id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async ensureExists(id: bigint): Promise<void> {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
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
