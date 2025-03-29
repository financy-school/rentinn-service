import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
  Length,
  IsEmail,
} from 'class-validator';

export class LoginPropertyUserDto {
  @IsEmail()
  @IsNotEmpty()
  @Length(5, 255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 255)
  password: string;
}
