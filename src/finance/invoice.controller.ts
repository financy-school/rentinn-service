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
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  createInvoice(
    @CurrentUser('user_id') user_id: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoiceService.createInvoice(createInvoiceDto, user_id);
  }

  @Get()
  findAllInvoices(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.invoiceService.findAllInvoices(paginationDto, user_id, role);
  }

  @Get('all')
  findAllInvoicesAdmin(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.invoiceService.findAllInvoices(paginationDto, user_id, role);
  }

  @Get('statistics')
  getInvoiceStatistics(
    @CurrentUser('user_id') user_id: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.invoiceService.getInvoiceStatistics(user_id, role);
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
    @CurrentUser('user_id') user_id: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.invoiceService.updateInvoice(
      invoice_id,
      updateInvoiceDto,
      user_id,
      role,
    );
  }

  @Delete(':invoice_id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  deleteInvoice(
    @Param('invoice_id') invoice_id: string,
    @CurrentUser('user_id') user_id: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.invoiceService.deleteInvoice(invoice_id, user_id, role);
  }

  @Post('payments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  recordPayment(
    @Body() recordPaymentDto: RecordPaymentDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.invoiceService.recordPayment(recordPaymentDto, user_id);
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
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.invoiceService.sendInvoiceReminder(invoice_id, user_id);
  }
}
