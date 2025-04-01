import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { RegisterPropertyUserDto } from './dto/register-property-user.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { LoginPropertyUserDto } from './dto/login-property-user.dto';

@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post('property-user/register')
  registerUser(@Body() createPropertyDto: RegisterPropertyUserDto) {
    return this.propertyService.registerUser(createPropertyDto);
  }

  @Post('property-user/login')
  loginUser(@Body() createPropertyDto: LoginPropertyUserDto) {
    return this.propertyService.loginUser(createPropertyDto);
  }

  @Get()
  findAll() {
    return this.propertyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertyService.update(+id, updatePropertyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertyService.remove(+id);
  }
}
