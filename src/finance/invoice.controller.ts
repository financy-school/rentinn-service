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
  Request,
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
    return this.invoiceService.createInvoice(
      createInvoiceDto,
      req.user.user_id,
    );
  }

  @Get()
  findAllInvoices(@Query() paginationDto: PaginationDto, @Request() req: any) {
    return this.invoiceService.findAllInvoices(
      paginationDto,
      req.user.user_id,
      req.user.role,
    );
  }

  @Get('statistics')
  getInvoiceStatistics(@Request() req: any) {
    return this.invoiceService.getInvoiceStatistics(
      req.user.user_id,
      req.user.role,
    );
  }

  @Get(':invoice_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.TENANT)
  async findInvoiceById(@Param('invoice_id') invoice_id: string) {
    return this.invoiceService.findInvoiceById(invoice_id);
  }

  @Patch(':invoice_id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  updateInvoice(
    @Param('invoice_id') invoice_id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: any,
  ) {
    return this.invoiceService.updateInvoice(
      invoice_id,
      updateInvoiceDto,
      req.user.user_id,
      req.user.role,
    );
  }

  @Delete(':invoice_id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  deleteInvoice(@Param('invoice_id') invoice_id: string, @Request() req: any) {
    return this.invoiceService.deleteInvoice(
      invoice_id,
      req.user.user_id,
      req.user.role,
    );
  }

  @Post('payments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  recordPayment(
    @Body() recordPaymentDto: RecordPaymentDto,
    @Request() req: any,
  ) {
    return this.invoiceService.recordPayment(
      recordPaymentDto,
      req.user.user_id,
    );
  }

  @Get('tenants')
  getAvailableTenants() {
    return this.invoiceService.getAvailableTenants();
  }

  @Get('tenants/:tenant_id/info')
  getTenantRentals(@Param('tenant_id') tenant_id: string) {
    return this.invoiceService.getTenantRentals(tenant_id);
  }

  @Get('tenants/:tenant_id/invoice-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  getTenantInvoiceData(@Param('tenant_id') tenant_id: string) {
    return this.invoiceService.getTenantInvoiceData(tenant_id);
  }

  @Post(':invoice_id/reminder')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  sendInvoiceReminder(
    @Param('invoice_id') invoice_id: string,
    @Request() req: any,
  ) {
    return this.invoiceService.sendInvoiceReminder(
      invoice_id,
      req.user.user_id,
    );
  }
}
