import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserData } from './user.data';

export class UserInput extends PickType(UserData, ['email', 'firstName', 'lastName'] as const) {
    @ApiProperty({ description: 'Password', example: 'password123' })
    public readonly password: string;
}

export class LoginInput {
    @ApiProperty({ description: 'Email address', example: 'user@example.com' })
    public readonly email: string;

    @ApiProperty({ description: 'Password', example: 'password123' })
    public readonly password: string;
}
