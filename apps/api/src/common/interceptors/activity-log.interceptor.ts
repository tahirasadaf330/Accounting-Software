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

function resolveEntityLabel(entityType: string, responseBody: any): string {
  if (!responseBody) return 'unknown';
  switch (entityType) {
    case 'Voucher': return responseBody.voucherNumber ?? responseBody.id ?? 'unknown';
    case 'Contact': return responseBody.name ?? responseBody.id ?? 'unknown';
    case 'Account': return responseBody.code ? `${responseBody.code} - ${responseBody.name}` : (responseBody.name ?? responseBody.id ?? 'unknown');
    case 'User': return responseBody.email ?? responseBody.id ?? 'unknown';
    case 'FiscalYear': return responseBody.name ?? responseBody.id ?? 'unknown';
    case 'NettingCycle': return responseBody.id ?? 'unknown';
    case 'BusinessUnit': return responseBody.name ?? responseBody.id ?? 'unknown';
    case 'AccountManager': return responseBody.name ?? responseBody.id ?? 'unknown';
    case 'Currency': return responseBody.code ?? responseBody.id ?? 'unknown';
    default: {
      const uuidMatch = (responseBody.id ?? '').toString();
      return uuidMatch || 'unknown';
    }
  }
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
        const entityId = responseBody?.id ?? 'unknown';
        const entityLabel = resolveEntityLabel(entityType, responseBody);
        const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
        const description = `${userName} ${action} ${entityType} ${entityLabel}`;

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
