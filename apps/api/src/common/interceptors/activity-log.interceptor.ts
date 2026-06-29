import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogsService } from '../../modules/activity-logs/activity-logs.service';

const METHOD_ACTION: Record<string, string> = {
  POST: 'created',
  PATCH: 'updated',
  PUT: 'updated',
  DELETE: 'deleted',
};

const ROUTE_ENTITY: Record<string, string> = {
  '/api/v1/vouchers': 'Voucher',
  '/api/v1/contacts': 'Contact',
  '/api/v1/accounts': 'Account',
  '/api/v1/fiscal-years': 'FiscalYear',
  '/api/v1/netting-cycles': 'NettingCycle',
  '/api/v1/users': 'User',
  '/api/v1/business-units': 'BusinessUnit',
  '/api/v1/account-managers': 'AccountManager',
  '/api/v1/currencies': 'Currency',
};

function resolveEntity(url: string): string {
  for (const prefix of Object.keys(ROUTE_ENTITY)) {
    if (url.startsWith(prefix)) return ROUTE_ENTITY[prefix];
  }
  return 'Unknown';
}

function resolveEntityId(url: string, responseBody: any): string {
  // Try to get id from response
  if (responseBody?.id) return String(responseBody.id);
  // Try to get from URL (last UUID segment)
  const uuidMatch = url.match(/[0-9a-f-]{36}/i);
  if (uuidMatch) return uuidMatch[0];
  return 'unknown';
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, headers } = request;

    const action = METHOD_ACTION[method];
    if (!action || !user) return next.handle();

    const entityType = resolveEntity(url);
    if (entityType === 'Unknown') return next.handle();

    const ipAddress =
      headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip ||
      null;
    const userAgent = headers['user-agent'] || null;

    return next.handle().pipe(
      tap((responseBody) => {
        const entityId = resolveEntityId(url, responseBody);
        const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
        const description = `${userName} ${action} ${entityType} ${entityId}`;

        this.activityLogsService.log({
          tenantId: user.tenantId ?? undefined,
          userId: user.id,
          action,
          entityType,
          entityId,
          description,
          ipAddress,
          userAgent,
        });
      }),
    );
  }
}
