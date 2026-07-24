import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { ApproveStepDto } from './dto/approve-step.dto';
import { RejectStepDto } from './dto/reject-step.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('approvals')
  async getApprovals(@CurrentUser() user: any) {
    return this.workflowsService.getApprovalsForUser(user.id);
  }

  @Get('workflows/:documentId')
  async getWorkflow(@Param('documentId') documentId: string) {
    return this.workflowsService.getWorkflowByDoc(documentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('workflows/:documentId/approve')
  async approve(
    @Param('documentId') documentId: string,
    @Body() dto: ApproveStepDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.approveStep(documentId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('workflows/:documentId/reject')
  async reject(
    @Param('documentId') documentId: string,
    @Body() dto: RejectStepDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.rejectStep(documentId, user.id, dto);
  }
}
