import {
  Controller, Post, Get, Delete, Param, Query, UploadedFile, Res,
  UseInterceptors, UseGuards, Body, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('category') category: string = 'misc',
    @Body('relatedTo') relatedTo?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const doc = await this.svc.saveDocument(file, userId, category, relatedTo);
    const downloadUrl = this.svc.getDownloadUrl(file.path);
    return {
      message: 'File uploaded successfully',
      data: { ...doc.toObject(), downloadUrl },
    };
  }

  /**
   * Authenticated file download — never exposes the raw filesystem path.
   * Verifies ownership before streaming the file.
   */
  @Get('download/:filename')
  async download(
    @Param('filename') filename: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const absolutePath = await this.svc.assertDownloadAccess(filename, user.id, user.role);
    res.sendFile(absolutePath);
  }

  @Get()
  findMyDocuments(@CurrentUser('id') userId: string, @Query('category') category?: string) {
    return this.svc.findByUser(userId, category).then(data => ({ data }));
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.softDelete(id, userId).then(() => ({ message: 'Document deleted' }));
  }

  @Get('tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  getTenantDocuments(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.findByTenant(tenantId, user.id, user.role).then(data => ({ data }));
  }

  @Post('tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadForTenant(
    @Param('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body('category') category: string = 'LEASE',
    @Body('description') description?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const doc = await this.svc.saveLandlordDocForTenant(file, user.id, user.role, tenantId, category, description);
    const downloadUrl = this.svc.getDownloadUrl(file.path);
    return { message: 'Document uploaded for tenant', data: { ...doc.toObject(), downloadUrl } };
  }
}
