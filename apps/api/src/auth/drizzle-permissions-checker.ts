import { Inject, Injectable } from "@nestjs/common";
import type { PermissionsChecker } from "@nexus/auth";
import type { DatabaseClient } from "@nexus/database";
import { permissions, rolePermissions, userRoles } from "@nexus/database";
import { eq } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";

@Injectable()
export class DrizzlePermissionsChecker implements PermissionsChecker {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async getPermissionsForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: permissions.key })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(userRoles.userId, userId));

    return Array.from(new Set(rows.map((row) => row.key)));
  }
}
