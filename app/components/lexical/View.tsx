import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type { LexicalEditor, SerializedEditorState } from "lexical";
import { cn } from "~/libs/isomorphic";
import { nodes } from "./nodes/nodes";
import { theme } from "./theme/theme";

interface ViewProps {
  editorState: SerializedEditorState;
  className?: string;
}

export function View({ editorState, className }: ViewProps) {
  const initialConfig = {
    namespace: "LexicalViewer",
    editable: false,
    theme: theme,
    editorState: (editor: LexicalEditor) => {
      const parsed = editor.parseEditorState(editorState);
      editor.setEditorState(parsed);
    },
    onError: (error: Error) => {
      console.error("Lexical view rendering error", error);
    },
    nodes: nodes,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable className={cn("w-full min-h-[4rem] text-sm text-gray-900", className)} />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}
