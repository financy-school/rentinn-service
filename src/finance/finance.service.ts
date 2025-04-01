import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';
import { Finance } from './entities/finance.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
  ) {}

  // Add a new finance record
  async create(createFinanceDto: CreateFinanceDto): Promise<Finance> {
    const finance = this.financeRepository.create(createFinanceDto);
    return await this.financeRepository.save(finance);
  }

  // Get all finance records
  async findAll(): Promise<Finance[]> {
    return await this.financeRepository.find();
  }

  // Get finance details for a specific property
  async findByProperty(propertyId: string): Promise<Finance[]> {
    return await this.financeRepository.find({
      where: { property_id: propertyId },
    });
  }

  // Get a single finance record by ID
  async findOne(id: string): Promise<Finance> {
    const finance = await this.financeRepository.findOne({ where: { id } });
    if (!finance) {
      throw new NotFoundException(`Finance record with ID ${id} not found`);
    }
    return finance;
  }

  // Update a finance record
  async update(
    id: string,
    updateFinanceDto: UpdateFinanceDto,
  ): Promise<Finance> {
    const finance = await this.findOne(id);
    const updatedFinance = Object.assign(finance, updateFinanceDto);
    return await this.financeRepository.save(updatedFinance);
  }

  // Delete a finance record
  async remove(id: string): Promise<void> {
    const finance = await this.findOne(id);
    await this.financeRepository.remove(finance);
  }
}
