import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Payment } from '../rentals/entities/payment.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import * as ejs from 'ejs';
import * as path from 'path';
import { UserRole } from '../common/enums/user-role.enum';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../client/notification/notification.service';
import { DocumentsService } from '../documents/documents.service';
import { PropertiesService } from '../properties/properties.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly notificationService: NotificationService,
    private readonly propertiesService: PropertiesService,
    private readonly documentsService: DocumentsService,
  ) {}

  /**
   * Create a new invoice with items
   */
  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    // Validate tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { tenant_id: createInvoiceDto.tenant_id, is_active: true },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${createInvoiceDto.tenant_id} not found`,
      );
    }

    // If rental_id is provided, validate it exists
    if (createInvoiceDto.rental_id) {
      const rental = await this.rentalRepository.findOne({
        where: { rental_id: createInvoiceDto.rental_id },
      });

      if (!rental) {
        throw new NotFoundException(
          `Rental with ID ${createInvoiceDto.rental_id} not found`,
        );
      }
    }

    // Calculate total amount from items
    const totalAmount = createInvoiceDto.items.reduce(
      (sum, item) => sum + item.amount * (item.quantity || 1),
      0,
    );

    // Create invoice
    const invoice = this.invoiceRepository.create({
      user_id: createInvoiceDto.landlordId || userId,
      invoice_id: `INV-${uuidv4()}`,
      total_amount: totalAmount,
      outstanding_amount: totalAmount,
      invoice_number: this.generateInvoiceNumber(),
      issue_date: createInvoiceDto.issueDate || new Date(),
      status: createInvoiceDto.status || InvoiceStatus.DRAFT,
      due_date: createInvoiceDto.dueDate,
      description: createInvoiceDto.description,
      notes: createInvoiceDto.notes,
      is_recurring: createInvoiceDto.isRecurring || false,
      recurring_frequency: createInvoiceDto.recurringFrequency,
      next_recurring_date: createInvoiceDto.nextRecurringDate,
      send_reminder: createInvoiceDto.sendReminder || false,
      tenant_id: createInvoiceDto.tenant_id,
      rental_id: createInvoiceDto.rental_id,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create invoice items
    const items = createInvoiceDto.items.map((itemDto) =>
      this.invoiceItemRepository.create({
        invoice_id: savedInvoice.invoice_id,
        quantity: itemDto.quantity || 1,
        item_id: `INVITEM-${uuidv4()}`,
        category: itemDto.category,
        description: itemDto.description,
        amount: itemDto.amount,
        existingDues: itemDto.existingDues || 0,
        existingDueDate: itemDto.existingDueDate || null,
        dueDate: itemDto.dueDate || null,
        metadata: itemDto.metadata || {},
        fixedAmount: itemDto.fixedAmount || null,
      }),
    );

    await this.invoiceItemRepository.save(items);

    // Generate PDF and upload to S3 (best-effort)
    try {
      const invoiceWithRelations = await this.findInvoiceById(
        savedInvoice.invoice_id,
      );

      // Create PDF buffer from template
      const templatePath = path.join(__dirname, '../../templates/invoice.ejs');
      const html = await ejs.renderFile(
        templatePath,
        { invoice: invoiceWithRelations },
        { async: true },
      );

      const options: any = {
        format: 'A4',
        orientation: 'portrait',
        border: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        header: {
          height: '40mm',
        },
        timeout: 30000,
      };

      const buffer = await this.documentsService.createPDF(html, options);

      // Upload PDF buffer and create document record
      const document = await this.documentsService.uploadPdfBuffer(
        buffer,
        `${savedInvoice.invoice_id}.pdf`,
        savedInvoice.property_id || null,
        'Invoice PDF',
        'invoice',
      );

      savedInvoice.notes = `${savedInvoice.notes || ''}\nInvoice PDF: ${tenant.name}`;
      savedInvoice.invoice_document_id = document.document_id;
      await this.invoiceRepository.save(savedInvoice);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn('Failed to generate/upload invoice PDF: ' + errMsg);
    }

    return this.findInvoiceById(savedInvoice.invoice_id);
  }

  /**
   * Get all invoices with pagination and filtering
   */
  async findAllInvoices(
    paginationDto: PaginationDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<PaginationResponse<Invoice>> {
    const page = paginationDto.getSafePage();
    const limit = paginationDto.getSafeLimit();
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Invoice> = {};

    // Filter based on user role
    if (userRole === UserRole.LANDLORD && userId) {
      where.user_id = userId;
    }
    // Note: For tenant filtering, we'll need a different approach since tenantId is UUID

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where,
      relations: ['items', 'payments', 'tenant', 'landlord'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: invoices,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find invoice by ID
   */
  async findInvoiceById(invoice_id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoice_id },
      relations: ['items', 'payments', 'tenant', 'rental'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoice_id} not found`);
    }

    return invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(
    invoice_id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Invoice> {
    const invoice = await this.findInvoiceById(invoice_id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && invoice.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this invoice',
      );
    }

    // Prevent updating paid invoices
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot update a paid invoice');
    }

    // If updating items, recalculate total
    if (updateInvoiceDto.items) {
      const totalAmount = updateInvoiceDto.items.reduce(
        (sum, item) => sum + item.amount * (item.quantity || 1),
        0,
      );
      updateInvoiceDto.totalAmount = totalAmount;
      updateInvoiceDto.outstandingAmount = totalAmount - invoice.paid_amount;

      // Update items
      await this.invoiceItemRepository.delete({ invoice_id: invoice_id });
      const items = updateInvoiceDto.items.map((itemDto) =>
        this.invoiceItemRepository.create({
          ...itemDto,
          invoice_id: invoice_id,
          quantity: itemDto.quantity || 1,
        }),
      );
      await this.invoiceItemRepository.save(items);
    }

    // Update invoice
    this.invoiceRepository.merge(invoice, updateInvoiceDto);
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(
    invoice_id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const invoice = await this.findInvoiceById(invoice_id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && invoice.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this invoice',
      );
    }

    // Prevent deleting invoices with payments
    if (invoice.payments && invoice.payments.length > 0) {
      throw new BadRequestException(
        'Cannot delete invoice that has payments recorded',
      );
    }

    await this.invoiceRepository.remove(invoice);
  }

  /**
   * Record payment for an invoice
   */
  async recordPayment(
    recordPaymentDto: RecordPaymentDto,
    userId: string,
  ): Promise<Payment> {
    const invoice = await this.findInvoiceById(recordPaymentDto.invoice_id);

    // Validate payment amount
    if (recordPaymentDto.amount > invoice.outstanding_amount) {
      throw new BadRequestException(
        'Payment amount cannot exceed outstanding amount',
      );
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      ...recordPaymentDto,
      payment_id: `PAY-${uuidv4()}`,
      rental_id: invoice.rental_id,
      invoice_id: invoice.invoice_id,
      recordedBy: userId,
      isLatePayment: new Date() > new Date(invoice.due_date),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice payment status
    await this.updateInvoicePaymentStatus(invoice.invoice_id);

    // Send payment notification email to landlord
    try {
      this.logger.log('🔔 Starting payment notification process...');
      this.logger.log(`Invoice ID: ${invoice.invoice_id}`);
      this.logger.log(`Payment Amount: ${recordPaymentDto.amount}`);

      // Get tenant information
      const tenant = await this.tenantRepository.findOne({
        where: { tenant_id: invoice.tenant_id },
      });

      if (!tenant) {
        this.logger.warn(`Tenant not found for invoice ${invoice.invoice_id}`);
        return savedPayment;
      }

      this.logger.log(`Tenant: ${tenant.name}`);

      // Get property and owner information
      const property = await this.propertiesService.findPropertyById(
        invoice.property_id,
        invoice.user_id,
      );

      this.logger.log(`Property: ${property.address}`);
      this.logger.log(
        `Property owner details: ${JSON.stringify(property.owner)}`,
      );

      if (property.owner && property.owner.email) {
        this.logger.log('📧 Sending payment notification email to landlord...');
        this.logger.log(`Landlord email: ${property.owner.email}`);

        await this.notificationService.sendPaymentReceivedEmail(
          property.owner.email,
          `${property.owner.firstName} ${property.owner.lastName}`,
          property.owner.user_id,
          tenant.name,
          property.address,
          recordPaymentDto.amount,
          recordPaymentDto.paymentDate instanceof Date
            ? recordPaymentDto.paymentDate.toISOString()
            : recordPaymentDto.paymentDate,
        );

        this.logger.log('✅ Payment notification email sent successfully!');
      } else {
        this.logger.warn('⚠️ No owner email found for property');
      }
    } catch (error) {
      this.logger.error('❌ Failed to send payment notification email:', error);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
    }

    return savedPayment;
  }

  /**
   * Get invoice statistics for dashboard
   */
  async getInvoiceStatistics(userId: string, userRole: UserRole): Promise<any> {
    const where: FindOptionsWhere<Invoice> = {};

    if (userRole === UserRole.LANDLORD) {
      where.user_id = userId;
    }
    // Note: Tenant filtering would need tenantId mapping from User to Tenant

    const [
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalOutstanding,
      totalPaid,
    ] = await Promise.all([
      this.invoiceRepository.count({ where }),
      this.invoiceRepository.count({
        where: { ...where, status: InvoiceStatus.PAID },
      }),
      this.invoiceRepository.count({
        where: { ...where, status: InvoiceStatus.OVERDUE },
      }),
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.outstandingAmount)', 'total')
        .where(where)
        .getRawOne(),
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.paidAmount)', 'total')
        .where(where)
        .getRawOne(),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      pendingInvoices: totalInvoices - paidInvoices,
      totalOutstanding: parseFloat(totalOutstanding?.total || '0'),
      totalPaid: parseFloat(totalPaid?.total || '0'),
    };
  }

  /**
   * Send invoice reminder
   */
  async sendInvoiceReminder(invoice_id: string, userId: string): Promise<void> {
    const invoice = await this.findInvoiceById(invoice_id);

    // Check permissions
    if (invoice.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to send reminder for this invoice',
      );
    }

    // TODO: Implement email/notification service
    // For now, just update the lastReminderSent date
    invoice.last_reminder_sent = new Date();
    await this.invoiceRepository.save(invoice);
  }

  /**
   * Get available tenants for invoice creation
   */
  async getAvailableTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { is_active: true },
      select: ['tenant_id', 'name', 'phone_number', 'email', 'rent_amount'],
    });
  }

  /**
   * Get tenant rentals for invoice creation
   */
  async getTenantRentals(tenant_id: string): Promise<any> {
    const tenant = await this.tenantRepository.findOne({
      where: { tenant_id, is_active: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenant_id} not found`);
    }

    // Return tenant information since there might not be a direct rental relationship
    return {
      tenant,
      message: 'Tenant found. You can create invoices for this tenant.',
    };
  }

  /**
   * Private helper methods
   */
  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }

  private async updateInvoicePaymentStatus(invoice_id: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoice_id },
      relations: ['payments'],
    });

    if (!invoice) return;

    const totalPaid =
      invoice.payments?.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      ) || 0;

    invoice.paid_amount = totalPaid;
    invoice.outstanding_amount = invoice.total_amount - totalPaid;

    // Update status
    if (totalPaid >= invoice.total_amount) {
      invoice.status = InvoiceStatus.PAID;
    } else if (totalPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    } else if (new Date() > new Date(invoice.due_date)) {
      invoice.status = InvoiceStatus.OVERDUE;
    }

    await this.invoiceRepository.save(invoice);
  }

  /**
   * Get tenant invoice data for the "Add Invoice" screen
   * This includes tenant info, pending items from previous invoices, and rental details
   */
  async getTenantInvoiceData(tenant_id: string) {
    // Validate tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { tenant_id, is_active: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Get all previous invoices for this tenant (unpaid and partially paid)
    const previousInvoices = await this.invoiceRepository.find({
      where: [
        { tenant_id, status: InvoiceStatus.SENT },
        { tenant_id, status: InvoiceStatus.PARTIALLY_PAID },
        { tenant_id, status: InvoiceStatus.OVERDUE },
      ],
      relations: ['items', 'payments'],
      order: { createdAt: 'DESC' },
    });

    // Extract pending items from previous invoices
    const pendingItems: any[] = [];
    let totalPendingAmount = 0;

    previousInvoices.forEach((invoice) => {
      const invoiceOutstanding = invoice.total_amount - invoice.paid_amount;

      if (invoiceOutstanding > 0) {
        invoice.items.forEach((item) => {
          // Calculate what portion of this item is still unpaid
          const itemPaidRatio = invoice.paid_amount / invoice.total_amount;
          const itemPendingAmount = item.amount * (1 - itemPaidRatio);

          if (itemPendingAmount > 0) {
            pendingItems.push({
              originalInvoiceId: invoice.invoice_id,
              originalInvoiceNumber: invoice.invoice_number,
              originalDueDate: invoice.due_date,
              itemId: item.item_id,
              category: item.category,
              description: item.description,
              originalAmount: item.amount,
              pendingAmount: Math.round(itemPendingAmount * 100) / 100,
              existingDues: item.existingDues,
              existingDueDate: item.existingDueDate,
              dueDate: item.dueDate,
              isFixed: item.isFixed,
              daysSinceOriginalDue: Math.floor(
                (new Date().getTime() - new Date(invoice.due_date).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            });

            totalPendingAmount += itemPendingAmount;
          }
        });
      }
    });

    // Get suggested recurring items
    const suggestedItems = [
      {
        category: 'RENT',
        description: `Monthly rent for ${new Date().toLocaleDateString(
          'en-US',
          {
            month: 'long',
            year: 'numeric',
          },
        )}`,
        amount: tenant.rent_amount || 1500,
        isFixed: true,
        dueDate: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          5,
        ),
      },
      {
        category: 'MAINTENANCE',
        description: 'Monthly maintenance charges',
        amount: 200,
        isFixed: true,
        dueDate: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          5,
        ),
      },
    ];

    // Calculate tenant's payment history summary
    const paymentHistory = await this.paymentRepository.find({
      where: { payment_tenant_id: tenant.tenant_id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const paymentSummary = {
      totalPayments: paymentHistory.length,
      totalAmountPaid: paymentHistory.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      ),
      lastPaymentDate: paymentHistory[0]?.createdAt || null,
      lastPaymentAmount: paymentHistory[0]?.amount || 0,
      averagePaymentAmount:
        paymentHistory.length > 0
          ? Math.round(
              (paymentHistory.reduce(
                (sum, payment) => sum + Number(payment.amount),
                0,
              ) /
                paymentHistory.length) *
                100,
            ) / 100
          : 0,
    };

    return {
      tenant: {
        tenant_id: tenant.tenant_id,
        name: tenant.name,
        phone_number: tenant.phone_number,
        email: tenant.email,
        tenant_type: tenant.tenant_type,
        property_id: tenant.property_id,
        rent_amount: tenant.rent_amount,
        has_dues: tenant.has_dues,
        due_amount: tenant.due_amount,
        is_active: tenant.is_active,
        check_in_date: tenant.check_in_date,
      },
      pendingItems: {
        items: pendingItems,
        totalCount: pendingItems.length,
        totalPendingAmount: Math.round(totalPendingAmount * 100) / 100,
        invoicesCount: previousInvoices.length,
      },
      suggestedItems,
      paymentHistory: {
        summary: paymentSummary,
        recentPayments: paymentHistory.map((payment) => ({
          payment_id: payment.payment_id,
          amount: payment.amount,
          paymentDate: payment.createdAt,
          paymentMethod: payment.paymentMethod,
          transactionId: payment.transactionId,
        })),
      },
      invoiceGeneration: {
        nextInvoiceNumber: this.generateInvoiceNumber(),
        suggestedDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        defaultIssueDate: new Date(),
      },
    };
  }
}
