import type { Meta, StoryContext, StoryObj } from "@storybook/react";
import TemplateComponent from "~/template/main/Profile";
import { ProfileContext as TemplateContext } from "~/template/main/Profile.context";

const TemplateDecorator = (
  Story: React.ComponentType,
  { args }: StoryContext
) => {
  return (
    <TemplateContext.Provider
      value={args as React.ContextType<typeof TemplateContext>}
    >
      <Story />
    </TemplateContext.Provider>
  );
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Main/Profile",
  component: TemplateComponent,
  decorators: [TemplateDecorator],
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof TemplateComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    nick: "테스트닉네임",
    name: "홍길동",
    playerNative: "NO",
    si: "서울",
    gun: "강남구",
    position1: "ST",
    position2: "CF",
    position3: "CAM",
    imageUrl: null,
  },
};
