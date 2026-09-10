import { apiFetch } from "./api-client";

export type MetricRange = "15m" | "1h" | "6h" | "24h" | "7d" | "30d";

export interface MetricSeries {
  name: string;
  unit: string | null;
  points: Array<{ timestamp: string; value: number }>;
}

export interface MetricsResult {
  range: MetricRange;
  series: MetricSeries[];
}

export function getMetrics(params: { service?: string; range?: MetricRange }): Promise<MetricsResult> {
  const query = new URLSearchParams();
  if (params.service) query.set("service", params.service);
  if (params.range) query.set("range", params.range);
  const queryString = query.toString();
  return apiFetch(`/observability/metrics${queryString ? `?${queryString}` : ""}`);
}

export interface LogListItem {
  id: string;
  level: string;
  message: string;
  traceId: string | null;
  timestamp: string;
  serviceName: string;
  serviceSlug: string;
}

export interface ListLogsResult {
  items: LogListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListLogsParams {
  level?: string;
  service?: string;
  traceId?: string;
  page?: number;
  pageSize?: number;
}

export function listLogs(params: ListLogsParams = {}): Promise<ListLogsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/observability/logs${queryString ? `?${queryString}` : ""}`);
}

export interface TraceListItem {
  id: string;
  traceId: string;
  durationMs: number | null;
  startedAt: string;
  serviceName: string;
}

export interface ListTracesResult {
  items: TraceListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function listTraces(params: { service?: string; page?: number; pageSize?: number } = {}): Promise<ListTracesResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/observability/traces${queryString ? `?${queryString}` : ""}`);
}

export interface TraceSpan {
  id: string;
  name: string;
  startedAt: string;
  durationMs: number;
  parentSpanId: string | null;
  serviceName: string;
}

export interface TraceDetail {
  trace: {
    id: string;
    traceId: string;
    durationMs: number | null;
    startedAt: string;
  };
  spans: TraceSpan[];
}

export function getTraceById(id: string): Promise<TraceDetail> {
  return apiFetch(`/observability/traces/${id}`);
}

export interface ErrorListItem {
  id: string;
  type: string;
  message: string;
  occurrences: number;
  affectedUsers: number;
  firstSeenAt: string;
  lastSeenAt: string;
  serviceName: string;
  serviceSlug: string;
}

export interface ListErrorsResult {
  items: ErrorListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function listErrors(params: { service?: string; page?: number; pageSize?: number } = {}): Promise<ListErrorsResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/observability/errors${queryString ? `?${queryString}` : ""}`);
}
