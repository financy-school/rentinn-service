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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

import { User } from './entities/user.entity';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LANDLORD)
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(paginationDto, role);
  }

  @Get(':user_id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('user_id') user_id: string) {
    return this.usersService.findOne(user_id);
  }

  @Patch(':user_id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('user_id') user_id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user_id, updateUserDto);
  }

  @Delete(':user_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('user_id') user_id: string) {
    return this.usersService.remove(user_id);
  }

  @Get('landlord/:user_id/tenants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findTenants(
    @Param('user_id') landlord_user_id: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponse<User>> {
    return this.usersService.findTenants(landlord_user_id, paginationDto);
  }
}
