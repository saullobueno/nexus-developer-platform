import type { TeamDetail } from "../../../lib/teams";

export function MembersTab({ detail }: { detail: TeamDetail }) {
  if (detail.members.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum membro neste time.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {detail.members.map((member) => (
        <li key={member.id} className="px-4 py-3 text-sm">
          <p className="font-medium">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
        </li>
      ))}
    </ul>
  );
}
