import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequirePermissions, type AuthenticatedUser } from "@nexus/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { DocsService } from "./docs.service";
import { listAdrsSchema, type ListAdrsQuery } from "./dto/list-adrs.dto";
import { listDocumentsSchema, type ListDocumentsQuery } from "./dto/list-documents.dto";

@Controller("docs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("docs:read")
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listDocumentsSchema)) query: ListDocumentsQuery,
  ) {
    return this.docsService.listDocuments(user.organizationId, query);
  }

  @Get("adrs")
  listAdrs(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listAdrsSchema)) query: ListAdrsQuery,
  ) {
    return this.docsService.listAdrs(user.organizationId, query);
  }

  @Get("adrs/:id")
  getAdrById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.docsService.getAdrById(user.organizationId, id);
  }

  @Get(":slug")
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string) {
    return this.docsService.getDocumentBySlug(user.organizationId, slug);
  }
}
