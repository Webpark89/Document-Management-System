import { of, defer, lastValueFrom } from 'rxjs';
import { auditContext } from './audit-context';
import { AuditContextInterceptor } from './audit-context.interceptor';
import {
  bangkokDateKey,
  bangkokDayStart,
  bangkokMonthRange,
} from './bangkok-time';

describe('Bangkok reporting periods', () => {
  it('uses Thai midnight rather than server-local or UTC midnight', () => {
    expect(bangkokDateKey(new Date('2026-10-31T16:59:59Z'))).toBe('2026-10-31');
    expect(bangkokDateKey(new Date('2026-10-31T17:00:00Z'))).toBe('2026-11-01');
    expect(bangkokDayStart('2026-11-01').toISOString()).toBe(
      '2026-10-31T17:00:00.000Z',
    );
  });
  it.each(['2026-11-15T00:00:00Z', '2026-11-30T16:59:59Z'])(
    'uses a complete November interval for %s',
    (now) => {
      const range = bangkokMonthRange(new Date(now));
      expect(range.start.toISOString()).toBe('2026-10-31T17:00:00.000Z');
      expect(range.end.toISOString()).toBe('2026-11-30T17:00:00.000Z');
    },
  );
  it('handles December to January rollover', () => {
    expect(bangkokMonthRange(new Date('2026-12-15')).end.toISOString()).toBe(
      '2026-12-31T17:00:00.000Z',
    );
  });
  it.each(['2026-02-30', 'not-a-date', '2026-1-1'])(
    'rejects invalid date filter %s',
    (key) => {
      expect(() => bangkokDayStart(key)).toThrow();
    },
  );
});

describe('Audit request context', () => {
  const interceptor = new AuditContextInterceptor();
  const context = (id: string) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        ip: `192.0.2.${id}`,
        user: {
          id,
          username: `user-${id}`,
          full_name: `User ${id}`,
          permissions: ['secret-internal-permissions'],
        },
      }),
    }),
  });
  it('keeps actor and IP distinct across concurrent asynchronous requests', async () => {
    const handler = {
      handle: () =>
        defer(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return auditContext.getStore();
        }),
    };
    const [first, second] = await Promise.all(
      ['1', '2'].map((id) =>
        lastValueFrom(interceptor.intercept(context(id) as any, handler)),
      ),
    );
    expect(first).toEqual({
      ip: '192.0.2.1',
      actor: { id: '1', username: 'user-1', full_name: 'User 1' },
    });
    expect(second).toEqual({
      ip: '192.0.2.2',
      actor: { id: '2', username: 'user-2', full_name: 'User 2' },
    });
    expect(auditContext.getStore()).toBeUndefined();
  });
  it('does not invent an actor for unauthenticated handlers', async () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ socket: { remoteAddress: '::1' } }),
      }),
    };
    const result = await lastValueFrom(
      interceptor.intercept(ctx as any, {
        handle: () => of(auditContext.getStore()),
      }),
    );
    expect(result).toEqual({ ip: '::1', actor: undefined });
  });
});
