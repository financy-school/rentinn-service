import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
  Length,
  IsEmail,
} from 'class-validator';

export class RegisterPropertyUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  property_name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Length(5, 255)
  email: string;

  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  business_name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 255)
  password: string;
}
