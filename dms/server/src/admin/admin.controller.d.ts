import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(): Promise<{
        id: string;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        department: string;
        position: string;
        role: string;
        is_active: boolean;
        created_at: Date;
    }[]>;
    createUser(dto: CreateUserDto): Promise<{
        id: string;
        username: string;
        email: string;
        password_hash: string;
        first_name: string;
        last_name: string;
        department_id: string | null;
        position_id: string | null;
        role_id: string | null;
        signature_image_path: string | null;
        is_active: boolean;
        reset_token: string | null;
        reset_token_expiry: Date | null;
        created_at: Date;
        updated_at: Date;
    }>;
    toggleUserActive(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        password_hash: string;
        first_name: string;
        last_name: string;
        department_id: string | null;
        position_id: string | null;
        role_id: string | null;
        signature_image_path: string | null;
        is_active: boolean;
        reset_token: string | null;
        reset_token_expiry: Date | null;
        created_at: Date;
        updated_at: Date;
    }>;
    getRoles(): Promise<{
        id: string;
        name: string;
        is_active: boolean;
        user_count: number;
        permissions: {
            module: string;
            action: string;
        }[];
    }[]>;
    createRole(name: string): Promise<{
        id: string;
        is_active: boolean;
        name: string;
    }>;
    getDepartments(): Promise<{
        id: string;
        is_active: boolean;
        created_at: Date;
        name: string;
    }[]>;
    getPositions(): Promise<{
        id: string;
        is_active: boolean;
        created_at: Date;
        name: string;
    }[]>;
    getDocumentTypes(): Promise<({
        running_numbers: {
            id: string;
            prefix: string;
            document_type_id: string;
            year_format: string;
            current_number: number;
            padding_length: number;
        }[];
    } & {
        id: string;
        is_active: boolean;
        created_at: Date;
        type_name: string;
        prefix: string;
    })[]>;
    getAuditLogs(search?: string, action?: string): Promise<{
        id: string;
        user_id: string | null;
        username: string;
        user_fullname: string;
        action: import(".prisma/client").$Enums.AuditAction;
        module: string;
        target_id: string | null;
        ip_address: string;
        created_at: Date;
    }[]>;
}
