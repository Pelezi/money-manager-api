import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

import { AuthenticatedRequest, RestrictedGuard } from '../../common';

import { BudgetData, BudgetInput } from '../model';
import { BudgetService } from '../service';

@Controller('budgets')
@ApiTags('orçamentos')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class BudgetController {

    public constructor(
        private readonly budgetService: BudgetService
    ) { }

    @Get()
    @ApiOperation({ 
        summary: 'Listar todos os orçamentos do usuário autenticado',
        description: 'Retorna todos os orçamentos do usuário com opções avançadas de filtragem. Os orçamentos representam valores planejados para cada subcategoria em um determinado período (mês e ano). Você pode filtrar por ano, mês específico e tipo (EXPENSE para despesas ou INCOME para rendas). Este endpoint é fundamental para visualizar seu planejamento financeiro e comparar com os gastos reais. Os orçamentos são automaticamente sincronizados entre períodos mensais e anuais.'
    })
    @ApiQuery({ name: 'year', required: false, description: 'Filtrar por ano (ex: 2024)' })
    @ApiQuery({ name: 'month', required: false, description: 'Filtrar por mês (1-12, onde 1=Janeiro, 12=Dezembro)' })
    @ApiQuery({ name: 'type', required: false, enum: ['EXPENSE', 'INCOME'], description: 'Filtrar por tipo de orçamento (EXPENSE=Despesas, INCOME=Rendas)' })
    @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por ID do grupo' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: BudgetData, description: 'Lista de orçamentos retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async find(
        @Query('year') year?: string,
        @Query('month') month?: string,
        @Query('type') type?: CategoryType,
        @Query('groupId') groupId?: string,
        @Request() req?: AuthenticatedRequest
    ): Promise<BudgetData[]> {
        const userId = req?.user?.userId || 1;
        return this.budgetService.findByUser(
            userId,
            year ? parseInt(year) : undefined,
            type,
            month ? parseInt(month) : undefined,
            groupId ? parseInt(groupId) : undefined
        );
    }

    @Get('comparison')
    @ApiOperation({ 
        summary: 'Obter comparação entre orçamento planejado e gastos reais',
        description: 'Compara o valor orçado com os gastos/rendas reais em um período específico. Este endpoint é essencial para análise financeira, mostrando quanto você planejou gastar versus quanto efetivamente gastou. Retorna três valores: o total orçado (budgeted), o total gasto/recebido (actual), e a diferença entre eles (difference). Valores positivos indicam economia (gastou menos que o orçado), valores negativos indicam estouro de orçamento. Pode ser filtrado por ano, mês, subcategoria específica e tipo (despesa ou renda).'
    })
    @ApiQuery({ name: 'year', required: true, description: 'Ano para comparação (obrigatório)' })
    @ApiQuery({ name: 'month', required: false, description: 'Mês para comparação (1-12, opcional)' })
    @ApiQuery({ name: 'subcategoryId', required: false, description: 'ID da subcategoria para comparação específica (opcional)' })
    @ApiQuery({ name: 'type', required: false, enum: ['EXPENSE', 'INCOME'], description: 'Filtrar por tipo (EXPENSE=Despesas, INCOME=Rendas)' })
    @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por ID do grupo' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Comparação retornada com sucesso com campos: budgeted (valor orçado), actual (valor real), difference (diferença)' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Parâmetro year obrigatório não fornecido' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async getComparison(
        @Query('year') year: string,
        @Query('month') month?: string,
        @Query('subcategoryId') subcategoryId?: string,
        @Query('type') type?: CategoryType,
        @Query('groupId') groupId?: string,
        @Request() req?: AuthenticatedRequest
    ): Promise<{ budgeted: number; actual: number; difference: number }> {
        const userId = req?.user?.userId || 1;
        return this.budgetService.getComparison(
            userId,
            parseInt(year),
            month ? parseInt(month) : undefined,
            subcategoryId ? parseInt(subcategoryId) : undefined,
            type,
            groupId ? parseInt(groupId) : undefined
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'ID único do orçamento' })
    @ApiOperation({ 
        summary: 'Buscar um orçamento específico por ID',
        description: 'Retorna os detalhes completos de um orçamento identificado pelo seu ID. O orçamento deve pertencer ao usuário autenticado. Este endpoint fornece informações detalhadas incluindo o valor orçado, a subcategoria associada, o período (ano e mês), e o tipo (despesa ou renda). Útil para verificar os dados antes de editar ou para exibir informações detalhadas em uma interface de usuário.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: BudgetData, description: 'Orçamento encontrado e retornado com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Orçamento não encontrado ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async findById(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<BudgetData> {
        const userId = req?.user?.userId || 1;
        const budget = await this.budgetService.findById(parseInt(id), userId);
        if (!budget) {
            throw new Error('Orçamento não encontrado');
        }
        return budget;
    }

    @Post()
    @ApiOperation({ 
        summary: 'Criar um novo orçamento',
        description: 'Cria um novo orçamento para uma subcategoria em um período específico. Você deve fornecer o ID da subcategoria, o valor planejado, ano e mês. O sistema suporta sincronização automática entre orçamentos mensais e anuais. Quando você cria ou atualiza orçamentos mensais, o orçamento anual correspondente é automaticamente recalculado para refletir a soma de todos os meses. Isso garante consistência entre seu planejamento mensal e visão anual.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: BudgetData, description: 'Orçamento criado com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou subcategoria não encontrada' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Já existe um orçamento para esta subcategoria neste período' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async create(@Body() input: BudgetInput, @Request() req: AuthenticatedRequest): Promise<BudgetData> {
        const userId = req?.user?.userId || 1;
        return this.budgetService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'ID único do orçamento a ser atualizado' })
    @ApiOperation({ 
        summary: 'Atualizar um orçamento existente',
        description: 'Atualiza um orçamento existente, modificando o valor planejado ou outras propriedades. Esta operação também aciona a sincronização automática de orçamentos: se você atualizar um orçamento mensal, o orçamento anual correspondente será automaticamente recalculado para refletir a nova soma. Da mesma forma, ajustes no orçamento anual podem ser propagados para os meses. Isso garante que sua visão mensal e anual permaneçam sempre consistentes.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: BudgetData, description: 'Orçamento atualizado com sucesso, sincronização automática aplicada' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Orçamento não encontrado ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos fornecidos' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async update(@Param('id') id: string, @Body() input: BudgetInput, @Request() req: AuthenticatedRequest): Promise<BudgetData> {
        const userId = req?.user?.userId || 1;
        return this.budgetService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'ID único do orçamento a ser excluído' })
    @ApiOperation({ 
        summary: 'Excluir um orçamento',
        description: 'Remove permanentemente um orçamento do sistema. Esta é uma operação irreversível que exclui o registro de planejamento para aquela subcategoria no período especificado. As transações reais associadas àquele período NÃO são afetadas - apenas o valor planejado é removido. Após excluir um orçamento mensal, o orçamento anual correspondente pode ser automaticamente recalculado para refletir a exclusão.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Orçamento excluído com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Orçamento não encontrado ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.budgetService.delete(parseInt(id), userId);
    }

}
