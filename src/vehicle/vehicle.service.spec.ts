import { Test, TestingModule } from '@nestjs/testing';
import { VehicleService } from './vehicle.service';
import { getModelToken } from '@nestjs/mongoose';
import { Vehicle } from './entities/vehicle.entity';

const mockVehicleModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue([]),
  countDocuments: jest.fn().mockResolvedValue(0),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

describe('VehicleService', () => {
  let service: VehicleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        {
          provide: getModelToken(Vehicle.name),
          useValue: mockVehicleModel,
        },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new vehicle', async () => {
    const dto = { name: 'Minivan 15 pax' };
    mockVehicleModel.create.mockResolvedValue(dto);

    const result = await service.create(dto);
    expect(result).toEqual(dto);
    expect(mockVehicleModel.create).toHaveBeenCalledWith(dto);
  });

  it('should return paginated vehicles', async () => {
    const result = await service.findAll({ page: '1', limit: '10' });

    expect(result.meta).toHaveProperty('page', 1);
    expect(result.meta).toHaveProperty('limit', 10);
  });
});
