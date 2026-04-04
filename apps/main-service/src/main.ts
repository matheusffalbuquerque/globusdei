/**
 * MainService acts as the central Core Gateway connecting Domain and RBAC Auth flows
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  // Binding to port 3001 avoiding collision with data-service, exposed LAN wide
  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  
  Logger.log(`[🚀 MainService] Application is running on: http://${host}:${port}/${globalPrefix}`);
}

bootstrap();
