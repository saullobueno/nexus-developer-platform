import { pgEnum } from "drizzle-orm/pg-core";

export const serviceTypeEnum = pgEnum("service_type", [
  "service",
  "website",
  "library",
  "api",
  "database",
  "worker",
  "infrastructure",
  "ml_model",
]);

export const lifecycleEnum = pgEnum("lifecycle", [
  "experimental",
  "development",
  "production",
  "deprecated",
]);

export const healthStatusEnum = pgEnum("health_status", [
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
]);

export const environmentTypeEnum = pgEnum("environment_type", [
  "production",
  "staging",
  "qa",
  "development",
]);

export const deploymentStatusEnum = pgEnum("deployment_status", [
  "queued",
  "running",
  "successful",
  "failed",
  "cancelled",
  "rolled_back",
]);

export const pipelineStageStatusEnum = pgEnum("pipeline_stage_status", [
  "pending",
  "running",
  "success",
  "failed",
  "skipped",
  "cancelled",
]);

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "sev1",
  "sev2",
  "sev3",
  "sev4",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]);

export const logLevelEnum = pgEnum("log_level", ["debug", "info", "warn", "error", "fatal"]);

export const apiProtocolEnum = pgEnum("api_protocol", ["rest", "graphql", "grpc", "websocket"]);

export const apiStatusEnum = pgEnum("api_status", ["active", "deprecated", "retired"]);

export const documentCategoryEnum = pgEnum("document_category", [
  "getting_started",
  "architecture",
  "services",
  "apis",
  "runbooks",
  "engineering_standards",
]);

export const adrStatusEnum = pgEnum("adr_status", [
  "proposed",
  "accepted",
  "deprecated",
  "superseded",
]);

export const featureFlagTypeEnum = pgEnum("feature_flag_type", [
  "boolean",
  "percentage",
  "user_targeting",
  "org_targeting",
  "rule_based",
]);

export const integrationProviderEnum = pgEnum("integration_provider", [
  "github",
  "sentry",
  "grafana",
  "slack",
  "prometheus",
  "mock",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "slack",
]);

export const aiRunStatusEnum = pgEnum("ai_run_status", [
  "running",
  "completed",
  "failed",
  "requires_approval",
]);

export const aiMessageRoleEnum = pgEnum("ai_message_role", [
  "user",
  "assistant",
  "system",
  "tool",
]);
