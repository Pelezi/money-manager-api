import { AuthenticatedRequest } from "../../common";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { SubcategoryData, SubcategoryInput } from '../model';
import { SubcategoryService } from '../service';

@Controller('subcategories')
@ApiTags('subcategorias')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class SubcategoryController {

    public constructor(
        private readonly subcategoryService: SubcategoryService
    ) { }

    @Get()
    @ApiOperation({ 
        summary: 'Listar todas as subcategorias do usuário autenticado',
        description: 'Retorna todas as subcategorias do usuário autenticado, com opção de filtrar por categoria. Subcategorias são os itens específicos de despesas ou rendas dentro de uma categoria maior. Por exemplo, dentro da categoria "Moradia", você pode ter subcategorias como "Aluguel", "Condomínio", "Energia", "Água". Use o parâmetro categoryId para filtrar subcategorias de uma categoria específica, facilitando a visualização organizada de seus itens financeiros.'
    })
    @ApiQuery({ name: 'categoryId', required: false, description: 'ID da categoria para filtrar subcategorias' })
    @ApiQuery({ name: 'groupId', required: false, description: 'Filtrar por ID do grupo' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: SubcategoryData, description: 'Lista de subcategorias retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async find(
        @Query('categoryId') categoryId?: string,
        @Query('groupId') groupId?: string,
        @Request() req?: AuthenticatedRequest
    ): Promise<SubcategoryData[]> {
        const userId = req?.user?.userId || 1;
        return this.subcategoryService.findByUser(
            userId,
            categoryId ? parseInt(categoryId) : undefined,
            groupId ? parseInt(groupId) : undefined
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'ID único da subcategoria' })
    @ApiOperation({ 
        summary: 'Buscar uma subcategoria específica por ID',
        description: 'Retorna os detalhes completos de uma subcategoria identificada pelo seu ID. A subcategoria deve pertencer ao usuário autenticado. Este endpoint fornece informações sobre a subcategoria incluindo seu nome, categoria pai associada e tipo (despesa ou renda). É útil para verificar os dados antes de fazer edições ou para exibir informações detalhadas da subcategoria.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: SubcategoryData, description: 'Subcategoria encontrada e retornada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subcategoria não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async findById(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<SubcategoryData> {
        const userId = req?.user?.userId || 1;
        const subcategory = await this.subcategoryService.findById(parseInt(id), userId);
        if (!subcategory) {
            throw new Error('Subcategoria não encontrada');
        }
        return subcategory;
    }

    @Post()
    @ApiOperation({ 
        summary: 'Criar uma nova subcategoria',
        description: 'Cria uma nova subcategoria vinculada a uma categoria existente. Você deve fornecer o nome da subcategoria e o ID da categoria pai. As subcategorias representam itens específicos de despesas ou rendas. Por exemplo, dentro da categoria "Alimentação", você pode criar subcategorias como "Supermercado", "Restaurantes", "Lanches". Cada subcategoria será usada posteriormente para registrar transações e definir orçamentos detalhados.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: SubcategoryData, description: 'Subcategoria criada com sucesso' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou categoria pai não encontrada' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async create(@Body() input: SubcategoryInput, @Request() req: AuthenticatedRequest): Promise<SubcategoryData> {
        const userId = req?.user?.userId || 1;
        return this.subcategoryService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'ID único da subcategoria a ser atualizada' })
    @ApiOperation({ 
        summary: 'Atualizar uma subcategoria existente',
        description: 'Atualiza as informações de uma subcategoria existente. Você pode modificar o nome da subcategoria ou movê-la para outra categoria alterando o categoryId. Esta operação não afeta os orçamentos ou transações já vinculados a esta subcategoria - eles continuam associados. É útil para reorganizar sua estrutura financeira ou corrigir nomes de subcategorias.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: SubcategoryData, description: 'Subcategoria atualizada com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subcategoria não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou categoria de destino não encontrada' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async update(@Param('id') id: string, @Body() input: SubcategoryInput, @Request() req: AuthenticatedRequest): Promise<SubcategoryData> {
        const userId = req?.user?.userId || 1;
        return this.subcategoryService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'ID único da subcategoria a ser excluída' })
    @ApiOperation({ 
        summary: 'Excluir uma subcategoria',
        description: 'Remove permanentemente uma subcategoria do sistema. ATENÇÃO: Esta é uma operação irreversível que pode afetar orçamentos e transações vinculadas a esta subcategoria. Dependendo das regras de integridade do banco de dados, pode não ser possível excluir subcategorias que possuem transações ou orçamentos associados. Recomenda-se verificar dependências antes de excluir.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subcategoria excluída com sucesso' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subcategoria não encontrada ou não pertence ao usuário' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Subcategoria não pode ser excluída devido a dependências existentes' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.subcategoryService.delete(parseInt(id), userId);
    }

}
