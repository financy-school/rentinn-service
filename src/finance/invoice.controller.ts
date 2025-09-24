import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  createInvoice(
    @Request() req: any,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoiceService.createInvoice(createInvoiceDto, req.user.id);
  }

  @Get()
  findAllInvoices(@Query() paginationDto: PaginationDto, @Request() req: any) {
    return this.invoiceService.findAllInvoices(
      paginationDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get('statistics')
  getInvoiceStatistics(@Request() req: any) {
    return this.invoiceService.getInvoiceStatistics(req.user.id, req.user.role);
  }

  @Get(':id')
  async findInvoiceById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const invoice = await this.invoiceService.findInvoiceById(id);

    // Check if user has access to this invoice
    if (
      req.user.role !== UserRole.ADMIN &&
      invoice.tenantId !== req.user.id &&
      invoice.landlordId !== req.user.id
    ) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    return invoice;
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  updateInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: any,
  ) {
    return this.invoiceService.updateInvoice(
      id,
      updateInvoiceDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  deleteInvoice(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.invoiceService.deleteInvoice(id, req.user.id, req.user.role);
  }

  @Post('payments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  recordPayment(
    @Body() recordPaymentDto: RecordPaymentDto,
    @Request() req: any,
  ) {
    return this.invoiceService.recordPayment(recordPaymentDto, req.user.id);
  }

  @Get('tenants')
  getAvailableTenants() {
    return this.invoiceService.getAvailableTenants();
  }

  @Get('tenants/:id/info')
  getTenantRentals(@Param('id') tenantId: string) {
    return this.invoiceService.getTenantRentals(tenantId);
  }

  @Get('tenants/:id/invoice-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  getTenantInvoiceData(@Param('id') tenantId: string) {
    return this.invoiceService.getTenantInvoiceData(tenantId);
  }

  @Post(':id/reminder')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  sendInvoiceReminder(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.invoiceService.sendInvoiceReminder(id, req.user.id);
  }
}
