import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";

describe("Dialog", () => {
  it("abre ao clicar no trigger e mostra título/descrição", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Rollback</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar rollback</DialogTitle>
            <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText("Confirmar rollback")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rollback" }));

    expect(screen.getByText("Confirmar rollback")).toBeVisible();
    expect(screen.getByText("Essa ação não pode ser desfeita.")).toBeVisible();
  });
});
