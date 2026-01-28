import { IsString, IsNotEmpty, IsArray, IsNumber, Min, Max } from 'class-validator';

export class CreateWorkerDto {
    @IsNumber()
    @IsNotEmpty()
    userId: number;

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
