// src/plugins/CodeHighlightPlugin.tsx (예시 파일 경로)
import { registerCodeHighlighting } from "@lexical/code"; // 이 함수를 사용합니다!
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export function CodeHighlightingPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // 에디터 인스턴스에 코드 하이라이팅 기능을 등록합니다.
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null; // 이 플러그인은 UI를 렌더링하지 않으므로 null을 반환합니다.
}
