import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterEmployeeSelfDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;
  
  @IsNotEmpty()
  @IsString()
  position: string;
}
