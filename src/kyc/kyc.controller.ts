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
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  create(
    @Body() createKycDto: CreateKycDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.create(createKycDto, user_id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LANDLORD)
  findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.findAll(paginationDto, user_id);
  }

  @Get('tenant/:tenant_id')
  @UseGuards(JwtAuthGuard)
  findByTenant(
    @Param('tenant_id') tenant_id: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.findByTenant(tenant_id, paginationDto, user_id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LANDLORD)
  findPending(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.findPendingVerifications(paginationDto, user_id);
  }

  @Get(':kyc_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findOne(
    @Param('kyc_id') kyc_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.findOne(kyc_id, user_id);
  }

  @Patch(':kyc_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  update(
    @Param('kyc_id') kyc_id: string,
    @Body() updateKycDto: UpdateKycDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.verify(
      kyc_id,
      user_id,
      updateKycDto.status,
      updateKycDto.verificationNotes,
    );
  }

  @Delete(':kyc_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async remove(
    @Param('kyc_id') kyc_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.remove(kyc_id, user_id);
  }

  @Post(':kyc_id/approve')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async approve(
    @Param('kyc_id') kyc_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.kycService.approveKyc(kyc_id, user_id);
  }

  @Get('tenant/:tenant_id/link')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getKycLink(
    @Param('tenant_id') tenant_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    const token = await this.kycService.getKycLink(tenant_id, user_id);
    return {
      success: true,
      token,
      link: `${process.env.WEB_APP_URL || 'http://localhost:3000'}/kyc/${token}`,
    };
  }
}
