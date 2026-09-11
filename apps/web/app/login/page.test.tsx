import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const loginMock = vi.fn();
vi.mock("../../lib/auth", () => ({
  login: (email: string, password: string) => loginMock(email, password),
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("LoginPage", () => {
  it("mostra erros de validação para campos inválidos", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<LoginPage />);

    await user.clear(screen.getByLabelText("E-mail"));
    await user.clear(screen.getByLabelText("Senha"));
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe um e-mail válido")).toBeInTheDocument();
    expect(await screen.findByText("Informe a senha")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("chama login com email e senha válidos", async () => {
    loginMock.mockResolvedValue({
      user: { id: "1", organizationId: "org-1", email: "admin@acme.test", name: "Admin" },
    });
    const user = userEvent.setup();
    renderWithQueryClient(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(loginMock).toHaveBeenCalledWith("admin@acme.test", "demo1234");
  });
});
