import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculatePayrollDto {
  @ApiProperty({ example: 1, description: 'Month (1-12)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  year: number;
}
