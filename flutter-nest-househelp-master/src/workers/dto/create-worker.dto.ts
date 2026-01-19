import { IsString, IsNotEmpty, IsArray, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class CreateWorkerDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    bio: string;

    @IsArray()
    @IsUUID('4', { each: true })
    serviceIds: string[];

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
