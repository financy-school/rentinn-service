import { HttpException } from '@nestjs/common';
import { HttpStatus } from 'aws-sdk/clients/lambda';

export interface ErrorCode {
  code: string;
  description: string;
}

export const customHttpError = (
  error_code: ErrorCode,
  error_name: string,
  error_message: string,
  https_status_code: HttpStatus,
  status_text?: string,
): HttpException => {
  return new HttpException(
    {
      code: error_code,
      name: error_name,
      message: error_message,
      status_text,
    },
    https_status_code,
  );
};
