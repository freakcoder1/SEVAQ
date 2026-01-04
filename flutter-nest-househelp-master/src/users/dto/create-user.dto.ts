import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    address?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
}
