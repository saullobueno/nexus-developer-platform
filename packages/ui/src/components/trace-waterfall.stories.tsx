import type { Meta, StoryObj } from "@storybook/react-vite";
import { TraceWaterfall } from "./trace-waterfall";

const meta: Meta<typeof TraceWaterfall> = {
  title: "Components/TraceWaterfall",
  component: TraceWaterfall,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TraceWaterfall>;

const now = new Date();

export const CrossService: Story = {
  args: {
    spans: [
      { id: "1", name: "POST /checkout", serviceName: "checkout-web", startedAt: now.toISOString(), durationMs: 480 },
      {
        id: "2",
        name: "call customer-api",
        serviceName: "customer-api",
        startedAt: new Date(now.getTime() + 160).toISOString(),
        durationMs: 160,
      },
      {
        id: "3",
        name: "call payments-api",
        serviceName: "payments-api",
        startedAt: new Date(now.getTime() + 320).toISOString(),
        durationMs: 160,
      },
    ],
  },
};
