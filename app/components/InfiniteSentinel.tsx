import { useEffect, useRef, useState } from "react";

type Props = {
  hasMore: boolean;
  onLoadMore: () => Promise<void> | void; // fetcher.load 등 아무거나
  rootMargin?: string; // "200px" 같은 여유
  disabled?: boolean;
  loadingText?: string;
  doneText?: string;
  className?: string;
};

export function InfiniteSentinel({
  hasMore,
  onLoadMore,
  rootMargin = "200px",
  disabled,
  loadingText = "불러오는 중...",
  doneText = "마지막 페이지",
  className,
}: Props) {
  const [busy, setBusy] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disabled) return;
    const node = elRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !busy) {
          try {
            setBusy(true);
            await onLoadMore();
          } finally {
            setBusy(false);
          }
        }
      },
      { root: null, rootMargin, threshold: 0 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, onLoadMore, rootMargin, disabled, busy]);

  return (
    <div ref={elRef} className={className ?? "py-4 text-center text-xs"}>
      {busy
        ? loadingText
        : hasMore
          ? "아래로 스크롤하면 더 불러옵니다"
          : doneText}
    </div>
  );
}
