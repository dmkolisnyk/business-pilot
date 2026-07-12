import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;

  await app.listen(port, '0.0.0.0');
  console.log(`Business Pilot API is running on http://localhost:${port}`);
}

void bootstrap();
