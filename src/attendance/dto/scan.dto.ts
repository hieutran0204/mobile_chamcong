import { IsInt, IsOptional, IsString } from 'class-validator';

export class ScanDto {
  @IsInt()
  fingerId: number;

  @IsString()
  @IsOptional()
  type?: string;
}
