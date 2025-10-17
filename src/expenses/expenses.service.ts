import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from './entities/expense.entity';
import { ExpensePayment } from './entities/expense-payment.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  CreateExpensePaymentDto,
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './dto/expense.dto';
import {
  ExpenseQueryDto,
  ExpenseAnalyticsQueryDto,
  ExpenseAnalyticsResponseDto,
} from './dto/expense-query.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(ExpensePayment)
    private readonly paymentRepository: Repository<ExpensePayment>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepository: Repository<ExpenseCategory>,
  ) {}

  // ============= EXPENSE CRUD =============

  async create(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const expense = this.expenseRepository.create({
      expense_id: `EXP-${uuidv4()}`,
      ...createExpenseDto,
      user_id: userId,
      outstanding_amount: createExpenseDto.amount,
      recorded_by: userId,
    });

    return await this.expenseRepository.save(expense);
  }

  async findAll(query: ExpenseQueryDto, userId: string): Promise<Expense[]> {
    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.property', 'property')
      .leftJoinAndSelect('expense.payments', 'payments')
      .where('expense.user_id = :userId', { userId });

    // Filter by property
    if (query.property_id) {
      queryBuilder.andWhere('expense.property_id = :propertyId', {
        propertyId: query.property_id,
      });
    }

    // Filter by category
    if (query.category_id) {
      queryBuilder.andWhere('expense.category_id = :categoryId', {
        categoryId: query.category_id,
      });
    }

    // Filter by status
    if (query.status) {
      queryBuilder.andWhere('expense.status = :status', {
        status: query.status,
      });
    }

    // Filter by priority
    if (query.priority) {
      queryBuilder.andWhere('expense.priority = :priority', {
        priority: query.priority,
      });
    }

    // Filter by date range
    if (query.start_date && query.end_date) {
      queryBuilder.andWhere(
        'expense.expense_date BETWEEN :startDate AND :endDate',
        {
          startDate: query.start_date,
          endDate: query.end_date,
        },
      );
    }

    // Search
    if (query.search) {
      queryBuilder.andWhere(
        '(expense.title LIKE :search OR expense.description LIKE :search OR expense.vendor_name LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Sorting
    const sortField =
      query.sort_by === 'date'
        ? 'expense.expense_date'
        : query.sort_by === 'due_date'
          ? 'expense.due_date'
          : query.sort_by === 'amount'
            ? 'expense.amount'
            : query.sort_by === 'status'
              ? 'expense.status'
              : 'expense.priority';

    queryBuilder.orderBy(
      sortField,
      query.sort_order?.toUpperCase() as 'ASC' | 'DESC',
    );

    return await queryBuilder.getMany();
  }

  async findOne(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { expense_id: id, user_id: userId },
      relations: ['category', 'property', 'payments'],
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const expense = await this.findOne(id, userId);

    // Recalculate outstanding amount if amount changes
    if (updateExpenseDto.amount !== undefined) {
      const paidAmount = expense.paid_amount || 0;
      expense.outstanding_amount = updateExpenseDto.amount - paidAmount;
    }

    Object.assign(expense, updateExpenseDto);

    // Auto-update status based on payment
    if (expense.outstanding_amount === 0) {
      expense.status = ExpenseStatus.PAID;
    } else if (
      expense.outstanding_amount < expense.amount &&
      expense.outstanding_amount > 0
    ) {
      expense.status = ExpenseStatus.PARTIALLY_PAID;
    }

    return await this.expenseRepository.save(expense);
  }

  async remove(id: string, userId: string): Promise<void> {
    const expense = await this.findOne(id, userId);
    await this.expenseRepository.remove(expense);
  }

  // ============= PAYMENT MANAGEMENT =============

  async addPayment(
    expenseId: string,
    createPaymentDto: CreateExpensePaymentDto,
    userId: string,
  ): Promise<ExpensePayment> {
    const expense = await this.findOne(expenseId, userId);

    if (createPaymentDto.amount > expense.outstanding_amount) {
      throw new BadRequestException(
        'Payment amount cannot exceed outstanding amount',
      );
    }

    const payment = this.paymentRepository.create({
      payment_id: `PAY-EXP-${uuidv4()}`,
      ...createPaymentDto,
      expense_id: expenseId,
      recorded_by: userId,
    });

    await this.paymentRepository.save(payment);

    // Update expense amounts and status
    expense.paid_amount += createPaymentDto.amount;
    expense.outstanding_amount -= createPaymentDto.amount;
    // Determine new status
    let newStatus: ExpenseStatus;
    let paymentDate: Date | null = null;

    if (expense.outstanding_amount === 0) {
      newStatus = ExpenseStatus.PAID;
      paymentDate = new Date(createPaymentDto.payment_date);
    } else {
      newStatus = ExpenseStatus.PARTIALLY_PAID;
    }

    // Update expense using query builder to avoid cascade issues
    const updateData: any = {
      paid_amount: expense.paid_amount,
      outstanding_amount: expense.outstanding_amount,
      status: newStatus,
    };

    if (paymentDate) {
      updateData.payment_date = paymentDate;
    }

    await this.expenseRepository.update({ expense_id: expenseId }, updateData);

    return payment;
  }

  async getPayments(
    expenseId: string,
    userId: string,
  ): Promise<ExpensePayment[]> {
    await this.findOne(expenseId, userId);

    return await this.paymentRepository.find({
      where: { expense_id: expenseId },
      order: { payment_date: 'DESC' },
    });
  }

  // ============= CATEGORY MANAGEMENT =============

  async createCategory(
    createCategoryDto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategory> {
    const category = this.categoryRepository.create({
      category_id: `CAT-${uuidv4()}`,
      ...createCategoryDto,
    });

    return await this.categoryRepository.save(category);
  }

  async findAllCategories(): Promise<ExpenseCategory[]> {
    return await this.categoryRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategory> {
    const category = await this.categoryRepository.findOne({
      where: { category_id: id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  // ============= ANALYTICS & REPORTING =============

  async getAnalytics(
    query: ExpenseAnalyticsQueryDto,
    userId: string,
  ): Promise<ExpenseAnalyticsResponseDto> {
    const now = new Date();
    const startDate = query.start_date
      ? new Date(query.start_date)
      : new Date(now.getFullYear(), 0, 1);
    const endDate = query.end_date ? new Date(query.end_date) : now;

    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.expense_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (query.property_id) {
      queryBuilder.andWhere('expense.property_id = :propertyId', {
        propertyId: query.property_id,
      });
    }

    const expenses = await queryBuilder.getMany();

    // Calculate summary
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );
    const paidAmount = expenses.reduce(
      (sum, exp) => sum + Number(exp.paid_amount),
      0,
    );
    const outstandingAmount = expenses.reduce(
      (sum, exp) => sum + Number(exp.outstanding_amount),
      0,
    );
    const pendingCount = expenses.filter(
      (exp) => exp.status === ExpenseStatus.PENDING,
    ).length;
    const overdueCount = expenses.filter(
      (exp) => exp.status === ExpenseStatus.OVERDUE,
    ).length;

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthExpenses = expenses
      .filter((exp) => new Date(exp.expense_date) >= thisMonthStart)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    const averageExpense =
      expenses.length > 0 ? totalExpenses / expenses.length : 0;

    // By category
    const categoryMap = new Map();
    expenses.forEach((exp) => {
      const catName = exp.category?.name || 'Uncategorized';
      const current = categoryMap.get(catName) || {
        category_id: exp.category_id,
        category_name: catName,
        total_amount: 0,
        expense_count: 0,
      };
      current.total_amount += Number(exp.amount);
      current.expense_count += 1;
      categoryMap.set(catName, current);
    });

    const by_category = Array.from(categoryMap.values())
      .map((cat) => ({
        ...cat,
        percentage:
          totalExpenses > 0 ? (cat.total_amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    // By month
    const monthMap = new Map();
    expenses.forEach((exp) => {
      const date = new Date(exp.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(monthKey) || {
        month: monthKey,
        total: 0,
        paid: 0,
        pending: 0,
      };
      current.total += Number(exp.amount);
      if (exp.status === ExpenseStatus.PAID) {
        current.paid += Number(exp.amount);
      } else {
        current.pending += Number(exp.amount);
      }
      monthMap.set(monthKey, current);
    });

    const by_month = Array.from(monthMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    // Top vendors
    const vendorMap = new Map();
    expenses
      .filter((exp) => exp.vendor_name)
      .forEach((exp) => {
        const current = vendorMap.get(exp.vendor_name) || {
          vendor_name: exp.vendor_name,
          total_amount: 0,
          expense_count: 0,
        };
        current.total_amount += Number(exp.amount);
        current.expense_count += 1;
        vendorMap.set(exp.vendor_name, current);
      });

    const top_vendors = Array.from(vendorMap.values())
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    // Upcoming dues
    const upcomingDues = expenses
      .filter(
        (exp) =>
          exp.due_date &&
          new Date(exp.due_date) >= now &&
          exp.status !== ExpenseStatus.PAID &&
          exp.status !== ExpenseStatus.CANCELLED,
      )
      .map((exp) => ({
        expense_id: exp.expense_id,
        title: exp.title,
        amount: exp.outstanding_amount,
        due_date: exp.due_date,
        vendor_name: exp.vendor_name,
        priority: exp.priority,
      }))
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      )
      .slice(0, 10);

    return {
      summary: {
        total_expenses: Math.round(totalExpenses),
        paid_amount: Math.round(paidAmount),
        outstanding_amount: Math.round(outstandingAmount),
        pending_count: pendingCount,
        overdue_count: overdueCount,
        this_month_expenses: Math.round(thisMonthExpenses),
        average_expense: Math.round(averageExpense),
      },
      by_category,
      by_month,
      top_vendors,
      upcoming_dues: upcomingDues,
    };
  }

  // ============= UTILITY METHODS =============

  async updateOverdueExpenses(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.expenseRepository
      .createQueryBuilder()
      .update(Expense)
      .set({ status: ExpenseStatus.OVERDUE })
      .where('due_date < :today', { today })
      .andWhere('status IN (:...statuses)', {
        statuses: [ExpenseStatus.PENDING, ExpenseStatus.PARTIALLY_PAID],
      })
      .execute();
  }

  async initializeDefaultCategories(): Promise<void> {
    const defaultCategories = [
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Maintenance & Repairs',
        description: 'Property maintenance and repair expenses',
        icon: 'wrench',
        color: '#FF9800',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Utilities',
        description: 'Electricity, water, gas, internet',
        icon: 'flash',
        color: '#2196F3',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Property Tax',
        description: 'Property tax payments',
        icon: 'receipt',
        color: '#F44336',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Insurance',
        description: 'Property insurance premiums',
        icon: 'shield-check',
        color: '#4CAF50',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Cleaning & Housekeeping',
        description: 'Cleaning services and supplies',
        icon: 'broom',
        color: '#9C27B0',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Security',
        description: 'Security services and equipment',
        icon: 'security',
        color: '#795548',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Landscaping',
        description: 'Garden maintenance and landscaping',
        icon: 'tree',
        color: '#8BC34A',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Furniture & Equipment',
        description: 'Furniture and equipment purchases',
        icon: 'chair',
        color: '#607D8B',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Legal & Professional Fees',
        description: 'Legal, accounting, and professional services',
        icon: 'briefcase',
        color: '#3F51B5',
        is_system_defined: true,
      },
      {
        category_id: `CAT-${uuidv4()}`,
        name: 'Other',
        description: 'Miscellaneous expenses',
        icon: 'dots-horizontal',
        color: '#9E9E9E',
        is_system_defined: true,
      },
    ];

    for (const category of defaultCategories) {
      const exists = await this.categoryRepository.findOne({
        where: { name: category.name },
      });
      if (!exists) {
        await this.categoryRepository.save(category);
      }
    }
  }
}
