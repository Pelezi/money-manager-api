import { AuthenticatedRequest } from "../../common";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

import { RestrictedGuard } from '../../common';

import { TransactionData, TransactionInput, TransactionAggregated } from '../model';
import { TransactionService } from '../service';

@Controller('transactions')
@ApiTags('transações')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class TransactionController {

    public constructor(
        private readonly transactionService: TransactionService
    ) { }

    @Get()
    @ApiOperation({ 
        summary: 'Listar todas as transações do usuário autenticado',
        description: 'Retorna todas as transações financeiras do usuário com múltiplas opções de filtragem. Transações representam os gastos e receitas reais que você registra no sistema. Cada transação está vinculada a uma subcategoria e possui valor, data, descrição e tipo (despesa ou receita). Use os filtros para analisar períodos específicos, subcategorias específicas ou tipos de transação. Este endpoint é essencial para visualizar seu histórico financeiro real e compará-lo com os orçamentos planejados.'
    })
    @ApiQuery({ name: 'subcategoryId', required: false, description: 'Filtrar por ID da subcategoria' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial para filtro (formato ISO: YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Data final para filtro (formato ISO: YYYY-MM-DD)' })
    @ApiQuery({ name: 'type', required: false, enum: ['EXPENSE', 'INCOME'], description: 'Filtrar por tipo (EXPENSE=Despesas, INCOME=Receitas)' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TransactionData, description: 'Lista de transações retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Formato de data inválido' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async find(
        @Query('subcategoryId') subcategoryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('type') type?: CategoryType,
        @Request() req?: AuthenticatedRequest
    ): Promise<TransactionData[]> {
        const userId = req?.user?.userId || 1;
        return this.transactionService.findByUser(
            userId,
            subcategoryId ? parseInt(subcategoryId) : undefined,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
            type
        );
    }

    @Get('aggregated')
    @ApiOperation({ 
        summary: 'Obter transações agregadas por subcategoria, mês e tipo',
        description: 'Retorna transações agregadas (somadas) agrupadas por subcategoria, mês, ano e tipo para um ano específico. Este endpoint é fundamental para análises financeiras detalhadas, permitindo visualizar quanto você gastou ou recebeu em cada subcategoria por mês. Por exemplo, você pode ver quanto gastou em "Supermercado" em cada mês de 2024. Os dados incluem o total gasto, a contagem de transações, e são separados por tipo (despesa ou receita).'
    })
    @ApiQuery({ name: 'year', required: true, description: 'Ano para agregar transações (formato: YYYY, obrigatório)' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TransactionAggregated, description: 'Retorna array de objetos com subcategoryId, total, count, month, year e type' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Ano obrigatório não fornecido ou formato inválido' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async getAggregated(
        @Query('year') year: string,
        @Request() req: AuthenticatedRequest
    ): Promise<TransactionAggregated[]> {
        if (!year) {
            throw new BadRequestException('Year parameter is required');
        }
        const userId = req?.user?.userId || 1;
        return this.transactionService.getAggregatedByYear(userId, parseInt(year));
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'ID único da transação' })
    @ApiOperation({ 
        summary: 'Buscar uma transação específica por ID',
        description: 'Retorna os detalhes completos de uma transação identificada pelo seu ID. A transação deve pertencer ao usuário autenticado. Este endpoint fornece todas as informações da transação incluindo valor, data, descrição, subcategoria associada e tipo (despesa ou receita). É útil para visualizar detalhes antes de editar, para auditoria de registros financeiros, ou para exibir informações completas em uma interface de usuário.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: TransactionData, description: 'Transação encontrada e retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transação não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async findById(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<TransactionData> {
        const userId = req?.user?.userId || 1;
        const transaction = await this.transactionService.findById(parseInt(id), userId);
        if (!transaction) {
            throw new Error('Transação não encontrada');
        }
        return transaction;
    }

    @Post()
    @ApiOperation({ 
        summary: 'Criar uma nova transação',
        description: 'Registra uma nova transação financeira no sistema. Você deve fornecer o valor, data, subcategoria e opcionalmente uma descrição. As transações representam seus gastos e receitas reais, diferentemente dos orçamentos que são apenas planejamento. Cada transação é automaticamente categorizada segundo a subcategoria escolhida, permitindo análises detalhadas posteriores. Use este endpoint sempre que fizer uma compra, receber um pagamento, ou qualquer movimentação financeira que deseje rastrear.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: TransactionData, description: 'Transação criada com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos, subcategoria não encontrada, ou formato de data inválido' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async create(@Body() input: TransactionInput, @Request() req: AuthenticatedRequest): Promise<TransactionData> {
        const userId = req?.user?.userId || 1;
        return this.transactionService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'ID único da transação a ser atualizada' })
    @ApiOperation({ 
        summary: 'Atualizar uma transação existente',
        description: 'Atualiza uma transação financeira existente. Você pode modificar qualquer campo da transação: valor, data, descrição ou subcategoria. Esta operação é útil para corrigir erros de digitação, recategorizar uma transação que foi classificada incorretamente, ou atualizar valores após confirmação de um pagamento. A transação atualizada continuará sendo contabilizada nas análises e comparações com orçamento do período correspondente à nova data.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: TransactionData, description: 'Transação atualizada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transação não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos fornecidos' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async update(@Param('id') id: string, @Body() input: TransactionInput, @Request() req: AuthenticatedRequest): Promise<TransactionData> {
        const userId = req?.user?.userId || 1;
        return this.transactionService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'ID único da transação a ser excluída' })
    @ApiOperation({ 
        summary: 'Excluir uma transação',
        description: 'Remove permanentemente uma transação do sistema. Esta é uma operação irreversível que exclui o registro financeiro completamente. Use com cautela, pois a exclusão afetará todas as análises, agregações e comparações que incluem esta transação. Após a exclusão, os totais calculados e comparações com orçamento serão automaticamente recalculados sem considerar esta transação. Recomenda-se fazer backup ou confirmar antes de excluir transações importantes.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Transação excluída com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transação não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.transactionService.delete(parseInt(id), userId);
    }

}
