"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@nexus/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "../../lib/api-client";
import { login } from "../../lib/auth";

const loginFormSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const DEMO_LOGIN_VALUES: LoginFormValues = {
  email: "admin@acme.test",
  password: "demo1234",
};

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: DEMO_LOGIN_VALUES,
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values.email, values.password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.replace("/");
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Nexus Developer Platform</h1>
          <p className="text-sm text-muted-foreground">Entre com sua conta para continuar</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        >
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {loginMutation.isError && (
            <p className="text-sm text-destructive">
              {loginMutation.error instanceof ApiError
                ? "E-mail ou senha inválidos."
                : "Não foi possível entrar. Tente novamente."}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Demo: admin@acme.test / demo1234
        </p>
      </div>
    </main>
  );
}
