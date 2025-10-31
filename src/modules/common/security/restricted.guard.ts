import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { Role } from '../../tokens';
import { extractTokenPayload } from './security-utils';

@Injectable()
export class RestrictedGuard implements CanActivate {

    public canActivate(context: ExecutionContext): boolean {

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const payload = extractTokenPayload(request);
        if (!payload) {
            return false;
        }

        if (payload.role !== Role.RESTRICTED) {
            return false;
        }

        // Attach user info to request for use in controllers
        (request as any).user = {
            userId: payload.userId,
            role: payload.role
        };

        return true;
    }

}
