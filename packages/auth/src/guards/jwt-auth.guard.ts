import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { AUTH_COOKIE_NAME } from "../constants";
import type { AuthenticatedUser } from "../types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Token de autenticação ausente");
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      return true;
    } catch {
      throw new UnauthorizedException("Token de autenticação inválido");
    }
  }

  private extractToken(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    const cookieToken = cookies?.[AUTH_COOKIE_NAME];
    if (cookieToken) return cookieToken;

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice("Bearer ".length);
    }

    return undefined;
  }
}
