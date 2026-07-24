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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_user_dto_1 = require("./dto/create-user.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getUsers() {
        return this.adminService.getUsers();
    }
    async createUser(dto) {
        return this.adminService.createUser(dto);
    }
    async toggleUserActive(id) {
        return this.adminService.toggleUserActive(id);
    }
    async getRoles() {
        return this.adminService.getRoles();
    }
    async createRole(name) {
        return this.adminService.createRole(name);
    }
    async getDepartments() {
        return this.adminService.getDepartments();
    }
    async getPositions() {
        return this.adminService.getPositions();
    }
    async getDocumentTypes() {
        return this.adminService.getDocumentTypes();
    }
    async getAuditLogs(search, action) {
        return this.adminService.getAuditLogs(search, action);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/toggle-active'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleUserActive", null);
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Post)('roles'),
    __param(0, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)('departments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDepartments", null);
__decorate([
    (0, common_1.Get)('positions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPositions", null);
__decorate([
    (0, common_1.Get)('document-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDocumentTypes", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map