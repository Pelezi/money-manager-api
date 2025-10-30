import { Body, Controller, Get, HttpStatus, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { UserData, UserInput, LoginInput } from '../model';
import { UserService } from '../service';

@Controller('users')
@ApiTags('user')
export class UserController {

    public constructor(
        private readonly userService: UserService
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: HttpStatus.CREATED, type: UserData })
    public async register(@Body() input: UserInput): Promise<UserData> {
        return this.userService.create(input);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login and get JWT token' })
    @ApiResponse({ status: HttpStatus.OK })
    public async login(@Body() input: LoginInput): Promise<{ token: string; user: UserData }> {
        try {
            return await this.userService.login(input);
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    @Get()
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Find all users' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: UserData })
    public async find(): Promise<UserData[]> {
        return this.userService.find();
    }

}
