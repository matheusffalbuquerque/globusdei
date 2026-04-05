import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Globus Dei Finance Service')
    .setDescription('Financial control, investments and allocations API.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    `${globalPrefix}/docs`,
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = process.env.PORT || 3002;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  Logger.log(
    `🚀 FinanceService running on: http://${host}:${port}/${globalPrefix}`,
  );
}

bootstrap();
