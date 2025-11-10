import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

import { AuthenticatedRequest, RestrictedGuard } from '../../common';

import { AccountData, AccountInput, AccountBalanceData, AccountBalanceInput } from '../model';
import { AccountService } from '../service';

@Controller('accounts')
@ApiTags('contas')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class AccountController {

    public constructor(
        private readonly accountService: AccountService
    ) { }

    @Get()
    @ApiOperation({ 
        summary: 'Listar todas as contas do usuário autenticado',
        description: 'Retorna todas as contas (crédito, dinheiro, pré-pago) do usuário. As contas são usadas para gerenciar diferentes formas de pagamento e acompanhar saldos.'
    })
    @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por ID do grupo' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: AccountData, description: 'Lista de contas retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async find(
        @Query('groupId') groupId?: string,
        @Request() req?: AuthenticatedRequest
    ): Promise<AccountData[]> {
        const userId = req?.user?.userId || 1;
        return this.accountService.findByUser(
            userId,
            groupId ? parseInt(groupId) : undefined
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'ID único da conta' })
    @ApiOperation({ 
        summary: 'Buscar uma conta específica por ID',
        description: 'Retorna os detalhes completos de uma conta identificada pelo seu ID. A conta deve pertencer ao usuário autenticado ou a um grupo do qual o usuário é membro.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: AccountData, description: 'Conta encontrada e retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Conta não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async findById(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<AccountData> {
        const userId = req?.user?.userId || 1;
        const account = await this.accountService.findById(parseInt(id), userId);
        if (!account) {
            throw new Error('Conta não encontrada');
        }
        return account;
    }

    @Get(':id/balance')
    @ApiParam({ name: 'id', description: 'ID único da conta' })
    @ApiOperation({ 
        summary: 'Obter o saldo atual de uma conta',
        description: 'Retorna o saldo mais recente de uma conta específica.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: AccountBalanceData, description: 'Saldo atual retornado com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Conta não encontrada ou sem saldo cadastrado' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async getCurrentBalance(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<AccountBalanceData | null> {
        const userId = req?.user?.userId || 1;
        return this.accountService.getCurrentBalance(parseInt(id), userId);
    }

    @Get(':id/balance/history')
    @ApiParam({ name: 'id', description: 'ID único da conta' })
    @ApiOperation({ 
        summary: 'Obter histórico de saldos de uma conta',
        description: 'Retorna todo o histórico de saldos de uma conta específica, ordenado por data decrescente.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: AccountBalanceData, description: 'Histórico de saldos retornado com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Conta não encontrada' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async getBalanceHistory(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<AccountBalanceData[]> {
        const userId = req?.user?.userId || 1;
        return this.accountService.getBalanceHistory(parseInt(id), userId);
    }

    @Post()
    @ApiOperation({ 
        summary: 'Criar uma nova conta',
        description: 'Cria uma nova conta para o usuário autenticado. A conta pode ser pessoal ou associada a um grupo. É possível definir um saldo inicial.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: AccountData, description: 'Conta criada com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de entrada inválidos' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Usuário não é membro do grupo especificado' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async create(@Body() data: AccountInput, @Request() req: AuthenticatedRequest): Promise<AccountData> {
        const userId = req?.user?.userId || 1;
        return this.accountService.create(userId, data);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'ID único da conta' })
    @ApiOperation({ 
        summary: 'Atualizar uma conta existente',
        description: 'Atualiza os dados de uma conta existente. A conta deve pertencer ao usuário autenticado ou a um grupo do qual o usuário é membro.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: AccountData, description: 'Conta atualizada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Conta não encontrada' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de entrada inválidos' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Usuário não é membro do grupo especificado' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async update(
        @Param('id') id: string,
        @Body() data: Partial<AccountInput>,
        @Request() req: AuthenticatedRequest
    ): Promise<AccountData> {
        const userId = req?.user?.userId || 1;
        return this.accountService.update(parseInt(id), userId, data);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'ID único da conta' })
    @ApiOperation({ 
        summary: 'Deletar uma conta',
        description: 'Remove uma conta e todo seu histórico de saldos. A conta deve pertencer ao usuário autenticado ou a um grupo do qual o usuário é membro.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Conta deletada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Conta não encontrada' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.accountService.delete(parseInt(id), userId);
    }

    @Post('balances')
    @ApiOperation({ 
        summary: 'Adicionar um novo registro de saldo',
        description: 'Adiciona um novo registro de saldo para uma conta. Permite rastrear mudanças no saldo ao longo do tempo.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: AccountBalanceData, description: 'Saldo adicionado com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Conta não encontrada' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de entrada inválidos' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async addBalance(@Body() data: AccountBalanceInput, @Request() req: AuthenticatedRequest): Promise<AccountBalanceData> {
        const userId = req?.user?.userId || 1;
        return this.accountService.addBalance(userId, data);
    }

    @Put('balances/:id')
    @ApiParam({ name: 'id', description: 'ID único do registro de saldo' })
    @ApiOperation({ 
        summary: 'Atualizar um registro de saldo',
        description: 'Atualiza um registro de saldo existente.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: AccountBalanceData, description: 'Saldo atualizado com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Saldo não encontrado' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de entrada inválidos' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async updateBalance(
        @Param('id') id: string,
        @Body() data: Partial<AccountBalanceInput>,
        @Request() req: AuthenticatedRequest
    ): Promise<AccountBalanceData> {
        const userId = req?.user?.userId || 1;
        return this.accountService.updateBalance(parseInt(id), userId, data);
    }

    @Delete('balances/:id')
    @ApiParam({ name: 'id', description: 'ID único do registro de saldo' })
    @ApiOperation({ 
        summary: 'Deletar um registro de saldo',
        description: 'Remove um registro de saldo específico.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Saldo deletado com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Saldo não encontrado' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async deleteBalance(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.accountService.deleteBalance(parseInt(id), userId);
    }

}
