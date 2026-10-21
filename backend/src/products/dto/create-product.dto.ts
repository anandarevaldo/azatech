import { IsInt, IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  product_code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  product_name!: string;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price!: number;
}
