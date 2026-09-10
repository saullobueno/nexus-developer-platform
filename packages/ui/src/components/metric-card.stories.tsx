import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricCard } from "./metric-card";

const meta: Meta<typeof MetricCard> = {
  title: "Components/MetricCard",
  component: MetricCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MetricCard>;

export const Default: Story = { args: { label: "p95 latency", value: 220, unit: "ms" } };
export const WithHelpText: Story = {
  args: { label: "Error rate", value: "0.4", unit: "%", helpText: "últimas 24h" },
};
