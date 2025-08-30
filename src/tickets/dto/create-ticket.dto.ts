import { IsInt, IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  @IsNotEmpty()
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
  @IsNotEmpty()
  roomId: number;

  @IsArray()
  @IsString({ each: true })
  image_document_id_list: string[];
}
