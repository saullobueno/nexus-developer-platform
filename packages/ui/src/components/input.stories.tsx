import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "voce@empresa.com",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "voce@empresa.com",
    disabled: true,
  },
};
