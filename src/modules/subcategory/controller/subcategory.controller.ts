import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { SubcategoryData, SubcategoryInput } from '../model';
import { SubcategoryService } from '../service';

@Controller('subcategories')
@ApiTags('subcategory')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class SubcategoryController {

    public constructor(
        private readonly subcategoryService: SubcategoryService
    ) { }

    @Get()
    @ApiOperation({ summary: 'Find all subcategories for the authenticated user' })
    @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: SubcategoryData })
    public async find(
        @Query('categoryId') categoryId?: string,
        @Request() req?: any
    ): Promise<SubcategoryData[]> {
        const userId = req.user?.userId || 1;
        return this.subcategoryService.findByUser(
            userId,
            categoryId ? parseInt(categoryId) : undefined
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'Subcategory ID' })
    @ApiOperation({ summary: 'Find a subcategory by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: SubcategoryData })
    public async findById(@Param('id') id: string, @Request() req: any): Promise<SubcategoryData> {
        const userId = req.user?.userId || 1;
        const subcategory = await this.subcategoryService.findById(parseInt(id), userId);
        if (!subcategory) {
            throw new Error('Subcategory not found');
        }
        return subcategory;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new subcategory' })
    @ApiResponse({ status: HttpStatus.CREATED, type: SubcategoryData })
    public async create(@Body() input: SubcategoryInput, @Request() req: any): Promise<SubcategoryData> {
        const userId = req.user?.userId || 1;
        return this.subcategoryService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'Subcategory ID' })
    @ApiOperation({ summary: 'Update a subcategory' })
    @ApiResponse({ status: HttpStatus.OK, type: SubcategoryData })
    public async update(@Param('id') id: string, @Body() input: SubcategoryInput, @Request() req: any): Promise<SubcategoryData> {
        const userId = req.user?.userId || 1;
        return this.subcategoryService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'Subcategory ID' })
    @ApiOperation({ summary: 'Delete a subcategory' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    public async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
        const userId = req.user?.userId || 1;
        await this.subcategoryService.delete(parseInt(id), userId);
    }

}
