import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import multipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';

// Fail closed: refuse to boot without the secrets that sign the session and the
// transient SSO cookie (Microsoft SSO Implementation Guide §8).
function assertSecret(name: string) {
  const value = process.env[name];
  if (!value || value.length < 16 || value === 'changeme' || value === 'secret') {
    throw new Error(
      `${name} is unset or insecure. Set a strong ${name} before starting the API.`,
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // ConfigModule has now loaded the root .env into process.env. Fail closed if the session /
  // cookie signing secrets are missing or insecure (Microsoft SSO Implementation Guide §8).
  assertSecret('JWT_SECRET');
  assertSecret('COOKIE_SECRET');

  const fastifyInstance = app.getHttpAdapter().getInstance();
  await fastifyInstance.register(multipart as any, {
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  });
  await fastifyInstance.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET,
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Accounting SaaS API')
    .setDescription('Double Entry Accounting Software API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();

