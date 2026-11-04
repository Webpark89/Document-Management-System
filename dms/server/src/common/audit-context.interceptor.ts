import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { auditContext } from './audit-context';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    return new Observable((subscriber) =>
      auditContext.run(
        {
          ip: request.ip || request.socket?.remoteAddress,
          actor: request.user
            ? {
                id: request.user.id,
                username: request.user.username,
                full_name: request.user.full_name,
              }
            : undefined,
        },
        () => next.handle().subscribe(subscriber),
      ),
    );
  }
}
