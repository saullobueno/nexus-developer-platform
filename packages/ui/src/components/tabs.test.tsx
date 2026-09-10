import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
  it("mostra o conteúdo da tab ativa e troca ao clicar", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Conteúdo overview</TabsContent>
        <TabsContent value="incidents">Conteúdo incidents</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Conteúdo overview")).toBeVisible();
    expect(screen.queryByText("Conteúdo incidents")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Incidents" }));

    expect(screen.getByText("Conteúdo incidents")).toBeVisible();
  });
});
