import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

export class CreateWorkerDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsArray()
  @IsNumber({}, { each: true })
  serviceIds: number[];

  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitude: number;
}
