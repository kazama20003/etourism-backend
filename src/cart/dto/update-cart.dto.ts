import { IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCartItemDto } from './create-cart.dto';

export class UpdateCartDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCartItemDto)
  items?: CreateCartItemDto[];

  @IsOptional()
  @IsIn(['open', 'converted', 'abandoned'])
  status?: 'open' | 'converted' | 'abandoned';
}
