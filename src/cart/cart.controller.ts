import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

import {
  OptionalJwtAuthGuard,
  JwtUser,
} from 'src/auth/guards/optional-jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // POST /cart (guest + auth)
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @Body() createCartDto: CreateCartDto,
    @Req() req: Request & { user?: JwtUser | null },
  ) {
    return this.cartService.create({
      ...createCartDto,
      userId: req.user?.sub, // ✅ viene del JWT (backend only)
    });
  }

  // GET /cart
  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  // GET /cart/current
  @Get('current')
  @UseGuards(OptionalJwtAuthGuard)
  findCurrent(
    @Req() req: Request & { user?: JwtUser | null },
    @Query('sessionId') sessionId?: string,
  ) {
    return this.cartService.findCurrent({
      userId: req.user?.sub, // ✅ JWT
      sessionId, // ✅ guest fallback
    });
  }

  // GET /cart/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  // PATCH /cart/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.update(id, updateCartDto);
  }

  // DELETE /cart/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(id);
  }
}
