import { HttpStatus, Injectable } from '@nestjs/common';
import { RegisterPropertyUserDto } from './dto/register-property-user.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { Repository } from 'typeorm';
import { customHttpError } from '../core/custom-error/error-service';
import { LoginPropertyUserDto } from './dto/login-property-user.dto';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async registerUser(createPropertyDto: RegisterPropertyUserDto) {
    const {
      property_name,
      name,
      email,
      phone_number,
      business_name,
      address,
      password,
    } = createPropertyDto;

    const existingUser = await this.propertyRepository.findOne({
      where: [{ owner_email: email }, { owner_phone_number: phone_number }],
    });

    if (existingUser) {
      throw customHttpError(
        {
          code: '100001',
          description: 'User already exists',
        },
        'PROPERTY_WITH_EMAIL_OR_PHONE_ALREADY_EXISTS_ERROR',
        `User with this email or phone number already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const property = this.propertyRepository.create({
      property_name,
      owner_name: name,
      owner_email: email,
      owner_phone_number: phone_number,
      property_code: business_name,
      owner_address: address,
      owner_password: password,
    });

    return await this.propertyRepository.save(property);
  }

  async loginUser(loginPropertyUserDto: LoginPropertyUserDto) {
    const { email, password } = loginPropertyUserDto;

    const propertyUser = await this.propertyRepository.findOne({
      where: {
        owner_email: email,
        owner_password: password,
      },
    });

    if (!propertyUser) {
      throw customHttpError(
        {
          code: '100002',
          description: 'Invalid credentials',
        },
        'PROPERTY_USER_LOGIN_ERROR',
        `Invalid credentials`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return propertyUser;
  }

  findAll() {
    return `This action returns all property`;
  }

  findOne(id: number) {
    return `This action returns a #${id} property`;
  }

  update(id: number, updatePropertyDto: UpdatePropertyDto) {
    return `This action updates a #${id} property`;
  }

  remove(id: number) {
    return `This action removes a #${id} property`;
  }
}
