import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableShutdownHooks();
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads/',
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('DMS API')
    .setDescription(
      'Document Management & Electronic Approval System API Specification (Nissui)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  // find LAN IP
  const nets = networkInterfaces();
  let lanIp = 'localhost';
  for (const iface of Object.values(nets)) {
    for (const alias of iface ?? []) {
      if (alias.family === 'IPv4' && !alias.internal && alias.address.startsWith('192.168.')) {
        lanIp = alias.address;
      }
    }
  }
  console.log(`🚀 NestJS Backend`);
  console.log(`   - Local:   http://localhost:${port}/api`);
  console.log(`   - Network: http://${lanIp}:${port}/api`);
  console.log(`📚 Swagger:  http://localhost:${port}/api/docs`);
}
void bootstrap();
