import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  loadActor,
  requirePermission,
  visibleDocuments,
} from '../common/document-policy';
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}
  async getStats(userId: string) {
    const actor = await loadActor(this.prisma, userId);
    requirePermission(actor, [
      'dashboard.view_employee:view',
      'dashboard.view_executive:view',
    ]);
    const where = visibleDocuments(actor);
    const [counts, types, userSteps, recent, activity] = await Promise.all([
      this.prisma.document.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.document.groupBy({
        by: ['type_id'],
        where,
        _count: { _all: true },
      }),
      this.prisma.workflowStep.findMany({
        where: {
          approver_id: userId,
          status: 'Pending',
          workflow: {
            status: 'Pending',
            document: { is_deleted: false, status: 'Pending' },
          },
        },
        include: { workflow: true },
      }),
      this.prisma.document.findMany({
        where,
        select: {
          id: true,
          doc_number: true,
          title: true,
          status: true,
          created_at: true,
          approved_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
    ]);
    const typeNames = await this.prisma.documentType.findMany({
      select: { id: true, prefix: true, type_name: true },
    });
    const count = (status: string) =>
      counts.find((c) => c.status === status)?._count._all ?? 0;
    const trend: { day: string; documents: number; approvals: number }[] = [];
    for (let offset = 6; offset >= 0; offset--) {
      const start = new Date();
      start.setDate(start.getDate() - offset);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const [documents, approvals] = await Promise.all([
        this.prisma.document.count({
          where: { AND: [where, { created_at: { gte: start, lt: end } }] },
        }),
        this.prisma.document.count({
          where: { AND: [where, { approved_at: { gte: start, lt: end } }] },
        }),
      ]);
      trend.push({
        day: start.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
        }),
        documents,
        approvals,
      });
    }
    return {
      total: counts.reduce((n, c) => n + c._count._all, 0),
      approved: count('Approved'),
      pending: count('Pending'),
      returned: count('Returned'),
      rejected: count('Rejected'),
      cancelled: count('Cancelled'),
      draft: count('Draft'),
      actionRequired: userSteps.filter(
        (s) => s.step_order === s.workflow.current_step,
      ).length,
      documents: recent.map((d) => ({ ...d, real_id: d.id, name: d.title })),
      types: types.map((t, i) => ({
        name: typeNames.find((n) => n.id === t.type_id)?.prefix ?? '',
        value: t._count._all,
        color: ['#3b82f6', '#a855f7', '#10b981', '#f59e0b'][i % 4],
      })),
      trend,
      goals: [],
      activity: activity.map((a) => ({
        id: a.id,
        action: a.action,
        module: a.module,
        target_id: a.target_id,
        date: a.created_at,
        timestamp: a.created_at,
        delta: `${a.action}: ${a.module}`,
      })),
    };
  }
}
