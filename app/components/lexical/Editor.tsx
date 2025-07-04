import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { $generateHtmlFromNodes } from "@lexical/html";
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
import { $getRoot, EditorState, LexicalEditor } from "lexical";
import { useCallback, useState } from "react";
import { CodeHighlightingPlugin } from "./plugins/CodeHighlightPlugin";
import MarkdownPlugin from "./plugins/MarkdownShortcutPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import {
  ActiveEditorProvider,
  ToolbarContext,
} from "./plugins/ToolbarPlugin/Context";
import TreeViewPlugin from "./plugins/TreeViewPlugin";
import "./theme/code-highlight.css";

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
              <ListPlugin />
              <CheckListPlugin />
              <CodeHighlightingPlugin />
              <TreeViewPlugin />
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
