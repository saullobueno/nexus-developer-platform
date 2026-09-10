import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogViewer } from "./log-viewer";

describe("LogViewer", () => {
  it("mostra a mensagem de vazio quando não há logs", () => {
    render(<LogViewer logs={[]} />);
    expect(screen.getByText("Nenhum log registrado.")).toBeInTheDocument();
  });

  it("lista os logs informados", () => {
    render(
      <LogViewer
        logs={[
          { id: "1", level: "error", message: "Falha ao conectar", timestamp: new Date().toISOString() },
        ]}
      />,
    );
    expect(screen.getByText("Falha ao conectar")).toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
  });
});
