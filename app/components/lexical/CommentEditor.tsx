import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
// import { AutoFocusPlugin } from "@lexical/react/LexicalCod";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { EditorState, LexicalEditor, SerializedEditorState } from "lexical";
import { useCallback, useEffect, useState } from "react";
import { cn } from "~/libs/utils";
import { Skeleton } from "../ui/skeleton";
import { nodes } from "./nodes/nodes";
import { CodeHighlightingPlugin } from "./plugins/CodeHighlightPlugin";
import DragDropPaste from "./plugins/DragDropPastePlugin";
import FooterToolbarPlugin from "./plugins/FooterToolbarPlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import MarkdownPlugin from "./plugins/MarkdownShortcutPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import {
  ActiveEditorProvider,
  ToolbarContext,
} from "./plugins/ToolbarPlugin/Context";
import YouTubePlugin from "./plugins/YouTubePlugin";
import "./theme/code-highlight.css";
import { theme } from "./theme/theme";

interface Props {
  initialEditorState?: SerializedEditorState | null;
  placeholder?: string;
  onChange?: (root: SerializedEditorState) => void;
  className?: string;
  onCancel?: () => void;
  onSubmit?: (root?: SerializedEditorState, editor?: LexicalEditor) => void;
  isSubmitting?: boolean;
  onUploadImage?: (file: File) => Promise<{ success: string; url: string }>;
}

export function CommentEditor({
  onChange,
  initialEditorState,
  className,
  placeholder,
  onCancel,
  onSubmit,
  isSubmitting,
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
    (editorState: EditorState) => {
      onChange?.(editorState.toJSON());
    },
    [onChange]
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
          <ToolbarContext
            config={{ isToolbarVisible: false, isSubmitting, onUploadImage }}
          >
            <ToolbarPlugin />
            <div className="relative  p-2">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="min-h-[5rem] w-full focus:outline-none"
                    aria-placeholder={placeholder || "내용을 입력해 주세요."}
                    placeholder={(_isEditable: boolean) => (
                      <div className="text-gray-300 absolute top-2 left-2">
                        {placeholder || "내용을 입력해주세요."}
                      </div>
                    )}
                  />
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
              <FooterToolbarPlugin onCancel={onCancel} onSubmit={onSubmit} />
              <OnChangePlugin onChange={handleEditorChange} />
            </div>
          </ToolbarContext>
        </ActiveEditorProvider>
      </LexicalComposer>
    </div>
  );
}
