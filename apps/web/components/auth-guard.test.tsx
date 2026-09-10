import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthGuard } from "./auth-guard";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const useSessionMock = vi.fn();
vi.mock("../hooks/use-session", () => ({
  useSession: () => useSessionMock(),
}));

describe("AuthGuard", () => {
  it("mostra um loading state enquanto a sessão carrega", () => {
    useSessionMock.mockReturnValue({ isLoading: true, isAuthenticated: false });
    render(
      <AuthGuard>
        <p>conteúdo protegido</p>
      </AuthGuard>,
    );
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("redireciona para /login quando não autenticado", () => {
    useSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false });
    render(
      <AuthGuard>
        <p>conteúdo protegido</p>
      </AuthGuard>,
    );
    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("conteúdo protegido")).not.toBeInTheDocument();
  });

  it("renderiza os filhos quando autenticado", () => {
    useSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: true });
    render(
      <AuthGuard>
        <p>conteúdo protegido</p>
      </AuthGuard>,
    );
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  });
});
