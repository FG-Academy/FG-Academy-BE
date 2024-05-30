import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { DeletePostDto } from './dto/delete-post.dto';
import { Roles } from '../users/decorators/role.decorator';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getAllPosts(@Query('page') page: string) {
    const pageNumber = parseInt(page, 10) || 1;
    return this.postsService.findPosts(pageNumber);
  }

  @Get('/:announcementId')
  async getOneQnaPosts(@Param('announcementId') announcementId: number) {
    return this.postsService.findOnePost(announcementId);
  }
  @Roles('admin', 'manager')
  @Patch('/:announcementId')
  async updatePost(
    @Param('announcementId') announcementId: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(announcementId, updatePostDto);
  }

  @Roles('admin', 'manager')
  @Post()
  async createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(createPostDto);
  }

  @Roles('admin', 'manager')
  @Delete()
  async deletePosts(@Body() deletePostDto: DeletePostDto) {
    await this.postsService.deletePosts(deletePostDto.announcementIds);
    return { message: 'Posts deleted successfully' };
  }
}
