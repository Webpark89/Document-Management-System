import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            full_name: string;
            role: string;
            department: string | null;
            email: string;
            position: string | null;
        };
    }>;
    getProfile(user: any): Promise<any>;
}
