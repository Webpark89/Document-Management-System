import { WorkflowsService } from './workflows.service';
import { ApproveStepDto } from './dto/approve-step.dto';
import { RejectStepDto } from './dto/reject-step.dto';
export declare class WorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    getApprovals(user: any): Promise<{
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
    getWorkflow(documentId: string): Promise<{
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
    approve(documentId: string, dto: ApproveStepDto, user: any): Promise<{
        success: boolean;
        is_completed: boolean;
    }>;
    reject(documentId: string, dto: RejectStepDto, user: any): Promise<{
        success: boolean;
    }>;
}
