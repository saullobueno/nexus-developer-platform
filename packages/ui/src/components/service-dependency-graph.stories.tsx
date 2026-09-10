import type { Meta, StoryObj } from "@storybook/react-vite";
import { ServiceDependencyGraph } from "./service-dependency-graph";

const meta: Meta<typeof ServiceDependencyGraph> = {
  title: "Components/ServiceDependencyGraph",
  component: ServiceDependencyGraph,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ServiceDependencyGraph>;

export const Empty: Story = { args: { service: "payments-api", dependencies: [] } };
export const WithDependencies: Story = {
  args: {
    service: "payments-api",
    dependents: [{ id: "1", name: "checkout-web" }],
    dependencies: [
      { id: "2", name: "PostgreSQL", isExternal: true },
      { id: "3", name: "Stripe", isExternal: true },
    ],
  },
};
