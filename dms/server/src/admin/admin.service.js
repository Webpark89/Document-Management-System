"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsers() {
        const users = await this.prisma.user.findMany({
            include: {
                department: true,
                position: true,
                role: true,
            },
            orderBy: { created_at: 'desc' },
        });
        return users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            department: u.department?.name || '-',
            position: u.position?.name || '-',
            role: u.role?.name || 'Employee',
            is_active: u.is_active,
            created_at: u.created_at,
        }));
    }
    async createUser(dto) {
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ username: dto.username }, { email: dto.email }] },
        });
        if (existing) {
            throw new common_1.BadRequestException('ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว');
        }
        const rawPassword = dto.password || 'folk2546';
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        return this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password_hash: passwordHash,
                first_name: dto.first_name,
                last_name: dto.last_name,
                department_id: dto.department_id,
                position_id: dto.position_id,
                role_id: dto.role_id,
            },
        });
    }
    async toggleUserActive(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('ไม่พบผู้ใช้งาน');
        return this.prisma.user.update({
            where: { id },
            data: { is_active: !user.is_active },
        });
    }
    async getRoles() {
        const roles = await this.prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: { select: { users: true } },
            },
        });
        return roles.map((r) => ({
            id: r.id,
            name: r.name,
            is_active: r.is_active,
            user_count: r._count.users,
            permissions: r.permissions.map((p) => ({
                module: p.permission.module,
                action: p.permission.action,
            })),
        }));
    }
    async createRole(name) {
        return this.prisma.role.create({ data: { name } });
    }
    async getDepartments() {
        return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
    }
    async getPositions() {
        return this.prisma.position.findMany({ orderBy: { name: 'asc' } });
    }
    async getDocumentTypes() {
        return this.prisma.documentType.findMany({
            include: { running_numbers: true },
            orderBy: { created_at: 'asc' },
        });
    }
    async getAuditLogs(search, action) {
        const where = {};
        if (action && action !== 'All') {
            where.action = action;
        }
        const logs = await this.prisma.auditLog.findMany({
            where,
            include: {
                user: true,
            },
            orderBy: { created_at: 'desc' },
            take: 100,
        });
        return logs.map((l) => ({
            id: l.id,
            user_id: l.user_id,
            username: l.user?.username || 'System',
            user_fullname: l.user ? `${l.user.first_name} ${l.user.last_name}` : 'ระบบ',
            action: l.action,
            module: l.module,
            target_id: l.target_id,
            ip_address: l.ip_address || '127.0.0.1',
            created_at: l.created_at,
        }));
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map