export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
}

export interface PermissionsChecker {
  getPermissionsForUser(userId: string): Promise<string[]>;
}
