import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuditLogsTab } from "./audit-logs-tab";

const useAuditLogsMock = vi.fn();
vi.mock("../../hooks/use-audit-logs", () => ({
  useAuditLogs: (...args: unknown[]) => useAuditLogsMock(...args),
}));

describe("AuditLogsTab", () => {
  it("mostra o estado vazio", () => {
    useAuditLogsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });
    render(<AuditLogsTab />);
    expect(screen.getByText("Nenhum registro de auditoria encontrado.")).toBeInTheDocument();
  });

  it("lista os registros de auditoria", () => {
    useAuditLogsMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            id: "a1",
            action: "deployment.rollback",
            resource: "deployment",
            resourceId: "11111111-2222-3333-4444-555555555555",
            before: null,
            after: null,
            createdAt: new Date().toISOString(),
            actorName: "Admin Demo",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    render(<AuditLogsTab />);

    expect(screen.getByText("deployment.rollback")).toBeInTheDocument();
    expect(screen.getByText("Admin Demo")).toBeInTheDocument();
  });
});
