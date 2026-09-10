import type { Meta, StoryObj } from "@storybook/react-vite";
import { IncidentSeverityBadge } from "./incident-severity-badge";

const meta: Meta<typeof IncidentSeverityBadge> = {
  title: "Components/IncidentSeverityBadge",
  component: IncidentSeverityBadge,
  tags: ["autodocs"],
  argTypes: {
    severity: { control: "select", options: ["sev1", "sev2", "sev3", "sev4"] },
  },
};

export default meta;
type Story = StoryObj<typeof IncidentSeverityBadge>;

export const Sev1: Story = { args: { severity: "sev1" } };
export const Sev3: Story = { args: { severity: "sev3" } };
