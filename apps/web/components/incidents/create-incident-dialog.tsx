"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useServices } from "../../hooks/use-services";
import { createIncident } from "../../lib/incidents";

const createIncidentFormSchema = z.object({
  title: z.string().trim().min(1, "Informe um título"),
  summary: z.string().trim().optional(),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
});

type CreateIncidentFormValues = z.infer<typeof createIncidentFormSchema>;

export function CreateIncidentDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: servicesResult } = useServices({ pageSize: 100 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateIncidentFormValues>({
    resolver: zodResolver(createIncidentFormSchema),
    defaultValues: { severity: "sev3", serviceIds: [] },
  });

  const mutation = useMutation({
    mutationFn: createIncident,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
      reset();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New Incident</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar incidente</DialogTitle>
          <DialogDescription>
            Registra um novo incidente e inicia a timeline de investigação.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-1">
            <label htmlFor="incident-title" className="text-sm font-medium">
              Título
            </label>
            <Input id="incident-title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="incident-severity" className="text-sm font-medium">
              Severity
            </label>
            <select
              id="incident-severity"
              {...register("severity")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="sev1">SEV1</option>
              <option value="sev2">SEV2</option>
              <option value="sev3">SEV3</option>
              <option value="sev4">SEV4</option>
            </select>
          </div>

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Serviços afetados</legend>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
              {servicesResult?.items.map((service) => (
                <label key={service.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={service.id} {...register("serviceIds")} />
                  {service.name}
                </label>
              ))}
            </div>
            {errors.serviceIds && (
              <p className="text-sm text-destructive">{errors.serviceIds.message}</p>
            )}
          </fieldset>

          {mutation.isError && (
            <p className="text-sm text-destructive">Não foi possível criar o incidente.</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar incidente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
