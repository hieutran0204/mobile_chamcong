import { IsNotEmpty, IsString, MinLength, IsMongoId } from 'class-validator';

export class CreateEmployeeAccountDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;
}
