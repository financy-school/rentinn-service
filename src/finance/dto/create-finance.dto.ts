import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDate,
} from 'class-validator';

export class CreateFinanceDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsDate()
  transactionDate?: Date;
}
