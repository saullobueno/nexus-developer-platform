import type { Meta, StoryObj } from "@storybook/react-vite";
import { DeploymentStatusBadge } from "./deployment-status-badge";

const meta: Meta<typeof DeploymentStatusBadge> = {
  title: "Components/DeploymentStatusBadge",
  component: DeploymentStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["queued", "running", "successful", "failed", "cancelled", "rolled_back"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DeploymentStatusBadge>;

export const Successful: Story = { args: { status: "successful" } };
export const Failed: Story = { args: { status: "failed" } };
export const RolledBack: Story = { args: { status: "rolled_back" } };
