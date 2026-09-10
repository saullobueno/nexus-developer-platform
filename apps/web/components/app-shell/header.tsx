"use client";

import { Button } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, HelpCircle, Menu, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "../../hooks/use-session";
import { logout } from "../../lib/auth";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.replace("/login");
    },
  });

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Alternar menu lateral"
      >
        <Menu className="size-4" />
      </Button>
      <span className="text-sm font-semibold">Nexus</span>

      <div className="ml-4 flex-1">
        <button
          type="button"
          disabled
          title="Busca global chega em uma fase futura"
          className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="size-4" />
          Buscar
          <kbd className="ml-auto rounded border px-1 text-xs">⌘K</kbd>
        </button>
      </div>

      <Button variant="outline" size="sm" disabled title="Chega em uma fase futura">
        <Plus className="size-4" />
        Create
      </Button>
      <Button variant="ghost" size="icon" disabled title="Notificações — Phase 14 (Realtime)">
        <Bell className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled title="Ajuda">
        <HelpCircle className="size-4" />
      </Button>

      {user && (
        <div className="flex items-center gap-2 pl-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {initials(user.name)}
          </div>
          <div className="hidden text-left text-xs sm:block">
            <p className="font-medium leading-none">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Sair
          </Button>
        </div>
      )}
    </header>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
