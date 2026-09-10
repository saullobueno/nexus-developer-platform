import { ServiceDependencyGraph } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

export function DependenciesTab({ detail }: { detail: ServiceDetail }) {
  return (
    <ServiceDependencyGraph
      service={detail.service.name}
      dependencies={detail.dependencies}
      dependents={detail.dependents}
    />
  );
}
