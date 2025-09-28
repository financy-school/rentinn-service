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

  async create(
    createTicketDto: CreateTicketDto,
    user_id: string,
  ): Promise<Ticket> {
    const ticket = new Ticket();

    ticket.ticket_id = new Date().getTime().toString();
    ticket.issue = createTicketDto.issue;
    ticket.description = createTicketDto.description;
    ticket.raisedBy = createTicketDto.raisedBy;
    ticket.status = createTicketDto.status;
    ticket.room_id = createTicketDto.room_id;
    ticket.property_id = createTicketDto.property_id;
    ticket.image_document_id_list = createTicketDto.image_document_id_list;
    ticket.user_id = user_id;

    return this.ticketRepository.save(ticket);
  }

  async findAll(
    paginationDto: PaginationDto,
    user_id: string,
  ): Promise<{ items: Ticket[]; meta: any }> {
    const { property_id, page = 1, limit = 10 } = paginationDto;

    const where: any = { user_id };

    // Only filter by property_id if it's provided and not 'all'
    if (property_id && property_id !== 'all') {
      where.property_id = property_id;
    }

    const [items, total] = await this.ticketRepository.findAndCount({
      where,
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

  async findOne(ticket_id: string, user_id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticket_id, user_id },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticket_id} not found`);
    }
    return ticket;
  }

  async update(
    ticket_id: string,
    updateTicketDto: UpdateTicketDto,
    user_id: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticket_id, user_id);
    Object.assign(ticket, updateTicketDto);
    return this.ticketRepository.save(ticket);
  }

  async remove(ticket_id: string, user_id: string): Promise<void> {
    const ticket = await this.findOne(ticket_id, user_id);
    await this.ticketRepository.remove(ticket);
  }
}
