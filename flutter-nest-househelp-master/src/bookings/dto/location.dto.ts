import { IsNumber, IsOptional, IsString } from 'class-validator';

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
