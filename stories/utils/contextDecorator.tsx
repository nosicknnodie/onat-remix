import type { StoryContext } from "@storybook/react";
import type React from "react";

export function createContextDecorator<T>(Context: React.Context<T>) {
  return function ContextDecorator(
    Story: React.ComponentType,
    { args }: StoryContext
  ) {
    return (
      <Context.Provider
        value={args as T} // 여전히 타입 주의 필요
      >
        <Story />
      </Context.Provider>
    );
  };
}
