import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class UserData {

    @ApiProperty({ description: 'User unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'Email address', example: 'user@example.com' })
    public readonly email: string;

    @ApiProperty({ description: 'First name', example: 'John' })
    public readonly firstName: string;

    @ApiProperty({ description: 'Last name', example: 'Doe' })
    public readonly lastName: string;

    @ApiProperty({ description: 'Phone number', example: '+55 11 98765-4321', required: false })
    public readonly phoneNumber?: string;

    @ApiProperty({ description: 'First access flag', example: true })
    public readonly firstAccess: boolean;

    @ApiProperty({ description: 'User locale preference', example: 'en' })
    public readonly locale: string;

    @ApiProperty({ description: 'User timezone', example: 'America/Sao_Paulo' })
    public readonly timezone: string;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    public constructor(entity: User) {
        this.id = entity.id;
        this.email = entity.email;
        this.firstName = entity.firstName;
        this.lastName = entity.lastName;
        this.phoneNumber = entity.phoneNumber || undefined;
        this.firstAccess = entity.firstAccess;
        this.locale = entity.locale;
        this.timezone = entity.timezone;
        this.createdAt = entity.createdAt;
    }

}
