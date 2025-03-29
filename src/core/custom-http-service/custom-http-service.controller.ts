import { Controller } from '@nestjs/common';
import { CustomHttpService } from './custom-http-service.service';

@Controller('custom-http-service')
export class CustomHttpServiceController {
  constructor(private readonly customHttpServiceService: CustomHttpService) {}
}
