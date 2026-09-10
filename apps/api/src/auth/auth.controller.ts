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
import { eq } from "drizzle-orm";
import type { Response } from "express";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { DATABASE_CLIENT } from "../database/database.constants";
import { AuthService } from "./auth.service";
import { loginSchema, type LoginDto } from "./dto/login.dto";

const isProduction = process.env.NODE_ENV === "production";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.authService.login(body.email, body.password);
    response.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    });
    return { user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE_NAME);
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
