import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./toast";

const meta: Meta<typeof Toast> = {
  title: "Components/Toast",
  component: Toast,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  args: { title: "Deployment concluído", description: "payments-api v1.4.0" },
};
export const Destructive: Story = {
  args: { title: "Deployment falhou", description: "checkout-web v2.1.0", variant: "destructive" },
};
