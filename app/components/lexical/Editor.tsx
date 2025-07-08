import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
// import { AutoFocusPlugin } from "@lexical/react/LexicalCod";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode"; // 또는 @lexical/hr 사용
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { EditorState, LexicalEditor, SerializedEditorState } from "lexical";
import { useCallback, useEffect, useState } from "react";
import { cn } from "~/libs/utils";
import { Skeleton } from "../ui/skeleton";
import { CodeHighlightingPlugin } from "./plugins/CodeHighlightPlugin";
import MarkdownPlugin from "./plugins/MarkdownShortcutPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import {
  ActiveEditorProvider,
  ToolbarContext,
} from "./plugins/ToolbarPlugin/Context";
import "./theme/code-highlight.css";

interface Props {
  initialEditorState?: SerializedEditorState | null;
  onChange?: (root: SerializedEditorState) => void;
  className?: string;
}

export function Editor({ onChange, initialEditorState, className }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const initialConfig = {
    namespace: "LexicalEditor",
    theme: {
      text: {
        underline: "underline",
        italic: "italic",
        bold: "text-bold",
        strikethrough: "line-through",
        code: "editor-text-code",
      },
      hr: "border-t-2 border-gray-300 my-4",
      heading: {
        h1: "text-3xl font-bold my-2 border-b border-solid border-gray-300",
        h2: "text-2xl font-semibold my-2",
        h3: "text-xl font-medium my-2",
      },
      quote: "pl-4 border-l-4 border-gray-300 italic text-gray-600",
      list: {
        checklist: "relative mx-2 px-6 list-none outline-none block min-h-6 ",
        listitem: "relative",
        listitemUnchecked:
          "before:content-[''] outline-none before:absolute before:top-1/2 before:left-0 before:w-4 before:h-4 before:-translate-y-1/2 before:border before:border-gray-400 before:rounded before:bg-white",
        listitemChecked:
          "before:content-['✔'] outline-none line-through before:text-white before:text-xs before:flex before:items-center before:justify-center before:absolute before:top-1/2 before:left-0 before:w-4 before:h-4 before:-translate-y-1/2 before:bg-blue-600 before:border before:border-blue-600 before:rounded",
        nested: {
          listitem: "list-none",
        },
        ol: "list-decimal list-outside p-0 m-0",
        ul: "list-disc list-outside p-0 m-0",
      },
      code: "editor-code",
      codeHighlight: {
        atrule: "editor-tokenAttr",
        attr: "editor-tokenAttr",
        boolean: "editor-tokenProperty",
        builtin: "editor-tokenSelector",
        cdata: "editor-tokenComment",
        char: "editor-tokenSelector",
        class: "editor-tokenFunction",
        "class-name": "editor-tokenFunction",
        comment: "editor-tokenComment",
        constant: "editor-tokenProperty",
        deleted: "editor-tokenProperty",
        doctype: "editor-tokenComment",
        entity: "editor-tokenOperator",
        function: "editor-tokenFunction",
        important: "editor-tokenVariable",
        inserted: "editor-tokenSelector",
        keyword: "editor-tokenAttr",
        namespace: "editor-tokenVariable",
        number: "editor-tokenProperty",
        operator: "editor-tokenOperator",
        prolog: "editor-tokenComment",
        property: "editor-tokenProperty",
        punctuation: "editor-tokenPunctuation",
        regex: "editor-tokenVariable",
        selector: "editor-tokenSelector",
        string: "editor-tokenSelector",
        symbol: "editor-tokenProperty",
        tag: "editor-tokenProperty",
        url: "editor-tokenOperator",
        variable: "editor-tokenVariable",
      },
    },
    onError: (error: Error) => console.error(error),
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      HorizontalRuleNode,
      AutoLinkNode,
      LinkNode,
    ],
    editorState: (editor: LexicalEditor) => {
      if (initialEditorState) {
        const parsed = editor.parseEditorState(initialEditorState);
        editor.setEditorState(parsed);
      }
    },
  };

  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
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
          <ToolbarContext>
            <ToolbarPlugin />
            <div className="relative  p-2">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="min-h-[10rem] w-full focus:outline-none"
                    aria-placeholder="내용을 입력해 주세요."
                    placeholder={(isEditable: boolean) => (
                      <div className="text-gray-300 absolute top-2 left-2">
                        내용을 입력해주세요.
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
              {/* <TreeViewPlugin /> */}
              <OnChangePlugin onChange={handleEditorChange} />
            </div>
          </ToolbarContext>
        </ActiveEditorProvider>
      </LexicalComposer>
    </div>
  );
}
