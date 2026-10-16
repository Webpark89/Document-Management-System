import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApproveStepDto } from './dto/approve-step.dto';
import { RejectStepDto } from './dto/reject-step.dto';
import { SubmitWorkflowDto } from '../documents/dto/create-document.dto';
import type { Actor } from '../common/document-policy';

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}
  @Post('workflows/:documentId/submit')
  submit(
    @Param('documentId') id: string,
    @Body() body: SubmitWorkflowDto,
    @CurrentUser() user: Actor,
  ) {
    return this.workflowsService.submitWorkflow(
      id,
      user.id,
      body.workflow_steps,
    );
  }
  @Get('approvals')
  approvals(@CurrentUser() user: Actor) {
    return this.workflowsService.getApprovalsForUser(
      user.id,
      user.permissions?.includes('approvals.view_all:view'),
    );
  }
  @Get('workflows/:documentId')
  workflow(@Param('documentId') id: string, @CurrentUser() user: Actor) {
    return this.workflowsService.getWorkflowByDoc(id, user);
  }
  @Post('workflows/:documentId/approve')
  approve(
    @Param('documentId') id: string,
    @Body() dto: ApproveStepDto,
    @CurrentUser() user: Actor,
  ) {
    return this.workflowsService.approveStep(id, user.id, dto);
  }
  @Post('workflows/:documentId/reject')
  reject(
    @Param('documentId') id: string,
    @Body() dto: RejectStepDto,
    @CurrentUser() user: Actor,
  ) {
    return this.workflowsService.rejectStep(id, user.id, dto);
  }
}
