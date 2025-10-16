import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
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
} from './dto/expense-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ============= EXPENSE ENDPOINTS =============

  @Post()
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async create(@Body() createExpenseDto: CreateExpenseDto, @Req() req: any) {
    return await this.expensesService.create(
      createExpenseDto,
      req.user.user_id,
    );
  }

  @Get()
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async findAll(@Query() query: ExpenseQueryDto, @Req() req: any) {
    return await this.expensesService.findAll(query, req.user.user_id);
  }

  @Get('analytics')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getAnalytics(
    @Query() query: ExpenseAnalyticsQueryDto,
    @Req() req: any,
  ) {
    return await this.expensesService.getAnalytics(query, req.user.user_id);
  }

  @Get(':id')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async findOne(@Param('id') id: string, @Req() req: any) {
    return await this.expensesService.findOne(id, req.user.user_id);
  }

  @Patch(':id')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Req() req: any,
  ) {
    return await this.expensesService.update(
      id,
      updateExpenseDto,
      req.user.user_id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.expensesService.remove(id, req.user.user_id);
    return { message: 'Expense deleted successfully' };
  }

  // ============= PAYMENT ENDPOINTS =============

  @Post(':id/payments')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async addPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreateExpensePaymentDto,
    @Req() req: any,
  ) {
    return await this.expensesService.addPayment(
      id,
      createPaymentDto,
      req.user.user_id,
    );
  }

  @Get(':id/payments')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getPayments(@Param('id') id: string, @Req() req: any) {
    return await this.expensesService.getPayments(id, req.user.user_id);
  }

  // ============= CATEGORY ENDPOINTS =============

  @Post('categories')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async createCategory(@Body() createCategoryDto: CreateExpenseCategoryDto) {
    return await this.expensesService.createCategory(createCategoryDto);
  }

  @Get('categories/list')
  async findAllCategories() {
    return await this.expensesService.findAllCategories();
  }

  @Patch('categories/:id')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateExpenseCategoryDto,
  ) {
    return await this.expensesService.updateCategory(id, updateCategoryDto);
  }
}
