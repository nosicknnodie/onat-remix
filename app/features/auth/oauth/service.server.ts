import { createCookie, redirect } from "@remix-run/node";
import type { User } from "@prisma/client";
import { randomBytes } from "node:crypto";
import type { OAuthProvider, OAuthProfile, OAuthSessionPayload } from "./types";
import * as queries from "./queries.server";
import { service as loginService } from "~/features/auth/login/index.server";

const SECURE_COOKIES = process.env.NODE_ENV === "production";

const oauthSessionCookies = {
  google: createCookie("oauth_google_state", {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE_COOKIES,
    maxAge: 60 * 10,
    path: "/",
  }),
  naver: createCookie("oauth_naver_state", {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE_COOKIES,
    maxAge: 60 * 10,
    path: "/",
  }),
} as const;

type ProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

function getProviderConfig(provider: OAuthProvider): ProviderConfig {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Google OAuth 환경변수가 설정되지 않았습니다.");
    }
    return {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      scope: "openid email profile",
      clientId,
      clientSecret,
      redirectUri,
    } satisfies ProviderConfig;
  }

  const clientId = process.env.NAVER_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NAVER_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.NAVER_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Naver OAuth 환경변수가 설정되지 않았습니다.");
  }
  return {
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    userInfoUrl: "https://openapi.naver.com/v1/nid/me",
    scope: "name,email",
    clientId,
    clientSecret,
    redirectUri,
  } satisfies ProviderConfig;
}

function getCookie(provider: OAuthProvider) {
  return oauthSessionCookies[provider];
}

function generateState() {
  return randomBytes(16).toString("hex");
}

function sanitizeRedirect(redirectTo?: string | null) {
  if (!redirectTo) return null;
  if (!redirectTo.startsWith("/")) return null;
  if (redirectTo.startsWith("//")) return null;
  try {
    const url = new URL(redirectTo, "https://example.com");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch (_error) {
    return null;
  }
}

function buildLoginRedirect(requestUrl: string, message: string) {
  const redirectUrl = new URL("/auth/login", requestUrl);
  redirectUrl.searchParams.set("oauthError", message);
  return redirectUrl;
}

function resolveRedirectPath({
  user,
  storedRedirect,
  isNewUser,
}: {
  user: User;
  storedRedirect: string | null;
  isNewUser: boolean;
}) {
  if (isNewUser) return "/settings/edit";
  if (!user.name) return "/settings/edit";
  return storedRedirect ?? "/";
}

async function clearSessionCookie(provider: OAuthProvider) {
  return getCookie(provider).serialize("", { maxAge: 0 });
}

async function readSessionPayload(provider: OAuthProvider, request: Request) {
  const cookie = getCookie(provider);
  const raw = await cookie.parse(request.headers.get("cookie"));
  if (!raw) return null;
  try {
    const payload = typeof raw === "string" ? JSON.parse(raw) : (raw as OAuthSessionPayload);
    if (!payload || payload.provider !== provider) return null;
    if (Date.now() - payload.createdAt > 10 * 60 * 1000) return null;
    return payload as OAuthSessionPayload;
  } catch (error) {
    console.error("Failed to parse OAuth session payload", error);
    return null;
  }
}

async function storeSessionPayload(provider: OAuthProvider, payload: OAuthSessionPayload) {
  const cookie = getCookie(provider);
  return cookie.serialize(JSON.stringify(payload));
}

async function fetchProfileFromProvider(
  provider: OAuthProvider,
  code: string,
  statePayload: OAuthSessionPayload,
): Promise<OAuthProfile> {
  const config = getProviderConfig(provider);
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  });
  if (provider === "naver") {
    params.set("state", statePayload.state);
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error("OAuth token exchange failed", provider, errorBody);
    throw new Error("토큰 발급에 실패했습니다.");
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    accessToken?: string;
    token_type?: string;
    scope?: string;
    id_token?: string;
  };

  const accessToken = tokenData.access_token ?? tokenData.accessToken;
  if (!accessToken) {
    throw new Error("액세스 토큰을 찾을 수 없습니다.");
  }

  if (provider === "google") {
    const userResponse = await fetch(`${config.userInfoUrl}?alt=json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!userResponse.ok) {
      const body = await userResponse.text();
      console.error("Google userinfo fetch failed", body);
      throw new Error("프로필 정보를 가져오지 못했습니다.");
    }
    const profile = (await userResponse.json()) as {
      id?: string;
      email?: string;
      verified_email?: boolean;
      name?: string;
    };

    if (!profile.id) throw new Error("Google 사용자 식별자를 찾을 수 없습니다.");
    if (!profile.email) throw new Error("Google 계정 이메일 동의가 필요합니다.");

    return {
      providerId: profile.id,
      email: profile.email,
      emailVerified: profile.verified_email ?? false,
      name: profile.name ?? null,
    } satisfies OAuthProfile;
  }

  const userResponse = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    const body = await userResponse.text();
    console.error("Naver userinfo fetch failed", body);
    throw new Error("프로필 정보를 가져오지 못했습니다.");
  }

  const profile = (await userResponse.json()) as {
    resultcode?: string;
    response?: {
      id?: string;
      email?: string;
      name?: string;
    };
  };

  if (profile.resultcode !== "00" || !profile.response) {
    throw new Error("Naver 사용자 정보를 확인할 수 없습니다.");
  }

  const providerId = profile.response.id;
  const email = profile.response.email;
  if (!providerId) throw new Error("Naver 사용자 식별자를 찾을 수 없습니다.");
  if (!email) throw new Error("Naver 계정 이메일 동의가 필요합니다.");

  return {
    providerId,
    email,
    emailVerified: true,
    name: profile.response.name ?? null,
  } satisfies OAuthProfile;
}

async function resolveUserForProfile(provider: OAuthProvider, profile: OAuthProfile) {
  const providerKeyId = `oauth:${provider}:${profile.providerId}`;
  const existingKey = await queries.findKeyById(providerKeyId);
  if (existingKey?.user) {
    if (!existingKey.user.emailVerified && profile.emailVerified) {
      await queries.markUserEmailVerified(existingKey.user.id);
    }
    if (!existingKey.user.name && profile.name) {
      await queries.updateUserName(existingKey.user.id, profile.name);
    }
    return { user: existingKey.user, isNewUser: false } as const;
  }

  const existingUser = await queries.findUserByEmail(profile.email);
  if (existingUser) {
    await queries.createKeyForUser({ providerKeyId, userId: existingUser.id });
    if (!existingUser.emailVerified && profile.emailVerified) {
      await queries.markUserEmailVerified(existingUser.id);
    }
    if (!existingUser.name && profile.name) {
      await queries.updateUserName(existingUser.id, profile.name);
    }
    const key = await queries.findKeyById(providerKeyId);
    if (!key?.user) throw new Error("키 연결에 실패했습니다.");
    return { user: key.user, isNewUser: false } as const;
  }

  const createdUser = await queries.createUserWithKey({
    providerKeyId,
    email: profile.email,
    name: profile.name,
    emailVerified: profile.emailVerified,
  });

  if (!createdUser) throw new Error("사용자 생성을 실패했습니다.");
  return { user: createdUser, isNewUser: true } as const;
}

export async function startAuthorization(provider: OAuthProvider, request: Request) {
  const config = getProviderConfig(provider);
  const url = new URL(request.url);
  const redirectTo = sanitizeRedirect(url.searchParams.get("redirectTo"));
  const state = generateState();

  const authorizationUrl = new URL(config.authorizeUrl);
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set("state", state);

  if (provider === "google") {
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("prompt", "select_account");
  }

  const sessionPayload: OAuthSessionPayload = {
    provider,
    state,
    redirectTo,
    createdAt: Date.now(),
  };

  const headers = new Headers();
  headers.append("Set-Cookie", await storeSessionPayload(provider, sessionPayload));

  return redirect(authorizationUrl.toString(), { headers });
}

export async function handleCallback(provider: OAuthProvider, request: Request) {
  const url = new URL(request.url);
  const errorParam = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  const headers = new Headers();
  headers.append("Set-Cookie", await clearSessionCookie(provider));

  if (errorParam) {
    const message = errorParam === "access_denied" ? "동의가 취소되었습니다." : "OAuth 오류가 발생했습니다.";
    return redirect(buildLoginRedirect(request.url, message).toString(), { headers });
  }

  if (!code || !stateParam) {
    return redirect(buildLoginRedirect(request.url, "잘못된 요청입니다.").toString(), { headers });
  }

  const sessionPayload = await readSessionPayload(provider, request);
  if (!sessionPayload) {
    return redirect(buildLoginRedirect(request.url, "세션이 만료되었습니다. 다시 시도해주세요.").toString(), {
      headers,
    });
  }

  if (sessionPayload.state !== stateParam) {
    return redirect(buildLoginRedirect(request.url, "상태 검증에 실패했습니다.").toString(), { headers });
  }

  try {
    const profile = await fetchProfileFromProvider(provider, code, sessionPayload);
    const { user, isNewUser } = await resolveUserForProfile(provider, profile);

    const { sessionCookie } = await loginService.createSessionAndCleanup(user.id, user.id);
    headers.append("Set-Cookie", sessionCookie.serialize());

    const targetPath = resolveRedirectPath({
      user,
      storedRedirect: sessionPayload.redirectTo ?? null,
      isNewUser,
    });

    return redirect(targetPath, { headers });
  } catch (error) {
    console.error(`${provider} OAuth callback failed`, error);
    return redirect(buildLoginRedirect(request.url, "로그인에 실패했습니다.").toString(), { headers });
  }
}
