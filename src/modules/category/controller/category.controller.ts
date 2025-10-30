import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { CategoryData, CategoryInput } from '../model';
import { CategoryService } from '../service';

@Controller('categories')
@ApiTags('category')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class CategoryController {

    public constructor(
        private readonly categoryService: CategoryService
    ) { }

    @Get()
    @ApiOperation({ summary: 'Find all categories for the authenticated user' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: CategoryData })
    public async find(@Request() req: any): Promise<CategoryData[]> {
        const userId = req.user?.userId || 1;
        return this.categoryService.findByUser(userId);
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiOperation({ summary: 'Find a category by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: CategoryData })
    public async findById(@Param('id') id: string, @Request() req: any): Promise<CategoryData> {
        const userId = req.user?.userId || 1;
        const category = await this.categoryService.findById(parseInt(id), userId);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new category' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CategoryData })
    public async create(@Body() input: CategoryInput, @Request() req: any): Promise<CategoryData> {
        const userId = req.user?.userId || 1;
        return this.categoryService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiOperation({ summary: 'Update a category' })
    @ApiResponse({ status: HttpStatus.OK, type: CategoryData })
    public async update(@Param('id') id: string, @Body() input: CategoryInput, @Request() req: any): Promise<CategoryData> {
        const userId = req.user?.userId || 1;
        return this.categoryService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiOperation({ summary: 'Delete a category' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    public async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
        const userId = req.user?.userId || 1;
        await this.categoryService.delete(parseInt(id), userId);
    }

}
