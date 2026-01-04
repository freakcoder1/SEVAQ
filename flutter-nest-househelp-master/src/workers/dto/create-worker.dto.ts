import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';

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
}
