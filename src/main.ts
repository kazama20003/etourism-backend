import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/env.config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const envs = config.get<AppConfig>('app')!;

  // 🔥 1️⃣ RAW BODY PRIMERO (SOLO IPN)
  app.use('/api/payments/ipn', bodyParser.raw({ type: '*/*' }));

  // 2️⃣ JSON / URLENCODED DESPUÉS
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // 3️⃣ Helmet (Seguridad HTTP)
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  // Cookies
  app.use(cookieParser());

  // Prefijo global
  app.setGlobalPrefix('api');

  // CORS
  // main.ts
  app.enableCors({
    origin: [
      'http://localhost:3000', // desarrollo local
      'https://www.tourism-frontend-beta.vercel.app/es', // frontend en producción
      'https://tourism-frontend-beta.vercel.app', // opcional si usas www
    ],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(envs.port);
  logger.log(`🚀 API corriendo en http://localhost:${envs.port}/api`);

  // Swagger
  if (envs.enableSwagger) {
    const swagger = new DocumentBuilder()
      .setTitle('API Etourism')
      .setDescription(
        'Documentación de la API para el sitio de reservas de tours',
      )
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, document);
  }
}

bootstrap();
