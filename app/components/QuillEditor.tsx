import Quill from "quill";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import { useEffect, useRef } from "react";
interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("quill").then((Quill) => {
      if (editorRef.current && !quillRef.current) {
        const instance = new Quill.default(editorRef.current, {
          theme: "snow",
          placeholder: "내용을 입력하세요...",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image"],
            ],
          },
        });

        instance.root.innerHTML = value;

        instance.on("text-change", () => {
          const html = instance.root.innerHTML;
          onChange(html);
        });

        quillRef.current = instance;
      }
    });
  }, []);

  return (
    <div className="min-h-[300px] max-h-[500px] overflow-y-auto border border-gray-300 rounded">
      <div ref={editorRef} className="h-full min-h-[300px]" />
    </div>
  );
};
