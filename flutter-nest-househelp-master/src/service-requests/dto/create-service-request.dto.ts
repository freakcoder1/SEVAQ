import {
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './location.dto';

export class CreateServiceRequestDto {
  @IsNumber()
  serviceId: number;

  @IsDateString()
  date: string;

  @IsEnum(['morning', 'afternoon', 'evening', 'early-morning'])
  timeWindow: string;

  @IsNumber()
  priceSnapshot: number;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @IsString()
  @IsOptional()
  source?: string;

  @IsNumber()
  @IsOptional()
  serviceProfileId?: number;
}
