import { ApiProperty } from '@nestjs/swagger';

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
    public readonly phoneNumber: string | null;

    @ApiProperty({ description: 'First access flag', example: true })
    public readonly firstAccess: boolean;

    @ApiProperty({ description: 'User timezone', example: 'America/Sao_Paulo' })
    public readonly timezone: string;

    @ApiProperty({ description: 'Default homepage preference', example: 'personal', required: false })
    public readonly defaultHomepage: string | null;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    @ApiProperty({ description: 'Is user owner of the project', example: true, required: false })
    public readonly isOwner?: boolean;

}

export class LoginUserData {

    @ApiProperty({ description: 'User unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'Email address', example: 'user@example.com' })
    public readonly email: string;

    @ApiProperty({ description: 'First name', example: 'John' })
    public readonly firstName: string;

    @ApiProperty({ description: 'Last name', example: 'Doe' })
    public readonly lastName: string;

    @ApiProperty({ description: 'Phone number', example: '+55 11 98765-4321', required: false })
    public readonly phoneNumber: string | null;

    @ApiProperty({ description: 'First access flag', example: true })
    public readonly firstAccess: boolean;

    @ApiProperty({ description: 'User timezone', example: 'America/Sao_Paulo' })
    public readonly timezone: string;

    @ApiProperty({ description: 'Default homepage preference', example: 'personal', required: false })
    public readonly defaultHomepage: string | null;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    @ApiProperty({ description: 'Is user owner of the project', example: true, required: false })
    public readonly isOwner?: boolean;

}

export class LoginResponse {
    @ApiProperty({ description: 'JWT token for authentication', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    public readonly token: string;

    @ApiProperty({ description: 'Refresh token for obtaining new access tokens', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    public readonly refreshToken: string;

    @ApiProperty({ description: 'Authenticated user data' })
    public readonly user: LoginUserData;
}
