import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CONFIG_MAP } from './config-map';

@Injectable()
export class CustomConfigService {
  constructor(private config_service: ConfigService) {}
}
