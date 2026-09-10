import type { Meta, StoryObj } from "@storybook/react-vite";
import { LogViewer } from "./log-viewer";

const meta: Meta<typeof LogViewer> = {
  title: "Components/LogViewer",
  component: LogViewer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LogViewer>;

export const Empty: Story = { args: { logs: [] } };
export const WithLogs: Story = {
  args: {
    logs: [
      { id: "1", level: "info", message: "Request processada com sucesso", timestamp: new Date().toISOString() },
      { id: "2", level: "warn", message: "Latência acima do esperado", timestamp: new Date().toISOString() },
      { id: "3", level: "error", message: "Falha ao conectar no downstream", timestamp: new Date().toISOString() },
    ],
  },
};
