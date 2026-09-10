import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthIndicator } from "./health-indicator";

const meta: Meta<typeof HealthIndicator> = {
  title: "Components/HealthIndicator",
  component: HealthIndicator,
  tags: ["autodocs"],
  argTypes: {
    status: { control: "select", options: ["healthy", "degraded", "unhealthy", "unknown"] },
  },
};

export default meta;
type Story = StoryObj<typeof HealthIndicator>;

export const Healthy: Story = { args: { status: "healthy" } };
export const Degraded: Story = { args: { status: "degraded" } };
export const Unhealthy: Story = { args: { status: "unhealthy" } };
