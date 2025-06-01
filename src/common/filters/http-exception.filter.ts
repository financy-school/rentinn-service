import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    const errorObject = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof errorResponse === 'object' &&
        errorResponse !== null &&
        'message' in errorResponse
          ? (errorResponse as any).message
          : (typeof errorResponse === 'string'
              ? errorResponse
              : exception.message) || 'Internal server error',
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'ExceptionFilter',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url}`,
        JSON.stringify(errorObject),
        'ExceptionFilter',
      );
    }

    response.status(status).json(errorObject);
  }
}
