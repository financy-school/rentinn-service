import { PartialType } from '@nestjs/mapped-types';
import { RegisterPropertyUserDto } from './register-property-user.dto';

export class UpdatePropertyDto extends PartialType(RegisterPropertyUserDto) {}
