import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 512)
  fcmToken: string;
}
