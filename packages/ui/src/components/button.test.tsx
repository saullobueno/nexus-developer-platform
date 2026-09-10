import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renderiza o texto informado", () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole("button", { name: "Clique aqui" })).toBeInTheDocument();
  });

  it("dispara onClick ao ser clicado", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Enviar</Button>);
    screen.getByRole("button").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("aplica a variante solicitada", () => {
    render(<Button variant="destructive">Excluir</Button>);
    expect(screen.getByRole("button", { name: "Excluir" })).toHaveClass("bg-destructive");
  });
});
