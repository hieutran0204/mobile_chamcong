import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, Matches } from 'class-validator';

export class ManualAttendanceDto {
  @ApiProperty({ description: 'The ID of the employee' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Type of attendance: check-in or check-out', enum: ['check-in', 'check-out'] })
  @IsEnum(['check-in', 'check-out'])
  type: 'check-in' | 'check-out';

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: 'Time (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be HH:mm' })
  time: string;
}
