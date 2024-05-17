import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from 'src/entities/announcement.entity';
import { In, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
  ) {}

  async findPosts(page: number) {
    const itemsPerPage = 10;
    const [posts, total] = await this.announcementRepository.findAndCount({
      where: { courseId: null, status: 'active' },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / itemsPerPage);

    return {
      posts,
      totalPages,
    };
  }

  async findOnePost(announcementId: number) {
    const post = await this.announcementRepository.findOne({
      where: { announcementId, status: 'active', courseId: null },
    });

    return post;
  }

  async createPost(createPostDto: CreatePostDto) {
    const newPost = this.announcementRepository.create(createPostDto);
    return this.announcementRepository.save(newPost);
  }

  async updatePost(updatePostDto: UpdatePostDto) {
    const { announcementId, title, content } = updatePostDto;
    const post = await this.announcementRepository.findOne({
      where: { announcementId },
    });
    if (!post) {
      throw new Error('Post not found');
    }
    if (title) {
      post.title = title;
    }
    if (content) {
      post.content = content;
    }
    return this.announcementRepository.save(post);
  }

  async deletePosts(announcementIds: number[]): Promise<void> {
    await this.announcementRepository.update(
      { announcementId: In(announcementIds) },
      { status: 'deleted' },
    );
  }
}
