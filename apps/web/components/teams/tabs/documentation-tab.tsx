import Link from "next/link";
import type { TeamDetail } from "../../../lib/teams";

export function DocumentationTab({ detail }: { detail: TeamDetail }) {
  if (detail.documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum documento vinculado aos serviços deste time.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.documents.map((document) => (
        <li key={document.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <Link href={`/docs/${document.slug}`} className="font-medium hover:underline">
            {document.title}
          </Link>
          <span className="text-xs uppercase text-muted-foreground">{document.category}</span>
        </li>
      ))}
    </ul>
  );
}
