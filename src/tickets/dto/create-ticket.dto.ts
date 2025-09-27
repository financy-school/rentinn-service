import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  property_id: string;

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

  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsArray()
  @IsString({ each: true })
  image_document_id_list: string[];
}
