import { IsString, IsDateString, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './location.dto';

export class CreateServiceRequestDto {
   @IsString()
   serviceId: string;

  @IsDateString()
  date: string;

  @IsEnum(['morning', 'afternoon', 'evening'])
  timeWindow: string;

  @IsNumber()
  priceSnapshot: number;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;
}