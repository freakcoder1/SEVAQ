import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const body = request.body;

    const now = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - now;

        // Determine action from HTTP method
        let action = method;
        if (method === 'POST') action = 'CREATE';
        else if (method === 'PATCH' || method === 'PUT') action = 'UPDATE';
        else if (method === 'DELETE') action = 'DELETE';
        else if (method === 'GET') action = 'READ';

        // Extract entity type from URL
        const urlParts = url.split('/').filter(Boolean);
        const entityType = urlParts.length > 0 ? urlParts[urlParts.length - 2] : 'unknown';
        const entityId = urlParts.length > 0 ? urlParts[urlParts.length - 1] : undefined;

        // Skip logging for GET requests and health checks
        if (method === 'GET' || url.includes('health') || url.includes('dashboard')) {
          return;
        }

        try {
          await this.auditService.create({
            adminId: user?.id,
            adminEmail: user?.email,
            action,
            entityType,
            entityId: entityId !== ':id' ? entityId : undefined,
            newValue: body,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });
        } catch (error: unknown) {
          // Don't let audit logging failures break the request
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Audit logging failed: ${errorMessage}`);
        }
      }),
    );
  }
}
