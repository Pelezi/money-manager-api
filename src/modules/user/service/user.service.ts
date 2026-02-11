import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { PrismaService } from '../../common';
import { Role } from '../../tokens';
import * as userData from '../model';

@Injectable()
export class UserService {

    private readonly saltRounds = 10;

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all users in the database
     *
     * @returns A user list
     */
    public async find(): Promise<userData.UserData[]> {

        const users = await this.prismaService.user.findMany({
            orderBy: { firstName: 'asc' }
        });

        return users;
    }

    /**
     * Find a user by ID
     *
     * @param id User ID
     * @returns A user or null
     */
    public async findById(id: number): Promise<userData.UserData | null> {
        const user = await this.prismaService.user.findUnique({
            where: { id }
        });

        if (!user) {
            return null;
        }

        return user;
    }

    /**
     * Create a new user record
     *
     * @param data User details
     * @returns A user created in the database
     */
    public async create(data: userData.UserInput): Promise<userData.UserData> {
        const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

        const user = await this.prismaService.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName
            }
        });

        return user;
    }

    /**
     * Authenticate a user and return a JWT token
     *
     * @param data Login credentials
     * @returns JWT token and user data
     */
    public async login(data: userData.LoginInput): Promise<userData.LoginResponse> {
        const user = await this.prismaService.user.findUnique({
            where: { email: data.email }
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: Role.RESTRICTED,
                isOwner: user.isOwner
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h', issuer: process.env.JWT_ISSUER || 'IssuerApplication' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                type: 'refresh'
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'IssuerApplication' }
        );

        // Store refresh token in database
        await this.prismaService.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        return {
            token,
            refreshToken,
            user: user
        };
    }

    /**
     * Mark user's first access as complete
     *
     * @param userId User ID
     * @returns Updated user data
     */
    public async completeFirstAccess(userId: number): Promise<userData.UserData> {
        const user = await this.prismaService.user.update({
            where: { id: userId },
            data: { firstAccess: false }
        });

        return user;
    }

    /**
     * Update user profile
     *
     * @param userId User ID
     * @param data Profile data to update
     * @returns Updated user data
     */
    public async updateProfile(userId: number, data: { timezone?: string; phoneNumber?: string; defaultHomepage?: string }): Promise<userData.UserData> {
        const user = await this.prismaService.user.update({
            where: { id: userId },
            data: {
                ...(data.timezone && { timezone: data.timezone }),
                ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
                ...(data.defaultHomepage !== undefined && { defaultHomepage: data.defaultHomepage })
            }
        });

        return user;
    }

    /**
     * Search users by email
     *
     * @param email Email search term
     * @returns List of users matching the search
     */
    public async searchByEmailOrName(query: string): Promise<userData.UserData[]> {
        const users = await this.prismaService.user.findMany({
            where: {
                OR: [
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    },
                    {
                        firstName: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            take: 10,
            orderBy: {
                firstName: 'asc'
            }
        });

        return users;
    }

    /**
     * Check if a phone number already exists
     *
     * @param phoneNumber Phone number to check
     * @returns Boolean indicating if phone exists
     */
    public async checkPhoneExists(phoneNumber: string): Promise<boolean> {
        const user = await this.prismaService.user.findFirst({
            where: {
                phoneNumber: phoneNumber
            }
        });

        return user !== null;
    }

    /**
     * Create a new API key for external access
     *
     * @param userId User ID
     * @param name Name/description for the API key
     * @returns Created API key with the actual key value
     */
    public async createApiKey(userId: number, name: string): Promise<{ id: number; key: string; name: string; createdAt: Date }> {
        // Generate a secure random API key
        const key = 'mmk_' + crypto.randomBytes(32).toString('hex');

        const apiKey = await this.prismaService.apiKey.create({
            data: {
                userId,
                key,
                name
            }
        });

        return {
            id: apiKey.id,
            key: apiKey.key,
            name: apiKey.name,
            createdAt: apiKey.createdAt
        };
    }

    /**
     * List all API keys for a user (without the actual key values)
     *
     * @param userId User ID
     * @returns List of API keys
     */
    public async listApiKeys(userId: number): Promise<any[]> {
        const apiKeys = await this.prismaService.apiKey.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                createdAt: true,
                lastUsedAt: true,
                key: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Mask the key for security (show only last 8 characters)
        return apiKeys.map(apiKey => ({
            id: apiKey.id,
            name: apiKey.name,
            keyPreview: '***' + apiKey.key.slice(-8),
            createdAt: apiKey.createdAt,
            lastUsedAt: apiKey.lastUsedAt
        }));
    }

    /**
     * Delete an API key
     *
     * @param userId User ID
     * @param apiKeyId API Key ID
     */
    public async deleteApiKey(userId: number, apiKeyId: number): Promise<void> {
        // Verify the API key belongs to the user before deleting
        await this.prismaService.apiKey.deleteMany({
            where: {
                id: apiKeyId,
                userId: userId
            }
        });
    }

    /**
     * Refresh access token using refresh token
     *
     * @param refreshToken Refresh token
     * @returns New access token and user data
     */
    public async refreshAccessToken(refreshToken: string): Promise<userData.LoginResponse> {
        try {
            // Verify refresh token
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_SECRET || 'secret',
                { issuer: process.env.JWT_ISSUER || 'IssuerApplication' }
            ) as any;

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // Find user with this refresh token
            const user = await this.prismaService.user.findFirst({
                where: {
                    id: decoded.userId,
                    refreshToken: refreshToken
                }
            });

            if (!user) {
                throw new Error('Invalid refresh token');
            }

            // Generate new access token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: Role.RESTRICTED,
                    isOwner: user.isOwner
                },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h', issuer: process.env.JWT_ISSUER || 'IssuerApplication' }
            );

            // Generate new refresh token
            const newRefreshToken = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    type: 'refresh'
                },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'IssuerApplication' }
            );

            // Update refresh token in database
            await this.prismaService.user.update({
                where: { id: user.id },
                data: { refreshToken: newRefreshToken }
            });

            return {
                token,
                refreshToken: newRefreshToken,
                user: user
            };
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    /**
     * Get current user info with updated permissions
     *
     * @param userId User ID
     * @returns User data with group memberships and permissions
     */
    public async getCurrentUserInfo(userId: number): Promise<any> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            include: {
                groupMemberships: {
                    include: {
                        group: true,
                        role: {
                            select: {
                                id: true,
                                name: true,
                                canViewTransactions: true,
                                canManageOwnTransactions: true,
                                canManageGroupTransactions: true,
                                canViewCategories: true,
                                canManageCategories: true,
                                canViewSubcategories: true,
                                canManageSubcategories: true,
                                canViewBudgets: true,
                                canManageBudgets: true,
                                canViewAccounts: true,
                                canManageOwnAccounts: true,
                                canManageGroupAccounts: true,
                                canManageGroup: true
                            }
                        }
                    }
                },
                ownedGroups: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Format the response to include permissions for each group
        const groupPermissions = user.groupMemberships.map(membership => ({
            groupId: membership.groupId,
            groupName: membership.group.name,
            role: membership.role?.name || null,
            permissions: membership.role || null
        }));

        const ownedGroups = user.ownedGroups.map(group => ({
            groupId: group.id,
            groupName: group.name,
            isOwner: true,
            permissions: {
                canViewTransactions: true,
                canManageOwnTransactions: true,
                canManageGroupTransactions: true,
                canViewCategories: true,
                canManageCategories: true,
                canViewSubcategories: true,
                canManageSubcategories: true,
                canViewBudgets: true,
                canManageBudgets: true,
                canViewAccounts: true,
                canManageOwnAccounts: true,
                canManageGroupAccounts: true,
                canManageGroup: true
            }
        }));

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            firstAccess: user.firstAccess,
            timezone: user.timezone,
            defaultHomepage: user.defaultHomepage,
            isOwner: user.isOwner,
            createdAt: user.createdAt,
            groups: [...ownedGroups, ...groupPermissions]
        };
    }

}
