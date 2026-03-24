import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Recursively strips `password` fields from any object or array
 * returned in API responses.
 */
function stripPasswords(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(stripPasswords);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      if (key === 'password') {
        continue;
      }
      cleaned[key] = stripPasswords(value[key]);
    }
    return cleaned;
  }

  return value;
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => stripPasswords(data)));
  }
}
