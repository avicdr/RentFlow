import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocModel, DocumentSchema } from './schemas/document.schema';
import { multerConfig } from './multer.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocModel.name, schema: DocumentSchema },
      { name: 'Tenant', schema: new mongoose.Schema({}, { strict: false, collection: 'tenants' }) },
    ]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => multerConfig(config),
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
