import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = new Ticket();

    ticket.id = new Date().getTime().toString();
    ticket.issue = createTicketDto.issue;
    ticket.description = createTicketDto.description;
    ticket.raisedBy = createTicketDto.raisedBy;
    ticket.status = createTicketDto.status;
    ticket.roomId = createTicketDto.roomId;
    ticket.propertyId = createTicketDto.propertyId;
    ticket.image_document_id_list = createTicketDto.image_document_id_list;

    return this.ticketRepository.save(ticket);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ items: Ticket[]; meta: any }> {
    const { propertyId, page = 1, limit = 10 } = paginationDto;

    const [items, total] = await this.ticketRepository.findAndCount({
      where: { propertyId: propertyId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    Object.assign(ticket, updateTicketDto);
    return this.ticketRepository.save(ticket);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }
}
