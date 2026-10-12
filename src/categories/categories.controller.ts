import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  CategoriesDto,
  CreateCategoryDto,
  SearchCategoriesDto,
} from 'src/dto/categories/categories.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createCategory(@Body() categoryDto: CategoriesDto) {
    return this.categoriesService.createCategory(categoryDto);
  }

  @Get()
  getAllCategories(@Query() query: SearchCategoriesDto) {
    return this.categoriesService.getAllCategories(query);
  }

  @Get(':slug')
  getCategoryById(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryById(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':slug')
  updateCategory(
    @Param('slug') slug: string,
    @Body() categoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(slug, categoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':slug')
  deleteCategory(@Param('slug') slug: string) {
    return this.categoriesService.deleteCategory(slug);
  }
}
