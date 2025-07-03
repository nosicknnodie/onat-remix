import { CodeNode } from "@lexical/code";
import { $generateHtmlFromNodes } from "@lexical/html";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode"; // 또는 @lexical/hr 사용
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $getRoot, EditorState, LexicalEditor } from "lexical";
import { useCallback, useState } from "react";
import MarkdownPlugin from "./plugins/MarkdownShortcutPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import {
  ActiveEditorProvider,
  ToolbarContext,
} from "./plugins/ToolbarPlugin/Context";
interface Props {
  onChange?: (html: string) => void;
}

export function Editor({ onChange }: Props) {
  const [html, setHtml] = useState("");
  const [markdown, setMarkdown] = useState("");
  const initialConfig = {
    namespace: "LexicalEditor",
    theme: {
      text: {
        underline: "underline",
        italic: "italic",
        bold: "text-bold",
        strikethrough: "line-through",
      },
      hr: "border-t-2 border-gray-300 my-4",
      heading: {
        h1: "text-3xl font-bold my-2 border-b border-solid border-gray-300",
        h2: "text-2xl font-semibold my-2",
        h3: "text-xl font-medium my-2",
      },
      quote: "pl-4 border-l-4 border-gray-300 italic text-gray-600",
      list: {
        ol: "list-decimal pl-4",
        ul: "list-disc pl-4",
        listitem: "ml-2",
      },
    },
    onError: (error: Error) => console.error(error),
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      HorizontalRuleNode,
      AutoLinkNode,
      LinkNode,
      // ListNode,
      // ListItemNode,
      // CodeNode,
      // AutoLinkNode,
      // LinkNode,
      // HorizontalRuleNode,
      // MarkdownLineNode,
    ],
  };

  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      editorState.read(async () => {
        const editorStateJSON = editorState.toJSON();
        console.log("🧱 Node Map:", editorStateJSON.root);
        const markdownLines = $getRoot().getChildren();
        const markdownContents: string[] = [];

        for (const node of markdownLines) {
          if (
            "getTextContent" in node &&
            typeof node.getTextContent === "function"
          ) {
            markdownContents.push(node.getTextContent());
          } else {
            markdownContents.push("");
          }
        }

        const markdownString = markdownContents.join("\n");
        setMarkdown(markdownString);

        const htmlString = $generateHtmlFromNodes(editor, null);
        setHtml(htmlString);

        onChange?.(markdownString);
      });
    },
    [onChange]
  );
  return (
    <div className="flex flex-col gap-4">
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

              <OnChangePlugin onChange={handleEditorChange} />
            </div>
          </ToolbarContext>
        </ActiveEditorProvider>
      </LexicalComposer>
      <div className="mt-2 min-h-8 text-sm text-gray-500 whitespace-pre-wrap border rounded-md relative p-2">
        <div className="absolute top-0 left-12 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
          Markdown
        </div>
        {markdown}
      </div>
      <div className="mt-2 min-h-8 text-sm text-gray-500 whitespace-pre-wrap border rounded-md relative p-2">
        <div className="absolute top-0 left-12 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
          HTML
        </div>
        {html}
      </div>
    </div>
  );
}
