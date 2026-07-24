"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const workflows_service_1 = require("./workflows.service");
const approve_step_dto_1 = require("./dto/approve-step.dto");
const reject_step_dto_1 = require("./dto/reject-step.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let WorkflowsController = class WorkflowsController {
    workflowsService;
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    async getApprovals(user) {
        return this.workflowsService.getApprovalsForUser(user.id);
    }
    async getWorkflow(documentId) {
        return this.workflowsService.getWorkflowByDoc(documentId);
    }
    async approve(documentId, dto, user) {
        return this.workflowsService.approveStep(documentId, user.id, dto);
    }
    async reject(documentId, dto, user) {
        return this.workflowsService.rejectStep(documentId, user.id, dto);
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('approvals'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getApprovals", null);
__decorate([
    (0, common_1.Get)('workflows/:documentId'),
    __param(0, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getWorkflow", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('workflows/:documentId/approve'),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_step_dto_1.ApproveStepDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "approve", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('workflows/:documentId/reject'),
    __param(0, (0, common_1.Param)('documentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_step_dto_1.RejectStepDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "reject", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map