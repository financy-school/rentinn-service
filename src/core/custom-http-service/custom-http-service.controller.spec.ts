import { Test, TestingModule } from '@nestjs/testing';
import { CustomHttpServiceController } from './custom-http-service.controller';
import { CustomHttpServiceService } from './custom-http-service.service';

describe('CustomHttpServiceController', () => {
  let controller: CustomHttpServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomHttpServiceController],
      providers: [CustomHttpServiceService],
    }).compile();

    controller = module.get<CustomHttpServiceController>(CustomHttpServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
