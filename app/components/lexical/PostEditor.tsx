import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
// import { AutoFocusPlugin } from "@lexical/react/LexicalCod";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type { EditorState, LexicalEditor, SerializedEditorState } from "lexical";
import { type ComponentProps, useCallback, useEffect, useState } from "react";
import { cn } from "~/libs/isomorphic";
import { Skeleton } from "../ui/skeleton";
import { nodes } from "./nodes/nodes";
import { CodeHighlightingPlugin } from "./plugins/CodeHighlightPlugin";
import DragDropPaste from "./plugins/DragDropPastePlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import MarkdownPlugin from "./plugins/MarkdownShortcutPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { ActiveEditorProvider, ToolbarContext } from "./plugins/ToolbarPlugin/Context";
import YouTubePlugin from "./plugins/YouTubePlugin";
import "./theme/code-highlight.css";
import { theme } from "./theme/theme";

interface Props {
  initialEditorState?: SerializedEditorState | null;
  placeholder?: string;
  onChange?: (root: SerializedEditorState) => void;
  className?: string;
  onUploadImage?: (file: File) => Promise<{ success: string; url: string }>;
}

function FocusableContentEditable(props: ComponentProps<typeof ContentEditable>) {
  const [editor] = useLexicalComposerContext();
  return (
    <ContentEditable
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        editor.focus();
      }}
    />
  );
}

export function PostEditor({
  onChange,
  initialEditorState,
  className,
  placeholder,
  onUploadImage,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const initialConfig = {
    namespace: "LexicalEditor",
    theme: theme,
    onError: (error: Error) => console.error(error),
    nodes: nodes,
    editorState: (editor: LexicalEditor) => {
      if (initialEditorState) {
        const parsed = editor.parseEditorState(initialEditorState);
        editor.setEditorState(parsed);
      }
    },
  };

  const handleEditorChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      onChange?.(editorState.toJSON());
    },
    [onChange],
  );

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  if (!isMounted) return <Skeleton className="h-[500px] w-full" />;

  return (
    <div className={cn("flex flex-col gap-4 rounded-md", className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <ActiveEditorProvider>
          <ToolbarContext config={{ isEditable: true, isToolbarVisible: true, onUploadImage }}>
            <ToolbarPlugin />
            <div className="relative rounded-md border bg-card p-2 transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50">
              <RichTextPlugin
                contentEditable={
                  <FocusableContentEditable
                    className="min-h-[5rem] w-full focus:outline-none"
                    aria-placeholder={placeholder || "내용을 입력해 주세요."}
                    placeholder={() => null}
                  />
                }
                placeholder={
                  <div className="pointer-events-none text-gray-300 absolute top-2 left-2">
                    {placeholder || "내용을 입력해주세요."}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <AutoFocusPlugin />
              <HistoryPlugin />
              <MarkdownPlugin />
              <ListPlugin />
              <CheckListPlugin />
              <CodeHighlightingPlugin />
              <ImagesPlugin />
              <DragDropPaste />
              <YouTubePlugin />
              <OnChangePlugin onChange={handleEditorChange} />
            </div>
          </ToolbarContext>
        </ActiveEditorProvider>
      </LexicalComposer>
    </div>
  );
}
