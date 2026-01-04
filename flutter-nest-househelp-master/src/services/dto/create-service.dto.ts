import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsOptional()
    subcategory?: string;

    @IsNumber()
    @IsNotEmpty()
    basePrice: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}
