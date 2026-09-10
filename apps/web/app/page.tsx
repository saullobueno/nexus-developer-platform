import { Button } from "@nexus/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Nexus Developer Platform</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Foundation em construção — catálogo de serviços, deployments, incidentes, observability e
        AI Copilot chegam nas próximas fases.
      </p>
      <Button>Explorar catálogo</Button>
    </main>
  );
}
