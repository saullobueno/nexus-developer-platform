import { ForbiddenException } from "@nestjs/common";

export function assertSameOrganization(
  userOrganizationId: string,
  resourceOrganizationId: string,
): void {
  if (userOrganizationId !== resourceOrganizationId) {
    throw new ForbiddenException("Recurso pertence a outra organização");
  }
}
