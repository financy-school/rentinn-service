import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class DownloadDocumentDto {
  @IsNotEmpty()
  @IsString()
  readonly document_path: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly expire_in?: number = 10; // 10 seconds
}
