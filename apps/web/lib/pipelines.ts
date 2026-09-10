import { apiFetch } from "./api-client";

export interface PipelineLatestRun {
  id: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface PipelineListItem {
  id: string;
  name: string;
  serviceName: string;
  serviceSlug: string;
  latestRun: PipelineLatestRun | null;
}

export interface ListPipelinesResult {
  items: PipelineListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListPipelinesParams {
  search?: string;
  service?: string;
  page?: number;
  pageSize?: number;
}

export function listPipelines(params: ListPipelinesParams = {}): Promise<ListPipelinesResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return apiFetch(`/pipelines${queryString ? `?${queryString}` : ""}`);
}

export interface PipelineRunListItem {
  id: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  deploymentId: string | null;
  deploymentVersion: string | null;
  triggeredByName: string | null;
}

export interface PipelineDetail {
  pipeline: { id: string; name: string; serviceName: string; serviceSlug: string };
  runs: { items: PipelineRunListItem[]; total: number; page: number; pageSize: number };
}

export function getPipelineById(
  id: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<PipelineDetail> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const queryString = query.toString();
  return apiFetch(`/pipelines/${id}${queryString ? `?${queryString}` : ""}`);
}

export interface PipelineStageDetail {
  id: string;
  name: string;
  order: number;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  logs: string | null;
}

export interface PipelineRunDetail {
  run: PipelineRunListItem & {
    pipelineId: string;
    pipelineName: string;
    serviceName: string;
    serviceSlug: string;
  };
  stages: PipelineStageDetail[];
}

export function getPipelineRunById(runId: string): Promise<PipelineRunDetail> {
  return apiFetch(`/pipelines/runs/${runId}`);
}
