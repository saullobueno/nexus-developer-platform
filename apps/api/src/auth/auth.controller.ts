import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import {
  AUTH_COOKIE_NAME,
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  assertSameOrganization,
  type AuthenticatedUser,
} from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import { users } from "@nexus/database";
import { Throttle } from "@nestjs/throttler";
import { eq } from "drizzle-orm";
import type { Response } from "express";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { DATABASE_CLIENT } from "../database/database.constants";
import { AuthService } from "./auth.service";
import { loginSchema, type LoginDto } from "./dto/login.dto";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

// Em produção, apps/web (Vercel) e apps/api (host separado, ver ADR 0019)
// ficam em domínios diferentes — cookie realmente cross-site precisa de
// `sameSite: "none"` (só é aceito pelo browser com `secure: true`) para ser
// enviado em fetch() com credentials:"include". Em dev, localhost:3000 →
// localhost:3001 é cross-port mas same-site, então "lax" já funciona e evita
// exigir HTTPS local.
function authCookieOptions() {
  const production = isProduction();
  return {
    httpOnly: true,
    secure: production,
    sameSite: (production ? "none" : "lax") as "none" | "lax",
  };
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.authService.login(body.email, body.password);
    response.cookie(AUTH_COOKIE_NAME, token, {
      ...authCookieOptions(),
      maxAge: 1000 * 60 * 60 * 8,
    });
    return { user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @Get("admin-check")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("settings:read")
  adminCheck() {
    return { ok: true };
  }

  @Get("users/:id")
  @UseGuards(JwtAuthGuard)
  async getUser(@CurrentUser() currentUser: AuthenticatedUser, @Param("id") id: string) {
    const target = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    if (!target) {
      throw new NotFoundException("Usuário não encontrado");
    }

    assertSameOrganization(currentUser.organizationId, target.organizationId);

    return { id: target.id, name: target.name, email: target.email };
  }
}
