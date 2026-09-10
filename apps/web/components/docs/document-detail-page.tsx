"use client";

import { Button } from "@nexus/ui";
import Link from "next/link";
import Markdown from "react-markdown";
import { useDocumentDetail } from "../../hooks/use-document-detail";

export function DocumentDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } = useDocumentDetail(slug);

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground" role="status">
        Carregando documento...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 p-8 text-sm">
        <p className="text-destructive">Não foi possível carregar este documento.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <nav className="text-xs text-muted-foreground">
          <Link href="/docs" className="hover:underline">
            Documentation
          </Link>{" "}
          / {data.document.title}
        </nav>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.document.title}</h1>
        <p className="text-xs text-muted-foreground">
          {data.author && <>Por {data.author.name} · </>}
          {data.service && (
            <>
              Serviço:{" "}
              <Link href={`/catalog/services/${data.service.slug}`} className="hover:underline">
                {data.service.name}
              </Link>{" "}
              ·{" "}
            </>
          )}
          Atualizado em {new Date(data.document.updatedAt).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <article
        className={[
          "space-y-3 rounded-lg border p-6 text-sm leading-relaxed",
          "[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight",
          "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight",
          "[&_h3]:text-base [&_h3]:font-medium",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1",
        ].join(" ")}
      >
        <Markdown>{data.document.content}</Markdown>
      </article>
    </div>
  );
}
