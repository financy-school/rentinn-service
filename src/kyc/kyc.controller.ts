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
  ParseIntPipe,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { KycStatus } from '../common/enums/kyc-status.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createKycDto: CreateKycDto) {
    return this.kycService.create(req.user.id, createKycDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LANDLORD)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.kycService.findAll(paginationDto);
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  findByUser(
    @Param('id', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
    @Request() req: any,
  ) {
    // Users can only view their own KYC documents unless they're admin or landlord
    if (
      req.user.id !== userId &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.LANDLORD
    ) {
      throw new ForbiddenException(
        'You do not have permission to view these KYC documents',
      );
    }

    return this.kycService.findByUser(userId, paginationDto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LANDLORD)
  findPendingVerifications(@Query() paginationDto: PaginationDto) {
    return this.kycService.findPendingVerifications(paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const kyc = await this.kycService.findOne(id);

    // Users can only view their own KYC documents unless they're admin or landlord
    if (
      req.user.id !== kyc.userId &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.LANDLORD
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this KYC document',
      );
    }

    return kyc;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKycDto: UpdateKycDto,
    @Request() req: any,
  ) {
    const kyc = await this.kycService.findOne(id);

    // Only document owner can update basic info, admins/landlords can update status
    if (
      req.user.id !== kyc.userId &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.LANDLORD
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this KYC document',
      );
    }

    // Regular users cannot change status
    if (req.user.role === UserRole.TENANT && updateKycDto.status) {
      throw new ForbiddenException(
        'You do not have permission to change document status',
      );
    }

    // If admin/landlord is verifying, record who verified
    if (
      updateKycDto.status === KycStatus.VERIFIED ||
      updateKycDto.status === KycStatus.REJECTED
    ) {
      return this.kycService.verify(
        id,
        req.user.id,
        updateKycDto.status,
        updateKycDto.verificationNotes,
      );
    }

    return this.kycService.update(id, updateKycDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const kyc = await this.kycService.findOne(id);

    // Only document owner or admin can delete
    if (req.user.id !== kyc.userId && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this KYC document',
      );
    }

    // Cannot delete verified documents unless admin
    if (kyc.status === KycStatus.VERIFIED && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Verified documents cannot be deleted');
    }

    return this.kycService.remove(id);
  }
}
