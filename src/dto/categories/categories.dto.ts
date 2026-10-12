import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../index.dto';

export class CategoriesDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCategoryDto extends PartialType(CategoriesDto) {}

export class SearchCategoriesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
