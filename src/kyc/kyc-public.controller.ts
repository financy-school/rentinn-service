import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { KycService } from './kyc.service';

/**
 * Public KYC Controller (no authentication required)
 * Used for tenant self-service KYC completion via token
 */
@Controller('public/kyc')
export class KycPublicController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Get KYC details by token
   */
  @Get(':token')
  async getByToken(@Param('token') token: string) {
    try {
      const kyc = await this.kycService.findByToken(token);

      // Don't expose sensitive information
      return {
        success: true,
        data: {
          tenant: {
            id: kyc.tenant.tenant_id,
            name: kyc.tenant.name,
            email: kyc.tenant.email,
            phone: kyc.tenant.phone_number,
          },
          landlord: {
            id: kyc.user_id,
            // We'll need to fetch landlord details if needed
            name: 'Landlord',
            email: '',
            phone: '',
          },
          room: kyc.tenant.room
            ? {
                number: kyc.tenant.room.room_id,
                name: kyc.tenant.room.name,
                address: '',
              }
            : null,
          status: kyc.status,
          createdAt: kyc.createdAt,
          expiresAt: kyc.token_expires_at,
          documentVerified:
            String(kyc.status) === 'VERIFIED' ||
            String(kyc.status) === 'IN_REVIEW',
          agreementSigned: kyc.agreement_signed,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }

  /**
   * Handle KYC actions (document verification, agreement signing, etc.)
   */
  @Post(':token')
  async handleAction(
    @Param('token') token: string,
    @Body() body: { action: string; data: any },
  ) {
    const { action, data } = body;

    try {
      switch (action) {
        case 'verify_document':
          return await this.kycService.verifyDocument(
            token,
            data.documentType,
            data.documentNumber,
          );

        case 'sign_agreement':
          return await this.kycService.signAgreement(token, data.signature);

        case 'generate_agreement':
          return await this.kycService.generateAgreement(token, data);

        case 'complete_kyc':
          return await this.kycService.completeKyc(token);

        default:
          return { success: false, error: 'Invalid action' };
      }
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }
}
