import { apiFetch } from "./api-client";

export interface DocumentListItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  updatedAt: string;
  serviceName: string | null;
  serviceSlug: string | null;
}

export interface ListDocumentsResult {
  items: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListDocumentsParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export function listDocuments(params: ListDocumentsParams = {}): Promise<ListDocumentsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/docs${queryString ? `?${queryString}` : ""}`);
}

export interface DocumentDetail {
  document: {
    id: string;
    title: string;
    slug: string;
    category: string;
    content: string;
    updatedAt: string;
  };
  author: { id: string; name: string } | null;
  service: { id: string; name: string; slug: string } | null;
  versions: Array<{ id: string; version: number; createdAt: string }>;
}

export function getDocumentBySlug(slug: string): Promise<DocumentDetail> {
  return apiFetch(`/docs/${slug}`);
}

export interface AdrListItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface ListAdrsResult {
  items: AdrListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function listAdrs(params: { status?: string; page?: number; pageSize?: number } = {}): Promise<ListAdrsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/docs/adrs${queryString ? `?${queryString}` : ""}`);
}

export interface AdrDetail {
  id: string;
  title: string;
  status: string;
  context: string | null;
  decision: string | null;
  consequences: string | null;
  alternatives: string | null;
  createdAt: string;
}

export function getAdrById(id: string): Promise<AdrDetail> {
  return apiFetch(`/docs/adrs/${id}`);
}
