import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PERMISSIONS_CHECKER } from "@nexus/auth";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { DrizzlePermissionsChecker } from "./drizzle-permissions-checker";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
      signOptions: { expiresIn: "8h" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: PERMISSIONS_CHECKER, useClass: DrizzlePermissionsChecker }],
  exports: [AuthService],
})
export class AuthModule {}
