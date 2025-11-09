import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../../common';
import { Role } from '../../tokens';
import { UserData, UserInput, LoginInput } from '../model';

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
    public async find(): Promise<UserData[]> {

        const users = await this.prismaService.user.findMany({});

        return users.map(user => new UserData(user));
    }

    /**
     * Find a user by ID
     *
     * @param id User ID
     * @returns A user or null
     */
    public async findById(id: number): Promise<UserData | null> {

        const user = await this.prismaService.user.findUnique({
            where: { id }
        });

        if (!user) {
            return null;
        }

        return new UserData(user);
    }

    /**
     * Create a new user record
     *
     * @param data User details
     * @returns A user created in the database
     */
    public async create(data: UserInput): Promise<UserData> {

        const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

        const user = await this.prismaService.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName
            }
        });

        return new UserData(user);
    }

    /**
     * Authenticate a user and return a JWT token
     *
     * @param data Login credentials
     * @returns JWT token and user data
     */
    public async login(data: LoginInput): Promise<{ token: string; user: UserData }> {

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
                role: Role.RESTRICTED
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h', issuer: process.env.JWT_ISSUER || 'IssuerApplication' }
        );

        return {
            token,
            user: new UserData(user)
        };
    }

    /**
     * Mark user's first access as complete
     *
     * @param userId User ID
     * @returns Updated user data
     */
    public async completeFirstAccess(userId: number): Promise<UserData> {
        const user = await this.prismaService.user.update({
            where: { id: userId },
            data: { firstAccess: false }
        });

        return new UserData(user);
    }

    /**
     * Update user's locale preference
     *
     * @param userId User ID
     * @param locale Locale code (e.g., 'en', 'pt')
     * @returns Updated user data
     */
    public async updateLocale(userId: number, locale: string): Promise<UserData> {
        const user = await this.prismaService.user.update({
            where: { id: userId },
            data: { locale }
        });

        return new UserData(user);
    }

    /**
     * Update user profile
     *
     * @param userId User ID
     * @param data Profile data to update
     * @returns Updated user data
     */
    public async updateProfile(userId: number, data: { timezone?: string; locale?: string; phoneNumber?: string }): Promise<UserData> {
        const user = await this.prismaService.user.update({
            where: { id: userId },
            data: {
                ...(data.timezone && { timezone: data.timezone }),
                ...(data.locale && { locale: data.locale }),
                ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber })
            }
        });

        return new UserData(user);
    }

    /**
     * Search users by email
     *
     * @param email Email search term
     * @returns List of users matching the search
     */
    public async searchByEmailOrName(query: string): Promise<UserData[]> {
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
                email: 'asc'
            }
        });

        return users.map(user => new UserData(user));
    }

}
