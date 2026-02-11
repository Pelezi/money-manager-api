import { Body, Controller, Get, HttpStatus, Post, Patch, UseGuards, Request, Query, HttpException, Delete, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiSecurity } from '@nestjs/swagger';

import { RestrictedGuard, ApiKeyOrJwtGuard } from '../../common';
import { CategoryService } from '../../category/service';

import * as UserData from '../model';
import { UserService } from '../service';

@Controller('users')
@ApiTags('usuários')
export class UserController {

    public constructor(
        private readonly userService: UserService,
        private readonly categoryService: CategoryService
    ) { }

    @Post('register')
    @ApiOperation({ 
        summary: 'Registrar um novo usuário',
        description: 'Cria uma nova conta de usuário no sistema. Este endpoint permite que novos usuários se registrem fornecendo nome, email e senha. O email deve ser único no sistema. A senha será armazenada de forma segura usando hash bcrypt. Após o registro bem-sucedido, o usuário pode fazer login para obter um token JWT e acessar os recursos protegidos da API.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: UserData.UserData, description: 'Usuário criado com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou email já cadastrado' })
    public async register(@Body() input: UserData.UserInput): Promise<UserData.UserData> {
        return this.userService.create(input);
    }

    @Post('login')
    @ApiOperation({ 
        summary: 'Autenticar usuário e obter token JWT',
        description: 'Realiza a autenticação do usuário no sistema usando email e senha. Quando bem-sucedido, retorna um token JWT que deve ser usado no cabeçalho Authorization (Bearer token) para acessar endpoints protegidos da API. O token contém informações do usuário codificadas e tem validade configurável. Este é o ponto de entrada para todas as operações autenticadas na API.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Login realizado com sucesso, retorna token JWT e dados do usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Credenciais inválidas - email ou senha incorretos' })
    public async login(@Body() input: UserData.LoginInput): Promise<UserData.LoginResponse> {
        try {
            return await this.userService.login(input);
        } catch (error) {
            console.log('Login error:', error);
            throw new HttpException(error.message, error.status || HttpStatus.UNAUTHORIZED);
        }
    }

    @Get()
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Listar todos os usuários',
        description: 'Retorna a lista completa de todos os usuários cadastrados no sistema. Este endpoint requer autenticação via token JWT no cabeçalho Authorization. Útil para administradores que precisam visualizar todos os usuários da plataforma. Os dados retornados incluem informações básicas de cada usuário, mas excluem dados sensíveis como senhas.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: UserData.UserData, description: 'Lista de usuários retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async find(): Promise<UserData.UserData[]> {
        return this.userService.find();
    }

    @Post('setup')
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Completar configuração inicial do usuário',
        description: 'Configura as categorias padrão do usuário e marca a primeira configuração como concluída. Recebe uma lista de categorias selecionadas com suas subcategorias e cria-as no banco de dados.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: UserData.UserData, description: 'Configuração concluída com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async completeSetup(
        @Request() req: any,
        @Body() body: { categories: Array<{ name: string; type: 'EXPENSE' | 'INCOME'; subcategories: string[] }> }
    ): Promise<UserData.UserData> {
        const userId = req.user.userId;
        
        // Create categories and subcategories
        await this.categoryService.bulkCreateWithSubcategories(userId, body.categories);
        
        // Mark first access as complete
        return this.userService.completeFirstAccess(userId);
    }

    @Patch('profile')
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Atualizar perfil do usuário',
        description: 'Atualiza as informações do perfil do usuário, incluindo timezone e página inicial padrão.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: UserData.UserData, description: 'Perfil atualizado com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async updateProfile(
        @Request() req: any,
        @Body() body: { timezone?: string; phoneNumber?: string; defaultHomepage?: string }
    ): Promise<UserData.UserData> {
        const userId = req.user.userId;
        return this.userService.updateProfile(userId, body);
    }

    @Get('search')
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Pesquisar usuários por email ou nome',
        description: 'Pesquisa usuários pelo email ou nome. Retorna até 10 usuários que correspondem ao termo de pesquisa. Útil para funcionalidade de autocomplete ao convidar membros para grupos.'
    })
    @ApiQuery({ name: 'query', required: true, description: 'Termo de pesquisa para o email ou nome do usuário' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: UserData.UserData, description: 'Lista de usuários encontrados' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async searchUsers(@Query('q') query: string): Promise<UserData.UserData[]> {
        return this.userService.searchByEmailOrName(query);
    }

    @Get('check-phone')
    @UseGuards(ApiKeyOrJwtGuard)
    @ApiBearerAuth()
    @ApiSecurity('api-key')
    @ApiOperation({ 
        summary: 'Verificar se um telefone está cadastrado',
        description: 'Verifica se existe um usuário cadastrado com o número de telefone informado. Retorna true se o telefone já está em uso, false caso contrário. Pode ser autenticado via JWT ou API Key (header X-API-Key).'
    })
    @ApiQuery({ name: 'phone', required: true, description: 'Número de telefone a ser verificado' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Retorna boolean indicando se o telefone existe' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ou API Key ausente ou inválido' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro phone não fornecido' })
    public async checkPhoneExists(@Query('phone') phone: string): Promise<{ exists: boolean }> {
        if (!phone) {
            throw new HttpException('Phone parameter is required', HttpStatus.BAD_REQUEST);
        }
        const exists = await this.userService.checkPhoneExists(phone);
        return { exists };
    }

    @Post('api-keys')
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Criar uma nova API Key',
        description: 'Gera uma nova API Key para autenticação externa. A chave pode ser usada no header X-API-Key para acessar endpoints sem necessidade de login JWT.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'API Key criada com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async createApiKey(
        @Request() req: any,
        @Body() body: { name: string }
    ): Promise<{ id: number; key: string; name: string; createdAt: Date }> {
        const userId = req.user.userId;
        return this.userService.createApiKey(userId, body.name);
    }

    @Get('api-keys')
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Listar API Keys do usuário',
        description: 'Retorna todas as API Keys criadas pelo usuário. A chave completa não é retornada por segurança, apenas os metadados.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Lista de API Keys' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async listApiKeys(@Request() req: any): Promise<any[]> {
        const userId = req.user.userId;
        return this.userService.listApiKeys(userId);
    }

    @Delete('api-keys/:id')
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Remover uma API Key',
        description: 'Remove uma API Key específica do usuário.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'API Key removida com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'API Key não encontrada' })
    public async deleteApiKey(
        @Request() req: any,
        @Param('id') id: string
    ): Promise<{ message: string }> {
        const userId = req.user.userId;
        await this.userService.deleteApiKey(userId, parseInt(id));
        return { message: 'API Key deleted successfully' };
    }

    @Post('refresh')
    @ApiOperation({ 
        summary: 'Renovar token de acesso',
        description: 'Usa um refresh token válido para obter um novo access token. O refresh token também é renovado. Útil para manter o usuário autenticado sem precisar fazer login novamente.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: UserData.LoginResponse, description: 'Tokens renovados com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Refresh token inválido ou expirado' })
    public async refreshToken(@Body() body: { refreshToken: string }): Promise<UserData.LoginResponse> {
        try {
            return await this.userService.refreshAccessToken(body.refreshToken);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
        }
    }

    @Get('me')
    @UseGuards(RestrictedGuard)
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Obter informações do usuário atual',
        description: 'Retorna as informações completas do usuário autenticado, incluindo todas as permissões nos grupos dos quais faz parte. Este endpoint deve ser chamado sempre que a página recarregar ou o usuário navegar para sincronizar as permissões.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Informações do usuário retornadas com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async getCurrentUser(@Request() req: any): Promise<any> {
        const userId = req.user.userId;
        return this.userService.getCurrentUserInfo(userId);
    }

}
