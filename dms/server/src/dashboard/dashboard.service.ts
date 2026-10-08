import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const totalDocs = await this.prisma.document.count({
      where: { is_deleted: false },
    });
    const approvedDocs = await this.prisma.document.count({
      where: { status: 'Approved', is_deleted: false },
    });
    const pendingDocs = await this.prisma.document.count({
      where: { status: 'Pending', is_deleted: false },
    });

    // Action Required: count workflow steps where this user is the approver, status is Pending, and it's their turn
    const userSteps = await this.prisma.workflowStep.findMany({
      where: {
        approver_id: userId,
        status: 'Pending',
        workflow: {
          status: 'Pending',
          document: { is_deleted: false },
        },
      },
      include: { workflow: true }
    });
    
    const actionRequired = userSteps.filter(s => s.step_order === s.workflow.current_step).length;

    // Recent activity (AuditLogs)
    const recentActivity = await this.prisma.auditLog.findMany({
      where: {
        user_id: userId,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    return {
      total: totalDocs,
      approved: approvedDocs,
      pending: pendingDocs,
      actionRequired,
      activity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        module: a.module,
        target_id: a.target_id || null,
        date: a.created_at,
      })),
    };
  }
}
