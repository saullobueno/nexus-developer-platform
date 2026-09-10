import type { Meta, StoryObj } from "@storybook/react-vite";
import { ServiceStatusBadge } from "./service-status-badge";

const meta: Meta<typeof ServiceStatusBadge> = {
  title: "Components/ServiceStatusBadge",
  component: ServiceStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: { control: "select", options: ["healthy", "degraded", "unhealthy", "unknown"] },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceStatusBadge>;

export const Healthy: Story = { args: { status: "healthy" } };
export const Degraded: Story = { args: { status: "degraded" } };
export const Unhealthy: Story = { args: { status: "unhealthy" } };
