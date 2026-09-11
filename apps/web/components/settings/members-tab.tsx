"use client";

import { Button } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMembers } from "../../hooks/use-members";
import { updateMemberRole, type Member } from "../../lib/settings";

const ROLE_OPTIONS = ["admin", "platform-engineer", "tech-lead", "developer", "viewer"];

function MemberRow({ member }: { member: Member }) {
  const queryClient = useQueryClient();
  const currentRole = member.roles[0]?.slug ?? "";

  const mutation = useMutation({
    mutationFn: (roleSlug: string) => updateMemberRole(member.id, roleSlug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "members"] });
    },
  });

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium">{member.name}</p>
        <p className="text-xs text-muted-foreground">{member.email}</p>
      </td>
      <td className="px-4 py-3">
        <select
          aria-label={`Role de ${member.name}`}
          value={currentRole}
          onChange={(event) => mutation.mutate(event.target.value)}
          disabled={mutation.isPending}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Sem role
          </option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

export function MembersTab() {
  const { data, isLoading, isError, refetch } = useMembers();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Carregando membros...
      </p>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm">
        <p className="text-destructive">Não foi possível carregar os membros.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">Member</th>
          <th className="px-4 py-2 font-medium text-muted-foreground">Role</th>
        </tr>
      </thead>
      <tbody>
        {data.map((member) => (
          <MemberRow key={member.id} member={member} />
        ))}
      </tbody>
    </table>
  );
}
