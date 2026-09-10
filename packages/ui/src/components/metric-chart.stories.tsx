import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricChart } from "./metric-chart";

const meta: Meta<typeof MetricChart> = {
  title: "Components/MetricChart",
  component: MetricChart,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MetricChart>;

const points = Array.from({ length: 24 }, (_, index) => ({
  timestamp: new Date(Date.now() - (23 - index) * 60 * 60 * 1000).toISOString(),
  value: 180 + Math.round(Math.sin(index / 3) * 40),
}));

export const Default: Story = {
  args: { title: "p95 latency", unit: "ms", data: points },
};
