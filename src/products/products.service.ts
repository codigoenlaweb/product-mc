import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PaginationDto } from 'src/common/dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  onModuleInit() {
    this.$connect();
  }

  async create(createProductDto: CreateProductDto) {
    return await this.product.create({
      data: createProductDto,
    });
  }

  async findAll({ limit, page }: PaginationDto) {
    const [total, products] = await Promise.all([
      this.product.count(),
      this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: await products,
      meta: {
        page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    try {
      return await this.product.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Product not found`);
    }
  }

  async update({ id, ...productRest }: UpdateProductDto) {
    try {
      return await this.product.update({
        where: { id },
        data: productRest,
      });
    } catch (error) {
      return this.handleException(error);
    }
  }

  async remove(id: number) {
    try {
      return await this.product.delete({
        where: { id },
      });
    } catch (error) {
      return this.handleException(error);
    }
  }

  // helpers
  handleException(error: PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new NotFoundException('Product not found');
    }

    throw new InternalServerErrorException('Something went wrong');
  }
}
