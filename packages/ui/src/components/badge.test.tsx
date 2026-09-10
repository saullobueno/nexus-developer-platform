import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renderiza o texto informado", () => {
    render(<Badge>Healthy</Badge>);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("aplica a variante solicitada", () => {
    render(<Badge variant="destructive">Failed</Badge>);
    expect(screen.getByText("Failed")).toHaveClass("bg-destructive");
  });
});
