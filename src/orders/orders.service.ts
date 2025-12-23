import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Order, OrderDocument } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Tour, TourDocument } from '../tours/entities/tour.entity';
import {
  Transport,
  TransportDocument,
} from '../transports/entities/transport.entity';
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Tour.name)
    private readonly tourModel: Model<TourDocument>,

    @InjectModel(Transport.name)
    private readonly transportModel: Model<TransportDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId?: string) {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must include at least one item');
    }

    for (const item of createOrderDto.items) {
      if (!Types.ObjectId.isValid(item.productId)) {
        throw new BadRequestException(
          `Invalid productId in item: ${item.productId}`,
        );
      }
    }

    const confirmationCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    const order = await this.orderModel.create({
      ...createOrderDto,
      confirmationCode,
      ...(userId && { userId: new Types.ObjectId(userId) }),
    });

    return order;
  }

  // 📄 GET ALL (con paginación)
  async findAll(paginationDto: PaginationDto) {
    const { page = '1', limit = '10' } = paginationDto;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);

    const skip = (pageNumber - 1) * limitNumber;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find()
        .skip(skip)
        .limit(limitNumber)
        .populate('userId')
        .populate('items.appliedOfferId')
        .exec(),

      this.orderModel.countDocuments(),
    ]);

    return {
      page: pageNumber,
      limit: limitNumber,
      total,
      data: orders,
    };
  }

  // 🔍 GET ONE
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findById(id)
      .populate('userId')
      .populate('items.appliedOfferId');

    if (!order) throw new NotFoundException(`Order "${id}" not found`);

    return order;
  }

  // ✏️ UPDATE ORDER
  async update(id: string, updateOrderDto: UpdateOrderDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .populate('userId')
      .populate('items.appliedOfferId');

    if (!updated) throw new NotFoundException(`Order "${id}" not found`);

    return updated;
  }

  // 🗑️ DELETE ORDER
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const deleted = await this.orderModel.findByIdAndDelete(id);

    if (!deleted) throw new NotFoundException(`Order "${id}" not found`);

    return {
      message: 'Order deleted successfully',
      orderId: id,
    };
  }
  // 📄 GET ORDERS BY AUTHENTICATED USER
  async findByUser(userId: string, paginationDto: PaginationDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const userObjectId = new Types.ObjectId(userId);

    const { page = '1', limit = '10' } = paginationDto;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find({ userId: userObjectId })
        .skip(skip)
        .limit(limitNumber)
        .populate('userId')
        .populate('items.appliedOfferId')
        .populate('items.productId') // ← TOUR O TRANSPORT
        .exec(),

      this.orderModel.countDocuments({ userId: userObjectId }),
    ]);

    return {
      page: pageNumber,
      limit: limitNumber,
      total,
      data: orders,
    };
  }
  // -------------------------------------------------------------
  // OBTENER TOUR POR ID
  // -------------------------------------------------------------
  async getTourById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.tourModel.findById(id).lean().exec();
  }

  // -------------------------------------------------------------
  // OBTENER TRANSPORT POR ID
  // -------------------------------------------------------------
  async getTransportById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.transportModel.findById(id).lean().exec();
  }
}
