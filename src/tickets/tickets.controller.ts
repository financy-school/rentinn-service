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
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Create a new ticket
  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.ticketsService.create(createTicketDto, user_id);
  }

  // Get all tickets
  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.ticketsService.findAll(paginationDto, user_id);
  }

  // Get a ticket by ID
  @Get(':ticket_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findOne(
    @Param('ticket_id') ticket_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.ticketsService.findOne(ticket_id, user_id);
  }

  // Update a ticket by ID
  @Patch(':ticket_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  update(
    @Param('ticket_id') ticket_id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.ticketsService.update(ticket_id, updateTicketDto, user_id);
  }

  // Delete a ticket by ID
  @Delete(':ticket_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  remove(
    @Param('ticket_id') ticket_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.ticketsService.remove(ticket_id, user_id);
  }
}
