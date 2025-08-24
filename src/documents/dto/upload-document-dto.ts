import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsNotEmpty()
  @IsString()
  readonly file_name: string;

  @IsNotEmpty()
  @IsString()
  readonly file_type: string;

  @IsNotEmpty()
  @IsNumber()
  readonly expire_in?: number;
}
