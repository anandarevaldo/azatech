import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from './auth.types';
import { hashRefreshToken, verifyPassword } from './password.util';
import { signToken, verifyToken } from './token.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !verifyPassword(dto.password, user.password)) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const accessToken = this.createToken(user.id.toString(), 'access');
    const refreshToken = this.createToken(user.id.toString(), 'refresh');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashRefreshToken(refreshToken) },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: this.toAuthUser(user),
    };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) throw new UnauthorizedException('User tidak ditemukan');
    return this.toAuthUser(user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: BigInt(userId) },
      data: { refreshTokenHash: null },
    });
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyToken(
        refreshToken,
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        'refresh',
      );
      const user = await this.prisma.user.findUnique({ where: { id: BigInt(payload.sub) } });
      if (!user || user.refreshTokenHash !== hashRefreshToken(refreshToken)) {
        throw new UnauthorizedException('Refresh token tidak valid');
      }
      return { access_token: this.createToken(payload.sub, 'access') };
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid atau sudah kedaluwarsa');
    }
  }

  private createToken(subject: string, type: 'access' | 'refresh'): string {
    const secret = this.configService.getOrThrow<string>(
      type === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET',
    );
    const expiresIn = type === 'access' ? 900 : 604800;
    return signToken(subject, type, secret, expiresIn);
  }

  private toAuthUser(user: { id: bigint; name: string; email: string }): AuthUser {
    return { id: user.id.toString(), name: user.name, email: user.email };
  }
}
