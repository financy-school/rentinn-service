import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as sourceMapSupport from 'source-map-support';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { fetchAwsSecrets } from './core/aws/aws-fetch-secrets';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables
declare const module: any;
sourceMapSupport.install();

async function bootstrap() {
  if (process.env.AWS_SECRETS_NAME) await fetchAwsSecrets();

  const SERVICE_NAME = process.env.SERVICE_NAME || 'service';
  const SERVICE_PORT = Number(process.env.SERVICE_PORT) || 3000;

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.use(cors());
  await app.init();

  // ✅ Add a healthcheck route instead of creating a new server
  server.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  printEduMyndLogo();

  // ✅ Start the app only once on SERVICE_PORT
  http.createServer(server).listen(SERVICE_PORT, () => {
    console.log(
      `✅ Service ${SERVICE_NAME} is running on port ${SERVICE_PORT}`,
    );
    console.log(
      `✅ Healthcheck is available at http://localhost:${SERVICE_PORT}/health`,
    );
  });

  console.log(`  🎉 Yay! The service is up and running!`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();

function printEduMyndLogo() {
  console.log(`
  _____    _                           _       
 | ____| _| |_ ___  ___ _ __ _   _  __| | ___  
 |  _|  | | __/ _ \\/ _ \\ '__| | | |/ _\` |/ _ \\ 
 | |___ | | ||  __/  __/ |  | |_| | (_| |  __/ 
 |_____| \\__\\___|\\___|_|   \\__,_|\\__,_|\\___| 
                                             
    ______    _              _           
   |  ____|  (_)            | |          
   | |__  __  _  _ __   ___ | |_   ___   
   |  __| \\ \\/ /| '_ \\ / __|| __| / _ \\  
   | |____ >  < | | | |\\__ \\| |_ | (_) | 
   |______/_/\\_\\|_| |_||___/ \\__| \\___/  
`);
}
