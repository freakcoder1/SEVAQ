import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 512)
  fcmToken: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  deviceId?: string;
}
