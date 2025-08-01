import { SerializedEditorState } from "lexical";
import { useEffect, useState } from "react";

// 프리뷰 컴포넌트 (editorState JSON을 받아 최대 6줄 분량의 텍스트를 줄바꿈 없이 간단하게 보여줌)
interface PreviewProps {
  editorState?: SerializedEditorState | null;
  maxLines?: number;
}

export function Preview({ editorState, maxLines = 6 }: PreviewProps) {
  const [previewText, setPreviewText] = useState("");

  useEffect(() => {
    if (!editorState) return;

    try {
      const rawText = extractTextFromEditorState(editorState);
      const trimmed = rawText.replace(/\n/g, " ").trim(); // 줄바꿈 제거
      const lines = trimmed.split(" ").slice(0, maxLines * 10); // 대략적으로 자르기
      setPreviewText(lines.join(" "));
    } catch (e) {
      console.error("Failed to render preview", e);
    }
  }, [editorState, maxLines]);

  return (
    <div className="text-sm text-gray-800 line-clamp-6 overflow-hidden">
      {previewText}
    </div>
  );
}

// 간단한 raw JSON에서 텍스트 추출 로직
function extractTextFromEditorState(state: SerializedEditorState): string {
  const children = (state.root?.children ?? []) as any[];
  return children
    .map((child) => {
      if (child.children && Array.isArray(child.children)) {
        return child.children.map((c: any) => c.text ?? "").join(" ");
      }
      return "";
    })
    .join(" ")
    .trim();
}
