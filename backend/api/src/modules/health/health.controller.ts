import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(@InjectConnection() private dbConnection: Connection) {}

  @Get()
  async check() {
    const dbOk = this.dbConnection.readyState === 1;
    const memory = process.memoryUsage();

    return {
      status: dbOk ? 'ok' : 'degraded',
      environment: process.env.NODE_ENV ?? 'development',
      uptime: Math.floor(process.uptime()),
      platform: process.platform,
      nodeVersion: process.version,
      startedAt: new Date(Date.now() - process.uptime() * 1000),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
      },
      checks: {
        database: dbOk ? 'ok' : 'error',
        api: 'ok',
        storage: !!process.env.UPLOAD_DIR ? 'ok' : 'not_configured',
        email: !!(process.env.SMTP_HOST && process.env.SMTP_USER) ? 'ok' : 'not_configured',
        jwt: !!(process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET) ? 'ok' : 'error',
        redis: 'not_configured',
      },
      env: {
        MONGO_URI: !!process.env.MONGO_URI,
        JWT_ACCESS_SECRET: !!process.env.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
        SMTP_HOST: !!process.env.SMTP_HOST,
        UPLOAD_DIR: !!process.env.UPLOAD_DIR,
        DIGILOCKER_CLIENT_ID: !!process.env.DIGILOCKER_CLIENT_ID,
      },
    };
  }
}
