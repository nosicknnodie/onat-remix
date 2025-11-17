import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiNaver } from "react-icons/si";
import { Separator } from "~/components/ui/separator";
import { loginService } from "~/features/auth/server";
import { useToast } from "~/hooks/use-toast";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo");
  const oauthError = url.searchParams.get("oauthError");
  return {
    redirectTo,
    oauthError,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return loginService.handleLogin(request);
};

const Login = () => {
  const loaderData = useLoaderData<typeof loader>();
  const { toast } = useToast();
  useEffect(() => {
    if (loaderData?.oauthError) {
      toast({
        variant: "destructive",
        description: loaderData.oauthError,
      });
    }
  }, [loaderData?.oauthError, toast]);
  const redirectQuery = useMemo(() => {
    const redirectTo = loaderData?.redirectTo;
    if (!redirectTo) return "";
    if (!redirectTo.startsWith("/")) return "";
    if (redirectTo.startsWith("//")) return "";
    return `?redirectTo=${encodeURIComponent(redirectTo)}`;
  }, [loaderData?.redirectTo]);
  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      <div className="space-y-4 rounded-md p-4 text-center">
        <h2 className="text-lg font-semibold">소셜 로그인만 지원합니다</h2>
        <p className="text-sm text-muted-foreground">
          Google 또는 네이버 계정으로 로그인해 주세요.
        </p>
      </div>
      <div className="space-y-2">
        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          <span className="whitespace-nowrap">소셜 로그인</span>
          <Separator className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <LoginSocialButton
            to={`/api/auth/oauth/google${redirectQuery}`}
            label="Google로 계속하기"
            provider="google"
          />
          <LoginSocialButton
            to={`/api/auth/oauth/naver${redirectQuery}`}
            label="네이버로 계속하기"
            provider="naver"
          />
        </div>
      </div>
      {/* <div className="flex justify-end items-center gap-2 text-sm h-4">
        <Link to={"/auth/reset-form"}>비밀번호찾기</Link>
        <Separator orientation="vertical" />
        <Link to={"/auth/register"}>회원가입</Link>
      </div> */}
    </div>
  );
};

export default Login;

interface LoginSocialButtonProps {
  to: string;
  label: string;
  provider: "google" | "naver";
}

const LoginSocialButton = ({ to, label, provider }: LoginSocialButtonProps) => {
  return (
    <Link
      to={to}
      prefetch="none"
      className="flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium transition hover:bg-accent hover:text-accent-foreground"
    >
      <SocialIcon provider={provider} />
      <span>{label}</span>
    </Link>
  );
};

const SocialIcon = ({ provider }: { provider: "google" | "naver" }) => {
  if (provider === "google") {
    return <FcGoogle />;
  }
  return <SiNaver className="text-[#03c75a]" />;
};
