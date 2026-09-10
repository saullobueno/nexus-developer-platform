import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseClient } from "@nexus/database";
import {
  adrStatusEnum,
  adrs,
  documentCategoryEnum,
  documentVersions,
  documents,
  services,
  users,
} from "@nexus/database";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { DATABASE_CLIENT } from "../database/database.constants";
import type { ListAdrsQuery } from "./dto/list-adrs.dto";
import type { ListDocumentsQuery } from "./dto/list-documents.dto";

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

@Injectable()
export class DocsService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: DatabaseClient) {}

  async listDocuments(organizationId: string, query: ListDocumentsQuery) {
    const conditions = [eq(documents.organizationId, organizationId)];
    if (query.search) {
      conditions.push(ilike(documents.title, `%${query.search}%`));
    }
    if (query.category && isOneOf(query.category, documentCategoryEnum.enumValues)) {
      conditions.push(eq(documents.category, query.category));
    }

    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          id: documents.id,
          title: documents.title,
          slug: documents.slug,
          category: documents.category,
          updatedAt: documents.updatedAt,
          serviceName: services.name,
          serviceSlug: services.slug,
        })
        .from(documents)
        .leftJoin(services, eq(documents.serviceId, services.id))
        .where(whereClause)
        .orderBy(desc(documents.updatedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ value: count() }).from(documents).where(whereClause),
    ]);

    return {
      items,
      total: totalRows[0]?.value ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getDocumentBySlug(organizationId: string, slug: string) {
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.organizationId, organizationId), eq(documents.slug, slug)),
    });
    if (!document) {
      throw new NotFoundException("Documento não encontrado");
    }

    const [author, service, versions] = await Promise.all([
      document.authorId
        ? this.db.query.users.findFirst({ where: eq(users.id, document.authorId) })
        : Promise.resolve(undefined),
      document.serviceId
        ? this.db.query.services.findFirst({ where: eq(services.id, document.serviceId) })
        : Promise.resolve(undefined),
      this.db
        .select({ id: documentVersions.id, version: documentVersions.version, createdAt: documentVersions.createdAt })
        .from(documentVersions)
        .where(eq(documentVersions.documentId, document.id))
        .orderBy(desc(documentVersions.version)),
    ]);

    return {
      document,
      author: author ? { id: author.id, name: author.name } : null,
      service: service ? { id: service.id, name: service.name, slug: service.slug } : null,
      versions,
    };
  }

  async listAdrs(organizationId: string, query: ListAdrsQuery) {
    const conditions = [eq(adrs.organizationId, organizationId)];
    if (query.status && isOneOf(query.status, adrStatusEnum.enumValues)) {
      conditions.push(eq(adrs.status, query.status));
    }

    const whereClause = and(...conditions);

    const [items, totalRows] = await Promise.all([
      this.db
        .select({ id: adrs.id, title: adrs.title, status: adrs.status, createdAt: adrs.createdAt })
        .from(adrs)
        .where(whereClause)
        .orderBy(desc(adrs.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ value: count() }).from(adrs).where(whereClause),
    ]);

    return {
      items,
      total: totalRows[0]?.value ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getAdrById(organizationId: string, id: string) {
    const adr = await this.db.query.adrs.findFirst({
      where: and(eq(adrs.organizationId, organizationId), eq(adrs.id, id)),
    });
    if (!adr) {
      throw new NotFoundException("ADR não encontrada");
    }
    return adr;
  }
}
