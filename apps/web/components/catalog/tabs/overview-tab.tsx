import { HealthIndicator, type HealthStatus } from "@nexus/ui";
import type { ServiceDetail } from "../../../lib/services";

export function OverviewTab({ detail }: { detail: ServiceDetail }) {
  const { service, team, owners, environments } = detail;
  const production = environments.find((environment) => environment.slug === "production");

  const links = [
    { label: "Repository", url: service.repositoryUrl },
    { label: "Docs", url: service.docsUrl },
    { label: "Runbook", url: service.runbookUrl },
    { label: "Dashboard", url: service.dashboardUrl },
  ].filter((link): link is { label: string; url: string } => !!link.url);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Descrição</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {service.description ?? "Sem descrição."}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd>{service.type}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Lifecycle</dt>
            <dd>{service.lifecycle}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Language</dt>
            <dd>{service.language ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Framework</dt>
            <dd>{service.framework ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Runtime</dt>
            <dd>{service.runtime ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Team</dt>
            <dd>{team?.name ?? "—"}</dd>
          </div>
        </dl>

        {links.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Links</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Saúde (produção)</h3>
          <div className="mt-1">
            <HealthIndicator status={(production?.health as HealthStatus) ?? "unknown"} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Owners</h3>
          {owners.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Nenhum owner cadastrado.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {owners.map((owner) => (
                <li key={owner.id}>
                  {owner.name} <span className="text-muted-foreground">({owner.email})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
