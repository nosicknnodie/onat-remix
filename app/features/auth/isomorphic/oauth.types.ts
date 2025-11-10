export type OAuthProvider = "google" | "naver";

export interface OAuthSessionPayload {
  provider: OAuthProvider;
  state: string;
  redirectTo?: string | null;
  createdAt: number;
}

export interface OAuthProfile {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
}
