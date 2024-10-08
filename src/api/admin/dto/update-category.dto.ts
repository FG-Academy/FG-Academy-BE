// update-category.dto.ts
import { IsInt, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

// export class UpdateCategoryDto {
//   @IsOptional()
//   @IsString()
//   name?: string;

//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   order?: number;
// }

export class CategoryDto {
  // @IsOptional()
  // @Expose()
  // categoryId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdateCategoryDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  @IsNotEmpty()
  @IsOptional()
  categories: CategoryDto[];
}
