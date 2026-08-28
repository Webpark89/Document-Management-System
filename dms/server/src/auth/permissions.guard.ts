import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.permissions) {
      throw new ForbiddenException('ไม่มีสิทธิ์ใช้งานส่วนนี้ (Missing Permissions)');
    }
    
    // Admin override removed for fully dynamic:
    // If you want full dynamic, admin must have the permission in DB too.
    
    const hasPermission = requiredPermissions.some(permission => user.permissions.includes(permission));
    if (!hasPermission) {
      throw new ForbiddenException(`ไม่มีสิทธิ์ใช้งานส่วนนี้ (Requires: ${requiredPermissions.join(', ')})`);
    }
    
    return true;
  }
}
