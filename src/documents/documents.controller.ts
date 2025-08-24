import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @Headers('x-property-id') property_id: string,
  ) {
    return this.documentsService.create(property_id, createDocumentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Headers('x-property-id') property_id: string, @Query() query: any) {
    return this.documentsService.findAll(property_id, query);
  }

  @Get(':document_id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('document_id') document_id: string,
    @Headers('x-property-id') property_id: string,
  ) {
    return this.documentsService.findOne(property_id, document_id);
  }

  @Patch(':document_id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('document_id') document_id: string,
    @Headers('x-property-id') property_id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(
      property_id,
      document_id,
      updateDocumentDto,
    );
  }

  @Delete(':document_id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('document_id') document_id: string,
    @Headers('x-property-id') property_id: string,
  ) {
    return this.documentsService.removeDocument(property_id, document_id);
  }
}
