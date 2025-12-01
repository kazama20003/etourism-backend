import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/env.config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const envs = config.get<AppConfig>('app')!;

  // Prefijo global para la API
  app.setGlobalPrefix('api'); // 👈 Aquí se agrega
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  // Middleware para parsear cookies
  app.use(cookieParser.default());
  // Habilitar CORS
  // main.ts en NestJS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true, // 🔑 necesario para cookies HttpOnly
  });

  // ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Inicializar servidor
  await app.listen(envs.port);
  logger.log(`🚀 API corriendo en http://localhost:${envs.port}/api`);

  // Swagger
  if (envs.enableSwagger) {
    logger.log(`📘 Swagger en http://localhost:${envs.port}/api/docs`);

    const swagger = new DocumentBuilder()
      .setTitle('API Etourism')
      .setDescription(
        'Documentación de la API para el sitio de reservas de tours',
      )
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swagger);

    SwaggerModule.setup('api/docs', app, document); // 👈 usa /api/docs
  }
}

bootstrap();
