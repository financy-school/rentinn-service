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
  Request,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  create(@Body() createKycDto: CreateKycDto) {
    return this.kycService.create(createKycDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LANDLORD)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.kycService.findAll(paginationDto);
  }

  @Get('tenant/:tenant_id')
  @UseGuards(JwtAuthGuard)
  findByTenant(
    @Param('tenant_id') tenant_id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.kycService.findByTenant(tenant_id, paginationDto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LANDLORD)
  findPending(@Query() paginationDto: PaginationDto) {
    return this.kycService.findPendingVerifications(paginationDto);
  }

  @Get(':kyc_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findOne(@Param('kyc_id') kyc_id: string) {
    return this.kycService.findOne(kyc_id);
  }

  @Patch(':kyc_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  update(
    @Param('kyc_id') kyc_id: string,
    @Body() updateKycDto: UpdateKycDto,
    @Request() req: any,
  ) {
    return this.kycService.verify(
      kyc_id,
      req.user.user_id,
      updateKycDto.status,
      updateKycDto.verificationNotes,
    );
  }

  @Delete(':kyc_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async remove(@Param('kyc_id') kyc_id: string) {
    return this.kycService.remove(kyc_id);
  }
}
