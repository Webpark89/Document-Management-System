import { PrismaService } from '../prisma/prisma.service';
import { ApproveStepDto } from './dto/approve-step.dto';
import { RejectStepDto } from './dto/reject-step.dto';
export declare class WorkflowsService {
    private prisma;
    constructor(prisma: PrismaService);
    getApprovalsForUser(userId: string): Promise<{
        id: string;
        real_id: string;
        docId: string;
        docName: string;
        name: string;
        type: string;
        sender: string;
        submittedDate: string;
        amount: string;
        status: import(".prisma/client").$Enums.DocumentStatus;
        stepOrder: number;
        totalSteps: number;
        comment: string | null;
    }[]>;
    getWorkflowByDoc(documentId: string): Promise<{
        id: string;
        document_id: string;
        total_steps: number;
        current_step: number;
        status: import(".prisma/client").$Enums.WorkflowStatus;
        steps: {
            id: string;
            step_order: number;
            approver_name: string;
            approver_role: string;
            status: import(".prisma/client").$Enums.WorkflowStatus;
            action_date: string | undefined;
            comment: string | null;
            signature_applied: boolean;
        }[];
    }>;
    approveStep(documentId: string, userId: string, dto: ApproveStepDto): Promise<{
        success: boolean;
        is_completed: boolean;
    }>;
    rejectStep(documentId: string, userId: string, dto: RejectStepDto): Promise<{
        success: boolean;
    }>;
}
