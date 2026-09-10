"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cancelDeployment, retryDeployment, rollbackDeployment } from "../../lib/deployments";

interface DeploymentActionsProps {
  deploymentId: string;
  status: string;
  serviceName: string;
  version: string;
}

type ActionKind = "cancel" | "retry" | "rollback";

export function DeploymentActions({
  deploymentId,
  status,
  serviceName,
  version,
}: DeploymentActionsProps) {
  const queryClient = useQueryClient();
  const [openAction, setOpenAction] = useState<ActionKind | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["deployments"] });

  const cancelMutation = useMutation({
    mutationFn: () => cancelDeployment(deploymentId),
    onSuccess: async () => {
      await invalidate();
      setOpenAction(null);
    },
  });
  const retryMutation = useMutation({
    mutationFn: () => retryDeployment(deploymentId),
    onSuccess: async () => {
      await invalidate();
      setOpenAction(null);
    },
  });
  const rollbackMutation = useMutation({
    mutationFn: () => rollbackDeployment(deploymentId),
    onSuccess: async () => {
      await invalidate();
      setOpenAction(null);
    },
  });

  const canCancel = status === "queued" || status === "running";
  const canRetry = status === "failed";
  const canRollback = status === "successful";

  return (
    <div className="flex flex-wrap gap-2">
      {canCancel && (
        <Dialog
          open={openAction === "cancel"}
          onOpenChange={(open) => setOpenAction(open ? "cancel" : null)}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar deployment</DialogTitle>
              <DialogDescription>
                Isso vai interromper o deployment de {serviceName} v{version} em andamento.
              </DialogDescription>
            </DialogHeader>
            {cancelMutation.isError && (
              <p className="text-sm text-destructive">Não foi possível cancelar.</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAction(null)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {canRetry && (
        <Dialog
          open={openAction === "retry"}
          onOpenChange={(open) => setOpenAction(open ? "retry" : null)}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Retry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refazer deployment</DialogTitle>
              <DialogDescription>
                Vai criar uma nova tentativa de deploy de {serviceName} v{version}.
              </DialogDescription>
            </DialogHeader>
            {retryMutation.isError && (
              <p className="text-sm text-destructive">Não foi possível refazer o deployment.</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAction(null)}>
                Voltar
              </Button>
              <Button onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending}>
                {retryMutation.isPending ? "Enviando..." : "Confirmar retry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {canRollback && (
        <Dialog
          open={openAction === "rollback"}
          onOpenChange={(open) => setOpenAction(open ? "rollback" : null)}
        >
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Rollback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar rollback</DialogTitle>
              <DialogDescription>
                Isso vai reverter {serviceName} para a versão anterior bem-sucedida. Fica
                registrado no audit log.
              </DialogDescription>
            </DialogHeader>
            {rollbackMutation.isError && (
              <p className="text-sm text-destructive">Não foi possível fazer rollback.</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAction(null)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={() => rollbackMutation.mutate()}
                disabled={rollbackMutation.isPending}
              >
                {rollbackMutation.isPending ? "Revertendo..." : "Confirmar rollback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
