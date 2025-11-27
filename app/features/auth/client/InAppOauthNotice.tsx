import { useEffect, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaLink } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/hooks/use-toast";

const KAKAO_INAPP_REGEX = /KAKAOTALK|KAKAOBROWSER/i;

export const useIsInAppBrowser = () => {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    setIsInApp(KAKAO_INAPP_REGEX.test(ua));
  }, []);

  return isInApp;
};

const buildAndroidIntent = (url: string) => {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(":", "") || "https";
    const hostAndPath = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
    return `intent://${hostAndPath}#Intent;scheme=${scheme};package=com.android.chrome;end`;
  } catch {
    return "";
  }
};

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

type Props = {
  message?: string;
};

export const InAppOauthNotice = ({ message }: Props) => {
  const isInApp = useIsInAppBrowser();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const currentUrl = useMemo(() => (typeof window !== "undefined" ? window.location.href : ""), []);

  if (!isInApp) return null;

  const handleOpenExternal = () => {
    if (!currentUrl) return;
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      const intent = buildAndroidIntent(currentUrl);
      if (intent) {
        window.location.href = intent;
        return;
      }
    }
    if (isIOS()) {
      const newTab = window.open(currentUrl, "_blank", "noopener,noreferrer");
      if (!newTab) {
        alert("외부 브라우저가 열리지 않으면 링크를 복사해 사파리에서 붙여넣어 주세요.");
      }
      return;
    }
    window.location.href = currentUrl;
  };

  const handleCopy = async () => {
    if (!currentUrl) return;
    if (!navigator.clipboard) {
      toast({
        variant: "destructive",
        description: "클립보드 접근이 불가합니다. 직접 복사해 주세요.",
      });
      return;
    }
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({
      description: "링크가 복사되었어요. 외부 브라우저에서 열어주세요.",
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
      <div className="font-semibold text-primary">인앱 브라우저에서는 소셜 로그인이 안 돼요</div>
      <p className="text-muted-foreground text-xs sm:text-sm">
        {message ??
          "카카오 인앱 브라우저에서는 Google, 네이버 등 모든 OAuth 로그인이 차단됩니다. 외부 브라우저에서 다시 열어주세요."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="w-full sm:w-auto" onClick={handleOpenExternal}>
          <FaExternalLinkAlt className="mr-2 h-4 w-4" />
          외부 브라우저로 열기
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" onClick={handleCopy}>
          <FaLink className="mr-2 h-4 w-4" />
          링크 복사{copied ? " 완료" : ""}
        </Button>
      </div>
      <Separator />
      <div className="text-xs text-muted-foreground">
        카카오톡 · 네이버 인앱이면 오른쪽 상단 메뉴에서 외부 브라우저로 열기 후 다시 시도해주세요.
        iOS에서는 새 창이 열리지 않으면 링크를 복사해 사파리에서 붙여넣어주세요.
      </div>
    </div>
  );
};
