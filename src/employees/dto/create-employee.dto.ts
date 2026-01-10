import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Full name of the employee' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Manual Employee Code (e.g. EMP001)' })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Job position' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Leave empty. Assigned later via Enroll.' })
  @IsOptional()
  @IsNumber()
  fingerId?: number;

  @ApiPropertyOptional({ description: 'Hourly salary rate' })
  @IsOptional()
  @IsNumber()
  hourly_rate?: number;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
