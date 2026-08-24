import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
];

export const multerConfig = (config: ConfigService) => ({
  storage: diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const category = req.body?.category ?? 'misc';
      const dir = path.join(config.get<string>('upload.dir') ?? './uploads', category);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req: any, file: any, cb: any) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuid()}${ext}`);
    },
  }),
  limits: {
    fileSize: (config.get<number>('upload.maxSizeMb') ?? 20) * 1024 * 1024,
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new BadRequestException(`File type not allowed: ${file.mimetype}`), false);
    }
    cb(null, true);
  },
});
