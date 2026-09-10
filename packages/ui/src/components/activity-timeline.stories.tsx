import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActivityTimeline } from "./activity-timeline";

const meta: Meta<typeof ActivityTimeline> = {
  title: "Components/ActivityTimeline",
  component: ActivityTimeline,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ActivityTimeline>;

export const Empty: Story = { args: { items: [] } };
export const WithItems: Story = {
  args: {
    items: [
      {
        id: "1",
        title: "Deploy v1.4.0 concluído",
        description: "payments-api · production",
        timestamp: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Incidente SEV2 detectado",
        description: "Latência elevada",
        timestamp: new Date(Date.now() - 3_600_000).toISOString(),
      },
    ],
  },
};
