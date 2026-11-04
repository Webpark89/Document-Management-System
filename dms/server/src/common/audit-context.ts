import { AsyncLocalStorage } from 'node:async_hooks';
export const auditContext = new AsyncLocalStorage<{
  ip?: string;
  actor?: { id: string; username?: string; full_name?: string };
}>();
