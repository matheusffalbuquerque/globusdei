import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = (process.env.CORS_ORIGINS ?? process.env.NEXTAUTH_URL ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaultLocalOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
  ];
  const allowedOrigins = new Set([...defaultLocalOrigins, ...configuredOrigins]);
  const globalPrefix = 'api';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-dev-user-sub',
      'x-dev-user-email',
      'x-dev-user-name',
      'x-dev-user-roles',
      'x-internal-service-token',
    ],
  });
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const port = process.env.PORT || 3004;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  Logger.log(
    `🚀 NotificationService is running on: http://${host}:${port}/${globalPrefix}`,
  );
}

bootstrap();
