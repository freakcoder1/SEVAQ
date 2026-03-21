import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Worker } from './entities/worker.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Worker])],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
