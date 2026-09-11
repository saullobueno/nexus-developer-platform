import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      // O frontend (apps/web) roda em origem separada e não é servido por este
      // processo — CSP restritiva aqui não protege nada que já não seja coberto
      // pelo CSP do próprio Next.js, e quebraria clients HTTP simples (supertest
      // nos e2e, `fetch` do apps/web). Mantemos os demais headers do helmet
      // (HSTS, X-Content-Type-Options, X-Frame-Options, etc.) ativos.
      contentSecurityPolicy: false,
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_APP_URL ?? "http://localhost:3000",
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap();
