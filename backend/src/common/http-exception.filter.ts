import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : undefined;
    const payload = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
    const rawMessage = payload.message;
    const message = typeof rawMessage === 'string'
      ? rawMessage
      : status >= 500
        ? 'Terjadi kesalahan pada server'
        : 'Permintaan tidak valid';
    const errors = payload.errors ?? (Array.isArray(rawMessage) ? { validation: rawMessage } : undefined);

    response.status(status).json({
      success: false,
      message,
      ...(errors ? { errors } : {}),
    });
  }
}
