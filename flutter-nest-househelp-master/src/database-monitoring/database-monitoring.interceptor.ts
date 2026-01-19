import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseMonitoringService } from './database-monitoring.service';

@Injectable()
export class DatabaseMonitoringInterceptor implements NestInterceptor {
  constructor(private readonly databaseMonitoringService: DatabaseMonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timer = this.databaseMonitoringService.startQueryTimer();
    
    return next.handle().pipe(
      tap(() => {
        timer.end();
      })
    );
  }
}