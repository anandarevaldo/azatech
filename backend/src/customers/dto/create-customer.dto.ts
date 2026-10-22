import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  customer_name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  customer_address!: string;

  @IsIn(['PRIA', 'WANITA'])
  gender!: 'PRIA' | 'WANITA';

  @IsDateString()
  birth_date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000000)
  image_url?: string;
}
