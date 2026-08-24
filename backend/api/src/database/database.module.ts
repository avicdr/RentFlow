import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('[MongoDB] Connected'));
          connection.on('error', (err: Error) => console.error('[MongoDB] Error:', err.message));
          connection.on('disconnected', () => console.warn('[MongoDB] Disconnected'));
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
