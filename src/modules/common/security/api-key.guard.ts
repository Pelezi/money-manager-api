import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { PrismaService } from '../provider';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Injectable()
export class ApiKeyGuard implements CanActivate {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    public async canActivate(context: ExecutionContext): Promise<boolean> {

        const request = context.switchToHttp().getRequest<FastifyRequest>() as AuthenticatedRequest;
        
        // Check for API key in header
        const apiKey = request.headers['x-api-key'] as string;
        
        if (!apiKey) {
            return false;
        }

        try {
            // Verify API key exists in database
            const apiKeyRecord = await this.prismaService.apiKey.findUnique({
                where: { key: apiKey },
                include: { user: true }
            });

            if (!apiKeyRecord) {
                return false;
            }

            // Update last used timestamp
            await this.prismaService.apiKey.update({
                where: { id: apiKeyRecord.id },
                data: { lastUsedAt: new Date() }
            });

            // Attach user info to request for use in controllers
            request.user = {
                userId: apiKeyRecord.userId,
                role: 'RESTRICTED' as any
            };

            return true;
        } catch (error) {
            return false;
        }
    }

}
