import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  create() {}
  getHello(): string {
    return 'Hello World!';
  }
}
