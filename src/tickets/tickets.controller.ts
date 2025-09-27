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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Create a new ticket
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  // Get all tickets
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ticketsService.findAll(paginationDto);
  }

  // Get a ticket by ID
  @Get(':ticket_id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('ticket_id') ticket_id: string) {
    return this.ticketsService.findOne(ticket_id);
  }

  // Update a ticket by ID
  @Patch(':ticket_id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('ticket_id') ticket_id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(ticket_id, updateTicketDto);
  }

  // Delete a ticket by ID
  @Delete(':ticket_id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('ticket_id') ticket_id: string) {
    return this.ticketsService.remove(ticket_id);
  }
}
