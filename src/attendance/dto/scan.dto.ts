import { IsInt } from 'class-validator';

export class ScanDto {
  @IsInt()
  fingerId: number;
}
