import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantsController', () => {
  let controller: TenantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        TenantService,
        { provide: 'TenantRepository', useValue: {} },
        { provide: 'PropertyRepository', useValue: {} },
        { provide: 'RoomRepository', useValue: {} },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
