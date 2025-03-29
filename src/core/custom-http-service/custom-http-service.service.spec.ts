import { Test, TestingModule } from '@nestjs/testing';
import { CustomHttpServiceService } from './custom-http-service.service';

describe('CustomHttpServiceService', () => {
  let service: CustomHttpServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomHttpServiceService],
    }).compile();

    service = module.get<CustomHttpServiceService>(CustomHttpServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
