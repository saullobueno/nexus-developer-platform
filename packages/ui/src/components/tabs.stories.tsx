import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="deployments">Deployments</TabsTrigger>
        <TabsTrigger value="incidents">Incidents</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo de overview.</TabsContent>
      <TabsContent value="deployments">Conteúdo de deployments.</TabsContent>
      <TabsContent value="incidents">Conteúdo de incidents.</TabsContent>
    </Tabs>
  ),
};
