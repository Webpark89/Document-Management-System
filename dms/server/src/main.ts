import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });
  
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('DMS API')
    .setDescription('Document Management & Electronic Approval System API Specification (Nissui)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 NestJS Backend running on http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs available on http://localhost:${port}/api/docs`);
}
bootstrap();
