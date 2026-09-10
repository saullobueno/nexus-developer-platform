export interface ParsedLogQuery {
  level?: string;
  service?: string;
  traceId?: string;
}

const KNOWN_KEYS: Record<string, keyof ParsedLogQuery> = {
  level: "level",
  service: "service",
  trace: "traceId",
};

export function parseLogQuery(query: string): ParsedLogQuery {
  const filters: ParsedLogQuery = {};

  for (const token of query.trim().split(/\s+/).filter(Boolean)) {
    const separatorIndex = token.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = token.slice(0, separatorIndex);
    const value = token.slice(separatorIndex + 1);
    const filterKey = KNOWN_KEYS[key];
    if (filterKey && value) {
      filters[filterKey] = value;
    }
  }

  return filters;
}
