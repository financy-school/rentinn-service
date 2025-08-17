import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  userId: number;

  @IsInt()
  propertyId: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  issue: string;

  @IsString()
  @IsNotEmpty()
  raisedBy: string;

  @IsInt()
  roomId: number;
}
