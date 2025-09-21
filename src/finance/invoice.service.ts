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
  ) {}

  /**
   * Create a new invoice with items
   */
  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    userId: number,
  ): Promise<Invoice> {
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
    } else if (userRole === UserRole.TENANT && userId) {
      where.tenantId = userId;
    }

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
    } else if (userRole === UserRole.TENANT) {
      where.tenantId = userId;
    }

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
}
