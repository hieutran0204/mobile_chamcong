import { IsString, IsNotEmpty, IsOptional, MinLength, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'owner1', description: 'Username for login' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Full Name of the Owner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'owner@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'My Company Co.', description: 'Company Name' })
  @IsOptional()
  @IsString()
  companyName?: string;
}
