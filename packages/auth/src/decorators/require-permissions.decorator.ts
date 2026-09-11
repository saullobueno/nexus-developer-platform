import { SetMetadata } from "@nestjs/common";
import { PERMISSIONS_KEY } from "../constants.js";

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
