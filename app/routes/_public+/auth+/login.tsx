import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useMemo } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiNaver } from "react-icons/si";
import { Separator } from "~/components/ui/separator";
import { login } from "~/features/auth/index.server";
import LoginForm from "~/features/auth/login/ui/LoginForm";
import { useActionToast } from "~/hooks";
import { useToast } from "~/hooks/use-toast";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo");
  const oauthError = url.searchParams.get("oauthError");
  return json({
    redirectTo,
    oauthError,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return login.service.handleLogin(request);
};

const Login = () => {
  const loaderData = useLoaderData<typeof loader>();
  const actions = useActionData<typeof action>();
  useActionToast(actions);
  const navigation = useNavigation();
  const { toast } = useToast();
  useEffect(() => {
    if (loaderData?.oauthError) {
      toast({
        variant: "destructive",
        description: loaderData.oauthError,
      });
    }
  }, [loaderData?.oauthError, toast]);
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  const redirectQuery = useMemo(() => {
    const redirectTo = loaderData?.redirectTo;
    if (!redirectTo) return "";
    if (!redirectTo.startsWith("/")) return "";
    if (redirectTo.startsWith("//")) return "";
    return `?redirectTo=${encodeURIComponent(redirectTo)}`;
  }, [loaderData?.redirectTo]);
  return (
    <div className="max-w-md w-full space-y-4 mt-6">
      <LoginForm
        values={actions?.values}
        errors={actions?.errors}
        success={actions?.success}
        isSubmitting={isSubmitting}
        redirectTo={loaderData?.redirectTo ?? undefined}
      />
      <div className="space-y-2">
        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          <span className="whitespace-nowrap">다른 방식으로 로그인</span>
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
      <div className="flex justify-end items-center gap-2 text-sm h-4">
        <Link to={"/auth/reset-form"}>비밀번호찾기</Link>
        <Separator orientation="vertical" />
        <Link to={"/auth/register"}>회원가입</Link>
      </div>
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
