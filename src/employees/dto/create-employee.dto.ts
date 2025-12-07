import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsString() name: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsNumber() fingerId?: number;
}
