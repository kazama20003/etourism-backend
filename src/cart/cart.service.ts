import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './entities/cart.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  // POST /cart
  async create(dto: CreateCartDto & { userId?: string }): Promise<Cart> {
    const { userId, sessionId, items } = dto;

    if (!userId && !sessionId) {
      throw new BadRequestException('sessionId is required for guest users');
    }

    const cart = await this.getOrCreateOpenCart(userId, sessionId);

    if (items?.length) {
      for (const item of items) {
        cart.items.push({
          productId: new Types.ObjectId(item.productId),
          productType: item.productType,
          travelDate: item.travelDate ? new Date(item.travelDate) : undefined,
          adults: item.adults ?? 1,
          children: item.children ?? 0,
          infants: item.infants ?? 0,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          appliedOfferId: item.appliedOfferId
            ? new Types.ObjectId(item.appliedOfferId)
            : undefined,
          notes: item.notes,
          addedAt: new Date(),
        });
      }
    }

    this.recalculateTotals(cart);
    return cart.save();
  }

  // GET /cart
  async findAll(): Promise<Cart[]> {
    return this.cartModel
      .find()
      .populate({
        path: 'items.productId',
        select: 'title slug currentPrice images',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ✅ GET /cart/current
  async findCurrent(params: {
    userId?: string;
    sessionId?: string;
  }): Promise<Cart | null> {
    const { userId, sessionId } = params;

    if (!userId && !sessionId) {
      throw new BadRequestException('userId or sessionId is required');
    }

    return this.cartModel
      .findOne({
        status: 'open',
        ...(userId && { userId: new Types.ObjectId(userId) }),
        ...(sessionId && { sessionId }),
      })
      .populate({
        path: 'items.productId',
        select: 'title slug currentPrice images',
      })
      .exec();
  }

  // GET /cart/:id
  async findOne(id: string): Promise<Cart> {
    const cart = await this.cartModel
      .findById(id)
      .populate({
        path: 'items.productId',
        select: 'title slug currentPrice images',
      })
      .exec();
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  // PATCH /cart/:id
  async update(id: string, dto: UpdateCartDto): Promise<Cart> {
    const cart = await this.cartModel.findById(id);
    if (!cart) throw new NotFoundException('Cart not found');

    if (dto.items) {
      cart.items = dto.items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        productType: item.productType,
        travelDate: item.travelDate ? new Date(item.travelDate) : undefined,
        adults: item.adults ?? 1,
        children: item.children ?? 0,
        infants: item.infants ?? 0,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        appliedOfferId: item.appliedOfferId
          ? new Types.ObjectId(item.appliedOfferId)
          : undefined,
        notes: item.notes,
        addedAt: new Date(),
      }));
    }

    if (dto.status) {
      cart.status = dto.status;
    }

    this.recalculateTotals(cart);
    return cart.save();
  }

  // DELETE /cart/:id
  async remove(id: string) {
    const cart = await this.cartModel.findByIdAndDelete(id);
    if (!cart) throw new NotFoundException('Cart not found');
    return { deleted: true };
  }

  // ============================
  // Helpers
  // ============================
  private async getOrCreateOpenCart(
    userId?: string,
    sessionId?: string,
  ): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({
      status: 'open',
      ...(userId && { userId: new Types.ObjectId(userId) }),
      ...(sessionId && { sessionId }),
    });

    if (!cart) {
      cart = await this.cartModel.create({
        userId: userId ? new Types.ObjectId(userId) : undefined,
        sessionId,
        items: [],
        subtotal: 0,
        discountTotal: 0,
        grandTotal: 0,
      });
    }

    return cart;
  }

  private recalculateTotals(cart: CartDocument) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    cart.discountTotal = 0;
    cart.grandTotal = cart.subtotal;
  }
}
