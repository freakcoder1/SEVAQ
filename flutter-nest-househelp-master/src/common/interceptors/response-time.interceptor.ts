import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram, Counter } from 'prom-client';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly requestsCounter: Counter<string>,
    @InjectMetric('http_requests_errors_total')
    private readonly errorsCounter: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    const method = request.method;
    const url = request.url;
    const endpoint = `${method} ${url}`;

    // Increment total requests counter
    this.requestsCounter.inc({
      method,
      endpoint,
    });

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - start) / 1000; // in seconds
        const statusCode = response.statusCode.toString();

        // Record histogram
        this.histogram.observe(
          {
            method,
            endpoint,
            status_code: statusCode,
          },
          duration,
        );

        // Increment errors counter if status code is 4xx or 5xx
        if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
          this.errorsCounter.inc({
            method,
            endpoint,
            status_code: statusCode,
          });
        }
      }),
    );
  }
}
