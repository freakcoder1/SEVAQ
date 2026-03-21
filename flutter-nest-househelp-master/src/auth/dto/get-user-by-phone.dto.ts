import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class GetUserByPhoneDto {
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in E.164 format (e.g., +919876543210)',
  })
  phone: string;
}
