import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { verifyPassword, type AuthenticatedUser } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import { users } from "@nexus/database";
import { eq } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
    };

    const token = await this.jwtService.signAsync(authenticatedUser);
    return { token, user: authenticatedUser };
  }
}
