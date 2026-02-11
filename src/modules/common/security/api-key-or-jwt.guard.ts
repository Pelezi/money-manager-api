import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { Role } from '../../tokens';
import { PrismaService } from '../provider';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import { extractTokenPayload } from './security-utils';

@Injectable()
export class ApiKeyOrJwtGuard implements CanActivate {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    public async canActivate(context: ExecutionContext): Promise<boolean> {

        const request = context.switchToHttp().getRequest<FastifyRequest>() as AuthenticatedRequest;
        
        // First, try API key authentication
        const apiKey = request.headers['x-api-key'] as string;
        
        if (apiKey) {
            try {
                const apiKeyRecord = await this.prismaService.apiKey.findUnique({
                    where: { key: apiKey },
                    include: { user: true }
                });

                if (apiKeyRecord) {
                    // Update last used timestamp
                    await this.prismaService.apiKey.update({
                        where: { id: apiKeyRecord.id },
                        data: { lastUsedAt: new Date() }
                    });

                    // Attach user info to request
                    request.user = {
                        userId: apiKeyRecord.userId,
                        role: Role.RESTRICTED
                    };

                    return true;
                }
            } catch (error) {
                // Fall through to JWT check
            }
        }

        // If no API key or invalid, try JWT authentication
        const payload = extractTokenPayload(request);
        if (!payload) {
            return false;
        }

        if (payload.role !== Role.RESTRICTED) {
            return false;
        }

        // Attach user info to request
        request.user = {
            userId: payload.userId,
            role: payload.role
        };

        return true;
    }

}
