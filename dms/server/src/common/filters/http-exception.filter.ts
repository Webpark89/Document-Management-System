import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const respObj = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };
      message = Array.isArray(respObj.message)
        ? respObj.message.join(', ')
        : respObj.message || message;
      code = respObj.error || code;
    } else {
      const databaseCode = (exception as { code?: string })?.code;
      if (databaseCode === 'P2002') {
        status = 409;
        message = 'ข้อมูลนี้มีอยู่แล้ว กรุณาใช้ชื่อหรือเลขอื่น';
        code = 'DUPLICATE';
      } else if (databaseCode === 'P2025') {
        status = 404;
        message = 'ไม่พบข้อมูล';
        code = 'NOT_FOUND';
      } else if (databaseCode === 'P2003') {
        status = 400;
        message = 'ข้อมูลที่อ้างอิงไม่ถูกต้องหรือยังมีข้อมูลใช้งาน';
        code = 'INVALID_REFERENCE';
      } else {
        message = 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่';
      }
    }

    if (status >= 500) {
      const error = exception as Error & { code?: string };
      const diagnostic = {
        timestamp: new Date().toISOString(),
        method: request.method,
        path: request.path,
        status,
        name: error?.name ?? 'UnknownError',
        code: error?.code,
        // Prisma messages can contain query arguments; keep only stack locations.
        message: error?.name?.startsWith('Prisma') ? undefined : error?.message,
        stack: error?.stack?.split('\n').filter((line) => /^\s+at /.test(line)),
      };
      this.logger.error(JSON.stringify(diagnostic));
      if (process.env.NODE_ENV !== 'production') {
        try {
          const directory = path.join(process.cwd(), '.local');
          fs.mkdirSync(directory, { recursive: true });
          fs.writeFileSync(
            path.join(directory, 'last-api-error.json'),
            JSON.stringify(diagnostic, null, 2),
          );
        } catch {
          // A diagnostic write must never prevent the error response.
        }
      }
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        code,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
