import type { Meta, StoryObj } from "@storybook/react-vite";
import { PipelineTimeline } from "./pipeline-timeline";

const meta: Meta<typeof PipelineTimeline> = {
  title: "Components/PipelineTimeline",
  component: PipelineTimeline,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PipelineTimeline>;

export const Successful: Story = {
  args: {
    stages: [
      { id: "1", name: "Build", order: 0, status: "success" },
      { id: "2", name: "Unit Tests", order: 1, status: "success" },
      { id: "3", name: "Integration Tests", order: 2, status: "success" },
      { id: "4", name: "Security", order: 3, status: "success" },
      { id: "5", name: "Deploy", order: 4, status: "success" },
    ],
  },
};

export const Failed: Story = {
  args: {
    stages: [
      { id: "1", name: "Build", order: 0, status: "success" },
      { id: "2", name: "Unit Tests", order: 1, status: "failed" },
      { id: "3", name: "Integration Tests", order: 2, status: "skipped" },
      { id: "4", name: "Security", order: 3, status: "skipped" },
      { id: "5", name: "Deploy", order: 4, status: "skipped" },
    ],
  },
};

export const Empty: Story = { args: { stages: [] } };
