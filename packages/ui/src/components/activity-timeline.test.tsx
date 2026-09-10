import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityTimeline } from "./activity-timeline";

describe("ActivityTimeline", () => {
  it("mostra a mensagem de vazio quando não há itens", () => {
    render(<ActivityTimeline items={[]} />);
    expect(screen.getByText("Nenhuma atividade registrada.")).toBeInTheDocument();
  });

  it("lista os itens informados", () => {
    render(
      <ActivityTimeline
        items={[{ id: "1", title: "Deploy realizado", timestamp: new Date().toISOString() }]}
      />,
    );
    expect(screen.getByText("Deploy realizado")).toBeInTheDocument();
  });
});
