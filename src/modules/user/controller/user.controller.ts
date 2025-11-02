import { Body, Controller, Get, HttpStatus, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { UserData, UserInput, LoginInput } from '../model';
import { UserService } from '../service';

@Controller('users')
@ApiTags('usuários')
export class UserController {

    public constructor(
        private readonly userService: UserService
    ) { }

    @Post('register')
    @ApiOperation({ 
        summary: 'Registrar um novo usuário',
        description: 'Cria uma nova conta de usuário no sistema. Este endpoint permite que novos usuários se registrem fornecendo nome, email e senha. O email deve ser único no sistema. A senha será armazenada de forma segura usando hash bcrypt. Após o registro bem-sucedido, o usuário pode fazer login para obter um token JWT e acessar os recursos protegidos da API.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: UserData, description: 'Usuário criado com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou email já cadastrado' })
    public async register(@Body() input: UserInput): Promise<UserData> {
        return this.userService.create(input);
    }

    @Post('login')
    @ApiOperation({ 
        summary: 'Autenticar usuário e obter token JWT',
        description: 'Realiza a autenticação do usuário no sistema usando email e senha. Quando bem-sucedido, retorna um token JWT que deve ser usado no cabeçalho Authorization (Bearer token) para acessar endpoints protegidos da API. O token contém informações do usuário codificadas e tem validade configurável. Este é o ponto de entrada para todas as operações autenticadas na API.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Login realizado com sucesso, retorna token JWT e dados do usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Credenciais inválidas - email ou senha incorretos' })
    public async login(@Body() input: LoginInput): Promise<{ token: string; user: UserData }> {
        try {
            return await this.userService.login(input);
        } catch (error) {
            throw new UnauthorizedException('Credenciais inválidas');
        }
    }

    @Get()
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Listar todos os usuários',
        description: 'Retorna a lista completa de todos os usuários cadastrados no sistema. Este endpoint requer autenticação via token JWT no cabeçalho Authorization. Útil para administradores que precisam visualizar todos os usuários da plataforma. Os dados retornados incluem informações básicas de cada usuário, mas excluem dados sensíveis como senhas.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: UserData, description: 'Lista de usuários retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async find(): Promise<UserData[]> {
        return this.userService.find();
    }

}
