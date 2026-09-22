import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import slugify from 'slugify';
import {
  CategoriesDto,
  SearchCategoriesDto,
} from 'src/dto/categories/categories.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(categoryDto: CategoriesDto) {
    const slug = slugify(categoryDto.name, { lower: true, strict: true });

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        name: categoryDto.name,
        description: categoryDto.description,
        slug,
      },
    });
  }

  async getAllCategories(query: SearchCategoriesDto) {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        where,
      }),

      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      total,
      page,
      limit,
    };
  }

  async getCategoryById(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(slug: string, categoryDto: CategoriesDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { slug },
      data: {
        name: categoryDto.name,
        description: categoryDto.description,
      },
    });
  }

  async deleteCategory(slug: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.delete({
      where: { slug },
    });
  }
}
