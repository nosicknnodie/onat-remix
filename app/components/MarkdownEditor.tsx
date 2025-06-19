// app/components/MarkdownEditor.tsx
import MarkdownIt from "markdown-it";
import { lazy, Suspense, useEffect, useState } from "react";
import type MdEditorType from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import { Skeleton } from "./ui/skeleton";

interface Props {
  value: string;
  onChange: (text: string) => void;
}
const mdParser = new MarkdownIt();
const MdEditor = lazy(() =>
  import("react-markdown-editor-lite").then((module) => ({
    default: module.default as typeof MdEditorType,
  }))
);
export function MarkdownEditor(props: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <Skeleton className="h-[500px]" />;

  return (
    <Suspense fallback={<Skeleton className="h-[500px]" />}>
      <MdEditor
        value={props.value}
        style={{ height: "500px" }}
        renderHTML={(text: string) => mdParser.render(text)}
        onChange={({ text }: { text: string }) => props.onChange(text)}
        config={{
          view: { menu: true, md: true, html: true },
          shortcuts: true,
          plugins: ["bold", "italic", "link", "image-manager"],
          editorConfig: {
            plugins: [
              {
                name: "image-manager",
                icon: "🖼️",
                title: "내 이미지 삽입",
                action: (editor: any) => {
                  editor.insertText("![](https://example.com/image.png)");
                },
              },
            ],
          },
        }}
      />
    </Suspense>
  );
}
