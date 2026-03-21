import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export function IsValidRoleAssignment(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidRoleAssignment',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // This validator can be extended to include business logic
          // For now, it just checks if the role is a valid enum value
          // Business rules like preventing admin assignment would be in service layer
          if (value === undefined || value === null) return true;
          return Object.values(UserRole).includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid user role`;
        },
      },
    });
  };
}
