import { AuthenticatedRequest } from "../../common";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards, Request, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { CategoryData, CategoryInput } from '../model';
import { CategoryService } from '../service';

@Controller('categories')
@ApiTags('categorias')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class CategoryController {

    public constructor(
        private readonly categoryService: CategoryService
    ) { }

    @Get()
    @ApiOperation({ 
        summary: 'Listar todas as categorias do usuário autenticado',
        description: 'Retorna todas as categorias criadas pelo usuário autenticado. As categorias são usadas para organizar subcategorias de despesas e rendas. Por exemplo, uma categoria "Moradia" pode conter subcategorias como "Aluguel", "Condomínio", "IPTU". Cada categoria pertence exclusivamente ao usuário que a criou, garantindo isolamento de dados entre usuários. As categorias incluem informação sobre o tipo (EXPENSE para despesas ou INCOME para rendas).'
    })
    @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por ID do grupo' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: CategoryData, description: 'Lista de categorias retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async find(
        @Query('groupId') groupId?: string,
        @Request() req?: AuthenticatedRequest
    ): Promise<CategoryData[]> {
        const userId = req?.user?.userId || 1;
        return this.categoryService.findByUser(userId, groupId ? parseInt(groupId) : undefined);
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'ID único da categoria' })
    @ApiOperation({ 
        summary: 'Buscar uma categoria específica por ID',
        description: 'Retorna os detalhes completos de uma categoria específica identificada pelo seu ID. A categoria deve pertencer ao usuário autenticado. Este endpoint é útil para visualizar informações detalhadas de uma categoria antes de editá-la ou para confirmar suas propriedades. Retorna erro 404 se a categoria não existir ou não pertencer ao usuário.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: CategoryData, description: 'Categoria encontrada e retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Categoria não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async findById(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<CategoryData> {
        const userId = req?.user?.userId || 1;
        const category = await this.categoryService.findById(parseInt(id), userId);
        if (!category) {
            throw new Error('Categoria não encontrada');
        }
        return category;
    }

    @Post()
    @ApiOperation({ 
        summary: 'Criar uma nova categoria',
        description: 'Cria uma nova categoria para organizar subcategorias financeiras. Você deve fornecer um nome descritivo e o tipo (EXPENSE para despesas ou INCOME para rendas). As categorias servem como agrupadores principais para suas subcategorias. Por exemplo, você pode criar categorias como "Alimentação", "Transporte", "Moradia" para despesas, ou "Salário", "Freelance", "Investimentos" para rendas. A categoria criada será associada automaticamente ao usuário autenticado.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: CategoryData, description: 'Categoria criada com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos fornecidos' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async create(@Body() input: CategoryInput, @Request() req: AuthenticatedRequest): Promise<CategoryData> {
        const userId = req?.user?.userId || 1;
        return this.categoryService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'ID único da categoria a ser atualizada' })
    @ApiOperation({ 
        summary: 'Atualizar uma categoria existente',
        description: 'Atualiza as informações de uma categoria existente. Você pode modificar o nome e/ou o tipo da categoria. A atualização afeta apenas a categoria em si - as subcategorias vinculadas a ela permanecem inalteradas. Este endpoint é útil quando você deseja reorganizar sua estrutura de categorias ou corrigir nomenclaturas. A categoria deve pertencer ao usuário autenticado para poder ser atualizada.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: CategoryData, description: 'Categoria atualizada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Categoria não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos fornecidos' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async update(@Param('id') id: string, @Body() input: CategoryInput, @Request() req: AuthenticatedRequest): Promise<CategoryData> {
        const userId = req?.user?.userId || 1;
        return this.categoryService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'ID único da categoria a ser excluída' })
    @ApiOperation({ 
        summary: 'Excluir uma categoria',
        description: 'Remove permanentemente uma categoria do sistema. ATENÇÃO: Esta operação é irreversível e pode afetar subcategorias, orçamentos e transações vinculadas a esta categoria, dependendo da implementação das regras de integridade referencial do banco de dados. Recomenda-se verificar se existem dependências antes de excluir. A categoria deve pertencer ao usuário autenticado para poder ser excluída.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Categoria excluída com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Categoria não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Categoria não pode ser excluída devido a dependências existentes' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.categoryService.delete(parseInt(id), userId);
    }

}
