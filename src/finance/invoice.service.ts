import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class InvoiceService {
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
  ) {}

  /**
   * Create a new invoice with items
   */
  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    userId: number,
  ): Promise<Invoice> {
    // Validate tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: createInvoiceDto.tenantId, is_active: true },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${createInvoiceDto.tenantId} not found`,
      );
    }

    // If rentalId is provided, validate it exists
    if (createInvoiceDto.rentalId) {
      const rental = await this.rentalRepository.findOne({
        where: { id: createInvoiceDto.rentalId },
      });

      if (!rental) {
        throw new NotFoundException(
          `Rental with ID ${createInvoiceDto.rentalId} not found`,
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
      ...createInvoiceDto,
      landlordId: createInvoiceDto.landlordId || userId,
      totalAmount,
      outstandingAmount: totalAmount,
      invoiceNumber: this.generateInvoiceNumber(),
      issueDate: createInvoiceDto.issueDate || new Date(),
      status: createInvoiceDto.status || InvoiceStatus.DRAFT,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create invoice items
    const items = createInvoiceDto.items.map((itemDto) =>
      this.invoiceItemRepository.create({
        ...itemDto,
        invoiceId: savedInvoice.id,
        quantity: itemDto.quantity || 1,
      }),
    );

    await this.invoiceItemRepository.save(items);

    return this.findInvoiceById(savedInvoice.id);
  }

  /**
   * Get all invoices with pagination and filtering
   */
  async findAllInvoices(
    paginationDto: PaginationDto,
    userId?: number,
    userRole?: UserRole,
  ): Promise<PaginationResponse<Invoice>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Invoice> = {};

    // Filter based on user role
    if (userRole === UserRole.LANDLORD && userId) {
      where.landlordId = userId;
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
  async findInvoiceById(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items', 'payments', 'tenant', 'landlord', 'rental'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: number,
    userRole: UserRole,
  ): Promise<Invoice> {
    const invoice = await this.findInvoiceById(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && invoice.landlordId !== userId) {
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
      updateInvoiceDto.outstandingAmount = totalAmount - invoice.paidAmount;

      // Update items
      await this.invoiceItemRepository.delete({ invoiceId: id });
      const items = updateInvoiceDto.items.map((itemDto) =>
        this.invoiceItemRepository.create({
          ...itemDto,
          invoiceId: id,
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
    id: number,
    userId: number,
    userRole: UserRole,
  ): Promise<void> {
    const invoice = await this.findInvoiceById(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && invoice.landlordId !== userId) {
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
    userId: number,
  ): Promise<Payment> {
    const invoice = await this.findInvoiceById(recordPaymentDto.invoiceId);

    // Validate payment amount
    if (recordPaymentDto.amount > invoice.outstandingAmount) {
      throw new BadRequestException(
        'Payment amount cannot exceed outstanding amount',
      );
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      ...recordPaymentDto,
      rentalId: invoice.rentalId,
      invoiceId: invoice.id,
      recordedBy: userId,
      isLatePayment: new Date() > new Date(invoice.dueDate),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice payment status
    await this.updateInvoicePaymentStatus(invoice.id);

    return savedPayment;
  }

  /**
   * Get invoice statistics for dashboard
   */
  async getInvoiceStatistics(userId: number, userRole: UserRole): Promise<any> {
    const where: FindOptionsWhere<Invoice> = {};

    if (userRole === UserRole.LANDLORD) {
      where.landlordId = userId;
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
  async sendInvoiceReminder(id: number, userId: number): Promise<void> {
    const invoice = await this.findInvoiceById(id);

    // Check permissions
    if (invoice.landlordId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to send reminder for this invoice',
      );
    }

    // TODO: Implement email/notification service
    // For now, just update the lastReminderSent date
    invoice.lastReminderSent = new Date();
    await this.invoiceRepository.save(invoice);
  }

  /**
   * Get available tenants for invoice creation
   */
  async getAvailableTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { is_active: true },
      select: ['id', 'name', 'phone_number', 'email', 'rent_amount'],
    });
  }

  /**
   * Get tenant rentals for invoice creation
   */
  async getTenantRentals(tenantId: string): Promise<any> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId, is_active: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
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

  private async updateInvoicePaymentStatus(invoiceId: number): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['payments'],
    });

    if (!invoice) return;

    const totalPaid =
      invoice.payments?.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      ) || 0;

    invoice.paidAmount = totalPaid;
    invoice.outstandingAmount = invoice.totalAmount - totalPaid;

    // Update status
    if (totalPaid >= invoice.totalAmount) {
      invoice.status = InvoiceStatus.PAID;
    } else if (totalPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    } else if (new Date() > new Date(invoice.dueDate)) {
      invoice.status = InvoiceStatus.OVERDUE;
    }

    await this.invoiceRepository.save(invoice);
  }

  /**
   * Get tenant invoice data for the "Add Invoice" screen
   * This includes tenant info, pending items from previous invoices, and rental details
   */
  async getTenantInvoiceData(tenantId: string) {
    // Validate tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId, is_active: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Get all previous invoices for this tenant (unpaid and partially paid)
    const previousInvoices = await this.invoiceRepository.find({
      where: [
        { tenantId, status: InvoiceStatus.SENT },
        { tenantId, status: InvoiceStatus.PARTIALLY_PAID },
        { tenantId, status: InvoiceStatus.OVERDUE },
      ],
      relations: ['items', 'payments'],
      order: { createdAt: 'DESC' },
    });

    // Extract pending items from previous invoices
    const pendingItems: any[] = [];
    let totalPendingAmount = 0;

    previousInvoices.forEach((invoice) => {
      const invoiceOutstanding = invoice.totalAmount - invoice.paidAmount;

      if (invoiceOutstanding > 0) {
        invoice.items.forEach((item) => {
          // Calculate what portion of this item is still unpaid
          const itemPaidRatio = invoice.paidAmount / invoice.totalAmount;
          const itemPendingAmount = item.amount * (1 - itemPaidRatio);

          if (itemPendingAmount > 0) {
            pendingItems.push({
              originalInvoiceId: invoice.id,
              originalInvoiceNumber: invoice.invoiceNumber,
              originalDueDate: invoice.dueDate,
              itemId: item.id,
              category: item.category,
              description: item.description,
              originalAmount: item.amount,
              pendingAmount: Math.round(itemPendingAmount * 100) / 100,
              existingDues: item.existingDues,
              existingDueDate: item.existingDueDate,
              dueDate: item.dueDate,
              isFixed: item.isFixed,
              daysSinceOriginalDue: Math.floor(
                (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
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
      where: { paymentTenantId: tenantId },
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
        id: tenant.id,
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
          id: payment.id,
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
