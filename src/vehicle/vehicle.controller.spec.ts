import { Test, TestingModule } from '@nestjs/testing';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

interface MockVehicleService {
  create: jest.Mock<any, [CreateVehicleDto]>;
  findAll: jest.Mock<Promise<any[]>, [PaginationDto]>;
  findOne: jest.Mock<any, [string]>;
  update: jest.Mock<any, [string, any]>;
  remove: jest.Mock<any, [string]>;
}

const mockVehicleService: MockVehicleService = {
  create: jest.fn<any, [CreateVehicleDto]>((dto) => dto),
  findAll: jest.fn<Promise<any[]>, [PaginationDto]>().mockResolvedValue([]),
  findOne: jest.fn<any, [string]>((id) => ({ id })),
  update: jest.fn<any, [string, any]>(),
  remove: jest.fn<any, [string]>(),
};

describe('VehicleController', () => {
  let controller: VehicleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [
        {
          provide: VehicleService,
          useValue: mockVehicleService,
        },
      ],
    }).compile();

    controller = module.get<VehicleController>(VehicleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a vehicle', () => {
    const dto: CreateVehicleDto = { name: 'Minivan' };
    expect(controller.create(dto)).toEqual(dto);
    expect(mockVehicleService.create).toHaveBeenCalledWith(dto);
  });

  it('should return all vehicles', async () => {
    await controller.findAll({ page: '1', limit: '10' });
    expect(mockVehicleService.findAll).toHaveBeenCalled();
  });

  it('should return a vehicle by id', () => {
    expect(controller.findOne('123')).toEqual({ id: '123' });
    expect(mockVehicleService.findOne).toHaveBeenCalledWith('123');
  });
});
